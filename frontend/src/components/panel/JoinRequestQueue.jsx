// frontend/src/components/panel/JoinRequestQueue.jsx
import { useEffect, useState } from 'react';
import panelService from '../../services/panelService';

const BG = '#0C0806';
const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';

export default function JoinRequestQueue({ socket, roomId }) {
  const [requests, setRequests] = useState([]);

  useEffect(function() {
    if (!socket || !roomId) return;
    panelService.fetchJoinRequests(roomId).then(setRequests).catch(function() {});
    var unsub = panelService.onJoinRequestReceived(socket, function({ roomId: rid, userId, requestId, displayName, avatarUrl }) {
      if (rid !== roomId) return;
      setRequests(function(prev) { return prev.concat([{ id: requestId, user_id: userId, display_name: displayName, avatar_url: avatarUrl }]); });
    });
    return unsub;
  }, [socket, roomId]);

  async function handleResolve(userId, approve) {
    try {
      await panelService.resolveJoinRequest(socket, roomId, userId, approve);
      setRequests(function(prev) { return prev.filter(function(r) { return r.user_id !== userId; }); });
    } catch (e) { /* non-fatal */ }
  }

  if (!requests.length) return null;

  return (
    <div style={{ background: BG, borderRadius: 10, padding: 12, marginBottom: 12 }}>
      <h4 style={{ color: GOLD, fontFamily: '"Barlow Condensed", sans-serif', fontSize: 14, marginBottom: 8 }}>
        Join Requests ({requests.length})
      </h4>
      {requests.map(function(req) {
        return (
          <div key={req.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {req.avatar_url && <img src={req.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
              <span style={{ color: CREAM, fontSize: 14 }}>{req.display_name || req.user_id}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={function() { handleResolve(req.user_id, true); }} style={{ background: GOLD, border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>✓</button>
              <button onClick={function() { handleResolve(req.user_id, false); }} style={{ background: 'transparent', border: '1px solid #666', color: CREAM, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
