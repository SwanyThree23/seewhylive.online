import React, { useState, useEffect, useRef } from 'react';

var GOLD   = '#C9A84C';
var BURG   = '#800020';
var AMBER  = '#D4854A';
var RED    = '#FF1A3C';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';

var STYLE_TAG =
  '@keyframes alertDrop {' +
  '  0%   { transform: translateY(-100%) scale(.9); opacity: 0; }' +
  '  60%  { transform: translateY(8px) scale(1.02); opacity: 1; }' +
  '  100% { transform: translateY(0) scale(1);      opacity: 1; }' +
  '}' +
  '@keyframes alertExit {' +
  '  0%   { transform: translateY(0) scale(1);   opacity: 1; }' +
  '  100% { transform: translateY(-80px) scale(.9); opacity: 0; }' +
  '}' +
  '@keyframes coinSpin {' +
  '  0%   { transform: rotateY(0deg); }' +
  '  100% { transform: rotateY(360deg); }' +
  '}' +
  '@keyframes shimmer {' +
  '  0%   { background-position: -200% center; }' +
  '  100% { background-position:  200% center; }' +
  '}' +
  '@keyframes confettiFall {' +
  '  0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }' +
  '  100% { transform: translateY(80px)  rotate(360deg); opacity: 0; }' +
  '}';

// Alert tiers based on amount
var TIERS = [
  { min: 5000, label: 'LEGENDARY',  bg: 'linear-gradient(135deg,#8B0000,#C9A84C,#8B0000)', border: '#C9A84C', emoji: '💎', confetti: 12 },
  { min: 2000, label: 'EPIC',       bg: 'linear-gradient(135deg,#4B0082,#800020,#C9A84C)', border: '#D4854A', emoji: '🔥', confetti: 8  },
  { min: 1000, label: 'RARE',       bg: 'linear-gradient(135deg,#800020,#C01838)',           border: '#FF1A3C', emoji: '⭐', confetti: 5  },
  { min: 500,  label: 'SUPER',      bg: 'linear-gradient(135deg,#1A1510,#2E2318)',           border: '#C9A84C', emoji: '🎉', confetti: 3  },
  { min: 100,  label: '',           bg: 'linear-gradient(135deg,#1A1510,#241C12)',           border: 'rgba(201,168,76,.4)', emoji: '♥', confetti: 0 },
];

var CONFETTI_COLORS = [GOLD, BURG, AMBER, RED, '#50C850', '#5080FF'];

function getTier(cents) {
  for (var i = 0; i < TIERS.length; i++) {
    if (cents >= TIERS[i].min) return TIERS[i];
  }
  return null;
}

function fmtAmount(cents) {
  if (cents >= 100) return '$' + (Math.floor(cents / 100)) + (cents % 100 ? '.' + String(cents % 100).padStart(2, '0') : '');
  return cents + '¢';
}

var ALERT_DURATION = 5000;
var MIN_ALERT_CENTS = 100; // $1.00 minimum to show alert

export default function DonationAlert(props) {
  var socket   = props.socket;
  var roomId   = props.roomId;
  var threshold = props.threshold || MIN_ALERT_CENTS;

  var [queue,     setQueue]     = useState([]);
  var [current,   setCurrent]   = useState(null);
  var [exiting,   setExiting]   = useState(false);
  var [confetti,  setConfetti]  = useState([]);
  var timerRef   = useRef(null);
  var confIdRef  = useRef(0);

  // ── Receive gift and super-chat events ─────────────────────────────────
  useEffect(function() {
    if (!socket) return;

    function onGift(data) {
      if (!data || !data.valueCents) return;
      if (String(data.roomId || roomId) !== String(roomId)) return;
      if (data.valueCents < threshold) return;
      var tier = getTier(data.valueCents);
      if (!tier) return;
      var alert = {
        id:       Date.now() + Math.random(),
        type:     'gift',
        username: data.fromUser || 'Someone',
        message:  data.name || 'Gift',
        amount:   data.valueCents,
        emoji:    data.emoji || tier.emoji,
        tier:     tier
      };
      setQueue(function(q) { return q.concat([alert]); });
    }

    function onSuperChat(data) {
      if (!data || !data.amountCents) return;
      if (data.amountCents < threshold) return;
      var tier = getTier(data.amountCents);
      if (!tier) return;
      var alert = {
        id:       Date.now() + Math.random(),
        type:     'superchat',
        username: data.username || 'Someone',
        message:  data.message  || '',
        amount:   data.amountCents,
        emoji:    tier.emoji,
        tier:     tier
      };
      setQueue(function(q) { return q.concat([alert]); });
    }

    socket.on('gift-received', onGift);
    socket.on('super-chat',    onSuperChat);
    return function() {
      socket.off('gift-received', onGift);
      socket.off('super-chat',    onSuperChat);
    };
  }, [socket, roomId, threshold]);

  // ── Process queue ───────────────────────────────────────────────────────
  useEffect(function() {
    if (current || queue.length === 0) return;
    var next = queue[0];
    setQueue(function(q) { return q.slice(1); });
    setCurrent(next);
    setExiting(false);

    // Spawn confetti
    if (next.tier && next.tier.confetti > 0) {
      var newConf = [];
      for (var i = 0; i < next.tier.confetti; i++) {
        newConf.push({
          id:    ++confIdRef.current,
          left:  Math.floor(Math.random() * 90) + 5,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          delay: (Math.random() * 0.4).toFixed(2),
          size:  Math.floor(Math.random() * 6) + 6
        });
      }
      setConfetti(newConf);
    } else {
      setConfetti([]);
    }

    timerRef.current = setTimeout(function() {
      setExiting(true);
      setTimeout(function() {
        setCurrent(null);
        setExiting(false);
        setConfetti([]);
      }, 400);
    }, ALERT_DURATION);

    return function() { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, queue]);

  if (!current) return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, zIndex: -1 }}>
      <style dangerouslySetInnerHTML={{ __html: STYLE_TAG }} />
    </div>
  );

  var tier = current.tier;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900, pointerEvents: 'none' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLE_TAG }} />

      {/* Confetti */}
      {confetti.map(function(c) {
        return (
          <div key={c.id} style={{
            position: 'absolute',
            top: 0,
            left: c.left + '%',
            width: c.size,
            height: c.size,
            background: c.color,
            borderRadius: 2,
            animation: 'confettiFall 1.2s ease forwards',
            animationDelay: c.delay + 's',
            pointerEvents: 'none'
          }} />
        );
      })}

      {/* Alert card */}
      <div style={{
        margin: '0 auto',
        maxWidth: 380,
        background: tier.bg,
        border: '2px solid ' + tier.border,
        borderTop: 'none',
        borderRadius: '0 0 16px 16px',
        padding: '14px 18px 16px',
        boxShadow: '0 8px 40px rgba(0,0,0,.7), 0 0 0 1px rgba(201,168,76,.1)',
        animation: exiting ? 'alertExit .4s ease forwards' : 'alertDrop .5s cubic-bezier(.34,1.56,.64,1) forwards',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Shimmer overlay for high tiers */}
        {tier.confetti >= 8 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, transparent 40%, rgba(201,168,76,.15) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
            pointerEvents: 'none'
          }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          {/* Emoji / coin */}
          <div style={{ fontSize: 32, lineHeight: 1, animation: tier.confetti >= 5 ? 'coinSpin 1.2s ease infinite' : 'none', flexShrink: 0 }}>
            {current.emoji}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Tier label */}
            {tier.label && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: tier.border, letterSpacing: 2, marginBottom: 2 }}>
                {tier.label} {current.type === 'superchat' ? 'SUPER CHAT' : 'GIFT'}
              </div>
            )}
            {/* Username + amount */}
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 1, lineHeight: 1.1 }}>
              {current.username}
              <span style={{
                marginLeft: 8,
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 700,
                fontSize: 18,
                background: 'linear-gradient(90deg,' + GOLD + ',' + AMBER + ')',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {fmtAmount(current.amount)}
              </span>
            </div>
            {/* Message */}
            {current.message && (
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: 'rgba(240,232,212,.75)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {current.message}
              </div>
            )}
          </div>

          {/* Queue badge */}
          {queue.length > 0 && (
            <div style={{ background: 'rgba(0,0,0,.4)', borderRadius: 999, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, flexShrink: 0 }}>
              +{queue.length}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: 'rgba(255,255,255,.1)', borderRadius: 1, marginTop: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: tier.border,
            borderRadius: 1,
            animation: 'alertExit ' + (ALERT_DURATION / 1000) + 's linear forwards',
            transformOrigin: 'left',
            animationDelay: '0s'
          }} />
        </div>
      </div>
    </div>
  );
}
