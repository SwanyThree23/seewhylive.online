import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var SEASON = 2026;
var WEEK   = 8;

var RANKINGS = [
  { rank: 1, rank_prev: 1, change:  0, state_name: 'Washington',     state_abbr: 'WA', state_emoji: '🌲', region: 'West',      points: 240, losses: 0, streak: 8, tiles_diff:  42 },
  { rank: 2, rank_prev: 2, change:  0, state_name: 'California',     state_abbr: 'CA', state_emoji: '🐻', region: 'West',      points: 210, losses: 1, streak: 5, tiles_diff:  31 },
  { rank: 3, rank_prev: 4, change:  1, state_name: 'Texas',          state_abbr: 'TX', state_emoji: '⭐', region: 'Southwest', points: 180, losses: 2, streak: 3, tiles_diff:  18 },
  { rank: 4, rank_prev: 3, change: -1, state_name: 'Georgia',        state_abbr: 'GA', state_emoji: '🍑', region: 'Southeast', points: 178, losses: 2, streak: 2, tiles_diff:  16 },
  { rank: 5, rank_prev: 6, change:  1, state_name: 'New York',       state_abbr: 'NY', state_emoji: '🗽', region: 'Northeast', points: 150, losses: 3, streak: 1, tiles_diff:   8 },
  { rank: 6, rank_prev: 5, change: -1, state_name: 'Florida',        state_abbr: 'FL', state_emoji: '🌴', region: 'Southeast', points: 148, losses: 3, streak: 0, tiles_diff:   5 },
  { rank: 7, rank_prev: 7, change:  0, state_name: 'Illinois',       state_abbr: 'IL', state_emoji: '🏙', region: 'Midwest',   points: 120, losses: 4, streak: 0, tiles_diff:  -8 },
  { rank: 8, rank_prev: 8, change:  0, state_name: 'North Carolina', state_abbr: 'NC', state_emoji: '🌸', region: 'Southeast', points: 118, losses: 4, streak: 0, tiles_diff: -14 },
];

var REGION_COLORS = {
  West:      '#C9A84C',
  Southwest: '#FF6B35',
  Southeast: '#C9A84C',
  Northeast: '#C9A84C',
  Midwest:   '#C9A84C',
};

var MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };
var REGIONS = ['All', 'West', 'Southwest', 'Southeast', 'Northeast', 'Midwest'];
var VIEWS = ['RANKINGS', 'SCHEDULE', 'STATS'];

var SCHEDULE = [
  { home: 'WA', away: 'TX', date: 'Sat Jun 7',  time: '2:00 PM ET',  venue: 'Pacific Classic Arena' },
  { home: 'CA', away: 'NY', date: 'Sat Jun 7',  time: '4:00 PM ET',  venue: 'West Coast Domino Hall' },
  { home: 'GA', away: 'FL', date: 'Sun Jun 8',  time: '1:00 PM ET',  venue: 'Southeast Domino Center' },
  { home: 'IL', away: 'NC', date: 'Sun Jun 8',  time: '3:30 PM ET',  venue: 'Midwest Tiles Arena' },
  { home: 'TX', away: 'CA', date: 'Fri Jun 13', time: '7:00 PM ET',  venue: 'SeeWhy LIVE Arena' },
];

function getEmojiForAbbr(abbr, rankingsList) {
  var i;
  for (i = 0; i < rankingsList.length; i++) {
    if (rankingsList[i].state_abbr === abbr) {
      return rankingsList[i].state_emoji;
    }
  }
  return '';
}

export default function StateRankingsTab({ isLive, addToast }) {
  var [region,     setRegion]     = useState('All');
  var [expanded,   setExpanded]   = useState(null);
  var [view,       setView]       = useState('RANKINGS');
  var [myState,    setMyState]    = useState(function() {
    try { return localStorage.getItem('sw_my_state') || null; } catch(e) { return null; }
  });
  var [shareCopied, setShareCopied] = useState(false);

  useEffect(function() {
    try { if (myState) { localStorage.setItem('sw_my_state', myState); } else { localStorage.removeItem('sw_my_state'); } } catch(e) {}
  }, [myState]);

  function shareRankings() {
    var lines = ['🏅 STATE RANKINGS — Week ' + WEEK + ' Season ' + SEASON];
    for (var i = 0; i < rankings.length && i < 8; i++) {
      var r = rankings[i];
      var wins = WEEK - r.losses;
      lines.push('#' + r.rank + ' ' + r.state_emoji + ' ' + r.state_name + ' · ' + r.points + ' pts · ' + wins + '-' + r.losses);
    }
    lines.push('via seewhylive.online');
    var text = lines.join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        setShareCopied(true);
        setTimeout(function() { setShareCopied(false); }, 2000);
      }).catch(function() {});
    }
    if (addToast) addToast('Rankings copied to clipboard!', 'success');
  }

  var [rankings, setRankings] = useState(RANKINGS.map(function(r) {
    return {
      rank:       r.rank,
      rank_prev:  r.rank_prev,
      change:     r.change,
      state_name: r.state_name,
      state_abbr: r.state_abbr,
      state_emoji: r.state_emoji,
      region:     r.region,
      points:     r.points,
      losses:     r.losses,
      streak:     r.streak,
      tiles_diff: r.tiles_diff,
    };
  }));

  useEffect(function() {
    if (!isLive) { return; }
    var timer = setInterval(function() {
      setRankings(function(prev) {
        var updated = prev.map(function(r) {
          return {
            rank:        r.rank,
            rank_prev:   r.rank_prev,
            change:      r.change,
            state_name:  r.state_name,
            state_abbr:  r.state_abbr,
            state_emoji: r.state_emoji,
            region:      r.region,
            points:      r.points,
            losses:      r.losses,
            streak:      r.streak,
            tiles_diff:  r.tiles_diff,
          };
        });

        // Pick a random entry from indices 2–7 (never #1 WA at index 0)
        var targetIdx = 2 + Math.floor(Math.random() * 6);
        var delta     = 1 + Math.floor(Math.random() * 3);
        var direction = Math.random() < 0.5 ? 1 : -1;
        updated[targetIdx].points = updated[targetIdx].points + direction * delta;

        // Re-sort by points descending, keep index 0 (WA) locked at rank 1
        var locked  = updated[0];
        var rest    = updated.slice(1);
        rest.sort(function(a, b) { return b.points - a.points; });
        var sorted  = [locked].concat(rest);

        // Recompute rank and change fields
        var i;
        for (i = 0; i < sorted.length; i++) {
          var oldRank  = sorted[i].rank;
          var newRank  = i + 1;
          sorted[i].rank_prev = oldRank;
          sorted[i].change    = oldRank - newRank;
          sorted[i].rank      = newRank;
        }

        return sorted;
      });
    }, 2800);

    return function() { clearInterval(timer); };
  }, [isLive]);

  // --- RANKINGS view helpers ---
  var visible = rankings.filter(function(r) {
    return region === 'All' || r.region === region;
  });

  // --- STATS view helpers ---
  var totalMatches = WEEK * 4;
  var pointsSum = 0;
  var j;
  for (j = 0; j < rankings.length; j++) {
    pointsSum = pointsSum + rankings[j].points;
  }
  var avgPoints    = Math.floor(pointsSum / rankings.length);
  var pointsLeader = rankings[0].state_name;
  var maxPts       = rankings[0].points;
  var i;
  for (i = 1; i < rankings.length; i++) {
    if (rankings[i].points > maxPts) { maxPts = rankings[i].points; }
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* Tab switcher — appears at very top */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(26,21,16,.9)', border: '1px solid #3D3020', borderRadius: 10, padding: 4 }}>
        {VIEWS.map(function(v) {
          var active = view === v;
          return (
            <button
              key={v}
              onClick={function() { setView(v); }}
              style={{
                flex: 1,
                background:   active ? 'rgba(201,168,76,.18)' : 'transparent',
                border:       active ? '1px solid rgba(201,168,76,.45)' : '1px solid transparent',
                borderRadius: 7,
                padding:      '6px 4px',
                color:        active ? '#C9A84C' : '#8A7A62',
                fontFamily:   "'Barlow Condensed',sans-serif",
                fontWeight:   700,
                fontSize:     11,
                letterSpacing: 1.5,
                cursor:       'pointer',
              }}
            >
              {v}
            </button>
          );
        })}
      </div>

      {/* ===== RANKINGS VIEW ===== */}
      {view === 'RANKINGS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.12),rgba(128,0,32,.1))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A84C', letterSpacing: 3 }}>🏅 STATE RANKINGS</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginTop: 2 }}>Season {SEASON} · Week {WEEK} · National Domino Federation</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <button onClick={shareRankings} style={{ background: shareCopied ? 'rgba(201,168,76,.18)' : 'rgba(201,168,76,.1)', border: '1px solid ' + (shareCopied ? 'rgba(201,168,76,.4)' : 'rgba(201,168,76,.3)'), borderRadius: 6, padding: '4px 10px', color: shareCopied ? '#C9A84C' : '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
                  {shareCopied ? '✓ COPIED' : '📤 SHARE'}
                </button>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#C9A84C', lineHeight: 1 }}>{rankings.length}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>STATES RANKED</div>
                </div>
              </div>
            </div>

            {/* Top-3 portrait podium */}
            {rankings.length > 0 && (
              <div>
                {/* #1 Hero Card */}
                <div style={{
                  background: 'linear-gradient(160deg,rgba(201,168,76,.18),rgba(14,12,9,.97))',
                  border: '2px solid rgba(201,168,76,.55)',
                  borderRadius: 12,
                  padding: '16px 14px',
                  textAlign: 'center',
                  marginBottom: 8,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, background: 'radial-gradient(circle,rgba(201,168,76,.2),transparent 65%)', pointerEvents: 'none' }} />
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 3, marginBottom: 10 }}>🥇 NATIONAL LEADER</div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                    <AvatarPortrait username={rankings[0].state_name} size={72} rank={1} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 22 }}>{rankings[0].state_emoji}</span>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: '#F0E8D4', letterSpacing: 2 }}>{rankings[0].state_name}</div>
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: '#C9A84C', lineHeight: 1, textShadow: '0 0 20px rgba(201,168,76,.5)' }}>{rankings[0].points}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginTop: 2 }}>POINTS · {WEEK - rankings[0].losses}W-{rankings[0].losses}L · {rankings[0].streak > 0 ? (rankings[0].streak + '-STREAK') : 'NO STREAK'}</div>
                </div>
                {/* #2 and #3 side by side */}
                {rankings.length >= 3 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
                    {rankings.slice(1, 3).map(function(r) {
                      return (
                        <div key={r.rank} style={{
                          flex: 1,
                          background: 'rgba(26,21,16,.8)',
                          border: '1px solid rgba(201,168,76,.2)',
                          borderRadius: 10,
                          padding: '12px 8px',
                          textAlign: 'center',
                        }}>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#8A7A62', letterSpacing: 2, marginBottom: 8 }}>{MEDALS[r.rank]} #{r.rank}</div>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                            <AvatarPortrait username={r.state_name} size={52} rank={r.rank} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 2 }}>
                            <span style={{ fontSize: 14 }}>{r.state_emoji}</span>
                            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#F0E8D4', letterSpacing: 1 }}>{r.state_abbr}</span>
                          </div>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: '#C9A84C', lineHeight: 1 }}>{r.points}</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#8A7A62', marginTop: 2 }}>{WEEK - r.losses}W-{r.losses}L</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Region filter */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
            {REGIONS.map(function(reg) {
              var active = region === reg;
              var color  = reg === 'All' ? '#C9A84C' : (REGION_COLORS[reg] || '#8A7A62');
              return (
                <button key={reg} onClick={function() { setRegion(reg); }}
                  style={{ background: active ? color + '22' : 'rgba(26,21,16,.7)', border: '1px solid ' + (active ? color + '66' : '#3D3020'), borderRadius: 999, padding: '3px 10px', color: active ? color : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0, letterSpacing: 1 }}>
                  {reg.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '28px 36px 1fr 48px 44px 36px 32px', gap: 4, padding: '0 8px' }}>
            {['#', 'CHG', 'STATE', 'PTS', 'W-L', 'TILES', 'STK'].map(function(h, i) {
              return (
                <div key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', textAlign: i >= 3 ? 'center' : 'left' }}>{h}</div>
              );
            })}
          </div>

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {visible.map(function(r) {
              var rc    = REGION_COLORS[r.region] || '#8A7A62';
              var wins  = WEEK - r.losses;
              var isTop = r.rank <= 3;
              var isExp = expanded === r.rank;
              var isMine = myState === r.state_abbr;

              return (
                <div key={r.state_abbr}>
                  <div
                    onClick={function() { setExpanded(isExp ? null : r.rank); }}
                    style={{ display: 'grid', gridTemplateColumns: '28px 36px 1fr 48px 44px 36px 32px', gap: 4, alignItems: 'center', background: isMine ? 'rgba(201,168,76,.07)' : isTop ? 'rgba(201,168,76,.07)' : 'rgba(26,21,16,.7)', border: '1px solid ' + (isMine ? 'rgba(201,168,76,.35)' : isTop ? 'rgba(201,168,76,.25)' : '#3D3020'), borderRadius: isExp ? '8px 8px 0 0' : 8, padding: '8px', cursor: 'pointer' }}>

                    {/* Rank */}
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: isTop ? 16 : 13, color: isTop ? '#C9A84C' : '#8A7A62', textAlign: 'center', lineHeight: 1 }}>
                      {MEDALS[r.rank] || r.rank}
                    </div>

                    {/* Change */}
                    <div style={{ textAlign: 'center' }}>
                      {r.change > 0 && <span style={{ color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 700 }}>▲{r.change}</span>}
                      {r.change < 0 && <span style={{ color: '#FF1A3C', fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 700 }}>▼{Math.abs(r.change)}</span>}
                      {r.change === 0 && <span style={{ color: '#8A7A62', fontFamily: "'DM Mono',monospace", fontSize: 9 }}>—</span>}
                    </div>

                    {/* State */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{r.state_emoji}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.state_name}</div>
                        <div style={{ background: rc + '18', border: '1px solid ' + rc + '33', borderRadius: 999, display: 'inline-block', padding: '0 5px', fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: rc }}>{r.region}</div>
                      </div>
                    </div>

                    {/* Points */}
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: isTop ? '#C9A84C' : '#F0E8D4', textAlign: 'center' }}>{r.points}</div>

                    {/* W-L */}
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textAlign: 'center' }}>
                      <span style={{ color: '#C9A84C' }}>{wins}</span>
                      <span style={{ color: '#8A7A62' }}>-</span>
                      <span style={{ color: r.losses > 0 ? '#FF6B81' : '#8A7A62' }}>{r.losses}</span>
                    </div>

                    {/* Tiles diff */}
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: r.tiles_diff > 0 ? '#C9A84C' : r.tiles_diff < 0 ? '#FF1A3C' : '#8A7A62', textAlign: 'center', fontWeight: 700 }}>
                      {r.tiles_diff > 0 ? '+' : ''}{r.tiles_diff}
                    </div>

                    {/* Streak */}
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: r.streak > 0 ? '#C9A84C' : '#8A7A62', textAlign: 'center', fontWeight: r.streak > 0 ? 700 : 400 }}>
                      {r.streak > 0 ? 'W' + r.streak : '—'}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExp && (
                    <div style={{ background: 'rgba(14,12,9,.95)', border: '1px solid rgba(201,168,76,.2)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginBottom: 2 }}>PREV RANK</div>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#F0E8D4' }}>#{r.rank_prev}</div>
                        </div>
                        <div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginBottom: 2 }}>WIN RATE</div>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C' }}>{Math.floor(wins / WEEK * 100)}%</div>
                        </div>
                        <div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginBottom: 2 }}>SEASON</div>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#F0E8D4' }}>{SEASON}</div>
                        </div>
                        <div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginBottom: 2 }}>WEEK</div>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#F0E8D4' }}>{WEEK}</div>
                        </div>
                      </div>
                      <button
                        onClick={function() { setMyState(isMine ? null : r.state_abbr); }}
                        style={{ background: isMine ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (isMine ? 'rgba(201,168,76,.4)' : '#3D3020'), borderRadius: 6, padding: '4px 12px', color: isMine ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
                        {isMine ? '✓ MY STATE' : '📍 SET AS MY STATE'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '4px 2px', borderTop: '1px solid #3D3020', paddingTop: 8 }}>
            {[['▲ moved up','#C9A84C'],['▼ moved down','#FF1A3C'],['— no change','#8A7A62'],['TILES = tile differential','#C9A84C'],['STK = win streak','#C9A84C']].map(function(item) {
              return <span key={item[0]} style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: item[1] }}>{item[0]}</span>;
            })}
          </div>

        </div>
      )}

      {/* ===== SCHEDULE VIEW ===== */}
      {view === 'SCHEDULE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#C9A84C', letterSpacing: 3, paddingLeft: 2 }}>📅 UPCOMING MATCHUPS</div>

          {SCHEDULE.map(function(match, idx) {
            var homeEmoji = getEmojiForAbbr(match.home, rankings);
            var awayEmoji = getEmojiForAbbr(match.away, rankings);
            return (
              <div
                key={idx}
                style={{ background: 'rgba(26,21,16,.85)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {/* Teams */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 22 }}>{homeEmoji}</span>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: '#F0E8D4' }}>{match.home}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>HOME</div>
                    </div>
                  </div>

                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#C9A84C', letterSpacing: 2 }}>VS</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'row-reverse' }}>
                    <span style={{ fontSize: 22 }}>{awayEmoji}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: '#F0E8D4' }}>{match.away}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>AWAY</div>
                    </div>
                  </div>
                </div>

                {/* Date / time / venue */}
                <div style={{ borderTop: '1px solid #3D3020', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C', fontWeight: 700 }}>{match.date} · {match.time}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', marginTop: 2 }}>{match.venue}</div>
                  </div>
                  <button
                    onClick={function() { if (addToast) { addToast('Reminder set for ' + match.home + ' vs ' + match.away + ' · ' + match.date, 'success'); } }}
                    style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 6, padding: '5px 10px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 1, cursor: 'pointer', flexShrink: 0 }}
                  >
                    🔔 SET REMINDER
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== STATS VIEW ===== */}
      {view === 'STATS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#C9A84C', letterSpacing: 3, paddingLeft: 2 }}>📊 SEASON STATS</div>

          {/* Summary grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

            <div style={{ background: 'rgba(26,21,16,.85)', border: '1px solid #3D3020', borderRadius: 9, padding: '10px 12px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginBottom: 3 }}>TOTAL STATES</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#C9A84C', lineHeight: 1 }}>8</div>
            </div>

            <div style={{ background: 'rgba(26,21,16,.85)', border: '1px solid #3D3020', borderRadius: 9, padding: '10px 12px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginBottom: 3 }}>MATCHES PLAYED</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#F0E8D4', lineHeight: 1 }}>{totalMatches}</div>
            </div>

            <div style={{ background: 'rgba(26,21,16,.85)', border: '1px solid #3D3020', borderRadius: 9, padding: '10px 12px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginBottom: 3 }}>AVG POINTS</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#C9A84C', lineHeight: 1 }}>{avgPoints}</div>
            </div>

            <div style={{ background: 'rgba(26,21,16,.85)', border: '1px solid #3D3020', borderRadius: 9, padding: '10px 12px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginBottom: 3 }}>POINTS LEADER</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A84C', lineHeight: 1.1, marginTop: 2 }}>{pointsLeader}</div>
            </div>

          </div>

          {/* Mini bar chart */}
          <div style={{ background: 'rgba(26,21,16,.85)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginBottom: 12, letterSpacing: 1 }}>POINTS BY STATE</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
              {rankings.map(function(r) {
                var barHeight = Math.floor((r.points / maxPts) * 72);
                var barColor  = REGION_COLORS[r.region] || '#8A7A62';
                return (
                  <div key={r.state_abbr} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', height: barHeight, background: barColor + 'CC', borderRadius: '3px 3px 0 0', minHeight: 4 }}></div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: barColor, fontWeight: 700, textAlign: 'center' }}>{r.state_abbr}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#8A7A62', textAlign: 'center' }}>{r.points}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Region color legend */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 2px' }}>
            {Object.keys(REGION_COLORS).map(function(reg) {
              return (
                <div key={reg} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: REGION_COLORS[reg] }}></div>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{reg}</span>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
