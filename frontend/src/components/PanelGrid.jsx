import React from 'react';
import OctCell from './OctCell.jsx';

var MAX_SEATS = 20;

/**
 * PanelGrid — scalable 20-seat octagonal panel layout.
 *
 * Layout: CSS grid, 5 columns × 4 rows = 20 cells.
 * Cells are square, sized so the grid fills the container without overflow scroll.
 * Responsive: column count drops to 4 on narrow viewports (≤600 px) via a
 * calc()-based minmax so the grid always fills 100% width.
 * Inline styles only — matches existing codebase convention.
 *
 * Props:
 *   guests      {Array}   — up to 20 guest objects with guestId, username, producerId, speaking
 *   isHost      {boolean}
 *   fadesMode   {boolean}
 *   branding    {object}
 *   socket      {object}
 *   roomId      {string}
 *   userId      {string}
 *   rtcManager  {object}
 *   mediaConfig {object}
 *   isMuted     {boolean} — applies to own cell only
 *   isCamOff    {boolean} — applies to own cell only
 *   onMuteToggle  {function}
 *   onCamToggle   {function}
 *   onTap         {function|null}
 */
// Map guestCount to column count for a compact, adaptive grid
var LAYOUT_COLS = [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5];

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
  activeEffects,
  handRaisedSet,
  onPowerPlay,
}) {
  if (!giftTotals) giftTotals = {};
  if (!activeEffects) activeEffects = {};
  if (!handRaisedSet) handRaisedSet = {};
  var seats = (guests || []).slice(0, MAX_SEATS);

  // Adapt grid to actual guest count — show 1 empty "open" slot when below max
  var guestCount = seats.length;
  var totalSlots = guestCount < MAX_SEATS
    ? Math.max(1, guestCount + 1)
    : MAX_SEATS;
  var cols = LAYOUT_COLS[Math.min(totalSlots, LAYOUT_COLS.length - 1)] || 5;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))',
        gap: 6,
        width: '100%',
        height: '100%',
        padding: 4,
        boxSizing: 'border-box',
        background: '#080B12',
        alignContent: 'start',
      }}
    >
      {Array.from({ length: totalSlots }).map(function(_, idx) {
        var g   = seats[idx] || null;
        var gid = g ? (g.guestId || g.userId || ('seat-' + idx)) : ('empty-' + idx);
        var isOwn = g && g.userId === userId;

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
              aspectRatio: '1 / 1',
            }}
          >
            {g ? (
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
                activeEffect={activeEffects[gid] || null}
                handRaised={!!(handRaisedSet[gid] || handRaisedSet[g.guestId] || handRaisedSet[g.userId])}
                onPowerPlay={onPowerPlay || null}
              />
            ) : (
              /* Empty seat placeholder */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.08)',
                  fontSize: 18,
                  userSelect: 'none',
                }}
              >
                +
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
