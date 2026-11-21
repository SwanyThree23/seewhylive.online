import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOpenRouter } from '../hooks/useOpenRouter';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import CreatorBridge from '../components/social/CreatorBridge';
import ContentRecommendations from '../components/social/ContentRecommendations';

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
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

var BG     = '#080B18';
var BG2    = '#0D1022';
var BG3    = '#13182C';
var GOLD   = '#D4AF37';
var CRIMSON= '#800020';
var AMBER  = '#D4854A';
var CYAN   = '#4A8A7A';
var PURPLE = '#7B5DA6';
var BLUE   = '#5B7FA6';
var RED2   = '#C62828';
var T      = { fontFamily: 'Barlow Condensed, sans-serif' };

var QUICK_PROMPTS = {
  svs_bracket:      ['WA vs TX State Championship — Sunday at Jamar\'s Sports Bar', 'Southeast Regional Final — FL vs GA — Double Elimination', 'National Qualifier — Opening Round — 8 States competing'],
  tribute_card:     ['Domino legend — state, years, achievements', 'Community pioneer — region, legacy, impact', 'Tournament champion — format, titles, honors'],
  stream_overlay:   ['SeeWhy LIVE tournament — gold & crimson domino theme', 'Podcast interview — dual speakers, Barlow Condensed headlines', 'LIVE NOW alert lower-third — breaking broadcast style'],
  podcast_cover:    ['Domino culture deep dive — dark studio, gold accents', 'AI Live Streaming future — tech theme, cyan gradients', 'Creator economy special — community & money vibes'],
  music_promo:      ['New AI-generated beat drop — trap/chill hybrid release', 'Community remix challenge — open collab call', 'SeeWhy LIVE music showcase playlist announcement'],
  tournament_flyer: ['State vs State WA Classic — July 4 at Jamar\'s Sports Bar, Des Moines WA', 'Open Invitational — $2,500 prize pool — all states welcome', 'Tribute Gaming Event — Community Memorial Fund'],
};

var FORGE_TYPES = [
  { id: 'svs_bracket',     label: 'SVS Bracket Graphic',      icon: '⚔️', color: BLUE },
  { id: 'tribute_card',    label: 'Tribute Memorial Card',     icon: '🕊️', color: '#800020' },
  { id: 'stream_overlay',  label: 'Stream Overlay Pack',       icon: '🎥', color: GOLD },
  { id: 'podcast_cover',   label: 'Podcast Cover Art',         icon: '🎙️', color: CYAN },
  { id: 'music_promo',     label: 'Music Release Promo',       icon: '🎵', color: PURPLE },
  { id: 'tournament_flyer',label: 'Tournament Flyer',          icon: '🏆', color: AMBER },
];

var GEN_STEPS = [
  'Analyzing brand tokens…',
  'Crafting headline copy…',
  'Selecting color palette…',
  'Writing layout notes…',
  'Finalizing creative brief…',
];

function Tag({ label, color }) {
  return (
    <span style={{
      background: (color || GOLD) + '22', color: color || GOLD,
      border: `1px solid ${(color || GOLD)}44`,
      borderRadius: 999, padding: '2px 9px',
      fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
      whiteSpace: 'nowrap', ...T,
    }}>{label}</span>
  );
}

function Swatch({ hex }) {
  return (
    <div title={hex} style={{
      width: 22, height: 22, borderRadius: 5, background: hex,
      border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0,
    }} />
  );
}

export default function INSForge() {
  var qc = useQueryClient();
  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  var { invoke: invokeAI, hasKey: hasOpenRouterKey } = useOpenRouter();
  var [selected, setSelected] = useState(null);
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);

  var [prompt, setPrompt] = useState('');
  var [loading, setLoading] = useState(false);
  var [genStep, setGenStep] = useState(0);
  var [result, setResult] = useState(null);
  var [error, setError] = useState(null);
  var [copied, setCopied] = useState(false);
  var [briefSaved, setBriefSaved] = useState(false);

  var { data: recentBriefs = [] } = useQuery({
    queryKey: ['insforge-briefs', (user && user.id)],
    queryFn: () => base44.entities.Activity.filter({ user_id: user.id, type: 'brief_generated' }, '-created_at', 5),
    enabled: !!(user && user.id),
  });

  var { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  var { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', (currentUser && currentUser.id)],
    queryFn: () => base44.entities.Room.filter({ host_id: (currentUser && currentUser.id), status: 'live' }).then(r => r[0] || null),
    enabled: !!(currentUser && currentUser.id),
    refetchInterval: 30000,
  });
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', (currentUser && currentUser.id)],
    queryFn: () => base44.entities.Community.filter({ owner_id: (currentUser && currentUser.id) }).then(r => r[0] || null),
    enabled: !!(currentUser && currentUser.id),
  });
  var userCommunityId = (userCommunity && userCommunity.id) || null;

  function copyBrief() {
    if (!result) return;
    var text = [
      `ASSET: ${result.title || (selected && selected.label)}`,
      `HEADLINE: ${result.headline}`,
      result.subline ? `SUBLINE: ${result.subline}` : '',
      (result.copy_lines && result.copy_lines.length) ? `COPY:\n${result.copy_lines.map(l => `  • ${l}`).join('\n')}` : '',
      result.layout_notes ? `LAYOUT: ${result.layout_notes}` : '',
      (result.color_palette && result.color_palette.length) ? `PALETTE: ${result.color_palette.join(', ')}` : '',
      result.cta ? `CTA: ${result.cta}` : '',
      result.dimensions ? `SIZE: ${result.dimensions}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  async function generate() {
    if (!selected || !prompt.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    var stepInterval;

    try {
      var step = 0;
      stepInterval = setInterval(() => {
        step = (step + 1) % GEN_STEPS.length;
        setGenStep(step);
      }, 480);

      var rawText = await invokeAI({
        prompt: `Asset Type: ${selected.label}
Creative Brief: "${prompt}"
Brand Context: SeeWhy LIVE — dark backgrounds (#080B18), gold (#D4AF37) accents, crimson (#800020) brand, Barlow Condensed / Bebas Neue display fonts, broadcast & domino culture aesthetic.

Generate a complete creative brief for this asset. Respond ONLY with valid JSON (no markdown, no fences):
{
  "title": "asset title",
  "headline": "primary headline text",
  "subline": "secondary supporting text",
  "copy_lines": ["line1", "line2", "line3"],
  "color_palette": ["#hex1", "#hex2", "#hex3"],
  "layout_notes": "description of layout / composition",
  "cta": "call to action text",
  "brand_elements": ["element1", "element2", "element3"],
  "dimensions": "recommended dimensions"
}`,
        systemPrompt: 'You are the SeeWhy LIVE INS Forge — an AI creative asset generator for SwanyThree EntTech LLC. Always respond with valid JSON only.',
        jsonMode: true,
        maxTokens: 1024,
      });

      clearInterval(stepInterval);
      var parsed = typeof rawText === 'string' ? JSON.parse(rawText) : rawText;
      setResult(parsed);
    } catch (e) {
      clearInterval(stepInterval);
      setError('Failed to generate. Try again.');
    }
    setLoading(false);
  }

  function reset() {
    setResult(null);
    setPrompt('');
    setSelected(null);
    setError(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '16px 16px 96px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <a href="/AIHub" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10 }} aria-label="Back to AI Hub">
          ← AI Hub
        </a>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 28, color: GOLD, letterSpacing: 3 }}>
            ⚡ INS FORGE
          </div>
          <Tag label="AI-Powered" color={AMBER} />
        </div>
        <div style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          Influence Network Syndication — AI creative brief generator for SeeWhy LIVE branded assets.
        </div>
      </div>

      {/* Asset type grid */}
      <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
        Choose Asset Type
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
        {FORGE_TYPES.map(t => {
          var active = selected && selected.id === t.id;
          return (
            <div key={t.id} onClick={() => { setSelected(active ? null : t); setResult(null); setError(null); }}
              style={{
                background: active ? `${t.color}22` : BG3,
                border: `1px solid ${active ? t.color + '88' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'all .15s',
              }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ ...T, fontSize: 12, color: active ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: 700, lineHeight: 1.3 }}>
                {t.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Prompt input */}
      {selected && !result && (
        <div style={{ background: BG3, border: `1px solid ${selected.color}44`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 15, color: selected.color, marginBottom: 10, letterSpacing: 1 }}>
            {selected.icon} {selected.label.toUpperCase()}
          </div>
          <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            Creative Brief
          </div>

          {/* Quick preset chips */}
          {QUICK_PROMPTS[selected.id] && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
              <div style={{ ...T, fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Quick start</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {QUICK_PROMPTS[selected.id].map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    style={{
                      ...T, fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                      background: prompt === p ? `${selected.color}22` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${prompt === p ? selected.color + '66' : 'rgba(255,255,255,0.1)'}`,
                      color: prompt === p ? selected.color : 'rgba(255,255,255,0.45)',
                      cursor: 'pointer', textAlign: 'left', letterSpacing: '0.02em',
                      transition: 'all 0.15s',
                    }}
                  >
                    {p.length > 42 ? p.slice(0, 42) + '…' : p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder={`Describe your ${selected.label} — event details, theme, names, vibe…`}
            rows={3}
            style={{
              width: '100%', background: BG2, border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 8, padding: '10px 12px', color: '#fff', ...T, fontSize: 13,
              outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12,
            }}
          />
          {error && (
            <div style={{ ...T, fontSize: 12, color: '#D4854A', marginBottom: 10 }}>{error}</div>
          )}
          <button onClick={generate} disabled={loading || !prompt.trim()} style={{
            width: '100%', padding: '13px 0', borderRadius: 10, border: 'none', cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            background: loading || !prompt.trim() ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${selected.color}, ${selected.color}AA)`,
            color: loading || !prompt.trim() ? 'rgba(255,255,255,0.3)' : '#000',
            ...T, fontSize: 15, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
            transition: 'all .15s',
          }}>
            {loading ? GEN_STEPS[genStep] : `⚡ FORGE ASSET`}
          </button>
        </div>
      )}

      {/* Result */}
      {result && selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: `linear-gradient(135deg, ${selected.color}18, ${BG3})`,
            border: `1px solid ${selected.color}55`, borderRadius: 14, padding: 18,
          }}>
            {/* Title + dimensions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 20, color: selected.color, letterSpacing: 1, lineHeight: 1 }}>
                  {result.title || 'CREATIVE ASSET'}
                </div>
                <div style={{ ...T, fontSize: 15, color: '#fff', fontWeight: 700, marginTop: 4 }}>
                  {result.headline}
                </div>
                {result.subline && (
                  <div style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {result.subline}
                  </div>
                )}
              </div>
              {result.dimensions && (
                <Tag label={result.dimensions.split(' ')[0]} color={selected.color} />
              )}
            </div>

            {/* Copy lines */}
            {result.copy_lines && result.copy_lines.length > 0 && (
              <div style={{ background: BG2, borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                  Copy Lines
                </div>
                {result.copy_lines.map((line, i) => (
                  <div key={i} style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, paddingLeft: 10, borderLeft: `2px solid ${selected.color}55`, marginBottom: 3 }}>
                    {line}
                  </div>
                ))}
              </div>
            )}

            {/* Layout notes */}
            {result.layout_notes && (
              <div style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', marginBottom: 10 }}>
                📐 {result.layout_notes}
              </div>
            )}

            {/* Color palette */}
            {result.color_palette && result.color_palette.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' }}>Palette</span>
                {result.color_palette.map((hex, i) => (
                  <Swatch key={i} hex={hex} />
                ))}
                <span style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>
                  {result.color_palette.join(' · ')}
                </span>
              </div>
            )}

            {/* Brand elements */}
            {result.brand_elements && result.brand_elements.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {result.brand_elements.map((el, i) => (
                  <Tag key={i} label={el} color={selected.color} />
                ))}
              </div>
            )}

            {/* CTA */}
            {result.cta && (
              <div style={{ background: `${selected.color}18`, borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                <span style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 13, color: selected.color, letterSpacing: 1 }}>
                  CTA: {result.cta}
                </span>
              </div>
            )}

            {/* Dimensions badge */}
            {result.dimensions && (
              <div style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 10 }}>
                📐 {result.dimensions}
              </div>
            )}
          </div>

          {/* Saved confirmation */}
          {briefSaved && (
            <div style={{ ...T, fontSize: 11, color: '#6DBF7E', textAlign: 'center', padding: '4px 0' }}>
              ✓ Brief saved to your history
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyBrief} style={{
              flex: 1, padding: '12px 0', borderRadius: 10, border: `1px solid ${(selected && selected.color) || GOLD}44`,
              background: copied ? `${(selected && selected.color) || GOLD}18` : 'rgba(255,255,255,0.04)',
              color: copied ? (selected && selected.color) || GOLD : 'rgba(255,255,255,0.5)',
              ...T, fontSize: 13, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all .2s',
            }}>
              {copied ? '✓ COPIED' : '📋 COPY BRIEF'}
            </button>
            <button onClick={reset} style={{
              flex: 1, padding: '12px 0', borderRadius: 10, border: `1px solid rgba(255,255,255,0.1)`,
              background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
              ...T, fontSize: 13, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all .15s',
            }}>
              ⚡ FORGE ANOTHER
            </button>
          </div>
        </div>
      )}

      {/* Placeholder when nothing selected */}
      {!selected && !result && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.15)', ...T, fontSize: 14 }}>
          Select an asset type above to begin forging
        </div>
      )}
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={null} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={null} currentUser={user || null} />
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