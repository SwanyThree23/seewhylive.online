import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Shield, X, ChevronDown, ChevronUp, Plus, Eye, EyeOff, Loader2 } from 'lucide-react';

const TIMEOUT_OPTIONS = [
  { label: '1 min', value: 1 },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '1 hr', value: 60 },
];

const ACTIONS = {
  hide: { label: 'Hide', icon: EyeOff, color: '#C0392B', bg: 'rgba(192,57,43,0.25)', border: 'rgba(192,57,43,0.4)' },
  flag: { label: 'Flag', icon: Eye,    color: '#D4854A', bg: 'rgba(212,133,74,0.2)', border: 'rgba(212,133,74,0.4)' },
};

export default function ChatModeration({ collapsed: initCollapsed = true }) {
  const [collapsed, setCollapsed] = useState(initCollapsed);
  const [wordInput, setWordInput] = useState('');
  const [newAction, setNewAction] = useState('hide');
  const [blockLinks, setBlockLinks] = useState(true);
  const [blockCaps, setBlockCaps] = useState(true);
  const [blockSpam, setBlockSpam] = useState(true);
  const [newAccountGate, setNewAccountGate] = useState(false);
  const [accountAge, setAccountAge] = useState(7);
  const [timeoutDuration, setTimeoutDuration] = useState(5);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const wordsKey = ['blocked-words-own', user?.id];
  const { data: words = [], isLoading } = useQuery({
    queryKey: wordsKey,
    queryFn: () => base44.entities.BlockedWord.filter({ creator_id: user.id }, '-created_date', 200),
    enabled: !!user?.id,
  });

  const addWord = useMutation({
    mutationFn: (word) => base44.entities.BlockedWord.create({ creator_id: user.id, word, action: newAction }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: wordsKey }),
    onError: () => toast.error('Could not save that word'),
  });

  const removeWord = useMutation({
    mutationFn: (id) => base44.entities.BlockedWord.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: wordsKey }),
    onError: () => toast.error('Could not remove that word'),
  });

  const setWordAction = useMutation({
    mutationFn: ({ id, action }) => base44.entities.BlockedWord.update(id, { action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: wordsKey }),
    onError: () => toast.error('Could not update that word'),
  });

  const handleAdd = () => {
    const w = wordInput.trim().toLowerCase();
    if (!w) return;
    if (words.some(x => (x.word || '').toLowerCase() === w)) {
      toast.error('Already watching that word');
      setWordInput('');
      return;
    }
    addWord.mutate(w);
    setWordInput('');
  };

  const hideCount = words.filter(w => w.action === 'hide').length;
  const flagCount = words.filter(w => w.action !== 'hide').length;

  return (
    <div className="bg-[rgba(8,11,24,0.9)] border border-[rgba(212,175,55,0.2)] rounded-xl overflow-hidden" style={{ backdropFilter: 'blur(12px)' }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-[#4A8A7A]" />
          <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider">Auto-Moderation</span>
          <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(74,138,122,0.1)', color: '#4A8A7A', border: '1px solid rgba(74,138,122,0.3)' }}>
            {words.length} watching
          </span>
        </div>
        {collapsed ? <ChevronDown className="w-3 h-3 text-white/40" /> : <ChevronUp className="w-3 h-3 text-white/40" />}
      </button>

      {!collapsed && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden px-3 pb-3 space-y-3">
          {/* Live tally of the word filter */}
          <div className="grid grid-cols-3 gap-1">
            <div className="bg-white/5 rounded p-1.5 text-center">
              <p className="text-[10px] text-white/40">Watching</p>
              <p className="text-sm font-bold text-[#d4af37]">{words.length}</p>
            </div>
            <div className="bg-white/5 rounded p-1.5 text-center">
              <p className="text-[10px] text-white/40">Hidden</p>
              <p className="text-sm font-bold text-[#C0392B]">{hideCount}</p>
            </div>
            <div className="bg-white/5 rounded p-1.5 text-center">
              <p className="text-[10px] text-white/40">Flagged</p>
              <p className="text-sm font-bold text-[#D4854A]">{flagCount}</p>
            </div>
          </div>

          {/* Word filter */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-white/40 uppercase">Watch List</p>
            <p className="text-[10px] leading-snug" style={{ color: 'rgba(255,255,255,0.3)' }}>
              These words are checked on every chat message in your live streams.
            </p>
            <div className="flex gap-1">
              <input
                value={wordInput} onChange={(e) => setWordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Add word..."
                aria-label="Add a word to watch for"
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 10, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif', height: 24, flex: 1 }}
              />
              <button
                onClick={handleAdd}
                disabled={addWord.isPending}
                aria-label="Add word"
                className="w-6 h-6 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center hover:bg-[#d4af37]/20 disabled:opacity-40">
                <Plus className="w-3 h-3 text-[#d4af37]" />
              </button>
            </div>

            {/* What a new word should do */}
            <div className="flex gap-1">
              {Object.entries(ACTIONS).map(([id, cfg]) => {
                const Icon = cfg.icon;
                const active = newAction === id;
                return (
                  <button
                    key={id}
                    onClick={() => setNewAction(id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded border text-[10px] font-bold transition-all"
                    style={{
                      background: active ? cfg.bg : 'transparent',
                      borderColor: active ? cfg.border : 'rgba(255,255,255,0.1)',
                      color: active ? cfg.color : 'rgba(255,255,255,0.4)',
                    }}>
                    <Icon className="w-3 h-3" /> {cfg.label} new words
                  </button>
                );
              })}
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 py-2 text-[10px] text-white/30">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading your list…
              </div>
            ) : words.length === 0 ? (
              <p className="text-[10px] py-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                No words yet — add one above and it applies to your next live stream.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {words.map(w => {
                  const cfg = ACTIONS[w.action] || ACTIONS.hide;
                  const Icon = cfg.icon;
                  const nextAction = w.action === 'hide' ? 'flag' : 'hide';
                  return (
                    <span key={w.id} style={{ fontSize: 11, fontWeight: 900, padding: '2px 6px', borderRadius: 99, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => setWordAction.mutate({ id: w.id, action: nextAction })}
                        title={`Switch to ${ACTIONS[nextAction].label.toLowerCase()}`}
                        aria-label={`${w.word} — currently ${cfg.label.toLowerCase()}, tap to ${ACTIONS[nextAction].label.toLowerCase()}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex', alignItems: 'center' }}>
                        <Icon className="w-2.5 h-2.5" />
                      </button>
                      {w.word}
                      <button
                        onClick={() => removeWord.mutate(w.id)}
                        aria-label={`Remove ${w.word}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex', alignItems: 'center' }}>
                        <X className="w-2 h-2" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            {[
              { label: 'Block URLs in chat', state: blockLinks, set: setBlockLinks },
              { label: 'Block >70% caps messages', state: blockCaps, set: setBlockCaps },
              { label: 'Spam detection (10s)', state: blockSpam, set: setBlockSpam },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[10px] text-white/60">{item.label}</span>
                <div onClick={() => item.set(!item.state)} style={{ width: 40, height: 22, borderRadius: 99, background: item.state ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}><div style={{ position: 'absolute', top: 3, left: item.state ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} /></div>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60">Account age gate</span>
              <div className="flex items-center gap-1">
                {newAccountGate && (
                  <input
                    type="number" value={accountAge}
                    onChange={(e) => setAccountAge(Number(e.target.value))}
                    style={{ width: 40, height: 20, fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, color: '#fff', textAlign: 'center', padding: 0, outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
                <div onClick={() => setNewAccountGate(v => !v)} style={{ width: 40, height: 22, borderRadius: 99, background: newAccountGate ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}><div style={{ position: 'absolute', top: 3, left: newAccountGate ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} /></div>
              </div>
            </div>
          </div>

          {/* Timeout duration */}
          <div className="space-y-1">
            <p className="text-[10px] text-white/40">Auto-timeout duration</p>
            <div className="flex gap-1">
              {TIMEOUT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setTimeoutDuration(o.value)}
                  className={`flex-1 text-[10px] py-1 rounded border transition-all ${
                    timeoutDuration === o.value
                      ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                      : 'border-white/10 text-white/40'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}