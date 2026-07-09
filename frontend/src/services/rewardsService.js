// frontend/src/services/rewardsService.js
// Base44-ruleset compliant: function expressions only, var only, no optional chaining/??.

var LEADERBOARD_BASE = '/api/leaderboard';
var CHALLENGES_BASE = '/api/challenges';

var rewardsService = {
  getGlobalLeaderboard: function (limit) {
    var qs = limit ? ('?limit=' + limit) : '';
    return fetch(LEADERBOARD_BASE + '/global' + qs, { credentials: 'include' })
      .then(function (r) { return r.json(); });
  },

  getWeeklyLeaderboard: function (limit) {
    var qs = limit ? ('?limit=' + limit) : '';
    return fetch(LEADERBOARD_BASE + '/weekly' + qs, { credentials: 'include' })
      .then(function (r) { return r.json(); });
  },

  getMyStanding: function () {
    return fetch(LEADERBOARD_BASE + '/me', { credentials: 'include' })
      .then(function (r) { return r.json(); });
  },

  getRewardTiers: function () {
    return fetch(LEADERBOARD_BASE + '/tiers', { credentials: 'include' })
      .then(function (r) { return r.json(); });
  },

  getActiveChallenges: function () {
    return fetch(CHALLENGES_BASE, { credentials: 'include' })
      .then(function (r) { return r.json(); });
  },

  completeChallenge: function (challengeId) {
    return fetch(CHALLENGES_BASE + '/' + challengeId + '/complete', {
      method: 'POST',
      credentials: 'include',
    }).then(function (r) { return r.json(); });
  },

  getMyCompletions: function () {
    return fetch(CHALLENGES_BASE + '/me/completions', { credentials: 'include' })
      .then(function (r) { return r.json(); });
  },
};

export default rewardsService;
