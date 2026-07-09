import React from 'react';
import LevelBadge from './LevelBadge';

// Base44 ruleset: function expressions only, var only, no optional chaining/??.
var LeaderboardRow = function (props) {
  var rank = props.rank;
  var displayName = props.displayName || 'Unknown';
  var points = props.points || 0;
  var level = props.level || 1;
  var isTopThree = rank <= 3;

  var rowStyle = {
    display: 'flex',
    alignItems: 'center',
    minHeight: '44px',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: isTopThree ? '#1a1210' : 'transparent',
    borderBottom: '1px solid #2a1f1c',
    gap: '12px',
  };

  var rankStyle = {
    width: '32px',
    textAlign: 'center',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '20px',
    color: isTopThree ? '#D4AF37' : '#CC7755',
  };

  var nameStyle = {
    flex: 1,
    color: '#F5F5DC',
    fontFamily: '"Barlow Condensed", sans-serif',
    fontSize: '16px',
  };

  var pointsStyle = {
    color: '#D4AF37',
    fontFamily: '"DM Mono", monospace',
    fontSize: '14px',
  };

  return (
    <div style={rowStyle}>
      <div style={rankStyle}>{'#' + rank}</div>
      <div style={nameStyle}>{displayName}</div>
      <LevelBadge level={level} />
      <div style={pointsStyle}>{points + ' pts'}</div>
    </div>
  );
};

export default LeaderboardRow;
