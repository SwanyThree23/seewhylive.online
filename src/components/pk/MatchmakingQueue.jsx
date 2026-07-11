import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Users, Zap, Clock, Swords, LogIn, LogOut, Shield, Trophy, Star, RefreshCw } from 'lucide-react';

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

var levelColor = {
  Beginner: ET.moss,
  Intermediate: ET.terracotta,
  Advanced: ET.gold,
  Elite: ET.burgundy,
};

export default function MatchmakingQueue({ user, onMatchFound }) {
  var qc = useQueryClient();
  var [inQueue, setInQueue] = useState(false);
  var [myLevel, setMyLevel] = useState('Intermediate');
  var [myCategory, setMyCategory] = useState('Any');
  var [matchingFor, setMatchingFor] = useState(0);
  var [matchedWith, setMatchedWith] = useState(null);
  var [myQueueId, setMyQueueId] = useState(null);
  var intervalRef = React.useRef(null);

  // Fetch real queue from backend
  var { data: liveQueue = [], isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ['pk-queue'],
    queryFn: function() { return base44.entities.PKBattle.filter({ status: 'seeking' }); },
    refetchInterval: 10000,
  });

  // Real-time subscription: detect when someone challenges us
  useEffect(function() {
    if (!inQueue || !myQueueId) return;
    var unsub = base44.entities.PKBattle.subscribe(function(event) {
      if (event.type === 'update' && event.id === myQueueId && event.data.status === 'active') {
        clearInterval(intervalRef.current);
        var match = { id: event.data.id, name: event.data.challenger_name || 'Challenger' };
        setMatchedWith(match);
        setInQueue(false);
        toast.success('Match found! ' + match.name + ' accepted your challenge!');
        if (onMatchFound) { onMatchFound(event.data); }
      }
    });
    return unsub;
  }, [inQueue, myQueueId, onMatchFound]);

  var joinMutation = useMutation({
    mutationFn: function() {
      return base44.entities.PKBattle.create({
        creator_id: user?.id,
        creator_name: user?.full_name || user?.email || 'Host',
        status: 'seeking',
        category: myCategory === 'Any' ? null : myCategory,
        skill_level: myLevel,
        creator_score: 0,
        challenger_score: 0,
      });
    },
    onSuccess: function(data) {
      setMyQueueId(data.id);
      setInQueue(true);
      setMatchingFor(0);
      setMatchedWith(null);
      qc.invalidateQueries({ queryKey: ['pk-queue'] });
      intervalRef.current = setInterval(function() {
        setMatchingFor(function(s) { return s + 1; });
      }, 1000);
    },
    onError: function(err) { toast.error('Could not join queue: ' + err.message); },
  });

  var leaveMutation = useMutation({
    mutationFn: function() {
      if (!myQueueId) return Promise.resolve();
      return base44.entities.PKBattle.update(myQueueId, { status: 'cancelled' });
    },
    onSettled: function() {
      clearInterval(intervalRef.current);
      setInQueue(false);
      setMatchingFor(0);
      setMyQueueId(null);
      qc.invalidateQueries({ queryKey: ['pk-queue'] });
      toast('Left the matchmaking queue');
    },
    onError: function() { toast.error('Failed to leave queue.'); },
  });

  var challengeMutation = useMutation({
    mutationFn: function(opponent) {
      return base44.entities.PKBattle.update(opponent.id, {
        challenger_id: user?.id,
        challenger_name: user?.full_name || user?.email || 'Challenger',
        status: 'active',
        started_at: new Date().toISOString(),
        duration_seconds: 180,
      });
    },
    onSuccess: function(data, opponent) {
      toast.success('Challenged ' + opponent.creator_name + '!');
      if (onMatchFound) { onMatchFound(data); }
      qc.invalidateQueries({ queryKey: ['pk-queue'] });
    },
    onError: function(err) { toast.error('Challenge failed: ' + err.message); },
  });

  function joinQueue() { joinMutation.mutate(); }

  function leaveQueue() { leaveMutation.mutate(); }

  React.useEffect(function() {
    return function() { clearInterval(intervalRef.current); };
  }, []);

  // Filter queue: exclude own entry and closed battles; apply category filter
  var visibleQueue = liveQueue.filter(function(p) {
    if (p.id === myQueueId) return false;
    if (myCategory !== 'Any' && p.category && p.category !== myCategory) return false;
    return true;
  });

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
            disabled={joinMutation.isPending}
            style={{
              width: '100%', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14,
              textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'pointer',
              background: joinMutation.isPending ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, ' + ET.rust + ', ' + ET.gold + ')',
              color: '#fff', border: 'none', borderRadius: 8, opacity: joinMutation.isPending ? 0.7 : 1,
            }}
          >
            <LogIn className="w-4 h-4" /> {joinMutation.isPending ? 'Joining…' : 'Join Matchmaking Queue'}
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
              disabled={leaveMutation.isPending}
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
              Live Queue · {visibleQueue.length} waiting
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={function() { refetchQueue(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: ET.sand + '60', padding: 4 }}>
              <RefreshCw className="w-3 h-3" />
            </button>
            <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: ET.terracotta + '22', color: ET.terracotta, border: '1px solid ' + ET.terracotta + '40' }}>
              OPEN
            </span>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {queueLoading ? (
            <div className="text-center py-6 text-[10px]" style={{ color: ET.sand + '50' }}>Loading queue…</div>
          ) : visibleQueue.length === 0 ? (
            <div className="text-center py-8 text-[11px]" style={{ color: ET.sand + '40' }}>
              No challengers in queue — join to be the first!
            </div>
          ) : visibleQueue.map(function(p) {
            var lc = levelColor[p.skill_level] || ET.gold;
            var waitSecs = p.created_at ? Math.floor((Date.now() - new Date(p.created_at).getTime()) / 1000) : 0;
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0" style={{ background: lc + '22', border: '1px solid ' + lc + '40', color: lc }}>
                  {(p.creator_name || '?').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: ET.cream }}>{p.creator_name || 'Unknown'}</span>
                    {p.skill_level && <span className="text-[11px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: lc + '18', color: lc }}>{p.skill_level}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {p.category && <span className="text-[10px]" style={{ color: ET.sand + '80' }}>{p.category}</span>}
                    <span className="text-[10px]" style={{ color: ET.sand + '50' }}>waiting {waitSecs}s</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <button
                    onClick={function() { challengeMutation.mutate(p); }}
                    disabled={challengeMutation.isPending || inQueue}
                    style={{
                      height: 26, fontSize: 10, padding: '0 10px', borderRadius: 6, cursor: 'pointer',
                      background: 'rgba(128,0,32,0.25)', color: ET.terracotta, border: '1px solid rgba(128,0,32,0.45)',
                      opacity: (challengeMutation.isPending || inQueue) ? 0.5 : 1,
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
