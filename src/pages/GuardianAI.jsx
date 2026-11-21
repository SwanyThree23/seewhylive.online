import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Zap, RefreshCw, AlertTriangle, Check, Ban, Eye } from 'lucide-react';
import { toast } from 'sonner';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
import ModerationToast, { useModerationToasts } from '../components/shared/ModerationToast';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
var BG    = '#080B18';
var BG2   = '#0D0A08';
var BG3   = '#13100A';
var GOLD  = '#D4AF37';
var GOLDD = '#8A6F2E';
var SLATE = '#2A2010';
var TEXT  = '#F0E8D4';
var TEXTD = '#C4B596';
var TEXTM = '#8A7A62';
var GREEN = '#6DBF7E';
var WARN  = '#D4AF37';
var ORANGE= '#D4854A';
var RED   = '#E74C3C';
var PILL  = 999;

var T    = { fontFamily: 'Barlow Condensed, sans-serif' };
var MONO = { fontFamily: 'Space Mono, monospace' };

var ACTION_CONFIG = {
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
  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  var { data: activeRoom } = useQuery({
    queryKey: ['guardian-active-room', (user && user.id)],
    queryFn: () => base44.entities.Room.filter({ host_id: user.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var queryClient = useQueryClient();
  var { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', (user && user.id)],
    queryFn: () => base44.entities.Community.filter({ owner_id: (user && user.id) }).then(r => r[0] || null),
    enabled: !!(user && user.id),
  });
  var userCommunityId = (userCommunity && userCommunity.id) || null;
  var roomId = activeRoomId;
  var [flagT,  setFlagT]  = useState(50);
  var [muteT,  setMuteT]  = useState(75);
  var [banT,   setBanT]   = useState(95);
  var [scanning, setScanning] = useState(false);
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);

  var [scanStep, setScanStep]  = useState('');
  var [activeTab, setActiveTab] = useState('log');
  var [thresholdSaved, setThresholdSaved] = useState(false);
  var logEndRef = useRef(null);
  var { toasts: modToasts, push: pushModToast } = useModerationToasts();

  function handleThresholdChange(key, value) {
    if (key === 'flagT') setFlagT(value);
    else if (key === 'muteT') setMuteT(value);
    else if (key === 'banT') setBanT(value);
    setThresholdSaved(false);
  }

  var { data: moderations = [], isLoading } = useQuery({
    queryKey: ['guardian-moderations'],
    queryFn: () => base44.entities.ContentModeration.list('-created_date', 60),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [moderations]);

  var displayLog = moderations.map(m => ({
    time: new Date(m.created_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    user: (m.content_id && m.content_id.slice(0, 12)) || 'unknown',
    msg:  m.ai_explanation || m.violation_type || '—',
    risk: m.ai_confidence || 0,
    action: m.action_taken === 'none' ? 'ALLOWED'
          : m.action_taken === 'flagged' ? 'FLAGGED'
          : (m.action_taken && m.action_taken.toUpperCase()) || 'FLAGGED',
  }));

  var violationCount = displayLog.filter(e => e.action !== 'ALLOWED').length;
  var allowedCount   = displayLog.filter(e => e.action === 'ALLOWED').length;
  var banCount       = displayLog.filter(e => e.action === 'BANNED').length;

  async function runScan() {
    setScanning(true);
    setScanStep('Fetching recent messages…');
    try {
      var messages = await base44.entities.Message.list('-created_date', 40);
      if (!messages.length) { toast.info('No messages to scan.'); setScanning(false); setScanStep(''); return; }

      setScanStep('Running Guardian AI analysis…');
      var scannedIds = new Set(moderations.map(m => m.content_id));
      var unscanned  = messages.filter(m => !scannedIds.has(m.id));
      if (!unscanned.length) { toast.info('All recent messages already scanned.'); setScanning(false); setScanStep(''); return; }

      var result = await base44.integrations.Core.InvokeLLM({
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
      var scanResults = (result && result.results) || [];
      await Promise.all(scanResults.map(r => {
        var action = r.violation_type !== 'safe'
          ? (r.ai_confidence >= banT / 100 ? 'banned' : r.ai_confidence >= muteT / 100 ? 'muted' : 'flagged')
          : 'none';
        return Promise.all([
          base44.entities.ContentModeration.create({
            content_type:    'message',
            content_id:      r.id,
            violation_type:  r.violation_type,
            ai_confidence:   r.ai_confidence,
            ai_explanation:  r.ai_explanation || null,
            action_taken:    action,
          }),
          base44.entities.GuardianLog.create({
            user_id:       r.user_id || null,
            message:       r.content || r.text || '',
            toxicity_score: Math.round((r.ai_confidence || 0) * 100),
            action,
            created_at:    new Date().toISOString(),
          }).catch(() => {}),
        ]);
      }));

      var violations = scanResults.filter(r => r.violation_type !== 'safe').length;
      scanResults.forEach(function(r) {
        if (r.violation_type !== 'safe') {
          var msg = messages.find(function(m) { return m.id === r.id; });
          var target = (msg && msg.user_name) || 'User';
          var actionType = r.ai_confidence >= banT / 100 ? 'ban' : r.ai_confidence >= muteT / 100 ? 'mute' : 'flag';
          pushModToast({ type: actionType, target: target, message: r.ai_explanation });
        }
      });
      toast.success(`Scanned ${scanResults.length} messages — ${violations} flagged`);
      queryClient.invalidateQueries({ queryKey: ['guardian-moderations'] });
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
            background: 'rgba(109,191,126,0.12)', border: '1px solid rgba(109,191,126,0.3)'
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ ...T, fontSize: 14, fontWeight: 900, color: GOLD, letterSpacing: '0.08em' }}>
              RISK THRESHOLDS
            </div>
            {thresholdSaved && (
              <span style={{ ...T, fontSize: 10, fontWeight: 700, color: GREEN, letterSpacing: '0.06em' }}>✓ SAVED</span>
            )}
          </div>
          {[
            { label: 'FLAG FOR REVIEW', key: 'flagT', value: flagT, color: WARN,   icon: Eye },
            { label: 'AUTO-MUTE',       key: 'muteT', value: muteT, color: ORANGE, icon: AlertTriangle },
            { label: 'AUTO-BAN',        key: 'banT',  value: banT,  color: RED,    icon: Ban },
          ].map(({ label, key, value, color, icon: Icon }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon style={{ width: 12, height: 12, color }} />
                  <span style={{ ...T, fontSize: 12, fontWeight: 900, color, letterSpacing: '0.05em' }}>{label}</span>
                </div>
                <span style={{ ...MONO, fontSize: 11, color, fontWeight: 700 }}>{value}%</span>
              </div>
              <RiskBar value={value} color={color} />
              <input
                type="range" min="0" max="100" value={value}
                onChange={e => handleThresholdChange(key, Number(e.target.value))}
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
            ) : displayLog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', ...MONO, fontSize: 11, color: TEXTM }}>
                No moderation events yet — click SCAN NOW to analyze recent messages
              </div>
            ) : displayLog.map((e, i) => {
              var cfg = ACTION_CONFIG[e.action] || ACTION_CONFIG.FLAGGED;
              var riskPct = Math.floor(e.risk * 100);
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
                var count = moderations.filter(m => m.violation_type === type).length;
                var pct   = moderations.length ? Math.round((count / moderations.length) * 100) : 0;
                var color = type === 'hate_speech' ? RED : type === 'harassment' ? ORANGE : type === 'spam' ? WARN : GOLD;
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
      <SwanAIRecommendations roomId={activeRoomId} currentLayout="ai" viewerCount={(activeRoom && activeRoom.viewer_count) || 0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={activeRoomId} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={(activeRoom && activeRoom.viewer_count) || 0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={activeRoomId} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={(activeRoom && activeRoom.viewer_count) || 0} peakViewers={(activeRoom && activeRoom.viewer_count) || 0} />
      {/* Creator Studios */}
      <div style={{ margin: '0 0 16px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
        <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
            { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
          ].map(function(s) {
            return (
              <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 2 }}>{s.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
            🎬 Launch Episode Creator Studio →
          </div>
        </Link>
      </div>
      <BackgroundCustomizer />
      <ModerationToast toasts={modToasts} />
    </div>
  );
}