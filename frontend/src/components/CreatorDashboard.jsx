import React,{useState}from"react";
const D={obs:"#07050A",surf:"#0F0D14",card:"#161220",bord:"#2a1f3d",gold:"#C9A84C",golH:"#E8C46A",burg:"#800020",burH:"#C01838",volt:"#C8FF00",crm:"#F0E6CC",mut:"#6b5c7e",suc:"#10b981",mono:"'IBM Plex Mono',monospace",disp:"'Bebas Neue',sans-serif",body:"'Barlow Condensed',sans-serif"};
const RANGES=["7D","30D","365D"];
const QA=[{label:"Evmux Console",icon:"⚡",url:"https://evmux.com",c:D.volt},{label:"VDO.Ninja",icon:"🎥",url:"https://vdo.ninja",c:D.gold},{label:"GoBrunch Event",icon:"☕",url:"https://gobbrunch.com",c:D.burH},{label:"Community Network",icon:"🌐",url:"https://seewhylive.online",c:D.golH}];
const STATS={"7D":{rev:312.40,streams:4,peak:847,followers:203,tips:189.20,avg:"8m 42s"},"30D":{rev:1847.90,streams:18,peak:2341,followers:1204,tips:1102.50,avg:"11m 18s"},"365D":{rev:22180,streams:214,peak:8903,followers:18420,tips:13408,avg:"14m 55s"}};
const DAILY={"7D":[12,45,28,89,34,156,72],"30D":[22,34,18,65,48,92,31,27,54,83,19,66,44,71,38,92,57,43,88,34,61,75,49,33,97,52,68,41,85,90],"365D":Array.from({length:52},function(){return 0;})};
const STREAMS=[{title:"Washington Classic Domino Tournament",date:"2026-05-28",dur:"3h 42m",peak:847,rev:312.40,avg:"22m"},{title:"Cali Bones x VibeN'Bones Session",date:"2026-05-22",dur:"1h 18m",peak:412,rev:189.20,avg:"14m"},{title:"DOMINO ARENA — Season 4 Finals",date:"2026-05-15",dur:"2h 05m",peak:2341,rev:748.60,avg:"31m"},{title:"Creator Q&A + Watch Party",date:"2026-05-08",dur:"0h 54m",peak:203,rev:67.80,avg:"9m"}];
const TXN=[{date:"2026-05-31",amt:281.16,method:"CashApp",status:"paid"},{date:"2026-05-15",amt:673.74,method:"Zelle",status:"paid"},{date:"2026-05-01",amt:156.33,method:"PayPal",status:"paid"}];
function Bar({data,color}){const max=Math.max(...data,1);return React.createElement("div",{style:{display:"flex",alignItems:"flex-end",gap:3,height:80}},data.map((v,i)=>React.createElement("div",{key:i,style:{flex:1,height:Math.max(4,(v/max)*80)+"px",background:"linear-gradient("+color+","+color+"66)",borderRadius:"3px 3px 0 0"}})));}
function Card({icon,label,value,color}){return React.createElement("div",{style:{background:D.card,border:"1px solid "+D.bord,borderRadius:12,padding:"14px 16px",minWidth:140,flexShrink:0,position:"relative",overflow:"hidden"}},React.createElement("div",{style:{position:"absolute",top:0,left:0,right:0,height:2,background:color}}),React.createElement("div",{style:{fontSize:20,marginBottom:6}},icon),React.createElement("div",{style:{fontFamily:D.mono,fontSize:20,fontWeight:700,color:color}},value),React.createElement("div",{style:{fontFamily:D.body,fontSize:11,color:D.mut,marginTop:2,textTransform:"uppercase",letterSpacing:0.8}},label));}
export default function CreatorDashboard(){
const[range,setRange]=useState("30D");
const[showPayout,setShowPayout]=useState(false);
const s=STATS[range];
const bal=847.23;
const creatorBal=Math.floor(bal*0.90*100)/100;
return React.createElement("div",{style:{background:D.obs,minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:D.body,color:D.crm,paddingBottom:80}},
React.createElement("div",{style:{padding:"20px 16px 14px",background:D.surf,borderBottom:"1px solid "+D.bord,position:"sticky",top:0,zIndex:50}},
React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}},
React.createElement("div",null,React.createElement("div",{style:{fontFamily:D.disp,fontSize:28,color:D.golH,letterSpacing:2}},"CREATOR HQ"),React.createElement("div",{style:{fontFamily:D.mono,fontSize:10,color:D.mut}},"BROADCAST CONTROL ROOM")),
React.createElement("button",{onClick:()=>setShowPayout(true),style:{background:"linear-gradient(135deg,"+D.burg+","+D.burH+")",border:"none",borderRadius:10,padding:"10px 16px",fontFamily:D.disp,fontSize:14,color:D.crm,cursor:"pointer",letterSpacing:1}},"PAYOUT $"+creatorBal)),
React.createElement("div",{style:{display:"flex",gap:6,marginTop:14}},RANGES.map(r=>React.createElement("button",{key:r,onClick:()=>setRange(r),style:{flex:1,padding:"8px 0",background:range===r?D.gold:D.card,border:"1px solid "+(range===r?D.gold:D.bord),borderRadius:8,fontFamily:D.mono,fontSize:13,color:range===r?"#000":D.mut,cursor:"pointer",fontWeight:700}},r)))),
React.createElement("div",{style:{padding:16}},
React.createElement("div",{style:{marginBottom:20}},
React.createElement("div",{style:{fontFamily:D.disp,fontSize:16,color:D.golH,letterSpacing:1,marginBottom:10,borderLeft:"3px solid "+D.gold,paddingLeft:10}},"QUICK ACCESS"),
React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}},QA.map(q=>React.createElement("a",{key:q.label,href:q.url,target:"_blank",rel:"noreferrer",style:{background:D.card,border:"1px solid "+D.bord,borderRadius:10,padding:"12px 14px",textDecoration:"none",display:"flex",alignItems:"center",gap:10}},React.createElement("span",{style:{fontSize:20}},q.icon),React.createElement("div",null,React.createElement("div",{style:{fontFamily:D.body,fontWeight:700,fontSize:13,color:q.c}},q.label),React.createElement("div",{style:{fontFamily:D.mono,fontSize:9,color:D.mut}},"OPEN ↗")))))),
React.createElement("div",{style:{marginBottom:20}},
React.createElement("div",{style:{fontFamily:D.disp,fontSize:16,color:D.golH,letterSpacing:1,marginBottom:10,borderLeft:"3px solid "+D.gold,paddingLeft:10}},"OVERVIEW — "+range),
React.createElement("div",{style:{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}},
[{icon:"💰",label:"Revenue",value:"$"+s.rev.toLocaleString(),color:D.gold},{icon:"📡",label:"Streams",value:s.streams,color:D.volt},{icon:"👁",label:"Peak",value:s.peak.toLocaleString(),color:D.golH},{icon:"👥",label:"Followers",value:"+"+s.followers.toLocaleString(),color:D.suc},{icon:"💵",label:"Tips",value:"$"+s.tips,color:D.burH}].map(c=>React.createElement(Card,{key:c.label,...c})))),
React.createElement("div",{style:{background:D.card,border:"1px solid "+D.bord,borderRadius:12,padding:16,marginBottom:20}},
React.createElement("div",{style:{fontFamily:D.disp,fontSize:16,color:D.golH,letterSpacing:1,marginBottom:12,borderLeft:"3px solid "+D.gold,paddingLeft:10}},"REVENUE TREND"),
React.createElement(Bar,{data:DAILY[range],color:D.gold})),
React.createElement("div",{style:{marginBottom:20}},
React.createElement("div",{style:{fontFamily:D.disp,fontSize:16,color:D.golH,letterSpacing:1,marginBottom:10,borderLeft:"3px solid "+D.gold,paddingLeft:10}},"TOP STREAMS"),
STREAMS.map((s,i)=>React.createElement("div",{key:i,style:{background:D.card,border:"1px solid "+D.bord,borderRadius:10,padding:"12px 14px",marginBottom:8}},
React.createElement("div",{style:{fontFamily:D.body,fontWeight:700,fontSize:14,color:D.crm,marginBottom:6}},s.title),
React.createElement("div",{style:{display:"flex",gap:12,flexWrap:"wrap"}},
[{l:"REVENUE",v:"$"+s.rev,c:D.gold},{l:"PEAK",v:s.peak+" viewers",c:D.golH},{l:"AVG WATCH",v:s.avg,c:D.suc}].map(m=>React.createElement("div",{key:m.l},React.createElement("div",{style:{fontFamily:D.mono,fontSize:9,color:D.mut}},m.l),React.createElement("div",{style:{fontFamily:D.mono,fontSize:13,color:m.c,fontWeight:700}},m.v))))))),
React.createElement("div",{style:{marginBottom:20}},
React.createElement("div",{style:{fontFamily:D.disp,fontSize:16,color:D.golH,letterSpacing:1,marginBottom:10,borderLeft:"3px solid "+D.gold,paddingLeft:10}},"PAYOUT HISTORY"),
React.createElement("div",{style:{background:D.card,border:"1px solid "+D.bord,borderRadius:12,overflow:"hidden"}},
TXN.map((t,i)=>React.createElement("div",{key:i,style:{padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:i<TXN.length-1?"1px solid "+D.bord:"none"}},
React.createElement("div",null,React.createElement("div",{style:{fontFamily:D.body,fontWeight:700,fontSize:13,color:D.crm}},t.method),React.createElement("div",{style:{fontFamily:D.mono,fontSize:10,color:D.mut}},t.date)),
React.createElement("div",{style:{textAlign:"right"}},React.createElement("div",{style:{fontFamily:D.mono,fontSize:15,fontWeight:700,color:D.gold}},"$"+t.amt.toFixed(2)),React.createElement("div",{style:{fontFamily:D.mono,fontSize:9,color:D.suc,textTransform:"uppercase"}},t.status))))),
React.createElement("div",{style:{fontFamily:D.mono,fontSize:11,color:D.mut,textAlign:"center",marginTop:10}},"Creator keeps 90% — 10% platform fee")),
showPayout&&React.createElement("div",{style:{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",justifyContent:"center"},onClick:()=>setShowPayout(false)},
React.createElement("div",{style:{width:"100%",maxWidth:430,background:D.card,borderRadius:"20px 20px 0 0",border:"1px solid "+D.bord,padding:24,paddingBottom:36},onClick:e=>e.stopPropagation()},
React.createElement("div",{style:{fontFamily:D.disp,fontSize:22,color:D.gold,marginBottom:4}},"REQUEST PAYOUT"),
React.createElement("div",{style:{fontFamily:D.mono,fontSize:12,color:D.mut,marginBottom:20}},"Creator keeps 90% — 10% platform fee"),
React.createElement("div",{style:{background:D.obs,borderRadius:10,padding:"14px 16px",marginBottom:16,textAlign:"center"}},
React.createElement("div",{style:{fontFamily:D.disp,fontSize:36,color:D.golH}},"$"+creatorBal),
React.createElement("div",{style:{fontFamily:D.mono,fontSize:11,color:D.mut}},"available to withdraw")),
React.createElement("button",{style:{width:"100%",padding:16,background:"linear-gradient(135deg,"+D.gold+","+D.golH+")",border:"none",borderRadius:12,fontFamily:D.disp,fontSize:20,color:"#000",cursor:"pointer",letterSpacing:1}},"WITHDRAW")))));
}
