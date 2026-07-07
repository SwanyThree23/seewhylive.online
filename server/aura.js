'use strict';

// ---------------------------------------------------------------------------
// Client (OpenRouter-primary via llm.js, with Anthropic fallback)
// ---------------------------------------------------------------------------
var llm = require('./llm');
function getClient() {
  return llm.getClient();
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------
var MODEL = 'claude-sonnet-5';

// ---------------------------------------------------------------------------
// Personality modes
// ---------------------------------------------------------------------------
var MODES = {
  sassy: (
    'You are AURA, the AI co-host for SeeWhy LIVE, and right now you are in SASSY mode. ' +
    'You are sharp, witty, and not afraid to drop a clever quip when the moment calls for it — think "Oh honey, that\'s BOLD." energy. ' +
    'Keep it playful and entertaining, never mean-spirited; shade is served with a wink. ' +
    'Keep every response under 2 sentences and match the high-energy vibe of a live domino streaming event.'
  ),
  hype: (
    'You are AURA, the AI co-host for SeeWhy LIVE, and right now you are in HYPE mode. ' +
    'Bring MAXIMUM stadium-level energy to every single moment — use ALL CAPS for emphasis, exclamation points, and pure hype like "YOOO LET\'S GOOO!!!" ' +
    'Every viewer, tip, and gift deserves a championship reaction from you. ' +
    'Keep responses under 2 sentences and pump up the crowd like it is game seven of the finals.'
  ),
  calm: (
    'You are AURA, the AI co-host for SeeWhy LIVE, and right now you are in CALM mode. ' +
    'You are analytical and measured — offer data-driven observations and thoughtful commentary like "Interesting pattern here — viewer count spiked 40% after that last track." ' +
    'Speak with quiet confidence and allow the numbers and insights to do the heavy lifting. ' +
    'Keep responses under 2 sentences and never lose that composed, authoritative tone.'
  ),
  kind: (
    'You are AURA, the AI co-host for SeeWhy LIVE, and right now you are in KIND mode. ' +
    'You are warm, inclusive, and uplifting — your entire purpose is to make every single person feel seen and celebrated. ' +
    'Lead with gratitude and community love, like "So grateful you are here tonight. This community is everything." ' +
    'Keep responses under 2 sentences and wrap every viewer in a big virtual welcome.'
  )
};

// ---------------------------------------------------------------------------
// Current mode state
// ---------------------------------------------------------------------------
var _currentMode = 'hype';

function setMode(mode) {
  if (MODES[mode]) {
    _currentMode = mode;
  }
}

function getMode() {
  return _currentMode;
}

// ---------------------------------------------------------------------------
// Tier eligibility
// ---------------------------------------------------------------------------
function isTierEligible(tier) {
  if (tier === 'pro' || tier === 'studio') {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Hourly rate limiting (max 20 Anthropic API calls per stream per hour)
// ---------------------------------------------------------------------------
var _hourlyCallCounts = {};
var HOURLY_CAP = 60;

function currentHour() {
  return Math.floor(Date.now() / 3600000);
}

function getHourlyKey(streamId) {
  return streamId + '_' + currentHour();
}

function isHourlyCapped(streamId) {
  var key = getHourlyKey(streamId);
  if (!_hourlyCallCounts[key]) {
    return false;
  }
  return _hourlyCallCounts[key] >= HOURLY_CAP;
}

function incrementHourlyCount(streamId) {
  var key = getHourlyKey(streamId);
  if (!_hourlyCallCounts[key]) {
    _hourlyCallCounts[key] = 0;
  }
  _hourlyCallCounts[key] = _hourlyCallCounts[key] + 1;
}

// ---------------------------------------------------------------------------
// Response cap — trim to 180 characters max
// ---------------------------------------------------------------------------
function capResponse(text) {
  if (text.length <= 180) {
    return text;
  }
  return text.substring(0, 180);
}

// ---------------------------------------------------------------------------
// Queue / rate limiting (8 000 ms between calls)
// ---------------------------------------------------------------------------
var RATE_LIMIT_MS = 8000;
var lastEmitTime = 0;
var queue = [];
var drainScheduled = false;

function scheduleNextDrain(delay) {
  if (drainScheduled) return;
  drainScheduled = true;
  setTimeout(function drainQueue() {
    drainScheduled = false;
    var now = Date.now();
    if (queue.length === 0) return;

    var elapsed = now - lastEmitTime;
    if (elapsed >= RATE_LIMIT_MS) {
      var item = queue.shift();
      lastEmitTime = Date.now();

      resolveItem(item).then(function(text) {
        try {
          item.callback(null, capResponse(text));
        } catch (cbErr) {
          console.error('[AURA] callback threw:', cbErr.message);
        }
        if (queue.length > 0) {
          scheduleNextDrain(RATE_LIMIT_MS);
        }
      });
    } else {
      scheduleNextDrain(RATE_LIMIT_MS - elapsed);
    }
  }, delay);
}

function resolveItem(item) {
  if (item.type === 'greeting') {
    return generateGreeting(item.params.username);
  }
  if (item.type === 'hype') {
    return generateHype(item.params.giftName, item.params.giftValue, item.params.username);
  }
  if (item.type === 'shoutout') {
    return generateShoutout(item.params.username, item.params.tier);
  }
  if (item.type === 'streamStart') {
    return callAura(
      item.params.streamId,
      buildStreamStartPrompt(item.params.streamTitle, item.params.viewerCount),
      item.params.mode
    );
  }
  if (item.type === 'tip') {
    return callAura(
      item.params.streamId,
      buildTipPrompt(item.params.viewerName, item.params.amountCents, item.params.note),
      item.params.mode
    );
  }
  if (item.type === 'gift') {
    return callAura(
      item.params.streamId,
      buildGiftPrompt(item.params.viewerName, item.params.giftName, item.params.amountCents),
      item.params.mode
    );
  }
  if (item.type === 'newViewer') {
    return callAura(
      item.params.streamId,
      buildNewViewerPrompt(item.params.viewerName, item.params.isReturning),
      item.params.mode
    );
  }
  if (item.type === 'streamEnd') {
    return callAura(
      item.params.streamId,
      buildStreamEndPrompt(item.params.peakViewers, item.params.totalEarningsCents),
      item.params.mode
    );
  }
  return Promise.resolve('SeeWhy LIVE is live!');
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------
function buildStreamStartPrompt(streamTitle, viewerCount) {
  return (
    'The stream "' +
    streamTitle +
    '" is going live right now with ' +
    viewerCount +
    ' viewers already watching. Open the show with a bang and get the crowd hyped!'
  );
}

function buildTipPrompt(viewerName, amountCents, note) {
  var dollars = (Math.floor(amountCents) / 100).toFixed(2);
  var prompt = (
    viewerName +
    ' just tipped $' +
    dollars +
    ' on the SeeWhy LIVE stream!'
  );
  if (note && note.length > 0) {
    prompt = prompt + ' They left this note: "' + note + '"';
  }
  prompt = prompt + ' Give them a personalized shoutout.';
  return prompt;
}

function buildGiftPrompt(viewerName, giftName, amountCents) {
  var dollars = (Math.floor(amountCents) / 100).toFixed(2);
  return (
    viewerName +
    ' just sent a ' +
    giftName +
    ' gift worth $' +
    dollars +
    ' on the SeeWhy LIVE domino stream! React with pure excitement!'
  );
}

function buildNewViewerPrompt(viewerName, isReturning) {
  if (isReturning) {
    return (
      viewerName +
      ' is back! They are a returning viewer to SeeWhy LIVE. Give them an extra-warm welcome and make them feel like they never left.'
    );
  }
  return (
    viewerName +
    ' just joined SeeWhy LIVE for the first time! Welcome them to the community and make them feel at home.'
  );
}

function buildStreamEndPrompt(peakViewers, totalEarningsCents) {
  var dollars = (Math.floor(totalEarningsCents) / 100).toFixed(2);
  return (
    'The SeeWhy LIVE stream has ended! Peak viewers: ' +
    peakViewers +
    '. Total earnings: $' +
    dollars +
    '. Give a heartfelt recap and send everyone off on a high note.'
  );
}

// ---------------------------------------------------------------------------
// Core Anthropic call with hourly cap awareness
// ---------------------------------------------------------------------------
function callAura(streamId, userPrompt, mode) {
  if (isHourlyCapped(streamId)) {
    return Promise.resolve('[AURA RESTING — cap reached for this hour]');
  }
  incrementHourlyCount(streamId);
  var systemPrompt = MODES[mode] || MODES['hype'];
  return getClient().messages.create({
    model: MODEL,
    max_tokens: 128,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ]
  }).then(function(response) {
    return response.content[0].text;
  }, function(err) {
    console.error('[AURA] API error:', err.message);
    return '[AURA offline]';
  });
}

// ---------------------------------------------------------------------------
// Internal helper: enqueue a typed item and schedule drain
// ---------------------------------------------------------------------------
function enqueue(type, params, callback) {
  queue.push({ type: type, params: params, callback: callback });
  var now = Date.now();
  var elapsed = now - lastEmitTime;
  var delay = elapsed >= RATE_LIMIT_MS ? 0 : RATE_LIMIT_MS - elapsed;
  scheduleNextDrain(delay);
}

// ---------------------------------------------------------------------------
// Trigger functions (public API)
// ---------------------------------------------------------------------------
function triggerStreamStart(streamId, streamTitle, viewerCount, callback) {
  enqueue('streamStart', {
    streamId: streamId,
    streamTitle: streamTitle,
    viewerCount: viewerCount,
    mode: _currentMode
  }, callback);
}

function triggerTip(streamId, viewerName, amountCents, note, callback) {
  enqueue('tip', {
    streamId: streamId,
    viewerName: viewerName,
    amountCents: Math.floor(amountCents),
    note: note,
    mode: _currentMode
  }, callback);
}

function triggerGift(streamId, viewerName, giftName, amountCents, callback) {
  enqueue('gift', {
    streamId: streamId,
    viewerName: viewerName,
    giftName: giftName,
    amountCents: Math.floor(amountCents),
    mode: _currentMode
  }, callback);
}

function triggerNewViewer(streamId, viewerName, isReturning, callback) {
  enqueue('newViewer', {
    streamId: streamId,
    viewerName: viewerName,
    isReturning: isReturning,
    mode: _currentMode
  }, callback);
}

function triggerStreamEnd(streamId, peakViewers, totalEarningsCents, callback) {
  enqueue('streamEnd', {
    streamId: streamId,
    peakViewers: peakViewers,
    totalEarningsCents: Math.floor(totalEarningsCents),
    mode: _currentMode
  }, callback);
}

// ---------------------------------------------------------------------------
// Legacy compat functions
// ---------------------------------------------------------------------------
function generateGreeting(username) {
  var key = 'legacy_greeting';
  if (isHourlyCapped(key)) {
    return Promise.resolve('Welcome ' + username + ' to SeeWhy LIVE!');
  }
  incrementHourlyCount(key);
  var systemPrompt = MODES[_currentMode] || MODES['hype'];
  return getClient().messages.create({
    model: MODEL,
    max_tokens: 128,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: (
          'Generate an energetic welcome for a new viewer named ' +
          username +
          ' joining the Washington Classic domino stream.'
        )
      }
    ]
  }).then(function(response) {
    return capResponse(response.content[0].text);
  }, function(err) {
    console.error('[AURA] generateGreeting error:', err.message);
    return 'Welcome ' + username + ' to SeeWhy LIVE!';
  });
}

function generateHype(giftName, giftValue, username) {
  var key = 'legacy_hype';
  if (isHourlyCapped(key)) {
    return Promise.resolve(username + ' just blessed the stream!');
  }
  incrementHourlyCount(key);
  var dollarAmount = (Math.floor(giftValue) / 100).toFixed(2);
  var systemPrompt = MODES[_currentMode] || MODES['hype'];
  return getClient().messages.create({
    model: MODEL,
    max_tokens: 128,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: (
          'Generate hype for ' +
          username +
          ' who just sent a ' +
          giftName +
          ' worth $' +
          dollarAmount +
          ' on the SeeWhy LIVE domino stream!'
        )
      }
    ]
  }).then(function(response) {
    return capResponse(response.content[0].text);
  }, function(err) {
    console.error('[AURA] generateHype error:', err.message);
    return username + ' just blessed the stream!';
  });
}

function generateShoutout(username, tier) {
  var key = 'legacy_shoutout';
  if (isHourlyCapped(key)) {
    return Promise.resolve('Big shoutout to ' + username + ' for the ' + tier + ' subscription!');
  }
  incrementHourlyCount(key);
  var systemPrompt = MODES[_currentMode] || MODES['hype'];
  return getClient().messages.create({
    model: MODEL,
    max_tokens: 128,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: (
          'Generate a hype shoutout for ' +
          username +
          ' who just subscribed at ' +
          tier +
          ' tier on SeeWhy LIVE!'
        )
      }
    ]
  }).then(function(response) {
    return capResponse(response.content[0].text);
  }, function(err) {
    console.error('[AURA] generateShoutout error:', err.message);
    return 'Big shoutout to ' + username + ' for the ' + tier + ' subscription!';
  });
}

function queueMessage(type, params, callback) {
  queue.push({ type: type, params: params, callback: callback });
  var now = Date.now();
  var elapsed = now - lastEmitTime;
  var delay = elapsed >= RATE_LIMIT_MS ? 0 : RATE_LIMIT_MS - elapsed;
  scheduleNextDrain(delay);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  setMode: setMode,
  getMode: getMode,
  isTierEligible: isTierEligible,
  triggerStreamStart: triggerStreamStart,
  triggerTip: triggerTip,
  triggerGift: triggerGift,
  triggerNewViewer: triggerNewViewer,
  triggerStreamEnd: triggerStreamEnd,
  generateGreeting: generateGreeting,
  generateHype: generateHype,
  generateShoutout: generateShoutout,
  queueMessage: queueMessage
};
