// frontend/src/services/battleService.js
// Base44-ruleset compliant: function expressions only, var only, no optional chaining/??.

var API_BASE = '/api/battles';

var battleService = {
  createChallenge: function (opponentId, mode, durationSeconds) {
    return fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ opponentId: opponentId, mode: mode, durationSeconds: durationSeconds }),
    }).then(function (r) { return r.json(); });
  },

  acceptChallenge: function (battleId, challengerRoomId, opponentRoomId) {
    return fetch(API_BASE + '/' + battleId + '/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ challengerRoomId: challengerRoomId, opponentRoomId: opponentRoomId }),
    }).then(function (r) { return r.json(); });
  },

  vote: function (battleId, side, giftValueCents) {
    return fetch(API_BASE + '/' + battleId + '/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ side: side, giftValueCents: giftValueCents }),
    }).then(function (r) { return r.json(); });
  },

  getActive: function () {
    return fetch(API_BASE + '/active', { credentials: 'include' }).then(function (r) { return r.json(); });
  },

  getBattle: function (battleId) {
    return fetch(API_BASE + '/' + battleId, { credentials: 'include' }).then(function (r) { return r.json(); });
  },
};

export default battleService;
