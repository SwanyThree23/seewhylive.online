import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ModerationAppealPanel from '../components/live/ModerationAppealPanel';
import ModerationActionModal from '../components/moderation/ModerationActionModal';
import ReportModal from '../components/moderation/ReportModal';
import AIModeration from '../components/live/AIModeration';
import HostAlertCenter from '../components/live/HostAlertCenter';
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Zap, RefreshCw,
  MessageSquare, Eye, Clock, Flag, TrendingUp, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const BURGUNDY = '#800020';

const VIOLATION_STYLES = {
  harassment:    { color: '#D4854A', bg: 'rgba(212,133,74,0.12)',  border: 'rgba(212,133,74,0.3)' },
  spam:          { color: '#D4AF37', bg: 'rgba(212,175,55,0.12)',  border: 'rgba(212,175,55,0.3)' },
  hate_speech:   { color: '#C0392B', bg: 'rgba(192,57,43,0.12)',  border: 'rgba(192,57,43,0.3)' },
  inappropriate: { color: '#CC7755', bg: 'rgba(204,119,85,0.12)', border: 'rgba(204,119,85,0.3)' },
  safe:          { color: '#6DBF7E', bg: 'rgba(109,191,126,0.08)',   border: 'rgba(109,191,126,0.2)' },
};

const PRIORITY_STYLES = {
  urgent: { color: '#C0392B', label: 'URGENT' },
  high:   { color: '#D4854A', label: 'HIGH' },
  medium: { color: GOLD,       label: 'MEDIUM' },
  low:    { color: 'rgba(255,255,255,0.3)', label: 'LOW' },
};

function StatCard({ icon: Icon, label, value, color = GOLD }) {
  return (
    <div className="rounded-xl p-3 flex items-center gap-2.5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <div className="font-black text-lg leading-tight" style={{ color, fontFamily: 'Barlow Condensed, sans-serif' }}>{value}</div>
        <div className="text-[11px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</div>
      </div>
    </div>
  );
}

function FlaggedItem({ mod, onAction, user }) {
  const vStyle = VIOLATION_STYLES[mod.violation_type] || VIOLATION_STYLES.inappropriate;
  return (
    <div className="rounded-xl p-3 space-y-2"
      style={{ background: 'rgba(8,11,24,0.9)', border: `1px solid ${vStyle.border}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] font-black uppercase px-1.5 py-0.5 rounded"
            style={{ background: vStyle.bg, color: vStyle.color, border: `1px solid ${vStyle.border}`, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {mod.content_type?.toUpperCase()}
          </span>
          <span className="text-[11px] font-black uppercase px-1.5 py-0.5 rounded"
            style={{ background: vStyle.bg, color: vStyle.color, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {mod.violation_type?.replace('_', ' ')}
          </span>
          {mod.auto_detected && (
            <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              AI
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Confidence</div>
          <div className="text-[10px] font-black" style={{ color: vStyle.color, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {Math.round((mod.ai_confidence || 0) * 100)}%
          </div>
        </div>
      </div>
      {mod.ai_explanation && (
        <p className="text-[10px] italic px-2 py-1 rounded"
          style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${vStyle.color}` }}>
          "{mod.ai_explanation}"
        </p>
      )}
      {/* Confidence bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full" style={{ width: `${(mod.ai_confidence || 0) * 100}%`, background: vStyle.color }} />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {[
          { label: 'Hide', action: 'hidden', color: GOLD },
          { label: 'Delete', action: 'deleted', color: '#FF4444' },
          { label: 'Warn', action: 'warned', color: '#D4AF37' },
          { label: '✓ Safe', action: 'none_safe', color: '#6DBF7E' },
        ].map(({ label, action, color }) => (
          <button key={action}
            onClick={() => onAction(mod, action)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-all"
            style={{ background: `${color}12`, color, border: `1px solid ${color}25`, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatModEntry({ entry, onQuickAction, user }) {
  return (
    <div className="flex items-start gap-2.5 py-2 px-3 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-black uppercase px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,100,100,0.12)', color: '#FF8080', border: '1px solid rgba(255,100,100,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            {entry.action_type}
          </span>
          {entry.auto_detected && (
            <span className="text-[7px] px-1 py-0.5 rounded font-black"
              style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37' }}>AI</span>
          )}
          <span className="text-[11px] font-bold text-white">{entry.target_user_name || entry.target_user_id}</span>
        </div>
        {entry.reason && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{entry.reason}</p>}
        {entry.keywords_matched?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {entry.keywords_matched.map((kw, i) => (
              <span key={i} className="text-[7px] px-1 py-0.5 rounded"
                style={{ background: 'rgba(192,57,43,0.12)', color: '#D4854A', border: '1px solid rgba(192,57,43,0.2)' }}>{kw}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {[
          { label: '5m', timeout: 5 },
          { label: '30m', timeout: 30 },
        ].map(({ label, timeout }) => (
          <button key={label} onClick={() => onQuickAction(entry, 'timeout', timeout)}
            className="w-8 py-0.5 rounded text-[7px] font-black uppercase"
            style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            {label}
          </button>
        ))}
        <button onClick={() => onQuickAction(entry, 'ban')}
          className="w-8 py-0.5 rounded text-[7px] font-black uppercase"
          style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          Ban
        </button>
      </div>
    </div>
  );
}

function ReportItem({ report, onAction, user }) {
  const pri = PRIORITY_STYLES[report.priority] || PRIORITY_STYLES.medium;
  return (
    <div className="rounded-xl p-3 space-y-2"
      style={{ background: 'rgba(8,11,24,0.9)', border: `1px solid ${pri.color}25` }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-[11px] font-black uppercase px-1.5 py-0.5 rounded"
              style={{ background: `${pri.color}15`, color: pri.color, border: `1px solid ${pri.color}30`, fontFamily: 'Barlow Condensed, sans-serif' }}>
              {pri.label}
            </span>
            <span className="text-[11px] px-1 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>{report.report_type}</span>
          </div>
          {report.description && <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{report.description}</p>}
        </div>
      </div>
      <div className="flex gap-1.5">
        {[
          { label: 'Investigate', action: 'investigating', color: GOLD },
          { label: 'Dismiss', action: 'dismissed', color: 'rgba(255,255,255,0.4)' },
          { label: 'Escalate', action: 'escalated', color: '#FF4444' },
        ].map(({ label, action, color }) => (
          <button key={action} onClick={() => onAction(report, action)}
            className="flex-1 py-1 rounded text-[11px] font-black uppercase"
            style={{ background: `${color}12`, color, border: `1px solid ${color}25`, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ModerationDashboardPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room_id');
  const [activeTab, setActiveTab] = useState('flagged');
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: moderations = [] } = useQuery({
    queryKey: ['mod-content'],
    queryFn: () => base44.entities.ContentModeration.list('-created_date', 100),
    refetchInterval: 10000,
  });
  const { data: chatMods = [] } = useQuery({
    queryKey: ['chat-mods', roomId],
    queryFn: () => roomId
      ? base44.entities.ChatModeration.filter({ room_id: roomId }, '-created_date', 50)
      : base44.entities.ChatModeration.list('-created_date', 50),
    refetchInterval: 5000,
  });
  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.filter({ status: 'pending' }, '-created_date', 30),
    refetchInterval: 10000,
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, action }) => {
      const updates = action === 'none_safe'
        ? { action_taken: 'none', violation_type: 'safe', reviewed_by: user?.email, reviewed_at: new Date().toISOString() }
        : { action_taken: action, reviewed_by: user?.email, reviewed_at: new Date().toISOString() };
      return base44.entities.ContentModeration.update(id, updates);
    },
    onSuccess: () => { qc.invalidateQueries(['mod-content']); toast.success('Action taken'); },
  });

  const chatActionMut = useMutation({
    mutationFn: ({ entry, action, timeout }) => base44.entities.ChatModeration.create({
      room_id: entry.room_id || roomId,
      moderator_id: user?.id,
      target_user_id: entry.target_user_id,
      target_user_name: entry.target_user_name,
      action_type: action,
      reason: `Manual action: ${action}${timeout ? ` ${timeout}min` : ''}`,
      duration_minutes: timeout || 0,
      auto_detected: false,
    }),
    onSuccess: () => { qc.invalidateQueries(['chat-mods', roomId]); toast.success('Action applied'); },
  });

  const reportMut = useMutation({
    mutationFn: ({ id, action }) => base44.entities.Report.update(id, {
      status: action,
      reviewed_by: user?.id,
      updated_date: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries(['reports']); toast.success('Report updated'); },
  });

  const flagged = moderations.filter(m => m.action_taken === 'flagged' || (m.violation_type !== 'safe' && !m.reviewed_by));
  const today = new Date().toDateString();
  const todayFlags = moderations.filter(m => new Date(m.created_date).toDateString() === today);
  const autoDetected = moderations.filter(m => m.auto_detected);
  const humanOverrides = moderations.filter(m => m.reviewed_by && m.override_decision === 'reversed');
  const avgConf = flagged.length > 0 ? flagged.reduce((a, m) => a + (m.ai_confidence || 0), 0) / flagged.length : 0;

  const TABS = [
    { id: 'flagged',  label: `🚩 Flagged (${flagged.length})` },
    { id: 'chat',     label: `💬 Chat Mod (${chatMods.length})` },
    { id: 'reports',  label: `📋 Reports (${reports.length})` },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#080B18' }}>
      {/* Header */}
      <div className="px-4 md:px-8 py-4 flex items-center justify-between"
        style={{ background: 'rgba(8,11,24,0.9)', borderBottom: `1px solid rgba(212,175,55,0.12)` }}>
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5" style={{ color: GOLD }} />
          <span className="font-black uppercase tracking-widest text-sm" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Guardian AI
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}>Moderation</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 md:px-8 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Flag} label="Flags Today" value={todayFlags.length} color="#D4854A" />
          <StatCard icon={Zap} label="Actions Taken" value={moderations.filter(m => m.action_taken && m.action_taken !== 'none').length} color={GOLD} />
          <StatCard icon={Eye} label="Auto-Detected" value={autoDetected.length} color="#D4AF37" />
          <StatCard icon={TrendingUp} label="Human Overrides" value={humanOverrides.length} color="#C9A84C" />
        </div>
        {/* Toxicity gauge */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              AI Confidence Level
            </span>
            <span className="text-[10px] font-black" style={{ color: avgConf > 0.7 ? '#FF4444' : avgConf > 0.4 ? GOLD : '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>
              {Math.round(avgConf * 100)}%
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${avgConf * 100}%`, background: avgConf > 0.7 ? 'linear-gradient(90deg, #FF4444, #C0392B)' : avgConf > 0.4 ? 'linear-gradient(90deg, #D4AF37, #D4854A)' : 'linear-gradient(90deg, #6DBF7E, #C9A84C)' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-3 text-[10px] font-black uppercase transition-all"
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.3)',
              background: activeTab === tab.id ? 'rgba(212,175,55,0.05)' : 'transparent',
              borderBottom: activeTab === tab.id ? `2px solid ${GOLD}` : '2px solid transparent',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-2 max-w-4xl mx-auto">
        {activeTab === 'flagged' && (
          flagged.length === 0
            ? <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Shield className="w-14 h-14" style={{ color: 'rgba(109,191,126,0.3)' }} />
                <p className="font-black uppercase text-lg" style={{ color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>Guardian AI: All Clear ✓</p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No flagged content requires review</p>
              </div>
            : flagged.map(mod => (
                <FlaggedItem key={mod.id} mod={mod} user={user}
                  onAction={(m, action) => reviewMut.mutate({ id: m.id, action })} />
              ))
        )}
        {activeTab === 'chat' && (
          chatMods.length === 0
            ? <p className="text-center py-10 text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>No chat moderation entries</p>
            : chatMods.map(entry => (
                <ChatModEntry key={entry.id} entry={entry} user={user}
                  onQuickAction={(e, action, timeout) => chatActionMut.mutate({ entry: e, action, timeout })} />
              ))
        )}
        {activeTab === 'reports' && (
          reports.length === 0
            ? <p className="text-center py-10 text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>No pending reports</p>
            : reports.map(report => (
                <ReportItem key={report.id} report={report} user={user}
                  onAction={(r, action) => reportMut.mutate({ id: r.id, action })} />
              ))
        )}

        <ModerationAppealPanel flagId={null} messageId={null} roomId={roomId} onClose={() => {}} />
        {user?.id && <ModerationActionModal isOpen={false} onClose={() => {}} targetUser={null} roomId={roomId} communityId={null} moderatorId={user.id} />}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 0 24px' }}>
          {[
            { label: '🛡 AI Moderation',   href: 'AIModeration'    },
            { label: '👮 Guardian AI',     href: 'GuardianAI'      },
            { label: '⚙️ Admin Dashboard', href: 'AdminDashboard'  },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(128,0,32,0.08)', border: '1px solid rgba(128,0,32,0.25)', color: '#ff9999', cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>

        <div style={{ padding: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AIModeration roomId={null} isHost={true} />
          <HostAlertCenter roomId={null} hostId={null} />
          <ReportModal isOpen={false} onClose={() => {}} targetUserId={null} roomId={null} reporterId={null} />
        </div>
      </div>
    </div>
  );
}