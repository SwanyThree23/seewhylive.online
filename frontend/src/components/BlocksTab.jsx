'use strict';
import React, { useState, useEffect } from 'react';

var SURF = '#1A1510';
var CARD = '#241C12';
var GOLD = '#C9A84C';
var BURG = '#800020';
var TEXT = '#F0E8D4';
var MUTED = '#8A7A62';
var fD = "'Bebas Neue',sans-serif";
var fU = "'Barlow Condensed',sans-serif";
var fM = "'DM Mono',monospace";

function _authHeaders(extra) {
  var tok = localStorage.getItem('sw_token') || '';
  var h = tok ? { 'Authorization': 'Bearer ' + tok } : {};
  return Object.assign(h, extra || {});
}

function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BlocksTab({ addToast }) {
  var [blocks,   setBlocks]   = useState([]);
  var [loading,  setLoading]  = useState(true);
  var [blockId,  setBlockId]  = useState('');
  var [addBusy,  setAddBusy]  = useState(false);

  function loadBlocks() {
    setLoading(true);
    fetch('/api/blocks', { headers: _authHeaders() })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) { if (d) setBlocks(d.blocks || []); })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }

  useEffect(function() { loadBlocks(); }, []);

  function handleBlock() {
    var id = blockId.trim();
    if (!id) return;
    setAddBusy(true);
    fetch('/api/blocks', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ blockedId: id }),
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) {
          if (addToast) addToast('User blocked', 'success');
          setBlockId('');
          loadBlocks();
        } else {
          if (addToast) addToast(d.error || 'Error', 'error');
        }
      })
      .catch(function() { if (addToast) addToast('Network error', 'error'); })
      .finally(function() { setAddBusy(false); });
  }

  function handleUnblock(blockedId) {
    fetch('/api/blocks/' + encodeURIComponent(blockedId), {
      method: 'DELETE',
      headers: _authHeaders(),
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) {
          if (addToast) addToast('User unblocked', 'success');
          loadBlocks();
        }
      })
      .catch(function() {});
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 2px' }}>

      <div>
        <div style={{ fontFamily: fD, fontSize: 22, color: GOLD, letterSpacing: 2 }}>BLOCKED USERS</div>
        <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginTop: 3, lineHeight: 1.5 }}>
          Blocks apply across all of SeeWhy — rooms, DMs, search, and mentions
        </div>
      </div>

      {/* Block by ID */}
      <div style={{ background: SURF, border: '1px solid rgba(201,168,76,.15)', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ fontFamily: fM, fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 8 }}>BLOCK A USER</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={blockId}
            onChange={function(e) { setBlockId(e.target.value.slice(0, 64)); }}
            placeholder="User ID or username"
            style={{ flex: 1, background: CARD, border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '7px 10px', color: TEXT, fontFamily: fM, fontSize: 9, outline: 'none' }}
          />
          <button
            onClick={handleBlock}
            disabled={!blockId.trim() || addBusy}
            style={{ background: 'rgba(128,0,32,.35)', border: '1px solid rgba(128,0,32,.6)', borderRadius: 8, padding: '7px 14px', color: '#FF6B6B', fontFamily: fD, fontSize: 12, letterSpacing: 1.5, cursor: blockId.trim() ? 'pointer' : 'not-allowed', opacity: blockId.trim() ? 1 : .5 }}>
            {addBusy ? '...' : 'BLOCK'}
          </button>
        </div>
      </div>

      {/* Blocked list */}
      {loading ? (
        <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, textAlign: 'center', padding: 20 }}>Loading...</div>
      ) : blocks.length === 0 ? (
        <div style={{ background: SURF, border: '1px dashed rgba(201,168,76,.15)', borderRadius: 12, padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: fM, fontSize: 9, color: MUTED }}>No blocked users</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {blocks.map(function(b) {
            return (
              <div key={b.blocked_id} style={{ background: SURF, border: '1px solid rgba(201,168,76,.08)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: TEXT }}>{b.username || b.blocked_id}</div>
                  <div style={{ fontFamily: fM, fontSize: 7, color: MUTED }}>blocked {fmtDate(b.created_at)}</div>
                </div>
                <button
                  onClick={function() { handleUnblock(b.blocked_id); }}
                  style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '4px 10px', color: GOLD, fontFamily: fD, fontSize: 11, letterSpacing: 1, cursor: 'pointer' }}>
                  UNBLOCK
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
