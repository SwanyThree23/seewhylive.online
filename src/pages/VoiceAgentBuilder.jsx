import React, { useState, useRef, useCallback } from 'react';
import { Mic, Play, Square, Volume2, Save, Plus, Trash2, ChevronDown, ChevronUp, Zap, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BG   = '#07050A';
const GOLD = '#C9A84C';
const BURG = '#6B1F2A';
const DIM  = 'rgba(255,255,255,0.45)';
const T    = { fontFamily: 'Barlow Condensed, sans-serif' };

const EL_VOICES = [
  { id: 'rachel',    label: 'Rachel',    desc: 'Calm, professional' },
  { id: 'domi',     label: 'Domi',      desc: 'Strong, confident' },
  { id: 'bella',    label: 'Bella',     desc: 'Soft, warm' },
  { id: 'Antoni',   label: 'Antoni',    desc: 'Well-rounded male' },
  { id: 'elli',     label: 'Elli',      desc: 'Emotional, relatable' },
  { id: 'josh',     label: 'Josh',      desc: 'Deep, trustworthy' },
  { id: 'arnold',   label: 'Arnold',    desc: 'Crisp & natural' },
  { id: 'adam',     label: 'Adam',      desc: 'Deep American male' },
  { id: 'sam',      label: 'Sam',       desc: 'Raspy, strong' },
];

const TRIGGER_TYPES = [
  { id: 'chat_command', label: 'Chat Command', ex: '!ask, !voice, !host' },
  { id: 'sub_event',    label: 'New Subscriber', ex: 'Fires when someone subscribes' },
  { id: 'tip_event',    label: 'Tip / Donation', ex: 'Fires when a tip arrives' },
  { id: 'join_event',   label: 'Viewer Joins', ex: 'Fires on first join' },
  { id: 'manual',       label: 'Manual / API', ex: 'Triggered externally' },
];

const STORAGE_KEY = 'swl_voice_agents';

function loadAgents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveAgents(agents) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(agents)); } catch {}
}

function getElKey() {
  try { return localStorage.getItem('swl_apikey_elevenlabs') || ''; } catch { return ''; }
}

function blankAgent() {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: '',
    personality: '',
    voiceId: 'rachel',
    triggers: [{ type: 'chat_command', value: '!ask', responseTemplate: 'Thanks for asking! {message}' }],
    active: true,
    createdAt: Date.now(),
  };
}

function TriggerRow({ trigger, onChange, onRemove }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <select
            value={trigger.type}
            onChange={e => onChange({ ...trigger, type: e.target.value })}
            style={{ flex: 1, padding: '6px 8px', borderRadius: 7, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'inherit' }}
          >
            {TRIGGER_TYPES.map(tt => <option key={tt.id} value={tt.id}>{tt.label}</option>)}
          </select>
          {trigger.type === 'chat_command' && (
            <input
              value={trigger.value || ''}
              onChange={e => onChange({ ...trigger, value: e.target.value })}
              placeholder="!ask"
              style={{ width: 80, padding: '6px 8px', borderRadius: 7, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'monospace' }}
            />
          )}
        </div>
        <input
          value={trigger.responseTemplate || ''}
          onChange={e => onChange({ ...trigger, responseTemplate: e.target.value })}
          placeholder="Response template — use {message}, {username}, {amount}"
          style={{ width: '100%', padding: '6px 8px', borderRadius: 7, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>
      <button onClick={onRemove} style={{ padding: '6px 7px', borderRadius: 6, background: 'rgba(107,31,42,0.1)', border: '1px solid rgba(107,31,42,0.2)', color: BURG, cursor: 'pointer', flexShrink: 0 }}>
        <Trash2 style={{ width: 12, height: 12 }} />
      </button>
    </div>
  );
}

export default function VoiceAgentBuilder() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const [agents, setAgents] = useState(loadAgents);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [testText, setTestText] = useState('');
  const [testing, setTesting] = useState(false);
  const audioRef = useRef(null);

  function startNew() {
    const a = blankAgent();
    setDraft(a);
    setEditingId(a.id);
  }

  function editAgent(agent) {
    setDraft({ ...agent });
    setEditingId(agent.id);
  }

  function saveDraft() {
    if (!draft) return;
    if (!draft.name.trim()) { toast.error('Agent needs a name.'); return; }
    if (!draft.personality.trim()) { toast.error('Add a personality prompt.'); return; }
    const updated = agents.find(a => a.id === draft.id)
      ? agents.map(a => a.id === draft.id ? draft : a)
      : [...agents, draft];
    setAgents(updated);
    saveAgents(updated);
    setDraft(null);
    setEditingId(null);
    toast.success(`Agent "${draft.name}" saved.`);
  }

  function deleteAgent(id) {
    const updated = agents.filter(a => a.id !== id);
    setAgents(updated);
    saveAgents(updated);
    if (editingId === id) { setDraft(null); setEditingId(null); }
    toast.success('Agent removed.');
  }

  function toggleActive(id) {
    const updated = agents.map(a => a.id === id ? { ...a, active: !a.active } : a);
    setAgents(updated);
    saveAgents(updated);
  }

  function updateTrigger(idx, t) {
    setDraft(d => ({ ...d, triggers: d.triggers.map((tr, i) => i === idx ? t : tr) }));
  }

  function removeTrigger(idx) {
    setDraft(d => ({ ...d, triggers: d.triggers.filter((_, i) => i !== idx) }));
  }

  function addTrigger() {
    setDraft(d => ({ ...d, triggers: [...(d.triggers || []), { type: 'chat_command', value: '', responseTemplate: '' }] }));
  }

  async function testVoice() {
    const elKey = getElKey();
    if (!elKey) { toast.error('Add your ElevenLabs API key in Settings → API Keys first.'); return; }
    const text = testText.trim() || (draft?.personality ? draft.personality.slice(0, 150) : 'Hello, I am your AI voice agent for SeeWhy LIVE.');
    const voiceId = draft?.voiceId || 'rachel';
    setTesting(true);
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      });
      if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
      toast.success('Playing preview…');
    } catch (e) {
      toast.error(`Voice test failed: ${e.message}`);
    } finally {
      setTesting(false);
    }
  }

  async function generatePersonality() {
    if (!draft?.name?.trim()) { toast.error('Name the agent first.'); return; }
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a short AI voice agent personality prompt for a SeeWhy LIVE stream assistant named "${draft.name}".
The assistant helps with live streaming, domino culture, and creator economy.
Keep it under 100 words, conversational, energetic.
Output only the personality prompt text, no labels.`,
        add_context_from_internet: false,
      });
      const text = typeof res === 'string' ? res : (res?.text || res?.choices?.[0]?.message?.content || '');
      setDraft(d => ({ ...d, personality: text.trim() }));
      toast.success('Personality generated!');
    } catch {
      toast.error('Generation failed.');
    }
  }

  const hasElKey = !!getElKey();

  return (
    <div style={{ minHeight: '100vh', background: BG, ...T, paddingBottom: 40 }}>
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(7,5,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.12)', backdropFilter: 'blur(12px)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
          <Bot style={{ width: 16, height: 16, color: GOLD }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1, ...T }}>Voice Agent Builder</h1>
          <p style={{ fontSize: 11, color: DIM, ...T }}>Create AI voice agents for your live streams</p>
        </div>
        <button onClick={startNew} style={{ padding: '7px 14px', borderRadius: 8, background: `${GOLD}20`, border: `1px solid ${GOLD}45`, color: GOLD, cursor: 'pointer', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 5, ...T }}>
          <Plus style={{ width: 12, height: 12 }} /> New Agent
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ElevenLabs key warning */}
        {!hasElKey && (
          <div style={{ borderRadius: 10, padding: '10px 14px', background: 'rgba(107,31,42,0.12)', border: '1px solid rgba(107,31,42,0.3)', fontSize: 12, color: 'rgba(255,150,100,0.85)', ...T }}>
            No ElevenLabs API key found. Go to <strong>Settings → API Keys</strong> to add one — required for voice preview.
          </div>
        )}

        {/* Agent list */}
        {agents.length === 0 && !draft && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13, ...T }}>
            No voice agents yet. Hit <strong style={{ color: GOLD }}>New Agent</strong> to create one.
          </div>
        )}

        {agents.map(agent => (
          <div key={agent.id} style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: `1px solid ${editingId === agent.id ? GOLD + '40' : 'rgba(255,255,255,0.07)'}`, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: agent.active ? '#6DBF7E' : 'rgba(255,255,255,0.2)' }} />
              <Bot style={{ width: 14, height: 14, color: GOLD, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', ...T }}>{agent.name}</p>
                <p style={{ fontSize: 10, color: DIM, ...T }}>{agent.triggers?.length || 0} trigger{agent.triggers?.length !== 1 ? 's' : ''} · {EL_VOICES.find(v => v.id === agent.voiceId)?.label || agent.voiceId}</p>
              </div>
              <button onClick={() => toggleActive(agent.id)} style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: agent.active ? 'rgba(109,191,126,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${agent.active ? 'rgba(109,191,126,0.3)' : 'rgba(255,255,255,0.07)'}`, color: agent.active ? '#6DBF7E' : DIM, ...T }}>
                {agent.active ? 'Active' : 'Off'}
              </button>
              <button onClick={() => editingId === agent.id ? (setEditingId(null), setDraft(null)) : editAgent(agent)} style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD, cursor: 'pointer', fontSize: 10, fontWeight: 700, ...T }}>
                {editingId === agent.id ? 'Close' : 'Edit'}
              </button>
              <button onClick={() => deleteAgent(agent.id)} style={{ padding: '5px 7px', borderRadius: 6, background: 'rgba(107,31,42,0.08)', border: '1px solid rgba(107,31,42,0.2)', color: BURG, cursor: 'pointer' }}>
                <Trash2 style={{ width: 12, height: 12 }} />
              </button>
            </div>
          </div>
        ))}

        {/* Editor */}
        {draft && (
          <div style={{ borderRadius: 14, background: 'rgba(13,6,24,0.9)', border: `1px solid ${GOLD}35`, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', ...T }}>
              {agents.find(a => a.id === draft.id) ? `Edit: ${draft.name || 'Agent'}` : 'New Agent'}
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Name */}
              <div>
                <label style={{ fontSize: 11, color: DIM, ...T }}>Agent Name</label>
                <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. SwanBot, AuraVoice, Coach Riley" style={{ marginTop: 4, width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,168,76,0.25)', color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Personality */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <label style={{ fontSize: 11, color: DIM, ...T, flex: 1 }}>Personality Prompt</label>
                  <button onClick={generatePersonality} style={{ padding: '3px 9px', borderRadius: 5, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD, cursor: 'pointer', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, ...T }}>
                    <Zap style={{ width: 10, height: 10 }} /> AI Generate
                  </button>
                </div>
                <textarea
                  value={draft.personality}
                  onChange={e => setDraft(d => ({ ...d, personality: e.target.value }))}
                  placeholder="Describe how this agent speaks and behaves during your live stream…"
                  rows={4}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {/* Voice */}
              <div>
                <label style={{ fontSize: 11, color: DIM, ...T }}>ElevenLabs Voice</label>
                <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {EL_VOICES.map(v => (
                    <button key={v.id} onClick={() => setDraft(d => ({ ...d, voiceId: v.id }))} style={{ padding: '7px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', background: draft.voiceId === v.id ? `${GOLD}18` : 'rgba(0,0,0,0.3)', border: `1px solid ${draft.voiceId === v.id ? GOLD + '55' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.12s' }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: draft.voiceId === v.id ? GOLD : 'rgba(255,255,255,0.75)', ...T }}>{v.label}</p>
                      <p style={{ fontSize: 9, color: DIM, ...T }}>{v.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Triggers */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: DIM, ...T, flex: 1 }}>Triggers</span>
                  <button onClick={addTrigger} style={{ padding: '3px 9px', borderRadius: 5, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD, cursor: 'pointer', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, ...T }}>
                    <Plus style={{ width: 10, height: 10 }} /> Add
                  </button>
                </div>
                {(draft.triggers || []).map((tr, i) => (
                  <TriggerRow key={i} trigger={tr} onChange={t => updateTrigger(i, t)} onRemove={() => removeTrigger(i)} />
                ))}
                {!draft.triggers?.length && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', ...T }}>No triggers — add one above.</p>}
              </div>

              {/* Voice test */}
              <div style={{ borderRadius: 10, padding: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, ...T }}>Voice Preview</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={testText}
                    onChange={e => setTestText(e.target.value)}
                    placeholder="Type text to preview, or leave blank to use personality…"
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 7, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                  />
                  <button onClick={testVoice} disabled={testing || !hasElKey} style={{ padding: '8px 14px', borderRadius: 7, background: testing ? 'rgba(201,168,76,0.06)' : `${GOLD}18`, border: `1px solid ${GOLD}40`, color: testing ? DIM : GOLD, cursor: hasElKey ? 'pointer' : 'not-allowed', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, ...T }}>
                    {testing ? <><Volume2 style={{ width: 13, height: 13 }} /> Playing…</> : <><Play style={{ width: 13, height: 13 }} /> Test</>}
                  </button>
                </div>
              </div>

              {/* Save */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveDraft} style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: `${GOLD}22`, border: `1px solid ${GOLD}55`, color: GOLD, cursor: 'pointer', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, ...T }}>
                  <Save style={{ width: 14, height: 14 }} /> Save Agent
                </button>
                <button onClick={() => { setDraft(null); setEditingId(null); }} style={{ padding: '11px 16px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: DIM, cursor: 'pointer', fontSize: 12, ...T }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
