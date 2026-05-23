import React, { useState, useEffect, useRef } from 'react';

var BANNER_POSITIONS = ['top', 'bottom'];
var BANNER_COLORS    = ['#C9A84C', '#FF1A3C', '#00C9A7', '#5A8FFF', '#C8FF00', '#9B4DCA', '#ffffff'];

var INIT_OVERLAY = {
  banner:      { text: '', position: 'bottom', color: '#C9A84C', visible: false },
  countdown:   { label: 'STARTING SOON', targetTs: 0, durationSec: 300, visible: false },
  scoreBug:    { label: 'DOMINO CLASSIC', team1: { name: 'EAST', score: 0 }, team2: { name: 'WEST', score: 0 }, visible: false },
  lowerThirds: {},
};

export default function OverlayTab({ overlayConfig, setOverlayConfig, socket, roomId, role, guests, userId, username, isLive }) {
  var [section,    setSection]    = useState('lower');
  var [draftLT,    setDraftLT]    = useState({});
  var [draftBanner, setDraftBanner] = useState(null);
  var [draftCD,    setDraftCD]    = useState(null);
  var [draftScore, setDraftScore] = useState(null);
  var [cdMode,     setCdMode]     = useState('duration');
  var [cdMinutes,  setCdMinutes]  = useState('5');
  var [cdSeconds,  setCdSeconds]  = useState('0');
  var [cdLabel,    setCdLabel]    = useState('STARTING SOON');
  var [cdTarget,   setCdTarget]   = useState('');
  var [cdRunning,  setCdRunning]  = useState(false);
  var countdownRef = useRef(null);

  var isHost = role === 'host';
  var cfg    = overlayConfig || INIT_OVERLAY;

  var roster = [];
  roster.push({ guestId: userId || 'me', username: username || 'You', role: 'host' });
  if (guests && guests.length > 0) {
    guests.forEach(function(g) {
      var gid = g.guestId ? g.guestId : g.userId;
      if (gid !== userId) roster.push({ guestId: gid, username: g.username || gid, role: g.role || 'guest' });
    });
  }

  useEffect(function() {
    var lt = {};
    roster.forEach(function(g) {
      lt[g.guestId] = Object.assign(
        { name: g.username, title: g.role, visible: false },
        cfg.lowerThirds && cfg.lowerThirds[g.guestId] ? cfg.lowerThirds[g.guestId] : {}
      );
    });
    setDraftLT(lt);
    setDraftBanner(Object.assign({}, INIT_OVERLAY.banner, cfg.banner || {}));
    setDraftScore(JSON.parse(JSON.stringify(Object.assign({}, INIT_OVERLAY.scoreBug, cfg.scoreBug || {}))));
  }, []);

  function pushOverlay(partial) {
    var next = Object.assign({}, cfg, partial);
    if (setOverlayConfig) setOverlayConfig(next);
    if (socket && roomId) {
      socket.emit('overlay-update', { roomId: roomId, overlay: next });
    }
  }

  function applyLowerThirds() {
    pushOverlay({ lowerThirds: Object.assign({}, draftLT) });
  }

  function toggleLT(gid) {
    setDraftLT(function(d) {
      var next = Object.assign({}, d);
      next[gid] = Object.assign({}, next[gid], { visible: !next[gid].visible });
      return next;
    });
  }

  function clearAllLT() {
    var cleared = {};
    Object.keys(draftLT).forEach(function(k) {
      cleared[k] = Object.assign({}, draftLT[k], { visible: false });
    });
    setDraftLT(cleared);
    pushOverlay({ lowerThirds: cleared });
  }

  function applyBanner() {
    if (!draftBanner) return;
    pushOverlay({ banner: Object.assign({}, draftBanner, { visible: true }) });
  }

  function hideBanner() {
    pushOverlay({ banner: Object.assign({}, cfg.banner || {}, { visible: false }) });
    if (draftBanner) setDraftBanner(function(d) { return Object.assign({}, d, { visible: false }); });
  }

  function startCountdown() {
    var targetTs;
    if (cdMode === 'duration') {
      var mins = parseInt(cdMinutes, 10) || 0;
      var secs = parseInt(cdSeconds, 10) || 0;
      targetTs = Math.floor(Date.now() / 1000) + mins * 60 + secs;
    } else {
      if (!cdTarget) return;
      targetTs = Math.floor(new Date(cdTarget).getTime() / 1000);
    }
    setCdRunning(true);
    pushOverlay({ countdown: { label: cdLabel, targetTs: targetTs, visible: true } });
  }

  function stopCountdown() {
    setCdRunning(false);
    pushOverlay({ countdown: Object.assign({}, cfg.countdown || {}, { visible: false }) });
  }

  function applyScore() {
    if (!draftScore) return;
    pushOverlay({ scoreBug: Object.assign({}, draftScore, { visible: true }) });
  }

  function hideScore() {
    pushOverlay({ scoreBug: Object.assign({}, cfg.scoreBug || {}, { visible: false }) });
  }

  function changeScore(team, delta) {
    if (!draftScore) return;
    setDraftScore(function(d) {
      var next  = JSON.parse(JSON.stringify(d));
      var prev  = next[team].score || 0;
      next[team].score = Math.max(0, prev + delta);
      return next;
    });
  }

  var SECTIONS = [
    { id: 'lower', label: 'LOWER\nTHIRDS' },
    { id: 'banner', label: 'BANNER' },
    { id: 'countdown', label: 'TIMER' },
    { id: 'score', label: 'SCORE\nBUG' },
  ];

  var gold = '#C9A84C';

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 450 }}>

      {/* Header */}
      <div style={{ background: 'rgba(128,0,32,.12)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: gold, letterSpacing: 3 }}>🎬 BROADCAST GRAPHICS</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>Live overlay controls · host only</div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {isLive && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 999, padding: '2px 8px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 5px #FF1A3C', display: 'inline-block' }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81' }}>LIVE</span>
            </span>
          )}
          {[cfg.banner && cfg.banner.visible, cfg.scoreBug && cfg.scoreBug.visible, cfg.countdown && cfg.countdown.visible].filter(Boolean).length > 0 && (
            <span style={{ background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 999, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81' }}>
              OVERLAYS ON
            </span>
          )}
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4 }}>
        {SECTIONS.map(function(t) {
          var active = section === t.id;
          return (
            <button key={t.id} onClick={function() { setSection(t.id); }}
              style={{ background: active ? 'rgba(128,0,32,.3)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (active ? '#C01838' : '#241C34'), borderRadius: 6, padding: '7px 2px', color: active ? gold : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', whiteSpace: 'pre-line', lineHeight: 1.3, textAlign: 'center' }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── LOWER THIRDS ──────────────────────────────────────────────────── */}
      {section === 'lower' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {roster.map(function(g) {
            var lt = draftLT[g.guestId] || { name: g.username, title: g.role, visible: false };
            return (
              <div key={g.guestId} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + (lt.visible ? 'rgba(201,168,76,.35)' : '#241C34'), borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: lt.visible ? '#C9A84C' : '#7A6F90', boxShadow: lt.visible ? '0 0 6px #C9A84C88' : 'none', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#EDE8F5', flex: 1 }}>{g.username}</span>
                  <button
                    onClick={function() { toggleLT(g.guestId); }}
                    style={{ padding: '3px 10px', background: lt.visible ? 'rgba(201,168,76,.2)' : 'rgba(36,28,52,.6)', border: '1px solid ' + (lt.visible ? gold + '55' : '#241C34'), borderRadius: 5, color: lt.visible ? gold : '#7A6F90', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                    {lt.visible ? 'SHOWN' : 'HIDDEN'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <input
                    value={lt.name || ''}
                    onChange={function(e) {
                      var v = e.target.value;
                      setDraftLT(function(d) { return Object.assign({}, d, { [g.guestId]: Object.assign({}, d[g.guestId] || {}, { name: v }) }); });
                    }}
                    placeholder="Display name..."
                    style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '6px 10px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
                  />
                  <input
                    value={lt.title || ''}
                    onChange={function(e) {
                      var v = e.target.value;
                      setDraftLT(function(d) { return Object.assign({}, d, { [g.guestId]: Object.assign({}, d[g.guestId] || {}, { title: v }) }); });
                    }}
                    placeholder="Title / role..."
                    style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '6px 10px', color: '#7A6F90', fontFamily: "'DM Mono',monospace", fontSize: 10 }}
                  />
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={applyLowerThirds}
              disabled={!isHost}
              style={{ flex: 1, padding: '10px', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, color: gold, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: isHost ? 'pointer' : 'not-allowed', opacity: isHost ? 1 : 0.5 }}>
              ✓ APPLY ALL LOWER THIRDS
            </button>
            <button
              onClick={clearAllLT}
              disabled={!isHost}
              style={{ padding: '10px 14px', background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 8, color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: isHost ? 'pointer' : 'not-allowed', opacity: isHost ? 1 : 0.5 }}>
              CLEAR
            </button>
          </div>
        </div>
      )}

      {/* ─── BANNER ──────────────────────────────────────────────────────────── */}
      {section === 'banner' && draftBanner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Preview */}
          <div style={{ background: 'rgba(7,5,10,.9)', border: '1px solid #241C34', borderRadius: 8, padding: '20px 12px', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: 60 }}>
            {draftBanner.text ? (
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: draftBanner.color || gold, letterSpacing: 3, textShadow: '0 2px 8px rgba(0,0,0,.8)' }}>
                {draftBanner.text}
              </div>
            ) : (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90' }}>Banner preview</div>
            )}
          </div>

          <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 5 }}>BANNER TEXT</div>
              <input
                value={draftBanner.text || ''}
                onChange={function(e) { setDraftBanner(function(d) { return Object.assign({}, d, { text: e.target.value }); }); }}
                placeholder="Enter banner message..."
                style={{ width: '100%', background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 5 }}>POSITION</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {BANNER_POSITIONS.map(function(pos) {
                  var active = (draftBanner.position || 'bottom') === pos;
                  return (
                    <button key={pos}
                      onClick={function() { setDraftBanner(function(d) { return Object.assign({}, d, { position: pos }); }); }}
                      style={{ flex: 1, padding: '6px', background: active ? 'rgba(90,143,255,.2)' : 'rgba(22,16,32,.4)', border: '1px solid ' + (active ? 'rgba(90,143,255,.5)' : '#241C34'), borderRadius: 5, color: active ? '#5A8FFF' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                      {pos.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 5 }}>COLOR</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {BANNER_COLORS.map(function(c) {
                  var active = (draftBanner.color || gold) === c;
                  return (
                    <button key={c}
                      onClick={function() { setDraftBanner(function(d) { return Object.assign({}, d, { color: c }); }); }}
                      style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: '2px solid ' + (active ? '#EDE8F5' : 'transparent'), cursor: 'pointer', flexShrink: 0 }} />
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={applyBanner}
              disabled={!isHost || !draftBanner.text}
              style={{ flex: 1, padding: '10px', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, color: gold, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: (isHost && draftBanner.text) ? 'pointer' : 'not-allowed', opacity: (isHost && draftBanner.text) ? 1 : 0.5 }}>
              {(cfg.banner && cfg.banner.visible) ? '↻ UPDATE BANNER' : '📺 SHOW BANNER'}
            </button>
            {cfg.banner && cfg.banner.visible && (
              <button onClick={hideBanner}
                style={{ padding: '10px 14px', background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 8, color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer' }}>
                HIDE
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── COUNTDOWN ───────────────────────────────────────────────────────── */}
      {section === 'countdown' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 5 }}>COUNTDOWN LABEL</div>
              <input
                value={cdLabel}
                onChange={function(e) { setCdLabel(e.target.value); }}
                placeholder="e.g. SHOW STARTS IN"
                style={{ width: '100%', background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 5 }}>MODE</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['duration', 'DURATION'], ['target', 'TARGET TIME']].map(function(m) {
                  var active = cdMode === m[0];
                  return (
                    <button key={m[0]} onClick={function() { setCdMode(m[0]); }}
                      style={{ flex: 1, padding: '6px', background: active ? 'rgba(0,201,167,.15)' : 'rgba(22,16,32,.4)', border: '1px solid ' + (active ? 'rgba(0,201,167,.4)' : '#241C34'), borderRadius: 5, color: active ? '#00C9A7' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                      {m[1]}
                    </button>
                  );
                })}
              </div>
            </div>

            {cdMode === 'duration' && (
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 5 }}>DURATION</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" value={cdMinutes} onChange={function(e) { setCdMinutes(e.target.value); }}
                    min="0" max="99"
                    style={{ width: 60, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '8px', color: '#EDE8F5', fontFamily: "'DM Mono',monospace", fontSize: 16, textAlign: 'center' }} />
                  <span style={{ color: '#7A6F90', fontFamily: "'DM Mono',monospace", fontSize: 14 }}>:</span>
                  <input type="number" value={cdSeconds} onChange={function(e) { setCdSeconds(e.target.value); }}
                    min="0" max="59"
                    style={{ width: 60, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '8px', color: '#EDE8F5', fontFamily: "'DM Mono',monospace", fontSize: 16, textAlign: 'center' }} />
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90' }}>MIN : SEC</span>
                </div>
              </div>
            )}

            {cdMode === 'target' && (
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 5 }}>TARGET DATE / TIME</div>
                <input
                  type="datetime-local"
                  value={cdTarget}
                  onChange={function(e) { setCdTarget(e.target.value); }}
                  style={{ width: '100%', background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'DM Mono',monospace", fontSize: 11, boxSizing: 'border-box', colorScheme: 'dark' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={cdRunning ? stopCountdown : startCountdown}
              disabled={!isHost}
              style={{ flex: 1, padding: '12px', background: cdRunning ? 'rgba(255,26,60,.15)' : 'rgba(0,201,167,.12)', border: '1px solid ' + (cdRunning ? 'rgba(255,26,60,.4)' : 'rgba(0,201,167,.4)'), borderRadius: 8, color: cdRunning ? '#FF6B81' : '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: isHost ? 'pointer' : 'not-allowed', opacity: isHost ? 1 : 0.5 }}>
              {cdRunning ? '⏹ STOP COUNTDOWN' : '▶ START COUNTDOWN'}
            </button>
          </div>

          {cfg.countdown && cfg.countdown.visible && (
            <div style={{ background: 'rgba(0,201,167,.06)', border: '1px solid rgba(0,201,167,.25)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C9A7', boxShadow: '0 0 5px #00C9A788' }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#00C9A7' }}>
                Countdown active · <CountdownDisplay targetTs={cfg.countdown.targetTs} />
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── SCORE BUG ───────────────────────────────────────────────────────── */}
      {section === 'score' && draftScore && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Score bug preview */}
          <div style={{ background: 'rgba(7,5,10,.9)', border: '1px solid #241C34', borderRadius: 8, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(128,0,32,.9)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ padding: '6px 12px', borderRight: '1px solid rgba(201,168,76,.2)' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#EDE8F5', letterSpacing: 2 }}>{draftScore.team1.name || 'TEAM 1'}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, color: gold, lineHeight: 1, textAlign: 'center' }}>{draftScore.team1.score}</div>
              </div>
              <div style={{ padding: '4px 8px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1 }}>{draftScore.label || 'LIVE'}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 12, color: '#FF6B81' }}>VS</div>
              </div>
              <div style={{ padding: '6px 12px', borderLeft: '1px solid rgba(201,168,76,.2)' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#EDE8F5', letterSpacing: 2 }}>{draftScore.team2.name || 'TEAM 2'}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, color: gold, lineHeight: 1, textAlign: 'center' }}>{draftScore.team2.score}</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 5 }}>EVENT LABEL</div>
              <input
                value={draftScore.label || ''}
                onChange={function(e) { setDraftScore(function(d) { return Object.assign({}, d, { label: e.target.value }); }); }}
                placeholder="e.g. DOMINO CLASSIC"
                style={{ width: '100%', background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            {[['team1', 'TEAM 1'], ['team2', 'TEAM 2']].map(function(row) {
              var key  = row[0];
              var team = draftScore[key] || { name: '', score: 0 };
              return (
                <div key={key}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 5 }}>{row[1]}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      value={team.name || ''}
                      onChange={function(e) {
                        var v = e.target.value;
                        setDraftScore(function(d) {
                          var next = JSON.parse(JSON.stringify(d));
                          next[key].name = v;
                          return next;
                        });
                      }}
                      placeholder="Team name..."
                      style={{ flex: 1, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '8px 10px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }}
                    />
                    <button onClick={function() { changeScore(key, -1); }}
                      style={{ width: 30, height: 30, borderRadius: 5, background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', color: '#FF6B81', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>
                      −
                    </button>
                    <div style={{ width: 36, textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 18, color: gold, flexShrink: 0 }}>
                      {team.score}
                    </div>
                    <button onClick={function() { changeScore(key, 1); }}
                      style={{ width: 30, height: 30, borderRadius: 5, background: 'rgba(0,201,167,.1)', border: '1px solid rgba(0,201,167,.3)', color: '#00C9A7', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={applyScore} disabled={!isHost}
              style={{ flex: 1, padding: '10px', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, color: gold, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: isHost ? 'pointer' : 'not-allowed', opacity: isHost ? 1 : 0.5 }}>
              {(cfg.scoreBug && cfg.scoreBug.visible) ? '↻ UPDATE SCORE' : '📊 SHOW SCORE BUG'}
            </button>
            {cfg.scoreBug && cfg.scoreBug.visible && (
              <button onClick={hideScore}
                style={{ padding: '10px 14px', background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 8, color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer' }}>
                HIDE
              </button>
            )}
          </div>
        </div>
      )}

      {!isHost && (
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90', textAlign: 'center', padding: 8, background: 'rgba(36,28,52,.4)', borderRadius: 8 }}>
          Overlay controls are host-only. Graphics will appear on your stage view.
        </div>
      )}
    </div>
  );
}

function CountdownDisplay({ targetTs }) {
  var [rem, setRem] = useState(Math.max(0, targetTs - Math.floor(Date.now() / 1000)));
  useEffect(function() {
    var t = setInterval(function() {
      setRem(Math.max(0, targetTs - Math.floor(Date.now() / 1000)));
    }, 1000);
    return function() { clearInterval(t); };
  }, [targetTs]);
  var h   = Math.floor(rem / 3600);
  var m   = Math.floor((rem % 3600) / 60);
  var s   = rem % 60;
  var str = (h > 0 ? String(h).padStart(2, '0') + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  return <span>{str}</span>;
}
