import { useState } from 'react';
import { Drawer } from 'vaul';
import { Check, ChevronDown } from 'lucide-react';

const GOLD = '#D4AF37';

/**
 * MobileSelect — drop-in replacement for <select> on mobile.
 *
 * On pointer-coarse devices (phones) it renders a vaul bottom-sheet
 * action list; on desktop it falls back to a styled native <select>.
 *
 * Props:
 *   value       string | number   — currently selected value
 *   onChange    (val) => void     — called with the new value
 *   options     Array<string | { value, label }>
 *   placeholder string            — shown when nothing is selected
 *   label       string            — optional header inside the sheet
 *   disabled    boolean
 */
export function MobileSelect({ value, onChange, options = [], placeholder = 'Select…', label, disabled = false }) {
  const [open, setOpen] = useState(false);

  const normalize = (o) => typeof o === 'string' || typeof o === 'number'
    ? { value: o, label: String(o) }
    : { value: o.value, label: o.label ?? String(o.value) };

  const normalized = options.map(normalize);
  const selected   = normalized.find((o) => o.value === value);
  const display    = selected?.label ?? placeholder;

  // ── Trigger button (shared appearance) ────────────────────────────────────
  const triggerStyle = {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    width:          '100%',
    minHeight:      44,
    background:     'rgba(255,255,255,0.05)',
    border:         '1px solid rgba(212,175,55,0.2)',
    borderRadius:   12,
    padding:        '10px 14px',
    color:          selected ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
    fontFamily:     'Barlow Condensed, sans-serif',
    fontSize:       14,
    cursor:         disabled ? 'not-allowed' : 'pointer',
    opacity:        disabled ? 0.5 : 1,
    outline:        'none',
  };

  return (
    <>
      {/* ── Native select fallback for pointer-fine (desktop) ── */}
      <div className="hidden md:block">
        <div style={{ position: 'relative', width: '100%' }}>
          <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            style={{ ...triggerStyle, paddingRight: 36, appearance: 'none', WebkitAppearance: 'none', cursor: disabled ? 'not-allowed' : 'pointer' }}>
            {!selected && <option value="" disabled>{placeholder}</option>}
            {normalized.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(212,175,55,0.6)', pointerEvents: 'none', width: 16, height: 16 }} />
        </div>
      </div>

      {/* ── vaul bottom-sheet for mobile ── */}
      <div className="md:hidden">
        <Drawer.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
          <Drawer.Trigger asChild>
            <button type="button" style={triggerStyle} disabled={disabled}>
              <span>{display}</span>
              <ChevronDown style={{ width: 16, height: 16, color: 'rgba(212,175,55,0.5)', flexShrink: 0 }} />
            </button>
          </Drawer.Trigger>

          <Drawer.Portal>
            <Drawer.Overlay
              className="fixed inset-0 z-[200]"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            />
            <Drawer.Content
              className="fixed bottom-0 left-0 right-0 z-[201] flex flex-col outline-none"
              style={{
                background:   '#0D1022',
                borderRadius: '20px 20px 0 0',
                border:       '1px solid rgba(212,175,55,0.15)',
                borderBottom: 'none',
                maxHeight:    '75vh',
              }}>
              {/* Drag handle */}
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '12px auto 0' }} />

              {/* Optional label */}
              {label && (
                <p style={{ padding: '14px 20px 4px', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {label}
                </p>
              )}

              {/* Options list */}
              <div style={{ overflowY: 'auto', padding: '8px 12px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
                {normalized.map((o) => {
                  const active = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => { onChange(o.value); setOpen(false); }}
                      style={{
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'space-between',
                        width:          '100%',
                        padding:        '14px 16px',
                        borderRadius:   12,
                        marginBottom:   4,
                        background:     active ? 'rgba(212,175,55,0.1)'  : 'transparent',
                        border:         active ? `1px solid rgba(212,175,55,0.3)` : '1px solid transparent',
                        color:          active ? GOLD : 'rgba(255,255,255,0.8)',
                        fontFamily:     'Barlow Condensed, sans-serif',
                        fontSize:       15,
                        fontWeight:     active ? 700 : 400,
                        textAlign:      'left',
                        cursor:         'pointer',
                      }}>
                      <span>{o.label}</span>
                      {active && <Check style={{ width: 16, height: 16, color: GOLD, flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </>
  );
}
