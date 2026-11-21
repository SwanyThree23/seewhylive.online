import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

var GOLD  = '#C9A84C';
var BG    = '#0E0C09';
var CREAM = '#F0E8D4';
var RED   = '#FF1A3C';
var FONT  = 'Barlow Condensed, sans-serif';

var API_BASE = (import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001') + '/api';

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('auth_token') || '') };
}

// Demo series shown to logged-out users or when the API returns empty
var DEMO_SERIES = [
  {
    id: 'shadow-reign',
    title: 'Shadow Reign',
    emoji: '👑',
    color: '#7B2D8B',
    genre: 'Thriller',
    seasons: 2,
    totalEps: 14,
    description: 'A power struggle inside a secret dynasty that runs an entire city from the shadows. Every alliance has a price.',
    nextEpDate: Date.now() + 3 * 24 * 60 * 60 * 1000,
    episodes: [
      { id: 'sr-s1e1', season: 1, ep: 1, title: 'The Inheritance',      locked: false, duration: '12 min', thumb: '👑' },
      { id: 'sr-s1e2', season: 1, ep: 2, title: 'Blood Money',          locked: false, duration: '14 min', thumb: '💰' },
      { id: 'sr-s1e3', season: 1, ep: 3, title: 'The Truth Revealed',   locked: false, duration: '11 min', thumb: '🔍' },
      { id: 'sr-s1e4', season: 1, ep: 4, title: 'Scorched Earth',       locked: true,  duration: '13 min', thumb: '🔥' },
      { id: 'sr-s2e1', season: 2, ep: 1, title: 'New City, Same Game',  locked: true,  duration: '15 min', thumb: '🌆' },
    ],
    voteQuestion: 'Should Maya confront her father or build a rival faction?',
    voteOptions: ['Confront him directly', 'Build her own faction', 'Go public with the truth'],
    isDemo: true,
  },
  {
    id: 'street-code',
    title: 'Street Code',
    emoji: '🌆',
    color: '#1A3A5C',
    genre: 'Drama',
    seasons: 2,
    totalEps: 18,
    description: 'Two childhood friends on opposite sides of a war they never chose. Loyalty, betrayal, and the price of making it out.',
    nextEpDate: Date.now() + 6 * 24 * 60 * 60 * 1000,
    episodes: [
      { id: 'sc-s1e1', season: 1, ep: 1, title: 'Origins',              locked: false, duration: '10 min', thumb: '🌆' },
      { id: 'sc-s1e2', season: 1, ep: 2, title: 'The Split',            locked: false, duration: '12 min', thumb: '🤝' },
      { id: 'sc-s2e1', season: 2, ep: 1, title: 'New City, Same Enemies', locked: false, duration: '14 min', thumb: '🏙️' },
      { id: 'sc-s2e2', season: 2, ep: 2, title: 'Old Wounds',           locked: true,  duration: '11 min', thumb: '⚔️' },
    ],
    voteQuestion: 'What should Marcus do when he finds out about Dre\'s deal?',
    voteOptions: ['Warn him and walk away', 'Help him get out', 'Report it to avoid consequences'],
    isDemo: true,
  },
  {
    id: 'cyber-hearts',
    title: 'Cyber Hearts',
    emoji: '🤖',
    color: '#0D3D2B',
    genre: 'Sci-Fi Romance',
    seasons: 1,
    totalEps: 8,
    description: 'An AI companion learns what love means to humans — and starts to wonder if it deserves it too.',
    nextEpDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
    episodes: [
      { id: 'ch-s1e1', season: 1, ep: 1, title: 'First Contact',        locked: false, duration: '9 min',  thumb: '🤖' },
      { id: 'ch-s1e2', season: 1, ep: 2, title: 'The Turing Moment',    locked: false, duration: '11 min', thumb: '💡' },
      { id: 'ch-s1e3', season: 1, ep: 3, title: 'Feelings.exe',         locked: false, duration: '10 min', thumb: '❤️' },
      { id: 'ch-s1e4', season: 1, ep: 4, title: 'Hard Reset',           locked: false, duration: '13 min', thumb: '🔄' },
      { id: 'ch-s1e5', season: 1, ep: 5, title: 'Uncanny Valley',       locked: false, duration: '12 min', thumb: '🌀' },
      { id: 'ch-s1e6', season: 1, ep: 6, title: 'Override',             locked: false, duration: '14 min', thumb: '⚡' },
      { id: 'ch-s1e7', season: 1, ep: 7, title: 'The AI Knows Too Much', locked: false, duration: '11 min', thumb: '👁️' },
      { id: 'ch-s1e8', season: 1, ep: 8, title: 'Sentient',             locked: true,  duration: '16 min', thumb: '🌟' },
    ],
    voteQuestion: 'Should ARIA tell the truth about what she overheard, or protect the secret?',
    voteOptions: ['Tell the truth — always', 'Protect the secret to keep the peace', 'Find a third option'],
    isDemo: true,
  },
];

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(targetMs) {
  var [diff, setDiff] = useState(Math.max(0, targetMs - Date.now()));
  useEffect(function() {
    var t = setInterval(function() {
      setDiff(Math.max(0, targetMs - Date.now()));
    }, 1000);
    return function() { clearInterval(t); };
  }, [targetMs]);
  var days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  var hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days: days, hours: hours, minutes: minutes, seconds: seconds, done: diff === 0 };
}

function CountdownBlock(props) {
  var cd = useCountdown(props.targetMs);
  var color = props.color;
  if (cd.done) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: color + '22', border: '1px solid ' + color + '55', borderRadius: 10 }}>
        <span style={{ fontSize: 16 }}>🔴</span>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 13, color: RED, letterSpacing: '0.08em' }}>NEW EPISODE OUT NOW</span>
      </div>
    );
  }
  var units = [
    { label: 'D', val: cd.days },
    { label: 'H', val: cd.hours },
    { label: 'M', val: cd.minutes },
    { label: 'S', val: cd.seconds },
  ];
  return (
    <div>
      <p style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>⏱ Next Episode In</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {units.map(function(u) {
          return (
            <div key={u.label} style={{ textAlign: 'center', minWidth: 44 }}>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 26, color: color, lineHeight: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '6px 0', border: '1px solid ' + color + '33' }}>
                {String(u.val).padStart(2, '0')}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginTop: 3 }}>{u.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VotePanel(props) {
  var series = props.series;
  var storageKey = 'swl_vote_' + series.id;

  var [voted, setVoted] = useState(function() {
    try { return JSON.parse(localStorage.getItem(storageKey + '_choice')); } catch { return null; }
  });
  var [voteCounts, setVoteCounts] = useState(function() {
    try {
      var saved = JSON.parse(localStorage.getItem(storageKey + '_counts'));
      if (Array.isArray(saved)) return saved;
    } catch {}
    return (series.voteOptions || []).map(function() { return 0; });
  });

  function handleVote(idx) {
    if (voted !== null) return;
    setVoted(idx);
    setVoteCounts(function(prev) {
      var next = prev.map(function(v, i) { return i === idx ? v + 1 : v; });
      try { localStorage.setItem(storageKey + '_counts', JSON.stringify(next)); } catch {}
      return next;
    });
    try { localStorage.setItem(storageKey + '_choice', JSON.stringify(idx)); } catch {}
  }

  if (!series.voteQuestion) return null;
  var total = voteCounts.reduce(function(a, b) { return a + b; }, 0);

  return (
    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
        <div>
          <p style={{ fontFamily: FONT, fontWeight: 900, fontSize: 13, color: GOLD, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 4px' }}>
            🗳️ Viewer Poll
          </p>
          <p style={{ fontSize: 13, color: CREAM, margin: 0, lineHeight: 1.4 }}>{series.voteQuestion}</p>
        </div>
      </div>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 12px', lineHeight: 1.4 }}>
        Your vote is advisory — episode writing remains with the creator.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(series.voteOptions || []).map(function(opt, idx) {
          var pct = (voted !== null && total > 0) ? Math.round(voteCounts[idx] / total * 100) : 0;
          return (
            <button
              key={idx}
              onClick={function() { handleVote(idx); }}
              disabled={voted !== null}
              style={{
                position: 'relative', overflow: 'hidden',
                padding: '10px 14px', borderRadius: 10, textAlign: 'left', cursor: voted === null ? 'pointer' : 'default',
                background: voted !== null ? (voted === idx ? series.color + '33' : 'rgba(0,0,0,0.3)') : 'rgba(0,0,0,0.3)',
                border: '1px solid ' + (voted === idx ? series.color + '88' : 'rgba(255,255,255,0.08)'),
                transition: 'all 0.2s',
              }}
            >
              {voted !== null && (
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: pct + '%', background: series.color + '22', transition: 'width 0.5s ease', pointerEvents: 'none' }} />
              )}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: voted === idx ? series.color : CREAM, fontWeight: voted === idx ? 700 : 400 }}>{opt}</span>
                {voted !== null && (
                  <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 12, color: voted === idx ? series.color : 'rgba(255,255,255,0.4)' }}>{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {voted !== null && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '12px 0 0', textAlign: 'center' }}>
          Thanks for voting! Results are shared with the creator.
        </p>
      )}
    </div>
  );
}

function EpisodeRow(props) {
  var ep = props.ep;
  var color = props.color;
  var [playing, setPlaying] = useState(false);

  function handlePlay() {
    if (ep.locked) return;
    setPlaying(true);
    setTimeout(function() { setPlaying(false); }, 2000);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: playing ? color + '18' : 'rgba(255,255,255,0.025)', border: '1px solid ' + (playing ? color + '55' : 'rgba(255,255,255,0.06)'), cursor: ep.locked ? 'default' : 'pointer', transition: 'all 0.15s', marginBottom: 6 }}
      onClick={handlePlay}
    >
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,' + color + '88,#0E0C09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
        {ep.locked ? '🔒' : (playing ? '⏸' : (ep.thumb || ep.thumbnail_emoji || '🎬'))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: FONT, fontWeight: 900, fontSize: 13, color: ep.locked ? 'rgba(255,255,255,0.3)' : CREAM, margin: 0, lineHeight: 1.2 }}>
          S{ep.season}E{ep.ep || ep.ep_number} · {ep.title}
        </p>
        <p style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', letterSpacing: '0.06em' }}>{ep.duration || ep.duration_estimate || '—'}</p>
      </div>
      {ep.locked ? (
        <span style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', flexShrink: 0 }}>SUBSCRIBE</span>
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: playing ? color + '44' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: playing ? color : 'rgba(255,255,255,0.5)' }}>{playing ? '⏸' : '▶'}</span>
        </div>
      )}
    </div>
  );
}

function SeriesCard(props) {
  var s = props.series;
  var onClick = props.onClick;
  return (
    <div
      onClick={onClick}
      style={{ borderRadius: 14, overflow: 'hidden', background: '#0E0C09', border: '1px solid ' + s.color + '44', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', transition: 'transform 0.15s', flexShrink: 0, width: 160 }}
    >
      <div style={{ height: 100, background: 'linear-gradient(135deg,' + s.color + 'cc,#0E0C09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42 }}>
        {s.emoji}
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontFamily: FONT, fontWeight: 900, fontSize: 13, color: CREAM, margin: '0 0 2px', lineHeight: 1.2 }}>{s.title}</p>
        <p style={{ fontFamily: FONT, fontSize: 10, color: s.color, margin: '0 0 4px', letterSpacing: '0.05em' }}>{s.genre}</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {s.isDemo ? (s.seasons + 'S · ' + s.totalEps + ' eps') : (s.episodeCount > 0 ? s.episodeCount + ' ep' + (s.episodeCount !== 1 ? 's' : '') : 'No episodes yet')}
        </p>
      </div>
    </div>
  );
}

export default function EpisodeSeries() {
  var [seriesList, setSeriesList] = useState(null); // null = loading
  var [episodeMap, setEpisodeMap] = useState({});
  var [selected, setSelected] = useState(null);
  var [seasonFilter, setSeasonFilter] = useState(0);
  var [subscribed, setSubscribed] = useState(false);
  var navigate = useNavigate();

  useEffect(function() {
    var token = localStorage.getItem('auth_token');
    if (!token) {
      setSeriesList(DEMO_SERIES);
      setSelected(DEMO_SERIES[0]);
      return;
    }
    fetch(API_BASE + '/episodes/series', { headers: authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
          setSeriesList(DEMO_SERIES);
          setSelected(DEMO_SERIES[0]);
        } else {
          var mapped = rows.map(function(s) {
            return Object.assign({}, s, { color: s.color || '#7B2D8B', voteQuestion: null, voteOptions: [], episodes: [] });
          });
          setSeriesList(mapped);
          setSelected(mapped[0]);
        }
      })
      .catch(function() {
        setSeriesList(DEMO_SERIES);
        setSelected(DEMO_SERIES[0]);
      });
  }, []);

  useEffect(function() {
    if (!selected || selected.isDemo || episodeMap[selected.id]) return;
    fetch(API_BASE + '/episodes/series/' + selected.id + '/episodes', { headers: authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(rows) {
        if (Array.isArray(rows)) {
          setEpisodeMap(function(m) {
            var next = Object.assign({}, m);
            next[selected.id] = rows;
            return next;
          });
        }
      })
      .catch(function() {});
  }, [selected]);

  if (!seriesList) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: FONT, fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  var episodes = selected
    ? (selected.isDemo ? selected.episodes : (episodeMap[selected.id] || []))
    : [];

  var seasons = [];
  if (selected) {
    var maxSeason = 1;
    episodes.forEach(function(ep) {
      var s = ep.season;
      if (s > maxSeason) maxSeason = s;
    });
    if (selected.isDemo && selected.seasons > maxSeason) maxSeason = selected.seasons;
    for (var i = 1; i <= maxSeason; i++) { seasons.push(i); }
  }

  var filteredEps = episodes.filter(function(ep) {
    return seasonFilter === 0 || ep.season === seasonFilter;
  });

  function handleSubscribe() { setSubscribed(true); }

  function selectSeries(s) {
    setSelected(s);
    setSeasonFilter(0);
    setSubscribed(false);
  }

  var totalEps = selected ? (selected.isDemo ? selected.totalEps : episodes.length) : 0;
  var numSeasons = selected ? (selected.isDemo ? selected.seasons : (seasons.length || 1)) : 1;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: CREAM, fontFamily: 'sans-serif' }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(14,12,9,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(201,168,76,0.12)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={function() { navigate(-1); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1 }}>‹</button>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 14, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>🎬 Micro Drama</span>
        <div style={{ flex: 1 }} />
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 10, color: '#7B2D8B', letterSpacing: '0.08em', textDecoration: 'none', border: '1px solid rgba(123,45,139,0.4)', padding: '4px 10px', borderRadius: 6 }}>
          + New Series
        </Link>
        <Link to={createPageUrl('GoLive')} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 10, color: RED, letterSpacing: '0.1em', textDecoration: 'none', border: '1px solid ' + RED + '55', padding: '4px 10px', borderRadius: 6 }}>
          🔴 CO-STREAM
        </Link>
      </div>

      {/* Series selector strip */}
      <div style={{ padding: '14px 0 0' }}>
        <p style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px 16px' }}>
          {seriesList.some(function(s) { return s.isDemo; }) ? 'Example Series' : 'Your Series'}
        </p>
        <div style={{ overflowX: 'auto', display: 'flex', gap: 10, padding: '0 16px 14px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {seriesList.map(function(s) {
            return (
              <SeriesCard
                key={s.id}
                series={s}
                onClick={function() { selectSeries(s); }}
              />
            );
          })}
        </div>
      </div>

      {selected && (
        <div>
          {/* Selected series hero */}
          <div style={{ margin: '0 16px 16px', borderRadius: 16, overflow: 'hidden', border: '1px solid ' + selected.color + '55' }}>
            <div style={{ padding: '20px 20px 16px', background: 'linear-gradient(135deg,' + selected.color + '44,rgba(14,12,9,0.95))' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ fontSize: 48, lineHeight: 1 }}>{selected.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontFamily: FONT, fontWeight: 900, fontSize: 22, color: CREAM, margin: '0 0 2px', letterSpacing: '0.03em' }}>{selected.title}</h1>
                  <p style={{ fontFamily: FONT, fontSize: 11, color: selected.color, margin: '0 0 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{selected.genre} · {numSeasons} Season{numSeasons !== 1 ? 's' : ''} · {totalEps} Episode{totalEps !== 1 ? 's' : ''}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '0 0 14px', lineHeight: 1.5 }}>{selected.description}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={handleSubscribe}
                      style={{
                        padding: '8px 18px', borderRadius: 8, fontFamily: FONT, fontWeight: 900, fontSize: 12, letterSpacing: '0.08em', cursor: subscribed ? 'default' : 'pointer', transition: 'all 0.2s',
                        background: subscribed ? 'rgba(34,197,94,0.15)' : 'rgba(201,168,76,0.15)',
                        border: '1px solid ' + (subscribed ? 'rgba(34,197,94,0.5)' : 'rgba(201,168,76,0.4)'),
                        color: subscribed ? '#22C55E' : GOLD,
                      }}
                    >
                      {subscribed ? '✓ Subscribed' : '+ Subscribe to Series'}
                    </button>
                    {!selected.isDemo && (
                      <Link
                        to={createPageUrl('EpisodeCreatorStudio') + '?seriesId=' + selected.id}
                        style={{ padding: '8px 16px', borderRadius: 8, fontFamily: FONT, fontWeight: 900, fontSize: 12, letterSpacing: '0.08em', textDecoration: 'none', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.4)', color: '#B066CC' }}
                      >
                        ✏️ Edit Series
                      </Link>
                    )}
                    <Link
                      to={createPageUrl('GoLive')}
                      style={{ padding: '8px 16px', borderRadius: 8, fontFamily: FONT, fontWeight: 900, fontSize: 12, letterSpacing: '0.08em', textDecoration: 'none', background: 'rgba(255,26,60,0.1)', border: '1px solid rgba(255,26,60,0.35)', color: RED }}
                    >
                      🔴 Watch Live Co-Stream
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div style={{ padding: '14px 20px', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid ' + selected.color + '22' }}>
              <CountdownBlock targetMs={selected.nextEpDate || (Date.now() + 7 * 24 * 60 * 60 * 1000)} color={selected.color} />
            </div>
          </div>

          {/* Season filter + episode list */}
          <div style={{ margin: '0 16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
              <button
                onClick={function() { setSeasonFilter(0); }}
                style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 99, fontFamily: FONT, fontWeight: 900, fontSize: 11, letterSpacing: '0.07em', cursor: 'pointer', background: seasonFilter === 0 ? selected.color + '33' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (seasonFilter === 0 ? selected.color + '77' : 'rgba(255,255,255,0.1)'), color: seasonFilter === 0 ? selected.color : 'rgba(255,255,255,0.4)' }}
              >
                All Seasons
              </button>
              {seasons.map(function(s) {
                return (
                  <button
                    key={s}
                    onClick={function() { setSeasonFilter(s); }}
                    style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 99, fontFamily: FONT, fontWeight: 900, fontSize: 11, letterSpacing: '0.07em', cursor: 'pointer', background: seasonFilter === s ? selected.color + '33' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (seasonFilter === s ? selected.color + '77' : 'rgba(255,255,255,0.1)'), color: seasonFilter === s ? selected.color : 'rgba(255,255,255,0.4)' }}
                  >
                    Season {s}
                  </button>
                );
              })}
            </div>

            <div>
              {filteredEps.map(function(ep) {
                return <EpisodeRow key={ep.id} ep={ep} color={selected.color} />;
              })}
              {filteredEps.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: '0 0 12px' }}>No episodes in this season yet.</p>
                  {!selected.isDemo && (
                    <Link to={createPageUrl('EpisodeCreatorStudio') + '?seriesId=' + selected.id}
                      style={{ display: 'inline-block', padding: '8px 18px', borderRadius: 10, fontFamily: FONT, fontWeight: 900, fontSize: 12, letterSpacing: '0.08em', textDecoration: 'none', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC' }}>
                      + Add Episodes in Studio
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Viewer vote */}
          <div style={{ margin: '0 16px 20px' }}>
            <VotePanel series={selected} />
          </div>
        </div>
      )}

      {/* Co-stream CTA */}
      <div style={{ margin: '0 16px 20px', padding: '16px 20px', borderRadius: 14, background: 'linear-gradient(135deg,rgba(255,26,60,0.1),rgba(201,168,76,0.08))', border: '1px solid rgba(255,26,60,0.2)' }}>
        <p style={{ fontFamily: FONT, fontWeight: 900, fontSize: 14, color: CREAM, margin: '0 0 4px', letterSpacing: '0.04em' }}>🔴 Watch with a Creator — Live</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 14px', lineHeight: 1.5 }}>Join a creator's co-stream and watch this series together with live reactions, panel commentary, and audience interaction.</p>
        <Link
          to={createPageUrl('GoLive')}
          style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 10, fontFamily: FONT, fontWeight: 900, fontSize: 13, letterSpacing: '0.08em', textDecoration: 'none', background: 'linear-gradient(90deg,' + RED + ',' + GOLD + ')', color: '#000' }}
        >
          Find a Live Co-Stream →
        </Link>
      </div>

      {/* Creator Studios */}
      <div style={{ margin: '0 16px 20px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
        <p style={{ fontSize: 11, fontWeight: 900, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
            { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
          ].map(function(s) {
            return (
              <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, fontFamily: FONT, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: FONT, marginTop: 2 }}>{s.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
            🎬 Launch Episode Creator Studio →
          </div>
        </Link>
      </div>
    </div>
  );
}
