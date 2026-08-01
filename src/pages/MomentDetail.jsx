import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Share2, Play, ArrowLeft, Radio } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const BG   = '#080B18';

export default function MomentDetail() {
  const { id } = useParams();

  const { data: clip, isLoading } = useQuery({
    queryKey: ['moment', id],
    queryFn: () => base44.entities.StreamClip.get(id),
    enabled: !!id,
  });

  const { data: room } = useQuery({
    queryKey: ['moment-room', clip?.room_id],
    queryFn: () => base44.entities.WatchParty.filter({ id: clip.room_id }).then(r => r[0]),
    enabled: !!clip?.room_id,
  });

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: clip?.title || 'Moment', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success('Link copied!')).catch(() => {});
    }
  }

  const dur = clip?.duration_seconds || Math.max(0, (clip?.end_timestamp_seconds || 30) - (clip?.start_timestamp_seconds || 0));
  const durStr = `${Math.floor(dur / 60)}:${String(Math.floor(dur % 60)).padStart(2, '0')}`;
  const isLive = room?.status === 'live';

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: `3px solid rgba(212,175,55,0.2)`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  if (!clip) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18 }}>Moment not found</p>
        <Link to="/" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14 }}>← Go Home</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'Barlow Condensed, sans-serif', color: '#fff', maxWidth: 480, margin: '0 auto', padding: '0 0 80px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.5)' }}>
          <ArrowLeft style={{ width: 20, height: 20 }} />
        </button>
        <span style={{ flex: 1, fontWeight: 900, fontSize: 16, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Moment</span>
        <button onClick={handleShare} style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>
          <Share2 style={{ width: 13, height: 13 }} /> Share
        </button>
      </div>

      {/* Thumbnail / placeholder */}
      <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a0510, #080B18)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {clip.thumbnail_url ? (
          <img src={clip.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
        ) : (
          <Play style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.15)' }} />
        )}
        {/* Duration */}
        <div style={{ position: 'absolute', bottom: 10, right: 12, padding: '3px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.8)', fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.04em' }}>
          {durStr}
        </div>
      </div>

      {/* Clip info */}
      <div style={{ padding: '16px 16px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '0.01em', lineHeight: 1.2 }}>{clip.title || 'Untitled Moment'}</h1>
        {clip.creator_name && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>by {clip.creator_name}</p>
        )}

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: `${dur}s clip`, color: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.25)', text: GOLD },
            { label: `${clip.view_count || 0} views`, color: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.5)' },
            { label: `${clip.share_count || 0} shares`, color: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.5)' },
          ].map(p => (
            <span key={p.label} style={{ padding: '4px 10px', borderRadius: 20, background: p.color, border: `1px solid ${p.border}`, fontSize: 12, color: p.text, fontWeight: 700, letterSpacing: '0.05em' }}>{p.label}</span>
          ))}
        </div>

        {/* Source room CTA */}
        {room && (
          <Link
            to={`/LiveRoom?id=${room.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', marginBottom: 16 }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #800020, #3d0010)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Radio style={{ width: 16, height: 16, color: GOLD }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.title || 'Live Room'}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: isLive ? '#C0392B' : 'rgba(255,255,255,0.3)' }}>{isLive ? '🔴 LIVE NOW' : 'View room'}</p>
            </div>
            <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>›</span>
          </Link>
        )}

        {/* Share CTA */}
        <button
          onClick={handleShare}
          style={{ width: '100%', padding: '14px', borderRadius: 12, background: `linear-gradient(90deg, #800020, #D4AF37)`, border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 15, color: '#000', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Share2 style={{ width: 16, height: 16 }} />
          Share This Moment
        </button>
      </div>
    </div>
  );
}
