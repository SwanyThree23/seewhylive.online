'use strict';
import React, { useEffect } from 'react';

var _chyronStyleInjected = false;

export default function BrandChyron(props) {
  var isLive = props.isLive;

  useEffect(function() {
    if (!_chyronStyleInjected) {
      _chyronStyleInjected = true;
      var styleEl = document.createElement('style');
      styleEl.textContent = '@keyframes rainbowShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }';
      document.head.appendChild(styleEl);
    }
  }, []);

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: isLive ? 3 : 2,
      background: isLive
        ? 'linear-gradient(90deg, #FF1564, #C9A84C, #00F5FF, #00FF88, #8B5CF6, #FF1564)'
        : 'linear-gradient(90deg, rgba(128,0,32,.6), rgba(201,168,76,.4), rgba(0,201,167,.3), rgba(128,0,32,.6))',
      backgroundSize: '300% 100%',
      animation: 'rainbowShift 6s linear infinite',
      zIndex: 9999,
      pointerEvents: 'none',
    }
  });
}
