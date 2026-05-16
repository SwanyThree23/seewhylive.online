import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

const C = { burg:'#800020', gold:'#D4AF37', volt:'#C8FF00', obs:'#0D0D0D', gray:'#666', white:'#F5F0E8' };

export default function ClipCreatorSheet({ roomId, sessionId, creatorId, elapsedSeconds, roomTitle, onClose }) {
  const [title, setTitle] = useState(`${roomTitle||'Stream'} · ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`);
  const [duration, setDuration] = useState(30);
  const [toast, setToast] = useState('');
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey:['currentUser'], queryFn:() => base44.auth.me() });
  const { data: recentClips=[] } = useQuery({
    queryKey: ['room-clips', roomId],
    queryFn: () => base44.entities.StreamClip.filter({ room_id: roomId }, '-created_date', 3),
  });

  const mut = useMutation({
    mutationFn: (secs) => base44.entities.StreamClip.create({
      room_id: roomId,
      stream_session_id: sessionId||roomId,
      creator_id: creatorId||user?.id,
      clipped_by_id: user?.id,
      clipped_by_username: user?.full_name||'Anonymous',
      title,
      start_timestamp_seconds: Math.max(0, (elapsedSeconds||0) - secs),
      end_timestamp_seconds: elapsedSeconds||0,
      duration_seconds: secs,
      view_count: 0,
      share_count: 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['room-clips', roomId] });
      qc.invalidateQueries({ queryKey:['clips'] });
      setToast('Clip saved! 🎬');
      setTimeout(() => { setToast(''); onClose(); }, 1800);
    },
  });

  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:250, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
        onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
        <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:28,stiffness:300}}
          style={{ width:'100%', maxWidth:440, background:'#111', borderRadius:'12px 12px 0 0', border:`1px solid rgba(212,175,55,0.15)`, padding:'20px', paddingBottom:32 }}>
          {/* Handle */}
          <div style={{ width:36, height:4, borderRadius:2, background:'#333', margin:'0 auto 16px' }} />
          {toast ? (
            <div style={{ textAlign:'center', padding:24 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🎬</div>
              <div style={{ fontFamily:'Barlow Condensed', fontSize:18, color:C.volt }}>{toast}</div>
            </div>
          ) : (
            <>
              <div style={{ fontFamily:'Barlow Condensed', fontSize:16, color:C.gold, letterSpacing:2, marginBottom:14 }}>✂️ CREATE CLIP</div>
              {/* Quick buttons */}
              <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:6 }}>CLIP LAST</div>
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                {[30,60,90].map(s => (
                  <button key={s} onClick={()=>setDuration(s)}
                    style={{ flex:1, padding:'10px', borderRadius:7, border:`2px solid ${duration===s?C.gold:'#333'}`, background:duration===s?'rgba(212,175,55,0.1)':'transparent', color:duration===s?C.gold:C.gray, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:15, letterSpacing:1 }}>{s}s</button>
                ))}
              </div>
              <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:4 }}>TITLE</div>
              <input value={title} onChange={e=>setTitle(e.target.value)}
                style={{ width:'100%', padding:'9px 12px', background:'#0d0d0d', border:'1px solid #2a2a2a', borderRadius:6, color:C.white, fontSize:13, outline:'none', boxSizing:'border-box', marginBottom:12 }} />
              <button onClick={()=>mut.mutate(duration)} disabled={mut.isPending||!title}
                style={{ width:'100%', padding:'11px', background:`linear-gradient(90deg, ${C.burg}, ${C.gold})`, border:'none', borderRadius:8, color:'#000', fontFamily:'Barlow Condensed', fontSize:14, fontWeight:700, letterSpacing:1, cursor:'pointer' }}>
                {mut.isPending ? 'SAVING…' : `CREATE ${duration}s CLIP`}
              </button>
              {/* Recent clips strip */}
              {recentClips.length > 0 && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontFamily:'Barlow Condensed', fontSize:10, color:C.gray, letterSpacing:1, marginBottom:6 }}>RECENT CLIPS</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {recentClips.map(c => (
                      <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize:14 }}>✂️</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:'rgba(255,255,255,0.6)' }}>{c.title}</div>
                          <div style={{ fontSize:9, color:C.gray }}>{c.duration_seconds}s · {c.share_count} shares</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}