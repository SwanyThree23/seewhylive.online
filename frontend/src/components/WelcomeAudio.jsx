import React, { useState, useEffect, useRef } from 'react';

var SECTIONS = [
  {
    icon: '📡', label: 'WELCOME',
    text: 'Welcome to SeeWhy LIVE — where creators take control. The next-generation live streaming platform built to dominate.'
  },
  {
    icon: '🔴', label: 'GO LIVE',
    text: 'Go live in seconds. Share your world with crystal-clear video and audio — bringing your audience directly into your experience from any device.'
  },
  {
    icon: '💰', label: '90% REVENUE',
    text: "Get paid like never before. Fans send live gifts and buy subscriptions in real time. You keep ninety percent of every dollar — the most creator-first revenue split in the industry. No negotiation. No compromise."
  },
  {
    icon: '🤖', label: 'AURA A.I.',
    text: "AURA is your built-in A.I. co-host. It hypes your crowd, greets every new fan by name, and keeps your stream energy alive around the clock — even when you step away. Four personality modes. Always on."
  },
  {
    icon: '🔭', label: 'DISCOVER',
    text: "Get discovered globally. Your live streams appear on the Discover feed the moment you go live — in front of new fans actively searching for content exactly like yours."
  },
  {
    icon: '⚡', label: 'BATTLES',
    text: "Challenge other creators to live head-to-head battles. Your audience votes in real time. Only the best content wins. The crowd decides everything."
  },
  {
    icon: '🛡', label: 'GUARDIAN',
    text: "Guardian A.I. moderates your chat automatically — blocking spam, caps floods, toxic messages, and emoji abuse before they ever reach your audience. Set it and stream."
  },
  {
    icon: '🤖', label: 'SWANYBOT',
    text: "SwanyBot runs your entire room on autopilot. Live polls, custom chat commands, automated shoutouts, and viewer milestone celebrations — your stream practically manages itself."
  },
  {
    icon: '📊', label: 'ANALYTICS',
    text: "Real-time analytics track everything that matters — peak viewers, live earnings, session duration, and engagement. A full recap lands the moment your broadcast ends."
  },
  {
    icon: '🌍', label: 'GLOBAL REACH',
    text: "Break every language barrier. Every chat message is automatically detected and translated — so your content reaches fans in every country, every timezone, and every culture on earth."
  },
  {
    icon: '🏆', label: 'YOUR PLATFORM',
    text: "No gatekeepers. No middlemen. No compromises. SeeWhy LIVE is built by creators, for creators. Your stream. Your rules. Your revenue. Let's go live."
  }
];

var STORAGE_KEY = 'sw_welcomed_v33';

export default function WelcomeAudio(props) {
  var socket = props.socket;

  var [visible,    setVisible]    = useState(false);
  var [started,    setStarted]    = useState(false);
  var [playing,    setPlaying]    = useState(false);
  var [currentIdx, setCurrentIdx] = useState(0);
  var [completed,  setCompleted]  = useState(false);
  var [hasAudio,   setHasAudio]   = useState(false);

  var synthRef = useRef(null);
  var idxRef   = useRef(0);

  useEffect(function() {
    var supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    setHasAudio(supported);
    if (supported) synthRef.current = window.speechSynthesis;
  }, []);

  useEffect(function() {
    try { if (sessionStorage.getItem(STORAGE_KEY)) return; } catch(e) {}
    var t = setTimeout(function() { setVisible(true); }, 1800);
    return function() { clearTimeout(t); };
  }, []);

  function getBestVoice() {
    if (!synthRef.current) return null;
    var voices = synthRef.current.getVoices();
    var v = voices.find(function(voice) {
      return voice.name.indexOf('Google') >= 0 && voice.lang.indexOf('en') === 0;
    });
    if (!v) v = voices.find(function(voice) { return voice.lang.indexOf('en-US') === 0; });
    if (!v) v = voices.find(function(voice) { return voice.lang.indexOf('en') === 0; });
    return v || null;
  }

  function speakSection(idx) {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    idxRef.current = idx;
    setCurrentIdx(idx);
    setPlaying(true);

    var utt = new SpeechSynthesisUtterance(SECTIONS[idx].text);
    utt.rate   = 0.90;
    utt.pitch  = 1.0;
    utt.volume = 1.0;

    var voice = getBestVoice();
    if (voice) utt.voice = voice;

    utt.onend = function() {
      var next = idxRef.current + 1;
      if (next < SECTIONS.length) {
        setTimeout(function() { speakSection(next); }, 280);
      } else {
        setPlaying(false);
        setCompleted(true);
      }
    };

    utt.onerror = function() { setPlaying(false); };

    synthRef.current.speak(utt);
  }

  function handleStart() {
    setStarted(true);
    idxRef.current = 0;
    if (hasAudio) {
      speakSection(0);
    } else {
      setCurrentIdx(0);
    }
  }

  function handleTogglePause() {
    if (!synthRef.current) return;
    if (synthRef.current.paused) {
      synthRef.current.resume();
      setPlaying(true);
    } else if (synthRef.current.speaking) {
      synthRef.current.pause();
      setPlaying(false);
    }
  }

  function handleNext() {
    var next = idxRef.current + 1;
    if (next < SECTIONS.length) {
      if (hasAudio) {
        speakSection(next);
      } else {
        idxRef.current = next;
        setCurrentIdx(next);
      }
    } else {
      if (synthRef.current) synthRef.current.cancel();
      setPlaying(false);
      setCompleted(true);
    }
  }

  function handlePrev() {
    var prev = idxRef.current - 1;
    if (prev >= 0) {
      if (hasAudio) {
        speakSection(prev);
      } else {
        idxRef.current = prev;
        setCurrentIdx(prev);
      }
    }
  }

  function handleClose() {
    if (synthRef.current) synthRef.current.cancel();
    setVisible(false);
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch(e) {}
  }

  if (!visible) return null;

  var progress = started
    ? Math.round(((currentIdx + (completed ? 1 : 0)) / SECTIONS.length) * 100)
    : 0;
  var current = SECTIONS[Math.min(currentIdx, SECTIONS.length - 1)];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(14,12,9,.96)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 16px'
    }}>
      <style>{'@keyframes waveBar{0%{transform:scaleY(.3)}100%{transform:scaleY(1)}} @keyframes speakerPulse{0%,100%{opacity:.8;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}'}</style>

      <div style={{
        width: '100%', maxWidth: 460,
        background: 'linear-gradient(160deg,#1A1510,#0E0C09)',
        border: '1px solid rgba(201,168,76,.3)',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 0 80px rgba(128,0,32,.3), 0 4px 40px rgba(0,0,0,.85)'
      }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#5A0015,#9A0025)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: 'rgba(255,255,255,.08)', border: '2px solid rgba(201,168,76,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            animation: playing ? 'speakerPulse 1.4s ease infinite' : 'none'
          }}>
            {playing ? '🔊' : '🤖'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C', letterSpacing: 3, lineHeight: 1 }}>SEEWHY LIVE</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'rgba(255,255,255,.5)', letterSpacing: 2, marginTop: 2 }}>PLATFORM ORIENTATION · SWANYBOT v33</div>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, width: 30, height: 30, color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* PRE-START */}
          {!started && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 50, marginBottom: 10 }}>🎙</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#F0E8D4', letterSpacing: 2, lineHeight: 1, marginBottom: 8 }}>
                WELCOME, CREATOR
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: '#8A7A62', lineHeight: 1.6, marginBottom: 14 }}>
                Let SwanyBot walk you through everything SeeWhy LIVE can do — features, revenue tools, A.I. automation, global reach, and creator-first power.
              </div>

              {/* Feature preview grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                {[
                  ['💰', '90% REVENUE', 'Industry-best creator split'],
                  ['🤖', 'AURA A.I.',   'Always-on AI co-host'],
                  ['🛡', 'GUARDIAN',    'Automatic chat moderation'],
                  ['🌍', '11 FEATURES', 'Full platform audio tour']
                ].map(function(item) {
                  return (
                    <div key={item[1]} style={{ background: 'rgba(26,21,16,.8)', border: '1px solid rgba(201,168,76,.12)', borderRadius: 8, padding: '9px 10px', textAlign: 'left', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 16, lineHeight: 1, marginTop: 1 }}>{item[0]}</span>
                      <div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#C9A84C', letterSpacing: 1 }}>{item[1]}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#8A7A62', marginTop: 2 }}>{item[2]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleStart}
                  style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 10, color: '#C9A84C', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, cursor: 'pointer' }}>
                  {hasAudio ? '▶ PLAY AUDIO TOUR' : '▶ START PLATFORM TOUR'}
                </button>
                <button
                  onClick={handleClose}
                  style={{ flex: 1, padding: '13px', background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, color: '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer' }}>
                  SKIP
                </button>
              </div>

              {hasAudio && (
                <div style={{ marginTop: 8, fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3020', letterSpacing: 1 }}>
                  🔊 AUDIO NARRATION VIA BROWSER SPEECH SYNTHESIS
                </div>
              )}
            </div>
          )}

          {/* IN-PROGRESS */}
          {started && !completed && (
            <>
              {/* Active section card */}
              <div style={{
                background: 'rgba(128,0,32,.07)',
                border: '1px solid ' + (playing ? 'rgba(201,168,76,.4)' : 'rgba(201,168,76,.2)'),
                borderRadius: 12, padding: '14px 16px', minHeight: 105,
                boxShadow: playing ? '0 0 24px rgba(201,168,76,.06)' : 'none',
                transition: 'border-color .3s, box-shadow .3s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{current.icon}</span>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, flex: 1 }}>{current.label}</div>
                  {playing && (
                    <div style={{ display: 'flex', gap: 2.5, alignItems: 'flex-end', height: 18 }}>
                      {[4, 6, 8, 6, 4].map(function(h, i) {
                        return (
                          <div key={i} style={{
                            width: 2.5, height: h,
                            background: '#C9A84C', borderRadius: 999,
                            animation: 'waveBar .55s ease-in-out ' + (i * 0.1) + 's infinite alternate',
                            transformOrigin: 'bottom'
                          }} />
                        );
                      })}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: '#F0E8D4', lineHeight: 1.55 }}>
                  {current.text}
                </div>
              </div>

              {/* Section icon strip */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                {SECTIONS.map(function(s, i) {
                  var done   = i < currentIdx;
                  var active = i === currentIdx;
                  return (
                    <div key={i} title={s.label} style={{
                      width: 30, height: 30, borderRadius: 7, fontSize: 13,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done   ? 'rgba(201,168,76,.08)' :
                                  active ? 'rgba(201,168,76,.12)' : 'rgba(26,21,16,.6)',
                      border: '1px solid ' + (done   ? 'rgba(201,168,76,.3)' :
                                              active ? 'rgba(201,168,76,.45)' : '#3D3020'),
                      color: done ? '#C9A84C' : '#F0E8D4',
                      transform: active ? 'scale(1.12)' : 'scale(1)',
                      transition: 'all .2s'
                    }}>
                      {done ? '✓' : s.icon}
                    </div>
                  );
                })}
              </div>

              {/* Progress */}
              <div>
                <div style={{ height: 5, background: '#1A1510', borderRadius: 999, overflow: 'hidden', marginBottom: 5 }}>
                  <div style={{ height: '100%', width: progress + '%', background: 'linear-gradient(90deg,#800020,#C9A84C)', borderRadius: 999, transition: 'width .45s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{currentIdx + 1} of {SECTIONS.length}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{progress}%</div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  style={{ flex: 1, padding: '9px 4px', background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 8, color: currentIdx === 0 ? '#3D3020' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', letterSpacing: 1 }}>
                  ◀ PREV
                </button>
                {hasAudio && (
                  <button
                    onClick={handleTogglePause}
                    style={{ flex: 1, padding: '9px 4px', background: 'rgba(212,133,74,.1)', border: '1px solid rgba(212,133,74,.25)', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>
                    {playing ? '⏸ PAUSE' : '▶ RESUME'}
                  </button>
                )}
                <button
                  onClick={handleNext}
                  style={{ flex: 1, padding: '9px 4px', background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.22)', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>
                  NEXT ▶
                </button>
                <button
                  onClick={handleClose}
                  style={{ flex: 1, padding: '9px 4px', background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 8, color: '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>
                  ✕ EXIT
                </button>
              </div>
            </>
          )}

          {/* COMPLETED */}
          {completed && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🏆</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, color: '#C9A84C', letterSpacing: 3, marginBottom: 8 }}>
                YOU'RE READY
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: '#8A7A62', lineHeight: 1.6, marginBottom: 16 }}>
                SeeWhy LIVE is yours. Go live, grow your audience, earn your ninety percent, and build what's next.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
                {[['90%', 'YOUR CUT'], ['11', 'FEATURES'], ['∞', 'POTENTIAL']].map(function(stat) {
                  return (
                    <div key={stat[0]} style={{ background: 'rgba(26,21,16,.7)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: '#C9A84C', lineHeight: 1 }}>{stat[0]}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#8A7A62', letterSpacing: 1, marginTop: 2 }}>{stat[1]}</div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleClose}
                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 10, color: '#C9A84C', fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 3, cursor: 'pointer' }}>
                LET'S GO LIVE 🔴
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.04)', padding: '7px 18px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3020', letterSpacing: 1 }}>POWERED BY SWANYBOT</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3020', letterSpacing: 1 }}>SWANYTHREE ENTTECH · v33</div>
        </div>

      </div>
    </div>
  );
}
