import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Users, Globe, Lock, Plus, X, Image, UserCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import SpotlightBanner from '../components/community/SpotlightBanner';
import AnnouncementFeed from '../components/community/AnnouncementFeed';
import ReferralProgram from '../components/community/ReferralProgram';
import DiscussionFeed from '../components/community/DiscussionFeed';
import ModerationActionModal from '../components/moderation/ModerationActionModal';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import StreamGoals from '../components/live/StreamGoals';

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 99, background: checked ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );
}


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const inp = { width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };
const lbl = { display: 'block', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14 };

const CATEGORIES = [
  'Gaming', 'Music', 'Talk Show', 'Fitness', 'Art', 'Cooking',
  'Tech', 'Sports', 'Education', 'Entertainment', 'News', 'Other',
];

const TAG_OPTIONS = [
  '18+', 'Family Friendly', 'Competitive', 'Chill', 'Educational',
  'Roleplay', 'Charity', 'Amateur', 'Professional', 'Local',
];

export default function CreateCommunityPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [rules, setRules] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const community = await base44.entities.Community.create(data);
      await base44.entities.CommunityMember.create({ community_id: community.id, user_id: user.id, role: 'owner', joined_at: new Date().toISOString() });
      await base44.entities.Activity.create({
        user_id: user.id,
        type: 'community_joined',
        title: `Created community: ${data.name}`,
        description: data.description || '',
      }).catch(() => {});
      return community;
    },
    onSuccess: (c) => { toast.success('Community created!'); window.location.href = `/Community?id=${c.id}`; },
    onError: () => toast.error('Failed to create community'),
  });

  const addTag = (tag) => {
    const t = tag || tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 8) { setTags([...tags, t]); setTagInput(''); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !category) { toast.error('Please fill in required fields'); return; }
    createMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      category,
      is_public: isPublic,
      require_approval: requireApproval,
      tags,
      rules: rules.trim(),
      owner_id: user?.id,
      member_count: 1,
      banner_url: bannerUrl.trim() || null,
      avatar_url: avatarUrl.trim() || null,
    });
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <Users className="w-5 h-5" style={{ color: GOLD }} />
        <div>
          <h1 className="text-xl font-black text-white leading-none" style={T}>Create Community</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Build your own space for like-minded people</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Preview card */}
        {(name || bannerUrl || avatarUrl) && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="h-20 flex items-center justify-center relative"
              style={{ background: bannerUrl ? `url(${bannerUrl}) center/cover` : 'linear-gradient(135deg, rgba(128,0,32,0.4), rgba(212,175,55,0.15))' }}>
              {!bannerUrl && <p className="text-[11px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>Banner Preview</p>}
              <div className="absolute bottom-0 left-4 translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: avatarUrl ? `url(${avatarUrl}) center/cover` : CRIMSON, border: '2px solid #080B18' }}>
                {!avatarUrl && <Users className="w-5 h-5 text-white" />}
              </div>
            </div>
            <div className="pt-8 pb-3 px-4" style={{ background: 'rgba(13,16,34,0.95)' }}>
              <p className="font-black text-sm text-white" style={T}>{name || 'Community Name'}</p>
              {description && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{description.slice(0, 80)}{description.length > 80 ? '…' : ''}</p>}
              <div className="flex items-center gap-2 mt-2">
                {category && <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>{category}</span>}
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{isPublic ? '🌐 Public' : '🔒 Private'}</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic details */}
          <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <p className="font-black text-sm mb-4" style={{ color: GOLD, ...T }}>Community Details</p>

            <label style={lbl}>Community Name *</label>
            <input style={inp} placeholder="e.g., Tech Innovators" value={name} onChange={e => setName(e.target.value)} maxLength={50} required />

            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, height: 80, resize: 'none' }} placeholder="What's your community about?" value={description} onChange={e => setDescription(e.target.value)} maxLength={300} />

            <label style={lbl}>Category *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: `1px solid ${category === c ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: category === c ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: category === c ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                  {c}
                </button>
              ))}
            </div>

            <label style={lbl}>Community Rules</label>
            <textarea style={{ ...inp, height: 80, resize: 'none' }} placeholder="Set guidelines for your community…" value={rules} onChange={e => setRules(e.target.value)} maxLength={500} />
          </div>

          {/* Media */}
          <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <p className="font-black text-sm mb-4 flex items-center gap-2" style={{ color: GOLD, ...T }}><Image className="w-4 h-4" /> Branding</p>

            <label style={lbl}><UserCircle className="w-3 h-3 inline mr-1" />Avatar URL</label>
            <input style={inp} placeholder="https://… (image URL for community avatar)" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />

            <label style={lbl}><Image className="w-3 h-3 inline mr-1" />Banner URL</label>
            <input style={inp} placeholder="https://… (image URL for banner, 4:1 ratio)" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} />
          </div>

          {/* Tags */}
          <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <p className="font-black text-sm mb-3" style={{ color: GOLD, ...T }}>Tags <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(up to 8)</span></p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {TAG_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => addTag(opt)} disabled={tags.includes(opt) || tags.length >= 8}
                  style={{ padding: '5px 10px', borderRadius: 99, fontSize: 10, border: `1px solid ${tags.includes(opt) ? '#D4AF37' : 'rgba(255,255,255,0.08)'}`, background: tags.includes(opt) ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)', color: tags.includes(opt) ? GOLD : 'rgba(255,255,255,0.4)', cursor: tags.includes(opt) || tags.length >= 8 ? 'default' : 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, opacity: !tags.includes(opt) && tags.length >= 8 ? 0.4 : 1 }}>
                  {opt}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input style={{ ...inp, flex: 1 }} placeholder="Custom tag…" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} disabled={tags.length >= 8} />
              <button type="button" onClick={() => addTag()} disabled={!tagInput.trim() || tags.length >= 8}
                className="px-4 rounded-lg font-black text-xs uppercase"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, cursor: tags.length >= 8 ? 'default' : 'pointer', opacity: tags.length >= 8 ? 0.4 : 1, ...T }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black"
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
                    #{tag}
                    <button type="button" onClick={() => setTags(tags.filter((_, j) => j !== i))} style={{ lineHeight: 0 }}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Access controls */}
          <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <p className="font-black text-sm mb-4 flex items-center gap-2" style={{ color: GOLD, ...T }}><ShieldCheck className="w-4 h-4" /> Access & Privacy</p>

            {/* Public/Private toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl mb-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3">
                {isPublic ? <Globe className="w-4 h-4" style={{ color: GOLD }} /> : <Lock className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />}
                <div>
                  <p className="font-black text-sm text-white" style={T}>{isPublic ? 'Public' : 'Private'} Community</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{isPublic ? 'Anyone can find and join' : 'Invite-only access'}</p>
                </div>
              </div>
              <Toggle checked={isPublic} onChange={setIsPublic} />
            </div>

            {/* Require approval */}
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4" style={{ color: requireApproval ? '#6DBF7E' : 'rgba(255,255,255,0.3)' }} />
                <div>
                  <p className="font-black text-sm text-white" style={T}>Require Approval</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Manually approve join requests</p>
                </div>
              </div>
              <Toggle checked={requireApproval} onChange={setRequireApproval} />
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => window.history.back()}
              className="flex-1 py-3 rounded-xl font-black uppercase text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', ...T }}>
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending}
              className="flex-1 py-3 rounded-xl font-black uppercase text-sm"
              style={{ background: createMutation.isPending ? 'rgba(128,0,32,0.3)' : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: createMutation.isPending ? 'rgba(255,255,255,0.4)' : '#000', cursor: createMutation.isPending ? 'default' : 'pointer', ...T }}>
              {createMutation.isPending ? 'Creating…' : '+ Create Community'}
            </button>
          </div>
        </form>

        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SpotlightBanner communityId={null} isAdmin={false} />
          <AnnouncementFeed communityId={null} />
          <ReferralProgram communityId={null} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0 28px' }}>
          <Link to={createPageUrl('Communities')} style={{ textDecoration: 'none' }}>
            <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer' }}>← All Communities</span>
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20 }}>
          <DiscussionFeed communityId="new" />
          <ModerationActionModal isOpen={false} onClose={() => {}} targetUser={null} roomId={null} communityId={null} moderatorId={null} />
          <OnlineUsersGrid compact maxVisible={12} />
          <ContentRecommendations />
          <CollaborationMatcher />
          <ChallengeLeaderboard challengeId={null} />
        </div>
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={null} />
      <BackgroundCustomizer />
    </div>
  );
}
