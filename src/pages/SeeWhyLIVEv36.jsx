// SeeWhy LIVE v36 — SwanyThree EntTech LLC
// State vs State Hybrid Domino Tournaments | Fallen Passed Player Tribute
// AI Podcast Studio (NotebookLM Layer) | AI Music Studio Pro
// Multi-Platform Integration | 20-Panel Stage | Watch Party | Guardian AI
// Joyce AI Co-Host | INS Forge | SwanyBot Automation | Full Nav

import { useState, useEffect, useRef } from "react";
import { base44 } from '@/api/base44Client';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:      "#07050A",
  bg2:     "#0D0A14",
  bg3:     "#13101C",
  bg4:     "#1A1626",
  gold:    "#C9A84C",
  goldL:   "#E8C96A",
  goldD:   "#8A6F2E",
  ruby:    "#8B1A2F",
  rubyL:   "#B22340",
  slate:   "#2A2438",
  slateL:  "#3D3555",
  slate2:  "#1E1A2E",
  text:    "#F0EAF8",
  textD:   "#B8AECF",
  textM:   "#8A7A94",
  green:   "#2ECC71",
  red:     "#E74C3C",
  blue:    "#3498DB",
  purple:  "#8B44B0",
  cyan:    "#D4854A",
  orange:  "#FF6B35",
  teal:    "#1ABC9C",
  warn:    "#F39C12",
  tribute: "#7B5EA7",
  tribL:   "#A07BC4",
  state1:  "#1565C0",
  state2:  "#C62828",
};

const F = {
  display: "'Bebas Neue', 'Impact', sans-serif",
  mono:    "'Space Mono', monospace",
  body:    "'DM Sans', sans-serif",
  serif:   "'Playfair Display', serif",
};

const R = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

const CREATOR_SHARE = 0.90;
const PLATFORM_FEE  = 0.10;
const MAX_GUESTS    = 20;

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body{background:${C.bg};color:${C.text};font-family:${F.body};overflow-x:hidden;min-height:100vh;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:${C.bg2};}
::-webkit-scrollbar-thumb{background:${C.goldD};border-radius:2px;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
@keyframes glowGold{0%,100%{box-shadow:0 0 8px ${C.gold}44;}50%{box-shadow:0 0 28px ${C.gold}99;}}
@keyframes glowTribute{0%,100%{box-shadow:0 0 8px ${C.tribute}44;}50%{box-shadow:0 0 28px ${C.tribute}99;}}
@keyframes glowState{0%,100%{box-shadow:0 0 8px ${C.state1}55;}50%{box-shadow:0 0 28px ${C.state2}77;}}
@keyframes waveBar{0%,100%{transform:scaleY(.25);}50%{transform:scaleY(1);}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
@keyframes ripple{0%{transform:scale(1);opacity:1;}100%{transform:scale(2.5);opacity:0;}}
@keyframes slideIn{from{opacity:0;transform:translateX(-16px);}to{opacity:1;transform:translateX(0);}}
@keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
.fade-up{animation:fadeUp .3s ease forwards;}
.slide-in{animation:slideIn .25s ease forwards;}
.glow-gold{animation:glowGold 2s ease infinite;}
.glow-tribute{animation:glowTribute 2.5s ease infinite;}
.glow-state{animation:glowState 2s ease infinite;}
select,option{color:${C.text};background:${C.bg2};}
input[type=range]{cursor:pointer;}
.shimmer{background:linear-gradient(90deg,${C.bg3} 25%,${C.slateL}44 50%,${C.bg3} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;}
`;

// ─── NAV TABS ─────────────────────────────────────────────────────────────────
const TABS = [
  { id:"stage",      label:"STAGE",         icon:"🎥" },
  { id:"svs",        label:"STATE VS STATE", icon:"⚔️" },
  { id:"tribute",    label:"TRIBUTE",        icon:"🕊️" },
  { id:"podcast",    label:"AI PODCAST",     icon:"🎙️" },
  { id:"music",      label:"MUSIC STUDIO",   icon:"🎵" },
  { id:"platforms",  label:"PLATFORMS",      icon:"📡" },
  { id:"watchparty", label:"WATCH PARTY",    icon:"🎉" },
  { id:"analytics",  label:"ANALYTICS",      icon:"📊" },
  { id:"monetize",   label:"MONETIZE",       icon:"💰" },
  { id:"guardian",   label:"GUARDIAN AI",    icon:"🛡️" },
  { id:"insforge",   label:"INS FORGE",      icon:"⚡" },
  { id:"swanybot",   label:"JOYCE AI",       icon:"🤖" },
  { id:"settings",   label:"SETTINGS",       icon:"⚙️" },
];

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────

function Btn({ label, icon, onClick, variant="gold", size="md", disabled, style }) {
  const variants = {
    gold:    `linear-gradient(135deg,${C.gold},${C.goldD})`,
    ghost:   "transparent",
    ruby:    `linear-gradient(135deg,${C.ruby},${C.rubyL})`,
    slate:   C.slate,
    tribute: `linear-gradient(135deg,${C.tribute},${C.tribL})`,
    state:   `linear-gradient(135deg,${C.state1},${C.state2})`,
    cyan:    `linear-gradient(135deg,${C.cyan}CC,${C.blue})`,
    green:   `linear-gradient(135deg,${C.teal},${C.green})`,
    purple:  `linear-gradient(135deg,${C.purple},#7D3C98)`,
    orange:  `linear-gradient(135deg,${C.orange},#E55100)`,
  };
  const colors = {
    gold:"#07050A",ghost:C.gold,ruby:C.text,slate:C.textD,
    tribute:C.text,state:C.text,cyan:"#07050A",green:"#07050A",
    purple:C.text,orange:C.text,
  };
  const pads = { sm:"6px 12px", md:"10px 18px", lg:"14px 28px" };
  const fonts = { sm:11, md:13, lg:15 };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: variants[variant] || variants.gold,
      color: colors[variant] || C.text,
      border: variant==="ghost" ? `1px solid ${C.gold}66` : "none",
      borderRadius: R.pill, padding: pads[size]||pads.md,
      fontSize: fonts[size]||13, fontFamily: F.body, fontWeight:700,
      cursor: disabled?"not-allowed":"pointer", opacity: disabled?0.5:1,
      transition:"all .15s", letterSpacing:.5,
      ...(style||{})
    }}>
      {icon && <span style={{marginRight: label?5:0}}>{icon}</span>}
      {label}
    </button>
  );
}

function GCard({ children, style, glow, tribute, state }) {
  return (
    <div className={glow?"glow-gold":tribute?"glow-tribute":state?"glow-state":""}
      style={{
        background: C.bg3,
        border: `1px solid ${tribute?C.tribute+"55":state?C.gold+"33":C.slate}`,
        borderRadius: R.lg, padding:16,
        ...(style||{})
      }}>
      {children}
    </div>
  );
}

function Inp({ label, value, onChange, placeholder, type="text", style }) {
  return (
    <div style={{marginBottom:12}}>
      {label && <div style={{fontSize:10,color:C.textM,fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1.2}}>{label}</div>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",background:C.bg2,border:`1px solid ${C.slate}`,borderRadius:R.sm,
          padding:"10px 12px",color:C.text,fontFamily:F.body,fontSize:13,outline:"none",...(style||{})}}/>
    </div>
  );
}

function Tag({ label, color }) {
  return (
    <span style={{
      background:(color||C.gold)+"22", color:color||C.gold,
      border:`1px solid ${(color||C.gold)}44`, borderRadius:R.pill,
      padding:"2px 9px", fontSize:10, fontWeight:700, letterSpacing:.8,
      whiteSpace:"nowrap",
    }}>{label}</span>
  );
}

function AudioBars({ active, color }) {
  return (
    <div style={{display:"flex",gap:2,alignItems:"flex-end",height:14}}>
      {[1,2,3,4,5].map(i=>(
        <div key={i} style={{
          width:3, background:color||C.gold, borderRadius:2,
          height:`${25+i*15}%`,
          animation:active?`waveBar ${0.38+i*.1}s ease infinite`:"none",
          animationDelay:`${i*.07}s`, opacity:active?1:.25,
          transformOrigin:"bottom",
        }}/>
      ))}
    </div>
  );
}

function ThinkDots({ color }) {
  return (
    <span style={{display:"inline-flex",gap:5,alignItems:"center"}}>
      {[0,1,2].map(i=>(
        <span key={i} style={{width:7,height:7,borderRadius:"50%",background:color||C.gold,
          animation:"pulse 1.2s ease infinite",animationDelay:`${i*.2}s`}}/>
      ))}
    </span>
  );
}

function SectionHeader({ title, sub, color }) {
  return (
    <div style={{marginBottom:4}}>
      <div style={{fontFamily:F.display,fontSize:24,color:color||C.gold,letterSpacing:3}}>{title}</div>
      {sub && <div style={{fontSize:11,color:C.textM,marginTop:2,letterSpacing:1}}>{sub}</div>}
    </div>
  );
}

// ─── OCTA CELL ────────────────────────────────────────────────────────────────
function OctaCell({ slot, user, isHost, isLive, isMuted, onClick }) {
  const empty = !user;
  return (
    <div onClick={()=>!empty && onClick && onClick(slot)} style={{
      position:"relative", aspectRatio:"1",
      background: empty ? C.bg2 : `linear-gradient(135deg,${C.bg3},${C.slate2})`,
      border:`1px solid ${isLive?C.gold:isHost?C.ruby:C.slate}`,
      borderRadius:R.md, overflow:"hidden", cursor:empty?"default":"pointer",
      boxShadow:isLive?`0 0 14px ${C.gold}55`:"none", transition:"all .2s",
    }}>
      {empty ? (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:C.slate,fontSize:20}}>+</div>
      ) : (
        <>
          <div style={{width:"100%",height:"68%",background:`linear-gradient(135deg,${C.slateL},${C.bg4})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
            {user.avatar||"👤"}
          </div>
          <div style={{padding:"3px 5px",background:C.bg4}}>
            <div style={{fontSize:9,fontWeight:700,color:C.text,fontFamily:F.mono,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{user.name}</div>
            <div style={{display:"flex",gap:3,alignItems:"center",marginTop:2}}>
              {isHost && <Tag label="HOST" color={C.ruby}/>}
              {isLive && <AudioBars active color={C.gold}/>}
              {isMuted && <span style={{fontSize:9}}>🔇</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── STAGE PANEL ─────────────────────────────────────────────────────────────
const DEMO_STREAMS = [
  {id:"host",name:"SwanyThree23",avatar:"👑",live:true,muted:false},
  {id:"s2",name:"CaliBonesOG",avatar:"🎯",live:true,muted:false},
  {id:"s3",name:"VibeNBones",avatar:"🎵",live:false,muted:true},
  {id:"s4",name:"KingDomino",avatar:"🏆",live:true,muted:false},
  null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null
];

function StagePanel() {
  const [streams] = useState(DEMO_STREAMS);
  const [chat, setChat] = useState([
    {user:"CaliBonesOG",msg:"Let's DOMINO! 🎯",time:"8:42PM",badge:"gold"},
    {user:"JoyceAI",msg:"Stream is live — 90% to creator always 🔥",time:"8:42PM",badge:"ai"},
    {user:"VibeNBones",msg:"State vs State TONIGHT! WA vs CA 🔥",time:"8:43PM",badge:"gold"},
  ]);
  const [chatMsg, setChatMsg] = useState("");
  const [lang, setLang] = useState("EN");
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmt, setTipAmt] = useState("5");
  const [isLive, setIsLive] = useState(true);
  const chatRef = useRef(null);
  const LANGS = ["EN","ES","FR","PT","ZH","AR","HI","SW","RU","DE","JA","KO"];

  function sendChat() {
    if (!chatMsg.trim()) return;
    const now = new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    setChat(c=>[...c,{user:"You",msg:chatMsg,time:now,badge:null}]);
    setChatMsg("");
    setTimeout(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},50);
  }

  const liveCount = streams.filter(Boolean).length;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-up">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <SectionHeader title="LIVE STAGE" sub="20-PANEL BROADCAST" />
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {isLive && <div style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.red,animation:"pulse 1s ease infinite"}}/>
            <span style={{fontSize:10,color:C.red,fontWeight:700}}>LIVE</span>
          </div>}
          <Tag label={`${liveCount}/${MAX_GUESTS}`} color={C.gold}/>
          <Btn label={isLive?"END":"GO LIVE"} variant={isLive?"ruby":"gold"} size="sm" onClick={()=>setIsLive(!isLive)}/>
        </div>
      </div>

      <div style={{background:C.bg2,borderRadius:R.sm,padding:"8px 12px",fontFamily:F.mono,fontSize:10,color:C.textM,lineHeight:1.9}}>
        <span style={{color:C.gold}}>RTMP:</span> rtmp://seewhylive.online/live &nbsp;|&nbsp;
        <span style={{color:C.gold}}>HLS:</span> /hls/live/index.m3u8 &nbsp;|&nbsp;
        <span style={{color:C.gold}}>KEY:</span> swany:sw3_YOURKEY
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
        {Array.from({length:MAX_GUESTS},(_,i)=>{
          const u = streams[i]||null;
          return (
            <OctaCell key={i} slot={i} user={u}
              isHost={u && u.id==="host"} isLive={u&&u.live} isMuted={u&&u.muted}/>
          );
        })}
      </div>

      {tipOpen && (
        <GCard glow>
          <div style={{fontFamily:F.display,fontSize:15,color:C.gold,marginBottom:10}}>💸 DIRECT PAY</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:10}}>
            {["1","5","10","20","50","100","250","500"].map(a=>(
              <Btn key={a} label={`$${a}`} variant={tipAmt===a?"gold":"ghost"} size="sm" onClick={()=>setTipAmt(a)}/>
            ))}
          </div>
          <div style={{background:C.bg2,borderRadius:R.sm,padding:10,fontSize:12,marginBottom:10}}>
            Creator gets: <span style={{color:C.gold,fontWeight:700}}>${(parseFloat(tipAmt)*CREATOR_SHARE).toFixed(2)}</span>
            &nbsp;| Platform: <span style={{color:C.textM}}>${(parseFloat(tipAmt)*PLATFORM_FEE).toFixed(2)}</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            <Btn label="SEND TIP" variant="gold" size="sm" style={{flex:1}} onClick={()=>setTipOpen(false)}/>
            <Btn label="CANCEL" variant="ghost" size="sm" onClick={()=>setTipOpen(false)}/>
          </div>
        </GCard>
      )}

      <GCard>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontFamily:F.display,fontSize:13,color:C.gold,letterSpacing:1}}>WISPERFLOW CHAT</div>
          <div style={{display:"flex",gap:3,flexWrap:"wrap",justifyContent:"flex-end"}}>
            {LANGS.map(l=>(
              <span key={l} onClick={()=>setLang(l)} style={{
                padding:"1px 6px",borderRadius:R.pill,fontSize:9,cursor:"pointer",fontWeight:700,
                background:lang===l?C.gold:C.bg2,color:lang===l?C.bg:C.textM,
                border:`1px solid ${lang===l?C.gold:C.slate}`,
              }}>{l}</span>
            ))}
          </div>
        </div>
        <div ref={chatRef} style={{height:110,overflowY:"auto",marginBottom:8,display:"flex",flexDirection:"column",gap:3}}>
          {chat.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start"}}>
              <span style={{fontSize:9,color:C.textM,whiteSpace:"nowrap",marginTop:2}}>{m.time}</span>
              <span style={{fontSize:11,fontWeight:700,
                color:m.badge==="gold"?C.gold:m.badge==="ai"?C.tribute:C.textD}}>{m.user}:</span>
              <span style={{fontSize:11,color:C.text,flex:1}}>{m.msg}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:5}}>
          <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendChat()}
            placeholder={`Chat in ${lang}...`}
            style={{flex:1,background:C.bg2,border:`1px solid ${C.slate}`,borderRadius:R.pill,
              padding:"8px 13px",color:C.text,fontFamily:F.body,fontSize:12,outline:"none"}}/>
          <Btn label="SEND" variant="gold" size="sm" onClick={sendChat}/>
          <Btn icon="💰" variant="ghost" size="sm" onClick={()=>setTipOpen(!tipOpen)}/>
        </div>
      </GCard>
    </div>
  );
}

// ─── STATE VS STATE ───────────────────────────────────────────────────────────
const STATES_DATA = [
  {id:"WA",name:"Washington",color:C.state1,record:{w:3,l:0},pts:210,players:["SwanyThree23","CaliBonesKing","King Domino","West Side Bone","Pacific Shuffle"]},
  {id:"CA",name:"California",color:"#1B5E20",record:{w:2,l:1},pts:178,players:["West Coast Bone","SunsetSlayer","Bay Bone","LA King","Valley Boss"]},
  {id:"TX",name:"Texas",color:"#B71C1C",record:{w:2,l:1},pts:165,players:["Lone Star Domino","Houston Hustle","Dallas King","Rio Bone","Alamo Ace"]},
  {id:"FL",name:"Florida",color:"#E65100",record:{w:1,l:2},pts:140,players:["Sunshine Bone","Miami Domino","Tallahassee T","Tampa King","Gator Slide"]},
  {id:"NY",name:"New York",color:"#4A148C",record:{w:1,l:2},pts:132,players:["Empire Bone","Bronx King","Brooklyn Shuffle","Harlem Hustle","Queens Bone"]},
  {id:"GA",name:"Georgia",color:"#BF360C",record:{w:0,l:3},pts:88,players:["ATL Domino","Peach State Bone","Savannah Slide","Augusta Ace","Macon Masher"]},
];

const BRACKET_MATCHES = [
  {id:1,s1:"WA",s2:"CA",score1:3,score2:1,status:"complete",round:"QF"},
  {id:2,s1:"TX",s2:"FL",score1:2,score2:3,status:"complete",round:"QF"},
  {id:3,s1:"NY",s2:"GA",score1:2,score2:1,status:"complete",round:"QF"},
  {id:4,s1:"WA",s2:"FL",score1:1,score2:0,status:"live",round:"SF",note:"Game 2 of 3"},
  {id:5,s1:"NY",s2:"TX",score1:0,score2:0,status:"upcoming",round:"SF"},
  {id:6,s1:"TBD",s2:"TBD",score1:0,score2:0,status:"upcoming",round:"FINAL"},
];

function SVSPanel() {
  const [view, setView] = useState("bracket");
  const [liveScore, setLiveScore] = useState({s1:1,s2:0});
  const [playLog, setPlayLog] = useState([
    {time:"9:04",player:"SwanyThree23",action:"Double-Six opener 🎯",pts:6},
    {time:"9:03",player:"Sunshine Bone",action:"Block attempt — failed",pts:0},
    {time:"9:02",player:"CaliBonesKing",action:"7-0 DOMINO! 🏆",pts:7},
  ]);

  function getState(id) { return STATES_DATA.find(s=>s.id===id)||{id,name:id,color:C.textM,record:{w:0,l:0},pts:0,players:[]}; }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-up">
      <div style={{
        background:`linear-gradient(135deg,${C.state1}33,${C.state2}33,${C.bg3})`,
        border:`1px solid ${C.gold}44`, borderRadius:R.lg, padding:"16px 14px", textAlign:"center",
        position:"relative",overflow:"hidden",
      }}>
        <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 30% 50%,${C.state1}18 0%,transparent 60%)`,pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 70% 50%,${C.state2}18 0%,transparent 60%)`,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontFamily:F.display,fontSize:30,letterSpacing:4,color:C.gold}}>STATE VS STATE</div>
          <div style={{fontFamily:F.display,fontSize:13,color:C.textD,letterSpacing:3,marginTop:2}}>HYBRID DOMINO TOURNAMENT SERIES</div>
          <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:10,flexWrap:"wrap"}}>
            <Tag label="LIVE ON SEEWHY" color={C.red}/>
            <Tag label="7 ROCK · 5/150 · DBL ELIM" color={C.gold}/>
            <Tag label="90/10 CREATOR SPLIT" color={C.teal}/>
            <Tag label="ALL STATES WELCOME" color={C.cyan}/>
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
        {[["bracket","🏆 BRACKET"],["roster","👥 ROSTERS"],["live","🔴 LIVE MATCH"],["standings","📊 STANDINGS"]].map(([v,l])=>(
          <Btn key={v} label={l} variant={view===v?"state":"ghost"} size="sm" onClick={()=>setView(v)} style={{whiteSpace:"nowrap"}}/>
        ))}
      </div>

      {view==="bracket" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {BRACKET_MATCHES.map(m=>{
            const s1=getState(m.s1), s2=getState(m.s2);
            const isLiveM = m.status==="live";
            return (
              <GCard key={m.id} state style={{border:`1px solid ${isLiveM?C.gold+"99":C.slate}`,animation:isLiveM?"glowGold 2s ease infinite":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <Tag label={m.round} color={C.gold}/>
                  <Tag label={m.status.toUpperCase()} color={m.status==="live"?C.red:m.status==="complete"?C.green:C.textM}/>
                  {m.note && <span style={{fontSize:10,color:C.textM}}>{m.note}</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1,textAlign:"center"}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:s1.color,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 5px",fontWeight:700,color:"#fff",fontSize:13}}>{s1.id}</div>
                    <div style={{fontFamily:F.display,fontSize:13,color:C.text}}>{s1.name}</div>
                  </div>
                  <div style={{textAlign:"center",minWidth:64}}>
                    <div style={{fontFamily:F.display,fontSize:30,color:isLiveM?C.gold:C.textD,lineHeight:1}}>{m.score1}–{m.score2}</div>
                    {isLiveM && <div style={{fontSize:9,color:C.red,fontWeight:700,marginTop:2,animation:"pulse 1s ease infinite"}}>● LIVE</div>}
                  </div>
                  <div style={{flex:1,textAlign:"center"}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:s2.color,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 5px",fontWeight:700,color:"#fff",fontSize:13}}>{s2.id}</div>
                    <div style={{fontFamily:F.display,fontSize:13,color:C.text}}>{s2.name}</div>
                  </div>
                </div>
                {isLiveM && (
                  <div style={{display:"flex",gap:5,marginTop:10}}>
                    <Btn label="WATCH NOW" variant="gold" size="sm" style={{flex:1}}/>
                    <Btn label="WATCH PARTY" variant="ghost" size="sm"/>
                  </div>
                )}
              </GCard>
            );
          })}
        </div>
      )}

      {view==="roster" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {STATES_DATA.map(st=>(
            <GCard key={st.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:st.color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#fff",fontSize:12}}>{st.id}</div>
                  <div>
                    <div style={{fontFamily:F.display,fontSize:15,color:C.text}}>{st.name}</div>
                    <div style={{fontSize:10,color:C.textM}}>{st.record.w}W – {st.record.l}L · {st.pts} pts</div>
                  </div>
                </div>
                <Btn label="JOIN TEAM" variant="ghost" size="sm"/>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {st.players.map(p=>(
                  <div key={p} style={{background:C.bg2,border:`1px solid ${st.color}44`,borderRadius:R.sm,padding:"3px 9px",fontSize:11,color:C.textD}}>👤 {p}</div>
                ))}
                <div style={{background:C.bg2,border:`1px dashed ${C.slate}`,borderRadius:R.sm,padding:"3px 9px",fontSize:11,color:C.textM,cursor:"pointer"}}>+ Add</div>
              </div>
            </GCard>
          ))}
        </div>
      )}

      {view==="live" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <GCard glow style={{textAlign:"center"}}>
            <div style={{marginBottom:6}}><Tag label="🔴 LIVE MATCH — SF ROUND" color={C.red}/></div>
            <div style={{fontFamily:F.display,fontSize:12,color:C.textM,marginBottom:12,letterSpacing:2}}>GAME 2 OF 3 · BEST OF 3 SERIES</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20}}>
              <div style={{textAlign:"center"}}>
                <div style={{width:50,height:50,borderRadius:"50%",background:C.state1,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 6px",fontWeight:700,color:"#fff",fontSize:14}}>WA</div>
                <div style={{fontFamily:F.display,fontSize:16,color:C.text}}>WASHINGTON</div>
                <div style={{fontFamily:F.display,fontSize:52,color:C.state1,lineHeight:1}}>{liveScore.s1}</div>
                <Btn label="+1 GAME" variant="state" size="sm" onClick={()=>setLiveScore(s=>({...s,s1:s.s1+1}))}/>
              </div>
              <div style={{fontFamily:F.display,fontSize:22,color:C.gold}}>VS</div>
              <div style={{textAlign:"center"}}>
                <div style={{width:50,height:50,borderRadius:"50%",background:"#E65100",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 6px",fontWeight:700,color:"#fff",fontSize:14}}>FL</div>
                <div style={{fontFamily:F.display,fontSize:16,color:C.text}}>FLORIDA</div>
                <div style={{fontFamily:F.display,fontSize:52,color:"#E65100",lineHeight:1}}>{liveScore.s2}</div>
                <Btn label="+1 GAME" variant="ruby" size="sm" onClick={()=>setLiveScore(s=>({...s,s2:s.s2+1}))}/>
              </div>
            </div>
            <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:14}}>
              <Btn label="RESET" variant="ghost" size="sm" onClick={()=>setLiveScore({s1:0,s2:0})}/>
              <Btn label="END MATCH" variant="ruby" size="sm"/>
              <Btn label="PUSH TO STAGE" variant="gold" size="sm"/>
            </div>
          </GCard>
          <GCard>
            <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:8,letterSpacing:1}}>LIVE PLAY LOG</div>
            {playLog.map((p,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.slate}`}}>
                <span style={{fontSize:9,color:C.textM,fontFamily:F.mono,whiteSpace:"nowrap"}}>{p.time}</span>
                <span style={{fontSize:11,color:C.gold,fontWeight:700,whiteSpace:"nowrap"}}>{p.player}</span>
                <span style={{fontSize:11,color:C.textD,flex:1}}>{p.action}</span>
                {p.pts>0 && <Tag label={`+${p.pts}pts`} color={C.teal}/>}
              </div>
            ))}
            <Btn label="+ LOG PLAY" variant="ghost" size="sm" style={{width:"100%",marginTop:8}}
              onClick={()=>setPlayLog(l=>[{time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),player:"SwanyThree23",action:"Custom play logged",pts:0},...l])}/>
          </GCard>
        </div>
      )}

      {view==="standings" && (
        <div>
          <div style={{fontFamily:F.display,fontSize:15,color:C.gold,marginBottom:10,letterSpacing:2}}>STATE STANDINGS</div>
          {[...STATES_DATA].sort((a,b)=>b.pts-a.pts).map((s,i)=>(
            <div key={s.id} style={{
              display:"flex",alignItems:"center",gap:10,
              padding:"10px 12px",marginBottom:5,borderRadius:R.sm,
              background:i===0?`linear-gradient(135deg,${C.gold}22,${C.bg3})`:C.bg3,
              border:`1px solid ${i===0?C.gold+"66":C.slate}`,
            }}>
              <div style={{fontFamily:F.display,fontSize:20,color:i===0?C.gold:C.textM,width:22}}>{i+1}</div>
              <div style={{width:30,height:30,borderRadius:"50%",background:s.color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#fff",fontSize:10}}>{s.id}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:F.display,fontSize:13,color:C.text}}>{s.name}</div>
                <div style={{fontSize:10,color:C.textM}}>{s.record.w}W – {s.record.l}L</div>
              </div>
              <div style={{fontFamily:F.display,fontSize:22,color:i===0?C.gold:C.text}}>{s.pts}</div>
              <Tag label="PTS" color={C.gold}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TRIBUTE PANEL ────────────────────────────────────────────────────────────
const LEGENDS = [
  {id:1,name:"Big Bone Earl",years:"1958–2021",state:"WA",photo:"🎯",color:C.tribute,
    bio:"Pioneer of Pacific Northwest domino culture. Won the Regional 7-0 Championship 4 consecutive times. Founded the Seattle Domino Society in 1994.",
    achievements:["4× Regional Champion","Founder: Seattle Domino Society","Mentored 200+ players","Hall of Fame 2019"]},
  {id:2,name:"Mama Joyce Thompson",years:"1962–2023",state:"GA",photo:"👑",color:"#9C6B3C",
    bio:"Queen of Southern domino culture. Her community tournaments brought thousands together across Georgia and the Southeast for over 30 years.",
    achievements:["Community Builder Award","30-Year Teaching Legacy","ATL Domino Hall of Fame","Founded 12 Community Leagues"]},
  {id:3,name:"Fast Hands Rodriguez",years:"1971–2022",state:"TX",photo:"⚡",color:C.state2,
    bio:"Speed play innovator. Set the world record for fastest 7-0 sweep at 4 minutes 12 seconds. ESPN feature subject in 2018.",
    achievements:["World Speed Record Holder","TX State Champ 2009–2015","ESPN Feature 2018","3× Nationals Finalist"]},
];

function TributePanel() {
  const [selected, setSelected] = useState(null);
  const [tributeMsg, setTributeMsg] = useState("");
  const [messages, setMessages] = useState([
    {legendId:1,author:"CaliBonesOG",msg:"Big Bone Earl — REST EASY LEGEND. You built this whole culture 🙏",time:"2 days ago"},
    {legendId:2,author:"SwanyThree23",msg:"Mama Joyce your tournaments gave us all a home. We carry you forward ❤️",time:"1 week ago"},
    {legendId:3,author:"VibeNBones",msg:"Fast Hands was the reason I got serious about domino. GOAT forever ⚡",time:"3 days ago"},
  ]);
  const [eventOpen, setEventOpen] = useState(false);

  function postTribute() {
    if (!tributeMsg.trim() || !selected) return;
    const now = new Date().toLocaleDateString();
    setMessages(m=>[...m,{legendId:selected.id,author:"You",msg:tributeMsg,time:now}]);
    setTributeMsg("");
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-up">
      <div style={{
        background:`linear-gradient(135deg,${C.tribute}22,${C.bg3})`,
        border:`1px solid ${C.tribute}77`, borderRadius:R.lg, padding:16, textAlign:"center",
      }} className="glow-tribute">
        <div style={{fontSize:36,marginBottom:4}}>🕊️</div>
        <div style={{fontFamily:F.display,fontSize:26,color:C.tribL,letterSpacing:4}}>IN LOVING MEMORY</div>
        <div style={{fontFamily:F.serif,fontSize:13,color:C.textD,fontStyle:"italic",marginTop:4,lineHeight:1.6}}>
          Honoring the legends who built domino culture — their legacy lives in every game
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12,flexWrap:"wrap"}}>
          <Btn label="SOCIAL GAMING TRIBUTE EVENT" variant="tribute" size="sm" onClick={()=>setEventOpen(!eventOpen)}/>
          <Btn label="+ NOMINATE A LEGEND" variant="ghost" size="sm"/>
        </div>
      </div>

      {eventOpen && (
        <GCard tribute>
          <div style={{fontFamily:F.display,fontSize:16,color:C.tribL,marginBottom:10,letterSpacing:1}}>🎯 TRIBUTE SOCIAL GAMING EVENT</div>
          <div style={{fontSize:12,color:C.textD,lineHeight:1.7,marginBottom:12}}>
            Play in honor of our fallen legends. All entry fees are split 85/10/5 — creator, platform, and 5% directly to the memorial community fund.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[{l:"EVENT DATE",v:"July 4, 2026"},{l:"PRIZE POOL",v:"$2,500"},{l:"MEMORIAL FUND",v:"5% of All Entry"},{l:"FORMAT",v:"State vs State"},{l:"SPLIT",v:"85/10/5"},{l:"PLATFORM",v:"SeeWhy LIVE"}].map(({l,v})=>(
              <div key={l} style={{background:C.bg2,borderRadius:R.sm,padding:8}}>
                <div style={{fontSize:9,color:C.textM,letterSpacing:1,marginBottom:2}}>{l}</div>
                <div style={{fontFamily:F.display,fontSize:14,color:C.tribL}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:6}}>
            <Btn label="REGISTER TEAM" variant="tribute" size="sm" style={{flex:1}}/>
            <Btn label="SHARE EVENT" variant="ghost" size="sm"/>
            <Btn label="DONATE" variant="ghost" size="sm"/>
          </div>
        </GCard>
      )}

      {LEGENDS.map(leg=>{
        const isOpen = selected && selected.id===leg.id;
        return (
          <GCard key={leg.id} tribute style={{cursor:"pointer",border:`1px solid ${leg.color}55`}}
            onClick={()=>setSelected(isOpen?null:leg)}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{
                width:58,height:58,borderRadius:"50%",flexShrink:0,
                background:`radial-gradient(circle,${leg.color}55,${C.bg3})`,
                border:`2px solid ${leg.color}88`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,
              }}>{leg.photo}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:F.display,fontSize:17,color:C.text}}>{leg.name}</div>
                <div style={{fontSize:11,color:C.textM,fontFamily:F.mono,marginTop:2}}>{leg.years} · {leg.state}</div>
                <div style={{fontSize:12,color:C.textD,marginTop:5,lineHeight:1.6}}>{leg.bio}</div>
              </div>
            </div>
            {isOpen && (
              <div style={{marginTop:14,borderTop:`1px solid ${leg.color}44`,paddingTop:12}}>
                <div style={{fontSize:10,color:C.textM,letterSpacing:1,marginBottom:7,textTransform:"uppercase"}}>Achievements</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
                  {leg.achievements.map(a=><Tag key={a} label={a} color={leg.color}/>)}
                </div>
                <div style={{fontSize:10,color:C.textM,letterSpacing:1,marginBottom:7,textTransform:"uppercase"}}>Community Tributes</div>
                {messages.filter(m=>m.legendId===leg.id).map((m,i)=>(
                  <div key={i} style={{background:C.bg2,borderRadius:R.sm,padding:8,marginBottom:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:11,color:leg.color,fontWeight:700}}>{m.author}</span>
                      <span style={{fontSize:9,color:C.textM}}>{m.time}</span>
                    </div>
                    <div style={{fontSize:12,color:C.textD,lineHeight:1.5}}>{m.msg}</div>
                  </div>
                ))}
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <input value={tributeMsg} onChange={e=>setTributeMsg(e.target.value)}
                    placeholder="Leave a tribute message..."
                    style={{flex:1,background:C.bg2,border:`1px solid ${leg.color}55`,borderRadius:R.pill,
                      padding:"8px 12px",color:C.text,fontFamily:F.body,fontSize:12,outline:"none"}}/>
                  <Btn label="POST" variant="tribute" size="sm" onClick={e=>{e.stopPropagation();postTribute();}}/>
                </div>
              </div>
            )}
          </GCard>
        );
      })}
    </div>
  );
}

// ─── AI PODCAST STUDIO ───────────────────────────────────────────────────────
const INITIAL_EPISODES = [
  {id:1,title:"Domino Culture: Past to Present",duration:"34:12",plays:2140,published:true,hosts:["JoyceAI","SwanyBot"]},
  {id:2,title:"State vs State — WA vs CA Deep Dive",duration:"28:45",plays:1890,published:true,hosts:["JoyceAI"]},
  {id:3,title:"Fallen Legends: Big Bone Earl Tribute",duration:"45:00",plays:3200,published:true,hosts:["SwanyBot","GuardianAI"]},
];

function PodcastPanel() {
  const [tab, setTab] = useState("create");
  const [topic, setTopic] = useState("");
  const [hosts, setHosts] = useState(["JoyceAI","SwanyBot"]);
  const [sources, setSources] = useState([
    {id:1,text:"SeeWhy LIVE Tournament Archive 2025–2026",type:"text"},
    {id:2,text:"Washington Classic Results — 7 Rock 5/150 Double Elimination",type:"text"},
  ]);
  const [sourceInput, setSourceInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [episode, setEpisode] = useState(null);
  const [episodes, setEpisodes] = useState(INITIAL_EPISODES);

  function addSource() {
    if (!sourceInput.trim()) return;
    setSources(s=>[...s,{id:Date.now(),text:sourceInput,type:sourceInput.startsWith("http")?"url":"text"}]);
    setSourceInput("");
  }

  async function generateEpisode() {
    if (!topic.trim()) return;
    setLoading(true); setEpisode(null);
    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the SeeWhy LIVE AI Podcast Producer. Create a complete podcast episode outline.\n\nTopic: "${topic}"\nAI Hosts: ${hosts.join(" and ")}\nSource Material: ${sources.map(s=>s.text).join("; ")||"General domino culture knowledge"}\nPlatform: SeeWhy LIVE by SwanyThree EntTech`,
        response_json_schema: {
          type:"object",
          properties:{
            title:{type:"string"},tagline:{type:"string"},duration:{type:"string"},
            topics:{type:"array",items:{type:"string"}},
            segments:{type:"array",items:{type:"object",properties:{title:{type:"string"},host:{type:"string"},duration:{type:"string"},notes:{type:"string"}}}},
            cold_open:{type:"string"},call_to_action:{type:"string"}
          }
        }
      });
      setEpisode(data);
    } catch(e) {
      setEpisode({title:"Domino Culture Deep Dive",tagline:"The untold story of street domino",duration:"38 min",
        topics:["Origins","State Rivalries","Tribute Events","Future of Domino"],
        segments:[
          {title:"Cold Open",host:"JoyceAI",duration:"2 min",notes:"Hook with a Big Bone Earl story"},
          {title:"State vs State History",host:"SwanyBot",duration:"12 min",notes:"WA dominance since 2019"},
          {title:"Tribute Spotlight",host:"JoyceAI",duration:"10 min",notes:"Mama Joyce Thompson legacy"},
          {title:"Creator Economy",host:"SwanyBot",duration:"10 min",notes:"90/10 split philosophy"},
          {title:"Outro & CTA",host:"JoyceAI",duration:"4 min",notes:"Subscribe & follow on SeeWhy LIVE"},
        ],
        cold_open:"We play dominoes. We live dominoes. This is SeeWhy LIVE.",
        call_to_action:"Subscribe at seewhylive.online — 90% always goes to the creator.",
      });
    }
    setLoading(false);
  }

  const HOST_OPTIONS = ["JoyceAI","SwanyBot","GuardianAI","Custom Host"];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-up">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <SectionHeader title="AI PODCAST STUDIO" sub="NOTEBOOKLM · SEEWHY AI LAYER"/>
        <Tag label="AI-Orchestrated" color={C.cyan}/>
      </div>
      <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
        {[["create","✨ CREATE"],["sources","📚 SOURCES"],["episodes","🎵 EPISODES"],["live","🔴 GO LIVE"]].map(([v,l])=>(
          <Btn key={v} label={l} variant={tab===v?"cyan":"ghost"} size="sm" onClick={()=>setTab(v)} style={{whiteSpace:"nowrap"}}/>
        ))}
      </div>

      {tab==="create" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <GCard>
            <Inp label="Topic / Brief" value={topic} onChange={setTopic} placeholder="e.g. Big Bone Earl tribute & the legacy of Pacific Northwest domino..."/>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:C.textM,fontWeight:700,letterSpacing:1.2,marginBottom:7,textTransform:"uppercase"}}>AI Hosts</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {HOST_OPTIONS.map(h=>(
                  <div key={h} onClick={()=>setHosts(prev=>prev.includes(h)?prev.filter(x=>x!==h):[...prev,h])}
                    style={{padding:"5px 12px",borderRadius:R.pill,fontSize:11,cursor:"pointer",fontWeight:700,
                      background:hosts.includes(h)?C.cyan+"33":C.bg2,color:hosts.includes(h)?C.cyan:C.textM,
                      border:`1px solid ${hosts.includes(h)?C.cyan+"66":C.slate}`}}>{h}</div>
                ))}
              </div>
            </div>
            <div style={{background:C.bg2,borderRadius:R.sm,padding:8,marginBottom:12,fontSize:11,color:C.textM}}>
              📚 Using <span style={{color:C.cyan,fontWeight:700}}>{sources.length}</span> source{sources.length!==1?"s":""} from library
            </div>
            <Btn label={loading?"GENERATING EPISODE...":"GENERATE EPISODE"} variant="cyan" size="lg"
              icon={loading?undefined:"🎙️"} onClick={generateEpisode} disabled={loading} style={{width:"100%"}}/>
            {loading && <div style={{textAlign:"center",padding:12}}><ThinkDots color={C.cyan}/></div>}
          </GCard>
          {episode && (
            <GCard>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:F.display,fontSize:20,color:C.gold,lineHeight:1.1}}>{episode.title}</div>
                  <div style={{fontSize:12,color:C.textD,fontStyle:"italic",marginTop:4}}>{episode.tagline}</div>
                </div>
                <Tag label={episode.duration||"??"} color={C.cyan}/>
              </div>
              {episode.topics && <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12}}>{episode.topics.map(t=><Tag key={t} label={t} color={C.gold}/>)}</div>}
              {episode.cold_open && (
                <div style={{background:`${C.cyan}11`,border:`1px solid ${C.cyan}33`,borderRadius:R.sm,padding:10,marginBottom:10}}>
                  <div style={{fontSize:9,color:C.cyan,fontWeight:700,letterSpacing:1,marginBottom:4}}>COLD OPEN</div>
                  <div style={{fontSize:12,color:C.textD,fontStyle:"italic"}}>"{episode.cold_open}"</div>
                </div>
              )}
              <div style={{fontSize:10,color:C.textM,fontWeight:700,letterSpacing:1.2,marginBottom:7,textTransform:"uppercase"}}>Segments</div>
              {episode.segments && episode.segments.map((seg,i)=>(
                <div key={i} style={{background:C.bg2,borderRadius:R.sm,padding:10,marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,alignItems:"center"}}>
                    <span style={{fontFamily:F.display,fontSize:13,color:C.cyan}}>{seg.title}</span>
                    <div style={{display:"flex",gap:4}}><Tag label={seg.host} color={C.gold}/><Tag label={seg.duration} color={C.textM}/></div>
                  </div>
                  <div style={{fontSize:11,color:C.textD,lineHeight:1.6}}>{seg.notes}</div>
                </div>
              ))}
              {episode.call_to_action && (
                <div style={{background:`${C.gold}15`,border:`1px solid ${C.gold}44`,borderRadius:R.sm,padding:10,marginTop:8}}>
                  <div style={{fontSize:9,color:C.gold,fontWeight:700,letterSpacing:1,marginBottom:3}}>CALL TO ACTION</div>
                  <div style={{fontSize:12,color:C.gold}}>{episode.call_to_action}</div>
                </div>
              )}
              <div style={{display:"flex",gap:5,marginTop:12}}>
                <Btn label="RECORD NOW" variant="cyan" size="sm" style={{flex:1}}
                  onClick={()=>setEpisodes(e=>[{id:Date.now(),title:episode.title,duration:episode.duration||"~40 min",plays:0,published:false,hosts},...e])}/>
                <Btn label="SCHEDULE" variant="ghost" size="sm"/>
                <Btn label="TO STAGE" variant="gold" size="sm"/>
              </div>
            </GCard>
          )}
        </div>
      )}

      {tab==="sources" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <GCard>
            <div style={{fontFamily:F.display,fontSize:14,color:C.cyan,marginBottom:6,letterSpacing:1}}>📚 SOURCE LIBRARY</div>
            <div style={{fontSize:11,color:C.textD,lineHeight:1.7,marginBottom:12}}>Add URLs, documents, or tournament data. The AI uses these sources to ground episode content with real facts.</div>
            <div style={{display:"flex",gap:5,marginBottom:12}}>
              <input value={sourceInput} onChange={e=>setSourceInput(e.target.value)}
                placeholder="Paste URL, text excerpt, or tournament data..."
                style={{flex:1,background:C.bg2,border:`1px solid ${C.slate}`,borderRadius:R.sm,
                  padding:"9px 12px",color:C.text,fontFamily:F.body,fontSize:12,outline:"none"}}/>
              <Btn label="ADD" variant="cyan" size="sm" onClick={addSource}/>
            </div>
            {sources.length===0 ? (
              <div style={{textAlign:"center",color:C.textM,fontSize:12,padding:20}}>No sources yet.</div>
            ) : sources.map(s=>(
              <div key={s.id} style={{display:"flex",gap:8,alignItems:"center",background:C.bg2,borderRadius:R.sm,padding:8,marginBottom:5}}>
                <span style={{fontSize:14}}>{s.type==="url"?"🔗":"📄"}</span>
                <span style={{fontSize:11,color:C.textD,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.text}</span>
                <Btn label="×" variant="ghost" size="sm" onClick={()=>setSources(ss=>ss.filter(x=>x.id!==s.id))}/>
              </div>
            ))}
          </GCard>
          <GCard>
            <div style={{fontFamily:F.display,fontSize:13,color:C.cyan,marginBottom:8}}>SUGGESTED SOURCES</div>
            {["SeeWhy LIVE Tournament History 2025","VibeN'Bones Episode Archive","Washington Classic Results — 7 Rock 5/150","Domino Federation Rules 2026","Fallen Legends Community Archive","State vs State Match Records"].map(s=>(
              <div key={s} onClick={()=>setSources(prev=>[...prev,{id:Date.now()+Math.random(),text:s,type:"text"}])}
                style={{padding:"8px 12px",background:C.bg2,borderRadius:R.sm,marginBottom:4,cursor:"pointer",
                  fontSize:11,color:C.textD,border:`1px solid ${C.slate}`,display:"flex",gap:8,alignItems:"center"}}>
                <span style={{color:C.cyan}}>+</span> {s}
              </div>
            ))}
          </GCard>
        </div>
      )}

      {tab==="episodes" && (
        <div>
          {episodes.map(ep=>(
            <GCard key={ep.id} style={{marginBottom:8}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:48,height:48,borderRadius:R.sm,background:`linear-gradient(135deg,${C.cyan}22,${C.bg3})`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🎙️</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:F.display,fontSize:13,color:C.text}}>{ep.title}</div>
                  <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}>
                    <Tag label={ep.duration} color={C.textM}/>
                    {ep.plays>0 && <Tag label={`${ep.plays.toLocaleString()} plays`} color={C.cyan}/>}
                    <Tag label={ep.published?"PUBLISHED":"DRAFT"} color={ep.published?C.green:C.warn}/>
                  </div>
                  {ep.hosts && <div style={{fontSize:10,color:C.textM,marginTop:3}}>Hosts: {ep.hosts.join(" · ")}</div>}
                </div>
                <div style={{display:"flex",gap:4,flexDirection:"column"}}>
                  <Btn icon="▶" variant="gold" size="sm"/>
                  <Btn icon="📡" variant="ghost" size="sm"/>
                </div>
              </div>
            </GCard>
          ))}
        </div>
      )}

      {tab==="live" && (
        <GCard glow>
          <div style={{fontFamily:F.display,fontSize:18,color:C.gold,marginBottom:14,textAlign:"center",letterSpacing:2}}>LIVE PODCAST BROADCAST</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {hosts.map(h=>(
              <div key={h} style={{background:C.bg2,borderRadius:R.sm,padding:12,textAlign:"center",border:`1px solid ${C.cyan}33`}}>
                <div style={{fontSize:28,marginBottom:4}}>{h==="JoyceAI"?"🎤":h==="SwanyBot"?"🤖":"🛡️"}</div>
                <div style={{fontFamily:F.display,fontSize:13,color:C.text}}>{h}</div>
                <AudioBars active color={C.cyan}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:6}}>
            <Btn label="START RECORDING" variant="cyan" size="sm" style={{flex:1}} icon="🔴"/>
            <Btn label="TO STAGE" variant="gold" size="sm"/>
            <Btn label="FANOUT" variant="ghost" size="sm"/>
          </div>
        </GCard>
      )}
    </div>
  );
}

// ─── AI MUSIC STUDIO PRO ──────────────────────────────────────────────────────
const GENRES = ["Trap","R&B","Afrobeats","Bounce","Drill","Soul","Jazz Fusion","Lo-Fi","Gospel","Reggaeton","Domino Beat","Neo-Soul"];
const KEYS_LIST = ["C Major","C Minor","D Major","D Minor","F Major","F Minor","G Major","G Minor","A Minor","Bb Major","E Minor","B Minor"];

function MusicStudioPanel() {
  const [tab, setTab] = useState("generate");
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("Trap");
  const [bpm, setBpm] = useState(140);
  const [keyVal, setKeyVal] = useState("C Minor");
  const [loading, setLoading] = useState(false);
  const [track, setTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [stems, setStems] = useState({Drums:true,Bass:true,Melody:true,Vocals:false,FX:false,"808s":true});
  const [royalty, setRoyalty] = useState(85);
  const [library] = useState([
    {title:"SeeWhy Anthem v2",genre:"Trap",bpm:142,status:"published"},
    {title:"Bone Roll Bounce",genre:"Bounce",bpm:120,status:"draft"},
    {title:"Tribute to Earl",genre:"Soul",bpm:88,status:"published"},
    {title:"State vs State Theme",genre:"Drill",bpm:155,status:"mastering"},
    {title:"Domino Nights",genre:"Domino Beat",bpm:96,status:"draft"},
  ]);

  async function generateTrack() {
    if (!prompt.trim()) return;
    setLoading(true); setTrack(null);
    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `You are SeeWhy LIVE AI Music Director. Generate a complete music production brief.\n\nConcept: "${prompt}"\nGenre: ${genre} | BPM: ${bpm} | Key: ${keyVal}\nActive Stems: ${Object.entries(stems).filter(([,v])=>v).map(([k])=>k).join(", ")}`,
        response_json_schema: {
          type:"object",
          properties:{
            title:{type:"string"},vibe:{type:"string"},
            arrangement:{type:"array",items:{type:"object",properties:{section:{type:"string"},bars:{type:"string"},notes:{type:"string"}}}},
            hook:{type:"string"},mix_tips:{type:"array",items:{type:"string"}},
            release_strategy:{type:"string"},collab_suggestion:{type:"string"}
          }
        }
      });
      setTrack(data);
    } catch(e) {
      setTrack({title:"SeeWhy Anthem",vibe:"Hard-hitting domino culture banger — unfiltered",
        arrangement:[
          {section:"Intro",bars:"1–8",notes:"Sparse 808 + hi-hats, build anticipation"},
          {section:"Verse",bars:"9–24",notes:"Melody enters, lyrical flex about domino culture"},
          {section:"Chorus",bars:"25–40",notes:"Full drop — all stems — crowd moment"},
          {section:"Bridge",bars:"41–48",notes:"Strip back to drums and vocals only"},
          {section:"Outro",bars:"49–56",notes:"Fade with tribute reverb tail"},
        ],
        hook:"We see why, we live live — every bone on the table is mine",
        mix_tips:["Side-chain kick to bass","Automate reverb sends on the hook","Layer 2 snares +3 semitones apart"],
        release_strategy:"Drop on SeeWhy LIVE during State vs State finals broadcast",
        collab_suggestion:"Feature CaliBonesOG for authentic street credibility"});
    }
    setLoading(false);
  }

  const STEM_COLORS = {Drums:C.red,Bass:C.gold,Melody:C.cyan,Vocals:C.purple,FX:C.teal,"808s":"#FF6B35"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-up">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <SectionHeader title="MUSIC STUDIO PRO" sub="AI-POWERED PRODUCTION"/>
        <Tag label="CLAUDE SONNET" color={C.purple}/>
      </div>
      <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
        {[["generate","✨ GENERATE"],["stems","🎛 STEMS"],["royalty","💸 ROYALTIES"],["collab","👥 COLLAB"],["library","📁 LIBRARY"]].map(([v,l])=>(
          <Btn key={v} label={l} variant={tab===v?"gold":"ghost"} size="sm" onClick={()=>setTab(v)} style={{whiteSpace:"nowrap"}}/>
        ))}
      </div>

      {tab==="generate" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <GCard>
            <Inp label="Track Concept" value={prompt} onChange={setPrompt} placeholder="e.g. Tribute anthem for Big Bone Earl, hard domino culture sound..."/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              <div>
                <div style={{fontSize:10,color:C.textM,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Genre</div>
                <select value={genre} onChange={e=>setGenre(e.target.value)}
                  style={{width:"100%",background:C.bg2,border:`1px solid ${C.slate}`,borderRadius:R.sm,padding:"8px 10px",fontFamily:F.body,fontSize:12,outline:"none"}}>
                  {GENRES.map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:10,color:C.textM,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Key</div>
                <select value={keyVal} onChange={e=>setKeyVal(e.target.value)}
                  style={{width:"100%",background:C.bg2,border:`1px solid ${C.slate}`,borderRadius:R.sm,padding:"8px 10px",fontFamily:F.body,fontSize:12,outline:"none"}}>
                  {KEYS_LIST.map(k=><option key={k}>{k}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:C.textM,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>BPM</span>
                <span style={{fontFamily:F.mono,fontSize:14,color:C.gold,fontWeight:700}}>{bpm}</span>
              </div>
              <input type="range" min="60" max="200" value={bpm} onChange={e=>setBpm(Number(e.target.value))} style={{width:"100%",accentColor:C.gold}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.textM,marginTop:2}}>
                <span>60 Lo-Fi</span><span>100 R&B</span><span>140 Trap</span><span>200 Drill</span>
              </div>
            </div>
            <Btn label={loading?"COMPOSING...":"GENERATE TRACK"} variant="gold" size="lg"
              icon={loading?undefined:"🎵"} onClick={generateTrack} disabled={loading} style={{width:"100%"}}/>
            {loading && <div style={{textAlign:"center",padding:10}}><ThinkDots/></div>}
          </GCard>
          {track && (
            <GCard glow>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:F.display,fontSize:22,color:C.gold,lineHeight:1}}>{track.title}</div>
                  <div style={{fontSize:12,color:C.textD,fontStyle:"italic",marginTop:4}}>{track.vibe}</div>
                </div>
                <Btn icon={playing?"⏸":"▶"} variant="gold" size="sm" onClick={()=>setPlaying(!playing)}/>
              </div>
              {track.arrangement && track.arrangement.map((a,i)=>(
                <div key={i} style={{display:"flex",gap:8,marginBottom:5,alignItems:"flex-start"}}>
                  <Tag label={a.section} color={C.purple}/>
                  <div style={{flex:1}}>
                    <span style={{fontSize:9,color:C.textM,fontFamily:F.mono}}>{a.bars}</span>
                    <div style={{fontSize:11,color:C.textD,marginTop:1}}>{a.notes}</div>
                  </div>
                </div>
              ))}
              {track.hook && (
                <div style={{background:`${C.gold}15`,border:`1px solid ${C.gold}33`,borderRadius:R.sm,padding:10,marginTop:10}}>
                  <div style={{fontSize:9,color:C.gold,fontWeight:700,letterSpacing:1,marginBottom:3}}>HOOK</div>
                  <div style={{fontSize:13,color:C.gold,fontStyle:"italic"}}>"{track.hook}"</div>
                </div>
              )}
              {track.mix_tips && (
                <div style={{marginTop:10}}>
                  <div style={{fontSize:9,color:C.textM,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Mix Tips</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{track.mix_tips.map(t=><Tag key={t} label={t} color={C.purple}/>)}</div>
                </div>
              )}
              {track.collab_suggestion && (
                <div style={{background:`${C.teal}11`,borderRadius:R.sm,padding:8,marginTop:10,fontSize:11,color:C.teal}}>
                  💡 Collab: {track.collab_suggestion}
                </div>
              )}
              <div style={{display:"flex",gap:5,marginTop:12}}>
                <Btn label="EXPORT STEMS" variant="gold" size="sm"/>
                <Btn label="RELEASE" variant="ghost" size="sm"/>
                <Btn label="TO STAGE" variant="ghost" size="sm"/>
              </div>
            </GCard>
          )}
        </div>
      )}

      {tab==="stems" && (
        <GCard>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontFamily:F.display,fontSize:15,color:C.gold,letterSpacing:1}}>STEM MANAGER</div>
            <Btn icon={playing?"⏸":"▶"} variant="gold" size="sm" onClick={()=>setPlaying(!playing)}/>
          </div>
          {Object.entries(stems).map(([stem,active])=>(
            <div key={stem} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"10px 0",borderBottom:`1px solid ${C.slate}`}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:active?STEM_COLORS[stem]||C.gold:C.textM}}/>
                <span style={{fontFamily:F.display,fontSize:14,color:active?C.text:C.textM,letterSpacing:.5}}>{stem.toUpperCase()}</span>
                {active && <AudioBars active={playing} color={STEM_COLORS[stem]||C.gold}/>}
              </div>
              <div style={{display:"flex",gap:4}}>
                <Btn icon={active?"🔇":"🔊"} variant="ghost" size="sm" onClick={()=>setStems(s=>({...s,[stem]:!s[stem]}))}/>
                <Btn icon="🎚" variant="ghost" size="sm"/>
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:6,marginTop:12}}>
            <Btn label="EXPORT ALL STEMS" variant="gold" size="sm" style={{flex:1}}/>
            <Btn label="MIX DOWN" variant="ghost" size="sm"/>
          </div>
        </GCard>
      )}

      {tab==="royalty" && (
        <GCard>
          <div style={{fontFamily:F.display,fontSize:15,color:C.gold,marginBottom:14,letterSpacing:1}}>ROYALTY SPLIT ENGINE</div>
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:12,color:C.textD}}>Artist Split</span>
              <span style={{fontFamily:F.mono,color:C.gold,fontWeight:700}}>{royalty}%</span>
            </div>
            <input type="range" min="50" max="95" value={royalty} onChange={e=>setRoyalty(Number(e.target.value))} style={{width:"100%",accentColor:C.gold}}/>
          </div>
          {[
            {role:"Artist / Creator",pct:royalty,color:C.gold},
            {role:"SeeWhy Platform",pct:Math.floor((100-royalty)*.6),color:C.cyan},
            {role:"Collab Partners",pct:Math.floor((100-royalty)*.3),color:C.purple},
            {role:"Tribute Fund",pct:100-royalty-Math.floor((100-royalty)*.6)-Math.floor((100-royalty)*.3),color:C.tribute},
          ].map(r=>(
            <div key={r.role} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:12,color:C.textD}}>{r.role}</span>
                <span style={{fontFamily:F.mono,fontSize:12,color:r.color}}>{r.pct}%</span>
              </div>
              <div style={{height:5,background:C.bg2,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${r.pct}%`,background:r.color,borderRadius:3,transition:"width .3s"}}/>
              </div>
            </div>
          ))}
          <div style={{background:`${C.gold}15`,border:`1px solid ${C.gold}33`,borderRadius:R.sm,padding:12,marginTop:12}}>
            <div style={{fontSize:10,color:C.textM,marginBottom:2}}>AT $10,000/MO REVENUE</div>
            <div style={{fontFamily:F.display,fontSize:26,color:C.gold}}>${(10000*royalty/100).toLocaleString()}</div>
            <div style={{fontSize:11,color:C.textD}}>artist earnings at {royalty}% split</div>
          </div>
        </GCard>
      )}

      {tab==="collab" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <GCard>
            <div style={{fontFamily:F.display,fontSize:14,color:C.gold,marginBottom:10}}>COLLAB STUDIO</div>
            {["CaliBonesOG — Producer / Beatmaker","JoyceAI — AI Vocal Director","SwanyBot — AI Mix Engineer"].map(c=>(
              <div key={c} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.slate}`}}>
                <span style={{fontSize:12,color:C.textD}}>👤 {c}</span>
                <div style={{display:"flex",gap:4}}><Tag label="10%" color={C.purple}/><Btn label="×" variant="ghost" size="sm"/></div>
              </div>
            ))}
            <Btn label="+ INVITE COLLABORATOR" variant="ghost" size="sm" style={{width:"100%",marginTop:10}}/>
          </GCard>
          <GCard>
            <div style={{fontFamily:F.display,fontSize:14,color:C.gold,marginBottom:8}}>🔴 LIVE COLLAB STREAM</div>
            <div style={{fontSize:11,color:C.textD,marginBottom:10}}>Broadcast your session to SeeWhy LIVE audience while collaborating in real-time.</div>
            <div style={{display:"flex",gap:5}}>
              <Btn label="START COLLAB STREAM" variant="gold" size="sm" style={{flex:1}}/>
              <Btn label="WATCH PARTY" variant="ghost" size="sm"/>
            </div>
          </GCard>
        </div>
      )}

      {tab==="library" && (
        <div>
          {library.map((t,i)=>(
            <GCard key={i} style={{marginBottom:7}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:42,height:42,borderRadius:R.sm,background:`linear-gradient(135deg,${C.gold}22,${C.bg3})`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🎵</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:F.display,fontSize:13,color:C.text}}>{t.title}</div>
                  <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
                    <Tag label={t.genre} color={C.purple}/>
                    <Tag label={`${t.bpm} BPM`} color={C.textM}/>
                    <Tag label={t.status.toUpperCase()} color={t.status==="published"?C.green:t.status==="mastering"?C.warn:C.textM}/>
                  </div>
                </div>
                <Btn icon="▶" variant="gold" size="sm"/>
              </div>
            </GCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MULTI-PLATFORM PANEL ─────────────────────────────────────────────────────
const PLATFORM_LIST = [
  {id:"youtube",  name:"YouTube",    icon:"▶", connected:true,  live:true,  viewers:1240, color:"#FF0000"},
  {id:"twitch",   name:"Twitch",     icon:"📺",connected:true,  live:true,  viewers:890,  color:"#9146FF"},
  {id:"fanbase",  name:"Fanbase",    icon:"⭐",connected:true,  live:false, viewers:0,    color:"#FF6B35", webhook:true},
  {id:"facebook", name:"Facebook",   icon:"📘",connected:true,  live:true,  viewers:560,  color:"#1877F2"},
  {id:"kick",     name:"Kick",       icon:"🟢",connected:false, live:false, viewers:0,    color:"#53FC18"},
  {id:"tiktok",   name:"TikTok",     icon:"🎵",connected:false, live:false, viewers:0,    color:"#FF0050"},
  {id:"instagram",name:"Instagram",  icon:"📸",connected:false, live:false, viewers:0,    color:"#E1306C"},
  {id:"x",        name:"X / Twitter",icon:"🐦",connected:false, live:false, viewers:0,    color:"#1DA1F2"},
];

function PlatformsPanel() {
  const [tab, setTab] = useState("fanout");
  const [platforms, setPlatforms] = useState(PLATFORM_LIST);
  const [webhookLog, setWebhookLog] = useState([
    {time:"9:04PM",platform:"Fanbase",event:"tip_received",data:"$10.00 from FanUser99",status:"processed"},
    {time:"9:03PM",platform:"YouTube",event:"superchat",data:"$25.00 — DominoKing44",status:"received"},
    {time:"9:02PM",platform:"Fanbase",event:"new_subscriber",data:"user_8821 subscribed",status:"processed"},
    {time:"9:01PM",platform:"Twitch",event:"sub_gift",data:"WestBoneSlayer gifted 5 subs",status:"received"},
  ]);
  const [vcOverlays, setVcOverlays] = useState({
    "SVS Scoreboard":true,"Tribute Banner":false,"Tip Alerts":true,"Domino Play Log":false,
    "Chat Overlay":true,"Viewer Count":true,"Gold Tick Badges":false,"RTMP Status":true,
  });
  const [activeScene, setActiveScene] = useState("Main Stage");
  const totalViewers = platforms.filter(p=>p.live).reduce((a,p)=>a+p.viewers,0);

  function togglePlatform(id) {
    setPlatforms(ps=>ps.map(p=>p.id===id?{...p,live:!p.live,viewers:p.live?0:Math.floor(Math.random()*600+100)}:p));
  }

  const SCENES = ["Main Stage","State vs State Matchup","Tribute Memorial","Podcast Booth","Music Studio","Watch Party","Intermission","Outro Slate"];
  const VC_EFFECTS = ["Gold Confetti 🎊","State Flag AR","Domino Particles ♟️","Fire Ring 🔥","Tribute Candles 🕯️","Epic Intro Slate","Victory Flash ⚡","AI Scene Cut 🎬"];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-up">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <SectionHeader title="MULTI-PLATFORM" sub="RTMP FANOUT · WEBHOOKS · VCAM"/>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:F.display,fontSize:20,color:C.gold}}>{totalViewers.toLocaleString()}</div>
          <div style={{fontSize:9,color:C.textM,letterSpacing:1}}>TOTAL VIEWERS</div>
        </div>
      </div>
      <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
        {[["fanout","📡 FANOUT"],["fanbase","⭐ FANBASE"],["virtualcam","🎥 VCAM"],["webhooks","🔗 WEBHOOKS"],["engagement","💬 ENGAGE"]].map(([v,l])=>(
          <Btn key={v} label={l} variant={tab===v?"gold":"ghost"} size="sm" onClick={()=>setTab(v)} style={{whiteSpace:"nowrap"}}/>
        ))}
      </div>

      {tab==="fanout" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {platforms.map(p=>(
              <GCard key={p.id} style={{border:`1px solid ${p.connected?p.color+"55":C.slate}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <div style={{width:28,height:28,borderRadius:R.sm,background:p.color+"33",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{p.icon}</div>
                    <span style={{fontFamily:F.display,fontSize:11,color:p.connected?C.text:C.textM}}>{p.name}</span>
                  </div>
                  <div style={{width:7,height:7,borderRadius:"50%",background:p.live?C.green:p.connected?C.warn:C.textM,marginTop:2}}/>
                </div>
                {p.live && <div style={{fontFamily:F.display,fontSize:17,color:p.color,marginBottom:4}}>{p.viewers.toLocaleString()} <span style={{fontSize:9,color:C.textM}}>viewers</span></div>}
                {p.webhook && <Tag label="WEBHOOK" color={C.orange}/>}
                <div style={{marginTop:8}}>
                  <Btn label={p.connected?(p.live?"LIVE ●":"GO LIVE"):"CONNECT"} variant={p.live?"green":p.connected?"ghost":"slate"} size="sm" style={{width:"100%"}} onClick={()=>togglePlatform(p.id)}/>
                </div>
              </GCard>
            ))}
          </div>
          <GCard>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontFamily:F.display,fontSize:13,color:C.gold,letterSpacing:1}}>RTMP FANOUT CONFIG</div>
              <Tag label="MEDIAMTX" color={C.cyan}/>
            </div>
            <div style={{background:C.bg2,borderRadius:R.sm,padding:10,fontFamily:F.mono,fontSize:10,color:C.textD,marginBottom:10,lineHeight:2}}>
              rtmp://seewhylive.online/live/{"{stream_key}"}<br/>
              Fanout → {platforms.filter(p=>p.connected).map(p=>p.name).join(" · ")}
            </div>
            <div style={{display:"flex",gap:5}}>
              <Btn label="RESTART FANOUT" variant="gold" size="sm" icon="🔄"/>
              <Btn label="CHECK STATUS" variant="ghost" size="sm"/>
            </div>
          </GCard>
        </div>
      )}

      {tab==="fanbase" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <GCard style={{border:`1px solid ${C.orange}55`}}>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:C.orange+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>⭐</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:F.display,fontSize:16,color:C.text}}>FANBASE.COM</div>
                <div style={{fontSize:11,color:C.green}}>● Connected · Webhook Active</div>
              </div>
              <Tag label="ACTIVE" color={C.green}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:12}}>
              {[{l:"FAN Tokens",v:"4,820"},{l:"Subscribers",v:"312"},{l:"Fan Score",v:"9.2"}].map(({l,v})=>(
                <div key={l} style={{background:C.bg2,borderRadius:R.sm,padding:8,textAlign:"center"}}>
                  <div style={{fontFamily:F.display,fontSize:18,color:C.orange}}>{v}</div>
                  <div style={{fontSize:9,color:C.textM}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{fontFamily:F.display,fontSize:12,color:C.gold,marginBottom:8,letterSpacing:1}}>WEBHOOK EVENTS</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
              {["new_subscriber","tip_received","token_purchase","fan_milestone","exclusive_content","live_reaction","badge_earned","payout_triggered"].map(e=>(
                <div key={e} style={{padding:"3px 9px",borderRadius:R.pill,fontSize:10,background:C.bg2,color:C.textD,border:`1px solid ${C.orange}33`}}>{e}</div>
              ))}
            </div>
            <div style={{display:"flex",gap:5}}>
              <Btn label="CONFIGURE WEBHOOKS" variant="ghost" size="sm" style={{flex:1}}/>
              <Btn label="TEST PING" variant="orange" size="sm"/>
            </div>
          </GCard>
          <GCard>
            <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:10}}>FANBASE vs SEEWHY LIVE</div>
            {[
              {metric:"Revenue Split",sw:"90/10 ✅",fb:"50–80% ❌"},
              {metric:"RTMP Fanout",sw:"8 Platforms",fb:"2 Platforms"},
              {metric:"AI Features",sw:"Full Suite (Claude)",fb:"Basic"},
              {metric:"State Tournaments",sw:"Built-In",fb:"None"},
              {metric:"Tribute Events",sw:"Integrated",fb:"None"},
              {metric:"Webhook Events",sw:"8+ Event Types",fb:"3 Event Types"},
            ].map(r=>(
              <div key={r.metric} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.slate}`}}>
                <span style={{flex:1,fontSize:11,color:C.textD}}>{r.metric}</span>
                <span style={{fontSize:11,color:C.gold,fontWeight:700}}>{r.sw}</span>
                <span style={{fontSize:11,color:C.textM,width:90,textAlign:"right"}}>{r.fb}</span>
              </div>
            ))}
          </GCard>
        </div>
      )}

      {tab==="virtualcam" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{
            background:`linear-gradient(135deg,${C.state1}22,${C.state2}22)`,
            border:`1px solid ${C.gold}44`,borderRadius:R.lg,padding:16,
            textAlign:"center",position:"relative",overflow:"hidden",minHeight:110,
          }}>
            <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at center,${C.gold}08,transparent 70%)`,pointerEvents:"none"}}/>
            <div style={{position:"relative",zIndex:1}}>
              <div style={{fontFamily:F.display,fontSize:14,color:C.gold,letterSpacing:2}}>VIRTUAL CAM OUTPUT</div>
              <div style={{fontSize:10,color:C.textM,margin:"4px 0"}}>Scene: <span style={{color:C.gold}}>{activeScene}</span></div>
              <AudioBars active color={C.gold}/>
              <div style={{fontSize:10,color:C.textM,marginTop:4}}>1920×1080 · 60fps · 6000kbps</div>
            </div>
          </div>
          <GCard>
            <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:10,letterSpacing:1}}>SCENE SWITCHER</div>
            {SCENES.map(s=>(
              <div key={s} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.slate}`}}>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {s===activeScene && <div style={{width:6,height:6,borderRadius:"50%",background:C.green,animation:"pulse 1s ease infinite"}}/>}
                  <span style={{fontSize:12,color:s===activeScene?C.text:C.textM}}>{s}</span>
                </div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  {s===activeScene && <Tag label="LIVE" color={C.green}/>}
                  <Btn label={s===activeScene?"ACTIVE":"CUT TO"} variant={s===activeScene?"gold":"ghost"} size="sm" onClick={()=>setActiveScene(s)}/>
                </div>
              </div>
            ))}
          </GCard>
          <GCard>
            <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:10,letterSpacing:1}}>LIVE OVERLAYS</div>
            {Object.entries(vcOverlays).map(([name,active])=>(
              <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.slate}`}}>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:active?C.green:C.textM}}/>
                  <span style={{fontSize:12,color:active?C.text:C.textM}}>{name}</span>
                </div>
                <Btn label={active?"ON":"OFF"} variant={active?"green":"ghost"} size="sm"
                  onClick={()=>setVcOverlays(o=>({...o,[name]:!o[name]}))}/>
              </div>
            ))}
          </GCard>
          <GCard>
            <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:8,letterSpacing:1}}>LIVE EFFECTS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              {VC_EFFECTS.map(e=><Btn key={e} label={e} variant="ghost" size="sm"/>)}
            </div>
          </GCard>
        </div>
      )}

      {tab==="webhooks" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <GCard>
            <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:10,letterSpacing:1}}>WEBHOOK LOG</div>
            {webhookLog.map((w,i)=>(
              <div key={i} style={{background:C.bg2,borderRadius:R.sm,padding:8,marginBottom:5}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,alignItems:"center",flexWrap:"wrap",gap:4}}>
                  <Tag label={w.platform} color={w.platform==="Fanbase"?C.orange:C.blue}/>
                  <span style={{fontSize:9,color:C.textM}}>{w.time}</span>
                  <Tag label={w.status.toUpperCase()} color={w.status==="processed"?C.green:C.warn}/>
                </div>
                <div style={{fontSize:10,color:C.gold,fontWeight:700,marginBottom:2}}>{w.event}</div>
                <div style={{fontSize:11,color:C.textD}}>{w.data}</div>
              </div>
            ))}
            <Btn label="CLEAR LOG" variant="ghost" size="sm" style={{width:"100%",marginTop:5}} onClick={()=>setWebhookLog([])}/>
          </GCard>
          <GCard>
            <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:10}}>ADD WEBHOOK ENDPOINT</div>
            <Inp label="Endpoint URL" value="" onChange={()=>{}} placeholder="https://your-endpoint.com/hook"/>
            <Inp label="Secret Key" value="" onChange={()=>{}} placeholder="wh_secret_..."/>
            <div style={{display:"flex",gap:5}}>
              <Btn label="SAVE ENDPOINT" variant="gold" size="sm" style={{flex:1}}/>
              <Btn label="TEST" variant="ghost" size="sm"/>
            </div>
          </GCard>
        </div>
      )}

      {tab==="engagement" && (
        <GCard>
          <div style={{fontFamily:F.display,fontSize:14,color:C.gold,marginBottom:12,letterSpacing:1}}>CROSS-PLATFORM ENGAGEMENT</div>
          {[
            {feature:"Unified Chat (WisperFlow)",desc:"All platform chats merged into one stream",status:"active"},
            {feature:"Poll Sync",desc:"Run polls simultaneously across all connected platforms",status:"active"},
            {feature:"Tip Alert Overlay",desc:"Show tips from all platforms on stream overlay",status:"active"},
            {feature:"Sub Milestone Alerts",desc:"Celebrate subs from every platform",status:"active"},
            {feature:"Auto-Clip Engine",desc:"AI highlights and shares clips to all platforms",status:"beta"},
            {feature:"Guardian AI Sync",desc:"Bans from Guardian AI apply across all platforms",status:"beta"},
            {feature:"State Vote Widget",desc:"Let audience vote on State vs State winner",status:"upcoming"},
            {feature:"Tribute Moment Push",desc:"Push memorial content to all channels simultaneously",status:"upcoming"},
          ].map(f=>(
            <div key={f.feature} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"8px 0",borderBottom:`1px solid ${C.slate}`}}>
              <Tag label={f.status.toUpperCase()} color={f.status==="active"?C.green:f.status==="beta"?C.warn:C.textM}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:C.text,fontWeight:600}}>{f.feature}</div>
                <div style={{fontSize:10,color:C.textM,marginTop:2}}>{f.desc}</div>
              </div>
            </div>
          ))}
        </GCard>
      )}
    </div>
  );
}

// ─── WATCH PARTY ─────────────────────────────────────────────────────────────
function WatchPartyPanel() {
  const [active, setActive] = useState(false);
  const [sync, setSync] = useState("host");
  const [reaction, setReaction] = useState(null);
  const [partyChat, setPartyChat] = useState([
    {user:"CaliBonesOG",msg:"LET'S GOOO STATE VS STATE 🎯",reaction:"🔥"},
    {user:"JoyceAI",msg:"Watch Party synced — 90% stays with creator 💰",reaction:null},
    {user:"VibeNBones",msg:"WA about to run this 🏆",reaction:"👑"},
  ]);
  const [partyMsg, setPartyMsg] = useState("");

  function triggerReaction(r) {
    setReaction(r);
    setTimeout(()=>setReaction(null),2000);
  }

  function sendMsg() {
    if (!partyMsg.trim()) return;
    setPartyChat(c=>[...c,{user:"You",msg:partyMsg,reaction:null}]);
    setPartyMsg("");
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-up">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <SectionHeader title="WATCH PARTY" sub={`UP TO ${MAX_GUESTS} GUESTS`}/>
        <Btn label={active?"END PARTY":"START PARTY"} variant={active?"ruby":"gold"} size="sm" onClick={()=>setActive(!active)}/>
      </div>
      <div style={{
        background:`linear-gradient(135deg,${C.bg3},${C.slate2})`,
        border:`1px solid ${active?C.gold+"77":C.slate}`,
        borderRadius:R.lg,padding:16,textAlign:"center",position:"relative",overflow:"hidden",minHeight:140,
        ...(active?{animation:"glowGold 2s ease infinite"}:{}),
      }}>
        {reaction && <div style={{position:"absolute",top:10,right:14,fontSize:44,animation:"fadeUp .3s ease"}}>{reaction}</div>}
        <div style={{fontFamily:F.display,fontSize:16,color:active?C.gold:C.textM,marginBottom:12,letterSpacing:2}}>
          {active?"🔴 PARTY IS LIVE":"WATCH PARTY READY"}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,maxWidth:260,margin:"0 auto"}}>
          {Array.from({length:10},(_,i)=>{
            const u = DEMO_STREAMS[i];
            return (
              <div key={i} style={{aspectRatio:"1",background:u?C.slateL:C.bg2,borderRadius:R.sm,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,
                border:`1px solid ${u?C.gold+"44":C.slate}`}}>{u?(u.avatar||"👤"):"+"}</div>
            );
          })}
        </div>
        {active && (
          <div style={{marginTop:10,display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
            <Tag label={`${DEMO_STREAMS.filter(Boolean).length} watching`} color={C.green}/>
            <Tag label="HOST SYNC" color={C.gold}/>
          </div>
        )}
      </div>
      <GCard>
        <div style={{fontFamily:F.display,fontSize:12,color:C.gold,marginBottom:8,letterSpacing:1}}>SYNC MODE</div>
        <div style={{display:"flex",gap:5,marginBottom:8}}>
          {[["host","HOST SYNC"],["free","FREE BROWSE"],["scheduled","SCHEDULED"]].map(([v,l])=>(
            <Btn key={v} label={l} variant={sync===v?"gold":"ghost"} size="sm" onClick={()=>setSync(v)}/>
          ))}
        </div>
        <div style={{fontSize:11,color:C.textD}}>
          {sync==="host"&&"All party members are synced to host's stream position."}
          {sync==="free"&&"Party members browse independently but share reactions."}
          {sync==="scheduled"&&"Set a countdown — party starts together at the same moment."}
        </div>
      </GCard>
      <GCard>
        <div style={{fontFamily:F.display,fontSize:12,color:C.gold,marginBottom:8,letterSpacing:1}}>LIVE REACTIONS</div>
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
          {["🔥","👑","🎯","💰","🎲","🕊️","⚔️","🎉","🏆","💯","🐐","❤️"].map(r=>(
            <span key={r} onClick={()=>triggerReaction(r)}
              style={{fontSize:24,cursor:"pointer",padding:4,borderRadius:R.sm,transition:"transform .1s"}}
              onMouseOver={e=>e.target.style.transform="scale(1.3)"}
              onMouseOut={e=>e.target.style.transform="scale(1)"}>{r}</span>
          ))}
        </div>
      </GCard>
      <GCard>
        <div style={{fontFamily:F.display,fontSize:12,color:C.gold,marginBottom:8,letterSpacing:1}}>PARTY CHAT</div>
        <div style={{maxHeight:130,overflowY:"auto",marginBottom:8}}>
          {partyChat.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:6,padding:"4px 0",borderBottom:`1px solid ${C.slate}`,alignItems:"flex-start"}}>
              <span style={{fontWeight:700,fontSize:11,color:C.gold,whiteSpace:"nowrap"}}>{m.user}:</span>
              <span style={{fontSize:11,color:C.text,flex:1}}>{m.msg}</span>
              {m.reaction && <span>{m.reaction}</span>}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:5}}>
          <input value={partyMsg} onChange={e=>setPartyMsg(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendMsg()}
            placeholder="Party message..."
            style={{flex:1,background:C.bg2,border:`1px solid ${C.slate}`,borderRadius:R.pill,
              padding:"8px 12px",color:C.text,fontFamily:F.body,fontSize:12,outline:"none"}}/>
          <Btn label="SEND" variant="gold" size="sm" onClick={sendMsg}/>
        </div>
      </GCard>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function AnalyticsPanel() {
  const revenue = 9840;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-up">
      <SectionHeader title="ANALYTICS" sub="REVENUE · VIEWS · ENGAGEMENT"/>
      <GCard glow>
        <div style={{textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:10,color:C.textM,letterSpacing:2,textTransform:"uppercase"}}>This Month</div>
          <div style={{fontFamily:F.display,fontSize:44,color:C.gold,lineHeight:1}}>${revenue.toLocaleString()}</div>
          <div style={{fontSize:11,color:C.textD,marginTop:3}}>Total Revenue · 90/10 Split Active</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            {label:"Creator (90%)",value:`$${Math.floor(revenue*.9).toLocaleString()}`,color:C.gold},
            {label:"Platform (10%)",value:`$${Math.floor(revenue*.1).toLocaleString()}`,color:C.textM},
            {label:"SVS Tournaments",value:"$1,840",color:C.state1},
            {label:"Tribute Events",value:"$720",color:C.tribute},
            {label:"Podcast Revenue",value:"$1,100",color:C.cyan},
            {label:"Music Royalties",value:"$1,240",color:C.purple},
          ].map(s=>(
            <div key={s.label} style={{background:C.bg2,borderRadius:R.sm,padding:10,textAlign:"center"}}>
              <div style={{fontFamily:F.display,fontSize:20,color:s.color}}>{s.value}</div>
              <div style={{fontSize:9,color:C.textM,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </GCard>
      <GCard>
        <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:10,letterSpacing:1}}>PLATFORM BREAKDOWN</div>
        {[
          {platform:"SeeWhy LIVE Direct",pct:45,val:4428,color:C.gold},
          {platform:"YouTube",pct:20,val:1968,color:"#FF0000"},
          {platform:"Fanbase.com",pct:18,val:1771,color:C.orange},
          {platform:"Twitch",pct:12,val:1181,color:"#9146FF"},
          {platform:"Other",pct:5,val:492,color:C.textM},
        ].map(p=>(
          <div key={p.platform} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:C.textD}}>{p.platform}</span>
              <span style={{fontFamily:F.mono,fontSize:11,color:p.color}}>${p.val.toLocaleString()} ({p.pct}%)</span>
            </div>
            <div style={{height:5,background:C.bg2,borderRadius:3}}>
              <div style={{height:"100%",width:`${p.pct}%`,background:p.color,borderRadius:3}}/>
            </div>
          </div>
        ))}
      </GCard>
      <GCard>
        <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:10,letterSpacing:1}}>LIVE STATS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
          {[
            {label:"Peak Viewers",value:"4,820",color:C.gold},
            {label:"Total Watch Time",value:"12,440 hrs",color:C.cyan},
            {label:"SVS Match Views",value:"8,200",color:C.state1},
            {label:"Tribute Plays",value:"3,100",color:C.tribute},
            {label:"Podcast Streams",value:"5,880",color:C.purple},
            {label:"Music Plays",value:"2,240",color:C.teal},
          ].map(s=>(
            <div key={s.label} style={{background:C.bg2,borderRadius:R.sm,padding:10}}>
              <div style={{fontFamily:F.display,fontSize:16,color:s.color}}>{s.value}</div>
              <div style={{fontSize:9,color:C.textM,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </GCard>
    </div>
  );
}

// ─── MONETIZE ─────────────────────────────────────────────────────────────────
function MonetizePanel() {
  const [subPrice, setSubPrice] = useState("9.99");
  const [ppvPrice, setPpvPrice] = useState("4.99");
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-up">
      <SectionHeader title="MONETIZE" sub="90/10 CREATOR-FIRST PLATFORM"/>
      <GCard glow>
        <div style={{fontFamily:F.display,fontSize:14,color:C.gold,marginBottom:12,letterSpacing:1}}>90/10 SPLIT CALCULATOR</div>
        <Inp label="Monthly Subscription Price ($)" value={subPrice} onChange={setSubPrice} type="number"/>
        <div style={{background:C.bg2,borderRadius:R.sm,padding:10,marginBottom:12,fontSize:12}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.textD}}>Creator earns per sub</span><span style={{fontFamily:F.mono,color:C.gold,fontWeight:700}}>${(parseFloat(subPrice||0)*.9).toFixed(2)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{color:C.textD}}>Platform fee</span><span style={{fontFamily:F.mono,color:C.textM}}>${(parseFloat(subPrice||0)*.1).toFixed(2)}</span></div>
        </div>
        <Inp label="PPV Event Price ($)" value={ppvPrice} onChange={setPpvPrice} type="number"/>
        <div style={{background:C.bg2,borderRadius:R.sm,padding:10,fontSize:12}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.textD}}>Creator earns per PPV</span><span style={{fontFamily:F.mono,color:C.gold,fontWeight:700}}>${(parseFloat(ppvPrice||0)*.9).toFixed(2)}</span></div>
        </div>
      </GCard>
      <GCard>
        <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:10,letterSpacing:1}}>REVENUE STREAMS</div>
        {[
          {icon:"⚔️",label:"State vs State Entry Fees",split:"90/10"},
          {icon:"🕊️",label:"Tribute Event Passes",split:"85/10/5 Fund"},
          {icon:"🎙️",label:"Podcast Subscriptions",split:"90/10"},
          {icon:"🎵",label:"Music Royalties",split:"Custom Split"},
          {icon:"💬",label:"Direct Tips (WisperFlow)",split:"90/10"},
          {icon:"🔒",label:"PPV Events",split:"90/10"},
          {icon:"⭐",label:"Fanbase Token Events",split:"Per Platform"},
          {icon:"🎫",label:"Gold Tick Badge",split:"90/10"},
          {icon:"🎉",label:"Watch Party Entry",split:"90/10"},
        ].map(r=>(
          <div key={r.label} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.slate}`}}>
            <span style={{fontSize:16}}>{r.icon}</span>
            <span style={{flex:1,fontSize:11,color:C.textD}}>{r.label}</span>
            <Tag label={r.split} color={C.gold}/>
          </div>
        ))}
      </GCard>
    </div>
  );
}

// ─── GUARDIAN AI ──────────────────────────────────────────────────────────────
function GuardianPanel() {
  const [flagT, setFlagT] = useState(50);
  const [muteT, setMuteT] = useState(75);
  const [banT, setBanT] = useState(95);
  const [events] = useState([
    {time:"9:04PM",user:"anon_2931",msg:"spam spam spam",risk:.82,action:"MUTED"},
    {time:"9:03PM",user:"viewer_445",msg:"Great stream! WA is dominating 🔥",risk:.04,action:"ALLOWED"},
    {time:"9:02PM",user:"troll_99",msg:"[content removed]",risk:.97,action:"BANNED"},
    {time:"9:01PM",user:"DomFan22",msg:"Big Bone Earl tribute was 🙏",risk:.03,action:"ALLOWED"},
  ]);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-up">
      <SectionHeader title="GUARDIAN AI" sub="CLAUDE HAIKU · REAL-TIME MODERATION"/>
      <GCard>
        <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:12,letterSpacing:1}}>RISK THRESHOLDS</div>
        {[
          {label:"FLAG FOR REVIEW",value:flagT,set:setFlagT,color:C.warn},
          {label:"AUTO-MUTE",value:muteT,set:setMuteT,color:C.orange},
          {label:"AUTO-BAN",value:banT,set:setBanT,color:C.red},
        ].map(t=>(
          <div key={t.label} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <Tag label={t.label} color={t.color}/>
              <span style={{fontFamily:F.mono,color:t.color,fontWeight:700}}>{t.value}%</span>
            </div>
            <input type="range" min="0" max="100" value={t.value} onChange={e=>t.set(Number(e.target.value))} style={{width:"100%",accentColor:t.color}}/>
          </div>
        ))}
      </GCard>
      <GCard>
        <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:10,letterSpacing:1}}>MODERATION LOG</div>
        {events.map((e,i)=>(
          <div key={i} style={{background:C.bg2,borderRadius:R.sm,padding:9,marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,alignItems:"center"}}>
              <span style={{fontSize:11,color:C.gold,fontWeight:700}}>{e.user}</span>
              <Tag label={e.action} color={e.action==="ALLOWED"?C.green:e.action==="BANNED"?C.red:C.orange}/>
            </div>
            <div style={{fontSize:11,color:C.textD}}>{e.msg}</div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
              <span style={{fontSize:9,color:C.textM}}>{e.time}</span>
              <span style={{fontFamily:F.mono,fontSize:10,color:e.risk>.9?C.red:e.risk>.7?C.orange:C.green}}>Risk: {Math.floor(e.risk*100)}%</span>
            </div>
          </div>
        ))}
      </GCard>
    </div>
  );
}

// ─── INS FORGE ────────────────────────────────────────────────────────────────
const FORGE_TYPES = [
  {id:"svs_bracket",label:"SVS Bracket Graphic",icon:"⚔️",color:C.state1},
  {id:"tribute_card",label:"Tribute Memorial Card",icon:"🕊️",color:C.tribute},
  {id:"stream_overlay",label:"Stream Overlay Pack",icon:"🎥",color:C.gold},
  {id:"podcast_cover",label:"Podcast Cover Art",icon:"🎙️",color:C.cyan},
  {id:"music_promo",label:"Music Release Promo",icon:"🎵",color:C.purple},
  {id:"tournament_flyer",label:"Tournament Flyer",icon:"🏆",color:C.orange},
];

function InsForgePanel() {
  const [selected, setSelected] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function generate() {
    if (!selected || !prompt.trim()) return;
    setLoading(true); setResult(null);
    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the SeeWhy LIVE INS Forge — a creative asset generator for SwanyThree EntTech.\n\nAsset Type: ${selected.label}\nConcept: "${prompt}"\nBrand: SeeWhy LIVE — dark backgrounds, gold (#C9A84C) accents, Bebas Neue display, broadcast aesthetic`,
        response_json_schema: {
          type:"object",
          properties:{
            title:{type:"string"},headline:{type:"string"},subline:{type:"string"},
            copy_lines:{type:"array",items:{type:"string"}},
            color_palette:{type:"array",items:{type:"string"}},
            layout_notes:{type:"string"},cta:{type:"string"},
            brand_elements:{type:"array",items:{type:"string"}},dimensions:{type:"string"}
          }
        }
      });
      setResult(data);
    } catch(e) {
      setResult({
        title:`${selected.label} — ${prompt.slice(0,30)}`,
        headline:"STATE VS STATE · LIVE ON SEEWHY",
        subline:"SwanyThree EntTech LLC · Creator-First Platform",
        copy_lines:["7 Rock · 5/150 · Double Elimination","Washington Classic Domino Tournament","Jamar's Sports Bar & Grill · Des Moines, WA"],
        color_palette:[C.gold,"#07050A",C.state1],
        layout_notes:"Dark background with gold accent typography. State logos flanking a central scoreboard motif.",
        cta:"Watch Live at seewhylive.online",
        brand_elements:["SeeWhy LIVE wordmark","90/10 Creator Badge","Gold domino tile pattern"],
        dimensions:"1080×1080 Social · 1920×1080 Stream Overlay"
      });
    }
    setLoading(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-up">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <SectionHeader title="INS FORGE" sub="AI CREATIVE ASSET GENERATOR"/>
        <Tag label="AI-Powered" color={C.orange}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
        {FORGE_TYPES.map(t=>(
          <div key={t.id} onClick={()=>setSelected(selected&&selected.id===t.id?null:t)}
            style={{
              background:selected&&selected.id===t.id?`${t.color}22`:C.bg3,
              border:`1px solid ${selected&&selected.id===t.id?t.color+"88":C.slate}`,
              borderRadius:R.md,padding:12,cursor:"pointer",transition:"all .15s",
            }}>
            <div style={{fontSize:22,marginBottom:5}}>{t.icon}</div>
            <div style={{fontSize:11,color:selected&&selected.id===t.id?C.text:C.textD,fontWeight:700,lineHeight:1.3}}>{t.label}</div>
          </div>
        ))}
      </div>
      {selected && (
        <GCard>
          <div style={{fontFamily:F.display,fontSize:14,color:selected.color,marginBottom:12,letterSpacing:1}}>
            {selected.icon} {selected.label.toUpperCase()}
          </div>
          <Inp label="Creative Brief" value={prompt} onChange={setPrompt} placeholder={`Describe your ${selected.label}...`}/>
          <Btn label={loading?"FORGING...":"FORGE ASSET"}
            variant={loading?"slate":"orange"} size="lg" icon={loading?undefined:"⚡"}
            onClick={generate} disabled={loading} style={{width:"100%"}}/>
        {loading && (
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px",background:C.bg3,borderRadius:R.md}}>
            <ThinkDots/>
            <span style={{fontSize:12,color:C.textD}}>Forging your creative asset…</span>
          </div>
        )}
        {result && (
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fade-up">
            <div style={{
              background:`linear-gradient(135deg,${selected.color}18,${C.bg3})`,
              border:`1px solid ${selected.color}55`,
              borderRadius:R.lg,padding:16,
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontFamily:F.display,fontSize:18,color:selected.color,letterSpacing:1}}>{result.title||"CREATIVE ASSET"}</div>
                  <div style={{fontSize:13,color:C.text,fontWeight:600,marginTop:3}}>{result.headline||""}</div>
                  {result.subline&&<div style={{fontSize:11,color:C.textD,marginTop:2}}>{result.subline}</div>}
                </div>
                {result.dimensions&&<Tag label={result.dimensions.split(" ")[0]} color={selected.color}/>}
              </div>
              {result.copy_lines&&result.copy_lines.length>0&&(
                <div style={{background:C.bg2,borderRadius:R.sm,padding:10,marginBottom:10}}>
                  <div style={{fontSize:10,color:C.textM,letterSpacing:1,marginBottom:6}}>COPY LINES</div>
                  {result.copy_lines.map((line,i)=>(
                    <div key={i} style={{fontSize:11,color:C.textD,lineHeight:1.6,paddingLeft:10,borderLeft:`2px solid ${selected.color}55`}}>{line}</div>
                  ))}
                </div>
              )}
              {result.layout_notes&&(
                <div style={{fontSize:11,color:C.textD,fontStyle:"italic",marginBottom:8}}>📐 {result.layout_notes}</div>
              )}
              {result.color_palette&&result.color_palette.length>0&&(
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <span style={{fontSize:10,color:C.textM,letterSpacing:1}}>PALETTE</span>
                  {result.color_palette.map((hex,i)=>(
                    <div key={i} title={hex} style={{width:20,height:20,borderRadius:4,background:hex,border:`1px solid ${C.slate}`}}/>
                  ))}
                </div>
              )}
              {result.brand_elements&&result.brand_elements.length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                  {result.brand_elements.map((el,i)=>(
                    <span key={i} style={{fontSize:10,background:`${selected.color}22`,color:selected.color,padding:"3px 8px",borderRadius:R.pill,border:`1px solid ${selected.color}44`}}>{el}</span>
                  ))}
                </div>
              )}
              {result.cta&&(
                <div style={{background:`${selected.color}22`,borderRadius:R.sm,padding:"8px 12px",textAlign:"center"}}>
                  <span style={{fontFamily:F.display,fontSize:12,color:selected.color,letterSpacing:1}}>CTA: {result.cta}</span>
                </div>
              )}
            </div>
            <Btn label="FORGE ANOTHER" variant="slate" size="sm" onClick={()=>{setResult(null);setPrompt("");setSelected(null);}} style={{width:"100%"}}/>
          </div>
        )}
        </GCard>
      )}
    </div>
  );
}

// ─── JOYCE AI PANEL ──────────────────────────────────────────────────────────
const JOYCE_SYSTEM = `You are Joyce AI, the intelligent co-host for SeeWhy LIVE powered by SwanyThree EntTech LLC. You help streamers run domino tournaments, tribute events, AI podcast sessions, music studio sessions, and multi-platform broadcasts. You know the SeeWhy LIVE platform deeply: 90/10 creator revenue split, State vs State domino competitions, Fallen/Passed Player Tribute events, Joyce AI co-host features, INS Forge creative tools, and Guardian AI moderation. Keep responses concise, broadcast-ready, and energetic. Use the creator's brand voice. Never reveal API keys or internal configs.`;

const JOYCE_QUICK = [
  {label:"🎯 Start SVS",prompt:"Help me open a State vs State domino tournament. What should I announce to viewers?"},
  {label:"🕊️ Tribute Intro",prompt:"Write a respectful 30-second tribute introduction for a fallen domino legend."},
  {label:"💰 Revenue Check",prompt:"Remind me how the 90/10 revenue split works on SeeWhy LIVE and how I can maximize my earnings tonight."},
  {label:"🎙️ Podcast Hook",prompt:"Give me a 20-second opening hook for my AI Podcast episode about domino culture."},
  {label:"🛡️ Moderation",prompt:"A viewer is being disruptive. What's the best way to handle this live without killing the vibe?"},
  {label:"🔥 Hype Chat",prompt:"Write 3 high-energy chat responses I can use to hype up the audience right now."},
];

function JoyceAIPanel() {
  const [messages, setMessages] = useState([
    {role:"assistant",text:"Hey! I'm Joyce AI — your SeeWhy LIVE co-host. Ask me anything about running your stream, the tournament, tributes, or revenue. Let's make this broadcast fire! 🔥"},
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(()=>{
    if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  },[messages]);

  async function send(text) {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    const newMessages = [...messages, {role:"user", text:userText}];
    setMessages(newMessages);
    setLoading(true);
    try {
      const history = newMessages.map(m=>m.role+": "+m.text).join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: JOYCE_SYSTEM + "\n\nConversation so far:\n" + history + "\n\nRespond as Joyce AI in 1-3 sentences. Be direct and broadcast-ready."
      });
      setMessages(m=>[...m,{role:"assistant",text:res||"Let's keep it moving — what do you need?"}]);
    } catch(e) {
      setMessages(m=>[...m,{role:"assistant",text:"I'm thinking... try me again in a sec! The stream must go on. 🎙️"}]);
    }
    setLoading(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,height:"100%"}} className="fade-up">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <SectionHeader title="JOYCE AI" sub="YOUR LIVE CO-HOST · POWERED BY CLAUDE"/>
        <Tag label="AI ACTIVE" color={C.green}/>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {JOYCE_QUICK.map((q,i)=>(
          <button key={i} onClick={()=>send(q.prompt)} disabled={loading}
            style={{fontSize:10,padding:"5px 10px",background:C.bg3,color:C.textD,border:`1px solid ${C.slate}`,borderRadius:R.pill,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}}>
            {q.label}
          </button>
        ))}
      </div>
      <div ref={chatRef} style={{flex:1,minHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,padding:"4px 0"}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start",gap:3}} className="fade-up">
            {m.role==="assistant"&&(
              <div style={{fontSize:10,color:C.gold,letterSpacing:1,paddingLeft:4}}>JOYCE AI</div>
            )}
            <div style={{
              maxWidth:"85%",padding:"10px 14px",
              background:m.role==="user"?`linear-gradient(135deg,${C.gold}33,${C.goldD}22)`:C.bg3,
              border:`1px solid ${m.role==="user"?C.gold+"55":C.slate}`,
              borderRadius:m.role==="user"?`${R.lg}px ${R.lg}px 4px ${R.lg}px`:`${R.lg}px ${R.lg}px ${R.lg}px 4px`,
              color:m.role==="user"?C.text:C.textD,fontSize:13,lineHeight:1.6,
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:C.bg3,border:`1px solid ${C.slate}`,borderRadius:`${R.lg}px ${R.lg}px ${R.lg}px 4px`,maxWidth:"60%"}}>
            <ThinkDots/><span style={{fontSize:11,color:C.textD}}>Joyce is thinking…</span>
          </div>
        )}
      </div>
      <GCard style={{padding:8}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Ask Joyce anything…"
            style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.text,fontSize:13,fontFamily:F.body}}
          />
          <Btn label="SEND" variant={loading?"slate":"gold"} size="sm" onClick={()=>send()} disabled={loading}/>
        </div>
      </GCard>
    </div>
  );
}

// ─── SETTINGS PANEL ──────────────────────────────────────────────────────────
function SettingsPanel() {
  const [streamKey, setStreamKey] = useState("swl_•••••••••••••••");
  const [rtmpUrl, setRtmpUrl] = useState("rtmp://live.seewhylive.online/stream");
  const [displayName, setDisplayName] = useState("SwanyThree");
  const [bio, setBio] = useState("SwanyThree EntTech LLC · Creator-First Broadcast Platform");
  const [notifs, setNotifs] = useState({tips:true,joins:true,raids:false,milestones:true});
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-up">
      <SectionHeader title="SETTINGS" sub="STREAM CONFIG · PROFILE · NOTIFICATIONS"/>

      <GCard>
        <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:12,letterSpacing:1}}>STREAM CONFIGURATION</div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:C.textM,letterSpacing:1,marginBottom:5}}>RTMP INGEST URL</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{flex:1,background:C.bg2,borderRadius:R.sm,padding:"8px 10px",fontSize:11,color:C.textD,fontFamily:F.mono}}>{rtmpUrl}</div>
            <button onClick={()=>{navigator.clipboard&&navigator.clipboard.writeText(rtmpUrl)}}
              style={{fontSize:12,padding:"6px 10px",background:C.slate,color:C.textD,border:`1px solid ${C.slateL}`,borderRadius:R.sm,cursor:"pointer"}}>
              COPY
            </button>
          </div>
        </div>
        <div>
          <div style={{fontSize:10,color:C.textM,letterSpacing:1,marginBottom:5}}>STREAM KEY</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{flex:1,background:C.bg2,borderRadius:R.sm,padding:"8px 10px",fontSize:11,color:C.textD,fontFamily:F.mono}}>
              {showKey?"swl_live_key_••••••••":streamKey}
            </div>
            <button onClick={()=>setShowKey(!showKey)}
              style={{fontSize:12,padding:"6px 10px",background:C.slate,color:C.textD,border:`1px solid ${C.slateL}`,borderRadius:R.sm,cursor:"pointer"}}>
              {showKey?"HIDE":"SHOW"}
            </button>
          </div>
          <div style={{fontSize:10,color:C.ruby,marginTop:4}}>⚠ Never share your stream key. Rotate if compromised.</div>
        </div>
      </GCard>

      <GCard>
        <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:12,letterSpacing:1}}>CREATOR PROFILE</div>
        <Inp label="Display Name" value={displayName} onChange={setDisplayName}/>
        <Inp label="Bio" value={bio} onChange={setBio} placeholder="Tell your story…"/>
      </GCard>

      <GCard glow>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontFamily:F.display,fontSize:13,color:C.gold,letterSpacing:1}}>REVENUE SPLIT</div>
          <Tag label="IMMUTABLE" color={C.ruby}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:`${C.gold}18`,borderRadius:R.md,padding:12,textAlign:"center",border:`1px solid ${C.gold}44`}}>
            <div style={{fontFamily:F.display,fontSize:32,color:C.gold}}>90%</div>
            <div style={{fontSize:10,color:C.textD}}>TO CREATOR</div>
          </div>
          <div style={{background:C.bg3,borderRadius:R.md,padding:12,textAlign:"center",border:`1px solid ${C.slate}`}}>
            <div style={{fontFamily:F.display,fontSize:32,color:C.textM}}>10%</div>
            <div style={{fontSize:10,color:C.textM}}>PLATFORM FEE</div>
          </div>
        </div>
        <div style={{fontSize:11,color:C.textM,marginTop:8,textAlign:"center"}}>CREATOR_SHARE = 0.90 · This cannot be changed.</div>
      </GCard>

      <GCard>
        <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:12,letterSpacing:1}}>NOTIFICATIONS</div>
        {Object.entries(notifs).map(([key,val])=>(
          <div key={key} onClick={()=>setNotifs(n=>({...n,[key]:!n[key]}))}
            style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.slate}44`,cursor:"pointer"}}>
            <span style={{fontSize:12,color:C.textD,textTransform:"capitalize"}}>{key==="joins"?"New Viewers":key==="tips"?"Tips Received":key==="raids"?"Raid Alerts":"Milestones"}</span>
            <div style={{width:36,height:20,background:val?C.gold:C.slate,borderRadius:10,position:"relative",transition:"background .2s"}}>
              <div style={{width:16,height:16,background:C.text,borderRadius:8,position:"absolute",top:2,left:val?18:2,transition:"left .2s"}}/>
            </div>
          </div>
        ))}
      </GCard>

      <GCard>
        <div style={{fontFamily:F.display,fontSize:13,color:C.gold,marginBottom:12,letterSpacing:1}}>ABOUT</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {[
            {label:"Version",value:"SeeWhy LIVE v36"},
            {label:"Build",value:"SwanyThree EntTech LLC"},
            {label:"Platform","value":"Creator-First Broadcast"},
            {label:"Revenue Model",value:"90/10 · Creator Keeps 90%"},
            {label:"AI Stack",value:"Claude Sonnet + Haiku"},
          ].map(r=>(
            <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.slate}22`}}>
              <span style={{fontSize:11,color:C.textM}}>{r.label}</span>
              <span style={{fontSize:11,color:C.textD,fontFamily:F.mono}}>{r.value}</span>
            </div>
          ))}
        </div>
      </GCard>

      <Btn label={saved?"SAVED ✓":"SAVE SETTINGS"} variant={saved?"green":"gold"} size="lg" onClick={save} style={{width:"100%"}}/>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const PANEL_MAP = {
  stage:      <StagePanel/>,
  svs:        <SVSPanel/>,
  tribute:    <TributePanel/>,
  podcast:    <PodcastPanel/>,
  music:      <MusicStudioPanel/>,
  platforms:  <PlatformsPanel/>,
  watchparty: <WatchPartyPanel/>,
  analytics:  <AnalyticsPanel/>,
  monetize:   <MonetizePanel/>,
  guardian:   <GuardianPanel/>,
  insforge:   <InsForgePanel/>,
  swanybot:   <JoyceAIPanel/>,
  settings:   <SettingsPanel/>,
};

const BOTTOM_NAV = ["stage","svs","tribute","podcast","watchparty"];

export default function SeeWhyLIVEv36() {
  const [activeTab, setActiveTab] = useState("stage");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLive] = useState(true);

  const currentTab = TABS.find(t=>t.id===activeTab)||TABS[0];

  function navTo(id) {
    setActiveTab(id);
    setDrawerOpen(false);
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",position:"relative"}}>

        {/* TOP BAR */}
        <div style={{
          position:"sticky",top:0,zIndex:100,
          background:`${C.bg}EE`,backdropFilter:"blur(12px)",
          borderBottom:`1px solid ${C.slate}`,
          display:"flex",alignItems:"center",gap:10,
          padding:"10px 14px",
        }}>
          <button onClick={()=>setDrawerOpen(!drawerOpen)}
            style={{background:"transparent",border:"none",cursor:"pointer",padding:4,display:"flex",flexDirection:"column",gap:4}}>
            <div style={{width:20,height:2,background:drawerOpen?C.gold:C.textD,borderRadius:1,transformOrigin:"center",transform:drawerOpen?"rotate(45deg) translate(4px,4px)":"none",transition:"all .2s"}}/>
            <div style={{width:20,height:2,background:drawerOpen?C.gold:C.textD,borderRadius:1,opacity:drawerOpen?0:1,transition:"all .2s"}}/>
            <div style={{width:20,height:2,background:drawerOpen?C.gold:C.textD,borderRadius:1,transformOrigin:"center",transform:drawerOpen?"rotate(-45deg) translate(4px,-4px)":"none",transition:"all .2s"}}/>
          </button>
          <div style={{fontFamily:F.display,fontSize:20,color:C.gold,letterSpacing:2,flex:1}}>SEEWHY LIVE</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {isLive&&(
              <div style={{display:"flex",alignItems:"center",gap:4,background:`${C.ruby}33`,border:`1px solid ${C.ruby}`,borderRadius:R.pill,padding:"3px 8px"}}>
                <div style={{width:6,height:6,borderRadius:3,background:C.ruby,animation:"pulse 1s infinite"}}/>
                <span style={{fontSize:10,color:C.ruby,fontFamily:F.mono,fontWeight:700}}>LIVE</span>
              </div>
            )}
            <div style={{fontSize:10,color:C.gold,fontFamily:F.mono,background:`${C.gold}18`,borderRadius:R.pill,padding:"3px 8px",border:`1px solid ${C.gold}44`}}>90/10</div>
          </div>
          <div style={{fontSize:12,color:C.textM,fontFamily:F.display,letterSpacing:1}}>
            {currentTab.icon} {currentTab.label}
          </div>
        </div>

        {/* DRAWER OVERLAY */}
        {drawerOpen&&(
          <div style={{position:"fixed",inset:0,zIndex:200}} onClick={()=>setDrawerOpen(false)}>
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.7)"}}/>
            <div onClick={e=>e.stopPropagation()}
              style={{
                position:"absolute",left:0,top:0,bottom:0,width:260,
                background:C.bg2,borderRight:`1px solid ${C.slate}`,
                display:"flex",flexDirection:"column",
                animation:"slideIn .2s ease forwards",
              }}>
              <div style={{padding:"16px 16px 10px",borderBottom:`1px solid ${C.slate}`}}>
                <div style={{fontFamily:F.display,fontSize:22,color:C.gold,letterSpacing:2}}>SEEWHY LIVE</div>
                <div style={{fontSize:10,color:C.textM,letterSpacing:1,marginTop:2}}>v36 · SwanyThree EntTech LLC</div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
                {TABS.map(t=>(
                  <div key={t.id} onClick={()=>navTo(t.id)}
                    style={{
                      display:"flex",alignItems:"center",gap:12,
                      padding:"12px 16px",cursor:"pointer",
                      background:activeTab===t.id?`${C.gold}18`:"transparent",
                      borderLeft:`3px solid ${activeTab===t.id?C.gold:"transparent"}`,
                      transition:"all .15s",
                    }}>
                    <span style={{fontSize:18}}>{t.icon}</span>
                    <span style={{fontSize:13,color:activeTab===t.id?C.gold:C.textD,fontFamily:F.display,letterSpacing:1}}>{t.label}</span>
                  </div>
                ))}
              </div>
              <div style={{padding:"12px 16px",borderTop:`1px solid ${C.slate}`,background:C.bg3}}>
                <div style={{fontSize:10,color:C.textM,textAlign:"center"}}>Creator · 90% · Always</div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div style={{flex:1,overflowY:"auto",padding:"14px 14px 80px"}}>
          {PANEL_MAP[activeTab]}
        </div>

        {/* BOTTOM NAV */}
        <div style={{
          position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:480,
          background:`${C.bg}F0`,backdropFilter:"blur(12px)",
          borderTop:`1px solid ${C.slate}`,
          display:"flex",zIndex:90,
        }}>
          {BOTTOM_NAV.map(id=>{
            const tab = TABS.find(t=>t.id===id);
            if(!tab) return null;
            const active = activeTab===id;
            return (
              <button key={id} onClick={()=>navTo(id)} style={{
                flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                padding:"8px 4px",background:"transparent",border:"none",cursor:"pointer",
                borderTop:`2px solid ${active?C.gold:"transparent"}`,transition:"all .15s",
              }}>
                <span style={{fontSize:18}}>{tab.icon}</span>
                <span style={{fontSize:8,color:active?C.gold:C.textM,fontFamily:F.display,letterSpacing:.5,lineHeight:1}}>{tab.label.split(" ")[0]}</span>
              </button>
            );
          })}
          <button onClick={()=>setDrawerOpen(true)} style={{
            flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            padding:"8px 4px",background:"transparent",border:"none",cursor:"pointer",
            borderTop:`2px solid ${!BOTTOM_NAV.includes(activeTab)?C.gold:"transparent"}`,
            transition:"all .15s",
          }}>
            <span style={{fontSize:18}}>☰</span>
            <span style={{fontSize:8,color:!BOTTOM_NAV.includes(activeTab)?C.gold:C.textM,fontFamily:F.display,letterSpacing:.5}}>MORE</span>
          </button>
        </div>

      </div>
    </>
  );
}
