import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, Zap, TrendingUp, Heart, AlertTriangle, Copy, RefreshCw, ChevronDown, ChevronUp, X } from 'lucide-react';
import { toast } from 'sonner';

const INSIGHT_CONFIG = {
  conversation_starter: { icon: MessageSquare, color: '#C9A84C', label: 'Talk About',  bg: 'rgba(201,168,76,0.08)' },
  thank_you:            { icon: Heart,          color: '#C0392B', label: 'Thank You',   bg: 'rgba(192,57,43,0.08)' },
  chat_spike:           { icon: Zap,            color: '#D4AF37', label: '⚡ Spike',    bg: 'rgba(212,175,55,0.08)' },
  trending_topic:       { icon: TrendingUp,     color: '#D4AF37', label: 'Trending',    bg: 'rgba(212,175,55,0.08)' },
  performance_tip:      { icon: TrendingUp,     color: '#6DBF7E', label: 'Pro Tip',     bg: 'rgba(109,191,126,0.08)' },
  sentiment_shift:      { icon: AlertTriangle,  color: '#D4854A', label: 'Mood Shift',  bg: 'rgba(255,140,0,0.08)' },
};

function SentimentMeter({ score }) {
  const color = score >= 70 ? '#6DBF7E' : score >= 40 ? '#D4AF37' : '#C0392B';
  const label = score >= 70 ? 'Positive' : score >= 40 ? 'Neutral' : 'Negative';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold uppercase text-white/40" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
          Chat Sentiment
        </span>
        <span className="text-[10px] font-black" style={{ color }}>{label} {score}</span>
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

function InsightCard({ insight, onDismiss, onCopy }) {
  const cfg = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.conversation_starter;
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
      className="rounded-xl p-3 space-y-2 relative group"
      style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${cfg.color}15` }}>
          <Icon className="w-3 h-3" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-black uppercase" style={{ color: cfg.color, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
            {cfg.label}
          </span>
          <p className="text-[11px] text-white/80 leading-relaxed mt-0.5">{insight.content}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onCopy(insight.content)}
            className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white transition-colors">
            <Copy className="w-3 h-3" />
          </button>
          <button onClick={() => onDismiss(insight.id)}
            className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-red-400 transition-colors">
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

export default function AICopilotSidebar({ roomId, isHost, viewerCount }) {
  const [collapsed, setCollapsed] = useState(false);
  const [insights, setInsights] = useState([]);
  const [sentimentScore, setSentimentScore] = useState(65);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());
  const analyzeIntervalRef = useRef(null);

  const { data: recentMessages = [] } = useQuery({
    queryKey: ['copilot-messages', roomId],
    queryFn: () => base44.entities.Message.filter({ room_id: roomId }, '-created_date', 40),
    enabled: !!roomId && isHost,
    refetchInterval: 15000,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('aiCopilotAnalyze', {
      room_id: roomId,
      recent_messages: recentMessages,
      viewer_count: viewerCount,
      tips_last_5min: [],
    }),
    onSuccess: (res) => {
      const data = res.data;
      if (!data || data.error) return;
      setSentimentScore(data.sentiment_score ?? 65);
      setTrendingTopics(data.trending_topics || []);
      const newInsights = (data.insights || []).map((ins, i) => ({ ...ins, id: `${Date.now()}-${i}` }));
      setInsights(prev => [...newInsights, ...prev].slice(0, 6));
      setLastAnalyzed(new Date());
    },
  });

  useEffect(() => {
    if (!isHost || !roomId) return;
    analyzeIntervalRef.current = setInterval(() => {
      if (recentMessages.length >= 3) analyzeMutation.mutate();
    }, 45000);
    return () => clearInterval(analyzeIntervalRef.current);
  }, [isHost, roomId, recentMessages.length]);

  const handleDismiss = (id) => setDismissed(prev => new Set([...prev, id]));
  const handleCopy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };
  const visibleInsights = insights.filter(i => !dismissed.has(i.id));

  if (!isHost) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(11,11,24,0.95)', border: '1px solid rgba(212,175,55,0.2)' }}>
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
              {trendingTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {trendingTopics.map(t => (
                    <span key={t} className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              {visibleInsights.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-[10px] text-white/30">
                    {recentMessages.length < 3 ? 'Waiting for chat activity...' : 'Click Analyze to get suggestions'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {visibleInsights.map(insight => (
                      <InsightCard key={insight.id} insight={insight} onDismiss={handleDismiss} onCopy={handleCopy} />
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