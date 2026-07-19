import React, { useState, useEffect, useRef } from 'react';
import { MobileSelect } from '@/components/ui/MobileSelect';

export default function PreJoinSettingsModal(props) {
  var open = props.open;
  var onClose = props.onClose;
  var stream = props.stream;
  var cameras = (props.devices && props.devices.cameras) || [];

  var videoRef = useRef(null);
  var [resolution, setResolution] = useState('auto');
  var [beautify, setBeautify] = useState(false);
  var [mirror, setMirror] = useState(false);

  useEffect(function () {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!open) return null;

  var panelStyle = {
    background: '#120d08',
    border: '1px solid #FFD70033',
    borderRadius: '14px',
    width: '100%',
    maxWidth: '420px',
    padding: '20px',
    fontFamily: 'Rajdhani, sans-serif',
    color: '#F5F0E6',
  };

  var rowLabel = {
    fontSize: '13px',
    color: '#B8ADA0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  };

  var selectStyle = {
    width: '100%',
    minHeight: '44px',
    background: '#1a1410',
    color: '#F5F0E6',
    border: '1px solid #FFD70033',
    borderRadius: '8px',
    padding: '0 10px',
    fontSize: '14px',
    fontFamily: 'Rajdhani, sans-serif',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000cc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
      }}
      onClick={onClose}
    >
      <div style={panelStyle} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '15px', color: '#FFD700' }}>
            Camera &amp; Audio
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#B8ADA0',
              fontSize: '20px',
              minWidth: '44px',
              minHeight: '44px',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            width: '100%',
            aspectRatio: '4 / 3',
            background: '#000',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '16px',
            border: '1px solid #FFD70022',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: mirror ? 'scaleX(-1)' : 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={rowLabel}>Camera</div>
          <MobileSelect
            value={cameras[0]?.deviceId || ''}
            onChange={function (v) { props.onCameraChange && props.onCameraChange(v); }}
            options={cameras.map(function (cam, i) { return { value: cam.deviceId || String(i), label: cam.label || 'Camera ' + (i + 1) }; })}
            placeholder="Select camera"
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={rowLabel}>Resolution</div>
          <MobileSelect
            value={resolution}
            onChange={function (v) { setResolution(v); props.onResolutionChange && props.onResolutionChange(v); }}
            options={[{ value: 'auto', label: 'Auto' }, { value: '720p', label: '720p' }, { value: '1080p', label: '1080p' }]}
            placeholder="Select resolution"
          />
        </div>

        <ToggleRow
          label="Beautification"
          checked={beautify}
          onChange={function (v) {
            setBeautify(v);
            props.onBeautificationChange && props.onBeautificationChange(v);
          }}
        />
        <ToggleRow
          label="Mirror my camera"
          checked={mirror}
          onChange={function (v) {
            setMirror(v);
            props.onMirrorChange && props.onMirrorChange(v);
          }}
        />

        <button
          onClick={onClose}
          style={{
            width: '100%',
            minHeight: '44px',
            marginTop: '16px',
            background: 'linear-gradient(90deg, #DC143C, #FFD700)',
            border: 'none',
            borderRadius: '8px',
            color: '#120d08',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function ToggleRow(props) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '44px',
        borderBottom: '1px solid #FFD70015',
      }}
    >
      <span style={{ fontSize: '14px', color: '#F5F0E6' }}>{props.label}</span>
      <button
        onClick={function () { props.onChange(!props.checked); }}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '999px',
          border: '1px solid #FFD70044',
          background: props.checked ? '#FFD700' : '#1a1410',
          position: 'relative',
          transition: 'background 150ms ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: props.checked ? '22px' : '2px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: props.checked ? '#120d08' : '#F5F0E6',
            transition: 'left 150ms ease',
          }}
        />
      </button>
    </div>
  );
}
