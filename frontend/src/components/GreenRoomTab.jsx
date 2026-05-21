import React, { useState } from 'react';

export default function GreenRoomTab({ guests, addToast }) {
  var [section, setSection] = useState('room');
  var [banned, setBanned]   = useState(['TrollUser99', 'SpamBot_001']);
  var [newBan, setNewBan]   = useState('');
  var [muted, setMuted]     = useState({});
  var [vip, setVip]         = useState({});

  var roster = guests && guests.length > 0 ? guests : [
    { userId: 'demo1', username: 'SwanyThree', role: 'host' },
    { userId: 'demo2', username: 'DJ_Cipher',  role: 'co-host' },
    { userId: 'demo3', username: 'CaliBonesOG', role: 'guest' },
  ];

  function addBan() {
    var u = newBan.trim();
    if (!u || banned.indexOf(u) !== -1) return;
    setBanned(function(p) { return [...p, u]; });
    setNewBan('');
    if (addToast) addToast('Banned: ' + u, 'info');
  }

  function removeBan(u) {
    setBanned(function(p) { return p.filter(function(x) { return x !== u; }); });
    if (addToast) addToast('Unbanned: ' + u, 'info');
  }

  function toggleMute(id) {
    setMuted(function(p) { return Object.assign({}, p, { [id]: !p[id] }); });
  }

  function toggleVip(id) {
    setVip(function(p) { return Object.assign({}, p, { [id]: !p[id] }); });
  }

  var activeColor = '#C9A84C';

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[['room', '🟢 ROOM'], ['guard', '🛡 GUARD'], ['ban', '🚫 BAN']].map(function(t) {
          var active = section === t[0];
          return (
            <button
              key={t[0]}
              onClick={function() { setSection(t[0]); }}
              style={{ flex: 1, background: active ? 'rgba(128,0,32,.3)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (active ? '#C01838' : '#241C34'), borderRadius: 6, padding: '7px 0', color: active ? activeColor : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {/* ROOM section */}
      {section === 'room' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {roster.map(function(g) {
            var id = g.userId || g.guestId;
            var isMuted = Boolean(muted[id]);
            var isVip   = Boolean(vip[id]);
            return (
              <div key={id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C96A', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#EDE8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {g.username || id}
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {g.role || 'viewer'}
                    {isVip && ' · VIP ⭐'}
                    {isMuted && ' · MUTED'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={function() { toggleMute(id); }}
                    style={{ background: isMuted ? 'rgba(192,24,56,.2)' : 'rgba(255,255,255,.05)', border: '1px solid ' + (isMuted ? 'rgba(192,24,56,.5)' : '#241C34'), borderRadius: 5, padding: '3px 7px', color: isMuted ? '#FF6B81' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 8, cursor: 'pointer' }}>
                    {isMuted ? '🔊' : '🔇'}
                  </button>
                  <button
                    onClick={function() { toggleVip(id); }}
                    style={{ background: isVip ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.05)', border: '1px solid ' + (isVip ? '#C9A84C55' : '#241C34'), borderRadius: 5, padding: '3px 7px', color: isVip ? '#C9A84C' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 8, cursor: 'pointer' }}>
                    VIP
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GUARD section */}
      {section === 'guard' && (
        <div style={{ background: 'rgba(0,201,167,.06)', border: '1px solid rgba(0,201,167,.25)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#00C9A7', letterSpacing: 2, marginBottom: 12 }}>GUARDIAN AI THRESHOLDS</div>
          {[['FLAG (review)', 50, '#C9A84C'], ['MUTE (enforce)', 75, '#FF6B35'], ['BAN (enforce)', 95, '#FF1A3C']].map(function(row) {
            return (
              <div key={row[0]} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#EDE8F5' }}>{row[0]}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: row[2] }}>{row[1]}%</span>
                </div>
                <div style={{ background: '#241C34', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: row[1] + '%', height: '100%', background: 'linear-gradient(90deg,#00C9A7,' + row[2] + ')', borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {[['12 LANGS', '#2A6BFF'], ['ACTIVE', '#C8FF00'], ['claude-haiku', '#9B4DCA']].map(function(s) {
              return (
                <span key={s[0]} style={{ background: s[1] + '18', border: '1px solid ' + s[1] + '44', borderRadius: 999, padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: s[1] }}>
                  {s[0]}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* BAN section */}
      {section === 'ban' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={newBan}
              onChange={function(e) { setNewBan(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') addBan(); }}
              placeholder="Username to ban..."
              style={{ flex: 1, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
            />
            <button
              onClick={addBan}
              style={{ background: 'rgba(230,57,70,.15)', border: '1px solid rgba(230,57,70,.4)', borderRadius: 8, padding: '8px 16px', color: '#FF6B81', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              BAN
            </button>
          </div>
          {banned.length === 0 && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90', textAlign: 'center', padding: 12 }}>No banned users.</div>
          )}
          {banned.map(function(u) {
            return (
              <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #241C34' }}>
                <span style={{ fontSize: 12, color: '#FF1A3C' }}>🚫</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#7A6F90', flex: 1 }}>{u}</span>
                <button
                  onClick={function() { removeBan(u); }}
                  style={{ background: 'none', border: '1px solid #241C34', borderRadius: 6, padding: '3px 8px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>
                  UNBAN
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
