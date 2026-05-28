import React, { useState } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var CHANNELS = [
  { id: 'UCxxx1', name: 'AI Verse Podcast',     handle: '@aiverse',   thumb: '🎙', color: '#C084FC', status: 'online' },
  { id: 'UCxxx2', name: 'Memoirs of a Shy Girl', handle: '@shygirl',   thumb: '📖', color: '#FF6B9D', status: 'online' },
  { id: 'UCxxx3', name: 'Domino Entertainment',  handle: '@dominoent', thumb: '🎲', color: '#C9A84C', status: 'live'   },
  { id: 'UCxxx4', name: 'SwanyBot LIVE',          handle: '@swanybot',  thumb: '🤖', color: '#00C9A7', status: 'live'   },
];

var VIDEOS = [
  { id: 'v1', ytId: 'dQw4w9WgXcQ', title: 'Livestream Your Spaces',     channel: 'AI Verse Podcast',     views: 12400, duration: '18:32',   category: 'TECH'      },
  { id: 'v2', ytId: 'dQw4w9WgXcQ', title: 'Building Authentic Audience', channel: 'Memoirs of a Shy Girl', views: 8900,  duration: '24:15',   category: 'LIFESTYLE' },
  { id: 'v3', ytId: 'dQw4w9WgXcQ', title: 'Washington Classic Recap',    channel: 'Domino Entertainment',  views: 31200, duration: '45:00',   category: 'SPORTS'    },
  { id: 'v4', ytId: 'dQw4w9WgXcQ', title: 'Monetization 101',            channel: 'SwanyBot LIVE',         views: 5600,  duration: '31:44',   category: 'BUSINESS'  },
  { id: 'v5', ytId: 'dQw4w9WgXcQ', title: 'AI Hitmakers Camp',           channel: 'AI Verse Podcast',     views: 7800,  duration: '1:02:10', category: 'MUSIC'     },
  { id: 'v6', ytId: 'dQw4w9WgXcQ', title: 'PK Battle Tournament Finals', channel: 'Domino Entertainment',  views: 55000, duration: '2:14:00', category: 'SPORTS'    },
];

var CATEGORIES = ['ALL', 'MUSIC', 'GAMING', 'TECH', 'EDUCATION', 'BUSINESS', 'SPORTS', 'LIFESTYLE'];

var CATEGORY_COLORS = {
  TECH:      '#C084FC',
  LIFESTYLE: '#FF6B9D',
  SPORTS:    '#C9A84C',
  BUSINESS:  '#00C9A7',
  MUSIC:     '#FF1564',
  GAMING:    '#4DA6FF',
  EDUCATION: '#FFB347',
  ALL:       '#7A6F90'
};

function fmtViews(n) {
  if (n >= 1000) return (Math.floor(n / 100) / 10) + 'K';
  return String(n);
}

export default function VODLibraryTab({ addToast, isLive }) {
  var [activeCategory, setActiveCategory] = useState('ALL');
  var [activeTab, setActiveTab]           = useState('featured');
  var [selectedVideo, setSelectedVideo]   = useState(null);
  var [searchQuery, setSearchQuery]       = useState('');

  var filtered = VIDEOS.filter(function(v) {
    var catMatch = activeCategory === 'ALL' || v.category === activeCategory;
    var q = searchQuery.toLowerCase();
    var searchMatch = !q || v.title.toLowerCase().indexOf(q) !== -1;
    return catMatch && searchMatch;
  });

  var containerStyle = {
    background: '#0F0C14',
    minHeight: '100%',
    fontFamily: "'Barlow Condensed',sans-serif",
    color: '#EDE8F5'
  };

  var cardStyle = {
    background: 'rgba(22,16,32,.8)',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer'
  };

  // ── HEADER / SEARCH / FILTERS ───────────────────────────────────────────────
  var headerSection = (
    <div style={{ padding: '16px 16px 0 16px' }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#C9A84C', letterSpacing: 2 }}>
            📺 VOD LIBRARY
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#7A6F90' }}>
            Featured channels and on-demand content
          </div>
        </div>
        {isLive && (
          <div style={{
            background: 'rgba(255,21,100,.2)',
            border: '1px solid rgba(255,21,100,.5)',
            borderRadius: 20,
            padding: '3px 10px',
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 11,
            color: '#FF1564',
            letterSpacing: 1
          }}>
            🔴 LIVE
          </div>
        )}
      </div>

      {/* Search bar */}
      <input
        style={{
          width: '100%',
          background: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 10,
          padding: '10px 14px',
          color: '#EDE8F5',
          fontFamily: "'Barlow Condensed',sans-serif",
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 12
        }}
        placeholder="Search videos..."
        value={searchQuery}
        onChange={function(e) { setSearchQuery(e.target.value); }}
      />

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }}>
        {CATEGORIES.map(function(cat) {
          var isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={function() { setActiveCategory(cat); }}
              style={{
                flexShrink: 0,
                padding: '5px 12px',
                background: isActive ? '#C9A84C' : 'rgba(255,255,255,.06)',
                border: isActive ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,.1)',
                borderRadius: 20,
                color: isActive ? '#0F0C14' : '#7A6F90',
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 11,
                letterSpacing: 1,
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['featured', 'channels', 'recent'].map(function(tab) {
          var isActive = activeTab === tab;
          var label = tab === 'featured' ? 'FEATURED' : tab === 'channels' ? 'CHANNELS' : 'RECENT';
          return (
            <button
              key={tab}
              onClick={function() { setActiveTab(tab); }}
              style={{
                padding: '6px 16px',
                background: isActive ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.04)',
                border: isActive ? '1px solid rgba(201,168,76,.5)' : '1px solid rgba(255,255,255,.08)',
                borderRadius: 20,
                color: isActive ? '#C9A84C' : '#7A6F90',
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 12,
                letterSpacing: 1,
                cursor: 'pointer'
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── CHANNELS TAB ────────────────────────────────────────────────────────────
  if (activeTab === 'channels') {
    return (
      <div style={containerStyle}>
        {headerSection}
        <div style={{ padding: '0 16px 16px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CHANNELS.map(function(ch) {
              var isLiveCh = ch.status === 'live';
              return (
                <div
                  key={ch.id}
                  style={Object.assign({}, cardStyle, { cursor: 'default', padding: '16px 12px', textAlign: 'center' })}
                >
                  {/* Channel avatar */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <AvatarPortrait username={ch.name} size={56} isLive={ch.status === 'live'} />
                  </div>

                  {/* Channel name */}
                  <div style={{
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: 14,
                    color: ch.color,
                    letterSpacing: 1,
                    marginBottom: 2,
                    lineHeight: 1.2
                  }}>
                    {ch.name}
                  </div>

                  {/* Handle */}
                  <div style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 8,
                    color: '#7A6F90',
                    marginBottom: 10
                  }}>
                    {ch.handle}
                  </div>

                  {/* Status badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 12 }}>
                    <div style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: isLiveCh ? '#FF1564' : '#00C9A7',
                      boxShadow: isLiveCh ? '0 0 6px #FF1564' : '0 0 4px #00C9A7'
                    }} />
                    <span style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: 10,
                      color: isLiveCh ? '#FF1564' : '#00C9A7',
                      letterSpacing: 1
                    }}>
                      {isLiveCh ? 'LIVE' : 'ONLINE'}
                    </span>
                  </div>

                  {/* Visit button */}
                  <button
                    onClick={function() { addToast('Opening ' + ch.name, 'info'); }}
                    style={{
                      width: '100%',
                      padding: '7px 0',
                      background: 'rgba(255,255,255,.06)',
                      border: '1px solid rgba(255,255,255,.12)',
                      borderRadius: 8,
                      color: '#EDE8F5',
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: 11,
                      letterSpacing: 1,
                      cursor: 'pointer'
                    }}
                  >
                    VISIT
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── FEATURED / RECENT VIDEO GRID ────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      {headerSection}
      <div style={{ padding: '0 16px 16px 16px' }}>
        {/* Result count */}
        <div style={{
          fontFamily: "'DM Mono',monospace",
          fontSize: 10,
          color: '#7A6F90',
          marginBottom: 10
        }}>
          {filtered.length} video{filtered.length !== 1 ? 's' : ''} found
        </div>

        {filtered.length === 0 ? (
          <div style={{
            background: 'rgba(22,16,32,.8)',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 12,
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎬</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#7A6F90', letterSpacing: 1 }}>
              NO VIDEOS MATCH YOUR FILTER
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {filtered.map(function(video) {
              var catColor = CATEGORY_COLORS[video.category] || '#7A6F90';
              return (
                <div
                  key={video.id}
                  style={cardStyle}
                  onClick={function() { setSelectedVideo(video); }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: 'rgba(255,255,255,.04)' }}>
                    <img
                      src={'https://img.youtube.com/vi/' + video.ytId + '/mqdefault.jpg'}
                      alt={video.title}
                      onError={function(e) {
                        e.target.style.display = 'none';
                      }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />

                    {/* Duration badge — top right */}
                    <div style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'rgba(0,0,0,.78)',
                      borderRadius: 4,
                      padding: '2px 5px',
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 9,
                      color: '#EDE8F5'
                    }}>
                      {video.duration}
                    </div>

                    {/* Category chip — bottom left */}
                    <div style={{
                      position: 'absolute',
                      bottom: 6,
                      left: 6,
                      background: 'rgba(0,0,0,.7)',
                      border: '1px solid ' + catColor,
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: 9,
                      color: catColor,
                      letterSpacing: 1
                    }}>
                      {video.category}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '10px 10px 12px 10px' }}>
                    <div style={{
                      fontFamily: "'Barlow Condensed',sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#EDE8F5',
                      lineHeight: 1.3,
                      marginBottom: 5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {video.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <AvatarPortrait username={video.channel} size={18} />
                      <div style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 8,
                        color: '#7A6F90'
                      }}>
                        {video.channel}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 8,
                      color: '#7A6F90'
                    }}>
                      {fmtViews(video.views) + ' views'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIDEO PLAYER MODAL */}
      {selectedVideo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.9)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={function(e) { if (e.target === e.currentTarget) setSelectedVideo(null); }}
        >
          {/* Close button */}
          <button
            onClick={function() { setSelectedVideo(null); }}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
              lineHeight: 1,
              zIndex: 1001
            }}
          >
            ✕
          </button>

          {/* IFrame embed */}
          <div style={{
            width: '100%',
            maxWidth: 720,
            background: 'rgba(22,16,32,.95)',
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,.1)'
          }}>
            <div style={{ position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                src={'https://www.youtube.com/embed/' + selectedVideo.ytId + '?autoplay=1'}
                allow="autoplay; encrypted-media"
                allowFullScreen={true}
                title={selectedVideo.title}
              />
            </div>

            {/* Title / channel below */}
            <div style={{ padding: '14px 16px 18px 16px' }}>
              <div style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: '#EDE8F5',
                marginBottom: 4
              }}>
                {selectedVideo.title}
              </div>
              <div style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: 10,
                color: '#7A6F90'
              }}>
                {selectedVideo.channel + ' · ' + fmtViews(selectedVideo.views) + ' views · ' + selectedVideo.duration}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
