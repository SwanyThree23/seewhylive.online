import React, { useState, useEffect } from 'react';

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
  Domino: '#C9A84C', Tournament: '#FF1A3C', Podcast: '#9B4DCA',
  Music: '#00DEC0', Education: '#5A8FFF', Sports: '#FF6B35',
  Tech: '#00C9A7', Gaming: '#C8FF00',
};

var STATUS_COLORS = { LIVE: '#FF1A3C', NEXT: '#00DEC0', SCHED: '#7A6F90', ENDED: '#444050' };

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
var RECUR_COLORS = { none: '#7A6F90', weekly: '#00C9A7', biweekly: '#C084FC' };

export default function ScheduleTab({ addToast, isLive, streamInfo }) {
  var [schedule,     setSchedule]     = useState(function() {
    try {
      var saved = localStorage.getItem('sw_schedule');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return INIT_SCHEDULE.map(function(s) { return Object.assign({}, s); });
  });
  var [newTitle,     setNewTitle]     = useState('');
  var [newTime,      setNewTime]      = useState('');
  var [newCat,       setNewCat]       = useState('Domino');
  var [newRecur,     setNewRecur]     = useState('none');
  var [filterCat,    setFilterCat]    = useState('all');
  var [tick,         setTick]         = useState(0);
  var [countdown,    setCountdown]    = useState(0);
  var [simNextEvent, setSimNextEvent] = useState(0);

  useEffect(function() {
    try { localStorage.setItem('sw_schedule', JSON.stringify(schedule)); } catch(e) {}
  }, [schedule]);

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
    if (!newTitle.trim() || !newTime.trim()) return;
    var iso = new Date(newTime).toISOString();
    var newEvents = [{ id: 's' + Date.now(), title: newTitle, time: iso, status: 'SCHED', category: newCat, viewers: null, recurring: newRecur }];
    if (newRecur === 'weekly') {
      for (var w = 1; w <= 3; w++) {
        var wt = new Date(newTime);
        wt.setDate(wt.getDate() + w * 7);
        newEvents.push({ id: 's' + Date.now() + w, title: newTitle + ' (Wk ' + (w + 1) + ')', time: wt.toISOString(), status: 'SCHED', category: newCat, viewers: null, recurring: 'weekly' });
      }
    } else if (newRecur === 'biweekly') {
      var bt = new Date(newTime);
      bt.setDate(bt.getDate() + 14);
      newEvents.push({ id: 's' + Date.now() + 14, title: newTitle + ' (Wk 3)', time: bt.toISOString(), status: 'SCHED', category: newCat, viewers: null, recurring: 'biweekly' });
    }
    setSchedule(function(p) { return p.concat(newEvents); });
    setNewTitle('');
    setNewTime('');
    setNewRecur('none');
    if (addToast) addToast('"' + newTitle + '" scheduled' + (newRecur !== 'none' ? ' (' + newEvents.length + ' occurrences)' : ''), 'success');
  }

  function removeEvent(id) {
    setSchedule(function(p) { return p.filter(function(s) { return s.id !== id; }); });
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
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: '#EDE8F5', marginBottom: 3, letterSpacing: 0.5 }}>{streamInfo.title}</div>
          ) : null}
          {streamInfo && streamInfo.category ? (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, marginBottom: 4 }}>{streamInfo.category.toUpperCase()}</div>
          ) : null}
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: '#C8FF00', letterSpacing: 4 }}>
            {formatLiveDuration(countdown)}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginTop: 4 }}>STREAM DURATION</div>
        </div>
      )}

      {/* Countdown banner */}
      <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.1),rgba(155,77,202,.1))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 3, marginBottom: 4 }}>NEXT EVENT IN</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: nextTime ? '#C8FF00' : '#444050', letterSpacing: 4, lineHeight: 1 }}>
          {nextTime ? countdownDisplay : '--:--:--'}
        </div>
        {nextTime && (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginTop: 4 }}>
            {formatDt(nextTime)}
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ background: 'rgba(155,77,202,.08)', border: '1px solid rgba(155,77,202,.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 13, color: '#C084FC', letterSpacing: 3 }}>SCHEDULE MANAGER</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>{schedule.length} events \xB7 {liveCount} live \xB7 {recurCount} recurring</div>
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
          var cc = c === 'all' ? '#EDE8F5' : (CAT_COLORS[c] || '#C9A84C');
          return (
            <button key={c} onClick={function() { setFilterCat(c); }}
              style={{ background: isActive ? cc + '22' : 'rgba(22,16,32,.6)', border: '1px solid ' + (isActive ? cc + '55' : '#241C34'), borderRadius: 999, padding: '3px 10px', color: isActive ? cc : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
              {c === 'all' ? 'ALL' : c.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Event list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visibleSchedule.map(function(ev) {
          var sc = STATUS_COLORS[ev.status] || '#7A6F90';
          var cc = CAT_COLORS[ev.category] || '#C9A84C';
          var isUpcoming = ev.status !== 'LIVE' && ev.status !== 'ENDED' && new Date(ev.time).getTime() > Date.now();
          var badge = isUpcoming ? diffBadge(ev.time) : null;
          var isLiveNowEvent = isLive && isUpcoming && ev.id === firstUpcomingId;
          return (
            <div key={ev.id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + (ev.status === 'LIVE' || isLiveNowEvent ? 'rgba(255,26,60,.4)' : '#241C34'), borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc, flexShrink: 0, marginTop: 4, boxShadow: ev.status === 'LIVE' ? '0 0 6px ' + sc : 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: ev.status === 'LIVE' ? '#C8FF00' : ev.status === 'ENDED' ? '#555060' : '#EDE8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>
                      {formatDt(ev.time)}
                    </span>
                    {badge && (
                      <span style={{ background: 'rgba(200,255,0,.1)', border: '1px solid rgba(200,255,0,.25)', borderRadius: 999, padding: '1px 7px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C8FF00' }}>
                        {badge}
                      </span>
                    )}
                    {ev.recurring && ev.recurring !== 'none' && (
                      <span style={{ background: RECUR_COLORS[ev.recurring] + '18', border: '1px solid ' + RECUR_COLORS[ev.recurring] + '44', borderRadius: 999, padding: '1px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: RECUR_COLORS[ev.recurring] }}>
                        &#x1F501; {RECUR_LABELS[ev.recurring].toUpperCase()}
                      </span>
                    )}
                    {ev.status === 'LIVE' && ev.viewers && (
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C8FF00' }}>
                        {'&#x1F441;'} {ev.viewers.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Reminder button */}
                  {ev.status !== 'LIVE' && ev.status !== 'ENDED' && (
                    <button
                      onClick={function() { if (addToast) addToast('🔔 Reminder set · ' + ev.title + ' · ' + formatDt(ev.time), 'success'); }}
                      style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 5, padding: '3px 10px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1, marginTop: 4 }}>
                      🔔 SET REMINDER
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
                  style={{ background: 'none', border: '1px solid #241C34', borderRadius: 5, padding: '2px 6px', color: '#7A6F90', fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>
                  &#x2715;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add new */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C084FC', letterSpacing: 2, marginBottom: 10 }}>ADD STREAM</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={newTitle}
            onChange={function(e) { setNewTitle(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter' && newTitle && newTime) addEvent(); }}
            placeholder="Stream title..."
            style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="datetime-local"
              value={newTime}
              onChange={function(e) { setNewTime(e.target.value); }}
              style={{ flex: 1, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, colorScheme: 'dark' }}
            />
            <select
              value={newCat}
              onChange={function(e) { setNewCat(e.target.value); }}
              style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 10px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
              {CATS.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          </div>
          <select
            value={newRecur}
            onChange={function(e) { setNewRecur(e.target.value); }}
            style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 10px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, cursor: 'pointer' }}>
            <option value="none">One-time event</option>
            <option value="weekly">Weekly recurring (\xD74)</option>
            <option value="biweekly">Bi-weekly recurring (\xD72)</option>
          </select>
          <button
            onClick={addEvent}
            disabled={!newTitle.trim() || !newTime.trim()}
            style={{ padding: '10px', background: 'rgba(155,77,202,.2)', border: '1px solid rgba(155,77,202,.4)', borderRadius: 8, color: '#C084FC', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: !newTitle.trim() || !newTime.trim() ? 'not-allowed' : 'pointer', opacity: !newTitle.trim() || !newTime.trim() ? 0.5 : 1 }}>
            + SCHEDULE STREAM
          </button>
        </div>
      </div>
    </div>
  );
}
