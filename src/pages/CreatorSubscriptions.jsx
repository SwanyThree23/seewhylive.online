import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, Users, Settings, Star, Check, ChevronRight, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import SubscriptionTiers from '../components/monetization/SubscriptionTiers';
import TierSubscribeCard from '../components/subscriptions/TierSubscribeCard';
import MySubscriptions from '../components/subscriptions/MySubscriptions';
import CreatorTierManager from '../components/subscriptions/CreatorTierManager';
import SubscriberTierView from '../components/subscriptions/SubscriberTierView';
import SubscriptionCard from '../components/monetization/SubscriptionCard';
import StripeSubscribeButton from '../components/monetization/StripeSubscribeButton';
import SubscriptionManager from '../components/monetization/SubscriptionManager';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';

const BG    = '#080B18';
const GOLD  = '#D4AF37';
const PINK    = '#C0392B';
const GREEN = '#6DBF7E';
const FONT  = 'Barlow Condensed, sans-serif';

const DEFAULT_TIERS = [
  {
    id: 'fan',
    name: 'Fan',
    price: 4.99,
    color: '#D4854A',
    emoji: '⭐',
    description: 'Support your favorite creator',
    perks: ['Subscriber badge in chat', 'Access to subscriber-only rooms', 'Early stream notifications'],
    popular: false,
  },
  {
    id: 'superfan',
    name: 'Super Fan',
    price: 9.99,
    color: GOLD,
    emoji: '👑',
    description: 'Everything in Fan + exclusive perks',
    perks: ['Gold badge in chat', 'Exclusive live streams', 'Priority hand-raise in Audio Rooms', 'Custom emotes', 'Direct message the creator'],
    popular: true,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 24.99,
    color: PINK,
    emoji: '💎',
    description: 'The ultimate membership experience',
    perks: ['Diamond badge', 'All Super Fan perks', 'VIP room access', 'Monthly 1-on-1 shoutout', 'Ad-free experience', 'Priority support'],
    popular: false,
  },
];

const FEATURE_LABELS = [
  { key: 'has_early_access',    label: 'Early access to streams' },
  { key: 'has_exclusive_rooms', label: 'Subscriber-only rooms' },
  { key: 'has_custom_badge',    label: 'Custom badge in chat' },
  { key: 'has_custom_emotes',   label: 'Exclusive emotes' },
  { key: 'is_ad_free',          label: 'Ad-free experience' },
  { key: 'priority_support',    label: 'Priority support' },
];

function TierCard({ tier, isCurrentTier, onSubscribe, onCancel, loading, isDefault }) {
  const perks = isDefault
    ? tier.perks
    : [
        ...FEATURE_LABELS.filter(f => tier[f.key]).map(f => f.label),
        ...(tier.benefits || []),
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'relative',
        borderRadius: 20,
        background: 'rgba(8,11,24,0.95)',
        border: `1px solid ${tier.popular || tier.is_featured ? tier.color + '55' : 'rgba(255,255,255,0.08)'}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: (tier.popular || tier.is_featured) ? `0 0 32px ${tier.color}22` : 'none',
      }}
    >
      <div style={{ height: 4, background: tier.color || GOLD, width: '100%' }} />

      {(tier.popular || tier.is_featured) && (
        <div style={{
          position: 'absolute',
          top: 4,
          right: 12,
          padding: '2px 10px',
          borderRadius: '0 0 8px 8px',
          background: tier.color || GOLD,
          fontSize: 11,
          fontWeight: 900,
          fontFamily: FONT,
          color: '#000',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Most Popular
        </div>
      )}

      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${tier.color || GOLD}18`,
            border: `1px solid ${tier.color || GOLD}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {tier.emoji || '⭐'}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: FONT }}>{tier.name}</div>
            {tier.description && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: FONT, lineHeight: 1.4 }}>{tier.description}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
          <span style={{ fontSize: 42, fontWeight: 900, color: '#fff', fontFamily: FONT, lineHeight: 1 }}>
            ${isDefault ? tier.price.toFixed(2) : (tier.price || '0.00')}
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: FONT }}>/month</span>
        </div>

        {tier.max_subscribers && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: FONT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Spots</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>{tier.subscriber_count || 0}/{tier.max_subscribers}</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ height: '100%', borderRadius: 2, background: tier.color || GOLD, width: `${Math.min(100, ((tier.subscriber_count || 0) / tier.max_subscribers) * 100)}%` }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {perks.map((perk, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Check style={{ width: 14, height: 14, color: tier.color || GOLD, flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: FONT, lineHeight: 1.4 }}>{perk}</span>
            </div>
          ))}
          {perks.length === 0 && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: FONT, fontStyle: 'italic' }}>Basic membership</span>
          )}
        </div>
      </div>

      <div style={{ padding: '0 20px 20px', marginTop: 'auto' }}>
        {isCurrentTier ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              width: '100%', padding: '12px 0', borderRadius: 12,
              background: `${tier.color || GOLD}18`, border: `1px solid ${tier.color || GOLD}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 14, fontWeight: 900, fontFamily: FONT, color: tier.color || GOLD,
            }}>
              <Check style={{ width: 14, height: 14 }} /> Current Plan
            </div>
            <button
              onClick={onCancel}
              style={{
                width: '100%', padding: '6px 0', borderRadius: 8,
                background: 'none', border: 'none',
                fontSize: 11, fontFamily: FONT, color: 'rgba(255,255,255,0.25)',
                cursor: 'pointer', letterSpacing: '0.04em',
              }}
            >
              Cancel subscription
            </button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onSubscribe}
            disabled={loading}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12,
              border: 'none', cursor: loading ? 'default' : 'pointer',
              fontFamily: FONT, fontSize: 16, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
              background: `linear-gradient(135deg, ${tier.color || GOLD}, ${tier.color ? tier.color + 'BB' : '#B8960C'})`,
              color: '#000',
              boxShadow: `0 4px 20px ${tier.color || GOLD}44`,
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Zap style={{ width: 16, height: 16 }} />
            {loading ? 'Processing…' : `Join ${tier.name}`}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function CreatorView({ user }) {
  const qc = useQueryClient();
  const { data: tiers = [] } = useQuery({
    queryKey: ['myTiers', user.id],
    queryFn: () => base44.entities.SubscriptionTier.filter({ creator_id: user.id, is_active: true }, 'sort_order', 20),
    enabled: !!user.id,
  });
  const { data: subs = [] } = useQuery({
    queryKey: ['mySubs', user.id],
    queryFn: () => base44.entities.Subscription.filter({ creator_id: user.id, status: 'active' }),
    enabled: !!user.id,
  });

  const revenue = subs.reduce((sum, s) => sum + (s.price || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Active Subscribers', value: subs.length, color: GOLD, emoji: '👥' },
          { label: 'Monthly Revenue', value: `$${(Math.floor(revenue * 90) / 100).toFixed(0)}`, color: GREEN, emoji: '💰' },
        ].map(stat => (
          <div key={stat.label} style={{
            borderRadius: 14, padding: '14px 16px',
            background: `${stat.color}08`, border: `1px solid ${stat.color}20`,
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{stat.emoji}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: stat.color, fontFamily: FONT }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: FONT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{
        borderRadius: 14, padding: '14px 16px',
        background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: GOLD, fontFamily: FONT }}>Manage Tiers</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: FONT }}>
            {tiers.length > 0 ? `${tiers.length} tier${tiers.length > 1 ? 's' : ''} active` : 'No tiers set up yet'}
          </div>
        </div>
        <Link to={createPageUrl('Monetize')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 10,
          background: `${GOLD}15`, border: `1px solid ${GOLD}35`,
          fontSize: 12, fontWeight: 900, fontFamily: FONT, color: GOLD, textDecoration: 'none', letterSpacing: '0.04em',
        }}>
          <Settings style={{ width: 13, height: 13 }} /> Edit
        </Link>
      </div>

      {subs.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 900, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
            Recent Subscribers
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {subs.slice(0, 8).map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `${GOLD}18`, border: `1px solid ${GOLD}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900, color: GOLD, fontFamily: FONT, flexShrink: 0,
                }}>
                  {(s.user_name || s.user_id || 'G')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: FONT }}>
                    {s.user_name || 'Subscriber'}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>{s.tier_name}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 900, color: GREEN, fontFamily: FONT }}>${s.price}/mo</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriberView({ user, creatorId, creatorName }) {
  const qc = useQueryClient();

  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['creatorTiers', creatorId],
    queryFn: () => base44.entities.SubscriptionTier.filter({ creator_id: creatorId, is_active: true }, 'sort_order', 20),
    enabled: !!creatorId,
  });
  const { data: userSubs = [] } = useQuery({
    queryKey: ['userSubs', user?.id, creatorId],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user?.id, creator_id: creatorId }),
    enabled: !!user?.id && !!creatorId,
  });

  const currentSub = userSubs.find(s => s.status === 'active');
  const [loadingId, setLoadingId] = useState(null);

  const displayTiers = tiers.length > 0 ? tiers : DEFAULT_TIERS;
  const usingDefaults = tiers.length === 0;

  async function handleSubscribe(tier) {
    if (!user?.id) { toast.error('Sign in to subscribe'); return; }
    setLoadingId(tier.id);
    try {
      const now = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      const perks = usingDefaults
        ? tier.perks
        : [...FEATURE_LABELS.filter(f => tier[f.key]).map(f => f.label), ...(tier.benefits || [])];

      await base44.entities.Subscription.create({
        user_id:           user.id,
        user_name:         user.full_name || user.email,
        creator_id:        creatorId,
        tier_id:           tier.id,
        tier_name:         tier.name,
        price:             tier.price,
        status:            'active',
        start_date:        now.toISOString(),
        end_date:          end.toISOString(),
        auto_renew:        true,
        benefits_snapshot: perks,
      });
      if (creatorId) {
        await base44.entities.Notification.create({
          user_id:   creatorId,
          type:      'subscription',
          title:     `⭐ New ${tier.name} subscriber!`,
          message:   `${user.full_name || user.email} subscribed to your ${tier.name} tier for $${tier.price}/month.`,
          sender_id: user.id,
        }).catch(() => {});
      }
      toast.success(`Welcome to ${tier.name}! 🎉`);
      qc.invalidateQueries(['userSubs']);
      Promise.allSettled([
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'subscription',
          title: `Subscribed to ${tier.name} tier`,
          amount: tier.price,
          recipient_id: creatorId,
        }),
        creatorId && base44.entities.Activity.create({
          user_id: creatorId,
          type: 'tip_received',
          title: `New ${tier.name} subscriber: ${user.full_name || user.email}`,
          amount: Math.floor(tier.price * 90) / 100,
          sender_id: user.id,
        }),
      ]);
    } catch {
      toast.error('Subscription failed');
    } finally {
      setLoadingId(null);
    }
  }

  async function handleCancel(sub) {
    try {
      await base44.entities.Subscription.update(sub.id, { status: 'cancelled', auto_renew: false });
      toast.info('Subscription cancelled');
      qc.invalidateQueries(['userSubs']);
    } catch {
      toast.error('Failed to cancel');
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ height: 280, borderRadius: 20, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  const highlightIdx = Math.floor(displayTiers.length / 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {currentSub && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 14,
            background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)',
          }}
        >
          <span style={{ fontSize: 20 }}>⭐</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: GOLD, fontFamily: FONT }}>
              You're a {currentSub.tier_name} member!
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>
              Renews {new Date(currentSub.end_date).toLocaleDateString()}
            </div>
          </div>
        </motion.div>
      )}

      {usingDefaults && (
        <div style={{
          padding: '8px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: FONT,
        }}>
          💡 These are suggested tiers. The creator can customize them in their monetization settings.
        </div>
      )}

      {displayTiers.map((tier, idx) => (
        <TierCard
          key={tier.id}
          tier={{ ...tier, popular: idx === highlightIdx || tier.is_featured }}
          isCurrentTier={currentSub?.tier_id === tier.id && currentSub?.status === 'active'}
          onSubscribe={() => handleSubscribe(tier)}
          onCancel={() => handleCancel(currentSub)}
          loading={loadingId === tier.id}
          isDefault={usingDefaults}
        />
      ))}
    </div>
  );
}

function MySubscriptionsView({ user }) {
  const qc = useQueryClient();
  const { data: subs = [], isLoading } = useQuery({
    queryKey: ['myAllSubs', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const active = subs.filter(s => s.status === 'active');
  const past   = subs.filter(s => s.status !== 'active');

  if (isLoading) return <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>Loading…</div>;

  if (subs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎭</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>No subscriptions yet</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: FONT, marginTop: 6 }}>
          Subscribe to your favourite creators to unlock exclusive content
        </div>
      </div>
    );
  }

  function SubRow({ sub }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 14,
        background: sub.status === 'active' ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)',
        border: sub.status === 'active' ? '1px solid rgba(212,175,55,0.15)' : '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          {sub.status === 'active' ? '⭐' : '✗'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: sub.status === 'active' ? '#fff' : 'rgba(255,255,255,0.4)', fontFamily: FONT }}>
            {sub.tier_name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>
            {sub.status === 'active'
              ? `Renews ${new Date(sub.end_date).toLocaleDateString()}`
              : `Ended ${new Date(sub.end_date).toLocaleDateString()}`}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: sub.status === 'active' ? GREEN : 'rgba(255,255,255,0.25)', fontFamily: FONT }}>
            ${sub.price}/mo
          </div>
          {sub.status === 'active' && (
            <div style={{
              fontSize: 11, fontWeight: 900, fontFamily: FONT,
              padding: '1px 6px', borderRadius: 999,
              background: 'rgba(109,191,126,0.12)', border: '1px solid rgba(109,191,126,0.25)',
              color: GREEN, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Active
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {active.length > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 900, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)' }}>
            Active ({active.length})
          </p>
          {active.map(s => <SubRow key={s.id} sub={s} />)}
        </>
      )}
      {past.length > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 900, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
            Past ({past.length})
          </p>
          {past.map(s => <SubRow key={s.id} sub={s} />)}
        </>
      )}
    </div>
  );
}

export default function CreatorSubscriptionsPage() {
  const urlParams  = new URLSearchParams(window.location.search);
  const creatorParam = urlParams.get('creator');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const isCreator = !creatorParam && (user?.role === 'admin' || user?.role === 'creator' || true);

  const TABS = [
    ...(isCreator && !creatorParam ? [{ id: 'creator', label: 'My Creator Page', icon: <Settings style={{ width: 13, height: 13 }} /> }] : []),
    { id: 'subscribe', label: creatorParam ? 'Subscribe' : 'Preview My Tiers', icon: <Star style={{ width: 13, height: 13 }} /> },
    { id: 'my', label: 'My Subscriptions', icon: <Users style={{ width: 13, height: 13 }} /> },
  ];

  const [tab, setTab] = useState(creatorParam ? 'subscribe' : (isCreator ? 'creator' : 'my'));

  const targetCreatorId   = creatorParam || user?.id;
  const targetCreatorName = creatorParam ? 'Creator' : (user?.full_name || user?.email || 'You');

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT }}>

      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: '14px 16px 12px',
        background: 'rgba(8,11,24,0.97)',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
        backdropFilter: 'blur(12px)',
      }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${GOLD}, #8B6914)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Crown style={{ width: 18, height: 18, color: '#000' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: GOLD, margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {creatorParam ? 'Memberships' : 'Subscriptions'}
              </h1>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: FONT }}>
                {creatorParam ? `Subscribe to ${targetCreatorName}` : 'Manage tiers and memberships'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,11,24,0.95)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px 8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              fontSize: 11, fontWeight: 900, fontFamily: FONT,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: tab === t.id ? GOLD : 'rgba(255,255,255,0.35)',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? `2px solid ${GOLD}` : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 40px' }}>
        <AnimatePresence mode="wait">
          {tab === 'creator' && user && (
            <motion.div key="creator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CreatorView user={user} />
            </motion.div>
          )}
          {tab === 'subscribe' && (
            <motion.div key="subscribe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SubscriberView user={user} creatorId={targetCreatorId} creatorName={targetCreatorName} />
            </motion.div>
          )}
          {tab === 'my' && user && (
            <motion.div key="my" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MySubscriptionsView user={user} />
            </motion.div>
          )}
        </AnimatePresence>

        {user?.id && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SubscriptionTiers creatorId={user.id} currentUserId={user.id} />
            <TierSubscribeCard tier={null} currentSub={null} userId={user.id} creatorId={targetCreatorId} isHighlighted={false} />
            <CreatorTierManager creatorId={user.id} />
            <MySubscriptions userId={user.id} />
            {targetCreatorId && <SubscriberTierView creatorId={targetCreatorId} userId={user.id} />}
            <SubscriptionCard tier={null} isCurrentTier={false} onSubscribe={() => {}} />
            <StripeSubscribeButton creatorId={targetCreatorId || null} tierId={null} userId={user.id} />
            <SubscriptionManager userId={user.id} />
            <OnlineUsersGrid compact maxVisible={10} />
            <ContentRecommendations />
        <MilestoneAlerts userId={user?.id} roomId={null} />
        <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
            <CollaborationMatcher />
          </div>
        )}
      </div>
    </div>
  );
}
