import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import LocalVideoTile from '../components/live/LocalVideoTile';
import OctagonalVideoWindow from '../components/live/OctagonalVideoWindow';
import WebRTCSetupBanner from '../components/live/WebRTCSetupBanner';
import DevicePreview from '../components/greenroom/DevicePreview';
import GuestStreamMonitor from '../components/streaming/GuestStreamMonitor';
import ZEGOStreamHealthCard from '../components/zego/ZEGOStreamHealthCard';
import MultiGuestPanel from '../components/streaming/MultiGuestPanel';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import StreamGoals from '../components/live/StreamGoals';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';

import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import CreatorBridge from '../components/social/CreatorBridge';

const BG     = '#080B18';
const BG2    = '#0D1022';
const GOLD   = '#D4AF37';
const CRIMSON= '#800020';
const PINK    = '#C0392B';
const GREEN  = '#6DBF7E';
const OCT    = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

const PALETTE = ['#D4AF37','#C0392B','#00C8C8','#A855F7','#22D3EE','#F97316','#84CC16','#C0392B'];
const avatarColor = n => PALETTE[(n?.charCodeAt(0) ?? 0) % PALETTE.length];

const ALL_NAMES = ['SwanyThree','Joyce 🦋','CaliBonesOG','Marvin','Yahawadah','Tom','Durand','Phelo','Simone','Obi','Kenya','Marcus','Tasha','DeeJay','Rakim','Zara','Kwame','Blessed','BigFacts','Nijah'];

const CHAT_POOL = [
  '🔥 Let\'s go!','This is fire 🔥','Good morning everyone!','💯💯💯',
  'Who else watching from NY?','Swany on top!','❤️❤️❤️','That was crazy!',
  'Big facts','We outside 🌍','DROP THE LINK 🔗','I just sent a gift! 🎁',
  'Come on TEAM! 💪','First time watching 🔥','SEEWHYLIVE IS DIFFERENT 🛸',
  'Host said WHAT 😭','Run it back!!','👑👑👑','This chat moving fast 💨',
  'Bro said hold on 😂','Real talk tho fr fr','No cap this slaps',
];

const SCENARIOS = {
  empty:  {
    label: 'Empty Room', emoji: '🕳️', status: 'waiting', viewerCount: 0,
    participants: [],
  },
  solo:   {
    label: 'Solo Host', emoji: '🎙️', status: 'live', viewerCount: 42,
    participants: [
      { id:1, name:'SwanyThree', role:'host',     speaking:true,  muted:false },
    ],
  },
  panel:  {
    label: '4-Person Panel', emoji: '👥', status: 'live', viewerCount: 247,
    participants: [
      { id:1, name:'SwanyThree', role:'host',     speaking:false, muted:false },
      { id:2, name:'Joyce 🦋',   role:'co-host',  speaking:true,  muted:false },
      { id:3, name:'Marvin',     role:'speaker',  speaking:false, muted:false },
      { id:4, name:'Tom',        role:'speaker',  speaking:false, muted:true  },
    ],
  },
  full:   {
    label: 'Full Stage', emoji: '🏟️', status: 'live', viewerCount: 2847,
    participants: ALL_NAMES.slice(0,16).map((name,i) => ({
      id: i+1, name, role: i===0?'host':i===1?'co-host':'speaker',
      speaking:false, muted: i%4===3,
    })),
  },
  battle: {
    label: 'PK Battle', emoji: '⚔️', status: 'battle', viewerCount: 1203,
    scoreA: 4850, scoreB: 3920,
    participants: [
      { id:1, name:'SwanyThree',  role:'host', speaking:true,  muted:false, team:'A' },
      { id:2, name:'CaliBonesOG', role:'host', speaking:false, muted:false, team:'B' },
    ],
  },
  watchparty: {
    label: 'Watch Party', emoji: '📺', status: 'watching', viewerCount: 88,
    participants: [
      { id:1, name:'SwanyThree', role:'host',    speaking:false, muted:false },
      { id:2, name:'Joyce 🦋',  role:'speaker', speaking:false, muted:false },
      { id:3, name:'Marvin',    role:'speaker', speaking:false, muted:true  },
    ],
  },
};

// ── OCT Stage Tile ─────────────────────────────────────────────────────────────
function OctTile({ p, size = 80 }) {
  const isHost   = p.role === 'host';
  const isCohost = p.role === 'co-host';
  const border   = p.speaking ? GOLD : isHost ? `${GOLD}66` : 'rgba(255,255,255,0.12)';
  const color    = avatarColor(p.name);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width:size, height:size }}>
        {p.speaking && (
          <motion.div className="absolute inset-0" style={{ clipPath:OCT, background:GOLD, opacity:0.18 }}
            animate={{ opacity:[0.18,0.44,0.18], scale:[1,1.06,1] }}
            transition={{ duration:1.3, repeat:Infinity }} />
        )}
        <div className="absolute inset-0" style={{ clipPath:OCT, background:border }} />
        <div className="absolute inset-[2.5px] flex items-center justify-center"
          style={{ clipPath:OCT, background:`linear-gradient(145deg,${CRIMSON}99,${BG2})` }}>
          <span className="font-black" style={{ fontSize:size*0.28, color }}>
            {p.name.replace(/\s.*$/,'').charAt(0).toUpperCase()}
          </span>
          {p.speaking && (
            <div className="absolute bottom-[6px] flex items-end gap-[2px]">
              {[3,6,4,7,3].map((h,i) => (
                <motion.div key={i} style={{ width:2, background:GOLD, borderRadius:1, height:h }}
                  animate={{ height:[h, h*2.5, h] }}
                  transition={{ duration:0.38, repeat:Infinity, delay:i*0.07 }} />
              ))}
            </div>
          )}
        </div>
        {p.muted && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[11px]"
            style={{ background:'#EF4444', border:`2px solid ${BG}` }}>🔇</div>
        )}
        {(isHost||isCohost) && (
          <div className="absolute -top-1 left-0 right-0 flex justify-center text-[10px]">👑</div>
        )}
        {p.team && (
          <div className="absolute top-0 left-0 w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-black"
            style={{ background: p.team==='A'?`${GOLD}CC`:`${PINK}CC` }}>
            {p.team}
          </div>
        )}
      </div>
      <p className="text-[10px] font-bold text-white truncate" style={{ maxWidth:size+8 }}>{p.name}</p>
      {(isHost||isCohost) && (
        <p className="text-[11px] font-semibold" style={{ color:`${GOLD}BB`, marginTop:-4 }}>
          {isHost?'Host':'Co-host'}
        </p>
      )}
    </div>
  );
}

// ── Floating reaction ──────────────────────────────────────────────────────────
function FloatingReaction({ emoji, id, onDone }) {
  return (
    <motion.div className="absolute right-4 text-2xl pointer-events-none select-none"
      style={{ bottom: 80 + Math.random()*40 + 'px', zIndex:50 }}
      initial={{ opacity:1, y:0, x: Math.random()*30-15 }}
      animate={{ opacity:0, y:-120, x: Math.random()*60-30 }}
      transition={{ duration:1.6, ease:'easeOut' }}
      onAnimationComplete={onDone}>
      {emoji}
    </motion.div>
  );
}

// ── Viewer POV panel ───────────────────────────────────────────────────────────
function ViewerPanel({ data, chatMessages, reactions, onReact }) {
  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chatMessages]);

  const cols = data.participants.length <= 2 ? 2
    : data.participants.length <= 6 ? 3 : 4;
  const tileSize = cols === 2 ? 90 : cols === 3 ? 72 : 60;

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border"
      style={{ background:BG, borderColor:'rgba(212,175,55,0.15)', fontFamily:'Barlow Condensed,sans-serif' }}>
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ background:BG2, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-sm font-black text-white truncate flex-1">
          {data.label || 'Live Room'}
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider"
          style={ data.status==='live'||data.status==='battle'||data.status==='watching'
            ? { background:`${PINK}20`, border:`1px solid ${PINK}44`, color:PINK }
            : { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.35)' }}>
          {data.status==='live'||data.status==='battle'||data.status==='watching' ? (
            <><motion.span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ background:PINK }}
              animate={{ opacity:[1,0.3,1] }} transition={{ duration:0.9, repeat:Infinity }} />LIVE</>
          ) : 'Waiting'}
        </div>
        <div className="text-[10px] text-white/40">👁 {data.viewerCount.toLocaleString()}</div>
      </div>

      {/* PK battle bar */}
      {data.status === 'battle' && (
        <div className="px-3 py-2 shrink-0" style={{ background:'rgba(0,0,0,0.3)' }}>
          <div className="flex justify-between text-[10px] font-black mb-1">
            <span style={{ color:GOLD }}>{data.participants[0]?.name?.split(' ')[0] ?? 'A'} {data.scoreA?.toLocaleString()}</span>
            <span className="text-white/40">⚔️ PK BATTLE</span>
            <span style={{ color:PINK }}>{data.scoreB?.toLocaleString()} {data.participants[1]?.name?.split(' ')[0] ?? 'B'}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.08)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background:`linear-gradient(90deg,${GOLD},${PINK})` }}
              animate={{ width: `${(data.scoreA/(data.scoreA+data.scoreB))*100}%` }}
              transition={{ duration:0.6 }} />
          </div>
        </div>
      )}

      {/* Stage grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {data.participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-white/20">
            <div className="text-3xl">🎙️</div>
            <div className="text-xs font-semibold">No one on stage yet</div>
          </div>
        ) : (
          <div className="grid gap-3 justify-items-center"
            style={{ gridTemplateColumns:`repeat(${cols},1fr)` }}>
            {data.participants.map(p => <OctTile key={p.id} p={p} size={tileSize} />)}
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="shrink-0" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="h-32 overflow-y-auto px-3 py-2 space-y-1.5">
          <AnimatePresence initial={false}>
            {chatMessages.slice(-20).map(m => (
              <motion.div key={m.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                className="flex items-start gap-1.5">
                <span className="text-[11px] font-black shrink-0 mt-0.5" style={{ color:avatarColor(m.user) }}>
                  {m.user.split(' ')[0]}
                </span>
                <span className="text-[11px] text-white/70 leading-snug">{m.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>
        {/* React buttons */}
        <div className="flex gap-2 px-3 py-2" style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
          {['❤️','🔥','💯','👑','🎁'].map(e => (
            <button key={e} onClick={() => onReact(e)}
              className="text-lg active:scale-125 transition-transform">
              {e}
            </button>
          ))}
          <div className="ml-auto text-[11px] text-white/25 self-center">tap to react</div>
        </div>
      </div>

      {/* Floating reactions */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {reactions.map(r => (
            <FloatingReaction key={r.id} emoji={r.emoji} onDone={() => {}} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Creator POV panel ──────────────────────────────────────────────────────────
function CreatorPanel({ data, chatMessages, onSendChat }) {
  const [msg, setMsg] = useState('');
  const stats = [
    { label:'Viewers', value: data.viewerCount.toLocaleString(), color:GOLD },
    { label:'On Stage', value: data.participants.length, color:'#6DBF7E' },
    { label:'Revenue', value:'$0.00', color:GREEN },
    { label:'Duration', value:'00:12:34', color:PINK },
  ];
  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border"
      style={{ background:BG2, borderColor:`${GOLD}22`, fontFamily:'Barlow Condensed,sans-serif' }}>
      {/* Header */}
      <div className="px-3 py-2 shrink-0 flex items-center justify-between"
        style={{ background:`${CRIMSON}22`, borderBottom:`1px solid ${GOLD}22` }}>
        <span className="text-xs font-black" style={{ color:GOLD }}>🎙️ CREATOR VIEW</span>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background:`${CRIMSON}44`, color:GOLD, border:`1px solid ${GOLD}33` }}>
          HOST
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-px shrink-0" style={{ background:'rgba(255,255,255,0.05)' }}>
        {stats.map(s => (
          <div key={s.label} className="flex flex-col items-center py-2" style={{ background:BG2 }}>
            <span className="text-sm font-black" style={{ color:s.color }}>{s.value}</span>
            <span className="text-[11px] text-white/30 uppercase tracking-wide">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Stage */}
      <div className="flex-1 overflow-y-auto p-3">
        {data.participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-white/20">
            <div className="text-3xl">🕳️</div>
            <div className="text-xs">Stage is empty</div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 justify-items-center">
            {data.participants.map(p => <OctTile key={p.id} p={p} size={56} />)}
          </div>
        )}
      </div>

      {/* Creator chat (host can see all messages) */}
      <div className="shrink-0" style={{ borderTop:`1px solid ${GOLD}18` }}>
        <div className="h-24 overflow-y-auto px-3 py-1.5 space-y-1">
          {chatMessages.slice(-10).map(m => (
            <div key={m.id} className="flex gap-1.5 items-start">
              <span className="text-[11px] font-black shrink-0" style={{ color:avatarColor(m.user) }}>
                {m.user.split(' ')[0]}:
              </span>
              <span className="text-[10px] text-white/60">{m.text}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 px-3 py-2" style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
          <input value={msg} onChange={e=>setMsg(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&msg.trim()){ onSendChat('SwanyThree',msg.trim()); setMsg(''); }}}
            placeholder="Send as host…"
            className="flex-1 h-7 px-2 rounded-lg text-xs text-white outline-none placeholder:text-white/20"
            style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${GOLD}22` }} />
          <button onClick={()=>{ if(msg.trim()){ onSendChat('SwanyThree',msg.trim()); setMsg(''); }}}
            className="h-7 px-3 rounded-lg text-xs font-bold"
            style={{ background:`linear-gradient(135deg,${CRIMSON},#A0003A)`, color:GOLD }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main TestMode page ─────────────────────────────────────────────────────────
export default function TestMode() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room_id');
  const activeRoomId = roomId;
  const [scenarioKey, setScenarioKey] = useState('panel');
  const [scenarioData, setScenarioData] = useState(() => ({
    ...SCENARIOS.panel,
    label: SCENARIOS.panel.label,
    viewerCount: SCENARIOS.panel.viewerCount,
    participants: [...SCENARIOS.panel.participants],
  }));
  const [chatMessages, setChatMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [autoChat, setAutoChat] = useState(false);
  const [autoSpeaker, setAutoSpeaker] = useState(true);
  const [chatSpeed, setChatSpeed] = useState(2500);
  const [viewerDrift, setViewerDrift] = useState(true);
  const chatIdRef = useRef(0);
  const reactionIdRef = useRef(0);

  // Load scenario
  function loadScenario(key) {
    setScenarioKey(key);
    const s = SCENARIOS[key];
    setScenarioData({
      ...s,
      label: s.label,
      participants: s.participants.map(p => ({ ...p })),
    });
    setChatMessages([]);
  }

  // Add chat message
  const addChat = useCallback((user, text) => {
    setChatMessages(prev => [...prev.slice(-49), {
      id: ++chatIdRef.current, user, text,
    }]);
  }, []);

  // Add reaction
  function addReaction(emoji) {
    const id = ++reactionIdRef.current;
    setReactions(prev => [...prev, { id, emoji }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 1800);
  }

  // Auto-chat
  useEffect(() => {
    if (!autoChat) return;
    const t = setInterval(() => {
      const name = ALL_NAMES[Math.floor(Math.random() * ALL_NAMES.length)];
      const text = CHAT_POOL[Math.floor(Math.random() * CHAT_POOL.length)];
      addChat(name, text);
      if (Math.random() < 0.2) addReaction(['❤️','🔥','💯','👑'][Math.floor(Math.random()*4)]);
    }, chatSpeed);
    return () => clearInterval(t);
  }, [autoChat, chatSpeed, addChat]);

  // Auto-rotate speaker
  useEffect(() => {
    if (!autoSpeaker) return;
    const t = setInterval(() => {
      setScenarioData(prev => {
        if (prev.participants.length < 2) return prev;
        const idx = Math.floor(Math.random() * prev.participants.length);
        return {
          ...prev,
          participants: prev.participants.map((p, i) => ({
            ...p, speaking: i === idx && !p.muted,
          })),
        };
      });
    }, 3500);
    return () => clearInterval(t);
  }, [autoSpeaker]);

  // Viewer count drift
  useEffect(() => {
    if (!viewerDrift || scenarioData.status === 'waiting') return;
    const t = setInterval(() => {
      setScenarioData(prev => ({
        ...prev,
        viewerCount: Math.max(0, prev.viewerCount + Math.floor(Math.random() * 7) - 2),
      }));
    }, 4000);
    return () => clearInterval(t);
  }, [viewerDrift, scenarioData.status]);

  // PK score drift
  useEffect(() => {
    if (scenarioData.status !== 'battle') return;
    const t = setInterval(() => {
      setScenarioData(prev => ({
        ...prev,
        scoreA: (prev.scoreA || 0) + Math.floor(Math.random() * 150),
        scoreB: (prev.scoreB || 0) + Math.floor(Math.random() * 120),
      }));
    }, 2000);
    return () => clearInterval(t);
  }, [scenarioData.status]);

  // Add a random participant
  function addParticipant() {
    const existing = scenarioData.participants.map(p => p.name);
    const available = ALL_NAMES.filter(n => !existing.includes(n));
    if (!available.length) return;
    const name = available[Math.floor(Math.random() * available.length)];
    addChat('🔔 System', `${name} joined the stage`);
    setScenarioData(prev => ({
      ...prev,
      participants: [...prev.participants, {
        id: Date.now(), name, role:'speaker', speaking:false, muted:false,
      }],
    }));
  }

  // Remove last participant (not host)
  function removeParticipant() {
    setScenarioData(prev => {
      const nonHosts = prev.participants.filter(p => p.role !== 'host');
      if (!nonHosts.length) return prev;
      const removed = nonHosts[nonHosts.length - 1];
      addChat('🔔 System', `${removed.name} left the stage`);
      return { ...prev, participants: prev.participants.filter(p => p.id !== removed.id) };
    });
  }

  // Trigger a gift event
  function sendGift() {
    const sender = ALL_NAMES[Math.floor(Math.random() * ALL_NAMES.length)];
    const gifts = ['🌹 Rose','🎆 Fireworks','🏆 Trophy','💎 Diamond','🚀 Rocket','🎁 Gift Box'];
    const gift = gifts[Math.floor(Math.random() * gifts.length)];
    addChat(sender, `sent ${gift}!`);
    addReaction('🎁');
    setScenarioData(prev => ({ ...prev, viewerCount: prev.viewerCount + Math.floor(Math.random()*8+2) }));
  }

  // Copy a test URL
  function copyURL(path) {
    navigator.clipboard?.writeText(window.location.origin + path);
  }

  const realPages = [
    { label:'Home Feed',        path:'/',                    emoji:'🏠', desc:'Room discovery' },
    { label:'Live Room',        path:'/LiveRoom',            emoji:'🎙️', desc:'Viewer POV' },
    { label:'Broadcast Studio', path:'/BroadcastStudio',    emoji:'📡', desc:'Creator POV' },
    { label:'PK Battle',        path:'/PKBattle',            emoji:'⚔️', desc:'Battle mode' },
    { label:'Watch Party',      path:'/WatchParty',          emoji:'📺', desc:'Sync viewing' },
    { label:'Discover',         path:'/Discover',            emoji:'🔍', desc:'Browse rooms' },
  ];

  return (
    <div className="min-h-screen" style={{ background:BG, fontFamily:'Barlow Condensed,sans-serif', color:'#fff' }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🧪</span>
          <h1 className="text-2xl font-black" style={{ color:GOLD }}>TestMode</h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
            style={{ background:`${CRIMSON}44`, color:'rgba(255,255,255,0.5)', border:`1px solid ${CRIMSON}66` }}>
            Dev Only
          </span>
        </div>
        <p className="text-sm text-white/40">Simulate users, test interactions, preview all states — no extra accounts needed.</p>
      </div>

      {/* Scenario selector */}
      <div className="px-4 py-3">
        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-semibold">Scenario</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SCENARIOS).map(([key, s]) => (
            <button key={key} onClick={() => loadScenario(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
              style={scenarioKey===key
                ? { background:`linear-gradient(135deg,${CRIMSON},#A0003A)`, color:GOLD, border:`1px solid ${GOLD}44` }
                : { background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.08)' }}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Simulation controls */}
      <div className="px-4 py-2">
        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-semibold">Simulation Controls</div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Toggles */}
          {[
            { label:'Auto Chat', state:autoChat, setState:setAutoChat },
            { label:'Rotate Speaker', state:autoSpeaker, setState:setAutoSpeaker },
            { label:'Viewer Drift', state:viewerDrift, setState:setViewerDrift },
          ].map(({ label, state, setState }) => (
            <button key={label} onClick={() => setState(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={state
                ? { background:`${GOLD}22`, color:GOLD, border:`1px solid ${GOLD}44` }
                : { background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.3)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <span>{state ? '●' : '○'}</span> {label}
            </button>
          ))}

          {/* Chat speed */}
          {autoChat && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30">Speed:</span>
              {[4000,2500,1000,500].map(ms => (
                <button key={ms} onClick={() => setChatSpeed(ms)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold"
                  style={chatSpeed===ms
                    ? { background:`${GOLD}33`, color:GOLD }
                    : { background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.3)' }}>
                  {ms>=1000?`${ms/1000}s`:`${ms}ms`}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 ml-auto flex-wrap">
            {[
              { label:'+ Participant', fn: addParticipant, color:GREEN },
              { label:'- Participant', fn: removeParticipant, color:'#EF4444' },
              { label:'💸 Gift Burst', fn: sendGift, color:GOLD },
              { label:'💬 Chat Burst', fn: () => Array.from({length:5}).forEach((_,i) =>
                setTimeout(() => addChat(ALL_NAMES[Math.floor(Math.random()*ALL_NAMES.length)], CHAT_POOL[Math.floor(Math.random()*CHAT_POOL.length)]), i*200)
              ), color:'#D4854A' },
            ].map(({ label, fn, color }) => (
              <button key={label} onClick={fn}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background:`${color}18`, color, border:`1px solid ${color}33` }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Split preview */}
      <div className="px-4 py-3 grid gap-4" style={{ gridTemplateColumns:'1fr 1fr' }}>
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color:`${GOLD}88` }}>
            👁 VIEWER POV
          </div>
          <div className="relative" style={{ height:520 }}>
            <ViewerPanel data={scenarioData} chatMessages={chatMessages} reactions={reactions} onReact={addReaction} />
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color:`${CRIMSON}CC` }}>
            🎙️ CREATOR POV
          </div>
          <div style={{ height:520 }}>
            <CreatorPanel data={scenarioData} chatMessages={chatMessages} onSendChat={addChat} />
          </div>
        </div>
      </div>

      {/* Live stats bar */}
      <div className="px-4 py-2 mx-4 mb-4 rounded-xl flex gap-6 items-center"
        style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Live Stats</div>
        {[
          { label:'Viewers', value: scenarioData.viewerCount.toLocaleString() },
          { label:'Stage', value: `${scenarioData.participants.length}/20` },
          { label:'Messages', value: chatMessages.length },
          { label:'Reactions', value: reactions.length },
          { label:'Status', value: scenarioData.status.toUpperCase() },
        ].map(s => (
          <div key={s.label} className="flex flex-col">
            <span className="text-sm font-black" style={{ color:GOLD }}>{s.value}</span>
            <span className="text-[11px] text-white/30 uppercase">{s.label}</span>
          </div>
        ))}
        <div className="ml-auto">
          {autoChat && (
            <motion.div className="flex items-center gap-1 text-[11px] font-semibold"
              style={{ color:GREEN }}
              animate={{ opacity:[1,0.5,1] }} transition={{ duration:1, repeat:Infinity }}>
              ● SIMULATING
            </motion.div>
          )}
        </div>
      </div>

      {/* Real page links */}
      <div className="px-4 pb-6">
        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3 font-semibold">Test Real Pages</div>
        <div className="grid grid-cols-3 gap-3">
          {realPages.map(p => (
            <div key={p.path} className="rounded-xl overflow-hidden"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <a href={p.path} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 w-full text-left hover:bg-white/5 transition-colors">
                <span className="text-lg">{p.emoji}</span>
                <div>
                  <div className="text-sm font-bold text-white">{p.label}</div>
                  <div className="text-[11px] text-white/35">{p.desc}</div>
                </div>
              </a>
              <button onClick={() => copyURL(p.path)}
                className="w-full py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors"
                style={{ borderTop:'1px solid rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => e.target.style.color = GOLD}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.25)'}>
                Copy URL
              </button>
            </div>
          ))}
        </div>

        {/* Multi-device test guide */}
        <div className="mt-4 rounded-xl p-4" style={{ background:`${GOLD}08`, border:`1px solid ${GOLD}18` }}>
          <div className="text-sm font-black mb-3" style={{ color:GOLD }}>Multi-Device Test Checklist</div>
          <div className="grid gap-2 text-xs text-white/50">
            {[
              ['Device 1 (you)', 'Open /BroadcastStudio → start room → copy room URL'],
              ['Device 2 / Chrome Profile', 'Open copied room URL → join as viewer → send chat'],
              ['Device 3 / Incognito', 'Open /Home → verify your room appears in the live feed'],
              ['Back on Device 1', 'Verify viewer count incremented + chat messages arrived'],
              ['PK Battle test', 'Two separate accounts → /PKBattle → challenge each other'],
              ['Watch Party test', 'Host creates party → share URL → verify playback syncs'],
            ].map(([label, desc]) => (
              <div key={label} className="flex gap-2">
                <span className="shrink-0 font-bold" style={{ color:`${GOLD}88` }}>→</span>
                <span><span className="font-bold text-white/70">{label}:</span> {desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0 28px' }}>
          {[
            { label: '🎙 Broadcast Studio', href: 'BroadcastStudio' },
            { label: '🔴 Go Live',          href: 'GoLive'          },
            { label: '🎧 Audio Room',       href: 'AudioRoom'       },
            { label: '⚔️ PK Battle',        href: 'PKBattle'        },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>

        <div style={{ padding: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <LocalVideoTile stream={null} label="Test Camera" isHost={true} isMuted={false} />
          <OctagonalVideoWindow stream={null} label="Test Participant" isHost={false} isMuted={true} />
          <WebRTCSetupBanner error={null} audioEnabled={true} videoEnabled={true} onRetry={() => {}} />
          <DevicePreview />
          <GuestStreamMonitor guestName="Test Guest" isStreaming={false} />
          <ZEGOStreamHealthCard roomId={activeRoomId} />
          <MultiGuestPanel participants={[]} spotlightId={null} onSpotlight={() => {}} roomId={activeRoomId} isHost={true} />
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
        <OnlineUsersGrid compact maxVisible={10} />
        <ContentRecommendations />
        <StreamGoals isHost={true} />
        <StreamHealthDashboard roomId={activeRoomId} isHost={true} />
      </div>
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id || null} roomId={activeRoomId} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
    </div>
  );
}
