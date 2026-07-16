// frontend/src/components/panel/PanelTile.jsx
import panelService from '../../services/panelService';

const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';
const BG = '#1a1a1a';
const LIVE_RED = '#dc2626';

// INTEGRATION: replace with your actual mediasoup consumer video element —
// this renders whatever ref/stream your existing panel video logic already
// produces per participant. Swap the placeholder <div> for that component.
// import RemoteStreamPlayer from '../RemoteStreamPlayer';

export default function PanelTile({ socket, roomId, slot, isAudioOnlyRoom, isHost }) {
  const { slot_index, user_id, display_name, avatar_url, is_expanded, is_muted } = slot;

  function handleTap() {
    if (socket) panelService.expandTile(socket, roomId, slot_index, !is_expanded);
  }

  return (
    <div
      onClick={handleTap}
      style={{
        position: 'relative',
        background: BG,
        borderRadius: 8,
        overflow: 'hidden',
        border: slot_index === 0 ? `2px solid ${GOLD}` : '1px solid #333',
        cursor: 'pointer',
        aspectRatio: '9/16',
      }}
    >
      {isAudioOnlyRoom ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <img src={avatar_url} alt={display_name} style={{ width: 56, height: 56, borderRadius: '50%' }} />
          {/* INTEGRATION: replace with a real audio-level waveform driven by
             the mediasoup audio consumer's AudioContext analyser */}
          <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
            {[1, 2, 3, 4].map(function(i) {
              return <span key={i} style={{ width: 3, height: 6 + i * 3, background: GOLD, borderRadius: 2 }} />;
            })}
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', background: '#000' }}>
          {/* <RemoteStreamPlayer roomId={roomId} userId={user_id} /> */}
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 4, left: 4, color: CREAM, fontSize: 11, fontFamily: '"DM Sans", sans-serif', textShadow: '0 1px 2px #000' }}>
        {display_name}
      </div>

      {is_muted && (
        <span style={{ position: 'absolute', top: 4, right: 4, background: LIVE_RED, borderRadius: 4, padding: '2px 4px', fontSize: 10, color: CREAM }}>
          MUTED
        </span>
      )}
    </div>
  );
}
