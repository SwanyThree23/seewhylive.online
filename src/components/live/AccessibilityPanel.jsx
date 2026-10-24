import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Volume2, Type, Monitor, Activity, ChevronDown, ChevronUp } from 'lucide-react';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const LS_KEYS = {
  captions:       'seewhy_a11y_captions',
  captionSize:    'seewhy_a11y_caption_size',
  captionPos:     'seewhy_a11y_caption_pos',
  captionHC:      'seewhy_a11y_caption_hc',
  speakerLabels:  'seewhy_a11y_speaker_labels',
  visualAlert:    'seewhy_a11y_visual_alert',
  flash:          'seewhy_a11y_flash',
  vibrate:        'seewhy_a11y_vibrate',
  transcriptPin:  'seewhy_a11y_transcript_pin',
  slMode:         'seewhy_a11y_sl_mode',
  highContrast:   'seewhy_a11y_high_contrast',
  textScale:      'seewhy_a11y_text_scale',
  reduceMotion:   'seewhy_a11y_reduce_motion',
  colorBlind:     'seewhy_a11y_colorblind',
  srMode:         'seewhy_a11y_sr_mode',
  keyboardNav:    'seewhy_a11y_keyboard_nav',
  cursor:         'seewhy_a11y_cursor',
  focusHighlight: 'seewhy_a11y_focus',
};

const lsGet = (key, def) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? def : v;
  } catch { return def; }
};

const lsSet = (key, val) => {
  try { localStorage.setItem(key, val); } catch {}
};

const lsBool = (key, def = false) => {
  const v = lsGet(key, null);
  if (v === null) return def;
  return v === 'true';
};

export const getA11yPrefs = () => ({
  captions:       lsBool(LS_KEYS.captions),
  captionSize:    lsGet(LS_KEYS.captionSize, 'medium'),
  captionPos:     lsGet(LS_KEYS.captionPos, 'bottom'),
  captionHC:      lsBool(LS_KEYS.captionHC),
  speakerLabels:  lsBool(LS_KEYS.speakerLabels),
  visualAlert:    lsBool(LS_KEYS.visualAlert),
  flash:          lsBool(LS_KEYS.flash),
  vibrate:        lsBool(LS_KEYS.vibrate),
  transcriptPin:  lsBool(LS_KEYS.transcriptPin),
  slMode:         lsBool(LS_KEYS.slMode),
  highContrast:   lsBool(LS_KEYS.highContrast),
  textScale:      lsGet(LS_KEYS.textScale, 'normal'),
  reduceMotion:   lsBool(LS_KEYS.reduceMotion),
  colorBlind:     lsGet(LS_KEYS.colorBlind, 'none'),
  srMode:         lsBool(LS_KEYS.srMode),
  keyboardNav:    lsBool(LS_KEYS.keyboardNav),
  cursor:         lsGet(LS_KEYS.cursor, 'normal'),
  focusHighlight: lsBool(LS_KEYS.focusHighlight),
});

const TEXT_SCALES = [
  { id: 'normal',   label: 'Normal',   px: '16px' },
  { id: 'large',    label: 'Large',    px: '18.4px' },
  { id: 'xlarge',   label: 'X-Large',  px: '20.8px' },
  { id: 'xxlarge',  label: 'XX-Large', px: '24px' },
];

const CAPTION_SIZES = [
  { id: 'small',  label: 'S',  px: '14px' },
  { id: 'medium', label: 'M',  px: '18px' },
  { id: 'large',  label: 'L',  px: '22px' },
  { id: 'xl',     label: 'XL', px: '28px' },
];

const CAPTION_POSITIONS = [
  { id: 'bottom', label: 'Bottom' },
  { id: 'top',    label: 'Top' },
  { id: 'middle', label: 'Middle' },
];

const COLORBLIND_MODES = [
  { id: 'none',          label: 'None' },
  { id: 'protanopia',    label: 'Protanopia' },
  { id: 'deuteranopia',  label: 'Deuteranopia' },
  { id: 'tritanopia',    label: 'Tritanopia' },
  { id: 'monochrome',    label: 'Mono' },
];

const CURSOR_SIZES = [
  { id: 'normal', label: 'Normal' },
  { id: 'large',  label: 'Large' },
  { id: 'xlarge', label: 'X-Large' },
];

const CB_FILTERS = {
  protanopia:   'saturate(0.7) hue-rotate(10deg)',
  deuteranopia: 'saturate(0.8) hue-rotate(-20deg)',
  tritanopia:   'saturate(0.9) hue-rotate(50deg)',
  monochrome:   'grayscale(1)',
};

const CURSOR_CSS = {
  normal: '',
  large:  'zoom-in',
  xlarge: 'zoom-out',
};

function applyColorBlind(mode) {
  let el = document.getElementById('a11y-cb-style');
  if (mode === 'none') {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('style');
    el.id = 'a11y-cb-style';
    document.head.appendChild(el);
  }
  el.textContent = `html { filter: ${CB_FILTERS[mode] || ''} !important; }`;
}

function applyBodyClass(cls, on) {
  if (on) {
    document.body.classList.add(cls);
  } else {
    document.body.classList.remove(cls);
  }
}

function applyTextScale(scale) {
  const entry = TEXT_SCALES.find(s => s.id === scale);
  document.documentElement.style.fontSize = entry ? entry.px : '';
}

function applyCursor(size) {
  document.body.classList.remove('a11y-cursor-large', 'a11y-cursor-xlarge');
  if (size === 'large') document.body.classList.add('a11y-cursor-large');
  if (size === 'xlarge') document.body.classList.add('a11y-cursor-xlarge');
}

function Toggle({ on, onChange, disabled }) {
  return (
    <div
      role="switch"
      aria-checked={on}
      tabIndex={0}
      onClick={() => !disabled && onChange(!on)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); !disabled && onChange(!on); } }}
      style={{
        width: 40, height: 22, borderRadius: 99,
        background: on ? '#800020' : 'rgba(255,255,255,0.1)',
        position: 'relative', cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.2s', flexShrink: 0, opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 21 : 3, width: 16, height: 16,
        borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s',
      }} />
    </div>
  );
}

function ToggleRow({ label, sub, on, onChange }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white font-semibold" style={T}>{label}</p>
        {sub && <p className="text-[10px] text-white/40" style={T}>{sub}</p>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function Chips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className="transition-all"
          style={{
            ...T,
            fontSize: 10, fontWeight: 700,
            padding: '2px 8px', borderRadius: 99,
            border: `1px solid ${value === o.id ? GOLD : 'rgba(255,255,255,0.12)'}`,
            background: value === o.id ? `${GOLD}18` : 'transparent',
            color: value === o.id ? GOLD : 'rgba(255,255,255,0.45)',
            cursor: 'pointer',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Section({ icon, title, children, open, onToggle }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.6)' }}>
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 15 }}>{icon}</span>
          <span className="text-xs font-black uppercase text-white" style={{ ...T, letterSpacing: '0.08em' }}>{title}</span>
        </div>
        {open ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-white/5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AccessibilityPanel() {
  const prefs = getA11yPrefs();

  const [captions,      setCaptions]      = useState(prefs.captions);
  const [captionSize,   setCaptionSize]   = useState(prefs.captionSize);
  const [captionPos,    setCaptionPos]    = useState(prefs.captionPos);
  const [captionHC,     setCaptionHC]     = useState(prefs.captionHC);
  const [speakerLabels, setSpeakerLabels] = useState(prefs.speakerLabels);
  const [visualAlert,   setVisualAlert]   = useState(prefs.visualAlert);
  const [flash,         setFlash]         = useState(prefs.flash);
  const [vibrate,       setVibrate]       = useState(prefs.vibrate);
  const [transcriptPin, setTranscriptPin] = useState(prefs.transcriptPin);
  const [slMode,        setSlMode]        = useState(prefs.slMode);

  const [highContrast,   setHighContrast]   = useState(prefs.highContrast);
  const [textScale,      setTextScale]      = useState(prefs.textScale);
  const [reduceMotion,   setReduceMotion]   = useState(prefs.reduceMotion);
  const [colorBlind,     setColorBlind]     = useState(prefs.colorBlind);
  const [srMode,         setSrMode]         = useState(prefs.srMode);
  const [keyboardNav,    setKeyboardNav]    = useState(prefs.keyboardNav);
  const [cursor,         setCursor]         = useState(prefs.cursor);
  const [focusHighlight, setFocusHighlight] = useState(prefs.focusHighlight);

  const [hearingOpen, setHearingOpen] = useState(true);
  const [visionOpen,  setVisionOpen]  = useState(true);

  const srRef = useRef(null);

  // Apply side effects on mount
  useEffect(() => {
    applyBodyClass('a11y-high-contrast',   highContrast);
    applyBodyClass('a11y-reduce-motion',   reduceMotion);
    applyBodyClass('a11y-keyboard-nav',    keyboardNav);
    applyBodyClass('a11y-focus-highlight', focusHighlight);
    applyTextScale(textScale);
    applyColorBlind(colorBlind);
    applyCursor(cursor);
  }, []);

  // Persist + side-effect helpers
  const set = (stateSetter, key, sideEffect) => (val) => {
    stateSetter(val);
    lsSet(key, typeof val === 'boolean' ? String(val) : val);
    if (sideEffect) sideEffect(val);
  };

  const announce = (msg) => {
    if (srRef.current) {
      srRef.current.textContent = '';
      setTimeout(() => { if (srRef.current) srRef.current.textContent = msg; }, 50);
    }
  };

  const isActive = captions || captionHC || speakerLabels || visualAlert || flash ||
    vibrate || transcriptPin || slMode || highContrast || textScale !== 'normal' ||
    reduceMotion || colorBlind !== 'none' || srMode || keyboardNav ||
    cursor !== 'normal' || focusHighlight;

  return (
    <div className="space-y-3" role="region" aria-label="Accessibility Settings">
      {/* ARIA live region for screen readers */}
      <div ref={srRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: GOLD }} />
          <span className="text-sm font-black uppercase text-white" style={{ ...T, letterSpacing: '0.06em' }}>Accessibility</span>
        </div>
        {isActive && (
          <span style={{
            ...T, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em',
            padding: '2px 7px', borderRadius: 99,
            background: `${GOLD}18`, border: `1px solid ${GOLD}40`, color: GOLD,
          }}>
            ♿ ACTIVE
          </span>
        )}
      </div>

      {/* HEARING IMPAIRED */}
      <Section icon="👂" title="Hearing Impaired" open={hearingOpen} onToggle={() => setHearingOpen(v => !v)}>
        <div className="pt-2 space-y-3">
          <ToggleRow
            label="Live Captions"
            sub="Real-time speech-to-text overlay"
            on={captions}
            onChange={set(setCaptions, LS_KEYS.captions, v => announce(v ? 'Live captions enabled' : 'Live captions disabled'))}
          />

          {captions && (
            <>
              <div className="space-y-1">
                <p className="text-[10px] text-white/40 uppercase" style={T}>Caption Size</p>
                <Chips options={CAPTION_SIZES} value={captionSize} onChange={set(setCaptionSize, LS_KEYS.captionSize)} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-white/40 uppercase" style={T}>Caption Position</p>
                <Chips options={CAPTION_POSITIONS} value={captionPos} onChange={set(setCaptionPos, LS_KEYS.captionPos)} />
              </div>
              <ToggleRow
                label="High Contrast Captions"
                sub="Black background, white text"
                on={captionHC}
                onChange={set(setCaptionHC, LS_KEYS.captionHC)}
              />
              <ToggleRow
                label="Speaker Labels"
                sub="Show speaker name before each caption"
                on={speakerLabels}
                onChange={set(setSpeakerLabels, LS_KEYS.speakerLabels)}
              />
            </>
          )}

          <ToggleRow
            label="Always Show Transcript"
            sub="Keep transcription panel pinned open"
            on={transcriptPin}
            onChange={set(setTranscriptPin, LS_KEYS.transcriptPin)}
          />
          <ToggleRow
            label="Visual Sound Alert"
            sub="Pulsing ring when audio is detected"
            on={visualAlert}
            onChange={set(setVisualAlert, LS_KEYS.visualAlert)}
          />
          <ToggleRow
            label="Flash on Event"
            sub="Border flashes gold on chat, raised hand"
            on={flash}
            onChange={set(setFlash, LS_KEYS.flash)}
          />
          <ToggleRow
            label="Vibrate on Mention"
            sub="Haptic feedback on mobile devices"
            on={vibrate}
            onChange={set(setVibrate, LS_KEYS.vibrate, v => {
              if (v && navigator.vibrate) navigator.vibrate(50);
            })}
          />
          <ToggleRow
            label="Sign Language Mode"
            sub="Reserves a PiP slot for SL Interpreter"
            on={slMode}
            onChange={set(setSlMode, LS_KEYS.slMode)}
          />
        </div>
      </Section>

      {/* VISION IMPAIRED */}
      <Section icon="👁" title="Vision Impaired" open={visionOpen} onToggle={() => setVisionOpen(v => !v)}>
        <div className="pt-2 space-y-3">
          <ToggleRow
            label="High Contrast Mode"
            sub="Maximum contrast for all UI elements"
            on={highContrast}
            onChange={set(setHighContrast, LS_KEYS.highContrast, v => {
              applyBodyClass('a11y-high-contrast', v);
              announce(v ? 'High contrast mode enabled' : 'High contrast mode disabled');
            })}
          />

          <div className="space-y-1">
            <p className="text-[10px] text-white/40 uppercase" style={T}>Text Size Scale</p>
            <Chips
              options={TEXT_SCALES}
              value={textScale}
              onChange={set(setTextScale, LS_KEYS.textScale, v => {
                applyTextScale(v);
                announce('Text size changed to ' + v);
              })}
            />
          </div>

          <ToggleRow
            label="Reduce Motion"
            sub="Disables animations and transitions"
            on={reduceMotion}
            onChange={set(setReduceMotion, LS_KEYS.reduceMotion, v => {
              applyBodyClass('a11y-reduce-motion', v);
            })}
          />

          <div className="space-y-1">
            <p className="text-[10px] text-white/40 uppercase" style={T}>Color Blind Filter</p>
            <Chips
              options={COLORBLIND_MODES}
              value={colorBlind}
              onChange={set(setColorBlind, LS_KEYS.colorBlind, v => {
                applyColorBlind(v);
                announce(v === 'none' ? 'Color blind filter removed' : v + ' filter applied');
              })}
            />
          </div>

          <ToggleRow
            label="Screen Reader Mode"
            sub="Enables ARIA announcements for assistive tech"
            on={srMode}
            onChange={set(setSrMode, LS_KEYS.srMode, v => {
              announce(v ? 'Screen reader mode enabled' : 'Screen reader mode disabled');
            })}
          />
          <ToggleRow
            label="Keyboard Navigation"
            sub="Enhanced tab and arrow key support"
            on={keyboardNav}
            onChange={set(setKeyboardNav, LS_KEYS.keyboardNav, v => {
              applyBodyClass('a11y-keyboard-nav', v);
            })}
          />
          <ToggleRow
            label="Focus Highlight"
            sub="Strong gold ring on focused elements"
            on={focusHighlight}
            onChange={set(setFocusHighlight, LS_KEYS.focusHighlight, v => {
              applyBodyClass('a11y-focus-highlight', v);
            })}
          />

          <div className="space-y-1">
            <p className="text-[10px] text-white/40 uppercase" style={T}>Cursor Size</p>
            <Chips
              options={CURSOR_SIZES}
              value={cursor}
              onChange={set(setCursor, LS_KEYS.cursor, v => applyCursor(v))}
            />
          </div>
        </div>
      </Section>

      {/* Info footer */}
      <div className="text-[10px] text-white/25 text-center" style={T}>
        Settings persist across sessions
      </div>
    </div>
  );
}
