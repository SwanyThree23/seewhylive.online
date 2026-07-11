import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Users, Globe, Lock, Plus, X } from 'lucide-react';

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 99, background: checked ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );
}
import { toast } from 'sonner';


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
const inp = { width: '100%', padding: '10px 14px', background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };
const lbl = { display: 'block', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14 };

const CATEGORIES = ['music','gaming','tech','education','business','entertainment','sports','lifestyle','other'];

export default function CreateCommunityPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [rules, setRules] = useState('');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const community = await base44.entities.Community.create(data);
      await base44.entities.CommunityMember.create({ community_id: community.id, user_id: user.id, role: 'owner', joined_at: new Date().toISOString() });
      return community;
    },
    onSuccess: (c) => { toast.success('Community created!'); window.location.href = `/Community?id=${c.id}`; },
    onError: () => toast.error('Failed to create community'),
  });

  const addTag = () => {
    if (tagInput.trim() && tags.length < 5) { setTags([...tags, tagInput.trim()]); setTagInput(''); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !category) { toast.error('Please fill in required fields'); return; }
    createMutation.mutate({ name: name.trim(), description: description.trim(), category, is_public: isPublic, tags, rules: rules.trim(), owner_id: user.id, member_count: 1 });
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

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 24 }}>
            <p className="font-black text-sm mb-4" style={{ color: GOLD, ...T }}>Community Details</p>

            <label style={lbl}>Community Name *</label>
            <input style={inp} placeholder="e.g., Tech Innovators" value={name} onChange={e => setName(e.target.value)} maxLength={50} required />

            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, height: 90, resize: 'none' }} placeholder="What's your community about?" value={description} onChange={e => setDescription(e.target.value)} />

            <label style={lbl}>Category *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: `1px solid ${category === c ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: category === c ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: category === c ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, textTransform: 'capitalize' }}>
                  {c}
                </button>
              ))}
            </div>

            <label style={lbl}>Tags (up to 5)</label>
            <div className="flex gap-2">
              <input style={{ ...inp, flex: 1 }} placeholder="Add a tag…" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} disabled={tags.length >= 5} />
              <button type="button" onClick={addTag} disabled={tags.length >= 5}
                className="px-4 rounded-lg font-black text-xs uppercase"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, cursor: tags.length >= 5 ? 'default' : 'pointer', opacity: tags.length >= 5 ? 0.4 : 1, ...T }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black"
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
                    #{tag}
                    <button type="button" onClick={() => setTags(tags.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}

            <label style={lbl}>Community Rules</label>
            <textarea style={{ ...inp, height: 90, resize: 'none' }} placeholder="Set guidelines for your community…" value={rules} onChange={e => setRules(e.target.value)} />

            {/* Public/Private toggle */}
            <div className="flex items-center justify-between p-4 mt-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3">
                {isPublic ? <Globe className="w-5 h-5" style={{ color: GOLD }} /> : <Lock className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />}
                <div>
                  <p className="font-black text-sm text-white" style={T}>{isPublic ? 'Public' : 'Private'} Community</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{isPublic ? 'Anyone can join' : 'Invite-only access'}</p>
                </div>
              </div>
              <Toggle checked={isPublic} onChange={setIsPublic} />
            </div>

            <div className="flex gap-3 mt-6">
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
          </div>
        </form>
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
