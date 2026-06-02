import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';
import SelectSheet from './SelectSheet.jsx';

var CREATORS = [
  { id: 'c1', name: 'CaliBonesOG',  handle: 'calibonesog',  flag: '🇺🇸', category: 'Domino',  followers: 12400, live: true,  viewers: 892,  color: '#C01838' },
  { id: 'c2', name: 'VibeNBones',   handle: 'vibenbones',   flag: '🇺🇸', category: 'Music',   followers: 8200,  live: false, viewers: 0,    color: '#5A8FFF' },
  { id: 'c3', name: 'LyricQueen',   handle: 'lyricqueen',   flag: '🇳🇬', category: 'Music',   followers: 6700,  live: true,  viewers: 1203, color: '#C084FC' },
  { id: 'c4', name: 'TechNerd42',   handle: 'technerd42',   flag: '🇺🇸', category: 'Tech',    followers: 4500,  live: true,  viewers: 4213, color: '#00DEC0' },
  { id: 'c5', name: 'DJ_Cipher',    handle: 'djcipher',     flag: '🇯🇲', category: 'Music',   followers: 3900,  live: false, viewers: 0,    color: '#00C9A7' },
  { id: 'c6', name: 'ZenFitPro',    handle: 'zenfitpro',    flag: '🇨🇦', category: 'Fitness', followers: 2800,  live: false, viewers: 0,    color: '#00C96A' },
  { id: 'c7', name: 'BeatKing_X',   handle: 'beatkingx',    flag: '🇬🇧', category: 'Music',   followers: 2300,  live: true,  viewers: 387,  color: '#C8FF00' },
  { id: 'c8', name: 'NeonBeats',    handle: 'neonbeats',    flag: '🇰🇷', category: 'Music',   followers: 1900,  live: false, viewers: 0,    color: '#FF1493' },
];

var CATS = ['All', 'Domino', 'Music', 'Tech', 'Fitness'];

var CAT_COLORS = { Domino: '#C9A84C', Music: '#C084FC', Tech: '#00C9A7', Fitness: '#00C96A', All: '#7A6F90' };

function fmtFollowers(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

var CREATOR_BIO = {
  c1: { bio: 'Domino legend from Cali. Washington Classic organizer. FADES pioneer.', streams: 214, totalViews: '1.2M' },
  c2: { bio: "VibeN'Bones bringing that smooth soulful energy. Collab ready.", streams: 87, totalViews: '340k' },
  c3: { bio: 'Lyric Queen — R&B vocals with a Nigerian twist. Multi-genre artist.', streams: 63, totalViews: '210k' },
  c4: { bio: 'Tech content, dev streams, AI discussions. Building in public since 2021.', streams: 401, totalViews: '2.1M' },
  c5: { bio: 'DJ Cipher drops fire sets live every weekend. From Kingston to the world.', streams: 56, totalViews: '180k' },
  c6: { bio: 'Zen Fit Pro — morning fitness streams, nutrition, mindset coaching.', streams: 38, totalViews: '95k' },
  c7: { bio: 'Beat King X producing chart-ready tracks live on SeeWhy. UK bass vibes.', streams: 29, totalViews: '72k' },
  c8: { bio: 'Neon Beats — Korean EDM producer. Lo-fi to techno, all live.', streams: 17, totalViews: '44k' },
};

export default function CreatorDiscoveryTab({ addToast, isLive, socket, roomId, username }) {
  var [filter,          setFilter]          = useState('All');
  var [sortBy,          setSortBy]          = useState('live');
  var [following,       setFollowing]       = useState({ c1: true });
  var [search,          setSearch]          = useState('');
  var [profile,         setProfile]         = useState(null);
  var [filterLive,      setFilterLive]      = useState(false);
  var [liveViewerCounts, setLiveViewerCounts] = useState(function() {
    var init = {};
    for (var i = 0; i < CREATORS.length; i++) {
      init[CREATORS[i].id] = CREATORS[i].viewers;
    }
    return init;
  });
  var [livePulse, setLivePulse] = useState(false);
  var driftRef = useRef(null);
  var pulseRef = useRef(null);

  useEffect(function() {
    if (!isLive) return;
    driftRef.current = setInterval(function() {
      setLiveViewerCounts(function(prev) {
        var next = Object.assign({}, prev);
        for (var i = 0; i < CREATORS.length; i++) {
          var c = CREATORS[i];
          if (c.live) {
            var delta = Math.floor(Math.random() * 20) - 8;
            var newVal = (prev[c.id] || 0) + delta;
            if (newVal < 0) newVal = 0;
            next[c.id] = newVal;
          }
        }
        return next;
      });
    }, 5000);
    return function() { clearInterval(driftRef.current); };
  }, [isLive]);

  useEffect(function() {
    pulseRef.current = setInterval(function() {
      setLivePulse(function(v) { return !v; });
    }, 800);
    return function() { clearInterval(pulseRef.current); };
  }, []);

  function toggleFollow(id, name) {
    setFollowing(function(p) {
      var next = Object.assign({}, p, { [id]: !p[id] });
      if (addToast) addToast(next[id] ? 'Following ' + name : 'Unfollowed ' + name, 'info');
      return next;
    });
  }

  var visible = CREATORS.filter(function(c) {
    var matchesCat = filter === 'All' || c.category === filter;
    var matchesSearch = !search.trim() || c.name.toLowerCase().indexOf(search.toLowerCase()) !== -1 || c.handle.toLowerCase().indexOf(search.toLowerCase()) !== -1;
    var matchesLive = !filterLive || c.live;
    return matchesCat && matchesSearch && matchesLive;
  }).sort(function(a, b) {
    if (sortBy === 'live') {
      if (a.live !== b.live) return a.live ? -1 : 1;
      return b.viewers - a.viewers;
    }
    if (sortBy === 'followers') return b.followers - a.followers;
    if (sortBy === 'viewers')   return b.viewers - a.viewers;
    return 0;
  });

  var liveCount = CREATORS.filter(function(c) { return c.live; }).length;

  var liveDotStyle = {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#FF1A3C',
    marginRight: 4,
    boxShadow: livePulse ? '0 0 8px 3px rgba(255,26,60,.7)' : '0 0 3px 1px rgba(255,26,60,.3)',
    transition: 'box-shadow 0.4s',
  };

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* YOU'RE LIVE banner */}
      {isLive && (
        <div style={{ background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={liveDotStyle} />
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#FF6B81', letterSpacing: 2 }}>YOU'RE LIVE</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', marginLeft: 4 }}>Your stream is active · viewer counts updating live</span>
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'rgba(0,201,167,.06)', border: '1px solid rgba(0,201,167,.22)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#00DEC0', letterSpacing: 3 }}>🔭 CREATOR DISCOVERY</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>{CREATORS.length} creators · {liveCount} live now</div>
        </div>
        <SelectSheet
          label="Sort By"
          value={sortBy}
          options={[
            { value: 'live',      label: 'Sort: LIVE' },
            { value: 'followers', label: 'Sort: FOLLOWERS' },
            { value: 'viewers',   label: 'Sort: VIEWERS' },
          ]}
          onChange={function(v) { setSortBy(v); }}
          style={{ minWidth: 120 }}
        />
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={function(e) { setSearch(e.target.value); }}
        placeholder="Search creators..."
        style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, outline: 'none' }}
      />

      {/* Category filter + LIVE NOW chip */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
        {/* LIVE NOW filter chip */}
        <button onClick={function() { setFilterLive(function(v) { return !v; }); }}
          style={{ background: filterLive ? 'rgba(255,26,60,.18)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (filterLive ? 'rgba(255,26,60,.55)' : '#241C34'), borderRadius: 999, padding: '3px 12px', color: filterLive ? '#FF6B81' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          {filterLive && <span style={liveDotStyle} />}
          LIVE NOW
        </button>
        {CATS.map(function(c) {
          var active = filter === c;
          var color  = CAT_COLORS[c] || '#7A6F90';
          return (
            <button key={c} onClick={function() { setFilter(c); }}
              style={{ background: active ? color + '22' : 'rgba(22,16,32,.7)', border: '1px solid ' + (active ? color + '66' : '#241C34'), borderRadius: 999, padding: '3px 12px', color: active ? color : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0, letterSpacing: 1 }}>
              {c.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Profile detail panel */}
      {profile && (
        <div style={{ background: 'rgba(22,16,32,.95)', border: '1px solid ' + profile.color + '44', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: profile.color + '18', border: '2px solid ' + profile.color + 'aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{profile.flag}</div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 16, color: '#EDE8F5' }}>{profile.name}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>@{profile.handle}</div>
              </div>
            </div>
            <button onClick={function() { setProfile(null); }} style={{ background: 'none', border: '1px solid #241C34', borderRadius: 6, padding: '3px 8px', color: '#7A6F90', fontSize: 10, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: '#B0A0C0', lineHeight: 1.6, marginBottom: 10 }}>{(CREATOR_BIO[profile.id] || {bio:''}).bio}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {[
              ['FOLLOWERS', fmtFollowers(profile.followers), profile.color],
              ['STREAMS', String((CREATOR_BIO[profile.id] || {streams:0}).streams), '#5A8FFF'],
              ['TOTAL VIEWS', (CREATOR_BIO[profile.id] || {totalViews:'0'}).totalViews, '#00C9A7'],
            ].map(function(stat) {
              return (
                <div key={stat[0]} style={{ background: stat[2] + '0E', border: '1px solid ' + stat[2] + '25', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: stat[2], lineHeight: 1 }}>{stat[1]}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#7A6F90', letterSpacing: 1 }}>{stat[0]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              onClick={function() { toggleFollow(profile.id, profile.name); }}
              style={{ flex: 1, padding: '8px', background: Boolean(following[profile.id]) ? profile.color + '22' : 'rgba(201,168,76,.12)', border: '1px solid ' + (Boolean(following[profile.id]) ? profile.color + '66' : '#C9A84C44'), borderRadius: 7, color: Boolean(following[profile.id]) ? profile.color : '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              {Boolean(following[profile.id]) ? '✓ FOLLOWING' : '+ FOLLOW'}
            </button>
            <button
              onClick={function() {
                if (socket && roomId) {
                  socket.emit('collab-request', {
                    roomId:     roomId,
                    fromUser:   username || 'Creator',
                    toCreator:  profile.name,
                    type:       'LIVE COLLAB',
                    message:    'Collab request from ' + (username || 'Creator') + ' via Creator Discovery',
                    split:      '50/50'
                  });
                }
                if (addToast) addToast('🤝 Collab request sent to ' + profile.name, 'success');
              }}
              style={{ flex: 1, padding: '8px', background: 'rgba(0,201,167,.12)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 7, color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              🤝 COLLAB
            </button>
          </div>
        </div>
      )}

      {/* Creator list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.map(function(c) {
          var isFollowing = Boolean(following[c.id]);
          var displayViewers = liveViewerCounts[c.id] !== undefined ? liveViewerCounts[c.id] : c.viewers;
          var avatarBorderColor = c.live
            ? (livePulse ? c.color + 'ff' : c.color + '66')
            : c.color + '33';
          return (
            <div key={c.id} onClick={function() { setProfile(profile && profile.id === c.id ? null : c); }} style={{ background: c.live ? 'rgba(22,16,32,.9)' : 'rgba(15,12,20,.7)', border: '1px solid ' + (profile && profile.id === c.id ? c.color + '88' : c.live ? c.color + '33' : '#241C34'), borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0, filter: c.live && livePulse ? 'drop-shadow(0 0 6px ' + c.color + '99)' : 'none', transition: 'filter .4s' }}>
                <AvatarPortrait username={c.name} size={44} isLive={c.live} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: c.live ? '#EDE8F5' : '#7A6F90', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </span>
                  {c.live && (
                    <span style={{ background: livePulse ? 'rgba(255,26,60,.28)' : 'rgba(255,26,60,.12)', border: '1px solid ' + (livePulse ? 'rgba(255,26,60,.7)' : 'rgba(255,26,60,.35)'), borderRadius: 999, padding: '1px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, transition: 'background .4s, border-color .4s' }}>
                      <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#FF1A3C', boxShadow: livePulse ? '0 0 5px 2px rgba(255,26,60,.8)' : 'none', transition: 'box-shadow .4s' }} />
                      LIVE
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ background: (CAT_COLORS[c.category] || '#7A6F90') + '18', border: '1px solid ' + (CAT_COLORS[c.category] || '#7A6F90') + '44', borderRadius: 999, padding: '1px 7px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 8, color: CAT_COLORS[c.category] || '#7A6F90' }}>
                    {c.category}
                  </span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90' }}>
                    {fmtFollowers(c.followers)} followers
                  </span>
                  {c.live && displayViewers > 0 && (
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C8FF00' }}>
                      👁 {displayViewers.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Follow button */}
              <button
                onClick={function(e) { e.stopPropagation(); toggleFollow(c.id, c.name); }}
                style={{ background: isFollowing ? c.color + '22' : 'rgba(201,168,76,.12)', border: '1px solid ' + (isFollowing ? c.color + '66' : '#C9A84C44'), borderRadius: 7, padding: '6px 12px', color: isFollowing ? c.color : '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', flexShrink: 0, minWidth: 68, textAlign: 'center' }}>
                {isFollowing ? '✓ FOLLOWING' : '+ FOLLOW'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
