import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Crown, TrendingUp } from 'lucide-react';

const RANK_COLORS = ['#d4af37', '#c0c0c0', '#cd7f32', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.3)'];
const RANK_ICONS = ['👑', '🥈', '🥉', '4️⃣', '5️⃣'];

const MEMBER_COLORS = ['#8B6F47', '#6B7C4A', '#CC7755', '#4A6B3A', '#7C4A3A', '#6B4A4A'];
function getColor(name) {
  return MEMBER_COLORS[(name ? name.charCodeAt(0) : 0) % MEMBER_COLORS.length];
}

const TABS = ['Reactions', 'Battles', 'Chat'];

export default function SocialLeaderboard({ members = [], reactionCounts = {}, battleScores = {}, chatCounts = {} }) {
  const [tab, setTab] = useState('Reactions');

  const scoreMap = tab === 'Reactions' ? reactionCounts : tab === 'Battles' ? battleScores : chatCounts;

  const ranked = members
    .map(m => ({ ...m, score: scoreMap[m.user_id] || 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.97)', border: '1px solid rgba(212,175,55,0.18)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
        <Trophy className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#d4af37' }}>
          Leaderboard
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-1.5 text-[11px] font-black uppercase transition-all"
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              letterSpacing: '0.08em',
              color: tab === t ? '#d4af37' : 'rgba(255,255,255,0.35)',
              background: tab === t ? 'rgba(212,175,55,0.08)' : 'transparent',
              borderBottom: tab === t ? '2px solid #d4af37' : '2px solid transparent',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Board */}
      <div className="p-2.5 space-y-1">
        {ranked.length === 0 && (
          <p className="text-center text-[11px] py-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
            No activity yet
          </p>
        )}
        {ranked.slice(0, 5).map((m, i) => (
          <motion.div key={m.user_id}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
            style={{ background: i === 0 ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)', border: i === 0 ? '1px solid rgba(212,175,55,0.2)' : '1px solid transparent' }}>
            <span className="text-sm w-5 text-center shrink-0">{RANK_ICONS[i]}</span>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: getColor(m.user_name) + '50', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
              {m.user_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span className="text-[11px] font-bold text-white flex-1 truncate">{m.user_name}</span>
            <div className="flex items-center gap-1 shrink-0">
              {i === 0 && <TrendingUp className="w-2.5 h-2.5" style={{ color: '#d4af37' }} />}
              <span className="text-[11px] font-black tabular-nums" style={{ color: RANK_COLORS[i] || 'rgba(255,255,255,0.3)' }}>
                {m.score}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}