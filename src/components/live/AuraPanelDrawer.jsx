import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const C = { burg:'#800020', gold:'#D4AF37', volt:'#D4AF37', obs:'#0D0D0D', gray:'#666', white:'#F5F0E8' };

const PERSONAS = [
  { key:'hype', label:'Hype', emoji:'🔥', desc:'High energy, celebrates every moment' },
  { key:'professional', label:'Professional', emoji:'💼', desc:'Formal, informative, brand-safe' },
  { key:'comedian', label:'Comedian', emoji:'😂', desc:'Witty remarks and playful banter' },
  { key:'storyteller', label:'Storyteller', emoji:'📖', desc:'Narrative-driven, weaves context' },
  { key:'analyst', label:'Analyst', emoji:'📊', desc:'Data-focused, real-time insights' },
  { key:'custom', label:'Custom', emoji:'⚙️', desc:'Define your own behavior' },
];
const LANGS = ['EN','ES','PT','FR','HT','TL','DE','JA'];

export default function AuraPanelDrawer({ roomId, hostId, onClose }) {
  const qc = useQueryClient();
  const [askInput, setAskInput] = useState('');
  const [showAsk, setShowAsk] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: aura } = useQuery({
    queryKey: ['aura', roomId],
    queryFn: async () => {
      const list = await base44.entities.AuraAICoHost.filter({ room_id: roomId });
      return list[0] || null;
    },
    refetchInterval: 8000,
  });

  const mut = useMutation({
    mutationFn: (data) => {
      if (aura?.id) return base44.entities.AuraAICoHost.update(aura.id, data);
      return base44.entities.AuraAICoHost.create({ room_id: roomId, host_id: hostId, ...data });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey:['aura', roomId] }),
    onError: () => toast.error('Failed to update settings.'),
  });

  const upd = (data) => mut.mutate(data);

  const toggleLang = (lang) => {
    const langs = aura?.languages_supported || ['EN'];
    const next = langs.includes(lang) ? langs.filter(l=>l!==lang) : [...langs, lang];
    upd({ languages_supported: next });
  };

  const askAura = async () => {
    if (!askInput.trim()) return;
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({ prompt: `You are Aura, a ${aura?.persona_style||'hype'} AI co-host. Answer this host question concisely: "${askInput}"`, model:'claude_sonnet_4_6' });
    setAiResponse(res);
    upd({ last_message: res, last_message_at: new Date().toISOString(), interventions_count: (aura?.interventions_count||0)+1 });
    setLoading(false);
    setAskInput('');
    setShowAsk(false);
  };

  const hypeRoom = async () => {
    const res = await base44.integrations.Core.InvokeLLM({ prompt:`You are Aura, a ${aura?.persona_style||'hype'} live stream AI co-host. Generate ONE short hype line (max 15 words) to energize the room right now!` });
    upd({ last_message: res, last_message_at: new Date().toISOString(), hype_moments:(aura?.hype_moments||0)+1, interventions_count:(aura?.interventions_count||0)+1 });
  };

  const summarize = async () => {
    const res = await base44.integrations.Core.InvokeLLM({ prompt:`You are Aura. Give a 2-sentence summary of what's happening in this live stream room: "${roomId}". Make it exciting and relevant.`, model:'claude_sonnet_4_6' });
    upd({ last_message: res, last_message_at: new Date().toISOString(), interventions_count:(aura?.interventions_count||0)+1 });
  };

  const statusColor = { active:'#6DBF7E', idle:'#666', paused:'#D4AF37', ended:'#C0392B' };
  const st = aura?.status || 'idle';

  return (
    <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:28,stiffness:300}}
      style={{ position:'fixed', top:0, right:0, bottom:0, width:'min(320px, 100vw)', background:'#111', borderLeft:`1px solid rgba(212,175,55,0.15)`, zIndex:200, overflow:'auto', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:`1px solid rgba(212,175,55,0.1)`, background:`linear-gradient(90deg, rgba(128,0,32,0.3), transparent)`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <div style={{ fontFamily:'Barlow Condensed', fontSize:16, color:C.gold, letterSpacing:2 }}>🤖 AURA AI CO-HOST</div>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:statusColor[st], animation:st==='active'?'pulse 1.5s ease-in-out infinite':'none' }} />
            <span style={{ fontFamily:'Barlow Condensed', fontSize:10, color:statusColor[st], letterSpacing:1 }}>{st.toUpperCase()}</span>
            {aura?.persona_style && <span style={{ padding:'1px 6px', background:'rgba(212,175,55,0.1)', borderRadius:4, fontSize:11, color:C.gold, fontFamily:'Barlow Condensed' }}>{aura.persona_style.toUpperCase()}</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ background:'transparent', border:'none', color:C.gray, fontSize:18, cursor:'pointer' }}>✕</button>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'14px 16px' }}>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          {[['Interventions', aura?.interventions_count||0], ['Tokens Used', (aura?.tokens_used||0).toLocaleString()]].map(([l,v]) => (
            <div key={l} style={{ padding:'8px', borderRadius:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1 }}>{l.toUpperCase()}</div>
              <div style={{ fontFamily:'Barlow Condensed', fontSize:18, color:C.gold }}>{v}</div>
            </div>
          ))}
        </div>
        {/* Persona Selector */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:8 }}>PERSONA</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {PERSONAS.map(p => {
              const active = (aura?.persona_style||'hype')===p.key;
              return (
                <button key={p.key} onClick={() => upd({persona_style:p.key})}
                  style={{ padding:'8px', borderRadius:7, border:`1px solid ${active?C.gold:'#2a2a2a'}`, background:active?'rgba(212,175,55,0.08)':'transparent', cursor:'pointer', textAlign:'left' }}>
                  <div style={{ fontSize:16, marginBottom:2 }}>{p.emoji}</div>
                  <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:active?C.gold:C.gray }}>{p.label}</div>
                  <div style={{ fontSize:11, color:'#444', marginTop:1, lineHeight:1.3 }}>{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
        {/* Custom instructions */}
        {aura?.persona_style === 'custom' && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:4 }}>CUSTOM INSTRUCTIONS</div>
            <textarea maxLength={500} value={aura?.custom_instructions||''} onChange={e => upd({custom_instructions:e.target.value})}
              placeholder="Tell Aura how to behave on your channel…" rows={4}
              style={{ width:'100%', padding:'8px', background:'#0d0d0d', border:'1px solid #2a2a2a', borderRadius:6, color:C.white, fontSize:12, resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>
        )}
        {/* Languages */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:6 }}>LANGUAGES</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {LANGS.map(l => {
              const on = (aura?.languages_supported||['EN']).includes(l);
              return <button key={l} onClick={()=>toggleLang(l)} style={{ padding:'3px 10px', borderRadius:20, border:`1px solid ${on?C.gold:'#333'}`, background:on?'rgba(212,175,55,0.1)':'transparent', color:on?C.gold:C.gray, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11 }}>{l}</button>;
            })}
          </div>
        </div>
        {/* Auto behaviors */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:8 }}>AUTO-BEHAVIORS</div>
          {[['auto_hype','Auto Hype','Fires on tips/subs'],['auto_moderate','Auto Moderate','Flags toxicity'],['auto_translate','Auto Translate','Translates non-EN chat']].map(([key,label,desc]) => (
            <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ fontFamily:'Barlow Condensed', fontSize:12, color:C.white }}>{label}</div>
                <div style={{ fontSize:10, color:C.gray }}>{desc}</div>
              </div>
              <button onClick={() => upd({[key]:!aura?.[key]})}
                style={{ width:40, height:22, borderRadius:11, background:aura?.[key]?C.gold:'#333', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
                <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, transition:'left 0.2s', left:aura?.[key]?'20px':'3px' }} />
              </button>
            </div>
          ))}
        </div>
        {/* Last message */}
        {aura?.last_message && (
          <div style={{ marginBottom:14, padding:10, borderRadius:8, background:'rgba(212,175,55,0.06)', border:`1px solid rgba(212,175,55,0.15)`, fontStyle:'italic', fontSize:12, color:C.gold, lineHeight:1.5 }}>
            "{aura.last_message}"
          </div>
        )}
        {/* AI response */}
        {aiResponse && <div style={{ marginBottom:14, padding:10, borderRadius:8, background:'rgba(109,191,126,0.05)', border:'1px solid rgba(109,191,126,0.15)', fontSize:12, color:'#6DBF7E', lineHeight:1.5 }}>{aiResponse}</div>}
        {/* Ask modal */}
        {showAsk && (
          <div style={{ marginBottom:14 }}>
            <input value={askInput} onChange={e=>setAskInput(e.target.value)} placeholder="Ask Aura a question…" onKeyDown={e=>e.key==='Enter'&&askAura()}
              style={{ width:'100%', padding:'8px 10px', background:'#0d0d0d', border:`1px solid ${C.gold}44`, borderRadius:6, color:C.white, fontSize:12, outline:'none', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:6, marginTop:6 }}>
              <button onClick={askAura} disabled={loading} style={{ flex:1, padding:'6px', background:`rgba(212,175,55,0.1)`, border:`1px solid rgba(212,175,55,0.3)`, borderRadius:5, color:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11 }}>{loading?'ASKING…':'ASK AURA'}</button>
              <button onClick={()=>{setShowAsk(false);setAskInput('');}} style={{ padding:'6px 10px', background:'transparent', border:'1px solid #333', borderRadius:5, color:C.gray, cursor:'pointer', fontSize:11 }}>✕</button>
            </div>
          </div>
        )}
        {/* Quick commands */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
          <button onClick={()=>setShowAsk(v=>!v)} style={{ padding:'6px 12px', borderRadius:20, border:`1px solid rgba(212,175,55,0.3)`, background:'rgba(212,175,55,0.06)', color:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>💬 ASK AURA</button>
          <button onClick={hypeRoom} style={{ padding:'6px 12px', borderRadius:20, border:`1px solid rgba(128,0,32,0.4)`, background:'rgba(128,0,32,0.08)', color:'#C0392B', cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>🔥 HYPE ROOM</button>
          <button onClick={summarize} style={{ padding:'6px 12px', borderRadius:20, border:`1px solid rgba(212,175,55,0.3)`, background:'rgba(212,175,55,0.05)', color:C.volt, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>📋 SUMMARIZE</button>
        </div>
      </div>
      {/* Session controls */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:6, flexShrink:0 }}>
        <button onClick={()=>upd({status:'active'})} style={{ flex:1, padding:'8px', background:st==='active'?'rgba(109,191,126,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${st==='active'?'#6DBF7E':'#333'}`, borderRadius:6, color:st==='active'?'#6DBF7E':C.gray, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>▶ START</button>
        <button onClick={()=>upd({status:'paused'})} style={{ flex:1, padding:'8px', background:'rgba(255,255,255,0.03)', border:'1px solid #333', borderRadius:6, color:C.gray, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>⏸ PAUSE</button>
        <button onClick={()=>{upd({status:'ended'});onClose();}} style={{ flex:1, padding:'8px', background:'rgba(128,0,32,0.1)', border:`1px solid rgba(128,0,32,0.3)`, borderRadius:6, color:C.burg, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>■ END</button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </motion.div>
  );
}