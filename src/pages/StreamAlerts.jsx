import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, Zap, Gift, Star, Heart, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AlertConfig from '@/components/live/AlertConfig';
import SoundAlertsManager from '../components/monetization/SoundAlertsManager';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import ContentRecommendations from '../components/social/ContentRecommendations';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CreatorBridge from '../components/social/CreatorBridge';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import CollaborationMatcher from '../components/social/CollaborationMatcher';

var BG = '#080B18';
var GOLD = '#D4AF37';
var CRIMSON = '#800020';
var PINK    = '#C0392B';
var FONT = { fontFamily: 'Barlow Condensed, sans-serif' };

var OVERLAY_TYPES = [
  { type: 'new_follower',  icon: Users,    color: '#C9A84C', label: 'New Follower',   desc: 'Shown when someone follows you live',  trigger: 'Auto' },
  { type: 'new_sub',       icon: Star,     color: '#D4AF37', label: 'New Subscriber', desc: 'Banner for new paid subscribers',       trigger: 'Auto' },
  { type: 'tip_received',  icon: Gift,     color: '#6DBF7E', label: 'Tip Alert',      desc: 'Animated tip overlay with amount',      trigger: 'Auto' },
  { type: 'love_tap',      icon: Heart,    color: '#C0392B', label: 'Love Tap',       desc: '❤️ burst animation on screen',           trigger: 'Auto' },
  { type: 'goal_reached',  icon: Zap,      color: '#D4AF37', label: 'Goal Reached',   desc: 'Celebration when stream goal hit',      trigger: 'Auto' },
  { type: 'raid_incoming', icon: BellRing, color: '#C0392B', label: 'Raid Alert',     desc: 'Host raiding your stream',              trigger: 'Auto' },
];

function ToggleSwitch({ enabled, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 40,
        height: 20,
        borderRadius: 10,
        background: enabled ? CRIMSON : 'rgba(255,255,255,0.1)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.25s',
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: enabled ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{
          position: 'absolute',
          top: 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}
      />
    </div>
  );
}

export default function StreamAlerts() {
  var [activeTab, setActiveTab] = useState('sound');
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);

  var [enabledOverlays, setEnabledOverlays] = useState(
    () => new Set(OVERLAY_TYPES.map((o) => o.type))
  );

  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  var { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', (user && user.id)],
    queryFn: () => base44.entities.Room.filter({ host_id: (user && user.id), status: 'live' }).then(r => r[0] || null),
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', (user && user.id)],
    queryFn: () => base44.entities.Community.filter({ owner_id: (user && user.id) }).then(r => r[0] || null),
    enabled: !!(user && user.id),
  });
  var userCommunityId = (userCommunity && userCommunity.id) || null;

  var { data: alerts = [] } = useQuery({
    queryKey: ['soundAlerts', (user && user.id)],
    queryFn: () =>
      base44.entities.SoundAlert.filter({ creator_id: (user && user.id) }),
    enabled: !!(user && user.id),
  });

  var totalAlerts = alerts.length;
  var activeAlerts = alerts.filter((a) => !a.status || a.status === 'active').length;
  var uniqueTypes = new Set(alerts.map((a) => a.trigger_type)).size;

  var toggleOverlay = (type) => {
    setEnabledOverlays((prev) => {
      var next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  var STATS = [
    { label: 'Total Alerts',  value: totalAlerts },
    { label: 'Active Alerts', value: activeAlerts },
    { label: 'Alert Types',   value: uniqueTypes },
  ];

  return (
    <div
      style={{
        ...FONT,
        minHeight: '100vh',
        background: BG,
        color: '#fff',
        paddingBottom: 48,
      }}
    >
      {/* ── Sticky Header ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(8,11,24,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(212,175,55,0.12)',
          padding: '18px 24px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BellRing size={26} color={GOLD} />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#fff',
              }}
            >
              Stream Alerts
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.02em' }}>
              Configure triggers, sounds, and overlay notifications
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px 0' }}>

        {/* ── Stats Strip ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{
                flex: '1 1 140px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(212,175,55,0.12)',
                borderRadius: 50,
                padding: '12px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 700, color: GOLD, lineHeight: 1 }}>
                {s.value}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 24,
          }}
        >
          {[
            { key: 'sound',   label: 'Sound Alerts' },
            { key: 'overlay', label: 'Overlay Triggers' },
          ].map((tab) => {
            var active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  padding: '10px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: active ? GOLD : 'rgba(255,255,255,0.4)',
                  borderBottom: active ? `2px solid ${GOLD}` : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'color 0.2s, border-color 0.2s',
                  ...FONT,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'sound' && (
            <motion.div
              key="sound"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div
                style={{
                  borderRadius: 16,
                  background: 'rgba(8,11,24,0.9)',
                  border: '1px solid rgba(212,175,55,0.1)',
                  padding: 24,
                }}
              >
                <AlertConfig creatorId={(user && user.id)} />
              </div>
            </motion.div>
          )}

          {activeTab === 'overlay' && (
            <motion.div
              key="overlay"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {OVERLAY_TYPES.map((item) => {
                  var Icon = item.icon;
                  var enabled = enabledOverlays.has(item.type);
                  return (
                    <motion.div
                      key={item.type}
                      layout
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        background: 'rgba(8,11,24,0.85)',
                        border: '1px solid rgba(212,175,55,0.08)',
                        borderRadius: 14,
                        padding: '14px 18px',
                        opacity: enabled ? 1 : 0.5,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {/* Icon circle */}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: `${item.color}26`,
                          border: `1px solid ${item.color}4D`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={20} color={item.color} />
                      </div>

                      {/* Label + desc */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '0.03em' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                          {item.desc}
                        </div>
                      </div>

                      {/* Trigger badge */}
                      <div
                        style={{
                          padding: '4px 12px',
                          borderRadius: 50,
                          background: 'rgba(212,175,55,0.1)',
                          color: GOLD,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          flexShrink: 0,
                        }}
                      >
                        Trigger: {item.trigger}
                      </div>

                      {/* Toggle */}
                      <ToggleSwitch
                        enabled={enabled}
                        onToggle={() => toggleOverlay(item.type)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Sound Alerts Manager ── */}
        {(user && user.id) && (
          <div style={{ marginTop: 16 }}>
            <SoundAlertsManager creatorId={user.id} />
          </div>
        )}

        {/* ── Footer note ── */}
        <p
          style={{
            marginTop: 32,
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
            textAlign: 'center',
            letterSpacing: '0.03em',
          }}
        >
          Alerts require an active broadcast. Sound alerts play through browser audio.
        </p>
      </div>
      <SwanAIRecommendations roomId={activeRoomId} currentLayout="alerts" viewerCount={(activeRoom && activeRoom.viewer_count) || 0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={activeRoomId} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={(activeRoom && activeRoom.viewer_count) || 0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={activeRoomId} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={(activeRoom && activeRoom.viewer_count) || 0} peakViewers={(activeRoom && activeRoom.peak_viewers) || 0} />
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