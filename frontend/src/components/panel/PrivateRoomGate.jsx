// frontend/src/components/panel/PrivateRoomGate.jsx
import { useEffect, useState } from 'react';
import panelService from '../../services/panelService';

const BG = '#0C0806';
const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';
const RED = '#dc2626';

export default function PrivateRoomGate({ socket, roomId, gatingMode, onJoined }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [requested, setRequested] = useState(false);
  const [pending, setPending] = useState(false);
  const [denied, setDenied] = useState(false);

  // When host resolves our join request in approval mode, auto-join or show denial
  useEffect(function() {
    if (!socket || gatingMode !== 'approval') return;
    var unsub = panelService.onJoinRequestResolved(socket, function(payload) {
      if (payload.roomId !== roomId) return;
      if (payload.approve) {
        // Approved — claim the slot now
        panelService.joinPanel(socket, roomId, null)
          .then(function(slot) { onJoined(slot); })
          .catch(function(err) { setError(err.message); });
      } else {
        setDenied(true);
        setRequested(false);
      }
    });
    return unsub;
  }, [socket, roomId, gatingMode]);

  async function handleCodeSubmit() {
    setPending(true);
    setError(null);
    try {
      var slot = await panelService.joinPanel(socket, roomId, code.trim().toUpperCase());
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
    setDenied(false);
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
            onKeyDown={function(e) { if (e.key === 'Enter' && code.trim()) handleCodeSubmit(); }}
            placeholder="Enter invite code"
            maxLength={8}
            style={{
              width: '100%', padding: 10, borderRadius: 8, border: '1px solid ' + GOLD,
              background: 'transparent', color: CREAM, textAlign: 'center', letterSpacing: 4,
              marginBottom: 12, textTransform: 'uppercase', fontSize: 18, fontFamily: 'monospace',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleCodeSubmit}
            disabled={pending || !code.trim()}
            style={{
              width: '100%', background: (!code.trim() || pending) ? '#333' : GOLD,
              color: (!code.trim() || pending) ? '#888' : '#0C0806',
              border: 'none', borderRadius: 8, padding: '12px 0',
              fontFamily: '"Barlow Condensed", sans-serif', fontSize: 16,
              cursor: (!code.trim() || pending) ? 'default' : 'pointer',
            }}
          >
            {pending ? 'Joining…' : 'Join Panel'}
          </button>
        </>
      )}

      {gatingMode === 'approval' && (
        denied ? (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>😔</div>
            <p style={{ color: RED, fontFamily: '"DM Sans", sans-serif', marginBottom: 12 }}>
              Your request was declined by the host.
            </p>
            <button
              onClick={function() { setDenied(false); }}
              style={{
                background: 'transparent', border: '1px solid #555', color: '#888',
                borderRadius: 8, padding: '8px 20px', fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        ) : requested ? (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
            <p style={{ color: GOLD, fontFamily: '"DM Sans", sans-serif' }}>
              Request sent — waiting for host approval.
            </p>
            <p style={{ color: '#555', fontSize: 11, fontFamily: '"DM Sans", sans-serif', marginTop: 8 }}>
              You'll be added automatically when approved.
            </p>
          </div>
        ) : (
          <button
            onClick={handleRequestJoin}
            disabled={pending}
            style={{
              width: '100%', background: pending ? '#333' : GOLD,
              color: pending ? '#888' : '#0C0806', border: 'none', borderRadius: 8,
              padding: '12px 0', fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 16, cursor: pending ? 'default' : 'pointer',
            }}
          >
            {pending ? 'Requesting…' : 'Request to Join'}
          </button>
        )
      )}

      {error && <p style={{ color: RED, fontSize: 13, marginTop: 12, fontFamily: '"DM Sans", sans-serif' }}>{error}</p>}
    </div>
  );
}
