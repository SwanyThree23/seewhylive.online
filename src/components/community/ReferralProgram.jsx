import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Share2, Copy, Gift, Users } from 'lucide-react';

const G = '#D4AF37';
const PANEL = '#0F0B1A';
const BORDER = 'rgba(212,175,55,0.18)';

export default function ReferralProgram({ communityId }) {
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: referrals } = useQuery({
    queryKey: ['userReferrals', user?.id],
    queryFn: () =>
      base44.entities.Referral.filter(
        { referrer_id: user?.id },
        '-created_date'
      ),
    enabled: !!user?.id,
  });

  const referralCode = user?.id ? `REF-${user.id.slice(0, 8).toUpperCase()}` : '';
  const referralLink = `${window.location.origin}?ref=${referralCode}`;
  const completedReferrals = referrals?.filter(r => r.status === 'completed' || r.status === 'rewarded') || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-4"
      style={{ background: PANEL, border: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5" style={{ color: G }} />
        <h3 className="text-xs font-bold uppercase" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          Referral Program
        </h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-[10px] text-white/60 mb-1">Referrals</p>
          <p className="text-lg font-black" style={{ color: G }}>
            {completedReferrals.length}
          </p>
        </div>
        <div className="p-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-[10px] text-white/60 mb-1">Potential</p>
          <p className="text-lg font-black" style={{ color: '#C9A84C' }}>
            {(referrals?.length || 0) - completedReferrals.length}
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mb-4">
        <p className="text-[10px] text-white/60 mb-2">Your Referral Code</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralCode}
            readOnly
            className="flex-1 px-3 py-2 rounded text-xs bg-black/50 text-white/70 outline-none"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="px-3 py-2 rounded text-xs font-bold transition-all"
            style={{ background: G, color: '#000' }}
          >
            {copied ? '✓' : <Copy className="w-3 h-3" />}
          </motion.button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5"
          style={{ background: `${G}20`, color: G }}
        >
          <Share2 className="w-3 h-3" /> Share
        </motion.button>
      </div>

      {/* Recent Referrals */}
      {completedReferrals.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
          <p className="text-[10px] text-white/60 mb-2">Recent Referrals</p>
          <div className="space-y-1">
            {completedReferrals.slice(0, 3).map((ref, idx) => (
              <div key={ref.id} className="flex items-center justify-between text-[10px]">
                <span className="text-white/70">User referred</span>
                <span style={{ color: G }}>+{ref.reward_value || 100} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}