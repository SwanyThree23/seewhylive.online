import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Swords, Trophy, Crown, ArrowLeft, Plus, Users, Zap, Clock,
  Gift, Send, CheckCircle, XCircle, Star, Flame, Search,
  BarChart2, Shield, AlertCircle, Copy, Share2, Sparkles,
  ChevronRight, Play, Square, RefreshCw, Medal
} from 'lucide-react';
import MatchmakingQueue from '../components/pk/MatchmakingQueue';
import TournamentBracket from '../components/pk/TournamentBracket';
import PKAnalyticsDashboard from '../components/pk/PKAnalyticsDashboard';
import BattleOverlay from '../components/pk/BattleOverlay';
import VideoSourcePicker, { getYouTubeId, detectVideoType } from '../components/video/VideoSourcePicker';
import VideoPlayerControls from '../components/video/VideoPlayerControls';

function Button({ children, onClick, className = '', style = {}, disabled, variant, size, ...rest }) {
  return (
    <button onClick={onClick} disabled={disabled} {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-black uppercase text-xs transition-all ${className}`}
      style={{ padding: size === 'sm' ? '6px 12px' : size === 'icon' ? '6px' : '8px 16px', background: variant === 'ghost' ? 'transparent' : variant === 'outline' ? 'rgba(255,255,255,0.06)' : 'rgba(212,175,55,0.15)', border: variant === 'ghost' ? 'none' : '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: disabled ? 'default' : 'pointer', fontFamily: 'Barlow Condensed, sans-serif', opacity: disabled ? 0.4 : 1, ...style }}>
      {children}
    </button>
  );
}
function Badge({ children, className = '', style = {} }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full uppercase ${className}`}
      style={{ fontFamily: 'Barlow Condensed, sans-serif', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)', ...style }}>
      {children}
    </span>
  );
}

/* ─── Earth Tone Palette (No Pink) ─── */
var ET = {
  rust: '#6B4423',
  gold: '#d4af37',
  terracotta: '#CC7755',
  moss: '#6B7C4A',
  clay: '#8B6F47',
  sand: '#C4A882',
  cream: '#F5F0E8',
  darkEarth: 'rgba(8,11,24,0.95)',
  midEarth: 'rgba(8,11,24,0.9)',
  bg: '#080B18',
};

/* ─── Constants ─── */
var GIFTS = [
  { emoji: '🌹', label: 'Rose', pts: 1, usd: 0.10 },
  { emoji: '🍰', label: 'Cake', pts: 5, usd: 0.50 },
  { emoji: '💎', label: 'Diamond', pts: 10, usd: 1.00 },
  { emoji: '🔥', label: 'Fire', pts: 25, usd: 2.50 },
  { emoji: '🚀', label: 'Rocket', pts: 50, usd: 5.00 },
  { emoji: '👑', label: 'Crown', pts: 100, usd: 10.00 },
];

var DURATIONS = [60, 120, 180, 300, 600];

/* ─── Helpers ─── */
function fmt(s) {
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function pct(a, b) {
  var total = a + b;
  if (total === 0) { return 50; }
  return Math.round((a / total) * 100);
}

/* ─── Small components ─── */

function StatChip({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-xl" style={{ background: (color || '#d4af37') + '12', border: '1px solid ' + (color || '#d4af37') + '28' }}>
      <span className="text-lg font-black" style={{ fontFamily: 'Orbitron, monospace', color: color || '#d4af37' }}>{value}</span>
      <span className="text-[11px] text-white/35 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function ScoreBar({ leftScore, rightScore, leftName, rightName, leftColor, rightColor }) {
  var lp = pct(leftScore, rightScore);
  var rp = 100 - lp;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
        <span style={{ color: leftColor || '#D4AF37' }}>{leftName}</span>
        <span style={{ color: rightColor || '#ef4444' }}>{rightName}</span>
      </div>
      <div className="h-4 rounded-full flex overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <motion.div
          className="h-full rounded-l-full transition-all duration-700"
          style={{ width: lp + '%', background: leftColor || '#D4AF37' }}
        />
        <motion.div
          className="h-full rounded-r-full transition-all duration-700"
          style={{ width: rp + '%', background: rightColor || '#ef4444' }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-black font-mono">
        <span style={{ color: leftColor || '#D4AF37' }}>{leftScore.toLocaleString()} pts ({lp}%)</span>
        <span style={{ color: rightColor || '#ef4444' }}>{rightScore.toLocaleString()} pts ({rp}%)</span>
      </div>
    </div>
  );
}

function FlyingGift({ emoji, side }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 1, x: side === 'left' ? 30 : -30 }}
      animate={{ y: -180, opacity: 0, scale: 2 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
      className="absolute bottom-24 text-3xl pointer-events-none z-40 select-none"
      style={{ [side === 'left' ? 'left' : 'right']: '60px' }}
    >
      {emoji}
    </motion.div>
  );
}

function WinnerOverlay({ battle, onClose }) {
  var winnerName = battle.winner_name || 'Unknown';
  var winnerIsCreator = battle.winner_id === battle.creator_id;
  var loserName = winnerIsCreator ? battle.challenger_name : battle.creator_name;
  var winScore = winnerIsCreator ? battle.creator_score : battle.challenger_score;
  var loseScore = winnerIsCreator ? battle.challenger_score : battle.creator_score;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
    >
      {/* Confetti-like particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map(function(_, i) {
          return (
            <motion.div
              key={i}
              initial={{ y: -20, x: (i * 47) % 100 + '%', opacity: 1, scale: 1 }}
              animate={{ y: '110vh', opacity: 0, rotate: i * 37 }}
              transition={{ duration: 2 + (i % 3) * 0.5, delay: i * 0.08, repeat: Infinity }}
              className="absolute w-3 h-3 rounded-sm"
              style={{ background: [ET.gold, ET.rust, ET.terracotta, ET.moss, ET.clay][i % 5] }}
            />
          );
        })}
      </div>

      <motion.div
        initial={{ scale: 0.4, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.55 }}
        className="relative z-10 text-center px-8 py-12 rounded-3xl max-w-md w-full mx-4"
        style={{ background: 'rgba(7,7,15,0.98)', border: '2px solid #d4af37' }}
      >
        <div className="text-7xl mb-3">🏆</div>
        <Crown className="w-12 h-12 mx-auto mb-3" style={{ color: '#d4af37' }} />
        <p className="text-xs text-white/40 uppercase tracking-[0.3em] mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>PK Battle Winner</p>
        <h2 className="text-5xl font-black mb-2" style={{ fontFamily: 'Orbitron, monospace', color: '#d4af37' }}>{winnerName}</h2>
        <p className="text-sm text-white/40 mb-4">defeated <span className="text-white/70 font-bold">{loserName}</span></p>

        <div className="flex items-center justify-center gap-6 mb-6">
          <StatChip label="Winner Score" value={winScore.toLocaleString()} color="#d4af37" />
          <div className="text-white/20 text-2xl">vs</div>
          <StatChip label="Loser Score" value={loseScore.toLocaleString()} color="#C0392B" />
        </div>

        <div className="rounded-xl p-3 mb-6" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="font-bold" style={{ color: '#d4af37' }}>+{battle.reward_points} Loyalty Points</span>
            <span className="text-white/40">awarded to {winnerName}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-white/40 mt-1">
            <Medal className="w-3 h-3 text-yellow-600" />
            PK Champion badge unlocked
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={function() { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
            className="flex-1 gap-1.5 text-xs"
            style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <Share2 className="w-3 h-3" /> Share
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 gap-1.5 text-xs font-bold"
            style={{ background: '#d4af37', color: '#000' }}
          >
            <XCircle className="w-3 h-3" /> Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════
   TAB: INVITATIONS
═══════════════════════════ */
function InvitationsTab({ user, battles, onBattleSelect }) {
  var [searchQuery, setSearchQuery] = useState('');
  var [inviteMessage, setInviteMessage] = useState('');
  var [challengerName, setChallengerName] = useState('');
  var [challengerStream, setChallengerStream] = useState('');
  var [duration, setDuration] = useState(180);
  var [showCreateForm, setShowCreateForm] = useState(false);
  var qc = useQueryClient();

  var pendingReceived = battles.filter(function(b) {
    return b.status === 'pending' && b.challenger_id === (user && user.id);
  });
  var pendingSent = battles.filter(function(b) {
    return b.status === 'pending' && b.creator_id === (user && user.id);
  });
  var activeBattles = battles.filter(function(b) { return b.status === 'active'; });

  var createMutation = useMutation({
    mutationFn: function(data) { return base44.entities.PKBattle.create(data); },
    onSuccess: function(b) {
      qc.invalidateQueries(['pk-battles']);
      setShowCreateForm(false);
      setChallengerName('');
      setChallengerStream('');
      setInviteMessage('');
      toast.success('Battle invitation sent!');
      if (onBattleSelect) { onBattleSelect(b); }
    },
  });

  var respondMutation = useMutation({
    mutationFn: function(vars) { return base44.entities.PKBattle.update(vars.id, { status: vars.status }); },
    onSuccess: function(_, vars) {
      qc.invalidateQueries(['pk-battles']);
      toast.success(vars.status === 'accepted' ? 'Battle accepted! Get ready!' : 'Invitation declined.');
    },
  });

  function handleCreate() {
    if (!challengerName.trim()) { toast.error('Enter challenger name'); return; }
    createMutation.mutate({
      creator_id: (user && user.id) || 'anon',
      creator_name: (user && user.full_name) || 'Host',
      challenger_name: challengerName.trim(),
      challenger_stream_url: challengerStream,
      creator_stream_url: '',
      title: ((user && user.full_name) || 'Host') + ' vs ' + challengerName.trim(),
      status: 'pending',
      duration_seconds: duration,
      invite_message: inviteMessage,
      reward_points: 500,
    });
  }

  var statusStyle = {
    pending: { bg: 'rgba(212,175,55,0.1)', color: '#d4af37', border: 'rgba(212,175,55,0.25)' },
    accepted: { bg: 'rgba(109,191,126,0.1)', color: '#6DBF7E', border: 'rgba(109,191,126,0.25)' },
    active: { bg: 'rgba(192,57,43,0.1)', color: '#C0392B', border: 'rgba(192,57,43,0.25)' },
    ended: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' },
    declined: { bg: 'rgba(192,57,43,0.05)', color: 'rgba(192,57,43,0.5)', border: 'rgba(192,57,43,0.1)' },
    cancelled: { bg: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.25)', border: 'rgba(255,255,255,0.06)' },
  };

  return (
    <div className="space-y-5">
      {/* Pending invites received */}
      {pendingReceived.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.04)' }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {pendingReceived.length} Battle Challenge{pendingReceived.length > 1 ? 's' : ''} Received
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {pendingReceived.map(function(b) {
              return (
                <div key={b.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0" style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B' }}>
                    {b.creator_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{b.creator_name} challenged you!</p>
                    {b.invite_message && <p className="text-xs text-white/40 italic truncate">"{b.invite_message}"</p>}
                    <p className="text-[10px] text-white/30 mt-0.5">{Math.floor(b.duration_seconds / 60)}min battle · 500 pts reward</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={function() { respondMutation.mutate({ id: b.id, status: 'accepted' }); }}
                      className="h-8 text-xs gap-1 font-bold"
                      style={{ background: 'rgba(109,191,126,0.15)', color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.3)' }}
                    >
                      <CheckCircle className="w-3 h-3" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      onClick={function() { respondMutation.mutate({ id: b.id, status: 'declined' }); }}
                      className="h-8 text-xs gap-1"
                      style={{ background: 'rgba(192,57,43,0.08)', color: '#C0392B60', border: '1px solid rgba(192,57,43,0.15)' }}
                    >
                      <XCircle className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create invite */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(7,7,15,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}>
        <button
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-all"
          onClick={function() { setShowCreateForm(!showCreateForm); }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <Plus className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="text-sm font-bold text-white">Send Battle Invitation</span>
          <ChevronRight className="w-4 h-4 text-white/30 ml-auto" style={{ transform: showCreateForm ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
                <div className="pt-3">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Challenger Name / Username</label>
                  <input
                    value={challengerName}
                    onChange={function(e) { setChallengerName(e.target.value); }}
                    placeholder="@creator or display name..."
                    className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Challenger Stream URL (optional)</label>
                  <input
                    value={challengerStream}
                    onChange={function(e) { setChallengerStream(e.target.value); }}
                    placeholder="https://..."
                    className="w-full rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Invite Message (optional)</label>
                  <input
                    value={inviteMessage}
                    onChange={function(e) { setInviteMessage(e.target.value); }}
                    placeholder="Let's battle! 🔥"
                    className="w-full rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Duration</label>
                  <div className="flex gap-2">
                    {DURATIONS.map(function(d) {
                      return (
                        <button
                          key={d}
                          onClick={function() { setDuration(d); }}
                          className="flex-1 py-1.5 text-xs rounded-lg border transition-all font-bold"
                          style={{
                            background: duration === d ? '#d4af37' : 'rgba(255,255,255,0.04)',
                            border: '1px solid ' + (duration === d ? '#d4af37' : 'rgba(255,255,255,0.1)'),
                            color: duration === d ? '#000' : 'rgba(255,255,255,0.45)'
                          }}
                        >
                          {d / 60}m
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !challengerName.trim()}
                  className="w-full h-9 text-sm font-bold gap-2"
                  style={{ background: 'linear-gradient(90deg, #800020, #d4af37)', color: '#000' }}
                >
                  <Send className="w-4 h-4" /> Send Battle Invitation
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* All battles list */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(7,7,15,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>All Battles</span>
          <Badge style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: 'none' }}>{battles.length}</Badge>
        </div>
        {battles.length === 0 ? (
          <div className="py-12 text-center">
            <Swords className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/30">No battles yet. Send an invitation to start!</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {battles.map(function(b) {
              var st = statusStyle[b.status] || statusStyle.ended;
              var isLive = b.status === 'active' || b.status === 'live';
              return (
                <button
                  key={b.id}
                  onClick={function() { onBattleSelect(b); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left"
                  style={{ background: 'rgba(255,255,255,0.03)', border: isLive ? '1px solid rgba(192,57,43,0.25)' : '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: isLive ? 'rgba(192,57,43,0.15)' : 'rgba(212,175,55,0.08)', border: isLive ? '1px solid rgba(192,57,43,0.3)' : '1px solid rgba(212,175,55,0.15)' }}>
                    <Swords className="w-4 h-4" style={{ color: isLive ? '#C0392B' : '#D4AF37' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.02em' }}>
                      {b.title || (b.creator_name || 'Creator') + ' vs ' + (b.challenger_name || '?')}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {Math.floor((b.duration_seconds || 0) / 60)}min · {b.creator_score || 0} – {b.challenger_score || 0} pts
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color, border: '1px solid ' + st.border, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {b.status}
                    </span>
                    {b.winner_name && <span className="text-[11px] font-bold" style={{ color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>🏆 {b.winner_name}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════
   TAB: LIVE SCOREBOARD
═══════════════════════════ */
function ScoreboardTab({ battle, user, onBattleUpdate }) {
  var qc = useQueryClient();
  var [battleVideo, setBattleVideo] = useState(null);
  var [playlist, setPlaylist] = useState([]);
  var isHost = battle && user && battle.creator_id === user.id;
  var isCoHost = battle && user && battle.challenger_id === user.id;

  // Real-time subscription
  useEffect(function() {
    if (!battle || !battle.id) { return; }
    var unsub = base44.entities.PKBattle.subscribe(function(ev) {
      if (ev.id !== battle.id) { return; }
      qc.invalidateQueries(['pk-battles']);
    });
    return unsub;
  }, [battle && battle.id]);

  if (!battle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Swords className="w-12 h-12 text-white/20 mb-4" />
        <p className="text-white/40 text-sm">Select a battle from the Invitations tab to view the scoreboard.</p>
      </div>
    );
  }

  var ytVidId = battleVideo?.type === 'youtube' ? getYouTubeId(battleVideo.url) : null;

  return (
    <div className="space-y-4">
      {/* Video panel for battle */}
      {battleVideo && (
        <div className="rounded-2xl overflow-hidden relative bg-black group" data-video-container style={{ aspectRatio: '16/9' }}>
          {battleVideo.type === 'youtube' && ytVidId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytVidId}?autoplay=1&controls=${isHost || isCoHost ? 1 : 0}`}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              frameBorder="0"
              title="Battle Video"
            />
          ) : (
            <video
              src={battleVideo.url}
              controls={isHost || isCoHost}
              autoPlay
              className="w-full h-full object-contain"
            />
          )}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            <VideoPlayerControls
              playerType={battleVideo.type === 'youtube' ? 'youtube' : 'direct'}
              isHost={isHost}
              isCoHost={isCoHost}
              syncStatus={null}
            />
          </div>
        </div>
      )}

      {/* Host/Co-Host video source picker */}
      {(isHost || isCoHost) && (
        <div className="flex items-center gap-3 px-1">
          <VideoSourcePicker
            isHost={isHost}
            isCoHost={isCoHost}
            playlist={playlist}
            onPlaylistChange={setPlaylist}
            onSelect={(src) => { setBattleVideo(src); }}
          />
          {battleVideo && (
            <span className="text-xs text-white/40 truncate flex-1">
              Playing: {battleVideo.title}
            </span>
          )}
        </div>
      )}

      <BattleOverlay
        battle={battle}
        onBattleUpdate={function() { qc.invalidateQueries(['pk-battles']); }}
      />
    </div>
  );
}

/* ═══════════════════════════
   TAB: WIN/LOSS HISTORY
═══════════════════════════ */
function HistoryTab({ battles, user }) {
  var userId = user && user.id;
  var ended = battles.filter(function(b) { return b.status === 'ended'; });
  var wins = ended.filter(function(b) { return b.winner_id === userId; });
  var losses = ended.filter(function(b) { return b.winner_id && b.winner_id !== userId && (b.creator_id === userId || b.challenger_id === userId); });
  var totalPts = wins.reduce(function(a, b) { return a + (b.reward_points || 0); }, 0);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatChip label="Battles" value={String(ended.length)} color="#C9A84C" />
        <StatChip label="Wins" value={String(wins.length)} color="#6DBF7E" />
        <StatChip label="Losses" value={String(losses.length)} color="#C0392B" />
        <StatChip label="Pts Earned" value={totalPts.toLocaleString()} color="#d4af37" />
      </div>

      {/* Win rate bar */}
      {ended.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(7,7,15,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50 uppercase font-bold">Win Rate</span>
            <span className="text-sm font-black" style={{ fontFamily: 'Orbitron, monospace', color: '#6DBF7E' }}>
              {Math.round((wins.length / ended.length) * 100)}%
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(192,57,43,0.2)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: Math.round((wins.length / ended.length) * 100) + '%', background: 'linear-gradient(90deg, #6DBF7E, #C9A84C)' }}
            />
          </div>
        </div>
      )}

      {/* Battle history list */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(7,7,15,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Battle History</span>
        </div>
        {ended.length === 0 ? (
          <div className="py-12 text-center">
            <Trophy className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/30">No completed battles yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {ended.map(function(b) {
              var isWin = b.winner_id === userId;
              var isParticipant = b.creator_id === userId || b.challenger_id === userId;
              return (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{
                    background: isWin ? 'rgba(212,175,55,0.15)' : isParticipant ? 'rgba(192,57,43,0.1)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid ' + (isWin ? 'rgba(212,175,55,0.3)' : isParticipant ? 'rgba(192,57,43,0.2)' : 'rgba(255,255,255,0.08)')
                  }}>
                    {isWin ? <Crown className="w-4 h-4 text-yellow-400" /> : <Swords className="w-4 h-4 text-white/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{b.title}</p>
                    <p className="text-[10px] text-white/35">{b.creator_score} vs {b.challenger_score} pts · {Math.floor(b.duration_seconds / 60)}min</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {isWin && <p className="text-[10px] font-bold text-yellow-400">+{b.reward_points} pts</p>}
                    {b.winner_name && <p className="text-[10px] text-white/40">🏆 {b.winner_name}</p>}
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

/* ═══════════════════════════
   MAIN PAGE
═══════════════════════════ */
var TABS = [
  { id: 'invitations', label: '📨 Invitations', sub: 'Challenge & Respond' },
  { id: 'scoreboard', label: '📊 Scoreboard', sub: 'Live Battle View' },
  { id: 'matchmaking', label: '⚔️ Matchmaking', sub: 'Find Opponents' },
  { id: 'tournament', label: '🏆 Tournament', sub: 'Bracket Play' },
  { id: 'analytics', label: '📈 Analytics', sub: 'PK Stats' },
  { id: 'history', label: '🗂 History', sub: 'Win/Loss Record' },
];

export default function PKBattleManager() {
  var [activeTab, setActiveTab] = useState('invitations');
  var [selectedBattle, setSelectedBattle] = useState(null);
  var [showWinner, setShowWinner] = useState(false);
  var [pendingWinner, setPendingWinner] = useState(null);
  var qc = useQueryClient();

  var { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });

  var { data: battles = [] } = useQuery({
    queryKey: ['pk-battles'],
    queryFn: function() { return base44.entities.PKBattle.list('-created_date', 50); },
    refetchInterval: 5000,
  });

  // Refresh selected battle data
  var currentBattle = battles.find(function(b) { return selectedBattle && b.id === selectedBattle.id; }) || selectedBattle;

  // Auto-detect battle end and show winner overlay
  useEffect(function() {
    if (!currentBattle || currentBattle.status !== 'active') { return; }
    var endsAt = new Date(currentBattle.started_at).getTime() + currentBattle.duration_seconds * 1000;
    var rem = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
    if (rem > 0) { return; }

    // Battle just ended — determine winner
    var creatorScore = currentBattle.creator_score || 0;
    var challengerScore = currentBattle.challenger_score || 0;
    var winnerId = creatorScore >= challengerScore ? currentBattle.creator_id : currentBattle.challenger_id;
    var winnerName = creatorScore >= challengerScore ? currentBattle.creator_name : (currentBattle.challenger_name || 'Challenger');

    base44.entities.PKBattle.update(currentBattle.id, {
      status: 'ended',
      winner_id: winnerId,
      winner_name: winnerName,
      ended_at: new Date().toISOString(),
    }).then(function() {
      qc.invalidateQueries(['pk-battles']);
      setPendingWinner(Object.assign({}, currentBattle, { winner_id: winnerId, winner_name: winnerName, status: 'ended' }));
      setShowWinner(true);
    });
  }, [currentBattle && currentBattle.id, currentBattle && currentBattle.status]);

  // Start a battle (host control)
  var startMutation = useMutation({
    mutationFn: function(b) {
      return base44.entities.PKBattle.update(b.id, {
        status: 'active',
        started_at: new Date().toISOString(),
      });
    },
    onSuccess: function() { qc.invalidateQueries(['pk-battles']); toast.success('Battle started!'); },
  });

  function handleBattleSelect(b) {
    setSelectedBattle(b);
    setActiveTab('scoreboard');
  }

  var activeBattleCount = battles.filter(function(b) { return b.status === 'active'; }).length;

  return (
    <div className="min-h-screen" style={{ background: ET.bg, fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Winner overlay */}
      <AnimatePresence>
        {showWinner && pendingWinner && (
          <WinnerOverlay battle={pendingWinner} onClose={function() { setShowWinner(false); setPendingWinner(null); }} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ background: ET.darkEarth, borderBottom: '1px solid ' + ET.gold + '25' }}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('LiveBattles')}>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #800020, #d4af37)' }}>
                <Swords className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black uppercase" style={{ fontFamily: 'Orbitron, monospace', color: '#d4af37', letterSpacing: '0.06em' }}>
                  PK Battle Manager
                </h1>
                <p className="text-xs text-white/35" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Head-to-head creator competitions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeBattleCount > 0 && (
                <Badge className="text-xs animate-pulse" style={{ background: 'rgba(192,57,43,0.15)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.3)' }}>
                  {activeBattleCount} LIVE
                </Badge>
              )}
              <StatChip label="Total" value={String(battles.length)} color="#d4af37" />
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-0 mt-4 overflow-x-auto scrollbar-hide">
            {TABS.map(function(t) {
              var active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={function() { setActiveTab(t.id); }}
                  className="flex flex-col items-start px-5 py-2 shrink-0 border-b-2 transition-all"
                  style={{
                    borderBottomColor: active ? ET.gold : 'transparent',
                    background: active ? ET.gold + '10' : 'transparent',
                  }}
                >
                  <span className="text-xs font-bold uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.07em', color: active ? '#d4af37' : 'rgba(255,255,255,0.4)' }}>
                    {t.label}
                  </span>
                  <span className="text-[11px] text-white/25">{t.sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-5">
        {/* Active battle quick-start banner */}
        {currentBattle && currentBattle.status === 'accepted' && currentBattle.creator_id === (user && user.id) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 mb-4 flex items-center gap-4"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}
          >
            <Zap className="w-6 h-6 text-yellow-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Battle accepted! Ready to start?</p>
              <p className="text-xs text-white/40">{currentBattle.title}</p>
            </div>
            <Button
              size="sm"
              onClick={function() { startMutation.mutate(currentBattle); }}
              disabled={startMutation.isPending}
              className="gap-1.5 font-bold"
              style={{ background: 'linear-gradient(90deg, #8B6F47, #d4af37)', color: '#fff' }}
            >
              <Play className="w-3 h-3" /> Start Battle
            </Button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'invitations' && (
              <InvitationsTab user={user} battles={battles} onBattleSelect={handleBattleSelect} />
            )}
            {activeTab === 'scoreboard' && (
              <ScoreboardTab battle={currentBattle} user={user} onBattleUpdate={function() { qc.invalidateQueries(['pk-battles']); }} />
            )}
            {activeTab === 'matchmaking' && (
              <MatchmakingQueue user={user} />
            )}
            {activeTab === 'tournament' && (
              <TournamentBracket />
            )}
            {activeTab === 'analytics' && (
              <PKAnalyticsDashboard battles={battles} user={user} />
            )}
            {activeTab === 'matchmaking' && (
              <MatchmakingQueue user={user} />
            )}
            {activeTab === 'tournament' && (
              <TournamentBracket />
            )}
            {activeTab === 'analytics' && (
              <PKAnalyticsDashboard battles={battles} user={user} />
            )}
            {activeTab === 'history' && (
              <HistoryTab battles={battles} user={user} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}