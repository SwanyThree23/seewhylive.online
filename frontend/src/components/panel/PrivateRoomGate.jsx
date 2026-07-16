// frontend/src/components/panel/PrivateRoomGate.jsx
import { useState } from 'react';
import panelService from '../../services/panelService';

const BG = '#0C0806';
const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';

export default function PrivateRoomGate({ socket, roomId, gatingMode, onJoined }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [requested, setRequested] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleCodeSubmit() {
    setPending(true);
    setError(null);
    try {
      const slot = await panelService.joinPanel(socket, roomId, code.trim().toUpperCase());
      onJoined(slot);
    } catch (err) {
      setError(err.message === 'invalid_code' ? 'Invalid invite code' : err.message);
    } finally {
      setPending(false);
    }
  }

  async function handleRequestJoin() {
    setPending(true);
    setError(null);
    try {
      await panelService.requestJoin(socket, roomId);
      setRequested(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ background: BG, padding: 24, borderRadius: 12, textAlign: 'center', maxWidth: 360, margin: '0 auto' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
      <h3 style={{ color: CREAM, fontFamily: '"Bebas Neue", sans-serif', fontSize: 22, marginBottom: 16 }}>
        This is a Private Panel
      </h3>

      {gatingMode === 'invite_code' && (
        <>
          <input
            value={code}
            onChange={function(e) { setCode(e.target.value); }}
            placeholder="Enter invite code"
            style={{
              width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${GOLD}`,
              background: 'transparent', color: CREAM, textAlign: 'center', letterSpacing: 2,
              marginBottom: 12, textTransform: 'uppercase',
            }}
          />
          <button
            onClick={handleCodeSubmit}
            disabled={pending || !code}
            style={{ width: '100%', background: GOLD, color: '#0C0806', border: 'none', borderRadius: 8, padding: '12px 0', fontFamily: '"Barlow Condensed", sans-serif', fontSize: 16, cursor: 'pointer' }}
          >
            Join Panel
          </button>
        </>
      )}

      {gatingMode === 'approval' && (
        requested ? (
          <p style={{ color: GOLD, fontFamily: '"DM Sans", sans-serif' }}>Request sent — waiting for host approval.</p>
        ) : (
          <button
            onClick={handleRequestJoin}
            disabled={pending}
            style={{ width: '100%', background: GOLD, color: '#0C0806', border: 'none', borderRadius: 8, padding: '12px 0', fontFamily: '"Barlow Condensed", sans-serif', fontSize: 16, cursor: 'pointer' }}
          >
            Request to Join
          </button>
        )
      )}

      {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{error}</p>}
    </div>
  );
}
