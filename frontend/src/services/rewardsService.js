// frontend/src/services/rewardsService.js
// Base44-ruleset compliant: function expressions only, var only, no optional chaining/??.

var REWARDS_BASE = '/api/rewards';
var CHALLENGES_BASE = '/api/challenges';

function _authHeaders() {
  var tok = localStorage.getItem('sw_token') || '';
  return tok ? { 'Authorization': 'Bearer ' + tok } : {};
}

var rewardsService = {
  getGlobalLeaderboard: function (limit) {
    var qs = limit ? ('?period=alltime&limit=' + limit) : '?period=alltime';
    return fetch(REWARDS_BASE + '/leaderboard' + qs, { headers: _authHeaders() })
      .then(function (r) { return r.json(); });
  },

  getWeeklyLeaderboard: function (limit) {
    var qs = limit ? ('?period=weekly&limit=' + limit) : '?period=weekly';
    return fetch(REWARDS_BASE + '/leaderboard' + qs, { headers: _authHeaders() })
      .then(function (r) { return r.json(); });
  },

  getMyStanding: function () {
    return fetch(REWARDS_BASE + '/me', { headers: _authHeaders() })
      .then(function (r) { return r.json(); });
  },

  getRewardTiers: function () {
    return fetch(REWARDS_BASE + '/tiers', { headers: _authHeaders() })
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
