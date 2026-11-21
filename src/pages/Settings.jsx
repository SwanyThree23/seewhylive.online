import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Bell, Lock, User, LayoutDashboard, Download, AlertTriangle, Key, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import AccountDeletionFlow from '../components/settings/AccountDeletionFlow';
import CreatorBridge from '../components/social/CreatorBridge';
import CreatorProfileSetup from '../components/profile/CreatorProfileSetup';
import TierEditor from '../components/subscriptions/TierEditor';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import SubscriptionCard from '../components/monetization/SubscriptionCard';
import TierSubscribeCard from '../components/subscriptions/TierSubscribeCard';
import VoiceAISettings from '../components/settings/VoiceAISettings';
import ApiKeyManager from '../components/settings/ApiKeyManager';
var GOLD = '#FFB800';
var CRIMSON = '#FF1564';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };

function Section(props) {
  var Icon = props.icon;
  var title = props.title;
  var description = props.description;
  var children = props.children;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid rgba(255,184,0,0.1)' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Icon className="w-4 h-4" style={{ color: GOLD }} />
        <div>
          <p className="font-black text-sm text-white leading-none" style={T}>{title}</p>
          {description && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>{description}</p>}
        </div>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function ToggleRow(props) {
  var label = props.label;
  var description = props.description;
  var checked = props.checked;
  var onChange = props.onChange;
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-black text-sm text-white" style={T}>{label}</p>
        {description && <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{description}</p>}
      </div>
      <div onClick={function() { onChange(!checked); }} style={{ width: 40, height: 22, borderRadius: 99, background: checked ? '#FF1564' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </div>
    </div>
  );
}

function SaveButton(props) {
  var onClick = props.onClick;
  var disabled = props.disabled;
  var label = props.label || 'Save Changes';
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-5 py-2 rounded-xl font-black uppercase text-[11px] disabled:opacity-50"
      style={{ background: disabled ? 'rgba(255,184,0,0.1)' : CRIMSON, color: GOLD, border: '1px solid rgba(255,184,0,0.3)', boxShadow: disabled ? 'none' : '0 0 12px rgba(255,21,100,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
      {label}
    </button>
  );
}

function DarkInput(props) {
  var value = props.value;
  var onChange = props.onChange;
  var placeholder = props.placeholder;
  var disabled = props.disabled;
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none disabled:opacity-40"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,184,0,0.15)' }} />
  );
}

export default function SettingsPage() {
  var queryClient = useQueryClient();
  var showCreatorSetupState = useState(false);
  var showCreatorSetup = showCreatorSetupState[0];
  var setShowCreatorSetup = showCreatorSetupState[1];
  var showTierEditorState = useState(false);
  var showTierEditor = showTierEditorState[0];
  var setShowTierEditor = showTierEditorState[1];
  var editingTierState = useState(null);
  var editingTier = editingTierState[0];
  var setEditingTier = editingTierState[1];
  var fullNameState = useState('');
  var fullName = fullNameState[0];
  var setFullName = fullNameState[1];
  var emailNotificationsState = useState(true);
  var emailNotifications = emailNotificationsState[0];
  var setEmailNotifications = emailNotificationsState[1];
  var pushNotificationsState = useState(true);
  var pushNotifications = pushNotificationsState[0];
  var setPushNotifications = pushNotificationsState[1];
  var showActivityState = useState(true);
  var showActivity = showActivityState[0];
  var setShowActivity = showActivityState[1];
  var publicProfileState = useState(true);
  var publicProfile = publicProfileState[0];
  var setPublicProfile = publicProfileState[1];
  var payLinksState = useState({});
  var payLinks = payLinksState[0];
  var setPayLinks = payLinksState[1];
  var payLinksSavingState = useState(false);
  var payLinksSaving = payLinksSavingState[0];
  var setPayLinksSaving = payLinksSavingState[1];
  var myProfileIdState = useState(null);
  var myProfileId = myProfileIdState[0];
  var setMyProfileId = myProfileIdState[1];

  var userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });
  var user = userQuery.data || null;
  var roomId = new URLSearchParams(window.location.search).get('room_id');
  var activeRoomId = roomId;
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);

  var preferencesQuery = useQuery({
    queryKey: ['userPreferences', (user && user.id)],
    queryFn: async function() {
      var prefs = await base44.entities.UserPreference.filter({ user_id: (user && user.id) });
      return prefs[0] || null;
    },
    enabled: !!user,
  });
  var preferences = preferencesQuery.data || null;

  useEffect(function() {
    if (user) setFullName(user.full_name || '');
  }, [user]);

  useEffect(function() {
    if (preferences) {
      setEmailNotifications(preferences.email_notifications || true);
      setPushNotifications(preferences.push_notifications || true);
      setShowActivity(preferences.show_activity || true);
      setPublicProfile(preferences.public_profile || true);
    }
  }, [preferences]);

  useEffect(function() {
    if (!user) return;
    base44.entities.CreatorProfile.filter({ user_id: user.id }).then(function(profiles) {
      if (profiles && profiles[0]) {
        setMyProfileId(profiles[0].id);
        setPayLinks(profiles[0].payment_links || {});
      }
    }).catch(function() {});
  }, [user && user.id]);

  async function savePayLinks() {
    if (!user) return;
    setPayLinksSaving(true);
    try {
      await base44.auth.updateMe({ payment_links: payLinks });
      if (myProfileId) {
        await base44.entities.CreatorProfile.update(myProfileId, { payment_links: payLinks });
      }
      toast.success('Payment links saved!');
    } catch {
      toast.error('Failed to save payment links');
    } finally {
      setPayLinksSaving(false);
    }
  }

  var updateProfileMutation = useMutation({
    mutationFn: function(data) { return base44.auth.updateMe(data); },
    onSuccess: function() {
      toast.success('Profile saved!');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: function() { toast.error('Action failed.'); },
  });

  var savePreferencesMutation = useMutation({
    mutationFn: function(data) {
      if ((preferences && preferences.id)) return base44.entities.UserPreference.update(preferences.id, data);
      var createData = Object.assign({ user_id: (user && user.id) }, data);
      return base44.entities.UserPreference.create(createData);
    },
    onSuccess: function() {
      toast.success('Preferences saved!');
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
    onError: function() { toast.error('Action failed.'); },
  });

  var CREATOR_LINKS = [
    { label: 'Creator Dashboard', href: 'CreatorDashboard' },
    { label: 'Viewer Dashboard',  href: 'ViewerDashboard' },
    { label: 'Stream Scheduler',  href: 'StreamScheduler' },
    { label: 'Monetization',      href: 'Monetization' },
    { label: 'Analytics',         href: 'Analytics' },
    { label: 'AI Hub',            href: 'AIHub' },
    { label: 'Joyce AI',          href: 'JoyceAI' },
    { label: 'INS Forge',         href: 'INSForge' },
    { label: 'Podcast Studio',    href: 'PodcastStudio' },
    { label: 'AI Music Studio',   href: 'AIMusic' },
    { label: 'Overlay Editor',    href: 'OverlayEditor' },
    { label: 'Scene Templates',   href: 'SceneTemplates' },
    { label: 'Stream Alerts',     href: 'StreamAlerts' },
    { label: 'Platform Showcase', href: 'PlatformShowcase' },
    { label: 'Stream Ref Dash',   href: 'StreamRefDash' },
    { label: 'Newsletter Hub',    href: 'NewsletterHub' },
    { label: 'Social Expo',       href: 'SocialExpo' },
    { label: 'Multi-Platform+',   href: 'MultiPlatformIntegration' },
    { label: 'Aura AI',           href: 'AuraAI' },
    { label: 'SwanyBot',          href: 'SwanyBotPage' },
    { label: 'Hybrid Stream',     href: 'HybridStreamRoom' },
    { label: 'Enhancement Suite', href: 'EnhancementSuite' },
    { label: 'Transcription',     href: 'TranscriptionStudio' },
    { label: 'Poll Manager',      href: 'PollManager' },
    { label: 'Multi-Stream Mgr',  href: 'MultiStreamManager' },
    { label: 'Voice AI Settings', href: 'VoiceAISettings' },
    { label: 'Stream Analytics',  href: 'StreamAnalytics' },
    { label: 'Advanced Analytics',href: 'AdvancedAnalytics' },
    { label: 'Challenges Hub',    href: 'ChallengesHub' },
    { label: 'Loyalty Hub',       href: 'LoyaltyHub' },
    { label: 'Communities',       href: 'Communities' },
    { label: 'Overlay Builder',   href: 'OverlayBuilder' },
    { label: 'Control Room',      href: 'ControlRoom' },
    { label: 'PK Battle Mgr',     href: 'PKBattleManager' },
    { label: 'Creator Subs',      href: 'CreatorSubscriptions' },
    { label: 'Loyalty Program',   href: 'LoyaltyProgram' },
    { label: 'Invite Users',      href: 'InviteUsers' },
    { label: 'PPV Events',        href: 'PayPerViewEvents' },
    { label: 'VOD Library',       href: 'VODLibrary' },
    { label: 'Content Calendar',  href: 'ContentCalendar' },
    { label: 'Clips Library',     href: 'ClipsLibrary' },
    { label: 'Pre-Flight',        href: 'GreenRoomPreFlight' },
    { label: 'Greenroom',         href: 'Greenroom' },
    { label: 'Greenroom Enhanced',href: 'GreenroomEnhanced' },
    { label: 'Newsletter',        href: 'Newsletter' },
    { label: 'Dashboard',         href: 'Dashboard' },
    { label: 'Social Expo',       href: 'SocialExpo' },
    { label: 'Leaderboard',       href: 'Leaderboard' },
    { label: 'Messages',          href: 'Messages' },
    { label: 'BroadcastStudio',   href: 'BroadcastStudio' },
    { label: 'Guardian AI',       href: 'GuardianAI' },
    { label: 'PKBattle Arena',    href: 'PKBattleArena' },
  ];

  return (
    <div className="min-h-screen pb-10" style={{ background: '#03030A' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-2"
        style={{ background: 'rgba(7,7,15,0.97)', borderBottom: '1px solid rgba(255,184,0,0.1)', backdropFilter: 'blur(12px)' }}>
        <SettingsIcon className="w-5 h-5" style={{ color: GOLD }} />
        <h1 className="font-black text-lg text-white" style={T}>Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {/* Profile */}
        <Section icon={User} title="Profile" description="Manage your personal information">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Full Name</label>
              <DarkInput value={fullName} onChange={function(e) { setFullName(e.target.value); }} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Email</label>
              <DarkInput value={(user && user.email) || ''} disabled />
            </div>
            <SaveButton onClick={function() { updateProfileMutation.mutate({ full_name: fullName.slice(0, 60) }); }} disabled={updateProfileMutation.isPending} />
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications" description="Control how you receive notifications">
          <ToggleRow label="Email Notifications" description="Receive updates via email" checked={emailNotifications} onChange={setEmailNotifications} />
          <ToggleRow label="Push Notifications" description="Real-time alerts in browser" checked={pushNotifications} onChange={setPushNotifications} />
          <SaveButton
            onClick={function() { savePreferencesMutation.mutate({ email_notifications: emailNotifications, push_notifications: pushNotifications }); }}
            disabled={savePreferencesMutation.isPending}
            label="Save Notification Preferences"
          />
        </Section>

        {/* Privacy */}
        <Section icon={Lock} title="Privacy" description="Control your visibility">
          <ToggleRow label="Show Activity" description="Let others see your activity feed" checked={showActivity} onChange={setShowActivity} />
          <ToggleRow label="Public Profile" description="Make your profile visible to all users" checked={publicProfile} onChange={setPublicProfile} />
          <SaveButton
            onClick={function() { savePreferencesMutation.mutate({ show_activity: showActivity, public_profile: publicProfile }); }}
            disabled={savePreferencesMutation.isPending}
            label="Save Privacy Settings"
          />
        </Section>

        {/* Creator Tools */}
        <Section icon={LayoutDashboard} title="Creator Tools" description="Quick access to creator features">
          <div className="grid grid-cols-2 gap-2">
            {CREATOR_LINKS.map(function(item) { return (
              <Link key={item.href} to={createPageUrl(item.href)}>
                <div className="px-3 py-2.5 rounded-xl font-black text-[10px] uppercase text-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,184,0,0.12)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {item.label}
                </div>
              </Link>
            ); })}
          </div>
        </Section>

        {/* Direct Payment Links */}
        <Section icon={DollarSign} title="Direct Payment Links" description="Fans can send money directly — no platform cut">
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Enter your handle or username for each app. Fans will see these on your profile and live streams.
          </p>
          {[
            { id: 'paypal',   label: 'PayPal',    placeholder: 'paypal.me/yourname' },
            { id: 'cashapp',  label: 'Cash App',  placeholder: '$YourCashtag' },
            { id: 'venmo',    label: 'Venmo',     placeholder: '@yourvenmo' },
            { id: 'zelle',    label: 'Zelle',     placeholder: 'Phone or email' },
            { id: 'chime',    label: 'Chime',     placeholder: 'yourchimetag' },
            { id: 'applepay', label: 'Apple Pay', placeholder: 'Phone or email' },
            { id: 'googlepay',label: 'Google Pay',placeholder: 'Phone or email' },
          ].map(function(p) {
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.6)', width: 72, flexShrink: 0 }}>{p.label}</span>
                <input
                  value={payLinks[p.id] || ''}
                  onChange={function(e) { setPayLinks(function(prev) { var n = Object.assign({}, prev); n[p.id] = e.target.value; return n; }); }}
                  placeholder={p.placeholder}
                  style={{ flex: 1, padding: '7px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,184,0,0.15)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}
                />
              </div>
            );
          })}
          <SaveButton onClick={savePayLinks} disabled={payLinksSaving} label={payLinksSaving ? 'Saving…' : 'Save Payment Links'} />
        </Section>

        {/* API Keys */}
        <Section icon={Key} title="API Keys" description="Third-party service keys stored locally — never sent to our servers">
          <ApiKeyManager />
        </Section>

        {/* Data Export */}
        <Section icon={Download} title="Data Export" description="Download your data as PDF, CSV, or JSON">
          <Link to={createPageUrl('DataExport')}>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black uppercase text-[11px] w-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,184,0,0.12)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              <Download className="w-4 h-4" />Export My Data
            </button>
          </Link>
        </Section>

        {/* Account */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid rgba(255,184,0,0.1)' }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: '#FF2040' }} />
            <p className="font-black text-sm text-white" style={T}>Account</p>
          </div>
          <div className="p-4 space-y-3">
            <button
              onClick={function() { base44.auth.logout(); }}
              className="w-full px-4 py-2.5 rounded-xl font-black uppercase text-[11px] text-left"
              style={{ background: 'rgba(255,32,64,0.08)', border: '1px solid rgba(255,32,64,0.2)', color: '#FF2040', userSelect: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Log Out
            </button>
            <AccountDeletionFlow user={user} />
          </div>
        </div>
      </div>

      <SwanAIRecommendations roomId={null} currentLayout="settings" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={null} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      {(user && user.id) && <SubscriptionCard tier={'basic'} price={4.99} benefits={[]} communityId={null} creatorId={(user && user.id)} isSubscribed={false} />}
      {(user && user.id) && <TierSubscribeCard tier={null} currentSub={null} userId={user.id} creatorId={(user && user.id)} isHighlighted={false} />}
      <TierEditor open={showTierEditor} onClose={function() { setShowTierEditor(false); setEditingTier(null); }} creatorId={(user && user.id)} existing={editingTier} />
      <CreatorProfileSetup user={user} isOpen={showCreatorSetup} onClose={function() { setShowCreatorSetup(false); }} />
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      {/* Creator Studios */}
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
      <BackgroundCustomizer />
      <VoiceAISettings />
    </div>
  );
}