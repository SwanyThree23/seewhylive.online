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
import GiftLayer from './components/GiftLayer.jsx';
import Toasts from './components/Toasts.jsx';
import Ticker from './components/Ticker.jsx';

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
  { id: 'guardian', label: '🛡 GUARDIAN' },
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

    socket.on('viewer-count', function(data) {
      if (data && typeof data.count === 'number') setViewerCount(data.count);
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
      <div className="splash-screen">
        <div className="splash-inner">
          <div className="splash-title">SeeWhy LIVE</div>
          <div className="splash-version">v33.0</div>
          <div className="splash-tags">
            <span className="tag-merge">MERGE BUILD</span>
            <span className="tag-prod">PRODUCTION</span>
          </div>
          <div className="splash-brands">Washington Classic × Domino Entertainment × VibeN'Bones</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* Header HUD */}
      <header className="hud-header">
        <div className="hud-left">
          <span className="hud-logo">SeeWhy LIVE</span>
          <span className="hud-version">v33.0</span>
          {isLive && <span className="hud-live-badge">● LIVE</span>}
          {!connected && <span className="hud-offline-badge">OFFLINE</span>}
        </div>
        <div className="hud-center">
          {isLive && <span className="hud-uptime">{formatUptime(uptime)}</span>}
        </div>
        <div className="hud-right">
          <span className="hud-viewers">👁 {viewerCount}</span>
          <span style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: apiHealth === 'good' ? '#00C9A7' : apiHealth === 'degraded' ? '#C9A84C' : '#FF1A3C', marginRight: 6 }}>
            {apiHealth === 'good' ? '● API' : apiHealth === 'degraded' ? '◑ API' : '○ API'}
          </span>
          <span className="hud-room">{APP_ID.substring(0, 8)}</span>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="tab-bar">
        {TABS.map(function(tab) { return (
          <button
            key={tab.id}
            className={'tab-btn' + (activeTab === tab.id ? ' tab-btn--active' : '')}
            onClick={function() { setActiveTab(tab.id); }}
          >
            {tab.label}
          </button>
        ); })}
      </nav>

      {/* Tab Content */}
      <main className="tab-content">
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
          />
        )}
        {activeTab === 'schedule' && (
          <ScheduleTab
            addToast={addToast}
          />
        )}
        {activeTab === 'classic' && (
          <WashingtonClassicTab
            addToast={addToast}
          />
        )}
        {activeTab === 'money' && (
          <MonetizeTab
            addToast={addToast}
            isLive={isLive}
          />
        )}
        {activeTab === 'aura' && (
          <AuraTab
            isLive={isLive}
            viewerCount={viewerCount}
          />
        )}
        {activeTab === 'swanai' && (
          <SwanAITab
            isLive={isLive}
            viewerCount={viewerCount}
          />
        )}
        {activeTab === 'avatar' && (
          <AvatarHubTab
            addToast={addToast}
          />
        )}
        {activeTab === 'music' && (
          <MusicStudioTab
            addToast={addToast}
          />
        )}
        {activeTab === 'discover' && (
          <CreatorDiscoveryTab
            addToast={addToast}
          />
        )}
        {activeTab === 'rankings' && (
          <StateRankingsTab isLive={isLive} addToast={addToast} />
        )}
        {activeTab === 'showcase' && (
          <ShowcaseTab addToast={addToast} />
        )}
        {activeTab === 'upload' && (
          <UploadTab addToast={addToast} />
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
          />
        )}
        {activeTab === 'portal' && (
          <PortalTab addToast={addToast} isLive={isLive} />
        )}
        {activeTab === 'collab' && (
          <CollabTab addToast={addToast} isLive={isLive} userId={userId} username={username} />
        )}
        {activeTab === 'n8n' && (
          <N8nTab addToast={addToast} isLive={isLive} />
        )}
        {activeTab === 'merch' && (
          <MerchTab addToast={addToast} isLive={isLive} />
        )}
        {activeTab === 'replay' && (
          <ReplayTab addToast={addToast} isLive={isLive} />
        )}
        {activeTab === 'mcp' && (
          <MCPTab addToast={addToast} />
        )}
        {activeTab === 'guardian' && (
          <GuardianTab addToast={addToast} isLive={isLive} />
        )}
      </main>

      {/* Overlays */}
      <GiftLayer giftFloats={giftFloats} />
      <Toasts toasts={toasts} />
      <Ticker chat={chat} isLive={isLive} />
    </div>
  );
}

// StreamKeysTab inline (7th tab)
function StreamKeysTab({ socket, userId, guests, role, addToast }) {
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

  useEffect(() => {
    fetch('/api/keys/meta/' + userId)
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data)) setSavedKeys(data);
      })
      .catch((e) => console.error('fetch keys meta error:', e));
  }, [userId]);

  function handleSave() {
    if (!streamKey.trim()) { addToast('Enter a stream key', 'error'); return; }
    setSaving(true);
    fetch('/api/keys/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: userId, destId: platform, plainKey: streamKey })
    })
      .then((r) => r.json())
      .then((data) => {
        setSaving(false);
        if (data && data.saved) {
          setStreamKey('');
          addToast('🔒 Encrypted & Vaulted', 'success');
          setSavedKeys((prev) => {
            var filtered = prev.filter((k) => k.destId !== platform);
            return [...filtered, { destId: platform, createdAt: Date.now() }];
          });
        } else {
          addToast('Save failed', 'error');
        }
      })
      .catch((e) => { setSaving(false); addToast('Save error: ' + e.message, 'error'); });
  }

  function handleDelete(destId) {
    fetch('/api/keys/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: userId, destId })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.deleted) {
          setSavedKeys((prev) => prev.filter((k) => k.destId !== destId));
          addToast('Key deleted', 'info');
        }
      })
      .catch((e) => addToast('Delete error: ' + e.message, 'error'));
  }

  return (
    <div className="tab-panel">
      <div className="glass-card" style={{marginBottom: '1rem'}}>
        <h2 className="panel-title">🔑 STREAM KEYS VAULT</h2>
        <p className="panel-sub">Keys are encrypted with AES-256-GCM. They cannot be retrieved after saving.</p>
        <div className="form-row">
          <select className="select-input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div className="form-row">
          <input
            className="text-input"
            type="password"
            placeholder="Paste your stream key..."
            value={streamKey}
            onChange={(e) => setStreamKey(e.target.value)}
            autoComplete="off"
          />
        </div>
        <button className="btn-gold" onClick={handleSave} disabled={saving}>
          {saving ? 'Encrypting...' : '🔒 SAVE TO VAULT'}
        </button>
      </div>

      <div className="glass-card">
        <h3 className="panel-title">Saved Keys</h3>
        {savedKeys.length === 0 && <p className="muted-text">No keys saved yet.</p>}
        {savedKeys.map((k) => (
          <div key={k.destId} className="key-row">
            <span className="key-platform">{k.destId.toUpperCase()}</span>
            <span className="key-status">🔒 Encrypted</span>
            <span className="key-date">{new Date(k.createdAt).toLocaleDateString()}</span>
            <button className="btn-delete" onClick={() => handleDelete(k.destId)}>Delete</button>
          </div>
        ))}
      </div>

      {role === 'host' && (
        <div className="glass-card" style={{marginTop: '1rem'}}>
          <h3 className="panel-title">Guest Key Status (Host View)</h3>
          {guests.map((g) => (
            <div key={g.guestId || g.userId} className="key-row">
              <span className="key-platform">{g.username || g.guestId}</span>
              <span className="key-status muted-text">Key status visible to host only</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
