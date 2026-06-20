import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Gift, Trophy, Users, Zap, Download, Trash2, X, Check } from 'lucide-react';
import RedemptionQueue from '../components/loyalty/RedemptionQueue';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import EngagementBadgesDisplay from '../components/live/EngagementBadgesDisplay';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import RewardShopEditor from '../components/loyalty/RewardShopEditor';
import LeaderboardPanel from '../components/live/LeaderboardPanel';
import LoyaltyBadge from '../components/rooms/LoyaltyBadge';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import SpotlightBanner from '../components/community/SpotlightBanner';

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 99, background: checked ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );
}
import { toast } from 'sonner';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const inp = { width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };

const REWARD_TYPES = [
  { id: 'badge', label: '🏅 Badge', icon: '🏅' },
  { id: 'discount_code', label: '🎟 Discount Code', icon: '🎟' },
  { id: 'exclusive_content', label: '🔒 Exclusive Content', icon: '🔒' },
  { id: 'shoutout', label: '📣 Shoutout', icon: '📣' },
  { id: 'custom_emote', label: '😎 Custom Emote', icon: '😎' },
];

const TIER_COLORS = ['#cd7f32', '#c0c0c0', '#d4af37', '#D4854A', '#C0392B'];

export default function LoyaltyProgram() {
  const qc = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const creatorId = urlParams.get('creator');
  const [activeTab, setActiveTab] = useState(null);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [rewardForm, setRewardForm] = useState({ name: '', description: '', points_required: 100, reward_type: 'badge', reward_value: '', is_active: true });
  const [earnConfig] = useState({ watch: 1, message: 2, tip: 10, subscribe: 100, reaction: 1 });

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', user?.id],
    queryFn: () => base44.entities.Community.filter({ owner_id: user?.id }).then(r => r[0] || null),
    enabled: !!user?.id,
  });
  const userCommunityId = userCommunity?.id || null;
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;
  const { data: activeChallenge } = useQuery({
    queryKey: ['activeChallenge'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'active' }, '-created_date', 1).then(r => r[0] || null),
    enabled: true,
  });
  const activeChallengeId = activeChallenge?.id || null;
  const roomId = new URLSearchParams(window.location.search).get('room_id');
  const isOwnProgram = !creatorId || creatorId === user?.id;

  React.useEffect(() => {
    setActiveTab(isOwnProgram ? 'creator' : 'viewer');
  }, [isOwnProgram]);

  const { data: rewards = [] } = useQuery({
    queryKey: ['loyalty-rewards', creatorId || user?.id],
    queryFn: () => base44.entities.LoyaltyReward.filter({ creator_id: creatorId || user?.id }, 'points_required'),
    enabled: !!(user || creatorId),
  });
  const { data: myPoints } = useQuery({
    queryKey: ['my-viewer-points', user?.id, creatorId],
    queryFn: () => base44.entities.ViewerPoints.filter({ user_id: user?.id, room_id: creatorId }).then(r => r[0]),
    enabled: !!user && !!creatorId,
  });
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['points-leaderboard', creatorId || user?.id],
    queryFn: () => base44.entities.ViewerPoints.filter({ room_id: creatorId || user?.id }, '-points', 50),
    enabled: !!(user || creatorId),
  });

  const createRewardMutation = useMutation({
    mutationFn: (data) => base44.entities.LoyaltyReward.create(data),
    onSuccess: (reward) => {
      qc.invalidateQueries({ queryKey: ['loyalty-rewards'] });
      setShowRewardForm(false);
      toast.success('Reward created!');
      if (user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'milestone',
          title: `Created loyalty reward: ${reward?.name || 'Reward'}`,
        }).catch(() => {});
      }
    },
  });
  const toggleRewardMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.LoyaltyReward.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty-rewards'] }),
  });
  const deleteRewardMutation = useMutation({
    mutationFn: (id) => base44.entities.LoyaltyReward.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty-rewards'] }),
  });

  const totalDistributed = leaderboard.reduce((s, l) => s + (l.points || 0), 0);
  const userPoints = myPoints?.points || 0;
  const sortedRewards = [...rewards].sort((a, b) => a.points_required - b.points_required);
  const nextReward = sortedRewards.find(r => r.points_required > userPoints);
  const progressToNext = nextReward ? (userPoints / nextReward.points_required) * 100 : 100;

  const exportData = () => {
    const rows = leaderboard.map((l, i) => `${i + 1},${l.user_id},${l.points},${l.watch_minutes},${l.messages_sent_count}`);
    const csv = 'Rank,UserID,Points,WatchMinutes,Messages\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'loyalty-data.csv'; a.click();
  };

  const TABS = isOwnProgram
    ? [{ id: 'creator', label: 'Creator View' }, { id: 'rewards', label: 'Rewards' }, { id: 'leaderboard', label: 'Leaderboard' }]
    : [{ id: 'viewer', label: 'My Progress' }, { id: 'rewards', label: 'Rewards' }, { id: 'leaderboard', label: 'Leaderboard' }];

  const tab = activeTab || TABS[0]?.id;

  return (
    <div className="min-h-screen pb-10 text-white" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5" style={{ color: GOLD }} />
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>Loyalty Program</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isOwnProgram ? 'Manage your viewer rewards' : 'Earn points and redeem rewards'}
            </p>
          </div>
        </div>
        {isOwnProgram && (
          <div className="flex gap-2">
            <button onClick={exportData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase text-[10px]"
              style={{ ...T, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              <Download className="w-3 h-3" /> Export
            </button>
            <button onClick={() => setShowRewardForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black uppercase text-xs"
              style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer' }}>
              <Plus className="w-4 h-4" /> Add Reward
            </button>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-4 space-y-4">
        {/* Tab bar */}
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-4 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all"
              style={{ ...T, color: tab === t.id ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: tab === t.id ? GOLD : 'transparent', background: 'transparent' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Creator View */}
        {tab === 'creator' && isOwnProgram && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Total Points Distributed', value: totalDistributed.toLocaleString(), color: GOLD, icon: Star },
                { label: 'Active Viewers', value: leaderboard.length, color: GOLD, icon: Users },
                { label: 'Active Rewards', value: rewards.filter(r => r.is_active).length, color: '#6DBF7E', icon: Gift },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl p-4"
                  style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                  <p className="text-[10px] font-black uppercase mb-1" style={{ ...T, color: 'rgba(255,255,255,0.35)' }}>{stat.label}</p>
                  <p className="text-2xl font-black" style={{ fontFamily: 'Orbitron, monospace', color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
              <p className="font-black text-sm mb-3" style={{ ...T, color: GOLD }}>Points Earn Rate</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Watch (per min)', value: earnConfig.watch, icon: '⏱' },
                  { label: 'Message sent', value: earnConfig.message, icon: '💬' },
                  { label: 'Per $1 tipped', value: earnConfig.tip, icon: '💰' },
                  { label: 'Subscribe bonus', value: earnConfig.subscribe, icon: '⭐' },
                  { label: 'Reaction', value: earnConfig.reaction, icon: '❤️' },
                ].map(e => (
                  <div key={e.label} className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <span className="text-xl">{e.icon}</span>
                    <p className="text-lg font-black mt-1" style={{ fontFamily: 'Orbitron, monospace', color: '#D4AF37' }}>+{e.value}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{e.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Viewer View */}
        {tab === 'viewer' && !isOwnProgram && (
          <div className="rounded-2xl p-6" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${GOLD}, ${CRIMSON})` }}>
                <Star className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black" style={{ fontFamily: 'Orbitron, monospace', color: '#D4AF37' }}>
                  {userPoints.toLocaleString()} pts
                </p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {nextReward ? `${(nextReward.points_required - userPoints).toLocaleString()} pts to ${nextReward.name}` : 'All rewards unlocked! 🎉'}
                </p>
              </div>
            </div>
            {nextReward && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Progress to {nextReward.name}</span>
                  <span className="font-black" style={{ color: '#D4AF37' }}>{Math.round(progressToNext)}%</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${GOLD}, #D4AF37)` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rewards */}
        {tab === 'rewards' && (
          sortedRewards.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
              <Gift className="w-12 h-12 mx-auto opacity-20 mb-3" style={{ color: GOLD }} />
              <p className="font-black uppercase text-xs" style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>No rewards configured yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedRewards.map((r, i) => {
                const canClaim = !isOwnProgram && userPoints >= r.points_required;
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="rounded-2xl p-4 flex items-center gap-4 transition-all"
                      style={{ background: 'rgba(8,11,24,0.9)', border: `1px solid ${canClaim ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: `${TIER_COLORS[i % 5]}20`, border: `1px solid ${TIER_COLORS[i % 5]}40` }}>
                        {REWARD_TYPES.find(rt => rt.id === r.reward_type)?.icon || '🎁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-sm text-white" style={T}>{r.name}</p>
                          {!r.is_active && (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
                              style={{ ...T, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-black" style={{ color: TIER_COLORS[i % 5], ...T }}>{r.points_required.toLocaleString()} pts</span>
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{r.claimed_count || 0} claimed</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isOwnProgram ? (
                          <div className="flex gap-1.5 items-center">
                            <Toggle checked={r.is_active} onChange={v => toggleRewardMutation.mutate({ id: r.id, is_active: v })} />
                            <button onClick={() => deleteRewardMutation.mutate(r.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer' }}>
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : canClaim ? (
                          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-black uppercase text-[10px]"
                            style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer' }}>
                            <Gift className="w-3 h-3" /> Redeem
                          </button>
                        ) : (
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{(r.points_required - userPoints).toLocaleString()} more</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}

        {/* Leaderboard */}
        {tab === 'leaderboard' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div className="px-5 py-4 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <Trophy className="w-4 h-4" style={{ color: GOLD }} />
              <p className="font-black text-sm text-white" style={T}>Top Viewers</p>
            </div>
            <div className="p-4 space-y-2">
              {leaderboard.slice(0, 50).map((l, i) => (
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: i < 3 ? `rgba(212,175,55,0.05)` : 'rgba(255,255,255,0.02)', border: `1px solid ${i < 3 ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)'}` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                    style={{ background: i < 3 ? `${TIER_COLORS[2 - i]}20` : 'rgba(255,255,255,0.05)', color: i < 3 ? TIER_COLORS[2 - i] : 'rgba(255,255,255,0.4)' }}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate" style={T}>{l.user_id?.slice(0, 8) || 'Anonymous'}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{l.watch_minutes || 0}min watched</p>
                  </div>
                  <p className="font-black text-sm" style={{ fontFamily: 'Orbitron, monospace', color: '#D4AF37' }}>{(l.points || 0).toLocaleString()} pts</p>
                </div>
              ))}
              {leaderboard.length === 0 && <p className="text-center py-8" style={{ color: 'rgba(255,255,255,0.25)' }}>No viewers yet</p>}
            </div>
          </div>
        )}
      </div>

      {/* Add Reward Modal */}
      <AnimatePresence>
        {showRewardForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.7)' }}
              onClick={() => setShowRewardForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl overflow-hidden z-50"
              style={{ background: 'rgba(8,11,24,0.98)', border: '1px solid rgba(212,175,55,0.25)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <p className="font-black text-sm text-white" style={T}>Create Reward</p>
                <button onClick={() => setShowRewardForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <input value={rewardForm.name} onChange={e => setRewardForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Reward name" style={inp} />
                <input value={rewardForm.description} onChange={e => setRewardForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description" style={inp} />
                <input type="number" value={rewardForm.points_required}
                  onChange={e => setRewardForm(f => ({ ...f, points_required: Number(e.target.value) }))}
                  placeholder="Points required" style={inp} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {REWARD_TYPES.map(rt => (
                    <button key={rt.id} onClick={() => setRewardForm(f => ({ ...f, reward_type: rt.id }))}
                      style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: `1px solid ${rewardForm.reward_type === rt.id ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: rewardForm.reward_type === rt.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: rewardForm.reward_type === rt.id ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                      {rt.label}
                    </button>
                  ))}
                </div>
                <input value={rewardForm.reward_value} onChange={e => setRewardForm(f => ({ ...f, reward_value: e.target.value }))}
                  placeholder="Reward value (badge name, code, etc.)" style={inp} />
                <button onClick={() => createRewardMutation.mutate({ ...rewardForm, creator_id: user?.id })}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase text-sm mt-2"
                  style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer' }}>
                  <Check className="w-4 h-4" /> Create Reward
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reward shop editor and redemption queue for admins */}
      {isOwnProgram && user?.id && (
        <div style={{ padding: '0 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RewardShopEditor creatorId={user.id} />
          <RedemptionQueue creatorId={user.id} />
        </div>
      )}

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <LeaderboardPanel roomId={roomId} />
        {user?.id && <LoyaltyBadge userId={user.id} creatorId={creatorId || null} />}
      </div>

      <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {user?.id && <MilestoneAlerts creatorId={user.id} />}
        <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
        <OnlineUsersGrid compact maxVisible={10} />
        <ContentRecommendations />
        <SwanAIRecommendations roomId={activeRoomId} currentLayout="default" viewerCount={0} />
        <EngagementBadgesDisplay roomId={activeRoomId} userId={user?.id} creatorId={user?.id} />
        <ChallengeLeaderboard challengeId={activeChallengeId} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 16px 28px' }}>
        {[
          { label: '🏆 Loyalty Hub',  href: 'LoyaltyHub'    },
          { label: '🛍 Reward Shop',  href: 'RewardShop'    },
          { label: '🔴 Go Live',      href: 'GoLive'        },
          { label: '📊 Analytics',    href: 'Analytics'     },
        ].map(item => (
          <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
            <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', cursor: 'pointer' }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
