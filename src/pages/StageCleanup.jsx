import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Layers, Clock } from 'lucide-react';
import SelectSheet from '@/components/shared/SelectSheet';
import { toast } from 'sonner';

const AGE_OPTIONS = [
  { label: '1 day', days: 1 },
  { label: '3 days', days: 3 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
];

export default function StageCleanupPage() {
  const qc = useQueryClient();
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
    // Ghost if: room is ended, room doesn't exist, or stage is inactive
    const roomEnded = !room || room.status === 'ended';
    return roomEnded || !stage.is_active;
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.Stage.delete(id)));
      return ids.length;
    },
    onSuccess: (count) => {
      setDeletedCount(prev => prev + count);
      toast.success(`Deleted ${count} ghost stage(s).`);
      qc.invalidateQueries(['all-stages']);
    },
    onError: () => toast.error('Cleanup failed. Please try again.'),
  });

  const handleDeleteOne = (id) => deleteMutation.mutate([id]);
  const handleDeleteAll = () => {
    if (ghostStages.length === 0) return;
    deleteMutation.mutate(ghostStages.map(s => s.id));
  };

  const getRoomStatus = (roomId) => {
    const room = roomMap[roomId];
    if (!room) return { label: 'Room Deleted', color: 'bg-red-100 text-red-700' };
    if (room.status === 'ended') return { label: 'Room Ended', color: 'bg-orange-100 text-orange-700' };
    return { label: room.status, color: 'bg-slate-100 text-slate-600' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-5xl mx-auto px-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Stage Cleanup</h1>
              <p className="text-sm text-muted-foreground">Remove ghost/ended stages to keep the platform tidy</p>
            </div>
          </div>
          <button onClick={() => refetch()} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', fontSize:13, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif' }}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Controls */}
        <div style={{ background:'rgba(8,11,24,0.9)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:16, padding:20 }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Older than</span>
              <SelectSheet
                value={String(ageDays)}
                onChange={function(v) { setAgeDays(Number(v)); }}
                options={AGE_OPTIONS.map(function(o) { return { value: String(o.days), label: o.label }; })}
                style={{ width: 128 }}
              />
            </div>

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'transparent', color:'#ea580c', border:'1px solid #fdba74' }}>
                {ghostStages.length} ghost stage{ghostStages.length !== 1 ? 's' : ''} found
              </span>
              <button
                disabled={ghostStages.length === 0 || deleteMutation.isPending}
                onClick={handleDeleteAll}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, background:'#dc2626', color:'#fff', border:'none', fontSize:13, cursor: ghostStages.length === 0 || deleteMutation.isPending ? 'not-allowed' : 'pointer', opacity: ghostStages.length === 0 || deleteMutation.isPending ? 0.5 : 1, fontFamily:'Barlow Condensed, sans-serif' }}
              >
                <Trash2 className="w-4 h-4" />
                Delete All ({ghostStages.length})
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Stages', value: stages.length, icon: Layers, iconColor: '#2563eb' },
            { label: 'Ghost / Orphaned', value: ghostStages.length, icon: AlertTriangle, iconColor: '#ea580c' },
            { label: 'Active Stages', value: stages.filter(s => s.is_active).length, icon: CheckCircle, iconColor: '#16a34a' },
            { label: 'Cleaned Up', value: deletedCount, icon: Trash2, iconColor: '#64748b' },
          ].map(({ label, value, icon: Icon, iconColor }) => (
            <div key={label} style={{ background:'rgba(8,11,24,0.9)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:16, padding:20 }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>{label}</div>
              <div style={{ fontSize:30, fontWeight:700, display:'flex', alignItems:'center', gap:8, color:'#fff' }}>
                <Icon style={{ width:24, height:24, color: iconColor }} />
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Ghost Stage List */}
        {isLoading ? (
          <div style={{ background:'rgba(8,11,24,0.9)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:16, padding:20 }}>
            <div style={{ padding:'48px 0', textAlign:'center', color:'rgba(255,255,255,0.5)' }}>Loading stages...</div>
          </div>
        ) : ghostStages.length === 0 ? (
          <div style={{ background:'rgba(8,11,24,0.9)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:16, padding:20 }}>
            <div style={{ padding:'64px 0', textAlign:'center' }} className="space-y-3">
              <CheckCircle className="w-14 h-14 mx-auto text-green-500" />
              <p className="text-lg font-semibold">All clean!</p>
              <p className="text-sm text-muted-foreground">No ghost stages older than {ageDays} day{ageDays !== 1 ? 's' : ''} found.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {ghostStages.map(stage => {
              const { label, color } = getRoomStatus(stage.room_id);
              const room = roomMap[stage.room_id];
              return (
                <div key={stage.id} style={{ background:'rgba(8,11,24,0.9)', border:'1px solid rgba(255,165,0,0.15)', borderRadius:16, padding:16 }}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium truncate">{stage.name}</span>
                        <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'transparent', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.3)', textTransform:'capitalize' }}>{stage.type}</span>
                        <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'transparent', color: color.includes('red') ? '#dc2626' : color.includes('orange') ? '#ea580c' : '#64748b', border: color.includes('red') ? '1px solid #dc2626' : color.includes('orange') ? '1px solid #ea580c' : '1px solid #64748b' }}>{label}</span>
                        {!stage.is_active && (
                          <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(100,116,139,0.15)', color:'#64748b', border:'1px solid rgba(100,116,139,0.3)' }}>Inactive</span>
                        )}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>Room: {room?.title || 'Deleted'}</span>
                        <span>Created: {new Date(stage.created_date).toLocaleDateString()}</span>
                        <span>Age: {Math.floor((Date.now() - new Date(stage.created_date)) / 86400000)}d</span>
                      </div>
                    </div>
                    <button
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:8, background:'transparent', color:'#dc2626', border:'1px solid #fca5a5', fontSize:13, cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer', opacity: deleteMutation.isPending ? 0.5 : 1, fontFamily:'Barlow Condensed, sans-serif', flexShrink:0 }}
                      onClick={() => handleDeleteOne(stage.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}