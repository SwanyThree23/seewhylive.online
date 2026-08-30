'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// PM2 worker — runs as a separate process alongside seewhy-server.
// Start: pm2 start /opt/seewhy/server/workers/musicVideoWorker.js --name seewhy-mv-worker
//
// Consumes the BullMQ 'music-video' queue (server/queue/musicVideoQueue.js).
// Jobs are enqueued by routes/musicVideo.js on submit. Runs FFmpeg
// audio-visualizer filter chains, writes output to MEDIA_DIR.
// All five styles use built-in FFmpeg filters — no external API needed.

var { Pool } = require('pg');
var { Worker, Queue } = require('bullmq');
var { spawn } = require('child_process');
var fs = require('fs');
var path = require('path');

var pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });
var MEDIA_DIR = process.env.MEDIA_DIR || '/opt/seewhy/media/mv';
var MAX_SECS = 180; // cap generated video at 3 minutes

var connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

try { fs.mkdirSync(MEDIA_DIR, { recursive: true }); } catch (e) { /* ok */ }

// ---- FFmpeg filter chains per style ----------------------------------
// All render a 1280x720 MP4 with libx264/aac.
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

// ---- Process one job ---------------------------------------------------
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
    proc.stderr.on('data', function(d) { stderr = (stderr + d.toString()).slice(-2000); });

    proc.on('close', async function(code) {
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

// ---- BullMQ consumer -----------------------------------------------------
// Concurrency capped at 2 — ffmpeg is CPU-heavy and this VPS has 2 cores.
var musicVideoQueue = new Queue('music-video', { connection: connection });

var worker = new Worker('music-video', async function(bullJob) {
  var result = await pool.query(
    'SELECT * FROM music_video_jobs WHERE id=$1',
    [bullJob.data.jobId]
  );
  var row = result.rows[0];
  if (!row) {
    console.warn('[mv-worker] job row not found, skipping', bullJob.data.jobId);
    return;
  }
  if (row.status === 'done' || row.status === 'failed') {
    console.log('[mv-worker] job already', row.status, '- skipping', row.id);
    return;
  }
  await processJob(row);
}, { connection: connection, concurrency: 2 });

worker.on('completed', function(bullJob) {
  console.log('[mv-worker] queue job completed', bullJob.id);
});
worker.on('failed', function(bullJob, err) {
  console.error('[mv-worker] queue job failed', bullJob && bullJob.id, err && err.message);
});

// ---- One-time startup sweep for orphaned pending rows --------------------
// Catches jobs whose DB row was inserted but never made it into the queue
// (e.g. app crashed between INSERT and queue.add), or leftover rows from
// before this BullMQ migration.
(async function requeueOrphans() {
  try {
    var result = await pool.query(
      "SELECT id FROM music_video_jobs WHERE status='pending' ORDER BY created_at ASC LIMIT 50"
    );
    for (var i = 0; i < result.rows.length; i++) {
      await musicVideoQueue.add('render', { jobId: result.rows[i].id });
      console.log('[mv-worker] requeued orphaned job', result.rows[i].id);
    }
  } catch (e) {
    console.error('[mv-worker] orphan sweep error:', e.message);
  }
})();

console.log('[mv-worker] started, consuming music-video queue via BullMQ');

// ---- Graceful shutdown -----------------------------------------------------
async function shutdown() {
  console.log('[mv-worker] shutting down...');
  try { await worker.close(); } catch (e) {}
  try { await musicVideoQueue.close(); } catch (e) {}
  try { await pool.end(); } catch (e) {}
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
