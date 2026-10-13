import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Video, Upload } from 'lucide-react';
import { toast } from 'sonner';
import VODCard from './VODCard';
import VODTrimEditor from './VODTrimEditor';
import ChapterEditor from './ChapterEditor';

var inputStyle = {
  width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'Barlow Condensed, sans-serif',
};

var textareaStyle = {
  width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'Barlow Condensed, sans-serif',
  resize: 'none', minHeight: 80,
};

function Modal(props) {
  var open       = props.open;
  var onClose    = props.onClose;
  var title      = props.title;
  var titleColor = props.titleColor;
  var children   = props.children;

  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#080B18', border: '1px solid ' + (titleColor || 'rgba(212,175,55,0.2)'), borderRadius: 12, padding: 24, maxWidth: 512, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={function(e) { e.stopPropagation(); }}
      >
        <h2 style={{ color: titleColor || '#C9A84C', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function VideoLibrary(props) {
  var creatorId = props.creatorId;

  var qc = useQueryClient();
  var trimTargetState = useState(null);
  var trimTarget    = trimTargetState[0];
  var setTrimTarget = trimTargetState[1];
  var chapterTargetState = useState(null);
  var chapterTarget    = chapterTargetState[0];
  var setChapterTarget = chapterTargetState[1];
  var showAddState = useState(false);
  var showAdd    = showAddState[0];
  var setShowAdd = showAddState[1];
  var newVODState = useState({ title: '', video_url: '', description: '' });
  var newVOD    = newVODState[0];
  var setNewVOD = newVODState[1];

  var vodsQuery = useQuery({
    queryKey: ['vod-library', creatorId],
    queryFn: function() { return base44.entities.VODVideo.filter({ creator_id: creatorId }, '-created_date', 30); },
    enabled: !!creatorId,
  });
  var vods = vodsQuery.data || [];

  var recordingsQuery = useQuery({
    queryKey: ['recordings-for-vod', creatorId],
    queryFn: function() { return base44.entities.Recording.filter({ host_id: creatorId }, '-created_date', 10); },
    enabled: !!creatorId,
  });
  var recordings = recordingsQuery.data || [];

  var updateVOD = useMutation({
    mutationFn: function(params) { return base44.entities.VODVideo.update(params.id, params.data); },
    onError: function() { toast.error('Failed to save changes.'); },
    onSuccess: function() { qc.invalidateQueries({ queryKey: ['vod-library', creatorId] }); toast.success('Saved!'); },
  });

  var createVOD = useMutation({
    mutationFn: function(data) { return base44.entities.VODVideo.create(Object.assign({}, data, { creator_id: creatorId, status: 'draft' })); },
    onError: function() { toast.error('Failed to add VOD. Please try again.'); },
    onSuccess: function(vod) {
      qc.invalidateQueries({ queryKey: ['vod-library', creatorId] });
      setShowAdd(false);
      setNewVOD({ title: '', video_url: '', description: '' });
      toast.success('VOD added to library');
      if (creatorId) {
        base44.entities.Activity.create({
          user_id: creatorId,
          type: 'clip_created',
          title: 'Added VOD: ' + ((vod && vod.title) || 'New Video'),
        }).catch(function() {});
      }
    },
  });

  var importRecording = function(rec) {
    createVOD.mutate({
      title: rec.title,
      video_url: rec.stream_url || '',
      duration_seconds: rec.duration_seconds || 0,
      room_id: rec.room_id,
      thumbnail_url: rec.thumbnail_url || '',
    });
  };

  var handlePublish = function(vod) { updateVOD.mutate({ id: vod.id, data: { status: 'published' } }); };

  var readyRecordings = recordings.filter(function(r) { return r.status === 'ready'; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#C9A84C', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <Video style={{ width: 16, height: 16 }} /> Video Library
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {readyRecordings.length > 0 && (
            <button
              onClick={function() { importRecording(readyRecordings[0]); }}
              style={{
                height: 32, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, borderRadius: 8, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
              }}
            >
              <Upload style={{ width: 14, height: 14 }} /> Import Recording
            </button>
          )}
          <button
            onClick={function() { setShowAdd(true); }}
            style={{
              height: 32, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer',
              background: '#C9A84C', color: '#000', border: 'none',
            }}
          >
            <Plus style={{ width: 14, height: 14 }} /> Add VOD
          </button>
        </div>
      </div>

      {vods.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.3)' }}>
          <Video style={{ width: 40, height: 40, margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>No videos yet — add one or import a past recording</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {vods.map(function(vod) {
            return (
              <VODCard
                key={vod.id}
                vod={vod}
                onTrim={setTrimTarget}
                onChapters={setChapterTarget}
                onPublish={handlePublish}
              />
            );
          })}
        </div>
      )}

      {/* Trim Modal */}
      <Modal open={!!trimTarget} onClose={function() { setTrimTarget(null); }} title="Trim Video" titleColor="#C9A84C">
        {trimTarget && (
          <VODTrimEditor
            video={trimTarget}
            onSave={function(data) { updateVOD.mutate({ id: trimTarget.id, data: data }); setTrimTarget(null); }}
            onCancel={function() { setTrimTarget(null); }}
          />
        )}
      </Modal>

      {/* Chapters Modal */}
      <Modal open={!!chapterTarget} onClose={function() { setChapterTarget(null); }} title="Chapter Markers" titleColor="#C9A84C">
        {chapterTarget && (
          <ChapterEditor
            video={chapterTarget}
            onSave={function(data) { updateVOD.mutate({ id: chapterTarget.id, data: data }); setChapterTarget(null); }}
            onCancel={function() { setChapterTarget(null); }}
          />
        )}
      </Modal>

      {/* Add VOD Modal */}
      <Modal open={showAdd} onClose={function() { setShowAdd(false); }} title="Add VOD to Library" titleColor="#C9A84C">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Video title..."
            value={newVOD.title}
            onChange={function(e) { setNewVOD(function(p) { return Object.assign({}, p, { title: e.target.value }); }); }}
            style={inputStyle}
          />
          <input
            placeholder="Video URL (stream URL, direct link...)"
            value={newVOD.video_url}
            onChange={function(e) { setNewVOD(function(p) { return Object.assign({}, p, { video_url: e.target.value }); }); }}
            style={inputStyle}
          />
          <textarea
            placeholder="Description (optional)..."
            value={newVOD.description}
            onChange={function(e) { setNewVOD(function(p) { return Object.assign({}, p, { description: e.target.value }); }); }}
            rows={3}
            style={textareaStyle}
          />
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button
              onClick={function() { setShowAdd(false); }}
              style={{
                fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
              }}
            >
              Cancel
            </button>
            <button
              disabled={!newVOD.title || createVOD.isPending}
              onClick={function() { createVOD.mutate(newVOD); }}
              style={{
                marginLeft: 'auto', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                background: '#C9A84C', color: '#000', border: 'none',
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
