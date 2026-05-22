import React, { useState } from 'react';

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
  West:      '#5A8FFF',
  Southwest: '#FF6B35',
  Southeast: '#C084FC',
  Northeast: '#00DEC0',
  Midwest:   '#C9A84C',
};

var MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };
var REGIONS = ['All', 'West', 'Southwest', 'Southeast', 'Northeast', 'Midwest'];

export default function StateRankingsTab() {
  var [region,   setRegion]   = useState('All');
  var [expanded, setExpanded] = useState(null);

  var visible = RANKINGS.filter(function(r) {
    return region === 'All' || r.region === region;
  });

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.12),rgba(128,0,32,.1))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A84C', letterSpacing: 3 }}>🏅 STATE RANKINGS</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginTop: 2 }}>Season {SEASON} · Week {WEEK} · National Domino Federation</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#C9A84C', lineHeight: 1 }}>{RANKINGS.length}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>STATES RANKED</div>
          </div>
        </div>

        {/* Top-3 podium */}
        <div style={{ display: 'flex', gap: 6 }}>
          {RANKINGS.slice(0, 3).map(function(r) {
            return (
              <div key={r.rank} style={{ flex: 1, background: 'rgba(201,168,76,.07)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 20 }}>{r.state_emoji}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#EDE8F5', marginTop: 2 }}>{r.state_abbr}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C' }}>{r.points} pts</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>{MEDALS[r.rank]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Region filter */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
        {REGIONS.map(function(reg) {
          var active = region === reg;
          var color  = reg === 'All' ? '#C9A84C' : (REGION_COLORS[reg] || '#7A6F90');
          return (
            <button key={reg} onClick={function() { setRegion(reg); }}
              style={{ background: active ? color + '22' : 'rgba(22,16,32,.7)', border: '1px solid ' + (active ? color + '66' : '#241C34'), borderRadius: 999, padding: '3px 10px', color: active ? color : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0, letterSpacing: 1 }}>
              {reg.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 36px 1fr 48px 44px 36px 32px', gap: 4, padding: '0 8px' }}>
        {['#', 'CHG', 'STATE', 'PTS', 'W-L', 'TILES', 'STK'].map(function(h, i) {
          return (
            <div key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', textAlign: i >= 3 ? 'center' : 'left' }}>{h}</div>
          );
        })}
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.map(function(r) {
          var rc    = REGION_COLORS[r.region] || '#7A6F90';
          var wins  = WEEK - r.losses;
          var isTop = r.rank <= 3;
          var isExp = expanded === r.rank;

          return (
            <div key={r.rank}>
              <div
                onClick={function() { setExpanded(isExp ? null : r.rank); }}
                style={{ display: 'grid', gridTemplateColumns: '28px 36px 1fr 48px 44px 36px 32px', gap: 4, alignItems: 'center', background: isTop ? 'rgba(201,168,76,.07)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (isTop ? 'rgba(201,168,76,.25)' : '#241C34'), borderRadius: isExp ? '8px 8px 0 0' : 8, padding: '8px', cursor: 'pointer' }}>

                {/* Rank */}
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: isTop ? 16 : 13, color: isTop ? '#C9A84C' : '#7A6F90', textAlign: 'center', lineHeight: 1 }}>
                  {MEDALS[r.rank] || r.rank}
                </div>

                {/* Change */}
                <div style={{ textAlign: 'center' }}>
                  {r.change > 0 && <span style={{ color: '#00C96A', fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 700 }}>▲{r.change}</span>}
                  {r.change < 0 && <span style={{ color: '#FF1A3C', fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 700 }}>▼{Math.abs(r.change)}</span>}
                  {r.change === 0 && <span style={{ color: '#7A6F90', fontFamily: "'DM Mono',monospace", fontSize: 9 }}>—</span>}
                </div>

                {/* State */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{r.state_emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#EDE8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.state_name}</div>
                    <div style={{ background: rc + '18', border: '1px solid ' + rc + '33', borderRadius: 999, display: 'inline-block', padding: '0 5px', fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: rc }}>{r.region}</div>
                  </div>
                </div>

                {/* Points */}
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: isTop ? '#C9A84C' : '#EDE8F5', textAlign: 'center' }}>{r.points}</div>

                {/* W-L */}
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textAlign: 'center' }}>
                  <span style={{ color: '#00C96A' }}>{wins}</span>
                  <span style={{ color: '#7A6F90' }}>-</span>
                  <span style={{ color: r.losses > 0 ? '#FF6B81' : '#7A6F90' }}>{r.losses}</span>
                </div>

                {/* Tiles diff */}
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: r.tiles_diff > 0 ? '#00C96A' : r.tiles_diff < 0 ? '#FF1A3C' : '#7A6F90', textAlign: 'center', fontWeight: 700 }}>
                  {r.tiles_diff > 0 ? '+' : ''}{r.tiles_diff}
                </div>

                {/* Streak */}
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: r.streak > 0 ? '#C8FF00' : '#7A6F90', textAlign: 'center', fontWeight: r.streak > 0 ? 700 : 400 }}>
                  {r.streak > 0 ? 'W' + r.streak : '—'}
                </div>
              </div>

              {/* Expanded detail */}
              {isExp && (
                <div style={{ background: 'rgba(7,5,10,.95)', border: '1px solid rgba(201,168,76,.2)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '10px 14px', display: 'flex', gap: 20 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', marginBottom: 2 }}>PREV RANK</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#EDE8F5' }}>#{r.rank_prev}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', marginBottom: 2 }}>WIN RATE</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#00C9A7' }}>{Math.floor(wins / WEEK * 100)}%</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', marginBottom: 2 }}>SEASON</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#EDE8F5' }}>{SEASON}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', marginBottom: 2 }}>WEEK</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#EDE8F5' }}>{WEEK}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '4px 2px', borderTop: '1px solid #241C34', paddingTop: 8 }}>
        {[['▲ moved up','#00C96A'],['▼ moved down','#FF1A3C'],['— no change','#7A6F90'],['TILES = tile differential','#C9A84C'],['STK = win streak','#C8FF00']].map(function(item) {
          return <span key={item[0]} style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: item[1] }}>{item[0]}</span>;
        })}
      </div>

    </div>
  );
}
