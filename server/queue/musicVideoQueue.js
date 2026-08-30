'use strict';
// BullMQ producer for music-video jobs. Used by routes/musicVideo.js.
// Consumer lives in workers/musicVideoWorker.js.

var { Queue } = require('bullmq');

var connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

var musicVideoQueue = new Queue('music-video', { connection: connection });

module.exports = { musicVideoQueue: musicVideoQueue };
