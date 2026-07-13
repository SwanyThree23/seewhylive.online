import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Swords, ArrowRight, Trophy, TrendingUp, Clock, Plus, Radio } from 'lucide-react';
import PKBattleProgress from '@/components/pk/PKBattleProgress';
import PKBattleVotePanel from '@/components/pk/PKBattleVotePanel';
import PKInviteModal from '@/components/pk/PKInviteModal';
import TournamentBracket from '../components/pk/TournamentBracket';
import BattleMode from '../components/streaming/BattleMode';
import BattleScoreboard from '../components/live/BattleScoreboard';
import BattleOverlay from '../components/pk/BattleOverlay';
import MatchmakingQueue from '../components/pk/MatchmakingQueue';
import PKBattleSoundboard from '../components/live/PKBattleSoundboard';
import PKAnalyticsDashboard from '../components/pk/PKAnalyticsDashboard';
import PKBattleInterface from '../components/pk/PKBattleInterface';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const SCARLET = '#C0392B';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function BattleListItem({ battle, isSelected, onClick }) {
  const creatorScore = (battle.creator_tips || 0) + (battle.creator_subs || 0) * 10;
  const challengerScore = (battle.challenger_tips || 0) + (battle.challenger_subs || 0) * 10;
  const total = creatorScore + challengerScore || 1;
  const creatorPct = Math.round((creatorScore / total) * 100);

  return (
    <motion.button whileHover={{ x: 3 }} onClick={onClick}
      className="w-full p-3 rounded-xl text-left transition-all"
      style={{ background: isSelected ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isSelected ? 'rgba(212,175,55,0.3)' : 'rgba(212,175,55,0.1)'}` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-black text-xs text-white truncate" style={T}>{battle.creator_name}</span>
          <ArrowRight className="w-3 h-3 shrink-0" style={{ color: SCARLET }} />
          <span className="font-black text-xs text-white truncate" style={T}>{battle.challenger_name}</span>
        </div>
        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ml-1"
          style={{ ...T, background: battle.status === 'active' ? 'rgba(192,57,43,0.15)' : 'rgba(212,175,55,0.1)', border: `1px solid ${battle.status === 'active' ? 'rgba(192,57,43,0.4)' : 'rgba(212,175,55,0.2)'}`, color: battle.status === 'active' ? SCARLET : GOLD }}>
          {battle.status === 'active' ? '● LIVE' : battle.status}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${creatorPct}%`, background: `linear-gradient(90deg, ${GOLD}, ${CRIMSON})` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] font-black" style={{ color: GOLD }}>{creatorScore} pts</span>
        <span className="text-[10px] font-black" style={{ color: SCARLET }}>{challengerScore} pts</span>
      </div>
    </motion.button>
  );
}

export default function PKBattlePage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [tab, setTab] = useState('active');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: activeBattles = [] } = useQuery({
    queryKey: ['activePKBattles'],
    queryFn: () => base44.entities.PKBattle.filter({ status: ['pending', 'accepted', 'active'] }, '-created_date', 20),
    refetchInterval: 5000,
  });

  const { data: endedBattles = [] } = useQuery({
    queryKey: ['endedPKBattles'],
    queryFn: () => base44.entities.PKBattle.filter({ status: 'ended' }, '-ended_at', 10),
  });

  const { data: creators = [] } = useQuery({
    queryKey: ['allCreators'],
    queryFn: () => base44.entities.CreatorProfile.list().then(p => p?.slice(0, 10) || []),
  });

  const battles = tab === 'active' ? activeBattles : endedBattles;
  const displayBattle = selectedBattle || activeBattles[0];

  const totalActiveBattles = activeBattles.filter(b => b.status === 'active').length;
  const pendingBattles = activeBattles.filter(b => b.status === 'pending').length;
  const totalPoints = activeBattles.reduce((sum, b) =>
    sum + (b.creator_tips || 0) + (b.creator_subs || 0) * 10 + (b.challenger_tips || 0) + (b.challenger_subs || 0) * 10, 0);

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 border-b flex items-center justify-between flex-wrap gap-3"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Swords className="w-5 h-5" style={{ color: SCARLET }} />
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>PK Battles</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Streamer vs. Streamer — viewers vote with tips &amp; subs</p>
          </div>
        </div>
        {user && (
          <button onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-xs"
            style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer' }}>
            <Plus className="w-3.5 h-3.5" /> Start Battle
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Live Battles', value: totalActiveBattles, icon: Radio, color: SCARLET },
            { label: 'Pending', value: pendingBattles, icon: Clock, color: GOLD },
            { label: 'Total Points', value: totalPoints.toLocaleString(), icon: TrendingUp, color: '#6DBF7E' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-3 rounded-2xl text-center" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
              <p className="text-xl font-black" style={{ color, fontFamily: 'Orbitron, monospace' }}>{value}</p>
              <p className="text-[10px] font-black uppercase" style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Main battle display */}
          <div className="md:col-span-2 space-y-4">
            {displayBattle ? (
              <AnimatePresence mode="wait">
                <motion.div key={displayBattle.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-4">
                  <PKBattleProgress battleId={displayBattle.id} />
                  {displayBattle.status === 'active' && (
                    <PKBattleVotePanel
                      battleId={displayBattle.id}
                      creatorId={displayBattle.creator_id}
                      challengerId={displayBattle.challenger_id}
                      creatorName={displayBattle.creator_name}
                      challengerName={displayBattle.challenger_name}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                <Swords className="w-14 h-14 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.08)' }} />
                <p className="font-black text-lg text-white mb-1" style={T}>No Active Battles</p>
                <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>Be the first to start a battle!</p>
                {user && (
                  <button onClick={() => setShowInviteModal(true)}
                    className="px-6 py-2.5 rounded-xl font-black uppercase text-sm"
                    style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer' }}>
                    Challenge a Creator
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Battle list tabs */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {[
                  { id: 'active', label: 'Active' },
                  { id: 'recent', label: 'Recent' },
                ].map(t => (
                  <button key={t.id} onClick={() => { setTab(t.id); setSelectedBattle(null); }}
                    className="flex-1 py-2.5 text-[11px] font-black uppercase border-b-2 transition-all"
                    style={{ ...T, color: tab === t.id ? GOLD : 'rgba(255,255,255,0.3)', borderBottomColor: tab === t.id ? GOLD : 'transparent', background: 'transparent' }}>
                    {t.label}
                    {t.id === 'active' && activeBattles.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px]"
                        style={{ background: 'rgba(192,57,43,0.2)', color: SCARLET }}>{activeBattles.length}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                {battles.length === 0 ? (
                  <p className="text-center py-6 text-xs" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
                    {tab === 'active' ? 'No active battles' : 'No recent battles'}
                  </p>
                ) : (
                  battles.map(battle => (
                    <BattleListItem
                      key={battle.id}
                      battle={battle}
                      isSelected={displayBattle?.id === battle.id}
                      onClick={() => setSelectedBattle(battle)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Leaderboard */}
            {endedBattles.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5" style={{ color: GOLD }} />
                    <p className="font-black text-xs text-white uppercase" style={T}>Recent Winners</p>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {endedBattles.slice(0, 5).map((battle, idx) => {
                    const cScore = (battle.creator_tips || 0) + (battle.creator_subs || 0) * 10;
                    const chScore = (battle.challenger_tips || 0) + (battle.challenger_subs || 0) * 10;
                    const winner = cScore >= chScore ? battle.creator_name : battle.challenger_name;
                    const winnerScore = Math.max(cScore, chScore);
                    return (
                      <div key={battle.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-black w-5 text-center" style={{ color: idx === 0 ? GOLD : 'rgba(255,255,255,0.3)', ...T }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-xs text-white truncate" style={T}>{winner}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{winnerScore} pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA for logged-in users */}
            {user && (
              <div className="rounded-2xl p-4" style={{ background: `${CRIMSON}18`, border: `1px solid ${CRIMSON}40` }}>
                <h4 className="font-black text-sm mb-1" style={{ color: GOLD, ...T }}>Host a Battle</h4>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Challenge a creator. Viewers vote with tips and subs. Biggest score wins.
                </p>
                <button onClick={() => setShowInviteModal(true)}
                  className="w-full py-2 rounded-xl font-black uppercase text-xs"
                  style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer' }}>
                  Challenge Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <PKInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        creators={creators}
      />

      {/* Battle Mode + Scoreboard for active battle */}
      {displayBattle?.id && (
        <div className="px-4 md:px-8 max-w-7xl mx-auto mt-6 space-y-4">
          <BattleMode roomId={displayBattle.id} isHost={user?.id === displayBattle.challenger_id} hostName={user?.full_name || ''} participants={[]} />
          <BattleScoreboard roomId={displayBattle.id} />
          <BattleOverlay battle={displayBattle} onBattleUpdate={() => {}} />
        </div>
      )}

      {/* PK Battle soundboard */}
      {displayBattle?.id && (
        <div className="px-4 md:px-8 max-w-7xl mx-auto mt-6">
          <PKBattleSoundboard battleId={displayBattle.id} isBattleActive={displayBattle.status === 'active'} />
        </div>
      )}

      {/* Matchmaking queue */}
      {user && (
        <div className="px-4 md:px-8 max-w-7xl mx-auto mt-6">
          <MatchmakingQueue user={user} onMatchFound={() => {}} />
        </div>
      )}

      {/* Tournament Bracket */}
      <div className="px-4 md:px-8 max-w-7xl mx-auto mt-6">
        <TournamentBracket />
      </div>

      {/* PK Analytics Dashboard */}
      {battles && battles.length > 0 && (
        <div className="px-4 md:px-8 max-w-7xl mx-auto mt-6">
          <PKAnalyticsDashboard battles={battles} user={user} />
        </div>
      )}

      {/* PK Battle Interface */}
      {displayBattle?.id && (
        <div className="px-4 md:px-8 max-w-7xl mx-auto mt-6">
          <PKBattleInterface roomId={displayBattle.id} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px 24px' }}>
        <OnlineUsersGrid compact maxVisible={10} />
        <ContentRecommendations />
        <MilestoneAlerts userId={user?.id} roomId={null} />
        <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      </div>
    </div>
  );
}