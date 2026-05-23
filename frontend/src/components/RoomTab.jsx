import React, { useState, useEffect, useRef } from 'react';
import OctCell from './OctCell.jsx';
import MediaConfigPanel from './MediaConfigPanel.jsx';
import rtcManager from '../webrtc.js';

var MAX_STAGE = 9;
var LAYOUTS = [
  { id: 'panel',  label: '⊞ PANEL'  },
  { id: 'solo',   label: '◻ SOLO'   },
  { id: 'talk',   label: '⊡ TALK'   },
  { id: 'screen', label: '🖥 SCRN'   },
  { id: 'expand', label: '⛶ EXPAND' },
];

function RolePill({ role }) {
  var colors = { host: '#C9A84C', cohost: '#00C9A7', guest: '#5A8FFF', viewer: 'rgba(176,160,192,.5)' };
  var bg     = { host: 'rgba(201,168,76,.18)', cohost: 'rgba(0,201,167,.15)', guest: 'rgba(90,143,255,.15)', viewer: 'rgba(36,28,52,.6)' };
  var r      = role || 'viewer';
  return (
    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 5px', borderRadius: 3, background: bg[r] || bg.viewer, color: colors[r] || colors.viewer, flexShrink: 0 }}>
      {r}
    </span>
  );
}

function LowerThird({ name, role, isMuted, isCamOff, isLive }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 10px 8px', background: 'linear-gradient(transparent,rgba(7,5,10,.85))', zIndex: 20, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#EDE8F5', letterSpacing: 1, textShadow: '0 1px 6px rgba(0,0,0,.8)', lineHeight: 1.1 }}>{name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <RolePill role={role} />
            {isMuted   && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', background: 'rgba(255,26,60,.18)', padding: '1px 4px', borderRadius: 3 }}>🔇</span>}
            {isCamOff  && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', background: 'rgba(255,26,60,.18)', padding: '1px 4px', borderRadius: 3 }}>📵</span>}
          </div>
        </div>
        {isLive && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 6px #FF1A3C', animation: 'liveBlink 1s infinite', marginBottom: 4 }} />}
      </div>
    </div>
  );
}

function OverlayBanner({ banner }) {
  if (!banner || !banner.visible || !banner.text) return null;
  var isTop = banner.position === 'top';
  return (
    <div style={{ position: 'absolute', [isTop ? 'top' : 'bottom']: 0, left: 0, right: 0, zIndex: 30, pointerEvents: 'none', padding: isTop ? '10px 16px 20px' : '20px 16px 10px', background: isTop ? 'linear-gradient(rgba(7,5,10,.85),transparent)' : 'linear-gradient(transparent,rgba(7,5,10,.85))' }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: banner.color || '#C9A84C', letterSpacing: 4, textShadow: '0 2px 10px rgba(0,0,0,.9)', textAlign: 'center' }}>
        {banner.text}
      </div>
    </div>
  );
}

function OverlayCountdown({ countdown }) {
  var [rem, setRem] = useState(0);
  useEffect(function() {
    if (!countdown || !countdown.visible || !countdown.targetTs) return;
    function tick() { setRem(Math.max(0, countdown.targetTs - Math.floor(Date.now() / 1000))); }
    tick();
    var t = setInterval(tick, 1000);
    return function() { clearInterval(t); };
  }, [countdown && countdown.targetTs, countdown && countdown.visible]);

  if (!countdown || !countdown.visible) return null;
  var h   = Math.floor(rem / 3600);
  var m   = Math.floor((rem % 3600) / 60);
  var s   = rem % 60;
  var str = (h > 0 ? String(h).padStart(2, '0') + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 35, pointerEvents: 'none', textAlign: 'center', background: 'rgba(7,5,10,.75)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 12, padding: '14px 24px', backdropFilter: 'blur(8px)' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 3, marginBottom: 4 }}>{countdown.label || 'STARTING SOON'}</div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, color: '#C9A84C', letterSpacing: 6, lineHeight: 1 }}>{str}</div>
    </div>
  );
}

function OverlayScoreBug({ scoreBug }) {
  if (!scoreBug || !scoreBug.visible) return null;
  return (
    <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 30, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', background: 'rgba(10,7,18,.88)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 6, overflow: 'hidden', backdropFilter: 'blur(4px)' }}>
        <div style={{ padding: '5px 10px', textAlign: 'center', borderRight: '1px solid rgba(201,168,76,.2)' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#EDE8F5', letterSpacing: 2 }}>{scoreBug.team1.name || 'TEAM 1'}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, color: '#C9A84C', lineHeight: 1 }}>{scoreBug.team1.score}</div>
        </div>
        <div style={{ padding: '5px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#7A6F90', letterSpacing: 1 }}>{scoreBug.label || ''}</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 10, color: '#FF6B81' }}>VS</div>
        </div>
        <div style={{ padding: '5px 10px', textAlign: 'center', borderLeft: '1px solid rgba(201,168,76,.2)' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#EDE8F5', letterSpacing: 2 }}>{scoreBug.team2.name || 'TEAM 2'}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, color: '#C9A84C', lineHeight: 1 }}>{scoreBug.team2.score}</div>
        </div>
      </div>
    </div>
  );
}

function OverlayCustomLT({ lowerThirds, guestId }) {
  if (!lowerThirds) return null;
  var lt = lowerThirds[guestId];
  if (!lt || !lt.visible) return null;
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 25, pointerEvents: 'none', padding: '24px 10px 8px', background: 'linear-gradient(transparent,rgba(7,5,10,.9))' }}>
      <div style={{ borderLeft: '3px solid #C9A84C', paddingLeft: 7 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#EDE8F5', letterSpacing: 2, lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,.9)' }}>{lt.name}</div>
        {lt.title && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', marginTop: 2, letterSpacing: 1 }}>{lt.title}</div>}
      </div>
    </div>
  );
}

var GO_LIVE_PLATFORMS = [
  { id: 'seewhy',   name: 'SeeWhy LIVE', color: '#C9A84C', icon: '📡', locked: true  },
  { id: 'youtube',  name: 'YouTube',     color: '#FF0000', icon: '▶',  locked: false },
  { id: 'twitch',   name: 'Twitch',      color: '#9146FF', icon: '⬡',  locked: false },
  { id: 'facebook', name: 'Facebook',    color: '#1877F2', icon: 'f',  locked: false },
  { id: 'tiktok',   name: 'TikTok',      color: '#69C9D0', icon: '♪',  locked: false },
  { id: 'kick',     name: 'Kick',        color: '#53FC18', icon: 'K',  locked: false },
  { id: 'rumble',   name: 'Rumble',      color: '#85C742', icon: 'R',  locked: false },
];

export default function RoomTab({ socket, guests, chat, isLive, setIsLive, userId, username, role, roomId, branding, addToast, overlayConfig, viewerCount }) {
  var [stageLayout,    setStageLayout]    = useState('panel');
  var [expandedId,     setExpandedId]     = useState(null);
  var [stageGuests,    setStageGuests]    = useState([userId]);
  var [handQueue,      setHandQueue]      = useState([]);
  var [featuredId,     setFeaturedId]     = useState(userId);
  var [isMuted,        setIsMuted]        = useState(false);
  var [isCamOff,       setIsCamOff]       = useState(false);
  var [isScreenShare,  setIsScreenShare]  = useState(false);
  var [showConfig,     setShowConfig]     = useState(false);
  var [mediaConfig,    setMediaConfig]    = useState(null);
  var [chatOpen,       setChatOpen]       = useState(true);
  var [chatInput,      setChatInput]      = useState('');
  var [pinnedMsg,      setPinnedMsg]      = useState(null);
  var [reactions,      setReactions]      = useState({});
  var [streamGoal,     setStreamGoal]     = useState({ enabled: false, targetCents: 5000, currentCents: 0, label: 'Stream Goal' });
  var [rtcReady,       setRtcReady]       = useState(false);
  var [showGuests,     setShowGuests]     = useState(false);
  var [showGoLiveModal, setShowGoLiveModal] = useState(false);
  var [glDests,        setGlDests]        = useState({ seewhy: true });
  var [glKeys,         setGlKeys]         = useState({});
  var [uptime,         setUptime]         = useState(0);
  var liveStartRef   = useRef(null);
  var chatEndRef     = useRef(null);
  var screenStreamRef = useRef(null);

  useEffect(function() {
    if (isLive && !liveStartRef.current) liveStartRef.current = Date.now();
    if (!isLive) { liveStartRef.current = null; setUptime(0); }
  }, [isLive]);

  useEffect(function() {
    if (!isLive) return;
    var t = setInterval(function() {
      if (liveStartRef.current) setUptime(Math.floor((Date.now() - liveStartRef.current) / 1000));
    }, 1000);
    return function() { clearInterval(t); };
  }, [isLive]);

  useEffect(function() {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  useEffect(function() {
    if (!socket) return;
    socket.on('join-room-ack', async function(data) {
      if (!data) return;
      try {
        await rtcManager.connect(socket, roomId, userId, role);
        setRtcReady(true);
        addToast('WebRTC ready', 'success');
      } catch(e) {
        addToast('WebRTC: ' + e.message, 'error');
      }
    });
    socket.on('hand-raise', function(data) {
      if (!data || role !== 'host') return;
      var gid   = data.guestId;
      var gname = data.username || gid;
      setHandQueue(function(q) {
        var already = q.find(function(x) { return x.guestId === gid; });
        if (already) return q;
        return q.concat([{ guestId: gid, username: gname, raisedAt: Date.now() }]);
      });
      addToast('✋ ' + gname + ' wants to join the stage', 'info');
    });
    socket.on('stage-invite', function(data) {
      if (!data || !data.guestId) return;
      setStageGuests(function(s) {
        if (s.indexOf(data.guestId) >= 0) return s;
        if (s.length >= MAX_STAGE) return s;
        return s.concat([data.guestId]);
      });
    });
    socket.on('stage-remove', function(data) {
      if (!data || !data.guestId) return;
      setStageGuests(function(s) { return s.filter(function(x) { return x !== data.guestId; }); });
    });
    return function() {
      socket.off('join-room-ack');
      socket.off('hand-raise');
      socket.off('stage-invite');
      socket.off('stage-remove');
    };
  }, [socket, role]);

  function fmtUptime(s) {
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    var mm = m < 10 ? '0' + m : String(m);
    var ss = sec < 10 ? '0' + sec : String(sec);
    return h > 0 ? h + ':' + mm + ':' + ss : mm + ':' + ss;
  }

  function sendChat() {
    if (!chatInput.trim() || !socket) return;
    socket.emit('chat-message', { roomId: roomId, userId: userId, username: username, message: chatInput.trim() });
    setChatInput('');
  }

  function pinMessage(msg) {
    setPinnedMsg(msg);
    if (addToast) addToast('📌 Message pinned', 'info');
  }

  function unpinMessage() {
    setPinnedMsg(null);
  }

  function addReaction(msgId, emoji) {
    setReactions(function(prev) {
      var entry = prev[msgId] || {};
      var count = entry[emoji] || 0;
      var next = Object.assign({}, prev);
      next[msgId] = Object.assign({}, entry);
      next[msgId][emoji] = count + 1;
      return next;
    });
  }

  // Simulate stream goal progress when live
  useEffect(function() {
    if (!isLive || !streamGoal.enabled) return;
    var t = setInterval(function() {
      setStreamGoal(function(prev) {
        if (!prev.enabled) return prev;
        var add = Math.floor(Math.random() * 150 + 25);
        var next = Math.min(prev.currentCents + add, prev.targetCents);
        return Object.assign({}, prev, { currentCents: next });
      });
    }, 9000);
    return function() { clearInterval(t); };
  }, [isLive, streamGoal.enabled]);

  function openGoLive() {
    setShowGoLiveModal(true);
  }

  function confirmGoLive() {
    if (!socket) return;
    var dests = [];
    GO_LIVE_PLATFORMS.forEach(function(p) {
      if (glDests[p.id]) {
        dests.push({ id: p.id, key: glKeys[p.id] || '', rtmp: p.rtmp || '' });
      }
    });
    socket.emit('go-live', { roomId: roomId, destinations: dests });
    setShowGoLiveModal(false);
  }

  function endBroadcast() {
    if (!socket) return;
    socket.emit('end-broadcast', { roomId: roomId });
    setIsLive(false);
    stopScreenShare();
  }

  function sendHandRaise() {
    if (!socket) return;
    socket.emit('hand-raise', { roomId: roomId, guestId: userId, username: username });
    addToast('✋ Hand raised! Waiting for host...', 'info');
  }

  function inviteToStage(item) {
    setStageGuests(function(s) {
      if (s.indexOf(item.guestId) >= 0) return s;
      if (s.length >= MAX_STAGE) { addToast('Stage full (' + MAX_STAGE + ' max)', 'error'); return s; }
      return s.concat([item.guestId]);
    });
    setHandQueue(function(q) { return q.filter(function(x) { return x.guestId !== item.guestId; }); });
    if (socket) socket.emit('stage-invite', { roomId: roomId, guestId: item.guestId });
    addToast(item.username + ' invited to stage', 'success');
  }

  function removeFromStage(gid) {
    if (gid === userId) return;
    setStageGuests(function(s) { return s.filter(function(x) { return x !== gid; }); });
    if (socket) socket.emit('stage-remove', { roomId: roomId, guestId: gid });
    addToast('Removed from stage', 'info');
  }

  function denyHand(gid) {
    setHandQueue(function(q) { return q.filter(function(x) { return x.guestId !== gid; }); });
  }

  function toggleMute() {
    var next = !isMuted;
    setIsMuted(next);
    addToast(next ? '🔇 Muted' : '🎙 Unmuted', 'info');
  }

  function toggleCam() {
    var next = !isCamOff;
    setIsCamOff(next);
    addToast(next ? '📵 Camera off' : '📷 Camera on', 'info');
  }

  async function toggleScreenShare() {
    if (isScreenShare) { stopScreenShare(); return; }
    try {
      var stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      var track = stream.getVideoTracks()[0];
      track.onended = function() { stopScreenShare(); };
      if (rtcManager && rtcReady) await rtcManager.replaceTrack('video', track);
      setIsScreenShare(true);
      setStageLayout('screen');
      addToast('📺 Screen sharing', 'success');
    } catch(e) {
      if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') addToast('Screen share: ' + e.message, 'error');
    }
  }

  function stopScreenShare() {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      screenStreamRef.current = null;
    }
    setIsScreenShare(false);
    if (stageLayout === 'screen') setStageLayout('panel');
  }

  function handleMediaApply(config) {
    setMediaConfig(config);
    setIsMuted(false);
    setIsCamOff(false);
  }

  // Build stage guest objects
  var allGuestMap = {};
  allGuestMap[userId] = { guestId: userId, username: username, role: role };
  guests.forEach(function(g) {
    var gid = g.guestId ? g.guestId : (g.userId ? g.userId : null);
    if (gid) allGuestMap[gid] = g;
  });
  var stagePeers = stageGuests.map(function(gid) {
    return allGuestMap[gid] || { guestId: gid, username: gid, role: 'guest' };
  });
  var featuredGuest = allGuestMap[featuredId] || stagePeers[0] || { guestId: userId, username: username, role: role };

  // Panel grid columns based on peer count
  var peerCount = Math.min(6, stagePeers.length);
  var panelGridCols = peerCount <= 1 ? '1fr' : peerCount <= 2 ? '1fr 1fr' : peerCount <= 4 ? '1fr 1fr' : '1fr 1fr 1fr';

  // mc-btn base style helper
  function mcBtnStyle(variant) {
    var base = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      padding: '8px 12px',
      minWidth: 44,
      border: '1px solid',
      borderRadius: 8,
      cursor: 'pointer',
      fontFamily: "'Barlow Condensed',sans-serif",
      fontWeight: 700,
      fontSize: 9,
      letterSpacing: 1,
      textTransform: 'uppercase',
      flexShrink: 0,
      transition: 'background 0.15s',
    };
    if (variant === 'danger') {
      return Object.assign({}, base, {
        background: 'rgba(255,26,60,.2)',
        borderColor: 'rgba(255,26,60,.5)',
        color: '#FF6B81',
      });
    }
    if (variant === 'live') {
      return Object.assign({}, base, {
        background: 'linear-gradient(135deg,#800020,#C01838)',
        borderColor: '#C01838',
        color: '#C9A84C',
      });
    }
    if (variant === 'active') {
      return Object.assign({}, base, {
        background: 'rgba(0,222,192,.1)',
        borderColor: 'rgba(0,222,192,.35)',
        color: '#00DEC0',
      });
    }
    // default / inactive
    return Object.assign({}, base, {
      background: 'rgba(22,16,32,.7)',
      borderColor: '#241C34',
      color: '#7A6F90',
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0F0C14', overflow: 'hidden', fontFamily: "'Barlow Condensed',sans-serif" }}>
      {showConfig && <MediaConfigPanel onClose={function() { setShowConfig(false); }} onApply={handleMediaApply} addToast={addToast} />}

      {/* Broadcast bar */}
      {isLive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(255,26,60,.08)', borderBottom: '1px solid rgba(255,26,60,.25)', flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 6px #FF1A3C', animation: 'liveBlink 1s infinite', flexShrink: 0 }} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF6B81' }}>BROADCASTING LIVE</span>
          {isMuted && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF1A3C', marginLeft: 'auto' }}>⚠ YOU ARE MUTED</span>}
        </div>
      )}

      {/* Stage root */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Stage toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'rgba(10,7,18,.9)', borderBottom: '1px solid #241C34', flexShrink: 0, overflowX: 'auto' }}>
          {LAYOUTS.map(function(l) {
            var isActive = stageLayout === l.id;
            return (
              <button key={l.id}
                onClick={function() { setStageLayout(l.id); }}
                style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, padding: '4px 8px', background: isActive ? 'rgba(0,222,192,.12)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (isActive ? 'rgba(0,222,192,.4)' : '#241C34'), borderRadius: 4, color: isActive ? '#00DEC0' : '#7A6F90', cursor: 'pointer', flexShrink: 0, letterSpacing: 1 }}>
                {l.label}
              </button>
            );
          })}
          <button
            onClick={function() { setShowGuests(function(v) { return !v; }); }}
            style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, padding: '4px 8px', background: showGuests ? 'rgba(90,143,255,.15)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (showGuests ? 'rgba(90,143,255,.4)' : '#241C34'), borderRadius: 4, color: showGuests ? '#5A8FFF' : '#7A6F90', cursor: 'pointer', flexShrink: 0 }}>
            👥 {guests.length}
          </button>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1, marginLeft: 'auto', flexShrink: 0 }}>{stagePeers.length}/{MAX_STAGE} ON STAGE</span>
        </div>

        {/* GUESTS LIST MODE */}
        {showGuests && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {guests.length === 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90', textAlign: 'center', padding: 20 }}>No viewers online</div>}
            {guests.map(function(g) {
              var gid   = g.guestId ? g.guestId : g.userId;
              var onStage = stageGuests.indexOf(gid) >= 0;
              return (
                <div key={gid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(22,16,32,.7)', border: '1px solid ' + (onStage ? 'rgba(0,201,167,.3)' : '#241C34'), borderRadius: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#161020', border: '1px solid #241C34', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#EDE8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.username || gid}</div>
                    <RolePill role={g.role || 'viewer'} />
                  </div>
                  {onStage && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#00C9A7' }}>ON STAGE</span>}
                  {role === 'host' && !onStage && (
                    <button onClick={function() { inviteToStage({ guestId: gid, username: g.username || gid }); }}
                      style={{ background: 'rgba(0,201,167,.12)', border: '1px solid rgba(0,201,167,.35)', borderRadius: 6, padding: '4px 8px', color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0 }}>
                      + INVITE
                    </button>
                  )}
                  {role === 'host' && onStage && gid !== userId && (
                    <button onClick={function() { removeFromStage(gid); }}
                      style={{ background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 6, padding: '4px 8px', color: '#FF6B81', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0 }}>
                      REMOVE
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SOLO layout */}
        {!showGuests && stageLayout === 'solo' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', background: '#0a0710' }}>
            {featuredGuest ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <OctCell
                  guest={featuredGuest}
                  sz={undefined}
                  isHost={role === 'host'}
                  fadesMode={false}
                  branding={branding}
                  onTap={null}
                  socket={socket}
                  roomId={roomId}
                  userId={userId}
                  rtcManager={rtcReady ? rtcManager : null}
                  mediaConfig={featuredGuest.guestId === userId ? mediaConfig : null}
                  isMuted={featuredGuest.guestId === userId ? isMuted : false}
                  isCamOff={featuredGuest.guestId === userId ? isCamOff : false}
                  onMuteToggle={featuredGuest.guestId === userId ? toggleMute : null}
                  onCamToggle={featuredGuest.guestId === userId ? toggleCam : null}
                />
                <LowerThird name={featuredGuest.username || featuredGuest.guestId} role={featuredGuest.role || role} isMuted={featuredGuest.guestId === userId && isMuted} isCamOff={featuredGuest.guestId === userId && isCamOff} isLive={isLive} />
                {stagePeers.length > 1 && (
                  <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, display: 'flex', gap: 4, padding: '0 8px', justifyContent: 'center', zIndex: 25 }}>
                    {stagePeers.filter(function(g) { var gid = g.guestId ? g.guestId : g.userId; return gid !== featuredId; }).map(function(g) {
                      var gid = g.guestId ? g.guestId : g.userId;
                      return (
                        <button key={gid} onClick={function() { setFeaturedId(gid); }}
                          style={{ background: 'rgba(7,5,10,.8)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '3px 8px', color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                          {g.username || gid}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#7A6F90' }}>
                <div style={{ fontSize: 36 }}>🎙</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: 'rgba(201,168,76,.4)', letterSpacing: 3 }}>NO SIGNAL</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>Waiting for camera...</div>
              </div>
            )}
          </div>
        )}

        {/* PANEL layout */}
        {!showGuests && stageLayout === 'panel' && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: panelGridCols, gap: 2, padding: 2, overflow: 'hidden', background: '#0a0710', alignContent: 'start' }}>
            {stagePeers.map(function(g) {
              var gid  = g.guestId ? g.guestId : (g.userId ? g.userId : 'x');
              var isOwn = gid === userId;
              var isFeatured = gid === featuredId;
              return (
                <div key={gid}
                  onClick={function() { setFeaturedId(gid); }}
                  style={{ position: 'relative', border: '2px solid ' + (isFeatured ? '#00DEC0' : 'rgba(255,255,255,.07)'), borderRadius: 6, overflow: 'hidden', cursor: 'pointer', aspectRatio: '16/9', background: '#0a0710' }}>
                  <OctCell
                    guest={g}
                    sz={120}
                    isHost={role === 'host'}
                    fadesMode={false}
                    branding={branding}
                    onTap={null}
                    socket={socket}
                    roomId={roomId}
                    userId={userId}
                    rtcManager={rtcReady ? rtcManager : null}
                    mediaConfig={isOwn ? mediaConfig : null}
                    isMuted={isOwn ? isMuted : false}
                    isCamOff={isOwn ? isCamOff : false}
                    onMuteToggle={isOwn ? toggleMute : null}
                    onCamToggle={isOwn ? toggleCam : null}
                  />
                  {overlayConfig && overlayConfig.lowerThirds && overlayConfig.lowerThirds[gid] && overlayConfig.lowerThirds[gid].visible
                    ? <OverlayCustomLT lowerThirds={overlayConfig.lowerThirds} guestId={gid} />
                    : <LowerThird name={g.username || gid} role={g.role || 'viewer'} isMuted={isOwn && isMuted} isCamOff={isOwn && isCamOff} isLive={isLive} />
                  }
                  {!isOwn && role === 'host' && (
                    <button onClick={function(e) { e.stopPropagation(); removeFromStage(gid); }}
                      style={{ position: 'absolute', top: 5, left: 5, zIndex: 30, background: 'rgba(255,26,60,.7)', border: 'none', borderRadius: 4, width: 20, height: 20, color: '#fff', fontSize: 10, cursor: 'pointer' }}>✕</button>
                  )}
                  {/* Expand button — Bigo style */}
                  <button
                    onClick={function(e) { e.stopPropagation(); setExpandedId(gid); setStageLayout('expand'); }}
                    title="Expand panel"
                    style={{ position: 'absolute', top: 5, right: 5, zIndex: 30, background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 4, width: 20, height: 20, color: '#EDE8F5', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⛶</button>
                </div>
              );
            })}
          </div>
        )}

        {/* EXPAND layout — Bigo-style: one large cell + thumbnail strip */}
        {!showGuests && stageLayout === 'expand' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: 2, padding: 2, overflow: 'hidden', background: '#0a0710' }}>
            {/* Main large panel */}
            <div style={{ flex: 1, position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#070510' }}>
              {(function() {
                var expId = expandedId || (stagePeers[0] ? (stagePeers[0].guestId || stagePeers[0].userId) : null);
                var expGuest = null;
                for (var i = 0; i < stagePeers.length; i++) {
                  var sg = stagePeers[i];
                  if ((sg.guestId || sg.userId) === expId) { expGuest = sg; break; }
                }
                if (!expGuest && stagePeers.length > 0) expGuest = stagePeers[0];
                if (!expGuest) return null;
                var expGid = expGuest.guestId || expGuest.userId;
                var expIsOwn = expGid === userId;
                return (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <OctCell
                      guest={expGuest}
                      sz={480}
                      isHost={role === 'host'}
                      fadesMode={false}
                      branding={branding}
                      onTap={null}
                      socket={socket}
                      roomId={roomId}
                      userId={userId}
                      rtcManager={rtcReady ? rtcManager : null}
                      mediaConfig={expIsOwn ? mediaConfig : null}
                      isMuted={expIsOwn ? isMuted : false}
                      isCamOff={expIsOwn ? isCamOff : false}
                      onMuteToggle={expIsOwn ? toggleMute : null}
                      onCamToggle={expIsOwn ? toggleCam : null}
                    />
                    <LowerThird name={expGuest.username || expGid} role={expGuest.role || 'viewer'} isMuted={expIsOwn && isMuted} isCamOff={expIsOwn && isCamOff} isLive={isLive} />
                    {/* Collapse back to panel */}
                    <button
                      onClick={function() { setStageLayout('panel'); setExpandedId(null); }}
                      style={{ position: 'absolute', top: 10, right: 10, zIndex: 40, background: 'rgba(0,0,0,.75)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 6, padding: '4px 10px', color: '#EDE8F5', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1 }}>
                      ✕ COLLAPSE
                    </button>
                    {/* Expand badge */}
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,201,167,.15)', border: '1px solid rgba(0,201,167,.4)', borderRadius: 4, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#00C9A7', letterSpacing: 1 }}>
                      ⛶ EXPANDED
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Thumbnail strip — other cells */}
            <div style={{ width: 118, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flexShrink: 0 }}>
              {stagePeers.map(function(g) {
                var gid = g.guestId ? g.guestId : (g.userId ? g.userId : 'x');
                var isExpanded = gid === (expandedId || (stagePeers[0] ? (stagePeers[0].guestId || stagePeers[0].userId) : null));
                var isOwn = gid === userId;
                return (
                  <div key={gid}
                    onClick={function() { setExpandedId(gid); }}
                    style={{ position: 'relative', flexShrink: 0, height: 78, border: '2px solid ' + (isExpanded ? '#00DEC0' : 'rgba(255,255,255,.07)'), borderRadius: 6, overflow: 'hidden', cursor: 'pointer', background: '#0a0710' }}>
                    <OctCell
                      guest={g}
                      sz={114}
                      isHost={role === 'host'}
                      fadesMode={false}
                      branding={branding}
                      onTap={null}
                      socket={socket}
                      roomId={roomId}
                      userId={userId}
                      rtcManager={rtcReady ? rtcManager : null}
                      mediaConfig={isOwn ? mediaConfig : null}
                      isMuted={isOwn ? isMuted : false}
                      isCamOff={isOwn ? isCamOff : false}
                      onMuteToggle={null}
                      onCamToggle={null}
                    />
                    {isExpanded && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,201,167,.3)', padding: '2px 0', textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#00C9A7' }}>EXPANDED</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TALK layout */}
        {!showGuests && stageLayout === 'talk' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', background: '#0a0710', gap: 2, padding: 2 }}>
            <div style={{ flex: 1, position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#0a0710' }}>
              {featuredGuest && (
                <>
                  <OctCell
                    guest={featuredGuest}
                    sz={undefined}
                    isHost={role === 'host'}
                    fadesMode={false}
                    branding={branding}
                    onTap={null}
                    socket={socket}
                    roomId={roomId}
                    userId={userId}
                    rtcManager={rtcReady ? rtcManager : null}
                    mediaConfig={featuredGuest.guestId === userId ? mediaConfig : null}
                    isMuted={featuredGuest.guestId === userId ? isMuted : false}
                    isCamOff={featuredGuest.guestId === userId ? isCamOff : false}
                    onMuteToggle={featuredGuest.guestId === userId ? toggleMute : null}
                    onCamToggle={featuredGuest.guestId === userId ? toggleCam : null}
                  />
                  <LowerThird name={featuredGuest.username || featuredGuest.guestId} role={featuredGuest.role || role} isMuted={featuredGuest.guestId === userId && isMuted} isCamOff={featuredGuest.guestId === userId && isCamOff} isLive={isLive} />
                </>
              )}
            </div>
            <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flexShrink: 0 }}>
              {stagePeers.filter(function(g) { var gid = g.guestId ? g.guestId : g.userId; return gid !== featuredId; }).map(function(g) {
                var gid  = g.guestId ? g.guestId : (g.userId ? g.userId : 'x');
                var isOwn = gid === userId;
                return (
                  <div key={gid}
                    onClick={function() { setFeaturedId(gid); }}
                    style={{ position: 'relative', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)', cursor: 'pointer', aspectRatio: '16/9', background: '#0a0710', flexShrink: 0 }}>
                    <OctCell guest={g} sz={90} isHost={role === 'host'} fadesMode={false} branding={branding} onTap={null} socket={socket} roomId={roomId} userId={userId} rtcManager={rtcReady ? rtcManager : null}
                      mediaConfig={isOwn ? mediaConfig : null} isMuted={isOwn ? isMuted : false} isCamOff={isOwn ? isCamOff : false}
                      onMuteToggle={isOwn ? toggleMute : null} onCamToggle={isOwn ? toggleCam : null} />
                    <LowerThird name={g.username || gid} role={g.role || 'viewer'} isMuted={isOwn && isMuted} isCamOff={isOwn && isCamOff} isLive={isLive} />
                  </div>
                );
              })}
              {stagePeers.length < MAX_STAGE && role === 'host' && (
                <div style={{ border: '1px dashed rgba(201,168,76,.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '16/9', cursor: 'pointer', color: 'rgba(201,168,76,.3)', fontFamily: "'DM Mono',monospace", fontSize: 8 }}
                  onClick={function() { setShowGuests(true); }}>
                  + INVITE
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCREEN layout */}
        {!showGuests && stageLayout === 'screen' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', background: '#0a0710', gap: 2, padding: 2 }}>
            <div style={{ flex: 1, position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#0a0710' }}>
              {isScreenShare ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🖥</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#5A8FFF', letterSpacing: 2 }}>SCREEN SHARING</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginTop: 4 }}>Your screen is broadcasting to viewers</div>
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ fontSize: 36 }}>🖥</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: 'rgba(90,143,255,.5)', letterSpacing: 2 }}>NO SCREEN SHARE</div>
                  <button onClick={toggleScreenShare}
                    style={{ background: 'rgba(90,143,255,.15)', border: '1px solid rgba(90,143,255,.4)', borderRadius: 8, padding: '8px 16px', color: '#5A8FFF', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    🖥 START SCREEN SHARE
                  </button>
                </div>
              )}
            </div>
            <div style={{ width: 100, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flexShrink: 0 }}>
              {stagePeers.map(function(g) {
                var gid  = g.guestId ? g.guestId : (g.userId ? g.userId : 'x');
                var isOwn = gid === userId;
                return (
                  <div key={gid} style={{ position: 'relative', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)', background: '#0a0710', aspectRatio: '16/9', flexShrink: 0 }}>
                    <OctCell guest={g} sz={80} isHost={role === 'host'} fadesMode={false} branding={branding} onTap={null} socket={socket} roomId={roomId} userId={userId} rtcManager={rtcReady ? rtcManager : null}
                      mediaConfig={isOwn ? mediaConfig : null} isMuted={isOwn ? isMuted : false} isCamOff={isOwn ? isCamOff : false}
                      onMuteToggle={isOwn ? toggleMute : null} onCamToggle={isOwn ? toggleCam : null} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Stage overlays */}
        {overlayConfig && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 28, pointerEvents: 'none' }}>
            <OverlayBanner    banner={overlayConfig.banner} />
            <OverlayCountdown countdown={overlayConfig.countdown} />
            <OverlayScoreBug  scoreBug={overlayConfig.scoreBug} />
          </div>
        )}
      </div>

      {/* Hand raise queue (host only) */}
      {role === 'host' && handQueue.length > 0 && (
        <div style={{ background: 'rgba(22,16,32,.9)', borderTop: '1px solid rgba(201,168,76,.2)', padding: '6px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 1 }}>
            <span>✋ RAISE QUEUE ({handQueue.length})</span>
          </div>
          {handQueue.map(function(item) {
            return (
              <div key={item.guestId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                <span style={{ fontSize: 14 }}>✋</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#EDE8F5', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.username}</span>
                <button onClick={function() { inviteToStage(item); }}
                  style={{ background: 'rgba(0,201,167,.12)', border: '1px solid rgba(0,201,167,.35)', borderRadius: 5, padding: '3px 8px', color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0 }}>
                  INVITE
                </button>
                <button onClick={function() { denyHand(item.guestId); }}
                  style={{ background: 'transparent', border: '1px solid rgba(255,26,60,.3)', borderRadius: 5, padding: '3px 6px', color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', flexShrink: 0 }}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Live stats strip */}
      {isLive && (
        <div style={{ display: 'flex', gap: 6, padding: '5px 12px', background: 'rgba(7,5,10,.8)', borderTop: '1px solid rgba(255,26,60,.15)', flexShrink: 0, overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 5px #FF1A3C' }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF6B81' }}>LIVE</span>
          </div>
          <div style={{ width: 1, background: '#241C34', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>⏱</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>{fmtUptime(uptime)}</span>
          </div>
          <div style={{ width: 1, background: '#241C34', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>👁</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#EDE8F5' }}>{viewerCount || 0}</span>
          </div>
          <div style={{ width: 1, background: '#241C34', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>🎙</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: stageGuests.length > 0 ? '#00C9A7' : '#7A6F90' }}>{stageGuests.length} on stage</span>
          </div>
          {isMuted && (
            <>
              <div style={{ width: 1, background: '#241C34', flexShrink: 0 }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF1A3C' }}>⚠ MUTED</span>
            </>
          )}
        </div>
      )}

      {/* Go Live modal */}
      {showGoLiveModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: '#0F0C14', border: '1px solid rgba(201,168,76,.4)', borderRadius: 14, padding: '20px', maxWidth: 380, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C', letterSpacing: 4, marginBottom: 4 }}>🔴 GO LIVE</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 16 }}>Select destinations · SeeWhy is always included</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {GO_LIVE_PLATFORMS.map(function(p) {
                var isOn = Boolean(glDests[p.id]);
                return (
                  <div key={p.id} style={{ background: isOn ? p.color + '0d' : 'rgba(22,16,32,.5)', border: '1px solid ' + (isOn ? p.color + '55' : '#241C34'), borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: p.color + '22', border: '1px solid ' + p.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: p.color, flexShrink: 0 }}>{p.icon}</div>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: isOn ? '#EDE8F5' : '#7A6F90', flex: 1 }}>{p.name}</span>
                      {p.locked ? (
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>ALWAYS ON</span>
                      ) : (
                        <button
                          onClick={function() { setGlDests(function(d) { return Object.assign({}, d, { [p.id]: !d[p.id] }); }); }}
                          style={{ width: 38, height: 20, borderRadius: 10, background: isOn ? p.color : '#241C34', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                          <div style={{ position: 'absolute', top: 2, left: isOn ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
                        </button>
                      )}
                    </div>
                    {isOn && !p.locked && (
                      <input
                        value={glKeys[p.id] || ''}
                        onChange={function(e) { var v = e.target.value; setGlKeys(function(k) { return Object.assign({}, k, { [p.id]: v }); }); }}
                        placeholder={'Stream key for ' + p.name + '...'}
                        type="password"
                        autoComplete="off"
                        style={{ marginTop: 8, width: '100%', background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '6px 10px', color: '#EDE8F5', fontFamily: "'DM Mono',monospace", fontSize: 10, boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setShowGoLiveModal(false); }}
                style={{ flex: 1, padding: '11px', background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 8, color: '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={confirmGoLive}
                style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                🔴 GO LIVE NOW
              </button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', textAlign: 'center', marginTop: 10 }}>
              Destinations with no key will use your saved vault key.
            </div>
          </div>
        </div>
      )}

      {/* Media controls bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'rgba(10,7,18,.95)', borderTop: '1px solid #241C34', flexShrink: 0, overflowX: 'auto' }}>
        <button onClick={toggleMute} style={mcBtnStyle(isMuted ? 'danger' : 'active')}>
          <span style={{ fontSize: 14 }}>{isMuted ? '🔇' : '🎙'}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1 }}>{isMuted ? 'MUTED' : 'MIC'}</span>
        </button>
        <button onClick={toggleCam} style={mcBtnStyle(isCamOff ? 'danger' : 'active')}>
          <span style={{ fontSize: 14 }}>{isCamOff ? '📵' : '📷'}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1 }}>{isCamOff ? 'OFF' : 'CAM'}</span>
        </button>
        <button onClick={toggleScreenShare} style={mcBtnStyle(isScreenShare ? 'danger' : '')}>
          <span style={{ fontSize: 14 }}>🖥</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1 }}>{isScreenShare ? 'STOP' : 'SCREEN'}</span>
        </button>
        <button onClick={function() { setShowConfig(true); }} style={mcBtnStyle('')}>
          <span style={{ fontSize: 14 }}>⚙️</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1 }}>CONFIG</span>
        </button>
        <div style={{ width: 1, background: '#241C34', alignSelf: 'stretch', flexShrink: 0, margin: '2px 4px' }} />
        {role === 'host' && !isLive && (
          <button onClick={openGoLive} style={Object.assign({}, mcBtnStyle('live'), { minWidth: 56 })}>
            <span style={{ fontSize: 14 }}>🔴</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1 }}>GO LIVE</span>
          </button>
        )}
        {role === 'host' && isLive && (
          <button onClick={endBroadcast} style={Object.assign({}, mcBtnStyle('danger'), { minWidth: 56 })}>
            <span style={{ fontSize: 14 }}>⏹</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1 }}>END</span>
          </button>
        )}
        {role !== 'host' && (
          <button onClick={sendHandRaise} style={Object.assign({}, mcBtnStyle(''), { animation: 'beat 1.5s infinite' })}>
            <span style={{ fontSize: 14 }}>✋</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1 }}>RAISE</span>
          </button>
        )}
      </div>

      {/* Stream Goal bar */}
      {streamGoal.enabled && (
        <div style={{ background: 'rgba(0,201,106,.07)', borderTop: '1px solid rgba(0,201,106,.2)', padding: '7px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#00C96A', letterSpacing: 1 }}>🎯 {streamGoal.label}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#00C96A' }}>
              ${(Math.floor(streamGoal.currentCents) / 100).toFixed(0)} / ${(Math.floor(streamGoal.targetCents) / 100).toFixed(0)}
            </span>
          </div>
          <div style={{ background: '#1A1428', borderRadius: 999, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#00C96A,#00DEC0)', borderRadius: 999, width: Math.floor(Math.min(streamGoal.currentCents / streamGoal.targetCents * 100, 100)) + '%', transition: 'width .6s ease' }} />
          </div>
          {isLive && role === 'host' && (
            <button onClick={function() { setStreamGoal(function(p) { return Object.assign({}, p, { enabled: false }); }); }}
              style={{ background: 'none', border: 'none', color: '#7A6F90', fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer', padding: 0, marginTop: 3 }}>
              ✕ hide goal
            </button>
          )}
        </div>
      )}

      {/* Collapsible chat */}
      <div style={{ borderTop: '1px solid #241C34', background: 'rgba(10,7,18,.9)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={function() { setChatOpen(function(v) { return !v; }); }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#EDE8F5' }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>💬 LIVE CHAT {chat.length > 0 ? '(' + chat.length + ')' : ''}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9 }}>{chatOpen ? '▼' : '▲'}</span>
          </button>
          {isLive && role === 'host' && !streamGoal.enabled && (
            <button
              onClick={function() { setStreamGoal(function(p) { return Object.assign({}, p, { enabled: true, currentCents: 0 }); }); }}
              title="Set stream goal"
              style={{ background: 'none', border: 'none', padding: '0 10px', color: '#7A6F90', cursor: 'pointer', fontSize: 13 }}>🎯</button>
          )}
        </div>

        {/* Pinned message */}
        {pinnedMsg && chatOpen && (
          <div style={{ background: 'rgba(201,168,76,.1)', borderBottom: '1px solid rgba(201,168,76,.25)', padding: '5px 12px', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <span style={{ fontSize: 10, flexShrink: 0, marginTop: 1 }}>📌</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 1, marginBottom: 2 }}>PINNED</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#EDE8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#C9A84C', fontWeight: 700, marginRight: 4 }}>{pinnedMsg.username}</span>
                {pinnedMsg.message}
              </div>
            </div>
            {role === 'host' && (
              <button onClick={unpinMessage} style={{ background: 'none', border: 'none', color: '#7A6F90', cursor: 'pointer', fontSize: 10, flexShrink: 0, padding: 0 }}>✕</button>
            )}
          </div>
        )}

        {chatOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 200 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {chat.length === 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', textAlign: 'center', padding: 12 }}>No messages yet</div>}
              {chat.map(function(msg) {
                var msgId = msg.id || (msg.username + msg.message);
                var msgReactions = reactions[msgId] || {};
                var emojiList = ['👍','❤️','🔥','😂','🎯'];
                return (
                  <div key={msgId} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, flexWrap: 'wrap' }}>
                      <span style={{ color: '#C9A84C', fontWeight: 700, marginRight: 5 }}>{msg.username || 'anon'}</span>
                      <span style={{ color: '#D0C0E0', flex: 1 }}>{msg.message}</span>
                      {role === 'host' && (
                        <button onClick={function() { pinMessage(msg); }}
                          title="Pin message"
                          style={{ background: 'none', border: 'none', color: '#7A6F90', cursor: 'pointer', fontSize: 9, padding: '0 2px', flexShrink: 0, opacity: 0.6 }}>📌</button>
                      )}
                    </div>
                    {/* Emoji reactions */}
                    <div style={{ display: 'flex', gap: 3, marginTop: 2, flexWrap: 'wrap' }}>
                      {emojiList.map(function(emoji) {
                        var count = msgReactions[emoji] || 0;
                        return (
                          <button key={emoji}
                            onClick={function() { addReaction(msgId, emoji); }}
                            style={{ background: count > 0 ? 'rgba(201,168,76,.15)' : 'transparent', border: count > 0 ? '1px solid rgba(201,168,76,.3)' : '1px solid transparent', borderRadius: 10, padding: '1px 5px', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', gap: 2, color: '#A09AB8' }}>
                            {emoji}{count > 0 ? <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7 }}>{count}</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderTop: '1px solid rgba(36,28,52,.6)', flexShrink: 0 }}>
              <input value={chatInput} onChange={function(e) { setChatInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') sendChat(); }}
                placeholder="Say something..."
                maxLength={200}
                style={{ flex: 1, background: '#0F0C14', border: '1px solid #241C34', borderRadius: 6, padding: '6px 10px', color: '#D0C0E0', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }} />
              <button onClick={sendChat}
                style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 6, padding: '6px 14px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                SEND
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
