import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Radio, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function GlobalSearch(props) {
  var onClose = props.onClose;

  var queryState = useState('');
  var query = queryState[0];
  var setQuery = queryState[1];

  var roomsState = useState([]);
  var rooms = roomsState[0];
  var setRooms = roomsState[1];

  var commState = useState([]);
  var communities = commState[0];
  var setCommunities = commState[1];

  var loadingState = useState(false);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var inputRef = useRef(null);

  useEffect(function() {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(function() {
    if (!query.trim()) { setRooms([]); setCommunities([]); return; }
    var timer = setTimeout(async function() {
      setLoading(true);
      try {
        var results = await Promise.all([
          base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 10),
          base44.entities.Community.list('-member_count', 10),
        ]);
        var r = results[0];
        var c = results[1];
        var q = query.toLowerCase();
        setRooms(r.filter(function(x) { return x.title && x.title.toLowerCase().indexOf(q) !== -1; }));
        setCommunities(c.filter(function(x) { return x.name && x.name.toLowerCase().indexOf(q) !== -1; }));
      } catch (e) {}
      setLoading(false);
    }, 300);
    return function() { clearTimeout(timer); };
  }, [query]);

  var hasResults = rooms.length > 0 || communities.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={function(e) { e.stopPropagation(); }}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={function(e) { setQuery(e.target.value); }}
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
                {rooms.map(function(r) {
                  return (
                    <Link key={r.id} to={createPageUrl('Room') + '?id=' + r.id} onClick={onClose}>
                      <div className="flex items-center gap-3 px-3 py-2 hover:bg-[rgba(255,255,255,0.04)] rounded-xl">
                        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                          <Radio className="w-3.5 h-3.5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.title}</p>
                          <p className="text-[10px] text-muted-foreground">{r.viewer_count || 0} watching</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {communities.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] text-muted-foreground uppercase px-2 mb-1">Communities</p>
                {communities.map(function(c) {
                  return (
                    <Link key={c.id} to={createPageUrl('Community') + '?id=' + c.id} onClick={onClose}>
                      <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-[#5B7FA6]" />
                        </div>
                        <p className="text-sm font-medium truncate">{c.name}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
