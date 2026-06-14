import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, Volume2, Play, Zap, Gift, Star, Heart, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AlertConfig from '@/components/live/AlertConfig';
import SoundAlertsManager from '../components/monetization/SoundAlertsManager';
import StreamGoals from '../components/live/StreamGoals';
import PollLaunchBar from '../components/live/PollLaunchBar';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import BroadcastAnalyticsDashboard from '../components/streaming/BroadcastAnalyticsDashboard';
import GiftAnimation from '../components/live/GiftAnimation';
import TippingModal from '../components/monetization/TippingModal';
import EnhancedPollingSystem from '../components/live/EnhancedPollingSystem';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const FONT = { fontFamily: 'Barlow Condensed, sans-serif' };

const OVERLAY_TYPES = [
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
  const [activeTab, setActiveTab] = useState('sound');
  const [enabledOverlays, setEnabledOverlays] = useState(
    () => new Set(OVERLAY_TYPES.map((o) => o.type))
  );

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: alerts = [] } = useQuery({
    queryKey: ['soundAlerts', user?.id],
    queryFn: () =>
      base44.entities.SoundAlert.filter({ creator_id: user?.id }),
    enabled: !!user?.id,
  });

  const totalAlerts = alerts.length;
  const activeAlerts = alerts.filter((a) => !a.status || a.status === 'active').length;
  const uniqueTypes = new Set(alerts.map((a) => a.trigger_type)).size;

  const toggleOverlay = (type) => {
    setEnabledOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const STATS = [
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
            const active = activeTab === tab.key;
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
                <AlertConfig creatorId={user?.id} />
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
                  const Icon = item.icon;
                  const enabled = enabledOverlays.has(item.type);
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
        {user?.id && (
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

      {/* Cross-nav footer */}
      <div style={{ padding: '10px 16px', background: 'rgba(8,11,24,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to={createPageUrl('ControlRoom')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#C4B596', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🎛️ Control Room
          </button>
        </Link>
        <Link to={createPageUrl('OverlayEditor')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#C4B596', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🎚️ Overlays
          </button>
        </Link>
        <Link to={createPageUrl('LiveRoom')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#C4B596', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🎙️ Live Room
          </button>
        </Link>
        <Link to={createPageUrl('StreamScheduler')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#C4B596', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            📅 Scheduler
          </button>
        </Link>
      </div>
    </div>
  );
}
