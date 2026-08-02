import React, { useEffect, useRef } from 'react';
import OctCell from './OctCell.jsx';

var MAX_SEATS = 20;

var _styleInjected = false;
function injectGridStyles() {
  if (_styleInjected || typeof document === 'undefined') return;
  _styleInjected = true;
  var el = document.createElement('style');
  el.textContent = [
    '@keyframes panelCellEnter{from{opacity:0;transform:scale(.75)}to{opacity:1;transform:scale(1)}}',
    '@keyframes panelCellExit{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.75)}}',
  ].join('');
  document.head.appendChild(el);
}

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
  screenSharingIds,
  onHostMute,
  onHostKick,
}) {
  if (!giftTotals) giftTotals = {};
  if (!screenSharingIds) screenSharingIds = {};
  var seats = (guests || []).slice(0, MAX_SEATS);

  var prevSeatsRef = useRef([]);
  useEffect(function() { prevSeatsRef.current = seats.map(function(g) { return g ? (g.guestId || g.userId) : null; }); });

  useEffect(function() { injectGridStyles(); }, []);

  return (
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
        var g   = seats[idx] || null;
        var gid = g ? (g.guestId || g.userId || ('seat-' + idx)) : ('empty-' + idx);
        var isOwn = g && gid === userId;
        var prevId = prevSeatsRef.current[idx];
        var isNewGuest = g && gid !== prevId;

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
              animation: g && isNewGuest ? 'panelCellEnter .3s ease' : 'none',
            }}
          >
            {g ? (
              <OctCell
                guest={g}
                fill={true}
                isHost={isOwn ? true : (g.role === 'host')}
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
                isScreenSharing={!!(screenSharingIds[gid])}
                onHostMute={isHost && !isOwn ? onHostMute : null}
                onHostKick={isHost && !isOwn ? onHostKick : null}
              />
            ) : (
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
