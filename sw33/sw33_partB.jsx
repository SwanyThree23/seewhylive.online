
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
