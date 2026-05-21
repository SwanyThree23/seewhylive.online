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

export default function AvatarHubTab({ addToast }) {
  var [items, setItems]   = useState(AVATAR_ITEMS.map(function(a) { return Object.assign({}, a); }));
  var [gemBal, setGemBal] = useState(350);
  var [filter, setFilter] = useState('all');

  var equipped = items.find(function(a) { return a.equipped; });

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
    setGemBal(function(b) { return b - item.price; });
    setItems(function(p) {
      return p.map(function(a) { return a.id === item.id ? Object.assign({}, a, { owned: true }) : a; });
    });
    if (addToast) addToast(item.emoji + ' ' + item.name + ' purchased!', 'success');
  }

  var filters = ['all', 'owned', 'common', 'rare', 'epic', 'legendary', 'mythic'];
  var visible = items.filter(function(a) {
    if (filter === 'all') return true;
    if (filter === 'owned') return a.owned;
    return a.rarity === filter;
  });

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>
      {/* Header */}
      <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {equipped && (
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'radial-gradient(ellipse,rgba(201,168,76,.25),rgba(128,0,32,.15))', border: '2px solid #C9A84C55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>
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
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C' }}>{gemBal}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>💎 GEMS</div>
        </div>
      </div>

      {/* Filter chips */}
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

      {/* Avatar grid */}
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
    </div>
  );
}
