import React, { useState, useEffect } from 'react';
import BattleTimer from '../components/battle/BattleTimer';
import BattleScoreBar from '../components/battle/BattleScoreBar';
import BattleVoteButton from '../components/battle/BattleVoteButton';
import OctCell from '../components/OctCell.jsx';
import battleService from '../services/battleService';

// Base44 ruleset: function expressions only, var only, no optional chaining/??.
// CORRECTED to match the real pk_battles schema: defender_id (not opponent_id),
// challenger_points/defender_points (not challenger_score/opponent_score),
// single room_id (not separate challenger_room_id/opponent_room_id).
//
// Props:
//   battleId        {string}  — pk_battles.id
//   socket          {object}  — connected socket.io client
//   userId          {string}  — current viewer's userId
//   guests          {Array}   — live guest objects from App.jsx state
//                               each: { guestId, username, producerId, audioProducerId }
//   rtcManager      {object}  — mediasoup RTC manager from webrtc.js
var PKBattleArena = function (props) {
  var battleId   = props.battleId;
  var socket     = props.socket;
  var userId     = props.userId || '';
  var guests     = props.guests || [];
  var rtcManager = props.rtcManager || null;

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

  // Look up each side's guest object from the live guests list so OctCell can
  // subscribe to their mediasoup producer. Fall back to a minimal stub so the
  // name-plate still renders even when the guest hasn't joined yet.
  var challengerGuest = (function() {
    var found = null;
    for (var i = 0; i < guests.length; i++) {
      var g = guests[i];
      if ((g.guestId || g.userId) === battle.challenger_id) { found = g; break; }
    }
    return found || { guestId: battle.challenger_id, username: battle.challenger_name || 'Challenger' };
  })();

  var defenderGuest = (function() {
    var found = null;
    for (var i = 0; i < guests.length; i++) {
      var g = guests[i];
      if ((g.guestId || g.userId) === battle.defender_id) { found = g; break; }
    }
    return found || { guestId: battle.defender_id, username: battle.defender_name || 'Defender' };
  })();

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
    gap: '4px',
  };

  var halfStyle = {
    flex: 1,
    position: 'relative',
    minHeight: '260px',
  };

  var namePlateStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,.7))',
    padding: '18px 8px 6px',
    fontFamily: '"Barlow Condensed", sans-serif',
    fontSize: '13px',
    fontWeight: 700,
    color: '#F5F5DC',
    textAlign: 'center',
    letterSpacing: '0.5px',
    pointerEvents: 'none',
    zIndex: 2,
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
          <OctCell
            guest={challengerGuest}
            fill={true}
            isHost={false}
            fadesMode={false}
            branding={null}
            onTap={null}
            socket={socket}
            roomId={battle.room_id}
            userId={userId}
            rtcManager={rtcManager}
            mediaConfig={null}
            isMuted={false}
            isCamOff={false}
            onMuteToggle={null}
            onCamToggle={null}
          />
          <div style={namePlateStyle}>{battle.challenger_name || 'Challenger'}</div>
        </div>
        <div style={halfStyle}>
          <OctCell
            guest={defenderGuest}
            fill={true}
            isHost={false}
            fadesMode={false}
            branding={null}
            onTap={null}
            socket={socket}
            roomId={battle.room_id}
            userId={userId}
            rtcManager={rtcManager}
            mediaConfig={null}
            isMuted={false}
            isCamOff={false}
            onMuteToggle={null}
            onCamToggle={null}
          />
          <div style={namePlateStyle}>{battle.defender_name || 'Defender'}</div>
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
