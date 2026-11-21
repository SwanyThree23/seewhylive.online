import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Eye, EyeOff, Copy, Check, X } from 'lucide-react';
import VdoNinjaGuestLink from '../components/live/VdoNinjaGuestLink';
import ZEGOStreamHealthCard from '../components/zego/ZEGOStreamHealthCard';
import GuestQueue from '../components/live/GuestQueue';
import LocalVideoTile from '../components/live/LocalVideoTile';
import OctagonalVideoWindow from '../components/live/OctagonalVideoWindow';
import WebRTCSetupBanner from '../components/live/WebRTCSetupBanner';
import DevicePreview from '../components/greenroom/DevicePreview';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import StreamGoals from '../components/live/StreamGoals';
import PreStreamCountdown from '../components/live/PreStreamCountdown';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

var BG    = '#080B18';
var BG2   = '#0D0A08';
var BG3   = '#111218';
var GOLD  = '#D4AF37';
var GREEN = '#6DBF7E';
var RED   = '#EF4444';
var SLATE = '#2A2010';
var TEXT  = '#F0E8D4';
var TEXTM = '#8A7A62';
var FONT  = 'Barlow Condensed, sans-serif';
var MONO  = { fontFamily: 'Space Mono, monospace' };

var RTMP_INGEST = 'rtmp://ingest.seewhylive.online:1935/live';

function cryptoRandB36(len) {
  var arr = new Uint8Array(len * 2);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => (b % 36).toString(36)).join('').slice(0, len);
}

function genToken() {
  var rand = () => cryptoRandB36(8);
  var user = localStorage.getItem('seewhy_user_id') || 'sw_' + rand();
  var session = Date.now();
  return `${user}?session=${session}`;
}

function genVDOLink() {
  var push = cryptoRandB36(12);
  return `https://vdo.ninja/?push=${push}&quality=4k`;
}

function genStreamKey(userId) {
  var id = userId || 'sw_' + cryptoRandB36(16);
  return `SW_${id.toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 8)}_${cryptoRandB36(8).toUpperCase()}`;
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
      background: status === 'ready' ? 'rgba(109,191,126,0.07)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${status === 'ready' ? 'rgba(109,191,126,0.25)' : 'rgba(255,255,255,0.07)'}`,
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
  var [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? GREEN : TEXTM, padding: 4 }}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export default function GreenRoomPreFlight({ asModal, onEnterStage, onClose }) {
  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  var navigate = useNavigate();
  var [tests, setTests] = useState({ mic: 'idle', camera: 'idle', network: 'idle' });
  var [streamKey]  = useState(() => genStreamKey());
  var [vdoLink]    = useState(() => genVDOLink());
  var [token, setToken] = useState('');

  useEffect(() => {
    setToken(genToken((user && user.id)));
  }, [(user && user.id)]);
  var activeRoomId = new URLSearchParams(window.location.search).get('room_id');
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);
  var [showKey, setShowKey] = useState(false);
  var [previewMicOn, setPreviewMicOn] = useState(true);
  var [previewVideoOn, setPreviewVideoOn] = useState(true);
  var streamRef = useRef(null);

  var allReady = tests.mic === 'ready' && tests.camera === 'ready' && tests.network === 'ready';

  var runTest = useCallback(async (type) => {
    setTests(t => ({ ...t, [type]: 'testing' }));
    try {
      if (type === 'mic') {
        var s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach(t => t.stop());
        setTests(t => ({ ...t, mic: 'ready' }));
      } else if (type === 'camera') {
        var s = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = s;
        s.getTracks().forEach(t => t.stop());
        setTests(t => ({ ...t, camera: 'ready' }));
      } else if (type === 'network') {
        var controller = new AbortController();
        var timeout = setTimeout(() => controller.abort(), 5000);
        try {
          await fetch('https://www.google.com/generate_204', { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
          setTests(t => ({ ...t, network: 'ready' }));
        } finally {
          clearTimeout(timeout);
        }
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

  var content = (
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
      <ZEGOStreamHealthCard roomId={activeRoomId} />
      <GuestQueue roomId={activeRoomId} isHost={true} />
      <LocalVideoTile stream={streamRef.current} audioEnabled={previewMicOn} videoEnabled={previewVideoOn} userName="You" isHost={true} />
      <OctagonalVideoWindow title="Preview" isMuted={!previewMicOn} isVideoOff={!previewVideoOn} onMicToggle={() => setPreviewMicOn(v => !v)} onVideoToggle={() => setPreviewVideoOn(v => !v)} />
      <WebRTCSetupBanner error={null} audioEnabled={true} videoEnabled={true} onRetry={() => {}} />
      <DevicePreview user={user} onDeviceState={() => {}} />

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
            ? 'linear-gradient(135deg, #6DBF7E, #4A9B5E)'
            : 'rgba(255,255,255,0.06)',
          color: allReady ? '#fff' : TEXTM,
          cursor: allReady ? 'pointer' : 'not-allowed',
          fontFamily: FONT, fontSize: 17, fontWeight: 900,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          transition: 'all 0.3s',
          boxShadow: allReady ? `0 4px 24px rgba(109,191,126,0.35)` : 'none',
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

      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
        <OnlineUsersGrid compact maxVisible={10} />
        <ContentRecommendations />
        <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
        <PreStreamCountdown room={null} currentUser={user} onGoLive={() => {}} />
      </div>
    </div>
  );
}