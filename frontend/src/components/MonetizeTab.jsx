'use strict';
import React, { useState, useEffect, useRef } from 'react';

var BG    = '#0E0C09';
var SURF  = '#1A1510';
var CARD  = '#241C12';
var CARD2 = '#2E2318';
var GOLD  = '#C9A84C';
var BURG  = '#800020';
var AMBER = '#D4854A';
var RED   = '#FF1A3C';
var TEXT  = '#F0E8D4';
var MUTED = '#8A7A62';
var BORDER = 'rgba(201,168,76,.12)';
var fD   = "'Bebas Neue',sans-serif";
var fU   = "'Barlow Condensed',sans-serif";
var fM   = "'DM Mono',monospace";

var CREATOR_SHARE = 0.90;
var PLATFORM_SHARE = 0.10;

var EARN_STREAMS = [
  { id: 'superchat',    label: 'Super Chat',     icon: '💬', desc: 'Highlighted messages · 6 tiers $1–$50',        color: '#5A8FFF', action: 'SC in Quick Actions' },
  { id: 'subscription', label: 'Subscriptions',  icon: '⭐', desc: 'Monthly recurring · Fan/Supporter/RideOrDie',   color: GOLD,     action: 'Share your sub link' },
  { id: 'directpay',    label: 'Direct Pay',      icon: '💸', desc: 'PayPal/CashApp/Venmo/Zelle/Chime · instant',   color: AMBER,    action: 'Set handles in Direct Pay tab' },
  { id: 'tips',         label: 'Tips',            icon: '🎁', desc: 'One-tap micro-payments from viewers',           color: '#6B8F5E', action: 'Visible in Monetize tab' },
  { id: 'ppv',          label: 'Pay-Per-View',    icon: '🎲', desc: 'Charge entry to premium events',               color: BURG,     action: 'Set up in room access controls' },
];

var SAAS_TIERS = [
  { id: 'free',    label: 'FREE',    price: 0,    color: MUTED,  panels: 2,  streams: 1, features: ['2 panels', '1 revenue stream', 'Basic analytics', 'Chat + reactions'] },
  { id: 'creator', label: 'CREATOR', price: 1900, color: AMBER,  panels: 5,  streams: 3, features: ['5 panels', '3 revenue streams', 'Super Chat', 'Polls + VS', 'Download clips'] },
  { id: 'pro',     label: 'PRO',     price: 4900, color: GOLD,   panels: 10, streams: 5, features: ['10 panels', 'All revenue streams', 'AURA AI', 'PPV rooms', 'SwanyBot', 'Priority support'] },
  { id: 'studio',  label: 'STUDIO',  price: 14900,color: '#C084FC',panels: 20, streams: 99, features: ['20 panels', 'White-label', 'Custom AURA', 'Watch Party sync', 'Dedicated support', 'API access'] },
];

var SUB_TIERS = [
  { id: 'fan',         label: 'FAN',         cents: 500,  color: MUTED,  icon: '🥉', perks: ['Fan badge', 'Exclusive emotes', 'Ad-free chat'] },
  { id: 'supporter',   label: 'SUPPORTER',   cents: 1000, color: AMBER,  icon: '🥈', perks: ['All Fan', 'Priority Q&A', 'Exclusive streams'] },
  { id: 'ride_or_die', label: 'RIDE OR DIE', cents: 2000, color: GOLD,   icon: '👑', perks: ['All Supporter', 'Direct DMs', 'Monthly shoutout', 'RoD badge'] },
];

var LEADERBOARD_MOCK = [
  { rank: 1, name: 'DominoKing_DC',   cents: 12450, badge: '💎', streak: 7  },
  { rank: 2, name: 'WashClassic2026', cents: 8900,  badge: '👑', streak: 4  },
  { rank: 3, name: 'VibeNBones',      cents: 6200,  badge: '🔥', streak: 12 },
  { rank: 4, name: 'TileHolderPRO',   cents: 4100,  badge: '⭐', streak: 2  },
  { rank: 5, name: 'SwanyFan23',      cents: 2800,  badge: '🎯', streak: 5  },
];

function fmtC(c) { return '$' + (Math.floor(c || 0) / 100).toFixed(2); }

var FLYWHEEL_STEPS = [
  { icon: '🎬', label: 'CREATE',      desc: 'Host live rooms, events, battles' },
  { icon: '👥', label: 'GROW',        desc: 'Viewers join, react, engage' },
  { icon: '💸', label: 'MONETIZE',    desc: 'Super Chat, Subs, Tips, PPV' },
  { icon: '💰', label: 'EARN',        desc: '90% straight to creator' },
  { icon: '⬆',  label: 'UPGRADE',     desc: 'Unlock more tools & panels' },
  { icon: '🔄', label: 'REINVEST',    desc: 'Better streams → more viewers' },
];

export default function MonetizeTab({ addToast, isLive, socket, roomId, username, streamGoal, setStreamGoal, sessionEarningsCents }) {
  var [tab,         setTab]       = useState('flywheel');
  var [subTier,     setSubTier]   = useState(null);
  var [tipAmt,      setTipAmt]    = useState(null);
  var [tipMsg,      setTipMsg]    = useState('');
  var [currentPlan, setPlan]      = useState(function() { return localStorage.getItem('sw_saas_tier') || 'free'; });
  var [goalLabel,   setGoalLabel] = useState(streamGoal ? streamGoal.label : '');
  var [goalAmt,     setGoalAmt]   = useState(streamGoal ? String(Math.floor(streamGoal.goalCents / 100)) : '');
  var [projV,       setProjV]     = useState('500');
  var wheelRef = useRef(null);

  var sessionCents = Math.floor(sessionEarningsCents || 0);
  var creatorCents = Math.floor(sessionCents * CREATOR_SHARE);
  var platformCents = sessionCents - creatorCents;

  function sendTip() {
    if (!tipAmt || !socket) return;
    var cents = Math.floor(tipAmt * 100);
    socket.emit('super-chat', { roomId: roomId, userId: username, username: username, message: tipMsg || '🎁 Tip!', amountCents: cents });
    setTipAmt(null); setTipMsg('');
    if (addToast) addToast('🎁 Tip sent!', 'success');
  }

  function sendSub(tier) {
    if (!socket) return;
    socket.emit('subscribe', { roomId: roomId, username: username, tier: tier.id, priceCents: tier.cents });
    setSubTier(tier.id);
    if (addToast) addToast('⭐ Subscribed at ' + tier.label + '!', 'success');
  }

  function setGoal() {
    if (!goalAmt || !goalLabel) { if (addToast) addToast('Enter a label and amount', 'error'); return; }
    var cents = Math.floor(parseFloat(goalAmt) * 100);
    if (cents <= 0) return;
    var goal = { label: goalLabel, goalCents: cents };
    localStorage.setItem('sw_stream_goal', JSON.stringify(goal));
    if (setStreamGoal) setStreamGoal(goal);
    if (socket) socket.emit('stream-goal', { roomId: roomId, label: goalLabel, goalCents: cents });
    if (addToast) addToast('Stream goal set: ' + goalLabel, 'success');
  }

  var projGross = Math.floor(parseInt(projV || '0', 10) * 0.03 * 1000); // 3% convert at $10 avg
  var projCreator = Math.floor(projGross * CREATOR_SHARE);

  var TABS = [
    { id: 'flywheel',    label: '🔄 FLYWHEEL' },
    { id: 'earn',        label: '💸 EARN' },
    { id: 'subs',        label: '⭐ SUBS' },
    { id: 'tiers',       label: '📈 TIERS' },
    { id: 'leaderboard', label: '🏆 TOP' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG }}>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes wheelSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes earnPop{0%{transform:scale(.9);opacity:0}100%{transform:scale(1);opacity:1}}' }} />

      {/* Header */}
      <div style={{ padding: '12px 14px 0', flexShrink: 0 }}>
        <div style={{ fontFamily: fD, fontSize: 22, color: GOLD, letterSpacing: 3, marginBottom: 2 }}>💰 MONETIZE</div>
        <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginBottom: 10 }}>
          90% creator · 10% platform · {isLive ? '🔴 LIVE · ' : ''}{fmtC(sessionCents)} session
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 8 }}>
          {TABS.map(function(t) {
            var active = tab === t.id;
            return (
              <button key={t.id} onClick={function() { setTab(t.id); }}
                style={{ flexShrink: 0, background: active ? 'rgba(201,168,76,.14)' : SURF, border: '1px solid ' + (active ? 'rgba(201,168,76,.5)' : BORDER), borderRadius: 8, padding: '6px 12px', color: active ? GOLD : MUTED, fontFamily: fU, fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: .5 }}>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 80px', WebkitOverflowScrolling: 'touch' }}>

        {/* ══════════════ FLYWHEEL TAB ══════════════ */}
        {tab === 'flywheel' && (
          <div style={{ paddingTop: 12 }}>
            {/* Flywheel visual */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: fD, fontSize: 28, color: TEXT, letterSpacing: 2, marginBottom: 4 }}>THE SAAS FLYWHEEL</div>
              <div style={{ fontFamily: fM, fontSize: 8.5, color: MUTED, lineHeight: 1.6 }}>
                Every tool on SeeWhy LIVE feeds the cycle.<br />Better content → more viewers → more revenue → better tools.
              </div>
            </div>

            {/* Flywheel steps — vertical timeline */}
            <div style={{ position: 'relative', paddingLeft: 24, marginBottom: 24 }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom,' + BURG + ',' + GOLD + ',' + BURG + ')' }} />
              {FLYWHEEL_STEPS.map(function(step, i) {
                return (
                  <div key={step.label} style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start', animation: 'earnPop .3s ease ' + (i * .06) + 's both' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: i % 2 === 0 ? 'rgba(128,0,32,.3)' : 'rgba(201,168,76,.2)', border: '2px solid ' + (i % 2 === 0 ? BURG : GOLD), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, zIndex: 1 }}>
                      {step.icon}
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <div style={{ fontFamily: fD, fontSize: 16, color: i % 2 === 0 ? AMBER : GOLD, letterSpacing: 2, lineHeight: 1 }}>{step.label}</div>
                      <div style={{ fontFamily: fU, fontSize: 13, color: TEXT, marginTop: 2 }}>{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Revenue projection */}
            <div style={{ background: SURF, border: '1px solid ' + BORDER, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, letterSpacing: 1.5, marginBottom: 10 }}>REVENUE PROJECTION CALCULATOR</div>
              <div style={{ fontFamily: fU, fontSize: 13, color: TEXT, marginBottom: 6 }}>Estimated viewers per stream</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {['100','250','500','1000','2500','5000'].map(function(v) {
                  var active = projV === v;
                  return (
                    <button key={v} onClick={function() { setProjV(v); }}
                      style={{ background: active ? 'rgba(201,168,76,.16)' : CARD, border: '1px solid ' + (active ? 'rgba(201,168,76,.5)' : BORDER), borderRadius: 7, padding: '5px 12px', color: active ? GOLD : MUTED, fontFamily: fD, fontSize: 14, cursor: 'pointer' }}>
                      {v}
                    </button>
                  );
                })}
              </div>
              <div style={{ background: CARD, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: fM, fontSize: 8, color: MUTED }}>GROSS REVENUE (3% convert · $10 avg)</span>
                  <span style={{ fontFamily: fD, fontSize: 16, color: TEXT }}>{fmtC(projGross)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: fM, fontSize: 8, color: GOLD }}>YOUR TAKE (90%)</span>
                  <span style={{ fontFamily: fD, fontSize: 16, color: GOLD }}>{fmtC(projCreator)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: fM, fontSize: 8, color: MUTED }}>PLATFORM FEE (10%)</span>
                  <span style={{ fontFamily: fD, fontSize: 14, color: MUTED }}>{fmtC(projGross - projCreator)}</span>
                </div>
              </div>
            </div>

            {/* Session earnings live */}
            {sessionCents > 0 && (
              <div style={{ background: 'rgba(128,0,32,.12)', border: '1px solid rgba(128,0,32,.35)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, letterSpacing: 1.5, marginBottom: 8 }}>THIS SESSION</div>
                <div style={{ fontFamily: fD, fontSize: 40, color: GOLD, letterSpacing: 1, lineHeight: 1 }}>{fmtC(sessionCents)}</div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <div><div style={{ fontFamily: fM, fontSize: 7, color: MUTED }}>YOUR SHARE</div><div style={{ fontFamily: fD, fontSize: 18, color: GOLD }}>{fmtC(creatorCents)}</div></div>
                  <div><div style={{ fontFamily: fM, fontSize: 7, color: MUTED }}>PLATFORM</div><div style={{ fontFamily: fD, fontSize: 18, color: MUTED }}>{fmtC(platformCents)}</div></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ EARN TAB ══════════════ */}
        {tab === 'earn' && (
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: fD, fontSize: 20, color: TEXT, letterSpacing: 2 }}>REVENUE STREAMS</div>
            {EARN_STREAMS.map(function(es) {
              return (
                <div key={es.id} style={{ background: SURF, border: '1px solid ' + BORDER, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ height: 3, background: 'linear-gradient(90deg,' + es.color + ',' + es.color + '88)' }} />
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: es.color + '20', border: '1px solid ' + es.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{es.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 15, color: TEXT }}>{es.label}</div>
                      <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>{es.desc}</div>
                      <div style={{ fontFamily: fM, fontSize: 8, color: es.color, marginTop: 4, letterSpacing: .5 }}>→ {es.action}</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Tips widget */}
            <div style={{ background: SURF, border: '1px solid ' + BORDER, borderRadius: 12, padding: '14px 16px', marginTop: 4 }}>
              <div style={{ fontFamily: fM, fontSize: 8, color: GOLD, letterSpacing: 1.5, marginBottom: 10 }}>SEND TIP · {isLive ? '🔴 LIVE' : 'OFFLINE'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {[1,2,5,10,20,50].map(function(amt) {
                  var active = tipAmt === amt;
                  return (
                    <button key={amt} onClick={function() { setTipAmt(active ? null : amt); }}
                      style={{ background: active ? 'rgba(212,133,74,.2)' : CARD, border: '1px solid ' + (active ? AMBER : BORDER), borderRadius: 8, padding: '7px 14px', color: active ? AMBER : TEXT, fontFamily: fD, fontSize: 16, cursor: 'pointer' }}>
                      ${amt}
                    </button>
                  );
                })}
              </div>
              <input
                value={tipMsg}
                onChange={function(e) { setTipMsg(e.target.value.slice(0, 100)); }}
                placeholder="Optional message..."
                style={{ width: '100%', boxSizing: 'border-box', background: CARD, border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: fU, fontSize: 13, marginBottom: 10, outline: 'none' }}
              />
              <button
                onClick={sendTip}
                disabled={!tipAmt}
                style={{ width: '100%', background: tipAmt ? AMBER : CARD, border: '1px solid ' + (tipAmt ? AMBER : BORDER), borderRadius: 10, padding: '12px', color: tipAmt ? '#0E0C09' : MUTED, fontFamily: fD, fontSize: 17, cursor: tipAmt ? 'pointer' : 'default', letterSpacing: 2 }}>
                {tipAmt ? 'SEND $' + tipAmt + ' TIP' : 'SELECT AN AMOUNT'}
              </button>
            </div>

            {/* Stream goal setter */}
            {isLive && (
              <div style={{ background: SURF, border: '1px solid ' + BORDER, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontFamily: fM, fontSize: 8, color: GOLD, letterSpacing: 1.5, marginBottom: 10 }}>SET STREAM GOAL</div>
                <input value={goalLabel} onChange={function(e) { setGoalLabel(e.target.value); }} placeholder="Goal label (e.g. New Studio Setup)" style={{ width: '100%', boxSizing: 'border-box', background: CARD, border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: fU, fontSize: 13, marginBottom: 8, outline: 'none' }} />
                <input value={goalAmt} onChange={function(e) { setGoalAmt(e.target.value); }} placeholder="Target amount in $ (e.g. 100)" type="number" style={{ width: '100%', boxSizing: 'border-box', background: CARD, border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: fU, fontSize: 13, marginBottom: 10, outline: 'none' }} />
                <button onClick={setGoal} style={{ width: '100%', background: BURG, border: 'none', borderRadius: 10, padding: '12px', color: GOLD, fontFamily: fD, fontSize: 17, cursor: 'pointer', letterSpacing: 2 }}>SET GOAL</button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ SUBS TAB ══════════════ */}
        {tab === 'subs' && (
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: fD, fontSize: 20, color: TEXT, letterSpacing: 2 }}>VIEWER SUBSCRIPTIONS</div>
            <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, lineHeight: 1.6, marginBottom: 4 }}>
              Subscribe to your favorite creator for exclusive perks.<br />
              Creator receives 90% · Platform 10%
            </div>
            {SUB_TIERS.map(function(tier) {
              var active = subTier === tier.id;
              return (
                <div key={tier.id} style={{ background: SURF, border: '1.5px solid ' + (active ? tier.color : BORDER), borderRadius: 14, overflow: 'hidden', transition: 'border .2s' }}>
                  <div style={{ height: 3, background: 'linear-gradient(90deg,' + tier.color + ',transparent)' }} />
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 28 }}>{tier.icon}</span>
                        <div>
                          <div style={{ fontFamily: fD, fontSize: 18, color: tier.color, letterSpacing: 2 }}>{tier.label}</div>
                          <div style={{ fontFamily: fD, fontSize: 22, color: TEXT, lineHeight: 1 }}>{fmtC(tier.cents)}<span style={{ fontFamily: fM, fontSize: 8, color: MUTED }}>/mo</span></div>
                        </div>
                      </div>
                      <button
                        onClick={function() { sendSub(tier); }}
                        style={{ background: active ? tier.color + '30' : CARD2, border: '1.5px solid ' + tier.color, borderRadius: 10, padding: '8px 16px', color: tier.color, fontFamily: fD, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
                        {active ? '✓ SUBSCRIBED' : 'SUBSCRIBE'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {tier.perks.map(function(perk) {
                        return (
                          <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: tier.color, flexShrink: 0 }} />
                            <span style={{ fontFamily: fU, fontSize: 13, color: TEXT }}>{perk}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════ TIERS TAB ══════════════ */}
        {tab === 'tiers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: fD, fontSize: 20, color: TEXT, letterSpacing: 2, marginBottom: 4 }}>CREATOR PLAN TIERS</div>
            <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginBottom: 8 }}>Platform fee decreases as you upgrade. Billed monthly.</div>
            {SAAS_TIERS.map(function(plan) {
              var isCurrent = currentPlan === plan.id;
              var PLAN_FEE = { free: '10%', creator: '8%', pro: '6%', studio: '5%' };
              var PLAN_FEATURES = {
                free:    ['2 panels', '1 stream dest', 'Chat + reactions', 'Basic analytics'],
                creator: ['5 panels', '3 stream dests', 'Super Chat', 'Clip engine', 'PK Battle', 'Subscriptions'],
                pro:     ['10 panels', '7 stream dests', 'PPV rooms', 'Full analytics', 'AURA AI', 'SwanyBot'],
                studio:  ['20 panels', 'Unlimited dests', 'White-label', 'API access', 'Dedicated support', 'Custom AURA'],
              };
              var feats = PLAN_FEATURES[plan.id] || [];
              return (
                <div key={plan.id} style={{ background: isCurrent ? 'rgba(201,168,76,.08)' : SURF, border: '1.5px solid ' + (isCurrent ? plan.color : BORDER), borderRadius: 12, padding: '14px 16px', position: 'relative' }}>
                  {isCurrent && (
                    <div style={{ position: 'absolute', top: -10, right: 14, background: plan.color, borderRadius: 4, padding: '2px 10px', fontFamily: fM, fontSize: 7, color: '#0E0C09', letterSpacing: 1.5, fontWeight: 700 }}>CURRENT PLAN</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontFamily: fD, fontSize: 18, color: plan.color, letterSpacing: 2 }}>{plan.label}</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ fontFamily: fM, fontSize: 8, color: '#4CAF50' }}>{PLAN_FEE[plan.id]} fee</div>
                      <div style={{ fontFamily: fD, fontSize: 16, color: plan.color }}>{plan.price === 0 ? 'FREE' : '$' + Math.floor(plan.price / 100) + '/mo'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {feats.map(function(f) {
                      return <span key={f} style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 4, padding: '2px 7px', fontFamily: fU, fontSize: 10, color: MUTED }}>{f}</span>;
                    })}
                  </div>
                  <button
                    onClick={function() {
                      if (!isCurrent) {
                        setPlan(plan.id);
                        localStorage.setItem('sw_saas_tier', plan.id);
                        if (addToast) addToast('Plan updated to ' + plan.label + '!', 'success');
                      }
                    }}
                    style={{ width: '100%', padding: '9px', background: isCurrent ? 'rgba(201,168,76,.1)' : 'linear-gradient(135deg,#800020,#C01838)', border: '1px solid ' + (isCurrent ? 'rgba(201,168,76,.3)' : 'transparent'), borderRadius: 8, color: isCurrent ? plan.color : '#C9A84C', fontFamily: fD, fontSize: 13, letterSpacing: 2, cursor: isCurrent ? 'default' : 'pointer' }}>
                    {isCurrent ? '✓ CURRENT PLAN' : 'UPGRADE TO ' + plan.label}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════ LEADERBOARD TAB ══════════════ */}
        {tab === 'leaderboard' && (
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: fD, fontSize: 20, color: TEXT, letterSpacing: 2 }}>TOP SUPPORTERS</div>
            <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginBottom: 4 }}>Live session leaderboard · resets each stream</div>
            {LEADERBOARD_MOCK.map(function(e, i) {
              var isTop = i < 3;
              var rankColors = ['#C9A84C', '#C0C0C0', '#cd7f32'];
              var rc = rankColors[i] || MUTED;
              return (
                <div key={e.name} style={{ background: SURF, border: '1px solid ' + (isTop ? rc + '44' : BORDER), borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: isTop ? rc + '22' : CARD, border: '2px solid ' + (isTop ? rc : BORDER), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: fD, fontSize: 16, color: isTop ? rc : MUTED }}>{e.rank}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 15, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                    <div style={{ fontFamily: fM, fontSize: 7.5, color: MUTED }}>{e.badge} · {e.streak} day streak</div>
                  </div>
                  <div style={{ fontFamily: fD, fontSize: 18, color: isTop ? rc : TEXT, flexShrink: 0 }}>{fmtC(e.cents)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
