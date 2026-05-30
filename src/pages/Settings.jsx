import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Bell, Lock, User, LayoutDashboard, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
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
      <Switch checked={checked} onCheckedChange={onChange} />
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
  });

  const CREATOR_LINKS = [
    { label: 'Creator Dashboard', href: 'CreatorDashboard' },
    { label: 'Viewer Dashboard',  href: 'ViewerDashboard' },
    { label: 'Stream Scheduler',  href: 'StreamScheduler' },
    { label: 'Monetization',      href: 'Monetization' },
    { label: 'Analytics',         href: 'Analytics' },
    { label: 'Overlay Editor',    href: 'OverlayEditor' },
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
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
          <div className="p-4">
            <button
              onClick={() => base44.auth.logout()}
              className="w-full px-4 py-2.5 rounded-xl font-black uppercase text-[11px] text-left"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', ...T }}>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
