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
}) {
  var seats = (guests || []).slice(0, MAX_SEATS);

  return (
    <div
      style={{
        display: 'grid',
        // 5 columns; each column is at least 1px wide so the grid never overflows.
        // repeat(5, minmax(0, 1fr)) distributes space evenly without scroll.
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
        var g   = seats[idx] || null;
        var gid = g ? (g.guestId || g.userId || ('seat-' + idx)) : ('empty-' + idx);
        var isOwn = g && gid === userId;

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
