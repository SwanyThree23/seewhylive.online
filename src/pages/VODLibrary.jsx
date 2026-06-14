import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Film, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import VODLibraryComponent from '@/components/vod/VODLibrary';
import VODCard from '../components/vod/VODCard';
import RecordingManager from '../components/content/RecordingManager';
import ChapterEditor from '../components/vod/ChapterEditor';
import VODTrimEditor from '../components/vod/VODTrimEditor';
import AIHighlightGenerator from '../components/content/AIHighlightGenerator';
import EmbedPlayer from '../components/streaming/EmbedPlayer';

const G = '#D4AF37';
const BG = '#0A0710';

export default function VODLibraryPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: stats } = useQuery({
    queryKey: ['vodStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { vods: 0, clips: 0, totalViews: 0 };
      const vods = await base44.entities.VODVideo.filter({ creator_id: user.id });
      const clips = await base44.entities.StreamClip.filter({ creator_id: user.id });
      const totalViews = (vods || []).reduce((sum, v) => sum + (v.views || 0), 0) + (clips || []).reduce((sum, c) => sum + (c.view_count || 0), 0);
      return { vods: vods?.length || 0, clips: clips?.length || 0, totalViews };
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <div className="px-4 py-8 md:px-8 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Film className="w-6 h-6" style={{ color: G }} />
            <h1 className="text-3xl font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              VOD Library
            </h1>
          </div>
          <p className="text-white/60">Manage your past streams, clips, and highlights</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: 'VODs', value: stats?.vods || 0, icon: '📹' },
            { label: 'Clips', value: stats?.clips || 0, icon: '✂️' },
            { label: 'Total Views', value: stats?.totalViews || 0, icon: '👁️' },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(212,175,55,0.12)` }}>
              <div className="text-lg mb-1">{stat.icon}</div>
              <p className="text-[10px] text-white/60">{stat.label}</p>
              <p className="text-lg font-black" style={{ color: G }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {user?.id && (
          <div className="mb-8">
            <RecordingManager userId={user.id} />
          </div>
        )}

        {user?.id && <VODLibraryComponent creatorId={user.id} />}

        {/* AI highlight generator for selected content */}
        <div className="mt-8">
          <AIHighlightGenerator recording={null} />
        </div>

        {/* Embed player preview — PPV-aware with embed code generation */}
        {user?.id && (
          <div className="mt-8">
            <p className="text-xs font-black uppercase mb-3" style={{ color: 'rgba(212,175,55,0.5)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
              Embed Player Preview
            </p>
            <EmbedPlayer
              roomId={user.id}
              creatorName={user.full_name || user.email || 'Creator'}
              streamTitle="VOD Preview"
              isLive={false}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 0 28px' }}>
          {[
            { label: '✂️ Clips Library',    href: 'ClipsLibrary'    },
            { label: '📤 Post Video',       href: 'VideoPost'       },
            { label: '🎬 Broadcast Studio', href: 'BroadcastStudio' },
            { label: '👤 Creator Channel',  href: 'CreatorChannel'  },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: G, cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}