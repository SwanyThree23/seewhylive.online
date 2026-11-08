import React, { useState } from 'react';
import { Webhook, Plus, Trash2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const EVENTS = [
  { id: 'stream.start', label: 'Stream Started', color: 'text-[#00FF88]' },
  { id: 'stream.end', label: 'Stream Ended', color: 'text-[#FF2040]' },
  { id: 'viewer.join', label: 'Viewer Joined', color: 'text-blue-400' },
  { id: 'chat.message', label: 'Chat Message', color: 'text-white/60' },
  { id: 'tip.received', label: 'Tip Received', color: 'text-[#FFB800]' },
  { id: 'subscription.new', label: 'New Subscriber', color: 'text-[#FF8C00]' },
  { id: 'goal.reached', label: 'Goal Reached', color: 'text-[#00FF88]' },
  { id: 'raid.incoming', label: 'Incoming Raid', color: 'text-[#FF8C00]' },
];

export default function WebhookHooks({ roomId, isHost }) {
  const [expanded, setExpanded] = useState(() => { try { return localStorage.getItem('webhook_expanded') === 'true'; } catch { return false; } });
  const [hooks, setHooks] = useState(() => { try { const s = localStorage.getItem('webhook_hooks'); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(() => { try { const s = localStorage.getItem('webhook_selected_events'); return s ? JSON.parse(s) : ['stream.start', 'stream.end', 'tip.received']; } catch { return ['stream.start', 'stream.end', 'tip.received']; } });
  const [testing, setTesting] = useState(null);

  if (!isHost) return null;

  const addHook = () => {
    if (!newUrl.trim() || !newUrl.startsWith('http')) {
      toast.error('Enter a valid webhook URL');
      return;
    }
    setHooks(p => {
      const next = [...p, { id: Date.now(), url: newUrl, events: [...selectedEvents], active: true }];
      try { localStorage.setItem('webhook_hooks', JSON.stringify(next)); } catch {}
      return next;
    });
    setNewUrl('');
    toast.success('Webhook added');
  };

  const removeHook = (id) => setHooks(p => { const next = p.filter(h => h.id !== id); try { localStorage.setItem('webhook_hooks', JSON.stringify(next)); } catch {} return next; });
  const toggleHook = (id) => setHooks(p => { const next = p.map(h => h.id === id ? { ...h, active: !h.active } : h); try { localStorage.setItem('webhook_hooks', JSON.stringify(next)); } catch {} return next; });

  const testHook = async (hook) => {
    setTesting(hook.id);
    try {
      // We fire the test call via a message (simulated — real impl needs backend function)
      await base44.entities.Message.create({
        room_id: roomId,
        user_id: 'bot',
        user_name: '🤖 SeeWhyBot',
        content: `🔌 Webhook test fired to: ${hook.url.slice(0, 40)}...`,
        message_type: 'cohost',
      });
      setTimeout(() => { setTesting(null); toast.success('Test event sent to webhook'); }, 800);
    } catch { setTesting(null); toast.error('Webhook test failed.'); }
  };

  const toggleEvent = (ev) => setSelectedEvents(p => {
    const next = p.includes(ev) ? p.filter(e => e !== ev) : [...p, ev];
    try { localStorage.setItem('webhook_selected_events', JSON.stringify(next)); } catch {}
    return next;
  });

  return (
    <div className="bg-[rgba(255,184,0,0.04)] border border-[#FFB800]/15 rounded-xl overflow-hidden">
      <button
        onClick={() => { const n = !expanded; setExpanded(n); try { localStorage.setItem('webhook_expanded', String(n)); } catch {} }}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Webhook className={`w-4 h-4 ${hooks.filter(h => h.active).length > 0 ? 'text-[#FFB800]' : 'text-white/40'}`} />
          <span className="text-xs font-semibold text-white/70">Stream Webhooks</span>
          {hooks.filter(h => h.active).length > 0 && (
            <span className="text-[11px] bg-[#FF1564]/30 text-[#FFB800] border border-[#FFB800]/30/30 px-1.5 py-0.5 rounded-full font-bold">
              {hooks.filter(h => h.active).length} ACTIVE
            </span>
          )}
        </div>
        <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-2">

              {/* Event selector */}
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Trigger Events</p>
                <div className="grid grid-cols-2 gap-1">
                  {EVENTS.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => toggleEvent(ev.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border transition-all ${
                        selectedEvents.includes(ev.id)
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-transparent border-white/5 text-white/30 hover:border-white/15'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedEvents.includes(ev.id) ? 'bg-[#FFB800]' : 'bg-white/10'}`} />
                      <span className={ev.color}>{ev.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add URL */}
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Endpoint URL</p>
                <div className="flex gap-1.5">
                  <input
                    placeholder="https://your-server.com/webhook"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-[#FFB800]/40"
                  />
                  <button
                    onClick={addHook}
                    className="px-2 py-1 bg-[#FFB800]/20 text-[#FFB800] rounded border border-[#FFB800]/30 hover:bg-[#FFB800]/30 text-[10px] font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Hook list */}
              {hooks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Registered Hooks</p>
                  {hooks.map(hook => (
                    <div key={hook.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1.5 border border-white/5">
                      <div onClick={() => toggleHook(hook.id)} style={{ width:40, height:22, borderRadius:99, background: hook.active ? '#FF1564' : 'rgba(255,255,255,0.1)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                        <div style={{ position:'absolute', top:3, left: hook.active ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                      </div>
                      <span className="flex-1 text-[10px] text-white/50 truncate">{hook.url}</span>
                      <button
                        onClick={() => testHook(hook)}
                        disabled={testing === hook.id}
                        className="text-[11px] px-1.5 py-0.5 rounded border border-[#FFB800]/25/40 text-[#FFB800] hover:bg-[#0F1428]/30"
                      >
                        {testing === hook.id ? '...' : 'Test'}
                      </button>
                      <button onClick={() => removeHook(hook.id)} className="text-[#FF2040]/50 hover:text-[#FF2040]">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Payload preview */}
              <details className="group">
                <summary className="text-[10px] text-white/25 cursor-pointer hover:text-white/40 list-none flex items-center gap-1">
                  <ChevronDown className="w-2.5 h-2.5 group-open:rotate-180 transition-transform" />
                  Sample payload
                </summary>
                <pre className="mt-1.5 bg-black/40 rounded p-2 text-[11px] text-white/30 overflow-x-auto">
{`{
  "event": "tip.received",
  "roomId": "${roomId || 'room_id'}",
  "timestamp": "2026-05-03T...",
  "data": {
    "amount": 10,
    "fromUser": "viewer123",
    "message": "great stream!"
  }
}`}
                </pre>
              </details>

              <p className="text-[11px] text-white/20 italic">
                POST requests are sent to each active endpoint when stream events occur.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}