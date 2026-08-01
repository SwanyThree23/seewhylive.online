import React, { useState } from 'react';

export default function Login(props) {
  var onClose = props.onClose;
  var onSuccess = props.onSuccess;
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [error, setError] = useState('');
  var [loading, setLoading] = useState(false);

  function handleSubmit() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: password })
    })
      .then(function(res) { return res.json().then(function(data) { return { ok: res.ok, data: data }; }); })
      .then(function(result) {
        setLoading(false);
        if (!result.ok) {
          setError(result.data.error || 'Login failed');
          return;
        }
        localStorage.setItem('sw_token', result.data.token);
        localStorage.setItem('sw_role', result.data.role);
        localStorage.setItem('sw_userId', result.data.userId);
        onSuccess(result.data.role, result.data.userId);
      })
      .catch(function() {
        setLoading(false);
        setError('Network error — check your connection');
      });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,3,10,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360, background: 'rgba(26,21,16,.97)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: '#F0E8D4', letterSpacing: 3 }}>LOG IN</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', marginTop: 4 }}>Creators &amp; hosts only</div>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={function(e) { setEmail(e.target.value); }}
          onKeyDown={function(e) { if (e.key === 'Enter') handleSubmit(); }}
          style={{ width: '100%', boxSizing: 'border-box', background: '#07050A', border: '1px solid rgba(201,168,76,.4)', borderRadius: 9, padding: '12px 14px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, outline: 'none' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={function(e) { setPassword(e.target.value); }}
          onKeyDown={function(e) { if (e.key === 'Enter') handleSubmit(); }}
          style={{ width: '100%', boxSizing: 'border-box', background: '#07050A', border: '1px solid rgba(201,168,76,.4)', borderRadius: 9, padding: '12px 14px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, outline: 'none' }}
        />

        {error ? (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#C01838', textAlign: 'center' }}>{error}</div>
        ) : null}

        <button
          onClick={handleSubmit}
          disabled={loading || !email.trim() || !password}
          style={{ width: '100%', padding: '13px', background: (email.trim() && password) ? 'linear-gradient(135deg,#800020,#C01838)' : 'rgba(26,21,16,.5)', border: '1px solid ' + ((email.trim() && password) ? '#C01838' : '#6B5A44'), borderRadius: 9, color: (email.trim() && password) ? '#C9A84C' : '#6B5A44', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 3, cursor: (email.trim() && password) ? 'pointer' : 'default' }}
        >
          {loading ? 'LOGGING IN...' : 'LOG IN'}
        </button>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#6B5A44', fontFamily: "'DM Mono',monospace", fontSize: 11, cursor: 'pointer', textDecoration: 'underline', textAlign: 'center' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
