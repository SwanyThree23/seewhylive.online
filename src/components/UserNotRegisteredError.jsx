import React from 'react';
import { Radio, ShieldAlert } from 'lucide-react';

const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const GOLD = '#D4AF37';
const BG = '#080B18';
const CRIMSON = '#800020';

const UserNotRegisteredError = () => (
  <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
      <Radio style={{ width: 28, height: 28, color: GOLD }} />
      <span style={{ fontSize: 28, fontWeight: 900, color: GOLD, letterSpacing: '0.04em', ...T }}>SeeWhy LIVE</span>
    </div>

    <div style={{ width: '100%', maxWidth: 400, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(128,0,32,0.4)', padding: 32, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(128,0,32,0.2)', border: '1px solid rgba(128,0,32,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <ShieldAlert style={{ width: 28, height: 28, color: '#FF6680' }} />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 10, ...T }}>Account Not Found</h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28, lineHeight: 1.6, ...T }}>
        The account you signed in with isn't registered on SeeWhy LIVE. Try a different account or reach out to our team.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => window.location.href = '/login'}
          style={{ height: 46, borderRadius: 12, background: `linear-gradient(135deg, ${CRIMSON}, #A0003A)`, border: '1px solid rgba(212,175,55,0.35)', color: GOLD, fontSize: 14, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', ...T }}>
          Sign In with Different Account
        </button>
        <button
          onClick={() => window.open('mailto:support@seewhylive.online', '_blank', 'noopener,noreferrer')}
          style={{ height: 42, borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', ...T }}>
          Contact Support
        </button>
      </div>
    </div>
  </div>
);

export default UserNotRegisteredError;
