import React, { useEffect, useRef, useState } from 'react';
import OctCell from './OctCell.jsx';

var MAX_SEATS = 20;

var GRID_ANIM = [
  '@keyframes cellEnter{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}',
  '@keyframes cellExit{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.88)}}',
].join('\n');

export default function PanelGrid({
  guests,
  isHost,
  fadesMode,
  branding,
  socket,
  roomId,
  userId,
  rtcManager,
  mediaConfig,
  isMuted,
  isCamOff,
  onMuteToggle,
  onCamToggle,
  onTap,
  onCameraTrack,
  giftTotals,
}) {
  if (!giftTotals) giftTotals = {};

  // Track which guestIds are newly joined so we can animate them in
  var prevIdsRef  = useRef(new Set());
  var [enteringIds, setEnteringIds] = useState(new Set());

  // Track guests that just left so we can hold them briefly with an exit animation
  var prevGuestsRef = useRef([]);
  var [exitingGuests, setExitingGuests] = useState([]); // [{...guestObj, _exiting:true}]

  useEffect(function() {
    var currentIds = new Set();
    (guests || []).forEach(function(g) { currentIds.add(g.guestId || g.userId || ''); });

    // Guests that just arrived
    var entered = new Set();
    currentIds.forEach(function(id) {
      if (id && !prevIdsRef.current.has(id)) entered.add(id);
    });

    // Guests that just left — keep them for 350 ms with exit animation
    var leaving = [];
    prevGuestsRef.current.forEach(function(g) {
      var id = g.guestId || g.userId || '';
      if (id && !currentIds.has(id)) leaving.push(Object.assign({}, g, { _exiting: true }));
    });

    if (entered.size > 0) {
      setEnteringIds(entered);
      setTimeout(function() { setEnteringIds(new Set()); }, 400);
    }

    if (leaving.length > 0) {
      setExitingGuests(leaving);
      setTimeout(function() { setExitingGuests([]); }, 380);
    }

    prevIdsRef.current  = currentIds;
    prevGuestsRef.current = (guests || []).slice();
  }, [guests]);

  var seats = (guests || []).slice(0, MAX_SEATS);

  // Merge exiting guests into display list, filling empty slots
  var displaySeats = seats.slice();
  if (exitingGuests.length > 0) {
    exitingGuests.forEach(function(eg) {
      if (displaySeats.length < MAX_SEATS) displaySeats.push(eg);
    });
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>{GRID_ANIM}</style>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(4, minmax(0, 1fr))',
          gap: 6,
          width: '100%',
          height: '100%',
          padding: 4,
          boxSizing: 'border-box',
          background: '#080B12',
        }}
      >
        {Array.from({ length: MAX_SEATS }).map(function(_, idx) {
          var g   = displaySeats[idx] || null;
          var gid = g ? (g.guestId || g.userId || ('seat-' + idx)) : ('empty-' + idx);
          var isOwn     = g && gid === userId;
          var isEntering = g && !g._exiting && enteringIds.has(gid);
          var isExiting  = g && !!g._exiting;

          var cellAnim = isEntering ? 'cellEnter .35s cubic-bezier(.175,.885,.32,1.275) both'
                       : isExiting  ? 'cellExit .35s ease forwards'
                       : 'none';

          return (
            <div
              key={gid}
              style={{
                position: 'relative',
                borderRadius: 8,
                overflow: 'hidden',
                background: g ? '#0E0C09' : 'rgba(255,255,255,0.02)',
                border: g
                  ? '1px solid rgba(201,168,76,0.12)'
                  : '1px dashed rgba(255,255,255,0.06)',
                minHeight: 0,
                animation: cellAnim,
              }}
            >
              {g && !g._exiting ? (
                <OctCell
                  guest={g}
                  fill={true}
                  isHost={isHost}
                  fadesMode={fadesMode}
                  branding={branding}
                  onTap={onTap}
                  socket={socket}
                  roomId={roomId}
                  userId={userId}
                  rtcManager={rtcManager}
                  mediaConfig={isOwn ? mediaConfig : null}
                  isMuted={isOwn ? isMuted : false}
                  isCamOff={isOwn ? isCamOff : false}
                  onMuteToggle={isOwn ? onMuteToggle : null}
                  onCamToggle={isOwn ? onCamToggle : null}
                  onCameraTrack={isOwn ? onCameraTrack : null}
                  giftTotal={giftTotals[gid] || 0}
                />
              ) : g && g._exiting ? (
                /* Fading ghost cell for departing guest */
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(201,168,76,0.04)',
                }}>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: 'rgba(201,168,76,0.3)', userSelect: 'none' }}>
                    {(g.username || '').charAt(0).toUpperCase() || '·'}
                  </span>
                </div>
              ) : (
                /* Empty seat placeholder */
                <div
                  style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.08)',
                    fontSize: 18, userSelect: 'none',
                  }}
                >
                  +
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
