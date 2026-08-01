'use strict';

var { OpenAI } = require('openai');
var fs = require('fs');
var path = require('path');
var os = require('os');

var openaiClient = null;
function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

var CHUNK_SIZE_LIMIT = 5 * 44100 * 2 * 2;

var roomAudioBuffers = new Map();

function initRoom(roomId) {
  if (!roomAudioBuffers.has(roomId)) {
    roomAudioBuffers.set(roomId, {
      chunks: [],
      totalBytes: 0,
      startedAt: Date.now()
    });
  }
}

function processChunk(roomId, chunk, onTranscript) {
  if (!roomAudioBuffers.has(roomId)) {
    initRoom(roomId);
  }

  var buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
  var entry = roomAudioBuffers.get(roomId);

  entry.chunks.push(buf);
  entry.totalBytes += buf.length;

  if (entry.totalBytes >= CHUNK_SIZE_LIMIT) {
    flushBuffer(roomId, onTranscript);
  }
}

function flushBuffer(roomId, onTranscript) {
  if (!roomAudioBuffers.has(roomId)) return;

  var entry = roomAudioBuffers.get(roomId);
  if (entry.chunks.length === 0) return;

  var combined = Buffer.concat(entry.chunks);
  entry.chunks = [];
  entry.totalBytes = 0;
  entry.startedAt = Date.now();

  // Guard against path traversal: roomId must be safe alphanumeric characters only
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(roomId)) {
    console.error('[whisper] Unsafe roomId rejected:', roomId);
    return;
  }
  var tmpDir  = os.tmpdir();
  var tmpFile = path.join(tmpDir, 'seewhy-audio-' + roomId + '-' + Date.now() + '.webm');
  // Verify the resolved path is actually inside tmpdir (defense-in-depth)
  if (path.resolve(tmpFile).indexOf(path.resolve(tmpDir)) !== 0) {
    console.error('[whisper] Path traversal attempt blocked for room:', roomId);
    return;
  }

  fs.writeFile(tmpFile, combined, function(writeErr) {
    if (writeErr) {
      console.error('[whisper] Failed to write temp file for room ' + roomId + ':', writeErr.message);
      return;
    }

    getOpenAIClient().audio.transcriptions
      .create({
        model: 'whisper-1',
        file: fs.createReadStream(tmpFile)
      })
      .then(function(transcription) {
        var text = transcription.text;
        if (text && text.trim().length > 0) {
          try {
            onTranscript('[TRANSCRIPT] ' + text);
          } catch (cbErr) {
            console.error('[whisper] onTranscript callback threw:', cbErr.message);
          }
        }
      })
      .catch(function(apiErr) {
        console.error('[whisper] Whisper API error for room ' + roomId + ':', apiErr.message);
      })
      .finally(function() {
        fs.unlink(tmpFile, function(unlinkErr) {
          if (unlinkErr) {
            console.warn('[whisper] Could not delete temp file ' + tmpFile + ':', unlinkErr.message);
          }
        });
      });
  });
}

function cleanup(roomId) {
  roomAudioBuffers.delete(roomId);
}

module.exports = {
  initRoom: initRoom,
  processChunk: processChunk,
  cleanup: cleanup
};
