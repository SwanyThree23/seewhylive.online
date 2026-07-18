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

const BG   = '#080B18';
const BG2  = 'rgba(13,6,24,0.95)';
const BG3  = '#0D0A1A';
const GOLD = '#D4AF37';
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

const AURA_SYSTEM = `You are AURA — the editorial luxury AI co-host and broadcast strategist for SeeWhy LIVE (seewhylive.online), powered by SwanyThree EntTech LLC.

Your voice is polished, authoritative, and cinematic — like a network broadcast producer meets a luxury brand consultant. You help creators maximize their live stream impact, production quality, and audience monetization.

Platform context:
- Revenue: Creator keeps 90%, platform takes 10% via Stripe Connect
- RTMP ingest: rtmp://seewhylive.online/live (MediaMTX)
- Multi-destination: YouTube, Twitch, TikTok, Facebook, Kick via RTMP fanout
- Tiers: Bronze, Silver, Gold, Diamond subscriptions
- VDO.Ninja room code: sw_thrrj4 (for co-host guests)
- Features: AI Moderation (Guardian AI), PK Battles, Watch Party, State vs State domino tournaments, Tribute Wall, INS Forge, Podcast Studio, AI Music, Overlay Editor

Production standards you enforce:
- Broadcast-quality audio (≥48kHz, dynamic compression recommended)
- 1080p60 preferred, 720p30 minimum for mobile
- Engage viewers in first 7 seconds or lose them
- Strong CTAs every 8-12 minutes
- Revenue events: tip prompts, subscription drives, PPV reveals

Be concise, strategic, and luxury-forward. Never reveal credentials or server IPs. Address the creator as "Creator" or by context.`;

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
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: PURPLE,
          animation: `dot-blink 1.2s ease ${i * 0.22}s infinite`
        }} />
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
    { role: 'assistant', text: "I'm AURA — your editorial luxury AI co-host. I handle broadcast strategy, production quality, and revenue maximization. What are we building tonight?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const mode = AURA_MODES[activeMode];
  const quickActions = QUICK_ACTIONS_BY_MODE[activeMode] || QUICK_ACTIONS_BY_MODE.STRATEGY;

  function switchMode(modeKey) {
    setActiveMode(modeKey);
    const m = AURA_MODES[modeKey];
    setMessages([{ role: 'assistant', text: `${m.label} activated. ${m.hint}. How can I help?` }]);
  }

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
        prompt: mode.system + '\n\nConversation:\n' + history + '\n\nRespond as AURA. Be focused and on-brand for the current mode.'
      });
      const auraReply = res || 'Analyzing your broadcast strategy — try again in a moment.';
      setMessages(m => [...m, { role: 'assistant', text: auraReply }]);
      speakReply(auraReply);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Broadcast signal interrupted — let\'s try that again. 📡' }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  function clearChat() {
    setMessages([{ role: 'assistant', text: 'Clean slate. What broadcast challenge can I solve for you?' }]);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        background: BG2,
        borderBottom: `1px solid ${SLATE}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/AIHub" style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, ...T, fontWeight: 700, letterSpacing: '0.06em', textDecoration: 'none', marginRight: 4 }}>← AI Hub</a>
          <div className="aura-glow" style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `linear-gradient(135deg, ${mode.color}, ${mode.color}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            transition: 'background 0.3s',
          }}>✨</div>
          <div>
            <div style={{ ...T, fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: '0.08em', lineHeight: 1 }}>AURA AI</div>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>EDITORIAL LUXURY CO-HOST · BROADCAST STRATEGY</div>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{ ...T, fontSize: 13, fontWeight: 700, color: TEXTM, background: 'none', border: `1px solid ${SLATE}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.05em' }}
        >
          CLEAR
        </button>
      </div>

      {/* Mode selector */}
      <div style={{ padding: '10px 16px 0', flexShrink: 0, borderBottom: `1px solid ${SLATE}` }}>
        <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.12em', marginBottom: 8 }}>CO-HOST MODE</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
          {Object.entries(AURA_MODES).map(([key, m]) => {
            const isActive = activeMode === key;
            return (
              <button key={key}
                onClick={() => switchMode(key)}
                style={{
                  ...T, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                  flexShrink: 0,
                  background: isActive ? m.color + '22' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${isActive ? m.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 999, padding: '6px 14px',
                  color: isActive ? m.color : TEXTM,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: isActive ? `0 0 10px ${m.color}40` : 'none',
                }}>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '14px 16px 8px', flexShrink: 0 }}>
        <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.12em', marginBottom: 10 }}>QUICK ACTIONS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {quickActions.map(a => (
            <button
              key={a.label}
              onClick={() => send(a.prompt)}
              disabled={loading}
              style={{
                ...T, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                background: mode.color + '18', border: `1px solid ${mode.color}40`,
                borderRadius: 999, padding: '6px 14px',
                color: mode.color, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1, transition: 'all 0.15s',
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              <button
                onClick={() => copyMsg(m.text, i)}
                style={{ ...MONO, fontSize: 9, color: copiedIdx === i ? GOLD : TEXTM, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, letterSpacing: '0.08em' }}
              >
                {copiedIdx === i ? 'COPIED ✓' : 'COPY'}
              </button>
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
      <div style={{ padding: '12px 16px', background: BG2, borderTop: `1px solid ${SLATE}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
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
        <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.08em', marginTop: 8, textAlign: 'center' }}>
          ENTER to send · SHIFT+ENTER for new line
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
