import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const C = { burg: '#800020', gold: '#D4AF37', amber: '#D4854A', obs: '#080B18', gray: '#666', white: '#F5F0E8' };
const FONT = 'Barlow Condensed, sans-serif';

const STEPS = [
  { id: 1, label: 'Profile',       emoji: '🎙️', key: 'step_1_profile' },
  { id: 2, label: 'Branding',      emoji: '🎨', key: 'step_2_branding' },
  { id: 3, label: 'Streaming',     emoji: '📡', key: 'step_3_stream_key' },
  { id: 4, label: 'Subscriptions', emoji: '💎', key: 'step_4_subscription' },
  { id: 5, label: 'Community',     emoji: '👥', key: 'step_5_community' },
  { id: 6, label: 'Test Stream',   emoji: '🔴', key: 'step_6_test_stream' },
  { id: 7, label: 'Payouts',       emoji: '💸', key: 'step_7_stripe' },
];

const STEP_HERO = [
  { headline: 'Create Your Creator Identity',   sub: 'How thousands of viewers will discover you' },
  { headline: 'Define Your Brand Look',          sub: "Your channel's signature colors and style" },
  { headline: 'Set Up Your Stream',             sub: 'Connect OBS, ZEGOCLOUD, or stream in-browser' },
  { headline: 'Monetize Your Audience',         sub: 'Set up fan subscription tiers — keep 90%' },
  { headline: 'Build Your Community',           sub: 'A home base for your most loyal fans' },
  { headline: 'Run a Test Stream',              sub: 'Make sure everything works before going live' },
  { headline: 'Connect Payouts',                sub: 'Start earning from day one — 90/10 split' },
];

const CATEGORIES = ['Gaming','Talk','Tech','Music','Sports','Art','Other'];
const AVATARS    = ['🎲','🎙','✍️','🤖','🎮','🎵'];
const THEMES = [
  { name: 'Domino Noir',    primary: '#DC143C', secondary: '#D4AF37', preview: ['#1a0a0a','#DC143C','#D4AF37'] },
  { name: 'Broadcast Gold', primary: '#0D0D0D', secondary: '#D4AF37', preview: ['#0D0D0D','#1a1a1a','#D4AF37'] },
  { name: 'Broadcast Blue', primary: '#003580', secondary: '#C9A84C', preview: ['#00152b','#003580','#C9A84C'] },
  { name: 'Creator Amber',  primary: '#1a0800', secondary: '#D4854A', preview: ['#1a0800','#2a1200','#D4854A'] },
];
const FONTS = [
  { name: 'Broadcast', sample: 'Barlow Condensed + Space Mono' },
  { name: 'Clean',     sample: 'DM Sans + IBM Plex Mono' },
  { name: 'Bold',      sample: 'Bebas Neue + Share Tech Mono' },
];
const DEFAULT_TIERS = [
  { name: 'Fan',       price: 4.99,  benefits: 'Exclusive chat emotes, supporter badge, ad-free viewing.' },
  { name: 'Supporter', price: 9.99,  benefits: 'Everything in Fan + priority queue, monthly shoutout, Discord access.' },
  { name: 'VIP',       price: 24.99, benefits: 'Everything in Supporter + direct DM, monthly 1-on-1, custom emote.' },
];

const lbl = {
  display: 'block', fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,0.4)',
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 18,
};
const inp = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#f0ebe0', fontSize: 14, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 2,
};

// ── Top progress bar ─────────────────────────────────────────────────────────
function StepProgress({ step, onboarding }) {
  return (
    <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        {STEPS.map(s => {
          const done   = onboarding?.[s.key];
          const active = s.id === step;
          return (
            <div key={s.id} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', margin: '0 auto 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                background: done ? C.gold : active ? `${C.burg}55` : 'rgba(255,255,255,0.05)',
                border: done ? 'none' : active ? `1.5px solid ${C.burg}` : '1.5px solid rgba(255,255,255,0.1)',
                color: done ? '#000' : active ? '#fff' : 'rgba(255,255,255,0.25)',
                fontWeight: 900, fontFamily: FONT, transition: 'all 0.3s',
              }}>
                {done ? '✓' : s.id}
              </div>
              <div style={{
                fontSize: 9, fontFamily: FONT, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: done ? C.gold : active ? C.gold : 'rgba(255,255,255,0.2)', fontWeight: done || active ? 900 : 400,
              }}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
        <motion.div animate={{ width: `${((step - 1) / 6) * 100}%` }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${C.burg}, ${C.gold})`, borderRadius: 1 }}
          transition={{ duration: 0.4 }} />
      </div>
    </div>
  );
}

// ── Step hero header ─────────────────────────────────────────────────────────
function StepHero({ step }) {
  const { emoji } = STEPS[step - 1];
  const { headline, sub } = STEP_HERO[step - 1];
  return (
    <div style={{ padding: '24px 20px 8px', textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18, margin: '0 auto 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
        background: `linear-gradient(135deg, ${C.burg}40, ${C.gold}22)`,
        border: `1px solid rgba(212,175,55,0.25)`,
        boxShadow: `0 0 28px ${C.gold}22`,
      }}>
        {emoji}
      </div>
      <h2 style={{ fontFamily: FONT, fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '0.02em' }}>
        {headline}
      </h2>
      <p style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
        {sub}
      </p>
    </div>
  );
}

// ── Nav buttons ──────────────────────────────────────────────────────────────
function NavButtons({ step, setStep, onSave, saving, canNext = true, onSkip }) {
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '16px 20px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      justifyContent: 'space-between', alignItems: 'center', marginTop: 12,
    }}>
      <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
        style={{
          padding: '9px 18px', background: 'transparent',
          border: `1px solid ${step === 1 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.18)'}`,
          borderRadius: 8, color: step === 1 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.5)',
          cursor: step === 1 ? 'default' : 'pointer',
          fontFamily: FONT, fontSize: 13, letterSpacing: '0.06em',
        }}>
        ← Back
      </button>
      <div style={{ display: 'flex', gap: 6 }}>
        {onSkip && (
          <button onClick={onSkip}
            style={{ padding: '9px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontFamily: FONT, fontSize: 12, letterSpacing: '0.05em' }}>
            Skip
          </button>
        )}
        <button onClick={onSave} disabled={saving || !canNext}
          style={{
            padding: '9px 22px',
            background: canNext ? `linear-gradient(90deg, ${C.burg}, ${C.gold})` : 'rgba(255,255,255,0.07)',
            border: 'none', borderRadius: 8,
            color: canNext ? '#000' : 'rgba(255,255,255,0.2)',
            cursor: canNext ? 'pointer' : 'default',
            fontFamily: FONT, fontSize: 14, fontWeight: 900, letterSpacing: '0.06em',
          }}>
          {saving ? 'Saving…' : step === 7 ? 'Finish 🎉' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

// ── STEP 1: Profile ──────────────────────────────────────────────────────────
function Step1({ onboarding, user, onDone, setStep }) {
  const [form, setForm] = useState({ display_name: user?.full_name || '', bio: '', avatar: '🎙', category: 'Gaming' });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const profiles = await base44.entities.CreatorProfile.filter({ user_id: user.id });
    const data = { user_id: user.id, display_name: form.display_name, bio: form.bio, avatar_url: form.avatar, category: form.category };
    if (profiles.length) await base44.entities.CreatorProfile.update(profiles[0].id, data);
    else await base44.entities.CreatorProfile.create(data);
    onDone({ step_1_profile: true, current_step: 2 });
    setSaving(false);
  };
  return (
    <div style={{ padding: '0 20px 4px' }}>
      <StepHero step={1} />
      <label style={lbl}>Display Name *</label>
      <input style={inp} value={form.display_name} onChange={e => setForm(f => ({...f, display_name: e.target.value}))} placeholder="Your creator name" maxLength={80} />
      <label style={lbl}>Bio <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>{form.bio.length}/140</span></label>
      <textarea style={{...inp, height: 76, resize: 'none'}} maxLength={140} value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} placeholder="Tell viewers about yourself…" />
      <label style={lbl}>Avatar</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        {AVATARS.map(a => (
          <button key={a} onClick={() => setForm(f => ({...f, avatar: a}))}
            style={{ width: 48, height: 48, fontSize: 24, borderRadius: 12, border: `2px solid ${form.avatar === a ? C.gold : 'rgba(255,255,255,0.1)'}`, background: form.avatar === a ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.15s' }}>
            {a}
          </button>
        ))}
      </div>
      <label style={lbl}>Category</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setForm(f => ({...f, category: c}))}
            style={{ padding: '6px 14px', borderRadius: 99, border: `1px solid ${form.category === c ? C.gold : 'rgba(255,255,255,0.12)'}`, background: form.category === c ? 'rgba(212,175,55,0.12)' : 'transparent', color: form.category === c ? C.gold : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: FONT, fontSize: 12, letterSpacing: '0.05em', transition: 'all 0.15s' }}>
            {c}
          </button>
        ))}
      </div>
      <NavButtons step={1} setStep={setStep} onSave={save} saving={saving} canNext={!!form.display_name} />
    </div>
  );
}

// ── STEP 2: Branding ─────────────────────────────────────────────────────────
function Step2({ onboarding, onDone, setStep }) {
  const [theme, setTheme] = useState(0);
  const [font, setFont] = useState(0);
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); onDone({ step_2_branding: true, current_step: 3 }); setSaving(false); };
  const T = THEMES[theme];
  return (
    <div style={{ padding: '0 20px 4px' }}>
      <StepHero step={2} />
      <label style={lbl}>Color Theme</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {THEMES.map((t, i) => (
          <button key={t.name} onClick={() => setTheme(i)}
            style={{ padding: '12px', borderRadius: 12, border: `2px solid ${theme === i ? C.gold : 'rgba(255,255,255,0.08)'}`, background: theme === i ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
              {t.preview.map((c, j) => <div key={j} style={{ width: 20, height: 20, borderRadius: 5, background: c }} />)}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 900, color: theme === i ? C.gold : 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>{t.name.toUpperCase()}</div>
          </button>
        ))}
      </div>
      {/* Live mini-preview */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.secondary}33`, marginBottom: 8 }}>
        <div style={{ height: 5, background: `linear-gradient(90deg, ${T.primary}, ${T.secondary})` }} />
        <div style={{ padding: '14px 16px', background: T.preview[0] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: T.primary, border: `1px solid ${T.secondary}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📡</div>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 900, color: T.secondary, letterSpacing: '0.06em' }}>YOUR CHANNEL</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>● LIVE NOW · 1,247 viewers</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ padding: '5px 12px', background: T.primary, borderRadius: 6, fontSize: 11, color: T.secondary, fontFamily: FONT, letterSpacing: '0.06em', fontWeight: 900 }}>SUBSCRIBE</div>
            <div style={{ padding: '5px 12px', background: `${T.secondary}18`, border: `1px solid ${T.secondary}35`, borderRadius: 6, fontSize: 11, color: T.secondary, fontFamily: FONT, letterSpacing: '0.06em' }}>TIP 💛</div>
          </div>
        </div>
      </div>
      <label style={lbl}>Font Pairing</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        {FONTS.map((f, i) => (
          <button key={f.name} onClick={() => setFont(i)}
            style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${font === i ? C.gold : 'rgba(255,255,255,0.08)'}`, background: font === i ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 900, color: font === i ? C.gold : 'rgba(255,255,255,0.45)' }}>{f.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{f.sample}</div>
          </button>
        ))}
      </div>
      <NavButtons step={2} setStep={setStep} onSave={save} saving={saving} />
    </div>
  );
}

// ── STEP 3: Streaming Setup ───────────────────────────────────────────────────
function Step3({ onboarding, onDone, setStep }) {
  const RTMP = 'rtmp://ingest.seewhylive.online/live';
  const [streamKey] = useState('sk_' + Math.random().toString(36).slice(2, 10).toUpperCase());
  const [showKey, setShowKey] = useState(false);
  const [zegoId, setZegoId] = useState('');
  const [platforms, setPlatforms] = useState({ YouTube: false, TikTok: false, Facebook: false, Twitch: false, Rumble: false });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const copy = () => { navigator.clipboard.writeText(RTMP); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const save = async () => { setSaving(true); onDone({ step_3_stream_key: true, zego_configured: !!zegoId, rtmp_configured: true, current_step: 4 }); setSaving(false); };
  return (
    <div style={{ padding: '0 20px 4px' }}>
      <StepHero step={3} />
      <label style={lbl}>RTMP Ingest URL</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
        <input style={{...inp, flex: 1, marginBottom: 0}} readOnly value={RTMP} />
        <button onClick={copy} style={{ padding: '12px 14px', background: copied ? 'rgba(109,191,126,0.12)' : 'rgba(212,175,55,0.1)', border: `1px solid ${copied ? 'rgba(109,191,126,0.4)' : 'rgba(212,175,55,0.3)'}`, borderRadius: 10, color: copied ? '#6DBF7E' : C.gold, cursor: 'pointer', fontFamily: FONT, fontSize: 11, letterSpacing: '0.06em', fontWeight: 900, whiteSpace: 'nowrap' }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <label style={lbl}>Stream Key</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
        <input style={{...inp, flex: 1, marginBottom: 0, fontFamily: 'monospace', letterSpacing: showKey ? '0.05em' : '0.2em'}} readOnly value={showKey ? streamKey : '••••••••••••••••'} />
        <button onClick={() => setShowKey(v => !v)} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14 }}>
          {showKey ? '🙈' : '👁'}
        </button>
      </div>
      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)', marginTop: 12, marginBottom: 4 }}>
        <p style={{ fontFamily: FONT, fontSize: 11, color: C.gold, margin: '0 0 4px', fontWeight: 900, letterSpacing: '0.06em' }}>📺 ALSO SUPPORTED: IN-BROWSER STREAMING</p>
        <p style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Hit "Go Live" in the app — no OBS needed. Camera &amp; mic stream directly.</p>
      </div>
      <label style={lbl}>ZEGOCLOUD App ID (optional)</label>
      <input style={inp} value={zegoId} onChange={e => setZegoId(e.target.value)} placeholder="Enter App ID from console.zegocloud.com" />
      <label style={lbl}>Target Platforms</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
        {Object.keys(platforms).map(p => (
          <button key={p} onClick={() => setPlatforms(pl => ({...pl, [p]: !pl[p]}))}
            style={{ padding: '6px 14px', borderRadius: 99, border: `1px solid ${platforms[p] ? C.gold : 'rgba(255,255,255,0.12)'}`, background: platforms[p] ? 'rgba(212,175,55,0.12)' : 'transparent', color: platforms[p] ? C.gold : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: FONT, fontSize: 12, transition: 'all 0.15s' }}>
            {p}
          </button>
        ))}
      </div>
      <NavButtons step={3} setStep={setStep} onSave={save} saving={saving} onSkip={() => onDone({ step_3_stream_key: true, current_step: 4 })} />
    </div>
  );
}

// ── STEP 4: Subscription Tiers ────────────────────────────────────────────────
function Step4({ user, onDone, setStep }) {
  const [tiers, setTiers] = useState(DEFAULT_TIERS.map((t, i) => ({...t, id: i})));
  const [saving, setSaving] = useState(false);
  const updateTier = (id, field, val) => setTiers(ts => ts.map(t => t.id === id ? {...t, [field]: val} : t));
  const addTier = () => setTiers(ts => [...ts, { id: Date.now(), name: 'Custom', price: 14.99, benefits: '' }]);
  const save = async () => {
    setSaving(true);
    for (const tier of tiers) {
      await base44.entities.SubscriptionTier.create({ creator_id: user.id, name: tier.name, price: tier.price, description: tier.benefits });
    }
    onDone({ step_4_subscription: true, current_step: 5 });
    setSaving(false);
  };
  return (
    <div style={{ padding: '0 20px 4px' }}>
      <StepHero step={4} />
      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', marginBottom: 12 }}>
        <p style={{ fontFamily: FONT, fontSize: 12, color: C.gold, margin: 0, fontWeight: 900, letterSpacing: '0.06em' }}>
          💛 You keep <strong>90%</strong> of every subscription payment
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {tiers.map(tier => (
          <div key={tier.id} style={{ padding: 14, borderRadius: 12, border: '1px solid rgba(212,175,55,0.15)', background: 'rgba(212,175,55,0.03)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={{...inp, flex: 1, marginBottom: 0}} value={tier.name} onChange={e => updateTier(tier.id, 'name', e.target.value)} placeholder="Tier name" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0 10px', whiteSpace: 'nowrap' }}>
                <span style={{ color: C.gold, fontSize: 13, fontWeight: 900 }}>$</span>
                <input style={{ width: 50, background: 'transparent', border: 'none', outline: 'none', color: '#f0ebe0', fontSize: 13, padding: '10px 0', fontFamily: 'inherit' }} type="number" step="0.01" value={tier.price} onChange={e => updateTier(tier.id, 'price', parseFloat(e.target.value))} />
              </div>
            </div>
            <textarea style={{...inp, height: 52, resize: 'none', marginBottom: 0, fontSize: 12}} value={tier.benefits} onChange={e => updateTier(tier.id, 'benefits', e.target.value)} placeholder="Benefits for this tier…" />
          </div>
        ))}
      </div>
      {tiers.length < 4 && (
        <button onClick={addTier} style={{ width: '100%', padding: '10px', background: 'transparent', border: `1px dashed ${C.burg}`, borderRadius: 10, color: C.burg, cursor: 'pointer', fontFamily: FONT, fontSize: 12, letterSpacing: '0.06em', marginBottom: 4 }}>
          + Add Custom Tier
        </button>
      )}
      <NavButtons step={4} setStep={setStep} onSave={save} saving={saving} onSkip={() => onDone({ step_4_subscription: true, current_step: 5 })} />
    </div>
  );
}

// ── STEP 5: Community ─────────────────────────────────────────────────────────
function Step5({ user, onDone, setStep }) {
  const [form, setForm] = useState({ name: '', description: '', category: 'other', welcome_message: '' });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    await base44.entities.Community.create({ name: form.name, description: form.description, category: form.category, owner_id: user.id });
    onDone({ step_5_community: true, current_step: 6 });
    setSaving(false);
  };
  return (
    <div style={{ padding: '0 20px 4px' }}>
      <StepHero step={5} />
      <label style={lbl}>Community Name *</label>
      <input style={inp} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. GamingWithSwan" />
      <label style={lbl}>Description</label>
      <textarea style={{...inp, height: 72, resize: 'none'}} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="What is your community about?" />
      <label style={lbl}>Category</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
        {['music','gaming','tech','education','entertainment','sports','lifestyle','other'].map(c => (
          <button key={c} type="button" onClick={() => setForm(f => ({...f, category: c}))}
            style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, border: `1px solid ${form.category === c ? C.gold : 'rgba(255,255,255,0.12)'}`, background: form.category === c ? 'rgba(212,175,55,0.12)' : 'transparent', color: form.category === c ? C.gold : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s' }}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>
      <label style={lbl}>Welcome Message</label>
      <textarea style={{...inp, height: 56, resize: 'none'}} value={form.welcome_message} onChange={e => setForm(f => ({...f, welcome_message: e.target.value}))} placeholder="Message shown to new members…" />
      <NavButtons step={5} setStep={setStep} onSave={save} saving={saving} canNext={!!form.name} onSkip={() => onDone({ step_5_community: true, current_step: 6 })} />
    </div>
  );
}

// ── STEP 6: Test Stream ───────────────────────────────────────────────────────
function Step6({ user, onDone, setStep }) {
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [roomId, setRoomId] = useState(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); finishStream(); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [started]);
  const startStream = async () => {
    const room = await base44.entities.Room.create({ title: `Test Stream — ${user?.full_name || 'Creator'}`, status: 'live', creator_id: user.id });
    setRoomId(room.id);
    setStarted(true);
  };
  const finishStream = async () => {
    if (roomId) await base44.entities.Room.update(roomId, { status: 'ended' });
    setDone(true);
  };
  const save = async () => { setSaving(true); onDone({ step_6_test_stream: true, test_stream_room_id: roomId, current_step: 7 }); setSaving(false); };
  return (
    <div style={{ padding: '0 20px 4px' }}>
      <StepHero step={6} />
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        {!started && !done && (
          <button onClick={startStream}
            style={{ padding: '14px 32px', background: `linear-gradient(90deg, ${C.burg}, ${C.gold})`, border: 'none', borderRadius: 12, color: '#000', fontFamily: FONT, fontSize: 16, fontWeight: 900, letterSpacing: '0.06em', cursor: 'pointer', boxShadow: `0 0 32px ${C.burg}44` }}>
            🔴 START TEST STREAM
          </button>
        )}
        {started && !done && (
          <div>
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(128,0,32,0.4)', '0 0 0 20px rgba(128,0,32,0)', '0 0 0 0 rgba(128,0,32,0)'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 100, height: 100, borderRadius: '50%', border: `3px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(212,175,55,0.08)' }}>
              <span style={{ fontFamily: FONT, fontSize: 38, fontWeight: 900, color: C.gold }}>{countdown}</span>
            </motion.div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>STREAM LIVE · Auto-ends in {countdown}s</div>
            <button onClick={finishStream} style={{ marginTop: 16, padding: '8px 20px', background: 'transparent', border: `1px solid ${C.burg}`, borderRadius: 8, color: C.burg, cursor: 'pointer', fontFamily: FONT, fontSize: 12, letterSpacing: '0.06em' }}>End Early</button>
          </div>
        )}
        {done && (
          <div>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, color: C.gold, marginBottom: 6 }}>Test Stream Complete!</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Your streaming setup is working perfectly.</div>
          </div>
        )}
      </div>
      <NavButtons step={6} setStep={setStep} onSave={save} saving={saving} canNext={done} onSkip={() => onDone({ step_6_test_stream: true, current_step: 7 })} />
    </div>
  );
}

// ── STEP 7: Payouts ───────────────────────────────────────────────────────────
function Step7({ onDone, setStep }) {
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const finish = async (skipped) => {
    setSaving(true);
    await onDone({ step_7_stripe: true, stripe_connected: !skipped, is_complete: true, completed_at: new Date().toISOString() });
    setComplete(true);
    setSaving(false);
  };
  if (complete) return <CompletionScreen />;
  return (
    <div style={{ padding: '0 20px 4px' }}>
      <StepHero step={7} />
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.2)', marginBottom: 14 }}>
        <div style={{ padding: '14px 16px', background: 'rgba(212,175,55,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
            {[
              { label: 'Creator', pct: '90%', color: C.gold },
              { label: 'Platform', pct: '10%', color: 'rgba(255,255,255,0.3)' },
              { label: 'Your First $100', value: '$90', color: C.gold },
            ].map(r => (
              <div key={r.label}>
                <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 900, color: r.color }}>{r.pct || r.value}</div>
                <div style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
        <Link to="/CreatorDashboard" style={{ textDecoration: 'none' }}>
          <button style={{ width: '100%', padding: '14px', background: `linear-gradient(90deg, ${C.burg}, ${C.gold})`, border: 'none', borderRadius: 12, color: '#000', fontFamily: FONT, fontSize: 15, fontWeight: 900, letterSpacing: '0.06em', cursor: 'pointer' }}>
            Connect Stripe →
          </button>
        </Link>
        <button onClick={() => finish(true)} disabled={saving}
          style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'rgba(255,255,255,0.35)', fontFamily: FONT, fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer' }}>
          Skip for now — set up payouts later
        </button>
      </div>
    </div>
  );
}

// ── Completion screen ─────────────────────────────────────────────────────────
function CompletionScreen() {
  const nav = useNavigate();
  useEffect(() => {
    import('canvas-confetti').then(m => m.default({
      particleCount: 180, spread: 80,
      colors: ['#D4AF37', '#800020', '#D4AF37', '#fff', '#6DBF7E'],
    }));
  }, []);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      style={{ padding: '36px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 60, marginBottom: 14 }}>🎉</div>
      <h2 style={{ fontFamily: FONT, fontSize: 30, fontWeight: 900, color: C.gold, letterSpacing: '0.04em', margin: '0 0 8px' }}>
        YOU'RE LIVE-READY!
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 24, fontFamily: FONT }}>
        Your creator profile is live. Time to go broadcast.
      </p>
      <button onClick={() => nav('/GoLive')}
        style={{ padding: '14px 32px', background: `linear-gradient(90deg, ${C.burg}, ${C.gold})`, border: 'none', borderRadius: 12, color: '#000', fontFamily: FONT, fontSize: 16, fontWeight: 900, letterSpacing: '0.06em', cursor: 'pointer', marginBottom: 28 }}>
        🔴 GO LIVE NOW →
      </button>
      <div style={{ borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: 20 }}>
        <p style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Also worth exploring</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { emoji: '🤖', label: 'Joyce AI',     href: '/JoyceAI' },
            { emoji: '⚔️', label: 'State vs State', href: '/StateVsState' },
            { emoji: '🎙️', label: 'Podcast Studio', href: '/PodcastStudio' },
            { emoji: '⚡', label: 'INS Forge',      href: '/INSForge' },
            { emoji: '🎵', label: 'AI Music',       href: '/AIMusic' },
            { emoji: '🛡️', label: 'Guardian AI',   href: '/GuardianAI' },
          ].map(f => (
            <a key={f.href} href={f.href} style={{ textDecoration: 'none', padding: '12px 8px', background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 22 }}>{f.emoji}</span>
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em', textAlign: 'center' }}>{f.label}</span>
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: onboarding } = useQuery({
    queryKey: ['onboarding', user?.id],
    queryFn: async () => {
      const list = await base44.entities.CreatorOnboarding.filter({ user_id: user.id });
      return list[0] || null;
    },
    enabled: !!user?.id,
  });
  const [step, setStep] = useState(1);
  const [flowOpen, setFlowOpen] = useState(false);
  useEffect(() => { if (onboarding) setStep(onboarding.current_step || 1); }, [onboarding]);

  const updateOnboarding = useMutation({
    mutationFn: async (data) => {
      if (onboarding?.id) return base44.entities.CreatorOnboarding.update(onboarding.id, data);
      return base44.entities.CreatorOnboarding.create({ user_id: user.id, ...data });
    },
    onSuccess: (_, data) => {
      qc.invalidateQueries({ queryKey: ['onboarding', user?.id] });
      if (data.is_complete && user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'milestone',
          title: 'Completed creator onboarding',
        }).catch(() => {});
      }
    },
  });

  const handleDone = async (data) => {
    await updateOnboarding.mutateAsync(data);
    if (data.current_step) setStep(data.current_step);
  };

  if (!user) return (
    <div style={{ background: '#080B18', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: FONT, fontSize: 14, letterSpacing: '0.1em' }}>
      Loading…
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.obs, fontFamily: FONT }}>
      {/* Gold accent top bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #800020, #D4AF37, #6DBF7E, #D4AF37)' }} />

      {/* Header */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.1)', background: 'rgba(8,11,24,0.98)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📡</span>
          <span style={{ fontFamily: FONT, fontSize: 13, color: C.gold, letterSpacing: '0.12em', fontWeight: 900 }}>SEEWHY LIVE — CREATOR SETUP</span>
        </div>
        <a href="/Home" style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: '0.06em' }}>
          Skip for now →
        </a>
      </div>

      {/* Main card — scrollable, responsive width */}
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '16px 0 40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(8,11,24,0.97)', borderRadius: 16, border: '1px solid rgba(212,175,55,0.12)', overflow: 'hidden', margin: '0 12px' }}
        >
          <StepProgress step={step} onboarding={onboarding} />
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {step === 1 && <Step1 onboarding={onboarding} user={user} onDone={handleDone} setStep={setStep} />}
              {step === 2 && <Step2 onboarding={onboarding} onDone={handleDone} setStep={setStep} />}
              {step === 3 && <Step3 onboarding={onboarding} onDone={handleDone} setStep={setStep} />}
              {step === 4 && <Step4 user={user} onDone={handleDone} setStep={setStep} />}
              {step === 5 && <Step5 user={user} onDone={handleDone} setStep={setStep} />}
              {step === 6 && <Step6 user={user} onDone={handleDone} setStep={setStep} />}
              {step === 7 && <Step7 onDone={handleDone} setStep={setStep} />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <OnboardingFlow isOpen={flowOpen} onClose={() => setFlowOpen(false)} />
    </div>
  );
}
