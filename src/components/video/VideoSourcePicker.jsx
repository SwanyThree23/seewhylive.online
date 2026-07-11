import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Upload, List, Radio, Link as LinkIcon, X, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TABS = [
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'device',  label: 'Device',  icon: Upload,   color: '#d4af37' },
  { id: 'url',     label: 'URL',     icon: LinkIcon,  color: '#4A8A7A' },
  { id: 'stream',  label: 'Stream',  icon: Radio,     color: '#6DBF7E' },
  { id: 'playlist',label: 'Playlist',icon: List,      color: '#D4AF37' },
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

/**
 * VideoSourcePicker
 * Props:
 *   onSelect(source) — called with { type, url, title, thumbnail }
 *   playlist         — array of { url, title } items
 *   onPlaylistChange — called with updated playlist array
 *   compact          — render as a smaller inline widget
 *   isHost / isCoHost — whether controls are shown
 */
export default function VideoSourcePicker({ onSelect, playlist = [], onPlaylistChange, compact = false, isHost = false, isCoHost = false }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('youtube');
  const [ytUrl, setYtUrl] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const fileRef = useRef(null);

  const canControl = isHost || isCoHost;
  if (!canControl) return null;

  async function handleDeviceUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onSelect({ type: 'direct', url: file_url, title: file.name });
      setOpen(false);
      toast.success('Video uploaded!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function submitYouTube() {
    const id = getYouTubeId(ytUrl);
    if (!id) { toast.error('Invalid YouTube URL'); return; }
    onSelect({ type: 'youtube', url: ytUrl, title: `YouTube: ${id}`, ytId: id });
    setYtUrl('');
    setOpen(false);
  }

  function submitDirect() {
    if (!directUrl.trim()) { toast.error('Enter a URL'); return; }
    onSelect({ type: 'direct', url: directUrl.trim(), title: directUrl.trim() });
    setDirectUrl('');
    setOpen(false);
  }

  function submitStream() {
    if (!streamUrl.trim()) { toast.error('Enter a stream URL'); return; }
    onSelect({ type: 'stream', url: streamUrl.trim(), title: 'Live Stream' });
    setStreamUrl('');
    setOpen(false);
  }

  function addToPlaylist() {
    if (!newPlaylistUrl.trim()) return;
    const updated = [...playlist, { url: newPlaylistUrl.trim(), title: newPlaylistTitle.trim() || newPlaylistUrl.trim() }];
    onPlaylistChange?.(updated);
    setNewPlaylistUrl('');
    setNewPlaylistTitle('');
    toast.success('Added to playlist');
  }

  function removeFromPlaylist(i) {
    const updated = playlist.filter((_, idx) => idx !== i);
    onPlaylistChange?.(updated);
  }

  function playFromPlaylist(item) {
    const type = detectVideoType(item.url);
    const ytId = type === 'youtube' ? getYouTubeId(item.url) : null;
    onSelect({ type, url: item.url, title: item.title, ytId });
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all active:scale-95"
        style={{
          background: 'rgba(212,175,55,0.12)',
          border: '1px solid rgba(212,175,55,0.3)',
          color: '#d4af37',
          fontFamily: 'Barlow Condensed, sans-serif',
        }}
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
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs font-black uppercase text-white/70" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
                Video Source
              </span>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {TABS.map(t => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-black uppercase transition-all"
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      color: active ? t.color : 'rgba(255,255,255,0.3)',
                      borderBottom: active ? `2px solid ${t.color}` : '2px solid transparent',
                      background: active ? t.color + '10' : 'transparent',
                    }}>
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="p-4 space-y-3">
              {tab === 'youtube' && (
                <>
                  <p className="text-[10px] text-white/40">Paste a YouTube video, shorts, or live URL</p>
                  <input
                    placeholder="https://youtube.com/watch?v=..."
                    value={ytUrl}
                    onChange={e => setYtUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitYouTube()}
                    style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 14, background: 'rgba(255,0,0,0.06)', border: '1px solid rgba(255,0,0,0.2)', color: 'white', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                  />
                  {ytUrl && getYouTubeId(ytUrl) && (
                    <img
                      src={`https://img.youtube.com/vi/${getYouTubeId(ytUrl)}/mqdefault.jpg`}
                      className="w-full rounded-lg object-cover" style={{ maxHeight: 100 }}
                      alt="thumbnail"
                    />
                  )}
                  <button onClick={submitYouTube} style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: '#FF0000', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    <Youtube className="w-3.5 h-3.5" /> Play YouTube Video
                  </button>
                </>
              )}

              {tab === 'device' && (
                <>
                  <p className="text-[10px] text-white/40">Upload a video file from your device (mp4, webm, mov)</p>
                  <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleDeviceUpload} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.7 : 1 }}
                  >
                    {uploading ? (
                      <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Uploading...</>
                    ) : (
                      <><Upload className="w-3.5 h-3.5" />Choose Video File</>
                    )}
                  </button>
                </>
              )}

              {tab === 'url' && (
                <>
                  <p className="text-[10px] text-white/40">Paste a direct video URL (mp4, m3u8, etc.)</p>
                  <input
                    placeholder="https://example.com/video.mp4"
                    value={directUrl}
                    onChange={e => setDirectUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitDirect()}
                    style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 14, background: 'rgba(74,138,122,0.05)', border: '1px solid rgba(74,138,122,0.2)', color: 'white', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button onClick={submitDirect} style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: 'rgba(74,138,122,0.15)', color: '#4A8A7A', border: '1px solid rgba(74,138,122,0.3)', borderRadius: 8, cursor: 'pointer' }}>
                    <LinkIcon className="w-3.5 h-3.5" /> Play URL
                  </button>
                </>
              )}

              {tab === 'stream' && (
                <>
                  <p className="text-[10px] text-white/40">Enter an RTMP or HLS stream URL to embed</p>
                  <input
                    placeholder="https://stream.example.com/live.m3u8"
                    value={streamUrl}
                    onChange={e => setStreamUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitStream()}
                    style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 14, background: 'rgba(109,191,126,0.05)', border: '1px solid rgba(109,191,126,0.2)', color: 'white', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button onClick={submitStream} style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: 'rgba(109,191,126,0.15)', color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.3)', borderRadius: 8, cursor: 'pointer' }}>
                    <Radio className="w-3.5 h-3.5" /> Play Stream
                  </button>
                </>
              )}

              {tab === 'playlist' && (
                <>
                  <p className="text-[10px] text-white/40">Build a queue of videos to play in order</p>
                  <div className="space-y-1.5">
                    <input
                      placeholder="Video URL (YouTube or direct)"
                      value={newPlaylistUrl}
                      onChange={e => setNewPlaylistUrl(e.target.value)}
                      style={{ width: '100%', height: 32, padding: '0 10px', fontSize: 12, background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
                    />
                    <div className="flex gap-2">
                      <input
                        placeholder="Title (optional)"
                        value={newPlaylistTitle}
                        onChange={e => setNewPlaylistTitle(e.target.value)}
                        style={{ flex: 1, height: 32, padding: '0 10px', fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
                      />
                      <button onClick={addToPlaylist} style={{ height: 32, padding: '0 12px', background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 6, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
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
                          <button onClick={() => playFromPlaylist(item)} className="flex-1 text-left text-xs text-white/70 hover:text-white truncate transition-colors">
                            {item.title || item.url}
                          </button>
                          <button onClick={() => removeFromPlaylist(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400/60 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-white/20 text-center py-2">No items in playlist yet</p>
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