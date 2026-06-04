import React, { useState, useEffect, useRef } from 'react';

// ─── Palette ──────────────────────────────────────────────────────────────────
var BG    = '#0E0C09';
var SURF  = '#0E0C09';
var CARD  = '#1A1510';
var CARD2 = '#241C12';
var GOLD  = '#C9A84C';
var BURG  = '#800020';
var TEAL  = '#C9A84C';
var RED   = '#FF1A3C';
var TEXT  = '#F0E8D4';
var MUTED = '#8A7A62';
var DIM   = '#2E2318';
var BORD  = 'rgba(255,255,255,.06)';
var ORG   = '#FF6B35';

var ANIM = [
  '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}',
  '@keyframes dirIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes cardPop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}',
  '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
].join('\n');

// ─── System prompt ─────────────────────────────────────────────────────────────
var SYSTEM_PROMPT = 'You are SwanAI Director for SeeWhy LIVE v33. Calm, strategic, decisive. Washington Classic Domino Tournament context. 90% creator payout platform. RTMP: rtmp://2.24.194.112:1935/live. Be concise — 2-4 sentences unless building a rundown or plan.';

function fmtTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtEarnings(cents) {
  if (!cents) return '$0.00';
  return '$' + (Math.floor(cents) / 100).toFixed(2);
}

function fmtDuration(secs) {
  var h = Math.floor(secs / 3600);
  var m = Math.floor((secs % 3600) / 60);
  var s = Math.floor(secs % 60);
  if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

// ─── Command grid ─────────────────────────────────────────────────────────────
var CMD_SECTIONS = [
  {
    label: 'PRODUCTION',
    color: ORG,
    cmds: [
      { label: 'SCENE',    prompt: 'What is the best scene transition to make right now for maximum audience retention?' },
      { label: 'WRAP',     prompt: 'Plan the next 15 minutes of the stream for maximum engagement and revenue.' },
      { label: 'BRIEF',    prompt: 'Give me a complete 5-minute production brief: what to do, what to say, and what to watch for.' },
      { label: 'VIEWERS',  prompt: 'Based on current viewer count, what should we do RIGHT NOW to maximize engagement and keep people watching?' },
    ],
  },
  {
    label: 'MONETIZE',
    color: GOLD,
    cmds: [
      { label: 'MONEY',    prompt: 'What is the best monetization action to take in the next 2 minutes to maximize revenue?' },
      { label: 'PAYWALL',  prompt: 'What is the optimal paywall price point for this current audience size and engagement level?' },
      { label: '90/10',    prompt: 'How should I pitch the 90% creator payout to my audience right now for maximum conversions?' },
      { label: 'GIFTS',    prompt: 'What gift tier should I encourage right now and what is the best way to ask for it?' },
    ],
  },
  {
    label: 'DOMINO',
    color: TEAL,
    cmds: [
      { label: 'GAME',     prompt: 'Give me a sharp analyst breakdown of the current domino game moment. Washington Classic context.' },
      { label: 'NEXT',     prompt: 'How should I intro the next domino match to build maximum hype and keep viewers engaged?' },
      { label: 'FADES',    prompt: 'Is now a good time to start a Fades (Online Corruption) match? What is the strategy and hype approach?' },
      { label: 'TOURNEY',  prompt: 'Give me a tournament status update script for the Washington Classic. Include standings context and what\'s at stake.' },
      { label: 'FANOUT',   prompt: 'Which platforms should we prioritize for the RTMP fanout right now and why?' },
      { label: 'HIGHLIGHT', prompt: 'Describe the ideal highlight clip from the last few minutes and how to caption it for viral potential.' },
    ],
  },
];

export default function SwanAITab(props) {
  var isLive              = props.isLive;
  var viewerCount         = props.viewerCount;
  var addToast            = props.addToast;
  var socket              = props.socket;
  var roomId              = props.roomId;
  var sessionEarningsCents= props.sessionEarningsCents || 0;
  var username            = props.username || 'Director';
  var role                = props.role;

  var [section,      setSection]      = useState('director');  // director | rundown | cards | notes
  var [msgs,         setMsgs]         = useState(function() {
    try { var s = localStorage.getItem('sw_swanai_msgs'); if (s) return JSON.parse(s); } catch(e) {}
    return [{ role: 'dir', text: '🎯 SwanAI Director v33 ONLINE. Production command center ready. Washington Classic stream mode active.', time: fmtTime() }];
  });
  var [input,        setInput]        = useState('');
  var [loading,      setLoading]      = useState(false);
  var [cueCards,     setCueCards]     = useState(function() {
    try { var s = localStorage.getItem('sw_cue_cards'); if (s) return JSON.parse(s); } catch(e) {}
    return [];
  });
  var [notes,        setNotes]        = useState(function() {
    try { return localStorage.getItem('sw_director_notes') || ''; } catch(e) { return ''; }
  });
  var [rundown,      setRundown]      = useState('');
  var [rundownLoad,  setRundownLoad]  = useState(false);
  var [liveSeconds,  setLiveSeconds]  = useState(0);
  var [sendingToRoom,setSendingToRoom]= useState(null);
  var [expandedCmd,  setExpandedCmd]  = useState(null);
  var chatRef = useRef(null);
  var liveTimerRef = useRef(null);

  // ── Persist ──────────────────────────────────────────────────────────────
  useEffect(function() {
    try { localStorage.setItem('sw_swanai_msgs', JSON.stringify(msgs.slice(-60))); } catch(e) {}
  }, [msgs]);

  useEffect(function() {
    try { localStorage.setItem('sw_cue_cards', JSON.stringify(cueCards.slice(0, 30))); } catch(e) {}
  }, [cueCards]);

  useEffect(function() {
    try { localStorage.setItem('sw_director_notes', notes); } catch(e) {}
  }, [notes]);

  // ── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(function() {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  // ── Live timer ────────────────────────────────────────────────────────────
  useEffect(function() {
    if (isLive) {
      liveTimerRef.current = setInterval(function() { setLiveSeconds(function(n) { return n + 1; }); }, 1000);
    } else {
      clearInterval(liveTimerRef.current);
      setLiveSeconds(0);
    }
    return function() { clearInterval(liveTimerRef.current); };
  }, [isLive]);

  // ── AI call ───────────────────────────────────────────────────────────────
  function callDirector(prompt, userMsg) {
    setLoading(true);
    if (userMsg) {
      setMsgs(function(p) { return p.concat([{ role: 'user', text: userMsg, time: fmtTime() }]); });
    }
    var ctx = (viewerCount || 0).toLocaleString() + ' viewers live. Stream ' + (isLive ? 'LIVE (' + fmtDuration(liveSeconds) + ')' : 'OFFLINE') + '. Session earnings: ' + fmtEarnings(sessionEarningsCents) + '. ';
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: SYSTEM_PROMPT, message: ctx + prompt }),
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var reply = d.text || '🎯 Director processing…';
        setMsgs(function(p) { return p.concat([{ role: 'dir', text: reply, time: fmtTime(), pinnable: true }]); });
        setLoading(false);
      })
      .catch(function() {
        setMsgs(function(p) { return p.concat([{ role: 'dir', text: '⚡ Signal interrupted. Retry.', time: fmtTime() }]); });
        setLoading(false);
      });
  }

  function send() {
    if (!input.trim() || loading) return;
    callDirector(input, input);
    setInput('');
  }

  // ── Pin to cue cards ─────────────────────────────────────────────────────
  function pinCard(text) {
    var card = { id: 'card-' + Date.now(), text: text, ts: fmtTime() };
    setCueCards(function(prev) { return [card].concat(prev).slice(0, 30); });
    if (addToast) addToast('📌 Pinned to Cue Cards', 'success');
  }

  function removeCard(id) {
    setCueCards(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
  }

  // ── Send to room chat ─────────────────────────────────────────────────────
  function sendToRoom(text, msgIdx) {
    if (!socket || !roomId) { if (addToast) addToast('Join a room first', 'error'); return; }
    setSendingToRoom(msgIdx);
    socket.emit('chat-message', { roomId: roomId, message: '[🎯 Director] ' + text.slice(0, 200), username: username });
    setTimeout(function() {
      setSendingToRoom(null);
      if (addToast) addToast('📡 Sent to room chat', 'success');
    }, 600);
  }

  // ── Rundown generator ─────────────────────────────────────────────────────
  function generateRundown() {
    setRundownLoad(true);
    var prompt = 'Create a detailed timed stream rundown for the next 60 minutes of the SeeWhy LIVE Washington Classic domino tournament stream.' +
      ' Current stats: ' + (viewerCount || 0) + ' viewers, ' + fmtEarnings(sessionEarningsCents) + ' earned this session.' +
      ' Include: segment titles, timestamps (every 5-10 min), talking points, monetization moments, domino match pacing, and energy management.' +
      ' Format each block as: [TIME] SEGMENT — brief description. Keep it practical and actionable.';
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: SYSTEM_PROMPT, message: prompt }),
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        setRundown(d.text || 'Unable to generate rundown.');
        setRundownLoad(false);
      })
      .catch(function() {
        setRundown('Rundown generation failed. Check API connection.');
        setRundownLoad(false);
      });
  }

  var SECTIONS = [
    { id: 'director', label: '🎯 DIRECTOR' },
    { id: 'rundown',  label: '📋 RUNDOWN'  },
    { id: 'cards',    label: '📌 CUE CARDS' + (cueCards.length > 0 ? ' ' + cueCards.length : '') },
    { id: 'notes',    label: '✏️ NOTES'    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG, fontFamily: "'Barlow Condensed',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      {/* ── HUD ── */}
      <div style={{ background: 'rgba(255,107,53,.07)', borderBottom: '1px solid rgba(255,107,53,.15)', padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,rgba(255,107,53,.3),rgba(255,140,90,.1))', border: '1.5px solid rgba(255,107,53,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎯</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: ORG, letterSpacing: 2, lineHeight: 1 }}>SWANAI DIRECTOR</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: MUTED, marginTop: 1 }}>Production Command Center · v33</div>
        </div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isLive && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: RED, lineHeight: 1 }}>{fmtDuration(liveSeconds)}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>LIVE</div>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: TEAL, lineHeight: 1 }}>{(viewerCount || 0).toLocaleString()}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>VIEWERS</div>
          </div>
          {sessionEarningsCents > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, lineHeight: 1 }}>{fmtEarnings(sessionEarningsCents)}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>EARNED</div>
            </div>
          )}
          {loading && <div style={{ width: 18, height: 18, border: '2px solid ' + ORG, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />}
        </div>
      </div>

      {/* ── Section tabs ── */}
      <div style={{ display: 'flex', background: SURF, borderBottom: '1px solid ' + BORD, flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {SECTIONS.map(function(s) {
          var active = section === s.id;
          return (
            <button key={s.id} onClick={function() { setSection(s.id); }}
              style={{ flex: 'none', background: 'none', border: 'none', borderBottom: '2px solid ' + (active ? ORG : 'transparent'), padding: '8px 14px', cursor: 'pointer', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: active ? ORG : MUTED, letterSpacing: .5, transition: 'color .15s, border-color .15s', whiteSpace: 'nowrap' }}>
              {s.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>

        {/* ════ DIRECTOR ════ */}
        {section === 'director' && (
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12, animation: 'dirIn .25s ease' }}>

            {/* Command sections */}
            {CMD_SECTIONS.map(function(sec) {
              return (
                <div key={sec.label}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: sec.color, letterSpacing: 1.5, marginBottom: 6, opacity: .8 }}>{sec.label}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
                    {sec.cmds.map(function(cmd) {
                      return (
                        <button key={cmd.label} onClick={function() { callDirector(cmd.prompt, null); }} disabled={loading}
                          style={{ background: 'rgba(255,107,53,.07)', border: '1px solid rgba(255,107,53,.2)', borderRadius: 7, padding: '6px 4px', color: ORG, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, letterSpacing: .5, transition: 'background .1s' }}>
                          {cmd.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Chat log */}
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 6 }}>DIRECTOR CHAT</div>
              <div ref={chatRef} style={{ background: 'rgba(14,12,9,.8)', border: '1px solid rgba(255,107,53,.12)', borderRadius: 12, padding: '10px', height: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7, scrollbarWidth: 'none' }}>
                {msgs.map(function(m, i) {
                  var isUser = m.role === 'user';
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '92%', background: isUser ? 'linear-gradient(135deg,#800020,#C01838)' : 'linear-gradient(135deg,rgba(255,107,53,.14),rgba(255,140,90,.06))', border: '1px solid ' + (isUser ? 'rgba(192,24,56,.5)' : 'rgba(255,107,53,.3)'), borderRadius: isUser ? '8px 8px 2px 8px' : '8px 8px 8px 2px', padding: '7px 10px' }}>
                        {!isUser && (
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: ORG, letterSpacing: 1, marginBottom: 2 }}>🎯 SWANAI · {m.time}</div>
                        )}
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: TEXT, lineHeight: 1.45 }}>{m.text}</div>
                        {isUser && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: 'rgba(255,255,255,.3)', marginTop: 2, textAlign: 'right' }}>{m.time}</div>}
                      </div>
                      {!isUser && m.pinnable && (
                        <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
                          <button onClick={function() { pinCard(m.text); }}
                            style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 5, padding: '2px 7px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 6.5, cursor: 'pointer' }}>
                            📌 PIN
                          </button>
                          <button onClick={function() { sendToRoom(m.text, i); }}
                            style={{ background: sendingToRoom === i ? 'rgba(201,168,76,.18)' : 'rgba(201,168,76,.07)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 5, padding: '2px 7px', color: TEAL, fontFamily: "'DM Mono',monospace", fontSize: 6.5, cursor: 'pointer', transition: 'background .2s' }}>
                            {sendingToRoom === i ? '✓ SENT' : '📡 ROOM'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {loading && (
                  <div style={{ display: 'flex', gap: 4, padding: '4px 2px' }}>
                    {[0,1,2].map(function(i) {
                      return <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: ORG, animation: 'pulse 1.2s ease infinite', animationDelay: i * .25 + 's' }} />;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={input} onChange={function(e) { setInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') send(); }}
                placeholder="Brief the Director…"
                style={{ flex: 1, background: CARD2, border: '1px solid ' + DIM, borderRadius: 9, padding: '9px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }} />
              <button onClick={send} disabled={loading || !input.trim()}
                style={{ background: 'linear-gradient(135deg,' + ORG + ',#FF8C5A)', border: 'none', borderRadius: 9, padding: '9px 16px', color: '#07050A', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? .5 : 1, flexShrink: 0 }}>
                DIRECT
              </button>
            </div>

            {/* Clear log */}
            <button onClick={function() { setMsgs([{ role: 'dir', text: '🎯 SwanAI Director ONLINE.', time: fmtTime() }]); }}
              style={{ background: 'none', border: 'none', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 7.5, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              🗑 clear chat log
            </button>
          </div>
        )}

        {/* ════ RUNDOWN ════ */}
        {section === 'rundown' && (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12, animation: 'dirIn .25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 2 }}>Stream Rundown</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 2 }}>AI-generated 60-min show plan</div>
              </div>
              <button onClick={generateRundown} disabled={rundownLoad}
                style={{ background: rundownLoad ? CARD2 : 'linear-gradient(135deg,' + BURG + ',#C01838)', border: 'none', borderRadius: 10, padding: '9px 14px', color: rundownLoad ? MUTED : GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: rundownLoad ? 'default' : 'pointer', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                {rundownLoad ? <span style={{ display: 'inline-block', animation: 'spin .8s linear infinite' }}>⟳</span> : '✨'} {rundownLoad ? 'BUILDING…' : 'GENERATE'}
              </button>
            </div>

            {!rundown && !rundownLoad && (
              <div style={{ background: CARD, border: '1px solid ' + BORD, borderRadius: 12, padding: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 36 }}>📋</span>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT }}>No rundown yet</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, maxWidth: 200 }}>Tap Generate to build a timed show plan based on current viewer count and session earnings</div>
              </div>
            )}

            {rundownLoad && (
              <div style={{ background: CARD, border: '1px solid rgba(255,107,53,.2)', borderRadius: 12, padding: '20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 22, height: 22, border: '2px solid ' + ORG, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: TEXT }}>Building your rundown…</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, marginTop: 2 }}>Analyzing stream context + scheduling segments</div>
                </div>
              </div>
            )}

            {rundown && !rundownLoad && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: ORG, letterSpacing: 1 }}>YOUR SHOW PLAN</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={function() { pinCard('RUNDOWN:\n' + rundown); }}
                      style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 6, padding: '3px 8px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer' }}>
                      📌 PIN
                    </button>
                    <button onClick={generateRundown}
                      style={{ background: 'rgba(255,107,53,.1)', border: '1px solid rgba(255,107,53,.25)', borderRadius: 6, padding: '3px 8px', color: ORG, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer' }}>
                      ⟳ REGEN
                    </button>
                  </div>
                </div>
                <div style={{ background: CARD, border: '1px solid rgba(255,107,53,.15)', borderRadius: 12, padding: '14px' }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12.5, color: TEXT, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{rundown}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ CUE CARDS ════ */}
        {section === 'cards' && (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12, animation: 'dirIn .25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 2 }}>Cue Cards</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 2 }}>Pinned Director responses for reference</div>
              </div>
              {cueCards.length > 0 && (
                <button onClick={function() { setCueCards([]); }}
                  style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.2)', borderRadius: 8, padding: '5px 10px', color: RED, fontFamily: "'DM Mono',monospace", fontSize: 7.5, cursor: 'pointer' }}>
                  CLEAR ALL
                </button>
              )}
            </div>

            {cueCards.length === 0 ? (
              <div style={{ background: CARD, border: '1px solid ' + BORD, borderRadius: 12, padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 36 }}>📌</span>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT }}>No cue cards yet</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>Tap PIN on any Director response to save it here for quick reference during your stream</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cueCards.map(function(card) {
                  return (
                    <div key={card.id} style={{ background: CARD, border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: '12px 14px', animation: 'cardPop .25s ease', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: GOLD, letterSpacing: 1 }}>📌 CUE · {card.ts}</div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={function() {
                            navigator.clipboard && navigator.clipboard.writeText(card.text).then(function() {
                              if (addToast) addToast('Copied!', 'success');
                            });
                          }} style={{ background: 'rgba(255,255,255,.05)', border: 'none', borderRadius: 5, padding: '2px 6px', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer' }}>COPY</button>
                          <button onClick={function() { removeCard(card.id); }}
                            style={{ background: 'none', border: 'none', color: MUTED, fontSize: 13, cursor: 'pointer', lineHeight: 1 }}>✕</button>
                        </div>
                      </div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12.5, color: TEXT, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{card.text}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ NOTES ════ */}
        {section === 'notes' && (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12, animation: 'dirIn .25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 2 }}>Director Notes</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 2 }}>Auto-saved scratchpad for your stream</div>
              </div>
              {notes && (
                <button onClick={function() {
                  navigator.clipboard && navigator.clipboard.writeText(notes).then(function() {
                    if (addToast) addToast('Notes copied!', 'success');
                  });
                }} style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '5px 10px', color: TEAL, fontFamily: "'DM Mono',monospace", fontSize: 7.5, cursor: 'pointer' }}>
                  📋 COPY
                </button>
              )}
            </div>

            <textarea value={notes} onChange={function(e) { setNotes(e.target.value); }}
              placeholder={'Stream notes, talking points, player names, scores...\n\n— Auto-saves as you type —'}
              style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 12, padding: '14px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 11, outline: 'none', resize: 'none', lineHeight: 1.7, minHeight: 320 }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setNotes(''); }}
                style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.2)', borderRadius: 8, padding: '9px 14px', color: RED, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                🗑 CLEAR
              </button>
              <button onClick={function() {
                if (!notes.trim()) { if (addToast) addToast('Nothing to pin', 'error'); return; }
                pinCard('NOTES:\n' + notes);
              }} style={{ flex: 1, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 8, padding: '9px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                📌 PIN NOTES AS CUE CARD
              </button>
            </div>

            {/* Quick stamps */}
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 6 }}>QUICK STAMPS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {[
                  '⭐ KEY MOMENT',
                  '💰 MONETIZE NOW',
                  '🎲 GAME BREAK',
                  '📣 SHOUTOUT',
                  '⚔️ FADES BATTLE',
                  '🏆 WINNER',
                ].map(function(stamp) {
                  return (
                    <button key={stamp} onClick={function() {
                      var ts = fmtTime();
                      setNotes(function(n) { return n + (n ? '\n' : '') + '[' + ts + '] ' + stamp; });
                    }} style={{ background: CARD, border: '1px solid ' + BORD, borderRadius: 8, padding: '5px 10px', color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 10, cursor: 'pointer' }}>
                      {stamp}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
