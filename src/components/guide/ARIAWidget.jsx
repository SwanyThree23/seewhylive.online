import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Send, Mic, MicOff, MessageSquare, ChevronDown, Sparkles, Volume2, Clock, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const G = '#D4AF37';
const BG = '#0A0710';
const PANEL = '#0F0B1A';
const BORDER = 'rgba(212,175,55,0.18)';
const CREAM = '#F5F0E8';

const ARIA_PROMPTS = [
  'How do I go live? 🎙',
  'What are PK Battles? ⚔️',
  'How do tips work? 💸',
  'Explain Aura AI co-host 🤖',
  'How do I earn loyalty points? 🏆',
  'What is a Watch Party? 👀',
  'Help me stack that bag 💰',
  'How do I create a community? 🌍',
];

const getQuickPrompts = (prefs) => {
  const basePrompts = ARIA_PROMPTS;
  const personalized = [];
  
  // Add personalized prompts based on preferences
  prefs?.forEach(pref => {
    if (pref.preference_type === 'favorite_topic') {
      personalized.push(`🌟 Tell me more about ${pref.preference_value}`);
    }
  });
  
  return [...personalized, ...basePrompts].slice(0, 8);
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: G }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

export default function SwanyBotWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [listening, setListening] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const convRef = useRef(null);
  // Keep synthRef as alias for convenience in handlers
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch user preferences
  const { data: userPreferences } = useQuery({
    queryKey: ['swanyBotPreferences', user?.id],
    queryFn: () => user ? base44.entities.SwanyBotPreference.filter({ user_id: user.id }) : Promise.resolve([]),
    enabled: !!user,
  });

  // Fetch conversation history
  const { data: conversationHistory } = useQuery({
    queryKey: ['swanyBotHistory', user?.id],
    queryFn: () => user ? base44.entities.SwanyBotConversation.filter({ user_id: user.id }, '-last_interaction', 5) : Promise.resolve([]),
    enabled: !!user,
  });

  // Save preferences
  const savePreferenceMutation = useMutation({
    mutationFn: async (pref) => {
      if (!user) return;
      const existing = userPreferences?.find(p => p.preference_type === pref.preference_type);
      if (existing) {
        await base44.entities.SwanyBotPreference.update(existing.id, { preference_value: pref.preference_value });
      } else {
        await base44.entities.SwanyBotPreference.create({
          user_id: user.id,
          ...pref,
          created_at: new Date().toISOString(),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['swanyBotPreferences', user?.id] });
    },
  });

  // Save conversation
  const saveConversationMutation = useMutation({
    mutationFn: async (convData) => {
      if (!user || !convRef.current) return;
      const existing = conversationHistory?.find(c => c.conversation_id === convRef.current.id);
      if (existing) {
        await base44.entities.SwanyBotConversation.update(existing.id, {
          message_count: convData.message_count,
          last_message: convData.last_message,
          last_interaction: new Date().toISOString(),
        });
      } else {
        await base44.entities.SwanyBotConversation.create({
          user_id: user.id,
          conversation_id: convRef.current.id,
          ...convData,
          last_interaction: new Date().toISOString(),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['swanyBotHistory', user?.id] });
    },
  });

  useEffect(() => {
    // Auto-welcome on first visit
    const hasSeenWelcome = localStorage.getItem('seewhy_aria_welcomed');
    if (!hasSeenWelcome) {
      const t = setTimeout(() => {
        openAndGreet();
        localStorage.setItem('seewhy_aria_welcomed', 'true');
      }, 2000);
      return () => clearTimeout(t);
    } else {
      // Pulse the button after 4s to attract attention
      const t = setTimeout(() => setPulse(true), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
     if (messages.length > 0) {
       messagesEndRef.current && messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });

       // Read out the last assistant message (always speak unless audio disabled)
       const lastMessage = messages[messages.length - 1];
       if (audioEnabled && lastMessage.role === 'assistant' && lastMessage.content) {
         setTimeout(() => speakMessage(lastMessage.content), 300);
       }
     }
   }, [messages, audioEnabled]);

  const speakMessage = useCallback((text) => {
    if (!audioEnabled || !text) return;
    if (!window.speechSynthesis) return;

    // Strip markdown for cleaner speech
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`[^`]*`/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 1200); // allow full scripted responses (most browsers support up to ~5000 chars)

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      // Pick best available voice — prefer a natural US English voice
      const preferred = voices.find(v =>
        v.name.includes('Google US English') ||
        v.name.includes('Samantha') ||
        v.name.includes('Alex') ||
        (v.lang === 'en-US' && v.localService)
      ) || voices.find(v => v.lang?.startsWith('en')) || voices[0];

      if (preferred) utterance.voice = preferred;

      // Chrome long-speech bug fix — keep synthesis alive
      let resumeTimer;
      utterance.onstart = () => {
        resumeTimer = setInterval(() => {
          if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        }, 5000);
      };
      utterance.onend = () => clearInterval(resumeTimer);
      utterance.onerror = () => clearInterval(resumeTimer);

      window.speechSynthesis.speak(utterance);
    };

    // If voices aren't loaded yet (common on first load), wait for them
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    }
  }, [audioEnabled]);

  const initConversation = useCallback(async () => {
    if (convRef.current) return convRef.current;
    const conv = await base44.agents.createConversation({
      agent_name: 'seewhy_guide',
      metadata: { name: 'SwanyBot Session' },
    });
    convRef.current = conv;
    setConversation(conv);
    return conv;
  }, []);

  useEffect(() => {
    if (!open || !conversation) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      if (data.messages) {
        setMessages(data.messages);
        if (data.messages.length > 0) setLoading(false);
      }
    });
    // Fallback: clear loading after 15s if no response arrives
    const timeout = setTimeout(() => {
      setLoading(false);
      setMessages(prev =>
        prev.length === 0
          ? [{ role: 'assistant', content: "Hey! I'm SwanyBot 👑 — your SeeWhy LIVE guide. Ask me anything about the platform, rooms, battles, or watch parties!" }]
          : prev
      );
    }, 15000);
    return () => { unsub?.(); clearTimeout(timeout); };
  }, [open, conversation]);

  const openAndGreet = useCallback(async () => {
    setOpen(true);
    setMinimized(false);
    setPulse(false);
    if (convRef.current) {
      setConversation(convRef.current);
      return;
    }
    if (hasGreeted) return;
    setHasGreeted(true);
    setLoading(true);
    try {
      const conv = await initConversation();
      setConversation(conv);
      // Send greeting
      await base44.agents.addMessage(conv, {
        role: 'user',
        content: "Yo! I just got here and I want to know what See - Why - LIVE is all about. Introduce yourself and break it down for me!",
      });
    } catch {
      setLoading(false);
      setMessages([{ role: 'assistant', content: "Hey! I'm SwanyBot 👑 — your SeeWhy LIVE guide. Sign in to unlock my full AI features, or just ask me anything!" }]);
    }
  }, [hasGreeted, initConversation]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput('');
    setLoading(true);

    try {
      const conv = convRef.current || await initConversation();

      // Optimistically show user message
      setMessages(prev => [...prev, { role: 'user', content: trimmed }]);

      await base44.agents.addMessage(conv, { role: 'user', content: trimmed });
    } catch {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't connect right now. Sign in for the full SwanyBot experience!" }]);
      return;
    }

    // Auto-save conversation
    if (messages.length > 0) {
      saveConversationMutation.mutate({
        title: messages[0]?.content?.substring(0, 50) || 'Chat',
        message_count: messages.length + 1,
        last_message: trimmed,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Voice input via Web Speech API
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (listening) {
      recognitionRef.current && recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setInput(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        sendMessage(transcript);
      }
    };

    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const quickAsk = (q) => sendMessage(q);

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 0.5, type: 'spring', bounce: 0.5 }}
            onClick={openAndGreet}
            className="fixed bottom-36 left-4 z-40 w-14 h-14 rounded-2xl flex items-center justify-center md:bottom-20 md:left-6"
            style={{
              background: 'linear-gradient(135deg, #1a0d2e 0%, #2d1b6b 50%, #1a0d2e 100%)',
              border: `1px solid ${G}40`,
              boxShadow: pulse
                ? `0 0 0 0 ${G}60, 0 4px 24px rgba(212,175,55,0.5)`
                : '0 4px 20px rgba(212,175,55,0.35)',
            }}
          >
            {pulse && (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{ boxShadow: [`0 0 0 0px ${G}80`, `0 0 0 10px ${G}00`] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            )}
            <Sparkles className="w-6 h-6" style={{ color: G }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed bottom-4 left-2 right-2 z-50 rounded-2xl flex flex-col overflow-hidden md:left-auto md:right-6 md:w-[380px]"
            style={{
              background: BG,
              border: `1px solid ${BORDER}`,
              boxShadow: '0 8px 60px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.15)',
              maxHeight: minimized ? '56px' : '520px',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0 cursor-pointer select-none"
              style={{ borderBottom: minimized ? 'none' : `1px solid ${BORDER}`, background: PANEL }}
              onClick={() => setMinimized(v => !v)}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2d1b6b, #6B4423)', border: `1px solid ${G}30` }}>
                  <Sparkles className="w-4 h-4" style={{ color: G }} />
                  {audioEnabled && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                    SwanyBot
                  </p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Your SeeWhy Guide 🔥</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setAudioEnabled(!audioEnabled);
                    if (audioEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
                  title={audioEnabled ? 'Mute SwanyBot' : 'Unmute SwanyBot'}
                >
                  <Volume2 className="w-3.5 h-3.5" style={{ color: audioEnabled ? G : 'rgba(255,255,255,0.2)' }} />
                </button>
                <ChevronDown
                  className="w-4 h-4 transition-transform"
                  style={{ color: 'rgba(255,255,255,0.35)', transform: minimized ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
                <button
                  onClick={e => { e.stopPropagation(); setOpen(false); setMinimized(false); if (window.speechSynthesis) window.speechSynthesis.cancel(); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.35)' }} />
                </button>
              </div>
            </div>

            {/* Body */}
            {!minimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 0 }}>

                  {/* Empty state — history + quick prompts */}
                   {messages.length === 0 && !loading && (
                     <div className="space-y-3">
                       <div className="text-center pt-4 pb-2">
                         <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                           style={{ background: 'linear-gradient(135deg, #2d1b6b, #6B4423)' }}>
                           <Sparkles className="w-6 h-6" style={{ color: G }} />
                         </div>
                         <p className="font-black text-sm uppercase tracking-wider" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                           SwanyBot in the Building 👑
                         </p>
                         <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                           Your guide, your hype man — ask me anything!
                         </p>
                       </div>

                       {/* History quick access */}
                       {conversationHistory && conversationHistory.length > 0 && (
                         <div>
                           <button
                             onClick={() => setShowHistory(!showHistory)}
                             className="w-full flex items-center gap-2 text-xs font-bold px-2 py-1.5 rounded-lg"
                             style={{ background: `${G}18`, color: G, fontFamily: 'Barlow Condensed, sans-serif' }}
                           >
                             <Clock className="w-3 h-3" /> History ({conversationHistory.length})
                           </button>
                           {showHistory && (
                             <div className="space-y-1 mt-2">
                               {conversationHistory.slice(0, 3).map(conv => (
                                 <div key={conv.id} className="text-xs p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                   <p className="text-white/70 truncate">{conv.title}</p>
                                   <p className="text-white/30 text-[11px] mt-0.5">
                                     {new Date(conv.last_interaction).toLocaleDateString()}
                                   </p>
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>
                       )}

                       <div className="grid grid-cols-2 gap-1.5">
                         {getQuickPrompts(userPreferences).map(q => (
                           <button key={q} onClick={() => quickAsk(q)}
                             className="text-left px-2.5 py-2 rounded-lg text-[10px] font-bold transition-all active:scale-95 leading-tight"
                             style={{
                               background: 'rgba(212,175,55,0.06)',
                               border: `1px solid ${G}18`,
                               color: 'rgba(255,255,255,0.5)',
                               fontFamily: 'Barlow Condensed, sans-serif'
                             }}>
                             {q}
                           </button>
                         ))}
                       </div>
                     </div>
                   )}

                  {/* Messages */}
                  {messages.filter(m => m.role === 'user' || m.role === 'assistant').map((msg, i) => {
                    const isUser = msg.role === 'user';
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}
                      >
                        {!isUser && (
                          <div className="w-6 h-6 rounded-lg shrink-0 mt-0.5 flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #2d1b6b, #6B4423)', border: `1px solid ${G}20` }}>
                            <Sparkles className="w-3 h-3" style={{ color: G }} />
                          </div>
                        )}
                        <div
                          className="max-w-[82%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed"
                          style={isUser
                            ? { background: 'rgba(212,175,55,0.12)', border: `1px solid ${G}25`, color: CREAM }
                            : { background: PANEL, border: `1px solid rgba(255,255,255,0.07)`, color: 'rgba(255,255,255,0.8)' }
                          }
                        >
                          {isUser ? msg.content : (
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="ml-3 list-disc space-y-0.5">{children}</ul>,
                                li: ({ children }) => <li>{children}</li>,
                                strong: ({ children }) => <strong style={{ color: G }}>{children}</strong>,
                                a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" style={{ color: G, textDecoration: 'underline' }}>{children}</a>,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {loading && (
                    <div className="flex justify-start gap-2">
                      <div className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #2d1b6b, #6B4423)', border: `1px solid ${G}20` }}>
                        <Sparkles className="w-3 h-3" style={{ color: G }} />
                      </div>
                      <div className="rounded-2xl" style={{ background: PANEL, border: '1px solid rgba(255,255,255,0.07)' }}>
                        <TypingDots />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="shrink-0 px-3 py-2.5" style={{ borderTop: `1px solid ${BORDER}`, background: PANEL }}>
                  <div className="flex items-center gap-2">
                    {/* Voice button */}
                    <button
                      onClick={toggleVoice}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90"
                      style={{
                        background: listening ? 'rgba(239,68,68,0.2)' : 'rgba(212,175,55,0.08)',
                        border: `1px solid ${listening ? 'rgba(239,68,68,0.4)' : G + '20'}`,
                        boxShadow: listening ? '0 0 12px rgba(239,68,68,0.4)' : 'none'
                      }}
                      title={listening ? 'Stop listening' : 'Speak your question'}
                    >
                      {listening
                        ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}>
                            <Mic className="w-3.5 h-3.5 text-red-400" />
                          </motion.div>
                        : <Mic className="w-3.5 h-3.5" style={{ color: G }} />
                      }
                    </button>

                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={listening ? '🎙 Listening…' : 'Ask SwanyBot anything…'}
                      className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-white/25 min-w-0"
                      style={{ color: CREAM }}
                    />

                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || loading}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-30"
                      style={{ background: input.trim() ? G : 'rgba(212,175,55,0.15)', border: `1px solid ${G}30` }}
                    >
                      <Send className="w-3.5 h-3.5" style={{ color: input.trim() ? '#000' : G }} />
                    </button>
                  </div>

                  {listening && (
                    <motion.p
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-[11px] text-center mt-1.5"
                      style={{ color: 'rgba(239,68,68,0.7)' }}
                    >
                      🔴 Voice active — speak now, or tap mic to stop
                    </motion.p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}