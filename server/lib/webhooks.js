'use strict';
/**
 * server/lib/webhooks.js
 * Thin facade over webhookService — named helpers for each dispatch event.
 * Import this from anywhere in server/ instead of calling webhookService directly.
 */
var webhookService = require('../services/webhookService');

var EVENTS = {
  ROOM_STARTED:  'room.started',
  ROOM_ENDED:    'room.ended',
  USER_JOINED:   'user.joined',
  HAND_RAISED:   'hand.raised',
  BATTLE_RESULT: 'battle.result',
  TIP_RECEIVED:  'tip.received',
  CLIP_READY:    'clip.ready',
};

function dispatch(hostId, tenantId, event, payload) {
  if (!hostId || !event) return;
  try {
    webhookService.fireWebhooks(hostId, tenantId || '', event, payload || {});
  } catch (_e) {}
}

function tipReceived(hostId, tenantId, payload) {
  dispatch(hostId, tenantId, EVENTS.TIP_RECEIVED, payload);
}

function clipReady(hostId, tenantId, payload) {
  dispatch(hostId, tenantId, EVENTS.CLIP_READY, payload);
}

module.exports = {
  dispatch:     dispatch,
  tipReceived:  tipReceived,
  clipReady:    clipReady,
  EVENTS:       EVENTS,
};
