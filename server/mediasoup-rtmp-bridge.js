'use strict';

/**
 * mediasoup-rtmp-bridge.js - Bridges a room's MediaSoup producers into the
 * local RTMP ingest port (rtmp://localhost:1935/live/{roomId}) so browser
 * "go live" hosts (webcam via mediasoup) can use the existing external
 * fan-out pipeline (rtmp.js) the same way OBS/Streamlabs hosts already do.
 *
 * Approach (standard mediasoup FFmpeg-consumer pattern):
 *   1. Create a PlainTransport per room, consume the host's current audio
 *      and video producers into it over RTP (rtcpMux, comedia: false —
 *      we tell mediasoup exactly where to send RTP instead of relying on
 *      the "learn remote endpoint from first packet" behavior, since the
 *      remote endpoint (FFmpeg) is local and known in advance).
 *   2. Write an SDP file describing those two RTP streams.
 *   3. Spawn FFmpeg reading that SDP, muxing to
 *      rtmp://localhost:1935/live/{roomId} (the same input rtmp.js's
 *      fanout FFmpeg process reads from).
 *
 * This module owns ONLY the mediasoup-producer -> local-RTMP-input hop.
 * External platform fan-out (YouTube/Twitch/etc.) is unchanged — it still
 * happens via rtmp.js / POST /api/fanout-start reading from that same
 * local RTMP input, exactly as it does today for OBS-based hosts.
 */

var { spawn } = require('child_process');
var fs = require('fs');
var path = require('path');
var os = require('os');

var mediasoup = require('./mediasoup');

// roomId -> { transport, audioConsumer, videoConsumer, ffmpegProcess, sdpPath, restartCount }
var bridges = new Map();

var SAFE_ROOM_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var BRIDGE_ANNOUNCED_IP = process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1';
var MAX_RESTARTS = 3;

// ─── SDP construction ────────────────────────────────────────────────────
// FFmpeg needs a static SDP file (protocol_whitelist file,rtp,udp) describing
// where to read RTP from. Payload types/codec strings must match what the
// mediasoup router negotiated for this consumer.
function buildSdp(audioConsumer, videoConsumer, audioPort, videoPort) {
  var lines = [
    'v=0',
    'o=- 0 0 IN IP4 127.0.0.1',
    's=SeeWhy LIVE Bridge',
    'c=IN IP4 127.0.0.1',
    't=0 0'
  ];

  if (audioConsumer) {
    var aCodec = audioConsumer.rtpParameters.codecs[0];
    var aPt = aCodec.payloadType;
    lines.push(
      'm=audio ' + audioPort + ' RTP/AVP ' + aPt,
      'a=rtpmap:' + aPt + ' ' + aCodec.mimeType.split('/')[1] + '/' + aCodec.clockRate + (aCodec.channels ? '/' + aCodec.channels : ''),
      'a=recvonly'
    );
  }

  if (videoConsumer) {
    var vCodec = videoConsumer.rtpParameters.codecs[0];
    var vPt = vCodec.payloadType;
    var fmtpParts = [];
    if (vCodec.parameters) {
      Object.keys(vCodec.parameters).forEach(function(k) {
        fmtpParts.push(k + '=' + vCodec.parameters[k]);
      });
    }
    lines.push(
      'm=video ' + videoPort + ' RTP/AVP ' + vPt,
      'a=rtpmap:' + vPt + ' ' + vCodec.mimeType.split('/')[1] + '/' + vCodec.clockRate
    );
    if (fmtpParts.length > 0) {
      lines.push('a=fmtp:' + vPt + ' ' + fmtpParts.join(';'));
    }
    lines.push('a=recvonly');
  }

  return lines.join('\r\n') + '\r\n';
}

// ─── Core bridge control ─────────────────────────────────────────────────

/**
 * Start bridging roomId's current host producers into the local RTMP
 * ingest port. No-op (returns existing bridge) if already running for
 * this room. Call this from the 'go-live' handler, before rtmp fan-out
 * is expected to see a live input.
 */
async function startBridge(roomId, producerIds) {
  if (!SAFE_ROOM_RE.test(roomId)) {
    throw new Error('startBridge: invalid roomId');
  }
  if (bridges.has(roomId)) {
    return bridges.get(roomId);
  }
  if (!producerIds || (!producerIds.audio && !producerIds.video)) {
    throw new Error('startBridge: no producers to bridge for room ' + roomId);
  }

  var router = mediasoup.getOrCreateRouter ? await mediasoup.getOrCreateRouter(roomId) : null;
  if (!router) {
    throw new Error('startBridge: no router for room ' + roomId);
  }

  var transport = await router.createPlainTransport({
    listenIp: { ip: '127.0.0.1', announcedIp: null },
    rtcpMux: true,
    comedia: false // we're pushing to a known local FFmpeg process, not learning the endpoint
  });

  // FFmpeg will listen on these local UDP ports (rtcpMux: true -> one port per stream).
  var audioPort = transport.tuple.localPort;
  var videoPort = null;

  var audioConsumer = null;
  var videoConsumer = null;
  var videoTransport = null;

  try {
    if (producerIds.audio) {
      audioConsumer = await transport.consume({
        producerId: producerIds.audio,
        rtpCapabilities: router.rtpCapabilities,
        paused: true
      });
      await transport.connect({ ip: '127.0.0.1', port: audioPort, rtcpPort: audioConsumer.rtpParameters.rtcp && audioConsumer.rtpParameters.rtcp.reducedSize ? audioPort : audioPort });
    }

    if (producerIds.video) {
      // Separate PlainTransport for video (each PlainTransport binds one
      // local port pair) so audio and video can each get their own SDP m-line
      // pointed at the correct port.
      videoTransport = await router.createPlainTransport({
        listenIp: { ip: '127.0.0.1', announcedIp: null },
        rtcpMux: true,
        comedia: false
      });
      videoPort = videoTransport.tuple.localPort;

      videoConsumer = await videoTransport.consume({
        producerId: producerIds.video,
        rtpCapabilities: router.rtpCapabilities,
        paused: true
      });
      await videoTransport.connect({ ip: '127.0.0.1', port: videoPort });
    }

    var sdpDir = path.join(os.tmpdir(), 'seewhy-bridge');
    fs.mkdirSync(sdpDir, { recursive: true });
    var sdpPath = path.join(sdpDir, roomId + '.sdp');
    fs.writeFileSync(sdpPath, buildSdp(audioConsumer, videoConsumer, audioPort, videoPort || audioPort));

    var outputUrl = 'rtmp://localhost:1935/live/' + roomId;

    var ffmpegArgs = [
      '-protocol_whitelist', 'file,udp,rtp',
      '-loglevel', 'warning',
      '-fflags', '+genpts',
      '-i', sdpPath,
      '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency',
      '-c:a', 'aac', '-b:a', '128k',
      '-f', 'flv',
      outputUrl
    ];

    var logDir = '/var/log/seewhy';
    try { fs.mkdirSync(logDir, { recursive: true }); } catch (e) { /* best effort */ }
    var logStream;
    try {
      logStream = fs.createWriteStream(path.join(logDir, 'bridge-' + roomId + '.log'), { flags: 'a' });
    } catch (e) {
      logStream = null;
    }

    var ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    if (logStream) {
      ffmpegProcess.stdout.pipe(logStream);
      ffmpegProcess.stderr.pipe(logStream);
    }

    var bridge = {
      transport: transport,
      videoTransport: videoTransport,
      audioConsumer: audioConsumer,
      videoConsumer: videoConsumer,
      ffmpegProcess: ffmpegProcess,
      sdpPath: sdpPath,
      restartCount: 0,
      producerIds: producerIds
    };

    ffmpegProcess.on('exit', function(code, signal) {
      console.warn('[bridge:' + roomId + '] ffmpeg exited code=' + code + ' signal=' + signal);
      var current = bridges.get(roomId);
      if (!current || current.ffmpegProcess !== ffmpegProcess) return; // already replaced/stopped
      if (current.restartCount < MAX_RESTARTS) {
        current.restartCount += 1;
        setTimeout(function() {
          stopBridge(roomId).finally(function() {
            startBridge(roomId, producerIds).catch(function(err) {
              console.error('[bridge:' + roomId + '] restart failed: ' + err.message);
            });
          });
        }, 2000 * current.restartCount);
      } else {
        bridges.delete(roomId);
      }
    });

    bridges.set(roomId, bridge);

    // Unpause consumers once FFmpeg has had a moment to bind the SDP-declared
    // ports — mirrors mediasoup's documented ffmpeg-consumer demo pattern.
    setTimeout(function() {
      if (audioConsumer) audioConsumer.resume().catch(function() {});
      if (videoConsumer) videoConsumer.resume().catch(function() {});
    }, 1000);

    return bridge;
  } catch (err) {
    // Clean up any partially-created transports/consumers on failure
    try { if (audioConsumer) audioConsumer.close(); } catch (e) {}
    try { if (videoConsumer) videoConsumer.close(); } catch (e) {}
    try { if (transport) transport.close(); } catch (e) {}
    try { if (videoTransport) videoTransport.close(); } catch (e) {}
    throw err;
  }
}

/**
 * Stop the bridge for roomId, if running. Call this from 'end-broadcast'
 * / room-cleanup alongside rtmp.stopFanout.
 */
function stopBridge(roomId) {
  return new Promise(function(resolve) {
    var bridge = bridges.get(roomId);
    if (!bridge) return resolve();
    bridges.delete(roomId);

    try {
      if (bridge.ffmpegProcess && !bridge.ffmpegProcess.killed) {
        bridge.ffmpegProcess.once('exit', function() { resolve(); });
        bridge.ffmpegProcess.kill('SIGTERM');
        // Fallback in case 'exit' never fires
        setTimeout(resolve, 3000);
        return;
      }
    } catch (e) { /* ignore */ }

    try { if (bridge.audioConsumer) bridge.audioConsumer.close(); } catch (e) {}
    try { if (bridge.videoConsumer) bridge.videoConsumer.close(); } catch (e) {}
    try { if (bridge.transport) bridge.transport.close(); } catch (e) {}
    try { if (bridge.videoTransport) bridge.videoTransport.close(); } catch (e) {}
    try { if (bridge.sdpPath) fs.unlinkSync(bridge.sdpPath); } catch (e) {}

    resolve();
  });
}

function isBridged(roomId) {
  return bridges.has(roomId);
}

module.exports = {
  startBridge: startBridge,
  stopBridge: stopBridge,
  isBridged: isBridged
};
