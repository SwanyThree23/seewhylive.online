import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Switch } from "@/components/ui/switch";
import { Video, Mic, CalendarIcon, Plus, X, Upload, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';


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
const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const inp = { width: '100%', padding: '10px 14px', background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };
const lbl = { display: 'block', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14 };

function Section({ title, children }) {
  return (
    <div style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 20 }}>
      <p className="font-black text-sm mb-4" style={{ color: GOLD, ...T }}>{title}</p>
      {children}
    </div>
  );
}

export default function CreateRoomPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video',
    status: 'live',
    is_public: true,
    max_participants: 50,
    scheduled_start: null,
    tags: [],
    recording_enabled: false,
    community_id: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: communities = [] } = useQuery({
    queryKey: ['myCommunities'],
    queryFn: async () => {
      if (!user) return [];
      const memberships = await base44.entities.CommunityMember.filter({ user_id: user.id });
      const ids = memberships.map(m => m.community_id);
      if (ids.length === 0) return [];
      const all = await base44.entities.Community.list();
      return all.filter(c => ids.includes(c.id));
    },
    enabled: !!user,
  });

  const createRoomMutation = useMutation({
    mutationFn: async (roomData) => {
      const room = await base44.entities.Room.create({
        ...roomData,
        host_id: user.id,
        started_at: roomData.status === 'live' ? new Date().toISOString() : null,
        viewer_count: 0,
      });
      await base44.entities.Stage.create({
        room_id: room.id, name: 'Main Stage', description: 'Primary streaming stage',
        type: 'main', layout: 'grid', is_active: true, max_speakers: 12,
        allow_audience_requests: true, order: 0,
      });
      return room;
    },
    onSuccess: (room) => {
      toast.success('Room created successfully!');
      window.location.href = `/LiveRoom?id=${room.id}`;
    },
    onError: () => toast.error('Failed to create room. Please try again.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) { toast.error('Please enter a room title'); return; }
    createRoomMutation.mutate(formData);
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumbnail(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, thumbnail_url: file_url }));
      toast.success('Thumbnail uploaded!');
    } catch {
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <Radio className="w-5 h-5" style={{ color: GOLD }} />
        <div>
          <h1 className="text-xl font-black text-white leading-none" style={T}>Create a Room</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Set up your live audio/video streaming room</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <Section title="Basic Information">
            <label style={lbl}>Room Title *</label>
            <input style={inp} placeholder="Enter room title…" value={formData.title} onChange={e => set('title', e.target.value)} required />

            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, height: 80, resize: 'none' }} placeholder="What's this room about?" value={formData.description} onChange={e => set('description', e.target.value)} />

            <label style={lbl}>Thumbnail</label>
            {formData.thumbnail_url ? (
              <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                <button type="button" onClick={() => set('thumbnail_url', '')}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full rounded-xl cursor-pointer transition-all"
                style={{ height: 120, border: '2px dashed rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.03)' }}>
                <Upload className="w-8 h-8 mb-2" style={{ color: 'rgba(212,175,55,0.4)' }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{uploadingThumbnail ? 'Uploading…' : 'Click to upload thumbnail'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} disabled={uploadingThumbnail} />
              </label>
            )}

            <label style={lbl}>Tags</label>
            <div className="flex gap-2">
              <input style={{ ...inp, flex: 1 }} placeholder="Add a tag…" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
              <button type="button" onClick={addTag}
                className="px-4 rounded-lg font-black text-xs uppercase flex items-center gap-1"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, ...T }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black"
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
                    {tag}
                    <button type="button" onClick={() => set('tags', formData.tags.filter(t => t !== tag))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* Room Settings */}
          <Section title="Room Settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={lbl}>Room Type</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[{v:'audio',l:'🎙 Audio Only'},{v:'video',l:'📹 Video'},{v:'hybrid',l:'📹🎙 Hybrid'}].map(opt => (
                    <button key={opt.v} type="button" onClick={() => set('type', opt.v)}
                      style={{ padding: '8px 14px', borderRadius: 99, fontSize: 12, border: `1px solid ${formData.type === opt.v ? '#D4AF37' : 'rgba(255,255,255,0.12)'}`, background: formData.type === opt.v ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: formData.type === opt.v ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Start</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[{v:'live',l:'🔴 Start Now'},{v:'scheduled',l:'📅 Schedule'}].map(opt => (
                    <button key={opt.v} type="button" onClick={() => set('status', opt.v)}
                      style={{ padding: '8px 14px', borderRadius: 99, fontSize: 12, border: `1px solid ${formData.status === opt.v ? '#D4AF37' : 'rgba(255,255,255,0.12)'}`, background: formData.status === opt.v ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: formData.status === opt.v ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {formData.status === 'scheduled' && (
                <div className="md:col-span-2">
                  <label style={lbl}>Scheduled Start Time</label>
                  <input type="datetime-local" style={inp}
                    value={formData.scheduled_start ? new Date(formData.scheduled_start).toISOString().slice(0, 16) : ''}
                    onChange={e => set('scheduled_start', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                </div>
              )}

              <div>
                <label style={lbl}>Max Participants on Stage</label>
                <input type="number" style={inp} min="1" max="100" value={formData.max_participants} onChange={e => set('max_participants', parseInt(e.target.value))} />
              </div>

              {communities.length > 0 && (
                <div>
                  <label style={lbl}>Community (Optional)</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[{id:'',name:'None'}, ...communities].map(c => (
                      <button key={c.id} type="button" onClick={() => set('community_id', c.id)}
                        style={{ padding: '8px 14px', borderRadius: 99, fontSize: 12, border: `1px solid ${formData.community_id === c.id ? '#D4AF37' : 'rgba(255,255,255,0.12)'}`, background: formData.community_id === c.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: formData.community_id === c.id ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 mt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {[
                { id: 'is_public', key: 'is_public', label: 'Public Room', desc: 'Anyone can discover and join' },
                { id: 'recording', key: 'recording_enabled', label: 'Enable Recording', desc: 'Save this session for later' },
              ].map(({ id, key, label, desc }) => (
                <div key={id} className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm text-white" style={T}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
                  </div>
                  <Switch id={id} checked={formData[key]} onCheckedChange={v => set(key, v)} />
                </div>
              ))}
            </div>
          </Section>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => window.history.back()}
              className="flex-1 py-3 rounded-xl font-black uppercase text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', ...T }}>
              Cancel
            </button>
            <button type="submit" disabled={createRoomMutation.isPending}
              className="flex-1 py-3 rounded-xl font-black uppercase text-sm"
              style={{ background: createRoomMutation.isPending ? 'rgba(128,0,32,0.3)' : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: createRoomMutation.isPending ? 'rgba(255,255,255,0.4)' : '#000', cursor: createRoomMutation.isPending ? 'default' : 'pointer', ...T }}>
              {createRoomMutation.isPending ? 'Creating…' : formData.status === 'live' ? '🔴 Create & Go Live' : '📅 Schedule Room'}
            </button>
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
