import React from 'react';
import { Camera, Sun, Film, Aperture, Gauge, Palette } from 'lucide-react';

const PURPLE = '#7B5DA6';

// ── Effect option tables (each entry's suffix layers into the video prompt) ──
const COLOR_GRADES = [
  { id: 'none',        name: 'Natural',     suffix: '' },
  { id: 'warm',        name: 'Warm',        suffix: 'warm color grade, golden amber tones, soft highlights' },
  { id: 'cool',        name: 'Cool',        suffix: 'cool color grade, blue-cyan tones, crisp highlights' },
  { id: 'teal-orange', name: 'Teal/Orange', suffix: 'teal-and-orange cinematic color grade, high contrast, blockbuster look' },
  { id: 'noir',        name: 'Noir',        suffix: 'black-and-white film noir, high contrast monochrome, dramatic shadows' },
  { id: 'vintage',     name: 'Vintage',     suffix: 'vintage film look, faded warm tones, subtle halation, 35mm grain' },
  { id: 'neon',        name: 'Neon',        suffix: 'neon-drenched color grade, magenta and cyan glow, synthwave mood' },
];

const CAMERA_MOVES = [
  { id: 'static',  name: 'Static',    suffix: 'locked-off static camera' },
  { id: 'push-in', name: 'Push In',   suffix: 'slow cinematic push-in camera move' },
  { id: 'orbit',   name: 'Orbit',     suffix: 'smooth orbiting camera move around the product' },
  { id: 'pan',     name: 'Pan',       suffix: 'slow horizontal pan camera move' },
  { id: 'tilt',    name: 'Tilt',      suffix: 'slow vertical tilt camera move' },
  { id: 'dolly',   name: 'Dolly',     suffix: 'dolly tracking shot moving through the scene' },
];

const LIGHTING = [
  { id: 'studio',   name: 'Studio',    suffix: 'soft diffused studio lighting' },
  { id: 'natural',  name: 'Natural',   suffix: 'natural daylight from a large window' },
  { id: 'dramatic', name: 'Dramatic',  suffix: 'dramatic chiaroscuro lighting, deep shadows, single key light' },
  { id: 'neon',     name: 'Neon',      suffix: 'neon accent lighting, magenta and cyan rim lights' },
  { id: 'golden',   name: 'Golden Hr', suffix: 'golden-hour backlight, warm rim glow, long shadows' },
  { id: 'highkey',  name: 'High Key',  suffix: 'high-key bright even lighting, minimal shadows' },
];

const SPEED = [
  { id: 'normal',     name: 'Normal',     suffix: 'normal speed motion' },
  { id: 'slowmo',     name: 'Slow-Mo',     suffix: 'slow-motion 120fps feel, dreamy fluid motion' },
  { id: 'ramp',       name: 'Speed Ramp',  suffix: 'dynamic speed ramp from slow to fast' },
  { id: 'hyperlapse', name: 'Hyperlapse',  suffix: 'hyperlapse time compression' },
];

const FILM_GRAIN = [
  { id: 'none',  name: 'Off',   suffix: '' },
  { id: 'light', name: 'Light', suffix: 'subtle 35mm film grain' },
  { id: 'heavy', name: 'Heavy', suffix: 'heavy vintage film grain, textured emulsion' },
];

// ── Compose the effects object into a prompt suffix string ──
export function effectsToPromptSuffix(effects) {
  if (!effects) return '';
  const parts = [
    COLOR_GRADES.find((c) => c.id === effects.colorGrade)?.suffix,
    LIGHTING.find((l) => l.id === effects.lighting)?.suffix,
    CAMERA_MOVES.find((c) => c.id === effects.camera)?.suffix,
    SPEED.find((s) => s.id === effects.speed)?.suffix,
    FILM_GRAIN.find((f) => f.id === effects.grain)?.suffix,
    effects.letterbox ? 'cinematic 2.39:1 anamorphic letterbox framing' : null,
    effects.vignette ? 'subtle vignette darkening edges' : null,
    effects.bokeh ? 'shallow depth of field with creamy bokeh' : null,
  ].filter(Boolean);
  return parts.length ? `. ${parts.join(', ')}` : '';
}

const DEFAULTS = {
  colorGrade: 'none', lighting: 'studio', camera: 'push-in',
  speed: 'normal', grain: 'none', letterbox: false, vignette: false, bokeh: false,
};

function ChipRow({ label, icon: Icon, options, value, onChange }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5"
        style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
        <Icon className="w-3 h-3" style={{ color: PURPLE }} /> {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button key={opt.id} onClick={() => onChange(opt.id)}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95"
              style={{
                background: active ? 'rgba(123,93,166,0.22)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? PURPLE + 'aa' : 'transparent'}`,
                color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                fontFamily: 'Barlow Condensed, sans-serif',
              }}>
              {opt.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ label, icon: Icon, checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all active:scale-95"
      style={{
        background: checked ? 'rgba(123,93,166,0.18)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${checked ? PURPLE + '88' : 'transparent'}`,
        flex: '1 1 auto',
      }}>
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: checked ? PURPLE : 'rgba(255,255,255,0.3)' }} />
      <span className="text-[10px] font-bold uppercase tracking-wide"
        style={{ color: checked ? '#fff' : 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
        {label}
      </span>
      <div className="ml-auto w-7 h-4 rounded-full relative shrink-0"
        style={{ background: checked ? PURPLE : 'rgba(255,255,255,0.1)', transition: 'background 0.2s' }}>
        <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
          style={{ left: checked ? 14 : 2 }} />
      </div>
    </button>
  );
}

export default function CinematicEffectsPanel({ value, onChange }) {
  const v = value || DEFAULTS;
  const set = (k, val) => onChange({ ...v, [k]: val });

  return (
    <div>
      <ChipRow label="Color Grade" icon={Palette} options={COLOR_GRADES} value={v.colorGrade} onChange={(id) => set('colorGrade', id)} />
      <ChipRow label="Lighting" icon={Sun} options={LIGHTING} value={v.lighting} onChange={(id) => set('lighting', id)} />
      <ChipRow label="Camera Move" icon={Camera} options={CAMERA_MOVES} value={v.camera} onChange={(id) => set('camera', id)} />
      <ChipRow label="Motion Speed" icon={Gauge} options={SPEED} value={v.speed} onChange={(id) => set('speed', id)} />
      <ChipRow label="Film Grain" icon={Film} options={FILM_GRAIN} value={v.grain} onChange={(id) => set('grain', id)} />

      <p className="text-[10px] font-black uppercase tracking-widest mb-1.5 mt-1 flex items-center gap-1.5"
        style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
        <Aperture className="w-3 h-3" style={{ color: PURPLE }} /> Finishing
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Toggle label="Letterbox" icon={Film} checked={!!v.letterbox} onChange={(c) => set('letterbox', c)} />
        <Toggle label="Vignette" icon={Aperture} checked={!!v.vignette} onChange={(c) => set('vignette', c)} />
        <Toggle label="Bokeh" icon={Camera} checked={!!v.bokeh} onChange={(c) => set('bokeh', c)} />
      </div>

      <p className="mt-3 text-[9px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Effects layer onto the video prompt — combine a color grade, lighting mood, camera move, and finishing touches for a cinematic ad look.
      </p>
    </div>
  );
}