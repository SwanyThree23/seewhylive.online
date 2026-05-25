'use strict';

const Anthropic = require('@anthropic-ai/sdk');

let _anthropicClient = null;
function getClient() {
  if (!_anthropicClient) {
    _anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropicClient;
}

const MODEL = 'claude-sonnet-4-20250514';
const SYSTEM_PROMPT =
  'You are AURA, the AI co-host for SeeWhy LIVE Washington Classic stream. ' +
  'You are energetic, hype, and supportive of domino culture. ' +
  'Keep responses under 2 sentences. Match the energy of the room.';

const RATE_LIMIT_MS = 8000;

let lastEmitTime = 0;
const queue = []; // Array of { type, params, callback }
let drainScheduled = false;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function scheduleNextDrain(delay) {
  if (drainScheduled) return;
  drainScheduled = true;
  setTimeout(function drainQueue() {
    drainScheduled = false;
    const now = Date.now();
    if (queue.length === 0) return;

    const elapsed = now - lastEmitTime;
    if (elapsed >= RATE_LIMIT_MS) {
      const item = queue.shift();
      lastEmitTime = Date.now();

      resolveItem(item).then(function(text) {
        try {
          item.callback(text);
        } catch (cbErr) {
          console.error('[AURA] callback threw:', cbErr.message);
        }
        // If more items remain, schedule another drain
        if (queue.length > 0) {
          scheduleNextDrain(RATE_LIMIT_MS);
        }
      });
    } else {
      // Not enough time passed yet; reschedule for the remaining window
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

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Generates an energetic welcome message for a new viewer.
 * @param {string} username
 * @returns {Promise<string>}
 */
async function generateGreeting(username) {
  try {
    const response = await getClient().messages.create({
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

/**
 * Generates hype copy for a gift event.
 * @param {string} giftName
 * @param {number} giftValue  cents
 * @param {string} username
 * @returns {Promise<string>}
 */
async function generateHype(giftName, giftValue, username) {
  try {
    const dollarAmount = (giftValue / 100).toFixed(2);
    const response = await getClient().messages.create({
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

/**
 * Generates a hype shoutout for a new subscriber.
 * @param {string} username
 * @param {string} tier
 * @returns {Promise<string>}
 */
async function generateShoutout(username, tier) {
  try {
    const response = await getClient().messages.create({
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

/**
 * Queues an AURA message request to be sent respecting the 8-second rate limit.
 * @param {'greeting'|'hype'|'shoutout'} type
 * @param {object} params
 * @param {function} callback  called with the generated text string
 */
function queueMessage(type, params, callback) {
  queue.push({ type: type, params: params, callback: callback });

  const now = Date.now();
  const elapsed = now - lastEmitTime;
  const delay = elapsed >= RATE_LIMIT_MS ? 0 : RATE_LIMIT_MS - elapsed;
  scheduleNextDrain(delay);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  generateGreeting: generateGreeting,
  generateHype: generateHype,
  generateShoutout: generateShoutout,
  queueMessage: queueMessage
};
