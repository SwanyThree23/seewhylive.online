import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Table, FileSpreadsheet, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import BroadcastAnalyticsDashboard from '../components/streaming/BroadcastAnalyticsDashboard';
import PerformanceDashboard from '../components/streaming/PerformanceDashboard';
import AudienceInsights from '../components/dashboard/AudienceInsights';
import EarningsBreakdown from '../components/dashboard/EarningsBreakdown';
import ShareToSocial from '../components/social/ShareToSocial';
import StreamAnalyticsDashboard from '../components/streaming/StreamAnalyticsDashboard';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CreatorBridge from '../components/social/CreatorBridge';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import ContentRecommendations from '../components/social/ContentRecommendations';

var BG = '#080B18';
var GOLD = '#D4AF37';
var CRIMSON = '#800020';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };

function downloadCSV(filename, data) {
  if (!data.length) return;
  var headers = Object.keys(data[0]);
  var rows = data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','));
  var csv = [headers.join(','), ...rows].join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(filename, data) {
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(title, data) {
  var doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(9);
  var y = 32;
  if (!data.length) {
    doc.text('No data available.', 14, y);
  } else {
    var headers = Object.keys(data[0]);
    var colW = Math.min(40, Math.floor(180 / headers.length));
    doc.setFont(undefined, 'bold');
    headers.forEach((h, i) => doc.text(String(h).slice(0, 14), 14 + i * colW, y));
    doc.setFont(undefined, 'normal');
    y += 6;
    data.slice(0, 60).forEach(row => {
      if (y > 270) { doc.addPage(); y = 20; }
      headers.forEach((h, i) => doc.text(String(row[h] || '').slice(0, 14), 14 + i * colW, y));
      y += 6;
    });
  }
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

var EXPORT_SETS = [
  { id: 'activity', label: 'Activity History', description: 'All your platform activities and events', entity: 'Activity', filterKey: 'user_id', accentColor: '#4A8A7A' },
  { id: 'subscriptions', label: 'My Subscriptions', description: 'Your active and past creator subscriptions', entity: 'Subscription', filterKey: 'user_id', accentColor: '#D4AF37' },
  { id: 'notifications', label: 'Notifications', description: 'Your notification history', entity: 'Notification', filterKey: 'user_id', accentColor: GOLD },
  { id: 'transactions', label: 'Transactions', description: 'All tips, purchases, and payments', entity: 'Transaction', filterKey: 'user_id', accentColor: '#6DBF7E' },
];

export default function DataExportPage() {
  var [loading, setLoading] = useState({});
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);


  var { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  var { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', (user && user.id)],
    queryFn: () => base44.entities.Room.filter({ host_id: (user && user.id), status: 'live' }).then(r => r[0] || null),
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoomId = (activeRoom && activeRoom.id) || null;

  var handleExport = async (set, format) => {
    var key = `${set.id}-${format}`;
    setLoading(l => ({ ...l, [key]: true }));
    try {
      var data = await base44.entities[set.entity].filter({ [set.filterKey]: (user && user.id) });
      var filename = `${set.label.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
      if (format === 'csv') downloadCSV(`${filename}.csv`, data);
      else if (format === 'json') downloadJSON(`${filename}.json`, data);
      else if (format === 'pdf') downloadPDF(set.label, data);
      toast.success(`${set.label} exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    }
    setLoading(l => ({ ...l, [key]: false }));
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <Download className="w-5 h-5" style={{ color: GOLD }} />
        <div>
          <h1 className="text-xl font-black text-white leading-none" style={T}>Export My Data</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Download your data for record keeping and analysis</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6 space-y-4">
        {EXPORT_SETS.map(set => (
          <div key={set.id} className="rounded-2xl p-5"
            style={{ background: 'rgba(8,11,24,0.9)', border: `1px solid rgba(212,175,55,0.1)` }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-black text-sm text-white" style={T}>{set.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{set.description}</p>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
                style={{ ...T, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }}>
                Personal Data
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { format: 'csv', icon: Table, label: 'CSV' },
                { format: 'json', icon: FileText, label: 'JSON' },
                { format: 'pdf', icon: FileSpreadsheet, label: 'PDF' },
              ].map(({ format, icon: Icon, label }) => {
                var key = `${set.id}-${format}`;
                var isLoading = loading[key];
                return (
                  <button key={format}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase text-[10px] transition-all"
                    disabled={isLoading || !user}
                    onClick={() => handleExport(set, format)}
                    style={{ ...T, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: isLoading || !user ? 'rgba(255,255,255,0.2)' : set.accentColor, cursor: isLoading || !user ? 'default' : 'pointer' }}>
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                    Export {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Privacy note */}
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(13,6,24,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#6DBF7E' }} />
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            All exports contain only <strong style={{ color: 'rgba(255,255,255,0.6)' }}>your own data</strong>. Files are generated locally in your browser and never sent to any server.
          </p>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
          <BroadcastAnalyticsDashboard streamSession={activeRoom || null} isLive={!!activeRoomId} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          {[
            { label: '← Settings',           href: 'Settings'          },
            { label: '📊 Analytics',          href: 'Analytics'         },
            { label: '📈 Adv. Analytics',     href: 'AdvancedAnalytics' },
            { label: '💰 Monetization',       href: 'Monetization'      },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
          <PerformanceDashboard roomId={activeRoomId} sessionId={activeRoomId} />
          <AudienceInsights creatorId={(user && user.id) || null} />
          <EarningsBreakdown creatorId={(user && user.id) || null} />
          <ShareToSocial content={{ title: 'Export Data', url: window.location.href }} />
          <StreamAnalyticsDashboard roomId={activeRoomId} isHost={true} isLive={!!activeRoomId} />
          <OnlineUsersGrid compact maxVisible={8} />
          <CollaborationMatcher />
          <StreamHealthDashboard roomId={activeRoomId} isHost={true} />
        </div>
      </div>
      <SwanAIRecommendations roomId={activeRoomId} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={activeRoomId} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={activeRoomId} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
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
    </div>
  );
}
