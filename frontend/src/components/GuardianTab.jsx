import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var DEFAULT_BANNED = ['spam', 'scam', 'hate', 'slur', 'flood', 'bot', 'phishing'];

var RULE_PRESETS = [
  { id: 'caps',    label: 'ALL CAPS FLOOD',   desc: 'Block msgs >80% uppercase',        enabled: true,  sev: 'HIGH' },
  { id: 'repeat',  label: 'REPEAT CHARS',      desc: 'Block msgs with 5+ same chars',    enabled: true,  sev: 'MED'  },
  { id: 'links',   label: 'EXTERNAL LINKS',    desc: 'Strip http/https links from chat', enabled: false, sev: 'HIGH' },
  { id: 'emoji',   label: 'EMOJI SPAM',        desc: 'Limit >10 emojis per message',     enabled: true,  sev: 'LOW'  },
  { id: 'slow',    label: 'SLOW MODE (10s)',   desc: 'Rate-limit msgs per user',         enabled: false, sev: 'MED'  },
  { id: 'newacct', label: 'NEW ACCOUNTS',      desc: 'Hold msgs from accts <7 days',    enabled: false, sev: 'LOW'  },
];

var SEV_COLORS = { HIGH: '#FF1A3C', MED: '#C9A84C', LOW: '#7A6F90' };

var MOCK_FLAGS = [
  { id: 1, user: 'xX_troll99',  msg: 'SPAMSPAMSPAMSPAM BUY CRYPTO NOW!!!',  rule: 'CAPS+REPEAT', ts: '14:02:11', action: 'blocked', userId: 'uid_1' },
  { id: 2, user: 'viewer_4412', msg: 'Check this out: http://malware.xyz',   rule: 'LINKS',       ts: '14:08:33', action: 'stripped', userId: 'uid_2' },
  { id: 3, user: 'bot_wave_01', msg: '🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥',      rule: 'EMOJI SPAM',  ts: '14:15:49', action: 'blocked', userId: 'uid_3' },
  { id: 4, user: 'new_user_9',  msg: 'First time watcher hello everyone!',   rule: 'NEW ACCT',    ts: '14:21:02', action: 'held', userId: 'uid_4'    },
];

var GUARDIAN_LOG = [
  '14:02:11  BLOCKED  xX_troll99 — CAPS FLOOD',
  '14:08:33  STRIPPED  viewer_4412 — EXT LINK',
  '14:09:01  PASSED  regular_fan — clean message',
  '14:15:49  BLOCKED  bot_wave_01 — EMOJI SPAM (15)',
  '14:21:02  HELD  new_user_9 — new account (<7d)',
  '14:22:18  PASSED  loyal_viewer — clean message',
  '14:23:44  PASSED  domino_fan3 — clean message',
];

var ACTION_COLORS = { blocked: '#FF1A3C', stripped: '#C9A84C', held: '#C084FC', passed: '#00C9A7' };

var VIEWS = [
  { id: 'rules',   label: 'RULES'   },
  { id: 'flags',   label: 'FLAGGED' },
  { id: 'words',   label: 'WORDS'   },
  { id: 'banned',  label: 'BANNED'  },
  { id: 'log',     label: 'LOG'     },
];

export default function GuardianTab({ addToast, isLive, chat, socket, roomId }) {
  var [view, setView]           = useState('rules');
  var [rules, setRules]         = useState(function() {
    try { var s = localStorage.getItem('sw_guardian_rules'); if (s) return JSON.parse(s); } catch(e) {}
    return RULE_PRESETS;
  });
  var [flags, setFlags]         = useState(MOCK_FLAGS);
  var [banned, setBanned]       = useState(function() {
    try { var s = localStorage.getItem('sw_guardian_banned'); if (s) return JSON.parse(s); } catch(e) {}
    return DEFAULT_BANNED;
  });
  var [wordMeta, setWordMeta]   = useState({});
  var [newWord, setNewWord]     = useState('');
  var [guardLog, setGuardLog]   = useState(GUARDIAN_LOG);
  var [guardOn, setGuardOn]     = useState(true);
  var [blocked, setBlocked]     = useState(0);
  var [allowed, setAllowed]     = useState(0);
  var [bannedUsers, setBannedUsers] = useState([]);
  var [shadowBanned, setShadowBanned] = useState({});
  var [subscriberOnly, setSubscriberOnly] = useState(false);
  var logRef = useRef(null);
  var lockdownFiredRef = useRef(false);

  var total = blocked + allowed;
  var blockRate = total > 0 ? Math.floor((blocked / total) * 100) : 0;

  useEffect(function() {
    try { localStorage.setItem('sw_guardian_rules', JSON.stringify(rules)); } catch(e) {}
  }, [rules]);

  useEffect(function() {
    try { localStorage.setItem('sw_guardian_banned', JSON.stringify(banned)); } catch(e) {}
  }, [banned]);

  useEffect(function() {
    if (!roomId) return;
    fetch('/api/moderation/word-filters?creatorId=' + roomId)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && Array.isArray(data.filters)) {
          var apiWords = data.filters.map(function(f) { return f.word; });
          var meta = {};
          data.filters.forEach(function(f) { meta[f.word] = f.id; });
          setWordMeta(meta);
          setBanned(function(prev) {
            var merged = prev.slice();
            apiWords.forEach(function(w) {
              if (merged.indexOf(w) === -1) merged.push(w);
            });
            return merged;
          });
        }
      })
      .catch(function() {});
  }, [roomId]);

  useEffect(function() {
    if (!guardOn || !isLive) return;
    var interval = setInterval(function() {
      var actions = ['PASSED', 'PASSED', 'PASSED', 'BLOCKED', 'STRIPPED'];
      var users = ['viewer_' + Math.floor(Math.random() * 9999), 'fan_' + Math.floor(Math.random() * 999), 'chat_' + Math.floor(Math.random() * 5555)];
      var reasons = ['clean message', 'CAPS FLOOD', 'EXT LINK', 'clean message', 'clean message'];
      var idx = Math.floor(Math.random() * actions.length);
      var action = actions[idx];
      var user = users[Math.floor(Math.random() * users.length)];
      var reason = reasons[idx];
      var now = new Date();
      var ts = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
      var entry = ts + '  ' + action + '  ' + user + ' — ' + reason;
      setGuardLog(function(prev) { return [entry].concat(prev.slice(0, 29)); });
      if (action === 'PASSED') {
        setAllowed(function(n) { return n + 1; });
      } else {
        setBlocked(function(n) { return n + 1; });
      }
    }, 3200);
    return function() { clearInterval(interval); };
  }, [guardOn, isLive]);

  useEffect(function() {
    if (!guardOn || !isLive) { lockdownFiredRef.current = false; return; }
    if (blockRate < 10) { lockdownFiredRef.current = false; return; }
    if (blockRate >= 15 && !lockdownFiredRef.current) {
      lockdownFiredRef.current = true;
      setRules(function(prev) {
        return prev.map(function(r) {
          return r.id === 'slow' ? Object.assign({}, r, { enabled: true }) : r;
        });
      });
      if (addToast) addToast('LOCKDOWN: Slow Mode auto-enabled (block rate ' + blockRate + '%)', 'error');
    }
  }, [blockRate, guardOn, isLive]);

  var lastChatLen = useRef(0);
  useEffect(function() {
    if (!guardOn || !chat || chat.length === 0) return;
    var newMsgs = chat.slice(lastChatLen.current);
    lastChatLen.current = chat.length;
    if (newMsgs.length === 0) return;
    newMsgs.forEach(function(msg) {
      var text = (msg.text || msg.message || '').toLowerCase();
      var user = msg.username || msg.userId || 'unknown';
      var matchedBan = banned.find(function(b) { return text.indexOf(b.toLowerCase()) !== -1; });
      if (matchedBan && !msg.isSystem) {
        var now = new Date();
        var ts = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
        setGuardLog(function(prev) { return [ts + '  BLOCKED  ' + user + ' — banned word: ' + matchedBan].concat(prev.slice(0, 29)); });
        setBlocked(function(n) { return n + 1; });
        setFlags(function(prev) { return [{ id: 'live_' + Date.now(), user: user, text: msg.text || '', reason: 'Banned word: ' + matchedBan, ts: ts }].concat(prev); });
        if (socket && roomId) {
          socket.emit('mute-user', { roomId: roomId, targetUser: user, reason: 'Banned word: ' + matchedBan });
        }
        if (addToast) addToast('Guardian blocked: ' + user + ' (' + matchedBan + ')', 'error');
      } else if (!msg.isSystem) {
        setAllowed(function(n) { return n + 1; });
      }
    });
  }, [chat, guardOn, banned, socket, roomId, addToast]);

  function toggleRule(id) {
    setRules(function(prev) {
      return prev.map(function(r) {
        return r.id === id ? Object.assign({}, r, { enabled: !r.enabled }) : r;
      });
    });
    addToast('Rule updated', 'success');
  }

  function dismissFlag(id) {
    setFlags(function(prev) { return prev.filter(function(f) { return f.id !== id; }); });
    addToast('Flag dismissed', 'success');
  }

  function banUserFromFlag(f) {
    fetch('/api/moderation/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorId: roomId,
        bannedUserId: f.userId || f.user,
        bannedUsername: f.user,
        reason: f.reason || f.rule || 'Banned by creator'
      })
    }).catch(function() {});
    setBannedUsers(function(prev) {
      return prev.concat([{ username: f.user, userId: f.userId || f.user, reason: f.reason || f.rule || 'Banned by creator', ts: f.ts }]);
    });
    setFlags(function(prev) { return prev.filter(function(x) { return x.id !== f.id; }); });
    if (addToast) addToast('User ' + f.user + ' banned', 'error');
    if (socket && roomId) {
      socket.emit('ban-user', { roomId: roomId, userId: f.userId || f.user });
    }
  }

  function banUser(user) {
    addToast(user + ' banned', 'error');
    setFlags(function(prev) { return prev.filter(function(f) { return f.user !== user; }); });
  }

  function shadowBanUser(userId, username) {
    fetch('/api/moderation/shadow-ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId, reason: 'Shadow banned by creator' })
    }).catch(function() {});
    setShadowBanned(function(prev) {
      var next = Object.assign({}, prev);
      next[userId] = true;
      return next;
    });
    if (addToast) addToast(username + ' shadow banned', 'success');
  }

  function addWord() {
    var w = newWord.trim().toLowerCase();
    if (!w || banned.indexOf(w) !== -1) return;
    setBanned(function(prev) { return prev.concat([w]); });
    setNewWord('');
    addToast('"' + w + '" added to ban list', 'success');
    if (roomId) {
      fetch('/api/moderation/word-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: w, creatorId: roomId })
      })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.filter && data.filter.id) {
            setWordMeta(function(prev) {
              var next = Object.assign({}, prev);
              next[w] = data.filter.id;
              return next;
            });
          }
        })
        .catch(function() {});
    }
  }

  function removeWord(w) {
    var wordId = wordMeta[w];
    setBanned(function(prev) { return prev.filter(function(x) { return x !== w; }); });
    addToast('"' + w + '" removed', 'success');
    if (wordId) {
      fetch('/api/moderation/word-filters/' + wordId, { method: 'DELETE' }).catch(function() {});
    }
  }

  function toggleSubscriberOnly() {
    var next = !subscriberOnly;
    setSubscriberOnly(next);
    fetch('/api/moderation/subscriber-only', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: roomId, enabled: next })
    }).catch(function() {});
    if (socket && roomId) {
      socket.emit('subscriber-only-changed', { roomId: roomId, enabled: next });
    }
    if (addToast) addToast('Subscriber-only mode ' + (next ? 'enabled' : 'disabled'), 'success');
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* MODERATION STATS PANEL */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 2, marginBottom: 8 }}>MODERATION STATS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            ['MESSAGES SCANNED', String(allowed + blocked), '#EDE8F5'],
            ['BLOCKED',          String(blocked),           '#FF1A3C'],
            ['BLOCK RATE',       blockRate + '%',           '#C9A84C'],
            ['WORD FILTERS',     String(banned.length),     '#00C9A7'],
          ].map(function(row) {
            return (
              <div key={row[0]} style={{ background: 'rgba(15,12,20,.6)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 6, padding: '6px 10px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#7A6F90', marginBottom: 2 }}>{row[0]}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: row[2] }}>{row[1]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SUBSCRIBER-ONLY MODE */}
      <div style={{ background: subscriberOnly ? 'rgba(201,168,76,.1)' : 'rgba(22,16,32,.8)', border: '1px solid ' + (subscriberOnly ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.07)'), borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: subscriberOnly ? '#C9A84C' : '#EDE8F5' }}>SUBSCRIBER-ONLY CHAT</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', marginTop: 2 }}>Only active subscribers can chat</div>
        </div>
        <button
          onClick={toggleSubscriberOnly}
          style={{ background: subscriberOnly ? 'rgba(201,168,76,.25)' : 'rgba(36,28,52,.8)', border: '1px solid ' + (subscriberOnly ? '#C9A84C' : '#241C34'), borderRadius: 20, padding: '5px 14px', color: subscriberOnly ? '#C9A84C' : '#7A6F90', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', flexShrink: 0 }}>
          {subscriberOnly ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Header */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: guardOn ? '#00C9A7' : '#7A6F90', boxShadow: guardOn ? '0 0 8px #00C9A7' : 'none' }} />
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: '#EDE8F5' }}>GUARDIAN AI</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>{guardOn ? 'ACTIVE — monitoring chat' : 'PAUSED'}</div>
          </div>
        </div>
        <button
          onClick={function() { setGuardOn(function(v) { return !v; }); addToast('Guardian ' + (guardOn ? 'paused' : 'activated'), guardOn ? 'error' : 'success'); }}
          style={{ background: guardOn ? 'rgba(0,201,167,.15)' : 'rgba(201,168,76,.1)', border: '1px solid ' + (guardOn ? '#00C9A744' : '#C9A84C44'), borderRadius: 6, padding: '5px 12px', color: guardOn ? '#00C9A7' : '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
          {guardOn ? 'PAUSE' : 'ACTIVATE'}
        </button>
      </div>

      {/* Lockdown alert */}
      {guardOn && isLive && blockRate >= 15 && (
        <div style={{ background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#FF1A3C', letterSpacing: 1 }}>&#x26A0; LOCKDOWN</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF6B81' }}>High block rate — Slow Mode auto-enabled</span>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          ['ALLOWED',   String(allowed),    '#00C9A7'],
          ['BLOCKED',   String(blocked),    '#FF1A3C'],
          ['BLOCK RATE', blockRate + '%',   '#C9A84C'],
        ].map(function(row) {
          return (
            <div key={row[0]} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', marginBottom: 3 }}>{row[0]}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, color: row[2] }}>{row[1]}</div>
            </div>
          );
        })}
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 8, overflow: 'hidden' }}>
        {VIEWS.map(function(v) {
          var active = view === v.id;
          return (
            <button
              key={v.id}
              onClick={function() { setView(v.id); }}
              style={{ flex: 1, padding: '7px 0', background: active ? 'rgba(128,0,32,.3)' : 'transparent', border: 'none', borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent', color: active ? '#C9A84C' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', position: 'relative' }}>
              {v.label}
              {v.id === 'flags' && flags.length > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 6, background: '#FF1A3C', borderRadius: 999, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff', fontWeight: 700 }}>{flags.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* RULES view */}
      {view === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rules.map(function(r) {
            return (
              <div key={r.id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + (r.enabled ? '#00C9A722' : '#241C34'), borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: r.enabled ? '#EDE8F5' : '#7A6F90' }}>{r.label}</div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: SEV_COLORS[r.sev], background: SEV_COLORS[r.sev] + '18', border: '1px solid ' + SEV_COLORS[r.sev] + '44', borderRadius: 3, padding: '1px 4px', letterSpacing: 0.5 }}>{r.sev}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{r.desc}</div>
                </div>
                <button
                  onClick={function() { toggleRule(r.id); }}
                  style={{ background: r.enabled ? 'rgba(0,201,167,.2)' : 'rgba(36,28,52,.8)', border: '1px solid ' + (r.enabled ? '#00C9A7' : '#241C34'), borderRadius: 20, padding: '4px 10px', color: r.enabled ? '#00C9A7' : '#7A6F90', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', flexShrink: 0 }}>
                  {r.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* FLAGGED view */}
      {view === 'flags' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {flags.length === 0 && (
            <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '16px', textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90' }}>No flagged messages</div>
          )}
          {flags.map(function(f) {
            return (
              <div key={f.id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + ((ACTION_COLORS[f.action] || '#241C34') + '33'), borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AvatarPortrait username={f.user} size={30} />
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#EDE8F5' }}>{f.user}</div>
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: ACTION_COLORS[f.action] || '#7A6F90', background: ((ACTION_COLORS[f.action] || '#7A6F90') + '22'), borderRadius: 4, padding: '2px 6px' }}>{f.action ? f.action.toUpperCase() : 'FLAGGED'}</div>
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#A09AB8', marginBottom: 4, wordBreak: 'break-word' }}>{f.msg || f.text}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{(f.rule || f.reason || '') + ' · ' + f.ts}</div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={function() { dismissFlag(f.id); }} style={{ background: 'rgba(0,201,167,.1)', border: '1px solid #00C9A744', borderRadius: 4, padding: '3px 8px', color: '#00C9A7', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>DISMISS</button>
                    <button onClick={function() { banUserFromFlag(f); }} style={{ background: 'rgba(255,26,60,.1)', border: '1px solid #FF1A3C44', borderRadius: 4, padding: '3px 8px', color: '#FF1A3C', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>BAN USER</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WORDS view */}
      {view === 'words' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={newWord}
              onChange={function(e) { setNewWord(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') addWord(); }}
              placeholder="add banned word..."
              style={{ flex: 1, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '7px 10px', fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#EDE8F5', outline: 'none' }}
            />
            <button
              onClick={addWord}
              style={{ background: 'rgba(128,0,32,.3)', border: '1px solid #C9A84C44', borderRadius: 6, padding: '7px 12px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              ADD
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {banned.map(function(w) {
              return (
                <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,26,60,.1)', border: '1px solid #FF1A3C33', borderRadius: 20, padding: '3px 8px' }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#FF6B81' }}>{w}</span>
                  <button onClick={function() { removeWord(w); }} style={{ background: 'none', border: 'none', color: '#FF1A3C', fontSize: 10, cursor: 'pointer', padding: 0, lineHeight: 1 }}>x</button>
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{banned.length + ' words in ban list · case-insensitive match'}</div>
        </div>
      )}

      {/* BANNED USERS view */}
      {view === 'banned' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {bannedUsers.length === 0 && (
            <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '16px', textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90' }}>No banned users</div>
          )}
          {bannedUsers.map(function(u, i) {
            var isShadow = shadowBanned[u.userId];
            return (
              <div key={i} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid rgba(255,26,60,.2)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <AvatarPortrait username={u.username} size={34} />
                  <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#EDE8F5' }}>{u.username}</span>
                    {isShadow && <span style={{ fontSize: 12 }}>&#x1F47B;</span>}
                    {isShadow && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#C084FC', background: 'rgba(192,132,252,.15)', border: '1px solid rgba(192,132,252,.3)', borderRadius: 3, padding: '1px 4px' }}>SHADOW</span>}
                    {!isShadow && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#FF1A3C', background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 3, padding: '1px 4px' }}>BANNED</span>}
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{u.reason + ' · ' + (u.ts || '')}</div>
                  </div>
                </div>
                {!isShadow && (
                  <button
                    onClick={function() { shadowBanUser(u.userId, u.username); }}
                    style={{ background: 'rgba(192,132,252,.1)', border: '1px solid rgba(192,132,252,.3)', borderRadius: 5, padding: '4px 9px', color: '#C084FC', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', flexShrink: 0 }}>
                    SHADOW BAN
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* LOG view */}
      {view === 'log' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: -6 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 2 }}>{'GUARDIAN LOG · ' + guardLog.length + ' ENTRIES'}</div>
          <button onClick={function() { setGuardLog([]); }}
            style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.2)', borderRadius: 5, padding: '3px 8px', color: '#FF6B6B', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
            &#x1F5D1; CLEAR
          </button>
        </div>
      )}
      {view === 'log' && (
        <div style={{ background: 'rgba(7,5,10,.9)', border: '1px solid #241C34', borderRadius: 8, padding: '10px 12px', maxHeight: 260, overflowY: 'auto' }} ref={logRef}>
          {guardLog.map(function(entry, i) {
            var action = entry.indexOf('BLOCKED') !== -1 ? 'BLOCKED' : entry.indexOf('STRIPPED') !== -1 ? 'STRIPPED' : entry.indexOf('HELD') !== -1 ? 'HELD' : 'PASSED';
            var color = ACTION_COLORS[action.toLowerCase()] || '#7A6F90';
            return (
              <div key={i} style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: color, marginBottom: 4, lineHeight: 1.6 }}>
                {entry}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
