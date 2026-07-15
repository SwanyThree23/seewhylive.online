import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { Radio } from 'lucide-react';
import { isSafeUrl } from '@/lib/security';

const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const GOLD = '#C9A84C';
const BG = '#0E0C09';
const CRIMSON = '#800020';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // from_url param — where to redirect after successful login
  // Reject any auth-path from_url to prevent infinite redirect loops
  const params = new URLSearchParams(window.location.search);
  const rawFromUrl = params.get('from_url') || appParams.fromUrl || '/';
  // Block auth loops AND external/javascript: URLs — only allow same-origin paths
  const fromUrl = (() => {
    if (/\/(api\/apps\/auth|login)/i.test(rawFromUrl)) return '/';
    if (rawFromUrl.startsWith('/')) return rawFromUrl; // relative path — always safe
    if (isSafeUrl(rawFromUrl) && new URL(rawFromUrl).origin === window.location.origin) return rawFromUrl;
    return '/';
  })();

  // If an access_token lands in the URL (OAuth callback), the SDK already
  // stored it via app-params; just navigate home.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('access_token');
    if (token) {
      base44.auth.setToken(token);
      window.location.href = fromUrl;
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await base44.auth.loginViaEmailPassword(email, password);
      } else {
        await base44.auth.register({ email, password });
        await base44.auth.loginViaEmailPassword(email, password);
      }
      window.location.href = fromUrl;
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Something went wrong — check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider('google', fromUrl);
  };

  const handleMicrosoft = () => {
    base44.auth.loginWithProvider('microsoft', fromUrl);
  };

  const handleFacebook = () => {
    base44.auth.loginWithProvider('facebook', fromUrl);
  };

  const handleApple = () => {
    base44.auth.loginWithProvider('apple', fromUrl);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address above, then click "Forgot password?"');
      return;
    }
    setError('');
    setResetLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
      setResetSent(true);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Could not send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <Radio style={{ width: 28, height: 28, color: GOLD }} />
        <span style={{ fontSize: 28, fontWeight: 900, color: GOLD, letterSpacing: '0.04em', ...T }}>SeeWhy LIVE</span>
      </div>

      <div style={{ width: '100%', maxWidth: 380, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.18)', padding: 28 }}>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', background: mode === m ? 'rgba(201,168,76,0.15)' : 'transparent', color: mode === m ? GOLD : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', ...T }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ height: 44, padding: '0 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', ...T }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ height: 44, padding: '0 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', ...T }}
          />

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', color: '#C0392B', fontSize: 12, ...T }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ height: 46, borderRadius: 10, background: loading ? 'rgba(128,0,32,0.5)' : `linear-gradient(135deg, ${CRIMSON}, #A0003A)`, border: '1px solid rgba(201,168,76,0.35)', color: GOLD, fontSize: 14, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', ...T }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {mode === 'login' && (
            resetSent
              ? <p style={{ textAlign: 'center', fontSize: 12, color: '#6DBF7E', ...T }}>Password reset email sent — check your inbox.</p>
              : <button type="button" onClick={handleForgotPassword} disabled={resetLoading}
                  style={{ background: 'none', border: 'none', color: 'rgba(201,168,76,0.55)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0, alignSelf: 'center', ...T }}>
                  {resetLoading ? 'Sending…' : 'Forgot password?'}
                </button>
          )}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', ...T }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <button onClick={handleGoogle}
          style={{ width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', ...T }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>
        <button onClick={handleMicrosoft}
          style={{ width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', ...T }}>
          <svg width="18" height="18" viewBox="0 0 23 23"><rect x="1" y="1" width="10" height="10" fill="#F25022" rx="0.5"/><rect x="12" y="1" width="10" height="10" fill="#7FBA00" rx="0.5"/><rect x="1" y="12" width="10" height="10" fill="#00A4EF" rx="0.5"/><rect x="12" y="12" width="10" height="10" fill="#FFB900" rx="0.5"/></svg>
          Continue with Microsoft
        </button>
        <button onClick={handleFacebook}
          style={{ width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', ...T }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Continue with Facebook
        </button>
        <button onClick={handleApple}
          style={{ width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', ...T }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.78 1.3 10.32.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.27 3.12-2.53.98-1.44 1.39-2.83 1.41-2.9-.03-.01-2.7-1.04-2.73-4.13zM14.63 4.59c.71-.87 1.19-2.06 1.06-3.26-1.02.04-2.26.68-3 1.54-.66.76-1.24 1.98-1.08 3.15 1.14.09 2.31-.58 3.02-1.43z"/></svg>
          Continue with Apple
        </button>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', ...T }}>
          By signing in you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}