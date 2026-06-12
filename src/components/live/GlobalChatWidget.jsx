import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Smile, Globe, ChevronDown, Minimize2 } from 'lucide-react';

const EMOJIS = ['😂','❤️','🔥','👏','😮','🎉','💯','🤩','🙏','💪','✨','🎶'];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
];

const GLOBAL_ROOM = 'global-chat';

export default function GlobalChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('en');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rawMessages = [] } = useQuery({
    queryKey: ['global-chat'],
    queryFn: () => base44.entities.Message.filter({ room_id: GLOBAL_ROOM }, 'created_date', 50),
    refetchInterval: open ? 8000 : false,
  });

  useEffect(() => { setMessages(rawMessages.slice(-100)); }, [rawMessages]);

  useEffect(() => {
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.room_id !== GLOBAL_ROOM) return;
      if (event.type === 'create') {
        setMessages(prev => [...prev.slice(-99), event.data]);
        if (!open) setUnread(u => u + 1);
      }
    });
    return unsub;
  }, [open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, messages]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
  });

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !user) return;

    let finalContent = trimmed;
    // Auto-translate non-English messages
    if (lang !== 'en') {
      setTranslating(true);
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `Translate the following message to English. Return ONLY the translation, nothing else.\n\nOriginal (${lang}): "${trimmed}"`,
        });
        finalContent = `${trimmed} [${res}]`;
      } catch {}
      setTranslating(false);
    }

    sendMutation.mutate({
      room_id: GLOBAL_ROOM,
      user_id: user.id,
      user_name: user.full_name || user.email,
      content: finalContent,
      message_type: 'regular',
      metadata: { lang },
    });
    setInput('');
    inputRef.current?.focus();
  }, [input, user, lang]);

  const translateMessage = async (msg) => {
    if (lang === 'en') return;
    setTranslating(true);
    try {
      const langLabel = LANGUAGES.find(l => l.code === lang)?.label || lang;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate the following message to ${langLabel}. Return ONLY the translation, no extra text.\n\nMessage: "${msg.content}"`,
      });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, translated: res } : m));
    } catch {}
    setTranslating(false);
  };

  const selectedLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <>
      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: 'spring' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setOpen(true); setMinimized(false); }}
        className="fixed bottom-32 left-4 z-40 w-13 h-13 flex items-center justify-center rounded-2xl shadow-xl md:bottom-10"
        style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #2C1810, #6B4423)', border: '1px solid rgba(212,175,55,0.35)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <MessageSquare className="w-5 h-5" style={{ color: '#d4af37' }} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black"
            style={{ background: '#CC7755', color: '#fff' }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 flex flex-col rounded-3xl overflow-hidden shadow-2xl"
            style={{
              bottom: minimized ? 'auto' : 80,
              top: minimized ? 'auto' : undefined,
              left: 12,
              right: 12,
              maxWidth: 440,
              margin: '0 auto',
              height: minimized ? 52 : 'min(520px, 70vh)',
              background: 'rgba(8,11,24,0.97)',
              border: '1px solid rgba(212,175,55,0.2)',
              backdropFilter: 'blur(20px)',
            }}>

            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(212,175,55,0.1)', background: 'rgba(28,18,12,0.8)' }}>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" style={{ color: '#d4af37' }} />
                <span className="font-black text-sm" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
                  GLOBAL CHAT
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5">
                {/* Language picker */}
                <div className="relative">
                  <button onClick={() => setShowLangPicker(!showLangPicker)}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold transition-all"
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>
                    <span>{selectedLang.flag}</span>
                    <span className="hidden sm:inline" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{selectedLang.code.toUpperCase()}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <AnimatePresence>
                    {showLangPicker && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute right-0 top-9 z-10 rounded-2xl overflow-hidden shadow-2xl"
                        style={{ background: 'rgba(8,11,24,0.99)', border: '1px solid rgba(212,175,55,0.2)', width: 180, maxHeight: 280, overflowY: 'auto' }}>
                        {LANGUAGES.map(l => (
                          <button key={l.code} onClick={() => { setLang(l.code); setShowLangPicker(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-all"
                            style={{ background: lang === l.code ? 'rgba(212,175,55,0.1)' : 'transparent', color: lang === l.code ? '#d4af37' : 'rgba(255,255,255,0.6)' }}>
                            <span className="text-base">{l.flag}</span>
                            <span>{l.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={() => setMinimized(!minimized)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <Minimize2 className="w-3.5 h-3.5 text-white/50" />
                </button>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <X className="w-3.5 h-3.5 text-white/50" />
                </button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1"
                  style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 py-10">
                      <Globe className="w-10 h-10 opacity-20" style={{ color: '#d4af37' }} />
                      <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        No messages yet.<br />Be the first to say hello! 👋
                      </p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMe = msg.user_id === user?.id;
                    const msgLang = msg.metadata?.lang;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black mt-1"
                          style={{ background: isMe ? 'rgba(201,168,76,0.2)' : 'rgba(212,175,55,0.15)', color: isMe ? '#C9A84C' : '#d4af37' }}>
                          {(msg.user_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                          <div className="flex items-center gap-1.5">
                            {msgLang && msgLang !== 'en' && (
                              <span className="text-[11px]">{LANGUAGES.find(l => l.code === msgLang)?.flag}</span>
                            )}
                            <span className="text-[10px] font-bold" style={{ color: isMe ? '#C9A84C' : '#d4af37' }}>
                              {msg.user_name}
                            </span>
                          </div>
                          <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed`}
                            style={{
                              background: isMe ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.07)',
                              border: isMe ? '1px solid rgba(201,168,76,0.2)' : '1px solid rgba(255,255,255,0.07)',
                              color: 'rgba(255,255,255,0.85)',
                            }}>
                            {msg.translated || msg.content}
                          </div>
                          {!isMe && lang !== 'en' && !msg.translated && (
                            <button onClick={() => translateMessage(msg)} disabled={translating}
                              className="text-[11px] px-1.5 py-0.5 rounded"
                              style={{ color: 'rgba(212,175,55,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                              {translating ? '…' : `Translate →${selectedLang.flag}`}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Emoji picker */}
                <AnimatePresence>
                  {showEmoji && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="px-3 pb-1 grid grid-cols-6 gap-1"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => { setInput(p => p + e); setShowEmoji(false); }}
                          className="text-xl py-1 rounded-xl text-center active:scale-90 transition-transform hover:bg-white/5">
                          {e}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input */}
                <div className="shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex gap-2 items-end">
                    <button onClick={() => setShowEmoji(!showEmoji)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: showEmoji ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Smile className="w-4 h-4" style={{ color: showEmoji ? '#d4af37' : 'rgba(255,255,255,0.4)' }} />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value.slice(0, 200))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
                        placeholder={`Chat in ${selectedLang.label}…`}
                        className="w-full rounded-xl px-3 h-10 text-sm text-white placeholder:text-white/25 outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14 }}
                      />
                    </div>
                    <button onClick={sendMessage} disabled={!input.trim() || translating}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-30"
                      style={{ background: input.trim() ? '#d4af37' : 'rgba(212,175,55,0.12)' }}>
                      <Send className="w-4 h-4" style={{ color: input.trim() ? '#000' : '#d4af37' }} />
                    </button>
                  </div>
                  <p className="text-[11px] mt-1 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {selectedLang.flag} Messages auto-translated • SeeWhy Global Chat
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}