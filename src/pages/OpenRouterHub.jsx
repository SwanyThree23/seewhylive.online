import React, { useState, useRef, useEffect } from 'react';
import {
  Zap, Send, RotateCcw, Copy, ChevronDown, BarChart2, Cpu,
  Clock, DollarSign, Layers, CheckCircle, X, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const BG   = '#07050A';
const GOLD = '#C9A84C';
const BURG = '#6B1F2A';
const DIM  = 'rgba(255,255,255,0.45)';
const T    = { fontFamily: 'Barlow Condensed, sans-serif' };

const MODELS = [
  { id: 'anthropic/claude-haiku-4-5',           label: 'Claude Haiku 4.5',      provider: 'Anthropic',  cost: '$0.25/M',  speed: 'Ultra Fast',  ctx: '200K' },
  { id: 'anthropic/claude-sonnet-4-5',          label: 'Claude Sonnet 4.5',     provider: 'Anthropic',  cost: '$3/M',     speed: 'Fast',         ctx: '200K' },
  { id: 'anthropic/claude-opus-4-5',            label: 'Claude Opus 4.5',       provider: 'Anthropic',  cost: '$15/M',    speed: 'Slower',       ctx: '200K' },
  { id: 'openai/gpt-4o-mini',                   label: 'GPT-4o Mini',           provider: 'OpenAI',     cost: '$0.15/M',  speed: 'Ultra Fast',  ctx: '128K' },
  { id: 'openai/gpt-4o',                        label: 'GPT-4o',                provider: 'OpenAI',     cost: '$2.5/M',   speed: 'Fast',         ctx: '128K' },
  { id: 'openai/o3-mini',                       label: 'o3 Mini',               provider: 'OpenAI',     cost: '$1.1/M',   speed: 'Medium',       ctx: '200K' },
  { id: 'google/gemini-2.0-flash-exp:free',     label: 'Gemini 2.0 Flash',     provider: 'Google',     cost: 'Free',     speed: 'Fast',         ctx: '1M'   },
  { id: 'google/gemini-2.5-pro-preview',        label: 'Gemini 2.5 Pro',        provider: 'Google',     cost: '$1.25/M',  speed: 'Medium',       ctx: '1M'   },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B',      provider: 'Meta',       cost: 'Free',     speed: 'Fast',         ctx: '128K' },
  { id: 'meta-llama/llama-4-scout:free',        label: 'Llama 4 Scout',         provider: 'Meta',       cost: 'Free',     speed: 'Fast',         ctx: '128K' },
  { id: 'mistralai/mistral-large-2411',         label: 'Mistral Large',         provider: 'Mistral',    cost: '$2/M',     speed: 'Fast',         ctx: '128K' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', label: 'Mistral Small', provider: 'Mistral',  cost: 'Free',     speed: 'Ultra Fast',  ctx: '128K' },
  { id: 'deepseek/deepseek-chat',               label: 'DeepSeek V3',           provider: 'DeepSeek',   cost: '$0.27/M',  speed: 'Fast',         ctx: '64K'  },
  { id: 'deepseek/deepseek-r1:free',            label: 'DeepSeek R1',           provider: 'DeepSeek',   cost: 'Free',     speed: 'Medium',       ctx: '64K'  },
  { id: 'cohere/command-r-plus-08-2024',        label: 'Command R+',            provider: 'Cohere',     cost: '$2.5/M',   speed: 'Fast',         ctx: '128K' },
  { id: 'x-ai/grok-3-mini-beta',               label: 'Grok 3 Mini',           provider: 'xAI',        cost: '$0.3/M',   speed: 'Fast',         ctx: '131K' },
];

const PROVIDERS = ['All', 'Anthropic', 'OpenAI', 'Google', 'Meta', 'Mistral', 'DeepSeek', 'Cohere', 'xAI'];

const PROMPT_TEMPLATES = [
  { label: 'Stream Recap', text: 'Write a concise highlight recap for a live stream about {topic}. Include top moments, viewer engagement, and a call to watch the VOD.' },
  { label: 'Chat Moderation', text: 'You are a live chat moderator. Review this message and decide: allow, timeout (1min), or ban. Explain briefly. Message: "{message}"' },
  { label: 'Caption Enhance', text: 'Improve this auto-generated stream caption for clarity and grammar while keeping it natural: "{caption}"' },
  { label: 'Title Generator', text: 'Generate 5 click-worthy stream titles for a {category} stream about {topic}. Make them engaging without being clickbait.' },
  { label: 'AI Summary', text: 'Summarize the following stream transcript in 3 bullet points, highlighting the most important moments:\n\n{transcript}' },
  { label: 'Code Review', text: 'Review this code and provide concise, actionable feedback on correctness, performance, and readability:\n\n```\n{code}\n```' },
];

const USAGE_KEY = 'swl_openrouter_usage';

function loadUsage() {
  try { return JSON.parse(localStorage.getItem(USAGE_KEY) || '{"total":0,"sessions":[]}'); }
  catch { return { total: 0, sessions: [] }; }
}
function saveUsage(u) {
  try { localStorage.setItem(USAGE_KEY, JSON.stringify(u)); } catch {}
}

function getKey() {
  try { return localStorage.getItem('swl_apikey_openrouter') || ''; } catch { return ''; }
}

const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,168,76,0.22)',
  color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif',
  outline: 'none', boxSizing: 'border-box',
};

export default function OpenRouterHub() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const [providerFilter, setProviderFilter] = useState('All');
  const [selectedModels, setSelectedModels] = useState(['anthropic/claude-haiku-4-5']);
  const [compareMode, setCompareMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant for SeeWhy LIVE creators.');
  const [responses, setResponses] = useState({});
  const [timings, setTimings] = useState({});
  const [loading, setLoading] = useState({});
  const [usage, setUsage] = useState(loadUsage);
  const [showTemplates, setShowTemplates] = useState(false);
  const [tab, setTab] = useState('chat');
  const hasKey = !!getKey();

  const filtered = providerFilter === 'All' ? MODELS : MODELS.filter(m => m.provider === providerFilter);

  function toggleModel(id) {
    if (compareMode) {
      setSelectedModels(prev =>
        prev.includes(id) ? (prev.length > 1 ? prev.filter(m => m !== id) : prev) : [...prev, id].slice(0, 3)
      );
    } else {
      setSelectedModels([id]);
    }
  }

  async function runModel(modelId) {
    if (!prompt.trim()) return;
    const key = getKey();
    if (!key) { toast.error('Add your OpenRouter key in Settings → API Keys.'); return; }

    setLoading(p => ({ ...p, [modelId]: true }));
    setResponses(p => ({ ...p, [modelId]: '' }));
    const start = Date.now();

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'SeeWhy LIVE — OpenRouter Hub',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            ...(systemPrompt.trim() ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          max_tokens: 1500,
          stream: false,
        }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '(no response)';
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      setResponses(p => ({ ...p, [modelId]: text }));
      setTimings(p => ({ ...p, [modelId]: elapsed }));

      const tokens = data.usage?.total_tokens || 0;
      const u = loadUsage();
      u.total += tokens;
      u.sessions = [{ model: modelId, tokens, ts: Date.now() }, ...u.sessions].slice(0, 50);
      saveUsage(u);
      setUsage(u);
    } catch (err) {
      setResponses(p => ({ ...p, [modelId]: `Error: ${err.message}` }));
    } finally {
      setLoading(p => ({ ...p, [modelId]: false }));
    }
  }

  async function runAll() {
    if (!prompt.trim()) { toast.error('Enter a prompt first.'); return; }
    await Promise.all(selectedModels.map(id => runModel(id)));
  }

  function clearAll() {
    setResponses({});
    setTimings({});
    setPrompt('');
  }

  function applyTemplate(t) {
    setPrompt(t.text);
    setShowTemplates(false);
  }

  const model = MODELS.find(m => m.id === selectedModels[0]);

  return (
    <div style={{ minHeight: '100vh', background: BG, ...T, paddingBottom: 40 }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(7,5,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.12)', backdropFilter: 'blur(12px)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
          <Layers style={{ width: 16, height: 16, color: GOLD }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1, ...T }}>OpenRouter Hub</h1>
          <p style={{ fontSize: 11, color: DIM, ...T }}>{MODELS.length} models · compare, test & track usage</p>
        </div>
        {!hasKey && (
          <div style={{ fontSize: 11, color: 'rgba(255,150,80,0.85)', padding: '5px 10px', borderRadius: 7, background: 'rgba(107,31,42,0.15)', border: '1px solid rgba(107,31,42,0.3)', ...T }}>
            No OpenRouter key — Settings → API Keys
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: DIM, ...T }}>Compare mode</span>
          <button onClick={() => setCompareMode(!compareMode)} style={{
            width: 36, height: 20, borderRadius: 10, cursor: 'pointer', position: 'relative', border: 'none',
            background: compareMode ? GOLD : 'rgba(255,255,255,0.1)', transition: 'background 0.2s',
          }}>
            <div style={{ position: 'absolute', top: 2, left: compareMode ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px', display: 'flex', gap: 16 }}>

        {/* Left: Model selector */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Provider filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {PROVIDERS.map(p => (
              <button key={p} onClick={() => setProviderFilter(p)} style={{
                padding: '3px 9px', borderRadius: 20, cursor: 'pointer', fontSize: 10, fontWeight: 700, ...T,
                background: providerFilter === p ? `${GOLD}22` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${providerFilter === p ? GOLD + '55' : 'rgba(255,255,255,0.07)'}`,
                color: providerFilter === p ? GOLD : DIM,
              }}>{p}</button>
            ))}
          </div>

          {/* Model list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            {filtered.map(m => {
              const isSelected = selectedModels.includes(m.id);
              return (
                <button key={m.id} onClick={() => toggleModel(m.id)} style={{
                  padding: '8px 10px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', ...T,
                  background: isSelected ? `${GOLD}16` : 'rgba(13,6,24,0.8)',
                  border: `1px solid ${isSelected ? GOLD + '50' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: isSelected ? GOLD : 'rgba(255,255,255,0.85)', ...T }}>{m.label}</p>
                    {isSelected && <CheckCircle style={{ width: 10, height: 10, color: GOLD, flexShrink: 0 }} />}
                  </div>
                  <p style={{ fontSize: 9, color: DIM, marginTop: 1, ...T }}>{m.provider} · {m.cost} · {m.speed} · ctx {m.ctx}</p>
                </button>
              );
            })}
          </div>

          {/* Usage stats */}
          <div style={{ borderRadius: 10, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Session Usage</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: DIM, ...T }}>Total tokens</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', ...T }}>{usage.total.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: DIM, ...T }}>Requests</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', ...T }}>{usage.sessions.length}</span>
            </div>
          </div>
        </div>

        {/* Right: Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* System prompt */}
          <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: 1, textTransform: 'uppercase', ...T }}>System Prompt</label>
            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={2}
              style={{ ...inp, marginTop: 6, resize: 'vertical' }} />
          </div>

          {/* Prompt area */}
          <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: 1, textTransform: 'uppercase', ...T }}>User Prompt</label>
              <button onClick={() => setShowTemplates(!showTemplates)} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: DIM, cursor: 'pointer', fontSize: 10, fontWeight: 700, ...T }}>
                Templates ▾
              </button>
            </div>
            {showTemplates && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PROMPT_TEMPLATES.map(pt => (
                  <button key={pt.label} onClick={() => applyTemplate(pt)} style={{ padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 10, fontWeight: 700, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD, ...T }}>
                    {pt.label}
                  </button>
                ))}
              </div>
            )}
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
              placeholder="Enter your prompt here…"
              style={{ ...inp, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={runAll} style={{
                flex: 1, padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
                background: `${GOLD}22`, border: `1px solid ${GOLD}55`, color: GOLD,
                fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...T,
              }}>
                <Send style={{ width: 13, height: 13 }} />
                {compareMode ? `Run ${selectedModels.length} Models` : 'Send'}
              </button>
              <button onClick={clearAll} style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: DIM }}>
                <RotateCcw style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          {/* Responses */}
          <div style={{ display: 'grid', gridTemplateColumns: compareMode && selectedModels.length > 1 ? `repeat(${Math.min(selectedModels.length, 2)}, 1fr)` : '1fr', gap: 12 }}>
            {selectedModels.map(modelId => {
              const m = MODELS.find(x => x.id === modelId);
              const resp = responses[modelId];
              const isLoading = loading[modelId];
              const timing = timings[modelId];
              return (
                <div key={modelId} style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: `1px solid ${resp ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.06)'}`, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: GOLD, ...T }}>{m?.label || modelId}</p>
                      <p style={{ fontSize: 9, color: DIM, ...T }}>{m?.provider} · {m?.cost} · ctx {m?.ctx}</p>
                    </div>
                    {timing && <span style={{ fontSize: 10, color: '#6DBF7E', ...T }}>⏱ {timing}s</span>}
                    {resp && (
                      <button onClick={() => navigator.clipboard.writeText(resp).then(() => toast.success('Copied!'))} style={{ padding: '4px 7px', borderRadius: 5, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: DIM, cursor: 'pointer' }}>
                        <Copy style={{ width: 11, height: 11 }} />
                      </button>
                    )}
                  </div>
                  <div style={{ padding: 12, minHeight: 80 }}>
                    {isLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: DIM, fontSize: 12, ...T }}>
                        <div style={{ width: 14, height: 14, border: '2px solid rgba(201,168,76,0.2)', borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Generating…
                      </div>
                    ) : resp ? (
                      <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>{resp}</pre>
                    ) : (
                      <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, ...T }}>Response will appear here…</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}