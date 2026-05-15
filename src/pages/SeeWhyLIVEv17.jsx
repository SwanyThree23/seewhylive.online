import { useState, useEffect, useRef, useCallback } from "react";

// ── DESIGN TOKENS ────────────────────────────────────────────────
var G = {
  black:"#080808",darkBg:"#0D0D0D",cardBg:"#111111",
  surfaceBg:"#161616",crimson:"#8B0000",crimsonBright:"#C41E3A",
  gold:"#D4AF37",goldBright:"#FFD700",cyan:"#00E5FF",
  volt:"#C8FF00",white:"#FFFFFF",gray:"#888888",
  grayDim:"#444444",red:"#FF3B30",green:"#30D158",
  purple:"#BF5FFF",orange:"#FF9500",
  fOrb:"'Orbitron',sans-serif",fRaj:"'Rajdhani',sans-serif",
  fMon:"'Share Tech Mono',monospace",fBar:"'Barlow Condensed',sans-serif",
  fBeb:"'Bebas Neue',cursive",
};

// ── CONSTANTS ────────────────────────────────────────────────────
var SPLIT = 0.90;
var MAX_GUESTS = 20;
var GEM_TO_USD = 0.10;
var LANGUAGES = ["EN","ES","PT","FR","HT","TL","DE","JA"];

// ── UTILS ────────────────────────────────────────────────────────
function calcSplit(amount) {
  var cents = Math.floor(amount * 100);
  var creator = Math.floor(cents * SPLIT);
  var platform = cents - creator;
  return { creator: creator / 100, platform: platform / 100 };
}
function fmtTime(s) {
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var sec = s % 60;
  if (h > 0) return h+":"+pad(m)+":"+pad(sec);
  return pad(m)+":"+pad(sec);
}
function pad(n) { return n < 10 ? "0"+n : ""+n; }
function fmtMoney(n) { return "$"+(Math.floor(n * 100) / 100).toFixed(2); }
function randomID(len) {
  var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  var out = "";
  for (var i = 0; i < (len || 8); i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
function lsGet(key, def) {
  try { var v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; } catch(e) { return def; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}

// ── CSS ──────────────────────────────────────────────────────────
var CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;600;700;800&family=Bebas+Neue&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#080808;color:#fff;font-family:'Rajdhani',sans-serif;overflow-x:hidden}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#0D0D0D}::-webkit-scrollbar-thumb{background:#8B0000;border-radius:2px}
.sw-root{display:flex;flex-direction:column;min-height:100vh;max-width:430px;margin:0 auto;background:#080808;position:relative}
.sw-hdr{background:#0D0D0D;border-bottom:1px solid #8B0000;height:54px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:200}
.sw-logo{font-family:'Orbitron',sans-serif;font-size:14px;font-weight:900;background:linear-gradient(90deg,#C41E3A,#D4AF37);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:2px}
.sw-body{flex:1;overflow-y:auto;padding-bottom:70px}
.sw-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;height:64px;background:#0D0D0D;border-top:1px solid #8B0000;display:flex;z-index:200}
.nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:none;border:none;color:#444;cursor:pointer;font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;position:relative;transition:color .2s}
.nav-btn.on{color:#D4AF37}.nav-ico{font-size:19px;line-height:1}
.notif-dot{position:absolute;top:6px;right:calc(50% - 18px);width:14px;height:14px;border-radius:50%;background:#C41E3A;font-size:8px;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Share Tech Mono',monospace;font-weight:700}
.card{background:#111;border:1px solid #1a1a1a;border-radius:12px;overflow:hidden}
.card-r{border-color:#8B0000}.card-g{border-color:#D4AF37}.card-c{border-color:#00E5FF}.card-v{border-color:#C8FF00}.card-p{border-color:#BF5FFF}
.sec-title{font-family:'Orbitron',sans-serif;font-size:10px;font-weight:700;color:#D4AF37;letter-spacing:3px;padding:14px 16px 6px;text-transform:uppercase}
.pill{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:700;font-family:'Rajdhani',sans-serif;letter-spacing:.5px}
.pill-r{background:rgba(196,30,58,.2);border:1px solid #C41E3A;color:#FF6B6B}
.pill-g{background:rgba(212,175,55,.2);border:1px solid #D4AF37;color:#FFD700}
.pill-c{background:rgba(0,229,255,.15);border:1px solid #00E5FF;color:#00E5FF}
.pill-v{background:rgba(200,255,0,.12);border:1px solid #C8FF00;color:#C8FF00}
.pill-p{background:rgba(191,95,255,.15);border:1px solid #BF5FFF;color:#BF5FFF}
.btn{padding:10px 18px;border-radius:8px;border:none;cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:14px;letter-spacing:1px;transition:all .2s}
.btn-r{background:#8B0000;color:#D4AF37;border:1px solid #C41E3A}.btn-r:hover{background:#C41E3A}
.btn-g{background:linear-gradient(135deg,#8B0000,#D4AF37);color:#000}
.btn-outline{background:none;color:#D4AF37;border:1px solid #D4AF37}.btn-outline:hover{background:rgba(212,175,55,.1)}
.btn-v{background:#C8FF00;color:#080808;font-weight:900}
.inp{width:100%;padding:10px 14px;background:#161616;border:1px solid #333;border-radius:8px;color:#fff;font-family:'Share Tech Mono',monospace;font-size:13px;outline:none}
.inp:focus{border-color:#D4AF37}.inp::placeholder{color:#444}
.tab-bar{display:flex;border-bottom:1px solid #1a1a1a;background:#0D0D0D;overflow-x:auto}
.tab-bar::-webkit-scrollbar{height:0}
.tab-item{padding:10px 16px;font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;color:#555;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;transition:all .2s}
.tab-item.on{color:#D4AF37;border-bottom-color:#D4AF37}
.live-ring{animation:liveRing 1.5s ease-in-out infinite}
@keyframes liveRing{0%,100%{box-shadow:0 0 0 0 rgba(196,30,58,.5)}50%{box-shadow:0 0 0 8px rgba(196,30,58,0)}}
.volt-glow{text-shadow:0 0 12px #C8FF00,0 0 24px #C8FF0066}
.gold-glow{text-shadow:0 0 12px #D4AF37,0 0 24px #D4AF3766}
.pulse{animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.slide-up{animation:slideUp .3s ease-out}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.coin-spin{animation:coinSpin .5s ease-out}
@keyframes coinSpin{0%{transform:scale(0) rotateY(0deg)}100%{transform:scale(1) rotateY(360deg)}}
.battle-bar-l{transition:width .8s cubic-bezier(.34,1.56,.64,1)}
.battle-bar-r{transition:width .8s cubic-bezier(.34,1.56,.64,1)}
.zego-container{width:100%;height:420px;border-radius:12px;overflow:hidden;background:#000;position:relative;border:1px solid #8B0000}
.oct-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px}
.oct-tile{aspect-ratio:1;position:relative;clip-path:polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%);background:#161616;overflow:hidden;cursor:pointer;transition:transform .2s}
.oct-tile:hover{transform:scale(1.05)}
.oct-tile.active{outline:2px solid #C8FF00}
.snd-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 6px;border-radius:10px;border:1px solid #222;background:#161616;cursor:pointer;transition:all .15s;gap:4px}
.snd-btn:active{transform:scale(.94);background:#1a1a1a}
.snd-btn.playing{border-color:#C8FF00;background:rgba(200,255,0,.08)}
.lb-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:#161616;border:1px solid #1a1a1a;margin-bottom:6px}
.guest-row{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#161616;border-radius:8px;margin-bottom:6px;border:1px solid #1a1a1a}
.notif-item{padding:10px 12px;border-left:3px solid;border-radius:0 8px 8px 0;background:#161616;margin-bottom:6px}
.vod-card{background:#161616;border-radius:10px;overflow:hidden;border:1px solid #1a1a1a;cursor:pointer}
.vod-thumb{height:90px;background:linear-gradient(135deg,#1a0000,#0a0a1a);display:flex;align-items:center;justify-content:center;font-size:32px;position:relative}
.rtmp-dest{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#161616;border-radius:8px;margin-bottom:6px;border:1px solid #1a1a1a}
.watch-tile{border-radius:10px;overflow:hidden;border:1px solid #1a1a1a;background:#161616;cursor:pointer}
`;

// ── ZEGOCLOUD LIVE ROOM ──────────────────────────────────────────
function ZEGOLiveRoom({ roomID, userID, userName, role, appID, serverSecret, onLeave }) {
  var containerRef = useRef(null);
  var [status, setStatus] = useState("loading");
  var [simMode, setSimMode] = useState(false);

  useEffect(function() {
    if (!appID || !serverSecret) { setSimMode(true); setStatus("sim"); return; }
    function initZEGO() {
      try {
        var Z = window.ZegoUIKitPrebuilt;
        if (!Z) { setSimMode(true); setStatus("sim"); return; }
        var token = Z.generateKitTokenForTest(appID, serverSecret, roomID, userID, userName);
        var zp = Z.create(token);
        var roleVal = role === "host" ? Z.Host : role === "cohost" ? Z.Cohost : Z.Audience;
        zp.joinRoom({
          container: containerRef.current,
          scenario: { mode: Z.LiveStreaming, config: { role: roleVal } },
          showPreJoinView: false,
          onLeaveRoom: onLeave,
        });
        setStatus("live");
      } catch(e) { setSimMode(true); setStatus("sim"); }
    }
    if (window.ZegoUIKitPrebuilt) { initZEGO(); return; }
    var s = document.createElement("script");
    s.src = "https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js";
    s.onload = initZEGO;
    s.onerror = function() { setSimMode(true); setStatus("sim"); };
    document.head.appendChild(s);
    return function() {};
  }, [roomID, userID, userName, role, appID, serverSecret]);

  if (simMode) return (
    <div className="zego-container" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
      <div style={{fontSize:36}}>📡</div>
      <div style={{fontFamily:G.fOrb,fontSize:13,color:G.gold,letterSpacing:2}}>ZEGOCLOUD UIKit</div>
      <div style={{fontFamily:G.fMon,fontSize:11,color:G.gray,textAlign:"center",padding:"0 24px"}}>Enter App ID + Server Secret in Stream Settings to go live</div>
      <div style={{marginTop:8,fontFamily:G.fMon,fontSize:10,color:G.grayDim}}>Role: {role.toUpperCase()} · Room: {roomID}</div>
    </div>
  );

  return (
    <div className="zego-container">
      <div ref={containerRef} style={{width:"100%",height:"100%"}} />
    </div>
  );
}

// ── OCTAGONAL VIDEO GRID ─────────────────────────────────────────
function OctagonalVideoGrid({ guests, hostName }) {
  var [activeIdx, setActiveIdx] = useState(0);
  var [layout, setLayout] = useState("oct");
  var allParticipants = [{ name: hostName || "Host", role: "HOST", active: true }].concat((guests || []).slice(0, 7).map(function(g) { return { name: g.name, role: "GUEST", active: g.live }; }));
  var tileColors = [G.crimsonBright, G.gold, G.cyan, G.volt, G.purple, G.orange, G.green, G.white];

  return (
    <div className="card card-v" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>⬡</span>
          <span style={{fontFamily:G.fOrb,fontSize:10,color:G.volt,letterSpacing:2}}>OCTAGONAL GRID</span>
          <span className="pill pill-v">{allParticipants.length} LIVE</span>
        </div>
      </div>
      <div className="oct-grid">
        {allParticipants.map(function(p, i) {
          return (
            <div key={i} className={"oct-tile"+(i===activeIdx?" active":"")} onClick={function(){setActiveIdx(i);}} style={{background:"linear-gradient(135deg,"+(tileColors[i]||G.gray)+"22,#000)"}}>
              <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                <span style={{fontSize:22}}>{p.name[0]}</span>
                <span style={{fontFamily:G.fMon,fontSize:7,color:tileColors[i]||G.gray}}>{p.name.split(" ")[0]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SOUNDBOARD ───────────────────────────────────────────────────
function Soundboard() {
  var [vol, setVol] = useState(80);
  var sounds = [
    { id:"airhorn", label:"Air Horn", emoji:"📯" },
    { id:"hype", label:"Hype!", emoji:"🔥" },
    { id:"cash", label:"Cha-ching", emoji:"💰" },
  ];

  return (
    <div className="card card-v" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.volt,letterSpacing:2}}>🎛️ SOUNDBOARD</span>
      </div>
      <div style={{padding:10,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {sounds.map(function(snd) {
          return (
            <button key={snd.id} className="snd-btn">
              <span style={{fontSize:24}}>{snd.emoji}</span>
              <span style={{fontFamily:G.fMon,fontSize:9,color:G.gray}}>{snd.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── SCREEN SHARE ─────────────────────────────────────────────────
function ScreenShare() {
  var [sharing, setSharing] = useState(false);
  return (
    <div className="card card-c" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.cyan,letterSpacing:2}}>🖥️ SCREEN SHARE</span>
        <button className={sharing ? "btn btn-r" : "btn btn-outline"} style={{marginTop:10,fontSize:11,width:"100%"}} onClick={function(){setSharing(!sharing);}}>
          {sharing ? "STOP SHARE" : "SHARE SCREEN"}
        </button>
      </div>
    </div>
  );
}

// ── MULTI-STREAM RTMP ────────────────────────────────────────────
function MultiStreamRTMP({ roomID }) {
  var [dests, setDests] = useState([
    { id:"yt", name:"YouTube", active:false },
    { id:"tt", name:"TikTok Live", active:false },
  ]);

  return (
    <div className="card card-c" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.cyan,letterSpacing:2}}>📡 MULTI-STREAM RTMP</span>
      </div>
      <div style={{padding:"10px 14px"}}>
        {dests.map(function(d) {
          return (
            <div key={d.id} className="rtmp-dest">
              <span>{d.name}</span>
              <button onClick={function(){setDests(function(x){return x.map(function(y){return y.id===d.id?Object.assign({},y,{active:!y.active}):y;});});}} style={{padding:"3px 8px",border:"1px solid "+G.grayDim,borderRadius:4}}>
                {d.active?"ON":"OFF"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── NOTIFICATIONS HUB ────────────────────────────────────────────
function NotificationsHub({ onClose }) {
  var notifs = [
    { id:1, type:"tip", msg:"User sent 💎 50 gems", time:"2m ago", color:G.gold },
    { id:2, type:"sub", msg:"New subscriber!", time:"5m ago", color:G.cyan },
  ];

  return (
    <div className="card card-g" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.gold,letterSpacing:2}}>🔔 NOTIFICATIONS</span>
      </div>
      <div style={{padding:"10px 14px",maxHeight:200,overflowY:"auto"}}>
        {notifs.map(function(n) {
          return (
            <div key={n.id} className="notif-item" style={{borderLeftColor:n.color}}>
              <div style={{fontFamily:G.fRaj,fontSize:13,color:G.white}}>{n.msg}</div>
              <div style={{fontFamily:G.fMon,fontSize:9,color:G.grayDim}}>{n.time}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── GUEST CONTROLS ───────────────────────────────────────────────
function GuestControls() {
  var [guests, setGuests] = useState([
    { id:1, name:"Guest1", role:"Co-Host", live:true },
    { id:2, name:"Guest2", role:"Guest", live:false },
  ]);

  return (
    <div className="card card-r" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.crimsonBright,letterSpacing:2}}>🎙️ GUEST CONTROLS</span>
      </div>
      <div style={{padding:"10px 14px"}}>
        {guests.map(function(g) {
          return (
            <div key={g.id} className="guest-row">
              <div style={{flex:1}}>{g.name}</div>
              <span style={{fontFamily:G.fMon,fontSize:9,color:G.gray}}>{g.role}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── VOD LIBRARY ──────────────────────────────────────────────────
function VODLibrary() {
  var vods = [
    { id:1, title:"Stream 1", duration:"1h 18m", views:892 },
    { id:2, title:"Stream 2", duration:"54m", views:641 },
  ];

  return (
    <div className="card card-p" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.purple,letterSpacing:2}}>📼 VOD LIBRARY</span>
      </div>
      <div style={{padding:"10px 14px"}}>
        {vods.map(function(v) {
          return (
            <div key={v.id} className="vod-card" style={{marginBottom:8}}>
              <div className="vod-thumb">{v.title}</div>
              <div style={{padding:"8px 10px"}}>
                <div style={{fontFamily:G.fRaj,fontSize:11}}>{v.title}</div>
                <div style={{fontFamily:G.fMon,fontSize:8,color:G.gray}}>{v.duration} • {v.views} views</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── LEADERBOARD ──────────────────────────────────────────────────
function Leaderboard() {
  var data = [
    { rank:1, name:"User1", val:340, badge:"👑" },
    { rank:2, name:"User2", val:210, badge:"🥈" },
  ];

  return (
    <div className="card card-g" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.gold,letterSpacing:2}}>🏆 LEADERBOARD</span>
      </div>
      <div style={{padding:"10px 14px"}}>
        {data.map(function(item) {
          return (
            <div key={item.rank} className="lb-row">
              <div style={{fontFamily:G.fBeb,fontSize:18}}>{item.rank}</div>
              <span>{item.badge}</span>
              <div style={{flex:1}}>{item.name}</div>
              <div style={{color:G.gold}}>{item.val}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SWANYBOT MEMORY ──────────────────────────────────────────────
function SwanyBotMemory() {
  var [mem, setMem] = useState({ persona:"SwanyBot AI", rules:["Rule 1","Rule 2"], autoGreet:true });

  return (
    <div className="card card-p" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.purple,letterSpacing:2}}>🤖 SWANYBOT MEMORY</span>
      </div>
      <div style={{padding:"10px 14px"}}><textarea placeholder="AI Persona..." style={{width:"100%",height:70}} /></div>
    </div>
  );
}

// ── CUSTOM BACKGROUND ────────────────────────────────────────────
function CustomBackground() {
  return (
    <div className="card" style={{margin:"0 16px 14px",border:"1px solid #333"}}>
      <div style={{padding:"10px 14px"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.white,letterSpacing:2}}>🎨 CUSTOM BACKGROUND</span>
        <button className="btn btn-g" style={{marginTop:10,width:"100%"}}>APPLY THEME</button>
      </div>
    </div>
  );
}

// ── WATCH PARTY ──────────────────────────────────────────────────
function WatchParty() {
  return (
    <div className="card card-c" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.cyan,letterSpacing:2}}>👁️ WATCH PARTY</span>
      </div>
    </div>
  );
}

// ── STREAM ANALYTICS ─────────────────────────────────────────────
function StreamAnalytics() {
  return (
    <div className="card card-v" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.volt,letterSpacing:2}}>📊 ANALYTICS</span>
      </div>
    </div>
  );
}

// ── PK BATTLE ENGINE ─────────────────────────────────────────────
var PK_DURATION = 60; // seconds per round
var PK_GIFTS = [
  { id:"rose",   emoji:"🌹", gems:1,   label:"Rose" },
  { id:"heart",  emoji:"❤️",  gems:5,   label:"Heart" },
  { id:"bomb",   emoji:"💣",  gems:10,  label:"Bomb" },
  { id:"crown",  emoji:"👑",  gems:50,  label:"Crown" },
  { id:"rocket", emoji:"🚀",  gems:100, label:"Rocket" },
  { id:"diamond",emoji:"💎",  gems:500, label:"Diamond" },
];

function PKBattleEngine({ myName, onEnd }) {
  // battle state
  var [phase, setPhase] = useState("idle"); // idle | challenge | active | ended
  var [opponentName, setOpponentName] = useState("");
  var [challengeInput, setChallengeInput] = useState("");
  var [timeLeft, setTimeLeft] = useState(PK_DURATION);
  var [scores, setScores] = useState({ me: 0, them: 0 });
  var [events, setEvents] = useState([]);
  var [winner, setWinner] = useState(null);
  var timerRef = useRef(null);
  var eventListRef = useRef(null);

  // computed percentages
  var total = scores.me + scores.them;
  var pctMe = total === 0 ? 50 : Math.round((scores.me / total) * 100);
  var pctThem = 100 - pctMe;
  var meWinning = pctMe > pctThem;

  // simulate opponent gifts during active battle
  useEffect(function() {
    if (phase !== "active") return;
    var interval = setInterval(function() {
      var gift = PK_GIFTS[Math.floor(Math.random() * (PK_GIFTS.length - 2))];
      addEvent("them", gift);
    }, Math.random() * 4000 + 2000);
    return function() { clearInterval(interval); };
  }, [phase]);

  // countdown timer
  useEffect(function() {
    if (phase !== "active") return;
    timerRef.current = setInterval(function() {
      setTimeLeft(function(t) {
        if (t <= 1) {
          clearInterval(timerRef.current);
          endBattle();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return function() { clearInterval(timerRef.current); };
  }, [phase]);

  // auto-scroll events
  useEffect(function() {
    if (eventListRef.current) {
      eventListRef.current.scrollTop = eventListRef.current.scrollHeight;
    }
  }, [events]);

  function addEvent(side, gift) {
    var gemVal = gift.gems;
    setScores(function(s) {
      return side === "me"
        ? { me: s.me + gemVal, them: s.them }
        : { me: s.me, them: s.them + gemVal };
    });
    setEvents(function(ev) {
      return ev.concat([{
        id: Date.now() + Math.random(),
        side: side,
        name: side === "me" ? (myName || "You") : (opponentName || "Opponent"),
        gift: gift,
        ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }]).slice(-30);
    });
  }

  function startChallenge() {
    if (!challengeInput.trim()) return;
    setOpponentName(challengeInput.trim());
    setPhase("challenge");
  }

  function acceptBattle() {
    setPhase("active");
    setTimeLeft(PK_DURATION);
    setScores({ me: 0, them: 0 });
    setEvents([]);
    setWinner(null);
  }

  function endBattle() {
    setPhase("ended");
    setScores(function(s) {
      setWinner(s.me >= s.them ? (myName || "You") : opponentName);
      return s;
    });
    clearInterval(timerRef.current);
  }

  function resetBattle() {
    setPhase("idle");
    setOpponentName("");
    setChallengeInput("");
    setScores({ me: 0, them: 0 });
    setEvents([]);
    setWinner(null);
    setTimeLeft(PK_DURATION);
  }

  // ── IDLE: send challenge ──────────────────────────────────────
  if (phase === "idle") return (
    <div className="card card-r" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #8B0000",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>⚔️</span>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.crimsonBright,letterSpacing:2}}>PK BATTLE</span>
      </div>
      <div style={{padding:"14px 16px"}}>
        <div style={{fontFamily:G.fMon,fontSize:11,color:G.gray,marginBottom:10}}>Challenge another live streamer to a gift battle</div>
        <input className="inp" placeholder="Enter opponent username…" value={challengeInput} onChange={function(e){setChallengeInput(e.target.value);}} style={{marginBottom:10}} />
        <button className="btn btn-r" style={{width:"100%"}} onClick={startChallenge}>⚔️ SEND CHALLENGE</button>
      </div>
    </div>
  );

  // ── CHALLENGE: waiting for accept ────────────────────────────
  if (phase === "challenge") return (
    <div className="card card-r" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #8B0000"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.crimsonBright,letterSpacing:2}}>⚔️ PK BATTLE — PENDING</span>
      </div>
      <div style={{padding:"14px 16px",textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:8}}>⏳</div>
        <div style={{fontFamily:G.fRaj,fontSize:14,color:G.white,marginBottom:4}}>Challenge sent to <span style={{color:G.gold}}>{opponentName}</span></div>
        <div style={{fontFamily:G.fMon,fontSize:10,color:G.gray,marginBottom:16}}>Waiting for them to accept…</div>
        {/* Simulate accept for demo */}
        <button className="btn btn-g" style={{width:"100%",marginBottom:8}} onClick={acceptBattle}>✅ SIMULATE ACCEPT</button>
        <button className="btn btn-outline" style={{width:"100%",fontSize:11}} onClick={resetBattle}>Cancel</button>
      </div>
    </div>
  );

  // ── ENDED: show winner ────────────────────────────────────────
  if (phase === "ended") return (
    <div className="card card-r" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #8B0000"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.crimsonBright,letterSpacing:2}}>⚔️ BATTLE ENDED</span>
      </div>
      <div style={{padding:"20px 16px",textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:8}}>🏆</div>
        <div style={{fontFamily:G.fBeb,fontSize:28,color:G.gold,marginBottom:4}}>{winner} WINS!</div>
        <div style={{fontFamily:G.fMon,fontSize:11,color:G.gray,marginBottom:16}}>
          {myName||"You"}: 💎 {scores.me} &nbsp;|&nbsp; {opponentName}: 💎 {scores.them}
        </div>
        {/* final bar */}
        <div style={{position:"relative",height:28,borderRadius:14,overflow:"hidden",background:"#1a1a1a",marginBottom:16,display:"flex"}}>
          <div style={{width:pctMe+"%",background:"linear-gradient(90deg,#8B0000,#C41E3A)",transition:"width 1s ease",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontFamily:G.fMon,fontSize:10,color:G.white}}>{pctMe}%</span>
          </div>
          <div style={{flex:1,background:"linear-gradient(90deg,#1a3a5c,#00E5FF33)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontFamily:G.fMon,fontSize:10,color:G.cyan}}>{pctThem}%</span>
          </div>
          <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",fontSize:14,zIndex:2}}>⚔️</div>
        </div>
        <button className="btn btn-g" style={{width:"100%"}} onClick={resetBattle}>🔄 NEW BATTLE</button>
      </div>
    </div>
  );

  // ── ACTIVE: live battle UI ────────────────────────────────────
  return (
    <div className="card card-r" style={{margin:"0 16px 14px"}}>
      {/* Header + timer */}
      <div style={{padding:"10px 14px",borderBottom:"1px solid #8B0000",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.crimsonBright,letterSpacing:2}}>⚔️ PK BATTLE LIVE</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontFamily:G.fMon,fontSize:13,color:timeLeft <= 10 ? G.red : G.gold}} className={timeLeft <= 10 ? "pulse" : ""}>
            {fmtTime(timeLeft)}
          </div>
          <button onClick={endBattle} style={{fontFamily:G.fMon,fontSize:9,color:G.gray,background:"none",border:"1px solid #333",borderRadius:4,padding:"2px 6px",cursor:"pointer"}}>END</button>
        </div>
      </div>

      {/* Split-screen streamer names */}
      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",padding:"10px 14px",gap:8}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:G.fBeb,fontSize:18,color:G.crimsonBright}}>{myName || "You"}</div>
          <div style={{fontFamily:G.fMon,fontSize:11,color:G.gold}}>💎 {scores.me}</div>
        </div>
        <div style={{fontFamily:G.fBeb,fontSize:22,color:G.white}}>VS</div>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:G.fBeb,fontSize:18,color:G.cyan}}>{opponentName}</div>
          <div style={{fontFamily:G.fMon,fontSize:11,color:G.cyan}}>💎 {scores.them}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{margin:"0 14px 12px",position:"relative",height:32,borderRadius:16,overflow:"hidden",background:"#1a1a1a",display:"flex",boxShadow:"0 0 12px rgba(196,30,58,0.3)"}}>
        <div className="battle-bar-l" style={{width:pctMe+"%",background:"linear-gradient(90deg,#8B0000,#C41E3A)",display:"flex",alignItems:"center",paddingLeft:8,minWidth:0}}>
          <span style={{fontFamily:G.fMon,fontSize:10,color:G.white,whiteSpace:"nowrap"}}>{pctMe}%</span>
        </div>
        <div className="battle-bar-r" style={{flex:1,background:"linear-gradient(90deg,#00445555,#00E5FF44)",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:8,minWidth:0}}>
          <span style={{fontFamily:G.fMon,fontSize:10,color:G.cyan,whiteSpace:"nowrap"}}>{pctThem}%</span>
        </div>
        <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",fontSize:16,zIndex:2,filter:"drop-shadow(0 0 6px #fff)"}}>⚔️</div>
      </div>

      {/* Who's winning banner */}
      <div style={{textAlign:"center",marginBottom:10}}>
        <span className="pill" style={{background:meWinning?"rgba(139,0,0,0.3)":"rgba(0,229,255,0.1)",border:"1px solid "+(meWinning?G.crimsonBright:G.cyan),color:meWinning?G.crimsonBright:G.cyan,fontFamily:G.fOrb,fontSize:9,letterSpacing:2}}>
          {meWinning ? "🔴 "+( myName||"YOU")+" LEADING" : "🔵 "+opponentName+" LEADING"}
        </span>
      </div>

      {/* Gift buttons */}
      <div style={{padding:"0 14px 10px"}}>
        <div style={{fontFamily:G.fMon,fontSize:9,color:G.grayDim,marginBottom:6,letterSpacing:1}}>SEND GIFT TO SUPPORT YOUR STREAM</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
          {PK_GIFTS.map(function(gift) {
            return (
              <button key={gift.id} className="snd-btn" onClick={function(){addEvent("me",gift);}}
                style={{padding:"8px 4px"}}>
                <span style={{fontSize:20}}>{gift.emoji}</span>
                <span style={{fontFamily:G.fMon,fontSize:8,color:G.gold}}>💎{gift.gems}</span>
                <span style={{fontFamily:G.fRaj,fontSize:9,color:G.gray}}>{gift.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live event feed */}
      <div style={{margin:"0 14px 14px",borderTop:"1px solid #1a1a1a",paddingTop:8}}>
        <div style={{fontFamily:G.fMon,fontSize:9,color:G.grayDim,marginBottom:6,letterSpacing:1}}>LIVE GIFT FEED</div>
        <div ref={eventListRef} style={{maxHeight:120,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
          {events.length === 0 && <div style={{fontFamily:G.fMon,fontSize:10,color:G.grayDim,textAlign:"center",padding:"8px 0"}}>Waiting for gifts…</div>}
          {events.map(function(ev) {
            var isMe = ev.side === "me";
            return (
              <div key={ev.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 6px",borderRadius:6,background:isMe?"rgba(139,0,0,0.15)":"rgba(0,229,255,0.07)",borderLeft:"2px solid "+(isMe?G.crimsonBright:G.cyan)}}>
                <span style={{fontSize:14}}>{ev.gift.emoji}</span>
                <span style={{fontFamily:G.fRaj,fontSize:11,color:isMe?G.crimsonBright:G.cyan,flex:1}}>{ev.name}</span>
                <span style={{fontFamily:G.fMon,fontSize:9,color:G.gold}}>+💎{ev.gift.gems}</span>
                <span style={{fontFamily:G.fMon,fontSize:8,color:G.grayDim}}>{ev.ts}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── LIVE CHAT ────────────────────────────────────────────────────
function LiveChat() {
  var [msgs, setMsgs] = useState([{id:1,user:"User1",text:"Hello!"}]);
  var [input, setInput] = useState("");

  return (
    <div className="card" style={{margin:"0 16px 14px",border:"1px solid #1a1a1a"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a"}}>
        <span style={{fontFamily:G.fOrb,fontSize:9,color:G.white,letterSpacing:2}}>💬 UNIVERSAL CHAT</span>
      </div>
      <div style={{height:150,overflowY:"auto",padding:"8px"}}>
        {msgs.map(function(m) {
          return (
            <div key={m.id} style={{marginBottom:6}}>
              <span style={{color:G.gold}}>{m.user}:</span> {m.text}
            </div>
          );
        })}
      </div>
      <div style={{padding:"10px 14px",borderTop:"1px solid #1a1a1a",display:"flex",gap:8}}>
        <input className="inp" style={{flex:1}} placeholder="Message..." value={input} onChange={function(e){setInput(e.target.value);}} />
        <button className="btn btn-r" style={{padding:"8px 14px"}} onClick={function(){setMsgs(function(m){return m.concat([{id:Date.now(),user:"You",text:input}]);});setInput("");}}>SEND</button>
      </div>
    </div>
  );
}

// ── COVER PAGE ───────────────────────────────────────────────────
function CoverPage({ onEnter }) {
  return (
    <div style={{minHeight:"100vh",background:G.black,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center"}}>
      <div style={{fontFamily:G.fBeb,fontSize:54,background:"linear-gradient(135deg,#C41E3A,#D4AF37)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:32}}>SeeWhy LIVE v17.0</div>
      <button className="btn btn-g" style={{fontSize:18,padding:"14px 40px"}} onClick={onEnter}>ENTER PLATFORM →</button>
    </div>
  );
}

// ── HOME TAB ─────────────────────────────────────────────────────
function HomeTab({ onJoinRoom }) {
  return (
    <div style={{padding:"16px"}}>
      <div style={{fontFamily:G.fBeb,fontSize:32,color:G.white}}>LIVE NOW</div>
      <button className="btn btn-g" style={{marginTop:16,width:"100%"}} onClick={function(){onJoinRoom({});}}>JOIN STREAM</button>
    </div>
  );
}

// ── STREAM TAB ───────────────────────────────────────────────────
function StreamTab() {
  var [joined, setJoined] = useState(false);

  return (
    <div>
      {!joined ? (
        <div style={{padding:"16px"}}>
          <button className="btn btn-g" style={{width:"100%",fontSize:14}} onClick={function(){setJoined(true);}}>🔴 GO LIVE</button>
        </div>
      ) : (
        <div>
          <ZEGOLiveRoom roomID="test" userID="user1" userName="Host" role="host" appID={0} serverSecret="" onLeave={function(){setJoined(false);}} />
          <Soundboard />
          <OctagonalVideoGrid guests={[]} hostName="Host" />
          <ScreenShare />
          <GuestControls />
          <PKBattleEngine myName="Host" />
          <MultiStreamRTMP roomID="test" />
          <StreamAnalytics />
          <LiveChat />
          <button className="btn btn-r" style={{margin:"16px",width:"calc(100% - 32px)"}} onClick={function(){setJoined(false);}}>END STREAM</button>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD TAB ────────────────────────────────────────────────
function DashboardTab() {
  return (
    <div style={{padding:"16px"}}>
      <div style={{fontFamily:G.fBeb,fontSize:28,color:G.gold}}>$1,247.80</div>
      <div style={{fontFamily:G.fMon,fontSize:10,color:G.gray}}>Total earnings (90% split)</div>
      <StreamAnalytics />
      <Leaderboard />
      <VODLibrary />
      <SwanyBotMemory />
      <CustomBackground />
    </div>
  );
}

// ── COMMUNITY TAB ────────────────────────────────────────────────
function CommunityTab() {
  return (
    <div style={{padding:"16px"}}>
      <div style={{fontFamily:G.fOrb,fontSize:16,color:G.gold,letterSpacing:3}}>COMMUNITY</div>
      <div style={{color:G.gray,marginTop:20}}>Coming in v17.1</div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────
export default function SeeWhyLIVEv17() {
  var [tab, setTab] = useState("home");
  var [entered, setEntered] = useState(false);

  useEffect(function(){
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
  }, []);

  if (!entered) {
    return <CoverPage onEnter={function(){setEntered(true);}} />;
  }

  return (
    <div className="sw-root">
      {/* Header */}
      <div className="sw-hdr">
        <div className="sw-logo">SeeWhy LIVE v17.0</div>
        <div style={{display:"flex",gap:6}}>
          <NotificationsHub onClose={function(){}} />
          <div style={{color:G.gray,fontFamily:G.fMon,fontSize:10}}>●●●</div>
        </div>
      </div>

      {/* Body */}
      <div className="sw-body">
        {tab === "home" && <HomeTab onJoinRoom={function(room){setTab("stream");}} />}
        {tab === "stream" && <StreamTab />}
        {tab === "dashboard" && <DashboardTab />}
        {tab === "community" && <CommunityTab />}
        {tab === "discover" && (
          <div style={{padding:"16px"}}>
            <div style={{fontFamily:G.fOrb,fontSize:18,color:G.gold,letterSpacing:3}}>DISCOVER</div>
            <div style={{textAlign:"center",marginTop:40,color:G.gray}}>Trending rooms, communities, and creators coming in v17.1</div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="sw-nav">
        {[
          {id:"home",ico:"🏠",lbl:"Home"},
          {id:"stream",ico:"📡",lbl:"Live"},
          {id:"dashboard",ico:"📊",lbl:"Dashboard"},
          {id:"community",ico:"👥",lbl:"Community"},
          {id:"discover",ico:"🔍",lbl:"Discover"},
        ].map(function(item){
          var active = tab === item.id;
          return (
            <button key={item.id} className={"nav-btn"+(active?" on":"")} onClick={function(){setTab(item.id);}}
              style={{cursor:"pointer"}}>
              <span className="nav-ico">{item.ico}</span>
              <span>{item.lbl}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}