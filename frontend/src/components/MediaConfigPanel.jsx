import React, { useState, useEffect, useRef } from 'react';

var QUALITY_PRESETS = [
  { id: '4k',    label: '4K',    width: 3840, height: 2160, frameRate: 30,  bitrate: 20000000 },
  { id: '1080p', label: '1080p', width: 1920, height: 1080, frameRate: 60,  bitrate:  8000000 },
  { id: '720p',  label: '720p',  width: 1280, height:  720, frameRate: 30,  bitrate:  4500000 },
  { id: '480p',  label: '480p',  width:  854, height:  480, frameRate: 30,  bitrate:  2000000 },
  { id: '360p',  label: '360p',  width:  640, height:  360, frameRate: 24,  bitrate:  1000000 },
];

export default function MediaConfigPanel({ onClose, onApply, addToast }) {
  var [cameras,       setCameras]       = useState([]);
  var [microphones,   setMicrophones]   = useState([]);
  var [speakers,      setSpeakers]      = useState([]);
  var [camId,         setCamId]         = useState('');
  var [micId,         setMicId]         = useState('');
  var [quality,       setQuality]       = useState('720p');
  var [noiseSup,      setNoiseSup]      = useState(true);
  var [echoCan,       setEchoCan]       = useState(true);
  var [autoGain,      setAutoGain]      = useState(true);
  var [facingFront,   setFacingFront]   = useState(true);
  var [previewStream, setPreviewStream] = useState(null);
  var [micLevel,      setMicLevel]      = useState(0);
  var [previewError,  setPreviewError]  = useState('');
  var [loading,       setLoading]       = useState(false);
  var [tab,           setTab]           = useState('camera');

  var videoRef      = useRef(null);
  var analyserRef   = useRef(null);
  var animRef       = useRef(null);
  var audioCtxRef   = useRef(null);
  var levelInterval = useRef(null);

  // Enumerate devices
  useEffect(function() {
    async function loadDevices() {
      try {
        // Request permission first so labels are populated
        var tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        tempStream.getTracks().forEach(function(t) { t.stop(); });
      } catch(e) {
        // permission may already be granted
      }
      try {
        var devices = await navigator.mediaDevices.enumerateDevices();
        var cams = devices.filter(function(d) { return d.kind === 'videoinput'; });
        var mics = devices.filter(function(d) { return d.kind === 'audioinput'; });
        var spks = devices.filter(function(d) { return d.kind === 'audiooutput'; });
        setCameras(cams);
        setMicrophones(mics);
        setSpeakers(spks);
        if (cams.length > 0 && !camId) setCamId(cams[0].deviceId);
        if (mics.length > 0 && !micId) setMicId(mics[0].deviceId);
      } catch(e) {
        setPreviewError('Could not enumerate devices: ' + e.message);
      }
    }
    loadDevices();
    return function() {
      stopPreview();
    };
  }, []);

  // Start preview when camId or quality changes
  useEffect(function() {
    if (tab === 'camera') startPreview();
    return stopPreview;
  }, [camId, micId, quality, noiseSup, echoCan, autoGain, facingFront, tab]);

  function stopPreview() {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (levelInterval.current) clearInterval(levelInterval.current);
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(function(){}); audioCtxRef.current = null; }
    if (previewStream) {
      previewStream.getTracks().forEach(function(t) { t.stop(); });
      setPreviewStream(null);
    }
  }

  async function startPreview() {
    stopPreview();
    setPreviewError('');
    setLoading(true);
    var preset = QUALITY_PRESETS.find(function(p) { return p.id === quality; }) || QUALITY_PRESETS[2];
    var videoConstraints = {
      width:     { ideal: preset.width },
      height:    { ideal: preset.height },
      frameRate: { ideal: preset.frameRate },
    };
    if (camId) {
      videoConstraints.deviceId = { exact: camId };
    } else {
      videoConstraints.facingMode = facingFront ? 'user' : 'environment';
    }
    var audioConstraints = {
      noiseSuppression: noiseSup,
      echoCancellation: echoCan,
      autoGainControl:  autoGain,
    };
    if (micId) audioConstraints.deviceId = { exact: micId };

    try {
      var stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });
      setPreviewStream(stream);
      setLoading(false);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      startMicMeter(stream);
    } catch(e) {
      setLoading(false);
      setPreviewError(e.name + ': ' + e.message);
      if (addToast) addToast('Camera/mic error: ' + e.message, 'error');
    }
  }

  function startMicMeter(stream) {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      var ctx = new AudioContext();
      audioCtxRef.current = ctx;
      var source = ctx.createMediaStreamSource(stream);
      var analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      var buf = new Uint8Array(analyser.frequencyBinCount);
      levelInterval.current = setInterval(function() {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i++) sum += buf[i];
        var avg = Math.floor((sum / buf.length) / 255 * 100);
        setMicLevel(avg);
      }, 60);
    } catch(e) {
      // audio meter not critical
    }
  }

  function handleApply() {
    var preset = QUALITY_PRESETS.find(function(p) { return p.id === quality; }) || QUALITY_PRESETS[2];
    // Stop the preview stream before closing — OctCell will acquire its own stream
    // using the config settings (passing the stream here causes it to be killed on unmount)
    stopPreview();
    var config = {
      camId:       camId,
      micId:       micId,
      quality:     quality,
      preset:      preset,
      noiseSup:    noiseSup,
      echoCan:     echoCan,
      autoGain:    autoGain,
      facingFront: facingFront,
    };
    if (onApply) onApply(config);
    if (addToast) addToast('Media config applied ✓', 'success');
    if (onClose) onClose();
  }

  var levelColor = micLevel > 70 ? '#FF1A3C' : micLevel > 40 ? '#C9A84C' : '#C9A84C';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,12,9,.92)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#0E0C09', border: '1px solid rgba(201,168,76,.3)', borderRadius: 14, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.12),rgba(128,0,32,.15))', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A84C', letterSpacing: 3 }}>⚙ MEDIA CONFIG</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62' }}>Camera · Microphone · Quality</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.35)', borderRadius: 8, width: 32, height: 32, color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 14, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #3D3020', flexShrink: 0 }}>
          {[['camera','📷 CAMERA'],['audio','🎙 AUDIO'],['quality','📶 QUALITY']].map(function(t) {
            var active = tab === t[0];
            return (
              <button key={t[0]} onClick={function() { setTab(t[0]); }}
                style={{ flex: 1, padding: '10px 0', background: active ? 'rgba(201,168,76,.1)' : 'transparent', border: 'none', borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent', color: active ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                {t[1]}
              </button>
            );
          })}
        </div>

        <div style={{ overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>

          {/* CAMERA TAB */}
          {tab === 'camera' && (
            <>
              {/* Preview */}
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#07050A', aspectRatio: '16/9', border: '1px solid #3D3020' }}>
                {loading && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 32, height: 32, border: '3px solid #C9A84C33', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                )}
                {previewError && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div style={{ fontSize: 28 }}>🚫</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF6B81', textAlign: 'center', padding: '0 16px' }}>{previewError}</div>
                  </div>
                )}
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: previewStream && !previewError ? 'block' : 'none' }} />
                {/* Resolution badge */}
                {previewStream && (
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 4, padding: '2px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C' }}>
                    {quality.toUpperCase()}
                  </div>
                )}
                {/* Flip button */}
                <button onClick={function() { setFacingFront(function(f) { return !f; }); }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 6, padding: '4px 8px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>
                  🔄 FLIP
                </button>
              </div>

              {/* Camera selector */}
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginBottom: 4 }}>CAMERA</div>
                {cameras.length === 0 ? (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF6B81' }}>No cameras detected</div>
                ) : (
                  <select value={camId} onChange={function(e) { setCamId(e.target.value); }}
                    style={{ width: '100%', background: '#07050A', border: '1px solid #3D3020', borderRadius: 7, padding: '8px 10px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>
                    {cameras.map(function(c, i) {
                      return <option key={c.deviceId} value={c.deviceId}>{c.label || 'Camera ' + (i + 1)}</option>;
                    })}
                  </select>
                )}
              </div>

              {/* Facing mode (mobile) */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[['user','Front 🤳'],['environment','Rear 📷']].map(function(fm) {
                  var active = (fm[0] === 'user') === facingFront;
                  return (
                    <button key={fm[0]} onClick={function() { setFacingFront(fm[0] === 'user'); setCamId(''); }}
                      style={{ flex: 1, padding: '7px', background: active ? 'rgba(201,168,76,.15)' : 'rgba(26,21,16,.7)', border: '1px solid ' + (active ? 'rgba(201,168,76,.5)' : '#3D3020'), borderRadius: 7, color: active ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                      {fm[1]}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* AUDIO TAB */}
          {tab === 'audio' && (
            <>
              {/* Mic selector */}
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginBottom: 4 }}>MICROPHONE</div>
                {microphones.length === 0 ? (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF6B81' }}>No microphones detected</div>
                ) : (
                  <select value={micId} onChange={function(e) { setMicId(e.target.value); }}
                    style={{ width: '100%', background: '#07050A', border: '1px solid #3D3020', borderRadius: 7, padding: '8px 10px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>
                    {microphones.map(function(m, i) {
                      return <option key={m.deviceId} value={m.deviceId}>{m.label || 'Microphone ' + (i + 1)}</option>;
                    })}
                  </select>
                )}
              </div>

              {/* Mic level meter */}
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginBottom: 6 }}>MIC LEVEL</div>
                <div style={{ background: '#07050A', border: '1px solid #3D3020', borderRadius: 6, height: 20, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: micLevel + '%', background: 'linear-gradient(90deg,' + levelColor + '88,' + levelColor + ')', borderRadius: 6, transition: 'width 60ms' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#F0E8D4' }}>{micLevel}%</div>
                </div>
                {micLevel > 70 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF1A3C', marginTop: 3 }}>⚠ Clipping — lower your mic gain</div>}
              </div>

              {/* Speaker selector */}
              {speakers.length > 0 && (
                <div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginBottom: 4 }}>SPEAKER OUTPUT</div>
                  <select style={{ width: '100%', background: '#07050A', border: '1px solid #3D3020', borderRadius: 7, padding: '8px 10px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>
                    {speakers.map(function(s, i) {
                      return <option key={s.deviceId} value={s.deviceId}>{s.label || 'Speaker ' + (i + 1)}</option>;
                    })}
                  </select>
                </div>
              )}

              {/* Audio processing toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>AUDIO PROCESSING</div>
                {[
                  ['Noise Suppression', noiseSup, setNoiseSup, '#C9A84C'],
                  ['Echo Cancellation', echoCan, setEchoCan, '#C9A84C'],
                  ['Auto Gain Control', autoGain, setAutoGain, '#C9A84C'],
                ].map(function(item) {
                  return (
                    <div key={item[0]} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(26,21,16,.7)', border: '1px solid #3D3020', borderRadius: 8, padding: '8px 12px' }}>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#F0E8D4' }}>{item[0]}</span>
                      <button onClick={function() { item[2](function(v) { return !v; }); }}
                        style={{ background: item[1] ? item[3] + '22' : 'rgba(26,21,16,.5)', border: '1px solid ' + (item[1] ? item[3] + '66' : '#3D3020'), borderRadius: 20, padding: '4px 12px', color: item[1] ? item[3] : '#8A7A62', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', minWidth: 48 }}>
                        {item[1] ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* QUALITY TAB */}
          {tab === 'quality' && (
            <>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>VIDEO QUALITY PRESET</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {QUALITY_PRESETS.map(function(p) {
                  var active = quality === p.id;
                  var mbps   = Math.floor(p.bitrate / 1000000 * 10) / 10;
                  return (
                    <button key={p.id} onClick={function() { setQuality(p.id); }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: active ? 'rgba(201,168,76,.1)' : 'rgba(26,21,16,.7)', border: '1px solid ' + (active ? 'rgba(201,168,76,.45)' : '#3D3020'), borderRadius: 9, padding: '10px 14px', cursor: 'pointer', textAlign: 'left' }}>
                      <div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: active ? '#C9A84C' : '#F0E8D4' }}>{p.label}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62' }}>{p.width}×{p.height} · {p.frameRate}fps</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: active ? '#C9A84C' : '#8A7A62' }}>{mbps} Mbps</div>
                        {active && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C' }}>✓ SELECTED</div>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bandwidth advisory */}
              <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', marginBottom: 4 }}>BANDWIDTH GUIDE</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', lineHeight: 1.6 }}>
                  360p → 1 Mbps upload<br />
                  480p → 2 Mbps upload<br />
                  720p → 5 Mbps upload<br />
                  1080p → 10 Mbps upload<br />
                  4K → 25 Mbps upload
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer buttons */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #3D3020', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={startPreview}
            style={{ flex: 1, padding: '9px', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
            🔄 TEST
          </button>
          <button onClick={handleApply}
            style={{ flex: 2, padding: '9px', background: 'linear-gradient(135deg,rgba(201,168,76,.25),rgba(128,0,32,.25))', border: '1px solid rgba(201,168,76,.5)', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            ✓ APPLY &amp; CLOSE
          </button>
        </div>

      </div>
    </div>
  );
}
