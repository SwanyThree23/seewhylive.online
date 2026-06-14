import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ChevronLeft, ChevronRight, Radio, Swords, Tv2, Mic2,
  Camera, CameraOff, Mic, MicOff, Copy, Check, Lock, Unlock,
  Tag, Image, AlignLeft, Layers, Sparkles,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import StreamHealthMonitor from '../components/streaming/StreamHealthMonitor';
import DestinationsManager from '../components/streaming/DestinationsManager';
import BitratePresets from '../components/streaming/BitratePresets';
import ZEGOGoLiveFlow from '../components/zego/ZEGOGoLiveFlow';
import ZEGOStreamHealthCard from '../components/zego/ZEGOStreamHealthCard';
import OverlayThemeBuilder from '../components/live/OverlayThemeBuilder';
import PreStreamCountdown from '../components/live/PreStreamCountdown';
import CameraSourcePicker from '../components/streaming/CameraSourcePicker';
import GuestRTMPPanel from '../components/streaming/GuestRTMPPanel';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';
import GuestGrid from '../components/live/GuestGrid';
import GuestControls from '../components/live/GuestControls';
import GuestDestinationsPanel from '../components/live/GuestDestinationsPanel';
import StreamChatbot from '../components/live/StreamChatbot';
import ZEGOSettingsDrawer from '../components/live/ZEGOSettingsDrawer';
import ShareModal from '../components/live/ShareModal';
import WebhookHooks from '../components/live/WebhookHooks';

const BG   = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const GREEN = '#6DBF7E';
const FONT = 'Barlow Condensed, sans-serif';

const FORMATS = [
  {
    id: 'panel',
    icon: <Mic2 style={{ width: 32, height: 32 }} />,
    emoji: '🎙️',
    title: '20-Person Panel',
    subtitle: 'Audio + video stage. Up to 20 speakers.',
    features: ['🎤 Audio', '📹 Video', '👥 20 seats', '💬 Chat', '🎁 Gifts'],
    color: GOLD,
    dest: 'BroadcastStudio',
  },
  {
    id: 'battle',
    icon: <Swords style={{ width: 32, height: 32 }} />,
    emoji: '⚔️',
    title: 'FadesStage Battle',
    subtitle: 'Challenge a creator. Audience votes with gifts.',
    features: ['⚔️ PK Rounds', '🎁 Gifts', '📊 Score', '👑 Winner'],
    color: CRIMSON,
    dest: 'PKBattle',
  },
  {
    id: 'watchparty',
    icon: <Tv2 style={{ width: 32, height: 32 }} />,
    emoji: '📺',
    title: 'Watch Party',
    subtitle: 'Sync a video. React together in real time.',
    features: ['🔗 Sync', '💬 Chat', '🖥️ Screen Share', '4K'],
    color: '#D4854A',
    dest: 'WatchParty',
  },
  {
    id: 'audio',
    icon: <Mic style={{ width: 32, height: 32 }} />,
    emoji: '🎧',
    title: 'Audio Room',
    subtitle: 'Clubhouse-style stage. Speakers + listeners.',
    features: ['🎤 Stage', '✋ Hand Raise', '❤️ Love Tap', '📌 Pin Video'],
    color: '#6DBF7E',
    dest: 'AudioRoom',
  },
];

const CATEGORIES = [
  'Talk Show', 'Music', 'Gaming', 'Education', 'Sports',
  'Comedy', 'News', 'Creative', 'Travel', 'Tech', 'Spiritual', 'Health',
];

function FormatCard({ fmt, onSelect }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(fmt)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '16px 18px',
        borderRadius: 16,
        background: 'rgba(8,11,24,0.9)',
        border: `1px solid rgba(255,255,255,0.08)`,
        borderLeft: `4px solid ${fmt.color}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: `${fmt.color}18`,
        border: `1px solid ${fmt.color}35`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: fmt.color,
        flexShrink: 0,
      }}>
        {fmt.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', fontFamily: FONT, letterSpacing: '0.02em' }}>
          {fmt.title}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: FONT, marginTop: 2 }}>
          {fmt.subtitle}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {fmt.features.map(f => (
            <span key={f} style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: FONT,
              padding: '2px 7px',
              borderRadius: 999,
              background: `${fmt.color}12`,
              border: `1px solid ${fmt.color}28`,
              color: `${fmt.color}CC`,
              letterSpacing: '0.04em',
            }}>{f}</span>
          ))}
        </div>
      </div>
      <ChevronRight style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
    </motion.button>
  );
}

function CameraPreview({ onStreamReady }) {
  const videoRef = useRef(null);
  const [stream,  setStream]  = useState(null);
  const [camOn,   setCamOn]   = useState(false);
  const [micOn,   setMicOn]   = useState(true);
  const [error,   setError]   = useState(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      setCamOn(true);
      if (videoRef.current) videoRef.current.srcObject = s;
      onStreamReady?.(s);
    } catch {
      setError('Camera/mic access denied');
    }
  }, [onStreamReady]);

  useEffect(() => { start(); return () => stream?.getTracks().forEach(t => t.stop()); }, []);

  function toggleMic() {
    stream?.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    setMicOn(v => !v);
  }

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
      {camOn
        ? <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(8,11,24,0.9)' }}>
            <CameraOff style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.2)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>Camera off</span>
          </div>}

      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: FONT, textAlign: 'center', padding: '0 16px' }}>{error}</span>
        </div>
      )}

      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5, alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 999,
          background: camOn ? 'rgba(192,57,43,0.85)' : 'rgba(0,0,0,0.5)',
          fontSize: 11, fontWeight: 900, color: '#fff', fontFamily: FONT,
          letterSpacing: '0.08em',
        }}>
          {camOn && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />}
          {camOn ? 'PREVIEW' : 'NO SIGNAL'}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
        <button onClick={toggleMic} style={{
          width: 32, height: 32, borderRadius: '50%',
          background: micOn ? 'rgba(212,175,55,0.2)' : 'rgba(239,68,68,0.2)',
          border: `1px solid ${micOn ? 'rgba(212,175,55,0.4)' : 'rgba(239,68,68,0.4)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          {micOn
            ? <Mic style={{ width: 14, height: 14, color: GOLD }} />
            : <MicOff style={{ width: 14, height: 14, color: '#EF4444' }} />}
        </button>
      </div>
    </div>
  );
}

function RtmpKeyRow({ streamKey }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(streamKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Stream key copied');
  }

  return (
    <div style={{
      borderRadius: 10,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '10px 12px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 900, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
        RTMP Stream Key
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <code style={{
          flex: 1,
          fontSize: 11,
          fontFamily: 'monospace',
          color: revealed ? GREEN : 'rgba(255,255,255,0.25)',
          letterSpacing: '0.05em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {revealed ? streamKey : '●●●●●●●●●●●●●●●●●●●●'}
        </code>
        <button onClick={() => setRevealed(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          {revealed
            ? <Lock style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)' }} />
            : <Unlock style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)' }} />}
        </button>
        <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          {copied
            ? <Check style={{ width: 14, height: 14, color: GREEN }} />
            : <Copy style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }} />}
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: FONT, marginTop: 4 }}>
        RTMP URL: rtmp://ingest.seewhylive.online/live
      </div>
    </div>
  );
}

function Countdown({ onDone }) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count <= 0) { onDone(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onDone]);

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8,11,24,0.97)',
      }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'backOut' }}
          style={{
            fontSize: count === 0 ? 72 : 120,
            fontWeight: 900,
            fontFamily: FONT,
            color: count <= 1 ? PINK : count === 2 ? GOLD : '#fff',
            lineHeight: 1,
            textShadow: `0 0 60px ${count <= 1 ? PINK : GOLD}88`,
          }}
        >
          {count === 0 ? '🔴 LIVE' : count}
        </motion.div>
      </AnimatePresence>
      <motion.p
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ fontSize: 16, fontFamily: FONT, color: 'rgba(255,255,255,0.4)', marginTop: 24, letterSpacing: '0.1em', textTransform: 'uppercase' }}
      >
        Going live in {count > 0 ? count : '…'}
      </motion.p>
    </motion.div>
  );
}

export default function GoLive() {
  const [step,        setStep]        = useState('pick');
  const [format,      setFormat]      = useState(null);
  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState('');
  const [tagInput,    setTagInput]    = useState('');
  const [tags,        setTags]        = useState([]);
  const [thumbUrl,    setThumbUrl]    = useState('');
  const [description, setDescription] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [launching,   setLaunching]   = useState(false);
  const [bitratePreset, setBitratePreset] = useState('720p30');
  const [countdown,   setCountdown]   = useState(false);
  const [partyId,     setPartyId]     = useState(null);
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [suggestingTitles, setSuggestingTitles] = useState(false);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const streamKey = user?.id
    ? `sw-${user.id.slice(0, 8)}-${Math.abs(user.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)).toString(16).slice(0, 6)}`
    : 'sw-xxxxxxxx-demo';

  function selectFormat(fmt) {
    setFormat(fmt);
    setStep('setup');
  }

  function addTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const t = tagInput.trim().replace(/^#/, '');
      if (t && !tags.includes(t) && tags.length < 8) {
        setTags(prev => [...prev, t]);
      }
      setTagInput('');
    }
  }

  function removeTag(t) {
    setTags(prev => prev.filter(x => x !== t));
  }

  async function suggestTitles() {
    if (suggestingTitles) return;
    setSuggestingTitles(true);
    setTitleSuggestions([]);
    try {
      const ctx = [
        format ? `Stream format: ${format.title}` : '',
        category ? `Category: ${category}` : '',
        tags.length ? `Tags: ${tags.join(', ')}` : '',
        title ? `Draft title so far: "${title}"` : '',
      ].filter(Boolean).join('. ') || 'General live stream on SeeWhy LIVE';
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Joyce AI, co-host for SeeWhy LIVE — a creator-first live streaming platform (domino tournaments, tributes, talk shows, music, 90/10 revenue split). Generate 5 punchy, broadcast-ready stream title suggestions (max 60 chars each) for this stream context: ${ctx}. Return ONLY a JSON array of 5 title strings, no extra text.`,
        response_json_schema: { type: 'array', items: { type: 'string' } },
      });
      if (Array.isArray(res) && res.length) setTitleSuggestions(res.slice(0, 5));
      else setTitleSuggestions(['Live & Direct — Let\'s Go!', 'Tonight\'s Main Event 🔥', 'Stream is LIVE — Join Now!', 'No Cap, This Stream Hits Different', 'The Real Ones Know 🏆']);
    } catch {
      setTitleSuggestions(['Live & Direct — Let\'s Go!', 'Tonight\'s Main Event 🔥', 'Stream is LIVE — Join Now!']);
    }
    setSuggestingTitles(false);
  }

  async function handleGoLive() {
    if (!title.trim()) { toast.error('Add a stream title first'); return; }
    if (launching) return;
    setLaunching(true);
    try {
      const party = await base44.entities.WatchParty.create({
        title:        title.trim(),
        description:  description.trim(),
        category:     category,
        tags:         tags,
        thumbnail_url: thumbUrl.trim(),
        host_id:      user?.id,
        host_name:    user?.full_name || user?.email || 'Host',
        status:       'active',
        is_exclusive: isExclusive,
        stream_type:  format?.id,
        updated_at_ms: Date.now(),
      });
      setPartyId(party.id);
      setCountdown(true);
      base44.entities.Activity.create({
        user_id: user?.id,
        type: 'room_created',
        title: `Started streaming: ${title.trim()}`,
        description: category || '',
      }).catch(() => {});
    } catch {
      toast.error('Failed to create stream');
      setLaunching(false);
    }
  }

  function onCountdownDone() {
    const dest = format?.dest || 'BroadcastStudio';
    window.location.href = `${createPageUrl(dest)}?id=${partyId}`;
  }

  const SL = { fontSize: 11, fontWeight: 900, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 };
  const INPUT = {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT }}>

      <AnimatePresence>{countdown && <Countdown onDone={onCountdownDone} />}</AnimatePresence>

      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        background: 'rgba(8,11,24,0.97)',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
        backdropFilter: 'blur(12px)',
      }}>
        {step === 'setup' ? (
          <button onClick={() => setStep('pick')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <ChevronLeft style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.6)' }} />
          </button>
        ) : (
          <Radio style={{ width: 20, height: 20, color: PINK }} />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: GOLD, margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {step === 'setup' ? `${format?.emoji} ${format?.title}` : 'Go Live'}
          </h1>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: FONT }}>
            {step === 'setup' ? 'Configure your stream' : 'Choose your format'}
          </p>
        </div>
        {step === 'setup' && format && (
          <div style={{
            padding: '3px 10px', borderRadius: 999,
            background: `${format.color}18`, border: `1px solid ${format.color}35`,
            fontSize: 10, fontWeight: 900, color: format.color, fontFamily: FONT, letterSpacing: '0.04em',
          }}>
            {format.title}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">

        {step === 'pick' && (
          <motion.div
            key="pick"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              What kind of stream?
            </p>

            {FORMATS.map(fmt => <FormatCard key={fmt.id} fmt={fmt} onSelect={selectFormat} />)}

            <div style={{ marginTop: 8, borderRadius: 16, padding: '14px 16px', background: 'rgba(109,191,126,0.04)', border: '1px solid rgba(109,191,126,0.12)' }}>
              <Link to={createPageUrl('GreenRoomPreFlight')} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                <span style={{ fontSize: 28 }}>🎬</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: FONT }}>Green Room</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>Test camera, mic, and lighting before going live</div>
                </div>
                <ChevronRight style={{ width: 16, height: 16, color: GREEN, marginLeft: 'auto' }} />
              </Link>
            </div>

            <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 12, lineHeight: 1.6 }}>
              90% Creator Payout · Multi-Language Chat · Powered by SeeWhy LIVE
            </p>
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 120px', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <CameraPreview />

            <div>
              <div style={{ ...SL, justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlignLeft style={{ width: 10, height: 10 }} /> Stream Title *
                </span>
                <button
                  onClick={suggestTitles}
                  disabled={suggestingTitles}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
                    borderRadius: 99, padding: '3px 10px', cursor: 'pointer',
                    color: GOLD, fontSize: 10, fontFamily: FONT, fontWeight: 900,
                    letterSpacing: '0.05em', opacity: suggestingTitles ? 0.6 : 1, transition: 'opacity .15s',
                  }}>
                  <Sparkles style={{ width: 9, height: 9 }} />
                  {suggestingTitles ? 'Thinking…' : 'AI Suggest'}
                </button>
              </div>
              <input
                style={{ ...INPUT, fontSize: 16, fontWeight: 700, borderColor: title ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)' }}
                placeholder="What's your stream about?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={80}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: FONT, marginTop: 3 }}>{title.length}/80</div>
              {titleSuggestions.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {titleSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setTitle(s); setTitleSuggestions([]); }}
                      style={{
                        textAlign: 'left', padding: '8px 12px', borderRadius: 9, cursor: 'pointer',
                        background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)',
                        color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: FONT, fontWeight: 700,
                        transition: 'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.12)'; e.currentTarget.style.color = GOLD; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={SL}><Layers style={{ width: 10, height: 10 }} /> Category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(cat => cat === c ? '' : c)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: FONT,
                      cursor: 'pointer',
                      border: category === c ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.1)',
                      background: category === c ? `${GOLD}18` : 'rgba(255,255,255,0.04)',
                      color: category === c ? GOLD : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.15s',
                    }}
                  >{c}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={SL}><Tag style={{ width: 10, height: 10 }} /> Tags</div>
              <input
                style={INPUT}
                placeholder="Add tags — press Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                  {tags.map(t => (
                    <span key={t} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 9px', borderRadius: 999,
                      background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)',
                      color: GOLD, fontSize: 11, fontFamily: FONT, fontWeight: 700,
                    }}>
                      #{t}
                      <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(212,175,55,0.5)', fontSize: 11, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={SL}><Image style={{ width: 10, height: 10 }} /> Thumbnail URL</div>
              <input
                style={INPUT}
                placeholder="https://… (optional)"
                value={thumbUrl}
                onChange={e => setThumbUrl(e.target.value)}
              />
              {thumbUrl && (
                <img
                  src={thumbUrl}
                  alt="thumbnail preview"
                  style={{ marginTop: 8, width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
            </div>

            <div>
              <div style={SL}><AlignLeft style={{ width: 10, height: 10 }} /> Description</div>
              <textarea
                style={{ ...INPUT, minHeight: 72, resize: 'vertical' }}
                placeholder="Tell viewers what to expect…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={300}
              />
            </div>

            <button
              onClick={() => setIsExclusive(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                background: isExclusive ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
                border: isExclusive ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isExclusive
                  ? <Lock style={{ width: 16, height: 16, color: GOLD }} />
                  : <Unlock style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.3)' }} />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: isExclusive ? GOLD : '#fff', fontFamily: FONT }}>
                    Exclusive Live
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: FONT }}>
                    Subscribers only · Viewers need an active sub to watch
                  </div>
                </div>
              </div>
              <div style={{
                width: 38, height: 22, borderRadius: 11,
                background: isExclusive ? GOLD : 'rgba(255,255,255,0.1)',
                position: 'relative',
                transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 3, left: isExclusive ? 18 : 3,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </div>
            </button>

            <RtmpKeyRow streamKey={streamKey} />

            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: FONT, textAlign: 'center' }}>
              Configure OBS: Server → <code style={{ color: 'rgba(255,255,255,0.35)' }}>rtmp://ingest.seewhylive.online/live</code>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: FONT, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Stream Health</span>
              <StreamHealthMonitor isStreaming={false} />
            </div>

            <BitratePresets selected={bitratePreset} onChange={setBitratePreset} />

            {user?.id && (
              <div style={{ background: 'rgba(13,6,24,0.9)', borderRadius: 14, border: '1px solid rgba(212,175,55,0.12)', padding: '16px' }}>
                <DestinationsManager userId={user.id} />
              </div>
            )}

            {partyId && <ZEGOStreamHealthCard roomId={partyId} />}
            {partyId && user?.id && (
              <ZEGOGoLiveFlow roomId={partyId} userId={user.id} onLive={() => {}} />
            )}

            {user?.id && <OverlayThemeBuilder creatorId={user.id} />}

            {partyId && user && (
              <PreStreamCountdown room={{ id: partyId }} currentUser={user} onGoLive={() => {}} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick-links before the go-live button */}
      {step === 'setup' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 16px 80px', justifyContent: 'center' }}>
          {[
            { label: '📅 Scheduler', href: 'StreamScheduler' },
            { label: '📡 Multi-Platform', href: 'MultiPlatform' },
            { label: '🎛 Control Room', href: 'ControlRoom' },
            { label: '📊 Analytics', href: 'StreamAnalytics' },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span style={{ display: 'block', fontFamily: FONT, fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      )}

      {step === 'setup' && (
        <div style={{
          position: 'fixed', bottom: 0, inset: 0, top: 'auto',
          padding: '12px 16px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          background: 'rgba(8,11,24,0.98)',
          borderTop: '1px solid rgba(212,175,55,0.12)',
          backdropFilter: 'blur(16px)',
        }}>
          <motion.button
            whileTap={{ scale: title.trim() ? 0.97 : 1 }}
            onClick={handleGoLive}
            disabled={!title.trim() || launching}
            style={{
              width: '100%',
              height: 54,
              borderRadius: 14,
              border: 'none',
              cursor: title.trim() ? 'pointer' : 'default',
              fontFamily: FONT,
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: title.trim()
                ? `linear-gradient(135deg, ${CRIMSON}, ${PINK})`
                : 'rgba(255,255,255,0.06)',
              color: title.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
              boxShadow: title.trim() ? `0 4px 24px rgba(192,57,43,0.4)` : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: launching ? 0.7 : 1,
            }}
          >
            <Radio style={{ width: 20, height: 20 }} />
            {launching ? 'Creating Stream…' : '🔴 Go Live'}
          </motion.button>
        </div>
      )}

      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <CameraSourcePicker onSourceSelected={() => {}} currentDeviceId={null} />
        <GuestRTMPPanel participantId={null} userId={user?.id} />
        <StreamHealthDashboard isLive={false} />
        <GuestGrid participants={[]} isHost={true} onInvite={() => {}} hostId={user?.id} />
        <GuestControls participants={[]} onMuteGuest={() => {}} onRemoveGuest={() => {}} />
        <GuestDestinationsPanel participantUserId={null} guestName="Guest" />
        <StreamChatbot roomId={null} isHost={true} elapsedSeconds={0} hostName={user?.full_name || 'Host'} room={null} />
        <ZEGOSettingsDrawer isOpen={false} onClose={() => {}} roomId={null} />
        <ShareModal isOpen={false} onClose={() => {}} url={window.location.href} title="My Stream" />
        <WebhookHooks roomId={null} userId={user?.id} isHost={true} />
      </div>
    </div>
  );
}
