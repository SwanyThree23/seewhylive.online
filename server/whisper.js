'use strict';

const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 5 seconds of audio at 44.1 kHz, stereo, 16-bit PCM
// 44100 samples/sec × 2 channels × 2 bytes/sample × 5 seconds
const CHUNK_SIZE_LIMIT = 5 * 44100 * 2 * 2;

// Map<roomId, { chunks: Buffer[], totalBytes: number, startedAt: number }>
const roomAudioBuffers = new Map();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialises an audio buffer for a room.
 * Safe to call multiple times – will not overwrite an existing entry.
 * @param {string} roomId
 */
function initRoom(roomId) {
  if (!roomAudioBuffers.has(roomId)) {
    roomAudioBuffers.set(roomId, {
      chunks: [],
      totalBytes: 0,
      startedAt: Date.now()
    });
  }
}

/**
 * Appends an audio chunk to the room's buffer.
 * Automatically flushes when the accumulated audio exceeds CHUNK_SIZE_LIMIT.
 *
 * @param {string}   roomId
 * @param {Buffer|ArrayBuffer|Uint8Array} chunk
 * @param {function} onTranscript  called with '[TRANSCRIPT] <text>' when ready
 */
function processChunk(roomId, chunk, onTranscript) {
  if (!roomAudioBuffers.has(roomId)) {
    initRoom(roomId);
  }

  const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
  const entry = roomAudioBuffers.get(roomId);

  entry.chunks.push(buf);
  entry.totalBytes += buf.length;

  if (entry.totalBytes >= CHUNK_SIZE_LIMIT) {
    flushBuffer(roomId, onTranscript);
  }
}

/**
 * Flushes the accumulated audio buffer for a room, sends it to Whisper,
 * and calls onTranscript with the result.
 *
 * @param {string}   roomId
 * @param {function} onTranscript
 */
function flushBuffer(roomId, onTranscript) {
  if (!roomAudioBuffers.has(roomId)) return;

  const entry = roomAudioBuffers.get(roomId);
  if (entry.chunks.length === 0) return;

  // Snapshot and reset the buffer immediately so new chunks can accumulate
  const combined = Buffer.concat(entry.chunks);
  entry.chunks = [];
  entry.totalBytes = 0;
  entry.startedAt = Date.now();

  // Write to a temp file with .webm extension so Whisper accepts the container
  const tmpFile = path.join(
    os.tmpdir(),
    'seewhy-audio-' + roomId + '-' + Date.now() + '.webm'
  );

  fs.writeFile(tmpFile, combined, function(writeErr) {
    if (writeErr) {
      console.error('[whisper] Failed to write temp file for room ' + roomId + ':', writeErr.message);
      return;
    }

    openaiClient.audio.transcriptions
      .create({
        model: 'whisper-1',
        file: fs.createReadStream(tmpFile)
      })
      .then(function(transcription) {
        const text = transcription.text;
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
        // Always clean up the temp file
        fs.unlink(tmpFile, function(unlinkErr) {
          if (unlinkErr) {
            console.warn('[whisper] Could not delete temp file ' + tmpFile + ':', unlinkErr.message);
          }
        });
      });
  });
}

/**
 * Removes the room's audio buffer from memory.
 * @param {string} roomId
 */
function cleanup(roomId) {
  roomAudioBuffers.delete(roomId);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  initRoom: initRoom,
  processChunk: processChunk,
  cleanup: cleanup
};
