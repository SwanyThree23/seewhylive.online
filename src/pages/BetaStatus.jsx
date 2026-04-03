import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  CheckCircle, AlertCircle, Clock, Radio, Users, DollarSign,
  MessageSquare, Shield, Star, Zap, Globe, BarChart2, UserPlus
} from 'lucide-react';

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
];

const STATUS_CONFIG = {
  live: { label: 'Live', color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
  beta: { label: 'Beta', color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  planned: { label: 'Planned', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

export default function BetaStatusPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['all-rooms-beta'],
    queryFn: () => base44.entities.Room.list('-created_date', 100),
  });
  const { data: users_count } = useQuery({
    queryKey: ['all-users-beta'],
    queryFn: () => base44.entities.Community.list('-created_date', 100),
  });

  const liveCount = FEATURE_STATUS.filter(f => f.status === 'live').length;
  const betaCount = FEATURE_STATUS.filter(f => f.status === 'beta').length;
  const liveRooms = rooms.filter(r => r.status === 'live').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-5xl mx-auto px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <Badge className="bg-green-600 text-white font-bold text-sm px-3">PRODUCTION READY</Badge>
            </div>
            <h1 className="text-3xl font-bold">SeeWhy LIVE — Platform Status</h1>
            <p className="text-muted-foreground">Full-stack multi-user platform — all systems operational</p>
          </div>
          <Link to={createPageUrl('InviteUsers')}>
            <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold gap-2">
              <UserPlus className="w-4 h-4" /> Invite Beta Testers
            </Button>
          </Link>
        </div>

        {/* Platform stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-3xl font-bold text-green-700">{liveCount}</p>
              <p className="text-xs text-green-600 font-medium mt-1">Features Live</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-3xl font-bold text-amber-700">{betaCount}</p>
              <p className="text-xs text-amber-600 font-medium mt-1">In Beta Preview</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{liveRooms}</p>
              <p className="text-xs text-muted-foreground mt-1">Live Rooms Now</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-3xl font-bold text-purple-600">90/10</p>
              <p className="text-xs text-muted-foreground mt-1">Creator Revenue Split</p>
            </CardContent>
          </Card>
        </div>

        {/* Feature checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Feature Checklist
            </CardTitle>
            <CardDescription>{liveCount + betaCount} of {FEATURE_STATUS.length} features available to beta testers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {FEATURE_STATUS.map((feature) => {
                const cfg = STATUS_CONFIG[feature.status];
                const Icon = feature.icon;
                return (
                  <div key={feature.name} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${cfg.dot}`} />
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{feature.name}</p>
                        <Badge className={`text-[10px] px-2 py-0.5 border ${cfg.color}`}>{cfg.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Testers guide */}
        <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Getting Started Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                <span className="text-lg">{tip.icon}</span>
                <p className="text-sm text-green-800">{tip.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Creator Dashboard', href: 'CreatorDashboard' },
            { label: 'Enhancement Suite', href: 'EnhancementSuite' },
            { label: 'Invite Users', href: 'InviteUsers' },
            { label: 'Moderation', href: 'AIModeration' },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)}>
              <Button variant="outline" className="w-full text-xs">{item.label}</Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}