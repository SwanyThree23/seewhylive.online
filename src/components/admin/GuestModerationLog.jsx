import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MicOff, Mic, Pin, X, Shield } from 'lucide-react';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const ACTIONS = [
  { id: 'all', label: 'All', icon: Shield, color: G },
  { id: 'mute', label: 'Mute', icon: MicOff, color: '#ef4444' },
  { id: 'unmute', label: 'Unmute', icon: Mic, color: '#6DBF7E' },
  { id: 'pin', label: 'Pin', icon: Pin, color: G },
  { id: 'remove', label: 'Remove', icon: X, color: '#ef4444' },
];

export default function GuestModerationLog() {
  const [filter, setFilter] = useState('all');
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['guestModerationLogs'],
    queryFn: () => base44.entities.GuestModerationLog.list('-created_date', 100),
  });
  const filtered = filter === 'all' ? logs : logs.filter(l => l.action === filter);

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: G }} />
          <p className="font-black text-sm uppercase" style={{ ...T, color: '#fff' }}>Guest Moderation Log</p>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: G, ...T }}>{logs.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ACTIONS.map(a => {
          const active = filter === a.id;
          const Ico = a.icon;
          return (
            <button key={a.id} onClick={() => setFilter(a.id)}
              className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1"
              style={{ background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? G + '88' : 'rgba(255,255,255,0.08)'}`, color: active ? G : 'rgba(255,255,255,0.5)', ...T, cursor: 'pointer' }}>
              <Ico className="w-3 h-3" /> {a.label}
            </button>
          );
        })}
      </div>
      {isLoading ? (
        <p className="text-center py-8 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No guest moderation actions recorded yet.</p>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {filtered.map(l => {
            const a = ACTIONS.find(x => x.id === l.action) || { color: 'rgba(255,255,255,0.5)', icon: Shield };
            const Ico = a.icon;
            return (
              <div key={l.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: (a.color || G) + '18', border: '1px solid ' + (a.color || G) + '33' }}>
                  <Ico className="w-3.5 h-3.5" style={{ color: a.color || G }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate" style={T}>
                    {l.action} · {l.guest_name || (l.guest_user_id ? l.guest_user_id.slice(-6) : 'guest')}
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    by {l.performed_by_name || (l.performed_by ? l.performed_by.slice(-6) : 'host')} · {l.created_date ? format(new Date(l.created_date), 'MMM d, h:mm:ss a') : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}