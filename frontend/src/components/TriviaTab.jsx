import React, { useState, useEffect, useRef } from 'react';

var GOLD   = '#C9A84C';
var BURG   = '#800020';
var AMBER  = '#D4854A';
var RED    = '#FF1A3C';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';
var CARD   = '#241C12';
var SURF   = '#1A1510';
var BG     = '#0E0C09';
var BORDER = 'rgba(201,168,76,.12)';
var GREEN  = '#50C878';

var STYLE_TAG =
  '@keyframes triviaSlideIn {' +
  '  0%   { transform: translateY(20px); opacity: 0; }' +
  '  100% { transform: translateY(0);    opacity: 1; }' +
  '}' +
  '@keyframes triviaCorrect {' +
  '  0%,100% { transform: scale(1);    background: rgba(80,200,120,.15); }' +
  '  40%     { transform: scale(1.04); background: rgba(80,200,120,.35); }' +
  '}' +
  '@keyframes triviaWrong {' +
  '  0%,100% { transform: scale(1); background: rgba(255,26,60,.12); }' +
  '  35%     { transform: scale(.97); background: rgba(255,26,60,.28); }' +
  '}' +
  '@keyframes timerShrink {' +
  '  from { width: 100%; }' +
  '  to   { width: 0%; }' +
  '}' +
  '@keyframes scorePop {' +
  '  0%   { transform: scale(1);   opacity: 1; }' +
  '  50%  { transform: scale(1.3); opacity: 1; }' +
  '  100% { transform: scale(1);   opacity: 1; }' +
  '}';

var OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function TriviaTab(props) {
  var socket   = props.socket;
  var roomId   = props.roomId;
  var role     = props.role;
  var username = props.username;
  var addToast = props.addToast;
  var isLive   = props.isLive;

  var isHost = role === 'host' || role === 'cohost';

  // Host setup state
  var [question,    setQuestion]    = useState('');
  var [options,     setOptions]     = useState(['', '', '', '']);
  var [correctIdx,  setCorrectIdx]  = useState(0);
  var [duration,    setDuration]    = useState(20);
  var [sending,     setSending]     = useState(false);

  // Live question state (all users)
  var [activeQ,     setActiveQ]     = useState(null);   // { question, options:[{text}], durationMs }
  var [selectedIdx, setSelectedIdx] = useState(null);   // viewer's chosen answer index
  var [timeLeft,    setTimeLeft]    = useState(0);
  var [results,     setResults]     = useState(null);   // trivia-results payload
  var [scores,      setScores]      = useState([]);     // [{ username, correct, wrong }]
  var [showScores,  setShowScores]  = useState(false);
  var [popScore,    setPopScore]    = useState(false);
  var [answerResult, setAnswerResult] = useState(null); // 'correct' | 'wrong' | null

  var timerRef   = useRef(null);
  var startTsRef = useRef(0);

  // ── Socket listeners ────────────────────────────────────────────────────
  useEffect(function() {
    if (!socket) return;

    function onQuestion(data) {
      setAnswerResult(null);
      setActiveQ(data);
      setSelectedIdx(null);
      setResults(null);
      setShowScores(false);
      setTimeLeft(Math.ceil((data.durationMs || 20000) / 1000));
      startTsRef.current = Date.now();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(function() {
        var elapsed = Date.now() - startTsRef.current;
        var remaining = Math.ceil(((data.durationMs || 20000) - elapsed) / 1000);
        if (remaining <= 0) {
          setTimeLeft(0);
          clearInterval(timerRef.current);
        } else {
          setTimeLeft(remaining);
        }
      }, 250);
    }

    function onAck(data) {
      setAnswerResult(data.isCorrect ? 'correct' : 'wrong');
    }

    function onResults(data) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setActiveQ(null);
      setResults(data);
      // Update local scoreboard
      setScores(function(prev) {
        var next = prev.slice();
        var myCorrect = data.correct.indexOf(username) >= 0;
        var myEntry = null;
        for (var i = 0; i < next.length; i++) {
          if (next[i].username === username) { myEntry = next[i]; break; }
        }
        if (!myEntry) { myEntry = { username: username, correct: 0, wrong: 0 }; next.push(myEntry); }
        if (myCorrect) { myEntry.correct += 1; setPopScore(true); setTimeout(function() { setPopScore(false); }, 600); }
        else if (selectedIdx !== null) { myEntry.wrong += 1; }
        next.sort(function(a, b) { return b.correct - a.correct; });
        return next;
      });
    }

    socket.on('trivia-question',   onQuestion);
    socket.on('trivia-answer-ack', onAck);
    socket.on('trivia-results',    onResults);
    return function() {
      socket.off('trivia-question',   onQuestion);
      socket.off('trivia-answer-ack', onAck);
      socket.off('trivia-results',    onResults);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [socket, username, selectedIdx]);

  function handleAnswer(idx) {
    if (selectedIdx !== null || !activeQ) return;
    setSelectedIdx(idx);
    if (socket) socket.emit('trivia-answer', { roomId: roomId, answerIdx: idx, username: username });
  }

  function handleSend() {
    if (!question.trim()) { addToast('Enter a question', 'error'); return; }
    var opts = options.filter(function(o) { return o.trim(); });
    if (opts.length < 2) { addToast('Need at least 2 options', 'error'); return; }
    setSending(true);
    socket.emit('trivia-start', {
      roomId:     roomId,
      question:   question.trim(),
      options:    options.map(function(o) { return { text: o.trim() || '—' }; }),
      correctIdx: correctIdx,
      durationMs: duration * 1000
    });
    setTimeout(function() { setSending(false); setQuestion(''); setOptions(['', '', '', '']); setCorrectIdx(0); }, 500);
    addToast('🎯 Trivia launched!', 'success');
  }

  function handleEndEarly() {
    if (socket) socket.emit('trivia-end', { roomId: roomId });
  }

  // ── Percent bar helper ──────────────────────────────────────────────────
  function getPct(votes, total) {
    if (!total) return 0;
    return Math.min(100, Math.floor((votes / total) * 100));
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG, fontFamily: "'Barlow Condensed',sans-serif", overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLE_TAG }} />

      {/* Header */}
      <div style={{ background: SURF, borderBottom: '1px solid ' + BORDER, padding: '10px 14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 2 }}>🎯 LIVE TRIVIA</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>
            {isHost ? 'Host: launch questions for your viewers' : 'Answer questions to earn points'}
          </div>
        </div>
        {/* Score pill */}
        {scores.length > 0 && (
          <div
            onClick={function() { setShowScores(function(v) { return !v; }); }}
            style={{ background: 'rgba(201,168,76,.12)', border: '1px solid ' + BORDER, borderRadius: 20, padding: '4px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1 }}>🏆</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, letterSpacing: 1, animation: popScore ? 'scorePop .5s ease' : 'none' }}>
              {(scores.find(function(s) { return s.username === username; }) || {}).correct || 0}
            </span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Active question (all users) ── */}
        {activeQ && (
          <div style={{ background: CARD, border: '1px solid rgba(201,168,76,.25)', borderRadius: 14, padding: 16, animation: 'triviaSlideIn .4s ease' }}>
            {/* Timer bar */}
            <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: timeLeft > 5 ? GOLD : RED,
                borderRadius: 2,
                animation: 'timerShrink ' + (activeQ.durationMs / 1000) + 's linear forwards',
                transformOrigin: 'left'
              }} />
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: TEXT, letterSpacing: 1, marginBottom: 12, lineHeight: 1.2 }}>
              {activeQ.question}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: timeLeft > 5 ? GOLD : RED, letterSpacing: 2, marginBottom: 12, textAlign: 'right' }}>
              {timeLeft}s
            </div>
            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeQ.options.map(function(opt, idx) {
                var chosen = selectedIdx === idx;
                var disabled = selectedIdx !== null;
                var animName = chosen && answerResult ? (answerResult === 'correct' ? 'triviaCorrect' : 'triviaWrong') : null;
                var borderColor = chosen
                  ? (answerResult === 'correct' ? GREEN : answerResult === 'wrong' ? RED : GOLD)
                  : BORDER;
                return (
                  <button
                    key={idx}
                    onClick={function() { handleAnswer(idx); }}
                    disabled={disabled}
                    style={{
                      background: chosen ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.04)',
                      border: '1.5px solid ' + borderColor,
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: disabled ? 'default' : 'pointer',
                      textAlign: 'left',
                      transition: 'border-color .15s, background .15s',
                      animation: animName ? (animName + ' .5s ease') : null
                    }}>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: chosen ? (answerResult === 'correct' ? GREEN : answerResult === 'wrong' ? RED : GOLD) : MUTED, letterSpacing: 1, flexShrink: 0, width: 18 }}>{OPTION_LABELS[idx]}</span>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: chosen ? TEXT : MUTED }}>{opt.text}</span>
                  </button>
                );
              })}
            </div>
            {/* Host end-early button */}
            {isHost && (
              <button onClick={handleEndEarly} style={{ marginTop: 14, background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 8, padding: '6px 14px', color: RED, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1 }}>
                END NOW
              </button>
            )}
          </div>
        )}

        {/* ── Results ── */}
        {results && !activeQ && (
          <div style={{ background: CARD, border: '1px solid rgba(201,168,76,.25)', borderRadius: 14, padding: 16, animation: 'triviaSlideIn .4s ease' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 8 }}>RESULTS</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: TEXT, letterSpacing: 1, marginBottom: 14, lineHeight: 1.2 }}>
              {results.question}
            </div>
            {results.options.map(function(opt, idx) {
              var isCorrect = idx === results.correctIdx;
              var pct = getPct(opt.votes, results.total);
              var wasMyAnswer = selectedIdx === idx;
              return (
                <div key={idx} style={{
                  marginBottom: 8,
                  background: isCorrect ? 'rgba(80,200,120,.1)' : wasMyAnswer ? 'rgba(255,26,60,.08)' : 'rgba(255,255,255,.03)',
                  border: '1.5px solid ' + (isCorrect ? 'rgba(80,200,120,.4)' : wasMyAnswer ? 'rgba(255,26,60,.3)' : BORDER),
                  borderRadius: 10,
                  padding: '10px 12px',
                  animation: isCorrect ? 'triviaCorrect .6s ease' : wasMyAnswer ? 'triviaWrong .5s ease' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: isCorrect ? GREEN : MUTED, letterSpacing: 1 }}>{OPTION_LABELS[idx]}</span>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: isCorrect ? GREEN : TEXT }}>{opt.text}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isCorrect && <span style={{ fontSize: 14 }}>✓</span>}
                      {wasMyAnswer && !isCorrect && <span style={{ fontSize: 12, color: RED }}>✗</span>}
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: isCorrect ? GREEN : MUTED, borderRadius: 2, transition: 'width .6s ease' }} />
                  </div>
                </div>
              );
            })}
            {results.correct.length > 0 && (
              <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>
                ✓ {results.correct.slice(0, 5).join(', ')}{results.correct.length > 5 ? ' +' + (results.correct.length - 5) + ' more' : ''} got it right
              </div>
            )}
          </div>
        )}

        {/* ── Scoreboard ── */}
        {showScores && scores.length > 0 && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, padding: 14 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: GOLD, letterSpacing: 2, marginBottom: 10 }}>🏆 SCOREBOARD</div>
            {scores.slice(0, 10).map(function(s, i) {
              var isMe = s.username === username;
              return (
                <div key={s.username} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < scores.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: i === 0 ? GOLD : i === 1 ? '#C0C0C0' : i === 2 ? AMBER : MUTED, width: 22, flexShrink: 0 }}>
                    {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)}
                  </span>
                  <span style={{ flex: 1, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: isMe ? GOLD : TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.username}{isMe ? ' (you)' : ''}
                  </span>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GREEN, letterSpacing: 1 }}>{s.correct}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>correct</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Host setup panel ── */}
        {isHost && !activeQ && (
          <div style={{ background: SURF, border: '1px solid ' + BORDER, borderRadius: 14, padding: 14 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: TEXT, letterSpacing: 2, marginBottom: 10 }}>LAUNCH QUESTION</div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, marginBottom: 5 }}>QUESTION</div>
              <textarea
                value={question}
                onChange={function(e) { setQuestion(e.target.value.slice(0, 200)); }}
                placeholder="Type your question..."
                rows={2}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,.3)', border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, resize: 'none', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, marginBottom: 5 }}>OPTIONS (tap ✓ to mark correct)</div>
              {options.map(function(opt, idx) {
                var isCorrectOpt = correctIdx === idx;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <button
                      onClick={function() { setCorrectIdx(idx); }}
                      style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: isCorrectOpt ? 'rgba(80,200,120,.25)' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (isCorrectOpt ? GREEN : BORDER), color: isCorrectOpt ? GREEN : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isCorrectOpt ? '✓' : OPTION_LABELS[idx]}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={function(e) {
                        var val = e.target.value.slice(0, 80);
                        setOptions(function(prev) { var next = prev.slice(); next[idx] = val; return next; });
                      }}
                      placeholder={'Option ' + OPTION_LABELS[idx]}
                      style={{ flex: 1, background: 'rgba(0,0,0,.3)', border: '1px solid ' + BORDER, borderRadius: 8, padding: '6px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none' }}
                    />
                  </div>
                );
              })}
            </div>

            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1 }}>TIMER</div>
              {[10, 20, 30, 60].map(function(sec) {
                return (
                  <button key={sec} onClick={function() { setDuration(sec); }}
                    style={{ background: duration === sec ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (duration === sec ? GOLD : BORDER), borderRadius: 6, padding: '4px 10px', color: duration === sec ? GOLD : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                    {sec}s
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !question.trim() || !isLive}
              style={{ width: '100%', background: (!question.trim() || !isLive) ? 'rgba(26,21,16,.5)' : 'linear-gradient(135deg,#800020,#C01838)', border: '1px solid ' + ((!question.trim() || !isLive) ? BORDER : '#C01838'), borderRadius: 10, padding: '12px', color: (!question.trim() || !isLive) ? MUTED : GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 3, cursor: (!question.trim() || !isLive) ? 'default' : 'pointer' }}>
              {!isLive ? 'GO LIVE TO LAUNCH' : sending ? 'LAUNCHING...' : '🎯 LAUNCH TRIVIA'}
            </button>
            {!isLive && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, textAlign: 'center', marginTop: 6 }}>Start your broadcast first</div>
            )}
          </div>
        )}

        {/* ── Empty state for viewers ── */}
        {!isHost && !activeQ && !results && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, paddingTop: 40 }}>
            <div style={{ fontSize: 40 }}>🎯</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: MUTED, letterSpacing: 2, textAlign: 'center' }}>WAITING FOR TRIVIA</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1, textAlign: 'center' }}>The host will launch a question soon</div>
          </div>
        )}
      </div>
    </div>
  );
}
