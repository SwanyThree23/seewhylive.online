import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clampStr, LIMITS } from '@/lib/security';
import { Languages, ShieldAlert, Send, Rocket, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const LANG_OPTIONS = [
  { value: 'en', label: 'English',    flag: '🇺🇸' },
  { value: 'es', label: 'Español',    flag: '🇪🇸' },
  { value: 'fr', label: 'Français',   flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { value: 'pt', label: 'Português',  flag: '🇧🇷' },
  { value: 'ja', label: '日本語',      flag: '🇯🇵' },
];

const PLATFORM_ICONS = {
  twitch:   { label: 'Twitch',  color: '#9146ff', icon: '🟣' },
  youtube:  { label: 'YouTube', color: '#ff0000', icon: '🔴' },
  platform: { label: 'SeeWhy', color: '#d4af37',  icon: '⭐' },
};

// Heuristic toxic detection — before hitting the AI, catches obvious cases cheap
const TOXIC_RE = /\b(kill|die|idiot|stupid|hate|slur|n\*gger|f\*ggot|retard|cancer|kys|go die|moron|trash|garbage)\b/i;

function platCfg(p) { return PLATFORM_ICONS[p] || PLATFORM_ICONS.platform; }

// ── Moderation status badge ──────────────────────────────────────────────────
function ModBadge({ status, onAppeal, msgId, roomId }) {
  if (!status || status === 'safe') return null;
  const isFlagged = status === 'flagged';
  return (
    <span
      className={`ml-1 cursor-pointer ${isFlagged ? 'text-yellow-400' : 'text-red-400'}`}
      title={`${isFlagged ? 'Flagged for review' : status} — click to appeal`}
      onClick={() => onAppeal?.(msgId, roomId)}
    >
      {isFlagged ? <ShieldAlert className="w-3 h-3 inline" /> : <ShieldAlert className="w-3 h-3 inline" />}
    </span>
  );
}

export default function AggregatedChat({ roomId, currentUser, isHost, onMessagesChange }) {
  const qc = useQueryClient();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [translateEnabled, setTranslateEnabled] = useState(false);
  const [targetLang, setTargetLang] = useState('en');
  const [langSheetOpen, setLangSheetOpen] = useState(false);
  const [modMap, setModMap] = useState({});       // msgId → status string
  const [translationMap, setTranslationMap] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [appealingId, setAppealingId] = useState(null);
  const [boostMode, setBoostMode] = useState(false);
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [pinCountdown, setPinCountdown] = useState(0);
  const bottomRef = useRef(null);
  const translateTimerRef = useRef(null);

  // ── DB messages ─────────────────────────────────────────────────────────────
  const { data: dbMessages = [] } = useQuery({
    queryKey: ['room-messages', roomId],
    queryFn: () => base44.entities.Message.filter({ room_id: roomId }, '-created_date', 50).then(r => r.reverse()),
    enabled: !!roomId,
    refetchInterval: 5000,
  });

  // ── Merge DB + simulated platform messages ───────────────────────────────────
  useEffect(() => {
    const simulated = [
      { id: 'sim-1', user_name: 'TwitchUser99', content: 'Great stream! 🔥',      platform: 'twitch',  created_date: new Date(Date.now() - 60000).toISOString() },
      { id: 'sim-2', user_name: 'YTFan',        content: '¡Hola desde YouTube!', platform: 'youtube', created_date: new Date(Date.now() - 40000).toISOString() },
    ];
    const combined = [...simulated, ...dbMessages.map(m => ({ ...m, platform: 'platform' }))]
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    setMessages(combined);
    onMessagesChange?.(combined); // expose to parent for highlight detector
  }, [dbMessages]);

  // ── Real-time new messages ───────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      if (event.type === 'create') {
        const msg = { ...event.data, platform: 'platform' };
        setMessages(prev => {
          const next = [...prev, msg];
          onMessagesChange?.(next);
          return next;
        });
        // Auto-screen new incoming messages for toxicity
        autoModerateSingle(msg);
      }
    });
    return unsub;
  }, [roomId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── AUTO-MODERATION: screen new messages ────────────────────────────────────
  const autoModerateSingle = useCallback(async (msg) => {
    if (!msg?.content || msg.id?.startsWith('sim-')) return;
    // Fast heuristic first — no LLM call for obvious cases
    if (TOXIC_RE.test(msg.content)) {
      setModMap(prev => ({ ...prev, [msg.id]: 'flagged' }));
      // Persist moderation record
      base44.entities.ContentModeration.create({
        content_id: msg.id,
        content_type: 'message',
        content_text: msg.content,
        violation_type: 'flagged',
        reported_by: 'auto',
        status: 'pending',
        room_id: roomId,
      }).catch(() => {});
      return;
    }
    // Deeper AI check via LLM for borderline content
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Moderate this chat message strictly and briefly. Is it toxic, harassing, hate speech, or spam?
Message: "${msg.content}"
Return JSON: { "status": "safe" | "spam" | "harassment" | "hate_speech" | "inappropriate", "severity": 0-1 }`,
        response_json_schema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            severity: { type: 'number' },
          },
        },
      });
      if (result?.status && result.status !== 'safe' && result.severity > 0.6) {
        setModMap(prev => ({ ...prev, [msg.id]: result.status }));
        base44.entities.ContentModeration.create({
          content_id: msg.id,
          content_type: 'message',
          content_text: msg.content,
          violation_type: result.status,
          reported_by: 'ai_auto',
          status: 'pending',
          room_id: roomId,
        }).catch(() => {});
      }
    } catch {
      // Silently skip — moderation failing should not break chat
    }
  }, [roomId]);

  // ── AI APPEAL ────────────────────────────────────────────────────────────────
  const handleAppeal = useCallback(async (msgId, room_id) => {
    if (appealingId === msgId) return;
    setAppealingId(msgId);
    try {
      const result = await base44.functions.invoke('aiModerationAppeal', {
        message_id: msgId,
        flag_id: modMap[msgId] || 'unknown',
        appeal_reason: 'User-requested re-evaluation',
        room_id: room_id || roomId,
      });
      if (result?.data?.appeal_approved) {
        setModMap(prev => ({ ...prev, [msgId]: 'safe' }));
        toast.success('Appeal approved — message cleared ✅');
      } else {
        toast('Appeal denied — flag remains', { icon: '🛡' });
      }
    } catch {
      toast.error('Appeal failed');
    } finally {
      setAppealingId(null);
    }
  }, [appealingId, modMap, roomId]);

  // ── TRANSLATE ALL using translateText backend function ───────────────────────
  const translateAll = useCallback(async () => {
    const untranslated = messages.filter(m => !translationMap[m.id]).slice(0, LIMITS.TRANSLATE_BATCH);
    if (!untranslated.length) return;
    setIsTranslating(true);
    try {
      // Call each message through the translateText backend function (batched via Promise.allSettled)
      const results = await Promise.allSettled(
        untranslated.map(msg =>
          base44.functions.invoke('translateText', {
            text: msg.content,
            target_language: targetLang,
          }).then(r => ({ id: msg.id, translated: r.data?.translated_text || msg.content }))
        )
      );
      const newMap = { ...translationMap };
      results.forEach(r => {
        if (r.status === 'fulfilled') newMap[r.value.id] = r.value.translated;
      });
      setTranslationMap(newMap);
    } catch {
      toast.error('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  }, [messages, translationMap, targetLang]);

  // Debounced auto-translate when toggle is on
  useEffect(() => {
    if (!translateEnabled || messages.length === 0) return;
    clearTimeout(translateTimerRef.current);
    translateTimerRef.current = setTimeout(() => translateAll(), 800);
    return () => clearTimeout(translateTimerRef.current);
  }, [translateEnabled, messages.length, targetLang]);

  useEffect(() => {
    if (!pinnedMsg) return;
    const iv = setInterval(() => {
      const remaining = Math.max(0, Math.floor((pinnedMsg.expiresAt - Date.now()) / 1000));
      setPinCountdown(remaining);
      if (remaining === 0) {
        setPinnedMsg(null);
        clearInterval(iv);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [pinnedMsg]);

  // ── SEND (with optimistic update) ────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !currentUser) return;
    const content = clampStr(input.trim(), LIMITS.CHAT_MESSAGE);
    const isRocket = boostMode;
    setInput('');
    setBoostMode(false);

    // Optimistic: show the message instantly with a temp ID
    const tempId = `opt-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      room_id: roomId,
      user_id: currentUser.id,
      user_name: currentUser.full_name || currentUser.email,
      content,
      platform: 'platform',
      created_date: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => {
      const next = [...prev, optimisticMsg];
      onMessagesChange?.(next);
      return next;
    });

    if (isRocket) {
      setPinnedMsg({
        text: content,
        sender: currentUser?.full_name || currentUser?.email,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30000,
      });
      setPinCountdown(30);
      toast.success('🚀 RocketChat launched! Message pinned for 30s');
    }

    try {
      const msg = await base44.entities.Message.create({
        room_id: roomId,
        user_id: currentUser.id,
        user_name: currentUser.full_name || currentUser.email,
        content,
        type: 'text',
      });
      // Replace the optimistic entry with the real one
      if (msg) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...msg, platform: 'platform' } : m));
        autoModerateSingle({ ...msg, id: msg.id });
      }
    } catch {
      // Roll back optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error('Message failed to send');
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header toolbar */}
      <div className="shrink-0 px-3 py-2 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {Object.values(PLATFORM_ICONS).map(p => (
            <span key={p.label} className="text-xs opacity-60 hover:opacity-100 cursor-default" title={p.label}>
              {p.icon}
            </span>
          ))}
          <span className="text-[10px] text-white/30 ml-1">Aggregated</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Language picker — BottomSheet instead of <select> */}
          <button
            onClick={() => setLangSheetOpen(true)}
            className="flex items-center gap-1 h-6 px-2 rounded text-[10px] font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {LANG_OPTIONS.find(l => l.value === targetLang)?.flag}{' '}
            {targetLang.toUpperCase()}
            <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
          </button>
          <button
            onClick={() => { setTranslateEnabled(t => !t); if (!translateEnabled) translateAll(); }}
            disabled={isTranslating}
            style={{ height: 24, padding: '0 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: translateEnabled ? '#00d4ff' : 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <Languages className="w-3 h-3" />
            {isTranslating ? '…' : translateEnabled ? 'On' : 'Translate'}
          </button>
        </div>
      </div>

      {pinnedMsg && Date.now() < pinnedMsg.expiresAt && (
        <div style={{
          margin: '4px 8px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(255,21,100,0.1))',
          border: '1px solid rgba(212,175,55,0.4)',
          borderRadius: 12,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>🚀</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif' }}>{pinnedMsg.sender} </span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>{pinnedMsg.text}</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>{pinCountdown}s</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {messages.map(msg => {
          const p = platCfg(msg.platform);
          const modStatus = modMap[msg.id];
          const isViolation = modStatus && modStatus !== 'safe';
          const displayText = (translateEnabled && translationMap[msg.id]) ? translationMap[msg.id] : msg.content;
          const isAppealing = appealingId === msg.id;

          return (
            <div
              key={msg.id}
              className={`group flex gap-2 text-xs rounded-lg px-2 py-1.5 transition-all ${
                isViolation ? 'bg-red-900/20 border border-red-800/30 opacity-70' : 'hover:bg-white/3'
              }`}
            >
              <span title={p.label} className="shrink-0 mt-0.5">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-white/80 mr-1">{msg.user_name}</span>
                {isViolation && (
                  <span className="text-yellow-400 mr-1">
                    {isAppealing
                      ? <span className="text-[11px] text-white/30">reviewing…</span>
                      : <ShieldAlert
                          className="w-3 h-3 inline cursor-pointer hover:text-yellow-300"
                          title={`Flagged: ${modStatus} — click to appeal`}
                          onClick={() => handleAppeal(msg.id, roomId)}
                        />
                    }
                  </span>
                )}
                <span className="text-white/60 break-words leading-relaxed">
                  {isViolation ? (
                    <span className="italic text-white/30">[flagged: {modStatus}]</span>
                  ) : displayText}
                </span>
                {translateEnabled && translationMap[msg.id] && translationMap[msg.id] !== msg.content && (
                  <p className="text-[#00d4ff]/40 text-[10px] mt-0.5 italic">original: {msg.content}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 py-2 border-t border-white/10 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={boostMode ? 'RocketChat — pinned 30s (50 Love)…' : 'Send a message...'}
          maxLength={LIMITS.CHAT_MESSAGE}
          className="flex-1 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: boostMode ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: boostMode ? '0 0 12px rgba(212,175,55,0.5)' : 'none',
            transition: 'all 0.2s',
          }}
        />
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setBoostMode(v => !v)}
            title="RocketChat — pin your message for 30s (costs 50 Love)"
            style={{
              width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer',
              background: boostMode ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)',
              border: boostMode ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(255,255,255,0.1)',
              color: boostMode ? '#D4AF37' : 'rgba(255,255,255,0.4)',
            }}
          >
            <Rocket className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer', background: 'rgba(212,175,55,0.8)', color: '#000', border: 'none' }}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Language picker modal */}
      {langSheetOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0 }}
          onClick={() => setLangSheetOpen(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 480, background: 'rgba(13,6,24,0.98)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontWeight: 900, fontSize: 14, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>Translate to…</p>
            </div>
            <div style={{ padding: '8px 0' }}>
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTargetLang(opt.value);
                    setLangSheetOpen(false);
                    if (translateEnabled) setTimeout(translateAll, 100);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                    background: targetLang === opt.value ? 'rgba(212,175,55,0.12)' : 'transparent',
                    border: 'none', cursor: 'pointer', color: targetLang === opt.value ? '#D4AF37' : '#fff',
                    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: targetLang === opt.value ? 700 : 400,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{opt.flag}</span>
                  <span>{opt.label}</span>
                  {targetLang === opt.value && <span style={{ marginLeft: 'auto', color: '#D4AF37' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}