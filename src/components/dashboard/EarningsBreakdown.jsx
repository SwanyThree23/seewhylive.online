import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, ChevronDown, ChevronUp, Link2, Copy, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';

const G       = '#D4AF37';
const CRIMSON = '#800020';
const GREEN   = '#6DBF7E';
const PANEL   = '#0F0B1A';
const BORDER  = 'rgba(212,175,55,0.18)';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const PLATFORM_CUTS = [
  { name: 'SeeWhy LIVE', creator: 90, color: G,       highlight: true },
  { name: 'Twitch',      creator: 50, color: '#9146FF' },
  { name: 'YouTube',     creator: 55, color: '#FF0000' },
  { name: 'TikTok Live', creator: 50, color: '#69C9D0' },
  { name: 'Instagram',   creator: 55, color: '#E1306C' },
];

function SplitBar({ platform, total }) {
  const extra = total * ((90 - platform.creator) / 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]" style={T}>
        <span className="font-black" style={{ color: platform.highlight ? G : 'rgba(255,255,255,0.55)' }}>
          {platform.name} {platform.highlight && '✦'}
        </span>
        <span style={{ color: platform.highlight ? G : 'rgba(255,255,255,0.35)' }}>
          {platform.creator}% yours
          {platform.highlight && extra > 0 && (
            <span style={{ color: GREEN }}> (+${extra.toFixed(0)} more)</span>
          )}
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${platform.creator}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: platform.highlight
              ? `linear-gradient(90deg, ${CRIMSON}, ${G})`
              : platform.color + '60',
          }}
        />
      </div>
    </div>
  );
}

export default function EarningsBreakdown({ creatorId }) {
  const [showComparison, setShowComparison]   = useState(false);
  const [linkCopied, setLinkCopied]           = useState(false);

  const { data: transactions = [] } = useQuery({
    queryKey: ['creatorTransactions', creatorId],
    queryFn: () => base44.entities.Transaction.filter({ creator_id: creatorId }, '-created_date', 100),
    enabled: !!creatorId,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['creatorReferrals', creatorId],
    queryFn: () => base44.entities.Referral.filter({ referrer_id: creatorId }),
    enabled: !!creatorId,
  });

  const { data: inviteCodes = [] } = useQuery({
    queryKey: ['creatorInviteCodes', creatorId],
    queryFn: () => base44.entities.InviteCode.filter({ creator_id: creatorId }),
    enabled: !!creatorId,
  });

  const tips          = transactions.filter(t => t.type === 'tip').reduce((s, t) => s + (t.amount || 0), 0);
  const subscriptions = transactions.filter(t => t.type === 'subscription').reduce((s, t) => s + (t.amount || 0), 0);
  const ppv           = transactions.filter(t => t.type === 'ppv').reduce((s, t) => s + (t.amount || 0), 0);
  const total         = transactions.reduce((s, t) => s + (t.amount || 0), 0);

  const CATEGORIES = [
    { label: 'Tips',          value: tips,          icon: '💎', color: G },
    { label: 'Subscriptions', value: subscriptions, icon: '👑', color: '#C9A84C' },
    { label: 'PPV Events',    value: ppv,           icon: '🎫', color: GREEN },
  ];

  const inviteCode  = inviteCodes[0]?.code || `SW-${creatorId?.slice(0, 6)?.toUpperCase()}`;
  const refEarnings = referrals.reduce((s, r) => s + (r.earnings || 0), 0);
  const inviteLink  = `${window.location.origin}?ref=${inviteCode}`;

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast.success('Invite link copied!');
    });
  }

  function shareInviteLink() {
    if (navigator.share) {
      navigator.share({ title: 'Join me on SeeWhy LIVE', url: inviteLink }).catch(() => {});
    } else {
      copyInviteLink();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: PANEL, border: `1px solid ${BORDER}` }}
    >
      {/* ── Header ── */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: G }} />
          <h3 className="font-black text-[13px] uppercase" style={{ color: G, ...T }}>Earnings Breakdown</h3>
        </div>
        <span className="text-[10px] font-black px-2 py-1 rounded-lg"
          style={{ background: `${G}15`, border: `1px solid ${G}30`, color: G, ...T }}>
          90% Yours
        </span>
      </div>

      <div className="p-4 space-y-5">

        {/* ── Total Revenue ── */}
        <div className="p-4 rounded-xl" style={{ background: `${G}0D`, border: `1px solid ${G}25` }}>
          <p className="text-[10px] font-black uppercase mb-1" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
            Total Revenue (All Time)
          </p>
          <motion.p
            key={total}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black"
            style={{ color: G, fontFamily: 'Orbitron, monospace' }}>
            ${total.toFixed(2)}
          </motion.p>
        </div>

        {/* ── Category bars ── */}
        <div className="space-y-3">
          {CATEGORIES.map((cat, idx) => {
            const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
            return (
              <motion.div key={cat.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-[11px] font-black text-white/70" style={T}>{cat.label}</span>
                  <span className="ml-auto text-[11px] font-black" style={{ color: cat.color, ...T }}>
                    ${cat.value.toFixed(2)}
                  </span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.3 + idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full"
                    style={{ background: `linear-gradient(90deg, ${CRIMSON}cc, ${cat.color})` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── 90/10 Split Visual ── */}
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid rgba(212,175,55,0.15)` }}>
          <div className="px-4 py-3 flex gap-0 h-10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '90%' }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center text-[11px] font-black rounded-l-lg"
              style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${G})`, color: '#07050A', ...T }}>
              You 90%
            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '10%' }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center text-[9px] font-black rounded-r-lg"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', ...T }}>
              10%
            </motion.div>
          </div>
          <div className="px-4 py-2 text-center">
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
              You keep 90% of every dollar. Always.
            </p>
          </div>
        </div>

        {/* ── Platform Comparison Toggle ── */}
        <button
          onClick={() => setShowComparison(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
          <span className="text-[11px] font-black" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>
            Compare to other platforms
          </span>
          {showComparison
            ? <ChevronUp className="w-4 h-4" style={{ color: G }} />
            : <ChevronDown className="w-4 h-4" style={{ color: G }} />}
        </button>

        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3">
              <p className="text-[10px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
                If you earned ${total.toFixed(0)} on each platform
              </p>
              {PLATFORM_CUTS.map(p => (
                <SplitBar key={p.name} platform={p} total={total} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Referral Code Section ── */}
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid rgba(212,175,55,0.2)`, background: `${G}08` }}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
            <div className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5" style={{ color: G }} />
              <span className="text-[11px] font-black uppercase" style={{ color: G, ...T }}>Your Referral Code</span>
            </div>
            <span className="text-[10px] font-black" style={{ color: GREEN, ...T }}>
              {referrals.length} referred · ${refEarnings.toFixed(0)} earned
            </span>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Orbitron, monospace', color: G, fontSize: 14, letterSpacing: 2 }}>
              <span className="flex-1">{inviteCode}</span>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={copyInviteLink}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-black"
                style={{ background: linkCopied ? `${GREEN}20` : `${G}15`, border: `1px solid ${linkCopied ? GREEN : G}30`, color: linkCopied ? GREEN : G, ...T }}>
                {linkCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={shareInviteLink}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-black"
                style={{ background: `${CRIMSON}20`, border: `1px solid ${CRIMSON}35`, color: '#ff9999', ...T }}>
                <Share2 className="w-3 h-3" />
                Share
              </motion.button>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
