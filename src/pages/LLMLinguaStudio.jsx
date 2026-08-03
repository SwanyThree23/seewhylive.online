import React, { useState, useCallback } from 'react';
import {
  Minimize2, Copy, Download, RefreshCw, BarChart2, Zap,
  ChevronDown, Info, Layers, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useOpenRouter } from '../hooks/useOpenRouter';

const BG   = '#07050A';
const GOLD = '#C9A84C';
const BURG = '#6B1F2A';
const DIM  = 'rgba(255,255,255,0.45)';
const T    = { fontFamily: 'Barlow Condensed, sans-serif' };

const COMPRESSION_PRESETS = [
  { id: 'light',    label: 'Light (80%)',    ratio: 0.80, desc: 'Preserve most content, minimal compression' },
  { id: 'balanced', label: 'Balanced (60%)', ratio: 0.60, desc: 'Good for most use cases' },
  { id: 'heavy',    label: 'Heavy (40%)',    ratio: 0.40, desc: 'Aggressive — best for very long texts' },
  { id: 'extreme',  label: 'Extreme (20%)',  ratio: 0.20, desc: 'Maximum compression, key info only' },
];

const COMPRESSION_MODES = [
  { id: 'semantic',  label: 'Semantic',  desc: 'Remove redundant meaning, preserve key concepts' },
  { id: 'extractive', label: 'Extractive', desc: 'Keep the most informative sentences verbatim' },
  { id: 'summary',   label: 'Summary',   desc: 'Rewrite as concise structured summary' },
  { id: 'keywords',  label: 'Keywords',  desc: 'Extract key terms and entities only' },
];

const EXAMPLE_TEXTS = [
  {
    label: 'Stream Chat Log',
    text: `[10:32:05] viewer123: hey! great stream today, really loving the content you've been putting out lately
[10:32:07] StreamerBot: Welcome viewer123!
[10:32:10] another_user: yeah this is awesome, been watching for like 3 hours straight
[10:32:15] viewer123: can you do that trick again? that was so cool when you did it earlier
[10:32:18] chat_fan: omg yes that was amazing, I literally screamed when that happened
[10:32:20] newwatcher99: just found this channel, how long have you been streaming?
[10:32:25] regular_viewer: 5 years! they're one of the best creators out there no cap
[10:32:28] viewer123: the sound design on this stream is top tier btw
[10:32:30] another_user: agreed, the production quality is insane
[10:32:35] newwatcher99: wow ok following immediately, this is quality content`,
  },
  {
    label: 'Meeting Transcript',
    text: `Good morning everyone, I hope you're all doing well. Let me start by saying thank you for joining this meeting today. We have a lot to cover so I'll try to be as concise as possible.

The first item on our agenda today is the quarterly performance review. As you can see from the numbers that were shared earlier this week, our total revenue for the quarter came in at approximately $2.3 million, which represents a 12% increase compared to the same period last year. This is very encouraging news and I think it reflects the hard work that the entire team has been putting in.

Moving on to the second point, I wanted to discuss the new product launch that's scheduled for next month. We've been working on this for about 8 months now and the team has done an absolutely fantastic job. The product has been through multiple rounds of testing and we're confident that it's ready for the market.`,
  },
  {
    label: 'AI Prompt (Long)',
    text: `You are a highly experienced and knowledgeable AI assistant with expertise in a wide variety of domains including but not limited to technology, science, mathematics, history, literature, philosophy, arts, and business. You have been trained on vast amounts of data and are capable of understanding complex nuanced questions and providing detailed, accurate, and helpful responses. When responding to questions, please make sure to be thorough and comprehensive while also being clear and easy to understand. If you don't know something, please say so honestly rather than making up information. Please also consider the context and intent behind the question to provide the most relevant and useful answer possible.

Given all of the above instructions and guidelines, I would now like you to help me with the following specific task that I need assistance with today.`,
  },
];

function countTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);
}

function estimateCost(tokens, model = 'claude-haiku') {
  const rates = { 'claude-haiku': 0.00025, 'claude-sonnet': 0.003, 'gpt-4o-mini': 0.00015, 'gpt-4o': 0.0025 };
  const rate = rates[model] || 0.001;
  return ((tokens / 1000) * rate).toFixed(4);
}

const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,168,76,0.22)',
  color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif',
  outline: 'none', boxSizing: 'border-box',
};

export default function LLMLinguaStudio() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { invoke: invokeAI } = useOpenRouter();

  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [preset, setPreset] = useState('balanced');
  const [mode, setMode] = useState('semantic');
  const [instructions, setInstructions] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  const inputTokens = countTokens(inputText);
  const outputTokens = countTokens(outputText);
  const selectedPreset = COMPRESSION_PRESETS.find(p => p.id === preset);
  const selectedMode = COMPRESSION_MODES.find(m => m.id === mode);

  async function compress() {
    if (!inputText.trim()) { toast.error('Enter text to compress.'); return; }
    setCompressing(true);
    setOutputText('');
    setStats(null);
    const start = Date.now();

    const ratioLabel = selectedPreset ? `${Math.round(selectedPreset.ratio * 100)}% of original length` : '60% of original length';
    const modeDesc = selectedMode?.desc || 'Semantic compression';

    const systemPrompt = `You are a text compression specialist using LLMLingua techniques.
Your job: compress the given text to approximately ${ratioLabel}.
Compression method: ${modeDesc}.
Rules:
- Preserve all factual information and key concepts
- Remove filler words, redundancy, and verbose phrasing
- Maintain the logical flow and structure
- Return ONLY the compressed text, no explanations
${instructions ? `Additional instructions: ${instructions}` : ''}`;

    try {
      const result = await invokeAI({
        prompt: `Compress this text:\n\n${inputText}`,
        systemPrompt,
        maxTokens: Math.max(500, Math.ceil(inputTokens * (selectedPreset?.ratio || 0.6))),
      });
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      setOutputText(result.trim());
      const outTokens = countTokens(result.trim());
      const compressionRatio = ((1 - outTokens / inputTokens) * 100).toFixed(1);
      setStats({
        inputTokens,
        outputTokens: outTokens,
        compressionRatio,
        elapsed,
        savedTokens: inputTokens - outTokens,
        estimatedSavings: estimateCost(inputTokens - outTokens),
      });
      setHistory(prev => [{ input: inputText.slice(0, 100) + '…', output: result.slice(0, 100) + '…', ratio: compressionRatio, ts: Date.now() }, ...prev].slice(0, 5));
      toast.success(`Compressed! Saved ${compressionRatio}% of tokens.`);
    } catch (err) {
      toast.error('Compression failed — check your OpenRouter key.');
    } finally {
      setCompressing(false);
    }
  }

  function copyOutput() {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText).then(() => toast.success('Copied!')).catch(() => {});
  }

  function downloadOutput() {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compressed.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function applyExample(ex) {
    setInputText(ex.text);
    setOutputText('');
    setStats(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, ...T, paddingBottom: 40 }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(7,5,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.12)', backdropFilter: 'blur(12px)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
          <Minimize2 style={{ width: 16, height: 16, color: GOLD }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1, ...T }}>LLMLingua Studio</h1>
          <p style={{ fontSize: 11, color: DIM, ...T }}>AI-powered prompt & text compression · reduce token costs up to 80%</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px', display: 'flex', gap: 16 }}>

        {/* Left: Controls */}
        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Compression preset */}
          <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Compression Level</p>
            {COMPRESSION_PRESETS.map(p => (
              <button key={p.id} onClick={() => setPreset(p.id)} style={{
                width: '100%', padding: '8px 10px', borderRadius: 8, textAlign: 'left', cursor: 'pointer', marginBottom: 4, ...T,
                background: preset === p.id ? `${GOLD}18` : 'rgba(0,0,0,0.2)',
                border: `1px solid ${preset === p.id ? GOLD + '50' : 'rgba(255,255,255,0.04)'}`,
              }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: preset === p.id ? GOLD : 'rgba(255,255,255,0.8)', ...T }}>{p.label}</p>
                <p style={{ fontSize: 9, color: DIM, marginTop: 1, ...T }}>{p.desc}</p>
              </button>
            ))}
          </div>

          {/* Mode */}
          <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Method</p>
            {COMPRESSION_MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                width: '100%', padding: '7px 10px', borderRadius: 8, textAlign: 'left', cursor: 'pointer', marginBottom: 4, ...T,
                background: mode === m.id ? `${GOLD}18` : 'rgba(0,0,0,0.2)',
                border: `1px solid ${mode === m.id ? GOLD + '50' : 'rgba(255,255,255,0.04)'}`,
              }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: mode === m.id ? GOLD : 'rgba(255,255,255,0.8)', ...T }}>{m.label}</p>
                <p style={{ fontSize: 9, color: DIM, marginTop: 1, ...T }}>{m.desc}</p>
              </button>
            ))}
          </div>

          {/* Examples */}
          <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Examples</p>
            {EXAMPLE_TEXTS.map(ex => (
              <button key={ex.label} onClick={() => applyExample(ex)} style={{
                width: '100%', padding: '7px 10px', borderRadius: 8, textAlign: 'left', cursor: 'pointer', marginBottom: 4,
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, ...T,
              }}>{ex.label}</button>
            ))}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Recent</p>
              {history.map((h, i) => (
                <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 9, color: DIM, ...T }}>
                  <span style={{ color: '#6DBF7E', fontWeight: 800 }}>-{h.ratio}%</span> · {h.input.slice(0, 40)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Token stats bar */}
          {(inputText || outputText) && (
            <div style={{ borderRadius: 10, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Input Tokens', val: inputTokens.toLocaleString(), color: GOLD },
                { label: 'Output Tokens', val: outputTokens.toLocaleString(), color: '#6DBF7E' },
                stats && { label: 'Saved', val: `${stats.compressionRatio}%`, color: '#6DBF7E' },
                stats && { label: 'Tokens Saved', val: stats.savedTokens.toLocaleString(), color: '#6DBF7E' },
                stats && { label: 'Est. Cost Saved', val: `$${stats.estimatedSavings}`, color: GOLD },
                stats && { label: 'Time', val: `${stats.elapsed}s`, color: DIM },
              ].filter(Boolean).map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: 9, color: DIM, ...T, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 900, color: s.color, ...T }}>{s.val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Input / Output */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
            {/* Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, ...T, letterSpacing: 1, textTransform: 'uppercase' }}>Input Text</p>
                <span style={{ fontSize: 10, color: DIM, ...T }}>{inputTokens} tokens</span>
              </div>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Paste any text, prompt, transcript, or document to compress…"
                style={{ ...inp, minHeight: 400, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {/* Output */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6DBF7E', ...T, letterSpacing: 1, textTransform: 'uppercase' }}>Compressed Output</p>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {outputText && <span style={{ fontSize: 10, color: '#6DBF7E', ...T }}>{outputTokens} tokens</span>}
                  {outputText && (
                    <>
                      <button onClick={copyOutput} style={{ padding: '3px 7px', borderRadius: 5, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: DIM, cursor: 'pointer' }}>
                        <Copy style={{ width: 11, height: 11 }} />
                      </button>
                      <button onClick={downloadOutput} style={{ padding: '3px 7px', borderRadius: 5, background: `${GOLD}15`, border: `1px solid ${GOLD}35`, color: GOLD, cursor: 'pointer' }}>
                        <Download style={{ width: 11, height: 11 }} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div style={{ ...inp, minHeight: 400, padding: 12, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: outputText ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.18)', fontSize: 13, position: 'relative' }}>
                {compressing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: DIM, fontSize: 12, ...T, padding: 8 }}>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(201,168,76,0.2)', borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Compressing with AI…
                  </div>
                ) : outputText || 'Compressed text will appear here…'}
              </div>
            </div>
          </div>

          {/* Additional instructions */}
          <div>
            <label style={{ fontSize: 10, color: DIM, ...T }}>Additional Instructions (optional)</label>
            <input value={instructions} onChange={e => setInstructions(e.target.value)}
              placeholder="e.g., preserve all numbers, keep technical terms, focus on action items"
              style={{ ...inp, marginTop: 4 }} />
          </div>

          {/* Compress button */}
          <button onClick={compress} disabled={compressing || !inputText.trim()} style={{
            padding: '12px 20px', borderRadius: 10, cursor: compressing ? 'not-allowed' : 'pointer',
            background: compressing ? 'rgba(201,168,76,0.06)' : `${GOLD}22`,
            border: `1px solid ${compressing ? 'rgba(201,168,76,0.12)' : GOLD + '55'}`,
            color: compressing ? DIM : GOLD,
            fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...T,
          }}>
            {compressing
              ? <><RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Compressing…</>
              : <><Minimize2 style={{ width: 14, height: 14 }} /> Compress ({selectedPreset?.label})</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}