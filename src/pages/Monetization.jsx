import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign, TrendingUp, Users, Zap, Crown, Star, Gift,
  CreditCard, ArrowRight, ChevronRight, BarChart3, Download,
  Repeat, Flame, Award, CheckCircle, Lock,
  PlayCircle, Heart, Music, Calendar, Shield, Rocket, Eye, Activity
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
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import AlertConfig from '../components/live/AlertConfig';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import CreatorBridge from '../components/social/CreatorBridge';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import TierSubscribeCard from '../components/subscriptions/TierSubscribeCard';

var G       = '#D4AF37';
var BG      = '#080B18';
var CRIMSON = '#800020';
var PINK    = '#C0392B';
var TEAL    = '#D4854A';

var FLYWHEEL_STAGES = [
  { id: 'attract',  label: 'ATTRACT',  icon: Eye,         color: '#C0392B', desc: 'Free content hooks new viewers' },
  { id: 'engage',   label: 'ENGAGE',   icon: Heart,       color: PINK,      desc: 'Chat, reactions & live interaction' },
  { id: 'convert',  label: 'CONVERT',  icon: ArrowRight,  color: TEAL,      desc: 'Free → Subscriber upgrade' },
  { id: 'monetize', label: 'MONETIZE', icon: DollarSign,  color: G,         desc: 'Tips, PPV, subs, gifts, AI music' },
  { id: 'retain',   label: 'RETAIN',   icon: Repeat,      color: '#6DBF7E', desc: 'Perks, streaks & loyalty rewards' },
  { id: 'grow',     label: 'GROW',     icon: TrendingUp,  color: CRIMSON,   desc: 'Word-of-mouth & referral flywheel' },
];

var TIER_LADDER = [
  { id: 'free',    label: 'Free',   price: 0,  color: '#6b7280', icon: Eye,    perks: ['Chat access', 'Watch live & VODs', 'Community feed'] },
  { id: 'bronze',  label: 'Bronze', price: 1,  color: '#C0392B', icon: Star,   perks: ['Bronze badge', 'Early chat access', 'Custom emote ×1', 'Monthly shoutout'] },
  { id: 'silver',  label: 'Silver', price: 5,  color: '#9ca3af', icon: Zap,    perks: ['Silver badge', 'Ad-free viewing', 'Custom emotes ×3', 'Backstage access', 'Priority queue'] },
  { id: 'gold',    label: 'Gold',   price: 15, color: G,         icon: Crown,  perks: ['Gold crown badge', 'All Silver perks', 'PPV 20% off', 'Co-host consideration', 'DM access'] },
  { id: 'elite',   label: 'Elite',  price: 50, color: PINK,      icon: Rocket, perks: ['Elite status', 'All Gold perks', 'Revenue share on collabs', 'Brand partnership priority', 'Direct Slack channel'] },
];

var REVENUE_STREAMS = [
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, color: G,         desc: 'Monthly recurring tiers', split: '90%' },
  { id: 'tips',          label: 'Live Tips',     icon: Heart,      color: PINK,       desc: 'Real-time tip alerts',    split: '90%' },
  { id: 'ppv',           label: 'Pay-Per-View',  icon: PlayCircle, color: TEAL,       desc: 'Gated events & replays',  split: '85%' },
  { id: 'gifts',         label: 'Virtual Gifts', icon: Gift,       color: '#D4854A', desc: 'Animated gift shop',       split: '80%' },
  { id: 'music',         label: 'AI Music',      icon: Music,      color: '#a855f7', desc: 'Stream your AI tracks',    split: '70%' },
  { id: 'ads',           label: 'Ad Revenue',    icon: BarChart3,  color: '#6DBF7E', desc: 'CPM-based display ads',    split: '65%' },
];

var MILESTONES = [
  { subs: 10,   reward: 'Bronze Creator Badge',   icon: Star,   color: '#C0392B' },
  { subs: 50,   reward: 'Verified Creator Label', icon: Shield, color: '#D4AF37' },
  { subs: 100,  reward: 'Custom Channel Banner',  icon: Award,  color: G },
  { subs: 500,  reward: 'Staff Pick Feature',     icon: Zap,    color: PINK },
  { subs: 1000, reward: 'Revenue Share Boost +5%',icon: Rocket, color: TEAL },
  { subs: 5000, label: 'Partner Status',          icon: Crown,  color: '#D4854A' },
];

function exportCSV(transactions, subscriptions) {
  var rows = [['Type', 'Amount', 'Date', 'Description']];
  transactions.forEach(function(t) {
    rows.push([t.transaction_type || 'transaction', '$' + (t.creator_payout || 0).toFixed(2), new Date(t.created_date).toLocaleDateString(), t.description || '']);
  });
  subscriptions.forEach(function(s) {
    rows.push(['subscription', '$' + (s.price || 0) + '/mo', new Date(s.created_date).toLocaleDateString(), s.tier_name || '']);
  });
  var csv = rows.map(function(r) { return r.map(function(v) { return JSON.stringify(v); }).join(','); }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'seewhy_revenue_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function FlywheelDiagram(props) {
  var activeStage = props.activeStage;
  var onStageClick = props.onStageClick;
  var cx = 160, cy = 160, r = 110;
  return (
    <div style={{ position: 'relative', width: 320, height: 320, flexShrink: 0 }}>
      <svg width="320" height="320" style={{ position: 'absolute', inset: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={r - 20} fill="none" stroke="rgba(212,175,55,0.04)" strokeWidth="1" strokeDasharray="4 6" />
        {FLYWHEEL_STAGES.map(function(_, i) {
          var a1 = (i / FLYWHEEL_STAGES.length) * Math.PI * 2 - Math.PI / 2;
          var a2 = ((i + 1) / FLYWHEEL_STAGES.length) * Math.PI * 2 - Math.PI / 2;
          var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
          var x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
          var large = (a2 - a1) > Math.PI ? 1 : 0;
          return (
            <path key={i} d={'M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2}
              fill="none" stroke={FLYWHEEL_STAGES[i].color} strokeWidth="2"
              strokeOpacity={activeStage === FLYWHEEL_STAGES[i].id ? 0.9 : 0.2}
              style={{ transition: 'stroke-opacity 0.3s' }}
            />
          );
        })}
      </svg>

      {FLYWHEEL_STAGES.map(function(stage, i) {
        var angle = (i / FLYWHEEL_STAGES.length) * Math.PI * 2 - Math.PI / 2;
        var x = cx + r * Math.cos(angle) - 22;
        var y = cy + r * Math.sin(angle) - 22;
        var Icon = stage.icon;
        var isActive = activeStage === stage.id;
        return (
          <motion.button
            key={stage.id}
            style={{
              position: 'absolute', left: x, top: y, width: 44, height: 44,
              borderRadius: '50%', border: '2px solid ' + (isActive ? stage.color : stage.color + '40'),
              background: isActive ? stage.color + '25' : 'rgba(8,11,24,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', outline: 'none',
              boxShadow: isActive ? '0 0 16px ' + stage.color + '60' : 'none',
              transition: 'all 0.2s',
            }}
            animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={{ duration: 1.4, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
            onClick={function() { onStageClick(stage.id); }}
          >
            <Icon style={{ width: 18, height: 18, color: isActive ? stage.color : stage.color + '99' }} />
          </motion.button>
        );
      })}

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
          <p style={{ color: G, fontSize: 13, fontWeight: 900, margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {(function() { var _fs = FLYWHEEL_STAGES.find(function(s) { return s.id === activeStage; }); return _fs ? _fs.label : null; })() || 'FLYWHEEL'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0', maxWidth: 80, lineHeight: 1.3, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {(function() { var _fs = FLYWHEEL_STAGES.find(function(s) { return s.id === activeStage; }); return _fs ? _fs.desc : null; })()}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function TierLadderPanel(props) {
  var subCount = props.subCount;
  var hoveredState = useState(null);
  var hovered = hoveredState[0];
  var setHovered = hoveredState[1];

  var achieved = subCount || 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {TIER_LADDER.map(function(tier, i) {
        var Icon = tier.icon;
        var isHover = hovered === tier.id;
        return (
          <motion.div
            key={tier.id}
            onHoverStart={function() { setHovered(tier.id); }}
            onHoverEnd={function() { setHovered(null); }}
            style={{
              border: '1px solid ' + (isHover ? tier.color : tier.color + '30'),
              borderRadius: 12, padding: '12px 16px',
              background: isHover ? tier.color + '10' : 'rgba(8,11,24,0.7)',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: tier.color + '20', border: '2px solid ' + tier.color + '60',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon style={{ width: 18, height: 18, color: tier.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'Barlow Condensed, sans-serif' }}>{tier.label}</span>
                {tier.price === 0
                  ? <span style={{ fontSize: 10, color: '#6b7280', fontFamily: 'Barlow Condensed, sans-serif' }}>FREE</span>
                  : <span style={{ fontSize: 10, color: tier.color, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>${tier.price}/mo</span>
                }
                {i > 0 && i < TIER_LADDER.length - 1 && (
                  <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 'auto', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {i > 0 ? ('↑ Upgrade from ' + TIER_LADDER[i - 1].label) : ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {tier.perks.slice(0, isHover ? tier.perks.length : 2).map(function(perk, j) {
                  return (
                  <span key={j} style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 99,
                    background: tier.color + '15', color: tier.color + 'cc', fontFamily: 'Barlow Condensed, sans-serif',
                  }}>{perk}</span>
                  );
                })}
                {!isHover && tier.perks.length > 2 && (
                  <span style={{ fontSize: 10, color: '#4b5563', fontFamily: 'Barlow Condensed, sans-serif' }}>+{tier.perks.length - 2} more</span>
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

function RevenueStreamsPanel(props) {
  var transactions = props.transactions;
  var subscriptions = props.subscriptions;
  function txGross(t) { return (t.creator_payout || 0) + (t.platform_cut || 0); }
  var tipTotal  = transactions.filter(function(t) { return t.transaction_type === 'tip'; }).reduce(function(s, t) { return s + txGross(t); }, 0);
  var ppvTotal  = transactions.filter(function(t) { return t.transaction_type === 'ppv'; }).reduce(function(s, t) { return s + txGross(t); }, 0);
  var subTotal  = subscriptions.reduce(function(s, sub) { return s + (sub.price || 0); }, 0);
  var giftTotal = transactions.filter(function(t) { return t.transaction_type === 'gift'; }).reduce(function(s, t) { return s + txGross(t); }, 0);
  var gross     = tipTotal + ppvTotal + subTotal + giftTotal;

  var streams = [
    Object.assign({}, REVENUE_STREAMS[0], { amount: subTotal }),
    Object.assign({}, REVENUE_STREAMS[1], { amount: tipTotal }),
    Object.assign({}, REVENUE_STREAMS[2], { amount: ppvTotal }),
    Object.assign({}, REVENUE_STREAMS[3], { amount: giftTotal }),
    Object.assign({}, REVENUE_STREAMS[4], { amount: 0 }),
    Object.assign({}, REVENUE_STREAMS[5], { amount: 0 }),
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
      {streams.map(function(stream) {
        var Icon  = stream.icon;
        var pct   = gross > 0 ? (stream.amount / gross) * 100 : 0;
        return (
          <div key={stream.id} style={{
            background: 'rgba(8,11,24,0.8)', border: '1px solid ' + stream.color + '25',
            borderRadius: 12, padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon style={{ width: 16, height: 16, color: stream.color }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>{stream.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: stream.color, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>{stream.split}</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px', fontFamily: 'Barlow Condensed, sans-serif' }}>${stream.amount.toFixed(2)}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '0 0 10px' }}>{stream.desc}</p>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: pct + '%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', background: stream.color, borderRadius: 99 }}
              />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '4px 0 0', fontFamily: 'Barlow Condensed, sans-serif' }}>{pct.toFixed(1)}% of total</p>
          </div>
        );
      })}
    </div>
  );
}

function PayoutPanel(props) {
  var netEarnings = props.netEarnings;
  var THRESHOLD = 50;
  var pct       = Math.min((netEarnings / THRESHOLD) * 100, 100);
  var nextDate  = (function() {
    var d = new Date();
    d.setDate(d.getDate() + (15 - (d.getDate() % 15) || 15));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })();

  return (
    <div style={{ background: 'rgba(8,11,24,0.8)', border: '1px solid ' + G + '20', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Calendar style={{ width: 16, height: 16, color: G }} />
        <span style={{ fontWeight: 700, color: G, fontSize: 15, fontFamily: 'Barlow Condensed, sans-serif' }}>Payout Schedule</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: G + '0F', border: '1px solid ' + G + '25', borderRadius: 10, padding: 14 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', fontFamily: 'Barlow Condensed, sans-serif' }}>Available Balance</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: G, margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>${netEarnings.toFixed(2)}</p>
        </div>
        <div style={{ background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.2)', borderRadius: 10, padding: 14 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', fontFamily: 'Barlow Condensed, sans-serif' }}>Next Payout Date</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#6DBF7E', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>{nextDate}</p>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>Threshold Progress</span>
          <span style={{ fontSize: 11, color: G, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>${netEarnings.toFixed(2)} / ${THRESHOLD}</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: pct + '%' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ height: '100%', background: 'linear-gradient(to right, ' + CRIMSON + ', ' + G + ')', borderRadius: 99 }}
          />
        </div>
      </div>

      {pct >= 100 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(109,191,126,0.12)', border: '1px solid rgba(109,191,126,0.25)' }}>
          <CheckCircle style={{ width: 14, height: 14, color: '#6DBF7E' }} />
          <span style={{ fontSize: 11, color: '#6DBF7E', fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>Payout eligible — auto-processed on {nextDate}</span>
        </div>
      ) : (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>
          ${(THRESHOLD - netEarnings).toFixed(2)} more to unlock auto-payout
        </p>
      )}
    </div>
  );
}

function MilestonesPanel(props) {
  var subCount = props.subCount;
  var count = subCount || 0;
  return (
    <div style={{ background: 'rgba(8,11,24,0.8)', border: '1px solid ' + PINK + '20', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Award style={{ width: 16, height: 16, color: PINK }} />
        <span style={{ fontWeight: 700, color: PINK, fontSize: 15, fontFamily: 'Barlow Condensed, sans-serif' }}>Growth Milestones</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: G, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>{count} subs</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MILESTONES.map(function(m) {
          var Icon      = m.icon;
          var unlocked  = count >= m.subs;
          var pct       = Math.min((count / m.subs) * 100, 100);
          return (
            <div key={m.subs} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: unlocked ? 1 : 0.55,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: unlocked ? m.color + '25' : 'rgba(255,255,255,0.05)',
                border: '1.5px solid ' + (unlocked ? m.color : '#ffffff20'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unlocked
                  ? <Icon style={{ width: 14, height: 14, color: m.color }} />
                  : <Lock style={{ width: 12, height: 12, color: '#ffffff30' }} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: unlocked ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{m.reward || m.label}</span>
                  <span style={{ fontSize: 10, color: unlocked ? m.color : '#4b5563', fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>{m.subs.toLocaleString()} subs</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: m.color, borderRadius: 99, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConversionFunnel(props) {
  var totalViewers = props.totalViewers;
  var subscribers = props.subscribers;
  var tips = props.tips;
  var activePPV = props.activePPV;
  var viewers  = totalViewers || 0;
  var subs     = (subscribers && subscribers.length) || 0;
  var tippers  = (tips && tips.length) || 0;
  var ppv      = activePPV || 0;
  var convRate = viewers > 0 ? ((subs / viewers) * 100).toFixed(1) : '0.0';

  var stages = [
    { label: 'Total Viewers',   val: viewers,  color: '#C0392B', pct: 100 },
    { label: 'Subscribers',     val: subs,     color: TEAL,      pct: viewers > 0 ? Math.min((subs / viewers) * 100, 100) : 0 },
    { label: 'Active Tippers',  val: tippers,  color: PINK,      pct: subs > 0 ? Math.min((tippers / subs) * 100, 100) : 0 },
    { label: 'PPV Buyers',      val: ppv,      color: G,         pct: viewers > 0 ? Math.min((ppv / viewers) * 100, 100) : 0 },
  ];

  return (
    <div style={{ background: 'rgba(8,11,24,0.8)', border: '1px solid ' + TEAL + '20', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Activity style={{ width: 16, height: 16, color: TEAL }} />
        <span style={{ fontWeight: 700, color: TEAL, fontSize: 15, fontFamily: 'Barlow Condensed, sans-serif' }}>Conversion Funnel</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: G, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {convRate}% conv. rate
        </span>
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 16px', fontFamily: 'Barlow Condensed, sans-serif' }}>
        Viewer → subscriber pipeline
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stages.map(function(stage, i) {
          return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: 'Barlow Condensed, sans-serif' }}>{stage.label}</span>
              <span style={{ fontSize: 12, color: stage.color, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>{stage.val.toLocaleString()}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: stage.pct + '%' }}
                transition={{ duration: 1, ease: 'easeOut', delay: i * 0.15 }}
                style={{ height: '100%', background: stage.color, borderRadius: 99 }}
              />
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function StreakWidget(props) {
  var transactions = props.transactions;
  var today       = new Date();
  var streamDays  = new Set(
    transactions.map(function(t) { return new Date(t.created_date).toDateString(); })
  );
  var streak = 0;
  for (var i = 0; i < 30; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    if (streamDays.has(d.toDateString())) streak++;
    else break;
  }
  var bonusPct = Math.min(streak * 2, 20);

  return (
    <div style={{ background: 'rgba(8,11,24,0.8)', border: '1px solid ' + CRIMSON + '25', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          background: CRIMSON + '20', border: '2px solid ' + CRIMSON + '60',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Flame style={{ width: 24, height: 24, color: CRIMSON }} />
      </motion.div>
      <div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 2px', fontFamily: 'Barlow Condensed, sans-serif' }}>Streamer Streak</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 2px', fontFamily: 'Barlow Condensed, sans-serif' }}>
          {streak} <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>days</span>
        </p>
        {bonusPct > 0
          ? <p style={{ fontSize: 11, color: '#6DBF7E', margin: 0, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>+{bonusPct}% revenue boost active!</p>
          : <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>Stream today to start a streak</p>
        }
      </div>
    </div>
  );
}

var TABS = [
  { id: 'overview',    label: 'Overview',    icon: BarChart3 },
  { id: 'streams',     label: 'Revenue',     icon: DollarSign },
  { id: 'subscribers', label: 'Subscribers', icon: Users },
  { id: 'payouts',     label: 'Payouts',     icon: CreditCard },
  { id: 'tiers',       label: 'Tiers',       icon: Crown },
  { id: 'analytics',   label: 'Analytics',   icon: BarChart3 },
  { id: 'store',       label: 'Store',       icon: DollarSign },
];

function card(children, extra) {
  return Object.assign({
    background: 'rgba(8,11,24,0.85)',
    border: '1px solid rgba(212,175,55,0.1)',
    borderRadius: 16,
    padding: 20,
  }, extra || {});
}

export default function MonetizationPage() {
  var tabState = useState('overview');
  var tab = tabState[0];
  var setTab = tabState[1];
  var flywheelStageState = useState('attract');
  var flywheelStage = flywheelStageState[0];
  var setStage = flywheelStageState[1];
  var showTierEditorState = useState(false);
  var showTierEditor = showTierEditorState[0];
  var setShowTierEditor = showTierEditorState[1];
  var editingTierState = useState(null);
  var editingTier = editingTierState[0];
  var setEditingTier = editingTierState[1];
  var queryClient = useQueryClient();

  var userQuery = useQuery({ queryKey: ['currentUser'], queryFn: function() { return base44.auth.me(); } });
  var user = userQuery.data || null;

  var userCommunityQuery = useQuery({
    queryKey: ['userCommunity', (user && user.id)],
    queryFn: function() { return base44.entities.Community.filter({ owner_id: (user && user.id) }).then(function(r) { return r[0] || null; }); },
    enabled: !!(user && user.id),
  });
  var userCommunity = userCommunityQuery.data || null;
  var userCommunityId = (userCommunity && userCommunity.id) || null;

  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, null);

  var roomQuery = useQuery({
    queryKey: ['userRoom', (user && user.id)],
    queryFn: async function() {
      if (!(user && user.id)) return null;
      var rooms = await base44.entities.Room.filter({ creator_id: user.id }, '-viewer_count', 1);
      return (rooms && rooms[0]);
    },
    enabled: !!(user && user.id),
  });
  var room = roomQuery.data || null;

  var transactionsQuery = useQuery({
    queryKey: ['userEarnings', (user && user.id)],
    queryFn: function() { return base44.entities.Transaction.filter({ recipient_id: user.id }); },
    enabled: !!(user && user.id),
  });
  var transactions = transactionsQuery.data || [];

  var subscriptionsQuery = useQuery({
    queryKey: ['activeSubscribers', (user && user.id)],
    queryFn: function() { return base44.entities.Subscription.filter({ creator_id: user.id, status: 'active' }); },
    enabled: !!(user && user.id),
  });
  var subscriptions = subscriptionsQuery.data || [];

  var tipsQuery = useQuery({
    queryKey: ['creatorTips', (user && user.id)],
    queryFn: function() { return base44.entities.TipAlert.filter({ creator_id: user.id }); },
    enabled: !!(user && user.id),
  });
  var tips = tipsQuery.data || [];

  var ppvEventsQuery = useQuery({
    queryKey: ['ppv-events-monetization', (user && user.id)],
    queryFn: function() { return base44.entities.PayPerViewEvent.filter({ creator_id: user.id }, '-event_date', 3); },
    enabled: !!(user && user.id),
  });
  var ppvEvents = ppvEventsQuery.data || [];

  var grossEarnings  = transactions.reduce(function(s, t) { return s + (t.creator_payout || 0) + (t.platform_cut || 0); }, 0);
  var platformFee    = grossEarnings * 0.10;
  var processingFee  = transactions.length * 0.30 + (grossEarnings * 0.029);
  var netEarnings    = grossEarnings - platformFee - processingFee;
  var subCount       = subscriptions.length;
  var tierCounts     = subscriptions.reduce(function(acc, s) { acc[s.tier] = (acc[s.tier] || 0) + 1; return acc; }, {});
  var mrr            = (tierCounts.bronze || 0) * 1 + (tierCounts.premium || 0) * 5 + (tierCounts.elite || 0) * 15;

  useEffect(function() {
    var idx   = FLYWHEEL_STAGES.findIndex(function(s) { return s.id === flywheelStage; });
    var timer = setTimeout(function() {
      setStage(FLYWHEEL_STAGES[(idx + 1) % FLYWHEEL_STAGES.length].id);
    }, 3000);
    return function() { clearTimeout(timer); };
  }, [flywheelStage]);

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, padding: '12px 16px',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
        background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)',
      }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Rocket style={{ width: 20, height: 20, color: G }} />
            <h1 style={{ fontSize: 26, fontWeight: 900, color: G, margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Monetization Flywheel
            </h1>
            <span style={{
              marginLeft: 'auto', fontSize: 11, padding: '3px 10px',
              borderRadius: 99, background: CRIMSON + '25', color: PINK, border: '1px solid ' + CRIMSON + '50',
              fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif',
            }}>90% to you</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Attract → Engage → Convert → Monetize → Retain → Grow
          </p>
        </motion.div>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0', overflowX: 'auto' }}>
        {TABS.map(function(t) {
          var Icon    = t.icon;
          var isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={function() { setTab(t.id); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                borderRadius: 8, border: '1px solid ' + (isActive ? G + '60' : 'rgba(255,255,255,0.08)'),
                background: isActive ? G + '15' : 'transparent',
                color: isActive ? G : 'rgba(255,255,255,0.5)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s', outline: 'none', fontFamily: 'Barlow Condensed, sans-serif',
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {t.label}
            </button>
          );
        })}
        <button
          onClick={function() { exportCSV(transactions, subscriptions); toast.success('Report exported!'); }}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 8, border: '1px solid ' + CRIMSON + '40',
            background: CRIMSON + '15', color: PINK,
            fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'all 0.2s', outline: 'none', fontFamily: 'Barlow Condensed, sans-serif', flexShrink: 0,
          }}
        >
          <Download style={{ width: 13, height: 13 }} />
          Export CSV
        </button>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px 80px' }}>
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Net Earnings', val: '$' + netEarnings.toFixed(2), icon: DollarSign, color: G },
                  { label: 'MRR',          val: '$' + mrr.toFixed(2),         icon: TrendingUp, color: TEAL },
                  { label: 'Subscribers',  val: subCount,                      icon: Users,      color: PINK },
                  { label: 'Avg Tip',      val: tips.length ? '$' + (tips.reduce(function(s, t) { return s + (t.amount || 0); }, 0) / tips.length).toFixed(2) : '$0', icon: Heart, color: '#D4854A' },
                ].map(function(stat) {
                  var Icon = stat.icon;
                  return (
                    <div key={stat.label} style={Object.assign({}, card(), { border: '1px solid ' + stat.color + '25' })}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Icon style={{ width: 14, height: 14, color: stat.color }} />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{stat.label}</span>
                      </div>
                      <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>{stat.val}</p>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                <div style={card()}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: G, margin: '0 0 12px', fontFamily: 'Barlow Condensed, sans-serif' }}>Revenue Flywheel</p>
                  <FlywheelDiagram activeStage={flywheelStage} onStageClick={setStage} />
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {FLYWHEEL_STAGES.map(function(s) {
                      return (
                      <button key={s.id} onClick={function() { setStage(s.id); }} style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 99, border: '1px solid ' + (flywheelStage === s.id ? s.color : s.color + '30'),
                        background: flywheelStage === s.id ? s.color + '20' : 'transparent',
                        color: flywheelStage === s.id ? s.color : 'rgba(255,255,255,0.35)',
                        cursor: 'pointer', outline: 'none', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
                      }}>{s.label}</button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <ConversionFunnel
                    totalViewers={(room && room.viewer_count) || 0}
                    subscribers={subscriptions}
                    tips={tips}
                    activePPV={0}
                  />
                  <StreakWidget transactions={transactions} />
                </div>
              </div>

              <div style={card()}>
                <p style={{ fontSize: 13, fontWeight: 700, color: G, margin: '0 0 12px', fontFamily: 'Barlow Condensed, sans-serif' }}>90/10 Platform Split</p>
                <div style={{ height: 52, borderRadius: 10, overflow: 'hidden', display: 'flex', marginBottom: 12 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '90%' }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ background: 'linear-gradient(to right, ' + CRIMSON + ', ' + G + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'Barlow Condensed, sans-serif' }}
                  >
                    90% YOURS — ${netEarnings.toFixed(2)}
                  </motion.div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif' }}>
                    10%
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, fontSize: 11 }}>
                  <div style={{ background: G + '0F', borderRadius: 8, padding: 10 }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 2px', fontFamily: 'Barlow Condensed, sans-serif' }}>Gross Revenue</p>
                    <p style={{ color: G, fontWeight: 700, margin: 0, fontSize: 16, fontFamily: 'Barlow Condensed, sans-serif' }}>${grossEarnings.toFixed(2)}</p>
                  </div>
                  <div style={{ background: CRIMSON + '0F', borderRadius: 8, padding: 10 }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 2px', fontFamily: 'Barlow Condensed, sans-serif' }}>Platform Fee</p>
                    <p style={{ color: PINK, fontWeight: 700, margin: 0, fontSize: 16, fontFamily: 'Barlow Condensed, sans-serif' }}>-${platformFee.toFixed(2)}</p>
                  </div>
                  <div style={{ background: 'rgba(212,175,55,0.08)', borderRadius: 8, padding: 10 }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 2px', fontFamily: 'Barlow Condensed, sans-serif' }}>Processing</p>
                    <p style={{ color: '#C9A84C', fontWeight: 700, margin: 0, fontSize: 16, fontFamily: 'Barlow Condensed, sans-serif' }}>-${processingFee.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div style={{ borderRadius: 14, padding: '14px', background: 'rgba(8,11,24,0.95)', border: '1px solid rgba(123,45,139,0.22)' }}>
                <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(176,102,204,0.7)', marginBottom: 10 }}>🎬 Studio Revenue Streams</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { emoji: '🎬', label: 'Micro Drama', sub: 'Tip per episode + viewer votes', split: '90%', color: '#7B2D8B', href: 'EpisodeCreatorStudio' },
                    { emoji: '🎵', label: 'AI Music Live', sub: 'Tips + music purchase revenue', split: '70%', color: '#D4AF37', href: 'AIMusic' },
                    { emoji: '🎙', label: 'Podcast Studio', sub: 'PPV episode access + tips', split: '90%', color: '#00A8E8', href: 'PodcastStudio' },
                    { emoji: '📺', label: 'Episode Series', sub: 'Viewer engagement rewards', split: '90%', color: '#B066CC', href: 'EpisodeSeries' },
                  ].map(function(item) {
                    return (
                      <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
                        <div style={{ borderRadius: 10, padding: '10px 12px', background: item.color + '0C', border: '1px solid ' + item.color + '25', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 16 }}>{item.emoji}</span>
                            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 99, background: item.color + '18', color: item.color }}>{item.split}</span>
                          </div>
                          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{item.label}</p>
                          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{item.sub}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'streams' && (
            <motion.div key="streams" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={card()}>
                <p style={{ fontSize: 15, fontWeight: 700, color: G, margin: '0 0 14px', fontFamily: 'Barlow Condensed, sans-serif' }}>All Revenue Streams</p>
                <RevenueStreamsPanel transactions={transactions} subscriptions={subscriptions} />
              </div>

              {(room && room.id) && (
                <div style={card()}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: TEAL, margin: '0 0 14px', fontFamily: 'Barlow Condensed, sans-serif' }}>Pay-Per-View Events</p>
                  <PayPerViewManager roomId={room.id} />
                </div>
              )}

              {ppvEvents.length > 0 && (
                <div style={card()}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: TEAL, margin: '0 0 14px', fontFamily: 'Barlow Condensed, sans-serif' }}>Recent PPV Events</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {ppvEvents.map(function(ev) { return <PayPerViewCard key={ev.id} event={ev} />; })}
                  </div>
                </div>
              )}

              {(user && user.id) && (
                <div style={card()}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: PINK, margin: '0 0 14px', fontFamily: 'Barlow Condensed, sans-serif' }}>Subscription Settings</p>
                  <SubscriptionManager creatorId={user.id} />
                </div>
              )}
            </motion.div>
          )}

          {tab === 'subscribers' && (
            <motion.div key="subscribers" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={Object.assign({}, card(), { marginBottom: 16 })}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: G, margin: '0 0 14px', fontFamily: 'Barlow Condensed, sans-serif' }}>Tier Upgrade Ladder</p>
                    <TierLadderPanel subCount={subCount} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <MilestonesPanel subCount={subCount} />
                  <div style={card()}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: TEAL, margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>Tier Breakdown</p>
                      <button onClick={function() { setEditingTier(null); setShowTierEditor(true); }} style={{ padding: '5px 12px', borderRadius: 8, background: G + '18', border: '1px solid ' + G + '40', color: G, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}>+ Create Tier</button>
                    </div>
                    {[
                      { name: 'Bronze', key: 'bronze', price: 1,  color: '#C0392B' },
                      { name: 'Silver', key: 'premium', price: 5,  color: '#9ca3af' },
                      { name: 'Gold',   key: 'elite',  price: 15, color: G },
                    ].map(function(tier) {
                      var cnt     = tierCounts[tier.key] || 0;
                      var tierMrr = Math.floor(cnt * tier.price * 90) / 100;
                      return (
                        <div key={tier.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: tier.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 13, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{tier.name} (${tier.price}/mo)</span>
                          <span style={{ fontSize: 13, color: tier.color, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>{cnt}</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>${tierMrr.toFixed(2)}/mo</span>
                        </div>
                      );
                    })}
                    <div style={{ paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: G, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>Total MRR (90%)</span>
                      <span style={{ fontSize: 15, color: G, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>${(Math.floor(mrr * 90) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'subscribers' && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 16px 16px' }}>
              <Link to={createPageUrl('CreatorSubscriptions')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, letterSpacing: '0.06em', textDecoration: 'none', textTransform: 'uppercase' }}>
                ⭐ Manage Subscription Tiers →
              </Link>
            </div>
          )}

          {tab === 'payouts' && (
            <motion.div key="payouts" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <PayoutPanel netEarnings={netEarnings} />
              {(user && user.id) && <RevenueDashboard userId={user.id} />}
              {(user && user.id) && <StripeConnectButton creatorId={user.id} />}
              {(user && user.id) && <RewardShopEditor creatorId={user.id} />}
              <StreamerMonetizationCenter />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Link to={createPageUrl('MonetizationWidgets')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 900, letterSpacing: '0.06em', textDecoration: 'none', textTransform: 'uppercase' }}>
                  🎛 Sound Alerts & Goals Widgets →
                </Link>
              </div>
            </motion.div>
          )}

          {tab === 'tiers' && (user && user.id) && (
            <motion.div key="tiers" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <CreatorTierManager creatorId={user.id} />
              <TierEditor open={showTierEditor} onClose={function() { setShowTierEditor(false); }} creatorId={user.id} existing={null} />
              <SubscriptionTiers communityId={userCommunityId} userId={user.id} />
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
              <MonetizationDashboard roomId={(room && room.id) || null} />
            </motion.div>
          )}

          {tab === 'store' && (user && user.id) && (
            <motion.div key="store" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-8">
              <VirtualGoodsStore userId={user.id} />
              <ShopDashboard creatorId={user.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="monetize" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={null} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      {(user && user.id) && <SubscriptionCard tier={'basic'} price={4.99} benefits={[]} communityId={null} creatorId={(user && user.id)} isSubscribed={false} />}
      {(user && user.id) && <TierSubscribeCard tier={null} currentSub={null} userId={user.id} creatorId={(user && user.id)} isHighlighted={false} />}
      <TierEditor open={showTierEditor} onClose={function() { setShowTierEditor(false); setEditingTier(null); }} creatorId={(user && user.id)} existing={editingTier} />
      <RewardShopEditor creatorId={(user && user.id)} />
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
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id)} roomId={null} currentUser={user} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}
