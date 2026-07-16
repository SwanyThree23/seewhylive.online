// frontend/src/components/panel/PanelGrid.jsx
import { useEffect, useState, useRef } from 'react';
import panelService from '../../services/panelService';
import PanelTile from './PanelTile';
import { useAutoSpeakGate } from '../../hooks/useAutoSpeakGate.js';

/**
 * Responsive grid: N tiles in a roughly-square grid when nothing is
 * expanded; when one tile is expanded, it takes the majority of the space
 * and the rest collapse into a scrollable strip. Works for any count up to
 * the platform's MAX_PANEL_GUESTS=20 ceiling.
 */
export default function PanelGrid({ socket, roomId, userId, isHost }) {
  const [slots, setSlots] = useState([]);
  const [isAudioOnlyRoom, setIsAudioOnlyRoom] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);

  // Acquire local mic stream for speaking-level visualization on local tile
  useEffect(function() {
    if (!isAudioOnlyRoom || !userId) return;
    var active = true;
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(function(stream) {
        if (!active) { stream.getTracks().forEach(function(t) { t.stop(); }); return; }
        localStreamRef.current = stream;
        setLocalStream(stream);
      })
      .catch(function() {});
    return function() {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
        localStreamRef.current = null;
        setLocalStream(null);
      }
    };
  }, [isAudioOnlyRoom, userId]);

  var gate = useAutoSpeakGate({ stream: localStream });

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

      unsubs.push(panelService.onSlotReleased(socket, function({ roomId: rid, userId: releasedUserId }) {
        if (rid !== roomId) return;
        setSlots(function(prev) { return prev.filter(function(s) { return s.user_id !== releasedUserId; }); });
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

  function tileProps(slot) {
    var isLocal = userId && slot.user_id === userId;
    return {
      socket: socket,
      roomId: roomId,
      slot: slot,
      isAudioOnlyRoom: isAudioOnlyRoom,
      isHost: isHost,
      micLevel: isLocal ? gate.micLevel : 0,
      isSpeaking: isLocal ? gate.isSpeaking : false,
    };
  }

  if (expandedSlot) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
        <div style={{ width: '100%' }}>
          <PanelTile {...tileProps(expandedSlot)} />
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {otherSlots.map(function(slot) {
            return (
              <div key={slot.slot_index} style={{ minWidth: 70, width: 70 }}>
                <PanelTile {...tileProps(slot)} />
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
          <PanelTile key={slot.slot_index} {...tileProps(slot)} />
        );
      })}
    </div>
  );
}
