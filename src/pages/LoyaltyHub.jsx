import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Star, Flame, Gift, Clock, ChevronDown, ChevronUp, Users, MessageSquare, DollarSign, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import ViewerLoyaltyCard from '../components/loyalty/ViewerLoyaltyCard';
import PointsEarnWidget from '../components/loyalty/PointsEarnWidget';
import RealtimeLeaderboard from '../components/live/RealtimeLeaderboard';
import RewardShop from '../components/loyalty/RewardShop';
import RedemptionQueue from '../components/loyalty/RedemptionQueue';
import RewardShopEditor from '../components/loyalty/RewardShopEditor';
import LiveAuctionWidget from '../components/monetization/LiveAuctionWidget';
import VirtualGoodsStore from '../components/monetization/VirtualGoodsStore';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import ShareToSocial from '../components/social/ShareToSocial';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';

const GOLD = '#D4AF37';
const BURGUNDY = '#800020';
const CREAM = '#F5E6D3';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TIER_MAP = {
  bronze:   { color: '#CD7F32', label: 'Bronze',   min: 0 },
  silver:   { color: '#C0C0C0', label: 'Silver',   min: 500 },
  gold:     { color: '#D4AF37', label: 'Gold',     min: 1500 },
  platinum: { color: '#E5E4E2', label: 'Platinum', min: 5000 },
  diamond:  { color: '#E8D5A3', label: 'Diamond',  min: 15000 },
};

function tierFromPoints(pts) {
  if (pts >= 15000) return 'diamond';
  if (pts >= 5000)  return 'platinum';
  if (pts >= 1500)  return 'gold';
  if (pts >= 500)   return 'silver';
  return 'bronze';
}

function nextTierPoints(pts) {
  const tiers = [500, 1500, 5000, 15000];
  return tiers.find(t => t > pts) || null;
}

function LoyaltyCard({ loyalty, isMain = false }) {
  const tier = tierFromPoints(loyalty?.loyalty_points || 0);
  const tc = TIER_MAP[tier];
  const next = nextTierPoints(loyalty?.loyalty_points || 0);
  const progress = next ? Math.min(100, ((loyalty?.loyalty_points || 0) / next) * 100) : 100;

  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background: `linear-gradient(135deg, rgba(30,10,20,0.95), rgba(8,11,24,0.95))`, border: `2px solid ${tc.color}40`, boxShadow: `0 0 30px ${tc.color}15` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: `${tc.color}20`, border: `1px solid ${tc.color}40` }}>
            <Trophy className="w-6 h-6" style={{ color: tc.color }} />
          </div>
          <div>
            <span className="font-black uppercase text-lg leading-none" style={{ color: tc.color, fontFamily: 'Orbitron, monospace' }}>{tc.label}</span>
            <p className="text-[11px] mt-0.5" style={{ color: CREAM + '40', ...T }}>Loyalty Tier</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-black text-2xl leading-none" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>
            {(loyalty?.loyalty_points || 0).toLocaleString()}
          </p>
          <p className="text-[11px]" style={{ color: CREAM + '40', ...T }}>POINTS</p>
        </div>
      </div>

      {next && (
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span style={{ color: CREAM + '40' }}>{(loyalty?.loyalty_points || 0)} / {next}</span>
            <span style={{ color: tc.color }}>{Math.round(progress)}% to next tier</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 1.2 }}
              style={{ background: `linear-gradient(90deg, ${tc.color}, ${GOLD})` }} />
          </div>
        </div>
      )}

      {isMain && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" style={{ color: '#D4854A' }} />
            <span className="font-black text-sm" style={{ color: '#D4854A' }}>{loyalty?.streak_days || 0}</span>
            <span className="text-[11px]" style={{ color: CREAM + '40' }}>day streak</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PointsBreakdownRow({ vp }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <button className="w-full flex items-center justify-between px-4 py-3" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5" style={{ color: GOLD }} />
          <span className="text-[11px] font-bold text-white">{vp.room_id?.slice(0, 16) || 'Room'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-sm" style={{ color: GOLD }}>{(vp.points || 0).toLocaleString()} pts</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-3 grid grid-cols-2 gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { icon: Clock, label: 'Watch Mins', value: vp.watch_minutes || 0 },
                { icon: MessageSquare, label: 'Messages', value: vp.messages_sent_count || 0 },
                { icon: DollarSign, label: 'Tips Sent', value: vp.tips_sent_count || 0 },
                { icon: Zap, label: 'Reactions', value: vp.reactions_sent_count || 0 },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2 pt-2">
                  <Icon className="w-3 h-3" style={{ color: GOLD + '70' }} />
                  <div>
                    <p className="text-[11px] font-black" style={{ color: GOLD }}>{value}</p>
                    <p className="text-[7px]" style={{ color: CREAM + '35' }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoyaltyHubPage() {
  const [activeTab, setActiveTab] = useState('my_card');
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;

  const { data: myLoyalties = [] } = useQuery({
    queryKey: ['lh-loyalties', user?.id],
    queryFn: () => base44.entities.ViewerLoyalty.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });
  const { data: viewerPoints = [] } = useQuery({
    queryKey: ['lh-points', user?.id],
    queryFn: () => base44.entities.ViewerPoints.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });
  const { data: allRewards = [] } = useQuery({
    queryKey: ['lh-rewards'],
    queryFn: () => base44.entities.LoyaltyReward.list('points_required', 30),
  });
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['lh-leaderboard'],
    queryFn: () => base44.entities.ViewerLoyalty.list('-loyalty_points', 10),
  });

  const qc = useQueryClient();
  const mainLoyalty = myLoyalties[0];
  const totalPoints = myLoyalties.reduce((s, l) => s + (l.loyalty_points || 0), 0);
  const totalWatchTime = viewerPoints.reduce((s, v) => s + (v.watch_minutes || 0), 0);

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      if (!mainLoyalty?.id) throw new Error('No loyalty record found');
      const newPoints = (mainLoyalty.loyalty_points || 0) - reward.points_required;
      if (newPoints < 0) throw new Error('Insufficient points');
      await base44.entities.ViewerLoyalty.update(mainLoyalty.id, { loyalty_points: newPoints });
      return reward;
    },
    onSuccess: (reward) => {
      toast.success(`Redeemed: ${reward.name}!`);
      qc.invalidateQueries({ queryKey: ['lh-loyalties', user?.id] });
      if (user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'ppv_purchase',
          title: `Redeemed loyalty reward: ${reward.name}`,
          amount: reward.points_required,
        }).catch(() => {});
      }
    },
    onError: (e) => toast.error(e.message || 'Redemption failed'),
  });

  const TABS = [
    { id: 'my_card',   label: '🃏 My Card' },
    { id: 'rewards',   label: '🎁 Rewards' },
    { id: 'points',    label: '⭐ Points' },
    { id: 'leaderboard', label: '🏆 Board' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#080B18' }}>
      {user?.id && mainLoyalty?.creator_id && (
        <PointsEarnWidget userId={user.id} creatorId={mainLoyalty.creator_id} roomId={activeRoomId} isHost={false} />
      )}
      <div className="px-4 md:px-6 py-4" style={{ background: 'rgba(8,11,24,0.9)', borderBottom: `1px solid rgba(212,175,55,0.12)` }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: GOLD }} />
              <span className="font-black uppercase text-base" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>Loyalty Hub</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded font-black uppercase"
              style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}30`, ...T }}>
              {totalPoints.toLocaleString()} total pts
            </span>
          </div>
          <div className="flex gap-0">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex-1 py-2 text-[11px] font-black uppercase transition-all border-b-2"
                style={{ ...T, color: activeTab === t.id ? GOLD : CREAM + '35', borderBottomColor: activeTab === t.id ? GOLD : 'transparent', background: activeTab === t.id ? `${GOLD}07` : 'transparent' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-5 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {activeTab === 'my_card' && (
              <div className="space-y-4">
                {mainLoyalty
                  ? <LoyaltyCard loyalty={mainLoyalty} isMain />
                  : <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(8,11,24,0.9)', border: `1px solid rgba(212,175,55,0.15)` }}>
                      <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: GOLD + '30' }} />
                      <p className="text-[12px] font-black uppercase" style={{ color: GOLD + '50', ...T }}>No loyalty data yet</p>
                      <p className="text-[10px] mt-1" style={{ color: CREAM + '30' }}>Watch streams to earn loyalty points</p>
                    </div>
                }

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Clock, label: 'Watch Time', value: `${Math.floor(totalWatchTime / 60)}h ${totalWatchTime % 60}m` },
                    { icon: Users, label: 'Rooms', value: viewerPoints.length },
                    { icon: MessageSquare, label: 'Messages', value: viewerPoints.reduce((s, v) => s + (v.messages_sent_count || 0), 0) },
                    { icon: DollarSign, label: 'Tips Sent', value: viewerPoints.reduce((s, v) => s + (v.tips_sent_count || 0), 0) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl p-3 text-center"
                      style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: GOLD + '70' }} />
                      <p className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{value}</p>
                      <p className="text-[7px]" style={{ color: CREAM + '35', ...T }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Enhanced loyalty card for primary creator */}
                {user?.id && mainLoyalty?.creator_id && (
                  <ViewerLoyaltyCard userId={user.id} creatorId={mainLoyalty.creator_id} />
                )}

                {/* Creator tabs */}
                {myLoyalties.slice(1).map(l => (
                  <div key={l.id} className="rounded-xl p-3" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-[11px] mb-2" style={{ color: CREAM + '40' }}>Creator: {l.creator_id?.slice(0,12)}</p>
                    <LoyaltyCard loyalty={l} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-4">
                {/* Reward Shop */}
                {user?.id && mainLoyalty?.creator_id && (
                  <RewardShop creatorId={mainLoyalty.creator_id} roomId={activeRoomId} currentUser={user} />
                )}

                {/* Redemption Queue */}
                {user?.id && mainLoyalty?.creator_id && (
                  <RedemptionQueue creatorId={mainLoyalty.creator_id} />
                )}

                {allRewards.length === 0
                  ? <p className="text-center py-8 text-[11px]" style={{ color: CREAM + '30' }}>No rewards available</p>
                  : allRewards.map((r, i) => {
                    const canRedeem = totalPoints >= r.points_required;
                    return (
                      <div key={r.id} className="rounded-xl p-3 flex items-center gap-3"
                        style={{ background: 'rgba(8,11,24,0.9)', border: canRedeem ? `1px solid ${GOLD}35` : '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}>
                          {['🏅','🎟','🔒','📣','😎'][i % 5]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[11px] text-white">{r.name}</p>
                          <p className="text-[11px]" style={{ color: CREAM + '40' }}>{r.description}</p>
                          <p className="text-[11px] font-black mt-0.5" style={{ color: GOLD }}>{r.points_required.toLocaleString()} pts</p>
                        </div>
                        <button
                          disabled={!canRedeem || redeemMutation.isPending}
                          onClick={() => canRedeem && redeemMutation.mutate(r)}
                          className="px-3 py-1.5 rounded-lg font-black uppercase text-[11px] shrink-0"
                          style={{ background: canRedeem ? BURGUNDY : 'rgba(255,255,255,0.05)', color: canRedeem ? GOLD : CREAM + '25', border: canRedeem ? `1px solid ${GOLD}40` : '1px solid rgba(255,255,255,0.08)', ...T, cursor: canRedeem ? 'pointer' : 'not-allowed' }}>
                          {canRedeem ? 'Redeem' : `Need ${(r.points_required - totalPoints).toLocaleString()} more`}
                        </button>
                      </div>
                    );
                  })}

                {/* How to earn guide */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[10px] font-black uppercase mb-3" style={{ color: CREAM + '50', ...T }}>How to Earn Points</p>
                  {[
                    { icon: '⏱', label: 'Watch streams', rate: '1 pt / min' },
                    { icon: '💬', label: 'Send messages', rate: '5 pts each' },
                    { icon: '💰', label: 'Send tips', rate: '10 pts each' },
                    { icon: '❤️', label: 'Reactions', rate: '2 pts each' },
                    { icon: '⭐', label: 'Subscribe', rate: '100 pts bonus' },
                  ].map(e => (
                    <div key={e.label} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-2">
                        <span>{e.icon}</span>
                        <span className="text-[10px]" style={{ color: CREAM + '60' }}>{e.label}</span>
                      </div>
                      <span className="font-black text-[11px]" style={{ color: GOLD, ...T }}>{e.rate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'points' && (
              <div className="space-y-2">
                {viewerPoints.length === 0
                  ? <p className="text-center py-8 text-[11px]" style={{ color: CREAM + '30' }}>No points data yet</p>
                  : viewerPoints.map(vp => <PointsBreakdownRow key={vp.id} vp={vp} />)
                }
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                {mainLoyalty?.creator_id && (
                  <RealtimeLeaderboard creatorId={mainLoyalty.creator_id} roomId={activeRoomId} />
                )}
                <div className="space-y-1.5">
                {leaderboard.map((l, i) => {
                  const tier = tierFromPoints(l.loyalty_points || 0);
                  const tc = TIER_MAP[tier];
                  return (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                      style={{ background: i < 3 ? `${tc.color}08` : 'rgba(8,11,24,0.9)', border: i < 3 ? `1px solid ${tc.color}25` : '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                        style={{ background: i < 3 ? `${tc.color}20` : 'rgba(255,255,255,0.06)', color: i < 3 ? tc.color : CREAM + '40' }}>
                        {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[11px] text-white">{l.user_id?.slice(0, 12) || 'Anonymous'}</p>
                        <span className="text-[7px] px-1 py-0.5 rounded font-black uppercase" style={{ background: `${tc.color}15`, color: tc.color }}>{tc.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{(l.loyalty_points || 0).toLocaleString()}</p>
                        {l.streak_days > 0 && <p className="text-[7px]" style={{ color: '#D4854A' }}>🔥 {l.streak_days}d</p>}
                      </div>
                    </div>
                  );
                })}
                {leaderboard.length === 0 && <p className="text-center py-8 text-[11px]" style={{ color: CREAM + '30' }}>No loyalty data yet</p>}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ padding: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <RewardShopEditor creatorId={user?.id} />
          <LiveAuctionWidget creatorId={user?.id} roomId={activeRoomId} isCreator={!!user?.id} currentUser={user} />
          <VirtualGoodsStore userId={user?.id} />
          <OnlineUsersGrid compact maxVisible={10} />
          <CollaborationMatcher />
          <ContentRecommendations />
          <ShareToSocial url={window.location.href} title="Check out my loyalty rewards on SeeWhy LIVE!" />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 0 32px' }}>
          {[
            { label: '🏆 Loyalty Program', href: 'LoyaltyProgram' },
            { label: '🛍 Reward Shop',     href: 'RewardShop'    },
            { label: '🎁 Gift Shop',       href: 'Home'          },
            { label: '🔴 Go Live',         href: 'GoLive'        },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl" style={{ background: `rgba(212,175,55,0.07)`, border: '1px solid rgba(212,175,55,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
