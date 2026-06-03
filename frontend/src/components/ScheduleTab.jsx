import React, { useState, useEffect } from 'react';
import SelectSheet from './SelectSheet.jsx';

var NOW = Date.now();

var INIT_SCHEDULE = [
  { id: 's1', title: 'Friday Night Dominos LIVE',  time: new Date(NOW - 1800000).toISOString(),           status: 'LIVE',  category: 'Domino',     viewers: 2847, recurring: 'weekly'   },
  { id: 's2', title: 'Washington Classic Round 2', time: new Date(NOW + 86400000).toISOString(),           status: 'SCHED', category: 'Tournament', viewers: null,  recurring: 'none'     },
  { id: 's3', title: 'AIverse Podcast Ep. 48',     time: new Date(NOW + 172800000).toISOString(),          status: 'SCHED', category: 'Podcast',    viewers: null,  recurring: 'weekly'   },
  { id: 's4', title: "Cali \xD7 VibeN'Bones Collab",  time: new Date(NOW + 259200000).toISOString(),          status: 'SCHED', category: 'Music',      viewers: null,  recurring: 'none'     },
  { id: 's5', title: 'Beat Production Workshop',   time: new Date(NOW + 345600000).toISOString(),          status: 'SCHED', category: 'Education',  viewers: null,  recurring: 'biweekly' },
];

var CATS = ['Domino', 'Tournament', 'Podcast', 'Music', 'Education', 'Sports', 'Tech', 'Gaming'];

var CAT_COLORS = {
  Domino: '#C9A84C', Tournament: '#FF1A3C', Podcast: '#800020',
  Music: '#C9A84C', Education: '#C9A84C', Sports: '#FF6B35',
  Tech: '#C9A84C', Gaming: '#C9A84C',
};

var STATUS_COLORS = { LIVE: '#FF1A3C', NEXT: '#C9A84C', SCHED: '#8A7A62', ENDED: '#444050' };

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

function formatDt(isoStr) {
  var d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  var days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  var dow = days[d.getDay()];
  var h = d.getHours();
  var m = d.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12 = h % 12;
  if (h12 === 0) h12 = 12;
  var mStr = m === 0 ? '' : ':' + pad2(m);
  return dow + ' \xB7 ' + h12 + mStr + ' ' + ampm;
}

function diffBadge(isoStr) {
  var diff = new Date(isoStr).getTime() - Date.now();
  if (diff <= 0) return null;
  var totalSec = Math.floor(diff / 1000);
  var days = Math.floor(totalSec / 86400);
  var hours = Math.floor((totalSec % 86400) / 3600);
  var mins = Math.floor((totalSec % 3600) / 60);
  var secs = totalSec % 60;
  if (days >= 1) {
    return 'in ' + days + 'd ' + hours + 'h';
  }
  if (hours >= 1) {
    return 'in ' + hours + 'h ' + mins + 'm';
  }
  if (mins >= 1) {
    return 'in ' + mins + 'm ' + secs + 's';
  }
  return 'in ' + secs + 's';
}

function countdownHeader(isoStr) {
  if (!isoStr) return '--:--:--';
  var diff = new Date(isoStr).getTime() - Date.now();
  if (diff <= 0) return '00:00:00';
  var totalSec = Math.floor(diff / 1000);
  var h = Math.floor(totalSec / 3600);
  var m = Math.floor((totalSec % 3600) / 60);
  var s = totalSec % 60;
  return h + ':' + pad2(m) + ':' + pad2(s);
}

function nextUpcomingTime(schedule) {
  var upcoming = schedule.filter(function(ev) {
    return ev.status !== 'ENDED' && ev.status !== 'LIVE' && new Date(ev.time).getTime() > Date.now();
  });
  if (upcoming.length === 0) return null;
  upcoming.sort(function(a, b) { return new Date(a.time).getTime() - new Date(b.time).getTime(); });
  return upcoming[0].time;
}

function formatLiveDuration(secs) {
  var h = Math.floor(secs / 3600);
  var m = Math.floor((secs % 3600) / 60);
  var s = secs % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

var RECUR_LABELS = { none: 'One-time', weekly: 'Weekly', biweekly: 'Bi-weekly' };
var RECUR_COLORS = { none: '#8A7A62', weekly: '#C9A84C', biweekly: '#C9A84C' };

function rowToEvent(row) {
  return {
    id:        row.id,
    title:     row.title,
    time:      new Date(row.scheduled_at * 1000).toISOString(),
    status:    'SCHED',
    category:  row.category || 'Domino',
    viewers:   null,
    recurring: row.recurring || 'none',
    fromApi:   true,
  };
}

export default function ScheduleTab({ addToast, isLive, streamInfo }) {
  var [schedule,     setSchedule]     = useState([]);
  var [apiLoaded,    setApiLoaded]    = useState(false);
  var [saving,       setSaving]       = useState(false);
  var [newTitle,     setNewTitle]     = useState('');
  var [newTime,      setNewTime]      = useState('');
  var [newCat,       setNewCat]       = useState('Domino');
  var [newRecur,     setNewRecur]     = useState('none');
  var [filterCat,    setFilterCat]    = useState('all');
  var [tick,         setTick]         = useState(0);
  var [countdown,    setCountdown]    = useState(0);
  var [simNextEvent, setSimNextEvent] = useState(0);
  var [reminders,    setReminders]    = useState(function() { try { return JSON.parse(localStorage.getItem('sw_reminders') || '[]'); } catch(e) { return []; } });

  // Load from API on mount; fall back to INIT_SCHEDULE seed if empty
  useEffect(function() {
    fetch('/api/schedule')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var rows = data && Array.isArray(data.events) ? data.events : [];
        if (rows.length > 0) {
          setSchedule(rows.map(rowToEvent));
        } else {
          setSchedule(INIT_SCHEDULE.map(function(s) { return Object.assign({}, s); }));
        }
        setApiLoaded(true);
      })
      .catch(function() {
        setSchedule(INIT_SCHEDULE.map(function(s) { return Object.assign({}, s); }));
        setApiLoaded(true);
      });
  }, []);

  // 1-second tick for next-event countdown display
  useEffect(function() {
    var id = setInterval(function() {
      setTick(function(t) { return t + 1; });
    }, 1000);
    return function() { clearInterval(id); };
  }, []);

  // Live duration counter — runs only while isLive
  useEffect(function() {
    if (!isLive) {
      setCountdown(0);
      return;
    }
    var id = setInterval(function() {
      setCountdown(function(c) { return c + 1; });
    }, 1000);
    return function() { clearInterval(id); };
  }, [isLive]);

  // Auto-rotate simNextEvent every 45 seconds while isLive
  useEffect(function() {
    if (!isLive) {
      setSimNextEvent(0);
      return;
    }
    var upcomingList = schedule.filter(function(ev) {
      return ev.status !== 'ENDED' && ev.status !== 'LIVE' && new Date(ev.time).getTime() > Date.now();
    });
    upcomingList.sort(function(a, b) { return new Date(a.time).getTime() - new Date(b.time).getTime(); });
    var maxIdx = upcomingList.length > 0 ? upcomingList.length - 1 : 0;
    var id = setInterval(function() {
      setSimNextEvent(function(prev) { return prev >= maxIdx ? maxIdx : prev + 1; });
    }, 45000);
    return function() { clearInterval(id); };
  }, [isLive, schedule]);

  function addEvent() {
    if (!newTitle.trim() || !newTime.trim() || saving) return;
    var baseDate = new Date(newTime);
    var occurrences = [{ date: baseDate, suffix: '' }];
    if (newRecur === 'weekly') {
      for (var w = 1; w <= 3; w++) {
        var wt = new Date(newTime);
        wt.setDate(wt.getDate() + w * 7);
        occurrences.push({ date: wt, suffix: ' (Wk ' + (w + 1) + ')' });
      }
    } else if (newRecur === 'biweekly') {
      var bt = new Date(newTime);
      bt.setDate(bt.getDate() + 14);
      occurrences.push({ date: bt, suffix: ' (Wk 3)' });
    }
    setSaving(true);
    var promises = occurrences.map(function(occ) {
      return fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:        newTitle + occ.suffix,
          category:     newCat,
          scheduled_at: Math.floor(occ.date.getTime() / 1000),
          recurring:    newRecur,
        })
      }).then(function(r) { return r.json(); });
    });
    Promise.all(promises).then(function(results) {
      var newEvents = results.map(function(data, i) {
        return {
          id:        data.id || ('s' + Date.now() + i),
          title:     newTitle + occurrences[i].suffix,
          time:      occurrences[i].date.toISOString(),
          status:    'SCHED',
          category:  newCat,
          viewers:   null,
          recurring: newRecur,
          fromApi:   true,
        };
      });
      setSchedule(function(p) { return p.concat(newEvents); });
      setNewTitle('');
      setNewTime('');
      setNewRecur('none');
      setSaving(false);
      if (addToast) addToast('"' + newTitle + '" scheduled' + (newRecur !== 'none' ? ' (' + newEvents.length + ' dates)' : ''), 'success');
    }).catch(function(e) {
      setSaving(false);
      if (addToast) addToast('Save failed: ' + e.message, 'error');
    });
  }

  function removeEvent(id) {
    var ev = schedule.find(function(s) { return s.id === id; });
    if (ev && ev.fromApi) {
      fetch('/api/schedule/' + id, { method: 'DELETE' }).catch(function() {});
    }
    setSchedule(function(p) { return p.filter(function(s) { return s.id !== id; }); });
  }

  function toggleReminder(eventId) {
    var idx = reminders.indexOf(eventId);
    var updated;
    if (idx >= 0) {
      updated = reminders.filter(function(id) { return id !== eventId; });
      if (addToast) addToast('Reminder removed', 'info');
    } else {
      updated = reminders.concat([eventId]);
      if (addToast) addToast('Reminder set!', 'success');
    }
    setReminders(updated);
    localStorage.setItem('sw_reminders', JSON.stringify(updated));
  }

  function setStatus(id, status) {
    setSchedule(function(p) {
      return p.map(function(ev) {
        if (ev.id !== id) return ev;
        var next = Object.assign({}, ev, { status: status });
        if (status === 'LIVE') {
          next.viewers = next.viewers || Math.floor(Math.random() * 3000) + 200;
        }
        if (status === 'SCHED' || status === 'ENDED') {
          if (status === 'SCHED') next.viewers = null;
        }
        return next;
      });
    });
  }

  var liveCount = schedule.filter(function(s) { return s.status === 'LIVE'; }).length;
  var nextTime = nextUpcomingTime(schedule);
  var countdownDisplay = countdownHeader(nextTime);
  var recurCount = schedule.filter(function(s) { return s.recurring && s.recurring !== 'none'; }).length;
  var visibleSchedule = filterCat === 'all' ? schedule : schedule.filter(function(s) { return s.category === filterCat; });

  // Determine the first upcoming event index for the LIVE NOW pill
  var upcomingSorted = schedule.filter(function(ev) {
    return ev.status !== 'ENDED' && ev.status !== 'LIVE' && new Date(ev.time).getTime() > Date.now();
  });
  upcomingSorted.sort(function(a, b) { return new Date(a.time).getTime() - new Date(b.time).getTime(); });
  var firstUpcomingId = upcomingSorted.length > 0 ? upcomingSorted[simNextEvent < upcomingSorted.length ? simNextEvent : 0].id : null;

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* LIVE NOW banner */}
      {isLive && (
        <div style={{ background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.35)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: '#FF1A3C', letterSpacing: 3, marginBottom: 4 }}>
            &#x1F534; LIVE NOW
          </div>
          {streamInfo && streamInfo.title ? (
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: '#F0E8D4', marginBottom: 3, letterSpacing: 0.5 }}>{streamInfo.title}</div>
          ) : null}
          {streamInfo && streamInfo.category ? (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, marginBottom: 4 }}>{streamInfo.category.toUpperCase()}</div>
          ) : null}
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: '#C9A84C', letterSpacing: 4 }}>
            {formatLiveDuration(countdown)}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginTop: 4 }}>STREAM DURATION</div>
        </div>
      )}

      {/* Countdown banner */}
      <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.1),rgba(128,0,32,.1))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 3, marginBottom: 4 }}>NEXT EVENT IN</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: nextTime ? '#C9A84C' : '#444050', letterSpacing: 4, lineHeight: 1 }}>
          {nextTime ? countdownDisplay : '--:--:--'}
        </div>
        {nextTime && (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginTop: 4 }}>
            {formatDt(nextTime)}
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ background: 'rgba(128,0,32,.08)', border: '1px solid rgba(128,0,32,.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 13, color: '#C9A84C', letterSpacing: 3 }}>SCHEDULE MANAGER</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>{schedule.length} events \xB7 {liveCount} live \xB7 {recurCount} recurring</div>
        </div>
        {liveCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 999, padding: '3px 10px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 6px #FF1A3C' }} />
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: '#FF6B81' }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {['all'].concat(CATS).map(function(c) {
          var isActive = filterCat === c;
          var cc = c === 'all' ? '#F0E8D4' : (CAT_COLORS[c] || '#C9A84C');
          return (
            <button key={c} onClick={function() { setFilterCat(c); }}
              style={{ background: isActive ? cc + '22' : 'rgba(26,21,16,.6)', border: '1px solid ' + (isActive ? cc + '55' : '#3D3020'), borderRadius: 999, padding: '3px 10px', color: isActive ? cc : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
              {c === 'all' ? 'ALL' : c.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Event list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visibleSchedule.map(function(ev) {
          var sc = STATUS_COLORS[ev.status] || '#8A7A62';
          var cc = CAT_COLORS[ev.category] || '#C9A84C';
          var isUpcoming = ev.status !== 'LIVE' && ev.status !== 'ENDED' && new Date(ev.time).getTime() > Date.now();
          var badge = isUpcoming ? diffBadge(ev.time) : null;
          var isLiveNowEvent = isLive && isUpcoming && ev.id === firstUpcomingId;
          return (
            <div key={ev.id} style={{ background: 'rgba(26,21,16,.8)', border: '1px solid ' + (ev.status === 'LIVE' || isLiveNowEvent ? 'rgba(255,26,60,.4)' : '#3D3020'), borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc, flexShrink: 0, marginTop: 4, boxShadow: ev.status === 'LIVE' ? '0 0 6px ' + sc : 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: ev.status === 'LIVE' ? '#C9A84C' : ev.status === 'ENDED' ? '#555060' : '#F0E8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.title}
                    </div>
                    {isLiveNowEvent && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,26,60,.18)', border: '1px solid rgba(255,26,60,.45)', borderRadius: 999, padding: '2px 8px', flexShrink: 0 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF1A3C', display: 'inline-block', boxShadow: '0 0 5px #FF1A3C' }} />
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: '#FF6B81', letterSpacing: 1 }}>LIVE NOW</span>
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ background: cc + '18', border: '1px solid ' + cc + '44', borderRadius: 999, padding: '1px 7px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: cc }}>
                      {ev.category}
                    </span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>
                      {formatDt(ev.time)}
                    </span>
                    {badge && (
                      <span style={{ background: 'rgba(200,255,0,.1)', border: '1px solid rgba(200,255,0,.25)', borderRadius: 999, padding: '1px 7px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>
                        {badge}
                      </span>
                    )}
                    {ev.recurring && ev.recurring !== 'none' && (
                      <span style={{ background: RECUR_COLORS[ev.recurring] + '18', border: '1px solid ' + RECUR_COLORS[ev.recurring] + '44', borderRadius: 999, padding: '1px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: RECUR_COLORS[ev.recurring] }}>
                        &#x1F501; {RECUR_LABELS[ev.recurring].toUpperCase()}
                      </span>
                    )}
                    {ev.status === 'LIVE' && ev.viewers && (
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>
                        {'&#x1F441;'} {ev.viewers.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Reminder button */}
                  {ev.status !== 'LIVE' && ev.status !== 'ENDED' && (
                    <button
                      onClick={function() { toggleReminder(ev.id); }}
                      style={{ background: reminders.indexOf(ev.id) >= 0 ? 'rgba(201,168,76,.2)' : 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,' + (reminders.indexOf(ev.id) >= 0 ? '.5' : '.2') + ')', borderRadius: 6, padding: '4px 10px', color: reminders.indexOf(ev.id) >= 0 ? '#C9A84C' : '#8A7A62', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1, marginTop: 4 }}>
                      {reminders.indexOf(ev.id) >= 0 ? 'REMIND SET' : 'REMIND ME'}
                    </button>
                  )}

                  {/* Status buttons */}
                  <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                    <button
                      onClick={function() { setStatus(ev.id, 'LIVE'); }}
                      disabled={ev.status === 'LIVE'}
                      style={{ background: ev.status === 'LIVE' ? 'rgba(255,26,60,.25)' : 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,' + (ev.status === 'LIVE' ? '.6' : '.25') + ')', borderRadius: 5, padding: '2px 8px', color: '#FF1A3C', fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: ev.status === 'LIVE' ? 'default' : 'pointer', letterSpacing: 1, opacity: ev.status === 'LIVE' ? 1 : 0.75 }}>
                      LIVE
                    </button>
                    <button
                      onClick={function() { setStatus(ev.id, 'ENDED'); }}
                      disabled={ev.status === 'ENDED'}
                      style={{ background: ev.status === 'ENDED' ? 'rgba(68,64,80,.4)' : 'rgba(68,64,80,.1)', border: '1px solid rgba(68,64,80,' + (ev.status === 'ENDED' ? '.8' : '.3') + ')', borderRadius: 5, padding: '2px 8px', color: '#888', fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: ev.status === 'ENDED' ? 'default' : 'pointer', letterSpacing: 1, opacity: ev.status === 'ENDED' ? 1 : 0.75 }}>
                      ENDED
                    </button>
                    <button
                      onClick={function() { setStatus(ev.id, 'SCHED'); }}
                      disabled={ev.status === 'SCHED'}
                      style={{ background: ev.status === 'SCHED' ? 'rgba(122,111,144,.2)' : 'rgba(122,111,144,.06)', border: '1px solid rgba(122,111,144,' + (ev.status === 'SCHED' ? '.5' : '.2') + ')', borderRadius: 5, padding: '2px 8px', color: '#9A8FB0', fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: ev.status === 'SCHED' ? 'default' : 'pointer', letterSpacing: 1, opacity: ev.status === 'SCHED' ? 1 : 0.75 }}>
                      SCHED
                    </button>
                  </div>
                </div>

                <button
                  onClick={function() { removeEvent(ev.id); }}
                  style={{ background: 'none', border: '1px solid #3D3020', borderRadius: 5, padding: '2px 6px', color: '#8A7A62', fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>
                  &#x2715;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add new */}
      <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, marginBottom: 10 }}>ADD STREAM</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={newTitle}
            onChange={function(e) { setNewTitle(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter' && newTitle && newTime) addEvent(); }}
            placeholder="Stream title..."
            style={{ background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 8, padding: '8px 12px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="datetime-local"
              value={newTime}
              onChange={function(e) { setNewTime(e.target.value); }}
              style={{ flex: 1, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 8, padding: '8px 12px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, colorScheme: 'dark' }}
            />
            <SelectSheet
              label="Category"
              value={newCat}
              options={CATS}
              onChange={function(v) { setNewCat(v); }}
              style={{ flexShrink: 0 }}
            />
          </div>
          <SelectSheet
            label="Recurrence"
            value={newRecur}
            options={[
              { value: 'none',     label: 'One-time event' },
              { value: 'weekly',   label: 'Weekly recurring (\xD74)' },
              { value: 'biweekly', label: 'Bi-weekly recurring (\xD72)' },
            ]}
            onChange={function(v) { setNewRecur(v); }}
          />
          <button
            onClick={addEvent}
            disabled={!newTitle.trim() || !newTime.trim()}
            style={{ padding: '10px', background: 'rgba(128,0,32,.2)', border: '1px solid rgba(128,0,32,.4)', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: !newTitle.trim() || !newTime.trim() ? 'not-allowed' : 'pointer', opacity: !newTitle.trim() || !newTime.trim() ? 0.5 : 1 }}>
            + SCHEDULE STREAM
          </button>
        </div>
      </div>
    </div>
  );
}
