import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import AlertConfig from '../components/live/AlertConfig';
import AnnouncementFeed from '../components/community/AnnouncementFeed';
import ZEGOSettingsDrawer from '../components/live/ZEGOSettingsDrawer';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import AIStreamSummary from '../components/live/AIStreamSummary';
import AuraEmotionDisplay from '../components/live/AuraEmotionDisplay';
import ContentRecommendations from '../components/social/ContentRecommendations';
import AIPersonaCustomizer from '../components/live/AIPersonaCustomizer';

const BG    = '#080B18';
const BG2   = '#0D0A08';
const BG3   = '#13100A';
const GOLD  = '#D4AF37';
const GOLDD = '#8A6F2E';
const SLATE = '#2A2010';
const TEXT  = '#F0E8D4';
const TEXTD = '#C4B596';
const TEXTM = '#8A7A62';
const GREEN = '#6DBF7E';
const PILL  = 999;
const T     = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO  = { fontFamily: 'Space Mono, monospace' };

const LS_KEY = 'seewhy_voice_settings';
const DEFAULTS = { enabled: true, autoSpeak: true, voice: 'nova', volume: 0.8, speed: 1.0 };

const VOICES = [
  { id: 'nova',    label: 'Nova',    desc: 'Warm & clear — default' },
  { id: 'alloy',   label: 'Alloy',   desc: 'Neutral & balanced' },
  { id: 'echo',    label: 'Echo',    desc: 'Deep & resonant' },
  { id: 'shimmer', label: 'Shimmer', desc: 'Bright & expressive' },
  { id: 'fable',   label: 'Fable',   desc: 'Storyteller tone' },
  { id: 'onyx',    label: 'Onyx',    desc: 'Authoritative' },
];

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(LS_KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
      background: value ? GOLD : 'rgba(255,255,255,0.12)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <motion.div
        animate={{ x: value ? 23 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: 10, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
      />
    </button>
  );
}

export default function VoiceAISettings() {
  const [vs, setVs] = useState(load);
  const [saved, setSaved] = useState(false);

  const update = useCallback((key, val) => {
    setVs(prev => {
      const next = { ...prev, [key]: val };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  function testVoice() {
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: "SeeWhy LIVE — Voice AI ready. Let's go!", voice: vs.voice, speed: vs.speed }),
    }).then(r => r.blob()).then(b => {
      const a = new Audio(URL.createObjectURL(b));
      a.volume = vs.volume;
      a.play();
    }).catch(() => {});
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: BG2, borderBottom: `1px solid ${SLATE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/AIHub" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, ...T, fontWeight: 700, letterSpacing: '0.06em' }}>← AI Hub</a>
            <Link to={createPageUrl('BroadcastStudio')} style={{ textDecoration: 'none', color: 'rgba(212,175,55,0.5)', fontSize: 11, ...T, fontWeight: 700, letterSpacing: '0.06em' }}>Studio →</Link>
            <Link to={createPageUrl('Settings')} style={{ textDecoration: 'none', color: 'rgba(212,175,55,0.35)', fontSize: 11, ...T, fontWeight: 700, letterSpacing: '0.06em' }}>Settings →</Link>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLDD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔊</div>
          <div>
            <div style={{ ...T, fontSize: 20, fontWeight: 900, color: TEXT, letterSpacing: '0.06em', lineHeight: 1 }}>VOICE AI</div>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>SETTINGS · ALL AI PERSONAS</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saved && (
            <span style={{ ...MONO, fontSize: 9, color: GREEN, letterSpacing: '0.08em' }}>✓ SAVED</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: PILL, background: vs.enabled ? 'rgba(109,191,126,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${vs.enabled ? 'rgba(109,191,126,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: vs.enabled ? GREEN : TEXTM }} />
            <span style={{ ...MONO, fontSize: 9, color: vs.enabled ? GREEN : TEXTM, fontWeight: 700 }}>{vs.enabled ? 'VOICE ON' : 'VOICE OFF'}</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480, width: '100%', margin: '0 auto' }}>

        {/* Enable / Auto-Speak toggles */}
        <div style={{ background: BG3, borderRadius: 16, border: `1px solid ${SLATE}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.12em', marginBottom: -4 }}>CONTROLS</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ ...T, fontSize: 15, fontWeight: 700, color: TEXT }}>Voice AI Enabled</div>
              <div style={{ ...MONO, fontSize: 10, color: TEXTM, marginTop: 2 }}>All AI personas speak out loud</div>
            </div>
            <Toggle value={vs.enabled} onChange={v => update('enabled', v)} />
          </div>
          <div style={{ height: 1, background: `rgba(255,255,255,0.05)` }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ ...T, fontSize: 15, fontWeight: 700, color: TEXT }}>Auto-Speak Replies</div>
              <div style={{ ...MONO, fontSize: 10, color: TEXTM, marginTop: 2 }}>Speak every AI response automatically</div>
            </div>
            <Toggle value={vs.autoSpeak} onChange={v => update('autoSpeak', v)} />
          </div>
        </div>

        {/* Voice selection */}
        <div style={{ background: BG3, borderRadius: 16, border: `1px solid ${SLATE}`, padding: '16px 18px' }}>
          <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.12em', marginBottom: 12 }}>SELECT VOICE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {VOICES.map(v => (
              <motion.button
                key={v.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => update('voice', v.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  borderRadius: 12, border: `1px solid ${vs.voice === v.id ? GOLD + '88' : 'rgba(255,255,255,0.07)'}`,
                  background: vs.voice === v.id ? `rgba(212,175,55,0.1)` : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ width: 16, height: 16, borderRadius: 8, border: `2px solid ${vs.voice === v.id ? GOLD : TEXTM}`, background: vs.voice === v.id ? GOLD : 'transparent', flexShrink: 0 }} />
                <div>
                  <div style={{ ...T, fontSize: 14, fontWeight: 900, color: vs.voice === v.id ? GOLD : TEXT, letterSpacing: '0.04em' }}>{v.label}</div>
                  <div style={{ ...MONO, fontSize: 10, color: TEXTM, marginTop: 1 }}>{v.desc}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Volume & Speed */}
        <div style={{ background: BG3, borderRadius: 16, border: `1px solid ${SLATE}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.12em', marginBottom: -6 }}>VOLUME & SPEED</div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ ...T, fontSize: 14, fontWeight: 700, color: TEXT }}>Volume</span>
              <span style={{ ...MONO, fontSize: 12, color: GOLD }}>{Math.round(vs.volume * 100)}%</span>
            </div>
            <input
              type="range" min={0} max={1} step={0.05} value={vs.volume}
              onChange={e => update('volume', parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: GOLD }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ ...T, fontSize: 14, fontWeight: 700, color: TEXT }}>Speed</span>
              <span style={{ ...MONO, fontSize: 12, color: GOLD }}>{vs.speed.toFixed(1)}x</span>
            </div>
            <input
              type="range" min={0.5} max={2.0} step={0.1} value={vs.speed}
              onChange={e => update('speed', parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: GOLD }}
            />
          </div>
        </div>

        {/* Test Voice button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={testVoice}
          disabled={!vs.enabled}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
            background: vs.enabled ? `linear-gradient(135deg, ${GOLD}, ${GOLDD})` : SLATE,
            color: vs.enabled ? BG : TEXTM, cursor: vs.enabled ? 'pointer' : 'not-allowed',
            ...T, fontSize: 15, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}
        >
          🔊 Test Voice
        </motion.button>

        {/* Alert + feed integration */}
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AlertConfig creatorId={null} />
          <AnnouncementFeed communityId={null} />
        </div>

        {/* Cross-links */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 16 }}>
          {[
            { to: createPageUrl('JoyceAI'),  label: '🤖 Joyce AI',  color: 'rgba(212,175,55,0.12)', border: 'rgba(212,175,55,0.25)', text: GOLD },
            { to: createPageUrl('AuraAI'),   label: '✨ Aura AI',   color: 'rgba(212,175,55,0.08)', border: 'rgba(212,175,55,0.2)',  text: GOLD },
            { to: createPageUrl('SwanyBotPage'), label: '🎮 SwanyBot', color: 'rgba(204,119,85,0.1)', border: 'rgba(204,119,85,0.25)', text: '#CC7755' },
          ].map(item => (
            <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
              <button style={{ ...T, padding: '7px 16px', borderRadius: PILL, border: `1px solid ${item.border}`, background: item.color, color: item.text, cursor: 'pointer', fontSize: 12, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {item.label}
              </button>
            </Link>
          ))}
        </div>

        <div style={{ ...MONO, fontSize: 9, color: TEXTM, textAlign: 'center', paddingBottom: 24 }}>
          Voice settings apply to Joyce AI · Aura AI · SwanyBot · Guardian AI
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20 }}>
          <ZEGOSettingsDrawer isOpen={false} onClose={() => {}} roomId={null} />
          <BackgroundCustomizer onBackgroundChange={() => {}} />
          <AIPersonaCustomizer roomId={null} sessionId={null} onCustomized={() => {}} />
          <AIStreamSummary roomId={null} isHost={false} streamTitle="" viewerCount={0} elapsedSeconds={0} />
          <AuraEmotionDisplay roomId={null} sessionId={null} />
          <ContentRecommendations />
        </div>
      </div>
    </div>
  );
}
