import * as mediasoupClient from 'mediasoup-client';

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
  }

  async connect(socket, roomId, userId, role) {
    this.socket = socket;
    this.roomId = roomId;
    this.userId = userId;
    this.role = role;
    this.device = new mediasoupClient.Device();

    // Get RTP capabilities from server
    // Server returns { routerRtpCapabilities: caps } — extract the inner caps object
    const rtpCapabilities = await new Promise((resolve, reject) => {
      socket.emit('get-rtp-capabilities', { roomId }, (data) => {
        if (data && data.error) return reject(new Error(data.error));
        if (!data) return reject(new Error('No RTP capabilities returned'));
        const caps = data.routerRtpCapabilities ? data.routerRtpCapabilities : data;
        resolve(caps);
      });
    });

    await this.device.load({ routerRtpCapabilities: rtpCapabilities });
    await this._createSendTransport();
    await this._createRecvTransport();
    this._startStatsMonitor();
  }

  async _createSendTransport() {
    if (this.role === 'viewer') return;
    if (!this.device.canProduce('video') && !this.device.canProduce('audio')) return;

    const params = await new Promise((resolve, reject) => {
      this.socket.emit('create-transport', { roomId: this.roomId, direction: 'send' }, (data) => {
        if (data && data.error) return reject(new Error(data.error));
        resolve(data);
      });
    });

    this.sendTransport = this.device.createSendTransport(params);

    this.sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      this.socket.emit('transport-connect', { transportId: this.sendTransport.id, dtlsParameters }, (ack) => {
        if (ack && ack.error) return errback(new Error(ack.error));
        callback();
      });
    });

    this.sendTransport.on('produce', ({ kind, rtpParameters }, callback, errback) => {
      this.socket.emit('produce', { transportId: this.sendTransport.id, kind, rtpParameters }, (data) => {
        if (data && data.error) return errback(new Error(data.error));
        callback({ id: data.producerId });
      });
    });
  }

  async _createRecvTransport() {
    const params = await new Promise((resolve, reject) => {
      this.socket.emit('create-transport', { roomId: this.roomId, direction: 'recv' }, (data) => {
        if (data && data.error) return reject(new Error(data.error));
        resolve(data);
      });
    });

    this.recvTransport = this.device.createRecvTransport(params);

    this.recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      this.socket.emit('transport-connect', { transportId: this.recvTransport.id, dtlsParameters }, (ack) => {
        if (ack && ack.error) return errback(new Error(ack.error));
        callback();
      });
    });
  }

  async publishStream(stream) {
    if (!this.sendTransport) throw new Error('Send transport not initialized');

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    if (videoTrack) {
      const videoProducer = await this.sendTransport.produce({
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
      const audioProducer = await this.sendTransport.produce({ track: audioTrack });
      this.producers['audio'] = audioProducer;
    }
  }

  async subscribeToProducer(producerId) {
    if (!this.recvTransport) throw new Error('Recv transport not initialized');
    if (!this.device.loaded) throw new Error('Device not loaded');

    const consumerParams = await new Promise((resolve, reject) => {
      this.socket.emit('consume', {
        transportId: this.recvTransport.id,
        producerId,
        rtpCapabilities: this.device.rtpCapabilities
      }, (data) => {
        if (data && data.error) return reject(new Error(data.error));
        resolve(data);
      });
    });

    const consumer = await this.recvTransport.consume(consumerParams);
    this.consumers[producerId] = consumer;

    const stream = new MediaStream([consumer.track]);
    return stream;
  }

  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  _emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((cb) => cb(data));
  }

  _startStatsMonitor() {
    this.statsInterval = setInterval(async () => {
      if (!this.sendTransport) return;
      try {
        const stats = await this.sendTransport.getStats();
        let bytesSent = 0;
        stats.forEach((report) => {
          if (report.type === 'outbound-rtp' && report.bytesSent) {
            bytesSent += report.bytesSent;
          }
        });
        this._emit('stats', { bytesSent });
      } catch (e) {
        // stats not critical
      }
    }, 2000);
  }

  closeProducer(kind) {
    if (this.producers[kind]) {
      this.producers[kind].close();
      delete this.producers[kind];
    }
  }

  destroy() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    Object.values(this.producers).forEach((p) => p.close());
    Object.values(this.consumers).forEach((c) => c.close());
    if (this.sendTransport) this.sendTransport.close();
    if (this.recvTransport) this.recvTransport.close();
    this.producers = {};
    this.consumers = {};
  }
}

const rtcManager = new SeeWhyRTC();
export default rtcManager;
