import React, { useState, useEffect, useRef } from 'react';

var BG   = '#0E0C09';
var GOLD = '#C9A84C';
var RED  = '#FF1A3C';
var TEXT = '#F0E8D4';
var MUTED= '#8A7A62';
var SURF = '#1A1510';
var CARD = '#1E1810';

var STYLES = [
  { id: 'lyric_visualizer', label: 'Lyric Visualizer', emoji: '🎵', desc: 'Gold waveform lines on dark' },
  { id: 'neon_pulse',       label: 'Neon Pulse',       emoji: '🌈', desc: 'Colorful spectrum glow' },
  { id: 'urban_night',      label: 'Urban Night',      emoji: '🏙', desc: 'Lissajous scope on black' },
  { id: 'abstract_wave',    label: 'Abstract Wave',    emoji: '👁', desc: 'Cream dots flowing in time' },
  { id: 'fire_storm',       label: 'Fire Storm',       emoji: '🔥', desc: 'Red & gold waveform surge' },
];

var STATUS_COLORS = {
  pending:    '#8A7A62',
  processing: '#C9A84C',
  done:       '#4CAF50',
  failed:     '#FF1A3C',
};
var STATUS_LABELS = {
  pending:    '⏳ Queued',
  processing: '⚙ Rendering…',
  done:       '✓ Ready',
  failed:     '✕ Failed',
};

function fmtAgo(ts) {
  var d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (d < 60) return d + 's ago';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  return Math.floor(d / 3600) + 'h ago';
}

export default function MusicVideoTab({ addToast, userId, username }) {
  var [selectedStyle, setSelectedStyle] = useState(null);
  var [audioFile,     setAudioFile]     = useState(null);
  var [audioName,     setAudioName]     = useState('');
  var [submitting,    setSubmitting]    = useState(false);
  var [jobs,          setJobs]          = useState([]);
  var [loadingJobs,   setLoadingJobs]   = useState(true);
  var [playingJob,    setPlayingJob]    = useState(null);   // job id being previewed
  var [dragOver,      setDragOver]      = useState(false);
  var fileInputRef = useRef(null);
  var pollRef      = useRef(null);

  // Fetch job list
  function fetchJobs() {
    fetch('/api/music-video/jobs', { credentials: 'include' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (Array.isArray(data.jobs)) setJobs(data.jobs);
        setLoadingJobs(false);
      })
      .catch(function() { setLoadingJobs(false); });
  }

  useEffect(function() {
    fetchJobs();
    // Poll every 5s while any job is pending or processing
    pollRef.current = setInterval(function() {
      setJobs(function(prev) {
        var active = prev.filter(function(j) { return j.status === 'pending' || j.status === 'processing'; });
        if (active.length > 0) fetchJobs();
        return prev;
      });
    }, 5000);
    return function() { clearInterval(pollRef.current); };
  }, []);

  function handleFile(file) {
    if (!file) return;
    var ext = file.name.split('.').pop().toLowerCase();
    var ok  = ['mp3','wav','ogg','m4a','flac','aac'].indexOf(ext) !== -1;
    if (!ok) { if (addToast) addToast('Unsupported format — use MP3, WAV, OGG, M4A, FLAC or AAC', 'error'); return; }
    if (file.size > 50 * 1024 * 1024) { if (addToast) addToast('File too large — max 50 MB', 'error'); return; }
    setAudioFile(file);
    setAudioName(file.name);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    var file = e.dataTransfer.files[0];
    handleFile(file);
  }

  function handleSubmit() {
    if (!audioFile || !selectedStyle) return;
    setSubmitting(true);
    var form = new FormData();
    form.append('audio', audioFile);
    form.append('style', selectedStyle);
    fetch('/api/music-video/submit', { method: 'POST', body: form, credentials: 'include' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) throw new Error(data.error);
        if (addToast) addToast('🎬 Music video queued! Check status below.', 'success');
        setAudioFile(null);
        setAudioName('');
        setSelectedStyle(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchJobs();
      })
      .catch(function(e) {
        if (addToast) addToast('Submit failed: ' + e.message, 'error');
      })
      .finally(function() { setSubmitting(false); });
  }

  function handleDelete(jobId) {
    fetch('/api/music-video/jobs/' + jobId, { method: 'DELETE', credentials: 'include' })
      .then(function() {
        setJobs(function(prev) { return prev.filter(function(j) { return j.id !== jobId; }); });
        if (playingJob === jobId) setPlayingJob(null);
        if (addToast) addToast('Job deleted', 'info');
      })
      .catch(function() {
        if (addToast) addToast('Delete failed', 'error');
      });
  }

  var canSubmit = audioFile && selectedStyle && !submitting;

  return (
    <div style={{ padding: 14, maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 3 }}>🎬 MUSIC VIDEO GEN</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1, marginTop: 2 }}>
          Upload a track · pick a visual style · get a rendered video
        </div>
      </div>

      {/* Audio upload */}
      <div
        onDragOver={function(e) { e.preventDefault(); setDragOver(true); }}
        onDragLeave={function() { setDragOver(false); }}
        onDrop={handleDrop}
        onClick={function() { if (fileInputRef.current) fileInputRef.current.click(); }}
        style={{
          background: dragOver ? 'rgba(201,168,76,.12)' : SURF,
          border: '2px dashed ' + (dragOver ? GOLD : audioFile ? GOLD : 'rgba(255,255,255,.12)'),
          borderRadius: 12,
          padding: '22px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color .2s, background .2s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.ogg,.m4a,.flac,.aac"
          style={{ display: 'none' }}
          onChange={function(e) { handleFile(e.target.files[0]); }}
        />
        {audioFile ? (
          <div>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🎵</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: GOLD }}>{audioName}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 2 }}>
              {(audioFile.size / 1024 / 1024).toFixed(1)} MB · tap to change
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🎵</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: TEXT }}>
              Drop audio here or tap to browse
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 4 }}>
              MP3 · WAV · OGG · M4A · FLAC · AAC · max 50 MB
            </div>
          </div>
        )}
      </div>

      {/* Style picker */}
      <div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1.5, marginBottom: 8 }}>
          PICK A VISUAL STYLE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {STYLES.map(function(s) {
            var active = selectedStyle === s.id;
            return (
              <button
                key={s.id}
                onClick={function() { setSelectedStyle(s.id); }}
                style={{
                  background: active ? 'rgba(201,168,76,.15)' : SURF,
                  border: '1px solid ' + (active ? GOLD : 'rgba(255,255,255,.07)'),
                  borderRadius: 10,
                  padding: '12px 10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: active ? GOLD : TEXT }}>{s.label}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 2 }}>{s.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '14px 0',
          background: canSubmit ? 'linear-gradient(135deg,#800020,#C01838)' : 'rgba(128,0,32,.18)',
          border: 'none',
          borderRadius: 12,
          color: canSubmit ? GOLD : MUTED,
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 18,
          letterSpacing: 2,
          cursor: canSubmit ? 'pointer' : 'default',
        }}
      >
        {submitting ? '⚙ QUEUEING…' : '🎬 GENERATE MUSIC VIDEO'}
      </button>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 4 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1.5 }}>
          YOUR VIDEOS
        </div>
      </div>

      {/* Job list */}
      {loadingJobs ? (
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, textAlign: 'center', padding: 16 }}>Loading…</div>
      ) : jobs.length === 0 ? (
        <div style={{ background: SURF, border: '1px dashed rgba(201,168,76,.15)', borderRadius: 10, padding: '28px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🎬</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>No videos yet — upload a track and pick a style above</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {jobs.map(function(job) {
            var styleInfo = STYLES.filter(function(s) { return s.id === job.style; })[0] || STYLES[0];
            var statusColor = STATUS_COLORS[job.status] || MUTED;
            var isPlaying = playingJob === job.id;
            return (
              <div key={job.id} style={{ background: CARD, border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: SURF, border: '1px solid rgba(201,168,76,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {styleInfo.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT }}>{styleInfo.label}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: statusColor }}>
                        {STATUS_LABELS[job.status] || job.status}
                      </span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>{fmtAgo(job.created_at)}</span>
                    </div>
                    {job.status === 'failed' && job.error && (
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: RED, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.error.slice(0, 80)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {job.status === 'done' && (
                      <button
                        onClick={function() { setPlayingJob(isPlaying ? null : job.id); }}
                        style={{ background: isPlaying ? 'rgba(201,168,76,.25)' : 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '5px 9px', color: GOLD, fontSize: 11, cursor: 'pointer' }}>
                        {isPlaying ? '■' : '▶'}
                      </button>
                    )}
                    {job.status === 'processing' && (
                      <div style={{ width: 28, height: 28, border: '2px solid rgba(201,168,76,.3)', borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    )}
                    <button
                      onClick={function() { handleDelete(job.id); }}
                      style={{ background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.25)', borderRadius: 6, padding: '5px 7px', color: RED, fontSize: 10, cursor: 'pointer' }}>
                      🗑
                    </button>
                  </div>
                </div>

                {/* Inline video player */}
                {isPlaying && job.status === 'done' && (
                  <div style={{ marginTop: 10 }}>
                    <video
                      src={'/api/music-video/output/' + job.output_path.split('/').pop()}
                      controls
                      autoPlay
                      style={{ width: '100%', borderRadius: 8, background: BG, maxHeight: 240 }}
                    />
                    <a
                      href={'/api/music-video/output/' + job.output_path.split('/').pop()}
                      download={'mv_' + job.style + '.mp4'}
                      style={{ display: 'block', marginTop: 6, fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, textAlign: 'center', textDecoration: 'none' }}
                    >
                      ⬇ Download MP4
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
