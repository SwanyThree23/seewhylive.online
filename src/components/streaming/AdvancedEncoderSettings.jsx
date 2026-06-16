import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown, ChevronUp, Zap, Cpu, Clock, Wifi } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const CODEC_OPTIONS = [
  { value: 'h264',  label: 'H.264 / AVC',  desc: 'Best compatibility' },
  { value: 'h265',  label: 'H.265 / HEVC', desc: 'Better compression, less compatible' },
  { value: 'vp9',   label: 'VP9',           desc: 'Open, good for WebRTC' },
  { value: 'av1',   label: 'AV1',           desc: 'Next-gen, high CPU usage' },
];

const AUDIO_CODEC_OPTIONS = [
  { value: 'aac',   label: 'AAC',   desc: 'Standard, universal support' },
  { value: 'opus',  label: 'Opus',  desc: 'Best for WebRTC / low latency' },
  { value: 'mp3',   label: 'MP3',   desc: 'Legacy compatibility' },
];

const KEYFRAME_OPTIONS = [2, 3, 4, 6];

const LATENCY_PROFILES = [
  { key: 'ultra',   label: 'Ultra Low',  desc: '< 1s',       bufferMs: 200,  note: 'WebRTC / peer-to-peer' },
  { key: 'low',     label: 'Low',        desc: '2-4s',        bufferMs: 500,  note: 'Recommended for interaction' },
  { key: 'normal',  label: 'Normal',     desc: '6-10s',       bufferMs: 1000, note: 'Stable, default CDN' },
  { key: 'safe',    label: 'Safe',       desc: '15-30s',      bufferMs: 3000, note: 'Max stability, RTMP' },
];

const PRESET_CONFIGS = [
  { name: '480p · Mobile',     resolution: '854x480',   bitrate: 1500,  fps: 30, audioBitrate: 96  },
  { name: '720p · Standard',   resolution: '1280x720',  bitrate: 3000,  fps: 30, audioBitrate: 128 },
  { name: '1080p · HD',        resolution: '1920x1080', bitrate: 5000,  fps: 60, audioBitrate: 160 },
  { name: '1080p · Broadcast', resolution: '1920x1080', bitrate: 8000,  fps: 60, audioBitrate: 320 },
  { name: '1440p · Ultra',     resolution: '2560x1440', bitrate: 12000, fps: 60, audioBitrate: 320 },
];

function SliderRow({ label, value, min, max, step = 1, unit = '', onChange, color = G }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold" style={T}>{label}</p>
        <span className="text-[11px] font-black font-mono" style={{ color }}>{value.toLocaleString()}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color, background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)` }}
      />
      <div className="flex justify-between text-[9px] text-white/20" style={T}>
        <span>{min.toLocaleString()}{unit}</span><span>{max.toLocaleString()}{unit}</span>
      </div>
    </div>
  );
}

export default function AdvancedEncoderSettings({ onApply }) {
  const [expanded, setExpanded] = useState(false);
  const [section, setSection] = useState('video'); // 'video' | 'audio' | 'latency'

  const [videoBitrate, setVideoBitrate] = useState(5000);
  const [fps, setFps] = useState(60);
  const [resolution, setResolution] = useState('1920x1080');
  const [codec, setCodec] = useState('h264');
  const [keyframeInterval, setKeyframeInterval] = useState(2);
  const [bFrames, setBFrames] = useState(2);
  const [preset, setPreset] = useState('medium'); // x264 encoding speed

  const [audioBitrate, setAudioBitrate] = useState(160);
  const [audioCodec, setAudioCodec] = useState('aac');
  const [sampleRate, setSampleRate] = useState(48000);
  const [channels, setChannels] = useState(2);

  const [latencyProfile, setLatencyProfile] = useState('low');
  const [dvr, setDvr] = useState(false);
  const [adaptiveBitrate, setAdaptiveBitrate] = useState(true);

  const applySettings = () => {
    const config = {
      video: { bitrate: videoBitrate, fps, resolution, codec, keyframeInterval, bFrames, encoderPreset: preset },
      audio: { bitrate: audioBitrate, codec: audioCodec, sampleRate, channels },
      latency: { profile: latencyProfile, dvr, adaptiveBitrate },
    };
    onApply?.(config);
    toast.success('Encoder settings applied');
  };

  const applyPreset = (p) => {
    setResolution(p.resolution);
    setVideoBitrate(p.bitrate);
    setFps(p.fps);
    setAudioBitrate(p.audioBitrate);
    toast.success(`Applied: ${p.name}`);
  };

  const SECTIONS = [
    { key: 'video',   icon: <Cpu className="w-3 h-3" />,   label: 'Video' },
    { key: 'audio',   icon: <Zap className="w-3 h-3" />,   label: 'Audio' },
    { key: 'latency', icon: <Wifi className="w-3 h-3" />,  label: 'Latency' },
  ];

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all"
        style={{
          background: expanded ? `${G}08` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${expanded ? `${G}30` : 'rgba(255,255,255,0.08)'}`,
        }}
      >
        <div className="flex items-center gap-2">
          <Settings className="w-3.5 h-3.5" style={{ color: expanded ? G : 'rgba(255,255,255,0.3)' }} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ ...T, color: expanded ? G : 'rgba(255,255,255,0.5)' }}>
            Advanced Encoder
          </span>
          <span className="text-[9px] text-white/30 font-mono">{resolution} · {videoBitrate}kbps · {fps}fps</span>
        </div>
        {expanded ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3 rounded-lg" style={{ background: 'rgba(8,11,24,0.9)', border: `1px solid ${G}15` }}>
              {/* Quick presets */}
              <div>
                <p className="text-[9px] uppercase text-white/25 mb-1.5 font-bold" style={T}>Quick Presets</p>
                <div className="flex gap-1 flex-wrap">
                  {PRESET_CONFIGS.map(p => (
                    <button key={p.name} onClick={() => applyPreset(p)}
                      className="px-2 py-1 rounded text-[9px] font-bold transition-all"
                      style={{
                        background: resolution === p.resolution && videoBitrate === p.bitrate ? `${G}20` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${resolution === p.resolution && videoBitrate === p.bitrate ? `${G}40` : 'rgba(255,255,255,0.07)'}`,
                        color: resolution === p.resolution && videoBitrate === p.bitrate ? G : 'rgba(255,255,255,0.4)',
                        ...T,
                      }}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section tabs */}
              <div className="flex gap-0 p-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {SECTIONS.map(s => (
                  <button key={s.key} onClick={() => setSection(s.key)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-black uppercase transition-all"
                    style={{
                      background: section === s.key ? `${G}20` : 'transparent',
                      border: section === s.key ? `1px solid ${G}35` : '1px solid transparent',
                      color: section === s.key ? G : 'rgba(255,255,255,0.35)',
                      ...T,
                    }}>
                    {s.icon}{s.label}
                  </button>
                ))}
              </div>

              {/* Video section */}
              {section === 'video' && (
                <div className="space-y-4">
                  <SliderRow label="Video Bitrate" value={videoBitrate} min={500} max={20000} step={500} unit=" kbps" onChange={setVideoBitrate} />
                  <SliderRow label="Frame Rate" value={fps} min={15} max={60} step={5} unit=" fps" onChange={setFps} color="#6DBF7E" />

                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold" style={T}>Resolution</p>
                    <div className="grid grid-cols-3 gap-1">
                      {['854x480', '1280x720', '1920x1080', '2560x1440', '3840x2160'].map(r => (
                        <button key={r} onClick={() => setResolution(r)}
                          className="py-1 rounded text-[9px] font-bold transition-all"
                          style={{
                            background: resolution === r ? `${G}20` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${resolution === r ? `${G}40` : 'rgba(255,255,255,0.07)'}`,
                            color: resolution === r ? G : 'rgba(255,255,255,0.4)',
                            ...T,
                          }}>
                          {r.split('x')[1]}p
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold" style={T}>Video Codec</p>
                    <div className="grid grid-cols-2 gap-1">
                      {CODEC_OPTIONS.map(c => (
                        <button key={c.value} onClick={() => setCodec(c.value)}
                          className="px-2 py-1.5 rounded text-left transition-all"
                          style={{
                            background: codec === c.value ? `${G}15` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${codec === c.value ? `${G}40` : 'rgba(255,255,255,0.07)'}`,
                          }}>
                          <p className="text-[10px] font-black" style={{ color: codec === c.value ? G : 'rgba(255,255,255,0.6)', ...T }}>{c.label}</p>
                          <p className="text-[9px] text-white/30">{c.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold" style={T}>Keyframe (s)</p>
                      <div className="flex gap-1">
                        {KEYFRAME_OPTIONS.map(k => (
                          <button key={k} onClick={() => setKeyframeInterval(k)}
                            className="flex-1 py-1 rounded text-[10px] font-black transition-all"
                            style={{ background: keyframeInterval === k ? `${G}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${keyframeInterval === k ? `${G}40` : 'rgba(255,255,255,0.07)'}`, color: keyframeInterval === k ? G : 'rgba(255,255,255,0.35)', ...T }}>
                            {k}s
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold" style={T}>B-Frames</p>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map(b => (
                          <button key={b} onClick={() => setBFrames(b)}
                            className="flex-1 py-1 rounded text-[10px] font-black transition-all"
                            style={{ background: bFrames === b ? `${G}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${bFrames === b ? `${G}40` : 'rgba(255,255,255,0.07)'}`, color: bFrames === b ? G : 'rgba(255,255,255,0.35)', ...T }}>
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold" style={T}>Encoder Speed (CPU vs Quality)</p>
                    <div className="flex gap-1 flex-wrap">
                      {['ultrafast','superfast','fast','medium','slow','veryslow'].map(p => (
                        <button key={p} onClick={() => setPreset(p)}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold transition-all"
                          style={{ background: preset === p ? `${G}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${preset === p ? `${G}40` : 'rgba(255,255,255,0.07)'}`, color: preset === p ? G : 'rgba(255,255,255,0.35)', ...T }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Audio section */}
              {section === 'audio' && (
                <div className="space-y-4">
                  <SliderRow label="Audio Bitrate" value={audioBitrate} min={64} max={320} step={32} unit=" kbps" onChange={setAudioBitrate} color="#6DBF7E" />

                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold" style={T}>Audio Codec</p>
                    <div className="space-y-1">
                      {AUDIO_CODEC_OPTIONS.map(c => (
                        <button key={c.value} onClick={() => setAudioCodec(c.value)}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded transition-all text-left"
                          style={{ background: audioCodec === c.value ? `${G}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${audioCodec === c.value ? `${G}40` : 'rgba(255,255,255,0.07)'}` }}>
                          <div>
                            <p className="text-[10px] font-black" style={{ color: audioCodec === c.value ? G : 'rgba(255,255,255,0.6)', ...T }}>{c.label}</p>
                            <p className="text-[9px] text-white/30">{c.desc}</p>
                          </div>
                          {audioCodec === c.value && <div className="w-1.5 h-1.5 rounded-full" style={{ background: G }} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold" style={T}>Sample Rate</p>
                      <div className="space-y-1">
                        {[44100, 48000].map(r => (
                          <button key={r} onClick={() => setSampleRate(r)}
                            className="w-full py-1 rounded text-[10px] font-black transition-all"
                            style={{ background: sampleRate === r ? `${G}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${sampleRate === r ? `${G}40` : 'rgba(255,255,255,0.07)'}`, color: sampleRate === r ? G : 'rgba(255,255,255,0.35)', ...T }}>
                            {r / 1000}kHz
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold" style={T}>Channels</p>
                      <div className="space-y-1">
                        {[[1, 'Mono'], [2, 'Stereo']].map(([n, label]) => (
                          <button key={n} onClick={() => setChannels(n)}
                            className="w-full py-1 rounded text-[10px] font-black transition-all"
                            style={{ background: channels === n ? `${G}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${channels === n ? `${G}40` : 'rgba(255,255,255,0.07)'}`, color: channels === n ? G : 'rgba(255,255,255,0.35)', ...T }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Latency section */}
              {section === 'latency' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold" style={T}>Latency Profile</p>
                    <div className="space-y-1.5">
                      {LATENCY_PROFILES.map(lp => (
                        <button key={lp.key} onClick={() => setLatencyProfile(lp.key)}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded transition-all text-left"
                          style={{
                            background: latencyProfile === lp.key ? `${G}12` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${latencyProfile === lp.key ? `${G}40` : 'rgba(255,255,255,0.07)'}`,
                          }}>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-black" style={{ color: latencyProfile === lp.key ? G : 'rgba(255,255,255,0.6)', ...T }}>
                                {lp.label}
                              </p>
                              <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                                {lp.desc}
                              </span>
                            </div>
                            <p className="text-[9px] text-white/25 mt-0.5">{lp.note}</p>
                          </div>
                          {latencyProfile === lp.key && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: G }} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DVR toggle */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <p className="text-[10px] font-black text-white/70" style={T}>DVR / Rewind</p>
                      <p className="text-[9px] text-white/25">Allow viewers to rewind live stream</p>
                    </div>
                    <button onClick={() => setDvr(d => !d)}
                      className="w-9 h-5 rounded-full relative transition-all flex-shrink-0"
                      style={{ background: dvr ? G : 'rgba(255,255,255,0.1)' }}>
                      <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: dvr ? 'calc(100% - 18px)' : 2 }} />
                    </button>
                  </div>

                  {/* Adaptive bitrate toggle */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <p className="text-[10px] font-black text-white/70" style={T}>Adaptive Bitrate (ABR)</p>
                      <p className="text-[9px] text-white/25">Auto-adjust quality for viewer connection</p>
                    </div>
                    <button onClick={() => setAdaptiveBitrate(a => !a)}
                      className="w-9 h-5 rounded-full relative transition-all flex-shrink-0"
                      style={{ background: adaptiveBitrate ? G : 'rgba(255,255,255,0.1)' }}>
                      <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: adaptiveBitrate ? 'calc(100% - 18px)' : 2 }} />
                    </button>
                  </div>

                  {/* Buffer size display */}
                  <div className="px-3 py-2 rounded-lg" style={{ background: `${G}06`, border: `1px solid ${G}15` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40" style={T}>Buffer Size</span>
                      <span className="text-[11px] font-black font-mono" style={{ color: G }}>
                        {LATENCY_PROFILES.find(l => l.key === latencyProfile)?.bufferMs}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-white/40" style={T}>Expected Delay</span>
                      <span className="text-[11px] font-black font-mono" style={{ color: G }}>
                        {LATENCY_PROFILES.find(l => l.key === latencyProfile)?.desc}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Apply button */}
              <button
                onClick={applySettings}
                className="w-full py-2 rounded text-[11px] font-black uppercase transition-all"
                style={{ background: G, color: '#000', ...T }}
              >
                Apply Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
