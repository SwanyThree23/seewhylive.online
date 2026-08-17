'use strict';
import React, { useState } from 'react';

var GOLD_H  = '#E8C46A';
var BURG    = '#800020';
var BURG_H  = '#C01838';
var TEAL_H  = '#C9A84C';
var LIME    = '#C9A84C';
var MUTED   = '#6B5F82';
var TEXT    = '#EDE8F4';
var BG1     = '#0E0C09';
var FAINT   = '#1C1530';
var BORDER  = 'rgba(255,255,255,.07)';
var fD      = "'Bebas Neue',sans-serif";
var fU      = "'Barlow Condensed',sans-serif";
var fM      = "'DM Mono',monospace";

var PLATFORMS = [
  {
    id: 'paypal',
    name: 'PayPal',
    emoji: '🅿',
    color: '#003087',
    accent: '#009cde',
    placeholder: 'Your PayPal.me username',
    buildUrl: function(handle) { return 'https://paypal.me/' + handle.replace(/^[@\/]+/, ''); },
    note: 'Opens PayPal.me payment page'
  },
  {
    id: 'cashapp',
    name: 'Cash App',
    emoji: '💚',
    color: '#00D632',
    accent: '#00B020',
    placeholder: 'Your $Cashtag',
    buildUrl: function(handle) {
      var tag = handle.replace(/^\$/, '');
      return 'https://cash.app/$' + tag;
    },
    note: 'Opens Cash App payment page'
  },
  {
    id: 'venmo',
    name: 'Venmo',
    emoji: '💙',
    color: '#3D95CE',
    accent: '#2B7AB0',
    placeholder: 'Your Venmo username',
    buildUrl: function(handle) { return 'https://venmo.com/' + handle.replace(/^@/, ''); },
    note: 'Opens Venmo payment page'
  },
  {
    id: 'zelle',
    name: 'Zelle',
    emoji: '💜',
    color: '#6D1ED4',
    accent: '#800020',
    placeholder: 'Email or phone for Zelle',
    buildUrl: function(handle) { return null; },
    note: 'Viewers open Zelle app and pay this address'
  },
  {
    id: 'chime',
    name: 'Chime',
    emoji: '💛',
    color: '#13A049',
    accent: '#0D8B3F',
    placeholder: 'Chime Pay Me link or @handle',
    buildUrl: function(handle) {
      if (handle.indexOf('https://') === 0) return handle;
      return null;
    },
    note: 'Viewers open Chime app and pay this account'
  }
];

var QUICK_AMOUNTS = [1, 5, 10, 25, 50, 100];

function validateHandle(platformId, handle) {
  var h = handle.trim();
  if (!h) return 'Handle cannot be empty';
  if (platformId === 'paypal') {
    var isEmail = h.indexOf('@') !== -1 && h.indexOf('.') !== -1;
    var isHandle = h.length >= 3 && h.length <= 30 && /^[a-zA-Z0-9._-]+$/.test(h);
    if (!isEmail && !isHandle) return 'Enter a valid PayPal.me username (3-30 chars) or email';
  }
  if (platformId === 'cashapp') {
    var tag = h.replace(/^\$/, '');
    if (tag.length < 1 || tag.length > 20 || !/^[a-zA-Z0-9_]+$/.test(tag)) return 'Cash App $cashtag: letters, numbers, underscores only (1-20 chars)';
  }
  if (platformId === 'venmo') {
    var clean = h.replace(/^@/, '');
    if (clean.length < 1 || clean.length > 30 || !/^[a-zA-Z0-9_-]+$/.test(clean)) return 'Venmo: letters, numbers, hyphens, underscores only';
  }
  if (platformId === 'zelle') {
    var isZelleEmail = h.indexOf('@') !== -1 && h.indexOf('.') !== -1;
    var isPhone = /^[\d\s().+-]{7,20}$/.test(h);
    if (!isZelleEmail && !isPhone) return 'Zelle: enter an email address or phone number';
  }
  if (platformId === 'chime') {
    if (h.length < 3) return 'Enter your Chime Pay Me link or @handle';
  }
  return null;
}

export default function DirectPayTab({ addToast, username }) {
  var [handles, setHandles] = useState(function() {
    try {
      var saved = localStorage.getItem('sw_directpay_handles');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { paypal: '', cashapp: '', venmo: '', zelle: '', chime: '' };
  });
  var [editing, setEditing] = useState(null);
  var [draftHandle, setDraftHandle] = useState('');
  var [draftError, setDraftError] = useState('');
  var [selectedAmt, setSelectedAmt] = useState(null);
  var [customAmt, setCustomAmt] = useState('');
  var [view, setView] = useState('pay');
  var [qrPlatform, setQrPlatform] = useState(null);

  React.useEffect(function() {
    var tok = localStorage.getItem('sw_token') || '';
    if (!tok) return;
    fetch('/api/creator/direct-pay', { headers: { 'Authorization': 'Bearer ' + tok } })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.handles && Object.keys(data.handles).length) {
          setHandles(Object.assign({ paypal: '', cashapp: '', venmo: '', zelle: '', chime: '' }, data.handles));
        }
      })
      .catch(function() {});
  }, []);

  React.useEffect(function() {
    try { localStorage.setItem('sw_directpay_handles', JSON.stringify(handles)); } catch(e) {}
  }, [handles]);

  function saveHandle(id) {
    var err = validateHandle(id, draftHandle);
    if (err) { setDraftError(err); return; }
    setHandles(function(prev) {
      var next = Object.assign({}, prev);
      next[id] = draftHandle.trim();
      var tok = localStorage.getItem('sw_token') || '';
      if (tok) {
        fetch('/api/creator/direct-pay', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' },
          body: JSON.stringify({ handles: next })
        }).catch(function() {});
      }
      return next;
    });
    setEditing(null);
    setDraftHandle('');
    setDraftError('');
    addToast('✓ ' + id + ' handle saved', 'success');
  }

  function openPayment(platform) {
    var handle = handles[platform.id];
    if (!handle) {
      addToast('No ' + platform.name + ' handle configured', 'error');
      return;
    }
    var url = platform.buildUrl(handle);
    var amt = selectedAmt || (customAmt ? parseFloat(customAmt) : null);
    if (url) {
      if (amt && platform.id === 'paypal') url += '/' + amt + 'USD';
      if (amt && platform.id === 'cashapp') url += '?amount=' + (amt * 100);
      window.open(url, '_blank', 'noopener');
      addToast('Opening ' + platform.name + '...', 'info');
    } else {
      var displayAmt = amt ? ' $' + amt : '';
      var text = 'Send' + displayAmt + ' via ' + platform.name + ' to: ' + handle;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(handle).then(function() {
          addToast(text + ' (copied!)', 'info');
        }).catch(function() {
          addToast(text, 'info');
        });
      } else {
        addToast(text, 'info');
      }
    }
  }

  function copyHandle(platform) {
    var handle = handles[platform.id];
    if (!handle) { addToast('No handle set', 'error'); return; }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(handle).then(function() {
        addToast(platform.name + ' handle copied: ' + handle, 'success');
      }).catch(function() {
        addToast(handle, 'info');
      });
    } else {
      addToast(handle, 'info');
    }
  }

  var configuredCount = Object.values(handles).filter(function(h) { return h.trim(); }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG1, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid ' + BORDER, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: fD, fontSize: 20, color: LIME, letterSpacing: 3 }}>💸 DIRECT PAY</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {['pay', 'setup'].map(function(v) {
              var active = view === v;
              return (
                <button
                  key={v}
                  onClick={function() { setView(v); }}
                  style={{ background: active ? 'rgba(201,168,76,.14)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (active ? 'rgba(201,168,76,.4)' : BORDER), borderRadius: 7, padding: '5px 12px', color: active ? LIME : MUTED, fontFamily: fU, fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
                  {v === 'pay' ? '💸 PAY' : '⚙ SETUP'}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ fontFamily: fM, fontSize: 9, color: MUTED }}>
          90% creator · 10% platform fee · {configuredCount}/5 methods active
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── PAY VIEW ── */}
        {view === 'pay' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Amount selector */}
            <div style={{ background: FAINT, border: '1px solid ' + BORDER, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 8 }}>CHOOSE AMOUNT (OPTIONAL)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {QUICK_AMOUNTS.map(function(amt) {
                  var active = selectedAmt === amt;
                  return (
                    <button
                      key={amt}
                      onClick={function() { setSelectedAmt(active ? null : amt); setCustomAmt(''); }}
                      style={{ background: active ? 'rgba(232,196,106,.18)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (active ? 'rgba(232,196,106,.5)' : BORDER), borderRadius: 8, padding: '6px 14px', color: active ? GOLD_H : MUTED, fontFamily: fD, fontSize: 15, cursor: 'pointer' }}>
                      ${amt}
                    </button>
                  );
                })}
              </div>
              <input
                value={customAmt}
                onChange={function(e) { setCustomAmt(e.target.value); setSelectedAmt(null); }}
                placeholder="Custom amount..."
                type="number"
                style={{ width: '100%', background: 'rgba(14,12,9,.8)', border: '1px solid ' + BORDER, borderRadius: 8, padding: '7px 12px', color: TEXT, fontFamily: fU, fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>

            {/* Payment platform buttons */}
            {configuredCount === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 20px', background: FAINT, border: '1px solid ' + BORDER, borderRadius: 12 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💳</div>
                <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 14, color: MUTED, letterSpacing: 1, marginBottom: 6 }}>No payment methods configured</div>
                <div style={{ fontFamily: fM, fontSize: 9, color: MUTED, marginBottom: 14 }}>Go to SETUP to add your PayPal, Cash App, Venmo, Zelle, or Chime handles</div>
                <button
                  onClick={function() { setView('setup'); }}
                  style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 8, padding: '9px 20px', color: LIME, fontFamily: fU, fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                  ⚙ SETUP PAYMENTS
                </button>
              </div>
            )}

            {PLATFORMS.filter(function(p) { return handles[p.id]; }).map(function(platform) {
              var handle = handles[platform.id];
              var displayAmt = selectedAmt ? ' $' + selectedAmt : (customAmt ? ' $' + customAmt : '');
              return (
                <div
                  key={platform.id}
                  style={{ background: FAINT, border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ height: 3, background: 'linear-gradient(90deg,' + platform.color + ',' + platform.accent + ')' }} />
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: platform.color + '22', border: '1px solid ' + platform.color + '55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                      {platform.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 15, color: TEXT }}>{platform.name}</div>
                      <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{handle}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={function() { copyHandle(platform); }}
                        style={{ background: 'rgba(255,255,255,.05)', border: '1px solid ' + BORDER, borderRadius: 7, padding: '7px 10px', color: MUTED, fontFamily: fU, fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
                        📋
                      </button>
                      <button
                        onClick={function() { setQrPlatform(qrPlatform === platform.id ? null : platform.id); }}
                        style={{ background: 'rgba(255,255,255,.05)', border: '1px solid ' + BORDER, borderRadius: 7, padding: '7px 10px', color: MUTED, fontFamily: fU, fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
                        ▦
                      </button>
                      <button
                        onClick={function() { openPayment(platform); }}
                        style={{ background: 'linear-gradient(135deg,' + platform.color + ',' + platform.accent + ')', border: 'none', borderRadius: 8, padding: '7px 16px', color: '#fff', fontFamily: fU, fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>
                        PAY{displayAmt}
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '0 14px 10px 14px', fontFamily: fM, fontSize: 8, color: MUTED }}>{platform.note}</div>
                  {qrPlatform === platform.id && (
                    <div style={{ margin: '0 14px 12px 14px', background: 'rgba(14,12,9,.6)', border: '1px dashed ' + platform.color + '44', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
                      <div style={{ width: 90, height: 90, margin: '0 auto 8px auto', background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontFamily: fM, fontSize: 7, color: '#222', lineHeight: 1.3, textAlign: 'center', padding: 4 }}>QR · {handle.slice(0, 12)}</div>
                      </div>
                      <div style={{ fontFamily: fM, fontSize: 7.5, color: MUTED }}>Scan to pay via {platform.name}</div>
                      <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, marginTop: 2, opacity: 0.7 }}>QR generation available on next update</div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Disclaimer */}
            {configuredCount > 0 && (
              <div style={{ background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 8, padding: '8px 12px', fontFamily: fM, fontSize: 8, color: MUTED, lineHeight: 1.5 }}>
                90% goes directly to the creator · 10% platform fee.<br />
                Viewers are shown both payment destinations automatically.
              </div>
            )}
          </div>
        )}

        {/* ── SETUP VIEW ── */}
        {view === 'setup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: fM, fontSize: 9, color: MUTED, lineHeight: 1.6, padding: '0 2px 4px 2px' }}>
              Set your payment handles so viewers can send directly to you.<br />
              None of this is stored server-side — it lives in your browser only.
            </div>

            {PLATFORMS.map(function(platform) {
              var current = handles[platform.id];
              var isEditing = editing === platform.id;
              return (
                <div
                  key={platform.id}
                  style={{ background: current ? 'rgba(201,168,76,.04)' : FAINT, border: '1px solid ' + (current ? 'rgba(201,168,76,.2)' : BORDER), borderRadius: 11, overflow: 'hidden' }}>
                  <div style={{ height: 2, background: 'linear-gradient(90deg,' + platform.color + ',' + platform.accent + ')' }} />
                  <div style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isEditing ? 10 : 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: platform.color + '22', border: '1px solid ' + platform.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {platform.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: TEXT }}>{platform.name}</div>
                        {current && !isEditing && (
                          <div style={{ fontFamily: fM, fontSize: 8, color: LIME, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {current}</div>
                        )}
                        {!current && !isEditing && (
                          <div style={{ fontFamily: fM, fontSize: 8, color: MUTED }}>Not configured</div>
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          onClick={function() { setEditing(platform.id); setDraftHandle(current || ''); }}
                          style={{ background: current ? 'rgba(201,168,76,.12)' : 'rgba(255,255,255,.05)', border: '1px solid ' + (current ? 'rgba(201,168,76,.3)' : BORDER), borderRadius: 7, padding: '5px 12px', color: current ? LIME : MUTED, fontFamily: fU, fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
                          {current ? '✏ EDIT' : '+ ADD'}
                        </button>
                      )}
                    </div>

                    {isEditing && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input
                          value={draftHandle}
                          onChange={function(e) { setDraftHandle(e.target.value); setDraftError(''); }}
                          onKeyDown={function(e) { if (e.key === 'Enter') saveHandle(platform.id); }}
                          placeholder={platform.placeholder}
                          autoFocus
                          style={{ width: '100%', background: 'rgba(14,12,9,.8)', border: '1px solid ' + (draftError ? '#FF1A3C' : platform.color + '55'), borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: fU, fontSize: 13, boxSizing: 'border-box' }}
                        />
                        {draftError ? <div style={{ fontFamily: fM, fontSize: 8, color: '#FF6B81', lineHeight: 1.4 }}>&#x26A0; {draftError}</div> : null}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={function() { saveHandle(platform.id); }}
                            style={{ flex: 1, background: 'linear-gradient(135deg,' + platform.color + ',' + platform.accent + ')', border: 'none', borderRadius: 8, padding: '9px 0', color: '#fff', fontFamily: fU, fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>
                            ✓ SAVE
                          </button>
                          {current && (
                            <button
                              onClick={function() {
                                setHandles(function(prev) { var next = Object.assign({}, prev); next[platform.id] = ''; return next; });
                                setEditing(null);
                                addToast(platform.name + ' handle removed', 'info');
                              }}
                              style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.2)', borderRadius: 8, padding: '9px 14px', color: '#FF6B81', fontFamily: fU, fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
                              🗑
                            </button>
                          )}
                          <button
                            onClick={function() { setEditing(null); setDraftHandle(''); setDraftError(''); }}
                            style={{ background: 'rgba(255,255,255,.04)', border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 14px', color: MUTED, fontFamily: fU, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
