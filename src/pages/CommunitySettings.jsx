import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings } from 'lucide-react';

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 99, background: checked ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );
}
import { toast } from 'sonner';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const inp = { width: '100%', padding: '10px 14px', background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };
const lbl = { display: 'block', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14 };

function Section({ title, desc, children }) {
  return (
    <div style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <p className="font-black text-sm text-white" style={T}>{title}</p>
      {desc && <p className="text-[11px] mt-0.5 mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>}
      {children}
    </div>
  );
}

export default function CommunitySettingsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(c => c[0]),
    enabled: !!communityId,
  });

  React.useEffect(() => {
    if (community) { setName(community.name || ''); setDescription(community.description || ''); setRules(community.rules || ''); setIsPublic(community.is_public ?? true); }
  }, [community]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Community.update(communityId, data),
    onSuccess: () => { toast.success('Community updated!'); queryClient.invalidateQueries(['community']); },
  });

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <Settings className="w-5 h-5" style={{ color: GOLD }} />
        <h1 className="text-xl font-black text-white" style={T}>Community Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Section title="Basic Information" desc="Update your community details">
          <label style={lbl}>Name</label>
          <input style={inp} value={name} onChange={e => setName(e.target.value)} />
          <label style={lbl}>Description</label>
          <textarea style={{ ...inp, height: 80, resize: 'none' }} value={description} onChange={e => setDescription(e.target.value)} />
          <label style={lbl}>Rules</label>
          <textarea style={{ ...inp, height: 96, resize: 'none' }} value={rules} onChange={e => setRules(e.target.value)} />
        </Section>

        <Section title="Privacy" desc="Control who can join">
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="font-black text-sm text-white" style={T}>Public Community</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Anyone can join</p>
            </div>
            <Toggle checked={isPublic} onChange={setIsPublic} />
          </div>
        </Section>

        <button onClick={() => updateMutation.mutate({ name, description, rules, is_public: isPublic })}
          disabled={updateMutation.isPending}
          className="w-full py-3 rounded-xl font-black uppercase text-sm"
          style={{ background: updateMutation.isPending ? 'rgba(128,0,32,0.3)' : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: updateMutation.isPending ? 'rgba(255,255,255,0.4)' : '#000', cursor: updateMutation.isPending ? 'default' : 'pointer', ...T }}>
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
