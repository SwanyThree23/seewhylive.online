import React, { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import {
  Mic2, Upload, Play, Pause, Copy, Check, Loader2, X, Sparkles,
  AudioLines, Volume2, FileAudio, User,
} from 'lucide-react';

const G = '#D4AF37';
const TEAL = '#4A8A7A';
const BG = '#080B18';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

const EMOTIONS = [
  { id: 'neutral',  label: 'Neutral',  emoji: '😐' },
  { id: 'angry',    label: 'Angry',    emoji: '😠' },
  { id: 'surprised',label: 'Surprised',emoji: '😮' },
  { id: 'sad',      label: 'Sad',      emoji: '😢' },
  { id: 'happy',    label: 'Happy',    emoji: '😄' },
  { id: 'whisper',  label: 'Whisper',  emoji: '🤫' },
];

const AVATAR_PRESETS = [
  { id: 'cyber-host',    name: 'Cyber Host',     prompt: 'futuristic cyberpunk news anchor avatar, neon rim light, holographic studio, photorealistic cinematic portrait, head-and-shoulders framing' },
  { id: 'anime-idol',    name: 'Anime Idol',     prompt: 'stylized anime idol avatar, vibrant cel-shaded portrait, stage lighting, head-and-shoulders framing, expressive face' },
  { id: 'noir-detective',name: 'Noir Detective', prompt: 'film noir detective avatar, moody black-and-white cinematic portrait, venetian blind shadows, head-and-shoulders framing' },
  { id: 'fashion-model', name: 'Fashion Model',  prompt: 'high-fashion editorial portrait avatar, studio beauty lighting, clean seamless background, head-and-shoulders framing' },
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

export default function VoiceLipSyncStudio() {
  const [refAudio, setRefAudio] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [emotion, setEmotion] = useState('neutral');
  const [intensity, setIntensity] = useState(50);
  const [avatarPreset, setAvatarPreset] = useState(AVATAR_PRESETS[0]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [lipClipUrl, setLipClipUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);

  const fileRef = useRef(null);
  const mediaRecRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  // Upload reference voice
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: setRefAudio,
  });

  const onUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  }, [uploadMutation]);

  // Record reference voice in-browser
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        uploadMutation.mutate(blob);
      };
      mr.start();
      mediaRecRef.current = mr;
      setRecording(true);
    } catch {
      uploadMutation.reset();
    }
  }, [uploadMutation]);

  const stopRecording = useCallback(() => {
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop();
    }
    setRecording(false);
  }, []);

  // Transcribe the reference audio to build a driving script
  const transcribeMutation = useMutation({
    mutationFn: async ({ audioUrl }) => {
      const text = await base44.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
      return text;
    },
    onSuccess: (text) => setTranscript(text || ''),
  });

  // LLM: rewrite the transcript with the chosen emotion
  const emotionMutation = useMutation({
    mutationFn: async ({ text, emo, intensity }) => {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          `Rewrite the following spoken line so it reads as ${emo} (intensity ${intensity}/100). ` +
          `Keep meaning intact; only change tone, word choice, and pacing. ` +
          `Return JSON { "line": string, "delivery_notes": string }.\n\nLine:\n"""${text}"""`,
        response_json_schema: {
          type: 'object',
          properties: {
            line: { type: 'string' },
            delivery_notes: { type: 'string' },
          },
        },
      });
      return res;
    },
  });

  // Generate the speaking avatar still
  const avatarMutation = useMutation({
    mutationFn: async ({ prompt }) => {
      const res = await base44.integrations.Core.GenerateImage({ prompt });
      return res.url;
    },
    onSuccess: setAvatarUrl,
  });

  // Generate a short lip-synced clip from the avatar + emotional line
  const lipClipMutation = useMutation({
    mutationFn: async ({ avatarRef, line }) => {
      const prompt =
        `A portrait shot of this character speaking the line with natural lip movement: "${line}". ` +
        `Emotion: ${emotion}, intensity ${intensity}/100. ` +
        `Subtle head motion, blink, expressive eyes, cinematic lighting, 4 seconds.`;
      const res = await base44.integrations.Core.GenerateVideo({
        prompt,
        duration: 4,
        aspect_ratio: '9:16',
        generate_audio: false,
      });
      return res.url;
    },
    onSuccess: setLipClipUrl,
  });

  const handleGenerateAll = async () => {
    let line = transcript.trim();
    if (emotion !== 'neutral' && transcript.trim()) {
      const res = await emotionMutation.mutateAsync({ text: transcript, emo: emotion, intensity });
      line = res.line || line;
      setTranscript(line);
    }
    avatarMutation.mutate({ prompt: avatarPreset.prompt });
    lipClipMutation.mutate({ avatarRef: avatarUrl, line: line || avatarPreset.name });
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  };

  const buildExportPack = () => {
    const lines = [
      '═══ ELEVENLABS / DECART LIPSYNC LIVE — EXPORT PACK ═══',
      'Pipeline:   Reference voice clone → emotional line → avatar still → lip-sync clip',
      `Voice ref:  ${refAudio || '(upload reference audio first)'}`,
      `Emotion:    ${emotion} (intensity ${intensity}/100)`,
      `Avatar:     ${avatarPreset.name}`,
      '',
      '── Driving script (paste into TTS / LipSync Live) ──',
      transcript.trim() || '(transcribe or type a line)',
      '',
      '── Avatar still (upload as character reference) ──',
      avatarUrl || '(not generated yet)',
      '',
      '── In-app lip-sync clip ──',
      lipClipUrl || '(not generated yet)',
      '',
      '── ElevenLabs mapping ──',
      '1. Voice clone tab → upload the reference audio above',
      '2. Paste the driving script → generate speech',
      '3. Decart LipSync Live → avatar image + generated speech → live out',
      '═════════════════════════════════════════════════════════',
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

  const busy = uploadMutation.isPending || transcribeMutation.isPending ||
    emotionMutation.isPending || avatarMutation.isPending || lipClipMutation.isPending;
  const ready = !!refAudio;

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* VOICE CLONE */}
        <Section title="1 · Voice Clone" accent={TEAL}>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
              style={{ background: uploadMutation.isPending ? 'rgba(74,138,122,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${TEAL}55` }}>
              {uploadMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: TEAL }} /> : <Upload className="w-5 h-5" style={{ color: TEAL }} />}
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>Upload Audio</span>
            </button>
            <button onClick={recording ? stopRecording : startRecording}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
              style={{ background: recording ? 'rgba(192,57,43,0.20)' : 'rgba(255,255,255,0.04)', border: `1px solid ${recording ? '#C0392Baa' : TEAL + '55'}` }}>
              <Mic2 className="w-5 h-5" style={{ color: recording ? '#C0392B' : TEAL }} />
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{recording ? 'Stop' : 'Record'}</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onUpload} />

          {refAudio && (
            <div className="rounded-xl p-2.5 flex items-center gap-2" style={{ background: 'rgba(74,138,122,0.10)', border: `1px solid ${TEAL}44` }}>
              <FileAudio className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: TEAL, fontFamily: 'Barlow Condensed, sans-serif' }}>Reference Voice ✓</p>
                <p className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{refAudio}</p>
              </div>
              <button onClick={togglePlay} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: TEAL + '22' }}>
                {playing ? <Pause className="w-3.5 h-3.5" style={{ color: TEAL }} /> : <Play className="w-3.5 h-3.5" style={{ color: TEAL }} />}
              </button>
              <button onClick={() => { setRefAudio(null); setTranscript(''); }} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <X className="w-3.5 h-3.5 text-white/50" />
              </button>
              <audio ref={audioRef} src={refAudio} onEnded={() => setPlaying(false)} className="hidden" />
            </div>
          )}

          <button
            onClick={() => refAudio && transcribeMutation.mutate({ audioUrl: refAudio })}
            disabled={!refAudio || transcribeMutation.isPending}
            className="mt-2 w-full rounded-xl py-2 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40"
            style={{ background: 'rgba(74,138,122,0.18)', border: `1px solid ${TEAL}66`, color: TEAL }}>
            {transcribeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <AudioLines className="w-3 h-3" />}
            Transcribe → Driving Script
          </button>
        </Section>

        {/* SCRIPT + EMOTION */}
        <Section title="2 · Script & Emotion" accent={TEAL}>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Transcribed line appears here — or type your own driving script…"
            rows={4}
            className="w-full rounded-xl px-3 py-2.5 text-[12px] resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff' }}
          />
          <p className="text-[10px] font-bold uppercase tracking-widest mt-3 mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Emotion</p>
          <div className="grid grid-cols-6 gap-1.5">
            {EMOTIONS.map((e) => {
              const active = emotion === e.id;
              return (
                <button key={e.id} onClick={() => setEmotion(e.id)}
                  className="flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all"
                  style={{ background: active ? 'rgba(74,138,122,0.22)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? TEAL + 'aa' : 'transparent'}` }}>
                  <span className="text-base">{e.emoji}</span>
                  <span className="text-[8px] font-bold uppercase" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>{e.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Intensity</span>
              <span className="text-[11px] font-black" style={{ color: TEAL, fontFamily: 'Share Tech Mono, monospace' }}>{intensity}</span>
            </div>
            <input type="range" min="0" max="100" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full" style={{ accentColor: TEAL }} />
          </div>
          <button
            onClick={async () => {
              if (!transcript.trim()) return;
              const res = await emotionMutation.mutateAsync({ text: transcript, emo: emotion, intensity });
              if (res.line) setTranscript(res.line);
            }}
            disabled={!transcript.trim() || emotionMutation.isPending}
            className="mt-3 w-full rounded-xl py-2 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40"
            style={{ background: 'rgba(74,138,122,0.18)', border: `1px solid ${TEAL}88`, color: TEAL }}>
            {emotionMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Apply Emotion to Script
          </button>
        </Section>
      </div>

      {/* AVATAR + LIP-SYNC */}
      <Section title="3 · Avatar & Lip-Sync" accent={TEAL} right={
        <button onClick={copyExport} className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1.5"
          style={{ background: 'rgba(74,138,122,0.12)', border: `1px solid ${TEAL}55`, color: TEAL }}>
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Export Pack</>}
        </button>
      }>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Character avatar preset</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {AVATAR_PRESETS.map((a) => {
            const active = avatarPreset.id === a.id;
            return (
              <button key={a.id} onClick={() => setAvatarPreset(a)}
                className="flex flex-col items-start gap-1 p-2.5 rounded-xl text-left transition-all"
                style={{ background: active ? 'rgba(74,138,122,0.18)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? TEAL + 'aa' : 'transparent'}` }}>
                <User className="w-4 h-4" style={{ color: active ? TEAL : 'rgba(255,255,255,0.4)' }} />
                <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{a.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={handleGenerateAll} disabled={!ready || !transcript.trim() || busy}
            className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${TEAL}, ${G})`, color: '#fff' }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic2 className="w-4 h-4" />}
            Generate Avatar + Lip-Sync Clip
          </button>
          <button onClick={copyExport} disabled={!ready}
            className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.8)' }}>
            <Volume2 className="w-4 h-4" /> Export Live Pack
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {/* Avatar still */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <User className="w-3.5 h-3.5" style={{ color: TEAL }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: TEAL, fontFamily: 'Barlow Condensed, sans-serif' }}>Avatar Still</span>
              {avatarMutation.isPending && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: TEAL }} />}
            </div>
            <div className="aspect-square flex items-center justify-center">
              {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> :
                <span className="text-[11px] text-white/30 px-4 text-center">Character avatar appears here</span>}
            </div>
          </div>
          {/* Lip-sync clip */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <Mic2 className="w-3.5 h-3.5" style={{ color: G }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>Lip-Sync Clip (4s · 9:16)</span>
              {lipClipMutation.isPending && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: G }} />}
            </div>
            <div className="aspect-square flex items-center justify-center">
              {lipClipUrl ? <video src={lipClipUrl} controls loop autoPlay muted className="w-full h-full object-cover" /> :
                <span className="text-[11px] text-white/30 px-4 text-center">Lip-synced clip appears here (platform-native render)</span>}
            </div>
          </div>
        </div>

        <p className="mt-3 text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <strong style={{ color: TEAL }}>Both, per module:</strong> the avatar still + a 4-second lip-sync clip render in-app where the platform supports it.
          For live real-time lip-sync, copy the <em>Export Pack</em> into ElevenLabs (voice clone + TTS) → Decart LipSync Live (avatar image + generated speech → live virtual camera).
        </p>
      </Section>
    </div>
  );
}