import React, { useState, useEffect } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';
import { listClips, loadClip, deleteClip } from '../clipStore.js';

var BG    = '#0E0C09';
var SURF  = '#1A1510';
var CARD  = '#241C12';
var CARD2 = '#2E2318';
var GOLD  = '#C9A84C';
var TEAL  = '#D4854A';
var RED   = '#FF1A3C';
var TEXT  = '#F0E8D4';
var MUTED = '#8A7A62';
var DIM   = '#3D3020';
var BORDER = 'rgba(201,168,76,.12)';

var CHANNELS = [
  { id: 'c1', name: 'Domino Entertainment',  handle: '@dominoent', thumb: '🎲', color: GOLD,     status: 'live'   },
  { id: 'c2', name: 'SeeWhy LIVE',           handle: '@seewhylive',thumb: '🔴', color: '#FF1564', status: 'live'   },
  { id: 'c3', name: 'AI Verse Podcast',      handle: '@aiverse',   thumb: '🎙', color: '#C9A84C', status: 'online' },
  { id: 'c4', name: 'Memoirs of a Shy Girl', handle: '@shygirl',   thumb: '📖', color: '#FF6B9D', status: 'online' },
  { id: 'c5', name: 'SwanyBot LIVE',         handle: '@swanybot',  thumb: '🤖', color: TEAL,      status: 'online' },
  { id: 'c6', name: 'Washington Classic',    handle: '@dcdominos', thumb: '🎯', color: '#C9A84C', status: 'online' },
];

var SOC_PLATFORMS = [
  { id: 'facebook',  emoji: '📘', name: 'Facebook',   open: true,  buildUrl: function(u,t){ return 'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(u)+'&quote='+encodeURIComponent(t); } },
  { id: 'twitter',   emoji: '🐦', name: 'X',          open: true,  buildUrl: function(u,t){ return 'https://twitter.com/intent/tweet?text='+encodeURIComponent(t+' '+u); } },
  { id: 'whatsapp',  emoji: '💬', name: 'WhatsApp',   open: true,  buildUrl: function(u,t){ return 'https://wa.me/?text='+encodeURIComponent(t+' '+u); } },
  { id: 'instagram', emoji: '📸', name: 'Instagram',  open: false, buildUrl: null },
  { id: 'tiktok',    emoji: '🎵', name: 'TikTok',     open: false, buildUrl: null },
  { id: 'snapchat',  emoji: '👻', name: 'Snapchat',   open: false, buildUrl: null },
];

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return Math.floor(bytes / 1024) + ' KB';
  return (Math.floor(bytes / 102400) / 10).toFixed(1) + ' MB';
}

function fmtDur(secs) {
  if (!secs) return '0:00';
  var m = Math.floor(secs / 60);
  var s = secs % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function VODLibraryTab({ addToast, isLive }) {
  var [tab,           setTab]           = useState('clips');
  var [clips,         setClips]         = useState([]);
  var [playingClip,   setPlayingClip]   = useState(null);  // { meta, url }
  var [loadingId,     setLoadingId]     = useState(null);
  var [showShare,     setShowShare]     = useState(null);  // clip meta for old share sheet
  var [shareClip,     setShareClip]     = useState(null);  // clip meta for branded share modal
  var [confirmDelete, setConfirmDelete] = useState(null);  // clip id
  var [shareCopied,   setShareCopied]   = useState(false);

  useEffect(function() {
    setClips(listClips());
  }, [tab]);

  function openClip(meta) {
    setLoadingId(meta.id);
    loadClip(meta.id).then(function(blob) {
      if (!blob) { if (addToast) addToast('Clip not found — was it cleared from storage?', 'error'); setLoadingId(null); return; }
      var url = URL.createObjectURL(blob);
      setPlayingClip({ meta: meta, url: url });
      setLoadingId(null);
    }).catch(function() {
      if (addToast) addToast('Failed to load clip', 'error');
      setLoadingId(null);
    });
  }

  function removeClip(id) {
    deleteClip(id).then(function() {
      setClips(listClips());
      if (playingClip && playingClip.meta.id === id) setPlayingClip(null);
      if (addToast) addToast('Clip deleted', 'info');
    }).catch(function() {
      if (addToast) addToast('Delete failed', 'error');
    });
    setConfirmDelete(null);
  }

  function doShareClip(meta) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      loadClip(meta.id).then(function(blob) {
        if (!blob) return;
        var file = new File([blob], 'seewhy-clip.webm', { type: 'video/webm' });
        navigator.share({ files: [file], title: meta.title || 'SeeWhy Clip' }).catch(function() {});
      });
    } else {
      setShareClip(meta);
    }
  }

  function copyShareLink(clip) {
    var url = 'https://seewhylive.online/clip/' + (clip.id || clip.ts);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() {
        setShareCopied(true);
        setTimeout(function() { setShareCopied(false); }, 2000);
        if (addToast) addToast('Link copied!', 'success');
      }).catch(function() {});
    }
  }

  function downloadShareClip(clip) {
    loadClip(clip.id).then(function(blob) {
      if (!blob) { if (addToast) addToast('Clip not found', 'error'); return; }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = (clip.title || 'seewhy-clip') + '.webm';
      a.click();
    }).catch(function() { if (addToast) addToast('Download failed', 'error'); });
  }

  return (
    <div style={{ background: BG, minHeight: '100%', fontFamily: "'Barlow Condensed',sans-serif", color: TEXT }}>

      {/* ── Header ── */}
      <div style={{ padding: '16px 16px 0', background: SURF, borderBottom: '1px solid ' + BORDER }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: GOLD, letterSpacing: 2 }}>📺 VOD LIBRARY</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>
              {clips.length} local clip{clips.length !== 1 ? 's' : ''} · channels · on-demand
            </div>
          </div>
          {isLive && (
            <div style={{ background: 'rgba(255,26,60,.2)', border: '1px solid rgba(255,26,60,.5)', borderRadius: 20, padding: '3px 10px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: RED, letterSpacing: 1 }}>🔴 LIVE</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 0 }}>
          {[
            { id: 'clips',    label: '📹 MY CLIPS' },
            { id: 'channels', label: '📡 CHANNELS' },
          ].map(function(t) {
            var isActive = tab === t.id;
            return (
              <button key={t.id} onClick={function() { setTab(t.id); }}
                style={{ flexShrink: 0, padding: '9px 18px', background: 'transparent', border: 'none', borderBottom: '2px solid ' + (isActive ? GOLD : 'transparent'), color: isActive ? GOLD : MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 1, cursor: 'pointer', marginBottom: -1, transition: 'color .15s, border-color .15s' }}>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MY CLIPS TAB ── */}
      {tab === 'clips' && (
        <div style={{ padding: 16 }}>
          {clips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: MUTED, letterSpacing: 1, marginBottom: 8 }}>NO CLIPS YET</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: .5, lineHeight: 1.5 }}>
                Use the 📹 Record button in the live room to capture up to 10 minutes of video. Clips are saved here automatically.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clips.map(function(meta) {
                var isLoading = loadingId === meta.id;
                return (
                  <div key={meta.id} style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden' }}>
                    {/* Clip thumbnail area */}
                    <div onClick={function() { if (!isLoading) openClip(meta); }} style={{ background: 'linear-gradient(135deg,#1A1510,#0E0C09)', padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(212,133,74,.1)', border: '1.5px solid rgba(212,133,74,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                        {isLoading ? '⏳' : '▶'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.title || 'Untitled Clip'}</div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL }}>{fmtDur(meta.duration)}</span>
                          {meta.size && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{fmtSize(meta.size)}</span>}
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{fmtDate(meta.ts)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Clip actions */}
                    <div style={{ display: 'flex', borderTop: '1px solid ' + BORDER }}>
                      <button onClick={function() { openClip(meta); }}
                        style={{ flex: 1, background: 'none', border: 'none', borderRight: '1px solid ' + BORDER, padding: '10px', color: TEAL, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
                        ▶ PLAY
                      </button>
                      <button onClick={function() { loadClip(meta.id).then(function(blob) { if (blob) { var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = 'seewhy-clip-' + meta.ts + '.webm'; a.click(); } }); }}
                        style={{ flex: 1, background: 'none', border: 'none', borderRight: '1px solid ' + BORDER, padding: '10px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
                        💾 SAVE
                      </button>
                      <button onClick={function() { setShareClip(meta); }}
                        style={{ flex: 1, background: 'none', border: 'none', borderRight: '1px solid ' + BORDER, padding: '10px', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
                        📤 SHARE
                      </button>
                      <button onClick={function() { setConfirmDelete(meta.id); }}
                        style={{ flex: 1, background: 'none', border: 'none', padding: '10px', color: RED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
                        🗑 DEL
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CHANNELS TAB ── */}
      {tab === 'channels' && (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CHANNELS.map(function(ch) {
              var isLiveCh = ch.status === 'live';
              return (
                <div key={ch.id} style={{ background: CARD, border: '1px solid ' + (isLiveCh ? 'rgba(255,26,60,.3)' : BORDER), borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <AvatarPortrait username={ch.name} size={52} isLive={isLiveCh} />
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: ch.color, letterSpacing: 1, marginBottom: 2, lineHeight: 1.2 }}>{ch.name}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 10 }}>{ch.handle}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: isLiveCh ? RED : TEAL }} />
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 10, color: isLiveCh ? RED : TEAL, letterSpacing: 1 }}>{isLiveCh ? 'LIVE' : 'ONLINE'}</span>
                  </div>
                  <button onClick={function() { if (addToast) addToast('Opening ' + ch.name, 'info'); }}
                    style={{ width: '100%', padding: '7px 0', background: 'rgba(255,255,255,.06)', border: '1px solid ' + BORDER, borderRadius: 8, color: TEXT, fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, letterSpacing: 1, cursor: 'pointer' }}>
                    VISIT
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VIDEO PLAYER MODAL ── */}
      {playingClip && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={function(e) { if (e.target === e.currentTarget) setPlayingClip(null); }}>
          <button onClick={function() { setPlayingClip(null); }} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: 26, cursor: 'pointer', lineHeight: 1, zIndex: 1001 }}>✕</button>
          <div style={{ width: '100%', maxWidth: 480, background: CARD, borderRadius: 16, overflow: 'hidden', border: '1px solid ' + BORDER }}>
            <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
              <video
                src={playingClip.url}
                controls={true}
                autoPlay={true}
                playsInline={true}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }}
              />
            </div>
            <div style={{ padding: '12px 16px 16px' }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT, marginBottom: 4 }}>{playingClip.meta.title}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{fmtDur(playingClip.meta.duration)} · {fmtDate(playingClip.meta.ts)} · {fmtSize(playingClip.meta.size)}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <a href={playingClip.url} download={'seewhy-clip.webm'}
                  style={{ flex: 1, background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 10, padding: '10px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer', letterSpacing: 1, textAlign: 'center', textDecoration: 'none' }}>
                  💾 SAVE
                </a>
                <button onClick={function() { setShareClip(playingClip.meta); }}
                  style={{ flex: 1, background: 'rgba(212,133,74,.12)', border: '1px solid rgba(212,133,74,.35)', borderRadius: 10, padding: '10px', color: TEAL, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                  📤 SHARE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', zIndex: 1002, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', border: '1px solid ' + BORDER }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, marginBottom: 6 }}>Delete this clip?</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 20 }}>This cannot be undone.</div>
            <button onClick={function() { removeClip(confirmDelete); }}
              style={{ width: '100%', background: 'rgba(255,26,60,.2)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 12, padding: '13px', color: RED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer', letterSpacing: 2, marginBottom: 10 }}>
              DELETE CLIP
            </button>
            <button onClick={function() { setConfirmDelete(null); }}
              style={{ width: '100%', background: 'transparent', border: 'none', padding: '10px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, color: MUTED, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── SHARE CLIP SHEET (legacy fallback) ── */}
      {showShare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', zIndex: 1002, display: 'flex', alignItems: 'flex-end' }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowShare(null); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '20px 18px 34px', border: '1px solid ' + BORDER }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, marginBottom: 4 }}>Share Clip</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 16 }}>
              Download first, then share to your platform of choice
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
              {SOC_PLATFORMS.map(function(p) {
                return (
                  <button key={p.id} onClick={function() {
                    var shareUrl = 'https://seewhylive.online';
                    var shareMsg = 'Check out this clip from SeeWhy LIVE! 🔴';
                    if (p.open && p.buildUrl) {
                      window.open(p.buildUrl(shareUrl, shareMsg), '_blank', 'noopener,width=600,height=450');
                    } else {
                      navigator.clipboard.writeText(shareMsg + ' ' + shareUrl).then(function() {
                        if (addToast) addToast(p.name + ': link copied — paste to share!', 'success');
                      });
                    }
                    setShowShare(null);
                  }} style={{ background: CARD2, border: '1.5px solid ' + BORDER, borderRadius: 14, padding: '12px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 22 }}>{p.emoji}</span>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: TEXT, textAlign: 'center' }}>{p.name}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={function() { setShowShare(null); }}
              style={{ width: '100%', background: 'transparent', border: 'none', padding: '10px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 14, color: MUTED, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── BRANDED SHARE MODAL ── */}
      {shareClip && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 1003, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={function(e) { if (e.target === e.currentTarget) setShareClip(null); }}>
          <div style={{ width: '100%', maxWidth: 400, background: SURF, borderRadius: 18, border: '1px solid ' + BORDER, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,.6)' }}>

            {/* Branded clip preview card */}
            <div style={{ background: 'linear-gradient(135deg,rgba(128,0,32,.3),rgba(201,168,76,.08))', padding: '18px 16px', borderBottom: '1px solid ' + BORDER }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(212,133,74,.15)', border: '1.5px solid rgba(212,133,74,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>▶</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: 1 }}>{shareClip.title || 'Untitled Clip'}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 1, marginTop: 2 }}>SeeWhy LIVE · {fmtDur(shareClip.duration)} · {fmtDate(shareClip.ts)}</div>
                </div>
              </div>
              <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 7, fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 0.5 }}>
                🔴 SeeWhy LIVE · seewhylive.online
              </div>
            </div>

            <div style={{ padding: '14px 16px' }}>
              {/* Copy link */}
              <button onClick={function() { copyShareLink(shareClip); }}
                style={{ width: '100%', background: shareCopied ? 'rgba(201,168,76,.2)' : 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '10px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer', letterSpacing: 1, marginBottom: 10 }}>
                {shareCopied ? '✓ LINK COPIED' : '🔗 COPY LINK'}
              </button>

              {/* Social share buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {[
                  { label: '𝕏 / Twitter', url: function(u,t) { return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(t + ' ' + u); } },
                  { label: '💬 WhatsApp', url: function(u,t) { return 'https://wa.me/?text=' + encodeURIComponent(t + ' ' + u); } },
                  { label: '📘 Facebook', url: function(u,t) { return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u) + '&quote=' + encodeURIComponent(t); } },
                ].map(function(soc) {
                  return (
                    <button key={soc.label} onClick={function() {
                      var clipUrl = 'https://seewhylive.online/clip/' + (shareClip.id || shareClip.ts);
                      var msg     = 'Check out this clip from SeeWhy LIVE!';
                      window.open(soc.url(clipUrl, msg), '_blank', 'noopener,width=600,height=450');
                    }} style={{ flex: 1, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 9, padding: '8px 4px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 0.5, textAlign: 'center' }}>
                      {soc.label}
                    </button>
                  );
                })}
              </div>

              {/* Download */}
              <button onClick={function() { downloadShareClip(shareClip); }}
                style={{ width: '100%', background: 'rgba(212,133,74,.1)', border: '1px solid rgba(212,133,74,.3)', borderRadius: 10, padding: '10px', color: TEAL, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer', letterSpacing: 1, marginBottom: 10 }}>
                💾 DOWNLOAD CLIP
              </button>

              <button onClick={function() { setShareClip(null); setShareCopied(false); }}
                style={{ width: '100%', background: 'transparent', border: 'none', padding: '8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 14, color: MUTED, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
