import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MultiStreamManager({ destinations = [], onAdd, onRemove }) {
  const [expanded, setExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ platform: 'twitch', rtmpUrl: '', streamKey: '' });
  const [activeDestinations, setActiveDestinations] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.rtmpUrl && formData.streamKey) {
      onAdd?.(formData);
      setFormData({ platform: 'twitch', rtmpUrl: '', streamKey: '' });
      setShowAddForm(false);
    }
  };

  const toggleStream = (id) => {
    setActiveDestinations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyStreamUrl = (url, key) => {
    navigator.clipboard.writeText(`${url}/${key}`);
  };

  const platforms = [
    { id: 'twitch', label: 'Twitch', color: '#9147ff' },
    { id: 'youtube', label: 'YouTube Live', color: '#ff0000' },
    { id: 'facebook', label: 'Facebook Live', color: '#1877f2' },
    { id: 'tiktok', label: 'TikTok Live', color: '#000000' },
    { id: 'custom', label: 'Custom RTMP', color: '#808080' },
  ];

  const getPlatformColor = (platform) => {
    const p = platforms.find(x => x.id === platform);
    return p?.color || '#808080';
  };

  return (
    <div className="bg-[rgba(13,6,24,0.9)] border border-[rgba(212,175,55,0.15)] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-semibold text-white">Multi-Stream</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-orange-900/30 text-orange-300">
            {destinations.length}
          </span>
        </div>
        <span className="text-white/30 text-[10px]">{expanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
              {destinations.length === 0 && !showAddForm && (
                <p className="text-[10px] text-white/40 text-center py-2">No destinations added</p>
              )}

              {/* Existing destinations */}
              {destinations.map(dest => (
                <div
                  key={dest.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-2"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getPlatformColor(dest.platform) }}
                      />
                      <span className="text-xs font-semibold text-white truncate capitalize">
                        {dest.platform}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => toggleStream(dest.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all ${
                          activeDestinations[dest.id]
                            ? 'bg-green-900/60 text-green-400'
                            : 'bg-white/5 text-white/30 hover:bg-white/10'
                        }`}
                        title={activeDestinations[dest.id] ? 'Stop' : 'Start'}
                      >
                        {activeDestinations[dest.id] ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                      </motion.button>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => onRemove?.(dest.id)}
                      className="w-5 h-5 rounded flex items-center justify-center bg-red-900/20 hover:bg-red-900/40 text-red-400 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-1">
                    <code className="text-[9px] text-white/40 flex-1 min-w-0 truncate">
                      {dest.rtmpUrl}
                    </code>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => copyStreamUrl(dest.rtmpUrl, dest.streamKey)}
                      className="w-4 h-4 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/30 shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>
              ))}

              {/* Add form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="bg-white/5 border border-white/10 rounded-lg p-2 space-y-2"
                  >
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded text-xs text-white px-2 py-1"
                    >
                      {platforms.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <input
                      type="url"
                      placeholder="RTMP URL"
                      value={formData.rtmpUrl}
                      onChange={(e) => setFormData({ ...formData, rtmpUrl: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded text-xs text-white placeholder-white/30 px-2 py-1"
                    />
                    <input
                      type="text"
                      placeholder="Stream Key"
                      value={formData.streamKey}
                      onChange={(e) => setFormData({ ...formData, streamKey: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded text-xs text-white placeholder-white/30 px-2 py-1"
                    />
                    <div className="flex gap-1">
                      <Button
                        type="submit"
                        size="sm"
                        className="flex-1 bg-green-900/60 hover:bg-green-900/80 text-green-300 border border-green-600/50 text-xs"
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 border-white/20 text-white/50 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Add button */}
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="w-full gap-1 bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] border border-[#d4af37]/30 text-xs"
                >
                  <Plus className="w-3 h-3" /> Add Destination
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}