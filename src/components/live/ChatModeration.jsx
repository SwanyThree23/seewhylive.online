import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';

const TIMEOUT_OPTIONS = [
  { label: '1 min', value: 1 },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '1 hr', value: 60 },
];

export default function ChatModeration({ collapsed: initCollapsed = true }) {
  const [collapsed, setCollapsed] = useState(initCollapsed);
  const [blockedWords, setBlockedWords] = useState(['spam', 'hate', 'scam']);
  const [wordInput, setWordInput] = useState('');
  const [blockLinks, setBlockLinks] = useState(true);
  const [blockCaps, setBlockCaps] = useState(true);
  const [blockSpam, setBlockSpam] = useState(true);
  const [newAccountGate, setNewAccountGate] = useState(false);
  const [accountAge, setAccountAge] = useState(7);
  const [timeoutDuration, setTimeoutDuration] = useState(5);
  const [stats] = useState({ blocks: 3, timeouts: 1, deletes: 7 });

  const addWord = () => {
    const w = wordInput.trim().toLowerCase();
    if (w && !blockedWords.includes(w)) setBlockedWords(prev => [...prev, w]);
    setWordInput('');
  };

  return (
    <div className="bg-[rgba(13,6,24,0.9)] border border-[rgba(212,175,55,0.2)] rounded-xl overflow-hidden" style={{ backdropFilter: 'blur(12px)' }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-[#00d4ff]" />
          <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider">Auto-Moderation</span>
          <Badge className="text-[9px] bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/30 px-1">
            {stats.blocks + stats.timeouts + stats.deletes} today
          </Badge>
        </div>
        {collapsed ? <ChevronDown className="w-3 h-3 text-white/40" /> : <ChevronUp className="w-3 h-3 text-white/40" />}
      </button>

      {!collapsed && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden px-3 pb-3 space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-1">
            <div className="bg-white/5 rounded p-1.5 text-center">
              <p className="text-[10px] text-white/40">Blocked</p>
              <p className="text-sm font-bold text-[#d4af37]">{stats.blocks}</p>
            </div>
            <div className="bg-white/5 rounded p-1.5 text-center">
              <p className="text-[10px] text-white/40">Timeouts</p>
              <p className="text-sm font-bold text-orange-400">{stats.timeouts}</p>
            </div>
            <div className="bg-white/5 rounded p-1.5 text-center">
              <p className="text-[10px] text-white/40">Deleted</p>
              <p className="text-sm font-bold text-red-400">{stats.deletes}</p>
            </div>
          </div>

          {/* Word filter */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-white/40 uppercase">Banned Words</p>
            <div className="flex gap-1">
              <Input
                value={wordInput} onChange={(e) => setWordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addWord()}
                className="h-6 text-[10px] bg-white/5 border-white/20 text-white flex-1"
                placeholder="Add word..."
              />
              <button onClick={addWord} className="w-6 h-6 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center hover:bg-[#d4af37]/20">
                <Plus className="w-3 h-3 text-[#d4af37]" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {blockedWords.map(w => (
                <Badge key={w} className="text-[9px] bg-red-900/30 border-red-700/30 text-red-300 pr-1 flex items-center gap-1">
                  {w}
                  <button onClick={() => setBlockedWords(prev => prev.filter(x => x !== w))}>
                    <X className="w-2 h-2" />
                  </button>
                </Badge>
              ))}
            </div>
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
                <Switch checked={item.state} onCheckedChange={item.set}
                  className="scale-75 data-[state=checked]:bg-[#00d4ff]" />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60">Account age gate</span>
              <div className="flex items-center gap-1">
                {newAccountGate && (
                  <Input
                    type="number" value={accountAge}
                    onChange={(e) => setAccountAge(Number(e.target.value))}
                    className="h-5 w-10 text-[9px] bg-white/5 border-white/20 text-white text-center p-0"
                  />
                )}
                <Switch checked={newAccountGate} onCheckedChange={setNewAccountGate}
                  className="scale-75 data-[state=checked]:bg-[#00d4ff]" />
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