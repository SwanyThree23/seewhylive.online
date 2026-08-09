// frontend/src/services/battleService.js
// Base44-ruleset compliant: function expressions only, var only, no optional chaining/??.
// Field names match the real pk_battles schema and server route expectations.

var API_BASE = '/api/battles';

function _authHeaders(extra) {
  var tok = localStorage.getItem('sw_token') || '';
  var h = tok ? { 'Authorization': 'Bearer ' + tok } : {};
  return Object.assign(h, extra || {});
}

var battleService = {
  // POST /api/battles — create a pending challenge
  createChallenge: function (opts) {
    return fetch(API_BASE, {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        defenderId:      opts.defenderId,
        challengerName:  opts.challengerName || null,
        defenderName:    opts.defenderName   || null,
        roomId:          opts.roomId         || null,
        durationMinutes: opts.durationMinutes || 5,
      }),
    }).then(function (r) { return r.json(); });
  },

  // POST /api/battles/:id/accept — defender accepts, optionally sets room
  acceptChallenge: function (battleId, roomId) {
    return fetch(API_BASE + '/' + battleId + '/accept', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ roomId: roomId || null }),
    }).then(function (r) { return r.json(); });
  },

  // POST /api/battles/:id/start — start the countdown
  startBattle: function (battleId) {
    return fetch(API_BASE + '/' + battleId + '/start', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({}),
    }).then(function (r) { return r.json(); });
  },

  // POST /api/battles/:id/vote — cast a gift vote for one side
  vote: function (battleId, side, giftValueCents) {
    return fetch(API_BASE + '/' + battleId + '/vote', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ side: side, giftValueCents: giftValueCents }),
    }).then(function (r) { return r.json(); });
  },

  // GET /api/battles/active — all currently active battles
  getActive: function () {
    return fetch(API_BASE + '/active', { headers: _authHeaders() }).then(function (r) { return r.json(); });
  },

  // GET /api/battles/:id
  getBattle: function (battleId) {
    return fetch(API_BASE + '/' + battleId, { headers: _authHeaders() }).then(function (r) { return r.json(); });
  },
};

export default battleService;
