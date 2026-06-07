import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Users, Radio, Video, ExternalLink, Gift, Crown, Star, Instagram, Twitter, Youtube, Music, Globe, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../utils';
import VideoLibrary from '../components/vod/VideoLibrary';
import FollowButton from '../components/shared/FollowButton';
import PresenceDot from '../components/shared/PresenceDot';
import ShareButtons from '../components/shared/ShareButtons';
import { toast } from 'sonner';

const BG      = '#080B18';
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const GREEN   = '#6DBF7E';
const OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const TIER_CONFIG = {
  diamond:  { label: 'Diamond',  color: '#B9F2FF', min: 15000 },
  platinum: { label: 'Platinum', color: '#E5E4E2', min: 5000  },
  gold:     { label: 'Gold',     color: GOLD,      min: 1500  },
  silver:   { label: 'Silver',   color: '#C0C0C0', min: 500   },
  bronze:   { label: 'Bronze',   color: '#CD7F32', min: 0     },
};

function tierFromPoints(pts) {
  const tiers = Object.values(TIER_CONFIG).sort((a, b) => b.min - a.min);
  return tiers.find(t => pts >= t.min) || TIER_CONFIG.bronze;
}

const TIP_AMOUNTS = [1, 5, 10, 25, 50, 100];

function TipModal({ profile, creatorId, user, onClose }) {
  const [amount, setAmount]   = useState(5);
  const [custom, setCustom]   = useState('');
  const [msg, setMsg]         = useState('');
  const [done, setDone]       = useState(false);
  const queryClient           = useQueryClient();

  const finalAmount = custom ? parseFloat(custom) || 0 : amount;

  const tipMutation = useMutation({
    mutationFn: () => base44.entities.Tip.create({
      creator_id: creatorId,
      tipper_id:  user.id,
      tipper_name: user.full_name || user.email || 'Fan',
      amount: finalAmount,
      message: msg,
      created_date: new Date().toISOString(),
    }),
    onSuccess: () => {
      base44.entities.Transaction.create({
        type: 'tip', amount: finalAmount,
        from_user_id: user.id, to_user_id: creatorId,
        creator_id: creatorId,
      }).catch(() => {});
      queryClient.invalidateQueries(['audienceTips']);
      setDone(true);
    },
    onError: () => toast.error('Tip failed — please try again'),
  });

  if (done) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl p-8 text-center max-w-xs w-full"
        style={{ background: 'rgba(13,6,24,0.99)', border: `1px solid ${GOLD}50` }}
        onClick={e => e.stopPropagation()}>
        <div className="text-5xl mb-3">💎</div>
        <p className="font-black text-xl mb-1" style={{ color: GOLD, ...T }}>Tip Sent!</p>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>${finalAmount.toFixed(2)} to {profile.display_name}</p>
        <button onClick={onClose} className="px-6 py-2 rounded-xl font-black uppercase text-xs"
          style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer', ...T }}>
          Done
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,6,24,0.99)', border: `1px solid rgba(212,175,55,0.2)` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" style={{ color: GOLD }} />
            <span className="font-black text-sm text-white" style={T}>Tip {profile.display_name}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Quick amounts */}
          <div>
            <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Choose Amount</p>
            <div className="grid grid-cols-3 gap-2">
              {TIP_AMOUNTS.map(a => (
                <button key={a} onClick={() => { setAmount(a); setCustom(''); }}
                  className="py-2.5 rounded-xl font-black text-sm transition-all"
                  style={{
                    background: amount === a && !custom ? `${GOLD}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${amount === a && !custom ? GOLD : 'rgba(255,255,255,0.08)'}`,
                    color: amount === a && !custom ? GOLD : 'rgba(255,255,255,0.5)',
                    fontFamily: 'Orbitron, monospace', cursor: 'pointer',
                  }}>
                  ${a}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Custom Amount</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black" style={{ color: GOLD }}>$</span>
              <input type="number" min="1" value={custom}
                onChange={e => { setCustom(e.target.value); setAmount(0); }}
                placeholder="Enter amount"
                className="w-full pl-7 pr-4 py-2.5 rounded-xl text-sm font-black outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${custom ? GOLD : 'rgba(255,255,255,0.1)'}`, color: '#fff', fontFamily: 'Orbitron, monospace' }}
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Message (optional)</p>
            <textarea value={msg} onChange={e => setMsg(e.target.value)}
              placeholder="Say something nice…"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}
            />
          </div>

          {/* Send */}
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => finalAmount > 0 && tipMutation.mutate()}
            disabled={tipMutation.isPending || finalAmount <= 0}
            className="w-full py-3 rounded-xl font-black uppercase text-sm"
            style={{
              background: finalAmount <= 0 || tipMutation.isPending
                ? 'rgba(128,0,32,0.3)'
                : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`,
              border: 'none',
              color: finalAmount <= 0 || tipMutation.isPending ? 'rgba(255,255,255,0.3)' : '#07050A',
              cursor: finalAmount <= 0 || tipMutation.isPending ? 'default' : 'pointer', ...T,
            }}>
            {tipMutation.isPending ? 'Sending…' : `Send $${finalAmount > 0 ? finalAmount.toFixed(2) : '0.00'} Tip 💎`}
          </motion.button>

          <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>
            Creator keeps 90% · SeeWhy LIVE keeps 10%
          </p>
        </div>
      </motion.div>
    </div>
  );
}

const SOCIAL_ICONS = {
  instagram: { Icon: Instagram,  color: '#E1306C', label: 'Instagram' },
  twitter:   { Icon: Twitter,    color: '#1DA1F2', label: 'Twitter/X'  },
  youtube:   { Icon: Youtube,    color: '#FF0000', label: 'YouTube'   },
  tiktok:    { Icon: Music,      color: '#69C9D0', label: 'TikTok'    },
  website:   { Icon: Globe,      color: GOLD,      label: 'Website'   },
};

export default function PublicProfile() {
  const urlParams    = new URLSearchParams(window.location.search);
  const userId       = urlParams.get('id');
  const [tipOpen, setTipOpen] = useState(false);
  const queryClient  = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => base44.entities.CreatorProfile.filter({ user_id: userId }).then(r => r[0]),
    enabled: !!userId,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['public-rooms', userId],
    queryFn: () => base44.entities.Room.filter({ host_id: userId, is_public: true }, '-created_date', 6),
    enabled: !!userId,
  });

  const { data: loyalty } = useQuery({
    queryKey: ['viewer-loyalty', userId, user?.id],
    queryFn: () => base44.entities.LoyaltyMembership.filter({ creator_id: userId, user_id: user.id }).then(r => r[0]),
    enabled: !!userId && !!user?.id,
  });

  const { data: subPlan } = useQuery({
    queryKey: ['sub-plan', userId],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ creator_id: userId, is_active: true }).then(r => r[0]),
    enabled: !!userId,
  });

  const { data: mySubStatus } = useQuery({
    queryKey: ['my-sub', userId, user?.id],
    queryFn: () => base44.entities.Subscription.filter({ creator_id: userId, subscriber_id: user.id, status: 'active' }).then(r => r[0]),
    enabled: !!userId && !!user?.id,
  });

  const subscribeMutation = useMutation({
    mutationFn: () => base44.entities.Subscription.create({
      creator_id: userId,
      subscriber_id: user.id,
      status: 'active',
      plan_id: subPlan?.id,
      amount: subPlan?.price || 4.99,
      created_date: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-sub']);
      toast.success(`Subscribed to ${profile?.display_name}! 👑`);
    },
    onError: () => toast.error('Subscription failed'),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border: `3px solid ${GOLD}`, borderTopColor: 'transparent' }} />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4" style={{ background: BG }}>
      <div>
        <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
        <p className="text-lg font-black" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>Profile not found</p>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>This user hasn't set up a profile yet.</p>
        <Link to="/">
          <button className="mt-4 px-5 py-2 rounded-xl font-black uppercase text-xs"
            style={{ background: CRIMSON, color: GOLD, border: `1px solid rgba(212,175,55,0.3)`, ...T }}>
            Go Home
          </button>
        </Link>
      </div>
    </div>
  );

  const liveRoom   = rooms.find(r => r.status === 'live');
  const loyaltyTier = loyalty ? tierFromPoints(loyalty.loyalty_points || 0) : null;
  const isOwnProfile = user?.id === userId;

  // Social links
  const socials = [
    { key: 'instagram', url: profile.instagram_url },
    { key: 'twitter',   url: profile.twitter_url },
    { key: 'youtube',   url: profile.youtube_url },
    { key: 'tiktok',    url: profile.tiktok_url },
    { key: 'website',   url: profile.website_url },
  ].filter(s => s.url);

  return (
    <div className="min-h-screen" style={{ background: BG }}>

      {/* Banner */}
      <div className="relative h-48 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${CRIMSON}44 0%, #0d0618 60%, #080B18 100%)` }}>
        {profile.banner_url && (
          <img src={profile.banner_url} className="w-full h-full object-cover absolute inset-0" alt="banner" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(8,11,24,0.9) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD}44, transparent)` }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16" style={{ marginTop: -60 }}>

        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">

          {/* OCT Avatar */}
          <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
            <div className="absolute inset-0" style={{ clipPath: OCT, background: GOLD }} />
            <div className="absolute inset-[3px] flex items-center justify-center"
              style={{ clipPath: OCT, background: `linear-gradient(145deg, ${CRIMSON}99, #0d0618)` }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} className="w-full h-full object-cover"
                    alt={profile.display_name} style={{ clipPath: OCT }} />
                : <span className="text-3xl font-black" style={{ color: GOLD, ...T }}>
                    {profile.display_name?.charAt(0)}
                  </span>
              }
            </div>
            {/* Loyalty tier ring */}
            {loyaltyTier && (
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black"
                style={{ background: `${loyaltyTier.color}22`, border: `1px solid ${loyaltyTier.color}`, color: loyaltyTier.color, ...T }}>
                {loyaltyTier.label}
              </div>
            )}
          </div>

          <div className="flex-1 pt-2 sm:pt-10 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#fff', ...T }}>
                {profile.display_name}
                <PresenceDot userId={userId} size="md" />
              </h1>
              {profile.is_verified && <CheckCircle className="w-5 h-5" style={{ color: '#4fc3f7' }} />}
              {profile.category && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, ...T }}>
                  {profile.category}
                </span>
              )}
              {liveRoom && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase animate-pulse"
                  style={{ background: 'rgba(255,21,100,0.15)', border: '1px solid rgba(255,21,100,0.4)', color: '#C0392B', ...T }}>
                  🔴 LIVE
                </span>
              )}
            </div>

            {profile.bio && <p className="text-sm mt-1 max-w-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>{profile.bio}</p>}

            <div className="flex gap-4 mt-2 text-sm flex-wrap">
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                <strong style={{ color: GOLD }}>{profile.subscriber_count || 0}</strong> subscribers
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                <strong style={{ color: GOLD }}>{profile.follower_count || 0}</strong> followers
              </span>
            </div>

            {/* Social links */}
            {socials.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {socials.map(({ key, url }) => {
                  const cfg = SOCIAL_ICONS[key];
                  if (!cfg) return null;
                  const { Icon, color } = cfg;
                  return (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:brightness-125"
                      style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <span className="text-[10px] font-black" style={{ color, ...T }}>{cfg.label}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="sm:pt-10 flex flex-wrap gap-2">
            {liveRoom && (
              <Link to={createPageUrl('Room') + `?id=${liveRoom.id}`}>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black uppercase text-xs"
                  style={{ background: 'rgba(255,21,100,0.15)', border: '1px solid rgba(255,21,100,0.4)', color: '#C0392B', ...T }}>
                  <Radio className="w-3.5 h-3.5" /> Watch Live
                </button>
              </Link>
            )}

            <FollowButton targetUserId={userId} targetUserName={profile.display_name} />

            {/* Subscribe button */}
            {!isOwnProfile && subPlan && !mySubStatus && (
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => user ? subscribeMutation.mutate() : toast.error('Sign in to subscribe')}
                disabled={subscribeMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black uppercase text-xs"
                style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#07050A', cursor: 'pointer', ...T }}>
                <Crown className="w-3.5 h-3.5" />
                {subscribeMutation.isPending ? 'Joining…' : `Sub $${subPlan.price || 4.99}/mo`}
              </motion.button>
            )}
            {mySubStatus && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black uppercase text-xs"
                style={{ background: `${GREEN}15`, border: `1px solid ${GREEN}40`, color: GREEN, ...T }}>
                <Crown className="w-3.5 h-3.5" /> Subscribed
              </div>
            )}

            {/* Tip button */}
            {!isOwnProfile && (
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => user ? setTipOpen(true) : toast.error('Sign in to tip')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black uppercase text-xs"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: GOLD, cursor: 'pointer', ...T }}>
                <Gift className="w-3.5 h-3.5" /> Tip
              </motion.button>
            )}

            <ShareButtons url={window.location.href} title={`Check out ${profile.display_name} on SeeWhy LIVE`} />

            <Link to={createPageUrl('CreatorChannel') + `?id=${userId}`}>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black uppercase text-xs"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
                <ExternalLink className="w-3.5 h-3.5" /> Full Channel
              </button>
            </Link>
          </div>
        </div>

        {/* Loyalty tier card */}
        {loyaltyTier && loyalty && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 mb-5 flex items-center gap-3"
            style={{ background: `${loyaltyTier.color}08`, border: `1px solid ${loyaltyTier.color}25` }}>
            <Star className="w-5 h-5 shrink-0" style={{ color: loyaltyTier.color }} />
            <div>
              <p className="font-black text-sm" style={{ color: loyaltyTier.color, ...T }}>
                {loyaltyTier.label} Tier Fan
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {(loyalty.loyalty_points || 0).toLocaleString()} loyalty points with {profile.display_name}
              </p>
            </div>
          </motion.div>
        )}

        {/* Recent Rooms */}
        {rooms.length > 0 && (
          <div className="rounded-2xl mb-6 p-4"
            style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <p className="text-xs font-black uppercase mb-3 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
              <Video className="w-4 h-4" /> Recent Streams
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rooms.slice(0, 6).map(r => (
                <Link key={r.id} to={createPageUrl('Room') + `?id=${r.id}`}>
                  <div className="rounded-xl p-3 transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
                    {r.status === 'live' && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase mb-1 inline-block"
                        style={{ background: 'rgba(255,21,100,0.15)', color: '#C0392B', border: '1px solid rgba(255,21,100,0.3)', ...T }}>
                        🔴 Live
                      </span>
                    )}
                    <p className="text-xs font-black truncate" style={{ color: '#fff', ...T }}>{r.title}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {r.viewer_count || 0} viewers
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* VOD Library */}
        <VideoLibrary creatorId={userId} />
      </div>

      {/* Tip Modal */}
      <AnimatePresence>
        {tipOpen && profile && user && (
          <TipModal profile={profile} creatorId={userId} user={user} onClose={() => setTipOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
