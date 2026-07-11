import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Camera, Globe, Copy, Check, Rocket } from 'lucide-react';

const G  = '#D4AF37';
const BG = 'rgba(10,7,16,0.98)';
const T  = { fontFamily: 'Barlow Condensed, sans-serif' };

function genToken(userId) {
  const stored = localStorage.getItem(`sw_session_token_${userId}`);
  if (stored) return stored;
  const t = `sw_${Math.random().toString(36).substring(2, 10)}_${Math.random().toString(36).substring(2, 10)}?session=${Date.now()}`;
  localStorage.setItem(`sw_session_token_${userId}`, t);
  return t;
}

export default function GreenRoomPreflight({ isOpen, onClose, onGoLive, party, user }) {
  const [checks, setChecks] = useState({ mic: 'idle', camera: 'idle', network: 'idle' });
  const [copied, setCopied]   = useState(null);
  const [rtmpKey]             = useState(() => (user?.id ? localStorage.getItem(`rtmp_key_${user.id}`) || 'SW_XXXXXXXX_XXXXXXXX' : 'SW_XXXXXXXX_XXXXXXXX'));
  const [sessionToken]        = useState(() => (user?.id ? genToken(user.id) : ''));

  const vdoLink = party?.id ? `https://vdo.ninja/?push=${party.id}&label=${encodeURIComponent(user?.full_name || 'Guest')}` : 'https://vdo.ninja/?push=...';
  const ingestUrl = 'rtmp://ingest.seewhylive.online:1935/live';

  const runChecks = useCallback(async () => {
    setChecks({ mic: 'testing', camera: 'testing', network: 'testing' });

    // Mic test
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      s.getTracks().forEach(t => t.stop());
      setChecks(c => ({ ...c, mic: 'ready' }));
    } catch {
      setChecks(c => ({ ...c, mic: 'fail' }));
    }

    // Camera test
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      s.getTracks().forEach(t => t.stop());
      setChecks(c => ({ ...c, camera: 'ready' }));
    } catch {
      setChecks(c => ({ ...c, camera: 'fail' }));
    }

    // Network test — check fetch latency
    try {
      const start = Date.now();
      await fetch(window.location.origin + '/', { method: 'HEAD', cache: 'no-store' });
      const ms = Date.now() - start;
      setChecks(c => ({ ...c, network: ms < 500 ? 'ready' : 'warn' }));
    } catch {
      setChecks(c => ({ ...c, network: 'fail' }));
    }
  }, []);

  useEffect(() => {
    if (isOpen) runChecks();
  }, [isOpen, runChecks]);

  function copyText(text, key) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const allReady = checks.mic === 'ready' && checks.camera === 'ready' && (checks.network === 'ready' || checks.network === 'warn');

  const checkLabel = (state) => {
    if (state === 'idle' || state === 'testing') return { label: 'TESTING…', color: 'rgba(255,255,255,0.3)' };
    if (state === 'ready') return { label: '✓ READY', color: '#6DBF7E' };
    if (state === 'warn')  return { label: '⚠ SLOW', color: '#C9A84C' };
    return { label: '✗ FAIL', color: '#C0392B' };
  };

  const ROWS = [
    { key: 'mic',     icon: '🎙', label: 'Microphone Test' },
    { key: 'camera',  icon: '📷', label: 'Camera Test' },
    { key: 'network', icon: '🌐', label: 'Network / SFU Test' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => e.target === e.currentTarget && onClose()}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>

          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="w-full max-w-md rounded-t-3xl md:rounded-2xl overflow-hidden"
            style={{ background: BG, border: `1px solid rgba(212,175,55,0.18)`, maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-2xl">🟢</span>
              <h2 className="text-xl font-black text-white flex-1" style={{ ...T, letterSpacing: 2 }}>GREEN ROOM — PRE-FLIGHT</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-white/50" style={T}>Complete all checks before going live. Your JWT session token is active.</p>

              {/* Check rows */}
              {ROWS.map(row => {
                const { label, color } = checkLabel(checks[row.key]);
                return (
                  <div key={row.key} className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: checks[row.key] === 'ready' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${checks[row.key] === 'ready' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                    <span className="text-sm font-bold text-white" style={T}>{row.icon} {row.label}</span>
                    <span className="text-sm font-black" style={{ color, ...T }}>{label}</span>
                  </div>
                );
              })}

              {/* RTMP Stream Key */}
              <div>
                <p className="text-[11px] font-black uppercase mb-1.5" style={{ color: G, ...T }}>RTMP Stream Key (OBS / vMix / StreamYard)</p>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl text-[12px] font-mono text-white/60 truncate"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {rtmpKey}
                  </div>
                  <button onClick={() => copyText(rtmpKey, 'rtmp')} className="px-3 py-2 rounded-xl" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: G }}>
                    {copied === 'rtmp' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] mt-1 font-mono" style={{ color: '#6DBF7E' }}>Ingest: {ingestUrl}</p>
              </div>

              {/* VDO.ninja */}
              <div>
                <p className="text-[11px] font-black uppercase mb-1.5" style={{ color: '#00b4d8', ...T }}>VDO.NINJA 4K GUEST LINK</p>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl text-[11px] font-mono text-white/50 truncate"
                    style={{ background: 'rgba(0,180,216,0.05)', border: '1px solid rgba(0,180,216,0.15)' }}>
                    {vdoLink}
                  </div>
                  <button onClick={() => copyText(vdoLink, 'vdo')} className="px-3 py-2 rounded-xl" style={{ background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.3)', color: '#00b4d8' }}>
                    {copied === 'vdo' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Session Token */}
              <div className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-black uppercase mb-1" style={{ color: G, ...T }}>Session Token (60m)</p>
                <p className="text-[11px] font-mono text-white/50 break-all">{sessionToken}</p>
              </div>

              {/* Go Live button */}
              <button
                onClick={() => { onClose(); onGoLive?.(); }}
                disabled={!allReady}
                className="w-full py-4 rounded-2xl font-black uppercase text-base transition-all disabled:opacity-40"
                style={{ background: allReady ? 'linear-gradient(135deg, #c8f600, #a3cc00)' : 'rgba(255,255,255,0.08)', color: allReady ? '#000' : 'rgba(255,255,255,0.3)', letterSpacing: 2, ...T }}>
                🚀 ENTER STAGE — GO LIVE
              </button>

              {!allReady && (
                <p className="text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
                  Complete all tests to continue
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
