import React, { useState, useEffect, useRef } from 'react';

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

var AURA_MODES = [
  { id: 'hype',  label: 'HYPE',  emoji: '🔥', desc: 'MAX energy. CAPS. Stadium vibes.', color: '#C0392B' },
  { id: 'sassy', label: 'SASSY', emoji: '💅', desc: 'Sharp & witty with light shade.',  color: '#C9A84C' },
  { id: 'calm',  label: 'CALM',  emoji: '🧊', desc: 'Analytical. Data-driven.',          color: '#C9A84C' },
  { id: 'kind',  label: 'KIND',  emoji: '💛', desc: 'Warm. Inclusive. Community-first.', color: '#C9A84C' },
];

function _authHeaders(extra) {
  var tok = localStorage.getItem('sw_token') || '';
  var h = tok ? { 'Authorization': 'Bearer ' + tok } : {};
  return Object.assign(h, extra || {});
}

export default function AuraTab({ isLive, viewerCount, addToast, socket, roomId, userTier, incomingMessages }) {
  var resolvedTier = userTier || 'pro';

  var [msgs, setMsgs] = useState(function() {
    try {
      var saved = localStorage.getItem('sw_aura_history');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [INITIAL_MSG];
  });
  var [input, setInput]             = useState('');
  var [loading, setLoading]         = useState(false);
  var [autoHype, setAutoHype]       = useState(false);
  var [promptOpen, setPromptOpen]   = useState(false);
  var [customPrompt, setCustomPrompt] = useState(SYSTEM_PROMPT);
  var [auraMode, setAuraMode]       = useState(function() {
    try { return localStorage.getItem('sw_aura_mode') || 'hype'; } catch(e) { return 'hype'; }
  });
  var [auraMessages, setAuraMessages] = useState([]);
  var [triggerLoading, setTriggerLoading] = useState('');
  var [usageCount, setUsageCount]   = useState(0);
  var chatRef = useRef(null);

  useEffect(function() {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  useEffect(function() {
    try { localStorage.setItem('sw_aura_history', JSON.stringify(msgs.slice(-50))); } catch(e) {}
  }, [msgs]);

  useEffect(function() {
    try { localStorage.setItem('sw_aura_mode', auraMode); } catch(e) {}
  }, [auraMode]);

  // Merge server-pushed auto-AURA messages (from go-live, gifts, subs, milestones)
  useEffect(function() {
    if (!incomingMessages || incomingMessages.length === 0) return;
    var latest = incomingMessages[0]; // App.jsx prepends newest first
    if (!latest || !latest.text) return;
    setMsgs(function(prev) {
      // Avoid duplicate if already in chat
      if (prev.length > 0 && prev[prev.length - 1].text === latest.text) return prev;
      return prev.concat([{ role: 'aura', text: latest.text, time: fmtTime(), auto: true }]);
    });
  }, [incomingMessages]);

  function fetchUsage() {
    if (!roomId) return;
    fetch('/api/aura/usage?streamId=' + roomId, { headers: _authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && typeof data.callsThisHour === 'number') setUsageCount(data.callsThisHour);
      })
      .catch(function() {});
  }

  useEffect(function() {
    fetchUsage();
    var interval = setInterval(fetchUsage, 60000);
    return function() { clearInterval(interval); };
  }, [roomId]);

  function copyHistory() {
    var text = msgs.map(function(m) {
      return '[' + m.time + '] ' + (m.role === 'aura' ? 'AURA: ' : 'YOU: ') + m.text;
    }).join('\n');
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function() {});
  }

  function callAura(prompt, userMsg) {
    setLoading(true);
    if (userMsg) {
      setMsgs(function(p) { return p.concat([{ role: 'user', text: userMsg, time: fmtTime() }]); });
    }
    var context = 'Context: ' + ((viewerCount || 0).toLocaleString()) + ' viewers. Stream ' + (isLive ? 'LIVE' : 'OFFLINE') + '. Mode: ' + auraMode.toUpperCase() + '. ' + prompt;
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ system: customPrompt, message: context })
    })
      .then(function(r) { if (!r.ok) throw new Error('API error ' + r.status); return r.json(); })
      .then(function(data) {
        var reply = data.text || '🤖 AURA reconnecting...';
        setMsgs(function(p) { return p.concat([{ role: 'aura', text: reply, time: fmtTime() }]); });
        setLoading(false);
      })
      .catch(function() {
        setMsgs(function(p) { return p.concat([{ role: 'aura', text: '⚡ Signal dropped. Check API key.', time: fmtTime() }]); });
        setLoading(false);
      });
  }

  useEffect(function() {
    if (!autoHype || !isLive) return;
    var interval = setInterval(function() {
      var rnd = QUICK_PROMPTS[Math.floor(Math.random() * QUICK_PROMPTS.length)];
      callAura(rnd.prompt, null);
    }, 45000);
    return function() { clearInterval(interval); };
  }, [autoHype, isLive]);

  function send() {
    if (!input.trim() || loading) return;
    callAura(input, input);
    setInput('');
  }

  function clearChat() {
    setMsgs([{ role: 'aura', text: '🤖 AURA ONLINE — SeeWhy LIVE v33 suite active. Washington Classic energy IMMACULATE! 🎲', time: fmtTime() }]);
  }

  function selectMode(modeObj) {
    setAuraMode(modeObj.id);
    try { localStorage.setItem('sw_aura_mode', modeObj.id); } catch(e) {}
    fetch('/api/aura/mode', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ mode: modeObj.id })
    }).catch(function() {});
    if (addToast) addToast('AURA: ' + modeObj.label + ' mode activated', 'success');
  }

  var TRIGGERS = [
    { type: 'stream_start', label: '🎬 STREAM START', data: {} },
    { type: 'tip_received',  label: '💰 TIP TEST',    data: { viewerName: 'TestFan', amountCents: 500, note: 'Love the stream!' } },
    { type: 'gift_received', label: '🎁 GIFT TEST',   data: { viewerName: 'GiftViewer', giftName: 'Diamond', amountCents: 999 } },
    { type: 'new_viewer',   label: '👋 NEW VIEWER',  data: { viewerName: 'NewFan123', isReturning: false } },
    { type: 'stream_end',   label: '🏁 STREAM END',  data: { peakViewers: viewerCount || 100, totalEarningsCents: 5000 } },
  ];

  function fireTrigger(trigger) {
    setTriggerLoading(trigger.type);
    fetch('/api/aura/trigger', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        type: trigger.type,
        streamId: roomId || 'preview',
        mode: auraMode,
        data: Object.assign({}, trigger.data, { viewerCount: viewerCount || 0, streamTitle: 'SeeWhy LIVE' })
      })
    })
    .then(function(r) {
      if (!r.ok) return r.json().then(function(d) { throw new Error((d && d.error) || 'Trigger failed'); });
      return r.json();
    })
    .then(function(d) {
      setTriggerLoading('');
      var text = d.text || 'AURA response received';
      setAuraMessages(function(prev) {
        return [{ id: 'trig_' + Date.now(), text: text, mode: auraMode, ts: new Date().toLocaleTimeString() }].concat(prev.slice(0, 4));
      });
      setUsageCount(function(n) { return n + 1; });
      setMsgs(function(p) {
        return p.concat([{ role: 'trigger', text: text, time: fmtTime(), triggerType: trigger.type }]);
      });
    })
    .catch(function() {
      setTriggerLoading('');
      setMsgs(function(p) {
        return p.concat([{ role: 'trigger', text: '⚡ Trigger fired: ' + trigger.type, time: fmtTime(), triggerType: trigger.type }]);
      });
    });
  }

  var activeModeObj = AURA_MODES.find(function(m) { return m.id === auraMode; }) || AURA_MODES[0];
  var tierBlocked = userTier && userTier !== 'pro' && userTier !== 'studio';

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {tierBlocked && (
        <div style={{ background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.3)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#C0392B' }}>
            &#x26A0; AURA AI requires Pro or Studio tier
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginTop: 4 }}>
            Upgrade in Settings to unlock AI-powered co-hosting
          </div>
        </div>
      )}

      {/* PERSONALITY MODE SELECTOR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
        {AURA_MODES.map(function(mode) {
          var isActive = auraMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={function() { selectMode(mode); }}
              style={{
                background: isActive ? (mode.color + '22') : 'rgba(26,21,16,.5)',
                border: isActive ? ('1px solid ' + mode.color) : '1px solid rgba(255,255,255,.07)',
                borderRadius: 8,
                padding: '8px 10px',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: isActive ? mode.color : '#F0E8D4', letterSpacing: 1.5, marginBottom: 2 }}>
                {mode.emoji + ' ' + mode.label}
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', lineHeight: 1.3 }}>
                {mode.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* TRIGGER BUTTONS */}
      <div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 2, marginBottom: 6 }}>TRIGGER EVENTS</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
          {TRIGGERS.map(function(trigger) {
            var isFiring = triggerLoading === trigger.type;
            return (
              <button
                key={trigger.type}
                onClick={function() { if (!isFiring) fireTrigger(trigger); }}
                disabled={isFiring}
                style={{
                  background: 'rgba(139,92,246,.1)',
                  border: '1px solid rgba(139,92,246,.3)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: '#C9A84C',
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 8,
                  cursor: isFiring ? 'not-allowed' : 'pointer',
                  opacity: isFiring ? 0.7 : 1
                }}>
                {isFiring ? '...' : trigger.label}
              </button>
            );
          })}
        </div>

        {/* USAGE COUNTER */}
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: usageCount >= 18 ? '#C0392B' : '#8A7A62', marginBottom: 6 }}>
          {'AURA CALLS THIS HOUR: ' + usageCount + ' / 60'}
        </div>
      </div>

      {/* AURA TRIGGER RESPONSES */}
      {auraMessages.length > 0 && (
        <div>
          {auraMessages.map(function(msg) {
            return (
              <div key={msg.id} style={{ background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.25)', borderRadius: 8, padding: '8px 10px', marginBottom: 5 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7B5DA6', letterSpacing: 1, marginBottom: 3 }}>
                  {msg.mode.toUpperCase()}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#F0E8D4', lineHeight: 1.4 }}>
                  {msg.text}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginTop: 3 }}>
                  {msg.ts}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ background: 'rgba(128,0,32,.1)', border: '1px solid rgba(128,0,32,.3)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'radial-gradient(circle,rgba(201,168,76,.35),rgba(128,0,32,.15))', border: '2px solid rgba(128,0,32,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', letterSpacing: 2 }}>AURA AI CO-HOST</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62' }}>claude-sonnet-4 · v33 · Washington Classic</div>
        </div>
        <button
          onClick={function() { setAutoHype(function(v) { return !v; }); }}
          style={{ background: autoHype && isLive ? 'rgba(201,168,76,.25)' : 'rgba(128,0,32,.08)', border: '1px solid ' + (autoHype && isLive ? 'rgba(201,168,76,.6)' : 'rgba(128,0,32,.25)'), borderRadius: 6, padding: '4px 9px', color: autoHype && isLive ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
          {autoHype ? 'AUTO ON' : 'AUTO'}
        </button>
        {loading && (
          <div style={{ display: 'flex', gap: 3 }}>
            {[0, 1, 2].map(function(i) {
              return <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A84C', animation: 'pulse 1.2s ease infinite', animationDelay: i * 0.3 + 's' }} />;
            })}
          </div>
        )}
      </div>

      {autoHype && isLive && (
        <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C', animation: 'pulse 1.2s ease infinite' }} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 1 }}>AUTO-HYPE ACTIVE · fires every 45s</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {QUICK_PROMPTS.map(function(qp) {
          return (
            <button
              key={qp.label}
              onClick={function() { callAura(qp.prompt, null); }}
              disabled={loading}
              style={{ background: 'rgba(128,0,32,.12)', border: '1px solid rgba(128,0,32,.3)', borderRadius: 6, padding: '5px 11px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
              {qp.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1 }}>CHAT LOG</span>
          <div style={{ background: 'rgba(128,0,32,.18)', border: '1px solid rgba(128,0,32,.3)', borderRadius: 10, padding: '1px 7px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>
            {msgs.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button
            onClick={function() { setPromptOpen(function(v) { return !v; }); }}
            style={{ background: promptOpen ? 'rgba(128,0,32,.2)' : 'rgba(128,0,32,.07)', border: '1px solid rgba(128,0,32,.3)', borderRadius: 5, padding: '3px 8px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
            &#x270F; PROMPT
          </button>
          <button
            onClick={copyHistory}
            style={{ background: 'rgba(201,168,76,.07)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 5, padding: '3px 8px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
            &#x1F4CB; COPY
          </button>
          <button
            onClick={clearChat}
            style={{ background: 'rgba(255,60,60,.07)', border: '1px solid rgba(255,60,60,.2)', borderRadius: 5, padding: '3px 8px', color: '#FF6B6B', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
            &#x1F5D1; CLEAR
          </button>
        </div>
      </div>

      {promptOpen && (
        <div style={{ background: 'rgba(15,12,20,.9)', border: '1px solid rgba(128,0,32,.3)', borderRadius: 8, padding: '10px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', letterSpacing: 1, marginBottom: 6 }}>SYSTEM PROMPT</div>
          <textarea
            value={customPrompt}
            onChange={function(e) { setCustomPrompt(e.target.value); }}
            rows={4}
            style={{ width: '100%', background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 6, padding: '7px 10px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, resize: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
          />
          <button
            onClick={function() { setPromptOpen(false); }}
            style={{ marginTop: 6, background: 'rgba(128,0,32,.2)', border: '1px solid rgba(128,0,32,.4)', borderRadius: 5, padding: '4px 12px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>
            SAVE &amp; CLOSE
          </button>
        </div>
      )}

      <div ref={chatRef} style={{ background: 'rgba(15,12,20,.8)', border: '1px solid rgba(128,0,32,.2)', borderRadius: 10, padding: '10px', height: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.map(function(m, i) {
          var isTrigger = m.role === 'trigger';
          var isUser = m.role === 'user';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '88%',
                background: isTrigger
                  ? 'rgba(139,92,246,.12)'
                  : (isUser
                    ? 'linear-gradient(135deg,#800020,#C01838)'
                    : 'linear-gradient(135deg,rgba(128,0,32,.18),rgba(201,168,76,.08))'),
                border: '1px solid ' + (isTrigger
                  ? 'rgba(139,92,246,.3)'
                  : (isUser ? 'rgba(192,24,56,.5)' : 'rgba(128,0,32,.4)')),
                borderRadius: isUser ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                padding: '7px 10px'
              }}>
                {isTrigger && (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7B5DA6', letterSpacing: 1, marginBottom: 2 }}>⚡ AURA TRIGGER</div>
                )}
                {m.role === 'aura' && (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 1, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {'🤖 AURA · ' + activeModeObj.emoji + ' ' + activeModeObj.label}
                    {m.auto && <span style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 3, padding: '0px 4px', color: '#C9A84C', fontSize: 6, letterSpacing: 0.5 }}>AUTO</span>}
                  </div>
                )}
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#F0E8D4', lineHeight: 1.4 }}>{m.text}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#483D60', marginTop: 3, textAlign: isUser ? 'right' : 'left' }}>{m.time}</div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
            {[0, 1, 2].map(function(i) {
              return <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#800020', animation: 'pulse 1.2s ease infinite', animationDelay: i * 0.25 + 's' }} />;
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
          style={{ flex: 1, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 8, padding: '8px 12px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{ background: 'rgba(128,0,32,.2)', border: '1px solid rgba(128,0,32,.4)', borderRadius: 8, padding: '8px 16px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>
          ASK
        </button>
      </div>
    </div>
  );
}
