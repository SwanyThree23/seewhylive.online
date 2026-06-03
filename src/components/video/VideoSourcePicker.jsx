import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Upload, List, Radio, Link as LinkIcon, X, ChevronDown, Plus, Trash2, Twitch, Tv2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TABS = [
  { id: 'youtube',  label: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'device',   label: 'Device',  icon: Upload,  color: '#d4af37' },
  { id: 'url',      label: 'URL',     icon: LinkIcon, color: '#00d4ff' },
  { id: 'stream',   label: 'Live',    icon: Radio,    color: '#00FF88' },
  { id: 'playlist', label: 'Queue',   icon: List,     color: '#8B5CF6' },
];

export function getYouTubeId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([^&?/]+)/);
  return m ? m[1] : null;
}

export function detectVideoType(url) {
  if (!url) return 'unknown';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'direct';
}

const LIVE_PRESETS = [
  { label: 'Twitch', color: '#9146FF', placeholder: 'https://player.twitch.tv/?channel=username' },
  { label: 'Kick', color: '#53FC18', placeholder: 'https://player.kick.com/channel' },
  { label: 'HLS/m3u8', color: '#00FF88', placeholder: 'https://stream.example.com/live.m3u8' },
  { label: 'Custom', color: '#00d4ff', placeholder: 'rtmp://... or https://...' },
];

function UploadZone({ onFile, uploading, uploadPct }) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="video/*,audio/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#d4af37' : uploading ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.2)'}`,
          borderRadius: 12,
          padding: '20px 12px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: dragging ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.2s',
        }}
      >
        {uploading ? (
          <>
            <div style={{ width: 20, height: 20, border: '2px solid #d4af37', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
            <p style={{ color: '#d4af37', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
              Uploading {uploadPct > 0 ? uploadPct + '%' : '…'}
            </p>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: uploadPct + '%' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #800020, #d4af37)', borderRadius: 2 }}
              />
            </div>
          </>
        ) : (
          <>
            <Upload style={{ margin: '0 auto 8px', color: '#d4af37', opacity: 0.6, width: 22, height: 22 }} />
            <p style={{ color: '#d4af37', fontSize: 13, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>
              {dragging ? 'Drop to upload' : 'Click or drag & drop'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 3, fontFamily: 'Barlow Condensed, sans-serif' }}>
              MP4 · WebM · MOV · MP3 · WAV
            </p>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

export default function VideoSourcePicker({ onSelect, playlist = [], onPlaylistChange, compact = false, isHost = false, isCoHost = false }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('youtube');
  const [ytUrl, setYtUrl] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamPreset, setStreamPreset] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');

  const canControl = isHost || isCoHost;
  if (!canControl) return null;

  async function handleFileUpload(file) {
    setUploading(true);
    setUploadPct(0);
    // Simulate progress while upload runs
    const prog = setInterval(() => setUploadPct(p => Math.min(p + 12, 88)), 300);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      clearInterval(prog);
      setUploadPct(100);
      setTimeout(() => { setUploadPct(0); setUploading(false); }, 400);
      const isAudio = file.type.startsWith('audio/');
      onSelect({ type: isAudio ? 'audio' : 'direct', url: file_url, title: file.name });
      setOpen(false);
      toast.success(`${isAudio ? '🎵' : '🎬'} ${file.name} uploaded!`);
    } catch (err) {
      clearInterval(prog);
      setUploadPct(0);
      setUploading(false);
      toast.error('Upload failed — check file size');
    }
  }

  function submitYouTube() {
    const id = getYouTubeId(ytUrl);
    if (!id) { toast.error('Invalid YouTube URL'); return; }
    onSelect({ type: 'youtube', url: ytUrl, title: `YouTube: ${id}`, ytId: id });
    setYtUrl(''); setOpen(false);
  }

  function submitDirect() {
    if (!directUrl.trim()) { toast.error('Enter a URL'); return; }
    onSelect({ type: 'direct', url: directUrl.trim(), title: directUrl.trim() });
    setDirectUrl(''); setOpen(false);
  }

  function submitStream() {
    if (!streamUrl.trim()) { toast.error('Enter a stream URL'); return; }
    const preset = LIVE_PRESETS[streamPreset];
    onSelect({ type: 'stream', url: streamUrl.trim(), title: `${preset.label} Live Stream` });
    setStreamUrl(''); setOpen(false);
  }

  function addToPlaylist() {
    if (!newPlaylistUrl.trim()) return;
    onPlaylistChange?.([...playlist, { url: newPlaylistUrl.trim(), title: newPlaylistTitle.trim() || newPlaylistUrl.trim() }]);
    setNewPlaylistUrl(''); setNewPlaylistTitle('');
    toast.success('Added to queue');
  }

  function removeFromPlaylist(i) {
    onPlaylistChange?.(playlist.filter((_, idx) => idx !== i));
  }

  function playFromPlaylist(item) {
    const type = detectVideoType(item.url);
    onSelect({ type, url: item.url, title: item.title, ytId: type === 'youtube' ? getYouTubeId(item.url) : null });
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all active:scale-95"
        style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}
      >
        <Youtube className="w-3.5 h-3.5" />
        {compact ? 'Video' : 'Change Video'}
        <ChevronDown className="w-3 h-3" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 z-50 w-80 rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'rgba(13,6,24,0.98)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs font-black uppercase text-white/70" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Video Source</span>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {TABS.map(t => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-black uppercase transition-all"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', color: active ? t.color : 'rgba(255,255,255,0.3)', borderBottom: active ? `2px solid ${t.color}` : '2px solid transparent', background: active ? t.color + '10' : 'transparent' }}>
                    <Icon className="w-3.5 h-3.5" />{t.label}
                  </button>
                );
              })}
            </div>

            <div className="p-4 space-y-3">
              {tab === 'youtube' && (
                <>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>YouTube video, shorts, or live URL</p>
                  <input placeholder="https://youtube.com/watch?v=..." value={ytUrl} onChange={e => setYtUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitYouTube()}
                    style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 14, background: 'rgba(255,0,0,0.06)', border: '1px solid rgba(255,0,0,0.2)', color: 'white', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
                  {ytUrl && getYouTubeId(ytUrl) && (
                    <img src={`https://img.youtube.com/vi/${getYouTubeId(ytUrl)}/mqdefault.jpg`} className="w-full rounded-lg object-cover" style={{ maxHeight: 100 }} alt="thumbnail" />
                  )}
                  <button onClick={submitYouTube} style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: '#FF0000', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    <Youtube className="w-3.5 h-3.5" /> Play YouTube Video
                  </button>
                </>
              )}

              {tab === 'device' && (
                <>
                  <UploadZone onFile={handleFileUpload} uploading={uploading} uploadPct={uploadPct} />
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Video is uploaded to your media library and streamed to all viewers
                  </p>
                </>
              )}

              {tab === 'url' && (
                <>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Direct video URL (mp4, m3u8, webm)</p>
                  <input placeholder="https://example.com/video.mp4" value={directUrl} onChange={e => setDirectUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitDirect()}
                    style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 14, background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', color: 'white', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
                  <button onClick={submitDirect} style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8, cursor: 'pointer' }}>
                    <LinkIcon className="w-3.5 h-3.5" /> Play URL
                  </button>
                </>
              )}

              {tab === 'stream' && (
                <>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Embed a live stream by URL</p>
                  {/* Preset chips */}
                  <div className="flex gap-1.5 flex-wrap">
                    {LIVE_PRESETS.map((p, i) => (
                      <button key={p.label} onClick={() => setStreamPreset(i)}
                        style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif', cursor: 'pointer', transition: 'all 0.15s', background: streamPreset === i ? p.color + '22' : 'rgba(255,255,255,0.04)', border: `1px solid ${streamPreset === i ? p.color + '66' : 'rgba(255,255,255,0.1)'}`, color: streamPreset === i ? p.color : 'rgba(255,255,255,0.4)' }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input
                    placeholder={LIVE_PRESETS[streamPreset].placeholder}
                    value={streamUrl} onChange={e => setStreamUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitStream()}
                    style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 13, background: `rgba(0,255,136,0.04)`, border: `1px solid ${LIVE_PRESETS[streamPreset].color}33`, color: 'white', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button onClick={submitStream} style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: `${LIVE_PRESETS[streamPreset].color}20`, color: LIVE_PRESETS[streamPreset].color, border: `1px solid ${LIVE_PRESETS[streamPreset].color}40`, borderRadius: 8, cursor: 'pointer' }}>
                    <Radio className="w-3.5 h-3.5" /> Embed {LIVE_PRESETS[streamPreset].label} Stream
                  </button>
                </>
              )}

              {tab === 'playlist' && (
                <>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Build a queue of videos to play in order</p>
                  <div className="space-y-1.5">
                    <input placeholder="Video URL (YouTube or direct)" value={newPlaylistUrl} onChange={e => setNewPlaylistUrl(e.target.value)}
                      style={{ width: '100%', height: 32, padding: '0 10px', fontSize: 12, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }} />
                    <div className="flex gap-2">
                      <input placeholder="Title (optional)" value={newPlaylistTitle} onChange={e => setNewPlaylistTitle(e.target.value)}
                        style={{ flex: 1, height: 32, padding: '0 10px', fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }} />
                      <button onClick={addToPlaylist} style={{ height: 32, padding: '0 12px', background: 'rgba(139,92,246,0.2)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 6, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {playlist.length > 0 ? (
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {playlist.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg group"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span className="text-[10px] text-white/30 w-4 shrink-0">{i + 1}</span>
                          <button onClick={() => playFromPlaylist(item)} className="flex-1 text-left text-xs text-white/70 hover:text-white truncate transition-colors">{item.title || item.url}</button>
                          <button onClick={() => removeFromPlaylist(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400/60 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-white/20 text-center py-2">No items in queue yet</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
