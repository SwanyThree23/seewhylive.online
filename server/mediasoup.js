'use strict';

/**
 * mediasoup.js - SFU implementation for SeeWhy LIVE v33.0
 * One Worker per CPU core, one Router per room, simulcast video.
 */

var mediasoup = require('mediasoup');
var os = require('os');

var ANNOUNCED_IP = process.env.MEDIASOUP_ANNOUNCED_IP || '2.24.194.112';

// ─── Internal state maps ───────────────────────────────────────────────────
var workers = [];             // mediasoup.Worker[]
var routers = {};             // roomId → mediasoup.Router
var transports = {};          // transportId → mediasoup.WebRtcTransport
var producers = {};           // producerId → { producer, guestId, kind, roomId }
var consumers = {};           // consumerId → mediasoup.Consumer
var guestVideoConsumers = {}; // guestId → consumerId[] (video only, for setPreferredLayers)

var workerIndex = 0;

// ─── Codec definitions ────────────────────────────────────────────────────
var mediaCodecs = [
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

async function spawnWorker() {
  var worker = await mediasoup.createWorker({
    logLevel: 'warn',
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
    rtcMinPort: 40000,
    rtcMaxPort: 49999
  });

  worker.on('died', function(error) {
    console.error('mediasoup Worker died, restarting in 2s:', error);
    var idx = workers.indexOf(worker);
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

async function createWorkers() {
  var numCores = os.cpus().length;
  var promises = [];
  for (var i = 0; i < numCores; i++) {
    promises.push(spawnWorker());
  }
  var spawned = await Promise.all(promises);
  spawned.forEach(function(w) { workers.push(w); });
  console.log('mediasoup Workers created:', workers.length);
}

function pickWorker() {
  if (workers.length === 0) {
    throw new Error('No mediasoup Workers available');
  }
  var worker = workers[workerIndex % workers.length];
  workerIndex = (workerIndex + 1) % workers.length;
  return worker;
}

// ─── Router management ───────────────────────────────────────────────────

async function getOrCreateRouter(roomId) {
  if (routers[roomId]) {
    return routers[roomId];
  }
  var worker = pickWorker();
  var router = await worker.createRouter({ mediaCodecs: mediaCodecs });
  routers[roomId] = router;
  return router;
}

function getRouterRtpCapabilities(roomId) {
  if (!routers[roomId]) {
    throw new Error('No router for room: ' + roomId);
  }
  return routers[roomId].rtpCapabilities;
}

// ─── Transport management ────────────────────────────────────────────────

async function createWebRtcTransport(routerId) {
  var router = routers[routerId];
  if (!router) {
    throw new Error('No router for room: ' + routerId);
  }

  var transport = await router.createWebRtcTransport({
    listenIps: [
      { ip: '0.0.0.0', announcedIp: ANNOUNCED_IP }
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1000000
  });

  transport.routerId = router.id;
  transports[transport.id] = transport;

  var params = {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters
  };

  return { transport: transport, params: params };
}

async function connectTransport(transportId, dtlsParameters) {
  var transport = transports[transportId];
  if (!transport) {
    throw new Error('Transport not found: ' + transportId);
  }
  await transport.connect({ dtlsParameters: dtlsParameters });
}

// ─── Producer management ─────────────────────────────────────────────────

async function createProducer(transportId, rtpParameters, kind, guestId) {
  var transport = transports[transportId];
  if (!transport) {
    throw new Error('Transport not found: ' + transportId);
  }

  var producerOptions = { kind: kind, rtpParameters: rtpParameters };

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

  var producer = await transport.produce(producerOptions);

  var roomId = null;
  var roomIds = Object.keys(routers);
  for (var i = 0; i < roomIds.length; i++) {
    var rid = roomIds[i];
    if (routers[rid] && transport.routerId === routers[rid].id) {
      roomId = rid;
      break;
    }
  }

  producers[producer.id] = { producer: producer, guestId: guestId, kind: kind, roomId: roomId };

  return { producer: producer, producerId: producer.id };
}

function closeProducer(producerId) {
  var entry = producers[producerId];
  if (!entry) return;
  try {
    entry.producer.close();
  } catch (err) {
    console.error('Error closing producer:', producerId, err);
  }
  delete producers[producerId];
}

function pauseProducer(producerId) {
  var entry = producers[producerId];
  if (!entry) return;
  entry.producer.pause().catch(function(err) {
    console.error('Error pausing producer:', producerId, err);
  });
}

function resumeProducer(producerId) {
  var entry = producers[producerId];
  if (!entry) return;
  entry.producer.resume().catch(function(err) {
    console.error('Error resuming producer:', producerId, err);
  });
}

function getProducerIdsByGuest(guestId) {
  var ids = [];
  Object.keys(producers).forEach(function(pid) {
    if (producers[pid].guestId === guestId) ids.push(pid);
  });
  return ids;
}

// ─── Consumer management ─────────────────────────────────────────────────

async function createConsumer(routerId, transportId, producerId, rtpCapabilities) {
  var router = routers[routerId];
  if (!router) {
    throw new Error('No router for room: ' + routerId);
  }

  var transport = transports[transportId];
  if (!transport) {
    throw new Error('Transport not found: ' + transportId);
  }

  var producerEntry = producers[producerId];
  if (!producerEntry) {
    throw new Error('Producer not found: ' + producerId);
  }

  if (!router.canConsume({ producerId: producerId, rtpCapabilities: rtpCapabilities })) {
    throw new Error('Cannot consume producer: ' + producerId);
  }

  var consumer = await transport.consume({
    producerId: producerId,
    rtpCapabilities: rtpCapabilities,
    paused: false
  });

  consumer.routerId = router.id;
  consumer.guestId  = producerEntry.guestId;
  consumers[consumer.id] = consumer;

  if (consumer.kind === 'video') {
    if (!guestVideoConsumers[producerEntry.guestId]) {
      guestVideoConsumers[producerEntry.guestId] = [];
    }
    guestVideoConsumers[producerEntry.guestId].push(consumer.id);
    try { await consumer.setPreferredLayers({ spatialLayer: 0 }); } catch (e) { /* not simulcast */ }
  }

  var params = {
    id: consumer.id,
    producerId: producerId,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
    type: consumer.type,
    producerPaused: consumer.producerPaused
  };

  return { consumer: consumer, params: params };
}

// ─── Room-level helpers ───────────────────────────────────────────────────

function getRoomProducers(roomId) {
  var result = [];
  var ids = Object.keys(producers);
  for (var i = 0; i < ids.length; i++) {
    var entry = producers[ids[i]];
    if (entry.roomId === roomId) {
      result.push({ producerId: ids[i], guestId: entry.guestId, kind: entry.kind });
    }
  }
  return result;
}

function cleanupRoom(roomId) {
  var producerIds = Object.keys(producers);
  for (var i = 0; i < producerIds.length; i++) {
    var entry = producers[producerIds[i]];
    if (entry.roomId === roomId) {
      try { entry.producer.close(); } catch (e) { /* ignore */ }
      delete producers[producerIds[i]];
    }
  }

  var router = routers[roomId];
  if (router) {
    var transportIds = Object.keys(transports);
    for (var j = 0; j < transportIds.length; j++) {
      var t = transports[transportIds[j]];
      if (t.routerId === router.id) {
        try { t.close(); } catch (e) { /* ignore */ }
        delete transports[transportIds[j]];
      }
    }

    var consumerIds = Object.keys(consumers);
    for (var k = 0; k < consumerIds.length; k++) {
      var c = consumers[consumerIds[k]];
      if (c.routerId === router.id) {
        try { c.close(); } catch (e) { /* ignore */ }
        delete consumers[consumerIds[k]];
      }
    }

    // Prune guestVideoConsumers of any IDs that no longer exist in consumers
    Object.keys(guestVideoConsumers).forEach(function(gid) {
      guestVideoConsumers[gid] = guestVideoConsumers[gid].filter(function(cid) { return !!consumers[cid]; });
      if (guestVideoConsumers[gid].length === 0) delete guestVideoConsumers[gid];
    });

    try { router.close(); } catch (e) { /* ignore */ }
    delete routers[roomId];
  }
}

function getWorkerCount() {
  return workers.length;
}

function getVideoConsumersByGuest(guestId) {
  var ids = guestVideoConsumers[guestId] || [];
  return ids.map(function(id) { return consumers[id]; }).filter(Boolean);
}


// ---- Load monitoring (added for perf visibility) ----------------------
var lastCpuUsage = process.cpuUsage();

function logResourceSnapshot() {
  var cpu = process.cpuUsage(lastCpuUsage);
  lastCpuUsage = process.cpuUsage();
  var cpuMs = (cpu.user + cpu.system) / 1000;

  var routerCount = Object.keys(routers).length;
  var transportCount = Object.keys(transports).length;
  var producerCount = Object.keys(producers).length;
  var consumerCount = Object.keys(consumers).length;

  console.log('[mediasoup-monitor]', JSON.stringify({
    timestamp: new Date().toISOString(),
    workers: workers.length,
    routers: routerCount,
    transports: transportCount,
    producers: producerCount,
    consumers: consumerCount,
    cpuMsSinceLastCheck: Math.round(cpuMs),
    memRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024)
  }));
}

setInterval(logResourceSnapshot, 30000);

module.exports = {
  createWorkers: createWorkers,
  getOrCreateRouter: getOrCreateRouter,
  createWebRtcTransport: createWebRtcTransport,
  connectTransport: connectTransport,
  createProducer: createProducer,
  createConsumer: createConsumer,
  closeProducer: closeProducer,
  pauseProducer: pauseProducer,
  resumeProducer: resumeProducer,
  getProducerIdsByGuest: getProducerIdsByGuest,
  getVideoConsumersByGuest: getVideoConsumersByGuest,
  getRouterRtpCapabilities: getRouterRtpCapabilities,
  getRoomProducers: getRoomProducers,
  cleanupRoom: cleanupRoom,
  getWorkerCount: getWorkerCount
};
