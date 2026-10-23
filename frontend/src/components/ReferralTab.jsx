'use strict';
import React, { useState, useEffect } from 'react';

var BG   = '#0E0C09';
var SURF = '#1A1510';
var CARD = '#241C12';
var GOLD = '#C9A84C';
var BURG = '#800020';
var TEXT = '#F0E8D4';
var MUTED = '#8A7A62';
var TEAL = '#D4854A';
var fD = "'Bebas Neue',sans-serif";
var fU = "'Barlow Condensed',sans-serif";
var fM = "'DM Mono',monospace";

function _authHeaders(extra) {
  var tok = localStorage.getItem('sw_token') || '';
  var h = tok ? { 'Authorization': 'Bearer ' + tok } : {};
  return Object.assign(h, extra || {});
}

function fmtC(c) { return '$' + (Math.floor(c || 0) / 100).toFixed(2); }

export default function ReferralTab({ addToast }) {
  var [code,       setCode]       = useState('');
  var [stats,      setStats]      = useState(null);
  var [loading,    setLoading]    = useState(true);
  var [regCode,    setRegCode]    = useState('');
  var [regLoading, setRegLoading] = useState(false);
  var [copied,     setCopied]     = useState(false);

  useEffect(function() {
    setLoading(true);
    fetch('/api/referral/code', { headers: _authHeaders() })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) {
        if (d) {
          setCode(d.code || '');
        }
      })
      .catch(function() {})
      .finally(function() { setLoading(false); });

    fetch('/api/referral/stats', { headers: _authHeaders() })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) { if (d) setStats(d); })
      .catch(function() {});
  }, []);

  function handleCopy() {
    var link = window.location.origin + '/?ref=' + code;
    navigator.clipboard.writeText(link).then(function() {
      setCopied(true);
      setTimeout(function() { setCopied(false); }, 2500);
      if (addToast) addToast('Referral link copied!', 'success');
    }).catch(function() {
      if (addToast) addToast(link, 'info');
    });
  }

  function handleRegister() {
    var c = regCode.trim().toUpperCase();
    if (!c) return;
    setRegLoading(true);
    fetch('/api/referral/register', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ code: c }),
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) {
          if (addToast) addToast(d.message || '30 days Pro granted!', 'success');
          setRegCode('');
        } else {
          if (addToast) addToast(d.error || 'Invalid code', 'error');
        }
      })
      .catch(function() { if (addToast) addToast('Network error', 'error'); })
      .finally(function() { setRegLoading(false); });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 2px' }}>

      {/* Header */}
      <div>
        <div style={{ fontFamily: fD, fontSize: 22, color: GOLD, letterSpacing: 2 }}>REFERRAL PROGRAM</div>
        <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginTop: 3, lineHeight: 1.5 }}>
          Invite creators · earn 10% of their earnings for 12 months · platform-paid bonus
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: CARD, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ fontFamily: fM, fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 8 }}>HOW IT WORKS</div>
        {[
          { emoji: '🔗', text: 'Share your referral link with another creator' },
          { emoji: '📺', text: 'They go live 3 times in 30 days to unlock the bonus' },
          { emoji: '💰', text: 'You earn 10% of their earnings for 12 months — paid by us, not them' },
          { emoji: '🎁', text: 'They get 30 days Pro + 500 Fuel on signup' },
        ].map(function(step, i) {
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < 3 ? 8 : 0 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{step.emoji}</span>
              <div style={{ fontFamily: fU, fontSize: 12, color: TEXT, lineHeight: 1.4 }}>{step.text}</div>
            </div>
          );
        })}
      </div>

      {/* Your referral link */}
      {loading ? (
        <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, textAlign: 'center', padding: 16 }}>Loading...</div>
      ) : code ? (
        <div style={{ background: SURF, border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontFamily: fM, fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 8 }}>YOUR REFERRAL LINK</div>
          <div style={{ fontFamily: fM, fontSize: 9, color: TEXT, background: CARD, borderRadius: 8, padding: '8px 10px', marginBottom: 8, wordBreak: 'break-all' }}>
            {window.location.origin + '/?ref=' + code}
          </div>
          <button onClick={handleCopy} style={{ width: '100%', background: copied ? 'rgba(201,168,76,.25)' : 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, padding: '8px', color: GOLD, fontFamily: fD, fontSize: 13, letterSpacing: 2, cursor: 'pointer' }}>
            {copied ? '✓ COPIED' : '↗ COPY LINK'}
          </button>
          <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, textAlign: 'center', marginTop: 6 }}>Code: <span style={{ color: TEXT }}>{code}</span></div>
        </div>
      ) : null}

      {/* Enter a code */}
      <div style={{ background: SURF, border: '1px solid rgba(201,168,76,.1)', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ fontFamily: fM, fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 8 }}>ENTER A REFERRAL CODE</div>
        <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, marginBottom: 8, lineHeight: 1.5 }}>
          Got referred by another creator? Enter their code to get 30 days Pro + 500 Fuel.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={regCode}
            onChange={function(e) { setRegCode(e.target.value.toUpperCase().slice(0, 20)); }}
            placeholder="ENTER CODE"
            style={{ flex: 1, background: CARD, border: '1px solid rgba(201,168,76,.25)', borderRadius: 8, padding: '7px 10px', color: TEXT, fontFamily: fM, fontSize: 10, outline: 'none', letterSpacing: 1 }}
          />
          <button
            onClick={handleRegister}
            disabled={!regCode.trim() || regLoading}
            style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, padding: '7px 14px', color: GOLD, fontFamily: fD, fontSize: 12, letterSpacing: 1.5, cursor: regCode.trim() ? 'pointer' : 'not-allowed', opacity: regCode.trim() ? 1 : .5 }}>
            {regLoading ? '...' : 'APPLY'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ background: CARD, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontFamily: fM, fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 10 }}>YOUR REFERRAL STATS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'TOTAL BONUS', val: fmtC(stats.totalBonusCents), color: GOLD },
              { label: 'REFERRALS', val: String((stats.referrals || []).length), color: TEAL },
            ].map(function(s) {
              return (
                <div key={s.label} style={{ background: SURF, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, letterSpacing: .5, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: fD, fontSize: 18, color: s.color }}>{s.val}</div>
                </div>
              );
            })}
          </div>

          {(stats.referrals || []).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats.referrals.map(function(r, i) {
                return (
                  <div key={i} style={{ background: SURF, borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 12, color: TEXT }}>{r.referred_username || 'Pending'}</div>
                      <div style={{ fontFamily: fM, fontSize: 7, color: MUTED }}>{r.lives_count || 0}/3 lives</div>
                    </div>
                    <div style={{ fontFamily: fD, fontSize: 11, letterSpacing: 1, color: r.status === 'unlocked' ? GOLD : MUTED }}>
                      {r.status === 'unlocked' ? '✓ UNLOCKED' : r.status === 'pending' ? 'PENDING' : r.status.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
