import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import AlertConfig from '../components/live/AlertConfig';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import ShopDashboard from '../components/merch/ShopDashboard';
import CreatorBridge from '../components/social/CreatorBridge';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

var C = { burg:'#800020', gold:'#D4AF37', volt:'#D4AF37', obs:'#080B18', gray:'#666', white:'#F5F0E8' };
var STATUS_COLORS = { draft:C.gray, scheduled:'#D4AF37', sent:'#6DBF7E' };
var TEMPLATES = {
  stream_recap: {
    title: 'Stream Recap — [Date]',
    content: `## 🎬 Last Night's Stream Recap\n\nHey community!\n\nWhat an incredible session we had. Here are the highlights:\n\n**Peak Viewers:** [number]\n**Total Tips:** $[amount]\n**Best Moments:** [describe]\n\n## 💬 Community Highlights\n\n[Highlight top chat moments, funny moments, etc.]\n\n## 📅 Next Stream\n\nJoin us next [day] at [time] for [topic].\n\nSee you live! 🔴`,
  },
  event_announcement: {
    title: '🚨 Special Event — [Event Name]',
    content: `## MARK YOUR CALENDAR 📅\n\nWe're hosting a special event:\n\n**Event:** [Event Name]\n**Date:** [Date & Time]\n**What to expect:** [Description]\n\n## How to Join\n\n1. Follow the channel\n2. Set a reminder\n3. Share with friends!\n\n**Limited spots available.** See you there! 🎉`,
  },
  community_update: {
    title: 'Community Update — [Month]',
    content: `## Community News 🌟\n\nHello amazing community!\n\n### 📊 This Month's Numbers\n- New members: [X]\n- Total streams: [X]\n- Community posts: [X]\n\n### 🏆 Member Spotlight\n\n[Spotlight a community member and their contribution]\n\n### 📢 Announcements\n\n[List important announcements, rule changes, upcoming events]\n\nThanks for being part of this journey! ❤️`,
  },
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function PreviewModal({ newsletter, onClose }) {
  var rendered = escapeHtml(newsletter.content)
    .replace(/## (.*)/g, '<h2 style="color:#D4AF37;font-family:Barlow Condensed;font-size:20px;margin:14px 0 6px">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F5F0E8">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:#aaa">$1</em>')
    .replace(/\n/g, '<br/>');
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
        style={{ background:'#111', borderRadius:12, border:`1px solid rgba(212,175,55,0.2)`, width:'100%', maxWidth:560, maxHeight:'80vh', overflow:'auto' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#111' }}>
          <span style={{ fontFamily:'Barlow Condensed', fontSize:14, color:C.gold }}>NEWSLETTER PREVIEW</span>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:C.gray, cursor:'pointer', fontSize:18 }}>✕</button>
        </div>
        <div style={{ padding:'20px', borderBottom:`4px solid ${C.gold}` }}>
          <div style={{ fontFamily:'Barlow Condensed', fontSize:24, color:C.gold, marginBottom:4 }}>{newsletter.title}</div>
          {newsletter.preview_text && <div style={{ fontSize:12, color:C.gray }}>{newsletter.preview_text}</div>}
        </div>
        <div style={{ padding:'20px', fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.7 }} dangerouslySetInnerHTML={{__html: rendered}} />
        <div style={{ padding:'14px 20px', background:'rgba(212,175,55,0.04)', borderTop:'1px solid rgba(212,175,55,0.1)', fontFamily:'Barlow Condensed', fontSize:10, color:C.gray, textAlign:'center' }}>
          SeeWhy LIVE Newsletter · Unsubscribe
        </div>
      </motion.div>
    </div>
  );
}

export default function NewsletterHubPage() {
  var [tab, setTab] = useState('compose');
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, null);

  var [preview, setPreview] = useState(null);
  var [toast, setToast] = useState('');
  var [scheduleMode, setScheduleMode] = useState(false);
  var [form, setForm] = useState({ title:'', content:'', preview_text:'', scheduled_for:'' });
  var [aiTopic, setAiTopic] = useState('');
  var [aiGenerating, setAiGenerating] = useState(false);
  var qc = useQueryClient();

  var { data: user } = useQuery({ queryKey:['currentUser'], queryFn:() => base44.auth.me() });
  var { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', (user && user.id)],
    queryFn: () => base44.entities.Community.filter({ owner_id: (user && user.id) }).then(r => r[0] || null),
    enabled: !!(user && user.id),
  });
  var userCommunityId = (userCommunity && userCommunity.id) || null;
  var activeChallengeId = null;
  var { data: letters=[], isLoading } = useQuery({
    queryKey: ['newsletters', (user && user.id)],
    queryFn: () => base44.entities.Newsletter.filter({ community_id: user.id }, '-created_date', 50),
    enabled: !!(user && user.id),
  });

  var saveMut = useMutation({
    mutationFn: (data) => base44.entities.Newsletter.create({ community_id: user.id, subscriber_count: 0, ...data }),
    onError: () => showToast.error('Failed to save newsletter.'),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['newsletters'] }); showToast('Saved! ✓'); setForm({title:'',content:'',preview_text:'',scheduled_for:''}); setTab('drafts'); },
  });
  var sendMut = useMutation({
    mutationFn: (data) => base44.entities.Newsletter.create({ community_id: user.id, ...data }),
    onError: () => showToast.error('Failed to send newsletter.'),
    onSuccess: (newsletter) => {
      qc.invalidateQueries({ queryKey:['newsletters'] });
      showToast('Sent! 🚀');
      setForm({title:'',content:'',preview_text:'',scheduled_for:''});
      setTab('sent');
      if ((user && user.id)) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'milestone',
          title: `Sent newsletter: ${(newsletter && newsletter.title) || 'Newsletter'}`,
        }).catch(() => {});
      }
    },
  });
  var deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Newsletter.delete(id),
    onError: () => showToast.error('Failed to delete newsletter.'),
    onSuccess: () => qc.invalidateQueries({ queryKey:['newsletters'] }),
  });

  var showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  var applyTemplate = (key) => { setForm(f => ({...f, ...TEMPLATES[key]})); };

  async function aiDraft() {
    if (!aiTopic.trim() || aiGenerating) return;
    setAiGenerating(true);
    try {
      var res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a newsletter writer for SeeWhy LIVE, a live-streaming platform focused on domino culture, creator economy, and community. Write an engaging newsletter about: "${aiTopic}". Use a broadcast/community voice — energetic but authentic. Include markdown formatting (## for sections, **bold** for emphasis).`,
        response_json_schema: {
          type: 'object',
          properties: {
            title:        { type: 'string' },
            preview_text: { type: 'string' },
            content:      { type: 'string' },
          },
          required: ['title', 'preview_text', 'content'],
        },
      });
      setForm(f => ({ ...f, title: res.title || f.title, preview_text: res.preview_text || f.preview_text, content: res.content || f.content }));
      showToast('AI draft generated ✓');
    } catch {
      showToast('AI draft failed — try again');
    }
    setAiGenerating(false);
  }

  var drafts = letters.filter(l => l.status==='draft');
  var sent = letters.filter(l => l.status==='sent' || l.status==='scheduled');
  var avgOpenRate = sent.length ? (sent.reduce((a,l)=>a+(l.open_rate||0),0)/sent.length).toFixed(1) : 0;
  var best = [...sent].sort((a,b)=>(b.open_rate||0)-(a.open_rate||0))[0];

  var inp = { width:'100%', padding:'9px 12px', background:'#111', border:'1px solid #2a2a2a', borderRadius:6, color:C.white, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:8 };

  return (
    <div style={{ minHeight:'100vh', background:C.obs, color:C.white }}>
      {toast && <div style={{ position:'fixed', top:20, right:20, zIndex:999, padding:'10px 18px', background:'#1a1a1a', border:`1px solid ${C.gold}`, borderRadius:8, fontFamily:'Barlow Condensed', fontSize:13, color:C.gold }}>{toast}</div>}
      {preview && <PreviewModal newsletter={preview} onClose={()=>setPreview(null)} />}

      <div style={{ padding:'24px 20px', borderBottom:'1px solid rgba(212,175,55,0.12)', background:'rgba(128,0,32,0.06)' }}>
        <h1 style={{ fontFamily:'Barlow Condensed', fontSize:28, color:C.gold, letterSpacing:2 }}>📧 NEWSLETTER HUB</h1>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:14, maxWidth:500 }}>
          {[['SUBSCRIBERS', letters.reduce((a,l)=>a+(l.subscriber_count||0),0)||'—'],['AVG OPEN RATE', avgOpenRate+'%'],['BEST',(best && best.title && best.title.slice(0,12))||'—']].map(([l,v])=>(
            <div key={l} style={{ padding:'8px 10px', borderRadius:6, background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.12)' }}>
              <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1 }}>{l}</div>
              <div style={{ fontFamily:'Barlow Condensed', fontSize:15, color:C.gold, marginTop:2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'0 20px' }}>
        {['compose','sent','drafts'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'10px 16px', background:'none', border:'none', borderBottom:`2px solid ${tab===t?C.gold:'transparent'}`, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:12, letterSpacing:1, color:tab===t?C.gold:C.gray }}>{t.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ maxWidth:700, margin:'0 auto', padding:'20px' }}>
        {tab==='compose' && (
          <div>
            {/* AI Draft */}
            <div style={{ marginBottom:16, padding:'14px 16px', borderRadius:10, background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.18)', borderLeft:'3px solid #D4AF37' }}>
              <div style={{ fontFamily:'Barlow Condensed', fontSize:13, color:C.gold, fontWeight:900, letterSpacing:1, marginBottom:8 }}>🤖 AI DRAFT NEWSLETTER</div>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                  placeholder="Topic or theme — e.g. 'WA Classic recap + upcoming July 4 event'"
                  style={{ ...inp, flex:1, marginBottom:0 }}
                  onKeyDown={e => { if (e.key === 'Enter') aiDraft(); }}
                />
                <button
                  onClick={aiDraft}
                  disabled={aiGenerating || !aiTopic.trim()}
                  style={{ padding:'9px 16px', background: aiGenerating ? 'rgba(212,175,55,0.1)' : `linear-gradient(90deg,${C.burg},${C.gold})`, border:'none', borderRadius:6, color: aiGenerating ? C.gray : '#000', cursor: aiGenerating || !aiTopic.trim() ? 'not-allowed' : 'pointer', fontFamily:'Barlow Condensed', fontSize:11, fontWeight:900, letterSpacing:1, whiteSpace:'nowrap', flexShrink:0 }}>
                  {aiGenerating ? '✨ Writing…' : '✨ DRAFT'}
                </button>
              </div>
            </div>

            {/* Templates */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:6 }}>TEMPLATES</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {[['stream_recap','🎬 Stream Recap'],['event_announcement','🚨 Event Announcement'],['community_update','🌟 Community Update']].map(([k,l])=>(
                  <button key={k} onClick={()=>applyTemplate(k)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid rgba(212,175,55,0.25)`, background:'rgba(212,175,55,0.06)', color:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:3 }}>SUBJECT</div>
            <input style={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Your newsletter subject…" maxLength={150} />
            <div style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1, marginBottom:3 }}>PREVIEW TEXT</div>
            <input style={inp} value={form.preview_text} onChange={e=>setForm(f=>({...f,preview_text:e.target.value}))} placeholder="Short preview shown in inbox…" maxLength={200} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <span style={{ fontFamily:'Barlow Condensed', fontSize:11, color:C.gray, letterSpacing:1 }}>CONTENT</span>
              <span style={{ fontSize:10, color:C.gray }}>**bold** *italic* ## header</span>
            </div>
            <textarea style={{...inp, height:280, resize:'vertical', fontFamily:'Share Tech Mono, monospace', fontSize:12}}
              value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} placeholder="Write your newsletter…" maxLength={20000} />
            {/* Schedule toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <button onClick={()=>setScheduleMode(v=>!v)} style={{ width:36, height:20, borderRadius:10, background:scheduleMode?C.gold:'#333', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
                <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff', position:'absolute', top:3, transition:'left 0.2s', left:scheduleMode?'19px':'3px' }} />
              </button>
              <span style={{ fontFamily:'Barlow Condensed', fontSize:11, color:scheduleMode?C.gold:C.gray }}>SCHEDULE</span>
              {scheduleMode && <input type="datetime-local" style={{...inp, marginBottom:0, flex:1, fontSize:11}} value={form.scheduled_for} onChange={e=>setForm(f=>({...f,scheduled_for:e.target.value}))} />}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setPreview({...form})} disabled={!form.title||!form.content}
                style={{ flex:1, padding:'9px', background:'rgba(255,255,255,0.04)', border:'1px solid #333', borderRadius:6, color:C.gray, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, letterSpacing:1 }}>PREVIEW</button>
              <button onClick={()=>saveMut.mutate({...form, status:'draft'})} disabled={!form.title}
                style={{ flex:1, padding:'9px', background:'rgba(212,175,55,0.08)', border:`1px solid rgba(212,175,55,0.25)`, borderRadius:6, color:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, letterSpacing:1 }}>SAVE DRAFT</button>
              <button onClick={()=>sendMut.mutate({...form, status: scheduleMode&&form.scheduled_for?'scheduled':'sent', sent_at:scheduleMode?null:new Date().toISOString()})} disabled={!form.title||!form.content}
                style={{ flex:1, padding:'9px', background:`linear-gradient(90deg, ${C.burg}, ${C.gold})`, border:'none', borderRadius:6, color:'#000', cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, fontWeight:700, letterSpacing:1 }}>{scheduleMode?'SCHEDULE':'SEND 🚀'}</button>
            </div>
          </div>
        )}
        {tab==='sent' && (
          <div>
            {sent.length===0 ? <div style={{textAlign:'center',padding:40,color:C.gray,fontFamily:'Barlow Condensed',fontSize:14}}>No sent newsletters yet</div> :
            sent.map(l => (
              <div key={l.id} style={{ padding:'12px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', background:'#0d0d0d', marginBottom:8, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Barlow Condensed', fontSize:14, color:C.white }}>{l.title}</div>
                  <div style={{ display:'flex', gap:8, marginTop:3 }}>
                    <span style={{ padding:'1px 6px', borderRadius:3, background:`${STATUS_COLORS[l.status]||C.gray}22`, fontFamily:'Barlow Condensed', fontSize:11, color:STATUS_COLORS[l.status]||C.gray, letterSpacing:1 }}>{(l.status||'draft').toUpperCase()}</span>
                    {l.sent_at && <span style={{fontSize:10,color:C.gray}}>{new Date(l.sent_at).toLocaleDateString()}</span>}
                    {l.open_rate>0 && <span style={{fontSize:10,color:C.volt}}>📬 {l.open_rate}% open</span>}
                  </div>
                </div>
                <button onClick={()=>setPreview(l)} style={{ padding:'5px 10px', background:'rgba(212,175,55,0.08)', border:`1px solid rgba(212,175,55,0.2)`, borderRadius:5, color:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>VIEW</button>
              </div>
            ))}
          </div>
        )}
        {tab==='drafts' && (
          <div>
            {drafts.length===0 ? <div style={{textAlign:'center',padding:40,color:C.gray,fontFamily:'Barlow Condensed',fontSize:14}}>No drafts</div> :
            drafts.map(l => (
              <div key={l.id} style={{ padding:'12px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', background:'#0d0d0d', marginBottom:8, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Barlow Condensed', fontSize:14, color:C.white }}>{l.title}</div>
                  <div style={{ fontSize:10, color:C.gray, marginTop:2 }}>{l.created_date ? new Date(l.created_date).toLocaleDateString() : 'Draft'}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>{setForm({title:l.title,content:l.content,preview_text:l.preview_text||'',scheduled_for:''});setTab('compose');}}
                    style={{ padding:'5px 10px', background:'rgba(212,175,55,0.08)', border:`1px solid rgba(212,175,55,0.2)`, borderRadius:5, color:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:10, letterSpacing:1 }}>EDIT</button>
                  <button onClick={()=>deleteMut.mutate(l.id)} style={{ padding:'5px 8px', background:'rgba(128,0,32,0.08)', border:`1px solid rgba(128,0,32,0.2)`, borderRadius:5, color:C.burg, cursor:'pointer', fontSize:11 }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="newsletter" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={null} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
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
