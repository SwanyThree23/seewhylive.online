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

export default function UpgradeGate({ feature, children }) {
  if (canUse(feature)) return children;
  var meta = UPGRADE_LABELS[feature] || { need: 'CREATOR', label: feature, icon: '🔒' };
  var current = getCurrentPlan().toUpperCase();
  return (
    <div style={{ position: 'relative', minHeight: 120 }}>
      <div style={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none', opacity: .4 }}>{children}</div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,12,9,.85)', borderRadius: 12, border: '1px solid rgba(201,168,76,.25)', gap: 8 }}>
        <div style={{ fontSize: 28 }}>{meta.icon}</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A84C', letterSpacing: 2 }}>{meta.label} — {meta.need}+ ONLY</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>You are on <span style={{ color: '#F0E8D4' }}>{current}</span> · Upgrade in Monetize → Tiers</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#D4854A', letterSpacing: 1, fontWeight: 700 }}>UPGRADE TO UNLOCK</div>
      </div>
    </div>
  );
}
