import React from 'react';

const PRESETS = [
  { name: 'Washington Classic', gold: '#C9A84C', burg: '#800020' },
  { name: 'Midnight Domino', gold: '#E8C46A', burg: '#C01838' },
  { name: 'Cyber Teal', gold: '#00C9A7', burg: '#00FFFF' },
  { name: 'Glitch Lime', gold: '#E8FF47', burg: '#FF0040' }
];

export default function BrandingTab({ branding, setBranding }) {
  function update(key, value) {
    setBranding((prev) => ({ ...prev, [key]: value }));
  }

  function applyPreset(preset) {
    setBranding((prev) => ({ ...prev, gold: preset.gold, burg: preset.burg }));
  }

  return (
    <div className="tab-panel">
      <div className="glass-card">
        <h2 className="panel-title">🎨 BRANDING SYSTEM</h2>
        <p className="panel-sub">Washington Classic × Domino Entertainment × VibeN'Bones</p>

        <div className="brand-section">
          <h3 className="brand-section-title">PRESETS</h3>
          <div className="preset-grid">
            {PRESETS.map((p) => (
              <button key={p.name} className="preset-btn" onClick={() => applyPreset(p)}
                style={{ borderColor: p.gold, color: p.gold }}>
                <div className="preset-swatch" style={{ background: 'linear-gradient(135deg, ' + p.gold + ', ' + p.burg + ')' }} />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="brand-section">
          <h3 className="brand-section-title">COLORS</h3>
          <div className="color-row">
            <label className="color-label">Primary Gold</label>
            <input type="color" value={branding.gold || '#C9A84C'} onChange={(e) => update('gold', e.target.value)} className="color-picker" />
            <span className="color-hex">{branding.gold || '#C9A84C'}</span>
          </div>
          <div className="color-row">
            <label className="color-label">Burgundy</label>
            <input type="color" value={branding.burg || '#800020'} onChange={(e) => update('burg', e.target.value)} className="color-picker" />
            <span className="color-hex">{branding.burg || '#800020'}</span>
          </div>
        </div>

        <div className="brand-section">
          <h3 className="brand-section-title">UI OPTIONS</h3>
          <div className="toggle-row">
            <label className="toggle-label">Show Score Bar in FADES</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={branding.showScoreBar !== false} onChange={(e) => update('showScoreBar', e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className="toggle-row">
            <label className="toggle-label">Show Viewer Count</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={branding.showViewers !== false} onChange={(e) => update('showViewers', e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* Live preview */}
        <div className="brand-preview" style={{ borderColor: branding.gold || '#C9A84C' }}>
          <div className="preview-title" style={{ color: branding.gold || '#C9A84C', fontFamily: 'Bebas Neue, sans-serif' }}>
            SeeWhy LIVE PREVIEW
          </div>
          <div className="preview-badge" style={{ background: branding.burg || '#800020' }}>LIVE</div>
          <div className="preview-oct" style={{ background: 'linear-gradient(135deg, ' + (branding.burg || '#800020') + ', ' + (branding.gold || '#C9A84C') + ')', clipPath: 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)', width: 60, height: 60 }} />
        </div>
      </div>
    </div>
  );
}
