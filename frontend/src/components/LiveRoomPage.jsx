import React, { useState, useEffect, useRef } from 'react';
import OctCell from './OctCell.jsx';
import rtcManager from '../webrtc.js';
import MediaConfigPanel from './MediaConfigPanel.jsx';
import { saveClip } from '../clipStore.js';
import { creatorCents, platformCents, getPlatformHandles } from '../platformConfig.js';
import HostHUD from './HostHUD.jsx';
import ChyronOverlay from './ChyronOverlay.jsx';
import PollOverlay from './PollOverlay.jsx';

var MAX_STAGE = 20;

// ─── Palette ───────────────────────────────────────────────────────────────
var BG      = '#0E0C09';
var SURF    = '#1A1510';
var CARD    = '#241C12';
var CARD2   = '#2E2318';
var BORDER  = 'rgba(201,168,76,.12)';
var GOLD    = '#C9A84C';
var BURG    = '#800020';
var TEAL    = '#D4854A';
var RED     = '#FF1A3C';
var TEXT    = '#F0E8D4';
var MUTED   = '#8A7A62';
var DIM     = '#3D3020';

// ─── Animation CSS ─────────────────────────────────────────────────────────
var ANIM = [
  '@keyframes speakBar{0%{transform:scaleY(.25)}100%{transform:scaleY(1)}}',
  '@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}',
  '@keyframes fadeSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}',
  '@keyframes speakRing{0%,100%{box-shadow:0 0 0 2px '+TEAL+',0 0 14px '+TEAL+'44}50%{box-shadow:0 0 0 3px '+TEAL+',0 0 24px '+TEAL+'66}}',
  '@keyframes goldPulse{0%,100%{opacity:1}50%{opacity:.6}}',
  '@keyframes tipSlide{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}',
  '@keyframes tipOut{from{opacity:1}to{opacity:0;transform:translateX(60px)}}',
  '@keyframes pollBar{from{width:0}to{width:var(--pct)}}',
  '@keyframes qaIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes musicIn{from{opacity:0;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}',
  '@keyframes vsIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes scoreReveal{0%{opacity:0;transform:scale(.6)}60%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}',
  '@keyframes scoreFade{from{opacity:1}to{opacity:0;transform:scale(.9)}}',
  '@keyframes cellExpand{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}',
  '@keyframes recPulse{0%,100%{opacity:1;background:rgba(255,26,60,.9)}50%{opacity:.6;background:rgba(255,26,60,.5)}}',
  '@keyframes waveBar{0%{height:4px}100%{height:20px}}',
].join('\n');

// ─── Direct Pay platforms ───────────────────────────────────────────────────
var DP_PLATFORMS = [
  { id: 'paypal',  emoji: '💸', name: 'PayPal',  color: '#0070BA', buildUrl: function(h) { return 'https://paypal.me/' + h.replace(/^@/,''); } },
  { id: 'cashapp', emoji: '💚', name: 'CashApp', color: '#00D54B', buildUrl: function(h) { return 'https://cash.app/$' + h.replace(/^\$/,''); } },
  { id: 'venmo',   emoji: '💙', name: 'Venmo',   color: '#3D95CE', buildUrl: function(h) { return 'https://venmo.com/' + h.replace(/^@/,''); } },
  { id: 'zelle',   emoji: '💜', name: 'Zelle',   color: '#6D1ED4', buildUrl: null },
  { id: 'chime',   emoji: '🟢', name: 'Chime',   color: '#16BE45', buildUrl: null },
];

// ─── Social share platforms ─────────────────────────────────────────────────
var SOC_PLATFORMS = [
  { id: 'facebook',  emoji: '📘', name: 'Facebook',   open: true,  buildUrl: function(u,t){ return 'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(u)+'&quote='+encodeURIComponent(t); } },
  { id: 'twitter',   emoji: '🐦', name: 'X / Twitter', open: true,  buildUrl: function(u,t){ return 'https://twitter.com/intent/tweet?text='+encodeURIComponent(t+' '+u); } },
  { id: 'whatsapp',  emoji: '💬', name: 'WhatsApp',   open: true,  buildUrl: function(u,t){ return 'https://wa.me/?text='+encodeURIComponent(t+' '+u); } },
  { id: 'instagram', emoji: '📸', name: 'Instagram',  open: false, buildUrl: null },
  { id: 'tiktok',    emoji: '🎵', name: 'TikTok',     open: false, buildUrl: null },
  { id: 'snapchat',  emoji: '👻', name: 'Snapchat',   open: false, buildUrl: null },
];

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
    cohost: { bg: 'rgba(201,168,76,.12)',   color: TEAL,    label: 'CO-HOST' },
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
          : active            ? 'rgba(201,168,76,.18)'
          :                     'rgba(255,255,255,.06)';
  var bc  = active && danger  ? 'rgba(255,26,60,.5)'
          : active            ? 'rgba(201,168,76,.4)'
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

function WaveBars({ color }) {
  var c = color || TEAL;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 20, flexShrink: 0 }}>
      {[0,1,2,3,4].map(function(i) {
        return (
          <div key={i} style={{
            width: 4, height: 4, background: c, borderRadius: 2,
            transformOrigin: 'bottom',
            animation: 'waveBar .6s ease-in-out ' + (i * .12) + 's infinite alternate',
          }} />
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function LiveRoomPage({
  socket, guests, chat, isLive, setIsLive,
  userId, username, role, roomId, branding,
  addToast, overlayConfig, viewerCount, mediaConfig,
  streamInfo, streamGoal, setStreamGoal, sessionEarningsCents, onLeave,
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
  var [stageLayout,    setStageLayout]    = useState('grid');   // 'grid' | 'featured'
  var [featuredId,     setFeaturedId]     = useState(userId);
  var [showLiveModal,  setShowLiveModal]  = useState(false);
  var [stageGuests,    setStageGuests]    = useState([userId]);
  var [showMediaConf,  setShowMediaConf]  = useState(false);
  var [tipFeed,        setTipFeed]        = useState([]);      // {id,from,amount,emoji,ts}
  var [tipLeader,      setTipLeader]      = useState([]);      // [{username,totalCents}]
  var [showLeader,     setShowLeader]     = useState(false);
  var [activePoll,     setActivePoll]     = useState(null);    // {q,opts:[{text,votes}]}
  var [pollVoted,      setPollVoted]      = useState(false);
  var [showPollCreate, setShowPollCreate] = useState(false);
  var [pollDraft,      setPollDraft]      = useState({ q: '', opts: ['', '', '', ''] });
  var [qaQueue,        setQaQueue]        = useState([]);      // {id,username,text,upvotes}
  var [qaInput,        setQaInput]        = useState('');
  var [showQa,         setShowQa]         = useState(false);
  var [qaMyVotes,      setQaMyVotes]      = useState({});
  var [panelMode,      setPanelMode]      = useState('grid'); // grid | list — for 20-person layout hint
  var [musicBanner,    setMusicBanner]    = useState(null);   // {title,style,emoji,sharedBy} | null
  var [showGoalSet,    setShowGoalSet]    = useState(false);
  var [goalDraft,      setGoalDraft]      = useState({ label: '', amount: '' });
  var [vsPoll,         setVsPoll]         = useState(null);   // { id,sideA,sideB,votesA,votesB,pctA,pctB,totalVotes,active }
  var [vsVoted,        setVsVoted]        = useState(null);   // 'A' | 'B' | null
  var [showVsCreate,   setShowVsCreate]   = useState(false);
  var [vsDraft,        setVsDraft]        = useState({ sideA: '', sideB: '', duration: '60' });
  var [judges,         setJudges]         = useState([]);     // [{ userId, username, scoreCount, avgScore, lastScore }]
  var [showJudges,     setShowJudges]     = useState(false);
  var [judgeAssignName, setJudgeAssignName] = useState('');
  var [judgeScoreVal,  setJudgeScoreVal]  = useState('');
  var [judgeScoreLabel, setJudgeScoreLabel] = useState('');
  var [showPaySheet,   setShowPaySheet]   = useState(false);
  var [showShareSheet, setShowShareSheet] = useState(false);
  var [audioOnly,      setAudioOnly]      = useState(false);
  var [privateMode,    setPrivateMode]    = useState(false);
  var [privatePwd,     setPrivatePwd]     = useState('');
  var [showPrivateSet, setShowPrivateSet] = useState(false);
  var [paywallOn,      setPaywallOn]      = useState(false);
  var [paywallPrice,   setPaywallPrice]   = useState('');
  var [expandedCell,   setExpandedCell]   = useState(null);
  var [showRecorder,   setShowRecorder]   = useState(false);
  var [recState,       setRecState]       = useState('idle');
  var [recSeconds,     setRecSeconds]     = useState(0);
  var [recUrl,         setRecUrl]         = useState(null);
  var recTimerRef   = useRef(null);
  var mediaRecRef   = useRef(null);
  var recChunksRef  = useRef([]);
  var [scoreReveal,    setScoreReveal]    = useState(null); // { username, score, label } | null
  var [showSuperChatSheet, setShowSuperChatSheet] = useState(false);
  var [scMsg,              setScMsg]              = useState('');
  var [scAmt,              setScAmt]              = useState(100);
  var [giftCount,          setGiftCount]          = useState(0);
  var [superChatCount,     setSuperChatCount]     = useState(0);
  var [streamStats,        setStreamStats]        = useState(null); // { bitratekbps, rttMs, lossPct }
  var [theaterMode,        setTheaterMode]        = useState(false);
  var [theaterChatVisible, setTheaterChatVisible] = useState(true);

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
      // Pre-load chat history and room state
      if (Array.isArray(data.chatHistory) && data.chatHistory.length > 0) {
        setChat(function(prev) { return prev.length > 0 ? prev : data.chatHistory; });
      }
      if (data.activePoll) {
        setPoll(data.activePoll);
        setShowQa(true);
      }
      if (data.activeVsPoll) {
        setVsPoll(data.activeVsPoll);
        setShowQa(true);
      }
      if (Array.isArray(data.judges) && data.judges.length > 0) {
        setJudges(data.judges);
      }
      try {
        await rtcManager.connect(socket, roomId, userId, role);
        setRtcReady(true);
        // Wire up stream health stats (only meaningful for hosts/cohosts sending media)
        rtcManager.on('stats', function(s) { setStreamStats(s); });
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

    socket.on('super-chat', function(sc) {
      if (!sc) return;
      // Inject into chat stream as a super-chat type message
      var scEntry = Object.assign({ type: 'super' }, sc);
      setChat(function(prev) { return [...prev.slice(-200), scEntry]; });
      setSuperChatCount(function(c) { return c + 1; });
      if (addToast && role !== 'host') addToast('💬 ' + sc.username + ' sent a $' + (Math.floor(sc.amountCents) / 100).toFixed(2) + ' Super Chat!', 'success');
    });

    socket.on('gift-received', function(gift) {
      if (!gift) return;
      setGiftCount(function(c) { return c + 1; });
    });

    socket.on('react-burst', function(data) {
      if (!data || !data.emoji) return;
      var fid = Date.now() + Math.random();
      setFloatReacts(function(r) { return r.concat([{ emoji: data.emoji, fid: fid }]); });
      setTimeout(function() { setFloatReacts(function(r) { return r.filter(function(x) { return x.fid !== fid; }); }); }, 2200);
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

    socket.on('poll-update', function(data) {
      if (!data) return;
      if (!data.active) { setActivePoll(null); setPollVoted(false); return; }
      setActivePoll({
        q: data.question || '',
        opts: (data.options || []).map(function(o) { return { text: o.text, votes: o.votes || 0 }; })
      });
    });

    socket.on('qa-question', function(data) {
      if (!data || !data.text) return;
      setQaQueue(function(q) {
        return [{ id: data.id || Date.now(), username: data.username || 'Guest', text: data.text, upvotes: 0 }]
          .concat(q).slice(0, 20);
      });
    });

    socket.on('qa-upvote', function(data) {
      if (!data || !data.id) return;
      setQaQueue(function(q) {
        return q.map(function(item) {
          return item.id === data.id ? { id: item.id, username: item.username, text: item.text, upvotes: item.upvotes + 1 } : item;
        }).sort(function(a, b) { return b.upvotes - a.upvotes; });
      });
    });

    socket.on('qa-dismissed', function(data) {
      if (!data || !data.id) return;
      setQaQueue(function(q) { return q.filter(function(item) { return item.id !== data.id; }); });
    });

    socket.on('music-shared', function(data) {
      if (!data || !data.title) return;
      setMusicBanner({ title: data.title, style: data.style || '', emoji: data.emoji || '🎵', sharedBy: data.sharedBy || '' });
      setTimeout(function() { setMusicBanner(null); }, 6000);
    });

    socket.on('vs-update', function(data) {
      if (!data) { setVsPoll(null); setVsVoted(null); return; }
      setVsPoll(data);
      if (!data.active) {
        setTimeout(function() { setVsPoll(null); setVsVoted(null); }, 8000);
      }
    });

    socket.on('judges-update', function(data) {
      if (!data) return;
      setJudges(data);
    });

    socket.on('judge-scored', function(data) {
      if (!data) return;
      setScoreReveal({ username: data.username || 'Judge', score: data.score, label: data.label || '' });
      setTimeout(function() { setScoreReveal(null); }, 3200);
    });

    return function() {
      socket.off('join-room-ack');
      socket.off('speaking');
      socket.off('hand-raise');
      socket.off('stage-invite');
      socket.off('poll-update');
      socket.off('qa-question');
      socket.off('qa-upvote');
      socket.off('qa-dismissed');
      socket.off('music-shared');
      socket.off('vs-update');
      socket.off('judges-update');
      socket.off('judge-scored');
      socket.off('super-chat');
      socket.off('react-burst');
      socket.off('gift-received');
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

  function submitPoll() {
    if (!socket || !pollDraft.q.trim()) return;
    var opts = pollDraft.opts.filter(function(o) { return o.trim(); });
    if (opts.length < 2) { if (addToast) addToast('Need at least 2 options', 'error'); return; }
    socket.emit('poll-start', { roomId: roomId, question: pollDraft.q.trim(), options: opts });
    setShowPollCreate(false);
    setPollDraft({ q: '', opts: ['', '', '', ''] });
    if (addToast) addToast('Poll launched!', 'success');
  }

  function votePoll(idx) {
    if (!socket || pollVoted) return;
    socket.emit('poll-vote', { roomId: roomId, optionIdx: idx });
    setPollVoted(true);
    setActivePoll(function(p) {
      if (!p) return p;
      var opts = p.opts.map(function(o, i) {
        return i === idx ? { text: o.text, votes: o.votes + 1 } : o;
      });
      return { q: p.q, opts: opts };
    });
  }

  function submitQa() {
    var text = qaInput.trim();
    if (!text || !socket) return;
    var qid = Date.now() + '-' + userId;
    socket.emit('qa-question', { roomId: roomId, id: qid, username: username, text: text });
    setQaInput('');
    if (addToast) addToast('Question sent!', 'success');
  }

  function startVs() {
    if (!socket || !vsDraft.sideA.trim() || !vsDraft.sideB.trim()) return;
    var dur = Math.min(300, Math.max(10, parseInt(vsDraft.duration) || 60));
    socket.emit('vs-start', { roomId: roomId, sideA: vsDraft.sideA.trim(), sideB: vsDraft.sideB.trim(), durationSec: dur });
    setShowVsCreate(false);
    setVsDraft({ sideA: '', sideB: '', duration: '60' });
    if (addToast) addToast('VS Poll launched!', 'success');
  }

  function submitJudgeScore() {
    var s = parseInt(judgeScoreVal);
    if (!socket || isNaN(s) || s < 0 || s > 10) { if (addToast) addToast('Score must be 0–10', 'error'); return; }
    socket.emit('judge-score', { roomId: roomId, score: s, label: judgeScoreLabel.trim() });
    setJudgeScoreVal('');
    setJudgeScoreLabel('');
    if (addToast) addToast('Score submitted!', 'success');
  }

  function shareRoom() {
    var url = window.location.origin + (roomId !== '6990f5f24823b53e21fcdc9d' ? ('?room=' + roomId) : '');
    if (navigator.share) {
      navigator.share({ title: 'SeeWhy LIVE', text: 'Watch live domino action on SeeWhy LIVE!', url: url });
    } else {
      navigator.clipboard.writeText(url).then(function() {
        if (addToast) addToast('Room link copied!', 'success');
      }).catch(function() {
        if (addToast) addToast('seewhylive.online', 'info');
      });
    }
  }

  function openPayLink(platform, handle) {
    if (!handle || !handle.trim()) {
      if (addToast) addToast('Host hasn\'t set up ' + platform.name + ' yet', 'info');
      return;
    }
    if (platform.buildUrl) {
      window.open(platform.buildUrl(handle.trim()), '_blank', 'noopener');
    } else {
      navigator.clipboard.writeText(handle.trim()).then(function() {
        if (addToast) addToast(platform.name + ': ' + handle + ' copied!', 'success');
      }).catch(function() {
        if (addToast) addToast(platform.name + ': ' + handle, 'info');
      });
    }
  }

  function openSocialShare(platform, roomUrl, msg) {
    if (platform.open && platform.buildUrl) {
      window.open(platform.buildUrl(roomUrl, msg), '_blank', 'noopener,width=600,height=450');
    } else {
      navigator.clipboard.writeText(msg + ' ' + roomUrl).then(function() {
        if (addToast) addToast(platform.name + ': link copied — paste to share!', 'success');
      }).catch(function() {
        if (addToast) addToast('Link: ' + roomUrl, 'info');
      });
    }
  }

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(function(stream) {
      recChunksRef.current = [];
      var opts = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? { mimeType: 'video/webm;codecs=vp9' } : {};
      var mr = new MediaRecorder(stream, opts);
      mr.ondataavailable = function(e) { if (e.data && e.data.size > 0) recChunksRef.current.push(e.data); };
      mr.onstop = function() {
        var blob = new Blob(recChunksRef.current, { type: 'video/webm' });
        var url  = URL.createObjectURL(blob);
        setRecUrl(url);
        setRecState('done');
        stream.getTracks().forEach(function(t) { t.stop(); });
        clearInterval(recTimerRef.current);
        // Persist to IndexedDB so VOD Library can access it
        var clipId = 'clip-' + Date.now();
        var dur    = recSeconds;
        saveClip(clipId, blob, {
          title:    'Clip ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          duration: dur,
          ts:       Date.now(),
          size:     blob.size,
        }).catch(function() {});
      };
      mr.start(1000);
      mediaRecRef.current = mr;
      setRecState('recording');
      setRecSeconds(0);
      recTimerRef.current = setInterval(function() {
        setRecSeconds(function(s) {
          var next = s + 1;
          if (next >= 600) { mr.stop(); }
          return next;
        });
      }, 1000);
    }).catch(function() {
      if (addToast) addToast('Camera access required to record', 'error');
    });
  }

  function stopRecording() {
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop();
    }
    clearInterval(recTimerRef.current);
  }

  function fmtTime(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
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

      <HostHUD
        sessionEarningsCents={sessionEarningsCents}
        viewerCount={viewerCount}
        superChatCount={superChatCount}
        giftCount={giftCount}
        addToast={addToast}
        isVisible={role === 'host' || role === 'cohost'}
        streamStats={streamStats}
      />

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
            {privateMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(109,30,212,.2)', border: '1px solid rgba(109,30,212,.5)', borderRadius: 999, padding: '3px 8px' }}>
                <span style={{ fontSize: 9 }}>🔒</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#B08FFF', letterSpacing: 1 }}>PRIVATE</span>
              </div>
            )}
            {audioOnly && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 999, padding: '3px 8px' }}>
                <span style={{ fontSize: 9 }}>🎤</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, letterSpacing: 1 }}>AUDIO</span>
              </div>
            )}
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

      {/* ════════════════ STREAM GOAL BAR ════════════════ */}
      {streamGoal && isLive && (function() {
        var earned = Math.floor(sessionEarningsCents || 0);
        var target = Math.floor(streamGoal.goalCents || 1);
        var pct    = Math.min(100, Math.floor(earned / target * 100));
        var bar    = pct >= 100 ? GOLD : pct >= 75 ? TEAL : '#C9A84C';
        return (
          <div style={{ background: 'rgba(14,12,9,.9)', borderBottom: '1px solid ' + BORDER, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, flexShrink: 0 }}>GOAL</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: TEXT, flexShrink: 0, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{streamGoal.label || 'Stream Goal'}</span>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.07)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: bar, width: pct + '%', transition: 'width .6s ease' }} />
            </div>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: bar, letterSpacing: 1, flexShrink: 0 }}>{pct}%</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, flexShrink: 0 }}>${(earned / 100).toFixed(0)}/${(target / 100).toFixed(0)}</span>
            {role === 'host' && <button onClick={function() { if (setStreamGoal) setStreamGoal(null); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 9, padding: 0, lineHeight: 1 }}>✕</button>}
          </div>
        );
      })()}
      {!streamGoal && role === 'host' && isLive && (
        <div style={{ background: 'rgba(14,12,9,.7)', borderBottom: '1px solid ' + BORDER, padding: '4px 14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={function() { setShowGoalSet(true); }} style={{ background: 'none', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '3px 10px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 7.5, cursor: 'pointer', letterSpacing: 1 }}>
            + SET STREAM GOAL
          </button>
        </div>
      )}

      {/* ════════════════ SCROLLABLE BODY ════════════════ */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>

        {/* ── Stage Section ── */}
        <div style={{ padding: '12px 14px 6px', position: 'relative', overflow: 'hidden' }}>

          {/* Stage header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 20, color: TEXT, letterSpacing: .3 }}>Stage</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: MUTED, letterSpacing: 1 }}>{onStage.length}/{MAX_STAGE}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {/* Panel mode (list vs grid for 20-person) */}
              <div style={{ display: 'flex', background: CARD, borderRadius: 8, overflow: 'hidden', border: '1px solid ' + BORDER }}>
                {[
                  { id: 'grid', icon: '⊞', title: 'Grid' },
                  { id: 'list', icon: '☰', title: 'List' },
                ].map(function(m) {
                  return (
                    <button key={m.id} onClick={function() { setPanelMode(m.id); }}
                      style={{ background: panelMode === m.id ? CARD2 : 'transparent', border: 'none', color: panelMode === m.id ? TEXT : MUTED, cursor: 'pointer', padding: '5px 10px', fontSize: 12, transition: 'background .15s' }}>
                      {m.icon}
                    </button>
                  );
                })}
              </div>
              {/* Stage layout (single focus) */}
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
          {stageLayout === 'grid' && panelMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {onStage.map(function(g) {
                var gid  = g.guestId || g.userId || 'x';
                var isOwn = gid === userId;
                var isSp  = !!speakingIds[gid];
                return (
                  <div key={gid} onClick={function() { setFeaturedId(gid); setStageLayout('featured'); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                      background: CARD, borderRadius: 12, padding: '8px 12px',
                      border: '1.5px solid ' + (isSp ? TEAL + '88' : (gid === featuredId ? gold + '44' : BORDER)),
                      boxShadow: isSp ? ('0 0 10px ' + TEAL + '33') : 'none',
                      animation: 'fadeSlideIn .2s ease',
                    }}>
                    {isSp && <SpeakBars color={TEAL} small />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.username || gid}
                      </div>
                    </div>
                    <RolePill role={g.role || 'guest'} />
                    {isOwn && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={function(e) { e.stopPropagation(); toggleMute(); }}
                          style={{ background: isMuted ? 'rgba(255,26,60,.15)' : CARD2, border: 'none', borderRadius: 8, padding: '4px 8px', color: isMuted ? RED : MUTED, cursor: 'pointer', fontSize: 12 }}>
                          {isMuted ? '🔇' : '🎙'}
                        </button>
                        <button onClick={function(e) { e.stopPropagation(); toggleCam(); }}
                          style={{ background: isCamOff ? 'rgba(255,26,60,.15)' : CARD2, border: 'none', borderRadius: 8, padding: '4px 8px', color: isCamOff ? RED : MUTED, cursor: 'pointer', fontSize: 12 }}>
                          {isCamOff ? '📷' : '🎥'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {stageLayout === 'grid' && panelMode !== 'list' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: n === 1 ? 'center' : 'flex-start' }}>
              {onStage.map(function(g) {
                var gid  = g.guestId || g.userId || 'x';
                var isOwn = gid === userId;
                var isSp  = !!speakingIds[gid];
                return (
                  <div key={gid}
                    style={{
                      width: sz, flexShrink: 0,
                      background: CARD, borderRadius: 14, overflow: 'hidden',
                      border: '1.5px solid ' + (isSp ? TEAL + '88' : (gid === featuredId ? gold + '44' : BORDER)),
                      boxShadow: isSp ? ('0 0 16px ' + TEAL + '33') : 'none',
                      transition: 'border-color .2s, box-shadow .2s',
                      animation: 'fadeSlideIn .25s ease',
                      position: 'relative',
                    }}>
                    <div style={{ position: 'relative' }} onClick={function() { setFeaturedId(gid); setStageLayout('featured'); }}>
                      {audioOnly ? (
                        <div style={{ width: sz, height: sz, background: 'linear-gradient(135deg,' + CARD2 + ',' + BG + ')', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                          <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,' + BURG + '55,' + CARD + ')', border: '2px solid ' + (isSp ? TEAL : DIM), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: GOLD }}>{(g.username || gid).charAt(0).toUpperCase()}</span>
                          </div>
                          {isSp && <WaveBars color={TEAL} />}
                        </div>
                      ) : (
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
                      )}
                      {/* Expand button overlay */}
                      <button onClick={function(e) { e.stopPropagation(); setExpandedCell(gid); }}
                        style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, color: TEXT, zIndex: 5 }}>
                        ⤢
                      </button>
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
          <ChyronOverlay socket={socket} roomId={roomId} role={role} isLive={isLive} />
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
            { emoji: '💸', label: 'Pay',      active: false, onTap: function() { setShowPaySheet(true); } },
            { emoji: '💬', label: 'SC',       active: false, onTap: function() { setShowSuperChatSheet(true); } },
            { emoji: '🔗', label: 'Share',    active: false, onTap: function() { setShowShareSheet(true); } },
            { emoji: '🎤', label: audioOnly ? 'Video ON' : 'Audio', active: audioOnly, onTap: function() { setAudioOnly(function(v) { return !v; }); if (addToast) addToast(audioOnly ? 'Video mode on' : '🎤 Audio-only mode', 'info'); } },
            { emoji: privateMode ? '🔒' : '🔓', label: 'Private', active: privateMode, onTap: function() { if (role === 'host') { setShowPrivateSet(true); } else { if (addToast) addToast(privateMode ? 'Room is private — invite only' : 'Room is open', 'info'); } } },
            { emoji: '📹', label: 'Record',   active: recState === 'recording', onTap: function() { setShowRecorder(true); } },
            { emoji: '📊', label: 'Poll',     active: false, onTap: function() { setShowQa(true); setShowPollCreate(true); setShowVsCreate(false); setShowJudges(false); setChatOpen(false); } },
            { emoji: '⚔',  label: 'VS',      active: false, onTap: function() { setShowQa(true); setShowVsCreate(true); setShowPollCreate(false); setShowJudges(false); setChatOpen(false); } },
            { emoji: '⚖',  label: 'Judges',  active: false, onTap: function() { setShowQa(true); setShowJudges(true); setShowPollCreate(false); setShowVsCreate(false); setChatOpen(false); } },
            { emoji: '⚙',  label: 'Camera',  active: false, onTap: function() { setShowMediaConf(true); } },
          ].map(function(tool) {
            return (
              <div key={tool.label} onClick={tool.onTap} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, cursor: 'pointer' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: tool.active ? 'rgba(201,168,76,.18)' : CARD2, border: '1px solid ' + (tool.active ? 'rgba(201,168,76,.4)' : BORDER), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'background .15s' }}>
                  {tool.emoji}
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: tool.active ? TEAL : MUTED, letterSpacing: .5 }}>{tool.label}</span>
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

      {/* ════════════════ AUDIO-ONLY BANNER ════════════════ */}
      {audioOnly && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(201,168,76,.12)', borderBottom: '1px solid rgba(201,168,76,.3)', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 35, pointerEvents: 'none' }}>
          <WaveBars color={TEAL} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, letterSpacing: 2 }}>AUDIO-ONLY MODE</span>
        </div>
      )}

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
              if (m.type === 'super') {
                var scColor = m.tierColor || '#C9A84C';
                var scDollars = '$' + (Math.floor(m.amountCents || 0) / 100).toFixed(2);
                return (
                  <div key={m.id || i} style={{ marginBottom: 12, background: scColor + '18', border: '1.5px solid ' + scColor + '66', borderRadius: 12, padding: '10px 12px', animation: 'fadeSlideIn .2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>💬</span>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: scColor, letterSpacing: 1 }}>{scDollars} SUPER CHAT</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: scColor, opacity: .8 }}>from {m.username}</span>
                    </div>
                    <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.45, fontWeight: 600 }}>{m.message}</p>
                  </div>
                );
              }
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

      {/* ════════════════ GOAL SETTER MODAL ════════════════ */}
      {showGoalSet && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 70, animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: TEXT, marginBottom: 4 }}>Set Stream Goal</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 20 }}>Visible to all viewers as a progress bar</div>
            <input
              type="text"
              maxLength={40}
              placeholder="Goal label (e.g. New Studio Setup)"
              value={goalDraft.label}
              onChange={function(e) { setGoalDraft(function(d) { return { label: e.target.value, amount: d.amount }; }); }}
              style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '11px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 16, outline: 'none', marginBottom: 10 }}
            />
            <input
              type="number"
              min="1"
              placeholder="Goal amount in $ (e.g. 500)"
              value={goalDraft.amount}
              onChange={function(e) { setGoalDraft(function(d) { return { label: d.label, amount: e.target.value }; }); }}
              style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '11px 14px', color: TEXT, fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, outline: 'none', marginBottom: 16, letterSpacing: 1 }}
            />
            <button onClick={function() {
              var amt = parseFloat(goalDraft.amount);
              if (!goalDraft.label.trim() || !amt || amt <= 0) { if (addToast) addToast('Enter a label and amount', 'error'); return; }
              if (setStreamGoal) setStreamGoal({ label: goalDraft.label.trim(), goalCents: Math.floor(amt * 100) });
              setShowGoalSet(false);
              setGoalDraft({ label: '', amount: '' });
              if (addToast) addToast('Stream goal set!', 'success');
            }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>
              ACTIVATE GOAL
            </button>
            <button onClick={function() { setShowGoalSet(false); setGoalDraft({ label: '', amount: '' }); }} style={{ width: '100%', background: 'transparent', border: 'none', marginTop: 10, padding: '10px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 14, color: MUTED, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ MUSIC BANNER ════════════════ */}
      {musicBanner && (
        <div style={{
          position: 'absolute', bottom: 68, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(14,12,9,.96)',
          border: '1.5px solid rgba(201,168,76,.5)',
          borderRadius: 999, padding: '8px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'musicIn .35s ease',
          boxShadow: '0 0 18px rgba(201,168,76,.2)',
          whiteSpace: 'nowrap', zIndex: 42, pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 18 }}>{musicBanner.emoji}</span>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, letterSpacing: .3 }}>{musicBanner.title}</div>
            {musicBanner.style ? <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, letterSpacing: 1 }}>{musicBanner.style.toUpperCase()}</div> : null}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, borderLeft: '1px solid ' + BORDER, paddingLeft: 10 }}>
            shared by {musicBanner.sharedBy}
          </div>
        </div>
      )}

      {/* ════════════════ THEATER MODE OVERLAY ════════════════ */}
      {theaterMode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#000', display: 'flex' }}>
          {/* Video fills screen */}
          <div
            style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
            onClick={function() { setTheaterChatVisible(function(v) { return !v; }); }}
          >
            {/* Reuse the current stage view inside theater mode */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: 'rgba(201,168,76,.4)', letterSpacing: 3 }}>
                {stageLayout === 'featured' ? 'FEATURED VIEW' : 'GRID VIEW'} — THEATER MODE
              </div>
            </div>
            {/* Exit + controls bar (always visible at top) */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(rgba(0,0,0,.7),transparent)', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isLive && <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: RED, borderRadius: 999, padding: '3px 9px' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'livePulse 1.2s infinite' }} />
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#fff', letterSpacing: 2 }}>LIVE</span>
                </div>}
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(240,232,212,.6)' }}>{viewerCount || 0} viewers</span>
              </div>
              <button
                onClick={function(e) { e.stopPropagation(); setTheaterMode(false); }}
                style={{ background: 'rgba(14,12,9,.7)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '6px 12px', color: '#C9A84C', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 2, cursor: 'pointer' }}
              >
                ⊡ EXIT THEATER
              </button>
            </div>
            {/* Tap hint */}
            <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'rgba(240,232,212,.3)', letterSpacing: 1, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              TAP TO {theaterChatVisible ? 'HIDE' : 'SHOW'} CHAT
            </div>
          </div>

          {/* Floating chat panel */}
          {theaterChatVisible && (
            <div style={{ width: 280, flexShrink: 0, background: 'rgba(14,12,9,.88)', borderLeft: '1px solid rgba(201,168,76,.12)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(201,168,76,.1)', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 2 }}>
                💬 LIVE CHAT
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {(chat || []).slice(-80).map(function(msg, i) {
                  var isSuper = msg.type === 'super';
                  return (
                    <div key={msg.id || i} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: isSuper ? '#C9A84C' : '#8A7A62' }}>
                        {msg.username}
                        {isSuper && <span style={{ color: '#C9A84C', marginLeft: 4 }}>💛 ${(Math.floor(msg.amountCents || 0) / 100).toFixed(2)}</span>}
                      </span>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: '#F0E8D4', lineHeight: 1.3 }}>{msg.message}</span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              {/* Theater chat input */}
              <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(201,168,76,.1)', display: 'flex', gap: 6 }}>
                <input
                  value={chatInput}
                  onChange={function(e) { setChatInput(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') { sendChat(); } }}
                  placeholder="Say something..."
                  style={{ flex: 1, background: '#241C12', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '7px 10px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }}
                />
                <button onClick={sendChat} style={{ background: '#800020', border: 'none', borderRadius: 8, padding: '7px 10px', color: '#C9A84C', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                  SEND
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ BOTTOM TOOLBAR ════════════════ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(14,12,9,.97)',
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
          <IconBtn
            icon="❓"
            label="Q&A"
            active={showQa}
            badge={qaQueue.length > 0 && !showQa ? qaQueue.length : 0}
            onPress={function() { setShowQa(function(v) { return !v; }); setChatOpen(false); }}
          />
          <IconBtn
            icon="⚙"
            label="Camera"
            active={showMediaConf}
            onPress={function() { setShowMediaConf(function(v) { return !v; }); }}
          />
          <IconBtn
            icon={theaterMode ? '⊡' : '⛶'}
            label={theaterMode ? 'Exit' : 'Theater'}
            active={theaterMode}
            activeColor={gold}
            onPress={function() { setTheaterMode(function(v) { return !v; }); }}
          />
        </div>
      </div>

      {/* ════════════════ TIP FEED (right edge, floating) ════════════════ */}
      {tipFeed.length > 0 && (
        <div style={{ position: 'absolute', right: 8, top: 130, zIndex: 45, display: 'flex', flexDirection: 'column', gap: 5, pointerEvents: 'none', maxWidth: 170 }}>
          {tipFeed.slice(0, 5).map(function(tip, i) {
            var isLarge = tip.amount >= 10000;
            var isMed   = tip.amount >= 500;
            var border  = isLarge ? 'rgba(201,168,76,.7)' : isMed ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.12)';
            var amtColor = isLarge ? GOLD : isMed ? TEAL : TEXT;
            return (
              <div key={tip.id} style={{
                background: 'rgba(14,12,9,.92)', border: '1px solid ' + border,
                borderRadius: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 7,
                animation: 'tipSlide .3s ease ' + (i * .05) + 's both',
                boxShadow: isLarge ? ('0 0 12px rgba(201,168,76,.25)') : 'none',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{tip.emoji}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tip.from}</div>
                  {tip.amount > 0 && (
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: amtColor, letterSpacing: 1 }}>
                      ${(Math.floor(tip.amount) / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {/* Leaderboard toggle */}
          <button onClick={function() { setShowLeader(function(v) { return !v; }); }}
            style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '4px 8px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer', letterSpacing: .5, pointerEvents: 'all' }}>
            🏆 TOP TIPPERS
          </button>
        </div>
      )}

      {/* ════════════════ TIP LEADERBOARD PANEL ════════════════ */}
      {showLeader && tipLeader.length > 0 && (
        <div style={{
          position: 'absolute', right: 8, top: 80, zIndex: 60,
          background: 'rgba(9,7,14,.97)', border: '1px solid rgba(201,168,76,.3)',
          borderRadius: 14, padding: '12px 14px', width: 180,
          animation: 'fadeSlideIn .2s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,.6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, letterSpacing: 2 }}>🏆 TOP TIPPERS</span>
            <button onClick={function() { setShowLeader(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
          </div>
          {tipLeader.map(function(e, i) {
            var medals = ['🥇', '🥈', '🥉'];
            return (
              <div key={e.username} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{medals[i] || (i + 1) + '.'}</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 12, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.username}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: GOLD, letterSpacing: 1, flexShrink: 0 }}>${(Math.floor(e.totalCents) / 100).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════ VS POLL OVERLAY ════════════════ */}
      {vsPoll && (
        <div style={{
          position: 'absolute', left: 10, right: 10,
          bottom: activePoll ? 228 : 74, zIndex: 53,
          background: 'rgba(9,7,14,.97)',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 14, overflow: 'hidden',
          animation: 'vsIn .3s ease',
          boxShadow: '0 8px 36px rgba(0,0,0,.65)',
        }}>
          {/* VS header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: GOLD, letterSpacing: 2 }}>VS POLL</span>
              {vsPoll.active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: RED, animation: 'livePulse 1.2s infinite' }} />}
              {!vsPoll.active && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>FINAL</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>{vsPoll.totalVotes} vote{vsPoll.totalVotes !== 1 ? 's' : ''}</span>
              {role === 'host' && vsPoll.active && (
                <button onClick={function() { if (socket) socket.emit('vs-end', { roomId: roomId }); }}
                  style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 9, padding: '0 2px', letterSpacing: .5, fontFamily: "'DM Mono',monospace" }}>END</button>
              )}
            </div>
          </div>
          {/* Animated split bar */}
          <div style={{ margin: '0 14px 6px', height: 7, background: 'rgba(255,255,255,.07)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999, background: 'linear-gradient(90deg,#C9A84C,#2A6FFF)', width: (vsPoll.pctA || 50) + '%', transition: 'width .7s cubic-bezier(.4,0,.2,1)' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, borderRadius: 999, background: 'linear-gradient(270deg,' + RED + ',#C01230)', width: (vsPoll.pctB || 50) + '%', transition: 'width .7s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          {/* Side cards */}
          <div style={{ display: 'flex', padding: '0 10px 10px', gap: 8 }}>
            <button onClick={function() {
              if (!socket || vsVoted || !vsPoll.active) return;
              socket.emit('vs-vote', { roomId: roomId, side: 'A' });
              setVsVoted('A');
            }} style={{
              flex: 1, background: vsVoted === 'A' ? 'rgba(90,143,255,.22)' : 'rgba(90,143,255,.07)',
              border: '1.5px solid ' + (vsVoted === 'A' ? '#C9A84C' : 'rgba(90,143,255,.28)'),
              borderRadius: 10, padding: '8px 6px',
              cursor: (vsPoll.active && !vsVoted) ? 'pointer' : 'default',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'background .2s, border-color .2s',
            }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, textAlign: 'center', lineHeight: 1.2 }}>{vsPoll.sideA}</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C', letterSpacing: 1, lineHeight: 1 }}>{vsPoll.pctA}%</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>{vsPoll.votesA} vote{vsPoll.votesA !== 1 ? 's' : ''}</span>
              {vsVoted === 'A' && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', marginTop: 1 }}>✓ YOUR PICK</span>}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: GOLD, letterSpacing: 3 }}>VS</span>
            </div>
            <button onClick={function() {
              if (!socket || vsVoted || !vsPoll.active) return;
              socket.emit('vs-vote', { roomId: roomId, side: 'B' });
              setVsVoted('B');
            }} style={{
              flex: 1, background: vsVoted === 'B' ? 'rgba(255,26,60,.22)' : 'rgba(255,26,60,.07)',
              border: '1.5px solid ' + (vsVoted === 'B' ? RED : 'rgba(255,26,60,.28)'),
              borderRadius: 10, padding: '8px 6px',
              cursor: (vsPoll.active && !vsVoted) ? 'pointer' : 'default',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'background .2s, border-color .2s',
            }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, textAlign: 'center', lineHeight: 1.2 }}>{vsPoll.sideB}</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: RED, letterSpacing: 1, lineHeight: 1 }}>{vsPoll.pctB}%</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>{vsPoll.votesB} vote{vsPoll.votesB !== 1 ? 's' : ''}</span>
              {vsVoted === 'B' && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: RED, marginTop: 1 }}>✓ YOUR PICK</span>}
            </button>
          </div>
          {!vsVoted && vsPoll.active && (
            <div style={{ padding: '0 14px 8px', textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>Tap a side to cast your vote</div>
          )}
        </div>
      )}

      {/* ════════════════ ACTIVE POLL ════════════════ */}
      {activePoll && (
        <div style={{
          position: 'absolute', left: 10, right: 10, bottom: 74, zIndex: 52,
          background: 'rgba(9,7,14,.96)', border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 14, padding: '14px 16px',
          animation: 'fadeSlideIn .25s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT }}>{activePoll.q}</div>
            {role === 'host' && (
              <button onClick={function() { if (socket) socket.emit('poll-end', { roomId: roomId }); setActivePoll(null); }}
                style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 12, padding: '0 2px', flexShrink: 0 }}>END</button>
            )}
          </div>
          {(function() {
            var totalVotes = activePoll.opts.reduce(function(s, o) { return s + o.votes; }, 0);
            return activePoll.opts.map(function(opt, idx) {
              var pct = totalVotes > 0 ? Math.floor((opt.votes / totalVotes) * 100) : 0;
              var isWin = opt.votes > 0 && opt.votes === Math.max.apply(null, activePoll.opts.map(function(o) { return o.votes; }));
              return (
                <div key={idx} onClick={function() { if (!pollVoted) votePoll(idx); }}
                  style={{ marginBottom: 6, cursor: pollVoted ? 'default' : 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 13, color: isWin ? GOLD : TEXT }}>{opt.text}</span>
                    {pollVoted && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: isWin ? GOLD : MUTED }}>{pct}%</span>}
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 999, overflow: 'hidden' }}>
                    {pollVoted && (
                      <div style={{
                        height: '100%', borderRadius: 999,
                        background: isWin ? GOLD : 'rgba(201,168,76,.6)',
                        width: pct + '%', transition: 'width .5s ease',
                      }} />
                    )}
                  </div>
                </div>
              );
            });
          })()}
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, marginTop: 6 }}>
            {pollVoted ? (activePoll.opts.reduce(function(s, o) { return s + o.votes; }, 0) + ' votes') : 'Tap to vote'}
          </div>
        </div>
      )}

      {/* ════════════════ Q&A PANEL ════════════════ */}
      {showQa && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 62,
          height: '60%', background: 'rgba(9,7,14,.97)',
          borderTop: '1px solid ' + BORDER,
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp .22s ease', zIndex: 49,
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: TEXT }}>Q&A</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {role === 'host' && (
                <button onClick={function() { setShowPollCreate(function(v) { var next = !v; if (next) { setShowVsCreate(false); setShowJudges(false); } return next; }); }}
                  style={{ background: showPollCreate ? 'rgba(201,168,76,.25)' : 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '5px 8px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                  📊 POLL
                </button>
              )}
              {role === 'host' && (
                <button onClick={function() { setShowVsCreate(function(v) { var next = !v; if (next) { setShowPollCreate(false); setShowJudges(false); } return next; }); }}
                  style={{ background: showVsCreate ? 'rgba(255,26,60,.25)' : 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 8, padding: '5px 8px', color: RED, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                  ⚔ VS
                </button>
              )}
              {(role === 'host' || judges.some(function(j) { return j.userId === userId; })) && (
                <button onClick={function() { setShowJudges(function(v) { var next = !v; if (next) { setShowPollCreate(false); setShowVsCreate(false); } return next; }); }}
                  style={{ background: showJudges ? 'rgba(201,168,76,.2)' : 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '5px 8px', color: TEAL, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                  ⚖{judges.length > 0 ? (' ' + judges.length) : ''}
                </button>
              )}
              <button onClick={function() { setShowQa(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
            </div>
          </div>

          {/* Poll creator (host only) */}
          {showPollCreate && role === 'host' && (
            <div style={{ padding: '12px 14px', borderBottom: '1px solid ' + BORDER, background: CARD, flexShrink: 0 }}>
              <input value={pollDraft.q} onChange={function(e) { setPollDraft(function(d) { return { q: e.target.value, opts: d.opts }; }); }}
                placeholder="Poll question..."
                style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', marginBottom: 8 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                {pollDraft.opts.map(function(opt, i) {
                  return (
                    <input key={i} value={opt}
                      onChange={function(e) { var v = e.target.value; setPollDraft(function(d) { var o = d.opts.slice(); o[i] = v; return { q: d.q, opts: o }; }); }}
                      placeholder={'Option ' + (i + 1)}
                      style={{ background: CARD2, border: '1px solid ' + DIM, borderRadius: 6, padding: '7px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, outline: 'none' }} />
                  );
                })}
              </div>
              <button onClick={submitPoll} style={{ width: '100%', background: BURG, border: 'none', borderRadius: 8, padding: '9px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>LAUNCH POLL</button>
            </div>
          )}

          {/* VS Poll creator (host only) */}
          {showVsCreate && role === 'host' && (
            <div style={{ padding: '12px 14px', borderBottom: '1px solid ' + BORDER, background: CARD, flexShrink: 0 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: RED, letterSpacing: 2, marginBottom: 8 }}>HEAD-TO-HEAD VS POLL</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={vsDraft.sideA}
                  onChange={function(e) { var v = e.target.value; setVsDraft(function(d) { return { sideA: v, sideB: d.sideB, duration: d.duration }; }); }}
                  placeholder="Side A (e.g. Player 1)"
                  style={{ flex: 1, background: 'rgba(90,143,255,.08)', border: '1px solid rgba(90,143,255,.35)', borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, padding: '0 2px' }}>VS</div>
                <input value={vsDraft.sideB}
                  onChange={function(e) { var v = e.target.value; setVsDraft(function(d) { return { sideA: d.sideA, sideB: v, duration: d.duration }; }); }}
                  placeholder="Side B (e.g. Player 2)"
                  style={{ flex: 1, background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.35)', borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, flexShrink: 0 }}>DURATION (sec)</span>
                <input type="number" min="10" max="300" value={vsDraft.duration}
                  onChange={function(e) { var v = e.target.value; setVsDraft(function(d) { return { sideA: d.sideA, sideB: d.sideB, duration: v }; }); }}
                  style={{ width: 70, background: CARD2, border: '1px solid ' + DIM, borderRadius: 6, padding: '6px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 12, outline: 'none', textAlign: 'center' }} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>10–300s</span>
              </div>
              <button onClick={startVs} style={{ width: '100%', background: 'linear-gradient(90deg,rgba(90,143,255,.8),rgba(255,26,60,.8))', border: 'none', borderRadius: 8, padding: '9px', color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', letterSpacing: 2 }}>LAUNCH VS POLL</button>
            </div>
          )}

          {/* Judges panel */}
          {showJudges && (
            <div style={{ padding: '12px 14px', borderBottom: '1px solid ' + BORDER, background: CARD, flexShrink: 0, maxHeight: 240, overflowY: 'auto' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: TEAL, letterSpacing: 2, marginBottom: 8 }}>JUDGE PANEL</div>
              {role === 'host' && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <input value={judgeAssignName}
                    onChange={function(e) { setJudgeAssignName(e.target.value); }}
                    placeholder="Username to assign as judge"
                    style={{ flex: 1, background: CARD2, border: '1px solid ' + DIM, borderRadius: 8, padding: '7px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, outline: 'none' }} />
                  <button onClick={function() {
                    var name = judgeAssignName.trim();
                    if (!name) return;
                    var found = allParticipants.find(function(p) { return (p.username || '').toLowerCase() === name.toLowerCase(); });
                    var uid = found ? (found.guestId || found.userId) : name;
                    var uname = found ? (found.username || name) : name;
                    if (socket) socket.emit('judge-assign', { roomId: roomId, userId: uid, username: uname });
                    setJudgeAssignName('');
                    if (addToast) addToast(uname + ' assigned as judge', 'success');
                  }} style={{ background: TEAL, border: 'none', borderRadius: 8, padding: '7px 12px', color: BG, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>ADD</button>
                </div>
              )}
              {judges.length === 0 && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, textAlign: 'center', padding: '8px 0' }}>No judges assigned yet</div>
              )}
              {judges.map(function(j) {
                return (
                  <div key={j.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, background: CARD2, borderRadius: 8, padding: '6px 10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.username}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{j.scoreCount} score{j.scoreCount !== 1 ? 's' : ''}</div>
                    </div>
                    {j.avgScore !== null && (
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: GOLD, lineHeight: 1, letterSpacing: 1 }}>{j.avgScore}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>AVG</div>
                      </div>
                    )}
                    {role === 'host' && (
                      <button onClick={function() { if (socket) socket.emit('judge-remove', { roomId: roomId, userId: j.userId }); }}
                        style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 12, padding: '2px 4px', flexShrink: 0 }}>✕</button>
                    )}
                  </div>
                );
              })}
              {judges.some(function(j) { return j.userId === userId; }) && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid ' + BORDER }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, letterSpacing: 1, marginBottom: 8 }}>YOUR SCORE</div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                    {[0,1,2,3,4,5,6,7,8,9,10].map(function(n) {
                      return (
                        <button key={n} onClick={function() { setJudgeScoreVal(String(n)); }}
                          style={{ width: 30, height: 30, borderRadius: 7, background: judgeScoreVal === String(n) ? TEAL : CARD2, border: '1px solid ' + (judgeScoreVal === String(n) ? TEAL : DIM), color: judgeScoreVal === String(n) ? BG : TEXT, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer' }}>
                          {n}
                        </button>
                      );
                    })}
                  </div>
                  <input value={judgeScoreLabel}
                    onChange={function(e) { setJudgeScoreLabel(e.target.value); }}
                    placeholder="Optional label (e.g. Round 1)"
                    style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 6, padding: '6px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, outline: 'none', marginBottom: 6 }} />
                  <button onClick={submitJudgeScore}
                    style={{ width: '100%', background: judgeScoreVal !== '' ? TEAL : CARD2, border: 'none', borderRadius: 8, padding: '8px', color: judgeScoreVal !== '' ? BG : MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: judgeScoreVal !== '' ? 'pointer' : 'default', letterSpacing: 1 }}>
                    SUBMIT{judgeScoreVal !== '' ? ' (' + judgeScoreVal + '/10)' : ' SCORE'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Q list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', WebkitOverflowScrolling: 'touch' }}>
            {qaQueue.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>No questions yet — be the first!</div>
            )}
            {qaQueue.map(function(item) {
              return (
                <div key={item.id} style={{ marginBottom: 10, background: CARD, borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start', animation: 'qaIn .2s ease' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: GOLD, marginBottom: 3 }}>{item.username}</div>
                    <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{item.text}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <button onClick={function() {
                      if (qaMyVotes[item.id]) return;
                      if (socket) socket.emit('qa-upvote', { roomId: roomId, id: item.id });
                      setQaMyVotes(function(v) { return Object.assign({}, v, { [item.id]: true }); });
                      setQaQueue(function(q) { return q.map(function(x) { return x.id === item.id ? { id: x.id, username: x.username, text: x.text, upvotes: x.upvotes + 1 } : x; }).sort(function(a, b) { return b.upvotes - a.upvotes; }); });
                    }} style={{ background: qaMyVotes[item.id] ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.06)', border: '1px solid ' + (qaMyVotes[item.id] ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.1)'), borderRadius: 6, padding: '4px 8px', color: qaMyVotes[item.id] ? GOLD : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>
                      ▲ {item.upvotes}
                    </button>
                    {role === 'host' && (
                      <button onClick={function() { if (socket) socket.emit('qa-dismiss', { roomId: roomId, id: item.id }); setQaQueue(function(q) { return q.filter(function(x) { return x.id !== item.id; }); }); }}
                        style={{ background: 'none', border: 'none', color: MUTED, fontSize: 10, cursor: 'pointer', padding: '2px 4px' }}>✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit question input */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid ' + BORDER, display: 'flex', gap: 8, flexShrink: 0 }}>
            <input value={qaInput} onChange={function(e) { setQaInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') submitQa(); }}
              placeholder="Ask a question..."
              style={{ flex: 1, background: CARD2, border: '1px solid ' + DIM, borderRadius: 999, padding: '9px 16px', fontSize: 13, color: TEXT, outline: 'none', fontFamily: "'Barlow Condensed',sans-serif" }} />
            <button onClick={submitQa} style={{ background: gold, border: 'none', borderRadius: 999, padding: '9px 16px', fontWeight: 700, fontSize: 13, color: BG, cursor: 'pointer' }}>Ask</button>
          </div>
        </div>
      )}

      {/* ════════════════ DIRECT PAY SHEET ════════════════ */}
      {showPaySheet && (function() {
        var handles = (function() {
          try { return JSON.parse(localStorage.getItem('sw_directpay_handles') || '{}'); } catch(e) { return {}; }
        })();
        var platHandles = getPlatformHandles();
        var hasAnyCreator = DP_PLATFORMS.some(function(p) { return !!(handles[p.id] || '').trim(); });
        var hasAnyPlat    = DP_PLATFORMS.some(function(p) { return !!(platHandles[p.id] || '').trim(); });

        function renderPayRow(p, handle, accentColor) {
          var hasHandle = !!handle.trim();
          return (
            <button key={p.id} onClick={function() { openPayLink(p, handle); }}
              style={{
                background: hasHandle ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)',
                border: '1.5px solid ' + (hasHandle ? (accentColor + '55') : 'rgba(255,255,255,.07)'),
                borderRadius: 14, padding: '12px 16px', cursor: hasHandle ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                opacity: hasHandle ? 1 : .4, transition: 'background .2s',
              }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{p.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: TEXT }}>{p.name}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: hasHandle ? accentColor : MUTED, letterSpacing: .5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hasHandle ? handle : 'Not set up'}
                </div>
              </div>
              {hasHandle && (
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: accentColor, letterSpacing: 1, flexShrink: 0 }}>
                  {p.buildUrl ? 'OPEN →' : 'COPY'}
                </span>
              )}
            </button>
          );
        }

        return (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 72, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowPaySheet(false); }}>
            <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '20px 18px 34px', border: '1px solid ' + BORDER, maxHeight: '85vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 1 }}>Support {hostName}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5 }}>90% creator &bull; 10% platform fee</div>
                </div>
                <button onClick={function() { setShowPaySheet(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 22, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
              </div>

              {/* ── Creator 90% ── */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, letterSpacing: 1.5, marginBottom: 8 }}>CREATOR — 90%</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DP_PLATFORMS.map(function(p) { return renderPayRow(p, handles[p.id] || '', p.color); })}
                </div>
              </div>

              {/* ── Platform 10% ── */}
              <div style={{ marginTop: 16, marginBottom: 4 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1.5, marginBottom: 8 }}>SEEWHY PLATFORM FEE — 10%</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DP_PLATFORMS.map(function(p) { return renderPayRow(p, platHandles[p.id] || '', GOLD); })}
                </div>
              </div>

              {role === 'host' && (
                <div style={{ marginTop: 16, padding: '12px 14px', background: CARD, borderRadius: 12, border: '1px solid ' + BORDER }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1, marginBottom: 10 }}>SET UP YOUR PAY LINKS</div>
                  {DP_PLATFORMS.map(function(p) {
                    var handle = handles[p.id] || '';
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{p.emoji}</span>
                        <input
                          value={handle}
                          onChange={function(e) {
                            var v = e.target.value;
                            var next = Object.assign({}, handles);
                            next[p.id] = v;
                            localStorage.setItem('sw_directpay_handles', JSON.stringify(next));
                            if (addToast) addToast(p.name + ' handle saved', 'success');
                          }}
                          placeholder={p.name + ' handle / phone / email'}
                          style={{ flex: 1, background: BG, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ════════════════ SUPER CHAT SHEET ════════════════ */}
      {showSuperChatSheet && (function() {
        var SC_TIERS = [
          { cents: 100,  label: '$1',  color: '#C9A84C' },
          { cents: 200,  label: '$2',  color: '#C9A84C' },
          { cents: 500,  label: '$5',  color: '#C9A84C' },
          { cents: 1000, label: '$10', color: '#FF8C42' },
          { cents: 2000, label: '$20', color: '#FF1A3C' },
          { cents: 5000, label: '$50', color: '#9B59B6' },
        ];
        var selectedTier = SC_TIERS.filter(function(t) { return t.cents === scAmt; })[0] || SC_TIERS[0];

        function sendSuperChat() {
          var msg = scMsg.trim();
          if (!msg) { if (addToast) addToast('Write a message first', 'error'); return; }
          if (!socket) return;
          socket.emit('super-chat', {
            roomId:      roomId,
            userId:      userId,
            username:    username,
            message:     msg,
            amountCents: scAmt,
          });
          setScMsg('');
          setShowSuperChatSheet(false);
          if (addToast) addToast('💬 Super Chat sent!', 'success');
        }

        return (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 72, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowSuperChatSheet(false); }}>
            <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '20px 18px 34px', border: '1px solid ' + BORDER }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 1 }}>Super Chat</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5 }}>Highlighted message · 90% to creator · 10% platform</div>
                </div>
                <button onClick={function() { setShowSuperChatSheet(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 22, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
              </div>

              {/* Tier selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                {SC_TIERS.map(function(t) {
                  var active = scAmt === t.cents;
                  return (
                    <button key={t.cents} onClick={function() { setScAmt(t.cents); }}
                      style={{ flexShrink: 0, background: active ? (t.color + '28') : 'rgba(255,255,255,.04)', border: '2px solid ' + (active ? t.color : 'rgba(255,255,255,.1)'), borderRadius: 12, padding: '10px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'border .15s' }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: active ? t.color : TEXT, letterSpacing: 1 }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Message input */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <textarea
                  value={scMsg}
                  onChange={function(e) { setScMsg(e.target.value.slice(0, 200)); }}
                  placeholder="Your message (max 200 chars)..."
                  rows={3}
                  style={{ width: '100%', background: CARD2, border: '1.5px solid ' + selectedTier.color + '66', borderRadius: 12, padding: '10px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ position: 'absolute', bottom: 8, right: 12, fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>{scMsg.length}/200</span>
              </div>

              {/* Preview */}
              <div style={{ background: selectedTier.color + '18', border: '1.5px solid ' + selectedTier.color + '55', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: selectedTier.color, letterSpacing: 1, marginBottom: 2 }}>
                  💬 {SC_TIERS.filter(function(t) { return t.cents === scAmt; })[0] && SC_TIERS.filter(function(t) { return t.cents === scAmt; })[0].label} SUPER CHAT · {username}
                </div>
                <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.4 }}>{scMsg || 'Your message here...'}</div>
              </div>

              <button onClick={sendSuperChat}
                style={{ width: '100%', background: selectedTier.color, border: 'none', borderRadius: 14, padding: '15px', color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer', letterSpacing: 2 }}>
                SEND SUPER CHAT · {SC_TIERS.filter(function(t) { return t.cents === scAmt; })[0] && SC_TIERS.filter(function(t) { return t.cents === scAmt; })[0].label}
              </button>
            </div>
          </div>
        );
      })()}

      {/* ════════════════ SOCIAL SHARE SHEET ════════════════ */}
      {showShareSheet && (function() {
        var roomUrl = window.location.origin + (roomId !== '6990f5f24823b53e21fcdc9d' ? ('?room=' + roomId) : '');
        var shareMsg = 'Watch live on SeeWhy LIVE! ' + (streamInfo && streamInfo.title ? streamInfo.title + ' — ' : '') + 'No app needed 🔴';
        return (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 72, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowShareSheet(false); }}>
            <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '20px 18px 34px', border: '1px solid ' + BORDER }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 1 }}>Share This Live</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5 }}>Outsiders can watch without the app</div>
                </div>
                <button onClick={function() { setShowShareSheet(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 22, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
              </div>
              {/* Link preview */}
              <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 12px', marginTop: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: TEAL, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roomUrl}</span>
                <button onClick={function() { navigator.clipboard.writeText(roomUrl).then(function() { if (addToast) addToast('Link copied!', 'success'); }); }}
                  style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 8, padding: '5px 10px', color: TEAL, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  COPY
                </button>
              </div>
              {/* Native share */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <button onClick={function() { navigator.share({ title: 'SeeWhy LIVE', text: shareMsg, url: roomUrl }); setShowShareSheet(false); }}
                  style={{ width: '100%', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 12, padding: '13px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer', letterSpacing: 2, marginBottom: 12 }}>
                  📤 SHARE VIA PHONE
                </button>
              )}
              {/* Platform grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {SOC_PLATFORMS.map(function(p) {
                  return (
                    <button key={p.id} onClick={function() { openSocialShare(p, roomUrl, shareMsg); setShowShareSheet(false); }}
                      style={{ background: CARD2, border: '1.5px solid ' + BORDER, borderRadius: 14, padding: '14px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'background .15s' }}>
                      <span style={{ fontSize: 26 }}>{p.emoji}</span>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: TEXT, textAlign: 'center' }}>{p.name}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5 }}>{p.open ? 'OPENS APP' : 'COPY LINK'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════ EXPANDED CELL OVERLAY ════════════════ */}
      {expandedCell && (function() {
        var g = allGuestMap[expandedCell] || { guestId: expandedCell, username: expandedCell, role: 'guest' };
        var gid = expandedCell;
        var isOwn = gid === userId;
        var isSp  = !!speakingIds[gid];
        return (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 85, display: 'flex', flexDirection: 'column', animation: 'cellExpand .25s ease' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
              {audioOnly ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                  <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,' + BURG + '55,' + CARD + ')', border: '3px solid ' + (isSp ? TEAL : DIM), display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isSp ? ('0 0 40px ' + TEAL + '55') : 'none' }}>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, color: GOLD, lineHeight: 1 }}>{(g.username || gid).charAt(0).toUpperCase()}</span>
                  </div>
                  {isSp && <WaveBars color={TEAL} />}
                </div>
              ) : (
                <div style={{ width: '100%', maxWidth: 380, borderRadius: 20, overflow: 'hidden', border: '2px solid ' + (isSp ? TEAL + '88' : BORDER), boxShadow: isSp ? ('0 0 40px ' + TEAL + '33') : 'none' }}>
                  <OctCell
                    guest={g}
                    sz={380}
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
              )}
              <button onClick={function() { setExpandedCell(null); }}
                style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: TEXT, fontSize: 16 }}>
                ✕
              </button>
            </div>
            <div style={{ padding: '14px 20px 28px', background: 'rgba(9,7,14,.97)', borderTop: '1px solid ' + BORDER }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 22, color: TEXT }}>{g.username || gid}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                    <RolePill role={g.role || (isOwn ? role : 'guest')} />
                    {isSp && <SpeakBars color={TEAL} />}
                  </div>
                </div>
                {isOwn && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={toggleMute} style={{ background: isMuted ? 'rgba(255,26,60,.2)' : CARD2, border: '1px solid ' + (isMuted ? 'rgba(255,26,60,.5)' : BORDER), borderRadius: 12, padding: '10px 16px', color: isMuted ? RED : MUTED, cursor: 'pointer', fontSize: 18 }}>{isMuted ? '🔇' : '🎙'}</button>
                    <button onClick={toggleCam}  style={{ background: isCamOff ? 'rgba(255,26,60,.2)' : CARD2, border: '1px solid ' + (isCamOff ? 'rgba(255,26,60,.5)' : BORDER), borderRadius: 12, padding: '10px 16px', color: isCamOff ? RED : MUTED, cursor: 'pointer', fontSize: 18 }}>{isCamOff ? '📷' : '🎥'}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════ PRIVATE ROOM SETUP ════════════════ */}
      {showPrivateSet && role === 'host' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 75, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowPrivateSet(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', border: '1px solid ' + BORDER, maxHeight: '85vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 1, marginBottom: 20 }}>Room Access Controls</div>

            {/* ── Private toggle ── */}
            <div style={{ background: CARD, borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid ' + (privateMode ? 'rgba(109,30,212,.4)' : BORDER) }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: privateMode ? 0 : 12 }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT }}>🔒 Private Room</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 2 }}>{privateMode ? 'Only invited guests can join' : 'Anyone with the link can join'}</div>
                </div>
                <button onClick={function() {
                  var next = !privateMode;
                  setPrivateMode(next);
                  if (socket) socket.emit('room-private', { roomId: roomId, private: next, password: next ? (privatePwd.trim() || null) : null });
                  if (addToast) addToast(next ? '🔒 Room locked' : '🔓 Room opened', next ? 'success' : 'info');
                }} style={{ background: privateMode ? 'rgba(109,30,212,.7)' : 'rgba(255,255,255,.08)', border: '1px solid ' + (privateMode ? 'rgba(109,30,212,.5)' : BORDER), borderRadius: 8, padding: '6px 14px', color: privateMode ? '#fff' : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  {privateMode ? 'LOCKED' : 'OPEN'}
                </button>
              </div>
              {!privateMode && (
                <input type="password" value={privatePwd} onChange={function(e) { setPrivatePwd(e.target.value); }}
                  placeholder="Optional password"
                  style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none' }} />
              )}
            </div>

            {/* ── Paywall toggle ── */}
            <div style={{ background: CARD, borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid ' + (paywallOn ? 'rgba(201,168,76,.4)' : BORDER) }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: paywallOn ? 0 : 12 }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT }}>💰 Paid Entry</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 2 }}>{paywallOn ? ('$' + (Math.floor((parseFloat(paywallPrice) || 0) * 100) / 100).toFixed(2) + ' entry — viewers pay before entering') : 'Free to watch'}</div>
                </div>
                <button onClick={function() {
                  var next = !paywallOn;
                  var cents = next ? Math.floor((parseFloat(paywallPrice) || 0) * 100) : 0;
                  setPaywallOn(next);
                  if (socket) socket.emit('room-paywall', { roomId: roomId, enabled: next, priceCents: cents });
                  if (addToast) addToast(next ? ('💰 Paywall on — $' + (cents / 100).toFixed(2)) : 'Paywall removed', next ? 'success' : 'info');
                }} style={{ background: paywallOn ? 'rgba(201,168,76,.6)' : 'rgba(255,255,255,.08)', border: '1px solid ' + (paywallOn ? 'rgba(201,168,76,.5)' : BORDER), borderRadius: 8, padding: '6px 14px', color: paywallOn ? BG : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  {paywallOn ? 'ACTIVE' : 'OFF'}
                </button>
              </div>
              {!paywallOn && (
                <input type="number" min="0" step="0.01" value={paywallPrice} onChange={function(e) { setPaywallPrice(e.target.value); }}
                  placeholder="Entry price in $ (e.g. 5.00)"
                  style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, outline: 'none', letterSpacing: 1 }} />
              )}
              {!paywallOn && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, marginTop: 6, letterSpacing: .5 }}>
                  Make sure your DirectPay handles are set so viewers know where to send money
                </div>
              )}
            </div>

            <button onClick={function() { setShowPrivateSet(false); }} style={{ width: '100%', background: 'transparent', border: 'none', padding: '10px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, color: MUTED, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ VIDEO RECORDER PANEL ════════════════ */}
      {showRecorder && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'flex-end', zIndex: 76, animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 1 }}>Record Clip</div>
              <button onClick={function() {
                if (recState === 'recording') stopRecording();
                setShowRecorder(false);
                if (recState !== 'done') { setRecState('idle'); setRecSeconds(0); setRecUrl(null); }
              }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 22, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 20, letterSpacing: .5 }}>Max 10 minutes · saves to your device</div>
            {recState === 'idle' && (
              <button onClick={startRecording} style={{ width: '100%', background: RED, border: 'none', borderRadius: 12, padding: '15px', color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer', letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff' }} /> START RECORDING
              </button>
            )}
            {recState === 'recording' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', animation: 'recPulse 1s infinite' }} />
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 38, color: RED, letterSpacing: 2 }}>{fmtTime(recSeconds)}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>/ 10:00</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 999, marginBottom: 20, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: RED, borderRadius: 999, width: (recSeconds / 600 * 100) + '%', transition: 'width 1s linear' }} />
                </div>
                <button onClick={stopRecording} style={{ width: '100%', background: 'rgba(255,26,60,.15)', border: '1.5px solid rgba(255,26,60,.4)', borderRadius: 12, padding: '13px', color: RED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, cursor: 'pointer', letterSpacing: 2 }}>
                  STOP RECORDING
                </button>
              </div>
            )}
            {recState === 'done' && recUrl && (
              <div>
                <div style={{ textAlign: 'center', padding: '12px 0 20px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, color: TEAL }}>
                  ✓ Recording ready — {fmtTime(recSeconds)}
                </div>
                <a href={recUrl} download={'seewhy-clip-' + Date.now() + '.webm'}
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: TEAL, border: 'none', borderRadius: 12, padding: '14px', color: BG, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, cursor: 'pointer', letterSpacing: 2, textAlign: 'center', textDecoration: 'none', marginBottom: 10 }}>
                  💾 SAVE VIDEO
                </a>
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button onClick={function() {
                    fetch(recUrl).then(function(r) { return r.blob(); }).then(function(blob) {
                      var file = new File([blob], 'seewhy-clip.webm', { type: 'video/webm' });
                      navigator.share({ files: [file], title: 'SeeWhy LIVE Clip' }).catch(function() {});
                    });
                  }} style={{ width: '100%', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 12, padding: '13px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer', letterSpacing: 2, marginBottom: 10 }}>
                    📤 SHARE CLIP
                  </button>
                )}
                <button onClick={function() { setRecState('idle'); setRecSeconds(0); setRecUrl(null); }} style={{ width: '100%', background: 'transparent', border: 'none', padding: '10px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 14, color: MUTED, cursor: 'pointer' }}>
                  Record another clip
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ SCORE REVEAL OVERLAY ════════════════ */}
      {scoreReveal && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,.88)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: scoreReveal ? 'fadeSlideIn .2s ease' : 'scoreFade .4s ease forwards',
          pointerEvents: 'none',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: TEAL, letterSpacing: 3, marginBottom: 10, textTransform: 'uppercase' }}>JUDGE SCORE</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: MUTED, letterSpacing: 2, marginBottom: 8 }}>{scoreReveal.username}</div>
            <div style={{
              fontFamily: "'Bebas Neue',sans-serif", fontSize: 110, color: GOLD,
              lineHeight: .9, letterSpacing: -2,
              animation: 'scoreReveal .5s cubic-bezier(.175,.885,.32,1.275)',
              textShadow: '0 0 60px rgba(201,168,76,.6), 0 0 120px rgba(201,168,76,.3)',
            }}>
              {scoreReveal.score}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, marginTop: 4, letterSpacing: 2 }}>/ 10</div>
            {scoreReveal.label ? (
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, color: TEXT, marginTop: 12, letterSpacing: .5 }}>{scoreReveal.label}</div>
            ) : null}
          </div>
        </div>
      )}

      {/* ════════════════ MEDIA CONFIG PANEL ════════════════ */}
      {showMediaConf && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 80, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <MediaConfigPanel
              addToast={addToast}
              onClose={function() { setShowMediaConf(false); }}
              onApply={function(cfg) {
                setMedConf(cfg);
                setShowMediaConf(false);
                if (addToast) addToast('Camera settings applied', 'success');
              }}
            />
          </div>
        </div>
      )}

      {/* ════════════════ POLL OVERLAY ════════════════ */}
      <PollOverlay
        socket={socket}
        roomId={roomId}
        role={role}
        isLive={isLive}
        addToast={addToast}
      />
    </div>
  );
}
