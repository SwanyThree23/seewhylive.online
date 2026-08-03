import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import {
  Camera, Monitor, Upload, Wand2, Sparkles, Image as ImageIcon,
  Video as VideoIcon, Copy, Check, Loader2, X, Film,
} from 'lucide-react';

const G = '#D4AF37';
const PURPLE = '#7B5DA6';
const BG = '#080B18';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

const MIRAGE_THEMES = [
  { id: 'pirate', name: 'Pirate World', emoji: '🏴‍☠️', prompt: 'pirate world, swashbuckling adventure, wooden ships, ocean mist, cinematic pirate aesthetic' },
  { id: 'vangogh', name: 'Van Gogh', emoji: '🎨', prompt: 'Van Gogh painting style, thick painterly brushstrokes, swirling sky, post-impressionist oil texture' },
  { id: 'warzone', name: 'War Zone', emoji: '💥', prompt: 'gritty war zone, smoke and debris, desaturated cinematic combat aesthetic, dramatic battlefield lighting' },
  { id: 'zombie', name: 'Zombie', emoji: '🧟', prompt: 'zombie apocalypse, decaying horror aesthetic, pale green pallor, fog, undead cinematic style' },
  { id: 'wildwest', name: 'Wild West', emoji: '🤠', prompt: 'Wild West frontier, dusty saloon, sepia western film aesthetic, cowboy cinematic grade' },
  { id: 'scifi', name: 'Sci-Fi Anime', emoji: '🚀', prompt: 'sci-fi anime, neon city, cel-shaded futuristic aesthetic, vibrant cyber anime style' },
  { id: 'footballer', name: 'Footballer', emoji: '⚽', prompt: 'professional footballer on stadium pitch, dynamic sports broadcast aesthetic, cinematic athletic lighting' },
  { id: 'picasso', name: 'Picasso', emoji: '🖼️', prompt: 'Picasso cubist style, fragmented geometric portrait, bold abstract cubism, oil painting texture' },
];

const INPUT_MODES = [
  { id: 'camera', label: 'Open Camera', icon: Camera, hint: 'Capture a driving frame from your webcam' },
  { id: 'screen', label: 'Share Screen', icon: Monitor, hint: 'Capture a driving frame from a screen share' },
  { id: 'upload', label: 'Upload Video', icon: Upload, hint: 'Upload an image or video frame as the driving frame' },
];

function Section({ title, children, right }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>{title}</p>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function VideoTransformStudio() {
  const [inputMode, setInputMode] = useState('camera');
  const [theme, setTheme] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [drivingFrame, setDrivingFrame] = useState(null);
  const [styleFrame, setStyleFrame] = useState(null);
  const [clipUrl, setClipUrl] = useState(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState(null);
  const [copied, setCopied] = useState(false);
  const [camError, setCamError] = useState(null);
  const [captureBusy, setCaptureBusy] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const activePrompt = customPrompt.trim() || (theme ? theme.prompt : '');

  const captureMutation = useMutation({
    mutationFn: async ({ stream, mode }) => {
      const video = videoRef.current;
      // wait for metadata
      await new Promise((res) => {
        if (video.readyState >= 2) return res();
        video.onloadedmetadata = () => res();
      });
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      // cover fit
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      const scale = Math.max(512 / vw, 512 / vh);
      const dw = vw * scale, dh = vh * scale;
      ctx.fillStyle = '#080B18';
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(video, (512 - dw) / 2, (512 - dh) / 2, dw, dh);
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.9));
      // stop stream
      if (stream) stream.getTracks().forEach((t) => t.stop());
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      return file_url;
    },
    onSuccess: (url) => { setDrivingFrame(url); setCaptureBusy(false); },
    onError: (e) => { setCamError(String(e?.message || e)); setCaptureBusy(false); },
  });

  const startStream = useCallback(async (mode) => {
    setCamError(null);
    try {
      const constraints = mode === 'camera'
        ? { video: true, audio: false }
        : { video: { mediaSource: mode === 'screen' ? 'screen' : 'camera' }, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e) {
      setCamError(mode === 'screen'
        ? 'Screen share not available here — upload a frame instead.'
        : 'Camera unavailable — allow access or upload a frame.');
    }
  }, []);

  const captureFrame = useCallback(async () => {
    setCaptureBusy(true);
    await captureMutation.mutateAsync({ stream: streamRef.current, mode: inputMode });
  }, [captureMutation, inputMode]);

  const onUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCaptureBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDrivingFrame(file_url);
    } catch (err) {
      setCamError(String(err?.message || err));
    } finally {
      setCaptureBusy(false);
    }
  }, []);

  const enhanceMutation = useMutation({
    mutationFn: async ({ prompt }) => {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a cinematic AI video prompt engineer. Convert this real-time video-reskin request into a single dense, production-ready prompt for a text-to-image / text-to-video model (Mirage LSD style). Return JSON { "enhanced_prompt": string, "camera_motion": string, "lighting": string, "mood": string }.\n\nRequest: "${prompt}"`,
        response_json_schema: {
          type: 'object',
          properties: {
            enhanced_prompt: { type: 'string' },
            camera_motion: { type: 'string' },
            lighting: { type: 'string' },
            mood: { type: 'string' },
          },
        },
      });
      return res;
    },
  });

  const styleMutation = useMutation({
    mutationFn: async ({ prompt, refUrl }) => {
      const res = await base44.integrations.Core.GenerateImage({
        prompt,
        existing_image_urls: refUrl ? [refUrl] : null,
      });
      return res.url;
    },
    onSuccess: setStyleFrame,
  });

  const clipMutation = useMutation({
    mutationFn: async ({ prompt }) => {
      const res = await base44.integrations.Core.GenerateVideo({
        prompt,
        duration: 4,
        aspect_ratio: '9:16',
        generate_audio: false,
      });
      return res.url;
    },
    onSuccess: setClipUrl,
  });

  const handleEnhance = async () => {
    if (!activePrompt) return;
    const res = await enhanceMutation.mutateAsync({ prompt: activePrompt });
    setEnhancedPrompt(res.enhanced_prompt || activePrompt);
  };

  const handleGenerateAll = async () => {
    if (!activePrompt) return;
    let prompt = enhancedPrompt;
    if (!prompt) {
      const res = await enhanceMutation.mutateAsync({ prompt: activePrompt });
      prompt = res.enhanced_prompt || activePrompt;
      setEnhancedPrompt(prompt);
    }
    styleMutation.mutate({ prompt, refUrl: drivingFrame });
    clipMutation.mutate({ prompt });
  };

  const buildExportPack = () => {
    const t = theme ? theme.name : '(custom)';
    const lines = [
      '═══ DECART.AI — MIRAGE LSD EXPORT PACK ═══',
      `Model:       Mirage LSD (video reskinning)`,
      `Live mode:   Dart Stream (set virtual camera = Decart output)`,
      `Input:       ${inputMode}`,
      `Theme:       ${t}`,
      '',
      '── Paste into Decart prompt bar ──',
      enhancedPrompt || activePrompt || '(enhance your prompt first)',
      '',
      '── Driving frame (upload as reference) ──',
      drivingFrame || '(no frame captured)',
      '',
      '── In-app generated style frame ──',
      styleFrame || '(not generated yet)',
      '',
      '── In-app generated clip ──',
      clipUrl || '(not generated yet)',
      '',
      `Credit estimate: 2 credits/sec · 30s clip ≈ 60 credits`,
      '═══════════════════════════════════════════',
    ];
    return lines.join('\n');
  };

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(buildExportPack());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const busy = captureBusy || enhanceMutation.isPending || styleMutation.isPending || clipMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* INPUT + DRIVING FRAME */}
        <Section title="1 · Input Source">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {INPUT_MODES.map((m) => {
              const Icon = m.icon;
              const active = inputMode === m.id;
              return (
                <button key={m.id} onClick={() => { setInputMode(m.id); setDrivingFrame(null); setCamError(null); if (m.id !== 'upload') startStream(m.id); }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                  style={{ background: active ? 'rgba(123,93,166,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? PURPLE + '88' : 'transparent'}` }}>
                  <Icon className="w-5 h-5" style={{ color: active ? PURPLE : 'rgba(255,255,255,0.4)' }} />
                  <span className="text-[10px] font-bold uppercase" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>{m.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>{INPUT_MODES.find((m) => m.id === inputMode).hint}</p>

          {inputMode !== 'upload' && (
            <div className="relative rounded-xl overflow-hidden mb-2" style={{ aspectRatio: '1 / 1', background: '#000', border: `1px solid ${BORDER}` }}>
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              {!drivingFrame && (
                <button onClick={captureFrame} disabled={busy}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                  style={{ background: G, color: '#000' }}>
                  {captureBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  Capture Frame
                </button>
              )}
            </div>
          )}
          {inputMode === 'upload' && (
            <label className="block">
              <div className="rounded-xl flex flex-col items-center justify-center gap-2 p-6 cursor-pointer" style={{ aspectRatio: '1 / 1', background: 'rgba(255,255,255,0.03)', border: `2px dashed ${BORDER}` }}>
                {captureBusy ? <Loader2 className="w-6 h-6 animate-spin" style={{ color: G }} /> : <Upload className="w-6 h-6" style={{ color: G }} />}
                <span className="text-[11px] text-white/50">Tap to upload image / video frame</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onUpload} />
            </label>
          )}

          {camError && <p className="text-[11px] mt-2" style={{ color: '#E74C3C' }}>{camError}</p>}

          {drivingFrame && (
            <div className="mt-2 relative rounded-xl overflow-hidden" style={{ border: `1px solid ${G}55` }}>
              <img src={drivingFrame} alt="driving frame" className="w-full" />
              <button onClick={() => setDrivingFrame(null)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <X className="w-3 h-3 text-white" />
              </button>
              <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: G, color: '#000' }}>Driving Frame ✓</span>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </Section>

        {/* STYLE + PROMPT */}
        <Section title="2 · Style & Prompt">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {MIRAGE_THEMES.map((t) => {
              const active = theme?.id === t.id && !customPrompt.trim();
              return (
                <button key={t.id} onClick={() => { setTheme(active ? null : t); setCustomPrompt(''); setEnhancedPrompt(null); }}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
                  style={{ background: active ? 'rgba(123,93,166,0.20)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? PURPLE + '88' : 'transparent'}` }}>
                  <span className="text-lg">{t.emoji}</span>
                  <span className="text-[9px] font-bold uppercase text-center leading-tight" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{t.name}</span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <input value={customPrompt} onChange={(e) => { setCustomPrompt(e.target.value); setTheme(null); setEnhancedPrompt(null); }}
              placeholder="Or type a custom prompt (e.g. cyberpunk, K-pop styling, sci-fi film…)"
              className="w-full rounded-xl px-3 py-2.5 text-[12px]"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff' }} />
          </div>
          <button onClick={handleEnhance} disabled={!activePrompt || enhanceMutation.isPending}
            className="mt-2 w-full rounded-xl py-2 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
            style={{ background: 'rgba(123,93,166,0.18)', border: `1px solid ${PURPLE}88`, color: PURPLE }}>
            {enhanceMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {enhancedPrompt ? 'Re-enhance Prompt' : 'Enhance Prompt (cinematic JSON)'}
          </button>
          {enhancedPrompt && (
            <div className="mt-2 rounded-lg p-2.5 text-[11px] leading-relaxed" style={{ background: 'rgba(123,93,166,0.08)', border: `1px solid ${PURPLE}33`, color: 'rgba(255,255,255,0.75)' }}>
              <span style={{ color: PURPLE, fontWeight: 700 }}>ENHANCED · </span>{enhancedPrompt}
            </div>
          )}
        </Section>
      </div>

      {/* ACTIONS + OUTPUTS */}
      <Section title="3 · Generate & Export" right={
        <button onClick={copyExport} className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1.5"
          style={{ background: 'rgba(212,175,55,0.12)', border: `1px solid ${G}55`, color: G }}>
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Decart Pack</>}
        </button>
      }>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={handleGenerateAll} disabled={!activePrompt || busy}
            className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, ${G})`, color: '#fff' }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Generate Style Frame + Clip
          </button>
          <button onClick={copyExport} disabled={!activePrompt}
            className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.8)' }}>
            <Film className="w-4 h-4" /> Export Live Pack
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {/* Style frame */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <ImageIcon className="w-3.5 h-3.5" style={{ color: G }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>In-app Style Frame</span>
              {styleMutation.isPending && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: G }} />}
            </div>
            <div className="aspect-square flex items-center justify-center">
              {styleFrame ? <img src={styleFrame} alt="style frame" className="w-full h-full object-cover" /> :
                <span className="text-[11px] text-white/30 px-4 text-center">Generated style frame appears here (platform-native render)</span>}
            </div>
          </div>
          {/* Clip */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <VideoIcon className="w-3.5 h-3.5" style={{ color: PURPLE }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: PURPLE, fontFamily: 'Barlow Condensed, sans-serif' }}>In-app Clip (4s · 9:16)</span>
              {clipMutation.isPending && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: PURPLE }} />}
            </div>
            <div className="aspect-square flex items-center justify-center">
              {clipUrl ? <video src={clipUrl} controls loop autoPlay muted className="w-full h-full object-cover" /> :
                <span className="text-[11px] text-white/30 px-4 text-center">Generated cinematic clip appears here (platform-native render)</span>}
            </div>
          </div>
        </div>

        <p className="mt-3 text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <strong style={{ color: G }}>Both, per module:</strong> in-app rendering runs where the platform supports it (image + short clip).
          For live real-time reskinning (zero-latency), copy the <em>Decart Pack</em> and feed it into Decart.ai's Mirage LSD or Dart Stream —
          set the Decart virtual camera as your OBS / Zoom / Meet video source.
        </p>
      </Section>
    </div>
  );
}