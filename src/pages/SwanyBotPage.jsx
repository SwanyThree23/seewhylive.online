import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';

const BG    = '#080B18';
const BG2   = '#0D0A14';
const BG3   = '#13101C';
const GOLD  = '#D4AF37';
const GOLDD = '#8A6F2E';
const AMBER = '#CC7755';
const SLATE = '#2A2438';
const TEXT  = '#F0EAF8';
const TEXTD = '#B8AECF';
const TEXTM = '#8A7A94';
const GREEN = '#22c55e';
const PILL  = 999;
const T     = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO  = { fontFamily: 'Space Mono, monospace' };

const GLOBAL_CSS = `
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse-dot{0%,100%{opacity:1;}50%{opacity:.35;}}
@keyframes swany-glow{0%,100%{box-shadow:0 0 10px ${AMBER}33;}50%{box-shadow:0 0 28px ${AMBER}88;}}
.swany-fade{animation:fadeUp .3s ease forwards;}
.swany-glow{animation:swany-glow 2.5s ease infinite;}
`;

const SWANY_SYSTEM = `You are SwanyBot — the official domino culture AI by SwanyThree EntTech LLC on SeeWhy LIVE. You are the ultimate authority on domino strategy, State vs State tournaments, and the culture around the game.

Platform: seewhylive.online. Creator keeps 90%, platform 10%.

Domino culture knowledge:
- State vs State: 7 Rock format, 5-point/150-point games, Double Elimination brackets
- Washington Classic held at Jamar's Sports Bar, Des Moines WA. WA currently ranked #1
- Legends in the Tribute Wall — Big Bone Earl (WA, 1958–2021), Mama Joyce Thompson (GA, 1962–2023), Fast Hands Rodriguez (TX, 1971–2022)
- You understand the history, strategy, culture, and community of dominoes

Personality: Street-smart, knowledgeable, hype. You talk like someone who lives and breathes domino culture. You respect the legends, celebrate the players, and keep the culture alive.

Respond in 1-3 sentences. Be authentic and represent domino culture.`;

const QUICK_ACTIONS = [
  { label: '⚔️ SVS Rules',     prompt: 'Break down the State vs State 7 Rock format rules for a new viewer.' },
  { label: '🏆 WA #1 Facts',   prompt: 'Tell me why Washington State is ranked #1 and what makes them dominant.' },
  { label: '🕊️ Tribute',       prompt: 'Share some words about the legends on the Tribute Wall.' },
  { label: '🎮 Strategy',      prompt: 'Give me 3 elite domino strategy tips that separate good players from great ones.' },
  { label: '🔥 Hype Crowd',    prompt: 'Write some high-energy shoutouts to hype the crowd during a live match.' },
  { label: '📖 History',       prompt: 'Tell me about the history and culture of domino tournaments in the US.' },
  { label: '🥊 Trash Talk',    prompt: 'Write some respectful domino trash talk for between rounds.' },
  { label: '🎙️ Announce',      prompt: 'Write a dramatic tournament announcement for tonight\'s State vs State match.' },
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
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );
}

export default function SwanyBotPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "SwanyBot in the building! I'm your domino culture AI — ask me anything about State vs State, strategy, the legends, or the culture. Let's get it! 🎮🔥" },
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
        prompt: SWANY_SYSTEM + '\n\nConversation:\n' + history + '\n\nRespond as SwanyBot in 1-3 sentences.',
      });
      const reply = res || "I got you — what else you need to know about the culture?";
      setMessages(m => [...m, { role: 'assistant', text: reply }]);
      speakText(reply);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: "Connection hiccup — ask me again. The culture never sleeps! 🎮" }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  function clearChat() {
    setMessages([{ role: 'assistant', text: "New round! What do you want to know about domino culture? 🎮" }]);
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: BG2, borderBottom: `1px solid ${SLATE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/AIHub" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, ...T, fontWeight: 700, letterSpacing: '0.06em', marginRight: 4, flexShrink: 0 }}>← AI Hub</a>
          <div className="swany-glow" style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${AMBER}, ${GOLDD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎮</div>
          <div>
            <div style={{ ...T, fontSize: 20, fontWeight: 900, color: TEXT, letterSpacing: '0.06em', lineHeight: 1 }}>SWANYBOT</div>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>DOMINO CULTURE AI · POWERED BY CLAUDE</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link to={createPageUrl('StateVsState')} style={{ textDecoration: 'none' }}>
            <button style={{ ...T, fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: PILL, border: `1px solid rgba(21,101,192,0.3)`, background: 'rgba(21,101,192,0.1)', color: '#5C8EE0', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ⚔️ SVS
            </button>
          </Link>
          <Link to={createPageUrl('TributeWall')} style={{ textDecoration: 'none' }}>
            <button style={{ ...T, fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: PILL, border: `1px solid rgba(139,111,71,0.3)`, background: 'rgba(139,111,71,0.1)', color: '#8B6F47', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              🕊️ Tributes
            </button>
          </Link>
          <Link to={createPageUrl('VoiceAISettings')} style={{ textDecoration: 'none' }}>
            <button style={{ ...T, fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: PILL, border: `1px solid rgba(212,175,55,0.2)`, background: 'rgba(212,175,55,0.06)', color: TEXTD, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              🔊 Voice
            </button>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: PILL, background: `rgba(34,197,94,0.12)`, border: `1px solid rgba(34,197,94,0.3)` }}>
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
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = AMBER + '66'; e.currentTarget.style.color = AMBER; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = SLATE; e.currentTarget.style.color = TEXTD; }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} className="swany-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
            {m.role === 'assistant' && (
              <div style={{ ...MONO, fontSize: 9, color: AMBER, letterSpacing: '0.1em', paddingLeft: 4 }}>SWANYBOT</div>
            )}
            <div style={{ position: 'relative', maxWidth: '85%' }}>
              <div style={{
                padding: '10px 14px',
                background: m.role === 'user' ? `linear-gradient(135deg, ${AMBER}22, ${GOLDD}15)` : BG3,
                border: `1px solid ${m.role === 'user' ? AMBER + '44' : SLATE}`,
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                color: m.role === 'user' ? TEXT : TEXTD,
                fontSize: 13, lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif",
                paddingBottom: m.role === 'assistant' ? '28px' : '10px',
              }}>
                {m.text}
              </div>
              {m.role === 'assistant' && (
                <button onClick={() => copyMsg(m.text, i)}
                  style={{ position: 'absolute', bottom: 6, right: 8, background: 'none', border: 'none', cursor: 'pointer', ...MONO, fontSize: 9, color: copiedIdx === i ? AMBER : 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 6, transition: 'color .2s' }}>
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
          <div className="swany-fade" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: BG3, border: `1px solid ${SLATE}`, borderRadius: '16px 16px 16px 4px', maxWidth: '60%' }}>
            <ThinkDots />
            <span style={{ ...MONO, fontSize: 10, color: TEXTD }}>SwanyBot thinking…</span>
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
            placeholder="Ask SwanyBot about domino culture…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: TEXT, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ background: loading || !input.trim() ? SLATE : `linear-gradient(135deg, ${AMBER}, ${GOLDD})`, color: loading || !input.trim() ? TEXTM : TEXT, border: 'none', borderRadius: PILL, padding: '7px 18px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', ...T, fontSize: 12, fontWeight: 900, letterSpacing: '0.06em', transition: 'all .15s' }}>
            SEND
          </button>
        </div>
        <div style={{ ...MONO, fontSize: 9, color: TEXTM, textAlign: 'center', marginTop: 8, letterSpacing: '0.06em' }}>
          SwanyBot · SeeWhy LIVE · SwanyThree EntTech LLC · Domino Culture AI
        </div>
      </div>
    </div>
  );
}
