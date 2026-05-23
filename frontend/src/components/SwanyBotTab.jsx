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
  if (event === 'viewer_join')      return '👋';
  if (event === 'gift_received')    return '🎁';
  if (event === 'spam_detected')    return '🛡';
  if (event === 'milestone_1000')   return '🔥';
  if (event === 'viewers_drop')     return '⚠️';
  if (event === 'new_subscription') return '🎉';
  if (event === 'manual')           return '💬';
  if (event === 'trigger')          return '⚡';
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

  var activeCount = rules.filter(function(r) { return r.enabled; }).length;
  var SECTIONS = [['rules', '⚙ RULES'], ['triggers', '⚡ TRIGGERS'], ['log', '📜 LOG']];
  var displayLogs = botLogs.length > 0 ? botLogs : simLog;

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: 430 }}>

      {/* Header */}
      <div style={{ background: 'rgba(0,201,167,.06)', border: '1px solid rgba(0,201,167,.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(0,201,167,.12)', border: '1px solid rgba(0,201,167,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#00C9A7', letterSpacing: 3 }}>SWANYBOT ENGINE</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90' }}>Real-time event automation · SeeWhy LIVE v33</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#00C9A7', lineHeight: 1 }}>{activeCount}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1 }}>ACTIVE</div>
        </div>
        {isLive && (
          <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C8FF00', lineHeight: 1 }}>{eventsPerMin}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1 }}>EVT/MIN</div>
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: 3 }}>
        {SECTIONS.map(function(s) {
          var active = section === s[0];
          return (
            <button key={s[0]} onClick={function() { setSection(s[0]); }}
              style={{ flex: 1, padding: '7px 0', background: active ? 'rgba(0,201,167,.12)' : 'transparent', border: 'none', borderRadius: 6, color: active ? '#00C9A7' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
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
              <div key={r.id} style={{ background: r.enabled ? 'rgba(0,201,167,.04)' : 'rgba(22,16,32,.5)', border: '1px solid ' + (r.enabled ? 'rgba(0,201,167,.2)' : '#241C34'), borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: r.enabled ? 'rgba(0,201,167,.1)' : 'rgba(22,16,32,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {r.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: r.enabled ? '#EDE8F5' : '#7A6F90' }}>{r.label}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: r.enabled ? '#00C9A7' : '#3D3450', letterSpacing: 1 }}>{r.enabled ? 'ACTIVE' : 'DISABLED'}</div>
                </div>
                <div
                  onClick={function() { toggleRule(r.id); }}
                  style={{ width: 36, height: 20, borderRadius: 999, background: r.enabled ? 'rgba(0,201,167,.7)' : '#241C34', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: r.enabled ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: r.enabled ? '#07050A' : '#7A6F90', transition: 'left .18s' }} />
                </div>
              </div>
            );
          })}

          {/* Manual message sender */}
          <div style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px', marginTop: 4 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', marginBottom: 7, letterSpacing: 2 }}>MANUAL BOT MESSAGE</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={manualMsg}
                onChange={function(e) { setManualMsg(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') sendManual(); }}
                placeholder="Broadcast a bot message to chat..."
                style={{ flex: 1, background: '#07050A', border: '1px solid #241C34', borderRadius: 7, padding: '7px 10px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
              />
              <button
                onClick={sendManual}
                disabled={sending || !manualMsg.trim()}
                style={{ background: 'rgba(0,201,167,.15)', border: '1px solid rgba(0,201,167,.35)', borderRadius: 7, padding: '7px 14px', color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: sending || !manualMsg.trim() ? 'not-allowed' : 'pointer', opacity: sending || !manualMsg.trim() ? 0.5 : 1, letterSpacing: 1 }}>
                SEND
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TRIGGERS ── */}
      {section === 'triggers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 1 }}>
            Chat keyword → auto-response pairs. Prefix with ! (e.g. !hype)
          </div>

          {triggers.map(function(t) {
            return (
              <div key={t.id} style={{ background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ background: 'rgba(200,255,0,.08)', border: '1px solid rgba(200,255,0,.2)', borderRadius: 4, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C8FF00', flexShrink: 0 }}>{t.keyword}</div>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={function() { removeTrigger(t.id); }}
                    style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.2)', borderRadius: 5, padding: '3px 8px', color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                    ✕ REMOVE
                  </button>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#9A8FAC', lineHeight: 1.35, wordBreak: 'break-word' }}>{t.response}</div>
              </div>
            );
          })}

          {triggers.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3450' }}>No triggers yet — add one below</div>
          )}

          <button
            onClick={function() { setShowAddTrig(function(v) { return !v; }); }}
            style={{ padding: '9px', background: showAddTrig ? 'rgba(200,255,0,.1)' : 'rgba(22,16,32,.7)', border: '1px dashed ' + (showAddTrig ? 'rgba(200,255,0,.4)' : 'rgba(200,255,0,.2)'), borderRadius: 8, color: showAddTrig ? '#C8FF00' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
            {showAddTrig ? '✕ CANCEL' : '+ ADD TRIGGER'}
          </button>

          {showAddTrig && (
            <div style={{ background: 'rgba(200,255,0,.04)', border: '1px solid rgba(200,255,0,.15)', borderRadius: 10, padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#C8FF00', letterSpacing: 2, marginBottom: 2 }}>NEW KEYWORD TRIGGER</div>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', marginBottom: 3 }}>KEYWORD (starts with !)</div>
                <input
                  value={newKw}
                  onChange={function(e) { setNewKw(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') document.getElementById('sw-new-resp').focus(); }}
                  placeholder="!command"
                  style={{ width: '100%', background: '#07050A', border: '1px solid #241C34', borderRadius: 6, padding: '7px 10px', color: '#EDE8F5', fontFamily: "'DM Mono',monospace", fontSize: 10 }}
                />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', marginBottom: 3 }}>RESPONSE</div>
                <textarea
                  id="sw-new-resp"
                  value={newResp}
                  onChange={function(e) { setNewResp(e.target.value); }}
                  placeholder="Bot response text..."
                  rows={2}
                  style={{ width: '100%', background: '#07050A', border: '1px solid #241C34', borderRadius: 6, padding: '7px 10px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, resize: 'vertical' }}
                />
              </div>
              <button
                onClick={addTrigger}
                style={{ padding: '8px', background: 'rgba(200,255,0,.12)', border: '1px solid rgba(200,255,0,.3)', borderRadius: 7, color: '#C8FF00', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
                ✓ SAVE TRIGGER
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── LOG ── */}
      {section === 'log' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 2 }}>EVENT LOG</div>
            {isLive && botLogs.length === 0 && (
              <div style={{ background: 'rgba(200,255,0,.08)', border: '1px solid rgba(200,255,0,.2)', borderRadius: 999, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C8FF00', letterSpacing: 1 }}>● SIM</div>
            )}
          </div>
          <div style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '8px', height: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {isLive && botLogs.length === 0 && simLog.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3450' }}>
                Waiting for events...
              </div>
            )}
            {!isLive && botLogs.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3450' }}>
                Waiting for events...
              </div>
            )}
            {isLive && botLogs.length === 0 && simLog.length > 0 && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C8FF00', letterSpacing: 1, padding: '3px 7px', marginBottom: 2 }}>
                ● SIM MODE — no live socket events
              </div>
            )}
            {displayLogs.map(function(log) {
              return (
                <div key={log.id || Math.random()} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '5px 7px', background: 'rgba(22,16,32,.5)', borderRadius: 6, borderLeft: '2px solid rgba(0,201,167,.25)' }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#3D3450', flexShrink: 0, marginTop: 2 }}>{formatTime(log.ts)}</span>
                  <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1.1 }}>{getLogIcon(log.event)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#00C9A7', textTransform: 'uppercase', letterSpacing: 1 }}>{log.event || 'event'}</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#9A8FAC', wordBreak: 'break-word' }}>{log.message || ''}</div>
                  </div>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>

          {/* Aura AI stat strip */}
          <div style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 2, marginBottom: 8 }}>AURA AI STATUS</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                ['MODEL',    'claude-sonnet-4'],
                ['RATE',     '1 / 8s'],
                ['MESSAGES', String(botLogs.filter(function(l) {
                  return l.event === 'viewer_join' || l.event === 'gift_received' || l.event === 'new_subscription';
                }).length)]
              ].map(function(item) {
                return (
                  <div key={item[0]} style={{ flex: 1, background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 7, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1, marginBottom: 2 }}>{item[0]}</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#EDE8F5' }}>{item[1]}</div>
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
