import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign, TrendingUp, Users, Zap, Crown, Star, Gift, Radio,
  CreditCard, Target, ArrowRight, ChevronRight, BarChart3, Download,
  Repeat, RefreshCw, Flame, Award, Clock, CheckCircle, Lock, Unlock,
  PlayCircle, Heart, MessageSquare, ShoppingBag, Music, ArrowUpRight,
  Percent, Calendar, Bell, Shield, Rocket, Eye, Activity
} from 'lucide-react';
import PayPerViewManager from '@/components/monetization/PayPerViewManager';
import CreatorTierManager from '../components/subscriptions/CreatorTierManager';
import MonetizationDashboard from '../components/monetization/MonetizationDashboard';
import VirtualGoodsStore from '../components/monetization/VirtualGoodsStore';
import TierEditor from '../components/subscriptions/TierEditor';
import SubscriptionCard from '../components/monetization/SubscriptionCard';
import SubscriptionTiers from '../components/monetization/SubscriptionTiers';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import StripeConnectButton from '../components/monetization/StripeConnectButton';
import RewardShopEditor from '../components/loyalty/RewardShopEditor';
import SubscriptionManager from '@/components/monetization/SubscriptionManager';
import RevenueDashboard from '@/components/monetization/RevenueDashboard';
import ShopDashboard from '../components/merch/ShopDashboard';
import PayPerViewCard from '@/components/monetization/PayPerViewCard';
import { toast } from 'sonner';

const G       = '#D4AF37';
const BG      = '#080B18';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const TEAL    = '#D4854A';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const FLYWHEEL_STAGES = [
  { id: 'attract',  label: 'ATTRACT',  icon: Eye,         color: '#C0392B', desc: 'Free content hooks new viewers' },
  { id: 'engage',   label: 'ENGAGE',   icon: Heart,       color: PINK,      desc: 'Chat, reactions & live interaction' },
  { id: 'convert',  label: 'CONVERT',  icon: ArrowRight,  color: TEAL,      desc: 'Free → Subscriber upgrade' },
  { id: 'monetize', label: 'MONETIZE', icon: DollarSign,  color: G,         desc: 'Tips, PPV, subs, gifts, AI music' },
  { id: 'retain',   label: 'RETAIN',   icon: Repeat,      color: '#6DBF7E', desc: 'Perks, streaks & loyalty rewards' },
  { id: 'grow',     label: 'GROW',     icon: TrendingUp,  color: CRIMSON,   desc: 'Word-of-mouth & referral flywheel' },
];

const TIER_LADDER = [
  { id: 'free',    label: 'Free',   price: 0,  color: '#6b7280', icon: Eye,    perks: ['Chat access', 'Watch live & VODs', 'Community feed'] },
  { id: 'bronze',  label: 'Bronze', price: 1,  color: '#ea580c', icon: Star,   perks: ['Bronze badge', 'Early chat access', 'Custom emote ×1', 'Monthly shoutout'] },
  { id: 'silver',  label: 'Silver', price: 5,  color: '#9ca3af', icon: Zap,    perks: ['Silver badge', 'Ad-free viewing', 'Custom emotes ×3', 'Backstage access', 'Priority queue'] },
  { id: 'gold',    label: 'Gold',   price: 15, color: G,         icon: Crown,  perks: ['Gold crown badge', 'All Silver perks', 'PPV 20% off', 'Co-host consideration', 'DM access'] },
  { id: 'elite',   label: 'Elite',  price: 50, color: PINK,      icon: Rocket, perks: ['Elite status', 'All Gold perks', 'Revenue share on collabs', 'Brand partnership priority', 'Direct Slack channel'] },
];

const REVENUE_STREAMS = [
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, color: G,         desc: 'Monthly recurring tiers', split: '90%' },
  { id: 'tips',          label: 'Live Tips',     icon: Heart,      color: PINK,       desc: 'Real-time tip alerts',    split: '90%' },
  { id: 'ppv',           label: 'Pay-Per-View',  icon: PlayCircle, color: TEAL,       desc: 'Gated events & replays',  split: '85%' },
  { id: 'gifts',         label: 'Virtual Gifts', icon: Gift,       color: '#f97316', desc: 'Animated gift shop',       split: '80%' },
  { id: 'music',         label: 'AI Music',      icon: Music,      color: '#D4854A', desc: 'Stream your AI tracks',    split: '70%' },
  { id: 'ads',           label: 'Ad Revenue',    icon: BarChart3,  color: '#6DBF7E', desc: 'CPM-based display ads',    split: '65%' },
];

const MILESTONES = [
  { subs: 10,   reward: 'Bronze Creator Badge',   icon: Star,   color: '#ea580c' },
  { subs: 50,   reward: 'Verified Creator Label', icon: Shield, color: '#D4AF37' },
  { subs: 100,  reward: 'Custom Channel Banner',  icon: Award,  color: G },
  { subs: 500,  reward: 'Staff Pick Feature',     icon: Zap,    color: PINK },
  { subs: 1000, reward: 'Revenue Share Boost +5%',icon: Rocket, color: TEAL },
  { subs: 5000, label: 'Partner Status',          icon: Crown,  color: '#D4854A' },
];

function exportCSV(transactions, subscriptions) {
  const rows = [
    ['Type', 'Amount', 'Date', 'Description'],
    ...transactions.map(t => [t.type || 'transaction', `$${t.amount || 0}`, new Date(t.created_date).toLocaleDateString(), t.description || '']),
    ...subscriptions.map(s => ['subscription', `$${s.price || 0}/mo`, new Date(s.created_date).toLocaleDateString(), s.tier_name || '']),
  ];
  const csv = rows.map(r => r.map(v => JSON.stringify(v)).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `seewhy_revenue_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── FlywheelDiagram ─────────────────────────────────────────────────── */
function FlywheelDiagram({ activeStage, onStageClick }) {
  const cx = 160, cy = 160, r = 110;
  return (
    <div style={{ position: 'relative', width: 320, height: 320, flexShrink: 0 }}>
      <svg width="320" height="320" style={{ position: 'absolute', inset: 0 }}>
        {/* Outer orbit ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth="2" />
        {/* Inner glow ring */}
        <circle cx={cx} cy={cy} r={r - 20} fill="none" stroke="rgba(212,175,55,0.04)" strokeWidth="1" strokeDasharray="4 6" />
        {/* Connecting arcs */}
        {FLYWHEEL_STAGES.map((_, i) => {
          const a1 = (i / FLYWHEEL_STAGES.length) * Math.PI * 2 - Math.PI / 2;
          const a2 = ((i + 1) / FLYWHEEL_STAGES.length) * Math.PI * 2 - Math.PI / 2;
          const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
          const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
          const large = (a2 - a1) > Math.PI ? 1 : 0;
          return (
            <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
              fill="none" stroke={FLYWHEEL_STAGES[i].color} strokeWidth="2"
              strokeOpacity={activeStage === FLYWHEEL_STAGES[i].id ? 0.9 : 0.2}
              style={{ transition: 'stroke-opacity 0.3s' }}
            />
          );
        })}
      </svg>

      {/* Stage nodes */}
      {FLYWHEEL_STAGES.map((stage, i) => {
        const angle = (i / FLYWHEEL_STAGES.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + r * Math.cos(angle) - 22;
        const y = cy + r * Math.sin(angle) - 22;
        const Icon = stage.icon;
        const isActive = activeStage === stage.id;
        return (
          <motion.button
            key={stage.id}
            style={{
              position: 'absolute', left: x, top: y, width: 44, height: 44,
              borderRadius: '50%', border: `2px solid ${isActive ? stage.color : stage.color + '40'}`,
              background: isActive ? `${stage.color}25` : 'rgba(8,11,24,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', outline: 'none',
              boxShadow: isActive ? `0 0 16px ${stage.color}60` : 'none',
              transition: 'all 0.2s',
            }}
            animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={{ duration: 1.4, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
            onClick={() => onStageClick(stage.id)}
          >
            <Icon style={{ width: 18, height: 18, color: isActive ? stage.color : stage.color + '99' }} />
          </motion.button>
        );
      })}

      {/* Center label */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <motion.div
          key={activeStage}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p style={{ color: G, fontSize: 13, fontWeight: 900, margin: 0, ...T }}>
            {FLYWHEEL_STAGES.find(s => s.id === activeStage)?.label || 'FLYWHEEL'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0', maxWidth: 80, lineHeight: 1.3, ...T }}>
            {FLYWHEEL_STAGES.find(s => s.id === activeStage)?.desc}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── TierLadderPanel ─────────────────────────────────────────────────── */
function TierLadderPanel({ subCount }) {
  const [hovered, setHovered] = useState(null);
  const achieved = subCount || 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {TIER_LADDER.map((tier, i) => {
        const Icon = tier.icon;
        const isHover = hovered === tier.id;
        return (
          <motion.div
            key={tier.id}
            onHoverStart={() => setHovered(tier.id)}
            onHoverEnd={() => setHovered(null)}
            style={{
              border: `1px solid ${isHover ? tier.color : tier.color + '30'}`,
              borderRadius: 12, padding: '12px 16px',
              background: isHover ? `${tier.color}10` : 'rgba(8,11,24,0.7)',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: `${tier.color}20`, border: `2px solid ${tier.color}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon style={{ width: 18, height: 18, color: tier.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, ...T }}>{tier.label}</span>
                {tier.price === 0
                  ? <span style={{ fontSize: 10, color: '#6b7280', ...T }}>FREE</span>
                  : <span style={{ fontSize: 10, color: tier.color, fontWeight: 700, ...T }}>${tier.price}/mo</span>
                }
                {i > 0 && i < TIER_LADDER.length - 1 && (
                  <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 'auto', ...T }}>
                    {i > 0 ? `↑ Upgrade from ${TIER_LADDER[i - 1].label}` : ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {tier.perks.slice(0, isHover ? tier.perks.length : 2).map((perk, j) => (
                  <span key={j} style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 99,
                    background: `${tier.color}15`, color: tier.color + 'cc', ...T,
                  }}>{perk}</span>
                ))}
                {!isHover && tier.perks.length > 2 && (
                  <span style={{ fontSize: 10, color: '#4b5563', ...T }}>+{tier.perks.length - 2} more</span>
                )}
              </div>
            </div>
            {i < TIER_LADDER.length - 1 && (
              <ChevronRight style={{ width: 14, height: 14, color: tier.color + '60', flexShrink: 0 }} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── RevenueStreamsPanel ─────────────────────────────────────────────── */
function RevenueStreamsPanel({ transactions, subscriptions }) {
  const tipTotal  = transactions.filter(t => t.type === 'tip').reduce((s, t) => s + (t.amount || 0), 0);
  const ppvTotal  = transactions.filter(t => t.type === 'ppv').reduce((s, t) => s + (t.amount || 0), 0);
  const subTotal  = subscriptions.reduce((s, sub) => s + (sub.price || 0), 0);
  const giftTotal = transactions.filter(t => t.type === 'gift').reduce((s, t) => s + (t.amount || 0), 0);
  const gross     = tipTotal + ppvTotal + subTotal + giftTotal;

  const streams = [
    { ...REVENUE_STREAMS[0], amount: subTotal },
    { ...REVENUE_STREAMS[1], amount: tipTotal },
    { ...REVENUE_STREAMS[2], amount: ppvTotal },
    { ...REVENUE_STREAMS[3], amount: giftTotal },
    { ...REVENUE_STREAMS[4], amount: 0 },
    { ...REVENUE_STREAMS[5], amount: 0 },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
      {streams.map(stream => {
        const Icon  = stream.icon;
        const pct   = gross > 0 ? (stream.amount / gross) * 100 : 0;
        return (
          <div key={stream.id} style={{
            background: 'rgba(8,11,24,0.8)', border: `1px solid ${stream.color}25`,
            borderRadius: 12, padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon style={{ width: 16, height: 16, color: stream.color }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', ...T }}>{stream.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: stream.color, fontWeight: 700, ...T }}>{stream.split}</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px', ...T }}>${stream.amount.toFixed(2)}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '0 0 10px' }}>{stream.desc}</p>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', background: stream.color, borderRadius: 99 }}
              />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '4px 0 0', ...T }}>{pct.toFixed(1)}% of total</p>
          </div>
        );
      })}
    </div>
  );
}

/* ─── PayoutPanel ─────────────────────────────────────────────────────── */
function PayoutPanel({ netEarnings }) {
  const THRESHOLD = 50;
  const pct       = Math.min((netEarnings / THRESHOLD) * 100, 100);
  const nextDate  = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (15 - (d.getDate() % 15) || 15));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })();

  return (
    <div style={{ background: 'rgba(8,11,24,0.8)', border: `1px solid ${G}20`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Calendar style={{ width: 16, height: 16, color: G }} />
        <span style={{ fontWeight: 700, color: G, fontSize: 15, ...T }}>Payout Schedule</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: `${G}0F`, border: `1px solid ${G}25`, borderRadius: 10, padding: 14 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', ...T }}>Available Balance</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: G, margin: 0, ...T }}>${netEarnings.toFixed(2)}</p>
        </div>
        <div style={{ background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.2)', borderRadius: 10, padding: 14 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', ...T }}>Next Payout Date</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#6DBF7E', margin: 0, ...T }}>{nextDate}</p>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', ...T }}>Threshold Progress</span>
          <span style={{ fontSize: 11, color: G, fontWeight: 700, ...T }}>${netEarnings.toFixed(2)} / ${THRESHOLD}</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ height: '100%', background: `linear-gradient(to right, ${CRIMSON}, ${G})`, borderRadius: 99 }}
          />
        </div>
      </div>

      {pct >= 100 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(109,191,126,0.12)', border: '1px solid rgba(109,191,126,0.25)' }}>
          <CheckCircle style={{ width: 14, height: 14, color: '#6DBF7E' }} />
          <span style={{ fontSize: 11, color: '#6DBF7E', fontWeight: 700, ...T }}>Payout eligible — auto-processed on {nextDate}</span>
        </div>
      ) : (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, ...T }}>
          ${(THRESHOLD - netEarnings).toFixed(2)} more to unlock auto-payout
        </p>
      )}
    </div>
  );
}

/* ─── MilestonesPanel ─────────────────────────────────────────────────── */
function MilestonesPanel({ subCount }) {
  const count = subCount || 0;
  return (
    <div style={{ background: 'rgba(8,11,24,0.8)', border: `1px solid ${PINK}20`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Award style={{ width: 16, height: 16, color: PINK }} />
        <span style={{ fontWeight: 700, color: PINK, fontSize: 15, ...T }}>Growth Milestones</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: G, fontWeight: 700, ...T }}>{count} subs</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MILESTONES.map(m => {
          const Icon      = m.icon;
          const unlocked  = count >= m.subs;
          const pct       = Math.min((count / m.subs) * 100, 100);
          return (
            <div key={m.subs} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: unlocked ? 1 : 0.55,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: unlocked ? `${m.color}25` : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${unlocked ? m.color : '#ffffff20'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unlocked
                  ? <Icon style={{ width: 14, height: 14, color: m.color }} />
                  : <Lock style={{ width: 12, height: 12, color: '#ffffff30' }} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: unlocked ? '#fff' : 'rgba(255,255,255,0.5)', ...T }}>{m.reward || m.label}</span>
                  <span style={{ fontSize: 10, color: unlocked ? m.color : '#4b5563', fontWeight: 700, ...T }}>{m.subs.toLocaleString()} subs</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: 99, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── ConversionFunnel ────────────────────────────────────────────────── */
function ConversionFunnel({ totalViewers, subscribers, tips, activePPV }) {
  const viewers  = totalViewers || 0;
  const subs     = subscribers?.length || 0;
  const tippers  = tips?.length || 0;
  const ppv      = activePPV || 0;
  const convRate = viewers > 0 ? ((subs / viewers) * 100).toFixed(1) : '0.0';

  const stages = [
    { label: 'Total Viewers',   val: viewers,  color: '#C0392B', pct: 100 },
    { label: 'Subscribers',     val: subs,     color: TEAL,      pct: viewers > 0 ? Math.min((subs / viewers) * 100, 100) : 0 },
    { label: 'Active Tippers',  val: tippers,  color: PINK,      pct: subs > 0 ? Math.min((tippers / subs) * 100, 100) : 0 },
    { label: 'PPV Buyers',      val: ppv,      color: G,         pct: viewers > 0 ? Math.min((ppv / viewers) * 100, 100) : 0 },
  ];

  return (
    <div style={{ background: 'rgba(8,11,24,0.8)', border: `1px solid ${TEAL}20`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Activity style={{ width: 16, height: 16, color: TEAL }} />
        <span style={{ fontWeight: 700, color: TEAL, fontSize: 15, ...T }}>Conversion Funnel</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: G, fontWeight: 700, ...T }}>
          {convRate}% conv. rate
        </span>
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 16px', ...T }}>
        Viewer → subscriber pipeline
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stages.map((stage, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', ...T }}>{stage.label}</span>
              <span style={{ fontSize: 12, color: stage.color, fontWeight: 700, ...T }}>{stage.val.toLocaleString()}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stage.pct}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: i * 0.15 }}
                style={{ height: '100%', background: stage.color, borderRadius: 99 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── StreakWidget ────────────────────────────────────────────────────── */
function StreakWidget({ transactions }) {
  const today       = new Date();
  const streamDays  = new Set(
    transactions.map(t => new Date(t.created_date).toDateString())
  );
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (streamDays.has(d.toDateString())) streak++;
    else break;
  }
  const bonusPct = Math.min(streak * 2, 20);

  return (
    <div style={{ background: 'rgba(8,11,24,0.8)', border: `1px solid ${CRIMSON}25`, borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          background: `${CRIMSON}20`, border: `2px solid ${CRIMSON}60`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Flame style={{ width: 24, height: 24, color: CRIMSON }} />
      </motion.div>
      <div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 2px', ...T }}>Streamer Streak</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 2px', ...T }}>
          {streak} <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>days</span>
        </p>
        {bonusPct > 0
          ? <p style={{ fontSize: 11, color: '#6DBF7E', margin: 0, fontWeight: 700, ...T }}>+{bonusPct}% revenue boost active!</p>
          : <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, ...T }}>Stream today to start a streak</p>
        }
      </div>
    </div>
  );
}

/* ─── TABS ──────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',    label: 'Overview',    icon: BarChart3 },
  { id: 'streams',     label: 'Revenue',     icon: DollarSign },
  { id: 'subscribers', label: 'Subscribers', icon: Users },
  { id: 'payouts',     label: 'Payouts',     icon: CreditCard },
  { id: 'tiers',       label: 'Tiers',       icon: Crown },
  { id: 'analytics',   label: 'Analytics',   icon: BarChart3 },
  { id: 'store',       label: 'Store',       icon: DollarSign },
];

/* ─── MAIN PAGE ─────────────────────────────────────────────────────────── */
export default function MonetizationPage() {
  const [tab, setTab]               = useState('overview');
  const [flywheelStage, setStage]   = useState('attract');
  const [tierEditorOpen, setTierEditorOpen] = useState(false);
  const queryClient                 = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: room } = useQuery({
    queryKey: ['userRoom', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const rooms = await base44.entities.Room.filter({ creator_id: user.id }, '-viewer_count', 1);
      return rooms?.[0];
    },
    enabled: !!user?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['userEarnings', user?.id],
    queryFn: () => base44.entities.Transaction.filter({ to_user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['activeSubscribers', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ creator_id: user.id, status: 'active' }),
    enabled: !!user?.id,
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['creatorTips', user?.id],
    queryFn: () => base44.entities.Tip.filter({ creator_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: ppvEvents = [] } = useQuery({
    queryKey: ['ppv-events-monetization', user?.id],
    queryFn: () => base44.entities.PayPerViewEvent.filter({ creator_id: user.id }, '-event_date', 3),
    enabled: !!user?.id,
  });

  // Revenue calculations (90/10 split)
  const grossEarnings  = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const platformFee    = grossEarnings * 0.10;
  const processingFee  = transactions.length * 0.30 + (grossEarnings * 0.029);
  const netEarnings    = grossEarnings - platformFee - processingFee;
  const subCount       = subscriptions.length;
  const tierCounts     = subscriptions.reduce((acc, s) => { acc[s.tier] = (acc[s.tier] || 0) + 1; return acc; }, {});
  const mrr            = (tierCounts.bronze || 0) * 1 + (tierCounts.premium || 0) * 5 + (tierCounts.elite || 0) * 15;

  // Rotate flywheel stage automatically
  useEffect(() => {
    const idx   = FLYWHEEL_STAGES.findIndex(s => s.id === flywheelStage);
    const timer = setTimeout(() => {
      setStage(FLYWHEEL_STAGES[(idx + 1) % FLYWHEEL_STAGES.length].id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [flywheelStage]);

  const card = (children, extra = {}) => ({
    background: 'rgba(8,11,24,0.85)',
    border: '1px solid rgba(212,175,55,0.1)',
    borderRadius: 16,
    padding: 20,
    ...extra,
  });

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, padding: '12px 16px',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
        background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)',
      }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Rocket style={{ width: 20, height: 20, color: G }} />
            <h1 style={{ fontSize: 26, fontWeight: 900, color: G, margin: 0, ...T }}>
              Monetization Flywheel
            </h1>
            <span style={{
              marginLeft: 'auto', fontSize: 11, padding: '3px 10px',
              borderRadius: 99, background: `${CRIMSON}25`, color: PINK, border: `1px solid ${CRIMSON}50`,
              fontWeight: 700, ...T,
            }}>90% to you</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, ...T }}>
            Attract → Engage → Convert → Monetize → Retain → Grow
          </p>
        </motion.div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0', overflowX: 'auto' }}>
        {TABS.map(t => {
          const Icon    = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                borderRadius: 8, border: `1px solid ${isActive ? G + '60' : 'rgba(255,255,255,0.08)'}`,
                background: isActive ? `${G}15` : 'transparent',
                color: isActive ? G : 'rgba(255,255,255,0.5)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s', outline: 'none', ...T,
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {t.label}
            </button>
          );
        })}
        <button
          onClick={() => { exportCSV(transactions, subscriptions); toast.success('Report exported!'); }}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 8, border: `1px solid ${CRIMSON}40`,
            background: `${CRIMSON}15`, color: PINK,
            fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'all 0.2s', outline: 'none', ...T, flexShrink: 0,
          }}
        >
          <Download style={{ width: 13, height: 13 }} />
          Export CSV
        </button>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px 80px' }}>
        <AnimatePresence mode="wait">
          {/* ─── OVERVIEW TAB ─── */}
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Top KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Net Earnings', val: `$${netEarnings.toFixed(2)}`, icon: DollarSign, color: G },
                  { label: 'MRR',          val: `$${mrr.toFixed(2)}`,         icon: TrendingUp, color: TEAL },
                  { label: 'Subscribers',  val: subCount,                      icon: Users,      color: PINK },
                  { label: 'Avg Tip',      val: tips.length ? `$${(tips.reduce((s, t) => s + (t.amount || 0), 0) / tips.length).toFixed(2)}` : '$0', icon: Heart, color: '#f97316' },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} style={{ ...card(), border: `1px solid ${stat.color}25` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Icon style={{ width: 14, height: 14, color: stat.color }} />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', ...T }}>{stat.label}</span>
                      </div>
                      <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, ...T }}>{stat.val}</p>
                    </div>
                  );
                })}
              </div>

              {/* Flywheel + funnel row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                <div style={{ ...card(), flex: '0 0 auto' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: G, margin: '0 0 12px', ...T }}>Revenue Flywheel</p>
                  <FlywheelDiagram activeStage={flywheelStage} onStageClick={setStage} />
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {FLYWHEEL_STAGES.map(s => (
                      <button key={s.id} onClick={() => setStage(s.id)} style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 99, border: `1px solid ${flywheelStage === s.id ? s.color : s.color + '30'}`,
                        background: flywheelStage === s.id ? `${s.color}20` : 'transparent',
                        color: flywheelStage === s.id ? s.color : 'rgba(255,255,255,0.35)',
                        cursor: 'pointer', outline: 'none', ...T, fontWeight: 700,
                      }}>{s.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <ConversionFunnel
                    totalViewers={room?.viewer_count || 0}
                    subscribers={subscriptions}
                    tips={tips}
                    activePPV={0}
                  />
                  <StreakWidget transactions={transactions} />
                </div>
              </div>

              {/* 90/10 split bar */}
              <div style={card()}>
                <p style={{ fontSize: 13, fontWeight: 700, color: G, margin: '0 0 12px', ...T }}>90/10 Platform Split</p>
                <div style={{ height: 52, borderRadius: 10, overflow: 'hidden', display: 'flex', marginBottom: 12 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '90%' }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ background: `linear-gradient(to right, ${CRIMSON}, ${G})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, ...T }}
                  >
                    90% YOURS — ${netEarnings.toFixed(2)}
                  </motion.div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 10, ...T }}>
                    10%
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, fontSize: 11 }}>
                  <div style={{ background: `${G}0F`, borderRadius: 8, padding: 10 }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 2px', ...T }}>Gross Revenue</p>
                    <p style={{ color: G, fontWeight: 700, margin: 0, fontSize: 16, ...T }}>${grossEarnings.toFixed(2)}</p>
                  </div>
                  <div style={{ background: `${CRIMSON}0F`, borderRadius: 8, padding: 10 }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 2px', ...T }}>Platform Fee</p>
                    <p style={{ color: PINK, fontWeight: 700, margin: 0, fontSize: 16, ...T }}>-${platformFee.toFixed(2)}</p>
                  </div>
                  <div style={{ background: 'rgba(212,175,55,0.08)', borderRadius: 8, padding: 10 }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 2px', ...T }}>Processing</p>
                    <p style={{ color: '#C9A84C', fontWeight: 700, margin: 0, fontSize: 16, ...T }}>-${processingFee.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── REVENUE STREAMS TAB ─── */}
          {tab === 'streams' && (
            <motion.div key="streams" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={card()}>
                <p style={{ fontSize: 15, fontWeight: 700, color: G, margin: '0 0 14px', ...T }}>All Revenue Streams</p>
                <RevenueStreamsPanel transactions={transactions} subscriptions={subscriptions} />
              </div>

              {/* PPV Manager */}
              {room?.id && (
                <div style={card()}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: TEAL, margin: '0 0 14px', ...T }}>Pay-Per-View Events</p>
                  <PayPerViewManager roomId={room.id} />
                </div>
              )}

              {/* PPV Event Cards */}
              {ppvEvents.length > 0 && (
                <div style={card()}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: TEAL, margin: '0 0 14px', ...T }}>Recent PPV Events</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {ppvEvents.map(ev => <PayPerViewCard key={ev.id} event={ev} />)}
                  </div>
                </div>
              )}

              {/* Subscription Manager */}
              {user?.id && (
                <div style={card()}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: PINK, margin: '0 0 14px', ...T }}>Subscription Settings</p>
                  <SubscriptionManager creatorId={user.id} />
                </div>
              )}
            </motion.div>
          )}

          {/* ─── SUBSCRIBERS TAB ─── */}
          {tab === 'subscribers' && (
            <motion.div key="subscribers" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ ...card(), marginBottom: 16 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: G, margin: '0 0 14px', ...T }}>Tier Upgrade Ladder</p>
                    <TierLadderPanel subCount={subCount} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <MilestonesPanel subCount={subCount} />
                  <div style={card()}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: TEAL, margin: '0 0 14px', ...T }}>Tier Breakdown</p>
                    {[
                      { name: 'Bronze', key: 'bronze', price: 1,  color: '#ea580c' },
                      { name: 'Silver', key: 'premium', price: 5,  color: '#9ca3af' },
                      { name: 'Gold',   key: 'elite',  price: 15, color: G },
                    ].map(tier => {
                      const cnt     = tierCounts[tier.key] || 0;
                      const tierMrr = cnt * tier.price * 0.9;
                      return (
                        <div key={tier.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: tier.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 13, color: '#fff', ...T }}>{tier.name} (${tier.price}/mo)</span>
                          <span style={{ fontSize: 13, color: tier.color, fontWeight: 700, ...T }}>{cnt}</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', ...T }}>${tierMrr.toFixed(2)}/mo</span>
                        </div>
                      );
                    })}
                    <div style={{ paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: G, fontWeight: 700, ...T }}>Total MRR (90%)</span>
                      <span style={{ fontSize: 15, color: G, fontWeight: 700, ...T }}>${(mrr * 0.9).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── PAYOUTS TAB ─── */}
          {tab === 'payouts' && (
            <motion.div key="payouts" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <PayoutPanel netEarnings={netEarnings} />
              {user?.id && <RevenueDashboard userId={user.id} />}
              {user?.id && <StripeConnectButton creatorId={user.id} />}
              {user?.id && <RewardShopEditor creatorId={user.id} />}
              <StreamerMonetizationCenter />
            </motion.div>
          )}

          {tab === 'tiers' && user?.id && (
            <motion.div key="tiers" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <CreatorTierManager creatorId={user.id} />
              <TierEditor open={tierEditorOpen} onClose={() => setTierEditorOpen(false)} creatorId={user.id} existing={null} />
              <SubscriptionTiers communityId={null} userId={user.id} />
              <SubscriptionCard
                tier="bronze"
                price={4.99}
                benefits={['Exclusive badges', 'Early access']}
                communityId={null}
                creatorId={user.id}
                isSubscribed={false}
              />
            </motion.div>
          )}

          {tab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <MonetizationDashboard roomId={room?.id || null} />
            </motion.div>
          )}

          {tab === 'store' && user?.id && (
            <motion.div key="store" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-8">
              <VirtualGoodsStore userId={user.id} />
              <ShopDashboard creatorId={user.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
