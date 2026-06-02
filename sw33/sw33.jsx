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

/* ─── DIRECT PAY SHEET ────────────────────────────────────────── */
function DirectPaySheet(props){
  var [amount,setAmount]=useState("10");
  var amounts=["1","5","10","20","50","100"];
  var openPay=function(method){
    if(method.link){try{window.open(method.link,"_blank");}catch(e){}}
    props.addToast({type:"pay",emoji:method.icon,msg:"Opening "+method.name+"... send $"+amount+" to "+method.handle});
    props.onClose&&props.onClose();
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:700,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"flex-end",backdropFilter:"blur(8px)"}} onClick={function(e){if(e.target===e.currentTarget)props.onClose&&props.onClose();}}>
      <div style={{width:"100%",maxWidth:430,margin:"0 auto",background:C.bg2,borderRadius:"20px 20px 0 0",border:"1px solid "+C.br2,padding:sp(4),animation:"paySlide .3s ease",paddingBottom:32}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp(3)}}>
          <div><div style={Object.assign(fd(20),{color:C.lime,letterSpacing:3})}>💸 DIRECT PAY</div><div style={Object.assign(fm(8),{color:C.t3})}>100% goes directly to creator — zero platform cut</div></div>
          <Btn variant="ghost" size="sm" onClick={props.onClose}>✕</Btn>
        </div>
        <div style={{marginBottom:sp(3)}}>
          <div style={Object.assign(fb(11),{color:C.t2,marginBottom:sp(1)})}>Amount</div>
          <div style={{display:"flex",gap:sp(1),flexWrap:"wrap",marginBottom:sp(2)}}>{amounts.map(function(a){return <button key={a} onClick={function(){setAmount(a);}} style={{padding:"5px 11px",borderRadius:6,background:amount===a?C.gold+"22":C.bg3,border:"1px solid "+(amount===a?C.gHi:C.br1),color:amount===a?C.gHi:C.t2,fontFamily:F.d,fontSize:11,cursor:"pointer"}}>${a}</button>;})}</div>
          <Inp value={amount} onChange={function(e){setAmount(e.target.value.replace(/[^0-9.]/g,""));}} placeholder="Custom amount..." style={{textAlign:"center",fontSize:16,color:C.gHi,border:"1px solid "+C.gHi+"44"}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:sp(2)}}>{PAY_METHODS.map(function(method){return(
          <button key={method.id} onClick={function(){openPay(method);}} style={{background:method.color+"18",border:"2px solid "+method.color+"55",borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:sp(3),cursor:"pointer",textAlign:"left"}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:method.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{method.icon}</div>
            <div style={{flex:1}}><div style={Object.assign(fd(15),{color:C.t1,letterSpacing:1})}>{method.name}</div><div style={Object.assign(fm(9),{color:C.t3})}>{method.handle}</div></div>
            <div style={Object.assign(fd(18),{color:method.color})}>$→</div>
          </button>
        );})}</div>
        <div style={{marginTop:sp(3),textAlign:"center",fontFamily:F.m,fontSize:8,color:C.t4}}>💯 Creator receives 100% — no platform cut on direct payments</div>
      </div>
    </div>
  );
}

/* ─── SHARE SHEET ─────────────────────────────────────────────── */
function ShareSheet(props){
  var streamUrl=props.streamUrl||"https://seewhylive.online/live/friday-night-dominos";
  var streamTitle=props.streamTitle||"SeeWhy LIVE — Washington Classic";
  var shareMsg=streamTitle+" — watch LIVE on SeeWhy! 🔴 "+streamUrl+" (no app needed — watch in browser!)";
  var openShare=function(platform){
    var finalUrl="";
    if(platform.id==="wa")finalUrl=platform.url+encodeURIComponent(shareMsg);
    else if(platform.id==="sms")finalUrl=platform.url+encodeURIComponent(shareMsg);
    else if(platform.id==="fb")finalUrl="https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(streamUrl);
    else if(platform.id==="x")finalUrl="https://x.com/intent/tweet?text="+encodeURIComponent(shareMsg);
    else if(platform.id==="copy"){try{navigator.clipboard.writeText(streamUrl);}catch(e){}props.addToast({type:"teal",emoji:"📋",msg:"Link copied!"});props.onClose&&props.onClose();return;}
    else finalUrl=platform.url;
    try{if(finalUrl)window.open(finalUrl,"_blank");}catch(e){}
    props.addToast({type:"teal",emoji:platform.icon,msg:"Sharing to "+platform.name+"!"});
    props.onClose&&props.onClose();
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:700,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"flex-end",backdropFilter:"blur(8px)"}} onClick={function(e){if(e.target===e.currentTarget)props.onClose&&props.onClose();}}>
      <div style={{width:"100%",maxWidth:430,margin:"0 auto",background:C.bg2,borderRadius:"20px 20px 0 0",border:"1px solid "+C.br2,padding:sp(4),animation:"shareSlide .3s ease",paddingBottom:32}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp(3)}}>
          <div><div style={Object.assign(fd(20),{color:C.tHi,letterSpacing:3})}>📤 SHARE LIVE</div><div style={Object.assign(fm(8),{color:C.t3})}>Outsiders watch in browser — no app required.</div></div>
          <Btn variant="ghost" size="sm" onClick={props.onClose}>✕</Btn>
        </div>
        <div style={{background:C.bg3,borderRadius:8,padding:"8px 12px",marginBottom:sp(3),border:"1px solid "+C.br1,display:"flex",gap:sp(2),alignItems:"center"}}>
          <div style={{flex:1,minWidth:0}}><div style={Object.assign(fb(11),{color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"})}>{streamTitle}</div><div style={Object.assign(fm(8),{color:C.tHi,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"})}>{streamUrl}</div></div>
          <Btn variant="teal" size="sm" onClick={function(){try{navigator.clipboard.writeText(streamUrl);}catch(e){}props.addToast({type:"teal",emoji:"📋",msg:"Copied!"});}}>📋 COPY</Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:sp(2),marginBottom:sp(3)}}>{SHARE_PLATFORMS.map(function(platform){return(
          <button key={platform.id} onClick={function(){openShare(platform);}} style={{background:platform.color+"15",border:"1px solid "+platform.color+"33",borderRadius:10,padding:"10px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer"}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:platform.color+"22",border:"2px solid "+platform.color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{platform.icon}</div>
            <span style={Object.assign(fd(8),{color:C.t2,letterSpacing:.5})}>{platform.name}</span>
          </button>
        );})}</div>
        <div style={{background:C.bg3,borderRadius:8,padding:"8px 12px",border:"1px solid "+C.br1}}><div style={Object.assign(fm(8),{color:C.tHi})}>📱 External viewers watch live in-browser and get prompted to download SeeWhy. That is how the community grows. 🚀</div></div>
      </div>
    </div>
  );
}

/* ─── STAGE PANEL ─────────────────────────────────────────────── */
function StagePanel(props){
  var [msgs,setMsgs]=useState([
    {id:1,user:"FanRider99",text:"🔥 SwanyThree LIVE!",badge:"🌟",time:"8:01",flag:"🇺🇸",risk:.02},
    {id:2,user:"GoldTipper",text:"Direct pay sent 💸",badge:"👑",time:"8:03",flag:"🇯🇲",tip:true},
    {id:3,user:"VibeNation",text:"Washington Classic 🎲🎲",badge:"⚡",time:"8:04",flag:"🇳🇬",risk:.01},
  ]);
  var [chatInput,setChatInput]=useState("");
  var [chatOpen,setChatOpen]=useState(true);
  var [chatLang,setChatLang]=useState("EN");
  var [showLangPicker,setShowLangPicker]=useState(false);
  var [expandedP,setExpandedP]=useState(null);
  var [selectedP,setSelectedP]=useState(null);
  var [showPaySheet,setShowPaySheet]=useState(false);
  var [showShareSheet,setShowShareSheet]=useState(false);
  var [fanoutDests,setFanoutDests]=useState({yt:false,tt:false,fb:false,tw:false,ki:false,rb:false,x:false});
  var [fanout,setFanout]=useState(false);
  var [audioOnlyMode,setAudioOnlyMode]=useState(false);
  var [privateMode,setPrivateMode]=useState(false);
  var chatRef=useRef(null);
  useEffect(function(){
    var t=setInterval(function(){
      setMsgs(function(p){return [...p.slice(-45),{id:Date.now(),user:pick(MOCK_USERS),text:pick(MOCK_MSGS),badge:Math.random()>.75?pick(["🔥","⭐","💎","🎲","⚡"]):null,time:fmtTime(),flag:pick(["🇺🇸","🇯🇲","🇳🇬","🇰🇷","🇬🇧","🇫🇷","🇧🇷","🇨🇦"]),risk:Math.random()*.25,tip:Math.random()>.92}];});
    },2800);
    return function(){clearInterval(t);};
  },[]);
  useEffect(function(){if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[msgs]);
  function handleAction(action,id){
    if(action==="kick"){props.setPanelists(function(p){return p.filter(function(x){return x.id!==id;});});setExpandedP(null);return;}
    props.setPanelists(function(p){return p.map(function(x){
      if(x.id!==id)return x;
      if(action==="mute")return Object.assign({},x,{muted:!x.muted});
      if(action==="vip")return Object.assign({},x,{vip:!x.vip});
      if(action==="spotlight")return Object.assign({},x,{speaking:true});
      return x;
    });});
    setExpandedP(null);
  }
  function sendChat(){
    if(!chatInput.trim())return;
    setMsgs(function(p){return [...p,{id:Date.now(),user:"SwanyThree",text:chatInput,badge:"👑",time:fmtTime(),flag:"🇺🇸",risk:0}];});
    setChatInput("");
  }
  var activeDests=Object.values(fanoutDests).filter(Boolean).length+1;
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {showPaySheet&&<DirectPaySheet addToast={props.addToast} onClose={function(){setShowPaySheet(false);}} creatorName="SwanyThree"/>}
      {showShareSheet&&<ShareSheet addToast={props.addToast} onClose={function(){setShowShareSheet(false);}} streamTitle="Friday Night Dominos LIVE — SeeWhy" streamUrl="https://seewhylive.online/live/friday-night-dominos"/>}
      {expandedP&&(
        <div style={{position:"fixed",inset:0,zIndex:800,background:"radial-gradient(ellipse at 40% 25%,"+expandedP.color+"28,"+C.scrim+" 68%)",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:sp(4)}}>
            <div style={{display:"flex",alignItems:"center",gap:sp(3)}}>
              <div style={{width:52,height:52,background:"radial-gradient(circle at 35% 30%,"+expandedP.color+"55,"+expandedP.color+"18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontFamily:F.d,color:expandedP.color,borderRadius:8}}>{expandedP.country}{expandedP.name.charAt(0)}</div>
              <div><div style={Object.assign(fd(22),{color:expandedP.color,letterSpacing:3})}>{expandedP.name}</div><div style={Object.assign(fm(8),{color:C.t3})}>{expandedP.role}{expandedP.vip?" · VIP ⭐":""}</div></div>
            </div>
            <Btn onClick={function(){setExpandedP(null);}} variant="ghost" size="sm">CLOSE ✕</Btn>
          </div>
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:160,height:160,background:"radial-gradient(circle at 40% 35%,"+expandedP.color+"33,"+C.bg2+")",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:sp(3),borderRadius:16}}>
              <div style={{fontSize:52}}>{expandedP.country}</div>
              <AudioBars active={expandedP.live&&!expandedP.muted} color={expandedP.color} n={7} h={16}/>
            </div>
          </div>
          <div style={{padding:sp(4),display:"flex",gap:sp(2),justifyContent:"center",flexWrap:"wrap"}}>
            {[[expandedP.muted?"UNMUTE":"MUTE","mute",C.bHi],[expandedP.vip?"UN-VIP":"ADD VIP","vip",C.gHi],["SPOTLIGHT ⭐","spotlight",C.volt],["REMOVE ✕","kick",C.red]].map(function(item){
              return <button key={item[0]} onClick={function(){handleAction(item[1],expandedP.id);}} style={{background:item[2]+"18",border:"1px solid "+item[2]+"55",borderRadius:R.md+"px",padding:"8px 16px",color:item[2],fontFamily:F.d,fontSize:12,letterSpacing:1,cursor:"pointer"}}>{item[0]}</button>;
            })}
          </div>
        </div>
      )}
      <GCard style={{margin:sp(3),marginBottom:0,padding:0,overflow:"hidden",flexShrink:0}}>
        <div style={{display:"flex"}}>{[{l:"BITRATE",v:"6.4k",c:C.tHi},{l:"FPS",v:"60",c:C.volt},{l:"LATENCY",v:"1.2s",c:C.volt},{l:"QUALITY",v:"99%",c:C.volt},{l:"VPS",v:"● UP",c:C.tHi}].map(function(m,i){return <div key={i} style={{flex:1,textAlign:"center",padding:"6px 2px",borderRight:i<4?"1px solid "+C.br1:"none"}}><div style={Object.assign(fm(10),{color:m.c})}>{m.v}</div><div style={Object.assign(fd(7),{color:C.t3,letterSpacing:1})}>{m.l}</div></div>;})}</div>
      </GCard>
      <div style={{display:"flex",gap:sp(1),padding:"4px "+sp(3),flexShrink:0,flexWrap:"wrap"}}>
        {privateMode&&<Tag variant="burg">🔒 PRIVATE</Tag>}
        {audioOnlyMode&&<Tag variant="teal">🎙 AUDIO ONLY</Tag>}
        {props.tournMode&&<Tag variant="gold">🎲 TOURNAMENT</Tag>}
        {fanout&&<Tag variant="volt">📡 FANOUT LIVE</Tag>}
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
        <div style={{flex:1,overflowY:"auto",padding:sp(3),display:"flex",flexDirection:"column",gap:sp(3)}}>
          <GCard>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp(2)}}>
              <div style={Object.assign(fd(10),{color:C.gold,letterSpacing:2})}>⬡ STAGE — {props.panelists.filter(function(p){return p.live;}).length}/{MAX_PANEL} LIVE</div>
              <div style={{display:"flex",gap:sp(1)}}>
                <Btn onClick={function(){setAudioOnlyMode(function(v){return !v;});}} variant={audioOnlyMode?"teal":"ghost"} size="sm">🎙 AUDIO</Btn>
                <Btn onClick={function(){setPrivateMode(function(v){return !v;});}} variant={privateMode?"burg":"ghost"} size="sm">🔒 PRIV</Btn>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:sp(2)}}>
              {Array.from({length:MAX_PANEL}).map(function(_,i){
                var p=props.panelists[i];
                return <OctaCell key={i} p={p} sz={58} isHost={i===0} onClick={function(){if(p)setSelectedP(p===selectedP?null:p);}} onExpand={p?setExpandedP:null}/>;
              })}
            </div>
          </GCard>
          {selectedP&&(
            <GCard style={{borderColor:selectedP.color+"44"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp(2)}}><div style={Object.assign(fb(13),{color:selectedP.color})}>{selectedP.country} {selectedP.name} — {selectedP.role}</div><button onClick={function(){setSelectedP(null);}} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:14}}>✕</button></div>
              <div style={{display:"flex",gap:sp(1),flexWrap:"wrap"}}>{[[selectedP.muted?"UNMUTE":"MUTE","mute",C.bHi],["VIP ⭐","vip",C.gHi],["SPOTLIGHT","spotlight",C.volt],["⛶ EXPAND",null,C.purHi]].map(function(btn){
                return <button key={btn[0]} onClick={function(){if(btn[1]){handleAction(btn[1],selectedP.id);setSelectedP(null);}else setExpandedP(selectedP);}} style={{background:btn[2]+"14",border:"1px solid "+btn[2]+"44",borderRadius:R.sm+"px",padding:"6px 8px",color:btn[2],fontFamily:F.d,fontSize:9,cursor:"pointer"}}>{btn[0]}</button>;
              })}</div>
            </GCard>
          )}
          <div style={{display:"flex",gap:sp(2)}}>
            <Btn onClick={function(){setShowPaySheet(true);}} variant="active" style={{flex:1,justifyContent:"center"}}>💸 DIRECT PAY</Btn>
            <Btn onClick={function(){setShowShareSheet(true);}} variant="teal" style={{flex:1,justifyContent:"center"}}>📤 SHARE LIVE</Btn>
          </div>
          <GCard>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp(2)}}>
              <div style={Object.assign(fd(10),{color:C.gold,letterSpacing:2})}>📡 FANOUT — {activeDests} DEST</div>
              <Btn onClick={function(){setFanout(function(v){return !v;});props.addToast({type:fanout?"info":"sub",emoji:fanout?"⏹":"📡",msg:fanout?"Fanout stopped.":"Fanning to "+activeDests+" platforms!"});}} variant={fanout?"teal":"primary"} size="sm">{fanout?"● LIVE":"▶ START"}</Btn>
            </div>
            <div style={{display:"flex",gap:sp(1),flexWrap:"wrap"}}>{DEST_PLATFORMS.filter(function(d){return !d.fixed;}).map(function(d){
              var on=fanoutDests[d.id];
              return <button key={d.id} onClick={function(){setFanoutDests(function(p){return Object.assign({},p,{[d.id]:!p[d.id]});});}} style={{background:on?d.color+"18":"transparent",border:"1px solid "+(on?d.color+"55":C.br1),borderRadius:R.sm+"px",padding:"3px 8px",color:on?d.color:C.t3,fontFamily:F.d,fontSize:8,cursor:"pointer"}}>
                {d.icon} {d.name}
              </button>;
            })}</div>
          </GCard>
        </div>
        {chatOpen&&(
          <div style={{width:148,flexShrink:0,borderLeft:"1px solid "+C.br1,display:"flex",flexDirection:"column",background:C.bg1}}>
            <div style={{padding:"5px 6px 4px",borderBottom:"1px solid "+C.br1,flexShrink:0,display:"flex",alignItems:"center",gap:3,flexWrap:"wrap"}}>
              <span style={Object.assign(fd(8),{color:C.gold,letterSpacing:1})}>🌍 WISPRF.</span>
              <button onClick={function(){setShowLangPicker(function(v){return !v;});}} style={{background:C.bg3,border:"1px solid "+C.br1,borderRadius:3,padding:"1px 4px",fontFamily:F.m,fontSize:7,color:C.t2,cursor:"pointer"}}>{(WISPRFLOW_LANGS.find(function(l){return l.code===chatLang;})||{flag:"🌐"}).flag} {chatLang}</button>
            </div>
            {showLangPicker&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:2,padding:"4px 6px",maxHeight:60,overflowY:"auto",borderBottom:"1px solid "+C.br1}}>
                {WISPRFLOW_LANGS.map(function(l){return <button key={l.code} onClick={function(){setChatLang(l.code);setShowLangPicker(false);}} style={{padding:"1px 4px",borderRadius:3,border:"1px solid "+(chatLang===l.code?C.gold:C.br1),background:chatLang===l.code?"rgba(201,168,76,.15)":"none",color:chatLang===l.code?C.gHi:C.t2,fontFamily:F.m,fontSize:7,cursor:"pointer"}}>{l.flag} {l.code}</button>;})}
              </div>
            )}
            <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"5px 6px",display:"flex",flexDirection:"column",gap:4}}>
              {msgs.slice(-28).map(function(m){return(
                <div key={m.id}>
                  <div style={{display:"flex",gap:3,alignItems:"center"}}><span style={{fontSize:8}}>{m.flag}</span><span style={Object.assign(fd(8),{color:m.tip?C.lime:m.user==="SwanyThree"?C.volt:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:80})}>{m.user}</span>{m.badge&&<span style={{fontSize:8}}>{m.badge}</span>}{m.tip&&<span style={Object.assign(fm(7),{color:C.lime})}>💸</span>}</div>
                  <div style={Object.assign(fb(11),{color:m.tip?C.lime:C.t2,lineHeight:1.25,wordBreak:"break-word"})}>{m.text}</div>
                </div>
              );})}
            </div>
            <div style={{padding:"5px 6px",borderTop:"1px solid "+C.br1,flexShrink:0}}>
              <Inp value={chatInput} onChange={function(e){setChatInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")sendChat();}} placeholder={"Chat in "+chatLang+"..."} style={{marginBottom:4,padding:"5px 7px",fontSize:11}}/>
              <button onClick={sendChat} style={{width:"100%",background:"linear-gradient(135deg,"+C.burg+","+C.bHi+")",border:"none",borderRadius:R.sm+"px",padding:"5px 0",color:C.t1,fontFamily:F.d,fontSize:10,cursor:"pointer"}}>SEND</button>
            </div>
          </div>
        )}
      </div>
      <div style={{background:"linear-gradient(180deg,"+C.bg1+","+C.bg3+")",borderTop:"1px solid "+C.gold+"22",padding:sp(2)+" "+sp(3),display:"flex",gap:sp(2),alignItems:"center",flexShrink:0}}>
        <button onClick={function(){props.setIsLive(function(v){return !v;});props.addToast({type:props.isLive?"info":"tip",emoji:props.isLive?"⏹":"🔴",msg:props.isLive?"Broadcast ended.":"You are LIVE on SeeWhy!"});}} style={{flex:2,padding:"9px 0",background:props.isLive?"rgba(40,30,50,.9)":"linear-gradient(135deg,"+C.burg+","+C.bHi+")",border:"2px solid "+(props.isLive?C.t4:C.bGlow),borderRadius:R.md+"px",color:C.t1,fontFamily:F.d,fontSize:14,letterSpacing:".15em",cursor:"pointer"}}>{props.isLive?"⏹ END STREAM":"🔴 GO LIVE"}</button>
        <Btn onClick={function(){setShowShareSheet(true);}} variant="teal" size="sm">📤</Btn>
        <Btn onClick={function(){setShowPaySheet(true);}} variant="active" size="sm">💸</Btn>
        <button onClick={function(){props.setPanelists(function(p){return p.map(function(x){return Object.assign({},x,{muted:true});});});props.addToast({type:"warn",emoji:"🔇",msg:"All panelists muted"});}} style={{padding:"9px 8px",background:"transparent",border:"1px solid "+C.br1,borderRadius:R.md+"px",color:C.t3,fontFamily:F.d,fontSize:10,cursor:"pointer"}}>🔇</button>
        <button onClick={function(){setChatOpen(function(v){return !v;});}} style={{background:chatOpen?C.tD:"transparent",border:"1px solid "+(chatOpen?C.tHi:C.br1),borderRadius:R.sm+"px",padding:"5px 8px",color:chatOpen?C.tHi:C.t3,fontFamily:F.d,fontSize:9,cursor:"pointer"}}>💬</button>
      </div>
    </div>
  );
}

/* ─── VIDEO POSTS ─────────────────────────────────────────────── */
function VideoPostsPanel(props){
  var [recording,setRecording]=useState(false);
  var [recSecs,setRecSecs]=useState(0);
  var [posts,setPosts]=useState([
    {id:"vp1",title:"Washington Classic Highlights",duration:342,views:1204,ts:"2h ago",thumb:"🎲",shared:["Instagram","TikTok"]},
    {id:"vp2",title:"Domino technique breakdown",duration:187,views:892,ts:"1d ago",thumb:"🏆",shared:["YouTube"]},
    {id:"vp3",title:"SwanyThree freestyle Friday",duration:480,views:4821,ts:"3d ago",thumb:"🎤",shared:["TikTok","Instagram","Snapchat"]},
  ]);
  var [shareTarget,setShareTarget]=useState(null);
  var recRef=useRef(null);
  useEffect(function(){
    if(!recording)return;
    recRef.current=setInterval(function(){
      setRecSecs(function(s){
        if(s>=MAX_VIDEO_SECS){setRecording(false);clearInterval(recRef.current);props.addToast({type:"volt",emoji:"⏹",msg:"Max 10 min reached!"});return s;}
        return s+1;
      });
    },1000);
    return function(){clearInterval(recRef.current);};
  },[recording]);
  var stopRecord=function(){
    setRecording(false);clearInterval(recRef.current);
    var np={id:"vp"+Date.now(),title:"Video Post — "+fmtTime(),duration:recSecs,views:0,ts:"just now",thumb:pick(["🎲","🔥","⚡","💎","👑"]),shared:[]};
    setPosts(function(prev){return [np,...prev];});setRecSecs(0);
    props.addToast({type:"teal",emoji:"🎬",msg:"Video post saved! Ready to share."});
  };
  var remaining=MAX_VIDEO_SECS-recSecs;
  var recPct=(recSecs/MAX_VIDEO_SECS)*100;
  return(
    <div style={{padding:sp(3),display:"flex",flexDirection:"column",gap:sp(3),overflowY:"auto",height:"100%"}}>
      {shareTarget&&<ShareSheet onClose={function(){setShareTarget(null);}} addToast={props.addToast} streamTitle={shareTarget.title} streamUrl={"https://seewhylive.online/post/"+shareTarget.id}/>}
      <GCard><div style={Object.assign(fd(16),{color:C.volt,letterSpacing:3,marginBottom:4})}>🎬 VIDEO POSTS</div><div style={Object.assign(fm(8),{color:C.t3})}>Max {MAX_VIDEO_SECS/60} min · Share to Instagram, TikTok, Snapchat and more</div></GCard>
      <GCard style={{border:"1px solid "+(recording?C.bHi+"55":C.br1)}}>
        {recording&&<div style={{marginBottom:sp(2)}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <div style={{display:"flex",alignItems:"center",gap:sp(2)}}><div style={{width:10,height:10,borderRadius:"50%",background:C.bGlow}}/><span style={Object.assign(fd(13),{color:C.bHi,letterSpacing:2})}>RECORDING</span></div>
            <span style={Object.assign(fm(11),{color:remaining<30?C.bHi:C.t2})}>{fmtTimer(recSecs)} / {fmtTimer(MAX_VIDEO_SECS)}</span>
          </div>
          <div style={{height:6,background:C.bg3,borderRadius:3,overflow:"hidden"}}><div style={{width:recPct+"%",height:"100%",background:"linear-gradient(90deg,"+C.burg+","+C.bGlow+")",borderRadius:3,transition:"width .5s ease"}}/></div>
          <div style={{textAlign:"right",marginTop:2,fontFamily:F.m,fontSize:8,color:remaining<60?C.bHi:C.t3}}>{fmtTimer(remaining)} remaining</div>
        </div>}
        <div style={{display:"flex",gap:sp(2)}}>
          {!recording
            ?<Btn variant="primary" full size="lg" onClick={function(){setRecording(true);setRecSecs(0);props.addToast({type:"burg",emoji:"⏺",msg:"Recording started!"});}}>⏺ START RECORDING</Btn>
            :<Btn variant="danger" full size="lg" onClick={stopRecord}>⏹ STOP AND SAVE</Btn>
          }
        </div>
      </GCard>
      <div style={Object.assign(fd(10),{color:C.t3,letterSpacing:2})}>{posts.length} VIDEO POSTS</div>
      {posts.map(function(post){return(
        <GCard key={post.id} style={{padding:"11px 13px"}}>
          <div style={{display:"flex",gap:sp(2),alignItems:"center"}}>
            <div style={{width:52,height:52,borderRadius:8,background:C.bg3,border:"1px solid "+C.br1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{post.thumb}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={Object.assign(fb(12),{color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"})}>{post.title}</div>
              <div style={{display:"flex",gap:sp(2),marginTop:2}}><span style={Object.assign(fm(8),{color:C.t3})}>⏱ {fmtTimer(post.duration)}</span><span style={Object.assign(fm(8),{color:C.t3})}>👁 {fmtN(post.views)}</span><span style={Object.assign(fm(8),{color:C.t4})}>{post.ts}</span></div>
              {post.shared.length>0&&<div style={{display:"flex",gap:2,marginTop:3,flexWrap:"wrap"}}>{post.shared.map(function(s){return <Tag key={s} variant="teal" style={{fontSize:7}}>{s}</Tag>;})}</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:sp(1),flexShrink:0}}>
              <Btn variant="teal" size="sm" onClick={function(){setShareTarget(post);}}>📤 SHARE</Btn>
              <Btn variant="ghost" size="sm" onClick={function(){props.addToast({type:"gold",emoji:"💰",msg:"Paywall set!"});}}>💰 PAYWALL</Btn>
            </div>
          </div>
        </GCard>
      );})}
    </div>
  );
}

/* ─── AI CHAT PANEL ───────────────────────────────────────────── */
function AIChatPanel(props){
  var [msgs,setMsgs]=useState([{role:"ai",text:props.icon+" "+props.label+" ONLINE — SeeWhy LIVE v33. Direct Pay live. 90/10 SACRED. Let the bones fall. 🔥",time:fmtTime()}]);
  var [input,setInput]=useState("");
  var [loading,setLoading]=useState(false);
  var chatRef=useRef(null);
  useEffect(function(){if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[msgs]);
  function fire(prompt,userMsg){
    setLoading(true);
    if(userMsg)setMsgs(function(p){return [...p,{role:"user",text:userMsg,time:fmtTime()}];});
    callClaude(props.system,props.viewers.toLocaleString()+" viewers. "+(props.isLive?"LIVE":"OFFLINE")+". "+prompt)
      .then(function(reply){setMsgs(function(p){return [...p,{role:"ai",text:reply||(props.icon+" reconnecting..."),time:fmtTime()}];});setLoading(false);})
      .catch(function(){setMsgs(function(p){return [...p,{role:"ai",text:"⚡ Signal dropped — check API key.",time:fmtTime()}];});setLoading(false);});
  }
  return(
    <div style={{padding:sp(3),display:"flex",flexDirection:"column",gap:sp(3),height:"100%",overflow:"hidden"}}>
      <GCard style={{borderColor:props.color+"55",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:sp(3),marginBottom:sp(3)}}>
          <div style={{width:44,height:44,background:props.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,borderRadius:8}}>{props.icon}</div>
          <div><div style={Object.assign(fd(16),{color:props.color,letterSpacing:3})}>{props.label}</div><div style={Object.assign(fm(8),{color:C.t3})}>claude-sonnet-4-20250514 · v33</div></div>
          {loading&&<div style={{marginLeft:"auto"}}><ThinkDots color={props.color}/></div>}
        </div>
        <div style={{display:"flex",gap:sp(1),flexWrap:"wrap"}}>{(props.qprompts||[]).map(function(q){return <button key={q.l} onClick={function(){fire(q.p);}} disabled={loading} style={{background:props.color+"12",border:"1px solid "+props.color+"33",borderRadius:R.sm+"px",padding:"3px 9px",color:props.color,fontFamily:F.d,fontSize:9,cursor:loading?"not-allowed":"pointer",opacity:loading?0.5:1}}>{q.l}</button>;})} </div>
      </GCard>
      <GCard style={{borderColor:props.color+"22",flex:1,overflowY:"auto"}}>
        <div ref={chatRef} style={{display:"flex",flexDirection:"column",gap:sp(2)}}>
          {msgs.map(function(m,i){return(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"85%",background:m.role==="ai"?"linear-gradient(135deg,"+props.color+"22,"+props.color+"11)":"linear-gradient(135deg,"+C.burg+","+C.bHi+")",border:"1px solid "+(m.role==="ai"?props.color+"44":C.bHi+"66"),borderRadius:8,padding:"8px 11px"}}>
                {m.role==="ai"&&<div style={Object.assign(fd(7),{color:props.color,marginBottom:3})}>{props.icon} {props.label}</div>}
                <div style={Object.assign(fb(13),{color:C.t1,lineHeight:1.35})}>{m.text}</div>
                <div style={Object.assign(fm(7),{color:C.t4,marginTop:3,textAlign:m.role==="user"?"right":"left"})}>{m.time}</div>
              </div>
            </div>
          );})}
          {loading&&<ThinkDots color={props.color}/>}
        </div>
      </GCard>
      <div style={{display:"flex",gap:sp(2),flexShrink:0}}>
        <Inp value={input} onChange={function(e){setInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&input.trim()&&!loading){fire(input,input);setInput("");}}} placeholder={"Chat with "+props.label+"..."} disabled={loading} style={{flex:1}}/>
        <Btn onClick={function(){if(input.trim()&&!loading){fire(input,input);setInput("");} }} disabled={loading} variant="ghost" style={{borderColor:props.color+"44",color:props.color,background:props.color+"10"}}>SEND</Btn>
      </div>
    </div>
  );
}

/* ─── PK BATTLE PANEL ─────────────────────────────────────────────── */
function PKBattlePanel(props){
  var [battleState,setBattleState]=useState("idle");
  var [challenger,setChallenger]=useState({name:"SwanyThree",score:0});
  var [defender,setDefender]=useState({name:"",score:0});
  var [defName,setDefName]=useState("");
  var [duration,setDuration]=useState(3);
  var [countdown,setCountdown]=useState(0);
  var [winner,setWinner]=useState(null);
  var [myVote,setMyVote]=useState(null);
  var [log,setLog]=useState([]);
  var timerRef=useRef(null);
  var scoreRef=useRef(null);
  var durations=[1,3,5,10];
  function startBattle(){
    if(!defName.trim())return;
    setDefender({name:defName.trim(),score:0});
    setChallenger(function(p){return Object.assign({},p,{score:0});});
    setCountdown(duration*60);
    setBattleState("active");
    setWinner(null);setMyVote(null);setLog([]);
    setLog(function(p){return [{t:fmtTime(),msg:"⚡ BATTLE STARTED — "+duration+" MIN"}];});
  }
  useEffect(function(){
    if(battleState!=="active")return;
    timerRef.current=setInterval(function(){
      setCountdown(function(c){
        if(c<=1){
          clearInterval(timerRef.current);
          clearInterval(scoreRef.current);
          setBattleState("ended");
          return 0;
        }
        return c-1;
      });
    },1000);
    scoreRef.current=setInterval(function(){
      var cInc=Math.floor(Math.random()*120);
      var dInc=Math.floor(Math.random()*120);
      setChallenger(function(p){return Object.assign({},p,{score:p.score+cInc});});
      setDefender(function(p){return Object.assign({},p,{score:p.score+dInc});});
      if(Math.random()>.7){
        var events=["🔥 x50 HYPE storm!","💎 Diamond gift!","👑 VIP vote wave","⚡ Shock wave +200","💸 Direct pay tip!"];
        setLog(function(p){return [...p.slice(-7),{t:fmtTime(),msg:pick(events)}];});
      }
    },2000);
    return function(){clearInterval(timerRef.current);clearInterval(scoreRef.current);};
  },[battleState]);
  useEffect(function(){
    if(battleState!=="ended")return;
    var w=challenger.score>=defender.score?challenger.name:defender.name;
    setWinner(w);
    setLog(function(p){return [...p,{t:fmtTime(),msg:"🏆 "+w+" WINS THE BATTLE!"}];});
    props.addToast({type:"gold",emoji:"🏆",msg:w+" wins the PK Battle!"});
  },[battleState]);
  var total=challenger.score+defender.score||1;
  var cPct=Math.floor((challenger.score/total)*100);
  var isRed=countdown<=30&&battleState==="active";
  return(
    <div style={{padding:sp(2),display:"flex",flexDirection:"column",gap:sp(2),height:"100%",overflowY:"auto"}}>
      <GCard>
        <div style={Object.assign(fd(18),{color:C.bHi,letterSpacing:3,marginBottom:4})}>⚡ PK BATTLE</div>
        <div style={Object.assign(fm(8),{color:C.t3})}>1v1 live competition · viewers vote in real-time</div>
      </GCard>
      {battleState==="idle"&&(
        <GCard>
          <div style={Object.assign(fb(12),{color:C.t2,marginBottom:sp(2)})}>Setup Battle</div>
          <div style={Object.assign(fb(10),{color:C.t3,marginBottom:4})}>Defender name</div>
          <Inp value={defName} onChange={function(e){setDefName(e.target.value);}} placeholder="Enter opponent name..." style={{marginBottom:sp(2)}}/>
          <div style={Object.assign(fb(10),{color:C.t3,marginBottom:sp(1)})}>Duration</div>
          <div style={{display:"flex",gap:sp(1),marginBottom:sp(2)}}>
            {durations.map(function(d){return(
              <button key={d} onClick={function(){setDuration(d);}} style={{flex:1,padding:"6px 4px",borderRadius:6,background:duration===d?C.bHi+"22":"transparent",border:"1px solid "+(duration===d?C.bHi:C.br1),color:duration===d?C.bHi:C.t3,fontFamily:F.d,fontSize:11,cursor:"pointer"}}>{d} MIN</button>
            );} )}
          </div>
          <Btn variant="primary" full onClick={startBattle}>⚡ START BATTLE</Btn>
        </GCard>
      )}
      {(battleState==="active"||battleState==="ended")&&(
        <GCard style={{borderColor:isRed?C.bHi+"44":C.br1}}>
          <div style={{textAlign:"center",marginBottom:sp(2)}}>
            <div style={Object.assign(fd(isRed?22:18),{color:isRed?C.bGlow:C.t1,animation:isRed?"pulse .5s ease infinite":"none"})}>{battleState==="ended"?"BATTLE OVER":fmtTimer(countdown)}</div>
            {winner&&<div style={Object.assign(fd(13),{color:C.gHi,marginTop:4})}>🏆 {winner} WINS!</div>}
          </div>
          <div style={{display:"flex",gap:sp(2),marginBottom:sp(2)}}>
            {[challenger,defender].map(function(p,idx){
              var pct=idx===0?cPct:(100-cPct);
              return(
                <div key={idx} style={{flex:1,textAlign:"center"}}>
                  <div style={Object.assign(fd(13),{color:idx===0?C.gold:C.bHi,marginBottom:3})}>{p.name}</div>
                  <div style={Object.assign(fd(16),{color:C.t1})}>{fmtN(p.score)}</div>
                  <div style={{height:6,background:C.bg3,borderRadius:3,marginTop:4,overflow:"hidden"}}>
                    <div style={{width:pct+"%",height:"100%",background:idx===0?"linear-gradient(90deg,"+C.gold+","+C.gHi+")":"linear-gradient(90deg,"+C.burg+","+C.bHi+")",borderRadius:3,transition:"width .4s ease"}}/>
                  </div>
                  <div style={Object.assign(fm(8),{color:C.t3,marginTop:2})}>{pct}%</div>
                </div>
              );
            })}
          </div>
          {battleState==="active"&&!myVote&&(
            <div>
              <div style={Object.assign(fb(9),{color:C.t3,textAlign:"center",marginBottom:sp(1)})}>Vote for your pick</div>
              <div style={{display:"flex",gap:sp(2)}}>
                <Btn variant="active" full onClick={function(){setMyVote(challenger.name);props.addToast({type:"gold",emoji:"⚡",msg:"Voted for "+challenger.name+"!"});}}>{challenger.name} 👑</Btn>
                <Btn variant="primary" full onClick={function(){setMyVote(defender.name);props.addToast({type:"burg",emoji:"⚡",msg:"Voted for "+defender.name+"!"});}}>{defender.name} 🔴</Btn>
              </div>
            </div>
          )}
          {myVote&&<div style={{textAlign:"center"}}><Tag variant="teal">✓ Voted: {myVote}</Tag></div>}
          {battleState==="ended"&&<Btn variant="ghost" full onClick={function(){setBattleState("idle");setDefName("");setWinner(null);setMyVote(null);}}>↩ NEW BATTLE</Btn>}
        </GCard>
      )}
      {log.length>0&&(
        <GCard>
          <div style={Object.assign(fd(9),{color:C.t3,letterSpacing:2,marginBottom:sp(1)})}>BATTLE LOG</div>
          {log.slice(-6).map(function(e,i){return(
            <div key={i} style={{display:"flex",gap:sp(1),alignItems:"center",marginBottom:3}}>
              <span style={Object.assign(fm(7),{color:C.t4})}>{e.t}</span>
              <span style={Object.assign(fb(11),{color:C.t1})}>{e.msg}</span>
            </div>
          );})}
        </GCard>
      )}
    </div>
  );
}

/* ─── MONETIZE PANEL ──────────────────────────────────────────────── */
function MonetizePanel(props){
  var [subtab,setSubtab]=useState("overview");
  var earningsCents=412750;
  var pendingCents=87500;
  var creatorCents=Math.floor(earningsCents*CREATOR);
  var platformCents=Math.floor(earningsCents*PLATFORM);
  var tabs=["overview","tiers","payouts"];
  var tiers=[
    {name:"FAN",price:299,perks:["Exclusive badge","Chat effects","Early access"]},
    {name:"SUPPORTER",price:999,perks:["All FAN perks","Private streams","Direct shoutouts","Monthly gift box"]},
    {name:"RIDE OR DIE",price:2999,perks:["ALL perks","1-on-1 sessions","Co-host access","Merch discount 30%"]},
  ];
  return(
    <div style={{padding:sp(2),display:"flex",flexDirection:"column",gap:sp(2),height:"100%",overflowY:"auto"}}>
      <GCard>
        <div style={Object.assign(fd(18),{color:C.gHi,letterSpacing:3,marginBottom:4})}>💰 MONETIZE</div>
        <div style={Object.assign(fm(8),{color:C.t3})}>{Math.floor(CREATOR*100)}% creator / {Math.floor(PLATFORM*100)}% platform · IMMUTABLE</div>
      </GCard>
      <div style={{display:"flex",gap:sp(1)}}>
        {tabs.map(function(t){return(
          <button key={t} onClick={function(){setSubtab(t);}} style={{flex:1,padding:"6px 4px",borderRadius:6,background:subtab===t?C.gold+"22":"transparent",border:"1px solid "+(subtab===t?C.gHi:C.br1),color:subtab===t?C.gHi:C.t3,fontFamily:F.d,fontSize:9,cursor:"pointer",letterSpacing:1}}>{t.toUpperCase()}</button>
        );})}
      </div>
      {subtab==="overview"&&(
        <div style={{display:"flex",flexDirection:"column",gap:sp(2)}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp(2)}}>
            {[
              {l:"TOTAL EARNINGS",v:fmtCents(earningsCents),c:C.gHi},
              {l:"YOUR CUT (90%)",v:fmtCents(creatorCents),c:C.tHi},
              {l:"PENDING PAYOUT",v:fmtCents(pendingCents),c:C.volt},
              {l:"PLATFORM (10%)",v:fmtCents(platformCents),c:C.t3},
            ].map(function(m){return(
              <GCard key={m.l} style={{textAlign:"center",padding:sp(2)}}>
                <div style={Object.assign(fd(15),{color:m.c})}>{m.v}</div>
                <div style={Object.assign(fm(7),{color:C.t4,marginTop:2})}>{m.l}</div>
              </GCard>
            );})}
          </div>
          <GCard>
            <div style={Object.assign(fd(10),{color:C.gold,letterSpacing:2,marginBottom:sp(1)})}>REVENUE SOURCES</div>
            {[
              {l:"Subscriptions",v:fmtCents(183200),pct:44},
              {l:"Gifts & Tips",v:fmtCents(142800),pct:35},
              {l:"Direct Pay",v:fmtCents(86750),pct:21},
            ].map(function(s){return(
              <div key={s.l} style={{marginBottom:sp(1)}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={Object.assign(fb(11),{color:C.t2})}>{s.l}</span>
                  <span style={Object.assign(fm(9),{color:C.gHi})}>{s.v}</span>
                </div>
                <div style={{height:4,background:C.bg3,borderRadius:2,overflow:"hidden"}}>
                  <div style={{width:s.pct+"%",height:"100%",background:"linear-gradient(90deg,"+C.gold+","+C.gHi+")",borderRadius:2}}/>
                </div>
              </div>
            );})}
          </GCard>
        </div>
      )}
      {subtab==="tiers"&&(
        <div style={{display:"flex",flexDirection:"column",gap:sp(2)}}>
          {tiers.map(function(tier){return(
            <GCard key={tier.name} style={{borderColor:C.gold+"33"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp(1)}}>
                <div style={Object.assign(fd(14),{color:C.gHi,letterSpacing:2})}>{tier.name}</div>
                <div style={Object.assign(fd(13),{color:C.t1})}>{fmtCents(tier.price)}<span style={Object.assign(fm(8),{color:C.t3})}>/mo</span></div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {tier.perks.map(function(perk){return(
                  <div key={perk} style={{display:"flex",gap:sp(1),alignItems:"center"}}>
                    <span style={{color:C.tHi,fontSize:10}}>✓</span>
                    <span style={Object.assign(fb(11),{color:C.t2})}>{perk}</span>
                  </div>
                );})}
              </div>
            </GCard>
          );})}
        </div>
      )}
      {subtab==="payouts"&&(
        <GCard>
          <div style={Object.assign(fd(12),{color:C.t2,letterSpacing:2,marginBottom:sp(2)})}>PAYOUT REQUEST</div>
          <div style={{marginBottom:sp(2)}}>
            <div style={Object.assign(fb(11),{color:C.t3,marginBottom:4})}>Available balance</div>
            <div style={Object.assign(fd(22),{color:C.gHi})}>{fmtCents(pendingCents)}</div>
          </div>
          <Btn variant="active" full onClick={function(){props.addToast({type:"gold",emoji:"💰",msg:"Payout of "+fmtCents(pendingCents)+" requested!"});}}>💰 REQUEST PAYOUT</Btn>
          <div style={Object.assign(fm(8),{color:C.t4,marginTop:sp(1),textAlign:"center"})}>Min $10.00 · Stripe Connect · 2-5 business days</div>
        </GCard>
      )}
    </div>
  );
}

/* ─── ANALYTICS PANEL ─────────────────────────────────────────────── */
function AnalyticsPanel(props){
  var supporters=[
    {name:"GoldTipper",total:fmtCents(24500),badge:"💎"},
    {name:"WashClass2025",total:fmtCents(18750),badge:"👑"},
    {name:"FanRider99",total:fmtCents(12200),badge:"🌟"},
    {name:"VibeNation",total:fmtCents(8900),badge:"⚡"},
    {name:"DominoKing",total:fmtCents(6400),badge:"🏆"},
  ];
  return(
    <div style={{padding:sp(2),display:"flex",flexDirection:"column",gap:sp(2),height:"100%",overflowY:"auto"}}>
      <GCard>
        <div style={Object.assign(fd(18),{color:C.purHi,letterSpacing:3,marginBottom:4})}>📊 ANALYTICS</div>
        <div style={Object.assign(fm(8),{color:C.t3})}>Live stream performance & revenue data</div>
      </GCard>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp(2)}}>
        {[
          {l:"VIEWERS NOW",v:props.viewers,c:C.tHi,icon:"👁"},
          {l:"PEAK TODAY",v:1847,c:C.volt,icon:"📈"},
          {l:"TOTAL STREAMS",v:142,c:C.gold,icon:"🎥"},
          {l:"AVG WATCH",v:"24m",c:C.purHi,icon:"⏱"},
        ].map(function(m){return(
          <GCard key={m.l} style={{textAlign:"center",padding:sp(2)}}>
            <div style={{fontSize:18,marginBottom:3}}>{m.icon}</div>
            <div style={Object.assign(fd(18),{color:m.c})}>{m.v}</div>
            <div style={Object.assign(fm(7),{color:C.t4,marginTop:2})}>{m.l}</div>
          </GCard>
        );})}
      </div>
      <GCard>
        <div style={Object.assign(fd(10),{color:C.gold,letterSpacing:2,marginBottom:sp(1)})}>TOP SUPPORTERS</div>
        {supporters.map(function(s,i){return(
          <div key={s.name} style={{display:"flex",alignItems:"center",gap:sp(2),padding:"6px 0",borderBottom:i<supporters.length-1?"1px solid "+C.br1:"none"}}>
            <div style={{width:20,textAlign:"center"}}><span style={Object.assign(fm(9),{color:C.t3})}>{i+1}</span></div>
            <div style={{flex:1}}><span style={Object.assign(fb(12),{color:C.t1})}>{s.badge} {s.name}</span></div>
            <div style={Object.assign(fd(12),{color:C.gHi})}>{s.total}</div>
          </div>
        );})}
      </GCard>
      <GCard>
        <div style={Object.assign(fd(10),{color:C.tHi,letterSpacing:2,marginBottom:sp(1)})}>STREAM HEALTH</div>
        {[
          {l:"Bitrate",v:"6.4 kbps",ok:true},
          {l:"FPS",v:"60",ok:true},
          {l:"Latency",v:"1.2s",ok:true},
          {l:"VPS Status",v:"ONLINE",ok:true},
          {l:"CDN Edge",v:"Active",ok:true},
        ].map(function(h){return(
          <div key={h.l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid "+C.br1}}>
            <span style={Object.assign(fb(11),{color:C.t2})}>{h.l}</span>
            <span style={Object.assign(fm(9),{color:h.ok?C.tHi:C.bHi})}>{h.ok?"● ":""}{h.v}</span>
          </div>
        );})}
      </GCard>
    </div>
  );
}

/* ─── INS FORGE PANEL ─────────────────────────────────────────────── */
function InsForgePanel(props){
  var [topic,setTopic]=useState("");
  var [mode,setMode]=useState("title");
  var [result,setResult]=useState("");
  var [loading,setLoading]=useState(false);
  var modes=[
    {id:"title",label:"STREAM TITLE",prompt:"Generate 5 punchy, engaging live stream titles for a dominos/gaming stream"},
    {id:"caption",label:"POST CAPTION",prompt:"Write 3 short social media captions (Instagram/TikTok style) for a live streaming event"},
    {id:"bio",label:"CREATOR BIO",prompt:"Write a sharp, compelling creator bio for a SeeWhy LIVE dominos and gaming streamer"},
    {id:"hook",label:"HYPE HOOK",prompt:"Write 3 attention-grabbing opening lines to start a live stream with maximum energy"},
  ];
  function forge(){
    if(loading)return;
    setLoading(true);setResult("");
    var selectedMode=modes.find(function(m){return m.id===mode;});
    var sys="You are InsForge, a content creation AI for SeeWhy LIVE streaming platform. Create punchy, street-culture-savvy content. Be concise and energetic.";
    var msg=(selectedMode?selectedMode.prompt:"Generate content")+(topic?" Topic/context: "+topic:"");
    callClaude(sys,msg)
      .then(function(r){setResult(r);setLoading(false);})
      .catch(function(){setResult("⚡ InsForge offline — check API connection.");setLoading(false);});
  }
  return(
    <div style={{padding:sp(2),display:"flex",flexDirection:"column",gap:sp(2),height:"100%",overflowY:"auto"}}>
      <GCard>
        <div style={Object.assign(fd(18),{color:C.volt,letterSpacing:3,marginBottom:4})}>✨ INS FORGE</div>
        <div style={Object.assign(fm(8),{color:C.t3})}>AI-powered content creation · Claude-sonnet-4-20250514</div>
      </GCard>
      <GCard>
        <div style={Object.assign(fb(10),{color:C.t3,marginBottom:sp(1)})}>Content type</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp(1),marginBottom:sp(2)}}>
          {modes.map(function(m){return(
            <button key={m.id} onClick={function(){setMode(m.id);}} style={{padding:"7px 4px",borderRadius:6,background:mode===m.id?C.volt+"14":"transparent",border:"1px solid "+(mode===m.id?C.volt:C.br1),color:mode===m.id?C.volt:C.t3,fontFamily:F.d,fontSize:9,cursor:"pointer",letterSpacing:.5}}>{m.label}</button>
          );})}
        </div>
        <div style={Object.assign(fb(10),{color:C.t3,marginBottom:4})}>Context (optional)</div>
        <Inp value={topic} onChange={function(e){setTopic(e.target.value);}} placeholder="Topic, guest names, theme..." style={{marginBottom:sp(2)}}/>
        <Btn variant="volt" full onClick={forge} disabled={loading}>{loading?<ThinkDots color={C.volt}/>:"✨ FORGE CONTENT"}</Btn>
      </GCard>
      {result&&(
        <GCard style={{borderColor:C.volt+"33"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp(1)}}>
            <Tag variant="volt">✨ FORGED</Tag>
            <Btn variant="ghost" size="sm" onClick={function(){try{navigator.clipboard.writeText(result);}catch(e){}props.addToast({type:"volt",emoji:"📋",msg:"Copied to clipboard!"});}}>📋 COPY</Btn>
          </div>
          <div style={Object.assign(fb(12),{color:C.t1,lineHeight:1.5,whiteSpace:"pre-wrap"})}>{result}</div>
        </GCard>
      )}
    </div>
  );
}

/* ─── SCHEDULE PANEL ──────────────────────────────────────────────── */
function SchedulePanel(props){
  var [title,setTitle]=useState("");
  var [dateVal,setDateVal]=useState("");
  var [timeVal,setTimeVal]=useState("");
  var [desc,setDesc]=useState("");
  var [scheduled,setScheduled]=useState([
    {id:1,title:"Friday Night Dominos — Washington Classic",date:"Fri Jun 6",time:"9:00 PM",viewers:0},
    {id:2,title:"SwanyThree vs. DominoKing — REMATCH",date:"Sat Jun 7",time:"8:00 PM",viewers:0},
  ]);
  function addSchedule(){
    if(!title.trim()||!dateVal||!timeVal)return;
    var ns={id:Date.now(),title:title,date:dateVal,time:timeVal,viewers:0};
    setScheduled(function(p){return [ns,...p];});
    setTitle("");setDateVal("");setTimeVal("");setDesc("");
    props.addToast({type:"teal",emoji:"📅",msg:"Stream scheduled!"});
  }
  return(
    <div style={{padding:sp(2),display:"flex",flexDirection:"column",gap:sp(2),height:"100%",overflowY:"auto"}}>
      <GCard>
        <div style={Object.assign(fd(18),{color:C.tHi,letterSpacing:3,marginBottom:4})}>📅 SCHEDULE</div>
        <div style={Object.assign(fm(8),{color:C.t3})}>Plan upcoming streams · auto-reminders to followers</div>
      </GCard>
      <GCard>
        <div style={Object.assign(fb(12),{color:C.t2,marginBottom:sp(2)})}>New Scheduled Stream</div>
        <Inp value={title} onChange={function(e){setTitle(e.target.value);}} placeholder="Stream title..." style={{marginBottom:sp(1)}}/>
        <div style={{display:"flex",gap:sp(1),marginBottom:sp(1)}}>
          <input type="date" value={dateVal} onChange={function(e){setDateVal(e.target.value);}} style={{flex:1,background:C.bg3,border:"1px solid "+C.br1,borderRadius:R.sm+"px",padding:"8px 11px",color:C.t1,fontFamily:F.b,fontSize:12}}/>
          <input type="time" value={timeVal} onChange={function(e){setTimeVal(e.target.value);}} style={{flex:1,background:C.bg3,border:"1px solid "+C.br1,borderRadius:R.sm+"px",padding:"8px 11px",color:C.t1,fontFamily:F.b,fontSize:12}}/>
        </div>
        <Inp value={desc} onChange={function(e){setDesc(e.target.value);}} placeholder="Description (optional)..." style={{marginBottom:sp(2)}}/>
        <Btn variant="teal" full onClick={addSchedule}>📅 SCHEDULE STREAM</Btn>
      </GCard>
      <div style={Object.assign(fd(9),{color:C.t3,letterSpacing:2})}>{scheduled.length} UPCOMING</div>
      {scheduled.map(function(s){return(
        <GCard key={s.id}>
          <div style={Object.assign(fb(13),{color:C.t1,marginBottom:3})}>{s.title}</div>
          <div style={{display:"flex",gap:sp(2),alignItems:"center"}}>
            <Tag variant="teal">📅 {s.date}</Tag>
            <Tag variant="gold">🕐 {s.time}</Tag>
            <Btn variant="ghost" size="sm" onClick={function(){setScheduled(function(p){return p.filter(function(x){return x.id!==s.id;});});props.addToast({type:"info",emoji:"🗑",msg:"Removed."});}}>✕</Btn>
          </div>
        </GCard>
      );})}
    </div>
  );
}

/* ─── MORE SHEET ──────────────────────────────────────────────────── */
function MoreSheet(props){
  var items=[
    {icon:"💰",label:"Monetize",tab:"monetize",color:C.gHi},
    {icon:"📊",label:"Analytics",tab:"analytics",color:C.purHi},
    {icon:"📅",label:"Schedule",tab:"schedule",color:C.tHi},
    {icon:"✨",label:"InsForge",tab:"insforge",color:C.volt},
    {icon:"🤖",label:"SwanAI",tab:"swanai",color:C.tHi},
    {icon:"📤",label:"Share",tab:"share",color:C.bHi},
    {icon:"🌐",label:"Portal",tab:"portal",color:C.purHi},
    {icon:"⚙",label:"Settings",tab:"settings",color:C.t3},
  ];
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"flex-end",backdropFilter:"blur(6px)"}} onClick={function(e){if(e.target===e.currentTarget)props.onClose();}}>
      <div style={{width:"100%",maxWidth:480,margin:"0 auto",background:C.bg2,borderRadius:"20px 20px 0 0",border:"1px solid "+C.br2,padding:sp(3),paddingBottom:32,animation:"paySlide .25s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp(3)}}>
          <div style={Object.assign(fd(16),{color:C.t1,letterSpacing:3})}>MORE FEATURES</div>
          <Btn variant="ghost" size="sm" onClick={props.onClose}>✕</Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:sp(2)}}>
          {items.map(function(item){return(
            <button key={item.tab} onClick={function(){props.setActiveTab(item.tab);props.onClose();}} style={{background:item.color+"0F",border:"1px solid "+item.color+"2A",borderRadius:R.md+"px",padding:"12px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer"}}>
              <span style={{fontSize:22}}>{item.icon}</span>
              <span style={Object.assign(fd(8),{color:item.color,letterSpacing:.5})}>{item.label}</span>
            </button>
          );})}
        </div>
      </div>
    </div>
  );
}

/* ─── PORTAL PANEL ────────────────────────────────────────────────── */
function PortalPanel(props){
  return(
    <div style={{padding:sp(2),display:"flex",flexDirection:"column",gap:sp(2),height:"100%",overflowY:"auto"}}>
      <GCard>
        <div style={Object.assign(fd(18),{color:C.purHi,letterSpacing:3,marginBottom:4})}>🌐 PORTAL</div>
        <div style={Object.assign(fm(8),{color:C.t3})}>Multi-platform streaming management</div>
      </GCard>
      {DEST_PLATFORMS.map(function(p){return(
        <GCard key={p.id} style={{borderColor:p.color+"22"}}>
          <div style={{display:"flex",alignItems:"center",gap:sp(3)}}>
            <div style={{width:40,height:40,borderRadius:8,background:p.color+"1A",border:"1px solid "+p.color+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{p.icon}</div>
            <div style={{flex:1}}>
              <div style={Object.assign(fd(13),{color:p.fixed?C.gHi:C.t1,letterSpacing:1})}>{p.name}{p.fixed?" (PRIMARY)":""}</div>
              <div style={Object.assign(fm(8),{color:C.t3})}>{p.fixed?"Always live · SeeWhy LIVE backend":"RTMP fanout destination"}</div>
            </div>
            {!p.fixed&&<Tag variant="muted">RTMP</Tag>}
            {p.fixed&&<Tag variant="gold">LIVE</Tag>}
          </div>
        </GCard>
      );})}
    </div>
  );
}

/* ─── SPLASH SCREEN ───────────────────────────────────────────────── */
function SplashScreen(props){
  useEffect(function(){
    var t=setTimeout(function(){props.onDone();},2200);
    return function(){clearTimeout(t);};
  },[]);
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"linear-gradient(135deg,"+C.bg0+","+C.burg+"18,"+C.bg0+")",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:sp(2),animation:"splashOut 2.2s ease forwards"}}>
      <div style={{width:80,height:80,borderRadius:20,background:"linear-gradient(135deg,"+C.burg+","+C.bHi+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,boxShadow:"0 0 40px "+C.bHi+"44"}}>👁</div>
      <div style={Object.assign(fd(32),{color:C.t1,letterSpacing:6})}>SEEWHY</div>
      <div style={Object.assign(fd(14),{color:C.bHi,letterSpacing:8})}>LIVE · v33</div>
      <div style={Object.assign(fm(9),{color:C.t3,marginTop:sp(1)})}>90/10 · SACRED</div>
    </div>
  );
}

/* ─── TOAST SYSTEM ────────────────────────────────────────────────── */
function ToastLayer(props){
  if(!props.toasts||!props.toasts.length)return null;
  var colorMap={gold:C.gHi,teal:C.tHi,burg:C.bHi,volt:C.volt,info:C.t2,tip:C.tHi,sub:C.purHi,warn:C.bHi,pay:C.lime};
  return(
    <div style={{position:"fixed",top:sp(2),right:sp(2),zIndex:8000,display:"flex",flexDirection:"column",gap:sp(1),pointerEvents:"none",maxWidth:280}}>
      {props.toasts.map(function(t){
        var col=colorMap[t.type]||C.t2;
        return(
          <div key={t.id} style={{background:"rgba(22,16,32,.97)",border:"1px solid "+col+"44",borderRadius:R.md+"px",padding:"10px 13px",backdropFilter:"blur(16px)",animation:"toastIn .3s ease",display:"flex",gap:sp(1),alignItems:"center",boxShadow:"0 4px 20px rgba(0,0,0,.4)"}}>
            {t.emoji&&<span style={{fontSize:16,flexShrink:0}}>{t.emoji}</span>}
            <span style={Object.assign(fb(12),{color:col,lineHeight:1.3})}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── GIFT FLOAT LAYER ────────────────────────────────────────────── */
function GiftLayer(props){
  if(!props.gifts||!props.gifts.length)return null;
  return(
    <div style={{position:"fixed",bottom:80,right:sp(2),zIndex:600,pointerEvents:"none",display:"flex",flexDirection:"column-reverse",gap:sp(1)}}>
      {props.gifts.slice(-4).map(function(g){return(
        <div key={g.id} style={{background:C.gold+"18",border:"1px solid "+C.gHi+"44",borderRadius:R.lg+"px",padding:"6px 12px",animation:"giftFloat 3s ease forwards",display:"flex",gap:sp(1),alignItems:"center"}}>
          <span style={{fontSize:18}}>{g.emoji}</span>
          <div>
            <div style={Object.assign(fd(10),{color:C.gHi,letterSpacing:1})}>{g.name}</div>
            <div style={Object.assign(fm(7),{color:C.t3})}>{g.from}</div>
          </div>
        </div>
      );})}
    </div>
  );
}

/* ─── BOTTOM NAV ──────────────────────────────────────────────────── */
function BottomNav(props){
  var nav=[
    {id:"stage",icon:"🎭",label:"STAGE"},
    {id:"ai",   icon:"🤖",label:"AURA"},
    {id:"video",icon:"🎬",label:"VIDEO"},
    {id:"battle",icon:"⚡",label:"BATTLE"},
    {id:"more", icon:"✦",label:"MORE"},
  ];
  return(
    <div style={{background:"rgba(7,5,10,.96)",borderTop:"1px solid "+C.br1,display:"flex",flexShrink:0,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
      {nav.map(function(item,i){
        var active=item.id!=="more"&&props.activeTab===item.id;
        var isCenter=i===2;
        return(
          <button key={item.id} onClick={function(){if(item.id==="more"){props.onMore();}else{props.setActiveTab(item.id);}}} style={{
            flex:1,padding:isCenter?"4px 4px 10px":"8px 4px 10px",
            background:"none",border:"none",
            display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            cursor:"pointer",position:"relative",
          }}>
            {isCenter?(
              <div style={{
                width:48,height:48,
                background:props.isLive?"linear-gradient(135deg,"+C.burg+","+C.bGlow+")":"linear-gradient(135deg,"+C.bg3+","+C.br2+")",
                border:"2px solid "+(props.isLive?C.bGlow:C.br1),
                borderRadius:"50%",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,
                marginTop:-18,
                boxShadow:props.isLive?"0 0 18px "+C.bGlow+"55":"none",
                animation:props.isLive?"navPulse 2s ease infinite":"none",
              }}>{item.icon}</div>
            ):(
              <div style={{
                width:36,height:36,
                borderRadius:10,
                background:active?C.bHi+"14":"transparent",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:18,
                filter:active?"drop-shadow(0 0 6px "+C.bHi+")":"none",
                transition:"all .2s ease",
              }}>{item.icon}</div>
            )}
            <span style={Object.assign(fd(8),{color:active?C.bHi:isCenter&&props.isLive?C.bGlow:C.t4,letterSpacing:.5,transition:"color .2s ease"})}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── SWANAI PANEL ────────────────────────────────────────────────── */
function SwanAIPanel(props){
  return(
    <AIChatPanel
      icon="🦢"
      label="SWANAI"
      color={C.tHi}
      system="You are SwanAI, the strategic AI assistant for SeeWhy LIVE. You help creators grow their audience, optimize revenue, and make smart streaming decisions. Be concise, street-savvy, and data-driven. Always remember: 90% creator / 10% platform — the split is sacred."
      viewers={props.viewers}
      isLive={props.isLive}
      addToast={props.addToast}
      qprompts={[
        {l:"GROW TIPS",p:"Give me 3 actionable tips to grow my live streaming audience this week"},
        {l:"REVENUE",p:"How can I maximize revenue from my next stream? Give specific tactics"},
        {l:"PK STRATEGY",p:"Best strategy for winning PK battles and keeping viewers engaged"},
        {l:"TITLES",p:"Generate 5 viral-worthy stream titles for tonight"},
      ]}
    />
  );
}

/* ─── AURA PANEL ──────────────────────────────────────────────────── */
function AuraPanel(props){
  return(
    <AIChatPanel
      icon="🔮"
      label="AURA"
      color={C.purHi}
      system="You are AURA, the live stream personality AI for SeeWhy LIVE. You hype up the stream, engage with viewers, call out top tippers, celebrate wins, and keep the energy electric. Be charismatic, bold, and energetic. Current split: 90% creator / 10% platform."
      viewers={props.viewers}
      isLive={props.isLive}
      addToast={props.addToast}
      qprompts={[
        {l:"HYPE UP",p:"Hype up the stream right now! Make it electric!"},
        {l:"CALL OUT TIPPER",p:"Give an epic shoutout to a top tipper — make them feel legendary"},
        {l:"WELCOME VIEWERS",p:"Welcome new viewers to the stream with energy"},
        {l:"STREAM OUTRO",p:"Write an epic outro to end the stream on a high note"},
      ]}
    />
  );
}

/* ─── MAIN APP ────────────────────────────────────────────────────── */
function SW33App(){
  var [activeTab,setActiveTab]=useState("stage");
  var [isLive,setIsLive]=useState(false);
  var [panelists,setPanelists]=useState(INIT_PANELISTS);
  var [viewers,setViewers]=useState(247);
  var [toasts,setToasts]=useState([]);
  var [gifts,setGifts]=useState([]);
  var [showSplash,setShowSplash]=useState(true);
  var [showMore,setShowMore]=useState(false);
  var toastTimer=useRef(null);

  function addToast(msgOrObj, typeArg){
    var msg, type, emoji;
    if(msgOrObj&&typeof msgOrObj==="object"){
      msg=msgOrObj.msg||"";
      type=msgOrObj.type||"info";
      emoji=msgOrObj.emoji||"";
    } else {
      msg=msgOrObj||"";
      type=typeArg||"info";
      emoji="";
    }
    var id=Date.now()+Math.random();
    setToasts(function(p){return [...p.slice(-3),{id:id,msg:msg,type:type,emoji:emoji}];});
    setTimeout(function(){setToasts(function(p){return p.filter(function(t){return t.id!==id;});});},3500);
  }

  useEffect(function(){
    if(!isLive)return;
    var vt=setInterval(function(){
      setViewers(function(v){
        var delta=Math.floor((Math.random()-.4)*15);
        return Math.max(1,v+delta);
      });
    },4000);
    var gt=setInterval(function(){
      if(Math.random()>.65){
        var giftNames=["💎 Diamond","🌟 Star","🔥 Flame","👑 Crown","⚡ Bolt","🎁 Gift Box"];
        var g={id:Date.now(),name:pick(giftNames),emoji:pick(["💎","🌟","🔥","👑","⚡","🎁"]),from:pick(MOCK_USERS)};
        setGifts(function(p){return [...p.slice(-3),g];});
        setTimeout(function(){setGifts(function(p){return p.filter(function(x){return x.id!==g.id;});});},3000);
      }
    },5000);
    return function(){clearInterval(vt);clearInterval(gt);};
  },[isLive]);

  var tabProps={
    isLive:isLive,
    setIsLive:setIsLive,
    panelists:panelists,
    setPanelists:setPanelists,
    viewers:viewers,
    addToast:addToast,
    socket:null,
    roomId:"sw33-room",
    role:"host",
    username:"SwanyThree",
    tournMode:false,
  };

  function renderTab(){
    if(activeTab==="stage")return <StagePanel {...tabProps}/>;
    if(activeTab==="ai"||activeTab==="aura")return <AuraPanel viewers={viewers} isLive={isLive} addToast={addToast}/>;
    if(activeTab==="swanai")return <SwanAIPanel viewers={viewers} isLive={isLive} addToast={addToast}/>;
    if(activeTab==="video")return <VideoPostsPanel addToast={addToast} isLive={isLive}/>;
    if(activeTab==="battle")return <PKBattlePanel {...tabProps}/>;
    if(activeTab==="monetize")return <MonetizePanel addToast={addToast}/>;
    if(activeTab==="analytics")return <AnalyticsPanel viewers={viewers}/>;
    if(activeTab==="insforge")return <InsForgePanel addToast={addToast}/>;
    if(activeTab==="schedule")return <SchedulePanel addToast={addToast}/>;
    if(activeTab==="portal")return <PortalPanel addToast={addToast}/>;
    return(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:sp(2)}}>
        <div style={{fontSize:40}}>🚧</div>
        <div style={Object.assign(fd(14),{color:C.t3,letterSpacing:2})}>{activeTab.toUpperCase()} COMING SOON</div>
        <Btn variant="ghost" onClick={function(){setActiveTab("stage");}}>← BACK TO STAGE</Btn>
      </div>
    );
  }

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.bg0,overflow:"hidden"}}>
      {showSplash&&<SplashScreen onDone={function(){setShowSplash(false);}}/>}
      <div style={{background:"rgba(15,12,20,.9)",borderBottom:"1px solid "+C.br1,padding:"6px "+sp(2),display:"flex",alignItems:"center",gap:sp(2),flexShrink:0,backdropFilter:"blur(20px)"}}>
        <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,"+C.burg+","+C.bHi+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>👁</div>
        <div style={Object.assign(fd(13),{color:C.t1,letterSpacing:4,flex:1})}>SEEWHY<span style={{color:C.bHi}}> LIVE</span></div>
        <div style={{display:"flex",gap:sp(1),alignItems:"center"}}>
          {isLive&&<Tag variant="burg" style={{animation:"pulse 1.5s ease infinite"}}>● LIVE</Tag>}
          <Tag variant="muted">👁 {fmtN(viewers)}</Tag>
        </div>
      </div>
      <div style={{flex:1,overflow:"hidden",position:"relative"}}>
        {renderTab()}
      </div>
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLive={isLive}
        onMore={function(){setShowMore(true);}}
      />
      {showMore&&<MoreSheet setActiveTab={setActiveTab} onClose={function(){setShowMore(false);}}/>}
      <ToastLayer toasts={toasts}/>
      <GiftLayer gifts={gifts}/>
    </div>
  );
}

/* ─── MOUNT ───────────────────────────────────────────────────────── */
var rootEl=document.getElementById('root');
if(rootEl){
  ReactDOM.createRoot(rootEl).render(React.createElement(SW33App));
}
