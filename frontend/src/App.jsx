import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { getSocket, setRejoinPayload, onReconnectCallback } from './socket.js';
import { creatorCents, platformCents, getPlatformHandles } from './platformConfig.js';
import rtcManager from './webrtc.js';

/* Always-loaded: default tab + persistent overlays */
import LiveRoomPage from './components/LiveRoomPage.jsx';
import Toasts from './components/Toasts.jsx';
import Ticker from './components/Ticker.jsx';
import BrandChyron from './components/BrandChyron.jsx';
import MobileNavBar from './components/MobileNavBar.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Login from './components/Login.jsx';
import WelcomeAudio from './components/WelcomeAudio.jsx';
import AgeGate from './components/AgeGate.jsx';
import LoveTap from './components/LoveTap.jsx';
import GiftLeaderboardOverlay from './components/GiftLeaderboardOverlay.jsx';
import StreamGoalBar from './components/StreamGoalBar.jsx';
import DonationAlert from './components/DonationAlert.jsx';

/* Lazy-loaded tabs — each splits into its own chunk */
var FadesTab            = React.lazy(function() { return import('./components/FadesTab.jsx'); });
var BrandingTab         = React.lazy(function() { return import('./components/BrandingTab.jsx'); });
var EmbedTab            = React.lazy(function() { return import('./components/EmbedTab.jsx'); });
var SwanyBotTab         = React.lazy(function() { return import('./components/SwanyBotTab.jsx'); });
var AnalyticsTab        = React.lazy(function() { return import('./components/AnalyticsTab.jsx'); });
var RTMPFanoutTab       = React.lazy(function() { return import('./components/RTMPFanoutTab.jsx'); });
var PushStreamTab       = React.lazy(function() { return import('./components/PushStreamTab.jsx'); });
var ClipEngineTab       = React.lazy(function() { return import('./components/ClipEngineTab.jsx'); });
var WatchPartyTab       = React.lazy(function() { return import('./components/WatchPartyTab.jsx'); });
var GreenRoomTab        = React.lazy(function() { return import('./components/GreenRoomTab.jsx'); });
var InsForgeTab         = React.lazy(function() { return import('./components/InsForgeTab.jsx'); });
var AnalyticsDeepDiveTab= React.lazy(function() { return import('./components/AnalyticsDeepDiveTab.jsx'); });
var ScheduleTab         = React.lazy(function() { return import('./components/ScheduleTab.jsx'); });
var WashingtonClassicTab= React.lazy(function() { return import('./components/WashingtonClassicTab.jsx'); });
var MonetizeTab         = React.lazy(function() { return import('./components/MonetizeTab.jsx'); });
var AuraTab             = React.lazy(function() { return import('./components/AuraTab.jsx'); });
var SwanAITab           = React.lazy(function() { return import('./components/SwanAITab.jsx'); });
var AvatarHubTab        = React.lazy(function() { return import('./components/AvatarHubTab.jsx'); });
var MusicStudioTab      = React.lazy(function() { return import('./components/MusicStudioTab.jsx'); });
var CreatorDiscoveryTab = React.lazy(function() { return import('./components/CreatorDiscoveryTab.jsx'); });
var LeaderboardPage     = React.lazy(function() { return import('./pages/Leaderboard.jsx'); });
var PKBattleArenaPage   = React.lazy(function() { return import('./pages/PKBattleArena.jsx'); });
var StateRankingsTab    = React.lazy(function() { return import('./components/StateRankingsTab.jsx'); });
var ShowcaseTab         = React.lazy(function() { return import('./components/ShowcaseTab.jsx'); });
var UploadTab           = React.lazy(function() { return import('./components/UploadTab.jsx'); });
var OverlayTab          = React.lazy(function() { return import('./components/OverlayTab.jsx'); });
var PortalTab           = React.lazy(function() { return import('./components/PortalTab.jsx'); });
var CollabTab           = React.lazy(function() { return import('./components/CollabTab.jsx'); });
var N8nTab              = React.lazy(function() { return import('./components/N8nTab.jsx'); });
var MerchTab            = React.lazy(function() { return import('./components/MerchTab.jsx'); });
var ReplayTab           = React.lazy(function() { return import('./components/ReplayTab.jsx'); });
var MCPTab              = React.lazy(function() { return import('./components/MCPTab.jsx'); });
var GuardianTab         = React.lazy(function() { return import('./components/GuardianTab.jsx'); });
var DirectPayTab        = React.lazy(function() { return import('./components/DirectPayTab.jsx'); });
var SocialShareTab      = React.lazy(function() { return import('./components/SocialShareTab.jsx'); });
var DiscoverTab         = React.lazy(function() { return import('./components/DiscoverTab.jsx'); });
var CreatorProfileTab   = React.lazy(function() { return import('./components/CreatorProfileTab.jsx'); });
var SettingsTab         = React.lazy(function() { return import('./components/SettingsTab.jsx'); });
var PKBattleTab         = React.lazy(function() { return import('./components/PKBattleTab.jsx'); });
var VODLibraryTab       = React.lazy(function() { return import('./components/VODLibraryTab.jsx'); });
var CreatorTipsTab      = React.lazy(function() { return import('./components/CreatorTipsTab.jsx'); });
var LiveStreamHubTab    = React.lazy(function() { return import('./components/LiveStreamHubTab.jsx'); });
var AudioStageTab       = React.lazy(function() { return import('./components/AudioStageTab.jsx'); });
var SoundBoardTab       = React.lazy(function() { return import('./components/SoundBoardTab.jsx'); });
var TriviaTab           = React.lazy(function() { return import('./components/TriviaTab.jsx'); });
var PanelGrid           = React.lazy(function() { return import('./components/panel/PanelGrid.jsx'); });
var LiveSyncTab         = React.lazy(function() { return import('./components/LiveSyncTab.jsx'); });
var PlatformHealthTab   = React.lazy(function() { return import('./components/PlatformHealthTab.jsx'); });
var CreatorDashboard    = React.lazy(function() { return import('./components/CreatorDashboard.jsx'); });
var DesktopStudioTab   = React.lazy(function() { return import('./components/DesktopStudioTab.jsx'); });

var APP_ID = '6990f5f24823b53e21fcdc9d';
var TABS = [
  { id: 'room',      label: '🎙 ROOM' },
  { id: 'fades',     label: '⚡ FADES' },
  { id: 'brand',     label: '🎨 BRAND' },
  { id: 'embed',     label: '🎬 EMBED' },
  { id: 'bot',       label: '🤖 SWANYBOT' },
  { id: 'data',      label: '📊 DATA' },
  { id: 'analytics', label: '📊 STATS', roles: ['host', 'cohost'] },
  { id: 'keys',      label: '🔑 KEYS' },
  { id: 'fanout',   label: '📡 FANOUT' },
  { id: 'push',     label: '📺 PUSH' },
  { id: 'clips',    label: '🎞 CLIPS' },
  { id: 'watch',    label: '📺 WATCH' },
  { id: 'stage',    label: '🎙 STAGE' },
  { id: 'sfx',      label: '🎚 SFX' },
  { id: 'trivia',   label: '🎯 TRIVIA' },
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
  { id: 'creators',  label: '🔭 CREATORS' },
  { id: 'leaderboard', label: '🏅 LEADERBOARD' },
  { id: 'pkbattle-arena', label: '⚔️ PK ARENA' },
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
  { id: 'battles',   label: '⚡ BATTLES' },
  { id: 'vod',       label: '🎬 VOD' },
  { id: 'profile',   label: '👤 PROFILE' },
  { id: 'settings',  label: '⚙ SETTINGS' },
  { id: 'tips',      label: '💡 TIPS' },
  { id: 'streams',   label: '📡 STREAMS' },
  { id: "panel", label: "Panel Studio" },
  { id: "watchparty", label: "Watch Party" },
  { id: "vsbattle", label: "VS Battle" },
  { id: "livesync", label: "Live Sync" },
  { id: "health", label: "Platform Health" },
  { id: 'desktop-studio', label: '🖥 DESKTOP STUDIO' },
];

function CountdownClock({ targetTs }) {
  var [secs, setSecs] = React.useState(Math.max(0, Math.floor(targetTs - Date.now() / 1000)));
  React.useEffect(function() {
    var id = setInterval(function() {
      setSecs(Math.max(0, Math.floor(targetTs - Date.now() / 1000)));
    }, 1000);
    return function() { clearInterval(id); };
  }, [targetTs]);
  var h = Math.floor(secs / 3600);
  var m = Math.floor((secs % 3600) / 60);
  var s = secs % 60;
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  return (
    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: '#F0E8D4', letterSpacing: 4, marginTop: 4 }}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </div>
  );
}


/* ===== SOCKET.IO CLIENT SYNC ===== */
var SOCKET_URL = "https://seewhylive.online";

function useSocket(room) {
  var sockState = useState(null);
  var sock = sockState[0];
  var setSock = sockState[1];
  var viewersState = useState(0);
  var viewers = viewersState[0];
  var setViewers = viewersState[1];
  var eventsState = useState([]);
  var events = eventsState[0];
  var setEvents = eventsState[1];

  useEffect(function() {
    if (typeof window === "undefined" || !window.io) return undefined;
    var s = window.io(SOCKET_URL, { transports: ["websocket"], auth: { token: localStorage.getItem("sw_token") || "" } });
    setSock(s);
    s.emit("join-room", { room: room || "main" });
    s.on("viewer-count", function(d) { setViewers(d.count); });
    s.on("reaction", function(d) { setEvents(function(prev) { return [Object.assign({type:"reaction"},d)].concat(prev).slice(0,20); }); });
    s.on("vote", function(d) { setEvents(function(prev) { return [Object.assign({type:"vote"},d)].concat(prev).slice(0,20); }); });
    s.on("gem-send", function(d) { setEvents(function(prev) { return [Object.assign({type:"gem"},d)].concat(prev).slice(0,20); }); });
    s.on("chat-msg", function(d) { setEvents(function(prev) { return [Object.assign({type:"chat"},d)].concat(prev).slice(0,20); }); });
    s.on("poll-vote", function(d) { setEvents(function(prev) { return [Object.assign({type:"poll"},d)].concat(prev).slice(0,20); }); });
    s.on("battle-vote", function(d) { setEvents(function(prev) { return [Object.assign({type:"battle"},d)].concat(prev).slice(0,20); }); });
    return function() { s.disconnect(); };
  }, [room]);

  function emit(event, data) {
    if (sock) sock.emit(event, Object.assign({ room: room || "main" }, data));
  }

  return { sock: sock, viewers: viewers, events: events, emit: emit };
}

function LiveSyncDashboard() {
  var sync = useSocket("main");
  var reacts = { fire: 0, clap: 0, gem: 0 };
  sync.events.forEach(function(e) {
    if (e.type === "reaction" && e.emoji === "fire") reacts.fire++;
    if (e.type === "reaction" && e.emoji === "clap") reacts.clap++;
    if (e.type === "gem") reacts.gem++;
  });

  function sendReact(emoji) {
    sync.emit("reaction", { emoji: emoji, user: "You", ts: Date.now() });
  }
  function sendGem(amount) {
    sync.emit("gem-send", { amount: amount, user: "You", ts: Date.now() });
  }

  return React.createElement("div", { style: { color: "#EDE7D9" } },
    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } },
      React.createElement("h2", { style: { margin: 0, color: "#D4AF37", fontSize: 22 } }, "Live Sync"),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
        React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: sync.sock ? "#7AD45A" : "#A03A3A", boxShadow: sync.sock ? "0 0 6px #7AD45A" : "none" } }),
        React.createElement("span", { style: { fontSize: 12, color: "#8A8678" } }, sync.sock ? "Connected" : "Connecting..."),
        React.createElement("span", { style: { background: "#800020", color: "#EDE7D9", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 3 } }, sync.viewers + " watching"))),

    React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" } },
      [["fire", "\uD83D\uDD25"], ["clap", "\uD83D\uDC4F"], ["hype", "\uD83C\uDF89"]].map(function(r) {
        return React.createElement("button", {
          key: r[0],
          onClick: function() { sendReact(r[0]); },
          style: { background: "#1A1A1F", color: "#EDE7D9", border: "1px solid #2A2A30", borderRadius: 4, padding: "8px 16px", fontSize: 16, cursor: "pointer" }
        }, r[1]);
      }),
      React.createElement("button", {
        onClick: function() { sendGem(10); },
        style: { background: "#D4AF37", color: "#0B0B0D", border: "none", borderRadius: 4, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }
      }, "\uD83D\uDC8E Send 10 Gems")),

    React.createElement("div", { style: { background: "#1A1A1F", border: "1px solid #2A2A30", borderRadius: 6, overflow: "hidden" } },
      React.createElement("div", { style: { padding: "7px 12px", background: "#151518", fontSize: 11, color: "#8A8678", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" } }, "Live Event Feed"),
      sync.events.length === 0
        ? React.createElement("div", { style: { padding: 20, textAlign: "center", color: "#8A8678", fontSize: 12 } }, "Waiting for live events...")
        : sync.events.map(function(e, i) {
          var icon = { reaction: e.emoji === "fire" ? "\uD83D\uDD25" : e.emoji === "clap" ? "\uD83D\uDC4F" : "\uD83C\uDF89", gem: "\uD83D\uDC8E", vote: "\uD83D\uDDF3", chat: "\uD83D\uDCAC", poll: "\uD83D\uDCCA", battle: "\u2694\uFE0F" }[e.type] || "•";
          var label = { reaction: e.user + " reacted " + icon, gem: e.user + " sent " + (e.amount || 1) + " gems " + icon, vote: e.user + " voted " + icon, chat: e.user + ": " + (e.text || "") + " " + icon, poll: e.user + " voted in poll " + icon, battle: e.user + " voted in battle " + icon }[e.type] || e.type;
          return React.createElement("div", { key: i, style: { padding: "8px 12px", borderBottom: "1px solid #151518", fontSize: 12, display: "flex", justifyContent: "space-between" } },
            React.createElement("span", null, label),
            React.createElement("span", { style: { fontSize: 11, color: "#8A8678" } }, new Date(e.ts).toLocaleTimeString()));
        })));
}
/* ===== END SOCKET.IO CLIENT ===== */


/* ===== PLATFORM HEALTH MONITOR ===== */
function PlatformHealthMonitor() {
  var checks = [
    {id:"server", label:"VPS Server", url:"/api/n8n/ping", key:"pong"},
    {id:"hls", label:"HLS Stream", url:"https://seewhylive.online/hls/live/index.m3u8", key:null},
    {id:"n8n", label:"n8n Automation", url:"https://n8n.srv1587098.hstgr.cloud/healthz", key:null},
  ];

  var statusState = useState({});
  var statuses = statusState[0];
  var setStatuses = statusState[1];
  var lastCheckState = useState(null);
  var lastCheck = lastCheckState[0];
  var setLastCheck = lastCheckState[1];
  var loadingState = useState(false);
  var loading = loadingState[0];
  var setLoading = loadingState[1];
  var socketState = useState(null);
  var socketInfo = socketState[0];
  var setSocketInfo = socketState[1];

  async function runChecks() {
    setLoading(true);
    var next = {};
    for (var i = 0; i < checks.length; i++) {
      var check = checks[i];
      try {
        var r = await fetch(check.url, { signal: AbortSignal.timeout(5000) });
        if (check.key) {
          var d = await r.json();
          next[check.id] = d[check.key] ? "ok" : "error";
        } else {
          next[check.id] = r.ok || r.status === 200 || r.status === 404 ? "ok" : "error";
        }
      } catch(e) {
        next[check.id] = "error";
      }
    }
    // Get socket client count
    try {
      var hr = await fetch("/api/n8n/health");
      var hd = await hr.json();
      setSocketInfo(hd);
    } catch(e) {}
    setStatuses(next);
    setLastCheck(new Date().toLocaleTimeString());
    setLoading(false);
  }

  useEffect(function() { runChecks(); }, []);

  var metrics = [
    {label:"Stream ID", value:"6991033b"},
    {label:"RTMP Ingest", value:"rtmp://seewhylive.online/live"},
    {label:"HLS Playback", value:"seewhylive.online/hls/live"},
    {label:"VDO Room", value:"SeeWhy_6991033b"},
    {label:"n8n Webhooks", value:"seewhylive.online/api/n8n"},
    {label:"Supabase", value:"rxlgywvfclyjdfyvfvyc"},
  ];

  var endpoints = [
    {method:"GET", path:"/api/n8n/ping", desc:"Server heartbeat"},
    {method:"POST", path:"/api/n8n/stream-live", desc:"Stream start alert"},
    {method:"POST", path:"/api/n8n/gem-transaction", desc:"Gem send + 90/10 split"},
    {method:"POST", path:"/api/n8n/guardian-flag", desc:"Auto-moderation action"},
    {method:"POST", path:"/api/n8n/battle-result", desc:"Battle outcome broadcast"},
    {method:"POST", path:"/api/n8n/viewer-milestone", desc:"Viewer count celebration"},
  ];

  var pillColor = {ok:"#3C5C2A", error:"#5C2A2A", unknown:"#2A2A30"};
  var pillText = {ok:"#7AD45A", error:"#C06060", unknown:"#8A8678"};

  return React.createElement("div",{style:{color:"#EDE7D9"}},
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}},
      React.createElement("h2",{style:{margin:0,color:"#D4AF37",fontSize:22}},"Platform Health"),
      React.createElement("div",{style:{display:"flex",gap:8,alignItems:"center"}},
        lastCheck?React.createElement("span",{style:{fontSize: 11,color:"#8A8678"}},"Last check: "+lastCheck):null,
        React.createElement("button",{onClick:runChecks,disabled:loading,style:{background:"#D4AF37",color:"#0B0B0D",border:"none",borderRadius:4,padding:"7px 14px",fontWeight:700,fontSize:12,cursor:"pointer"}},loading?"Checking...":"Run Checks"))),

    React.createElement("div",{style:{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}},
      checks.map(function(c){
        var s = statuses[c.id] || "unknown";
        return React.createElement("div",{key:c.id,style:{flex:"1 1 140px",background:pillColor[s],border:"1px solid #2A2A30",borderRadius:6,padding:12,textAlign:"center"}},
          React.createElement("div",{style:{fontSize:18,marginBottom:4}},s==="ok"?"\u2705":s==="error"?"\u274C":"\u23F3"),
          React.createElement("div",{style:{fontSize:12,fontWeight:700,color:pillText[s]}},c.label),
          React.createElement("div",{style:{fontSize: 11,color:"#8A8678",marginTop:2}},s.toUpperCase()));
      }),
      socketInfo?React.createElement("div",{style:{flex:"1 1 140px",background:"#1A2A1A",border:"1px solid #3C5C2A",borderRadius:6,padding:12,textAlign:"center"}},
        React.createElement("div",{style:{fontSize:18,marginBottom:4}},"\uD83D\uDD0C"),
        React.createElement("div",{style:{fontSize:12,fontWeight:700,color:"#7AD45A"}},"Socket.IO"),
        React.createElement("div",{style:{fontSize: 11,color:"#8A8678",marginTop:2}},(socketInfo.socket_clients||0)+" clients")):null),

    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8,marginBottom:14}},
      metrics.map(function(m){
        return React.createElement("div",{key:m.label,style:{background:"#1A1A1F",border:"1px solid #2A2A30",borderRadius:6,padding:10}},
          React.createElement("div",{style:{fontSize: 11,color:"#8A8678",textTransform:"uppercase",letterSpacing:1,marginBottom:3}},m.label),
          React.createElement("div",{style:{fontSize:11,color:"#6A9AF0",fontFamily:"monospace",wordBreak:"break-all"}},m.value));
      })),

    React.createElement("div",{style:{background:"#1A1A1F",border:"1px solid #2A2A30",borderRadius:6,overflow:"hidden"}},
      React.createElement("div",{style:{padding:"7px 12px",background:"#151518",fontSize: 11,color:"#8A8678",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}},"n8n Webhook Endpoints"),
      endpoints.map(function(ep){
        return React.createElement("div",{key:ep.path,style:{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderBottom:"1px solid #151518"}},
          React.createElement("span",{style:{fontSize: 11,fontWeight:700,background:ep.method==="GET"?"#1A3A1A":"#1A2A3A",color:ep.method==="GET"?"#7AD45A":"#6A9AF0",padding:"2px 6px",borderRadius:3,minWidth:36,textAlign:"center"}},ep.method),
          React.createElement("div",{style:{flex:1}},
            React.createElement("div",{style:{fontSize:11,fontFamily:"monospace",color:"#D4AF37"}},ep.path),
            React.createElement("div",{style:{fontSize: 11,color:"#8A8678"}},ep.desc)));
      })));
}
/* ===== END PLATFORM HEALTH MONITOR ===== */

export default function App() {
  var [splash, setSplash] = useState(true);
  var [activeTab, setActiveTab] = useState('room');
  var [isLive, setIsLive] = useState(false);
  var [viewerCount, setViewerCount] = useState(0);
  var [loveTotal, setLoveTotal] = useState(0);
  var [guests, setGuests] = useState([]);
  var [chat, setChat] = useState([]);
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
  var [username, setUsername] = useState(function() { var _u = localStorage.getItem('sw_username'); return (_u && _u !== 'undefined' && _u !== 'null') ? _u : ''; });
  var [showNameModal, setShowNameModal] = useState(function() { var _u = localStorage.getItem('sw_username'); return !_u || _u === 'undefined' || _u === 'null'; });
  var [nameInput,     setNameInput]     = useState('');
  var [editingName,   setEditingName]   = useState(false);
  var [nameEditVal,   setNameEditVal]   = useState('');
  var [role] = useState(function() { return localStorage.getItem('sw_role') || 'viewer'; });
  var [showAgeGate, setShowAgeGate] = useState(function() {
    var key = (localStorage.getItem('sw_role') === 'host' || localStorage.getItem('sw_role') === 'cohost') ? 'sw_age_ok_host' : 'sw_age_ok_viewer';
    return !localStorage.getItem(key);
  });
  var [showLoginModal, setShowLoginModal] = useState(false);
  var [branding, setBranding] = useState(function() {
    try {
      var b = localStorage.getItem('sw_branding');
      if (b) return JSON.parse(b);
    } catch(e) {}
    return { gold: '#C9A84C', burg: '#800020', showScoreBar: true };
  });
  var [fadesScores, setFadesScores] = useState({ team1: 0, team2: 0 });
  var [paidRoom,    setPaidRoom]    = useState({ enabled: false, priceCents: 0 });
  var [paidUnlocked, setPaidUnlocked] = useState(function() { return role === 'host'; });
  var [ppvToken, setPpvToken] = useState(function() { return sessionStorage.getItem('sw_ppv_token') || null; });
  var [overlayConfig, setOverlayConfig] = useState({ banner: { text: '', position: 'bottom', color: '#C9A84C', visible: false }, countdown: { label: 'STARTING SOON', targetTs: 0, visible: false }, scoreBug: { label: 'DOMINO CLASSIC', team1: { name: 'EAST', score: 0 }, team2: { name: 'WEST', score: 0 }, visible: false }, lowerThirds: {} });
  var [streamInfo, setStreamInfo] = useState({ title: '', category: '', desc: '' });
  var [userTier, setUserTier] = useState(function() { return localStorage.getItem('sw_user_tier') || 'free'; });
  var [auraMessages, setAuraMessages] = useState([]);
  var [auraUnread, setAuraUnread] = useState(0);
  var [sessionEarningsCents, setSessionEarningsCents] = useState(0);
  var [streamRecap, setStreamRecap] = useState(null);
  var [streamGoal, setStreamGoal] = useState(function() {
    try { var g = localStorage.getItem('sw_stream_goal'); if (g) return JSON.parse(g); } catch(e) {}
    return null;
  });
  var [installPrompt, setInstallPrompt] = useState(null);
  var [showInstallBanner, setShowInstallBanner] = useState(false);
  var [editingTitle, setEditingTitle] = useState(false);
  var [titleDraft, setTitleDraft] = useState('');
  var [showMoreDrawer, setShowMoreDrawer] = useState(false);
  var [canGoBack, setCanGoBack] = useState(false);
  var [nextEventCountdown, setNextEventCountdown] = useState(null);
  var [tabResetKey, setTabResetKey] = useState(0);
  var [giftFloats, setGiftFloats] = useState([]);
  var [gifts, setGifts] = useState([]);

  var socketRef = useRef(null);
  var uptimeRef = useRef(null);
  var liveStartRef = useRef(null);
  var peakViewerRef = useRef(0);
  var sessionEarningsRef = useRef(0);
  var popstateNavRef = useRef(false);
  var streamRecapRef = useRef(null);
  var prevEarningsRef = useRef(0);
  var prevGuestIdsRef = useRef(null);

  var addToast = useCallback(function(msg, type) {
    var id = Date.now() + Math.random();
    setToasts(function(prev) { return [...prev, { id, msg, type: type || 'info' }]; });
    setTimeout(function() { setToasts(function(prev) { return prev.filter(function(t) { return t.id !== id; }); }); }, 4000);
  }, []);

  useEffect(function() {
    var t = setTimeout(function() { setSplash(false); }, 2200);
    return function() { clearTimeout(t); };
  }, []);

  // Keep streamRecapRef in sync for the popstate handler
  useEffect(function() { streamRecapRef.current = streamRecap; }, [streamRecap]);

  // History API — wire Android back button to tab navigation + overlay dismissal
  useEffect(function() {
    window.history.replaceState({ swTab: 'room' }, '');
    function onPop(e) {
      // If the stream recap modal is open, dismiss it instead of navigating
      if (streamRecapRef.current) {
        setStreamRecap(null);
        if (e.state && e.state.swTab) { popstateNavRef.current = true; }
        return;
      }
      if (e.state && e.state.swTab) {
        popstateNavRef.current = true;
        setActiveTab(e.state.swTab);
      }
    }
    window.addEventListener('popstate', onPop);
    return function() { window.removeEventListener('popstate', onPop); };
  }, []);

  useEffect(function() {
    if (popstateNavRef.current) { popstateNavRef.current = false; return; }
    window.history.pushState({ swTab: activeTab }, '');
  }, [activeTab]);

  useEffect(function() {
    setCanGoBack(window.history.length > 1);
  }, []);

  useEffect(function() {
    var stored = localStorage.getItem('sw_reminders');
    if (!stored) return;
    fetch('/api/schedule')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var events = data && data.events ? data.events : [];
        var reminders = [];
        try { reminders = JSON.parse(stored); } catch(e) {}
        var now = Date.now() / 1000;
        var upcoming = events.filter(function(ev) {
          return reminders.indexOf(ev.id) >= 0 && ev.scheduled_at > now;
        }).sort(function(a, b) { return a.scheduled_at - b.scheduled_at; });
        if (upcoming.length > 0) {
          setNextEventCountdown({ label: upcoming[0].title || upcoming[0].label, ts: upcoming[0].scheduled_at });
        }
      })
      .catch(function() {});
  }, []);

  // Earnings milestone celebration toasts
  useEffect(function() {
    var prev = prevEarningsRef.current;
    var curr = sessionEarningsCents;
    var MILESTONES = [1000, 2500, 5000, 10000, 25000, 50000];
    for (var i = 0; i < MILESTONES.length; i++) {
      if (curr >= MILESTONES[i] && prev < MILESTONES[i]) {
        addToast('🏆 $' + Math.floor(MILESTONES[i] / 100) + ' milestone — stream is POPPING!', 'success');
        break;
      }
    }
    prevEarningsRef.current = curr;
  }, [sessionEarningsCents, addToast]);

  useEffect(function() {
    function handleInstallPrompt(e) {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return function() { window.removeEventListener('beforeinstallprompt', handleInstallPrompt); };
  }, []);

  useEffect(function() {
    var token = localStorage.getItem('sw_token') || '';
    var socket = getSocket(token);
    socketRef.current = socket;

    var joinPayload = { roomId: APP_ID, userId: userId, username: username, role: role, token: token };
    setRejoinPayload(joinPayload);
    onReconnectCallback(function() {
      setConnected(true);
      addToast('Reconnected to SeeWhy LIVE', 'success');
    });

    socket.on('connect', function() {
      setConnected(true);
      socket.emit('join-room', joinPayload);
    });

    socket.on('disconnect', function() {
      setConnected(false);
      addToast('Connection lost — reconnecting...', 'error');
    });

    socket.on('roster-update', function(data) {
      if (!data || !data.guests) return;
      var newGuests = data.guests;
      var prevMap = prevGuestIdsRef.current;
      if (prevMap !== null) {
        newGuests.forEach(function(g) {
          var gid = g.guestId ? g.guestId : g.userId;
          if (gid && gid !== userId && !prevMap[gid]) {
            addToast((g.username || gid) + ' joined the room', 'info');
          }
        });
        var newGuestIds = {};
        newGuests.forEach(function(g) { var gid = g.guestId || g.userId; if (gid) newGuestIds[gid] = true; });
        Object.keys(prevMap).forEach(function(gid) {
          if (!newGuestIds[gid] && gid !== userId) {
            addToast((prevMap[gid] || gid) + ' left', 'info');
          }
        });
      }
      var nextMap = {};
      newGuests.forEach(function(g) { var gid = g.guestId || g.userId; if (gid) nextMap[gid] = g.username || gid; });
      prevGuestIdsRef.current = nextMap;
      setGuests(function(prev) {
        return newGuests.map(function(g) {
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

    socket.on('username-updated', function(data) {
      if (!data || !data.userId || !data.username) return;
      setGuests(function(prev) {
        return prev.map(function(g) {
          var gid = g.guestId ? g.guestId : g.userId;
          if (gid !== data.userId) return g;
          return Object.assign({}, g, { username: data.username });
        });
      });
    });

    var viewerMilestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
    var passedMilestones = {};
    socket.on('viewer-count', function(data) {
      if (!data || typeof data.count !== 'number') return;
      var prev = viewerCount;
      setViewerCount(data.count);
      if (data.count > peakViewerRef.current) peakViewerRef.current = data.count;
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

    socket.on('chat-blocked', function(data) {
      if (!data) return;
      addToast('🚫 ' + (data.reason || 'Message blocked'), 'error');
    });

    socket.on('super-chat', function(sc) {
      if (!sc) return;
      if (role === 'host') {
        var scCents = Math.floor(sc.amountCents || 0);
        setSessionEarningsCents(function(prev) { sessionEarningsRef.current = prev + scCents; return prev + scCents; });
        addToast('💬 Super Chat $' + (scCents / 100).toFixed(2) + ' from ' + (sc.username || 'viewer'), 'success');
      }
    });

    socket.on('gift-received', function(gift) {
      if (!gift) return;
      var floatId = Date.now() + Math.random();
      setGiftFloats(function(prev) {
        return prev.concat([{
          floatId:     floatId,
          emoji:       gift.emoji || '🎁',
          name:        gift.name  || 'Gift',
          from_user:   gift.fromUser || gift.from_user || 'Fan',
          value_cents: gift.valueCents || gift.value_cents || 0,
          toGuestId:   gift.toGuestId || null,
        }]);
      });
      setTimeout(function() {
        setGiftFloats(function(prev) { return prev.filter(function(g) { return g.floatId !== floatId; }); });
      }, 5000);
      if (role === 'host' && (gift.creatorCents || 0) > 0) {
        var dollars = ((gift.creatorCents || 0) / 100).toFixed(2);
        addToast('🎁 ' + (gift.fromUser || 'Fan') + ' — ' + (gift.name || 'Gift') + ' +$' + dollars, 'success');
        var cc = Math.floor(gift.creatorCents || 0);
        setSessionEarningsCents(function(prev) { sessionEarningsRef.current = prev + cc; return prev + cc; });
      }
    });

    socket.on('earnings-update', function(data) {
      if (!data || role !== 'host') return;
      var newTotal = Math.floor(data.sessionCents || 0);
      if (newTotal > sessionEarningsRef.current) {
        setSessionEarningsCents(newTotal);
        sessionEarningsRef.current = newTotal;
      }
    });

    socket.on('room-paywall', function(data) {
      if (!data) return;
      setPaidRoom({ enabled: !!data.enabled, priceCents: Math.floor(data.priceCents || 0) });
      if (!data.enabled) setPaidUnlocked(false);
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
      var subCents = Math.floor(data.price_cents || 0);
      setSessionEarningsCents(function(prev) { sessionEarningsRef.current = prev + subCents; return prev + subCents; });
    });

    socket.on('bot-log', function(log) {
      if (!log) return;
      setBotLogs(function(prev) { return [...prev.slice(-100), { ...log, id: Date.now() + Math.random() }]; });
    });

    socket.on('go-live-confirmed', function() {
      setIsLive(true);
      liveStartRef.current = Date.now();
      peakViewerRef.current = 0;
      sessionEarningsRef.current = 0;
      setLoveTotal(0);
      addToast('🔴 LIVE! Stream is broadcasting', 'success');
    });

    socket.on('love-update', function(data) {
      if (!data || String(data.roomId) !== String(APP_ID)) return;
      setLoveTotal(data.total || 0);
    });

    socket.on('stream-goal-set', function(data) {
      if (!data || String(data.roomId) !== String(APP_ID)) return;
    });
    socket.on('stream-goal-clear', function(data) {
      if (!data || String(data.roomId) !== String(APP_ID)) return;
    });

    socket.on('broadcast-ended', function() {
      setIsLive(false);
      var durationSecs = liveStartRef.current ? Math.floor((Date.now() - liveStartRef.current) / 1000) : 0;
      liveStartRef.current = null;
      addToast('Stream ended', 'info');
      var recap = {
        durationSecs:   durationSecs,
        peakViewers:    peakViewerRef.current,
        earningsCents:  sessionEarningsRef.current,
        giftCount:      0
      };
      setStreamRecap(recap);
      window.history.pushState({ swOverlay: 'recap' }, '');
      peakViewerRef.current = 0;
      sessionEarningsRef.current = 0;
      setSessionEarningsCents(0);
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

    socket.on('host-alert', function(data) {
      if (!data) return;
      if (data.type === 'engagement_surge') {
        addToast('🚀 SURGE! Viewers up ' + data.pct + '% in 60s — ' + data.viewers + ' watching!', 'success');
      } else if (data.type === 'viewers_drop') {
        addToast('⚠ Viewer drop: ' + data.current + ' (was ' + data.previous + ')', 'info');
      } else if (data.type === 'revenue_milestone') {
        addToast('💰 ' + data.message, 'success');
      } else if (data.type === 'retention_coach') {
        addToast(data.message, 'info');
      } else if (data.message) {
        addToast(data.message, 'info');
      }
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

    socket.on('host-disconnected', function() {
      addToast('Host lost connection — watch party paused', 'error');
    });

    socket.on('aura-message', function(data) {
      if (!data || !data.text) return;
      var msg = { text: data.text, mode: data.mode || 'hype', ts: Date.now() };
      setAuraMessages(function(prev) { return [msg].concat(prev.slice(0, 19)); });
      setAuraUnread(function(n) { return n + 1; });
    });

    socket.on('user-muted', function(data) {
      if (!data) return;
      addToast('Guardian muted a user: ' + (data.reason || 'violation'), 'info');
    });

    socket.on('creator-followed', function(data) {
      if (!data || !data.follower) return;
      if (role === 'host' || role === 'cohost') {
        addToast('❤️ ' + data.follower + ' followed you!', 'success');
      }
    });

    return function() {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('roster-update');
      socket.off('viewer-count');
      socket.off('chat-message');
      socket.off('chat-blocked');
      socket.off('room-paywall');
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
      socket.off('creator-followed');
      socket.off('username-updated');
      socket.off('super-chat');
      socket.off('earnings-update');
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

  useEffect(function() {
    if (streamGoal) {
      try { localStorage.setItem('sw_stream_goal', JSON.stringify(streamGoal)); } catch(e) {}
    } else {
      try { localStorage.removeItem('sw_stream_goal'); } catch(e) {}
    }
  }, [streamGoal]);

  function handleNameSubmit() {
    var name = nameInput.trim().slice(0, 32);
    if (!name) return;
    localStorage.setItem('sw_username', name);
    setUsername(name);
    setShowNameModal(false);
  }

  function saveNameEdit() {
    var name = nameEditVal.trim().slice(0, 32);
    if (!name) { setEditingName(false); return; }
    localStorage.setItem('sw_username', name);
    setUsername(name);
    setEditingName(false);
    if (socketRef.current) socketRef.current.emit('update-username', { roomId: APP_ID, userId: userId, username: name });
    addToast('Name updated', 'success');
  }

  function shareRoom() {
    var url = window.location.origin;
    if (navigator.share) {
      navigator.share({ title: 'SeeWhy LIVE', text: 'Join me on SeeWhy LIVE!', url: url }).catch(function() {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() { addToast('Link copied!', 'success'); }).catch(function() {});
    }
  }

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

  if (showNameModal) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0E0C09', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: '#F0E8D4', letterSpacing: 4, lineHeight: 1 }}>SeeWhy LIVE</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', marginTop: 4, letterSpacing: 2 }}>v33.0 · WASHINGTON CLASSIC</div>
          </div>
          <div style={{ background: 'rgba(26,21,16,.95)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, color: '#F0E8D4', letterSpacing: 1 }}>What's your display name?</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', marginTop: 4 }}>This is how others see you in the room</div>
            </div>
            <input
              autoFocus
              type="text"
              maxLength={32}
              placeholder="Enter your name..."
              value={nameInput}
              onChange={function(e) { setNameInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') handleNameSubmit(); }}
              style={{ width: '100%', boxSizing: 'border-box', background: '#07050A', border: '1px solid rgba(201,168,76,.4)', borderRadius: 9, padding: '12px 14px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, outline: 'none', letterSpacing: 0.5 }}
            />
            <button
              onClick={handleNameSubmit}
              disabled={!nameInput.trim()}
              style={{ width: '100%', padding: '13px', background: nameInput.trim() ? 'linear-gradient(135deg,#800020,#C01838)' : 'rgba(26,21,16,.5)', border: '1px solid ' + (nameInput.trim() ? '#C01838' : '#6B5A44'), borderRadius: 9, color: nameInput.trim() ? '#C9A84C' : '#6B5A44', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 3, cursor: nameInput.trim() ? 'pointer' : 'default' }}>
              JOIN THE ROOM
            </button>
            <button
              onClick={function() { var g = 'Guest' + Math.floor(Math.random() * 9000 + 1000); localStorage.setItem('sw_username', g); setUsername(g); setShowNameModal(false); }}
              style={{ background: 'none', border: 'none', color: '#6B5A44', fontFamily: "'DM Mono',monospace", fontSize: 11, cursor: 'pointer', textDecoration: 'underline', textAlign: 'center' }}>
              Join anonymously
            </button>
              <button
                onClick={function() { setShowLoginModal(true); }}
                style={{ background: 'none', border: 'none', color: '#8A7A62', fontFamily: "'DM Mono',monospace", fontSize: 11, cursor: 'pointer', textDecoration: 'underline', textAlign: 'center' }}
              >
                Already a host? Log In
              </button>
          </div>
        </div>
      </div>
    );
  }

  if (showLoginModal) {
    return <Login
      onClose={function() { setShowLoginModal(false); }}
      onSuccess={function(newRole, newUserId) {
        setRole(newRole);
        setShowLoginModal(false);
      }}
    />;
  }

  if (showAgeGate) {
    return <AgeGate role={role} onConfirm={function() { setShowAgeGate(false); }} />;
  }

  if (splash) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0E0C09', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, overflow: 'hidden' }}>
        <style dangerouslySetInnerHTML={{ __html: [
          '@keyframes splashFade{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}',
          '@keyframes splashPulse{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,.5)}70%{box-shadow:0 0 0 24px rgba(201,168,76,0)}}',
          '@keyframes splashBar{0%{opacity:.2}50%{opacity:1}100%{opacity:.2}}',
          '@keyframes splashDot{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}',
        ].join('') }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(128,0,32,.18) 0%, transparent 70%)' }} />
        <div style={{ textAlign: 'center', animation: 'splashFade .5s ease', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            {[0,1,2,3,4].map(function(i) {
              return <div key={i} style={{ width: 4, borderRadius: 2, background: i % 2 === 0 ? '#800020' : '#C9A84C', height: 18 + (i === 2 ? 14 : i === 1 || i === 3 ? 8 : 0), animation: 'splashDot 1s ease ' + (i * .1) + 's infinite' }} />;
            })}
          </div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 62, color: '#F0E8D4', letterSpacing: 5, lineHeight: 1, animation: 'splashPulse 1.8s infinite' }}>SeeWhy LIVE</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#C9A84C', marginTop: 6, letterSpacing: 3 }}>v33.0 · WASHINGTON CLASSIC</div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center' }}>
            {['DOMINO ENTERTAINMENT','VIBENBONES','WASHINGTON DC'].map(function(label, i) {
              return <span key={i} style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 4, padding: '3px 9px', color: '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{label}</span>;
            })}
          </div>
          {nextEventCountdown && (
            <div style={{ background: 'rgba(128,0,32,.3)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '10px 20px', textAlign: 'center', marginTop: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', letterSpacing: 2, marginBottom: 4 }}>NEXT EVENT</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A84C', letterSpacing: 2 }}>{nextEventCountdown.label}</div>
              <CountdownClock targetTs={nextEventCountdown.ts} />
            </div>
          )}
          <div style={{ marginTop: 24, display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'flex-end', height: 28 }}>
            {[4,7,5,9,6,8,4,6,9,7,5,8,6].map(function(h, i) {
              return <div key={i} style={{ width: 3, borderRadius: 2, background: 'rgba(201,168,76,.5)', height: h * 2 + 4, animation: 'splashBar ' + (.6 + i * .07) + 's ease ' + (i * .04) + 's infinite' }} />;
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0E0C09', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif" }}>
      <BrandChyron isLive={isLive} streamTitle={streamInfo.title} />
      {/* Header HUD */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,12,20,.95)', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', padding: '6px 16px', gap: 12, height: 44, paddingTop: 'max(6px, env(safe-area-inset-top, 6px))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          {canGoBack && (
            <button
              onClick={function() { window.history.back(); }}
              style={{ background: 'none', border: 'none', color: '#C9A84C', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer', padding: '4px 8px 4px 0', letterSpacing: 1, userSelect: 'none', WebkitUserSelect: 'none', flexShrink: 0 }}>
              ← BACK
            </button>
          )}
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#F0E8D4', letterSpacing: 2 }}>SeeWhy LIVE</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62' }}>v33.0</span>
          {isLive && <span style={{ background: 'rgba(255,26,60,.2)', border: '1px solid rgba(255,26,60,.5)', borderRadius: 4, padding: '2px 8px', color: '#FF1A3C', fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 700 }}>● LIVE</span>}
          {!connected && <span style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 4, padding: '2px 8px', color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 11 }}>OFFLINE</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 1 }}>
          {isLive && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#C9A84C' }}>{formatUptime(uptime)}</span>}
          {isLive && !editingTitle && streamInfo.title ? (
            <span
              title="Click to edit title"
              onClick={function() { setTitleDraft(streamInfo.title); setEditingTitle(true); }}
              style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#F0E8D4', letterSpacing: 0.5, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', borderBottom: '1px dashed rgba(201,168,76,.35)' }}>
              {streamInfo.title}
            </span>
          ) : null}
          {isLive && editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={function(e) { setTitleDraft(e.target.value.slice(0, 80)); }}
              onKeyDown={function(e) {
                if (e.key === 'Enter') {
                  var t = titleDraft.trim();
                  if (t && socketRef.current) socketRef.current.emit('stream-info', { roomId: APP_ID, title: t, category: streamInfo.category, desc: streamInfo.desc });
                  if (t) setStreamInfo(function(prev) { return Object.assign({}, prev, { title: t }); });
                  setEditingTitle(false);
                }
                if (e.key === 'Escape') setEditingTitle(false);
              }}
              onBlur={function() {
                var t = titleDraft.trim();
                if (t && socketRef.current) socketRef.current.emit('stream-info', { roomId: APP_ID, title: t, category: streamInfo.category, desc: streamInfo.desc });
                if (t) setStreamInfo(function(prev) { return Object.assign({}, prev, { title: t }); });
                setEditingTitle(false);
              }}
              style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#F0E8D4', letterSpacing: 0.5, maxWidth: 180, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.5)', borderRadius: 4, padding: '1px 5px', outline: 'none' }}
            />
          ) : null}
          {isLive && streamInfo.category ? <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#C9A84C', letterSpacing: 1 }}>{streamInfo.category.toUpperCase()}</span> : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
          {isLive && viewerCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 999, padding: '3px 8px' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 5px #FF1A3C' }} />
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#FF6B81', letterSpacing: 1 }}>
                {viewerCount >= 1000 ? (Math.floor(viewerCount / 100) / 10).toFixed(1) + 'K' : viewerCount}
              </span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62' }}>LIVE</span>
            </div>
          )}
          {!isLive && (
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62' }}>👁 {viewerCount}</span>
          )}
          {isLive && sessionEarningsCents > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 999, padding: '3px 7px' }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#C9A84C', letterSpacing: 1 }}>
                ${(Math.floor(sessionEarningsCents) / 100).toFixed(2)}
              </span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62' }}>SESSION</span>
            </div>
          )}
          {/* Username chip — tap to edit */}
          {editingName ? (
            <input
              autoFocus
              value={nameEditVal}
              maxLength={32}
              onChange={function(e) { setNameEditVal(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') saveNameEdit(); if (e.key === 'Escape') setEditingName(false); }}
              onBlur={saveNameEdit}
              style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#F0E8D4', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.5)', borderRadius: 6, padding: '2px 7px', outline: 'none', width: 90 }}
            />
          ) : (
            <button
              onClick={function() { setNameEditVal(username); setEditingName(true); }}
              title="Edit display name"
              style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 6, padding: '3px 8px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{username}</span>
              <span style={{ fontSize: 11, color: '#8A7A62', flexShrink: 0 }}>✏</span>
            </button>
          )}
          {/* Share / Invite button */}
          <button onClick={shareRoom} title="Share room link"
            style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '4px 8px', color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
            🔗
          </button>
          <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: apiHealth === 'good' ? '#C9A84C' : apiHealth === 'degraded' ? '#C9A84C' : '#FF1A3C', marginRight: 4 }}>
            {apiHealth === 'good' ? '● API' : apiHealth === 'degraded' ? '◑ API' : '○ API'}
          </span>
          {showInstallBanner && installPrompt && (
            <button
              onClick={function() {
                installPrompt.prompt();
                installPrompt.userChoice.then(function(result) {
                  if (result.outcome === 'accepted') {
                    addToast('SeeWhy LIVE installed!', 'success');
                  }
                  setInstallPrompt(null);
                  setShowInstallBanner(false);
                });
              }}
              style={{ background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1, whiteSpace: 'nowrap' }}
            >
              ⬇ INSTALL
            </button>
          )}
        </div>
      </header>

      {/* Secondary tab bar — hidden on room tab, shown when More drawer is open */}
      {activeTab !== 'room' && (
      <nav style={{ display: 'flex', overflowX: 'auto', background: 'rgba(14,12,9,.9)', borderBottom: '1px solid rgba(255,255,255,.05)', padding: '4px 8px', gap: 4, scrollbarWidth: 'none', overscrollBehavior: 'contain' }}>
        {TABS.filter(function(t) {
          if (t.id === 'room' || t.id === 'discover' || t.id === 'profile' || t.id === 'settings') return false;
          if (t.roles && t.roles.indexOf(role) === -1) return false;
          return true;
        }).map(function(tab) { return (
          <button
            key={tab.id}
            style={{ position: 'relative', background: activeTab === tab.id ? '#800020' : 'rgba(26,21,16,.8)', border: activeTab === tab.id ? '1px solid rgba(128,0,32,.6)' : '1px solid rgba(255,255,255,.06)', borderRadius: 6, padding: '8px 12px', minHeight: 36, color: activeTab === tab.id ? '#F0E8D4' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', WebkitUserSelect: 'none' }}
            onClick={function() { setActiveTab(tab.id); if (tab.id === 'aura') setAuraUnread(0); }}
          >
            {tab.label}
            {tab.id === 'aura' && auraUnread > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#FF1A3C', color: '#fff', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 700, lineHeight: 1, border: '1px solid rgba(15,12,20,.8)' }}>
                {auraUnread > 9 ? '9+' : auraUnread}
              </span>
            )}
          </button>
        ); })}
      </nav>
      )}

      {/* Stream Goal Progress Bar */}
      {streamGoal && isLive && (
        (function() {
          var pct = Math.min(100, Math.floor((sessionEarningsCents / Math.max(1, streamGoal.goalCents)) * 100));
          var barColor = pct >= 100 ? '#C9A84C' : pct >= 75 ? '#C9A84C' : '#C9A84C';
          return (
            <div style={{ background: 'rgba(14,12,9,.95)', borderBottom: '1px solid rgba(255,255,255,.05)', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', letterSpacing: 1, flexShrink: 0 }}>GOAL</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#F0E8D4', flexShrink: 0, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{streamGoal.label || 'Stream Goal'}</span>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: barColor, width: pct + '%', transition: 'width .5s ease, background .3s' }} />
              </div>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: barColor, letterSpacing: 1, flexShrink: 0 }}>{pct}%</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', flexShrink: 0 }}>${(Math.floor(sessionEarningsCents) / 100).toFixed(0)}/${(Math.floor(streamGoal.goalCents) / 100).toFixed(0)}</span>
              <button onClick={function() { setStreamGoal(null); }} style={{ background: 'none', border: 'none', color: '#6B5A44', cursor: 'pointer', fontSize: 11, padding: '0 2px', flexShrink: 0, lineHeight: 1, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          );
        })()
      )}

      {/* Tab Content */}
      <main style={{ padding: activeTab === 'room' ? '0' : '16px', flex: 1, paddingBottom: activeTab === 'room' ? 0 : 70, display: 'flex', flexDirection: 'column', overflow: activeTab === 'room' ? 'hidden' : 'visible', overscrollBehavior: 'contain' }}>
      <ErrorBoundary>
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', letterSpacing: 2 }}>LOADING...</div>}>
      <div key={activeTab + '-' + tabResetKey} style={{ display: 'flex', flexDirection: 'column', flex: 1, animation: activeTab !== 'room' ? 'tabSlideIn .18s ease-out' : 'none' }}>
        {activeTab === 'room' && paidRoom.enabled && !paidUnlocked && (
          <PaywallScreen
            priceCents={paidRoom.priceCents}
            onUnlock={function() { setPaidUnlocked(true); }}
            addToast={addToast}
          />
        )}
        {activeTab === 'room' && (!paidRoom.enabled || paidUnlocked) && (
          <LiveRoomPage
            socket={socketRef.current}
            guests={guests}
            chat={chat}
            setChat={setChat}
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
            streamInfo={streamInfo}
            streamGoal={streamGoal}
            setStreamGoal={setStreamGoal}
            sessionEarningsCents={sessionEarningsCents}
            onLeave={function() { setActiveTab('discover'); addToast('Left the room', 'info'); }}
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
            socket={socketRef.current}
            roomId={APP_ID}
            role={role}
            isLive={isLive}
            addToast={addToast}
          />
        )}
        {activeTab === 'analytics' && (role === 'host' || role === 'cohost') && (
          <CreatorDashboard />
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
            socket={socketRef.current}
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
            streamId={APP_ID}
            creatorId={userId}
            socket={socketRef.current}
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
            chat={chat}
          />
        )}
        {activeTab === 'stage' && (
          <AudioStageTab
            socket={socketRef.current}
            roomId={APP_ID}
            userId={userId}
            username={username}
            role={role}
            addToast={addToast}
          />
        )}
        {activeTab === 'sfx' && (
          <SoundBoardTab
            socket={socketRef.current}
            roomId={APP_ID}
            role={role}
            addToast={addToast}
          />
        )}
        {activeTab === 'trivia' && (
          <TriviaTab
            socket={socketRef.current}
            roomId={APP_ID}
            role={role}
            username={username}
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
            socket={socketRef.current}
            roomId={APP_ID}
            role={role}
          />
        )}
        {activeTab === 'money' && (
          <MonetizeTab
            addToast={addToast}
            isLive={isLive}
            socket={socketRef.current}
            roomId={APP_ID}
            username={username}
            streamGoal={streamGoal}
            setStreamGoal={setStreamGoal}
            sessionEarningsCents={sessionEarningsCents}
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
            incomingMessages={auraMessages}
          />
        )}
        {activeTab === 'swanai' && (
          <SwanAITab
            isLive={isLive}
            viewerCount={viewerCount}
            addToast={addToast}
            socket={socketRef.current}
            roomId={APP_ID}
            sessionEarningsCents={sessionEarningsCents}
            username={username}
            role={role}
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
            socket={socketRef.current}
            roomId={APP_ID}
          />
        )}
        {activeTab === 'desktop-studio' && (
          <DesktopStudioTab />
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
        {activeTab === 'creators' && (
          <CreatorDiscoveryTab addToast={addToast} isLive={isLive} socket={socketRef.current} roomId={APP_ID} username={username} />
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
        {activeTab === 'battles' && (
          <PKBattleTab
            socket={socketRef.current}
            roomId={APP_ID}
            role={role}
            isLive={isLive}
            addToast={addToast}
            viewerCount={viewerCount}
            username={username}
          />
        )}
        {activeTab === 'vod' && (
          <VODLibraryTab
            addToast={addToast}
            isLive={isLive}
          />
        )}
        {activeTab === 'tips' && (
          <CreatorTipsTab
            addToast={addToast}
            username={username}
          />
        )}
        {activeTab === 'streams' && (
          <LiveStreamHubTab
            addToast={addToast}
            isLive={isLive}
            socket={socketRef.current}
            roomId={APP_ID}
          />
        )}
        {activeTab === 'panel' && (
          <PanelGrid
            socket={socketRef.current}
            roomId={APP_ID}
            userId={userId}
            isHost={role === 'host' || role === 'cohost'}
            rtcManager={rtcManager}
            guests={guests}
          />
        )}
        {activeTab === 'watchparty' && (
          <WatchPartyTab
            addToast={addToast}
            socket={socketRef.current}
            roomId={APP_ID}
            role={role}
            guests={guests}
          />
        )}
        {activeTab === 'vsbattle' && (
          <PKBattleTab
            addToast={addToast}
            socket={socketRef.current}
            roomId={APP_ID}
            role={role}
            isLive={isLive}
            username={username}
            viewerCount={viewerCount}
          />
        )}
        {activeTab === 'livesync' && (
          <LiveSyncTab
            socket={socketRef.current}
            roomId={APP_ID}
            isLive={isLive}
            addToast={addToast}
          />
        )}
        {activeTab === 'health' && (
          <PlatformHealthTab
            socket={socketRef.current}
            addToast={addToast}
          />
        )}
        {activeTab === 'leaderboard' && (
          <LeaderboardPage currentUserId={userId} />
        )}
        {activeTab === 'pkbattle-arena' && (
          <PKBattleArenaPage
            battleId={APP_ID}
            socket={socketRef.current}
            userId={userId}
            guests={guests}
            rtcManager={rtcManager}
          />
        )}
      </div>
      </Suspense>
      </ErrorBoundary>
      </main>

      {/* Stream Recap Modal */}
      {streamRecap && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,12,9,.88)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'linear-gradient(160deg,#1A1510,#0E0C09)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 16, padding: '28px 24px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 0 60px rgba(201,168,76,.15), 0 4px 30px rgba(0,0,0,.7)' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: '#C9A84C', letterSpacing: 4, marginBottom: 4 }}>STREAM RECAP</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', letterSpacing: 2, marginBottom: 20 }}>SeeWhy LIVE · Washington Classic</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.2)', borderRadius: 10, padding: '12px 8px' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#FF6B81', letterSpacing: 1 }}>{streamRecap.peakViewers >= 1000 ? (Math.floor(streamRecap.peakViewers / 100) / 10).toFixed(1) + 'K' : streamRecap.peakViewers}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', letterSpacing: 1, marginTop: 2 }}>PEAK VIEWERS</div>
              </div>
              <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 10, padding: '12px 8px' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#C9A84C', letterSpacing: 1 }}>${(Math.floor(streamRecap.earningsCents) / 100).toFixed(2)}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1, marginTop: 2 }}>SESSION EARNED</div>
              </div>
              <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 10, padding: '12px 8px' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#C9A84C', letterSpacing: 1 }}>${(Math.floor(streamRecap.earningsCents * 0.9) / 100).toFixed(2)}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', letterSpacing: 1, marginTop: 2 }}>YOUR CUT (90%)</div>
              </div>
              <div style={{ background: 'rgba(212,133,74,.08)', border: '1px solid rgba(212,133,74,.2)', borderRadius: 10, padding: '12px 8px' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#D4854A', letterSpacing: 1 }}>
                  {streamRecap.durationSecs >= 3600
                    ? Math.floor(streamRecap.durationSecs / 3600) + 'h ' + Math.floor((streamRecap.durationSecs % 3600) / 60) + 'm'
                    : Math.floor(streamRecap.durationSecs / 60) + 'm ' + (streamRecap.durationSecs % 60) + 's'}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', letterSpacing: 1, marginTop: 2 }}>DURATION</div>
              </div>
            </div>
            <button
              onClick={function() { window.history.back(); }}
              style={{ background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 10, padding: '12px 32px', minHeight: 44, color: '#C9A84C', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 3, cursor: 'pointer', width: '100%', userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              CLOSE RECAP
            </button>
          </div>
        </div>
      )}

      {/* Overlays */}
      <Toasts toasts={toasts} />
      <Ticker chat={chat} isLive={isLive} />
      {socketRef.current && (
        <LoveTap
          socket={socketRef.current}
          roomId={APP_ID}
          userId={userId}
          username={username}
          addToast={addToast}
        />
      )}
      {socketRef.current && (
        <GiftLeaderboardOverlay
          socket={socketRef.current}
          roomId={APP_ID}
          isLive={isLive}
        />
      )}
      {socketRef.current && (
        <StreamGoalBar
          socket={socketRef.current}
          roomId={APP_ID}
          role={role}
          isLive={isLive}
          viewerCount={viewerCount}
          earningsCents={sessionEarningsCents}
          loveTotal={loveTotal}
        />
      )}
      {socketRef.current && (
        <DonationAlert
          socket={socketRef.current}
          roomId={APP_ID}
        />
      )}
      {activeTab !== 'room' && (
        <MobileNavBar activeTab={activeTab} setActiveTab={setActiveTab} isLive={isLive} auraUnread={auraUnread} onAuraClick={function() { setAuraUnread(0); }} onResetTab={function() { setTabResetKey(function(k) { return k + 1; }); }} />
      )}
      <WelcomeAudio socket={socketRef.current} />
    </div>
  );
}

// ─── Paywall screen shown to viewers before entering a paid room ────────────
function PaywallScreen({ priceCents, onUnlock, addToast }) {
  var BG   = '#0E0C09'; var SURF = '#1A1510'; var CARD = '#241C12';
  var GOLD = '#C9A84C'; var TEAL = '#D4854A'; var MUTED = '#8A7A62'; var TEXT = '#F0E8D4';
  var BORDER = 'rgba(201,168,76,.12)';

  var creatorHandles = (function() {
    try { return JSON.parse(localStorage.getItem('sw_directpay_handles') || '{}'); } catch(e) { return {}; }
  })();
  var platHandles = getPlatformHandles();

  var DP_PLATFORMS = [
    { id: 'paypal',  emoji: '💸', name: 'PayPal',  color: '#0070BA', buildUrl: function(h) { return 'https://paypal.me/' + h.replace(/^@/,''); } },
    { id: 'cashapp', emoji: '💚', name: 'CashApp', color: '#00D54B', buildUrl: function(h) { return 'https://cash.app/$' + h.replace(/^\$/,''); } },
    { id: 'venmo',   emoji: '💙', name: 'Venmo',   color: '#3D95CE', buildUrl: function(h) { return 'https://venmo.com/' + h.replace(/^@/,''); } },
    { id: 'zelle',   emoji: '💜', name: 'Zelle',   color: '#6D1ED4', buildUrl: null },
    { id: 'chime',   emoji: '🟢', name: 'Chime',   color: '#16BE45', buildUrl: null },
  ];

  var activeCreator = DP_PLATFORMS.filter(function(p) { return !!(creatorHandles[p.id] || '').trim(); });
  var activePlat    = DP_PLATFORMS.filter(function(p) { return !!(platHandles[p.id] || '').trim(); });

  var totalCents   = Math.floor(priceCents) || 0;
  var cCents       = creatorCents(totalCents);
  var pCents       = platformCents(totalCents);
  var totalDollars = totalCents > 0 ? ('$' + (totalCents / 100).toFixed(2)) : null;
  var cDollars     = cCents > 0     ? ('$' + (cCents / 100).toFixed(2))     : null;
  var pDollars     = pCents > 0     ? ('$' + (pCents / 100).toFixed(2))     : null;

  function openPay(p, h) {
    h = (h || '').trim();
    if (!h) return;
    if (p.buildUrl) { window.open(p.buildUrl(h), '_blank', 'noopener'); }
    else { navigator.clipboard.writeText(h).then(function() { if (addToast) addToast(p.name + ': ' + h + ' copied!', 'success'); }); }
  }

  function renderPayRow(p, h, accentColor) {
    return (
      <button key={p.id} onClick={function() { openPay(p, h); }}
        style={{ background: 'rgba(255,255,255,.04)', border: '1.5px solid ' + accentColor + '55', borderRadius: 14, padding: '12px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', transition: 'background .2s' }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>{p.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: TEXT }}>{p.name}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: accentColor, letterSpacing: .5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</div>
        </div>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: accentColor, letterSpacing: 1, flexShrink: 0 }}>{p.buildUrl ? 'PAY →' : 'COPY'}</span>
      </button>
    );
  }

  return (
    <div style={{ height: '100%', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', fontFamily: "'Barlow Condensed',sans-serif", overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Lock icon + title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🔒</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: TEXT, letterSpacing: 2, marginBottom: 4 }}>PAID ACCESS</div>
          {totalDollars && (
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, color: GOLD, letterSpacing: 1, lineHeight: 1, marginBottom: 6 }}>{totalDollars}</div>
          )}
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: MUTED, letterSpacing: 1 }}>
            90% creator &bull; 10% platform fee
          </div>
        </div>

        {/* Creator section */}
        {activeCreator.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: TEAL, letterSpacing: 1.5, marginBottom: 8 }}>
              CREATOR — 90%{cDollars ? (' (' + cDollars + ')') : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeCreator.map(function(p) { return renderPayRow(p, creatorHandles[p.id], p.color); })}
            </div>
          </div>
        )}

        {/* Platform fee section */}
        {activePlat.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: GOLD, letterSpacing: 1.5, marginBottom: 8 }}>
              SEEWHY FEE — 10%{pDollars ? (' (' + pDollars + ')') : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activePlat.map(function(p) { return renderPayRow(p, platHandles[p.id], GOLD); })}
            </div>
          </div>
        )}

        {activeCreator.length === 0 && activePlat.length === 0 && (
          <div style={{ textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 11, color: MUTED, marginBottom: 20 }}>
            Contact the host to get payment details
          </div>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: MUTED, letterSpacing: 1 }}>AFTER PAYING BOTH</span>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
        </div>

        {/* Enter button */}
        <button onClick={onUnlock} style={{ width: '100%', background: 'rgba(201,168,76,.15)', border: '1.5px solid rgba(201,168,76,.4)', borderRadius: 14, padding: '16px', color: TEAL, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer', letterSpacing: 2, marginBottom: 10 }}>
          ✓ I'VE PAID — ENTER LIVE
        </button>
        <div style={{ textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 11, color: MUTED, letterSpacing: .5 }}>
          By entering you confirm you've sent payment to the creator and platform
        </div>
      </div>
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

  var glassCard = { background: 'rgba(26,21,16,.8)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '16px' };
  var panelTitle = { fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#F0E8D4', letterSpacing: 2, margin: '0 0 4px 0' };
  var panelSub = { fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', margin: '0 0 12px 0' };
  var formRow = { marginBottom: 10 };
  var inputStyle = { background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 8, padding: '8px 12px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, width: '100%', boxSizing: 'border-box' };
  var btnGold = { background: 'rgba(201,168,76,.2)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, padding: '9px 18px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, cursor: 'pointer' };
  var btnDelete = { background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 6, padding: '4px 10px', color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 11, cursor: 'pointer' };
  var keyRow = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.04)' };
  var keyPlatform = { fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#F0E8D4', flex: 1 };
  var keyStatus = { fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#C9A84C' };
  var keyDate = { fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62' };
  var mutedText = { fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62' };

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