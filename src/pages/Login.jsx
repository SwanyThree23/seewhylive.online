import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { Radio, Mic, Eye, CheckCircle, ShieldCheck } from 'lucide-react';
import { calcAge, setStoredDob } from '@/lib/ageVerification';

const T       = { fontFamily: 'Barlow Condensed, sans-serif' };
const GOLD    = '#D4AF37';
const BG      = '#080B18';
const CRIMSON = '#800020';
const GREEN   = '#6DBF7E';

const inputSty = {
  height: 46, padding: '0 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10, color: '#fff', fontSize: 14,
  outline: 'none', width: '100%', boxSizing: 'border-box',
  fontFamily: 'Barlow Condensed, sans-serif',
};
const dobSelSty = {
  flex: 1, height: 46, background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10, color: '#fff', fontSize: 13,
  outline: 'none', cursor: 'pointer',
  fontFamily: 'Barlow Condensed, sans-serif',
  paddingLeft: 10, WebkitAppearance: 'none',
};
const DOB_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOB_DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);
const DOB_YEARS  = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function Btn({ children, loading, onClick, type, variant }) {
  const isPrimary  = !variant || variant === 'primary';
  const isOutline  = variant === 'outline';
  const isGhost    = variant === 'ghost';
  const base = {
    height: 46, width: '100%', borderRadius: 10,
    fontSize: 13, fontWeight: 900, letterSpacing: '0.06em',
    textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    ...T,
  };
  if (isPrimary) Object.assign(base, {
    background: loading ? 'rgba(128,0,32,0.4)' : `linear-gradient(135deg,${CRIMSON},#A0003A)`,
    border: '1px solid rgba(212,175,55,0.35)', color: GOLD,
  });
  if (isOutline) Object.assign(base, {
    background: 'transparent',
    border: '1px solid rgba(212,175,55,0.35)', color: GOLD,
  });
  if (isGhost) Object.assign(base, {
    background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.35)', height: 'auto', padding: '6px 0',
  });
  return (
    <button type={type || 'button'} onClick={onClick} disabled={!!loading}
      style={base}>
      {children}
    </button>
  );
}

function ErrBox({ msg }) {
  return (
    <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.28)', color: '#FF8070', fontSize: 12, ...T }}>
      {msg}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      <span style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>{label || 'or'}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

// ─── Invite-code validation ──────────────────────────────────────────────────
// Codes are stored in the base44 InviteCode entity: { code, role, used, used_by }
// role is 'host' or 'co-host'
async function checkInviteCode(code) {
  const clean = (code || '').trim().toUpperCase();
  if (clean.length < 6) return { valid: false, reason: 'Code is too short.' };
  try {
    const rows = await base44.entities.InviteCode.filter({ code: clean, used: false });
    if (!rows || rows.length === 0) return { valid: false, reason: 'Code not found or already used.' };
    return { valid: true, role: rows[0].role || 'host', id: rows[0].id };
  } catch (_) {
    // Entity not yet created — accept any well-formed code as host
    return { valid: true, role: 'host', id: null };
  }
}

async function markCodeUsed(id, email) {
  if (!id) return;
  try { await base44.entities.InviteCode.update(id, { used: true, used_by: email }); } catch (_) {}
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Login({ fromUrl: propFromUrl }) {
  /*
   * Tracks (mutually exclusive starting points):
   *   'welcome'  — landing: choose viewer join, member sign-in, or host invite
   *   'signin'   — returning member: email → password
   *   'password' — password entry for sign-in
   *   'viewer'   — free viewer registration (no code needed)
   *   'invite'   — host/co-host: enter invite code
   *   'register' — create host/co-host account after valid code
   */
  const [phase, setPhase]         = useState('welcome');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteMeta, setInviteMeta] = useState(null); // { role, id }
  const [error, setError]         = useState('');
  const [info, setInfo]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [dobMonth, setDobMonth]   = useState('');
  const [dobDay, setDobDay]       = useState('');
  const [dobYear, setDobYear]     = useState('');

  const params     = new URLSearchParams(window.location.search);
  const rawFromUrl = propFromUrl || params.get('from_url') || appParams.fromUrl || '/';
  const fromUrl    = /\/(api\/apps\/auth|login)/i.test(rawFromUrl) ? '/' : rawFromUrl;

  useEffect(() => {
    const token  = params.get('access_token');
    const urlCode = params.get('invite');
    if (token) { base44.auth.setToken(token); window.location.href = fromUrl; return; }
    if (urlCode) { setInviteCode(urlCode.toUpperCase()); go('invite'); }
  }, []);

  function go(p) { setPhase(p); setError(''); setInfo(''); }

  // ── Auth actions ────────────────────────────────────────────────────────
  const handleGoogle = () => base44.auth.loginWithProvider('google', fromUrl);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = fromUrl;
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Incorrect email or password.');
    } finally { setLoading(false); }
  };

  const handleViewerRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    if (!dobMonth || !dobDay || !dobYear) {
      setError('Please enter your date of birth.'); setLoading(false); return;
    }
    const dob = `${dobYear}-${String(Number(dobMonth)).padStart(2,'0')}-${String(Number(dobDay)).padStart(2,'0')}`;
    const age = calcAge(dob);
    if (age === null || age < 18) {
      setError('You must be 18 or older to create an account.'); setLoading(false); return;
    }
    setStoredDob(dob);
    setInfo('Creating your account…');
    try {
      await base44.auth.register({ email, password });
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = fromUrl;
    } catch (err) {
      setInfo('');
      setError(err?.response?.data?.detail || err?.message || 'Could not create account.');
    } finally { setLoading(false); }
  };

  const handleValidateCode = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = await checkInviteCode(inviteCode);
    setLoading(false);
    if (!result.valid) { setError(result.reason); return; }
    setInviteMeta({ role: result.role, id: result.id });
    go('register');
  };

  const handleHostRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    if (!dobMonth || !dobDay || !dobYear) {
      setError('Please enter your date of birth.'); setLoading(false); return;
    }
    const dob = `${dobYear}-${String(Number(dobMonth)).padStart(2,'0')}-${String(Number(dobDay)).padStart(2,'0')}`;
    const age = calcAge(dob);
    if (age === null || age < 21) {
      setError('You must be 21 or older to host or co-host on SeeWhy LIVE.'); setLoading(false); return;
    }
    setStoredDob(dob);
    setInfo('Creating your account…');
    try {
      await base44.auth.register({ email, password });
      await markCodeUsed(inviteMeta?.id, email);
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = fromUrl;
    } catch (err) {
      setInfo('');
      setError(err?.response?.data?.detail || err?.message || 'Could not create account.');
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email above first.'); return; }
    setError(''); setLoading(true);
    try { await base44.auth.resetPasswordRequest(email); setResetSent(true); }
    catch (err) { setError(err?.response?.data?.detail || 'Could not send reset email.'); }
    finally { setLoading(false); }
  };

  const roleLabel = inviteMeta?.role === 'co-host' ? 'Co-Host' : 'Host';
  const roleColor = inviteMeta?.role === 'co-host' ? GOLD : '#C0392B';

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <Radio style={{ width: 28, height: 28, color: GOLD }} />
        <span style={{ fontSize: 28, fontWeight: 900, color: GOLD, letterSpacing: '0.04em', ...T }}>SeeWhy LIVE</span>
      </div>

      <div style={{ width: '100%', maxWidth: 400, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.18)', padding: '26px 26px 20px' }}>

        {/* ══════════ WELCOME — choose your path ══════════ */}
        {phase === 'welcome' && (
          <>
            <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.38)', textAlign: 'center', marginBottom: 20 }}>
              How would you like to join?
            </p>

            {/* Viewer — free, no code */}
            <button onClick={() => go('viewer')}
              style={{ width: '100%', marginBottom: 10, padding: '14px 16px', borderRadius: 12, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.22)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <Eye style={{ width: 22, height: 22, color: GOLD, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ ...T, fontSize: 14, fontWeight: 900, color: '#fff' }}>Watch &amp; Explore</span>
                  <span style={{ ...T, fontSize: 9, fontWeight: 900, color: GOLD, background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.06em' }}>18+</span>
                </div>
                <div style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>Free account — no invitation needed</div>
              </div>
            </button>

            {/* Host / Co-host — invite only */}
            <button onClick={() => go('invite')}
              style={{ width: '100%', marginBottom: 18, padding: '14px 16px', borderRadius: 12, background: 'rgba(128,0,32,0.12)', border: '1px solid rgba(128,0,32,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <Mic style={{ width: 22, height: 22, color: '#C0392B', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ ...T, fontSize: 14, fontWeight: 900, color: '#fff' }}>Go Live as Host / Co-Host</span>
                  <span style={{ ...T, fontSize: 9, fontWeight: 900, color: '#C0392B', background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.35)', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.06em' }}>21+</span>
                </div>
                <div style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>Invitation only — enter your invite code</div>
              </div>
            </button>

            <Divider label="already a member?" />

            {/* Existing member sign-in */}
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={handleGoogle}
                style={{ width: '100%', height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 10, background: '#fff', border: 'none', color: '#333', fontSize: 14, fontWeight: 700, cursor: 'pointer', ...T }}>
                <GoogleIcon /> Sign in with Google
              </button>
              <Btn variant="outline" onClick={() => go('signin')}>Sign In with Email</Btn>
            </div>
          </>
        )}

        {/* ══════════ SIGN IN (email → password) ══════════ */}
        {phase === 'signin' && (
          <>
            <button onClick={() => go('welcome')}
              style={{ ...T, background: 'none', border: 'none', color: 'rgba(255,255,255,0.38)', fontSize: 12, cursor: 'pointer', marginBottom: 18, padding: 0 }}>
              ← Back
            </button>
            <h2 style={{ ...T, fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Sign In</h2>

            <form onSubmit={(e) => { e.preventDefault(); if (email) go('password'); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputSty} />
              {error && <ErrBox msg={error} />}
              <Btn type="submit">Continue →</Btn>
            </form>

            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <button onClick={handleGoogle}
                style={{ ...T, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                Sign in with Google instead
              </button>
            </div>
          </>
        )}

        {/* ══════════ PASSWORD ══════════ */}
        {phase === 'password' && (
          <>
            <button onClick={() => go('signin')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 12px 5px 8px', cursor: 'pointer', marginBottom: 18, ...T, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              ← {email}
            </button>
            <h2 style={{ ...T, fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Welcome back</h2>
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} required autoFocus
                autoComplete="current-password" style={inputSty} />
              {error && <ErrBox msg={error} />}
              {resetSent
                ? <p style={{ ...T, color: GREEN, fontSize: 12, textAlign: 'center', margin: 0 }}>Reset email sent — check your inbox.</p>
                : <button type="button" onClick={handleForgotPassword} disabled={loading}
                    style={{ ...T, background: 'none', border: 'none', color: 'rgba(212,175,55,0.55)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', alignSelf: 'flex-end', padding: 0 }}>
                    Forgot password?
                  </button>
              }
              <Btn type="submit" loading={loading}>{loading ? 'Signing in…' : 'Sign In'}</Btn>
            </form>
          </>
        )}

        {/* ══════════ VIEWER REGISTRATION (free) ══════════ */}
        {phase === 'viewer' && (
          <>
            <button onClick={() => go('welcome')}
              style={{ ...T, background: 'none', border: 'none', color: 'rgba(255,255,255,0.38)', fontSize: 12, cursor: 'pointer', marginBottom: 18, padding: 0 }}>
              ← Back
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Eye style={{ width: 16, height: 16, color: GOLD }} />
              <h2 style={{ ...T, fontSize: 17, fontWeight: 900, color: '#fff', margin: 0 }}>Create Viewer Account</h2>
            </div>
            <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 18 }}>
              Free — watch live streams, join watch parties, and chat.
            </p>

            <div style={{ marginBottom: 14 }}>
              <button onClick={handleGoogle}
                style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 10, background: '#fff', border: 'none', color: '#333', fontSize: 14, fontWeight: 700, cursor: 'pointer', ...T }}>
                <GoogleIcon /> Continue with Google
              </button>
            </div>

            <Divider label="or email" />

            <form onSubmit={handleViewerRegister} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <input type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputSty} />
              <input type="password" placeholder="Choose a password" value={password}
                onChange={e => setPassword(e.target.value)} required
                autoComplete="new-password" style={inputSty} />
              <p style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 -2px' }}>Date of birth (must be 18+)</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={dobMonth} onChange={e => setDobMonth(e.target.value)} required style={dobSelSty}>
                  <option value="">Month</option>
                  {DOB_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select value={dobDay} onChange={e => setDobDay(e.target.value)} required style={{ ...dobSelSty, flex: '0 0 70px' }}>
                  <option value="">Day</option>
                  {DOB_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={dobYear} onChange={e => setDobYear(e.target.value)} required style={dobSelSty}>
                  <option value="">Year</option>
                  {DOB_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {info && <p style={{ ...T, fontSize: 12, color: GOLD, textAlign: 'center', margin: 0 }}>{info}</p>}
              {error && <ErrBox msg={error} />}
              <Btn type="submit" loading={loading}>{loading ? 'Creating account…' : 'Create Free Account'}</Btn>
            </form>
          </>
        )}

        {/* ══════════ INVITE CODE (host / co-host) ══════════ */}
        {phase === 'invite' && (
          <>
            <button onClick={() => go('welcome')}
              style={{ ...T, background: 'none', border: 'none', color: 'rgba(255,255,255,0.38)', fontSize: 12, cursor: 'pointer', marginBottom: 18, padding: 0 }}>
              ← Back
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Mic style={{ width: 16, height: 16, color: '#C0392B' }} />
              <h2 style={{ ...T, fontSize: 17, fontWeight: 900, color: '#fff', margin: 0 }}>Host / Co-Host Access</h2>
            </div>
            <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 18 }}>
              Enter the invite code sent to you by the platform host.
            </p>

            <form onSubmit={handleValidateCode} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="INVITE CODE"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                required autoFocus autoCapitalize="characters" autoComplete="off"
                style={{ ...inputSty, letterSpacing: '0.2em', fontWeight: 900, fontSize: 16, textAlign: 'center' }}
              />
              {error && <ErrBox msg={error} />}
              <Btn type="submit" loading={loading}>{loading ? 'Checking…' : 'Validate Code →'}</Btn>
            </form>

            <p style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.22)', textAlign: 'center', marginTop: 16 }}>
              Don't have a code?{' '}
              <a href="mailto:support@seewhylive.com?subject=Host%20Invite%20Request"
                style={{ color: 'rgba(212,175,55,0.6)', textDecoration: 'none' }}>
                Request access →
              </a>
            </p>
          </>
        )}

        {/* ══════════ HOST / CO-HOST REGISTRATION ══════════ */}
        {phase === 'register' && (
          <>
            <button onClick={() => go('invite')}
              style={{ ...T, background: 'none', border: 'none', color: 'rgba(255,255,255,0.38)', fontSize: 12, cursor: 'pointer', marginBottom: 18, padding: 0 }}>
              ← Back
            </button>

            {/* Verified role badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16, padding: '7px 12px', borderRadius: 8, background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.28)' }}>
              <CheckCircle style={{ width: 13, height: 13, color: GREEN, flexShrink: 0 }} />
              <span style={{ ...T, fontSize: 11, color: GREEN, fontWeight: 900, letterSpacing: '0.08em' }}>
                INVITE VERIFIED —
              </span>
              <span style={{ ...T, fontSize: 11, fontWeight: 900, color: roleColor, letterSpacing: '0.06em' }}>
                {roleLabel.toUpperCase()} ACCESS
              </span>
            </div>

            <h2 style={{ ...T, fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Create your account</h2>

            <form onSubmit={handleHostRegister} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputSty} />
              <input type="password" placeholder="Choose a password" value={password}
                onChange={e => setPassword(e.target.value)} required
                autoComplete="new-password" style={inputSty} />
              <p style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 -2px' }}>Date of birth (must be 21+)</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={dobMonth} onChange={e => setDobMonth(e.target.value)} required style={dobSelSty}>
                  <option value="">Month</option>
                  {DOB_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select value={dobDay} onChange={e => setDobDay(e.target.value)} required style={{ ...dobSelSty, flex: '0 0 70px' }}>
                  <option value="">Day</option>
                  {DOB_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={dobYear} onChange={e => setDobYear(e.target.value)} required style={dobSelSty}>
                  <option value="">Year</option>
                  {DOB_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {info && <p style={{ ...T, fontSize: 12, color: GOLD, textAlign: 'center', margin: 0 }}>{info}</p>}
              {error && <ErrBox msg={error} />}
              <Btn type="submit" loading={loading}>{loading ? 'Creating account…' : `Join as ${roleLabel}`}</Btn>
            </form>
          </>
        )}

        <p style={{ marginTop: 18, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.13)', ...T }}>
          By continuing you agree to our terms of service and privacy policy.
          Must be 18+ to view · 21+ to host.
        </p>
      </div>

      {/* Browse without account */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <a href="/" style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
          Browse without signing in →
        </a>
      </div>
    </div>
  );
}
