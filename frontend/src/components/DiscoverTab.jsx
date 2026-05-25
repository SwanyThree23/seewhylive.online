'use strict';
import React, { useState, useEffect, useRef } from 'react';
import SignalBars from './SignalBars';

var MOCK_STREAMS = [
  { id: 's1', title: 'Washington Classic Round 2', hostName: 'SwanyThree', viewerCount: 2847, genre: 'Tournament', isLive: true, durationMins: 94, tier: 'free' },
  { id: 's2', title: 'Friday Night Dominos', hostName: 'CaliBonesOG', viewerCount: 1203, genre: 'Domino', isLive: true, durationMins: 47, tier: 'fan' },
  { id: 's3', title: 'Beat Production 101', hostName: 'BeatKing_X', viewerCount: 891, genre: 'Music', isLive: true, durationMins: 120, tier: 'free' },
  { id: 's4', title: 'AIverse Podcast Ep. 48', hostName: 'VibeNBones', viewerCount: 412, genre: 'Podcast', isLive: false, durationMins: 0, tier: 'free' },
  { id: 's5', title: 'Lifestyle Talk', hostName: 'LyricQueen', viewerCount: 288, genre: 'Lifestyle', isLive: true, durationMins: 33, tier: 'supporter' },
  { id: 's6', title: 'Tech Deep Dive', hostName: 'NeonBeats', viewerCount: 155, genre: 'Tech', isLive: false, durationMins: 0, tier: 'free' },
  { id: 's7', title: 'Community Conversation', hostName: 'DJ_Phantom', viewerCount: 3102, genre: 'Talk', isLive: true, durationMins: 210, tier: 'free' },
  { id: 's8', title: 'Vocal Session LIVE', hostName: 'VibeStar', viewerCount: 94, genre: 'Music', isLive: true, durationMins: 12, tier: 'free' },
];

var MOCK_CREATORS = [
  { id: 'c1', username: 'SwanyThree', displayName: 'SwanyThree 🎲', bio: 'Domino culture creator. Washington Classic host.', followerCount: 12840, isLive: true, tier: 'pro' },
  { id: 'c2', username: 'CaliBonesOG', displayName: 'CaliBonesOG', bio: 'West coast domino legend.', followerCount: 8920, isLive: true, tier: 'creator' },
  { id: 'c3', username: 'BeatKing_X', displayName: 'BeatKing_X 🎵', bio: 'Producer. Streamer. Culture.', followerCount: 5440, isLive: false, tier: 'pro' },
  { id: 'c4', username: 'VibeNBones', displayName: "VibeN'Bones", bio: 'Culture conversations, music, and more.', followerCount: 3210, isLive: false, tier: 'creator' },
];

var GENRE_COLORS = {
  Tournament: '#FF1564',
  Domino: '#C9A84C',
  Music: '#00C9A7',
  Podcast: '#8B5CF6',
  Lifestyle: '#00F5FF',
  Tech: '#00C9A7',
  Talk: '#FF8C00',
};

function formatFollowers(n) {
  if (n >= 1000) {
    return Math.floor(n / 1000) + 'K';
  }
  return '' + n;
}

export default function DiscoverTab(props) {
  var addToast = props.addToast;

  var queryState = useState('');
  var query = queryState[0];
  var setQuery = queryState[1];

  var streamsState = useState(MOCK_STREAMS);
  var streams = streamsState[0];
  var setStreams = streamsState[1];

  var creatorsState = useState(MOCK_CREATORS);
  var creators = creatorsState[0];
  var setCreators = creatorsState[1];

  var viewState = useState('streams');
  var view = viewState[0];
  var setView = viewState[1];

  var loadingState = useState(false);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var totalLiveState = useState(0);
  var totalLive = totalLiveState[0];
  var setTotalLive = totalLiveState[1];

  var debounceRef = useRef(null);

  useEffect(function() {
    fetch('/api/streams/count')
      .then(function(r) { return r.json(); })
      .then(function(d) { setTotalLive(d.count || 0); })
      .catch(function() {});
  }, []);

  function handleQueryChange(e) {
    var val = e.target.value;
    setQuery(val);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(function() {
      if (!val.trim()) {
        setStreams(MOCK_STREAMS);
        setCreators(MOCK_CREATORS);
        return;
      }
      setLoading(true);
      var streamsUrl = '/api/search?q=' + encodeURIComponent(val) + '&type=streams';
      var creatorsUrl = '/api/search?q=' + encodeURIComponent(val) + '&type=creators';
      Promise.all([
        fetch(streamsUrl).then(function(r) { return r.json(); }).catch(function() { return { results: [] }; }),
        fetch(creatorsUrl).then(function(r) { return r.json(); }).catch(function() { return { results: [] }; }),
      ]).then(function(results) {
        setStreams(results[0].results || MOCK_STREAMS);
        setCreators(results[1].results || MOCK_CREATORS);
        setLoading(false);
      });
    }, 300);
  }

  function renderLiveBadge(isLive) {
    if (isLive) {
      return React.createElement(
        'span',
        {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(255,21,100,.15)',
            border: '1px solid rgba(255,21,100,.4)',
            borderRadius: 4,
            padding: '1px 6px',
            fontFamily: "'DM Mono',monospace",
            fontSize: 9,
            color: '#FF1564',
            letterSpacing: 1,
          }
        },
        React.createElement('span', {
          style: {
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#FF1564',
            display: 'inline-block',
            animation: 'pulse 1.2s ease-in-out infinite',
          }
        }),
        'LIVE'
      );
    }
    return React.createElement(
      'span',
      {
        style: {
          background: 'rgba(122,111,144,.12)',
          border: '1px solid rgba(122,111,144,.3)',
          borderRadius: 4,
          padding: '1px 6px',
          fontFamily: "'DM Mono',monospace",
          fontSize: 9,
          color: '#7A6F90',
          letterSpacing: 1,
        }
      },
      'ENDED'
    );
  }

  function renderStreamCard(stream) {
    var genreColor = GENRE_COLORS[stream.genre] || '#7A6F90';
    var isTrending = stream.viewerCount >= 2000;
    return React.createElement(
      'div',
      {
        key: stream.id,
        style: {
          background: 'rgba(7,5,10,.95)',
          border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 8,
          cursor: 'pointer',
        },
        onClick: function() { addToast('Joining ' + stream.title + '...', 'info'); }
      },
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 } },
        renderLiveBadge(stream.isLive),
        isTrending
          ? React.createElement(
              'span',
              {
                style: {
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 9,
                  color: '#C9A84C',
                  letterSpacing: 1,
                }
              },
              '🔥 TRENDING'
            )
          : null
      ),
      React.createElement(
        'div',
        {
          style: {
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: '#EDE8F5',
            marginBottom: 2,
          }
        },
        stream.title
      ),
      React.createElement(
        'div',
        {
          style: {
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 11,
            color: '#7A6F90',
            marginBottom: 6,
          }
        },
        stream.hostName
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
        React.createElement(
          'span',
          { style: { display: 'inline-flex', alignItems: 'center', gap: 4 } },
          React.createElement(SignalBars, { isActive: stream.isLive, count: 5, color: stream.isLive ? '#FF1564' : '#7A6F90' }),
          React.createElement(
            'span',
            {
              style: {
                fontFamily: "'DM Mono',monospace",
                fontSize: 10,
                color: '#7A6F90',
                marginLeft: 4,
              }
            },
            stream.viewerCount.toLocaleString()
          )
        ),
        React.createElement(
          'span',
          {
            style: {
              background: 'rgba(0,0,0,.3)',
              border: '1px solid ' + genreColor,
              borderRadius: 4,
              padding: '1px 6px',
              fontFamily: "'DM Mono',monospace",
              fontSize: 9,
              color: genreColor,
              letterSpacing: 1,
            }
          },
          stream.genre
        ),
        React.createElement(
          'span',
          {
            style: {
              fontFamily: "'DM Mono',monospace",
              fontSize: 9,
              color: '#7A6F90',
            }
          },
          stream.isLive ? (stream.durationMins + 'm') : 'ENDED'
        ),
        React.createElement(
          'span',
          {
            style: {
              background: 'rgba(201,168,76,.1)',
              border: '1px solid rgba(201,168,76,.25)',
              borderRadius: 4,
              padding: '1px 6px',
              fontFamily: "'DM Mono',monospace",
              fontSize: 9,
              color: '#C9A84C',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }
          },
          stream.tier
        )
      )
    );
  }

  function renderCreatorCard(creator) {
    var firstLetter = creator.displayName.charAt(0);
    var bioCut = creator.bio.length > 60 ? creator.bio.slice(0, 60) + '...' : creator.bio;
    return React.createElement(
      'div',
      {
        key: creator.id,
        style: {
          background: 'rgba(7,5,10,.95)',
          border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }
      },
      React.createElement(
        'div',
        {
          style: {
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(201,168,76,.2)',
            border: '2px solid #C9A84C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 20,
            color: '#C9A84C',
            flexShrink: 0,
          }
        },
        firstLetter
      ),
      React.createElement(
        'div',
        { style: { flex: 1, minWidth: 0 } },
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 } },
          React.createElement(
            'span',
            {
              style: {
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: '#EDE8F5',
              }
            },
            creator.displayName
          ),
          creator.isLive ? renderLiveBadge(true) : null,
          React.createElement(
            'span',
            {
              style: {
                background: 'rgba(201,168,76,.1)',
                border: '1px solid rgba(201,168,76,.25)',
                borderRadius: 4,
                padding: '1px 5px',
                fontFamily: "'DM Mono',monospace",
                fontSize: 8,
                color: '#C9A84C',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }
            },
            creator.tier
          )
        ),
        React.createElement(
          'div',
          {
            style: {
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              color: '#7A6F90',
              marginBottom: 3,
            }
          },
          '@' + creator.username
        ),
        React.createElement(
          'div',
          {
            style: {
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 12,
              color: '#7A6F90',
              marginBottom: 6,
            }
          },
          bioCut
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 8 } },
          React.createElement(
            'span',
            {
              style: {
                fontFamily: "'DM Mono',monospace",
                fontSize: 10,
                color: '#7A6F90',
              }
            },
            formatFollowers(creator.followerCount) + ' followers'
          ),
          React.createElement(
            'button',
            {
              onClick: function() { addToast('Followed @' + creator.username, 'success'); },
              style: {
                background: 'rgba(255,21,100,.15)',
                border: '1px solid rgba(255,21,100,.4)',
                borderRadius: 4,
                padding: '3px 10px',
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: '#FF1564',
                cursor: 'pointer',
              }
            },
            'FOLLOW'
          )
        )
      )
    );
  }

  function renderToggleBtn(label, val) {
    var active = view === val;
    return React.createElement(
      'button',
      {
        onClick: function() { setView(val); },
        style: {
          flex: 1,
          background: active ? 'rgba(255,21,100,.15)' : 'transparent',
          border: '1px solid ' + (active ? 'rgba(255,21,100,.4)' : 'rgba(255,255,255,.07)'),
          borderRadius: 6,
          padding: '7px 0',
          fontFamily: "'Barlow Condensed',sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: active ? '#FF1564' : '#7A6F90',
          cursor: 'pointer',
          letterSpacing: 1,
        }
      },
      label
    );
  }

  return React.createElement(
    'div',
    {
      style: {
        background: '#0F0C14',
        minHeight: '100vh',
        padding: '12px 10px 50px',
      }
    },
    React.createElement(
      'div',
      {
        style: {
          background: 'rgba(7,5,10,.95)',
          border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 10,
          padding: '14px 14px 10px',
          marginBottom: 12,
        }
      },
      React.createElement(
        'div',
        {
          style: {
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 24,
            color: '#C9A84C',
            letterSpacing: 3,
            marginBottom: 2,
          }
        },
        'DISCOVER SEEWHY LIVE'
      ),
      React.createElement(
        'div',
        {
          style: {
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 12,
            color: '#7A6F90',
            marginBottom: 10,
          }
        },
        totalLive + ' streams live right now'
      ),
      React.createElement(
        'div',
        { style: { position: 'relative' } },
        React.createElement(
          'span',
          {
            style: {
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14,
              pointerEvents: 'none',
            }
          },
          '🔍'
        ),
        React.createElement('input', {
          value: query,
          onChange: handleQueryChange,
          placeholder: 'Search streams, creators, genres...',
          style: {
            width: '100%',
            background: 'rgba(22,16,32,.8)',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 6,
            padding: '8px 10px 8px 34px',
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 13,
            color: '#EDE8F5',
            outline: 'none',
            boxSizing: 'border-box',
          }
        })
      )
    ),
    React.createElement(
      'div',
      { style: { display: 'flex', gap: 6, marginBottom: 10 } },
      renderToggleBtn('STREAMS', 'streams'),
      renderToggleBtn('CREATORS', 'creators')
    ),
    loading
      ? React.createElement(
          'div',
          {
            style: {
              textAlign: 'center',
              color: '#7A6F90',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 13,
              padding: 20,
            }
          },
          'Searching...'
        )
      : view === 'streams'
        ? React.createElement('div', null, streams.map(renderStreamCard))
        : React.createElement('div', null, creators.map(renderCreatorCard))
  );
}
