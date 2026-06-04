import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BG     = '#080B18';
const BG2    = 'rgba(13,6,24,0.9)';
const GOLD   = '#D4AF37';
const CRIMSON = '#800020';
const CYAN   = '#00d4ff';
const PURPLE = '#a78bfa';
const GREEN  = '#22c55e';
const T      = { fontFamily: 'Barlow Condensed, sans-serif' };
const OCT    = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

// ── Generation steps ──────────────────────────────────────────────────────────
const GEN_STEPS = ['Reading sources…', 'Drafting outline…', 'Writing dialogue…', 'Polishing script…'];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          style={{
            position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(13,6,24,0.97)', border: `1px solid ${GOLD}55`,
            borderRadius: 12, padding: '12px 22px',
            color: '#fff', fontSize: 14, ...T,
            fontWeight: 700, letterSpacing: '0.04em',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${GOLD}18`,
            zIndex: 9999, whiteSpace: 'nowrap',
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────
function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...T, fontSize: 13, fontWeight: 800, letterSpacing: '0.05em',
        padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
        background: active ? GOLD : 'rgba(255,255,255,0.06)',
        color: active ? '#000' : 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', transition: 'all 0.18s',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

// ── Octagonal panel slot ──────────────────────────────────────────────────────
function PanelSlot({ name, emoji, borderColor, onInvite }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 80, height: 80, clipPath: OCT,
        background: `${borderColor}20`, border: `2px solid ${borderColor}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, cursor: 'default',
      }}>
        {emoji}
      </div>
      <span style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{name}</span>
      <button
        onClick={onInvite}
        style={{
          ...T, fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999,
          background: `${borderColor}15`, border: `1px solid ${borderColor}40`,
          color: borderColor, cursor: 'pointer', letterSpacing: '0.05em',
        }}
      >
        Invite
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PodcastStudio() {
  const [tab, setTab] = useState('create');
  const [sources, setSources] = useState([]);
  const [addingSource, setAddingSource] = useState(false);
  const [sourceInput, setSourceInput] = useState('');
  const [sourceType, setSourceType] = useState('text');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [hostName, setHostName] = useState('SwanyThree');
  const [cohostName, setCohostName] = useState('ARIA');
  const [duration, setDuration] = useState('15min');
  const [tone, setTone] = useState('Casual');
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState('');
  const [script, setScript] = useState(null);
  const [library, setLibrary] = useState(() => JSON.parse(localStorage.getItem('podcast_library') || '[]'));
  const [editingIdx, setEditingIdx] = useState(null);
  const [toast, setToast] = useState('');
  const [panelSegIdx, setPanelSegIdx] = useState(0);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function addSource() {
    if (!sourceInput.trim()) return;
    if (sources.length >= 5) { showToast('Maximum 5 sources'); return; }
    const label = sourceInput.slice(0, 30);
    setSources(prev => [...prev, { type: sourceType, label, content: sourceInput }]);
    setSourceInput('');
    setAddingSource(false);
  }

  function removeSource(idx) {
    setSources(prev => prev.filter((_, i) => i !== idx));
  }

  function sourceEmoji(type) {
    if (type === 'url') return '🔗';
    if (type === 'note') return '📝';
    return '📄';
  }

  async function generateScript() {
    setGenerating(true);
    for (let i = 0; i < GEN_STEPS.length; i++) {
      setGenStep(GEN_STEPS[i]);
      await new Promise(r => setTimeout(r, 900));
    }
    try {
      const srcText = sources.length
        ? sources.map(s => `[${s.label}]: ${s.content}`).join('\n---\n')
        : 'No sources provided — generate based on topic only.';
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a podcast script writer for SeeWhy LIVE, a live streaming platform. Write a ${duration} podcast script between ${hostName} (host) and ${cohostName} (co-host/AI) about: "${topic || 'live streaming, creator economy, and community building'}". Sources: ${srcText}. Tone: ${tone}. The script should feel like a real conversation about the topic, with the hosts reacting to each other naturally.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            episode: { type: 'number' },
            intro: { type: 'string' },
            segments: {
              type: 'array', items: {
                type: 'object', properties: {
                  title: { type: 'string' },
                  host_line: { type: 'string' },
                  cohost_line: { type: 'string' },
                  host_response: { type: 'string' },
                }, required: ['title', 'host_line', 'cohost_line']
              }
            },
            outro: { type: 'string' },
            key_topics: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      const ep = { ...result, title: episodeTitle || result.title, generatedAt: new Date().toISOString(), duration, tone };
      setScript(ep);
      const newLib = [ep, ...library].slice(0, 20);
      setLibrary(newLib);
      localStorage.setItem('podcast_library', JSON.stringify(newLib));
      setTab('script');
    } catch (e) {
      const fallback = {
        title: episodeTitle || 'Episode: ' + topic,
        episode: library.length + 1,
        intro: `Welcome to SeeWhy LIVE! I'm ${hostName}, joined by ${cohostName}. Today we're diving into: ${topic || 'the world of live streaming'}.`,
        segments: [
          { title: 'Getting Started', host_line: `So ${cohostName}, what do you think is the biggest opportunity for creators right now?`, cohost_line: `Honestly? Community. Creators who build real community on platforms like Fanbase and SeeWhy LIVE are winning every time.`, host_response: `100%. And with tools like AI co-hosting and watch parties, creators can scale that community like never before.` },
          { title: 'Key Insights', host_line: `Let's talk about the tech side. What tools are making the biggest difference?`, cohost_line: `Real-time AI, 20-person panels, multi-platform streaming — it's all converging right now.`, host_response: `And our audience can experience all of that right here, live.` },
        ],
        outro: `That's a wrap on today's episode! Thanks for listening and keep building your community.`,
        key_topics: ['live streaming', 'creator economy', 'AI tools', 'community building'],
        generatedAt: new Date().toISOString(), duration, tone,
      };
      setScript(fallback);
      const newLib = [fallback, ...library].slice(0, 20);
      setLibrary(newLib);
      localStorage.setItem('podcast_library', JSON.stringify(newLib));
      setTab('script');
    }
    setGenerating(false);
  }

  function copyTranscript() {
    if (!script) return;
    let text = `${script.title}\n\n`;
    text += `INTRO:\n${script.intro}\n\n`;
    (script.segments || []).forEach(seg => {
      text += `--- ${seg.title} ---\n`;
      text += `${hostName}: ${seg.host_line}\n`;
      text += `${cohostName}: ${seg.cohost_line}\n`;
      if (seg.host_response) text += `${hostName}: ${seg.host_response}\n`;
      text += '\n';
    });
    text += `OUTRO:\n${script.outro}`;
    navigator.clipboard.writeText(text).then(() => showToast('Transcript copied!')).catch(() => showToast('Copy failed'));
  }

  function loadFromLibrary(ep) {
    setScript(ep);
    setTab('script');
  }

  function deleteEpisode(idx) {
    const newLib = library.filter((_, i) => i !== idx);
    setLibrary(newLib);
    localStorage.setItem('podcast_library', JSON.stringify(newLib));
    setDeleteConfirmIdx(null);
    showToast('Episode deleted');
  }

  // DJ track for panel tab
  let djTrack = null;
  try { djTrack = JSON.parse(localStorage.getItem('seewhy_dj_track') || 'null'); } catch {}

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '10px 14px',
    color: '#fff', fontSize: 14, ...T, fontWeight: 600,
    outline: 'none',
  };

  const selectStyle = { ...inputStyle };

  return (
    <div style={{ minHeight: '100vh', background: BG, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '28px 16px 16px' }}>
        <h1 style={{ ...T, fontSize: 30, fontWeight: 900, color: GOLD, letterSpacing: '0.04em', margin: 0 }}>
          🎙️ Podcast Studio
        </h1>
        <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>
          AI-powered podcast creation · NotebookLM-style
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 8, padding: '0 16px 16px', overflowX: 'auto',
        scrollbarWidth: 'none', justifyContent: 'center',
      }}>
        <TabBtn label="Create" active={tab === 'create'} onClick={() => setTab('create')} />
        <TabBtn label="Script" active={tab === 'script'} onClick={() => setTab('script')} />
        <TabBtn label="Panel Record" active={tab === 'record'} onClick={() => setTab('record')} />
        <TabBtn label="Library" active={tab === 'library'} onClick={() => setTab('library')} />
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Tab: Create ── */}
        {tab === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Sources section */}
            <div style={{
              background: BG2, border: '1px solid rgba(212,175,55,0.12)',
              borderLeft: `3px solid ${CYAN}`, borderRadius: 16, padding: '20px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <p style={{ ...T, fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>Sources</p>
                  <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
                    {sources.length}/5 added
                  </p>
                </div>
                {!addingSource && sources.length < 5 && (
                  <button
                    onClick={() => setAddingSource(true)}
                    style={{
                      ...T, fontSize: 13, fontWeight: 800, padding: '7px 16px', borderRadius: 999,
                      background: 'transparent', border: `1px solid ${CYAN}60`, color: CYAN, cursor: 'pointer',
                    }}
                  >
                    + Add Source
                  </button>
                )}
              </div>

              {/* Add source form */}
              {addingSource && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 14 }}>
                  <select
                    value={sourceType}
                    onChange={e => setSourceType(e.target.value)}
                    style={{ ...selectStyle, marginBottom: 8 }}
                  >
                    <option value="text">📄 Text</option>
                    <option value="url">🔗 URL</option>
                    <option value="note">📝 Note</option>
                  </select>
                  <textarea
                    value={sourceInput}
                    onChange={e => setSourceInput(e.target.value)}
                    placeholder={sourceType === 'url' ? 'Paste a URL…' : 'Paste or type source content…'}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={addSource}
                      style={{
                        ...T, fontSize: 13, fontWeight: 800, padding: '8px 20px', borderRadius: 10,
                        background: CYAN, color: '#000', border: 'none', cursor: 'pointer',
                      }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setAddingSource(false); setSourceInput(''); }}
                      style={{
                        ...T, fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Source chips */}
              {sources.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {sources.map((src, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 999,
                      background: `${CYAN}12`, border: `1px solid ${CYAN}30`,
                    }}>
                      <span>{sourceEmoji(src.type)}</span>
                      <span style={{ ...T, fontSize: 12, color: CYAN, fontWeight: 700 }}>
                        {src.label.length > 30 ? src.label.slice(0, 30) + '…' : src.label}
                      </span>
                      <button
                        onClick={() => removeSource(i)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {sources.length === 0 && !addingSource && (
                <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', margin: 0 }}>
                  No sources added — AI will generate from topic only
                </p>
              )}
            </div>

            {/* Episode config */}
            <div style={{
              background: BG2, border: '1px solid rgba(212,175,55,0.12)',
              borderLeft: `3px solid ${GOLD}`, borderRadius: 16, padding: '20px 18px',
            }}>
              <p style={{ ...T, fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 16 }}>Episode Config</p>

              <label style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Episode Title
              </label>
              <input
                type="text"
                value={episodeTitle}
                onChange={e => setEpisodeTitle(e.target.value)}
                placeholder="Untitled Episode"
                style={{ ...inputStyle, marginTop: 6, marginBottom: 14 }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Host Name
                  </label>
                  <input
                    type="text"
                    value={hostName}
                    onChange={e => setHostName(e.target.value)}
                    style={{ ...inputStyle, marginTop: 6 }}
                  />
                </div>
                <div>
                  <label style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Co-host Name
                  </label>
                  <input
                    type="text"
                    value={cohostName}
                    onChange={e => setCohostName(e.target.value)}
                    style={{ ...inputStyle, marginTop: 6 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Duration
                  </label>
                  <select value={duration} onChange={e => setDuration(e.target.value)} style={{ ...selectStyle, marginTop: 6 }}>
                    <option value="5min">5 min</option>
                    <option value="15min">15 min</option>
                    <option value="30min">30 min</option>
                    <option value="60min">60 min</option>
                  </select>
                </div>
                <div>
                  <label style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Tone
                  </label>
                  <select value={tone} onChange={e => setTone(e.target.value)} style={{ ...selectStyle, marginTop: 6 }}>
                    <option value="Casual">Casual</option>
                    <option value="Professional">Professional</option>
                    <option value="Educational">Educational</option>
                    <option value="Entertaining">Entertaining</option>
                  </select>
                </div>
              </div>

              <label style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                What's this episode about?
              </label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="E.g. 'How Fanbase is changing creator monetization' or 'Tips for going live on multiple platforms at once'"
                rows={4}
                style={{ ...inputStyle, marginTop: 6, marginBottom: 16, resize: 'vertical' }}
              />

              <motion.button
                whileTap={{ scale: topic || generating ? 0.97 : 1 }}
                disabled={!topic || generating}
                onClick={generateScript}
                style={{
                  ...T, width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: (!topic || generating) ? 'not-allowed' : 'pointer',
                  background: (!topic || generating)
                    ? 'rgba(212,175,55,0.15)'
                    : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`,
                  color: (!topic || generating) ? 'rgba(255,255,255,0.35)' : '#000',
                  fontSize: 16, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase',
                }}
              >
                {generating ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{
                      width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: GOLD,
                      borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite',
                    }} />
                    {genStep}
                  </span>
                ) : 'Generate Podcast Script →'}
              </motion.button>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          </div>
        )}

        {/* ── Tab: Script ── */}
        {tab === 'script' && (
          <div>
            {!script ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                background: BG2, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🎙️</p>
                <p style={{ ...T, fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
                  No script yet — create one first
                </p>
                <button
                  onClick={() => setTab('create')}
                  style={{
                    ...T, marginTop: 16, padding: '10px 24px', borderRadius: 10,
                    background: GOLD, color: '#000', fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer',
                  }}
                >
                  Go to Create Tab
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 80 }}>

                {/* Key topics */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                  {(script.key_topics || []).map(t => (
                    <span key={t} style={{
                      ...T, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999, flexShrink: 0,
                      background: `${CYAN}15`, border: `1px solid ${CYAN}40`, color: CYAN,
                    }}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <div>
                  <p style={{ ...T, fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>{script.title}</p>
                  <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                    Ep. {script.episode || 1} · {script.duration} · {script.tone}
                  </p>
                </div>

                {/* Intro */}
                <div style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <p style={{ ...T, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Intro</p>
                  <p style={{ ...T, fontSize: 14, color: '#fff', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                    {script.intro}
                  </p>
                </div>

                {/* Segments */}
                {(script.segments || []).map((seg, i) => (
                  <div key={i} style={{
                    background: BG2, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', padding: '14px 16px',
                  }}>
                    <p style={{ ...T, fontSize: 11, fontWeight: 900, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                      {seg.title}
                    </p>

                    {/* Host line */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, justifyContent: 'flex-end' }}>
                      <div style={{
                        flex: 1, padding: '10px 14px', borderRadius: '12px 12px 4px 12px', maxWidth: '85%',
                        background: `${GOLD}15`, border: `1px solid ${GOLD}30`,
                      }}>
                        <p style={{ ...T, fontSize: 12, fontWeight: 800, color: GOLD, marginBottom: 4 }}>{hostName}</p>
                        <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0 }}>{seg.host_line}</p>
                      </div>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: GOLD, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        ...T, fontSize: 14, fontWeight: 900, color: '#000',
                      }}>
                        {hostName.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Co-host line */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: seg.host_response ? 10 : 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: PURPLE, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        ...T, fontSize: 14, fontWeight: 900, color: '#fff',
                      }}>
                        {cohostName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{
                        flex: 1, padding: '10px 14px', borderRadius: '12px 12px 12px 4px', maxWidth: '85%',
                        background: `${PURPLE}15`, border: `1px solid ${PURPLE}30`,
                      }}>
                        <p style={{ ...T, fontSize: 12, fontWeight: 800, color: PURPLE, marginBottom: 4 }}>{cohostName}</p>
                        <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0 }}>{seg.cohost_line}</p>
                      </div>
                    </div>

                    {/* Host response */}
                    {seg.host_response && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, justifyContent: 'flex-end' }}>
                        <div style={{
                          flex: 1, padding: '10px 14px', borderRadius: '12px 12px 4px 12px', maxWidth: '85%',
                          background: `${GOLD}12`, border: `1px solid ${GOLD}25`,
                        }}>
                          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0 }}>{seg.host_response}</p>
                        </div>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: GOLD, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          ...T, fontSize: 14, fontWeight: 900, color: '#000',
                        }}>
                          {hostName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Outro */}
                <div style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <p style={{ ...T, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Outro</p>
                  <p style={{ ...T, fontSize: 14, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                    {script.outro}
                  </p>
                </div>

                {/* Sticky action bar */}
                <div style={{
                  position: 'sticky', bottom: 80, left: 0, right: 0,
                  display: 'flex', gap: 10, padding: '12px 0',
                  background: BG,
                }}>
                  <button
                    onClick={() => setTab('record')}
                    style={{
                      ...T, flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, color: '#000',
                      fontSize: 14, fontWeight: 900, letterSpacing: '0.06em',
                    }}
                  >
                    🎙️ Record with Panel
                  </button>
                  <button
                    onClick={copyTranscript}
                    style={{
                      ...T, flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 800,
                    }}
                  >
                    📋 Copy Transcript
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Panel Record ── */}
        {tab === 'record' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Panel slots */}
            <div style={{
              background: BG2, border: '1px solid rgba(212,175,55,0.12)',
              borderLeft: `3px solid ${GOLD}`, borderRadius: 16, padding: '20px 18px',
            }}>
              <p style={{ ...T, fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 16 }}>Panel Setup</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, justifyItems: 'center' }}>
                <PanelSlot name={hostName} emoji="👑" borderColor={GOLD} onInvite={() => showToast('Host slot is always yours')} />
                <PanelSlot name={cohostName} emoji="🤖" borderColor={PURPLE} onInvite={() => showToast('ARIA is your AI co-host')} />
                <PanelSlot name="Guest 1" emoji="🎤" borderColor="rgba(255,255,255,0.5)" onInvite={() => showToast('Send invite link to guest')} />
                <PanelSlot name="Guest 2" emoji="🎤" borderColor="rgba(255,255,255,0.5)" onInvite={() => showToast('Send invite link to guest')} />
              </div>
            </div>

            {/* Script reader */}
            <div style={{
              background: BG2, border: '1px solid rgba(212,175,55,0.12)',
              borderLeft: `3px solid ${CYAN}`, borderRadius: 16, padding: '20px 18px',
            }}>
              <p style={{ ...T, fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Script Reader</p>
              {script && script.segments && script.segments.length > 0 ? (
                <div>
                  <div style={{
                    padding: '14px 16px', borderRadius: 12, marginBottom: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    minHeight: 100,
                  }}>
                    <p style={{ ...T, fontSize: 11, fontWeight: 900, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                      {script.segments[panelSegIdx]?.title}
                    </p>
                    <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
                      <strong style={{ color: GOLD }}>{hostName}:</strong> {script.segments[panelSegIdx]?.host_line}
                    </p>
                    <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginTop: 8 }}>
                      <strong style={{ color: PURPLE }}>{cohostName}:</strong> {script.segments[panelSegIdx]?.cohost_line}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
                    <button
                      disabled={panelSegIdx === 0}
                      onClick={() => setPanelSegIdx(i => Math.max(0, i - 1))}
                      style={{
                        ...T, padding: '8px 20px', borderRadius: 10, border: 'none', cursor: panelSegIdx === 0 ? 'not-allowed' : 'pointer',
                        background: panelSegIdx === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                        color: panelSegIdx === 0 ? 'rgba(255,255,255,0.2)' : '#fff', fontWeight: 800, fontSize: 13,
                      }}
                    >
                      ← Prev
                    </button>
                    <span style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {panelSegIdx + 1} / {script.segments.length}
                    </span>
                    <button
                      disabled={panelSegIdx === script.segments.length - 1}
                      onClick={() => setPanelSegIdx(i => Math.min(script.segments.length - 1, i + 1))}
                      style={{
                        ...T, padding: '8px 20px', borderRadius: 10, border: 'none',
                        cursor: panelSegIdx === script.segments.length - 1 ? 'not-allowed' : 'pointer',
                        background: panelSegIdx === script.segments.length - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                        color: panelSegIdx === script.segments.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff', fontWeight: 800, fontSize: 13,
                      }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                  Generate a script first to use the Script Reader
                </p>
              )}
            </div>

            {/* CTA buttons */}
            <Link to="/WatchParty" style={{ textDecoration: 'none', display: 'block' }}>
              <motion.div whileTap={{ scale: 0.97 }} style={{
                ...T, padding: '14px 0', borderRadius: 12, textAlign: 'center',
                background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`,
                color: '#000', fontSize: 15, fontWeight: 900, letterSpacing: '0.07em',
                cursor: 'pointer',
              }}>
                🔴 Go Live with Panel →
              </motion.div>
            </Link>
            <Link to="/BroadcastStudio" style={{ textDecoration: 'none', display: 'block' }}>
              <motion.div whileTap={{ scale: 0.97 }} style={{
                ...T, padding: '13px 0', borderRadius: 12, textAlign: 'center',
                background: `${PURPLE}15`, border: `1px solid ${PURPLE}40`,
                color: PURPLE, fontSize: 14, fontWeight: 900, letterSpacing: '0.07em',
                cursor: 'pointer',
              }}>
                🎬 Full 20-Person Panel →
              </motion.div>
            </Link>

            {/* AI Music bar */}
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: djTrack ? `${CYAN}10` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${djTrack ? CYAN + '30' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>🎵</span>
              {djTrack ? (
                <span style={{ ...T, fontSize: 13, fontWeight: 700, color: CYAN, flex: 1 }}>
                  Now playing: {djTrack.emoji || ''} {djTrack.title}
                  {djTrack.bpm && <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginLeft: 8 }}>{djTrack.bpm} BPM</span>}
                </span>
              ) : (
                <Link to="/AIMusic" style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textDecoration: 'none' }}>
                  No background music set — Open Music Studio
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Library ── */}
        {tab === 'library' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {library.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                background: BG2, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>📚</p>
                <p style={{ ...T, fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                  No episodes yet — create your first podcast!
                </p>
                <button
                  onClick={() => setTab('create')}
                  style={{
                    ...T, marginTop: 16, padding: '10px 24px', borderRadius: 10,
                    background: GOLD, color: '#000', fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer',
                  }}
                >
                  Create Episode
                </button>
              </div>
            ) : (
              library.map((ep, i) => (
                <div key={i} style={{
                  background: BG2, border: '1px solid rgba(212,175,55,0.12)',
                  borderLeft: `3px solid ${GOLD}`, borderRadius: 16, padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <p style={{ ...T, fontSize: 16, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>
                      {ep.title}
                    </p>
                    <span style={{
                      ...T, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, flexShrink: 0,
                      background: `${GOLD}15`, border: `1px solid ${GOLD}40`, color: GOLD,
                    }}>
                      Ep. {ep.episode || i + 1}
                    </span>
                  </div>

                  <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
                    {ep.generatedAt ? new Date(ep.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {ep.duration && (
                      <span style={{ ...T, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                        {ep.duration}
                      </span>
                    )}
                    {ep.tone && (
                      <span style={{ ...T, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                        {ep.tone}
                      </span>
                    )}
                  </div>

                  {(ep.key_topics || []).slice(0, 3).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {(ep.key_topics || []).slice(0, 3).map(t => (
                        <span key={t} style={{ ...T, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: `${CYAN}12`, border: `1px solid ${CYAN}30`, color: CYAN }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => loadFromLibrary(ep)}
                      style={{
                        ...T, flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: GOLD, color: '#000', fontSize: 13, fontWeight: 900,
                      }}
                    >
                      View Script
                    </button>
                    {deleteConfirmIdx === i ? (
                      <>
                        <button
                          onClick={() => deleteEpisode(i)}
                          style={{
                            ...T, padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 900,
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmIdx(null)}
                          style={{
                            ...T, padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 800,
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmIdx(i)}
                        style={{
                          ...T, padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                          color: '#ef4444', fontSize: 13, fontWeight: 800,
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Toast message={toast} />
    </div>
  );
}
