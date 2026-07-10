import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Swords, ArrowRight } from 'lucide-react';
import PKBattleProgress from '@/components/pk/PKBattleProgress';
import PKBattleVotePanel from '@/components/pk/PKBattleVotePanel';
import PKInviteModal from '@/components/pk/PKInviteModal';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
function Button({children,onClick,disabled,className='',style={},size,variant,type='button'}){return <button type={type} onClick={onClick} disabled={disabled} className={className} style={style}>{children}</button>}

const G = '#D4AF37';
const PANEL = '#0F0B1A';
const BORDER = 'rgba(212,175,55,0.18)';

export default function PKBattlePage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedBattle, setSelectedBattle] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: battles } = useQuery({
    queryKey: ['activePKBattles'],
    queryFn: () => base44.entities.PKBattle.filter({ status: ['pending', 'accepted', 'active'] }, '-created_date'),
    refetchInterval: 3000,
  });

  const { data: creators } = useQuery({
    queryKey: ['allCreators'],
    queryFn: async () => {
      const profiles = await base44.entities.CreatorProfile.list();
      return profiles?.slice(0, 10) || [];
    },
  });

  const activeBattle = selectedBattle || battles?.[0];

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Swords className="w-6 h-6" style={{ color: '#FF1564' }} />
            <h1 className="text-4xl font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              PK Battles
            </h1>
          </div>
          <p className="text-white/60 text-sm">
            Challenge other streamers and let your viewers vote with tips and subs
          </p>
        </motion.div>
      </div>

      <div className="px-4 md:px-8 max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
        {/* Main battle display */}
        <div className="md:col-span-2 space-y-6">
          {activeBattle ? (
            <>
              {/* Active battle */}
              <PKBattleProgress battleId={activeBattle.id} />

              {/* Voting panel */}
              {activeBattle.status === 'active' && (
                <PKBattleVotePanel
                  battleId={activeBattle.id}
                  creatorId={activeBattle.creator_id}
                  challengerId={activeBattle.challenger_id}
                  creatorName={activeBattle.creator_name}
                  challengerName={activeBattle.challenger_name}
                />
              )}

              {/* Recent battles */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg p-4"
                style={{ background: PANEL, border: `1px solid ${BORDER}` }}
              >
                <h3 className="text-sm font-black mb-4" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Other Battles
                </h3>
                <div className="space-y-2">
                  {battles?.slice(1, 5).map((battle) => (
                    <motion.button
                      key={battle.id}
                      onClick={() => setSelectedBattle(battle)}
                      whileHover={{ x: 4 }}
                      className="w-full p-3 rounded-lg text-left transition-all"
                      style={{
                        background: selectedBattle?.id === battle.id ? `${G}10` : 'rgba(255,255,255,0.03)',
                        border: selectedBattle?.id === battle.id ? `1px solid ${G}` : `1px solid ${BORDER}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">
                            {battle.creator_name} <ArrowRight className="w-3 h-3 inline mx-1" /> {battle.challenger_name}
                          </p>
                          <p className="text-[10px] text-white/40 mt-1">
                            {battle.status === 'active' ? '🟢 Live' : '⏱️ Pending'}
                          </p>
                        </div>
                        <div className="text-right text-xs font-bold">
                          <p style={{ color: G }}>
                            {(battle.creator_tips || 0) + (battle.creator_subs || 0) * 10}
                          </p>
                          <p style={{ color: '#D4AF37' }}>
                            {(battle.challenger_tips || 0) + (battle.challenger_subs || 0) * 10}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg p-8 text-center"
              style={{ background: PANEL, border: `1px solid ${BORDER}` }}
            >
              <Swords className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-white/60 text-sm mb-4">No active battles right now</p>
              <Button
                onClick={() => setShowInviteModal(true)}
                className="text-sm font-bold px-6 py-2"
                style={{ background: G, color: '#000' }}
              >
                Start a Battle
              </Button>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Start battle CTA */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-4"
              style={{ background: `${G}15`, border: `1px solid ${G}40` }}
            >
              <h4 className="text-sm font-black mb-2" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                Host a Battle
              </h4>
              <p className="text-xs text-white/70 mb-4">
                Challenge another creator and let viewers vote with tips
              </p>
              <Button
                onClick={() => setShowInviteModal(true)}
                size="sm"
                className="w-full text-xs font-black"
                style={{ background: G, color: '#000' }}
              >
                Start Battle
              </Button>
            </motion.div>
          )}

          {/* Top battles stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg p-4"
            style={{ background: PANEL, border: `1px solid ${BORDER}` }}
          >
            <h4 className="text-sm font-black mb-4" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Today's Top Battles
            </h4>
            <div className="space-y-2">
              {battles?.slice(0, 3).map((battle, idx) => (
                <div key={battle.id} className="text-xs">
                  <p className="font-bold text-white/80">#{idx + 1}</p>
                  <p className="text-white/60 text-[10px]">
                    {Math.max(
                      (battle.creator_tips || 0) + (battle.creator_subs || 0) * 10,
                      (battle.challenger_tips || 0) + (battle.challenger_subs || 0) * 10
                    )} total points
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Invite modal */}
      <PKInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        creators={creators}
      />
      <SwanAIRecommendations roomId={null} currentLayout="battle" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={null} roomId={null} currentUser={null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}