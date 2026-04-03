import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Radio, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [rooms, setRooms] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setRooms([]); setCommunities([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const [r, c] = await Promise.all([
        base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 10),
        base44.entities.Community.list('-member_count', 10),
      ]);
      const q = query.toLowerCase();
      setRooms(r.filter(x => x.title?.toLowerCase().includes(q)));
      setCommunities(c.filter(x => x.name?.toLowerCase().includes(q)));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const hasResults = rooms.length > 0 || communities.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search rooms, communities..."
            className="flex-1 text-base outline-none"
          />
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {query && (
          <div className="max-h-80 overflow-y-auto">
            {loading && <p className="text-sm text-muted-foreground text-center py-6">Searching...</p>}
            {!loading && !hasResults && <p className="text-sm text-muted-foreground text-center py-6">No results for "{query}"</p>}

            {rooms.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] text-muted-foreground uppercase px-2 mb-1">Live Rooms</p>
                {rooms.map(r => (
                  <Link key={r.id} to={createPageUrl('Room') + `?id=${r.id}`} onClick={onClose}>
                    <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                        <Radio className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-[10px] text-muted-foreground">{r.viewer_count || 0} watching</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {communities.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] text-muted-foreground uppercase px-2 mb-1">Communities</p>
                {communities.map(c => (
                  <Link key={c.id} to={createPageUrl('Community') + `?id=${c.id}`} onClick={onClose}>
                    <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium truncate">{c.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}