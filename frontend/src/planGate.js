'use strict';

var PLANS = ['free', 'creator', 'pro', 'studio'];

var PLAN_FEATURES = {
  free:    { maxPanels: 2,  superChat: false, ppv: false, analytics: false, pkBattle: false, clips: false, subs: false, polls: false },
  creator: { maxPanels: 5,  superChat: true,  ppv: false, analytics: true,  pkBattle: true,  clips: true,  subs: true,  polls: true  },
  pro:     { maxPanels: 10, superChat: true,  ppv: true,  analytics: true,  pkBattle: true,  clips: true,  subs: true,  polls: true  },
  studio:  { maxPanels: 20, superChat: true,  ppv: true,  analytics: true,  pkBattle: true,  clips: true,  subs: true,  polls: true  },
};

function getCurrentPlan() {
  return localStorage.getItem('sw_saas_tier') || 'free';
}

function canUse(feature) {
  var plan = getCurrentPlan();
  var features = PLAN_FEATURES[plan] || PLAN_FEATURES['free'];
  return !!features[feature];
}

function getPlanRank(planId) {
  var idx = PLANS.indexOf(planId);
  return idx === -1 ? 0 : idx;
}

function isAtLeast(planId) {
  return getPlanRank(getCurrentPlan()) >= getPlanRank(planId);
}

export { canUse, isAtLeast, getCurrentPlan, PLAN_FEATURES, PLANS };
