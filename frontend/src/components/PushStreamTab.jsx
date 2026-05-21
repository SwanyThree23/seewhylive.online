import React, { useState } from 'react';

const RTMP_URL = 'rtmp://2.24.194.112:1935/live';
const STREAM_KEY_PLACEHOLDER = 'seewhy-stream-key-here';

const QUALITY_PRESETS = [
  { id: '4k',  label: '4K',     res: '3840x2160', fps: 60, bitrate: '20000 kbps', encoder: 'x264 / NVENC' },
  { id: '1080',label: '1080p',  res: '1920x1080', fps: 60, bitrate: '8000 kbps',  encoder: 'x264 / NVENC' },
  { id: '720', label: '720p',   res: '1280x720',  fps: 30, bitrate: '4500 kbps',  encoder: 'x264'         },
  { id: 'mob', label: 'Mobile', res: '854x480',   fps: 30, bitrate: '2000 kbps',  encoder: 'x264'         },
];

const SETUP_TABS = [
  { id: 'obs',        label: 'OBS' },
  { id: 'streamlabs', label: 'Streamlabs' },
  { id: 'vmix',       label: 'vMix' },
  { id: 'mobile',     label: 'Mobile' },
  { id: 'srt',        label: 'SRT' },
];

const STEPS = {
  obs: [
    'Open OBS Studio → Settings → Stream',
    'Service: Custom… | Server: ' + RTMP_URL,
    'Stream Key: (paste your key from KEYS tab)',
    'Settings → Output → Streaming: set Bitrate & Encoder below',
    'Click Start Streaming — OBS pushes to SeeWhy LIVE',
  ],
  streamlabs: [
    'Open Streamlabs Desktop → Settings (gear icon)',
    'Stream tab → Custom RTMP Server',
    'Server URL: ' + RTMP_URL,
    'Stream Key: (paste your key from KEYS tab)',
    'Output tab → set Video Bitrate & Encoder',
    'Click Go Live',
  ],
  vmix: [
    'Add Input → Camera / NDI / Virtual Camera',
    'Click Stream button at bottom toolbar',
    'Destination: Custom RTMP',
    'URL: ' + RTMP_URL + '  |  Stream Key: (from KEYS tab)',
    'Set Quality and click Start Streaming',
  ],
  mobile: [
    'Install Larix Broadcaster (iOS / Android)',
    'Settings → Connections → New Connection',
    'URL: ' + RTMP_URL + '/<your-stream-key>',
    'Set Resolution to 720p or 1080p',
    'Tap the Record button to go live',
  ],
  srt: [
    'SRT Ingest: srt://2.24.194.112:9710',
    'Passphrase: (request from host)',
    'In OBS: Settings → Stream → Custom SRT',
    'Or use ffmpeg: ffmpeg -re -i input.mp4 -c copy -f mpegts srt://2.24.194.112:9710',
    'Latency 120ms — best for unstable connections',
  ],
};

export default function PushStreamTab({ isLive, addToast }) {
  const [activeSetup, setActiveSetup] = useState('obs');
  const [selectedPreset, setSelectedPreset] = useState('1080');
  const [keyVisible, setKeyVisible] = useState(false);
  const [copied, setCopied] = useState('');

  function copyText(text, label) {
    navigator.clipboard.writeText(text).then(function() {
      setCopied(label);
      addToast(label + ' copied', 'success');
      setTimeout(function() { setCopied(''); }, 1800);
    }).catch(function() {
      addToast('Copy failed — select text manually', 'error');
    });
  }

  var preset = QUALITY_PRESETS.find(function(p) { return p.id === selectedPreset; }) || QUALITY_PRESETS[1];
  var steps = STEPS[activeSetup] || [];

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* Status banner */}
      <div style={{ background: isLive ? 'rgba(128,0,32,.18)' : 'rgba(36,28,52,.7)', border: '1px solid ' + (isLive ? '#FF1A3C44' : '#241C34'), borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: isLive ? '#FF1A3C' : '#7A6F90', boxShadow: isLive ? '0 0 8px #FF1A3C' : 'none', flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: isLive ? '#EDE8F5' : '#7A6F90' }}>
            {isLive ? '🔴 INGEST ACTIVE' : 'INGEST READY'}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>{RTMP_URL}</div>
        </div>
      </div>

      {/* RTMP endpoint card */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 1 }}>SERVER / RTMP URL</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ flex: 1, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '6px 8px', fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#C9A84C', wordBreak: 'break-all' }}>
            {RTMP_URL}
          </div>
          <button
            onClick={function() { copyText(RTMP_URL, 'RTMP URL'); }}
            style={{ background: copied === 'RTMP URL' ? 'rgba(0,201,167,.2)' : 'rgba(201,168,76,.1)', border: '1px solid ' + (copied === 'RTMP URL' ? '#00C9A7' : '#C9A84C44'), borderRadius: 6, padding: '6px 10px', color: copied === 'RTMP URL' ? '#00C9A7' : '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>
            {copied === 'RTMP URL' ? '✓' : 'COPY'}
          </button>
        </div>

        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 1, marginTop: 4 }}>STREAM KEY</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ flex: 1, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '6px 8px', fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#EDE8F5' }}>
            {keyVisible ? STREAM_KEY_PLACEHOLDER : '••••••••••••••••••••'}
          </div>
          <button
            onClick={function() { setKeyVisible(function(v) { return !v; }); }}
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid #241C34', borderRadius: 6, padding: '6px 8px', color: '#7A6F90', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
            {keyVisible ? '🙈' : '👁'}
          </button>
          <button
            onClick={function() { copyText(STREAM_KEY_PLACEHOLDER, 'Stream Key'); }}
            style={{ background: copied === 'Stream Key' ? 'rgba(0,201,167,.2)' : 'rgba(201,168,76,.1)', border: '1px solid ' + (copied === 'Stream Key' ? '#00C9A7' : '#C9A84C44'), borderRadius: 6, padding: '6px 10px', color: copied === 'Stream Key' ? '#00C9A7' : '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>
            {copied === 'Stream Key' ? '✓' : 'COPY'}
          </button>
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>
          Save key to KEYS tab for auto-inject on fanout.
        </div>
      </div>

      {/* Quality presets */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 1, marginBottom: 8 }}>QUALITY PRESET</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {QUALITY_PRESETS.map(function(pr) {
            var active = selectedPreset === pr.id;
            return (
              <button
                key={pr.id}
                onClick={function() { setSelectedPreset(pr.id); }}
                style={{ flex: 1, padding: '6px 0', background: active ? 'linear-gradient(135deg,#800020,#C01838)' : 'rgba(36,28,52,.8)', border: '1px solid ' + (active ? '#C9A84C55' : '#241C34'), borderRadius: 6, color: active ? '#C9A84C' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                {pr.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
          {[
            ['Resolution', preset.res],
            ['FPS',        String(preset.fps)],
            ['Bitrate',    preset.bitrate],
            ['Encoder',    preset.encoder],
          ].map(function(row) {
            return (
              <div key={row[0]}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{row[0]}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C' }}>{row[1]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Setup guide tabs */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #241C34' }}>
          {SETUP_TABS.map(function(t) {
            var active = activeSetup === t.id;
            return (
              <button
                key={t.id}
                onClick={function() { setActiveSetup(t.id); }}
                style={{ flex: 1, padding: '8px 0', background: active ? 'rgba(128,0,32,.25)' : 'transparent', border: 'none', borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent', color: active ? '#C9A84C' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                {t.label}
              </button>
            );
          })}
        </div>
        <div style={{ padding: '12px' }}>
          {steps.map(function(step, i) {
            return (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(128,0,32,.4)', border: '1px solid #C9A84C44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#A09AB8', lineHeight: 1.5, flex: 1, wordBreak: 'break-all' }}>
                  {step}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
