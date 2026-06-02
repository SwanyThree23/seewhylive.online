import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, GripVertical, Trash2, Play, Music2, List } from 'lucide-react';

function parseYouTubeId(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function WatchQueue({ isHost, currentIndex = 0, onSelect }) {
  const [queue, setQueue] = useState([
    { id: '1', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Video 1', thumb: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg' },
  ]);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);

  const addVideo = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setLoading(true);
    const ytId = parseYouTubeId(trimmed);
    const newItem = {
      id: Date.now().toString(),
      url: trimmed,
      title: ytId ? `YouTube · ${ytId}` : trimmed,
      thumb: ytId ? `https://img.youtube.com/vi/${ytId}/default.jpg` : null,
    };
    setQueue(prev => [...prev, newItem]);
    setUrlInput('');
    setLoading(false);
  };

  const removeItem = (id) => setQueue(prev => prev.filter(item => item.id !== id));

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(queue);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setQueue(items);
  };

  return (
    <div className="bg-[rgba(13,6,24,0.9)] border border-[rgba(212,175,55,0.15)] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <List className="w-3.5 h-3.5 text-[#d4af37]" />
        <span className="text-xs font-semibold text-[#d4af37]">Watch Queue</span>
        <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, padding: '1px 6px', marginLeft: 'auto' }}>{queue.length} videos</span>
      </div>

      {/* Queue list */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="watch-queue" isDropDisabled={!isHost}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="max-h-64 overflow-y-auto">
              <AnimatePresence>
                {queue.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!isHost}>
                    {(drag) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        className={`flex items-center gap-2 px-3 py-2 border-b border-white/5 hover:bg-white/5 cursor-pointer group transition-colors ${
                          index === currentIndex ? 'bg-[#d4af37]/5 border-l-2 border-[#d4af37]' : ''
                        }`}
                        onClick={() => onSelect?.(index)}
                      >
                        {isHost && (
                          <div {...drag.dragHandleProps} className="text-white/20 hover:text-white/50 shrink-0">
                            <GripVertical className="w-3 h-3" />
                          </div>
                        )}
                        {item.thumb
                          ? <img src={item.thumb} alt="" className="w-12 h-8 rounded object-cover shrink-0" />
                          : <div className="w-12 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                              <Music2 className="w-3 h-3 text-white/30" />
                            </div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{item.title}</p>
                          {index === currentIndex && (
                            <div className="flex items-center gap-1">
                              <Play className="w-2.5 h-2.5 text-[#d4af37]" />
                              <span className="text-[9px] text-[#d4af37]">Now Playing</span>
                            </div>
                          )}
                        </div>
                        {isHost && index !== currentIndex && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add video (host only) */}
      {isHost && (
        <div className="p-3 border-t border-white/5">
          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addVideo()}
              placeholder="Paste YouTube URL..."
              style={{ flex: 1, height: 28, padding: '0 8px', fontSize: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
            />
            <button
              onClick={addVideo}
              disabled={loading || !urlInput.trim()}
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d4af37', border: 'none', borderRadius: 6, color: '#000', cursor: (loading || !urlInput.trim()) ? 'default' : 'pointer', opacity: (loading || !urlInput.trim()) ? 0.5 : 1, flexShrink: 0 }}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}