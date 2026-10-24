import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Bot, ChevronDown, Plus, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const COMMANDS = [
  { trigger: '!uptime',   description: 'Stream uptime' },
  { trigger: '!host',     description: 'Who is hosting' },
  { trigger: '!social',   description: 'Social links' },
  { trigger: '!discord',  description: 'Discord invite' },
  { trigger: '!tip',      description: 'How to tip the creator' },
  { trigger: '!viewers',  description: 'Current viewer count' },
  { trigger: '!gifters',  description: 'Top gifters shoutout' },
  { trigger: '!today',    description: "Today's stream topic" },
  { trigger: '!clip',     description: 'How to clip moments' },
  { trigger: '!commands', description: 'List all commands' },
];

const BOT_NAME = '🤖 SeeWhyBot';
const MAX_LOG  = 5;

export default function StreamChatbot({ roomId, isHost, elapsedSeconds, hostName, room, viewerCount = 0, topGifters = [] }) {
  const [enabled, setEnabled]             = useState(false);
  const [expanded, setExpanded]           = useState(false);
  const [customCmd, setCustomCmd]         = useState('');
  const [customReply, setCustomReply]     = useState('');
  const [customCmds, setCustomCmds]       = useState([]);
  const [sentLog, setSentLog]             = useState([]);
  const [schedMsg, setSchedMsg]           = useState('');
  const [schedInterval, setSchedInterval] = useState(10);
  const [schedActive, setSchedActive]     = useState(false);
  const processedIds = useRef(new Set());
  const schedTimerRef = useRef(null);

  const sendBotMessage = useMutation({
    mutationFn: (content) =>
      base44.entities.Message.create({
        room_id: roomId,
        user_id: 'bot',
        user_name: BOT_NAME,
        content,
        message_type: 'cohost',
      }),
    onSuccess: (_, content) => {
      setSentLog(prev => [{ content, ts: new Date() }, ...prev].slice(0, MAX_LOG));
    },
    onError: () => toast.error('Failed to send bot message.'),
  });

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getAutoReply = (text, customList) => {
    const t = text.toLowerCase().trim();
    if (t === '!uptime')   return `⏱ Stream has been live for ${formatUptime(elapsedSeconds)}`;
    if (t === '!host')     return `👑 ${hostName || 'Unknown'} is your host today!`;
    if (t === '!social')   return `🔗 Follow on all platforms to stay connected!`;
    if (t === '!discord')  return `💬 Join our Discord community for more!`;
    if (t === '!tip')      return `💰 Show love by tipping! Tap the tip button or send a gift in the Gift Shop 🎁`;
    if (t === '!viewers')  return `👀 ${(viewerCount || 0).toLocaleString()} viewers watching right now!`;
    if (t === '!clip')     return `✂️ Hit the ✂ Clip button in the stream controls to save your favorite moments!`;
    if (t === '!today')    return room?.description
      ? `🎯 Today: ${room.description}`
      : `🎯 Today's stream: ${room?.title || 'hang out and vibe!'}`;
    if (t === '!gifters')  {
      const names = topGifters.slice(0, 3).map(g => g.sender_name || 'Anonymous').join(', ');
      return names
        ? `🎁 Top gifters today: ${names} — huge thank you! 👑`
        : `🎁 Be the first to send a gift and get a shoutout!`;
    }
    if (t === '!commands') return `📋 Commands: !uptime · !host · !social · !discord · !tip · !viewers · !gifters · !today · !clip + custom`;
    const custom = customList.find(c => t === c.trigger.toLowerCase());
    if (custom) return custom.reply;
    return null;
  };

  // Message subscriber
  useEffect(() => {
    if (!enabled || !roomId) return;
    const unsub = base44.entities.Message.subscribe(async (event) => {
      if (event.type !== 'create') return;
      if (event.data?.room_id !== roomId) return;
      if (event.data?.user_id === 'bot') return;
      if (processedIds.current.has(event.id)) return;
      processedIds.current.add(event.id);

      const content = event.data?.content || '';
      const reply = getAutoReply(content, customCmds);
      if (reply) {
        setTimeout(() => sendBotMessage.mutate(reply), 600);
        return;
      }

      // AI Q&A for questions
      if (content.endsWith('?') && content.length > 10) {
        try {
          const aiReply = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a helpful live stream chatbot named SeeWhyBot. A viewer asked: "${content}".
          Stream context: hosted by ${hostName}, room: "${room?.title}", category: ${room?.category}.
          Give a friendly, concise answer in 1-2 sentences. If you don't know, say so politely.`,
          });
          setTimeout(() => sendBotMessage.mutate(`💬 ${aiReply}`), 1000);
        } catch {}
      }
    });
    return unsub;
  }, [enabled, roomId, customCmds, elapsedSeconds, hostName, viewerCount, topGifters]);

  // Scheduled announcements
  useEffect(() => {
    if (schedTimerRef.current) clearInterval(schedTimerRef.current);
    if (!schedActive || !schedMsg.trim() || !enabled || !roomId) return;
    schedTimerRef.current = setInterval(() => {
      sendBotMessage.mutate(schedMsg.trim());
    }, schedInterval * 60 * 1000);
    return () => clearInterval(schedTimerRef.current);
  }, [schedActive, schedMsg, schedInterval, enabled, roomId]);

  if (!isHost) return null;

  return (
    <div className="bg-[rgba(212,175,55,0.05)] border border-[#d4af37]/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bot className={`w-4 h-4 ${enabled ? 'text-[#d4af37]' : 'text-white/40'}`} />
          <span className="text-xs font-semibold text-white/70">Stream Chatbot</span>
          {enabled && (
            <span className="text-[11px] text-[#6DBF7E] border border-green-600/30 px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(109,191,126,0.15)' }}>ACTIVE</span>
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
              {/* Enable toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/60">Enable Chatbot</span>
                <div onClick={() => setEnabled(!enabled)} style={{ width:40, height:22, borderRadius:99, background: enabled ? '#800020' : 'rgba(255,255,255,0.1)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:3, left: enabled ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                </div>
              </div>

              {/* Built-in commands */}
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Built-in Commands</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {COMMANDS.map(cmd => (
                    <div key={cmd.trigger} className="flex items-center gap-1.5 text-[10px]">
                      <code className="bg-white/10 rounded px-1 py-0.5 text-[#d4af37] font-mono shrink-0">{cmd.trigger}</code>
                      <span className="text-white/35 truncate">{cmd.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom command */}
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Custom Command</p>
                <div className="flex gap-1.5">
                  <input placeholder="!mycommand" value={customCmd} onChange={e => setCustomCmd(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-[#d4af37]/40" />
                  <input placeholder="Bot reply..." value={customReply} onChange={e => setCustomReply(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-[#d4af37]/40" />
                  <button
                    onClick={() => {
                      if (!customCmd || !customReply) return;
                      setCustomCmds(p => [...p, { trigger: customCmd, reply: customReply }]);
                      setCustomCmd(''); setCustomReply('');
                    }}
                    className="text-[10px] px-2 py-1 bg-[#d4af37]/20 text-[#d4af37] rounded border border-[#d4af37]/30 hover:bg-[#d4af37]/30 shrink-0">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {customCmds.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 mt-1 text-[10px]">
                    <code className="bg-white/10 rounded px-1.5 py-0.5 text-[#d4af37] font-mono">{c.trigger}</code>
                    <span className="text-white/40 flex-1 truncate">{c.reply}</span>
                    <button onClick={() => setCustomCmds(p => p.filter((_, j) => j !== i))} className="text-[#C0392B]/60 hover:text-[#C0392B]">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Scheduled announcements */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Scheduled Announcement</p>
                  <div onClick={() => setSchedActive(v => !v)} style={{ width:32, height:18, borderRadius:99, background: schedActive ? '#800020' : 'rgba(255,255,255,0.1)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:2, left: schedActive ? 16 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <input placeholder="Announcement text…" value={schedMsg} onChange={e => setSchedMsg(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white placeholder:text-white/20 outline-none" />
                  <select value={schedInterval} onChange={e => setSchedInterval(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white/70 outline-none">
                    {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n}m</option>)}
                  </select>
                </div>
              </div>

              {/* Sent log */}
              {sentLog.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Recent sends
                  </p>
                  <div className="space-y-0.5">
                    {sentLog.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] text-white/30">
                        <span className="font-mono shrink-0">{entry.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="truncate">{entry.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-white/25 italic">
                AI auto-answers viewer questions ending with "?"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
