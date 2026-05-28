import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var GOLD_H  = '#E8C46A';
var BURG    = '#800020';
var BURG_H  = '#C01838';
var TEAL_H  = '#00DEC0';
var MUTED   = '#6B5F82';
var TEXT    = '#EDE8F4';
var BG1     = '#0F0C14';
var FAINT   = '#1C1530';
var BORDER  = 'rgba(255,255,255,.07)';
var GLASS   = 'rgba(13,10,20,.75)';
var fD      = "'Bebas Neue',sans-serif";
var fU      = "'Barlow Condensed',sans-serif";
var fM      = "'DM Mono',monospace";

function fmtN(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : '' + n;
}

var COLLAB_REQUESTS = [
  { id: 'cr1', from: 'CaliBonesOG',    flag: '🇺🇸', color: '#C01838', type: 'LIVE COLLAB',       msg: "Let's do a Friday Night Dominos collab stream! 🎲",           time: '8:12 PM', status: 'pending',  split: '50/50' },
  { id: 'cr2', from: 'AIverse_Pod',    flag: '🇺🇸', color: '#9B4DCA', type: 'PODCAST GUEST',     msg: 'Want to be on AIverse Ep.49? Topic: SeeWhy LIVE v33',         time: '7:55 PM', status: 'pending',  split: 'guest' },
  { id: 'cr3', from: 'JoyceMoore',     flag: '🇺🇸', color: '#C084FC', type: 'LIVE COLLAB',       msg: 'Memoirs × SeeWhy — storytelling + creator economy episode',   time: '7:30 PM', status: 'accepted', split: '60/40' },
  { id: 'cr4', from: 'DrMuk_HH',       flag: '🇺🇸', color: '#F59E0B', type: 'WATCH PARTY',       msg: 'DrMuk STEAMulater watch party on SeeWhy!',                    time: '6:45 PM', status: 'pending',  split: 'host'  }
];

var COLLAB_CREATORS = [
  { id: 'cc1', n: 'CaliBonesOG',    f: '🇺🇸', c: '#C01838', cat: 'Gaming',  followers: '48.2K', live: true,  v: 2847 },
  { id: 'cc2', n: 'DJ_Cipher',      f: '🇯🇲', c: '#00DEC0', cat: 'Music',   followers: '24.1K', live: true,  v: 924  },
  { id: 'cc3', n: 'JoyceMoore',     f: '🇺🇸', c: '#C084FC', cat: 'Talk',    followers: '31.5K', live: false, v: 0    },
  { id: 'cc4', n: 'AIverse_Pod',    f: '🇺🇸', c: '#9B4DCA', cat: 'Tech',    followers: '19.3K', live: false, v: 0    },
  { id: 'cc5', n: 'DrMuk_HH',       f: '🇺🇸', c: '#F59E0B', cat: 'STEM',    followers: '8.9K',  live: false, v: 0    },
  { id: 'cc6', n: 'IsaacHayes_III', f: '🇺🇸', c: '#E8C46A', cat: 'Culture', followers: '62.1K', live: false, v: 0    }
];

var INVITE_TYPES  = ['LIVE COLLAB', 'PODCAST GUEST', 'WATCH PARTY', 'MUSIC SESSION', 'TOURNAMENT MATCH'];
var SPLIT_OPTIONS = ['50/50', '60/40', '70/30', 'host', 'guest'];

var CANNED_LINES = [
  'Great chemistry! Keep it going 🔥',
  'Should we do a giveaway?',
  'Chat is loving this collab!',
  'Let\'s plug each other\'s channels',
  'This is going viral 📈'
];

var SEED_CHATS = {
  cr3: [
    { from: 'JoyceMoore', text: 'Hey! Ready to go live together? 💜', ts: '19:30' },
    { from: 'you', text: 'Absolutely! Let me get the stream set up 🎙', ts: '19:31' },
    { from: 'JoyceMoore', text: 'My audience is pumped — should we start with your intro or mine?', ts: '19:32' },
  ]
};

export default function CollabTab({ addToast, isLive, userId, username, socket, roomId }) {
  var [requests,    setRequests]    = useState(COLLAB_REQUESTS.map(function(r) { return Object.assign({}, r); }));
  var [section,     setSection]     = useState('requests');
  var [inviteMsg,   setInviteMsg]   = useState('');
  var [inviteType,  setInviteType]  = useState('LIVE COLLAB');
  var [inviteSplit, setInviteSplit] = useState('50/50');
  var [chatMsgs,    setChatMsgs]    = useState(Object.assign({}, SEED_CHATS));
  var [chatInputs,  setChatInputs]  = useState({});

  var chatBoxRefs = useRef({});

  /* ── Incoming collab-message from socket ── */
  useEffect(function() {
    if (!socket) return;
    function onCollabMsg(data) {
      if (!data || !data.collabId) return;
      var ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMsgs(function(prev) {
        var arr = (prev[data.collabId] || []).concat([{ from: data.from, text: data.text, ts: data.ts ? ts : ts }]);
        var next = Object.assign({}, prev);
        next[data.collabId] = arr;
        return next;
      });
    }
    socket.on('collab-message', onCollabMsg);
    return function() { socket.off('collab-message', onCollabMsg); };
  }, [socket]);

  /* ── Auto-scroll on new messages ── */
  useEffect(function() {
    var ids = Object.keys(chatBoxRefs.current);
    for (var i = 0; i < ids.length; i++) {
      var el = chatBoxRefs.current[ids[i]];
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [chatMsgs]);

  /* ── Auto-append partner messages when isLive ── */
  useEffect(function() {
    if (!isLive) return;
    var timer = setInterval(function() {
      var activeCollabs = [];
      for (var i = 0; i < COLLAB_REQUESTS.length; i++) {
        if (COLLAB_REQUESTS[i].status === 'accepted') {
          activeCollabs.push(COLLAB_REQUESTS[i]);
        }
      }
      if (activeCollabs.length === 0) return;
      var randIdx = Math.floor(Math.random() * activeCollabs.length);
      var collab = activeCollabs[randIdx];
      var lineIdx = Math.floor(Math.random() * CANNED_LINES.length);
      var line = CANNED_LINES[lineIdx];
      var ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      var msg = { from: collab.from, text: line, ts: ts };
      setChatMsgs(function(prev) {
        var arr = (prev[collab.id] || []).concat([msg]);
        var next = Object.assign({}, prev);
        next[collab.id] = arr;
        return next;
      });
    }, 6000);
    return function() { clearInterval(timer); };
  }, [isLive]);

  function sendChat(collabId, fromName) {
    var inputText = chatInputs[collabId] || '';
    if (!inputText) return;
    var ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var msg = { from: 'you', text: inputText, ts: ts };
    setChatMsgs(function(prev) {
      var arr = (prev[collabId] || []).concat([msg]);
      var next = Object.assign({}, prev);
      next[collabId] = arr;
      return next;
    });
    setChatInputs(function(prev) {
      var next = Object.assign({}, prev);
      next[collabId] = '';
      return next;
    });
    if (socket && roomId) {
      socket.emit('collab-message', { roomId: roomId, collabId: collabId, fromUser: username || 'Host', text: inputText });
    }
  }

  function acceptRequest(id) {
    var req = null;
    for (var i = 0; i < requests.length; i++) {
      if (requests[i].id === id) { req = requests[i]; break; }
    }
    setRequests(function(prev) {
      return prev.map(function(r) {
        if (r.id !== id) return r;
        return Object.assign({}, r, { status: 'accepted' });
      });
    });
    if (req) {
      addToast('🤝 Collab accepted with ' + req.from + '!', 'success');
      if (socket && roomId) {
        socket.emit('collab-accept', { roomId: roomId, fromUser: username || 'Host', collabId: id, partner: req.from });
      }
    }
  }

  function declineRequest(id) {
    setRequests(function(prev) {
      return prev.filter(function(r) { return r.id !== id; });
    });
  }

  function handleDecline(id) {
    declineRequest(id);
    addToast('👋 Collab declined', 'info');
  }

  function sendInvite(creator) {
    if (!inviteMsg) return;
    if (socket && roomId) {
      socket.emit('collab-request', { roomId: roomId, fromUser: username || 'Host', toCreator: creator.n, type: inviteType, message: inviteMsg, split: inviteSplit });
    }
    addToast('📨 Collab invite sent to ' + creator.n + '!', 'success');
    setInviteMsg('');
  }

  var activeCollabs = requests.filter(function(r) { return r.status === 'accepted'; });

  /* ── Tab bar ── */
  function TabBtn(props) {
    var isActive = section === props.id;
    return (
      <button
        onClick={function() { setSection(props.id); }}
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          borderBottom: '2px solid ' + (isActive ? GOLD_H : 'transparent'),
          padding: '11px 0 9px 0',
          color: isActive ? GOLD_H : MUTED,
          fontFamily: fU,
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 1,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'color .15s'
        }}>
        {props.label}
        {props.badge > 0 && (
          <span style={{ background: BURG_H, color: '#fff', fontFamily: fM, fontSize: 8, fontWeight: 700, borderRadius: 999, padding: '1px 6px', minWidth: 16, textAlign: 'center' }}>
            {props.badge}
          </span>
        )}
      </button>
    );
  }

  var pendingCount = requests.filter(function(r) { return r.status === 'pending'; }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG1, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 14px 0 14px', flexShrink: 0 }}>
        <div style={{ fontFamily: fD, fontSize: 20, color: TEXT, letterSpacing: 3 }}>COLLAB HUB</div>
        <div style={{ fontFamily: fM, fontSize: 9, color: MUTED, marginTop: 1, marginBottom: 12 }}>Creator-to-creator collaboration system</div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid ' + BORDER }}>
          <TabBtn id="requests" label="REQUESTS" badge={pendingCount} />
          <TabBtn id="discover" label="DISCOVER" badge={0} />
          <TabBtn id="active"   label="ACTIVE"   badge={activeCollabs.length} />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

        {/* ── REQUESTS tab ── */}
        {section === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', fontFamily: fM, fontSize: 11, color: MUTED }}>
                No collab requests at this time.
              </div>
            )}
            {requests.map(function(req) {
              var isPending = req.status === 'pending';
              return (
                <div
                  key={req.id}
                  style={{ background: FAINT, border: '1px solid ' + (isPending ? req.color + '44' : 'rgba(0,222,192,.2)'), borderRadius: 12, overflow: 'hidden' }}>

                  {/* Top accent bar */}
                  <div style={{ height: 3, background: 'linear-gradient(90deg,' + req.color + ',' + req.color + '44)' }} />

                  <div style={{ padding: '14px 16px' }}>
                    {/* From row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ flexShrink: 0 }}>
                        <AvatarPortrait username={req.from} size={38} isLive={req.status === 'accepted'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 14, color: TEXT }}>{req.from}</div>
                        <div style={{ fontFamily: fM, fontSize: 8, color: req.color, letterSpacing: 1 }}>{req.type}</div>
                      </div>
                      <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, flexShrink: 0 }}>{req.time}</div>
                    </div>

                    {/* Message */}
                    <div style={{ fontFamily: fM, fontSize: 10, color: TEXT, background: 'rgba(255,255,255,.04)', border: '1px solid ' + BORDER, borderRadius: 7, padding: '9px 12px', marginBottom: 10, lineHeight: 1.5 }}>
                      "{req.msg}"
                    </div>

                    {/* Split badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isPending ? 12 : 0 }}>
                      <span style={{ fontFamily: fM, fontSize: 8, color: MUTED, letterSpacing: 1 }}>SPLIT:</span>
                      <span style={{ fontFamily: fU, fontWeight: 700, fontSize: 11, color: GOLD_H, background: 'rgba(232,196,106,.1)', border: '1px solid rgba(232,196,106,.3)', borderRadius: 5, padding: '2px 8px' }}>
                        {req.split}
                      </span>
                    </div>

                    {/* Actions */}
                    {isPending ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={function() { acceptRequest(req.id); }}
                          style={{ flex: 1, background: 'linear-gradient(135deg,rgba(0,222,192,.18),rgba(0,222,192,.08))', border: '1px solid rgba(0,222,192,.4)', borderRadius: 8, padding: '9px 0', color: TEAL_H, fontFamily: fU, fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                          ✓ ACCEPT
                        </button>
                        <button
                          onClick={function() { handleDecline(req.id); }}
                          style={{ flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 0', color: MUTED, fontFamily: fU, fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                          ✕ DECLINE
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,222,192,.08)', border: '1px solid rgba(0,222,192,.25)', borderRadius: 8, padding: '9px 14px' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: TEAL_H, boxShadow: '0 0 6px ' + TEAL_H }} />
                        <span style={{ fontFamily: fU, fontWeight: 700, fontSize: 12, color: TEAL_H, letterSpacing: 1 }}>
                          COLLAB ACTIVE — {req.split} SPLIT
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DISCOVER tab ── */}
        {section === 'discover' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Config panel */}
            <div style={{ background: FAINT, border: '1px solid ' + BORDER, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontFamily: fD, fontSize: 13, color: MUTED, letterSpacing: 3, marginBottom: 10 }}>COLLAB TYPE</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {INVITE_TYPES.map(function(t) {
                  var isActive = inviteType === t;
                  return (
                    <button
                      key={t}
                      onClick={function() { setInviteType(t); }}
                      style={{ background: isActive ? 'rgba(232,196,106,.14)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (isActive ? 'rgba(232,196,106,.5)' : BORDER), borderRadius: 7, padding: '6px 12px', color: isActive ? GOLD_H : MUTED, fontFamily: fU, fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
                      {t}
                    </button>
                  );
                })}
              </div>

              <div style={{ fontFamily: fD, fontSize: 13, color: MUTED, letterSpacing: 3, marginBottom: 10 }}>REVENUE SPLIT</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {SPLIT_OPTIONS.map(function(s) {
                  var isActive = inviteSplit === s;
                  return (
                    <button
                      key={s}
                      onClick={function() { setInviteSplit(s); }}
                      style={{ background: isActive ? 'rgba(0,222,192,.12)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (isActive ? 'rgba(0,222,192,.4)' : BORDER), borderRadius: 7, padding: '6px 12px', color: isActive ? TEAL_H : MUTED, fontFamily: fU, fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
                      {s}
                    </button>
                  );
                })}
              </div>

              <div style={{ fontFamily: fD, fontSize: 13, color: MUTED, letterSpacing: 3, marginBottom: 8 }}>INVITE MESSAGE</div>
              <textarea
                value={inviteMsg}
                onChange={function(e) { setInviteMsg(e.target.value); }}
                placeholder="Write a short message to the creator..."
                rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid ' + BORDER, borderRadius: 8, padding: '10px 12px', color: TEXT, fontFamily: fM, fontSize: 11, resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
              />
            </div>

            {/* Creator list */}
            <div style={{ fontFamily: fD, fontSize: 13, color: MUTED, letterSpacing: 3, marginBottom: 6 }}>SUGGESTED CREATORS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {COLLAB_CREATORS.map(function(creator) {
                return (
                  <div
                    key={creator.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, background: FAINT, border: '1px solid ' + BORDER, borderRadius: 11, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: creator.c }} />

                    <div style={{ flexShrink: 0 }}>
                      <AvatarPortrait username={creator.n} size={44} isLive={creator.live} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 14, color: TEXT }}>{creator.n}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span style={{ fontFamily: fM, fontSize: 8, color: creator.c, background: creator.c + '18', border: '1px solid ' + creator.c + '33', borderRadius: 4, padding: '1px 6px', letterSpacing: 1 }}>{creator.cat}</span>
                        <span style={{ fontFamily: fM, fontSize: 8, color: GOLD_H }}>{creator.followers}</span>
                        {creator.live && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: BURG_H, boxShadow: '0 0 5px ' + BURG_H }} />
                            <span style={{ fontFamily: fU, fontWeight: 700, fontSize: 9, color: '#FF6680', letterSpacing: 1 }}>LIVE · {fmtN(creator.v)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={function() { sendInvite(creator); }}
                      style={{ background: inviteMsg ? 'linear-gradient(135deg,' + BURG + ',' + BURG_H + ')' : 'rgba(255,255,255,.05)', border: '1px solid ' + (inviteMsg ? BURG_H + '88' : BORDER), borderRadius: 8, padding: '8px 14px', color: inviteMsg ? GOLD_H : MUTED, fontFamily: fU, fontWeight: 700, fontSize: 11, cursor: inviteMsg ? 'pointer' : 'default', letterSpacing: 1, flexShrink: 0 }}>
                      INVITE
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ACTIVE tab ── */}
        {section === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeCollabs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🤝</div>
                <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 15, color: MUTED, letterSpacing: 1, marginBottom: 6 }}>No active collabs</div>
                <div style={{ fontFamily: fM, fontSize: 10, color: MUTED }}>Accept a request or send an invite!</div>
              </div>
            )}
            {activeCollabs.map(function(req) {
              var msgs = chatMsgs[req.id] || [];
              var inputVal = chatInputs[req.id] || '';
              return (
                <div
                  key={req.id}
                  style={{ background: FAINT, border: '1px solid rgba(0,222,192,.2)', borderRadius: 12, overflow: 'hidden' }}>

                  <div style={{ height: 3, background: 'linear-gradient(90deg,' + TEAL_H + ',rgba(0,222,192,.2))' }} />

                  <div style={{ padding: '14px 16px' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ flexShrink: 0 }}>
                        <AvatarPortrait username={req.from} size={40} isLive={true} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 14, color: TEXT }}>{req.from}</div>
                        <div style={{ fontFamily: fM, fontSize: 8, color: req.color, letterSpacing: 1 }}>{req.type}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,222,192,.08)', border: '1px solid rgba(0,222,192,.25)', borderRadius: 999, padding: '3px 10px', flexShrink: 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL_H, boxShadow: '0 0 6px ' + TEAL_H }} />
                        <span style={{ fontFamily: fU, fontWeight: 700, fontSize: 9, color: TEAL_H, letterSpacing: 1 }}>ACTIVE</span>
                      </div>
                    </div>

                    {/* Split info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontFamily: fM, fontSize: 8, color: MUTED, letterSpacing: 1 }}>SPLIT:</span>
                      <span style={{ fontFamily: fU, fontWeight: 700, fontSize: 11, color: GOLD_H, background: 'rgba(232,196,106,.1)', border: '1px solid rgba(232,196,106,.3)', borderRadius: 5, padding: '2px 8px' }}>
                        {req.split}
                      </span>
                    </div>

                    {/* Message */}
                    <div style={{ fontFamily: fM, fontSize: 10, color: TEXT, background: 'rgba(255,255,255,.04)', border: '1px solid ' + BORDER, borderRadius: 7, padding: '9px 12px', marginBottom: 12, lineHeight: 1.5 }}>
                      "{req.msg}"
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button
                        onClick={function() { addToast('📡 Collab stream shared to all platforms!', 'info'); }}
                        style={{ flex: 1, background: 'linear-gradient(135deg,rgba(0,222,192,.16),rgba(0,222,192,.07))', border: '1px solid rgba(0,222,192,.35)', borderRadius: 8, padding: '9px 0', color: TEAL_H, fontFamily: fU, fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                        📡 SHARE STREAM
                      </button>
                      <button
                        onClick={function() { declineRequest(req.id); addToast('👋 Collab ended', 'info'); }}
                        style={{ flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 0', color: MUTED, fontFamily: fU, fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                        ✕ END COLLAB
                      </button>
                    </div>

                    {/* Mini chat panel */}
                    <div
                      ref={function(el) { chatBoxRefs.current[req.id] = el; }}
                      style={{ maxHeight: 120, overflowY: 'auto', background: 'rgba(7,5,10,.7)', border: '1px solid rgba(0,222,192,.12)', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                      {msgs.length === 0 && (
                        <div style={{ fontFamily: fM, fontSize: 9, color: MUTED, textAlign: 'center', padding: '8px 0' }}>
                          No messages yet — say hi!
                        </div>
                      )}
                      {msgs.map(function(m, idx) {
                        var fromColor = m.from === 'you' ? TEAL_H : req.color;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5, lineHeight: 1.4 }}>
                            <span style={{ fontFamily: fM, fontSize: 8, color: MUTED, flexShrink: 0 }}>{m.ts}</span>
                            <span style={{ fontFamily: fU, fontWeight: 700, fontSize: 11, color: fromColor, flexShrink: 0 }}>{m.from}</span>
                            <span style={{ fontFamily: fM, fontSize: 10, color: TEXT }}>{m.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chat input row */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        value={inputVal}
                        onChange={function(e) {
                          var val = e.target.value;
                          setChatInputs(function(prev) {
                            var next = Object.assign({}, prev);
                            next[req.id] = val;
                            return next;
                          });
                        }}
                        onKeyDown={function(e) {
                          if (e.key === 'Enter') { sendChat(req.id, req.from); }
                        }}
                        placeholder={'Message ' + req.from + '…'}
                        style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(0,222,192,.18)', borderRadius: 7, padding: '7px 10px', color: TEXT, fontFamily: fM, fontSize: 10, outline: 'none' }}
                      />
                      <button
                        onClick={function() { sendChat(req.id, req.from); }}
                        style={{ background: 'linear-gradient(135deg,rgba(0,222,192,.22),rgba(0,222,192,.10))', border: '1px solid rgba(0,222,192,.4)', borderRadius: 7, padding: '7px 13px', color: TEAL_H, fontFamily: fU, fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                        SEND
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
