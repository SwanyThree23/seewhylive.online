import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListMusic, Plus, Play, Trash2, ThumbsUp, Youtube, Video } from 'lucide-react';

function getYouTubeThumbnail(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

function detectType(url) {
  return url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'direct';
}

export default function CollabPlaylist({ isHost, currentUser, onPlayVideo }) {
  const [items, setItems] = useState([]);
  const [inputUrl, setInputUrl] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [currentIdx, setCurrentIdx] = useState(null);

  const addItem = () => {
    if (!inputUrl.trim()) return;
    const type = detectType(inputUrl);
    const thumb = type === 'youtube' ? getYouTubeThumbnail(inputUrl) : null;
    setItems(prev => [...prev, {
      id: Date.now(),
      url: inputUrl.trim(),
      title: inputTitle.trim() || inputUrl.trim().slice(0, 40),
      type,
      thumb,
      addedBy: currentUser?.full_name || 'Guest',
      votes: 0,
      myVote: false,
    }]);
    setInputUrl('');
    setInputTitle('');
  };

  const vote = (id) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, votes: item.myVote ? item.votes - 1 : item.votes + 1, myVote: !item.myVote }
        : item
    ));
  };

  const remove = (id) => setItems(prev => prev.filter(item => item.id !== id));

  const play = (item, idx) => {
    setCurrentIdx(idx);
    onPlayVideo && onPlayVideo(item.url, item.type);
  };

  const sorted = [...items].sort((a, b) => b.votes - a.votes);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.97)', border: '1px solid rgba(212,175,55,0.18)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
        <ListMusic className="w-3.5 h-3.5 text-yellow-400" />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#d4af37' }}>
          Collab Playlist
        </span>
        <span className="ml-auto text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{items.length} videos</span>
      </div>

      {/* Add form */}
      <div className="p-2.5 space-y-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <input
          placeholder="YouTube or video URL..."
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          style={{ width: '100%', height: 28, padding: '0 8px', fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
        />
        <div className="flex gap-1.5">
          <input
            placeholder="Title (optional)"
            value={inputTitle}
            onChange={e => setInputTitle(e.target.value)}
            style={{ flex: 1, height: 28, padding: '0 8px', fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
          />
          <button
            style={{ height: 28, padding: '0 10px', background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37', borderRadius: 6, cursor: inputUrl.trim() ? 'pointer' : 'default', opacity: inputUrl.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', flexShrink: 0 }}
            disabled={!inputUrl.trim()} onClick={addItem}>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Playlist */}
      <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
        <AnimatePresence>
          {sorted.length === 0 && (
            <div className="px-3 py-4 text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              No videos yet — add one above!
            </div>
          )}
          {sorted.map((item, idx) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-2.5 py-2"
              style={{ background: currentIdx === idx ? 'rgba(212,175,55,0.07)' : 'transparent' }}>
              {/* Thumb */}
              <div className="w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                {item.thumb
                  ? <img src={item.thumb} className="w-full h-full object-cover" alt="" />
                  : item.type === 'youtube'
                    ? <Youtube className="w-3 h-3 text-red-400" />
                    : <Video className="w-3 h-3 text-white/40" />}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{item.title}</p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.addedBy}</p>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => vote(item.id)}
                  className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[11px] font-bold"
                  style={{ background: item.myVote ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)', color: item.myVote ? '#d4af37' : 'rgba(255,255,255,0.4)' }}>
                  <ThumbsUp className="w-2.5 h-2.5" /> {item.votes}
                </button>
                {isHost && (
                  <>
                    <button onClick={() => play(item, idx)}
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ background: 'rgba(107,124,74,0.2)', border: '1px solid rgba(107,124,74,0.3)' }}>
                      <Play className="w-2.5 h-2.5 text-[#6DBF7E]" />
                    </button>
                    <button onClick={() => remove(item.id)}
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ background: 'rgba(180,50,30,0.15)', border: '1px solid rgba(180,50,30,0.25)' }}>
                      <Trash2 className="w-2.5 h-2.5 text-red-400" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}