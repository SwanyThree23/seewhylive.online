import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ChevronDown, MessageSquare, Timer, Gift } from 'lucide-react';
import { useRoomPresence } from '@/hooks/useRoomPresence';
import { useHostControls } from '@/hooks/useHostControls';

const G = '#D4AF37';
const EM = '#6DBF7E';
const BORDER = 'rgba(212,175,55,0.15)';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const PALETTE = ['#D4AF37', '#C0392B', '#4A8A7A', '#7B5DA6', '#D4854A', '#6DBF7E'];

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}

function colorFor(name) {
  let sum = 0;
  const s = name || '';
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}

const CONTROLS = [
  { key: 'chat_enabled', label: 'Chat', icon: MessageSquare, on: 'On', off: 'Paused' },
  { key: 'slow_mode', label: 'Slow mode', icon: Timer, on: 'On', off: 'Off' },
  { key: 'gift_alerts', label: 'Gift alerts', icon: Gift, on: 'On', off: 'Off' },
];

/**
 * Who is watching this broadcast right now — live count, avatar stack and the
 * full list — plus, for the host, the switches that apply to the whole room.
 *
 * Presence and every switch are realtime: a change on one device shows up on the
 * others without a refresh.
 */
export default function LiveViewersPanel({ roomId, user, isHost = false }) {
  const { watchers, count } = useRoomPresence(roomId, user);
  const { controls, setControl } = useHostControls(roomId, user);
  const [open, setOpen] = useState(false);

  if (!roomId) return null;

  return (
    <section className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(13,16,34,0.95)', border: `1px solid ${BORDER}` }}>

      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="relative flex items-center justify-center shrink-0" style={{ width: 18, height: 18 }}>
          <span className="absolute inline-flex rounded-full opacity-60 animate-ping"
            style={{ width: 10, height: 10, background: EM }} />
          <span className="relative inline-flex rounded-full" style={{ width: 8, height: 8, background: EM }} />
        </span>

        <Eye className="w-3.5 h-3.5 shrink-0" style={{ color: G }} />

        <div className="flex items-baseline gap-1.5 shrink-0">
          <span className="text-[15px] font-black" style={{ color: '#fff', ...T }}>{count}</span>
          <span className="text-[11px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.45)', ...T }}>
            watching now
          </span>
        </div>

        {/* Avatar stack */}
        <div className="flex items-center -space-x-2 ml-1">
          {watchers.slice(0, 5).map((w) => (
            <div key={w.id}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
              style={{
                background: colorFor(w.user_name) + '33',
                border: `1.5px solid ${colorFor(w.user_name)}`,
                color: colorFor(w.user_name),
              }}
              title={w.user_name}>
              {initials(w.user_name)}
            </div>
          ))}
        </div>

        {count > 5 && (
          <span className="text-[11px] font-black shrink-0" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
            +{count - 5}
          </span>
        )}

        <button onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Hide viewer list' : 'Show viewer list'}
          aria-expanded={open}
          className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
          <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="px-3 pb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {watchers.length === 0 ? (
                <p className="text-[11px] py-3 text-center" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
                  No one else here yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-3">
                  {watchers.map((w) => (
                    <div key={w.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg min-w-0"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                        style={{ background: colorFor(w.user_name) + '33', color: colorFor(w.user_name) }}>
                        {initials(w.user_name)}
                      </div>
                      <span className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.7)', ...T }}>
                        {w.user_name || 'Guest'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isHost && (
                <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-[11px] font-black uppercase tracking-widest mb-2"
                    style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
                    Room controls · live on every device
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CONTROLS.map(({ key, label, icon: Icon, on, off }) => {
                      const enabled = controls[key];
                      return (
                        <button key={key}
                          onClick={() => setControl(key, !enabled)}
                          aria-pressed={enabled}
                          aria-label={`${label}: ${enabled ? on : off}`}
                          className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl transition-all"
                          style={{
                            background: enabled ? `${EM}14` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${enabled ? `${EM}40` : 'rgba(255,255,255,0.08)'}`,
                            minHeight: 44,
                          }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: enabled ? EM : 'rgba(255,255,255,0.4)' }} />
                          <span className="text-[11px] font-black uppercase" style={{ color: enabled ? EM : 'rgba(255,255,255,0.4)', ...T }}>
                            {label}
                          </span>
                          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
                            {enabled ? on : off}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}