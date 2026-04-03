import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, BookOpen, Save } from 'lucide-react';

export default function ChapterEditor({ video, onSave, onCancel }) {
  const [chapters, setChapters] = useState(video.chapters || []);
  const [newTime, setNewTime] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const addChapter = () => {
    if (!newTitle || newTime === '') return;
    const t = Number(newTime);
    const updated = [...chapters, { time: t, title: newTitle }]
      .sort((a, b) => a.time - b.time);
    setChapters(updated);
    setNewTime('');
    setNewTitle('');
  };

  const remove = (i) => setChapters(chapters.filter((_, idx) => idx !== i));

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-white/70">
        <BookOpen className="w-4 h-4 text-[#00d4ff]" />
        <span>Chapter Markers</span>
        <span className="ml-auto text-xs text-white/30">{chapters.length} chapters</span>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {chapters.length === 0 && (
          <p className="text-xs text-white/30 text-center py-4">No chapters yet</p>
        )}
        {chapters.map((ch, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
            <span className="text-[#00d4ff] font-mono text-xs w-10 shrink-0">{fmt(ch.time)}</span>
            <span className="text-sm text-white flex-1 truncate">{ch.title}</span>
            <button onClick={() => remove(i)} className="text-white/30 hover:text-red-400">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="number" placeholder="Time (s)" value={newTime}
          onChange={e => setNewTime(e.target.value)}
          className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white"
        />
        <input
          type="text" placeholder="Chapter title..." value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addChapter()}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
        />
        <Button size="sm" variant="outline" className="border-white/10 text-white/60 shrink-0" onClick={addChapter}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="border-white/10 text-white/60" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="bg-[#00d4ff] text-black font-bold gap-2 ml-auto"
          onClick={() => onSave({ chapters })}>
          <Save className="w-3.5 h-3.5" /> Save Chapters
        </Button>
      </div>
    </div>
  );
}