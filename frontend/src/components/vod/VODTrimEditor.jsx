import React, { useState } from 'react';
import { Scissors, Save } from 'lucide-react';

export default function VODTrimEditor(props) {
  var video    = props.video;
  var onSave   = props.onSave;
  var onCancel = props.onCancel;

  var trimStartState = useState(video.trim_start || 0);
  var trimStart    = trimStartState[0];
  var setTrimStart = trimStartState[1];
  var trimEndState = useState(video.trim_end || video.duration_seconds || 100);
  var trimEnd    = trimEndState[0];
  var setTrimEnd = trimEndState[1];
  var duration = video.duration_seconds || 100;

  var pctStart = (trimStart / duration) * 100;
  var pctEnd   = (trimEnd   / duration) * 100;

  var fmt = function(s) {
    var m   = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  };

  var inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#fff', outline: 'none', marginTop: 4,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
        <Scissors style={{ width: 16, height: 16, color: '#C9A84C' }} />
        <span>Trim Video</span>
        <span style={{ marginLeft: 'auto', color: '#C9A84C', fontFamily: 'monospace', fontSize: 12 }}>
          {fmt(trimStart)} {'→'} {fmt(trimEnd)} ({fmt(trimEnd - trimStart)} kept)
        </span>
      </div>

      {/* Timeline scrubber */}
      <div style={{ position: 'relative', height: 48, background: 'rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Active region */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          background: 'rgba(212,175,55,0.2)',
          borderLeft: '2px solid #C9A84C', borderRight: '2px solid #C9A84C',
          left: pctStart + '%', width: (pctEnd - pctStart) + '%',
        }} />
        <input
          type="range" min={0} max={trimEnd - 1} value={trimStart}
          onChange={function(e) { setTrimStart(Number(e.target.value)); }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'col-resize', zIndex: 10 }}
        />
        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'rgba(255,255,255,0.5)', left: 8 }}>Start</div>
        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'rgba(255,255,255,0.5)', right: 8 }}>End</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Start</label>
          <input
            type="number" min={0} max={trimEnd - 1} value={trimStart}
            onChange={function(e) { setTrimStart(Number(e.target.value)); }}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>End (seconds)</label>
          <input
            type="number" min={trimStart + 1} max={duration} value={trimEnd}
            onChange={function(e) { setTrimEnd(Number(e.target.value)); }}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
        <button
          onClick={onCancel}
          style={{
            fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
          }}
        >
          Cancel
        </button>
        <button
          onClick={function() { onSave({ trim_start: trimStart, trim_end: trimEnd, is_clipped: true }); }}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            background: '#C9A84C', color: '#000', border: 'none',
          }}
        >
          <Save style={{ width: 14, height: 14 }} /> Save Trim
        </button>
      </div>
    </div>
  );
}
