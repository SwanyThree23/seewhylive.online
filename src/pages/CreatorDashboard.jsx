import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign, Radio, Users, Zap, BarChart2, Settings,
  TrendingUp, CreditCard, Star, Gift, ChevronRight,
  Play, Square, Eye, Clock, Crown, Download, Plus,
  RefreshCw, Target, MessageSquare, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

var SUB_TABS = [
  { id: 'earnings', label: 'Earnings', icon: DollarSign, color: '#d4af37' },
  { id: 'stream', label: 'Stream', icon: Radio, color: '#FF1564' },
  { id: 'subs', label: 'Subscribers', icon: Users, color: '#00F5FF' },
  { id: 'campaign', label: 'AI Campaign', icon: Zap, color: '#8B5CF6' },
  { id: 'payouts', label: 'Payouts', icon: CreditCard, color: '#00FF88' },
  { id: 'settings', label: 'Settings', icon: Settings, color: '#FF8C00' },
];

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(7,7,15,0.95)', border: '1px solid rgba(212,175,55,0.12)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold font-mono-sw" style={{ color: color || '#d4af37', fontFamily: 'Share Tech Mono, monospace' }}>{value}</p>
          {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: (color || '#d4af37') + '18' }}>
            <Icon className="w-4 h-4" style={{ color: color || '#d4af37' }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Earnings Tab ── */
function EarningsTab({ user }) {
  var { data: txns = [] } = useQuery({
    queryKey: ['creator-txns', user && user.id],
    queryFn: function() {
      return base44.entities.Transaction.filter({ to_user_id: user && user.id }, '-created_date', 50);
    },
    enabled: !!(user && user.id),
  });

  var total = txns.reduce(function(s, t) { return s + (t.creator_amount || 0); }, 0);
  var tips = txns.filter(function(t) { return t.type === 'tip' || t.type === 'super_chat'; });
  var gifts = txns.filter(function(t) { return t.type === 'gift'; });
  var subs = txns.filter(function(t) { return t.type === 'subscription'; });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Earned" value={'$' + Math.floor(total * 100) / 100} sub="Lifetime" color="#d4af37" icon={DollarSign} />
        <StatCard label="Tips & Superchats" value={tips.length} sub="Total transactions" color="#FF1564" icon={Star} />
        <StatCard label="Gift Revenue" value={'$' + Math.floor(gifts.reduce(function(s, t) { return s + (t.creator_amount || 0); }, 0) * 100) / 100} color="#00F5FF" icon={Gift} />
        <StatCard label="Subscriptions" value={subs.length} sub="Active subs" color="#8B5CF6" icon={Users} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(7,7,15,0.95)', border: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/60">Recent Transactions</p>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {txns.length === 0 ? (
            <div className="py-10 text-center text-white/20 text-sm">No transactions yet</div>
          ) : txns.slice(0, 20).map(function(t) {
            return (
              <div key={t.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37' }}>
                    {(t.sender_name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-white/70">{t.sender_name || 'Anonymous'}</p>
                    <p className="text-[9px] text-white/30 capitalize">{t.type || 'tip'}</p>
                  </div>
                </div>
                <span className="text-sm font-bold font-mono-sw text-yellow-400" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                  +${Math.floor((t.creator_amount || 0) * 100) / 100}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Stream Control Tab ── */
function StreamTab({ user }) {
  var qc = useQueryClient();
  var { data: rooms = [] } = useQuery({
    queryKey: ['my-rooms', user && user.id],
    queryFn: function() {
      return base44.entities.Room.filter({ host_id: user && user.id }, '-created_date', 10);
    },
    enabled: !!(user && user.id),
  });

  var liveRoom = rooms.find(function(r) { return r.status === 'live'; });

  var endStreamMutation = useMutation({
    mutationFn: function(roomId) {
      return base44.entities.Room.update(roomId, { status: 'ended', ended_at: new Date().toISOString() });
    },
    onSuccess: function() {
      qc.invalidateQueries(['my-rooms']);
      toast.success('Stream ended');
    },
  });

  return (
    <div className="space-y-4">
      {liveRoom ? (
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,21,100,0.08)', border: '1px solid rgba(255,21,100,0.3)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400">STREAMING LIVE</span>
            </div>
            <Badge style={{ background: 'rgba(255,21,100,0.2)', color: '#FF1564', border: '1px solid rgba(255,21,100,0.3)' }}>
              {liveRoom.viewer_count || 0} viewers
            </Badge>
          </div>
          <p className="text-sm font-bold text-white mb-3">{liveRoom.title}</p>
          <div className="flex gap-2">
            <Link to={createPageUrl('LiveRoom') + '?id=' + liveRoom.id} className="flex-1">
              <Button size="sm" className="w-full h-8 text-xs" style={{ background: '#d4af37', color: '#000' }}>
                <Play className="w-3 h-3 mr-1" /> Enter Studio
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={function() { endStreamMutation.mutate(liveRoom.id); }}
              className="h-8 text-xs"
              style={{ background: 'rgba(255,21,100,0.2)', color: '#FF1564', border: '1px solid rgba(255,21,100,0.3)' }}
            >
              <Square className="w-3 h-3 mr-1" /> End
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderStyle: 'dashed' }}>
          <Radio className="w-8 h-8 mx-auto mb-2 text-yellow-400/50" />
          <p className="text-sm text-white/50 mb-3">No active stream</p>
          <Link to={createPageUrl('LiveRoom')}>
            <Button size="sm" style={{ background: '#d4af37', color: '#000' }}>
              <Radio className="w-3 h-3 mr-1" /> Go Live
            </Button>
          </Link>
        </div>
      )}

      <div>
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Recent Streams</p>
        <div className="space-y-2">
          {rooms.slice(0, 6).map(function(r) {
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.status === 'live' ? '#FF1564' : r.status === 'scheduled' ? '#d4af37' : '#ffffff30' }} />
                <span className="flex-1 text-xs text-white/60 truncate">{r.title}</span>
                <span className="text-[9px] capitalize text-white/30">{r.status}</span>
                <Link to={createPageUrl('LiveRoom') + '?id=' + r.id}>
                  <ChevronRight className="w-3 h-3 text-white/20" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Subscribers Tab ── */
function SubsTab({ user }) {
  var { data: subs = [] } = useQuery({
    queryKey: ['my-subs', user && user.id],
    queryFn: function() {
      return base44.entities.ViewerSubscription.filter({ creator_id: user && user.id }, '-created_date', 50);
    },
    enabled: !!(user && user.id),
  });

  var active = subs.filter(function(s) { return s.status === 'active'; });
  var totalMrr = active.reduce(function(s, sub) { return s + (sub.price_usd || 0); }, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Active Subs" value={active.length} color="#00F5FF" icon={Users} />
        <StatCard label="Monthly Revenue" value={'$' + Math.floor(totalMrr)} color="#d4af37" icon={DollarSign} />
        <StatCard label="Churn Rate" value="0%" color="#00FF88" icon={TrendingUp} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(7,7,15,0.95)', border: '1px solid rgba(0,245,255,0.12)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/60">Subscriber List</p>
        </div>
        {subs.length === 0 ? (
          <div className="py-10 text-center text-white/20 text-sm">No subscribers yet — share your subscription page!</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {subs.slice(0, 20).map(function(s) {
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-[9px] font-bold text-white">
                      {(s.viewer_id || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-white/60">{s.viewer_id || 'Subscriber'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="text-[9px] capitalize" style={{ background: s.status === 'active' ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.06)', color: s.status === 'active' ? '#00FF88' : '#ffffff50' }}>
                      {s.tier || 'bronze'}
                    </Badge>
                    <span className="text-[10px] font-mono-sw text-yellow-400" style={{ fontFamily: 'Share Tech Mono, monospace' }}>${Math.floor(s.price_usd || 0)}/mo</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── AI Campaign Tab ── */
function CampaignTab({ user }) {
  var [prompt, setPrompt] = useState('');
  var [result, setResult] = useState('');
  var [loading, setLoading] = useState(false);

  var templates = [
    { label: 'Growth Campaign', text: 'Write a 7-day social media campaign to grow my streaming audience for gaming content.' },
    { label: 'Sub Drive Email', text: 'Write an email to my existing followers promoting my new subscription tiers.' },
    { label: 'Brand Pitch', text: 'Write a sponsorship pitch for a gaming peripheral brand. Focus on my engaged community.' },
    { label: 'Raid Message', text: 'Write an exciting raid message that hypes up the community I\'m about to raid.' },
  ];

  async function generate() {
    if (!prompt) return;
    setLoading(true);
    try {
      var res = await base44.integrations.Core.InvokeLLM({
        prompt: 'You are an expert creator growth strategist for SeeWhy LIVE. ' + prompt + '\n\nBe specific, actionable, and energetic. Use the creator platform angle.',
      });
      setResult(typeof res === 'string' ? res : (res.text || res.content || JSON.stringify(res)));
    } catch (e) {
      toast.error('AI generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {templates.map(function(t) {
          return (
            <button
              key={t.label}
              onClick={function() { setPrompt(t.text); }}
              className="text-left rounded-lg p-3 text-xs transition-all"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(255,255,255,0.6)' }}
            >
              <span className="font-bold block mb-0.5 text-purple-400">{t.label}</span>
              <span className="line-clamp-2 text-[10px] text-white/30">{t.text}</span>
            </button>
          );
        })}
      </div>

      <textarea
        value={prompt}
        onChange={function(e) { setPrompt(e.target.value); }}
        placeholder="Describe your campaign goal..."
        rows={3}
        className="w-full rounded-xl px-3 py-2.5 text-sm text-white/70 resize-none focus:outline-none"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)' }}
      />

      <Button
        onClick={generate}
        disabled={loading || !prompt}
        className="w-full h-9 text-xs font-bold"
        style={{ background: loading ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.2)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.4)' }}
      >
        <Zap className="w-3 h-3 mr-1" />
        {loading ? 'Generating...' : 'Generate with AURA AI'}
      </Button>

      {result && (
        <div className="rounded-xl p-4 text-sm text-white/70 leading-relaxed whitespace-pre-wrap" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
          {result}
        </div>
      )}
    </div>
  );
}

/* ── Payouts Tab ── */
function PayoutsTab({ user }) {
  var { data: payout } = useQuery({
    queryKey: ['creator-payout', user && user.id],
    queryFn: function() {
      return base44.entities.CreatorPayout.filter({ creator_id: user && user.id }).then(function(r) { return r[0]; });
    },
    enabled: !!(user && user.id),
  });

  var pending = (payout && payout.pending_balance) || 0;
  var totalPaid = (payout && payout.total_paid_out) || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Pending Balance" value={'$' + Math.floor(pending * 100) / 100} color="#00FF88" icon={DollarSign} />
        <StatCard label="Total Paid Out" value={'$' + Math.floor(totalPaid * 100) / 100} color="#d4af37" icon={CreditCard} />
      </div>

      <div className="rounded-xl p-4" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)' }}>
        <p className="text-xs font-bold text-green-400 mb-3">Payout Setup</p>
        {payout && payout.stripe_connected ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-white/60">Stripe account connected</span>
            </div>
            {payout.bank_last4 && (
              <p className="text-xs text-white/40">Bank ending in {payout.bank_last4}</p>
            )}
            <Button size="sm" className="mt-2 h-8 text-xs" style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }}>
              <Download className="w-3 h-3 mr-1" /> Request Payout
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-white/40 mb-3">Connect Stripe to receive payouts</p>
            <Link to={createPageUrl('Payouts')}>
              <Button size="sm" style={{ background: '#635bff', color: '#fff' }}>
                Connect Stripe
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-xl p-4" style={{ background: 'rgba(7,7,15,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs text-white/40 mb-2">Platform Fee Structure</p>
        <div className="space-y-1.5">
          {[
            { label: 'Tips & Super Chats', creator: '90%', platform: '10%' },
            { label: 'Gifts', creator: '85%', platform: '15%' },
            { label: 'Subscriptions', creator: '80%', platform: '20%' },
            { label: 'Pay-Per-View', creator: '85%', platform: '15%' },
          ].map(function(f) {
            return (
              <div key={f.label} className="flex items-center justify-between">
                <span className="text-[11px] text-white/50">{f.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-green-400 font-bold">{f.creator} creator</span>
                  <span className="text-[10px] text-white/20">{f.platform} platform</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Settings Tab ── */
function SettingsTab({ user }) {
  var [profile, setProfile] = useState({ display_name: (user && user.full_name) || '', bio: '', category: 'other' });
  var qc = useQueryClient();

  var { data: creatorProfile } = useQuery({
    queryKey: ['creator-profile', user && user.id],
    queryFn: function() {
      return base44.entities.CreatorProfile.filter({ user_id: user && user.id }).then(function(r) { return r[0]; });
    },
    enabled: !!(user && user.id),
  });

  var saveMutation = useMutation({
    mutationFn: function(data) {
      if (creatorProfile && creatorProfile.id) {
        return base44.entities.CreatorProfile.update(creatorProfile.id, data);
      }
      return base44.entities.CreatorProfile.create(Object.assign({ user_id: user && user.id }, data));
    },
    onSuccess: function() {
      qc.invalidateQueries(['creator-profile']);
      toast.success('Profile saved');
    },
  });

  return (
    <div className="space-y-4 max-w-lg">
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Display Name</label>
          <input
            value={profile.display_name}
            onChange={function(e) { setProfile(function(p) { return Object.assign({}, p, { display_name: e.target.value }); }); }}
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Bio</label>
          <textarea
            value={profile.bio}
            onChange={function(e) { setProfile(function(p) { return Object.assign({}, p, { bio: e.target.value }); }); }}
            rows={3}
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Category</label>
          <select
            value={profile.category}
            onChange={function(e) { setProfile(function(p) { return Object.assign({}, p, { category: e.target.value }); }); }}
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {['gaming', 'music', 'education', 'talk', 'fitness', 'cooking', 'art', 'tech', 'other'].map(function(c) {
              return <option key={c} value={c} style={{ background: '#0B0B18' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>;
            })}
          </select>
        </div>
      </div>
      <Button
        onClick={function() { saveMutation.mutate(profile); }}
        disabled={saveMutation.isPending}
        className="h-9 text-xs font-bold"
        style={{ background: '#d4af37', color: '#000' }}
      >
        {saveMutation.isPending ? 'Saving...' : 'Save Profile'}
      </Button>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function CreatorDashboardPage() {
  var [activeTab, setActiveTab] = useState('earnings');

  var { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });

  var { data: profile } = useQuery({
    queryKey: ['creator-profile', user && user.id],
    queryFn: function() {
      return base44.entities.CreatorProfile.filter({ user_id: user && user.id }).then(function(r) { return r[0]; });
    },
    enabled: !!(user && user.id),
  });

  return (
    <div className="min-h-screen" style={{ background: '#0B0B18', fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'rgba(7,7,15,0.98)', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-lg font-black text-white overflow-hidden">
                {profile && profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (user && user.full_name ? user.full_name.charAt(0).toUpperCase() : 'C')
                }
              </div>
              <div>
                <h1 className="text-xl font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, monospace', color: '#d4af37' }}>
                  {(profile && profile.display_name) || (user && user.full_name) || 'Creator Dashboard'}
                </h1>
                <p className="text-xs text-white/40">Creator Studio · SeeWhy LIVE</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to={createPageUrl('LiveRoom')}>
                <Button size="sm" style={{ background: '#d4af37', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.05em' }}>
                  <Radio className="w-3 h-3 mr-1" /> GO LIVE
                </Button>
              </Link>
              <Link to={createPageUrl('StreamInfra')}>
                <Button size="sm" variant="ghost" style={{ color: '#00F5FF', border: '1px solid rgba(0,245,255,0.2)' }}>
                  <Settings className="w-3 h-3 mr-1" /> STREAM SETUP
                </Button>
              </Link>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-1 scrollbar-hide">
            {SUB_TABS.map(function(tab) {
              var Icon = tab.icon;
              var isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={function() { setActiveTab(tab.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shrink-0 transition-all"
                  style={{
                    background: isActive ? tab.color + '20' : 'transparent',
                    color: isActive ? tab.color : 'rgba(255,255,255,0.35)',
                    border: '1px solid ' + (isActive ? tab.color + '50' : 'transparent'),
                    fontFamily: 'Barlow Condensed, sans-serif',
                    letterSpacing: '0.06em',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'earnings' && <EarningsTab user={user} />}
            {activeTab === 'stream' && <StreamTab user={user} />}
            {activeTab === 'subs' && <SubsTab user={user} />}
            {activeTab === 'campaign' && <CampaignTab user={user} />}
            {activeTab === 'payouts' && <PayoutsTab user={user} />}
            {activeTab === 'settings' && <SettingsTab user={user} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}