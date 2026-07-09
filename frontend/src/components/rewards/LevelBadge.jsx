import React from 'react';

// Base44 ruleset: function expressions only, var only, no optional chaining/??.
var TIER_NAMES = { 1: 'Rookie', 2: 'Contender', 3: 'Veteran', 4: 'Champion', 5: 'Legend' };

var LevelBadge = function (props) {
  var level = props.level || 1;
  var name = TIER_NAMES[level] || ('Level ' + level);

  var style = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '28px',
    padding: '4px 12px',
    borderRadius: '14px',
    backgroundColor: '#D4AF37',
    color: '#0C0806',
    fontFamily: '"Barlow Condensed", sans-serif',
    fontWeight: 'bold',
    fontSize: '13px',
    letterSpacing: '0.5px',
  };

  return <span style={style}>{'LV ' + level + ' \u00B7 ' + name}</span>;
};

export default LevelBadge;
