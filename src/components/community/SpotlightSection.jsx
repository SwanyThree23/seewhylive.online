import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';

const G = '#D4AF37';
const BG = '#080B18';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

export default function SpotlightSection({ communityId }) {
  const { data: spotlights } = useQuery({
    queryKey: ['communitySpotlights', communityId],
    queryFn: () =>
      base44.entities.CommunitySpotlight.filter(
        { community_id: communityId, is_active: true },
        '-start_date',
        5
      ),
    enabled: !!communityId,
  });

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: BG, border: `1px solid ${BORDER}` }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <Star className="w-4 h-4" style={{ color: G }} />
        <h3 className="text-xs font-bold uppercase" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          Community Spotlight
        </h3>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {spotlights?.map((spotlight, idx) => (
          <motion.div
            key={spotlight.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex gap-3"
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #C0392B, #D4AF37)' }} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{spotlight.user_name}</p>
              <p className="text-[10px] text-white/60 line-clamp-2 mb-1">{spotlight.title}</p>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold" style={{ background: `${G}20`, color: G }}>
                {spotlight.spotlight_type}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {!spotlights || spotlights.length === 0 && (
        <p className="p-4 text-center text-white/40 text-xs">No spotlights yet</p>
      )}
    </div>
  );
}