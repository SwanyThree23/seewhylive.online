import React, { useState, useEffect, useRef } from 'react';
import OctCell from './OctCell.jsx';
import rtcManager from '../webrtc.js';

var MAX_STAGE = 20;

// ─── Palette ───────────────────────────────────────────────────────────────
var BG      = '#0F0C14';
var SURF    = '#130F1C';
var CARD    = '#1A1526';
var CARD2   = '#211A30';
var BORDER  = 'rgba(255,255,255,.06)';
var GOLD    = '#C9A84C';
var BURG    = '#800020';
var TEAL    = '#00DEC0';
var RED     = '#FF1A3C';
var TEXT    = '#EDE8F5';
var MUTED   = '#7A6F90';
var DIM     = '#2E2545';

// ─── Animation CSS ─────────────────────────────────────────────────────────
var ANIM = [
  '@keyframes speakBar{0%{transform:scaleY(.25)}100%{transform:scaleY(1)}}',
  '@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}',
  '@keyframes fadeSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}',
  '@keyframes speakRing{0%,100%{box-shadow:0 0 0 2px '+TEAL+',0 0 14px '+TEAL+'44}50%{box-shadow:0 0 0 3px '+TEAL+',0 0 24px '+TEAL+'66}}',
  '@keyframes goldPulse{0%,100%{opacity:1}50%{opacity:.6}}',
].join('\n');

// ─── Sub-components ────────────────────────────────────────────────────────

function SpeakBars({ color, small }) {
  var c = color || TEAL;
  var h = small ? 10 : 14;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: h, flexShrink: 0 }}>
      {[0, 1, 2, 3].map(function(i) {
        return (
          <div key={i} style={{
            width: small ? 2 : 3,
            height: h,
            background: c,
            borderRadius: 2,
            transformOrigin: 'bottom',
            transform: 'scaleY(.25)',
            animation: 'speakBar .5s ease-in-out ' + (i * .1) + 's infinite alternate',
          }} />
        );
      })}
    </div>
  );
}

function RolePill({ role }) {
  var cfg = {
    host:   { bg: 'rgba(201,168,76,.18)',  color: GOLD,    label: 'HOST'    },
    cohost: { bg: 'rgba(0,222,192,.12)',   color: TEAL,    label: 'CO-HOST' },
    guest:  { bg: 'rgba(90,143,255,.14)',  color: '#7AABFF', label: 'GUEST'  },
    viewer: { bg: 'rgba(46,37,69,.7)',     color: MUTED,   label: 'VIEWER'  },
  };
  var s = cfg[role] || cfg.viewer;
  return (
    <span style={{
      fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1,
      padding: '1px 5px', borderRadius: 3,
      background: s.bg, color: s.color, flexShrink: 0,
    }}>
      {s.label}
    </span>
  );
}

function AudienceCircle({ g, speaking }) {
  var name = g.username || g.guestId || '?';
  var init = name.charAt(0).toUpperCase();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, width: 60 }}>
      <div style={{
        width: 46, height: 46, borderRadius: '50%',
        background: 'linear-gradient(135deg,' + BURG + '50,' + CARD + ')',
        border: '2px solid ' + (speaking ? TEAL : DIM),
        boxShadow: speaking ? ('0 0 10px ' + TEAL + '55') : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', flexShrink: 0, overflow: 'hidden',
        transition: 'border-color .3s, box-shadow .3s',
      }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, lineHeight: 1, userSelect: 'none' }}>
          {init}
        </span>
        {g.remoteMuted && (
          <div style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 16, height: 16, borderRadius: '50%',
            background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 7, border: '1.5px solid ' + BG,
          }}>🔇</div>
        )}
      </div>
      <span style={{
        fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 500, fontSize: 10,
        color: MUTED, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', textAlign: 'center', lineHeight: 1.2,
      }}>
        {name}
      </span>
    </div>
  );
}

function IconBtn({ icon, label, active, danger, badge, onPress, size }) {
  var sz  = size || 42;
  var bg  = active && danger  ? 'rgba(255,26,60,.25)'
          : active            ? 'rgba(0,222,192,.18)'
          :                     'rgba(255,255,255,.06)';
  var bc  = active && danger  ? 'rgba(255,26,60,.5)'
          : active            ? 'rgba(0,222,192,.4)'
          :                     'rgba(255,255,255,.1)';
  var ic  = active && danger  ? RED
          : active            ? TEAL
          :                     MUTED;
  return (
    <button onClick={onPress} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
      position: 'relative', userSelect: 'none',
    }}>
      <div style={{
        width: sz, height: sz, borderRadius: '50%',
        background: bg, border: '1px solid ' + bc,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: sz > 40 ? 18 : 15,
        transition: 'background .2s, border-color .2s',
      }}>
        {icon}
      </div>
      {label && (
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: ic, letterSpacing: .5, lineHeight: 1 }}>
          {label}
        </span>
      )}
      {badge > 0 && (
        <div style={{
          position: 'absolute', top: 0, right: 2,
          width: 16, height: 16, borderRadius: '50%',
          background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff', fontWeight: 700,
          border: '1.5px solid ' + BG,
        }}>
          {badge > 9 ? '9+' : badge}
        </div>
      )}
    </button>
  );
}

function GiftFloat({ item, onDone }) {
  useEffect(function() {
    var t = setTimeout(onDone, 3500);
    return function() { clearTimeout(t); };
  }, []);
  return (
    <div style={{
      pointerEvents: 'none', position: 'absolute', left: '50%',
      bottom: 80, transform: 'translateX(-50%)',
      background: 'rgba(7,5,10,.88)', border: '1px solid ' + GOLD + '55',
      borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6,
      animation: 'fadeSlideIn .3s ease',
      zIndex: 60,
    }}>
      <span style={{ fontSize: 20 }}>{item.emoji || '🎁'}</span>
      <div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: GOLD }}>{item.from_user}</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{item.name}</div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function LiveRoomPage({
  socket, guests, chat, isLive, setIsLive,
  userId, username, role, roomId, branding,
  addToast, overlayConfig, viewerCount, mediaConfig,
  streamInfo, onLeave,
}) {
  var [rtcReady,      setRtcReady]      = useState(false);
  var [isMuted,       setIsMuted]       = useState(false);
  var [isCamOff,      setIsCamOff]      = useState(false);
  var [chatOpen,      setChatOpen]      = useState(false);
  var [chatInput,     setChatInput]     = useState('');
  var [handRaised,    setHandRaised]    = useState(false);
  var [speakingIds,   setSpeakingIds]   = useState({});
  var [showAllAud,    setShowAllAud]    = useState(false);
  var [medConf,       setMedConf]       = useState(mediaConfig || null);
  var [reactsOpen,    setReactsOpen]    = useState(false);
  var [floatReacts,   setFloatReacts]   = useState([]);
  var [giftFloats,    setGiftFloats]    = useState([]);
  var [stageLayout,   setStageLayout]   = useState('grid');   // 'grid' | 'featured'
  var [featuredId,    setFeaturedId]    = useState(userId);
  var [showLiveModal, setShowLiveModal] = useState(false);
  var [stageGuests,   setStageGuests]   = useState([userId]);

  var chatEndRef    = useRef(null);
  var gold          = (branding && branding.gold) ? branding.gold : GOLD;

  // ── Camera warm-up ──
  useEffect(function() {
    if (role === 'viewer') return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(function(s) { s.getTracks().forEach(function(t) { t.stop(); }); })
      .catch(function() {});
  }, []);

  // ── RTC + socket events ──
  useEffect(function() {
    if (!socket) return;

    socket.on('join-room-ack', async function(data) {
      if (!data || data.error) {
        if (addToast) addToast('Room connect failed', 'error');
        return;
      }
      try {
        await rtcManager.connect(socket, roomId, userId, role);
        setRtcReady(true);
      } catch(e) {
        if (addToast) addToast('WebRTC: ' + e.message, 'error');
      }
    });

    socket.on('speaking', function(data) {
      if (!data || !data.guestId) return;
      setSpeakingIds(function(prev) {
        var next = Object.assign({}, prev);
        next[data.guestId] = !!data.speaking;
        return next;
      });
    });

    socket.on('gift-received', function(gift) {
      if (!gift) return;
      var fid = Date.now() + Math.random();
      setGiftFloats(function(gf) { return gf.concat([Object.assign({}, gift, { _fid: fid })]); });
    });

    socket.on('hand-raise', function(data) {
      if (!data || role !== 'host') return;
      if (addToast) addToast('✋ ' + (data.username || data.guestId) + ' wants on stage', 'info');
    });

    socket.on('stage-invite', function(data) {
      if (!data || !data.guestId) return;
      setStageGuests(function(s) {
        if (s.indexOf(data.guestId) >= 0) return s;
        if (s.length >= MAX_STAGE) return s;
        return s.concat([data.guestId]);
      });
    });

    return function() {
      socket.off('join-room-ack');
      socket.off('speaking');
      socket.off('gift-received');
      socket.off('hand-raise');
      socket.off('stage-invite');
    };
  }, [socket]);

  // ── Scroll chat to bottom ──
  useEffect(function() {
    if (chatEndRef.current && chatOpen) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat, chatOpen]);

  // ── Update medConf when mediaConfig prop changes ──
  useEffect(function() { setMedConf(mediaConfig || null); }, [mediaConfig]);

  function toggleMute() { setIsMuted(function(v) { return !v; }); }
  function toggleCam()  { setIsCamOff(function(v) { return !v; }); }

  function sendChat() {
    var msg = chatInput.trim();
    if (!msg || !socket) return;
    socket.emit('chat-message', { roomId: roomId, userId: userId, username: username, message: msg });
    setChatInput('');
  }

  function raiseHand() {
    var next = !handRaised;
    setHandRaised(next);
    if (socket && next) socket.emit('hand-raise', { roomId: roomId, guestId: userId, username: username });
    if (addToast) addToast(next ? '✋ Hand raised — waiting for host' : 'Hand lowered', 'info');
  }

  function sendReact(emoji) {
    var fid = Date.now() + Math.random();
    setFloatReacts(function(r) { return r.concat([{ emoji: emoji, fid: fid }]); });
    setTimeout(function() { setFloatReacts(function(r) { return r.filter(function(x) { return x.fid !== fid; }); }); }, 2200);
    if (socket) socket.emit('react', { roomId: roomId, userId: userId, emoji: emoji });
    setReactsOpen(false);
  }

  function goLive() {
    if (!socket) return;
    socket.emit('go-live', { roomId: roomId, destinations: { seewhy: true } });
    setShowLiveModal(false);
    if (addToast) addToast('🔴 Going LIVE...', 'success');
  }

  function endStream() {
    if (!socket) return;
    socket.emit('end-broadcast', { roomId: roomId });
    if (setIsLive) setIsLive(false);
    if (addToast) addToast('Stream ended', 'info');
  }

  // ── Build participant arrays ──
  var allGuestMap = {};
  allGuestMap[userId] = { guestId: userId, username: username, role: role };
  guests.forEach(function(g) {
    var gid = g.guestId || g.userId;
    if (gid) allGuestMap[gid] = g;
  });

  var allParticipants = (function() {
    var own  = allGuestMap[userId] || { guestId: userId, username: username, role: role };
    var seen = {};
    seen[userId] = true;
    var others = guests.map(function(g) {
      var gid = g.guestId || g.userId;
      if (!gid || seen[gid]) return null;
      seen[gid] = true;
      return allGuestMap[gid] || g;
    }).filter(Boolean);
    return [own].concat(others).slice(0, MAX_STAGE);
  })();

  // On-stage = self + any guest that has a video producer (actively streaming)
  var onStage = allParticipants.filter(function(g) {
    var gid = g.guestId || g.userId;
    return gid === userId || g.producerId || g.audioProducerId;
  });
  if (onStage.length === 0) {
    onStage = [allGuestMap[userId] || { guestId: userId, username: username, role: role }];
  }

  var audienceList = allParticipants.filter(function(g) {
    var gid = g.guestId || g.userId;
    if (gid === userId) return false;
    return !g.producerId && !g.audioProducerId;
  });

  // Grid sizing
  var n    = onStage.length;
  var cols = n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
  var sz   = n <= 2 ? 160 : n <= 4 ? 130 : n <= 9 ? 100 : 80;

  // Host info
  var hostEntry = guests.find(function(g) { return g.role === 'host'; }) || allGuestMap[userId];
  var hostName  = (hostEntry && (hostEntry.username || hostEntry.guestId)) || username || 'Host';

  // Current speaker
  var speakerName = null;
  Object.keys(speakingIds).forEach(function(gid) {
    if (speakingIds[gid] && allGuestMap[gid]) {
      speakerName = (allGuestMap[gid].username || allGuestMap[gid].guestId) || null;
    }
  });

  // Featured guest for single-focus layout
  var featuredGuest = allGuestMap[featuredId] || onStage[0] || { guestId: userId, username: username, role: role };

  var newMsgCount = chat ? chat.length : 0;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG, overflow: 'hidden', position: 'relative', fontFamily: "'Barlow Condensed',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      {/* ════════════════ ROOM HEADER ════════════════ */}
      <div style={{ background: SURF, borderBottom: '1px solid ' + BORDER, padding: '10px 16px 10px', flexShrink: 0 }}>

        {/* Top row: Title + live badge + controls */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 22, color: TEXT, lineHeight: 1.1, letterSpacing: .3 }}>
              {(streamInfo && streamInfo.title) ? streamInfo.title : 'Live Room'}
            </div>
            {streamInfo && streamInfo.subtitle && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: gold, letterSpacing: 1.5, marginTop: 3, textTransform: 'uppercase', opacity: .85 }}>
                {streamInfo.subtitle}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginTop: 2 }}>
            {isLive ? (
              <button onClick={endStream} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: RED, animation: 'livePulse 1.2s infinite' }} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: RED, letterSpacing: 1 }}>LIVE</span>
              </button>
            ) : role === 'host' ? (
              <button onClick={function() { setShowLiveModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 5, background: RED, border: 'none', borderRadius: 999, padding: '5px 12px', cursor: 'pointer' }}>
                <span style={{ fontSize: 9 }}>▶</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#fff', letterSpacing: 1 }}>GO LIVE</span>
              </button>
            ) : (
              <div style={{ background: 'rgba(46,37,69,.8)', borderRadius: 999, padding: '4px 10px' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>OFFLINE</span>
              </div>
            )}
          </div>
        </div>

        {/* Host + viewer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'linear-gradient(135deg,' + gold + '55,' + BURG + '55)',
              border: '1.5px solid ' + gold + '66',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: gold, lineHeight: 1 }}>
                {hostName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: TEXT }}>{hostName}</span>
            <RolePill role={hostEntry ? hostEntry.role : role} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>
              👥 {viewerCount || allParticipants.length}
            </span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>
              {allParticipants.length} here now
            </span>
          </div>
        </div>

        {/* Speaking indicator */}
        {speakerName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, paddingTop: 7, borderTop: '1px solid ' + BORDER }}>
            <SpeakBars color={TEAL} small />
            <span style={{ fontSize: 12, color: TEAL, fontWeight: 500 }}>{speakerName} is speaking</span>
          </div>
        )}
      </div>

      {/* ════════════════ SCROLLABLE BODY ════════════════ */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>

        {/* ── Stage Section ── */}
        <div style={{ padding: '12px 14px 6px' }}>

          {/* Stage header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 20, color: TEXT, letterSpacing: .3 }}>Stage</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: MUTED, letterSpacing: 1 }}>{onStage.length}/{MAX_STAGE}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {/* Layout toggle */}
              <div style={{ display: 'flex', background: CARD, borderRadius: 8, overflow: 'hidden', border: '1px solid ' + BORDER }}>
                {[
                  { id: 'grid',     icon: '⊞' },
                  { id: 'featured', icon: '◻' },
                ].map(function(l) {
                  return (
                    <button key={l.id} onClick={function() { setStageLayout(l.id); }}
                      style={{ background: stageLayout === l.id ? CARD2 : 'transparent', border: 'none', color: stageLayout === l.id ? TEXT : MUTED, cursor: 'pointer', padding: '5px 10px', fontSize: 12, transition: 'background .15s' }}>
                      {l.icon}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grid layout */}
          {stageLayout === 'grid' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: n === 1 ? 'center' : 'flex-start' }}>
              {onStage.map(function(g) {
                var gid  = g.guestId || g.userId || 'x';
                var isOwn = gid === userId;
                var isSp  = !!speakingIds[gid];
                return (
                  <div key={gid} onClick={function() { setFeaturedId(gid); setStageLayout('featured'); }}
                    style={{
                      width: sz, flexShrink: 0, cursor: 'pointer',
                      background: CARD, borderRadius: 14, overflow: 'hidden',
                      border: '1.5px solid ' + (isSp ? TEAL + '88' : (gid === featuredId ? gold + '44' : BORDER)),
                      boxShadow: isSp ? ('0 0 16px ' + TEAL + '33') : 'none',
                      transition: 'border-color .2s, box-shadow .2s',
                      animation: 'fadeSlideIn .25s ease',
                    }}>
                    <div style={{ position: 'relative' }}>
                      <OctCell
                        guest={g}
                        sz={sz}
                        isHost={role === 'host'}
                        fadesMode={false}
                        branding={branding}
                        onTap={null}
                        socket={socket}
                        roomId={roomId}
                        userId={userId}
                        rtcManager={rtcReady ? rtcManager : null}
                        mediaConfig={isOwn ? medConf : null}
                        isMuted={isOwn ? isMuted : false}
                        isCamOff={isOwn ? isCamOff : false}
                        onMuteToggle={isOwn ? toggleMute : null}
                        onCamToggle={isOwn ? toggleCam : null}
                      />
                    </div>
                    {/* Cell footer */}
                    <div style={{ padding: '6px 8px 8px', background: CARD }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        {isSp && <SpeakBars color={TEAL} small />}
                        <span style={{ fontWeight: 700, fontSize: 12, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.username || gid}
                          {isOwn && <span style={{ color: MUTED, fontWeight: 400, fontSize: 9, marginLeft: 3 }}>(YOU)</span>}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <RolePill role={g.role || (isOwn ? role : 'guest')} />
                        {(isOwn ? isMuted : g.remoteMuted) && (
                          <span style={{ fontSize: 10 }}>🔇</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Featured layout */}
          {stageLayout === 'featured' && (
            <div>
              {/* Big featured cell */}
              <div style={{ background: CARD, borderRadius: 16, overflow: 'hidden', border: '1.5px solid ' + (speakingIds[featuredGuest.guestId || featuredGuest.userId] ? TEAL + '88' : BORDER), boxShadow: speakingIds[featuredGuest.guestId || featuredGuest.userId] ? ('0 0 24px ' + TEAL + '33') : 'none', marginBottom: 10 }}>
                <div style={{ position: 'relative' }}>
                  <OctCell
                    guest={featuredGuest}
                    sz={300}
                    isHost={role === 'host'}
                    fadesMode={false}
                    branding={branding}
                    onTap={null}
                    socket={socket}
                    roomId={roomId}
                    userId={userId}
                    rtcManager={rtcReady ? rtcManager : null}
                    mediaConfig={(featuredGuest.guestId || featuredGuest.userId) === userId ? medConf : null}
                    isMuted={(featuredGuest.guestId || featuredGuest.userId) === userId ? isMuted : false}
                    isCamOff={(featuredGuest.guestId || featuredGuest.userId) === userId ? isCamOff : false}
                    onMuteToggle={(featuredGuest.guestId || featuredGuest.userId) === userId ? toggleMute : null}
                    onCamToggle={(featuredGuest.guestId || featuredGuest.userId) === userId ? toggleCam : null}
                  />
                </div>
                <div style={{ padding: '8px 12px 10px', background: CARD }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: TEXT }}>
                      {featuredGuest.username || featuredGuest.guestId}
                    </span>
                    <RolePill role={featuredGuest.role || role} />
                    {speakingIds[featuredGuest.guestId || featuredGuest.userId] && <SpeakBars color={TEAL} small />}
                  </div>
                </div>
              </div>
              {/* Thumbnail strip */}
              {onStage.length > 1 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
                  {onStage.filter(function(g) {
                    return (g.guestId || g.userId) !== (featuredGuest.guestId || featuredGuest.userId);
                  }).map(function(g) {
                    var gid  = g.guestId || g.userId || 'x';
                    var isOwn = gid === userId;
                    var isSp  = !!speakingIds[gid];
                    return (
                      <div key={gid} onClick={function() { setFeaturedId(gid); }}
                        style={{
                          flexShrink: 0, width: 90,
                          background: CARD2, borderRadius: 10, overflow: 'hidden',
                          border: '1.5px solid ' + (isSp ? TEAL + '66' : BORDER),
                          cursor: 'pointer',
                        }}>
                        <OctCell
                          guest={g}
                          sz={90}
                          isHost={role === 'host'}
                          fadesMode={false}
                          branding={branding}
                          onTap={null}
                          socket={socket}
                          roomId={roomId}
                          userId={userId}
                          rtcManager={rtcReady ? rtcManager : null}
                          mediaConfig={isOwn ? medConf : null}
                          isMuted={isOwn ? isMuted : false}
                          isCamOff={isOwn ? isCamOff : false}
                          onMuteToggle={null}
                          onCamToggle={null}
                        />
                        <div style={{ padding: '3px 5px 5px' }}>
                          <span style={{ fontSize: 10, color: MUTED, fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {g.username || gid}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Audience Section ── */}
        {audienceList.length > 0 && (
          <div style={{ padding: '10px 14px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: MUTED, letterSpacing: .3 }}>
                Others in the Room
              </span>
              {audienceList.length > 8 && (
                <button onClick={function() { setShowAllAud(function(v) { return !v; }); }}
                  style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: .5 }}>
                  {showAllAud ? 'COLLAPSE' : 'SEE ALL (' + audienceList.length + ')'}
                </button>
              )}
            </div>
            {showAllAud ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                {audienceList.map(function(g) {
                  var gid = g.guestId || g.userId || 'x';
                  return <AudienceCircle key={gid} g={g} speaking={!!speakingIds[gid]} />;
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                {audienceList.slice(0, 20).map(function(g) {
                  var gid = g.guestId || g.userId || 'x';
                  return <AudienceCircle key={gid} g={g} speaking={!!speakingIds[gid]} />;
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Quick Action Tools ── */}
        <div style={{ padding: '6px 14px 10px', display: 'flex', gap: 10, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {[
            { emoji: '💰', label: 'Tip'    },
            { emoji: '🎁', label: 'Gift'   },
            { emoji: '📊', label: 'Poll'   },
            { emoji: '🎟', label: 'PPV'    },
            { emoji: '🔗', label: 'Share'  },
            { emoji: '⚙',  label: 'Settings' },
          ].map(function(tool) {
            return (
              <div key={tool.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, cursor: 'pointer' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: CARD2, border: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {tool.emoji}
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5 }}>{tool.label}</span>
              </div>
            );
          })}
        </div>

        {/* Bottom spacer for fixed bar */}
        <div style={{ height: 74 }} />
      </div>

      {/* ════════════════ FLOATING REACTIONS ════════════════ */}
      {floatReacts.map(function(r) {
        return (
          <div key={r.fid} style={{
            position: 'absolute', left: (30 + Math.random() * 30) + '%', bottom: 90,
            fontSize: 28, pointerEvents: 'none', zIndex: 55,
            animation: 'fadeSlideIn .4s ease',
          }}>
            {r.emoji}
          </div>
        );
      })}

      {/* ════════════════ GIFT FLOATS ════════════════ */}
      {giftFloats.slice(-1).map(function(g) {
        return (
          <GiftFloat key={g._fid} item={g} onDone={function() {
            setGiftFloats(function(gf) { return gf.filter(function(x) { return x._fid !== g._fid; }); });
          }} />
        );
      })}

      {/* ════════════════ REACT PICKER ════════════════ */}
      {reactsOpen && (
        <div style={{
          position: 'absolute', bottom: 80, right: 12,
          background: CARD2, border: '1px solid ' + BORDER, borderRadius: 20,
          padding: '10px 14px', display: 'flex', gap: 10, zIndex: 50,
          boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          animation: 'fadeSlideIn .2s ease',
        }}>
          {['❤️','🔥','👏','😂','💯','🎉','👑','💰'].map(function(e) {
            return (
              <button key={e} onClick={function() { sendReact(e); }}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: '2px 3px', borderRadius: 8, transition: 'transform .1s' }}>
                {e}
              </button>
            );
          })}
        </div>
      )}

      {/* ════════════════ CHAT PANEL ════════════════ */}
      {chatOpen && (
        <div style={{
          position: 'absolute', bottom: 62, left: 0, right: 0,
          height: '52%', background: 'rgba(9,7,14,.97)',
          borderTop: '1px solid ' + BORDER, display: 'flex', flexDirection: 'column',
          animation: 'slideUp .2s ease', zIndex: 48,
        }}>
          {/* Chat header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: TEXT, letterSpacing: .3 }}>Chat</span>
            <button onClick={function() { setChatOpen(false); }}
              style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
          </div>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {(!chat || chat.length === 0) && (
              <div style={{ textAlign: 'center', padding: '28px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>No messages yet</div>
            )}
            {chat && chat.map(function(m, i) {
              return (
                <div key={m.id || i} style={{ marginBottom: 12, animation: 'fadeSlideIn .2s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: gold }}>{m.username || 'Guest'}</span>
                    {m.ts && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>
                      {new Date(m.ts * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>}
                  </div>
                  <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.45 }}>{m.message}</p>
                  {m.translated && m.translated !== m.message && (
                    <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, margin: '2px 0 0', fontStyle: 'italic' }}>{m.translated}</p>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          {/* Input */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid ' + BORDER, display: 'flex', gap: 8, flexShrink: 0 }}>
            <input
              value={chatInput}
              onChange={function(e) { setChatInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') sendChat(); }}
              placeholder="Say something..."
              style={{
                flex: 1, background: CARD2, border: '1px solid ' + DIM, borderRadius: 999,
                padding: '9px 16px', fontSize: 13, color: TEXT, outline: 'none',
                fontFamily: "'Barlow Condensed',sans-serif",
              }}
            />
            <button onClick={sendChat} style={{
              background: gold, border: 'none', borderRadius: 999,
              padding: '9px 18px', fontWeight: 700, fontSize: 13, color: BG, cursor: 'pointer',
            }}>
              Send
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ GO-LIVE MODAL ════════════════ */}
      {showLiveModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 70, animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ fontWeight: 700, fontSize: 22, color: TEXT, marginBottom: 6 }}>Go Live</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 20 }}>Start broadcasting to your audience</div>
            <button onClick={goLive} style={{ width: '100%', background: RED, border: 'none', borderRadius: 12, padding: '14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#fff', cursor: 'pointer', letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>▶</span> START BROADCAST
            </button>
            <button onClick={function() { setShowLiveModal(false); }} style={{ width: '100%', background: 'transparent', border: 'none', marginTop: 12, padding: '12px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, color: MUTED, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ BOTTOM TOOLBAR ════════════════ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(7,5,10,.97)',
        borderTop: '1px solid ' + BORDER,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px',
        paddingBottom: 'max(6px,env(safe-area-inset-bottom))',
        zIndex: 40, flexShrink: 0,
      }}>
        {/* Leave */}
        <button onClick={function() { if (onLeave) onLeave(); }} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: RED, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', letterSpacing: .3 }}>
          Leave room
        </button>
        {/* Right-side icon buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <IconBtn
            icon="💬"
            label="Chat"
            active={chatOpen}
            badge={chatOpen ? 0 : (chat && chat.length > 99 ? 99 : (chat && chat.length) || 0)}
            onPress={function() { setChatOpen(function(v) { return !v; }); }}
          />
          <IconBtn
            icon="❤️"
            label="React"
            active={reactsOpen}
            onPress={function() { setReactsOpen(function(v) { return !v; }); }}
          />
          <IconBtn
            icon="✋"
            label="Hand"
            active={handRaised}
            activeColor={gold}
            onPress={raiseHand}
          />
          <IconBtn
            icon={isMuted ? '🔇' : '🎙'}
            label={isMuted ? 'Unmute' : 'Mute'}
            active={isMuted}
            danger={true}
            onPress={toggleMute}
          />
        </div>
      </div>
    </div>
  );
}
