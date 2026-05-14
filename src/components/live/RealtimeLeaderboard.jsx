import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Trophy, TrendingUp } from 'lucide-react';

const G = '#d4af37';

export default function RealtimeLeaderboard({ roomId, creatorId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeRange, setTimeRange] = useState('live');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const entries = await base44.entities.ViewerPoints.filter(
          { room_id: roomId },
          '-points',
          10
        );
        setLeaderboard(entries || []);
      } catch (error) {
        console.error('Leaderboard fetch error:', error);
      }
      setLoading(false);
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  return (
    <div className="p-3 rounded-lg space-y-2" style={{ background: 'rgba(7,7,15,0.95)', border: `1px solid ${G}20` }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: G }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: G }}>Leaderboard</span>
        </div>
        <div className="flex gap-1">
          {['live', 'session', 'all-time'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className="px-2 py-1 text-[10px] font-bold rounded transition-all"
              style={{
                background: timeRange === range ? `${G}20` : 'rgba(255,255,255,0.03)',
                color: timeRange === range ? G : 'rgba(255,255,255,0.4)',
              }}
            >
              {range === 'live' ? 'Live' : range === 'session' ? 'Session' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {leaderboard.map((entry, idx) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center justify-between p-2 rounded text-xs"
              style={{
                background: idx === 0 ? `${G}12` : 'rgba(255,255,255,0.03)',
                borderLeft: idx === 0 ? `2px solid ${G}` : '2px solid transparent',
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-black w-5" style={{ color: idx === 0 ? G : 'rgba(255,255,255,0.5)' }}>
                  {idx + 1}
                </span>
                <span className="text-white/70 truncate">{entry.user_name || `User ${entry.user_id.slice(0, 4)}`}</span>
              </div>
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="font-bold"
                style={{ color: idx === 0 ? G : '#00F5FF' }}
              >
                {entry.points}
              </motion.span>
            </motion.div>
          ))}
        </AnimatePresence>

        {leaderboard.length === 0 && (
          <div className="text-center py-3 text-[10px] text-white/30">
            {loading ? 'Loading...' : 'No activity yet'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-[9px] text-white/20 pt-1 border-t border-white/10">
        Real-time points tracking · Tips, subs, polls, interactions
      </div>
    </div>
  );
}