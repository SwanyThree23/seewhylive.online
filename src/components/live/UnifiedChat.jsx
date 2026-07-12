import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import NativeSelect from '@/components/shared/NativeSelect';
import {
  Send, Pin, Trash2, Ban, Reply, Smile, Sliders, ChevronDown, X
} from 'lucide-react';

const EMOJIS = ['😂','❤️','🔥','👏','😮','🎉','💯','🤩','😍','💪','🙏','👀','✨','🎶','😭','🤣','😊','🥳','💰','⭐'];

const MSG_STYLES = {
  regular: '',
  tip: 'border-l-2 border-[#d4af37] bg-[#d4af37]/8',
  subscription: 'border-l-2 border-[#7B5DA6] bg-[#7B5DA6]/20',
  moderation: 'border-l-2 border-red-600 bg-red-900/15',
  qa: 'border-l-2 border-blue-500 bg-blue-900/15',
  poll: 'border-l-2 border-green-500 bg-green-900/15',
  cohost: 'border-l-2 border-[#d4af37] bg-[#d4af37]/8',
};

function MessageBadge({ type }) {
  const badges = {
    tip: <span className="text-[11px] bg-[#d4af37] text-black px-1 py-0.5 rounded font-black">💰 TIP</span>,
    subscription: <span className="text-[11px] bg-[#7B5DA6] text-white px-1 py-0.5 rounded font-black">⭐ SUB</span>,
    moderation: <span className="text-[11px] bg-red-700 text-white px-1 py-0.5 rounded font-black">🚫 SYS</span>,
    qa: <span className="text-[11px] bg-blue-700 text-white px-1 py-0.5 rounded font-black">❓ Q&A</span>,
    poll: <span className="text-[11px] bg-green-700 text-white px-1 py-0.5 rounded font-black">📊 POLL</span>,
    cohost: <span className="text-[11px] bg-[#d4af37]/80 text-black px-1 py-0.5 rounded font-black">🤖 AI</span>,
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
  const textareaRef = useRef(null);
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
    onError: () => toast.error('Failed to send message.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.delete(id),
    onError: () => toast.error('Failed to delete message.'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-messages', roomId] }),
  });

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !currentUser) return;
    if (slowMode && Date.now() - lastSentAt < slowInterval * 1000) return;
    sendMutation.mutate({
      room_id: roomId,
      user_id: currentUser.id,
      user_name: currentUser.full_name || currentUser.email,
      content: replyTo ? `@${replyTo.user_name}: ${trimmed}` : trimmed,
      message_type: 'regular',
      reply_to_id: replyTo?.id,
    });
    setInput('');
    setReplyTo(null);
    setLastSentAt(Date.now());
    textareaRef.current?.focus();
  }, [input, currentUser, roomId, slowMode, slowInterval, lastSentAt, replyTo]);

  const clearChat = () => {
    if (window.confirm('Clear all chat messages?')) {
      messages.forEach(m => deleteMutation.mutate(m.id));
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'rgba(13,6,24,0.97)' }}>

      {/* Host controls toggle */}
      {isHost && (
        <div className="px-3 pt-2 pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setShowControls(!showControls)}
            className="flex items-center gap-1.5 text-[10px] transition-colors"
            style={{ color: showControls ? '#d4af37' : 'rgba(212,175,55,0.5)' }}>
            <Sliders className="w-3 h-3" /> Controls
            <ChevronDown className={`w-3 h-3 transition-transform ${showControls ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showControls && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/50">Slow Mode</span>
                    {slowMode && (
                      <NativeSelect value={slowInterval} onChange={val => setSlowInterval(Number(val))}
                        className="bg-white/5 border border-white/10 rounded text-[10px] text-white px-1 py-0.5"
                        options={[3,5,10,30].map(s => ({value: s, label: `${s}s`}))} />
                    )}
                  </div>
                  <div onClick={() => setSlowMode(!slowMode)} style={{ width:40, height:22, borderRadius:99, background: slowMode ? '#800020' : 'rgba(255,255,255,0.1)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:3, left: slowMode ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/50">Subs Only</span>
                  <div onClick={() => setSubOnly(!subOnly)} style={{ width:40, height:22, borderRadius:99, background: subOnly ? '#7B5DA6' : 'rgba(255,255,255,0.1)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:3, left: subOnly ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                  </div>
                </div>
                <button onClick={clearChat} className="w-full text-[10px] py-1.5 rounded-lg text-red-400 flex items-center justify-center gap-1"
                  style={{ border: '1px solid rgba(192,57,43,0.2)', background: 'rgba(192,57,43,0.05)' }}>
                  <Trash2 className="w-3 h-3" /> Clear Chat
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Pinned */}
      <AnimatePresence>
        {pinnedMsg && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="mx-3 my-1 px-3 py-2 rounded-xl flex items-start gap-2"
              style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Pin className="w-3 h-3 mt-0.5 shrink-0 text-[#d4af37]" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold mb-0.5" style={{ color: '#d4af37' }}>Pinned</p>
                <p className="text-xs text-white/75 line-clamp-2">{pinnedMsg.content}</p>
              </div>
              {isHost && (
                <button onClick={() => setPinnedMsg(null)} className="text-white/30 hover:text-white shrink-0">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages feed */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5"
        style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.12 }}
              className={`group px-2 py-1.5 rounded-lg ${MSG_STYLES[msg.message_type || 'regular']}`}>
              <div className="flex items-start gap-2">
                {/* Avatar dot */}
                <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black mt-0.5"
                  style={{ background: msg.user_id === currentUser?.id ? 'rgba(201,168,76,0.2)' : 'rgba(212,175,55,0.15)', color: msg.user_id === currentUser?.id ? '#C9A84C' : '#d4af37' }}>
                  {(msg.user_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[11px] font-bold ${msg.user_id === currentUser?.id ? 'text-[#C9A84C]' : 'text-[#d4af37]'}`}>
                      {msg.user_name}
                    </span>
                    <MessageBadge type={msg.message_type} />
                    {msg.message_type === 'tip' && msg.tip_amount && (
                      <span className="text-xs font-black text-[#d4af37]">${msg.tip_amount}</span>
                    )}
                  </div>
                  <p className="text-xs text-white/80 break-words leading-relaxed mt-0.5">{msg.content}</p>
                </div>
                {/* Touch-friendly action button */}
                <button onClick={() => setReplyTo(msg)}
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <Reply className="w-3 h-3 text-white/50" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="mx-3 mb-1 px-3 py-1.5 rounded-xl flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Reply className="w-3 h-3 text-white/40 shrink-0" />
              <p className="text-[10px] text-white/50 flex-1 truncate">
                Replying to <strong className="text-white/70">{replyTo.user_name}</strong>: {replyTo.content}
              </p>
              <button onClick={() => setReplyTo(null)} className="text-white/30 hover:text-white shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
            className="mx-3 mb-1 rounded-2xl p-3 grid grid-cols-5 gap-2 z-20"
            style={{ background: '#0d0618', border: '1px solid rgba(212,175,55,0.2)' }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => { setInput(prev => prev + e); setShowEmojiPicker(false); }}
                className="text-xl text-center py-1 rounded-lg active:scale-90 transition-transform hover:bg-white/5">
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input — keyboard-safe with safe-area padding */}
      <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex gap-2 items-end">
          {/* Emoji toggle */}
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90"
            style={{ background: showEmojiPicker ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Smile className="w-4 h-4" style={{ color: showEmojiPicker ? '#d4af37' : 'rgba(255,255,255,0.4)' }} />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 300))}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              rows={1}
              placeholder={replyTo ? `Reply to ${replyTo.user_name}...` : 'Say something...'}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none resize-none"
              style={{ minHeight: 40, maxHeight: 96, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, lineHeight: '1.4' }}
            />
          </div>

          <button onClick={sendMessage} disabled={!input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-30"
            style={{ background: input.trim() ? '#d4af37' : 'rgba(212,175,55,0.15)' }}>
            <Send className="w-4 h-4" style={{ color: input.trim() ? '#000' : '#d4af37' }} />
          </button>
        </div>

        {isHost && (
          <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <span>{msgPerMin} msg/min</span>
            <span>{activeChatters} chatters</span>
          </div>
        )}
      </div>
    </div>
  );
}