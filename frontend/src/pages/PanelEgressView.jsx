// Headless branded egress view for /panel/:slug/egress-view
// Designed to be captured by FFmpeg browser-source or OBS browser plugin.
// No controls — just the branded panel stage + BrandChyron overlay.
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { getSocket } from '../socket.js';
import rtcManager from '../webrtc.js';
import BrandChyron from '../components/BrandChyron.jsx';

var PanelGrid = React.lazy(function() { return import('../components/panel/PanelGrid.jsx'); });

var GOLD = '#C9A84C';
var CREAM = '#F0E8D4';
var BG = '#0E0C09';
var RED = '#FF1A3C';

var API = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? 'http://localhost:3001'
  : 'https://api.seewhylive.online';

export default function PanelEgressView(props) {
  var slug = props.slug;
  var [streamInfo, setStreamInfo] = useState(null);
  var [error, setError] = useState(null);
  var [loading, setLoading] = useState(true);
  var [tipAlert, setTipAlert] = useState(null);
  var userId = 'egress-' + slug;
  var socketRef = useRef(null);

  useEffect(function() {
    if (!slug) { setLoading(false); return; }
    fetch(API + '/api/rooms/by-slug/' + encodeURIComponent(slug))
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
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

    socket.emit('join-room', {
      roomId: streamInfo.id,
      role: 'viewer',
      token: '',
      userId: userId,
      username: 'Egress',
    });

    socket.on('panel:tip-alert', function(data) {
      setTipAlert(data);
      setTimeout(function() { setTipAlert(null); }, 6000);
    });

    rtcManager.connect(socket, streamInfo.id, userId, 'viewer').catch(function() {});

    return function() {
      socket.off('panel:tip-alert');
    };
  }, [streamInfo]);

  if (loading || error) {
    return <div style={{ background: BG, width: '100vw', height: '100vh' }} />;
  }

  return (
    <div style={{ background: BG, width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Panel grid fills the frame */}
      <div style={{ flex: 1, minHeight: 0, padding: '0 0 56px 0' }}>
        <Suspense fallback={null}>
          {streamInfo && socketRef.current && (
            <PanelGrid
              socket={socketRef.current}
              roomId={streamInfo.id}
              userId={userId}
              username='Egress'
              isHost={false}
              rtcManager={rtcManager}
              guests={[]}
              addToast={function() {}}
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

      {/* BrandChyron — NEVER conditionally rendered */}
      <BrandChyron roomId={streamInfo ? streamInfo.id : null} socket={socketRef.current} />

      {/* Tip alert overlay */}
      {tipAlert && (
        <div style={{
          position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(201,168,76,.18), rgba(0,0,0,.85))',
          border: '1px solid ' + GOLD,
          borderRadius: 12, padding: '14px 24px', textAlign: 'center',
          boxShadow: '0 0 32px rgba(201,168,76,.4)',
          minWidth: 240, maxWidth: 400, zIndex: 100,
        }}>
          <div style={{ color: GOLD, fontFamily: '"Bebas Neue", sans-serif', fontSize: 24, letterSpacing: 2 }}>
            TIP ALERT
          </div>
          <div style={{ color: CREAM, fontFamily: '"DM Sans", sans-serif', fontSize: 16, fontWeight: 700, marginTop: 4 }}>
            {tipAlert.senderName}
          </div>
          <div style={{ color: GOLD, fontFamily: '"DM Mono", monospace', fontSize: 20, margin: '4px 0' }}>
            {'$' + (tipAlert.amountCents / 100).toFixed(2)}
          </div>
          {tipAlert.message && (
            <div style={{ color: CREAM, fontFamily: '"DM Sans", sans-serif', fontSize: 13, opacity: 0.85, marginTop: 4 }}>
              &ldquo;{tipAlert.message}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Stream title badge */}
      {streamInfo && streamInfo.title && (
        <div style={{
          position: 'absolute', bottom: 60, left: 12,
          background: 'rgba(0,0,0,0.65)', borderRadius: 6, padding: '4px 10px',
          color: CREAM, fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 600,
        }}>
          {streamInfo.title}
        </div>
      )}

      {/* Live indicator */}
      {streamInfo && streamInfo.is_live && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: RED, color: CREAM, fontFamily: '"DM Sans", sans-serif',
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, letterSpacing: 1,
        }}>
          LIVE
        </div>
      )}
    </div>
  );
}
