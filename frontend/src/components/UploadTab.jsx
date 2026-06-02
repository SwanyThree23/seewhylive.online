import React, { useState, useRef } from 'react';
import SelectSheet from './SelectSheet.jsx';

var YT_CATEGORIES = [
  'Entertainment', 'Gaming', 'Music', 'Sports', 'Education',
  'Science & Technology', 'News & Politics', 'People & Blogs',
  'Film & Animation', 'Comedy',
];

var YT_PRIVACY = ['public', 'unlisted', 'private'];

var SEED_HISTORY = [
  { id: 'h1', title: 'Washington Classic Domino Night', duration: '1:42:18', views: 2841, date: '2026-05-10', privacy: 'public', thumb: '🎲' },
  { id: 'h2', title: 'SeeWhy LIVE - Domino Fades Highlights', duration: '18:04', views: 934, date: '2026-05-08', privacy: 'unlisted', thumb: '⚡' },
  { id: 'h3', title: 'VibeNBones Live Set - Full Stream', duration: '2:14:37', views: 1203, date: '2026-05-02', privacy: 'public', thumb: '🎵' },
];

function fmtBytes(n) {
  if (n >= 1073741824) return (Math.floor(n / 10737418.24) / 100) + ' GB';
  if (n >= 1048576)    return (Math.floor(n / 10485.76) / 100) + ' MB';
  return (Math.floor(n / 1024)) + ' KB';
}

export default function UploadTab({ addToast, isLive }) {
  var [tab,           setTab]           = useState('youtube');
  var [ytFile,        setYtFile]        = useState(null);
  var [title,         setTitle]         = useState('');
  var [desc,          setDesc]          = useState('');
  var [privacy,       setPrivacy]       = useState('public');
  var [category,      setCategory]      = useState('Entertainment');
  var [uploading,     setUploading]     = useState(false);
  var [progress,      setProgress]      = useState(0);
  var [ytApiKey,      setYtApiKey]      = useState('');
  var [showApiCfg,    setShowApiCfg]    = useState(false);
  var [history,       setHistory]       = useState(SEED_HISTORY);
  var [duration,      setDuration]      = useState(null);
  var [durationError, setDurationError] = useState('');
  var [uploadProgress, setUploadProgress] = useState(0);

  var [deviceFiles, setDeviceFiles] = useState([]);
  var [previewUrl,  setPreviewUrl]  = useState('');
  var [isDragging,  setIsDragging]  = useState(false);

  var ytInputRef       = useRef(null);
  var deviceInputRef   = useRef(null);
  var progressRef      = useRef(null);
  var uploadProgRef    = useRef(null);

  function handleYtFilePick(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) { addToast && addToast('Select a video file', 'error'); return; }
    setYtFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, ''));
    setDuration(null);
    setDurationError('');

    var videoEl = document.createElement('video');
    var objUrl = URL.createObjectURL(f);
    videoEl.src = objUrl;
    videoEl.addEventListener('loadedmetadata', function() {
      var dur = videoEl.duration;
      URL.revokeObjectURL(objUrl);
      setDuration(dur);
      if (dur > 600) {
        setDurationError('Video must be 10 minutes or less');
        addToast && addToast('Video must be 10 minutes or less', 'error');
      } else {
        setDurationError('');
      }
    });
  }

  function startUpload() {
    if (!ytFile) { addToast && addToast('Select a video file first', 'error'); return; }
    if (durationError) { addToast && addToast('Video must be 10 minutes or less', 'error'); return; }
    if (!title.trim()) { addToast && addToast('Enter a title', 'error'); return; }
    if (!ytApiKey.trim()) { setShowApiCfg(true); addToast && addToast('Configure YouTube API key first', 'error'); return; }
    setUploading(true);
    setProgress(0);
    setUploadProgress(0);
    var pct = 0;
    var upPct = 0;

    progressRef.current = setInterval(function() {
      pct += Math.floor(Math.random() * 4) + 1;
      if (pct >= 100) {
        pct = 100;
        clearInterval(progressRef.current);
        setProgress(100);
        setUploading(false);
        var newEntry = { id: 'h' + Date.now(), title: title, duration: '—', views: 0, date: new Date().toISOString().slice(0, 10), privacy: privacy, thumb: '📹' };
        setHistory(function(h) { return [newEntry].concat(h); });
        setYtFile(null);
        setTitle('');
        setDesc('');
        setDuration(null);
        setDurationError('');
        addToast && addToast('✓ Uploaded to YouTube', 'success');
      } else {
        setProgress(pct);
      }
    }, 180);

    uploadProgRef.current = setInterval(function() {
      upPct += Math.floor(3 + Math.random() * 4);
      if (upPct >= 100) {
        upPct = 100;
        clearInterval(uploadProgRef.current);
      }
      setUploadProgress(upPct);
    }, 100);
  }

  function cancelUpload() {
    if (progressRef.current) clearInterval(progressRef.current);
    if (uploadProgRef.current) clearInterval(uploadProgRef.current);
    setUploading(false);
    setProgress(0);
    setUploadProgress(0);
    addToast && addToast('Upload cancelled', 'info');
  }

  function removeHistory(id) {
    setHistory(function(h) { return h.filter(function(x) { return x.id !== id; }); });
    addToast && addToast('Removed from history', 'info');
  }

  // Device upload
  function handleDeviceFiles(fileList) {
    var arr = [];
    for (var i = 0; i < fileList.length; i++) {
      var f = fileList[i];
      if (f.type.startsWith('video/') || f.type.startsWith('image/')) arr.push(f);
    }
    if (arr.length === 0) { addToast && addToast('Select video or image files', 'error'); return; }
    setDeviceFiles(function(prev) { return prev.concat(arr); });
    if (arr[0].type.startsWith('video/')) {
      var url = URL.createObjectURL(arr[0]);
      setPreviewUrl(url);
    }
  }

  function removeDeviceFile(idx) {
    setDeviceFiles(function(prev) {
      var next = prev.slice();
      next.splice(idx, 1);
      return next;
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleDeviceFiles(e.dataTransfer.files);
  }

  var progColor = progress < 40 ? '#5A8FFF' : progress < 80 ? '#C9A84C' : '#00C9A7';
  var uploadProgColor = uploadProgress < 40 ? '#5A8FFF' : uploadProgress < 80 ? '#C9A84C' : '#00C9A7';

  var durationDisplay = '';
  if (duration !== null) {
    durationDisplay = Math.floor(duration / 60) + ':' + String(Math.floor(duration % 60)).padStart(2, '0');
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 480 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,rgba(255,0,0,.08),rgba(128,0,32,.1))', border: '1px solid rgba(255,0,0,.2)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#FF4444', letterSpacing: 3 }}>📤 UPLOAD CENTER</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>YouTube · Device · Clips</div>
        </div>
        <div style={{ fontSize: 28 }}>🎬</div>
      </div>

      {/* isLive tip card */}
      {isLive && (
        <div style={{ background: 'rgba(0,201,167,.06)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#00C9A7', lineHeight: 1.5 }}>Tip: you can clip your current live stream instead of uploading</span>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[['youtube','▶ YOUTUBE'],['device','💾 DEVICE']].map(function(t) {
          var active = tab === t[0];
          return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }}
              style={{ flex: 1, padding: '8px 0', background: active ? 'rgba(255,68,68,.12)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (active ? 'rgba(255,68,68,.4)' : '#241C34'), borderRadius: 8, color: active ? '#FF6B6B' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {/* ── YOUTUBE TAB ── */}
      {tab === 'youtube' && (
        <>
          {/* File pick */}
          <div onClick={function() { if (!uploading) ytInputRef.current && ytInputRef.current.click(); }}
            style={{ border: '2px dashed ' + (durationError ? 'rgba(255,26,60,.7)' : 'rgba(255,68,68,.3)'), borderRadius: 10, padding: '20px', textAlign: 'center', background: durationError ? 'rgba(255,26,60,.07)' : (ytFile ? 'rgba(255,68,68,.05)' : 'rgba(22,16,32,.5)'), cursor: uploading ? 'not-allowed' : 'pointer' }}>
            <input ref={ytInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleYtFilePick} />
            {ytFile ? (
              <>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎬</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#F0E8D4' }}>{ytFile.name}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginTop: 2 }}>{fmtBytes(ytFile.size)}</div>
                {duration !== null && (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: durationError ? '#FF6B81' : '#00C9A7', marginTop: 4 }}>
                    Duration: {durationDisplay}{durationError ? ' — TOO LONG' : ' ✓'}
                  </div>
                )}
                {durationError && (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF6B81', marginTop: 3 }}>
                    {durationError}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 6 }}>▶</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#8A7A62' }}>TAP TO SELECT VIDEO</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginTop: 2 }}>mp4 · mov · webm · avi</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', marginTop: 2 }}>Max 10 minutes</div>
              </>
            )}
          </div>

          {/* Upload progress bar */}
          {uploading && (
            <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#F0E8D4' }}>UPLOAD PROGRESS</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: uploadProgColor }}>{uploadProgress}%</span>
              </div>
              <div style={{ height: 6, background: '#161020', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: uploadProgress + '%', background: 'linear-gradient(90deg,' + uploadProgColor + '88,' + uploadProgColor + ')', borderRadius: 3, transition: 'width .2s' }} />
              </div>
            </div>
          )}

          {/* Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginBottom: 3 }}>TITLE *</div>
              <input value={title} onChange={function(e) { setTitle(e.target.value); }} placeholder="Video title..."
                style={{ width: '100%', background: '#07050A', border: '1px solid #241C34', borderRadius: 7, padding: '8px 10px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginBottom: 3 }}>DESCRIPTION</div>
              <textarea value={desc} onChange={function(e) { setDesc(e.target.value); }} placeholder="What's this video about?" rows={3}
                style={{ width: '100%', background: '#07050A', border: '1px solid #241C34', borderRadius: 7, padding: '8px 10px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginBottom: 3 }}>PRIVACY</div>
                <SelectSheet
                  label="Privacy"
                  value={privacy}
                  options={YT_PRIVACY.map(function(p) { return { value: p, label: p.toUpperCase() }; })}
                  onChange={function(v) { setPrivacy(v); }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginBottom: 3 }}>CATEGORY</div>
                <SelectSheet
                  label="Category"
                  value={category}
                  options={YT_CATEGORIES}
                  onChange={function(v) { setCategory(v); }}
                />
              </div>
            </div>
          </div>

          {/* Progress (YouTube-side) */}
          {uploading && (
            <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#F0E8D4' }}>UPLOADING TO YOUTUBE</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: progColor }}>{progress}%</span>
              </div>
              <div style={{ height: 6, background: '#161020', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: progress + '%', background: 'linear-gradient(90deg,' + progColor + '88,' + progColor + ')', borderRadius: 3, transition: 'width .3s' }} />
              </div>
            </div>
          )}

          {/* Upload + config buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {!uploading ? (
              <button onClick={startUpload}
                style={{ flex: 2, padding: '10px', background: durationError ? 'rgba(255,26,60,.08)' : 'linear-gradient(135deg,rgba(255,0,0,.25),rgba(192,0,0,.15))', border: '1px solid ' + (durationError ? 'rgba(255,26,60,.35)' : 'rgba(255,68,68,.4)'), borderRadius: 8, color: durationError ? '#FF6B81' : '#FF6B6B', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: durationError ? 'not-allowed' : 'pointer', opacity: durationError ? 0.6 : 1 }}>
                {durationError ? '✕ VIDEO TOO LONG' : '▶ UPLOAD TO YOUTUBE'}
              </button>
            ) : (
              <button onClick={cancelUpload}
                style={{ flex: 2, padding: '10px', background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.35)', borderRadius: 8, color: '#FF6B81', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                ✕ CANCEL
              </button>
            )}
            <button onClick={function() { setShowApiCfg(function(v) { return !v; }); }}
              style={{ flex: 1, padding: '10px', background: showApiCfg ? 'rgba(201,168,76,.15)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (showApiCfg ? 'rgba(201,168,76,.4)' : '#241C34'), borderRadius: 8, color: showApiCfg ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              ⚙ API
            </button>
          </div>

          {/* API Config */}
          {showApiCfg && (
            <div style={{ background: 'rgba(201,168,76,.05)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '12px' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#C9A84C', letterSpacing: 2, marginBottom: 6 }}>YOUTUBE API CONFIGURATION</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', marginBottom: 8, lineHeight: 1.6 }}>
                Requires YouTube Data API v3 key from Google Cloud Console.<br />
                Enable "YouTube Data API v3" on your project and create OAuth2 credentials.
              </div>
              <input value={ytApiKey} onChange={function(e) { setYtApiKey(e.target.value); }} placeholder="AIzaSy... YouTube Data API v3 key" type="password"
                style={{ width: '100%', background: '#07050A', border: '1px solid rgba(201,168,76,.25)', borderRadius: 6, padding: '7px 10px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, marginBottom: 6 }} />
              <button onClick={function() { if (ytApiKey.trim()) { addToast && addToast('API key saved', 'success'); setShowApiCfg(false); } }}
                style={{ width: '100%', padding: '7px', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                SAVE API KEY
              </button>
            </div>
          )}

          {/* Upload history */}
          {history.length > 0 && (
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginBottom: 6 }}>UPLOAD HISTORY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {history.map(function(h) {
                  return (
                    <div key={h.id} style={{ background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 22, flexShrink: 0 }}>{h.thumb}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{h.duration} · {h.views.toLocaleString()} views · {h.date}</div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: h.privacy === 'public' ? '#00C9A7' : h.privacy === 'unlisted' ? '#C9A84C' : '#8A7A62', flexShrink: 0 }}>{h.privacy.toUpperCase()}</div>
                      <button onClick={function() { removeHistory(h.id); }}
                        style={{ background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.25)', borderRadius: 5, padding: '3px 7px', color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', flexShrink: 0 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── DEVICE TAB ── */}
      {tab === 'device' && (
        <>
          {/* Drop zone */}
          <div
            onDragOver={function(e) { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={function() { setIsDragging(false); }}
            onDrop={handleDrop}
            onClick={function() { deviceInputRef.current && deviceInputRef.current.click(); }}
            style={{ border: '2px dashed rgba(201,168,76,' + (isDragging ? '.7' : '.3') + ')', borderRadius: 12, padding: '28px 16px', textAlign: 'center', background: isDragging ? 'rgba(201,168,76,.07)' : 'rgba(22,16,32,.5)', cursor: 'pointer', transition: 'all .2s', boxShadow: isDragging ? '0 0 20px rgba(201,168,76,.12)' : 'none' }}>
            <input ref={deviceInputRef} type="file" accept="video/*,image/*" multiple style={{ display: 'none' }} onChange={function(e) { handleDeviceFiles(e.target.files); }} />
            <div style={{ fontSize: 32, marginBottom: 8 }}>{isDragging ? '📂' : '💾'}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: isDragging ? '#C9A84C' : '#8A7A62' }}>{isDragging ? 'DROP FILES HERE' : 'TAP OR DROP FILES'}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginTop: 3 }}>mp4 · mov · webm · avi · jpg · png</div>
          </div>

          {/* Video preview */}
          {previewUrl && (
            <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000', border: '1px solid rgba(201,168,76,.2)' }}>
              <video src={previewUrl} controls style={{ width: '100%', display: 'block', maxHeight: 220 }} />
            </div>
          )}

          {/* File list */}
          {deviceFiles.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>{deviceFiles.length} FILE{deviceFiles.length > 1 ? 'S' : ''} SELECTED</div>
                <button onClick={function() { setDeviceFiles([]); setPreviewUrl(''); }}
                  style={{ background: 'transparent', border: '1px solid rgba(255,26,60,.3)', borderRadius: 5, padding: '2px 8px', color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 7.5, cursor: 'pointer' }}>
                  CLEAR ALL
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {deviceFiles.map(function(f, i) {
                  return (
                    <div key={i} style={{ background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 18, flexShrink: 0 }}>{f.type.startsWith('video/') ? '🎬' : '🖼'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{fmtBytes(f.size)} · {f.type}</div>
                      </div>
                      <button onClick={function() { removeDeviceFile(i); }}
                        style={{ background: 'transparent', border: 'none', color: '#8A7A62', fontSize: 12, cursor: 'pointer', flexShrink: 0, padding: '0 4px' }}>✕</button>
                    </div>
                  );
                })}
              </div>
              <button onClick={function() { addToast && addToast('Files exported to device', 'success'); }}
                style={{ width: '100%', marginTop: 8, padding: '9px', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                💾 EXPORT TO DEVICE
              </button>
            </div>
          )}

          {deviceFiles.length === 0 && !previewUrl && (
            <div style={{ textAlign: 'center', padding: '20px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>
              No files selected · Tap the zone above to pick files from your device
            </div>
          )}
        </>
      )}
    </div>
  );
}
