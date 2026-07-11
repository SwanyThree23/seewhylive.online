import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Swords, Plus, ArrowLeft, Trophy, Clock, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, formatDistanceToNow } from 'date-fns';

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
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
import BattleMode from '../components/streaming/BattleMode';
import BitratePresets from '../components/streaming/BitratePresets';
import GuestRTMPPanel from '../components/streaming/GuestRTMPPanel';
import GuestStreamMonitor from '../components/streaming/GuestStreamMonitor';
import TranscriptionPanel from '../components/streaming/TranscriptionPanel';
const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -3 }}
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'linear-gradient(135deg, #0d0618, #15021f)', border: '1px solid rgba(212,175,55,0.15)' }}>
      {/* Status bar */}
      <div className="h-1 w-full" style={{ background: isActive ? `linear-gradient(90deg, #800020, ${GOLD})` : 'rgba(255,255,255,0.06)', animation: isActive ? 'pulse 2s infinite' : 'none' }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #800020, #d4af37)' }}>
              <Swords className="w-4 h-4 text-white" />
            </div>
            <div>
              {isActive && (
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase inline-block mb-0.5"
                  style={{ ...T, background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B' }}>
                  ⚡ LIVE
                </span>
              )}
              {isEnded && (
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase inline-block mb-0.5"
                  style={{ ...T, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }}>
                  ENDED
                </span>
              )}
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>PK Battle</p>
            </div>
          </div>
          {timeRemaining && (
            <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(212,175,55,0.8)' }}>
              <Clock className="w-3 h-3" />
              <span>{timeRemaining}</span>
            </div>
          )}
        </div>

        {/* VS display */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-blue-300 mx-auto mb-1"
              style={{ background: 'rgba(59,130,246,0.15)', border: '2px solid rgba(59,130,246,0.4)' }}>
              {leftName?.charAt(0)?.toUpperCase()}
            </div>
            <p className="text-sm font-bold text-white truncate" style={T}>{leftName}</p>
            <p className="text-lg font-black font-mono" style={{ color: '#60a5fa' }}>{leftVotes.toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-black text-sm" style={{ color: GOLD }}>VS</span>
            <div className="w-px h-8" style={{ background: 'rgba(212,175,55,0.2)' }} />
          </div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-red-300 mx-auto mb-1"
              style={{ background: 'rgba(192,57,43,0.15)', border: '2px solid rgba(192,57,43,0.4)' }}>
              {rightName?.charAt(0)?.toUpperCase()}
            </div>
            <p className="text-sm font-bold text-white truncate" style={T}>{rightName}</p>
            <p className="text-lg font-black font-mono" style={{ color: '#C0392B' }}>{rightVotes.toLocaleString()}</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="h-2 rounded-full flex overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="transition-all duration-500" style={{ width: `${leftPct}%`, background: '#3b82f6' }} />
          <div className="transition-all duration-500" style={{ width: `${100 - leftPct}%`, background: '#C0392B' }} />
        </div>

        <Link to={`${createPageUrl('PKBattlePage')}?id=${battle.id}`}>
          <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl font-black uppercase text-xs"
            style={{ ...T, background: isActive ? 'linear-gradient(90deg, #2563eb, #dc2626)' : 'rgba(255,255,255,0.05)', border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)', color: isActive ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            {isActive ? <><Zap className="w-3.5 h-3.5" /> Join Battle</> : <><Trophy className="w-3.5 h-3.5" /> View Results</>}
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function LiveBattles() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const roomId = null;
  const [filter, setFilter] = useState('active');

  const { data: battles = [], isLoading } = useQuery({
    queryKey: ['battles', filter],
    queryFn: () => filter === 'all'
      ? base44.entities.LiveAuction.filter({ auction_type: 'experience' }, '-created_date', 30)
      : base44.entities.LiveAuction.filter({ auction_type: 'experience', status: filter }, '-created_date', 20),
    refetchInterval: 10000,
  });

  return (
    <div className="min-h-screen text-white pb-10"
      style={{ background: 'linear-gradient(135deg, #0d0618 0%, #15021f 50%, #0d0618 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4 mb-3">
            <Link to={createPageUrl('Home')}>
              <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase"
                style={{ ...T, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <ArrowLeft className="w-4 h-4" /> Home
              </button>
            </Link>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #800020, #d4af37)' }}>
                <Swords className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white" style={T}>Live Battles</h1>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Head-to-head PK showdowns</p>
              </div>
            </div>
            <Link to={createPageUrl('PKBattlePage')}>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-xs"
                style={{ ...T, background: 'linear-gradient(90deg, #2563eb, #dc2626)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <Plus className="w-4 h-4" /> Start Battle
              </button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {[
              { key: 'active', label: '⚡ Live Now' },
              { key: 'ended', label: '🏆 Ended' },
              { key: 'all', label: '📋 All' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="px-3 py-1 text-xs rounded-full border transition-all"
                style={{ ...T, background: filter === f.key ? GOLD : 'rgba(255,255,255,0.05)', borderColor: filter === f.key ? GOLD : 'rgba(255,255,255,0.1)', color: filter === f.key ? '#000' : 'rgba(255,255,255,0.5)', fontWeight: 900, cursor: 'pointer' }}>
                {f.label}
              </button>
            ))}
            {battles.length > 0 && (
              <span className="ml-auto text-[11px] self-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {battles.length} battle{battles.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : battles.length === 0 ? (
          <div className="text-center py-24">
            <Swords className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: GOLD }} />
            <h3 className="text-xl font-black mb-2" style={{ ...T, color: 'rgba(255,255,255,0.4)' }}>
              {filter === 'active' ? 'No live battles right now' : 'No battles found'}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {filter === 'active' ? 'Be the first to start a PK battle!' : 'Check back later'}
            </p>
            <Link to={createPageUrl('PKBattlePage')}>
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-xs mx-auto"
                style={{ ...T, background: 'linear-gradient(90deg, #2563eb, #dc2626)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <Plus className="w-4 h-4" /> Create First Battle
              </button>
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
      <SwanAIRecommendations roomId={null} currentLayout="battles" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      {roomId && <BattleMode roomId={roomId} isHost={false} hostName={user?.full_name || ''} />}
      {<BitratePresets selected={'auto'} onChange={() => {}} />}
      {user?.id && <GuestRTMPPanel participantId={user.id} userId={user.id} />}
      {<GuestStreamMonitor guestName={user?.full_name || ''} isStreaming={roomId != null} />}
      {roomId && <TranscriptionPanel recordingUrl={''} roomTitle={''} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id} roomId={null} currentUser={user} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}