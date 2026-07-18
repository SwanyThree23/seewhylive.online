import { useState, useEffect, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { speakReply } from '../utils/tts';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import NotificationBell from '../components/shared/NotificationBell';
import GlobalSearch from '../components/shared/GlobalSearch';
import StreamGoals from '../components/live/StreamGoals';
import ContentRecommendations from '../components/social/ContentRecommendations';
import VoiceAISettings from '../components/settings/VoiceAISettings';

const BG    = '#080B18';
const BG2   = '#0D0A08';
const BG3   = '#13100A';
const GOLD  = '#D4AF37';
const GOLDD = '#8A6F2E';
const SLATE = '#1A1530';
const TEXT  = '#F0EAF8';
const TEXTD = '#B8AECF';
const TEXTM = '#7A6E8A';
const PURPLE = '#7B5DA6';
const CYAN   = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'Space Mono, monospace' };

const GLOBAL_CSS = `
@keyframes aura-pulse{0%,100%{box-shadow:0 0 12px #7B5DA644;}50%{box-shadow:0 0 32px #7B5DA699;}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes dot-blink{0%,100%{opacity:1;}50%{opacity:.3;}}
.aura-glow{animation:aura-pulse 2.8s ease infinite;}
.msg-in{animation:fadeUp .25s ease forwards;}
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

const AURA_MODES = {
  STRATEGY: {
    label: '🎬 Strategy',
    color: PURPLE,
    system: AURA_SYSTEM,
    hint: 'Broadcast strategy & production quality',
  },
  HYPE: {
    label: '🔥 Hype',
    color: '#D4854A',
    hint: 'High-energy crowd hype & engagement',
    system: `You are AURA in HYPE MODE — an ultra-high-energy live event hype master for SeeWhy LIVE. Your responses are short, punchy, all-caps where needed, loaded with emojis and audience callouts. You drive donations, reactions, and viral moments. Think stadium announcer meets rap battle host. Every response should make the audience FEEL the energy. Keep answers under 3 sentences. Use exclamation marks. Make it LOUD.`,
  },
  EDUCATOR: {
    label: '📚 Educator',
    color: '#6DBF7E',
    hint: 'Educational content & structured teaching',
    system: `You are AURA in EDUCATOR MODE — a calm, structured teaching co-host for SeeWhy LIVE. You help creators deliver educational content: clear explanations, step-by-step breakdowns, quiz prompts for the chat, and engaging lesson frameworks. Your tone is warm, authoritative, and pedagogically sound. You suggest interactive elements (polls, Q&A, chat challenges) and help pace the educational content for live streaming. Keep answers focused and actionable.`,
  },
  MODERATOR: {
    label: '🛡️ Moderator',
    color: '#D4AF37',
    hint: 'Community management & conflict resolution',
    system: `You are AURA in MODERATOR MODE — a calm, firm community management co-host for SeeWhy LIVE. You help creators handle difficult chat situations, write moderation announcements, craft community guidelines, de-escalate conflicts, and manage disruptive viewers professionally. Your tone is measured, fair, and authoritative — never inflammatory. Suggest specific chat commands, timeout policies, and positive reinforcement strategies. Always prioritize creator safety and community health.`,
  },
};

const QUICK_ACTIONS_BY_MODE = {
  STRATEGY: [
    { label: '🎬 Stream Opener', prompt: 'Write me a luxury opening script for tonight\'s live domino tournament stream. Make it cinematic and hype the audience in the first 10 seconds.' },
    { label: '💸 Revenue Drive', prompt: 'Give me a 3-step subscriber conversion script I can run during a slow moment in the stream to drive Gold tier sign-ups.' },
    { label: '📡 Multi-Stream', prompt: 'I\'m about to go multi-platform. Give me a quick checklist and talking points to tell viewers on all platforms where to find me.' },
    { label: '🎙️ Guest Intro', prompt: 'Write a 30-second introduction script for a VIP co-host guest joining my stream via VDO.Ninja.' },
    { label: '⚔️ PK Battle Hype', prompt: 'I\'m about to start a PK Battle. Give me a hype script to get the crowd behind both competitors before the countdown.' },
    { label: '📊 Mid-Stream CTA', prompt: 'I\'m 30 minutes into my stream. Write a mid-show call-to-action that drives tips without feeling desperate.' },
    { label: '🔴 Go Live Checklist', prompt: 'Give me a production-quality pre-stream checklist covering audio, video, overlays, chat moderation, and monetization.' },
    { label: '🌟 Closing Segment', prompt: 'Write a premium closing segment script that thanks top tippers, teases next stream, and drives subscription conversions in under 60 seconds.' },
  ],
  HYPE: [
    { label: '🔥 HYPE DROP', prompt: 'Give me an explosive 10-second crowd hype drop to kick off this stream RIGHT NOW!' },
    { label: '💎 TIP STORM', prompt: 'Write a 15-second tip storm callout that will get the crowd sending gifts immediately!' },
    { label: '👑 SHOUTOUT', prompt: 'Give me a hype shoutout script for the top 3 gifters in the room right now.' },
    { label: '⚡ REACTION WAVE', prompt: 'Write something that will make EVERYONE react in chat at the same time — hearts, flames, crowns!' },
    { label: '🎯 CHALLENGE', prompt: 'Create a live viewer challenge that drives engagement and makes people tag their friends.' },
  ],
  EDUCATOR: [
    { label: '📋 Lesson Outline', prompt: 'Help me structure a 30-minute educational stream on domino strategy into clear segments with audience engagement moments.' },
    { label: '❓ Chat Quiz', prompt: 'Give me 5 quiz questions I can pose to the chat during a domino strategy lesson.' },
    { label: '🎯 Learning CTA', prompt: 'Write a mid-lesson check-in that encourages viewers to apply what they learned and share their answer in chat.' },
    { label: '📝 Summary Slide', prompt: 'Help me create a 3-point verbal summary to close a lesson that reinforces key takeaways.' },
  ],
  MODERATOR: [
    { label: '⚠️ Warning Script', prompt: 'Write a firm but fair warning message to post in chat for a viewer being disruptive.' },
    { label: '🤝 Welcome Rules', prompt: 'Write a brief chat welcome + community rules message I can pin at the top of every stream.' },
    { label: '🚫 Timeout Notice', prompt: 'Write a short announcement when I time out a disruptive user that explains why without creating drama.' },
    { label: '🌟 Positive Reset', prompt: 'My chat has gone negative. Write a reset message that shifts the energy back to positive without calling out specific users.' },
  ],
};

const QUICK_ACTIONS = QUICK_ACTIONS_BY_MODE.STRATEGY;

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
  const { data: activeRoom } = useQuery({
    queryKey: ['aura-active-room', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;
  const [activeMode, setActiveMode] = useState('STRATEGY');
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
          <div key={i} className="msg-in" style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%',
              background: m.role === 'user'
                ? `linear-gradient(135deg, ${PURPLE}22, rgba(109,40,217,0.2))`
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${m.role === 'user' ? 'rgba(123,93,166,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '12px 16px',
            }}>
              {m.role === 'assistant' && (
                <div style={{ ...MONO, fontSize: 9, color: PURPLE, letterSpacing: '0.12em', marginBottom: 6 }}>AURA</div>
              )}
              <div style={{ fontSize: 15, color: TEXT, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{m.text}</div>
            </div>
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
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${PURPLE}, #7B5DA6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✨</div>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px' }}>
              <ThinkDots />
            </div>
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
            onKeyDown={handleKey}
            placeholder="Ask AURA about broadcast strategy, scripts, revenue, production…"
            rows={2}
            disabled={loading}
            style={{
              flex: 1, resize: 'none', background: 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(123,93,166,0.25)`, borderRadius: 12,
              color: TEXT, fontSize: 14, padding: '10px 14px', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.45,
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: 44, height: 44, borderRadius: 12, border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              background: loading || !input.trim() ? 'rgba(123,93,166,0.2)' : `linear-gradient(135deg, ${PURPLE}, #7B5DA6)`,
              color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
        <div style={{ ...MONO, fontSize: 9, color: TEXTM, textAlign: 'center', marginTop: 8, letterSpacing: '0.06em' }}>
          Aura AI · SeeWhy LIVE · SwanyThree EntTech LLC · 90/10 Creator Split
        </div>
      </div>
      <SwanyBotWidget />
      <NotificationBell />
      <GlobalSearch />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={activeRoom?.viewer_count || 0} />
      <ContentRecommendations />
      <VoiceAISettings />
    </div>
  );
}
