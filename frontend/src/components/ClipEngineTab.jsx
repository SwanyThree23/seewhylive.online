import React, { useState, useEffect, useRef } from 'react';
import { useVODRecording } from '../hooks/useVODRecording.js';
import { saveClip as storePin, deleteClip as storeDelete, listClips as storeList } from '../clipStore.js';

var SEED_CLIPS = [
  { id: 'c1', title: 'Washington Classic Opener',   duration: 47,  size: '12.4 MB', ts: Date.now() - 3600000, thumbnail: '🎲' },
  { id: 'c2', title: 'Domino Stack Challenge',      duration: 28,  size: '7.2 MB',  ts: Date.now() - 2100000, thumbnail: '🁡' },
  { id: 'c3', title: 'Crowd Hype Moment',           duration: 15,  size: '3.9 MB',  ts: Date.now() - 900000,  thumbnail: '🔥' },
  { id: 'c4', title: 'Double-Six Play Highlight',   duration: 62,  size: '16.1 MB', ts: Date.now() - 300000,  thumbnail: '🏆' },
];

var EXPORT_FORMATS = [
  { id: 'mp4-1080', label: '1080p MP4',  size: '~18 MB', icon: '📹' },
  { id: 'mp4-720',  label: '720p MP4',   size: '~9 MB',  icon: '📹' },
  { id: 'gif',      label: 'GIF',        size: '~4 MB',  icon: '🎞' },
  { id: 'short',    label: 'Short (9:16)',size: '~11 MB', icon: '📱' },
];

var SHARE_PLATFORMS = [
  { id: 'yt',  label: 'YouTube Shorts',  icon: '▶',  color: '#FF0000' },
  { id: 'tt',  label: 'TikTok',          icon: '♪',  color: '#69C9D0' },
  { id: 'tw',  label: 'Twitter / X',     icon: '✕',  color: '#1DA1F2' },
  { id: 'fb',  label: 'Facebook',        icon: 'f',  color: '#1877F2' },
  { id: 'dl',  label: 'Download',        icon: '⬇',  color: '#8A7A62' },
];

function pad2(n) { return n < 10 ? '0' + n : String(n); }
function fmtDur(s) { return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); }
function fmtAgo(ts) {
  var d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return d + 's ago';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  return Math.floor(d / 3600) + 'h ago';
}

export default function ClipEngineTab({ isLive, addToast, streamId, creatorId, socket }) {
  var [tab, setTab]               = useState('clips');
  var [clips, setClips]           = useState(SEED_CLIPS.map(function(c) { return Object.assign({}, c); }));
  var [recording, setRecording]   = useState(false);
  var [recSecs, setRecSecs]       = useState(0);

  var vodRec = useVODRecording({ streamId: streamId, creatorId: creatorId, title: 'Live Clip' });
  var [selected, setSelected]     = useState(null);
  var [trimIn, setTrimIn]         = useState(0);
  var [trimOut, setTrimOut]       = useState(60);
  var [exporting, setExporting]   = useState(false);
  var [exported, setExported]     = useState(null);
  var [exportThumb, setExportThumb] = useState(null);
  var [selectedFormat, setFormat] = useState('mp4-1080');
  var [sharing, setSharing]       = useState({});
  var [liveClipping, setLiveClipping] = useState(false);
  var [gallery, setGallery] = useState([]);
  var [previewClip, setPreviewClip]   = useState(null);
  var [previewTab, setPreviewTab]     = useState('audio');
  var [previewScrub, setPreviewScrub] = useState(0.15);
  var [previewPlaying, setPreviewPlaying] = useState(false);
  var [scrubDragging, setScrubDragging]   = useState(false);
  var waveCanvasRef = useRef(null);
  var scrubTrackRef = useRef(null);
  var recRef = useRef(null);
  var liveClipRef = useRef(null);

  useEffect(function() {
    if (!recording) {
      if (recRef.current) clearInterval(recRef.current);
      return;
    }
    recRef.current = setInterval(function() {
      setRecSecs(function(n) { return n + 1; });
    }, 1000);
    return function() { clearInterval(recRef.current); };
  }, [recording]);

  useEffect(function() {
    setGallery(storeList());
  }, []);

  useEffect(function() {
    if (tab === 'gallery') {
      setGallery(storeList());
    }
  }, [tab]);

  useEffect(function() {
    if (!socket) return;
    function onClipMarked(data) {
      if (!data) return;
      var markerId = data.id || ('m-' + Date.now());
      var marker = {
        id: markerId,
        title: 'Clip Marker — ' + (data.label || 'Unmarked'),
        duration: 0,
        size: '—',
        ts: Date.now(),
        thumbnail: '📍',
        isMarker: true,
        pinned: true,
      };
      setClips(function(prev) { return [marker].concat(prev); });
      storePin(markerId, null, marker).then(function() {
        setGallery(storeList());
      }).catch(function() {});
      if (addToast) addToast('📍 Clip marker auto-saved to gallery: ' + (data.label || 'Unmarked'), 'success');
    }
    socket.on('clip-marked', onClipMarked);
    return function() { socket.off('clip-marked', onClipMarked); };
  }, [socket, addToast]);

  // Draw waveform on canvas whenever previewClip or previewScrub changes
  useEffect(function() {
    if (!previewClip || !waveCanvasRef.current) return;
    var canvas = waveCanvasRef.current;
    var ctx = canvas.getContext('2d');
    var W = canvas.width;
    var H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    // Seed bars from clip id for deterministic look
    var seed = 0;
    for (var ci = 0; ci < previewClip.id.length; ci++) { seed += previewClip.id.charCodeAt(ci); }
    var BAR_COUNT = 48;
    var barW = Math.floor(W / BAR_COUNT) - 1;
    var scrubX = Math.floor(previewScrub * W);
    for (var bi = 0; bi < BAR_COUNT; bi++) {
      var x = Math.floor(bi * (W / BAR_COUNT));
      // Pseudo-random height
      var h = 8 + ((seed * (bi + 7) * 31 + bi * 17) % 52);
      var past = x < scrubX;
      ctx.fillStyle = past ? '#C9A84C' : 'rgba(201,168,76,0.28)';
      ctx.fillRect(x, Math.floor((H - h) / 2), barW, h);
    }
    // Scrub handle
    ctx.fillStyle = '#fff';
    ctx.fillRect(scrubX - 1, 0, 3, H);
    ctx.beginPath();
    ctx.arc(scrubX, Math.floor(H / 2), 7, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }, [previewClip, previewScrub]);

  // Advance scrubber while playing
  useEffect(function() {
    if (!previewPlaying || !previewClip) return;
    var total = previewClip.duration || 60;
    var iv = setInterval(function() {
      setPreviewScrub(function(prev) {
        var next = prev + 1 / total;
        if (next >= 1) { clearInterval(iv); setPreviewPlaying(false); return 1; }
        return next;
      });
    }, 1000);
    return function() { clearInterval(iv); };
  }, [previewPlaying, previewClip]);

  function openPreview(clip) {
    setPreviewClip(clip);
    setPreviewScrub(0.15);
    setPreviewTab('audio');
    setPreviewPlaying(false);
  }

  function handleScrubClick(e) {
    if (!scrubTrackRef.current) return;
    var rect = scrubTrackRef.current.getBoundingClientRect();
    var ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setPreviewScrub(ratio);
  }

  function fmtScrubTime(ratio, totalSecs) {
    var t = Math.floor(ratio * totalSecs);
    return fmtDur(t);
  }

  function startRec() {
    if (!isLive) { addToast('Start your stream before recording a clip', 'error'); return; }
    setRecording(true);
    setRecSecs(0);
    if (streamId && creatorId) vodRec.startRecording();
    addToast('🔴 Recording clip...', 'info');
  }

  function stopRec() {
    setRecording(false);
    var dur = recSecs;
    var sizeKB = Math.floor(dur * 260);
    var sizeMB = (sizeKB / 1024).toFixed(1);
    var id = vodRec.vodId || ('c' + Date.now());
    var clip = { id: id, title: 'Live Clip — ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), duration: dur, size: sizeMB + ' MB', ts: Date.now(), thumbnail: '🎬' };
    setClips(function(p) { return [clip].concat(p); });
    setRecSecs(0);
    if (streamId && creatorId) vodRec.stopRecording();
    addToast('Clip saved: ' + fmtDur(dur), 'success');
  }

  function startLiveClip() {
    if (!isLive || recording) return;
    setLiveClipping(true);
    setRecording(true);
    setRecSecs(0);
    addToast('⚡ LIVE CLIP — capturing 30s...', 'info');
    if (streamId && creatorId) vodRec.startRecording();
    liveClipRef.current = setTimeout(function() {
      if (streamId && creatorId) vodRec.stopRecording();
      setRecording(false);
      setLiveClipping(false);
      var clipId = vodRec.vodId || ('c' + Date.now());
      var clip = { id: clipId, title: 'Live Clip ' + new Date().toLocaleTimeString() + ' — 30s', duration: 30, ts: Date.now(), thumbnail: '🎬' };
      setClips(function(p) { return [clip].concat(p); });
      setRecSecs(0);
      addToast('Live Clip saved (30s)', 'success');
    }, 30000);
  }

  function openEdit(clip) {
    setSelected(clip);
    setTrimIn(0);
    setTrimOut(clip.duration);
    setExported(null);
    setExportThumb(null);
    setTab('edit');
  }

  function deleteClip(id) {
    setClips(function(p) { return p.filter(function(c) { return c.id !== id; }); });
    if (selected && selected.id === id) { setSelected(null); setTab('clips'); }
    addToast('Clip deleted', 'info');
  }

  function exportClip() {
    setExporting(true);
    var thumbVal = editClip ? editClip.thumbnail : null;
    setTimeout(function() {
      setExporting(false);
      setExported(selectedFormat);
      setExportThumb(thumbVal);
      var fmt = EXPORT_FORMATS.find(function(f) { return f.id === selectedFormat; });
      addToast('Exported: ' + (fmt ? fmt.label : selectedFormat), 'success');
      setTab('share');
    }, 1800 + Math.floor(Math.random() * 1200));
  }

  function shareClip(pid) {
    setSharing(function(prev) { return Object.assign({}, prev, { [pid]: true }); });
    setTimeout(function() {
      setSharing(function(prev) { return Object.assign({}, prev, { [pid]: false }); });
      var plat = SHARE_PLATFORMS.find(function(p) { return p.id === pid; });
      if (pid === 'dl') {
        addToast('Download started', 'success');
      } else {
        addToast('Shared to ' + (plat ? plat.label : pid), 'success');
      }
    }, 900 + Math.floor(Math.random() * 600));
  }

  var editClip = selected;

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(26,21,16,.8)', borderRadius: 10, border: '1px solid #3D3020', overflow: 'hidden' }}>
        {[['clips', '🎬 CLIPS'], ['gallery', '📌 GALLERY'], ['edit', '✂️ EDIT'], ['share', '📤 SHARE']].map(function(t) {
          var active = tab === t[0];
          return (
            <button
              key={t[0]}
              onClick={function() { setTab(t[0]); }}
              style={{ flex: 1, padding: '9px 0', background: active ? 'rgba(128,0,32,.35)' : 'transparent', border: 'none', borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent', color: active ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {/* CLIPS TAB */}
      {tab === 'clips' && (
        <div>
          {/* Header with clips count badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#8A7A62', letterSpacing: 1 }}>SAVED CLIPS</div>
            <div style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 5, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C', letterSpacing: 1 }}>
              {clips.length} CLIPS
            </div>
          </div>

          {/* Record controls */}
          <div style={{ background: 'rgba(128,0,32,.12)', border: '1px solid ' + (recording ? '#FF1A3C66' : '#3D3020'), borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: recording ? '#FF1A3C' : '#8A7A62' }}>
                {recording ? (liveClipping ? '⚡ LIVE CLIP' : '🔴 RECORDING') : 'RECORD CLIP'}
              </div>
              {recording && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#F0E8D4', marginTop: 2 }}>
                  {fmtDur(recSecs)}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {isLive && !recording && (
                <button
                  onClick={startLiveClip}
                  style={{ background: 'linear-gradient(135deg,#C9A84C,#E8C46A)', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#07050A', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 0.5 }}>
                  ⚡ LIVE CLIP
                </button>
              )}
              {!recording ? (
                <button
                  onClick={startRec}
                  style={{ background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 8, padding: '8px 18px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  ● REC
                </button>
              ) : (
                <button
                  onClick={stopRec}
                  style={{ background: 'rgba(230,57,70,.2)', border: '1px solid rgba(230,57,70,.5)', borderRadius: 8, padding: '8px 18px', color: '#FF6B81', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  ■ STOP
                </button>
              )}
            </div>
          </div>

          {/* Clip list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clips.length === 0 && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62', textAlign: 'center', padding: 16 }}>No clips yet — hit REC to capture a moment.</div>
            )}
            {clips.map(function(clip) {
              return (
                <div key={clip.id} style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: 'rgba(128,0,32,.25)', border: '1px solid #C9A84C22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {clip.thumbnail}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {clip.title}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>{fmtDur(clip.duration)}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>{clip.size}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>{fmtAgo(clip.ts)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button
                      onClick={function() {
                        var meta = { id: clip.id, title: clip.title, duration: clip.duration, size: clip.size, ts: clip.ts, thumbnail: clip.thumbnail, pinned: true };
                        storePin(clip.id, null, meta).then(function() {
                          setGallery(storeList());
                          if (addToast) addToast('📌 Pinned to gallery', 'success');
                        }).catch(function() {
                          if (addToast) addToast('Failed to pin clip', 'error');
                        });
                      }}
                      style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 6, padding: '5px 7px', color: '#C9A84C', fontSize: 10, cursor: 'pointer' }}>
                      📌
                    </button>
                    <button
                      onClick={function() { openPreview(clip); }}
                      style={{ background: previewClip && previewClip.id === clip.id ? 'rgba(201,168,76,.25)' : 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 6, padding: '5px 8px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>
                      ▶
                    </button>
                    <button
                      onClick={function() { openEdit(clip); }}
                      style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '5px 8px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>
                      EDIT
                    </button>
                    <button
                      onClick={function() { deleteClip(clip.id); }}
                      style={{ background: 'rgba(230,57,70,.1)', border: '1px solid rgba(230,57,70,.3)', borderRadius: 6, padding: '5px 7px', color: '#FF6B81', fontSize: 10, cursor: 'pointer' }}>
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Waveform Preview Panel */}
          {previewClip && (
            <div style={{ background: '#1A1510', border: '1px solid rgba(201,168,76,.3)', borderRadius: 12, padding: '14px 14px 16px', marginTop: 8 }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{previewClip.thumbnail}</span>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewClip.title}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 1 }}>
                      {fmtScrubTime(previewScrub, previewClip.duration)} selected
                    </div>
                  </div>
                </div>
                <button
                  onClick={function() { setPreviewClip(null); setPreviewPlaying(false); }}
                  style={{ background: 'none', border: 'none', color: '#8A7A62', fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>
                  ✕
                </button>
              </div>

              {/* Audio / Video / Timing tabs */}
              <div style={{ display: 'flex', gap: 2, marginBottom: 10, background: 'rgba(14,12,9,.7)', borderRadius: 7, padding: 3 }}>
                {['audio', 'video', 'timing'].map(function(t) {
                  var active = previewTab === t;
                  return (
                    <button
                      key={t}
                      onClick={function() { setPreviewTab(t); }}
                      style={{ flex: 1, padding: '5px 0', background: active ? 'rgba(201,168,76,.18)' : 'transparent', border: 'none', borderRadius: 5, color: active ? '#C9A84C' : '#8A7A62', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>
                      {t}
                    </button>
                  );
                })}
              </div>

              {/* Waveform canvas (click to scrub) */}
              <div
                ref={scrubTrackRef}
                onClick={handleScrubClick}
                style={{ position: 'relative', cursor: 'crosshair', borderRadius: 6, overflow: 'hidden', marginBottom: 6, background: '#0E0C09' }}>
                <canvas
                  ref={waveCanvasRef}
                  width={380}
                  height={68}
                  style={{ display: 'block', width: '100%', height: 68, borderRadius: 6 }}>
                </canvas>
              </div>

              {/* Timecode row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62' }}>00:00</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 1 }}>
                  {fmtScrubTime(previewScrub, previewClip.duration)} / {fmtDur(previewClip.duration)}
                </span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62' }}>{fmtDur(previewClip.duration)}</span>
              </div>

              {/* Play / Edit buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={function() { setPreviewPlaying(function(p) { return !p; }); }}
                  style={{ flex: 2, padding: '10px 0', background: previewPlaying ? 'rgba(201,168,76,.15)' : 'linear-gradient(135deg,#C9A84C,#E8C46A)', border: previewPlaying ? '1px solid rgba(201,168,76,.4)' : 'none', borderRadius: 8, color: previewPlaying ? '#C9A84C' : '#07050A', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
                  {previewPlaying ? '■ PAUSE' : '▶ PLAY'}
                </button>
                <button
                  onClick={function() { openEdit(previewClip); setPreviewClip(null); }}
                  style={{ flex: 1, padding: '10px 0', background: 'rgba(128,0,32,.2)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                  EDIT →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GALLERY TAB */}
      {tab === 'gallery' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#8A7A62', letterSpacing: 1 }}>PINNED GALLERY</div>
            <div style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 5, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C', letterSpacing: 1 }}>
              {gallery.length} SAVED
            </div>
          </div>
          {gallery.length === 0 ? (
            <div style={{ background: 'rgba(26,21,16,.8)', border: '1px dashed rgba(201,168,76,.2)', borderRadius: 10, padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📌</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62' }}>No pinned clips yet</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#3D3020', marginTop: 4 }}>Hit 📌 on any clip in the Clips tab, or clip markers auto-save here</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gallery.map(function(clip) {
                return (
                  <div key={clip.id} style={{ background: 'rgba(26,21,16,.8)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 8, background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {clip.thumbnail || '🎬'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {clip.title}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>{fmtDur(clip.duration || 0)}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>{clip.size || '—'}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>{fmtAgo(clip.ts || Date.now())}</span>
                      </div>
                    </div>
                    <button
                      onClick={function() {
                        storeDelete(clip.id).then(function() {
                          setGallery(storeList());
                          if (addToast) addToast('Removed from gallery', 'info');
                        }).catch(function() {});
                      }}
                      style={{ background: 'rgba(230,57,70,.1)', border: '1px solid rgba(230,57,70,.3)', borderRadius: 6, padding: '5px 7px', color: '#FF6B81', fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EDIT TAB */}
      {tab === 'edit' && (
        <div>
          {!editClip ? (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62', textAlign: 'center', padding: 16 }}>
              Select a clip from the Clips tab to edit.
            </div>
          ) : (
            <div>
              {/* Preview area */}
              <div style={{ background: '#07050A', border: '1px solid #3D3020', borderRadius: 10, padding: 16, textAlign: 'center', minHeight: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ fontSize: 40 }}>{editClip.thumbnail}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#F0E8D4' }}>{editClip.title}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C' }}>
                  {fmtDur(trimIn)} → {fmtDur(trimOut)}  ({fmtDur(trimOut - trimIn)} selected)
                </div>
              </div>

              {/* Trim sliders */}
              <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1, marginBottom: 10 }}>TRIM HANDLES</div>

                {/* Timeline bar */}
                <div style={{ position: 'relative', height: 28, marginBottom: 14 }}>
                  <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 8, background: '#3D3020', borderRadius: 4 }} />
                  <div style={{ position: 'absolute', top: 10, left: (trimIn / editClip.duration * 100) + '%', right: (100 - trimOut / editClip.duration * 100) + '%', height: 8, background: 'linear-gradient(90deg,#800020,#C9A84C)', borderRadius: 4 }} />
                  {/* In handle */}
                  <div
                    style={{ position: 'absolute', top: 5, left: 'calc(' + (trimIn / editClip.duration * 100) + '% - 9px)', width: 18, height: 18, background: '#C9A84C', borderRadius: 4, cursor: 'ew-resize', border: '2px solid #F0E8D4', zIndex: 2 }}
                    onMouseDown={function(e) {
                      var bar = e.currentTarget.parentNode.getBoundingClientRect();
                      function move(ev) {
                        var pct = Math.max(0, Math.min(1, (ev.clientX - bar.left) / bar.width));
                        var newIn = Math.floor(pct * editClip.duration);
                        setTrimIn(Math.min(newIn, trimOut - 1));
                      }
                      function up() { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); }
                      window.addEventListener('mousemove', move);
                      window.addEventListener('mouseup', up);
                    }}
                  />
                  {/* Out handle */}
                  <div
                    style={{ position: 'absolute', top: 5, left: 'calc(' + (trimOut / editClip.duration * 100) + '% - 9px)', width: 18, height: 18, background: '#C9A84C', borderRadius: 4, cursor: 'ew-resize', border: '2px solid #F0E8D4', zIndex: 2 }}
                    onMouseDown={function(e) {
                      var bar = e.currentTarget.parentNode.getBoundingClientRect();
                      function move(ev) {
                        var pct = Math.max(0, Math.min(1, (ev.clientX - bar.left) / bar.width));
                        var newOut = Math.ceil(pct * editClip.duration);
                        setTrimOut(Math.max(newOut, trimIn + 1));
                      }
                      function up() { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); }
                      window.addEventListener('mousemove', move);
                      window.addEventListener('mouseup', up);
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>IN</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#F0E8D4' }}>{fmtDur(trimIn)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>DURATION</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#C9A84C' }}>{fmtDur(trimOut - trimIn)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>OUT</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#F0E8D4' }}>{fmtDur(trimOut)}</div>
                  </div>
                </div>
              </div>

              {/* Export format */}
              <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1, marginBottom: 8 }}>EXPORT FORMAT</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                  {EXPORT_FORMATS.map(function(fmt) {
                    var active = selectedFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        onClick={function() { setFormat(fmt.id); }}
                        style={{ background: active ? 'rgba(128,0,32,.3)' : 'rgba(14,12,9,.6)', border: '1px solid ' + (active ? '#C9A84C55' : '#3D3020'), borderRadius: 6, padding: '7px 10px', color: active ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                        <span>{fmt.icon} {fmt.label}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: active ? '#C9A84C99' : '#8A7A6266' }}>{fmt.size}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={exportClip}
                  disabled={exporting || (trimOut - trimIn) < 1}
                  style={{ width: '100%', padding: '10px', background: exporting ? 'rgba(128,0,32,.3)' : 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.7 : 1 }}>
                  {exporting ? '⚙️ EXPORTING...' : '📦 EXPORT CLIP'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SHARE TAB */}
      {tab === 'share' && (
        <div>
          {!exported ? (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62', textAlign: 'center', padding: 16 }}>
              Export a clip first — go to Edit tab, trim, and hit Export.
            </div>
          ) : (
            <div>
              <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ fontSize: 18 }}>{exportThumb ? exportThumb : '✅'}</div>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#C9A84C' }}>Clip ready to share</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>
                    {(EXPORT_FORMATS.find(function(f) { return f.id === exported; }) || {}).label || exported} · {editClip ? fmtDur(trimOut - trimIn) : '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SHARE_PLATFORMS.map(function(plat) {
                  var isSh = Boolean(sharing[plat.id]);
                  return (
                    <button
                      key={plat.id}
                      onClick={function() { shareClip(plat.id); }}
                      disabled={isSh}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isSh ? plat.color + '22' : 'rgba(26,21,16,.8)', border: '1px solid ' + (isSh ? plat.color + '66' : '#3D3020'), borderRadius: 10, cursor: isSh ? 'not-allowed' : 'pointer', opacity: isSh ? 0.8 : 1 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: plat.color + '22', border: '1px solid ' + plat.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: plat.color, fontWeight: 700, flexShrink: 0 }}>
                        {plat.icon}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: isSh ? plat.color : '#F0E8D4' }}>{plat.label}</div>
                      </div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: isSh ? plat.color : '#8A7A62' }}>
                        {isSh ? '...' : plat.id === 'dl' ? '⬇ SAVE' : '→ SHARE'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
