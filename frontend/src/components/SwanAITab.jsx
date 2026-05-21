import React, { useState, useEffect, useRef, useCallback } from 'react';

var SYSTEM_PROMPT = 'You are SwanAI Director for SeeWhy LIVE v33. Calm, strategic, decisive. 2-4 sentences. Production director mindset. Washington Classic Domino Tournament context. RTMP: rtmp://2.24.194.112:1935/live, VPS: 2.24.194.112.';

function fmtTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

var COMMANDS = [
  { label: 'SCENE',    prompt: 'What is the best scene transition to make right now for maximum audience retention?' },
  { label: 'MONETIZE', prompt: 'What is the best monetization action to take in the next 2 minutes?' },
  { label: 'FANOUT',   prompt: 'Which platforms should we prioritize for the RTMP fanout right now and why?' },
  { label: 'FADES',    prompt: 'Is now a good time to start a Fades (Online Corruption) match? What is the strategy?' },
  { label: 'PAYWALL',  prompt: 'What is the optimal paywall price point for this current audience size?' },
  { label: 'WRAP',     prompt: 'Plan the next 15 minutes of the stream for maximum engagement and revenue.' },
];

export default function SwanAITab({ isLive, viewerCount }) {
  var [msgs, setMsgs]     = useState([{ role: 'dir', text: '🎯 SwanAI Director v33 ONLINE. All systems operational. Ready for production commands.', time: fmtTime() }]);
  var [input, setInput]   = useState('');
  var [loading, setLoading] = useState(false);
  var chatRef = useRef(null);

  useEffect(function() {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  var callDirector = useCallback(function(prompt, userMsg) {
    setLoading(true);
    if (userMsg) {
      setMsgs(function(p) { return [...p, { role: 'user', text: userMsg, time: fmtTime() }]; });
    }
    var context = (viewerCount || 0).toLocaleString() + ' viewers. Stream ' + (isLive ? 'LIVE' : 'OFFLINE') + '. ' + prompt;
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: SYSTEM_PROMPT, message: context })
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var reply = data.text || '🎯 Director processing...';
        setMsgs(function(p) { return [...p, { role: 'dir', text: reply, time: fmtTime() }]; });
        setLoading(false);
      })
      .catch(function() {
        setMsgs(function(p) { return [...p, { role: 'dir', text: '⚡ Director signal interrupted.', time: fmtTime() }]; });
        setLoading(false);
      });
  }, [isLive, viewerCount]);

  function send() {
    if (!input.trim() || loading) return;
    callDirector(input, input);
    setInput('');
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,107,53,.08)', border: '2px solid rgba(255,107,53,.3)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, background: 'linear-gradient(135deg,rgba(255,107,53,.3),rgba(255,140,90,.1))', border: '2px solid rgba(255,107,53,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎯</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#FF8C5A', letterSpacing: 2 }}>SWANAI DIRECTOR</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90' }}>claude-sonnet-4 · PRODUCTION AI · v33</div>
        </div>
        {loading && (
          <div style={{ display: 'flex', gap: 3 }}>
            {[0, 1, 2].map(function(i) {
              return <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF8C5A', animation: 'pulse 1.2s ease infinite', animationDelay: i * 0.3 + 's' }} />;
            })}
          </div>
        )}
      </div>

      {/* Command grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {COMMANDS.map(function(cmd) {
          return (
            <button
              key={cmd.label}
              onClick={function() { callDirector(cmd.prompt, null); }}
              disabled={loading}
              style={{ background: 'rgba(255,107,53,.08)', border: '1px solid rgba(255,107,53,.25)', borderRadius: 6, padding: '7px 10px', color: '#FF8C5A', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, textAlign: 'left' }}>
              {cmd.label} ›
            </button>
          );
        })}
      </div>

      {/* Chat messages */}
      <div ref={chatRef} style={{ background: 'rgba(15,12,20,.8)', border: '1px solid rgba(255,107,53,.15)', borderRadius: 10, padding: '10px', height: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.map(function(m, i) {
          return (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '92%', background: m.role === 'dir' ? 'linear-gradient(135deg,rgba(255,107,53,.12),rgba(255,140,90,.05))' : 'linear-gradient(135deg,#800020,#C01838)', border: '1px solid ' + (m.role === 'dir' ? 'rgba(255,107,53,.35)' : 'rgba(192,24,56,.5)'), borderRadius: 8, padding: '7px 10px' }}>
                {m.role === 'dir' && (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF8C5A', letterSpacing: 1, marginBottom: 2 }}>🎯 SWANAI</div>
                )}
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#EDE8F5', lineHeight: 1.4 }}>{m.text}</div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
            {[0, 1, 2].map(function(i) {
              return <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF6B35', animation: 'pulse 1.2s ease infinite', animationDelay: i * 0.25 + 's' }} />;
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={function(e) { setInput(e.target.value); }}
          onKeyDown={function(e) { if (e.key === 'Enter') send(); }}
          placeholder="Give SwanAI a brief..."
          style={{ flex: 1, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#07050A', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>
          DIRECT
        </button>
      </div>
    </div>
  );
}
