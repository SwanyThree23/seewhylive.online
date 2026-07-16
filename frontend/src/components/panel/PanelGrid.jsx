// frontend/src/components/panel/PanelGrid.jsx
import { useEffect, useState } from 'react';
import panelService from '../../services/panelService';
import PanelTile from './PanelTile';

/**
 * Responsive grid: N tiles in a roughly-square grid when nothing is
 * expanded; when one tile is expanded, it takes the majority of the space
 * and the rest collapse into a scrollable strip. Works for any count up to
 * the platform's MAX_PANEL_GUESTS=20 ceiling.
 */
export default function PanelGrid({ socket, roomId, isHost }) {
  const [slots, setSlots] = useState([]);
  const [isAudioOnlyRoom, setIsAudioOnlyRoom] = useState(false);

  useEffect(() => {
    if (!socket || !roomId) return;
    let unsubs = [];
    (async () => {
      try {
        const initial = await panelService.fetchPanelState(roomId);
        setSlots(initial || []);
      } catch (e) { /* non-fatal — sockets will sync */ }

      unsubs.push(panelService.onSlotAssigned(socket, function({ roomId: rid, slot }) {
        if (rid !== roomId) return;
        setSlots(function(prev) {
          var exists = prev.some(function(s) { return s.slot_index === slot.slot_index; });
          return exists ? prev.map(function(s) { return s.slot_index === slot.slot_index ? Object.assign({}, s, slot) : s; }) : prev.concat([slot]);
        });
      }));

      unsubs.push(panelService.onSlotReleased(socket, function({ roomId: rid, userId }) {
        if (rid !== roomId) return;
        setSlots(function(prev) { return prev.filter(function(s) { return s.user_id !== userId; }); });
      }));

      unsubs.push(panelService.onLayoutUpdate(socket, function({ roomId: rid, slot }) {
        if (rid !== roomId) return;
        setSlots(function(prev) {
          return prev.map(function(s) {
            return s.slot_index === slot.slot_index ? Object.assign({}, s, { is_expanded: slot.is_expanded }) : Object.assign({}, s, { is_expanded: false });
          });
        });
      }));

      unsubs.push(panelService.onAudioOnlyChanged(socket, function({ roomId: rid, isAudioOnly }) {
        if (rid !== roomId) return;
        setIsAudioOnlyRoom(isAudioOnly);
      }));
    })();

    return function() { unsubs.forEach(function(u) { u(); }); };
  }, [socket, roomId]);

  var expandedSlot = slots.find(function(s) { return s.is_expanded; });
  var otherSlots = slots.filter(function(s) { return !s.is_expanded; });

  if (expandedSlot) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
        <div style={{ width: '100%' }}>
          <PanelTile socket={socket} roomId={roomId} slot={expandedSlot} isAudioOnlyRoom={isAudioOnlyRoom} isHost={isHost} />
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {otherSlots.map(function(slot) {
            return (
              <div key={slot.slot_index} style={{ minWidth: 70, width: 70 }}>
                <PanelTile socket={socket} roomId={roomId} slot={slot} isAudioOnlyRoom={isAudioOnlyRoom} isHost={isHost} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  var cols = slots.length <= 4 ? 2 : slots.length <= 9 ? 3 : slots.length <= 16 ? 4 : 5;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', 1fr)', gap: 6, padding: 8 }}>
      {slots.map(function(slot) {
        return (
          <PanelTile key={slot.slot_index} socket={socket} roomId={roomId} slot={slot} isAudioOnlyRoom={isAudioOnlyRoom} isHost={isHost} />
        );
      })}
    </div>
  );
}
