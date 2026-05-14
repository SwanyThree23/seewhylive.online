import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VirtualGoodsStore from '../components/monetization/VirtualGoodsStore';
import AnimatedGiftShop from '../components/monetization/AnimatedGiftShop';
import RevenueDashboard from '../components/monetization/RevenueDashboard';
import CreatorTierManager from '../components/subscriptions/CreatorTierManager';
import MySubscriptions from '../components/subscriptions/MySubscriptions';
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import SoundAlertsManager from '../components/monetization/SoundAlertsManager';
import LiveAuctionWidget from '../components/monetization/LiveAuctionWidget';
import StripeConnectButton from '../components/monetization/StripeConnectButton';
import StripeSubscribeButton from '../components/monetization/StripeSubscribeButton';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Users, Award, Gift, Sparkles, Target, Bell, Gavel, Zap,
  ArrowRight, CheckCircle, Radio, Crown, ShoppingBag, Repeat
} from 'lucide-react';

// ── Platform fee breakdown ──────────────────────────────────────────────
const FLYWHEEL = [
  { icon: Gift,       label: 'Tips & Donations',    creator: 90, platform: 10, color: '#d4af37' },
  { icon: Crown,      label: 'Subscriptions',        creator: 90, platform: 10, color: '#CC7755' },
  { icon: ShoppingBag,label: 'Virtual Goods',        creator: 90, platform: 10, color: '#6B7C4A' },
  { icon: Gavel,      label: 'Live Auctions',        creator: 90, platform: 10, color: '#8B5CF6' },
  { icon: Radio,      label: 'Pay-Per-View Events',  creator: 90, platform: 10, color: '#00F5FF' },
  { icon: Sparkles,   label: 'Animated Gifts',       creator: 90, platform: 10, color: '#FF8C00' },
];

const SAAS_TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    color: 'rgba(255,255,255,0.1)',
    border: 'rgba(255,255,255,0.1)',
    features: ['5 live hours/mo', 'Basic chat', 'Up to 50 viewers', '10% platform fee', 'Community access'],
  },
  {
    name: 'Creator',
    price: '$19',
    period: '/mo',
    color: 'rgba(212,175,55,0.12)',
    border: 'rgba(212,175,55,0.4)',
    badge: 'POPULAR',
    features: ['Unlimited live hours', 'Priority streaming', 'Up to 5,000 viewers', '10% platform fee', 'Custom overlays', 'RTMP multi-stream', 'Analytics dashboard'],
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    color: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.4)',
    features: ['Everything in Creator', 'Up to 50,000 viewers', '10% platform fee', 'AI moderation', 'White-label options', 'PK Battles', 'Priority support'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    color: 'rgba(204,119,85,0.1)',
    border: 'rgba(204,119,85,0.4)',
    features: ['Everything in Pro', 'Unlimited viewers', 'Custom platform fee', 'Dedicated infra', 'SLA guarantee', 'API access', 'Custom integrations'],
  },
];

function FlywheelSection() {
  return (
    <div className="space-y-6">
      {/* Flywheel diagram */}
      <div className="p-5 rounded-3xl" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Repeat className="w-5 h-5" style={{ color: '#d4af37' }} />
          <h3 className="font-black text-lg" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
            THE SEEWHY MONETIZATION FLYWHEEL
          </h3>
        </div>

        {/* Cycle visual */}
        <div className="flex items-center justify-between gap-1 mb-5 overflow-x-auto pb-2">
          {[
            { emoji: '📡', label: 'Creator Goes Live' },
            { emoji: '→', label: '' },
            { emoji: '👥', label: 'Viewers Engage' },
            { emoji: '→', label: '' },
            { emoji: '💰', label: 'Revenue Flows' },
            { emoji: '→', label: '' },
            { emoji: '🚀', label: 'Creator Grows' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0">
              <span className={item.label ? 'text-2xl' : 'text-lg opacity-40'}>{item.emoji}</span>
              {item.label && <span className="text-[9px] text-center whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{item.label}</span>}
            </div>
          ))}
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'rgba(196,168,130,0.7)' }}>
          SeeWhy takes a flat <strong style={{ color: '#d4af37' }}>10% platform fee</strong> across all revenue streams — no hidden fees, no variable rates.
          Creators keep <strong style={{ color: '#d4af37' }}>90%</strong> of everything they earn, forever.
        </p>
      </div>

      {/* Revenue stream breakdown */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          ALL REVENUE STREAMS — 90/10 SPLIT
        </h4>
        <div className="space-y-2">
          {FLYWHEEL.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.label} whileHover={{ x: 2 }}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}18` }}>
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{item.label}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex h-2 w-24 rounded-full overflow-hidden">
                    <div className="h-full rounded-l-full" style={{ width: '90%', background: item.color }} />
                    <div className="h-full rounded-r-full" style={{ width: '10%', background: 'rgba(255,255,255,0.15)' }} />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black" style={{ color: item.color }}>90%</span>
                    <span className="text-[9px] text-white/30"> you</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SaaSSection() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(107,68,35,0.12)', border: '1px solid rgba(212,175,55,0.15)' }}>
        <p className="text-sm" style={{ color: 'rgba(196,168,130,0.8)' }}>
          <strong style={{ color: '#d4af37' }}>SeeWhy LIVE</strong> is a SaaS + Marketplace hybrid.
          Monthly plans unlock features — the platform earns a flat <strong style={{ color: '#d4af37' }}>10%</strong> on all transactions.
          The more creators earn, the more SeeWhy earns — aligned incentives.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SAAS_TIERS.map((tier) => (
          <motion.div key={tier.name} whileHover={{ y: -2 }}
            className="relative p-4 rounded-2xl space-y-3"
            style={{ background: tier.color, border: `1px solid ${tier.border}` }}>
            {tier.badge && (
              <span className="absolute -top-2 right-4 text-[9px] px-2 py-0.5 rounded-full font-black"
                style={{ background: '#d4af37', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
                {tier.badge}
              </span>
            )}
            <div className="flex items-end gap-1">
              <span className="text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, monospace' }}>{tier.price}</span>
              <span className="text-xs pb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{tier.period}</span>
            </div>
            <p className="font-black text-sm" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
              {tier.name.toUpperCase()}
            </p>
            <ul className="space-y-1">
              {tier.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <CheckCircle className="w-3 h-3 shrink-0" style={{ color: tier.border.includes('255,255') ? 'rgba(255,255,255,0.3)' : tier.border }} />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function MonetizationPage() {
  const [showGiftShop, setShowGiftShop] = useState(false);
  const [activeTab, setActiveTab] = useState('flywheel');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['userTransactions'],
    queryFn: () => base44.entities.Transaction.filter({ from_user_id: user?.id || '' }),
    enabled: !!user,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['userSubscriptions'],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user?.id || '' }),
    enabled: !!user,
  });

  const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;

  return (
    <div className="min-h-screen" style={{ background: '#0B0B18' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ background: 'linear-gradient(160deg, #1A0F0A 0%, #2C1810 100%)', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)' }}>
              <DollarSign className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
                MONETIZATION
              </h1>
              <p className="text-xs" style={{ color: 'rgba(196,168,130,0.6)' }}>Creator keeps 90% · Platform takes 10%</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total Spent', value: `$${totalSpent.toFixed(0)}`, icon: TrendingUp, color: '#d4af37' },
              { label: 'Active Subs', value: activeSubscriptions, icon: Users, color: '#CC7755' },
              { label: 'Items Owned', value: transactions.filter(t => t.type === 'virtual_good').length, icon: Award, color: '#6B7C4A' },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-3 rounded-2xl text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: stat.color }} />
                  <p className="text-lg font-black" style={{ color: stat.color, fontFamily: 'Orbitron, monospace' }}>{stat.value}</p>
                  <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <TabsList className="flex gap-1 p-1 w-max rounded-2xl h-auto"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {[
                { value: 'flywheel', label: '⚙️ Flywheel' },
                { value: 'saas',     label: '🚀 Plans' },
                { value: 'revenue',  label: '📊 Revenue' },
                { value: 'subs',     label: '👑 Subs' },
                { value: 'store',    label: '🛍 Store' },
                { value: 'gifts',    label: '🎁 Gifts' },
                { value: 'goals',    label: '🎯 Goals' },
                { value: 'auctions', label: '🔨 Auctions' },
              ].map(t => (
                <TabsTrigger key={t.value} value={t.value}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap data-[state=active]:text-black transition-all"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' }}
                  data-state={activeTab === t.value ? 'active' : 'inactive'}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="flywheel"><FlywheelSection /></TabsContent>
          <TabsContent value="saas"><SaaSSection /></TabsContent>
          <TabsContent value="revenue"><RevenueDashboard userId={user?.id} /></TabsContent>

          <TabsContent value="subs" className="space-y-4">
            <div className="max-w-xl">
              <StripeConnectButton creatorId={user?.id} />
            </div>
            <Tabs defaultValue="manage" className="space-y-3">
              <TabsList>
                <TabsTrigger value="manage">My Tiers</TabsTrigger>
                <TabsTrigger value="mine">My Subs</TabsTrigger>
                <TabsTrigger value="subscribe">Subscribe</TabsTrigger>
              </TabsList>
              <TabsContent value="manage"><CreatorTierManager creatorId={user?.id} /></TabsContent>
              <TabsContent value="mine"><MySubscriptions userId={user?.id} /></TabsContent>
              <TabsContent value="subscribe">
                <div className="max-w-lg">
                  <StripeSubscribeButton creatorId={user?.id} creatorName={user?.full_name || 'this creator'} currentUserId={user?.id} />
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="store"><VirtualGoodsStore userId={user?.id} /></TabsContent>

          <TabsContent value="gifts">
            <div className="p-5 rounded-2xl text-center space-y-4"
              style={{ background: 'rgba(255,140,0,0.06)', border: '1px solid rgba(255,140,0,0.15)' }}>
              <div className="text-4xl">🎁</div>
              <div>
                <p className="font-black text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Animated Gift Gallery</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Send unique gifts to streamers — creator earns 90%</p>
              </div>
              <Button onClick={() => setShowGiftShop(true)}
                className="font-bold" style={{ background: '#d4af37', color: '#000' }}>
                <Gift className="w-4 h-4 mr-2" /> Browse Gifts
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <StreamerGoalsWidget creatorId={user?.id} isCreator={true} />
          </TabsContent>

          <TabsContent value="auctions">
            <LiveAuctionWidget creatorId={user?.id} isCreator={true} currentUser={user} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showGiftShop} onOpenChange={setShowGiftShop}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>Animated Gift Shop</DialogTitle></DialogHeader>
          <AnimatedGiftShop onClose={() => setShowGiftShop(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}