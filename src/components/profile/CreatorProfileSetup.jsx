import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import NativeSelect from '@/components/shared/NativeSelect';

const CATEGORIES = ['gaming', 'music', 'education', 'talk', 'fitness', 'cooking', 'art', 'tech', 'other'];

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(17,8,34,0.85)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Barlow Condensed, sans-serif',
};

export default function CreatorProfileSetup({ user, isOpen, onClose }) {
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState(user?.full_name || '');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('other');

  const createProfileMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.CreatorProfile.create({
        user_id: user.id,
        display_name: displayName.trim() || user.full_name,
        bio,
        category,
        subscriber_count: 0,
        follower_count: 0,
        total_hours_streamed: 0,
        is_verified: false,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries(['creatorProfile', user?.id]);
      toast.success('Creator profile created! Welcome to SeeWhy LIVE 🎉');
      onClose();
    },
    onError: () => toast.error('Action failed.'),
  });

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: 480, background: 'rgba(13,6,24,0.98)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Sparkles style={{ width: 20, height: 20, color: '#f59e0b' }} />
            <p style={{ fontWeight: 900, fontSize: 14, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>Set Up Your Creator Profile</p>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            Complete your profile to start streaming, earning, and engaging with your audience.
          </p>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#fff', display: 'block', marginBottom: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>Display Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="How should viewers know you?"
              maxLength={40}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#fff', display: 'block', marginBottom: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Bio <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell your audience about yourself..."
              maxLength={500}
              style={{ ...inputStyle, resize: 'none', minHeight: 80, height: 96 }}
            />
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{bio.length}/500</p>
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#fff', display: 'block', marginBottom: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>Primary Category</label>
            <NativeSelect
              value={category}
              onChange={val => setCategory(val)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              options={CATEGORIES.map(c => ({value: c, label: c.charAt(0).toUpperCase() + c.slice(1)}))}
            />
          </div>

          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: 12, fontSize: 14, color: '#b45309' }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>What you unlock:</p>
            <ul style={{ fontSize: 12, color: '#d97706', paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <li>Public creator profile page</li>
              <li>90/10 revenue split on tips &amp; subscriptions</li>
              <li>VOD library, stream analytics, loyalty rewards</li>
              <li>Stripe Connect for real payouts</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: '10px 0', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              Skip for now
            </button>
            <button
              onClick={() => createProfileMutation.mutate()}
              disabled={createProfileMutation.isPending || !displayName.trim()}
              style={{ flex: 1, padding: '10px 0', background: '#f59e0b', border: 'none', borderRadius: 8, color: '#000', fontSize: 14, fontWeight: 700, cursor: (createProfileMutation.isPending || !displayName.trim()) ? 'not-allowed' : 'pointer', opacity: (createProfileMutation.isPending || !displayName.trim()) ? 0.7 : 1, fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {createProfileMutation.isPending ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}