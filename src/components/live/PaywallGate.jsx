import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Crown, Timer, Zap, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { isSafeUrl } from '@/lib/security';

var PAYMENT_PLATFORMS = [
  { id: 'paypal', name: 'PayPal', emoji: '🅿️', baseUrl: 'https://paypal.me/' },
  { id: 'cashapp', name: 'Cash App', emoji: '💚', baseUrl: 'https://cash.app/$' },
  { id: 'venmo', name: 'Venmo', emoji: '💙', baseUrl: 'https://venmo.com/' },
  { id: 'zelle', name: 'Zelle', emoji: '💜', baseUrl: null },
  { id: 'chime', name: 'Chime', emoji: '🟢', baseUrl: 'https://chime.com/' },
  { id: 'applepay', name: 'Apple Pay', emoji: '🍎', baseUrl: null },
  { id: 'googlepay', name: 'Google Pay', emoji: '🔵', baseUrl: null },
  { id: 'custom', name: 'Pay Link', emoji: '🔗', baseUrl: '' },
];

const PREVIEW_SECONDS = 120;

const TIERS = [
  { label: 'Basic Access', price: 0.99,  icon: '🔓', desc: 'Full stream access' },
  { label: 'VIP Access',   price: 2.99,  icon: '👑', desc: 'Stream + private chat + replay' },
  { label: 'Backstage',    price: 4.99,  icon: '⭐', desc: 'All access + 1-on-1 time' },
];

const HOST_TIERS = [
  { label: 'Free Preview (2 min)', price: 0,    icon: '👁️', desc: 'Then paywall triggers' },
  ...TIERS,
];

function fmtSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function PaywallGate({ isHost, streamTitle, onUnlock, isUnlocked, creatorId }) {
  const [secondsLeft, setSecondsLeft] = useState(PREVIEW_SECONDS);
  const [previewExpired, setPreviewExpired] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [payStep, setPayStep] = useState(null);
  const [creatorPayLinks, setCreatorPayLinks] = useState({});

  // Host-side state
  const [hostPaywallEnabled, setHostPaywallEnabled] = useState(() => { try { return localStorage.getItem('paywall_enabled') === 'true'; } catch { return false; } });
  const [customPrice, setCustomPrice] = useState('');

  // Load creator's payment links for the payment step
  useEffect(function() {
    if (!creatorId) return;
    base44.entities.CreatorProfile.filter({ user_id: creatorId }).then(function(profiles) {
      var pl = (profiles && profiles[0] && profiles[0].payment_links) || {};
      setCreatorPayLinks(pl);
    }).catch(function() {});
  }, [creatorId]);

  // Paywall/countdown disabled — all viewers have free access during launch
  useEffect(() => { if (!isHost && !isUnlocked) onUnlock?.(); }, []);

  // ── Host panel ───────────────────────────────────────────────────────────
  if (isHost) {
    return (
      <div className="bg-[rgba(3,3,10,0.9)] border border-[#FFB800]/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FFB800]" />
            <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Paywall Settings
            </span>
          </div>
          <button
            onClick={() => {
              const next = !hostPaywallEnabled;
              setHostPaywallEnabled(next);
              try { localStorage.setItem('paywall_enabled', String(next)); } catch {}
              toast.success(next ? '120s free preview paywall enabled' : 'Paywall disabled');
            }}
            className={`w-10 h-5 rounded-full transition-all relative ${hostPaywallEnabled ? 'bg-[#FFB800]' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hostPaywallEnabled ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>

        {hostPaywallEnabled && (
          <div className="space-y-2">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Access Tiers</p>
            {HOST_TIERS.map((tier, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                <span>{tier.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{tier.label}</p>
                  <p className="text-[10px] text-white/40">{tier.desc}</p>
                </div>
                <span className="text-xs text-[#FFB800] font-mono">
                  {tier.price === 0 ? 'FREE' : `$${tier.price}`}
                </span>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                placeholder="Custom price $"
                className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{
                  background: 'rgba(3,3,10,0.85)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'Barlow Condensed, sans-serif',
                }}
              />
              <button
                className="px-3 py-2 rounded-lg text-xs font-black uppercase"
                style={{ background: '#FFB800', color: '#000', whiteSpace: 'nowrap' }}
              >
                Add Tier
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Unlocked badge ───────────────────────────────────────────────────────
  if (isUnlocked) {
    return (
      <div className="flex items-center gap-2 border border-green-700/30 rounded-lg px-3 py-2"
        style={{ background: 'rgba(0,255,136,0.15)' }}>
        <Unlock className="w-4 h-4 text-[#00FF88]" />
        <span className="text-xs text-[#00FF88] font-semibold">Full access unlocked</span>
      </div>
    );
  }

  // ── Floating countdown badge (preview in progress) ───────────────────────
  // Rendered via portal-style fixed positioning so it floats over the stream
  const urgentColor = secondsLeft <= 30 ? '#FF2040' : secondsLeft <= 60 ? '#FFB800' : '#00FF88';

  return (
    <>
      {/* Countdown pip — visible during preview, disappears when expired */}
      <AnimatePresence>
        {!previewExpired && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -8 }}
            className="fixed top-[70px] right-3 z-[150] flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shadow-lg"
            style={{
              background: 'rgba(3,3,10,0.92)',
              border: `1px solid ${urgentColor}55`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Timer className="w-3 h-3" style={{ color: urgentColor }} />
            <span className="text-[11px] font-mono font-bold" style={{ color: urgentColor }}>
              {fmtSeconds(secondsLeft)}
            </span>
            <span className="text-[10px] text-white/40">free</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen paywall overlay — appears when preview expires */}
      <AnimatePresence>
        {previewExpired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[180] flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(20px) brightness(0.35)' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-5 text-center"
              style={{
                background: 'rgba(3,3,10,0.98)',
                border: '1px solid rgba(255,184,0,0.35)',
                boxShadow: '0 0 60px rgba(255,184,0,0.12)',
              }}
            >
              {/* Icon + title */}
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)' }}>
                  <Crown className="w-8 h-8 text-[#FFB800]" />
                </div>
                <h2 className="text-white font-black text-xl" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
                  {streamTitle || 'Premium Live'}
                </h2>
                <p className="text-white/50 text-xs leading-relaxed">
                  Your 2-minute free preview has ended.<br />Unlock instant full access below.
                </p>
              </div>

              {/* Tier cards */}
              <div className="space-y-2 text-left">
                {TIERS.map((tier, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTier(tier)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all"
                    style={{
                      background: selectedTier?.label === tier.label
                        ? 'rgba(255,184,0,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selectedTier?.label === tier.label ? '#FFB800' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <span className="text-2xl">{tier.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{tier.label}</p>
                      <p className="text-[11px] text-white/40">{tier.desc}</p>
                    </div>
                    <span className="text-lg font-black text-[#FFB800]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      ${tier.price}
                    </span>
                  </button>
                ))}
              </div>

              {/* Payment step — direct payment links */}
              {payStep === 'pay' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 }}>
                    Send <strong style={{ color: '#FFB800' }}>${selectedTier && selectedTier.price}</strong> using any app below, then confirm
                  </p>
                  {PAYMENT_PLATFORMS.filter(function(p) { return creatorPayLinks[p.id]; }).map(function(platform) {
                    var handle = creatorPayLinks[platform.id];
                    var url = handle && platform.baseUrl !== null ? (platform.baseUrl || '') + handle : null;
                    return (
                      <button
                        key={platform.id}
                        onClick={function() {
                          if (url && isSafeUrl(url)) {
                            window.open(url, '_blank', 'noopener,noreferrer');
                          } else if (handle) {
                            navigator.clipboard.writeText(handle).catch(function() {});
                            toast.info('Payment info copied: ' + handle);
                          }
                        }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: 20 }}>{platform.emoji}</span>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#fff' }}>{platform.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{handle}</p>
                        </div>
                        <ExternalLink style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)' }} />
                      </button>
                    );
                  })}
                  {Object.keys(creatorPayLinks).filter(function(k) { return creatorPayLinks[k]; }).length === 0 && (
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '8px 0' }}>Creator hasn't set up payment links yet</p>
                  )}
                  <button
                    onClick={function() {
                      setProcessing(true);
                      toast.success((selectedTier && selectedTier.label) + ' unlocked! Enjoy the stream 🎉');
                      onUnlock && onUnlock();
                      setProcessing(false);
                    }}
                    style={{ width: '100%', marginTop: 4, padding: '12px 0', borderRadius: 10, background: '#00C853', border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#000', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textTransform: 'uppercase' }}
                  >
                    <CheckCircle style={{ width: 15, height: 15 }} />
                    I've Completed Payment
                  </button>
                  <button
                    onClick={function() { setPayStep(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.3)', padding: '4px 0', fontFamily: 'Barlow Condensed, sans-serif' }}
                  >
                    ← Back
                  </button>
                </div>
              ) : (
                <>
                  <button
                    disabled={!selectedTier}
                    onClick={function() {
                      if (!selectedTier) return;
                      setPayStep('pay');
                    }}
                    className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      background: selectedTier ? '#FFB800' : 'rgba(255,255,255,0.06)',
                      color: selectedTier ? '#000' : 'rgba(255,255,255,0.25)',
                      cursor: selectedTier ? 'pointer' : 'not-allowed',
                      letterSpacing: '0.08em',
                      border: 'none',
                    }}
                  >
                    <Zap className="w-4 h-4" />
                    {selectedTier ? 'Pay $' + selectedTier.price + ' Directly →' : 'Select a tier above'}
                  </button>

                  <p className="text-[10px] text-white/20">
                    90% of every dollar goes directly to the creator · Powered by SeeWhy LIVE
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}