import React, { useState } from 'react';
import { Plus, Trash2, BookOpen, Save } from 'lucide-react';

export default function ChapterEditor(props) {
  var video    = props.video;
  var onSave   = props.onSave;
  var onCancel = props.onCancel;

  var chapState = useState(video.chapters || []);
  var chapters  = chapState[0];
  var setChapters = chapState[1];
  var timeState = useState('');
  var newTime   = timeState[0];
  var setNewTime = timeState[1];
  var titleState = useState('');
  var newTitle  = titleState[0];
  var setNewTitle = titleState[1];

  var fmt = function(s) {
    var m   = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  };

  var addChapter = function() {
    if (!newTitle || newTime === '') return;
    var t = Number(newTime);
    var updated = chapters.concat([{ time: t, title: newTitle }]);
    updated.sort(function(a, b) { return a.time - b.time; });
    setChapters(updated);
    setNewTime('');
    setNewTitle('');
  };

  var remove = function(i) {
    setChapters(chapters.filter(function(_, idx) { return idx !== i; }));
  };

  var inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '6px 12px', fontSize: 14, color: '#fff', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
        <BookOpen style={{ width: 16, height: 16, color: '#C9A84C' }} />
        <span>Chapter Markers</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{chapters.length} chapters</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 192, overflowY: 'auto', paddingRight: 4 }}>
        {chapters.length === 0 && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '16px 0', margin: 0 }}>No chapters yet</p>
        )}
        {chapters.map(function(ch, i) {
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '8px 12px' }}>
              <span style={{ color: '#C9A84C', fontFamily: 'monospace', fontSize: 12, width: 40, flexShrink: 0 }}>{fmt(ch.time)}</span>
              <span style={{ fontSize: 14, color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.title}</span>
              <button
                onClick={function() { remove(i); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.3)' }}
              >
                <Trash2 style={{ width: 14, height: 14 }} />
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number" placeholder="Time (s)" value={newTime}
          onChange={function(e) { setNewTime(e.target.value); }}
          style={{ ...inputStyle, width: 96 }}
        />
        <input
          type="text" placeholder="Chapter title..." value={newTitle}
          onChange={function(e) { setNewTitle(e.target.value); }}
          onKeyDown={function(e) { if (e.key === 'Enter') addChapter(); }}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={addChapter}
          style={{
            padding: '6px 10px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
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
          onClick={function() { onSave({ chapters: chapters }); }}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            background: '#C9A84C', color: '#000', border: 'none',
          }}
        >
          <Save style={{ width: 14, height: 14 }} /> Save Chapters
        </button>
      </div>
    </div>
  );
}
