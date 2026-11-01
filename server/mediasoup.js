'use strict';

/**
 * mediasoup.js - SFU implementation for SeeWhy LIVE v33.0
 * One Worker per CPU core, one Router per room, simulcast video.
 */

var mediasoup = require('mediasoup');
var os = require('os');

var ANNOUNCED_IP = process.env.MEDIASOUP_ANNOUNCED_IP || '2.24.194.112';

// ─── Internal state maps ───────────────────────────────────────────────────
var workers = [];               // mediasoup.Worker[]
var routers = {};               // roomId → mediasoup.Router
var routerWorker = {};          // routerId → worker — tracks which worker owns each router
var transports = {};            // transportId → mediasoup.WebRtcTransport
var producers = {};             // producerId → { producer, guestId, kind, roomId }
var consumers = {};             // consumerId → mediasoup.Consumer  (do not change key scheme)
var guestVideoConsumers = {};   // producerGuestId → Set<consumerId> — secondary index for layer control
var socketVideoConsumers = {};  // socketId → Set<consumerId> — per-viewer adaptive layer control

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
    if (idx !== -1) workers.splice(idx, 1);

    // Remove all routers that were running on the dead worker so that affected
    // rooms don't get stuck with unresolvable router references. Clients that
    // attempt to reconnect will trigger a fresh router creation on the new worker.
    var deadRouterIds = Object.keys(routerWorker).filter(function(rid) {
      return routerWorker[rid] === worker;
    });
    deadRouterIds.forEach(function(rid) {
      delete routerWorker[rid];
      // Find and evict all room entries pointing to this router
      var roomIds = Object.keys(routers).filter(function(rmId) {
        return routers[rmId] && routers[rmId].id === rid;
      });
      roomIds.forEach(function(rmId) {
        delete routers[rmId];
        // Evict transports/producers/consumers belonging to this room so they
        // are not referenced after the worker is gone.
        var tids = Object.keys(transports).filter(function(tid) {
          return transports[tid] && transports[tid].routerId === rid;
        });
        tids.forEach(function(tid) { delete transports[tid]; });
        var pids = Object.keys(producers).filter(function(pid) {
          return producers[pid] && producers[pid].roomId === rmId;
        });
        pids.forEach(function(pid) {
          var entry = producers[pid];
          if (entry && entry.guestId && guestVideoConsumers[entry.guestId]) {
            delete guestVideoConsumers[entry.guestId];
          }
          delete producers[pid];
        });
        var cids = Object.keys(consumers).filter(function(cid) {
          return consumers[cid] && consumers[cid].routerId === rid;
        });
        cids.forEach(function(cid) { delete consumers[cid]; });
      });
    });

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
  routerWorker[router.id] = worker;
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

async function createProducer(transportId, rtpParameters, kind, guestId, appData) {
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

  producers[producer.id] = { producer: producer, guestId: guestId, kind: kind, roomId: roomId, appData: appData || {} };

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

function closeTransport(transportId) {
  var transport = transports[transportId];
  if (!transport) return;
  try { transport.close(); } catch (err) { /* ignore — mediasoup may have already closed it */ }
  delete transports[transportId];
}

async function restartTransportIce(transportId) {
  var transport = transports[transportId];
  if (!transport) throw new Error('Transport not found: ' + transportId);
  var iceParameters = await transport.restartIce();
  return iceParameters;
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

function getProducerIdsByGuest(guestId, roomId) {
  var ids = [];
  Object.keys(producers).forEach(function(pid) {
    var entry = producers[pid];
    if (entry.guestId === guestId && (!roomId || entry.roomId === roomId)) ids.push(pid);
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
  consumers[consumer.id] = consumer;

  // Tag the consumer with the producer's guestId so the speaking handler can
  // find it later using only guestId — does not change the consumers key scheme.
  var producerGuestId = producerEntry.guestId;
  consumer._producerGuestId = producerGuestId;

  if (consumer.kind === 'video') {
    // Start at layer 1 (r1, ~300 kbps) — a reasonable default for most viewers.
    // The adaptive recv system in webrtc.js downgrades to layer 0 within 4s if
    // bandwidth is insufficient, and upgrades to layer 2 after sustained good bandwidth.
    // Starting at layer 1 instead of 0 avoids a ~4s window of blurry quality for
    // viewers on normal connections.
    try {
      await consumer.setPreferredLayers({ spatialLayer: 1 });
    } catch (_) { /* consumer may be audio-only or not yet negotiated */ }

    // Add to the secondary guestId → Set<consumerId> index
    if (!guestVideoConsumers[producerGuestId]) {
      guestVideoConsumers[producerGuestId] = new Set();
    }
    guestVideoConsumers[producerGuestId].add(consumer.id);
  }

  // Clean up all indexes when this consumer closes for any reason (producer gone, transport
  // closed, etc.) — prevents stale entries accumulating in guestVideoConsumers and
  // socketVideoConsumers that would cause setPreferredLayers calls on dead consumers.
  var consumerId = consumer.id;
  consumer.on('close', function() {
    delete consumers[consumerId];
    if (producerGuestId && guestVideoConsumers[producerGuestId]) {
      guestVideoConsumers[producerGuestId].delete(consumerId);
      if (guestVideoConsumers[producerGuestId].size === 0) {
        delete guestVideoConsumers[producerGuestId];
      }
    }
    // socketVideoConsumers is keyed by socketId — scan to find and remove the entry
    var sids = Object.keys(socketVideoConsumers);
    for (var _i = 0; _i < sids.length; _i++) {
      var _set = socketVideoConsumers[sids[_i]];
      if (_set && _set.has(consumerId)) {
        _set.delete(consumerId);
        break;
      }
    }
  });

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
      result.push({ producerId: ids[i], guestId: entry.guestId, kind: entry.kind, appData: entry.appData || {}, paused: !!(entry.producer && entry.producer.paused) });
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
        // Remove from secondary guestVideoConsumers index before deleting
        if (c._producerGuestId && guestVideoConsumers[c._producerGuestId]) {
          guestVideoConsumers[c._producerGuestId].delete(consumerIds[k]);
          if (guestVideoConsumers[c._producerGuestId].size === 0) {
            delete guestVideoConsumers[c._producerGuestId];
          }
        }
        try { c.close(); } catch (e) { /* ignore */ }
        delete consumers[consumerIds[k]];
      }
    }

    var routerId = router.id;
    try { router.close(); } catch (e) { /* ignore */ }
    delete routers[roomId];
    delete routerWorker[routerId];
  }
}

function getWorkerCount() {
  return workers.length;
}

// ─── Speaking-driven layer selector ────────────────────────────────────────
// Called by the 'speaking' socket handler in index.js.
// For every subscriber currently consuming the named guest's video stream,
// flip to spatialLayer 2 (r2/900 kbps) while speaking or back to 0 (r0/100 kbps)
// when silent.  Fire-and-forget: wrapped in try/catch in the caller.
// Track a video consumer under a viewer's socketId for per-viewer adaptive quality.
// Called from the 'consume' handler in index.js after createConsumer returns.
function indexConsumerBySocket(socketId, consumerId) {
  if (!socketVideoConsumers[socketId]) socketVideoConsumers[socketId] = new Set();
  socketVideoConsumers[socketId].add(consumerId);
}

// Remove all consumer entries for a socket (called on disconnect).
function cleanupSocketConsumers(socketId) {
  delete socketVideoConsumers[socketId];
}

// For a viewer requesting adaptive quality: set preferred layer on all their video consumers.
async function setSocketConsumerPreferredLayers(socketId, spatialLayer) {
  var ids = socketVideoConsumers[socketId];
  if (!ids || ids.size === 0) return;
  var promises = [];
  ids.forEach(function(cid) {
    var c = consumers[cid];
    if (c && c.kind === 'video') {
      promises.push(c.setPreferredLayers({ spatialLayer: spatialLayer }).catch(function() {}));
    }
  });
  await Promise.all(promises);
}

// Like setSocketConsumerPreferredLayers but skips consumers belonging to skipGuestId.
// Used by adaptive bandwidth to avoid overriding the layer-2 boost for screen sharers.
async function setSocketConsumerPreferredLayersExcept(socketId, spatialLayer, skipGuestId) {
  var ids = socketVideoConsumers[socketId];
  if (!ids || ids.size === 0) return;
  var skipSet = (skipGuestId && guestVideoConsumers[skipGuestId]) ? guestVideoConsumers[skipGuestId] : new Set();
  var promises = [];
  ids.forEach(function(cid) {
    if (skipSet.has(cid)) return;
    var c = consumers[cid];
    if (c && c.kind === 'video') {
      promises.push(c.setPreferredLayers({ spatialLayer: spatialLayer }).catch(function() {}));
    }
  });
  await Promise.all(promises);
}

async function setPreferredLayersByGuestId(producerGuestId, spatialLayer) {
  var ids = guestVideoConsumers[producerGuestId];
  if (!ids || ids.size === 0) return;
  var promises = [];
  ids.forEach(function(cid) {
    var c = consumers[cid];
    if (c) {
      promises.push(
        c.setPreferredLayers({ spatialLayer: spatialLayer }).catch(function() {})
      );
    }
  });
  await Promise.all(promises);
}

// Set the preferred simulcast layer for the specific consumer that socketId holds for
// producerGuestId — used by spotlight so only the requesting viewer's quality changes,
// not every viewer of that guest.
async function setSocketConsumerPreferredLayerForGuest(socketId, producerGuestId, spatialLayer) {
  var socketIds = socketVideoConsumers[socketId];
  var guestIds  = guestVideoConsumers[producerGuestId];
  if (!socketIds || !guestIds) return;
  var promises = [];
  socketIds.forEach(function(cid) {
    if (!guestIds.has(cid)) return; // not this guest's consumer
    var c = consumers[cid];
    if (c && c.kind === 'video') {
      promises.push(c.setPreferredLayers({ spatialLayer: spatialLayer }).catch(function() {}));
    }
  });
  await Promise.all(promises);
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
  closeTransport: closeTransport,
  restartTransportIce: restartTransportIce,
  pauseProducer: pauseProducer,
  resumeProducer: resumeProducer,
  getProducerIdsByGuest: getProducerIdsByGuest,
  getRouterRtpCapabilities: getRouterRtpCapabilities,
  getRoomProducers: getRoomProducers,
  cleanupRoom: cleanupRoom,
  getWorkerCount: getWorkerCount,
  setPreferredLayersByGuestId: setPreferredLayersByGuestId,
  indexConsumerBySocket: indexConsumerBySocket,
  cleanupSocketConsumers: cleanupSocketConsumers,
  setSocketConsumerPreferredLayers: setSocketConsumerPreferredLayers,
  setSocketConsumerPreferredLayersExcept: setSocketConsumerPreferredLayersExcept,
  setSocketConsumerPreferredLayerForGuest: setSocketConsumerPreferredLayerForGuest
};
