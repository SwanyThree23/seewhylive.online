import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  CheckCircle, AlertCircle, Clock, Radio, Users, DollarSign,
  MessageSquare, Shield, Star, Zap, Globe, BarChart2, UserPlus
} from 'lucide-react';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const FEATURE_STATUS = [
  { name: 'Live Room Streaming', status: 'live', icon: Radio, note: 'Audio/Video/Hybrid rooms, participant management, hand-raise' },
  { name: 'Real-Time Chat', status: 'live', icon: MessageSquare, note: 'Full chat with moderation, emoji, quick reactions' },
  { name: 'Multi-Stream / RTMP Fanout', status: 'live', icon: Globe, note: 'Simultaneous broadcast to YouTube, Twitch, TikTok, Facebook via MediaMTX' },
  { name: 'Creator Subscriptions', status: 'live', icon: Star, note: 'Bronze/Silver/Gold/Diamond tiers with Stripe Connect — 90/10 split' },
  { name: 'Tipping & Transactions', status: 'live', icon: DollarSign, note: '90/10 split, loyalty points awarded, confetti animation' },
  { name: 'Loyalty Program', status: 'live', icon: Star, note: 'Points, leaderboard, redeemable rewards' },
  { name: 'AI Content Moderation', status: 'live', icon: Shield, note: 'Auto-flags violations, admin review queue, confidence scoring' },
  { name: 'Communities', status: 'live', icon: Users, note: 'Create, join, manage, announcements, challenges, spotlights' },
  { name: 'Stream Scheduler', status: 'live', icon: Clock, note: 'Calendar view, recurring streams, countdown timers' },
  { name: 'Analytics Dashboard', status: 'live', icon: BarChart2, note: 'Stream stats, revenue, viewer metrics, PDF/CSV/JSON export' },
  { name: 'Notifications System', status: 'live', icon: Zap, note: 'Real-time bell with badge, tip/sub/mention/room alerts' },
  { name: 'Overlay Editor', status: 'live', icon: Globe, note: 'Drag-drop stream overlay builder with live preview' },
  { name: 'Live Auctions', status: 'live', icon: DollarSign, note: 'In-stream bidding with buyout prices and bid history' },
  { name: 'Sound Alerts', status: 'live', icon: Zap, note: 'Custom triggers for donations, new subs, milestones' },
  { name: 'Pay-Per-View Events', status: 'live', icon: DollarSign, note: 'Gated stream access with purchase flow' },
  { name: 'VOD Library & Editing', status: 'live', icon: Radio, note: 'Save past streams, trim clips, chapter markers, publish to profile' },
  { name: 'OBS Studio Bridge', status: 'live', icon: Globe, note: 'WebSocket bridge — scene switching, start/stop recording, live stats' },
  { name: 'Watch Party', status: 'live', icon: Users, note: 'Synchronized video playback with real-time participants and chat' },
  { name: 'Global Search', status: 'live', icon: Zap, note: '⌘K spotlight search across rooms and communities' },
  { name: 'Public Creator Profiles', status: 'live', icon: Users, note: 'Public profile pages with VOD library and live room links' },
  { name: 'Social Sharing Suite', status: 'live', icon: Globe, note: 'One-click share to 8 platforms with referral tracking' },
  { name: 'Stream Chat Emojis', status: 'live', icon: MessageSquare, note: 'Full emoji picker with categories, search, floating reactions' },
  { name: 'Co-Streaming / Guests', status: 'live', icon: Users, note: 'Multi-guest panel, RTMP guest connections' },
  { name: 'Collaborative Whiteboard', status: 'live', icon: Globe, note: 'Real-time whiteboard inside rooms' },
  { name: 'Newsletter', status: 'live', icon: MessageSquare, note: 'Email campaigns to community members' },
  { name: 'Data Export', status: 'live', icon: BarChart2, note: 'PDF/CSV/JSON export of all user data' },
  { name: 'User Invite System', status: 'live', icon: UserPlus, note: 'Admin & user invite with role assignment' },
  { name: 'Error Boundaries', status: 'live', icon: Shield, note: 'Production-grade error recovery on all pages and components' },
  { name: 'State vs State Tournaments', status: 'live', icon: Zap, note: 'Bracket, rosters, live match, standings — full State vs State domino tournament system' },
  { name: 'Tribute Wall', status: 'live', icon: Users, note: 'Fallen/Passed Player Tribute system — legend cards, tribute messages, nomination form' },
  { name: 'AI Podcast Studio', status: 'live', icon: Radio, note: 'NotebookLM-style AI podcast creation — topic intake, AI script, panel recording, library' },
  { name: 'AI Music Studio', status: 'live', icon: Radio, note: 'Beat library, vocal mixer, AI mastering, release manager — full in-browser studio' },
  { name: 'Multi-Platform Hub', status: 'live', icon: Globe, note: 'Simultaneous multi-platform publishing, webhooks, virtual camera, engagement sync' },
  { name: 'INS Forge', status: 'live', icon: Zap, note: 'AI creative brief generator for SVS graphics, tribute cards, overlays, and promo assets' },
  { name: 'Joyce AI Co-Host', status: 'live', icon: MessageSquare, note: 'In-stream AI co-host with quick-action prompts for tournaments, tributes, and hype' },
  { name: 'Guardian AI Moderation', status: 'live', icon: Shield, note: 'Real-time risk thresholds with auto-flag/mute/ban — Claude Haiku powered' },
];

const STATUS_STYLE = {
  live:    { bg: 'rgba(109,191,126,0.08)',  border: 'rgba(109,191,126,0.25)',  color: '#6DBF7E', dot: '#6DBF7E' },
  beta:    { bg: 'rgba(212,175,55,0.1)',  border: 'rgba(212,175,55,0.3)',  color: GOLD,      dot: GOLD },
  planned: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', dot: 'rgba(255,255,255,0.2)' },
};

export default function BetaStatusPage() {
  const { data: rooms = [] } = useQuery({
    queryKey: ['all-rooms-beta'],
    queryFn: () => base44.entities.Room.list('-created_date', 100),
  });

  const liveCount = FEATURE_STATUS.filter(f => f.status === 'live').length;
  const betaCount = FEATURE_STATUS.filter(f => f.status === 'beta').length;
  const liveRooms = rooms.filter(r => r.status === 'live').length;

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2 gap-3">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#6DBF7E' }} />
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>Platform Status</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>SeeWhy LIVE — all systems operational</p>
          </div>
        </div>
        <Link to={createPageUrl('InviteUsers')}>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs"
            style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer', ...T }}>
            <UserPlus className="w-3.5 h-3.5" /> Invite Beta Testers
          </button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Features Live', value: liveCount, color: '#6DBF7E' },
            { label: 'In Beta Preview', value: betaCount, color: GOLD },
            { label: 'Live Rooms Now', value: liveRooms, color: '#D4AF37' },
            { label: 'Revenue Split', value: '90/10', color: '#D4AF37' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
              <p className="text-3xl font-black" style={{ fontFamily: 'Orbitron, monospace', color }}>{value}</p>
              <p className="text-[10px] font-black uppercase mt-1" style={{ ...T, color: 'rgba(255,255,255,0.35)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Feature checklist */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#6DBF7E' }} />
              <p className="font-black text-sm text-white" style={T}>Feature Checklist</p>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {liveCount + betaCount} of {FEATURE_STATUS.length} features available to beta testers
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {FEATURE_STATUS.map((feature) => {
              const cfg = STATUS_STYLE[feature.status];
              const Icon = feature.icon;
              return (
                <div key={feature.name} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: cfg.dot }} />
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-sm text-white" style={T}>{feature.name}</p>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
                        style={{ ...T, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                        {feature.status}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{feature.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Getting started guide */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <p className="font-black text-sm text-white mb-4" style={T}>Getting Started Guide</p>
          <div className="space-y-3">
            {[
              { icon: '🎬', text: 'Create a room and go live — try audio, video, and hybrid modes with scene switching' },
              { icon: '📺', text: 'Use the Creator Dashboard → OBS Bridge tab to connect OBS Studio via WebSocket' },
              { icon: '🎞️', text: 'Save past streams to your VOD Library, trim clips, and add chapter markers' },
              { icon: '🎉', text: 'Start a Watch Party to sync video playback with friends in real-time' },
              { icon: '💰', text: 'Set up subscription tiers + Stripe Connect for the 90/10 payout flow' },
              { icon: '📡', text: 'Use Multi-Stream Manager to fanout to YouTube, Twitch, TikTok, and Facebook simultaneously' },
              { icon: '🤖', text: 'Run AI Moderation scans on chat — review flagged content from the admin queue' },
              { icon: '🔍', text: 'Press ⌘K (or Ctrl+K) anywhere for instant spotlight search across rooms & communities' },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-base">{tip.icon}</span>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{tip.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Creator Dashboard', href: 'CreatorDashboard' },
            { label: 'AI Hub',            href: 'AIHub' },
            { label: 'Joyce AI',          href: 'JoyceAI' },
            { label: 'Guardian AI',       href: 'GuardianAI' },
            { label: 'State vs State',    href: 'StateVsState' },
            { label: 'Tribute Wall',      href: 'TributeWall' },
            { label: 'Podcast Studio',    href: 'PodcastStudio' },
            { label: 'AI Music Studio',   href: 'AIMusic' },
            { label: 'INS Forge',         href: 'INSForge' },
            { label: 'Multi-Platform',    href: 'MultiPlatform' },
            { label: 'Platform Showcase', href: 'PlatformShowcase' },
            { label: 'Moderation',        href: 'AIModeration' },
            { label: 'Stream Ref Dash',   href: 'StreamRefDash' },
            { label: 'Newsletter Hub',    href: 'NewsletterHub' },
            { label: 'Social Expo',       href: 'SocialExpo' },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)}>
              <button className="w-full py-2.5 rounded-xl font-black uppercase text-[10px]"
                style={{ ...T, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                {item.label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
