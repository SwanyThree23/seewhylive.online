'use strict';
import React, { useState, useEffect, useRef } from 'react';
import SignalBars from './SignalBars';
import AvatarPortrait from './AvatarPortrait.jsx';
import PullToRefresh from './PullToRefresh.jsx';

var GENRE_COLORS = {
  Tournament: '#C0392B',
  Domino: '#C9A84C',
  Music: '#C9A84C',
  Podcast: '#7B5DA6',
  Lifestyle: '#4A8A7A',
  Tech: '#C9A84C',
  Talk: '#D4854A',
};

var CATEGORIES = ['ALL', 'MUSIC', 'GAMING', 'TECH', 'EDUCATION', 'BUSINESS', 'SPORTS', 'LIFESTYLE'];

var TRENDING_CHANNELS = [
  { id: 'tc1', name: 'AI Verse Podcast',      handle: '@aiverse',   emoji: '🎙', color: '#C9A84C', live: false },
  { id: 'tc2', name: 'Memoirs of a Shy Girl', handle: '@shygirl',   emoji: '📖', color: '#FF6B9D', live: false },
  { id: 'tc3', name: 'Domino Entertainment',  handle: '@dominoent', emoji: '🎲', color: '#C9A84C', live: true  },
];

var QUICK_ACTIONS = [
  { id: 'golive',  label: 'Go Live',      icon: '📡', color: '#C0392B' },
  { id: 'watch',   label: 'Watch Party',  icon: '📺', color: '#C9A84C' },
  { id: 'battles', label: 'PK Battles',   icon: '⚡', color: '#C9A84C' },
  { id: 'vod',     label: 'VOD Library',  icon: '🎬', color: '#C9A84C' },
  { id: 'create',  label: 'Create Room',  icon: '➕', color: '#8A7A62' },
];

function formatFollowers(n) {
  if (n >= 1000) {
    return Math.floor(n / 1000) + 'K';
  }
  return '' + n;
}

export default function DiscoverTab(props) {
  var addToast = props.addToast;
  var socket   = props.socket;

  var queryState = useState('');
  var query = queryState[0];
  var setQuery = queryState[1];

  var streamsState = useState([]);
  var streams = streamsState[0];
  var setStreams = streamsState[1];

  var creatorsState = useState([]);
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

  var activeCategoryState = useState('ALL');
  var activeCategory = activeCategoryState[0];
  var setActiveCategory = activeCategoryState[1];

  var contentTabState = useState('live');
  var contentTab = contentTabState[0];
  var setContentTab = contentTabState[1];

  var notifsState = useState(function() {
    try { return JSON.parse(localStorage.getItem('sw_notifications') || '[]'); } catch(e) { return []; }
  });
  var notifs    = notifsState[0];
  var setNotifs = notifsState[1];

  var notifOpenState = useState(false);
  var notifOpen    = notifOpenState[0];
  var setNotifOpen = notifOpenState[1];

  var followingState = useState(function() {
    try { return JSON.parse(localStorage.getItem('sw_following') || '[]'); } catch(e) { return []; }
  });
  var following    = followingState[0];
  var setFollowing = followingState[1];

  var unreadCount = notifs.filter(function(n) { return !n.read; }).length;

  var debounceRef = useRef(null);

  useEffect(function() {
    function fetchLiveRooms() {
      fetch('/api/rooms/live')
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (!d || !Array.isArray(d.rooms)) return;
          setTotalLive(d.rooms.length);
          if (d.rooms.length > 0) {
            var realStreams = d.rooms.map(function(room) {
              return {
                id:           room.roomId,
                title:        room.title || 'SeeWhy LIVE Stream',
                hostName:     room.hostName || room.roomId.slice(0, 8),
                viewerCount:  room.viewers,
                genre:        room.category || 'Domino',
                isLive:       room.isLive,
                durationMins: room.startedAt ? Math.floor((Date.now() / 1000 - room.startedAt) / 60) : 0,
                tier:         'free',
                category:     room.category || 'SPORTS',
                fromApi:      true
              };
            });
            setStreams(function(prev) {
              var mockFallback = prev.filter(function(s) { return !s.fromApi; });
              return realStreams.concat(mockFallback);
            });
          }
        })
        .catch(function() {});
    }
    fetchLiveRooms();
    var iv = setInterval(fetchLiveRooms, 15000);
    return function() { clearInterval(iv); };
  }, []);

  // ── Fetch /api/active-rooms on mount for live room data ──
  useEffect(function() {
    fetch('/api/active-rooms')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.rooms && data.rooms.length > 0) {
          var roomStreams = data.rooms.map(function(room) {
            return {
              id:           room.id,
              title:        room.title || 'Live Stream',
              hostName:     room.hostName || 'Host',
              viewerCount:  room.viewerCount || 0,
              genre:        room.category || 'GENERAL',
              isLive:       true,
              durationMins: 0,
              tier:         'free',
              category:     room.category || 'GENERAL',
              fromApi:      true
            };
          });
          setStreams(function(prev) {
            var mockFallback = prev.filter(function(s) { return !s.fromApi; });
            return roomStreams.concat(mockFallback);
          });
        }
      })
      .catch(function() {});
  }, []);

  // ── Socket: real-time trending rooms from server ──
  useEffect(function() {
    if (!socket) return;
    function onTrending(data) {
      if (!data || !Array.isArray(data.rooms) || data.rooms.length === 0) return;
      var ranked = data.rooms.map(function(r) {
        return {
          id:           r.roomId,
          title:        r.title || 'SeeWhy LIVE Stream',
          hostName:     r.hostId ? r.hostId.slice(0, 8) : 'Host',
          viewerCount:  (r.viewers || 0) + (r.guests || 0),
          genre:        'Live',
          isLive:       true,
          durationMins: 0,
          tier:         'free',
          category:     'GENERAL',
          score:        r.score || 0,
          fromApi:      true,
          fromSocket:   true
        };
      });
      setStreams(function(prev) {
        var mockFallback = prev.filter(function(s) { return !s.fromSocket && !s.fromApi; });
        return ranked.concat(mockFallback);
      });
      setTotalLive(ranked.length);
    }
    socket.on('livehome:trending', onTrending);
    return function() { socket.off('livehome:trending', onTrending); };
  }, [socket]);

  // ── Socket: listen for notification events ──
  useEffect(function() {
    if (!socket) return;
    function onNotification(data) {
      if (!data) return;
      var entry = Object.assign({ id: Date.now(), ts: Date.now(), read: false }, data);
      setNotifs(function(prev) {
        var next = [entry].concat(prev).slice(0, 50);
        try { localStorage.setItem('sw_notifications', JSON.stringify(next)); } catch(e) {}
        return next;
      });
    }
    socket.on('notification', onNotification);
    return function() { socket.off('notification', onNotification); };
  }, [socket]);

  function markAllRead() {
    setNotifs(function(prev) {
      var next = prev.map(function(n) { return Object.assign({}, n, { read: true }); });
      try { localStorage.setItem('sw_notifications', JSON.stringify(next)); } catch(e) {}
      return next;
    });
  }

  function toggleFollow(username) {
    setFollowing(function(prev) {
      var idx = prev.indexOf(username);
      var next;
      if (idx >= 0) {
        next = prev.filter(function(u) { return u !== username; });
        if (addToast) addToast('Unfollowed @' + username, 'info');
      } else {
        next = prev.concat([username]);
        if (addToast) addToast('Following @' + username, 'success');
      }
      try { localStorage.setItem('sw_following', JSON.stringify(next)); } catch(e) {}
      return next;
    });
  }

  function handleQueryChange(e) {
    var val = e.target.value;
    setQuery(val);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(function() {
      if (!val.trim()) {
        setStreams([]);
        setCreators([]);
        return;
      }
      setLoading(true);
      var streamsUrl = '/api/search?q=' + encodeURIComponent(val) + '&type=streams';
      var creatorsUrl = '/api/search?q=' + encodeURIComponent(val) + '&type=creators';
      Promise.all([
        fetch(streamsUrl).then(function(r) { return r.json(); }).catch(function() { return { results: [] }; }),
        fetch(creatorsUrl).then(function(r) { return r.json(); }).catch(function() { return { results: [] }; }),
      ]).then(function(results) {
        setStreams(results[0].results || []);
        setCreators(results[1].results || []);
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
            background: 'rgba(192,57,43,.15)',
            border: '1px solid rgba(192,57,43,.4)',
            borderRadius: 4,
            padding: '1px 6px',
            fontFamily: "'DM Mono',monospace",
            fontSize: 9,
            color: '#C0392B',
            letterSpacing: 1,
          }
        },
        React.createElement('span', {
          style: {
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#C0392B',
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
          background: 'rgba(138,122,98,.12)',
          border: '1px solid rgba(61,48,32,.3)',
          borderRadius: 4,
          padding: '1px 6px',
          fontFamily: "'DM Mono',monospace",
          fontSize: 9,
          color: '#8A7A62',
          letterSpacing: 1,
        }
      },
      'ENDED'
    );
  }

  function renderStreamCard(stream) {
    var genreColor = GENRE_COLORS[stream.genre] || '#8A7A62';
    var isTrending = stream.viewerCount >= 2000;
    return React.createElement(
      'div',
      {
        key: stream.id,
        style: {
          background: 'rgba(14,12,9,.95)',
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
            color: '#F0E8D4',
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
            color: '#8A7A62',
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
          React.createElement(SignalBars, { isActive: stream.isLive, count: 5, color: stream.isLive ? '#C0392B' : '#8A7A62' }),
          React.createElement(
            'span',
            {
              style: {
                fontFamily: "'DM Mono',monospace",
                fontSize: 10,
                color: '#8A7A62',
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
              color: '#8A7A62',
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
    var bioCut = creator.bio.length > 60 ? creator.bio.slice(0, 60) + '...' : creator.bio;
    return React.createElement(
      'div',
      {
        key: creator.id,
        style: {
          background: 'rgba(14,12,9,.95)',
          border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }
      },
      React.createElement(AvatarPortrait, { username: creator.username, size: 52, isLive: creator.isLive }),
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
                color: '#F0E8D4',
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
              color: '#8A7A62',
              marginBottom: 3,
            }
          },
          '@' + creator.username
        ),
        React.createElement(
          'div',
          {
            className: 'selectable-text',
            style: {
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 12,
              color: '#8A7A62',
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
                color: '#8A7A62',
              }
            },
            formatFollowers(creator.followerCount) + ' followers'
          ),
          React.createElement(
            'button',
            {
              onClick: function() { toggleFollow(creator.username); },
              style: {
                background: following.indexOf(creator.username) >= 0 ? 'rgba(201,168,76,.15)' : 'rgba(192,57,43,.15)',
                border: '1px solid ' + (following.indexOf(creator.username) >= 0 ? 'rgba(201,168,76,.4)' : 'rgba(192,57,43,.4)'),
                borderRadius: 4,
                padding: '3px 10px',
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: following.indexOf(creator.username) >= 0 ? '#C9A84C' : '#C0392B',
                cursor: 'pointer',
              }
            },
            following.indexOf(creator.username) >= 0 ? '✓ FOLLOWING' : 'FOLLOW'
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
          background: active ? 'rgba(192,57,43,.15)' : 'transparent',
          border: '1px solid ' + (active ? 'rgba(192,57,43,.4)' : 'rgba(255,255,255,.07)'),
          borderRadius: 6,
          padding: '7px 0',
          fontFamily: "'Barlow Condensed',sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: active ? '#C0392B' : '#8A7A62',
          cursor: 'pointer',
          letterSpacing: 1,
        }
      },
      label
    );
  }

  function renderQuickActions() {
    return React.createElement(
      'div',
      {
        style: {
          overflowX: 'auto',
          display: 'flex',
          gap: 8,
          padding: '0 0 8px 0',
          marginBottom: 10,
          WebkitOverflowScrolling: 'touch',
        }
      },
      QUICK_ACTIONS.map(function(item) {
        return React.createElement(
          'button',
          {
            key: item.id,
            onClick: function() {
              if (item.id === 'golive' && props.onGoLive) { props.onGoLive(); return; }
              if (addToast) addToast(item.label + ' - coming soon!', 'info');
            },
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(26,21,16,.8)',
              border: '1px solid ' + item.color + '44',
              borderRadius: 20,
              padding: '6px 12px',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 10,
              color: item.color,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              letterSpacing: 0.5,
            }
          },
          item.icon + ' ' + item.label
        );
      })
    );
  }

  function renderContentTabs() {
    var tabs = [
      { id: 'live',      label: 'LIVE NOW' },
      { id: 'upcoming',  label: 'UPCOMING' },
      { id: 'community', label: 'COMMUNITY' },
    ];
    return React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          gap: 6,
          marginBottom: 10,
        }
      },
      tabs.map(function(tab) {
        var active = contentTab === tab.id;
        return React.createElement(
          'button',
          {
            key: tab.id,
            onClick: function() { setContentTab(tab.id); },
            style: {
              flex: 1,
              background: active ? 'rgba(201,168,76,.2)' : 'transparent',
              border: '1px solid ' + (active ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.06)'),
              borderRadius: 6,
              padding: '6px 0',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 11,
              color: active ? '#C9A84C' : '#8A7A62',
              cursor: 'pointer',
              letterSpacing: 1,
            }
          },
          tab.label
        );
      })
    );
  }

  function renderCategoryPills() {
    return React.createElement(
      'div',
      {
        style: {
          overflowX: 'auto',
          display: 'flex',
          gap: 6,
          padding: '4px 0',
          marginBottom: 10,
          WebkitOverflowScrolling: 'touch',
        }
      },
      CATEGORIES.map(function(cat) {
        var active = activeCategory === cat;
        return React.createElement(
          'button',
          {
            key: cat,
            onClick: function() { setActiveCategory(cat); },
            style: {
              background: active ? '#C9A84C' : 'rgba(255,255,255,.04)',
              border: active ? 'none' : '1px solid rgba(255,255,255,.08)',
              borderRadius: 20,
              padding: '4px 12px',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 10,
              color: active ? '#07050A' : '#8A7A62',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              letterSpacing: 0.5,
            }
          },
          cat
        );
      })
    );
  }

  function renderFeaturedYouTube() {
    return React.createElement(
      'div',
      {
        style: {
          background: 'rgba(26,21,16,.8)',
          border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 12,
          marginTop: 4,
        }
      },
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } },
        React.createElement(
          'div',
          {
            style: {
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 16,
              color: '#F0E8D4',
              letterSpacing: 2,
            }
          },
          'Featured on YouTube'
        ),
        React.createElement(
          'span',
          {
            style: {
              background: 'rgba(255,0,0,.15)',
              border: '1px solid rgba(255,0,0,.35)',
              borderRadius: 4,
              padding: '2px 8px',
              fontFamily: "'DM Mono',monospace",
              fontSize: 9,
              color: '#C0392B',
              letterSpacing: 1,
              cursor: 'pointer',
            }
          },
          '▶ YT'
        )
      ),
      React.createElement(
        'div',
        {
          style: {
            fontFamily: "'DM Mono',monospace",
            fontSize: 8,
            color: '#8A7A62',
            letterSpacing: 2,
            marginBottom: 8,
          }
        },
        'TRENDING CHANNELS'
      ),
      React.createElement(
        'div',
        {
          style: {
            overflowX: 'auto',
            display: 'flex',
            gap: 8,
            WebkitOverflowScrolling: 'touch',
          }
        },
        TRENDING_CHANNELS.map(function(channel) {
          return React.createElement(
            'div',
            {
              key: channel.id,
              style: {
                background: 'rgba(26,21,16,.8)',
                border: '1px solid rgba(255,255,255,.07)',
                borderRadius: 10,
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
                minWidth: 90,
                cursor: 'pointer',
              }
            },
            React.createElement(
              'div',
              { style: { position: 'relative' } },
              React.createElement(
                'div',
                {
                  style: {
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(26,21,16,.9)',
                    border: '2px solid ' + channel.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }
                },
                channel.emoji
              ),
              channel.live
                ? React.createElement(
                    'span',
                    {
                      style: {
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        background: '#C0392B',
                        borderRadius: 3,
                        padding: '0px 3px',
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 7,
                        color: '#fff',
                        letterSpacing: 0.5,
                        lineHeight: '12px',
                      }
                    },
                    'LIVE'
                  )
                : null
            ),
            React.createElement(
              'div',
              {
                style: {
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  color: '#F0E8D4',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }
              },
              channel.name
            ),
            React.createElement(
              'div',
              {
                style: {
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 7,
                  color: '#8A7A62',
                }
              },
              channel.handle
            )
          );
        })
      )
    );
  }

  function renderMobileBanner() {
    return React.createElement(
      'div',
      {
        style: {
          background: 'linear-gradient(135deg,rgba(128,0,32,.15),rgba(201,168,76,.08))',
          border: '1px solid rgba(201,168,76,.2)',
          borderRadius: 12,
          padding: '14px',
          marginTop: 4,
        }
      },
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } },
        React.createElement(
          'div',
          {
            style: {
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 16,
              color: '#C9A84C',
              letterSpacing: 2,
            }
          },
          '📱 SEEWHY LIVE MOBILE'
        ),
        React.createElement(
          'span',
          {
            style: {
              background: 'rgba(201,168,76,.15)',
              border: '1px solid rgba(201,168,76,.3)',
              borderRadius: 4,
              padding: '2px 7px',
              fontFamily: "'DM Mono',monospace",
              fontSize: 8,
              color: '#C9A84C',
              letterSpacing: 1,
            }
          },
          'COMING SOON'
        )
      ),
      React.createElement(
        'div',
        {
          style: {
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 11,
            color: '#8A7A62',
            marginBottom: 3,
          }
        },
        'Go live from your phone'
      ),
      React.createElement(
        'div',
        {
          style: {
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 11,
            color: '#8A7A62',
            marginBottom: 3,
          }
        },
        'Built on Zegocloud Ultra-Low Latency'
      ),
      React.createElement(
        'div',
        {
          style: {
            fontFamily: "'DM Mono',monospace",
            fontSize: 9,
            color: '#8A7A62',
            marginBottom: 10,
          }
        },
        'React Native'
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', gap: 8 } },
        React.createElement(
          'span',
          {
            style: {
              background: 'rgba(138,122,98,.1)',
              border: '1px solid rgba(61,48,32,.25)',
              borderRadius: 6,
              padding: '4px 12px',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 10,
              color: '#8A7A62',
              letterSpacing: 0.5,
            }
          },
          '🍎 iOS COMING SOON'
        ),
        React.createElement(
          'span',
          {
            style: {
              background: 'rgba(138,122,98,.1)',
              border: '1px solid rgba(61,48,32,.25)',
              borderRadius: 6,
              padding: '4px 12px',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 10,
              color: '#8A7A62',
              letterSpacing: 0.5,
            }
          },
          '🤖 ANDROID COMING'
        )
      )
    );
  }

  function renderComingSoon(label) {
    return React.createElement(
      'div',
      {
        style: {
          textAlign: 'center',
          padding: '24px',
          color: '#8A7A62',
          fontFamily: "'DM Mono',monospace",
          fontSize: 10,
        }
      },
      label
    );
  }

  var filteredStreams = activeCategory === 'ALL'
    ? streams
    : streams.filter(function(s) { return s.category === activeCategory; });

  var filteredCreators = creators;

  function handleRefresh() {
    fetch('/api/active-rooms')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.rooms) {
          var mapped = d.rooms.map(function(room) {
            return {
              id: room.id || room.roomId,
              title: room.title || 'Live Stream',
              hostName: room.hostName || 'Host',
              viewerCount: room.viewerCount || room.viewers || 0,
              genre: room.category || 'GENERAL',
              isLive: true,
              durationMins: 0,
              tier: 'free',
              category: room.category || 'GENERAL',
              fromApi: true
            };
          });
          setStreams(mapped);
        }
      })
      .catch(function() {});
  }

  return React.createElement(
    PullToRefresh,
    { onRefresh: handleRefresh },
    React.createElement(
    'div',
    {
      style: {
        background: '#0E0C09',
        minHeight: '100vh',
        padding: '12px 10px 50px',
        position: 'relative',
      }
    },
    // ── Notification Bell ──
    React.createElement(
      'div',
      { style: { position: 'absolute', top: 12, right: 10, zIndex: 100 } },
      React.createElement(
        'button',
        {
          onClick: function() { setNotifOpen(function(v) { return !v; }); if (!notifOpen) markAllRead(); },
          style: { background: 'rgba(26,21,16,.9)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 20, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, position: 'relative' }
        },
        React.createElement('span', { style: { fontSize: 14 } }, '🔔'),
        unreadCount > 0
          ? React.createElement(
              'span',
              { style: { background: '#FF1A3C', color: '#fff', fontFamily: "'DM Mono',monospace", fontSize: 8, borderRadius: 999, padding: '0 4px', minWidth: 14, textAlign: 'center', lineHeight: '14px' } },
              unreadCount > 9 ? '9+' : String(unreadCount)
            )
          : null
      ),
      notifOpen
        ? React.createElement(
            'div',
            {
              style: { position: 'absolute', top: 32, right: 0, background: 'rgba(26,21,16,.97)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, width: 260, maxHeight: 320, overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,.5)', zIndex: 200 }
            },
            React.createElement(
              'div',
              { style: { padding: '8px 12px', borderBottom: '1px solid rgba(201,168,76,.1)', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1 } },
              'NOTIFICATIONS'
            ),
            notifs.length === 0
              ? React.createElement(
                  'div',
                  { style: { padding: '16px 12px', textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' } },
                  'No notifications yet'
                )
              : notifs.slice(0, 10).map(function(n, i) {
                  return React.createElement(
                    'div',
                    { key: n.id || i, style: { padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,.04)', background: n.read ? 'transparent' : 'rgba(201,168,76,.05)' } },
                    React.createElement(
                      'div',
                      { style: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#F0E8D4', marginBottom: 2 } },
                      n.message || n.text || JSON.stringify(n)
                    ),
                    React.createElement(
                      'div',
                      { style: { fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' } },
                      n.ts ? new Date(n.ts).toLocaleTimeString() : ''
                    )
                  );
                })
          )
        : null
    ),
    renderQuickActions(),
    React.createElement(
      'div',
      {
        style: {
          background: 'rgba(14,12,9,.95)',
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
            color: '#8A7A62',
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
            background: 'rgba(26,21,16,.8)',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 6,
            padding: '8px 10px 8px 34px',
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 13,
            color: '#F0E8D4',
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
    renderContentTabs(),
    renderCategoryPills(),
    loading
      ? React.createElement(
          'div',
          {
            style: {
              textAlign: 'center',
              color: '#8A7A62',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 13,
              padding: 20,
            }
          },
          'Searching...'
        )
      : contentTab === 'upcoming'
        ? renderComingSoon('UPCOMING STREAMS \xB7 COMING SOON')
        : contentTab === 'community'
          ? renderComingSoon('COMMUNITY \xB7 COMING SOON')
          : view === 'streams'
            ? React.createElement('div', null, filteredStreams.map(renderStreamCard))
            : React.createElement('div', null, filteredCreators.map(renderCreatorCard)),
    renderFeaturedYouTube(),
    renderMobileBanner()
  )
  );
}
