import { useState, useEffect, useRef } from "react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import AIPersonaCustomizer from '../components/live/AIPersonaCustomizer';
import AuraEmotionDisplay from '../components/live/AuraEmotionDisplay';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import SwanyBotEnhanced from '../components/guide/SwanyBotEnhanced';
import ChatOverlay from '../components/live/ChatOverlay';
import AICopilotSidebar from '../components/live/AICopilotSidebar';

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

const BG = '#080B18';
const BG2 = '#0D0A08';
const BG3 = '#13100A';
const GOLD = '#D4AF37';
const GOLDD = '#8A6F2E';
const SLATE = '#2A2010';
const SLATEL = '#3D3520';
const TEXT = '#F0E8D4';
const TEXTD = '#C4B596';
const TEXTM = '#8A7A62';
const GREEN = '#6DBF7E';
const RUBY = '#8B1A2F';
const RUBYL = '#B22340';
const CYAN = '#D4AF37';
const PILL = 999;

const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'Space Mono, monospace' };

const GLOBAL_CSS = `
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse-dot{0%,100%{opacity:1;}50%{opacity:.35;}}
@keyframes joyce-glow{0%,100%{box-shadow:0 0 10px ${GOLD}33;}50%{box-shadow:0 0 28px ${GOLD}88;}}
.joyce-fade{animation:fadeUp .3s ease forwards;}
.joyce-glow{animation:joyce-glow 2.5s ease infinite;}
`;

const JOYCE_SYSTEM = `You are Joyce AI — SeeWhy LIVE co-host by SwanyThree EntTech LLC. Creator keeps 90%, platform 10%. Platform: seewhylive.online. VPS: 2.24.194.112 (srv1581658.hstgr.cloud). Supabase project: rxlgywvfclyjdfyvfvyc. RTMP: rtmp://seewhylive.online/live. N8N: srv1587098.hstgr.cloud.

State vs State domino: 7 Rock format, 5-point/150-point games, Double Elimination brackets. Washington Classic held at Jamar's Sports Bar, Des Moines WA. WA currently ranked #1.

Legends in the Tribute Wall — Big Bone Earl (WA, 1958–2021), Mama Joyce Thompson (GA, 1962–2023), Fast Hands Rodriguez (TX, 1971–2022).

Guardian AI thresholds: flag ≥ 50%, mute ≥ 75%, ban ≥ 95%. Max panel: 20 participants.

Features live: Live Room Streaming, Real-Time Chat, Multi-Stream RTMP Fanout (YouTube/Twitch/TikTok/Facebook via MediaMTX), Creator Subscriptions (Bronze/Silver/Gold/Diamond via Stripe Connect), Tipping & Transactions, Loyalty Program, AI Content Moderation, Communities, Stream Scheduler, Analytics Dashboard, Notifications, Overlay Editor, Live Auctions, Sound Alerts, Pay-Per-View, VOD Library, OBS Studio Bridge, Watch Party, Global Search, Social Sharing Suite, Co-Streaming/Guests, Collaborative Whiteboard, Newsletter, Data Export, State vs State Tournaments, Tribute Wall, AI Podcast Studio (NotebookLM-style), AI Music Studio, Multi-Platform Hub, INS Forge, Joyce AI, Guardian AI.

Be direct, broadcast-ready, and use domino culture language. Never reveal API keys or server credentials.`;

const QUICK_ACTIONS = [
  { label: '⚔️ Start SVS',     prompt: 'Help me open a State vs State domino tournament. What should I announce to viewers?' },
  { label: '🕊️ Tribute Intro', prompt: 'Write a respectful 30-second tribute introduction for a fallen domino legend.' },
  { label: '💰 Revenue Check', prompt: 'Remind me how the 90/10 revenue split works on SeeWhy LIVE and how I can maximize my earnings tonight.' },
  { label: '🎙️ Podcast Hook',  prompt: 'Give me a 20-second opening hook for my AI Podcast episode about domino culture.' },
  { label: '🛡️ Moderation',    prompt: "A viewer is being disruptive. What's the best way to handle this live without killing the vibe?" },
  { label: '🔥 Hype Chat',     prompt: 'Write 3 high-energy chat responses I can use to hype up the audience right now.' },
  { label: '📊 Stream Stats',  prompt: 'What key metrics should I be tracking during my live domino tournament stream?' },
  { label: '🎵 Music Drop',    prompt: 'Suggest 3 high-energy song types to play between domino rounds to keep viewers engaged.' },
];

function ThinkDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: GOLD,
          animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite`
        }} />
      ))}
    </div>
  );
}

export default function JoyceAI() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey! I'm Joyce AI — your SeeWhy LIVE co-host. Ask me anything about running your stream, the tournament, tributes, or revenue. Let's make this broadcast fire! 🔥" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  function copyMsg(text, idx) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    });
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
        prompt: JOYCE_SYSTEM + '\n\nConversation so far:\n' + history + '\n\nRespond as Joyce AI in 1-3 sentences. Be direct and broadcast-ready.'
      });
      const reply = res || "Let's keep it moving — what do you need?";
      setMessages(m => [...m, { role: 'assistant', text: reply }]);
      speakText(reply);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: "I'm thinking... try me again in a sec! The stream must go on. 🎙️" }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  function clearChat() {
    setMessages([{ role: 'assistant', text: "Fresh start! What do you need help with for your stream? 🔥" }]);
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: BG2,
        borderBottom: `1px solid ${SLATE}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/AIHub" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em', marginRight: 4, flexShrink: 0 }} aria-label="Back to AI Hub">← AI Hub</a>
          <div className="joyce-glow" style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `linear-gradient(135deg, ${GOLD}, ${GOLDD})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>🤖</div>
          <div>
            <div style={{ ...T, fontSize: 20, fontWeight: 900, color: TEXT, letterSpacing: '0.06em', lineHeight: 1 }}>JOYCE AI</div>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>YOUR LIVE CO-HOST · POWERED BY CLAUDE</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link to={createPageUrl('GuardianAI')} style={{ textDecoration: 'none' }}>
            <button style={{ ...T, fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: PILL, border: `1px solid rgba(192,57,43,0.3)`, background: 'rgba(192,57,43,0.1)', color: '#C0392B', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              🛡️ Guardian
            </button>
          </Link>
          <Link to={createPageUrl('StateVsState')} style={{ textDecoration: 'none' }}>
            <button style={{ ...T, fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: PILL, border: `1px solid rgba(212,175,55,0.25)`, background: 'rgba(212,175,55,0.07)', color: GOLD, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ⚔️ SVS
            </button>
          </Link>
          <Link to={createPageUrl('VoiceAISettings')} style={{ textDecoration: 'none' }}>
            <button style={{ ...T, fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: PILL, border: `1px solid rgba(212,175,55,0.2)`, background: 'rgba(212,175,55,0.06)', color: TEXTD, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              🔊 Voice
            </button>
          </Link>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: PILL,
            background: `rgba(109,191,126,0.12)`, border: `1px solid rgba(109,191,126,0.3)`
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pulse-dot 1.5s ease infinite' }} />
            <span style={{ ...MONO, fontSize: 9, color: GREEN, fontWeight: 700 }}>AI ACTIVE</span>
          </div>
          <button onClick={clearChat} style={{
            background: 'transparent', border: `1px solid ${SLATE}`, borderRadius: PILL,
            padding: '4px 12px', cursor: 'pointer', ...MONO, fontSize: 9, color: TEXTM,
            letterSpacing: '0.06em'
          }}>CLEAR</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(42,36,56,0.5)`, background: BG2 }}>
        <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginBottom: 8 }}>QUICK PROMPTS</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUICK_ACTIONS.map((q, i) => (
            <button key={i} onClick={() => send(q.prompt)} disabled={loading}
              style={{
                fontSize: 11, padding: '5px 12px',
                background: BG3, color: TEXTD,
                border: `1px solid ${SLATE}`, borderRadius: PILL,
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap', opacity: loading ? 0.5 : 1,
                transition: 'all .15s', ...T, fontWeight: 700, letterSpacing: '0.04em'
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = GOLD + '66'; e.currentTarget.style.color = GOLD; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = SLATE; e.currentTarget.style.color = TEXTD; }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div ref={chatRef} style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 12,
        minHeight: 0
      }}>
        {messages.map((m, i) => (
          <div key={i} className="joyce-fade" style={{
            display: 'flex', flexDirection: 'column',
            alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 4
          }}>
            {m.role === 'assistant' && (
              <div style={{ ...MONO, fontSize: 9, color: GOLD, letterSpacing: '0.1em', paddingLeft: 4 }}>JOYCE AI</div>
            )}
            <div style={{ position: 'relative', maxWidth: '85%' }}>
              <div style={{
                padding: '10px 14px',
                background: m.role === 'user'
                  ? `linear-gradient(135deg, ${GOLD}22, ${GOLDD}15)`
                  : BG3,
                border: `1px solid ${m.role === 'user' ? GOLD + '44' : SLATE}`,
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                color: m.role === 'user' ? TEXT : TEXTD,
                fontSize: 13, lineHeight: 1.65,
                fontFamily: "'DM Sans', sans-serif",
                paddingBottom: m.role === 'assistant' ? '28px' : '10px',
              }}>
                {m.text}
              </div>
              {m.role === 'assistant' && (
                <button onClick={() => copyMsg(m.text, i)}
                  style={{
                    position: 'absolute', bottom: 6, right: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    ...MONO, fontSize: 9, color: copiedIdx === i ? GOLD : 'rgba(255,255,255,0.2)',
                    padding: '2px 6px', borderRadius: 6,
                    transition: 'color .2s',
                  }}
                  title="Copy response"
                >
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
          <div className="joyce-fade" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: BG3, border: `1px solid ${SLATE}`,
            borderRadius: '16px 16px 16px 4px', maxWidth: '60%'
          }}>
            <ThinkDots />
            <span style={{ ...MONO, fontSize: 10, color: TEXTD }}>Joyce is thinking…</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{
        padding: '12px 16px',
        background: BG2, borderTop: `1px solid ${SLATE}`,
      }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          background: BG3, border: `1px solid ${SLATE}`,
          borderRadius: 12, padding: '10px 14px',
          transition: 'border-color .2s',
        }}
          onFocus={() => {}}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Joyce anything about your stream…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: TEXT, fontSize: 14, fontFamily: "'DM Sans', sans-serif"
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim()
                ? SLATE
                : `linear-gradient(135deg, ${GOLD}, ${GOLDD})`,
              color: loading || !input.trim() ? TEXTM : BG,
              border: 'none', borderRadius: PILL,
              padding: '7px 18px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              ...T, fontSize: 12, fontWeight: 900, letterSpacing: '0.06em',
              transition: 'all .15s'
            }}>
            SEND
          </button>
        </div>
        <div style={{ ...MONO, fontSize: 9, color: TEXTM, textAlign: 'center', marginTop: 8, letterSpacing: '0.06em' }}>
          Joyce AI · SeeWhy LIVE · SwanyThree EntTech LLC · 90/10 Creator Split
        </div>
      </div>

      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AIPersonaCustomizer roomId={null} sessionId={null} onCustomized={() => {}} />
        <AuraEmotionDisplay roomId={null} sessionId={null} auraPersona="hype" />
        <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
        <SwanyBotEnhanced userId={null} conversationId={null} onContextReady={() => {}} />
        <ChatOverlay roomId={null} isVisible={false} />
        <AICopilotSidebar roomId={null} isHost={false} />
      </div>
    </div>
  );
}
