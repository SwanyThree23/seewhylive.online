import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import MultiStreamConfig from '../components/live/MultiStreamConfig';
import DestinationsManager from '../components/streaming/DestinationsManager';

const BG     = '#0E0C09';
const BG2    = 'rgba(14,12,9,0.92)';
const GOLD   = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const CYAN   = '#D4854A';
const PURPLE = '#8B44B0';
const GREEN  = '#5A7A4A';
const T      = { fontFamily: 'Barlow Condensed, sans-serif' };

const PLATFORMS = [
  { id:'fanbase',  name:'Fanbase.com',         emoji:'🎭', color:GOLD,      desc:'Social audio & live streaming community. Follower sync, notifications, and content cross-posting.', features:['Follower notifications','Content cross-post','Live room sync','Gift aggregation'] },
  { id:'youtube',  name:'YouTube',              emoji:'▶️', color:'#FF0000', desc:'Stream live and upload VODs directly to your YouTube channel.', features:['Live stream via RTMP','VOD upload','Community posts','Clip sharing'] },
  { id:'twitch',   name:'Twitch',               emoji:'🟣', color:'#9146FF', desc:'Reach gaming and creative audiences with simultaneous Twitch streaming.', features:['Live stream','Clip sharing','Channel points','Raids & hosts'] },
  { id:'tiktok',   name:'TikTok LIVE',          emoji:'🎵', color:CYAN,      desc:'Go live on TikTok and tap into trending sounds and viral discovery.', features:['LIVE streaming','Trending sounds','Duet integration','Gift sync'] },
  { id:'facebook', name:'Facebook / Instagram', emoji:'📘', color:'#1877F2', desc:'Broadcast to Facebook Live and Instagram simultaneously.', features:['Facebook Live','Instagram Live','Story cross-post','Reels upload'] },
  { id:'discord',  name:'Discord',              emoji:'💬', color:'#5865F2', desc:'Send stream notifications and events to your Discord server via webhook.', features:['Go-live notifications','Clip alerts','Community events','Bot commands'] },
];

const WEBHOOK_EVENTS = ['New Follower','New Like','New Comment','Stream Go Live','Gift Received','Milestone 100','Milestone 500','Milestone 1000'];

const MOCK_EVENTS = [
  { emoji:'👤', text:'New follower: Creator_XYZ just followed you on Fanbase', ago:'2m ago', color:GOLD },
  { emoji:'🎁', text:'Gift received: FanUser sent a 💎 Diamond Gift on Fanbase', ago:'15m ago', color:CYAN },
  { emoji:'🎯', text:'Milestone: 100 viewers on your Fanbase stream!', ago:'1h ago', color:GREEN },
];

const OVERLAY_PRESETS = [
  { id:'clean',    label:'Clean',        desc:'No overlay', preview:null },
  { id:'branded',  label:'Branded',      desc:'SeeWhy LIVE watermark + name bar', preview:'branded' },
  { id:'podcast',  label:'Podcast Mode', desc:'Dual speaker with name cards', preview:'podcast' },
  { id:'panel',    label:'Panel Mode',   desc:'4-speaker grid overlay', preview:'panel' },
];

const VIRTUAL_BGS = [
  { id:'dark',    label:'Dark Studio',   color:'#0E0C09' },
  { id:'crimson', label:'Crimson Stage', color:'#800020' },
  { id:'gold',    label:'Gold Club',     color:'#D4AF37' },
  { id:'neon',    label:'Neon Blue',     color:'#001a2e' },
];

function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity:0, y:20, scale:0.95 }}
          animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:20, scale:0.95 }}
          style={{ position:'fixed', bottom:100, left:'50%', transform:'translateX(-50%)', background:'rgba(14,12,9,0.97)', border:`1px solid ${GOLD}55`, borderRadius:12, padding:'12px 22px', color:'#fff', fontSize:14, ...T, fontWeight:700, letterSpacing:'0.04em', boxShadow:`0 8px 32px rgba(0,0,0,0.5)`, zIndex:9999, whiteSpace:'nowrap' }}
        >{message}</motion.div>
      )}
    </AnimatePresence>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ ...T, fontSize:13, fontWeight:800, letterSpacing:'0.05em', padding:'7px 16px', borderRadius:999, border:'none', cursor:'pointer', background:active ? GOLD : 'rgba(255,255,255,0.06)', color:active ? '#000' : 'rgba(255,255,255,0.5)', textTransform:'uppercase', transition:'all 0.18s', flexShrink:0 }}>
      {label}
    </button>
  );
}

function Toggle({ value, onChange, color }) {
  return (
    <button onClick={() => onChange(!value)} style={{ width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', background:value ? (color||GREEN) : 'rgba(255,255,255,0.12)', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <motion.div animate={{ x: value ? 20 : 2 }} transition={{ type:'spring', stiffness:400, damping:30 }} style={{ position:'absolute', top:3, width:18, height:18, borderRadius:9, background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.4)' }} />
    </button>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
      <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1, ease:'easeOut' }} style={{ height:'100%', background:color, borderRadius:3 }} />
    </div>
  );
}

export default function MultiPlatform() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const [tab, setTab] = useState('platforms');
  const [connections, setConnections] = useState(() => {
    try { return JSON.parse(localStorage.getItem('platform_connections') || '{}'); } catch { return {}; }
  });
  const [connecting, setConnecting] = useState(null);
  const [webhooks, setWebhooks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('webhooks') || '[]'); } catch { return []; }
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [outboundUrl, setOutboundUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(['New Follower','Stream Go Live']);
  const [addingWebhook, setAddingWebhook] = useState(false);
  const [newWHUrl, setNewWHUrl] = useState('');
  const [newWHEvents, setNewWHEvents] = useState([]);
  const [testPayload, setTestPayload] = useState(null);
  const [overlayPreset, setOverlayPreset] = useState('clean');
  const [virtualBg, setVirtualBg] = useState('dark');
  const [resolution, setResolution] = useState('1080p');
  const [fps, setFps] = useState('30');
  const [bitrate, setBitrate] = useState('auto');
  const [camActive, setCamActive] = useState(false);
  const [chatAgg, setChatAgg] = useState(false);
  const [crossPost, setCrossPost] = useState(false);
  const [giftAgg, setGiftAgg] = useState(false);
  const [autoShout, setAutoShout] = useState(false);
  const [shoutouts, setShoutouts] = useState(['Welcome Creator_XYZ to SeeWhy LIVE! 🎉','100 viewers milestone — you\'re amazing! 🔥','FanbaseUser just gifted you a 💎 Diamond!']);
  const [toast, setToast] = useState('');
  const [reactions] = useState(['🔥','❤️','🎉','💯','👏']);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  function saveConnections(updated) {
    setConnections(updated);
    localStorage.setItem('platform_connections', JSON.stringify(updated));
  }

  async function handleConnect(id) {
    setConnecting(id);
    await new Promise(r => setTimeout(r, 1200));
    const updated = { ...connections, [id]: !connections[id] };
    saveConnections(updated);
    setConnecting(null);
    showToast(updated[id] ? `✓ ${PLATFORMS.find(p=>p.id===id)?.name} connected!` : 'Platform disconnected');
  }

  function connectedCount() { return Object.values(connections).filter(Boolean).length; }

  function saveWebhooks(list) { setWebhooks(list); localStorage.setItem('webhooks', JSON.stringify(list)); }

  function handleAddWebhook() {
    if (!newWHUrl.trim()) return;
    const wh = { id: Date.now().toString(), url: newWHUrl.trim(), events: newWHEvents, status: 'active' };
    saveWebhooks([...webhooks, wh]);
    setNewWHUrl(''); setNewWHEvents([]); setAddingWebhook(false);
    showToast('Webhook saved!');
  }

  function handleTestWebhook() {
    setTestPayload({ event:'new_follower', platform:'fanbase', user:'FanbaseUser123', timestamp: new Date().toISOString() });
    showToast('Test payload sent!');
  }

  return (
    <div style={{ minHeight:'100vh', background:BG, paddingBottom:80 }}>

      {/* Header */}
      <div style={{ textAlign:'center', padding:'16px 16px 0' }}>
        <a href="/AIHub" style={{ display:'inline-flex', alignItems:'center', gap:4, textDecoration:'none', color:'rgba(255,255,255,0.35)', fontSize:12, fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, letterSpacing:'0.06em', marginBottom:14 }} aria-label="Back to AI Hub">
          ← AI Hub
        </a>
      </div>
      <div style={{ textAlign:'center', padding:'0 16px 16px' }}>
        <h1 style={{ ...T, fontSize:30, fontWeight:900, color:GOLD, letterSpacing:'0.04em', margin:0 }}>🌐 Multi-Platform Hub</h1>
        <p style={{ ...T, fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:6 }}>Connect every platform · Webhooks · Virtual Camera · Audience Engagement</p>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:10, padding:'5px 14px', borderRadius:999, background:`${GREEN}12`, border:`1px solid ${GREEN}30` }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:GREEN, display:'inline-block' }} />
          <span style={{ ...T, fontSize:11, fontWeight:700, color:GREEN }}>{connectedCount()} platform{connectedCount()!==1?'s':''} connected</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:8, padding:'0 16px 16px', overflowX:'auto' }} className="scrollbar-hide">
        {[['platforms','Platforms'],['webhooks','Webhooks'],['camera','Virtual Camera'],['engagement','Engagement']].map(([id,label]) => (
          <TabBtn key={id} label={label} active={tab===id} onClick={() => setTab(id)} />
        ))}
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'0 16px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={{ duration:0.18 }}>

            {/* ── PLATFORMS ── */}
            {tab === 'platforms' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <MultiStreamConfig roomId={null} isHost={true} />
                {user?.id && (
                  <div style={{ background:BG2, borderRadius:16, border:`1px solid ${GOLD}25`, padding:'20px 18px' }}>
                    <DestinationsManager userId={user.id} />
                  </div>
                )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {PLATFORMS.map(p => {
                  const isConn = !!connections[p.id];
                  const isLoading = connecting === p.id;
                  return (
                    <motion.div key={p.id} style={{ background:BG2, borderRadius:16, border:`1px solid ${p.color}25`, borderLeft:`3px solid ${p.color}`, padding:'16px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:22 }}>{p.emoji}</span>
                        {isConn && <span style={{ ...T, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999, background:`${GREEN}22`, border:`1px solid ${GREEN}44`, color:GREEN }}>Connected</span>}
                      </div>
                      <div>
                        <p style={{ ...T, fontSize:14, fontWeight:900, color:'#fff', margin:'0 0 4px' }}>{p.name}</p>
                        <p style={{ ...T, fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.4, margin:0 }}>{p.desc}</p>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                        {p.features.map(f => (
                          <div key={f} style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <span style={{ fontSize:9, color:p.color }}>✓</span>
                            <span style={{ ...T, fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>{f}</span>
                          </div>
                        ))}
                      </div>
                      <motion.button whileTap={{ scale:0.96 }} onClick={() => handleConnect(p.id)} disabled={isLoading} style={{ ...T, padding:'8px 0', borderRadius:10, border:`1px solid ${p.color}50`, background:isConn ? `${p.color}20` : 'transparent', color:isConn ? p.color : 'rgba(255,255,255,0.6)', fontSize:12, fontWeight:900, cursor:'pointer', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                        {isLoading ? '…' : isConn ? 'Disconnect' : 'Connect'}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
              </div>
            )}

            {/* ── WEBHOOKS ── */}
            {tab === 'webhooks' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Fanbase Webhook Config */}
                <div style={{ background:BG2, borderRadius:16, border:`1px solid ${GOLD}25`, borderLeft:`3px solid ${GOLD}`, padding:'20px 18px' }}>
                  <p style={{ ...T, fontSize:18, fontWeight:900, color:GOLD, margin:'0 0 4px' }}>🎭 Fanbase.com Webhooks</p>
                  <p style={{ ...T, fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:16 }}>Configure real-time event notifications from your Fanbase account.</p>

                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div>
                      <p style={{ ...T, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:5 }}>Inbound Webhook URL</p>
                      <div style={{ display:'flex', gap:8 }}>
                        <input readOnly value="https://seewhylive.online/api/webhooks/fanbase" style={{ flex:1, padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.5)', fontSize:12, ...T, outline:'none' }} />
                        <motion.button whileTap={{ scale:0.95 }} onClick={() => { navigator.clipboard?.writeText('https://seewhylive.online/api/webhooks/fanbase'); showToast('URL copied!'); }} style={{ padding:'0 14px', background:`${GOLD}15`, border:`1px solid ${GOLD}40`, borderRadius:10, color:GOLD, fontSize:12, fontWeight:700, cursor:'pointer', ...T }}>Copy</motion.button>
                      </div>
                    </div>
                    <div>
                      <p style={{ ...T, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:5 }}>Outbound URL (forward events to)</p>
                      <input value={outboundUrl} onChange={e => setOutboundUrl(e.target.value)} placeholder="https://your-server.com/webhook" style={{ width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#fff', fontSize:13, ...T, outline:'none', boxSizing:'border-box' }} />
                    </div>

                    <div>
                      <p style={{ ...T, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>Event Triggers</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                        {WEBHOOK_EVENTS.map(ev => {
                          const active = selectedEvents.includes(ev);
                          return (
                            <button key={ev} onClick={() => setSelectedEvents(active ? selectedEvents.filter(e=>e!==ev) : [...selectedEvents, ev])} style={{ ...T, fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:999, border:`1px solid ${active ? GOLD+'66' : 'rgba(255,255,255,0.12)'}`, background:active ? `${GOLD}18` : 'transparent', color:active ? GOLD : 'rgba(255,255,255,0.4)', cursor:'pointer' }}>{ev}</button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:8, marginTop:4 }}>
                      <motion.button whileTap={{ scale:0.96 }} onClick={() => { showToast('Webhook config saved!'); }} style={{ flex:1, padding:'10px 0', background:`linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border:'none', borderRadius:10, color:'#000', fontSize:13, fontWeight:900, cursor:'pointer', ...T, letterSpacing:'0.06em', textTransform:'uppercase' }}>Save Config</motion.button>
                      <motion.button whileTap={{ scale:0.96 }} onClick={handleTestWebhook} style={{ padding:'10px 18px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:700, cursor:'pointer', ...T }}>Test</motion.button>
                    </div>

                    {testPayload && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} style={{ background:'rgba(0,0,0,0.5)', borderRadius:10, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
                        <p style={{ ...T, fontSize:10, color:GREEN, fontWeight:700, letterSpacing:'0.06em', margin:'0 0 6px' }}>PAYLOAD PREVIEW</p>
                        <pre style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.7)', fontFamily:'monospace', lineHeight:1.6, overflowX:'auto' }}>{JSON.stringify(testPayload, null, 2)}</pre>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Live event feed */}
                <div style={{ background:BG2, borderRadius:16, border:'1px solid rgba(255,255,255,0.07)', padding:'18px 16px' }}>
                  <p style={{ ...T, fontSize:15, fontWeight:900, color:'#fff', margin:'0 0 12px' }}>📡 Live Event Feed</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {MOCK_EVENTS.map((ev, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize:18, flexShrink:0 }}>{ev.emoji}</span>
                        <div style={{ flex:1 }}>
                          <p style={{ ...T, fontSize:12, color:'rgba(255,255,255,0.7)', margin:0, lineHeight:1.4 }}>{ev.text}</p>
                          <p style={{ ...T, fontSize:10, color:'rgba(255,255,255,0.3)', margin:'3px 0 0' }}>{ev.ago}</p>
                        </div>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:ev.color, flexShrink:0, marginTop:4 }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Webhook list */}
                <div style={{ background:BG2, borderRadius:16, border:'1px solid rgba(255,255,255,0.07)', padding:'18px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <p style={{ ...T, fontSize:15, fontWeight:900, color:'#fff', margin:0 }}>Saved Webhooks</p>
                    <motion.button whileTap={{ scale:0.95 }} onClick={() => setAddingWebhook(!addingWebhook)} style={{ ...T, padding:'5px 12px', borderRadius:999, border:`1px solid ${CYAN}44`, background:`${CYAN}12`, color:CYAN, fontSize:12, fontWeight:700, cursor:'pointer' }}>+ Add</motion.button>
                  </div>

                  <AnimatePresence>
                    {addingWebhook && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ overflow:'hidden', marginBottom:12 }}>
                        <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:12, padding:'14px', border:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', gap:8 }}>
                          <input value={newWHUrl} onChange={e => setNewWHUrl(e.target.value)} placeholder="https://your-endpoint.com/webhook" style={{ padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, ...T, outline:'none' }} />
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                            {['Go Live','New Follower','Gift Received'].map(ev => {
                              const active = newWHEvents.includes(ev);
                              return <button key={ev} onClick={() => setNewWHEvents(active ? newWHEvents.filter(e=>e!==ev) : [...newWHEvents, ev])} style={{ ...T, fontSize:11, padding:'3px 10px', borderRadius:999, border:`1px solid ${active ? GREEN+'66' : 'rgba(255,255,255,0.12)'}`, background:active ? `${GREEN}18` : 'transparent', color:active ? GREEN : 'rgba(255,255,255,0.4)', cursor:'pointer', fontWeight:700 }}>{ev}</button>;
                            })}
                          </div>
                          <div style={{ display:'flex', gap:8 }}>
                            <motion.button whileTap={{ scale:0.96 }} onClick={handleAddWebhook} style={{ flex:1, padding:'8px 0', background:`${GREEN}20`, border:`1px solid ${GREEN}44`, borderRadius:8, color:GREEN, fontSize:12, fontWeight:900, cursor:'pointer', ...T, textTransform:'uppercase' }}>Save</motion.button>
                            <motion.button whileTap={{ scale:0.96 }} onClick={() => setAddingWebhook(false)} style={{ padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'rgba(255,255,255,0.4)', fontSize:12, fontWeight:700, cursor:'pointer', ...T }}>Cancel</motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {webhooks.length === 0 ? (
                    <p style={{ ...T, fontSize:12, color:'rgba(255,255,255,0.25)', textAlign:'center', padding:'16px 0' }}>No webhooks configured yet</p>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {webhooks.map(wh => (
                        <div key={wh.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ ...T, fontSize:12, color:'rgba(255,255,255,0.7)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{wh.url}</p>
                            <div style={{ display:'flex', gap:4, marginTop:4, flexWrap:'wrap' }}>
                              {wh.events.map(ev => <span key={ev} style={{ ...T, fontSize:10, padding:'1px 7px', borderRadius:999, background:`${CYAN}15`, border:`1px solid ${CYAN}30`, color:CYAN }}>{ev}</span>)}
                            </div>
                          </div>
                          <button onClick={() => { saveWebhooks(webhooks.filter(w=>w.id!==wh.id)); showToast('Webhook deleted'); }} style={{ background:'none', border:'none', color:'rgba(192,57,43,0.6)', cursor:'pointer', fontSize:13, fontWeight:700, ...T }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── VIRTUAL CAMERA ── */}
            {tab === 'camera' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Status */}
                <div style={{ background:BG2, borderRadius:16, border:`1px solid ${camActive ? GREEN : 'rgba(255,255,255,0.08)'}44`, padding:'18px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <motion.div animate={camActive ? { opacity:[1,0.4,1] } : { opacity:1 }} transition={{ duration:1.2, repeat:Infinity }} style={{ width:10, height:10, borderRadius:'50%', background:camActive ? GREEN : 'rgba(255,255,255,0.2)' }} />
                    <div>
                      <p style={{ ...T, fontSize:16, fontWeight:900, color:'#fff', margin:0 }}>SeeWhy LIVE Virtual Camera</p>
                      <p style={{ ...T, fontSize:11, color:camActive ? GREEN : 'rgba(255,255,255,0.35)', margin:0 }}>{camActive ? 'Active — select in OBS / Zoom / Teams' : 'Inactive'}</p>
                    </div>
                  </div>
                  <Toggle value={camActive} onChange={setCamActive} color={GREEN} />
                </div>

                {camActive && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ background:'rgba(0,212,0,0.06)', borderRadius:12, padding:'12px 16px', border:`1px solid ${GREEN}30` }}>
                    <p style={{ ...T, fontSize:12, color:GREEN, margin:0 }}>✓ Virtual camera active. In OBS, Zoom, Teams, Google Meet, or any video app — select <strong>"SeeWhy LIVE Virtual Camera"</strong> as your video source.</p>
                  </motion.div>
                )}

                {/* Overlay presets */}
                <div style={{ background:BG2, borderRadius:16, border:'1px solid rgba(255,255,255,0.07)', padding:'18px 16px' }}>
                  <p style={{ ...T, fontSize:15, fontWeight:900, color:'#fff', margin:'0 0 12px' }}>Overlay Preset</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {OVERLAY_PRESETS.map(op => {
                      const active = overlayPreset === op.id;
                      return (
                        <motion.button key={op.id} whileTap={{ scale:0.96 }} onClick={() => { setOverlayPreset(op.id); showToast(`Overlay: ${op.label}`); }} style={{ padding:'14px 12px', borderRadius:12, border:`2px solid ${active ? GOLD : 'rgba(255,255,255,0.08)'}`, background:active ? `${GOLD}10` : 'rgba(255,255,255,0.03)', cursor:'pointer', textAlign:'left' }}>
                          <p style={{ ...T, fontSize:13, fontWeight:900, color:active ? GOLD : '#fff', margin:'0 0 4px' }}>{op.label}</p>
                          <p style={{ ...T, fontSize:11, color:'rgba(255,255,255,0.4)', margin:0 }}>{op.desc}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Virtual backgrounds */}
                <div style={{ background:BG2, borderRadius:16, border:'1px solid rgba(255,255,255,0.07)', padding:'18px 16px' }}>
                  <p style={{ ...T, fontSize:15, fontWeight:900, color:'#fff', margin:'0 0 12px' }}>Virtual Background</p>
                  <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }} className="scrollbar-hide">
                    {VIRTUAL_BGS.map(bg => (
                      <motion.button key={bg.id} whileTap={{ scale:0.95 }} onClick={() => setVirtualBg(bg.id)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>
                        <div style={{ width:64, height:40, borderRadius:8, background:bg.color, border:`2px solid ${virtualBg===bg.id ? GOLD : 'rgba(255,255,255,0.08)'}` }} />
                        <span style={{ ...T, fontSize:10, color:virtualBg===bg.id ? GOLD : 'rgba(255,255,255,0.4)', fontWeight:700 }}>{bg.label}</span>
                      </motion.button>
                    ))}
                    <motion.button whileTap={{ scale:0.95 }} onClick={() => showToast('Upload feature coming soon!')} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>
                      <div style={{ width:64, height:40, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'2px dashed rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:18 }}>+</span>
                      </div>
                      <span style={{ ...T, fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:700 }}>Custom</span>
                    </motion.button>
                  </div>
                </div>

                {/* Output settings */}
                <div style={{ background:BG2, borderRadius:16, border:'1px solid rgba(255,255,255,0.07)', padding:'18px 16px' }}>
                  <p style={{ ...T, fontSize:15, fontWeight:900, color:'#fff', margin:'0 0 14px' }}>Output Settings</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {[
                      { label:'Resolution', value:resolution, setter:setResolution, options:['720p','1080p','4K'] },
                      { label:'Frame Rate',  value:fps,        setter:setFps,        options:['30','60'] },
                      { label:'Bitrate',     value:bitrate,    setter:setBitrate,    options:['auto','2500kbps','5000kbps','8000kbps'] },
                    ].map(row => (
                      <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ ...T, fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:700 }}>{row.label}</span>
                        <div style={{ display:'flex', gap:6 }}>
                          {row.options.map(opt => (
                            <button key={opt} onClick={() => row.setter(opt)} style={{ ...T, padding:'4px 12px', borderRadius:999, border:`1px solid ${row.value===opt ? GOLD+'55' : 'rgba(255,255,255,0.1)'}`, background:row.value===opt ? `${GOLD}15` : 'transparent', color:row.value===opt ? GOLD : 'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, cursor:'pointer' }}>{opt}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.button whileTap={{ scale:0.97 }} onClick={() => { setCamActive(true); showToast('Virtual camera activated!'); }} style={{ ...T, width:'100%', padding:'14px 0', borderRadius:12, background:`linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border:'none', color:'#000', fontSize:15, fontWeight:900, cursor:'pointer', letterSpacing:'0.07em', textTransform:'uppercase' }}>
                  {camActive ? '✓ Virtual Camera Active' : 'Activate Virtual Camera'}
                </motion.button>
              </div>
            )}

            {/* ── ENGAGEMENT ── */}
            {tab === 'engagement' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

                {/* Chat Aggregator */}
                <div style={{ gridColumn:'1/-1', background:BG2, borderRadius:16, border:`1px solid ${CYAN}25`, borderLeft:`3px solid ${CYAN}`, padding:'16px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <p style={{ ...T, fontSize:15, fontWeight:900, color:'#fff', margin:0 }}>💬 Chat Aggregator</p>
                    <Toggle value={chatAgg} onChange={setChatAgg} color={CYAN} />
                  </div>
                  <p style={{ ...T, fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:chatAgg?12:0 }}>Combine chat from Fanbase, YouTube, Twitch into one panel.</p>
                  <AnimatePresence>
                    {chatAgg && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ overflow:'hidden' }}>
                        {[
                          { platform:'🎭', name:'SwanyFan', text:'This is fire! 🔥', color:GOLD },
                          { platform:'▶️', name:'Viewer123', text:'Just found this, amazing!', color:'#FF0000' },
                          { platform:'🟣', name:'TwitchUser', text:'poggers', color:'#9146FF' },
                        ].map((m,i) => (
                          <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                            <span style={{ fontSize:13 }}>{m.platform}</span>
                            <span style={{ ...T, fontSize:12, color:m.color, fontWeight:700 }}>{m.name}:</span>
                            <span style={{ ...T, fontSize:12, color:'rgba(255,255,255,0.65)' }}>{m.text}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Cross-Post */}
                <div style={{ background:BG2, borderRadius:16, border:'1px solid rgba(255,255,255,0.07)', padding:'16px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <p style={{ ...T, fontSize:14, fontWeight:900, color:'#fff', margin:0 }}>📤 Cross-Post</p>
                    <Toggle value={crossPost} onChange={setCrossPost} color={PURPLE} />
                  </div>
                  <p style={{ ...T, fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:10 }}>Share clips to all platforms simultaneously.</p>
                  <motion.button whileTap={{ scale:0.95 }} onClick={() => showToast('Clip shared to all platforms!')} style={{ ...T, width:'100%', padding:'8px 0', borderRadius:8, background:`${PURPLE}15`, border:`1px solid ${PURPLE}40`, color:PURPLE, fontSize:12, fontWeight:700, cursor:'pointer' }}>Share Last Clip</motion.button>
                </div>

                {/* Audience Pulse */}
                <div style={{ background:BG2, borderRadius:16, border:'1px solid rgba(255,255,255,0.07)', padding:'16px 14px' }}>
                  <p style={{ ...T, fontSize:14, fontWeight:900, color:'#fff', margin:'0 0 8px' }}>🔥 Audience Pulse</p>
                  <p style={{ ...T, fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:10 }}>Live reactions across all platforms.</p>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {reactions.map((r, i) => (
                      <motion.div key={i} animate={{ y:[0,-4,0], scale:[1,1.15,1] }} transition={{ duration:1.5+i*0.3, repeat:Infinity, delay:i*0.4 }} style={{ fontSize:20 }}>{r}</motion.div>
                    ))}
                  </div>
                </div>

                {/* Gift Aggregator */}
                <div style={{ gridColumn:'1/-1', background:BG2, borderRadius:16, border:`1px solid ${GOLD}25`, borderLeft:`3px solid ${GOLD}`, padding:'16px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <p style={{ ...T, fontSize:15, fontWeight:900, color:'#fff', margin:0 }}>🎁 Gift Aggregator</p>
                    <Toggle value={giftAgg} onChange={setGiftAgg} color={GOLD} />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {[
                      { user:'FanbaseUser', gift:'💎 Diamond', price:'$5.00', platform:'🎭 Fanbase' },
                      { user:'TwitchViewer', gift:'⭐ Star', price:'$1.00', platform:'🟣 Twitch' },
                    ].map((g,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize:16 }}>🎁</span>
                        <div style={{ flex:1 }}>
                          <span style={{ ...T, fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:700 }}>{g.user}</span>
                          <span style={{ ...T, fontSize:12, color:'rgba(255,255,255,0.4)' }}> sent {g.gift} on </span>
                          <span style={{ ...T, fontSize:12, color:GOLD }}>{g.platform}</span>
                        </div>
                        <span style={{ ...T, fontSize:12, fontWeight:900, color:GREEN }}>{g.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestone Tracker */}
                <div style={{ gridColumn:'1/-1', background:BG2, borderRadius:16, border:'1px solid rgba(255,255,255,0.07)', padding:'16px 14px' }}>
                  <p style={{ ...T, fontSize:15, fontWeight:900, color:'#fff', margin:'0 0 14px' }}>🎯 Milestone Tracker</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {[
                      { platform:'🎭 Fanbase',          current:247,   goal:500,   color:GOLD },
                      { platform:'▶️ YouTube',           current:1203,  goal:5000,  color:'#FF0000' },
                      { platform:'🟣 Twitch',            current:89,    goal:250,   color:'#9146FF' },
                    ].map(m => (
                      <div key={m.platform}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                          <span style={{ ...T, fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)' }}>{m.platform}</span>
                          <span style={{ ...T, fontSize:12, fontWeight:900, color:m.color }}>{m.current.toLocaleString()} / {m.goal.toLocaleString()}</span>
                        </div>
                        <ProgressBar value={m.current} max={m.goal} color={m.color} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ARIA Auto-Shoutouts */}
                <div style={{ gridColumn:'1/-1', background:BG2, borderRadius:16, border:`1px solid ${PURPLE}25`, borderLeft:`3px solid ${PURPLE}`, padding:'16px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <p style={{ ...T, fontSize:15, fontWeight:900, color:'#fff', margin:0 }}>🤖 ARIA Auto-Shoutouts</p>
                    <Toggle value={autoShout} onChange={setAutoShout} color={PURPLE} />
                  </div>
                  <p style={{ ...T, fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:10 }}>When someone follows on any platform, ARIA generates a welcome automatically.</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {shoutouts.map((s, i) => (
                      <div key={i} style={{ padding:'8px 12px', background:'rgba(167,139,250,0.06)', borderRadius:8, border:'1px solid rgba(167,139,250,0.12)' }}>
                        <span style={{ ...T, fontSize:12, color:PURPLE, fontWeight:700 }}>🎙️ ARIA: </span>
                        <span style={{ ...T, fontSize:12, color:'rgba(255,255,255,0.7)' }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      <Toast message={toast} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 16px 24px' }}>
        {[
          { label: '🔴 Go Live',               href: 'GoLive'                   },
          { label: '🎬 Broadcast Studio',      href: 'BroadcastStudio'          },
          { label: '🌐 Multi-Platform+',       href: 'MultiPlatformIntegration' },
          { label: '📊 Stream Analytics',     href: 'StreamAnalytics'           },
        ].map(item => (
          <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
            <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer' }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
