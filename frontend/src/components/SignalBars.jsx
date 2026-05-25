'use strict';
import React from 'react';

var _signalStyleInjected = false;

var BAR_HEIGHTS = [8, 14, 20, 14, 8];
var BAR_DELAYS = ['0ms', '100ms', '200ms', '100ms', '0ms'];

export default function SignalBars(props) {
  var isActive = props.isActive;
  var count = props.count || 5;
  var color = props.color || (isActive ? '#FF1564' : '#7A6F90');

  if (!_signalStyleInjected) {
    _signalStyleInjected = true;
    var styleEl = document.createElement('style');
    styleEl.textContent = '@keyframes signalPulse { 0% { transform: scaleY(0.4); } 50% { transform: scaleY(1.0); } 100% { transform: scaleY(0.4); } }';
    document.head.appendChild(styleEl);
  }

  var bars = [];
  var numBars = Math.min(count, 5);
  var i;
  for (i = 0; i < numBars; i++) {
    var barStyle = {
      width: 3,
      height: BAR_HEIGHTS[i],
      background: color,
      borderRadius: 2,
      transformOrigin: 'bottom center',
      opacity: isActive ? 1 : 0.5,
      animation: isActive ? ('signalPulse 0.8s ease-in-out ' + BAR_DELAYS[i] + ' infinite') : 'none',
      display: 'inline-block',
      marginRight: i < numBars - 1 ? 2 : 0,
    };
    bars.push(React.createElement('div', { key: i, style: barStyle }));
  }

  return React.createElement(
    'div',
    {
      style: {
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: 0,
        height: 24,
        verticalAlign: 'middle',
      }
    },
    bars
  );
}
