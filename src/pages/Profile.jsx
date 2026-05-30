import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Award, Star, Gift, TrendingUp, Camera, Radio, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function DarkCard({ children, className = '', style = {} }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', ...style }}>
      {children}
    </div>
  );
}

function StatTile({ label, value, icon: Icon, color = GOLD }) {
  return (
    <DarkCard>
      <div className="p-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{label}</p>
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

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef();

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

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      toast.success('Profile updated!');
      queryClient.invalidateQueries(['currentUser']);
      setIsEditing(false);
    },
  });

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
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ avatar_url: file_url });
    queryClient.invalidateQueries(['currentUser']);
    toast.success('Avatar updated!');
    setUploadingAvatar(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080B18' }}>
        <div className="w-12 h-12 rounded-full animate-spin"
          style={{ border: '3px solid rgba(212,175,55,0.2)', borderTopColor: GOLD }} />
      </div>
    );
  }

  const completedReferrals = referrals.filter(r => r.status === 'completed').length;
  const initials = (user?.full_name || user?.email || '?')[0].toUpperCase();

  return (
    <div className="min-h-screen pb-10" style={{ background: '#080B18' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 py-3" style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <h1 className="font-black text-lg text-white" style={T}>My Profile</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-5 space-y-4">
        {/* Profile header card */}
        <DarkCard>
          <div className="p-5 flex items-start gap-5">
            {/* Octagonal avatar */}
            <div className="relative shrink-0 cursor-pointer" onClick={() => fileRef.current?.click()}>
              <div className="relative" style={{ width: 80, height: 80 }}>
                <div className="absolute inset-0" style={{ clipPath: OCT, background: GOLD }} />
                <div className="absolute inset-[2.5px] overflow-hidden flex items-center justify-center"
                  style={{ clipPath: OCT, background: `linear-gradient(145deg, ${CRIMSON}99, #0d0618)` }}>
                  {user?.avatar_url
                    ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, monospace' }}>{initials}</span>}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full"
                  style={{ clipPath: OCT, background: 'rgba(0,0,0,0.6)' }}>
                  {uploadingAvatar
                    ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : <Camera className="w-5 h-5 text-white" />}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="font-black text-xl text-white leading-none" style={T}>
                    {user?.full_name || 'Anonymous'}
                  </h2>
                  <p className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <Mail className="w-3 h-3" />{user?.email}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md font-black uppercase text-[9px]"
                  style={{ background: user?.role === 'admin' ? 'rgba(128,0,32,0.2)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
                  {user?.role || 'member'}
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-2 mt-2">
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
              ) : (
                <div className="mt-1">
                  <p className="text-[12px] mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {user?.bio || 'No bio yet. Click Edit to add one.'}
                  </p>
                  <button onClick={() => setIsEditing(true)}
                    className="px-3 py-1 rounded-xl font-black uppercase text-[10px]"
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, ...T }}>
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </DarkCard>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="Points" value={user?.points || 0} icon={Star} color={GOLD} />
          <StatTile label="Referrals" value={completedReferrals} icon={Gift} color="#8B5CF6" />
          <StatTile label="Subscriptions" value={subscriptions.length} icon={TrendingUp} color="#00F5FF" />
          <StatTile label="Virtual Items" value={inventory.length} icon={Award} color="#00FF88" />
        </div>

        {/* Badges */}
        {user?.badges && user.badges.length > 0 && (
          <DarkCard>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Badges</p>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {user.badges.map((badge, idx) => (
                <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
                  <Award className="w-3 h-3" />{badge}
                </span>
              ))}
            </div>
          </DarkCard>
        )}

        {/* Active Subscriptions */}
        {subscriptions.length > 0 && (
          <DarkCard>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Active Subscriptions</p>
            </div>
            <div className="p-3 space-y-2">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <p className="font-black text-sm text-white" style={T}>{sub.tier_name || 'Subscription'}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>${sub.price}/month</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md font-black text-[9px] uppercase"
                    style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: '#00FF88', ...T }}>
                    Active
                  </span>
                </div>
              ))}
            </div>
          </DarkCard>
        )}

        {/* Quick Links */}
        <DarkCard>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-black text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Quick Access</p>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Creator Dashboard', href: createPageUrl('CreatorDashboard'), icon: Radio, color: '#FF1564' },
              { label: 'Viewer Feed', href: createPageUrl('ViewerDashboard'), icon: BarChart2, color: '#00F5FF' },
            ].map(item => (
              <Link key={item.href} to={item.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <item.icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                  <div>
                    <p className="font-black text-[11px] text-white" style={T}>{item.label}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </DarkCard>
      </div>
    </div>
  );
}
