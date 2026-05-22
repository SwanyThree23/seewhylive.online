import React, { useState } from 'react';

var PRESETS = [
  { name: 'Washington Classic', gold: '#C9A84C', burg: '#800020', desc: 'Official tournament palette' },
  { name: 'Midnight Domino',    gold: '#E8C46A', burg: '#C01838', desc: 'Deep red night mode' },
  { name: 'Cyber Teal',         gold: '#00C9A7', burg: '#00FFFF', desc: 'Electric neon finish' },
  { name: 'Glitch Lime',        gold: '#E8FF47', burg: '#FF0040', desc: 'Fades battle mode' },
  { name: 'Royal Purple',       gold: '#C084FC', burg: '#5B2D8E', desc: 'Premium prestige' },
  { name: 'Monochrome',         gold: '#EDE8F5', burg: '#3D3450', desc: 'Clean minimal' },
];

var FONT_OPTIONS = [
  { id: 'bebas',   label: 'Bebas Neue',       sample: 'SEEWHY LIVE' },
  { id: 'barlow',  label: 'Barlow Condensed',  sample: 'SEEWHY LIVE' },
  { id: 'mono',    label: 'DM Mono',           sample: 'SEEWHY LIVE' },
];

var OVERLAY_OPTS = [
  { key: 'showScoreBar',  label: 'Score Bar in FADES' },
  { key: 'showViewers',   label: 'Viewer Count HUD' },
  { key: 'showLowerThirds', label: 'Lower Thirds on Stage' },
  { key: 'showTimer',     label: 'Countdown Timer' },
  { key: 'showReactions', label: 'Gift Reactions' },
];

var FONT_FAMILIES = {
  bebas:  "'Bebas Neue',sans-serif",
  barlow: "'Barlow Condensed',sans-serif",
  mono:   "'DM Mono',monospace",
};

export default function BrandingTab({ branding, setBranding }) {
  var [tab, setTab] = useState('theme');

  var gold = branding.gold || '#C9A84C';
  var burg = branding.burg || '#800020';
  var font = branding.font || 'bebas';
  var ff   = FONT_FAMILIES[font] || FONT_FAMILIES.bebas;

  function update(key, value) {
    setBranding(function(prev) { return Object.assign({}, prev, { [key]: value }); });
  }

  function applyPreset(p) {
    setBranding(function(prev) { return Object.assign({}, prev, { gold: p.gold, burg: p.burg }); });
  }

  function getToggle(key) {
    return branding[key] !== false;
  }

  var TABS = [['theme', '🎨 THEME'], ['options', '⚙ OPTIONS'], ['preview', '👁 PREVIEW']];

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.1),rgba(128,0,32,.1))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', letterSpacing: 3 }}>🎨 BRANDING SYSTEM</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90' }}>Washington Classic × Domino Entertainment × VibeN'Bones</div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: 3 }}>
        {TABS.map(function(t) {
          var active = tab === t[0];
          return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }}
              style={{ flex: 1, padding: '7px 0', background: active ? 'rgba(201,168,76,.12)' : 'transparent', border: 'none', borderRadius: 6, color: active ? '#C9A84C' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {/* ── THEME ── */}
      {tab === 'theme' && (
        <>
          {/* Color presets */}
          <div style={{ background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 2, marginBottom: 8 }}>PRESETS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {PRESETS.map(function(p) {
                var isActive = gold === p.gold && burg === p.burg;
                return (
                  <button key={p.name} onClick={function() { applyPreset(p); }}
                    style={{ background: isActive ? 'rgba(201,168,76,.1)' : 'rgba(7,5,10,.7)', border: '1px solid ' + (isActive ? p.gold + '88' : '#241C34'), borderRadius: 8, padding: '8px 10px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,' + p.gold + ',' + p.burg + ')', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: isActive ? p.gold : '#EDE8F5', lineHeight: 1.2 }}>{p.name}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom color pickers */}
          <div style={{ background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 2, marginBottom: 10 }}>CUSTOM COLORS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['gold', 'Primary Gold', gold], ['burg', 'Accent Burgundy', burg]].map(function(row) {
                return (
                  <div key={row[0]} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: row[2], border: '2px solid rgba(255,255,255,.1)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#EDE8F5' }}>{row[1]}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>{row[2].toUpperCase()}</div>
                    </div>
                    <input type="color" value={row[2]}
                      onChange={function(e) { update(row[0], e.target.value); }}
                      style={{ width: 36, height: 36, padding: 2, background: 'none', border: '1px solid #241C34', borderRadius: 7, cursor: 'pointer' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Font selection */}
          <div style={{ background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 2, marginBottom: 8 }}>DISPLAY FONT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {FONT_OPTIONS.map(function(fo) {
                var active = font === fo.id;
                return (
                  <button key={fo.id} onClick={function() { update('font', fo.id); }}
                    style={{ background: active ? 'rgba(201,168,76,.1)' : 'rgba(7,5,10,.6)', border: '1px solid ' + (active ? gold + '66' : '#241C34'), borderRadius: 7, padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: FONT_FAMILIES[fo.id], fontSize: 15, color: active ? gold : '#EDE8F5', letterSpacing: active ? 3 : 1 }}>{fo.sample}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: active ? gold : '#7A6F90' }}>{fo.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── OPTIONS ── */}
      {tab === 'options' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {OVERLAY_OPTS.map(function(opt) {
            var on = getToggle(opt.key);
            return (
              <div key={opt.key} style={{ background: on ? 'rgba(201,168,76,.04)' : 'rgba(22,16,32,.5)', border: '1px solid ' + (on ? gold + '25' : '#241C34'), borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: on ? '#EDE8F5' : '#7A6F90' }}>{opt.label}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: on ? gold : '#3D3450', letterSpacing: 1 }}>{on ? 'ENABLED' : 'HIDDEN'}</div>
                </div>
                <div onClick={function() { update(opt.key, !on); }}
                  style={{ width: 36, height: 20, borderRadius: 999, background: on ? gold + 'cc' : '#241C34', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: on ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: on ? '#07050A' : '#7A6F90', transition: 'left .18s' }} />
                </div>
              </div>
            );
          })}

          {/* Overlay opacity */}
          <div style={{ background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 1 }}>OVERLAY OPACITY</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: gold }}>{Math.floor((branding.overlayOpacity || 0.85) * 100)}%</div>
            </div>
            <input type="range" min={0} max={100} value={Math.floor((branding.overlayOpacity || 0.85) * 100)}
              onChange={function(e) { update('overlayOpacity', parseInt(e.target.value) / 100); }}
              style={{ width: '100%', accentColor: gold }}
            />
          </div>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {tab === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Stream preview card */}
          <div style={{ background: '#07050A', border: '2px solid ' + gold + '44', borderRadius: 12, overflow: 'hidden' }}>
            {/* Stream header */}
            <div style={{ background: 'linear-gradient(135deg,' + burg + '22,' + gold + '12)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid ' + gold + '22' }}>
              <div style={{ fontFamily: ff, fontSize: 16, color: gold, letterSpacing: 3, flex: 1 }}>SeeWhy LIVE</div>
              <div style={{ background: burg, borderRadius: 4, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: gold, letterSpacing: 2 }}>● LIVE</div>
              {getToggle('showViewers') && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: gold + 'cc' }}>👁 2,847</div>}
            </div>
            {/* Stage area */}
            <div style={{ padding: 14, display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4].map(function(n) {
                return (
                  <div key={n} style={{ flex: 1, aspectRatio: '1', borderRadius: 8, background: 'linear-gradient(135deg,' + burg + '33,' + gold + '18)', border: '1px solid ' + gold + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: gold + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🎲</div>
                    {getToggle('showLowerThirds') && (
                      <div style={{ background: 'rgba(0,0,0,.7)', borderRadius: 3, padding: '1px 4px', borderLeft: '2px solid ' + gold }}>
                        <div style={{ fontFamily: ff, fontSize: 6, color: gold, letterSpacing: 1 }}>PLAYER {n}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Score bar */}
            {getToggle('showScoreBar') && (
              <div style={{ background: 'rgba(0,0,0,.5)', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid ' + gold + '22' }}>
                <span style={{ fontFamily: ff, fontSize: 13, color: '#00FFFF' }}>ALPHA 3</span>
                <div style={{ flex: 1, height: 3, background: '#241C34', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: '60%', background: gold }} />
                  <div style={{ flex: 1, background: '#FF0040' }} />
                </div>
                <span style={{ fontFamily: ff, fontSize: 13, color: '#FF0040' }}>2 OMEGA</span>
              </div>
            )}
            {/* Banner */}
            {getToggle('showTimer') && (
              <div style={{ background: burg + 'ee', padding: '4px 14px', textAlign: 'center', borderTop: '1px solid ' + gold + '33' }}>
                <span style={{ fontFamily: ff, fontSize: 10, color: gold, letterSpacing: 4 }}>STARTING IN 02:47</span>
              </div>
            )}
          </div>

          {/* Color swatch strip */}
          <div style={{ background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 2, marginBottom: 8 }}>ACTIVE PALETTE</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[gold, burg, gold + '55', burg + '33'].map(function(c, i) {
                var labels = ['Primary', 'Accent', 'Tint', 'Shade'];
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                    <div style={{ width: '100%', height: 32, borderRadius: 6, background: c, border: '1px solid rgba(255,255,255,.08)' }} />
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#7A6F90' }}>{labels[i]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
