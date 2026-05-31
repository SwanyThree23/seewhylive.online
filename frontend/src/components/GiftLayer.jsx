'use strict';
import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var GOLD = '#C9A84C';
var TEAL = '#D4854A';

var ANIM =
  '@keyframes giftRise{0%{transform:translateY(0);opacity:1}85%{opacity:1}100%{transform:translateY(-200px);opacity:0}}' +
  '@keyframes legendBurst{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}' +
  '@keyframes comboPop{0%,100%{transform:translateX(-50%) scale(1)}40%{transform:translateX(-50%) scale(1.18)}}' +
  '@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}' +
  '@keyframes showerFall{0%{transform:translateY(-40px) rotate(0deg);opacity:1}100%{transform:translateY(105vh) rotate(540deg);opacity:0}}' +
  '@keyframes showerBurst{0%{transform:translateX(-50%) scale(0);opacity:0}40%{transform:translateX(-50%) scale(1.2);opacity:1}100%{transform:translateX(-50%) scale(1);opacity:1}}';

export default function GiftLayer(props) {
  var giftFloats = props.giftFloats;

  var [combo,     setCombo]     = useState(0);
  var [comboShow, setComboShow] = useState(false);
  var [showerActive, setShowerActive] = useState(false);
  var [showerItems,  setShowerItems]  = useState([]);
  var comboTimer = useRef(null);
  var comboCount = useRef(0);
  var prevLen    = useRef(0);
  var showerRef  = useRef(null);

  useEffect(function() {
    var len = giftFloats ? giftFloats.length : 0;
    if (len <= prevLen.current) { prevLen.current = len; return; }
    prevLen.current = len;
    comboCount.current += 1;
    setCombo(comboCount.current);
    setComboShow(comboCount.current >= 2);
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(function() {
      comboCount.current = 0;
      setCombo(0);
      setComboShow(false);
    }, 4200);
    if (comboCount.current >= 5) {
      setShowerActive(true);
      var EMOJIS = ['🎲','🎲','🏆','💎','🔥','⚡','👑','🎁','💰','🎯'];
      var items = [];
      for (var i = 0; i < 18; i++) {
        items.push({
          id: Date.now() + i,
          emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
          left: Math.floor(Math.random() * 92) + '%',
          delay: (Math.floor(Math.random() * 20) / 10) + 's',
          size: 18 + Math.floor(Math.random() * 22),
          dur: (1.4 + Math.floor(Math.random() * 14) / 10) + 's',
        });
      }
      setShowerItems(items);
      if (showerRef.current) clearTimeout(showerRef.current);
      showerRef.current = setTimeout(function() { setShowerActive(false); setShowerItems([]); }, 4500);
    }
    return function() {
      if (comboTimer.current) clearTimeout(comboTimer.current);
      if (showerRef.current) clearTimeout(showerRef.current);
    };
  }, [giftFloats]);

  if (!giftFloats || giftFloats.length === 0) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 800 }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      {/* Combo banner */}
      {comboShow && combo >= 2 && (
        <div style={{
          position: 'absolute', top: '18%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(7,5,10,.96)',
          border: '1.5px solid ' + (combo >= 5 ? GOLD : TEAL),
          borderRadius: 999, padding: '7px 22px',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'comboPop .35s ease',
          boxShadow: combo >= 5 ? '0 0 24px rgba(201,168,76,.35)' : '0 0 14px rgba(0,222,192,.25)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 20 }}>{combo >= 10 ? '🔥' : combo >= 5 ? '💎' : '⚡'}</span>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 3, color: combo >= 5 ? GOLD : TEAL }}>
            {combo}× COMBO
          </div>
          <span style={{ fontSize: 20 }}>{combo >= 10 ? '🔥' : combo >= 5 ? '💎' : '⚡'}</span>
        </div>
      )}

      {showerActive && combo >= 5 && (
        <div style={{ position: 'absolute', top: '7%', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,rgba(128,0,32,.95),rgba(36,28,18,.9))', border: '2px solid #C9A84C', borderRadius: 999, padding: '9px 26px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 4, color: '#C9A84C', animation: 'showerBurst .35s ease', boxShadow: '0 0 36px rgba(201,168,76,.45)', whiteSpace: 'nowrap', zIndex: 802, pointerEvents: 'none' }}>
          {combo >= 10 ? '🎲 DOMINO RAIN! 🎲' : '🔥 GIFT SHOWER! 🔥'}
        </div>
      )}
      {showerActive && showerItems.map(function(item) {
        return (
          <div key={item.id} style={{ position: 'absolute', left: item.left, top: '-50px', fontSize: item.size, animation: 'showerFall ' + item.dur + ' ease-in ' + item.delay + ' forwards', pointerEvents: 'none', zIndex: 801 }}>{item.emoji}</div>
        );
      })}

      {/* Gift floats */}
      {giftFloats.map(function(g) {
        var left        = Math.floor(Math.abs(g.floatId || 0) % 65) + 5;
        var valueCents  = Math.floor(g.value_cents || g.valueCents || 0);
        var isLegendary = valueCents >= 500;
        var isLarge     = valueCents >= 100;
        var borderColor = isLegendary ? 'rgba(201,168,76,.85)' : isLarge ? 'rgba(0,222,192,.65)' : 'rgba(255,255,255,.14)';
        var glowColor   = isLegendary ? 'rgba(201,168,76,.3)'  : isLarge ? 'rgba(0,222,192,.18)' : 'transparent';
        var sender      = g.from_user || g.fromUser || 'anon';
        var amtColor    = isLegendary ? GOLD : isLarge ? TEAL : '#A89CC8';
        var animDur     = isLegendary ? '4.2s' : '3.5s';
        return (
          <div key={g.floatId}
            style={{
              position: 'absolute',
              left: left + '%',
              bottom: '110px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              animation: isLegendary
                ? 'legendBurst .4s ease, giftRise ' + animDur + ' ease-out forwards'
                : 'giftRise ' + animDur + ' ease-out forwards',
              background: 'rgba(13,10,20,.94)',
              border: '1px solid ' + borderColor,
              borderRadius: isLegendary ? 16 : 12,
              padding: isLegendary ? '12px 16px' : '8px 12px',
              minWidth: isLegendary ? 110 : 80,
              textAlign: 'center',
              boxShadow: isLegendary ? ('0 0 20px ' + glowColor + ', 0 2px 10px rgba(0,0,0,.6)') : isLarge ? ('0 0 10px ' + glowColor + ', 0 2px 6px rgba(0,0,0,.5)') : '0 2px 6px rgba(0,0,0,.4)',
            }}
          >
            <span style={{ fontSize: isLegendary ? 38 : 28, lineHeight: 1 }}>{g.emoji || '🎁'}</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: isLegendary ? 14 : 11, color: '#EDE8F5' }}>{g.name || 'Gift'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <AvatarPortrait username={sender} size={16} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#A89CC8', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sender}</span>
            </div>
            {valueCents > 0 && (
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: isLegendary ? 20 : 14, color: amtColor, letterSpacing: 1, marginTop: 1 }}>
                ${(Math.floor(valueCents) / 100).toFixed(2)}
              </span>
            )}
            {isLegendary && (
              <span style={{
                fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 8, color: GOLD,
                letterSpacing: 2, borderRadius: 4, padding: '2px 8px', marginTop: 2,
                background: 'linear-gradient(90deg,rgba(201,168,76,.2),rgba(201,168,76,.45),rgba(201,168,76,.2))',
                backgroundSize: '200% auto', animation: 'shimmer 1.8s linear infinite',
              }}>LEGENDARY</span>
            )}
            {isLarge && !isLegendary && (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, letterSpacing: 1.5, marginTop: 1 }}>BIG TIP</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
