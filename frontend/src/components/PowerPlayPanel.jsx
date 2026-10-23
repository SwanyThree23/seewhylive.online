'use strict';
import React, { useState } from 'react';

var BG   = '#0E0C09';
var SURF = '#1A1510';
var CARD = '#241C12';
var GOLD = '#C9A84C';
var BURG = '#800020';
var TEXT = '#F0E8D4';
var MUTED = '#8A7A62';
var fD = "'Bebas Neue',sans-serif";
var fU = "'Barlow Condensed',sans-serif";
var fM = "'DM Mono',monospace";

var PLAYS = [
  { id: 'pp_tomato',   playType: 'tomato',   emoji: '🍅', name: 'Tomato Splat', cents: 99,  needsApproval: false, desc: 'Splat their face' },
  { id: 'pp_egg',      playType: 'egg',       emoji: '🥚', name: 'Egg Splat',   cents: 99,  needsApproval: false, desc: 'Egg their panel' },
  { id: 'pp_airhorn',  playType: 'airhorn',   emoji: '📣', name: 'Airhorn',     cents: 149, needsApproval: false, desc: 'Blast the airhorn' },
  { id: 'pp_crown',    playType: 'crown',     emoji: '🌟', name: 'Power Crown', cents: 299, needsApproval: false, desc: '10s crown glow' },
  { id: 'pp_helium',   playType: 'helium',    emoji: '🎈', name: 'Helium',      cents: 199, needsApproval: false, desc: 'Helium voice 15s' },
  { id: 'pp_shield',   playType: 'shield',    emoji: '🛡', name: 'Shield',      cents: 299, needsApproval: false, desc: 'Block plays 30s' },
  { id: 'pp_freeze',   playType: 'freeze',    emoji: '🥶', name: 'Freeze',      cents: 399, needsApproval: false, desc: 'Freeze panel 10s' },
  { id: 'pp_jail',     playType: 'jail',      emoji: '⛓', name: 'Jail',        cents: 499, needsApproval: true,  desc: 'Jail 30s (host approves)' },
  { id: 'pp_hot_seat', playType: 'hot_seat',  emoji: '🔥', name: 'Hot Seat',    cents: 499, needsApproval: true,  desc: 'Spotlight 30s (host approves)' },
  { id: 'pp_eject',    playType: 'eject',     emoji: '🚀', name: 'Eject',       cents: 999, needsApproval: true,  desc: 'Remove from panel (host approves)' },
];

function fmtCents(c) { return '$' + (c / 100).toFixed(2); }

export default function PowerPlayPanel({ targetGuest, onSend, onClose, pendingPlayId, passActive }) {
  var [hoverId, setHoverId] = useState(null);
  var [sentPlayType, setSentPlayType] = useState(null);

  if (!targetGuest) return null;
  var targetName = targetGuest.username || targetGuest.guestId || 'Guest';

  function handleSend(play) {
    if (sentPlayType) return;
    setSentPlayType(play.playType);
    if (onSend) onSend({
      name:        play.name,
      emoji:       play.emoji,
      valueCents:  play.cents,
      toGuestId:   targetGuest.guestId || targetGuest.userId,
      playType:    play.playType,
    });
    setTimeout(function() { setSentPlayType(null); }, 3000);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(14,12,9,.88)',
    }} onClick={onClose}>
      <div style={{
        background: SURF, border: '1px solid rgba(201,168,76,.25)', borderRadius: 16,
        padding: '18px 16px', width: 340, maxWidth: '94vw', maxHeight: '80vh',
        overflowY: 'auto',
      }} onClick={function(e) { e.stopPropagation(); }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: fD, fontSize: 18, color: GOLD, letterSpacing: 2 }}>POWER PLAYS</div>
            <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginTop: 2 }}>
              Target: <span style={{ color: TEXT }}>{targetName}</span>
              {passActive && <span style={{ color: GOLD, marginLeft: 6 }}>· PASS ACTIVE</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        {/* Play grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PLAYS.map(function(play) {
            var isHover = hoverId === play.playType;
            var isSent  = sentPlayType === play.playType;
            var isPendingThis = pendingPlayId && sentPlayType === play.playType;
            return (
              <button
                key={play.playType}
                onMouseEnter={function() { setHoverId(play.playType); }}
                onMouseLeave={function() { setHoverId(null); }}
                onClick={function() { handleSend(play); }}
                disabled={!!sentPlayType}
                style={{
                  background: isSent ? 'rgba(201,168,76,.2)' : isHover ? 'rgba(201,168,76,.1)' : CARD,
                  border: '1px solid ' + (isSent ? GOLD : isHover ? 'rgba(201,168,76,.4)' : 'rgba(201,168,76,.15)'),
                  borderRadius: 10, padding: '10px 8px', cursor: sentPlayType ? 'default' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'background .15s, border-color .15s',
                }}>
                <span style={{ fontSize: 26, lineHeight: 1 }}>{play.emoji}</span>
                <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 12, color: TEXT, textAlign: 'center' }}>{play.name}</div>
                <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, textAlign: 'center', lineHeight: 1.3 }}>{play.desc}</div>
                <div style={{ fontFamily: fD, fontSize: 13, color: GOLD, letterSpacing: 1, marginTop: 2 }}>
                  {isSent ? (isPendingThis ? '⏳ PENDING' : '✓ SENT') : fmtCents(play.cents)}
                </div>
                {play.needsApproval && !isSent && (
                  <div style={{ fontFamily: fM, fontSize: 6, color: BURG, letterSpacing: 1 }}>HOST APPROVES</div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          Plays go to the host · host approves jail, hot seat & eject
        </div>
      </div>
    </div>
  );
}
