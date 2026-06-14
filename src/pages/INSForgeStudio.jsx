import React, { useReducer } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Copy, Edit, Calendar, Check, Clock, Save, Trash2, Send } from 'lucide-react';
import AICopilotSidebar from '../components/live/AICopilotSidebar';
import ContentRecommendations from '../components/social/ContentRecommendations';
import VODLibrary from '../components/vod/VODLibrary';
import ShareToSocial from '../components/social/ShareToSocial';

const CREATOR_SPLIT = 0.90;

const CONTENT_TYPES = [
  { id: 'social_caption', label: 'Social Caption', emoji: '📱' },
  { id: 'stream_title', label: 'Stream Title', emoji: '📺' },
  { id: 'tournament_recap', label: 'Tournament Recap', emoji: '🏆' },
  { id: 'highlight_script', label: 'Highlight Script', emoji: '🎬' },
  { id: 'creator_bio', label: 'Creator Bio', emoji: '👤' },
  { id: 'hype_post', label: 'Hype Post', emoji: '🔥' },
  { id: 'event_announcement', label: 'Event Announcement', emoji: '📣' },
  { id: 'twitter_thread', label: 'Twitter Thread', emoji: '🧵' },
];

const PLATFORMS = ['instagram', 'twitter', 'tiktok', 'youtube', 'facebook', 'all'];
const TONES = [
  { id: 'hype', label: 'HYPE', color: '#C0392B' },
  { id: 'pro', label: 'PRO', color: '#d4af37' },
  { id: 'community', label: 'COMMUNITY', color: '#6DBF7E' },
  { id: 'domino_culture', label: 'DOMINO CULTURE', color: '#C9A84C' },
  { id: 'griot', label: 'GRIOT', color: '#D4854A' },
];

const TEMPLATES = [
  { label: 'WA Classic Go Live', type: 'hype_post', tone: 'hype', platform: 'all', prompt: 'Write a hype post announcing the Washington Classic domino tournament going live on SeeWhy LIVE, hosted by SwanyThree23 at Jamar\'s Sports Bar & Grill, Des Moines WA.' },
  { label: 'PK Battle Callout', type: 'hype_post', tone: 'hype', platform: 'instagram', prompt: 'Write an aggressive but respectful PK Battle callout for a domino creator challenge on SeeWhy LIVE platform.' },
  { label: 'SVS Pride Post', type: 'social_caption', tone: 'community', platform: 'all', prompt: 'Write a State vs State pride post for the Washington Classic domino tournament representing the Pacific Northwest.' },
  { label: 'Gem Thank You', type: 'social_caption', tone: 'community', platform: 'instagram', prompt: 'Write a heartfelt thank you post to the community for gem support during a live domino stream on SeeWhy LIVE.' },
  { label: 'Tournament Recap', type: 'tournament_recap', tone: 'pro', platform: 'youtube', prompt: 'Write a professional tournament recap for the Washington Classic 2026 domino championship.' },
  { label: 'Creator Bio', type: 'creator_bio', tone: 'griot', platform: 'all', prompt: 'Write a compelling creator bio for SwanyThree23 (Ladrue Swanson), founder of SeeWhy LIVE and Cali Bones domino entertainment platform.' },
];

const STATUS_COLORS = { draft: 'rgba(255,255,255,0.4)', scheduled: '#d4af37', posted: '#6DBF7E', failed: '#ef4444' };

const initState = {
  tab: 'generate',
  contentType: 'hype_post',
  platform: 'instagram',
  tone: 'hype',
  prompt: '',
  generating: false,
  generatedContent: '',
  editingGenerated: false,
  copied: false,
  schedulingId: null,
  scheduleTime: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB': return { ...state, tab: action.payload };
    case 'SET_CONTENT_TYPE': return { ...state, contentType: action.payload };
    case 'SET_PLATFORM': return { ...state, platform: action.payload };
    case 'SET_TONE': return { ...state, tone: action.payload };
    case 'SET_PROMPT': return { ...state, prompt: action.payload };
    case 'GENERATING': return { ...state, generating: true, generatedContent: '' };
    case 'GENERATED': return { ...state, generating: false, generatedContent: action.payload };
    case 'SET_GENERATED': return { ...state, generatedContent: action.payload };
    case 'SET_COPIED': return { ...state, copied: true };
    case 'RESET_COPIED': return { ...state, copied: false };
    case 'LOAD_TEMPLATE': return { ...state, contentType: action.payload.type, tone: action.payload.tone, platform: action.payload.platform, prompt: action.payload.prompt };
    case 'SET_SCHEDULING': return { ...state, schedulingId: action.payload };
    case 'SET_SCHEDULE_TIME': return { ...state, scheduleTime: action.payload };
    default: return state;
  }
}

function PillButton({ active, onClick, children, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 99, border: active ? '1px solid ' + (color || '#d4af37') : '1px solid rgba(255,255,255,0.12)',
        background: active ? (color ? color + '20' : 'rgba(212,175,55,0.15)') : 'rgba(255,255,255,0.04)',
        color: active ? (color || '#d4af37') : 'rgba(255,255,255,0.5)',
        fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif',
        whiteSpace: 'nowrap', transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

export default function INSForgeStudio() {
  const [state, dispatch] = useReducer(reducer, initState);
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: library } = useQuery({
    queryKey: ['content-library', user && user.id],
    queryFn: () => base44.entities.ContentLibrary.filter({ creator_id: user && user.id }, '-created_date', 30).catch(() => []),
    enabled: !!(user && user.id),
  });

  const saveContent = useMutation({
    mutationFn: (data) => base44.entities.ContentLibrary.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-library'] }),
  });

  const deleteContent = useMutation({
    mutationFn: (id) => base44.entities.ContentLibrary.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-library'] }),
  });

  const scheduleContent = useMutation({
    mutationFn: ({ id, scheduledFor }) => base44.entities.ContentLibrary.update(id, { scheduled_for: scheduledFor, scheduled_status: 'scheduled' }),
    onSuccess: () => { dispatch({ type: 'SET_SCHEDULING', payload: null }); qc.invalidateQueries({ queryKey: ['content-library'] }); },
  });

  async function generate() {
    if (!state.prompt.trim()) return;
    dispatch({ type: 'GENERATING' });
    var toneLabel = TONES.find(t => t.id === state.tone);
    var ctLabel = CONTENT_TYPES.find(c => c.id === state.contentType);
    var fullPrompt = `You are an AI content creator for SeeWhy LIVE, a domino entertainment streaming platform founded by SwanyThree23 (Ladrue Swanson). The platform centers on the Washington Classic domino tournament and Cali Bones × Domino Entertainment brand.

Content Type: ${ctLabel ? ctLabel.label : state.contentType}
Platform: ${state.platform.toUpperCase()}
Tone: ${toneLabel ? toneLabel.label : state.tone} — ${state.tone === 'hype' ? 'energetic, bold, caps, hype language' : state.tone === 'griot' ? 'storytelling, cultural, soulful, legacy-focused' : state.tone === 'domino_culture' ? 'domino-specific culture, bones lingo, community pride' : state.tone === 'pro' ? 'professional, structured, media-ready' : 'warm, inclusive, community-first'}

User prompt: ${state.prompt}

Write the content now. Make it authentic, platform-native, and ready to post. Include relevant hashtags if appropriate.`;

    var result = await base44.integrations.Core.InvokeLLM({ prompt: fullPrompt, model: 'claude_sonnet_4_6' });
    dispatch({ type: 'GENERATED', payload: typeof result === 'string' ? result : (result && result.content) || 'Content generated. Edit as needed.' });
  }

  async function handleSave() {
    if (!state.generatedContent || !user) return;
    saveContent.mutate({
      creator_id: user.id,
      content_type: state.contentType,
      platform: state.platform,
      tone: state.tone,
      input_prompt: state.prompt,
      output_content: state.generatedContent,
      scheduled_status: 'draft',
    });
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    dispatch({ type: 'SET_COPIED' });
    setTimeout(() => dispatch({ type: 'RESET_COPIED' }), 2000);
  }

  var toneObj = TONES.find(t => t.id === state.tone) || TONES[0];
  var savedItems = library || [];

  return (
    <div style={{ minHeight: '100vh', background: '#07050A', color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.65)', borderBottom: '1px solid rgba(212,175,55,0.15)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3D0010, #C0392B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>INSFORGE AI STUDIO</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Content Engine · Powered by Claude Sonnet</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', padding: '0 16px' }}>
        {['generate', 'templates', 'library', 'scheduler'].map(tab => (
          <button key={tab} onClick={() => dispatch({ type: 'SET_TAB', payload: tab })}
            style={{ padding: '11px 16px', background: 'none', border: 'none', borderBottom: state.tab === tab ? '2px solid #C0392B' : '2px solid transparent', color: state.tab === tab ? '#C0392B' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {tab === 'generate' ? '✨ Generate' : tab === 'templates' ? '📋 Templates' : tab === 'library' ? '📚 Library' : '📅 Scheduler'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px' }}>

        {/* GENERATE TAB */}
        {state.tab === 'generate' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Content Type */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'Barlow Condensed, sans-serif' }}>CONTENT TYPE</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CONTENT_TYPES.map(ct => (
                    <PillButton key={ct.id} active={state.contentType === ct.id} onClick={() => dispatch({ type: 'SET_CONTENT_TYPE', payload: ct.id })}>
                      {ct.emoji} {ct.label}
                    </PillButton>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'Barlow Condensed, sans-serif' }}>PLATFORM</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PLATFORMS.map(p => (
                    <PillButton key={p} active={state.platform === p} onClick={() => dispatch({ type: 'SET_PLATFORM', payload: p })}>
                      {p.toUpperCase()}
                    </PillButton>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'Barlow Condensed, sans-serif' }}>TONE MODE</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TONES.map(tone => (
                    <PillButton key={tone.id} active={state.tone === tone.id} onClick={() => dispatch({ type: 'SET_TONE', payload: tone.id })} color={tone.color}>
                      {tone.label}
                    </PillButton>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'Barlow Condensed, sans-serif' }}>YOUR BRIEF</div>
                <textarea
                  value={state.prompt}
                  onChange={e => dispatch({ type: 'SET_PROMPT', payload: e.target.value })}
                  placeholder="Describe what you need... e.g. 'Announce Washington Classic going live tonight, hype the crowd up'"
                  rows={4}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Rajdhani, sans-serif' }}
                />
                <button
                  onClick={generate}
                  disabled={state.generating || !state.prompt.trim()}
                  style={{ marginTop: 10, width: '100%', padding: '12px', background: state.generating || !state.prompt.trim() ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #3D0010, #C0392B)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 900, fontSize: 15, cursor: state.generating || !state.prompt.trim() ? 'not-allowed' : 'pointer', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: state.generating || !state.prompt.trim() ? 0.5 : 1 }}
                >
                  <Sparkles size={16} /> {state.generating ? 'Generating...' : 'GENERATE CONTENT'}
                </button>
              </div>
            </div>

            {/* Output */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 12, padding: 14, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 300 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(192,57,43,0.8)', letterSpacing: '0.12em', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    GENERATED CONTENT · {toneObj.label} · {state.platform.toUpperCase()}
                  </div>
                  {state.generatedContent && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleCopy(state.generatedContent)} style={{ padding: '4px 10px', background: state.copied ? 'rgba(109,191,126,0.15)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: state.copied ? '#6DBF7E' : 'rgba(255,255,255,0.6)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                        {state.copied ? <Check size={12} /> : <Copy size={12} />} {state.copied ? 'COPIED' : 'COPY'}
                      </button>
                      <button onClick={handleSave} style={{ padding: '4px 10px', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 6, color: '#d4af37', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                        <Save size={12} /> SAVE
                      </button>
                    </div>
                  )}
                </div>
                {state.generating ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                    <div style={{ width: 28, height: 28, border: '3px solid rgba(192,57,43,0.2)', borderTopColor: '#C0392B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Claude Sonnet is writing...</span>
                  </div>
                ) : state.generatedContent ? (
                  <textarea
                    value={state.generatedContent}
                    onChange={e => dispatch({ type: 'SET_GENERATED', payload: e.target.value })}
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 14, resize: 'none', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1.6, minHeight: 240 }}
                  />
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 14, fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Generated content will appear here
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TEMPLATES TAB */}
        {state.tab === 'templates' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {TEMPLATES.map((tpl, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 6 }}>{tpl.label}</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 99, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{tpl.platform.toUpperCase()}</span>
                  <span style={{ fontSize: 10, background: 'rgba(192,57,43,0.15)', padding: '2px 8px', borderRadius: 99, color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif' }}>{tpl.tone.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 12 }}>{tpl.prompt.slice(0, 80)}...</div>
                <button
                  onClick={() => { dispatch({ type: 'LOAD_TEMPLATE', payload: tpl }); dispatch({ type: 'SET_TAB', payload: 'generate' }); }}
                  style={{ width: '100%', padding: '8px', background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 8, color: '#C0392B', fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  Use Template →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* LIBRARY TAB */}
        {state.tab === 'library' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {savedItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15 }}>
                No saved content yet. Generate and save content to build your library.
              </div>
            ) : savedItems.map(item => {
              var st = item.scheduled_status || 'draft';
              return (
                <div key={item.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 99, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{(item.content_type || '').replace('_', ' ').toUpperCase()}</span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, color: STATUS_COLORS[st] || '#fff', border: '1px solid ' + (STATUS_COLORS[st] || 'rgba(255,255,255,0.2)'), fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900 }}>{st.toUpperCase()}</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>{item.platform && item.platform.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{(item.output_content || '').slice(0, 120)}{(item.output_content || '').length > 120 ? '...' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => handleCopy(item.output_content || '')} style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                        <Copy size={11} /> COPY
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'SET_SCHEDULING', payload: state.schedulingId === item.id ? null : item.id })}
                        style={{ padding: '5px 10px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 6, color: '#d4af37', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                        <Calendar size={11} /> SCHEDULE
                      </button>
                      <button onClick={() => deleteContent.mutate(item.id)} style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#ef4444', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                        <Trash2 size={11} /> DELETE
                      </button>
                    </div>
                  </div>
                  {state.schedulingId === item.id && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="datetime-local"
                        value={state.scheduleTime}
                        onChange={e => dispatch({ type: 'SET_SCHEDULE_TIME', payload: e.target.value })}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, outline: 'none' }}
                      />
                      <button
                        onClick={() => state.scheduleTime && scheduleContent.mutate({ id: item.id, scheduledFor: state.scheduleTime })}
                        style={{ padding: '6px 14px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 8, color: '#d4af37', fontWeight: 900, fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
                      >
                        Confirm
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SCHEDULER TAB */}
        {state.tab === 'scheduler' && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 14 }}>SCHEDULED POSTS</div>
            {savedItems.filter(i => i.scheduled_status === 'scheduled').length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15 }}>
                No scheduled posts. Schedule posts from the Library tab.
              </div>
            ) : savedItems.filter(i => i.scheduled_status === 'scheduled').map(item => (
              <div key={item.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <Clock size={16} color="#d4af37" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#fff' }}>{(item.output_content || '').slice(0, 80)}...</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{item.platform && item.platform.toUpperCase()} · {item.scheduled_for ? new Date(item.scheduled_for).toLocaleString() : 'Pending'}</div>
                </div>
                <span style={{ fontSize: 10, color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)', padding: '2px 8px', borderRadius: 99, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900 }}>SCHEDULED</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 32 }}>
        <AICopilotSidebar roomId={null} isHost={false} viewerCount={0} />
        <ContentRecommendations />
        <VODLibrary creatorId={null} />
        <ShareToSocial content={null} />
      </div>
    </div>
  );
}