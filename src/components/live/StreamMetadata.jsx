import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Tag, Globe, AlertTriangle, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['gaming','music','education','talk','fitness','cooking','art','tech','irl','other'];
const LANGUAGES = ['English','Spanish','French','German','Portuguese','Japanese','Korean','Chinese','Arabic','Hindi','Russian','Italian','Dutch','Polish','Turkish','Vietnamese','Thai','Indonesian','Swedish','Norwegian'];
const RATINGS = [
  { id: 'all', label: '👶 All Ages' },
  { id: 'teen', label: '🧑 Teen (13+)' },
  { id: 'mature', label: '🔞 Mature (17+)' },
];

export default function StreamMetadata({ room, isHost }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(room?.title || '');
  const [category, setCategory] = useState(room?.type || 'gaming');
  const [language, setLanguage] = useState('English');
  const [rating, setRating] = useState('all');
  const [tags, setTags] = useState(room?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTitle(room?.title || '');
    setTags(room?.tags || []);
  }, [room?.id]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Room.update(room.id, data),
    onSuccess: () => {
      qc.invalidateQueries(['room', room.id]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ title, tags });
    toast.success('Stream info updated');
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags(prev => [...prev, t]);
      setTagInput('');
    }
  };

  if (!isHost) return null;

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#d4af37]" />
          <h3 className="font-semibold text-white">Stream Info</h3>
        </div>
        <motion.button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          animate={{ scale: saved ? [1, 1.2, 1] : 1 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            saved ? 'bg-green-700 text-white' : 'bg-[#d4af37] text-black hover:bg-[#f5e6a3]'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          {saved ? 'Saved!' : 'Save'}
        </motion.button>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <label className="text-xs text-white/50">Stream Title</label>
          <span className="text-[10px] text-white/30">{title.length}/100</span>
        </div>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value.slice(0, 100))}
          className="bg-white/5 border-white/20 text-white placeholder:text-white/25"
          placeholder="Stream title..."
        />
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/50">Category</label>
        <div className="grid grid-cols-3 gap-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-xs py-1.5 px-2 rounded-lg border capitalize transition-all ${
                category === c ? 'border-[#d4af37] bg-[#d4af37]/10 text-white' : 'border-white/10 text-white/40 hover:border-white/20'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 flex items-center gap-1"><Tag className="w-3 h-3" /> Tags ({tags.length}/10)</label>
        <div className="flex gap-1.5">
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            placeholder="Add a tag..."
            className="bg-white/5 border-white/20 text-white h-8 text-sm placeholder:text-white/25 flex-1"
          />
          <button onClick={addTag} className="w-8 h-8 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/20">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {tags.map(t => (
              <Badge key={t} className="text-[10px] bg-white/5 border-white/10 text-white/60 pr-1 flex items-center gap-1">
                #{t}
                <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="hover:text-red-400">
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content Rating */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/50">Content Rating</label>
        <div className="flex gap-1.5">
          {RATINGS.map(r => (
            <button key={r.id} onClick={() => setRating(r.id)}
              className={`flex-1 text-[10px] py-1.5 rounded-lg border transition-all ${
                rating === r.id ? 'border-[#d4af37] bg-[#d4af37]/10 text-white' : 'border-white/10 text-white/40'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/50">Stream Language</label>
        <select value={language} onChange={e => setLanguage(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]/40">
          {LANGUAGES.map(l => <option key={l} value={l} className="bg-[#0d0618]">{l}</option>)}
        </select>
      </div>
    </div>
  );
}