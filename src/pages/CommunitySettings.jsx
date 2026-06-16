import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Users, Copy, Check, Image, Tag, Lock, Globe, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import SpotlightBanner from '../components/community/SpotlightBanner';
import DiscussionFeed from '../components/community/DiscussionFeed';
import ReferralProgram from '../components/community/ReferralProgram';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import AnnouncementFeed from '../components/community/AnnouncementFeed';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import PollCard from '../components/community/PollCard';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ShareToSocial from '../components/social/ShareToSocial';

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 99, background: checked ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );
}

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const inp = { width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };
const lbl = { display: 'block', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14 };

function Section({ title, desc, icon: Icon, accent, children }) {
  return (
    <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4" style={{ color: accent || GOLD }} />}
        <p className="font-black text-sm text-white" style={T}>{title}</p>
      </div>
      {desc && <p className="text-[11px] mt-0.5 mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>}
      {children}
    </div>
  );
}

const CATEGORIES = [
  'Gaming', 'Music', 'Talk Show', 'Fitness', 'Art', 'Cooking',
  'Tech', 'Sports', 'Education', 'Entertainment', 'News', 'Other',
];

const TAG_OPTIONS = [
  '18+', 'Family Friendly', 'Competitive', 'Chill', 'Educational',
  'Roleplay', 'Charity', 'Amateur', 'Professional', 'Local',
];

export default function CommunitySettingsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [bannerUrl, setBannerUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showDanger, setShowDanger] = useState(false);

  const { data: community, isLoading } = useQuery({
    queryKey: ['community-settings', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(c => c[0]),
    enabled: !!communityId,
  });

  const { data: memberCount = 0 } = useQuery({
    queryKey: ['community-member-count', communityId],
    queryFn: async () => {
      const members = await base44.entities.CommunityMember.filter({ community_id: communityId });
      return members?.length || 0;
    },
    enabled: !!communityId,
  });

  useEffect(() => {
    if (community) {
      setName(community.name || '');
      setDescription(community.description || '');
      setRules(community.rules || '');
      setIsPublic(community.is_public ?? true);
      setRequireApproval(community.require_approval ?? false);
      setCategory(community.category || '');
      setTags(community.tags || []);
      setBannerUrl(community.banner_url || '');
      setAvatarUrl(community.avatar_url || '');
    }
  }, [community]);

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Community.update(communityId, data),
    onSuccess: () => {
      toast.success('Community settings saved!');
      queryClient.invalidateQueries({ queryKey: ['community-settings'] });
      queryClient.invalidateQueries({ queryKey: ['search-communities'] });
      if (currentUser?.id) {
        base44.entities.Activity.create({
          user_id: currentUser.id,
          type: 'milestone',
          title: `Updated community settings: ${community?.name || 'Community'}`,
        }).catch(() => {});
      }
    },
  });

  const handleSave = () => {
    if (!name.trim()) { toast.error('Community name is required'); return; }
    updateMutation.mutate({ name, description, rules, is_public: isPublic, require_approval: requireApproval, category, tags, banner_url: bannerUrl, avatar_url: avatarUrl });
  };

  const toggleTag = (tag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}${createPageUrl('Community')}?id=${communityId}`;
    navigator.clipboard.writeText(link);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
    toast.success('Invite link copied!');
  };

  if (!communityId) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <p className="text-white/40" style={T}>No community selected</p>
    </div>
  );

  return (
    <div className="min-h-screen pb-16" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('CommunityAdmin') + `?id=${communityId}`} className="opacity-40 hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <Settings className="w-5 h-5" style={{ color: GOLD }} />
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>Community Settings</h1>
            {community?.name && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{community.name} · {memberCount} members</p>}
          </div>
        </div>
        <button onClick={handleSave} disabled={updateMutation.isPending}
          className="px-4 py-2 rounded-xl font-black uppercase text-xs"
          style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer', ...T, opacity: updateMutation.isPending ? 0.6 : 1 }}>
          {updateMutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-0">
        {/* Basic Info */}
        <Section title="Basic Information" desc="Name, description, and rules visible to all members" icon={Settings}>
          <label style={lbl}>Community Name *</label>
          <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="My Awesome Community" maxLength={60} />
          <div className="flex justify-end mt-1">
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{name.length}/60</span>
          </div>

          <label style={lbl}>Description</label>
          <textarea style={{ ...inp, height: 80, resize: 'none' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this community about?" maxLength={500} />

          <label style={lbl}>Community Rules</label>
          <textarea style={{ ...inp, height: 96, resize: 'none' }} value={rules} onChange={e => setRules(e.target.value)} placeholder="1. Be respectful&#10;2. No spam&#10;3. Stay on topic" />

          <label style={lbl}>Category</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat === category ? '' : cat)}
                className="px-3 py-1 rounded-full text-[11px] font-black transition-all"
                style={{ ...T, border: `1px solid ${category === cat ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: category === cat ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: category === cat ? GOLD : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                {cat}
              </button>
            ))}
          </div>

          <label style={lbl}>Tags</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {TAG_OPTIONS.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className="px-3 py-1 rounded-full text-[11px] font-black transition-all"
                style={{ ...T, border: `1px solid ${tags.includes(tag) ? '#6DBF7E' : 'rgba(255,255,255,0.1)'}`, background: tags.includes(tag) ? 'rgba(109,191,126,0.1)' : 'rgba(255,255,255,0.04)', color: tags.includes(tag) ? '#6DBF7E' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <Tag className="w-2.5 h-2.5 inline mr-1" />{tag}
              </button>
            ))}
          </div>
        </Section>

        {/* Media */}
        <Section title="Media & Branding" desc="Banner and avatar images for your community page" icon={Image}>
          <label style={lbl}>Banner Image URL</label>
          <input style={inp} value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://..." />
          {bannerUrl && (
            <div className="mt-2 rounded-lg overflow-hidden" style={{ height: 80 }}>
              <img src={bannerUrl} alt="banner preview" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
            </div>
          )}
          <label style={lbl}>Avatar / Icon URL</label>
          <div className="flex items-center gap-3">
            <input style={{ ...inp, flex: 1 }} value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
            {avatarUrl && (
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ border: '2px solid rgba(212,175,55,0.3)' }}>
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
              </div>
            )}
          </div>
        </Section>

        {/* Privacy */}
        <Section title="Privacy & Access" desc="Control who can see and join your community" icon={Lock} accent="#D4854A">
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" style={{ color: isPublic ? '#6DBF7E' : 'rgba(255,255,255,0.3)' }} />
                  <p className="font-black text-sm text-white" style={T}>Public Community</p>
                </div>
                <p className="text-xs mt-0.5 ml-5" style={{ color: 'rgba(255,255,255,0.35)' }}>Visible in search and accessible to anyone</p>
              </div>
              <Toggle checked={isPublic} onChange={setIsPublic} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" style={{ color: requireApproval ? GOLD : 'rgba(255,255,255,0.3)' }} />
                  <p className="font-black text-sm text-white" style={T}>Require Approval</p>
                </div>
                <p className="text-xs mt-0.5 ml-5" style={{ color: 'rgba(255,255,255,0.35)' }}>New members must be approved by an admin</p>
              </div>
              <Toggle checked={requireApproval} onChange={setRequireApproval} />
            </div>
          </div>
        </Section>

        {/* Invite Link */}
        <Section title="Invite Link" desc="Share this link to invite people directly to your community" icon={Users}>
          <div className="flex gap-2 mt-2">
            <input
              readOnly
              value={`${window.location.origin}${createPageUrl('Community')}?id=${communityId}`}
              style={{ ...inp, flex: 1, fontSize: 11, color: GOLD, fontFamily: 'monospace' }}
            />
            <button onClick={copyInviteLink}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-black uppercase text-xs shrink-0"
              style={{ ...T, background: copiedInvite ? 'rgba(109,191,126,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copiedInvite ? 'rgba(109,191,126,0.3)' : 'rgba(255,255,255,0.12)'}`, color: copiedInvite ? '#6DBF7E' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              {copiedInvite ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
        </Section>

        {/* Save Button */}
        <button onClick={handleSave} disabled={updateMutation.isPending}
          className="w-full py-3 rounded-xl font-black uppercase text-sm"
          style={{ background: updateMutation.isPending ? 'rgba(128,0,32,0.3)' : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: updateMutation.isPending ? 'rgba(255,255,255,0.4)' : '#000', cursor: updateMutation.isPending ? 'default' : 'pointer', ...T }}>
          {updateMutation.isPending ? 'Saving Changes…' : 'Save Community Settings'}
        </button>

        {/* Danger Zone */}
        <div className="mt-6 rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(128,0,32,0.3)' }}>
          <button onClick={() => setShowDanger(!showDanger)}
            className="flex items-center gap-2 w-full text-left"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: CRIMSON }} />
            <p className="font-black text-sm" style={{ color: CRIMSON, ...T }}>Danger Zone</p>
          </button>
          {showDanger && (
            <div className="mt-4 space-y-3">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                These actions are permanent and cannot be undone. Proceed with caution.
              </p>
              <button
                onClick={() => toast.error('Community deletion is disabled in beta — contact an admin')}
                className="w-full py-2.5 rounded-xl font-black uppercase text-xs"
                style={{ background: 'rgba(128,0,32,0.08)', border: '1px solid rgba(128,0,32,0.3)', color: '#C0392B', cursor: 'pointer', ...T }}>
                Delete Community
              </button>
            </div>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
          <OnlineUsersGrid compact maxVisible={10} />
          <ContentRecommendations />
          <CollaborationMatcher />
          <ShareToSocial content={{ title: 'SeeWhy LIVE', url: window.location.href }} />
        </div>
      </div>
    </div>
  );
}
