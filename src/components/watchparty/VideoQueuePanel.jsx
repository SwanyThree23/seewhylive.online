import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, ThumbsUp, ThumbsDown, SkipForward, Trash2, CheckCircle, Youtube, Video, ListVideo } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const BURGUNDY = '#800020';

function formatDuration(secs) {
  if (!secs) return '--:--';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getYtThumb(url) {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

function StatusBadge({ status }) {
  const cfg = {
    queued:   { label: 'Queued',   bg: `rgba(212,175,55,0.15)`,  color: GOLD,     border: `rgba(212,175,55,0.3)` },
    playing:  { label: 'Playing',  bg: `rgba(0,255,136,0.12)`,   color: '#00FF88', border: `rgba(0,255,136,0.3)`, pulse: true },
    played:   { label: 'Played',   bg: `rgba(255,255,255,0.05)`, color: 'rgba(255,255,255,0.3)', border: 'rgba(255,255,255,0.1)' },
    skipped:  { label: 'Skipped',  bg: `rgba(128,0,32,0.2)`,     color: '#ff6680', border: `rgba(128,0,32,0.4)` },
    removed:  { label: 'Removed',  bg: `rgba(128,0,32,0.15)`,    color: '#ff6680', border: `rgba(128,0,32,0.3)` },
    pending:  { label: 'Pending ✓',bg: `rgba(139,92,246,0.15)`,  color: '#8B5CF6', border: `rgba(139,92,246,0.3)` },
  }[status] || { label: status, bg: 'transparent', color: 'gray', border: 'gray' };

  return (
    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
      {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />}
      {cfg.label}
    </span>
  );
}

function AddVideoModal({ partyId, currentUser, nextPosition, requireApproval, onClose, onAdded }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () => base44.entities.VideoQueue.create({
      party_id: partyId,
      added_by_id: currentUser.id,
      added_by_name: currentUser.full_name || currentUser.email,
      title: title.trim() || url,
      video_url: url.trim(),
      video_type: url.includes('youtube') || url.includes('youtu.be') ? 'youtube' : 'direct',
      thumbnail_url: getYtThumb(url) || '',
      position: nextPosition,
      status: 'queued',
      host_approved: !requireApproval,
      require_host_approval: requireApproval,
      votes_up: 0,
      votes_down: 0,
      voter_ids: [],
      notes: notes.trim(),
    }),
    onSuccess: (item) => {
      qc.invalidateQueries(['vq', partyId]);
      onAdded(item);
      onClose();
      toast.success(requireApproval ? 'Added — waiting for host approval' : 'Added to queue!');
    },
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-xl p-5 space-y-3"
        style={{ background: '#1A1A1A', border: `1px solid rgba(212,175,55,0.25)` }}
        onClick={e => e.stopPropagation()}>
        <h3 className="font-black text-white uppercase tracking-wide text-sm"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: GOLD }}>
          Add to Queue
        </h3>
        <input placeholder="Video URL (YouTube or direct)"
          value={url} onChange={e => setUrl(e.target.value)}
          style={{ width: '100%', height: 32, padding: '0 10px', fontSize: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }} />
        <input placeholder="Title (optional)"
          value={title} onChange={e => setTitle(e.target.value)}
          style={{ width: '100%', height: 32, padding: '0 10px', fontSize: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }} />
        <input placeholder="Notes (optional)"
          value={notes} onChange={e => setNotes(e.target.value)}
          style={{ width: '100%', height: 32, padding: '0 10px', fontSize: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }} />
        <div className="flex gap-2">
          <button
            style={{ flex: 1, height: 32, fontSize: 10, fontWeight: 900, background: GOLD, color: '#000', border: 'none', borderRadius: 8, cursor: (!url.trim() || mut.isPending) ? 'default' : 'pointer', opacity: (!url.trim() || mut.isPending) ? 0.6 : 1, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase' }}
            disabled={!url.trim() || mut.isPending}
            onClick={() => mut.mutate()}>
            {mut.isPending ? 'Adding…' : 'Add Video'}
          </button>
          <button onClick={onClose}
            className="px-3 h-8 rounded-md text-[10px] font-bold"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function QueueItem({ item, isHost, currentUser, onPlayVideo }) {
  const qc = useQueryClient();
  const alreadyVoted = item.voter_ids?.includes(currentUser?.id);
  const isPlaying = item.status === 'playing';
  const isPending = item.require_host_approval && !item.host_approved;

  const voteMut = useMutation({
    mutationFn: ({ dir }) => base44.entities.VideoQueue.update(item.id, {
      [dir === 'up' ? 'votes_up' : 'votes_down']: (item[dir === 'up' ? 'votes_up' : 'votes_down'] || 0) + 1,
      voter_ids: [...(item.voter_ids || []), currentUser.id],
    }),
    onSuccess: () => qc.invalidateQueries(['vq', item.party_id]),
  });

  const actionMut = useMutation({
    mutationFn: (data) => base44.entities.VideoQueue.update(item.id, data),
    onSuccess: () => qc.invalidateQueries(['vq', item.party_id]),
  });

  const thumb = item.thumbnail_url || getYtThumb(item.video_url);

  return (
    <motion.div layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 rounded-lg p-2 group"
      style={{
        background: isPlaying ? 'rgba(212,175,55,0.08)' : isPending ? 'rgba(139,92,246,0.07)' : 'rgba(255,255,255,0.03)',
        border: isPlaying ? `1px solid rgba(212,175,55,0.35)` : isPending ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(255,255,255,0.07)',
        borderLeft: isPlaying ? `3px solid ${GOLD}` : undefined,
      }}>

      {/* Thumbnail */}
      <div className="w-16 h-10 rounded shrink-0 overflow-hidden bg-black/50 flex items-center justify-center">
        {thumb
          ? <img src={thumb} alt="" className="w-full h-full object-cover" />
          : <Video className="w-4 h-4 text-white/20" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isPlaying && (
            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded animate-pulse"
              style={{ background: 'rgba(212,175,55,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
              ▶ NOW PLAYING
            </span>
          )}
          <StatusBadge status={isPending ? 'pending' : item.status} />
        </div>
        <p className="text-[10px] font-bold text-white/80 truncate mt-0.5">{item.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{item.added_by_name}</span>
          <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{formatDuration(item.duration_seconds)}</span>
        </div>
      </div>

      {/* Votes + Host Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {item.status === 'queued' && !isPending && (
          <>
            <button disabled={alreadyVoted}
              onClick={() => voteMut.mutate({ dir: 'up' })}
              className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[9px] font-bold transition-all"
              style={{ background: 'rgba(0,255,136,0.1)', color: alreadyVoted ? 'rgba(255,255,255,0.2)' : '#00FF88', border: '1px solid rgba(0,255,136,0.2)' }}>
              <ThumbsUp className="w-2.5 h-2.5" />{item.votes_up || 0}
            </button>
            <button disabled={alreadyVoted}
              onClick={() => voteMut.mutate({ dir: 'down' })}
              className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[9px] font-bold transition-all"
              style={{ background: 'rgba(128,0,32,0.12)', color: alreadyVoted ? 'rgba(255,255,255,0.2)' : '#ff6680', border: '1px solid rgba(128,0,32,0.25)' }}>
              <ThumbsDown className="w-2.5 h-2.5" />{item.votes_down || 0}
            </button>
          </>
        )}
        {isHost && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isPending && (
              <button onClick={() => actionMut.mutate({ host_approved: true })}
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)' }}>
                <CheckCircle className="w-3 h-3 text-green-400" />
              </button>
            )}
            {item.status === 'queued' && (
              <button onClick={() => { actionMut.mutate({ status: 'playing', started_at: new Date().toISOString() }); onPlayVideo?.(item.video_url); }}
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: `rgba(212,175,55,0.15)`, border: `1px solid rgba(212,175,55,0.3)` }}>
                <SkipForward className="w-3 h-3" style={{ color: GOLD }} />
              </button>
            )}
            {['queued', 'playing'].includes(item.status) && (
              <button onClick={() => actionMut.mutate({ status: 'skipped', ended_at: new Date().toISOString() })}
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: 'rgba(128,0,32,0.15)', border: '1px solid rgba(128,0,32,0.3)' }}>
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function VideoQueuePanel({ partyId, party, isHost, currentUser, onPlayVideo }) {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['vq', partyId],
    queryFn: () => base44.entities.VideoQueue.filter({ party_id: partyId }, 'position', 50),
    enabled: !!partyId,
    refetchInterval: 5000,
  });

  const requireApproval = party?.require_host_approval || false;
  const visible = items.filter(i => i.status !== 'removed');
  const playing = visible.find(i => i.status === 'playing');
  const queued = visible.filter(i => i.status === 'queued').sort((a, b) => (b.votes_up || 0) - (b.votes_down || 0) - ((a.votes_up || 0) - (a.votes_down || 0)));
  const rest = visible.filter(i => ['played', 'skipped'].includes(i.status));
  const nextPosition = visible.length;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ListVideo className="w-3.5 h-3.5" style={{ color: GOLD }} />
          <span className="text-[10px] font-black uppercase tracking-widest"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: GOLD }}>
            Video Queue
          </span>
          {queued.length > 0 && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black"
              style={{ background: 'rgba(212,175,55,0.15)', color: GOLD, border: `1px solid rgba(212,175,55,0.25)` }}>
              {queued.length}
            </span>
          )}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded uppercase"
          style={{ background: `rgba(212,175,55,0.12)`, border: `1px solid rgba(212,175,55,0.25)`, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
          <Plus className="w-2.5 h-2.5" /> Add Video
        </button>
      </div>

      {/* Now playing */}
      {playing && (
        <div>
          <div className="text-[8px] font-black uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>Now Playing</div>
          <QueueItem item={playing} isHost={isHost} currentUser={currentUser} onPlayVideo={onPlayVideo} />
        </div>
      )}

      {/* Queued */}
      {queued.length > 0 && (
        <div>
          <div className="text-[8px] font-black uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>Up Next</div>
          <div className="space-y-1">
            <AnimatePresence>
              {queued.map(item => (
                <QueueItem key={item.id} item={item} isHost={isHost} currentUser={currentUser} onPlayVideo={onPlayVideo} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* History */}
      {rest.length > 0 && (
        <div>
          <div className="text-[8px] font-black uppercase mb-1" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'Barlow Condensed, sans-serif' }}>History</div>
          <div className="space-y-1 opacity-50">
            {rest.map(item => (
              <QueueItem key={item.id} item={item} isHost={isHost} currentUser={currentUser} />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {visible.length === 0 && (
        <div className="text-center py-8 space-y-3">
          <ListVideo className="w-8 h-8 mx-auto" style={{ color: 'rgba(212,175,55,0.2)' }} />
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Queue is empty — be the first to add a video!</p>
          <button onClick={() => setShowModal(true)}
            className="text-[10px] font-black uppercase px-4 py-2 rounded-lg"
            style={{ background: `rgba(212,175,55,0.12)`, border: `1px solid rgba(212,175,55,0.25)`, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
            + Add First Video
          </button>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <AddVideoModal
            partyId={partyId}
            currentUser={currentUser}
            nextPosition={nextPosition}
            requireApproval={requireApproval}
            onClose={() => setShowModal(false)}
            onAdded={() => qc.invalidateQueries(['vq', partyId])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}