import { useState, useEffect, useRef } from "react";
var G = {
  black:"#080808", darkBg:"#0D0D0D", cardBg:"#111111",
  surfaceBg:"#161616", crimson:"#8B0000", crimsonBright:"#C41E3A",
  gold:"#D4AF37", goldBright:"#FFD700", cyan:"#00E5FF",
  volt:"#D4AF37", white:"#FFFFFF", gray:"#888888",
  grayDim:"#444444", red:"#FF3B30", green:"#30D158",
  purple:"#BF5FFF", orange:"#FF9500",
  fOrb:"'Orbitron',sans-serif", fRaj:"'Rajdhani',sans-serif",
  fMon:"'Share Tech Mono',monospace", fBeb:"'Bebas Neue',cursive",
};

var CREATOR_SHARE = 0.90;
function calcSplit(amount) {
  var cents = Math.floor(amount * 100);
  var creator = Math.floor(cents * CREATOR_SHARE);
  return { creator: creator / 100, platform: (cents - creator) / 100 };
}
function fmtMoney(n) { return "$"+(Math.floor(n * 100) / 100).toFixed(2); }
function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
function lsGet(key, def) { try { var v=localStorage.getItem(key); return v!==null?JSON.parse(v):def; } catch(e) { return def; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} }

// ── MERCH SHOP ────────────────────────────────────────────────────
var MERCH_ITEMS = [
  {id:"m1",name:"Domino King Tee",price:29.99,icon:"👕",category:"Apparel",color:"#C41E3A",desc:"Premium crimson+gold tee"},
  {id:"m2",name:"Washington Classic Cap",price:24.99,icon:"🧢",category:"Apparel",color:"#D4AF37",desc:"Structured 6-panel embroidered"},
  {id:"m3",name:"SeeWhy LIVE Hoodie",price:54.99,icon:"🧥",category:"Apparel",color:"#BF5FFF",desc:"Heavy fleece · logo back print"},
  {id:"m4",name:"Domino Set (Full)",price:39.99,icon:"🎲",category:"Games",color:"#00E5FF",desc:"Double-6 · laser engraved tiles"},
  {id:"m5",name:"VibeN'Bones Mug",price:14.99,icon:"☕",category:"Lifestyle",color:"#FF9500",desc:"15oz ceramic · microwave safe"},
  {id:"m6",name:"Washington Classic Poster",price:19.99,icon:"🖼️",category:"Art",color:"#D4AF37",desc:"18×24 · glossy · tournament art"},
];

export function MerchShopV2({ onClose }) {
  var [cart, setCart] = useState([]);
  var [filter, setFilter] = useState("All");
  var [checkout, setCheckout] = useState(false);
  var categories = ["All","Apparel","Games","Lifestyle","Art"];
  var visible = filter==="All"?MERCH_ITEMS:MERCH_ITEMS.filter(function(i){return i.category===filter;});
  var total = cart.reduce(function(s,id){var it=MERCH_ITEMS.find(function(m){return m.id===id;});return s+(it?it.price:0);},0);
  function addToCart(id){ if(cart.indexOf(id)===-1) setCart(function(c){return c.concat([id]);}); }
  function removeFromCart(id){ setCart(function(c){return c.filter(function(x){return x!==id;});}); }

  if(checkout) return (
    <div style={{padding:"14px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <button onClick={function(){setCheckout(false);}} style={{background:"none",border:"none",color:G.gold,fontSize:16,cursor:"pointer"}}>←</button>
        <span style={{fontFamily:G.fOrb,fontSize:11,color:G.gold,letterSpacing:2}}>CHECKOUT</span>
      </div>
      {cart.map(function(id){var it=MERCH_ITEMS.find(function(m){return m.id===id;});if(!it)return null;return(
        <div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #1a1a1a"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{it.icon}</span><span style={{fontFamily:G.fRaj,fontSize:12,color:G.white}}>{it.name}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:G.fMon,fontSize:11,color:G.gold}}>${it.price.toFixed(2)}</span><button onClick={function(){removeFromCart(id);}} style={{background:"none",border:"none",color:G.red,fontSize:12,cursor:"pointer"}}>✕</button></div>
        </div>
      );})}
      <div style={{marginTop:10,padding:"10px",background:G.surfaceBg,borderRadius:8,border:"1px solid rgba(212,175,55,0.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #333",paddingTop:5,marginTop:5}}><span style={{fontFamily:G.fBeb,fontSize:14,color:G.gold}}>TOTAL</span><span style={{fontFamily:G.fBeb,fontSize:18,color:G.gold}}>${total.toFixed(2)}</span></div>
      </div>
      <button style={{width:"100%",marginTop:10,fontSize:13,padding:"10px 18px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:G.fRaj,fontWeight:700,letterSpacing:1,background:"linear-gradient(135deg,#8B0000,#D4AF37)",color:"#000"}} onClick={function(){setCart([]);setCheckout(false);}}>PLACE ORDER · ${total.toFixed(2)}</button>
      <div style={{fontFamily:G.fMon,fontSize:8,color:G.grayDim,textAlign:"center",marginTop:4}}>Stripe Connect · Ships 5-7 days · Powered by Printful</div>
    </div>
  );

  return (
    <div>
      <div style={{padding:"10px 14px 6px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>🛍️</span>
          <span style={{fontFamily:G.fOrb,fontSize:10,color:G.white,letterSpacing:2}}>MERCH SHOP</span>
          {cart.length>0&&<div style={{width:16,height:16,borderRadius:8,background:G.crimsonBright,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.fMon,fontSize:8,color:"#fff"}}>{cart.length}</div>}
        </div>
        <div style={{display:"flex",gap:6}}>
          {cart.length>0&&<button style={{fontSize:10,padding:"4px 10px",background:"linear-gradient(135deg,#8B0000,#D4AF37)",color:"#000",borderRadius:6,border:"none",cursor:"pointer",fontFamily:G.fRaj,fontWeight:700}} onClick={function(){setCheckout(true);}}>CART ${total.toFixed(2)}</button>}
          {onClose&&<button onClick={onClose} style={{background:"none",border:"none",color:G.gray,fontSize:16,cursor:"pointer"}}>✕</button>}
        </div>
      </div>
      <div style={{display:"flex",gap:4,padding:"0 14px 6px",overflowX:"auto"}}>
        {categories.map(function(c){return <button key={c} onClick={function(){setFilter(c);}} style={{padding:"2px 8px",borderRadius:10,border:"1px solid "+(filter===c?G.crimsonBright:G.grayDim),background:filter===c?"rgba(196,30,58,.15)":"none",color:filter===c?G.crimsonBright:G.gray,fontFamily:G.fMon,fontSize:8,cursor:"pointer",whiteSpace:"nowrap"}}>{c}</button>;})}
      </div>
      <div style={{padding:"0 14px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
        {visible.map(function(item){
          var inCart=cart.indexOf(item.id)!==-1;
          return (
            <div key={item.id} style={{background:G.surfaceBg,borderRadius:9,border:"1px solid "+(inCart?item.color:"rgba(68,68,68,0.4)"),overflow:"hidden"}}>
              <div style={{height:70,background:"radial-gradient(circle at 40% 40%,"+item.color+"22,#080808)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>{item.icon}</div>
              <div style={{padding:"7px 8px"}}>
                <div style={{fontFamily:G.fRaj,fontSize:11,fontWeight:700,color:G.white,marginBottom:1}}>{item.name}</div>
                <div style={{fontFamily:G.fMon,fontSize:7,color:G.gray,marginBottom:5}}>{item.desc}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontFamily:G.fBeb,fontSize:14,color:item.color}}>${item.price.toFixed(2)}</span>
                  <button onClick={function(){inCart?removeFromCart(item.id):addToCart(item.id);}} style={{padding:"3px 7px",borderRadius:4,border:"1px solid "+(inCart?G.red:item.color),background:inCart?"rgba(255,59,48,.15)":item.color+"22",color:inCart?G.red:item.color,fontFamily:G.fMon,fontSize:8,cursor:"pointer"}}>{inCart?"REMOVE":"ADD"}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── VIEWER CONTROLS (v16.2) ───────────────────────────────────────
export function ViewerControlsV2({ onClose }) {
  var [volume, setVolume] = useState(80);
  var [quality, setQuality] = useState("720p");
  var [pip, setPip] = useState(false);
  var [handRaised, setHandRaised] = useState(false);
  var [muted, setMuted] = useState(false);
  var qualities = ["1080p","720p","480p","360p","Auto"];

  function togglePip(){
    var el=document.querySelector("video");
    if(!el){setPip(false);return;}
    if(document.pictureInPictureElement){document.exitPictureInPicture();setPip(false);}
    else{el.requestPictureInPicture().then(function(){setPip(true);}).catch(function(){setPip(false);});}
  }
  function toggleFS(){
    var root=document.querySelector(".sw-root");
    if(!root)return;
    if(!document.fullscreenElement){root.requestFullscreen&&root.requestFullscreen();}
    else{document.exitFullscreen&&document.exitFullscreen();}
  }

  return (
    <div className="card card-c" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.cyan,letterSpacing:2}}>🎛️ VIEWER CONTROLS</span>
        {onClose&&<button onClick={onClose} style={{background:"none",border:"none",color:G.gray,cursor:"pointer",fontSize:14}}>✕</button>}
      </div>
      <div style={{padding:"10px 14px",display:"flex",flexDirection:"column",gap:10}}>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontFamily:G.fMon,fontSize:9,color:G.grayDim,letterSpacing:1}}>VOLUME</span><span style={{fontFamily:G.fMon,fontSize:9,color:G.gold}}>{volume}%</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>{volume===0?"🔇":volume<40?"🔉":"🔊"}</span>
            <input type="range" min={0} max={100} value={volume} onChange={function(e){setVolume(parseInt(e.target.value));}} style={{flex:1,accentColor:G.gold}} />
          </div>
        </div>
        <div>
          <div style={{fontFamily:G.fMon,fontSize:9,color:G.grayDim,letterSpacing:1,marginBottom:5}}>STREAM QUALITY</div>
          <div style={{display:"flex",gap:4}}>
            {qualities.map(function(q){return <button key={q} onClick={function(){setQuality(q);}} style={{flex:1,padding:"5px 0",borderRadius:5,border:"1px solid "+(quality===q?G.volt:G.grayDim),background:quality===q?"rgba(200,255,0,.1)":"none",color:quality===q?G.volt:G.gray,fontFamily:G.fMon,fontSize:8,cursor:"pointer"}}>{q}</button>;})}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
          <button onClick={togglePip} style={{padding:"8px",borderRadius:7,border:"1px solid "+(pip?G.cyan:G.grayDim),background:pip?"rgba(0,229,255,.1)":"none",color:pip?G.cyan:G.gray,fontFamily:G.fRaj,fontSize:11,fontWeight:700,cursor:"pointer"}}>{pip?"✓":"⧉"} PIP</button>
          <button onClick={toggleFS} style={{padding:"8px",borderRadius:7,border:"1px solid "+G.grayDim,background:"none",color:G.gray,fontFamily:G.fRaj,fontSize:11,fontWeight:700,cursor:"pointer"}}>⛶ FULL</button>
          <button onClick={function(){setMuted(function(m){return !m;});}} style={{padding:"8px",borderRadius:7,border:"1px solid "+(muted?G.red:G.grayDim),background:muted?"rgba(255,59,48,.1)":"none",color:muted?G.red:G.gray,fontFamily:G.fRaj,fontSize:11,fontWeight:700,cursor:"pointer"}}>{muted?"🔇 UNMUTE":"🔊 MUTE"}</button>
          <button onClick={function(){setHandRaised(function(h){return !h;});}} style={{padding:"8px",borderRadius:7,border:"1px solid "+(handRaised?G.orange:G.grayDim),background:handRaised?"rgba(255,149,0,.1)":"none",color:handRaised?G.orange:G.gray,fontFamily:G.fRaj,fontSize:11,fontWeight:700,cursor:"pointer"}}>{handRaised?"✋ LOWER":"✋ RAISE"}</button>
        </div>
        <div style={{padding:"6px 8px",background:G.surfaceBg,borderRadius:6,border:"1px solid #222",display:"flex",gap:5,flexWrap:"wrap"}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:20,fontSize:7,fontWeight:700,fontFamily:G.fRaj,background:"rgba(200,255,0,.12)",border:"1px solid #D4AF37",color:"#D4AF37"}}>{quality}</span>
          <span style={{display:"inline-flex",fontSize:7,padding:"2px 7px",borderRadius:10,background:"rgba(255,149,0,.1)",border:"1px solid "+G.orange,color:G.orange,fontFamily:G.fMon,fontWeight:700}}>{volume}% vol</span>
          {muted&&<span style={{display:"inline-flex",fontSize:7,padding:"2px 7px",borderRadius:10,background:"rgba(196,30,58,.2)",border:"1px solid #C41E3A",color:"#FF6B6B",fontFamily:G.fMon,fontWeight:700}}>MUTED</span>}
          {pip&&<span style={{display:"inline-flex",fontSize:7,padding:"2px 7px",borderRadius:10,background:"rgba(0,229,255,.15)",border:"1px solid #00E5FF",color:"#00E5FF",fontFamily:G.fMon,fontWeight:700}}>PIP</span>}
          {handRaised&&<span style={{display:"inline-flex",fontSize:7,padding:"2px 7px",borderRadius:10,background:"rgba(255,149,0,.15)",border:"1px solid "+G.orange,color:G.orange,fontFamily:G.fMon,fontWeight:700}}>✋ RAISED</span>}
        </div>
      </div>
    </div>
  );
}

// ── IN-ROOM SUB WIDGET (v16.2) ────────────────────────────────────
var SUB_TIERS_V2 = [
  {id:"bronze",name:"Domino Fan",price:4.99,icon:"🥉",color:"#cd7f32",perks:["Sub badge","Sub-only chat","Support creator"]},
  {id:"silver",name:"Tile Holder",price:9.99,icon:"🥈",color:"#C0C0C0",perks:["Bronze perks","Early access","Exclusive emotes"]},
  {id:"gold",name:"Washington Classic VIP",price:24.99,icon:"🥇",color:"#D4AF37",perks:["Silver perks","Monthly 1:1","Priority support"]},
];

export function InRoomSubWidgetV2({ creatorName, onClose }) {
  var [selected, setSelected] = useState("silver");
  var [subbed, setSubbed] = useState(false);
  var tier = SUB_TIERS_V2.find(function(t){return t.id===selected;})||SUB_TIERS_V2[1];
  var split = calcSplit(tier.price);
  return (
    <div className="card card-g" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14}}>🏅</span><span style={{fontFamily:G.fOrb,fontSize:10,color:G.gold,letterSpacing:2}}>SUBSCRIBE</span></div>
        {onClose&&<button onClick={onClose} style={{background:"none",border:"none",color:G.gray,cursor:"pointer",fontSize:14}}>✕</button>}
      </div>
      <div style={{padding:"10px 14px"}}>
        <div style={{fontFamily:G.fRaj,fontSize:12,color:G.gray,marginBottom:10,textAlign:"center"}}>Support {creatorName||"creator"} every month</div>
        <div style={{display:"flex",gap:5,marginBottom:12}}>
          {SUB_TIERS_V2.map(function(t){return <button key={t.id} onClick={function(){setSelected(t.id);setSubbed(false);}} style={{flex:1,padding:"7px 3px",borderRadius:7,border:"2px solid "+(selected===t.id?t.color:G.grayDim),background:selected===t.id?t.color+"18":"none",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:16}}>{t.icon}</div><div style={{fontFamily:G.fMon,fontSize:8,color:selected===t.id?t.color:G.gray,marginTop:1}}>${t.price}</div></button>;})}
        </div>
        <div style={{background:G.surfaceBg,borderRadius:9,padding:"10px",border:"1px solid "+tier.color+"44",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}><span style={{fontSize:18}}>{tier.icon}</span><div><div style={{fontFamily:G.fRaj,fontSize:13,fontWeight:700,color:tier.color}}>{tier.name}</div><div style={{fontFamily:G.fMon,fontSize:9,color:G.gray}}>${tier.price}/month</div></div></div>
          {tier.perks.map(function(p){return <div key={p} style={{fontFamily:G.fRaj,fontSize:11,color:G.white,display:"flex",alignItems:"center",gap:5,marginBottom:2}}><span style={{color:tier.color}}>✓</span>{p}</div>;})}
        </div>
        {!subbed ? (
          <>
            <button style={{width:"100%",fontSize:13,marginBottom:6,padding:"10px 18px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:G.fRaj,fontWeight:700,letterSpacing:1,background:"linear-gradient(135deg,#8B0000,#D4AF37)",color:"#000"}} onClick={function(){setSubbed(true);}}>SUBSCRIBE · ${tier.price}/mo</button>
            <div style={{fontFamily:G.fMon,fontSize:8,color:G.grayDim,textAlign:"center"}}>{(creatorName||"Creator")+" keeps "+fmtMoney(split.creator)+"/mo · Platform "+fmtMoney(split.platform)}</div>
          </>
        ) : (
          <div style={{textAlign:"center",padding:"10px",background:"rgba(212,175,55,.1)",borderRadius:8,border:"1px solid "+tier.color,animation:"slideUp .3s ease-out"}}>
            <div style={{fontSize:28,marginBottom:3}}>{tier.icon}</div>
            <div style={{fontFamily:G.fBeb,fontSize:20,color:tier.color}}>SUBSCRIBED!</div>
            <div style={{fontFamily:G.fMon,fontSize:9,color:G.gray,marginTop:3}}>Welcome to {tier.name}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TIP ALERT CONFIG (v16.2) ──────────────────────────────────────
export function TipAlertConfig() {
  var [config, setConfig] = useState(lsGet("tip_alert_cfg",{sound:true,animation:true,minAmount:0.50,duration:4}));
  var [saved, setSaved] = useState(false);
  function save(){ lsSet("tip_alert_cfg",config); setSaved(true); setTimeout(function(){setSaved(false);},1800); }
  return (
    <div className="card card-g" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:14}}>💰</span>
        <span style={{fontFamily:G.fOrb,fontSize:10,color:G.gold,letterSpacing:2}}>TIP ALERT CONFIG</span>
      </div>
      <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
        {[{l:"Sound effects",k:"sound"},{l:"Gift animation overlay",k:"animation"}].map(function(s){return(
          <div key={s.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:G.fRaj,fontSize:13,color:G.white}}>{s.l}</span>
            <div onClick={function(){setConfig(function(c){var n=Object.assign({},c);n[s.k]=!n[s.k];return n;});}} style={{width:30,height:17,borderRadius:9,background:config[s.k]?"#C41E3A":G.grayDim,position:"relative",cursor:"pointer",transition:"background .2s"}}><div style={{position:"absolute",top:3,left:config[s.k]?16:3,width:11,height:11,borderRadius:"50%",background:G.white,transition:"left .18s"}} /></div>
          </div>
        );})}
        <div>
          <div style={{fontFamily:G.fMon,fontSize:9,color:G.grayDim,letterSpacing:1,marginBottom:3}}>MIN ALERT: {fmtMoney(config.minAmount)}</div>
          <input type="range" min={0} max={50} step={0.5} value={config.minAmount} onChange={function(e){setConfig(function(c){return Object.assign({},c,{minAmount:parseFloat(e.target.value)});});}} style={{accentColor:G.gold,width:"100%"}} />
        </div>
        <div>
          <div style={{fontFamily:G.fMon,fontSize:9,color:G.grayDim,letterSpacing:1,marginBottom:3}}>DURATION: {config.duration}s</div>
          <input type="range" min={2} max={10} step={1} value={config.duration} onChange={function(e){setConfig(function(c){return Object.assign({},c,{duration:parseInt(e.target.value)});});}} style={{accentColor:G.gold,width:"100%"}} />
        </div>
        <button style={{width:"100%",fontSize:12,padding:"9px 18px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:G.fRaj,fontWeight:700,letterSpacing:1,background:saved?"#D4AF37":"#8B0000",color:saved?"#080808":"#D4AF37"}} onClick={save}>{saved?"✓ SAVED":"SAVE ALERT CONFIG"}</button>
      </div>
    </div>
  );
}

// ── ENGAGEMENT DASHBOARD (v16.2) ──────────────────────────────────
export function EngagementDashboardV2() {
  var [live, setLive] = useState(true);
  var [data, setData] = useState({viewers:138,engageScore:84,chatRate:41,tipRate:2.3,peakViewers:203,retentionPct:73,newFollowers:12,breakdown:{superFans:8,regulars:47,casuals:83},heatmap:[60,75,88,92,84,78,95,103,138,124,108]});

  useEffect(function(){
    if(!live) return;
    var iv=setInterval(function(){
      setData(function(d){
        var dv=Math.floor(Math.random()*8-4);var nv=Math.max(0,d.viewers+dv);
        var score=clamp(d.engageScore+Math.floor(Math.random()*4-2),0,100);
        return Object.assign({},d,{viewers:nv,engageScore:score,chatRate:clamp(d.chatRate+Math.floor(Math.random()*6-3),0,100),tipRate:Math.max(0,Math.round((d.tipRate+(Math.random()-.5)*.3)*10)/10),peakViewers:Math.max(d.peakViewers,nv),heatmap:d.heatmap.concat([nv]).slice(-11)});
      });
    },4000);
    return function(){clearInterval(iv);};
  },[live]);

  var scoreColor=data.engageScore>=80?G.green:data.engageScore>=60?G.gold:G.red;
  var maxH=Math.max.apply(null,data.heatmap)||1;

  return (
    <div className="card card-v" style={{margin:"0 16px 14px"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:13}}>📈</span>
          <span style={{fontFamily:G.fOrb,fontSize:10,color:G.volt,letterSpacing:2}}>ENGAGEMENT</span>
          {live&&<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:20,fontSize:7,fontWeight:700,fontFamily:G.fRaj,background:"rgba(200,255,0,.12)",border:"1px solid #D4AF37",color:"#D4AF37",animation:"pulse 2s infinite"}}>● LIVE</span>}
        </div>
        <button onClick={function(){setLive(function(l){return !l;});}} style={{fontFamily:G.fMon,fontSize:8,color:live?G.orange:G.green,background:"none",border:"none",cursor:"pointer"}}>{live?"PAUSE":"RESUME"}</button>
      </div>
      <div style={{padding:"10px 14px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
          <div style={{textAlign:"center",padding:"8px 4px",background:G.surfaceBg,borderRadius:7,border:"1px solid "+G.volt+"33",animation:"engageRing 2s ease infinite"}}>
            <div style={{fontFamily:G.fMon,fontSize:7,color:G.grayDim}}>VIEWERS</div>
            <div style={{fontFamily:G.fBeb,fontSize:24,color:G.volt,lineHeight:1}}>{data.viewers}</div>
            <div style={{fontFamily:G.fMon,fontSize:7,color:G.gray}}>pk {data.peakViewers}</div>
          </div>
          <div style={{textAlign:"center",padding:"8px 4px",background:G.surfaceBg,borderRadius:7,border:"1px solid "+scoreColor+"33"}}>
            <div style={{fontFamily:G.fMon,fontSize:7,color:G.grayDim}}>ENGAGE</div>
            <div style={{fontFamily:G.fBeb,fontSize:24,color:scoreColor,lineHeight:1}}>{data.engageScore}</div>
            <div style={{fontFamily:G.fMon,fontSize:7,color:G.gray}}>/ 100</div>
          </div>
          <div style={{textAlign:"center",padding:"8px 4px",background:G.surfaceBg,borderRadius:7,border:"1px solid "+G.green+"33"}}>
            <div style={{fontFamily:G.fMon,fontSize:7,color:G.grayDim}}>TIPS/MIN</div>
            <div style={{fontFamily:G.fBeb,fontSize:24,color:G.green,lineHeight:1}}>{data.tipRate}</div>
            <div style={{fontFamily:G.fMon,fontSize:7,color:G.gray}}>+{data.newFollowers} follows</div>
          </div>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontFamily:G.fMon,fontSize:7,color:G.grayDim,marginBottom:3}}>VIEWER TREND</div>
          <div style={{display:"flex",alignItems:"flex-end",height:44,gap:2,background:G.surfaceBg,borderRadius:5,padding:"4px 6px"}}>
            {data.heatmap.map(function(v,i){return <div key={i} style={{flex:1,background:"linear-gradient(to top,#D4AF37,#D4AF3733)",borderRadius:2,height:(v/maxH*100)+"%",minHeight:2,transition:"height .8s"}} />;}) }
          </div>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontFamily:G.fMon,fontSize:7,color:G.grayDim,marginBottom:3}}>AUDIENCE BREAKDOWN</div>
          <div style={{display:"flex",borderRadius:4,overflow:"hidden",height:8}}>
            <div style={{width:((data.breakdown.superFans/Math.max(data.viewers,1))*100)+"%",background:G.gold,transition:"width .5s"}} />
            <div style={{width:((data.breakdown.regulars/Math.max(data.viewers,1))*100)+"%",background:G.cyan,transition:"width .5s"}} />
            <div style={{flex:1,background:G.surfaceBg}} />
          </div>
          <div style={{display:"flex",gap:10,marginTop:3}}>
            <span style={{fontFamily:G.fMon,fontSize:7,color:G.gold}}>★ {data.breakdown.superFans} super fans</span>
            <span style={{fontFamily:G.fMon,fontSize:7,color:G.cyan}}>● {data.breakdown.regulars} regulars</span>
            <span style={{fontFamily:G.fMon,fontSize:7,color:G.gray}}>○ {data.breakdown.casuals} casuals</span>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[{l:"CHAT/MIN",v:data.chatRate,c:G.orange},{l:"RETENTION",v:data.retentionPct+"%",c:G.purple},{l:"FOLLOWS",v:"+"+data.newFollowers,c:G.green}].map(function(s){return(
            <div key={s.l} style={{flex:1,padding:"6px",background:G.surfaceBg,borderRadius:5,textAlign:"center"}}><div style={{fontFamily:G.fMon,fontSize:7,color:G.grayDim}}>{s.l}</div><div style={{fontFamily:G.fMon,fontSize:13,color:s.c}}>{s.v}</div></div>
          );})}
        </div>
      </div>
    </div>
  );
}