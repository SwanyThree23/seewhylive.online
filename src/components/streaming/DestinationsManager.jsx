import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Eye, EyeOff, Copy, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: '▶', color: '#FF0000', hint: 'rtmps://a.rtmp.youtube.com/live2' },
  { id: 'twitch', name: 'Twitch', icon: '◉', color: '#9146FF', hint: 'rtmps://live-[region].twitch.tv/app' },
  { id: 'tiktok', name: 'TikTok', icon: '♫', color: '#69C9D0', hint: 'rtmps://ingest-[region].tiktok.com:443/live' },
];

export default function DestinationsManager({ userId }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [label, setLabel] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [bitrate, setBitrate] = useState(3000);
  const [showKey, setShowKey] = useState(false);
  const qc = useQueryClient();

  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations', userId],
    queryFn: () => userId ? base44.entities.RTMPDestination.filter({ creator_id: userId }) : Promise.resolve([]),
    enabled: !!userId,
  });

  const createDest = useMutation({
    mutationFn: async () => {
      if (!selectedPlatform || !streamKey) {
        toast.error('Platform and stream key required');
        return;
      }
      const platform = PLATFORMS.find(p => p.id === selectedPlatform);
      await base44.entities.RTMPDestination.create({
        creator_id: userId,
        platform: selectedPlatform,
        label: label || platform.name,
        server_url: serverUrl || platform.hint,
        stream_key_encrypted: streamKey,
        bitrate_kbps: bitrate,
        is_enabled: true,
      });
      setLabel('');
      setStreamKey('');
      setServerUrl('');
      setBitrate(3000);
      setSelectedPlatform(null);
      setShowForm(false);
      toast.success('Destination added!');
      qc.invalidateQueries({ queryKey: ['destinations', userId] });
    },
  });

  const deleteDest = useMutation({
    mutationFn: (destId) => base44.entities.RTMPDestination.delete(destId),
    onSuccess: () => {
      toast.success('Destination removed');
      qc.invalidateQueries({ queryKey: ['destinations', userId] });
    },
  });

  const platform = selectedPlatform ? PLATFORMS.find(p => p.id === selectedPlatform) : null;

  return (
    <div className="space-y-4">
      {/* Header + Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
            RTMP Destinations
          </h3>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Stream to multiple platforms simultaneously</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
          style={{ background: showForm ? 'rgba(255,50,50,0.15)' : GOLD + '20', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'Add Destination'}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-xl p-4 space-y-3"
            style={{ background: '#1A1A1A', border: `1px solid rgba(212,175,55,0.2)` }}>
            
            {/* Platform Select */}
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => { setSelectedPlatform(p.id); setLabel(p.name); }}
                  className="flex flex-col items-center gap-1.5 py-2 rounded-lg transition-all"
                  style={{
                    background: selectedPlatform === p.id ? `${p.color}20` : 'rgba(255,255,255,0.03)',
                    border: selectedPlatform === p.id ? `1px solid ${p.color}50` : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <span className="text-lg font-black">{p.icon}</span>
                  <span className="text-[11px] font-bold text-white/70">{p.name}</span>
                </button>
              ))}
            </div>

            {selectedPlatform && (
              <>
                {/* Server URL */}
                <div>
                  <label className="text-[10px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Server URL
                  </label>
                  <input type="text" placeholder={platform?.hint}
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg text-[11px] bg-black/30 border border-white/10 text-white/80"
                  />
                </div>

                {/* Stream Key */}
                <div>
                  <label className="text-[10px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Stream Key *
                  </label>
                  <div className="flex gap-1.5 mt-1">
                    <input type={showKey ? 'text' : 'password'} placeholder="Paste your stream key"
                      value={streamKey}
                      onChange={(e) => setStreamKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg text-[11px] bg-black/30 border border-white/10 text-white/80"
                    />
                    <button onClick={() => setShowKey(!showKey)}
                      className="px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {showKey ? <EyeOff className="w-3.5 h-3.5 text-white/40" /> : <Eye className="w-3.5 h-3.5 text-white/40" />}
                    </button>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Your key will be securely encrypted</p>
                </div>

                {/* Bitrate */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      Bitrate (kbps)
                    </label>
                    <input type="number" min="500" max="8000" value={bitrate}
                      onChange={(e) => setBitrate(parseInt(e.target.value))}
                      className="w-full mt-1 px-3 py-1.5 rounded-lg text-[11px] bg-black/30 border border-white/10 text-white/80"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      Label
                    </label>
                    <input type="text" placeholder={platform?.name}
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 rounded-lg text-[11px] bg-black/30 border border-white/10 text-white/80"
                    />
                  </div>
                </div>

                {/* Add button */}
                <button onClick={() => createDest.mutate()}
                  disabled={createDest.isPending || !streamKey}
                  className="w-full py-2 rounded-lg font-black text-[11px] uppercase disabled:opacity-40"
                  style={{ background: GOLD, color: '#000', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {createDest.isPending ? 'Adding...' : 'Add Destination'}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Destinations List */}
      <div className="space-y-2">
        {destinations.length === 0 ? (
          <div className="flex items-center gap-2 py-4 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <AlertCircle className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No destinations yet. Add one to start multi-streaming.</p>
          </div>
        ) : (
          destinations.map(dest => {
            const p = PLATFORMS.find(pl => pl.id === dest.platform) || { icon: '◎', color: GOLD, name: 'Custom' };
            return (
              <div key={dest.id} className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: '#1A1A1A', border: `1px solid rgba(212,175,55,0.15)` }}>
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg text-lg font-black"
                    style={{ background: `${p.color}15`, border: `1px solid ${p.color}30`, color: p.color }}>
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{dest.label}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {dest.bitrate_kbps}kbps • {dest.server_url.replace('rtmps://', '').split('/')[0]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { navigator.clipboard.writeText(dest.server_url + '/' + dest.stream_key_encrypted); toast.success('Copied!'); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                    style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <Copy className="w-3.5 h-3.5" style={{ color: GOLD }} />
                  </button>
                  <button onClick={() => deleteDest.mutate(dest.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                    style={{ background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.2)' }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}