import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

var GOLD  = '#C9A84C';
var BG    = '#0E0C09';
var CREAM = '#F0E8D4';
var RED   = '#FF1A3C';
var FONT  = 'Barlow Condensed, sans-serif';

var inp = {
  width: '100%', padding: '10px 12px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: CREAM, fontSize: 13, outline: 'none', fontFamily: 'inherit',
};
var lbl = {
  display: 'block', fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.4)',
  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14,
};
var card = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12, padding: 16, marginBottom: 12,
};

var GENRES   = ['Thriller', 'Drama', 'Sci-Fi', 'Comedy', 'Romance', 'Horror', 'Action', 'Documentary'];
var TONES    = ['Dark & Gritty', 'Lighthearted', 'Suspenseful', 'Inspirational', 'Raw & Real', 'Cinematic'];
var STATUSES = ['Draft', 'In Review', 'Scheduled', 'Released'];
var STATUS_COLORS = { Draft: '#8B8B8B', 'In Review': GOLD, Scheduled: '#60A5FA', Released: '#22C55E' };

var PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok',          icon: '🎵', color: '#ff0050' },
  { id: 'instagram', label: 'Instagram Reels',  icon: '📸', color: '#E1306C' },
  { id: 'youtube',   label: 'YouTube Shorts',   icon: '▶️',  color: '#FF0000' },
  { id: 'seewhy',    label: 'SeeWhy LIVE',      icon: '📡', color: GOLD       },
];

var DEFAULT_CHECKLIST = [
  'Script finalized and reviewed',
  'AI art / storyboard assets created',
  'Voice-over recorded or AI-generated',
  'Thumbnail / cover art designed',
  'Caption / subtitle file ready',
  'Platform clips cut to format',
  'Viewer poll question written',
  'Distribution links prepared',
];

function StoryBibleTab(props) {
  var bible = props.bible;
  var setBible = props.setBible;

  function set(field, val) {
    setBible(function(b) { return Object.assign({}, b, { [field]: val }); });
  }

  return (
    <div>
      <div style={card}>
        <p style={{ fontFamily: FONT, fontWeight: 900, fontSize: 14, color: GOLD, margin: '0 0 10px' }}>📖 Story Bible</p>
        <label style={lbl}>Series Title *</label>
        <input style={inp} value={bible.title} onChange={function(e) { set('title', e.target.value); }} placeholder="e.g. Shadow Reign" maxLength={80} />
        <label style={lbl}>Logline (one sentence)</label>
        <input style={inp} value={bible.logline} onChange={function(e) { set('logline', e.target.value); }} placeholder="A power struggle inside a secret dynasty that runs an entire city." maxLength={180} />
        <label style={lbl}>Genre</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 2 }}>
          {GENRES.map(function(g) {
            var sel = bible.genre === g;
            return (
              <button key={g} onClick={function() { set('genre', g); }}
                style={{ padding: '5px 12px', borderRadius: 99, fontFamily: FONT, fontWeight: 900, fontSize: 11, letterSpacing: '0.07em', cursor: 'pointer', background: sel ? GOLD + '22' : 'rgba(0,0,0,0.3)', border: '1px solid ' + (sel ? GOLD + '66' : 'rgba(255,255,255,0.1)'), color: sel ? GOLD : 'rgba(255,255,255,0.4)' }}>
                {g}
              </button>
            );
          })}
        </div>
        <label style={lbl}>Tone</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 2 }}>
          {TONES.map(function(t) {
            var sel = bible.tone === t;
            return (
              <button key={t} onClick={function() { set('tone', t); }}
                style={{ padding: '5px 12px', borderRadius: 99, fontFamily: FONT, fontWeight: 900, fontSize: 11, letterSpacing: '0.07em', cursor: 'pointer', background: sel ? 'rgba(96,165,250,0.15)' : 'rgba(0,0,0,0.3)', border: '1px solid ' + (sel ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)'), color: sel ? '#60A5FA' : 'rgba(255,255,255,0.4)' }}>
                {t}
              </button>
            );
          })}
        </div>
        <label style={lbl}>World / Setting</label>
        <textarea style={Object.assign({}, inp, { height: 72, resize: 'none' })} value={bible.world} onChange={function(e) { set('world', e.target.value); }} placeholder="Describe where and when your story takes place…" />
        <label style={lbl}>Core Conflict</label>
        <textarea style={Object.assign({}, inp, { height: 72, resize: 'none' })} value={bible.conflict} onChange={function(e) { set('conflict', e.target.value); }} placeholder="What is the central tension driving the entire series?" />
      </div>

      <div style={card}>
        <p style={{ fontFamily: FONT, fontWeight: 900, fontSize: 14, color: GOLD, margin: '0 0 10px' }}>👥 Characters</p>
        <textarea style={Object.assign({}, inp, { height: 100, resize: 'none' })} value={bible.characters} onChange={function(e) { set('characters', e.target.value); }} placeholder="Name: Role — one line per character. e.g.&#10;Maya: The reluctant heir to the Shadow dynasty&#10;Victor: Her estranged father, the current patriarch" />
      </div>
    </div>
  );
}

function EpisodePlannerTab(props) {
  var episodes = props.episodes;
  var setEpisodes = props.setEpisodes;

  function addEpisode() {
    var nextEp = episodes.length + 1;
    setEpisodes(function(eps) {
      return eps.concat([{ id: Date.now(), season: 1, ep: nextEp, title: '', synopsis: '', status: 'Draft', releaseDate: '' }]);
    });
  }

  function updateEpisode(id, field, val) {
    setEpisodes(function(eps) {
      return eps.map(function(ep) {
        return ep.id === id ? Object.assign({}, ep, { [field]: val }) : ep;
      });
    });
  }

  function removeEpisode(id) {
    setEpisodes(function(eps) { return eps.filter(function(ep) { return ep.id !== id; }); });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontFamily: FONT, fontWeight: 900, fontSize: 13, color: GOLD, margin: 0 }}>📋 Episode Planner</p>
        <button onClick={addEpisode}
          style={{ padding: '6px 14px', borderRadius: 8, fontFamily: FONT, fontWeight: 900, fontSize: 11, letterSpacing: '0.07em', cursor: 'pointer', background: GOLD + '18', border: '1px solid ' + GOLD + '44', color: GOLD }}>
          + Add Episode
        </button>
      </div>
      {episodes.length === 0 && (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '24px 0' }}>No episodes yet — click "+ Add Episode" to start planning.</p>
      )}
      {episodes.map(function(ep) {
        var statusColor = STATUS_COLORS[ep.status] || '#8B8B8B';
        return (
          <div key={ep.id} style={Object.assign({}, card, { borderColor: statusColor + '33' })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>S{ep.season}E{ep.ep}</span>
              <input style={Object.assign({}, inp, { flex: 1, padding: '7px 10px' })} value={ep.title} onChange={function(e) { updateEpisode(ep.id, 'title', e.target.value); }} placeholder="Episode title…" />
              <select value={ep.status} onChange={function(e) { updateEpisode(ep.id, 'status', e.target.value); }}
                style={{ padding: '7px 10px', borderRadius: 8, background: statusColor + '22', border: '1px solid ' + statusColor + '55', color: statusColor, fontFamily: FONT, fontWeight: 900, fontSize: 11, cursor: 'pointer', outline: 'none', flexShrink: 0 }}>
                {STATUSES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
              </select>
              <button onClick={function() { removeEpisode(ep.id); }}
                style={{ padding: '6px 8px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,26,60,0.2)', color: 'rgba(255,26,60,0.5)', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>
                ✕
              </button>
            </div>
            <textarea style={Object.assign({}, inp, { height: 60, resize: 'none', marginBottom: 8 })} value={ep.synopsis} onChange={function(e) { updateEpisode(ep.id, 'synopsis', e.target.value); }} placeholder="Episode synopsis / story beat…" />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={Object.assign({}, lbl, { marginTop: 0 })}>Release Date</label>
                <input type="date" style={inp} value={ep.releaseDate} onChange={function(e) { updateEpisode(ep.id, 'releaseDate', e.target.value); }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={Object.assign({}, lbl, { marginTop: 0 })}>Season</label>
                <input type="number" min="1" max="10" style={inp} value={ep.season} onChange={function(e) { updateEpisode(ep.id, 'season', Number(e.target.value)); }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChecklistTab(props) {
  var episodes = props.episodes;
  var [selectedEp, setSelectedEp] = useState(null);
  var [checks, setChecks] = useState({});

  var epId = selectedEp;
  var epChecks = (epId && checks[epId]) || DEFAULT_CHECKLIST.map(function() { return false; });

  function toggleCheck(idx) {
    if (!epId) return;
    setChecks(function(c) {
      var curr = c[epId] || DEFAULT_CHECKLIST.map(function() { return false; });
      var next = curr.slice();
      next[idx] = !next[idx];
      return Object.assign({}, c, { [epId]: next });
    });
  }

  var completed = epChecks.filter(Boolean).length;

  return (
    <div>
      <p style={{ fontFamily: FONT, fontWeight: 900, fontSize: 14, color: GOLD, margin: '0 0 12px' }}>✅ Production Checklist</p>
      {episodes.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '24px 0' }}>Add episodes in the Episode Planner tab first.</p>
      ) : (
        <div>
          <label style={lbl}>Select Episode</label>
          <select value={epId || ''} onChange={function(e) { setSelectedEp(e.target.value); }}
            style={Object.assign({}, inp, { marginBottom: 16, cursor: 'pointer' })}>
            <option value="">— choose episode —</option>
            {episodes.map(function(ep) {
              return <option key={ep.id} value={ep.id}>S{ep.season}E{ep.ep} {ep.title || '(untitled)'}</option>;
            })}
          </select>
          {epId && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>PROGRESS</span>
                <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 12, color: completed === DEFAULT_CHECKLIST.length ? '#22C55E' : GOLD }}>{completed}/{DEFAULT_CHECKLIST.length}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 14, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: completed === DEFAULT_CHECKLIST.length ? '#22C55E' : GOLD, width: (completed / DEFAULT_CHECKLIST.length * 100) + '%', transition: 'width 0.3s' }} />
              </div>
              {DEFAULT_CHECKLIST.map(function(item, idx) {
                var done = epChecks[idx];
                return (
                  <div key={idx} onClick={function() { toggleCheck(idx); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, marginBottom: 6, cursor: 'pointer', background: done ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.025)', border: '1px solid ' + (done ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'), transition: 'all 0.15s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#22C55E' : 'transparent', border: '2px solid ' + (done ? '#22C55E' : 'rgba(255,255,255,0.2)'), fontSize: 11, color: '#000', fontWeight: 900 }}>
                      {done ? '✓' : ''}
                    </div>
                    <span style={{ fontSize: 13, color: done ? '#22C55E' : CREAM, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.7 : 1 }}>{item}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DistributionTab(props) {
  var episodes = props.episodes;
  var [selectedEp, setSelectedEp] = useState(null);
  var [pushed, setPushed] = useState({});
  var [pushing, setPushing] = useState({});

  function handlePush(platId) {
    if (!selectedEp) return;
    var key = selectedEp + ':' + platId;
    if (pushed[key]) return;
    setPushing(function(p) { return Object.assign({}, p, { [key]: true }); });
    setTimeout(function() {
      setPushing(function(p) { return Object.assign({}, p, { [key]: false }); });
      setPushed(function(p) { return Object.assign({}, p, { [key]: true }); });
    }, 1400);
  }

  return (
    <div>
      <p style={{ fontFamily: FONT, fontWeight: 900, fontSize: 14, color: GOLD, margin: '0 0 12px' }}>📡 Distribution</p>
      {episodes.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '24px 0' }}>Add episodes in the Episode Planner tab first.</p>
      ) : (
        <div>
          <label style={lbl}>Select Episode to Distribute</label>
          <select value={selectedEp || ''} onChange={function(e) { setSelectedEp(e.target.value); }}
            style={Object.assign({}, inp, { marginBottom: 16, cursor: 'pointer' })}>
            <option value="">— choose episode —</option>
            {episodes.filter(function(ep) { return ep.status === 'Released' || ep.status === 'Scheduled'; }).map(function(ep) {
              return <option key={ep.id} value={ep.id}>S{ep.season}E{ep.ep} {ep.title || '(untitled)'} [{ep.status}]</option>;
            })}
          </select>
          {!selectedEp && episodes.filter(function(ep) { return ep.status === 'Released' || ep.status === 'Scheduled'; }).length === 0 && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '0 0 16px' }}>Mark episodes as "Scheduled" or "Released" in the Episode Planner to enable distribution.</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PLATFORMS.map(function(plat) {
              var key = selectedEp + ':' + plat.id;
              var isDone = pushed[key];
              var isBusy = pushing[key];
              return (
                <div key={plat.id} style={{ padding: '14px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid ' + (isDone ? plat.color + '55' : 'rgba(255,255,255,0.08)'), textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{plat.icon}</div>
                  <p style={{ fontFamily: FONT, fontWeight: 900, fontSize: 12, color: CREAM, margin: '0 0 10px' }}>{plat.label}</p>
                  <button
                    onClick={function() { handlePush(plat.id); }}
                    disabled={!selectedEp || isBusy || isDone}
                    style={{ width: '100%', padding: '7px 0', borderRadius: 8, fontFamily: FONT, fontWeight: 900, fontSize: 11, letterSpacing: '0.07em', cursor: (selectedEp && !isBusy && !isDone) ? 'pointer' : 'default', background: isDone ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (isDone ? '#22C55E' : plat.color + '44'), color: isDone ? '#22C55E' : (selectedEp ? plat.color : 'rgba(255,255,255,0.3)'), opacity: !selectedEp ? 0.4 : 1 }}
                  >
                    {isDone ? '✓ Pushed' : isBusy ? 'Pushing…' : 'Push Now'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EpisodeCreatorStudio() {
  var [tab, setTab] = useState('bible');
  var [bible, setBible] = useState({ title: '', logline: '', genre: 'Drama', tone: 'Dark & Gritty', world: '', conflict: '', characters: '' });
  var [episodes, setEpisodes] = useState([]);

  var TABS = [
    { id: 'bible',    label: '📖 Story Bible' },
    { id: 'planner',  label: '📋 Episodes' },
    { id: 'checklist',label: '✅ Checklist' },
    { id: 'dist',     label: '📡 Distribute' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: CREAM, fontFamily: 'sans-serif' }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(14,12,9,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(201,168,76,0.12)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to={createPageUrl('EpisodeSeries')} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>‹</Link>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 14, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>🎬 Episode Creator Studio</span>
        <div style={{ flex: 1 }} />
        <Link to={createPageUrl('GoLive')} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 10, color: RED, letterSpacing: '0.1em', textDecoration: 'none', border: '1px solid ' + RED + '55', padding: '4px 10px', borderRadius: 6 }}>
          🔴 GO LIVE
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(14,12,9,0.95)', position: 'sticky', top: 50, zIndex: 90, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(function(t) {
          var active = tab === t.id;
          return (
            <button key={t.id} onClick={function() { setTab(t.id); }}
              style={{ flexShrink: 0, padding: '12px 16px', background: 'none', border: 'none', borderBottom: '2px solid ' + (active ? GOLD : 'transparent'), cursor: 'pointer', fontFamily: FONT, fontWeight: 900, fontSize: 12, letterSpacing: '0.07em', color: active ? GOLD : 'rgba(255,255,255,0.4)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 60px' }}>
        {tab === 'bible'    && <StoryBibleTab bible={bible} setBible={setBible} />}
        {tab === 'planner'  && <EpisodePlannerTab episodes={episodes} setEpisodes={setEpisodes} />}
        {tab === 'checklist'&& <ChecklistTab episodes={episodes} />}
        {tab === 'dist'     && <DistributionTab episodes={episodes} />}
      </div>

      {/* Bottom CTA bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(14,12,9,0.97)', borderTop: '1px solid rgba(201,168,76,0.12)', padding: '10px 16px', display: 'flex', gap: 10 }}>
        <Link to={createPageUrl('EpisodeSeries')} style={{ flex: 1, textDecoration: 'none', display: 'block', padding: '10px 0', borderRadius: 10, fontFamily: FONT, fontWeight: 900, fontSize: 13, letterSpacing: '0.08em', textAlign: 'center', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: GOLD }}>
          👁 Viewer View
        </Link>
        <Link to={createPageUrl('GoLive')} style={{ flex: 1, textDecoration: 'none', display: 'block', padding: '10px 0', borderRadius: 10, fontFamily: FONT, fontWeight: 900, fontSize: 13, letterSpacing: '0.08em', textAlign: 'center', background: 'linear-gradient(90deg,' + RED + ',' + GOLD + ')', color: '#000' }}>
          🔴 Go Live
        </Link>
      </div>
    </div>
  );
}
