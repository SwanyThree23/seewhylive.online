'use strict';
import React, { useState, useEffect, useRef } from 'react';
import UpgradeGate from './UpgradeGate.jsx';
import SelectSheet from './SelectSheet.jsx';

var GOLD   = '#C9A84C';
var BURG   = '#800020';
var CARD   = '#241C12';
var CARD2  = '#2E2318';
var BORDER = 'rgba(201,168,76,.12)';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';
var DIM    = '#3D3020';
var BG     = '#0E0C09';
var RED    = '#FF1A3C';

export default function PollOverlay({ socket, roomId, role, isLive, addToast }) {
  var [activePoll, setActivePoll] = useState(null);
  var [myVote,     setMyVote]     = useState(null);
  var [hostDraft,  setHostDraft]  = useState({ question: '', options: ['', '', '', ''], duration: 60 });
  var [hostOpen,   setHostOpen]   = useState(false);
  var [timeLeft,   setTimeLeft]   = useState(0);
  var [pollEnded,  setPollEnded]  = useState(false);

  var clearEndTimer = useRef(null);

  // Countdown timer effect
  useEffect(function() {
    if (!activePoll || !activePoll.endsAt) return;
    var iv = setInterval(function() {
      var left = Math.max(0, Math.floor((activePoll.endsAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) clearInterval(iv);
    }, 500);
    return function() { clearInterval(iv); };
  }, [activePoll]);

  // Socket listeners
  useEffect(function() {
    if (!socket) return;

    function onPollStart(data) {
      setActivePoll(data);
      setMyVote(null);
      setPollEnded(false);
      if (clearEndTimer.current) clearTimeout(clearEndTimer.current);
    }

    function onPollUpdate(data) {
      setActivePoll(function(p) {
        return p && p.id === data.id ? data : p;
      });
    }

    function onPollEnd(data) {
      // Update with final data then clear after 5s
      setActivePoll(function(p) {
        return p && p.id === data.id ? Object.assign({}, p, { votes: data.votes, totalVotes: data.totalVotes }) : p;
      });
      setPollEnded(true);
      clearEndTimer.current = setTimeout(function() {
        setActivePoll(null);
        setPollEnded(false);
        setMyVote(null);
      }, 5000);
    }

    socket.on('poll-start',  onPollStart);
    socket.on('poll-update', onPollUpdate);
    socket.on('poll-end',    onPollEnd);

    return function() {
      socket.off('poll-start',  onPollStart);
      socket.off('poll-update', onPollUpdate);
      socket.off('poll-end',    onPollEnd);
    };
  }, [socket]);

  function handleVote(optionIdx) {
    if (myVote !== null || !activePoll) return;
    setMyVote(optionIdx);
    socket.emit('poll-vote', { roomId: roomId, pollId: activePoll.id, option: activePoll.options[optionIdx] });
  }

  function handleCreatePoll() {
    if (!socket) return;
    var q = hostDraft.question.trim();
    if (!q) { if (addToast) addToast('Enter a question', 'error'); return; }
    var opts = hostDraft.options.filter(function(o) { return o.trim().length > 0; });
    if (opts.length < 2) { if (addToast) addToast('Add at least 2 options', 'error'); return; }
    socket.emit('poll-create', { roomId: roomId, question: q, options: opts, duration: hostDraft.duration });
    setHostOpen(false);
    setHostDraft({ question: '', options: ['', '', '', ''], duration: 60 });
    if (addToast) addToast('Poll launched!', 'success');
  }

  function handleClosePoll() {
    if (!socket || !activePoll) return;
    socket.emit('poll-end', { roomId: roomId, pollId: activePoll.id });
    if (addToast) addToast('Poll closed', 'info');
  }

  var isHost = role === 'host' || role === 'cohost';

  // Host creation panel
  var hostPanel = isHost ? (
    <div style={{ position: 'fixed', bottom: 80, right: 12, zIndex: 600 }}>
      <button
        onClick={function() { setHostOpen(function(v) { return !v; }); }}
        style={{
          background: hostOpen ? BURG : CARD,
          border: '1px solid ' + (hostOpen ? 'rgba(128,0,32,.6)' : BORDER),
          borderRadius: 10,
          padding: '8px 14px',
          color: hostOpen ? GOLD : MUTED,
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 13,
          letterSpacing: 2,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        📊 POLL
      </button>

      {hostOpen && (
        <div style={{
          position: 'absolute',
          bottom: 46,
          right: 0,
          width: 300,
          background: CARD,
          border: '1px solid ' + BORDER,
          borderRadius: 14,
          padding: '14px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,.6)',
          zIndex: 601,
        }}>
          <UpgradeGate feature="polls">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, letterSpacing: 2 }}>
                {activePoll ? 'POLL IN PROGRESS' : 'CREATE POLL'}
              </div>

              {activePoll ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: TEXT }}>
                    {activePoll.question}
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>
                    {pollEnded ? 'RESULTS' : (timeLeft + 's remaining')}
                  </div>
                  <button
                    onClick={handleClosePoll}
                    style={{
                      background: 'rgba(255,26,60,.15)',
                      border: '1px solid rgba(255,26,60,.4)',
                      borderRadius: 8,
                      padding: '8px',
                      color: RED,
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: 13,
                      letterSpacing: 2,
                      cursor: 'pointer',
                    }}
                  >
                    CLOSE POLL
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    value={hostDraft.question}
                    onChange={function(e) { setHostDraft(function(d) { return Object.assign({}, d, { question: e.target.value }); }); }}
                    placeholder="Poll question..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: CARD2,
                      border: '1px solid ' + DIM,
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: TEXT,
                      fontFamily: "'Barlow Condensed',sans-serif",
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  {[0, 1, 2, 3].map(function(i) {
                    return (
                      <input
                        key={i}
                        value={hostDraft.options[i]}
                        onChange={function(e) {
                          var v = e.target.value;
                          setHostDraft(function(d) {
                            var opts = d.options.slice();
                            opts[i] = v;
                            return Object.assign({}, d, { options: opts });
                          });
                        }}
                        placeholder={'Option ' + String.fromCharCode(65 + i)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          background: CARD2,
                          border: '1px solid ' + DIM,
                          borderRadius: 8,
                          padding: '7px 12px',
                          color: TEXT,
                          fontFamily: "'Barlow Condensed',sans-serif",
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                    );
                  })}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, flexShrink: 0 }}>DURATION</span>
                    <SelectSheet
                      label="Duration"
                      value={String(hostDraft.duration)}
                      options={[
                        { value: '30',  label: '30 seconds' },
                        { value: '60',  label: '60 seconds' },
                        { value: '120', label: '120 seconds' },
                      ]}
                      onChange={function(v) { setHostDraft(function(d) { return Object.assign({}, d, { duration: parseInt(v, 10) }); }); }}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <button
                    onClick={handleCreatePoll}
                    style={{
                      background: BURG,
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px',
                      color: GOLD,
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: 14,
                      letterSpacing: 2,
                      cursor: 'pointer',
                    }}
                  >
                    START POLL
                  </button>
                </div>
              )}
            </div>
          </UpgradeGate>
        </div>
      )}
    </div>
  ) : null;

  // Poll display overlay (visible to all viewers)
  var pollDisplay = activePoll ? (function() {
    var options   = activePoll.options || [];
    var votes     = activePoll.votes || {};
    var total     = activePoll.totalVotes || 0;

    // votes is { 'option text': count } from poll-create system
    var maxVotes = 0;
    options.forEach(function(opt) {
      var c = votes[opt] || 0;
      if (c > maxVotes) maxVotes = c;
    });

    return (
      <div style={{
        position: 'fixed',
        bottom: 80,
        left: 0,
        right: 0,
        zIndex: 500,
        padding: '0 12px',
        pointerEvents: 'auto',
      }}>
        <div style={{
          background: 'rgba(14,12,9,.97)',
          border: '1px solid rgba(201,168,76,.3)',
          borderRadius: 14,
          padding: '14px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,.6)',
          maxWidth: 480,
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT }}>
              {activePoll.question}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: pollEnded ? GOLD : MUTED, flexShrink: 0, marginLeft: 8 }}>
              {pollEnded ? 'RESULTS' : (timeLeft + 's')}
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {options.map(function(opt, idx) {
              var cnt  = votes[opt] || 0;
              var pct  = total > 0 ? Math.floor((cnt / total) * 100) : 0;
              var isWin = pollEnded && maxVotes > 0 && cnt === maxVotes;
              var isMyVote = myVote === idx;
              var showBars = myVote !== null || pollEnded;

              return (
                <div key={idx}>
                  <div
                    onClick={function() { handleVote(idx); }}
                    style={{
                      position: 'relative',
                      background: isWin ? 'rgba(128,0,32,.25)' : CARD,
                      border: '1px solid ' + (isWin ? 'rgba(201,168,76,.5)' : (isMyVote ? 'rgba(201,168,76,.35)' : BORDER)),
                      borderRadius: 8,
                      padding: '9px 12px',
                      cursor: myVote === null && !pollEnded ? 'pointer' : 'default',
                      overflow: 'hidden',
                      transition: 'border .2s',
                    }}
                  >
                    {/* Filled bar */}
                    {showBars && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: pct + '%',
                        background: isWin ? 'rgba(201,168,76,.2)' : 'rgba(138,122,98,.12)',
                        transition: 'width .5s ease',
                        borderRadius: 8,
                      }} />
                    )}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: isWin ? GOLD : TEXT }}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: isWin ? GOLD : TEXT }}>
                          {opt}
                        </span>
                        {isMyVote && (
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD }}>✓ YOU</span>
                        )}
                      </div>
                      {showBars && (
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: isWin ? GOLD : MUTED, letterSpacing: 1, flexShrink: 0 }}>
                          {pct}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, marginTop: 8, textAlign: 'center' }}>
            {myVote !== null ? (total + ' vote' + (total !== 1 ? 's' : '')) : (pollEnded ? 'Poll closed' : 'Tap to vote')}
          </div>
        </div>
      </div>
    );
  })() : null;

  return (
    <div>
      {hostPanel}
      {pollDisplay}
    </div>
  );
}
