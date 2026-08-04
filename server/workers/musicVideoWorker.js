'use strict';

// PM2 worker — runs as a separate process alongside seewhy-server.
// Start: pm2 start /opt/seewhy/server/workers/musicVideoWorker.js --name seewhy-mv-worker
//
// Polls music_video_jobs for pending work every POLL_MS, runs FFmpeg
// audio-visualizer filter chains, writes output to MEDIA_DIR.
// All five styles use built-in FFmpeg filters — no external API needed.

var { Pool }  = require('pg');
var { spawn } = require('child_process');
var fs        = require('fs');
var path      = require('path');

var pool      = new Pool({ connectionString: process.env.SUPABASE_DB_URL });
var MEDIA_DIR = process.env.MEDIA_DIR || '/opt/seewhy/media/mv';
var POLL_MS   = 5000;
var MAX_SECS  = 180; // cap generated video at 3 minutes

try { fs.mkdirSync(MEDIA_DIR, { recursive: true }); } catch (e) { /* ok */ }

// ── FFmpeg filter chains per style ──────────────────────────────────────────
// All render a 1280×720 MP4 with libx264/aac.
// Colors match SeeWhy design tokens: #C9A84C gold, #FF1A3C live-red, #0E0C09 bg.

function filterFor(style, w, h) {
  var bg = 'color=c=#0E0C09:size=' + w + 'x' + h + ':r=25[bg]';
  switch (style) {
    case 'neon_pulse':
      return bg + ';[0:a]showspectrum=size=' + w + 'x' + h +
             ':mode=combined:color=cool:scale=sqrt[sp];[bg][sp]overlay=0:0[v]';
    case 'urban_night':
      return bg + ';[0:a]avectorscope=size=' + w + 'x' + h +
             ':mode=lissajous:zoom=3:draw=line:scale=sqrt[sc];[bg][sc]overlay=0:0[v]';
    case 'abstract_wave':
      return bg + ';[0:a]showwaves=size=' + w + 'x' + h +
             ':mode=p2p:rate=25:colors=#F0E8D4[w];[bg][w]overlay=0:0[v]';
    case 'fire_storm':
      return bg + ';[0:a]showwaves=size=' + w + 'x' + h +
             ':mode=cline:rate=25:colors=#FF1A3C|#C9A84C[w];[bg][w]overlay=0:0[v]';
    case 'lyric_visualizer':
    default:
      return bg + ';[0:a]showwaves=size=' + w + 'x' + h +
             ':mode=cline:rate=25:colors=#C9A84C[w];[bg][w]overlay=0:0[v]';
  }
}

function buildArgs(audioPath, outputPath, style) {
  return [
    '-i', audioPath,
    '-filter_complex', filterFor(style, 1280, 720),
    '-map', '[v]',
    '-map', '0:a',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-t', String(MAX_SECS),
    '-y',
    outputPath,
  ];
}

// ── Process one job ─────────────────────────────────────────────────────────
async function processJob(job) {
  var outputName = 'mv_' + job.id + '.mp4';
  var outputPath = path.join(MEDIA_DIR, outputName);

  console.log('[mv-worker] start job', job.id, 'style:', job.style);

  await pool.query(
    "UPDATE music_video_jobs SET status='processing', updated_at=NOW() WHERE id=$1",
    [job.id]
  );

  return new Promise(function(resolve, reject) {
    var args = buildArgs(job.audio_path, outputPath, job.style);
    var proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    var stderr = '';
    proc.stderr.on('data', function(d) { stderr += d.toString(); });

    proc.on('close', async function(code) {
      // Clean up temp audio regardless of outcome
      fs.unlink(job.audio_path, function() {});

      if (code !== 0) {
        var msg = 'ffmpeg exit ' + code + ': ' + stderr.slice(-400);
        console.error('[mv-worker] ffmpeg failed job', job.id, msg);
        await pool.query(
          "UPDATE music_video_jobs SET status='failed', error=$1, updated_at=NOW() WHERE id=$2",
          [msg.slice(0, 1000), job.id]
        ).catch(function() {});
        return reject(new Error(msg));
      }

      await pool.query(
        "UPDATE music_video_jobs SET status='done', output_path=$1, updated_at=NOW() WHERE id=$2",
        [outputPath, job.id]
      );
      console.log('[mv-worker] done job', job.id, '->', outputPath);
      resolve();
    });

    proc.on('error', async function(err) {
      console.error('[mv-worker] spawn error:', err.message);
      await pool.query(
        "UPDATE music_video_jobs SET status='failed', error=$1, updated_at=NOW() WHERE id=$2",
        ['ffmpeg spawn error: ' + err.message, job.id]
      ).catch(function() {});
      reject(err);
    });
  });
}

// ── Poll loop ────────────────────────────────────────────────────────────────
var busy = false;

async function tick() {
  if (busy) return;
  busy = true;
  try {
    var result = await pool.query(
      "SELECT * FROM music_video_jobs WHERE status='pending' ORDER BY created_at ASC LIMIT 1"
    );
    var job = result.rows[0];
    if (job) await processJob(job).catch(function() {});
  } catch (e) {
    console.error('[mv-worker] poll error:', e.message);
  } finally {
    busy = false;
  }
}

console.log('[mv-worker] started, polling every', POLL_MS, 'ms');
setInterval(tick, POLL_MS);
tick();
