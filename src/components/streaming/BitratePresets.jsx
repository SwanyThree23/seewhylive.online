import React from 'react';

const PRESETS = [
  { label: '480p', bitrate: 1500, recommended: false, desc: 'Mobile' },
  { label: '720p', bitrate: 3000, recommended: true, desc: 'Recommended' },
  { label: '1080p', bitrate: 5000, recommended: false, desc: 'High Quality' },
  { label: '1440p', bitrate: 7500, recommended: false, desc: 'Ultra HD' },
];

export default function BitratePresets({ selected, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] text-white/60 uppercase block font-semibold">Bitrate Presets</label>
      <div className="grid grid-cols-2 gap-1.5">
        {PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => onChange(preset.bitrate)}
            className={`py-2 px-2 rounded-lg text-center transition-all border text-[10px] font-semibold ${
              selected === preset.bitrate
                ? 'bg-[#d4af37] text-black border-[#d4af37]'
                : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
            }`}
          >
            <p>{preset.label}</p>
            <p className="text-[8px] text-white/40 mt-0.5">{preset.bitrate} kbps</p>
            {preset.recommended && <p className="text-[7px] text-white/50 mt-1">✓</p>}
          </button>
        ))}
      </div>
    </div>
  );
}