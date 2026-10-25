import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, MessageSquare, Zap, TrendingUp, Heart, AlertTriangle,
  Copy, RefreshCw, ChevronDown, ChevronUp, X, Pin, PinOff, ToggleLeft, ToggleRight, Send,
} from 'lucide-react';
import { toast } from 'sonner';

const INSIGHT_CONFIG = {
  conversation_starter: { icon: MessageSquare, color: '#C9A84C', label: 'Talk About',  bg: 'rgba(201,168,76,0.08)' },
  thank_you:            { icon: Heart,          color: '#C0392B', label: 'Thank You',   bg: 'rgba(192,57,43,0.08)' },
  chat_spike:           { icon: Zap,            color: '#D4AF37', label: '⚡ Spike',    bg: 'rgba(212,175,55,0.08)' },
  trending_topic:       { icon: TrendingUp,     color: '#D4AF37', label: 'Trending',    bg: 'rgba(212,175,55,0.08)' },
  performance_tip:      { icon: TrendingUp,     color: '#6DBF7E', label: 'Pro Tip',     bg: 'rgba(109,191,126,0.08)' },
  sentiment_shift:      { icon: AlertTriangle,  color: '#D4854A', label: 'Mood Shift',  bg: 'rgba(212,133,74,0.08)' },
};

const QUICK_RESPONSES = [
  { label: '🙏 Thanks',   text: 'Thank you all so much! You guys are the best! 🙏' },
  { label: '🔥 Hype',    text: 'LET\'S GOOO!! This is insane! 🔥🔥🔥' },
  { label: '📣 CTA',     text: 'If you\'re enjoying this, smash that follow button! It really helps! 💪' },
  { label: '🎯 Poll',    text: 'Drop a 1 or 2 in chat — I\'m about to launch a poll!' },
  { label: '👋 Welcome', text: 'Hey welcome everyone just joining! We\'re live right now! 👋' },
  { label: '💬 Q&A',    text: 'Q&A mode — ask me ANYTHING in chat right now!' },
];

function SentimentMeter({ score }) {
  const color = score >= 70 ? '#6DBF7E' : score >= 40 ? '#D4AF37' : '#C0392B';
  const label = score >= 70 ? 'Positive' : score >= 40 ? 'Neutral' : 'Negative';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold uppercase text-white/40" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
          Chat Sentiment
        </span>
        <span className="text-[10px] font-black" style={{ color }}>{label} · {score}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div className="h-full rounded-full"
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8 }}
          style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }} />
      </div>
    </div>
  );
}

function InsightCard({ insight, onDismiss, onCopy, onPin, pinned }) {
  const cfg = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.conversation_starter;
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
      className="rounded-xl p-3 space-y-2 relative group"
      style={{ background: pinned ? `${cfg.color}18` : cfg.bg, border: `1px solid ${pinned ? cfg.color + '50' : cfg.color + '25'}` }}
    >
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${cfg.color}15` }}>
          <Icon className="w-3 h-3" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black uppercase" style={{ color: cfg.color, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
              {cfg.label}
            </span>
            {pinned && <span className="text-[9px] font-bold px-1 rounded" style={{ background: `${cfg.color}20`, color: cfg.color }}>PINNED</span>}
          </div>
          <p className="text-[11px] text-white/80 leading-relaxed mt-0.5">{insight.content}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onPin(insight.id)} className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-[#D4AF37] transition-colors" title={pinned ? 'Unpin' : 'Pin'}>
            {pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
          </button>
          <button onClick={() => onCopy(insight.content)} className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white transition-colors">
            <Copy className="w-3 h-3" />
          </button>
          <button onClick={() => onDismiss(insight.id)} className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-[#C0392B] transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      {insight.urgency === 'high' && (
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
          <span className="text-[11px] font-bold uppercase" style={{ color: cfg.color, opacity: 0.7 }}>Act Now</span>
        </div>
      )}
    </motion.div>
  );
}

export default function AICopilotSidebar({ roomId, isHost, viewerCount, onSendToChat }) {
  const [collapsed, setCollapsed]       = useState(false);
  const [showResponses, setShowResponses] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customAnswer, setCustomAnswer] = useState(null);
  const [insights, setInsights]         = useState([]);
  const [sentimentScore, setSentimentScore] = useState(65);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [retentionPrediction, setRetentionPrediction] = useState(null);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);
  const [dismissed, setDismissed]       = useState(new Set());
  const [pinned, setPinned]             = useState(new Set());
  const [autoAnalyze, setAutoAnalyze]   = useState(true);
  const analyzeIntervalRef = useRef(null);

  const { data: recentMessages = [] } = useQuery({
    queryKey: ['copilot-messages', roomId],
    queryFn: () => base44.entities.Message.filter({ room_id: roomId }, '-created_date', 40),
    enabled: !!roomId && isHost,
    refetchInterval: 15000,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => {
      const msgLines = recentMessages
        .map(m => `${m.user_name || 'User'}: ${m.content}`)
        .join('\n');
      return base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these live stream chat messages (${viewerCount} viewers) and return host insights as JSON with:
- sentiment_score: number 0-100
- trending_topics: array of strings (top 5 words/phrases)
- retention_prediction: number 0-100 (likelihood viewers stay for next 5 min)
- insights: array of { type: "conversation_starter"|"thank_you"|"chat_spike"|"trending_topic"|"performance_tip"|"sentiment_shift", content: string, urgency: "low"|"medium"|"high" }

Messages:\n${msgLines}`,
        response_json_schema: {
          type: 'object',
          properties: {
            sentiment_score:      { type: 'number' },
            trending_topics:      { type: 'array', items: { type: 'string' } },
            retention_prediction: { type: 'number' },
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type:    { type: 'string' },
                  content: { type: 'string' },
                  urgency: { type: 'string' },
                },
              },
            },
          },
        },
      });
    },
    onSuccess: (data) => {
      if (!data) return;
      setSentimentScore(data.sentiment_score ?? 65);
      setTrendingTopics(data.trending_topics || []);
      if (data.retention_prediction != null) setRetentionPrediction(data.retention_prediction);
      const newInsights = (data.insights || []).map((ins, i) => ({ ...ins, id: `${Date.now()}-${i}` }));
      setInsights(prev => [...newInsights, ...prev].slice(0, 6));
      setLastAnalyzed(new Date());
    },
    onError: () => toast.error('Failed to analyze chat.'),
  });

  useEffect(() => {
    if (!isHost || !roomId) return;
    analyzeIntervalRef.current = setInterval(() => {
      if (autoAnalyze && recentMessages.length >= 3) analyzeMutation.mutate();
    }, 45000);
    return () => clearInterval(analyzeIntervalRef.current);
  }, [isHost, roomId, autoAnalyze, recentMessages.length]);

  const customMutation = useMutation({
    mutationFn: (prompt) => base44.integrations.Core.InvokeLLM({
      prompt: `You are a live stream AI copilot. The host asks: "${prompt}"\nContext: ${viewerCount} viewers, recent messages: ${recentMessages.slice(0,10).map(m => m.content).join(' | ')}\nRespond in 1-2 concise sentences.`,
    }),
    onSuccess: (data) => {
      setCustomAnswer(typeof data === 'string' ? data : data?.content || JSON.stringify(data));
    },
    onError: () => toast.error('AI query failed'),
  });

  const handleDismiss = (id) => {
    setDismissed(prev => new Set([...prev, id]));
    setPinned(prev => { const n = new Set(prev); n.delete(id); return n; });
  };
  const handleCopy = (text) => navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => toast.error('Copy failed.'));
  const handlePin  = (id) => setPinned(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const handleQuickResponse = (text) => {
    if (onSendToChat) {
      onSendToChat(text);
      toast.success('Sent to chat!');
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success('Copied! Paste in chat'));
    }
  };

  const visibleInsights = insights.filter(i => !dismissed.has(i.id));
  const pinnedInsights  = visibleInsights.filter(i => pinned.has(i.id));
  const otherInsights   = visibleInsights.filter(i => !pinned.has(i.id));
  const sortedInsights  = [...pinnedInsights, ...otherInsights];

  // Word cloud: top-5 topics rendered as sized pills
  const topicBubbles = trendingTopics.slice(0, 5);

  if (!isHost) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(11,11,24,0.95)', border: '1px solid rgba(212,175,55,0.2)' }}>
      {/* Header */}
      <button onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 transition-all hover:bg-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(201,168,76,0.3))' }}>
            <Sparkles className="w-3.5 h-3.5 text-[#D4854A]" />
          </div>
          <span className="text-xs font-black uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#D4AF37', letterSpacing: '0.08em' }}>
            AI Copilot
          </span>
          {visibleInsights.length > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37' }}>
              {visibleInsights.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-analyze toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setAutoAnalyze(v => !v); }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all"
            style={{ color: autoAnalyze ? '#6DBF7E' : 'rgba(255,255,255,0.25)' }}
            title={autoAnalyze ? 'Auto-analyze ON' : 'Auto-analyze OFF'}
          >
            {autoAnalyze ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            Auto
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); analyzeMutation.mutate(); }}
            disabled={analyzeMutation.isPending || recentMessages.length < 3}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40"
            style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
            <RefreshCw className={`w-2.5 h-2.5 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
            Analyze
          </button>
          {collapsed ? <ChevronDown className="w-3.5 h-3.5 text-white/40" /> : <ChevronUp className="w-3.5 h-3.5 text-white/40" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-3">
              <SentimentMeter score={sentimentScore} />

              {/* Retention prediction */}
              {retentionPrediction != null && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/40 uppercase font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Viewer Retention (5min)
                  </span>
                  <span className="font-black" style={{ color: retentionPrediction >= 70 ? '#6DBF7E' : retentionPrediction >= 40 ? '#D4AF37' : '#C0392B' }}>
                    {retentionPrediction}%
                  </span>
                </div>
              )}

              {/* Trending word cloud */}
              {topicBubbles.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase font-bold mb-1.5" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Trending in chat</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topicBubbles.map((t, i) => (
                      <span key={t}
                        className="px-2 py-0.5 rounded-full font-bold"
                        style={{
                          fontSize: `${Math.max(9, 12 - i * 0.6)}px`,
                          background: 'rgba(212,175,55,0.12)',
                          color: '#D4AF37',
                          border: '1px solid rgba(212,175,55,0.18)',
                          opacity: 1 - i * 0.12,
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick responses */}
              <div>
                <button
                  onClick={() => setShowResponses(v => !v)}
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase transition-colors"
                  style={{ color: showResponses ? '#D4AF37' : 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  <Send className="w-3 h-3" />
                  Quick Responses
                  {showResponses ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <AnimatePresence>
                  {showResponses && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-1.5 grid grid-cols-2 gap-1.5"
                    >
                      {QUICK_RESPONSES.map(r => (
                        <button
                          key={r.label}
                          onClick={() => handleQuickResponse(r.text)}
                          className="text-[10px] font-bold px-2 py-1.5 rounded-lg text-left transition-all hover:bg-white/10"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                        >
                          {r.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Ask AI anything */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-white/30" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Ask AI</p>
                <div className="flex gap-1">
                  <input
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && customPrompt.trim() && customMutation.mutate(customPrompt.trim())}
                    placeholder="e.g. Should I take a break soon?"
                    style={{ flex: 1, padding: '6px 8px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none' }}
                  />
                  <button
                    onClick={() => customPrompt.trim() && customMutation.mutate(customPrompt.trim())}
                    disabled={!customPrompt.trim() || customMutation.isPending}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold disabled:opacity-40"
                    style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
                {customAnswer && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="px-2 py-2 rounded-lg text-[11px] text-white/70 leading-relaxed"
                    style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                    {customAnswer}
                  </motion.div>
                )}
              </div>

              {/* Insights */}
              {sortedInsights.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-[10px] text-white/30">
                    {recentMessages.length < 3 ? 'Waiting for chat activity...' : 'Click Analyze to get suggestions'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {sortedInsights.map(insight => (
                      <InsightCard
                        key={insight.id}
                        insight={insight}
                        onDismiss={handleDismiss}
                        onCopy={handleCopy}
                        onPin={handlePin}
                        pinned={pinned.has(insight.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {lastAnalyzed && (
                <p className="text-[11px] text-white/20 text-right">Last: {lastAnalyzed.toLocaleTimeString()}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
