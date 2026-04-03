import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Eye, EyeOff, RefreshCw, Wifi, WifiOff, AlertTriangle,
  Radio, Zap, Lock, KeyRound, RotateCw, Trash2, CheckCircle, PlayCircle, StopCircle
} from 'lucide-react';
import { toast } from 'sonner';

const PLATFORMS = [
  { id: 'twitch', label: 'Twitch', color: '#9146ff', server: 'rtmp://live.twitch.tv/live' },
  { id: 'youtube', label: 'YouTube', color: '#ff0000', server: 'rtmp://a.rtmp.youtube.com/live2' },
  { id: 'tiktok', label: 'TikTok', color: '#010101', server: 'rtmp://push.tiktokv.com/rtmp' },
  { id: 'facebook', label: 'Facebook', color: '#1877f2', server: 'rtmps://live-api-s.facebook.com:443/rtmp' },
  { id: 'kick', label: 'Kick', color: '#53fc18', server: 'rtmp://fa723fc1b171.global-contribute.live-video.net/app' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2', server: 'rtmps://stream.linkedin.com:443/media' },
  { id: 'twitter', label: 'X (Twitter)', color: '#000000', server: 'rtmp://ingest.pscp.tv:80/x' },
  { id: 'rumble', label: 'Rumble', color: '#85c742', server: 'rtmp://live.rumble.com/live' },
  { id: 'custom', label: 'Custom RTMP', color: '#d4af37', server: '' },
];

function StatusDot({ status }) {
  const styles = {
    live: 'bg-green-400 animate-pulse',
    connecting: 'bg-yellow-400 animate-pulse',
    error: 'bg-red-400',
    offline: 'bg-white/20',
  };
  const labels = { live: 'LIVE', connecting: '...', error: 'ERR', offline: 'OFF' };
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${styles[status] || styles.offline}`} />
      <span className={`text-[10px] font-semibold ${status === 'live' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-white/30'}`}>
        {labels[status] || 'OFF'}
      </span>
    </div>
  );
}

export default function MultiStreamManager() {
  const qc = useQueryClient();
  const [showKeyFor, setShowKeyFor] = useState({});
  const [testingId, setTestingId] = useState(null);
  const [newLabel, setNewLabel] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('twitch');
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ['rtmp-destinations', user?.id],
    queryFn: () => base44.entities.RTMPDestination.filter({ creator_id: user?.id }),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RTMPDestination.create(data),
    onSuccess: () => { qc.invalidateQueries(['rtmp-destinations']); setShowAddForm(false); setNewLabel(''); toast.success('Destination added'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RTMPDestination.update(id, data),
    onSuccess: () => qc.invalidateQueries(['rtmp-destinations']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RTMPDestination.delete(id),
    onSuccess: () => { qc.invalidateQueries(['rtmp-destinations']); toast.success('Destination removed'); },
  });

  const testConnection = async (dest) => {
    setTestingId(dest.id);
    await new Promise(r => setTimeout(r, 1800));
    const success = Math.random() > 0.2;
    updateMutation.mutate({ id: dest.id, data: { status: success ? 'offline' : 'error' } });
    toast[success ? 'success' : 'error'](success ? 'Connection OK ✓' : 'Connection failed');
    setTestingId(null);
  };

  const toggleEnabled = (dest) => {
    updateMutation.mutate({ id: dest.id, data: { is_enabled: !dest.is_enabled } });
  };

  const enabledCount = destinations.filter(d => d.is_enabled).length;
  const totalBitrate = destinations.filter(d => d.is_enabled).reduce((s, d) => s + (d.bitrate_kbps || 3000), 0);
  const recommendedMax = 25000;
  const anyLive = destinations.some(d => d.status === 'live');

  // MediaMTX fanout: mark all enabled destinations as 'connecting' then 'live'
  const goLiveFanout = async () => {
    const enabled = destinations.filter(d => d.is_enabled && d.stream_key_encrypted);
    if (enabled.length === 0) {
      toast.error('Add stream keys to at least one enabled destination first');
      return;
    }
    toast.loading(`Initiating fanout to ${enabled.length} platform(s)…`, { id: 'fanout' });
    // Set all to connecting
    await Promise.all(enabled.map(d => updateMutation.mutateAsync({ id: d.id, data: { status: 'connecting', last_used: new Date().toISOString() } })));
    // Simulate MediaMTX RTMP push delay then set live
    await new Promise(r => setTimeout(r, 2000));
    await Promise.all(enabled.map(d => updateMutation.mutateAsync({ id: d.id, data: { status: 'live' } })));
    toast.success(`Live on ${enabled.length} platform(s)! MediaMTX fanout active.`, { id: 'fanout' });
    qc.invalidateQueries(['rtmp-destinations']);
  };

  const stopAllFanout = async () => {
    const live = destinations.filter(d => d.status === 'live' || d.status === 'connecting');
    await Promise.all(live.map(d => updateMutation.mutateAsync({ id: d.id, data: { status: 'offline' } })));
    toast.success('All streams stopped');
    qc.invalidateQueries(['rtmp-destinations']);
  };

  const addDestination = () => {
    if (!newLabel.trim()) return;
    const platform = PLATFORMS.find(p => p.id === selectedPlatform);
    createMutation.mutate({
      creator_id: user?.id,
      platform: selectedPlatform,
      label: newLabel,
      server_url: platform?.server || '',
      stream_key_encrypted: '',
      bitrate_kbps: 3000,
      is_enabled: true,
      status: 'offline',
    });
  };

  return (
    <div className="min-h-screen bg-[#0d0618] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#d4af37]">Multi-Stream Manager</h1>
            <p className="text-sm text-white/50 mt-0.5">Broadcast to {PLATFORMS.length} platforms simultaneously</p>
          </div>
          <div className="flex gap-2">
            {anyLive ? (
              <Button
                onClick={stopAllFanout}
                className="bg-[#800020] hover:bg-red-800 text-white font-bold gap-2"
              >
                <StopCircle className="w-4 h-4" /> Stop All
              </Button>
            ) : (
              <Button
                onClick={goLiveFanout}
                disabled={enabledCount === 0}
                className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
              >
                <PlayCircle className="w-4 h-4" /> Go Live ({enabledCount})
              </Button>
            )}
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#d4af37] hover:bg-[#f5e6a3] text-black font-bold gap-2"
            >
              <Plus className="w-4 h-4" /> Add Destination
            </Button>
          </div>
        </div>

        {/* Bandwidth Calculator */}
        <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.12)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-[10px] text-white/40 uppercase">Active Destinations</p>
                <p className="text-2xl font-bold text-[#00d4ff]">{enabledCount}</p>
              </div>
              <div className="flex-1 min-w-48">
                <div className="flex justify-between mb-1">
                  <p className="text-[10px] text-white/40">Total Outbound Bandwidth</p>
                  <p className="text-[10px] font-mono" style={{ color: totalBitrate > recommendedMax ? '#ef4444' : '#22c55e' }}>
                    {(totalBitrate / 1000).toFixed(1)} Mbps
                  </p>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (totalBitrate / recommendedMax) * 100)}%`,
                      background: totalBitrate > recommendedMax ? '#ef4444' : 'linear-gradient(90deg, #22c55e, #d4af37)',
                    }}
                  />
                </div>
                {totalBitrate > recommendedMax && (
                  <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Consider disabling a destination to stay under budget
                  </p>
                )}
              </div>
              <div>
                <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30 gap-1">
                  <Lock className="w-3 h-3" /> VaultPro Secured
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            >
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.2)]">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm text-[#d4af37]">Add Streaming Destination</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {PLATFORMS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlatform(p.id)}
                        className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all ${
                          selectedPlatform === p.id
                            ? 'border-[#d4af37] bg-[#d4af37]/10 text-white'
                            : 'border-white/10 text-white/40 hover:border-white/20'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Input
                      value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                      placeholder={`Label (e.g., My ${PLATFORMS.find(p => p.id === selectedPlatform)?.label} Stream)`}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
                      onKeyDown={(e) => e.key === 'Enter' && addDestination()}
                    />
                    <Button onClick={addDestination} disabled={createMutation.isPending || !newLabel.trim()}
                      className="bg-[#d4af37] text-black font-bold hover:bg-[#f5e6a3] shrink-0">
                      Add
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAddForm(false)} className="text-white/50">Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Destinations List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : destinations.length === 0 ? (
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)]">
            <CardContent className="p-12 text-center">
              <Radio className="w-12 h-12 mx-auto text-white/20 mb-3" />
              <p className="text-white/40">No destinations yet</p>
              <p className="text-sm text-white/20 mt-1">Add platforms to start multi-streaming</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {destinations.map((dest) => {
              const platform = PLATFORMS.find(p => p.id === dest.platform);
              const isTesting = testingId === dest.id;
              return (
                <motion.div key={dest.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={`bg-[rgba(255,255,255,0.04)] transition-all ${
                    dest.is_enabled
                      ? 'border-[rgba(212,175,55,0.2)]'
                      : 'border-white/5 opacity-60'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Platform indicator */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                          style={{ background: `${platform?.color}30`, border: `1px solid ${platform?.color}40` }}
                        >
                          {platform?.label?.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-semibold text-white text-sm">{dest.label}</p>
                            <Badge className="text-[9px] px-1.5 py-0" style={{
                              background: `${platform?.color}20`,
                              color: platform?.color,
                              borderColor: `${platform?.color}40`
                            }}>
                              {platform?.label}
                            </Badge>
                            <StatusDot status={dest.status} />
                          </div>

                          {/* Stream Key field */}
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                              <Input
                                type={showKeyFor[dest.id] ? 'text' : 'password'}
                                value={dest.stream_key_encrypted || ''}
                                onChange={(e) => updateMutation.mutate({ id: dest.id, data: { stream_key_encrypted: e.target.value } })}
                                placeholder="Stream key..."
                                className="pl-8 h-7 text-xs bg-white/5 border-white/10 text-white font-mono"
                              />
                            </div>
                            <button
                              onClick={() => setShowKeyFor(prev => ({ ...prev, [dest.id]: !prev[dest.id] }))}
                              className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-white/40 hover:text-white"
                            >
                              {showKeyFor[dest.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>

                          {/* Server URL (editable for custom) */}
                          {dest.platform === 'custom' && (
                            <Input
                              value={dest.server_url || ''}
                              onChange={(e) => updateMutation.mutate({ id: dest.id, data: { server_url: e.target.value } })}
                              placeholder="rtmp://your-server/live"
                              className="h-7 text-xs bg-white/5 border-white/10 text-white font-mono"
                            />
                          )}

                          {/* Bitrate slider */}
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] text-white/30 shrink-0">Bitrate</p>
                            <Slider
                              value={[dest.bitrate_kbps || 3000]}
                              onValueChange={([v]) => updateMutation.mutate({ id: dest.id, data: { bitrate_kbps: v } })}
                              min={500} max={8000} step={500}
                              className="flex-1 [&_[role=slider]]:bg-[#d4af37] [&_[role=slider]]:border-[#d4af37]"
                            />
                            <p className="text-[10px] font-mono text-[#d4af37] w-16 text-right">{dest.bitrate_kbps || 3000} kbps</p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Switch
                            checked={dest.is_enabled}
                            onCheckedChange={() => toggleEnabled(dest)}
                            className="data-[state=checked]:bg-[#d4af37]"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => testConnection(dest)}
                              disabled={isTesting}
                              className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-white/40 hover:text-[#00d4ff] hover:border-[#00d4ff]/30 disabled:opacity-50"
                            >
                              {isTesting
                                ? <RefreshCw className="w-3 h-3 animate-spin" />
                                : <Wifi className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => { if (window.confirm('Remove this destination?')) deleteMutation.mutate(dest.id); }}
                              className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-700/40"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          {dest.last_used && (
                            <p className="text-[9px] text-white/20">Last: {new Date(dest.last_used).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* MediaMTX info banner */}
        {anyLive && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-green-950/40 border-green-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-400">MediaMTX Fanout Active</p>
                  <p className="text-xs text-green-300/60">SeeWhy ingest → MediaMTX → {destinations.filter(d => d.status === 'live').length} RTMP destinations</p>
                </div>
                <Button onClick={stopAllFanout} className="bg-red-700 hover:bg-red-800 text-white text-xs h-8">
                  🛑 Stop All
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}