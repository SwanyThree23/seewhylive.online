import React, { useState, useEffect, useRef } from 'react';

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
  { id: 'dl',  label: 'Download',        icon: '⬇',  color: '#7A6F90' },
];

function pad2(n) { return n < 10 ? '0' + n : String(n); }
function fmtDur(s) { return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); }
function fmtAgo(ts) {
  var d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return d + 's ago';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  return Math.floor(d / 3600) + 'h ago';
}

export default function ClipEngineTab({ isLive, addToast }) {
  var [tab, setTab]           = useState('clips');
  var [clips, setClips]       = useState(SEED_CLIPS.map(function(c) { return Object.assign({}, c); }));
  var [recording, setRecording] = useState(false);
  var [recSecs, setRecSecs]   = useState(0);
  var [selected, setSelected] = useState(null);
  var [trimIn, setTrimIn]     = useState(0);
  var [trimOut, setTrimOut]   = useState(60);
  var [exporting, setExporting] = useState(false);
  var [exported, setExported] = useState(null);
  var [selectedFormat, setFormat] = useState('mp4-1080');
  var [sharing, setSharing]   = useState({});
  var recRef = useRef(null);

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

  function startRec() {
    if (!isLive) { addToast('Start your stream before recording a clip', 'error'); return; }
    setRecording(true);
    setRecSecs(0);
    addToast('🔴 Recording clip...', 'info');
  }

  function stopRec() {
    setRecording(false);
    var dur = recSecs;
    var sizeKB = Math.floor(dur * 260);
    var sizeMB = (sizeKB / 1024).toFixed(1);
    var id = 'c' + Date.now();
    var clip = { id: id, title: 'Live Clip — ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), duration: dur, size: sizeMB + ' MB', ts: Date.now(), thumbnail: '🎬' };
    setClips(function(p) { return [clip, ...p]; });
    setRecSecs(0);
    addToast('Clip saved: ' + fmtDur(dur), 'success');
  }

  function openEdit(clip) {
    setSelected(clip);
    setTrimIn(0);
    setTrimOut(clip.duration);
    setExported(null);
    setTab('edit');
  }

  function deleteClip(id) {
    setClips(function(p) { return p.filter(function(c) { return c.id !== id; }); });
    if (selected && selected.id === id) { setSelected(null); setTab('clips'); }
    addToast('Clip deleted', 'info');
  }

  function exportClip() {
    setExporting(true);
    setTimeout(function() {
      setExporting(false);
      setExported(selectedFormat);
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
      <div style={{ display: 'flex', background: 'rgba(22,16,32,.8)', borderRadius: 10, border: '1px solid #241C34', overflow: 'hidden' }}>
        {[['clips', '🎬 CLIPS'], ['edit', '✂️ EDIT'], ['share', '📤 SHARE']].map(function(t) {
          var active = tab === t[0];
          return (
            <button
              key={t[0]}
              onClick={function() { setTab(t[0]); }}
              style={{ flex: 1, padding: '9px 0', background: active ? 'rgba(128,0,32,.35)' : 'transparent', border: 'none', borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent', color: active ? '#C9A84C' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {/* CLIPS TAB */}
      {tab === 'clips' && (
        <>
          {/* Record controls */}
          <div style={{ background: 'rgba(128,0,32,.12)', border: '1px solid ' + (recording ? '#FF1A3C66' : '#241C34'), borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: recording ? '#FF1A3C' : '#7A6F90' }}>
                {recording ? '🔴 RECORDING' : 'RECORD CLIP'}
              </div>
              {recording && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#EDE8F5', marginTop: 2 }}>
                  {fmtDur(recSecs)}
                </div>
              )}
            </div>
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

          {/* Clip list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clips.length === 0 && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90', textAlign: 'center', padding: 16 }}>No clips yet — hit REC to capture a moment.</div>
            )}
            {clips.map(function(clip) {
              return (
                <div key={clip.id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: 'rgba(128,0,32,.25)', border: '1px solid #C9A84C22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {clip.thumbnail}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#EDE8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {clip.title}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>{fmtDur(clip.duration)}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>{clip.size}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>{fmtAgo(clip.ts)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button
                      onClick={function() { openEdit(clip); }}
                      style={{ background: 'rgba(0,201,167,.1)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 6, padding: '5px 8px', color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>
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
        </>
      )}

      {/* EDIT TAB */}
      {tab === 'edit' && (
        <>
          {!editClip ? (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90', textAlign: 'center', padding: 16 }}>
              Select a clip from the Clips tab to edit.
            </div>
          ) : (
            <>
              {/* Preview area */}
              <div style={{ background: '#07050A', border: '1px solid #241C34', borderRadius: 10, padding: 16, textAlign: 'center', minHeight: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 40 }}>{editClip.thumbnail}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#EDE8F5' }}>{editClip.title}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C' }}>
                  {fmtDur(trimIn)} → {fmtDur(trimOut)}  ({fmtDur(trimOut - trimIn)} selected)
                </div>
              </div>

              {/* Trim sliders */}
              <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 1, marginBottom: 10 }}>TRIM HANDLES</div>

                {/* Timeline bar */}
                <div style={{ position: 'relative', height: 28, marginBottom: 14 }}>
                  <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 8, background: '#241C34', borderRadius: 4 }} />
                  <div style={{ position: 'absolute', top: 10, left: (trimIn / editClip.duration * 100) + '%', right: (100 - trimOut / editClip.duration * 100) + '%', height: 8, background: 'linear-gradient(90deg,#800020,#C9A84C)', borderRadius: 4 }} />
                  {/* In handle */}
                  <div
                    style={{ position: 'absolute', top: 5, left: 'calc(' + (trimIn / editClip.duration * 100) + '% - 9px)', width: 18, height: 18, background: '#C9A84C', borderRadius: 4, cursor: 'ew-resize', border: '2px solid #EDE8F5', zIndex: 2 }}
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
                    style={{ position: 'absolute', top: 5, left: 'calc(' + (trimOut / editClip.duration * 100) + '% - 9px)', width: 18, height: 18, background: '#C9A84C', borderRadius: 4, cursor: 'ew-resize', border: '2px solid #EDE8F5', zIndex: 2 }}
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
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>IN</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#EDE8F5' }}>{fmtDur(trimIn)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>DURATION</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#C9A84C' }}>{fmtDur(trimOut - trimIn)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>OUT</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#EDE8F5' }}>{fmtDur(trimOut)}</div>
                  </div>
                </div>
              </div>

              {/* Export format */}
              <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 1, marginBottom: 8 }}>EXPORT FORMAT</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                  {EXPORT_FORMATS.map(function(fmt) {
                    var active = selectedFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        onClick={function() { setFormat(fmt.id); }}
                        style={{ background: active ? 'rgba(128,0,32,.3)' : 'rgba(7,5,10,.6)', border: '1px solid ' + (active ? '#C9A84C55' : '#241C34'), borderRadius: 6, padding: '7px 10px', color: active ? '#C9A84C' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                        <span>{fmt.icon} {fmt.label}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: active ? '#C9A84C99' : '#7A6F9066' }}>{fmt.size}</span>
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
            </>
          )}
        </>
      )}

      {/* SHARE TAB */}
      {tab === 'share' && (
        <>
          {!exported ? (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90', textAlign: 'center', padding: 16 }}>
              Export a clip first — go to Edit tab, trim, and hit Export.
            </div>
          ) : (
            <>
              <div style={{ background: 'rgba(0,201,167,.08)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 18 }}>✅</div>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#00C9A7' }}>Clip ready to share</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>
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
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isSh ? plat.color + '22' : 'rgba(22,16,32,.8)', border: '1px solid ' + (isSh ? plat.color + '66' : '#241C34'), borderRadius: 10, cursor: isSh ? 'not-allowed' : 'pointer', opacity: isSh ? 0.8 : 1 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: plat.color + '22', border: '1px solid ' + plat.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: plat.color, fontWeight: 700, flexShrink: 0 }}>
                        {plat.icon}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: isSh ? plat.color : '#EDE8F5' }}>{plat.label}</div>
                      </div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: isSh ? plat.color : '#7A6F90' }}>
                        {isSh ? '...' : plat.id === 'dl' ? '⬇ SAVE' : '→ SHARE'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

    </div>
  );
}
