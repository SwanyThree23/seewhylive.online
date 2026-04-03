import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Video, Upload } from 'lucide-react';
import { toast } from 'sonner';
import VODCard from './VODCard';
import VODTrimEditor from './VODTrimEditor';
import ChapterEditor from './ChapterEditor';

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
            <Button size="sm" variant="outline" className="border-white/10 text-white/60 text-xs h-8 gap-1.5"
              onClick={() => importRecording(recordings.find(r => r.status === 'ready'))}>
              <Upload className="w-3.5 h-3.5" /> Import Recording
            </Button>
          )}
          <Button size="sm" className="bg-[#d4af37] text-black font-bold text-xs h-8 gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5" /> Add VOD
          </Button>
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

      {/* Trim Dialog */}
      <Dialog open={!!trimTarget} onOpenChange={() => setTrimTarget(null)}>
        <DialogContent className="bg-[#0d0618] border-[#d4af37]/20 text-white max-w-lg">
          <DialogHeader><DialogTitle className="text-[#d4af37]">Trim Video</DialogTitle></DialogHeader>
          {trimTarget && (
            <VODTrimEditor
              video={trimTarget}
              onSave={(data) => { updateVOD.mutate({ id: trimTarget.id, data }); setTrimTarget(null); }}
              onCancel={() => setTrimTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Chapters Dialog */}
      <Dialog open={!!chapterTarget} onOpenChange={() => setChapterTarget(null)}>
        <DialogContent className="bg-[#0d0618] border-[#00d4ff]/20 text-white max-w-lg">
          <DialogHeader><DialogTitle className="text-[#00d4ff]">Chapter Markers</DialogTitle></DialogHeader>
          {chapterTarget && (
            <ChapterEditor
              video={chapterTarget}
              onSave={(data) => { updateVOD.mutate({ id: chapterTarget.id, data }); setChapterTarget(null); }}
              onCancel={() => setChapterTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add VOD Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#0d0618] border-[#d4af37]/20 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-[#d4af37]">Add VOD to Library</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input
              placeholder="Video title..."
              value={newVOD.title}
              onChange={e => setNewVOD(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              placeholder="Video URL (stream URL, direct link...)"
              value={newVOD.video_url}
              onChange={e => setNewVOD(p => ({ ...p, video_url: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
            <textarea
              placeholder="Description (optional)..."
              value={newVOD.description}
              onChange={e => setNewVOD(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
            />
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="border-white/10 text-white/60" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button size="sm" className="bg-[#d4af37] text-black font-bold ml-auto"
                disabled={!newVOD.title || createVOD.isPending}
                onClick={() => createVOD.mutate(newVOD)}>
                Add to Library
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}