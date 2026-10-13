import React from 'react';

// Base44 ruleset: function expressions only, var only, no optional chaining/??.
var BattleTimer = function (props) {
  var remainingSeconds = props.remainingSeconds;
  var isUrgent = remainingSeconds !== null && remainingSeconds !== undefined && remainingSeconds <= 30;

  var minutes = Math.floor(remainingSeconds / 60);
  var seconds = remainingSeconds % 60;
  var display = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

  var style = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '48px',
    letterSpacing: '2px',
    textAlign: 'center',
    padding: '8px 24px',
    minHeight: '44px',
    color: isUrgent ? '#FF1A3C' : '#F0E8D4',
    backgroundColor: '#0C0806',
    borderRadius: '8px',
    border: isUrgent ? '2px solid #FF1A3C' : '2px solid #C9A84C',
    transition: 'color 0.3s ease, border-color 0.3s ease',
  };

  return <div style={style}>{display}</div>;
};

export default BattleTimer;
