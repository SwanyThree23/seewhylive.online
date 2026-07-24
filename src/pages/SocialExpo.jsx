import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Tv2, Users, Star, Zap, Globe, Mic, Gift, DollarSign,
  Trophy, Play, ExternalLink, ChevronRight, Ticket, Percent,
  Radio, Heart, Award, Crown, Sparkles, Calendar, Share2, ArrowRight
} from 'lucide-react';
import { createPageUrl } from '../utils';
import { FEATURED_VIDEOS } from '../components/home/FeaturedContent';
import FeaturedContentSection from '../components/home/FeaturedContent';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import CreatorBridge from '../components/social/CreatorBridge';
import SpotlightBanner from '../components/community/SpotlightBanner';
import ShareToSocial from '../components/social/ShareToSocial';
import ContentRecommendations from '../components/social/ContentRecommendations';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import StreamGoals from '../components/live/StreamGoals';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import AnnouncementPanel from '../components/community/AnnouncementPanel';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';

const G       = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const TEAL    = '#D4854A';
const BG      = '#080B18';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

/* ─── Platform integrations ─────────────────────────────────────────────── */
const PLATFORMS = [
  { name: 'Fanbase',   color: '#C0392B', icon: Heart,   desc: 'Fan economy & creator tipping' },
  { name: 'Clubhouse', color: '#D4AF37', icon: Mic,     desc: 'Live audio rooms & stages' },
  { name: 'Discord',   color: '#D4854A', icon: Users,   desc: 'Community servers & events' },
  { name: 'GoBrunch',  color: '#6DBF7E', icon: Globe,   desc: 'Virtual events & networking' },
  { name: 'Poldit',    color: '#CC7755', icon: Star,    desc: 'Debate rooms & live polls' },
  { name: 'Calibones', color: '#D4854A', icon: Trophy,  desc: 'Gaming tournaments & leagues' },
];

/* ─── Sponsorship tiers ──────────────────────────────────────────────────── */
const SPONSOR_TIERS = [
  {
    id: 'community',
    label: 'Community Spotlight',
    price: 100,
    color: TEAL,
    icon: Zap,
    perks: [
      'Brand mention in event intro',
      'Logo on stream overlay',
      'Social media shoutout',
      '30-second ad spot',
    ],
  },
  {
    id: 'event',
    label: 'Event Feature',
    price: 200,
    color: G,
    icon: Star,
    featured: true,
    perks: [
      'All Community perks',
      'Featured segment (5 min)',
      'Presenter slot on stage',
      'Post-event recap inclusion',
      'Email blast mention',
    ],
  },
  {
    id: 'full',
    label: 'Full Event Sponsor',
    price: 500,
    color: PINK,
    icon: Crown,
    perks: [
      'All Event Feature perks',
      'Title sponsorship credit',
      'Dedicated 15-min session',
      'Priority replay placement',
      'Cross-platform co-branding',
      'Affiliate partner status',
    ],
  },
];

/* ─── Social Lights lineup ────────────────────────────────────────────────── */
const SOCIAL_LIGHTS = [
  { role: 'Host', name: 'Domino Entertainment', color: PINK,    icon: Radio },
  { role: 'Co-Host', name: 'SeeWhy LIVE',        color: G,      icon: Tv2 },
  { role: 'Guest Spotlight', name: 'A.I. Verse Podcast', color: TEAL, icon: Mic },
  { role: 'Community Pick', name: 'Open Nomination',     color: '#D4854A', icon: Users },
];

/* ─── Ticket tiers ───────────────────────────────────────────────────────── */
const TICKET_TIERS = [
  { label: 'General Admission', price: 0.99, color: '#6b7280', desc: 'Access to main stage events' },
  { label: 'VIP Access',        price: 2.99, color: G,         desc: 'Premium seats + backstage chat' },
  { label: 'All-Access Pass',   price: 4.99, color: PINK,      desc: 'Every session + replay archive' },
];

/* ─── Domino videos (filtered from FEATURED_VIDEOS) ─────────────────────── */
const DOMINO_VIDEOS = FEATURED_VIDEOS.filter(v => v.channelId === 'dominoentertainment');

export default function SocialExpo() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const [activeTab, setActiveTab] = useState('overview');
  const [sponsorToast, setSponsorToast] = useState('');

  function handleSponsorInquiry(tierLabel, price) {
    var subject = encodeURIComponent(`SeeWhy LIVE Sponsorship Inquiry — ${tierLabel} ($${price}/event)`);
    var body = encodeURIComponent(`Hi,\n\nI'm interested in the ${tierLabel} sponsorship tier ($${price}/event) on SeeWhy LIVE.\n\nPlease send me more details.\n\nThank you.`);
    var mailto = `mailto:partnerships@seewhylive.online?subject=${subject}&body=${body}`;
    window.open(mailto, '_blank', 'noopener,noreferrer');
    setSponsorToast('Opening email…');
    setTimeout(() => setSponsorToast(''), 2500);
  }

  const tabs = [
    { id: 'overview',    label: 'Overview',    icon: Globe },
    { id: 'events',      label: 'Events',      icon: Calendar },
    { id: 'platforms',   label: 'Platforms',   icon: Share2 },
    { id: 'spotlight',   label: 'Social Lights', icon: Radio },
    { id: 'sponsor',     label: 'Sponsor',     icon: DollarSign },
    { id: 'affiliate',   label: 'Affiliate',   icon: Percent },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff' }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingBottom: 32 }}>
        {/* Gradient mesh */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 30% 0%, ${CRIMSON}25 0%, transparent 60%),
                       radial-gradient(ellipse 60% 50% at 80% 20%, ${PINK}18 0%, transparent 55%),
                       radial-gradient(ellipse 50% 40% at 50% 100%, ${TEAL}10 0%, transparent 50%)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '40px 20px 0' }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 99,
              background: `${PINK}18`, border: `1px solid ${PINK}45`, marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: PINK, display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: 2, ...T }}>OFFICIAL PARTNER INTEGRATION</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            style={{ fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 12px', ...T }}>
            Domino Social Expo
            <br />
            <span style={{ color: G }}>& Social Contact Network</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 580, lineHeight: 1.55, margin: '0 0 28px' }}>
            Connecting creators, communities, and live events across six platforms —
            hybrid events, weekly spotlight shows, gaming tournaments, and a shared
            revenue model that pays creators 90%.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href="https://youtube.com/@dominoentertainment5513"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
                background: `linear-gradient(135deg, ${CRIMSON}, ${PINK})`,
                color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, ...T }}>
              <Tv2 style={{ width: 16, height: 16 }} />
              Visit Domino Channel
            </a>
            <Link
              to={`${createPageUrl('WatchParty')}?videoUrl=${encodeURIComponent('https://www.youtube.com/watch?v=cFbjR6VFbnI')}&title=${encodeURIComponent('Domino Social Expo — Watch Party')}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
                background: `${G}15`, border: `1px solid ${G}35`,
                color: G, textDecoration: 'none', fontSize: 13, fontWeight: 700, ...T }}>
              <Play style={{ width: 15, height: 15 }} />
              Watch Party
            </Link>
          </motion.div>

          {/* Stat chips */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32 }}>
            {[
              { label: '6 Platforms', icon: Globe, color: TEAL },
              { label: 'Weekly Shows', icon: Radio, color: G },
              { label: '$0.99–$4.99 Tickets', icon: Ticket, color: PINK },
              { label: '10% Affiliate', icon: Percent, color: '#D4854A' },
              { label: '90% Creator Split', icon: DollarSign, color: '#6DBF7E' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 8,
                  background: `${s.color}10`, border: `1px solid ${s.color}28` }}>
                  <Icon style={{ width: 13, height: 13, color: s.color }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color, ...T }}>{s.label}</span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ── TAB NAV ───────────────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 64, zIndex: 30, borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', overflowX: 'auto',
          display: 'flex', gap: 4, scrollbarWidth: 'none' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 16px',
                  background: 'transparent', border: 'none', borderBottom: `2px solid ${active ? G : 'transparent'}`,
                  color: active ? G : 'rgba(255,255,255,0.4)', cursor: 'pointer', whiteSpace: 'nowrap',
                  fontSize: 12, fontWeight: 700, transition: 'all 0.2s', ...T }}>
                <Icon style={{ width: 14, height: 14 }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 60px' }}>
        <AnimatePresence mode="wait">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 36 }}>

                {/* What is the Social Expo */}
                <div style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${PINK}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe style={{ width: 18, height: 18, color: PINK }} />
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', ...T }}>What is the Social Expo?</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>
                    The Domino Social Expo is a cross-platform hybrid event ecosystem connecting
                    six of the top social audio, gaming, and live-streaming platforms. Hosts run
                    simultaneous multi-platform streams, bringing communities together under one
                    shared revenue model — where creators keep 90% of every dollar earned.
                  </p>
                </div>

                {/* How it works */}
                <div style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${G}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap style={{ width: 18, height: 18, color: G }} />
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', ...T }}>How It Works</span>
                  </div>
                  <ol style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      'Creators register as Social Contact Network members',
                      'Host or co-host multi-platform events via SeeWhy LIVE',
                      'Sell tickets ($0.99–$4.99) and collect virtual gifts',
                      'Earn from sponsorships ($100–$500 per event tier)',
                      'Grow via 10% affiliate commissions on referred revenue',
                    ].map((step, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                        <span style={{ color: G, fontWeight: 700 }}>Step {i + 1}:</span> {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Featured Domino videos */}
              {DOMINO_VIDEOS.length > 0 && (
                <div style={{ marginBottom: 36 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', ...T }}>
                      Domino Entertainment Videos
                    </span>
                    <a href="https://youtube.com/@dominoentertainment5513" target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: PINK,
                        textDecoration: 'none', ...T }}>
                      View Channel <ExternalLink style={{ width: 11, height: 11 }} />
                    </a>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                    {DOMINO_VIDEOS.map((video, i) => {
                      const ytUrl = `https://www.youtube.com/watch?v=${video.id}`;
                      const wpUrl = `${createPageUrl('WatchParty')}?videoUrl=${encodeURIComponent(ytUrl)}&title=${encodeURIComponent(video.title + ' — Watch Party')}`;
                      return (
                        <motion.div key={video.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                          <div style={{ borderRadius: 14, overflow: 'hidden', background: 'rgba(8,11,24,0.9)',
                            border: '1px solid rgba(192,57,43,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                            <div style={{ position: 'relative', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a0010, #0D1022)' }}>
                              <img src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`} alt={video.title}
                                onError={e => { e.target.style.display = 'none'; }}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,11,24,0.85) 0%, transparent 55%)' }} />
                              <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 11, fontWeight: 700,
                                padding: '2px 8px', borderRadius: 99, background: `${video.tagColor}30`,
                                color: video.tagColor, border: `1px solid ${video.tagColor}50`, ...T }}>{video.tag}</span>
                              <div style={{ position: 'absolute', right: 10, bottom: 10, width: 32, height: 32, borderRadius: '50%',
                                background: 'rgba(255,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Play style={{ width: 13, height: 13, color: '#fff', marginLeft: 2 }} />
                              </div>
                            </div>
                            <div style={{ padding: '10px 12px 12px' }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 4px', lineHeight: 1.3,
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', ...T }}>{video.title}</p>
                              <p style={{ fontSize: 11, color: `${video.channelColor}99`, margin: '0 0 10px', ...T }}>{video.channel}</p>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <a href={ytUrl} target="_blank" rel="noopener noreferrer"
                                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                    padding: '6px', borderRadius: 8, textDecoration: 'none',
                                    background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.3)',
                                    color: '#ff4444', fontSize: 11, fontWeight: 700, ...T }}>
                                  <Play style={{ width: 10, height: 10 }} /> Watch
                                </a>
                                <Link to={wpUrl}
                                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                    padding: '6px', borderRadius: 8, textDecoration: 'none',
                                    background: `${G}15`, border: `1px solid ${G}35`,
                                    color: G, fontSize: 11, fontWeight: 700, ...T }}>
                                  <Users style={{ width: 10, height: 10 }} /> Party
                                </Link>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ticket pricing */}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 16px', ...T }}>
                  Event Tickets
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                  {TICKET_TIERS.map((tier, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      style={{ padding: 18, borderRadius: 14, background: `${tier.color}08`,
                        border: `1px solid ${tier.color}25` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Ticket style={{ width: 16, height: 16, color: tier.color }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', ...T }}>{tier.label}</span>
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: tier.color, marginBottom: 6, ...T }}>
                        ${tier.price.toFixed(2)}
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{tier.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* PLATFORMS TAB */}
          {activeTab === 'events' && (
            <motion.div key="events" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px', ...T }}>Event Schedule</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 28px' }}>
                Official Domino Social Expo dates — NDL, UDL &amp; CaliBones Nation partnership events.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  {
                    id: 'austin-2026',
                    title: 'Domino Social Expo — Austin Launch',
                    orgs: ['NDL', 'UDL', 'CaliBones Nation'],
                    date: 'August 2026',
                    location: 'Austin, TX',
                    type: 'Launch Event',
                    color: TEAL,
                    note: 'Opening event — live multi-platform broadcast on SeeWhy LIVE.',
                  },
                  {
                    id: 'national-2026',
                    title: 'National Domino Social Expo',
                    orgs: ['NDL', 'UDL', 'CaliBones Nation'],
                    date: 'September 2026',
                    location: 'Nationwide',
                    type: 'National Tour',
                    color: G,
                    featured: true,
                    note: 'Multi-city national tour with simultaneous streams across all partner platforms.',
                  },
                  {
                    id: 'chicago-2027',
                    title: 'Chicago Championship — CaliBones Nation',
                    orgs: ['CaliBones Nation'],
                    date: 'May 7–8, 2027',
                    location: 'Chicago, IL',
                    type: 'Championship',
                    color: PINK,
                    note: 'Two-day domino championship livestreamed in full — spectator tickets + PPV tiers.',
                  },
                ].map(ev => (
                  <div key={ev.id} style={{
                    padding: 20, borderRadius: 14,
                    background: 'rgba(13,6,24,0.92)',
                    border: `1px solid ${ev.featured ? `${ev.color}50` : `${ev.color}28`}`,
                    boxShadow: ev.featured ? `0 0 24px ${ev.color}18` : 'none',
                    position: 'relative',
                  }}>
                    {ev.featured && (
                      <div style={{ position: 'absolute', top: 12, right: 14, padding: '2px 10px', borderRadius: 6,
                        background: `${ev.color}20`, border: `1px solid ${ev.color}44`,
                        fontSize: 10, fontWeight: 800, color: ev.color, ...T, letterSpacing: 1 }}>
                        FEATURED
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ev.color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Calendar style={{ width: 20, height: 20, color: ev.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', ...T }}>{ev.title}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 5, background: `${ev.color}15`,
                            border: `1px solid ${ev.color}35`, fontSize: 10, fontWeight: 700, color: ev.color, ...T }}>
                            {ev.type}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>📅 {ev.date}</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>📍 {ev.location}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          {ev.orgs.map(o => (
                            <span key={o} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', ...T }}>
                              {o}
                            </span>
                          ))}
                        </div>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>{ev.note}</p>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                      <a href={`mailto:partnerships@seewhylive.online?subject=Event+Inquiry+${encodeURIComponent(ev.title)}`}
                        style={{ padding: '8px 16px', borderRadius: 8, background: `${ev.color}18`,
                          border: `1px solid ${ev.color}35`, color: ev.color, fontSize: 11, fontWeight: 700,
                          textDecoration: 'none', ...T, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Ticket style={{ width: 13, height: 13 }} /> Inquire / Register
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'platforms' && (
            <motion.div key="platforms" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px', ...T }}>
                  Cross-Platform Integration
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 28px' }}>
                  SeeWhy LIVE streams simultaneously across all six Domino Social Expo partner platforms,
                  multiplying your reach and revenue with zero extra work.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 40 }}>
                {PLATFORMS.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <motion.div key={p.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                      style={{ padding: 20, borderRadius: 16, background: `${p.color}08`,
                        border: `1px solid ${p.color}28`, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color}20`,
                        border: `1.5px solid ${p.color}50`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 22, height: 22, color: p.color }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: '0 0 4px', ...T }}>{p.name}</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 10px', lineHeight: 1.4 }}>{p.desc}</p>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
                          borderRadius: 99, background: `${p.color}15`, border: `1px solid ${p.color}30` }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: p.color, ...T }}>INTEGRATED</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Multi-stream benefit callout */}
              <div style={{ padding: 28, borderRadius: 18, background: `linear-gradient(135deg, ${CRIMSON}20, ${PINK}12)`,
                border: `1px solid ${PINK}28` }}>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 10px', ...T }}>
                  Why Multi-Platform Streaming?
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {[
                    { title: '6× Audience Reach', desc: 'One stream, six platforms — multiply viewership instantly' },
                    { title: 'Shared Revenue Pool', desc: 'Each platform audience contributes to your 90% split earnings' },
                    { title: 'Community Cross-Pollination', desc: 'Your Discord fans discover your Fanbase; Clubhouse listeners find SeeWhy' },
                    { title: 'Brand Amplification', desc: 'Sponsors get exposure across all six communities simultaneously' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: PINK, marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: '0 0 2px', ...T }}>{item.title}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* SOCIAL LIGHTS TAB */}
          {activeTab === 'spotlight' && (
            <motion.div key="spotlight" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Show header */}
              <div style={{ padding: 28, borderRadius: 18, marginBottom: 28,
                background: `linear-gradient(135deg, ${CRIMSON}30, ${PINK}18, rgba(255,255,255,0.02))`,
                border: `1px solid ${PINK}30`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%',
                  background: `radial-gradient(circle, ${PINK}18, transparent 70%)` }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${PINK}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles style={{ width: 20, height: 20, color: PINK }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, ...T }}>Social Lights</p>
                    <p style={{ fontSize: 11, color: PINK, margin: 0, letterSpacing: 2, ...T }}>WEEKLY SPOTLIGHT SHOW</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 18px', lineHeight: 1.6 }}>
                  Every week, the Social Lights show shines a spotlight on standout creators,
                  community moments, and platform milestones — live across all six partner networks.
                  Nomination is open to all Social Contact Network members.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { icon: Calendar, label: 'Weekly — Every Thursday' },
                    { icon: Radio, label: 'Live + Cross-Platform Simulcast' },
                    { icon: Award, label: 'Community Nomination Open' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                        borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Icon style={{ width: 12, height: 12, color: G }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', ...T }}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Show lineup */}
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 14px', ...T }}>Show Lineup</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {SOCIAL_LIGHTS.map((slot, i) => {
                  const Icon = slot.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12,
                        background: `${slot.color}08`, border: `1px solid ${slot.color}22` }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${slot.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 18, height: 18, color: slot.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 2px', ...T }}>{slot.name}</p>
                        <p style={{ fontSize: 11, color: slot.color, margin: 0, letterSpacing: 1, ...T }}>{slot.role.toUpperCase()}</p>
                      </div>
                      {slot.role === 'Community Pick' && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                          background: `${slot.color}18`, color: slot.color, border: `1px solid ${slot.color}35`, ...T }}>
                          NOMINATE
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Tournament section */}
              <div style={{ padding: 24, borderRadius: 16, background: 'rgba(128,0,32,0.06)', border: '1px solid rgba(128,0,32,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Trophy style={{ width: 20, height: 20, color: '#D4854A' }} />
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', ...T }}>Domino Entertainment Tournaments</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', lineHeight: 1.6 }}>
                  Gaming tournaments hosted by Domino Entertainment run live on SeeWhy LIVE —
                  bracket play, community wagering, and sponsored prize pools. Streamed across
                  Calibones, Discord, and the Social Expo network simultaneously.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                  {['Weekly Brackets', 'Sponsored Prize Pools', 'Community Wagers', 'Live Commentary', 'Cross-Platform Chat', 'Replay Archive'].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(128,0,32,0.08)', border: '1px solid rgba(128,0,32,0.15)' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4854A', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', ...T }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* SPONSOR TAB */}
          {activeTab === 'sponsor' && (
            <motion.div key="sponsor" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {sponsorToast && <div style={{ color: G, fontSize: 12, marginBottom: 10, fontWeight: 700 }}>{sponsorToast}</div>}
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 0 28px', lineHeight: 1.6 }}>
                Sponsor a Domino Social Expo event and reach engaged communities across six platforms
                simultaneously. All sponsorship revenue flows through SeeWhy LIVE's secure payment
                system with full attribution tracking.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 36 }}>
                {SPONSOR_TIERS.map((tier, i) => {
                  const Icon = tier.icon;
                  return (
                    <motion.div key={tier.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      style={{ padding: 22, borderRadius: 18, background: `${tier.color}08`,
                        border: `1px solid ${tier.color}${tier.featured ? '50' : '28'}`,
                        boxShadow: tier.featured ? `0 0 32px ${tier.color}15` : 'none',
                        position: 'relative', overflow: 'hidden' }}>
                      {tier.featured && (
                        <div style={{ position: 'absolute', top: 10, right: 10, padding: '2px 10px', borderRadius: 99,
                          background: G, color: '#000', fontSize: 10, fontWeight: 700, ...T }}>
                          POPULAR
                        </div>
                      )}
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${tier.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                        <Icon style={{ width: 22, height: 22, color: tier.color }} />
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: '0 0 6px', ...T }}>{tier.label}</p>
                      <div style={{ fontSize: 30, fontWeight: 900, color: tier.color, margin: '0 0 16px', ...T }}>
                        ${tier.price}
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>/event</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {tier.perks.map((perk, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${tier.color}20`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: tier.color }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{perk}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => handleSponsorInquiry(tier.label, tier.price)} style={{ width: '100%', marginTop: 18, padding: '10px', borderRadius: 10,
                        background: `${tier.color}18`, border: `1px solid ${tier.color}40`,
                        color: tier.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', ...T }}>
                        Inquire About Sponsorship
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Custom sponsorship */}
              <div style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                <Crown style={{ width: 28, height: 28, color: G, margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 8px', ...T }}>Custom Partnership</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 16px', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                  Building a long-term brand integration? Series sponsorships, exclusive naming rights,
                  and white-label event packages are available for committed partners.
                </p>
                <a href="https://youtube.com/@dominoentertainment5513" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
                    background: `${G}15`, border: `1px solid ${G}35`, color: G,
                    textDecoration: 'none', fontSize: 12, fontWeight: 700, ...T }}>
                  Contact Domino Entertainment <ExternalLink style={{ width: 13, height: 13 }} />
                </a>
              </div>
            </motion.div>
          )}

          {/* AFFILIATE TAB */}
          {activeTab === 'affiliate' && (
            <motion.div key="affiliate" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Headline */}
              <div style={{ padding: 28, borderRadius: 18, marginBottom: 28,
                background: `linear-gradient(135deg, rgba(109,191,126,0.12), rgba(212,175,55,0.08))`,
                border: '1px solid rgba(109,191,126,0.22)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(109,191,126,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Percent style={{ width: 22, height: 22, color: '#6DBF7E' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, ...T }}>10% Affiliate Program</p>
                    <p style={{ fontSize: 11, color: '#6DBF7E', margin: 0, letterSpacing: 2, ...T }}>SOCIAL CONTACT NETWORK</p>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 18px', lineHeight: 1.65 }}>
                  Earn 10% commission on every dollar your referrals generate — ticket sales,
                  sponsorships, virtual gifts, and subscriptions. No cap, no minimum payout
                  threshold to track (commissions go directly into your SeeWhy LIVE wallet).
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
                  {[
                    { label: '10% Commission Rate', sub: 'On all referred revenue' },
                    { label: 'Real-Time Tracking', sub: 'Live earnings dashboard' },
                    { label: 'Instant Wallet Credit', sub: 'No 30-day delay' },
                    { label: 'Unlimited Referrals', sub: 'Earn on every one' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: 14, borderRadius: 10, background: 'rgba(109,191,126,0.07)',
                      border: '1px solid rgba(109,191,126,0.18)' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#6DBF7E', margin: '0 0 3px', ...T }}>{item.label}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue streams eligible for commission */}
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 14px', ...T }}>
                Eligible Revenue Streams
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
                {[
                  { label: 'Event Tickets',      range: '$0.99–$4.99/ticket',     color: PINK,       pct: '10% of ticket price' },
                  { label: 'Sponsorship Deals',  range: '$100–$500/event',        color: G,          pct: '10% of deal value' },
                  { label: 'Virtual Gifts',       range: 'Variable per gift',     color: '#D4854A',  pct: '10% of gift value' },
                  { label: 'Subscriptions',       range: '$1–$50/month',          color: TEAL,       pct: '10% of sub price' },
                  { label: 'Live Tips',           range: 'Any amount',            color: '#D4854A',  pct: '10% of tip amount' },
                ].map((stream, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                      borderRadius: 10, background: `${stream.color}07`, border: `1px solid ${stream.color}20` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stream.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, ...T }}>{stream.label}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{stream.range}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                      background: `${stream.color}18`, color: stream.color, border: `1px solid ${stream.color}35`, ...T, whiteSpace: 'nowrap' }}>
                      {stream.pct}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ padding: 22, borderRadius: 14, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                <DollarSign style={{ width: 26, height: 26, color: G, margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: '0 0 8px', ...T }}>
                  Activate Your Affiliate Link
                </h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>
                  Your unique referral code is generated automatically in the Monetization dashboard.
                </p>
                <Link to={createPageUrl('Monetization')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10,
                    background: `linear-gradient(135deg, ${CRIMSON}, ${PINK})`,
                    color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, ...T }}>
                  Open Monetization Dashboard <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Collaboration opportunities */}
        <div style={{ padding: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FeaturedContentSection />
          <CollaborationMatcher />
          <CreatorBridge user={null} />
          <ShareToSocial />
          <ContentRecommendations />
          <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
          <OnlineUsersGrid compact maxVisible={10} />
          <StreamGoals isHost={true} />
          <ChallengeLeaderboard challengeId={null} />
          <AnnouncementPanel communityId={userCommunityId} userId={user?.id} />
        </div>
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id || null} roomId={null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}