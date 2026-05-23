'use strict';

/**
 * rtmp.js - FFmpeg RTMP fanout with HLS/DASH output for SeeWhy LIVE v33.0
 * Manages one FFmpeg process per room that fans out to all destinations
 * plus writes HLS and DASH manifests for in-app playback.
 */

var { spawn } = require('child_process');
var EventEmitter = require('events');
var fs = require('fs');
var path = require('path');

var emitter = new EventEmitter();

// ─── Platform RTMP base URLs ──────────────────────────────────────────────
var RTMP_BASE_URLS = {
  youtube:  'rtmp://a.rtmp.youtube.com/live2',
  tiktok:   'rtmp://push.rtmp.tiktok.com/live',
  twitch:   'rtmp://live.twitch.tv/live',
  facebook: 'rtmps://live-api-s.facebook.com:443/rtmp',
  custom:   null  // caller supplies full rtmpUrl
};

// ─── Internal state ───────────────────────────────────────────────────────
// roomId → { process, destinations, restartCount, lastRestart, healthTimer }
var fanouts = new Map();

var MAX_RESTARTS  = 3;
var BASE_BACKOFF  = 2000;  // ms
var HEALTH_INTERVAL = 30000; // ms
var LOG_DIR = '/var/log/seewhy';
var HLS_DIR = '/var/www/html/hls';
var DASH_DIR = '/var/www/html/dash';

// ─── Helpers ──────────────────────────────────────────────────────────────

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Failed to create directory', dir, err);
    }
  }
}

function buildFfmpegArgs(roomId, destinations) {
  var inputUrl = 'rtmp://localhost:1935/live/' + roomId;
  var hlsPath  = HLS_DIR + '/' + roomId + '/index.m3u8';
  var dashPath = DASH_DIR + '/' + roomId + '/manifest.mpd';

  ensureDir(HLS_DIR + '/' + roomId);
  ensureDir(DASH_DIR + '/' + roomId);

  var args = [
    '-re',
    '-i', inputUrl,
    '-loglevel', 'warning'
  ];

  for (var i = 0; i < destinations.length; i++) {
    var dest = destinations[i];
    var baseUrl = RTMP_BASE_URLS[dest.platform];
    if (dest.platform === 'custom' || !baseUrl) {
      baseUrl = dest.rtmpUrl;
    }
    var fullUrl = baseUrl + '/' + dest.streamKey;
    args.push('-c', 'copy', '-f', 'flv', fullUrl);
  }

  args.push(
    '-c', 'copy',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '10',
    '-hls_flags', 'delete_segments',
    hlsPath
  );

  args.push(
    '-c', 'copy',
    '-f', 'dash',
    dashPath
  );

  return args;
}

function openLogStream(roomId) {
  ensureDir(LOG_DIR);
  var logFile = LOG_DIR + '/ffmpeg-' + roomId + '.log';
  return fs.createWriteStream(logFile, { flags: 'a' });
}

// ─── Core fanout control ──────────────────────────────────────────────────

function startFanout(roomId, hostGuestId, destinations) {
  if (fanouts.has(roomId)) {
    stopFanout(roomId);
  }

  var args = buildFfmpegArgs(roomId, destinations);
  var logStream = openLogStream(roomId);

  var ts = new Date().toISOString();
  logStream.write('[' + ts + '] Starting FFmpeg: ffmpeg ' + args.join(' ') + '\n');

  var proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });

  proc.stderr.pipe(logStream, { end: false });

  var entry = {
    process:      proc,
    destinations: destinations,
    restartCount: 0,
    lastRestart:  Date.now(),
    healthTimer:  null,
    logStream:    logStream,
    hostGuestId:  hostGuestId
  };

  fanouts.set(roomId, entry);

  proc.on('error', function(err) {
    var errTs = new Date().toISOString();
    logStream.write('[' + errTs + '] FFmpeg process error: ' + err.message + '\n');
    console.error('FFmpeg error for room', roomId, err);
  });

  proc.on('exit', function(code, signal) {
    var exitTs = new Date().toISOString();
    logStream.write('[' + exitTs + '] FFmpeg exited code=' + code + ' signal=' + signal + '\n');
  });

  entry.healthTimer = setInterval(function() {
    healthCheck(roomId);
  }, HEALTH_INTERVAL);

  emitter.emit('fanout-started', { roomId: roomId, hostGuestId: hostGuestId, destinations: destinations });
  console.log('FFmpeg fanout started for room', roomId, 'to', destinations.length, 'destinations');
}

function healthCheck(roomId) {
  var entry = fanouts.get(roomId);
  if (!entry) return;

  var proc = entry.process;
  var alive = proc.exitCode === null && !proc.killed;

  if (alive) return;

  if (entry.restartCount >= MAX_RESTARTS) {
    entry.logStream.write('[' + new Date().toISOString() + '] Max restarts reached, giving up.\n');
    clearInterval(entry.healthTimer);
    fanouts.delete(roomId);
    emitter.emit('fanout-failed', { roomId: roomId });
    console.error('FFmpeg fanout permanently failed for room', roomId);
    return;
  }

  var backoff = BASE_BACKOFF * Math.pow(2, entry.restartCount);
  entry.restartCount += 1;
  entry.lastRestart = Date.now();

  entry.logStream.write(
    '[' + new Date().toISOString() + '] Restarting FFmpeg in ' + backoff + 'ms (attempt ' + entry.restartCount + '/' + MAX_RESTARTS + ')\n'
  );

  setTimeout(function() {
    var current = fanouts.get(roomId);
    if (!current) return;

    var args = buildFfmpegArgs(roomId, current.destinations);
    var newProc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    newProc.stderr.pipe(current.logStream, { end: false });

    newProc.on('error', function(err) {
      current.logStream.write('[' + new Date().toISOString() + '] FFmpeg error: ' + err.message + '\n');
    });

    current.process = newProc;
    emitter.emit('fanout-restarted', { roomId: roomId, attempt: current.restartCount });
    console.log('FFmpeg fanout restarted for room', roomId, '(attempt', current.restartCount + ')');
  }, backoff);
}

function stopFanout(roomId) {
  var entry = fanouts.get(roomId);
  if (!entry) return;

  clearInterval(entry.healthTimer);

  try {
    entry.process.kill('SIGTERM');
    setTimeout(function() {
      try {
        if (entry.process.exitCode === null) {
          entry.process.kill('SIGKILL');
        }
      } catch (e) { /* already dead */ }
    }, 3000);
  } catch (err) {
    console.error('Error killing FFmpeg for room', roomId, err);
  }

  entry.logStream.write('[' + new Date().toISOString() + '] Fanout stopped.\n');
  entry.logStream.end();

  fanouts.delete(roomId);
  emitter.emit('fanout-stopped', { roomId: roomId });
  console.log('FFmpeg fanout stopped for room', roomId);
}

function getFanoutStatus(roomId) {
  var entry = fanouts.get(roomId);
  if (!entry) return null;

  return {
    roomId:       roomId,
    alive:        entry.process.exitCode === null && !entry.process.killed,
    restartCount: entry.restartCount,
    lastRestart:  entry.lastRestart,
    destinations: entry.destinations.map(function(d) {
      return { platform: d.platform };
    })
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────
module.exports = {
  startFanout: startFanout,
  stopFanout: stopFanout,
  getFanoutStatus: getFanoutStatus,
  on:   emitter.on.bind(emitter),
  off:  emitter.off.bind(emitter),
  emit: emitter.emit.bind(emitter)
};
