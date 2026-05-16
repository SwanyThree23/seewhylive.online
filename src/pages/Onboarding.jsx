import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const C = { burg: '#800020', gold: '#D4AF37', volt: '#C8FF00', obs: '#0D0D0D', gray: '#666', white: '#F5F0E8' };

const STEPS = [
  { id: 1, label: 'Profile', key: 'step_1_profile' },
  { id: 2, label: 'Branding', key: 'step_2_branding' },
  { id: 3, label: 'Streaming', key: 'step_3_stream_key' },
  { id: 4, label: 'Subscriptions', key: 'step_4_subscription' },
  { id: 5, label: 'Community', key: 'step_5_community' },
  { id: 6, label: 'Test Stream', key: 'step_6_test_stream' },
  { id: 7, label: 'Payouts', key: 'step_7_stripe' },
];

const AVATARS = ['🎲','🎙','✍️','🤖','🎮','🎵'];
const CATEGORIES = ['Gaming','Talk','Tech','Music','Sports','Art','Other'];
const THEMES = [
  { name: 'Domino Noir', primary: '#DC143C', secondary: '#D4AF37', preview: ['#1a0a0a','#DC143C','#D4AF37'] },
  { name: 'Broadcast Blue', primary: '#003580', secondary: '#00F5FF', preview: ['#00152b','#003580','#00F5FF'] },
  { name: 'Creator Gold', primary: '#0D0D0D', secondary: '#D4AF37', preview: ['#0D0D0D','#1a1a1a','#D4AF37'] },
  { name: 'Volt Green', primary: '#0D0D0D', secondary: '#C8FF00', preview: ['#0D0D0D','#111','#C8FF00'] },
];
const FONTS = [
  { name: 'Broadcast', sample: 'Orbitron + Rajdhani' },
  { name: 'Clean', sample: 'Barlow + IBM Plex' },
  { name: 'Bold', sample: 'Bebas + Share Tech' },
];
const DEFAULT_TIERS = [
  { name: 'Fan', price: 4.99, benefits: 'Access to exclusive chat emotes, supporter badge, ad-free viewing.' },
  { name: 'Supporter', price: 9.99, benefits: 'Everything in Fan + priority queue, monthly shoutout, Discord access.' },
  { name: 'VIP', price: 24.99, benefits: 'Everything in Supporter + direct DM access, monthly 1-on-1, custom emote.' },
];

function ProgressBar({ step, onboarding }) {
  const pct = ((step - 1) / 6) * 100;
  return (
    <div style={{ padding: '16px 20px', borderBottom: `1px solid rgba(212,175,55,0.15)` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: C.gray, letterSpacing: 2 }}>STEP {step} OF 7 — {STEPS[step-1].label.toUpperCase()}</span>
        <span style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: C.gold }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div animate={{ width: `${pct}%` }} style={{ height: '100%', background: `linear-gradient(90deg, ${C.burg}, ${C.gold})`, borderRadius: 2 }} transition={{ duration: 0.4 }} />
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
        {STEPS.map(s => {
          const done = onboarding?.[s.key];
          const active = s.id === step;
          return (
            <div key={s.id} style={{ flex: 1, height: 4, borderRadius: 2, background: done ? C.gold : active ? C.burg : '#222' }} title={s.label} />
          );
        })}
      </div>
    </div>
  );
}

function NavButtons({ step, setStep, onSave, saving, canNext = true, onSkip }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '16px 20px', borderTop: `1px solid rgba(255,255,255,0.06)`, justifyContent: 'space-between', alignItems: 'center' }}>
      <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
        style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${step===1?'#333':C.gray}`, borderRadius: 6, color: step===1?'#333':C.gray, cursor: step===1?'default':'pointer', fontFamily: 'Barlow Condensed', fontSize: 12, letterSpacing: 1 }}>
        ← BACK
      </button>
      <div style={{ display: 'flex', gap: 6 }}>
        {onSkip && <button onClick={onSkip} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #333', borderRadius: 6, color: '#555', cursor: 'pointer', fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 1 }}>SKIP</button>}
        <button onClick={onSave} disabled={saving || !canNext}
          style={{ padding: '8px 20px', background: canNext ? `linear-gradient(90deg, ${C.burg}, ${C.gold})` : '#222', border: 'none', borderRadius: 6, color: canNext ? '#000' : '#555', cursor: canNext ? 'pointer' : 'default', fontFamily: 'Barlow Condensed', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
          {saving ? 'SAVING…' : step === 7 ? 'FINISH 🎉' : 'NEXT →'}
        </button>
      </div>
    </div>
  );
}

// ── STEP 1: Profile ──────────────────────────────────────────────
function Step1({ onboarding, user, onDone }) {
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
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontFamily: 'Barlow Condensed', fontSize: 22, color: C.gold, marginBottom: 16 }}>Set Up Your Creator Profile</h2>
      <label style={lbl}>Display Name</label>
      <input style={inp} value={form.display_name} onChange={e => setForm(f => ({...f, display_name: e.target.value}))} placeholder="Your creator name" />
      <label style={lbl}>Bio <span style={{color:C.gray}}>{form.bio.length}/140</span></label>
      <textarea style={{...inp, height: 70, resize:'none'}} maxLength={140} value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} placeholder="Tell viewers about yourself…" />
      <label style={lbl}>Avatar Emoji</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {AVATARS.map(a => (
          <button key={a} onClick={() => setForm(f => ({...f, avatar: a}))}
            style={{ width: 44, height: 44, fontSize: 22, borderRadius: 8, border: `2px solid ${form.avatar===a?C.gold:'#333'}`, background: form.avatar===a?'rgba(212,175,55,0.1)':'transparent', cursor: 'pointer' }}>{a}</button>
        ))}
      </div>
      <label style={lbl}>Category</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setForm(f => ({...f, category: c}))}
            style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${form.category===c?C.gold:'#333'}`, background: form.category===c?'rgba(212,175,55,0.1)':'transparent', color: form.category===c?C.gold:C.gray, cursor: 'pointer', fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 1 }}>{c}</button>
        ))}
      </div>
      <NavButtons step={1} setStep={() => {}} onSave={save} saving={saving} canNext={!!form.display_name} />
    </div>
  );
}

// ── STEP 2: Branding ─────────────────────────────────────────────
function Step2({ onboarding, onDone }) {
  const [theme, setTheme] = useState(0);
  const [font, setFont] = useState(0);
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); onDone({ step_2_branding: true, current_step: 3 }); setSaving(false); };
  const T = THEMES[theme];
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontFamily: 'Barlow Condensed', fontSize: 22, color: C.gold, marginBottom: 16 }}>Choose Your Brand</h2>
      <label style={lbl}>Color Theme</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {THEMES.map((t, i) => (
          <button key={t.name} onClick={() => setTheme(i)}
            style={{ padding: '10px', borderRadius: 8, border: `2px solid ${theme===i?C.gold:'#333'}`, background: '#0d0d0d', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              {t.preview.map((c, j) => <div key={j} style={{ width: 18, height: 18, borderRadius: 4, background: c }} />)}
            </div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: theme===i?C.gold:C.gray, letterSpacing: 1 }}>{t.name.toUpperCase()}</div>
          </button>
        ))}
      </div>
      <label style={lbl}>Font Pairing</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {FONTS.map((f, i) => (
          <button key={f.name} onClick={() => setFont(i)}
            style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${font===i?C.gold:'#333'}`, background: '#0d0d0d', cursor: 'pointer' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 13, color: font===i?C.gold:C.gray }}>{f.name}</div>
            <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>{f.sample}</div>
          </button>
        ))}
      </div>
      {/* Mini preview */}
      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.secondary}33`, marginBottom: 8 }}>
        <div style={{ height: 6, background: `linear-gradient(90deg, ${T.primary}, ${T.secondary})` }} />
        <div style={{ padding: '12px', background: T.preview[0] }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, color: T.secondary, letterSpacing: 2 }}>YOUR CHANNEL</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>● LIVE NOW · 1,247 viewers</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <div style={{ padding: '4px 10px', background: T.primary, borderRadius: 4, fontSize: 9, color: T.secondary, fontFamily: 'Barlow Condensed', letterSpacing: 1 }}>SUBSCRIBE</div>
            <div style={{ padding: '4px 10px', background: `${T.secondary}20`, borderRadius: 4, fontSize: 9, color: T.secondary, fontFamily: 'Barlow Condensed', letterSpacing: 1 }}>TIP</div>
          </div>
        </div>
      </div>
      <NavButtons step={2} setStep={() => {}} onSave={save} saving={saving} />
    </div>
  );
}

// ── STEP 3: Streaming Setup ──────────────────────────────────────
function Step3({ onboarding, onDone }) {
  const RTMP = 'rtmp://ingest.seewhy.live/live';
  const [streamKey] = useState('sk_' + Math.random().toString(36).slice(2,10).toUpperCase());
  const [showKey, setShowKey] = useState(false);
  const [zegoId, setZegoId] = useState('');
  const [zegoSign, setZegoSign] = useState('');
  const [platforms, setPlatforms] = useState({ YouTube: false, TikTok: false, Facebook: false, Twitch: false, Rumble: false });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const copy = () => { navigator.clipboard.writeText(RTMP); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const save = async () => {
    setSaving(true);
    onDone({ step_3_stream_key: true, zego_configured: !!zegoId, rtmp_configured: true, current_step: 4 });
    setSaving(false);
  };
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontFamily: 'Barlow Condensed', fontSize: 22, color: C.gold, marginBottom: 16 }}>Streaming Setup</h2>
      <label style={lbl}>RTMP Ingest URL</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <input style={{...inp, flex:1, marginBottom:0}} readOnly value={RTMP} />
        <button onClick={copy} style={{ padding: '8px 14px', background: copied?'rgba(200,255,0,0.1)':'rgba(212,175,55,0.1)', border: `1px solid ${copied?C.volt:C.gold}`, borderRadius: 6, color: copied?C.volt:C.gold, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, letterSpacing:1 }}>{copied?'✓ COPIED':'COPY'}</button>
      </div>
      <label style={lbl}>Stream Key</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <input style={{...inp, flex:1, marginBottom:0}} readOnly value={showKey ? streamKey : '••••••••••••••••'} />
        <button onClick={() => setShowKey(v => !v)} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #333', borderRadius: 6, color: C.gray, cursor:'pointer', fontSize: 11 }}>{showKey?'🙈':'👁'}</button>
      </div>
      <label style={lbl}>ZEGOCLOUD App ID <a href="https://console.zegocloud.com" target="_blank" rel="noreferrer" style={{color:C.gold,fontSize:9,marginLeft:4}}>console.zegocloud.com ↗</a></label>
      <input style={inp} value={zegoId} onChange={e => setZegoId(e.target.value)} placeholder="Enter your ZEGOCLOUD App ID" />
      <label style={lbl}>ZEGOCLOUD App Sign</label>
      <input style={inp} value={zegoSign} onChange={e => setZegoSign(e.target.value)} placeholder="Enter your App Sign (optional)" type="password" />
      <label style={lbl}>Target Platforms</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {Object.keys(platforms).map(p => (
          <button key={p} onClick={() => setPlatforms(pl => ({...pl, [p]: !pl[p]}))}
            style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${platforms[p]?C.gold:'#333'}`, background: platforms[p]?'rgba(212,175,55,0.1)':'transparent', color: platforms[p]?C.gold:C.gray, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, letterSpacing:1 }}>{p}</button>
        ))}
      </div>
      <NavButtons step={3} setStep={() => {}} onSave={save} saving={saving} onSkip={() => onDone({ step_3_stream_key: true, current_step: 4 })} />
    </div>
  );
}

// ── STEP 4: Subscription Tiers ───────────────────────────────────
function Step4({ user, onDone }) {
  const [tiers, setTiers] = useState(DEFAULT_TIERS.map((t, i) => ({...t, id: i})));
  const [saving, setSaving] = useState(false);
  const updateTier = (id, field, val) => setTiers(ts => ts.map(t => t.id===id ? {...t, [field]: val} : t));
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
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontFamily: 'Barlow Condensed', fontSize: 22, color: C.gold, marginBottom: 4 }}>Subscription Tiers</h2>
      <p style={{ fontSize: 11, color: C.gray, marginBottom: 14 }}>Customize your fan subscription plans</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {tiers.map(tier => (
          <div key={tier.id} style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={{...inp, flex:1, marginBottom:0}} value={tier.name} onChange={e => updateTier(tier.id, 'name', e.target.value)} placeholder="Tier name" />
              <div style={{ display:'flex', alignItems:'center', gap:4, background:'#111', border:'1px solid #333', borderRadius:6, padding:'0 8px' }}>
                <span style={{ color:C.gray, fontSize:12 }}>$</span>
                <input style={{ width:50, background:'transparent', border:'none', outline:'none', color:C.white, fontSize:12, padding:'6px 0' }} type="number" step="0.01" value={tier.price} onChange={e => updateTier(tier.id, 'price', parseFloat(e.target.value))} />
              </div>
            </div>
            <textarea style={{...inp, height:56, resize:'none', marginBottom:0}} value={tier.benefits} onChange={e => updateTier(tier.id, 'benefits', e.target.value)} placeholder="Benefits for this tier…" />
          </div>
        ))}
      </div>
      {tiers.length < 4 && <button onClick={addTier} style={{ width:'100%', padding:'8px', background:'transparent', border:`1px dashed ${C.burg}`, borderRadius:6, color:C.burg, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:12, letterSpacing:1, marginBottom:8 }}>+ ADD CUSTOM TIER</button>}
      <NavButtons step={4} setStep={() => {}} onSave={save} saving={saving} onSkip={() => onDone({ step_4_subscription: true, current_step: 5 })} />
    </div>
  );
}

// ── STEP 5: Community ────────────────────────────────────────────
function Step5({ user, onDone }) {
  const [form, setForm] = useState({ name: '', description: '', category: 'other', welcome_message: '' });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    await base44.entities.Community.create({ name: form.name, description: form.description, category: form.category, owner_id: user.id });
    onDone({ step_5_community: true, current_step: 6 });
    setSaving(false);
  };
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontFamily: 'Barlow Condensed', fontSize: 22, color: C.gold, marginBottom: 16 }}>Create Your Community</h2>
      <label style={lbl}>Community Name</label>
      <input style={inp} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. GamingWithSwan" />
      <label style={lbl}>Description</label>
      <textarea style={{...inp, height:70, resize:'none'}} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="What is your community about?" />
      <label style={lbl}>Category</label>
      <select style={{...inp, cursor:'pointer'}} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
        {['music','gaming','tech','education','entertainment','sports','lifestyle','other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
      </select>
      <label style={lbl}>Welcome Message</label>
      <textarea style={{...inp, height:56, resize:'none'}} value={form.welcome_message} onChange={e => setForm(f => ({...f, welcome_message: e.target.value}))} placeholder="Message shown to new members…" />
      <NavButtons step={5} setStep={() => {}} onSave={save} saving={saving} canNext={!!form.name} onSkip={() => onDone({ step_5_community: true, current_step: 6 })} />
    </div>
  );
}

// ── STEP 6: Test Stream ──────────────────────────────────────────
function Step6({ user, onDone }) {
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
    const room = await base44.entities.Room.create({ title: `Test Stream — ${user?.full_name||'Creator'}`, status: 'live', creator_id: user.id });
    setRoomId(room.id);
    setStarted(true);
  };
  const finishStream = async () => {
    if (roomId) await base44.entities.Room.update(roomId, { status: 'ended' });
    setDone(true);
  };
  const save = async () => {
    setSaving(true);
    onDone({ step_6_test_stream: true, test_stream_room_id: roomId, current_step: 7 });
    setSaving(false);
  };
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Barlow Condensed', fontSize: 22, color: C.gold, marginBottom: 8 }}>Test Your Stream</h2>
      <p style={{ fontSize: 12, color: C.gray, marginBottom: 24 }}>Run a quick 30-second test to verify everything works.</p>
      {!started && !done && <button onClick={startStream} style={{ padding:'12px 28px', background:`linear-gradient(90deg, ${C.burg}, ${C.gold})`, border:'none', borderRadius:8, color:'#000', fontFamily:'Barlow Condensed', fontSize:15, fontWeight:700, letterSpacing:1, cursor:'pointer' }}>🔴 START TEST STREAM</button>}
      {started && !done && (
        <div>
          <div style={{ width: 100, height: 100, borderRadius: '50%', border: `4px solid ${C.gold}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', background:'rgba(212,175,55,0.08)' }}>
            <span style={{ fontFamily:'Barlow Condensed', fontSize: 36, color: C.gold }}>{countdown}</span>
          </div>
          <div style={{ fontFamily:'Barlow Condensed', fontSize:13, color:C.gray, letterSpacing:1 }}>STREAM LIVE · AUTO-ENDS IN {countdown}s</div>
          <button onClick={finishStream} style={{ marginTop:16, padding:'8px 20px', background:'transparent', border:`1px solid ${C.burg}`, borderRadius:6, color:C.burg, cursor:'pointer', fontFamily:'Barlow Condensed', fontSize:11, letterSpacing:1 }}>END EARLY</button>
        </div>
      )}
      {done && (
        <div>
          <div style={{ fontSize:48, marginBottom:8 }}>✅</div>
          <div style={{ fontFamily:'Barlow Condensed', fontSize:18, color:C.volt }}>TEST STREAM COMPLETE!</div>
          <div style={{ fontSize:12, color:C.gray, marginTop:4 }}>Your streaming setup is working perfectly.</div>
        </div>
      )}
      <NavButtons step={6} setStep={() => {}} onSave={save} saving={saving} canNext={done} onSkip={() => onDone({ step_6_test_stream: true, current_step: 7 })} />
    </div>
  );
}

// ── STEP 7: Stripe ───────────────────────────────────────────────
function Step7({ onDone }) {
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
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontFamily: 'Barlow Condensed', fontSize: 22, color: C.gold, marginBottom: 8 }}>Connect Your Payouts</h2>
      <div style={{ padding: 14, borderRadius: 8, background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', marginBottom: 16 }}>
        <div style={{ fontFamily:'Barlow Condensed', fontSize:13, color:C.gold, marginBottom:6 }}>💸 90/10 Revenue Split</div>
        <div style={{ fontSize:11, color:C.gray, lineHeight:1.6 }}>You keep <strong style={{color:C.volt}}>90%</strong> of all tips, subscriptions, and merchandise sales. SeeWhy LIVE takes just 10% to keep the platform running.</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <Link to="/CreatorDashboard" style={{ textDecoration:'none' }}>
          <button style={{ width:'100%', padding:'12px', background:`linear-gradient(90deg, ${C.burg}, ${C.gold})`, border:'none', borderRadius:8, color:'#000', fontFamily:'Barlow Condensed', fontSize:14, fontWeight:700, letterSpacing:1, cursor:'pointer' }}>CONNECT STRIPE →</button>
        </Link>
        <button onClick={() => finish(true)} disabled={saving}
          style={{ width:'100%', padding:'10px', background:'transparent', border:'1px solid #333', borderRadius:8, color:C.gray, fontFamily:'Barlow Condensed', fontSize:11, letterSpacing:1, cursor:'pointer' }}>Skip for now</button>
      </div>
    </div>
  );
}

function CompletionScreen() {
  const nav = useNavigate();
  useEffect(() => {
    // Canvas confetti
    import('canvas-confetti').then(m => m.default({ particleCount: 150, spread: 70, colors: ['#D4AF37','#800020','#C8FF00','#fff'] }));
  }, []);
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontFamily:'Barlow Condensed', fontSize:28, color:C.gold, marginBottom:8 }}>YOU'RE LIVE-READY!</h2>
      <p style={{ color:C.gray, fontSize:13, marginBottom:24 }}>Your creator profile is set up and ready to go. Time to go live!</p>
      <button onClick={() => nav('/CreatorDashboard')}
        style={{ padding:'12px 28px', background:`linear-gradient(90deg, ${C.burg}, ${C.gold})`, border:'none', borderRadius:8, color:'#000', fontFamily:'Barlow Condensed', fontSize:14, fontWeight:700, letterSpacing:1, cursor:'pointer' }}>
        GO TO DASHBOARD →
      </button>
    </div>
  );
}

const lbl = { display:'block', fontFamily:'Barlow Condensed', fontSize:11, color:'#888', letterSpacing:1, textTransform:'uppercase', marginBottom:4, marginTop:12 };
const inp = { width:'100%', padding:'9px 12px', background:'#111', border:'1px solid #2a2a2a', borderRadius:6, color:'#f0ebe0', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:4 };

export default function OnboardingPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: user } = useQuery({ queryKey:['currentUser'], queryFn:() => base44.auth.me() });
  const { data: onboarding } = useQuery({
    queryKey: ['onboarding', user?.id],
    queryFn: async () => {
      const list = await base44.entities.CreatorOnboarding.filter({ user_id: user.id });
      return list[0] || null;
    },
    enabled: !!user?.id,
  });
  const [step, setStep] = useState(1);
  useEffect(() => { if (onboarding) setStep(onboarding.current_step || 1); }, [onboarding]);

  const updateOnboarding = useMutation({
    mutationFn: async (data) => {
      if (onboarding?.id) return base44.entities.CreatorOnboarding.update(onboarding.id, data);
      return base44.entities.CreatorOnboarding.create({ user_id: user.id, ...data });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding', user?.id] }),
  });

  const handleDone = async (data) => {
    await updateOnboarding.mutateAsync(data);
    if (data.current_step) setStep(data.current_step);
  };

  if (!user) return <div style={{background:'#0D0D0D',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#666',fontFamily:'Barlow Condensed',fontSize:14}}>Loading…</div>;

  return (
    <div style={{ minHeight:'100vh', background:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ width:'100%', maxWidth:480, background:'#111', borderRadius:12, border:`1px solid rgba(212,175,55,0.15)`, overflow:'hidden' }}>
        {/* Logo bar */}
        <div style={{ padding:'14px 20px', background:`linear-gradient(90deg, ${C.burg}22, transparent)`, borderBottom:'1px solid rgba(212,175,55,0.1)', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>📡</span>
          <span style={{ fontFamily:'Barlow Condensed', fontSize:14, color:C.gold, letterSpacing:2 }}>SEEWHY LIVE — CREATOR SETUP</span>
        </div>
        <ProgressBar step={step} onboarding={onboarding} />
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }}>
            {step === 1 && <Step1 onboarding={onboarding} user={user} onDone={handleDone} />}
            {step === 2 && <Step2 onboarding={onboarding} onDone={handleDone} />}
            {step === 3 && <Step3 onboarding={onboarding} onDone={handleDone} />}
            {step === 4 && <Step4 user={user} onDone={handleDone} />}
            {step === 5 && <Step5 user={user} onDone={handleDone} />}
            {step === 6 && <Step6 user={user} onDone={handleDone} />}
            {step === 7 && <Step7 onDone={handleDone} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}