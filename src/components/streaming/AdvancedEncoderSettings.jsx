import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';

const G = '#D4AF37';
const BG = '#080B18';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function AdvancedEncoderSettings({ onApply }) {
  const [bitrate, setBitrate] = useState(2500);
  const [fps, setFps] = useState(30);
  const [resolution, setResolution] = useState('720p');

  return (
    <div className="rounded-xl p-4" style={{ background: BG, border: `1px solid ${G}33`, ...T }}>
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-4 h-4" style={{ color: G }} />
        <h3 className="text-sm font-bold" style={{ color: G }}>Advanced Encoder Settings</h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-white/50 block mb-1">Resolution</label>
          <select value={resolution} onChange={e => setResolution(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#0D1022', border: `1px solid ${G}22`, color: '#fff' }}>
            <option value="480p">480p</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-1">Bitrate: {bitrate} kbps</label>
          <input type="range" min="800" max="6000" step="100" value={bitrate}
            onChange={e => setBitrate(parseInt(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-1">Frame Rate: {fps} fps</label>
          <input type="range" min="24" max="60" step="1" value={fps}
            onChange={e => setFps(parseInt(e.target.value))} className="w-full" />
        </div>
        <button onClick={onApply}
          className="w-full py-2 rounded-lg text-sm font-bold"
          style={{ background: G, color: '#000' }}>
          Apply Settings
        </button>
      </div>
    </div>
  );
}