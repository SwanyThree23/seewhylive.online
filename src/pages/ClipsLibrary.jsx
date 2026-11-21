import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast as showToast } from 'sonner';
import { motion } from 'framer-motion';
import AutomatedClipGenerator from '../components/streaming/AutomatedClipGenerator';
import AutomatedHighlightReels from '../components/streaming/AutomatedHighlightReels';
import ClipGeneratorAI from '../components/streaming/ClipGeneratorAI';
import VODCard from '../components/vod/VODCard';
import VideoShortRecorder from '../components/vod/VideoShortRecorder';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CreatorBridge from '../components/social/CreatorBridge';
import AIHighlightGenerator from '../components/content/AIHighlightGenerator';
import MomentsFeed from '../components/live/MomentsFeed';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
var C = { burg:'#800020', gold:'#D4AF37', volt:'#D4AF37', obs:'#080B18', gray:'#666', white:'#F5F0E8' };
var STATUSES = { processing:{label:'PROCESSING',color:'#D4AF37'}, published:{label:'PUBLISHED',color:'#6DBF7E'}, private:{label:'PRIVATE',color:'#666'} };

function ClipCard({ clip, onDelete, onShare, onLike }) {
  var dur = clip.duration_seconds || (clip.end_timestamp_seconds - clip.start_timestamp_seconds) || 30;
  var status = clip.clip_url ? 'published' : 'processing';
  var S = STATUSES[status];
  var emojis = ['🎮','🎙','🏆','🔥','⚡','🎯'];
  var emoji = emojis[parseInt((clip.id || '').slice(-1), 16) % emojis.length] || '🎬';
  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
      style={{ borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)', background:'rgba(8,11,24,0.9)', cursor:'pointer' }}>
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
          <span style={{ fontSize:10, color:C.gray }}>❤️ {clip.like_count||0}</span>
          <span style={{ fontSize:10, color:C.gray }}>🔗 {clip.share_count||0}</span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => onLike(clip)} style={{ padding:'5px 8px', background:'rgba(192,57,43,0.08)', border:'1px solid rgba(192,57,43,0.2)', borderRadius:5, color:'#E74C3C', cursor:'pointer', fontSize:11 }} title="Like">❤️</button>
          <button onClick={() => onShare(clip)} style={{ flex:1, padding:'5px', background:'rgba(212,175,55,0.08)', border:`1px solid rgba(212,175,55,0.2)`, borderRadius:5, color:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>SHARE</button>
          <button onClick={() => onDelete(clip.id)} style={{ padding:'5px 8px', background:'rgba(128,0,32,0.08)', border:`1px solid rgba(128,0,32,0.2)`, borderRadius:5, color:C.burg, cursor:'pointer', fontSize:11 }}>🗑</button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ClipsLibraryPage() {
  var [tab, setTab] = useState('library');
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);
 // 'library' | 'moments'
  var [filter, setFilter] = useState('all');
  var [sort, setSort] = useState('newest');
  var [toast, setToast] = useState('');
  var [trimVod, setTrimVod] = useState(null);
  var [chapterVod, setChapterVod] = useState(null);
  var qc = useQueryClient();

  var { data: user } = useQuery({ queryKey:['currentUser'], queryFn:() => base44.auth.me() });
  var { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', (user && user.id)],
    queryFn: () => base44.entities.Room.filter({ host_id: (user && user.id), status: 'live' }).then(r => r[0] || null),
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoomId = (activeRoom && activeRoom.id) || null;

  var { data: vods = [] } = useQuery({
    queryKey: ['vod-videos', (user && user.id)],
    queryFn: () => base44.entities.VODVideo.filter({ creator_id: user.id }, '-created_date', 20),
    enabled: !!(user && user.id),
  });
  var { data: clips=[], isLoading } = useQuery({
    queryKey: ['clips', (user && user.id), filter],
    queryFn: async () => {
      if (filter==='mine') return base44.entities.StreamClip.filter({ clipped_by_id: user.id }, '-created_date', 50);
      // Clips a creator removed from their dashboard never show in the public library
      var all = await base44.entities.StreamClip.list('-created_date', 50);
      return all.filter(c => (c.approval_status || 'pending') !== 'removed');
    },
    enabled: !!(user && user.id),
  });
  var { data: highlights=[] } = useQuery({
    queryKey: ['highlights'],
    queryFn: () => base44.entities.StreamHighlight.list('-created_date', 10),
  });
  var { data: followingList=[] } = useQuery({
    queryKey: ['following', (user && user.id)],
    queryFn: () => base44.entities.Follow.filter({ follower_id: user.id }, '-created_date', 200),
    enabled: !!(user && user.id),
    staleTime: 60000,
  });
  var followingIds = followingList.map(f => f.following_id).filter(Boolean);

  var deleteMut = useMutation({
    mutationFn: id => base44.entities.StreamClip.delete(id),
    onError: () => showToast.error('Failed to delete clip.'),
    onSuccess: () => qc.invalidateQueries({ queryKey:['clips'] }),
  });

  var likeMut = useMutation({
    mutationFn: clip => base44.entities.StreamClip.update(clip.id, { like_count: (clip.like_count || 0) + 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey:['clips'] }),
  });

  // Real-time clip updates
  useEffect(() => {
    var unsub = base44.entities.StreamClip.subscribe(() => {
      qc.invalidateQueries({ queryKey: ['clips'] });
      qc.invalidateQueries({ queryKey: ['moments-strip'] });
    });
    return unsub;
  }, [qc]);

  var sorted = [...clips].sort((a,b) => {
    if (sort==='views') return (b.view_count||0)-(a.view_count||0);
    if (sort==='shares') return (b.share_count||0)-(a.share_count||0);
    return new Date(b.created_date) - new Date(a.created_date);
  });

  var share = (clip) => {
    navigator.clipboard.writeText(`${window.location.origin}/ClipsLibrary`).then(() => {
      setToast('Link copied! 🔗');
      setTimeout(() => setToast(''), 2500);
      base44.entities.StreamClip.update(clip.id, { share_count: (clip.share_count || 0) + 1 }).catch(() => {});
    }).catch(() => {});
  };

  return (
    <div style={{ minHeight:'100vh', background:C.obs, color:C.white }}>
      {toast && <div style={{ position:'fixed', top:20, right:20, zIndex:999, padding:'10px 18px', background:'rgba(8,11,24,0.97)', border:`1px solid ${C.gold}`, borderRadius:8, fontFamily:'Barlow Condensed', fontSize:13, color:C.gold }}>{toast}</div>}
      <div style={{ padding:'24px 20px', borderBottom:'1px solid rgba(212,175,55,0.12)', background:'rgba(128,0,32,0.06)' }}>
        <h1 style={{ fontFamily:'Barlow Condensed', fontSize:28, color:C.gold, letterSpacing:2 }}>✂️ CLIP LIBRARY</h1>
        <p style={{ color:C.gray, fontSize:12, marginTop:4 }}>{clips.length} clips · Click to view or share</p>
        {/* Page tabs: Library | Moments */}
        <div style={{ display:'flex', gap:6, marginTop:14 }}>
          {[['library','Library'],['moments','Moments']].map(([key,label]) => (
            <button key={key} onClick={()=>setTab(key)} style={{ padding:'5px 16px', borderRadius:8, border:`1px solid ${tab===key?C.gold:'rgba(255,255,255,0.1)'}`, background:tab===key?'rgba(212,175,55,0.12)':'transparent', color:tab===key?C.gold:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:12, fontWeight:700, letterSpacing:1 }}>{label.toUpperCase()}</button>
          ))}
        </div>
      </div>
      {/* Filters — shown only on library tab */}
      <div style={{ padding:'12px 20px', display:tab==='library'?'flex':'none', gap:8, flexWrap:'wrap', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        {['all','mine','public'].map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${filter===f?C.gold:'#333'}`, background:filter===f?'rgba(212,175,55,0.1)':'transparent', color:filter===f?C.gold:C.gray, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, letterSpacing:1 }}>{f.toUpperCase()}</button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
          {[['newest','Newest'],['views','Most Viewed'],['shares','Most Shared']].map(([v,l]) => (
            <button key={v} onClick={()=>setSort(v)} style={{ padding:'5px 10px', borderRadius:20, border:`1px solid ${sort===v?C.burg:'#333'}`, background:sort===v?'rgba(128,0,32,0.15)':'transparent', color:sort===v?'#D4854A':C.gray, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>{l}</button>
          ))}
        </div>
      </div>
      {/* Moments tab */}
      {tab === 'moments' && (
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px' }}>
          <MomentsFeed currentUserId={(user && user.id)} followingIds={followingIds} />
        </div>
      )}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'20px', display:tab==='library'?'block':'none' }}>
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
            {sorted.map(clip => <ClipCard key={clip.id} clip={clip} onDelete={id=>deleteMut.mutate(id)} onShare={share} onLike={c=>likeMut.mutate(c)} />)}
          </div>
        )}
        {/* Stream Highlights */}
        {highlights.length > 0 && (
          <div style={{ marginTop:32 }}>
            <h2 style={{ fontFamily:'Barlow Condensed', fontSize:18, color:C.gold, marginBottom:12, letterSpacing:2 }}>⚡ AI-DETECTED HIGHLIGHTS</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {highlights.map(h => (
                <div key={h.id} style={{ padding:'12px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', background:'rgba(8,11,24,0.9)', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ padding:'3px 8px', borderRadius:4, background:`rgba(109,191,126,0.08)`, border:`1px solid rgba(109,191,126,0.2)`, fontFamily:'Barlow Condensed', fontSize:11, color:C.volt, letterSpacing:1, flexShrink:0 }}>{(h.highlight_type||'MOMENT').toUpperCase().replace('_',' ')}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Barlow Condensed', fontSize:12, color:C.white }}>{h.description || 'AI-detected moment'}</div>
                    <div style={{ fontSize:10, color:C.gray }}>Confidence: {Math.round((h.ai_confidence||0.8)*100)}%</div>
                  </div>
                  <button
                    onClick={() => {
                      if (!(user && user.id)) return;
                      base44.entities.StreamClip.create({
                        title: h.description || 'AI Highlight Clip',
                        clipped_by_id: user.id,
                        start_timestamp_seconds: h.start_timestamp_seconds || 0,
                        end_timestamp_seconds: h.end_timestamp_seconds || 30,
                        duration_seconds: (h.end_timestamp_seconds || 30) - (h.start_timestamp_seconds || 0),
                        source_room_id: h.room_id,
                        highlight_type: h.highlight_type,
                      }).then((clip) => {
                        qc.invalidateQueries({ queryKey: ['clips'] });
                        setToast('Clip created! ✂️');
                        setTimeout(() => setToast(''), 2500);
                        base44.entities.Activity.create({
                          user_id: user.id,
                          type: 'clip_created',
                          title: `Created clip: ${(clip && clip.title) || 'AI Highlight Clip'}`,
                        }).catch(() => {});
                      }).catch(() => setToast('Failed to create clip'));
                    }}
                    style={{ padding:'5px 10px', background:`rgba(128,0,32,0.15)`, border:`1px solid rgba(128,0,32,0.3)`, borderRadius:5, color:C.burg, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, letterSpacing:1, flexShrink:0 }}>
                    CREATE CLIP
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* AI Clip Generator */}
        <div style={{ marginTop: 32 }}>
          <AutomatedClipGenerator roomId={activeRoomId} />
        </div>
        {/* AI Highlight Reels */}
        <div style={{ marginTop: 16 }}>
          <AutomatedHighlightReels />
        </div>
        {/* AI-powered clip suggestions */}
        {(user && user.id) && (
          <div style={{ marginTop: 16 }}>
            <ClipGeneratorAI sessionId={activeRoomId} roomId={activeRoomId} creatorId={user.id} />
          </div>
        )}

        {/* Episode Clips — Studio Series */}
        <div style={{ marginTop: 24, borderRadius: 14, border: '1px solid rgba(123,45,139,0.25)', background: 'rgba(8,11,24,0.95)', padding: '14px 14px 10px' }}>
          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(176,102,204,0.7)', marginBottom: 10 }}>🎬 Studio Series Clips</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { emoji: '👑', title: 'Shadow Reign', eps: 4, color: '#7B2D8B', page: 'EpisodeSeries' },
              { emoji: '🎵', title: 'AI Music Live', eps: 6, color: '#C9A84C', page: 'AIMusic' },
              { emoji: '🎙', title: 'Street Code Podcast', eps: 3, color: '#00A8E8', page: 'PodcastStudio' },
            ].map(function(s) {
              return (
                <Link key={s.page} to={createPageUrl(s.page)} style={{ textDecoration: 'none' }}>
                  <div style={{ borderRadius: 10, background: s.color + '0f', border: '1px solid ' + s.color + '28', padding: '10px 8px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                    <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{s.title}</p>
                    <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.eps} clips</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
            <div style={{ borderRadius: 10, padding: '8px 12px', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.7)' }}>🎥 Create your own drama series</p>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, color: '#B066CC' }}>Creator Studio →</span>
            </div>
          </Link>
        </div>

        {/* VOD Library */}
        {vods.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontFamily:'Barlow Condensed', fontSize:18, color:C.gold, marginBottom:12, letterSpacing:2 }}>🎬 VOD LIBRARY</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
              {vods.map(v => (
                <VODCard
                  key={v.id}
                  vod={v}
                  onEdit={() => {}}
                  onTrim={() => setTrimVod(v)}
                  onChapters={() => setChapterVod(v)}
                  onPublish={() => qc.invalidateQueries({ queryKey: ['vod-videos'] })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Video Short Recorder */}
        {(user && user.id) && (
          <div style={{ marginTop: 24 }}>
            <VideoShortRecorder roomId={activeRoomId} creatorId={user.id} />
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <SwanAIRecommendations roomId={null} currentLayout="clips" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={null} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <AIHighlightGenerator recording={null} />
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      {/* Creator Studios */}
      <div style={{ margin: '0 0 16px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
        <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
            { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
          ].map(function(s) {
            return (
              <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 2 }}>{s.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
            🎬 Launch Episode Creator Studio →
          </div>
        </Link>
      </div>
      <BackgroundCustomizer />
    </div>
  );
}