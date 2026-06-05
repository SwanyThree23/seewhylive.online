import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

// ── Palette (zero forbidden colors) ───────────────────────────────────────────
const C = {
  bg:       '#07050A',
  bg2:      '#0E0C09',
  bg3:      '#141210',
  card:     '#1A1612',
  border:   'rgba(212,175,55,0.18)',
  gold:     '#D4AF37',
  goldDim:  '#C9A84C',
  amber:    '#D4854A',
  crimson:  '#800020',
  scarlet:  '#C0392B',
  bronze:   '#CD7F32',
  green:    '#6DBF7E',
  text:     '#F0E8D4',
  textM:    'rgba(240,232,212,0.60)',
  textD:    'rgba(240,232,212,0.30)',
  gray:     'rgba(240,232,212,0.15)',
};
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── VDO.Ninja URL helpers ──────────────────────────────────────────────────────
function vdoRoom(roomId) {
  return 'sw' + (roomId || 'room').replace(/[^a-z0-9]/gi, '').slice(0, 12).toLowerCase();
}
function vdoPushUrl(roomId, seatNum, label) {
  var l = label || ('G' + seatNum);
  return 'https://vdo.ninja/?room=' + vdoRoom(roomId) + '&push&label=' + l + '&effects&showlabels';
}
function vdoViewUrl(roomId, label) {
  return 'https://vdo.ninja/?room=' + vdoRoom(roomId) + '&view=' + label + '&solo&nocursor';
}
function vdoSceneUrl(roomId) {
  return 'https://vdo.ninja/?room=' + vdoRoom(roomId) + '&scene&layout=2';
}
function vdoDirectorUrl(roomId) {
  return 'https://vdo.ninja/?room=' + vdoRoom(roomId) + '&director';
}

const SEAT_COUNT = 20;

// ── Seat status styles ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  empty:      { color: C.textD,   pulse: false, label: 'Empty'      },
  invited:    { color: C.gold,    pulse: true,  label: 'Invited'    },
  connecting: { color: C.amber,   pulse: true,  label: 'Connecting' },
  live:       { color: C.scarlet, pulse: true,  label: 'LIVE'       },
  muted:      { color: C.amber,   pulse: false, label: 'Muted'      },
  speaking:   { color: C.green,   pulse: true,  label: 'Speaking'   },
};

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// ── StatusDot ─────────────────────────────────────────────────────────────────
function StatusDot({ status, size = 8 }) {
  var cfg = STATUS_CONFIG[status] || STATUS_CONFIG.empty;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: cfg.color }} />
      {cfg.pulse && (
        <motion.div
          animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: cfg.color }}
        />
      )}
    </div>
  );
}

// ── SeatCard ──────────────────────────────────────────────────────────────────
function SeatCard({ seat, roomId, isHost, isCoHost, onAction, compact }) {
  var [copied, setCopied] = useState(false);
  var cfg = STATUS_CONFIG[seat.status] || STATUS_CONFIG.empty;
  var canControl = isHost || isCoHost;

  function handleCopy() {
    copyToClipboard(vdoPushUrl(roomId, seat.num, seat.label));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
        borderRadius: 8, background: seat.status === 'empty' ? 'transparent' : C.bg3,
        border: '1px solid ' + (seat.status === 'empty' ? 'transparent' : cfg.color + '30'),
      }}>
        <StatusDot status={seat.status} size={7} />
        <span style={{ ...T, fontSize: 11, color: C.textD, minWidth: 22 }}>G{seat.num}</span>
        <span style={{ ...T, fontSize: 12, color: seat.name ? C.text : C.textD, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {seat.name || '— open —'}
        </span>
        {canControl && (
          <button onClick={handleCopy} style={{ background: 'none', border: 'none', color: copied ? C.green : C.gold, cursor: 'pointer', fontSize: 10, ...T, padding: '2px 6px', borderRadius: 4, border: '1px solid ' + (copied ? C.green : C.gold) + '44' }}>
            {copied ? '✓' : 'COPY'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid ' + (seat.status === 'empty' ? C.gray : cfg.color + '44'),
      background: seat.status === 'empty' ? C.bg2 : C.card,
      boxShadow: seat.status !== 'empty' ? '0 0 12px ' + cfg.color + '1A' : 'none',
    }}>
      <div style={{ height: 3, background: seat.status === 'empty' ? C.gray : cfg.color + '80' }} />
      <div style={{ padding: '8px 10px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <StatusDot status={seat.status} size={8} />
          <span style={{ ...T, fontSize: 10, fontWeight: 700, color: C.textD, letterSpacing: '0.1em' }}>G{seat.num}</span>
          {seat.status !== 'empty' && (
            <span style={{ ...T, fontSize: 9, color: cfg.color, background: cfg.color + '1A', padding: '1px 5px', borderRadius: 3, fontWeight: 700, letterSpacing: '0.08em', marginLeft: 'auto' }}>
              {cfg.label}
            </span>
          )}
        </div>

        {/* Name */}
        <div style={{ ...T, fontSize: 13, color: seat.name ? C.text : C.textD, fontWeight: seat.name ? 600 : 400, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minHeight: 18 }}>
          {seat.name || 'Open Seat'}
        </div>

        {/* Actions */}
        {canControl && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button onClick={handleCopy} style={{ ...btnStyle(copied ? C.green : C.gold), flex: 1 }}>
              {copied ? '✓ COPIED' : '📋 LINK'}
            </button>
            <button onClick={() => window.open(vdoViewUrl(roomId, seat.label || ('G' + seat.num)), '_blank')} style={btnStyle(C.amber)}>
              👁
            </button>
            {seat.status !== 'empty' && (
              <>
                <button onClick={() => onAction(seat.num, 'mute')} style={btnStyle(C.amber)}>
                  {seat.muted ? '🔈' : '🔇'}
                </button>
                <button onClick={() => onAction(seat.num, 'spotlight')} style={btnStyle(C.gold)}>
                  ✦
                </button>
                {isHost && (
                  <>
                    <button onClick={() => onAction(seat.num, 'cohost')} style={btnStyle(C.goldDim)}>
                      ★
                    </button>
                    <button onClick={() => onAction(seat.num, 'remove')} style={btnStyle(C.scarlet)}>
                      ✕
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
        {!canControl && seat.num === 1 && (
          <button onClick={() => window.open(vdoPushUrl(roomId, seat.num, seat.label), '_blank')} style={{ ...btnStyle(C.gold), width: '100%' }}>
            📡 JOIN STAGE
          </button>
        )}
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    padding: '4px 8px', borderRadius: 5, border: '1px solid ' + color + '44',
    background: color + '18', color: color, cursor: 'pointer',
    ...T, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
  };
}

// ── Stage Tab ─────────────────────────────────────────────────────────────────
function StageTab({ seats, roomId, isHost, isCoHost, onAction, onSeatUpdate }) {
  var [filter, setFilter] = useState('all');
  var [layout, setLayout] = useState('grid');
  var [stageLocked, setStageLocked] = useState(false);
  var [copiedAll, setCopiedAll] = useState(false);

  var canControl = isHost || isCoHost;

  var filtered = seats.filter(s =>
    filter === 'all' ? true :
    filter === 'live' ? s.status === 'live' || s.status === 'speaking' :
    s.status === 'empty'
  );

  function copyAllLinks() {
    var links = seats.map(s => 'Guest ' + s.num + ': ' + vdoPushUrl(roomId, s.num, s.label)).join('\n');
    copyToClipboard(links);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  }

  return (
    <div>
      {/* Controls strip */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        {['all', 'live', 'empty'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...btnStyle(filter === f ? C.gold : C.textD),
            background: filter === f ? C.gold + '22' : 'transparent',
            border: '1px solid ' + (filter === f ? C.gold + '60' : C.gray),
          }}>
            {f === 'all' ? 'ALL 20' : f === 'live' ? '🔴 LIVE' : '○ EMPTY'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setLayout(layout === 'grid' ? 'compact' : 'grid')} style={btnStyle(C.textM)}>
          {layout === 'grid' ? '☰' : '⊞'}
        </button>
        {canControl && (
          <>
            <button onClick={() => onAction(-1, 'muteall')} style={btnStyle(C.amber)}>🔇 ALL</button>
            <button onClick={() => setStageLocked(!stageLocked)} style={btnStyle(stageLocked ? C.scarlet : C.textM)}>
              {stageLocked ? '🔒 LOCKED' : '🔓 LOCK'}
            </button>
            <button onClick={copyAllLinks} style={btnStyle(copiedAll ? C.green : C.goldDim)}>
              {copiedAll ? '✓ COPIED' : '📋 ALL LINKS'}
            </button>
          </>
        )}
      </div>

      {/* Seat grid */}
      {layout === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
          {filtered.map(seat => (
            <SeatCard key={seat.num} seat={seat} roomId={roomId} isHost={isHost} isCoHost={isCoHost} onAction={onAction} compact={false} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map(seat => (
            <SeatCard key={seat.num} seat={seat} roomId={roomId} isHost={isHost} isCoHost={isCoHost} onAction={onAction} compact />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Greenroom Tab ─────────────────────────────────────────────────────────────
function GreenroomTab({ roomId, seats, isHost, isCoHost, currentUser, onSeatAssign }) {
  var qc = useQueryClient();
  var [admitSeat, setAdmitSeat] = useState({});

  var { data: waitingList = [] } = useQuery({
    queryKey: ['greenroom', roomId],
    queryFn: () => base44.entities.Participant.filter({ room_id: roomId, status: 'waiting' }),
    refetchInterval: 4000,
  });

  var { data: onStage = [] } = useQuery({
    queryKey: ['onstage', roomId],
    queryFn: () => base44.entities.Participant.filter({ room_id: roomId, status: 'admitted' }),
    refetchInterval: 5000,
  });

  var admitMutation = useMutation({
    mutationFn: ({ participantId, seatNum }) => Promise.all([
      base44.entities.Participant.update(participantId, { status: 'admitted', seat_number: seatNum }),
    ]),
    onSuccess: () => { qc.invalidateQueries(['greenroom', roomId]); qc.invalidateQueries(['onstage', roomId]); },
  });

  var rejectMutation = useMutation({
    mutationFn: (participantId) => base44.entities.Participant.update(participantId, { status: 'rejected' }),
    onSuccess: () => qc.invalidateQueries(['greenroom', roomId]),
  });

  var removeMutation = useMutation({
    mutationFn: (participantId) => base44.entities.Participant.update(participantId, { status: 'removed' }),
    onSuccess: () => qc.invalidateQueries(['onstage', roomId]),
  });

  var emptySeatNums = seats.filter(s => s.status === 'empty').map(s => s.num);

  if (!isHost && !isCoHost) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🟢</div>
        <div style={{ ...T, color: C.textM, fontSize: 14 }}>Greenroom is host-only</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Waiting */}
      <div>
        <div style={{ ...T, fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: '0.12em', marginBottom: 8 }}>
          WAITING TO JOIN ({waitingList.length})
        </div>
        {waitingList.length === 0 && (
          <div style={{ ...T, color: C.textD, fontSize: 12, textAlign: 'center', padding: '16px 0' }}>No one waiting</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {waitingList.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: C.bg3, border: '1px solid ' + C.gold + '22' }}>
              <StatusDot status="invited" size={7} />
              <span style={{ ...T, fontSize: 13, color: C.text, flex: 1 }}>{p.user_name || p.user_id}</span>
              <select value={admitSeat[p.id] || ''} onChange={e => setAdmitSeat(prev => ({ ...prev, [p.id]: e.target.value }))}
                style={{ background: C.bg2, border: '1px solid ' + C.gold + '40', color: C.gold, borderRadius: 5, padding: '3px 6px', ...T, fontSize: 11, cursor: 'pointer' }}>
                <option value="">Seat…</option>
                {emptySeatNums.map(n => <option key={n} value={n}>G{n}</option>)}
              </select>
              <button onClick={() => admitSeat[p.id] && admitMutation.mutate({ participantId: p.id, seatNum: parseInt(admitSeat[p.id]) })}
                style={btnStyle(C.green)}>ADMIT</button>
              <button onClick={() => rejectMutation.mutate(p.id)} style={btnStyle(C.scarlet)}>✕</button>
            </div>
          ))}
        </div>
        {waitingList.length > 1 && (
          <button onClick={() => waitingList.forEach((p, i) => admitMutation.mutate({ participantId: p.id, seatNum: emptySeatNums[i] || (i + 1) }))}
            style={{ ...btnStyle(C.green), marginTop: 8, width: '100%' }}>
            ADMIT ALL ({waitingList.length})
          </button>
        )}
      </div>

      {/* On Stage */}
      <div>
        <div style={{ ...T, fontSize: 10, fontWeight: 700, color: C.scarlet, letterSpacing: '0.12em', marginBottom: 8 }}>
          ON STAGE ({onStage.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {onStage.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: C.bg3, border: '1px solid ' + C.scarlet + '30' }}>
              <StatusDot status="live" size={7} />
              <span style={{ ...T, fontSize: 13, color: C.text, flex: 1 }}>{p.user_name || p.user_id}</span>
              {p.seat_number && <span style={{ ...T, fontSize: 10, color: C.textD }}>G{p.seat_number}</span>}
              <button onClick={() => removeMutation.mutate(p.id)} style={btnStyle(C.scarlet)}>REMOVE</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Watch Party Tab ───────────────────────────────────────────────────────────
function WatchPartyTab({ roomId, isHost, currentUser }) {
  var qc = useQueryClient();
  var [videoUrl, setVideoUrl] = useState('');
  var [seekInput, setSeekInput] = useState('');

  var { data: party } = useQuery({
    queryKey: ['watchparty', roomId],
    queryFn: () => base44.entities.WatchParty.filter({ room_id: roomId }).then(r => r[0] || null),
    refetchInterval: 3000,
  });

  var createMutation = useMutation({
    mutationFn: () => base44.entities.WatchParty.create({
      room_id: roomId, host_id: currentUser?.id,
      video_url: videoUrl, playback_state: 'paused', current_time: 0,
      updated_at_ms: Date.now(),
    }),
    onSuccess: () => { qc.invalidateQueries(['watchparty', roomId]); setVideoUrl(''); },
  });

  var updateMutation = useMutation({
    mutationFn: (patch) => base44.entities.WatchParty.update(party?.id, { ...patch, updated_at_ms: Date.now() }),
    onSuccess: () => qc.invalidateQueries(['watchparty', roomId]),
  });

  var deleteMutation = useMutation({
    mutationFn: () => base44.entities.WatchParty.delete(party?.id),
    onSuccess: () => qc.invalidateQueries(['watchparty', roomId]),
  });

  if (!party) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...T, fontSize: 10, color: C.gold, letterSpacing: '0.12em', fontWeight: 700 }}>START WATCH PARTY</div>
        <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
          placeholder="Paste video URL (YouTube, Twitch VOD, MP4…)"
          style={{ background: C.bg2, border: '1px solid ' + C.gold + '44', borderRadius: 7, padding: '9px 12px', color: C.text, ...T, fontSize: 13, outline: 'none', width: '100%' }} />
        {isHost && (
          <button onClick={() => videoUrl && createMutation.mutate()} disabled={!videoUrl}
            style={{ ...btnStyle(videoUrl ? C.gold : C.textD), width: '100%', padding: '10px', fontSize: 13 }}>
            🎬 START PARTY
          </button>
        )}
        <div style={{ ...T, fontSize: 11, color: C.textD, textAlign: 'center' }}>No active watch party</div>
      </div>
    );
  }

  var elapsed = party.current_time || 0;
  var mins = Math.floor(elapsed / 60);
  var secs = Math.floor(elapsed % 60);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Now playing */}
      <div style={{ padding: '10px 12px', borderRadius: 8, background: C.bg3, border: '1px solid ' + C.gold + '30' }}>
        <div style={{ ...T, fontSize: 9, color: C.gold, letterSpacing: '0.1em', marginBottom: 4 }}>NOW PLAYING</div>
        <div style={{ ...T, fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {party.video_url}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center' }}>
          <StatusDot status={party.playback_state === 'playing' ? 'live' : 'muted'} size={7} />
          <span style={{ ...T, fontSize: 11, color: party.playback_state === 'playing' ? C.scarlet : C.amber }}>
            {party.playback_state === 'playing' ? 'PLAYING' : 'PAUSED'}
          </span>
          <span style={{ ...T, fontSize: 11, color: C.textM }}>
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls (host only) */}
      {isHost && (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => updateMutation.mutate({ playback_state: 'playing' })} style={{ ...btnStyle(C.green), flex: 1 }}>▶ PLAY</button>
            <button onClick={() => updateMutation.mutate({ playback_state: 'paused' })} style={{ ...btnStyle(C.amber), flex: 1 }}>⏸ PAUSE</button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={seekInput} onChange={e => setSeekInput(e.target.value)}
              placeholder="Seek to (seconds)"
              style={{ flex: 1, background: C.bg2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: '7px 10px', color: C.text, ...T, fontSize: 12, outline: 'none' }} />
            <button onClick={() => updateMutation.mutate({ current_time: parseFloat(seekInput) || 0 })} style={btnStyle(C.gold)}>SEEK</button>
          </div>
          <button onClick={() => deleteMutation.mutate()} style={{ ...btnStyle(C.scarlet), width: '100%' }}>⏹ END PARTY</button>
        </>
      )}

      {/* Sync guide */}
      <div style={{ padding: '10px 12px', borderRadius: 8, background: C.bg2, border: '1px solid ' + C.border }}>
        <div style={{ ...T, fontSize: 9, color: C.gold, letterSpacing: '0.1em', marginBottom: 6 }}>GUEST SYNC GUIDE</div>
        {[
          { role: 'Host', action: 'Controls playback — Play, Pause, Seek' },
          { role: 'Co-Host', action: 'Views controls, echoes host commands' },
          { role: 'Guest', action: 'Receives real-time position sync' },
          { role: 'Viewer', action: 'Watches synced stream via embed' },
        ].map(row => (
          <div key={row.role} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <span style={{ ...T, fontSize: 11, color: C.gold, minWidth: 62 }}>{row.role}</span>
            <span style={{ ...T, fontSize: 11, color: C.textM }}>{row.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Battle Tab ────────────────────────────────────────────────────────────────
function BattleTab({ roomId, isHost, isCoHost, currentUser }) {
  var qc = useQueryClient();
  var [challenger, setChallenger] = useState('');
  var [duration, setDuration] = useState(5);
  var [elapsed, setElapsed] = useState(0);
  var timerRef = useRef(null);

  var { data: battles = [] } = useQuery({
    queryKey: ['battles', roomId],
    queryFn: () => base44.entities.PKBattle.filter({ room_id: roomId }),
    refetchInterval: 5000,
  });

  var activeBattle = battles.find(b => b.status === 'active');
  var pastBattles = battles.filter(b => b.status === 'ended').slice(0, 5);

  var createMutation = useMutation({
    mutationFn: () => base44.entities.PKBattle.create({
      room_id: roomId, creator_id: currentUser?.id,
      challenger_name: challenger, status: 'accepted',
      creator_score: 0, challenger_score: 0,
      duration_minutes: duration, started_at: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries(['battles', roomId]); setChallenger(''); },
  });

  var scoreMutation = useMutation({
    mutationFn: ({ id, field, delta }) => base44.entities.PKBattle.update(id, { [field]: (activeBattle?.[field] || 0) + delta }),
    onSuccess: () => qc.invalidateQueries(['battles', roomId]),
  });

  var endMutation = useMutation({
    mutationFn: () => base44.entities.PKBattle.update(activeBattle?.id, { status: 'ended', ended_at: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries(['battles', roomId]),
  });

  useEffect(() => {
    if (activeBattle) {
      timerRef.current = setInterval(() => {
        var started = new Date(activeBattle.started_at).getTime();
        setElapsed(Math.floor((Date.now() - started) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [activeBattle?.id]);

  var canControl = isHost || isCoHost;

  var totalScore = activeBattle ? (activeBattle.creator_score + activeBattle.challenger_score) || 1 : 1;
  var creatorPct = activeBattle ? Math.round((activeBattle.creator_score / totalScore) * 100) : 50;
  var maxSecs = (activeBattle?.duration_minutes || duration) * 60;
  var timeLeft = Math.max(0, maxSecs - elapsed);
  var tMins = Math.floor(timeLeft / 60);
  var tSecs = timeLeft % 60;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {activeBattle ? (
        /* Active battle view */
        <div>
          {/* Timer */}
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ ...T, fontSize: 32, fontWeight: 900, color: timeLeft < 60 ? C.scarlet : C.gold, lineHeight: 1 }}>
              {tMins}:{tSecs.toString().padStart(2, '0')}
            </div>
            <div style={{ ...T, fontSize: 10, color: C.textD, letterSpacing: '0.1em' }}>REMAINING</div>
          </div>

          {/* Split bar */}
          <div style={{ borderRadius: 6, overflow: 'hidden', height: 28, display: 'flex', marginBottom: 6 }}>
            <motion.div animate={{ width: creatorPct + '%' }} transition={{ type: 'spring', damping: 20 }}
              style={{ background: C.crimson, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ ...T, fontSize: 11, color: C.gold, fontWeight: 700 }}>{creatorPct}%</span>
            </motion.div>
            <motion.div animate={{ width: (100 - creatorPct) + '%' }} transition={{ type: 'spring', damping: 20 }}
              style={{ background: C.amber + 'CC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ ...T, fontSize: 11, color: C.text, fontWeight: 700 }}>{100 - creatorPct}%</span>
            </motion.div>
          </div>

          {/* Scores */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, padding: '10px', borderRadius: 8, background: C.crimson + '22', border: '1px solid ' + C.crimson + '44', textAlign: 'center' }}>
              <div style={{ ...T, fontSize: 22, fontWeight: 900, color: C.gold }}>{activeBattle.creator_score}</div>
              <div style={{ ...T, fontSize: 10, color: C.textM }}>HOST</div>
              {canControl && (
                <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 6 }}>
                  {[1, 5, 10].map(d => (
                    <button key={d} onClick={() => scoreMutation.mutate({ id: activeBattle.id, field: 'creator_score', delta: d })} style={btnStyle(C.crimson)}>+{d}</button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', ...T, fontSize: 20, color: C.textD }}>⚔</div>
            <div style={{ flex: 1, padding: '10px', borderRadius: 8, background: C.amber + '22', border: '1px solid ' + C.amber + '44', textAlign: 'center' }}>
              <div style={{ ...T, fontSize: 22, fontWeight: 900, color: C.gold }}>{activeBattle.challenger_score}</div>
              <div style={{ ...T, fontSize: 10, color: C.textM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeBattle.challenger_name || 'CHALLENGER'}</div>
              {canControl && (
                <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 6 }}>
                  {[1, 5, 10].map(d => (
                    <button key={d} onClick={() => scoreMutation.mutate({ id: activeBattle.id, field: 'challenger_score', delta: d })} style={btnStyle(C.amber)}>+{d}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {canControl && (
            <button onClick={() => endMutation.mutate()} style={{ ...btnStyle(C.scarlet), width: '100%', padding: '10px', fontSize: 13 }}>
              ⏹ END BATTLE
            </button>
          )}
        </div>
      ) : (
        /* Create battle */
        canControl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ ...T, fontSize: 10, color: C.gold, letterSpacing: '0.12em', fontWeight: 700 }}>START PK BATTLE</div>
            <input value={challenger} onChange={e => setChallenger(e.target.value)}
              placeholder="Challenger name or stream…"
              style={{ background: C.bg2, border: '1px solid ' + C.gold + '44', borderRadius: 7, padding: '9px 12px', color: C.text, ...T, fontSize: 13, outline: 'none' }} />
            <div>
              <div style={{ ...T, fontSize: 10, color: C.textD, marginBottom: 6 }}>DURATION</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 5, 10].map(m => (
                  <button key={m} onClick={() => setDuration(m)} style={{ ...btnStyle(duration === m ? C.gold : C.textD), background: duration === m ? C.gold + '22' : 'transparent' }}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => challenger && createMutation.mutate()} disabled={!challenger}
              style={{ ...btnStyle(challenger ? C.scarlet : C.textD), width: '100%', padding: '10px', fontSize: 13 }}>
              ⚔ START BATTLE
            </button>
          </div>
        )
      )}

      {/* Past battles */}
      {pastBattles.length > 0 && (
        <div>
          <div style={{ ...T, fontSize: 10, color: C.textD, letterSpacing: '0.1em', marginBottom: 6 }}>RECENT BATTLES</div>
          {pastBattles.map(b => (
            <div key={b.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', borderRadius: 6, background: C.bg3, border: '1px solid ' + C.gray, marginBottom: 4 }}>
              <span style={{ ...T, fontSize: 12, color: C.text, flex: 1 }}>vs {b.challenger_name}</span>
              <span style={{ ...T, fontSize: 11, color: C.gold }}>{b.creator_score} – {b.challenger_score}</span>
            </div>
          ))}
        </div>
      )}

      {!canControl && !activeBattle && (
        <div style={{ textAlign: 'center', padding: '24px 0', ...T, color: C.textD, fontSize: 13 }}>No active battle</div>
      )}
    </div>
  );
}

// ── Links Tab ─────────────────────────────────────────────────────────────────
function LinksTab({ roomId, seats, isHost, isCoHost }) {
  var [copied, setCopied] = useState({});

  function copy(key, text) {
    copyToClipboard(text);
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
  }

  var masterLinks = [
    { key: 'director', label: '🎬 Director (Host control)', url: vdoDirectorUrl(roomId), color: C.gold },
    { key: 'scene',    label: '📺 OBS Scene source',        url: vdoSceneUrl(roomId),    color: C.amber },
    { key: 'join',     label: '🔗 Room join page',          url: window.location.href,   color: C.bronze },
  ];

  if (!isHost && !isCoHost) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🔗</div>
        <div style={{ ...T, color: C.textM, fontSize: 14 }}>Links visible to hosts only</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Master links */}
      <div>
        <div style={{ ...T, fontSize: 10, color: C.gold, letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>MASTER LINKS</div>
        {masterLinks.map(({ key, label, url, color }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, background: C.bg3, border: '1px solid ' + color + '30', marginBottom: 6 }}>
            <span style={{ ...T, fontSize: 12, color: C.textM, flex: 1 }}>{label}</span>
            <button onClick={() => window.open(url, '_blank')} style={btnStyle(color)}>↗</button>
            <button onClick={() => copy(key, url)} style={btnStyle(copied[key] ? C.green : color)}>
              {copied[key] ? '✓' : '📋'}
            </button>
          </div>
        ))}
      </div>

      {/* Per-guest links */}
      <div>
        <div style={{ ...T, fontSize: 10, color: C.gold, letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>
          GUEST PUSH LINKS (20 seats)
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {seats.map(seat => {
            var url = vdoPushUrl(roomId, seat.num, seat.label);
            var k = 'g' + seat.num;
            return (
              <div key={seat.num} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, background: seat.status !== 'empty' ? C.bg3 : 'transparent', border: '1px solid ' + (seat.status !== 'empty' ? C.gold + '22' : C.gray) }}>
                <StatusDot status={seat.status} size={6} />
                <span style={{ ...T, fontSize: 11, color: C.textD, minWidth: 22 }}>G{seat.num}</span>
                <span style={{ ...T, fontSize: 11, color: seat.name ? C.text : C.textD, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {seat.name || '—'}
                </span>
                <button onClick={() => window.open(url, '_blank')} style={btnStyle(C.amber)}>↗</button>
                <button onClick={() => copy(k, url)} style={btnStyle(copied[k] ? C.green : C.gold)}>
                  {copied[k] ? '✓' : '📋'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main CoStreamHub ───────────────────────────────────────────────────────────
export default function CoStreamHub({ roomId, isHost, isCoHost, currentUser, compact }) {
  var [activeTab, setActiveTab] = useState('stage');
  var [seats, setSeats] = useState(() =>
    Array.from({ length: SEAT_COUNT }, (_, i) => ({
      num: i + 1,
      label: 'G' + (i + 1),
      status: 'empty',
      name: null,
      muted: false,
    }))
  );
  var qc = useQueryClient();

  // Sync seat statuses from Participant entity
  var { data: participants = [] } = useQuery({
    queryKey: ['participants', roomId],
    queryFn: () => base44.entities.Participant.filter({ room_id: roomId, status: 'admitted' }),
    refetchInterval: 6000,
  });

  useEffect(() => {
    setSeats(prev => prev.map(seat => {
      var match = participants.find(p => p.seat_number === seat.num);
      if (match) {
        return { ...seat, status: match.is_muted ? 'muted' : 'live', name: match.user_name || match.user_id };
      }
      return { ...seat, status: 'empty', name: null };
    }));
  }, [participants]);

  function handleSeatAction(seatNum, action) {
    if (action === 'muteall') {
      setSeats(prev => prev.map(s => s.status !== 'empty' ? { ...s, muted: true, status: 'muted' } : s));
      return;
    }
    setSeats(prev => prev.map(s => {
      if (s.num !== seatNum) return s;
      if (action === 'mute') return { ...s, muted: !s.muted, status: s.muted ? 'live' : 'muted' };
      if (action === 'remove') return { ...s, status: 'empty', name: null };
      if (action === 'spotlight') return s; // visual-only feedback handled elsewhere
      return s;
    }));
  }

  var tabs = [
    { id: 'stage',     label: '🎙 Stage',    alwaysShow: true },
    { id: 'greenroom', label: '🟢 Greenroom', alwaysShow: false },
    { id: 'watchparty',label: '🎬 Watch',     alwaysShow: true },
    { id: 'battle',    label: '⚔ Battle',    alwaysShow: true },
    { id: 'links',     label: '🔗 Links',     alwaysShow: false },
  ];

  var visibleTabs = tabs.filter(t => t.alwaysShow || isHost || isCoHost);

  var liveSeatCount = seats.filter(s => s.status === 'live' || s.status === 'speaking').length;

  return (
    <div style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: compact ? 10 : 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: compact ? '100%' : undefined }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid ' + C.border, flexShrink: 0 }}>
        <StatusDot status={liveSeatCount > 0 ? 'live' : 'empty'} size={8} />
        <span style={{ ...T, fontSize: 13, fontWeight: 700, color: C.gold, letterSpacing: '0.06em' }}>CO-STREAM HUB</span>
        {liveSeatCount > 0 && (
          <span style={{ ...T, fontSize: 10, color: C.scarlet, background: C.scarlet + '22', padding: '2px 7px', borderRadius: 4 }}>
            {liveSeatCount} LIVE
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ ...T, fontSize: 10, color: C.textD }}>VDO.Ninja · 20 seats</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid ' + C.border, overflowX: 'auto', flexShrink: 0 }}>
        {visibleTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '8px 12px', border: 'none', cursor: 'pointer',
            background: activeTab === tab.id ? C.gold + '15' : 'transparent',
            color: activeTab === tab.id ? C.gold : C.textM,
            borderBottom: '2px solid ' + (activeTab === tab.id ? C.gold : 'transparent'),
            ...T, fontSize: 11, fontWeight: activeTab === tab.id ? 700 : 400,
            whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
            {activeTab === 'stage' && (
              <StageTab seats={seats} roomId={roomId} isHost={isHost} isCoHost={isCoHost} onAction={handleSeatAction} />
            )}
            {activeTab === 'greenroom' && (
              <GreenroomTab roomId={roomId} seats={seats} isHost={isHost} isCoHost={isCoHost} currentUser={currentUser} onSeatAssign={() => {}} />
            )}
            {activeTab === 'watchparty' && (
              <WatchPartyTab roomId={roomId} isHost={isHost} currentUser={currentUser} />
            )}
            {activeTab === 'battle' && (
              <BattleTab roomId={roomId} isHost={isHost} isCoHost={isCoHost} currentUser={currentUser} />
            )}
            {activeTab === 'links' && (
              <LinksTab roomId={roomId} seats={seats} isHost={isHost} isCoHost={isCoHost} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
