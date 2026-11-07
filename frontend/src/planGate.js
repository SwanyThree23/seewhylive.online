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

// All features unlocked during launch — plan gating disabled until post-production
function canUse() {
  return true;
}

function getPlanRank(planId) {
  var idx = PLANS.indexOf(planId);
  return idx === -1 ? 0 : idx;
}

function isAtLeast() {
  return true;
}

export { canUse, isAtLeast, getCurrentPlan, PLAN_FEATURES, PLANS };
