import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Award, Star, Gift, TrendingUp, Camera, Radio,
  Settings, DollarSign, Activity, Share2, Scissors, Sparkles, Layout,
  Download, LogOut, Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CreatorProfileSetup from '../components/profile/CreatorProfileSetup';
import MySubscriptions from '../components/subscriptions/MySubscriptions';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import AccountDeletionFlow from '../components/settings/AccountDeletionFlow';
import PayoutMethodSettings from '../components/settings/PayoutMethodSettings';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CreatorBridge from '../components/social/CreatorBridge';

var GOLD    = '#FFB800';
var CRIMSON = '#FF1564';
var PINK    = '#FF2040';
var OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
var T       = { fontFamily: 'Barlow Condensed, sans-serif' };

/* ── primitives ─────────────────────────────────────────────────────── */

function DarkCard(props) {
  var children = props.children;
  var className = props.className || '';
  var style = props.style || {};
  return (
    <div className={'rounded-2xl ' + className}
      style={Object.assign({ background: 'rgba(7,7,15,0.9)', border: '1px solid rgba(255,184,0,0.1)' }, style)}>
      {children}
    </div>
  );
}

function OctAvatar(props) {
  var size = props.size || 80;
  var src = props.src;
  var initials = props.initials;
  var uploading = props.uploading;
  var onClick = props.onClick;
  return (
    <div className="relative cursor-pointer shrink-0" style={{ width: size, height: size }} onClick={onClick}>
      {/* gold border layer */}
      <div className="absolute inset-0" style={{ clipPath: OCT, background: GOLD }} />
      {/* inner filled layer */}
      <div className="absolute flex items-center justify-center overflow-hidden"
        style={{
          inset: size <= 48 ? '2px' : '3px',
          clipPath: OCT,
          background: 'linear-gradient(145deg, ' + CRIMSON + '99, #03030A)',
        }}>
        {src
          ? <img src={src} alt="" className="w-full h-full object-cover" />
          : <span className="font-black text-white"
              style={{ fontSize: size * 0.3, fontFamily: 'Syne, monospace' }}>{initials}</span>}
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

function StatTile(props) {
  var label = props.label;
  var value = props.value;
  var Icon = props.icon;
  var color = props.color || GOLD;
  return (
    <DarkCard>
      <div className="p-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</p>
          <p className="text-2xl font-black leading-none" style={{ color, fontFamily: 'Syne, monospace' }}>{value}</p>
        </div>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: color + '15', border: '1px solid ' + color + '25' }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        )}
      </div>
    </DarkCard>
  );
}

var TABS = ['Overview', 'Streams', 'Videos', 'Studios', 'Clips', 'About', 'Settings'];

/* ── main page ──────────────────────────────────────────────────────── */

export default function ProfilePage() {
  var searchParamsArr = useSearchParams();
  var searchParams = searchParamsArr[0];
  var roomId = searchParams.get('room_id');
  var queryClient   = useQueryClient();
  var navigate      = useNavigate();

  var showCreatorSetupState = useState(false);
  var showCreatorSetup = showCreatorSetupState[0];
  var setShowCreatorSetup = showCreatorSetupState[1];

  var isEditingState = useState(false);
  var isEditing = isEditingState[0];
  var setIsEditing = isEditingState[1];

  var bioState = useState('');
  var bio = bioState[0];
  var setBio = bioState[1];

  var displayNameState = useState('');
  var displayName = displayNameState[0];
  var setDisplayName = displayNameState[1];

  var uploadingAvatarState = useState(false);
  var uploadingAvatar = uploadingAvatarState[0];
  var setUploadingAvatar = uploadingAvatarState[1];

  var activeTabState = useState('Overview');
  var activeTab = activeTabState[0];
  var setActiveTab = activeTabState[1];

  var setupOpenState = useState(false);
  var setupOpen = setupOpenState[0];
  var setSetupOpen = setupOpenState[1];

  var fileRef = useRef();

  /* ── queries ── */
  var userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });
  var user = userQuery.data || null;
  var isLoading = userQuery.isLoading;

  var activeRoomQuery = useQuery({
    queryKey: ['activeRoom', (user && user.id)],
    queryFn: function() {
      return base44.entities.Room.filter({ host_id: (user && user.id), status: 'live' }).then(function(r) { return r[0] || null; });
    },
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoom = activeRoomQuery.data || null;
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var isOnline = !!activeRoom;

  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);

  var referralsQuery = useQuery({
    queryKey: ['userReferrals', (user && user.id)],
    queryFn: function() { return base44.entities.Referral.filter({ referrer_id: (user && user.id) }); },
    enabled: !!user,
  });
  var referrals = referralsQuery.data || [];

  var subscriptionsQuery = useQuery({
    queryKey: ['userSubscriptions', (user && user.id)],
    queryFn: function() { return base44.entities.Subscription.filter({ user_id: (user && user.id), status: 'active' }); },
    enabled: !!user,
  });
  var subscriptions = subscriptionsQuery.data || [];

  var inventoryQuery = useQuery({
    queryKey: ['userInventory', (user && user.id)],
    queryFn: function() { return base44.entities.UserInventory.filter({ user_id: (user && user.id) }); },
    enabled: !!user,
  });
  var inventory = inventoryQuery.data || [];

  var myRoomsQuery = useQuery({
    queryKey: ['myRooms', (user && user.id)],
    queryFn: function() { return base44.entities.Room.filter({ host_id: (user && user.id) }, '-created_date', 20); },
    enabled: !!(user && user.id),
  });
  var myRooms = myRoomsQuery.data || [];

  var myVideoPosts = myRooms.filter(function(r) { return r.type === 'video'; });
  var myLiveRooms  = myRooms.filter(function(r) { return r.type !== 'video'; });

  var myClipsQuery = useQuery({
    queryKey: ['myClips', (user && user.id)],
    queryFn: function() { return base44.entities.StreamClip.filter({ creator_id: (user && user.id) }, '-created_date', 12); },
    enabled: !!(user && user.id),
  });
  var myClips = myClipsQuery.data || [];

  /* ── mutations ── */
  var updateProfileMutation = useMutation({
    mutationFn: function(data) { return base44.auth.updateMe(data); },
    onSuccess: function() {
      toast.success('Profile updated!');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
      if ((user && user.id)) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'milestone',
          title: 'Updated profile',
        }).catch(function() {});
      }
    },
    onError: function() { toast.error('Action failed.'); },
  });
  var userCommunityQuery = useQuery({
    queryKey: ['userCommunity', (user && user.id)],
    queryFn: function() {
      return base44.entities.Community.filter({ owner_id: (user && user.id) }).then(function(r) { return r[0] || null; });
    },
    enabled: !!(user && user.id),
  });
  var userCommunity = userCommunityQuery.data || null;
  var userCommunityId = (userCommunity && userCommunity.id) || null;

  useEffect(function() {
    if (user) {
      setBio(user.bio || '');
      setDisplayName(user.full_name || '');
    }
  }, [user]);

  var handleAvatarUpload = async function(e) {
    var file = (e.target.files && e.target.files[0]);
    if (!file) return;
    setUploadingAvatar(true);
    try {
      var uploadResult = await base44.integrations.Core.UploadFile({ file });
      var file_url = uploadResult.file_url;
      await base44.auth.updateMe({ avatar_url: file_url });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error('Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  /* ── loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#03030A' }}>
        <div className="w-12 h-12 rounded-full animate-spin"
          style={{ border: '3px solid rgba(255,184,0,0.2)', borderTopColor: GOLD }} />
      </div>
    );
  }

  var handleShare = function() {
    var shareUrl = (user && user.id)
      ? window.location.origin + '/link-in-bio/' + user.id
      : window.location.href;
    if (navigator.share) {
      navigator.share({ title: (user && user.full_name) || 'SeeWhy LIVE', url: shareUrl }).catch(function() {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(function() { toast.success('Link-in-Bio link copied!'); }).catch(function() { toast.error('Copy failed.'); });
    }
  };

  var completedReferrals = referrals.filter(function(r) { return r.status === 'completed'; }).length;
  var initials = ((user && user.full_name) || (user && user.email) || '?')[0].toUpperCase();

  /* ── activity items (derived from available data) ── */
  var activityItems = [
    subscriptions.length > 0 && {
      id: 'subs',
      icon: TrendingUp,
      color: '#FFB800',
      desc: subscriptions.length + ' active subscription' + (subscriptions.length !== 1 ? 's' : ''),
      time: 'Active now',
    },
    completedReferrals > 0 && {
      id: 'refs',
      icon: Gift,
      color: '#FFB800',
      desc: completedReferrals + ' completed referral' + (completedReferrals !== 1 ? 's' : ''),
      time: 'Recent',
    },
    inventory.length > 0 && {
      id: 'inv',
      icon: Award,
      color: '#00FF88',
      desc: inventory.length + ' virtual item' + (inventory.length !== 1 ? 's' : '') + ' in inventory',
      time: 'Collected',
    },
    {
      id: 'joined',
      icon: Star,
      color: GOLD,
      desc: 'Joined SeeWhy LIVE',
      time: (user && user.created_date) ? new Date(user.created_date).toLocaleDateString() : 'Member',
    },
  ].filter(Boolean);

  return (
    <div className="min-h-screen pb-10" style={{ background: '#03030A', fontFamily: 'Barlow Condensed, sans-serif' }}>

      {/* ── sticky header ── */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(7,7,15,0.97)', borderBottom: '1px solid rgba(255,184,0,0.1)', backdropFilter: 'blur(12px)' }}>
        <h1 className="font-black text-lg text-white" style={T}>My Profile</h1>
        <button
          onClick={function() { setIsEditing(function(e) { return !e; }); }}
          className="px-3 py-1.5 rounded-xl font-black uppercase text-[10px] transition-all"
          style={{ background: 'rgba(255,184,0,0.12)', border: '1px solid ' + GOLD + '40', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* ── hero banner ── */}
      <div className="relative w-full overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a0824, #03030A)', minHeight: 160 }}>
        {/* glow spot */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, ' + CRIMSON + '33 0%, transparent 70%)' }} />

        <div className="relative max-w-4xl mx-auto px-6 pt-8 pb-6 flex items-end gap-5">
          {/* octagonal avatar with camera upload */}
          <div onClick={function() { if (fileRef.current) fileRef.current.click(); }}>
            <OctAvatar size={80} src={(user && user.avatar_url)} initials={initials} uploading={uploadingAvatar} onClick={function() {}} />
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h2 className="font-black text-2xl text-white leading-none" style={T}>
                  {(user && user.full_name) || 'Anonymous'}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <Mail className="w-3 h-3" />{(user && user.email)}
                  </p>
                  {isOnline && (
                    <span className="flex items-center gap-1 text-[10px] font-black"
                      style={{ color: '#00FF88', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#00FF88' }} />
                      Online
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md font-black uppercase text-[11px]"
                  style={{ background: (user && user.role) === 'admin' ? 'rgba(255,21,100,0.25)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,184,0,0.25)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {(user && user.role) || 'member'}
                </span>
                <button
                  onClick={handleShare}
                  className="hidden sm:flex px-3 py-1.5 rounded-xl font-black uppercase text-[10px] transition-all items-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  <Share2 className="w-3 h-3" />
                  Share
                </button>
                <button
                  onClick={function() { setIsEditing(function(e) { return !e; }); }}
                  className="hidden sm:flex px-3 py-1.5 rounded-xl font-black uppercase text-[10px] transition-all items-center gap-1.5"
                  style={{ background: GOLD + '18', border: '1px solid ' + GOLD + '50', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
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
              <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>Edit Profile</p>
              <input
                value={displayName}
                onChange={function(e) { setDisplayName(e.target.value); }}
                placeholder="Display name"
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,184,0,0.2)' }}
              />
              <textarea
                value={bio}
                onChange={function(e) { setBio(e.target.value); }}
                placeholder="Tell us about yourself..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,184,0,0.2)' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={function() { updateProfileMutation.mutate({ bio: bio.slice(0, 500), full_name: displayName.slice(0, 60) }); }}
                  disabled={updateProfileMutation.isPending}
                  className="px-4 py-1.5 rounded-xl font-black uppercase text-[10px]"
                  style={{ background: CRIMSON, color: GOLD, border: '1px solid rgba(255,184,0,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {updateProfileMutation.isPending ? 'Saving…' : 'Save'}
                </button>
                <button onClick={function() { setIsEditing(false); }}
                  className="px-4 py-1.5 rounded-xl font-black uppercase text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Cancel
                </button>
              </div>
            </div>
          </DarkCard>
        )}

        {/* ── stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="Followers"   value={(user && user.followers_count) || 0}        icon={User}       color={GOLD} />
          <StatTile label="Streams"     value={myLiveRooms.length}                         icon={Radio}      color="#FFB800" />
          <StatTile label="Videos"      value={myVideoPosts.length}                        icon={Video}      color="#7B2D8B" />
          <StatTile label="Clips"       value={myClips.length}                             icon={Scissors}   color="#00F5FF" />
        </div>

        {/* ── section tabs ── */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map(function(tab) {
            var active = activeTab === tab;
            return (
              <button key={tab} onClick={function() { setActiveTab(tab); }}
                className="relative shrink-0 px-4 py-2 rounded-full font-black text-[11px] uppercase transition-all"
                style={{
                  background: active ? 'rgba(255,184,0,0.12)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid ' + (active ? GOLD + '50' : 'rgba(255,255,255,0.08)'),
                  color: active ? GOLD : 'rgba(255,255,255,0.45)',
                  fontFamily: 'Barlow Condensed, sans-serif',
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
            {/* Go Live CTA — shown when not streaming */}
            {!isOnline && (
              <Link to={createPageUrl('GoLive')} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ borderRadius: 16, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(255,26,60,0.12), rgba(212,175,55,0.08))', border: '1px solid rgba(255,26,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 16, color: '#F0E8D4', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ready to Go Live?</p>
                    <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Start a stream, panel room, or video post</p>
                  </div>
                  <div style={{ padding: '8px 16px', borderRadius: 10, background: '#FF1A3C', color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Radio className="w-4 h-4" /> Go Live
                  </div>
                </div>
              </Link>
            )}
            {isOnline && activeRoom && (
              <Link to={createPageUrl('GoLive') + '?room=' + activeRoom.id} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ borderRadius: 16, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(255,26,60,0.2), rgba(255,26,60,0.06))', border: '1px solid rgba(255,26,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF1A3C', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 16, color: '#FF1A3C', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>You are Live!</p>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{activeRoom.title || 'Live stream in progress'}</p>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12, color: '#FF1A3C' }}>Manage →</span>
                </div>
              </Link>
            )}

            {/* activity feed */}
            <DarkCard>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: GOLD }} />
                  <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Recent Activity</p>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {activityItems.map(function(item) { return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ background: item.color + '08', borderLeft: '2px solid ' + item.color + '30' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: item.color + '15', border: '1px solid ' + item.color + '25' }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <p className="flex-1 font-black text-[12px] text-white" style={T}>{item.desc}</p>
                    <span className="text-[11px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>{item.time}</span>
                  </div>
                ); })}
              </div>
            </DarkCard>

            {/* quick links */}
            <DarkCard>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>Quick Access</p>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Creator Dashboard', href: createPageUrl('CreatorDashboard'), icon: Radio,     color: PINK },
                  { label: 'Monetization',       href: createPageUrl('Monetization'),    icon: DollarSign, color: GOLD },
                  { label: 'My Link-in-Bio',     href: (user && user.id) ? ('/link-in-bio/' + user.id) : '/link-in-bio', icon: Share2,     color: '#00F5FF' },
                  { label: 'Post Video',         href: createPageUrl('VideoPost'),       icon: Video,      color: '#7B2D8B' },
                  { label: 'AI Hub',             href: createPageUrl('AIHub'),           icon: Sparkles,   color: '#8B5CF6' },
                  { label: 'Settings',           href: createPageUrl('Settings'),        icon: Settings,   color: '#FFB800' },
                  { label: 'Creator Setup',      href: null,                             icon: Star,       color: GOLD, onClick: function() { setSetupOpen(true); } },
                ].map(function(item) {
                  var inner = (
                    <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:brightness-110 cursor-pointer"
                      style={{ background: item.color + '08', border: '1px solid ' + item.color + '18' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: item.color + '18', border: '1px solid ' + item.color + '30' }}>
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

        {activeTab === 'Overview' && (user && user.id) && (
          <MySubscriptions userId={user.id} />
        )}

        {activeTab === 'Streams' && (
          <DarkCard>
            {myLiveRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Radio className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.12)' }} />
                <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>No streams yet</p>
                <Link to={createPageUrl('GoLive')}>
                  <button className="px-4 py-2 rounded-xl font-black uppercase text-[10px]"
                    style={{ background: 'rgba(255,184,0,0.12)', border: '1px solid ' + GOLD + '40', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Go Live
                  </button>
                </Link>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {myLiveRooms.slice(0, 10).map(function(room) {
                  var isLive = room.status === 'live';
                  return (
                    <div key={room.id}
                      onClick={function() { navigate(createPageUrl('LiveRoom') + '?id=' + room.id); }}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all hover:brightness-110"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: isLive ? PINK : 'rgba(255,255,255,0.2)' }} />
                      <span className="flex-1 font-black text-[13px] text-white truncate" style={T}>
                        {room.title || 'Untitled Stream'}
                      </span>
                      {room.viewer_count != null && (
                        <span className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {room.viewer_count} viewers
                        </span>
                      )}
                      {room.duration != null && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black shrink-0"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {Math.floor((room.duration || 0) / 60)}m
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-black uppercase shrink-0"
                        style={{
                          background: isLive ? 'rgba(255,32,64,0.15)' : 'rgba(255,255,255,0.06)',
                          border: '1px solid ' + (isLive ? 'rgba(255,32,64,0.3)' : 'rgba(255,255,255,0.1)'),
                          color: isLive ? PINK : 'rgba(255,255,255,0.4)',
                          fontFamily: 'Barlow Condensed, sans-serif',
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

        {activeTab === 'Videos' && (
          <DarkCard>
            {myVideoPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span style={{ fontSize: 40 }}>🎬</span>
                <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>No video posts yet</p>
                <Link to={createPageUrl('VideoPost')}>
                  <button className="px-4 py-2 rounded-xl font-black uppercase text-[10px]"
                    style={{ background: 'rgba(255,184,0,0.12)', border: '1px solid ' + GOLD + '40', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                    + Post a Video
                  </button>
                </Link>
              </div>
            ) : (
              <div className="p-3">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {myVideoPosts.map(function(post) {
                    return (
                      <div
                        key={post.id}
                        onClick={function() { navigate(createPageUrl('VideoViewer') + '?id=' + post.id); }}
                        style={{ borderRadius: 12, overflow: 'hidden', background: 'rgba(7,7,15,0.9)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}
                      >
                        <div style={{ height: 90, position: 'relative', background: 'linear-gradient(135deg, rgba(0,80,160,0.3), rgba(7,7,15,0.9))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {post.thumbnail_url
                            ? <img src={post.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                            : <span style={{ fontSize: 26 }}>🎬</span>
                          }
                          <div style={{ position: 'absolute', top: 5, left: 5, padding: '1px 5px', borderRadius: 4, background: 'rgba(0,0,0,0.75)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>VIDEO</div>
                          {post.is_exclusive && (
                            <div style={{ position: 'absolute', top: 5, right: 5, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,184,0,0.85)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: '#000', fontWeight: 900 }}>$</div>
                          )}
                        </div>
                        <div style={{ padding: '7px 9px 9px' }}>
                          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 12, color: '#F0E8D4', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title || 'Video'}</p>
                          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>👁 {post.viewer_count || 0} · ❤️ {post.like_count || 0}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <Link to={createPageUrl('VideoPost')} style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)', color: GOLD, textDecoration: 'none', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 900 }}>
                    + Post New Video
                  </Link>
                </div>
              </div>
            )}
          </DarkCard>
        )}

        {activeTab === 'Studios' && (
          <DarkCard>
            <div className="p-5 space-y-4">
              <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>Creator Studios</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1,1fr)', gap: 10 }}>
                {[
                  { emoji: '🎵', label: 'AI Music Studio',      sub: 'Generate AI beats and co-stream live with your audience',       page: 'AIMusic',              color: '#C9A84C' },
                  { emoji: '🎙', label: 'Podcast Studio',        sub: 'Record AI-assisted podcast episodes with live co-hosts',         page: 'PodcastStudio',        color: '#00A8E8' },
                  { emoji: '🎬', label: 'Micro Drama Creator',   sub: 'Write your story bible, plan episodes, and distribute to fans',  page: 'EpisodeCreatorStudio', color: '#7B2D8B' },
                  { emoji: '🤖', label: 'AI Hub',                sub: 'All AI tools in one place — music, moderation, co-host AI',      page: 'AIHub',                color: '#00F5FF' },
                  { emoji: '📡', label: 'Go Live',               sub: 'Launch a panel, battle, podcast, or watch party in one click',   page: 'GoLive',               color: '#FF1A3C' },
                ].map(function(item) {
                  return (
                    <Link key={item.page} to={createPageUrl(item.page)} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 12, background: item.color + '0D', border: '1px solid ' + item.color + '28', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                        <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14, color: '#F0E8D4', margin: 0 }}>{item.label}</p>
                          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.4 }}>{item.sub}</p>
                        </div>
                        <span style={{ color: item.color, fontSize: 18, fontFamily: 'Barlow Condensed, sans-serif' }}>›</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </DarkCard>
        )}

        {activeTab === 'Clips' && (
          <DarkCard>
            {myClips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Scissors className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.12)' }} />
                <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>No clips yet</p>
                <Link to={createPageUrl('ClipsLibrary')}>
                  <button className="px-4 py-2 rounded-xl font-black uppercase text-[10px]"
                    style={{ background: 'rgba(255,184,0,0.12)', border: '1px solid ' + GOLD + '40', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Go to Clips Library
                  </button>
                </Link>
              </div>
            ) : (
              <div className="p-3 grid grid-cols-2 gap-2">
                {myClips.slice(0, 12).map(function(clip) { return (
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
                          style={{ background: 'rgba(0,0,0,0.75)', color: 'rgba(255,255,255,0.85)', fontFamily: 'Barlow Condensed, sans-serif' }}>
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
                ); })}
              </div>
            )}
          </DarkCard>
        )}

        {activeTab === 'About' && (
          <DarkCard>
            <div className="p-5 space-y-4">
              <div>
                <p className="font-black text-[10px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>Bio</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                  {(user && user.bio) || 'No bio yet.'}
                </p>
              </div>
              <div>
                <p className="font-black text-[10px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>Email</p>
                <p className="text-sm flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <Mail className="w-3.5 h-3.5" style={{ color: GOLD }} />{(user && user.email)}
                </p>
              </div>
              {(user && user.badges) && user.badges.length > 0 && (
                <div>
                  <p className="font-black text-[10px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>Badges</p>
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map(function(badge, idx) { return (
                      <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase"
                        style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                        <Award className="w-3 h-3" />{badge}
                      </span>
                    ); })}
                  </div>
                </div>
              )}
              {subscriptions.length > 0 && (
                <div>
                  <p className="font-black text-[10px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>Active Subscriptions</p>
                  <div className="space-y-2">
                    {subscriptions.map(function(sub) { return (
                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div>
                          <p className="font-black text-sm text-white" style={T}>{sub.tier_name || 'Subscription'}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>${sub.price}/month</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md font-black text-[11px] uppercase"
                          style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: '#00FF88', fontFamily: 'Barlow Condensed, sans-serif' }}>
                          Active
                        </span>
                      </div>
                    ); })}
                  </div>
                </div>
              )}
            </div>
          </DarkCard>
        )}

        {activeTab === 'Settings' && (user && user.id) && (
          <div className="mb-3">
            <PayoutMethodSettings user={user} />
          </div>
        )}

        {activeTab === 'Settings' && (
          <DarkCard>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" style={{ color: GOLD }} />
                <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Account</p>
              </div>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                Leaving SeeWhy LIVE? Download a copy of your data, then remove your account and personal data.
              </p>
            </div>
            <div className="p-4 space-y-3">
              <Link to={createPageUrl('DataExport')}>
                <button
                  className="w-full px-4 py-2.5 rounded-xl font-black uppercase text-[11px] text-left flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,184,0,0.15)', color: 'rgba(255,255,255,0.6)', userSelect: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  <Download className="w-3.5 h-3.5" />
                  Download My Data
                </button>
              </Link>
              <button
                onClick={function() { base44.auth.logout(); }}
                className="w-full px-4 py-2.5 rounded-xl font-black uppercase text-[11px] text-left flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', userSelect: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}>
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </button>
              <AccountDeletionFlow user={user} />
            </div>
          </DarkCard>
        )}

      </div>
      <SwanAIRecommendations roomId={null} currentLayout="profile" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={null} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <CreatorProfileSetup user={user} isOpen={showCreatorSetup} onClose={function() { setShowCreatorSetup(false); }} />
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