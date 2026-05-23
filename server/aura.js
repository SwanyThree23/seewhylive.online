'use strict';

var Anthropic = require('@anthropic-ai/sdk');

var _anthropicClient = null;
function getClient() {
  if (!_anthropicClient) {
    _anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropicClient;
}

var MODEL = 'claude-sonnet-4-20250514';
var SYSTEM_PROMPT =
  'You are AURA, the AI co-host for SeeWhy LIVE Washington Classic stream. ' +
  'You are energetic, hype, and supportive of domino culture. ' +
  'Keep responses under 2 sentences. Match the energy of the room.';

var RATE_LIMIT_MS = 8000;

var lastEmitTime = 0;
var queue = []; // Array of { type, params, callback }
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
          item.callback(text);
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
  return Promise.resolve('SeeWhy LIVE is live! 🔥');
}

async function generateGreeting(username) {
  try {
    var response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 128,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content:
            'Generate an energetic welcome for a new viewer named ' +
            username +
            ' joining the Washington Classic domino stream.'
        }
      ]
    });
    return response.content[0].text;
  } catch (err) {
    console.error('[AURA] generateGreeting error:', err.message);
    return 'Welcome ' + username + ' to SeeWhy LIVE! 🔥';
  }
}

async function generateHype(giftName, giftValue, username) {
  try {
    var dollarAmount = (giftValue / 100).toFixed(2);
    var response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 128,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content:
            'Generate hype for ' +
            username +
            ' who just sent a ' +
            giftName +
            ' worth $' +
            dollarAmount +
            ' on the SeeWhy LIVE domino stream!'
        }
      ]
    });
    return response.content[0].text;
  } catch (err) {
    console.error('[AURA] generateHype error:', err.message);
    return username + ' just blessed the stream! 🎁🔥';
  }
}

async function generateShoutout(username, tier) {
  try {
    var response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 128,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content:
            'Generate a hype shoutout for ' +
            username +
            ' who just subscribed at ' +
            tier +
            ' tier on SeeWhy LIVE!'
        }
      ]
    });
    return response.content[0].text;
  } catch (err) {
    console.error('[AURA] generateShoutout error:', err.message);
    return 'Big shoutout to ' + username + ' for the ' + tier + ' subscription! 🙌';
  }
}

function queueMessage(type, params, callback) {
  queue.push({ type: type, params: params, callback: callback });

  var now = Date.now();
  var elapsed = now - lastEmitTime;
  var delay = elapsed >= RATE_LIMIT_MS ? 0 : RATE_LIMIT_MS - elapsed;
  scheduleNextDrain(delay);
}

module.exports = {
  generateGreeting: generateGreeting,
  generateHype: generateHype,
  generateShoutout: generateShoutout,
  queueMessage: queueMessage
};
