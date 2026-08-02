import React, { useState, useEffect, useRef } from 'react';
import { listClips, loadClip, deleteClip } from '../clipStore.js';

var BG     = '#0E0C09';
var CARD   = '#241C12';
var CARD2  = '#2E2318';
var BORDER = 'rgba(201,168,76,.12)';
var GOLD   = '#C9A84C';
var BURG   = '#800020';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';
var RED    = '#FF1A3C';
var TEAL   = '#D4854A';

function fmtDur(s) {
  s = Math.floor(s) || 0;
  var m = Math.floor(s / 60);
  var sec = s % 60;
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}
function fmtTs(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ClipGalleryPage({ onBack, addToast }) {
  var [clips, setClips]         = useState([]);
  var [selected, setSelected]   = useState(null);   // meta object
  var [blobUrl, setBlobUrl]     = useState(null);    // object URL for video playback
  var [loading, setLoading]     = useState(false);
  var [deleting, setDeleting]   = useState(null);
  var [search, setSearch]       = useState('');
  var videoRef = useRef(null);

  useEffect(function() {
    setClips(listClips());
  }, []);

  useEffect(function() {
    return function() {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  function openClip(meta) {
    if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); }
    setSelected(meta);
    if (!meta.url) {
      setLoading(true);
      loadClip(meta.id).then(function(blob) {
        if (blob) {
          var url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
        setLoading(false);
      }).catch(function() { setLoading(false); });
    }
  }

  function downloadClip(meta) {
    if (meta.url) {
      var a = document.createElement('a');
      a.href = meta.url;
      a.download = (meta.label || 'clip') + '.mp4';
      a.click();
      return;
    }
    setLoading(true);
    loadClip(meta.id).then(function(blob) {
      setLoading(false);
      if (!blob) { if (addToast) addToast('Clip not found', 'error'); return; }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = (meta.label || 'clip') + '.webm';
      a.click();
      setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
    }).catch(function() { setLoading(false); });
  }

  function removeClip(meta) {
    setDeleting(meta.id);
    deleteClip(meta.id).then(function() {
      setClips(listClips());
      if (selected && selected.id === meta.id) {
        setSelected(null);
        if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); }
      }
      setDeleting(null);
      if (addToast) addToast('🎬 Clip deleted', 'info');
    }).catch(function() { setDeleting(null); });
  }

  var filtered = clips.filter(function(c) {
    if (!search.trim()) return true;
    return (c.label || '').toLowerCase().indexOf(search.toLowerCase()) >= 0;
  });

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Barlow Condensed',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=DM+Mono&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(201,168,76,.25); border-radius: 99px; }
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Header */}
      <div style={{ background: CARD, borderBottom: '1px solid ' + BORDER, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 6px 0 0' }}>←</button>
        )}
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: GOLD, letterSpacing: 2 }}>🎬 CLIP GALLERY</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginLeft: 4 }}>{clips.length} CLIP{clips.length !== 1 ? 'S' : ''}</div>
        <div style={{ flex: 1 }} />
        <input
          value={search}
          onChange={function(e) { setSearch(e.target.value); }}
          placeholder="Search clips…"
          style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '7px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none', width: 180 }}
        />
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 57px)' }}>
        {/* Sidebar — clip list */}
        <div style={{ width: 280, flexShrink: 0, overflowY: 'auto', borderRight: '1px solid ' + BORDER, padding: '12px 10px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: MUTED }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎬</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 600 }}>{search ? 'No results' : 'No clips saved yet'}</div>
              {!search && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, marginTop: 6, lineHeight: 1.6 }}>Pin clips from the live room<br />using the 🎬 Clip Pin button.</div>}
            </div>
          ) : (
            filtered.map(function(meta) {
              var isSelected = selected && selected.id === meta.id;
              return (
                <div key={meta.id} onClick={function() { openClip(meta); }}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 10px', borderRadius: 10, marginBottom: 4, background: isSelected ? 'rgba(201,168,76,.1)' : 'transparent', border: '1px solid ' + (isSelected ? GOLD + '55' : 'transparent'), cursor: 'pointer', transition: 'background .15s', animation: 'fadeIn .2s ease' }}>
                  {/* Thumbnail */}
                  <div style={{ width: 54, height: 40, borderRadius: 7, background: 'linear-gradient(135deg,' + BURG + '44,' + CARD2 + ')', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid ' + BORDER }}>
                    <span style={{ fontSize: 20 }}>{meta.emoji || '🎬'}</span>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: isSelected ? GOLD : TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.label || 'Clip'}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 2 }}>{fmtTs(meta.ts)}</div>
                    {meta.duration && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, marginTop: 1 }}>{fmtDur(meta.duration)}</div>}
                  </div>
                  {/* Delete */}
                  <button onClick={function(e) { e.stopPropagation(); removeClip(meta); }}
                    disabled={deleting === meta.id}
                    style={{ background: 'none', border: 'none', color: deleting === meta.id ? MUTED : RED, cursor: 'pointer', fontSize: 13, padding: '2px', flexShrink: 0, opacity: deleting === meta.id ? .5 : 1 }}>✕</button>
                </div>
              );
            })
          )}
        </div>

        {/* Main player area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {!selected ? (
            <div style={{ textAlign: 'center', color: MUTED }}>
              <div style={{ fontSize: 56, marginBottom: 14, opacity: .4 }}>▶</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2, color: MUTED }}>SELECT A CLIP TO PREVIEW</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, marginTop: 8 }}>Clips are stored locally in your browser.</div>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: 680, animation: 'fadeIn .25s ease' }}>
              {/* Meta bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: TEXT, letterSpacing: 1 }}>{selected.label || 'Clip'}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{fmtTs(selected.ts)}{selected.duration ? ' · ' + fmtDur(selected.duration) : ''}{selected.size ? ' · ' + fmtSize(selected.size) : ''}</div>
                </div>
                <div style={{ flex: 1 }} />
                <button onClick={function() { downloadClip(selected); }}
                  style={{ background: 'rgba(201,168,76,.12)', border: '1px solid ' + GOLD + '44', borderRadius: 10, padding: '8px 16px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, cursor: 'pointer', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ⬇ DOWNLOAD
                </button>
                <button onClick={function() { setSelected(null); if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); } }}
                  style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
              </div>

              {/* Video player or URL preview */}
              <div style={{ background: '#000', borderRadius: 14, overflow: 'hidden', border: '1.5px solid ' + BORDER, position: 'relative' }}>
                {loading ? (
                  <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 12 }}>Loading…</div>
                  </div>
                ) : blobUrl ? (
                  <video ref={videoRef} src={blobUrl} controls autoPlay style={{ width: '100%', display: 'block', maxHeight: 400 }} />
                ) : selected.url ? (
                  <video ref={videoRef} src={selected.url} controls autoPlay style={{ width: '100%', display: 'block', maxHeight: 400 }} />
                ) : (
                  <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: MUTED }}>
                      <div style={{ fontSize: 36 }}>🎬</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10 }}>No preview available</div>
                      <button onClick={function() { downloadClip(selected); }} style={{ background: GOLD, border: 'none', borderRadius: 10, padding: '8px 20px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: BG, cursor: 'pointer', letterSpacing: 1.5 }}>⬇ DOWNLOAD</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags / notes */}
              {selected.roomId && (
                <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>Room: {selected.roomId}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
