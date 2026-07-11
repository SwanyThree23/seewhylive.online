import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Video, Upload } from 'lucide-react';
import { toast } from 'sonner';
import VODCard from './VODCard';
import VODTrimEditor from './VODTrimEditor';
import ChapterEditor from './ChapterEditor';

const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'Barlow Condensed, sans-serif',
};

const textareaStyle = {
  ...inputStyle,
  resize: 'none',
  minHeight: 80,
};

function Modal({ open, onClose, title, titleColor, children }) {
  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0d0618', border: `1px solid ${titleColor || 'rgba(212,175,55,0.2)'}`, borderRadius: 12, padding: 24, maxWidth: 512, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ color: titleColor || '#d4af37', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function VideoLibrary({ creatorId }) {
  const qc = useQueryClient();
  const [trimTarget, setTrimTarget] = useState(null);
  const [chapterTarget, setChapterTarget] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newVOD, setNewVOD] = useState({ title: '', video_url: '', description: '' });

  const { data: vods = [] } = useQuery({
    queryKey: ['vod-library', creatorId],
    queryFn: () => base44.entities.VODVideo.filter({ creator_id: creatorId }, '-created_date', 30),
    enabled: !!creatorId,
  });

  const { data: recordings = [] } = useQuery({
    queryKey: ['recordings-for-vod', creatorId],
    queryFn: () => base44.entities.Recording.filter({ host_id: creatorId }, '-created_date', 10),
    enabled: !!creatorId,
  });

  const updateVOD = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VODVideo.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['vod-library', creatorId]); toast.success('Saved!'); },
  });

  const createVOD = useMutation({
    mutationFn: (data) => base44.entities.VODVideo.create({ ...data, creator_id: creatorId, status: 'draft' }),
    onSuccess: () => { qc.invalidateQueries(['vod-library', creatorId]); setShowAdd(false); setNewVOD({ title: '', video_url: '', description: '' }); toast.success('VOD added to library'); },
  });

  const importRecording = (rec) => {
    createVOD.mutate({
      title: rec.title,
      video_url: rec.stream_url || '',
      duration_seconds: rec.duration_seconds || 0,
      room_id: rec.room_id,
      thumbnail_url: rec.thumbnail_url || '',
    });
  };

  const handlePublish = (vod) => updateVOD.mutate({ id: vod.id, data: { status: 'published' } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#d4af37] flex items-center gap-2">
          <Video className="w-4 h-4" /> Video Library
        </h3>
        <div className="flex gap-2">
          {recordings.filter(r => r.status === 'ready').length > 0 && (
            <button
              onClick={() => importRecording(recordings.find(r => r.status === 'ready'))}
              style={{
                height: 32, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, borderRadius: 8, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
              }}
            >
              <Upload className="w-3.5 h-3.5" /> Import Recording
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            style={{
              height: 32, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer',
              background: '#d4af37', color: '#000', border: 'none',
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add VOD
          </button>
        </div>
      </div>

      {vods.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No videos yet — add one or import a past recording</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vods.map(vod => (
            <VODCard
              key={vod.id}
              vod={vod}
              onTrim={setTrimTarget}
              onChapters={setChapterTarget}
              onPublish={handlePublish}
            />
          ))}
        </div>
      )}

      {/* Trim Modal */}
      <Modal open={!!trimTarget} onClose={() => setTrimTarget(null)} title="Trim Video" titleColor="#d4af37">
        {trimTarget && (
          <VODTrimEditor
            video={trimTarget}
            onSave={(data) => { updateVOD.mutate({ id: trimTarget.id, data }); setTrimTarget(null); }}
            onCancel={() => setTrimTarget(null)}
          />
        )}
      </Modal>

      {/* Chapters Modal */}
      <Modal open={!!chapterTarget} onClose={() => setChapterTarget(null)} title="Chapter Markers" titleColor="#00d4ff">
        {chapterTarget && (
          <ChapterEditor
            video={chapterTarget}
            onSave={(data) => { updateVOD.mutate({ id: chapterTarget.id, data }); setChapterTarget(null); }}
            onCancel={() => setChapterTarget(null)}
          />
        )}
      </Modal>

      {/* Add VOD Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add VOD to Library" titleColor="#d4af37">
        <div className="space-y-3">
          <input
            placeholder="Video title..."
            value={newVOD.title}
            onChange={e => setNewVOD(p => ({ ...p, title: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Video URL (stream URL, direct link...)"
            value={newVOD.video_url}
            onChange={e => setNewVOD(p => ({ ...p, video_url: e.target.value }))}
            style={inputStyle}
          />
          <textarea
            placeholder="Description (optional)..."
            value={newVOD.description}
            onChange={e => setNewVOD(p => ({ ...p, description: e.target.value }))}
            rows={3}
            style={textareaStyle}
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowAdd(false)}
              style={{
                fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
              }}
            >
              Cancel
            </button>
            <button
              disabled={!newVOD.title || createVOD.isPending}
              onClick={() => createVOD.mutate(newVOD)}
              style={{
                marginLeft: 'auto', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                background: '#d4af37', color: '#000', border: 'none',
                opacity: (!newVOD.title || createVOD.isPending) ? 0.5 : 1,
              }}
            >
              Add to Library
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
