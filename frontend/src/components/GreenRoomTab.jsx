import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var CREATOR  = 0.90;
var PLATFORM = 0.10;

var ROLE_COLORS = {
  host:    '#C9A84C',
  cohost:  '#C9A84C',
  'co-host': '#C9A84C',
  guest:   '#C9A84C',
  viewer:  'rgba(176,160,192,.5)'
};
var ROLE_BG = {
  host:    'rgba(201,168,76,.18)',
  cohost:  'rgba(201,168,76,.15)',
  'co-host': 'rgba(201,168,76,.15)',
  guest:   'rgba(212,133,74,.15)',
  viewer:  'rgba(26,21,16,.6)'
};

function RoleBadge({ role }) {
  var r  = role || 'viewer';
  var rc = ROLE_COLORS[r] || ROLE_COLORS.viewer;
  var bg = ROLE_BG[r]     || ROLE_BG.viewer;
  return (
    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: rc, background: bg, border: '1px solid ' + rc + '44', borderRadius: 3, padding: '1px 5px', letterSpacing: 1, textTransform: 'uppercase', flexShrink: 0 }}>
      {r}
    </span>
  );
}

export default function GreenRoomTab({ guests, addToast, socket, roomId, userId, role, isLive }) {
  var [section,        setSection]        = useState('roster');
  var [banned,         setBanned]         = useState(['TrollUser99', 'SpamBot_001']);
  var [newBan,         setNewBan]         = useState('');
  var [handQueue,      setHandQueue]      = useState([]);
  var [stageList,      setStageList]      = useState([userId || '']);
  var [showNotes,      setShowNotes]      = useState('WELCOME VIEWERS!\n\n---\n[0:00] Intro + housekeeping\n[5:00] Domino match begins\n[45:00] Halftime break + gifts\n[60:00] Final match\n[90:00] Prize + wrap-up\n');
  var [segments,       setSegments]       = useState([
    { id: 'sg1', time: '0:00',  title: 'Intro + housekeeping',      done: true  },
    { id: 'sg2', time: '5:00',  title: 'Match 1 begins',            done: true  },
    { id: 'sg3', time: '45:00', title: 'Halftime break',            done: false },
    { id: 'sg4', time: '60:00', title: 'Finals match',              done: false },
    { id: 'sg5', time: '90:00', title: 'Prize ceremony + wrap-up',  done: false },
  ]);
  var [newSegTime,     setNewSegTime]     = useState('');
  var [newSegTitle,    setNewSegTitle]    = useState('');
  var [audioOnly,      setAudioOnly]      = useState(false);
  var [privateRoom,    setPrivateRoom]    = useState(false);
  var [paywallOn,      setPaywallOn]      = useState(false);
  var [paywallCents,   setPaywallCents]   = useState(500);
  var [paywallInput,   setPaywallInput]   = useState('5.00');
  var [streamTitle,    setStreamTitle]    = useState('Washington Classic LIVE 🎲');
  var [streamCategory, setStreamCategory] = useState('Domino');
  var [streamDesc,     setStreamDesc]     = useState('');
  var [cohostToken,    setCohostToken]    = useState('');
  var [modRules,       setModRules]       = useState({
    spamBurst:   true,
    toxicity:    true,
    linkBlocking: true,
    allCaps:     false,
  });

  var isHost = role === 'host';

  var roster = guests && guests.length > 0 ? guests : [
    { userId: 'demo1', username: 'SwanyThree',  role: 'host'  },
    { userId: 'demo2', username: 'DJ_Cipher',   role: 'cohost'},
    { userId: 'demo3', username: 'CaliBonesOG', role: 'guest' },
  ];

  useEffect(function() {
    if (!socket) return;

    function onHandRaise(data) {
      if (!data || !data.guestId) return;
      setHandQueue(function(q) {
        var already = false;
        for (var i = 0; i < q.length; i++) { if (q[i].guestId === data.guestId) { already = true; break; } }
        if (already) return q;
        return q.concat([{ guestId: data.guestId, username: data.username || data.guestId, ts: data.ts || Math.floor(Date.now() / 1000) }]);
      });
    }

    function onStageInvite(data) {
      if (!data || !data.guestId) return;
      setStageList(function(s) {
        if (s.indexOf(data.guestId) >= 0) return s;
        return s.concat([data.guestId]);
      });
      setHandQueue(function(q) { return q.filter(function(x) { return x.guestId !== data.guestId; }); });
    }

    function onStageRemove(data) {
      if (!data || !data.guestId) return;
      setStageList(function(s) { return s.filter(function(x) { return x !== data.guestId; }); });
    }

    function onGuestMuted(data) {
      if (!data || !data.guestId) return;
      // Reflect mute badge in local state (guests state is owned by App)
    }

    function onGuestUnmuted(data) {
      if (!data || !data.guestId) return;
    }

    function onGuestKicked(data) {
      if (!data || !data.guestId) return;
      setStageList(function(s) { return s.filter(function(x) { return x !== data.guestId; }); });
      setHandQueue(function(q) { return q.filter(function(x) { return x.guestId !== data.guestId; }); });
    }

    socket.on('hand-raise',    onHandRaise);
    socket.on('stage-invite',  onStageInvite);
    socket.on('stage-remove',  onStageRemove);
    socket.on('guest-muted',   onGuestMuted);
    socket.on('guest-unmuted', onGuestUnmuted);
    socket.on('guest-kicked',  onGuestKicked);

    return function() {
      socket.off('hand-raise',    onHandRaise);
      socket.off('stage-invite',  onStageInvite);
      socket.off('stage-remove',  onStageRemove);
      socket.off('guest-muted',   onGuestMuted);
      socket.off('guest-unmuted', onGuestUnmuted);
      socket.off('guest-kicked',  onGuestKicked);
    };
  }, [socket]);

  function muteGuest(gid) {
    if (!socket || !isHost) return;
    socket.emit('mute-guest', { roomId: roomId, guestId: gid });
    if (addToast) addToast('Guest muted', 'info');
  }

  function unmuteGuest(gid) {
    if (!socket || !isHost) return;
    socket.emit('unmute-guest', { roomId: roomId, guestId: gid });
    if (addToast) addToast('Guest unmuted', 'info');
  }

  function kickGuest(gid, name) {
    if (!socket || !isHost) return;
    socket.emit('kick-guest', { roomId: roomId, guestId: gid });
    if (addToast) addToast('Kicked: ' + (name || gid), 'info');
  }

  function promoteGuest(gid, newRole) {
    if (!socket || !isHost) return;
    socket.emit('promote-guest', { roomId: roomId, guestId: gid, role: newRole });
    if (addToast) addToast('Role → ' + newRole, 'info');
  }

  function inviteToStage(gid) {
    if (!socket) return;
    if (stageList.length >= 6) { if (addToast) addToast('Stage full — max 6 participants', 'error'); return; }
    socket.emit('stage-invite', { roomId: roomId, guestId: gid });
    setHandQueue(function(q) { return q.filter(function(x) { return x.guestId !== gid; }); });
  }

  function removeFromStage(gid) {
    if (!socket) return;
    socket.emit('stage-remove', { roomId: roomId, guestId: gid });
  }

  function addBan() {
    var u = newBan.trim();
    if (!u) return;
    for (var i = 0; i < banned.length; i++) { if (banned[i] === u) return; }
    setBanned(function(p) { return p.concat([u]); });
    setNewBan('');
    if (socket) socket.emit('ban-user', { roomId: roomId, username: u });
    if (addToast) addToast('Banned: ' + u, 'info');
  }

  function removeBan(u) {
    setBanned(function(p) { return p.filter(function(x) { return x !== u; }); });
    if (socket) socket.emit('unban-user', { roomId: roomId, username: u });
    if (addToast) addToast('Unbanned: ' + u, 'info');
  }

  function toggleModRule(key) {
    setModRules(function(prev) {
      var next = Object.assign({}, prev);
      next[key] = !prev[key];
      if (socket) socket.emit('mod-rules', { roomId: roomId, rules: next });
      if (addToast) addToast('Mod rule ' + key + (next[key] ? ' ON' : ' OFF'), 'info');
      return next;
    });
  }

  function addSegment() {
    if (!newSegTitle.trim()) return;
    var seg = { id: 'sg' + Date.now(), time: newSegTime.trim() || '?', title: newSegTitle.trim(), done: false };
    setSegments(function(p) { return p.concat([seg]); });
    setNewSegTime('');
    setNewSegTitle('');
    if (addToast) addToast('Segment added: ' + seg.title, 'success');
  }

  function toggleSegDone(id) {
    setSegments(function(p) {
      return p.map(function(s) { return s.id === id ? Object.assign({}, s, { done: !s.done }) : s; });
    });
  }

  function removeSegment(id) {
    setSegments(function(p) { return p.filter(function(s) { return s.id !== id; }); });
  }

  function toggleAudioOnly() {
    var next = !audioOnly;
    setAudioOnly(next);
    if (socket) socket.emit('room-audio-only', { roomId: roomId, audioOnly: next });
    if (addToast) addToast(next ? '🎙️ Audio-only mode ON — video feeds hidden' : '📹 Video restored', next ? 'info' : 'success');
  }

  function togglePrivateRoom() {
    var next = !privateRoom;
    setPrivateRoom(next);
    if (socket) socket.emit('room-private', { roomId: roomId, privateRoom: next });
    if (addToast) addToast(next ? '🔒 Room locked — invite only' : '🔓 Room unlocked — public access', next ? 'info' : 'success');
  }

  function togglePaywall() {
    var next = !paywallOn;
    setPaywallOn(next);
    if (socket) socket.emit('room-paywall', { roomId: roomId, paywallEnabled: next, amountCents: paywallCents });
    if (addToast) addToast(next ? '💰 Paywall ON — $' + (Math.floor(paywallCents) / 100).toFixed(2) + ' entry' : '🚪 Paywall removed', next ? 'info' : 'success');
  }

  function savePaywallAmount() {
    var parsed = parseFloat(paywallInput);
    if (isNaN(parsed) || parsed < 0) { if (addToast) addToast('Invalid amount', 'error'); return; }
    var cents = Math.floor(parsed * 100);
    setPaywallCents(cents);
    setPaywallInput((Math.floor(cents) / 100).toFixed(2));
    if (paywallOn && socket) socket.emit('room-paywall', { roomId: roomId, paywallEnabled: true, amountCents: cents });
    if (addToast) addToast('Paywall price set: $' + (Math.floor(cents) / 100).toFixed(2), 'success');
  }

  var CATS = ['Domino', 'Tournament', 'Podcast', 'Watch Party', 'Music', 'Talk'];

  function saveStreamInfo() {
    if (socket) socket.emit('stream-info', { roomId: roomId, title: streamTitle.trim(), category: streamCategory, desc: streamDesc.trim() });
    if (addToast) addToast('Stream info saved', 'success');
  }

  function genCohostLink() {
    var token = Math.floor(Math.random() * 999999999).toString(36) + Date.now().toString(36);
    setCohostToken(token);
    var link = 'https://seewhylive.online/join/' + (roomId || 'live') + '?role=cohost&token=' + token;
    if (navigator.clipboard) { navigator.clipboard.writeText(link).catch(function() {}); }
    if (addToast) addToast('Co-host link copied', 'success');
  }

  var SECTIONS = [
    { id: 'roster',   label: '👥 ROSTER'   },
    { id: 'stage',    label: '🎭 STAGE'    },
    { id: 'guard',    label: '🛡 GUARD'    },
    { id: 'ban',      label: '🚫 BAN'      },
    { id: 'notes',    label: '📋 NOTES'    },
    { id: 'info',     label: '📝 INFO'     },
    { id: 'settings', label: '⚙️ ROOM'     },
  ];

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 450 }}>

      {/* Status badges row */}
      {(audioOnly || privateRoom || paywallOn) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {audioOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(212,133,74,.12)', border: '1px solid rgba(212,133,74,.3)', borderRadius: 999, padding: '3px 10px' }}>
              <span style={{ fontSize: 10 }}>🎙️</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: '#C9A84C', letterSpacing: 1 }}>AUDIO ONLY</span>
            </div>
          )}
          {privateRoom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 999, padding: '3px 10px' }}>
              <span style={{ fontSize: 10 }}>🔒</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: '#C9A84C', letterSpacing: 1 }}>PRIVATE</span>
            </div>
          )}
          {paywallOn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 999, padding: '3px 10px' }}>
              <span style={{ fontSize: 10 }}>💰</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: '#C9A84C', letterSpacing: 1 }}>${(Math.floor(paywallCents) / 100).toFixed(2)} ENTRY</span>
            </div>
          )}
        </div>
      )}

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {SECTIONS.map(function(t) {
          var active = section === t.id;
          var badge  = t.id === 'stage' && handQueue.length > 0;
          var dotOn  = t.id === 'settings' && (audioOnly || privateRoom || paywallOn);
          return (
            <button
              key={t.id}
              onClick={function() { setSection(t.id); }}
              style={{ flex: 1, minWidth: 0, position: 'relative', background: active ? 'rgba(128,0,32,.3)' : 'rgba(26,21,16,.7)', border: '1px solid ' + (active ? '#C01838' : '#3D3020'), borderRadius: 6, padding: '7px 0', color: active ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
              {t.label}
              {badge && (
                <span style={{ position: 'absolute', top: -5, right: -5, width: 15, height: 15, borderRadius: '50%', background: '#FF1A3C', color: '#fff', fontFamily: "'DM Mono',monospace", fontSize: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #07050A' }}>
                  {handQueue.length}
                </span>
              )}
              {dotOn && !badge && (
                <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#C9A84C', border: '1px solid #07050A' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── ROSTER ─────────────────────────────────────────────────────────── */}
      {section === 'roster' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              [roster.length,    'ONLINE',    '#C9A84C', 'rgba(201,168,76,.08)', 'rgba(201,168,76,.25)'],
              [stageList.length, 'ON STAGE',  '#C9A84C', 'rgba(201,168,76,.08)', 'rgba(201,168,76,.25)'],
              [handQueue.length, 'HANDS UP',  '#FF6B81', 'rgba(255,26,60,.08)', 'rgba(255,26,60,.25)'],
            ].map(function(row) {
              return (
                <div key={row[1]} style={{ flex: 1, background: row[3], border: '1px solid ' + row[4], borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 20, color: row[2], lineHeight: 1 }}>{row[0]}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginTop: 2 }}>{row[1]}</div>
                </div>
              );
            })}
          </div>

          {/* Guest rows */}
          {roster.map(function(g) {
            var id        = g.userId || g.guestId;
            var isMuted   = Boolean(g.remoteMuted);
            var isOnStage = stageList.indexOf(id) >= 0;
            var gRole     = g.role || 'viewer';
            var isSelf    = id === userId;
            return (
              <div key={id} style={{ background: 'rgba(26,21,16,.8)', border: '1px solid ' + (isOnStage ? 'rgba(201,168,76,.3)' : '#3D3020'), borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C9A84C', boxShadow: '0 0 5px #C9A84C88', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#F0E8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                        {g.username || id}
                      </span>
                      {isSelf && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>(you)</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                      <RoleBadge role={gRole} />
                      {isOnStage && (
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 3, padding: '1px 5px' }}>STAGE</span>
                      )}
                      {isMuted && (
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', background: 'rgba(255,26,60,.12)', borderRadius: 3, padding: '1px 5px' }}>🔇 MUTED</span>
                      )}
                    </div>
                  </div>

                  {/* Host action buttons */}
                  {isHost && !isSelf && (
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      <button
                        onClick={function() { isMuted ? unmuteGuest(id) : muteGuest(id); }}
                        title={isMuted ? 'Unmute' : 'Mute'}
                        style={{ width: 26, height: 26, borderRadius: 5, background: isMuted ? 'rgba(201,168,76,.2)' : 'rgba(255,26,60,.12)', border: '1px solid ' + (isMuted ? 'rgba(201,168,76,.4)' : 'rgba(255,26,60,.3)'), color: isMuted ? '#C9A84C' : '#FF6B81', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isMuted ? '🔊' : '🔇'}
                      </button>
                      <button
                        onClick={function() { isOnStage ? removeFromStage(id) : inviteToStage(id); }}
                        title={isOnStage ? 'Remove from stage' : 'Add to stage'}
                        style={{ width: 26, height: 26, borderRadius: 5, background: isOnStage ? 'rgba(255,107,53,.15)' : 'rgba(212,133,74,.15)', border: '1px solid ' + (isOnStage ? 'rgba(255,107,53,.4)' : 'rgba(212,133,74,.4)'), color: isOnStage ? '#FF6B35' : '#C9A84C', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
                        {isOnStage ? '↓' : '↑'}
                      </button>
                      <button
                        onClick={function() { kickGuest(id, g.username); }}
                        title="Kick from room"
                        style={{ width: 26, height: 26, borderRadius: 5, background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', color: '#FF1A3C', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Host: promote dropdown */}
                {isHost && !isSelf && gRole !== 'host' && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #3D3020', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', flexShrink: 0 }}>PROMOTE TO:</span>
                    {['cohost', 'guest', 'viewer'].map(function(r) {
                      var active = gRole === r;
                      return (
                        <button
                          key={r}
                          onClick={function() { if (!active) promoteGuest(id, r); }}
                          disabled={active}
                          style={{ padding: '3px 8px', background: active ? (ROLE_BG[r] || 'rgba(26,21,16,.6)') : 'rgba(26,21,16,.4)', border: '1px solid ' + (active ? (ROLE_COLORS[r] || '#8A7A62') + '55' : '#3D3020'), borderRadius: 4, color: active ? (ROLE_COLORS[r] || '#8A7A62') : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: active ? 'default' : 'pointer', opacity: active ? 1 : 0.7 }}>
                          {r.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── STAGE ──────────────────────────────────────────────────────────── */}
      {section === 'stage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Current stage occupants */}
          <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2 }}>STAGE ROSTER</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62' }}>{stageList.length} / 6</div>
            </div>
            {stageList.length === 0 ? (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62', textAlign: 'center', padding: 8 }}>Stage is empty.</div>
            ) : stageList.map(function(gid) {
              var g    = null;
              for (var i = 0; i < roster.length; i++) { if ((roster[i].userId || roster[i].guestId) === gid) { g = roster[i]; break; } }
              var name = g ? (g.username || gid) : gid;
              var isSelf = gid === userId;
              return (
                <div key={gid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #3D3020' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C', boxShadow: '0 0 5px #C9A84C88', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#F0E8D4', flex: 1 }}>{name}</span>
                  {g && <RoleBadge role={g.role || 'guest'} />}
                  {(isHost || isSelf) && gid !== userId && (
                    <button
                      onClick={function() { removeFromStage(gid); }}
                      style={{ background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 5, padding: '3px 9px', color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                      REMOVE
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hand raise queue */}
          <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid ' + (handQueue.length > 0 ? 'rgba(255,26,60,.3)' : '#3D3020'), borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF6B81', letterSpacing: 2 }}>✋ HAND RAISE QUEUE</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: handQueue.length > 0 ? '#FF1A3C' : '#8A7A62' }}>{handQueue.length}</div>
            </div>
            {handQueue.length === 0 ? (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62', textAlign: 'center', padding: 8 }}>No one waiting.</div>
            ) : handQueue.map(function(hq) {
              return (
                <div key={hq.guestId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #3D3020' }}>
                  <div style={{ flexShrink: 0, position: 'relative' }}>
                    <AvatarPortrait username={hq.username} size={36} />
                    <span style={{ position: 'absolute', top: -2, right: -2, fontSize: 10 }}>✋</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#F0E8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {hq.username}
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>
                      {hq.ts ? new Date(hq.ts * 1000).toLocaleTimeString() : 'now'}
                    </div>
                  </div>
                  {isHost && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={function() { inviteToStage(hq.guestId); }}
                        style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 6, padding: '4px 10px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                        INVITE
                      </button>
                      <button
                        onClick={function() { setHandQueue(function(q) { return q.filter(function(x) { return x.guestId !== hq.guestId; }); }); }}
                        style={{ background: 'none', border: '1px solid #3D3020', borderRadius: 6, padding: '4px 8px', color: '#8A7A62', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>
                        DENY
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick-invite from roster (host only) */}
          {isHost && roster.length > 0 && (
            <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 2, marginBottom: 8 }}>QUICK INVITE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {roster.filter(function(g) {
                  var id = g.userId || g.guestId;
                  return id !== userId && stageList.indexOf(id) === -1;
                }).map(function(g) {
                  var id = g.userId || g.guestId;
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flexShrink: 0 }}>
                        <AvatarPortrait username={g.username || id} size={32} />
                      </div>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4', flex: 1 }}>{g.username || id}</span>
                      <button
                        onClick={function() { inviteToStage(id); }}
                        style={{ background: 'rgba(212,133,74,.15)', border: '1px solid rgba(212,133,74,.4)', borderRadius: 5, padding: '3px 10px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>
                        + STAGE
                      </button>
                    </div>
                  );
                })}
                {roster.filter(function(g) {
                  var id = g.userId || g.guestId;
                  return id !== userId && stageList.indexOf(id) === -1;
                }).length === 0 && (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62', textAlign: 'center', padding: 4 }}>All guests are on stage.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── GUARD ──────────────────────────────────────────────────────────── */}
      {section === 'guard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, marginBottom: 12 }}>GUARDIAN AI THRESHOLDS</div>
            {[
              ['FLAG (review)',  50, '#C9A84C'],
              ['MUTE (enforce)', 75, '#FF6B35'],
              ['BAN (enforce)',  95, '#FF1A3C'],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4' }}>{row[0]}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: row[2] }}>{row[1]}%</span>
                  </div>
                  <div style={{ background: '#3D3020', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: row[1] + '%', height: '100%', background: 'linear-gradient(90deg,#C9A84C,' + row[2] + ')', borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {[['12 LANGS', '#C9A84C'], ['ACTIVE', '#C9A84C'], ['claude-haiku', '#800020']].map(function(s) {
                return (
                  <span key={s[0]} style={{ background: s[1] + '18', border: '1px solid ' + s[1] + '44', borderRadius: 999, padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: s[1] }}>
                    {s[0]}
                  </span>
                );
              })}
            </div>
          </div>

          <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 2, marginBottom: 10 }}>AUTO-MODERATION RULES</div>
            {[
              { key: 'spamBurst',    label: 'Spam burst (5 msg / 3s)' },
              { key: 'toxicity',     label: 'Toxicity filter'          },
              { key: 'linkBlocking', label: 'Link blocking'            },
              { key: 'allCaps',      label: 'All-caps throttle'        },
            ].map(function(row) {
              var on = Boolean(modRules[row.key]);
              return (
                <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #3D3020' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: on ? '#C9A84C' : '#8A7A62', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 12, color: '#F0E8D4', flex: 1 }}>{row.label}</span>
                  <button
                    onClick={function() { toggleModRule(row.key); }}
                    style={{ background: on ? 'rgba(201,168,76,.15)' : 'rgba(26,21,16,.5)', border: '1px solid ' + (on ? 'rgba(201,168,76,.4)' : '#3D3020'), borderRadius: 5, padding: '3px 10px', color: on ? '#C9A84C' : '#8A7A62', fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 8, cursor: 'pointer', minWidth: 36 }}>
                    {on ? 'ON' : 'OFF'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BAN ────────────────────────────────────────────────────────────── */}
      {section === 'ban' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newBan}
              onChange={function(e) { setNewBan(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') addBan(); }}
              placeholder="Username to ban..."
              style={{ flex: 1, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 8, padding: '8px 12px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
            />
            <button
              onClick={addBan}
              style={{ background: 'rgba(230,57,70,.15)', border: '1px solid rgba(230,57,70,.4)', borderRadius: 8, padding: '8px 16px', color: '#FF6B81', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              BAN
            </button>
          </div>
          {banned.length === 0 && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62', textAlign: 'center', padding: 16 }}>No banned users.</div>
          )}
          {banned.map(function(u) {
            return (
              <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(26,21,16,.8)', border: '1px solid rgba(255,26,60,.2)', borderRadius: 8, padding: '10px 12px' }}>
                <span style={{ fontSize: 12, color: '#FF1A3C' }}>🚫</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#A09AB8', flex: 1 }}>{u}</span>
                <button
                  onClick={function() { removeBan(u); }}
                  style={{ background: 'none', border: '1px solid #3D3020', borderRadius: 6, padding: '3px 8px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>
                  UNBAN
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── NOTES ──────────────────────────────────────────────────────────── */}
      {section === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Run of show segments */}
          <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2 }}>RUN OF SHOW</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#3D3020' }}>
                {segments.filter(function(s) { return s.done; }).length}/{segments.length} done
              </div>
            </div>

            {segments.map(function(seg) {
              return (
                <div key={seg.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #1A1510' }}>
                  <button onClick={function() { toggleSegDone(seg.id); }}
                    style={{ width: 18, height: 18, borderRadius: 4, background: seg.done ? 'rgba(201,168,76,.2)' : 'rgba(26,21,16,.8)', border: '2px solid ' + (seg.done ? '#C9A84C' : '#3D3020'), flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A84C', fontSize: 10 }}>
                    {seg.done ? '✓' : ''}
                  </button>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', width: 36, flexShrink: 0 }}>{seg.time}</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 12, color: seg.done ? '#3D3020' : '#F0E8D4', flex: 1, textDecoration: seg.done ? 'line-through' : 'none' }}>
                    {seg.title}
                  </span>
                  <button onClick={function() { removeSegment(seg.id); }}
                    style={{ background: 'none', border: 'none', color: '#3D3020', fontSize: 11, cursor: 'pointer', flexShrink: 0, padding: '0 2px' }}>✕</button>
                </div>
              );
            })}

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <input value={newSegTime} onChange={function(e) { setNewSegTime(e.target.value); }} placeholder="0:00"
                style={{ width: 52, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 6, padding: '6px 8px', color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 9, flexShrink: 0 }} />
              <input value={newSegTitle} onChange={function(e) { setNewSegTitle(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') addSegment(); }}
                placeholder="Segment title..."
                style={{ flex: 1, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 6, padding: '6px 10px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11 }} />
              <button onClick={addSegment} style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '6px 12px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>+</button>
            </div>
          </div>

          {/* Freeform show notes */}
          <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 2 }}>SHOW NOTES</div>
              <button onClick={function() {
                if (navigator.clipboard) { navigator.clipboard.writeText(showNotes).catch(function() {}); }
                if (addToast) addToast('Notes copied', 'info');
              }}
                style={{ background: 'none', border: '1px solid #3D3020', borderRadius: 5, padding: '2px 8px', color: '#8A7A62', fontFamily: "'DM Mono',monospace", fontSize: 7.5, cursor: 'pointer' }}>
                📋 COPY
              </button>
            </div>
            <textarea
              value={showNotes}
              onChange={function(e) { setShowNotes(e.target.value); }}
              rows={8}
              style={{ width: '100%', background: 'rgba(14,12,9,.7)', border: '1px solid #3D3020', borderRadius: 8, padding: '10px 12px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}

      {/* ── INFO ───────────────────────────────────────────────────────────── */}
      {section === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Stream metadata card */}
          <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 2, marginBottom: 10 }}>STREAM INFO</div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', marginBottom: 4 }}>TITLE</div>
              <input
                value={streamTitle}
                onChange={function(e) { setStreamTitle(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') saveStreamInfo(); }}
                disabled={!isHost}
                placeholder="Stream title..."
                style={{ width: '100%', background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 7, padding: '8px 11px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, boxSizing: 'border-box', opacity: isHost ? 1 : 0.5 }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', marginBottom: 4 }}>CATEGORY</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {CATS.map(function(cat) {
                  var active = streamCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={function() { if (isHost) setStreamCategory(cat); }}
                      disabled={!isHost}
                      style={{ background: active ? 'rgba(192,24,56,.3)' : 'rgba(26,21,16,.6)', border: '1px solid ' + (active ? '#C01838' : '#3D3020'), borderRadius: 6, padding: '5px 11px', color: active ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: isHost ? 'pointer' : 'default', opacity: isHost ? 1 : 0.5 }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', marginBottom: 4 }}>DESCRIPTION</div>
              <textarea
                value={streamDesc}
                onChange={function(e) { setStreamDesc(e.target.value); }}
                disabled={!isHost}
                rows={3}
                placeholder="Describe this stream for your audience..."
                style={{ width: '100%', background: 'rgba(14,12,9,.7)', border: '1px solid #3D3020', borderRadius: 7, padding: '8px 11px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', opacity: isHost ? 1 : 0.5 }}
              />
            </div>

            {isHost && (
              <button
                onClick={saveStreamInfo}
                style={{ width: '100%', background: 'rgba(128,0,32,.25)', border: '1px solid #C01838', borderRadius: 8, padding: '9px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                SAVE STREAM INFO
              </button>
            )}
          </div>

          {/* Co-host invite link — host only */}
          {isHost && (
            <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, marginBottom: 6 }}>CO-HOST INVITE LINK</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', lineHeight: 1.5, marginBottom: 10 }}>
                One-time link granting co-host privileges. Share privately.
              </div>
              {cohostToken ? (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', background: 'rgba(14,12,9,.8)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 6, padding: '7px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {'seewhylive.online/join/' + (roomId || 'live') + '?role=cohost&token=' + cohostToken}
                    </div>
                    <button
                      onClick={function() {
                        var link = 'https://seewhylive.online/join/' + (roomId || 'live') + '?role=cohost&token=' + cohostToken;
                        if (navigator.clipboard) { navigator.clipboard.writeText(link).catch(function() {}); }
                        if (addToast) addToast('Co-host link copied', 'success');
                      }}
                      style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 6, padding: '6px 12px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>
                      📋 COPY
                    </button>
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C' }} />
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C' }}>Single-use · expires when regenerated</span>
                  </div>
                </div>
              ) : null}
              <button
                onClick={genCohostLink}
                style={{ width: '100%', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 8, padding: '9px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                {cohostToken ? '🔄 REGENERATE LINK' : '🔗 GENERATE CO-HOST LINK'}
              </button>
            </div>
          )}

          {/* Live preview card */}
          <div style={{ background: 'rgba(26,21,16,.5)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 2, marginBottom: 8 }}>LIVE PREVIEW</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              {isLive && (
                <span style={{ background: '#C01838', borderRadius: 4, padding: '2px 7px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: '#fff', letterSpacing: 1 }}>● LIVE</span>
              )}
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#F0E8D4' }}>{streamTitle || 'Untitled stream'}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ background: 'rgba(128,0,32,.2)', border: '1px solid rgba(192,24,56,.3)', borderRadius: 4, padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: '#C9A84C' }}>{streamCategory}</span>
            </div>
            {streamDesc ? (
              <div style={{ marginTop: 8, fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', lineHeight: 1.5 }}>{streamDesc}</div>
            ) : null}
          </div>

        </div>
      )}

      {/* ── SETTINGS ───────────────────────────────────────────────────────── */}
      {section === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 2, marginBottom: -4 }}>ROOM MODE CONTROLS</div>

          {/* Audio-Only Toggle */}
          <div style={{ background: audioOnly ? 'rgba(212,133,74,.08)' : 'rgba(26,21,16,.8)', border: '1px solid ' + (audioOnly ? 'rgba(212,133,74,.4)' : '#3D3020'), borderRadius: 12, padding: '14px 16px', transition: 'border-color .2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>🎙️</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: audioOnly ? '#C9A84C' : '#F0E8D4' }}>Audio-Only Mode</span>
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', lineHeight: 1.5 }}>
                  {audioOnly
                    ? 'All cameras off — waveform / avatar indicators only. Saves bandwidth and battery.'
                    : 'Enable to hide all video feeds. Great for podcast-style streams or low-bandwidth sessions.'}
                </div>
              </div>
              <button
                onClick={toggleAudioOnly}
                style={{ flexShrink: 0, width: 52, height: 28, borderRadius: 14, background: audioOnly ? '#C9A84C' : '#3D3020', border: '2px solid ' + (audioOnly ? '#C9A84C' : '#3D3020'), position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                <div style={{ position: 'absolute', top: 3, left: audioOnly ? 26 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
              </button>
            </div>
            {audioOnly && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(212,133,74,.2)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['🎵 Chill stream', '🎙️ Talk show', '📻 Radio vibe', '🎧 DJ session'].map(function(tag) {
                  return (
                    <span key={tag} style={{ background: 'rgba(212,133,74,.12)', border: '1px solid rgba(212,133,74,.25)', borderRadius: 999, padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 9, color: '#C9A84C' }}>
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Private Room Toggle */}
          <div style={{ background: privateRoom ? 'rgba(201,168,76,.06)' : 'rgba(26,21,16,.8)', border: '1px solid ' + (privateRoom ? 'rgba(201,168,76,.4)' : '#3D3020'), borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{privateRoom ? '🔒' : '🔓'}</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: privateRoom ? '#C9A84C' : '#F0E8D4' }}>Private Room</span>
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', lineHeight: 1.5 }}>
                  {privateRoom
                    ? 'Invite-only access. New viewers need a direct link or your approval to join.'
                    : 'Currently public — anyone can discover and join your stream. Lock for invite-only.'}
                </div>
              </div>
              <button
                onClick={togglePrivateRoom}
                style={{ flexShrink: 0, width: 52, height: 28, borderRadius: 14, background: privateRoom ? '#C9A84C' : '#3D3020', border: '2px solid ' + (privateRoom ? '#C9A84C' : '#3D3020'), position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                <div style={{ position: 'absolute', top: 3, left: privateRoom ? 26 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
              </button>
            </div>
            {privateRoom && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(201,168,76,.2)' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', marginBottom: 6 }}>INVITE LINK</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', background: 'rgba(14,12,9,.8)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 6, padding: '7px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {'https://seewhylive.online/join/' + (roomId || 'live') + '?private=1'}
                  </div>
                  <button
                    onClick={function() {
                      var link = 'https://seewhylive.online/join/' + (roomId || 'live') + '?private=1';
                      if (navigator.clipboard) { navigator.clipboard.writeText(link).catch(function() {}); }
                      if (addToast) addToast('Invite link copied', 'success');
                    }}
                    style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 6, padding: '6px 12px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>
                    📋 COPY
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Paywall Toggle */}
          <div style={{ background: paywallOn ? 'rgba(201,168,76,.06)' : 'rgba(26,21,16,.8)', border: '1px solid ' + (paywallOn ? 'rgba(201,168,76,.4)' : '#3D3020'), borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>💰</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: paywallOn ? '#C9A84C' : '#F0E8D4' }}>Paid Entry (Paywall)</span>
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', lineHeight: 1.5 }}>
                  {paywallOn
                    ? 'Viewers pay $' + (Math.floor(paywallCents) / 100).toFixed(2) + ' to enter. You keep 90% — platform takes 10%.'
                    : 'Charge a ticket price to enter your room. You set the amount.'}
                </div>
              </div>
              <button
                onClick={togglePaywall}
                style={{ flexShrink: 0, width: 52, height: 28, borderRadius: 14, background: paywallOn ? '#C9A84C' : '#3D3020', border: '2px solid ' + (paywallOn ? '#C9A84C' : '#3D3020'), position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                <div style={{ position: 'absolute', top: 3, left: paywallOn ? 26 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
              </button>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid ' + (paywallOn ? 'rgba(201,168,76,.2)' : '#1A1510') }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 2, marginBottom: 6 }}>ENTRY PRICE</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(14,12,9,.8)', border: '1px solid ' + (paywallOn ? 'rgba(201,168,76,.3)' : '#3D3020'), borderRadius: 8, padding: '0 10px', flex: 1 }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: paywallOn ? '#C9A84C' : '#8A7A62', marginRight: 4 }}>$</span>
                  <input
                    value={paywallInput}
                    onChange={function(e) { setPaywallInput(e.target.value); }}
                    onBlur={savePaywallAmount}
                    onKeyDown={function(e) { if (e.key === 'Enter') { e.target.blur(); } }}
                    style={{ background: 'none', border: 'none', outline: 'none', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 12, width: '100%', padding: '9px 0' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 5, 10].map(function(amt) {
                    var active = Math.floor(paywallCents) === amt * 100;
                    return (
                      <button
                        key={amt}
                        onClick={function() {
                          setPaywallCents(amt * 100);
                          setPaywallInput(amt.toFixed(2));
                          if (paywallOn && socket) socket.emit('room-paywall', { roomId: roomId, paywallEnabled: true, amountCents: amt * 100 });
                        }}
                        style={{ background: active ? 'rgba(201,168,76,.2)' : 'rgba(26,21,16,.6)', border: '1px solid ' + (active ? 'rgba(201,168,76,.4)' : '#3D3020'), borderRadius: 6, padding: '5px 8px', color: active ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                        ${amt}
                      </button>
                    );
                  })}
                </div>
              </div>
              {paywallOn && (
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>
                  <span>You receive: <span style={{ color: '#C9A84C' }}>${(Math.floor(paywallCents * CREATOR) / 100).toFixed(2)}</span></span>
                  <span>Platform: <span style={{ color: '#8A7A62' }}>${(Math.floor(paywallCents * PLATFORM) / 100).toFixed(2)}</span></span>
                </div>
              )}
            </div>
          </div>

          {/* Host-only note */}
          {!isHost && (
            <div style={{ background: 'rgba(255,26,60,.05)', border: '1px solid rgba(255,26,60,.2)', borderRadius: 8, padding: '10px 12px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF6B81', textAlign: 'center' }}>
              ⚠️ Only the host can change room settings
            </div>
          )}

        </div>
      )}
    </div>
  );
}
