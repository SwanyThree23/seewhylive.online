import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, CheckCircle, XCircle, CheckCheck, X, Clock } from 'lucide-react';
import { clampStr, safeSrc, LIMITS } from '@/lib/security';

const GOLD = '#D4AF37';
const BURGUNDY = '#800020';

function fmtWait(createdDate) {
  const diff = Math.floor((Date.now() - new Date(createdDate).getTime()) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function WaitlistEntry({ entry, onAdmit, onDeny }) {
  const [denying, setDenying] = useState(false);
  const [denyReason, setDenyReason] = useState('');

  return (
    <motion.div layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
      className="rounded-xl p-3 space-y-2"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0"
          style={{ border: `1px solid rgba(212,175,55,0.25)` }}>
          {safeSrc(entry.avatar_url)
            ? <img src={safeSrc(entry.avatar_url)} className="w-full h-full object-cover" alt=""
                onError={e => { e.currentTarget.style.display = 'none'; }} />
            : <div className="w-full h-full flex items-center justify-center font-black text-sm"
                style={{ background: BURGUNDY, color: GOLD }}>{(entry.user_name || 'U')[0]}</div>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-white">{entry.user_name}</span>
            <span className="text-[11px] font-black uppercase px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(212,175,55,0.12)', color: GOLD, border: `1px solid rgba(212,175,55,0.2)`, fontFamily: 'Barlow Condensed, sans-serif' }}>
              {entry.role_requested}
            </span>
          </div>
          {entry.join_message && (
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>"{entry.join_message}"</p>
          )}
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.25)' }} />
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Share Tech Mono, monospace' }}>
              Waiting {fmtWait(entry.created_date)}
            </span>
          </div>
        </div>
      </div>

      {denying ? (
        <div className="flex gap-1.5">
          <input placeholder="Reason (optional)" value={denyReason} onChange={e => setDenyReason(e.target.value)}
            className="flex-1 h-7 px-2 rounded text-[10px]"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
            maxLength={LIMITS.DENY_REASON}
            onKeyDown={e => { if (e.key === 'Enter') onDeny(entry, clampStr(denyReason, LIMITS.DENY_REASON)); }} />
          <button onClick={() => onDeny(entry, clampStr(denyReason, LIMITS.DENY_REASON))}
            className="h-7 px-3 rounded text-[11px] font-black uppercase"
            style={{ background: `rgba(128,0,32,0.4)`, color: '#C0392B', border: '1px solid rgba(128,0,32,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Deny
          </button>
          <button onClick={() => setDenying(false)}
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <X className="w-3 h-3 text-white/40" />
          </button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <button onClick={() => onAdmit(entry)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-black uppercase text-[11px] transition-all hover:brightness-110"
            style={{ background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.25)', color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <CheckCircle className="w-3 h-3" /> Admit
          </button>
          <button onClick={() => setDenying(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-black uppercase text-[11px] transition-all"
            style={{ background: 'rgba(128,0,32,0.1)', border: '1px solid rgba(128,0,32,0.25)', color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <XCircle className="w-3 h-3" /> Deny
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function GreenroomWaitlistPanel({ roomId, currentUser, onAdmit }) {
  const [open, setOpen] = useState(false);
  const admittingRef = useRef(false);
  const qc = useQueryClient();

  const { data: waitlist = [] } = useQuery({
    queryKey: ['greenroom-waitlist', roomId],
    queryFn: () => base44.entities.GreenroomWaitlist.filter({ room_id: roomId, status: 'waiting' }),
    enabled: !!roomId,
    refetchInterval: 3000,
  });

  const admitMut = useMutation({
    mutationFn: (entry) => Promise.all([
      base44.entities.GreenroomWaitlist.update(entry.id, {
        status: 'admitted',
        admitted_by: currentUser.id,
        resolved_at: new Date().toISOString(),
      }),
      entry.greenroom_session_id && base44.entities.GreenroomSession
        ? base44.entities.GreenroomSession.update(entry.greenroom_session_id, {
            status: 'admitted',
            admitted_at: new Date().toISOString(),
          })
        : Promise.resolve(),
    ]),
    onSuccess: (_, entry) => {
      qc.invalidateQueries(['greenroom-waitlist', roomId]);
      onAdmit?.(entry);
    },
  });

  const denyMut = useMutation({
    mutationFn: ({ entry, reason }) => base44.entities.GreenroomWaitlist.update(entry.id, {
      status: 'denied',
      deny_reason: reason,
      admitted_by: currentUser.id,
      resolved_at: new Date().toISOString(),
    }),
    onSuccess: () => qc.invalidateQueries(['greenroom-waitlist', roomId]),
  });

  const admitAll = async () => {
    if (admittingRef.current) return;
    admittingRef.current = true;
    for (const e of waitlist) {
      admitMut.mutate(e);
      await new Promise(r => setTimeout(r, 150));
    }
    admittingRef.current = false;
  };

  const count = waitlist.length;

  return (
    <>
      {/* Badge button (for host control bar) */}
      <button onClick={() => setOpen(true)}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px] transition-all"
        style={{
          background: count > 0 ? `rgba(212,175,55,0.12)` : 'rgba(255,255,255,0.05)',
          border: count > 0 ? `1px solid rgba(212,175,55,0.3)` : '1px solid rgba(255,255,255,0.1)',
          color: count > 0 ? GOLD : 'rgba(255,255,255,0.4)',
          fontFamily: 'Barlow Condensed, sans-serif',
        }}>
        <Users className="w-3.5 h-3.5" />
        Greenroom
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[11px] flex items-center justify-center font-black"
            style={{ background: BURGUNDY, color: 'white', border: '1.5px solid #0D0D0D' }}>
            {count}
          </span>
        )}
      </button>

      {/* Drawer panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col"
              style={{ background: '#1A1A1A', borderLeft: `1px solid rgba(212,175,55,0.15)` }}>

              {/* Header */}
              <div className="flex items-center justify-between p-4 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <h3 className="font-black uppercase text-sm" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Greenroom Waitlist
                  </h3>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {count} {count === 1 ? 'person' : 'people'} waiting to join
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {count > 1 && (
                    <button onClick={admitAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase"
                      style={{ background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.25)', color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      <CheckCheck className="w-3 h-3" /> Admit All
                    </button>
                  )}
                  <button onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <X className="w-4 h-4 text-white/50" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <AnimatePresence>
                  {waitlist.map(entry => (
                    <WaitlistEntry
                      key={entry.id}
                      entry={entry}
                      onAdmit={(e) => admitMut.mutate(e)}
                      onDeny={(e, reason) => denyMut.mutate({ entry: e, reason })}
                    />
                  ))}
                </AnimatePresence>
                {count === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <Users className="w-10 h-10" style={{ color: 'rgba(212,175,55,0.15)' }} />
                    <p className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.25)' }}>No one waiting right now</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}