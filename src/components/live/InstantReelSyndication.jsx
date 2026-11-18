import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Share2, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

var GOLD = '#C9A84C';

var PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok Short',        icon: '🎵', color: '#ff0050', maxSec: 60,  ratio: '9:16', fmt: 'MP4 / H.264' },
  { id: 'instagram', label: 'Instagram Reel',       icon: '📸', color: '#E1306C', maxSec: 90,  ratio: '9:16', fmt: 'MP4 / H.264' },
  { id: 'spotify',   label: 'Spotify Master Tape',  icon: '🎧', color: '#1DB954', maxSec: 180, ratio: 'Audio', fmt: 'MP3 / 320kbps' },
  { id: 'youtube',   label: 'YouTube VOD Archive',  icon: '▶️',  color: '#FF0000', maxSec: 0,   ratio: '16:9', fmt: 'MP4 / H.264' },
];

export default function InstantReelSyndication(props) {
  var isHost = props.isHost;
  var streamTitle = props.streamTitle || '';
  var [expanded, setExpanded] = useState(false);
  var [clipUrl, setClipUrl] = useState('');
  var [exporting, setExporting] = useState({});
  var [done, setDone] = useState({});

  if (!isHost) return null;

  function handleExport(platId) {
    if (!clipUrl.trim()) { toast.error('Paste a clip URL first'); return; }
    setExporting(function(e) { return Object.assign({}, e, { [platId]: true }); });
    setTimeout(function() {
      setExporting(function(e) { return Object.assign({}, e, { [platId]: false }); });
      setDone(function(d) { return Object.assign({}, d, { [platId]: true }); });
      var plat = PLATFORMS.find(function(p) { return p.id === platId; });
      toast.success('Ready to post to ' + (plat ? plat.label : platId));
    }, 1200);
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 8 }}>
      <button
        onClick={function() { setExpanded(!expanded); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
      >
        <span style={{ fontSize: 16 }}>🎬</span>
        <span style={{ fontWeight: 700, fontSize: 13, flex: 1, textAlign: 'left', color: '#F472B6' }}>Instant Reel Syndication</span>
        {expanded ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
      </button>
      {expanded && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Paste a clip or recording URL, then export to each platform.
          </p>
          <input
            type="url"
            value={clipUrl}
            onChange={function(e) { setClipUrl(e.target.value); setDone({}); }}
            placeholder="https://… clip or VOD URL"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: 'rgba(255,255,255,0.8)', outline: 'none', fontFamily: 'monospace' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {PLATFORMS.map(function(plat) {
              var isDone = done[plat.id];
              var isBusy = exporting[plat.id];
              return (
                <div key={plat.id} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '10px 10px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{plat.icon}</span>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, margin: 0 }}>{plat.label}</p>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{plat.fmt}{plat.maxSec > 0 ? ' · max ' + plat.maxSec + 's' : ''}</p>
                    </div>
                  </div>
                  <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: plat.color + '22', color: plat.color, marginBottom: 6 }}>{plat.ratio}</span>
                  <button
                    onClick={function() { handleExport(plat.id); }}
                    disabled={isBusy}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%',
                      padding: '5px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: isBusy ? 'wait' : 'pointer',
                      background: isDone ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid ' + (isDone ? '#00FF88' : 'rgba(255,255,255,0.1)'),
                      color: isDone ? '#00FF88' : '#fff',
                      opacity: isBusy ? 0.6 : 1,
                    }}
                  >
                    {isDone ? <><Check size={10} /> Ready</> : isBusy ? <RefreshCw size={10} /> : <><Share2 size={10} /> Export</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
