import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Loader2, Wand2, Copy, Check, FileText, Sparkles, Download, Clapperboard, Image as ImageIcon,
} from 'lucide-react';

const G = '#D4AF37';
const RED = '#C0392B';
const PURPLE = '#7B5DA6';
const EMERALD = '#6DBF7E';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

const TARGET_MODELS = [
  { id: 'sora_2',      name: 'Sora 2',        icon: Clapperboard, blurb: 'OpenAI · long-form narrative, synced audio, multi-shot story', promptHint: 'cinematic story with consistent characters, camera work, and synced audio' },
  { id: 'veo_3_1',     name: 'Veo 3.1',       icon: Clapperboard, blurb: 'Google · 1080p commercial ads, native audio, 8s clips', promptHint: 'polished commercial ad with product hero, lighting, and audio design' },
  { id: 'runway_gen2', name: 'Runway Gen-2',  icon: ImageIcon,    blurb: 'image-to-video pipeline, motion brush, camera control', promptHint: 'image+video motion pipeline with motion direction and camera move' },
  { id: 'nano_banana', name: 'Nano Banana',  icon: ImageIcon,    blurb: 'Google Gemini · driving-image prompt for consistent character frames', promptHint: 'driving image with character consistency, pose, and scene' },
];

const ASPECTS = [
  { id: '16:9', label: '16:9 Landscape' },
  { id: '9:16', label: '9:16 Vertical' },
  { id: '1:1',  label: '1:1 Square' },
];

const DURATIONS = [4, 6, 8, 12];

const MOODS = ['Cinematic', 'Hype', 'Dreamy', 'Gritty', 'Luxury', 'Playful', 'Tense', 'Uplifting'];

function Section({ title, children, right, accent = G }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: accent, fontFamily: 'Barlow Condensed, sans-serif' }}>{title}</p>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function PromptForge() {
  const [idea, setIdea] = useState('');
  const [model, setModel] = useState(TARGET_MODELS[0]);
  const [aspect, setAspect] = useState(ASPECTS[0]);
  const [duration, setDuration] = useState(8);
  const [mood, setMood] = useState(MOODS[0]);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [savedId, setSavedId] = useState(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const forgeMut = useMutation({
    mutationFn: async () => {
      return base44.integrations.Core.InvokeLLM({
        prompt:
          `You are Prompt Forge — an expert cinematic prompt engineer. Convert a one-line idea into a polished JSON prompt optimized for ${model.name}. ` +
          `Idea: "${idea}". Target model: ${model.name} (${model.promptHint}). ` +
          `Mood: ${mood}. Aspect: ${aspect.id}. Duration: ${duration}s. ` +
          `Return JSON with these fields: ` +
          `{ "model": "${model.id}", "prompt": string (the full ready-to-paste cinematic prompt), ` +
          `"negative_prompt": string (what to avoid), "camera": string (camera move), ` +
          `"lighting": string, "style": string, "audio": string (sound design notes), ` +
          `"duration_seconds": number, "aspect_ratio": string, ` +
          `"driving_image_prompt": string (a still-image prompt usable as the first frame / driving image) }.`,
        response_json_schema: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            prompt: { type: 'string' },
            negative_prompt: { type: 'string' },
            camera: { type: 'string' },
            lighting: { type: 'string' },
            style: { type: 'string' },
            audio: { type: 'string' },
            duration_seconds: { type: 'number' },
            aspect_ratio: { type: 'string' },
            driving_image_prompt: { type: 'string' },
          },
        },
      });
    },
    onSuccess: setResult,
  });

  // Save the forge result to SeeWhy LIVE ContentLibrary as a reusable creative prompt
  const saveMut = useMutation({
    mutationFn: async () => {
      if (!result || !user) return;
      const rec = await base44.entities.ContentLibrary.create({
        creator_id: user.id,
        content_type: 'highlight_script',
        platform: 'all',
        tone: 'hype',
        input_prompt: idea.slice(0, 500),
        output_content: JSON.stringify(result, null, 2).slice(0, 4000),
        scheduled_status: 'draft',
      });
      return rec.id;
    },
    onSuccess: setSavedId,
  });

  const copyJson = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const downloadPack = () => {
    if (!result) return;
    const pack = [
      '═══ SeeWhy LIVE · PROMPT FORGE — EXPORT PACK ═══',
      `Idea:       ${idea}`,
      `Model:      ${model.name}`,
      `Mood:       ${mood}   Aspect: ${aspect.id}   Duration: ${duration}s`,
      '',
      '── Driving image prompt ──', result.driving_image_prompt || '—',
      '', '── Video prompt ──', result.prompt || '—',
      '', '── Negative prompt ──', result.negative_prompt || '—',
      '', '── Camera ──', result.camera || '—',
      '', '── Lighting ──', result.lighting || '—',
      '', '── Style ──', result.style || '—',
      '', '── Audio ──', result.audio || '—',
      '',
      '── Full JSON ──', JSON.stringify(result, null, 2),
      savedId ? '' : '', savedId ? `Saved to Content Library: ${savedId}` : '',
      '═══════════════════════════════════════════════════════',
    ].join('\n');
    const blob = new Blob([pack], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-forge-${model.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canForge = idea.trim().length > 3;

  return (
    <div className="space-y-4">
      {/* ── IDEA INPUT ───────────────────────────────────────────────── */}
      <Section title="1 · Your Idea" accent={G}>
        <textarea value={idea} onChange={(e) => setIdea(e.target.value)}
          placeholder="One-line idea — e.g. 'A streetwear brand launch in neon Tokyo rain at night'"
          rows={3}
          className="w-full rounded-xl px-3 py-2.5 text-[13px] resize-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff', fontFamily: 'Rajdhani, sans-serif' }} />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            'A streetwear brand launch in neon Tokyo rain at night',
            'Coffee brand morning ritual, warm golden window light',
            'EV car reveal on a foggy coastal highway at dawn',
            'Skate crew session in a sunlit empty pool',
          ].map((ex) => (
            <button key={ex} onClick={() => setIdea(ex)}
              className="text-[10px] px-2 py-1 rounded-lg text-left leading-tight"
              style={{ background: 'rgba(212,175,55,0.06)', border: `1px solid ${G}22`, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              {ex}
            </button>
          ))}
        </div>
      </Section>

      {/* ── TARGET MODEL ─────────────────────────────────────────────── */}
      <Section title="2 · Target Model" accent={RED}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TARGET_MODELS.map((m) => {
            const Icon = m.icon;
            const active = m.id === model.id;
            return (
              <button key={m.id} onClick={() => setModel(m)}
                className="rounded-xl p-2.5 text-left transition-all"
                style={{ background: active ? 'rgba(192,57,43,0.18)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? RED + 'aa' : 'transparent'}` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? RED : 'rgba(255,255,255,0.4)' }} />
                  <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>{m.name}</span>
                </div>
                <p className="text-[9px] leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.blurb}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── SETTINGS ──────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4">
        <Section title="3 · Aspect" accent={PURPLE}>
          <div className="flex flex-wrap gap-1.5">
            {ASPECTS.map((a) => {
              const active = aspect.id === a.id;
              return (
                <button key={a.id} onClick={() => setAspect(a)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide"
                  style={{ background: active ? 'rgba(123,93,166,0.20)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? PURPLE + 'aa' : 'transparent'}`, color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {a.label}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="4 · Duration" accent={PURPLE}>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => {
              const active = duration === d;
              return (
                <button key={d} onClick={() => setDuration(d)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide"
                  style={{ background: active ? 'rgba(123,93,166,0.20)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? PURPLE + 'aa' : 'transparent'}`, color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {d}s
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="5 · Mood" accent={PURPLE}>
          <div className="flex flex-wrap gap-1.5">
            {MOODS.map((m) => {
              const active = mood === m;
              return (
                <button key={m} onClick={() => setMood(m)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide"
                  style={{ background: active ? 'rgba(123,93,166,0.20)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? PURPLE + 'aa' : 'transparent'}`, color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {m}
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      {/* ── FORGE ────────────────────────────────────────────────────── */}
      <Section title="6 · Forge Prompt" accent={G} right={
        <div className="flex gap-1.5">
          <button onClick={copyJson} disabled={!result}
            className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1.5 disabled:opacity-30"
            style={{ background: 'rgba(212,175,55,0.12)', border: `1px solid ${G}55`, color: G }}>
            {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> JSON</>}
          </button>
          <button onClick={downloadPack} disabled={!result}
            className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1.5 disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.6)' }}>
            <Download className="w-3 h-3" /> Pack
          </button>
        </div>
      }>
        <button onClick={() => forgeMut.mutate()} disabled={!canForge || forgeMut.isPending}
          className="w-full rounded-xl py-3 text-[12px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${G}, ${RED})`, color: '#000' }}>
          {forgeMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Forge {model.name} Prompt
        </button>
      </Section>

      {/* ── RESULT ───────────────────────────────────────────────────── */}
      {result && (
        <>
          <Section title="Forged Prompt" accent={EMERALD} right={
            <span className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: EMERALD, fontFamily: 'Barlow Condensed, sans-serif' }}>
              <Sparkles className="w-3 h-3" /> {result.model}
            </span>
          }>
            <div className="space-y-2.5">
              <Field label="Driving Image Prompt" value={result.driving_image_prompt} accent={EMERALD} icon={ImageIcon} />
              <Field label="Video Prompt" value={result.prompt} accent={G} icon={Clapperboard} />
              <div className="grid sm:grid-cols-2 gap-2.5">
                <Field label="Negative" value={result.negative_prompt} accent={RED} />
                <Field label="Camera" value={result.camera} accent={PURPLE} />
                <Field label="Lighting" value={result.lighting} accent={PURPLE} />
                <Field label="Style" value={result.style} accent={PURPLE} />
                <Field label="Audio" value={result.audio} accent={EMERALD} />
                <Field label="Spec" value={`${result.duration_seconds || duration}s · ${result.aspect_ratio || aspect.id}`} accent={G} />
              </div>
            </div>
          </Section>

          {/* ── SeeWhy LIVE INTEGRATION ──────────────────────────────── */}
          <Section title="7 · Save to Content Library" accent={EMERALD}>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Stash this forged prompt in your SeeWhy LIVE Content Library — reuse it across scheduled content, social posts, or stream titles.
            </p>
            <button onClick={() => saveMut.mutate()} disabled={!result || saveMut.isPending || savedId}
              className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
              style={{ background: savedId ? EMERALD + '18' : 'rgba(255,255,255,0.04)', border: `1px solid ${savedId ? EMERALD + '88' : BORDER}`, color: EMERALD }}>
              {savedId ? <><Check className="w-4 h-4" /> Saved to Content Library</> : <><FileText className="w-4 h-4" /> Save to Content Library</>}
            </button>
          </Section>
        </>
      )}
    </div>
  );
}

function Field({ label, value, accent, icon: Icon }) {
  return (
    <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}33` }}>
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="w-3 h-3 shrink-0" style={{ color: accent }} />}
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: accent, fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</span>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: 'Share Tech Mono, monospace' }}>{value || '—'}</p>
    </div>
  );
}