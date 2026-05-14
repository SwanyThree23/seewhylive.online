import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Send, Mic, MicOff, MessageSquare, ChevronDown, Sparkles, Volume2 } from 'lucide-react';
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

export default function ARIAWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [listening, setListening] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [pulse, setPulse] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const convRef = useRef(null);

  useEffect(() => {
    // Pulse the button after 4s to attract attention
    const t = setTimeout(() => setPulse(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current && messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
    if (!open || !convRef.current) return;
    const unsub = base44.agents.subscribeToConversation(convRef.current.id, (data) => {
      setMessages(data.messages || []);
      if (data.messages && data.messages.length > 0) setLoading(false);
    });
    return unsub;
  }, [open, conversation]);

  const openAndGreet = async () => {
    setOpen(true);
    setMinimized(false);
    setPulse(false);
    if (hasGreeted) return;
    setHasGreeted(true);
    setLoading(true);
    const conv = await initConversation();
    const unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages || []);
      if (data.messages && data.messages.length > 0) setLoading(false);
    });
    // Send greeting
    await base44.agents.addMessage(conv, {
      role: 'user',
      content: "Yo! I just got here and I want to know what SeeWhy LIVE is all about. Introduce yourself and break it down for me!",
    });
  };

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput('');
    setLoading(true);

    const conv = convRef.current || await initConversation();

    // Optimistically show user message
    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);

    await base44.agents.addMessage(conv, { role: 'user', content: trimmed });
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
                ? `0 0 0 0 ${G}60, 0 4px 24px rgba(139,92,246,0.5)`
                : '0 4px 20px rgba(139,92,246,0.35)',
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
              boxShadow: '0 8px 60px rgba(0,0,0,0.8), 0 0 40px rgba(139,92,246,0.15)',
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
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                    SwanyBot
                  </p>
                  <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Your SeeWhy Guide 🔥</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ChevronDown
                  className="w-4 h-4 transition-transform"
                  style={{ color: 'rgba(255,255,255,0.35)', transform: minimized ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
                <button
                  onClick={e => { e.stopPropagation(); setOpen(false); setMinimized(false); }}
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

                  {/* Empty state — quick prompts */}
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
                      <div className="grid grid-cols-2 gap-1.5">
                        {ARIA_PROMPTS.map(q => (
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
                      className="text-[9px] text-center mt-1.5"
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