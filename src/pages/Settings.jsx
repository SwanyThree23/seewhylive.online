import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Bell, Lock, User, LayoutDashboard, Download, Trash2, AlertTriangle, Youtube, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useAuth } from '@/lib/AuthContext';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import CreatorBridge from '../components/social/CreatorBridge';
import CreatorProfileSetup from '../components/profile/CreatorProfileSetup';
import TierEditor from '../components/subscriptions/TierEditor';
import ZEGOSettingsDrawer from '../components/live/ZEGOSettingsDrawer';
import MySubscriptions from '../components/subscriptions/MySubscriptions';
import PaymentMethodSelector from '../components/monetization/PaymentMethodSelector';
import SoundAlertsManager from '../components/monetization/SoundAlertsManager';
import CreatorTierManager from '../components/subscriptions/CreatorTierManager';
import StripeConnectButton from '../components/monetization/StripeConnectButton';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
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
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
import SubscriptionCard from '../components/monetization/SubscriptionCard';
import TierSubscribeCard from '../components/subscriptions/TierSubscribeCard';
import TierEditor from '../components/subscriptions/TierEditor';
import CreatorProfileSetup from '../components/profile/CreatorProfileSetup';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Icon className="w-4 h-4" style={{ color: GOLD }} />
        <div>
          <p className="font-black text-sm text-white leading-none" style={T}>{title}</p>
          {description && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{description}</p>}
        </div>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-black text-sm text-white" style={T}>{label}</p>
        {description && <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{description}</p>}
      </div>
      <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 99, background: checked ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </div>
    </div>
  );
}

function SaveButton({ onClick, disabled, label = 'Save Changes' }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-5 py-2 rounded-xl font-black uppercase text-[11px] disabled:opacity-50"
      style={{ background: disabled ? 'rgba(212,175,55,0.1)' : CRIMSON, color: GOLD, border: '1px solid rgba(212,175,55,0.3)', boxShadow: disabled ? 'none' : '0 0 12px rgba(128,0,32,0.3)', ...T }}>
      {label}
    </button>
  );
}

function DarkInput({ value, onChange, placeholder, disabled }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none disabled:opacity-40"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.15)' }} />
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1 = reason, 2 = confirm
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: preferences } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreference.filter({ user_id: user?.id });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (user) setFullName(user.full_name || '');
  }, [user]);

  useEffect(() => {
    if (preferences) {
      setEmailNotifications(preferences.email_notifications ?? true);
      setPushNotifications(preferences.push_notifications ?? true);
      setShowActivity(preferences.show_activity ?? true);
      setPublicProfile(preferences.public_profile ?? true);
    }
  }, [preferences]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      toast.success('Profile saved!');
      queryClient.invalidateQueries(['currentUser']);
    },
    onError: () => toast.error('Action failed.'),
  });

  const savePreferencesMutation = useMutation({
    mutationFn: (data) => {
      if (preferences?.id) return base44.entities.UserPreference.update(preferences.id, data);
      return base44.entities.UserPreference.create({ user_id: user?.id, ...data });
    },
    onSuccess: () => {
      toast.success('Preferences saved!');
      queryClient.invalidateQueries(['userPreferences']);
    },
    onError: () => toast.error('Action failed.'),
  });

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      if (typeof base44.auth.deleteUser === 'function') {
        await base44.auth.deleteUser();
      } else {
        await base44.auth.deleteMe();
      }
      window.location.href = '/';
    } catch {
      toast.error('Could not delete account automatically. Please contact Base44 support to complete your request.');
    } finally {
      setIsDeleting(false);
    }
  }

  const CREATOR_LINKS = [
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
    <div className="min-h-screen pb-10" style={{ background: '#080B18' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-2"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <SettingsIcon className="w-5 h-5" style={{ color: GOLD }} />
        <h1 className="font-black text-lg text-white" style={T}>Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {/* Profile */}
        <Section icon={User} title="Profile" description="Manage your personal information">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>Full Name</label>
              <DarkInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>Email</label>
              <DarkInput value={user?.email || ''} disabled />
            </div>
            <SaveButton onClick={() => updateProfileMutation.mutate({ full_name: fullName })} disabled={updateProfileMutation.isPending} />
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications" description="Control how you receive notifications">
          <ToggleRow label="Email Notifications" description="Receive updates via email" checked={emailNotifications} onChange={setEmailNotifications} />
          <ToggleRow label="Push Notifications" description="Real-time alerts in browser" checked={pushNotifications} onChange={setPushNotifications} />
          <SaveButton
            onClick={() => savePreferencesMutation.mutate({ email_notifications: emailNotifications, push_notifications: pushNotifications })}
            disabled={savePreferencesMutation.isPending}
            label="Save Notification Preferences"
          />
        </Section>

        {/* Privacy */}
        <Section icon={Lock} title="Privacy" description="Control your visibility">
          <ToggleRow label="Show Activity" description="Let others see your activity feed" checked={showActivity} onChange={setShowActivity} />
          <ToggleRow label="Public Profile" description="Make your profile visible to all users" checked={publicProfile} onChange={setPublicProfile} />
          <SaveButton
            onClick={() => savePreferencesMutation.mutate({ show_activity: showActivity, public_profile: publicProfile })}
            disabled={savePreferencesMutation.isPending}
            label="Save Privacy Settings"
          />
        </Section>

        {/* Creator Tools */}
        <Section icon={LayoutDashboard} title="Creator Tools" description="Quick access to creator features">
          <div className="grid grid-cols-2 gap-2">
            {CREATOR_LINKS.map(item => (
              <Link key={item.href} to={createPageUrl(item.href)}>
                <div className="px-3 py-2.5 rounded-xl font-black text-[10px] uppercase text-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.12)', color: 'rgba(255,255,255,0.6)', ...T }}>
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </Section>

        {/* My Subscriptions */}
        {user && (
          <Section icon={Bell} title="My Subscriptions" description="Creators you're subscribed to">
            <MySubscriptions userId={user.id} />
          </Section>
        )}

        {/* Social Links */}
        {user && (
          <Section icon={Youtube} title="Social Links" description="Connect your YouTube and other channels">
            <CreatorBridge user={user} />
          </Section>
        )}

        {/* Creator Profile Setup */}
        {user && (
          <Section icon={User} title="Creator Profile Setup" description="Complete your creator profile">
            <CreatorProfileSetup user={user} isOpen={true} onClose={() => {}} />
          </Section>
        )}

        {/* Appearance */}
        <Section icon={Palette} title="Appearance" description="Customize your stream and app background">
          <BackgroundCustomizer />
        </Section>

        {/* Payment Methods */}
        {user && (
          <Section icon={SettingsIcon} title="Payment Methods" description="Manage your saved payment methods">
            <PaymentMethodSelector creatorId={user.id} roomId={activeRoomId} onPaymentComplete={() => {}} />
            <div className="pt-2">
              <StripeConnectButton creatorId={user.id} />
            </div>
          </Section>
        )}


        {/* Subscription Tiers */}
        {user && (
          <Section icon={Bell} title="Subscription Tiers" description="Manage your creator subscription tiers">
            <CreatorTierManager creatorId={user.id} />
            <TierEditor open={false} onClose={() => {}} creatorId={user.id} existing={null} />
          </Section>
        )}

        {/* Sound Alerts */}
        {user && (
          <Section icon={Bell} title="Sound Alerts" description="Customize sounds for tips, subs, and events">
            <SoundAlertsManager creatorId={user.id} />
          </Section>
        )}

        {/* ZEGO Settings */}
        {user && (
          <Section icon={SettingsIcon} title="Streaming Settings" description="Configure ZEGO stream quality and devices">
            <ZEGOSettingsDrawer roomId={activeRoomId} streamKey={null} onClose={() => {}} />
          </Section>
        )}

        {/* Data Export */}
        <Section icon={Download} title="Data Export" description="Download your data as PDF, CSV, or JSON">
          <Link to={createPageUrl('DataExport')}>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black uppercase text-[11px] w-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.12)', color: 'rgba(255,255,255,0.6)', ...T }}>
              <Download className="w-4 h-4" />Export My Data
            </button>
          </Link>
        </Section>

        {/* Account */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: '#C0392B' }} />
            <p className="font-black text-sm text-white" style={T}>Account</p>
          </div>
          <div className="p-4 space-y-3">
            <button
              onClick={() => base44.auth.logout()}
              className="w-full px-4 py-2.5 rounded-xl font-black uppercase text-[11px] text-left"
              style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', color: '#C0392B', userSelect: 'none', ...T }}>
              Log Out
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full px-4 py-2.5 rounded-xl font-black uppercase text-[11px] text-left flex items-center gap-2"
              style={{ background: 'rgba(192,57,43,0.04)', border: '1px solid rgba(192,57,43,0.12)', color: 'rgba(192,57,43,0.6)', userSelect: 'none', ...T }}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowDeleteDialog(false); setDeleteStep(1); setDeleteReason(''); setDeleteConfirmText(''); } }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: 'rgba(13,6,24,0.99)', border: '1px solid rgba(192,57,43,0.3)' }}>
            <div className="p-5 text-center" style={{ borderBottom: '1px solid rgba(192,57,43,0.1)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.25)' }}>
                <Trash2 className="w-5 h-5" style={{ color: '#C0392B' }} />
              </div>
              <p className="font-black text-lg text-white" style={T}>Delete Account?</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                This permanently deletes your account, streams, and all data. This cannot be undone.
              </p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase mb-1.5 text-center" style={{ color: 'rgba(192,57,43,0.7)', ...T }}>
                  Type DELETE to confirm
                </label>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-center outline-none font-black"
                  style={{ background: 'rgba(192,57,43,0.06)', border: `1px solid ${deleteConfirmText === 'DELETE' ? '#C0392B' : 'rgba(192,57,43,0.2)'}`, color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }} />
              </div>
              <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="w-full py-3 rounded-xl font-black uppercase text-sm transition-all"
                style={{ background: deleteConfirmText === 'DELETE' ? '#C0392B' : 'rgba(192,57,43,0.12)', color: deleteConfirmText === 'DELETE' ? 'white' : 'rgba(192,57,43,0.4)', userSelect: 'none', ...T }}>
                {isDeleting ? 'Deleting…' : 'Permanently Delete Account'}
              </button>
              <button onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }}
                className="w-full py-2.5 rounded-xl font-black uppercase text-xs"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', userSelect: 'none', ...T }}>
                Cancel
              </button>
            </div>

            {/* Step 1: Reason */}
            {deleteStep === 1 && (
              <div className="p-5 space-y-3">
                <p className="text-[10px] font-black uppercase text-center" style={{ color: 'rgba(239,68,68,0.7)', ...T }}>
                  Why are you leaving? (required)
                </p>
                <div className="space-y-2">
                  {['I no longer use this service', 'Privacy concerns', 'Found a better platform', 'Too many notifications', 'Other reason'].map(reason => (
                    <button key={reason} onClick={() => setDeleteReason(reason)}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all"
                      style={{ background: deleteReason === reason ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${deleteReason === reason ? '#EF4444' : 'rgba(255,255,255,0.08)'}`, color: deleteReason === reason ? '#EF4444' : 'rgba(255,255,255,0.55)', userSelect: 'none', ...T }}>
                      {deleteReason === reason ? '● ' : '○ '}{reason}
                    </button>
                  ))}
                </div>
                <button onClick={() => setDeleteStep(2)} disabled={!deleteReason}
                  className="w-full py-3 rounded-xl font-black uppercase text-sm transition-all"
                  style={{ background: deleteReason ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.06)', color: deleteReason ? '#EF4444' : 'rgba(239,68,68,0.3)', userSelect: 'none', ...T }}>
                  Continue →
                </button>
                <button onClick={() => { setShowDeleteDialog(false); setDeleteStep(1); setDeleteReason(''); }}
                  className="w-full py-2.5 rounded-xl font-black uppercase text-xs"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', userSelect: 'none', ...T }}>
                  Cancel
                </button>
              </div>
            )}

            {/* Step 2: Confirm */}
            {deleteStep === 2 && (
              <div className="p-5 space-y-3">
                <div className="px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Reason</p>
                  <p className="text-xs font-black" style={{ color: '#EF4444', ...T }}>{deleteReason}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1.5 text-center" style={{ color: 'rgba(239,68,68,0.7)', ...T }}>
                    Type DELETE to confirm
                  </label>
                  <input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="DELETE"
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-center outline-none font-black"
                    style={{ background: 'rgba(239,68,68,0.06)', border: `1px solid ${deleteConfirmText === 'DELETE' ? '#EF4444' : 'rgba(239,68,68,0.2)'}`, color: '#EF4444', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }} />
                </div>
                <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  className="w-full py-3 rounded-xl font-black uppercase text-sm transition-all"
                  style={{ background: deleteConfirmText === 'DELETE' ? '#EF4444' : 'rgba(239,68,68,0.12)', color: deleteConfirmText === 'DELETE' ? 'white' : 'rgba(239,68,68,0.4)', userSelect: 'none', ...T }}>
                  {isDeleting ? 'Deleting…' : 'Permanently Delete Account'}
                </button>
                <button onClick={() => { setDeleteStep(1); setDeleteConfirmText(''); }}
                  className="w-full py-2.5 rounded-xl font-black uppercase text-xs"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', userSelect: 'none', ...T }}>
                  ← Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <SwanAIRecommendations roomId={null} currentLayout="settings" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      {user?.id && <SubscriptionCard tier={'basic'} price={4.99} benefits={[]} communityId={null} creatorId={user?.id} isSubscribed={false} />}
      {user?.id && <TierSubscribeCard tier={null} currentSub={null} userId={user.id} creatorId={user?.id} isHighlighted={false} />}
      <TierEditor open={false} onClose={() => {}} creatorId={user?.id} existing={null} />
      <CreatorProfileSetup user={user} isOpen={false} onClose={() => {}} />
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={null} roomId={null} currentUser={null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}