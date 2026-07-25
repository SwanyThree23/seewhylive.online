import React, { useState, useEffect } from 'react';
import OctCell from './OctCell';

var COLS = 5;
var ROWS = 4;
var TOTAL = COLS * ROWS; // 20 seats

export default function PanelGrid({ guests, socket, roomId, userId, rtcManager, mediaConfig, branding, onTap, isMutedMap, isCamOffMap }) {
  var [giftTotals, setGiftTotals] = useState({}); // guestId → cents

  useEffect(function() {
    if (!socket) return;
    function onGiftReceived(data) {
      if (data.guestTotals) {
        setGiftTotals(function(prev) { return Object.assign({}, prev, data.guestTotals); });
      } else if (data.toGuestId && data.valueCents) {
        setGiftTotals(function(prev) {
          var next = Object.assign({}, prev);
          next[data.toGuestId] = (next[data.toGuestId] || 0) + data.valueCents;
          return next;
        });
      }
    }
    socket.on('gift-received', onGiftReceived);
    return function() { socket.off('gift-received', onGiftReceived); };
  }, [socket]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(' + COLS + ', 1fr)',
        gridTemplateRows: 'repeat(' + ROWS + ', 1fr)',
        gap: 6,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: TOTAL }, function(_, i) {
        var guest  = guests && guests[i] ? guests[i] : { guestId: 'empty-' + i, username: '' };
        var gid    = guest.guestId || guest.userId || ('empty-' + i);
        var muted  = isMutedMap  ? !!isMutedMap[gid]  : false;
        var camOff = isCamOffMap ? !!isCamOffMap[gid] : false;

        return (
          <div
            key={gid}
            style={{ position: 'relative', minWidth: 0, minHeight: 0 }}
          >
            <OctCell
              guest={guest}
              fill
              socket={socket}
              roomId={roomId}
              userId={userId}
              rtcManager={rtcManager}
              mediaConfig={mediaConfig}
              branding={branding}
              isMuted={muted}
              isCamOff={camOff}
              giftTotal={giftTotals[gid] || 0}
              onTap={guest.guestId && !guest.guestId.startsWith('empty-') ? onTap : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
