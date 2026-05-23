import React, { useState, useEffect, useRef, useCallback } from 'react';

var SYSTEM_PROMPT = 'You are AURA, the AI co-host for SeeWhy LIVE Washington Classic stream. You are energetic, hype, and supportive of domino culture. Keep responses under 2 sentences. Match the energy of the room.';

function fmtTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

var QUICK_PROMPTS = [
  { label: 'HYPE',    prompt: 'Drop a hype line for this moment on the Washington Classic domino stream!' },
  { label: '90/10',   prompt: 'Pitch the 90/10 creator split to the audience in one sentence.' },
  { label: 'FADES',   prompt: 'Hype the Fades (Online Corruption) arena battle for viewers.' },
  { label: 'SHOUT',   prompt: 'Give a multilingual shoutout to international viewers.' },
  { label: 'PAYWALL', prompt: 'Pitch the Golden Paywall subscriber perks to new viewers.' },
  { label: 'DOMINO',  prompt: 'Drop a domino culture knowledge bomb for the audience.' },
];

var INITIAL_MSG = { role: 'aura', text: '🤖 AURA ONLINE — SeeWhy LIVE v33 suite active. Washington Classic energy IMMACULATE! 🎲', time: fmtTime() };

export default function AuraTab({ isLive, viewerCount }) {
  var [msgs, setMsgs]         = useState([INITIAL_MSG]);
  var [input, setInput]       = useState('');
  var [loading, setLoading]   = useState(false);
  var [autoHype, setAutoHype] = useState(false);
  var chatRef = useRef(null);

  useEffect(function() {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  var callAura = useCallback(function(prompt, userMsg) {
    setLoading(true);
    if (userMsg) {
      setMsgs(function(p) { return [...p, { role: 'user', text: userMsg, time: fmtTime() }]; });
    }
    var context = 'Context: ' + ((viewerCount || 0).toLocaleString()) + ' viewers. Stream ' + (isLive ? 'LIVE' : 'OFFLINE') + '. ' + prompt;
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: SYSTEM_PROMPT, message: context })
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var reply = data.text || '🤖 AURA reconnecting...';
        setMsgs(function(p) { return [...p, { role: 'aura', text: reply, time: fmtTime() }]; });
        setLoading(false);
      })
      .catch(function() {
        setMsgs(function(p) { return [...p, { role: 'aura', text: '⚡ Signal dropped. Check API key.', time: fmtTime() }]; });
        setLoading(false);
      });
  }, [isLive, viewerCount]);

  useEffect(function() {
    if (!autoHype || !isLive) return;
    var interval = setInterval(function() {
      var rnd = QUICK_PROMPTS[Math.floor(Math.random() * QUICK_PROMPTS.length)];
      callAura(rnd.prompt, null);
    }, 45000);
    return function() { clearInterval(interval); };
  }, [autoHype, isLive, callAura]);

  function send() {
    if (!input.trim() || loading) return;
    callAura(input, input);
    setInput('');
  }

  function clearChat() {
    setMsgs([{ role: 'aura', text: '🤖 AURA ONLINE — SeeWhy LIVE v33 suite active. Washington Classic energy IMMACULATE! 🎲', time: fmtTime() }]);
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>
      <div style={{ background: 'rgba(155,77,202,.1)', border: '1px solid rgba(155,77,202,.3)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'radial-gradient(circle,rgba(192,132,252,.35),rgba(155,77,202,.15))', border: '2px solid rgba(155,77,202,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C084FC', letterSpacing: 2 }}>AURA AI CO-HOST</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90' }}>claude-sonnet-4 · v33 · Washington Classic</div>
        </div>
        <button
          onClick={function() { setAutoHype(function(v) { return !v; }); }}
          style={{ background: autoHype && isLive ? 'rgba(192,132,252,.25)' : 'rgba(155,77,202,.08)', border: '1px solid ' + (autoHype && isLive ? 'rgba(192,132,252,.6)' : 'rgba(155,77,202,.25)'), borderRadius: 6, padding: '4px 9px', color: autoHype && isLive ? '#C084FC' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
          {autoHype ? 'AUTO ON' : 'AUTO'}
        </button>
        {loading && (
          <div style={{ display: 'flex', gap: 3 }}>
            {[0, 1, 2].map(function(i) {
              return <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#C084FC', animation: 'pulse 1.2s ease infinite', animationDelay: i * 0.3 + 's' }} />;
            })}
          </div>
        )}
      </div>

      {autoHype && isLive && (
        <div style={{ background: 'rgba(192,132,252,.08)', border: '1px solid rgba(192,132,252,.3)', borderRadius: 6, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C084FC', animation: 'pulse 1.2s ease infinite' }} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C084FC', letterSpacing: 1 }}>AUTO-HYPE ACTIVE · fires every 45s</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {QUICK_PROMPTS.map(function(qp) {
          return (
            <button
              key={qp.label}
              onClick={function() { callAura(qp.prompt, null); }}
              disabled={loading}
              style={{ background: 'rgba(155,77,202,.12)', border: '1px solid rgba(155,77,202,.3)', borderRadius: 6, padding: '5px 11px', color: '#C084FC', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
              {qp.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 1 }}>CHAT LOG</span>
          <div style={{ background: 'rgba(155,77,202,.18)', border: '1px solid rgba(155,77,202,.3)', borderRadius: 10, padding: '1px 7px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C084FC' }}>
            {msgs.length}
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{ background: 'rgba(255,60,60,.07)', border: '1px solid rgba(255,60,60,.2)', borderRadius: 5, padding: '3px 8px', color: '#FF6B6B', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
          🗑 CLEAR
        </button>
      </div>

      <div ref={chatRef} style={{ background: 'rgba(15,12,20,.8)', border: '1px solid rgba(155,77,202,.2)', borderRadius: 10, padding: '10px', height: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.map(function(m, i) {
          return (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '88%', background: m.role === 'aura' ? 'linear-gradient(135deg,rgba(155,77,202,.18),rgba(192,132,252,.08))' : 'linear-gradient(135deg,#800020,#C01838)', border: '1px solid ' + (m.role === 'aura' ? 'rgba(155,77,202,.4)' : 'rgba(192,24,56,.5)'), borderRadius: m.role === 'aura' ? '8px 8px 8px 2px' : '8px 8px 2px 8px', padding: '7px 10px' }}>
                {m.role === 'aura' && (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C084FC', letterSpacing: 1, marginBottom: 2 }}>🤖 AURA</div>
                )}
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#EDE8F5', lineHeight: 1.4 }}>{m.text}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#483D60', marginTop: 3, textAlign: m.role === 'user' ? 'right' : 'left' }}>{m.time}</div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
            {[0, 1, 2].map(function(i) {
              return <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#9B4DCA', animation: 'pulse 1.2s ease infinite', animationDelay: i * 0.25 + 's' }} />;
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={function(e) { setInput(e.target.value); }}
          onKeyDown={function(e) { if (e.key === 'Enter') send(); }}
          placeholder="Ask AURA anything..."
          style={{ flex: 1, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{ background: 'rgba(155,77,202,.2)', border: '1px solid rgba(155,77,202,.4)', borderRadius: 8, padding: '8px 16px', color: '#C084FC', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>
          ASK
        </button>
      </div>
    </div>
  );
}
