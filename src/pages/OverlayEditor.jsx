import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Layers, Palette, Bell, Target, Eye, ChevronRight, Check, Zap, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AlertConfig from '@/components/live/AlertConfig';
import ContentRecommendations from '../components/social/ContentRecommendations';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import CreatorBridge from '../components/social/CreatorBridge';

var GOLD = '#D4AF37';
var BG = '#0A0710';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };

var TABS = [
  { id: 'theme',   label: '🎨 Theme',   icon: Palette },
  { id: 'alerts',  label: '🔔 Alerts',  icon: Bell    },
  { id: 'goals',   label: '🎯 Goals',   icon: Target  },
  { id: 'preview', label: '👁 Preview', icon: Eye     },
];

var THEMES = [
  { id: 'gold',      name: 'Gold Classic',    primary: '#D4AF37', accent: '#800020', bg: '#0E0C09', desc: 'Premium gold on near-black' },
  { id: 'neon',      name: 'Neon Fire',       primary: '#FF1A3C', accent: '#FFB800', bg: '#03030A', desc: 'High-energy red & amber' },
  { id: 'cyber',     name: 'Cyber Purple',    primary: '#7B2D8B', accent: '#B066CC', bg: '#080B18', desc: 'Deep purple drama' },
  { id: 'ocean',     name: 'Ocean Wave',      primary: '#00A8E8', accent: '#6DBF7E', bg: '#040C18', desc: 'Cool blue streaming vibes' },
  { id: 'midnight',  name: 'Midnight Gold',   primary: '#C9A84C', accent: '#F0E8D4', bg: '#0E0C09', desc: 'Warm cream on dark' },
  { id: 'emerald',   name: 'Emerald Rise',    primary: '#6DBF7E', accent: '#D4AF37', bg: '#030A05', desc: 'Growth & prosperity' },
];

var ALERT_PRESETS = [
  { id: 'minimal',  name: 'Minimal',    desc: 'Clean text banner, no animation',           color: '#D4AF37' },
  { id: 'bounce',   name: 'Bounce',     desc: 'Slide in with bounce effect',               color: '#FF1A3C' },
  { id: 'explosion',name: 'Explosion',  desc: 'Particle burst on tip/sub',                 color: '#FFB800' },
  { id: 'scroll',   name: 'Scroll',     desc: 'Cinematic scroll-up with hold',             color: '#7B2D8B' },
];

var GOAL_TYPES = [
  { id: 'viewers',  label: 'Viewer Goal',      emoji: '👥', hint: 'e.g. reach 500 viewers tonight' },
  { id: 'tips',     label: 'Tip Goal',         emoji: '💎', hint: 'e.g. raise $200 for a game-night' },
  { id: 'subs',     label: 'Subscriber Goal',  emoji: '⭐', hint: 'e.g. hit 100 monthly subscribers' },
  { id: 'hours',    label: 'Stream Hours',     emoji: '⏱', hint: 'e.g. stream 3 hours tonight' },
];

var POSITIONS = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

export default function OverlayEditorPage() {
  var [activeTab, setActiveTab] = useState('theme');
  var [selectedTheme, setSelectedTheme] = useState('gold');
  var [selectedAlert, setSelectedAlert] = useState('bounce');
  var [alertPos, setAlertPos] = useState('top-center');
  var [alertDuration, setAlertDuration] = useState(5);
  var [goalType, setGoalType] = useState('viewers');
  var [goalTarget, setGoalTarget] = useState(500);
  var [goalLabel, setGoalLabel] = useState('');
  var [goalBarStyle, setGoalBarStyle] = useState('gradient');
  var [saved, setSaved] = useState(false);

  var userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });
  var user = userQuery.data || null;
  var activeRoomQ = useQuery({
    queryKey: ['overlayeditor-active-room', (user && user.id)],
    queryFn: function() { return base44.entities.Room.filter({ host_id: user.id, status: 'live' }).then(function(r) { return r[0] || null; }); },
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoom = activeRoomQ.data || null;
  var liveRoomQ = useQuery({
    queryKey: ['my-live-room-overlay', (user && user.id)],
    queryFn: function() { return base44.entities.Room.filter({ host_id: (user && user.id), status: 'live' }, '-created_date', 1).then(function(r) { return (r && r[0]); }); },
    enabled: !!(user && user.id),
  });
  var liveRoom = liveRoomQ.data || null;
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);
  var theme = THEMES.find(function(t) { return t.id === selectedTheme; }) || THEMES[0];

  function handleSave() {
    setSaved(true);
    setTimeout(function() { setSaved(false); }, 2000);
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>

      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 md:px-6 border-b flex items-center justify-between flex-wrap gap-3"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(10,7,16,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <Layers className="w-4 h-4" style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white leading-none" style={T}>Overlay &amp; Branding</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
              {liveRoom ? ('Live: ' + (liveRoom.title || 'Untitled')) : 'Customize alerts, themes & goals'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {liveRoom && (
            <span className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full uppercase animate-pulse"
              style={{ ...T, background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', color: '#C0392B' }}>
              <Radio className="w-2.5 h-2.5" /> Live Now
            </span>
          )}
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-black uppercase text-xs"
            style={{ ...T, background: saved ? 'rgba(109,191,126,0.2)' : 'rgba(212,175,55,0.15)', border: saved ? '1px solid rgba(109,191,126,0.4)' : '1px solid rgba(212,175,55,0.35)', color: saved ? '#6DBF7E' : GOLD }}>
            {saved ? <><Check className="w-3 h-3" /> Saved</> : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(10,7,16,0.9)' }}>
        {TABS.map(function(tab) {
          var Icon = tab.icon;
          return (
            <button key={tab.id} onClick={function() { setActiveTab(tab.id); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-black uppercase border-b-2 transition-all"
              style={{ ...T, color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.3)', borderBottomColor: activeTab === tab.id ? GOLD : 'transparent', background: activeTab === tab.id ? 'rgba(212,175,55,0.05)' : 'transparent' }}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 24px' }}>

        {/* ── THEME TAB ── */}
        {activeTab === 'theme' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Stream Theme Preset</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {THEMES.map(function(th) {
                var isActive = selectedTheme === th.id;
                return (
                  <button key={th.id} onClick={function() { setSelectedTheme(th.id); }}
                    style={{ borderRadius: 12, padding: '14px 12px', textAlign: 'left', background: isActive ? th.primary + '14' : 'rgba(255,255,255,0.03)', border: '2px solid ' + (isActive ? th.primary : 'rgba(255,255,255,0.07)'), cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: th.primary, flexShrink: 0 }} />
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: th.accent, flexShrink: 0 }} />
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: th.bg, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                      {isActive && <Check className="w-4 h-4 ml-auto" style={{ color: th.primary }} />}
                    </div>
                    <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, color: '#fff' }}>{th.name}</p>
                    <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{th.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Theme preview swatch */}
            <div style={{ borderRadius: 12, padding: '14px', background: theme.bg, border: '2px solid ' + theme.primary + '40', marginTop: 4 }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.primary, marginBottom: 10 }}>Preview — {theme.name}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '3px 10px', borderRadius: 99, background: theme.primary + '20', border: '1px solid ' + theme.primary + '50', color: theme.primary }}>🔴 LIVE</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '3px 10px', borderRadius: 99, background: theme.accent + '20', border: '1px solid ' + theme.accent + '50', color: theme.accent }}>💎 New Subscriber</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>👥 342 watching</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '62%', borderRadius: 99, background: 'linear-gradient(90deg, ' + theme.primary + ', ' + theme.accent + ')' }} />
              </div>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Goal bar preview</p>
            </div>
          </div>
        )}

        {/* ── ALERTS TAB ── */}
        {activeTab === 'alerts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Alert Style</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ALERT_PRESETS.map(function(ap) {
                  var isActive = selectedAlert === ap.id;
                  return (
                    <button key={ap.id} onClick={function() { setSelectedAlert(ap.id); }}
                      style={{ borderRadius: 10, padding: '12px', textAlign: 'left', background: isActive ? ap.color + '12' : 'rgba(255,255,255,0.03)', border: '2px solid ' + (isActive ? ap.color : 'rgba(255,255,255,0.07)'), cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, color: '#fff' }}>{ap.name}</p>
                        {isActive && <Check className="w-4 h-4" style={{ color: ap.color }} />}
                      </div>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{ap.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Alert Position</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {POSITIONS.map(function(pos) {
                  var isActive = alertPos === pos;
                  return (
                    <button key={pos} onClick={function() { setAlertPos(pos); }}
                      style={{ borderRadius: 8, padding: '8px 6px', fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', background: isActive ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (isActive ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'), color: isActive ? GOLD : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                      {pos.replace('-', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Alert Duration: {alertDuration}s</p>
              <input type="range" min={2} max={12} step={1} value={alertDuration}
                onChange={function(e) { setAlertDuration(Number(e.target.value)); }}
                style={{ width: '100%', accentColor: GOLD }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>2s</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>12s</span>
              </div>
            </div>

            {/* Alert preview */}
            <div style={{ borderRadius: 10, padding: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Alert Preview</p>
              <div style={{ borderRadius: 8, padding: '10px 14px', background: 'linear-gradient(90deg, rgba(212,175,55,0.15), rgba(128,0,32,0.1))', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Zap className="w-5 h-5" style={{ color: GOLD, flexShrink: 0 }} />
                <div>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, color: '#fff' }}>💎 New Subscriber Alert</p>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Style: {selectedAlert} · Position: {alertPos} · {alertDuration}s</p>
                </div>
              </div>
            </div>

            {(user && user.id) && <AlertConfig creatorId={user.id} />}
          </div>
        )}

        {/* ── GOALS TAB ── */}
        {activeTab === 'goals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Goal Type</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {GOAL_TYPES.map(function(gt) {
                  var isActive = goalType === gt.id;
                  return (
                    <button key={gt.id} onClick={function() { setGoalType(gt.id); }}
                      style={{ borderRadius: 10, padding: '12px', textAlign: 'left', background: isActive ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)', border: '2px solid ' + (isActive ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.07)'), cursor: 'pointer' }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{gt.emoji}</div>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 900, color: isActive ? GOLD : '#fff' }}>{gt.label}</p>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{gt.hint}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Goal Target</p>
              <input type="number" min={1} value={goalTarget}
                onChange={function(e) { setGoalTarget(Number(e.target.value)); }}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 14, fontFamily: 'Barlow Condensed, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Custom Label (optional)</p>
              <input type="text" placeholder="e.g. Tonight's Tip Goal" value={goalLabel} maxLength={40}
                onChange={function(e) { setGoalLabel(e.target.value); }}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Goal Bar Style</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['gradient', 'solid', 'striped'].map(function(s) {
                  var isActive = goalBarStyle === s;
                  return (
                    <button key={s} onClick={function() { setGoalBarStyle(s); }}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', background: isActive ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (isActive ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'), color: isActive ? GOLD : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Goal preview */}
            <div style={{ borderRadius: 10, padding: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Goal Bar Preview</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 900, color: '#fff' }}>{goalLabel || GOAL_TYPES.find(function(g) { return g.id === goalType; }).label}</p>
                <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 11, color: GOLD }}>62 / {goalTarget}</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.min(100, 62 / goalTarget * 100) + '%', borderRadius: 99, background: goalBarStyle === 'gradient' ? 'linear-gradient(90deg, ' + GOLD + ', #FF1A3C)' : GOLD }} />
              </div>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>Live preview — bar fills as goal progresses</p>
            </div>

            <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
          </div>
        )}

        {/* ── PREVIEW TAB ── */}
        {activeTab === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>Full Stream Overlay Preview</p>

            {/* Stream frame mock */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '2px solid ' + theme.primary + '40', aspectRatio: '16/9', background: theme.bg, position: 'relative' }}>
              {/* Top bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF1A3C', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>LIVE</span>
                </div>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>👥 342 watching</span>
              </div>

              {/* Center content placeholder */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: theme.primary + '20', border: '2px solid ' + theme.primary + '40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Radio className="w-6 h-6" style={{ color: theme.primary }} />
                </div>
              </div>

              {/* Alert preview */}
              <div style={{ position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)', padding: '6px 12px', borderRadius: 6, background: 'rgba(0,0,0,0.75)', border: '1px solid ' + theme.accent + '60', whiteSpace: 'nowrap' }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, color: theme.accent }}>⭐ New subscriber!</span>
              </div>

              {/* Goal bar */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 10px', background: 'rgba(0,0,0,0.65)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>{goalLabel || 'Goal'}</span>
                  <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, color: theme.primary }}>62/{goalTarget}</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.1)' }}>
                  <div style={{ height: '100%', width: Math.min(100, 62 / goalTarget * 100) + '%', borderRadius: 99, background: 'linear-gradient(90deg, ' + theme.primary + ', ' + theme.accent + ')' }} />
                </div>
              </div>
            </div>

            <div style={{ borderRadius: 10, padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Active Config</p>
              {[
                { label: 'Theme', value: theme.name },
                { label: 'Alert Style', value: selectedAlert },
                { label: 'Alert Position', value: alertPos },
                { label: 'Alert Duration', value: alertDuration + 's' },
                { label: 'Goal Type', value: GOAL_TYPES.find(function(g) { return g.id === goalType; }).label },
                { label: 'Goal Target', value: String(goalTarget) },
              ].map(function(row) {
                return (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: '#fff' }}>{row.value}</span>
                  </div>
                );
              })}
            </div>

            <button onClick={handleSave}
              style={{ padding: '12px', borderRadius: 12, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', background: saved ? 'rgba(109,191,126,0.15)' : 'linear-gradient(90deg, rgba(212,175,55,0.2), rgba(128,0,32,0.15))', border: '1px solid ' + (saved ? 'rgba(109,191,126,0.4)' : 'rgba(212,175,55,0.35)'), color: saved ? '#6DBF7E' : GOLD, cursor: 'pointer' }}>
              {saved ? '✓ Config Saved' : 'Apply to Stream'}
            </button>
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
          {[
            { label: '🔴 Go Live',          href: 'GoLive'           },
            { label: '📡 Broadcast Studio', href: 'BroadcastStudio'  },
            { label: '🎬 Micro Drama',       href: 'EpisodeCreatorStudio' },
            { label: '🎵 AI Music',          href: 'AIMusic'          },
          ].map(function(item) {
            return (
              <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
                <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer' }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <SwanAIRecommendations roomId={activeRoomId} currentLayout="overlay" viewerCount={(activeRoom && activeRoom.viewer_count) || 0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={activeRoomId} />
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
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
