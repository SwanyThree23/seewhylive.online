// frontend/src/components/panel/PanelGrid.jsx
import { useEffect, useState } from 'react';
import PanelTile from './PanelTile';
import { fetchPanelState, onSlotAssigned, onSlotReleased, onLayoutUpdate, onAudioOnlyChanged } from '../../services/panelService';

/**
 * Responsive grid: N tiles in a roughly-square grid when nothing is
 * expanded; when one tile is expanded, it takes the majority of the space
 * and the rest collapse into a scrollable strip. Works for any count up to
 * the platform's MAX_PANEL_GUESTS=20 ceiling.
 */
export default function PanelGrid({ roomId, isHost }) {
  const [slots, setSlots] = useState([]);
  const [isAudioOnlyRoom, setIsAudioOnlyRoom] = useState(false);

  useEffect(() => {
    let unsubs = [];
    (async () => {
      const initial = await fetchPanelState(roomId);
      setSlots(initial);

      unsubs.push(onSlotAssigned(({ roomId: rid, slot }) => {
        if (rid !== roomId) return;
        setSlots((prev) => {
          const exists = prev.some((s) => s.slot_index === slot.slot_index);
          return exists ? prev.map((s) => (s.slot_index === slot.slot_index ? { ...s, ...slot } : s)) : [...prev, slot];
        });
      }));

      unsubs.push(onSlotReleased(({ roomId: rid, userId }) => {
        if (rid !== roomId) return;
        setSlots((prev) => prev.filter((s) => s.user_id !== userId));
      }));

      unsubs.push(onLayoutUpdate(({ roomId: rid, slot }) => {
        if (rid !== roomId) return;
        setSlots((prev) => prev.map((s) => (s.slot_index === slot.slot_index ? { ...s, is_expanded: slot.is_expanded } : { ...s, is_expanded: false })));
      }));

      unsubs.push(onAudioOnlyChanged(({ roomId: rid, isAudioOnly }) => {
        if (rid !== roomId) return;
        setIsAudioOnlyRoom(isAudioOnly);
      }));
    })();

    return () => unsubs.forEach((u) => u());
  }, [roomId]);

  const expandedSlot = slots.find((s) => s.is_expanded);
  const otherSlots = slots.filter((s) => !s.is_expanded);

  if (expandedSlot) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
        <div style={{ width: '100%' }}>
          <PanelTile roomId={roomId} slot={expandedSlot} isAudioOnlyRoom={isAudioOnlyRoom} isHost={isHost} />
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {otherSlots.map((slot) => (
            <div key={slot.slot_index} style={{ minWidth: 70, width: 70 }}>
              <PanelTile roomId={roomId} slot={slot} isAudioOnlyRoom={isAudioOnlyRoom} isHost={isHost} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No tile expanded — even grid. Column count scales with guest count.
  const cols = slots.length <= 4 ? 2 : slots.length <= 9 ? 3 : slots.length <= 16 ? 4 : 5;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 6,
        padding: 8,
      }}
    >
      {slots.map((slot) => (
        <PanelTile key={slot.slot_index} roomId={roomId} slot={slot} isAudioOnlyRoom={isAudioOnlyRoom} isHost={isHost} />
      ))}
    </div>
  );
}
