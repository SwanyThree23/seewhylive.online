'use strict';
import React, { useState, useEffect } from 'react';

function _authHeaders(extra) {
  var tok = localStorage.getItem('sw_token') || '';
  var h = tok ? { 'Authorization': 'Bearer ' + tok } : {};
  return Object.assign(h, extra || {});
}

var BG    = '#0E0C09';
var SURF  = '#1A1510';
var CARD  = '#241C12';
var GOLD  = '#C9A84C';
var BURG  = '#800020';
var AMBER = '#D4854A';
var TEXT  = '#F0E8D4';
var MUTED = '#8A7A62';
var fD = "'Bebas Neue',sans-serif";
var fU = "'Barlow Condensed',sans-serif";
var fM = "'DM Mono',monospace";

function fmtC(c) { return '$' + (Math.floor(c || 0) / 100).toFixed(2); }
function fmtDate(ts) {
  var d = new Date(ts * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

var MOCK_SESSIONS = [
  { id: 1, date: Math.floor(Date.now()/1000) - 86400,     label: 'Washington Classic QF Night',  totalCents: 8450,  superChats: 6, gifts: 14, tips: 4, viewers: 234 },
  { id: 2, date: Math.floor(Date.now()/1000) - 86400*3,   label: 'Friday Night Dominos',         totalCents: 5200,  superChats: 3, gifts: 8,  tips: 2, viewers: 156 },
  { id: 3, date: Math.floor(Date.now()/1000) - 86400*7,   label: 'Community Conversation',       totalCents: 3100,  superChats: 2, gifts: 5,  tips: 7, viewers: 89  },
  { id: 4, date: Math.floor(Date.now()/1000) - 86400*10,  label: 'Beat Production LIVE',         totalCents: 12300, superChats: 9, gifts: 22, tips: 3, viewers: 412 },
  { id: 5, date: Math.floor(Date.now()/1000) - 86400*14,  label: 'Washington Classic Preview',   totalCents: 6700,  superChats: 5, gifts: 11, tips: 6, viewers: 198 },
];

export default function PayoutDashboard({ addToast, roomId }) {
  var [sessions, setSessions] = useState([]);
  var [loading, setLoading]   = useState(true);

  useEffect(function() {
    setLoading(true);
    fetch('/api/payout-history' + (roomId ? '?roomId=' + roomId : ''), { headers: _authHeaders() })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (data && data.sessions) setSessions(data.sessions);
      })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }, [roomId]);

  var totalCents    = sessions.reduce(function(s, sess) { return s + Math.floor(sess.totalCents || 0); }, 0);
  var creatorCents  = Math.floor(totalCents * 0.9);
  var platformCents = totalCents - creatorCents;
  var lifetimeViews = sessions.reduce(function(s, sess) { return s + (sess.viewers || 0); }, 0);

  function exportCSV() {
    var rows = ['Date,Session,Total,Your 90%,Platform 10%,SuperChats,Gifts,Tips,Viewers'];
    sessions.forEach(function(sess) {
      var cr = Math.floor((sess.totalCents || 0) * 0.9);
      var pl = (sess.totalCents || 0) - cr;
      rows.push([
        fmtDate(sess.date),
        '"' + (sess.label || '') + '"',
        fmtC(sess.totalCents),
        fmtC(cr),
        fmtC(pl),
        sess.superChats || 0,
        sess.gifts || 0,
        sess.tips || 0,
        sess.viewers || 0,
      ].join(','));
    });
    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'seewhy-payouts.csv'; a.click();
    URL.revokeObjectURL(url);
    if (addToast) addToast('CSV exported!', 'success');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: fD, fontSize: 20, color: GOLD, letterSpacing: 2 }}>PAYOUT DASHBOARD</div>
          <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginTop: 2 }}>{sessions.length} sessions · 90% creator split</div>
        </div>
        <button onClick={exportCSV} style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '7px 12px', color: GOLD, fontFamily: fD, fontSize: 11, letterSpacing: 1.5, cursor: 'pointer' }}>
          ↓ CSV
        </button>
      </div>

      {/* Lifetime stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'TOTAL EARNED', val: fmtC(totalCents),   color: TEXT },
          { label: 'YOUR 90%',     val: fmtC(creatorCents),  color: GOLD },
          { label: 'PLATFORM 10%', val: fmtC(platformCents), color: MUTED },
          { label: 'SESSIONS',     val: String(sessions.length), color: AMBER },
          { label: 'TOTAL VIEWERS',val: lifetimeViews.toLocaleString(), color: AMBER },
          { label: 'AVG/SESSION',  val: fmtC(sessions.length > 0 ? Math.floor(totalCents / sessions.length) : 0), color: GOLD },
        ].map(function(stat) {
          return (
            <div key={stat.label} style={{ background: CARD, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, letterSpacing: .5, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontFamily: fD, fontSize: 16, color: stat.color, letterSpacing: 1 }}>{stat.val}</div>
            </div>
          );
        })}
      </div>

      {/* 90/10 split bar */}
      <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: '90%', background: 'linear-gradient(90deg,#800020,#C9A84C)' }} />
        <div style={{ width: '10%', background: MUTED }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fM, fontSize: 7, color: MUTED }}>
        <span style={{ color: GOLD }}>CREATOR 90% — {fmtC(creatorCents)}</span>
        <span>PLATFORM 10% — {fmtC(platformCents)}</span>
      </div>

      {/* Session history */}
      <div style={{ fontFamily: fM, fontSize: 8, color: GOLD, letterSpacing: 2, marginTop: 4 }}>SESSION HISTORY</div>
      {loading && <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, textAlign: 'center', padding: 20 }}>Loading...</div>}
      {!loading && sessions.length === 0 && (
        <div style={{ background: SURF, border: '1px dashed rgba(201,168,76,.15)', borderRadius: 10, padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: fM, fontSize: 9, color: MUTED }}>No sessions yet — earnings will appear here after your first stream</div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sessions.map(function(sess) {
          var cr = Math.floor((sess.totalCents || 0) * 0.9);
          return (
            <div key={sess.id} style={{ background: SURF, border: '1px solid rgba(201,168,76,.1)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: TEXT }}>{sess.label || 'Live Session'}</div>
                <div style={{ fontFamily: fD, fontSize: 14, color: GOLD }}>{fmtC(cr)}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontFamily: fM, fontSize: 7, color: MUTED }}>{fmtDate(sess.date)}</span>
                <span style={{ fontFamily: fM, fontSize: 7, color: MUTED }}>SC {sess.superChats || 0}</span>
                <span style={{ fontFamily: fM, fontSize: 7, color: MUTED }}>G {sess.gifts || 0}</span>
                <span style={{ fontFamily: fM, fontSize: 7, color: MUTED }}>V {sess.viewers || 0}</span>
                <span style={{ fontFamily: fM, fontSize: 7, color: MUTED, marginLeft: 'auto' }}>total {fmtC(sess.totalCents)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
