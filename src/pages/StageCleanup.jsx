import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Layers, Clock } from 'lucide-react';
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
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Older than</span>
                <Select value={String(ageDays)} onValueChange={v => setAgeDays(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_OPTIONS.map(o => (
                      <SelectItem key={o.days} value={String(o.days)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  {ghostStages.length} ghost stage{ghostStages.length !== 1 ? 's' : ''} found
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={ghostStages.length === 0 || deleteMutation.isPending}
                  onClick={handleDeleteAll}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All ({ghostStages.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Stages', value: stages.length, icon: Layers, color: 'text-blue-600' },
            { label: 'Ghost / Orphaned', value: ghostStages.length, icon: AlertTriangle, color: 'text-orange-600' },
            { label: 'Active Stages', value: stages.filter(s => s.is_active).length, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Cleaned Up', value: deletedCount, icon: Trash2, color: 'text-slate-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="pb-3">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Icon className={`w-6 h-6 ${color}`} />
                  {value}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Ghost Stage List */}
        {isLoading ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Loading stages...</CardContent></Card>
        ) : ghostStages.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <CheckCircle className="w-14 h-14 mx-auto text-green-500" />
              <p className="text-lg font-semibold">All clean!</p>
              <p className="text-sm text-muted-foreground">No ghost stages older than {ageDays} day{ageDays !== 1 ? 's' : ''} found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {ghostStages.map(stage => {
              const { label, color } = getRoomStatus(stage.room_id);
              const room = roomMap[stage.room_id];
              return (
                <Card key={stage.id} className="border-orange-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium truncate">{stage.name}</span>
                          <Badge variant="outline" className="capitalize text-xs">{stage.type}</Badge>
                          <Badge className={`text-xs ${color}`}>{label}</Badge>
                          {!stage.is_active && (
                            <Badge className="text-xs bg-slate-100 text-slate-600">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>Room: {room?.title || 'Deleted'}</span>
                          <span>Created: {new Date(stage.created_date).toLocaleDateString()}</span>
                          <span>Age: {Math.floor((Date.now() - new Date(stage.created_date)) / 86400000)}d</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 gap-1 shrink-0"
                        onClick={() => handleDeleteOne(stage.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}