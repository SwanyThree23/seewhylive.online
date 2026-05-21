import React, { useState } from 'react';

var INIT_SCHEDULE = [
  { id: 's1', title: 'Friday Night Dominos LIVE',  time: '9PM ET',   status: 'LIVE',  category: 'Domino',    viewers: 2847 },
  { id: 's2', title: 'Washington Classic Round 2', time: 'SAT 4PM',  status: 'NEXT',  category: 'Tournament', viewers: null },
  { id: 's3', title: 'AIverse Podcast Ep. 48',     time: 'SUN 7PM',  status: 'SCHED', category: 'Podcast',   viewers: null },
  { id: 's4', title: "Cali × VibeN'Bones Collab",  time: 'MON 8PM',  status: 'SCHED', category: 'Music',     viewers: null },
  { id: 's5', title: 'Beat Production Workshop',   time: 'TUE 6PM',  status: 'SCHED', category: 'Education', viewers: null },
];

var CATS = ['Domino', 'Tournament', 'Podcast', 'Music', 'Education', 'Sports', 'Tech', 'Gaming'];

var CAT_COLORS = {
  Domino: '#C9A84C', Tournament: '#FF1A3C', Podcast: '#9B4DCA',
  Music: '#00DEC0', Education: '#5A8FFF', Sports: '#FF6B35',
  Tech: '#00C9A7', Gaming: '#C8FF00',
};

var STATUS_COLORS = { LIVE: '#FF1A3C', NEXT: '#00DEC0', SCHED: '#7A6F90' };

export default function ScheduleTab({ addToast }) {
  var [schedule, setSchedule] = useState(INIT_SCHEDULE.map(function(s) { return Object.assign({}, s); }));
  var [newTitle, setNewTitle] = useState('');
  var [newTime,  setNewTime]  = useState('');
  var [newCat,   setNewCat]   = useState('Domino');

  function addEvent() {
    if (!newTitle.trim() || !newTime.trim()) return;
    setSchedule(function(p) {
      return [...p, { id: 's' + Date.now(), title: newTitle, time: newTime, status: 'SCHED', category: newCat, viewers: null }];
    });
    setNewTitle('');
    setNewTime('');
    if (addToast) addToast('"' + newTitle + '" scheduled', 'success');
  }

  function removeEvent(id) {
    setSchedule(function(p) { return p.filter(function(s) { return s.id !== id; }); });
  }

  var liveCount = schedule.filter(function(s) { return s.status === 'LIVE'; }).length;

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>
      {/* Header */}
      <div style={{ background: 'rgba(155,77,202,.08)', border: '1px solid rgba(155,77,202,.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#C084FC', letterSpacing: 3 }}>📅 SCHEDULE MANAGER</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>{schedule.length} events · {liveCount} live now</div>
        </div>
        {liveCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 999, padding: '3px 10px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 6px #FF1A3C' }} />
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: '#FF6B81' }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Event list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {schedule.map(function(ev) {
          var sc = STATUS_COLORS[ev.status] || '#7A6F90';
          var cc = CAT_COLORS[ev.category] || '#C9A84C';
          return (
            <div key={ev.id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + (ev.status === 'LIVE' ? 'rgba(255,26,60,.4)' : '#241C34'), borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc, flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: ev.status === 'LIVE' ? '#C8FF00' : '#EDE8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.title}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ background: cc + '18', border: '1px solid ' + cc + '44', borderRadius: 999, padding: '1px 7px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: cc }}>
                      {ev.category}
                    </span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>{ev.time}</span>
                    {ev.viewers && (
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C8FF00' }}>👁 {ev.viewers.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
                  <span style={{ background: sc + '18', border: '1px solid ' + sc + '44', borderRadius: 999, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: sc, letterSpacing: 1 }}>
                    {ev.status}
                  </span>
                  <button
                    onClick={function() { removeEvent(ev.id); }}
                    style={{ background: 'none', border: '1px solid #241C34', borderRadius: 5, padding: '2px 6px', color: '#7A6F90', fontSize: 10, cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
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
              value={newTime}
              onChange={function(e) { setNewTime(e.target.value); }}
              placeholder="Time (e.g. SAT 4PM)"
              style={{ flex: 1, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
            />
            <select
              value={newCat}
              onChange={function(e) { setNewCat(e.target.value); }}
              style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 10px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
              {CATS.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          </div>
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
