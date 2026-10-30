// Lazy-loaded so bundlers without mediasoup-client installed (e.g. the Base44
// preview build) don't fail static analysis. At runtime (VPS) the dynamic
// import resolves against the real package.
var _mediasoupClient = null;
async function _getMediasoupClient() {
  if (!_mediasoupClient) {
    _mediasoupClient = await import(/* @vite-ignore */ 'mediasoup-client');
  }
  return _mediasoupClient;
}

class SeeWhyRTC {
  constructor() {
    this.device = null;
    this.socket = null;
    this.roomId = null;
    this.userId = null;
    this.role = null;
    this.sendTransport = null;
    this.recvTransport = null;
    this.producers = {};
    this.consumers = {};
    this.listeners = {};
    this.statsInterval = null;
    this._connecting = false;
  }

  async connect(socket, roomId, userId, role) {
    if (this._connecting) return;
    this._connecting = true;
    try {
      if (this.statsInterval) { clearInterval(this.statsInterval); this.statsInterval = null; }
      Object.values(this.producers).forEach(function(p) { p.close(); });
      Object.values(this.consumers).forEach(function(c) { c.close(); });
      if (this.sendTransport) { this.sendTransport.close(); this.sendTransport = null; }
      if (this.recvTransport) { this.recvTransport.close(); this.recvTransport = null; }
      this.producers = {};
      this.consumers = {};
      this.socket = socket;
      this.roomId = roomId;
      this.userId = userId;
      this.role = role;
      var mediasoupClient = await _getMediasoupClient();
      this.device = new mediasoupClient.Device();

      var rtpCapabilities = await new Promise(function(resolve, reject) {
        socket.emit('get-rtp-capabilities', { roomId: roomId }, function(data) {
          if (data && data.error) return reject(new Error(data.error));
          if (!data) return reject(new Error('No RTP capabilities returned'));
          var caps = data.routerRtpCapabilities ? data.routerRtpCapabilities : data;
          resolve(caps);
        });
      });

      await this.device.load({ routerRtpCapabilities: rtpCapabilities });
      await this._createSendTransport();
      this._emit('rtcReset');
      this._emit('sendTransportReady');
      await this._createRecvTransport();
      this._startStatsMonitor();
    } finally {
      this._connecting = false;
    }
  }

  async _createSendTransport() {
    if (this.role === 'viewer') return;
    if (!this.device.canProduce('video') && !this.device.canProduce('audio')) return;

    var self = this;
    var params = await new Promise(function(resolve, reject) {
      self.socket.emit('create-transport', { roomId: self.roomId, direction: 'send' }, function(data) {
        if (data && data.error) return reject(new Error(data.error));
        resolve(data);
      });
    });

    this.sendTransport = this.device.createSendTransport(params);

    this.sendTransport.on('connect', function({ dtlsParameters }, callback, errback) {
      self.socket.emit('transport-connect', { transportId: self.sendTransport.id, dtlsParameters: dtlsParameters }, function(ack) {
        if (ack && ack.error) return errback(new Error(ack.error));
        callback();
      });
    });

    this.sendTransport.on('produce', function({ kind, rtpParameters }, callback, errback) {
      self.socket.emit('produce', { transportId: self.sendTransport.id, kind: kind, rtpParameters: rtpParameters }, function(data) {
        if (data && data.error) return errback(new Error(data.error));
        callback({ id: data.producerId });
      });
    });

    this.sendTransport.on('connectionstatechange', function(state) {
      self._emit('transportState', { direction: 'send', state: state });
    });
  }

  async _createRecvTransport() {
    var self = this;
    var params = await new Promise(function(resolve, reject) {
      self.socket.emit('create-transport', { roomId: self.roomId, direction: 'recv' }, function(data) {
        if (data && data.error) return reject(new Error(data.error));
        resolve(data);
      });
    });

    this.recvTransport = this.device.createRecvTransport(params);

    this.recvTransport.on('connect', function({ dtlsParameters }, callback, errback) {
      self.socket.emit('transport-connect', { transportId: self.recvTransport.id, dtlsParameters: dtlsParameters }, function(ack) {
        if (ack && ack.error) return errback(new Error(ack.error));
        callback();
      });
    });

    this.recvTransport.on('connectionstatechange', function(state) {
      self._emit('transportState', { direction: 'recv', state: state });
    });
  }

  async publishStream(stream) {
    if (!this.sendTransport) throw new Error('Send transport not initialized');

    var videoTrack = stream.getVideoTracks()[0];
    var audioTrack = stream.getAudioTracks()[0];

    if (videoTrack) {
      var videoProducer = await this.sendTransport.produce({
        track: videoTrack,
        encodings: [
          { maxBitrate: 100000, scaleResolutionDownBy: 4 },
          { maxBitrate: 300000, scaleResolutionDownBy: 2 },
          { maxBitrate: 900000, scaleResolutionDownBy: 1 }
        ],
        codecOptions: { videoGoogleStartBitrate: 1000 }
      });
      this.producers['video'] = videoProducer;
    }

    if (audioTrack) {
      var audioProducer = await this.sendTransport.produce({ track: audioTrack });
      this.producers['audio'] = audioProducer;
    }
  }

  async subscribeToProducer(producerId) {
    if (!this.recvTransport) throw new Error('Recv transport not initialized');
    if (!this.device.loaded) throw new Error('Device not loaded');

    // Return existing consumer's stream if already subscribed
    if (this.consumers[producerId] && !this.consumers[producerId].closed) {
      return new MediaStream([this.consumers[producerId].track]);
    }

    var self = this;
    var consumerParams = await new Promise(function(resolve, reject) {
      self.socket.emit('consume', {
        transportId: self.recvTransport.id,
        producerId: producerId,
        rtpCapabilities: self.device.rtpCapabilities
      }, function(data) {
        if (data && data.error) return reject(new Error(data.error));
        resolve(data);
      });
    });

    var consumer = await this.recvTransport.consume(consumerParams);
    this.consumers[producerId] = consumer;

    consumer.on('producerclose', function() { delete self.consumers[producerId]; });
    consumer.on('transportclose', function() { delete self.consumers[producerId]; });

    var stream = new MediaStream([consumer.track]);
    return stream;
  }

  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  off(event, cb) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(function(fn) { return fn !== cb; });
  }

  _emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(function(cb) { return cb(data); });
  }

  _startStatsMonitor() {
    var self = this;
    var prevBytesSent = 0;
    var prevPacketsSent = 0;
    var prevPacketsLost = 0;
    var prevBytesRecv = 0;
    this.statsInterval = setInterval(async function() {
      try {
        var bytesSent = 0;
        var packetsSent = 0;
        var packetsLost = 0;
        var rttMs = null;

        if (self.sendTransport) {
          var stats = await self.sendTransport.getStats();
          stats.forEach(function(report) {
            if (report.type === 'outbound-rtp') {
              if (report.bytesSent)    bytesSent    += report.bytesSent;
              if (report.packetsSent)  packetsSent  += report.packetsSent;
            }
            if (report.type === 'remote-inbound-rtp') {
              if (report.roundTripTime != null) rttMs = Math.round(report.roundTripTime * 1000);
              if (report.packetsLost  != null) packetsLost += report.packetsLost;
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.currentRoundTripTime != null) {
              rttMs = Math.round(report.currentRoundTripTime * 1000);
            }
          });
        }

        var bytesRecv = 0;
        if (self.recvTransport) {
          try {
            var recvStats = await self.recvTransport.getStats();
            recvStats.forEach(function(report) {
              if (report.type === 'inbound-rtp' && report.bytesReceived) {
                bytesRecv += report.bytesReceived;
              }
            });
          } catch (e) {}
        }

        var bitratekbps    = Math.round((bytesSent - prevBytesSent) * 8 / 2 / 1000);
        var recvBitratekbps = Math.round((bytesRecv - prevBytesRecv) * 8 / 2 / 1000);
        var lostDelta      = packetsLost - prevPacketsLost;
        var sentDelta      = packetsSent - prevPacketsSent;
        var lossPct        = sentDelta > 0 ? Math.min(100, Math.round((lostDelta / (sentDelta + lostDelta)) * 100)) : 0;

        prevBytesSent    = bytesSent;
        prevPacketsSent  = packetsSent;
        prevPacketsLost  = packetsLost;
        prevBytesRecv    = bytesRecv;

        self._emit('stats', {
          bytesSent:       bytesSent,
          bitratekbps:     Math.max(0, bitratekbps),
          recvBitratekbps: Math.max(0, recvBitratekbps),
          rttMs:           rttMs,
          lossPct:         Math.max(0, lossPct),
        });
      } catch (e) {
        // stats not critical
      }
    }, 2000);
  }

  async replaceTrack(kind, newTrack) {
    if (!this.producers[kind]) return;
    try {
      await this.producers[kind].replaceTrack({ track: newTrack });
    } catch(e) {
      console.error('[RTC] replaceTrack error:', e);
    }
  }

  async publishScreenShare() {
    if (!this.sendTransport) throw new Error('Send transport not initialized');
    if (this.producers['screen']) return this.producers['screen'].id;
    var displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    var screenTrack = displayStream.getVideoTracks()[0];
    var self = this;
    screenTrack.onended = function() { self.stopScreenShare(); };
    var screenProducer = await this.sendTransport.produce({
      track: screenTrack,
      appData: { source: 'screen' }
    });
    this.producers['screen'] = screenProducer;
    this._emit('screenShareStarted', { producerId: screenProducer.id });
    return screenProducer.id;
  }

  stopScreenShare() {
    if (!this.producers['screen']) return;
    try {
      var track = this.producers['screen'].track;
      if (track) track.stop();
    } catch(e) {}
    this.producers['screen'].close();
    delete this.producers['screen'];
    this._emit('screenShareStopped');
    // Restore camera into video producer so host's tile doesn't go black
    var self = this;
    if (this.producers['video']) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(function(s) {
        var t = s.getVideoTracks()[0];
        if (t) self.producers['video'].replaceTrack({ track: t }).catch(function() {});
      }).catch(function() {});
    }
  }

  pauseProducer(kind) {
    if (this.producers[kind]) {
      this.producers[kind].pause();
      this.socket.emit('producer-pause', { roomId: this.roomId, producerId: this.producers[kind].id });
    }
  }

  resumeProducer(kind) {
    if (this.producers[kind]) {
      this.producers[kind].resume();
      this.socket.emit('producer-resume', { roomId: this.roomId, producerId: this.producers[kind].id });
    }
  }

  closeProducer(kind) {
    if (this.producers[kind]) {
      this.producers[kind].close();
      delete this.producers[kind];
    }
  }

  destroy() {
    if (this.statsInterval) { clearInterval(this.statsInterval); this.statsInterval = null; }
    Object.values(this.producers).forEach(function(p) { return p.close(); });
    Object.values(this.consumers).forEach(function(c) { return c.close(); });
    if (this.sendTransport) { this.sendTransport.close(); this.sendTransport = null; }
    if (this.recvTransport) { this.recvTransport.close(); this.recvTransport = null; }
    this.producers = {};
    this.consumers = {};
  }
}

var rtcManager = new SeeWhyRTC();
export default rtcManager;