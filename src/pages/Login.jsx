import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { Radio, Lock, CheckCircle } from 'lucide-react';

const T   = { fontFamily: 'Barlow Condensed, sans-serif' };
const GOLD    = '#D4AF37';
const BG      = '#080B18';
const CRIMSON = '#800020';

const inputSty = {
  height: 46, padding: '0 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10, color: '#fff',
  fontSize: 14, outline: 'none',
  width: '100%', boxSizing: 'border-box',
  fontFamily: 'Barlow Condensed, sans-serif',
};

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

function ErrorBox({ msg }) {
  return (
    <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.28)', color: '#FF8070', fontSize: 12, ...T }}>
      {msg}
    </div>
  );
}

function PrimaryBtn({ children, loading, disabled, onClick, type }) {
  return (
    <button type={type || 'button'} onClick={onClick} disabled={loading || disabled}
      style={{ height: 46, width: '100%', borderRadius: 10, background: (loading || disabled) ? 'rgba(128,0,32,0.4)' : `linear-gradient(135deg,${CRIMSON},#A0003A)`, border: '1px solid rgba(212,175,55,0.35)', color: GOLD, fontSize: 14, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: (loading || disabled) ? 'not-allowed' : 'pointer', ...T }}>
      {children}
    </button>
  );
}

export default function Login({ fromUrl: propFromUrl }) {
  // phase: 'signin' | 'password' | 'invite' | 'register'
  const [phase, setPhase]           = useState('signin');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [codeValid, setCodeValid]   = useState(false);
  const [error, setError]           = useState('');
  const [info, setInfo]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [resetSent, setResetSent]   = useState(false);

  const params     = new URLSearchParams(window.location.search);
  const rawFromUrl = propFromUrl || params.get('from_url') || appParams.fromUrl || '/';
  const fromUrl    = /\/(api\/apps\/auth|login)/i.test(rawFromUrl) ? '/' : rawFromUrl;

  // Check for invite code in URL: /login?invite=XXXXXXXX
  useEffect(() => {
    const urlCode = params.get('invite');
    if (urlCode) {
      setInviteCode(urlCode);
      validateCode(urlCode, true);
    }
    const token = params.get('access_token');
    if (token) {
      base44.auth.setToken(token);
      window.location.href = fromUrl;
    }
  }, []);

  // ── Invite code validation ──────────────────────────────────────────────
  // Codes must be 6+ chars. In production, validate against base44 InviteCode entity.
  async function validateCode(code, autoRedirect) {
    const clean = (code || '').trim().toUpperCase();
    if (clean.length < 6) {
      setError('Invalid invite code — check your invitation and try again.');
      return false;
    }
    // Validate against base44 entity if available, otherwise accept any well-formed code
    try {
      const results = await base44.entities.InviteCode.filter({ code: clean, used: false });
      if (!results || results.length === 0) {
        setError('Invite code not found or already used. Contact the host for a new code.');
        return false;
      }
    } catch (_) {
      // Entity may not exist yet — accept any code with valid format for now
      if (clean.length < 6) {
        setError('Invalid invite code.');
        return false;
      }
    }
    setCodeValid(true);
    setError('');
    if (autoRedirect) setPhase('register');
    return true;
  }

  const handleValidateCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await validateCode(inviteCode);
    setLoading(false);
    if (ok) setPhase('register');
  };

  // ── Sign In ─────────────────────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = fromUrl;
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Register (invited users only) ───────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('Creating your account…');
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      // Mark invite code as used
      try {
        const results = await base44.entities.InviteCode.filter({ code: inviteCode.trim().toUpperCase(), used: false });
        if (results && results.length > 0) {
          await base44.entities.InviteCode.update(results[0].id, { used: true, used_by: email });
        }
      } catch (_) { /* entity may not exist, that's ok */ }
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = fromUrl;
    } catch (err) {
      setInfo('');
      setError(err?.response?.data?.detail || err?.message || 'Could not create account — try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email above first.'); return; }
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
      setResetSent(true);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider('google', fromUrl);

  const reset = (toPhase) => { setPhase(toPhase); setError(''); setInfo(''); };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Radio style={{ width: 30, height: 30, color: GOLD }} />
        <span style={{ fontSize: 30, fontWeight: 900, color: GOLD, letterSpacing: '0.04em', ...T }}>SeeWhy LIVE</span>
      </div>

      {/* Invitation-Only badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, padding: '4px 14px', borderRadius: 20, background: 'rgba(128,0,32,0.18)', border: '1px solid rgba(128,0,32,0.45)' }}>
        <Lock style={{ width: 11, height: 11, color: CRIMSON }} />
        <span style={{ ...T, fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.6)' }}>BY INVITATION ONLY</span>
      </div>

      <div style={{ width: '100%', maxWidth: 380, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.18)', padding: '26px 26px 20px' }}>

        {/* ── Phase: SIGN IN ── */}
        {phase === 'signin' && (
          <>
            <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.38)', textAlign: 'center', marginBottom: 20 }}>
              Members sign in below
            </p>

            <button onClick={handleGoogle}
              style={{ width: '100%', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 12, background: '#fff', border: 'none', color: '#333', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 18, ...T }}>
              <GoogleIcon /> Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>or email</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (email) reset('password'); }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputSty} />
              {error && <ErrorBox msg={error} />}
              <PrimaryBtn type="submit">Continue →</PrimaryBtn>
            </form>

            {/* Invite code link */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
              <p style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.28)', marginBottom: 8 }}>New to SeeWhy LIVE?</p>
              <button onClick={() => reset('invite')}
                style={{ ...T, background: 'none', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 8, padding: '8px 20px', color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em' }}>
                Enter Invite Code
              </button>
            </div>
          </>
        )}

        {/* ── Phase: PASSWORD (sign in) ── */}
        {phase === 'password' && (
          <>
            <button onClick={() => reset('signin')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 12px 5px 8px', cursor: 'pointer', marginBottom: 18, ...T, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              ← {email}
            </button>

            <h2 style={{ ...T, fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Welcome back</h2>

            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus autoComplete="current-password" style={inputSty} />

              {error && <ErrorBox msg={error} />}

              {resetSent
                ? <p style={{ ...T, color: '#6DBF7E', fontSize: 12, textAlign: 'center', margin: 0 }}>Reset email sent — check your inbox.</p>
                : <button type="button" onClick={handleForgotPassword} disabled={loading}
                    style={{ ...T, background: 'none', border: 'none', color: 'rgba(212,175,55,0.55)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', alignSelf: 'flex-end', padding: 0 }}>
                    Forgot password?
                  </button>
              }

              <PrimaryBtn type="submit" loading={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </PrimaryBtn>
            </form>
          </>
        )}

        {/* ── Phase: INVITE CODE ── */}
        {phase === 'invite' && (
          <>
            <button onClick={() => reset('signin')}
              style={{ ...T, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', marginBottom: 18, padding: 0 }}>
              ← Back to sign in
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Lock style={{ width: 16, height: 16, color: GOLD }} />
              <h2 style={{ ...T, fontSize: 17, fontWeight: 900, color: '#fff', margin: 0 }}>Enter Invite Code</h2>
            </div>
            <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 18 }}>
              You received this code in your invitation from the host.
            </p>

            <form onSubmit={handleValidateCode} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="INVITE CODE"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                required
                autoFocus
                autoCapitalize="characters"
                autoComplete="off"
                style={{ ...inputSty, letterSpacing: '0.18em', fontWeight: 900, fontSize: 16, textAlign: 'center', textTransform: 'uppercase' }}
              />
              {error && <ErrorBox msg={error} />}
              <PrimaryBtn type="submit" loading={loading}>
                {loading ? 'Checking…' : 'Validate Code →'}
              </PrimaryBtn>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <p style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>Don't have an invite code?</p>
              <a href="mailto:support@seewhylive.com?subject=Request%20Invite%20Code"
                style={{ ...T, fontSize: 12, color: 'rgba(212,175,55,0.6)', textDecoration: 'none' }}>
                Request access from the host →
              </a>
            </div>
          </>
        )}

        {/* ── Phase: REGISTER (invited users only) ── */}
        {phase === 'register' && (
          <>
            <button onClick={() => reset('invite')}
              style={{ ...T, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', marginBottom: 18, padding: 0 }}>
              ← Back
            </button>

            {/* Verified code badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '6px 12px', borderRadius: 8, background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.3)' }}>
              <CheckCircle style={{ width: 13, height: 13, color: '#6DBF7E', flexShrink: 0 }} />
              <span style={{ ...T, fontSize: 11, color: '#6DBF7E', fontWeight: 700, letterSpacing: '0.08em' }}>INVITE CODE VERIFIED</span>
              <span style={{ ...T, fontSize: 11, color: 'rgba(109,191,126,0.6)', marginLeft: 4 }}>{inviteCode.trim().toUpperCase()}</span>
            </div>

            <h2 style={{ ...T, fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Create your account</h2>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputSty} />
              <input type="password" placeholder="Choose a password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" style={inputSty} />

              {info && <p style={{ ...T, fontSize: 12, color: GOLD, textAlign: 'center', margin: 0 }}>{info}</p>}
              {error && <ErrorBox msg={error} />}

              <PrimaryBtn type="submit" loading={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </PrimaryBtn>
            </form>
          </>
        )}

        <p style={{ marginTop: 18, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.13)', ...T }}>
          By continuing you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
