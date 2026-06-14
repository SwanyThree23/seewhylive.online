import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Zap, RefreshCw, AlertTriangle, Check, Ban, Eye } from 'lucide-react';
import { toast } from 'sonner';
import ModerationAppealPanel from '../components/live/ModerationAppealPanel';
import ReportsManager from '../components/admin/ReportsManager';
import SpotlightBanner from '../components/community/SpotlightBanner';
import ChallengeAnalytics from '../components/admin/ChallengeAnalytics';
import AIModeration from '../components/live/AIModeration';
import ModerationActionModal from '../components/moderation/ModerationActionModal';
import AnnouncementScheduler from '../components/admin/AnnouncementScheduler';

const BG    = '#080B18';
const BG2   = '#0D0A14';
const BG3   = '#13101C';
const GOLD  = '#D4AF37';
const GOLDD = '#8A6F2E';
const SLATE = '#2A2438';
const TEXT  = '#F0EAF8';
const TEXTD = '#B8AECF';
const TEXTM = '#8A7A94';
const GREEN = '#22c55e';
const WARN  = '#F59E0B';
const ORANGE= '#F97316';
const RED   = '#E74C3C';
const PILL  = 999;

const T    = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'Space Mono, monospace' };

const SAMPLE_LOG = [
  { time: '9:04 PM', user: 'anon_2931',  msg: 'spam spam spam spam',           risk: 0.82, action: 'MUTED'   },
  { time: '9:03 PM', user: 'viewer_445', msg: 'Great stream! WA is dominating 🔥', risk: 0.04, action: 'ALLOWED' },
  { time: '9:02 PM', user: 'troll_99',   msg: '[content removed]',              risk: 0.97, action: 'BANNED'  },
  { time: '9:01 PM', user: 'DomFan22',   msg: 'Big Bone Earl tribute was 🙏',   risk: 0.03, action: 'ALLOWED' },
  { time: '9:00 PM', user: 'hype_lord',  msg: 'LETS GOOOOO!!!! 🏆',             risk: 0.12, action: 'ALLOWED' },
  { time: '8:58 PM', user: 'lurker_007', msg: 'first time here — love it',      risk: 0.02, action: 'ALLOWED' },
];

const ACTION_CONFIG = {
  ALLOWED: { color: GREEN,  label: 'ALLOWED' },
  MUTED:   { color: ORANGE, label: 'MUTED'   },
  BANNED:  { color: RED,    label: 'BANNED'  },
  FLAGGED: { color: WARN,   label: 'FLAGGED' },
};

function RiskBar({ value, color }) {
  return (
    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 2, transition: 'width .3s' }} />
    </div>
  );
}

function Tag({ label, color }) {
  return (
    <span style={{
      ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
      padding: '3px 8px', borderRadius: PILL,
      background: color + '22', border: `1px solid ${color}55`, color
    }}>{label}</span>
  );
}

function StatCard({ label, value, color = GOLD, icon: Icon }) {
  return (
    <div style={{
      background: BG3, border: `1px solid ${SLATE}`,
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
    }}>
      <div>
        <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
        <div style={{ ...MONO, fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      </div>
      {Icon && (
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '15', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 16, height: 16, color }} />
        </div>
      )}
    </div>
  );
}

export default function GuardianAI() {
  const queryClient = useQueryClient();
  const [flagT,  setFlagT]  = useState(50);
  const [muteT,  setMuteT]  = useState(75);
  const [banT,   setBanT]   = useState(95);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep]  = useState('');
  const [activeTab, setActiveTab] = useState('log');
  const logEndRef = useRef(null);

  const { data: moderations = [], isLoading } = useQuery({
    queryKey: ['guardian-moderations'],
    queryFn: () => base44.entities.ContentModeration.list('-created_date', 60),
    refetchInterval: 15000,
  });

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moderations]);

  const displayLog = moderations.length > 0
    ? moderations.map(m => ({
        time: new Date(m.created_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        user: m.content_id?.slice(0, 12) || 'unknown',
        msg:  m.ai_explanation || m.violation_type || '—',
        risk: m.ai_confidence ?? 0,
        action: m.action_taken === 'none' ? 'ALLOWED'
              : m.action_taken === 'flagged' ? 'FLAGGED'
              : m.action_taken?.toUpperCase() || 'FLAGGED',
      }))
    : SAMPLE_LOG;

  const violationCount = displayLog.filter(e => e.action !== 'ALLOWED').length;
  const allowedCount   = displayLog.filter(e => e.action === 'ALLOWED').length;
  const banCount       = displayLog.filter(e => e.action === 'BANNED').length;

  async function runScan() {
    setScanning(true);
    setScanStep('Fetching recent messages…');
    try {
      const messages = await base44.entities.Message.list('-created_date', 40);
      if (!messages.length) { toast.info('No messages to scan.'); setScanning(false); setScanStep(''); return; }

      setScanStep('Running Guardian AI analysis…');
      const scannedIds = new Set(moderations.map(m => m.content_id));
      const unscanned  = messages.filter(m => !scannedIds.has(m.id));
      if (!unscanned.length) { toast.info('All recent messages already scanned.'); setScanning(false); setScanStep(''); return; }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Guardian AI, a real-time content moderation system for SeeWhy LIVE streams. Analyze each message and return risk scores.\n\nMessages:\n${unscanned.map(m => `ID:${m.id} User:${m.user_name || 'anon'} Msg:"${m.content}"`).join('\n')}\n\nReturn JSON with "results" array. For each message: id (string), violation_type ("spam"/"harassment"/"hate_speech"/"inappropriate"/"safe"), ai_confidence (0-1 float), ai_explanation (string, null if safe).`,
        response_json_schema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id:             { type: 'string' },
                  violation_type: { type: 'string' },
                  ai_confidence:  { type: 'number' },
                  ai_explanation: { type: 'string' },
                }
              }
            }
          }
        }
      });

      setScanStep('Logging results…');
      const scanResults = result?.results || [];
      await Promise.all(scanResults.map(r =>
        base44.entities.ContentModeration.create({
          content_type:    'message',
          content_id:      r.id,
          violation_type:  r.violation_type,
          ai_confidence:   r.ai_confidence,
          ai_explanation:  r.ai_explanation || null,
          action_taken:    r.violation_type !== 'safe'
            ? (r.ai_confidence >= banT / 100 ? 'banned' : r.ai_confidence >= muteT / 100 ? 'muted' : 'flagged')
            : 'none',
        })
      ));

      const violations = scanResults.filter(r => r.violation_type !== 'safe').length;
      toast.success(`Scanned ${scanResults.length} messages — ${violations} flagged`);
      queryClient.invalidateQueries(['guardian-moderations']);
    } catch {
      toast.error('Guardian scan failed — try again');
    }
    setScanning(false);
    setScanStep('');
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        padding: '14px 20px',
        background: BG2, borderBottom: `1px solid ${SLATE}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/AIHub" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em', marginRight: 4, flexShrink: 0 }} aria-label="Back to AI Hub">← AI Hub</a>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `linear-gradient(135deg, ${GOLD}22, ${GOLDD}11)`,
            border: `1px solid ${GOLD}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield style={{ width: 18, height: 18, color: GOLD }} />
          </div>
          <div>
            <div style={{ ...T, fontSize: 20, fontWeight: 900, color: TEXT, letterSpacing: '0.06em', lineHeight: 1 }}>GUARDIAN AI</div>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>CLAUDE HAIKU · REAL-TIME MODERATION</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: PILL,
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)'
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pulse 1.5s ease infinite' }} />
            <span style={{ ...MONO, fontSize: 9, color: GREEN, fontWeight: 700 }}>ACTIVE</span>
          </div>
          <button
            onClick={runScan}
            disabled={scanning}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: scanning ? SLATE : `linear-gradient(135deg, ${GOLD}, ${GOLDD})`,
              color: scanning ? TEXTM : BG,
              border: 'none', borderRadius: PILL, padding: '7px 16px',
              cursor: scanning ? 'not-allowed' : 'pointer',
              ...T, fontSize: 12, fontWeight: 900, letterSpacing: '0.06em'
            }}>
            {scanning
              ? <RefreshCw style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
              : <Zap style={{ width: 12, height: 12 }} />}
            {scanning ? 'Scanning…' : 'SCAN NOW'}
          </button>
        </div>
      </div>

      {scanning && scanStep && (
        <div style={{
          padding: '8px 20px', background: `${GOLD}11`,
          borderBottom: `1px solid ${GOLD}22`,
          ...MONO, fontSize: 10, color: GOLD, letterSpacing: '0.08em'
        }}>
          ⚡ {scanStep}
        </div>
      )}

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <StatCard label="VIOLATIONS" value={violationCount} color={RED}    icon={AlertTriangle} />
          <StatCard label="ALLOWED"    value={allowedCount}   color={GREEN}   icon={Check} />
          <StatCard label="BANNED"     value={banCount}       color={ORANGE}  icon={Ban} />
        </div>

        {/* Risk Thresholds */}
        <div style={{ background: BG3, border: `1px solid ${SLATE}`, borderRadius: 14, padding: '16px' }}>
          <div style={{ ...T, fontSize: 14, fontWeight: 900, color: GOLD, letterSpacing: '0.08em', marginBottom: 14 }}>
            RISK THRESHOLDS
          </div>
          {[
            { label: 'FLAG FOR REVIEW', value: flagT, set: setFlagT, color: WARN,   icon: Eye },
            { label: 'AUTO-MUTE',       value: muteT, set: setMuteT, color: ORANGE, icon: AlertTriangle },
            { label: 'AUTO-BAN',        value: banT,  set: setBanT,  color: RED,    icon: Ban },
          ].map(({ label, value, set, color, icon: Icon }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon style={{ width: 12, height: 12, color }} />
                  <span style={{ ...T, fontSize: 12, fontWeight: 900, color, letterSpacing: '0.05em' }}>{label}</span>
                </div>
                <span style={{ ...MONO, fontSize: 11, color, fontWeight: 700 }}>{value}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <RiskBar value={value} color={color} />
                <input
                  type="range" min="0" max="100" value={value}
                  onChange={e => set(Number(e.target.value))}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
              </div>
              <input
                type="range" min="0" max="100" value={value}
                onChange={e => set(Number(e.target.value))}
                style={{ width: '100%', accentColor: color, marginTop: 4, cursor: 'pointer' }}
              />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${SLATE}` }}>
          {[
            { id: 'log', label: 'LIVE LOG' },
            { id: 'stats', label: 'STATS' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                ...T, fontSize: 12, fontWeight: 900, letterSpacing: '0.06em',
                padding: '8px 16px', background: 'transparent', border: 'none',
                cursor: 'pointer', color: activeTab === tab.id ? GOLD : TEXTM,
                borderBottom: `2px solid ${activeTab === tab.id ? GOLD : 'transparent'}`,
                marginBottom: -1, transition: 'all .15s'
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'log' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', ...MONO, fontSize: 11, color: TEXTM }}>
                Loading moderation log…
              </div>
            ) : displayLog.map((e, i) => {
              const cfg = ACTION_CONFIG[e.action] || ACTION_CONFIG.FLAGGED;
              const riskPct = Math.floor(e.risk * 100);
              return (
                <div key={i} style={{
                  background: BG3, border: `1px solid ${e.action === 'ALLOWED' ? SLATE : cfg.color + '33'}`,
                  borderRadius: 10, padding: '10px 12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ ...MONO, fontSize: 10, color: GOLD, fontWeight: 700 }}>{e.user}</span>
                    <Tag label={cfg.label} color={cfg.color} />
                  </div>
                  <div style={{ fontSize: 12, color: TEXTD, lineHeight: 1.4, marginBottom: 5 }}>{e.msg}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ ...MONO, fontSize: 9, color: TEXTM }}>{e.time}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <span style={{ ...MONO, fontSize: 9, color: TEXTM, whiteSpace: 'nowrap' }}>RISK</span>
                      <RiskBar value={riskPct} color={riskPct >= 90 ? RED : riskPct >= 70 ? ORANGE : GREEN} />
                      <span style={{
                        ...MONO, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                        color: riskPct >= 90 ? RED : riskPct >= 70 ? ORANGE : GREEN
                      }}>{riskPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: BG3, border: `1px solid ${SLATE}`, borderRadius: 14, padding: 16 }}>
              <div style={{ ...T, fontSize: 14, fontWeight: 900, color: GOLD, marginBottom: 14, letterSpacing: '0.06em' }}>
                VIOLATION BREAKDOWN
              </div>
              {['spam', 'harassment', 'hate_speech', 'inappropriate'].map(type => {
                const count = moderations.filter(m => m.violation_type === type).length;
                const pct   = moderations.length ? Math.round((count / moderations.length) * 100) : 0;
                const color = type === 'hate_speech' ? RED : type === 'harassment' ? ORANGE : type === 'spam' ? WARN : GOLD;
                return (
                  <div key={type} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ ...T, fontSize: 12, fontWeight: 700, color: TEXTD, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{type.replace('_', ' ')}</span>
                      <span style={{ ...MONO, fontSize: 10, color, fontWeight: 700 }}>{count} ({pct}%)</span>
                    </div>
                    <RiskBar value={pct} color={color} />
                  </div>
                );
              })}
            </div>
            <div style={{ background: BG3, border: `1px solid ${SLATE}`, borderRadius: 14, padding: 16 }}>
              <div style={{ ...T, fontSize: 14, fontWeight: 900, color: GOLD, marginBottom: 10, letterSpacing: '0.06em' }}>
                THRESHOLD STATUS
              </div>
              {[
                { label: 'Flag threshold', value: flagT, color: WARN },
                { label: 'Mute threshold', value: muteT, color: ORANGE },
                { label: 'Ban threshold',  value: banT,  color: RED },
              ].map(t => (
                <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <span style={{ ...T, fontSize: 13, color: TEXTD, fontWeight: 700 }}>{t.label}</span>
                  <span style={{ ...MONO, fontSize: 12, color: t.color, fontWeight: 700 }}>{t.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
      `}</style>

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AIModeration roomId={null} isHost={false} />
        <ModerationActionModal isOpen={false} onClose={() => {}} userId={null} action={null} />
        <AnnouncementScheduler communityId={null} userId={null} />
        <ModerationAppealPanel flagId={null} messageId={null} roomId={null} onClose={() => {}} />
        <ReportsManager communityId={null} userId={null} />
        <ChallengeAnalytics communityId={null} />
        <SpotlightBanner communityId={null} isAdmin={false} />
      </div>

      {/* Cross-nav footer */}
      <div style={{ padding: '10px 16px', background: 'rgba(13,10,20,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to={createPageUrl('AIHub')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#B8AECF', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🤖 AI Hub
          </button>
        </Link>
        <Link to={createPageUrl('JoyceAI')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#B8AECF', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🤖 Joyce AI
          </button>
        </Link>
        <Link to={createPageUrl('AuraAI')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#B8AECF', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ✨ Aura AI
          </button>
        </Link>
        <Link to={createPageUrl('LiveRoom')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#B8AECF', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🎙️ Live Room
          </button>
        </Link>
      </div>
    </div>
  );
}
