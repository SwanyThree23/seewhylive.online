'use strict';

/**
 * mediasoup.js - SFU implementation for SeeWhy LIVE v33.0
 * One Worker per CPU core, one Router per room, simulcast video.
 */

const mediasoup = require('mediasoup');
const os = require('os');

const ANNOUNCED_IP = '2.24.194.112';

// ─── Internal state maps ───────────────────────────────────────────────────
const workers = [];       // mediasoup.Worker[]
const routers = {};       // roomId → mediasoup.Router
const transports = {};    // transportId → mediasoup.WebRtcTransport
const producers = {};     // producerId → { producer, guestId, kind, roomId }
const consumers = {};     // consumerId → mediasoup.Consumer

let workerIndex = 0;

// ─── Codec definitions ────────────────────────────────────────────────────
const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000
    }
  },
  {
    kind: 'video',
    mimeType: 'video/H264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '42e01f',
      'level-asymmetry-allowed': 1,
      'x-google-start-bitrate': 1000
    }
  }
];

// ─── Worker management ───────────────────────────────────────────────────

/**
 * Spawn a single mediasoup Worker and attach crash recovery.
 * @returns {Promise<mediasoup.Worker>}
 */
async function spawnWorker() {
  const worker = await mediasoup.createWorker({
    logLevel: 'warn',
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
    rtcMinPort: 40000,
    rtcMaxPort: 49999
  });

  worker.on('died', function(error) {
    console.error('mediasoup Worker died, restarting in 2s:', error);
    const idx = workers.indexOf(worker);
    if (idx !== -1) {
      workers.splice(idx, 1);
    }
    setTimeout(function() {
      spawnWorker().then(function(newWorker) {
        workers.push(newWorker);
        console.log('mediasoup replacement Worker spawned, total workers:', workers.length);
      }).catch(function(err) {
        console.error('Failed to spawn replacement Worker:', err);
      });
    }, 2000);
  });

  return worker;
}

/**
 * Create one Worker per CPU core.
 * @returns {Promise<void>}
 */
async function createWorkers() {
  const numCores = os.cpus().length;
  const promises = [];
  for (let i = 0; i < numCores; i++) {
    promises.push(spawnWorker());
  }
  const spawned = await Promise.all(promises);
  spawned.forEach(function(w) { workers.push(w); });
  console.log('mediasoup Workers created:', workers.length);
}

/**
 * Round-robin pick of an alive Worker.
 * @returns {mediasoup.Worker}
 */
function pickWorker() {
  if (workers.length === 0) {
    throw new Error('No mediasoup Workers available');
  }
  const worker = workers[workerIndex % workers.length];
  workerIndex = (workerIndex + 1) % workers.length;
  return worker;
}

// ─── Router management ───────────────────────────────────────────────────

/**
 * Get an existing Router for a room or create one.
 * @param {string} roomId
 * @returns {Promise<mediasoup.Router>}
 */
async function getOrCreateRouter(roomId) {
  if (routers[roomId]) {
    return routers[roomId];
  }
  const worker = pickWorker();
  const router = await worker.createRouter({ mediaCodecs });
  routers[roomId] = router;
  return router;
}

/**
 * Return the router RTP capabilities for a room.
 * @param {string} roomId
 * @returns {Object}
 */
function getRouterRtpCapabilities(roomId) {
  if (!routers[roomId]) {
    throw new Error('No router for room: ' + roomId);
  }
  return routers[roomId].rtpCapabilities;
}

// ─── Transport management ────────────────────────────────────────────────

/**
 * Create a WebRtcTransport for a given router.
 * @param {string} routerId - the roomId whose router to use
 * @returns {Promise<{transport: mediasoup.WebRtcTransport, params: Object}>}
 */
async function createWebRtcTransport(routerId) {
  const router = routers[routerId];
  if (!router) {
    throw new Error('No router for room: ' + routerId);
  }

  const transport = await router.createWebRtcTransport({
    listenIps: [
      { ip: '0.0.0.0', announcedIp: ANNOUNCED_IP }
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1000000
  });

  transports[transport.id] = transport;

  const params = {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters
  };

  return { transport, params };
}

/**
 * Connect a transport to the client-supplied DTLS parameters.
 * @param {string} transportId
 * @param {Object} dtlsParameters
 * @returns {Promise<void>}
 */
async function connectTransport(transportId, dtlsParameters) {
  const transport = transports[transportId];
  if (!transport) {
    throw new Error('Transport not found: ' + transportId);
  }
  await transport.connect({ dtlsParameters });
}

// ─── Producer management ─────────────────────────────────────────────────

/**
 * Create a producer on the given transport.
 * @param {string} transportId
 * @param {Object} rtpParameters
 * @param {string} kind - 'audio' | 'video'
 * @param {string} guestId
 * @returns {Promise<{producer: mediasoup.Producer, producerId: string}>}
 */
async function createProducer(transportId, rtpParameters, kind, guestId) {
  const transport = transports[transportId];
  if (!transport) {
    throw new Error('Transport not found: ' + transportId);
  }

  const producerOptions = { kind, rtpParameters };

  // Simulcast encodings for video producers
  if (kind === 'video') {
    producerOptions.encodings = [
      { rid: 'r0', maxBitrate: 100000, scalabilityMode: 'S1T3' },
      { rid: 'r1', maxBitrate: 300000, scalabilityMode: 'S1T3' },
      { rid: 'r2', maxBitrate: 900000, scalabilityMode: 'S1T3' }
    ];
    producerOptions.codecOptions = {
      videoGoogleStartBitrate: 1000
    };
  }

  const producer = await transport.produce(producerOptions);

  // Find which room this transport/producer belongs to by scanning routers
  let roomId = null;
  const roomIds = Object.keys(routers);
  for (let i = 0; i < roomIds.length; i++) {
    const rid = roomIds[i];
    if (routers[rid] && transport.routerId === routers[rid].id) {
      roomId = rid;
      break;
    }
  }

  producers[producer.id] = { producer, guestId, kind, roomId };

  return { producer, producerId: producer.id };
}

/**
 * Close a producer and remove it from internal state.
 * @param {string} producerId
 */
function closeProducer(producerId) {
  const entry = producers[producerId];
  if (!entry) return;
  try {
    entry.producer.close();
  } catch (err) {
    console.error('Error closing producer:', producerId, err);
  }
  delete producers[producerId];
}

// ─── Consumer management ─────────────────────────────────────────────────

/**
 * Create a consumer for a specific producer.
 * @param {string} routerId - the roomId whose router to use
 * @param {string} transportId
 * @param {string} producerId
 * @param {Object} rtpCapabilities
 * @returns {Promise<{consumer: mediasoup.Consumer, params: Object}>}
 */
async function createConsumer(routerId, transportId, producerId, rtpCapabilities) {
  const router = routers[routerId];
  if (!router) {
    throw new Error('No router for room: ' + routerId);
  }

  const transport = transports[transportId];
  if (!transport) {
    throw new Error('Transport not found: ' + transportId);
  }

  const producerEntry = producers[producerId];
  if (!producerEntry) {
    throw new Error('Producer not found: ' + producerId);
  }

  if (!router.canConsume({ producerId, rtpCapabilities })) {
    throw new Error('Cannot consume producer: ' + producerId);
  }

  const consumer = await transport.consume({
    producerId,
    rtpCapabilities,
    paused: false
  });

  consumers[consumer.id] = consumer;

  const params = {
    id: consumer.id,
    producerId,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
    type: consumer.type,
    producerPaused: consumer.producerPaused
  };

  return { consumer, params };
}

// ─── Room-level helpers ───────────────────────────────────────────────────

/**
 * Return all active producers for a room.
 * @param {string} roomId
 * @returns {Array<{producerId: string, guestId: string, kind: string}>}
 */
function getRoomProducers(roomId) {
  const result = [];
  const ids = Object.keys(producers);
  for (let i = 0; i < ids.length; i++) {
    const entry = producers[ids[i]];
    if (entry.roomId === roomId) {
      result.push({ producerId: ids[i], guestId: entry.guestId, kind: entry.kind });
    }
  }
  return result;
}

/**
 * Close all producers, consumers, transports, and the router for a room.
 * @param {string} roomId
 */
function cleanupRoom(roomId) {
  // Close producers belonging to this room
  const producerIds = Object.keys(producers);
  for (let i = 0; i < producerIds.length; i++) {
    const entry = producers[producerIds[i]];
    if (entry.roomId === roomId) {
      try { entry.producer.close(); } catch (e) { /* ignore */ }
      delete producers[producerIds[i]];
    }
  }

  // Close transports belonging to this room's router
  const router = routers[roomId];
  if (router) {
    const transportIds = Object.keys(transports);
    for (let i = 0; i < transportIds.length; i++) {
      const t = transports[transportIds[i]];
      if (t.routerId === router.id) {
        try { t.close(); } catch (e) { /* ignore */ }
        delete transports[transportIds[i]];
      }
    }

    // Close consumers whose producer was in this room (already closed above, just clean map)
    const consumerIds = Object.keys(consumers);
    for (let i = 0; i < consumerIds.length; i++) {
      const c = consumers[consumerIds[i]];
      if (c.routerId === router.id) {
        try { c.close(); } catch (e) { /* ignore */ }
        delete consumers[consumerIds[i]];
      }
    }

    try { router.close(); } catch (e) { /* ignore */ }
    delete routers[roomId];
  }
}

/**
 * Return the current number of active workers (used by health endpoint).
 * @returns {number}
 */
function getWorkerCount() {
  return workers.length;
}

module.exports = {
  createWorkers,
  getOrCreateRouter,
  createWebRtcTransport,
  connectTransport,
  createProducer,
  createConsumer,
  closeProducer,
  getRouterRtpCapabilities,
  getRoomProducers,
  cleanupRoom,
  getWorkerCount
};
