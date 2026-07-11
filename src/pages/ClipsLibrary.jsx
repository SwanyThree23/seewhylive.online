import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const C = { burg:'#800020', gold:'#D4AF37', volt:'#D4AF37', obs:'#080B18', gray:'#666', white:'#F5F0E8' };
const STATUSES = { processing:{label:'PROCESSING',color:'#FFB800'}, published:{label:'PUBLISHED',color:'#6DBF7E'}, private:{label:'PRIVATE',color:'#666'} };

const PPV_TIERS = [
  { id: 'preview', label: '👁 Preview', price: 0,    desc: '30-second preview — free',       color: '#6DBF7E' },
  { id: 'rent',    label: '📺 Rent',    price: 0.99, desc: '24-hour access',                 color: '#D4AF37' },
  { id: 'buy',     label: '💎 Buy',     price: 2.99, desc: 'Permanent access + download',    color: '#D4AF37' },
  { id: 'vip',     label: '👑 VIP',     price: 9.99, desc: 'All clips by this creator ever', color: '#FF8C00' },
];

function PPVModal({ clip, onClose, user }) {
  const [tier, setTier] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [done, setDone] = useState(false);

  async function handlePurchase() {
    if (!tier || tier.price === 0) { setDone(true); return; }
    setPurchasing(true);
    try {
      await base44.entities.Transaction.create({
        user_id: user?.id,
        amount: tier.price,
        transaction_type: 'clip_purchase',
        description: `${tier.label} — ${clip.title}`,
        item_id: clip.id,
        status: 'completed',
      });
      setDone(true);
    } catch {
      setPurchasing(false);
    }
  }

  if (done) return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.7)' }}
      onClick={onClose}>
      <div style={{ background:'rgba(13,6,24,0.99)', border:'1px solid rgba(212,175,55,0.3)', borderRadius:20, padding:'32px 28px', textAlign:'center', maxWidth:300 }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
        <p style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:20, color:'#D4AF37', marginBottom:8 }}>
          {tier?.price === 0 ? 'Preview Unlocked!' : 'Purchase Complete!'}
        </p>
        <p style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:20 }}>
          {tier?.desc}
        </p>
        <button onClick={onClose} style={{ background:'#D4AF37', color:'#000', border:'none', borderRadius:10, padding:'10px 28px', fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:14, cursor:'pointer' }}>
          Watch Now ▶
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div style={{ background:'rgba(8,11,24,0.99)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:'20px 20px 0 0', padding:'24px 20px 32px', width:'100%', maxWidth:480 }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <p style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:18, color:'#fff' }}>{clip.title}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>
        <p style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:16, letterSpacing:'0.06em', textTransform:'uppercase' }}>
          Choose access tier
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {PPV_TIERS.map(t => (
            <button key={t.id} onClick={() => setTier(t)}
              style={{
                display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px',
                background: tier?.id===t.id ? `${t.color}18` : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${tier?.id===t.id ? t.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius:12, cursor:'pointer', transition:'all 0.15s',
              }}>
              <div style={{ textAlign:'left' }}>
                <p style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:14, color:tier?.id===t.id ? t.color : '#fff', margin:0 }}>{t.label}</p>
                <p style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:11, color:'rgba(255,255,255,0.4)', margin:'2px 0 0' }}>{t.desc}</p>
              </div>
              <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:16, color: tier?.id===t.id ? t.color : 'rgba(255,255,255,0.5)' }}>
                {t.price === 0 ? 'FREE' : `$${t.price}`}
              </span>
            </button>
          ))}
        </div>
        <button onClick={handlePurchase} disabled={!tier || purchasing}
          style={{
            width:'100%', padding:'14px', borderRadius:12, border:'none',
            background: tier ? '#D4AF37' : 'rgba(255,255,255,0.06)',
            color: tier ? '#000' : 'rgba(255,255,255,0.25)',
            fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:15,
            cursor: tier && !purchasing ? 'pointer' : 'not-allowed',
            letterSpacing:'0.06em',
          }}>
          {purchasing ? 'Processing…' : tier ? (tier.price === 0 ? 'Watch Preview ▶' : `Pay $${tier.price}`) : 'Select a tier'}
        </button>
      </div>
    </div>
  );
}

function ClipCard({ clip, onDelete, onShare, onBuy }) {
  const dur = clip.duration_seconds || (clip.end_timestamp_seconds - clip.start_timestamp_seconds) || 30;
  const status = clip.clip_url ? 'published' : 'processing';
  const S = STATUSES[status];
  const emojis = ['🎮','🎙','🏆','🔥','⚡','🎯'];
  const emoji = emojis[parseInt(clip.id?.slice(-1), 16) % emojis.length] || '🎬';
  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
      style={{ borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)', background:'rgba(13,6,24,0.9)', cursor:'pointer' }}>
      {/* Thumbnail */}
      <div style={{ height:110, background:`linear-gradient(135deg, ${C.burg}33, ${C.obs})`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        <span style={{ fontSize:36 }}>{emoji}</span>
        <div style={{ position:'absolute', bottom:6, right:6, padding:'2px 6px', borderRadius:4, background:'rgba(0,0,0,0.8)', fontFamily:'Barlow Condensed', fontSize:10, color:C.white }}>{Math.floor(dur/60)}:{String(dur%60).padStart(2,'0')}</div>
        <div style={{ position:'absolute', top:6, left:6, padding:'2px 8px', borderRadius:4, background:`${S.color}22`, border:`1px solid ${S.color}44`, fontFamily:'Barlow Condensed', fontSize:11, color:S.color, letterSpacing:1 }}>
          {status==='processing' && <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:S.color,marginRight:4,animation:'pulse 1.2s ease-in-out infinite'}} />}
          {S.label}
        </div>
      </div>
      <div style={{ padding:'10px 12px' }}>
        <div style={{ fontFamily:'Barlow Condensed', fontSize:13, color:C.white, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{clip.title}</div>
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:10, color:C.gray }}>👁 {clip.view_count||0}</span>
          <span style={{ fontSize:10, color:C.gray }}>🔗 {clip.share_count||0} shares</span>
          {clip.share_count > 20 && <span style={{ fontSize:11, color:C.volt, fontFamily:'Barlow Condensed' }}>{clip.share_count} shares</span>}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => onBuy && onBuy(clip)} style={{ flex:1, padding:'5px', background:'rgba(128,0,32,0.12)', border:`1px solid rgba(128,0,32,0.3)`, borderRadius:5, color:'#ff9999', cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>▶ WATCH</button>
          <button onClick={() => onShare(clip)} style={{ flex:1, padding:'5px', background:'rgba(212,175,55,0.08)', border:`1px solid rgba(212,175,55,0.2)`, borderRadius:5, color:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>SHARE</button>
          <button onClick={() => onDelete(clip.id)} style={{ padding:'5px 8px', background:'rgba(128,0,32,0.08)', border:`1px solid rgba(128,0,32,0.2)`, borderRadius:5, color:C.burg, cursor:'pointer', fontSize:11 }}>🗑</button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ClipsLibraryPage() {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [toast, setToast] = useState('');
  const [buyModal, setBuyModal] = useState(null);
  const [buyTier, setBuyTier] = useState(null);
  const [buying, setBuying] = useState(false);
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey:['currentUser'], queryFn:() => base44.auth.me() });
  const { data: clips=[], isLoading } = useQuery({
    queryKey: ['clips', user?.id, filter],
    queryFn: async () => {
      if (filter==='mine') return base44.entities.StreamClip.filter({ clipped_by_id: user.id }, '-created_date', 50);
      return base44.entities.StreamClip.list('-created_date', 50);
    },
    enabled: !!user?.id,
  });
  const { data: highlights=[] } = useQuery({
    queryKey: ['highlights'],
    queryFn: () => base44.entities.StreamHighlight.list('-created_date', 10),
  });

  const deleteMut = useMutation({
    mutationFn: id => base44.entities.StreamClip.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey:['clips'] }),
    onError: () => { toast.error('Failed to delete clip. Please try again.'); },
  });

  const sorted = [...clips].sort((a,b) => {
    if (sort==='views') return (b.view_count||0)-(a.view_count||0);
    if (sort==='shares') return (b.share_count||0)-(a.share_count||0);
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const share = (clip) => {
    navigator.clipboard.writeText(`${window.location.origin}/clips/${clip.id}`);
    setToast('Link copied! 🔗');
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div style={{ minHeight:'100vh', background:C.obs, color:C.white }}>
      {toast && <div style={{ position:'fixed', top:20, right:20, zIndex:999, padding:'10px 18px', background:'rgba(13,6,24,0.97)', border:`1px solid ${C.gold}`, borderRadius:8, fontFamily:'Barlow Condensed', fontSize:13, color:C.gold }}>{toast}</div>}
      <div style={{ padding:'24px 20px', borderBottom:'1px solid rgba(212,175,55,0.12)', background:'rgba(128,0,32,0.06)' }}>
        <h1 style={{ fontFamily:'Barlow Condensed', fontSize:28, color:C.gold, letterSpacing:2 }}>✂️ CLIP LIBRARY</h1>
        <p style={{ color:C.gray, fontSize:12, marginTop:4 }}>{clips.length} clips · Click to view or share</p>
      </div>
      {/* Filters */}
      <div style={{ padding:'12px 20px', display:'flex', gap:8, flexWrap:'wrap', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        {['all','mine','public'].map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${filter===f?C.gold:'#333'}`, background:filter===f?'rgba(212,175,55,0.1)':'transparent', color:filter===f?C.gold:C.gray, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, letterSpacing:1 }}>{f.toUpperCase()}</button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
          {[['newest','Newest'],['views','Most Viewed'],['shares','Most Shared']].map(([v,l]) => (
            <button key={v} onClick={()=>setSort(v)} style={{ padding:'5px 10px', borderRadius:20, border:`1px solid ${sort===v?C.burg:'#333'}`, background:sort===v?'rgba(128,0,32,0.15)':'transparent', color:sort===v?'#ff6666':C.gray, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'20px' }}>
        {isLoading ? (
          <div style={{ textAlign:'center', padding:40, color:C.gray, fontFamily:'Barlow Condensed', fontSize:14 }}>Loading clips…</div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:C.gray }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✂️</div>
            <div style={{ fontFamily:'Barlow Condensed', fontSize:16 }}>No clips yet</div>
            <div style={{ fontSize:12, marginTop:4 }}>Create clips from inside a live room</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
            {sorted.map(clip => <ClipCard key={clip.id} clip={clip} onDelete={id=>deleteMut.mutate(id)} onShare={share} onBuy={(clip) => setBuyModal(clip)} />)}
          </div>
        )}
        {/* Stream Highlights */}
        {highlights.length > 0 && (
          <div style={{ marginTop:32 }}>
            <h2 style={{ fontFamily:'Barlow Condensed', fontSize:18, color:C.gold, marginBottom:12, letterSpacing:2 }}>⚡ AI-DETECTED HIGHLIGHTS</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {highlights.map(h => (
                <div key={h.id} style={{ padding:'12px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', background:'rgba(13,6,24,0.9)', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ padding:'3px 8px', borderRadius:4, background:`rgba(200,255,0,0.08)`, border:`1px solid rgba(200,255,0,0.2)`, fontFamily:'Barlow Condensed', fontSize:11, color:C.volt, letterSpacing:1, flexShrink:0 }}>{(h.highlight_type||'MOMENT').toUpperCase().replace('_',' ')}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Barlow Condensed', fontSize:12, color:C.white }}>{h.description || 'AI-detected moment'}</div>
                    <div style={{ fontSize:10, color:C.gray }}>Confidence: {Math.round((h.ai_confidence||0.8)*100)}%</div>
                  </div>
                  <button style={{ padding:'5px 10px', background:`rgba(128,0,32,0.15)`, border:`1px solid rgba(128,0,32,0.3)`, borderRadius:5, color:C.burg, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, letterSpacing:1, flexShrink:0 }}>CREATE CLIP</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      {buyModal && <PPVModal clip={buyModal} onClose={() => { setBuyModal(null); setBuyTier(null); }} user={user} />}
    </div>
  );
}
