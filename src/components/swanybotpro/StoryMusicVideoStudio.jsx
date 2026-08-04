import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Music, Play, Pause, Copy, Check, Loader2, Sparkles, Mic2,
  Film, Upload, Radio, Tag, Clock, Save, Calendar, Link2, RefreshCw, Waves,
} from 'lucide-react';
import TrackUploader from '@/components/swanybotpro/TrackUploader';

const G = '#D4AF37';
const ORANGE = '#D4854A';
const EMERALD = '#6DBF7E';
const PURPLE = '#7B5DA6';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

const GENRES = ['Hip-Hop', 'Afrobeats', 'Pop', 'R&B', 'Country', 'EDM', 'Lo-Fi'];
const STRUCTURES = [
  { id: 'verse-chorus', label: 'Verse · Chorus · Verse', hint: 'Standard song structure' },
  { id: 'narrative',    label: 'Narrative One-Take',      hint: 'Story-driven continuous flow' },
  { id: 'explainer',    label: 'Explainer',               hint: 'Teach a concept with rhythm' },
  { id: 'vlog',         label: 'Vlog Mode',               hint: 'Casual day-in-the-life verses' },
];

const VOICES = [
  { id: 'river',  label: 'River' },
  { id: 'honey',  label: 'Honey' },
  { id: 'sunny',  label: 'Sunny' },
  { id: 'storm',  label: 'Storm' },
  { id: 'spark',  label: 'Spark' },
];

// Expanded visual styles — each carries cut-rate + mood + B-roll for synced generation
const VIDEO_STYLES = [
  { id: 'concert',   name: 'Concert',     cutRate: 'beat',  mood: 'high-energy', prompt: 'live concert performance, stage lights, crowd silhouette, cinematic music video aesthetic, dynamic camera moves' },
  { id: 'rooftop',   name: 'Rooftop',     cutRate: 'bar',   mood: 'golden-hour',  prompt: 'rooftop music video at golden hour, city skyline, cinematic wide shots, slow push-ins' },
  { id: 'studio',    name: 'Studio',      cutRate: 'phrase',mood: 'moody',        prompt: 'recording studio music video, booth performance, moody lighting, intimate close-ups' },
  { id: 'animated',  name: 'Animated',    cutRate: 'beat',  mood: 'vibrant',      prompt: 'stylized animated music video, vibrant illustrated scenes, beat-matched cuts, shape morphs' },
  { id: 'neon',      name: 'Neon City',    cutRate: 'beat',  mood: 'nocturnal',    prompt: 'neon city night music video, rain reflections, cyberpunk glow, strobe cuts on the beat' },
  { id: 'nature',    name: 'Nature',      cutRate: 'phrase',mood: 'serene',       prompt: 'cinematic nature music video, golden fields, drone shots, soft dissolves, dreamlike' },
  { id: 'vlog',      name: 'Vlog / UGC',   cutRate: 'line',  mood: 'casual',       prompt: 'casual vlog-style music video, handheld, day-in-the-life, quick whip pans' },
  { id: 'fashion',   name: 'Fashion',     cutRate: 'bar',   mood: 'editorial',    prompt: 'high-fashion editorial music video, studio strobes, model poses, glossy cuts' },
];

function Section({ title, children, right, accent = ORANGE }) {
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

function Chip({ active, onClick, children, accent }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all"
      style={{
        background: active ? `${accent}22` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? accent + 'aa' : 'transparent'}`,
        color: active ? '#fff' : 'rgba(255,255,255,0.5)',
        fontFamily: 'Barlow Condensed, sans-serif',
      }}>
      {children}
    </button>
  );
}

function fmt(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60); const r = Math.round(s % 60);
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}

export default function StoryMusicVideoStudio() {
  // Source mode: 'upload' = bring your own track, 'generate' = LLM + TTS
  const [mode, setMode] = useState('upload');
  const [genre, setGenre] = useState(GENRES[0]);
  const [structure, setStructure] = useState(STRUCTURES[0]);
  const [voice, setVoice] = useState(VOICES[0]);
  const [videoStyle, setVideoStyle] = useState(VIDEO_STYLES[0]);
  const [topic, setTopic] = useState('');
  const [lyrics, setLyrics] = useState('');

  // Upload-track state
  const [trackUrl, setTrackUrl] = useState(null);
  const [trackMeta, setTrackMeta] = useState(null);

  // Generate-track state
  const [vocalUrl, setVocalUrl] = useState(null);

  // Output
  const [videoUrl, setVideoUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  // Synced preview
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const trackAudioRef = useRef(null);
  const videoRef = useRef(null);

  // SeeWhy LIVE integration state
  const [vodId, setVodId] = useState(null);
  const [savedLib, setSavedLib] = useState(false);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  // ── Mutations ────────────────────────────────────────────────────────────
  const lyricsMut = useMutation({
    mutationFn: async ({ topic, genre, structure }) => {
      return base44.integrations.Core.InvokeLLM({
        prompt: `Write lyrics for a ${genre} song in "${structure.label}" structure about: "${topic}". Keep it performable (under ~40 lines), vivid, rhythmic, radio-friendly. Return JSON { title, lyrics } where lyrics uses [Verse]/[Chorus] markers.`,
        response_json_schema: { type: 'object', properties: { title: { type: 'string' }, lyrics: { type: 'string' } } },
      });
    },
    onSuccess: (res) => setLyrics(res.lyrics || ''),
  });

  const vocalMut = useMutation({
    mutationFn: async ({ text, voiceId }) => {
      const res = await base44.integrations.Core.GenerateSpeech({ text: text.slice(0, 5000), voice: voiceId });
      return res.url;
    },
    onSuccess: setVocalUrl,
  });

  // Synced visual generation — uses track metadata (BPM, duration, mood) + style
  const videoMut = useMutation({
    mutationFn: async ({ bpm, duration, sourcePrompt }) => {
      const beats = bpm ? `, beat-matched cuts at ${bpm} BPM, ${videoStyle.cutRate} switching` : `, ${videoStyle.cutRate} cuts`;
      const dur = duration ? ` ~${Math.round(duration)}s feel` : '';
      const prompt = `A ${genre} music video — ${videoStyle.prompt}.${beats}. Mood: ${videoStyle.mood}.${dur} ${sourcePrompt} Cinematic, high quality.`;
      const res = await base44.integrations.Core.GenerateVideo({
        prompt,
        duration: 8,
        aspect_ratio: '16:9',
        generate_audio: false, // we keep the creator's track
      });
      return res.url;
    },
    onSuccess: setVideoUrl,
  });

  // Save the finished music video into SeeWhy LIVE's VOD Library
  const saveVodMut = useMutation({
    mutationFn: async () => {
      if (!videoUrl || !user) return;
      const title = topic || trackMeta?.name || `${genre} Music Video`;
      const rec = await base44.entities.VODVideo.create({
        creator_id: user.id,
        title,
        description: `SwanyBot Pro · ${videoStyle.name} style · ${genre}${trackMeta?.bpm ? ` · ${trackMeta.bpm} BPM` : ''}. ${lyrics ? '\n\n' + lyrics : ''}`.slice(0, 2000),
        video_url: videoUrl,
        thumbnail_url: trackUrl || undefined,
        duration_seconds: Math.round(trackMeta?.duration || 0),
        tags: ['swanybot-pro', 'music-video', genre.toLowerCase(), videoStyle.id],
        category: 'music_video',
        status: 'draft',
      });
      return rec.id;
    },
    onSuccess: setVodId,
  });

  // Save the lyrics/brief into the Content Library
  const saveLibMut = useMutation({
    mutationFn: async () => {
      if (!lyrics || !user) return;
      return base44.entities.ContentLibrary.create({
        creator_id: user.id,
        content_type: 'highlight_script',
        platform: 'all',
        tone: 'domino_culture',
        input_prompt: `${genre} · ${structure.label} · ${topic || trackMeta?.name || ''}`,
        output_content: lyrics,
        scheduled_status: 'draft',
      });
    },
    onSuccess: () => setSavedLib(true),
  });

  // Schedule a premiere into SeeWhy LIVE's content calendar
  const [premiereAt, setPremiereAt] = useState('');
  const schedMut = useMutation({
    mutationFn: async () => {
      if (!premiereAt || !user || !vodId) return;
      return base44.entities.ScheduledContent.create({
        creator_id: user.id,
        content_type: 'event',
        title: topic || trackMeta?.name || `${genre} Music Video Premiere`,
        description: `Premiere of the ${videoStyle.name}-style music video. VOD: ${vodId}`,
        scheduled_for: new Date(premiereAt).toISOString(),
        status: 'scheduled',
        recurrence: 'none',
      });
    },
  });

  const activeAudioUrl = mode === 'upload' ? trackUrl : vocalUrl;

  const handleProduceGenerate = async () => {
    if (!topic.trim()) return;
    const res = await lyricsMut.mutateAsync({ topic, genre, structure });
    const lyricText = res.lyrics || '';
    setLyrics(lyricText);
    vocalMut.mutate({ text: lyricText, voiceId: voice.id });
    videoMut.mutate({ bpm: 0, duration: 0, sourcePrompt: `Song topic: ${topic}.` });
  };

  const handleProduceUpload = () => {
    if (!trackUrl) return;
    videoMut.mutate({
      bpm: trackMeta?.bpm || 0,
      duration: trackMeta?.duration || 0,
      sourcePrompt: trackMeta?.name ? `Driven by the uploaded track "${trackMeta.name}".` : '',
    });
  };

  // Synced preview — start the track and the generated video together
  const startSynced = () => {
    const a = trackAudioRef.current; const v = videoRef.current;
    if (!a || !v) return;
    setSyncing(true);
    a.currentTime = 0; v.currentTime = 0;
    a.play(); v.play();
  };
  const stopSynced = () => {
    const a = trackAudioRef.current; const v = videoRef.current;
    if (a) a.pause(); if (v) v.pause();
    setSyncing(false);
  };
  useEffect(() => {
    const a = trackAudioRef.current;
    if (!a) return;
    const onTime = () => setSyncProgress(a.duration ? a.currentTime / a.duration : 0);
    const onEnd = () => { setSyncing(false); setSyncProgress(0); };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('ended', onEnd); };
  }, [trackUrl, vocalUrl]);

  const busy = lyricsMut.isPending || vocalMut.isPending || videoMut.isPending;
  const hasVideo = !!videoUrl;

  const buildExportPack = () => {
    const lines = [
      '═══ SeeWhy LIVE · MUSIC VIDEO PIPELINE — EXPORT PACK ═══',
      `Source:    ${mode === 'upload' ? 'Uploaded track' : 'Generated (LLM + TTS)'}`,
      `Genre:     ${genre}`,
      `Structure: ${structure.label}`,
      mode === 'generate' ? `Voice:     ${voice.label}` : `Track:     ${trackMeta?.name || ''} · ${fmt(trackMeta?.duration || 0)}${trackMeta?.bpm ? ' · ' + trackMeta.bpm + ' BPM' : ''}`,
      `Video:     ${videoStyle.name} (${videoStyle.cutRate} cuts · ${videoStyle.mood})`,
      `Topic:     ${topic || '—'}`,
      '',
      '── Track URL ──', activeAudioUrl || '(not ready)',
      '', '── Music video clip ──', videoUrl || '(not generated yet)',
      '', '── Lyrics ──', lyrics || '(none)',
      '',
      '── SeeWhy LIVE integration ──',
      vodId ? `Saved to VOD Library: VODVideo ${vodId}` : '(not saved yet)',
      savedLib ? 'Lyrics saved to Content Library' : '(lyrics not saved)',
      '',
      '── External pipeline (for full studio quality) ──',
      '1. Suno / Udio → paste lyrics → genre + structure → full song',
      '2. Decart LipSync Live → avatar + vocal → live music-video virtual camera',
      '═════════════════════════════════════════════════════════',
    ];
    return lines.join('\n');
  };

  const copyExport = async () => {
    try { await navigator.clipboard.writeText(buildExportPack()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="space-y-4">
      {/* ── SOURCE TOGGLE ─────────────────────────────────────────────────── */}
      <Section title="1 · Track Source" accent={ORANGE} right={
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          {['upload', 'generate'].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className="px-3 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
              style={{
                background: mode === m ? ORANGE + '22' : 'transparent',
                color: mode === m ? ORANGE : 'rgba(255,255,255,0.4)',
              }}>
              {m === 'upload' ? <Upload className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              {m === 'upload' ? 'Upload Track' : 'Generate'}
            </button>
          ))}
        </div>
      }>
        {mode === 'upload' ? (
          <>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Bring your own mastered track. We analyze the waveform, estimate tempo, and generate a <strong style={{ color: ORANGE }}>beat-synced music video</strong> in your chosen visual style.
            </p>
            <TrackUploader
              trackUrl={trackUrl}
              trackMeta={trackMeta}
              genre={genre}
              accent={ORANGE}
              onTrack={(url, meta) => { setTrackUrl(url); setTrackMeta(meta); setVideoUrl(null); setVodId(null); setSavedLib(false); }}
              onClear={() => { setTrackUrl(null); setTrackMeta(null); }}
            />
          </>
        ) : (
          <>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
              No track yet? Write lyrics with the LLM songwriter, render a TTS vocal, and generate a music-video clip — all in-app.
            </p>
            <input value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic / story (e.g. late-night drive through the city)"
              className="w-full rounded-xl px-3 py-2.5 text-[12px] mb-3"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>TTS Voice</p>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {VOICES.map((v) => {
                const active = voice.id === v.id;
                return (
                  <button key={v.id} onClick={() => setVoice(v)}
                    className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all"
                    style={{ background: active ? 'rgba(212,133,74,0.20)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? ORANGE + 'aa' : 'transparent'}` }}>
                    <Mic2 className="w-3.5 h-3.5" style={{ color: active ? ORANGE : 'rgba(255,255,255,0.4)' }} />
                    <span className="text-[8px] font-bold uppercase" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>{v.label}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => topic.trim() && lyricsMut.mutateAsync({ topic, genre, structure }).then(r => r.lyrics && setLyrics(r.lyrics))}
              disabled={!topic.trim() || lyricsMut.isPending}
              className="w-full rounded-xl py-2 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40"
              style={{ background: 'rgba(212,133,74,0.18)', border: `1px solid ${ORANGE}88`, color: ORANGE }}>
              {lyricsMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Write Lyrics (LLM Songwriter)
            </button>
          </>
        )}
      </Section>

      {/* ── STYLE BRIEF ───────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section title="2 · Genre & Structure" accent={ORANGE}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Genre</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {GENRES.map((g) => <Chip key={g} active={genre === g} onClick={() => setGenre(g)} accent={ORANGE}>{g}</Chip>)}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Structure</p>
          <div className="flex flex-wrap gap-1.5">
            {STRUCTURES.map((s) => <Chip key={s.id} active={structure.id === s.id} onClick={() => setStructure(s)} accent={ORANGE}>{s.label}</Chip>)}
          </div>
        </Section>

        {/* ── VISUAL STYLE (synced) ─────────────────────────────────────────── */}
        <Section title="3 · Visual Style" accent={G}>
          <div className="grid grid-cols-2 gap-1.5">
            {VIDEO_STYLES.map((s) => {
              const active = videoStyle.id === s.id;
              return (
                <button key={s.id} onClick={() => setVideoStyle(s)}
                  className="flex flex-col gap-1 px-2.5 py-2 rounded-lg text-left transition-all"
                  style={{ background: active ? 'rgba(212,175,55,0.16)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? G + 'aa' : 'transparent'}` }}>
                  <div className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 shrink-0" style={{ color: active ? G : 'rgba(255,255,255,0.4)' }} />
                    <span className="text-[10px] font-bold uppercase" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{s.name}</span>
                  </div>
                  <span className="text-[8px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {s.cutRate} cuts · {s.mood}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      {/* ── LYRICS (generate mode / editable) ──────────────────────────────── */}
      <Section title="4 · Lyrics" accent={ORANGE}>
        <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)}
          placeholder="Generated lyrics appear here — or paste your own…"
          rows={6}
          className="w-full rounded-xl px-3 py-2.5 text-[12px] resize-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff', fontFamily: 'Share Tech Mono, monospace' }} />
      </Section>

      {/* ── PRODUCE & PREVIEW ──────────────────────────────────────────────── */}
      <Section title="5 · Produce & Synced Preview" accent={ORANGE} right={
        <button onClick={copyExport} className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1.5"
          style={{ background: 'rgba(212,133,74,0.12)', border: `1px solid ${ORANGE}55`, color: ORANGE }}>
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Export Pack</>}
        </button>
      }>
        <div className="flex flex-wrap gap-2 mb-4">
          {mode === 'upload' ? (
            <button onClick={handleProduceUpload} disabled={!trackUrl || videoMut.isPending}
              className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${ORANGE}, ${G})`, color: '#fff' }}>
              {videoMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
              Generate Synced Video
            </button>
          ) : (
            <button onClick={handleProduceGenerate} disabled={!topic.trim() || busy}
              className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${ORANGE}, ${G})`, color: '#fff' }}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
              Produce Full Track
            </button>
          )}
          {mode === 'generate' && (
            <button onClick={() => lyrics.trim() && vocalMut.mutate({ text: lyrics, voiceId: voice.id })}
              disabled={!lyrics.trim() || vocalMut.isPending}
              className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.8)' }}>
              {vocalMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic2 className="w-4 h-4" />} Re-render Vocal
            </button>
          )}
          {hasVideo && (
            <button onClick={syncing ? stopSynced : startSynced}
              disabled={!activeAudioUrl}
              className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
              style={{ background: EMERALD + '22', border: `1px solid ${EMERALD}77`, color: EMERALD }}>
              {syncing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {syncing ? 'Stop' : 'Play Synced Preview'}
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {/* Track / vocal */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              {mode === 'upload' ? <Upload className="w-3.5 h-3.5" style={{ color: ORANGE }} /> : <Mic2 className="w-3.5 h-3.5" style={{ color: ORANGE }} />}
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: ORANGE, fontFamily: 'Barlow Condensed, sans-serif' }}>
                {mode === 'upload' ? 'Track' : `Vocal (${voice.label})`}
              </span>
              {mode === 'generate' && vocalMut.isPending && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: ORANGE }} />}
              {trackMeta?.bpm > 0 && (
                <span className="ml-auto text-[9px] font-bold uppercase flex items-center gap-1" style={{ color: ORANGE, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  <Waves className="w-2.5 h-2.5" /> {trackMeta.bpm} BPM
                </span>
              )}
            </div>
            <div className="aspect-video flex items-center justify-center p-4">
              {activeAudioUrl ? (
                <div className="text-center w-full">
                  <Music className="w-8 h-8 mx-auto mb-2" style={{ color: ORANGE }} />
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {mode === 'upload' ? trackMeta?.name || 'Uploaded track' : 'TTS vocal ready'}
                  </p>
                  {trackMeta?.duration > 0 && <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{fmt(trackMeta.duration)}</p>}
                </div>
              ) : <span className="text-[11px] text-white/30 px-4 text-center">{mode === 'upload' ? 'Upload a track to begin' : 'Vocal renders after lyrics'}</span>}
            </div>
          </div>
          {/* Music video */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <Film className="w-3.5 h-3.5" style={{ color: G }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>Music Video · {videoStyle.name}</span>
              {videoMut.isPending && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: G }} />}
            </div>
            <div className="aspect-video flex items-center justify-center relative">
              {videoUrl ? <video ref={videoRef} src={videoUrl} loop muted playsInline className="w-full h-full object-cover" /> :
                <span className="text-[11px] text-white/30 px-4 text-center">{mode === 'upload' ? 'Generate to preview the synced visual' : 'Music video clip appears after produce'}</span>}
              {syncing && (
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full" style={{ width: `${syncProgress * 100}%`, background: EMERALD }} />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* hidden audio element for synced playback */}
        <audio ref={trackAudioRef} src={activeAudioUrl || undefined} className="hidden" />
        <p className="mt-3 text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <strong style={{ color: ORANGE }}>Synced preview</strong> plays your track alongside the generated visual.
          For a full studio-quality song, copy the <em>Export Pack</em> into Suno / Udio, then feed the vocal into Decart LipSync Live with an avatar.
        </p>
      </Section>

      {/* ── SeeWhy LIVE INTEGRATION ─────────────────────────────────────────── */}
      <Section title="6 · SeeWhy LIVE Integration" accent={EMERALD} right={
        <span className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: EMERALD, fontFamily: 'Barlow Condensed, sans-serif' }}>
          <Link2 className="w-3 h-3" /> seewhylive.online
        </span>
      }>
        <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Save your finished music video into the SeeWhy LIVE creator ecosystem — it shows up in your VOD Library, the lyrics land in your Content Library, and you can schedule a premiere on the Content Calendar.
        </p>
        <div className="grid sm:grid-cols-3 gap-2">
          {/* Save to VOD Library */}
          <button onClick={() => saveVodMut.mutate()} disabled={!hasVideo || saveVodMut.isPending || vodId}
            className="rounded-xl p-3 text-left disabled:opacity-40"
            style={{ background: vodId ? EMERALD + '18' : 'rgba(255,255,255,0.04)', border: `1px solid ${vodId ? EMERALD + '88' : BORDER}` }}>
            <div className="flex items-center gap-2 mb-1">
              {vodId ? <Check className="w-4 h-4" style={{ color: EMERALD }} /> : <Save className="w-4 h-4" style={{ color: EMERALD }} />}
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: EMERALD, fontFamily: 'Barlow Condensed, sans-serif' }}>Save to VOD Library</span>
            </div>
            <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {vodId ? `Saved · ${vodId.slice(-6)}` : 'Creates a VODVideo record (draft)'}
            </p>
          </button>
          {/* Save lyrics to Content Library */}
          <button onClick={() => saveLibMut.mutate()} disabled={!lyrics || saveLibMut.isPending || savedLib}
            className="rounded-xl p-3 text-left disabled:opacity-40"
            style={{ background: savedLib ? EMERALD + '18' : 'rgba(255,255,255,0.04)', border: `1px solid ${savedLib ? EMERALD + '88' : BORDER}` }}>
            <div className="flex items-center gap-2 mb-1">
              {savedLib ? <Check className="w-4 h-4" style={{ color: EMERALD }} /> : <Tag className="w-4 h-4" style={{ color: EMERALD }} />}
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: EMERALD, fontFamily: 'Barlow Condensed, sans-serif' }}>Save Lyrics to Library</span>
            </div>
            <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {savedLib ? 'Saved to Content Library' : 'Stores as a highlight script'}
            </p>
          </button>
          {/* Schedule premiere */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4" style={{ color: EMERALD }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: EMERALD, fontFamily: 'Barlow Condensed, sans-serif' }}>Schedule Premiere</span>
            </div>
            <input type="datetime-local" value={premiereAt} onChange={(e) => setPremiereAt(e.target.value)}
              className="w-full rounded-lg px-2 py-1 text-[10px] mb-1.5"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff' }} />
            <button onClick={() => schedMut.mutate()} disabled={!premiereAt || !vodId || schedMut.isPending}
              className="w-full rounded-lg py-1 text-[10px] font-black uppercase tracking-wider disabled:opacity-40"
              style={{ background: EMERALD + '22', border: `1px solid ${EMERALD}55`, color: EMERALD }}>
              {schedMut.isPending ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : schedMut.isSuccess ? 'Scheduled ✓' : 'Schedule'}
            </button>
          </div>
        </div>
        <p className="mt-3 text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Tip: save the VOD first, then schedule the premiere against it. Find it later under <span style={{ color: EMERALD }}>VOD Library</span> in the main nav.
        </p>
      </Section>
    </div>
  );
}