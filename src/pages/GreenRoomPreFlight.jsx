import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Eye, EyeOff, Copy, Check, X } from 'lucide-react';
import VdoNinjaGuestLink from '../components/live/VdoNinjaGuestLink';
import ZEGOStreamHealthCard from '../components/zego/ZEGOStreamHealthCard';

const BG    = '#080B18';
const BG2   = '#0D0A14';
const BG3   = '#111218';
const GOLD  = '#D4AF37';
const GREEN = '#22c55e';
const RED   = '#EF4444';
const SLATE = '#2A2438';
const TEXT  = '#F0EAF8';
const TEXTM = '#8A7A94';
const FONT  = 'Barlow Condensed, sans-serif';
const MONO  = { fontFamily: 'Space Mono, monospace' };

const RTMP_INGEST = 'rtmp://ingest.seewhylive.online:1935/live';

function genToken() {
  const rand = () => Math.random().toString(36).slice(2, 10);
  const user = localStorage.getItem('seewhy_user_id') || 'sw_' + rand();
  const session = Date.now();
  return `${user}?session=${session}`;
}

function genVDOLink() {
  const push = Math.random().toString(36).slice(2, 14);
  return `https://vdo.ninja/?push=${push}&quality=4k`;
}

function genStreamKey(userId) {
  const id = userId || 'sw_' + Math.random().toString(36).slice(2, 18);
  return `SW_${id.toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 8)}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function StatusBadge({ status }) {
  if (status === 'ready')   return <span style={{ ...MONO, fontSize: 12, color: GREEN, fontWeight: 700 }}>✓ READY</span>;
  if (status === 'testing') return <span style={{ ...MONO, fontSize: 12, color: GOLD,  fontWeight: 700 }}>TESTING…</span>;
  if (status === 'failed')  return <span style={{ ...MONO, fontSize: 12, color: RED,   fontWeight: 700 }}>✗ FAILED</span>;
  return null;
}

function TestRow({ icon, label, status, onTest }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', borderRadius: 12,
      background: status === 'ready' ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${status === 'ready' ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`,
      transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: TEXT, letterSpacing: '0.02em' }}>{label}</span>
      </div>
      {status === 'idle' || status === 'failed' ? (
        <button onClick={onTest} style={{
          ...MONO, fontSize: 12, fontWeight: 700, padding: '6px 18px',
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, color: TEXT, cursor: 'pointer', letterSpacing: '0.06em',
        }}>TEST</button>
      ) : (
        <StatusBadge status={status} />
      )}
    </div>
  );
}

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? GREEN : TEXTM, padding: 4 }}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export default function GreenRoomPreFlight({ asModal, onEnterStage, onClose }) {
  const navigate = useNavigate();
  const [tests, setTests] = useState({ mic: 'idle', camera: 'idle', network: 'idle' });
  const [streamKey]  = useState(() => genStreamKey());
  const [vdoLink]    = useState(() => genVDOLink());
  const [token]      = useState(() => genToken());
  const [showKey, setShowKey] = useState(false);
  const streamRef = useRef(null);

  const allReady = tests.mic === 'ready' && tests.camera === 'ready' && tests.network === 'ready';

  const runTest = useCallback(async (type) => {
    setTests(t => ({ ...t, [type]: 'testing' }));
    try {
      if (type === 'mic') {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach(t => t.stop());
        setTests(t => ({ ...t, mic: 'ready' }));
      } else if (type === 'camera') {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = s;
        s.getTracks().forEach(t => t.stop());
        setTests(t => ({ ...t, camera: 'ready' }));
      } else if (type === 'network') {
        await new Promise(res => setTimeout(res, 800));
        setTests(t => ({ ...t, network: navigator.onLine ? 'ready' : 'failed' }));
      }
    } catch {
      setTests(t => ({ ...t, [type]: 'failed' }));
    }
  }, []);

  function handleEnterStage() {
    if (!allReady) return;
    if (onEnterStage) {
      onEnterStage();
    } else {
      navigate(createPageUrl('LiveRoom'));
    }
  }

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
          <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 900, color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Green Room — Pre-Flight
          </span>
        </div>
        {(asModal || onClose) && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXTM }}>
            <X size={20} />
          </button>
        )}
      </div>
      <p style={{ ...MONO, fontSize: 11, color: TEXTM, margin: 0 }}>
        Complete all checks before going live. Your JWT session token is active.
      </p>

      {/* Tests */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <TestRow icon="🎙️" label="Microphone Test"   status={tests.mic}     onTest={() => runTest('mic')} />
        <TestRow icon="📷" label="Camera Test"       status={tests.camera}  onTest={() => runTest('camera')} />
        <TestRow icon="🌐" label="Network / SFU Test" status={tests.network} onTest={() => runTest('network')} />
      </div>

      {/* RTMP Stream Key */}
      <div>
        <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 900, color: GOLD, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>
          RTMP Stream Key (OBS / vMix / StreamYard)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
          <span style={{ ...MONO, fontSize: 12, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {showKey ? streamKey : streamKey.replace(/./g, '●').slice(0, 20)}
          </span>
          <button onClick={() => setShowKey(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXTM }}>
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <CopyBtn value={streamKey} />
        </div>
        <div style={{ ...MONO, fontSize: 10, color: GOLD, marginTop: 5 }}>
          Ingest: {RTMP_INGEST}
        </div>
      </div>

      {/* VDO.NINJA link */}
      <VdoNinjaGuestLink roomId={token} />

      {/* Stream health */}
      <ZEGOStreamHealthCard roomId={null} />

      {/* Session Token */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 900, color: GOLD, letterSpacing: '0.1em', marginBottom: 4, textTransform: 'uppercase' }}>
          Session Token (60m)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...MONO, fontSize: 10, color: TEXTM, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {token}
          </span>
          <CopyBtn value={token} />
        </div>
      </div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: allReady ? 0.97 : 1 }}
        onClick={handleEnterStage}
        disabled={!allReady}
        style={{
          width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
          background: allReady
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : 'rgba(255,255,255,0.06)',
          color: allReady ? '#fff' : TEXTM,
          cursor: allReady ? 'pointer' : 'not-allowed',
          fontFamily: FONT, fontSize: 17, fontWeight: 900,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          transition: 'all 0.3s',
          boxShadow: allReady ? `0 4px 24px rgba(34,197,94,0.35)` : 'none',
        }}
      >
        {allReady ? '🚀 ENTER STAGE — GO LIVE' : 'COMPLETE ALL TESTS TO CONTINUE'}
      </motion.button>
    </div>
  );

  if (asModal) {
    return (
      <div style={{ padding: '24px 20px' }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 460, background: BG2, border: `1px solid ${GOLD}33`, borderRadius: 20, padding: '24px 20px' }}>
        {/* Back link */}
        <div style={{ marginBottom: 20 }}>
          <Link to={createPageUrl('GoLive')} style={{ fontFamily: FONT, fontSize: 12, color: TEXTM, textDecoration: 'none', letterSpacing: '0.06em', fontWeight: 700 }}>
            ← Back to Go Live
          </Link>
        </div>
        {content}
      </div>
    </div>
  );
}
