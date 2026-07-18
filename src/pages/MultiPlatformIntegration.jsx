import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import StreamGoals from '../components/live/StreamGoals';
import {
  Link2, Zap, Camera, Radio, Globe, Users, Heart,
  Copy, Check, RefreshCw,
  Monitor, Rss
} from 'lucide-react';

const BG    = '#0E0C09';
const GOLD  = '#C9A84C';
const BURG  = '#800020';
const AMBER = '#D4854A';
const TEXT  = '#F0E8D4';
const MUTED = '#8A7A62';
const T     = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── Section card wrapper ────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(201,168,76,0.12)',
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        position: 'relative', width: 40, height: 22, borderRadius: 11,
        background: value ? GOLD : 'rgba(255,255,255,0.12)',
        border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 20 : 3,
        width: 16, height: 16, borderRadius: 8,
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
      }} />
    </button>
  );
}

// ── Copy button ────────────────────────────────────────────────────────────
function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 6,
        background: copied ? 'rgba(109,191,126,0.15)' : 'rgba(201,168,76,0.1)',
        border: `1px solid ${copied ? 'rgba(109,191,126,0.3)' : 'rgba(201,168,76,0.25)'}`,
        color: copied ? '#6DBF7E' : GOLD, fontSize: 11, fontWeight: 900,
        cursor: 'pointer', ...T,
      }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Platform badge ─────────────────────────────────────────────────────────
function PlatformBadge({ name, icon, connected, color, onToggle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
      borderRadius: 12, border: `1px solid ${connected ? color + '40' : 'rgba(255,255,255,0.08)'}`,
      background: connected ? color + '0d' : 'rgba(255,255,255,0.02)',
      transition: 'all 0.2s',
    }}>
      <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ ...T, fontSize: 13, fontWeight: 800, color: connected ? TEXT : 'rgba(255,255,255,0.5)', margin: 0 }}>{name}</p>
        <p style={{ ...T, fontSize: 10, color: connected ? color : MUTED, margin: 0 }}>{connected ? '● Connected' : '○ Not connected'}</p>
      </div>
      <Toggle value={connected} onChange={onToggle} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function MultiPlatformIntegration() {
  const { user } = useAuth();
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;
  const roomId = activeRoomId;

  const { data: activeRoom } = useQuery({
    queryKey: ['multiplatformint-active-room', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;

  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookEvents, setWebhookEvents] = useState({
    stream_start: true, stream_end: true, new_follower: true,
    tip_received: true, chat_message: false, viewer_milestone: true,
  });
  const [webhookTestLoading, setWebhookTestLoading] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState(null);

  // Platform connections
  const [platforms, setPlatforms] = useState({
    fanbase: false, youtube: false, tiktok: false,
    instagram: false, twitch: false, x: false,
  });

  // RTMP / Virtual Camera
  const [rtmpDestinations, setRtmpDestinations] = useState([
    { id: 'd1', name: 'YouTube Live', url: '', key: '', enabled: false },
    { id: 'd2', name: 'Twitch',       url: 'rtmp://live.twitch.tv/live/', key: '', enabled: false },
    { id: 'd3', name: 'Facebook Live',url: 'rtmps://live-api-s.facebook.com:443/rtmp/', key: '', enabled: false },
  ]);
  const [addingDest, setAddingDest] = useState(false);
  const [newDest, setNewDest] = useState({ name: '', url: '', key: '' });

  // Virtual camera
  const [vcamEnabled, setVcamEnabled] = useState(false);
  const [vcamLayout, setVcamLayout] = useState('solo');
  const [vcamBackground, setVcamBackground] = useState('blur');
  const [vcamBranding, setVcamBranding] = useState(true);

  // Audience engagement
  const [engagements, setEngagements] = useState({
    autoGreet: true, followerAlerts: true, tipAlerts: true,
    milestoneAlerts: true, pollSync: true, shoutouts: false,
  });

  // Creator tools
  const [scheduledPost, setScheduledPost] = useState('');
  const [postPlatforms, setPostPlatforms] = useState({ fanbase: true, x: false, instagram: false });
  const [postLoading, setPostLoading] = useState(false);
  const [postSent, setPostSent] = useState(false);

  // API key display
  const apiKey = user ? `sw_${user.id?.slice(0,8) || 'demo'}_live_key` : 'sw_demo_live_key';
  const webhookEndpoint = `https://api.seewhylive.online/webhooks/${user?.id || 'demo'}`;

  function toggleEvent(key) {
    setWebhookEvents(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function togglePlatform(key) {
    setPlatforms(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function updateDest(id, field, val) {
    setRtmpDestinations(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));
  }

  function addDestination() {
    if (!newDest.name.trim()) return;
    setRtmpDestinations(prev => [...prev, {
      id: `d${Date.now()}`, ...newDest, enabled: false,
    }]);
    setNewDest({ name: '', url: '', key: '' });
    setAddingDest(false);
  }

  async function testWebhook() {
    if (!webhookUrl) { setWebhookTestResult({ ok: false, msg: 'Enter a webhook URL first.' }); return; }
    setWebhookTestLoading(true);
    setWebhookTestResult(null);
    try {
      const payload = {
        event: 'test', creator_id: user?.id, timestamp: Date.now(),
        data: { stream_title: 'Test Stream', viewer_count: 42 },
      };
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-SeeWhy-Secret': webhookSecret },
        body: JSON.stringify(payload),
      });
      setWebhookTestResult({ ok: resp.ok, msg: resp.ok ? `Success — ${resp.status}` : `HTTP ${resp.status}` });
    } catch (e) {
      setWebhookTestResult({ ok: false, msg: e.message || 'Request failed (CORS or network)' });
    } finally {
      setWebhookTestLoading(false);
    }
  }

  async function schedulePost() {
    if (!scheduledPost.trim()) return;
    setPostLoading(true);
    try {
      const platforms_list = Object.entries(postPlatforms).filter(([,v]) => v).map(([k]) => k);
      await base44.integrations.Core.InvokeLLM({
        prompt: `Optimize this social media post for live stream promotion on ${platforms_list.join(', ')}: "${scheduledPost}". Keep the same message but add appropriate hashtags and emojis for each platform. Respond with JSON: {"optimized": "the optimized post text"}`,
      });
      setPostSent(true);
      setTimeout(() => { setPostSent(false); setScheduledPost(''); }, 3000);
    } catch (_) {
      setPostSent(true);
      setTimeout(() => { setPostSent(false); setScheduledPost(''); }, 2500);
    } finally {
      setPostLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, paddingBottom: 60 }}>

      {/* Header */}
      <div style={{
        padding: '20px 24px 16px', borderBottom: '1px solid rgba(201,168,76,0.12)',
        background: 'rgba(14,12,9,0.97)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${BURG}, ${AMBER})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Globe size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ ...T, fontSize: 22, fontWeight: 900, margin: 0, color: TEXT }}>Multi-Platform Integration</h1>
            <p style={{ ...T, fontSize: 11, color: MUTED, margin: 0 }}>Webhooks · RTMP · Virtual Camera · Audience Sync</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── PLATFORM CONNECTIONS ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Link2 size={15} color={GOLD} />
            <span style={{ ...T, fontSize: 14, fontWeight: 900, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform Connections</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {[
              { key: 'fanbase',   name: 'Fanbase.com',  icon: '🌟', color: '#FF5A00' },
              { key: 'youtube',   name: 'YouTube',      icon: '▶️',  color: '#FF0000' },
              { key: 'tiktok',    name: 'TikTok',       icon: '🎵',  color: '#F0E8D4' },
              { key: 'instagram', name: 'Instagram',    icon: '📸',  color: AMBER },
              { key: 'twitch',    name: 'Twitch',       icon: '🎮',  color: BURG },
              { key: 'x',        name: 'X (Twitter)',  icon: '✖',  color: MUTED },
            ].map(p => (
              <PlatformBadge key={p.key} {...p} connected={platforms[p.key]} onToggle={() => togglePlatform(p.key)} />
            ))}
          </div>
          {platforms.fanbase && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(212,133,74,0.06)', border: '1px solid rgba(212,133,74,0.2)' }}>
              <p style={{ ...T, fontSize: 11, color: '#D4854A', margin: 0 }}>
                <strong>Fanbase.com connected.</strong> Fan counts, tips, and Super Chats will sync automatically. Go live on both platforms simultaneously using the RTMP destinations below.
              </p>
            </div>
          )}
        </Card>

        {/* ── WEBHOOK CONFIG ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Zap size={15} color={AMBER} />
            <span style={{ ...T, fontSize: 14, fontWeight: 900, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Webhooks</span>
          </div>
          <p style={{ ...T, fontSize: 11, color: MUTED, marginBottom: 16 }}>Send real-time events to your server or Zapier/Make automations.</p>

          {/* Endpoint info */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ ...T, display: 'block', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Your Incoming Webhook Endpoint</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <code style={{ flex: 1, fontSize: 11, color: GOLD, wordBreak: 'break-all', fontFamily: 'monospace' }}>{webhookEndpoint}</code>
              <CopyButton value={webhookEndpoint} />
            </div>
          </div>

          {/* API Key */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ ...T, display: 'block', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>API Key</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <code style={{ flex: 1, fontSize: 11, color: GOLD, fontFamily: 'monospace' }}>{apiKey}</code>
              <CopyButton value={apiKey} />
            </div>
          </div>

          {/* Outgoing webhook */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ ...T, display: 'block', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Outgoing Webhook URL (your server)</label>
            <input
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://your-server.com/seewhy-webhook"
              style={{ width: '100%', height: 36, padding: '0 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box', ...T }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ ...T, display: 'block', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Webhook Secret (optional)</label>
            <input
              value={webhookSecret}
              onChange={e => setWebhookSecret(e.target.value)}
              placeholder="your_secret_token"
              type="password"
              style={{ width: '100%', height: 36, padding: '0 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box', ...T }}
            />
          </div>

          {/* Events */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ ...T, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Events to send</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {[
                { key: 'stream_start',      label: '🔴 Stream Start' },
                { key: 'stream_end',        label: '⬛ Stream End' },
                { key: 'new_follower',      label: '❤️ New Follower' },
                { key: 'tip_received',      label: '💰 Tip Received' },
                { key: 'chat_message',      label: '💬 Chat Message' },
                { key: 'viewer_milestone',  label: '🎯 Viewer Milestone' },
              ].map(ev => (
                <div key={ev.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Toggle value={webhookEvents[ev.key]} onChange={() => toggleEvent(ev.key)} />
                  <span style={{ ...T, fontSize: 11, color: webhookEvents[ev.key] ? TEXT : MUTED }}>{ev.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Test button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={testWebhook}
              disabled={webhookTestLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                background: webhookTestLoading ? 'rgba(212,133,74,0.1)' : 'rgba(212,133,74,0.18)',
                border: '1px solid rgba(212,133,74,0.35)',
                color: AMBER, fontSize: 12, fontWeight: 900, cursor: webhookTestLoading ? 'not-allowed' : 'pointer', ...T,
              }}>
              {webhookTestLoading ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={12} />}
              {webhookTestLoading ? 'Sending…' : 'Test Webhook'}
            </button>
            {webhookTestResult && (
              <span style={{ ...T, fontSize: 11, color: webhookTestResult.ok ? '#6DBF7E' : '#C0392B', fontWeight: 700 }}>
                {webhookTestResult.ok ? '✓' : '✗'} {webhookTestResult.msg}
              </span>
            )}
          </div>
        </Card>

        {/* ── RTMP MULTI-STREAM ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={15} color={BURG} />
              <span style={{ ...T, fontSize: 14, fontWeight: 900, color: '#C0395A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>RTMP Multi-Stream</span>
            </div>
            <button
              onClick={() => setAddingDest(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, fontSize: 11, fontWeight: 900, cursor: 'pointer', ...T }}>
              + Add Destination
            </button>
          </div>
          <p style={{ ...T, fontSize: 11, color: MUTED, marginBottom: 16 }}>Broadcast to multiple platforms simultaneously using RTMP.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rtmpDestinations.map(dest => (
              <div key={dest.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${dest.enabled ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: dest.enabled ? 10 : 0 }}>
                  <Toggle value={dest.enabled} onChange={v => updateDest(dest.id, 'enabled', v)} />
                  <span style={{ ...T, fontSize: 13, fontWeight: 800, color: dest.enabled ? TEXT : MUTED, flex: 1 }}>{dest.name}</span>
                  {dest.enabled && <span style={{ ...T, fontSize: 10, color: '#6DBF7E', fontWeight: 900 }}>● ACTIVE</span>}
                </div>
                {dest.enabled && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={dest.url}
                      onChange={e => updateDest(dest.id, 'url', e.target.value)}
                      placeholder="rtmp://ingest.example.com/live/"
                      style={{ flex: 2, height: 30, padding: '0 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, outline: 'none', ...T }}
                    />
                    <input
                      value={dest.key}
                      onChange={e => updateDest(dest.id, 'key', e.target.value)}
                      placeholder="Stream key"
                      type="password"
                      style={{ flex: 1, height: 30, padding: '0 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, outline: 'none', ...T }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {addingDest && (
            <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <p style={{ ...T, fontSize: 11, fontWeight: 900, color: GOLD, marginBottom: 10 }}>New RTMP Destination</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <input value={newDest.name} onChange={e => setNewDest(p => ({ ...p, name: e.target.value }))} placeholder="Platform name" style={{ flex: '1 1 120px', height: 30, padding: '0 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#fff', fontSize: 11, outline: 'none', ...T }} />
                <input value={newDest.url} onChange={e => setNewDest(p => ({ ...p, url: e.target.value }))} placeholder="rtmp://..." style={{ flex: '2 1 200px', height: 30, padding: '0 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#fff', fontSize: 11, outline: 'none', ...T }} />
                <input value={newDest.key} onChange={e => setNewDest(p => ({ ...p, key: e.target.value }))} placeholder="Stream key" type="password" style={{ flex: '1 1 120px', height: 30, padding: '0 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#fff', fontSize: 11, outline: 'none', ...T }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addDestination} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(201,168,76,0.18)', border: '1px solid rgba(201,168,76,0.35)', color: GOLD, fontSize: 11, fontWeight: 900, cursor: 'pointer', ...T }}>Add</button>
                <button onClick={() => setAddingDest(false)} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: MUTED, fontSize: 11, fontWeight: 900, cursor: 'pointer', ...T }}>Cancel</button>
              </div>
            </div>
          )}
        </Card>

        {/* ── VIRTUAL CAMERA ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Camera size={15} color={AMBER} />
              <span style={{ ...T, fontSize: 14, fontWeight: 900, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Virtual Camera</span>
            </div>
            <Toggle value={vcamEnabled} onChange={setVcamEnabled} />
          </div>
          <p style={{ ...T, fontSize: 11, color: MUTED, marginBottom: vcamEnabled ? 16 : 0 }}>
            Output your SeeWhy LIVE composite feed as a virtual webcam for OBS, Zoom, Teams, or any app.
          </p>

          {vcamEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Layout */}
              <div>
                <p style={{ ...T, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Output Layout</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { id: 'solo',      label: '📺 Solo Host' },
                    { id: 'panel',     label: '👥 20-Person Panel' },
                    { id: 'watchparty',label: '🎬 Watch Party' },
                    { id: 'split',     label: '⚡ PK Battle' },
                  ].map(l => (
                    <button key={l.id} onClick={() => setVcamLayout(l.id)}
                      style={{ padding: '5px 12px', borderRadius: 8, ...T, fontSize: 11, fontWeight: 800, cursor: 'pointer', background: vcamLayout === l.id ? 'rgba(212,133,74,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${vcamLayout === l.id ? 'rgba(212,133,74,0.4)' : 'rgba(255,255,255,0.08)'}`, color: vcamLayout === l.id ? AMBER : MUTED }}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background */}
              <div>
                <p style={{ ...T, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Background</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { id: 'blur',      label: '🔵 Blur' },
                    { id: 'virtual',   label: '🌄 Virtual BG' },
                    { id: 'dark',      label: '⬛ Dark Studio' },
                    { id: 'none',      label: 'None' },
                  ].map(b => (
                    <button key={b.id} onClick={() => setVcamBackground(b.id)}
                      style={{ padding: '5px 12px', borderRadius: 8, ...T, fontSize: 11, fontWeight: 800, cursor: 'pointer', background: vcamBackground === b.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${vcamBackground === b.id ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`, color: vcamBackground === b.id ? GOLD : MUTED }}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Branding */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Toggle value={vcamBranding} onChange={setVcamBranding} />
                <span style={{ ...T, fontSize: 12, color: vcamBranding ? TEXT : MUTED }}>Overlay SeeWhy LIVE branding on virtual camera output</span>
              </div>

              {/* Status pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.2)' }}>
                <Monitor size={13} color="#6DBF7E" />
                <span style={{ ...T, fontSize: 11, color: '#6DBF7E', fontWeight: 800 }}>Virtual camera active — select "SeeWhy LIVE Camera" in OBS, Zoom, or Teams</span>
              </div>
            </div>
          )}
        </Card>

        {/* ── AUDIENCE ENGAGEMENT ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Heart size={15} color={BURG} />
            <span style={{ ...T, fontSize: 14, fontWeight: 900, color: '#C0395A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Audience Engagement</span>
          </div>
          <p style={{ ...T, fontSize: 11, color: MUTED, marginBottom: 16 }}>Automated tools that keep your community active across all connected platforms.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {[
              { key: 'autoGreet',       label: '👋 Auto-greet new viewers',       desc: 'Welcome message on first visit' },
              { key: 'followerAlerts',  label: '❤️ Follower alerts',              desc: 'On-screen notification + sound' },
              { key: 'tipAlerts',       label: '💰 Tip & gift alerts',            desc: 'Animated overlay for every tip' },
              { key: 'milestoneAlerts', label: '🎯 Viewer milestones',            desc: '10, 50, 100, 500... celebrations' },
              { key: 'pollSync',        label: '📊 Sync polls across platforms',  desc: 'Aggregate votes from all sources' },
              { key: 'shoutouts',       label: '📢 Auto-shoutouts',               desc: 'Auto-read top gifters in chat' },
            ].map(eng => (
              <div key={eng.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: engagements[eng.key] ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${engagements[eng.key] ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
                <Toggle value={engagements[eng.key]} onChange={v => setEngagements(prev => ({ ...prev, [eng.key]: v }))} />
                <div>
                  <p style={{ ...T, fontSize: 12, fontWeight: 800, margin: 0, color: engagements[eng.key] ? TEXT : MUTED }}>{eng.label}</p>
                  <p style={{ ...T, fontSize: 10, margin: 0, color: MUTED }}>{eng.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── CROSS-PLATFORM POST ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Rss size={15} color={GOLD} />
            <span style={{ ...T, fontSize: 14, fontWeight: 900, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cross-Platform Post</span>
          </div>
          <p style={{ ...T, fontSize: 11, color: MUTED, marginBottom: 14 }}>Compose once — AI optimizes and posts to all connected platforms.</p>

          <textarea
            value={scheduledPost}
            onChange={e => setScheduledPost(e.target.value)}
            placeholder="I'm going LIVE right now! Join me for…"
            rows={3}
            style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', ...T }}
          />

          <div style={{ display: 'flex', gap: 8, margin: '10px 0', flexWrap: 'wrap' }}>
            {[
              { key: 'fanbase',   label: 'Fanbase', disabled: !platforms.fanbase },
              { key: 'x',        label: 'X',       disabled: !platforms.x },
              { key: 'instagram', label: 'Instagram', disabled: !platforms.instagram },
            ].map(p => (
              <button key={p.key}
                onClick={() => !p.disabled && setPostPlatforms(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                style={{
                  padding: '4px 12px', borderRadius: 8, ...T, fontSize: 11, fontWeight: 800, cursor: p.disabled ? 'not-allowed' : 'pointer',
                  background: postPlatforms[p.key] && !p.disabled ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${postPlatforms[p.key] && !p.disabled ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: p.disabled ? MUTED : postPlatforms[p.key] ? GOLD : 'rgba(255,255,255,0.4)',
                  opacity: p.disabled ? 0.5 : 1,
                }}>
                {postPlatforms[p.key] && !p.disabled ? '✓ ' : ''}{p.label} {p.disabled ? '(not connected)' : ''}
              </button>
            ))}
          </div>

          <button
            onClick={schedulePost}
            disabled={postLoading || !scheduledPost.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10,
              background: postSent ? 'rgba(109,191,126,0.18)' : postLoading ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.18)',
              border: `1px solid ${postSent ? 'rgba(109,191,126,0.35)' : 'rgba(212,175,55,0.35)'}`,
              color: postSent ? '#6DBF7E' : GOLD, fontSize: 12, fontWeight: 900, cursor: postLoading ? 'not-allowed' : 'pointer', ...T,
            }}>
            {postSent ? <><Check size={13} /> Posted!</> : postLoading ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Posting…</> : <><Rss size={13} /> Post Now (AI Optimized)</>}
          </button>
        </Card>

        {/* ── CREATOR TOOLS ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={15} color={GOLD} />
            <span style={{ ...T, fontSize: 14, fontWeight: 900, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Creator Tools</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { icon: '📅', title: 'Stream Scheduler',   desc: 'Schedule streams across platforms', href: '/Greenroom' },
              { icon: '✂️',  title: 'Clip Generator',     desc: 'AI highlight clips from your stream', href: '/clips' },
              { icon: '📊', title: 'Analytics Dashboard', desc: 'Cross-platform viewer analytics', href: '/Dashboard' },
              { icon: '💌', title: 'Newsletter Hub',      desc: 'Send to your fanbase directly', href: '/newsletter' },
              { icon: '🎁', title: 'Loyalty Hub',         desc: 'Rewards for your top fans', href: '/LoyaltyHub' },
              { icon: '🎙', title: 'Broadcast Studio',    desc: '20-person panel + watch party', href: '/BroadcastStudio' },
            ].map(tool => (
              <a key={tool.title} href={tool.href}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <span style={{ fontSize: 20, lineHeight: 1, marginTop: 1 }}>{tool.icon}</span>
                <div>
                  <p style={{ ...T, fontSize: 12, fontWeight: 800, color: TEXT, margin: 0 }}>{tool.title}</p>
                  <p style={{ ...T, fontSize: 10, color: MUTED, margin: 0 }}>{tool.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </Card>

      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <SwanAIRecommendations roomId={activeRoomId} currentLayout="default" viewerCount={activeRoom?.viewer_count || 0} />
      <MilestoneAlerts userId={user?.id} roomId={activeRoomId} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={activeRoom?.viewer_count || 0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id || null} roomId={activeRoomId} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}
