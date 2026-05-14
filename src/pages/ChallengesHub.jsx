import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Trophy, Clock, Users, CheckCircle, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const B = '#800020';
const OB = '#0D0D0D';
const OB2 = '#1A1A1A';
const CREAM = '#F5E6D3';

const TYPE_COLORS = {
  attendance: '#00F5FF',
  engagement: G,
  content:    '#8B5CF6',
  referral:   '#00FF88',
};

function Countdown({ endDate }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`);
    };
    calc();
    const iv = setInterval(calc, 60000);
    return () => clearInterval(iv);
  }, [endDate]);
  return <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{remaining}</span>;
}

function ChallengeCard({ challenge, onJoin, isJoined, myProgress }) {
  const pct = Math.min(100, Math.round(((challenge.participant_count || 0) / (challenge.goal_value || 100)) * 100));
  const typeColor = TYPE_COLORS[challenge.type] || G;

  return (
    <div className="rounded-xl p-4 space-y-3"
      style={{ background: OB2, border: `1px solid ${typeColor}22` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded"
              style={{ background: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}25`, fontFamily: 'Barlow Condensed, sans-serif' }}>
              {challenge.type}
            </span>
            {challenge.reward_type && (
              <span className="text-[7px] px-1.5 py-0.5 rounded font-black uppercase"
                style={{ background: `${G}12`, color: G, border: `1px solid ${G}22`, fontFamily: 'Barlow Condensed, sans-serif' }}>
                🏆 {challenge.reward_type}
              </span>
            )}
          </div>
          <h3 className="font-black text-[13px]" style={{ color: CREAM, fontFamily: 'Barlow Condensed, sans-serif' }}>{challenge.title}</h3>
          {challenge.description && <p className="text-[9px] mt-0.5" style={{ color: 'rgba(245,230,211,0.4)' }}>{challenge.description}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[8px]" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>Ends</p>
          <p className="text-[9px] font-bold" style={{ color: typeColor, fontFamily: 'IBM Plex Mono, monospace' }}>
            {challenge.end_date ? <Countdown endDate={challenge.end_date} /> : 'Ongoing'}
          </p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[8px] mb-1" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>
          <span><Users className="w-2.5 h-2.5 inline mr-0.5" />{challenge.participant_count || 0} participants</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
            className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${B}, ${typeColor})` }} />
        </div>
      </div>

      {isJoined
        ? <div className="flex items-center gap-1.5 text-[9px]" style={{ color: '#00FF88' }}>
            <CheckCircle className="w-3.5 h-3.5" /> Joined
            {myProgress !== undefined && <span style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>· Progress: {myProgress}</span>}
          </div>
        : <button onClick={() => onJoin(challenge)}
            className="w-full py-2 rounded-xl font-black uppercase text-[10px]"
            style={{ background: B, color: G, border: `1px solid ${G}40`, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Join Challenge
          </button>
      }
    </div>
  );
}

function LeaderboardModal({ challenge, onClose }) {
  const { data: participants = [] } = useQuery({
    queryKey: ['challenge-lb', challenge.id],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ challenge_id: challenge.id }, '-score', 20),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: OB2, border: `1px solid ${G}25` }}
        onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="font-black uppercase text-[11px]" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>Leaderboard</span>
          <button onClick={onClose} className="text-white/40 text-lg">×</button>
        </div>
        <div className="p-3 max-h-72 overflow-y-auto space-y-1.5">
          {participants.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{ background: i < 3 ? `${[G,'#C0C0C0','#cd7f32'][i]}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${i < 3 ? [G,'#C0C0C0','#cd7f32'][i] : 'rgba(255,255,255,0.06)'}25` }}>
              <span className="text-base">{['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
              <span className="flex-1 text-[10px] font-bold" style={{ color: CREAM }}>{p.user_id}</span>
              <span className="font-black text-[11px]" style={{ color: G, fontFamily: 'IBM Plex Mono, monospace' }}>{p.score || 0}</span>
            </div>
          ))}
          {participants.length === 0 && <p className="text-center py-4 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No participants yet</p>}
        </div>
      </div>
    </div>
  );
}

const TABS = ['Active', 'My Progress', 'Upcoming', 'Completed'];

export default function ChallengesHubPage() {
  const [activeTab, setActiveTab] = useState('Active');
  const [lbChallenge, setLbChallenge] = useState(null);
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: active = [] } = useQuery({
    queryKey: ['challenges-active'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'active' }, 'end_date', 30),
  });
  const { data: upcoming = [] } = useQuery({
    queryKey: ['challenges-upcoming'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'upcoming' }, 'start_date', 20),
  });
  const { data: myParticipations = [] } = useQuery({
    queryKey: ['challenges-my', user?.id],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ user_id: user.id }, '-created_date', 30),
    enabled: !!user?.id,
  });

  const joinedIds = new Set(myParticipations.map(p => p.challenge_id));
  const completedParts = myParticipations.filter(p => p.completed);

  const joinMut = useMutation({
    mutationFn: (ch) => base44.entities.ChallengeParticipant.create({
      challenge_id: ch.id,
      user_id: user.id,
      progress: 0,
      score: 0,
      completed: false,
    }),
    onSuccess: () => { qc.invalidateQueries(['challenges-my', user?.id]); toast.success('Joined challenge!'); },
  });

  return (
    <div className="min-h-screen" style={{ background: OB }}>
      <div className="px-4 md:px-8 py-4" style={{ background: OB2, borderBottom: `1px solid ${G}18` }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5" style={{ color: G }} />
            <h1 className="text-xl font-black uppercase" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>Challenges</h1>
          </div>
          <div className="flex gap-0.5">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 text-[9px] font-black uppercase border-b-2 transition-all"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', color: activeTab === tab ? G : 'rgba(245,230,211,0.3)', borderBottomColor: activeTab === tab ? G : 'transparent', background: activeTab === tab ? `${G}08` : 'transparent' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-5 space-y-3">
        {activeTab === 'Active' && (
          active.length === 0
            ? <p className="text-center py-12 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No active challenges</p>
            : active.map(ch => (
              <div key={ch.id}>
                <ChallengeCard challenge={ch}
                  isJoined={joinedIds.has(ch.id)}
                  myProgress={myParticipations.find(p => p.challenge_id === ch.id)?.progress}
                  onJoin={(c) => joinMut.mutate(c)} />
                <button onClick={() => setLbChallenge(ch)}
                  className="w-full mt-1 py-1.5 rounded-lg text-[8px] font-black uppercase"
                  style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(245,230,211,0.3)', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  <BarChart2 className="w-3 h-3 inline mr-1" /> View Leaderboard
                </button>
              </div>
            ))
        )}

        {activeTab === 'My Progress' && (
          myParticipations.length === 0
            ? <p className="text-center py-12 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Join challenges to see your progress</p>
            : myParticipations.map(part => {
              const ch = [...active, ...upcoming].find(c => c.id === part.challenge_id);
              return (
                <div key={part.id} className="rounded-xl p-3 space-y-2" style={{ background: OB2, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold" style={{ color: CREAM }}>{ch?.title || part.challenge_id}</p>
                    {part.completed && <span className="text-[8px] px-1.5 py-0.5 rounded font-black" style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }}>✓ DONE</span>}
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((part.progress || 0) / (ch?.goal_value || 100)) * 100)}%`, background: `linear-gradient(90deg, ${B}, ${G})` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px]" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>
                      {part.progress || 0} / {ch?.goal_value || '?'} · Score: {part.score || 0}
                    </span>
                    <button onClick={() => ch && setLbChallenge(ch)} className="text-[7px]" style={{ color: G }}>Leaderboard</button>
                  </div>
                </div>
              );
            })
        )}

        {activeTab === 'Upcoming' && (
          upcoming.length === 0
            ? <p className="text-center py-12 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No upcoming challenges</p>
            : upcoming.map(ch => (
              <div key={ch.id} className="rounded-xl p-4 space-y-2" style={{ background: OB2, border: `1px solid rgba(255,255,255,0.07)` }}>
                <div className="flex items-start justify-between">
                  <h3 className="font-black text-[12px]" style={{ color: CREAM, fontFamily: 'Barlow Condensed, sans-serif' }}>{ch.title}</h3>
                  <span className="text-[7px] px-1.5 py-0.5 rounded font-black uppercase" style={{ background: `${G}12`, color: G, border: `1px solid ${G}25`, fontFamily: 'Barlow Condensed, sans-serif' }}>UPCOMING</span>
                </div>
                {ch.start_date && (
                  <p className="text-[9px]" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>
                    Starts: <Countdown endDate={ch.start_date} />
                  </p>
                )}
              </div>
            ))
        )}

        {activeTab === 'Completed' && (
          completedParts.length === 0
            ? <p className="text-center py-12 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No completed challenges yet</p>
            : completedParts.map(part => (
              <div key={part.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: OB2, border: `1px solid ${G}20` }}>
                <Trophy className="w-6 h-6 shrink-0" style={{ color: G }} />
                <div className="flex-1">
                  <p className="text-[11px] font-bold" style={{ color: CREAM }}>{part.challenge_id}</p>
                  <p className="text-[8px]" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>Score: {part.score || 0}{part.rank ? ` · Rank #${part.rank}` : ''}</p>
                </div>
                <CheckCircle className="w-5 h-5" style={{ color: '#00FF88' }} />
              </div>
            ))
        )}
      </div>

      <AnimatePresence>
        {lbChallenge && <LeaderboardModal challenge={lbChallenge} onClose={() => setLbChallenge(null)} />}
      </AnimatePresence>
    </div>
  );
}