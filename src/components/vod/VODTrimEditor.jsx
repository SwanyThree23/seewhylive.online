import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Scissors, Play, Pause, Save } from 'lucide-react';

export default function VODTrimEditor({ video, onSave, onCancel }) {
  const [trimStart, setTrimStart] = useState(video.trim_start || 0);
  const [trimEnd, setTrimEnd] = useState(video.trim_end || video.duration_seconds || 100);
  const [playing, setPlaying] = useState(false);
  const duration = video.duration_seconds || 100;

  const pctStart = (trimStart / duration) * 100;
  const pctEnd = (trimEnd / duration) * 100;

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-white/70">
        <Scissors className="w-4 h-4 text-[#d4af37]" />
        <span>Trim Video</span>
        <span className="ml-auto text-[#d4af37] font-mono text-xs">
          {fmt(trimStart)} → {fmt(trimEnd)} ({fmt(trimEnd - trimStart)} kept)
        </span>
      </div>

      {/* Timeline scrubber */}
      <div className="relative h-12 bg-white/5 rounded-xl overflow-hidden">
        {/* Active region */}
        <div
          className="absolute top-0 bottom-0 bg-[#d4af37]/20 border-x-2 border-[#d4af37]"
          style={{ left: `${pctStart}%`, width: `${pctEnd - pctStart}%` }}
        />
        {/* Start handle */}
        <input
          type="range" min={0} max={trimEnd - 1} value={trimStart}
          onChange={e => setTrimStart(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize z-10"
        />
        <div className="absolute top-1/2 -translate-y-1/2 text-[10px] text-white/50 left-2">Start</div>
        <div className="absolute top-1/2 -translate-y-1/2 text-[10px] text-white/50 right-2">End</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-white/40 uppercase">Start</label>
          <input
            type="number" min={0} max={trimEnd - 1} value={trimStart}
            onChange={e => setTrimStart(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mt-1"
          />
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase">End (seconds)</label>
          <input
            type="number" min={trimStart + 1} max={duration} value={trimEnd}
            onChange={e => setTrimEnd(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mt-1"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" className="border-white/10 text-white/60" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="bg-[#d4af37] text-black font-bold gap-2 ml-auto"
          onClick={() => onSave({ trim_start: trimStart, trim_end: trimEnd, is_clipped: true })}>
          <Save className="w-3.5 h-3.5" /> Save Trim
        </Button>
      </div>
    </div>
  );
}