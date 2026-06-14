import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Swords } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const PANEL = '#0F0B1A';
const BORDER = 'rgba(212,175,55,0.18)';

const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'rgba(17,8,34,0.85)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'Barlow Condensed, sans-serif',
};

const selectStyle = {
  width: '100%', padding: '10px 14px', background: 'rgba(17,8,34,0.85)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

export default function PKInviteModal({ isOpen, onClose, creators }) {
  const [selectedChallenger, setSelectedChallenger] = useState(null);
  const [duration, setDuration] = useState('180');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!selectedChallenger || !title) {
      toast.error('Fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.PKBattle.create({
        creator_id: user.id,
        creator_name: user.full_name,
        challenger_id: selectedChallenger,
        title,
        duration_seconds: parseInt(duration),
        status: 'pending',
      });
      toast.success('Battle invite sent!');
      onClose();
    } catch (error) {
      toast.error('Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
        background: 'rgba(0,0,0,0.8)',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ borderRadius: 12, padding: 24, maxWidth: 448, width: '100%', background: PANEL, border: `1px solid ${BORDER}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5" style={{ color: '#C0392B' }} />
            <h2 className="text-lg font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Start PK Battle
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Battle title */}
          <div>
            <label className="text-xs font-bold text-white/60 block mb-1">Battle Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Ultimate Showdown"
              style={inputStyle}
            />
          </div>

          {/* Challenger selection */}
          <div>
            <label className="text-xs font-bold text-white/60 block mb-2">Challenge</label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {creators?.map((creator) => (
                <motion.button
                  key={creator.id}
                  onClick={() => setSelectedChallenger(creator.id)}
                  className="w-full p-2 rounded text-left text-xs transition-all"
                  style={{
                    background: selectedChallenger === creator.id ? `${G}20` : 'rgba(255,255,255,0.03)',
                    border: selectedChallenger === creator.id ? `1px solid ${G}` : `1px solid ${BORDER}`,
                    color: selectedChallenger === creator.id ? G : '#fff',
                  }}
                >
                  <p className="font-bold">{creator.name}</p>
                  <p className="text-[10px] opacity-50">{creator.follower_count || 0} followers</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-bold text-white/60 block mb-1">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={selectStyle}
            >
              <option value="60">1 minute</option>
              <option value="180">3 minutes</option>
              <option value="300">5 minutes</option>
              <option value="600">10 minutes</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              style={{
                flex: 1, fontSize: 12, fontWeight: 700, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={loading}
              style={{
                flex: 1, fontSize: 12, fontWeight: 700, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                background: G, color: '#000', border: 'none', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
