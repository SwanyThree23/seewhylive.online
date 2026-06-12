import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Flag, Megaphone, TrendingUp, Users, Crown, Shield, UserX, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import ReferralConfig from '../components/admin/ReferralConfig';
import ReportsManager from '../components/admin/ReportsManager';
import AnnouncementScheduler from '../components/admin/AnnouncementScheduler';
import ChallengeAnalytics from '../components/admin/ChallengeAnalytics';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const GREEN = '#6DBF7E';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TABS = [
  { id: 'analytics',     label: 'Analytics',     icon: TrendingUp },
  { id: 'members',       label: 'Members',        icon: Users },
  { id: 'reports',       label: 'Reports',        icon: Flag },
  { id: 'announcements', label: 'Announcements',  icon: Megaphone },
  { id: 'referrals',     label: 'Referrals',      icon: Shield },
];

const ROLE_CONFIG = {
  owner:  { color: GOLD,    label: 'Owner',  icon: Crown },
  admin:  { color: '#D4854A', label: 'Admin',  icon: Shield },
  member: { color: 'rgba(255,255,255,0.35)', label: 'Member', icon: Users },
};

function MemberRow({ member, currentUserId, onRoleChange, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
  const Icon = cfg.icon;
  const isOwner = member.role === 'owner';
  const isSelf = member.user_id === currentUserId;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-black text-sm"
        style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})`, color: '#fff', ...T }}>
        {(member.display_name || member.user_id || '?').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm text-white truncate" style={T}>{member.display_name || member.username || member.user_id?.slice(0, 8)}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Joined {member.joined_date ? new Date(member.joined_date).toLocaleDateString() : 'recently'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
          style={{ ...T, background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`, color: cfg.color }}>
          <Icon className="w-2.5 h-2.5" /> {cfg.label}
        </span>
        {!isOwner && !isSelf && (
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black"
              style={{ ...T, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
              <ChevronDown className="w-3 h-3" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-50 rounded-xl overflow-hidden shadow-2xl"
                style={{ background: '#0D1022', border: '1px solid rgba(255,255,255,0.1)', minWidth: 140 }}>
                {member.role !== 'admin' && (
                  <button onClick={() => { onRoleChange(member.id, 'admin'); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-black"
                    style={{ ...T, color: '#D4854A', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Promote to Admin
                  </button>
                )}
                {member.role === 'admin' && (
                  <button onClick={() => { onRoleChange(member.id, 'member'); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-black"
                    style={{ ...T, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Demote to Member
                  </button>
                )}
                <button onClick={() => { onRemove(member.id, member.user_id); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-black"
                  style={{ ...T, color: '#C0392B', background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  Remove Member
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MembersTab({ communityId, currentUserId }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const qc = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['community-members-admin', communityId],
    queryFn: () => base44.entities.CommunityMember.filter({ community_id: communityId }, '-joined_date', 200),
    enabled: !!communityId,
  });

  const updateRoleMut = useMutation({
    mutationFn: ({ id, role }) => base44.entities.CommunityMember.update(id, { role }),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries({ queryKey: ['community-members-admin'] }); },
  });

  const removeMut = useMutation({
    mutationFn: (id) => base44.entities.CommunityMember.delete(id),
    onSuccess: () => { toast.success('Member removed'); qc.invalidateQueries({ queryKey: ['community-members-admin'] }); },
  });

  const filtered = members.filter(m => {
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (m.display_name || '').toLowerCase().includes(s) || (m.username || '').toLowerCase().includes(s) || (m.user_id || '').toLowerCase().includes(s);
    }
    return true;
  });

  const ownerCount = members.filter(m => m.role === 'owner').length;
  const adminCount = members.filter(m => m.role === 'admin').length;
  const memberCount = members.filter(m => m.role === 'member').length;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: members.length, color: GOLD },
          { label: 'Admins', value: adminCount, color: '#D4854A' },
          { label: 'Members', value: memberCount, color: GREEN },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-2xl font-black" style={{ fontFamily: 'Orbitron, monospace', color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-black uppercase mt-0.5" style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search members…"
          className="flex-1 bg-transparent text-sm text-white outline-none rounded-xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 150, fontFamily: 'Barlow Condensed, sans-serif' }}
        />
        {['all', 'owner', 'admin', 'member'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className="px-3 py-2 rounded-xl text-[10px] font-black uppercase"
            style={{ ...T, background: roleFilter === r ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${roleFilter === r ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`, color: roleFilter === r ? GOLD : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            {r === 'all' ? `All (${members.length})` : r}
          </button>
        ))}
      </div>

      {/* Member list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full animate-spin" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.08)' }} />
          <p className="font-black text-sm" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No members found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              currentUserId={currentUserId}
              onRoleChange={(id, role) => updateRoleMut.mutate({ id, role })}
              onRemove={(id) => removeMut.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5" style={{ color: GOLD }} />
              <div>
                <h1 className="text-xl font-black text-white leading-none" style={T}>Community Admin</h1>
                {community?.name && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{community.name}</p>}
              </div>
            </div>
            <Link to={createPageUrl('CommunitySettings') + `?id=${communityId}`}>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black uppercase text-[10px]"
                style={{ ...T, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer' }}>
                <Settings className="w-3.5 h-3.5" /> Settings
              </button>
            </Link>
          </div>
          {/* Tab bar */}
          <div className="flex overflow-x-auto scrollbar-hide border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all shrink-0"
                  style={{ ...T, color: active ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: active ? GOLD : 'transparent', background: 'transparent' }}>
                  <Icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {activeTab === 'analytics' && <ChallengeAnalytics communityId={communityId} />}
        {activeTab === 'members' && <MembersTab communityId={communityId} currentUserId={user?.id} />}
        {activeTab === 'reports' && <ReportsManager communityId={communityId} userId={user?.id} />}
        {activeTab === 'announcements' && <AnnouncementScheduler communityId={communityId} userId={user?.id} />}
        {activeTab === 'referrals' && <ReferralConfig communityId={communityId} />}
      </div>
    </div>
  );
}
