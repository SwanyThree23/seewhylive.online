import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Swords, ArrowRight, Trophy, TrendingUp, Clock, Plus, Radio } from 'lucide-react';
import PKBattleProgress from '@/components/pk/PKBattleProgress';
import PKBattleVotePanel from '@/components/pk/PKBattleVotePanel';
import PKInviteModal from '@/components/pk/PKInviteModal';
import BattleMode from '../components/streaming/BattleMode';
import ContentRecommendations from '../components/social/ContentRecommendations';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import ShopDashboard from '../components/merch/ShopDashboard';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CreatorBridge from '../components/social/CreatorBridge';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import BitratePresets from '../components/streaming/BitratePresets';
import GuestRTMPPanel from '../components/streaming/GuestRTMPPanel';
import GuestStreamMonitor from '../components/streaming/GuestStreamMonitor';
import TranscriptionPanel from '../components/streaming/TranscriptionPanel';

var BG = '#080B18';
var GOLD = '#D4AF37';
var CRIMSON = '#800020';
var SCARLET = '#C0392B';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };

function BattleListItem({ battle, isSelected, onClick }) {
  var creatorScore = (battle.creator_tips || 0) + (battle.creator_subs || 0) * 10;
  var challengerScore = (battle.challenger_tips || 0) + (battle.challenger_subs || 0) * 10;
  var total = creatorScore + challengerScore || 1;
  var creatorPct = Math.round((creatorScore / total) * 100);

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
  var [showInviteModal, setShowInviteModal] = useState(false);
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, null);

  var [selectedBattle, setSelectedBattle] = useState(null);
  var [selectedBitrate, setSelectedBitrate] = useState(3000);
  var [tab, setTab] = useState('active');
  var [votes, setVotes] = useState({});

  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  var { data: activeBattles = [] } = useQuery({
    queryKey: ['activePKBattles'],
    queryFn: () => base44.entities.PKBattle.filter({ status: ['pending', 'accepted', 'active'] }, '-created_date', 20),
    refetchInterval: 5000,
  });

  var { data: endedBattles = [] } = useQuery({
    queryKey: ['endedPKBattles'],
    queryFn: () => base44.entities.PKBattle.filter({ status: 'ended' }, '-ended_at', 10),
  });

  var { data: creators = [] } = useQuery({
    queryKey: ['allCreators'],
    queryFn: () => base44.entities.CreatorProfile.list().then(function(p) { return (p && p.slice(0, 10)) || []; }),
  });

  var battles = tab === 'active' ? activeBattles : endedBattles;
  var displayBattle = selectedBattle || activeBattles[0];
  var activeBattle = displayBattle;

  var totalActiveBattles = activeBattles.filter(b => b.status === 'active').length;
  var pendingBattles = activeBattles.filter(b => b.status === 'pending').length;
  var totalPoints = activeBattles.reduce((sum, b) =>
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
                      isSelected={displayBattle && displayBattle.id === battle.id}
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
                    var cScore = (battle.creator_tips || 0) + (battle.creator_subs || 0) * 10;
                    var chScore = (battle.challenger_tips || 0) + (battle.challenger_subs || 0) * 10;
                    var winner = cScore >= chScore ? battle.creator_name : battle.challenger_name;
                    var winnerScore = Math.max(cScore, chScore);
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
      <SwanAIRecommendations roomId={(activeBattle && activeBattle.id) || null} currentLayout="battle" viewerCount={(battles && battles.length) || 0} />
      <MilestoneAlerts userId={user && user.id} roomId={(activeBattle && activeBattle.id) || null} />
      {user && user.id && <AlertConfig creatorId={user.id} />}
      {user && user.id && <ShopDashboard creatorId={user.id} />}
      {activeBattle && activeBattle.id && <BattleMode roomId={activeBattle.id} isHost={true} hostName={(user && user.full_name) || ''} />}
      {<BitratePresets selected={selectedBitrate} onChange={setSelectedBitrate} />}
      {user && user.id && <GuestRTMPPanel participantId={user.id} userId={user.id} />}
      {<GuestStreamMonitor guestName={(user && user.full_name) || ''} isStreaming={activeBattle && activeBattle.status === 'active'} />}
      {activeBattle && activeBattle.id && <TranscriptionPanel recordingUrl={''} roomTitle={''} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={(battles && battles.length) || 0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={(activeBattle && activeBattle.id) || null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={(battles && battles.length) || 0} peakViewers={(battles && battles.length) || 0} />
      {/* Creator Studios */}
      <div style={{ margin: '0 0 16px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
        <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
            { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
          ].map(function(s) {
            return (
              <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 2 }}>{s.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
            🎬 Launch Episode Creator Studio →
          </div>
        </Link>
      </div>
      <BackgroundCustomizer />
    </div>
  );
}