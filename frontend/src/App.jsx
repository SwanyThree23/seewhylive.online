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
import UploadTab from './components/UploadTab.jsx';
import GiftLayer from './components/GiftLayer.jsx';
import Toasts from './components/Toasts.jsx';
import Ticker from './components/Ticker.jsx';

const APP_ID = '6990f5f24823b53e21fcdc9d';
const TABS = [
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
  { id: 'upload',    label: '📤 UPLOAD' },
];

export default function App() {
  const [splash, setSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('room');
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [guests, setGuests] = useState([]);
  const [chat, setChat] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [botLogs, setBotLogs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [uptime, setUptime] = useState(0);
  const [connected, setConnected] = useState(false);
  const [sessionId] = useState(() => 'sess-' + Date.now());
  const [userId] = useState(() => {
    const stored = localStorage.getItem('sw_userId');
    if (stored) return stored;
    const id = 'u-' + Date.now() + '-' + Math.floor(Math.random() * 9999);
    localStorage.setItem('sw_userId', id);
    return id;
  });
  const [username] = useState(() => localStorage.getItem('sw_username') || 'Guest' + Math.floor(Math.random() * 9000 + 1000));
  const [role] = useState(() => localStorage.getItem('sw_role') || 'viewer');
  const [branding, setBranding] = useState(() => {
    try {
      const b = localStorage.getItem('sw_branding');
      if (b) return JSON.parse(b);
    } catch(e) {}
    return { gold: '#C9A84C', burg: '#800020', showScoreBar: true };
  });
  const [fadesScores, setFadesScores] = useState({ team1: 0, team2: 0 });
  const [giftFloats, setGiftFloats] = useState([]);
  const [ppvToken, setPpvToken] = useState(() => sessionStorage.getItem('sw_ppv_token') || null);

  const socketRef = useRef(null);
  const uptimeRef = useRef(null);
  const liveStartRef = useRef(null);

  const addToast = useCallback((msg, type) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type: type || 'info' }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('sw_token') || '';
    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', { roomId: APP_ID, userId, username, role, token });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('roster-update', (data) => {
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

    socket.on('viewer-count', (data) => {
      if (data && typeof data.count === 'number') setViewerCount(data.count);
    });

    socket.on('chat-message', (msg) => {
      if (!msg) return;
      setChat((prev) => [...prev.slice(-200), msg]);
    });

    socket.on('gift-received', (gift) => {
      if (!gift) return;
      setGifts((prev) => [...prev, gift]);
      const floatId = Date.now() + Math.random();
      setGiftFloats((prev) => [...prev, { ...gift, floatId }]);
      setTimeout(() => setGiftFloats((prev) => prev.filter((g) => g.floatId !== floatId)), 4000);
      addToast((gift.from_user || 'Someone') + ' sent ' + (gift.name || 'a gift') + '! ' + (gift.emoji || '🎁'), 'gift');
    });

    socket.on('bot-log', (log) => {
      if (!log) return;
      setBotLogs((prev) => [...prev.slice(-100), { ...log, id: Date.now() + Math.random() }]);
    });

    socket.on('go-live-confirmed', () => {
      setIsLive(true);
      liveStartRef.current = Date.now();
      addToast('🔴 LIVE! Stream is broadcasting', 'success');
    });

    socket.on('broadcast-ended', () => {
      setIsLive(false);
      liveStartRef.current = null;
      addToast('Stream ended', 'info');
    });

    socket.on('fades-event', (data) => {
      if (data && data.scores) setFadesScores(data.scores);
    });

    socket.on('new-producer', (data) => {
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

    socket.on('producer-closed', (data) => {
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

    socket.on('guest-muted', (data) => {
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

    socket.on('muted', () => {
      addToast('⚠ Your chat has been restricted by SwanyBot', 'error');
    });

    socket.on('fanout-failed', () => {
      addToast('⚠ Stream fanout lost — attempting to reconnect', 'error');
    });

    socket.on('fanout-restarted', (data) => {
      var attempt = data && data.attempt ? ' (attempt ' + data.attempt + ')' : '';
      addToast('✓ Stream fanout reconnected' + attempt, 'success');
    });

    return () => {
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
    };
  }, [userId, username, role, addToast]);

  useEffect(() => {
    uptimeRef.current = setInterval(() => {
      if (isLive && liveStartRef.current) {
        setUptime(Math.floor((Date.now() - liveStartRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(uptimeRef.current);
  }, [isLive]);

  useEffect(() => {
    localStorage.setItem('sw_branding', JSON.stringify(branding));
  }, [branding]);

  function formatUptime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return (h > 0 ? String(h).padStart(2,'0') + ':' : '') + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
  }

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
          <span className="hud-room">{APP_ID.substring(0, 8)}</span>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={'tab-btn' + (activeTab === tab.id ? ' tab-btn--active' : '')}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
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
          />
        )}
        {activeTab === 'fades' && (
          <FadesTab
            socket={socketRef.current}
            scores={fadesScores}
            guests={guests}
            roomId={APP_ID}
            isLive={isLive}
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
          />
        )}
        {activeTab === 'green' && (
          <GreenRoomTab
            guests={guests}
            addToast={addToast}
          />
        )}
        {activeTab === 'forge' && (
          <InsForgeTab
            addToast={addToast}
          />
        )}
        {activeTab === 'deepdata' && (
          <AnalyticsDeepDiveTab
            viewerCount={viewerCount}
            gifts={gifts}
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
          <StateRankingsTab />
        )}
        {activeTab === 'upload' && (
          <UploadTab addToast={addToast} />
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
  const [platform, setPlatform] = useState('youtube');
  const [streamKey, setStreamKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedKeys, setSavedKeys] = useState([]);

  const PLATFORMS = [
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
            const filtered = prev.filter((k) => k.destId !== platform);
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
