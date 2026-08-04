import React, { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import {
  Upload, Music, Play, Pause, Loader2, X, Waves, Check, Clock,
} from 'lucide-react';

const G = '#D4AF37';
const ORANGE = '#D4854A';
const BORDER = 'rgba(212,175,55,0.18)';
const PANEL = '#0D1022';

// Genre → default tempo (BPM) for beat-matched cut estimation when no real BPM is computed
const GENRE_BPM = {
  'Hip-Hop': 88, 'Afrobeats': 104, 'Pop': 120, 'R&B': 72,
  'Country': 100, 'EDM': 128, 'Lo-Fi': 75,
};

// ── Lightweight real waveform + BPM estimate via Web Audio ───────────────────
function analyzeAudio(file) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          const ctx = new Ctx();
          const buf = await ctx.decodeAudioData(reader.result);
          const ch = buf.getChannelData(0);
          const sampleRate = buf.sampleRate;
          // Downsample to 96 buckets for waveform display
          const BUCKETS = 96;
          const block = Math.floor(ch.length / BUCKETS);
          const peaks = [];
          let max = 0.0001;
          for (let i = 0; i < BUCKETS; i++) {
            let peak = 0;
            const start = i * block;
            for (let j = 0; j < block; j += 64) {
              const v = Math.abs(ch[start + j] || 0);
              if (v > peak) peak = v;
            }
            peaks.push(peak);
            if (peak > max) max = peak;
          }
          // Crude BPM estimate via autocorrelation on low-rate envelope
          let bpm = 0;
          try {
            // build a low-rate amplitude envelope (~100 Hz)
            const envRate = 100;
            const envLen = Math.floor((ch.length / sampleRate) * envRate);
            const env = new Float32Array(envLen);
            const win = Math.floor(sampleRate / envRate);
            for (let i = 0; i < envLen; i++) {
              let s = 0;
              const st = i * win;
              for (let j = 0; j < win; j += 40) s += Math.abs(ch[st + j] || 0);
              env[i] = s / (win / 40);
            }
            // autocorrelate between 60 and 180 BPM
            const minLag = Math.floor(envRate * 60 / 180);
            const maxLag = Math.floor(envRate * 60 / 60);
            let bestLag = 0, bestCorr = 0;
            for (let lag = minLag; lag <= maxLag; lag++) {
              let c = 0;
              for (let i = 0; i < envLen - lag; i++) c += env[i] * env[i + lag];
              if (c > bestCorr) { bestCorr = c; bestLag = lag; }
            }
            if (bestLag) bpm = Math.round(60 * envRate / bestLag);
          } catch {}
          ctx.close();
          resolve({
            peaks: peaks.map((p) => p / max),
            duration: buf.duration,
            bpm: bpm || 0,
            sampleRate,
          });
        } catch (e) {
          resolve({ peaks: null, duration: 0, bpm: 0, sampleRate: 0 });
        }
      };
      reader.onerror = () => resolve({ peaks: null, duration: 0, bpm: 0, sampleRate: 0 });
      reader.readAsArrayBuffer(file);
    } catch {
      resolve({ peaks: null, duration: 0, bpm: 0, sampleRate: 0 });
    }
  });
}

function Waveform({ peaks, progress = 0, accent = ORANGE }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !peaks) return;
    const ctx = c.getContext('2d');
    const W = c.width = c.clientWidth * 2;
    const H = c.height = 40 * 2;
    ctx.clearRect(0, 0, W, H);
    const n = peaks.length;
    const barW = W / n;
    const playedX = W * progress;
    for (let i = 0; i < n; i++) {
      const h = Math.max(2, peaks[i] * H * 0.9);
      const x = i * barW;
      ctx.fillStyle = x <= playedX ? accent : 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 1, (H - h) / 2, barW - 2, h);
    }
  }, [peaks, progress, accent]);
  if (!peaks) return null;
  return <canvas ref={canvasRef} className="w-full" style={{ height: 40 }} />;
}

export default function TrackUploader({ trackUrl, trackMeta, onTrack, onClear, accent = ORANGE, genre }) {
  const [dragOver, setDragOver] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyze, setAnalyze] = useState(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);

  const uploadMut = useMutation({
    mutationFn: async (file) => {
      const res = await base44.integrations.Core.UploadFile({ file });
      return res.file_url;
    },
  });

  const onFile = useCallback(async (file) => {
    if (!file) return;
    // analyze locally first (waveform + duration + bpm)
    const a = await analyzeAudio(file);
    setAnalyze(a);
    // upload to platform storage
    const url = await uploadMut.mutateAsync(file);
    const bpm = a.bpm || (genre ? GENRE_BPM[genre] : 0) || 0;
    onTrack(url, { name: file.name, duration: a.duration || 0, bpm, peaks: a.peaks });
  }, [genre, onTrack]);

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.duration ? a.currentTime / a.duration : 0);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('ended', onEnd); };
  }, [trackUrl]);

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60); const r = Math.round(s % 60);
    return `${m}:${r < 10 ? '0' : ''}${r}`;
  };

  const peaks = trackMeta?.peaks || analyze?.peaks;
  const bpm = trackMeta?.bpm || 0;

  return (
    <div>
      <input ref={inputRef} type="file" accept="audio/*" className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])} />

      {!trackUrl ? (
        <button onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="w-full rounded-2xl border-2 border-dashed py-6 px-4 flex flex-col items-center gap-2 transition-all"
          style={{
            borderColor: dragOver ? accent : 'rgba(255,255,255,0.15)',
            background: dragOver ? `${accent}12` : 'rgba(255,255,255,0.02)',
          }}>
          {uploadMut.isPending
            ? <Loader2 className="w-6 h-6 animate-spin" style={{ color: accent }} />
            : <Upload className="w-6 h-6" style={{ color: accent }} />}
          <span className="text-[12px] font-black uppercase tracking-wider" style={{ color: accent, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Drop a track or tap to upload
          </span>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>MP3 · WAV · M4A · OGG — up to 25MB</span>
        </button>
      ) : (
        <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <button onClick={togglePlay}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: accent + '22', border: `1px solid ${accent}55` }}>
              {playing ? <Pause className="w-4 h-4" style={{ color: accent }} /> : <Play className="w-4 h-4" style={{ color: accent }} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Music className="w-3 h-3 shrink-0" style={{ color: accent }} />
                <span className="text-[11px] font-bold truncate" style={{ color: '#fff' }}>{trackMeta?.name || 'Uploaded track'}</span>
              </div>
              {peaks
                ? <Waveform peaks={peaks} progress={progress} accent={accent} />
                : <div className="h-10 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />}
            </div>
            <button onClick={onClear}
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-2 px-1">
            <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              <Clock className="w-2.5 h-2.5" /> {fmt(trackMeta?.duration || 0)}
            </span>
            {bpm > 0 && (
              <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: accent, fontFamily: 'Barlow Condensed, sans-serif' }}>
                <Waves className="w-2.5 h-2.5" /> {bpm} BPM
              </span>
            )}
            <span className="ml-auto text-[9px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Check className="w-2.5 h-2.5" style={{ color: '#6DBF7E' }} /> Uploaded
            </span>
          </div>
          <audio ref={audioRef} src={trackUrl} className="hidden" />
        </div>
      )}
    </div>
  );
}