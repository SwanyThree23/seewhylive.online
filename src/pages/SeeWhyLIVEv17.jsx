import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { GiftTray, GiftAnimationOverlay, GiftLeaderboard, TipAlertOverlay } from "@/components/live/GiftSystem";
import ViewerControlsPanel from "@/components/live/ViewerControlsPanel";
import ZEGOSettingsDrawer, { StreamHealthHUD } from "@/components/live/ZEGOSettingsDrawer";
import TipNowModal, { SubscribeButton } from "@/components/live/TipNowModal";
import { MerchStrip } from "@/components/merch/MerchWidget";
import { WhisperToast } from "@/components/live/DMWhisperPanel";
import { Link } from "react-router-dom";
import AuraPanelDrawer from "@/components/live/AuraPanelDrawer";
import SwanDirectorPanel, { SwanDirectorHUD } from "@/components/live/SwanDirectorPanel";
import ClipCreatorSheet from "@/components/live/ClipCreatorSheet";

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
/* ── Panel Grid ── */
.panel-grid-5{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;padding:6px}
.panel-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;padding:6px}
.panel-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:6px}
.panel-tile{aspect-ratio:9/14;position:relative;border-radius:8px;overflow:hidden;cursor:pointer;transition:transform .15s,box-shadow .15s;background:#161616;border:1px solid #1a1a1a}
.panel-tile:hover{transform:scale(1.04)}
.panel-tile.focused{border:2px solid #C8FF00;box-shadow:0 0 12px #C8FF0066;z-index:2}
.panel-tile.speaking{border:2px solid #00E5FF;box-shadow:0 0 8px #00E5FF55}
.panel-tile.muted{opacity:.7}
.pt-avatar{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;position:relative}
.pt-name{position:absolute;bottom:4px;left:0;right:0;text-align:center;font-family:'Share Tech Mono',monospace;font-size:7px;color:#fff;letter-spacing:.5px;text-shadow:0 1px 3px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 3px}
.pt-role{position:absolute;top:3px;left:3px;font-size:7px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.5px;padding:1px 4px;border-radius:3px}
.pt-mic{position:absolute;top:3px;right:3px;font-size:10px;line-height:1}
.pt-reaction{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);font-size:16px;animation:floatUp 1.5s ease-out forwards}
@keyframes floatUp{0%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-30px)}}
/* ── Bigo Expanded Tile ── */
.bigo-expanded{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.95);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}
.bigo-main-oct{width:200px;height:200px;clip-path:polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%);background:#161616;overflow:hidden;position:relative;border:3px solid #C8FF00;box-shadow:0 0 30px #C8FF0066}
.bigo-mini-ring{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:14px;max-width:340px}
.bigo-mini-oct{width:60px;height:60px;clip-path:polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%);background:#161616;overflow:hidden;position:relative;border:2px solid #333;cursor:pointer;transition:border-color .2s}
.bigo-mini-oct.on{border-color:#C8FF00}
.bigo-mini-oct:hover{border-color:#D4AF37}
/* old grid kept for compat */
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
@keyframes giftFloat{0%{opacity:1;transform:translateY(0) scale(1)}60%{opacity:1;transform:translateY(-120px) scale(1.2)}100%{opacity:0;transform:translateY(-200px) scale(0.8)}}
.tip-alert{position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:9990;min-width:220px;max-width:320px;padding:12px 18px;border-radius:12px;display:flex;align-items:center;gap:10;border:1px solid;animation:tipSlide .4s ease-out}
@keyframes tipSlide{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
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

// ── PANEL GRID + BIGO OCTAGONAL VIEW ─────────────────────────────
var TILE_COLORS = [G.crimsonBright,G.gold,G.cyan,G.volt,G.purple,G.orange,G.green,"#FF69B4","#FF8C00","#39FF14","#FF007F","#1E90FF","#FFD700","#FF4500","#00CED1","#9400D3","#ADFF2F","#DC143C","#00BFFF","#FF6347"];
var REACTION_EMOJIS = ["🔥","❤️","😂","👏","💯","🚀","💎","👑","😍","🤩"];
var DEMO_NAMES = ["Host","MixMaster","StarGirl","DrumKing","VibezQn","LitKid","GoldenFlo","CyphaBoss","SlickTalk","WaveRider","HypeLord","ReggaeQ","BeatDrop","SoulSis","TrapGod","NeonKing","PopDiva","JazzHnd","UrbanVibe","CloudTop"];

function PanelGrid({ participants, onTileClick, focusedIdx }) {
  var count = participants.length;
  var gridClass = count <= 6 ? "panel-grid-3" : count <= 12 ? "panel-grid-4" : "panel-grid-5";

  return (
    <div className={gridClass}>
      {participants.map(function(p, i) {
        var color = TILE_COLORS[i % TILE_COLORS.length];
        var isFocused = focusedIdx === i;
        var classes = "panel-tile" + (isFocused ? " focused" : "") + (p.speaking ? " speaking" : "") + (!p.micOn ? " muted" : "");
        return (
          <div key={p.id} className={classes} onClick={function(){onTileClick(i);}}
            style={{background:"linear-gradient(160deg,"+color+"18,#080808)"}}>
            <div className="pt-avatar">
              <span style={{fontSize: count<=6?28:count<=12?22:16}}>{p.avatar}</span>
              {p.reaction && <span className="pt-reaction">{p.reaction}</span>}
            </div>
            <div className="pt-role" style={{background:p.isHost?"rgba(196,30,58,0.7)":p.isCoHost?"rgba(212,175,55,0.5)":"rgba(0,0,0,0.4)",color:p.isHost?G.crimsonBright:p.isCoHost?G.gold:G.gray}}>
              {p.isHost?"HOST":p.isCoHost?"CO":""}
            </div>
            <div className="pt-mic">{p.micOn?"🎙️":"🔇"}</div>
            <div className="pt-name" style={{color:color}}>{p.name}</div>
          </div>
        );
      })}
    </div>
  );
}

function BigoExpandedView({ participants, focusedIdx, onChangeFocus, onClose }) {
  var main = participants[focusedIdx] || participants[0];
  var color = TILE_COLORS[focusedIdx % TILE_COLORS.length];
  return (
    <div className="bigo-expanded" onClick={onClose}>
      <div style={{textAlign:"center",marginBottom:12}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.volt,letterSpacing:3}}>⬡ BIGO LIVE VIEW</span>
        <span style={{fontFamily:G.fMon,fontSize:9,color:G.grayDim,marginLeft:10}}>tap outside to close</span>
      </div>
      {/* Main focus octagon */}
      <div style={{position:"relative"}} onClick={function(e){e.stopPropagation();}}>
        <div className="bigo-main-oct" style={{background:"linear-gradient(135deg,"+color+"33,#000)"}}>
          <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:56}}>{main ? main.avatar : "👤"}</span>
            <span style={{fontFamily:G.fBeb,fontSize:20,color:color}}>{main ? main.name : ""}</span>
            <span style={{fontFamily:G.fMon,fontSize:9,color:G.gray}}>{main&&main.isHost?"HOST ·":""} {main&&main.micOn?"🎙️ LIVE":"🔇 MUTED"}</span>
          </div>
        </div>
        {/* Speaking ring */}
        {main && main.speaking && <div style={{position:"absolute",inset:-6,borderRadius:"50%",border:"3px solid "+G.cyan,animation:"liveRing 1.2s ease-in-out infinite",pointerEvents:"none"}} />}
      </div>
      {/* Mini octagons */}
      <div className="bigo-mini-ring" onClick={function(e){e.stopPropagation();}}>
        {participants.map(function(p, i) {
          var c = TILE_COLORS[i % TILE_COLORS.length];
          return (
            <div key={p.id} className={"bigo-mini-oct"+(i===focusedIdx?" on":"")}
              style={{background:"linear-gradient(135deg,"+c+"22,#000)"}}
              onClick={function(){onChangeFocus(i);}}>
              <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:20}}>{p.avatar}</span>
                <span style={{fontFamily:G.fMon,fontSize:6,color:c}}>{p.name.split(" ")[0].slice(0,6)}</span>
              </div>
              {!p.micOn && <div style={{position:"absolute",top:2,right:2,fontSize:8}}>🔇</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OctagonalVideoGrid({ participants: propParticipants, hostName }) {
  // Build 20-person panel if no props given
  var defaultParticipants = DEMO_NAMES.slice(0, 20).map(function(name, i) {
    return {
      id: "p"+i, name: name,
      avatar: ["🎤","🎧","🎸","🥁","🎹","🎺","🎻","🪗","🎵","🎶","🎼","🎙️","🎚️","🎛️","📻","🔊","🎤","🥁","🎹","🎸"][i],
      isHost: i===0, isCoHost: i===1,
      micOn: Math.random()>0.3, speaking: Math.random()>0.7,
      reaction: null, color: TILE_COLORS[i],
    };
  });

  var [participants, setParticipants] = useState(propParticipants || defaultParticipants);
  var [focusedIdx, setFocusedIdx] = useState(0);
  var [bigoOpen, setBigoOpen] = useState(false);
  var [viewMode, setViewMode] = useState("panel"); // panel | bigo
  var [reactionQueue, setReactionQueue] = useState([]);
  var [chatMsg, setChatMsg] = useState("");
  var [chatLog, setChatLog] = useState([
    {id:1, from:"Host", text:"Welcome everyone!", color:G.crimsonBright},
    {id:2, from:"MixMaster", text:"LFG! 🔥", color:G.gold},
  ]);
  var chatRef = useRef(null);

  // Simulate speaking + reactions
  useEffect(function() {
    var interval = setInterval(function() {
      setParticipants(function(prev) {
        return prev.map(function(p) {
          return Object.assign({}, p, { speaking: Math.random() > 0.75 });
        });
      });
    }, 2000);
    return function(){clearInterval(interval);};
  }, []);

  // Simulate incoming reactions
  useEffect(function() {
    var interval = setInterval(function() {
      var randIdx = Math.floor(Math.random() * participants.length);
      var emoji = REACTION_EMOJIS[Math.floor(Math.random() * REACTION_EMOJIS.length)];
      setParticipants(function(prev) {
        return prev.map(function(p, i) {
          if (i !== randIdx) return p;
          return Object.assign({}, p, { reaction: emoji });
        });
      });
      setTimeout(function() {
        setParticipants(function(prev) {
          return prev.map(function(p, i) {
            if (i !== randIdx) return p;
            return Object.assign({}, p, { reaction: null });
          });
        });
      }, 1500);
    }, 2500);
    return function(){clearInterval(interval);};
  }, [participants.length]);

  // Simulate incoming chat
  useEffect(function() {
    var interval = setInterval(function() {
      var p = participants[Math.floor(Math.random() * participants.length)];
      var lines = ["Let's go!","🔥🔥🔥","Hype in the chat!","This is LIT","💎💎","Real talk","Bars!","No cap 🧢","W stream","Sending love ❤️"];
      var text = lines[Math.floor(Math.random() * lines.length)];
      setChatLog(function(log) {
        return log.concat([{id:Date.now(),from:p.name,text:text,color:TILE_COLORS[participants.indexOf(p)%TILE_COLORS.length]}]).slice(-40);
      });
    }, 1800);
    return function(){clearInterval(interval);};
  }, [participants]);

  useEffect(function(){
    if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatLog]);

  function toggleMic(idx) {
    setParticipants(function(prev){
      return prev.map(function(p,i){return i===idx?Object.assign({},p,{micOn:!p.micOn}):p;});
    });
  }

  function sendReaction(emoji) {
    setParticipants(function(prev){
      return prev.map(function(p,i){return i===0?Object.assign({},p,{reaction:emoji}):p;});
    });
    setTimeout(function(){
      setParticipants(function(prev){
        return prev.map(function(p,i){return i===0?Object.assign({},p,{reaction:null}):p;});
      });
    }, 1500);
  }

  function sendChat(e) {
    e && e.preventDefault();
    if(!chatMsg.trim()) return;
    setChatLog(function(log){return log.concat([{id:Date.now(),from:"You",text:chatMsg,color:G.volt}]).slice(-40);});
    setChatMsg("");
  }

  var liveCount = participants.filter(function(p){return p.speaking||p.micOn;}).length;

  return (
    <>
      {bigoOpen && (
        <BigoExpandedView
          participants={participants}
          focusedIdx={focusedIdx}
          onChangeFocus={setFocusedIdx}
          onClose={function(){setBigoOpen(false);}}
        />
      )}

      <div className="card card-v" style={{margin:"0 16px 14px"}}>
        {/* Header */}
        <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>⬡</span>
            <span style={{fontFamily:G.fOrb,fontSize:10,color:G.volt,letterSpacing:2}}>LIVE PANEL</span>
            <span className="pill pill-v">{participants.length} IN ROOM</span>
            <span className="pill pill-c">{liveCount} ACTIVE</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={function(){setBigoOpen(true);}} style={{padding:"3px 8px",background:"rgba(200,255,0,0.1)",border:"1px solid "+G.volt,borderRadius:5,cursor:"pointer",fontFamily:G.fMon,fontSize:9,color:G.volt}}>⬡ BIGO</button>
            <button onClick={function(){setViewMode(viewMode==="panel"?"mini":"panel");}} style={{padding:"3px 8px",background:"rgba(0,229,255,0.08)",border:"1px solid "+G.cyan,borderRadius:5,cursor:"pointer",fontFamily:G.fMon,fontSize:9,color:G.cyan}}>
              {viewMode==="panel"?"▦ MINI":"▤ FULL"}
            </button>
          </div>
        </div>

        {/* Panel Grid */}
        <PanelGrid
          participants={viewMode==="mini"?participants.slice(0,8):participants}
          onTileClick={function(i){setFocusedIdx(i);setBigoOpen(true);}}
          focusedIdx={focusedIdx}
        />

        {/* Focused participant info bar */}
        {participants[focusedIdx] && (
          <div style={{margin:"0 10px 8px",padding:"8px 12px",background:"rgba(200,255,0,0.05)",border:"1px solid rgba(200,255,0,0.15)",borderRadius:8,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>{participants[focusedIdx].avatar}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:G.fBeb,fontSize:16,color:G.volt}}>{participants[focusedIdx].name}</div>
              <div style={{fontFamily:G.fMon,fontSize:9,color:G.gray}}>
                {participants[focusedIdx].isHost?"👑 HOST · ":""}
                {participants[focusedIdx].isCoHost?"🥈 CO-HOST · ":""}
                {participants[focusedIdx].micOn?"🎙️ MIC ON":"🔇 MUTED"}
                {participants[focusedIdx].speaking?" · 🔊 SPEAKING":""}
              </div>
            </div>
            <button onClick={function(){toggleMic(focusedIdx);}} style={{padding:"4px 10px",background:participants[focusedIdx].micOn?"rgba(139,0,0,0.4)":"rgba(0,229,255,0.1)",border:"1px solid "+(participants[focusedIdx].micOn?G.crimsonBright:G.cyan),borderRadius:6,cursor:"pointer",fontFamily:G.fMon,fontSize:9,color:participants[focusedIdx].micOn?G.crimsonBright:G.cyan}}>
              {participants[focusedIdx].micOn?"MUTE":"UNMUTE"}
            </button>
          </div>
        )}

        {/* Reaction bar */}
        <div style={{padding:"6px 12px 8px",display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
          {REACTION_EMOJIS.map(function(e){
            return (
              <button key={e} onClick={function(){sendReaction(e);}} style={{width:32,height:32,borderRadius:8,border:"1px solid #222",background:"#161616",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"transform .1s"}}
                onMouseDown={function(el){el.currentTarget.style.transform="scale(0.85)"}}
                onMouseUp={function(el){el.currentTarget.style.transform="scale(1)"}}>
                {e}
              </button>
            );
          })}
        </div>

        {/* Inline chat */}
        <div style={{margin:"0 10px",borderTop:"1px solid #1a1a1a"}}>
          <div ref={chatRef} style={{height:90,overflowY:"auto",padding:"6px 4px",display:"flex",flexDirection:"column",gap:3}}>
            {chatLog.map(function(m){
              return (
                <div key={m.id} style={{fontFamily:G.fRaj,fontSize:11,lineHeight:1.3}}>
                  <span style={{color:m.color,fontWeight:700}}>{m.from}: </span>
                  <span style={{color:"rgba(255,255,255,0.75)"}}>{m.text}</span>
                </div>
              );
            })}
          </div>
          <form onSubmit={sendChat} style={{display:"flex",gap:6,padding:"6px 4px 10px"}}>
            <input className="inp" style={{flex:1,fontSize:11,padding:"6px 10px"}} placeholder="Say something to the room…" value={chatMsg} onChange={function(e){setChatMsg(e.target.value);}} />
            <button type="submit" className="btn btn-v" style={{padding:"6px 12px",fontSize:11}}>SEND</button>
          </form>
        </div>
      </div>
    </>
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

// ── DM / WHISPER SYSTEM ──────────────────────────────────────────
var DM_NAMES = ["MixMaster","StarGirl","DrumKing","VibezQn","LitKid","GoldenFlo","CyphaBoss","SlickTalk"];
function DMWhisper() {
  var [open, setOpen] = useState(false);
  var [selected, setSelected] = useState(DM_NAMES[0]);
  var [threads, setThreads] = useState({});
  var [input, setInput] = useState("");
  var [unread, setUnread] = useState({MixMaster:1, StarGirl:2});
  var msgRef = useRef(null);

  // simulate incoming DM
  useEffect(function(){
    var interval = setInterval(function(){
      var sender = DM_NAMES[Math.floor(Math.random()*DM_NAMES.length)];
      var lines = ["Yo let me hop in 🔥","Can you hear me?","Battle me rn ⚔️","W stream fr","Send me the link","Bro this is LIVE 💎","Let's collab!"];
      var text = lines[Math.floor(Math.random()*lines.length)];
      setThreads(function(t){
        var prev = t[sender]||[];
        return Object.assign({},t,{[sender]:prev.concat([{id:Date.now(),from:sender,text:text,ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}])});
      });
      setUnread(function(u){ return Object.assign({},u,{[sender]:(u[sender]||0)+1}); });
    }, 5000);
    return function(){clearInterval(interval);};
  },[]);

  useEffect(function(){
    if(msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
  },[threads, selected]);

  var totalUnread = Object.values(unread).reduce(function(a,b){return a+b;},0);
  var currentThread = threads[selected]||[];

  function send(e){ e&&e.preventDefault(); if(!input.trim()) return;
    setThreads(function(t){ var prev=t[selected]||[]; return Object.assign({},t,{[selected]:prev.concat([{id:Date.now(),from:"You",text:input,ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}])}); });
    setInput(""); }

  function selectUser(name){ setSelected(name); setUnread(function(u){ return Object.assign({},u,{[name]:0}); }); }

  return (
    <div className="card card-p" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={function(){setOpen(!open);}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>💬</span>
          <span style={{fontFamily:G.fOrb,fontSize:10,color:G.purple,letterSpacing:2}}>DM / WHISPER</span>
          {totalUnread>0 && <span style={{background:G.crimsonBright,color:"#fff",borderRadius:10,padding:"1px 6px",fontFamily:G.fMon,fontSize:9,fontWeight:700}}>{totalUnread}</span>}
        </div>
        <span style={{color:G.grayDim,fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div>
          {/* Contact list */}
          <div style={{display:"flex",overflowX:"auto",gap:6,padding:"8px 10px",borderBottom:"1px solid #1a1a1a"}}>
            {DM_NAMES.map(function(name){
              var u = unread[name]||0;
              var isActive = selected===name;
              return (
                <button key={name} onClick={function(){selectUser(name);}}
                  style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:8,border:"1px solid "+(isActive?G.purple:"#222"),background:isActive?"rgba(191,95,255,0.12)":"#161616",cursor:"pointer",position:"relative"}}>
                  <span style={{fontSize:18}}>🎤</span>
                  <span style={{fontFamily:G.fMon,fontSize:7,color:isActive?G.purple:G.gray}}>{name.slice(0,6)}</span>
                  {u>0&&<span style={{position:"absolute",top:1,right:1,background:G.crimsonBright,borderRadius:"50%",width:14,height:14,fontSize:8,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.fMon}}>{u}</span>}
                </button>
              );
            })}
          </div>
          {/* Thread */}
          <div ref={msgRef} style={{height:130,overflowY:"auto",padding:"8px 12px",display:"flex",flexDirection:"column",gap:4}}>
            {currentThread.length===0 && <div style={{color:G.grayDim,fontFamily:G.fMon,fontSize:10,textAlign:"center",marginTop:20}}>No messages yet. Say hi!</div>}
            {currentThread.map(function(m){
              var isMe = m.from==="You";
              return (
                <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"80%",padding:"6px 10px",borderRadius:10,background:isMe?"rgba(191,95,255,0.2)":"rgba(255,255,255,0.06)",border:"1px solid "+(isMe?"rgba(191,95,255,0.4)":"#222"),fontFamily:G.fRaj,fontSize:12,color:isMe?G.purple:G.white}}>
                    {m.text}
                  </div>
                  <span style={{fontFamily:G.fMon,fontSize:8,color:G.grayDim,marginTop:2}}>{m.ts}</span>
                </div>
              );
            })}
          </div>
          <form onSubmit={send} style={{display:"flex",gap:6,padding:"6px 10px 10px"}}>
            <input className="inp" style={{flex:1,fontSize:11,padding:"6px 10px"}} placeholder={"Whisper to "+selected+"…"} value={input} onChange={function(e){setInput(e.target.value);}} />
            <button type="submit" style={{padding:"6px 12px",background:"rgba(191,95,255,0.2)",border:"1px solid "+G.purple,borderRadius:6,cursor:"pointer",fontFamily:G.fMon,fontSize:10,color:G.purple}}>SEND</button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── GIFT ANIMATION OVERLAY ───────────────────────────────────────
var GIFT_CATALOG = [
  {id:"rose",emoji:"🌹",name:"Rose",gems:1,color:"#FF69B4"},
  {id:"heart",emoji:"❤️",name:"Heart",gems:5,color:"#FF4444"},
  {id:"bomb",emoji:"💣",name:"Bomb",gems:10,color:G.orange},
  {id:"crown",emoji:"👑",name:"Crown",gems:50,color:G.gold},
  {id:"rocket",emoji:"🚀",name:"Rocket",gems:100,color:G.cyan},
  {id:"unicorn",emoji:"🦄",name:"Unicorn",gems:200,color:G.purple},
  {id:"diamond",emoji:"💎",name:"Diamond",gems:500,color:"#00BFFF"},
  {id:"galaxy",emoji:"🌌",name:"Galaxy",gems:1000,color:G.volt},
];

function GiftAnimationLayer({ gifts }) {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:8888,overflow:"hidden"}}>
      {gifts.map(function(g){
        return (
          <div key={g.id} style={{position:"absolute",left:g.x+"%",bottom:"20%",animation:"giftFloat 2.5s ease-out forwards",textAlign:"center"}}>
            <div style={{fontSize:g.big?52:32,filter:"drop-shadow(0 0 12px "+g.color+")"}}>{g.emoji}</div>
            <div style={{fontFamily:G.fBeb,fontSize:g.big?16:11,color:g.color,textShadow:"0 0 8px "+g.color}}>{g.sender}</div>
            <div style={{fontFamily:G.fMon,fontSize:9,color:G.gold}}>💎{g.gems}</div>
          </div>
        );
      })}
    </div>
  );
}

function GiftShop({ onSend }) {
  var [open, setOpen] = useState(false);
  var [sending, setSending] = useState(null);

  function sendGift(gift){
    setSending(gift.id);
    onSend && onSend(gift);
    setTimeout(function(){setSending(null);},600);
  }

  return (
    <div className="card card-g" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={function(){setOpen(!open);}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>🎁</span>
          <span style={{fontFamily:G.fOrb,fontSize:10,color:G.gold,letterSpacing:2}}>GIFT SHOP</span>
          <span className="pill pill-g">ANIMATED</span>
        </div>
        <span style={{color:G.grayDim,fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{padding:"10px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {GIFT_CATALOG.map(function(g){
            var isSending = sending===g.id;
            return (
              <button key={g.id} onClick={function(){sendGift(g);}}
                style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 4px",borderRadius:10,border:"1px solid "+(isSending?g.color:"#222"),background:isSending?"rgba(255,255,255,0.08)":"#161616",cursor:"pointer",transition:"all .15s",transform:isSending?"scale(0.9)":"scale(1)"}}>
                <span style={{fontSize:isSending?28:22,transition:"font-size .15s"}}>{g.emoji}</span>
                <span style={{fontFamily:G.fMon,fontSize:7,color:g.color}}>{g.name}</span>
                <span style={{fontFamily:G.fMon,fontSize:8,color:G.gold}}>💎{g.gems}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── STREAM CONTROLS (CAM/AUDIO/HEALTH) ───────────────────────────
function StreamControls({ camOn, setCamOn, micOn, setMicOn, bitrate, fps, latency }) {
  var [quality, setQuality] = useState("720p");
  var [noiseCancel, setNoiseCancel] = useState(true);
  var [echo, setEcho] = useState(true);
  var healthColor = latency<200?G.green:latency<400?G.orange:G.red;

  return (
    <div className="card card-c" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.cyan,letterSpacing:2}}>🎛️ STREAM CONTROLS</span>
      </div>
      <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
        {/* Cam / Mic toggles */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={function(){setCamOn(!camOn);}}
            style={{padding:"10px",borderRadius:8,border:"1px solid "+(camOn?G.cyan:"#333"),background:camOn?"rgba(0,229,255,0.1)":"#161616",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:22}}>{camOn?"📷":"📵"}</span>
            <span style={{fontFamily:G.fMon,fontSize:9,color:camOn?G.cyan:G.grayDim}}>CAM {camOn?"ON":"OFF"}</span>
          </button>
          <button onClick={function(){setMicOn(!micOn);}}
            style={{padding:"10px",borderRadius:8,border:"1px solid "+(micOn?G.green:"#333"),background:micOn?"rgba(48,209,88,0.1)":"#161616",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:22}}>{micOn?"🎙️":"🔇"}</span>
            <span style={{fontFamily:G.fMon,fontSize:9,color:micOn?G.green:G.grayDim}}>MIC {micOn?"ON":"OFF"}</span>
          </button>
        </div>
        {/* Quality */}
        <div>
          <div style={{fontFamily:G.fMon,fontSize:9,color:G.grayDim,marginBottom:5,letterSpacing:1}}>VIDEO QUALITY</div>
          <div style={{display:"flex",gap:5}}>
            {["480p","720p","1080p","4K"].map(function(q){
              return (
                <button key={q} onClick={function(){setQuality(q);}}
                  style={{flex:1,padding:"5px 0",borderRadius:6,border:"1px solid "+(quality===q?G.cyan:"#333"),background:quality===q?"rgba(0,229,255,0.1)":"#161616",cursor:"pointer",fontFamily:G.fMon,fontSize:9,color:quality===q?G.cyan:G.grayDim}}>
                  {q}
                </button>
              );
            })}
          </div>
        </div>
        {/* Audio enhancements */}
        <div style={{display:"flex",gap:8}}>
          <button onClick={function(){setNoiseCancel(!noiseCancel);}}
            style={{flex:1,padding:"6px 4px",borderRadius:7,border:"1px solid "+(noiseCancel?G.green:"#333"),background:noiseCancel?"rgba(48,209,88,0.08)":"#161616",cursor:"pointer",fontFamily:G.fMon,fontSize:8,color:noiseCancel?G.green:G.grayDim}}>
            🎚️ NOISE CANCEL {noiseCancel?"ON":"OFF"}
          </button>
          <button onClick={function(){setEcho(!echo);}}
            style={{flex:1,padding:"6px 4px",borderRadius:7,border:"1px solid "+(echo?G.green:"#333"),background:echo?"rgba(48,209,88,0.08)":"#161616",cursor:"pointer",fontFamily:G.fMon,fontSize:8,color:echo?G.green:G.grayDim}}>
            🔊 ECHO CANCEL {echo?"ON":"OFF"}
          </button>
        </div>
        {/* Health metrics */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
          {[
            {label:"BITRATE",value:bitrate+"kbps",color:G.cyan},
            {label:"FPS",value:fps,color:G.volt},
            {label:"LATENCY",value:latency+"ms",color:healthColor},
          ].map(function(m){
            return (
              <div key={m.label} style={{padding:"8px 6px",background:"#0D0D0D",borderRadius:7,border:"1px solid #1a1a1a",textAlign:"center"}}>
                <div style={{fontFamily:G.fBeb,fontSize:16,color:m.color}}>{m.value}</div>
                <div style={{fontFamily:G.fMon,fontSize:7,color:G.grayDim,letterSpacing:1}}>{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── MONETIZATION WIDGET ──────────────────────────────────────────
var SUB_TIERS = [
  {id:"basic",label:"Fan",price:4.99,color:G.cyan,perks:["Badge","Emotes"]},
  {id:"pro",label:"Supporter",price:9.99,color:G.gold,perks:["All Fan perks","VIP Chat","PK Votes"]},
  {id:"vip",label:"VIP",price:24.99,color:G.purple,perks:["All Supporter perks","DM Host","Exclusive content"]},
];

function MonetizationWidget({ onTipAlert }) {
  var [open, setOpen] = useState(false);
  var [subOpen, setSubOpen] = useState(false);
  var [tipAmt, setTipAmt] = useState("");
  var [tipMsg, setTipMsg] = useState("");
  var [recentSubs, setRecentSubs] = useState([
    {name:"StarGirl",tier:"VIP",ts:"2m ago"},
    {name:"LitKid",tier:"Fan",ts:"5m ago"},
  ]);

  // Simulate new subs
  useEffect(function(){
    var names = ["WaveRider","HypeLord","BeatDrop","NeonKing","CloudTop","TrapGod"];
    var interval = setInterval(function(){
      var name = names[Math.floor(Math.random()*names.length)];
      var tier = SUB_TIERS[Math.floor(Math.random()*SUB_TIERS.length)];
      setRecentSubs(function(s){ return [{name:name,tier:tier.label,ts:"just now"}].concat(s).slice(0,5); });
      onTipAlert && onTipAlert({type:"sub",name:name,tier:tier.label,color:tier.color});
    }, 12000);
    return function(){clearInterval(interval);};
  },[]);

  function sendTip(e){ e&&e.preventDefault();
    if(!tipAmt) return;
    onTipAlert && onTipAlert({type:"tip",name:"You",amount:tipAmt,msg:tipMsg,color:G.gold});
    setTipAmt(""); setTipMsg("");
  }

  return (
    <div className="card card-g" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={function(){setOpen(!open);}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>💰</span>
          <span style={{fontFamily:G.fOrb,fontSize:10,color:G.gold,letterSpacing:2}}>MONETIZATION</span>
        </div>
        <span style={{color:G.grayDim,fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:12}}>
          {/* Tip form */}
          <div>
            <div style={{fontFamily:G.fMon,fontSize:9,color:G.grayDim,letterSpacing:1,marginBottom:6}}>SEND TIP</div>
            <form onSubmit={sendTip} style={{display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",gap:5}}>
                {[1,5,10,20,50].map(function(v){
                  return <button type="button" key={v} onClick={function(){setTipAmt(v);}}
                    style={{flex:1,padding:"5px 0",borderRadius:6,border:"1px solid "+(tipAmt===v?G.gold:"#333"),background:tipAmt===v?"rgba(212,175,55,0.15)":"#161616",cursor:"pointer",fontFamily:G.fMon,fontSize:10,color:tipAmt===v?G.gold:G.gray}}>${v}</button>;
                })}
              </div>
              <input className="inp" style={{fontSize:11}} placeholder="Add a message…" value={tipMsg} onChange={function(e){setTipMsg(e.target.value);}} />
              <button type="submit" className="btn btn-g" style={{width:"100%"}}>💰 SEND TIP ${tipAmt||"?"}</button>
            </form>
          </div>
          {/* Sub tiers */}
          <div>
            <div style={{fontFamily:G.fMon,fontSize:9,color:G.grayDim,letterSpacing:1,marginBottom:6,cursor:"pointer",display:"flex",justifyContent:"space-between"}} onClick={function(){setSubOpen(!subOpen);}}>
              SUBSCRIPTION TIERS <span>{subOpen?"▲":"▼"}</span>
            </div>
            {subOpen && SUB_TIERS.map(function(t){
              return (
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,border:"1px solid "+t.color+"44",background:t.color+"0A",marginBottom:6}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:G.fBeb,fontSize:16,color:t.color}}>{t.label}</div>
                    <div style={{fontFamily:G.fMon,fontSize:8,color:G.grayDim}}>{t.perks.join(" · ")}</div>
                  </div>
                  <div>
                    <div style={{fontFamily:G.fBeb,fontSize:16,color:G.gold}}>${t.price}<span style={{fontSize:9,color:G.grayDim}}>/mo</span></div>
                    <button style={{padding:"3px 8px",background:t.color+"22",border:"1px solid "+t.color,borderRadius:5,cursor:"pointer",fontFamily:G.fMon,fontSize:8,color:t.color}}>JOIN</button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Recent subs */}
          <div>
            <div style={{fontFamily:G.fMon,fontSize:9,color:G.grayDim,letterSpacing:1,marginBottom:6}}>RECENT SUBSCRIBERS</div>
            {recentSubs.map(function(s,i){
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:14}}>⭐</span>
                  <span style={{fontFamily:G.fRaj,fontSize:12,color:G.white,flex:1}}>{s.name}</span>
                  <span style={{fontFamily:G.fMon,fontSize:9,color:G.gold}}>{s.tier}</span>
                  <span style={{fontFamily:G.fMon,fontSize:8,color:G.grayDim}}>{s.ts}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── LIVE ANALYTICS DASHBOARD ─────────────────────────────────────
function LiveAnalytics() {
  var [open, setOpen] = useState(true);
  var [viewers, setViewers] = useState(1247);
  var [peakViewers, setPeakViewers] = useState(1247);
  var [engagement, setEngagement] = useState(82);
  var [revenue, setRevenue] = useState(142.50);
  var [newFollows, setNewFollows] = useState(37);
  var [history, setHistory] = useState([60,70,75,80,88,82,79,85,90,82]);
  var [chatRate, setChatRate] = useState(24);
  var [giftRate, setGiftRate] = useState(8);

  useEffect(function(){
    var interval = setInterval(function(){
      setViewers(function(v){
        var n = Math.max(100, v + Math.floor((Math.random()-0.4)*80));
        setPeakViewers(function(p){ return Math.max(p,n); });
        return n;
      });
      setEngagement(function(e){ return Math.min(100,Math.max(10,e+(Math.random()-0.5)*8)); });
      setRevenue(function(r){ return r + Math.random()*2.5; });
      setNewFollows(function(f){ return f + (Math.random()>0.7?1:0); });
      setChatRate(function(c){ return Math.max(1,Math.round(c+(Math.random()-0.5)*6)); });
      setGiftRate(function(g){ return Math.max(0,Math.round(g+(Math.random()-0.5)*3)); });
      setHistory(function(h){ return h.concat([Math.round(Math.min(100,Math.max(10,h[h.length-1]+(Math.random()-0.5)*15)))]).slice(-10); });
    }, 3000);
    return function(){clearInterval(interval);};
  },[]);

  var maxH = Math.max.apply(null,history)||1;

  return (
    <div className="card card-v" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={function(){setOpen(!open);}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>📊</span>
          <span style={{fontFamily:G.fOrb,fontSize:10,color:G.volt,letterSpacing:2}}>LIVE ANALYTICS</span>
          <span className="pill pill-v">{viewers.toLocaleString()} VIEWERS</span>
        </div>
        <span style={{color:G.grayDim,fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
          {/* Main stats grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
            {[
              {label:"VIEWERS",value:viewers.toLocaleString(),sub:"Peak: "+peakViewers.toLocaleString(),color:G.cyan,icon:"👁️"},
              {label:"ENGAGEMENT",value:Math.round(engagement)+"%",sub:"Interaction rate",color:G.volt,icon:"⚡"},
              {label:"REVENUE",value:"$"+revenue.toFixed(2),sub:"This session",color:G.gold,icon:"💰"},
              {label:"NEW FOLLOWS",value:"+"+newFollows,sub:"Since going live",color:G.green,icon:"❤️"},
            ].map(function(s){
              return (
                <div key={s.label} style={{padding:"10px",background:"#0D0D0D",borderRadius:8,border:"1px solid #1a1a1a"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                    <span style={{fontSize:12}}>{s.icon}</span>
                    <span style={{fontFamily:G.fMon,fontSize:7,color:G.grayDim,letterSpacing:1}}>{s.label}</span>
                  </div>
                  <div style={{fontFamily:G.fBeb,fontSize:22,color:s.color,lineHeight:1}}>{s.value}</div>
                  <div style={{fontFamily:G.fMon,fontSize:8,color:G.grayDim,marginTop:2}}>{s.sub}</div>
                </div>
              );
            })}
          </div>
          {/* Sparkline chart */}
          <div>
            <div style={{fontFamily:G.fMon,fontSize:8,color:G.grayDim,marginBottom:5,letterSpacing:1}}>VIEWER TREND (LIVE)</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:3,height:40,background:"#0D0D0D",borderRadius:6,padding:"4px 6px",border:"1px solid #1a1a1a"}}>
              {history.map(function(v,i){
                return (
                  <div key={i} style={{flex:1,borderRadius:2,background:"linear-gradient(180deg,"+G.volt+","+G.cyan+"66)",height:((v/maxH)*100)+"%",minHeight:3,transition:"height .5s ease"}} />
                );
              })}
            </div>
          </div>
          {/* Rate meters */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {label:"CHAT/MIN",value:chatRate,max:50,color:G.cyan},
              {label:"GIFTS/MIN",value:giftRate,max:20,color:G.gold},
            ].map(function(m){
              return (
                <div key={m.label} style={{padding:"8px",background:"#0D0D0D",borderRadius:7,border:"1px solid #1a1a1a"}}>
                  <div style={{fontFamily:G.fMon,fontSize:7,color:G.grayDim,letterSpacing:1,marginBottom:4}}>{m.label}</div>
                  <div style={{fontFamily:G.fBeb,fontSize:18,color:m.color,marginBottom:4}}>{m.value}</div>
                  <div style={{height:4,background:"#1a1a1a",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:Math.min(100,(m.value/m.max)*100)+"%",background:m.color,borderRadius:2,transition:"width .5s ease"}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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

// ── TIP ALERT BANNER ─────────────────────────────────────────────
function TipAlertBanner({ alert, onDismiss }) {
  useEffect(function(){
    var t = setTimeout(onDismiss, 3500);
    return function(){clearTimeout(t);};
  },[alert]);

  if(!alert) return null;
  var isTip = alert.type==="tip";
  var color = isTip ? G.gold : alert.color || G.cyan;
  return (
    <div className="tip-alert" style={{background:"rgba(0,0,0,0.92)",borderColor:color}}>
      <span style={{fontSize:26}}>{isTip?"💰":"⭐"}</span>
      <div>
        <div style={{fontFamily:G.fBeb,fontSize:16,color:color}}>{alert.name} {isTip?"tipped $"+alert.amount:"subscribed · "+alert.tier}</div>
        {isTip && alert.msg && <div style={{fontFamily:G.fRaj,fontSize:12,color:"rgba(255,255,255,0.7)"}}>{alert.msg}</div>}
      </div>
    </div>
  );
}

// ── LIVE CAMERA FEED ─────────────────────────────────────────────
function LiveCameraFeed({ camOn, micOn, onToggleCam, onToggleMic }) {
  var videoRef = useRef(null);
  var streamRef = useRef(null);
  var [streamActive, setStreamActive] = useState(false);
  var [elapsed, setElapsed] = useState(0);

  useEffect(function() {
    var timer = setInterval(function(){ setElapsed(function(e){ return e+1; }); }, 1000);
    return function(){ clearInterval(timer); };
  }, []);

  useEffect(function() {
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia({ video: camOn, audio: micOn })
      .then(function(stream) {
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; }
        setStreamActive(true);
      })
      .catch(function() { setStreamActive(false); });
    return function() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(function(t){ t.stop(); });
        streamRef.current = null;
      }
    };
  }, []);

  // Toggle camera tracks
  useEffect(function() {
    if (!streamRef.current) return;
    streamRef.current.getVideoTracks().forEach(function(t){ t.enabled = camOn; });
  }, [camOn]);

  // Toggle mic tracks
  useEffect(function() {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach(function(t){ t.enabled = micOn; });
  }, [micOn]);

  return (
    <div style={{position:"relative",width:"100%",height:320,background:"#000",borderRadius:12,overflow:"hidden",border:"2px solid #8B0000",boxShadow:"0 0 24px rgba(196,30,58,0.4)"}}>
      {/* Live video */}
      <video ref={videoRef} autoPlay muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",display:streamActive&&camOn?"block":"none"}} />

      {/* Cam off placeholder */}
      {(!streamActive || !camOn) && (
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0D0D0D,#1a0000)",gap:10}}>
          <span style={{fontSize:48}}>📵</span>
          <span style={{fontFamily:G.fMon,fontSize:11,color:G.grayDim}}>{!streamActive?"Camera unavailable":"Camera off"}</span>
        </div>
      )}

      {/* LIVE badge */}
      <div style={{position:"absolute",top:10,left:10,display:"flex",alignItems:"center",gap:6,background:"rgba(139,0,0,0.85)",padding:"4px 10px",borderRadius:6,border:"1px solid #C41E3A"}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:G.red,animation:"liveRing 1.2s ease-in-out infinite"}} />
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.white,letterSpacing:2}}>LIVE</span>
      </div>

      {/* Timer */}
      <div style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,0.7)",padding:"4px 10px",borderRadius:6,fontFamily:G.fMon,fontSize:11,color:G.gold}}>
        {fmtTime(elapsed)}
      </div>

      {/* Cam / Mic quick toggles */}
      <div style={{position:"absolute",bottom:10,left:0,right:0,display:"flex",justifyContent:"center",gap:12}}>
        <button onClick={onToggleCam} style={{width:44,height:44,borderRadius:"50%",border:"2px solid "+(camOn?G.cyan:"#555"),background:camOn?"rgba(0,229,255,0.2)":"rgba(0,0,0,0.6)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {camOn?"📷":"📵"}
        </button>
        <button onClick={onToggleMic} style={{width:44,height:44,borderRadius:"50%",border:"2px solid "+(micOn?G.green:"#555"),background:micOn?"rgba(48,209,88,0.2)":"rgba(0,0,0,0.6)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {micOn?"🎙️":"🔇"}
        </button>
      </div>
    </div>
  );
}

// ── STREAM TAB ───────────────────────────────────────────────────
function StreamTab({ autoStart, currentUser }) {
  var [joined, setJoined] = useState(!!autoStart);
  var [camOn, setCamOn] = useState(true);
  var [micOn, setMicOn] = useState(true);
  var [bitrate, setBitrate] = useState(2500);
  var [fps, setFps] = useState(30);
  var [latency, setLatency] = useState(120);
  var [floatingGifts, setFloatingGifts] = useState([]);
  var [tipAlert, setTipAlert] = useState(null);
  var [giftQueue, setGiftQueue] = useState([]);
  var [showViewerControls, setShowViewerControls] = useState(false);
  var [showZEGOSettings, setShowZEGOSettings] = useState(false);
  var [showTipModal, setShowTipModal] = useState(false);
  var [whisperToast, setWhisperToast] = useState(null);
  var [shopPinned, setShopPinned] = useState(false);
  var [showAura, setShowAura] = useState(false);
  var [showSwan, setShowSwan] = useState(false);
  var [showClip, setShowClip] = useState(false);
  var [elapsed, setElapsed] = useState(0);
  var isHost = true; // host view in StreamTab
  var roomId = "live-" + (currentUser?.id || "host");
  useEffect(function(){ if(!joined) return; var t = setInterval(function(){ setElapsed(function(e){ return e+1; }); }, 1000); return function(){ clearInterval(t); }; }, [joined]);

  // Simulate stream health fluctuation
  useEffect(function(){
    if(!joined) return;
    var interval = setInterval(function(){
      setBitrate(function(b){ return Math.round(Math.max(800, b+(Math.random()-0.4)*200)); });
      setFps(function(f){ return Math.max(24,Math.min(60,f+(Math.random()>0.8?-6:Math.random()>0.8?6:0))); });
      setLatency(function(l){ return Math.round(Math.max(40,l+(Math.random()-0.45)*40)); });
    }, 4000);
    return function(){clearInterval(interval);};
  },[joined]);

  function handleGiftSend(gift){
    var id = Date.now()+Math.random();
    var x = 15 + Math.random()*70;
    setFloatingGifts(function(g){ return g.concat([Object.assign({},gift,{id:id,x:x,sender:"You",big:gift.gems>=100})]); });
    setGiftQueue(function(q){ return q.concat([Object.assign({},gift,{sender_name: currentUser?.full_name || "You"})]); });
    setTipAlert({type:"tip",name:"You",amount:(gift.gems*0.1).toFixed(2),msg:gift.name+" sent!",color:G.gold});
    setTimeout(function(){ setFloatingGifts(function(g){ return g.filter(function(x){ return x.id!==id; }); }); }, 2600);
  }

  function handleTipAlert(alert){ setTipAlert(alert); }

  return (
    <div>
      <GiftAnimationLayer gifts={floatingGifts} />
      <TipAlertBanner alert={tipAlert} onDismiss={function(){setTipAlert(null);}} />
      {/* Gift animation overlay */}
      <GiftAnimationOverlay queue={giftQueue} onDone={function(){ setGiftQueue(function(q){ return q.slice(1); }); }} />
      {/* Whisper toast */}
      <WhisperToast whisper={whisperToast} onDismiss={function(){ setWhisperToast(null); }} />
      {/* Viewer controls */}
      {showViewerControls && <ViewerControlsPanel roomId={roomId} currentUser={currentUser} onClose={function(){ setShowViewerControls(false); }} />}
      {/* ZEGO Settings */}
      {showZEGOSettings && <ZEGOSettingsDrawer roomId={roomId} streamKey="seewhy-live-key" onClose={function(){ setShowZEGOSettings(false); }} />}
      {/* Tip modal */}
      {showTipModal && <TipNowModal roomId={roomId} currentUser={currentUser} hostId={currentUser?.id} onClose={function(){ setShowTipModal(false); }} />}
      {/* Aura panel */}
      {showAura && <AuraPanelDrawer roomId={roomId} hostId={currentUser?.id} onClose={function(){ setShowAura(false); }} />}
      {/* Swan director */}
      {showSwan && <SwanDirectorPanel roomId={roomId} hostId={currentUser?.id} onClose={function(){ setShowSwan(false); }} />}
      {/* Clip creator */}
      {showClip && <ClipCreatorSheet roomId={roomId} sessionId={roomId} creatorId={currentUser?.id} elapsedSeconds={elapsed} roomTitle="My Stream" onClose={function(){ setShowClip(false); }} />}

      {!joined ? (
        <div style={{padding:"20px 16px",display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontFamily:G.fBeb,fontSize:26,color:G.white,textAlign:"center"}}>READY TO GO LIVE?</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button onClick={function(){setCamOn(!camOn);}}
              style={{padding:"12px",borderRadius:8,border:"1px solid "+(camOn?G.cyan:"#333"),background:camOn?"rgba(0,229,255,0.08)":"#161616",cursor:"pointer",fontFamily:G.fMon,fontSize:10,color:camOn?G.cyan:G.grayDim}}>
              {camOn?"📷 CAM ON":"📵 CAM OFF"}
            </button>
            <button onClick={function(){setMicOn(!micOn);}}
              style={{padding:"12px",borderRadius:8,border:"1px solid "+(micOn?G.green:"#333"),background:micOn?"rgba(48,209,88,0.08)":"#161616",cursor:"pointer",fontFamily:G.fMon,fontSize:10,color:micOn?G.green:G.grayDim}}>
              {micOn?"🎙️ MIC ON":"🔇 MIC OFF"}
            </button>
          </div>
          <button className="btn btn-g" style={{width:"100%",fontSize:16,padding:"14px"}} onClick={function(){setJoined(true);}}>🔴 GO LIVE NOW</button>
        </div>
      ) : (
        <div>
          {/* Stream Health HUD */}
          <StreamHealthHUD sessionId={roomId} onClick={function(){ setShowZEGOSettings(true); }} />
          {/* Gift Leaderboard (host) */}
          {isHost && <GiftLeaderboard roomId={roomId} />}
          {/* Merch strip if pinned */}
          {shopPinned && <MerchStrip roomId={roomId} currentUser={currentUser} hostId={currentUser?.id} />}

          <div style={{padding:"10px 16px 0"}}>
            <LiveCameraFeed camOn={camOn} micOn={micOn} onToggleCam={function(){setCamOn(function(v){return !v;});}} onToggleMic={function(){setMicOn(function(v){return !v;});}} />
          </div>

          {/* Swan HUD */}
          {isHost && joined && <SwanDirectorHUD roomId={roomId} hostId={currentUser?.id} onOpenPanel={function(){ setShowSwan(true); }} />}
          {/* Host control bar */}
          {isHost && (
            <div style={{display:"flex",gap:6,padding:"8px 16px",overflowX:"auto"}}>
              <button onClick={function(){ setShowZEGOSettings(true); }} style={{padding:"6px 12px",background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.3)",borderRadius:6,color:G.gold,fontFamily:G.fMon,fontSize:9,cursor:"pointer",flexShrink:0}}>⚙️ SETTINGS</button>
              <button onClick={function(){ setShowAura(true); }} style={{padding:"6px 12px",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.3)",borderRadius:6,color:"#8B5CF6",fontFamily:G.fMon,fontSize:9,cursor:"pointer",flexShrink:0}}>🤖 AURA</button>
              <button onClick={function(){ setShowClip(true); }} style={{padding:"6px 12px",background:"rgba(200,255,0,0.06)",border:"1px solid rgba(200,255,0,0.2)",borderRadius:6,color:"#C8FF00",fontFamily:G.fMon,fontSize:9,cursor:"pointer",flexShrink:0}}>✂️ CLIP</button>
              <button onClick={function(){ setShopPinned(function(v){ return !v; }); }} style={{padding:"6px 12px",background:shopPinned?"rgba(128,0,32,0.3)":"rgba(255,255,255,0.04)",border:"1px solid "+(shopPinned?"#800020":"#333"),borderRadius:6,color:shopPinned?G.gold:G.gray,fontFamily:G.fMon,fontSize:9,cursor:"pointer",flexShrink:0}}>📦 {shopPinned?"CLOSE SHOP":"OPEN SHOP"}</button>
              <SubscribeButton creatorId={currentUser?.id} roomId={roomId} currentUser={currentUser} />
            </div>
          )}

          {/* Viewer controls bar */}
          <div style={{display:"flex",gap:6,padding:"4px 16px 8px",overflowX:"auto"}}>
            <button onClick={function(){ setShowViewerControls(true); }} style={{padding:"6px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid #333",borderRadius:6,color:G.gray,fontFamily:G.fMon,fontSize:9,cursor:"pointer",flexShrink:0}}>⚙️ CONTROLS</button>
            <button onClick={function(){ setShowTipModal(true); }} style={{padding:"6px 12px",background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.3)",borderRadius:6,color:G.gold,fontFamily:G.fMon,fontSize:9,cursor:"pointer",flexShrink:0}}>💰 TIP NOW</button>
          </div>

          <LiveAnalytics />
          <OctagonalVideoGrid guests={[]} hostName="Host" />
          <StreamControls camOn={camOn} setCamOn={setCamOn} micOn={micOn} setMicOn={setMicOn} bitrate={bitrate} fps={fps} latency={latency} />
          <GiftShop onSend={handleGiftSend} />
          <MonetizationWidget onTipAlert={handleTipAlert} />
          <DMWhisper />
          <Soundboard />
          <ScreenShare />
          <GuestControls />
          <PKBattleEngine myName="Host" />
          <MultiStreamRTMP roomID="test" />
          <LiveChat />
          <button className="btn btn-r" style={{margin:"16px",width:"calc(100% - 32px)"}} onClick={function(){setJoined(false);}}>■ END STREAM</button>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD TAB ────────────────────────────────────────────────
function DashboardTab({ currentUser }) {
  var [dashTab, setDashTab] = useState("overview");
  return (
    <div style={{padding:"16px"}}>
      <div style={{fontFamily:G.fBeb,fontSize:28,color:G.gold}}>$1,247.80</div>
      <div style={{fontFamily:G.fMon,fontSize:10,color:G.gray}}>Total earnings (90% split)</div>
      {/* Sub-tabs */}
      <div style={{display:"flex",gap:0,margin:"12px 0",borderBottom:"1px solid #1a1a1a"}}>
        {["overview","shop"].map(function(t){
          return (
            <button key={t} onClick={function(){setDashTab(t);}} style={{padding:"7px 14px",background:"none",border:"none",borderBottom:"2px solid "+(dashTab===t?G.gold:"transparent"),cursor:"pointer",fontFamily:G.fMon,fontSize:9,letterSpacing:1,color:dashTab===t?G.gold:G.gray}}>
              {t.toUpperCase()}
            </button>
          );
        })}
      </div>
      {dashTab==="overview" && (
        <div>
          <StreamAnalytics />
          <Leaderboard />
          <VODLibrary />
          <SwanyBotMemory />
          <CustomBackground />
        </div>
      )}
      {dashTab==="shop" && (
        <div>
          {/* Lazy-load ShopDashboard */}
          <ShopDashboardInline creatorId={currentUser?.id} />
        </div>
      )}
    </div>
  );
}

function ShopDashboardInline({ creatorId }) {
  var [loaded, setLoaded] = useState(false);
  var [ShopComp, setShopComp] = useState(null);
  useEffect(function(){
    import("@/components/merch/ShopDashboard").then(function(m){ setShopComp(function(){ return m.default; }); setLoaded(true); });
  },[]);
  if (!loaded || !ShopComp) return <div style={{color:G.gray,fontFamily:G.fMon,fontSize:10,padding:20,textAlign:"center"}}>Loading shop…</div>;
  return <ShopComp creatorId={creatorId} />;
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
  var urlParams = new URLSearchParams(window.location.search);
  var skipCover = urlParams.get("direct") === "1" || urlParams.get("tab") === "stream";
  var [tab, setTab] = useState(urlParams.get("tab") || "stream");
  var [entered, setEntered] = useState(skipCover);
  var [currentUser, setCurrentUser] = useState(null);

  useEffect(function(){ base44.auth.me().then(setCurrentUser).catch(function(){}); }, []);

  var { data: unreadDMs = [] } = useQuery({
    queryKey: ["unread-dms", currentUser?.id],
    queryFn: function() { return base44.entities.DirectMessage.filter({ recipient_id: currentUser?.id, is_read: false }); },
    enabled: !!currentUser?.id,
    refetchInterval: 15000,
  });

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
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <NotificationsHub onClose={function(){}} />
          {/* DM icon with unread badge */}
          <Link to="/messages" style={{position:"relative",textDecoration:"none"}}>
            <div style={{width:34,height:34,borderRadius:8,background:"rgba(128,0,32,0.2)",border:"1px solid rgba(212,175,55,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer"}}>💬</div>
            {unreadDMs.length > 0 && (
              <div style={{position:"absolute",top:-4,right:-4,background:"#C41E3A",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.fMon,fontSize:8,color:"#fff",fontWeight:700}}>{unreadDMs.length}</div>
            )}
          </Link>
          <div style={{color:G.gray,fontFamily:G.fMon,fontSize:10}}>●●●</div>
        </div>
      </div>

      {/* Body */}
      <div className="sw-body">
        {tab === "home" && <HomeTab onJoinRoom={function(room){setTab("stream");}} />}
        {tab === "stream" && <StreamTab autoStart={skipCover} currentUser={currentUser} />}
        {tab === "dashboard" && <DashboardTab currentUser={currentUser} />}
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