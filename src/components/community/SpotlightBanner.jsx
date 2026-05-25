import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const C = { burg:'#800020', gold:'#D4AF37', volt:'#C8FF00', obs:'#0D0D0D', gray:'#666', white:'#F5F0E8' };
const TYPE_COLORS = { member:C.gold, content:'#00F5FF', achievement:C.volt, stream:'#ff6666' };

function AddSpotlightModal({ communityId, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ spotlight_type:'member', user_id:'', user_name:'', title:'', description:'', end_date:'' });
  const { data: members=[] } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => base44.entities.CommunityMember.filter({ community_id: communityId }, '-created_date', 30),
  });
  const mut = useMutation({
    mutationFn: () => base44.entities.CommunitySpotlight.create({ community_id: communityId, ...form, start_date: new Date().toISOString(), is_active: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['spotlight', communityId] }); onClose(); },
  });
  const inp = { width:'100%', padding:'8px 10px', background:'#111', border:'1px solid #2a2a2a', borderRadius:6, color:C.white, fontSize:12, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:8 };
  const lbl = { display:'block', fontFamily:'Barlow Condensed', fontSize:10, color:C.gray, letterSpacing:1, marginBottom:3, marginTop:8 };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
        style={{ background:'#111', borderRadius:12, border:`1px solid rgba(212,175,55,0.2)`, width:'100%', maxWidth:400, padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <span style={{ fontFamily:'Barlow Condensed', fontSize:16, color:C.gold }}>✨ ADD SPOTLIGHT</span>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:C.gray, cursor:'pointer', fontSize:18 }}>✕</button>
        </div>
        <label style={lbl}>Spotlight Type</label>
        <select style={{...inp,cursor:'pointer'}} value={form.spotlight_type} onChange={e=>setForm(f=>({...f,spotlight_type:e.target.value}))}>
          {['member','content','achievement','stream'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
        <label style={lbl}>Member</label>
        <select style={{...inp,cursor:'pointer'}} value={form.user_id} onChange={e=>{
          const m=members.find(m=>m.user_id===e.target.value);
          setForm(f=>({...f,user_id:e.target.value,user_name:m?.user_name||''}));
        }}>
          <option value="">Select member…</option>
          {members.map(m=><option key={m.user_id} value={m.user_id}>{m.user_name||m.user_id}</option>)}
        </select>
        <label style={lbl}>Title</label>
        <input style={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Member of the Month" maxLength={120} />
        <label style={lbl}>Description</label>
        <textarea style={{...inp,height:70,resize:'none'}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Describe this achievement…" maxLength={500} />
        <label style={lbl}>Featured Until</label>
        <input type="date" style={inp} value={form.end_date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} />
        <button onClick={()=>mut.mutate()} disabled={!form.title||!form.user_id}
          style={{ width:'100%', padding:'10px', marginTop:4, background:`linear-gradient(90deg, ${C.burg}, ${C.gold})`, border:'none', borderRadius:6, color:'#000', fontFamily:'Barlow Condensed', fontSize:13, fontWeight:700, letterSpacing:1, cursor:'pointer' }}>
          CREATE SPOTLIGHT
        </button>
      </motion.div>
    </div>
  );
}

export default function SpotlightBanner({ communityId, isAdmin }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { data: spotlights=[] } = useQuery({
    queryKey: ['spotlight', communityId],
    queryFn: () => base44.entities.CommunitySpotlight.filter({ community_id: communityId }, '-created_date', 20),
  });
  const active = spotlights.find(s => s.is_active);
  const past = spotlights.filter(s => !s.is_active);

  return (
    <div>
      {/* Active spotlight */}
      {active ? (
        <div style={{ position:'relative', overflow:'hidden', borderRadius:10, marginBottom:12 }}>
          {/* Spotlight beam animation */}
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg, ${C.burg}cc, ${C.gold}44)`, zIndex:0 }}>
            <div style={{ position:'absolute', top:'-50%', left:'30%', width:'40%', height:'200%', background:'rgba(212,175,55,0.08)', transform:'rotate(-15deg)', animation:'beam 3s ease-in-out infinite alternate' }} />
          </div>
          <div style={{ position:'relative', zIndex:1, padding:'18px 20px', display:'flex', gap:14, alignItems:'center' }}>
            {/* Avatar */}
            <div style={{ width:52, height:52, borderRadius:'50%', background:C.gold, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Barlow Condensed', fontSize:20, color:'#000', flexShrink:0, border:`2px solid ${C.gold}` }}>
              {active.user_avatar ? <img src={active.user_avatar} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} /> : (active.user_name||'?').slice(0,1).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:3 }}>
                <span style={{ padding:'2px 8px', borderRadius:4, background:`${TYPE_COLORS[active.spotlight_type]||C.gold}22`, border:`1px solid ${TYPE_COLORS[active.spotlight_type]||C.gold}44`, fontFamily:'Barlow Condensed', fontSize:8, color:TYPE_COLORS[active.spotlight_type]||C.gold, letterSpacing:1 }}>{active.spotlight_type.toUpperCase()}</span>
              </div>
              <div style={{ fontFamily:'Barlow Condensed', fontSize:20, color:C.white, letterSpacing:1 }}>{active.title}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 }}>{active.user_name} · {active.description}</div>
            </div>
            <Link to={`/CreatorPublicProfile?id=${active.user_id}`} style={{ textDecoration:'none', flexShrink:0 }}>
              <button style={{ padding:'6px 14px', background:`rgba(212,175,55,0.15)`, border:`1px solid rgba(212,175,55,0.35)`, borderRadius:6, color:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>VIEW PROFILE →</button>
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ padding:'14px', borderRadius:10, border:`1px dashed rgba(212,175,55,0.2)`, background:'rgba(212,175,55,0.03)', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:'Barlow Condensed', fontSize:12, color:C.gray }}>No active spotlight</span>
          {isAdmin && <button onClick={()=>setShowAdd(true)} style={{ padding:'5px 12px', background:`rgba(212,175,55,0.1)`, border:`1px solid rgba(212,175,55,0.3)`, borderRadius:6, color:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>✨ ADD SPOTLIGHT</button>}
        </div>
      )}
      {/* Admin add button */}
      {isAdmin && active && (
        <div style={{ marginBottom:12, display:'flex', gap:6 }}>
          <button onClick={()=>setShowAdd(true)} style={{ padding:'5px 12px', background:`rgba(212,175,55,0.08)`, border:`1px solid rgba(212,175,55,0.2)`, borderRadius:6, color:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>✨ NEW SPOTLIGHT</button>
        </div>
      )}
      {/* History */}
      {past.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <button onClick={()=>setShowHistory(v=>!v)} style={{ background:'transparent', border:'none', cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, padding:0, marginBottom:8 }}>
            {showHistory?'▼':'▶'} PAST SPOTLIGHTS ({past.length})
          </button>
          {showHistory && (
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {past.map(s => (
                <div key={s.id} style={{ padding:'8px 12px', borderRadius:6, border:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)', display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}>{(s.user_name||'?').slice(0,1)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Barlow Condensed', fontSize:12, color:'rgba(255,255,255,0.6)' }}>{s.title}</div>
                    <div style={{ fontSize:10, color:C.gray }}>{s.user_name}</div>
                  </div>
                  <div style={{ fontFamily:'Barlow Condensed', fontSize:9, color:C.gray }}>{s.end_date ? new Date(s.end_date).toLocaleDateString() : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showAdd && <AddSpotlightModal communityId={communityId} onClose={()=>setShowAdd(false)} />}
      <style>{`@keyframes beam{0%{opacity:0.05}100%{opacity:0.15}}`}</style>
    </div>
  );
}