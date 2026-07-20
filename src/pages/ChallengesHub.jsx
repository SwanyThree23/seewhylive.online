import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Trophy, Clock, Users, Check, ChevronRight, Star, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import LeaderboardPanel from '../components/live/LeaderboardPanel';
import LoyaltyBadge from '../components/rooms/LoyaltyBadge';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import ChallengeAnalytics from '../components/admin/ChallengeAnalytics';
import EngagementBadgesDisplay from '../components/live/EngagementBadgesDisplay';
import SocialLeaderboard from '../components/watchparty/SocialLeaderboard';
import PointsEarnWidget from '../components/loyalty/PointsEarnWidget';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import TournamentBracket from '../components/pk/TournamentBracket';
import ShareToSocial from '../components/social/ShareToSocial';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import CreatorBridge from '../components/social/CreatorBridge';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';

const GOLD = '#D4AF37';
const BURGUNDY = '#800020';
const CREAM = '#F5E6D3';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TYPE_COLORS = {
  attendance:  { color: '#C9A84C', label: 'ATTENDANCE' },
  engagement:  { color: GOLD,      label: 'ENGAGEMENT' },
  content:     { color: '#D4AF37', label: 'CONTENT' },
  referral:    { color: '#6DBF7E', label: 'REFERRAL' },
};

function ChallengeCountdown({ endDate }) {
  const [rem, setRem] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setRem('Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRem(d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`);
    };
    tick();
    const iv = setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, [endDate]);
  return <span>{rem}</span>;
}

function LeaderboardDrawer({ challengeId, title, open, onClose }) {
  const { data: participants = [] } = useQuery({
    queryKey: ['ch-participants', challengeId],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ challenge_id: challengeId }, '-score', 20),
    enabled: open && !!challengeId,
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[60vh] overflow-y-auto"
            style={{ background: 'rgba(8,11,24,0.97)', border: `1px solid rgba(212,175,55,0.2)` }}>
            <div className="px-4 py-3 sticky top-0 flex items-center justify-between" style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="font-black uppercase text-[11px]" style={{ color: GOLD, ...T }}>🏆 {title}</span>
              <button onClick={onClose} className="text-[11px]" style={{ color: CREAM + '40' }}>Close</button>
            </div>
            <div className="p-3 space-y-1.5">
              {participants.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: i < 3 ? `rgba(212,175,55,0.07)` : 'rgba(255,255,255,0.03)', border: i < 3 ? `1px solid rgba(212,175,55,0.2)` : '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="w-6 text-center text-sm shrink-0">{i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-white">{p.user_id?.slice(0, 12)}</p>
                    <p className="text-[11px]" style={{ color: CREAM + '40' }}>{p.completed ? '✓ Completed' : `Progress: ${p.progress || 0}`}</p>
                  </div>
                  <span className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{p.score || 0}</span>
                </div>
              ))}
              {participants.length === 0 && <p className="text-center py-4 text-[10px]" style={{ color: CREAM + '30' }}>No participants yet</p>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ChallengeCard({ challenge, onJoin, userId, myParticipation, showLeaderboard }) {
  const tc = TYPE_COLORS[challenge.challenge_type?.toLowerCase()] || { color: GOLD, label: 'CHALLENGE' };
  const progress = challenge.goal_value > 0 ? Math.min(100, Math.round((challenge.participant_count || 0) / challenge.goal_value * 100)) : 0;
  const hasJoined = !!myParticipation;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.97)', border: `1px solid ${tc.color}20` }}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded"
                style={{ background: `${tc.color}15`, color: tc.color, border: `1px solid ${tc.color}25`, ...T }}>
                {tc.label}
              </span>
              {challenge.reward_type && (
                <span className="text-[7px] px-1.5 py-0.5 rounded font-black uppercase"
                  style={{ background: `${GOLD}12`, color: GOLD, border: `1px solid ${GOLD}25`, ...T }}>
                  {challenge.reward_type}
                </span>
              )}
              <span className="text-[7px] px-1.5 py-0.5 rounded font-black uppercase"
                style={{ background: challenge.status === 'active' ? 'rgba(109,191,126,0.1)' : 'rgba(255,255,255,0.06)', color: challenge.status === 'active' ? '#6DBF7E' : CREAM + '40', ...T }}>
                {challenge.status}
              </span>
            </div>
            <h4 className="font-black text-[12px] text-white">{challenge.title}</h4>
            {challenge.description && <p className="text-[11px] mt-0.5" style={{ color: CREAM + '40' }}>{challenge.description}</p>}
          </div>
          {challenge.end_date && (
            <div className="text-right shrink-0">
              <p className="text-[7px]" style={{ color: CREAM + '30' }}>Ends in</p>
              <p className="font-black text-[11px]" style={{ color: GOLD, ...T }}><ChallengeCountdown endDate={challenge.end_date} /></p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <div className="flex items-center gap-1">
              <Users className="w-2.5 h-2.5" style={{ color: CREAM + '40' }} />
              <span style={{ color: CREAM + '50' }}>{challenge.participant_count || 0} joined</span>
            </div>
            <span style={{ color: tc.color }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: tc.color }} />
          </div>
        </div>

        <div className="flex gap-1.5">
          {!hasJoined && challenge.status === 'active' && (
            <button onClick={() => onJoin(challenge)}
              className="flex-1 py-2 rounded-xl font-black uppercase text-[10px]"
              style={{ background: BURGUNDY, color: GOLD, border: `1px solid rgba(212,175,55,0.3)`, ...T }}>
              ⚡ Join Challenge
            </button>
          )}
          {hasJoined && (
            <div className="flex-1 py-2 rounded-xl text-center font-black uppercase text-[11px]"
              style={{ background: 'rgba(109,191,126,0.08)', color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.2)', ...T }}>
              ✓ Joined · {myParticipation.progress || 0} progress
            </div>
          )}
          <button onClick={showLeaderboard}
            className="px-3 py-2 rounded-xl font-black uppercase text-[11px]"
            style={{ background: `${GOLD}10`, color: GOLD, border: `1px solid ${GOLD}20`, ...T }}>
            🏆
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChallengesHubPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [lbOpen, setLbOpen] = useState(null);
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;
  const { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', user?.id],
    queryFn: () => base44.entities.Community.filter({ owner_id: user?.id }).then(r => r[0] || null),
    enabled: !!user?.id,
  });
  const userCommunityId = userCommunity?.id || null;

  const { data: activeChallenges = [] } = useQuery({
    queryKey: ['ch-active'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'active' }, 'end_date', 20),
    refetchInterval: 30000,
  });
  const { data: upcomingChallenges = [] } = useQuery({
    queryKey: ['ch-upcoming'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'upcoming' }, 'start_date', 10),
  });
  const { data: myParticipations = [] } = useQuery({
    queryKey: ['ch-mine', user?.id],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const joinMut = useMutation({
    mutationFn: (challenge) => base44.entities.ChallengeParticipant.create({
      challenge_id: challenge.id,
      user_id: user?.id,
      progress: 0,
      score: 0,
      completed: false,
    }),
    onSuccess: (_, challenge) => {
      qc.invalidateQueries({ queryKey: ['ch-mine'] });
      toast.success('Joined challenge!');
      if (user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'challenge_joined',
          title: `Joined challenge: ${challenge?.title || 'Challenge'}`,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Action failed.'),
  });

  const myCompleted = myParticipations.filter(p => p.completed);
  const myActive = myParticipations.filter(p => !p.completed);

  const TABS = [
    { id: 'active',    label: `⚡ Active (${activeChallenges.length})` },
    { id: 'my',        label: `📊 My Progress (${myParticipations.length})` },
    { id: 'upcoming',  label: `🗓 Upcoming` },
    { id: 'completed', label: `✅ Completed (${myCompleted.length})` },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#080B18' }}>
      <AnimatePresence>
        {lbOpen && <LeaderboardDrawer challengeId={lbOpen.id} title={lbOpen.title} open={true} onClose={() => setLbOpen(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-20 px-4 md:px-6 py-4" style={{ background: 'rgba(8,11,24,0.97)', borderBottom: `1px solid rgba(212,175,55,0.12)`, backdropFilter: 'blur(12px)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5" style={{ color: GOLD }} />
            <span className="font-black uppercase text-base" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>Challenges Hub</span>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide gap-0">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="px-4 py-2 shrink-0 text-[11px] font-black uppercase border-b-2 transition-all"
                style={{ ...T, color: activeTab === t.id ? GOLD : CREAM + '35', borderBottomColor: activeTab === t.id ? GOLD : 'transparent', background: activeTab === t.id ? `${GOLD}07` : 'transparent' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-5 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {activeTab === 'active' && (
              <div className="space-y-3">
                {activeChallenges.length === 0
                  ? <p className="text-center py-10 text-[11px]" style={{ color: CREAM + '25' }}>No active challenges</p>
                  : activeChallenges.map(c => (
                    <ChallengeCard key={c.id} challenge={c}
                      onJoin={(ch) => joinMut.mutate(ch)}
                      userId={user?.id}
                      myParticipation={myParticipations.find(p => p.challenge_id === c.id)}
                      showLeaderboard={() => setLbOpen(c)} />
                  ))}
              </div>
            )}

            {activeTab === 'my' && (
              <div className="space-y-3">
                {myParticipations.length === 0
                  ? <p className="text-center py-10 text-[11px]" style={{ color: CREAM + '25' }}>You haven't joined any challenges yet</p>
                  : myParticipations.map(p => {
                    const challenge = [...activeChallenges, ...upcomingChallenges].find(c => c.id === p.challenge_id);
                    const goalValue = challenge?.goal_value || 100;
                    const progress = Math.min(100, Math.round(((p.progress || 0) / goalValue) * 100));
                    return (
                      <div key={p.id} className="rounded-xl p-4 space-y-2"
                        style={{ background: 'rgba(8,11,24,0.97)', border: p.completed ? `1px solid rgba(109,191,126,0.25)` : '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-[11px] text-white">{challenge?.title || `Challenge ${p.challenge_id?.slice(0,8)}`}</p>
                          <div className="flex items-center gap-1.5">
                            {p.completed && (
                              <span className="text-[7px] px-1.5 py-0.5 rounded font-black uppercase"
                                style={{ background: 'rgba(109,191,126,0.12)', color: '#6DBF7E', ...T }}>✓ DONE</span>
                            )}
                            <span className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{p.score || 0}</span>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span style={{ color: CREAM + '40' }}>Progress: {p.progress || 0}</span>
                            <span style={{ color: GOLD }}>{progress}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: GOLD }} />
                          </div>
                        </div>
                        <button onClick={() => challenge && setLbOpen(challenge)}
                          className="text-[11px] font-black uppercase" style={{ color: GOLD, ...T }}>
                          🏆 View Leaderboard →
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}

            {activeTab === 'upcoming' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcomingChallenges.length === 0
                  ? <p className="text-center py-10 text-[11px] col-span-2" style={{ color: CREAM + '25' }}>No upcoming challenges</p>
                  : upcomingChallenges.map(c => {
                    const tc = TYPE_COLORS[c.challenge_type?.toLowerCase()] || { color: GOLD, label: 'CHALLENGE' };
                    const diff = new Date(c.start_date).getTime() - Date.now();
                    const d = Math.floor(diff / 86400000);
                    const h = Math.floor((diff % 86400000) / 3600000);
                    return (
                      <div key={c.id} className="rounded-xl p-4 space-y-2"
                        style={{ background: 'rgba(8,11,24,0.97)', border: `1px solid ${tc.color}20` }}>
                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded"
                          style={{ background: `${tc.color}15`, color: tc.color, ...T }}>{tc.label}</span>
                        <p className="font-bold text-[11px] text-white">{c.title}</p>
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3" style={{ color: GOLD + '70' }} />
                          <span style={{ color: GOLD }}>Starts in {d > 0 ? `${d}d ${h}h` : `${h}h`}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="space-y-2">
                {myCompleted.length === 0
                  ? <p className="text-center py-10 text-[11px]" style={{ color: CREAM + '25' }}>No completed challenges yet</p>
                  : myCompleted.map(p => (
                    <div key={p.id} className="rounded-xl p-4 flex items-center gap-3"
                      style={{ background: 'rgba(8,11,24,0.97)', border: `1px solid rgba(109,191,126,0.2)` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(109,191,126,0.12)', border: '1px solid rgba(109,191,126,0.25)' }}>
                        <Check className="w-4 h-4" style={{ color: '#6DBF7E' }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[11px] text-white">Challenge {p.challenge_id?.slice(0, 8)}</p>
                        <p className="text-[11px]" style={{ color: CREAM + '40' }}>
                          Rank: {p.rank || '—'} · Completed {p.updated_date ? new Date(p.updated_date).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <p className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{p.score || 0} pts</p>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 space-y-4">
          <LeaderboardPanel roomId={activeRoomId} />
          {user?.id && <LoyaltyBadge userId={user.id} creatorId={user.id} />}
          <ChallengeLeaderboard challengeId={null} />
          <ChallengeAnalytics communityId={userCommunityId} />
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <EngagementBadgesDisplay roomId={activeRoomId} userId={user?.id} creatorId={user?.id} />
          <SocialLeaderboard roomId={activeRoomId} />
          <PointsEarnWidget userId={user?.id} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 0 24px' }}>
          {[
            { label: '🏆 Leaderboard',       href: 'Leaderboard'    },
            { label: '⚔️ PK Battles',        href: 'PKBattle'       },
            { label: '🗺 State vs State',    href: 'StateVsState'   },
            { label: '👥 Communities',       href: 'Communities'    },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
          <OnlineUsersGrid compact maxVisible={10} />
          <ContentRecommendations />
          <TournamentBracket />
          <ShareToSocial content={{ title: 'SeeWhy LIVE', url: window.location.href }} />
        </div>
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id || null} roomId={null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}
