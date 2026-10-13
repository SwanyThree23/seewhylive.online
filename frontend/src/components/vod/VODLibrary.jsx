import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Play, Eye, ThumbsUp, Share2, Trash2 } from 'lucide-react';

var G      = '#D4AF37';
var BG     = '#080B18';
var BORDER = 'rgba(212,175,55,0.18)';

export default function VODLibrary(props) {
  var creatorId = props.creatorId;

  var filterState = useState('all');
  var filter    = filterState[0];
  var setFilter = filterState[1];

  var vodsQuery = useQuery({
    queryKey: ['creatorVODs', creatorId],
    queryFn: function() {
      return base44.entities.VODVideo.filter({ creator_id: creatorId }, '-updated_date', 50);
    },
    enabled: !!creatorId,
  });
  var vods = vodsQuery.data;

  var clipsQuery = useQuery({
    queryKey: ['creatorClips', creatorId],
    queryFn: function() {
      return base44.entities.StreamClip.filter({ creator_id: creatorId }, '-created_date', 50);
    },
    enabled: !!creatorId,
  });
  var clips = clipsQuery.data;

  var filteredItems = filter === 'vods' ? vods : filter === 'clips' ? clips : [].concat(vods || [], clips || []);

  var formatDuration = function(sec) {
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    return h > 0 ? (h + 'h ' + m + 'm') : (m + 'm ' + s + 's');
  };

  var vodCount   = (vods && vods.length) || 0;
  var clipCount  = (clips && clips.length) || 0;
  var totalCount = vodCount + clipCount;

  var filterLabels = { all: 'ALL (' + totalCount + ')', vods: 'VODS (' + vodCount + ')', clips: 'CLIPS (' + clipCount + ')' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8 }}>
        {['all', 'vods', 'clips'].map(function(f) {
          return (
            <button
              key={f}
              onClick={function() { setFilter(f); }}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: filter === f ? G + '20' : 'rgba(255,255,255,0.03)',
                color: filter === f ? G : 'rgba(255,255,255,0.5)',
                border: filter === f ? '1px solid ' + G + '40' : '1px solid ' + BORDER,
              }}
            >
              {filterLabels[f]}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {filteredItems && filteredItems.map(function(item, idx) {
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{ borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: BG, border: '1px solid ' + BORDER }}
            >
              {/* Thumbnail */}
              <div style={{ position: 'relative', height: 160, background: '#000', overflow: 'hidden' }}>
                <img
                  src={item.thumbnail_url || undefined}
                  onError={function(e) { e.target.style.display = 'none'; }}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: 'rgba(0,0,0,0.8)', color: G }}>
                  {formatDuration(item.duration_seconds || (item.end_timestamp_seconds - item.start_timestamp_seconds))}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye style={{ width: 12, height: 12 }} />
                    {item.views || item.view_count || 0}
                  </div>
                  {item.like_count !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ThumbsUp style={{ width: 12, height: 12 }} />
                      {item.like_count || 0}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, paddingTop: 8 }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: G + '20', color: G }}
                  >
                    <Share2 style={{ width: 12, height: 12, margin: '0 auto', display: 'block' }} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)' }}
                  >
                    <Trash2 style={{ width: 12, height: 12, margin: '0 auto', display: 'block' }} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {(!filteredItems || filteredItems.length === 0) && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No {filter === 'all' ? 'content' : filter} yet</p>
        </div>
      )}
    </div>
  );
}
