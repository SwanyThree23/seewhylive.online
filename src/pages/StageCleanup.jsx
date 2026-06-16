import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Layers, Clock } from 'lucide-react';
import { toast } from 'sonner';
import AnalyticsOverview from '../components/dashboard/AnalyticsOverview';
import SpotlightBanner from '../components/community/SpotlightBanner';
import BitratePresets from '../components/streaming/BitratePresets';
import StreamingPresets from '../components/streaming/StreamingPresets';
import GreenroomQueue from '../components/streaming/GreenroomQueue';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';
import AIModeration from '../components/live/AIModeration';
import GreenroomWaitlistPanel from '../components/greenroom/GreenroomWaitlistPanel';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const AMBER = '#D4854A';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const AGE_OPTIONS = [
  { label: '1 day', days: 1 },
  { label: '3 days', days: 3 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
];

export default function StageCleanupPage() {
  const qc = useQueryClient();
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;
  const { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', user?.id],
    queryFn: () => base44.entities.Community.filter({ owner_id: user?.id }).then(r => r[0] || null),
    enabled: !!user?.id,
  });
  const userCommunityId = userCommunity?.id || null;
  const [ageDays, setAgeDays] = useState(7);
  const [deletedCount, setDeletedCount] = useState(0);

  const { data: stages = [], isLoading, refetch } = useQuery({
    queryKey: ['all-stages'],
    queryFn: () => base44.entities.Stage.list('-created_date', 500),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['all-rooms-cleanup'],
    queryFn: () => base44.entities.Room.list('-created_date', 500),
  });

  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]));
  const cutoff = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);

  const ghostStages = stages.filter(stage => {
    const createdAt = new Date(stage.created_date);
    if (createdAt >= cutoff) return false;
    const room = roomMap[stage.room_id];
    return !room || room.status === 'ended' || !stage.is_active;
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.Stage.delete(id)));
      return ids.length;
    },
    onSuccess: (count) => {
      setDeletedCount(prev => prev + count);
      toast.success(`Deleted ${count} ghost stage${count !== 1 ? 's' : ''}.`);
      qc.invalidateQueries(['all-stages']);
    },
    onError: () => toast.error('Cleanup failed. Please try again.'),
  });

  const getRoomStatus = (roomId) => {
    const room = roomMap[roomId];
    if (!room) return { label: 'Room Deleted', color: '#C0392B' };
    if (room.status === 'ended') return { label: 'Room Ended', color: AMBER };
    return { label: room.status, color: 'rgba(255,255,255,0.5)' };
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 border-b flex items-center justify-between flex-wrap gap-3"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,133,74,0.12)', border: '1px solid rgba(212,133,74,0.2)' }}>
            <Layers className="w-5 h-5" style={{ color: AMBER }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>Stage Cleanup</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Remove ghost and orphaned stages</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black uppercase text-xs"
            style={{ ...T, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            disabled={ghostStages.length === 0 || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(ghostStages.map(s => s.id))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-xs"
            style={{ ...T, background: ghostStages.length === 0 ? 'rgba(192,57,43,0.06)' : 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B', cursor: ghostStages.length === 0 || deleteMutation.isPending ? 'not-allowed' : 'pointer', opacity: ghostStages.length === 0 || deleteMutation.isPending ? 0.5 : 1 }}>
            <Trash2 className="w-3.5 h-3.5" /> Delete All ({ghostStages.length})
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Stages', value: stages.length, icon: Layers, color: GOLD },
            { label: 'Ghost / Orphaned', value: ghostStages.length, icon: AlertTriangle, color: AMBER },
            { label: 'Active Stages', value: stages.filter(s => s.is_active).length, icon: CheckCircle, color: '#6DBF7E' },
            { label: 'Cleaned Up', value: deletedCount, icon: Trash2, color: 'rgba(255,255,255,0.35)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-4 rounded-2xl text-center" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
              <Icon className="w-5 h-5 mx-auto mb-1" style={{ color }} />
              <p className="text-2xl font-black" style={{ color, fontFamily: 'Orbitron, monospace' }}>{value}</p>
              <p className="text-[10px] font-black uppercase mt-0.5" style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Age filter */}
        <div className="p-4 rounded-2xl flex items-center flex-wrap gap-3" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
          <Clock className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
          <span className="text-sm font-black text-white" style={T}>Show stages older than:</span>
          <div className="flex gap-2 flex-wrap">
            {AGE_OPTIONS.map(o => (
              <button key={o.days} onClick={() => setAgeDays(o.days)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-black uppercase"
                style={{ ...T, background: ageDays === o.days ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${ageDays === o.days ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`, color: ageDays === o.days ? GOLD : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                {o.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
            style={{ ...T, background: ghostStages.length > 0 ? 'rgba(212,133,74,0.12)' : 'rgba(109,191,126,0.08)', border: `1px solid ${ghostStages.length > 0 ? 'rgba(212,133,74,0.3)' : 'rgba(109,191,126,0.2)'}`, color: ghostStages.length > 0 ? AMBER : '#6DBF7E' }}>
            {ghostStages.length} ghost stage{ghostStages.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {/* Ghost Stage List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
          </div>
        ) : ghostStages.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
            <CheckCircle className="w-14 h-14 mx-auto mb-3" style={{ color: '#6DBF7E' }} />
            <p className="font-black text-lg text-white" style={T}>All clean!</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>No ghost stages older than {ageDays} day{ageDays !== 1 ? 's' : ''} found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ghostStages.map(stage => {
              const { label, color } = getRoomStatus(stage.room_id);
              const room = roomMap[stage.room_id];
              const ageDays2 = Math.floor((Date.now() - new Date(stage.created_date)) / 86400000);
              return (
                <div key={stage.id} className="p-4 rounded-2xl" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,133,74,0.15)' }}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-black text-sm text-white truncate" style={T}>{stage.name}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase"
                          style={{ ...T, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>{stage.type}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase"
                          style={{ ...T, background: `${color}18`, border: `1px solid ${color}40`, color }}>{label}</span>
                        {!stage.is_active && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase"
                            style={{ ...T, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>Inactive</span>
                        )}
                      </div>
                      <div className="flex gap-4 flex-wrap" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                        <span>Room: {room?.title || 'Deleted'}</span>
                        <span>Created: {new Date(stage.created_date).toLocaleDateString()}</span>
                        <span>Age: {ageDays2}d</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate([stage.id])}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase text-xs shrink-0"
                      style={{ ...T, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)', color: '#C0392B', cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer', opacity: deleteMutation.isPending ? 0.5 : 1 }}>
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnalyticsOverview creatorId={user?.id} timeRange="7d" />
          <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
          <BitratePresets onPresetSelect={() => {}} selectedPreset={null} />
          <StreamingPresets onPresetSelect={() => {}} currentPreset={null} />
          <GreenroomQueue roomId={activeRoomId} hostId={user?.id} onApprove={() => {}} />
          <StreamHealthDashboard isLive={false} />
          <AIModeration roomId={activeRoomId} isHost={true} />
          <GreenroomWaitlistPanel roomId={activeRoomId} currentUser={user} onAdmit={() => {}} />
          <OnlineUsersGrid compact maxVisible={10} />
          <ContentRecommendations />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0 28px' }}>
          {[
            { label: '← Admin Dashboard', href: 'AdminDashboard' },
            { label: '🛡 AI Moderation',  href: 'AIModeration'  },
            { label: '🚦 Infra Ref',      href: 'StreamInfraRef' },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
