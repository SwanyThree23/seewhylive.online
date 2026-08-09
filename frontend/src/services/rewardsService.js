// frontend/src/services/rewardsService.js
// Base44-ruleset compliant: function expressions only, var only, no optional chaining/??.

var LEADERBOARD_BASE = '/api/leaderboard';
var CHALLENGES_BASE = '/api/challenges';

function _authHeaders() {
  var tok = localStorage.getItem('sw_token') || '';
  return tok ? { 'Authorization': 'Bearer ' + tok } : {};
}

var rewardsService = {
  getGlobalLeaderboard: function (limit) {
    var qs = limit ? ('?limit=' + limit) : '';
    return fetch(LEADERBOARD_BASE + '/global' + qs)
      .then(function (r) { return r.json(); });
  },

  getWeeklyLeaderboard: function (limit) {
    var qs = limit ? ('?limit=' + limit) : '';
    return fetch(LEADERBOARD_BASE + '/weekly' + qs)
      .then(function (r) { return r.json(); });
  },

  getMyStanding: function () {
    return fetch(LEADERBOARD_BASE + '/me', { headers: _authHeaders() })
      .then(function (r) { return r.json(); });
  },

  getRewardTiers: function () {
    return fetch(LEADERBOARD_BASE + '/tiers')
      .then(function (r) { return r.json(); });
  },

  getActiveChallenges: function () {
    return fetch(CHALLENGES_BASE)
      .then(function (r) { return r.json(); });
  },

  completeChallenge: function (challengeId) {
    return fetch(CHALLENGES_BASE + '/' + challengeId + '/complete', {
      method: 'POST',
      headers: _authHeaders(),
    }).then(function (r) { return r.json(); });
  },

  getMyCompletions: function () {
    return fetch(CHALLENGES_BASE + '/me/completions', { headers: _authHeaders() })
      .then(function (r) { return r.json(); });
  },
};

export default rewardsService;
