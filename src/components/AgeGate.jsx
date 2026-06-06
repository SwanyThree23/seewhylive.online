import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ShieldCheck, X } from 'lucide-react';
import { calcAge, setStoredDob } from '@/lib/ageVerification';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const BG      = '#080B18';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS  = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

const selSty = {
  flex: 1, height: 46, background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10, color: '#fff', fontSize: 13,
  outline: 'none', cursor: 'pointer',
  fontFamily: 'Barlow Condensed, sans-serif',
  paddingLeft: 10,
  WebkitAppearance: 'none',
};

/*
 * Props:
 *   minAge    — 18 or 21
 *   feature   — short label, e.g. "host a room" or "join the audience"
 *   onPass    — called when age >= minAge
 *   onDeny    — called when user is verified but under minAge (optional)
 *   onSkip    — called when user chooses "Continue as anonymous viewer" (optional)
 *   overlay   — if true, renders as a fixed full-screen overlay (default true)
 */
export default function AgeGate({ minAge = 18, feature = 'access this feature', onPass, onDeny, onSkip, overlay = true }) {
  const [month, setMonth]   = useState('');
  const [day, setDay]       = useState('');
  const [year, setYear]     = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'denied_under18' | 'denied_under21' | 'pass'

  const handleConfirm = () => {
    if (!month || !day || !year) return;
    const dob = `${year}-${String(Number(month)).padStart(2,'0')}-${String(Number(day)).padStart(2,'0')}`;
    const age = calcAge(dob);
    if (age === null || age < 0) return;

    if (age < 18) {
      setStatus('denied_under18');
      return;
    }
    if (age < minAge) {
      setStatus('denied_under21');
      onDeny?.();
      return;
    }
    setStoredDob(dob);
    setStatus('pass');
    onPass?.(age);
  };

  const ready = month && day && year;

  const inner = (
    <div style={{ minHeight: overlay ? '100vh' : 'auto', background: overlay ? BG : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <Radio style={{ width: 28, height: 28, color: GOLD }} />
        <span style={{ fontSize: 26, fontWeight: 900, color: GOLD, letterSpacing: '0.04em', ...T }}>SeeWhy LIVE</span>
      </div>

      <div style={{ width: '100%', maxWidth: 380, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.2)', padding: '28px 26px' }}>

        {status === 'denied_under18' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
            <h2 style={{ ...T, color: '#fff', fontSize: 22, fontWeight: 900, margin: '0 0 10px' }}>Access Restricted</h2>
            <p style={{ ...T, color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
              You must be 18 or older to use SeeWhy LIVE.
            </p>
            {onSkip && (
              <button onClick={onSkip}
                style={{ ...T, width: '100%', height: 42, borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>
                Watch Anonymously (18+ content may be visible)
              </button>
            )}
          </div>
        )}

        {status === 'denied_under21' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ ...T, color: GOLD, fontSize: 22, fontWeight: 900, margin: '0 0 10px' }}>21+ Required to {feature === 'host a room' ? 'Host' : feature}</h2>
            <p style={{ ...T, color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>
              You must be 21 or older to host or co-host on SeeWhy LIVE.
            </p>
            <p style={{ ...T, color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 24 }}>
              You can still watch streams and join as an audience member (18+).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {onSkip && (
                <button onClick={onSkip}
                  style={{ ...T, width: '100%', height: 46, borderRadius: 10, background: `rgba(212,175,55,0.1)`, border: `1px solid rgba(212,175,55,0.3)`, color: GOLD, fontSize: 13, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Join as Audience Member
                </button>
              )}
            </div>
          </div>
        )}

        {(status === 'idle' || status === 'pass') && (
          <>
            {/* Shield icon */}
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: `rgba(212,175,55,0.1)`, border: `1px solid rgba(212,175,55,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ShieldCheck style={{ width: 24, height: 24, color: GOLD }} />
            </div>

            <h2 style={{ ...T, color: '#fff', fontSize: 22, fontWeight: 900, textAlign: 'center', margin: '0 0 6px' }}>
              Age Verification Required
            </h2>
            <p style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', margin: '0 0 4px', lineHeight: 1.5 }}>
              You must be <strong style={{ color: GOLD }}>{minAge}+</strong> to {feature}.
            </p>

            {/* Age rules summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '16px 0 22px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' }}>
              {[
                { emoji: '👁', label: 'Anyone',  desc: 'Public viewing (no account)' },
                { emoji: '🎤', label: '18+',     desc: 'Audience, guest speaker, invited participant', highlight: minAge === 18 },
                { emoji: '👑', label: '21+',     desc: 'Host or Co-host a room',                       highlight: minAge === 21 },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: r.highlight ? 1 : 0.5 }}>
                  <span style={{ fontSize: 14 }}>{r.emoji}</span>
                  <span style={{ ...T, color: r.highlight ? GOLD : '#fff', fontSize: 12, fontWeight: 900, width: 36 }}>{r.label}</span>
                  <span style={{ ...T, color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{r.desc}</span>
                  {r.highlight && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: GOLD }} />}
                </div>
              ))}
            </div>

            <p style={{ ...T, color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', margin: '0 0 14px' }}>Enter your date of birth to continue</p>

            {/* DOB pickers */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <select value={month} onChange={e => setMonth(e.target.value)} style={selSty}>
                <option value="">Month</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select value={day} onChange={e => setDay(e.target.value)} style={{ ...selSty, flex: '0 0 70px' }}>
                <option value="">Day</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={year} onChange={e => setYear(e.target.value)} style={selSty}>
                <option value="">Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <button onClick={handleConfirm} disabled={!ready}
              style={{ ...T, width: '100%', height: 46, borderRadius: 10, background: ready ? `linear-gradient(135deg,${CRIMSON},#A0003A)` : 'rgba(255,255,255,0.06)', border: `1px solid ${ready ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`, color: ready ? GOLD : 'rgba(255,255,255,0.25)', fontSize: 14, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: ready ? 'pointer' : 'not-allowed' }}>
              Confirm My Age
            </button>

            {onSkip && (
              <button onClick={onSkip}
                style={{ ...T, width: '100%', marginTop: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                Browse as anonymous viewer instead →
              </button>
            )}
          </>
        )}

        <p style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.12)', textAlign: 'center', marginTop: 18 }}>
          Your date of birth is stored locally and never shared.
        </p>
      </div>
    </div>
  );

  if (!overlay) return inner;

  return (
    <motion.div
      className="fixed inset-0 z-[100]"
      style={{ background: BG, overflowY: 'auto' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {inner}
    </motion.div>
  );
}
