import React from 'react';

// Base44 ruleset: function expressions only, var only, no optional chaining/??.
var BattleScoreBar = function (props) {
  var challengerScore = props.challengerScore || 0;
  var opponentScore = props.opponentScore || 0;
  var total = challengerScore + opponentScore;
  var challengerPct = total > 0 ? Math.round((challengerScore / total) * 100) : 50;
  var opponentPct = 100 - challengerPct;
  var challengerLeading = challengerScore > opponentScore;
  var opponentLeading = opponentScore > challengerScore;

  var containerStyle = {
    display: 'flex',
    width: '100%',
    minHeight: '44px',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '2px solid #800020',
    fontFamily: '"Barlow Condensed", sans-serif',
  };

  var challengerStyle = {
    width: challengerPct + '%',
    backgroundColor: challengerLeading ? '#C9A84C' : '#800020',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: '12px',
    color: challengerLeading ? '#0C0806' : '#F0E8D4',
    fontWeight: 'bold',
    transition: 'width 0.4s ease',
  };

  var opponentStyle = {
    width: opponentPct + '%',
    backgroundColor: opponentLeading ? '#C9A84C' : '#CC7755',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '12px',
    color: opponentLeading ? '#0C0806' : '#F0E8D4',
    fontWeight: 'bold',
    transition: 'width 0.4s ease',
  };

  return (
    <div style={containerStyle}>
      <div style={challengerStyle}>{challengerScore}</div>
      <div style={opponentStyle}>{opponentScore}</div>
    </div>
  );
};

export default BattleScoreBar;
