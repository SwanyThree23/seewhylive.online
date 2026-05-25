'use strict';

/**
 * rtmp.js - FFmpeg RTMP fanout with HLS/DASH output for SeeWhy LIVE v33.0
 * Manages one FFmpeg process per room that fans out to all destinations
 * plus writes HLS and DASH manifests for in-app playback.
 */

const { spawn } = require('child_process');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

const emitter = new EventEmitter();

// ─── Platform RTMP base URLs ──────────────────────────────────────────────
const RTMP_BASE_URLS = {
  youtube:  'rtmp://a.rtmp.youtube.com/live2',
  tiktok:   'rtmp://push.rtmp.tiktok.com/live',
  twitch:   'rtmp://live.twitch.tv/live',
  facebook: 'rtmps://live-api-s.facebook.com:443/rtmp',
  custom:   null  // caller supplies full rtmpUrl
};

// ─── Internal state ───────────────────────────────────────────────────────
// roomId → { process, destinations, restartCount, lastRestart, healthTimer }
const fanouts = new Map();

const MAX_RESTARTS  = 3;
const BASE_BACKOFF  = 2000;  // ms
const HEALTH_INTERVAL = 30000; // ms
const LOG_DIR = '/var/log/seewhy';
const HLS_DIR = '/var/www/html/hls';
const DASH_DIR = '/var/www/html/dash';

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Ensure a directory exists, creating it recursively if needed.
 * @param {string} dir
 */
function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Failed to create directory', dir, err);
    }
  }
}

/**
 * Build the FFmpeg argument array for a room's fanout.
 * @param {string} roomId
 * @param {Array<{platform: string, rtmpUrl: string, streamKey: string}>} destinations
 * @returns {string[]}
 */
function buildFfmpegArgs(roomId, destinations) {
  const inputUrl = 'rtmp://localhost:1935/live/' + roomId;
  const hlsPath  = HLS_DIR + '/' + roomId + '/index.m3u8';
  const dashPath = DASH_DIR + '/' + roomId + '/manifest.mpd';

  ensureDir(HLS_DIR + '/' + roomId);
  ensureDir(DASH_DIR + '/' + roomId);

  const args = [
    '-re',
    '-i', inputUrl,
    '-loglevel', 'warning'
  ];

  // One copy-output per RTMP destination
  for (let i = 0; i < destinations.length; i++) {
    const dest = destinations[i];
    let baseUrl = RTMP_BASE_URLS[dest.platform];
    if (dest.platform === 'custom' || !baseUrl) {
      baseUrl = dest.rtmpUrl;
    }
    const fullUrl = baseUrl + '/' + dest.streamKey;
    args.push('-c', 'copy', '-f', 'flv', fullUrl);
  }

  // HLS output
  args.push(
    '-c', 'copy',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '10',
    '-hls_flags', 'delete_segments',
    hlsPath
  );

  // DASH output
  args.push(
    '-c', 'copy',
    '-f', 'dash',
    dashPath
  );

  return args;
}

/**
 * Open (or create) a write stream for FFmpeg stderr logging.
 * @param {string} roomId
 * @returns {fs.WriteStream}
 */
function openLogStream(roomId) {
  ensureDir(LOG_DIR);
  const logFile = LOG_DIR + '/ffmpeg-' + roomId + '.log';
  return fs.createWriteStream(logFile, { flags: 'a' });
}

// ─── Core fanout control ──────────────────────────────────────────────────

/**
 * Start the FFmpeg fanout process for a room.
 * @param {string} roomId
 * @param {string} hostGuestId
 * @param {Array<{platform: string, rtmpUrl: string, streamKey: string}>} destinations
 */
function startFanout(roomId, hostGuestId, destinations) {
  if (fanouts.has(roomId)) {
    stopFanout(roomId);
  }

  const args = buildFfmpegArgs(roomId, destinations);
  const logStream = openLogStream(roomId);

  const ts = new Date().toISOString();
  logStream.write('[' + ts + '] Starting FFmpeg: ffmpeg ' + args.join(' ') + '\n');

  const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });

  proc.stderr.pipe(logStream, { end: false });

  const entry = {
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
    const errTs = new Date().toISOString();
    logStream.write('[' + errTs + '] FFmpeg process error: ' + err.message + '\n');
    console.error('FFmpeg error for room', roomId, err);
  });

  proc.on('exit', function(code, signal) {
    const exitTs = new Date().toISOString();
    logStream.write('[' + exitTs + '] FFmpeg exited code=' + code + ' signal=' + signal + '\n');
    // Health monitor will detect the dead process and handle restart
  });

  // Health monitor
  entry.healthTimer = setInterval(function() {
    healthCheck(roomId);
  }, HEALTH_INTERVAL);

  emitter.emit('fanout-started', { roomId, hostGuestId, destinations });
  console.log('FFmpeg fanout started for room', roomId, 'to', destinations.length, 'destinations');
}

/**
 * Check if the FFmpeg process for a room is alive; restart if not.
 * Exponential backoff; after MAX_RESTARTS emits 'fanout-failed'.
 * @param {string} roomId
 */
function healthCheck(roomId) {
  const entry = fanouts.get(roomId);
  if (!entry) return;

  const proc = entry.process;
  const alive = proc.exitCode === null && !proc.killed;

  if (alive) return;

  // Process is dead
  if (entry.restartCount >= MAX_RESTARTS) {
    entry.logStream.write('[' + new Date().toISOString() + '] Max restarts reached, giving up.\n');
    clearInterval(entry.healthTimer);
    fanouts.delete(roomId);
    emitter.emit('fanout-failed', { roomId });
    console.error('FFmpeg fanout permanently failed for room', roomId);
    return;
  }

  const backoff = BASE_BACKOFF * Math.pow(2, entry.restartCount);
  entry.restartCount += 1;
  entry.lastRestart = Date.now();

  entry.logStream.write(
    '[' + new Date().toISOString() + '] Restarting FFmpeg in ' + backoff + 'ms (attempt ' + entry.restartCount + '/' + MAX_RESTARTS + ')\n'
  );

  setTimeout(function() {
    const current = fanouts.get(roomId);
    if (!current) return; // room was stopped cleanly in the meantime

    const args = buildFfmpegArgs(roomId, current.destinations);
    const newProc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    newProc.stderr.pipe(current.logStream, { end: false });

    newProc.on('error', function(err) {
      current.logStream.write('[' + new Date().toISOString() + '] FFmpeg error: ' + err.message + '\n');
    });

    current.process = newProc;
    emitter.emit('fanout-restarted', { roomId, attempt: current.restartCount });
    console.log('FFmpeg fanout restarted for room', roomId, '(attempt', current.restartCount + ')');
  }, backoff);
}

/**
 * Stop the FFmpeg fanout for a room and clean up.
 * @param {string} roomId
 */
function stopFanout(roomId) {
  const entry = fanouts.get(roomId);
  if (!entry) return;

  clearInterval(entry.healthTimer);

  try {
    entry.process.kill('SIGTERM');
    // Give it 3 seconds then force-kill
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
  emitter.emit('fanout-stopped', { roomId });
  console.log('FFmpeg fanout stopped for room', roomId);
}

/**
 * Return the current status of a room's fanout.
 * @param {string} roomId
 * @returns {Object|null}
 */
function getFanoutStatus(roomId) {
  const entry = fanouts.get(roomId);
  if (!entry) return null;

  return {
    roomId:       roomId,
    alive:        entry.process.exitCode === null && !entry.process.killed,
    restartCount: entry.restartCount,
    lastRestart:  entry.lastRestart,
    destinations: entry.destinations.map(function(d) {
      return { platform: d.platform };  // omit stream keys from status
    })
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────
module.exports = {
  startFanout,
  stopFanout,
  getFanoutStatus,
  on:   emitter.on.bind(emitter),
  off:  emitter.off.bind(emitter),
  emit: emitter.emit.bind(emitter)
};
