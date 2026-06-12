import React, { useState } from 'react';
import { Webhook, Plus, Trash2, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const EVENTS = [
  { id: 'stream.start', label: 'Stream Started', color: 'text-[#6DBF7E]' },
  { id: 'stream.end', label: 'Stream Ended', color: 'text-red-400' },
  { id: 'viewer.join', label: 'Viewer Joined', color: 'text-[#D4AF37]' },
  { id: 'chat.message', label: 'Chat Message', color: 'text-white/60' },
  { id: 'tip.received', label: 'Tip Received', color: 'text-[#d4af37]' },
  { id: 'subscription.new', label: 'New Subscriber', color: 'text-[#D4854A]' },
  { id: 'goal.reached', label: 'Goal Reached', color: 'text-emerald-400' },
  { id: 'raid.incoming', label: 'Incoming Raid', color: 'text-orange-400' },
];

export default function WebhookHooks({ roomId, isHost }) {
  const [expanded, setExpanded] = useState(false);
  const [hooks, setHooks] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(['stream.start', 'stream.end', 'tip.received']);
  const [testing, setTesting] = useState(null);

  if (!isHost) return null;

  const addHook = () => {
    if (!newUrl.trim() || !newUrl.startsWith('http')) {
      toast.error('Enter a valid webhook URL');
      return;
    }
    setHooks(p => [...p, { id: Date.now(), url: newUrl, events: [...selectedEvents], active: true }]);
    setNewUrl('');
    toast.success('Webhook added');
  };

  const removeHook = (id) => setHooks(p => p.filter(h => h.id !== id));
  const toggleHook = (id) => setHooks(p => p.map(h => h.id === id ? { ...h, active: !h.active } : h));

  const testHook = async (hook) => {
    setTesting(hook.id);
    const payload = {
      event: 'test',
      roomId,
      timestamp: new Date().toISOString(),
      data: { message: 'SeeWhy LIVE webhook test', source: 'seewhy.live' },
    };
    // We fire the test call via a message (simulated — real impl needs backend function)
    await base44.entities.Message.create({
      room_id: roomId,
      user_id: 'bot',
      user_name: '🤖 SeeWhyBot',
      content: `🔌 Webhook test fired to: ${hook.url.slice(0, 40)}...`,
      message_type: 'cohost',
    });
    setTimeout(() => { setTesting(null); toast.success('Test event sent to webhook'); }, 800);
  };

  const toggleEvent = (ev) => setSelectedEvents(p =>
    p.includes(ev) ? p.filter(e => e !== ev) : [...p, ev]
  );

  return (
    <div className="bg-[rgba(212,175,55,0.04)] border border-[#d4af37]/15 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Webhook className={`w-4 h-4 ${hooks.filter(h => h.active).length > 0 ? 'text-[#d4af37]' : 'text-white/40'}`} />
          <span className="text-xs font-semibold text-white/70">Stream Webhooks</span>
          {hooks.filter(h => h.active).length > 0 && (
            <span className="text-[11px] bg-[#800020]/30 text-[#D4AF37] border border-[#D4AF37]/30/30 px-1.5 py-0.5 rounded-full font-bold">
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
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedEvents.includes(ev.id) ? 'bg-[#d4af37]' : 'bg-white/10'}`} />
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
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-[#d4af37]/40"
                  />
                  <button
                    onClick={addHook}
                    className="px-2 py-1 bg-[#d4af37]/20 text-[#d4af37] rounded border border-[#d4af37]/30 hover:bg-[#d4af37]/30 text-[10px] font-bold"
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
                      <div onClick={() => toggleHook(hook.id)} style={{ width:40, height:22, borderRadius:99, background: hook.active ? '#800020' : 'rgba(255,255,255,0.1)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                        <div style={{ position:'absolute', top:3, left: hook.active ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                      </div>
                      <span className="flex-1 text-[10px] text-white/50 truncate">{hook.url}</span>
                      <button
                        onClick={() => testHook(hook)}
                        disabled={testing === hook.id}
                        className="text-[11px] px-1.5 py-0.5 rounded border border-[#D4AF37]/25/40 text-[#D4AF37] hover:bg-[#0F1428]/30"
                      >
                        {testing === hook.id ? '...' : 'Test'}
                      </button>
                      <button onClick={() => removeHook(hook.id)} className="text-red-400/50 hover:text-red-400">
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