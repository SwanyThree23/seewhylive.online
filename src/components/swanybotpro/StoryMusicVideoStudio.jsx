import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import {
  Music, Play, Pause, Copy, Check, Loader2, Sparkles, Mic2,
  Film, User, Video as VideoIcon,
} from 'lucide-react';

const G = '#D4AF37';
const ORANGE = '#D4854A';
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
  { id: 'river',  label: 'River',  hint: 'Calm, neutral' },
  { id: 'honey',  label: 'Honey',  hint: 'Warm, soft' },
  { id: 'sunny',  label: 'Sunny',  hint: 'Bright, upbeat' },
  { id: 'storm',  label: 'Storm',  hint: 'Formal, authoritative' },
  { id: 'spark',  label: 'Spark',  hint: 'Energetic, quick' },
];

const VIDEO_STYLES = [
  { id: 'concert',  name: 'Concert',   prompt: 'live concert performance, stage lights, crowd silhouette, cinematic music video aesthetic' },
  { id: 'rooftop',  name: 'Rooftop',   prompt: 'rooftop music video at golden hour, city skyline, cinematic wide shots' },
  { id: 'studio',   name: 'Studio',    prompt: 'recording studio music video, booth performance, moody lighting' },
  { id: 'animated', name: 'Animated',  prompt: 'stylized animated music video, vibrant illustrated scenes, beat-matched cuts' },
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

export default function StoryMusicVideoStudio() {
  const [genre, setGenre] = useState(GENRES[0]);
  const [structure, setStructure] = useState(STRUCTURES[0]);
  const [voice, setVoice] = useState(VOICES[0]);
  const [videoStyle, setVideoStyle] = useState(VIDEO_STYLES[0]);
  const [topic, setTopic] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [vocalUrl, setVocalUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = React.useRef(null);

  // 1. LLM songwriter → lyrics
  const lyricsMutation = useMutation({
    mutationFn: async ({ topic, genre, structure }) => {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          `Write lyrics for a ${genre} song in "${structure.label}" structure about: "${topic}". ` +
          `Keep it performable (under ~40 lines), vivid, rhythmic, and radio-friendly. ` +
          `Return JSON { "title": string, "lyrics": string } where lyrics includes section markers like [Verse], [Chorus].`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            lyrics: { type: 'string' },
          },
        },
      });
      return res;
    },
    onSuccess: (res) => setLyrics(res.lyrics || ''),
  });

  // 2. TTS vocal track
  const vocalMutation = useMutation({
    mutationFn: async ({ text, voiceId }) => {
      const res = await base44.integrations.Core.GenerateSpeech({
        text: text.slice(0, 5000),
        voice: voiceId,
      });
      return res.url;
    },
    onSuccess: setVocalUrl,
  });

  // 3. Music video clip
  const videoMutation = useMutation({
    mutationFn: async ({ lyricsText, style }) => {
      const prompt =
        `A ${genre} music video: ${style.prompt}. ` +
        `Lip-synced performance of this song, beat-matched cuts, B-roll of the story. ` +
        `Song topic: ${topic}. Cinematic, 8 seconds.`;
      const res = await base44.integrations.Core.GenerateVideo({
        prompt,
        duration: 8,
        aspect_ratio: '16:9',
        generate_audio: false,
      });
      return res.url;
    },
    onSuccess: setVideoUrl,
  });

  const handleProduce = async () => {
    if (!topic.trim()) return;
    // 1. lyrics
    const res = await lyricsMutation.mutateAsync({ topic, genre, structure });
    const lyricText = res.lyrics || '';
    setLyrics(lyricText);
    // 2. vocal + 3. video in parallel
    vocalMutation.mutate({ text: lyricText, voiceId: voice.id });
    videoMutation.mutate({ lyricsText: lyricText, style: videoStyle });
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  };

  const buildExportPack = () => {
    const lines = [
      '═══ STORY / MUSIC VIDEO — EXPORT PACK ═══',
      `Genre:     ${genre}`,
      `Structure: ${structure.label}`,
      `Voice:     ${voice.label} (${voice.hint})`,
      `Video:     ${videoStyle.name}`,
      `Topic:     ${topic || '(enter a topic)'}`,
      '',
      '── Lyrics ──',
      lyrics || '(generate lyrics first)',
      '',
      '── Vocal track (TTS) ──',
      vocalUrl || '(not generated yet)',
      '',
      '── Music video clip ──',
      videoUrl || '(not generated yet)',
      '',
      '── Suno / Udio mapping ──',
      '1. Paste lyrics into Suno / Udio → pick genre + structure',
      '2. Generate full song → download audio + video',
      '── Decart LipSync Live mapping ──',
      '3. Avatar image + generated vocal → live lip-sync virtual camera',
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

  const busy = lyricsMutation.isPending || vocalMutation.isPending || videoMutation.isPending;
  const ready = !!lyrics.trim();

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* BRIEF */}
        <Section title="1 · Song Brief" accent={ORANGE}>
          <input value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic / story (e.g. late-night drive through the city)"
            className="w-full rounded-xl px-3 py-2.5 text-[12px] mb-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff' }} />

          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Genre</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {GENRES.map((g) => (
              <Chip key={g} active={genre === g} onClick={() => setGenre(g)} accent={ORANGE}>{g}</Chip>
            ))}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Structure</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {STRUCTURES.map((s) => (
              <Chip key={s.id} active={structure.id === s.id} onClick={() => setStructure(s)} accent={ORANGE}>{s.label}</Chip>
            ))}
          </div>

          <button
            onClick={async () => {
              if (!topic.trim()) return;
              const res = await lyricsMutation.mutateAsync({ topic, genre, structure });
              if (res.lyrics) setLyrics(res.lyrics);
            }}
            disabled={!topic.trim() || lyricsMutation.isPending}
            className="w-full rounded-xl py-2 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40"
            style={{ background: 'rgba(212,133,74,0.18)', border: `1px solid ${ORANGE}88`, color: ORANGE }}>
            {lyricsMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Write Lyrics (LLM Songwriter)
          </button>
        </Section>

        {/* VOCAL + VIDEO */}
        <Section title="2 · Vocal & Video Style" accent={ORANGE}>
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

          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Video Style</p>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {VIDEO_STYLES.map((s) => {
              const active = videoStyle.id === s.id;
              return (
                <button key={s.id} onClick={() => setVideoStyle(s)}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-left transition-all"
                  style={{ background: active ? 'rgba(212,133,74,0.20)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? ORANGE + 'aa' : 'transparent'}` }}>
                  <Film className="w-3.5 h-3.5 shrink-0" style={{ color: active ? ORANGE : 'rgba(255,255,255,0.4)' }} />
                  <span className="text-[10px] font-bold uppercase" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{s.name}</span>
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      {/* LYRICS */}
      <Section title="3 · Lyrics" accent={ORANGE}>
        <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)}
          placeholder="Generated lyrics appear here — or write your own…"
          rows={8}
          className="w-full rounded-xl px-3 py-2.5 text-[12px] resize-none mono"
          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff', fontFamily: 'Share Tech Mono, monospace' }} />
      </Section>

      {/* PRODUCE + OUTPUTS */}
      <Section title="4 · Produce & Export" accent={ORANGE} right={
        <button onClick={copyExport} className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1.5"
          style={{ background: 'rgba(212,133,74,0.12)', border: `1px solid ${ORANGE}55`, color: ORANGE }}>
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Export Pack</>}
        </button>
      }>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={handleProduce} disabled={!topic.trim() || busy}
            className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${ORANGE}, ${G})`, color: '#fff' }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
            Produce Full Track (Lyrics → Vocal → Video)
          </button>
          <button onClick={() => ready && vocalMutation.mutate({ text: lyrics, voiceId: voice.id })}
            disabled={!ready || vocalMutation.isPending}
            className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.8)' }}>
            {vocalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic2 className="w-4 h-4" />} Re-render Vocal
          </button>
          <button onClick={() => ready && videoMutation.mutate({ lyricsText: lyrics, style: videoStyle })}
            disabled={!ready || videoMutation.isPending}
            className="rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.8)' }}>
            {videoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <VideoIcon className="w-4 h-4" />} Re-render Video
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {/* Vocal */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <Mic2 className="w-3.5 h-3.5" style={{ color: ORANGE }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: ORANGE, fontFamily: 'Barlow Condensed, sans-serif' }}>Vocal Track ({voice.label})</span>
              {vocalMutation.isPending && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: ORANGE }} />}
              {vocalUrl && !vocalMutation.isPending && (
                <button onClick={togglePlay} className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: ORANGE + '22' }}>
                  {playing ? <Pause className="w-3 h-3" style={{ color: ORANGE }} /> : <Play className="w-3 h-3" style={{ color: ORANGE }} />}
                </button>
              )}
            </div>
            <div className="aspect-square flex items-center justify-center p-4">
              {vocalUrl ? (
                <div className="text-center">
                  <Music className="w-10 h-10 mx-auto mb-2" style={{ color: ORANGE }} />
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>TTS vocal ready · tap play</p>
                </div>
              ) : <span className="text-[11px] text-white/30 px-4 text-center">Vocal track appears here (TTS render)</span>}
            </div>
            <audio ref={audioRef} src={vocalUrl || undefined} onEnded={() => setPlaying(false)} className="hidden" />
          </div>
          {/* Music video */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <Film className="w-3.5 h-3.5" style={{ color: G }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>Music Video (8s · 16:9)</span>
              {videoMutation.isPending && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: G }} />}
            </div>
            <div className="aspect-video flex items-center justify-center">
              {videoUrl ? <video src={videoUrl} controls loop autoPlay muted className="w-full h-full object-cover" /> :
                <span className="text-[11px] text-white/30 px-4 text-center">Music video clip appears here (platform-native render)</span>}
            </div>
          </div>
        </div>

        <p className="mt-3 text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <strong style={{ color: ORANGE }}>Both, per module:</strong> lyrics + TTS vocal + an 8-second video clip render in-app where supported.
          For a full studio-quality song, copy the <em>Export Pack</em> into Suno / Udio (lyrics → genre → full song),
          then feed the vocal into Decart LipSync Live with an avatar for a live music-video virtual camera.
        </p>
      </Section>
    </div>
  );
}