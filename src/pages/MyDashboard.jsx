import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, TrendingUp, Users, DollarSign, Calendar, Play, Radio, Zap, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ActivityHistory from '@/components/dashboard/ActivityHistory';
import SavedAdTemplates from '@/components/dashboard/SavedAdTemplates';
import ChallengeProgress from '@/components/dashboard/ChallengeProgress';

var GOLD = '#D4AF37';
var BG = '#0A0710';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };

var QUICK_ACTIONS = [
  { label: 'Go Live',       emoji: '🔴', href: 'GoLive',              color: '#FF1A3C' },
  { label: 'Micro Drama',   emoji: '🎬', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
  { label: 'AI Music',      emoji: '🎵', href: 'AIMusic',             color: '#D4AF37' },
  { label: 'Podcast',       emoji: '🎙', href: 'PodcastStudio',       color: '#00A8E8' },
  { label: 'Challenges',    emoji: '🏆', href: 'ChallengesHub',       color: '#6DBF7E' },
  { label: 'Overlay',       emoji: '🎨', href: 'OverlayEditor',       color: '#B066CC' },
];

var STATIC_STATS = [
  { label: 'Hours Streamed', value: '14.2', unit: 'hrs', icon: Radio,       color: '#FF1A3C' },
  { label: 'Peak Viewers',   value: '482',  unit: '',    icon: Users,       color: '#D4AF37' },
  { label: 'Tips This Week', value: '$37',  unit: '',    icon: DollarSign,  color: '#6DBF7E' },
  { label: 'Creator Score',  value: '1,840',unit: 'pts', icon: Star,        color: '#B066CC' },
];

var DRAMA_SERIES = [
  { title: 'Shadow Reign',  ep: 'Ep 5 · "The Betrayal"',   color: '#7B2D8B', emoji: '🎬' },
  { title: 'Street Code',   ep: 'Ep 3 · "Block Night"',    color: '#C0392B', emoji: '🏙' },
  { title: 'Cyber Hearts',  ep: 'Ep 7 · "Signal Lost"',    color: '#00A8E8', emoji: '💙' },
];

export default function MyDashboard() {
  var [activeTab, setActiveTab] = useState('overview');

  var { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });

  var { data: liveRooms } = useQuery({
    queryKey: ['my-live-rooms', (user && user.id)],
    queryFn: function() { return base44.entities.Room.filter({ host_id: user.id, status: 'live' }); },
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });

  var { data: upcomingRooms } = useQuery({
    queryKey: ['my-upcoming-rooms', (user && user.id)],
    queryFn: function() { return base44.entities.Room.filter({ host_id: user.id, status: 'scheduled' }, 'scheduled_at', 3); },
    enabled: !!(user && user.id),
  });

  var isLive = liveRooms && liveRooms.length > 0;
  var liveRoom = isLive ? liveRooms[0] : null;
  var displayName = isLoading ? '' : ((user && user.full_name) || (user && user.username) || 'Creator');

  return (
    <div className="min-h-screen pb-28" style={{ background: BG }}>

      {/* Header */}
      <div className="px-4 pt-5 pb-4 md:px-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B6914, #D4AF37)' }}>
            <LayoutDashboard className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider leading-none" style={{ ...T, color: GOLD }}>My Dashboard</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
              {isLoading ? 'Loading…' : ('Welcome back, ' + displayName)}
            </p>
          </div>
          {isLive && (
            <span className="ml-auto flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full uppercase animate-pulse"
              style={{ ...T, background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', color: '#C0392B', flexShrink: 0 }}>
              <Radio className="w-2.5 h-2.5" /> LIVE
            </span>
          )}
        </div>

        {/* Live room banner */}
        {isLive && liveRoom && (
          <div className="rounded-xl p-3 mb-4 flex items-center justify-between gap-3"
            style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)' }}>
            <div>
              <p style={{ ...T, fontSize: 12, fontWeight: 900, color: '#fff' }}>{liveRoom.title || 'Untitled Stream'}</p>
              <p style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                👥 {(liveRoom.viewer_count || 0).toLocaleString()} watching
              </p>
            </div>
            <Link to={createPageUrl('GoLive')} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 12px', borderRadius: 99, background: 'rgba(192,57,43,0.25)', border: '1px solid rgba(192,57,43,0.5)', color: '#FF4455' }}>
                Manage <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {[{ id: 'overview', label: '📊 Overview' }, { id: 'studios', label: '🎬 Studios' }, { id: 'activity', label: '⚡ Activity' }].map(function(tab) {
            return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id); }}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all"
                style={{ ...T, background: activeTab === tab.id ? 'rgba(212,175,55,0.15)' : 'transparent', color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.35)', border: activeTab === tab.id ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent' }}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 16px 16px', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {STATIC_STATS.map(function(stat) {
                var Icon = stat.icon;
                return (
                  <div key={stat.label} style={{ borderRadius: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: stat.color + '18', border: '1px solid ' + stat.color + '35', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 12, height: 12, color: stat.color }} />
                      </div>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</p>
                    </div>
                    <p style={{ fontFamily: 'Orbitron, monospace', fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                      {stat.value}<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 3, fontFamily: 'Barlow Condensed, sans-serif' }}>{stat.unit}</span>
                    </p>
                    <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>This week</p>
                  </div>
                );
              })}
            </div>

            {/* Quick actions */}
            <div>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Quick Actions</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {QUICK_ACTIONS.map(function(action) {
                  return (
                    <Link key={action.href} to={createPageUrl(action.href)} style={{ textDecoration: 'none' }}>
                      <div style={{ borderRadius: 10, padding: '10px 8px', textAlign: 'center', background: action.color + '10', border: '1px solid ' + action.color + '28', cursor: 'pointer' }}>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{action.emoji}</div>
                        <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: action.color }}>{action.label}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Upcoming scheduled */}
            <div style={{ borderRadius: 12, padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>📅 Upcoming</p>
                <Link to={createPageUrl('ContentCalendar')} style={{ textDecoration: 'none' }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: GOLD }}>Calendar →</span>
                </Link>
              </div>
              {upcomingRooms && upcomingRooms.length > 0 ? upcomingRooms.map(function(room) {
                return (
                  <div key={room.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Calendar style={{ width: 14, height: 14, color: GOLD, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.title || 'Untitled'}</p>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{room.scheduled_at ? new Date(room.scheduled_at).toLocaleDateString() : 'Scheduled'}</p>
                    </div>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, flexShrink: 0 }}>Scheduled</span>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>No upcoming streams scheduled</p>
                  <Link to={createPageUrl('ContentCalendar')} style={{ textDecoration: 'none' }}>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: GOLD }}>+ Schedule one →</span>
                  </Link>
                </div>
              )}
            </div>

            <ChallengeProgress user={user} />
          </>
        )}

        {/* ── STUDIOS TAB ── */}
        {activeTab === 'studios' && (
          <>
            <div style={{ borderRadius: 14, padding: '14px', background: 'rgba(8,11,24,0.95)', border: '1px solid rgba(123,45,139,0.22)' }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(176,102,204,0.7)', marginBottom: 10 }}>🎬 My Series</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DRAMA_SERIES.map(function(s) {
                  return (
                    <Link key={s.title} to={createPageUrl('EpisodeSeries')} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: s.color + '10', border: '1px solid ' + s.color + '28', cursor: 'pointer' }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{s.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, color: '#fff' }}>{s.title}</p>
                          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{s.ep}</p>
                        </div>
                        <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
                <div style={{ marginTop: 10, borderRadius: 8, padding: '8px 12px', background: 'rgba(123,45,139,0.12)', border: '1px solid rgba(123,45,139,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: '#B066CC' }}>+ Create New Series</span>
                  <ChevronRight style={{ width: 12, height: 12, color: '#B066CC' }} />
                </div>
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { emoji: '🎵', label: 'AI Music Live',     sub: 'Next session tonight',     color: '#D4AF37', href: 'AIMusic' },
                { emoji: '🎙', label: 'Podcast Studio',    sub: 'Draft ep in progress',      color: '#00A8E8', href: 'PodcastStudio' },
                { emoji: '📡', label: 'Broadcast Studio',  sub: 'Stream configuration',      color: '#6DBF7E', href: 'BroadcastStudio' },
                { emoji: '🎨', label: 'Overlay Editor',    sub: 'Gold Classic theme active', color: '#B066CC', href: 'OverlayEditor' },
              ].map(function(item) {
                return (
                  <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
                    <div style={{ borderRadius: 12, padding: '12px', background: item.color + '0C', border: '1px solid ' + item.color + '25', cursor: 'pointer' }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{item.emoji}</div>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 900, color: '#fff' }}>{item.label}</p>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{item.sub}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <SavedAdTemplates user={user} />
          </>
        )}

        {/* ── ACTIVITY TAB ── */}
        {activeTab === 'activity' && (
          <>
            <ActivityHistory user={user} />

            <div style={{ borderRadius: 12, padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>⚡ Creator Level</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37, #800020)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 14, fontWeight: 900, color: '#000' }}>7</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 900, color: '#fff' }}>Level 7 — Gold Creator</span>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, color: GOLD }}>1,840 / 2,500</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ height: '100%', width: '73.6%', borderRadius: 99, background: 'linear-gradient(90deg, #D4AF37, #800020)' }} />
                  </div>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>660 pts to Level 8 — Platinum</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick links */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {[
            { label: '📊 Analytics',      href: 'Analytics'    },
            { label: '🏆 Leaderboard',    href: 'Leaderboard'  },
            { label: '💎 Loyalty Hub',    href: 'LoyaltyHub'   },
            { label: '📋 Calendar',       href: 'ContentCalendar' },
          ].map(function(item) {
            return (
              <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
                <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer' }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
