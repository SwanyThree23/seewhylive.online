import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, RefreshCw, Copy, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function AIStreamSummary({ roomId, isHost, streamTitle, viewerCount, elapsedSeconds }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: recentMessages = [] } = useQuery({
    queryKey: ['summary-messages', roomId],
    queryFn: () => base44.entities.Message.filter({ room_id: roomId }, '-created_date', 30),
    enabled: !!roomId,
  });

  const generateSummary = async () => {
    setLoading(true);
    const elapsed = elapsedSeconds || 0;
    const mins = Math.floor(elapsed / 60);
    const chatSnippet = recentMessages.slice(0, 20).map(m => `${m.user_name}: ${m.content}`).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a live stream summarizer. Summarize this stream session in 3-4 punchy sentences suitable for social sharing.

Stream: "${streamTitle || 'Live Stream'}"
Duration: ${mins} minutes live
Viewers: ${viewerCount || 0}
Recent chat (sample):
${chatSnippet || '(no messages yet)'}

Write an engaging summary that captures the energy of the stream. Include highlights if chat shows them. End with a hype call-to-action. Keep it under 100 words.`,
    });

    setSummary(result);
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      toast.success('Summary copied!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error('Copy failed.'));
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#D4AF37' }} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>
            AI Stream Summary
          </span>
        </div>
        <button
          onClick={generateSummary}
          disabled={loading}
          style={{ height: 24, padding: '0 8px', fontSize: 10, fontWeight: 700, background: 'rgba(212,175,55,0.2)', color: '#a78bfa', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif' }}>
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} style={{ marginRight: 2 }} />
          {loading ? 'Writing...' : summary ? 'Refresh' : 'Generate'}
        </button>
      </div>

      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 space-y-2">
            <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{summary}</p>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-[10px] font-bold transition-colors"
              style={{ color: copied ? '#6DBF7E' : 'rgba(212,175,55,0.7)' }}>
              {copied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy for social'}
            </button>
          </motion.div>
        )}
        {!summary && !loading && (
          <div className="px-3 py-4 text-center">
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Generate an AI summary of your stream to share on social media</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}