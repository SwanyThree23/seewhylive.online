import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, User, Mic, Camera, X, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getStoredDob, setStoredDob, calcAge } from '@/lib/ageVerification';
import { createPageUrl } from '../utils';

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const BG      = '#080B18';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const cardSty = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(212,175,55,0.2)',
  borderRadius: 20,
  padding: '28px 26px',
};

const primaryBtn = (enabled) => ({
  ...T,
  width: '100%',
  height: 46,
  borderRadius: 10,
  background: enabled ? 'linear-gradient(135deg, #800020, #A0003A)' : 'rgba(255,255,255,0.06)',
  border: `1px solid ${enabled ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`,
  color: enabled ? GOLD : 'rgba(255,255,255,0.25)',
  fontSize: 14,
  fontWeight: 900,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: enabled ? 'pointer' : 'not-allowed',
});

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS  = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

const selSty = {
  flex: 1,
  height: 46,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'Barlow Condensed, sans-serif',
  paddingLeft: 10,
  WebkitAppearance: 'none',
};

// ── Step icon wrapper ──────────────────────────────────────────────────────────
function StepIcon({ icon: Icon }) {
  return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: 'rgba(212,175,55,0.1)',
      border: '1px solid rgba(212,175,55,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 20px',
    }}>
      <Icon style={{ width: 24, height: 24, color: GOLD }} />
    </div>
  );
}

// ── Progress dots ──────────────────────────────────────────────────────────────
function ProgressDots({ total, current }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={i} style={{
            width: active ? 20 : 8,
            height: 8,
            borderRadius: 4,
            background: done ? GOLD : active ? GOLD : 'transparent',
            border: done ? `1px solid ${GOLD}` : active ? `1px solid ${GOLD}` : '1px solid rgba(212,175,55,0.3)',
            opacity: done ? 0.9 : active ? 1 : 0.4,
            transition: 'all 0.3s',
          }} />
        );
      })}
    </div>
  );
}

// ── Step 1: Age Verification ───────────────────────────────────────────────────
function AgeStep({ minAge, onPass, onBlockedUnder18, onDowngrade }) {
  const [month, setMonth] = useState('');
  const [day,   setDay]   = useState('');
  const [year,  setYear]  = useState('');
  const [status, setStatus] = useState('idle'); // idle | blocked | downgrade

  const ready = month && day && year;

  function handleConfirm() {
    if (!ready) return;
    const dob = `${year}-${String(Number(month)).padStart(2,'0')}-${String(Number(day)).padStart(2,'0')}`;
    const age = calcAge(dob);
    if (age === null || age < 0) return;

    if (age < 18) {
      setStatus('blocked');
      return;
    }
    if (age < minAge) {
      // 18–20 trying to host
      setStoredDob(dob);
      setStatus('downgrade');
      return;
    }
    setStoredDob(dob);
    onPass(age);
  }

  if (status === 'blocked') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ ...T, color: '#fff', fontSize: 22, fontWeight: 900, margin: '0 0 10px' }}>Access Restricted</h2>
        <p style={{ ...T, color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6 }}>
          You must be 18 or older to use SeeWhy LIVE.
        </p>
      </div>
    );
  }

  if (status === 'downgrade') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ ...T, color: GOLD, fontSize: 22, fontWeight: 900, margin: '0 0 10px' }}>21+ Required to Host</h2>
        <p style={{ ...T, color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>
          You must be 21 or older to host or co-host on SeeWhy LIVE.
        </p>
        <p style={{ ...T, color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 24 }}>
          You can still join as an audience member (18+).
        </p>
        <button
          onClick={() => onDowngrade('audience')}
          style={{ ...T, width: '100%', height: 46, borderRadius: 10, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: GOLD, fontSize: 13, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Join as Audience
        </button>
      </div>
    );
  }

  return (
    <>
      <StepIcon icon={ShieldCheck} />
      <h2 style={{ ...T, color: '#fff', fontSize: 22, fontWeight: 900, textAlign: 'center', margin: '0 0 6px' }}>
        Age Verification
      </h2>
      <p style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', margin: '0 0 18px', lineHeight: 1.5 }}>
        You must be <strong style={{ color: GOLD }}>{minAge}+</strong> to continue.
      </p>
      <p style={{ ...T, color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', margin: '0 0 12px' }}>
        Enter your date of birth
      </p>
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
      <button onClick={handleConfirm} disabled={!ready} style={primaryBtn(!!ready)}>
        Confirm My Age
      </button>
      <p style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.12)', textAlign: 'center', marginTop: 14 }}>
        Your date of birth is stored locally and never shared.
      </p>
    </>
  );
}

// ── Step 2: Platform Agreements ────────────────────────────────────────────────
function AgreementsStep({ onPass }) {
  const [tos, setTos]      = useState(false);
  const [pp, setPp]        = useState(false);
  const [mature, setMature] = useState(false);
  const allChecked = tos && pp && mature;

  function handleContinue() {
    if (!allChecked) return;
    try { localStorage.setItem('swl_agreements_v1', Date.now().toString()); } catch {}
    onPass();
  }

  const checkStyle = { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, cursor: 'pointer' };
  const boxStyle = (checked) => ({
    width: 20, height: 20, borderRadius: 5, border: `2px solid ${checked ? GOLD : 'rgba(255,255,255,0.25)'}`,
    background: checked ? `${GOLD}22` : 'transparent', flexShrink: 0, marginTop: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  });
  const checkMark = <span style={{ color: GOLD, fontSize: 12, fontWeight: 900 }}>✓</span>;

  return (
    <>
      <StepIcon icon={FileText} />
      <h2 style={{ ...T, color: '#fff', fontSize: 22, fontWeight: 900, textAlign: 'center', margin: '0 0 6px' }}>
        Platform Agreements
      </h2>
      <p style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', margin: '0 0 22px', lineHeight: 1.5 }}>
        Please review and agree before entering.
      </p>

      <div style={checkStyle} onClick={() => setTos(v => !v)}>
        <div style={boxStyle(tos)}>{tos && checkMark}</div>
        <p style={{ ...T, color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          I agree to the{' '}
          <a
            href={createPageUrl('TermsOfService')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ color: GOLD, textDecoration: 'underline' }}>
            Terms of Service
          </a>
        </p>
      </div>

      <div style={checkStyle} onClick={() => setPp(v => !v)}>
        <div style={boxStyle(pp)}>{pp && checkMark}</div>
        <p style={{ ...T, color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          I have read the{' '}
          <a
            href={createPageUrl('PrivacyPolicy')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ color: GOLD, textDecoration: 'underline' }}>
            Privacy Policy
          </a>
        </p>
      </div>

      <div style={checkStyle} onClick={() => setMature(v => !v)}>
        <div style={boxStyle(mature)}>{mature && checkMark}</div>
        <p style={{ ...T, color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          I confirm I am entering this live platform voluntarily and understand it may contain mature content.
        </p>
      </div>

      <button onClick={handleContinue} disabled={!allChecked} style={{ ...primaryBtn(allChecked), marginTop: 8 }}>
        Continue
      </button>
    </>
  );
}

// ── Step 3: Display Name ───────────────────────────────────────────────────────
function DisplayNameStep({ user, onPass }) {
  const defaultName = user?.email?.split('@')[0] || '';
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const NAME_RE = /^[a-zA-Z0-9 '\-]+$/;

  function validate(val) {
    if (val.trim().length < 2) return 'Name must be at least 2 characters.';
    if (!NAME_RE.test(val.trim())) return 'Only letters, numbers, spaces, hyphens and apostrophes allowed.';
    return '';
  }

  async function handleSave() {
    const err = validate(name);
    if (err) { setError(err); return; }
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: name.trim() });
    } catch {}
    setSaving(false);
    onPass();
  }

  const valid = !validate(name);

  return (
    <>
      <StepIcon icon={User} />
      <h2 style={{ ...T, color: '#fff', fontSize: 22, fontWeight: 900, textAlign: 'center', margin: '0 0 6px' }}>
        Your Display Name
      </h2>
      <p style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', margin: '0 0 22px', lineHeight: 1.5 }}>
        This is how others see you in the room.
      </p>
      <input
        value={name}
        onChange={e => { setName(e.target.value); setError(''); }}
        maxLength={40}
        placeholder="Your name…"
        style={{
          ...T,
          width: '100%',
          height: 46,
          padding: '0 14px',
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${error ? '#EF4444' : 'rgba(212,175,55,0.25)'}`,
          borderRadius: 10,
          color: '#fff',
          fontSize: 15,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: error ? 6 : 14,
        }}
      />
      {error && (
        <p style={{ ...T, color: '#EF4444', fontSize: 12, marginBottom: 14 }}>{error}</p>
      )}
      <button onClick={handleSave} disabled={!valid || saving} style={primaryBtn(valid && !saving)}>
        {saving ? 'Saving…' : 'Save & Continue'}
      </button>
    </>
  );
}

// ── Step 4: Device Permissions ─────────────────────────────────────────────────
function PermissionsStep({ onPass }) {
  const [permError, setPermError] = useState('');
  const [loading, setLoading]     = useState(null); // null | 'cam' | 'mic'

  async function handleCamMic() {
    setLoading('cam');
    setPermError('');
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      try { localStorage.setItem('swl_perms_granted_v1', 'cam+mic'); } catch {}
      onPass();
    } catch {
      setPermError('Camera & microphone access was denied. You can try Audio Only instead.');
    } finally {
      setLoading(null);
    }
  }

  async function handleAudioOnly() {
    setLoading('mic');
    setPermError('');
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      try { localStorage.setItem('swl_perms_granted_v1', 'mic'); } catch {}
      onPass();
    } catch {
      setPermError("Microphone access was denied. You can still join but won't be heard.");
      // Don't block — let them continue anyway after seeing the note
    } finally {
      setLoading(null);
    }
  }

  function handleSkip() {
    onPass();
  }

  return (
    <>
      <StepIcon icon={Mic} />
      <h2 style={{ ...T, color: '#fff', fontSize: 22, fontWeight: 900, textAlign: 'center', margin: '0 0 6px' }}>
        Device Permissions
      </h2>
      <p style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', margin: '0 0 22px', lineHeight: 1.5 }}>
        Grant access so your audience can see and hear you.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
        <button
          onClick={handleCamMic}
          disabled={!!loading}
          style={{
            ...T,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', height: 46, borderRadius: 10,
            background: loading === 'cam' ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #800020, #A0003A)',
            border: '1px solid rgba(212,175,55,0.35)', color: GOLD,
            fontSize: 14, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
          <Camera style={{ width: 16, height: 16 }} />
          {loading === 'cam' ? 'Requesting…' : 'Allow Camera & Mic'}
        </button>

        <button
          onClick={handleAudioOnly}
          disabled={!!loading}
          style={{
            ...T,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', height: 46, borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(212,175,55,0.2)', color: 'rgba(255,255,255,0.7)',
            fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
          <Mic style={{ width: 16, height: 16 }} />
          {loading === 'mic' ? 'Requesting…' : 'Audio Only'}
        </button>
      </div>

      {permError && (
        <p style={{ ...T, color: '#FBBF24', fontSize: 12, textAlign: 'center', marginBottom: 8, lineHeight: 1.5 }}>
          {permError}
        </p>
      )}

      <button
        onClick={handleSkip}
        style={{ ...T, width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', marginTop: 4 }}>
        Skip for now
      </button>
    </>
  );
}

// ── Main RoomEntryGate ─────────────────────────────────────────────────────────
export default function RoomEntryGate({ role, user, onPass, onRoleDowngrade, onExit }) {
  const isHostRole = role === 'host' || role === 'co-host';
  const minAge     = isHostRole ? 21 : 18;
  const needsPerms = isHostRole || role === 'speaker';

  // Determine which steps are needed upfront
  const steps = useMemo(() => {
    const list = [];

    // Step 1 — Age
    const storedDob = getStoredDob();
    const storedAge = storedDob ? calcAge(storedDob) : null;
    if (storedAge === null || storedAge < minAge) {
      list.push('age');
    }

    // Step 2 — Agreements
    let agreementsOk = false;
    try { agreementsOk = !!localStorage.getItem('swl_agreements_v1'); } catch {}
    if (!agreementsOk) list.push('agreements');

    // Step 3 — Display name
    if (!user?.full_name) list.push('name');

    // Step 4 — Device permissions (only for active roles)
    if (needsPerms) {
      let permsOk = false;
      try { permsOk = !!localStorage.getItem('swl_perms_granted_v1'); } catch {}
      if (!permsOk) list.push('permissions');
    }

    return list;
  }, [minAge, needsPerms, user?.full_name]);

  const [stepIndex, setStepIndex] = useState(0);

  // If no steps needed, pass immediately on first render
  if (steps.length === 0) {
    onPass();
    return null;
  }

  const currentStep = steps[stepIndex];

  function advance() {
    if (stepIndex + 1 >= steps.length) {
      onPass();
    } else {
      setStepIndex(i => i + 1);
    }
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex(i => i - 1);
  }

  const totalSteps = steps.length;

  return (
    <motion.div
      className="fixed inset-0 z-[110]"
      style={{ background: BG, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Close button */}
      <button
        onClick={onExit}
        style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 6 }}>
        <X style={{ width: 20, height: 20 }} />
      </button>

      {/* Back button */}
      {stepIndex > 0 && (
        <button
          onClick={goBack}
          style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13, ...T, padding: 6 }}>
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
      )}

      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Progress */}
        {totalSteps > 1 && (
          <ProgressDots total={totalSteps} current={stepIndex} />
        )}

        {/* Card */}
        <div style={cardSty}>
          {currentStep === 'age' && (
            <AgeStep
              minAge={minAge}
              onPass={advance}
              onBlockedUnder18={() => {}}
              onDowngrade={(newRole) => {
                onRoleDowngrade(newRole);
              }}
            />
          )}

          {currentStep === 'agreements' && (
            <AgreementsStep onPass={advance} />
          )}

          {currentStep === 'name' && (
            <DisplayNameStep user={user} onPass={advance} />
          )}

          {currentStep === 'permissions' && (
            <PermissionsStep onPass={advance} />
          )}
        </div>

        {/* Step counter */}
        {totalSteps > 1 && (
          <p style={{ ...T, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 14 }}>
            Step {stepIndex + 1} of {totalSteps}
          </p>
        )}
      </div>
    </motion.div>
  );
}
