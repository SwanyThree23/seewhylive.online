import React, { useState, useEffect } from 'react';

var GOLD   = '#C9A84C';
var BURG   = '#800020';
var AMBER  = '#D4854A';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';
var CARD   = '#241C12';
var SURF   = '#1A1510';
var BORDER = 'rgba(201,168,76,.12)';
var DIM    = '#3D3020';

var STYLE_TAG =
  '@keyframes podiumRise {' +
  '  0%   { transform: translateY(20px); opacity: 0; }' +
  '  100% { transform: translateY(0);    opacity: 1; }' +
  '}' +
  '@keyframes crownSpin {' +
  '  0%   { transform: rotate(-8deg) scale(1); }' +
  '  50%  { transform: rotate(8deg) scale(1.15); }' +
  '  100% { transform: rotate(-8deg) scale(1); }' +
  '}' +
  '@keyframes lbFadeIn {' +
  '  from { opacity: 0; transform: translateY(12px); }' +
  '  to   { opacity: 1; transform: translateY(0); }' +
  '}';

var MEDALS = ['👑', '🥈', '🥉'];
var MEDAL_COLORS = [GOLD, '#A8A8B0', AMBER];
var MEDAL_SIZES  = [52, 42, 38];

function getInitials(name) {
  if (!name) return '??';
  var parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtAmount(cents) {
  if (cents >= 10000) return '$' + (Math.floor(cents / 100)).toLocaleString();
  if (cents >= 100)   return '$' + (Math.floor(cents / 100)) + '.' + String(cents % 100).padStart(2, '0');
  return cents + '¢';
}

export default function GiftLeaderboardOverlay(props) {
  var socket  = props.socket;
  var roomId  = props.roomId;
  var isLive  = props.isLive;

  var [leaders,  setLeaders]  = useState([]);
  var [visible,  setVisible]  = useState(false);
  var [expanded, setExpanded] = useState(false);

  useEffect(function() {
    if (!socket) return;

    function onLeaderboard(data) {
      if (!data || !data.roomId || String(data.roomId) !== String(roomId)) return;
      setLeaders(data.leaders || []);
      setVisible(true);
    }

    function onBroadcastEnded() {
      setVisible(false);
      setLeaders([]);
    }

    socket.on('gift-leaderboard', onLeaderboard);
    socket.on('broadcast-ended', onBroadcastEnded);
    return function() {
      socket.off('gift-leaderboard', onLeaderboard);
      socket.off('broadcast-ended', onBroadcastEnded);
    };
  }, [socket, roomId]);

  if (!isLive || !visible || leaders.length === 0) return null;

  var top3   = leaders.slice(0, 3);
  var rest   = expanded ? leaders.slice(3, 10) : [];

  return (
    <div style={{ position: 'fixed', bottom: 210, left: 16, zIndex: 700, maxWidth: 220, animation: 'lbFadeIn .35s ease forwards' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLE_TAG }} />

      {/* Header row */}
      <div
        onClick={function() { setExpanded(function(e) { return !e; }); }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(14,12,9,.92)', border: '1px solid ' + BORDER, borderRadius: expanded ? '8px 8px 0 0' : 8, padding: '5px 10px', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, animation: 'crownSpin 3s ease infinite' }}>👑</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1 }}>TOP GIFTERS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: TEXT }}>{leaders.length}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Top-3 podium */}
      <div style={{ background: 'rgba(14,12,9,.92)', border: '1px solid ' + BORDER, borderTop: 'none', borderRadius: expanded ? 0 : '0 0 8px 8px', padding: '8px 10px', backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
          {[1, 0, 2].map(function(rank) {
            var entry = top3[rank];
            if (!entry) return null;
            var size    = MEDAL_SIZES[rank];
            var color   = MEDAL_COLORS[rank];
            var initials = getInitials(entry.username);
            var podiumH = rank === 0 ? 28 : rank === 1 ? 18 : 12;
            return (
              <div key={rank} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, animation: 'podiumRise .4s ease ' + (rank * 0.08) + 's both' }}>
                <span style={{ fontSize: rank === 0 ? 14 : 11, lineHeight: 1 }}>{MEDALS[rank]}</span>
                <div style={{ width: size, height: size, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, ' + color + ', rgba(0,0,0,.6))', border: '2px solid ' + color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: rank === 0 ? 14 : 11, color: rank === 0 ? '#0E0C09' : TEXT }}>
                  {initials}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: color, textAlign: 'center', maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.username || 'Anon'}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: TEXT }}>{fmtAmount(entry.totalCents)}</div>
                <div style={{ height: podiumH, width: size + 8, background: 'linear-gradient(180deg,' + color + '22,' + color + '08)', border: '1px solid ' + color + '33', borderBottom: 'none', borderRadius: '3px 3px 0 0' }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded #4-10 list */}
      {expanded && rest.length > 0 && (
        <div style={{ background: 'rgba(14,12,9,.92)', border: '1px solid ' + BORDER, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '6px 10px', backdropFilter: 'blur(8px)' }}>
          {rest.map(function(entry, i) {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: i < rest.length - 1 ? '1px solid rgba(201,168,76,.06)' : 'none' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, width: 12, textAlign: 'right', flexShrink: 0 }}>{i + 4}</span>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: DIM, border: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 8, color: TEXT, flexShrink: 0 }}>
                  {getInitials(entry.username)}
                </div>
                <div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.username || 'Anon'}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: TEXT, flexShrink: 0 }}>{fmtAmount(entry.totalCents)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dismiss */}
      <button
        onClick={function() { setVisible(false); }}
        style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', color: MUTED, fontSize: 10, cursor: 'pointer', lineHeight: 1, padding: '2px 3px' }}>
        ✕
      </button>
    </div>
  );
}
