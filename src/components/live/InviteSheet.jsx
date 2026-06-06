import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share2, UserCheck, Users, Eye, Check, Link, KeyRound, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const BG3     = '#0d0618';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

function genToken() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export default function InviteSheet({ isOpen, onClose, roomId, roomTitle, isHost, isCoHost }) {
  const [copiedKey, setCopiedKey]           = useState(null);
  const [coHostToken]                       = useState(genToken);
  const [guestToken]                        = useState(genToken);
  const [regCode, setRegCode]               = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  const base    = typeof window !== 'undefined' ? window.location.origin : 'https://seewhylive.online';
  const roomUrl = `${base}/LiveRoom?id=${roomId}`;

  const INVITE_TYPES = [
    {
      key:        'viewer',
      label:      'Viewer Link',
      desc:       'Anyone can watch — no account needed',
      Icon:       Eye,
      color:      '#22c55e',
      url:        roomUrl,
      badge:      'PUBLIC',
    },
    {
      key:        'guest',
      label:      'Guest Speaker',
      desc:       'Can join stage, speak, and turn on camera',
      Icon:       Users,
      color:      GOLD,
      url:        `${roomUrl}&join_as=guest&ik=${guestToken}`,
      badge:      'SPEAKER',
    },
    ...((isHost) ? [{
      key:        'cohost',
      label:      'Co-Host Invite',
      desc:       'Full co-host access and moderation controls',
      Icon:       UserCheck,
      color:      '#00d4ff',
      url:        `${roomUrl}&join_as=co-host&ik=${coHostToken}`,
      badge:      'CO-HOST',
    }] : []),
  ];

  const generateRegCode = async () => {
    setGeneratingCode(true);
    const code = genToken();
    try {
      await base44.entities.InviteCode.create({ code, used: false, created_by_room: roomId || '' });
    } catch {
      // entity may not exist yet — use locally generated code
    }
    setRegCode(code);
    setGeneratingCode(false);
  };

  const copyRegCode = async () => {
    const loginUrl = `${base}/login?invite=${regCode}`;
    try {
      await navigator.clipboard.writeText(loginUrl);
      toast.success('Registration invite link copied!');
    } catch {
      toast.error('Copy failed');
    }
  };

  const copyLink = async (type) => {
    try {
      await navigator.clipboard.writeText(type.url);
      setCopiedKey(type.key);
      setTimeout(() => setCopiedKey(null), 2000);
      toast.success(`${type.label} link copied!`);
    } catch {
      toast.error('Copy failed — try long-pressing the link');
    }
  };

  const shareLink = async (type) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: roomTitle ? `Join: ${roomTitle}` : 'SeeWhy LIVE',
          text: type.key === 'cohost'
            ? `You've been invited as Co-Host on SeeWhy LIVE. Join now!`
            : type.key === 'guest'
            ? `You've been invited as a Guest Speaker on SeeWhy LIVE. Join the stage!`
            : `Watch ${roomTitle || 'this stream'} live on SeeWhy LIVE — no account needed!`,
          url: type.url,
        });
      } catch {}
    } else {
      copyLink(type);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.65)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl overflow-hidden"
            style={{ background: BG3, borderTop: `1px solid rgba(212,175,55,0.2)`, maxHeight: '90vh' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Drag handle */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/15" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-5 pb-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <h2 style={{ ...T, color: '#fff', fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '0.02em' }}>
                  Invite People
                </h2>
                {roomTitle && (
                  <p style={{ ...T, color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '2px 0 0' }}>
                    {roomTitle}
                  </p>
                )}
              </div>
              <button onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>

            {/* Invite rows */}
            <div style={{ padding: '14px 16px 40px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
              {INVITE_TYPES.map(type => (
                <div key={type.key} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid rgba(255,255,255,0.07)`,
                  borderRadius: 14, padding: '13px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: `${type.color}12`,
                    border: `1px solid ${type.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <type.Icon style={{ width: 17, height: 17, color: type.color }} />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ ...T, color: '#fff', fontSize: 14, fontWeight: 900 }}>{type.label}</span>
                      <span style={{
                        ...T, fontSize: 9, fontWeight: 900, color: type.color,
                        background: `${type.color}18`, border: `1px solid ${type.color}35`,
                        borderRadius: 4, padding: '1px 5px',
                      }}>{type.badge}</span>
                    </div>
                    <p style={{ ...T, color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>{type.desc}</p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => copyLink(type)}
                      title="Copy link"
                      style={{
                        width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                        border: `1px solid ${copiedKey === type.key ? '#22c55e' : 'rgba(255,255,255,0.12)'}`,
                        background: copiedKey === type.key ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                        color: copiedKey === type.key ? '#22c55e' : 'rgba(255,255,255,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      {copiedKey === type.key
                        ? <Check style={{ width: 13, height: 13 }} />
                        : <Copy style={{ width: 13, height: 13 }} />}
                    </button>
                    <button onClick={() => shareLink(type)}
                      title="Share"
                      style={{
                        width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                        border: `1px solid ${GOLD}35`, background: `${GOLD}0E`,
                        color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      <Share2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Registration invite code (host only) */}
              {isHost && (
                <div style={{ background: 'rgba(212,175,55,0.04)', border: `1px solid rgba(212,175,55,0.15)`, borderRadius: 14, padding: '13px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <KeyRound style={{ width: 14, height: 14, color: GOLD }} />
                    <span style={{ ...T, color: GOLD, fontSize: 13, fontWeight: 900 }}>New User Invite Code</span>
                    <span style={{ ...T, fontSize: 9, fontWeight: 900, color: CRIMSON, background: `${CRIMSON}18`, border: `1px solid ${CRIMSON}30`, borderRadius: 4, padding: '1px 5px' }}>HOST ONLY</span>
                  </div>
                  <p style={{ ...T, color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '0 0 10px' }}>
                    One-time code for someone who doesn't have a SeeWhy LIVE account yet
                  </p>
                  {!regCode ? (
                    <button onClick={generateRegCode} disabled={generatingCode}
                      style={{ width: '100%', height: 36, borderRadius: 8, border: `1px solid rgba(212,175,55,0.3)`, background: `rgba(212,175,55,0.08)`, color: GOLD, cursor: generatingCode ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...T, fontSize: 12, fontWeight: 900 }}>
                      <KeyRound style={{ width: 12, height: 12 }} />
                      {generatingCode ? 'Generating…' : 'Generate Invite Code'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', textAlign: 'center', ...T, color: GOLD, fontSize: 16, fontWeight: 900, letterSpacing: '0.18em' }}>
                        {regCode}
                      </div>
                      <button onClick={copyRegCode} title="Copy invite link"
                        style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${GOLD}35`, background: `${GOLD}0E`, color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Copy style={{ width: 13, height: 13 }} />
                      </button>
                      <button onClick={() => setRegCode('')} title="Generate new code"
                        style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <RefreshCw style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Public note */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4, padding: '10px 0', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10 }}>
                <Eye style={{ width: 12, height: 12, color: '#22c55e' }} />
                <span style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  Anyone can watch with the Viewer link — no sign-in required
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
