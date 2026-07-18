import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, Eye, TrendingUp, Users, Play, Zap } from 'lucide-react';
import { toast } from 'sonner';

const GOLD   = '#C9A84C';
const BURG   = '#6B1F2A';
const OBS    = '#07050A';
const DIM    = 'rgba(255,255,255,0.4)';

function engagementScore(clip) {
  return (clip.view_count || 0) + (clip.share_count || 0) * 5 + (clip.like_count || 0) * 3;
}

function MomentCard({ clip, currentUserId, onLike }) {
  const dur = clip.duration_seconds || 30;
  const minutes = Math.floor(dur / 60);
  const seconds = String(dur % 60).padStart(2, '0');
  const liked = clip.liked_by?.includes?.(currentUserId);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(201,168,76,0.12)',
        background: 'rgba(13,6,24,0.92)',
        cursor: 'pointer',
      }}
    >
      {/* Thumbnail area */}
      <div
        style={{
          height: 140,
          background: `linear-gradient(135deg, ${BURG}55, ${OBS})`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {clip.thumbnail_url ? (
          <img src={clip.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
        ) : (
          <Play style={{ width: 36, height: 36, color: 'rgba(255,255,255,0.3)' }} />
        )}
        {/* Duration badge */}
        <div style={{
          position: 'absolute', bottom: 6, right: 8,
          padding: '2px 7px', borderRadius: 4,
          background: 'rgba(0,0,0,0.8)',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: 11, color: 'rgba(255,255,255,0.85)',
        }}>
          {minutes}:{seconds}
        </div>
        {/* Hype badge */}
        {engagementScore(clip) > 50 && (
          <div style={{
            position: 'absolute', top: 6, left: 8,
            padding: '2px 8px', borderRadius: 4,
            background: 'rgba(201,168,76,0.15)',
            border: '1px solid rgba(201,168,76,0.35)',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: 10, color: GOLD, letterSpacing: 1,
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Zap style={{ width: 10, height: 10 }} /> TRENDING
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '10px 12px 8px' }}>
        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: 14, fontWeight: 700,
          color: 'rgba(255,255,255,0.9)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 3,
        }}>
          {clip.title || 'Untitled Moment'}
        </div>
        {clip.creator_name && (
          <div style={{ fontSize: 11, color: DIM, marginBottom: 7 }}>{clip.creator_name}</div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: DIM }}>
            <Eye style={{ width: 11, height: 11 }} /> {(clip.view_count || 0).toLocaleString()}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: DIM }}>
            <Share2 style={{ width: 11, height: 11 }} /> {clip.share_count || 0}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onLike(clip)}
            style={{
              flex: 1, padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
              background: liked ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
              border: liked ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(255,255,255,0.08)',
              color: liked ? GOLD : DIM,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, letterSpacing: 0.5,
              transition: 'all 0.15s',
            }}
          >
            <Heart style={{ width: 12, height: 12, fill: liked ? GOLD : 'none' }} />
            {clip.like_count || 0}
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(clip.clip_url || window.location.href).then(() => toast.success('Link copied!')).catch(() => {}); }}
            style={{
              padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: DIM, display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11,
            }}
          >
            <Share2 style={{ width: 12, height: 12 }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * MomentsFeed — clip discovery with Following and Trending tabs.
 * Props: { currentUserId, followingIds }
 */
export default function MomentsFeed({ currentUserId, followingIds = [] }) {
  const [mode, setMode] = useState('trending'); // 'trending' | 'following'
  const qc = useQueryClient();

  const { data: allClips = [], isLoading } = useQuery({
    queryKey: ['moments-all'],
    queryFn: () => base44.entities.StreamClip.list('-created_date', 80),
    refetchInterval: 30000,
  });

  // Atomic like via optimistic update + RPC
  const likeMutation = useMutation({
    mutationFn: async (clip) => {
      const alreadyLiked = clip.liked_by?.includes?.(currentUserId);
      const newLikedBy = alreadyLiked
        ? (clip.liked_by || []).filter(id => id !== currentUserId)
        : [...(clip.liked_by || []), currentUserId];
      const delta = alreadyLiked ? -1 : 1;
      return base44.entities.StreamClip.update(clip.id, {
        liked_by: newLikedBy,
        like_count: Math.max(0, (clip.like_count || 0) + delta),
      });
    },
    onMutate: async (clip) => {
      await qc.cancelQueries({ queryKey: ['moments-all'] });
      const prev = qc.getQueryData(['moments-all']);
      const alreadyLiked = clip.liked_by?.includes?.(currentUserId);
      qc.setQueryData(['moments-all'], (old) =>
        (old || []).map(c => c.id !== clip.id ? c : {
          ...c,
          liked_by: alreadyLiked ? (c.liked_by || []).filter(id => id !== currentUserId) : [...(c.liked_by || []), currentUserId],
          like_count: Math.max(0, (c.like_count || 0) + (alreadyLiked ? -1 : 1)),
        })
      );
      return { prev };
    },
    onError: (_err, _clip, ctx) => {
      qc.setQueryData(['moments-all'], ctx?.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['moments-all'] }),
  });

  const sorted = useCallback(() => {
    if (mode === 'following') {
      return allClips
        .filter(c => followingIds.includes(c.creator_id))
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
    // Trending: engagement score descending
    return allClips
      .slice()
      .sort((a, b) => engagementScore(b) - engagementScore(a));
  }, [allClips, mode, followingIds]);

  const clips = sorted();

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { key: 'trending', label: 'Trending', icon: TrendingUp },
          { key: 'following', label: 'Following', icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              padding: '6px 16px',
              borderRadius: 8, cursor: 'pointer',
              background: mode === key ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
              border: mode === key ? `1px solid rgba(201,168,76,0.4)` : '1px solid rgba(255,255,255,0.08)',
              color: mode === key ? GOLD : DIM,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 12, fontWeight: 700, letterSpacing: 1,
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
          >
            <Icon style={{ width: 13, height: 13 }} />
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: DIM, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13 }}>
          Loading moments…
        </div>
      ) : clips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: DIM, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13 }}>
          {mode === 'following' ? 'No moments from creators you follow yet.' : 'No moments yet — be the first to clip!'}
        </div>
      ) : (
        <motion.div
          layout
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}
        >
          <AnimatePresence mode="popLayout">
            {clips.map(clip => (
              <MomentCard
                key={clip.id}
                clip={clip}
                currentUserId={currentUserId}
                onLike={(c) => likeMutation.mutate(c)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
