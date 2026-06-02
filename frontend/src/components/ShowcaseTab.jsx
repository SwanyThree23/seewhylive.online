import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var CREATOR = 0.90;
var PLATFORM = 0.10;
var OCT_CLIP = 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)';

var STATES = [
  { id:'wa', name:'Washington',     abbr:'WA', emoji:'🏔️', captain:'CaliBonesOG',   co:'SwanyThree',     city:'Des Moines, WA',  region:'West',      cp:'#004C97', cs:'#69BE28', w:8, l:0, pts:240, rank:1, streak:8, tiles:1840, roster:['CaliBonesOG','SwanyThree','VibeNBones','DJ_Cipher','BeatKing_X'],     bio:'Home of the Washington Classic. Undefeated in the 2026 State Showcase. Pacific Northwest dominoes royalty.' },
  { id:'ca', name:'California',     abbr:'CA', emoji:'🌴', captain:'CaliBonesMusic', co:'LyricQueen',     city:'Los Angeles, CA', region:'West',      cp:'#003087', cs:'#FDB927', w:7, l:1, pts:210, rank:2, streak:5, tiles:1720, roster:['CaliBonesMusic','LyricQueen','WestCoast_D','BonesDaddy','TileMaster'],  bio:'West Coast dominoes elite. Cali Bones carrying the flag for the Golden State.' },
  { id:'tx', name:'Texas',          abbr:'TX', emoji:'⭐', captain:'TileMaster_TX',  co:'HoustonHeat',    city:'Houston, TX',     region:'Southwest', cp:'#BF0A30', cs:'#FFFFFF', w:6, l:2, pts:180, rank:3, streak:3, tiles:1580, roster:['TileMaster_TX','HoustonHeat','LoneStar_D','BigTex','DallasDomino'],   bio:'Everything is bigger in Texas — including the dominoes. Houston to Dallas, TX runs deep.' },
  { id:'ga', name:'Georgia',        abbr:'GA', emoji:'🍑', captain:'ATL_Domino',     co:'PeachState_P',   city:'Atlanta, GA',     region:'Southeast', cp:'#BA0C2F', cs:'#E8C46A', w:6, l:2, pts:178, rank:4, streak:2, tiles:1560, roster:['ATL_Domino','PeachState_P','ATL_BoneKing','SouthSide_D','TechWoodT'], bio:"ATL bringing that Southern dominoes heat. Georgia peaches don't play." },
  { id:'ny', name:'New York',       abbr:'NY', emoji:'🗽', captain:'BrooklynBones',  co:'HarlemKing',     city:'Brooklyn, NY',    region:'Northeast', cp:'#003087', cs:'#CF7F2D', w:5, l:3, pts:150, rank:5, streak:1, tiles:1440, roster:['BrooklynBones','HarlemKing','BronxBlitz','QueensTile','LIBoneGod'],   bio:'NYC runs five boroughs deep. Brooklyn to the Bronx — we set the table.' },
  { id:'fl', name:'Florida',        abbr:'FL', emoji:'🌊', captain:'MiamiTile',      co:'OrlandoD',       city:'Miami, FL',       region:'Southeast', cp:'#0021A5', cs:'#FA4616', w:5, l:3, pts:148, rank:6, streak:0, tiles:1420, roster:['MiamiTile','OrlandoD','TampaBone','SunshineD','KeysKing'],          bio:"Florida's heat doesn't stop at the weather. Miami to Jax — FL is coming for the crown." },
  { id:'il', name:'Illinois',       abbr:'IL', emoji:'🏙️', captain:'ChicagoD',       co:'SouthSideSlate', city:'Chicago, IL',     region:'Midwest',   cp:'#00A3E0', cs:'#FFFFFF', w:4, l:4, pts:120, rank:7, streak:0, tiles:1280, roster:['ChicagoD','SouthSideSlate','NorthShoreN','WestSideW','WindyCityB'], bio:'Chi-town dominoes scene is real. Bronzeville bred — city built on bones.' },
  { id:'nc', name:'North Carolina', abbr:'NC', emoji:'🌲', captain:'CLTBoneKing',    co:'TriangleTile',   city:'Charlotte, NC',   region:'Southeast', cp:'#990000', cs:'#FFFFFF', w:4, l:4, pts:118, rank:8, streak:0, tiles:1240, roster:['CLTBoneKing','TriangleTile','OBXtile','Piedmont_D','RaleighR'],      bio:'Queen City rising. NC blending tradition with new school domino energy.' },
];

var FUTURE = [
  { id:'oh', name:'Ohio',          abbr:'OH', emoji:'🌰', cp:'#BB0000', region:'Midwest' },
  { id:'pa', name:'Pennsylvania',  abbr:'PA', emoji:'🔔', cp:'#002147', region:'Northeast' },
  { id:'az', name:'Arizona',       abbr:'AZ', emoji:'🌵', cp:'#CC0000', region:'Southwest' },
  { id:'mi', name:'Michigan',      abbr:'MI', emoji:'🚗', cp:'#00274C', region:'Midwest' },
  { id:'va', name:'Virginia',      abbr:'VA', emoji:'🏛️', cp:'#003087', region:'Southeast' },
  { id:'ma', name:'Massachusetts', abbr:'MA', emoji:'🦞', cp:'#0000AA', region:'Northeast' },
];

var QF = [
  { id:'m1', a:'wa', b:'nc', date:'Sat Jun 7',  ppv:'4.99' },
  { id:'m2', a:'ca', b:'il', date:'Sat Jun 7',  ppv:'4.99' },
  { id:'m3', a:'tx', b:'fl', date:'Sun Jun 8',  ppv:'4.99' },
  { id:'m4', a:'ga', b:'ny', date:'Sun Jun 8',  ppv:'4.99' },
];

var RESULTS = [
  { id:'r1', a:'wa', b:'ny', sa:7, sb:2, ta:210, tb:168, date:'May 17', mvp:'CaliBonesOG' },
  { id:'r2', a:'ca', b:'nc', sa:6, sb:3, ta:198, tb:154, date:'May 17', mvp:'CaliBonesMusic' },
  { id:'r3', a:'tx', b:'ga', sa:5, sb:4, ta:180, tb:176, date:'May 18', mvp:'TileMaster_TX' },
  { id:'r4', a:'fl', b:'il', sa:5, sb:4, ta:172, tb:168, date:'May 18', mvp:'MiamiTile' },
];

var BATTLE_GIFTS = [
  { id:'g1', e:'🎲', n:'Domino',   pts:5  },
  { id:'g2', e:'⚡', n:'Bolt',     pts:10 },
  { id:'g3', e:'💎', n:'Diamond',  pts:25 },
];

var SUBS = [['ranks','🏆 RANKS'],['bracket','⚔️ BRACKET'],['results','📋 RESULTS'],['predict','🗳️ PREDICT'],['battle','⚡ BATTLE'],['expand','🌎 EXPAND']];

function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function ftm(s) {
  var m = Math.floor(s / 60);
  var sec = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
}

function StateBadge(p) {
  var st = p.state;
  var sz = p.sz || 52;
  return (
    <div style={{ width: sz, height: sz, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: OCT_CLIP, background: 'linear-gradient(135deg,' + st.cp + 'cc,' + st.cp + '44)', boxShadow: p.glow ? '0 0 18px ' + st.cp + '66' : 'none', transition: 'box-shadow .3s' }} />
      <div style={{ position: 'absolute', inset: 3, clipPath: OCT_CLIP, background: '#07050A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <div style={{ fontSize: Math.max(10, sz * 0.28), lineHeight: 1 }}>{st.emoji}</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: Math.max(5, Math.floor(sz * 0.13)), color: '#EDE8F4', letterSpacing: 1, lineHeight: 1 }}>{st.abbr}</div>
      </div>
      {p.rank && (
        <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg,#800020,#C9A84C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#EDE8F4', zIndex: 3, border: '1px solid #07050A' }}>#{st.rank}</div>
      )}
    </div>
  );
}

export default function ShowcaseTab(p) {
  var addToast = p.addToast;
  var isLive   = p.isLive;

  var [sub,      setSub]      = useState('ranks');
  var [detail,   setDetail]   = useState(null);
  var [sortBy,   setSortBy]   = useState('rank');

  // bracket
  var [scores,   setScores]   = useState({ m1:{a:0,b:0}, m2:{a:0,b:0}, m3:{a:0,b:0}, m4:{a:0,b:0} });
  var [liveM,    setLiveM]    = useState(null);
  var [unlocked, setUnlocked] = useState({});
  var simRef = useRef(null);

  // predictions
  var [votes,   setVotes]   = useState({ m1:{a:62,b:38}, m2:{a:55,b:45}, m3:{a:48,b:52}, m4:{a:71,b:29} });
  var [myVotes, setMyVotes] = useState({});

  // battle
  var [battleId, setBattleId] = useState(null);
  var [blue,     setBlue]     = useState(0);
  var [red,      setRed]      = useState(0);
  var [battleOn, setBattleOn] = useState(false);
  var [timer,    setTimer]    = useState(300);
  var battleRef = useRef(null);

  // live clip capture
  var [liveClipCount,  setLiveClipCount]  = useState(0);
  var [captureFlash,   setCaptureFlash]   = useState(false);
  var [liveClipTimes,  setLiveClipTimes]  = useState([]);
  var captureRef = useRef(null);
  var flashRef   = useRef(null);

  // live viewer counts per state (simulated when isLive)
  var [viewerCounts, setViewerCounts] = useState({});
  var viewerRef = useRef(null);

  function getState(id) {
    for (var i = 0; i < STATES.length; i++) {
      if (STATES[i].id === id) return STATES[i];
    }
    return null;
  }

  // Live clip auto-capture
  useEffect(function() {
    if (!isLive) return;
    captureRef.current = setInterval(function() {
      var ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLiveClipCount(function(n) { return n + 1; });
      setLiveClipTimes(function(prev) { return prev.concat([ts]); });
      setCaptureFlash(true);
      if (addToast) addToast('🎬 Live clip captured', 'success');
      flashRef.current = setTimeout(function() {
        setCaptureFlash(false);
      }, 800);
    }, 15000);
    return function() {
      clearInterval(captureRef.current);
      clearTimeout(flashRef.current);
    };
  }, [isLive]);

  // Live viewer count simulation — only when isLive
  useEffect(function() {
    if (!isLive) {
      setViewerCounts({});
      return;
    }
    // Initialize with random viewer counts for streaming states
    var init = {};
    for (var i = 0; i < STATES.length; i++) {
      // Only WA (rank 1) is currently "streaming" by default; others have smaller counts
      if (STATES[i].rank === 1) {
        init[STATES[i].id] = Math.floor(Math.random() * 2000) + 1800;
      } else if (STATES[i].rank <= 3) {
        init[STATES[i].id] = Math.floor(Math.random() * 800) + 200;
      }
    }
    setViewerCounts(init);
    viewerRef.current = setInterval(function() {
      setViewerCounts(function(prev) {
        var next = {};
        var keys = Object.keys(prev);
        for (var k = 0; k < keys.length; k++) {
          var key = keys[k];
          var delta = Math.floor(Math.random() * 30) - 10;
          next[key] = Math.max(10, prev[key] + delta);
        }
        return next;
      });
    }, 4000);
    return function() { clearInterval(viewerRef.current); };
  }, [isLive]);

  // Match simulation
  useEffect(function() {
    if (!liveM) { clearInterval(simRef.current); return; }
    simRef.current = setInterval(function() {
      setScores(function(prev) {
        var n = Object.assign({}, prev);
        var cur = Object.assign({}, n[liveM]);
        if (Math.random() > 0.5) cur.a = Math.min(cur.a + 1, 7);
        else cur.b = Math.min(cur.b + 1, 7);
        if (cur.a >= 7 || cur.b >= 7) {
          clearInterval(simRef.current);
          var match = null;
          for (var j = 0; j < QF.length; j++) {
            if (QF[j].id === liveM) { match = QF[j]; break; }
          }
          if (match) {
            var winner = cur.a >= 7 ? getState(match.a) : getState(match.b);
            if (addToast && winner) addToast(winner.name + ' advances! 🏆', 'success');
          }
          setLiveM(null);
        }
        n[liveM] = cur;
        return n;
      });
    }, 600);
    return function() { clearInterval(simRef.current); };
  }, [liveM]);

  // Battle timer
  useEffect(function() {
    if (!battleOn) { clearInterval(battleRef.current); return; }
    battleRef.current = setInterval(function() {
      setTimer(function(t) {
        if (t <= 1) {
          clearInterval(battleRef.current);
          setBattleOn(false);
          if (addToast) addToast('State Battle complete! 🏆', 'success');
          return 0;
        }
        if (Math.random() > 0.5) setBlue(function(v) { return v + rnd(5, 55); });
        if (Math.random() > 0.5) setRed(function(v) { return v + rnd(5, 55); });
        return t - 1;
      });
    }, 1000);
    return function() { clearInterval(battleRef.current); };
  }, [battleOn]);

  useEffect(function() {
    return function() {
      clearInterval(simRef.current);
      clearInterval(battleRef.current);
      clearInterval(captureRef.current);
      clearTimeout(flashRef.current);
      clearInterval(viewerRef.current);
    };
  }, []);

  function startBattle(id) {
    setBattleId(id);
    setBlue(0);
    setRed(0);
    setTimer(300);
    setBattleOn(false);
    setSub('battle');
    setDetail(null);
  }

  function castVote(matchId, side) {
    if (myVotes[matchId]) return;
    setMyVotes(function(v) { return Object.assign({}, v, { [matchId]: side }); });
    setVotes(function(v) {
      var cur = Object.assign({}, v[matchId]);
      var delta = 3;
      if (side === 'a') { cur.a = cur.a + delta; cur.b = Math.max(0, cur.b - delta); }
      else { cur.b = cur.b + delta; cur.a = Math.max(0, cur.a - delta); }
      return Object.assign({}, v, { [matchId]: cur });
    });
    if (addToast) addToast('Vote locked in! 🗳️', 'success');
  }

  function copyProfileLink(st) {
    var url = 'https://seewhylive.online/creator/' + st.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() {
        if (addToast) addToast('Profile link copied: ' + url, 'success');
      }).catch(function() {
        if (addToast) addToast('Link: ' + url, 'info');
      });
    } else {
      if (addToast) addToast('Link: ' + url, 'info');
    }
  }

  var sorted = STATES.slice().sort(function(a, b) {
    if (sortBy === 'rank') return a.rank - b.rank;
    if (sortBy === 'pts')  return b.pts - a.pts;
    return b.w - a.w;
  });

  var battleSt = battleId ? getState(battleId) : null;
  var btot = (blue + red) || 1;
  var bPct = Math.floor((blue / btot) * 100);

  // ── SUB-TAB STYLE HELPERS ──────────────────────────────────
  var card = {
    background: 'rgba(22,16,32,.8)',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: 10,
    padding: '10px 12px',
    marginBottom: 8,
  };
  var headerCard = {
    background: 'rgba(201,168,76,.055)',
    border: '1px solid rgba(201,168,76,.22)',
    borderRadius: 10,
    padding: '10px 14px',
    marginBottom: 10,
    textAlign: 'center',
  };
  var hTitle = { fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#E8C46A', letterSpacing: 3, lineHeight: 1 };
  var hSub   = { fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 4, marginBottom: 2 };
  var mono7  = { fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#9A90AA' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#07050A' }}>

      {/* Sub-tab bar with LIVE CAPTURE indicator */}
      <div style={{ display: 'flex', overflowX: 'auto', background: '#0E0C09', borderBottom: '1px solid rgba(201,168,76,.12)', flexShrink: 0, msOverflowStyle: 'none', scrollbarWidth: 'none', alignItems: 'center' }}>
        {SUBS.map(function(t) {
          var on = sub === t[0];
          return (
            <button key={t[0]} onClick={function() { setSub(t[0]); setDetail(null); }}
              style={{ padding: '8px 11px', border: 'none', borderBottom: '2px solid ' + (on ? '#C9A84C' : 'transparent'), background: 'none', color: on ? '#E8C46A' : '#9A90AA', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '.04em', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'color .13s' }}>
              {t[1]}
            </button>
          );
        })}
        {isLive && (
          <div style={{ marginLeft: 'auto', marginRight: 8, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#FF1A3C', boxShadow: captureFlash ? '0 0 8px 3px rgba(255,26,60,.9)' : '0 0 4px 1px rgba(255,26,60,.4)', transition: 'box-shadow .3s' }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', letterSpacing: 1 }}>CAPTURING</span>
            {liveClipCount > 0 && (
              <span style={{ background: 'rgba(255,26,60,.2)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 999, padding: '1px 5px', fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#FF6B81' }}>{liveClipCount}</span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>

        {/* ══ RANKS ══ */}
        {sub === 'ranks' && !detail && (
          <div>
            <div style={headerCard}>
              <div style={hSub}>2026 SEASON · WEEK 8</div>
              <div style={hTitle}>STATE RANKINGS</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 8 }}>
                {[['8','STATES','#E8C46A'],['26','MATCHES','#00C9A7'],['4','QF LIVE','#E8FF47']].map(function(s) {
                  return (
                    <div key={s[1]} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: s[2], lineHeight: 1 }}>{s[0]}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#9A90AA' }}>{s[1]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NEW LIVE CLIPS section */}
            {liveClipCount > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#FF6B81', letterSpacing: 2, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#FF1A3C' }} />
                  NEW LIVE CLIPS
                  <span style={{ background: 'rgba(255,26,60,.2)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 999, padding: '1px 5px', fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#FF6B81' }}>{liveClipCount}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {(function() {
                    var clips = [];
                    for (var i = 0; i < liveClipCount; i++) {
                      var clipNum = i + 1;
                      var clipTime = liveClipTimes[i] || '';
                      clips.push(
                        <div key={i} style={{ background: 'rgba(255,26,60,.06)', border: '1px solid rgba(255,26,60,.25)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 16, flexShrink: 0 }}>📹</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4' }}>Live Clip #{clipNum}</div>
                            {clipTime && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>Captured at {clipTime}</div>}
                          </div>
                          <span style={{ background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 999, padding: '1px 6px', fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#FF6B81', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#FF1A3C' }} />
                            LIVE
                          </span>
                        </div>
                      );
                    }
                    return clips;
                  })()}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 5, marginBottom: 9 }}>
              {[['rank','RANK'],['pts','PTS'],['wl','W-L']].map(function(pair) {
                var isA = sortBy === pair[0];
                return (
                  <button key={pair[0]} onClick={function() { setSortBy(pair[0]); }}
                    style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: '1px solid ' + (isA ? '#C01838' : 'rgba(201,168,76,.1)'), background: isA ? 'linear-gradient(135deg,#800020,#C01838)' : 'rgba(22,16,32,.5)', color: isA ? '#E8C46A' : '#9A90AA', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
                    {pair[1]}
                  </button>
                );
              })}
            </div>

            {sorted.map(function(st, idx) {
              var total  = (st.w + st.l) || 1;
              var winPct = Math.floor((st.w / total) * 100);
              var isFeatured = st.rank === 1;
              var liveViewers = viewerCounts[st.id] || 0;
              var isStreaming = isLive && liveViewers > 0;
              return (
                <div key={st.id} style={{ position: 'relative' }}>
                  {/* FEATURED badge on top-ranked state */}
                  {isFeatured && (
                    <div style={{ position: 'absolute', top: -8, left: 12, zIndex: 10, background: 'linear-gradient(90deg,#C9A84C,#E8C46A)', borderRadius: 4, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#07050A', fontWeight: 700, letterSpacing: 2 }}>
                      ★ FEATURED
                    </div>
                  )}
                  <div onClick={function() { setDetail(st); }}
                    style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + (isFeatured ? '#C9A84C55' : st.rank <= 3 ? st.cp + '44' : 'rgba(255,255,255,.07)'), borderRadius: 10, padding: '10px 12px', marginBottom: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, marginTop: isFeatured ? 6 : 0 }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: st.rank <= 3 ? 20 : 15, color: st.rank === 1 ? '#E8C46A' : st.rank === 2 ? '#C0C0C0' : st.rank === 3 ? '#cd7f32' : '#9A90AA', width: 22, textAlign: 'center', flexShrink: 0, lineHeight: 1 }}>#{st.rank}</div>
                    <StateBadge state={st} sz={46} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#EDE8F4', letterSpacing: 1, lineHeight: 1 }}>{st.name}</div>
                        {st.streak >= 3 && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#E8FF47' }}>{st.streak}🔥</span>}
                        {isStreaming && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(255,26,60,.18)', border: '1px solid rgba(255,26,60,.45)', borderRadius: 999, padding: '1px 5px', flexShrink: 0 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF1A3C', display: 'inline-block' }} />
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#FF6B81' }}>LIVE {liveViewers.toLocaleString()}</span>
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#9A90AA', marginBottom: 4 }}>{st.captain} · {st.region}</div>
                      <div style={{ height: 3, background: '#241C34', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: winPct + '%', height: '100%', background: 'linear-gradient(90deg,' + st.cp + ',' + st.cs + ')' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#EDE8F4', lineHeight: 1 }}>{st.pts}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#00C9A7' }}>{st.w}W-{st.l}L</div>
                      </div>
                      <button
                        onClick={function(e) { e.stopPropagation(); copyProfileLink(st); }}
                        style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 5, padding: '2px 6px', color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 6.5, cursor: 'pointer', letterSpacing: 1 }}>
                        🔗 SHARE
                      </button>
                    </div>
                    <div style={{ color: '#4A4060', fontSize: 12 }}>›</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ STATE DETAIL ══ */}
        {sub === 'ranks' && detail && (
          <div>
            <button onClick={function() { setDetail(null); }}
              style={{ background: 'rgba(22,16,32,.8)', border: '1px solid rgba(201,168,76,.12)', borderRadius: 6, padding: '5px 12px', color: '#9A90AA', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', marginBottom: 10 }}>
              ‹ BACK
            </button>
            <div style={{ background: 'rgba(201,168,76,.055)', border: '1px solid rgba(201,168,76,.22)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: 4, background: 'linear-gradient(90deg,' + detail.cp + ',' + detail.cs + ')' }} />
              <div style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <StateBadge state={detail} sz={68} glow={true} rank={true} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: '#EDE8F4', letterSpacing: 2, lineHeight: 1, marginBottom: 2 }}>{detail.name}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', letterSpacing: 2, marginBottom: 6 }}>2026 SEASON · RANK #{detail.rank}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#9A90AA', lineHeight: 1.4 }}>{detail.bio}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 10 }}>
              {[['WINS', String(detail.w), '#E8FF47'],['LOSSES', String(detail.l), '#FF6B81'],['POINTS', String(detail.pts), '#E8C46A'],['TILES', (Math.floor(detail.tiles / 100) / 10) + 'k', '#00C9A7']].map(function(s) {
                return (
                  <div key={s[0]} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: s[2], lineHeight: 1 }}>{s[1]}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#4A4060', marginTop: 2 }}>{s[0]}</div>
                  </div>
                );
              })}
            </div>
            <div style={Object.assign({}, card, { marginBottom: 10 })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={mono7}>WIN RATE</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#E8FF47' }}>{Math.floor((detail.w / ((detail.w + detail.l) || 1)) * 100)}%</span>
              </div>
              <div style={{ height: 6, background: '#241C34', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: Math.floor((detail.w / ((detail.w + detail.l) || 1)) * 100) + '%', height: '100%', background: 'linear-gradient(90deg,' + detail.cp + ',' + detail.cs + ')' }} />
              </div>
            </div>
            <div style={Object.assign({}, card, { marginBottom: 10 })}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', letterSpacing: 2, marginBottom: 8 }}>ROSTER</div>
              {detail.roster.map(function(player, i) {
                var isCap = player === detail.captain;
                var isCo  = player === detail.co;
                return (
                  <div key={player} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < detail.roster.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                    <AvatarPortrait username={player} size={32} rank={isCap ? 1 : isCo ? 2 : undefined} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: isCap ? '#E8C46A' : '#EDE8F4' }}>{player}</div>
                      {isCap && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#C9A84C' }}>CAPTAIN</div>}
                      {isCo  && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#00C9A7' }}>CO-CAPTAIN</div>}
                    </div>
                    {isCap && <span style={{ fontSize: 14 }}>👑</span>}
                  </div>
                );
              })}
            </div>
            <div style={Object.assign({}, card, { marginBottom: 10 })}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', letterSpacing: 2, marginBottom: 4 }}>HOME VENUE</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#EDE8F4' }}>{detail.city}</div>
            </div>
            {/* Share button in detail view */}
            <button onClick={function() { copyProfileLink(detail); }}
              style={{ width: '100%', padding: '10px', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, color: '#C9A84C', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 3, cursor: 'pointer', marginBottom: 8 }}>
              🔗 COPY PROFILE LINK
            </button>
            <button onClick={function() { startBattle(detail.id); }}
              style={{ width: '100%', padding: '12px', background: 'rgba(0,255,255,.08)', border: '1px solid rgba(0,255,255,.3)', borderRadius: 10, color: '#00FFFF', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 3, cursor: 'pointer' }}>
              ⚡ LAUNCH STATE FADES BATTLE
            </button>
          </div>
        )}

        {/* ══ BRACKET ══ */}
        {sub === 'bracket' && (
          <div>
            <div style={headerCard}>
              <div style={hSub}>2026 STATE SHOWCASE</div>
              <div style={hTitle}>QUARTERFINALS</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#00C9A7', marginTop: 3, letterSpacing: 2 }}>JUNE 7–8 · BEST OF 7</div>
            </div>
            {QF.map(function(match) {
              var stA   = getState(match.a);
              var stB   = getState(match.b);
              var sc    = scores[match.id];
              var isL   = liveM === match.id;
              var isU   = unlocked[match.id];
              var price = parseFloat(match.ppv) || 4.99;
              var vt    = votes[match.id];
              var myV   = myVotes[match.id];
              if (!stA || !stB) return null;
              return (
                <div key={match.id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + (isL ? 'rgba(255,26,60,.5)' : 'rgba(255,255,255,.07)'), borderRadius: 10, padding: '12px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ background: isL ? 'rgba(192,24,56,.22)' : 'transparent', border: '1px solid ' + (isL ? '#C01838' : 'rgba(255,255,255,.07)'), borderRadius: 999, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: isL ? '#FF6B81' : '#9A90AA', letterSpacing: 1 }}>{isL ? '🔴 LIVE' : match.date}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#4A4060' }}>PPV ${price.toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <StateBadge state={stA} sz={54} glow={isL} />
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#EDE8F4', letterSpacing: 1 }}>{stA.abbr}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#9A90AA' }}>#{stA.rank}</div>
                      {isL && <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, color: '#E8FF47', lineHeight: 1 }}>{sc.a}</div>}
                    </div>
                    <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C01838', letterSpacing: 2 }}>VS</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <StateBadge state={stB} sz={54} glow={isL} />
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#EDE8F4', letterSpacing: 1 }}>{stB.abbr}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#9A90AA' }}>#{stB.rank}</div>
                      {isL && <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, color: '#E8FF47', lineHeight: 1 }}>{sc.b}</div>}
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {!isU ? (
                      <button
                        onClick={function() {
                          setUnlocked(function(u) { return Object.assign({}, u, { [match.id]: true }); });
                          var earn = '$' + (Math.floor(price * CREATOR * 100) / 100).toFixed(2);
                          if (addToast) addToast('Match unlocked! 🔓 ' + earn + ' to you', 'success');
                        }}
                        style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#800020,#C9A84C)', border: 'none', borderRadius: 8, color: '#07050A', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 2, cursor: 'pointer' }}>
                        🔓 UNLOCK PPV ${price.toFixed(2)}
                      </button>
                    ) : (
                      <button
                        onClick={function() {
                          if (liveM === match.id) {
                            setLiveM(null);
                          } else {
                            setScores(function(prev) { return Object.assign({}, prev, { [match.id]: { a: 0, b: 0 } }); });
                            setLiveM(match.id);
                          }
                        }}
                        style={{ width: '100%', padding: '10px', background: isL ? 'rgba(192,24,56,.15)' : 'linear-gradient(135deg,#800020,#C01838)', border: '1px solid ' + (isL ? '#C01838' : 'transparent'), borderRadius: 8, color: isL ? '#FF6B81' : '#E8C46A', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 2, cursor: 'pointer' }}>
                        {isL ? '■ STOP MATCH' : '▶ SIMULATE MATCH'}
                      </button>
                    )}
                  </div>
                  <div style={{ marginTop: 9 }}>
                    <div style={{ height: 5, borderRadius: 3, overflow: 'hidden', display: 'flex', marginBottom: 3 }}>
                      <div style={{ width: vt.a + '%', background: 'linear-gradient(90deg,' + stA.cp + ',' + stA.cs + ')', transition: 'width .5s ease' }} />
                      <div style={{ flex: 1, background: 'linear-gradient(90deg,' + stB.cp + ',' + stB.cs + ')' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={mono7}>{stA.abbr} {vt.a}%</span>
                      {myV && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#E8FF47' }}>✓ Voted</span>}
                      <span style={mono7}>{vt.b}% {stB.abbr}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ RESULTS ══ */}
        {sub === 'results' && (
          <div>
            <div style={headerCard}>
              <div style={hSub}>2026 SEASON</div>
              <div style={hTitle}>RECENT RESULTS</div>
            </div>
            {RESULTS.map(function(r) {
              var stA = getState(r.a);
              var stB = getState(r.b);
              if (!stA || !stB) return null;
              var totalTiles = (r.ta + r.tb) || 1;
              return (
                <div key={r.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={mono7}>{r.date}</span>
                    {r.mvp && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <AvatarPortrait username={r.mvp} size={22} rank={1} />
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C' }}>MVP: {r.mvp}</span>
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <StateBadge state={stA} sz={44} />
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#EDE8F4' }}>{stA.abbr}</div>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#E8FF47', lineHeight: 1 }}>{r.sa}</div>
                    </div>
                    <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#4A4060', letterSpacing: 1 }}>FINAL</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#4A4060', marginTop: 2 }}>Δ{Math.abs(r.ta - r.tb)}T</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <StateBadge state={stB} sz={44} />
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#EDE8F4' }}>{stB.abbr}</div>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#FF6B81', lineHeight: 1 }}>{r.sb}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, height: 3, background: '#241C34', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: Math.floor((r.ta / totalTiles) * 100) + '%', height: '100%', background: 'linear-gradient(90deg,' + stA.cp + ',' + stA.cs + ')' }} />
                    <div style={{ flex: 1, background: 'linear-gradient(90deg,' + stB.cp + ',' + stB.cs + ')' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#4A4060' }}>{r.ta} tiles</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#4A4060' }}>{r.tb} tiles</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ PREDICT ══ */}
        {sub === 'predict' && (
          <div>
            <div style={headerCard}>
              <div style={hSub}>COMMUNITY</div>
              <div style={hTitle}>PREDICTIONS</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#9A90AA', marginTop: 3 }}>Vote on quarterfinal outcomes</div>
            </div>
            {QF.map(function(match) {
              var stA = getState(match.a);
              var stB = getState(match.b);
              var vt  = votes[match.id];
              var myV = myVotes[match.id];
              if (!stA || !stB) return null;
              return (
                <div key={match.id} style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <StateBadge state={stA} sz={36} />
                    <div style={{ flex: 1, textAlign: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C01838', letterSpacing: 2 }}>VS</div>
                    <StateBadge state={stB} sz={36} />
                  </div>
                  <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
                    <div style={{ width: vt.a + '%', background: 'linear-gradient(90deg,' + stA.cp + ',' + stA.cs + ')', transition: 'width .8s ease' }} />
                    <div style={{ flex: 1, background: 'linear-gradient(90deg,' + stB.cp + ',' + stB.cs + ')' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#EDE8F4' }}>{stA.abbr} {vt.a}%</span>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#EDE8F4' }}>{vt.b}% {stB.abbr}</span>
                  </div>
                  {myV ? (
                    <div style={{ textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#E8FF47' }}>
                      ✓ You voted: {myV === 'a' ? stA.abbr : stB.abbr}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={function() { castVote(match.id, 'a'); }}
                        style={{ flex: 1, padding: '9px', background: 'linear-gradient(135deg,' + stA.cp + ',' + stA.cs + ')', border: 'none', borderRadius: 7, color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 2, cursor: 'pointer' }}>
                        {stA.abbr} WINS
                      </button>
                      <button onClick={function() { castVote(match.id, 'b'); }}
                        style={{ flex: 1, padding: '9px', background: 'linear-gradient(135deg,' + stB.cp + ',' + stB.cs + ')', border: 'none', borderRadius: 7, color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 2, cursor: 'pointer' }}>
                        {stB.abbr} WINS
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ BATTLE ══ */}
        {sub === 'battle' && (
          <div>
            <div style={{ background: 'rgba(0,255,255,.04)', border: '1px solid rgba(0,255,255,.18)', borderRadius: 10, padding: '14px', marginBottom: 10, textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#00FFFF', letterSpacing: 5, marginBottom: 6 }}>STATE FADES BATTLE</div>
              {battleSt && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
                  <StateBadge state={battleSt} sz={48} glow={battleOn} />
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#E8C46A', letterSpacing: 2 }}>{battleSt.name}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#9A90AA' }}>FADES ONLINE</div>
                  </div>
                </div>
              )}
              {!battleSt && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#9A90AA', marginBottom: 8 }}>Select a state below</div>}
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: timer < 60 ? '#FF0040' : '#E8FF47', lineHeight: 1, marginBottom: 8 }}>{ftm(timer)}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {!battleOn && (
                  <button onClick={function() { if (battleSt) { setBattleOn(true); setBlue(0); setRed(0); setTimer(300); if (addToast) addToast('State Battle LIVE! ⚡', 'success'); } }}
                    disabled={!battleSt}
                    style={{ padding: '9px 20px', background: battleSt ? 'rgba(0,255,255,.08)' : 'rgba(22,16,32,.5)', border: '1px solid ' + (battleSt ? 'rgba(0,255,255,.3)' : 'rgba(255,255,255,.07)'), borderRadius: 8, color: battleSt ? '#00FFFF' : '#4A4060', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 3, cursor: battleSt ? 'pointer' : 'not-allowed' }}>
                    ▶ START BATTLE
                  </button>
                )}
                {battleOn && (
                  <button onClick={function() { setBattleOn(false); clearInterval(battleRef.current); }}
                    style={{ padding: '9px 20px', background: 'rgba(192,24,56,.15)', border: '1px solid #C01838', borderRadius: 8, color: '#FF6B81', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 3, cursor: 'pointer' }}>
                    ■ ABORT
                  </button>
                )}
              </div>
            </div>
            <div style={Object.assign({}, card, { marginBottom: 10 })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: '#00FFFF' }}>🔵 {blue}</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#9A90AA' }}>BLUE</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: '#FF0040' }}>{red} 🔴</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#9A90AA' }}>RED</div></div>
              </div>
              <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex', background: '#07050A' }}>
                <div style={{ width: bPct + '%', background: 'linear-gradient(90deg,#00FFFF,#1A6BFF)', transition: 'width .5s ease' }} />
                <div style={{ flex: 1, background: 'linear-gradient(90deg,#FF0040,#800020)' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {['blue', 'red'].map(function(team) {
                var tc = team === 'blue' ? '#00FFFF' : '#FF0040';
                return (
                  <div key={team} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + tc + '33', borderRadius: 10, padding: '10px' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: tc, letterSpacing: 2, marginBottom: 7, textAlign: 'center' }}>⚡ {team.toUpperCase()}</div>
                    {BATTLE_GIFTS.map(function(g) {
                      return (
                        <button key={g.id}
                          onClick={function() { if (team === 'blue') setBlue(function(v) { return v + g.pts; }); else setRed(function(v) { return v + g.pts; }); }}
                          style={{ width: '100%', marginBottom: 4, background: tc + '0d', border: '1px solid ' + tc + '33', borderRadius: 6, padding: '6px 0', color: tc, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                          {g.e} {g.n} <span style={{ color: '#E8FF47', fontFamily: "'DM Mono',monospace", fontSize: 9 }}>+{g.pts}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', letterSpacing: 2, marginBottom: 8 }}>PICK A STATE</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {STATES.map(function(st) {
                var isSel = battleId === st.id;
                return (
                  <div key={st.id}
                    onClick={function() { setBattleId(st.id); setBattleOn(false); setBlue(0); setRed(0); setTimer(300); }}
                    style={{ cursor: 'pointer', opacity: isSel ? 1 : 0.55, transform: isSel ? 'scale(1.1)' : 'scale(1)', transition: 'all .14s' }}>
                    <StateBadge state={st} sz={46} glow={isSel} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ EXPAND ══ */}
        {sub === 'expand' && (
          <div>
            <div style={headerCard}>
              <div style={hSub}>SEASON 2 ROADMAP</div>
              <div style={hTitle}>50-STATE EXPANSION</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#9A90AA', marginTop: 5 }}>Season 1 has 8 states. Apply to represent yours in Season 2.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 12 }}>
              {[['50','TOTAL STATES','🗺️','#E8FF47'],['8','SEASON 1','⚡','#E8C46A'],['42','QUALIFYING','⏳','#00C9A7']].map(function(k) {
                return (
                  <div key={k[1]} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 9, padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, marginBottom: 2 }}>{k[2]}</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: k[3], lineHeight: 1 }}>{k[0]}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#4A4060', marginTop: 2 }}>{k[1]}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#00C9A7', letterSpacing: 2, marginBottom: 8 }}>SEASON 1 ACTIVE ({STATES.length} States)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
              {STATES.map(function(st) {
                return (
                  <div key={st.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <StateBadge state={st} sz={46} rank={true} />
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#9A90AA' }}>{st.abbr}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', letterSpacing: 2, marginBottom: 8 }}>SEASON 2 QUALIFYING</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
              {FUTURE.map(function(fs) {
                return (
                  <div key={fs.id} style={{ background: 'rgba(22,16,32,.5)', border: '1px dashed ' + fs.cp + '44', borderRadius: 10, padding: '10px 12px', opacity: .7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 34, height: 34, position: 'relative', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', inset: 0, clipPath: OCT_CLIP, background: fs.cp + '22' }} />
                        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{fs.emoji}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#9A90AA' }}>{fs.name}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#4A4060' }}>{fs.region} · QUALIFYING</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: 'rgba(0,201,167,.06)', border: '1px solid rgba(0,201,167,.28)', borderRadius: 10, padding: '14px' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#00C9A7', letterSpacing: 2, marginBottom: 5 }}>🌎 APPLY FOR YOUR STATE</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#9A90AA', marginBottom: 10, lineHeight: 1.5 }}>Min. 5 players · Regional qualifying · Live stream required on SeeWhy LIVE</div>
              <button onClick={function() { if (addToast) addToast('Application opened! 🌎', 'success'); }}
                style={{ width: '100%', padding: '11px', background: 'rgba(0,201,167,.15)', border: '1px solid rgba(0,201,167,.4)', borderRadius: 8, color: '#00C9A7', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 2, cursor: 'pointer' }}>
                APPLY NOW →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
