import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Send, Pin, Trash2, Ban, Flag, Reply, Smile, Sliders, ChevronDown, X, MessageSquare
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const EMOJIS = ['😂','❤️','🔥','👏','😮','🎉','💯','🤩','😍','💪','🙏','👀','✨','🎶','😭','🤣','😊','🥳','💰','⭐'];

const MSG_STYLES = {
  regular: '',
  tip: 'bg-[#d4af37]/15 border-l-4 border-[#d4af37]',
  subscription: 'bg-purple-900/30 border-l-4 border-purple-400',
  moderation: 'bg-red-900/20 border-l-4 border-red-600',
  qa: 'bg-blue-900/20 border-l-4 border-blue-500',
  poll: 'bg-green-900/20 border-l-4 border-green-500',
  cohost: 'bg-[#d4af37]/10 border-l-4 border-[#d4af37]',
};

function MessageBadge({ type }) {
  const badges = {
    tip: <Badge className="text-[9px] bg-[#d4af37] text-black px-1 py-0">💰 TIP</Badge>,
    subscription: <Badge className="text-[9px] bg-purple-700 text-white px-1 py-0">⭐ SUB</Badge>,
    moderation: <Badge className="text-[9px] bg-red-700 text-white px-1 py-0">🚫 SYS</Badge>,
    qa: <Badge className="text-[9px] bg-blue-700 text-white px-1 py-0">❓ Q&A</Badge>,
    poll: <Badge className="text-[9px] bg-green-700 text-white px-1 py-0">📊 POLL</Badge>,
    cohost: <Badge className="text-[9px] bg-[#d4af37]/80 text-black px-1 py-0">🤖 AI</Badge>,
  };
  return badges[type] || null;
}

export default function UnifiedChat({ roomId, currentUser, isHost }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [slowMode, setSlowMode] = useState(false);
  const [slowInterval, setSlowInterval] = useState(5);
  const [subOnly, setSubOnly] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [msgPerMin, setMsgPerMin] = useState(0);
  const [activeChatters, setActiveChatters] = useState(0);
  const [lastSentAt, setLastSentAt] = useState(0);
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  const { data: rawMessages = [] } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: () => base44.entities.Message.filter({ room_id: roomId }, 'created_date', 100),
    enabled: !!roomId,
  });

  useEffect(() => { setMessages(rawMessages.slice(-200)); }, [rawMessages]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      if (event.type === 'create') {
        setMessages(prev => [...prev.slice(-199), event.data]);
        const chatters = new Set([...messages.map(m => m.user_id), event.data.user_id]);
        setActiveChatters(chatters.size);
      } else if (event.type === 'delete') {
        setMessages(prev => prev.filter(m => m.id !== event.id));
      }
    });
    return unsub;
  }, [roomId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const recent = messages.filter(m => Date.now() - new Date(m.created_date).getTime() < 60000);
    setMsgPerMin(recent.length);
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.delete(id),
    onSuccess: () => qc.invalidateQueries(['chat-messages', roomId]),
  });

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !currentUser) return;
    if (slowMode && Date.now() - lastSentAt < slowInterval * 1000) return;

    const msg = {
      room_id: roomId,
      user_id: currentUser.id,
      user_name: currentUser.full_name || currentUser.email,
      content: replyTo ? `@${replyTo.user_name}: ${trimmed}` : trimmed,
      message_type: 'regular',
      reply_to_id: replyTo?.id,
    };
    sendMutation.mutate(msg);
    setInput('');
    setReplyTo(null);
    setLastSentAt(Date.now());
  }, [input, currentUser, roomId, slowMode, slowInterval, lastSentAt, replyTo]);

  const clearChat = () => {
    if (window.confirm('Clear all chat messages?')) {
      messages.forEach(m => deleteMutation.mutate(m.id));
    }
  };

  const sentiment = msgPerMin > 20 ? '😊' : msgPerMin > 10 ? '😐' : '😊';

  return (
    <div className="flex flex-col h-full bg-[rgba(13,6,24,0.95)]">
      {/* Host controls */}
      {isHost && (
        <div className="px-3 pt-2 pb-1 border-b border-white/5">
          <button
            onClick={() => setShowControls(!showControls)}
            className="flex items-center gap-1.5 text-[10px] text-[#d4af37]/70 hover:text-[#d4af37]"
          >
            <Sliders className="w-3 h-3" /> Chat Controls
            <ChevronDown className={`w-3 h-3 transition-transform ${showControls ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/60">Slow Mode</span>
                    {slowMode && (
                      <select
                        value={slowInterval} onChange={(e) => setSlowInterval(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded text-[10px] text-white px-1 py-0.5"
                      >
                        {[3,5,10,30].map(s => <option key={s} value={s} className="bg-[#0d0618]">{s}s</option>)}
                      </select>
                    )}
                  </div>
                  <Switch checked={slowMode} onCheckedChange={setSlowMode} className="scale-75 data-[state=checked]:bg-[#00d4ff]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/60">Subscribers Only</span>
                  <Switch checked={subOnly} onCheckedChange={setSubOnly} className="scale-75 data-[state=checked]:bg-purple-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={clearChat} className="flex-1 text-[10px] py-1 rounded border border-red-700/40 text-red-400 hover:bg-red-900/20 flex items-center justify-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                  <button className="flex-1 text-[10px] py-1 rounded border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 flex items-center justify-center gap-1">
                    Export Log
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Pinned message */}
      <AnimatePresence>
        {pinnedMsg && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-3 my-1 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg px-3 py-2 flex items-start gap-2">
              <Pin className="w-3 h-3 text-[#d4af37] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#d4af37] font-semibold">Pinned by host</p>
                <p className="text-xs text-white/80 line-clamp-2">{pinnedMsg.content}</p>
              </div>
              {isHost && (
                <button onClick={() => setPinnedMsg(null)} className="text-white/30 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={msg.message_type === 'cohost' ? { opacity: 0, x: -10, backgroundColor: 'rgba(212,175,55,0.2)' } : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, x: 0, y: 0, backgroundColor: 'transparent' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className={`group px-2 py-1.5 rounded-lg ${MSG_STYLES[msg.message_type || 'regular']} hover:bg-white/5`}
            >
              <div className="flex items-start gap-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-bold ${msg.user_id === currentUser?.id ? 'text-[#00d4ff]' : 'text-[#d4af37]'}`}>
                      {msg.user_name}
                    </span>
                    <MessageBadge type={msg.message_type} />
                    {msg.message_type === 'tip' && msg.tip_amount && (
                      <span className="text-sm font-bold text-[#d4af37]">${msg.tip_amount}</span>
                    )}
                  </div>
                  <p className="text-xs text-white/80 break-words leading-relaxed">{msg.content}</p>
                </div>

                {/* Hover actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                  <button onClick={() => setReplyTo(msg)} title="Reply"
                    className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white">
                    <Reply className="w-3 h-3" />
                  </button>
                  {isHost && (
                    <>
                      <button onClick={() => setPinnedMsg(msg)} title="Pin"
                        className="w-5 h-5 rounded hover:bg-[#d4af37]/20 flex items-center justify-center text-white/40 hover:text-[#d4af37]">
                        <Pin className="w-3 h-3" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(msg.id)} title="Delete"
                        className="w-5 h-5 rounded hover:bg-red-900/30 flex items-center justify-center text-white/40 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button title="Ban"
                        className="w-5 h-5 rounded hover:bg-red-900/30 flex items-center justify-center text-white/40 hover:text-red-400">
                        <Ban className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden mx-3 mb-1"
          >
            <div className="bg-white/5 border border-white/10 rounded px-2 py-1 flex items-center gap-2">
              <Reply className="w-3 h-3 text-white/40" />
              <p className="text-[10px] text-white/60 flex-1 truncate">Replying to <strong>{replyTo.user_name}</strong>: {replyTo.content}</p>
              <button onClick={() => setReplyTo(null)} className="text-white/30 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-16 left-3 right-3 bg-[#0d0618] border border-[#d4af37]/20 rounded-xl p-3 z-20 grid grid-cols-5 gap-2"
          >
            {EMOJIS.map(e => (
              <button key={e} onClick={() => { setInput(prev => prev + e); setShowEmojiPicker(false); }}
                className="text-xl hover:scale-125 transition-transform text-center">{e}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="px-3 pb-3 pt-1 border-t border-white/5">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 300))}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              rows={1}
              placeholder="Chat..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#d4af37]/40 resize-none"
              style={{ minHeight: '36px', maxHeight: '80px' }}
            />
            <div className="absolute bottom-1 right-2 flex items-center gap-1.5">
              <span className="text-[9px] text-white/20">{input.length}/300</span>
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-white/30 hover:text-[#d4af37]">
                <Smile className="w-3 h-3" />
              </button>
            </div>
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="h-9 w-9 rounded-lg bg-[#d4af37] hover:bg-[#f5e6a3] disabled:opacity-30 flex items-center justify-center transition-all"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Stats bar (host only) */}
        {isHost && (
          <div className="flex items-center gap-3 mt-1.5 text-[9px] text-white/30">
            <span>{msgPerMin} msg/min</span>
            <span>{activeChatters} chatters</span>
            <span>{sentiment} sentiment</span>
          </div>
        )}
      </div>
    </div>
  );
}