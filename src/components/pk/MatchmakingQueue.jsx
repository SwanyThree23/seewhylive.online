import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Users, Zap, Clock, Swords, LogIn, LogOut, Shield, Trophy, Star } from 'lucide-react';

/* Earth tone palette */
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
};

var SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
var CATEGORIES = ['Gaming', 'Music', 'Talk', 'IRL', 'Art', 'Tech', 'Fitness', 'Any'];

var MOCK_QUEUE = [
  { id: 'q1', name: 'StormCaster', level: 'Advanced', category: 'Gaming', viewers: 1240, wait: 45, wins: 23, losses: 8 },
  { id: 'q2', name: 'NeonBeat', level: 'Intermediate', category: 'Music', viewers: 880, wait: 120, wins: 14, losses: 11 },
  { id: 'q3', name: 'TalkMaster99', level: 'Elite', category: 'Talk', viewers: 3200, wait: 20, wins: 41, losses: 6 },
  { id: 'q4', name: 'PixelQueen', level: 'Advanced', category: 'Art', viewers: 560, wait: 90, wins: 19, losses: 14 },
  { id: 'q5', name: 'IRL_Drifter', level: 'Beginner', category: 'IRL', viewers: 340, wait: 200, wins: 5, losses: 7 },
];

var levelColor = {
  Beginner: ET.moss,
  Intermediate: ET.terracotta,
  Advanced: ET.gold,
  Elite: ET.burgundy,
};

export default function MatchmakingQueue({ user, onMatchFound }) {
  var [inQueue, setInQueue] = useState(false);
  var [myLevel, setMyLevel] = useState('Intermediate');
  var [myCategory, setMyCategory] = useState('Any');
  var [matchingFor, setMatchingFor] = useState(0);
  var [matchedWith, setMatchedWith] = useState(null);
  var intervalRef = React.useRef(null);

  function joinQueue() {
    setInQueue(true);
    setMatchingFor(0);
    setMatchedWith(null);
    intervalRef.current = setInterval(function() {
      setMatchingFor(function(s) {
        var next = s + 1;
        // Simulate a match after 8 seconds
        if (next === 8) {
          clearInterval(intervalRef.current);
          var match = MOCK_QUEUE.find(function(p) {
            return myCategory === 'Any' || p.category === myCategory;
          }) || MOCK_QUEUE[0];
          setMatchedWith(match);
          setInQueue(false);
          toast.success('Match found! ' + match.name + ' wants to battle!');
          if (onMatchFound) { onMatchFound(match); }
        }
        return next;
      });
    }, 1000);
  }

  function leaveQueue() {
    clearInterval(intervalRef.current);
    setInQueue(false);
    setMatchingFor(0);
    toast('Left the matchmaking queue');
  }

  React.useEffect(function() {
    return function() { clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="space-y-4">

      {/* My Queue Settings */}
      <div className="rounded-2xl p-5" style={{ background: ET.midEarth, border: '1px solid ' + ET.gold + '35' }}>
        <div className="flex items-center gap-2 mb-4">
          <Swords className="w-4 h-4" style={{ color: ET.gold }} />
          <span className="text-sm font-black uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: ET.gold }}>
            My Queue Settings
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-2" style={{ color: ET.sand }}>Skill Level</label>
            <div className="grid grid-cols-2 gap-1.5">
              {SKILL_LEVELS.map(function(l) {
                var active = myLevel === l;
                return (
                  <button
                    key={l}
                    onClick={function() { setMyLevel(l); }}
                    disabled={inQueue}
                    className="py-1.5 text-[10px] font-bold rounded-lg uppercase transition-all"
                    style={{
                      background: active ? levelColor[l] : 'rgba(255,255,255,0.05)',
                      color: active ? '#fff' : ET.sand + '99',
                      border: '1px solid ' + (active ? levelColor[l] : 'rgba(255,255,255,0.08)')
                    }}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-2" style={{ color: ET.sand }}>Category</label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.slice(0, 6).map(function(c) {
                var active = myCategory === c;
                return (
                  <button
                    key={c}
                    onClick={function() { setMyCategory(c); }}
                    disabled={inQueue}
                    className="py-1.5 text-[10px] font-bold rounded-lg transition-all"
                    style={{
                      background: active ? ET.terracotta + 'CC' : 'rgba(255,255,255,0.04)',
                      color: active ? '#fff' : ET.sand + '80',
                      border: '1px solid ' + (active ? ET.terracotta : 'rgba(255,255,255,0.07)')
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Queue action */}
        {!inQueue && !matchedWith && (
          <button
            onClick={joinQueue}
            style={{
              width: '100%', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14,
              textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'pointer',
              background: 'linear-gradient(90deg, ' + ET.rust + ', ' + ET.gold + ')',
              color: '#fff', border: 'none', borderRadius: 8,
            }}
          >
            <LogIn className="w-4 h-4" /> Join Matchmaking Queue
          </button>
        )}

        {inQueue && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: ET.gold }} />
                <span className="text-sm font-bold" style={{ color: ET.gold }}>Searching for opponent...</span>
              </div>
              <span className="text-sm font-black font-mono" style={{ color: ET.sand }}>{matchingFor}s</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, ' + ET.burgundy + ', ' + ET.gold + ')' }}
                animate={{ width: ['0%', '80%', '65%', '90%'] }}
                transition={{ duration: 8, ease: 'easeInOut' }}
              />
            </div>
            <button
              onClick={leaveQueue}
              style={{
                width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, fontSize: 12, cursor: 'pointer', borderRadius: 8,
                background: 'rgba(128,0,32,0.2)', color: ET.terracotta, border: '1px solid rgba(128,0,32,0.35)',
              }}
            >
              <LogOut className="w-3 h-3" /> Leave Queue
            </button>
          </div>
        )}

        {matchedWith && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-4 text-center"
            style={{ background: ET.gold + '12', border: '2px solid ' + ET.gold + '50' }}
          >
            <div className="text-3xl mb-2">⚔️</div>
            <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Match Found!</p>
            <p className="text-xl font-black" style={{ color: ET.gold }}>{matchedWith.name}</p>
            <p className="text-xs mb-3" style={{ color: ET.sand }}>
              {matchedWith.level} · {matchedWith.category} · {matchedWith.viewers.toLocaleString()} viewers
            </p>
            <div className="flex gap-2">
              <button
                style={{
                  flex: 1, fontSize: 12, fontWeight: 700, padding: '6px 0', borderRadius: 8,
                  background: ET.rust, color: '#fff', border: 'none', cursor: 'pointer',
                }}
              >
                Accept Match
              </button>
              <button
                onClick={function() { setMatchedWith(null); }}
                style={{
                  flex: 1, fontSize: 12, padding: '6px 0', borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)', color: ET.sand,
                  border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                }}
              >
                Decline
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Live queue */}
      <div className="rounded-2xl overflow-hidden" style={{ background: ET.darkEarth, border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: ET.terracotta }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: ET.terracotta }}>
              Live Queue · {MOCK_QUEUE.length} waiting
            </span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: ET.terracotta + '22', color: ET.terracotta, border: '1px solid ' + ET.terracotta + '40' }}>
            OPEN
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {MOCK_QUEUE.map(function(p) {
            var lc = levelColor[p.level] || ET.gold;
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0" style={{ background: lc + '22', border: '1px solid ' + lc + '40', color: lc }}>
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: ET.cream }}>{p.name}</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: lc + '18', color: lc }}>{p.level}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px]" style={{ color: ET.sand + '80' }}>{p.category}</span>
                    <span className="text-[10px]" style={{ color: ET.sand + '60' }}>{p.viewers.toLocaleString()} viewers</span>
                    <span className="text-[10px]" style={{ color: ET.sand + '50' }}>{p.wins}W/{p.losses}L</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: ET.sand + '60' }}>
                    <Clock className="w-2.5 h-2.5" />
                    {p.wait}s
                  </div>
                  <button
                    style={{
                      marginTop: 4, height: 24, fontSize: 10, padding: '0 8px', borderRadius: 6, cursor: 'pointer',
                      background: ET.burgundy + '30', color: ET.terracotta, border: '1px solid ' + ET.burgundy + '50',
                    }}
                  >
                    Challenge
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
