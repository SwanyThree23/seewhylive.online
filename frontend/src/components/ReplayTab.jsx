import React, { useState, useEffect, useRef } from 'react';
import SelectSheet from './SelectSheet.jsx';

var GOLD   = '#C9A84C';
var GOLD_H = '#E8C46A';
var BURG   = '#800020';
var BURG_H = '#C01838';
var TEAL   = '#00C9A7';
var TEAL_H = '#00DEC0';
var PURP   = '#9B4DCA';
var PURP_H = '#C084FC';
var LIME   = '#00C96A';
var MUTED  = '#6B5F82';
var TEXT   = '#EDE8F4';
var TEXT_M = '#A89CC8';
var BG0    = '#07050A';
var BG1    = '#0F0C14';
var FAINT  = '#1C1530';
var BORDER = 'rgba(255,255,255,.07)';
var GLASS  = 'rgba(13,10,20,.75)';
var fD = "'Bebas Neue',sans-serif";
var fU = "'Barlow Condensed',sans-serif";
var fM = "'DM Mono',monospace";

var rnd = function(a, b) { return Math.floor(Math.random() * (b - a + 1) + a); };
var fmtN = function(n) { n = n || 0; if (n >= 1000000) return (n/1000000).toFixed(1)+'M'; if (n >= 1000) return (n/1000).toFixed(1)+'k'; return ''+n; };
var fmtS = function(s) { s = s || 0; var m = Math.floor(s / 60); var sec = s % 60; return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec; };

function fmtDuration(sec) {
  var h = Math.floor(sec / 3600);
  var m = Math.floor((sec % 3600) / 60);
  var s = sec % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

var REPLAY_CLIPS = [
  {id:'r1', title:'Opener — SwanyThree goes live',    start:0,    end:145,  highlight:false, chapter:true,  thumb:'🎤'},
  {id:'r2', title:'CaliBonesOG joins + hype moment',  start:145,  end:420,  highlight:true,  chapter:false, thumb:'🔥'},
  {id:'r3', title:'$200 tip from DominoKing',         start:420,  end:438,  highlight:true,  chapter:false, thumb:'💰'},
  {id:'r4', title:'Fades (Online Corruption) Round 1',start:438,  end:858,  highlight:false, chapter:true,  thumb:'⚡'},
  {id:'r5', title:'Washington Classic leaderboard',   start:858,  end:1020, highlight:true,  chapter:false, thumb:'🎲'},
  {id:'r6', title:'Joyce Moore storytelling segment', start:1020, end:1320, highlight:false, chapter:true,  thumb:'💜'},
  {id:'r7', title:'Music Studio jam session',         start:1320, end:1680, highlight:true,  chapter:false, thumb:'🎛'},
  {id:'r8', title:'Outro + stream wrap',              start:1680, end:1842, highlight:false, chapter:true,  thumb:'⭐'},
];

var TOTAL_DURATION = 1842;

export default function ReplayTab({ addToast, isLive }) {
  var [clips, setClips]           = useState(REPLAY_CLIPS.map(function(c) { return Object.assign({}, c); }));
  var [playHead, setPlayHead]     = useState(0);
  var [playing, setPlaying]       = useState(false);
  var [selected, setSelected]     = useState(null);
  var [reel, setReel]             = useState([]);
  var [exportMode, setExportMode] = useState('full');
  var [recording, setRecording]   = useState(false);
  var [recDuration, setRecDuration] = useState(0);
  var [liveClips, setLiveClips]   = useState([]);
  var [copiedId, setCopiedId]     = useState(null);
  var [searchQuery, setSearchQuery] = useState('');
  var playRef                     = useRef(null);
  var recRef                      = useRef(null);
  var clipTimerRef                = useRef(null);

  useEffect(function() {
    if (!playing) {
      if (playRef.current) clearInterval(playRef.current);
      return;
    }
    playRef.current = setInterval(function() {
      setPlayHead(function(p) {
        if (p + 2 >= TOTAL_DURATION) {
          setPlaying(false);
          clearInterval(playRef.current);
          return TOTAL_DURATION;
        }
        return p + 2;
      });
    }, 80);
    return function() { clearInterval(playRef.current); };
  }, [playing]);

  // Recording and live clip generation
  useEffect(function() {
    if (isLive) {
      setRecording(true);
      setRecDuration(0);

      // Tick rec duration every second
      recRef.current = setInterval(function() {
        setRecDuration(function(prev) { return prev + 1; });
      }, 1000);

      // Auto-add a live clip every 20 seconds
      clipTimerRef.current = setInterval(function() {
        setRecDuration(function(currentDur) {
          setLiveClips(function(prevClips) {
            var newClip = {
              id: 'live_' + Date.now(),
              title: 'Live Segment #' + (prevClips.length + 1),
              start: currentDur - 20 < 0 ? 0 : currentDur - 20,
              end: currentDur,
              highlight: false,
              live: true,
              thumb: '🔴',
            };
            return prevClips.concat([newClip]);
          });
          return currentDur;
        });
      }, 20000);

      return function() {
        clearInterval(recRef.current);
        clearInterval(clipTimerRef.current);
      };
    } else {
      // isLive went false — stop recording, keep liveClips
      setRecording(false);
      if (recRef.current) clearInterval(recRef.current);
      if (clipTimerRef.current) clearInterval(clipTimerRef.current);
    }
  }, [isLive]);

  var currentClip = null;
  for (var i = 0; i < clips.length; i++) {
    if (playHead >= clips[i].start && playHead < clips[i].end) {
      currentClip = clips[i];
      break;
    }
  }

  function toggleHighlight(id) {
    setClips(function(prev) {
      return prev.map(function(c) {
        if (c.id === id) return Object.assign({}, c, { highlight: !c.highlight });
        return c;
      });
    });
  }

  function addToReel(clip) {
    for (var j = 0; j < reel.length; j++) {
      if (reel[j].id === clip.id) {
        addToast('⚠️ Already in highlight reel', 'info');
        return;
      }
    }
    setReel(function(prev) { return prev.concat([Object.assign({}, clip)]); });
    addToast('✂️ Added to reel: ' + clip.title.slice(0, 20), 'info');
  }

  function removeFromReel(id) {
    setReel(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
    addToast('Removed from reel', 'info');
  }

  var pct = Math.floor((playHead / TOTAL_DURATION) * 100);

  var highlightCount = 0;
  var chapterCount = 0;
  for (var ci = 0; ci < clips.length; ci++) {
    if (clips[ci].highlight) highlightCount++;
    if (clips[ci].chapter) chapterCount++;
  }

  function shareReplay(clip) {
    var url = 'https://seewhylive.online/replay/' + clip.id;
    navigator.clipboard.writeText(url);
    setCopiedId(clip.id);
    addToast('Link copied: /replay/' + clip.id, 'success');
    setTimeout(function() { setCopiedId(null); }, 1500);
  }

  function isInReel(id) {
    for (var ri = 0; ri < reel.length; ri++) {
      if (reel[ri].id === id) return true;
    }
    return false;
  }

  var exportLabels = {
    'full':      'Full Replay',
    'highlights':'Highlights Only',
    'chapters':  'Chapters',
    'reel':      'Highlight Reel',
  };

  var allClips = liveClips.concat(clips);
  var filteredClips = searchQuery.trim()
    ? allClips.filter(function(c) { return c.title.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1; })
    : allClips;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background: BG0 }}>

      {/* REC badge */}
      {recording && (
        <div style={{ background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.35)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, margin: '8px 8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 8px #FF1A3C' }} />
            <span style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: '#FF1A3C', letterSpacing: 2 }}>RECORDING</span>
          </div>
          <span style={{ fontFamily: fM, fontSize: 11, color: '#FF1A3C', letterSpacing: 1 }}>{fmtDuration(recDuration)}</span>
        </div>
      )}

      {/* VIDEO PREVIEW */}
      <div style={{
        height: 130,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        borderBottom: '1px solid ' + BORDER,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, lineHeight: 1 }}>
            {currentClip ? currentClip.thumb : '▶'}
          </div>
          <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: TEXT, marginTop: 4, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentClip ? currentClip.title : 'SELECT A SEGMENT'}
          </div>
          <div style={{ fontFamily: fM, fontSize: 10, color: GOLD, marginTop: 2 }}>
            {fmtS(playHead)} / {fmtS(TOTAL_DURATION)}
          </div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4, flexWrap: 'wrap' }}>
            {currentClip && currentClip.highlight && (
              <span style={{ fontFamily: fM, fontSize: 7, color: GOLD, background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 3, padding: '1px 5px', letterSpacing: 1 }}>HIGHLIGHT</span>
            )}
            {currentClip && currentClip.chapter && (
              <span style={{ fontFamily: fM, fontSize: 7, color: TEAL, background: 'rgba(0,201,167,.15)', border: '1px solid rgba(0,201,167,.4)', borderRadius: 3, padding: '1px 5px', letterSpacing: 1 }}>CHAPTER</span>
            )}
            {playing && (
              <span style={{ fontFamily: fM, fontSize: 7, color: BURG_H, background: 'rgba(192,24,56,.15)', border: '1px solid rgba(192,24,56,.4)', borderRadius: 3, padding: '1px 5px', letterSpacing: 1 }}>PLAYING</span>
            )}
          </div>
        </div>
      </div>

      {/* PLAYBACK BAR */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid ' + BORDER,
        flexShrink: 0,
        background: BG1,
      }}>
        {/* Progress bar */}
        <div
          style={{ position: 'relative', height: 20, marginBottom: 6, cursor: 'pointer' }}
          onClick={function(e) {
            var rect = e.currentTarget.getBoundingClientRect();
            var p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setPlayHead(Math.floor(p * TOTAL_DURATION));
          }}
        >
          {/* Track */}
          <div style={{ position: 'absolute', top: 8, left: 0, right: 0, height: 4, background: FAINT, borderRadius: 2 }} />
          {/* Fill */}
          <div style={{ position: 'absolute', top: 8, left: 0, width: pct + '%', height: 4, background: 'linear-gradient(90deg,' + BURG + ',' + GOLD + ')', borderRadius: 2 }} />
          {/* Chapter markers */}
          {clips.map(function(c) {
            if (!c.chapter) return null;
            var markerPct = Math.floor((c.start / TOTAL_DURATION) * 100);
            return (
              <div
                key={c.id}
                style={{
                  position: 'absolute',
                  top: 4,
                  left: markerPct + '%',
                  width: 2,
                  height: 12,
                  background: GOLD,
                  borderRadius: 1,
                  opacity: 0.8,
                  pointerEvents: 'none',
                }}
              />
            );
          })}
          {/* Playhead knob */}
          <div style={{
            position: 'absolute',
            top: 4,
            left: 'calc(' + pct + '% - 6px)',
            width: 12,
            height: 12,
            background: GOLD,
            borderRadius: '50%',
            border: '2px solid ' + TEXT,
            pointerEvents: 'none',
          }} />
        </div>

        {/* Control row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={function() { setPlayHead(0); setPlaying(false); }}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid ' + BORDER, borderRadius: 6, width: 28, height: 28, color: TEXT_M, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >⏮</button>

          <button
            onClick={function() { setPlaying(function(p) { return !p; }); }}
            style={{ background: playing ? 'rgba(192,24,56,.25)' : 'linear-gradient(135deg,' + BURG + ',' + BURG_H + ')', border: '1px solid ' + (playing ? BURG_H : BURG), borderRadius: '50%', width: 34, height: 34, color: GOLD, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >{playing ? '⏸' : '▶'}</button>

          <button
            onClick={function() { setPlayHead(TOTAL_DURATION); setPlaying(false); }}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid ' + BORDER, borderRadius: 6, width: 28, height: 28, color: TEXT_M, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >⏭</button>

          <SelectSheet
            label="Export Mode"
            value={exportMode}
            options={[
              { value: 'full',       label: 'Full Replay' },
              { value: 'highlights', label: 'Highlights Only' },
              { value: 'chapters',   label: 'Chapters' },
              { value: 'reel',       label: 'Highlight Reel' },
            ]}
            onChange={function(v) { setExportMode(v); }}
            style={{ flex: 1 }}
          />

          <button
            onClick={function() {
              var label = exportLabels[exportMode] || exportMode;
              addToast('📤 ' + label + ' exported! Creator gets 90% of revenue.', 'success');
            }}
            style={{ background: 'linear-gradient(135deg,' + TEAL + ',' + TEAL_H + ')', border: 'none', borderRadius: 6, padding: '5px 10px', color: BG0, fontFamily: fU, fontWeight: 700, fontSize: 10, cursor: 'pointer', flexShrink: 0 }}
          >EXPORT</button>
        </div>
      </div>

      {/* SCROLLABLE CLIP LIST */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Search filter */}
        <div style={{ marginBottom: 4 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={function(e) { setSearchQuery(e.target.value); }}
            placeholder="Filter by title..."
            style={{ width: '100%', background: FAINT, border: '1px solid ' + BORDER, borderRadius: 7, padding: '6px 10px', color: TEXT, fontFamily: fM, fontSize: 10, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Count header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: fM, fontSize: 8, color: TEXT_M, letterSpacing: 1 }}>
            {clips.length} SEGMENTS &middot; {highlightCount} HIGHLIGHTS &middot; {chapterCount} CHAPTERS
          </span>
          {reel.length > 0 && (
            <span style={{ fontFamily: fM, fontSize: 7, color: PURP, background: 'rgba(155,77,202,.15)', border: '1px solid rgba(155,77,202,.35)', borderRadius: 3, padding: '1px 6px', letterSpacing: 1 }}>
              REEL: {reel.length}
            </span>
          )}
          {liveClips.length > 0 && (
            <span style={{ fontFamily: fM, fontSize: 7, color: '#FF1A3C', background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.35)', borderRadius: 3, padding: '1px 6px', letterSpacing: 1 }}>
              LIVE: {liveClips.length}
            </span>
          )}
        </div>

        {/* Clip cards — live clips first, then replay clips */}
        {filteredClips.map(function(clip) {
          var isPlaying = currentClip && currentClip.id === clip.id;
          var isSelected = selected === clip.id;
          var inReel = isInReel(clip.id);
          var clipDuration = clip.end - clip.start;
          var clipProgress = isPlaying ? Math.floor(((playHead - clip.start) / clipDuration) * 100) : 0;

          return (
            <div
              key={clip.id}
              style={{
                background: clip.live ? 'rgba(255,26,60,.07)' : (isPlaying ? 'rgba(128,0,32,.12)' : GLASS),
                border: '1px solid ' + (clip.live ? 'rgba(255,26,60,.3)' : (isPlaying ? 'rgba(192,24,56,.4)' : BORDER)),
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={function() { setSelected(isSelected ? null : clip.id); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px' }}>
                {/* Thumb */}
                <div style={{ width: 36, height: 36, borderRadius: 7, background: clip.live ? 'rgba(255,26,60,.15)' : 'rgba(128,0,32,.2)', border: '1px solid ' + (clip.live ? 'rgba(255,26,60,.3)' : 'rgba(201,168,76,.15)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {clip.thumb}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    {clip.live && (
                      <span style={{ fontFamily: fM, fontSize: 7, color: '#FF1A3C', background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 3, padding: '1px 5px', letterSpacing: 1, flexShrink: 0 }}>🔴 LIVE</span>
                    )}
                    <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 12, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {clip.title}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: fM, fontSize: 8, color: GOLD }}>{fmtS(clipDuration)}</span>
                    {clip.chapter && (
                      <span style={{ fontFamily: fM, fontSize: 7, color: TEAL, background: 'rgba(0,201,167,.1)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 2, padding: '0 4px' }}>CHAPTER</span>
                    )}
                    {clip.highlight && (
                      <span style={{ fontFamily: fM, fontSize: 7, color: GOLD, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 2, padding: '0 4px' }}>HIGHLIGHT</span>
                    )}
                    {inReel && (
                      <span style={{ fontFamily: fM, fontSize: 7, color: PURP, background: 'rgba(155,77,202,.1)', border: '1px solid rgba(155,77,202,.3)', borderRadius: 2, padding: '0 4px' }}>IN REEL</span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={function(e) { e.stopPropagation(); }}>
                  <button
                    onClick={function() { setPlayHead(clip.start); setPlaying(true); }}
                    style={{ background: 'rgba(128,0,32,.2)', border: '1px solid rgba(192,24,56,.35)', borderRadius: 5, padding: '4px 7px', color: BURG_H, fontFamily: fU, fontWeight: 700, fontSize: 9, cursor: 'pointer' }}
                  >▶</button>
                  <button
                    onClick={function() { toggleHighlight(clip.id); }}
                    style={{ background: clip.highlight ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (clip.highlight ? 'rgba(201,168,76,.45)' : BORDER), borderRadius: 5, padding: '4px 7px', color: clip.highlight ? GOLD : MUTED, fontFamily: fU, fontWeight: 700, fontSize: 9, cursor: 'pointer' }}
                  >★</button>
                </div>
              </div>

              {/* Clip progress bar */}
              {isPlaying && (
                <div style={{ height: 3, background: FAINT }}>
                  <div style={{ height: '100%', width: clipProgress + '%', background: 'linear-gradient(90deg,' + BURG + ',' + GOLD + ')', borderRadius: 2 }} />
                </div>
              )}

              {/* Expanded actions */}
              {isSelected && (
                <div style={{ padding: '8px 11px 10px', borderTop: '1px solid ' + BORDER, display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={function(e) { e.stopPropagation(); }}>
                  {!inReel ? (
                    <button
                      onClick={function() { addToReel(clip); }}
                      style={{ background: 'rgba(155,77,202,.15)', border: '1px solid rgba(155,77,202,.4)', borderRadius: 6, padding: '5px 10px', color: PURP_H, fontFamily: fU, fontWeight: 700, fontSize: 9, cursor: 'pointer' }}
                    >+ ADD TO REEL</button>
                  ) : (
                    <button
                      onClick={function() { removeFromReel(clip.id); }}
                      style={{ background: 'rgba(107,95,130,.12)', border: '1px solid rgba(107,95,130,.35)', borderRadius: 6, padding: '5px 10px', color: MUTED, fontFamily: fU, fontWeight: 700, fontSize: 9, cursor: 'pointer' }}
                    >— REMOVE REEL</button>
                  )}
                  <button
                    onClick={function() { addToast('Clip exported: ' + clip.title.slice(0, 20), 'info'); }}
                    style={{ background: 'rgba(0,201,167,.1)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 6, padding: '5px 10px', color: TEAL, fontFamily: fU, fontWeight: 700, fontSize: 9, cursor: 'pointer' }}
                  >📤 EXPORT CLIP</button>
                  <button
                    onClick={function() { shareReplay(clip); }}
                    style={{ background: copiedId === clip.id ? 'rgba(201,168,76,.2)' : 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,' + (copiedId === clip.id ? '.6' : '.3') + ')', borderRadius: 6, padding: '5px 10px', color: GOLD, fontFamily: fU, fontWeight: 700, fontSize: 9, cursor: 'pointer' }}
                  >{copiedId === clip.id ? '✓ COPIED' : '🔗 SHARE REPLAY'}</button>
                </div>
              )}
            </div>
          );
        })}

        {/* Highlight Reel card */}
        {reel.length > 0 && (
          <div style={{
            background: 'rgba(155,77,202,.08)',
            border: '1px solid rgba(155,77,202,.45)',
            borderRadius: 10,
            padding: '11px 12px',
            marginTop: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: PURP_H }}>HIGHLIGHT REEL</div>
                <div style={{ fontFamily: fM, fontSize: 8, color: TEXT_M, marginTop: 1 }}>{reel.length} clip{reel.length !== 1 ? 's' : ''} selected</div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <button
                  onClick={function() { addToast('🎬 Highlight reel exported! Creator gets 90%', 'success'); }}
                  style={{ background: 'linear-gradient(135deg,' + PURP + ',' + PURP_H + ')', border: 'none', borderRadius: 6, padding: '5px 10px', color: '#fff', fontFamily: fU, fontWeight: 700, fontSize: 9, cursor: 'pointer' }}
                >🎬 EXPORT</button>
                <button
                  onClick={function() { addToast('📤 Shared to Techmunity!', 'info'); }}
                  style={{ background: 'rgba(155,77,202,.15)', border: '1px solid rgba(155,77,202,.4)', borderRadius: 6, padding: '5px 10px', color: PURP_H, fontFamily: fU, fontWeight: 700, fontSize: 9, cursor: 'pointer' }}
                >📤 SHARE</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {reel.map(function(rc) {
                return (
                  <div key={rc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(155,77,202,.07)', borderRadius: 6, padding: '5px 8px' }}>
                    <span style={{ fontSize: 12 }}>{rc.thumb}</span>
                    <span style={{ fontFamily: fU, fontSize: 11, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rc.title}</span>
                    <span style={{ fontFamily: fM, fontSize: 8, color: GOLD }}>{fmtS(rc.end - rc.start)}</span>
                    <button
                      onClick={function() { removeFromReel(rc.id); }}
                      style={{ background: 'none', border: 'none', color: MUTED, fontSize: 12, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                    >✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
