import React, { useState, useEffect, useRef } from 'react';

var GOLD   = '#C9A84C';
var BURG   = '#800020';
var AMBER  = '#D4854A';
var RED    = '#FF1A3C';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';
var CARD   = '#241C12';
var SURF   = '#1A1510';
var BORDER = 'rgba(201,168,76,.12)';
var DIM    = '#3D3020';

var STYLE_TAG =
  '@keyframes goalPulse {' +
  '  0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); }' +
  '  50%     { box-shadow: 0 0 0 4px rgba(201,168,76,.3); }' +
  '}' +
  '@keyframes burstStar {' +
  '  0%   { transform: translate(0,0) scale(1);   opacity: 1; }' +
  '  100% { transform: translate(var(--bx),var(--by)) scale(0); opacity: 0; }' +
  '}' +
  '@keyframes goalComplete {' +
  '  0%   { transform: scaleX(1); }' +
  '  30%  { transform: scaleX(1.04); }' +
  '  60%  { transform: scaleX(.98); }' +
  '  100% { transform: scaleX(1); }' +
  '}' +
  '@keyframes goalSlideIn {' +
  '  from { transform: translateY(60px); opacity: 0; }' +
  '  to   { transform: translateY(0);    opacity: 1; }' +
  '}';

var GOAL_TYPES = [
  { id: 'viewers', label: 'Viewers',  icon: '👁', unit: '' },
  { id: 'revenue', label: 'Revenue',  icon: '💰', unit: '$' },
  { id: 'loves',   label: 'Loves',    icon: '♥',  unit: '' },
];

var BURST_OFFSETS = [
  {x:'-40px',y:'-40px'},{x:'0px',y:'-55px'},{x:'40px',y:'-40px'},
  {x:'55px',y:'0px'},{x:'40px',y:'40px'},{x:'0px',y:'55px'},
  {x:'-40px',y:'40px'},{x:'-55px',y:'0px'}
];

export default function StreamGoalBar(props) {
  var socket      = props.socket;
  var roomId      = props.roomId;
  var role        = props.role;
  var isLive      = props.isLive;
  var viewerCount = props.viewerCount || 0;
  var earningsCents = props.earningsCents || 0;
  var loveTotal   = props.loveTotal || 0;

  var [goal,        setGoal]        = useState(null);
  var [visible,     setVisible]     = useState(false);
  var [showSetup,   setShowSetup]   = useState(false);
  var [goalType,    setGoalType]    = useState('viewers');
  var [goalTarget,  setGoalTarget]  = useState('');
  var [goalLabel,   setGoalLabel]   = useState('');
  var [completed,   setCompleted]   = useState(false);
  var [burst,       setBurst]       = useState(false);
  var prevPct     = useRef(0);
  var burstTimerRef = useRef(null);

  var isHost = role === 'host' || role === 'cohost';

  // ── Socket: receive goal state ──────────────────────────────────────────
  useEffect(function() {
    if (!socket) return;

    function onGoalSet(data) {
      if (!data || String(data.roomId) !== String(roomId)) return;
      setGoal({ type: data.type, target: data.target, label: data.label || '' });
      setCompleted(false);
      setBurst(false);
      setVisible(true);
      prevPct.current = 0;
    }

    function onGoalClear(data) {
      if (!data || String(data.roomId) !== String(roomId)) return;
      setVisible(false);
      setGoal(null);
      setCompleted(false);
    }

    socket.on('stream-goal-set',   onGoalSet);
    socket.on('stream-goal-clear', onGoalClear);
    return function() {
      socket.off('stream-goal-set',   onGoalSet);
      socket.off('stream-goal-clear', onGoalClear);
    };
  }, [socket, roomId]);

  // ── Compute current value ───────────────────────────────────────────────
  function getCurrentValue() {
    if (!goal) return 0;
    if (goal.type === 'viewers')  return viewerCount;
    if (goal.type === 'revenue') return Math.floor(earningsCents / 100);
    if (goal.type === 'loves')    return loveTotal;
    return 0;
  }

  var current = getCurrentValue();
  var pct = goal && goal.target > 0 ? Math.min(100, Math.floor((current / goal.target) * 100)) : 0;

  // ── Completion burst ────────────────────────────────────────────────────
  useEffect(function() {
    if (!goal || completed) return;
    if (pct >= 100 && prevPct.current < 100) {
      setCompleted(true);
      setBurst(true);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      burstTimerRef.current = setTimeout(function() { setBurst(false); }, 1500);
    }
    prevPct.current = pct;
    return function() { if (burstTimerRef.current) clearTimeout(burstTimerRef.current); };
  }, [pct, goal, completed]);

  function handleSetGoal() {
    var t = parseInt(goalTarget, 10);
    if (!t || t <= 0) return;
    var payload = { roomId: roomId, type: goalType, target: t, label: goalLabel.trim() || null };
    if (socket) socket.emit('stream-goal-set', payload);
    setShowSetup(false);
    setGoalTarget('');
    setGoalLabel('');
  }

  function handleClearGoal() {
    if (socket) socket.emit('stream-goal-clear', { roomId: roomId });
    setShowSetup(false);
  }

  var typeInfo = GOAL_TYPES.find(function(g) { return g.id === (goal ? goal.type : goalType); }) || GOAL_TYPES[0];

  if (!isLive) return null;

  return (
    <div style={{ position: 'fixed', bottom: 68, left: 0, right: 0, zIndex: 600, pointerEvents: 'none' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLE_TAG }} />

      {/* Burst particles on completion */}
      {burst && (
        <div style={{ position: 'absolute', bottom: 14, left: '50%', width: 0, height: 0, pointerEvents: 'none' }}>
          {BURST_OFFSETS.map(function(off, i) {
            return (
              <div key={i} style={{
                position: 'absolute',
                fontSize: 16,
                '--bx': off.x,
                '--by': off.y,
                animation: 'burstStar 1s ease forwards',
                animationDelay: (i * 0.06) + 's',
                lineHeight: 1,
                userSelect: 'none'
              }}>
                {i % 3 === 0 ? '⭐' : i % 3 === 1 ? '🎉' : '✨'}
              </div>
            );
          })}
        </div>
      )}

      {/* Goal bar — shown to all when active */}
      {visible && goal && (
        <div style={{ margin: '0 10px', background: 'rgba(14,12,9,.9)', border: '1px solid ' + (completed ? GOLD : BORDER), borderRadius: 10, padding: '8px 12px', backdropFilter: 'blur(8px)', animation: 'goalSlideIn .3s ease forwards', pointerEvents: 'all', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>{typeInfo.icon}</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: completed ? GOLD : MUTED, letterSpacing: 1 }}>
                {goal.label || (typeInfo.label.toUpperCase() + ' GOAL')}
              </span>
              {completed && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1, animation: 'goalPulse 1s ease infinite' }}>🎉 REACHED!</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: TEXT }}>
                {typeInfo.unit}{current.toLocaleString()} / {typeInfo.unit}{Number(goal.target).toLocaleString()}
              </span>
              {isHost && (
                <button onClick={handleClearGoal} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 10, cursor: 'pointer', padding: '0 2px', pointerEvents: 'all' }}>✕</button>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 8, borderRadius: 4, background: DIM, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: pct + '%',
              height: '100%',
              background: completed
                ? 'linear-gradient(90deg,' + GOLD + ',' + AMBER + ')'
                : 'linear-gradient(90deg,' + BURG + ',' + AMBER + ')',
              borderRadius: 4,
              transition: 'width .5s ease',
              animation: completed ? 'goalComplete .6s ease' : 'none'
            }} />
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, textAlign: 'right', marginTop: 3 }}>{pct}%</div>
        </div>
      )}

      {/* Host: set goal button (when no active goal) */}
      {isHost && !visible && !showSetup && (
        <div style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'all' }}>
          <button
            onClick={function() { setShowSetup(true); }}
            style={{ background: 'rgba(14,12,9,.85)', border: '1px solid ' + BORDER, borderRadius: 20, padding: '4px 14px', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1 }}>
            🎯 SET STREAM GOAL
          </button>
        </div>
      )}

      {/* Host setup panel */}
      {isHost && showSetup && (
        <div style={{ margin: '0 10px', background: 'rgba(14,12,9,.95)', border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 12px', pointerEvents: 'all' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1, marginBottom: 8 }}>🎯 SET STREAM GOAL</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {GOAL_TYPES.map(function(gt) {
              return (
                <button key={gt.id} onClick={function() { setGoalType(gt.id); }}
                  style={{ flex: 1, background: goalType === gt.id ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (goalType === gt.id ? GOLD : BORDER), borderRadius: 6, padding: '5px 0', color: goalType === gt.id ? GOLD : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                  {gt.icon} {gt.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              value={goalTarget}
              onChange={function(e) { setGoalTarget(e.target.value); }}
              placeholder={goalType === 'earnings' ? 'Target ($)' : 'Target number'}
              type="number"
              min="1"
              style={{ flex: 1, background: 'rgba(0,0,0,.4)', border: '1px solid ' + BORDER, borderRadius: 6, padding: '6px 8px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 9, outline: 'none' }}
            />
            <input
              value={goalLabel}
              onChange={function(e) { setGoalLabel(e.target.value); }}
              placeholder="Custom label (optional)"
              style={{ flex: 2, background: 'rgba(0,0,0,.4)', border: '1px solid ' + BORDER, borderRadius: 6, padding: '6px 8px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 9, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleSetGoal} style={{ flex: 1, background: 'rgba(201,168,76,.2)', border: '1px solid rgba(201,168,76,.5)', borderRadius: 6, padding: '7px', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>
              SET GOAL
            </button>
            <button onClick={function() { setShowSetup(false); }} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid ' + BORDER, borderRadius: 6, padding: '7px 12px', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
