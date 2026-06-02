
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
