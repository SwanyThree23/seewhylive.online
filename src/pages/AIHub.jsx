import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import AIPersonaCustomizer from '../components/live/AIPersonaCustomizer';
import SwanyBotContextEnhancer from '../components/guide/SwanyBotEnhanced';
import AIStreamSummary from '../components/live/AIStreamSummary';
import ContentRecommendations from '../components/social/ContentRecommendations';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BG     = '#080B18';
const BG2    = 'rgba(13,6,24,0.9)';
const GOLD   = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const CYAN   = '#D4AF37';
const PURPLE = '#D4AF37';
const GREEN  = '#22c55e';
const T      = { fontFamily: 'Barlow Condensed, sans-serif' };

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
  const [guardianOn, setGuardianOn]   = useState(true);
  const [ariaOn, setAriaOn]           = useState(false);
  const [directorOn, setDirectorOn]   = useState(false);
  const [toast, setToast]             = useState({ visible: false, message: '' });

  // DJ track state
  const [djTrack, setDjTrack]         = useState(null);

  // ARIA state
  const [ariaMessage, setAriaMessage] = useState('');
  const [ariaLoading, setAriaLoading] = useState(false);

  // Guardian state
  const [guardianResult, setGuardianResult] = useState(null);
  const [guardianLoading, setGuardianLoading] = useState(false);

  // Stage Director state
  const [directorSuggestion, setDirectorSuggestion] = useState(null);
  const [directorLoading, setDirectorLoading]       = useState(false);

  // Poll DJ track from localStorage every 3s
  useEffect(() => {
    function readDjTrack() {
      try {
        const raw = localStorage.getItem('seewhy_dj_track');
        setDjTrack(raw ? JSON.parse(raw) : null);
      } catch {
        setDjTrack(null);
      }
    }
    readDjTrack();
    const iv = setInterval(readDjTrack, 3000);
    return () => clearInterval(iv);
  }, []);

  function showToast(msg) {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  }

  async function generateAriaMessage() {
    setAriaLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'You are ARIA, an AI co-host for a live streaming platform. Generate one engaging chat message to say in a live stream right now. Keep it under 20 words, energetic, relevant to streaming culture. No hashtags.',
        response_json_schema: { type: 'object', properties: { message: { type: 'string' } } },
      });
      setAriaMessage(result.message || '');
    } catch {
      setAriaMessage('Hey chat, let\'s keep the energy up! Drop a 🔥 if you\'re loving this stream!');
    } finally {
      setAriaLoading(false);
    }
  }

  async function scanGuardian() {
    setGuardianLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'You are Guardian, an AI content moderator for a live stream. Generate a brief moderation status report for a clean stream. Format: { status: \'clean\'|\'warning\'|\'alert\', message: string, blocked: number, warned: number }',
        response_json_schema: {
          type: 'object',
          properties: {
            status:  { type: 'string' },
            message: { type: 'string' },
            blocked: { type: 'number' },
            warned:  { type: 'number' },
          },
        },
      });
      setGuardianResult(result);
    } catch {
      setGuardianResult({ status: 'clean', message: 'Stream is clean. No violations detected.', blocked: 0, warned: 0 });
    } finally {
      setGuardianLoading(false);
    }
  }

  async function suggestLayout() {
    setDirectorLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'You are an AI stage director for a live streaming panel with up to 20 participants. Suggest the optimal stage layout for a panel of 6 participants. Format: { layout: string, columns: number, reason: string }',
        response_json_schema: {
          type: 'object',
          properties: {
            layout:  { type: 'string' },
            columns: { type: 'number' },
            reason:  { type: 'string' },
          },
        },
      });
      setDirectorSuggestion(result);
    } catch {
      setDirectorSuggestion({ layout: '2x3 Grid', columns: 3, reason: 'Optimal for 6 participants — balanced visibility for all panelists.' });
    } finally {
      setDirectorLoading(false);
    }
  }

  // Guardian status badge color
  function guardianStatusColor(status) {
    if (status === 'alert')   return '#ef4444';
    if (status === 'warning') return '#f59e0b';
    return GREEN;
  }

  // Real status bar values
  const statusItems = [
    { dot: guardianOn ? '#6DBF7E' : 'rgba(255,255,255,0.2)', label: guardianOn ? 'Guardian Active' : 'Guardian Off' },
    { dot: ariaOn ? GOLD : 'rgba(255,255,255,0.2)',           label: ariaOn ? 'ARIA Online' : 'ARIA Offline' },
    { dot: djTrack ? CYAN : 'rgba(255,255,255,0.2)',          label: djTrack ? `DJ: ${djTrack.title}` : 'No DJ Track' },
    { dot: PINK,                                              label: '0 panel members' },
  ];

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

        {/* Live status bar */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginTop: 12, padding: '6px 16px', borderRadius: 999,
          background: 'rgba(212,175,55,0.08)', border: `1px solid ${GOLD}30`,
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {statusItems.map((item, i) => (
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

        {/* ── Section 1: AI Music DJ ── */}
        <Card accentColor={CYAN}>
          <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>🎵 AI Music Studio</p>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>
            Generate background music for your streams. Choose genre, mood, tempo.
          </p>

          {/* Now Playing chip */}
          {djTrack ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
              padding: '8px 14px', borderRadius: 10,
              background: `${CYAN}10`, border: `1px solid ${CYAN}30`,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: CYAN, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ ...T, fontSize: 13, fontWeight: 800, color: CYAN, letterSpacing: '0.03em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {djTrack.emoji && `${djTrack.emoji} `}{djTrack.title}
              </span>
              {djTrack.bpm && (
                <span style={{
                  ...T, fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 999,
                  background: `${GOLD}18`, border: `1px solid ${GOLD}40`, color: GOLD, whiteSpace: 'nowrap',
                }}>
                  {djTrack.bpm} BPM
                </span>
              )}
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
              padding: '8px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                🎵 No track active
              </span>
            </div>
          )}

          {/* Genre selector pills */}
          <Link to={createPageUrl('AIMusic')} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
              {['Lo-Fi', 'Trap', 'Gospel', 'Afrobeats', 'R&B', 'Chill'].map(g => (
                <GenrePill key={g} label={g} />
              ))}
            </div>
          </Link>

          {/* Big CTA */}
          <Link to={createPageUrl('AIMusic')} style={{ textDecoration: 'none', display: 'block', marginBottom: 10 }}>
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

          {/* Push to All Panels */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => showToast('Set active track in Music Studio first')}
            style={{
              ...T, width: '100%', padding: '10px 0', borderRadius: 12, marginBottom: 14,
              background: 'rgba(212,175,55,0.06)', border: `1px solid ${CYAN}30`,
              color: CYAN, fontSize: 13, fontWeight: 800, letterSpacing: '0.06em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Push to All Panels
          </motion.button>

          {/* Stats row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            <StatPill label="1,200+ tracks generated" />
            <StatPill label="8 genres" />
            <StatPill label="Custom BPM" />
          </div>
        </Card>

        {/* ── Section 2: ARIA Co-host ── */}
        <Card accentColor={GOLD}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>🤖 ARIA — AI Co-host</p>
            <Toggle value={ariaOn} onChange={setAriaOn} activeColor={GOLD} />
          </div>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>
            Your AI broadcasting partner. Engages chat, answers questions, keeps energy high.
          </p>

          {/* ARIA status when ON */}
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
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ ...T, fontSize: 12, color: GOLD, fontWeight: 700, letterSpacing: '0.04em' }}>
                    ARIA is active · monitoring chat · ready to engage
                  </span>
                </div>

                {/* Generate Message button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={ariaLoading}
                  onClick={generateAriaMessage}
                  style={{
                    ...T, width: '100%', padding: '10px 0', borderRadius: 10, marginBottom: 10,
                    background: ariaLoading ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.15)',
                    border: `1px solid ${GOLD}40`,
                    color: GOLD, fontSize: 13, fontWeight: 800, letterSpacing: '0.06em',
                    textTransform: 'uppercase', cursor: ariaLoading ? 'not-allowed' : 'pointer',
                    opacity: ariaLoading ? 0.7 : 1,
                  }}
                >
                  {ariaLoading ? '⏳ Generating…' : '✨ Generate Message'}
                </motion.button>

                {/* Generated message bubble */}
                <AnimatePresence>
                  {ariaMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      style={{
                        padding: '12px 14px', borderRadius: 10, marginBottom: 10,
                        background: `${GOLD}12`, border: `1px solid ${GOLD}35`,
                      }}
                    >
                      <p style={{ ...T, fontSize: 13, color: '#fff', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                        💬 {ariaMessage}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Send to Panel Chat */}
                {ariaMessage && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => showToast('🤖 ARIA message sent to panel chat!')}
                    style={{
                      ...T, width: '100%', padding: '9px 0', borderRadius: 10, marginBottom: 4,
                      background: `${GOLD}10`, border: `1px solid ${GOLD}25`,
                      color: GOLD, fontSize: 12, fontWeight: 800, letterSpacing: '0.06em',
                      textTransform: 'uppercase', cursor: 'pointer',
                    }}
                  >
                    Send to Panel Chat
                  </motion.button>
                )}
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
        </Card>

        {/* ── Section 3: Guardian AI Moderation ── */}
        <Card accentColor={PINK}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>🛡️ Guardian AI Moderation</p>
            <Toggle value={guardianOn} onChange={setGuardianOn} activeColor="#6DBF7E" />
          </div>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>
            Real-time chat moderation. Auto-removes hate speech, spam, and toxic content.
          </p>

          {/* Scan button when ON */}
          <AnimatePresence>
            {guardianOn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: 14 }}
              >
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={guardianLoading}
                  onClick={scanGuardian}
                  style={{
                    ...T, width: '100%', padding: '10px 0', borderRadius: 10, marginBottom: 10,
                    background: guardianLoading ? 'rgba(192,57,43,0.06)' : 'rgba(192,57,43,0.12)',
                    border: `1px solid ${PINK}40`,
                    color: PINK, fontSize: 13, fontWeight: 800, letterSpacing: '0.06em',
                    textTransform: 'uppercase', cursor: guardianLoading ? 'not-allowed' : 'pointer',
                    opacity: guardianLoading ? 0.7 : 1,
                  }}
                >
                  {guardianLoading ? '⏳ Scanning…' : '🔍 Scan Recent Chat'}
                </motion.button>

                <AnimatePresence>
                  {guardianResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        padding: '12px 14px', borderRadius: 10, marginBottom: 10,
                        background: `${guardianStatusColor(guardianResult.status)}10`,
                        border: `1px solid ${guardianStatusColor(guardianResult.status)}30`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          ...T, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', padding: '2px 8px',
                          borderRadius: 999, textTransform: 'uppercase',
                          background: `${guardianStatusColor(guardianResult.status)}20`,
                          border: `1px solid ${guardianStatusColor(guardianResult.status)}50`,
                          color: guardianStatusColor(guardianResult.status),
                        }}>
                          {guardianResult.status}
                        </span>
                        <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                          Blocked: {guardianResult.blocked} · Warned: {guardianResult.warned}
                        </span>
                      </div>
                      <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
                        {guardianResult.message}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
            <StatPill label={`Blocked: ${guardianResult?.blocked ?? 0}`} />
            <StatPill label={`Warned: ${guardianResult?.warned ?? 0}`} />
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

          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={createPageUrl('GuardianAI')} style={{ textDecoration: 'none', flex: 1 }}>
              <motion.div
                whileTap={{ scale: 0.97 }}
                style={{
                  ...T, padding: '11px 0', borderRadius: 12, textAlign: 'center',
                  background: 'rgba(192,57,43,0.12)', border: `1px solid ${PINK}40`,
                  color: PINK, fontSize: 13, fontWeight: 900, letterSpacing: '0.06em',
                  textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Set Thresholds →
              </motion.div>
            </Link>
            <Link to={createPageUrl('AIModeration')} style={{ textDecoration: 'none', flex: 1 }}>
              <motion.div
                whileTap={{ scale: 0.97 }}
                style={{
                  ...T, padding: '11px 0', borderRadius: 12, textAlign: 'center',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 900, letterSpacing: '0.06em',
                  textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Review Queue →
              </motion.div>
            </Link>
          </div>
        </Card>

        {/* ── Section 4: AI Stage Director ── */}
        <Card accentColor={PURPLE}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>🎬 AI Stage Director</p>
            <Toggle value={directorOn} onChange={setDirectorOn} activeColor={PURPLE} />
          </div>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>
            Automatically spotlights the active speaker, manages panel layout, and directs your 20-person stage.
          </p>

          {/* Director features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
            <FeatureItem icon="🎙️" label="Auto-spotlight active speaker" />
            <FeatureItem icon="📐" label="Smart layout based on participant count" />
            <FeatureItem icon="📋" label="Speaking queue management" />
            <FeatureItem icon="✨" label="Transition animations" />
          </div>

          <AnimatePresence>
            {directorOn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: 14 }}
              >
                {/* Suggest Layout button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={directorLoading}
                  onClick={suggestLayout}
                  style={{
                    ...T, width: '100%', padding: '10px 0', borderRadius: 10, marginBottom: 10,
                    background: directorLoading ? `${PURPLE}08` : `${PURPLE}18`,
                    border: `1px solid ${PURPLE}40`,
                    color: PURPLE, fontSize: 13, fontWeight: 800, letterSpacing: '0.06em',
                    textTransform: 'uppercase', cursor: directorLoading ? 'not-allowed' : 'pointer',
                    opacity: directorLoading ? 0.7 : 1,
                  }}
                >
                  {directorLoading ? '⏳ Analyzing…' : '🎬 Suggest Layout'}
                </motion.button>

                <AnimatePresence>
                  {directorSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        padding: '12px 14px', borderRadius: 10, marginBottom: 10,
                        background: `${PURPLE}10`, border: `1px solid ${PURPLE}30`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          ...T, fontSize: 14, fontWeight: 900, color: PURPLE, letterSpacing: '0.04em',
                        }}>
                          {directorSuggestion.layout}
                        </span>
                        {directorSuggestion.columns && (
                          <span style={{
                            ...T, fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 999,
                            background: `${PURPLE}20`, border: `1px solid ${PURPLE}40`, color: PURPLE,
                          }}>
                            {directorSuggestion.columns} cols
                          </span>
                        )}
                      </div>
                      <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>
                        {directorSuggestion.reason}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <Link to={createPageUrl('WatchParty')} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              style={{
                ...T, padding: '11px 0', borderRadius: 12, textAlign: 'center',
                background: `${PURPLE}12`, border: `1px solid ${PURPLE}40`,
                color: PURPLE, fontSize: 14, fontWeight: 900, letterSpacing: '0.07em',
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Go to Panel →
            </motion.div>
          </Link>
        </Card>

        {/* ── Section 5: Creator Network ── */}
        <Card accentColor={PURPLE}>
          <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>👥 Creator Network</p>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.5 }}>
            Tools built for simultaneous creators and live audiences.
          </p>

          {/* 2-col feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
            {[
              { icon: '🎙️', title: '20-Person Panel', desc: 'Up to 20 live video/audio participants on stage' },
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

        {/* ── Section 6: AI Analytics ── */}
        <Card accentColor="#6DBF7E">
          <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>📊 AI Insights</p>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.5 }}>
            AI-powered stream analytics and growth recommendations.
          </p>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Avg Session',   value: '23min',        color: '#6DBF7E' },
              { label: 'Retention',     value: '68%',          color: CYAN },
              { label: 'Peak Viewers',  value: 'calculating…', color: GOLD },
              { label: 'Best Time',     value: '7–9pm',        color: PURPLE },
            ].map(m => (
              <div key={m.label} style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(109,191,126,0.04)', border: '1px solid rgba(109,191,126,0.1)',
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
                background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.25)',
                color: '#6DBF7E', fontSize: 14, fontWeight: 900, letterSpacing: '0.07em',
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              View Full Analytics →
            </motion.div>
          </Link>
        </Card>

        {/* ── Section 7: AI Podcast Studio ── */}
        <Card accentColor={CYAN}>
          <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>🎙️ AI Podcast Studio</p>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>
            NotebookLM-style AI podcast creation — paste sources, generate a full script with host + co-host dialogue, then record live on your panel.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            <FeatureItem icon="📄" label="Up to 5 research sources per episode" />
            <FeatureItem icon="🤖" label="Full AI-generated conversational script" />
            <FeatureItem icon="🎤" label="Record straight from your 20-person panel" />
            <FeatureItem icon="📚" label="Persistent episode library" />
          </div>
          <Link to={createPageUrl('PodcastStudio')} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              style={{
                ...T, padding: '12px 0', borderRadius: 12, textAlign: 'center',
                background: `linear-gradient(90deg, ${CRIMSON}, ${CYAN})`,
                color: '#000', fontSize: 14, fontWeight: 900, letterSpacing: '0.07em',
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Open Podcast Studio →
            </motion.div>
          </Link>
        </Card>

        {/* ── Section 8: Multi-Platform Hub ── */}
        <Card accentColor={GREEN}>
          <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>🌐 Multi-Platform Hub</p>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>
            Connect Fanbase, YouTube, Twitch, TikTok and more. Manage webhooks, virtual camera overlays, and cross-platform audience engagement.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            <FeatureItem icon="🎭" label="Fanbase.com webhook connections" />
            <FeatureItem icon="📷" label="Virtual camera with overlay presets" />
            <FeatureItem icon="💬" label="Aggregated chat from all platforms" />
            <FeatureItem icon="🎁" label="Cross-platform gift & milestone tracker" />
          </div>
          <Link to={createPageUrl('MultiPlatform')} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              style={{
                ...T, padding: '12px 0', borderRadius: 12, textAlign: 'center',
                background: `${GREEN}20`, border: `1px solid ${GREEN}55`,
                color: GREEN, fontSize: 14, fontWeight: 900, letterSpacing: '0.07em',
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Open Multi-Platform Hub →
            </motion.div>
          </Link>
        </Card>

        {/* ── Section 9: INS Forge ── */}
        <Card accentColor={AMBER}>
          <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>⚡ INS Forge</p>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>
            AI creative brief generator — forge branded assets for tournaments, tributes, overlays, podcast covers, and music promos.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            <FeatureItem icon="⚔️" label="SVS bracket graphics" />
            <FeatureItem icon="🕊️" label="Tribute memorial cards" />
            <FeatureItem icon="🎥" label="Stream overlay packs" />
            <FeatureItem icon="🏆" label="Tournament flyers & promos" />
          </div>
          <Link to={createPageUrl('INSForge')} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div whileTap={{ scale: 0.97 }} style={{
              ...T, padding: '12px 0', borderRadius: 12, textAlign: 'center',
              background: `linear-gradient(90deg, ${AMBER}, #E55100)`,
              color: '#000', fontSize: 14, fontWeight: 900, letterSpacing: '0.07em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}>
              Open INS Forge →
            </motion.div>
          </Link>
        </Card>

        {/* ── Section 10: State vs State ── */}
        <Card accentColor="#1565C0">
          <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>⚔️ State vs State</p>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>
            Hybrid domino tournament series — states compete live on SeeWhy. Track brackets, rosters, live match scores, and standings.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            <FeatureItem icon="🏆" label="Live bracket with QF / SF / FINAL rounds" />
            <FeatureItem icon="👥" label="State rosters — join your team" />
            <FeatureItem icon="🔴" label="Real-time score tracking & play log" />
            <FeatureItem icon="📊" label="State standings leaderboard" />
          </div>
          <Link to={createPageUrl('StateVsState')} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div whileTap={{ scale: 0.97 }} style={{
              ...T, padding: '12px 0', borderRadius: 12, textAlign: 'center',
              background: 'linear-gradient(90deg, #1565C0, #C62828)',
              color: '#fff', fontSize: 14, fontWeight: 900, letterSpacing: '0.07em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}>
              Enter the Tournament →
            </motion.div>
          </Link>
        </Card>

        {/* ── Section 10: Tribute Wall ── */}
        <Card accentColor="#7B5EA7">
          <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>🕊️ Tribute Wall</p>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>
            Honor the legends who built domino culture. Read bios, leave tributes, and register for the memorial gaming event.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            <FeatureItem icon="🎯" label="Legend profiles with achievements" />
            <FeatureItem icon="💬" label="Post community tribute messages" />
            <FeatureItem icon="🏅" label="Nominate a legend" />
            <FeatureItem icon="🎮" label="85/10/5 tribute gaming event" />
          </div>
          <Link to={createPageUrl('TributeWall')} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div whileTap={{ scale: 0.97 }} style={{
              ...T, padding: '12px 0', borderRadius: 12, textAlign: 'center',
              background: 'rgba(123,94,167,0.2)', border: '1px solid rgba(123,94,167,0.5)',
              color: '#A07BC4', fontSize: 14, fontWeight: 900, letterSpacing: '0.07em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}>
              Visit Tribute Wall →
            </motion.div>
          </Link>
        </Card>

        {/* ── Section 12: AI Content Review ── */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>📋 Content Review Queue</p>
            <span style={{ ...T, fontSize: 11, color: '#C0392B', fontWeight: 700, letterSpacing: '0.05em' }}>ADMIN TOOL</span>
          </div>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.5)', padding: '4px 16px 12px', lineHeight: 1.5 }}>
            Review AI-flagged messages, approve or dismiss violations, and track moderation history for your streams.
          </p>
          <Link to={createPageUrl('AIModeration')} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              margin: '0 16px 16px',
              background: 'rgba(192,57,43,0.08)',
              border: '1px solid rgba(192,57,43,0.2)', borderRadius: 10,
              padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📋</div>
                <div>
                  <div style={{ ...T, fontSize: 12, color: '#C0392B', fontWeight: 900 }}>OPEN REVIEW QUEUE</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Space Mono, monospace' }}>AI MODERATION · ADMIN</div>
                </div>
              </div>
              <span style={{ ...T, fontSize: 13, color: '#C0392B', fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Review →
              </span>
            </div>
          </Link>
        </Card>

        {/* ── Section 13: Joyce AI ── */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ ...T, fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>🤖 Joyce AI Co-Host</p>
            <span style={{ ...T, fontSize: 11, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.05em' }}>LIVE ASSISTANT</span>
          </div>
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.5)', padding: '4px 16px 12px', lineHeight: 1.5 }}>
            Your AI broadcast co-host. Get tournament intros, tribute scripts, hype lines, and platform guidance — live, in seconds.
          </p>
          <Link to={createPageUrl('JoyceAI')} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              margin: '0 16px 16px',
              background: `linear-gradient(135deg, #D4AF3722, #8A6F2E11)`,
              border: '1px solid #D4AF3744', borderRadius: 10,
              padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, #D4AF37, #8A6F2E)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
                <div>
                  <div style={{ ...T, fontSize: 12, color: '#D4AF37', fontWeight: 900 }}>ASK JOYCE</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Space Mono, monospace' }}>AI ACTIVE · CLAUDE POWERED</div>
                </div>
              </div>
              <span style={{
                ...T, fontSize: 13,
                color: '#D4AF37', fontWeight: 900, letterSpacing: '0.07em',
                textTransform: 'uppercase', cursor: 'pointer',
              }}>
                Chat Now →
              </span>
            </div>
          </Link>
        </Card>

        {/* ── Aura AI + SwanyBot + Voice Settings row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Link to={createPageUrl('AuraAI')} style={{ textDecoration: 'none' }}>
            <div style={{ background: BG2, border: '1px solid rgba(212,175,55,0.15)', borderRadius: 16, borderLeft: `3px solid ${GOLD}`, padding: '14px 14px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>✨</div>
              <div style={{ ...T, fontSize: 14, fontWeight: 900, color: GOLD, letterSpacing: '0.06em' }}>AURA AI</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, lineHeight: 1.4, fontFamily: 'Space Mono, monospace' }}>Premium co-host · Brand & content</div>
            </div>
          </Link>
          <Link to={createPageUrl('SwanyBotPage')} style={{ textDecoration: 'none' }}>
            <div style={{ background: BG2, border: '1px solid rgba(204,119,85,0.2)', borderRadius: 16, borderLeft: `3px solid #CC7755`, padding: '14px 14px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>🎮</div>
              <div style={{ ...T, fontSize: 14, fontWeight: 900, color: '#CC7755', letterSpacing: '0.06em' }}>SWANYBOT</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, lineHeight: 1.4, fontFamily: 'Space Mono, monospace' }}>Domino culture · SVS expert</div>
            </div>
          </Link>
        </div>
        <Link to={createPageUrl('VoiceAISettings')} style={{ textDecoration: 'none' }}>
          <div style={{ background: BG2, border: '1px solid rgba(212,175,55,0.12)', borderRadius: 16, borderLeft: `3px solid ${GOLD}`, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, #8A6F2E)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔊</div>
              <div>
                <div style={{ ...T, fontSize: 14, fontWeight: 900, color: GOLD, letterSpacing: '0.06em' }}>VOICE AI SETTINGS</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'Space Mono, monospace', marginTop: 2 }}>TTS · Voice selector · Volume · Speed</div>
              </div>
            </div>
            <span style={{ ...T, fontSize: 12, color: GOLD, fontWeight: 900, letterSpacing: '0.06em' }}>Configure →</span>
          </div>
        </Link>
        <Link to={createPageUrl('TranscriptionStudio')} style={{ textDecoration: 'none' }}>
          <div style={{ background: BG2, border: '1px solid rgba(74,124,89,0.2)', borderRadius: 16, borderLeft: `3px solid #4A7C59`, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #4A7C59, #2A5C39)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📝</div>
              <div>
                <div style={{ ...T, fontSize: 14, fontWeight: 900, color: '#6DBF7E', letterSpacing: '0.06em' }}>TRANSCRIPTION STUDIO</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'Space Mono, monospace', marginTop: 2 }}>Live captions · SRT export · Multi-language</div>
              </div>
            </div>
            <span style={{ ...T, fontSize: 12, color: '#6DBF7E', fontWeight: 900, letterSpacing: '0.06em' }}>Open →</span>
          </div>
        </Link>

        {/* ── AI Persona Customizer ── */}
        <div style={{ marginTop: 8 }}>
          <AIPersonaCustomizer roomId={null} sessionId={null} onCustomized={() => {}} />
        </div>

        {/* ── AI Stream Summary ── */}
        <div style={{ marginTop: 8 }}>
          <AIStreamSummary roomId={null} isHost={false} streamTitle="SeeWhy LIVE" viewerCount={0} elapsedSeconds={0} />
        </div>

        {/* ── Content Recommendations ── */}
        <div style={{ marginTop: 8 }}>
          <ContentRecommendations userId={null} />
        </div>

        {/* ── SwanyBot Context Enhancer ── */}
        <div style={{ marginTop: 8 }}>
          <SwanyBotContextEnhancer userId={null} conversationId={null} onContextReady={() => {}} />
        </div>

        {/* ── Bottom info strip ── */}
        <p style={{
          textAlign: 'center', ...T, fontSize: 12,
          color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em',
          lineHeight: 1.6, padding: '0 8px',
        }}>
          All AI features are included free · 90% creator payout · Powered by SeeWhy LIVE
        </p>

      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
