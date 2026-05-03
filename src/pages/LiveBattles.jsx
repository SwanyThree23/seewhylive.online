import React, { useState } from 'react';

import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Plus, ArrowLeft, Trophy, Clock, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, formatDistanceToNow } from 'date-fns';

function BattleCard({ battle, index }) {
  const names = battle.title?.split(' vs ') || ['?', '?'];
  const [leftName, rightName] = names;
  const leftVotes = battle.current_bid || 0;
  const rightVotes = battle.bid_count || 0;
  const total = leftVotes + rightVotes || 1;
  const leftPct = Math.round((leftVotes / total) * 100);
  const isActive = battle.status === 'active';
  const isEnded = battle.status === 'ended';
  const endsAt = battle.ends_at ? new Date(battle.ends_at) : null;
  const timeRemaining = endsAt && isActive ? formatDistanceToNow(endsAt, { addSuffix: true }) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className="bg-gradient-to-br from-[#0d0618] to-[#1a0a30] border border-[#d4af37]/15 rounded-2xl overflow-hidden hover:border-[#d4af37]/30 transition-all"
    >
      {/* Status bar */}
      <div className={`h-1 w-full ${isActive ? 'bg-gradient-to-r from-red-600 to-[#d4af37] animate-pulse' : 'bg-white/10'}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-700 to-[#d4af37] flex items-center justify-center">
              <Swords className="w-4 h-4 text-white" />
            </div>
            <div>
              {isActive && <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-[9px] mb-0.5">⚡ LIVE</Badge>}
              {isEnded && <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30 text-[9px] mb-0.5">ENDED</Badge>}
              <p className="text-xs text-white/40">PK Battle</p>
            </div>
          </div>
          {timeRemaining && (
            <div className="flex items-center gap-1 text-[11px] text-[#d4af37]/80">
              <Clock className="w-3 h-3" />
              <span>{timeRemaining}</span>
            </div>
          )}
        </div>

        {/* VS display */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-900/40 border-2 border-blue-600/40 flex items-center justify-center text-xl font-black text-blue-300 mx-auto mb-1">
              {leftName?.charAt(0)?.toUpperCase()}
            </div>
            <p className="text-sm font-bold text-white truncate">{leftName}</p>
            <p className="text-lg font-black text-blue-400 font-mono">{leftVotes.toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[#d4af37] font-black text-sm">VS</span>
            <div className="w-px h-8 bg-[#d4af37]/20" />
          </div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 rounded-full bg-red-900/40 border-2 border-red-600/40 flex items-center justify-center text-xl font-black text-red-300 mx-auto mb-1">
              {rightName?.charAt(0)?.toUpperCase()}
            </div>
            <p className="text-sm font-bold text-white truncate">{rightName}</p>
            <p className="text-lg font-black text-red-400 font-mono">{rightVotes.toLocaleString()}</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="h-2 rounded-full flex overflow-hidden bg-white/10 mb-3">
          <div className="bg-blue-500 transition-all duration-500" style={{ width: `${leftPct}%` }} />
          <div className="bg-red-500 transition-all duration-500" style={{ width: `${100 - leftPct}%` }} />
        </div>

        <Link to={`${createPageUrl('PKBattlePage')}?id=${battle.id}`}>
          <Button
            className={`w-full text-xs font-bold ${
              isActive
                ? 'bg-gradient-to-r from-blue-600 to-red-600 hover:opacity-90 text-white'
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
            size="sm"
          >
            {isActive ? (
              <><Zap className="w-3.5 h-3.5 mr-1.5" /> Join Battle</>
            ) : (
              <><Trophy className="w-3.5 h-3.5 mr-1.5" /> View Results</>
            )}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function LiveBattles() {
  const [filter, setFilter] = useState('active');

  const { data: battles = [], isLoading } = useQuery({
    queryKey: ['battles', filter],
    queryFn: () => filter === 'all'
      ? base44.entities.LiveAuction.filter({ auction_type: 'experience' }, '-created_date', 30)
      : base44.entities.LiveAuction.filter({ auction_type: 'experience', status: filter }, '-created_date', 20),
    refetchInterval: 10000,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0618] via-[#15021f] to-[#0d0618] text-white">
      {/* Header */}
      <div className="border-b border-[#d4af37]/15 bg-black/40 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4 mb-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="sm" className="text-white/40 hover:text-white gap-1.5 hidden sm:flex">
                <ArrowLeft className="w-4 h-4" /> Home
              </Button>
            </Link>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-[#d4af37] flex items-center justify-center">
                <Swords className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white">Live Battles</h1>
                <p className="text-[11px] text-white/40">Head-to-head PK showdowns</p>
              </div>
            </div>
            <Link to={createPageUrl('PKBattlePage')}>
              <Button className="bg-gradient-to-r from-blue-600 to-red-600 text-white font-bold gap-1.5 hover:opacity-90">
                <Plus className="w-4 h-4" /> Start Battle
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {[
              { key: 'active', label: '⚡ Live Now' },
              { key: 'ended', label: '🏆 Ended' },
              { key: 'all', label: '📋 All' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  filter === f.key
                    ? 'bg-[#d4af37] border-[#d4af37] text-black font-bold'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                {f.label}
              </button>
            ))}
            {battles.length > 0 && (
              <span className="ml-auto text-[11px] text-white/30 self-center">{battles.length} battle{battles.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : battles.length === 0 ? (
          <div className="text-center py-24">
            <Swords className="w-16 h-16 mx-auto text-[#d4af37]/20 mb-4" />
            <h3 className="text-xl font-bold text-white/40 mb-2">
              {filter === 'active' ? 'No live battles right now' : 'No battles found'}
            </h3>
            <p className="text-white/25 text-sm mb-6">
              {filter === 'active' ? 'Be the first to start a PK battle!' : 'Check back later'}
            </p>
            <Link to={createPageUrl('PKBattlePage')}>
              <Button className="bg-gradient-to-r from-blue-600 to-red-600 text-white font-bold gap-2">
                <Plus className="w-4 h-4" /> Create First Battle
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {battles.map((battle, i) => (
              <BattleCard key={battle.id} battle={battle} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}