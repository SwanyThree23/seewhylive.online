import React, { useState, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Upload, Loader2, Film, Check, Copy,
  Wand2, Megaphone, User, Save, Link2,
  Library, Zap, Plus, X,
} from 'lucide-react';
import AssetDropZone from './AssetDropZone';
import AssetLibrary from './AssetLibrary';
import CinematicEffectsPanel, { effectsToPromptSuffix, DEFAULT_EFFECTS } from './CinematicEffectsPanel';

const G = '#D4AF37';
const ORANGE = '#D4854A';
const EMERALD = '#6DBF7E';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';
const PURPLE = '#7B5DA6';

const STYLE_PRESETS = [
  { id: 'fashion',  name: 'Fashion',  prompt: 'high-fashion editorial commercial, glossy studio strobes, model showcase, slow elegant camera moves, premium luxury feel' },
  { id: 'food',     name: 'Food',     prompt: 'appetizing food commercial, macro close-ups, steam and drip, warm cinematic lighting, slow push-in, restaurant quality' },
  { id: 'tech',     name: 'Tech',     prompt: 'sleek tech product commercial, dark studio, rotating hero shot, glowing accents, precision macro detail, futuristic' },
  { id: 'beauty',   name: 'Beauty',   prompt: 'beauty product commercial, soft diffused lighting, water droplets, silk textures, glowing skin, elegant slow motion' },
  { id: 'auto',     name: 'Auto',      prompt: 'automotive commercial, dramatic studio lighting, reflective floor, rotating hero shot, cinematic reveals' },
  { id: 'lifestyle',name: 'Lifestyle', prompt: 'lifestyle product commercial, natural daylight, real-world setting, people interacting with product, warm authentic mood' },
  { id: 'minimal',  name: 'Minimal',   prompt: 'minimalist product commercial, clean seamless backdrop, single light source, slow rotating hero shot, refined' },
  { id: 'ugc',      name: 'UGC Testimonial', prompt: 'UGC-style testimonial, handheld smartphone feel, real person talking enthusiastically about the product, authentic kitchen/living room setting' },
];

const ASPECTS = [
  { id: '16:9', label: '16:9 Landscape' },
  { id: '9:16', label: '9:16 Vertical' },
];

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

export default function ProductAdStudio() {
  const [productImage, setProductImage] = useState(null);
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [style, setStyle] = useState(STYLE_PRESETS[0]);
  const [aspect, setAspect] = useState(ASPECTS[0]);
  const [shotCount, setShotCount] = useState(1);
  const [adClips, setAdClips] = useState([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [vodId, setVodId] = useState(null);
  const [effects, setEffects] = useState(DEFAULT_EFFECTS);
  const [enhanced, setEnhanced] = useState(null);
  const fileRef = useRef(null);
  const [libOpen, setLibOpen] = useState(false);
  const [pollOn, setPollOn] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const uploadMut = useMutation({
    mutationFn: async (file) => {
      const res = await base44.integrations.Core.UploadFile({ file });
      return res.file_url;
    },
    onSuccess: (url) => {
      setProductImage(url);
      // Auto-save to the creator's asset library for re-use
      if (user) {
        base44.entities.CreativeAsset.create({
          name: productName.trim() || 'Product image',
          file_url: url,
          media_type: 'image',
          category: 'product',
          tags: ['product-ad-studio'],
        }).catch(() => {});
      }
    },
  });

  // LLM → cinematic image+video prompt enhancement
  const enhanceMut = useMutation({
    mutationFn: async () => {
      return base44.integrations.Core.InvokeLLM({
        prompt:
          `Create a cinematic video-ad prompt for a product. ` +
          `Product: "${productName}". Description: "${productDesc}". Style: ${style.name} (${style.prompt}). ` +
          `Return JSON { "image_prompt": string (a polished still-image prompt for the product), ` +
          `"video_prompt": string (a 8-second motion-video prompt with camera moves and lighting), ` +
          `"continue_shot": string (a seamless follow-up 8-second shot that continues the story) }.`,
        response_json_schema: {
          type: 'object',
          properties: {
            image_prompt: { type: 'string' },
            video_prompt: { type: 'string' },
            continue_shot: { type: 'string' },
          },
        },
      });
    },
    onSuccess: (res) => { setEnhanced(res); setEnhancedPrompt(res.video_prompt || res.image_prompt || ''); },
  });

  // Compose the final cinematic prompt(s) sent to the video model.
  // Uses the LLM-enhanced prompt when available, otherwise the style-preset base.
  // Cinematic effects (color grade, lighting, camera, grain, finishing) layer onto every shot.
  const finalPrompts = useMemo(() => {
    const fx = effectsToPromptSuffix(effects);
    const base = style.id === 'ugc'
      ? `${style.prompt}. The person is holding and talking enthusiastically about ${productName || 'this product'}.${fx}`
      : `${style.prompt}. Product: ${productName || 'a premium product'}. ${productDesc || ''}${fx}`.trim();
    const first = enhanced?.video_prompt ? `${enhanced.video_prompt}${fx}` : base;
    const second = (shotCount > 1)
      ? (enhanced?.continue_shot ? `${enhanced.continue_shot}${fx}` : `${style.prompt}. Continued story beat for ${productName || 'the product'}, seamless transition from previous shot, new angle.${fx}`)
      : null;
    return second ? [first, second] : [first];
  }, [style, productName, productDesc, effects, enhanced, shotCount]);

  // Generate video ad clip(s)
  const generateMut = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const p of finalPrompts) {
        const res = await base44.integrations.Core.GenerateVideo({
          prompt: p,
          duration: 8,
          aspect_ratio: aspect.id,
          generate_audio: false,
        });
        results.push(res.url);
      }
      return results;
    },
    onSuccess: setAdClips,
  });

  // Save the hero ad clip to SeeWhy LIVE VOD Library
  const saveVodMut = useMutation({
    mutationFn: async () => {
      if (!adClips.length || !user) return;
      const pollOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
      const withPoll = pollOn && !!pollQuestion.trim() && pollOpts.length >= 2;
      const rec = await base44.entities.VODVideo.create({
        creator_id: user.id,
        title: `${productName || 'Product'} — ${style.name} Ad`,
        description: `SwanyBot Pro Product Ad · ${style.name} style · ${aspect.id}.${productDesc ? ' ' + productDesc : ''}`.slice(0, 2000),
        video_url: adClips[0],
        thumbnail_url: productImage || undefined,
        duration_seconds: 8 * adClips.length,
        tags: ['swanybot-pro', 'product-ad', style.id, 'commercial', ...(withPoll ? ['ad-poll'] : [])],
        category: 'product_ad',
        status: 'draft',
      });
      if (withPoll) {
        // Key the poll to the ad's video URL so it auto-pops wherever the ad plays
        await base44.entities.Poll.create({
          room_id: 'ad:' + adClips[0],
          host_id: user.id,
          question: pollQuestion.trim(),
          options: pollOpts,
          status: 'active',
          created_at: new Date().toISOString(),
        });
      }
      return rec.id;
    },
    onSuccess: setVodId,
  });

  const handleFile = (file) => { if (file) uploadMut.mutate(file); };

  const copyExport = async () => {
    const pack = [
      '═══ SeeWhy LIVE · PRODUCT AD STUDIO — EXPORT PACK ═══',
      `Product:   ${productName || '—'}`,
      `Desc:       ${productDesc || '—'}`,
      `Style:      ${style.name}`,
      `Aspect:     ${aspect.label}`,
      `Shots:      ${shotCount}`,
      '',
      '── Image prompt ──', enhancedPrompt || '(enhance first)',
      '', '── Final cinematic prompts ──', ...finalPrompts,
      '', '── Ad clips ──', adClips.join('\n') || '(not generated yet)',
      vodId ? '' : '', vodId ? `Saved to VOD Library: ${vodId}` : '',
      '═══════════════════════════════════════════════════════',
    ].join('\n');
    try { await navigator.clipboard.writeText(pack); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const busy = uploadMut.isPending || enhanceMut.isPending || generateMut.isPending;
  const canGenerate = !!style && (productName.trim() || productImage);

  return (
    <div className="space-y-4">
      {/* ── PRODUCT INPUT ───────────────────────────────────────────────── */}
      <Section title="1 · Product" accent={G}>
        <div className="grid md:grid-cols-2 gap-3">
          {/* Upload — drag & drop, or pick from the asset library */}
          <div className="space-y-2">
            <AssetDropZone
              imageUrl={productImage}
              onUpload={handleFile}
              onClear={() => setProductImage(null)}
              uploading={uploadMut.isPending}
            />
            <button onClick={() => setLibOpen(true)}
              className="w-full rounded-xl py-2 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: G }}>
              <Library className="w-3.5 h-3.5" /> From Asset Library
            </button>
          </div>
          {/* Details */}
          <div className="space-y-2.5">
            <input value={productName} onChange={(e) => setProductName(e.target.value)}
              placeholder="Product name (e.g. Aurora Silk Serum)"
              className="w-full rounded-xl px-3 py-2.5 text-[12px]"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff' }} />
            <textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)}
              placeholder="Description — key features, mood, target audience…"
              rows={4}
              className="w-full rounded-xl px-3 py-2.5 text-[12px] resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff' }} />
            <button onClick={() => enhanceMut.mutate()} disabled={(!productName.trim() && !productDesc.trim()) || enhanceMut.isPending}
              className="w-full rounded-xl py-2 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.12)', border: `1px solid ${G}88`, color: G }}>
              {enhanceMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              Enhance Prompt (LLM)
            </button>
          </div>
        </div>
      </Section>

      {/* ── STYLE + FORMAT ──────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section title="2 · Cinematic Style" accent={ORANGE}>
          <div className="grid grid-cols-2 gap-1.5">
            {STYLE_PRESETS.map((s) => {
              const active = style.id === s.id;
              return (
                <button key={s.id} onClick={() => setStyle(s)}
                  className="flex flex-col gap-1 px-2.5 py-2 rounded-lg text-left transition-all"
                  style={{ background: active ? 'rgba(212,133,74,0.18)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? ORANGE + 'aa' : 'transparent'}` }}>
                  <div className="flex items-center gap-1.5">
                    {s.id === 'ugc' ? <User className="w-3.5 h-3.5 shrink-0" style={{ color: active ? ORANGE : 'rgba(255,255,255,0.4)' }} /> : <Film className="w-3.5 h-3.5 shrink-0" style={{ color: active ? ORANGE : 'rgba(255,255,255,0.4)' }} />}
                    <span className="text-[10px] font-bold uppercase" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{s.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="3 · Format" accent={ORANGE}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Aspect Ratio</p>
          <div className="flex gap-1.5 mb-3">
            {ASPECTS.map((a) => {
              const active = aspect.id === a.id;
              return (
                <button key={a.id} onClick={() => setAspect(a)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide"
                  style={{ background: active ? 'rgba(212,133,74,0.20)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? ORANGE + 'aa' : 'transparent'}`, color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {a.label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Sequence</p>
          <div className="flex gap-1.5">
            {[1, 2].map((n) => {
              const active = shotCount === n;
              return (
                <button key={n} onClick={() => setShotCount(n)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide"
                  style={{ background: active ? 'rgba(212,133,74,0.20)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? ORANGE + 'aa' : 'transparent'}`, color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {n === 1 ? 'Single Shot' : 'Continue-Shot (2)'}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Continue-shot generates a seamless follow-up beat — great for a hero → testimonial or detail → lifestyle flow.
          </p>
        </Section>
      </div>

      {/* ── CINEMATIC VISUAL EFFECTS ────────────────────────────────────── */}
      <Section title="Cinematic Effects" accent={PURPLE}>
        <CinematicEffectsPanel value={effects} onChange={setEffects} />
      </Section>

      {/* ── QUICK POLL (optional) ───────────────────────────────────────── */}
      <Section title="Quick Poll (optional)" accent={EMERALD} right={
        <button onClick={() => setPollOn((v) => !v)} aria-label="Toggle quick poll"
          className="rounded-full flex items-center px-0.5 transition-all"
          style={{ width: 40, height: 22, background: pollOn ? 'rgba(109,191,126,0.35)' : 'rgba(255,255,255,0.08)', justifyContent: pollOn ? 'flex-end' : 'flex-start' }}>
          <div className="rounded-full" style={{ width: 18, height: 18, background: pollOn ? EMERALD : 'rgba(255,255,255,0.3)' }} />
        </button>
      }>
        {pollOn ? (
          <div className="space-y-2.5">
            <input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Poll question (e.g. Would you rock this?)"
              className="w-full rounded-xl px-3 py-2.5 text-[12px]"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff' }} />
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>Answers (2–4)</p>
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input value={opt}
                  onChange={(e) => setPollOptions((prev) => prev.map((o, idx) => idx === i ? e.target.value : o))}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-xl px-3 py-2 text-[12px]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff' }} />
                {pollOptions.length > 2 && (
                  <button onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)' }}>
                    <X className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 4 && (
              <button onClick={() => setPollOptions((prev) => [...prev, ''])}
                className="w-full rounded-xl py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                style={{ background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.3)', color: EMERALD }}>
                <Plus className="w-3 h-3" /> Add option
              </button>
            )}
            <p className="text-[9px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <Zap className="w-3 h-3 inline" style={{ color: EMERALD }} /> When this ad plays for viewers, the poll pops up automatically — one tap to vote, live results.
            </p>
          </div>
        ) : (
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Attach a one-tap poll that pops up when the ad plays — great for "Which colorway?" or "Would you cop?" engagement.
          </p>
        )}
      </Section>

      {/* ── ENHANCED PROMPT PREVIEW ─────────────────────────────────────── */}
      {enhancedPrompt && (
        <Section title="Enhanced Prompt" accent={PURPLE}>
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Share Tech Mono, monospace' }}>{enhancedPrompt}</p>
        </Section>
      )}

      {/* ── FINAL CINEMATIC PROMPT (live preview) ──────────────────────── */}
      <Section title="Final Cinematic Prompt" accent={G}>
        <p className="text-[9px] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {enhanced ? 'Using LLM-enhanced prompt' : 'Using style preset'} · {finalPrompts.length} shot{finalPrompts.length > 1 ? 's' : ''} · cinematic effects layered in
        </p>
        <div className="space-y-2">
          {finalPrompts.map((p, i) => (
            <div key={i} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
              <p className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                {finalPrompts.length > 1 ? `Shot ${i + 1}` : 'Prompt'} (8s · {aspect.id})
              </p>
              <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Share Tech Mono, monospace' }}>{p}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── GENERATE ────────────────────────────────────────────────────── */}
      <Section title="4 · Generate Ad" accent={G} right={
        <button onClick={copyExport} className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1.5"
          style={{ background: 'rgba(212,175,55,0.12)', border: `1px solid ${G}55`, color: G }}>
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Export Pack</>}
        </button>
      }>
        <button onClick={() => generateMut.mutate()} disabled={!canGenerate || generateMut.isPending}
          className="w-full rounded-xl py-3 text-[12px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 mb-4"
          style={{ background: `linear-gradient(135deg, ${G}, ${ORANGE})`, color: '#000' }}>
          {generateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
          Generate {shotCount > 1 ? 'Continue-Shot Sequence' : 'Product Ad'} ({aspect.id})
        </button>

        <div className={shotCount > 1 ? 'grid grid-cols-2 gap-3' : ''}>
          {(adClips.length ? adClips : [null]).slice(0, shotCount).map((url, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <Film className="w-3.5 h-3.5" style={{ color: G }} />
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {shotCount > 1 ? `Shot ${i + 1}` : 'Product Ad'} (8s · {aspect.id})
                </span>
              </div>
              <div className={aspect.id === '9:16' ? 'aspect-[9/16]' : 'aspect-video'} style={{ background: 'rgba(0,0,0,0.4)' }}>
                {url ? <video src={url} controls loop autoPlay muted className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[11px] text-white/30">{generateMut.isPending ? 'Rendering…' : 'Ad clip appears here'}</span>
                  </div>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── SeeWhy LIVE INTEGRATION ─────────────────────────────────────── */}
      <Section title="5 · SeeWhy LIVE Integration" accent={EMERALD} right={
        <span className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: EMERALD, fontFamily: 'Barlow Condensed, sans-serif' }}>
          <Link2 className="w-3 h-3" /> seewhylive.online
        </span>
      }>
        <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Save the hero ad to your VOD Library — it becomes a shareable commercial you can drop into a Room, schedule as a premiere, or pin to a MerchandiseItem.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => saveVodMut.mutate()} disabled={!adClips.length || saveVodMut.isPending || vodId}
            className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
            style={{ background: vodId ? EMERALD + '18' : 'rgba(255,255,255,0.04)', border: `1px solid ${vodId ? EMERALD + '88' : BORDER}`, color: EMERALD }}>
            {vodId ? <><Check className="w-4 h-4" /> Saved to VOD Library</> : <><Save className="w-4 h-4" /> Save to VOD Library</>}
          </button>
        </div>
      </Section>

      {/* ── ASSET LIBRARY PICKER ───────────────────────────────────────── */}
      {libOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setLibOpen(false)}>
          <div className="w-full max-w-3xl rounded-2xl overflow-hidden max-h-[82vh] overflow-y-auto"
            style={{ background: '#080B18', border: `1px solid ${BORDER}` }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10" style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                <Library className="w-3.5 h-3.5 inline mr-1.5" /> Asset Library — pick an image
              </p>
              <button onClick={() => setLibOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              </button>
            </div>
            <div className="p-4">
              <AssetLibrary selectMode filterMediaType="image"
                onSelect={(asset) => { setProductImage(asset.file_url); setLibOpen(false); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}