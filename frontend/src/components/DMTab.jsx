'use strict';
import React, { useState, useEffect, useRef } from 'react';

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

function fmtTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function RequestsPane({ addToast, onAccepted }) {
  var [requests, setRequests] = useState([]);
  var [loading,  setLoading]  = useState(true);

  function load() {
    setLoading(true);
    fetch('/api/dm/requests', { headers: _authHeaders() })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) { if (d) setRequests(d.requests || []); })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }

  useEffect(function() { load(); }, []);

  function handleAccept(id) {
    fetch('/api/dm/requests/' + encodeURIComponent(id) + '/accept', { method: 'POST', headers: _authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) { if (addToast) addToast('Message request accepted', 'success'); load(); if (onAccepted) onAccepted(); }
        else { if (addToast) addToast(d.error || 'Error', 'error'); }
      })
      .catch(function() { if (addToast) addToast('Network error', 'error'); });
  }

  function handleDecline(id) {
    fetch('/api/dm/requests/' + encodeURIComponent(id) + '/decline', { method: 'POST', headers: _authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d.success) { load(); } })
      .catch(function() {});
  }

  if (loading) return <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, padding: 16, textAlign: 'center' }}>Loading...</div>;
  if (requests.length === 0) return (
    <div style={{ background: SURF, border: '1px dashed rgba(201,168,76,.15)', borderRadius: 12, padding: '24px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: fM, fontSize: 9, color: MUTED }}>No pending message requests</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {requests.map(function(r) {
        return (
          <div key={r.id} style={{ background: SURF, border: '1px solid rgba(201,168,76,.12)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: TEXT, marginBottom: 4 }}>{r.from_user}</div>
            <div style={{ fontFamily: fM, fontSize: 9, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>{r.body}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { handleAccept(r.id); }}
                style={{ flex: 1, background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, padding: '6px 0', color: GOLD, fontFamily: fD, fontSize: 11, letterSpacing: 1.5, cursor: 'pointer' }}>
                ACCEPT
              </button>
              <button onClick={function() { handleDecline(r.id); }}
                style={{ flex: 1, background: 'rgba(128,0,32,.2)', border: '1px solid rgba(128,0,32,.5)', borderRadius: 8, padding: '6px 0', color: '#FF6B6B', fontFamily: fD, fontSize: 11, letterSpacing: 1.5, cursor: 'pointer' }}>
                DECLINE
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ThreadView({ thread, myUserId, onBack }) {
  var [messages, setMessages] = useState([]);
  var [body,     setBody]     = useState('');
  var [sending,  setSending]  = useState(false);
  var bottomRef = useRef(null);

  function load() {
    fetch('/api/dm/threads/' + encodeURIComponent(thread.id) + '/messages', { headers: _authHeaders() })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) { if (d) setMessages(d.messages || []); })
      .catch(function() {});
  }

  useEffect(function() {
    load();
    var id = setInterval(load, 5000);
    return function() { clearInterval(id); };
  }, [thread.id]);

  useEffect(function() {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    var trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    fetch('/api/dm/threads/' + encodeURIComponent(thread.id) + '/messages', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ body: trimmed }),
    })
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d.success) { setBody(''); load(); } })
      .catch(function() {})
      .finally(function() { setSending(false); });
  }

  var otherId = thread.user_a === myUserId ? thread.user_b : thread.user_a;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button onClick={onBack}
          style={{ background: 'transparent', border: 'none', color: GOLD, fontFamily: fD, fontSize: 18, cursor: 'pointer', padding: 0 }}>
          ←
        </button>
        <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 16, color: TEXT }}>{otherId}</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 8 }}>
        {messages.map(function(m) {
          var isMine = m.sender_id === myUserId;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{ background: isMine ? 'rgba(201,168,76,.2)' : CARD, border: '1px solid ' + (isMine ? 'rgba(201,168,76,.35)' : 'rgba(201,168,76,.1)'), borderRadius: 10, padding: '8px 12px', maxWidth: '78%' }}>
                <div style={{ fontFamily: fU, fontSize: 12, color: TEXT, lineHeight: 1.4 }}>{m.body}</div>
                <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, marginTop: 2 }}>{fmtTime(m.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid rgba(201,168,76,.1)' }}>
        <input
          value={body}
          onChange={function(e) { setBody(e.target.value.slice(0, 2000)); }}
          onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Message..."
          style={{ flex: 1, background: CARD, border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: fU, fontSize: 13, outline: 'none' }}
        />
        <button onClick={handleSend} disabled={!body.trim() || sending}
          style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, padding: '8px 14px', color: GOLD, fontFamily: fD, fontSize: 12, letterSpacing: 1.5, cursor: body.trim() ? 'pointer' : 'not-allowed', opacity: body.trim() ? 1 : 0.5 }}>
          {sending ? '...' : 'SEND'}
        </button>
      </div>
    </div>
  );
}

export default function DMTab({ addToast }) {
  var [view,       setView]       = useState('threads');
  var [threads,    setThreads]    = useState([]);
  var [loading,    setLoading]    = useState(true);
  var [activeThread, setActiveThread] = useState(null);
  var [newTo,      setNewTo]      = useState('');
  var [newBody,    setNewBody]    = useState('');
  var [sending,    setSending]    = useState(false);
  var [privacy,    setPrivacy]    = useState('everyone');
  var [privSaving, setPrivSaving] = useState(false);
  var myUserId = localStorage.getItem('sw_userId') || '';

  function loadThreads() {
    setLoading(true);
    fetch('/api/dm/threads', { headers: _authHeaders() })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) { if (d) setThreads(d.threads || []); })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }

  function loadPrivacy() {
    fetch('/api/dm/privacy', { headers: _authHeaders() })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) { if (d) setPrivacy(d.privacy || 'everyone'); })
      .catch(function() {});
  }

  useEffect(function() { loadThreads(); loadPrivacy(); }, []);

  function handleSavePrivacy(val) {
    setPrivSaving(true);
    fetch('/api/dm/privacy', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ privacy: val }),
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) { setPrivacy(val); if (addToast) addToast('Privacy updated', 'success'); }
        else { if (addToast) addToast(d.error || 'Error', 'error'); }
      })
      .catch(function() { if (addToast) addToast('Network error', 'error'); })
      .finally(function() { setPrivSaving(false); });
  }

  function handleNewDM() {
    var to   = newTo.trim().slice(0, 64);
    var body = newBody.trim().slice(0, 500);
    if (!to || !body) return;
    setSending(true);
    fetch('/api/dm/requests', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ toUser: to, body: body }),
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) {
          if (addToast) addToast(d.requested ? 'Message request sent!' : 'Message sent!', 'success');
          setNewTo(''); setNewBody('');
          setView('threads');
          loadThreads();
        } else {
          if (addToast) addToast(d.error || 'Error', 'error');
        }
      })
      .catch(function() { if (addToast) addToast('Network error', 'error'); })
      .finally(function() { setSending(false); });
  }

  if (activeThread) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 480, padding: '0 2px' }}>
        <ThreadView thread={activeThread} myUserId={myUserId} onBack={function() { setActiveThread(null); loadThreads(); }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 2px' }}>

      {/* Header */}
      <div>
        <div style={{ fontFamily: fD, fontSize: 22, color: GOLD, letterSpacing: 2 }}>DIRECT MESSAGES</div>
        <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginTop: 3, lineHeight: 1.5 }}>
          Private conversations · message requests · universal block support
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { id: 'threads',  label: 'CHATS' },
          { id: 'requests', label: 'REQUESTS' },
          { id: 'new',      label: '+ NEW' },
          { id: 'privacy',  label: 'PRIVACY' },
        ].map(function(t) {
          return (
            <button key={t.id} onClick={function() { setView(t.id); }}
              style={{ flex: 1, background: view === t.id ? 'rgba(201,168,76,.2)' : 'transparent', border: '1px solid ' + (view === t.id ? 'rgba(201,168,76,.5)' : 'rgba(201,168,76,.15)'), borderRadius: 8, padding: '6px 4px', color: view === t.id ? GOLD : MUTED, fontFamily: fD, fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* CHATS */}
      {view === 'threads' && (
        loading ? (
          <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, textAlign: 'center', padding: 20 }}>Loading...</div>
        ) : threads.length === 0 ? (
          <div style={{ background: SURF, border: '1px dashed rgba(201,168,76,.15)', borderRadius: 12, padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: fM, fontSize: 9, color: MUTED }}>No DMs yet — start a new conversation</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {threads.map(function(t) {
              var otherId = t.user_a === myUserId ? t.user_b : t.user_a;
              return (
                <div key={t.id} onClick={function() { setActiveThread(t); }}
                  style={{ background: SURF, border: '1px solid rgba(201,168,76,.1)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(201,168,76,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fD, fontSize: 16, color: GOLD, flexShrink: 0 }}>
                    {otherId.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: TEXT }}>{otherId}</div>
                    <div style={{ fontFamily: fM, fontSize: 7, color: MUTED }}>Tap to open</div>
                  </div>
                  <div style={{ fontFamily: fD, fontSize: 18, color: MUTED }}>›</div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* REQUESTS */}
      {view === 'requests' && (
        <RequestsPane addToast={addToast} onAccepted={loadThreads} />
      )}

      {/* NEW */}
      {view === 'new' && (
        <div style={{ background: SURF, border: '1px solid rgba(201,168,76,.15)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: fM, fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 2 }}>NEW MESSAGE</div>
          <input
            value={newTo}
            onChange={function(e) { setNewTo(e.target.value.slice(0, 64)); }}
            placeholder="Recipient user ID"
            style={{ background: CARD, border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: fM, fontSize: 9, outline: 'none' }}
          />
          <textarea
            value={newBody}
            onChange={function(e) { setNewBody(e.target.value.slice(0, 500)); }}
            placeholder="Write your message..."
            rows={4}
            style={{ background: CARD, border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: fU, fontSize: 13, outline: 'none', resize: 'vertical' }}
          />
          <button onClick={handleNewDM} disabled={!newTo.trim() || !newBody.trim() || sending}
            style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, padding: '9px 0', color: GOLD, fontFamily: fD, fontSize: 13, letterSpacing: 2, cursor: (newTo.trim() && newBody.trim()) ? 'pointer' : 'not-allowed', opacity: (newTo.trim() && newBody.trim()) ? 1 : 0.5 }}>
            {sending ? '...' : 'SEND MESSAGE'}
          </button>
          <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, lineHeight: 1.5 }}>
            If the recipient has message requests enabled, they must accept before you can chat.
          </div>
        </div>
      )}

      {/* PRIVACY */}
      {view === 'privacy' && (
        <div style={{ background: SURF, border: '1px solid rgba(201,168,76,.15)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: fM, fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 2 }}>DM PRIVACY</div>
          {[
            { val: 'everyone',  label: 'Everyone', desc: 'Anyone can message you directly' },
            { val: 'requests',  label: 'Requests',  desc: 'Unknown senders must send a request first' },
            { val: 'nobody',    label: 'Nobody',    desc: 'No one can send you new DMs' },
          ].map(function(opt) {
            return (
              <button key={opt.val} onClick={function() { if (!privSaving) handleSavePrivacy(opt.val); }}
                style={{ background: privacy === opt.val ? 'rgba(201,168,76,.18)' : 'transparent', border: '1px solid ' + (privacy === opt.val ? 'rgba(201,168,76,.5)' : 'rgba(201,168,76,.15)'), borderRadius: 10, padding: '10px 14px', textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: privacy === opt.val ? GOLD : TEXT }}>{opt.label}</div>
                <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, marginTop: 2 }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
