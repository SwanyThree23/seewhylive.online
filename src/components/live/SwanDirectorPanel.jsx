import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

const C = { burg:'#800020', gold:'#D4AF37', volt:'#C8FF00', obs:'#0D0D0D', gray:'#666', white:'#F5F0E8' };
const LAYOUTS = [
  { key:'grid', label:'Grid', emoji:'🔲', desc:'All guests equal' },
  { key:'spotlight', label:'Spotlight', emoji:'👑', desc:'One guest featured' },
  { key:'split', label:'Split', emoji:'⬛', desc:'Two-way split view' },
  { key:'pip', label:'PiP', emoji:'🖼', desc:'Picture-in-picture' },
  { key:'theater', label:'Theater', emoji:'🎭', desc:'Full-width content' },
];
const ACTION_COLORS = { switch_layout:'#00F5FF', spotlight:'#D4AF37', break_silence:'#8B5CF6', default:'#666' };

export function SwanDirectorHUD({ roomId, hostId, onOpenPanel }) {
  const { data: swan } = useQuery({
    queryKey: ['swan', roomId],
    queryFn: async () => {
      const list = await base44.entities.SwanAIDirector.filter({ room_id: roomId });
      return list[0] || { engagement_score:0, current_layout:'grid', next_suggested_action:'Initializing…' };
    },
    refetchInterval: 10000,
  });
  const score = swan?.engagement_score || 0;
  const scoreColor = score < 40 ? '#ff4444' : score < 70 ? '#FFB800' : '#00FF88';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 12px', background:'rgba(0,0,0,0.4)', borderTop:'1px solid rgba(255,255,255,0.06)', overflow:'hidden' }}>
      {/* Layout badge */}
      <div style={{ padding:'2px 8px', borderRadius:4, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.25)', fontFamily:'Barlow Condensed', fontSize:11, color:C.gold, letterSpacing:1, flexShrink:0 }}>
        {LAYOUTS.find(l=>l.key===(swan?.current_layout||'grid'))?.emoji} {(swan?.current_layout||'GRID').toUpperCase()}
      </div>
      {/* Engagement gauge */}
      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
        <span style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray }}>ENG</span>
        <div style={{ width:40, height:4, background:'#222', borderRadius:2, overflow:'hidden' }}>
          <motion.div animate={{ width:`${score}%` }} style={{ height:'100%', background:scoreColor, borderRadius:2 }} />
        </div>
        <span style={{ fontFamily:'Barlow Condensed', fontSize:10, color:scoreColor }}>{score}</span>
      </div>
      {/* Suggestion ticker */}
      {swan?.next_suggested_action && (
        <div style={{ flex:1, overflow:'hidden', fontFamily:'Barlow Condensed', fontSize:11, color:'rgba(255,255,255,0.4)', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
          💡 {swan.next_suggested_action}
        </div>
      )}
      <button onClick={onOpenPanel} style={{ flexShrink:0, padding:'3px 8px', background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:4, color:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, letterSpacing:1 }}>🎬 SWAN</button>
    </div>
  );
}

export default function SwanDirectorPanel({ roomId, hostId, onClose }) {
  const qc = useQueryClient();
  const { data: swan } = useQuery({
    queryKey: ['swan', roomId],
    queryFn: async () => {
      const list = await base44.entities.SwanAIDirector.filter({ room_id: roomId });
      return list[0] || null;
    },
    refetchInterval: 8000,
  });
  const mut = useMutation({
    mutationFn: (data) => {
      if (swan?.id) return base44.entities.SwanAIDirector.update(swan.id, data);
      return base44.entities.SwanAIDirector.create({ room_id: roomId, host_id: hostId, ...data });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey:['swan', roomId] }),
  });
  const upd = (data) => mut.mutate(data);

  const switchLayout = (key) => {
    const log = swan?.decisions_log || [];
    upd({ current_layout: key, camera_cuts: (swan?.camera_cuts||0)+1,
      decisions_log: [...log, { timestamp: new Date().toISOString(), action:'switch_layout', reason:`Host manually switched to ${key}` }]
    });
  };

  const score = swan?.engagement_score || 0;
  const scoreColor = score < 40 ? '#ff4444' : score < 70 ? '#FFB800' : '#00FF88';
  const decisions = (swan?.decisions_log || []).slice().reverse().slice(0,10);
  const engHistory = useMemo(() => Array.from({length:10},(_,i) => Math.floor(Math.random()*60+30)), []);

  return (
    <motion.div initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}} transition={{type:'spring',damping:28,stiffness:300}}
      style={{ position:'fixed', top:0, left:0, bottom:0, width:300, background:'#111', borderRight:`1px solid rgba(212,175,55,0.15)`, zIndex:200, overflow:'auto', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:`1px solid rgba(212,175,55,0.1)`, background:'rgba(0,0,0,0.3)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style={{ fontFamily:'Barlow Condensed', fontSize:16, color:C.gold, letterSpacing:2 }}>🎬 SWAN DIRECTOR</div>
        <button onClick={onClose} style={{ background:'transparent', border:'none', color:C.gray, fontSize:18, cursor:'pointer' }}>✕</button>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'14px 16px' }}>
        {/* Engagement gauge */}
        <div style={{ padding:12, borderRadius:8, border:`1px solid ${scoreColor}33`, background:`${scoreColor}08`, marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1 }}>ENGAGEMENT SCORE</span>
            <span style={{ fontFamily:'Barlow Condensed', fontSize:20, color:scoreColor }}>{score}</span>
          </div>
          <div style={{ height:6, background:'#1a1a1a', borderRadius:3, overflow:'hidden' }}>
            <motion.div animate={{ width:`${score}%` }} style={{ height:'100%', background:`linear-gradient(90deg, ${C.burg}, ${scoreColor})`, borderRadius:3 }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style={{ fontSize:11, color:'#ff4444' }}>0 COLD</span>
            <span style={{ fontSize:11, color:'#FFB800' }}>40</span>
            <span style={{ fontSize:11, color:'#00FF88' }}>70 HOT 100</span>
          </div>
        </div>
        {/* Layout controls */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:8 }}>LAYOUT</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {LAYOUTS.map(l => {
              const active = (swan?.current_layout||'grid')===l.key;
              return (
                <button key={l.key} onClick={()=>switchLayout(l.key)}
                  style={{ padding:'8px', borderRadius:7, border:`1px solid ${active?C.gold:'#2a2a2a'}`, background:active?'rgba(212,175,55,0.08)':'transparent', cursor:'pointer', textAlign:'left' }}>
                  <div style={{ fontSize:18, marginBottom:3 }}>{l.emoji}</div>
                  <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:active?C.gold:C.gray }}>{l.label}</div>
                  <div style={{ fontSize:11, color:'#444' }}>{l.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
        {/* Trigger mode */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:6 }}>TRIGGER MODE</div>
          <div style={{ display:'flex', gap:4 }}>
            {['automatic','suggestions_only','manual'].map(m => {
              const active = (swan?.trigger_mode||'automatic')===m;
              return (
                <button key={m} onClick={()=>upd({trigger_mode:m})}
                  style={{ flex:1, padding:'6px 4px', borderRadius:6, border:`1px solid ${active?C.gold:'#333'}`, background:active?'rgba(212,175,55,0.1)':'transparent', color:active?C.gold:C.gray, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, letterSpacing:0.5 }}>
                  {m==='automatic'?'AUTO':m==='suggestions_only'?'SUGGEST':'MANUAL'}
                </button>
              );
            })}
          </div>
        </div>
        {/* Auto-spotlight */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', marginBottom:14 }}>
          <div>
            <div style={{ fontFamily:'Barlow Condensed', fontSize:12, color:C.white }}>Auto-Spotlight</div>
            <div style={{ fontSize:10, color:C.gray }}>SwanAI detects most active speaker</div>
          </div>
          <button onClick={()=>upd({auto_spotlight:!swan?.auto_spotlight})}
            style={{ width:40, height:22, borderRadius:11, background:swan?.auto_spotlight?C.gold:'#333', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
            <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, transition:'left 0.2s', left:swan?.auto_spotlight?'20px':'3px' }} />
          </button>
        </div>
        {/* Suggestion card */}
        {swan?.next_suggested_action && (
          <div style={{ padding:12, borderRadius:8, border:`1px solid rgba(200,255,0,0.2)`, background:'rgba(200,255,0,0.04)', marginBottom:14 }}>
            <div style={{ fontFamily:'Barlow Condensed', fontSize:10, color:C.volt, letterSpacing:1, marginBottom:4 }}>💡 NEXT SUGGESTION</div>
            <div style={{ fontSize:12, color:C.white, marginBottom:8, lineHeight:1.5 }}>{swan.next_suggested_action}</div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>{ const l=swan.next_suggested_action.toLowerCase(); LAYOUTS.forEach(ly=>{ if(l.includes(ly.key)) switchLayout(ly.key); }); }} style={{ flex:1, padding:'5px', background:'rgba(200,255,0,0.08)', border:'1px solid rgba(200,255,0,0.2)', borderRadius:5, color:C.volt, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10 }}>APPLY</button>
              <button onClick={()=>upd({next_suggested_action:''})} style={{ padding:'5px 8px', background:'transparent', border:'1px solid #333', borderRadius:5, color:C.gray, cursor:'pointer', fontSize:10 }}>DISMISS</button>
            </div>
          </div>
        )}
        {/* Mini bar chart */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:6 }}>ENGAGEMENT TIMELINE</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:40 }}>
            {engHistory.map((v,i) => (
              <div key={i} style={{ flex:1, background:`${C.gold}${Math.round(v*2.55).toString(16).padStart(2,'0')}`, borderRadius:'2px 2px 0 0', height:`${v}%` }} />
            ))}
          </div>
        </div>
        {/* Decision log */}
        {decisions.length > 0 && (
          <div>
            <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:6 }}>DECISION LOG</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {decisions.map((d,i) => {
                const ac = ACTION_COLORS[d.action] || ACTION_COLORS.default;
                return (
                  <div key={i} style={{ padding:'7px 10px', borderRadius:6, border:`1px solid ${ac}22`, background:`${ac}08`, display:'flex', gap:8, alignItems:'flex-start' }}>
                    <div style={{ padding:'1px 6px', borderRadius:3, background:`${ac}22`, fontFamily:'Barlow Condensed', fontSize:11, color:ac, letterSpacing:0.5, flexShrink:0 }}>{(d.action||'action').replace('_',' ').toUpperCase()}</div>
                    <div style={{ fontSize:10, color:C.gray, lineHeight:1.4 }}>{d.reason}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginTop:14 }}>
          {[['✂️ Cuts', swan?.camera_cuts||0],['🤫 Silence', swan?.silence_interventions||0],['📈 Peak', swan?.peak_engagement_timestamp ? new Date(swan.peak_engagement_timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '--:--']].map(([l,v])=>(
            <div key={l} style={{ padding:'8px', borderRadius:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', textAlign:'center' }}>
              <div style={{ fontSize:10, color:C.gray, fontFamily:'Barlow Condensed' }}>{l}</div>
              <div style={{ fontFamily:'Barlow Condensed', fontSize:14, color:C.gold }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}