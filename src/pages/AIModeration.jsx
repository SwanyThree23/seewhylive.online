import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Zap, RefreshCw, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const VIOLATION_STYLE = {
  spam:         { bg: 'rgba(255,200,0,0.1)',   border: 'rgba(255,200,0,0.3)',   color: '#ffc800' },
  harassment:   { bg: 'rgba(255,100,0,0.1)',   border: 'rgba(255,100,0,0.3)',   color: '#ff6400' },
  hate_speech:  { bg: 'rgba(255,21,100,0.1)',  border: 'rgba(255,21,100,0.3)',  color: '#FF1564' },
  inappropriate:{ bg: 'rgba(212,175,55,0.1)',  border: 'rgba(212,175,55,0.3)',  color: GOLD },
  safe:         { bg: 'rgba(109,191,126,0.08)',  border: 'rgba(109,191,126,0.25)', color: '#00ff88' },
};

const TABS = ['pending', 'reviewed', 'insights'];

export default function AIModerationPage() {
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('pending');

  const { data: moderations = [] } = useQuery({
    queryKey: ['moderations'],
    queryFn: () => base44.entities.ContentModeration.list('-created_date', 100),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision, action }) => {
      return await base44.entities.ContentModeration.update(id, {
        reviewed_by: 'admin',
        reviewed_at: new Date().toISOString(),
        override_decision: decision,
        action_taken: action,
      });
    },
    onSuccess: () => {
      toast.success('Review submitted');
      queryClient.invalidateQueries(['moderations']);
    },
  });

  const handleAIScan = async () => {
    setIsScanning(true);
    setScanProgress(10);
    try {
      const messages = await base44.entities.Message.list('-created_date', 50);
      setScanProgress(30);
      if (messages.length === 0) { toast.info('No messages to scan yet.'); setIsScanning(false); setScanProgress(0); return; }
      const scannedIds = new Set(moderations.map(m => m.content_id));
      const unscanned = messages.filter(m => !scannedIds.has(m.id));
      if (unscanned.length === 0) { toast.info('All recent messages already scanned.'); setIsScanning(false); setScanProgress(0); return; }
      setScanProgress(50);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a content moderation AI. Analyze the following chat messages and classify each one.\nFor each message, return a JSON object with:\n- "id": the message id\n- "violation_type": one of "spam", "harassment", "hate_speech", "inappropriate", "safe"\n- "ai_confidence": a number between 0 and 1\n- "ai_explanation": a brief explanation (one sentence, only if not safe)\n\nMessages:\n${unscanned.map(m => `ID: ${m.id} | User: ${m.user_name} | Message: "${m.content}"`).join('\n')}\n\nReturn ONLY a JSON object with a "results" array.`,
        response_json_schema: { type: 'object', properties: { results: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, violation_type: { type: 'string' }, ai_confidence: { type: 'number' }, ai_explanation: { type: 'string' } } } } } },
      });
      setScanProgress(80);
      const scanResults = result?.results || [];
      const violations = scanResults.filter(r => r.violation_type !== 'safe');
      await Promise.all(scanResults.map(r => base44.entities.ContentModeration.create({ content_type: 'message', content_id: r.id, violation_type: r.violation_type, ai_confidence: r.ai_confidence, ai_explanation: r.ai_explanation || null, action_taken: r.violation_type !== 'safe' ? 'flagged' : 'none' })));
      setScanProgress(100);
      toast.success(`Scanned ${scanResults.length} messages — ${violations.length} violation(s) found.`);
      queryClient.invalidateQueries(['moderations']);
    } catch (err) {
      toast.error('AI scan failed. Please try again.');
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const flagged = moderations.filter(m => m.violation_type !== 'safe' && !m.reviewed_by);
  const reviewed = moderations.filter(m => m.reviewed_by);
  const stats = {
    total: moderations.length,
    pending: flagged.length,
    safe: moderations.filter(m => m.violation_type === 'safe').length,
    violations: moderations.filter(m => m.violation_type !== 'safe').length,
  };

  function ViolationBadge({ type }) {
    const s = VIOLATION_STYLE[type] || VIOLATION_STYLE.safe;
    return (
      <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
        style={{ ...T, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
        {type?.replace('_', ' ')}
      </span>
    );
  }

  const tabLabels = { pending: `Pending (${flagged.length})`, reviewed: `Reviewed (${reviewed.length})`, insights: 'AI Insights' };

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5" style={{ color: GOLD }} />
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>AI Moderation</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Scan and review content for policy violations</p>
          </div>
        </div>
        <button onClick={handleAIScan} disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs"
          style={{ background: isScanning ? 'rgba(128,0,32,0.3)' : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: isScanning ? 'rgba(255,255,255,0.3)' : '#000', cursor: isScanning ? 'default' : 'pointer', ...T }}>
          {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          {isScanning ? 'Scanning…' : 'Run AI Scan'}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-5">
        {/* Scan progress */}
        {isScanning && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
            <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>
              <MessageSquare className="w-4 h-4 animate-pulse" />
              Analyzing messages with AI…
            </div>
            <div className="rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${scanProgress}%`, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})` }} />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Scanned', value: stats.total, icon: Shield, color: GOLD },
            { label: 'Pending Review', value: stats.pending, icon: AlertTriangle, color: '#ff6400' },
            { label: 'Safe Content', value: stats.safe, icon: CheckCircle, color: '#00ff88' },
            { label: 'Violations', value: stats.violations, icon: XCircle, color: '#FF1564' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-4 flex flex-col gap-2"
              style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-[10px] font-black uppercase" style={{ ...T, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
              </div>
              <p className="text-3xl font-black" style={{ fontFamily: 'Orbitron, monospace', color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="px-4 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all"
              style={{ ...T, color: activeTab === t ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: activeTab === t ? GOLD : 'transparent', background: 'transparent' }}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* Pending */}
        {activeTab === 'pending' && (
          flagged.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-black uppercase text-sm" style={T}>
                {stats.total === 0 ? 'No content scanned yet. Click Run AI Scan to begin.' : 'All flagged content has been reviewed.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {flagged.map(mod => (
                <div key={mod.id} className="rounded-2xl p-4"
                  style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <ViolationBadge type={mod.violation_type} />
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
                          style={{ ...T, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' }}>
                          {((mod.ai_confidence || 0) * 100).toFixed(0)}% confidence
                        </span>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
                          style={{ ...T, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
                          {mod.content_type}
                        </span>
                      </div>
                      {mod.ai_explanation && (
                        <p className="text-xs italic mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>"{mod.ai_explanation}"</p>
                      )}
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Detected: {new Date(mod.created_date).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => reviewMutation.mutate({ id: mod.id, decision: 'upheld', action: 'hidden' })}
                        disabled={reviewMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase text-[10px]"
                        style={{ ...T, background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.25)', color: '#00ff88', cursor: 'pointer' }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Uphold
                      </button>
                      <button onClick={() => reviewMutation.mutate({ id: mod.id, decision: 'reversed', action: 'none' })}
                        disabled={reviewMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase text-[10px]"
                        style={{ ...T, background: 'rgba(255,21,100,0.08)', border: '1px solid rgba(255,21,100,0.2)', color: '#FF1564', cursor: 'pointer' }}>
                        <XCircle className="w-3.5 h-3.5" /> Reverse
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Reviewed */}
        {activeTab === 'reviewed' && (
          reviewed.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-black uppercase text-sm" style={T}>No reviewed items yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewed.slice(0, 30).map(mod => (
                <div key={mod.id} className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3"
                  style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ViolationBadge type={mod.violation_type} />
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
                      style={{ ...T, background: mod.override_decision === 'upheld' ? 'rgba(109,191,126,0.08)' : 'rgba(255,255,255,0.06)', border: `1px solid ${mod.override_decision === 'upheld' ? 'rgba(109,191,126,0.25)' : 'rgba(255,255,255,0.12)'}`, color: mod.override_decision === 'upheld' ? '#00ff88' : 'rgba(255,255,255,0.45)' }}>
                      {mod.override_decision}
                    </span>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {new Date(mod.reviewed_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Insights */}
        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="font-black text-sm text-white mb-1" style={T}>Violation Distribution</p>
              <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Breakdown of detected content types</p>
              {moderations.length === 0 ? (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No data yet. Run a scan first.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(moderations.reduce((acc, m) => { acc[m.violation_type] = (acc[m.violation_type] || 0) + 1; return acc; }, {}))
                    .sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                      const s = VIOLATION_STYLE[type] || VIOLATION_STYLE.safe;
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <span className="capitalize text-xs w-24" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>{type.replace('_', ' ')}</span>
                          <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full" style={{ width: `${(count / moderations.length) * 100}%`, background: s.color }} />
                          </div>
                          <span className="text-xs font-black" style={{ color: s.color, ...T }}>{count}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="font-black text-sm text-white mb-1" style={T}>AI Performance</p>
              <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Scan accuracy and review metrics</p>
              {moderations.length === 0 ? (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No data yet. Run a scan first.</p>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Average Confidence', value: moderations.reduce((acc, m) => acc + (m.ai_confidence || 0), 0) / moderations.length * 100, color: GOLD },
                    { label: 'Review Rate', value: stats.violations > 0 ? (reviewed.length / stats.violations) * 100 : 0, color: '#00d4ff' },
                    { label: 'Violation Rate', value: (stats.violations / stats.total) * 100, color: '#FF1564' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: 'rgba(255,255,255,0.5)', ...T }}>{label}</span>
                        <span className="font-black" style={{ color, ...T }}>{value.toFixed(1)}%</span>
                      </div>
                      <div className="rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="moderation" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={null} />
      <BackgroundCustomizer />
    </div>
  );
}
