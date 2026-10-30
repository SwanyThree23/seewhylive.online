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
    this._lastConnectParams = null;
    this._reconnectTimer = null;
    this._reconnectAttempts = 0;
  }

  async connect(socket, roomId, userId, role) {
    if (this._connecting) return;
    this._connecting = true;
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    this._lastConnectParams = { socket: socket, roomId: roomId, userId: userId, role: role };
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
      this._emit('sendTransportReady');
      await this._createRecvTransport();
      this._emit('rtcReset');
      this._startStatsMonitor();
      this._reconnectAttempts = 0;
    } finally {
      this._connecting = false;
    }
  }

  _scheduleReconnect() {
    if (this._reconnectTimer || !this._lastConnectParams || this._connecting) return;
    var self = this;
    var delay = Math.min(30000, 3000 * Math.pow(2, this._reconnectAttempts));
    this._reconnectAttempts++;
    this._emit('reconnecting', { attempt: this._reconnectAttempts, delayMs: delay });
    this._reconnectTimer = setTimeout(function() {
      self._reconnectTimer = null;
      if (!self._lastConnectParams) return;
      var p = self._lastConnectParams;
      self.connect(p.socket, p.roomId, p.userId, p.role).catch(function() {
        self._scheduleReconnect();
      });
    }, delay);
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

    this.sendTransport.on('produce', function({ kind, rtpParameters, appData }, callback, errback) {
      self.socket.emit('produce', { transportId: self.sendTransport.id, kind: kind, rtpParameters: rtpParameters, appData: appData || {} }, function(data) {
        if (data && data.error) return errback(new Error(data.error));
        callback({ id: data.producerId });
      });
    });

    this.sendTransport.on('connectionstatechange', function(state) {
      self._emit('transportState', { direction: 'send', state: state });
      if (state === 'failed') self._scheduleReconnect();
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
      if (state === 'failed') self._scheduleReconnect();
    });
  }

  async publishStream(stream, options) {
    if (!this.sendTransport) throw new Error('Send transport not initialized');

    var videoTrack = stream.getVideoTracks()[0];
    var audioTrack = stream.getAudioTracks()[0];

    if (videoTrack) {
      // Close existing video producer so re-publishing (e.g. quality preset change) cleanly
      // signals removal to subscribers before creating the new producer
      if (this.producers['video']) {
        var oldVideoId = this.producers['video'].id;
        try { this.producers['video'].close(); } catch(e) {}
        delete this.producers['video'];
        if (this.socket && oldVideoId) this.socket.emit('producer-closed', { producerId: oldVideoId });
      }
      // Scale simulcast layers relative to the top-layer cap from the quality preset
      var topBitrate = (options && options.maxBitrate) ? Math.min(options.maxBitrate, 5000000) : 900000;
      var midBitrate  = Math.round(topBitrate * 0.33);
      var lowBitrate  = Math.round(topBitrate * 0.11);
      var videoProducer = await this.sendTransport.produce({
        track: videoTrack,
        encodings: [
          { rid: 'r0', maxBitrate: lowBitrate, scaleResolutionDownBy: 4 },
          { rid: 'r1', maxBitrate: midBitrate, scaleResolutionDownBy: 2 },
          { rid: 'r2', maxBitrate: topBitrate, scaleResolutionDownBy: 1 }
        ],
        codecOptions: { videoGoogleStartBitrate: 1000 }
      });
      this.producers['video'] = videoProducer;
    }

    if (audioTrack) {
      // Same: close existing audio producer before recreating
      if (this.producers['audio']) {
        var oldAudioId = this.producers['audio'].id;
        try { this.producers['audio'].close(); } catch(e) {}
        delete this.producers['audio'];
        if (this.socket && oldAudioId) this.socket.emit('producer-closed', { producerId: oldAudioId });
      }
      var audioProducer = await this.sendTransport.produce({
        track: audioTrack,
        codecOptions: { opusStereo: false, opusDtx: true, opusFec: true, opusMaxPlaybackRate: 48000 }
      });
      this.producers['audio'] = audioProducer;
    }
  }

  async subscribeToProducer(producerId) {
    if (!this.recvTransport) throw new Error('Recv transport not initialized');
    if (!this.device.loaded) throw new Error('Device not loaded');

    // Return existing consumer's stream if still alive
    var existing = this.consumers[producerId];
    if (existing && !existing.closed && existing.track && existing.track.readyState !== 'ended') {
      return new MediaStream([existing.track]);
    }
    // Clean up stale consumer before re-subscribing
    if (existing) {
      try { existing.close(); } catch(e) {}
      delete this.consumers[producerId];
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

    consumer.on('producerclose', function() {
      delete self.consumers[producerId];
      self._emit('consumerClosed', { producerId: producerId });
    });
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
    var poorRecvCount = 0;
    var goodRecvCount = 0;
    var currentRecvLayer = 1; // track last requested layer to avoid redundant emits
    var consumerPrevBytes = {}; // producerId → prevBytesReceived for per-consumer bitrate
    var consumerStatsTick = 0; // sample per-consumer stats every other tick (4s)
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

        // Adaptive recv quality — 3-tier: degrade fast on poor bw, recover conservatively.
        // Layer 0 (r0 ~100 kbps/consumer): emergency downgrade after 2 poor samples.
        // Layer 1 (r1 ~300 kbps/consumer): default; re-enter when rb recovers above 250 kbps.
        // Layer 2 (r2 ~900 kbps/consumer): upgrade only after 4 sustained good-bw samples.
        if (self.socket && self.recvTransport) {
          var rb = Math.max(0, recvBitratekbps);
          if (rb > 0 && rb < 150) {
            poorRecvCount++;
            goodRecvCount = 0;
            if (poorRecvCount >= 2 && currentRecvLayer !== 0) {
              currentRecvLayer = 0;
              self.socket.emit('consumer:adapt-layer', { spatialLayer: 0 });
            }
          } else if (rb >= 800) {
            poorRecvCount = 0;
            goodRecvCount++;
            if (goodRecvCount >= 4 && currentRecvLayer < 2) {
              goodRecvCount = 0;
              currentRecvLayer = 2;
              self.socket.emit('consumer:adapt-layer', { spatialLayer: 2 });
            }
          } else if (rb >= 250) {
            poorRecvCount = 0;
            goodRecvCount = 0;
            if (currentRecvLayer !== 1) {
              currentRecvLayer = 1;
              self.socket.emit('consumer:adapt-layer', { spatialLayer: 1 });
            }
          } else {
            // 150–249 kbps band — stable, no change
            poorRecvCount = 0;
            goodRecvCount = 0;
          }
        }
        // Per-consumer recv stats for remote tile quality indicators (every 4s)
        consumerStatsTick++;
        if (consumerStatsTick % 2 === 0) {
          var pids = Object.keys(self.consumers);
          for (var _i = 0; _i < pids.length; _i++) {
            var _pid = pids[_i];
            var _c = self.consumers[_pid];
            if (!_c || _c.closed || _c.kind !== 'video') continue;
            try {
              var _cs = await _c.getStats();
              var _rb = 0; var _jitter = 0; var _lost = 0;
              _cs.forEach(function(r) {
                if (r.type === 'inbound-rtp') {
                  if (r.bytesReceived) _rb += r.bytesReceived;
                  if (r.jitter) _jitter = r.jitter;
                  if (r.packetsLost) _lost = r.packetsLost;
                }
              });
              var _prev = consumerPrevBytes[_pid] || 0;
              var _kbps = Math.max(0, Math.round((_rb - _prev) * 8 / 4 / 1000));
              consumerPrevBytes[_pid] = _rb;
              self._emit('consumerStats', { producerId: _pid, bitratekbps: _kbps, jitter: _jitter, packetsLost: _lost });
            } catch (_) {}
          }
        }

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
    if (!this.producers[kind]) return;
    var producerId = this.producers[kind].id;
    this.producers[kind].close();
    delete this.producers[kind];
    if (this.socket && producerId) {
      this.socket.emit('producer-closed', { producerId: producerId });
    }
  }

  destroy() {
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    this._lastConnectParams = null;
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