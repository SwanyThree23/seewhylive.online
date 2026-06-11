import React, { useState } from 'react';
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

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '6px 12px', fontSize: 14, color: '#fff', outline: 'none',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-white/70">
        <BookOpen className="w-4 h-4 text-[#D4AF37]" />
        <span>Chapter Markers</span>
        <span className="ml-auto text-xs text-white/30">{chapters.length} chapters</span>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {chapters.length === 0 && (
          <p className="text-xs text-white/30 text-center py-4">No chapters yet</p>
        )}
        {chapters.map((ch, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
            <span className="text-[#D4AF37] font-mono text-xs w-10 shrink-0">{fmt(ch.time)}</span>
            <span className="text-sm text-white flex-1 truncate">{ch.title}</span>
            <button onClick={() => remove(i)} className="text-white/30 hover:text-red-400" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="number" placeholder="Time (s)" value={newTime}
          onChange={e => setNewTime(e.target.value)}
          style={{ ...inputStyle, width: 96 }}
        />
        <input
          type="text" placeholder="Chapter title..." value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addChapter()}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={addChapter}
          style={{
            padding: '6px 10px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          style={{
            fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ chapters })}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            background: '#D4AF37', color: '#000', border: 'none',
          }}
        >
          <Save className="w-3.5 h-3.5" /> Save Chapters
        </button>
      </div>
    </div>
  );
}
