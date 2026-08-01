'use strict';
var express     = require('express');
var router      = express.Router();
var https       = require('https');
var requireAuth = require('./middleware/auth');

var TTS_MODEL = process.env.TTS_MODEL || 'tts-1';
var TTS_VOICE = process.env.TTS_VOICE || 'nova';

var ALLOWED_VOICES = ['alloy', 'ash', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'];

router.get('/health', function(req, res) {
  res.json({ ok: true, model: TTS_MODEL, voice: TTS_VOICE });
});

router.post('/', requireAuth, function(req, res) {
  var apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { return res.status(503).json({ error: 'OPENAI_API_KEY not set' }); }

  var text  = (req.body && req.body.text)  || '';
  var voice = ALLOWED_VOICES.includes(req.body && req.body.voice) ? req.body.voice : TTS_VOICE;
  var speed = Math.min(Math.max(parseFloat((req.body && req.body.speed) || 1) || 1, 0.25), 4.0);

  if (!text.trim()) { return res.status(400).json({ error: 'text required' }); }

  var body = JSON.stringify({
    model:           TTS_MODEL,
    input:           text.slice(0, 4096),
    voice:           voice,
    speed:           speed,
    response_format: 'mp3',
  });

  var options = {
    hostname: 'api.openai.com',
    path:     '/v1/audio/speech',
    method:   'POST',
    headers: {
      'Authorization':  'Bearer ' + apiKey,
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  var apiReq = https.request(options, function(apiRes) {
    if (apiRes.statusCode !== 200) {
      var err = '';
      apiRes.on('data', function(c) { err += c; });
      apiRes.on('end', function() {
        try { err = JSON.parse(err); } catch(e) {}
        res.status(apiRes.statusCode).json({ error: err });
      });
      return;
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    apiRes.pipe(res);
  });

  apiReq.on('error', function(e) { res.status(500).json({ error: e.message }); });
  apiReq.write(body);
  apiReq.end();
});

module.exports = router;
