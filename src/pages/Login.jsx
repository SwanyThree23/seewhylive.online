import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { Radio } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const GOLD = '#C9A84C';
const BG = '#0E0C09';
const CRIMSON = '#800020';

const inputSty = {
  height: 46, padding: '0 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10, color: '#fff',
  fontSize: 14, outline: 'none',
  fontFamily: 'Barlow Condensed, sans-serif',
  width: '100%', boxSizing: 'border-box',
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

// Login accepts an optional fromUrl prop for inline rendering (no page reload needed)
export default function Login({ fromUrl: propFromUrl }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phase, setPhase] = useState('welcome'); // 'welcome' | 'password'
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const auth = useAuth();
  const enterGuestMode = auth ? auth.enterGuestMode : null;

  const params = new URLSearchParams(window.location.search);
  const rawFromUrl = propFromUrl || params.get('from_url') || appParams.fromUrl || '/';
  const fromUrl = /\/(api\/apps\/auth|login)/i.test(rawFromUrl) ? '/' : rawFromUrl;

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('access_token');
    if (token) {
      base44.auth.setToken(token);
      window.location.href = fromUrl;
    }
  }, []);

  const handleEmailNext = (e) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setPhase('password');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (isNewUser) {
        setInfo('Creating your account…');
        await base44.auth.register({ email, password });
        await base44.auth.loginViaEmailPassword(email, password);
      } else {
        await base44.auth.loginViaEmailPassword(email, password);
      }
      window.location.href = fromUrl;
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || '';
      setInfo('');
      setError(msg || 'Incorrect credentials — try again or reset your password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
      setResetSent(true);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider('google', fromUrl);

  const goBack = () => {
    setPhase('welcome');
    setError('');
    setInfo('');
    setIsNewUser(false);
    setResetSent(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <Radio style={{ width: 28, height: 28, color: GOLD }} />
        <span style={{ fontSize: 28, fontWeight: 900, color: GOLD, letterSpacing: '0.04em', ...T }}>SeeWhy LIVE</span>
      </div>

      <div style={{ width: '100%', maxWidth: 380, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.18)', padding: '28px 28px 20px' }}>

        {/* ── Phase 1: Welcome ── */}
        {phase === 'welcome' && (
          <>
            <p style={{ ...T, fontSize: 14, color: 'rgba(255,255,255,0.40)', marginBottom: 20, textAlign: 'center', margin: '0 0 20px' }}>
              Go live, watch, chat &amp; tip creators
            </p>

            {/* Google — primary CTA */}
            <button onClick={handleGoogle}
              style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 16, ...T }}>
              <GoogleIcon />
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>or email</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <form onSubmit={handleEmailNext} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={inputSty}
              />
              {error && (
                <div style={{ padding: '7px 12px', borderRadius: 8, background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.28)', color: '#FF8070', fontSize: 12, ...T }}>
                  {error}
                </div>
              )}
              <button type="submit"
                style={{ height: 46, borderRadius: 10, background: `linear-gradient(135deg,${CRIMSON},#A0003A)`, border: '1px solid rgba(201,168,76,0.35)', color: GOLD, fontSize: 14, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', ...T }}>
                Continue →
              </button>
            </form>

            {enterGuestMode && (
              <button onClick={enterGuestMode}
                style={{ display: 'block', width: '100%', marginTop: 14, background: 'none', border: 'none', color: 'rgba(255,255,255,0.22)', fontSize: 12, cursor: 'pointer', textAlign: 'center', ...T, padding: '6px 0' }}>
                Browse without an account →
              </button>
            )}
          </>
        )}

        {/* ── Phase 2: Password ── */}
        {phase === 'password' && (
          <>
            {/* Back chip showing email */}
            <button onClick={goBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 12px 5px 8px', cursor: 'pointer', marginBottom: 18, ...T, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              ← {email}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ ...T, fontSize: 17, fontWeight: 900, color: '#fff', margin: 0 }}>
                {isNewUser ? 'Create account' : 'Welcome back'}
              </h2>
              <button onClick={() => { setIsNewUser(v => !v); setError(''); }}
                style={{ ...T, background: 'none', border: 'none', color: GOLD, fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                {isNewUser ? 'Sign in instead' : 'New user?'}
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                autoComplete={isNewUser ? 'new-password' : 'current-password'}
                style={inputSty}
              />

              {info && (
                <div style={{ ...T, fontSize: 12, color: GOLD, textAlign: 'center' }}>{info}</div>
              )}
              {error && (
                <div style={{ padding: '7px 12px', borderRadius: 8, background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.28)', color: '#FF8070', fontSize: 12, ...T }}>
                  {error}
                </div>
              )}

              {!isNewUser && !resetSent && (
                <button type="button" onClick={handleForgotPassword} disabled={loading}
                  style={{ ...T, background: 'none', border: 'none', color: 'rgba(201,168,76,0.55)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', alignSelf: 'flex-end', padding: 0 }}>
                  Forgot password?
                </button>
              )}
              {resetSent && (
                <p style={{ ...T, color: '#6DBF7E', fontSize: 12, textAlign: 'center', margin: 0 }}>
                  Reset email sent — check your inbox.
                </p>
              )}

              <button type="submit" disabled={loading}
                style={{ height: 46, borderRadius: 10, background: loading ? 'rgba(128,0,32,0.5)' : `linear-gradient(135deg,${CRIMSON},#A0003A)`, border: '1px solid rgba(201,168,76,0.35)', color: GOLD, fontSize: 14, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', ...T }}>
                {loading ? 'Please wait…' : isNewUser ? 'Create Account' : 'Sign In'}
              </button>
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
