import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListVideo, Plus, X, Play, Youtube, Video, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

function getYouTubeId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
  return m ? m[1] : null;
}

function detectType(url) {
  return url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'direct';
}

function QueueItem({ item, index, total, isHost, isCurrent, onRemove, onMoveUp, onMoveDown, onPlay }) {
  const ytId = item.type === 'youtube' ? getYouTubeId(item.url) : null;
  const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 rounded-lg p-1.5 group"
      style={{
        background: isCurrent ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
        border: isCurrent ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.07)',
      }}>
      {/* Thumbnail */}
      <div className="w-14 h-9 rounded shrink-0 overflow-hidden bg-black/40 flex items-center justify-center">
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        ) : (
          <Video className="w-4 h-4 text-white/20" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-white/80 truncate">{item.title || item.url}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {item.type === 'youtube'
            ? <Youtube className="w-2.5 h-2.5 text-red-400" />
            : <Video className="w-2.5 h-2.5 text-white/30" />}
          <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Added by {item.addedBy}
          </span>
        </div>
      </div>

      {/* Controls */}
      {isHost && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {index > 0 && (
            <button onClick={() => onMoveUp(index)}
              className="w-5 h-5 flex items-center justify-center rounded"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              <ChevronUp className="w-3 h-3 text-white/40" />
            </button>
          )}
          {index < total - 1 && (
            <button onClick={() => onMoveDown(index)}
              className="w-5 h-5 flex items-center justify-center rounded"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>
          )}
          <button onClick={() => onPlay(item)}
            className="w-5 h-5 flex items-center justify-center rounded"
            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <Play className="w-3 h-3 text-yellow-400" />
          </button>
          <button onClick={() => onRemove(index)}
            className="w-5 h-5 flex items-center justify-center rounded"
            style={{ background: 'rgba(180,50,30,0.15)', border: '1px solid rgba(180,50,30,0.25)' }}>
            <X className="w-3 h-3 text-red-400" />
          </button>
        </div>
      )}

      {isCurrent && (
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0 mr-1" />
      )}
    </motion.div>
  );
}

export default function VideoQueue({ isHost, currentUser, currentVideoUrl, onPlayVideo }) {
  const [queue, setQueue] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const addToQueue = () => {
    const url = urlInput.trim();
    if (!url) return;
    const item = {
      id: `q_${Date.now()}`,
      url,
      title: titleInput.trim() || url,
      type: detectType(url),
      addedBy: currentUser?.full_name || currentUser?.email || 'Someone',
    };
    setQueue(prev => [...prev, item]);
    setUrlInput('');
    setTitleInput('');
    setShowAdd(false);
    toast.success('Added to queue');
  };

  const removeItem = (idx) => {
    setQueue(prev => prev.filter((_, i) => i !== idx));
    if (currentIndex >= idx) setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    setQueue(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx) => {
    setQueue(prev => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const playItem = (item) => {
    const idx = queue.findIndex(q => q.id === item.id);
    setCurrentIndex(idx);
    onPlayVideo?.(item.url);
  };

  const playNext = () => {
    const next = queue[currentIndex + 1];
    if (next) {
      setCurrentIndex(i => i + 1);
      onPlayVideo?.(next.url);
    } else {
      toast('Queue finished!');
    }
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ListVideo className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-[10px] font-black uppercase tracking-widest"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#d4af37' }}>
            Video Queue
          </span>
          {queue.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.25)' }}>
              {queue.length}
            </span>
          )}
        </div>
        {isHost && (
          <button onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>
            <Plus className="w-2.5 h-2.5" /> Add
          </button>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && isHost && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-lg p-2.5 space-y-2"
            style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <input
              placeholder="YouTube URL or direct video URL"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              style={{ width: '100%', height: 28, padding: '0 8px', fontSize: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
            />
            <input
              placeholder="Title (optional)"
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              style={{ width: '100%', height: 28, padding: '0 8px', fontSize: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
            />
            <div className="flex gap-1.5">
              <button
                style={{ flex: 1, height: 28, fontSize: 10, fontWeight: 900, background: urlInput.trim() ? '#d4af37' : 'rgba(255,255,255,0.06)', color: urlInput.trim() ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 6, cursor: urlInput.trim() ? 'pointer' : 'default', fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase' }}
                disabled={!urlInput.trim()}
                onClick={addToQueue}>
                Add to Queue
              </button>
              <button onClick={() => setShowAdd(false)}
                className="w-7 h-7 flex items-center justify-center rounded"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <X className="w-3 h-3 text-white/40" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue list */}
      <div className="space-y-1">
        <AnimatePresence>
          {queue.map((item, idx) => (
            <QueueItem
              key={item.id}
              item={item}
              index={idx}
              total={queue.length}
              isHost={isHost}
              isCurrent={idx === currentIndex && currentVideoUrl === item.url}
              onRemove={removeItem}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onPlay={playItem}
            />
          ))}
        </AnimatePresence>
      </div>

      {queue.length === 0 && (
        <p className="text-center text-[10px] py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {isHost ? 'Add videos to build the queue' : 'No videos queued yet'}
        </p>
      )}

      {/* Next up */}
      {isHost && queue.length > 0 && currentIndex < queue.length - 1 && (
        <button
          style={{ width: '100%', height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 10, fontWeight: 900, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase' }}
          onClick={playNext}>
          <Play className="w-3 h-3" /> Play Next
        </button>
      )}
    </div>
  );
}