import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Award, Star, Gift, TrendingUp, Camera, Radio, BarChart2,
  Settings, DollarSign, Activity, Clock, Share2, Scissors, Sparkles, Layout,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, fadeIn, scaleIn, stagger, staggerFast } from '../lib/animations';
import CreatorProfileSetup from '../components/profile/CreatorProfileSetup';
import OnlinePresenceDot from '../components/shared/OnlinePresence';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

/* ── primitives ─────────────────────────────────────────────────────── */

function DarkCard({ children, className = '', style = {} }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', ...style }}>
      {children}
    </div>
  );
}

function OctAvatar({ size = 80, src, initials, uploading, onClick }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative cursor-pointer shrink-0" style={{ width: size, height: size }} onClick={onClick}>
      {/* gold border layer */}
      <div className="absolute inset-0" style={{ clipPath: OCT, background: GOLD }} />
      {/* inner filled layer */}
      <div className="absolute flex items-center justify-center overflow-hidden"
        style={{
          inset: size <= 48 ? '2px' : '3px',
          clipPath: OCT,
          background: `linear-gradient(145deg, ${CRIMSON}99, #0d0618)`,
        }}>
        {src
          ? <img src={src} alt="" className="w-full h-full object-cover" />
          : <span className="font-black text-white"
              style={{ fontSize: size * 0.3, fontFamily: 'Orbitron, monospace' }}>{initials}</span>}
      </div>
      {/* hover overlay */}
      {onClick && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          style={{ clipPath: OCT, background: 'rgba(0,0,0,0.6)' }}>
          {uploading
            ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : <Camera className="w-5 h-5 text-white" />}
        </div>
      )}
    </motion.div>
  );
}

function StatTile({ label, value, icon: Icon, color = GOLD }) {
  return (
    <DarkCard>
      <div className="p-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{label}</p>
          <p className="text-2xl font-black leading-none" style={{ color, fontFamily: 'Orbitron, monospace' }}>{value}</p>
        </div>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        )}
      </div>
    </DarkCard>
  );
}

const ACHIEVEMENTS = [
  { id: 'first_stream',    emoji: '🎬', label: 'First Stream',    desc: 'Go live for the first time',          unlocked: (u,r,s,c) => (r||[]).length >= 1 },
  { id: 'gift_king',       emoji: '👑', label: 'Gift King',       desc: 'Receive 10+ gifts',                   unlocked: (u,r,s,c) => (u?.total_gifts_received||0) >= 10 },
  { id: 'referral_pro',    emoji: '🤝', label: 'Referral Pro',    desc: 'Complete 3+ referrals',               unlocked: (u,r,s,c) => (c||0) >= 3 },
  { id: 'subscriber',      emoji: '💎', label: 'Diamond Member',  desc: 'Hold an active subscription',        unlocked: (u,r,s,c) => (s||[]).length > 0 },
  { id: 'veteran',         emoji: '🏅', label: 'Veteran',         desc: 'Member for 30+ days',                 unlocked: (u,r,s,c) => u?.created_date && (Date.now()-new Date(u.created_date).getTime()) > 30*86400000 },
  { id: 'social_butterfly',emoji: '🦋', label: 'Social Butterfly',desc: 'Profile shared 5+ times',            unlocked: (u,r,s,c) => (u?.profile_shares||0) >= 5 },
  { id: 'clip_creator',    emoji: '✂️', label: 'Clip Creator',    desc: 'Create your first clip',             unlocked: (u,r,s,c) => (r||[]).length >= 1 },
  { id: 'community_star',  emoji: '⭐', label: 'Community Star',  desc: 'Join 2+ communities',                unlocked: (u,r,s,c) => (u?.community_count||0) >= 2 },
];

const TABS = ['Overview', 'Streams', 'Clips', 'About'];

function AchievementBadge({ badge, earned }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
      style={{
        background: earned ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${earned ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}`,
        opacity: earned ? 1 : 0.4,
        minWidth: 72,
      }}>
      <span style={{ fontSize: 24, filter: earned ? 'none' : 'grayscale(1)' }}>{badge.emoji}</span>
      <span className="text-[10px] font-black text-center leading-tight" style={{ color: earned ? '#D4AF37' : 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
        {badge.label}
      </span>
    </div>
  );
}

/* ── main page ──────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const queryClient   = useQueryClient();
  const navigate      = useNavigate();
  const [isEditing, setIsEditing]         = useState(false);
  const [setupOpen, setSetupOpen]         = useState(false);
  const [bio, setBio]                     = useState('');
  const [displayName, setDisplayName]     = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab]         = useState('Overview');
  const [isOnline]                        = useState(true);
  const [socialLinks, setSocialLinks]     = useState({ instagram: '', twitter: '', youtube: '', tiktok: '' });
  const [editingSocial, setEditingSocial] = useState(false);
  const fileRef = useRef();

  /* ── queries ── */
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['userReferrals', user?.id],
    queryFn: () => base44.entities.Referral.filter({ referrer_id: user?.id }),
    enabled: !!user,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['userSubscriptions', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user?.id, status: 'active' }),
    enabled: !!user,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['userInventory', user?.id],
    queryFn: () => base44.entities.UserInventory.filter({ user_id: user?.id }),
    enabled: !!user,
  });

  const { data: myRooms = [] } = useQuery({
    queryKey: ['myRooms', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id }, '-created_date', 10),
    enabled: !!user?.id,
  });

  const { data: myClips = [] } = useQuery({
    queryKey: ['myClips', user?.id],
    queryFn: () => base44.entities.Clip.filter({ creator_id: user?.id }, '-created_date', 12),
    enabled: !!user?.id,
  });

  /* ── mutations ── */
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      toast.success('Profile updated!');
      queryClient.invalidateQueries(['currentUser']);
      setIsEditing(false);
    },
    onError: () => { toast.error('Failed to update profile. Please try again.'); },
  });

  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setDisplayName(user.full_name || '');
      setSocialLinks({
        instagram: user.social_instagram || '',
        twitter:   user.social_twitter   || '',
        youtube:   user.social_youtube   || '',
        tiktok:    user.social_tiktok    || '',
      });
    }
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  /* ── loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080B18' }}>
        <div className="w-12 h-12 rounded-full animate-spin"
          style={{ border: '3px solid rgba(212,175,55,0.2)', borderTopColor: GOLD }} />
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: user?.full_name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied!');
    }
  };

  const completedReferrals = referrals.filter(r => r.status === 'completed').length;
  const initials = (user?.full_name || user?.email || '?')[0].toUpperCase();

  /* ── activity items (derived from available data) ── */
  const activityItems = [
    subscriptions.length > 0 && {
      id: 'subs',
      icon: TrendingUp,
      color: '#C9A84C',
      desc: `${subscriptions.length} active subscription${subscriptions.length !== 1 ? 's' : ''}`,
      time: 'Active now',
    },
    completedReferrals > 0 && {
      id: 'refs',
      icon: Gift,
      color: '#D4AF37',
      desc: `${completedReferrals} completed referral${completedReferrals !== 1 ? 's' : ''}`,
      time: 'Recent',
    },
    inventory.length > 0 && {
      id: 'inv',
      icon: Award,
      color: '#6DBF7E',
      desc: `${inventory.length} virtual item${inventory.length !== 1 ? 's' : ''} in inventory`,
      time: 'Collected',
    },
    {
      id: 'joined',
      icon: Star,
      color: GOLD,
      desc: 'Joined SeeWhy LIVE',
      time: user?.created_date ? new Date(user.created_date).toLocaleDateString() : 'Member',
    },
  ].filter(Boolean);

  return (
    <div className="min-h-screen pb-10" style={{ background: '#080B18', ...T }}>

      {/* ── sticky header ── */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <h1 className="font-black text-lg text-white" style={T}>My Profile</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSetupOpen(true)}
            className="px-3 py-1.5 rounded-xl font-black uppercase text-[10px] transition-all"
            style={{ background: 'rgba(128,0,32,0.15)', border: '1px solid rgba(128,0,32,0.4)', color: '#c0392b', ...T }}>
            Creator Setup
          </button>
          <button
            onClick={() => setIsEditing(e => !e)}
            className="px-3 py-1.5 rounded-xl font-black uppercase text-[10px] transition-all"
            style={{ background: 'rgba(212,175,55,0.12)', border: `1px solid ${GOLD}40`, color: GOLD, ...T }}>
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* ── hero banner ── */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="relative w-full overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a0824, #080B18)', minHeight: 160 }}>
        {/* glow spot */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at center, ${CRIMSON}33 0%, transparent 70%)` }} />

        <div className="relative max-w-4xl mx-auto px-6 pt-8 pb-6 flex items-end gap-5">
          {/* octagonal avatar with camera upload */}
          <div onClick={() => fileRef.current?.click()}>
            <OctAvatar size={80} src={user?.avatar_url} initials={initials} uploading={uploadingAvatar} onClick={() => {}} />
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h2 className="font-black text-2xl text-white leading-none" style={T}>
                  {user?.full_name || 'Anonymous'}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <Mail className="w-3 h-3" />{user?.email}
                  </p>
                  {isOnline && (
                    <span className="flex items-center gap-1 text-[10px] font-black"
                      style={{ color: '#6DBF7E', ...T }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#6DBF7E' }} />
                      Online
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md font-black uppercase text-[11px]"
                  style={{ background: user?.role === 'admin' ? 'rgba(128,0,32,0.25)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, ...T }}>
                  {user?.role || 'member'}
                </span>
                <button
                  onClick={handleShare}
                  className="hidden sm:flex px-3 py-1.5 rounded-xl font-black uppercase text-[10px] transition-all items-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', ...T }}>
                  <Share2 className="w-3 h-3" />
                  Share
                </button>
                <button
                  onClick={() => setIsEditing(e => !e)}
                  className="hidden sm:flex px-3 py-1.5 rounded-xl font-black uppercase text-[10px] transition-all items-center gap-1.5"
                  style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}50`, color: GOLD, ...T }}>
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">

        {/* ── edit form ── */}
        <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
          <DarkCard>
            <div className="p-4 space-y-3">
              <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Edit Profile</p>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => updateProfileMutation.mutate({ bio, full_name: displayName })}
                  disabled={updateProfileMutation.isPending}
                  className="px-4 py-1.5 rounded-xl font-black uppercase text-[10px]"
                  style={{ background: CRIMSON, color: GOLD, border: '1px solid rgba(212,175,55,0.3)', ...T }}>
                  {updateProfileMutation.isPending ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setIsEditing(false)}
                  className="px-4 py-1.5 rounded-xl font-black uppercase text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', ...T }}>
                  Cancel
                </button>
              </div>
            </div>
          </DarkCard>
          </motion.div>
        )}
        </AnimatePresence>

        {/* ── stats row ── */}
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3" variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp}><StatTile label="Followers"   value={user?.followers_count || user?.points || 0} icon={User}       color={GOLD} /></motion.div>
          <motion.div variants={fadeUp}><StatTile label="Streams"     value={myRooms.length}                             icon={Radio}      color="#C9A84C" /></motion.div>
          <motion.div variants={fadeUp}><StatTile label="Clips"       value={myClips.length}                             icon={Scissors}   color="#D4AF37" /></motion.div>
          <motion.div variants={fadeUp}><StatTile label="Tips Earned" value={inventory.length}                           icon={DollarSign} color="#6DBF7E" /></motion.div>
        </motion.div>

        {/* ── section tabs ── */}
        <motion.div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1" variants={staggerFast} initial="hidden" animate="visible">
          {TABS.map(tab => {
            const active = activeTab === tab;
            return (
              <motion.button key={tab} variants={fadeUp} whileTap={{ scale: 0.92 }} onClick={() => setActiveTab(tab)}
                className="relative shrink-0 px-4 py-2 rounded-full font-black text-[11px] uppercase transition-all"
                style={{
                  background: active ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? GOLD + '50' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? GOLD : 'rgba(255,255,255,0.45)',
                  ...T,
                }}>
                {tab}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: GOLD }} />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── tab content ── */}
        <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
        {activeTab === 'Overview' && (
          <>
            {/* Achievement Badges */}
            <DarkCard>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.5)', ...T, letterSpacing: '0.08em' }}>
                    Achievements
                  </h3>
                  <span className="text-[11px] font-black" style={{ color: GOLD, ...T }}>
                    {ACHIEVEMENTS.filter(b => b.unlocked(user, myRooms, subscriptions, completedReferrals)).length}/{ACHIEVEMENTS.length}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {ACHIEVEMENTS.map(badge => (
                    <AchievementBadge
                      key={badge.id}
                      badge={badge}
                      earned={badge.unlocked(user, myRooms, subscriptions, completedReferrals)}
                    />
                  ))}
                </div>
              </div>
            </DarkCard>

            {/* Weekly Viewer Trend */}
            <DarkCard>
              <div className="p-4">
                <h3 className="font-black text-sm uppercase mb-3" style={{ color: 'rgba(255,255,255,0.5)', ...T, letterSpacing: '0.08em' }}>
                  Viewer Trend (7 days)
                </h3>
                <div className="flex items-end gap-1.5" style={{ height: 48 }}>
                  {[40,65,45,80,55,90,70].map((v, i) => (
                    <div key={i} className="flex-1 rounded-t-sm"
                      style={{
                        height: `${v}%`,
                        background: `linear-gradient(to top, ${CRIMSON}, ${GOLD}88)`,
                        opacity: i === 6 ? 1 : 0.5 + i * 0.07,
                      }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {['M','T','W','T','F','S','S'].map((d, i) => (
                    <span key={i} className="flex-1 text-center text-[9px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>{d}</span>
                  ))}
                </div>
              </div>
            </DarkCard>

            {/* activity feed */}
            <DarkCard>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: GOLD }} />
                  <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>Recent Activity</p>
                </div>
              </div>
              <motion.div className="p-3 space-y-2" variants={stagger} initial="hidden" animate="visible">
                {activityItems.map(item => (
                  <motion.div key={item.id} variants={fadeUp} className="flex items-center gap-3 p-3 rounded-2xl" whileHover={{ x: 4 }}
                    style={{ background: `${item.color}08`, borderLeft: `2px solid ${item.color}30` }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <p className="flex-1 font-black text-[12px] text-white" style={T}>{item.desc}</p>
                    <span className="text-[11px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{item.time}</span>
                  </motion.div>
                ))}
              </motion.div>
            </DarkCard>

            {/* quick links */}
            <DarkCard>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Quick Access</p>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Creator Dashboard', href: createPageUrl('CreatorDashboard'), icon: Radio,     color: PINK },
                  { label: 'Monetization',       href: createPageUrl('Monetization'),    icon: DollarSign, color: GOLD },
                  { label: 'AI Hub',             href: createPageUrl('AIHub'),           icon: Sparkles,   color: '#a78bfa' },
                  { label: 'Platform',           href: createPageUrl('PlatformShowcase'), icon: Layout,    color: '#D4AF37' },
                  { label: 'Settings',           href: createPageUrl('Settings'),        icon: Settings,   color: '#C9A84C' },
                ].map(item => (
                  <Link key={item.href} to={item.href}>
                    <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:brightness-110"
                      style={{ background: `${item.color}08`, border: `1px solid ${item.color}18` }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
                        <item.icon className="w-4 h-4" style={{ color: item.color }} />
                      </div>
                      <p className="font-black text-[11px] text-white" style={T}>{item.label}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </DarkCard>
          </>
        )}

        {activeTab === 'Streams' && (
          <DarkCard>
            {myRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Radio className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.12)' }} />
                <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>No streams yet</p>
                <Link to={createPageUrl('GoLive')}>
                  <button className="px-4 py-2 rounded-xl font-black uppercase text-[10px]"
                    style={{ background: 'rgba(212,175,55,0.12)', border: `1px solid ${GOLD}40`, color: GOLD, ...T }}>
                    Go Live
                  </button>
                </Link>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {myRooms.slice(0, 10).map(room => {
                  const isLive = room.status === 'live';
                  return (
                    <div key={room.id}
                      onClick={() => navigate(createPageUrl('LiveRoom') + '?id=' + room.id)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all hover:brightness-110"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: isLive ? PINK : 'rgba(255,255,255,0.2)' }} />
                      <span className="flex-1 font-black text-[13px] text-white truncate" style={T}>
                        {room.title || 'Untitled Stream'}
                      </span>
                      {room.viewer_count != null && (
                        <span className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
                          {room.viewer_count} viewers
                        </span>
                      )}
                      {room.duration != null && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black shrink-0"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', ...T }}>
                          {Math.floor((room.duration || 0) / 60)}m
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-black uppercase shrink-0"
                        style={{
                          background: isLive ? 'rgba(255,21,100,0.15)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${isLive ? 'rgba(255,21,100,0.3)' : 'rgba(255,255,255,0.1)'}`,
                          color: isLive ? PINK : 'rgba(255,255,255,0.4)',
                          ...T,
                        }}>
                        {isLive ? 'LIVE' : room.status || 'ended'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </DarkCard>
        )}

        {activeTab === 'Clips' && (
          <DarkCard>
            {myClips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Scissors className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.12)' }} />
                <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>No clips yet</p>
                <Link to={createPageUrl('ClipsLibrary')}>
                  <button className="px-4 py-2 rounded-xl font-black uppercase text-[10px]"
                    style={{ background: 'rgba(212,175,55,0.12)', border: `1px solid ${GOLD}40`, color: GOLD, ...T }}>
                    Go to Clips Library
                  </button>
                </Link>
              </div>
            ) : (
              <div className="p-3 grid grid-cols-2 gap-2">
                {myClips.slice(0, 12).map(clip => (
                  <div key={clip.id} className="rounded-xl overflow-hidden cursor-pointer transition-all hover:brightness-110"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                      {clip.thumbnail_url ? (
                        <img src={clip.thumbnail_url} alt={clip.title}
                          className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <span style={{ fontSize: 28 }}>✂️</span>
                        </div>
                      )}
                      {clip.duration != null && (
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[11px] font-black"
                          style={{ background: 'rgba(0,0,0,0.75)', color: 'rgba(255,255,255,0.85)', ...T }}>
                          {Math.floor((clip.duration || 0) / 60)}:{String((clip.duration || 0) % 60).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="font-black text-[11px] text-white truncate" style={T}>
                        {clip.title || 'Untitled Clip'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DarkCard>
        )}

        {activeTab === 'About' && (
          <DarkCard>
            <div className="p-5 space-y-4">
              <div>
                <p className="font-black text-[10px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Bio</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                  {user?.bio || 'No bio yet.'}
                </p>
              </div>
              <div>
                <p className="font-black text-[10px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Email</p>
                <p className="text-sm flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <Mail className="w-3.5 h-3.5" style={{ color: GOLD }} />{user?.email}
                </p>
              </div>
              {user?.badges && user.badges.length > 0 && (
                <div>
                  <p className="font-black text-[10px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Badges</p>
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map((badge, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase"
                        style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
                        <Award className="w-3 h-3" />{badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Social Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Social Links</p>
                  <button
                    onClick={() => {
                      if (editingSocial) {
                        base44.auth.updateMe({
                          social_instagram: socialLinks.instagram,
                          social_twitter:   socialLinks.twitter,
                          social_youtube:   socialLinks.youtube,
                          social_tiktok:    socialLinks.tiktok,
                        }).then(() => { toast.success('Social links saved!'); queryClient.invalidateQueries(['currentUser']); }).catch(() => {});
                      }
                      setEditingSocial(e => !e);
                    }}
                    className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg"
                    style={{ background: `rgba(212,175,55,0.1)`, border: `1px solid rgba(212,175,55,0.25)`, color: GOLD, ...T }}>
                    {editingSocial ? 'Save' : 'Edit'}
                  </button>
                </div>
                {editingSocial ? (
                  <div className="space-y-2">
                    {[
                      { key: 'instagram', label: '📸 Instagram', placeholder: '@handle' },
                      { key: 'twitter',   label: '🐦 X / Twitter', placeholder: '@handle' },
                      { key: 'youtube',   label: '▶️ YouTube',    placeholder: 'Channel name or @handle' },
                      { key: 'tiktok',    label: '🎵 TikTok',     placeholder: '@handle' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <p className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{label}</p>
                        <input
                          value={socialLinks[key]}
                          onChange={e => setSocialLinks(l => ({ ...l, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.2)', ...T }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'instagram', emoji: '📸', base: 'https://instagram.com/' },
                      { key: 'twitter',   emoji: '🐦', base: 'https://x.com/' },
                      { key: 'youtube',   emoji: '▶️', base: 'https://youtube.com/@' },
                      { key: 'tiktok',    emoji: '🎵', base: 'https://tiktok.com/@' },
                    ].map(({ key, emoji, base }) => socialLinks[key] ? (
                      <a key={key}
                        href={base + socialLinks[key].replace(/^@/, '')}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[11px] uppercase"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', ...T }}>
                        <span>{emoji}</span>
                        <span>{socialLinks[key]}</span>
                      </a>
                    ) : null)}
                    {!Object.values(socialLinks).some(Boolean) && (
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>No social links added yet. Tap Edit to add.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Founding Member status */}
              {user?.is_founding_member && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(128,0,32,0.15)', border: '1px solid rgba(128,0,32,0.35)' }}>
                  <span className="text-lg">🏅</span>
                  <div>
                    <p className="font-black text-sm" style={{ color: '#FF9944', ...T }}>Founding Member</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Your [FM] badge appears in Live Chat</p>
                  </div>
                </div>
              )}

              {subscriptions.length > 0 && (
                <div>
                  <p className="font-black text-[10px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Active Subscriptions</p>
                  <div className="space-y-2">
                    {subscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div>
                          <p className="font-black text-sm text-white" style={T}>{sub.tier_name || 'Subscription'}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>${sub.price}/month</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md font-black text-[11px] uppercase"
                          style={{ background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.2)', color: '#6DBF7E', ...T }}>
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DarkCard>
        )}
        </motion.div>
        </AnimatePresence>

      </div>

      {user && (
        <>
          <CreatorProfileSetup user={user} isOpen={setupOpen} onClose={() => setSetupOpen(false)} />
          <OnlinePresenceDot isOnline size="sm" />
        </>
      )}
    </div>
  );
}
