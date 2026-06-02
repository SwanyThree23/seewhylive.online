'use strict';
import React, { useState, useEffect, useRef } from 'react';
import UpgradeGate from './UpgradeGate.jsx';

var BG     = '#0E0C09';
var SURF   = '#1A1510';
var CARD   = '#241C12';
var CARD2  = '#2E2318';
var BORDER = 'rgba(201,168,76,.12)';
var GOLD   = '#C9A84C';
var BURG   = '#800020';
var AMBER  = '#D4854A';
var RED    = '#FF1A3C';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';
var DIM    = '#3D3020';

function fmtDollars(cents) {
  return '$' + (Math.floor(cents || 0) / 100).toFixed(2);
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

// ── SVG Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data }) {
  var W = 400;
  var H = 80;
  if (!data || data.length < 2) {
    return (
      <svg width="100%" viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="none" style={{ display: 'block' }}>
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke={GOLD} strokeWidth="2" opacity="0.3" />
      </svg>
    );
  }
  var maxVal = Math.max.apply(null, data.concat([1]));
  var pts = data.map(function(v, i) {
    var x = Math.floor((i / (data.length - 1)) * W);
    var y = Math.floor(H - (v / maxVal) * (H - 8) - 4);
    return x + ',' + y;
  });
  var polyPts = pts.join(' ');
  // Fill area under line
  var fillPts = '0,' + H + ' ' + polyPts + ' ' + W + ',' + H;
  return (
    <svg width="100%" viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.25" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill="url(#sparkFill)" />
      <polyline points={polyPts} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {(function() {
        var last = pts[pts.length - 1].split(',');
        return <circle cx={last[0]} cy={last[1]} r="4" fill={GOLD} />;
      })()}
    </svg>
  );
}

// ── Mini bar chart for chat buckets ──────────────────────────────────────────
function ChatBucketBars({ buckets }) {
  var maxV = Math.max.apply(null, (buckets || []).concat([1]));
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 40 }}>
      {(buckets || []).map(function(v, i) {
        var h = Math.max(3, Math.floor((v / maxV) * 36));
        var isLast = i === (buckets.length - 1);
        return (
          <div key={i} style={{
            flex: 1,
            height: h,
            background: isLast ? GOLD : (v > 0 ? 'rgba(201,168,76,.45)' : DIM),
            borderRadius: '2px 2px 0 0',
            transition: 'height .35s ease',
          }} />
        );
      })}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: CARD,
      border: '1px solid ' + BORDER,
      borderRadius: 10,
      padding: '10px 12px',
    }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: color || GOLD, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: DIM, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function AnalyticsTab({ socket, roomId, role, isLive, addToast }) {
  var [viewerHistory, setViewerHistory] = useState([]);
  var [viewers, setViewers] = useState(0);
  var [peak, setPeak] = useState(0);
  var [msgRate, setMsgRate] = useState(0);
  var [earnings, setEarnings] = useState(0);
  var [chatBuckets, setChatBuckets] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  var [streamSecs, setStreamSecs] = useState(0);
  var pingRef = useRef(null);
  var timerRef = useRef(null);
  var liveStartRef = useRef(null);

  // Start stream timer when isLive flips true
  useEffect(function() {
    if (isLive) {
      if (!liveStartRef.current) liveStartRef.current = Date.now();
      timerRef.current = setInterval(function() {
        setStreamSecs(Math.floor((Date.now() - liveStartRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      liveStartRef.current = null;
      setStreamSecs(0);
    }
    return function() {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive]);

  // Socket listener for analytics-update
  useEffect(function() {
    if (!socket) return;
    function onUpdate(data) {
      if (!data) return;
      if (typeof data.viewers === 'number') setViewers(data.viewers);
      if (typeof data.peak    === 'number') setPeak(data.peak);
      if (typeof data.msgRate === 'number') setMsgRate(data.msgRate);
      if (typeof data.earnings === 'number') setEarnings(data.earnings);
      if (Array.isArray(data.chatBuckets))  setChatBuckets(data.chatBuckets);
      if (Array.isArray(data.viewerHistory)) setViewerHistory(data.viewerHistory);
    }
    socket.on('analytics-update', onUpdate);
    return function() { socket.off('analytics-update', onUpdate); };
  }, [socket]);

  // Ping every 10s
  useEffect(function() {
    if (!socket || !roomId) return;
    function ping() {
      socket.emit('analytics-ping', { roomId: roomId });
    }
    ping(); // immediate first ping
    pingRef.current = setInterval(ping, 10000);
    return function() {
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [socket, roomId]);

  var h = Math.floor(streamSecs / 3600);
  var m = Math.floor((streamSecs % 3600) / 60);
  var s = streamSecs % 60;
  var streamTime = pad2(h) + ':' + pad2(m) + ':' + pad2(s);

  var revenuePerViewer = (peak > 0)
    ? fmtDollars(Math.floor(earnings / peak))
    : '$0.00';

  var inner = (
    <div style={{
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: 480,
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(201,168,76,.06)',
        border: '1px solid rgba(201,168,76,.25)',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: GOLD, letterSpacing: 3 }}>📊 CREATOR ANALYTICS</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>
            {isLive ? 'LIVE · updates every 10s' : 'Stream offline'}
          </div>
        </div>
        {isLive && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,26,60,.15)',
            border: '1px solid rgba(255,26,60,.4)',
            borderRadius: 999, padding: '3px 10px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: RED }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: RED, letterSpacing: 1 }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      <div style={{
        background: CARD,
        border: '1px solid ' + BORDER,
        borderRadius: 12,
        padding: '10px 12px',
        overflow: 'hidden',
      }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: GOLD, letterSpacing: 2, marginBottom: 8 }}>
          VIEWER TREND
        </div>
        <Sparkline data={viewerHistory.length > 0 ? viewerHistory : [0]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: DIM }}>older</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>last 20 pings</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: DIM }}>now</span>
        </div>
      </div>

      {/* Stats grid (2x3) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatCard label="LIVE NOW"         value={viewers}          sub="current viewers"       color={RED}   />
        <StatCard label="PEAK VIEWERS"     value={peak}             sub="session maximum"        color={AMBER} />
        <StatCard label="SESSION EARNINGS" value={fmtDollars(earnings)} sub="superchat + gifts" color={GOLD}  />
        <StatCard label="REVENUE/VIEWER"   value={revenuePerViewer} sub="earnings ÷ peak"        color={GOLD}  />
        <StatCard label="CHAT MSGS/MIN"    value={msgRate}          sub="last 2 min avg"         color={MUTED} />
        <StatCard label="STREAM TIME"      value={streamTime}       sub={isLive ? 'running' : 'not live'} color={TEXT} />
      </div>

      {/* Chat activity bars */}
      <div style={{
        background: CARD,
        border: '1px solid ' + BORDER,
        borderRadius: 12,
        padding: '10px 12px',
      }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 2, marginBottom: 8 }}>
          CHAT ACTIVITY — LAST 10 MIN
        </div>
        <ChatBucketBars buckets={chatBuckets} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: DIM }}>10m ago</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: DIM }}>now</span>
        </div>
      </div>

      {/* Revenue split reminder */}
      {earnings > 0 && (
        <div style={{
          background: CARD,
          border: '1px solid ' + BORDER,
          borderRadius: 12,
          padding: '10px 14px',
        }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 2, marginBottom: 8 }}>
            REVENUE SPLIT
          </div>
          <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
            <div style={{ width: '90%', background: 'linear-gradient(90deg,' + BURG + ',' + GOLD + ')' }} />
            <div style={{ flex: 1, background: DIM }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, lineHeight: 1 }}>
                {fmtDollars(Math.floor(earnings * 0.9))}
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD }}>YOU (90%)</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: MUTED, lineHeight: 1 }}>
                {fmtDollars(Math.floor(earnings * 0.1))}
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>PLATFORM (10%)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <UpgradeGate feature="analytics">
      {inner}
    </UpgradeGate>
  );
}
