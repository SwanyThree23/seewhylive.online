import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Award, Star, Gift, TrendingUp, Camera, Radio, BarChart2,
  Settings, DollarSign, Activity, Clock, Share2, Scissors, Sparkles, Layout,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CreatorProfileSetup from '../components/profile/CreatorProfileSetup';
import OnlinePresenceDot from '../components/shared/OnlinePresence';
import MySubscriptions from '../components/subscriptions/MySubscriptions';
import LeaderboardPanel from '../components/live/LeaderboardPanel';
import SpotlightBanner from '../components/community/SpotlightBanner';
import RevenueDashboard from '../components/monetization/RevenueDashboard';
import StreamMetadataEditor from '../components/streaming/StreamMetadataEditor';
import PerformanceDashboard from '../components/streaming/PerformanceDashboard';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import ShareToSocial from '../components/social/ShareToSocial';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

/* ── primitives ─────────────────────────────────────────────────────── */

function DarkCard({ children, className = '', style = {} }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', ...style }}>
      {children}
    </div>
  );
}

function OctAvatar({ size = 80, src, initials, uploading, onClick }) {
  return (
    <div className="relative cursor-pointer shrink-0" style={{ width: size, height: size }} onClick={onClick}>
      {/* gold border layer */}
      <div className="absolute inset-0" style={{ clipPath: OCT, background: GOLD }} />
      {/* inner filled layer */}
      <div className="absolute flex items-center justify-center overflow-hidden"
        style={{
          inset: size <= 48 ? '2px' : '3px',
          clipPath: OCT,
          background: `linear-gradient(145deg, ${CRIMSON}99, #080B18)`,
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
    </div>
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

const TABS = ['Overview', 'Streams', 'Clips', 'About'];

/* ── main page ──────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room_id');
  const queryClient   = useQueryClient();
  const navigate      = useNavigate();
  const [showCreatorSetup, setShowCreatorSetup] = useState(false);
  const [isEditing, setIsEditing]         = useState(false);
  const [bio, setBio]                     = useState('');
  const [displayName, setDisplayName]     = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab]         = useState('Overview');
  const [isOnline]                        = useState(true);
  const [setupOpen, setSetupOpen]         = useState(false);
  const fileRef = useRef();

  /* ── queries ── */
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;

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
    queryFn: () => base44.entities.StreamClip.filter({ creator_id: user?.id }, '-created_date', 12),
    enabled: !!user?.id,
  });

  /* ── mutations ── */
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      toast.success('Profile updated!');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
      if (user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'milestone',
          title: 'Updated profile',
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Action failed.'),
  });
  const { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', user?.id],
    queryFn: () => base44.entities.Community.filter({ owner_id: user?.id }).then(r => r[0] || null),
    enabled: !!user?.id,
  });
  const userCommunityId = userCommunity?.id || null;

  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setDisplayName(user.full_name || '');
    }
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar.');
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
      navigator.clipboard.writeText(window.location.href).then(() => toast.success('Profile link copied!')).catch(() => toast.error('Copy failed.'));
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
        <button
          onClick={() => setIsEditing(e => !e)}
          className="px-3 py-1.5 rounded-xl font-black uppercase text-[10px] transition-all"
          style={{ background: 'rgba(212,175,55,0.12)', border: `1px solid ${GOLD}40`, color: GOLD, ...T }}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* ── hero banner ── */}
      <div className="relative w-full overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a0824, #080B18)', minHeight: 160 }}>
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
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">

        {/* ── edit form ── */}
        {isEditing && (
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
        )}

        {/* ── stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="Followers"   value={user?.followers_count || user?.points || 0} icon={User}       color={GOLD} />
          <StatTile label="Streams"     value={myRooms.length}                             icon={Radio}      color="#C9A84C" />
          <StatTile label="Clips"       value={myClips.length}                             icon={Scissors}   color="#D4AF37" />
          <StatTile label="Tips Earned" value={inventory.length}                           icon={DollarSign} color="#6DBF7E" />
        </div>

        {/* ── section tabs ── */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map(tab => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
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
              </button>
            );
          })}
        </div>

        {/* ── tab content ── */}
        {activeTab === 'Overview' && (
          <>
            {/* activity feed */}
            <DarkCard>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: GOLD }} />
                  <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>Recent Activity</p>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {activityItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ background: `${item.color}08`, borderLeft: `2px solid ${item.color}30` }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <p className="flex-1 font-black text-[12px] text-white" style={T}>{item.desc}</p>
                    <span className="text-[11px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{item.time}</span>
                  </div>
                ))}
              </div>
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
                  { label: 'AI Hub',             href: createPageUrl('AIHub'),           icon: Sparkles,   color: GOLD },
                  { label: 'Platform',           href: createPageUrl('PlatformShowcase'), icon: Layout,    color: '#D4854A' },
                  { label: 'Settings',           href: createPageUrl('Settings'),        icon: Settings,   color: '#C9A84C' },
                  { label: 'Creator Setup',      href: null,                             icon: Star,       color: GOLD, onClick: () => setSetupOpen(true) },
                ].map(item => {
                  const inner = (
                    <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:brightness-110 cursor-pointer"
                      style={{ background: `${item.color}08`, border: `1px solid ${item.color}18` }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
                        <item.icon className="w-4 h-4" style={{ color: item.color }} />
                      </div>
                      <p className="font-black text-[11px] text-white" style={T}>{item.label}</p>
                    </div>
                  );
                  return item.href
                    ? <Link key={item.label} to={item.href}>{inner}</Link>
                    : <div key={item.label} onClick={item.onClick}>{inner}</div>;
                })}
              </div>
            </DarkCard>
          </>
        )}

        {activeTab === 'Overview' && user?.id && (
          <MySubscriptions userId={user.id} />
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
                          background: isLive ? 'rgba(192,57,43,0.15)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${isLive ? 'rgba(192,57,43,0.3)' : 'rgba(255,255,255,0.1)'}`,
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

      </div>

      {user && (
        <>
          <CreatorProfileSetup user={user} isOpen={setupOpen} onClose={() => setSetupOpen(false)} />
          <OnlinePresenceDot isOnline size="sm" />
        </>
      )}

      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <LeaderboardPanel roomId={roomId} />
        <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
        {user?.id && <RevenueDashboard userId={user.id} />}
        <StreamMetadataEditor initialTitle="My Stream" initialCategory="entertainment" />
        <PerformanceDashboard roomId={roomId} sessionId={roomId} />
      </div>
        <MilestoneAlerts userId={user?.id} roomId={activeRoomId} />
        <SwanAIRecommendations roomId={activeRoomId} currentLayout="default" viewerCount={0} />
    </div>
  );
}
