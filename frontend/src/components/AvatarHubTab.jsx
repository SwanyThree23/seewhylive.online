import React, { useState } from 'react';

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
  common:    '#7A6F90',
  rare:      '#00C9A7',
  epic:      '#C084FC',
  legendary: '#C9A84C',
  mythic:    '#FF1A3C',
};

var FRAMES = [
  { id: 'f1', name: 'Gold Classic',  style: '3px solid #C9A84C', price: 50,  owned: true  },
  { id: 'f2', name: 'Blood Ring',    style: '3px solid #C01838', price: 75,  owned: false },
  { id: 'f3', name: 'Teal Pulse',    style: '3px solid #00DEC0', price: 100, owned: false },
  { id: 'f4', name: 'Mythic Flame',  style: '4px solid #FF1A3C', price: 200, owned: false },
];

var FRAME_ACCENT_COLORS = {
  f1: '#C9A84C',
  f2: '#C01838',
  f3: '#00DEC0',
  f4: '#FF1A3C',
};

var BADGES = [
  { id: 'b1', icon: '🎲', label: 'Domino Pioneer', unlocked: true  },
  { id: 'b2', icon: '🏆', label: 'Champion',       unlocked: true  },
  { id: 'b3', icon: '⚡', label: 'Fades Veteran',  unlocked: false },
  { id: 'b4', icon: '💎', label: 'Diamond Tier',   unlocked: false },
  { id: 'b5', icon: '🔥', label: '10-Streak',      unlocked: false },
];

export default function AvatarHubTab({ addToast }) {
  var [items,         setItems]         = useState(AVATAR_ITEMS.map(function(a) { return Object.assign({}, a); }));
  var [gemBal,        setGemBal]        = useState(350);
  var [filter,        setFilter]        = useState('all');
  var [frames,        setFrames]        = useState(FRAMES.map(function(f) { return Object.assign({}, f); }));
  var [equippedFrame, setEquippedFrame] = useState('f1');

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

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>
      <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {equipped && (
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'radial-gradient(ellipse,rgba(201,168,76,.25),rgba(128,0,32,.15))', border: activeFrame ? activeFrame.style : '2px solid #C9A84C55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>
            {equipped.emoji}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', letterSpacing: 2 }}>
            {equipped ? equipped.name : 'NO AVATAR'}
          </div>
          {equipped && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: RARITY_COLORS[equipped.rarity] || '#7A6F90', textTransform: 'uppercase', letterSpacing: 1 }}>
              {equipped.rarity} · equipped
            </div>
          )}
          {activeFrame && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: FRAME_ACCENT_COLORS[activeFrame.id] || '#7A6F90', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
              {activeFrame.name} frame
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C' }}>{gemBal}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>💎 GEMS</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
        {filters.map(function(f) {
          var active = filter === f;
          var color = f === 'all' || f === 'owned' ? '#C9A84C' : (RARITY_COLORS[f] || '#7A6F90');
          return (
            <button
              key={f}
              onClick={function() { setFilter(f); }}
              style={{ background: active ? color + '22' : 'rgba(22,16,32,.7)', border: '1px solid ' + (active ? color + '66' : '#241C34'), borderRadius: 999, padding: '3px 10px', color: active ? color : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
              {f}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
        {visible.map(function(a) {
          var rc = RARITY_COLORS[a.rarity] || '#7A6F90';
          return (
            <div
              key={a.id}
              style={{ background: a.equipped ? 'rgba(201,168,76,.1)' : 'rgba(22,16,32,.8)', border: '1px solid ' + (a.equipped ? '#C9A84C55' : a.owned ? rc + '33' : '#241C34'), borderRadius: 10, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
              {a.equipped && (
                <div style={{ position: 'absolute', top: 7, right: 7, background: '#C9A84C', borderRadius: 3, padding: '1px 5px', fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#07050A', letterSpacing: 1 }}>ON</div>
              )}
              <div style={{ fontSize: 34, filter: a.owned ? 'none' : 'grayscale(80%) opacity(0.5)' }}>{a.emoji}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: a.owned ? '#EDE8F5' : '#7A6F90', textAlign: 'center' }}>{a.name}</div>
              <div style={{ background: rc + '18', border: '1px solid ' + rc + '44', borderRadius: 999, padding: '1px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: rc, textTransform: 'uppercase', letterSpacing: 1 }}>{a.rarity}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', textAlign: 'center' }}>{a.desc}</div>
              {a.owned ? (
                <button
                  onClick={function() { if (!a.equipped) equip(a.id); }}
                  disabled={a.equipped}
                  style={{ width: '100%', padding: '6px 0', background: a.equipped ? 'rgba(201,168,76,.1)' : 'rgba(0,201,167,.12)', border: '1px solid ' + (a.equipped ? '#C9A84C44' : 'rgba(0,201,167,.35)'), borderRadius: 6, color: a.equipped ? '#C9A84C' : '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: a.equipped ? 'not-allowed' : 'pointer' }}>
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

      <div style={{ background: 'rgba(22,16,32,.6)', border: '1px solid #241C34', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#C9A84C', letterSpacing: 3, marginBottom: 8 }}>AVATAR FRAMES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {frames.map(function(f) {
            var accentColor = FRAME_ACCENT_COLORS[f.id] || '#7A6F90';
            var isEquipped = equippedFrame === f.id;
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: isEquipped ? accentColor + '12' : 'rgba(7,5,10,.5)', border: '1px solid ' + (isEquipped ? accentColor + '44' : '#241C34'), borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, border: f.style, background: 'rgba(22,16,32,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                  {equipped ? equipped.emoji : '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: isEquipped ? accentColor : '#EDE8F5' }}>{f.name}</div>
                  {isEquipped && (
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: accentColor, letterSpacing: 1 }}>EQUIPPED</div>
                  )}
                </div>
                {f.owned ? (
                  <button
                    onClick={function() { if (!isEquipped) equipFrame(f.id); }}
                    disabled={isEquipped}
                    style={{ padding: '4px 10px', background: isEquipped ? accentColor + '20' : 'rgba(0,201,167,.12)', border: '1px solid ' + (isEquipped ? accentColor + '44' : 'rgba(0,201,167,.35)'), borderRadius: 6, color: isEquipped ? accentColor : '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: isEquipped ? 'not-allowed' : 'pointer' }}>
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

      <div style={{ background: 'rgba(22,16,32,.6)', border: '1px solid #241C34', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#C9A84C', letterSpacing: 3, marginBottom: 8 }}>ACHIEVEMENT BADGES</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {BADGES.map(function(b) {
            return (
              <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, background: b.unlocked ? 'rgba(201,168,76,.1)' : 'rgba(7,5,10,.6)', border: '1px solid ' + (b.unlocked ? 'rgba(201,168,76,.35)' : '#241C34'), borderRadius: 8, padding: '8px 10px', minWidth: 64 }}>
                <span style={{ fontSize: 20, filter: b.unlocked ? 'none' : 'grayscale(100%) opacity(0.35)' }}>{b.icon}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: b.unlocked ? '#C9A84C' : '#7A6F90', textAlign: 'center', lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{b.label}</span>
                {!b.unlocked && (
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
