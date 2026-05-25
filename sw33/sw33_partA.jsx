/* ═══════════════════════════════════════════════════════════════════
   SeeWhy LIVE v33  ·  SW33.jsx  ·  Part A — Foundation
   Design system · constants · helpers · CSS · base components
   ═══════════════════════════════════════════════════════════════════ */
import React, {useState, useEffect, useRef} from 'react';
import ReactDOM from 'react-dom/client';

/* ─── DESIGN TOKENS ──────────────────────────────────────────────── */
var C = {
  bg0:'#07050A', bg1:'#0F0C14', bg2:'rgba(22,16,32,.9)', bg3:'rgba(30,22,42,.8)',
  br1:'rgba(255,255,255,.07)', br2:'rgba(255,255,255,.12)',
  t1:'#EDE8F5', t2:'#C4B5D4', t3:'#7A6F90', t4:'#483D60',
  gold:'#C9A84C', gHi:'#E8C46A',
  tHi:'#00C9A7', tD:'rgba(0,201,167,.15)',
  burg:'#800020', bHi:'#C01838', bGlow:'#FF1A3C',
  volt:'#AAFF00',
  purHi:'#C084FC',
  red:'#FF4444', lime:'#B4E628',
  scrim:'rgba(7,5,10,.95)'
};
var F = {
  d:"'Bebas Neue',sans-serif",
  m:"'DM Mono',monospace",
  b:"'Barlow Condensed',sans-serif"
};
var R = {sm:6, md:10, lg:14};
var E = {spring:'cubic-bezier(.34,1.56,.64,1)'};

/* ─── CONSTANTS ──────────────────────────────────────────────────── */
var MAX_PANEL = 10;
var MAX_VIDEO_SECS = 600;
var CREATOR = 0.90;
var PLATFORM = 0.10;

/* ─── STYLE HELPERS ──────────────────────────────────────────────── */
function sp(n){ return (n*8)+"px"; }
function fd(size){ return {fontFamily:F.d,fontSize:size+"px",lineHeight:1.1}; }
function fm(size){ return {fontFamily:F.m,fontSize:size+"px",lineHeight:1.3}; }
function fb(size){ return {fontFamily:F.b,fontSize:size+"px",lineHeight:1.2}; }

/* ─── FORMATTERS ─────────────────────────────────────────────────── */
function fmtTime(){
  var d=new Date();
  var h=d.getHours(); var m=d.getMinutes();
  return (h%12||12)+":"+(m<10?"0"+m:m)+(h<12?"am":"pm");
}
function fmtN(n){
  if(n>=1000000)return Math.floor(n/100000)/10+"M";
  if(n>=1000)return Math.floor(n/100)/10+"K";
  return n+"";
}
function fmtTimer(s){
  var m=Math.floor(s/60);
  var sec=s%60;
  return (m<10?"0"+m:m)+":"+(sec<10?"0"+sec:sec);
}
function fmtCents(cents){
  return "$"+(Math.floor(cents)/100).toFixed(2);
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

/* ─── CLAUDE API ─────────────────────────────────────────────────── */
function callClaude(system, message){
  return fetch('/api/ai/chat',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({system:system, message:message})
  })
  .then(function(r){ return r.json(); })
  .then(function(d){ return d.reply||d.text||d.content||""; });
}

/* ─── DATA CONSTANTS ─────────────────────────────────────────────── */
var PAY_METHODS = [
  {id:'cashapp',name:'CashApp',icon:'💚',color:'#00D632',handle:'$SwanyThree',link:'https://cash.app/$SwanyThree'},
  {id:'zelle',  name:'Zelle',  icon:'💜',color:'#6E2FFF',handle:'SwanyThree@seewhylive.online',link:null},
  {id:'paypal', name:'PayPal', icon:'💙',color:'#0070E0',handle:'@SwanyThree',link:'https://paypal.me/SwanyThree'},
  {id:'venmo',  name:'Venmo',  icon:'🤝',color:'#3D95CE',handle:'@SwanyThree',link:'https://venmo.com/SwanyThree'},
];

var SHARE_PLATFORMS = [
  {id:'wa',  name:'WhatsApp',  icon:'💬',color:'#25D366',url:'https://wa.me/?text='},
  {id:'sms', name:'SMS',       icon:'📱',color:'#34AADC',url:'sms:?body='},
  {id:'x',   name:'X',         icon:'𝕏', color:'#1DA1F2',url:'https://x.com/intent/tweet?text='},
  {id:'fb',  name:'Facebook',  icon:'👤',color:'#1877F2',url:'https://facebook.com/sharer/sharer.php?u='},
  {id:'ig',  name:'Instagram', icon:'📸',color:'#E1306C',url:'https://instagram.com'},
  {id:'tt',  name:'TikTok',    icon:'🎵',color:'#69C9D0',url:'https://tiktok.com'},
  {id:'sc',  name:'Snapchat',  icon:'👻',color:'#FFFC00',url:'https://snapchat.com'},
  {id:'copy',name:'Copy Link', icon:'📋',color:'#7A6F90',url:''},
];

var DEST_PLATFORMS = [
  {id:'sw',name:'SeeWhy',  icon:'👁', color:'#C9A84C',fixed:true},
  {id:'yt',name:'YouTube', icon:'▶', color:'#FF0000',fixed:false},
  {id:'tt',name:'TikTok',  icon:'🎵',color:'#69C9D0',fixed:false},
  {id:'fb',name:'Facebook',icon:'👤',color:'#1877F2',fixed:false},
  {id:'tw',name:'Twitch',  icon:'🟣',color:'#9146FF',fixed:false},
  {id:'ki',name:'Kick',    icon:'🟢',color:'#53FC18',fixed:false},
  {id:'rb',name:'Rumble',  icon:'🟡',color:'#85C742',fixed:false},
  {id:'x', name:'X',       icon:'𝕏', color:'#1DA1F2',fixed:false},
];

var WISPRFLOW_LANGS = [
  {code:'EN',flag:'🇺🇸',name:'English'},
  {code:'ES',flag:'🇪🇸',name:'Español'},
  {code:'FR',flag:'🇫🇷',name:'Français'},
  {code:'PT',flag:'🇧🇷',name:'Português'},
  {code:'DE',flag:'🇩🇪',name:'Deutsch'},
  {code:'JA',flag:'🇯🇵',name:'日本語'},
  {code:'KO',flag:'🇰🇷',name:'한국어'},
  {code:'ZH',flag:'🇨🇳',name:'中文'},
  {code:'AR',flag:'🇸🇦',name:'العربية'},
  {code:'NG',flag:'🇳🇬',name:'Pidgin'},
  {code:'JM',flag:'🇯🇲',name:'Patois'},
  {code:'HA',flag:'🇬🇭',name:'Hausa'},
];

var MOCK_USERS = [
  'FanRider99','GoldTipper','VibeNation','DominoKing','NightOwl420',
  'WashClass2025','QueenB_Live','SkyHigh_Bones','TreBlaze','UrbanLegend',
  'CryptoVibes','BeatDropper','NxtLevel_Sam','ClassicHustle','LiveRoyalty',
];
var MOCK_MSGS = [
  'Let\'s go!! 🔥','Washington Classic energy!','SwanyThree in the building 👑',
  'Direct pay sent 💸','That move was CRAZY 🎲','No cap best stream today',
  'Chat is ALIVE tonight 🔴','Bones falling right 🦴','Run it back!',
  'Who else got money on this?','Big ups from Jamaica 🇯🇲',
  'Came for the vibe stayed for the stream','Real ones know 💎','W streamer fr',
  'This is the one 🔑','Stream quality is 🔥 tonight','Chat we winning!',
];

var INIT_PANELISTS = [
  {id:1,name:'SwanyThree',role:'HOST',country:'🇺🇸',color:C.gold,live:true,muted:false,vip:true,speaking:true},
  {id:2,name:'DominoKing',role:'CO-HOST',country:'🇯🇲',color:C.tHi,live:true,muted:false,vip:true,speaking:false},
  {id:3,name:'VibeNation',role:'PANELIST',country:'🇳🇬',color:C.purHi,live:true,muted:false,vip:false,speaking:false},
  {id:4,name:'ClassicHustle',role:'PANELIST',country:'🇨🇦',color:C.volt,live:false,muted:true,vip:false,speaking:false},
];

/* ─── CSS INJECTION ──────────────────────────────────────────────── */
(function(){
  var el=document.createElement('style');
  el.textContent=[
    '@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;500;600;700&family=DM+Mono:ital,wght@0,300;0,400;0,500&display=swap");',
    '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0;}',
    'html,body{height:100%;overflow:hidden;background:#07050A;}',
    'body{color:#EDE8F5;font-family:\'Barlow Condensed\',sans-serif;}',
    '#root{height:100%;display:flex;flex-direction:column;overflow:hidden;}',
    '::-webkit-scrollbar{width:3px;height:3px;}',
    '::-webkit-scrollbar-track{background:rgba(255,255,255,.02);}',
    '::-webkit-scrollbar-thumb{background:rgba(201,168,76,.25);border-radius:2px;}',
    'button{outline:none;cursor:pointer;}',
    'input,textarea{outline:none;background:transparent;}',
    '@keyframes paySlide{from{transform:translateY(100%)}to{transform:translateY(0)}}',
    '@keyframes shareSlide{from{transform:translateY(100%)}to{transform:translateY(0)}}',
    '@keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}',
    '@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}',
    '@keyframes toastIn{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}',
    '@keyframes toastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(110%)}}',
    '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}',
    '@keyframes navPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,26,60,.5)}60%{box-shadow:0 0 0 8px rgba(255,26,60,0)}}',
    '@keyframes audioBar{from{transform:scaleY(.15)}to{transform:scaleY(1)}}',
    '@keyframes thinkPulse{from{opacity:.15;transform:scale(.65)}to{opacity:1;transform:scale(1.1)}}',
    '@keyframes recordPulse{0%,100%{opacity:1}50%{opacity:.1}}',
    '@keyframes giftFloat{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-90px) scale(1.4)}}',
    '@keyframes splashOut{0%{opacity:1}75%{opacity:1}100%{opacity:0;pointer-events:none;visibility:hidden}}',
    '@keyframes bG{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}',
    '@keyframes shimmer{0%{opacity:.5}50%{opacity:1}100%{opacity:.5}}',
  ].join('');
  document.head.appendChild(el);
})();

/* ─── BASE COMPONENTS ────────────────────────────────────────────── */

function AudioBars(props){
  var color=props.color||C.tHi;
  var n=props.n||5;
  var maxH=props.h||14;
  var active=props.active;
  return(
    <div style={{display:"flex",gap:2,alignItems:"flex-end",height:maxH+"px",flexShrink:0}}>
      {Array.from({length:n}).map(function(_,i){
        return(
          <div key={i} style={{
            width:3,
            height:"100%",
            background:color,
            borderRadius:2,
            opacity:active?1:0.2,
            transformOrigin:"bottom",
            animation:active?("audioBar .45s ease-in-out "+((i%3)*0.12)+"s infinite alternate"):"none",
            transform:active?"scaleY(1)":"scaleY(.12)"
          }}/>
        );
      })}
    </div>
  );
}

function ThinkDots(props){
  var color=props.color||C.tHi;
  return(
    <div style={{display:"flex",gap:5,alignItems:"center",padding:"3px 0"}}>
      {[0,1,2].map(function(i){
        return(
          <div key={i} style={{
            width:6,height:6,borderRadius:"50%",
            background:color,
            animation:"thinkPulse .75s ease-in-out "+(i*0.22)+"s infinite alternate"
          }}/>
        );
      })}
    </div>
  );
}

function Btn(props){
  var variant=props.variant||"primary";
  var size=props.size||"md";
  var full=props.full;
  var disabled=props.disabled;
  var varMap={
    primary:{bg:"linear-gradient(135deg,"+C.burg+","+C.bHi+")",border:C.bHi+"66",color:C.t1},
    teal:   {bg:C.tD,border:C.tHi+"66",color:C.tHi},
    ghost:  {bg:"transparent",border:C.br2,color:C.t2},
    active: {bg:C.gold+"1A",border:C.gHi+"55",color:C.gHi},
    burg:   {bg:C.burg+"22",border:C.bHi+"55",color:C.bHi},
    volt:   {bg:C.volt+"14",border:C.volt+"44",color:C.volt},
    danger: {bg:"linear-gradient(135deg,#3A0010,"+C.bHi+")",border:C.bGlow+"66",color:C.t1},
  };
  var sizeMap={
    sm:{padding:"4px 9px",fontSize:9},
    md:{padding:"7px 13px",fontSize:11},
    lg:{padding:"11px 18px",fontSize:13},
  };
  var v=varMap[variant]||varMap.primary;
  var s=sizeMap[size]||sizeMap.md;
  var base={
    display:"inline-flex",alignItems:"center",gap:5,
    background:v.bg,
    border:"1px solid "+v.border,
    borderRadius:R.sm+"px",
    color:v.color,
    fontFamily:F.d,
    fontSize:s.fontSize+"px",
    letterSpacing:".08em",
    padding:s.padding,
    cursor:disabled?"not-allowed":"pointer",
    opacity:disabled?0.45:1,
    flexShrink:0,
    transition:"opacity .15s ease",
    width:full?"100%":"auto",
    justifyContent:full?"center":"flex-start",
    textAlign:"center",
  };
  return(
    <button
      onClick={disabled?null:props.onClick}
      style={Object.assign({},base,props.style||{})}
    >{props.children}</button>
  );
}

function Tag(props){
  var variant=props.variant||"gold";
  var varMap={
    gold:{bg:C.gold+"18",border:C.gHi+"44",color:C.gHi},
    teal:{bg:C.tD,border:C.tHi+"44",color:C.tHi},
    burg:{bg:C.burg+"22",border:C.bHi+"55",color:C.bHi},
    volt:{bg:C.volt+"14",border:C.volt+"44",color:C.volt},
    muted:{bg:"transparent",border:C.br1,color:C.t3},
  };
  var v=varMap[variant]||varMap.gold;
  var base={
    display:"inline-flex",alignItems:"center",gap:3,
    background:v.bg,
    border:"1px solid "+v.border,
    borderRadius:4,
    color:v.color,
    fontFamily:F.d,
    fontSize:8,
    letterSpacing:".1em",
    padding:"2px 7px",
    flexShrink:0,
    whiteSpace:"nowrap",
  };
  return <span style={Object.assign({},base,props.style||{})}>{props.children}</span>;
}

function GCard(props){
  var base={
    background:C.bg2,
    border:"1px solid "+C.br1,
    borderRadius:R.lg+"px",
    padding:sp(2),
    backdropFilter:"blur(12px)",
    WebkitBackdropFilter:"blur(12px)",
  };
  return(
    <div style={Object.assign({},base,props.style||{})} onClick={props.onClick}>
      {props.children}
    </div>
  );
}

function Inp(props){
  var base={
    width:"100%",
    background:C.bg3,
    border:"1px solid "+C.br1,
    borderRadius:R.sm+"px",
    padding:"8px 11px",
    color:C.t1,
    fontFamily:F.b,
    fontSize:13,
    display:"block",
  };
  return(
    <input
      type={props.type||"text"}
      value={props.value}
      onChange={props.onChange}
      onKeyDown={props.onKeyDown}
      placeholder={props.placeholder||""}
      disabled={props.disabled}
      style={Object.assign({},base,props.style||{})}
    />
  );
}

function OctaCell(props){
  var p=props.p;
  var sz=props.sz||58;
  var isHost=props.isHost;
  if(!p){
    return(
      <div onClick={props.onClick} style={{
        width:sz+"px",height:sz+"px",
        background:C.bg3,
        border:"1px dashed "+C.br1,
        borderRadius:R.md+"px",
        display:"flex",alignItems:"center",justifyContent:"center",
        cursor:"pointer",opacity:.35,flexShrink:0,
      }}>
        <span style={Object.assign(fd(16),{color:C.t4})}>+</span>
      </div>
    );
  }
  return(
    <div style={{position:"relative",flexShrink:0}} onClick={props.onClick}>
      <div style={{
        width:sz+"px",height:sz+"px",
        background:"radial-gradient(circle at 35% 30%,"+p.color+"2E,"+p.color+"0C)",
        border:"1px solid "+(p.speaking?p.color:p.vip?C.gHi:C.br1),
        borderRadius:R.md+"px",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        cursor:"pointer",
        boxShadow:p.speaking?("0 0 14px "+p.color+"44"):"none",
        overflow:"hidden",
        padding:4,
        gap:2,
      }}>
        <div style={{fontSize:Math.floor(sz*.32)+"px",lineHeight:1}}>{p.country||"🌐"}</div>
        <div style={Object.assign(fm(7),{color:p.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:(sz-10)+"px",textAlign:"center"})}>{p.name}</div>
        {p.live&&!p.muted
          ?<AudioBars active={true} color={p.color} n={3} h={7}/>
          :<div style={{height:7,display:"flex",alignItems:"center"}}>{p.muted&&<span style={{fontSize:8,opacity:.7}}>🔇</span>}</div>
        }
      </div>
      {isHost&&<div style={{position:"absolute",top:-5,left:-5,background:C.gold,borderRadius:"50%",width:15,height:15,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,border:"1px solid "+C.bg1}}>👑</div>}
      {props.onExpand&&<button onClick={function(e){e.stopPropagation();props.onExpand(p);}} style={{position:"absolute",bottom:1,right:1,background:"rgba(0,0,0,.6)",border:"none",borderRadius:2,padding:"1px 3px",color:C.t3,fontFamily:F.m,fontSize:7,cursor:"pointer",lineHeight:1}}>⛶</button>}
    </div>
  );
}
