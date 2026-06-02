import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Trophy, Plus, Play, Users, Swords, Crown, ChevronRight, Calendar, Zap } from 'lucide-react';

var ET = {
  rust: '#6B4423',
  gold: '#d4af37',
  terracotta: '#CC7755',
  moss: '#6B7C4A',
  clay: '#8B6F47',
  sand: '#C4A882',
  cream: '#F5F0E8',
  darkEarth: '#2C1810',
  midEarth: '#3D2B1F',
  lightEarth: '#4A3728',
};

/* Generate an 8-person single-elimination bracket */
var INITIAL_PLAYERS = [
  'StormCaster', 'NeonBeat', 'TalkMaster99', 'PixelQueen',
  'IRL_Drifter', 'BeatDropKing', 'GameSlayer', 'CraftedByAI'
];

function generateBracket(players) {
  var rounds = [];
  var current = players.map(function(name, i) {
    return { id: 'p' + i, name: name, score: 0, winner: null };
  });

  while (current.length > 1) {
    var matches = [];
    for (var i = 0; i < current.length; i += 2) {
      matches.push({
        id: 'match_r' + rounds.length + '_' + (i / 2),
        player1: current[i],
        player2: current[i + 1] || null,
        winner: null,
        score1: 0,
        score2: 0,
        status: 'pending',
      });
    }
    rounds.push(matches);
    current = matches.map(function(m) { return { id: m.id + '_w', name: '?', score: 0 }; });
  }
  return rounds;
}

function BracketMatch({ match, roundIdx, matchIdx, onAdvance }) {
  var isLive = match.status === 'active';
  var isComplete = match.status === 'complete';

  function simulateResult() {
    var winner = Math.random() > 0.5 ? 'player1' : 'player2';
    var s1 = Math.floor(Math.random() * 400) + 100;
    var s2 = Math.floor(Math.random() * 400) + 100;
    if (winner === 'player1' && s2 >= s1) { s1 = s2 + Math.floor(Math.random() * 100) + 1; }
    if (winner === 'player2' && s1 >= s2) { s2 = s1 + Math.floor(Math.random() * 100) + 1; }
    onAdvance(roundIdx, matchIdx, winner, s1, s2);
    toast.success((winner === 'player1' ? match.player1.name : match.player2.name) + ' advances!');
  }

  var p1 = match.player1;
  var p2 = match.player2;
  var winnerName = match.winner === 'player1' ? (p1 && p1.name) : (p2 && p2.name);

  return (
    <div
      className="rounded-xl overflow-hidden min-w-[140px]"
      style={{
        background: isLive ? ET.midEarth : ET.darkEarth,
        border: '1px solid ' + (isComplete ? ET.gold + '40' : isLive ? ET.terracotta + '50' : 'rgba(255,255,255,0.07)'),
      }}
    >
      {[p1, p2].map(function(p, idx) {
        if (!p) { return null; }
        var isW = (idx === 0 && match.winner === 'player1') || (idx === 1 && match.winner === 'player2');
        var score = idx === 0 ? match.score1 : match.score2;
        return (
          <div
            key={idx}
            className="flex items-center gap-2 px-3 py-2"
            style={{
              background: isW ? ET.gold + '18' : 'transparent',
              borderBottom: idx === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0"
              style={{ background: isW ? ET.gold : 'rgba(255,255,255,0.08)', color: isW ? '#000' : ET.sand + '80' }}
            >
              {p.name.charAt(0)}
            </div>
            <span className="text-[11px] font-bold flex-1 truncate" style={{ color: isW ? ET.gold : p.name === '?' ? 'rgba(255,255,255,0.2)' : ET.cream }}>
              {p.name}
            </span>
            {isComplete && <span className="text-[10px] font-black font-mono" style={{ color: isW ? ET.gold : ET.sand + '50' }}>{score}</span>}
            {isW && <Crown className="w-3 h-3 shrink-0" style={{ color: ET.gold }} />}
          </div>
        );
      })}
      {!isComplete && p1 && p2 && p1.name !== '?' && p2.name !== '?' && (
        <button
          onClick={simulateResult}
          className="w-full py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all"
          style={{ background: isLive ? ET.burgundy + '30' : 'rgba(255,255,255,0.04)', color: isLive ? ET.terracotta : ET.sand + '50' }}
        >
          {isLive ? '⚡ Simulate' : '▶ Start'}
        </button>
      )}
    </div>
  );
}

var ROUND_NAMES = ['Round of 8', 'Semifinals', 'Grand Final'];

export default function TournamentBracket() {
  var [playerNames, setPlayerNames] = useState(INITIAL_PLAYERS.slice());
  var [newPlayer, setNewPlayer] = useState('');
  var [bracket, setBracket] = useState(null);
  var [tournamentName, setTournamentName] = useState('PK Battle Tournament');
  var [started, setStarted] = useState(false);
  var [champion, setChampion] = useState(null);

  function startTournament() {
    var filled = playerNames.filter(function(n) { return n.trim(); });
    if (filled.length < 2) { toast.error('Need at least 2 players'); return; }
    // Pad to next power of 2
    var size = 2;
    while (size < filled.length) { size *= 2; }
    while (filled.length < size) { filled.push('BYE_' + filled.length); }
    setBracket(generateBracket(filled));
    setStarted(true);
    setChampion(null);
  }

  function handleAdvance(roundIdx, matchIdx, winner, s1, s2) {
    setBracket(function(prev) {
      var next = prev.map(function(r) { return r.map(function(m) { return Object.assign({}, m); }); });
      var match = next[roundIdx][matchIdx];
      match.winner = winner;
      match.score1 = s1;
      match.score2 = s2;
      match.status = 'complete';

      var winnerPlayer = winner === 'player1' ? match.player1 : match.player2;

      // Advance to next round
      if (roundIdx + 1 < next.length) {
        var nextMatchIdx = Math.floor(matchIdx / 2);
        var slot = matchIdx % 2 === 0 ? 'player1' : 'player2';
        next[roundIdx + 1][nextMatchIdx][slot] = Object.assign({}, winnerPlayer);
      } else {
        // Final round complete — champion!
        setChampion(winnerPlayer.name);
        toast.success('🏆 ' + winnerPlayer.name + ' is the CHAMPION!');
      }
      return next;
    });
  }

  function reset() {
    setBracket(null);
    setStarted(false);
    setChampion(null);
  }

  return (
    <div className="space-y-4">

      {/* Champion banner */}
      <AnimatePresence>
        {champion && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 text-center"
            style={{ background: 'linear-gradient(135deg, ' + ET.burgundy + '40, ' + ET.gold + '20)', border: '2px solid ' + ET.gold + '60' }}
          >
            <div className="text-5xl mb-2">🏆</div>
            <p className="text-xs uppercase tracking-[0.3em] mb-1" style={{ color: ET.sand }}>Tournament Champion</p>
            <h2 className="text-3xl font-black" style={{ fontFamily: 'Orbitron, monospace', color: ET.gold }}>{champion}</h2>
            <button
              onClick={reset}
              style={{
                marginTop: 12, fontSize: 12, padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
                background: ET.midEarth, color: ET.sand, border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              New Tournament
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!started ? (
        /* Setup screen */
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: ET.midEarth, border: '1px solid ' + ET.gold + '25' }}>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4" style={{ color: ET.gold }} />
              <span className="text-sm font-black uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: ET.gold }}>Tournament Setup</span>
            </div>

            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: ET.sand }}>Tournament Name</label>
              <input
                value={tournamentName}
                onChange={function(e) { setTournamentName(e.target.value); }}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: ET.cream }}
              />
            </div>

            <div className="mb-3">
              <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: ET.sand }}>Players ({playerNames.length})</label>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {playerNames.map(function(name, i) {
                  return (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-black shrink-0" style={{ background: ET.terracotta + '40', color: ET.terracotta }}>
                        {i + 1}
                      </div>
                      <input
                        value={name}
                        onChange={function(e) {
                          var v = e.target.value;
                          setPlayerNames(function(prev) { var n = prev.slice(); n[i] = v; return n; });
                        }}
                        className="flex-1 bg-transparent text-xs focus:outline-none min-w-0"
                        style={{ color: ET.cream }}
                      />
                      <button
                        onClick={function() { setPlayerNames(function(prev) { return prev.filter(function(_, j) { return j !== i; }); }); }}
                        className="text-white/20 hover:text-red-400 text-xs"
                      >×</button>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  value={newPlayer}
                  onChange={function(e) { setNewPlayer(e.target.value); }}
                  onKeyDown={function(e) {
                    if (e.key === 'Enter' && newPlayer.trim()) {
                      setPlayerNames(function(p) { return p.concat([newPlayer.trim()]); });
                      setNewPlayer('');
                    }
                  }}
                  placeholder="Add player..."
                  className="flex-1 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: ET.cream }}
                />
                <button
                  onClick={function() {
                    if (newPlayer.trim()) { setPlayerNames(function(p) { return p.concat([newPlayer.trim()]); }); setNewPlayer(''); }
                  }}
                  style={{
                    height: 32, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
                    background: ET.terracotta + '30', color: ET.terracotta, border: '1px solid ' + ET.terracotta + '50',
                  }}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <button
              onClick={startTournament}
              style={{
                width: '100%', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14,
                textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'pointer',
                background: 'linear-gradient(90deg, ' + ET.rust + ', ' + ET.clay + ')',
                color: '#fff', border: 'none', borderRadius: 8,
              }}
            >
              <Play className="w-4 h-4" /> Generate Bracket & Start
            </button>
          </div>
        </div>
      ) : (
        /* Bracket view */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: ET.gold }}>{tournamentName}</h2>
            <button
              onClick={reset}
              style={{
                fontSize: 12, padding: '4px 12px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', color: ET.sand, border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Reset
            </button>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex gap-8 min-w-max">
              {bracket.map(function(round, ri) {
                return (
                  <div key={ri} className="flex flex-col gap-4">
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                        style={{ background: ET.gold + '15', color: ET.gold, border: '1px solid ' + ET.gold + '30' }}>
                        {ROUND_NAMES[ri] || 'Round ' + (ri + 1)}
                      </span>
                    </div>
                    <div className="flex flex-col justify-around" style={{ gap: ri === 0 ? '12px' : ri === 1 ? '80px' : '180px' }}>
                      {round.map(function(match, mi) {
                        return (
                          <BracketMatch
                            key={match.id}
                            match={match}
                            roundIdx={ri}
                            matchIdx={mi}
                            onAdvance={handleAdvance}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px]" style={{ color: ET.sand + '60' }}>
            <span>Click ▶ Start to run a match · ⚡ Simulate auto-determines winner</span>
          </div>
        </div>
      )}
    </div>
  );
}
