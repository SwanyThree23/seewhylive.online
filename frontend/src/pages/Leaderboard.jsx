import React, { useState, useEffect } from 'react';
import LeaderboardRow from '../components/rewards/LeaderboardRow';
import ChallengeCard from '../components/rewards/ChallengeCard';
import LevelBadge from '../components/rewards/LevelBadge';
import rewardsService from '../services/rewardsService';
import PullToRefresh from '../components/PullToRefresh.jsx';

// Base44 ruleset: function expressions only, var only, no optional chaining/??.
var Leaderboard = function (props) {
  var currentUserId = props.currentUserId;

  var tabState = useState('global');
  var activeTab = tabState[0];
  var setActiveTab = tabState[1];

  var rowsState = useState([]);
  var rows = rowsState[0];
  var setRows = rowsState[1];

  var myStandingState = useState(null);
  var myStanding = myStandingState[0];
  var setMyStanding = myStandingState[1];

  var challengesState = useState([]);
  var challenges = challengesState[0];
  var setChallenges = challengesState[1];

  var completionsState = useState([]);
  var completions = completionsState[0];
  var setCompletions = completionsState[1];

  useEffect(function () {
    var loader = activeTab === 'weekly'
      ? rewardsService.getWeeklyLeaderboard(50)
      : rewardsService.getGlobalLeaderboard(50);
    loader.then(function (data) { setRows(data); });
  }, [activeTab]);

  useEffect(function () {
    rewardsService.getMyStanding().then(function (data) { setMyStanding(data); }).catch(function () {});
    rewardsService.getActiveChallenges().then(function (data) { setChallenges(data); });
    rewardsService.getMyCompletions().then(function (data) { setCompletions(data); }).catch(function () {});
  }, []);

  function refreshLeaderboard() {
    var loader = activeTab === 'weekly'
      ? rewardsService.getWeeklyLeaderboard(50)
      : rewardsService.getGlobalLeaderboard(50);
    loader.then(function (data) { setRows(data); });
    rewardsService.getMyStanding().then(function (data) { setMyStanding(data); }).catch(function () {});
    rewardsService.getActiveChallenges().then(function (data) { setChallenges(data); });
    rewardsService.getMyCompletions().then(function (data) { setCompletions(data); }).catch(function () {});
  }

  var isCompleted = function (challengeId) {
    var i;
    for (i = 0; i < completions.length; i = i + 1) {
      if (completions[i].challenge_id === challengeId) return true;
    }
    return false;
  };

  var handleChallengeCompleted = function () {
    rewardsService.getMyCompletions().then(function (data) { setCompletions(data); });
    rewardsService.getMyStanding().then(function (data) { setMyStanding(data); });
  };

  var containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0C0806',
    minHeight: '100vh',
    padding: '16px',
    gap: '16px',
  };

  var headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  var titleStyle = {
    color: '#F5F5DC',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '28px',
    letterSpacing: '1px',
  };

  var tabRowStyle = {
    display: 'flex',
    gap: '8px',
  };

  var tabStyle = function (tabName) {
    return {
      minHeight: '44px',
      padding: '8px 20px',
      borderRadius: '20px',
      border: '2px solid #800020',
      backgroundColor: activeTab === tabName ? '#800020' : 'transparent',
      color: '#F5F5DC',
      fontFamily: '"Barlow Condensed", sans-serif',
      fontWeight: 'bold',
    };
  };

  var sectionTitleStyle = {
    color: '#D4AF37',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '18px',
    letterSpacing: '0.5px',
    marginTop: '8px',
  };

  var challengeListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  return (
    <PullToRefresh onRefresh={refreshLeaderboard}>
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>Leaderboard</div>
        {myStanding ? <LevelBadge level={myStanding.level} /> : null}
      </div>

      {myStanding ? (
        <div style={{ color: '#CC7755', fontFamily: '"DM Mono", monospace', fontSize: '13px' }}>
          {'Your rank: #' + (myStanding.rank || '-') + '  \u00B7  ' + (myStanding.total_points || 0) + ' pts'}
        </div>
      ) : null}

      <div style={tabRowStyle}>
        <button style={tabStyle('global')} onClick={function () { setActiveTab('global'); }}>All-Time</button>
        <button style={tabStyle('weekly')} onClick={function () { setActiveTab('weekly'); }}>This Week</button>
      </div>

      <div>
        {rows.map(function (entry, index) {
          var points = activeTab === 'weekly' ? entry.total_points : entry.total_points;
          var isMe = currentUserId && entry.user_id === currentUserId;
          return (
            <div key={entry.user_id} style={isMe ? { outline: '2px solid #D4AF37', borderRadius: '6px' } : null}>
              <LeaderboardRow
                rank={index + 1}
                displayName={entry.display_name || entry.user_id}
                points={points}
                level={entry.level || 1}
              />
            </div>
          );
        })}
      </div>

      <div style={sectionTitleStyle}>Active Challenges</div>
      <div style={challengeListStyle}>
        {challenges.map(function (challenge) {
          return (
            <ChallengeCard
              key={challenge.id}
              challengeId={challenge.id}
              title={challenge.title}
              description={challenge.description}
              pointsReward={challenge.points_reward}
              isCompleted={isCompleted(challenge.id)}
              onCompleted={handleChallengeCompleted}
            />
          );
        })}
      </div>
    </div>
    </PullToRefresh>
  );
};

export default Leaderboard;
