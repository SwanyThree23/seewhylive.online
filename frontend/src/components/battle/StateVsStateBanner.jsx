import React from 'react';

// Base44 ruleset: function expressions only, var only, no optional chaining/??.
var StateVsStateBanner = function (props) {
  var challengerTeamName = props.challengerTeamName || 'Team A';
  var opponentTeamName = props.opponentTeamName || 'Team B';
  var challengerCreators = props.challengerCreators || [];
  var opponentCreators = props.opponentCreators || [];

  var bannerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '44px',
    padding: '10px 16px',
    backgroundColor: '#800020',
    color: '#F5F5DC',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '20px',
    letterSpacing: '1px',
    borderRadius: '6px',
  };

  var vsStyle = {
    color: '#D4AF37',
    fontSize: '16px',
    padding: '0 12px',
  };

  var renderNames = function (creators) {
    if (creators.length === 0) return '';
    return creators.join(', ');
  };

  return (
    <div style={bannerStyle}>
      <div>
        <div>{challengerTeamName}</div>
        <div style={{ fontSize: '12px', fontFamily: '"DM Mono", monospace' }}>{renderNames(challengerCreators)}</div>
      </div>
      <div style={vsStyle}>VS</div>
      <div style={{ textAlign: 'right' }}>
        <div>{opponentTeamName}</div>
        <div style={{ fontSize: '12px', fontFamily: '"DM Mono", monospace' }}>{renderNames(opponentCreators)}</div>
      </div>
    </div>
  );
};

export default StateVsStateBanner;
