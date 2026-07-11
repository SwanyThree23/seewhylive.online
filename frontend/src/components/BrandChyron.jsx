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
        ? 'linear-gradient(90deg, #C0392B, #C9A84C, #4A8A7A, #6DBF7E, #7B5DA6, #C0392B)'
        : 'linear-gradient(90deg, rgba(128,0,32,.6), rgba(201,168,76,.4), rgba(201,168,76,.3), rgba(128,0,32,.6))',
      backgroundSize: '300% 100%',
      animation: 'rainbowShift 6s linear infinite',
      zIndex: 9999,
      pointerEvents: 'none',
    }
  });
}
