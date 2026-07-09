import React, { useState, useEffect } from 'react';
import BattleTimer from '../components/battle/BattleTimer';
import BattleScoreBar from '../components/battle/BattleScoreBar';
import BattleVoteButton from '../components/battle/BattleVoteButton';
import StateVsStateBanner from '../components/battle/StateVsStateBanner';
import battleService from '../services/battleService';

// Base44 ruleset: function expressions only, var only, no optional chaining/??.
// INTEGRATION: swap the two placeholder divs below for your real mediasoup
// video component (the one used in LiveRoom.jsx) — pass challengerRoomId /
// opponentRoomId as props to it instead of rendering placeholders.
var PKBattleArena = function (props) {
  var battleId = props.battleId;
  var socket = props.socket; // pass your existing connected socket.io client in

  var battleState = useState(null);
  var battle = battleState[0];
  var setBattle = battleState[1];

  var remainingState = useState(null);
  var remainingSeconds = remainingState[0];
  var setRemainingSeconds = remainingState[1];

  useEffect(function () {
    battleService.getBattle(battleId).then(function (b) {
      setBattle(b);
      if (b && b.duration_seconds) setRemainingSeconds(b.duration_seconds);
    });

    if (!socket) return;

    var handleScoreUpdate = function (payload) {
      if (payload.battleId !== battleId) return;
      setBattle(function (prev) {
        if (!prev) return prev;
        var next = Object.assign({}, prev);
        next.challenger_score = payload.challengerScore;
        next.opponent_score = payload.opponentScore;
        return next;
      });
    };

    var handleTick = function (payload) {
      if (payload.battleId !== battleId) return;
      setRemainingSeconds(payload.remainingSeconds);
    };

    var handleEnd = function (payload) {
      if (payload.id !== battleId) return;
      setBattle(payload);
      setRemainingSeconds(0);
    };

    socket.on('battle:score_update', handleScoreUpdate);
    socket.on('battle:tick', handleTick);
    socket.on('battle:end', handleEnd);

    return function () {
      socket.off('battle:score_update', handleScoreUpdate);
      socket.off('battle:tick', handleTick);
      socket.off('battle:end', handleEnd);
    };
  }, [battleId, socket]);

  if (!battle) {
    return <div style={{ color: '#F5F5DC', padding: '24px', fontFamily: '"Barlow Condensed", sans-serif' }}>Loading battle...</div>;
  }

  var containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0C0806',
    minHeight: '100vh',
    padding: '16px',
    gap: '12px',
  };

  var splitStyle = {
    display: 'flex',
    width: '100%',
    minHeight: '260px',
    borderRadius: '8px',
    overflow: 'hidden',
  };

  var halfStyle = {
    flex: 1,
    backgroundColor: '#1a1210',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#CC7755',
    fontFamily: '"DM Mono", monospace',
    fontSize: '14px',
  };

  var voteRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
  };

  return (
    <div style={containerStyle}>
      {battle.mode === 'state_vs_state' ? (
        <StateVsStateBanner
          challengerTeamName="Home Team"
          opponentTeamName="Away Team"
          challengerCreators={[]}
          opponentCreators={[]}
        />
      ) : null}

      <BattleTimer remainingSeconds={remainingSeconds} />

      <div style={splitStyle}>
        <div style={halfStyle}>
          {/* TODO: replace with real mediasoup video component, pass battle.challenger_room_id */}
          Challenger stream
        </div>
        <div style={halfStyle}>
          {/* TODO: replace with real mediasoup video component, pass battle.opponent_room_id */}
          Opponent stream
        </div>
      </div>

      <BattleScoreBar challengerScore={battle.challenger_score} opponentScore={battle.opponent_score} />

      <div style={voteRowStyle}>
        <BattleVoteButton battleId={battleId} side="challenger" label="Gift Challenger" />
        <BattleVoteButton battleId={battleId} side="opponent" label="Gift Opponent" />
      </div>

      {battle.status === 'ended' ? (
        <div style={{ color: '#D4AF37', textAlign: 'center', fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px' }}>
          {battle.winner_id ? 'Winner declared' : 'Battle ended in a tie'}
        </div>
      ) : null}
    </div>
  );
};

export default PKBattleArena;
