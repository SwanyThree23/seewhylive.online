/**
 * CoStreamHub — 20-seat co-streaming management hub
 *
 * Key improvement: 🚀 LAUNCH PANEL button opens PanelLaunchSheet which lets
 * the host copy or share all 20 guest push links in one tap — no more
 * individually copying links one by one.
 */
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import GuestCoStreamDashboard from './GuestCoStreamDashboard';
import GuestControls from './GuestControls';
import GuestGrid from './GuestGrid';
import BattleScoreboard from './BattleScoreboard';
import GuestDestinationsPanel from './GuestDestinationsPanel';
import VdoNinjaGuestLink, { buildDirectorUrl, buildSceneUrl } from './VdoNinjaGuestLink';
import GreenroomQueue from '../streaming/GreenroomQueue';
import WatchPartyPlayer from '../streaming/WatchPartyPlayer';
import BattleMode from '../streaming/BattleMode';

// ── Palette ─────────────────────────────────────────────────────────────────
var C = {
  bg:      '#07050A',
  bg2:     '#0E0C09',
  bg3:     '#141210',
  card:    '#1A1612',
  gold:    '#D4AF37',
  goldDim: '#C9A84C',
  amber:   '#D4854A',
  crimson: '#800020',
  scarlet: '#C0392B',
  bronze:  '#CD7F32',
  green:   '#6DBF7E',
  text:    '#F0E8D4',
  textM:   'rgba(240,232,212,0.60)',
  textD:   'rgba(240,232,212,0.30)',
  border:  'rgba(212,175,55,0.16)',
};
var T = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── VDO helpers ──────────────────────────────────────────────────────────────
function vdoRoom(roomId) {
  return 'sw' + (roomId || 'room').replace(/[^a-z0-9]/gi, '').slice(0, 12).toLowerCase();
}
function vdoPushUrl(roomId, n) {
  return 'https://vdo.ninja/?room=' + vdoRoom(roomId) + '&push&label=G' + n + '&effects&showlabels';
}

// ── Reactions ────────────────────────────────────────────────────────────────
var REACTIONS = [
  { emoji: '🔥', color: C.amber   },
  { emoji: '👑', color: C.gold    },
  { emoji: '💯', color: C.green   },
  { emoji: '🎉', color: C.goldDim },
  { emoji: '❤️', color: C.scarlet },
  { emoji: '👏', color: C.bronze  },
];

function Floater({ emoji, id, onDone }) {
  return (
    <motion.div key={id}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -80, scale: 1.5 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      style={{ position: 'absolute', bottom: 48, right: 8 + Math.random() * 60, fontSize: 28, pointerEvents: 'none', zIndex: 50 }}>
      {emoji}
    </motion.div>
  );
}

function ReactionsBar({ onReact }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {REACTIONS.map(function(r) {
        return (
          <motion.button key={r.emoji} whileTap={{ scale: 0.82 }} onClick={function() { onReact(r.emoji); }}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {r.emoji}
          </motion.button>
        );
      })}
    </div>
  );
}

function Dot({ color, pulse }) {
  return (
    <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {pulse && (
        <motion.div animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 1.3, repeat: Infinity }}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color }} />
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: (color || C.gold) + '14', border: '1px solid ' + (color || C.gold) + '30' }}>
      <span style={{ ...T, fontSize: 13, fontWeight: 900, color: color || C.gold }}>{value}</span>
      <span style={{ ...T, fontSize: 10, color: C.textD, letterSpacing: '0.06em' }}>{label}</span>
    </div>
  );
}

function TabBtn({ id, label, active, badge, onClick }) {
  return (
    <button onClick={function() { onClick(id); }} style={{
      padding: '8px 12px', border: 'none', cursor: 'pointer',
      background: active ? C.gold + '14' : 'transparent',
      color: active ? C.gold : C.textM,
      borderBottom: '2px solid ' + (active ? C.gold : 'transparent'),
      ...T, fontSize: 11, fontWeight: active ? 700 : 400,
      whiteSpace: 'nowrap', transition: 'all 0.14s', position: 'relative',
    }}>
      {label}
      {badge != null && badge > 0 && (
        <span style={{ marginLeft: 5, background: C.scarlet, color: '#fff', borderRadius: 99, fontSize: 9, fontWeight: 900, padding: '1px 5px', ...T }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ── PanelLaunchSheet ─────────────────────────────────────────────────────────
// The killer feature: host opens this once, shares all 20 links in 2 taps
function PanelLaunchSheet({ roomId, participants, onClose }) {
  var [guestNames, setGuestNames] = useState({});
  var [copied, setCopied] = useState('');
  var [allCopied, setAllCopied] = useState(false);

  function getPushUrl(num) {
    var label = guestNames[num] ? guestNames[num].replace(/\s+/g, '').slice(0, 14) : ('G' + num);
    return 'https://vdo.ninja/?room=' + vdoRoom(roomId) + '&push&label=' + label + '&effects&showlabels';
  }

  function copyText(val, key) {
    try { navigator.clipboard.writeText(val); } catch (_) {
      var ta = document.createElement('textarea');
      ta.value = val; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(key);
    setTimeout(function() { setCopied(''); }, 2200);
  }

  function copyAll() {
    var lines = Array.from({ length: 20 }, function(_, i) {
      var n = i + 1;
      var name = guestNames[n] ? ' (' + guestNames[n].trim() + ')' : '';
      return 'G' + n + name + ': ' + getPushUrl(n);
    });
    var text = '🎙 SeeWhy LIVE Panel — Guest Links\nRoom: ' + vdoRoom(roomId) + '\n\n' + lines.join('\n') + '\n\nOBS Composite: ' + buildSceneUrl(roomId);
    try { navigator.clipboard.writeText(text); } catch (_) {}
    setAllCopied(true);
    setTimeout(function() { setAllCopied(false); }, 3000);
  }

  function shareOne(num) {
    var url = getPushUrl(num);
    var name = guestNames[num] ? guestNames[num].trim() : ('Guest ' + num);
    if (navigator.share) {
      navigator.share({ title: 'Join SeeWhy LIVE — ' + name, text: 'Tap to join the live panel:', url: url }).catch(function() {});
    } else {
      copyText(url, 'share' + num);
    }
  }

  function shareAll() {
    var lines = Array.from({ length: 20 }, function(_, i) {
      var n = i + 1;
      return (guestNames[n] ? guestNames[n].trim() : 'Guest ' + n) + ': ' + getPushUrl(n);
    });
    if (navigator.share) {
      navigator.share({ title: 'SeeWhy LIVE — Panel Guest Links', text: '🎙 Join my live panel!\n\n' + lines.join('\n') }).catch(function() {});
    } else {
      copyAll();
    }
  }

  var seats = Array.from({ length: 20 }, function(_, i) { return i + 1; });
  var sceneUrl = buildSceneUrl(roomId);
  var directorUrl = buildDirectorUrl(roomId);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 290 }}
        onClick={function(e) { e.stopPropagation(); }}
        style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', background: C.bg2, borderRadius: '18px 18px 0 0', border: '1px solid ' + C.border, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Handle + header */}
        <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid ' + C.border, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ ...T, fontSize: 15, fontWeight: 900, color: C.gold, flex: 1 }}>🚀 PANEL SETUP — 20 SEATS</span>
            <span style={{ ...T, fontSize: 10, color: C.textD, background: C.bg3, padding: '2px 8px', borderRadius: 4 }}>
              {vdoRoom(roomId)}
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textM, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>✕</button>
          </div>

          {/* Primary action row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <button onClick={copyAll}
              style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: allCopied ? C.green + '22' : 'linear-gradient(135deg,' + C.crimson + ',#A0003A)', color: allCopied ? C.green : C.gold, cursor: 'pointer', ...T, fontSize: 11, fontWeight: 900, letterSpacing: '0.06em' }}>
              {allCopied ? '✓ ALL 20 LINKS COPIED' : '📋 COPY ALL 20 LINKS'}
            </button>
            <button onClick={shareAll}
              style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid ' + C.gold + '44', background: C.gold + '14', color: C.gold, cursor: 'pointer', ...T, fontSize: 11, fontWeight: 900, letterSpacing: '0.06em' }}>
              ↑ SHARE ALL
            </button>
          </div>

          {/* Director + OBS row */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={function() { window.open(directorUrl, '_blank'); }}
              style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', ...T, fontSize: 10, fontWeight: 700 }}>
              🎬 Director Panel ↗
            </button>
            <button onClick={function() { copyText(sceneUrl, 'obs'); }}
              style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid ' + (copied === 'obs' ? C.green : 'rgba(255,255,255,0.1)'), background: copied === 'obs' ? C.green + '14' : 'rgba(255,255,255,0.04)', color: copied === 'obs' ? C.green : 'rgba(255,255,255,0.5)', cursor: 'pointer', ...T, fontSize: 10, fontWeight: 700 }}>
              {copied === 'obs' ? '✓ OBS LINK COPIED' : '📺 Copy OBS Scene'}
            </button>
          </div>
        </div>

        {/* Per-seat list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '6px 14px 40px' }}>
          <div style={{ ...T, fontSize: 9, color: C.textD, letterSpacing: '0.12em', margin: '8px 0 6px' }}>
            NAME EACH GUEST THEN SHARE THEIR LINK
          </div>
          {seats.map(function(num) {
            var assigned = participants.find(function(p) { return p.seat_number === num; });
            var isLive = assigned && assigned.status === 'admitted';
            return (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {/* Seat badge */}
                <div style={{ width: 28, flexShrink: 0, ...T, fontSize: 12, fontWeight: 900, color: isLive ? C.green : C.textD }}>
                  G{num}
                </div>

                {/* Guest name input */}
                <input
                  value={guestNames[num] || ''}
                  onChange={function(e) {
                    var val = e.target.value;
                    setGuestNames(function(prev) {
                      var next = {};
                      Object.assign(next, prev);
                      next[num] = val;
                      return next;
                    });
                  }}
                  placeholder={assigned ? assigned.user_name : 'Guest name…'}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '5px 8px', color: '#fff', ...T, fontSize: 11, outline: 'none', height: 28, minWidth: 0 }}
                />

                {/* Share / copy */}
                {navigator.share ? (
                  <button onClick={function() { shareOne(num); }}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid ' + C.gold + '44', background: C.gold + '14', color: C.gold, cursor: 'pointer', ...T, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    ↑ SHARE
                  </button>
                ) : (
                  <button onClick={function() { copyText(getPushUrl(num), 'c' + num); }}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid ' + (copied === 'c' + num ? C.green : C.gold) + '44', background: copied === 'c' + num ? C.green + '18' : C.gold + '14', color: copied === 'c' + num ? C.green : C.gold, cursor: 'pointer', ...T, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {copied === 'c' + num ? '✓' : '📋 COPY'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── SeatInviteDrawer ─────────────────────────────────────────────────────────
function SeatInviteDrawer({ seat, roomId, onClose }) {
  var [copied, setCopied] = useState('');
  var pushUrl = vdoPushUrl(roomId, seat.num);
  var rtmpKey = 'sw' + vdoRoom(roomId) + '_g' + seat.num;

  function copy(val, key) {
    try { navigator.clipboard.writeText(val); } catch (_) {}
    setCopied(key);
    setTimeout(function() { setCopied(''); }, 2200);
  }

  var rows = [
    { label: 'Guest Push Link', value: pushUrl, key: 'push', note: 'Share this URL with the guest — open in Chrome' },
    { label: 'OBS RTMP Server', value: 'rtmp://ingest.vdo.ninja/live', key: 'rtmp', note: 'Paste into OBS → Settings → Stream → Server' },
    { label: 'OBS Stream Key', value: rtmpKey, key: 'key', note: 'Paste into OBS → Settings → Stream → Stream Key' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} onClick={function(e) { e.stopPropagation(); }}
        style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: C.bg2, borderRadius: '16px 16px 0 0', border: '1px solid ' + C.border, padding: '0 0 32px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid ' + C.border }}>
          <div>
            <div style={{ ...T, fontSize: 14, fontWeight: 900, color: C.gold }}>INVITE GUEST {seat.num}</div>
            <div style={{ ...T, fontSize: 10, color: C.textD }}>Seat G{seat.num} · {vdoRoom(roomId)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textM, cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map(function(row) {
            return (
              <div key={row.key} style={{ borderRadius: 8, background: C.bg3, border: '1px solid ' + C.border, overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ ...T, fontSize: 9, color: C.gold, letterSpacing: '0.12em', fontWeight: 700 }}>{row.label}</div>
                  <div style={{ ...T, fontSize: 10, color: C.textD, marginTop: 1 }}>{row.note}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                  <code style={{ ...T, fontSize: 10, color: C.textM, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.value}
                  </code>
                  <button onClick={function() { copy(row.value, row.key); }} style={{
                    padding: '5px 10px', borderRadius: 5, border: '1px solid ' + (copied === row.key ? C.green : C.gold) + '44',
                    background: copied === row.key ? C.green + '18' : C.gold + '18', cursor: 'pointer',
                    ...T, fontSize: 10, fontWeight: 700, color: copied === row.key ? C.green : C.gold, flexShrink: 0,
                  }}>
                    {copied === row.key ? '✓' : 'COPY'}
                  </button>
                </div>
              </div>
            );
          })}
          <button onClick={function() { window.open(pushUrl, '_blank'); }}
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,' + C.crimson + ',' + C.gold + ')', color: '#000', cursor: 'pointer', ...T, fontSize: 15, fontWeight: 900, letterSpacing: '0.06em' }}>
            ↗ OPEN GUEST LINK
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Stage Tab ────────────────────────────────────────────────────────────────
function StageTab({ roomId, isHost, isCoHost, currentUser, participants, raisedHands, onSpotlight, spotlitId, speakingIds = {} }) {
  var [view, setView] = useState('dashboard');
  var [inviteSeat, setInviteSeat] = useState(null);

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'grid',      label: '⊞ Panel Grid' },
          { id: 'controls',  label: '🎛 Controls' },
          { id: 'invite',    label: '📨 Seats' },
        ].map(function(v) {
          return (
            <button key={v.id} onClick={function() { setView(v.id); }} style={{
              padding: '5px 10px', borderRadius: 6, border: '1px solid ' + (view === v.id ? C.gold + '55' : 'rgba(255,255,255,0.08)'),
              background: view === v.id ? C.gold + '18' : 'transparent', cursor: 'pointer',
              ...T, fontSize: 11, fontWeight: view === v.id ? 700 : 400, color: view === v.id ? C.gold : C.textM,
            }}>
              {v.label}
            </button>
          );
        })}
      </div>

      {view === 'dashboard' && (
        <GuestCoStreamDashboard
          participants={participants} roomId={roomId} isHost={isHost}
          onSpotlight={onSpotlight} spotlitId={spotlitId}
          raisedHands={raisedHands || new Set()} onLockRoom={function() {}} />
      )}
      {view === 'grid' && (
        <GuestGrid
          participants={participants} isHost={isHost} hostId={currentUser && currentUser.id}
          maxGuests={20} onInvite={function(seat) { setInviteSeat({ num: seat }); }}
          onSpotlight={onSpotlight} speakingIds={speakingIds} />
      )}
      {view === 'controls' && (
        <GuestControls
          participants={participants} onMuteGuest={function() {}} onRemoveGuest={function() {}}
          roomId={roomId} isHost={isHost} onSpotlight={onSpotlight}
          spotlitId={spotlitId} raisedHands={raisedHands || new Set()} />
      )}
      {view === 'invite' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 8 }}>
          {Array.from({ length: 20 }, function(_, i) { return i + 1; }).map(function(num) {
            var assigned = participants.find(function(p) { return p.seat_number === num; });
            return (
              <div key={num} style={{ borderRadius: 10, background: assigned ? C.bg3 : C.bg2, border: '1px solid ' + (assigned ? C.scarlet + '44' : C.border), padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <Dot color={assigned ? C.scarlet : C.textD} pulse={!!assigned} />
                  <span style={{ ...T, fontSize: 11, fontWeight: 700, color: C.textD }}>G{num}</span>
                  {assigned && <span style={{ ...T, fontSize: 10, color: C.textM, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assigned.user_name}</span>}
                </div>
                {assigned ? (
                  <div style={{ ...T, fontSize: 10, color: C.green }}>● On Stage</div>
                ) : (
                  <button onClick={function() { setInviteSeat({ num: num }); }}
                    style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid ' + C.gold + '44', background: C.gold + '14', cursor: 'pointer', ...T, fontSize: 10, fontWeight: 700, color: C.gold }}>
                    📨 INVITE
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {inviteSeat && <SeatInviteDrawer seat={inviteSeat} roomId={roomId} onClose={function() { setInviteSeat(null); }} />}
      </AnimatePresence>
    </div>
  );
}

// ── Destinations Tab ─────────────────────────────────────────────────────────
function DestinationsTab({ roomId, participants, isHost, isCoHost }) {
  var [expandedId, setExpandedId] = useState(null);
  if (!isHost && !isCoHost) {
    return <div style={{ textAlign: 'center', padding: '40px 0', ...T, color: C.textD, fontSize: 13 }}>Multi-destination streaming is managed by the host</div>;
  }
  var staged = participants.filter(function(p) { return p.status === 'admitted'; });
  if (staged.length === 0) {
    return <div style={{ textAlign: 'center', padding: '32px 0', ...T, color: C.textD, fontSize: 13 }}>No guests on stage yet</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ ...T, fontSize: 10, color: C.textD, letterSpacing: '0.1em', marginBottom: 4 }}>
        RTMP DESTINATIONS — {staged.length} GUESTS ON STAGE
      </div>
      {staged.map(function(p) {
        return (
          <div key={p.id} style={{ borderRadius: 10, border: '1px solid ' + C.border, overflow: 'hidden' }}>
            <div onClick={function() { setExpandedId(expandedId === p.id ? null : p.id); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', cursor: 'pointer', background: expandedId === p.id ? C.gold + '08' : C.bg2 }}>
              <Dot color={C.scarlet} pulse />
              <span style={{ ...T, fontSize: 13, color: C.text, flex: 1, fontWeight: 600 }}>{p.user_name || 'Guest'}</span>
              {p.seat_number && <span style={{ ...T, fontSize: 10, color: C.textD }}>G{p.seat_number}</span>}
              <span style={{ ...T, fontSize: 11, color: C.textM }}>{expandedId === p.id ? '▲' : '▼'}</span>
            </div>
            <AnimatePresence>
              {expandedId === p.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '0 12px 12px' }}>
                    <GuestDestinationsPanel participantUserId={p.user_id || p.id} guestName={p.user_name || 'Guest'} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── Watch Party Tab ──────────────────────────────────────────────────────────
function WatchPartyTab({ roomId, isHost, currentUser }) {
  var [videoUrl, setVideoUrl] = useState('');
  var [activeUrl, setActiveUrl] = useState('');

  function detectPlatform(url) {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return { name: 'YouTube', color: C.scarlet };
    if (url.includes('twitch.tv')) return { name: 'Twitch', color: C.amber };
    if (url.includes('vimeo.com')) return { name: 'Vimeo', color: C.gold };
    return { name: 'Custom', color: C.bronze };
  }

  var platform = detectPlatform(videoUrl || activeUrl);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {isHost && (
        <div style={{ padding: '12px', borderRadius: 10, background: C.bg3, border: '1px solid ' + C.border }}>
          <div style={{ ...T, fontSize: 9, color: C.gold, letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>LOAD VIDEO</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={videoUrl} onChange={function(e) { setVideoUrl(e.target.value); }}
              placeholder="YouTube, Twitch, Vimeo, or direct video URL…"
              style={{ flex: 1, background: C.bg2, border: '1px solid ' + C.gold + '40', borderRadius: 7, padding: '8px 12px', color: C.text, ...T, fontSize: 12, outline: 'none' }} />
            <button onClick={function() { setActiveUrl(videoUrl); }} disabled={!videoUrl}
              style={{ padding: '8px 14px', borderRadius: 7, border: 'none', background: videoUrl ? C.crimson : 'rgba(255,255,255,0.06)', color: videoUrl ? C.gold : C.textD, cursor: videoUrl ? 'pointer' : 'not-allowed', ...T, fontSize: 11, fontWeight: 700 }}>
              ▶ LOAD
            </button>
          </div>
          {platform && videoUrl && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: platform.color }} />
              <span style={{ ...T, fontSize: 10, color: platform.color }}>{platform.name} detected</span>
            </div>
          )}
        </div>
      )}
      {activeUrl
        ? <WatchPartyPlayer roomId={roomId} isHost={isHost} videoUrl={activeUrl} />
        : (
          <div style={{ textAlign: 'center', padding: '32px 0', border: '1px dashed ' + C.border, borderRadius: 10 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
            <div style={{ ...T, color: C.textD, fontSize: 13 }}>
              {isHost ? 'Paste a video URL above to start a Watch Party' : 'Waiting for host to start a Watch Party…'}
            </div>
          </div>
        )
      }
    </div>
  );
}

// ── Battle Tab ───────────────────────────────────────────────────────────────
function BattleTab({ roomId, isHost, isCoHost, currentUser, participants }) {
  var battlesQuery = useQuery({
    queryKey: ['battles-hub', roomId],
    queryFn: function() { return base44.entities.PKBattle.filter({ room_id: roomId }); },
    refetchInterval: 4000,
  });
  var battles = battlesQuery.data || [];
  var activeBattle = battles.find(function(b) { return b.status === 'active'; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {activeBattle && (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid ' + C.scarlet + '44' }}>
          <div style={{ padding: '6px 12px', background: C.scarlet + '18', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Dot color={C.scarlet} pulse />
            <span style={{ ...T, fontSize: 11, fontWeight: 700, color: C.scarlet, letterSpacing: '0.1em' }}>BATTLE LIVE</span>
          </div>
          <BattleScoreboard roomId={roomId} />
        </div>
      )}
      <BattleMode
        roomId={roomId} isHost={isHost}
        hostName={currentUser ? (currentUser.full_name || 'Host') : 'Host'}
        participants={participants} />
    </div>
  );
}

// ── Links Tab ────────────────────────────────────────────────────────────────
function LinksTab({ roomId, isHost, isCoHost }) {
  var [copied, setCopied] = useState('');
  function copy(val, key) {
    try { navigator.clipboard.writeText(val); } catch (_) {}
    setCopied(key);
    setTimeout(function() { setCopied(''); }, 2200);
  }
  if (!isHost && !isCoHost) {
    return <div style={{ textAlign: 'center', padding: '40px 0', ...T, color: C.textD, fontSize: 13 }}>Links visible to hosts only</div>;
  }
  var masterLinks = [
    { key: 'director', label: '🎬 Director',  url: buildDirectorUrl(roomId),   note: 'Full VDO.Ninja host control panel' },
    { key: 'scene',    label: '📺 OBS Scene', url: buildSceneUrl(roomId),      note: 'Browser source for OBS/Streamlabs' },
    { key: 'join',     label: '🔗 Room Join',  url: window.location.href,       note: 'Share this to invite viewers' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ ...T, fontSize: 9, color: C.gold, letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>MASTER LINKS</div>
        {masterLinks.map(function(link) {
          return (
            <div key={link.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: C.bg3, border: '1px solid ' + C.border, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ ...T, fontSize: 12, color: C.text, fontWeight: 600 }}>{link.label}</div>
                <div style={{ ...T, fontSize: 10, color: C.textD }}>{link.note}</div>
              </div>
              <button onClick={function() { window.open(link.url, '_blank'); }} style={{ padding: '5px 8px', borderRadius: 5, border: '1px solid ' + C.gold + '44', background: 'transparent', color: C.gold, cursor: 'pointer', ...T, fontSize: 10 }}>↗</button>
              <button onClick={function() { copy(link.url, link.key); }} style={{ padding: '5px 8px', borderRadius: 5, border: '1px solid ' + (copied === link.key ? C.green : C.gold) + '44', background: copied === link.key ? C.green + '18' : C.gold + '14', color: copied === link.key ? C.green : C.gold, cursor: 'pointer', ...T, fontSize: 10, fontWeight: 700 }}>
                {copied === link.key ? '✓' : '📋'}
              </button>
            </div>
          );
        })}
      </div>
      <VdoNinjaGuestLink roomId={roomId} maxSeats={6} />
    </div>
  );
}

// ── Main CoStreamHub ─────────────────────────────────────────────────────────
export default function CoStreamHub({ roomId, isHost, isCoHost, currentUser, compact, speakingIds }) {
  var [activeTab, setActiveTab] = useState('stage');
  var [spotlitId, setSpotlitId] = useState(null);
  var [floaters, setFloaters] = useState([]);
  var [showLaunchSheet, setShowLaunchSheet] = useState(false);
  var canControl = isHost || isCoHost;

  var participantsQuery = useQuery({
    queryKey: ['costream-participants', roomId],
    queryFn: function() { return base44.entities.Participant.filter({ room_id: roomId }); },
    refetchInterval: 5000,
    enabled: !!roomId,
  });
  var participants = participantsQuery.data || [];

  var raisedHands = new Set(participants.filter(function(p) { return p.hand_raised; }).map(function(p) { return p.id; }));
  var liveCount    = participants.filter(function(p) { return p.status === 'admitted'; }).length;
  var waitingCount = participants.filter(function(p) { return p.status === 'waiting'; }).length;
  var coHostCount  = participants.filter(function(p) { return p.role === 'co-host'; }).length;

  var battlesQuery = useQuery({
    queryKey: ['battles-count', roomId],
    queryFn: function() { return base44.entities.PKBattle.filter({ room_id: roomId, status: 'active' }); },
    refetchInterval: 6000,
    enabled: !!roomId,
  });
  var battles = battlesQuery.data || [];

  function handleReact(emoji) {
    var id = Date.now() + Math.random();
    setFloaters(function(prev) { return prev.concat({ id: id, emoji: emoji }); });
  }

  var TABS = [
    { id: 'stage',        label: '🎙 Stage',       badge: liveCount > 0 ? liveCount : null,   always: true  },
    { id: 'greenroom',    label: '🟢 Greenroom',    badge: waitingCount,                        always: false },
    { id: 'watchparty',   label: '🎬 Watch Party',  badge: null,                                always: true  },
    { id: 'battle',       label: '⚔ Battle',        badge: battles.length > 0 ? 1 : null,      always: true  },
    { id: 'destinations', label: '📡 Destinations', badge: null,                                always: false },
    { id: 'links',        label: '🔗 Links',         badge: null,                                always: false },
  ];
  var visibleTabs = TABS.filter(function(t) { return t.always || canControl; });

  return (
    <div style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: compact ? 10 : 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Floating reactions */}
      {floaters.map(function(f) {
        return <Floater key={f.id} emoji={f.emoji} id={f.id} onDone={function() { setFloaters(function(prev) { return prev.filter(function(x) { return x.id !== f.id; }); }); }} />;
      })}

      {/* ── Header ── */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid ' + C.border, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <Dot color={liveCount > 0 ? C.scarlet : C.textD} pulse={liveCount > 0} />
          <span style={{ ...T, fontSize: 13, fontWeight: 900, color: C.gold, letterSpacing: '0.06em' }}>CO-STREAM HUB</span>
          <Stat value={liveCount + '/20'} label="LIVE"     color={C.scarlet} />
          {coHostCount > 0 && <Stat value={coHostCount}  label="CO-HOSTS" color={C.gold}   />}
          {waitingCount > 0 && <Stat value={waitingCount} label="WAITING"  color={C.amber}  />}
          <div style={{ flex: 1 }} />
          {canControl && (
            <>
              {/* 🚀 Panel Setup — the main "easy launch" button */}
              <button onClick={function() { setShowLaunchSheet(true); }}
                style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg,' + C.crimson + ',#A0003A)', cursor: 'pointer', ...T, fontSize: 10, fontWeight: 900, color: C.gold, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                🚀 LAUNCH PANEL
              </button>
              <button onClick={function() { window.open(buildDirectorUrl(roomId), '_blank'); }}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid ' + C.gold + '44', background: C.gold + '14', cursor: 'pointer', ...T, fontSize: 10, fontWeight: 700, color: C.gold }}>
                🎬 DIRECTOR
              </button>
            </>
          )}
        </div>

        {/* Reactions bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ ...T, fontSize: 9, color: C.textD, letterSpacing: '0.1em' }}>REACT</span>
          <ReactionsBar onReact={handleReact} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid ' + C.border, overflowX: 'auto', flexShrink: 0 }}>
        {visibleTabs.map(function(tab) {
          return (
            <TabBtn key={tab.id} id={tab.id} label={tab.label} active={activeTab === tab.id}
              badge={typeof tab.badge === 'number' ? tab.badge : null}
              onClick={setActiveTab} />
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}>
            {activeTab === 'stage' && (
              <StageTab roomId={roomId} isHost={isHost} isCoHost={isCoHost} currentUser={currentUser}
                participants={participants} raisedHands={raisedHands}
                onSpotlight={setSpotlitId} spotlitId={spotlitId} />
            )}
            {activeTab === 'greenroom' && <GreenroomQueue roomId={roomId} isHost={isHost} />}
            {activeTab === 'watchparty' && <WatchPartyTab roomId={roomId} isHost={isHost} currentUser={currentUser} />}
            {activeTab === 'battle' && (
              <BattleTab roomId={roomId} isHost={isHost} isCoHost={isCoHost}
                currentUser={currentUser} participants={participants} />
            )}
            {activeTab === 'destinations' && (
              <DestinationsTab roomId={roomId} participants={participants} isHost={isHost} isCoHost={isCoHost} />
            )}
            {activeTab === 'links' && <LinksTab roomId={roomId} isHost={isHost} isCoHost={isCoHost} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Panel Launch Sheet */}
      <AnimatePresence>
        {showLaunchSheet && (
          <PanelLaunchSheet
            roomId={roomId}
            participants={participants}
            onClose={function() { setShowLaunchSheet(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}