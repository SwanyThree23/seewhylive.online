import React, { useState, useEffect } from 'react';
import BattleTimer from '../components/battle/BattleTimer';
import BattleScoreBar from '../components/battle/BattleScoreBar';
import BattleVoteButton from '../components/battle/BattleVoteButton';
import battleService from '../services/battleService';

// Base44 ruleset: function expressions only, var only, no optional chaining/??.
// CORRECTED to match the real pk_battles schema: defender_id (not opponent_id),
// challenger_points/defender_points (not challenger_score/opponent_score),
// single room_id (not separate challenger_room_id/opponent_room_id), no mode column
// (StateVsStateBanner removed until/unless a mode column is added).
//
// INTEGRATION: swap the two placeholder divs below for your real mediasoup
// video component (the one used in LiveRoom.jsx) — pass battle.room_id as a prop.
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
      if (b && b.duration_minutes) setRemainingSeconds(b.duration_minutes * 60);
    });

    if (!socket) return;

    var handleScoreUpdate = function (payload) {
      if (payload.battleId !== battleId) return;
      setBattle(function (prev) {
        if (!prev) return prev;
        var next = Object.assign({}, prev);
        next.challenger_points = payload.challengerPoints;
        next.defender_points = payload.defenderPoints;
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
      <BattleTimer remainingSeconds={remainingSeconds} />

      <div style={splitStyle}>
        <div style={halfStyle}>
          {/* TODO: replace with real mediasoup video component, pass battle.room_id, filter to challenger's producer */}
          {battle.challenger_name || 'Challenger'} stream
        </div>
        <div style={halfStyle}>
          {/* TODO: replace with real mediasoup video component, pass battle.room_id, filter to defender's producer */}
          {battle.defender_name || 'Defender'} stream
        </div>
      </div>

      <BattleScoreBar challengerScore={battle.challenger_points} opponentScore={battle.defender_points} />

      <div style={voteRowStyle}>
        <BattleVoteButton battleId={battleId} side="challenger" label={'Gift ' + (battle.challenger_name || 'Challenger')} />
        <BattleVoteButton battleId={battleId} side="defender" label={'Gift ' + (battle.defender_name || 'Defender')} />
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
