import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Bot, Power, Settings2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const COMMANDS = [
  { trigger: '!uptime', description: 'Show stream uptime' },
  { trigger: '!host', description: 'Who is hosting' },
  { trigger: '!social', description: 'Social links' },
  { trigger: '!discord', description: 'Discord invite' },
  { trigger: '!commands', description: 'List all commands' },
];

const BOT_NAME = '🤖 SeeWhyBot';

export default function StreamChatbot({ roomId, isHost, elapsedSeconds, hostName, room }) {
  const [enabled, setEnabled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [customCmd, setCustomCmd] = useState('');
  const [customReply, setCustomReply] = useState('');
  const [customCmds, setCustomCmds] = useState([]);
  const processedIds = useRef(new Set());

  const sendBotMessage = useMutation({
    mutationFn: (content) =>
      base44.entities.Message.create({
        room_id: roomId,
        user_id: 'bot',
        user_name: BOT_NAME,
        content,
        message_type: 'cohost',
      }),
    onError: () => toast.error('Failed to send bot message.'),
  });

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getAutoReply = (text, customList) => {
    const t = text.toLowerCase().trim();
    if (t === '!uptime') return `⏱ Stream has been live for ${formatUptime(elapsedSeconds)}`;
    if (t === '!host') return `👑 ${hostName || 'Unknown'} is your host today!`;
    if (t === '!social') return `🔗 Follow on all platforms to stay connected!`;
    if (t === '!discord') return `💬 Join our Discord community for more!`;
    if (t === '!commands') return `📋 Commands: !uptime · !host · !social · !discord · and custom commands. Ask a question ending with "?" for AI answers!`;
    // Q&A: if message ends with "?" use AI
    const custom = customList.find(c => t === c.trigger.toLowerCase());
    if (custom) return custom.reply;
    return null;
  };

  useEffect(() => {
    if (!enabled || !roomId) return;
    const unsub = base44.entities.Message.subscribe(async (event) => {
      if (event.type !== 'create') return;
      if (event.data?.room_id !== roomId) return;
      if (event.data?.user_id === 'bot') return;
      if (processedIds.current.has(event.id)) return;
      processedIds.current.add(event.id);

      const content = event.data?.content || '';
      // Handle built-in commands
      const reply = getAutoReply(content, customCmds);
      if (reply) {
        setTimeout(() => sendBotMessage.mutate(reply), 600);
        return;
      }

      // AI-powered Q&A for questions
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
  }, [enabled, roomId, customCmds, elapsedSeconds, hostName]);

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
            <span className="text-[11px] bg-[#4A9B5E]/30 text-[#6DBF7E] border border-[#6DBF7E]/35/30 px-1.5 py-0.5 rounded-full font-bold">ACTIVE</span>
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
                <div className="space-y-1">
                  {COMMANDS.map(cmd => (
                    <div key={cmd.trigger} className="flex items-center gap-2 text-[10px]">
                      <code className="bg-white/10 rounded px-1.5 py-0.5 text-[#d4af37] font-mono">{cmd.trigger}</code>
                      <span className="text-white/40">{cmd.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom command */}
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Custom Command</p>
                <div className="flex gap-1.5">
                  <input
                    placeholder="!mycommand"
                    value={customCmd}
                    onChange={e => setCustomCmd(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-[#d4af37]/40"
                  />
                  <input
                    placeholder="Bot reply..."
                    value={customReply}
                    onChange={e => setCustomReply(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-[#d4af37]/40"
                  />
                  <button
                    onClick={() => {
                      if (!customCmd || !customReply) return;
                      setCustomCmds(p => [...p, { trigger: customCmd, reply: customReply }]);
                      setCustomCmd(''); setCustomReply('');
                    }}
                    className="text-[10px] px-2 py-1 bg-[#d4af37]/20 text-[#d4af37] rounded border border-[#d4af37]/30 hover:bg-[#d4af37]/30"
                  >
                    Add
                  </button>
                </div>
                {customCmds.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 mt-1 text-[10px]">
                    <code className="bg-white/10 rounded px-1.5 py-0.5 text-[#d4af37] font-mono">{c.trigger}</code>
                    <span className="text-white/40 flex-1 truncate">{c.reply}</span>
                    <button onClick={() => setCustomCmds(p => p.filter((_, j) => j !== i))} className="text-[#C0392B]/60 hover:text-[#C0392B]">✕</button>
                  </div>
                ))}
              </div>

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
