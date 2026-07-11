import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Radio, Plus, Trash2, Copy, Play, Square, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

export default function MultiStreamConfig({ roomId, isHost }) {
  const [destinations, setDestinations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ platform: 'twitch', rtmpUrl: '', streamKey: '' });
  const [isDistributing, setIsDistributing] = useState(false);
  const [streamStatus, setStreamStatus] = useState(null);

  const distributeMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke('distributeStreamToRTMP', payload),
    onSuccess: (response) => {
      setStreamStatus({
        success: true,
        message: `Streaming to ${response.data.activeDestinations} destination(s)`,
        commands: response.data.commands,
      });
    },
    onError: (error) => {
      setStreamStatus({
        success: false,
        message: error.message || 'Failed to configure multi-streaming',
      });
    },
  });

  const handleAddDestination = (e) => {
    e.preventDefault();
    if (formData.rtmpUrl && formData.streamKey) {
      const newDest = {
        id: Date.now(),
        ...formData,
        isActive: true,
      };
      setDestinations([...destinations, newDest]);
      setFormData({ platform: 'twitch', rtmpUrl: '', streamKey: '' });
      setShowForm(false);
    }
  };

  const handleRemove = (id) => {
    setDestinations(destinations.filter(d => d.id !== id));
  };

  const handleStartStreaming = () => {
    if (destinations.length === 0) return;
    distributeMutation.mutate({
      roomId,
      destinations: destinations.filter(d => d.isActive),
      action: 'start',
    });
    setIsDistributing(true);
  };

  const handleStopStreaming = () => {
    setIsDistributing(false);
    setStreamStatus(null);
  };

  const copyStreamUrl = (url, key) => {
    navigator.clipboard.writeText(`${url}/${key}`);
  };

  const platforms = [
   { id: 'twitch', label: 'Twitch', guide: 'Get from Twitch Creator Dashboard > Settings > Stream Key' },
   { id: 'youtube', label: 'YouTube Live', guide: 'Get from YouTube Studio > Stream Settings' },
   { id: 'facebook', label: 'Facebook Live', guide: 'Get from Facebook Live Producer' },
   { id: 'tiktok', label: 'TikTok Live', guide: 'Get from TikTok Creator Center' },
   { id: 'evmux', label: 'Evmux', guide: 'RTMP: rtmp1.us-east-1.evmux.com/live' },
   { id: 'custom', label: 'Custom RTMP', guide: 'Enter any RTMP server URL' },
  ];

  if (!isHost) {
    return (
      <div className="bg-[rgba(13,6,24,0.9)] border border-[rgba(212,175,55,0.15)] rounded-xl p-4 text-center">
        <p className="text-xs text-white/40">Only hosts can configure multi-streaming</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status */}
      {streamStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg border flex items-center gap-2 ${
            streamStatus.success
              ? 'bg-green-900/20 border-green-600/50 text-green-300'
              : 'bg-red-900/20 border-red-600/50 text-red-300'
          }`}
        >
          {streamStatus.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="text-xs flex-1">{streamStatus.message}</span>
        </motion.div>
      )}

      {/* Destinations List */}
      <div className="bg-[rgba(13,6,24,0.9)] border border-[rgba(212,175,55,0.15)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#d4af37]" />
            <span className="text-sm font-semibold text-white">Stream Destinations</span>
            <span className="text-xs px-2 py-1 rounded-full bg-[#7B5DA6]/30 text-[#7B5DA6]">
              {destinations.length}
            </span>
          </div>
          {isDistributing && (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </div>
          )}
        </div>

        <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
          {destinations.length === 0 ? (
            <p className="text-xs text-white/40 text-center py-4">No destinations configured</p>
          ) : (
            destinations.map(dest => (
              <div key={dest.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white capitalize">{dest.platform}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {platforms.find(p => p.id === dest.platform)?.label}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleRemove(dest.id)}
                    className="w-5 h-5 rounded flex items-center justify-center bg-red-900/20 hover:bg-red-900/40 text-red-400 shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </motion.button>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 min-w-fit">RTMP URL:</span>
                    <code className="text-white/60 flex-1 truncate font-mono">{dest.rtmpUrl}</code>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => copyStreamUrl(dest.rtmpUrl, dest.streamKey)}
                      className="w-4 h-4 flex items-center justify-center hover:bg-white/10 rounded"
                    >
                      <Copy className="w-3 h-3 text-white/40" />
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 min-w-fit">Key:</span>
                    <code className="text-white/60 flex-1 truncate font-mono">
                      {dest.streamKey.substring(0, 20)}...
                    </code>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => copyStreamUrl(dest.rtmpUrl, dest.streamKey)}
                      className="w-4 h-4 flex items-center justify-center hover:bg-white/10 rounded"
                    >
                      <Copy className="w-3 h-3 text-white/40" />
                    </motion.button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Add form */}
          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleAddDestination}
                className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2"
              >
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded text-xs text-white px-2 py-1.5"
                >
                  {platforms.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                {formData.platform && (
                  <p className="text-[11px] text-white/40 px-1">
                    {platforms.find(p => p.id === formData.platform)?.guide}
                  </p>
                )}
                <input
                  type="url"
                  placeholder="RTMP URL (e.g., rtmp://live.twitch.tv/app)"
                  value={formData.rtmpUrl}
                  onChange={(e) => setFormData({ ...formData, rtmpUrl: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded text-xs text-white placeholder-white/30 px-2 py-1.5"
                  required
                />
                <input
                  type="password"
                  placeholder="Stream Key (will be masked)"
                  value={formData.streamKey}
                  onChange={(e) => setFormData({ ...formData, streamKey: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded text-xs text-white placeholder-white/30 px-2 py-1.5"
                  required
                />
                <div className="flex gap-1">
                  <button type="submit" style={{ flex:1, background:'rgba(20,83,45,0.6)', border:'1px solid rgba(22,163,74,0.5)', color:'#6DBF7E', fontSize:11, padding:'5px 10px', borderRadius:8, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif', fontWeight:700 }}>Add Destination</button>
                  <button type="button" onClick={() => setShowForm(false)} style={{ flex:1, background:'transparent', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.5)', fontSize:11, padding:'5px 10px', borderRadius:8, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif', fontWeight:700 }}>Cancel</button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {!showForm && (
            <button onClick={() => setShowForm(true)} style={{ width:'100%', background:'rgba(212,175,55,0.15)', border:'1px solid rgba(212,175,55,0.3)', color:'#D4AF37', fontSize:11, padding:'5px 10px', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontFamily:'Barlow Condensed, sans-serif', fontWeight:700 }}>
              <Plus className="w-3 h-3" /> Add Destination
            </button>
          )}
        </div>
      </div>

      {/* Control buttons */}
      {destinations.length > 0 && (
        <div className="flex gap-2">
          <button onClick={handleStartStreaming} disabled={isDistributing || distributeMutation.isPending} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'rgba(20,83,45,0.6)', border:'1px solid rgba(22,163,74,0.5)', color:'#6DBF7E', padding:'8px 14px', borderRadius:8, cursor:isDistributing?'default':'pointer', opacity:isDistributing?0.6:1, fontFamily:'Barlow Condensed, sans-serif', fontWeight:700 }}>
            <Play className="w-4 h-4" />{isDistributing ? 'Streaming...' : 'Start Multi-Streaming'}
          </button>
          {isDistributing && (
            <button onClick={handleStopStreaming} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'rgba(127,29,29,0.6)', border:'1px solid rgba(185,28,28,0.5)', color:'#fca5a5', padding:'8px 14px', borderRadius:8, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif', fontWeight:700 }}>
              <Square className="w-4 h-4" />Stop
            </button>
          )}
        </div>
      )}
    </div>
  );
}