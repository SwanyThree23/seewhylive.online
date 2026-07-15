import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Radio, Mic, Tv, Settings, Swords, Users, Video,
  Zap, BarChart2, Globe, Cpu, Sliders, ChevronRight,
} from 'lucide-react';
import StreamGoals from '../components/live/StreamGoals';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';

const BG    = '#080B18';
const GOLD  = '#D4AF37';
const CRIM  = '#800020';
const T     = { fontFamily: 'Barlow Condensed, sans-serif' };

const TOOLS = [
  {
    label: 'Go Live',
    desc: 'One-click broadcast launch',
    icon: Radio,
    color: '#C0392B',
    page: 'GoLive',
  },
  {
    label: 'Broadcast Studio',
    desc: 'Full compositor + multi-stream',
    icon: Tv,
    color: GOLD,
    page: 'BroadcastStudio',
  },
  {
    label: 'Go Live Studio',
    desc: 'Advanced studio controls',
    icon: Sliders,
    color: '#C9A84C',
    page: 'GoLiveStudio',
  },
  {
    label: 'Live Room',
    desc: 'Video rooms & watch parties',
    icon: Users,
    color: GOLD,
    page: 'LiveRoom',
  },
  {
    label: 'Audio Room',
    desc: 'Stage-style audio broadcast',
    icon: Mic,
    color: '#6DBF7E',
    page: 'AudioRoom',
  },
  {
    label: 'Podcast Studio',
    desc: 'Record & stream podcasts',
    icon: Mic,
    color: '#C9A84C',
    page: 'PodcastStudio',
  },
  {
    label: 'Control Room',
    desc: 'Multi-destination RTMP control',
    icon: Settings,
    color: GOLD,
    page: 'ControlRoom',
  },
  {
    label: 'Hybrid Stream',
    desc: 'WebRTC + RTMP hybrid',
    icon: Zap,
    color: '#D4AF37',
    page: 'HybridStreamRoom',
  },
  {
    label: 'Multi-Stream',
    desc: 'Stream to 10+ platforms',
    icon: Globe,
    color: GOLD,
    page: 'MultiStreamManager',
  },
  {
    label: 'RTMP Server',
    desc: 'Ingest & fanout settings',
    icon: Cpu,
    color: '#C9A84C',
    page: 'RTMPServer',
  },
  {
    label: 'Stream Infra',
    desc: 'Infrastructure & health',
    icon: BarChart2,
    color: GOLD,
    page: 'StreamInfra',
  },
  {
    label: 'PK Battle',
    desc: 'Live battle & compete',
    icon: Swords,
    color: '#C0392B',
    page: 'PKBattlePage',
  },
  {
    label: 'INS Forge',
    desc: 'AI-powered creative studio',
    icon: Video,
    color: '#D4AF37',
    page: 'INSForge',
  },
  {
    label: 'Greenroom',
    desc: 'Pre-flight & warm up',
    icon: Users,
    color: '#6DBF7E',
    page: 'Greenroom',
  },
];

export default function StudioHub() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;

  return (
    <div className="min-h-screen pb-10" style={{ background: BG, ...T }}>

      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.12)', backdropFilter: 'blur(12px)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
          <Radio className="w-4 h-4" style={{ color: GOLD }} />
        </div>
        <div>
          <h1 className="font-black text-lg text-white leading-none" style={T}>Studio Hub</h1>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>All your broadcasting tools</p>
        </div>
        {activeRoomId && (
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.4)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#C0392B' }} />
            <span className="text-[10px] font-black uppercase" style={{ color: '#C0392B', ...T }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Active stream banner */}
      {activeRoom && (
        <div className="mx-4 mt-4 p-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: '#C0392B' }} />
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-white leading-none truncate" style={T}>{activeRoom.title || 'Live Stream'}</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>{activeRoom.viewer_count || 0} watching</p>
          </div>
          <Link to={`/LiveRoom?id=${activeRoomId}`} style={{ textDecoration: 'none' }}>
            <button className="px-3 py-1.5 rounded-lg font-black text-[11px] uppercase transition-all hover:brightness-110"
              style={{ background: 'rgba(192,57,43,0.25)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.4)', ...T }}>
              Return <ChevronRight className="inline w-3 h-3" />
            </button>
          </Link>
        </div>
      )}

      {/* Tool grid */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-5" style={{ maxWidth: 640, margin: '0 auto' }}>
        {TOOLS.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.page}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link to={createPageUrl(tool.page)} style={{ textDecoration: 'none' }}>
                <div
                  className="rounded-2xl p-4 flex flex-col gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-[0.97]"
                  style={{ background: 'rgba(13,10,28,0.9)', border: `1px solid ${tool.color}25` }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${tool.color}18`, border: `1px solid ${tool.color}35` }}>
                    <Icon className="w-5 h-5" style={{ color: tool.color }} />
                  </div>
                  <div>
                    <p className="font-black text-sm text-white leading-snug" style={T}>{tool.label}</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>{tool.desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Engagement widgets */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640, margin: '0 auto' }}>
        <StreamGoals isHost={true} />
        <MilestoneAlerts userId={user?.id} roomId={activeRoomId} />
        <SwanAIRecommendations roomId={activeRoomId} currentLayout="studio" viewerCount={0} />
        <OnlineUsersGrid compact maxVisible={8} />
      </div>
    </div>
  );
}
