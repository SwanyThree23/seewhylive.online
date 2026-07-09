import React, { useState } from 'react';
import rewardsService from '../../services/rewardsService';

// Base44 ruleset: function expressions only, var only, no optional chaining/??.
var ChallengeCard = function (props) {
  var challengeId = props.challengeId;
  var title = props.title || 'Untitled Challenge';
  var description = props.description || '';
  var pointsReward = props.pointsReward || 0;
  var isCompleted = props.isCompleted || false;
  var onCompleted = props.onCompleted;

  var stateHook = useState(false);
  var isSending = stateHook[0];
  var setIsSending = stateHook[1];

  var handleComplete = function () {
    if (isCompleted || isSending) return;
    setIsSending(true);
    rewardsService.completeChallenge(challengeId).then(function (result) {
      setIsSending(false);
      if (onCompleted) onCompleted(result);
    }).catch(function () {
      setIsSending(false);
    });
  };

  var cardStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: '#1a1210',
    border: '1px solid #800020',
  };

  var titleStyle = {
    color: '#F5F5DC',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '20px',
    letterSpacing: '0.5px',
  };

  var descStyle = {
    color: '#CC7755',
    fontFamily: '"Barlow Condensed", sans-serif',
    fontSize: '14px',
  };

  var footerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
  };

  var pointsStyle = {
    color: '#D4AF37',
    fontFamily: '"DM Mono", monospace',
    fontSize: '14px',
  };

  var buttonStyle = {
    minHeight: '44px',
    minWidth: '44px',
    padding: '8px 18px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: isCompleted ? '#3a2f2c' : '#800020',
    color: '#F5F5DC',
    fontFamily: '"Barlow Condensed", sans-serif',
    fontWeight: 'bold',
    opacity: isSending ? 0.6 : 1,
  };

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{title}</div>
      <div style={descStyle}>{description}</div>
      <div style={footerStyle}>
        <div style={pointsStyle}>{'+' + pointsReward + ' pts'}</div>
        <button style={buttonStyle} onClick={handleComplete} disabled={isCompleted || isSending}>
          {isCompleted ? 'Completed' : (isSending ? 'Saving...' : 'Complete')}
        </button>
      </div>
    </div>
  );
};

export default ChallengeCard;
