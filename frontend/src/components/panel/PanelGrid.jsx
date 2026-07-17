// frontend/src/components/panel/PanelGrid.jsx
import { useEffect, useState, useRef } from 'react';
import panelService from '../../services/panelService';
import PanelTile from './PanelTile';
import PrivateRoomGate from './PrivateRoomGate';
import PanelJoinModal from './PanelJoinModal';
import JoinRequestQueue from './JoinRequestQueue';
import AudioOnlyToggle from './AudioOnlyToggle';
import PanelReactionBar from './PanelReactionBar';
import PanelPrivacySettings from './PanelPrivacySettings';
import { useAutoSpeakGate } from '../../hooks/useAutoSpeakGate.js';

const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';
const RED = '#dc2626';

/**
 * Responsive grid: N tiles in a roughly-square grid when nothing is
 * expanded; when one tile is expanded, it takes the majority of the space
 * and the rest collapse into a scrollable strip. Works for any count up to
 * the platform's MAX_PANEL_GUESTS=20 ceiling.
 */
export default function PanelGrid({ socket, roomId, userId, isHost, rtcManager, guests }) {
  const [slots, setSlots] = useState([]);
  const [gatingMode, setGatingMode] = useState(null);
  const [isAudioOnlyRoom, setIsAudioOnlyRoom] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
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

  useEffect(function() {
    if (!socket || !roomId) return;
    var unsubs = [];
    (function() {
      panelService.fetchPanelState(roomId)
        .then(function(initial) {
          var slotArr = Array.isArray(initial) ? initial : (initial.slots || []);
          setSlots(slotArr);
          if (!Array.isArray(initial) && initial.gatingMode) setGatingMode(initial.gatingMode);
        })
        .catch(function() {});

      unsubs.push(panelService.onSlotAssigned(socket, function(payload) {
        var rid = payload.roomId, slot = payload.slot;
        if (rid !== roomId) return;
        setSlots(function(prev) {
          var exists = prev.some(function(s) { return s.slot_index === slot.slot_index; });
          return exists
            ? prev.map(function(s) { return s.slot_index === slot.slot_index ? Object.assign({}, s, slot) : s; })
            : prev.concat([slot]);
        });
      }));

      unsubs.push(panelService.onSlotReleased(socket, function(payload) {
        var rid = payload.roomId, releasedUserId = payload.userId;
        if (rid !== roomId) return;
        setSlots(function(prev) { return prev.filter(function(s) { return s.user_id !== releasedUserId; }); });
      }));

      unsubs.push(panelService.onLayoutUpdate(socket, function(payload) {
        var rid = payload.roomId, slot = payload.slot;
        if (rid !== roomId) return;
        setSlots(function(prev) {
          return prev.map(function(s) {
            return s.slot_index === slot.slot_index
              ? Object.assign({}, s, { is_expanded: slot.is_expanded })
              : Object.assign({}, s, { is_expanded: false });
          });
        });
      }));

      unsubs.push(panelService.onAudioOnlyChanged(socket, function(payload) {
        var rid = payload.roomId, isAudioOnly = payload.isAudioOnly;
        if (rid !== roomId) return;
        setIsAudioOnlyRoom(isAudioOnly);
      }));

      function onSlotMuted(payload) {
        var rid = payload.roomId, uid = payload.userId, isMuted = payload.isMuted;
        if (rid !== roomId) return;
        setSlots(function(prev) {
          return prev.map(function(s) { return s.user_id === uid ? Object.assign({}, s, { is_muted: isMuted }) : s; });
        });
      }
      socket.on('panel:slot_muted', onSlotMuted);
      unsubs.push(function() { socket.off('panel:slot_muted', onSlotMuted); });

      function onKicked(payload) {
        if (payload.roomId !== roomId) return;
        // If this client was kicked, remove their slot from local state
        setSlots(function(prev) { return prev.filter(function(s) { return s.user_id !== userId; }); });
      }
      socket.on('panel:kicked', onKicked);
      unsubs.push(function() { socket.off('panel:kicked', onKicked); });
    })();

    return function() { unsubs.forEach(function(u) { u(); }); };
  }, [socket, roomId]);

  var hasSlot = slots.some(function(s) { return s.user_id === userId; });

  // Private room gate — shown to non-hosts who haven't claimed a slot
  if (gatingMode && !isHost && !hasSlot) {
    return (
      <PrivateRoomGate
        socket={socket}
        roomId={roomId}
        gatingMode={gatingMode}
        onJoined={function(slot) {
          setSlots(function(prev) { return prev.concat([slot]); });
          setGatingMode(null);
        }}
      />
    );
  }

  function handleJoined(slot) {
    setSlots(function(prev) {
      var exists = prev.some(function(s) { return s.slot_index === slot.slot_index; });
      return exists
        ? prev.map(function(s) { return s.slot_index === slot.slot_index ? Object.assign({}, s, slot) : s; })
        : prev.concat([slot]);
    });
    setShowJoinModal(false);
  }

  function handleLeave() {
    if (!socket) return;
    panelService.leavePanel(socket, roomId);
    setSlots(function(prev) { return prev.filter(function(s) { return s.user_id !== userId; }); });
  }

  function tileProps(slot) {
    var isLocal = !!(userId && slot.user_id === userId);
    var guest = guests && guests.find(function(g) { return (g.guestId || g.userId) === slot.user_id; });
    return {
      socket: socket,
      roomId: roomId,
      slot: slot,
      isAudioOnlyRoom: isAudioOnlyRoom,
      isHost: isHost,
      micLevel: isLocal ? gate.micLevel : 0,
      isSpeaking: isLocal ? gate.isSpeaking : false,
      rtcManager: rtcManager || null,
      producerId: guest ? (guest.producerId || null) : null,
      audioProducerId: guest ? (guest.audioProducerId || null) : null,
      isLocal: isLocal,
      onKick: (!isLocal && isHost)
        ? function() { panelService.kickPanelist(socket, roomId, slot.user_id).catch(function() {}); }
        : null,
      onMuteToggle: (!isLocal && isHost)
        ? function(isMuted) { panelService.mutePanelist(socket, roomId, slot.user_id, isMuted); }
        : null,
    };
  }

  var expandedSlot = slots.find(function(s) { return s.is_expanded; });
  var otherSlots = slots.filter(function(s) { return !s.is_expanded; });

  var videoProducer = rtcManager && rtcManager.producers && rtcManager.producers['video'];

  function renderControls() {
    return (
      <div style={{ padding: '6px 8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: GOLD, fontSize: 11, fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
            PANEL {slots.length > 0 && <span style={{ color: '#888' }}>· {slots.length} live</span>}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isHost && (
              <AudioOnlyToggle
                socket={socket}
                roomId={roomId}
                isAudioOnly={isAudioOnlyRoom}
                videoProducer={videoProducer || null}
              />
            )}
            {isHost && <PanelPrivacySettings roomId={roomId} />}
            {!hasSlot && userId && (
              <button
                onClick={function() { setShowJoinModal(true); }}
                style={{
                  background: GOLD, color: '#111', border: 'none',
                  borderRadius: 6, padding: '5px 12px', fontSize: 12,
                  fontWeight: 700, fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                }}
              >
                + Join Panel
              </button>
            )}
            {hasSlot && (
              <button
                onClick={handleLeave}
                style={{
                  background: 'transparent', color: RED, border: '1px solid ' + RED,
                  borderRadius: 6, padding: '5px 10px', fontSize: 12,
                  fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                }}
              >
                Leave Panel
              </button>
            )}
          </div>
        </div>
        {isHost && (
          <JoinRequestQueue socket={socket} roomId={roomId} />
        )}
      </div>
    );
  }

  var cols = slots.length <= 1 ? 1 : slots.length <= 4 ? 2 : slots.length <= 9 ? 3 : slots.length <= 16 ? 4 : 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {renderControls()}

      {slots.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#555', fontFamily: '"DM Sans", sans-serif' }}>
          <div style={{ fontSize: 36 }}>🎙</div>
          <div style={{ fontSize: 14 }}>No one is on the panel yet</div>
          {userId && !hasSlot && (
            <button
              onClick={function() { setShowJoinModal(true); }}
              style={{
                background: GOLD, color: '#111', border: 'none',
                borderRadius: 8, padding: '10px 24px', fontSize: 14,
                fontWeight: 700, fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
              }}
            >
              Be the first — Join Panel
            </button>
          )}
        </div>
      ) : expandedSlot ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
          <div style={{ flex: 1 }}>
            <PanelTile {...tileProps(expandedSlot)} />
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {otherSlots.map(function(slot) {
              return (
                <div key={slot.slot_index} style={{ minWidth: 70, width: 70, flexShrink: 0 }}>
                  <PanelTile {...tileProps(slot)} />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', 1fr)', gap: 6, padding: 8 }}>
          {slots.map(function(slot) {
            return <PanelTile key={slot.slot_index} {...tileProps(slot)} />;
          })}
        </div>
      )}

      {/* Reaction bar + floating emojis (relative container for floats) */}
      {slots.length > 0 && (
        <div style={{ position: 'relative', padding: '6px 8px 4px', display: 'flex', justifyContent: 'center' }}>
          <PanelReactionBar socket={socket} roomId={roomId} userId={userId} />
        </div>
      )}

      {showJoinModal && (
        <PanelJoinModal
          socket={socket}
          roomId={roomId}
          onJoined={handleJoined}
          onCancel={function() { setShowJoinModal(false); }}
        />
      )}
    </div>
  );
}
