import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Settings, Flag, Megaphone, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ReferralConfig from '../components/admin/ReferralConfig';
import ReportsManager from '../components/admin/ReportsManager';
import AnnouncementScheduler from '../components/admin/AnnouncementScheduler';
import ChallengeAnalytics from '../components/admin/ChallengeAnalytics';
import SpotlightBanner from '../components/community/SpotlightBanner';
import DiscussionFeed from '../components/community/DiscussionFeed';
import AnnouncementFeed from '../components/community/AnnouncementFeed';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TABS = [
  { id: 'analytics',     label: 'Analytics',     icon: TrendingUp },
  { id: 'reports',       label: 'Reports',        icon: Flag },
  { id: 'announcements', label: 'Announcements',  icon: Megaphone },
  { id: 'referrals',     label: 'Referrals',      icon: Users },
];

export default function CommunityAdminPage() {
  const [activeTab, setActiveTab] = useState('analytics');
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(c => c[0]),
    enabled: !!communityId,
  });
  const { data: membership } = useQuery({
    queryKey: ['membership', communityId, user?.id],
    queryFn: () => base44.entities.CommunityMember.filter({ community_id: communityId, user_id: user?.id }).then(m => m[0]),
    enabled: !!communityId && !!user,
  });

  const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4" style={{ background: BG }}>
      <div>
        <Settings className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
        <h2 className="text-xl font-black mb-2 text-white" style={T}>Access Denied</h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>You need admin privileges to access this page.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 border-b" style={{ background: 'rgba(8,11,24,0.97)', borderColor: 'rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 py-4">
            <Settings className="w-5 h-5" style={{ color: GOLD }} />
            <div>
              <h1 className="text-xl font-black text-white leading-none" style={T}>Admin Dashboard</h1>
              {community?.name && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{community.name} — Community Management</p>}
            </div>
          </div>
          {/* Tab bar */}
          <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all"
                  style={{ ...T, color: active ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: active ? GOLD : 'transparent', background: active ? 'rgba(212,175,55,0.05)' : 'transparent' }}>
                  <Icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {activeTab === 'analytics' && <ChallengeAnalytics communityId={communityId} />}
        {activeTab === 'reports' && <ReportsManager communityId={communityId} userId={user?.id} />}
        {activeTab === 'announcements' && <AnnouncementScheduler communityId={communityId} userId={user?.id} />}
        {activeTab === 'referrals' && <ReferralConfig communityId={communityId} />}

        <div style={{ marginTop: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SpotlightBanner communityId={null} isAdmin={true} />
          <AnnouncementFeed communityId={null} />
          <DiscussionFeed communityId={null} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to={createPageUrl('Communities')} style={{ textDecoration: 'none' }}>
            <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>← Communities</span>
          </Link>
          <Link to={createPageUrl('CommunityGrowth')} style={{ textDecoration: 'none' }}>
            <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl" style={{ background: 'rgba(109,191,126,0.07)', border: '1px solid rgba(109,191,126,0.2)', color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>📈 Growth Tools</span>
          </Link>
          <Link to={createPageUrl('CommunitySettings')} style={{ textDecoration: 'none' }}>
            <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>⚙️ Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
