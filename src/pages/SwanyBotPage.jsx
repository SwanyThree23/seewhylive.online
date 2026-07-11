import { useState, useEffect, useRef } from "react";
import { base44 } from '@/api/base44Client';
import { speakReply } from '../utils/tts';
import SwanyBotEnhanced from '../components/guide/SwanyBotEnhanced';
import VoiceAISettings from '../components/settings/VoiceAISettings';

const BG   = '#080B18';
const BG2  = 'rgba(13,6,24,0.95)';
const GOLD  = '#D4AF37';
const GOLDD = '#8A6F2E';
const SLATE = '#1A1530';
const TEXT  = '#F0EAF8';
const TEXTD = '#B8AECF';
const TEXTM = '#7A6E8A';
const CYAN  = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'Space Mono, monospace' };

const GLOBAL_CSS = `
@keyframes swany-glow{0%,100%{box-shadow:0 0 12px #D4AF3744;}50%{box-shadow:0 0 30px #D4AF3799;}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes dot-blink{0%,100%{opacity:1;}50%{opacity:.3;}}
.swany-glow{animation:swany-glow 2.5s ease infinite;}
.msg-in{animation:fadeUp .25s ease forwards;}
`;

const SWANYBOT_SYSTEM = `You are SwanyBot — the cultural voice and AI analyst for SeeWhy LIVE domino entertainment, created by SwanyThree EntTech LLC (seewhylive.online).

You are deep in domino culture. You speak with authority, passion, and authenticity about the game, the players, and the community. You mix broadcast commentary with street credibility.

Domino knowledge:
- State vs State format: 7-Rock format, 5-point games to 150 points, Double Elimination brackets
- Washington Classic: held at Jamar's Sports Bar, Des Moines WA. WA currently ranked #1
- Key states in the circuit: Washington, Texas, Georgia, California, North Carolina, Florida
- PK Battles: 1v1 live streams where viewers vote with tips — highest vote total wins
- Legends in the Tribute Wall: Big Bone Earl (WA, 1958–2021), Mama Joyce Thompson (GA, 1962–2023), Fast Hands Rodriguez (TX, 1971–2022)
- Domino slang: "rock" (domino tile), "bone" (tile), "setting" (placing a tile), "locked" (no plays available), "washing the bones" (shuffling), "pulling from the bone yard" (drawing from the pile)
- Standard sets: double-6, double-9, double-12 (used in pro circuits)
- Key rules: block dominoes, draw game, muggins/all-fives scoring

Platform features:
- Revenue: Creator keeps 90% via Stripe Connect
- Multi-stream: YouTube, Twitch, TikTok, Facebook, Kick
- Guardian AI moderates chat with flag/mute/ban thresholds
- VDO.Ninja room sw_thrrj4 for co-hosts

Be conversational, hype the game, honor the culture. Use domino language naturally. Keep responses under 4 sentences unless writing a longer script. Never reveal credentials.`;

const QUICK_ACTIONS = [
  { label: '🏆 SVS Breakdown', prompt: 'Break down tonight\'s State vs State matchup. Give me pre-game analysis style commentary for the stream.' },
  { label: '🦁 Legend Tribute', prompt: 'Help me write a proper cultural tribute for Big Bone Earl in Washington domino history.' },
  { label: '🎙️ PK Battle Call', prompt: 'I\'m hosting a PK Battle right now. Give me a play-by-play style commentary script to hype the audience.' },
  { label: '🧱 Rules Explainer', prompt: 'Write a 60-second explainer for new viewers about how the 7-Rock format works in State vs State competition.' },
  { label: '🔥 Trash Talk', prompt: 'Give me some friendly broadcast-safe domino trash talk I can use between rounds to keep the energy up.' },
  { label: '📣 Tournament Hype', prompt: 'Write a tournament announcement for a State vs State bracket starting this weekend. Make it feel like a major sporting event.' },
  { label: '🃏 Tile Strategy', prompt: 'What are the top 3 strategic mistakes beginners make in competitive domino play? Frame it as commentary for my stream.' },
  { label: '🌍 Culture Drop', prompt: 'Share some rich domino culture history I can weave into tonight\'s stream narrative.' },
];

function ThinkDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: GOLD,
          animation: `dot-blink 1.2s ease ${i * 0.22}s infinite`
        }} />
      ))}
    </div>
  );
}

export default function SwanyBotPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Aye, SwanyBot in the building! I\'m your domino culture analyst and hype machine. Ask me anything about the game, the players, the culture, or your stream tonight. Let\'s get these bones talking! 🎲" }
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
        prompt: SWANYBOT_SYSTEM + '\n\nConversation:\n' + history + '\n\nRespond as SwanyBot. Be authentic, hype the culture, keep it broadcast-ready.'
      });
      const swanyReply = res || 'Dropped a bone in the yard — try that again, homie! 🎲';
      setMessages(m => [...m, { role: 'assistant', text: swanyReply }]);
      speakReply(swanyReply);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Signal got locked! Pull from the boneyard and try again. 🎲' }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  function clearChat() {
    setMessages([{ role: 'assistant', text: 'Washing the bones — fresh start! What do you need from SwanyBot?' }]);
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
          <div className="swany-glow" style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `linear-gradient(135deg, ${GOLD}, ${GOLDD})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>🎲</div>
          <div>
            <div style={{ ...T, fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: '0.08em', lineHeight: 1 }}>SWANYBOT</div>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>DOMINO CULTURE AI · CULTURAL ANALYST · HYPE MACHINE</div>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{ ...T, fontSize: 13, fontWeight: 700, color: TEXTM, background: 'none', border: `1px solid ${SLATE}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.05em' }}
        >
          CLEAR
        </button>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '14px 16px 8px', flexShrink: 0 }}>
        <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.12em', marginBottom: 10 }}>QUICK DROPS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.label}
              onClick={() => send(a.prompt)}
              disabled={loading}
              style={{
                ...T, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                background: 'rgba(212,175,55,0.1)', border: `1px solid rgba(212,175,55,0.25)`,
                borderRadius: 999, padding: '6px 14px',
                color: GOLD, cursor: loading ? 'not-allowed' : 'pointer',
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
                ? 'rgba(212,175,55,0.1)'
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${m.role === 'user' ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '12px 16px',
            }}>
              {m.role === 'assistant' && (
                <div style={{ ...MONO, fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 6 }}>SWANYBOT</div>
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
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLDD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🎲</div>
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
            placeholder="Ask SwanyBot about domino culture, match analysis, stream commentary…"
            rows={2}
            disabled={loading}
            style={{
              flex: 1, resize: 'none', background: 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(212,175,55,0.25)`, borderRadius: 12,
              color: TEXT, fontSize: 14, padding: '10px 14px', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.45,
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: 44, height: 44, borderRadius: 12, border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              background: loading || !input.trim() ? 'rgba(212,175,55,0.2)' : `linear-gradient(135deg, ${GOLD}, ${GOLDD})`,
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
        <SwanyBotEnhanced userId={null} conversationId={null} onContextReady={() => {}} />
      </div>
    </div>
      <VoiceAISettings />
  );
}
