import React, { useState, useRef } from 'react';

var GOLD  = '#C9A84C';
var CREAM = '#F0E8D4';
var MUTED = 'rgba(255,255,255,0.35)';
var BG    = 'rgba(8,11,24,0.98)';
var CARD  = 'rgba(255,255,255,0.04)';

var TABS = [
  { id: 'youtube',  label: 'YouTube', emoji: '▶',  color: '#FF0000' },
  { id: 'device',   label: 'Device',  emoji: '📂',  color: GOLD },
  { id: 'url',      label: 'URL',     emoji: '🔗',  color: GOLD },
  { id: 'stream',   label: 'Stream',  emoji: '📡',  color: '#6DBF7E' },
  { id: 'playlist', label: 'Queue',   emoji: '📋',  color: GOLD },
];

export function getYouTubeId(url) {
  var m = (url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([^&?/]+)/);
  return m ? m[1] : null;
}

export function detectVideoType(url) {
  if (!url) return 'unknown';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'direct';
}

/**
 * VideoSourcePicker — multi-tab video source selector (no external deps)
 * Props:
 *   onSelect(source)     — { type, url, title, ytId? }
 *   playlist             — array of { url, title }
 *   onPlaylistChange     — called with updated playlist array
 *   compact              — smaller trigger button
 *   isHost / isCoHost
 */
export default function VideoSourcePicker({ onSelect, playlist, onPlaylistChange, compact, isHost, isCoHost }) {
  playlist = playlist || [];
  var [open,             setOpen]             = useState(false);
  var [tab,              setTab]              = useState('youtube');
  var [ytUrl,            setYtUrl]            = useState('');
  var [directUrl,        setDirectUrl]        = useState('');
  var [streamUrl,        setStreamUrl]        = useState('');
  var [uploading,        setUploading]        = useState(false);
  var [newPlaylistUrl,   setNewPlaylistUrl]   = useState('');
  var [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  var [err,              setErr]              = useState('');
  var fileRef = useRef(null);

  var canControl = isHost || isCoHost;
  if (!canControl) return null;

  function showErr(msg) { setErr(msg); setTimeout(function() { setErr(''); }, 3000); }

  function handleDeviceFile(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var blobUrl = URL.createObjectURL(file);
    if (onSelect) onSelect({ type: 'direct', url: blobUrl, title: file.name });
    setOpen(false);
  }

  function submitYouTube() {
    var id = getYouTubeId(ytUrl);
    if (!id) { showErr('Invalid YouTube URL'); return; }
    if (onSelect) onSelect({ type: 'youtube', url: ytUrl, title: 'YouTube: ' + id, ytId: id });
    setYtUrl('');
    setOpen(false);
  }

  function submitDirect() {
    if (!directUrl.trim()) { showErr('Enter a URL'); return; }
    if (onSelect) onSelect({ type: 'direct', url: directUrl.trim(), title: directUrl.trim() });
    setDirectUrl('');
    setOpen(false);
  }

  function submitStream() {
    if (!streamUrl.trim()) { showErr('Enter a stream URL'); return; }
    if (onSelect) onSelect({ type: 'stream', url: streamUrl.trim(), title: 'Live Stream' });
    setStreamUrl('');
    setOpen(false);
  }

  function addToPlaylist() {
    if (!newPlaylistUrl.trim()) return;
    var updated = playlist.concat([{ url: newPlaylistUrl.trim(), title: newPlaylistTitle.trim() || newPlaylistUrl.trim() }]);
    if (onPlaylistChange) onPlaylistChange(updated);
    setNewPlaylistUrl('');
    setNewPlaylistTitle('');
  }

  function removeFromPlaylist(i) {
    var updated = playlist.filter(function(_, idx) { return idx !== i; });
    if (onPlaylistChange) onPlaylistChange(updated);
  }

  function playFromPlaylist(item) {
    var type = detectVideoType(item.url);
    var ytId = type === 'youtube' ? getYouTubeId(item.url) : null;
    if (onSelect) onSelect({ type: type, url: item.url, title: item.title, ytId: ytId });
    setOpen(false);
  }

  var ytThumb = ytUrl && getYouTubeId(ytUrl) ? ('https://img.youtube.com/vi/' + getYouTubeId(ytUrl) + '/mqdefault.jpg') : null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger button */}
      <button
        onClick={function() { setOpen(function(v) { return !v; }); setErr(''); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: compact ? '5px 10px' : '7px 14px',
          borderRadius: 10, cursor: 'pointer',
          background: 'rgba(212,175,55,0.12)',
          border: '1px solid rgba(212,175,55,0.3)',
          color: GOLD,
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
          fontSize: compact ? 11 : 13, letterSpacing: 1,
        }}>
        ▶ {compact ? 'Video' : 'Change Video'}
        <span style={{ fontSize: 9, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
          width: 300, borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          background: BG,
          border: '1px solid rgba(212,175,55,0.18)',
          animation: 'vspFade 0.15s ease',
        }}>
          <style>{'@keyframes vspFade{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}'}</style>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, letterSpacing: 1 }}>VIDEO SOURCE</span>
            <button onClick={function() { setOpen(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 14, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>✕</button>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {TABS.map(function(t) {
              var active = tab === t.id;
              return (
                <button key={t.id} onClick={function() { setTab(t.id); setErr(''); }}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    padding: '6px 2px', border: 'none', cursor: 'pointer',
                    background: active ? (t.color + '10') : 'transparent',
                    borderBottom: '2px solid ' + (active ? t.color : 'transparent'),
                    transition: 'all 0.15s',
                    fontFamily: "'DM Mono',monospace", fontSize: 7,
                    color: active ? t.color : MUTED, letterSpacing: 0.5,
                  }}>
                  <span style={{ fontSize: 12 }}>{t.emoji}</span>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ padding: '12px 14px' }}>
            {err && (
              <div style={{ background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 6, padding: '5px 10px', marginBottom: 8, fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#FF1A3C' }}>
                {err}
              </div>
            )}

            {tab === 'youtube' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, margin: 0 }}>Paste a YouTube video, shorts, or live URL</p>
                <input
                  placeholder="https://youtube.com/watch?v=..."
                  value={ytUrl}
                  onChange={function(e) { setYtUrl(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') submitYouTube(); }}
                  style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, background: 'rgba(255,0,0,0.06)', border: '1px solid rgba(255,0,0,0.2)', color: CREAM, borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                />
                {ytThumb && (
                  <img src={ytThumb} alt="thumbnail" style={{ width: '100%', borderRadius: 8, maxHeight: 90, objectFit: 'cover' }} />
                )}
                <button onClick={submitYouTube} style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: '#FF0000', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}>
                  ▶ Play YouTube Video
                </button>
              </div>
            )}

            {tab === 'device' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, margin: 0 }}>Select a video file from your device (mp4, webm, mov)</p>
                <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleDeviceFile} />
                <button
                  onClick={function() { if (fileRef.current) fileRef.current.click(); }}
                  disabled={uploading}
                  style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: 'rgba(201,168,76,0.15)', color: GOLD, border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.7 : 1, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}
                >
                  📂 Choose Video File
                </button>
              </div>
            )}

            {tab === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, margin: 0 }}>Paste a direct video URL (mp4, m3u8, etc.)</p>
                <input
                  placeholder="https://example.com/video.mp4"
                  value={directUrl}
                  onChange={function(e) { setDirectUrl(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') submitDirect(); }}
                  style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)', color: CREAM, borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                />
                <button onClick={submitDirect} style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: 'rgba(201,168,76,0.15)', color: GOLD, border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, cursor: 'pointer', fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}>
                  🔗 Play URL
                </button>
              </div>
            )}

            {tab === 'stream' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, margin: 0 }}>Enter an HLS stream URL to embed</p>
                <input
                  placeholder="https://stream.example.com/live.m3u8"
                  value={streamUrl}
                  onChange={function(e) { setStreamUrl(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') submitStream(); }}
                  style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, background: 'rgba(109,191,126,0.05)', border: '1px solid rgba(109,191,126,0.2)', color: CREAM, borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                />
                <button onClick={submitStream} style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: 'rgba(109,191,126,0.15)', color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.3)', borderRadius: 8, cursor: 'pointer', fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}>
                  📡 Play Stream
                </button>
              </div>
            )}

            {tab === 'playlist' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, margin: 0 }}>Build a queue of videos to play in order</p>
                <input
                  placeholder="Video URL (YouTube or direct)"
                  value={newPlaylistUrl}
                  onChange={function(e) { setNewPlaylistUrl(e.target.value); }}
                  style={{ width: '100%', height: 30, padding: '0 10px', fontSize: 11, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', color: CREAM, borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    placeholder="Title (optional)"
                    value={newPlaylistTitle}
                    onChange={function(e) { setNewPlaylistTitle(e.target.value); }}
                    style={{ flex: 1, height: 30, padding: '0 10px', fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: CREAM, borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button onClick={addToPlaylist} style={{ height: 30, padding: '0 10px', background: 'rgba(201,168,76,0.2)', color: GOLD, border: '1px solid rgba(201,168,76,0.3)', borderRadius: 6, cursor: 'pointer', flexShrink: 0, fontSize: 14 }}>+</button>
                </div>

                {playlist.length > 0 ? (
                  <div style={{ maxHeight: 130, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {playlist.map(function(item, i) {
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 8, background: CARD, border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, width: 14, flexShrink: 0, textAlign: 'right' }}>{i + 1}</span>
                          <button onClick={function() { playFromPlaylist(item); }} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title || item.url}
                          </button>
                          <button onClick={function() { removeFromPlaylist(i); }} style={{ background: 'none', border: 'none', color: 'rgba(192,57,43,0.5)', fontSize: 12, cursor: 'pointer', padding: '0 2px', flexShrink: 0, lineHeight: 1 }}>🗑</button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(255,255,255,0.15)', textAlign: 'center', margin: '6px 0' }}>No items in queue yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
