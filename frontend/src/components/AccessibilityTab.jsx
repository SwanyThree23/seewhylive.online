import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

var BG    = '#0D0B08';
var CARD  = 'rgba(26,21,16,0.96)';
var GOLD  = '#C9A84C';
var DIM   = 'rgba(200,185,165,0.45)';
var T     = { fontFamily: "'Barlow Condensed',sans-serif" };

// Persist prefs to localStorage
function loadPref(key, fallback) {
  try {
    var v = localStorage.getItem(key);
    if (v === null) return fallback;
    if (v === 'true') return true;
    if (v === 'false') return false;
    return v;
  } catch { return fallback; }
}
function savePref(key, value) {
  try { localStorage.setItem(key, String(value)); } catch {}
}

// Apply body class side-effects
function applyBodyClass(cls, on) {
  if (on) document.body.classList.add(cls);
  else document.body.classList.remove(cls);
}

// Inject / remove a <style> tag for color blind filter
function applyColorBlindFilter(mode) {
  var id = 'a11y-cb-style';
  var existing = document.getElementById(id);
  if (mode === 'none') { if (existing) existing.remove(); return; }
  var filters = {
    protanopia:   'saturate(0.7) hue-rotate(10deg)',
    deuteranopia: 'saturate(0.8) hue-rotate(-20deg)',
    tritanopia:   'saturate(0.9) hue-rotate(50deg)',
    monochrome:   'grayscale(1)',
  };
  var f = filters[mode] || '';
  if (!existing) {
    existing = document.createElement('style');
    existing.id = id;
    document.head.appendChild(existing);
  }
  existing.textContent = 'html { filter: ' + f + '; }';
}

function Toggle({ on, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ ...T, fontSize: 12, color: 'rgba(200,185,165,0.75)', fontWeight: 600 }}>{label}</span>
      <div
        onClick={function() { onChange(!on); }}
        role="switch"
        aria-checked={on}
        tabIndex={0}
        onKeyDown={function(e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!on); } }}
        style={{ width: 40, height: 22, borderRadius: 99, background: on ? GOLD : 'rgba(255,255,255,0.1)',
          position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
      >
        <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16,
          borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </div>
    </div>
  );
}

function Chips({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {options.map(function(o) {
        var active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={function() { onChange(o.value); }}
            style={{ ...T, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
              border: '1px solid ' + (active ? GOLD : 'rgba(255,255,255,0.12)'),
              background: active ? GOLD + '22' : 'transparent',
              color: active ? GOLD : DIM, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Section({ title, children, defaultOpen }) {
  var [open, setOpen] = useState(defaultOpen !== false);
  return (
    <div style={{ border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      <button
        onClick={function() { setOpen(function(v) { return !v; }); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px', background: 'rgba(201,168,76,0.07)', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ ...T, fontSize: 13, fontWeight: 900, color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
        <span style={{ color: DIM, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AccessibilityTab() {
  // ── Hearing Impaired ────────────────────────────────────────
  var [captions,        setCaptions]       = useState(function() { return loadPref('seewhy_a11y_captions',       false); });
  var [captionSize,     setCaptionSize]    = useState(function() { return loadPref('seewhy_a11y_caption_size',   'medium'); });
  var [captionPos,      setCaptionPos]     = useState(function() { return loadPref('seewhy_a11y_caption_pos',    'bottom'); });
  var [captionHC,       setCaptionHC]      = useState(function() { return loadPref('seewhy_a11y_caption_hc',    false); });
  var [speakerLabels,   setSpeakerLabels]  = useState(function() { return loadPref('seewhy_a11y_speaker_labels', true); });
  var [visualAlert,     setVisualAlert]    = useState(function() { return loadPref('seewhy_a11y_visual_alert',   false); });
  var [flashEvent,      setFlashEvent]     = useState(function() { return loadPref('seewhy_a11y_flash',          false); });
  var [vibrateOn,       setVibrateOn]      = useState(function() { return loadPref('seewhy_a11y_vibrate',        false); });
  var [transcriptPin,   setTranscriptPin]  = useState(function() { return loadPref('seewhy_a11y_transcript_pin', false); });
  var [slMode,          setSlMode]         = useState(function() { return loadPref('seewhy_a11y_sl_mode',        false); });

  // ── Vision Impaired ─────────────────────────────────────────
  var [highContrast,    setHighContrast]   = useState(function() { return loadPref('seewhy_a11y_high_contrast',  false); });
  var [textScale,       setTextScale]      = useState(function() { return loadPref('seewhy_a11y_text_scale',     'normal'); });
  var [reduceMotion,    setReduceMotion]   = useState(function() { return loadPref('seewhy_a11y_reduce_motion',  false); });
  var [colorBlind,      setColorBlind]     = useState(function() { return loadPref('seewhy_a11y_colorblind',     'none'); });
  var [srMode,          setSrMode]         = useState(function() { return loadPref('seewhy_a11y_sr_mode',        false); });
  var [keyboardNav,     setKeyboardNav]    = useState(function() { return loadPref('seewhy_a11y_keyboard_nav',   false); });
  var [focusHighlight,  setFocusHighlight] = useState(function() { return loadPref('seewhy_a11y_focus',          false); });

  var liveRef = useRef(null);

  // ── Apply body class effects ────────────────────────────────
  useEffect(function() { applyBodyClass('a11y-high-contrast',   highContrast);  savePref('seewhy_a11y_high_contrast',  highContrast);  }, [highContrast]);
  useEffect(function() { applyBodyClass('a11y-reduce-motion',   reduceMotion);  savePref('seewhy_a11y_reduce_motion',  reduceMotion);  }, [reduceMotion]);
  useEffect(function() { applyBodyClass('a11y-keyboard-nav',    keyboardNav);   savePref('seewhy_a11y_keyboard_nav',   keyboardNav);   }, [keyboardNav]);
  useEffect(function() { applyBodyClass('a11y-focus-highlight', focusHighlight); savePref('seewhy_a11y_focus',         focusHighlight); }, [focusHighlight]);

  // ── Text scale ──────────────────────────────────────────────
  useEffect(function() {
    savePref('seewhy_a11y_text_scale', textScale);
    var scales = { normal: '15px', large: '17px', xlarge: '20px', xxlarge: '23px' };
    document.documentElement.style.fontSize = scales[textScale] || '15px';
  }, [textScale]);

  // ── Color blind ─────────────────────────────────────────────
  useEffect(function() {
    savePref('seewhy_a11y_colorblind', colorBlind);
    applyColorBlindFilter(colorBlind);
  }, [colorBlind]);

  // ── Simple prefs (no body side-effect) ──────────────────────
  useEffect(function() { savePref('seewhy_a11y_captions',       captions);      }, [captions]);
  useEffect(function() { savePref('seewhy_a11y_caption_size',   captionSize);   }, [captionSize]);
  useEffect(function() { savePref('seewhy_a11y_caption_pos',    captionPos);    }, [captionPos]);
  useEffect(function() { savePref('seewhy_a11y_caption_hc',     captionHC);     }, [captionHC]);
  useEffect(function() { savePref('seewhy_a11y_speaker_labels', speakerLabels); }, [speakerLabels]);
  useEffect(function() { savePref('seewhy_a11y_visual_alert',   visualAlert);   }, [visualAlert]);
  useEffect(function() { savePref('seewhy_a11y_flash',          flashEvent);    }, [flashEvent]);
  useEffect(function() { savePref('seewhy_a11y_vibrate',        vibrateOn);     }, [vibrateOn]);
  useEffect(function() { savePref('seewhy_a11y_transcript_pin', transcriptPin); }, [transcriptPin]);
  useEffect(function() { savePref('seewhy_a11y_sl_mode',        slMode);        }, [slMode]);
  useEffect(function() { savePref('seewhy_a11y_sr_mode',        srMode);        }, [srMode]);

  // SR announcer helper
  function announce(msg) {
    if (!liveRef.current || !srMode) return;
    liveRef.current.textContent = '';
    setTimeout(function() { if (liveRef.current) liveRef.current.textContent = msg; }, 50);
  }

  var anyActive = captions || captionHC || visualAlert || flashEvent || vibrateOn || transcriptPin || slMode
    || highContrast || textScale !== 'normal' || reduceMotion || colorBlind !== 'none' || srMode || keyboardNav || focusHighlight;

  return (
    <div style={{ padding: '12px 10px', background: BG, minHeight: '100%' }}>

      {/* ── ARIA live region (visually hidden) ── */}
      <div
        ref={liveRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      />

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>♿</span>
        <div style={{ flex: 1 }}>
          <div style={{ ...T, fontSize: 16, fontWeight: 900, color: '#F5EFE3', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Accessibility
          </div>
          <div style={{ ...T, fontSize: 10, color: DIM, fontWeight: 600 }}>
            Hearing &amp; Vision Impaired Support
          </div>
        </div>
        {anyActive && (
          <span style={{ ...T, fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
            background: GOLD + '22', border: '1px solid ' + GOLD + '55', color: GOLD,
            textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Active
          </span>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────
          HEARING IMPAIRED
      ────────────────────────────────────────────────────── */}
      <Section title="👂 Hearing Impaired">
        <Toggle on={captions} onChange={setCaptions} label="Live Captions" />

        {captions && (
          <>
            <div>
              <div style={{ ...T, fontSize: 10, color: DIM, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Caption Size</div>
              <Chips
                value={captionSize}
                onChange={setCaptionSize}
                options={[
                  { value: 'small',  label: 'S (14px)' },
                  { value: 'medium', label: 'M (18px)' },
                  { value: 'large',  label: 'L (22px)' },
                  { value: 'xl',     label: 'XL (28px)' },
                ]}
              />
            </div>
            <div>
              <div style={{ ...T, fontSize: 10, color: DIM, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Caption Position</div>
              <Chips
                value={captionPos}
                onChange={setCaptionPos}
                options={[
                  { value: 'bottom', label: 'Bottom' },
                  { value: 'middle', label: 'Middle' },
                  { value: 'top',    label: 'Top' },
                ]}
              />
            </div>
            <Toggle on={captionHC}     onChange={setCaptionHC}     label="High Contrast Captions" />
            <Toggle on={speakerLabels} onChange={setSpeakerLabels} label="Show Speaker Name" />
          </>
        )}

        <Toggle on={visualAlert}   onChange={setVisualAlert}   label="Visual Sound Alert (pulse ring)" />
        <Toggle on={flashEvent}    onChange={setFlashEvent}    label="Flash on Chat / Event" />
        <Toggle on={vibrateOn}     onChange={function(v) { setVibrateOn(v); if (v && navigator.vibrate) { navigator.vibrate([80, 40, 80]); announce('Vibration enabled'); } }} label="Vibrate on Mention (mobile)" />
        <Toggle on={transcriptPin} onChange={setTranscriptPin} label="Always Show Transcript" />
        <Toggle on={slMode}        onChange={setSlMode}        label="Sign Language Mode (reserve SL slot)" />

        {/* Caption preview */}
        {captions && (
          <div style={{
            background: captionHC ? '#000' : 'rgba(0,0,0,0.82)',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: 8,
            padding: '6px 12px',
            textAlign: 'center',
          }}>
            <span style={{
              color: captionHC ? '#fff' : 'rgba(255,255,255,0.95)',
              fontSize: captionSize === 'small' ? 14 : captionSize === 'large' ? 22 : captionSize === 'xl' ? 28 : 18,
              fontFamily: 'Barlow Condensed, sans-serif',
            }}>
              {speakerLabels && <strong style={{ color: GOLD }}>Host: </strong>}
              Sample caption text preview ✓
            </span>
          </div>
        )}
      </Section>

      {/* ──────────────────────────────────────────────────────
          VISION IMPAIRED
      ────────────────────────────────────────────────────── */}
      <Section title="👁 Vision Impaired">
        <Toggle on={highContrast}   onChange={setHighContrast}   label="High Contrast Mode" />
        <Toggle on={reduceMotion}   onChange={setReduceMotion}   label="Reduce Motion &amp; Animations" />
        <Toggle on={srMode}         onChange={setSrMode}         label="Screen Reader Mode (ARIA)" />
        <Toggle on={keyboardNav}    onChange={setKeyboardNav}    label="Keyboard Navigation Mode" />
        <Toggle on={focusHighlight} onChange={setFocusHighlight} label="Enhanced Focus Highlight" />

        <div>
          <div style={{ ...T, fontSize: 10, color: DIM, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Text Size</div>
          <Chips
            value={textScale}
            onChange={setTextScale}
            options={[
              { value: 'normal',  label: 'Normal' },
              { value: 'large',   label: 'Large' },
              { value: 'xlarge',  label: 'X-Large' },
              { value: 'xxlarge', label: 'XX-Large' },
            ]}
          />
        </div>

        <div>
          <div style={{ ...T, fontSize: 10, color: DIM, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Color Blind Mode</div>
          <Chips
            value={colorBlind}
            onChange={setColorBlind}
            options={[
              { value: 'none',         label: 'None' },
              { value: 'protanopia',   label: 'Protanopia' },
              { value: 'deuteranopia', label: 'Deuteranopia' },
              { value: 'tritanopia',   label: 'Tritanopia' },
              { value: 'monochrome',   label: 'Monochrome' },
            ]}
          />
        </div>

        {highContrast && (
          <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 6, padding: '6px 10px' }}>
            <p style={{ ...T, fontSize: 11, color: GOLD, margin: 0 }}>
              ✓ High contrast active — borders and backgrounds enhanced
            </p>
          </div>
        )}
      </Section>

      {/* ──────────────────────────────────────────────────────
          KEYBOARD SHORTCUTS INFO
      ────────────────────────────────────────────────────── */}
      <Section title="⌨️ Keyboard Shortcuts" defaultOpen={false}>
        {[
          { key: 'M', desc: 'Toggle microphone mute' },
          { key: 'C', desc: 'Toggle captions' },
          { key: 'Tab', desc: 'Move focus to next element' },
          { key: 'Enter / Space', desc: 'Activate focused button' },
          { key: 'Esc', desc: 'Close overlay / modal' },
          { key: '?', desc: 'Show keyboard shortcuts help' },
        ].map(function(s) {
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <kbd style={{ ...T, fontSize: 10, fontWeight: 900, padding: '2px 7px', borderRadius: 4,
                background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: GOLD,
                whiteSpace: 'nowrap', flexShrink: 0 }}>
                {s.key}
              </kbd>
              <span style={{ ...T, fontSize: 11, color: DIM }}>{s.desc}</span>
            </div>
          );
        })}
      </Section>

      {/* ──────────────────────────────────────────────────────
          RESET BUTTON
      ────────────────────────────────────────────────────── */}
      <button
        onClick={function() {
          var keys = ['seewhy_a11y_captions','seewhy_a11y_caption_size','seewhy_a11y_caption_pos',
            'seewhy_a11y_caption_hc','seewhy_a11y_speaker_labels','seewhy_a11y_visual_alert',
            'seewhy_a11y_flash','seewhy_a11y_vibrate','seewhy_a11y_transcript_pin','seewhy_a11y_sl_mode',
            'seewhy_a11y_high_contrast','seewhy_a11y_text_scale','seewhy_a11y_reduce_motion',
            'seewhy_a11y_colorblind','seewhy_a11y_sr_mode','seewhy_a11y_keyboard_nav','seewhy_a11y_focus'];
          try { keys.forEach(function(k) { localStorage.removeItem(k); }); } catch {}
          setCaptions(false); setCaptionSize('medium'); setCaptionPos('bottom'); setCaptionHC(false);
          setSpeakerLabels(true); setVisualAlert(false); setFlashEvent(false); setVibrateOn(false);
          setTranscriptPin(false); setSlMode(false); setHighContrast(false); setTextScale('normal');
          setReduceMotion(false); setColorBlind('none'); setSrMode(false); setKeyboardNav(false);
          setFocusHighlight(false);
          applyColorBlindFilter('none');
          document.documentElement.style.fontSize = '15px';
          ['a11y-high-contrast','a11y-reduce-motion','a11y-keyboard-nav','a11y-focus-highlight'].forEach(function(c) {
            document.body.classList.remove(c);
          });
          announce('All accessibility settings reset to defaults');
        }}
        style={{ ...T, width: '100%', padding: '9px', borderRadius: 8, marginTop: 4,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(200,185,165,0.6)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.08em' }}
      >
        Reset All Accessibility Settings
      </button>
    </div>
  );
}
