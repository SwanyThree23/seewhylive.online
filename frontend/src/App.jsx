import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from './socket.js';
import rtcManager from './webrtc.js';
import RoomTab from './components/RoomTab.jsx';
import FadesTab from './components/FadesTab.jsx';
import BrandingTab from './components/BrandingTab.jsx';
import EmbedTab from './components/EmbedTab.jsx';
import SwanyBotTab from './components/SwanyBotTab.jsx';
import AnalyticsTab from './components/AnalyticsTab.jsx';
import RTMPFanoutTab from './components/RTMPFanoutTab.jsx';
import PushStreamTab from './components/PushStreamTab.jsx';
import ClipEngineTab from './components/ClipEngineTab.jsx';
import WatchPartyTab from './components/WatchPartyTab.jsx';
import GreenRoomTab from './components/GreenRoomTab.jsx';
import InsForgeTab from './components/InsForgeTab.jsx';
import AnalyticsDeepDiveTab from './components/AnalyticsDeepDiveTab.jsx';
import ScheduleTab from './components/ScheduleTab.jsx';
import WashingtonClassicTab from './components/WashingtonClassicTab.jsx';
import MonetizeTab from './components/MonetizeTab.jsx';
import AuraTab from './components/AuraTab.jsx';
import SwanAITab from './components/SwanAITab.jsx';
import AvatarHubTab from './components/AvatarHubTab.jsx';
import MusicStudioTab from './components/MusicStudioTab.jsx';
import CreatorDiscoveryTab from './components/CreatorDiscoveryTab.jsx';
import StateRankingsTab from './components/StateRankingsTab.jsx';
import ShowcaseTab from './components/ShowcaseTab.jsx';
import UploadTab from './components/UploadTab.jsx';
import OverlayTab from './components/OverlayTab.jsx';
import PortalTab from './components/PortalTab.jsx';
import CollabTab from './components/CollabTab.jsx';
import N8nTab from './components/N8nTab.jsx';
import MerchTab from './components/MerchTab.jsx';
import ReplayTab from './components/ReplayTab.jsx';
import MCPTab from './components/MCPTab.jsx';
import GuardianTab from './components/GuardianTab.jsx';
import DirectPayTab from './components/DirectPayTab.jsx';
import SocialShareTab from './components/SocialShareTab.jsx';
import GiftLayer from './components/GiftLayer.jsx';
import Toasts from './components/Toasts.jsx';
import Ticker from './components/Ticker.jsx';
import BrandChyron from './components/BrandChyron.jsx';
import DiscoverTab from './components/DiscoverTab.jsx';
import CreatorProfileTab from './components/CreatorProfileTab.jsx';
import SettingsTab from './components/SettingsTab.jsx';
import GoldenWallPanel from './components/GoldenWallPanel.jsx';

var APP_ID = '6990f5f24823b53e21fcdc9d';
var TABS = [
  { id: 'room',   label: '🎙 ROOM' },
  { id: 'fades',  label: '⚡ FADES' },
  { id: 'brand',  label: '🎨 BRAND' },
  { id: 'embed',  label: '🎬 EMBED' },
  { id: 'bot',    label: '🤖 SWANYBOT' },
  { id: 'data',   label: '📊 DATA' },
  { id: 'keys',   label: '🔑 KEYS' },
  { id: 'fanout',   label: '📡 FANOUT' },
  { id: 'push',     label: '📺 PUSH' },
  { id: 'clips',    label: '🎞 CLIPS' },
  { id: 'watch',    label: '📺 WATCH' },
  { id: 'green',    label: '🟢 GREEN' },
  { id: 'forge',    label: '⚙️ FORGE' },
  { id: 'deepdata', label: '📊 DEEP' },
  { id: 'schedule', label: '📅 SCHED' },
  { id: 'classic',  label: '🎲 DC' },
  { id: 'money',    label: '💰 MONEY' },
  { id: 'aura',      label: '🤖 AURA' },
  { id: 'swanai',    label: '🎯 SWANAI' },
  { id: 'avatar',    label: '🎭 AVATAR' },
  { id: 'music',     label: '🎵 STUDIO' },
  { id: 'discover',  label: '🔭 DISCOVER' },
  { id: 'rankings',  label: '🏅 RANKS' },
  { id: 'showcase',  label: '🏆 SHOWCASE' },
  { id: 'upload',    label: '📤 UPLOAD' },
  { id: 'overlay',   label: '🎬 OVERLAY' },
  { id: 'portal',    label: '🌐 PORTAL' },
  { id: 'collab',    label: '🤝 COLLAB' },
  { id: 'n8n',       label: '⚙ N8N' },
  { id: 'merch',     label: '👕 MERCH' },
  { id: 'replay',    label: '▶ REPLAY' },
  { id: 'mcp',       label: '🔌 MCP' },
  { id: 'guardian',  label: '🛡 GUARDIAN' },
  { id: 'directpay', label: '💸 DIRECT PAY' },
  { id: 'share',     label: '📡 SHARE' },
  { id: 'profile',   label: '👤 PROFILE' },
  { id: 'settings',  label: '⚙ SETTINGS' },
];

export default function App() {
  var [splash, setSplash] = useState(true);
  var [activeTab, setActiveTab] = useState('room');
  var [isLive, setIsLive] = useState(false);
  var [viewerCount, setViewerCount] = useState(0);
  var [guests, setGuests] = useState([]);
  var [chat, setChat] = useState([]);
  var [gifts, setGifts] = useState([]);
  var [botLogs, setBotLogs] = useState([]);
  var [toasts, setToasts] = useState([]);
  var [uptime, setUptime] = useState(0);
  var [connected, setConnected] = useState(false);
  var [apiHealth, setApiHealth] = useState('unknown');
  var [sessionId] = useState(function() { return 'sess-' + Date.now(); });
  var [userId] = useState(function() {
    var stored = localStorage.getItem('sw_userId');
    if (stored) return stored;
    var id = 'u-' + Date.now() + '-' + Math.floor(Math.random() * 9999);
    localStorage.setItem('sw_userId', id);
    return id;
  });
  var [username] = useState(function() { return localStorage.getItem('sw_username') || 'Guest' + Math.floor(Math.random() * 9000 + 1000); });
  var [role] = useState(function() { return localStorage.getItem('sw_role') || 'viewer'; });
  var [branding, setBranding] = useState(function() {
    try {
      var b = localStorage.getItem('sw_branding');
      if (b) return JSON.parse(b);
    } catch(e) {}
    return { gold: '#C9A84C', burg: '#800020', showScoreBar: true };
  });
  var [fadesScores, setFadesScores] = useState({ team1: 0, team2: 0 });
  var [giftFloats, setGiftFloats] = useState([]);
  var [ppvToken, setPpvToken] = useState(function() { return sessionStorage.getItem('sw_ppv_token') || null; });
  var [overlayConfig, setOverlayConfig] = useState({ banner: { text: '', position: 'bottom', color: '#C9A84C', visible: false }, countdown: { label: 'STARTING SOON', targetTs: 0, visible: false }, scoreBug: { label: 'DOMINO CLASSIC', team1: { name: 'EAST', score: 0 }, team2: { name: 'WEST', score: 0 }, visible: false }, lowerThirds: {} });
  var [streamInfo, setStreamInfo] = useState({ title: '', category: '', desc: '' });
  var [userTier, setUserTier] = useState(function() { return localStorage.getItem('sw_user_tier') || 'free'; });
  var [auraMessages, setAuraMessages] = useState([]);

  var socketRef = useRef(null);
  var uptimeRef = useRef(null);
  var liveStartRef = useRef(null);

  var addToast = useCallback(function(msg, type) {
    var id = Date.now() + Math.random();
    setToasts(function(prev) { return [...prev, { id, msg, type: type || 'info' }]; });
    setTimeout(function() { setToasts(function(prev) { return prev.filter(function(t) { return t.id !== id; }); }); }, 4000);
  }, []);

  useEffect(function() {
    var t = setTimeout(function() { setSplash(false); }, 2200);
    return function() { clearTimeout(t); };
  }, []);

  useEffect(function() {
    var token = localStorage.getItem('sw_token') || '';
    var socket = getSocket(token);
    socketRef.current = socket;

    socket.on('connect', function() {
      setConnected(true);
      socket.emit('join-room', { roomId: APP_ID, userId, username, role, token });
    });

    socket.on('disconnect', function() { setConnected(false); });

    socket.on('roster-update', function(data) {
      if (!data || !data.guests) return;
      setGuests(function(prev) {
        return data.guests.map(function(g) {
          var gid = g.guestId ? g.guestId : g.userId;
          var existing = null;
          for (var i = 0; i < prev.length; i++) {
            var pid = prev[i].guestId ? prev[i].guestId : prev[i].userId;
            if (pid === gid) { existing = prev[i]; break; }
          }
          if (!existing) return g;
          var merged = Object.assign({}, g);
          if (existing.producerId)      merged.producerId      = existing.producerId;
          if (existing.audioProducerId) merged.audioProducerId = existing.audioProducerId;
          return merged;
        });
      });
    });

    var viewerMilestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
    var passedMilestones = {};
    socket.on('viewer-count', function(data) {
      if (!data || typeof data.count !== 'number') return;
      var prev = viewerCount;
      setViewerCount(data.count);
      viewerMilestones.forEach(function(m) {
        if (data.count >= m && prev < m && !passedMilestones[m]) {
          passedMilestones[m] = true;
          addToast('🎉 ' + m.toLocaleString() + ' VIEWERS!', 'success');
          var floatId = Date.now() + Math.random();
          setGiftFloats(function(gf) { return gf.concat([{ floatId: floatId, emoji: '👁', name: m.toLocaleString() + ' viewers!', from_user: 'Milestone', value_cents: 0 }]); });
          setTimeout(function() { setGiftFloats(function(gf) { return gf.filter(function(g) { return g.floatId !== floatId; }); }); }, 5000);
        }
      });
    });

    socket.on('chat-message', function(msg) {
      if (!msg) return;
      setChat(function(prev) { return [...prev.slice(-200), msg]; });
    });

    socket.on('gift-received', function(gift) {
      if (!gift) return;
      setGifts(function(prev) { return [...prev, gift]; });
      var floatId = Date.now() + Math.random();
      setGiftFloats(function(prev) { return [...prev, { ...gift, floatId }]; });
      setTimeout(function() { setGiftFloats(function(prev) { return prev.filter(function(g) { return g.floatId !== floatId; }); }); }, 4000);
      addToast((gift.from_user || 'Someone') + ' sent ' + (gift.name || 'a gift') + '! ' + (gift.emoji || '🎁'), 'gift');
    });

    socket.on('new-subscription', function(data) {
      if (!data) return;
      var name = data.username || data.from_user || 'Someone';
      var tier = data.tier || 'bronze';
      var tierLabel = tier === 'gold' ? '👑 GOLD' : tier === 'silver' ? '🥈 SILVER' : '🥉 BRONZE';
      addToast('⭐ ' + name + ' subscribed at ' + tierLabel + '!', 'success');
      var floatId = Date.now() + Math.random();
      setGiftFloats(function(prev) { return prev.concat([{ floatId: floatId, emoji: '⭐', name: tierLabel + ' Sub', from_user: name, value_cents: data.price_cents || 0 }]); });
      setTimeout(function() { setGiftFloats(function(prev) { return prev.filter(function(g) { return g.floatId !== floatId; }); }); }, 5000);
    });

    socket.on('bot-log', function(log) {
      if (!log) return;
      setBotLogs(function(prev) { return [...prev.slice(-100), { ...log, id: Date.now() + Math.random() }]; });
    });

    socket.on('go-live-confirmed', function() {
      setIsLive(true);
      liveStartRef.current = Date.now();
      addToast('🔴 LIVE! Stream is broadcasting', 'success');
    });

    socket.on('broadcast-ended', function() {
      setIsLive(false);
      liveStartRef.current = null;
      addToast('Stream ended', 'info');
    });

    socket.on('fades-event', function(data) {
      if (data && data.scores) setFadesScores(data.scores);
    });

    socket.on('new-producer', function(data) {
      if (!data || !data.guestId || !data.producerId) return;
      setGuests(function(prev) {
        return prev.map(function(g) {
          var gid = g.guestId ? g.guestId : g.userId;
          if (gid !== data.guestId) return g;
          var update = Object.assign({}, g);
          if (data.kind === 'video') update.producerId      = data.producerId;
          if (data.kind === 'audio') update.audioProducerId = data.producerId;
          return update;
        });
      });
    });

    socket.on('join-room-ack', function(ackData) {
      if (!ackData || !Array.isArray(ackData.existingProducers)) return;
      setGuests(function(prev) {
        return prev.map(function(g) {
          var gid = g.guestId ? g.guestId : g.userId;
          var update = Object.assign({}, g);
          for (var i = 0; i < ackData.existingProducers.length; i++) {
            var p = ackData.existingProducers[i];
            if (p.guestId !== gid) continue;
            if (p.kind === 'video') update.producerId      = p.producerId;
            if (p.kind === 'audio') update.audioProducerId = p.producerId;
          }
          return update;
        });
      });
    });

    socket.on('producer-closed', function(data) {
      if (!data || !data.producerId) return;
      setGuests(function(prev) {
        return prev.map(function(g) {
          var update = Object.assign({}, g);
          if (g.producerId      === data.producerId) update.producerId      = null;
          if (g.audioProducerId === data.producerId) update.audioProducerId = null;
          return update;
        });
      });
    });

    socket.on('guest-muted', function(data) {
      if (!data || !data.guestId) return;
      setGuests(function(prev) {
        return prev.map(function(g) {
          var gid = g.guestId ? g.guestId : g.userId;
          if (gid !== data.guestId) return g;
          return Object.assign({}, g, { remoteMuted: true });
        });
      });
      addToast('Host muted a guest', 'info');
    });

    socket.on('muted', function() {
      addToast('⚠ Your chat has been restricted by SwanyBot', 'error');
    });

    socket.on('fanout-failed', function() {
      addToast('⚠ Stream fanout lost — attempting to reconnect', 'error');
    });

    socket.on('fanout-restarted', function(data) {
      var attempt = data && data.attempt ? ' (attempt ' + data.attempt + ')' : '';
      addToast('✓ Stream fanout reconnected' + attempt, 'success');
    });

    socket.on('guest-unmuted', function(data) {
      if (!data || !data.guestId) return;
      setGuests(function(prev) {
        return prev.map(function(g) {
          var gid = g.guestId ? g.guestId : g.userId;
          if (gid !== data.guestId) return g;
          return Object.assign({}, g, { remoteMuted: false });
        });
      });
    });

    socket.on('guest-kicked', function(data) {
      if (!data || !data.guestId) return;
      setGuests(function(prev) {
        return prev.filter(function(g) {
          var gid = g.guestId ? g.guestId : g.userId;
          return gid !== data.guestId;
        });
      });
      addToast('A guest was removed from the room', 'info');
    });

    socket.on('you-were-kicked', function() {
      addToast('⚠ You were removed from this room by the host', 'error');
    });

    socket.on('role-changed', function(data) {
      if (!data || !data.guestId) return;
      setGuests(function(prev) {
        return prev.map(function(g) {
          var gid = g.guestId ? g.guestId : g.userId;
          if (gid !== data.guestId) return g;
          return Object.assign({}, g, { role: data.role });
        });
      });
    });

    socket.on('overlay-update', function(data) {
      if (!data || !data.overlay) return;
      setOverlayConfig(data.overlay);
    });

    socket.on('stream-info', function(data) {
      if (!data) return;
      setStreamInfo({ title: data.title || '', category: data.category || '', desc: data.desc || '' });
    });

    socket.on('watch-party-started', function() {
      addToast('🎉 Watch Party started! Head to the WATCH tab.', 'success');
    });

    socket.on('aura-message', function(data) {
      if (!data || !data.text) return;
      var msg = { text: data.text, mode: data.mode || 'hype', ts: Date.now() };
      setAuraMessages(function(prev) { return [msg].concat(prev.slice(0, 19)); });
    });

    socket.on('user-muted', function(data) {
      if (!data) return;
      addToast('Guardian muted a user: ' + (data.reason || 'violation'), 'info');
    });

    return function() {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('roster-update');
      socket.off('viewer-count');
      socket.off('chat-message');
      socket.off('gift-received');
      socket.off('bot-log');
      socket.off('go-live-confirmed');
      socket.off('broadcast-ended');
      socket.off('fades-event');
      socket.off('new-producer');
      socket.off('join-room-ack');
      socket.off('producer-closed');
      socket.off('guest-muted');
      socket.off('muted');
      socket.off('fanout-failed');
      socket.off('fanout-restarted');
      socket.off('guest-unmuted');
      socket.off('guest-kicked');
      socket.off('you-were-kicked');
      socket.off('role-changed');
      socket.off('overlay-update');
      socket.off('stream-info');
      socket.off('watch-party-started');
      socket.off('aura-message');
      socket.off('user-muted');
    };
  }, [userId, username, role, addToast]);

  useEffect(function() {
    uptimeRef.current = setInterval(function() {
      if (isLive && liveStartRef.current) {
        setUptime(Math.floor((Date.now() - liveStartRef.current) / 1000));
      }
    }, 1000);
    return function() { clearInterval(uptimeRef.current); };
  }, [isLive]);

  useEffect(function() {
    localStorage.setItem('sw_branding', JSON.stringify(branding));
  }, [branding]);

  function formatUptime(s) {
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    return (h > 0 ? String(h).padStart(2,'0') + ':' : '') + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
  }

  useEffect(function() {
    function checkHealth() {
      fetch('/api/health').then(function(r) {
        setApiHealth(r.ok ? 'good' : 'degraded');
      }).catch(function() { setApiHealth('down'); });
    }
    checkHealth();
    var healthInterval = setInterval(checkHealth, 30000);
    return function() { clearInterval(healthInterval); };
  }, []);

  if (splash) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0F0C14', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, color: '#EDE8F5', letterSpacing: 4, lineHeight: 1 }}>SeeWhy LIVE</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: '#7A6F90', marginTop: 8 }}>v33.0</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <span style={{ background: 'rgba(201,168,76,.2)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 4, padding: '3px 10px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700 }}>MERGE BUILD</span>
            <span style={{ background: 'rgba(128,0,32,.2)', border: '1px solid rgba(128,0,32,.5)', borderRadius: 4, padding: '3px 10px', color: '#FF6B81', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700 }}>PRODUCTION</span>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: '#7A6F90', marginTop: 16 }}>Washington Classic × Domino Entertainment × VibeN'Bones</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F0C14', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif" }}>
      <BrandChyron isLive={isLive} streamTitle={streamInfo.title} />
      {/* Header HUD */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,12,20,.95)', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', padding: '6px 16px', gap: 12, height: 44 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#EDE8F5', letterSpacing: 2 }}>SeeWhy LIVE</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90' }}>v33.0</span>
          {isLive && <span style={{ background: 'rgba(255,26,60,.2)', border: '1px solid rgba(255,26,60,.5)', borderRadius: 4, padding: '2px 8px', color: '#FF1A3C', fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 700 }}>● LIVE</span>}
          {!connected && <span style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 4, padding: '2px 8px', color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 9 }}>OFFLINE</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 1 }}>
          {isLive && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#00C9A7' }}>{formatUptime(uptime)}</span>}
          {isLive && streamInfo.title ? <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: '#EDE8F5', letterSpacing: 0.5, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{streamInfo.title}</span> : null}
          {isLive && streamInfo.category ? <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 1 }}>{streamInfo.category.toUpperCase()}</span> : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90' }}>👁 {viewerCount}</span>
          <span style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: apiHealth === 'good' ? '#00C9A7' : apiHealth === 'degraded' ? '#C9A84C' : '#FF1A3C', marginRight: 6 }}>
            {apiHealth === 'good' ? '● API' : apiHealth === 'degraded' ? '◑ API' : '○ API'}
          </span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90' }}>{APP_ID.substring(0, 8)}</span>
        </div>
      </header>

      {/* Tab Bar */}
      <nav style={{ display: 'flex', overflowX: 'auto', background: 'rgba(7,5,10,.9)', borderBottom: '1px solid rgba(255,255,255,.05)', padding: '4px 8px', gap: 4 }}>
        {TABS.map(function(tab) { return (
          <button
            key={tab.id}
            style={{ background: activeTab === tab.id ? '#800020' : 'rgba(22,16,32,.8)', border: activeTab === tab.id ? '1px solid rgba(128,0,32,.6)' : '1px solid rgba(255,255,255,.06)', borderRadius: 6, padding: '5px 12px', color: activeTab === tab.id ? '#EDE8F5' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={function() { setActiveTab(tab.id); }}
          >
            {tab.label}
          </button>
        ); })}
      </nav>

      {/* Tab Content */}
      <main style={{ padding: '16px', flex: 1 }}>
        {activeTab === 'room' && (
          <RoomTab
            socket={socketRef.current}
            guests={guests}
            chat={chat}
            isLive={isLive}
            setIsLive={setIsLive}
            userId={userId}
            username={username}
            role={role}
            roomId={APP_ID}
            branding={branding}
            addToast={addToast}
            overlayConfig={overlayConfig}
            viewerCount={viewerCount}
          />
        )}
        {activeTab === 'fades' && (
          <FadesTab
            socket={socketRef.current}
            scores={fadesScores}
            guests={guests}
            roomId={APP_ID}
            isLive={isLive}
            role={role}
            userId={userId}
          />
        )}
        {activeTab === 'brand' && (
          <BrandingTab
            branding={branding}
            setBranding={setBranding}
            isLive={isLive}
            streamInfo={streamInfo}
          />
        )}
        {activeTab === 'embed' && (
          <EmbedTab
            roomId={APP_ID}
            ppvToken={ppvToken}
            setPpvToken={setPpvToken}
            isLive={isLive}
          />
        )}
        {activeTab === 'bot' && (
          <SwanyBotTab
            socket={socketRef.current}
            botLogs={botLogs}
            roomId={APP_ID}
            addToast={addToast}
            isLive={isLive}
          />
        )}
        {activeTab === 'data' && (
          <AnalyticsTab
            roomId={APP_ID}
            gifts={gifts}
            viewerCount={viewerCount}
            isLive={isLive}
          />
        )}
        {activeTab === 'keys' && (
          <StreamKeysTab
            socket={socketRef.current}
            userId={userId}
            guests={guests}
            role={role}
            addToast={addToast}
          />
        )}
        {activeTab === 'fanout' && (
          <RTMPFanoutTab
            isLive={isLive}
            addToast={addToast}
          />
        )}
        {activeTab === 'push' && (
          <PushStreamTab
            isLive={isLive}
            addToast={addToast}
          />
        )}
        {activeTab === 'clips' && (
          <ClipEngineTab
            isLive={isLive}
            addToast={addToast}
          />
        )}
        {activeTab === 'watch' && (
          <WatchPartyTab
            guests={guests}
            socket={socketRef.current}
            roomId={APP_ID}
            role={role}
            addToast={addToast}
            isLive={isLive}
          />
        )}
        {activeTab === 'green' && (
          <GreenRoomTab
            guests={guests}
            addToast={addToast}
            socket={socketRef.current}
            roomId={APP_ID}
            userId={userId}
            role={role}
            isLive={isLive}
            streamInfo={streamInfo}
          />
        )}
        {activeTab === 'forge' && (
          <InsForgeTab
            addToast={addToast}
            isLive={isLive}
          />
        )}
        {activeTab === 'deepdata' && (
          <AnalyticsDeepDiveTab
            viewerCount={viewerCount}
            gifts={gifts}
            isLive={isLive}
            addToast={addToast}
          />
        )}
        {activeTab === 'schedule' && (
          <ScheduleTab
            addToast={addToast}
            isLive={isLive}
            streamInfo={streamInfo}
          />
        )}
        {activeTab === 'classic' && (
          <WashingtonClassicTab
            addToast={addToast}
            isLive={isLive}
          />
        )}
        {activeTab === 'money' && (
          <MonetizeTab
            addToast={addToast}
            isLive={isLive}
            socket={socketRef.current}
            roomId={APP_ID}
            username={username}
          />
        )}
        {activeTab === 'aura' && (
          <AuraTab
            isLive={isLive}
            viewerCount={viewerCount}
            addToast={addToast}
            userTier={userTier}
            socket={socketRef.current}
            roomId={APP_ID}
          />
        )}
        {activeTab === 'swanai' && (
          <SwanAITab
            isLive={isLive}
            viewerCount={viewerCount}
            addToast={addToast}
          />
        )}
        {activeTab === 'avatar' && (
          <AvatarHubTab
            addToast={addToast}
            isLive={isLive}
          />
        )}
        {activeTab === 'music' && (
          <MusicStudioTab
            addToast={addToast}
            isLive={isLive}
          />
        )}
        {activeTab === 'discover' && (
          <DiscoverTab
            addToast={addToast}
            isLive={isLive}
            socket={socketRef.current}
            roomId={APP_ID}
            username={username}
          />
        )}
        {activeTab === 'rankings' && (
          <StateRankingsTab isLive={isLive} addToast={addToast} />
        )}
        {activeTab === 'showcase' && (
          <ShowcaseTab addToast={addToast} isLive={isLive} />
        )}
        {activeTab === 'upload' && (
          <UploadTab addToast={addToast} isLive={isLive} />
        )}
        {activeTab === 'overlay' && (
          <OverlayTab
            overlayConfig={overlayConfig}
            setOverlayConfig={setOverlayConfig}
            socket={socketRef.current}
            roomId={APP_ID}
            role={role}
            guests={guests}
            userId={userId}
            username={username}
            isLive={isLive}
          />
        )}
        {activeTab === 'portal' && (
          <PortalTab addToast={addToast} isLive={isLive} socket={socketRef.current} roomId={APP_ID} />
        )}
        {activeTab === 'collab' && (
          <CollabTab addToast={addToast} isLive={isLive} userId={userId} username={username} socket={socketRef.current} roomId={APP_ID} />
        )}
        {activeTab === 'n8n' && (
          <N8nTab addToast={addToast} isLive={isLive} />
        )}
        {activeTab === 'merch' && (
          <MerchTab addToast={addToast} isLive={isLive} socket={socketRef.current} roomId={APP_ID} username={username} />
        )}
        {activeTab === 'replay' && (
          <ReplayTab addToast={addToast} isLive={isLive} />
        )}
        {activeTab === 'mcp' && (
          <MCPTab addToast={addToast} isLive={isLive} />
        )}
        {activeTab === 'guardian' && (
          <GuardianTab
            addToast={addToast}
            isLive={isLive}
            chat={chat}
            socket={socketRef.current}
            roomId={APP_ID}
          />
        )}
        {activeTab === 'directpay' && (
          <DirectPayTab addToast={addToast} username={username} />
        )}
        {activeTab === 'share' && (
          <SocialShareTab addToast={addToast} isLive={isLive} roomId={APP_ID} username={username} />
        )}
        {activeTab === 'profile' && (
          <CreatorProfileTab
            addToast={addToast}
            creatorUsername={username}
            isLive={isLive}
            viewerCount={viewerCount}
            streamTitle={streamInfo.title}
            socket={socketRef.current}
            roomId={APP_ID}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            addToast={addToast}
            userId={userId}
            username={username}
            userTier={userTier}
            setUserTier={setUserTier}
          />
        )}
      </main>

      {/* Overlays */}
      <GiftLayer giftFloats={giftFloats} />
      <Toasts toasts={toasts} />
      <Ticker chat={chat} isLive={isLive} />
      {isLive && gifts.length > 0 && (
        <div style={{ position: 'fixed', bottom: 50, right: 12, zIndex: 200, width: 260 }}>
          <GoldenWallPanel items={gifts.slice(-10)} />
        </div>
      )}
    </div>
  );
}

// StreamKeysTab inline (7th tab)
function StreamKeysTab(props) {
  var socket = props.socket;
  var userId = props.userId;
  var guests = props.guests;
  var role = props.role;
  var addToast = props.addToast;

  var [platform, setPlatform] = useState('youtube');
  var [streamKey, setStreamKey] = useState('');
  var [saving, setSaving] = useState(false);
  var [savedKeys, setSavedKeys] = useState([]);

  var PLATFORMS = [
    { id: 'youtube', label: 'YouTube' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'twitch', label: 'Twitch' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'custom', label: 'Custom RTMP' }
  ];

  useEffect(function() {
    fetch('/api/keys/meta/' + userId)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && Array.isArray(data)) setSavedKeys(data);
      })
      .catch(function(e) { console.error('fetch keys meta error:', e); });
  }, [userId]);

  function handleSave() {
    if (!streamKey.trim()) { addToast('Enter a stream key', 'error'); return; }
    setSaving(true);
    fetch('/api/keys/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: userId, destId: platform, plainKey: streamKey })
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        setSaving(false);
        if (data && data.saved) {
          setStreamKey('');
          addToast('🔒 Encrypted & Vaulted', 'success');
          setSavedKeys(function(prev) {
            var filtered = prev.filter(function(k) { return k.destId !== platform; });
            return [...filtered, { destId: platform, createdAt: Date.now() }];
          });
        } else {
          addToast('Save failed', 'error');
        }
      })
      .catch(function(e) { setSaving(false); addToast('Save error: ' + e.message, 'error'); });
  }

  function handleDelete(destId) {
    fetch('/api/keys/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: userId, destId: destId })
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.deleted) {
          setSavedKeys(function(prev) { return prev.filter(function(k) { return k.destId !== destId; }); });
          addToast('Key deleted', 'info');
        }
      })
      .catch(function(e) { addToast('Delete error: ' + e.message, 'error'); });
  }

  var glassCard = { background: 'rgba(22,16,32,.8)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '16px' };
  var panelTitle = { fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#EDE8F5', letterSpacing: 2, margin: '0 0 4px 0' };
  var panelSub = { fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90', margin: '0 0 12px 0' };
  var formRow = { marginBottom: 10 };
  var inputStyle = { background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, width: '100%', boxSizing: 'border-box' };
  var btnGold = { background: 'rgba(201,168,76,.2)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, padding: '9px 18px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, cursor: 'pointer' };
  var btnDelete = { background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 6, padding: '4px 10px', color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' };
  var keyRow = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.04)' };
  var keyPlatform = { fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#EDE8F5', flex: 1 };
  var keyStatus = { fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#00C9A7' };
  var keyDate = { fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90' };
  var mutedText = { fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90' };

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={Object.assign({}, glassCard, { marginBottom: '1rem' })}>
        <h2 style={panelTitle}>🔑 STREAM KEYS VAULT</h2>
        <p style={panelSub}>Keys are encrypted with AES-256-GCM. They cannot be retrieved after saving.</p>
        <div style={formRow}>
          <select style={inputStyle} value={platform} onChange={function(e) { setPlatform(e.target.value); }}>
            {PLATFORMS.map(function(p) { return <option key={p.id} value={p.id}>{p.label}</option>; })}
          </select>
        </div>
        <div style={formRow}>
          <input
            style={inputStyle}
            type="password"
            placeholder="Paste your stream key..."
            value={streamKey}
            onChange={function(e) { setStreamKey(e.target.value); }}
            autoComplete="off"
          />
        </div>
        <button style={btnGold} onClick={handleSave} disabled={saving}>
          {saving ? 'Encrypting...' : '🔒 SAVE TO VAULT'}
        </button>
      </div>

      <div style={glassCard}>
        <h3 style={panelTitle}>Saved Keys</h3>
        {savedKeys.length === 0 && <p style={mutedText}>No keys saved yet.</p>}
        {savedKeys.map(function(k) {
          return (
            <div key={k.destId} style={keyRow}>
              <span style={keyPlatform}>{k.destId.toUpperCase()}</span>
              <span style={keyStatus}>🔒 Encrypted</span>
              <span style={keyDate}>{new Date(k.createdAt).toLocaleDateString()}</span>
              <button style={btnDelete} onClick={function() { handleDelete(k.destId); }}>Delete</button>
            </div>
          );
        })}
      </div>

      {role === 'host' && (
        <div style={Object.assign({}, glassCard, { marginTop: '1rem' })}>
          <h3 style={panelTitle}>Guest Key Status (Host View)</h3>
          {guests.map(function(g) {
            return (
              <div key={g.guestId || g.userId} style={keyRow}>
                <span style={keyPlatform}>{g.username || g.guestId}</span>
                <span style={mutedText}>Key status visible to host only</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
