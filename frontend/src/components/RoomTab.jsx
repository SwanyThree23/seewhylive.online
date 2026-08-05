import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';
import OctCell from './OctCell.jsx';
import MediaConfigPanel from './MediaConfigPanel.jsx';
import rtcManager from '../webrtc.js';

var MAX_STAGE = 20;
var LAYOUTS = [
  { id: 'panel',      label: '⊞ PANEL'   },
  { id: 'solo',       label: '◻ SOLO'    },
  { id: 'talk',       label: '⊡ TALK'    },
  { id: 'screen',     label: '🖥 SCRN'    },
  { id: 'expand',     label: '⛶ EXPAND'  },
  { id: 'watchparty', label: '📺 WATCH'   },
  { id: 'battle',     label: '⚡ BATTLE'  },
];

function RolePill({ role }) {
  var colors = { host: '#C9A84C', cohost: '#D4854A', guest: '#C9A84C', viewer: 'rgba(138,122,98,.5)' };
  var bg     = { host: 'rgba(201,168,76,.18)', cohost: 'rgba(212,133,74,.15)', guest: 'rgba(201,168,76,.12)', viewer: 'rgba(61,48,32,.6)' };
  var r      = role || 'viewer';
  return (
    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 5px', borderRadius: 3, background: bg[r] || bg.viewer, color: colors[r] || colors.viewer, flexShrink: 0 }}>
      {r}
    </span>
  );
}

function LowerThird({ name, role, isMuted, isCamOff, isLive }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 10px 8px', background: 'linear-gradient(transparent,rgba(14,12,9,.85))', zIndex: 20, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#F0E8D4', letterSpacing: 1, textShadow: '0 1px 6px rgba(0,0,0,.8)', lineHeight: 1.1 }}>{name}</div>
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
    <div style={{ position: 'absolute', [isTop ? 'top' : 'bottom']: 0, left: 0, right: 0, zIndex: 30, pointerEvents: 'none', padding: isTop ? '10px 16px 20px' : '20px 16px 10px', background: isTop ? 'linear-gradient(rgba(14,12,9,.85),transparent)' : 'linear-gradient(transparent,rgba(14,12,9,.85))' }}>
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
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 35, pointerEvents: 'none', textAlign: 'center', background: 'rgba(14,12,9,.75)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 12, padding: '14px 24px', backdropFilter: 'blur(8px)' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 3, marginBottom: 4 }}>{countdown.label || 'STARTING SOON'}</div>
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
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#F0E8D4', letterSpacing: 2 }}>{scoreBug.team1.name || 'TEAM 1'}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, color: '#C9A84C', lineHeight: 1 }}>{scoreBug.team1.score}</div>
        </div>
        <div style={{ padding: '5px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#8A7A62', letterSpacing: 1 }}>{scoreBug.label || ''}</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 10, color: '#FF6B81' }}>VS</div>
        </div>
        <div style={{ padding: '5px 10px', textAlign: 'center', borderLeft: '1px solid rgba(201,168,76,.2)' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#F0E8D4', letterSpacing: 2 }}>{scoreBug.team2.name || 'TEAM 2'}</div>
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
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 25, pointerEvents: 'none', padding: '24px 10px 8px', background: 'linear-gradient(transparent,rgba(14,12,9,.9))' }}>
      <div style={{ borderLeft: '3px solid #C9A84C', paddingLeft: 7 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#F0E8D4', letterSpacing: 2, lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,.9)' }}>{lt.name}</div>
        {lt.title && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', marginTop: 2, letterSpacing: 1 }}>{lt.title}</div>}
      </div>
    </div>
  );
}

var LANG_FLAGS = {
  'EN':'🇺🇸','ES':'🇪🇸','PT':'🇧🇷','FR':'🇫🇷','DE':'🇩🇪','JA':'🇯🇵',
  'ZH':'🇨🇳','KO':'🇰🇷','AR':'🇸🇦','RU':'🇷🇺','HI':'🇮🇳','IT':'🇮🇹',
  'NL':'🇳🇱','PL':'🇵🇱','TR':'🇹🇷','VI':'🇻🇳','UNK':'🌐'
};
var LANG_NAMES = {
  'EN':'English','ES':'Español','PT':'Português','FR':'Français','DE':'Deutsch',
  'JA':'日本語','ZH':'中文','KO':'한국어','AR':'العربية','RU':'Русский',
  'HI':'हिन्दी','IT':'Italiano','NL':'Nederlands','PL':'Polski','TR':'Türkçe','VI':'Tiếng Việt'
};
var PICKER_LANGS = ['EN','ES','PT','FR','DE','JA','ZH','KO','AR','RU','HI','IT'];

var SC_TIERS = [
  { amount: 100,  label: '$1',  color: '#C9A84C', bg: 'rgba(201,168,76,.18)'  },
  { amount: 200,  label: '$2',  color: '#C9A84C', bg: 'rgba(201,168,76,.18)'   },
  { amount: 500,  label: '$5',  color: '#C9A84C', bg: 'rgba(201,168,76,.22)'  },
  { amount: 1000, label: '$10', color: '#FF8C42', bg: 'rgba(255,140,66,.22)'  },
  { amount: 2000, label: '$20', color: '#FF1A3C', bg: 'rgba(255,26,60,.22)'   },
  { amount: 5000, label: '$50', color: '#800020', bg: 'rgba(128,0,32,.22)'   },
];
var REACT_EMOJIS = ['🔥', '❤️', '💯', '😂', '🎯', '💎'];

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
  var [activeBattle,   setActiveBattle]   = useState(null);
  var [battleScores,   setBattleScores]   = useState({ a: 0, b: 0 });
  var [watchPartyUrl,  setWatchPartyUrl]  = useState('');
  var [activePoll,     setActivePoll]     = useState(null);
  var [myVote,         setMyVote]         = useState(-1);
  var [showPollModal,  setShowPollModal]  = useState(false);
  var [pollQuestion,   setPollQuestion]   = useState('');
  var [pollOpts,       setPollOpts]       = useState(['', '']);
  var [chatLang,       setChatLang]       = useState(function() { try { return localStorage.getItem('sw_chat_lang') || 'EN'; } catch(e) { return 'EN'; } });
  var [showLangPicker, setShowLangPicker] = useState(false);
  var [showTx,         setShowTx]         = useState({});
  var [txTexts,        setTxTexts]        = useState({});
  var [txLoading,       setTxLoading]       = useState({});
  var [superChats,      setSuperChats]      = useState([]);
  var [showScModal,     setShowScModal]     = useState(false);
  var [scMsg,           setScMsg]           = useState('');
  var [scAmount,        setScAmount]        = useState(100);
  var [floatReacts,     setFloatReacts]     = useState([]);
  var [giftLeaderboard, setGiftLeaderboard] = useState([]);
  var [showLeaderboard, setShowLeaderboard] = useState(false);
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

  // Warm up camera+mic permissions as soon as RoomTab mounts so the browser
  // grants access before OctCell's getUserMedia fires (avoids a second prompt)
  useEffect(function() {
    if (role === 'viewer') return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(function(s) { s.getTracks().forEach(function(t) { t.stop(); }); })
      .catch(function() {});
  }, []);

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
    socket.on('pk-start', function(data) {
      if (!data) return;
      setActiveBattle({ challenger: data.challenger || 'CHALLENGER', defender: data.defender || 'DEFENDER', durationSec: data.duration || 180, startTs: Date.now() });
      setBattleScores({ a: 0, b: 0 });
      setStageLayout('battle');
    });
    socket.on('pk-vote-update', function(data) {
      if (!data) return;
      setBattleScores({ a: data.challengerVotes || 0, b: data.defenderVotes || 0 });
    });
    socket.on('pk-end', function() {
      setActiveBattle(null);
      setBattleScores({ a: 0, b: 0 });
    });
    socket.on('watch-party-url', function(data) {
      if (!data || !data.url) return;
      setWatchPartyUrl(data.url);
      setStageLayout('watchparty');
    });
    socket.on('watch-party-started', function(data) {
      setStageLayout('watchparty');
      if (data && data.url) setWatchPartyUrl(data.url);
    });
    socket.on('join-room-ack', function(ackData) {
      if (ackData && ackData.watchParty && ackData.watchParty.url) {
        setWatchPartyUrl(ackData.watchParty.url);
      }
    });
    socket.on('poll-update', function(poll) {
      if (!poll) return;
      setActivePoll(poll);
      if (!poll.active) {
        setTimeout(function() { setActivePoll(null); setMyVote(-1); }, 4000);
      }
    });
    socket.on('clip-marked', function(data) {
      if (data && data.label) addToast('📎 Clip: ' + data.label, 'success');
    });
    socket.on('chat-react-update', function(data) {
      if (!data || !data.msgId) return;
      setReactions(function(prev) {
        var next = Object.assign({}, prev);
        next[data.msgId] = data.reactions || {};
        return next;
      });
    });
    socket.on('super-chat', function(sc) {
      if (!sc) return;
      setSuperChats(function(prev) { return prev.concat([sc]).slice(-20); });
    });
    socket.on('react-burst', function(data) {
      if (!data || !data.emoji) return;
      var rid = Date.now() + Math.random();
      var leftPct = 60 + Math.floor(Math.random() * 30);
      setFloatReacts(function(prev) { return prev.concat([{ id: rid, emoji: data.emoji, left: leftPct }]); });
      setTimeout(function() {
        setFloatReacts(function(prev) { return prev.filter(function(r) { return r.id !== rid; }); });
      }, 3600);
    });
    socket.on('gift-leaderboard', function(data) {
      if (!data || !data.leaders) return;
      setGiftLeaderboard(data.leaders.map(function(e) {
        return { username: e.username, total: e.totalCents, count: 1 };
      }));
    });
    socket.on('gift-received', function(gift) {
      if (!gift || !gift.fromUser) return;
      setGiftLeaderboard(function(prev) {
        var next = prev.slice();
        var found = false;
        for (var li = 0; li < next.length; li++) {
          if (next[li].username === gift.fromUser) {
            next[li] = Object.assign({}, next[li], { total: next[li].total + gift.valueCents, count: next[li].count + 1 });
            found = true;
            break;
          }
        }
        if (!found) next.push({ username: gift.fromUser, total: gift.valueCents, count: 1 });
        next.sort(function(a, b) { return b.total - a.total; });
        return next.slice(0, 10);
      });
    });
    return function() {
      socket.off('join-room-ack');
      socket.off('hand-raise');
      socket.off('stage-invite');
      socket.off('stage-remove');
      socket.off('poll-update');
      socket.off('clip-marked');
      socket.off('chat-react-update');
      socket.off('super-chat');
      socket.off('react-burst');
      socket.off('gift-received');
      socket.off('pk-start');
      socket.off('pk-vote-update');
      socket.off('pk-end');
      socket.off('watch-party-started');
      socket.off('watch-party-url');
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
    var msg = chatInput.trim();
    var optimisticMsg = { id: 'opt-' + Date.now(), userId: userId, username: username, message: msg, ts: Date.now(), optimistic: true };
    setChat(function(prev) { return prev.slice(-200).concat([optimisticMsg]); });
    socket.emit('chat-message', { roomId: roomId, userId: userId, username: username, message: msg });
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
    if (socket) socket.emit('chat-react', { roomId: roomId, msgId: msgId, emoji: emoji });
  }

  function sendSuperChat() {
    if (!scMsg.trim()) { addToast('Enter a message', 'error'); return; }
    if (!socket) return;
    socket.emit('super-chat', { roomId: roomId, userId: userId, username: username, message: scMsg.trim(), amountCents: scAmount });
    setShowScModal(false);
    setScMsg('');
    setScAmount(100);
    addToast('💎 SuperChat sent!', 'success');
  }

  function translateMessage(msgId, text, targetLang) {
    var txKey = msgId + ':' + targetLang;
    if (txTexts[txKey] || txLoading[txKey]) return;
    setTxLoading(function(p) { return Object.assign({}, p, {[txKey]: true}); });
    var src = text;
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: src, targetLang: targetLang })
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        setTxTexts(function(p) { return Object.assign({}, p, {[txKey]: d.translated || src}); });
        setShowTx(function(p) { return Object.assign({}, p, {[txKey]: true}); });
        setTxLoading(function(p) { var n = Object.assign({}, p); delete n[txKey]; return n; });
      })
      .catch(function() {
        setTxLoading(function(p) { var n = Object.assign({}, p); delete n[txKey]; return n; });
        addToast('Translation unavailable', 'error');
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

  // Panel grid columns — responsive up to 20 participants
  var peerCount = stagePeers.length;
  var panelGridCols = peerCount <= 1  ? '1fr'
    : peerCount <= 2  ? '1fr 1fr'
    : peerCount <= 4  ? 'repeat(2,1fr)'
    : peerCount <= 9  ? 'repeat(3,1fr)'
    : peerCount <= 12 ? 'repeat(4,1fr)'
    : 'repeat(5,1fr)';
  var tileSize = peerCount <= 9 ? 120 : peerCount <= 16 ? 80 : 60;

  // allParticipants: own cell + all connected guests (panel/watch-party/battle use this)
  var allParticipants = (function() {
    var ownEntry = allGuestMap[userId] || { guestId: userId, username: username, role: role };
    var seen = {};
    seen[userId] = true;
    var others = guests.map(function(g) {
      var gid = g.guestId ? g.guestId : (g.userId ? g.userId : null);
      if (!gid || seen[gid]) return null;
      seen[gid] = true;
      return allGuestMap[gid] || g;
    }).filter(Boolean);
    return [ownEntry].concat(others).slice(0, MAX_STAGE);
  })();
  var allPeerCount = allParticipants.length;
  var allGridCols = allPeerCount <= 1  ? '1fr'
    : allPeerCount <= 2  ? '1fr 1fr'
    : allPeerCount <= 4  ? 'repeat(2,1fr)'
    : allPeerCount <= 9  ? 'repeat(3,1fr)'
    : allPeerCount <= 12 ? 'repeat(4,1fr)'
    : 'repeat(5,1fr)';
  var allTileSize = allPeerCount <= 9 ? 120 : allPeerCount <= 16 ? 80 : 60;

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
        background: 'rgba(201,168,76,.08)',
        borderColor: 'rgba(201,168,76,.28)',
        color: '#C9A84C',
      });
    }
    // default / inactive
    return Object.assign({}, base, {
      background: 'rgba(26,21,16,.7)',
      borderColor: '#3D3020',
      color: '#8A7A62',
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0E0C09', overflow: 'hidden', fontFamily: "'Barlow Condensed',sans-serif" }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'rgba(10,7,18,.9)', borderBottom: '1px solid #3D3020', flexShrink: 0, overflowX: 'auto' }}>
          {LAYOUTS.map(function(l) {
            var isActive = stageLayout === l.id;
            return (
              <button key={l.id}
                onClick={function() { setStageLayout(l.id); }}
                style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, padding: '4px 8px', background: isActive ? 'rgba(201,168,76,.12)' : 'rgba(26,21,16,.7)', border: '1px solid ' + (isActive ? 'rgba(201,168,76,.4)' : '#3D3020'), borderRadius: 4, color: isActive ? '#C9A84C' : '#8A7A62', cursor: 'pointer', flexShrink: 0, letterSpacing: 1 }}>
                {l.label}
              </button>
            );
          })}
          <button
            onClick={function() { setShowGuests(function(v) { return !v; }); }}
            style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, padding: '4px 8px', background: showGuests ? 'rgba(201,168,76,.12)' : 'rgba(26,21,16,.7)', border: '1px solid ' + (showGuests ? 'rgba(201,168,76,.35)' : '#3D3020'), borderRadius: 4, color: showGuests ? '#C9A84C' : '#8A7A62', cursor: 'pointer', flexShrink: 0 }}>
            👥 {guests.length}
          </button>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1, marginLeft: 'auto', flexShrink: 0 }}>{allParticipants.length}/{MAX_STAGE} CONNECTED</span>
        </div>

        {/* GUESTS LIST MODE */}
        {showGuests && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {guests.length === 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62', textAlign: 'center', padding: 20 }}>No viewers online</div>}
            {guests.map(function(g) {
              var gid   = g.guestId ? g.guestId : g.userId;
              var onStage = stageGuests.indexOf(gid) >= 0;
              return (
                <div key={gid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(26,21,16,.7)', border: '1px solid ' + (onStage ? 'rgba(201,168,76,.25)' : '#3D3020'), borderRadius: 8 }}>
                  <div style={{ flexShrink: 0 }}>
                    <AvatarPortrait username={g.username || gid} size={30} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#F0E8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.username || gid}</div>
                    <RolePill role={g.role || 'viewer'} />
                  </div>
                  {onStage && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C' }}>ON STAGE</span>}
                  {role === 'host' && !onStage && (
                    <button onClick={function() { inviteToStage({ guestId: gid, username: g.username || gid }); }}
                      style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.28)', borderRadius: 6, padding: '4px 8px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0 }}>
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', background: '#0E0C09' }}>
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
                          style={{ background: 'rgba(14,12,9,.8)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '3px 8px', color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                          {g.username || gid}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#8A7A62' }}>
                <div style={{ fontSize: 36 }}>🎙</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: 'rgba(201,168,76,.4)', letterSpacing: 3 }}>NO SIGNAL</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>Waiting for camera...</div>
              </div>
            )}
          </div>
        )}

        {/* PANEL layout */}
        <style dangerouslySetInnerHTML={{ __html: '@keyframes panelReactFloat { 0% { transform: translateY(0) scale(.6); opacity: 0; } 15% { opacity: 1; transform: translateY(-10px) scale(1); } 100% { transform: translateY(-70px) scale(1); opacity: 0; } }' }} />
        {!showGuests && stageLayout === 'panel' && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: allGridCols, gap: 2, padding: 2, overflow: 'hidden', background: '#0E0C09', alignContent: 'start' }}>
            {allParticipants.map(function(g) {
              var gid  = g.guestId ? g.guestId : (g.userId ? g.userId : 'x');
              var isOwn = gid === userId;
              var isFeatured = gid === featuredId;
              return (
                <div key={gid}
                  onClick={function() { setFeaturedId(gid); }}
                  style={{ position: 'relative', border: '2px solid ' + (isFeatured ? '#C9A84C' : 'rgba(255,255,255,.07)'), borderRadius: 6, overflow: 'hidden', cursor: 'pointer', aspectRatio: '16/9', background: '#0E0C09' }}>
                  <OctCell
                    guest={g}
                    sz={allTileSize}
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
                  {/* Quick reactions */}
              <div style={{ position: 'absolute', bottom: 4, right: 4, display: 'flex', gap: 2, zIndex: 25 }}>
                {['👍','❤️','😂','🔥','👏'].map(function(emo) {
                  return (
                    <button
                      key={emo}
                      onClick={function(e) { e.stopPropagation(); if (socket) socket.emit('panel:react', { roomId: roomId, guestId: gid, emoji: emo }); }}
                      style={{ width: 18, height: 18, background: 'rgba(0,0,0,.5)', border: 'none', borderRadius: '50%', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      {emo}
                    </button>
                  );
                })}
              </div>
              {/* Expand button — Bigo style */}
                  <button
                    onClick={function(e) { e.stopPropagation(); setExpandedId(gid); setStageLayout('expand'); }}
                    title="Expand panel"
                    style={{ position: 'absolute', top: 5, right: 5, zIndex: 30, background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 4, width: 20, height: 20, color: '#F0E8D4', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⛶</button>
                </div>
              );
            })}
          </div>
        )}

        {/* EXPAND layout — Bigo-style: one large cell + thumbnail strip */}
        {!showGuests && stageLayout === 'expand' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: 2, padding: 2, overflow: 'hidden', background: '#0E0C09' }}>
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
                      style={{ position: 'absolute', top: 10, right: 10, zIndex: 40, background: 'rgba(0,0,0,.75)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 6, padding: '4px 10px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1 }}>
                      ✕ COLLAPSE
                    </button>
                    {/* Expand badge */}
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 4, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 1 }}>
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
                    style={{ position: 'relative', flexShrink: 0, height: 78, border: '2px solid ' + (isExpanded ? '#C9A84C' : 'rgba(255,255,255,.07)'), borderRadius: 6, overflow: 'hidden', cursor: 'pointer', background: '#0E0C09' }}>
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
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(201,168,76,.25)', padding: '2px 0', textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#C9A84C' }}>EXPANDED</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TALK layout */}
        {!showGuests && stageLayout === 'talk' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', background: '#0E0C09', gap: 2, padding: 2 }}>
            <div style={{ flex: 1, position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#0E0C09' }}>
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
                    style={{ position: 'relative', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)', cursor: 'pointer', aspectRatio: '16/9', background: '#0E0C09', flexShrink: 0 }}>
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', background: '#0E0C09', gap: 2, padding: 2 }}>
            <div style={{ flex: 1, position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#0E0C09' }}>
              {isScreenShare ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🖥</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A84C', letterSpacing: 2 }}>SCREEN SHARING</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginTop: 4 }}>Your screen is broadcasting to viewers</div>
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ fontSize: 36 }}>🖥</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: 'rgba(201,168,76,.4)', letterSpacing: 2 }}>NO SCREEN SHARE</div>
                  <button onClick={toggleScreenShare}
                    style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 8, padding: '8px 16px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
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
                  <div key={gid} style={{ position: 'relative', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)', background: '#0E0C09', aspectRatio: '16/9', flexShrink: 0 }}>
                    <OctCell guest={g} sz={80} isHost={role === 'host'} fadesMode={false} branding={branding} onTap={null} socket={socket} roomId={roomId} userId={userId} rtcManager={rtcReady ? rtcManager : null}
                      mediaConfig={isOwn ? mediaConfig : null} isMuted={isOwn ? isMuted : false} isCamOff={isOwn ? isCamOff : false}
                      onMuteToggle={isOwn ? toggleMute : null} onCamToggle={isOwn ? toggleCam : null} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* WATCH PARTY layout — YouTube sync as main view + participant grid strip */}
        {!showGuests && stageLayout === 'watchparty' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#070510', overflow: 'hidden' }}>
            {/* YouTube embed */}
            <div style={{ flex: 1, position: 'relative', background: '#000' }}>
              {watchPartyUrl ? (
                <iframe
                  src={(function() {
                    var m = watchPartyUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?\/]+)/);
                    return m ? 'https://www.youtube.com/embed/' + m[1] + '?autoplay=1&rel=0' : watchPartyUrl;
                  })()}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ fontSize: 40 }}>📺</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#8A7A62', letterSpacing: 3 }}>NO WATCH PARTY ACTIVE</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#3D3020' }}>Start one in the 📺 WATCH tab</div>
                </div>
              )}
              <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(14,12,9,.8)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 5, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 1 }}>
                📺 WATCH PARTY · {allParticipants.length} WATCHING
              </div>
            </div>
            {/* Participant webcam strip */}
            {allParticipants.length > 0 && (
              <div style={{ height: 90, display: 'flex', gap: 2, padding: '2px 4px', background: '#0E0C09', overflowX: 'auto', flexShrink: 0 }}>
                {allParticipants.map(function(g) {
                  var gid  = g.guestId || g.userId || 'x';
                  var isOwn = gid === userId;
                  return (
                    <div key={gid} style={{ position: 'relative', flexShrink: 0, width: 120, height: 86, borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)', background: '#0E0C09' }}>
                      <OctCell guest={g} sz={80} isHost={role === 'host'} fadesMode={false} branding={branding} onTap={null} socket={socket} roomId={roomId} userId={userId} rtcManager={rtcReady ? rtcManager : null} mediaConfig={isOwn ? mediaConfig : null} isMuted={isOwn ? isMuted : false} isCamOff={isOwn ? isCamOff : false} onMuteToggle={null} onCamToggle={null} />
                      <div style={{ position: 'absolute', bottom: 2, left: 4, fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#F0E8D4', textShadow: '0 1px 4px rgba(0,0,0,.9)', overflow: 'hidden', maxWidth: 108, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.username || gid}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BATTLE layout — dual panel split with live scores */}
        {!showGuests && stageLayout === 'battle' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#070510', overflow: 'hidden' }}>
            {/* Battle score header */}
            <div style={{ background: 'linear-gradient(135deg,rgba(128,0,32,.4),rgba(201,168,76,.15))', borderBottom: '1px solid rgba(255,255,255,.08)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2 }}>⚡ LIVE BATTLE</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#FF6B81', letterSpacing: 1, lineHeight: 1 }}>{activeBattle ? activeBattle.challenger : 'CHALLENGER'}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#FF1A3C', lineHeight: 1 }}>{battleScores.a.toLocaleString()}</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A84C', letterSpacing: 2 }}>VS</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', letterSpacing: 1, lineHeight: 1 }}>{activeBattle ? activeBattle.defender : 'DEFENDER'}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#C9A84C', lineHeight: 1 }}>{battleScores.b.toLocaleString()}</div>
                </div>
              </div>
              {role === 'host' && (
                <button onClick={function() { setStageLayout('panel'); }} style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 5, padding: '3px 8px', color: '#8A7A62', fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer', letterSpacing: 1 }}>PANEL ▶</button>
              )}
            </div>
            {/* Battle score bar */}
            {(battleScores.a + battleScores.b) > 0 && (
              <div style={{ height: 5, background: '#1A1510', flexShrink: 0 }}>
                <div style={{ height: '100%', width: Math.round((battleScores.a / (battleScores.a + battleScores.b)) * 100) + '%', background: 'linear-gradient(90deg,#C01838,#FF6B81)', transition: 'width .4s ease' }} />
              </div>
            )}
            {/* Dual-panel video grid: left side = team A, right side = team B */}
            <div style={{ flex: 1, display: 'flex', gap: 2, padding: 2 }}>
              {/* Team A */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ background: 'rgba(192,24,56,.1)', border: '1px solid rgba(192,24,56,.3)', borderRadius: 4, padding: '2px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', textAlign: 'center', letterSpacing: 1, flexShrink: 0 }}>⚡ {activeBattle ? activeBattle.challenger : 'TEAM A'}</div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: allParticipants.length > 4 ? 'repeat(2,1fr)' : '1fr', gap: 2 }}>
                  {allParticipants.slice(0, Math.ceil(allParticipants.length / 2)).map(function(g) {
                    var gid  = g.guestId || g.userId || 'x';
                    var isOwn = gid === userId;
                    return (
                      <div key={gid} style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(192,24,56,.25)', aspectRatio: '16/9', background: '#0E0C09' }}>
                        <OctCell guest={g} sz={allTileSize} isHost={role === 'host'} fadesMode={false} branding={branding} onTap={null} socket={socket} roomId={roomId} userId={userId} rtcManager={rtcReady ? rtcManager : null} mediaConfig={isOwn ? mediaConfig : null} isMuted={isOwn ? isMuted : false} isCamOff={isOwn ? isCamOff : false} onMuteToggle={null} onCamToggle={null} />
                        <div style={{ position: 'absolute', bottom: 2, left: 4, fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#F0E8D4', textShadow: '0 1px 4px rgba(0,0,0,.9)' }}>{g.username || gid}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Divider */}
              <div style={{ width: 2, background: 'linear-gradient(#C01838,#C9A84C)', borderRadius: 999, flexShrink: 0 }} />
              {/* Team B */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 4, padding: '2px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', textAlign: 'center', letterSpacing: 1, flexShrink: 0 }}>⚡ {activeBattle ? activeBattle.defender : 'TEAM B'}</div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: allParticipants.length > 4 ? 'repeat(2,1fr)' : '1fr', gap: 2 }}>
                  {allParticipants.slice(Math.ceil(allParticipants.length / 2)).map(function(g) {
                    var gid  = g.guestId || g.userId || 'x';
                    var isOwn = gid === userId;
                    return (
                      <div key={gid} style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(201,168,76,.2)', aspectRatio: '16/9', background: '#0E0C09' }}>
                        <OctCell guest={g} sz={allTileSize} isHost={role === 'host'} fadesMode={false} branding={branding} onTap={null} socket={socket} roomId={roomId} userId={userId} rtcManager={rtcReady ? rtcManager : null} mediaConfig={isOwn ? mediaConfig : null} isMuted={isOwn ? isMuted : false} isCamOff={isOwn ? isCamOff : false} onMuteToggle={null} onCamToggle={null} />
                        <div style={{ position: 'absolute', bottom: 2, left: 4, fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#F0E8D4', textShadow: '0 1px 4px rgba(0,0,0,.9)' }}>{g.username || gid}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
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

        {/* Viewer reaction buttons — right edge of stage */}
        {!showGuests && (
          <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 42, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {REACT_EMOJIS.map(function(em) {
              return (
                <button key={em}
                  onClick={function() { if (socket) socket.emit('viewer-react', { roomId: roomId, emoji: em }); }}
                  style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(10,7,18,.82)', border: '1px solid rgba(255,255,255,.14)', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  {em}
                </button>
              );
            })}
          </div>
        )}

        {/* Floating react burst layer */}
        {floatReacts.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 44, overflow: 'hidden' }}>
            {floatReacts.map(function(r) {
              return (
                <div key={r.id} style={{ position: 'absolute', bottom: 10, left: r.left + '%', fontSize: 26, animation: 'giftRise 3.5s ease-out forwards', lineHeight: 1, userSelect: 'none' }}>
                  {r.emoji}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hand raise queue (host only) */}
      {role === 'host' && handQueue.length > 0 && (
        <div style={{ background: 'rgba(26,21,16,.9)', borderTop: '1px solid rgba(201,168,76,.2)', padding: '6px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 1 }}>
            <span>✋ RAISE QUEUE ({handQueue.length})</span>
          </div>
          {handQueue.map(function(item) {
            return (
              <div key={item.guestId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                <div style={{ flexShrink: 0, position: 'relative' }}>
                  <AvatarPortrait username={item.username} size={32} />
                  <span style={{ position: 'absolute', top: -2, right: -2, fontSize: 10 }}>✋</span>
                </div>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#F0E8D4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.username}</span>
                <button onClick={function() { inviteToStage(item); }}
                  style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.28)', borderRadius: 5, padding: '3px 8px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0 }}>
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
        <div style={{ display: 'flex', gap: 6, padding: '5px 12px', background: 'rgba(14,12,9,.8)', borderTop: '1px solid rgba(255,26,60,.15)', flexShrink: 0, overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 5px #FF1A3C' }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF6B81' }}>LIVE</span>
          </div>
          <div style={{ width: 1, background: '#3D3020', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>⏱</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>{fmtUptime(uptime)}</span>
          </div>
          <div style={{ width: 1, background: '#3D3020', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>👁</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#F0E8D4' }}>{viewerCount || 0}</span>
          </div>
          <div style={{ width: 1, background: '#3D3020', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>🎙</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: stageGuests.length > 0 ? '#C9A84C' : '#8A7A62' }}>{stageGuests.length} on stage</span>
          </div>
          {isMuted && (
            <>
              <div style={{ width: 1, background: '#3D3020', flexShrink: 0 }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF1A3C' }}>⚠ MUTED</span>
            </>
          )}
        </div>
      )}

      {/* Go Live modal */}
      {showGoLiveModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: '#0E0C09', border: '1px solid rgba(201,168,76,.4)', borderRadius: 14, padding: '20px', maxWidth: 380, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C', letterSpacing: 4, marginBottom: 4 }}>🔴 GO LIVE</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginBottom: 16 }}>Select destinations · SeeWhy is always included</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {GO_LIVE_PLATFORMS.map(function(p) {
                var isOn = Boolean(glDests[p.id]);
                return (
                  <div key={p.id} style={{ background: isOn ? p.color + '0d' : 'rgba(26,21,16,.5)', border: '1px solid ' + (isOn ? p.color + '55' : '#3D3020'), borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: p.color + '22', border: '1px solid ' + p.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: p.color, flexShrink: 0 }}>{p.icon}</div>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: isOn ? '#F0E8D4' : '#8A7A62', flex: 1 }}>{p.name}</span>
                      {p.locked ? (
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>ALWAYS ON</span>
                      ) : (
                        <button
                          onClick={function() { setGlDests(function(d) { return Object.assign({}, d, { [p.id]: !d[p.id] }); }); }}
                          style={{ width: 38, height: 20, borderRadius: 10, background: isOn ? p.color : '#3D3020', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
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
                        style={{ marginTop: 8, width: '100%', background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 6, padding: '6px 10px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 10, boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setShowGoLiveModal(false); }}
                style={{ flex: 1, padding: '11px', background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 8, color: '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={confirmGoLive}
                style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                🔴 GO LIVE NOW
              </button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', textAlign: 'center', marginTop: 10 }}>
              Destinations with no key will use your saved vault key.
            </div>
          </div>
        </div>
      )}

      {/* Media controls bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'rgba(10,7,18,.95)', borderTop: '1px solid #3D3020', flexShrink: 0, overflowX: 'auto' }}>
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
        {role === 'host' && (
          <button onClick={function() { setShowPollModal(true); }} style={mcBtnStyle(activePoll && activePoll.active ? 'active' : '')}>
            <span style={{ fontSize: 14 }}>📊</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1 }}>POLL</span>
          </button>
        )}
        {isLive && (
          <button onClick={function() {
            if (socket) socket.emit('clip-marker', { roomId: roomId, label: 'Clip @ ' + fmtUptime(uptime) });
          }} style={mcBtnStyle('')}>
            <span style={{ fontSize: 14 }}>📎</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1 }}>CLIP</span>
          </button>
        )}
        <div style={{ width: 1, background: '#3D3020', alignSelf: 'stretch', flexShrink: 0, margin: '2px 4px' }} />
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

      {/* Live Poll card */}
      {activePoll && (
        <div style={{ background: 'rgba(10,7,18,.97)', borderTop: '1px solid rgba(201,168,76,.3)', padding: '10px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#C9A84C', letterSpacing: 2 }}>📊 {activePoll.question}</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{activePoll.totalVotes} votes</span>
              {!activePoll.active && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', letterSpacing: 1 }}>ENDED</span>}
              {role === 'host' && activePoll.active && (
                <button onClick={function() { if (socket) socket.emit('poll-end', { roomId: roomId }); }}
                  style={{ background: 'none', border: '1px solid rgba(255,26,60,.35)', borderRadius: 3, padding: '2px 6px', color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer', letterSpacing: 1 }}>
                  END
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activePoll.options.map(function(opt, idx) {
              var pct      = activePoll.totalVotes > 0 ? Math.floor((opt.votes / activePoll.totalVotes) * 100) : 0;
              var isMyVote = myVote === idx;
              return (
                <div key={idx}
                  onClick={function() {
                    if (!activePoll.active) return;
                    setMyVote(idx);
                    if (socket) socket.emit('poll-vote', { roomId: roomId, optionIdx: idx });
                  }}
                  style={{ position: 'relative', background: isMyVote ? 'rgba(201,168,76,.08)' : 'rgba(26,21,16,.7)', border: '1px solid ' + (isMyVote ? 'rgba(201,168,76,.38)' : '#3D3020'), borderRadius: 6, padding: '5px 8px', cursor: activePoll.active ? 'pointer' : 'default', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct + '%', background: isMyVote ? 'rgba(201,168,76,.12)' : 'rgba(201,168,76,.08)', transition: 'width .4s ease', zIndex: 0 }} />
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: isMyVote ? '#C9A84C' : '#F0E8D4' }}>{opt.text}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: isMyVote ? '#C9A84C' : '#8A7A62' }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Poll creation modal */}
      {showPollModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', padding: 12 }}>
          <div style={{ background: '#0E0C09', border: '1px solid rgba(201,168,76,.4)', borderRadius: 14, padding: '18px 16px', width: '100%', maxWidth: 380 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#C9A84C', letterSpacing: 3, marginBottom: 12 }}>📊 LAUNCH POLL</div>
            <input
              value={pollQuestion}
              onChange={function(e) { setPollQuestion(e.target.value); }}
              placeholder="What's your question?"
              maxLength={200}
              style={{ width: '100%', background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 8, padding: '8px 12px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }}
            />
            {pollOpts.map(function(opt, idx) {
              return (
                <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input
                    value={opt}
                    onChange={function(e) { var v = e.target.value; setPollOpts(function(os) { var n = os.slice(); n[idx] = v; return n; }); }}
                    placeholder={'Option ' + (idx + 1)}
                    maxLength={80}
                    style={{ flex: 1, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 6, padding: '7px 10px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, boxSizing: 'border-box' }}
                  />
                  {idx >= 2 && (
                    <button onClick={function() { setPollOpts(function(os) { return os.filter(function(_, i) { return i !== idx; }); }); }}
                      style={{ background: 'none', border: '1px solid rgba(255,26,60,.3)', borderRadius: 5, width: 28, color: '#FF6B81', cursor: 'pointer', fontSize: 11 }}>✕</button>
                  )}
                </div>
              );
            })}
            {pollOpts.length < 4 && (
              <button onClick={function() { setPollOpts(function(os) { return os.concat(['']); }); }}
                style={{ background: 'none', border: '1px dashed rgba(201,168,76,.3)', borderRadius: 6, padding: '5px 12px', color: 'rgba(201,168,76,.6)', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', marginBottom: 10, letterSpacing: 1 }}>
                + ADD OPTION
              </button>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={function() { setShowPollModal(false); setPollQuestion(''); setPollOpts(['', '']); }}
                style={{ flex: 1, padding: '9px', background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 8, color: '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={function() {
                if (!pollQuestion.trim()) { addToast('Enter a question', 'error'); return; }
                var valid = pollOpts.filter(function(o) { return o.trim(); });
                if (valid.length < 2) { addToast('Need at least 2 options', 'error'); return; }
                if (socket) socket.emit('poll-start', { roomId: roomId, question: pollQuestion.trim(), options: valid, durationSec: 60 });
                setShowPollModal(false);
                setPollQuestion('');
                setPollOpts(['', '']);
                addToast('📊 Poll launched!', 'success');
              }}
                style={{ flex: 2, padding: '9px', background: 'linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.25))', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                🗳 LAUNCH POLL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SuperChat modal */}
      {showScModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 115, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)', padding: 12 }}>
          <div style={{ background: '#0E0C09', border: '1px solid rgba(128,0,32,.45)', borderRadius: 14, padding: '18px 16px', width: '100%', maxWidth: 380 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#C9A84C', letterSpacing: 3, marginBottom: 10 }}>💎 SUPERCHAT</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 12 }}>
              {SC_TIERS.map(function(tier) {
                var isSel = scAmount === tier.amount;
                return (
                  <button key={tier.amount}
                    onClick={function() { setScAmount(tier.amount); }}
                    style={{ background: isSel ? tier.bg : 'rgba(26,21,16,.7)', border: '2px solid ' + (isSel ? tier.color : '#3D3020'), borderRadius: 8, padding: '8px 4px', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: tier.color, lineHeight: 1 }}>{tier.label}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: isSel ? tier.color : '#8A7A62', letterSpacing: 1 }}>SUPER</div>
                  </button>
                );
              })}
            </div>
            <textarea
              value={scMsg}
              onChange={function(e) { setScMsg(e.target.value); }}
              placeholder="Your highlighted message..."
              maxLength={200}
              rows={3}
              style={{ width: '100%', background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 8, padding: '8px 12px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, marginBottom: 10, boxSizing: 'border-box', resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setShowScModal(false); setScMsg(''); setScAmount(100); }}
                style={{ flex: 1, padding: '9px', background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 8, color: '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={sendSuperChat}
                style={{ flex: 2, padding: '9px', background: 'linear-gradient(135deg,rgba(155,89,182,.3),rgba(155,89,182,.5))', border: '1px solid rgba(155,89,182,.6)', borderRadius: 8, color: '#D4A8FF', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {'💎 SEND $' + Math.floor(scAmount / 100) + ' SUPERCHAT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Goal bar */}
      {streamGoal.enabled && (
        <div style={{ background: 'rgba(201,168,76,.05)', borderTop: '1px solid rgba(201,168,76,.18)', padding: '7px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#C9A84C', letterSpacing: 1 }}>🎯 {streamGoal.label}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C' }}>
              ${(Math.floor(streamGoal.currentCents) / 100).toFixed(0)} / ${(Math.floor(streamGoal.targetCents) / 100).toFixed(0)}
            </span>
          </div>
          <div style={{ background: '#1A1510', borderRadius: 999, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#C9A84C,#C9A84C)', borderRadius: 999, width: Math.floor(Math.min(streamGoal.currentCents / streamGoal.targetCents * 100, 100)) + '%', transition: 'width .6s ease' }} />
          </div>
          {isLive && role === 'host' && (
            <button onClick={function() { setStreamGoal(function(p) { return Object.assign({}, p, { enabled: false }); }); }}
              style={{ background: 'none', border: 'none', color: '#8A7A62', fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer', padding: 0, marginTop: 3 }}>
              ✕ hide goal
            </button>
          )}
        </div>
      )}

      {/* Collapsible chat */}
      <div style={{ borderTop: '1px solid #3D3020', background: 'rgba(10,7,18,.9)', flexShrink: 0 }}>

        {/* Chat header */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <button onClick={function() { setChatOpen(function(v) { return !v; }); }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#F0E8D4' }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>💬 LIVE CHAT {chat.length > 0 ? '(' + chat.length + ')' : ''}</span>
            {/* Active language flags */}
            {(function() {
              var seen = [];
              for (var mi = chat.length - 1; mi >= 0 && seen.length < 5; mi--) {
                var l = (chat[mi].lang || '').toUpperCase();
                if (l && l !== 'UNK' && seen.indexOf(l) === -1) seen.push(l);
              }
              return seen.length > 1 ? (
                <span style={{ display: 'flex', gap: 2, opacity: 0.7 }}>
                  {seen.map(function(lc) { return <span key={lc} style={{ fontSize: 10 }} title={LANG_NAMES[lc] || lc}>{LANG_FLAGS[lc] || '🌐'}</span>; })}
                </span>
              ) : null;
            })()}
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, marginLeft: 'auto' }}>{chatOpen ? '▼' : '▲'}</span>
          </button>
          {/* Language picker button */}
          <button onClick={function() { setShowLangPicker(function(v) { return !v; }); }}
            title={'Chat language: ' + (LANG_NAMES[chatLang] || chatLang)}
            style={{ background: showLangPicker ? 'rgba(201,168,76,.12)' : 'none', border: showLangPicker ? '1px solid rgba(201,168,76,.28)' : '1px solid transparent', borderRadius: 5, padding: '4px 8px', color: '#F0E8D4', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>
            {LANG_FLAGS[chatLang] || '🌐'}
          </button>
          {isLive && role === 'host' && !streamGoal.enabled && (
            <button onClick={function() { setStreamGoal(function(p) { return Object.assign({}, p, { enabled: true, currentCents: 0 }); }); }}
              title="Set stream goal"
              style={{ background: 'none', border: 'none', padding: '0 8px', color: '#8A7A62', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>🎯</button>
          )}
          {giftLeaderboard.length > 0 && (
            <button onClick={function() { setShowLeaderboard(function(v) { return !v; }); }}
              title="Gift leaderboard"
              style={{ background: showLeaderboard ? 'rgba(201,168,76,.15)' : 'none', border: showLeaderboard ? '1px solid rgba(201,168,76,.3)' : '1px solid transparent', borderRadius: 5, padding: '3px 7px', color: showLeaderboard ? '#C9A84C' : '#8A7A62', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>🏆</button>
          )}
          {/* Language picker popover */}
          {showLangPicker && (
            <div style={{ position: 'absolute', bottom: '100%', right: 8, zIndex: 60, background: '#0E0C09', border: '1px solid rgba(201,168,76,.28)', borderRadius: 10, padding: 8, width: 216 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1, marginBottom: 6, textAlign: 'center' }}>SHOW CHAT IN</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4 }}>
                {PICKER_LANGS.map(function(lc) {
                  return (
                    <button key={lc} onClick={function() { setChatLang(lc); try { localStorage.setItem('sw_chat_lang', lc); } catch(e) {} setShowLangPicker(false); }}
                      title={LANG_NAMES[lc] || lc}
                      style={{ background: chatLang === lc ? 'rgba(201,168,76,.15)' : 'rgba(26,21,16,.8)', border: '1px solid ' + (chatLang === lc ? 'rgba(201,168,76,.4)' : '#3D3020'), borderRadius: 6, padding: '5px 2px', cursor: 'pointer', textAlign: 'center', fontSize: 16, lineHeight: 1 }}>
                      {LANG_FLAGS[lc] || lc}
                    </button>
                  );
                })}
              </div>
              {chatLang !== 'EN' && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', marginTop: 6, textAlign: 'center', letterSpacing: 0.5 }}>
                  {LANG_FLAGS[chatLang]} Translating on demand · powered by DeepL
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gift leaderboard panel */}
        {showLeaderboard && giftLeaderboard.length > 0 && (
          <div style={{ background: 'rgba(10,7,18,.97)', borderBottom: '1px solid rgba(201,168,76,.2)', padding: '8px 12px', flexShrink: 0 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 2, marginBottom: 6 }}>🏆 SESSION GIFTERS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {giftLeaderboard.slice(0, 5).map(function(entry, idx) {
                var medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                return (
                  <div key={entry.username} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, flexShrink: 0, width: 18, textAlign: 'center' }}>{medals[idx] || (idx + 1 + '.')}</span>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.username}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C', flexShrink: 0 }}>{'$' + (Math.floor(entry.total) / 100).toFixed(0)}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', flexShrink: 0 }}>{'×' + entry.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pinned message */}
        {pinnedMsg && chatOpen && (
          <div style={{ background: 'rgba(201,168,76,.1)', borderBottom: '1px solid rgba(201,168,76,.25)', padding: '5px 12px', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <span style={{ fontSize: 10, flexShrink: 0, marginTop: 1 }}>📌</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 1, marginBottom: 2 }}>PINNED</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#F0E8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#C9A84C', fontWeight: 700, marginRight: 4 }}>{pinnedMsg.username}</span>
                {pinnedMsg.message}
              </div>
            </div>
            {role === 'host' && (
              <button onClick={unpinMessage} style={{ background: 'none', border: 'none', color: '#8A7A62', cursor: 'pointer', fontSize: 10, flexShrink: 0, padding: 0 }}>✕</button>
            )}
          </div>
        )}

        {chatOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 220 }}>
            {superChats.length > 0 && (
              <div style={{ display: 'flex', gap: 5, padding: '4px 8px', overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid rgba(61,48,32,.5)' }}>
                {superChats.slice(-6).map(function(sc) {
                  return (
                    <div key={sc.id} style={{ flexShrink: 0, background: sc.tierColor + '22', border: '1px solid ' + sc.tierColor + '55', borderRadius: 8, padding: '4px 8px', minWidth: 110, maxWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 1 }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: sc.tierColor, fontWeight: 700, flexShrink: 0 }}>{'💎 $' + Math.floor(sc.amountCents / 100)}</span>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: '#F0E8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sc.username}</span>
                      </div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#F0E8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sc.message}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {chat.length === 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', textAlign: 'center', padding: 12 }}>No messages yet</div>}
              {chat.map(function(msg) {
                var msgId     = msg.id || (msg.username + msg.ts + msg.message);
                // Loyalty badge based on gift rank and role
                var msgBadge = '';
                if (msg.role === 'host') { msgBadge = '🎙'; }
                else if (msg.role === 'cohost') { msgBadge = '🎤'; }
                else {
                  var lbIdx = giftLeaderboard.findIndex(function(e) { return e.username === msg.username; });
                  if (lbIdx === 0) { msgBadge = '👑'; }
                  else if (lbIdx === 1) { msgBadge = '💎'; }
                  else if (lbIdx === 2) { msgBadge = '⭐'; }
                  else if (lbIdx >= 3) { msgBadge = '🎁'; }
                }
                var msgRxns   = reactions[msgId] || {};
                var emojiList = ['👍','❤️','🔥','😂','🎯'];
                var msgLang   = (msg.lang || '').toUpperCase();
                var isNonEn   = msgLang && msgLang !== 'EN' && msgLang !== 'UNK';
                var hasTxEn   = isNonEn && msg.translated && msg.translated !== msg.message;
                var userTxKey = msgId + ':' + chatLang;
                var needsUserTx = chatLang !== 'EN' && msgLang !== chatLang && !msg.isBot;
                return (
                  <div key={msgId} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }}>
                    {/* Username + message row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <div style={{ flexShrink: 0, marginTop: 1 }}>
                        <AvatarPortrait username={msg.username || 'anon'} size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {msgBadge ? <span style={{ fontSize: 10, marginRight: 2 }} title={'Gifter rank'}>{msgBadge}</span> : null}
                        <span style={{ color: msg.isBot ? '#D4854A' : '#C9A84C', fontWeight: 700, marginRight: 4 }}>{msg.username || 'anon'}</span>
                        {isNonEn && <span style={{ marginRight: 4, fontSize: 11 }} title={LANG_NAMES[msgLang] || msgLang}>{LANG_FLAGS[msgLang] || '🌐'}</span>}
                        <span style={{ color: msg.isBot ? '#D4854A' : '#F0E8D4' }}>{msg.message}</span>
                      </div>
                      {role === 'host' && !msg.isBot && (
                        <button onClick={function() { pinMessage(msg); }} title="Pin"
                          style={{ background: 'none', border: 'none', color: '#8A7A62', cursor: 'pointer', fontSize: 9, padding: '0 2px', flexShrink: 0, opacity: 0.5 }}>📌</button>
                      )}
                    </div>

                    {/* Translation rows */}
                    {!msg.isBot && (
                      <div style={{ paddingLeft: 25, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                        {/* Show EN translation for non-EN messages */}
                        {hasTxEn && (
                          showTx[msgId + ':EN'] ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 10 }}>🇺🇸</span>
                              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#8A7A62', fontStyle: 'italic', flex: 1 }}>{msg.translated}</span>
                              <button onClick={function() { setShowTx(function(p) { var n = Object.assign({}, p); delete n[msgId + ':EN']; return n; }); }}
                                style={{ background: 'none', border: 'none', color: '#8A7A62', cursor: 'pointer', fontSize: 8, padding: 0, flexShrink: 0 }}>✕</button>
                            </div>
                          ) : (
                            <button onClick={function() { setShowTx(function(p) { return Object.assign({}, p, {[msgId + ':EN']: true}); }); }}
                              style={{ background: 'none', border: 'none', color: 'rgba(201,168,76,.55)', cursor: 'pointer', fontSize: 9, padding: 0, textAlign: 'left', letterSpacing: 0.5, textDecoration: 'underline', width: 'fit-content' }}>
                              🌐 view in EN
                            </button>
                          )
                        )}
                        {/* On-demand translate to user's preferred lang */}
                        {needsUserTx && chatLang !== 'EN' && (
                          txTexts[userTxKey] ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 10 }}>{LANG_FLAGS[chatLang] || '🌐'}</span>
                              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#8A7A62', fontStyle: 'italic', flex: 1 }}>{txTexts[userTxKey]}</span>
                              <button onClick={function() { setTxTexts(function(p) { var n = Object.assign({}, p); delete n[userTxKey]; return n; }); }}
                                style={{ background: 'none', border: 'none', color: '#8A7A62', cursor: 'pointer', fontSize: 8, padding: 0, flexShrink: 0 }}>✕</button>
                            </div>
                          ) : (
                            <button onClick={function() {
                              var src = (hasTxEn && chatLang === 'EN') ? msg.translated : msg.message;
                              translateMessage(msgId, src, chatLang);
                            }}
                              style={{ background: 'none', border: 'none', color: 'rgba(201,168,76,.55)', cursor: 'pointer', fontSize: 9, padding: 0, textAlign: 'left', letterSpacing: 0.5, textDecoration: 'underline', width: 'fit-content' }}>
                              {txLoading[userTxKey] ? '...' : (LANG_FLAGS[chatLang] || '🌐') + ' translate'}
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {/* Broadcast reactions */}
                    <div style={{ display: 'flex', gap: 3, marginTop: 2, paddingLeft: 25, flexWrap: 'wrap' }}>
                      {emojiList.map(function(emoji) {
                        var count = msgRxns[emoji] || 0;
                        return (
                          <button key={emoji}
                            onClick={function() { addReaction(msgId, emoji); }}
                            style={{ background: count > 0 ? 'rgba(201,168,76,.15)' : 'transparent', border: count > 0 ? '1px solid rgba(201,168,76,.3)' : '1px solid transparent', borderRadius: 10, padding: '1px 5px', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', gap: 2, color: '#8A7A62' }}>
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
            <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderTop: '1px solid rgba(61,48,32,.5)', flexShrink: 0 }}>
              <input value={chatInput} onChange={function(e) { setChatInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') sendChat(); }}
                placeholder={'Say something… ' + (chatLang !== 'EN' ? (LANG_FLAGS[chatLang] || '') : '')}
                maxLength={200}
                style={{ flex: 1, background: '#0E0C09', border: '1px solid #3D3020', borderRadius: 6, padding: '6px 10px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }} />
              <button onClick={function() { setShowScModal(true); }}
                title="SuperChat"
                style={{ background: 'rgba(128,0,32,.15)', border: '1px solid rgba(128,0,32,.35)', borderRadius: 6, padding: '6px 10px', color: '#C9A84C', cursor: 'pointer', flexShrink: 0, fontSize: 14 }}>
                💎
              </button>
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
