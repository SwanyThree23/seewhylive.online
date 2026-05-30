'use strict';
import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var GOLD = '#C9A84C';
var TEAL = '#00DEC0';

var ANIM =
  '@keyframes giftRise{0%{transform:translateY(0);opacity:1}85%{opacity:1}100%{transform:translateY(-200px);opacity:0}}' +
  '@keyframes legendBurst{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}' +
  '@keyframes comboPop{0%,100%{transform:translateX(-50%) scale(1)}40%{transform:translateX(-50%) scale(1.18)}}' +
  '@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}';

export default function GiftLayer(props) {
  var giftFloats = props.giftFloats;

  var [combo,     setCombo]     = useState(0);
  var [comboShow, setComboShow] = useState(false);
  var comboTimer = useRef(null);
  var comboCount = useRef(0);
  var prevLen    = useRef(0);

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
