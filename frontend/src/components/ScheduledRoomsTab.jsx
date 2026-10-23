'use strict';
import React, { useState, useEffect } from 'react';

var SURF  = '#1A1510';
var CARD  = '#241C12';
var GOLD  = '#C9A84C';
var TEXT  = '#F0E8D4';
var MUTED = '#8A7A62';
var LIVE  = '#FF1A3C';
var fD = "'Bebas Neue',sans-serif";
var fU = "'Barlow Condensed',sans-serif";
var fM = "'DM Mono',monospace";

function _authHeaders(extra) {
  var tok = localStorage.getItem('sw_token') || '';
  var h = tok ? { 'Authorization': 'Bearer ' + tok } : {};
  return Object.assign(h, extra || {});
}

function fmtDt(ts) {
  return new Date(ts * 1000).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function countdown(ts) {
  var diff = ts - Math.floor(Date.now() / 1000);
  if (diff <= 0) return 'NOW';
  if (diff < 60) return diff + 's';
  if (diff < 3600) return Math.floor(diff / 60) + 'm';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ' + Math.floor((diff % 3600) / 60) + 'm';
  return Math.floor(diff / 86400) + 'd ' + Math.floor((diff % 86400) / 3600) + 'h';
}

export default function ScheduledRoomsTab({ addToast }) {
  var [events,    setEvents]    = useState([]);
  var [loading,   setLoading]   = useState(true);
  var [rsvpd,     setRsvpd]     = useState({});
  var [busy,      setBusy]      = useState({});
  var [tick,      setTick]      = useState(0);
  var myUserId = localStorage.getItem('sw_userId') || '';

  function load() {
    setLoading(true);
    fetch('/api/schedule/public')
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) {
        if (!d) return;
        var evts = d.events || [];
        setEvents(evts);
        // check which ones we've RSVPd — use a simple per-event check stored in localStorage
        try {
          var stored = JSON.parse(localStorage.getItem('sw_rsvps') || '{}');
          setRsvpd(stored);
        } catch(_) {}
      })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }

  useEffect(function() { load(); }, []);

  // Tick every 30s to update countdowns
  useEffect(function() {
    var id = setInterval(function() { setTick(function(n) { return n + 1; }); }, 30000);
    return function() { clearInterval(id); };
  }, []);

  function handleRsvp(evtId) {
    if (busy[evtId]) return;
    setBusy(function(b) { var n = Object.assign({}, b); n[evtId] = true; return n; });
    var isRsvpd = !!rsvpd[evtId];
    var method  = isRsvpd ? 'DELETE' : 'POST';
    fetch('/api/schedule/' + encodeURIComponent(evtId) + '/rsvp', { method: method, headers: _authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) {
          setRsvpd(function(prev) {
            var n = Object.assign({}, prev);
            if (isRsvpd) { delete n[evtId]; } else { n[evtId] = true; }
            try { localStorage.setItem('sw_rsvps', JSON.stringify(n)); } catch(_) {}
            return n;
          });
          setEvents(function(prev) {
            return prev.map(function(e) {
              if (e.id !== evtId) return e;
              return Object.assign({}, e, { rsvp_count: Math.max(0, (e.rsvp_count || 0) + (isRsvpd ? -1 : 1)) });
            });
          });
          if (addToast) addToast(isRsvpd ? 'RSVP cancelled' : 'RSVP confirmed — you\'ll be notified when it goes live!', 'success');
        } else {
          if (addToast) addToast(d.error || 'Error', 'error');
        }
      })
      .catch(function() { if (addToast) addToast('Network error', 'error'); })
      .finally(function() { setBusy(function(b) { var n = Object.assign({}, b); delete n[evtId]; return n; }); });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 2px' }}>

      {/* Header */}
      <div>
        <div style={{ fontFamily: fD, fontSize: 22, color: GOLD, letterSpacing: 2 }}>SCHEDULED ROOMS</div>
        <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginTop: 3, lineHeight: 1.5 }}>
          RSVP for upcoming live events · get notified the moment they go live
        </div>
      </div>

      {loading ? (
        <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, textAlign: 'center', padding: 24 }}>Loading...</div>
      ) : events.length === 0 ? (
        <div style={{ background: SURF, border: '1px dashed rgba(201,168,76,.15)', borderRadius: 12, padding: '32px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: fD, fontSize: 28, color: MUTED, marginBottom: 8 }}>📅</div>
          <div style={{ fontFamily: fM, fontSize: 9, color: MUTED }}>No upcoming rooms scheduled</div>
          <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, marginTop: 4 }}>Check back soon — hosts add events from the Schedule tab</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map(function(ev) {
            var isRsvpd = !!rsvpd[ev.id];
            var isBusy  = !!busy[ev.id];
            var cd = countdown(ev.scheduled_at);
            var isNow = cd === 'NOW';
            return (
              <div key={ev.id} style={{ background: SURF, border: '1px solid ' + (isNow ? 'rgba(255,26,60,.4)' : 'rgba(201,168,76,.12)'), borderRadius: 12, padding: '14px 16px' }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 15, color: TEXT, lineHeight: 1.2 }}>{ev.title}</div>
                    {ev.category ? <div style={{ fontFamily: fM, fontSize: 7, color: GOLD, marginTop: 2, letterSpacing: 1 }}>{ev.category.toUpperCase()}</div> : null}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: fD, fontSize: 16, color: isNow ? LIVE : GOLD, letterSpacing: 1 }}>{cd}</div>
                    {isNow && <div style={{ fontFamily: fM, fontSize: 7, color: LIVE, letterSpacing: 1, marginTop: 1 }}>LIVE NOW</div>}
                  </div>
                </div>

                {/* Date */}
                <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, marginBottom: ev.desc ? 6 : 10 }}>{fmtDt(ev.scheduled_at)}</div>

                {ev.desc ? <div style={{ fontFamily: fU, fontSize: 12, color: MUTED, marginBottom: 10, lineHeight: 1.4 }}>{ev.desc}</div> : null}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontFamily: fM, fontSize: 7, color: MUTED }}>
                    {(ev.rsvp_count || 0) > 0 ? (ev.rsvp_count) + ' going' : 'Be the first to RSVP'}
                  </div>
                  <button onClick={function() { handleRsvp(ev.id); }} disabled={isBusy}
                    style={{ background: isRsvpd ? 'rgba(201,168,76,.25)' : 'rgba(201,168,76,.1)', border: '1px solid ' + (isRsvpd ? 'rgba(201,168,76,.6)' : 'rgba(201,168,76,.3)'), borderRadius: 8, padding: '6px 14px', color: GOLD, fontFamily: fD, fontSize: 11, letterSpacing: 1.5, cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1 }}>
                    {isBusy ? '...' : isRsvpd ? '✓ GOING' : 'RSVP'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notification reminder */}
      <div style={{ background: CARD, borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, lineHeight: 1.6 }}>
          💡 Enable push notifications in Settings to receive an alert the moment a room you RSVPd to goes live.
        </div>
      </div>
    </div>
  );
}
