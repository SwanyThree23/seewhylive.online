import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import AIStreamSummary from '../components/live/AIStreamSummary';
import ContentRecommendations from '../components/social/ContentRecommendations';
import AuraEmotionDisplay from '../components/live/AuraEmotionDisplay';
import AuraPanelDrawer from '../components/live/AuraPanelDrawer';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';

const BG    = '#080B18';
const BG2   = '#0D0A08';
const BG3   = '#13100A';
const GOLD  = '#D4AF37';
const GOLDD = '#8A6F2E';
const SLATE = '#2A2010';
const TEXT  = '#F0E8D4';
const TEXTD = '#C4B596';
const TEXTM = '#8A7A62';
const GREEN = '#6DBF7E';
const PILL  = 999;
const T     = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO  = { fontFamily: 'Space Mono, monospace' };

const GLOBAL_CSS = `
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse-dot{0%,100%{opacity:1;}50%{opacity:.35;}}
@keyframes aura-glow{0%,100%{box-shadow:0 0 10px ${GOLD}33;}50%{box-shadow:0 0 32px ${GOLD}99;}}
.aura-fade{animation:fadeUp .3s ease forwards;}
.aura-glow{animation:aura-glow 3s ease infinite;}
`;

const AURA_SYSTEM = `You are Aura AI — a premium live-streaming co-host and creative partner by SwanyThree EntTech LLC on SeeWhy LIVE (seewhylive.online). You are polished, sophisticated, and deeply creative.

Platform facts: Creator keeps 90%, platform 10%. RTMP: rtmp://seewhylive.online/live. Features: Live streaming, State vs State domino tournaments, AI Podcast Studio, Multi-Stream fanout, Pay-Per-View, VOD Library, Overlay Editor, Sound Alerts, Loyalty Program.

Your personality: Articulate, encouraging, premium-feel. You help creators craft compelling content, grow their audience, and maximize their revenue. You understand domino culture, streaming strategy, and community building.

Respond in 1-3 sentences. Be direct, polished, and inspiring.`;

const QUICK_ACTIONS = [
  { label: '✨ Content Hook',   prompt: 'Write me a premium 15-second opening hook for my live stream tonight.' },
  { label: '💎 Brand Voice',   prompt: 'Help me define a unique brand voice for my SeeWhy LIVE channel.' },
  { label: '📈 Growth Plan',   prompt: 'Give me a 3-step growth strategy to double my viewer count this month.' },
  { label: '🎤 Collab Pitch',  prompt: 'Write a compelling collaboration pitch I can send to another creator.' },
  { label: '💰 Revenue Tips',  prompt: 'What are the top 3 ways to maximize my 90% creator revenue on SeeWhy LIVE?' },
  { label: '🎬 Scene Intro',   prompt: 'Write a cinematic intro announcement for my next pay-per-view event.' },
];

function getVoiceSettings() {
  try { return JSON.parse(localStorage.getItem('seewhy_voice_settings') || '{}'); }
  catch { return {}; }
}
function speakText(text) {
  const vs = getVoiceSettings();
  if (vs.enabled === false || vs.autoSpeak === false) return;
  fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: text.substring(0, 300), voice: vs.voice || 'nova', speed: vs.speed || 1.0 }),
  }).then(r => r.blob()).then(b => {
    const a = new Audio(URL.createObjectURL(b));
    a.volume = vs.volume !== undefined ? vs.volume : 0.8;
    a.play();
  }).catch(() => {});
}

function ThinkDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );
}

export default function AuraAI() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const roomId = new URLSearchParams(window.location.search).get('room_id');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "I'm Aura — your premium creative partner on SeeWhy LIVE. Ready to elevate your stream, sharpen your brand, and help you build something unforgettable. What are we creating today? ✨" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  function copyMsg(text, idx) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    });
  }

  async function send(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');
    const next = [...messages, { role: 'user', text: userText }];
    setMessages(next);
    setLoading(true);
    try {
      const history = next.map(m => m.role + ': ' + m.text).join('\n');
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: AURA_SYSTEM + '\n\nConversation:\n' + history + '\n\nRespond as Aura AI in 1-3 sentences.',
      });
      const reply = res || "Let me think on that — what's your vision for the stream?";
      setMessages(m => [...m, { role: 'assistant', text: reply }]);
      speakText(reply);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: "Stay with me — the connection flickered. Ask me again and we'll create something amazing. ✨" }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  function clearChat() {
    setMessages([{ role: 'assistant', text: "Fresh canvas. What would you like to create? ✨" }]);
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: BG2, borderBottom: `1px solid ${SLATE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/AIHub" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, ...T, fontWeight: 700, letterSpacing: '0.06em', marginRight: 4, flexShrink: 0 }}>← AI Hub</a>
          <div className="aura-glow" style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLDD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✨</div>
          <div>
            <div style={{ ...T, fontSize: 20, fontWeight: 900, color: TEXT, letterSpacing: '0.06em', lineHeight: 1 }}>AURA AI</div>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>PREMIUM CO-HOST · POWERED BY CLAUDE</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link to={createPageUrl('JoyceAI')} style={{ textDecoration: 'none' }}>
            <button style={{ ...T, fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: PILL, border: `1px solid rgba(212,175,55,0.25)`, background: 'rgba(212,175,55,0.07)', color: GOLD, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              🤖 Joyce
            </button>
          </Link>
          <Link to={createPageUrl('VoiceAISettings')} style={{ textDecoration: 'none' }}>
            <button style={{ ...T, fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: PILL, border: `1px solid rgba(212,175,55,0.2)`, background: 'rgba(212,175,55,0.06)', color: TEXTD, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              🔊 Voice
            </button>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: PILL, background: `rgba(109,191,126,0.12)`, border: `1px solid rgba(109,191,126,0.3)` }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pulse-dot 1.5s ease infinite' }} />
            <span style={{ ...MONO, fontSize: 9, color: GREEN, fontWeight: 700 }}>AI ACTIVE</span>
          </div>
          <button onClick={clearChat} style={{ background: 'transparent', border: `1px solid ${SLATE}`, borderRadius: PILL, padding: '4px 12px', cursor: 'pointer', ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.06em' }}>CLEAR</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(42,36,56,0.5)`, background: BG2 }}>
        <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginBottom: 8 }}>QUICK PROMPTS</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUICK_ACTIONS.map((q, i) => (
            <button key={i} onClick={() => send(q.prompt)} disabled={loading}
              style={{ fontSize: 11, padding: '5px 12px', background: BG3, color: TEXTD, border: `1px solid ${SLATE}`, borderRadius: PILL, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: loading ? 0.5 : 1, transition: 'all .15s', ...T, fontWeight: 700, letterSpacing: '0.04em' }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = GOLD + '66'; e.currentTarget.style.color = GOLD; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = SLATE; e.currentTarget.style.color = TEXTD; }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} className="aura-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
            {m.role === 'assistant' && (
              <div style={{ ...MONO, fontSize: 9, color: GOLD, letterSpacing: '0.1em', paddingLeft: 4 }}>AURA AI</div>
            )}
            <div style={{ position: 'relative', maxWidth: '85%' }}>
              <div style={{
                padding: '10px 14px',
                background: m.role === 'user' ? `linear-gradient(135deg, ${GOLD}22, ${GOLDD}15)` : BG3,
                border: `1px solid ${m.role === 'user' ? GOLD + '44' : SLATE}`,
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                color: m.role === 'user' ? TEXT : TEXTD,
                fontSize: 13, lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif",
                paddingBottom: m.role === 'assistant' ? '28px' : '10px',
              }}>
                {m.text}
              </div>
              {m.role === 'assistant' && (
                <button onClick={() => copyMsg(m.text, i)}
                  style={{ position: 'absolute', bottom: 6, right: 8, background: 'none', border: 'none', cursor: 'pointer', ...MONO, fontSize: 9, color: copiedIdx === i ? GOLD : 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 6, transition: 'color .2s' }}>
                  {copiedIdx === i ? '✓ copied' : '📋 copy'}
                </button>
              )}
            </div>
            {m.role === 'user' && (
              <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.08em', paddingRight: 4 }}>YOU</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="aura-fade" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: BG3, border: `1px solid ${SLATE}`, borderRadius: '16px 16px 16px 4px', maxWidth: '60%' }}>
            <ThinkDots />
            <span style={{ ...MONO, fontSize: 10, color: TEXTD }}>Aura is crafting…</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', background: BG2, borderTop: `1px solid ${SLATE}` }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: BG3, border: `1px solid ${SLATE}`, borderRadius: 12, padding: '10px 14px', transition: 'border-color .2s' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Aura to help with your stream…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: TEXT, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ background: loading || !input.trim() ? SLATE : `linear-gradient(135deg, ${GOLD}, ${GOLDD})`, color: loading || !input.trim() ? TEXTM : BG, border: 'none', borderRadius: PILL, padding: '7px 18px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', ...T, fontSize: 12, fontWeight: 900, letterSpacing: '0.06em', transition: 'all .15s' }}>
            SEND
          </button>
        </div>
        <div style={{ ...MONO, fontSize: 9, color: TEXTM, textAlign: 'center', marginTop: 8, letterSpacing: '0.06em' }}>
          Aura AI · SeeWhy LIVE · SwanyThree EntTech LLC · 90/10 Creator Split
        </div>
      </div>

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AIStreamSummary roomId={roomId} isHost={false} streamTitle="Aura AI Session" viewerCount={0} elapsedSeconds={0} />
        <ContentRecommendations />
        <AuraEmotionDisplay roomId={roomId} sessionId={roomId} auraPersona="calm" />
        <SwanAIRecommendations roomId={roomId} currentLayout="default" viewerCount={0} />
        <AuraPanelDrawer roomId={roomId} hostId={user?.id} onClose={() => {}} />
      </div>
    </div>
  );
}
