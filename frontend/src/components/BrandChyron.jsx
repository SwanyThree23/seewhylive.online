'use strict';
import React, { useEffect } from 'react';

var _chyronStyleInjected = false;

var BASE_TICKER = '🔴 LIVE ON SEEWHY LIVE  ·  MULTI-PANEL STREAMING  ·  90% CREATOR PAYOUT  ·  POWERED BY AURA AI  ·  WASHINGTON CLASSIC LIVE  ·  SUBSCRIBE FOR EXCLUSIVE ACCESS  ·';

export default function BrandChyron(props) {
  var isLive = props.isLive;
  var streamTitle = props.streamTitle;

  useEffect(function() {
    if (!_chyronStyleInjected) {
      _chyronStyleInjected = true;
      var styleEl = document.createElement('style');
      styleEl.textContent = '@keyframes chyronScroll { 0% { transform: translateX(100vw); } 100% { transform: translateX(-200%); } }';
      document.head.appendChild(styleEl);
    }
  }, []);

  var tickerText = BASE_TICKER;
  if (isLive && streamTitle) {
    tickerText = '🔴 LIVE: ' + streamTitle + '  ·  ' + BASE_TICKER;
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement('div', {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'linear-gradient(90deg, #FF1564, #C9A84C, #00F5FF, #00FF88, #8B5CF6, transparent)',
        zIndex: 9999,
        pointerEvents: 'none',
      }
    }),
    React.createElement(
      'div',
      {
        style: {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 34,
          background: 'rgba(3,3,10,.97)',
          borderTop: '1px solid rgba(255,21,100,.25)',
          zIndex: 9998,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }
      },
      React.createElement(
        'div',
        {
          style: {
            display: 'inline-block',
            whiteSpace: 'nowrap',
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 11,
            color: '#7A6F90',
            letterSpacing: 1.5,
            animation: 'chyronScroll linear 40s infinite',
          }
        },
        tickerText
      )
    )
  );
}
