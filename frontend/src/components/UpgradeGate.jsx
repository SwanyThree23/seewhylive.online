'use strict';
import React from 'react';
import { canUse, getCurrentPlan } from '../planGate.js';

var UPGRADE_LABELS = {
  superChat:  { need: 'CREATOR', label: 'Super Chat', icon: '💬' },
  ppv:        { need: 'PRO',     label: 'Pay-Per-View', icon: '🎲' },
  analytics:  { need: 'CREATOR', label: 'Deep Analytics', icon: '📊' },
  pkBattle:   { need: 'CREATOR', label: 'PK Battle', icon: '⚔️' },
  clips:      { need: 'CREATOR', label: 'Clip Engine', icon: '🎬' },
  subs:       { need: 'CREATOR', label: 'Subscriptions', icon: '⭐' },
  polls:      { need: 'CREATOR', label: 'Live Polls', icon: '📊' },
};

// All features unlocked during launch — plan gating removed until post-production
export default function UpgradeGate({ feature, children }) {
  return children;
}
