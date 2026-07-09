import React, { useState } from 'react';
import battleService from '../../services/battleService';

// Base44 ruleset: function expressions only, var only, no optional chaining/??.
var BattleVoteButton = function (props) {
  var battleId = props.battleId;
  var side = props.side; // 'challenger' | 'opponent'
  var giftValueCents = props.giftValueCents || 100;
  var label = props.label || 'Vote';
  var onVoted = props.onVoted;

  var stateHook = useState(false);
  var isSending = stateHook[0];
  var setIsSending = stateHook[1];

  var handleClick = function () {
    setIsSending(true);
    battleService.vote(battleId, side, giftValueCents).then(function (result) {
      setIsSending(false);
      if (onVoted) onVoted(result);
    }).catch(function () {
      setIsSending(false);
    });
  };

  var style = {
    minHeight: '44px',
    minWidth: '44px',
    padding: '10px 20px',
    borderRadius: '24px',
    border: 'none',
    backgroundColor: side === 'challenger' ? '#800020' : '#CC7755',
    color: '#F5F5DC',
    fontFamily: '"Barlow Condensed", sans-serif',
    fontSize: '16px',
    fontWeight: 'bold',
    opacity: isSending ? 0.6 : 1,
  };

  return (
    <button style={style} onClick={handleClick} disabled={isSending}>
      {isSending ? 'Sending...' : label}
    </button>
  );
};

export default BattleVoteButton;
