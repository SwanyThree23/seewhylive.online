import React, { useState, useEffect, useRef } from 'react';

var BG     = '#0E0C09';
var SURF   = '#1A1510';
var CARD   = '#241C12';
var CARD2  = '#2E2318';
var GOLD   = '#C9A84C';
var BURG   = '#800020';
var AMBER  = '#D4854A';
var RED    = '#FF1A3C';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';
var DIM    = '#3D3020';
var BORDER = 'rgba(201,168,76,.12)';

var OCT_CLIP = 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)';

var AVATAR_COLORS = [BURG, GOLD, AMBER, '#C04040', '#8A6020', '#A07040', '#6A3010', '#D4A060'];

function getInitials(name) {
  if (!name) return '??';
  var parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  var h = 0;
  for (var i = 0; i < name.length; i++) { h = (h * 31 + name.charCodeAt(i)) & 0xffff; }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

var STYLE_TAG = '' +
  '@keyframes stagePulse {' +
  '  0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); }' +
  '  50%     { box-shadow: 0 0 0 4px rgba(201,168,76,.45); }' +
  '}' +
  '@keyframes handWave {' +
  '  0%,100% { transform: rotate(0deg); }' +
  '  25%     { transform: rotate(20deg); }' +
  '  75%     { transform: rotate(-10deg); }' +
  '}' +
  '@keyframes micPulse {' +
  '  0%,100% { opacity: 1; }' +
  '  50%     { opacity: 0.5; }' +
  '}';

export default function AudioStageTab(props) {
  var socket   = props.socket;
  var roomId   = props.roomId;
  var userId   = props.userId;
  var username = props.username;
  var role     = props.role;
  var addToast = props.addToast;

  var [speakers,     setSpeakers]     = useState([]);
  var [listeners,    setListeners]    = useState([]);
  var [myMicOn,      setMyMicOn]      = useState(false);
  var [myHandRaised, setMyHandRaised] = useState(false);
  var [stageLocked,  setStageLocked]  = useState(false);
  var [loveCount,    setLoveCount]    = useState(0);
  var [joined,       setJoined]       = useState(false);
  var [memberCount,  setMemberCount]  = useState(0);
  var [onlineCount,  setOnlineCount]  = useState(0);
  var [activeSpeaker,setActiveSpeaker]= useState('');
  var [pinInput,     setPinInput]     = useState('');
  var [pinnedYtId,   setPinnedYtId]   = useState('');

  var micStreamRef  = useRef(null);
  var audioCtxRef   = useRef(null);
  var analyserRef   = useRef(null);
  var micTimerRef   = useRef(null);
  var speakTimerRef = useRef(null);
  var hiddenAudioRef= useRef(null);

  var isHost = role === 'host' || role === 'cohost';

  var handRaisedCount = listeners.filter(function(l) { return l.handRaised; }).length;

  // ── Socket events ─────────────────────────────────────────
  useEffect(function() {
    if (!socket) return;

    function onStageState(data) {
      if (!data) return;
      setSpeakers(data.speakers || []);
      setListeners(data.listeners || []);
      var total = (data.speakers || []).length + (data.listeners || []).length;
      setMemberCount(total);
      setOnlineCount(data.onlineCount || total);
      var speaking = (data.speakers || []).find(function(s) { return s.speaking; });
      setActiveSpeaker(speaking ? (speaking.username || '') : '');
    }

    function onStageUpdate(data) {
      if (!data) return;
      if (data.speakers) setSpeakers(data.speakers);
      if (data.listeners) setListeners(data.listeners);
      var total = (data.speakers || speakers).length + (data.listeners || listeners).length;
      setMemberCount(total);
      var speaking = (data.speakers || speakers).find(function(s) { return s.speaking; });
      setActiveSpeaker(speaking ? (speaking.username || '') : '');
    }

    function onLoveUpdate(data) {
      if (!data || !data.roomId || String(data.roomId) !== String(roomId)) return;
      setLoveCount(data.total || 0);
    }

    function onStageSpeaking(data) {
      if (!data || !data.speaking) return;
      setActiveSpeaker(data.username || data.userId || '');
    }

    function onStagePin(data) {
      if (!data || !data.ytId) return;
      setPinnedYtId(data.ytId);
    }

    function onStageLock(data) {
      if (data && typeof data.locked === 'boolean') setStageLocked(data.locked);
    }

    function onStageRemove(data) {
      if (!data || !data.guestId || data.guestId !== userId) return;
      if (addToast) addToast('You have been removed from the stage', 'error');
      stopMic();
      setMyMicOn(false);
      setMyHandRaised(false);
    }

    function onStageInvite(data) {
      if (!data || data.guestId !== userId) return;
      if (addToast) addToast('🎙 You\'ve been invited to speak on stage!', 'success');
    }

    socket.on('audio-stage-state',    onStageState);
    socket.on('audio-stage-update',   onStageUpdate);
    socket.on('love-update',          onLoveUpdate);
    socket.on('audio-stage-speaking', onStageSpeaking);
    socket.on('watch-stage-pin',      onStagePin);
    socket.on('stage-lock-update',    onStageLock);
    socket.on('stage-remove',         onStageRemove);
    socket.on('stage-invite',         onStageInvite);

    return function() {
      socket.off('audio-stage-state',    onStageState);
      socket.off('audio-stage-update',   onStageUpdate);
      socket.off('love-update',          onLoveUpdate);
      socket.off('audio-stage-speaking', onStageSpeaking);
      socket.off('watch-stage-pin',      onStagePin);
      socket.off('stage-lock-update',    onStageLock);
      socket.off('stage-remove',         onStageRemove);
      socket.off('stage-invite',         onStageInvite);
    };
  }, [socket, roomId, userId, addToast]);

  // ── Join on mount ──────────────────────────────────────────
  useEffect(function() {
    if (!socket || joined) return;
    socket.emit('audio-stage-join', { roomId: roomId, userId: userId, username: username, role: role });
    setJoined(true);
    return function() {
      socket.emit('audio-stage-leave', { roomId: roomId, userId: userId });
      stopMic();
    };
  }, [socket]);

  // ── Mic / WebAudio ─────────────────────────────────────────
  function stopMic() {
    if (micTimerRef.current)   { clearInterval(micTimerRef.current);  micTimerRef.current = null; }
    if (speakTimerRef.current) { clearInterval(speakTimerRef.current); speakTimerRef.current = null; }
    if (analyserRef.current)   { try { analyserRef.current.disconnect(); } catch(e) {} analyserRef.current = null; }
    if (audioCtxRef.current)   { try { audioCtxRef.current.close(); } catch(e) {} audioCtxRef.current = null; }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      micStreamRef.current = null;
    }
    if (hiddenAudioRef.current) { hiddenAudioRef.current.srcObject = null; }
  }

  function startMic() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(stream) {
      micStreamRef.current = stream;
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.srcObject = stream;
        hiddenAudioRef.current.muted = true;
      }
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      var ctx = new AudioContext();
      audioCtxRef.current = ctx;
      var source   = ctx.createMediaStreamSource(stream);
      var analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      var buf = new Uint8Array(analyser.frequencyBinCount);
      var prevSpeaking = false;

      // VAD: check audio level every 150ms
      micTimerRef.current = setInterval(function() {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i++) { sum += buf[i]; }
        var avg = sum / buf.length;
        var isSpeaking = avg > 12;
        if (isSpeaking !== prevSpeaking) {
          prevSpeaking = isSpeaking;
          if (socket) {
            socket.emit('audio-stage-speaking', { roomId: roomId, userId: userId, speaking: isSpeaking });
          }
        }
      }, 150);

      // Heartbeat every 2s when active
      speakTimerRef.current = setInterval(function() {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buf);
        var sum2 = 0;
        for (var i = 0; i < buf.length; i++) { sum2 += buf[i]; }
        var avg2 = sum2 / buf.length;
        if (avg2 > 12 && socket) {
          socket.emit('audio-stage-speaking', { roomId: roomId, userId: userId, speaking: true });
        }
      }, 2000);
    }).catch(function(err) {
      if (addToast) addToast('Mic access denied: ' + err.message, 'error');
    });
  }

  function toggleMic() {
    if (myMicOn) {
      stopMic();
      setMyMicOn(false);
      if (socket) socket.emit('audio-stage-speaking', { roomId: roomId, userId: userId, speaking: false });
    } else {
      startMic();
      setMyMicOn(true);
    }
  }

  function toggleHand() {
    var next = !myHandRaised;
    setMyHandRaised(next);
    if (socket) socket.emit('audio-stage-hand-raise', { roomId: roomId, userId: userId, raised: next });
  }

  function sendLove() {
    if (socket) {
      socket.emit('love-send', { roomId: roomId, userId: userId, username: username, amount: 1 });
    }
  }

  function promoteUser(targetUserId) {
    if (socket) socket.emit('audio-stage-promote', { roomId: roomId, targetUserId: targetUserId });
  }

  function demoteUser(targetUserId) {
    if (socket) socket.emit('audio-stage-demote', { roomId: roomId, targetUserId: targetUserId });
  }

  function extractYtId(url) {
    if (!url) return '';
    var m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : '';
  }

  function pinYoutube() {
    var id = extractYtId(pinInput.trim());
    if (!id) {
      if (addToast) addToast('Enter a valid YouTube URL', 'error');
      return;
    }
    setPinnedYtId(id);
    if (socket) socket.emit('watch-stage-pin', { roomId: roomId, ytId: id });
  }

  function unpinYoutube() {
    setPinnedYtId('');
    if (socket) socket.emit('watch-stage-pin', { roomId: roomId, ytId: '' });
    setPinInput('');
  }

  // ── Render helpers ─────────────────────────────────────────
  function renderSpeakerTile(spk, idx) {
    var isSpeaking = spk.speaking && !spk.muted;
    var initials = getInitials(spk.username);
    var color = avatarColor(spk.username);
    var isMe = String(spk.userId) === String(userId);
    return (
      <div key={spk.userId || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
        {/* Avatar */}
        <div style={{
          width: 56,
          height: 56,
          clipPath: OCT_CLIP,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Barlow Condensed',sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: TEXT,
          boxShadow: isSpeaking ? ('0 0 0 3px ' + GOLD + ', 0 0 12px rgba(201,168,76,.5)') : ('0 0 0 1px ' + BORDER),
          animation: isSpeaking ? 'stagePulse 1.2s ease infinite' : 'none',
          position: 'relative',
          cursor: isHost && !isMe ? 'pointer' : 'default',
          transition: 'box-shadow .2s'
        }}
          onClick={isHost && !isMe ? function() { demoteUser(spk.userId); } : undefined}
          title={isHost && !isMe ? 'Click to remove from stage' : spk.username}
        >
          {initials}
        </div>
        {/* Mic indicator */}
        <div style={{ position: 'absolute', bottom: 22, right: -2, fontSize: 10, lineHeight: 1 }}>
          {spk.muted ? (
            <span title="Muted" style={{ color: RED }}>🔇</span>
          ) : isSpeaking ? (
            <span style={{ animation: 'micPulse .8s ease infinite' }}>🎙</span>
          ) : null}
        </div>
        {/* Name */}
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: isMe ? GOLD : MUTED, textAlign: 'center', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isMe ? 'YOU' : (spk.username || 'Guest')}
        </div>
        {/* Role badge */}
        {(function() {
          var r = spk.role || '';
          var badgeColor = r === 'host' ? GOLD : (r === 'cohost' ? AMBER : MUTED);
          var badgeLabel = r === 'host' ? 'Host' : (r === 'cohost' ? 'Co-host' : (r === 'speaker' ? 'Speaker' : null));
          if (!badgeLabel) return null;
          return (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: badgeColor, background: 'rgba(0,0,0,.35)', borderRadius: 3, padding: '1px 5px', letterSpacing: 0.5, lineHeight: 1.5 }}>
              {badgeLabel}
            </div>
          );
        })()}
        {/* Host remove button */}
        {isHost && !isMe && (
          <button
            onClick={function() { demoteUser(spk.userId); }}
            style={{ background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 4, padding: '1px 5px', color: RED, fontSize: 7, fontFamily: "'DM Mono',monospace", cursor: 'pointer', lineHeight: 1.5 }}>
            RM
          </button>
        )}
      </div>
    );
  }

  function renderEmptySlot(idx) {
    return (
      <div key={'empty-' + idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 56, height: 56, clipPath: OCT_CLIP, background: DIM, border: '1px solid ' + BORDER, opacity: 0.4 }} />
        <div style={{ height: 12 }} />
      </div>
    );
  }

  function renderListenerCard(lst, idx) {
    var initials = getInitials(lst.username);
    var color    = avatarColor(lst.username);
    var isMe     = String(lst.userId) === String(userId);
    return (
      <div key={lst.userId || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative' }}>
        {/* Hand raise wave */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: TEXT,
            border: '2px solid ' + (lst.handRaised ? GOLD : CARD2),
            boxShadow: lst.handRaised ? ('0 0 0 2px rgba(201,168,76,.4)') : 'none',
            cursor: isHost ? 'pointer' : 'default'
          }}
            onClick={isHost ? function() { promoteUser(lst.userId); } : undefined}
            title={isHost ? 'Promote to stage' : lst.username}
          >
            {initials}
          </div>
          {lst.handRaised && (
            <div style={{ position: 'absolute', top: -4, right: -4, fontSize: 12, animation: 'handWave 1s ease infinite' }}>🤚</div>
          )}
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: isMe ? GOLD : MUTED, textAlign: 'center', maxWidth: 42, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isMe ? 'YOU' : (lst.username || 'Guest')}
        </div>
        {isHost && (
          <button
            onClick={function() { promoteUser(lst.userId); }}
            style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 4, padding: '1px 6px', color: GOLD, fontSize: 7, fontFamily: "'DM Mono',monospace", cursor: 'pointer', lineHeight: 1.5 }}>
            UP
          </button>
        )}
      </div>
    );
  }

  // ── Build stage slots ──────────────────────────────────────
  var stageSlots = [];
  for (var si = 0; si < 20; si++) {
    if (si < speakers.length) {
      stageSlots.push(renderSpeakerTile(speakers[si], si));
    } else {
      stageSlots.push(renderEmptySlot(si));
    }
  }

  var isMeOnStage = speakers.some(function(s) { return String(s.userId) === String(userId); });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG, fontFamily: "'Barlow Condensed',sans-serif", overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLE_TAG }} />
      <audio ref={hiddenAudioRef} autoPlay muted style={{ display: 'none' }} />

      {/* ── Header ── */}
      <div style={{ background: SURF, borderBottom: '1px solid ' + BORDER, padding: '10px 14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 2 }}>
            🎙 AUDIO STAGE
            {isHost && handRaisedCount > 0 && (
              <span style={{ marginLeft: 8, background: AMBER, color: BG, borderRadius: 999, padding: '1px 7px', fontSize: 11, fontFamily: "'DM Mono',monospace", verticalAlign: 'middle' }}>
                {handRaisedCount} ✋
              </span>
            )}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: 1 }}>
            {memberCount} members · {onlineCount} here now
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {activeSpeaker && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD, letterSpacing: 1, animation: 'micPulse 1.5s ease infinite' }}>
              🎙 {activeSpeaker} is speaking
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 110 }}>

        {/* ── PINNED YOUTUBE EMBED ── */}
        {isHost && (
          <div style={{ margin: '8px 10px 0', padding: '8px 10px', background: CARD, borderRadius: 10, border: '1px solid ' + BORDER }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1, marginBottom: 6 }}>PIN YOUTUBE TO STAGE</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={pinInput}
                onChange={function(e) { setPinInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') pinYoutube(); }}
                placeholder="Paste YouTube URL..."
                style={{ flex: 1, background: 'rgba(0,0,0,.4)', border: '1px solid ' + BORDER, borderRadius: 6, padding: '6px 8px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 9, outline: 'none' }}
              />
              <button onClick={pinYoutube} style={{ background: 'rgba(201,168,76,.2)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 6, padding: '6px 12px', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>PIN</button>
              {pinnedYtId && (
                <button onClick={unpinYoutube} style={{ background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 6, padding: '6px 10px', color: RED, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>✕</button>
              )}
            </div>
          </div>
        )}
        {pinnedYtId && (
          <div style={{ margin: '8px 10px 0', borderRadius: 10, overflow: 'hidden', border: '1px solid ' + BORDER, background: '#000', aspectRatio: '16/9' }}>
            <iframe
              src={'https://www.youtube.com/embed/' + pinnedYtId + '?rel=0&modestbranding=1'}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              allowFullScreen
              title="Pinned YouTube"
            />
          </div>
        )}

        {/* ── STAGE SECTION ── */}
        <div style={{ background: CARD, margin: '10px 10px 0', borderRadius: 10, border: '1px solid ' + BORDER, padding: '12px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>STAGE {speakers.length}/20</span>
            <span style={{ color: speakers.length > 0 ? GOLD : DIM, fontSize: 8 }}>
              {speakers.length > 0 ? speakers.length + ' SPEAKING' : 'EMPTY'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, justifyItems: 'center' }}>
            {stageSlots}
          </div>
        </div>

        {/* ── LISTENERS SECTION ── */}
        <div style={{ background: CARD2, margin: '8px 10px 0', borderRadius: 10, border: '1px solid ' + BORDER, padding: '12px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 10 }}>
            OTHERS IN THE ROOM ({listeners.length})
          </div>
          {listeners.length === 0 ? (
            <div style={{ textAlign: 'center', color: DIM, fontFamily: "'DM Mono',monospace", fontSize: 9, padding: '12px 0' }}>
              No listeners yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {listeners.map(function(lst, idx) { return renderListenerCard(lst, idx); })}
            </div>
          )}
        </div>
      </div>

      {/* ── FEATURE ICONS ROW ── */}
      <div style={{ position: 'absolute', bottom: 62, left: 0, right: 0, background: CARD, borderTop: '1px solid ' + BORDER, padding: '6px 12px', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', zIndex: 48 }}>
        {[
          { icon: '🔗', label: 'Share',    action: function() { if (addToast) addToast('Link copied!', 'success'); } },
          { icon: '📋', label: 'Queue',    action: function() { if (addToast) addToast('Queue — coming soon', 'info'); } },
          { icon: '🎵', label: 'Music',    action: function() { if (addToast) addToast('Music — coming soon', 'info'); } },
          { icon: '⚙',  label: 'Settings', action: function() { if (addToast) addToast('Settings — coming soon', 'info'); } }
        ].map(function(item) {
          return (
            <button key={item.label} onClick={item.action}
              title={item.label}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,.04)', border: '1px solid ' + BORDER, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', flex: 1 }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 0.5 }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── BOTTOM ACTION BAR ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: SURF, borderTop: '1px solid ' + BORDER, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', zIndex: 50 }}>
        {/* Mic toggle */}
        <button
          onClick={toggleMic}
          style={{
            flex: 1,
            background: myMicOn ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.05)',
            border: '1px solid ' + (myMicOn ? GOLD : MUTED),
            borderRadius: 8,
            padding: '9px 0',
            color: myMicOn ? GOLD : MUTED,
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            letterSpacing: 1,
            animation: myMicOn ? 'micPulse 1.5s ease infinite' : 'none'
          }}>
          {myMicOn ? '🎙 MIC ON' : '🎙 MIC OFF'}
        </button>

        {/* Hand raise — disabled when stage is locked */}
        {!isMeOnStage && (
          <button
            onClick={stageLocked ? undefined : toggleHand}
            disabled={stageLocked}
            style={{
              flex: 1,
              background: stageLocked ? 'rgba(255,255,255,.03)' : myHandRaised ? 'rgba(212,133,74,.2)' : 'rgba(255,255,255,.05)',
              border: '1px solid ' + (stageLocked ? 'rgba(138,122,98,.25)' : myHandRaised ? AMBER : MUTED),
              borderRadius: 8,
              padding: '9px 0',
              color: stageLocked ? 'rgba(138,122,98,.4)' : myHandRaised ? AMBER : MUTED,
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 13,
              cursor: stageLocked ? 'not-allowed' : 'pointer',
              letterSpacing: 1,
              opacity: stageLocked ? 0.6 : 1,
            }}>
            {stageLocked ? '🔒 LOCKED' : myHandRaised ? '🤚 LOWER' : '🤚 RAISE'}
          </button>
        )}

        {/* Love button */}
        <button
          onClick={sendLove}
          style={{
            background: 'rgba(128,0,32,.25)',
            border: '1px solid rgba(128,0,32,.6)',
            borderRadius: 8,
            padding: '9px 12px',
            color: TEXT,
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            letterSpacing: 1,
            flexShrink: 0
          }}>
          ♥ {loveCount > 999 ? (Math.floor(loveCount / 100) / 10).toFixed(1) + 'K' : loveCount}
        </button>

        {/* Leave stage */}
        {isMeOnStage && (
          <button
            onClick={function() {
              if (socket) socket.emit('audio-stage-demote', { roomId: roomId, targetUserId: userId });
              stopMic();
              setMyMicOn(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: RED,
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              flexShrink: 0,
              letterSpacing: 1,
              padding: '9px 8px'
            }}>
            LEAVE STAGE
          </button>
        )}
      </div>
    </div>
  );
}
