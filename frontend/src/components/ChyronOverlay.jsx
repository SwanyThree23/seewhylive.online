'use strict';
import React, { useState, useEffect, useRef } from 'react';

var GOLD = '#C9A84C';
var BURG = '#800020';
var TEXT = '#F0E8D4';
var MUTED = '#8A7A62';

var ANIM = '@keyframes chyronScroll{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}' +
           '@keyframes chyronFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';

export default function ChyronOverlay({ socket, roomId, role, isLive }) {
  var [chyron,    setChyron]    = useState(null);
  var [draftText, setDraftText] = useState('');
  var [draftType, setDraftType] = useState('scroll');
  var [hostOpen,  setHostOpen]  = useState(false);
  var isHost = role === 'host' || role === 'cohost';

  useEffect(function() {
    if (!socket) return;
    function onChyron(data) {
      if (data && data.text) setChyron(data);
      else setChyron(null);
    }
    socket.on('chyron-update', onChyron);
    socket.on('chyron-clear',  function() { setChyron(null); });
    return function() { socket.off('chyron-update', onChyron); socket.off('chyron-clear'); };
  }, [socket]);

  function sendChyron() {
    if (!socket || !draftText.trim()) return;
    var payload = { roomId: roomId, text: draftText.trim(), type: draftType, color: GOLD };
    socket.emit('chyron-update', payload);
    setChyron(payload);
    setDraftText('');
    setHostOpen(false);
  }

  function clearChyron() {
    if (!socket) return;
    socket.emit('chyron-update', { roomId: roomId, text: null });
    setChyron(null);
  }

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30, pointerEvents: 'none' }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      {/* Host control panel */}
      {isHost && isLive && (
        <div style={{ position: 'absolute', bottom: 4, right: 8, pointerEvents: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {chyron && (
            <button onClick={clearChyron} style={{ background: 'rgba(128,0,32,.8)', border: '1px solid rgba(192,24,56,.6)', borderRadius: 6, padding: '4px 10px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1 }}>CLEAR</button>
          )}
          <button onClick={function() { setHostOpen(function(v) { return !v; }); }}
            style={{ background: 'rgba(201,168,76,.2)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 6, padding: '4px 10px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1 }}>
            CHYRON
          </button>
        </div>
      )}

      {/* Host input panel */}
      {isHost && hostOpen && (
        <div style={{ position: 'absolute', bottom: 34, right: 8, background: 'rgba(26,21,16,.97)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '12px', width: 260, pointerEvents: 'auto', animation: 'chyronFadeIn .2s ease' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 8 }}>LIVE COMMENTARY</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {['scroll', 'static', 'score'].map(function(t) {
              return (
                <button key={t} onClick={function() { setDraftType(t); }}
                  style={{ flex: 1, padding: '5px 0', background: draftType === t ? 'rgba(201,168,76,.2)' : 'transparent', border: '1px solid ' + (draftType === t ? 'rgba(201,168,76,.5)' : 'rgba(201,168,76,.15)'), borderRadius: 5, color: draftType === t ? GOLD : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer', letterSpacing: .5 }}>
                  {t.toUpperCase()}
                </button>
              );
            })}
          </div>
          <input
            value={draftText}
            onChange={function(e) { setDraftText(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter') sendChyron(); }}
            placeholder={draftType === 'score' ? 'Team A 3 — Team B 2' : 'Type commentary...'}
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(36,28,18,.8)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 7, padding: '8px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none', marginBottom: 8 }}
          />
          <button onClick={sendChyron} disabled={!draftText.trim()}
            style={{ width: '100%', padding: '8px', background: draftText.trim() ? 'linear-gradient(135deg,#800020,#C01838)' : 'rgba(26,21,16,.5)', border: 'none', borderRadius: 7, color: draftText.trim() ? GOLD : MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 2, cursor: draftText.trim() ? 'pointer' : 'default' }}>
            PIN TO STREAM
          </button>
        </div>
      )}

      {/* The chyron bar — shown to all viewers */}
      {chyron && chyron.text && (
        <div style={{ background: 'linear-gradient(90deg,rgba(128,0,32,.95),rgba(26,21,16,.95))', borderTop: '2px solid ' + (chyron.color || GOLD), padding: '6px 0', overflow: 'hidden' }}>
          {chyron.type === 'scroll' ? (
            <div style={{ whiteSpace: 'nowrap', animation: 'chyronScroll 18s linear infinite', display: 'inline-block', paddingLeft: '100%' }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: chyron.color || GOLD, letterSpacing: 3, marginRight: 80 }}>{chyron.text}</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: chyron.color || GOLD, letterSpacing: 3, marginRight: 80 }}>{chyron.text}</span>
            </div>
          ) : chyron.type === 'score' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 16px' }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: GOLD, letterSpacing: 2 }}>{chyron.text}</span>
            </div>
          ) : (
            <div style={{ padding: '0 16px' }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: chyron.color || GOLD, letterSpacing: 2 }}>{chyron.text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
