import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  UserPlus,
  Check,
  X,
  Clock,
  Mic,
  MicOff,
  Video,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const PINK = '#C0392B';
const TEAL = '#C9A84C';

const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function timeAgo(dateStr) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function GuestQueue({ roomId, isHost }) {
  const qc = useQueryClient();

  const { data: waitingGuests = [] } = useQuery({
    queryKey: ['guest-queue', roomId],
    queryFn: () =>
      base44.entities.Participant.filter(
        { room_id: roomId, status: 'waiting' },
        '-created_date',
        50
      ),
    refetchInterval: 3000,
    enabled: !!roomId,
  });

  const { data: admittedGuests = [] } = useQuery({
    queryKey: ['admitted-guests', roomId],
    queryFn: () =>
      base44.entities.Participant.filter(
        { room_id: roomId, status: 'admitted' },
        '-created_date',
        50
      ),
    refetchInterval: 3000,
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.Participant.subscribe((event) => {
      if (event.data?.room_id === roomId) {
        qc.invalidateQueries(['guest-queue', roomId]);
        qc.invalidateQueries(['admitted-guests', roomId]);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [roomId, qc]);

  const admitMutation = useMutation({
    mutationFn: ({ id }) =>
      base44.entities.Participant.update(id, {
        status: 'admitted',
        admitted_at: new Date().toISOString(),
      }),
    onSuccess: (_, { name }) => {
      toast.success(`${name} admitted to stage!`);
      qc.invalidateQueries(['guest-queue', roomId]);
      qc.invalidateQueries(['admitted-guests', roomId]);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id }) =>
      base44.entities.Participant.update(id, { status: 'rejected' }),
    onSuccess: (_, { name }) => {
      toast.info(`${name} removed from queue`);
      qc.invalidateQueries(['guest-queue', roomId]);
      qc.invalidateQueries(['admitted-guests', roomId]);
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ id }) =>
      base44.entities.Participant.update(id, { status: 'removed' }),
    onSuccess: (_, { name }) => {
      toast.info(`${name} removed from stage`);
      qc.invalidateQueries(['guest-queue', roomId]);
      qc.invalidateQueries(['admitted-guests', roomId]);
    },
  });

  const isEmpty = waitingGuests.length === 0 && admittedGuests.length === 0;

  return (
    <div
      style={{
        ...T,
        maxWidth: 300,
        width: '100%',
        background: 'rgba(7,7,15,0.92)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <UserPlus size={14} color={GOLD} />
        <span
          style={{
            ...T,
            color: GOLD,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            flex: 1,
          }}
        >
          Guest Queue
        </span>
        {waitingGuests.length > 0 && (
          <span
            style={{
              background: CRIMSON,
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              borderRadius: 20,
              padding: '2px 7px',
              letterSpacing: '0.03em',
              lineHeight: 1.4,
            }}
          >
            {waitingGuests.length}
          </span>
        )}
      </div>

      {/* Non-host message */}
      {!isHost && (
        <div
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: 10,
            textAlign: 'center',
            padding: '8px 4px',
            ...T,
          }}
        >
          Only the host can manage the guest queue.
        </div>
      )}

      {isHost && (
        <>
          {/* Waiting Section */}
          {waitingGuests.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span
                style={{
                  ...T,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: `rgba(212,175,55,0.6)`,
                  paddingLeft: 2,
                }}
              >
                WAITING
              </span>
              <AnimatePresence initial={false}>
                {waitingGuests.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 10,
                      padding: '8px 9px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {/* Top row: avatar + name + time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${CRIMSON}, #5a0015)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#fff',
                          ...T,
                        }}
                      >
                        {(p.user_name || '?')[0].toUpperCase()}
                      </div>

                      {/* Name + subtitle */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            ...T,
                            fontSize: 10,
                            fontWeight: 900,
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {p.user_name || 'Guest'}
                        </div>
                        <div
                          style={{
                            ...T,
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.4)',
                          }}
                        >
                          wants to join
                        </div>
                      </div>

                      {/* Time */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          color: 'rgba(255,255,255,0.3)',
                          flexShrink: 0,
                        }}
                      >
                        <Clock size={8} />
                        <span style={{ ...T, fontSize: 11 }}>
                          {p.created_date ? timeAgo(p.created_date) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button
                        onClick={() =>
                          admitMutation.mutate({ id: p.id, name: p.user_name || 'Guest' })
                        }
                        disabled={admitMutation.isPending}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          background: 'rgba(109,191,126,0.12)',
                          border: '1px solid rgba(109,191,126,0.3)',
                          borderRadius: 6,
                          color: '#6DBF7E',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '5px 0',
                          cursor: 'pointer',
                          ...T,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          opacity: admitMutation.isPending ? 0.5 : 1,
                        }}
                      >
                        <Check size={9} />
                        Admit
                      </button>
                      <button
                        onClick={() =>
                          rejectMutation.mutate({ id: p.id, name: p.user_name || 'Guest' })
                        }
                        disabled={rejectMutation.isPending}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          background: 'rgba(255,68,68,0.08)',
                          border: '1px solid rgba(255,68,68,0.2)',
                          borderRadius: 6,
                          color: '#FF6666',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '5px 0',
                          cursor: 'pointer',
                          ...T,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          opacity: rejectMutation.isPending ? 0.5 : 1,
                        }}
                      >
                        <X size={9} />
                        Reject
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* On Stage Section */}
          {admittedGuests.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span
                style={{
                  ...T,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: `rgba(201,168,76,0.8)`,
                  paddingLeft: 2,
                }}
              >
                ON STAGE
              </span>
              <AnimatePresence initial={false}>
                {admittedGuests.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(201,168,76,0.08)',
                      borderRadius: 10,
                      padding: '8px 9px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                    }}
                  >
                    {/* Avatar with teal glow */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #006666, #003333)',
                        border: `1.5px solid ${TEAL}`,
                        boxShadow: `0 0 8px rgba(201,168,76,0.35)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 800,
                        color: TEAL,
                        ...T,
                      }}
                    >
                      {(p.user_name || '?')[0].toUpperCase()}
                    </div>

                    {/* Name + On stage */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          ...T,
                          fontSize: 10,
                          fontWeight: 900,
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.user_name || 'Guest'}
                      </div>
                      <div
                        style={{
                          ...T,
                          fontSize: 11,
                          color: TEAL,
                        }}
                      >
                        On stage
                      </div>
                    </div>

                    {/* Mic status */}
                    <div style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                      {p.is_muted ? <MicOff size={11} /> : <Mic size={11} />}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() =>
                        removeMutation.mutate({ id: p.id, name: p.user_name || 'Guest' })
                      }
                      disabled={removeMutation.isPending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,68,68,0.1)',
                        border: '1px solid rgba(255,68,68,0.2)',
                        borderRadius: 5,
                        padding: '4px',
                        cursor: 'pointer',
                        color: '#FF6666',
                        flexShrink: 0,
                        opacity: removeMutation.isPending ? 0.5 : 1,
                      }}
                    >
                      <X size={9} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 8px',
                gap: 4,
              }}
            >
              <span
                style={{
                  ...T,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.2)',
                }}
              >
                No guests in queue
              </span>
              <span
                style={{
                  ...T,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.15)',
                  textAlign: 'center',
                }}
              >
                Share your room link to invite guests
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
