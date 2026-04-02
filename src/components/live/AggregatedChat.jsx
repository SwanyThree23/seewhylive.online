import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Globe, Languages, Shield, ShieldAlert, ShieldCheck, Send, Twitch, Youtube, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORM_ICONS = {
  twitch: { label: 'Twitch', color: '#9146ff', icon: '🟣' },
  youtube: { label: 'YouTube', color: '#ff0000', icon: '🔴' },
  platform: { label: 'SeeWhy', color: '#d4af37', icon: '⭐' },
};

const MOD_ICONS = {
  safe: { icon: ShieldCheck, color: 'text-green-400', label: 'Safe' },
  spam: { icon: ShieldAlert, color: 'text-yellow-400', label: 'Spam' },
  harassment: { icon: ShieldAlert, color: 'text-red-400', label: 'Harassment' },
  hate_speech: { icon: ShieldAlert, color: 'text-red-500', label: 'Hate' },
  inappropriate: { icon: ShieldAlert, color: 'text-orange-400', label: 'NSFW' },
};

function ModerationBadge({ status }) {
  if (!status || status === 'safe') return null;
  const cfg = MOD_ICONS[status] || MOD_ICONS.inappropriate;
  const Icon = cfg.icon;
  return (
    <span className={`${cfg.color} ml-1`} title={cfg.label}>
      <Icon className="w-3 h-3 inline" />
    </span>
  );
}

export default function AggregatedChat({ roomId, currentUser, isHost }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [translateEnabled, setTranslateEnabled] = useState(false);
  const [targetLang, setTargetLang] = useState('en');
  const [modMap, setModMap] = useState({});
  const [translationMap, setTranslationMap] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const bottomRef = useRef(null);

  // Fetch real messages from the DB
  const { data: dbMessages = [] } = useQuery({
    queryKey: ['room-messages', roomId],
    queryFn: () => base44.entities.Message.filter({ room_id: roomId }, '-created_date', 50).then(r => r.reverse()),
    enabled: !!roomId,
    refetchInterval: 5000,
  });

  // Fetch moderation records for messages
  const { data: moderations = [] } = useQuery({
    queryKey: ['chat-moderations'],
    queryFn: () => base44.entities.ContentModeration.filter({ content_type: 'message' }, '-created_date', 100),
    refetchInterval: 10000,
  });

  useEffect(() => {
    const map = {};
    moderations.forEach(m => { map[m.content_id] = m.violation_type; });
    setModMap(map);
  }, [moderations]);

  useEffect(() => {
    // Merge real messages + simulated platform messages
    const simulated = [
      { id: 'sim-1', user_name: 'TwitchUser99', content: 'Great stream! 🔥', platform: 'twitch', created_date: new Date(Date.now() - 60000).toISOString() },
      { id: 'sim-2', user_name: 'YTFan', content: '¡Hola desde YouTube!', platform: 'youtube', created_date: new Date(Date.now() - 40000).toISOString() },
    ];
    const combined = [...simulated, ...dbMessages.map(m => ({ ...m, platform: 'platform' }))]
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    setMessages(combined);
  }, [dbMessages]);

  useEffect(() => {
    // Subscribe to real-time messages
    if (!roomId) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      if (event.type === 'create') {
        setMessages(prev => [...prev, { ...event.data, platform: 'platform' }]);
      }
    });
    return unsub;
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !currentUser) return;
    const content = input.trim();
    setInput('');
    await base44.entities.Message.create({
      room_id: roomId,
      user_id: currentUser.id,
      user_name: currentUser.full_name || currentUser.email,
      content,
      type: 'text',
    });
  };

  const translateAll = async () => {
    const untranslated = messages.filter(m => !translationMap[m.id]);
    if (untranslated.length === 0) return;
    setIsTranslating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate these chat messages to ${targetLang === 'en' ? 'English' : targetLang === 'es' ? 'Spanish' : targetLang === 'fr' ? 'French' : targetLang === 'de' ? 'German' : targetLang === 'pt' ? 'Portuguese' : targetLang}.
Return a JSON object with "translations" array, each item: { "id": string, "translated": string }.
Only translate if the message is not already in the target language. If already in the target language, return original text.

Messages:
${untranslated.map(m => `ID: ${m.id} | "${m.content}"`).join('\n')}`,
        response_json_schema: {
          type: 'object',
          properties: {
            translations: {
              type: 'array',
              items: { type: 'object', properties: { id: { type: 'string' }, translated: { type: 'string' } } }
            }
          }
        }
      });
      const map = { ...translationMap };
      (result?.translations || []).forEach(t => { map[t.id] = t.translated; });
      setTranslationMap(map);
    } catch {
      toast.error('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (translateEnabled && messages.length > 0) translateAll();
  }, [translateEnabled, messages.length]);

  const platCfg = (p) => PLATFORM_ICONS[p] || PLATFORM_ICONS.platform;

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
        <div className="flex items-center gap-2">
          <select
            value={targetLang}
            onChange={e => setTargetLang(e.target.value)}
            className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/60"
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
            <option value="de">DE</option>
            <option value="pt">PT</option>
            <option value="ja">JA</option>
          </select>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTranslateEnabled(t => !t)}
            className={`h-6 text-[10px] gap-1 px-2 ${translateEnabled ? 'text-[#00d4ff]' : 'text-white/40'}`}
            disabled={isTranslating}
          >
            <Languages className="w-3 h-3" />
            {isTranslating ? '...' : translateEnabled ? 'On' : 'Translate'}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {messages.map(msg => {
          const p = platCfg(msg.platform);
          const modStatus = modMap[msg.id];
          const displayText = (translateEnabled && translationMap[msg.id]) ? translationMap[msg.id] : msg.content;
          const isViolation = modStatus && modStatus !== 'safe';

          return (
            <div
              key={msg.id}
              className={`group flex gap-2 text-xs rounded-lg px-2 py-1.5 transition-all ${
                isViolation ? 'bg-red-900/20 border border-red-800/30' : 'hover:bg-white/3'
              }`}
            >
              <span title={p.label} className="shrink-0 mt-0.5">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-white/80 mr-1.5">{msg.user_name}</span>
                {isHost && <ModerationBadge status={modStatus} />}
                <p className="text-white/60 break-words leading-relaxed inline">
                  {displayText}
                </p>
                {translateEnabled && translationMap[msg.id] && translationMap[msg.id] !== msg.content && (
                  <p className="text-[#00d4ff]/50 text-[10px] mt-0.5 italic">original: {msg.content}</p>
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
          placeholder="Send a message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37]/50"
        />
        <Button
          size="sm"
          onClick={sendMessage}
          disabled={!input.trim()}
          className="h-8 w-8 p-0 bg-[#d4af37]/80 hover:bg-[#d4af37] text-black"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}