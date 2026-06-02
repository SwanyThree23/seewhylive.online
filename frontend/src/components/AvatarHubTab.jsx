import React, { useState, useEffect } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var AVATAR_ITEMS = [
  { id: 'a1', name: 'Domino King',    emoji: '👑', price: 200, owned: true,  equipped: true,  rarity: 'legendary', desc: 'Washington Classic champion' },
  { id: 'a2', name: 'Cali Flame',     emoji: '🔥', price: 50,  owned: true,  equipped: false, rarity: 'rare',      desc: 'West Coast energy' },
  { id: 'a3', name: 'Volt Strike',    emoji: '⚡', price: 100, owned: false, equipped: false, rarity: 'epic',      desc: 'Electric power' },
  { id: 'a4', name: 'Teal Wave',      emoji: '🌊', price: 75,  owned: false, equipped: false, rarity: 'epic',      desc: 'Smooth like the coast' },
  { id: 'a5', name: 'Gold Standard',  emoji: '🏆', price: 300, owned: false, equipped: false, rarity: 'legendary', desc: 'The highest tier' },
  { id: 'a6', name: 'Purple Reign',   emoji: '💜', price: 150, owned: false, equipped: false, rarity: 'epic',      desc: 'Royalty vibes' },
  { id: 'a7', name: 'Diamond Hard',   emoji: '💎', price: 500, owned: false, equipped: false, rarity: 'mythic',    desc: 'Unbreakable' },
  { id: 'a8', name: 'Domino Nation',  emoji: '🎲', price: 25,  owned: true,  equipped: false, rarity: 'common',    desc: 'The original' },
];

var RARITY_COLORS = {
  common:    '#8A7A62',
  rare:      '#C9A84C',
  epic:      '#C084FC',
  legendary: '#C9A84C',
  mythic:    '#FF1A3C',
};

var FRAMES = [
  { id: 'f1', name: 'Gold Classic',  style: '3px solid #C9A84C', price: 50,  owned: true  },
  { id: 'f2', name: 'Blood Ring',    style: '3px solid #C01838', price: 75,  owned: false },
  { id: 'f3', name: 'Teal Pulse',    style: '3px solid #C9A84C', price: 100, owned: false },
  { id: 'f4', name: 'Mythic Flame',  style: '4px solid #FF1A3C', price: 200, owned: false },
];

var FRAME_ACCENT_COLORS = {
  f1: '#C9A84C',
  f2: '#C01838',
  f3: '#C9A84C',
  f4: '#FF1A3C',
};

var BADGES = [
  { id: 'b1', icon: '🎲', label: 'Domino Pioneer', unlocked: true,  progress: null, total: null, how: null           },
  { id: 'b2', icon: '🏆', label: 'Champion',       unlocked: true,  progress: null, total: null, how: null           },
  { id: 'b3', icon: '⚡', label: 'Fades Veteran',  unlocked: false, progress: 3,    total: 10,   how: 'Fades matches' },
  { id: 'b4', icon: '💎', label: 'Diamond Tier',   unlocked: false, progress: 1247, total: 5000, how: 'Loyalty pts'   },
  { id: 'b5', icon: '🔥', label: '10-Streak',      unlocked: false, progress: 7,    total: 10,   how: 'Win streak'    },
];

var VIEWER_NAMES = ['King D', 'Cali J', 'Volt V', 'Teal B', 'Gold G', 'Purp R', 'Dia H', 'Dom N'];
var VIEWER_COLORS = ['#FF1A3C','#C9A84C','#C9A84C','#C084FC','#C9A84C','#FF6B35','#C9A84C','#FF1493'];

export default function AvatarHubTab({ addToast, isLive }) {
  var [items,            setItems]            = useState(AVATAR_ITEMS.map(function(a) { return Object.assign({}, a); }));
  var [gemBal,           setGemBal]           = useState(function() {
    try {
      var stored = localStorage.getItem('sw_gem_bal');
      if (stored !== null) return parseInt(stored, 10) || 350;
    } catch(e) {}
    return 350;
  });
  var [dailyClaimed,     setDailyClaimed]     = useState(function() {
    try {
      var d = localStorage.getItem('sw_daily_bonus');
      return d === new Date().toDateString();
    } catch(e) { return false; }
  });
  var [filter,           setFilter]           = useState('all');
  var [frames,           setFrames]           = useState(FRAMES.map(function(f) { return Object.assign({}, f); }));
  var [equippedFrame,    setEquippedFrame]     = useState('f1');
  var [livePulse,        setLivePulse]         = useState(0);
  var [liveViewerAvatars, setLiveViewerAvatars] = useState([]);

  useEffect(function() {
    if (!isLive) {
      setLivePulse(0);
      return;
    }
    var id = setInterval(function() {
      setLivePulse(Math.floor(50 + 50 * Math.sin(Date.now() / 600)));
    }, 600);
    return function() { clearInterval(id); };
  }, [isLive]);

  useEffect(function() {
    if (!isLive) {
      setLiveViewerAvatars([]);
      return;
    }
    var id = setInterval(function() {
      var nameIdx = Math.floor(Math.random() * VIEWER_NAMES.length);
      var colorIdx = Math.floor(Math.random() * VIEWER_COLORS.length);
      var viewer = {
        id: Date.now() + Math.random(),
        name: VIEWER_NAMES[nameIdx],
        color: VIEWER_COLORS[colorIdx],
        initials: VIEWER_NAMES[nameIdx].split(' ').map(function(w) { return w[0]; }).join(''),
      };
      setLiveViewerAvatars(function(prev) {
        var updated = prev.concat([viewer]);
        return updated.slice(-5);
      });
    }, 4000);
    return function() { clearInterval(id); };
  }, [isLive]);

  // Gem earning — +1 every 30s while live
  useEffect(function() {
    if (!isLive) return;
    var id = setInterval(function() {
      setGemBal(function(b) { return Math.floor(b + 1); });
    }, 30000);
    return function() { clearInterval(id); };
  }, [isLive]);

  useEffect(function() {
    try {
      localStorage.setItem('sw_gem_bal', String(gemBal));
    } catch(e) {}
  }, [gemBal]);

  function claimDailyBonus() {
    setGemBal(function(b) { return Math.floor(b + 50); });
    setDailyClaimed(true);
    try {
      localStorage.setItem('sw_daily_bonus', new Date().toDateString());
    } catch(e) {}
    if (addToast) addToast('🎁 Daily bonus claimed! +50 💎', 'success');
  }

  var equipped = items.find(function(a) { return a.equipped; });
  var activeFrame = frames.find(function(f) { return f.id === equippedFrame; });

  function equip(id) {
    setItems(function(p) {
      return p.map(function(a) {
        return Object.assign({}, a, { equipped: a.id === id });
      });
    });
    var item = items.find(function(a) { return a.id === id; });
    if (addToast && item) addToast(item.emoji + ' ' + item.name + ' equipped', 'success');
  }

  function purchase(item) {
    if (gemBal < item.price) { if (addToast) addToast('Not enough gems (need 💎' + item.price + ')', 'error'); return; }
    setGemBal(function(b) { return Math.floor(b - item.price); });
    setItems(function(p) {
      return p.map(function(a) { return a.id === item.id ? Object.assign({}, a, { owned: true }) : a; });
    });
    if (addToast) addToast(item.emoji + ' ' + item.name + ' purchased!', 'success');
  }

  function purchaseFrame(frame) {
    if (gemBal < frame.price) { if (addToast) addToast('Not enough gems (need 💎' + frame.price + ')', 'error'); return; }
    setGemBal(function(b) { return Math.floor(b - frame.price); });
    setFrames(function(prev) {
      return prev.map(function(f) { return f.id === frame.id ? Object.assign({}, f, { owned: true }) : f; });
    });
    if (addToast) addToast(frame.name + ' frame purchased!', 'success');
  }

  function equipFrame(id) {
    var frame = frames.find(function(f) { return f.id === id; });
    setEquippedFrame(id);
    if (addToast && frame) addToast(frame.name + ' frame equipped', 'success');
  }

  var filters = ['all', 'owned', 'common', 'rare', 'epic', 'legendary', 'mythic'];
  var visible = items.filter(function(a) {
    if (filter === 'all') return true;
    if (filter === 'owned') return a.owned;
    return a.rarity === filter;
  });

  var liveShadow = isLive
    ? '0 0 ' + (8 + Math.floor(livePulse / 10)) + 'px rgba(192,132,252,' + (0.4 + livePulse / 250).toFixed(2) + ')'
    : 'none';

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>
      <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {equipped && (
          <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'radial-gradient(ellipse,rgba(201,168,76,.25),rgba(128,0,32,.15))', border: activeFrame ? activeFrame.style : '2px solid #C9A84C55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, boxShadow: liveShadow }}>
              {equipped.emoji}
            </div>
            {isLive && (
              <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', background: '#FF1A3C', borderRadius: 3, padding: '1px 5px', fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#fff', letterSpacing: 1, whiteSpace: 'nowrap' }}>🔴 LIVE</div>
            )}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', letterSpacing: 2 }}>
            {equipped ? equipped.name : 'NO AVATAR'}
          </div>
          {equipped && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: RARITY_COLORS[equipped.rarity] || '#8A7A62', textTransform: 'uppercase', letterSpacing: 1 }}>
              {equipped.rarity} · equipped
            </div>
          )}
          {activeFrame && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: FRAME_ACCENT_COLORS[activeFrame.id] || '#8A7A62', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
              {activeFrame.name} frame
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C' }}>{gemBal}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>💎 GEMS</div>
          {isLive && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#C9A84C', marginTop: 2, letterSpacing: 0.5 }}>+1/30s ▲</div>
          )}
        </div>
      </div>

      {!dailyClaimed && (
        <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#C9A84C' }}>🎁 DAILY BONUS · +50 💎 GEMS</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginTop: 2 }}>Claim once per day</div>
          </div>
          <button
            onClick={function() { claimDailyBonus(); }}
            style={{ background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 8, padding: '7px 18px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            CLAIM
          </button>
        </div>
      )}

      {isLive && liveViewerAvatars.length > 0 && (
        <div style={{ background: 'rgba(192,132,252,.07)', border: '1px solid rgba(192,132,252,.25)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C084FC', letterSpacing: 2, flexShrink: 0 }}>WATCHING LIVE</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {liveViewerAvatars.map(function(v) {
              return (
                <div key={v.id} style={{ flexShrink: 0 }} title={v.name}>
                  <AvatarPortrait username={v.name} size={28} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
        {filters.map(function(f) {
          var active = filter === f;
          var color = f === 'all' || f === 'owned' ? '#C9A84C' : (RARITY_COLORS[f] || '#8A7A62');
          return (
            <button
              key={f}
              onClick={function() { setFilter(f); }}
              style={{ background: active ? color + '22' : 'rgba(26,21,16,.7)', border: '1px solid ' + (active ? color + '66' : '#3D3020'), borderRadius: 999, padding: '3px 10px', color: active ? color : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
              {f}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
        {visible.map(function(a) {
          var rc = RARITY_COLORS[a.rarity] || '#8A7A62';
          var cardShadow = (a.equipped && isLive) ? liveShadow : 'none';
          return (
            <div
              key={a.id}
              style={{ background: a.equipped ? 'rgba(201,168,76,.1)' : 'rgba(26,21,16,.8)', border: '1px solid ' + (a.equipped ? '#C9A84C55' : a.owned ? rc + '33' : '#3D3020'), borderRadius: 10, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', boxShadow: cardShadow }}>
              {a.equipped && (
                <div style={{ position: 'absolute', top: 7, right: 7, background: '#C9A84C', borderRadius: 3, padding: '1px 5px', fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#07050A', letterSpacing: 1 }}>ON</div>
              )}
              {a.equipped && isLive && (
                <div style={{ position: 'absolute', top: 7, left: 7, background: '#FF1A3C', borderRadius: 3, padding: '1px 5px', fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#fff', letterSpacing: 1 }}>🔴 LIVE</div>
              )}
              <div style={{ fontSize: 34, filter: a.owned ? 'none' : 'grayscale(80%) opacity(0.5)' }}>{a.emoji}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: a.owned ? '#F0E8D4' : '#8A7A62', textAlign: 'center' }}>{a.name}</div>
              <div style={{ background: rc + '18', border: '1px solid ' + rc + '44', borderRadius: 999, padding: '1px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: rc, textTransform: 'uppercase', letterSpacing: 1 }}>{a.rarity}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', textAlign: 'center' }}>{a.desc}</div>
              {a.owned ? (
                <button
                  onClick={function() { if (!a.equipped) equip(a.id); }}
                  disabled={a.equipped}
                  style={{ width: '100%', padding: '6px 0', background: a.equipped ? 'rgba(201,168,76,.1)' : 'rgba(201,168,76,.12)', border: '1px solid ' + (a.equipped ? '#C9A84C44' : 'rgba(201,168,76,.35)'), borderRadius: 6, color: a.equipped ? '#C9A84C' : '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: a.equipped ? 'not-allowed' : 'pointer' }}>
                  {a.equipped ? '✓ EQUIPPED' : 'EQUIP'}
                </button>
              ) : (
                <button
                  onClick={function() { purchase(a); }}
                  style={{ width: '100%', padding: '6px 0', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 6, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                  💎{a.price} BUY
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ background: 'rgba(26,21,16,.6)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#C9A84C', letterSpacing: 3, marginBottom: 8 }}>AVATAR FRAMES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {frames.map(function(f) {
            var accentColor = FRAME_ACCENT_COLORS[f.id] || '#8A7A62';
            var isEquipped = equippedFrame === f.id;
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: isEquipped ? accentColor + '12' : 'rgba(14,12,9,.5)', border: '1px solid ' + (isEquipped ? accentColor + '44' : '#3D3020'), borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, border: f.style, background: 'rgba(26,21,16,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                  {equipped ? equipped.emoji : '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: isEquipped ? accentColor : '#F0E8D4' }}>{f.name}</div>
                  {isEquipped && (
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: accentColor, letterSpacing: 1 }}>EQUIPPED</div>
                  )}
                </div>
                {f.owned ? (
                  <button
                    onClick={function() { if (!isEquipped) equipFrame(f.id); }}
                    disabled={isEquipped}
                    style={{ padding: '4px 10px', background: isEquipped ? accentColor + '20' : 'rgba(201,168,76,.12)', border: '1px solid ' + (isEquipped ? accentColor + '44' : 'rgba(201,168,76,.35)'), borderRadius: 6, color: isEquipped ? accentColor : '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: isEquipped ? 'not-allowed' : 'pointer' }}>
                    {isEquipped ? '✓ ON' : 'EQUIP'}
                  </button>
                ) : (
                  <button
                    onClick={function() { purchaseFrame(f); }}
                    style={{ padding: '4px 10px', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 6, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    💎{f.price} BUY
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'rgba(26,21,16,.6)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#C9A84C', letterSpacing: 3, marginBottom: 8 }}>ACHIEVEMENT BADGES</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {BADGES.map(function(b) {
            var pct = (b.progress !== null && b.total) ? Math.floor((b.progress / b.total) * 100) : 0;
            return (
              <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, background: b.unlocked ? 'rgba(201,168,76,.1)' : 'rgba(14,12,9,.6)', border: '1px solid ' + (b.unlocked ? 'rgba(201,168,76,.35)' : '#3D3020'), borderRadius: 8, padding: '8px 10px', minWidth: 72 }}>
                <span style={{ fontSize: 20, filter: b.unlocked ? 'none' : 'grayscale(100%) opacity(0.4)' }}>{b.icon}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: b.unlocked ? '#C9A84C' : '#8A7A62', textAlign: 'center', lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{b.label}</span>
                {!b.unlocked && b.progress !== null && (
                  <div style={{ width: '100%' }}>
                    <div style={{ height: 3, background: '#3D3020', borderRadius: 2, overflow: 'hidden', width: '100%' }}>
                      <div style={{ width: pct + '%', height: '100%', background: 'linear-gradient(90deg,#C9A84C,#C9A84C)', borderRadius: 2 }} />
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 5.5, color: '#C9A84C', textAlign: 'center', marginTop: 2 }}>
                      {b.progress}/{b.total} {b.how}
                    </div>
                  </div>
                )}
                {!b.unlocked && b.progress === null && (
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#3A2F4A', textTransform: 'uppercase', letterSpacing: 0.5 }}>LOCKED</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
