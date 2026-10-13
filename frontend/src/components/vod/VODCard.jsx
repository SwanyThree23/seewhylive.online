import React from 'react';
import { motion } from 'framer-motion';
import { Play, Scissors, BookOpen, Eye, Globe, Edit } from 'lucide-react';

export default function VODCard(props) {
  var vod        = props.vod;
  var onEdit     = props.onEdit;
  var onTrim     = props.onTrim;
  var onChapters = props.onChapters;
  var onPublish  = props.onPublish;

  var fmt = function(s) {
    var m   = Math.floor((s || 0) / 60);
    var sec = Math.floor((s || 0) % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  };

  var trimmedDuration = (vod.trim_end || vod.duration_seconds || 0) - (vod.trim_start || 0);

  var statusStyles = {
    published: { color: '#6DBF7E', borderColor: '#4A9B5E', background: 'rgba(109,191,126,0.12)' },
    draft:     { color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' },
    unlisted:  { color: '#C9A84C', borderColor: '#800020', background: 'rgba(113,63,18,0.2)' },
  };
  var statusStyle = statusStyles[vod.status] || statusStyles.draft;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 12, overflow: 'hidden', color: '#fff' }}>
        {/* Thumbnail */}
        <div style={{ position: 'relative', height: 144, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F1428, #080B18)' }}>
          {vod.thumbnail_url
            ? <img src={vod.thumbnail_url} alt={vod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Play style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.1)' }} />
          }
          {/* Status badge */}
          <span style={{
            position: 'absolute', bottom: 8, right: 8, fontSize: 10, padding: '2px 8px',
            borderRadius: 99, fontWeight: 900, border: '1px solid',
            color: statusStyle.color, borderColor: statusStyle.borderColor, background: statusStyle.background,
          }}>
            {vod.status}
          </span>
          {vod.is_clipped && (
            <span style={{
              position: 'absolute', top: 8, left: 8, fontSize: 10, padding: '2px 8px',
              borderRadius: 99, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)',
            }}>
              <Scissors style={{ width: 10, height: 10 }} /> Clipped
            </span>
          )}
          <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, color: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', background: 'rgba(0,0,0,0.7)' }}>
            {fmt(trimmedDuration)}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{vod.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
            <Eye style={{ width: 12, height: 12 }} /> {vod.views || 0} views
            {vod.chapters && vod.chapters.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                <BookOpen style={{ width: 12, height: 12 }} />{vod.chapters.length} chapters
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
            <button
              onClick={function() { if (onEdit) onEdit(vod); }}
              style={{
                height: 28, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10, borderRadius: 6, cursor: 'pointer',
                background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none',
              }}
            >
              <Edit style={{ width: 12, height: 12 }} /> Edit
            </button>
            <button
              onClick={function() { onTrim(vod); }}
              style={{
                height: 28, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10, borderRadius: 6, cursor: 'pointer',
                background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none',
              }}
            >
              <Scissors style={{ width: 12, height: 12 }} /> Trim
            </button>
            <button
              onClick={function() { onChapters(vod); }}
              style={{
                height: 28, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10, borderRadius: 6, cursor: 'pointer',
                background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none',
              }}
            >
              <BookOpen style={{ width: 12, height: 12 }} /> Chapters
            </button>
            {vod.status !== 'published' && (
              <button
                onClick={function() { onPublish(vod); }}
                style={{
                  marginLeft: 'auto', height: 28, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                  background: '#C9A84C', color: '#000', border: 'none',
                }}
              >
                <Globe style={{ width: 12, height: 12 }} /> Publish
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
