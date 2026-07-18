// frontend/src/components/panel/AudioOnlyToggle.jsx
import { useState } from 'react';
import panelService from '../../services/panelService';

const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';

/**
 * Host-only control. Toggling this both updates the room's persisted mode
 * (via socket → panelService.setAudioOnly) AND must pause/close the local
 * video producer to actually save bandwidth — see the INTEGRATION note.
 */
export default function AudioOnlyToggle({ socket, roomId, isAudioOnly, videoProducer }) {
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    setPending(true);
    var next = !isAudioOnly;

    // INTEGRATION: this is the actual bandwidth-saving part. `videoProducer`
    // should be the mediasoup-client Producer for this room's local video
    // track. Pausing it stops sending video frames without renegotiating
    // the whole connection; resuming it turns video back on.
    try {
      if (videoProducer) {
        if (next) await videoProducer.pause();
        else await videoProducer.resume();
      }
      panelService.toggleAudioOnly(socket, roomId, next);
    } catch (e) { /* non-fatal */ }
    setPending(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: isAudioOnly ? GOLD : 'transparent',
        color: isAudioOnly ? '#0C0806' : CREAM,
        border: `1px solid ${GOLD}`,
        borderRadius: 8,
        padding: '8px 14px',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontSize: 14,
        cursor: pending ? 'not-allowed' : 'pointer',
        opacity: pending ? 0.6 : 1,
      }}
    >
      🎙️ {isAudioOnly ? 'Audio Only' : 'Go Audio Only'}
    </button>
  );
}
