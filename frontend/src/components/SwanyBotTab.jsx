import React, { useState, useEffect, useRef } from 'react';

var DEFAULT_RULES = [
  { id: 'viewer_join',        icon: '👋', label: 'Greet New Viewers',  enabled: true },
  { id: 'gift_received',      icon: '🎁', label: 'Hype Gifts',         enabled: true },
  { id: 'spam_detected',      icon: '🛡', label: 'Spam Guard',         enabled: true },
  { id: 'viewers_drop_20pct', icon: '⚠️', label: 'Drop Alert',         enabled: true },
  { id: 'new_subscription',   icon: '🎉', label: 'Sub Shoutout',       enabled: true },
];

var DEFAULT_TRIGGERS = [
  { id: 'trig_1', keyword: '!hype',    response: '🔥 THE DOMINO CROWD IS ALIVE! SeeWhy LIVE v33 is in the building!' },
  { id: 'trig_2', keyword: '!score',   response: '🎲 Check the LIVE scoreboard for Washington Classic standings!' },
  { id: 'trig_3', keyword: '!discord', response: '💬 Join the SwanyThree EntTech community!' },
];

var SIM_EVENTS = [
  { event: 'viewer_join',        message: 'SeeWhyFan42 joined the stream' },
  { event: 'viewer_join',        message: 'DominoKing99 joined the stream' },
  { event: 'gift_received',      message: 'CaliBonesOG sent a Crown gift worth $10.00' },
  { event: 'gift_received',      message: 'LyricQueen sent a Fire gift worth $0.50' },
  { event: 'spam_detected',      message: 'Socket muted for 60s (flood detected)' },
  { event: 'new_subscription',   message: 'WashingtonFan subscribed at gold tier' },
  { event: 'trigger',            message: '!hype fired → AURA responded' },
  { event: 'trigger',            message: '!score fired → standings displayed' },
  { event: 'viewer_join',        message: 'TechNerd42 joined the stream' },
  { event: 'milestone_1000',     message: '1000 viewers — consider FADES!' },
];

function getLogIcon(event) {
  if (event === 'viewer_join')       return '👋';
  if (event === 'gift_received')     return '🎁';
  if (event === 'spam_detected')     return '🛡';
  if (event === 'milestone_1000')    return '🔥';
  if (event === 'viewers_drop')      return '⚠️';
  if (event === 'new_subscription')  return '🎉';
  if (event === 'manual')            return '💬';
  if (event === 'trigger')           return '⚡';
  if (event === 'engagement_surge')  return '🚀';
  if (event === 'milestone_revenue') return '💰';
  if (event === 'retention_coach')   return '💡';
  if (event === 'command')           return '🤖';
  if (event === 'poll_created')      return '📊';
  if (event === 'clip_marker')       return '📎';
  return '🤖';
}

function formatTime(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0');
}

export default function SwanyBotTab({ socket, botLogs, roomId, addToast, isLive }) {
  var [rules,        setRules]        = useState(DEFAULT_RULES.map(function(r) { return Object.assign({}, r); }));
  var [triggers,     setTriggers]     = useState(DEFAULT_TRIGGERS.map(function(t) { return Object.assign({}, t); }));
  var [section,      setSection]      = useState('rules');
  var [manualMsg,    setManualMsg]    = useState('');
  var [sending,      setSending]      = useState(false);
  var [showAddTrig,  setShowAddTrig]  = useState(false);
  var [newKw,        setNewKw]        = useState('');
  var [newResp,      setNewResp]      = useState('');
  var [simLog,       setSimLog]       = useState([]);
  var [eventsPerMin, setEventsPerMin] = useState(0);
  var logEndRef = useRef(null);

  var [activePoll,   setActivePoll]   = useState(null);
  var [pollQuestion, setPollQuestion] = useState('');
  var [pollOptions,  setPollOptions]  = useState(['', '']);
  var [pollVotes,    setPollVotes]    = useState({});
  var [pollEnded,    setPollEnded]    = useState(false);
  var [pollTimer,    setPollTimer]    = useState(60);
  var [pollRunning,  setPollRunning]  = useState(false);
  var pollTimerRef = useRef(null);
  var [pastPolls,    setPastPolls]    = useState([
    { question: 'Should we run FADES next?', options: ['Yes 🔥', 'No 🚫'], votes: { 0: 47, 1: 12 }, ended: true },
    { question: 'Best Washington Classic round?', options: ['Round 1', 'Round 2', 'Sudden Death'], votes: { 0: 23, 1: 31, 2: 18 }, ended: true },
  ]);

  useEffect(function() {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [botLogs]);

  useEffect(function() {
    if (!isLive) return;
    var id = setInterval(function() {
      var pick = SIM_EVENTS[Math.floor(Math.random() * SIM_EVENTS.length)];
      setSimLog(function(prev) {
        return [Object.assign({}, pick, { id: 'sim_' + Date.now(), ts: Date.now() })].concat(prev.slice(0, 29));
      });
    }, 3500);
    return function() { clearInterval(id); };
  }, [isLive]);

  useEffect(function() {
    if (!isLive) return;
    var id = setInterval(function() {
      var cutoff = Date.now() - 60000;
      setSimLog(function(prev) {
        setEventsPerMin(prev.filter(function(e) { return e.ts > cutoff; }).length);
        return prev;
      });
    }, 10000);
    return function() { clearInterval(id); };
  }, [isLive]);

  useEffect(function() {
    if (!pollRunning) { if (pollTimerRef.current) clearInterval(pollTimerRef.current); return; }
    pollTimerRef.current = setInterval(function() {
      setPollTimer(function(n) {
        if (n <= 1) {
          clearInterval(pollTimerRef.current);
          setPollRunning(false);
          setPollEnded(true);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return function() { clearInterval(pollTimerRef.current); };
  }, [pollRunning]);

  useEffect(function() {
    if (!pollRunning || !activePoll) return;
    var t = setInterval(function() {
      if (!activePoll) return;
      var idx = Math.floor(Math.random() * activePoll.options.length);
      var votes = Math.floor(Math.random() * 8 + 1);
      setPollVotes(function(prev) {
        var next = Object.assign({}, prev);
        next[idx] = (prev[idx] || 0) + votes;
        return next;
      });
      if (socket) {
        socket.emit('poll-vote', { roomId: roomId, optionIndex: idx, votes: votes });
      }
    }, 3000);
    return function() { clearInterval(t); };
  }, [pollRunning, activePoll, socket, roomId]);

  function toggleRule(id) {
    setRules(function(prev) {
      return prev.map(function(r) {
        if (r.id !== id) return r;
        var next = Object.assign({}, r, { enabled: !r.enabled });
        if (socket) socket.emit('bot-rule-toggle', { roomId: roomId, rule: id, enabled: next.enabled });
        return next;
      });
    });
  }

  function sendManual() {
    if (!manualMsg.trim() || sending) return;
    setSending(true);
    if (socket) socket.emit('bot-manual-message', { roomId: roomId, message: manualMsg.trim() });
    if (addToast) addToast('Bot message sent', 'success');
    setManualMsg('');
    setTimeout(function() { setSending(false); }, 600);
  }

  function addTrigger() {
    if (!newKw.trim() || !newResp.trim()) {
      if (addToast) addToast('Keyword and response are required', 'error');
      return;
    }
    var kw = newKw.trim().toLowerCase();
    if (kw.charAt(0) !== '!') kw = '!' + kw;
    var t = { id: 'trig_' + Date.now(), keyword: kw, response: newResp.trim() };
    setTriggers(function(prev) { return prev.concat([t]); });
    if (socket) socket.emit('bot-add-trigger', { roomId: roomId, trigger: t });
    setNewKw('');
    setNewResp('');
    setShowAddTrig(false);
    if (addToast) addToast('Trigger added: ' + kw, 'success');
  }

  function removeTrigger(id) {
    setTriggers(function(prev) { return prev.filter(function(t) { return t.id !== id; }); });
    if (socket) socket.emit('bot-remove-trigger', { roomId: roomId, triggerId: id });
  }

  function launchPoll() {
    var validOptions = pollOptions.filter(function(o) { return o.trim().length > 0; });
    if (!pollQuestion.trim() || validOptions.length < 2) {
      if (addToast) addToast('Need a question and at least 2 options', 'error');
      return;
    }
    var poll = { question: pollQuestion.trim(), options: validOptions };
    setActivePoll(poll);
    setPollVotes({});
    setPollEnded(false);
    setPollTimer(60);
    setPollRunning(true);
    if (socket && roomId) {
      socket.emit('poll-start', { roomId: roomId, question: poll.question, options: poll.options, durationSec: 60 });
    }
    if (addToast) addToast('📊 Poll started!', 'success');
  }

  function endPoll() {
    setPollRunning(false);
    setPollEnded(true);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (activePoll) {
      setPastPolls(function(prev) {
        return [Object.assign({}, activePoll, { votes: Object.assign({}, pollVotes), ended: true })].concat(prev.slice(0, 4));
      });
      if (socket && roomId) {
        socket.emit('poll-end', { roomId: roomId, votes: Object.assign({}, pollVotes) });
      }
    }
  }

  function addOption() {
    if (pollOptions.length >= 4) { if (addToast) addToast('Maximum 4 options', 'info'); return; }
    setPollOptions(function(prev) { return prev.concat(['']); });
  }

  function removeOption(idx) {
    if (pollOptions.length <= 2) return;
    setPollOptions(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); });
  }

  function updateOption(idx, val) {
    setPollOptions(function(prev) { return prev.map(function(o, i) { return i === idx ? val : o; }); });
  }

  var BUILT_IN_COMMANDS = [
    { cmd: '!hype',     desc: 'Triggers AURA to fire a live hype message into chat',         icon: '🔥' },
    { cmd: '!info',     desc: 'SWANYBOT posts stream title, category and on-air duration',   icon: '📡' },
    { cmd: '!score',    desc: 'SWANYBOT announces current live viewer count',                icon: '👁' },
    { cmd: '!commands', desc: 'Lists all available chat commands in chat',                   icon: '🤖' },
  ];

  var activeCount = rules.filter(function(r) { return r.enabled; }).length;
  var SECTIONS = [['rules', '⚙ RULES'], ['triggers', '⚡ TRIGGERS'], ['polls', '📊 POLLS'], ['cmds', '💬 CMDS'], ['log', '📜 LOG']];
  var displayLogs = botLogs.length > 0 ? botLogs : simLog;

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: 430 }}>

      {/* Header */}
      <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', letterSpacing: 3 }}>SWANYBOT ENGINE</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62' }}>Real-time event automation · SeeWhy LIVE v33</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C', lineHeight: 1 }}>{activeCount}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1 }}>ACTIVE</div>
        </div>
        {isLive && (
          <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', lineHeight: 1 }}>{eventsPerMin}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1 }}>EVT/MIN</div>
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 8, padding: 3 }}>
        {SECTIONS.map(function(s) {
          var active = section === s[0];
          return (
            <button key={s[0]} onClick={function() { setSection(s[0]); }}
              style={{ flex: 1, padding: '7px 0', background: active ? 'rgba(201,168,76,.12)' : 'transparent', border: 'none', borderRadius: 6, color: active ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
              {s[1]}
            </button>
          );
        })}
      </div>

      {/* ── RULES ── */}
      {section === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rules.map(function(r) {
            return (
              <div key={r.id} style={{ background: r.enabled ? 'rgba(201,168,76,.04)' : 'rgba(26,21,16,.5)', border: '1px solid ' + (r.enabled ? 'rgba(201,168,76,.2)' : '#3D3020'), borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: r.enabled ? 'rgba(201,168,76,.1)' : 'rgba(26,21,16,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {r.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: r.enabled ? '#F0E8D4' : '#8A7A62' }}>{r.label}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: r.enabled ? '#C9A84C' : '#3D3020', letterSpacing: 1 }}>{r.enabled ? 'ACTIVE' : 'DISABLED'}</div>
                </div>
                <div
                  onClick={function() { toggleRule(r.id); }}
                  style={{ width: 36, height: 20, borderRadius: 999, background: r.enabled ? 'rgba(201,168,76,.7)' : '#3D3020', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: r.enabled ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: r.enabled ? '#07050A' : '#8A7A62', transition: 'left .18s' }} />
                </div>
              </div>
            );
          })}

          {/* Manual message sender */}
          <div style={{ background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '10px 12px', marginTop: 4 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', marginBottom: 7, letterSpacing: 2 }}>MANUAL BOT MESSAGE</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={manualMsg}
                onChange={function(e) { setManualMsg(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') sendManual(); }}
                placeholder="Broadcast a bot message to chat..."
                style={{ flex: 1, background: '#07050A', border: '1px solid #3D3020', borderRadius: 7, padding: '7px 10px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
              />
              <button
                onClick={sendManual}
                disabled={sending || !manualMsg.trim()}
                style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 7, padding: '7px 14px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: sending || !manualMsg.trim() ? 'not-allowed' : 'pointer', opacity: sending || !manualMsg.trim() ? 0.5 : 1, letterSpacing: 1 }}>
                SEND
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TRIGGERS ── */}
      {section === 'triggers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 1 }}>
            Chat keyword → auto-response pairs. Prefix with ! (e.g. !hype)
          </div>

          {triggers.map(function(t) {
            return (
              <div key={t.id} style={{ background: 'rgba(26,21,16,.7)', border: '1px solid #3D3020', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ background: 'rgba(200,255,0,.08)', border: '1px solid rgba(200,255,0,.2)', borderRadius: 4, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C', flexShrink: 0 }}>{t.keyword}</div>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={function() { removeTrigger(t.id); }}
                    style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.2)', borderRadius: 5, padding: '3px 8px', color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                    ✕ REMOVE
                  </button>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#8A7A62', lineHeight: 1.35, wordBreak: 'break-word' }}>{t.response}</div>
              </div>
            );
          })}

          {triggers.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3020' }}>No triggers yet — add one below</div>
          )}

          <button
            onClick={function() { setShowAddTrig(function(v) { return !v; }); }}
            style={{ padding: '9px', background: showAddTrig ? 'rgba(200,255,0,.1)' : 'rgba(26,21,16,.7)', border: '1px dashed ' + (showAddTrig ? 'rgba(200,255,0,.4)' : 'rgba(200,255,0,.2)'), borderRadius: 8, color: showAddTrig ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
            {showAddTrig ? '✕ CANCEL' : '+ ADD TRIGGER'}
          </button>

          {showAddTrig && (
            <div style={{ background: 'rgba(200,255,0,.04)', border: '1px solid rgba(200,255,0,.15)', borderRadius: 10, padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#C9A84C', letterSpacing: 2, marginBottom: 2 }}>NEW KEYWORD TRIGGER</div>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', marginBottom: 3 }}>KEYWORD (starts with !)</div>
                <input
                  value={newKw}
                  onChange={function(e) { setNewKw(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') document.getElementById('sw-new-resp').focus(); }}
                  placeholder="!command"
                  style={{ width: '100%', background: '#07050A', border: '1px solid #3D3020', borderRadius: 6, padding: '7px 10px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 10 }}
                />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', marginBottom: 3 }}>RESPONSE</div>
                <textarea
                  id="sw-new-resp"
                  value={newResp}
                  onChange={function(e) { setNewResp(e.target.value); }}
                  placeholder="Bot response text..."
                  rows={2}
                  style={{ width: '100%', background: '#07050A', border: '1px solid #3D3020', borderRadius: 6, padding: '7px 10px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, resize: 'vertical' }}
                />
              </div>
              <button
                onClick={addTrigger}
                style={{ padding: '8px', background: 'rgba(200,255,0,.12)', border: '1px solid rgba(200,255,0,.3)', borderRadius: 7, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
                ✓ SAVE TRIGGER
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── POLLS ── */}
      {section === 'polls' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Active poll display */}
          {activePoll && !pollEnded && (
            <div style={{ background: 'rgba(201,168,76,.06)', border: '2px solid rgba(201,168,76,.35)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 6px #FF1A3C' }} />
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2 }}>LIVE POLL</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: pollTimer <= 10 ? '#FF1A3C' : '#C9A84C', lineHeight: 1 }}>{pollTimer}s</span>
                  <button onClick={endPoll} style={{ background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 5, padding: '3px 9px', color: '#FF6B81', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>END</button>
                </div>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#F0E8D4', marginBottom: 10, lineHeight: 1.3 }}>{activePoll.question}</div>
              {(function() {
                var total = Object.values(pollVotes).reduce(function(s, v) { return s + v; }, 0);
                return activePoll.options.map(function(opt, i) {
                  var votes = pollVotes[i] || 0;
                  var pct = total > 0 ? Math.floor((votes / total) * 100) : 0;
                  return (
                    <div key={i} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#F0E8D4' }}>{opt}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C' }}>{pct}% · {votes}</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: '#1A1510', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,#800020,#C9A84C)', borderRadius: 4, transition: 'width .4s ease' }} />
                      </div>
                    </div>
                  );
                });
              })()}
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginTop: 6 }}>
                {Object.values(pollVotes).reduce(function(s, v) { return s + v; }, 0)} total votes
              </div>
            </div>
          )}

          {/* Poll results after ended */}
          {activePoll && pollEnded && (
            <div style={{ background: 'rgba(201,168,76,.05)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, marginBottom: 8 }}>POLL RESULTS</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: '#F0E8D4', marginBottom: 10 }}>{activePoll.question}</div>
              {(function() {
                var total = Object.values(pollVotes).reduce(function(s, v) { return s + v; }, 0);
                var maxVotes = Math.max.apply(null, Object.values(pollVotes).concat([0]));
                return activePoll.options.map(function(opt, i) {
                  var votes = pollVotes[i] || 0;
                  var pct = total > 0 ? Math.floor((votes / total) * 100) : 0;
                  var isWinner = votes === maxVotes && votes > 0;
                  return (
                    <div key={i} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: isWinner ? '#C9A84C' : '#A89CC8', fontWeight: isWinner ? 700 : 400 }}>{isWinner ? '🏆 ' : ''}{opt}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: isWinner ? '#C9A84C' : '#8A7A62' }}>{pct}%</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 4, background: '#1A1510', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: isWinner ? 'linear-gradient(90deg,#C9A84C,#C9A84C)' : 'rgba(201,168,76,.35)', borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                });
              })()}
              <button onClick={function() { setActivePoll(null); setPollEnded(false); setPollQuestion(''); setPollOptions(['', '']); }}
                style={{ marginTop: 8, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '5px 12px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                + NEW POLL
              </button>
            </div>
          )}

          {/* Poll creator */}
          {!activePoll && (
            <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 2 }}>CREATE POLL</div>
              <input
                value={pollQuestion}
                onChange={function(e) { setPollQuestion(e.target.value); }}
                placeholder="Poll question..."
                style={{ background: '#07050A', border: '1px solid #3D3020', borderRadius: 7, padding: '8px 10px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {pollOptions.map(function(opt, i) {
                  return (
                    <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C', flexShrink: 0 }}>{i + 1}</div>
                      <input
                        value={opt}
                        onChange={function(e) { updateOption(i, e.target.value); }}
                        placeholder={'Option ' + (i + 1) + '...'}
                        style={{ flex: 1, background: '#07050A', border: '1px solid #3D3020', borderRadius: 6, padding: '7px 10px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
                      />
                      {pollOptions.length > 2 && (
                        <button onClick={function() { removeOption(i); }} style={{ background: 'none', border: 'none', color: '#8A7A62', fontSize: 14, cursor: 'pointer', padding: '0 4px' }}>✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addOption} disabled={pollOptions.length >= 4}
                  style={{ flex: 1, padding: '7px', background: 'rgba(26,21,16,.8)', border: '1px dashed #3D3020', borderRadius: 7, color: '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: pollOptions.length >= 4 ? 'not-allowed' : 'pointer', opacity: pollOptions.length >= 4 ? 0.4 : 1 }}>
                  + OPTION
                </button>
                <button onClick={launchPoll}
                  style={{ flex: 2, padding: '7px', background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 7, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>
                  📊 LAUNCH POLL
                </button>
              </div>
            </div>
          )}

          {/* Past polls */}
          {pastPolls.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 2 }}>PAST POLLS</div>
              {pastPolls.slice(0, 3).map(function(p, pi) {
                var total = Object.values(p.votes).reduce(function(s, v) { return s + v; }, 0);
                var maxVotes = Math.max.apply(null, Object.values(p.votes).concat([0]));
                return (
                  <div key={pi} style={{ background: 'rgba(26,21,16,.6)', border: '1px solid #3D3020', borderRadius: 9, padding: '9px 12px' }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#A89CC8', marginBottom: 6 }}>{p.question}</div>
                    {p.options.map(function(opt, oi) {
                      var v = p.votes[oi] || 0;
                      var pct = total > 0 ? Math.floor((v / total) * 100) : 0;
                      var isW = v === maxVotes && v > 0;
                      return (
                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: isW ? '#C9A84C' : '#8A7A62', minWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isW ? '🏆 ' : ''}{opt}</span>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#1A1510', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: pct + '%', background: isW ? '#C9A84C' : '#3D3020', borderRadius: 2 }} />
                          </div>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', minWidth: 26, textAlign: 'right' }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── COMMANDS ── */}
      {section === 'cmds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 2 }}>
            BUILT-IN CHAT COMMANDS — type these in chat
          </div>

          {BUILT_IN_COMMANDS.map(function(c) {
            return (
              <div key={c.cmd} style={{ background: 'rgba(26,21,16,.7)', border: '1px solid #3D3020', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(200,255,0,.06)', border: '1px solid rgba(200,255,0,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{c.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ background: 'rgba(200,255,0,.08)', border: '1px solid rgba(200,255,0,.2)', borderRadius: 4, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C', display: 'inline-block', marginBottom: 4 }}>{c.cmd}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#8A7A62', lineHeight: 1.35 }}>{c.desc}</div>
                </div>
              </div>
            );
          })}

          <div style={{ background: 'rgba(128,0,32,.06)', border: '1px solid rgba(128,0,32,.2)', borderRadius: 10, padding: '10px 12px', marginTop: 4 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 2, marginBottom: 5 }}>CUSTOM TRIGGERS</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#8A7A62', lineHeight: 1.5 }}>
              Add your own keyword → response pairs in the <span style={{ color: '#C9A84C' }}>⚡ TRIGGERS</span> tab. Custom triggers are managed in SwanyBot and fire alongside these built-ins.
            </div>
          </div>
        </div>
      )}

      {/* ── LOG ── */}
      {section === 'log' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 2 }}>EVENT LOG</div>
            {isLive && botLogs.length === 0 && (
              <div style={{ background: 'rgba(200,255,0,.08)', border: '1px solid rgba(200,255,0,.2)', borderRadius: 999, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 1 }}>● SIM</div>
            )}
          </div>
          <div style={{ background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '8px', height: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {isLive && botLogs.length === 0 && simLog.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3020' }}>
                Waiting for events...
              </div>
            )}
            {!isLive && botLogs.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3020' }}>
                Waiting for events...
              </div>
            )}
            {isLive && botLogs.length === 0 && simLog.length > 0 && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', letterSpacing: 1, padding: '3px 7px', marginBottom: 2 }}>
                ● SIM MODE — no live socket events
              </div>
            )}
            {displayLogs.map(function(log) {
              return (
                <div key={log.id || Math.random()} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '5px 7px', background: 'rgba(26,21,16,.5)', borderRadius: 6, borderLeft: '2px solid rgba(201,168,76,.25)' }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#3D3020', flexShrink: 0, marginTop: 2 }}>{formatTime(log.ts)}</span>
                  <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1.1 }}>{getLogIcon(log.event)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 1 }}>{log.event || 'event'}</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#8A7A62', wordBreak: 'break-word' }}>{log.message || ''}</div>
                  </div>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>

          {/* Aura AI stat strip */}
          <div style={{ background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 2, marginBottom: 8 }}>AURA AI STATUS</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                ['MODEL',    'claude-sonnet-4'],
                ['RATE',     '1 / 8s'],
                ['MESSAGES', String(botLogs.filter(function(l) {
                  return l.event === 'viewer_join' || l.event === 'gift_received' || l.event === 'new_subscription';
                }).length)]
              ].map(function(item) {
                return (
                  <div key={item[0]} style={{ flex: 1, background: 'rgba(26,21,16,.7)', border: '1px solid #3D3020', borderRadius: 7, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1, marginBottom: 2 }}>{item[0]}</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#F0E8D4' }}>{item[1]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
