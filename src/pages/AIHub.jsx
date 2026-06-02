import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BG   = '#080B18';
const BG2  = 'rgba(13,6,24,0.9)';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const PINK = '#FF1564';
const T    = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange, activeColor }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: value ? (activeColor || GOLD) : 'rgba(255,255,255,0.12)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          position: 'absolute', top: 3, width: 18, height: 18, borderRadius: 9,
          background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          style={{
            position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(13,6,24,0.97)', border: `1px solid ${GOLD}55`,
            borderRadius: 12, padding: '12px 22px',
            color: '#fff', fontSize: 14, ...T,
            fontWeight: 700, letterSpacing: '0.04em',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${GOLD}18`,
            zIndex: 9999, whiteSpace: 'nowrap',
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, accentColor }) {
  return (
    <div style={{
      background: BG2,
      border: '1px solid rgba(212,175,55,0.12)',
      borderRadius: 16,
      borderLeft: `3px solid ${accentColor || GOLD}`,
      padding: '20px 18px',
    }}>
      {children}
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label }) {
  return (
    <span style={{
      ...T, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
      padding: '3px 10px', borderRadius: 999,
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
      color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

// ── Genre pill (visual only) ──────────────────────────────────────────────────
function GenrePill({ label }) {
  return (
    <span style={{
      ...T, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
      padding: '4px 12px', borderRadius: 999, cursor: 'default',
      background: 'rgba(212,175,55,0.1)', border: `1px solid ${GOLD}40`,
      color: GOLD,
    }}>
      {label}
    </span>
  );
}

// ── Feature row item ──────────────────────────────────────────────────────────
function FeatureItem({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIHub() {
  const [guardianOn, setGuardianOn] = useState(true);
  const [ariaOn, setAriaOn] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  function showToast(msg) {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, paddingBottom: 60 }}>

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', padding: '28px 16px 16px' }}>
        <h1 style={{ ...T, fontSize: 30, fontWeight: 900, color: GOLD, letterSpacing: '0.04em', margin: 0 }}>
          🤖 AI Command Center
        </h1>
        <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>
          All your AI tools in one place — music, moderation, co-host, and analytics
        </p>

        {/* Live stats bar */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginTop: 12, padding: '6px 16px', borderRadius: 999,
          background: 'rgba(212,175,55,0.08)', border: `1px solid ${GOLD}30`,
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {[
            { dot: '#00ff88', label: 'Guardian Active' },
            { dot: GOLD,      label: 'ARIA Online' },
            { dot: '#00d4ff', label: 'Music Ready' },
            { dot: PINK,      label: '0 events today' },
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>·</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.dot, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ ...T, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>
                  {item.label}
                </span>
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Cards container ── */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Section 1: AI Music ── */}
        <Card accentColor="#00d4ff">
          <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>🎵 AI Music Studio</p>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>
            Generate background music for your streams. Choose genre, mood, tempo.
          </p>

          {/* Genre selector pills (visual only — clicking navigates) */}
          <Link to={createPageUrl('AIMusic')} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
              {['Lo-Fi', 'Trap', 'Gospel', 'Afrobeats', 'R&B', 'Chill'].map(g => (
                <GenrePill key={g} label={g} />
              ))}
            </div>
          </Link>

          {/* Big CTA */}
          <Link to={createPageUrl('AIMusic')} style={{ textDecoration: 'none', display: 'block', marginBottom: 14 }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              style={{
                ...T, padding: '13px 0', borderRadius: 12, textAlign: 'center',
                background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`,
                color: '#000', fontSize: 15, fontWeight: 900, letterSpacing: '0.07em',
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Open Music Studio →
            </motion.div>
          </Link>

          {/* Stats row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            <StatPill label="1,200+ tracks generated" />
            <StatPill label="8 genres" />
            <StatPill label="Custom BPM" />
          </div>
        </Card>

        {/* ── Section 2: Guardian AI Moderation ── */}
        <Card accentColor={PINK}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>🛡️ Guardian AI Moderation</p>
            <Toggle value={guardianOn} onChange={setGuardianOn} activeColor="#00ff88" />
          </div>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>
            Real-time chat moderation. Auto-removes hate speech, spam, and toxic content.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
            <StatPill label="Blocked: 0" />
            <StatPill label="Warned: 0" />
            <StatPill label="Muted: 0" />
            <StatPill label="Response time: <50ms" />
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            <FeatureItem icon="🚫" label="Auto-ban patterns" />
            <FeatureItem icon="🔑" label="Custom keyword filters" />
            <FeatureItem icon="⚖️" label="Appeal system" />
            <FeatureItem icon="🌐" label="Multi-language detection" />
          </div>

          <Link to={createPageUrl('AIModeration')} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              style={{
                ...T, padding: '11px 0', borderRadius: 12, textAlign: 'center',
                background: 'rgba(255,21,100,0.12)', border: `1px solid ${PINK}40`,
                color: PINK, fontSize: 14, fontWeight: 900, letterSpacing: '0.07em',
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Configure Guardian →
            </motion.div>
          </Link>
        </Card>

        {/* ── Section 3: ARIA Co-host ── */}
        <Card accentColor={GOLD}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>🤖 ARIA — AI Co-host</p>
            <Toggle value={ariaOn} onChange={setAriaOn} activeColor={GOLD} />
          </div>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>
            Your AI broadcasting partner. Engages chat, answers questions, keeps energy high.
          </p>

          {/* ARIA status */}
          <AnimatePresence>
            {ariaOn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: 14 }}
              >
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(212,175,55,0.08)', border: `1px solid ${GOLD}30`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, display: 'inline-block', flexShrink: 0 }} className="animate-pulse" />
                  <span style={{ ...T, fontSize: 12, color: GOLD, fontWeight: 700, letterSpacing: '0.04em' }}>
                    ARIA is active · monitoring chat · ready to engage
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            <FeatureItem icon="💬" label="Answers viewer questions" />
            <FeatureItem icon="🎉" label="Announces milestones (100 viewers!)" />
            <FeatureItem icon="👋" label="Welcomes new joiners" />
            <FeatureItem icon="⚡" label="Prompts chat engagement" />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => showToast('🤖 ARIA is your AI co-host — turn her on to start broadcasting!')}
            style={{
              ...T, width: '100%', padding: '11px 0', borderRadius: 12,
              background: 'rgba(212,175,55,0.1)', border: `1px solid ${GOLD}40`,
              color: GOLD, fontSize: 14, fontWeight: 900, letterSpacing: '0.07em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Meet ARIA →
          </motion.button>
        </Card>

        {/* ── Section 4: Creator Network ── */}
        <Card accentColor="#a78bfa">
          <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>👥 Creator Network</p>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.5 }}>
            Tools built for simultaneous creators and live audiences.
          </p>

          {/* 2-col feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
            {[
              { icon: '🎙️', title: '20-Person Stage', desc: 'Up to 20 live video/audio participants' },
              { icon: '🔀', title: 'Concurrent Rooms', desc: 'Unlimited rooms running simultaneously' },
              { icon: '💰', title: '90% Payout',      desc: 'Industry-best creator revenue split' },
              { icon: '🌐', title: 'Multi-Language Chat', desc: 'Real-time translation in 50+ languages' },
              { icon: '⚔️', title: 'PK Battles',      desc: 'Creator vs creator live competitions' },
              { icon: '📺', title: 'Watch Party Sync', desc: 'Synchronized video with any audience size' },
            ].map(item => (
              <div key={item.title} style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)',
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                <p style={{ ...T, fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{item.title}</p>
                <p style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Section 5: AI Analytics ── */}
        <Card accentColor="#00ff88">
          <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>📊 AI Insights</p>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.5 }}>
            AI-powered stream analytics and growth recommendations.
          </p>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Avg Session',   value: '23min',        color: '#00ff88' },
              { label: 'Retention',     value: '68%',          color: '#00d4ff' },
              { label: 'Peak Viewers',  value: 'calculating…', color: GOLD },
              { label: 'Best Time',     value: '7–9pm',        color: '#a78bfa' },
            ].map(m => (
              <div key={m.label} style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)',
              }}>
                <p style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</p>
                <p style={{ ...T, fontSize: 22, fontWeight: 900, color: m.color, letterSpacing: '0.02em' }}>{m.value}</p>
              </div>
            ))}
          </div>

          <Link to={createPageUrl('StreamAnalytics')} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              style={{
                ...T, padding: '11px 0', borderRadius: 12, textAlign: 'center',
                background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)',
                color: '#00ff88', fontSize: 14, fontWeight: 900, letterSpacing: '0.07em',
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              View Full Analytics →
            </motion.div>
          </Link>
        </Card>

        {/* ── Bottom info strip ── */}
        <p style={{
          textAlign: 'center',
          ...T,
          fontSize: 12,
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.05em',
          lineHeight: 1.6,
          padding: '0 8px',
        }}>
          All AI features are included free · 90% creator payout · Powered by SeeWhy LIVE
        </p>

      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
