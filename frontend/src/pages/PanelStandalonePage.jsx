// Standalone panel room accessible via /panel/:slug
// Renders the full PanelGrid for viewers and panelists who navigate directly to a panel URL.
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { getSocket } from '../socket.js';
import rtcManager from '../webrtc.js';

var PanelGrid = React.lazy(function() { return import('../components/panel/PanelGrid.jsx'); });

var GOLD = '#C9A84C';
var CREAM = '#F0E8D4';
var BG = '#0E0C09';
var RED = '#FF1A3C';

var API = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? 'http://localhost:3001'
  : 'https://api.seewhylive.online';

export default function PanelStandalonePage(props) {
  var slug = props.slug;
  var [streamInfo, setStreamInfo] = useState(null);
  var [error, setError] = useState(null);
  var [loading, setLoading] = useState(true);
  var [socketReady, setSocketReady] = useState(false);
  var [toasts, setToasts] = useState([]);
  var [userId, setUserId] = useState('viewer-' + Math.random().toString(36).slice(2, 8));
  var [username, setUsername] = useState('Viewer');
  var socketRef = useRef(null);

  var addToast = function(msg, type) {
    var id = Date.now() + Math.random();
    setToasts(function(t) { return t.concat([{ id: id, msg: msg, type: type || 'info' }]); });
    setTimeout(function() {
      setToasts(function(t) { return t.filter(function(x) { return x.id !== id; }); });
    }, 4000);
  };

  useEffect(function() {
    if (!slug) { setError('No panel slug provided'); setLoading(false); return; }
    fetch(API + '/api/rooms/by-slug/' + encodeURIComponent(slug))
      .then(function(r) {
        if (!r.ok) throw new Error('Panel not found (HTTP ' + r.status + ')');
        return r.json();
      })
      .then(function(data) {
        setStreamInfo(data);
        setLoading(false);
      })
      .catch(function(err) {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  useEffect(function() {
    if (!streamInfo) return;
    var socket = getSocket();
    socketRef.current = socket;

    var token = typeof window !== 'undefined' ? (localStorage.getItem('sw_token') || '') : '';
    socket.emit('join-room', {
      roomId: streamInfo.id,
      role: 'viewer',
      token: token,
      userId: userId,
      username: username,
    });

    socket.on('connect', function() { setSocketReady(true); });
    setSocketReady(socket.connected);

    rtcManager.connect(socket, streamInfo.id, userId, 'viewer').catch(function() {});

    return function() {
      rtcManager.disconnect && rtcManager.disconnect();
    };
  }, [streamInfo]);

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: CREAM, fontFamily: '"DM Sans", sans-serif', fontSize: 16 }}>Loading panel...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: CREAM, fontFamily: '"DM Sans", sans-serif' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📡</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Panel Not Found</div>
          <div style={{ color: '#888', fontSize: 14 }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 22, color: GOLD, letterSpacing: 2 }}>SEEWHY</span>
        {streamInfo && (
          <span style={{ color: CREAM, fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {streamInfo.title || 'Live Panel'}
          </span>
        )}
        {streamInfo && streamInfo.is_live && (
          <span style={{ background: RED, color: CREAM, fontFamily: '"DM Sans", sans-serif', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}>LIVE</span>
        )}
      </div>

      {/* Panel Grid */}
      <div style={{ flex: 1, padding: '8px 8px 0 8px', minHeight: 0 }}>
        <Suspense fallback={<div style={{ color: CREAM, padding: 24, fontFamily: '"DM Sans", sans-serif' }}>Loading panel grid...</div>}>
          {streamInfo && socketRef.current && (
            <PanelGrid
              socket={socketRef.current}
              roomId={streamInfo.id}
              userId={userId}
              username={username}
              isHost={false}
              rtcManager={rtcManager}
              guests={[]}
              addToast={addToast}
              panelInvite={null}
              setPanelInvite={function() {}}
              viewerCount={streamInfo.viewer_count || 0}
              isLive={streamInfo.is_live || false}
              uptime={0}
              streamTitle={streamInfo.title || ''}
            />
          )}
        </Suspense>
      </div>

      {/* Toast notifications */}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
        {toasts.map(function(t) {
          return (
            <div key={t.id} style={{ background: t.type === 'error' ? RED : '#1a1a1a', color: CREAM, padding: '8px 16px', borderRadius: 8, fontFamily: '"DM Sans", sans-serif', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.5)', border: '1px solid #333' }}>
              {t.msg}
            </div>
          );
        })}
      </div>
    </div>
  );
}
