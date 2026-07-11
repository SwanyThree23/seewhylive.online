import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, Users, Trophy, Radio, MessageSquare, Sparkles, Gamepad2, Eye, Target } from 'lucide-react';


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
import CreatorBridge from '../components/social/CreatorBridge';
const G = '#D4AF37';
const BG = '#0A0710';
const PANEL = '#0F0B1A';

const FEATURES = [
  {
    id: 'guest_destinations',
    title: 'Guest Destinations',
    description: 'Multi-guest co-streaming with automated camera direction via SwanAI Director.',
    icon: '🎬',
    color: '#D4854A',
    highlights: ['Real-time layout switching', 'AI spotlight detection', 'Multi-platform RTMP'],
    link: '/ControlRoom',
  },
  {
    id: 'watch_party',
    title: 'WatchParty',
    description: 'Synchronized viewing experience with live reactions, polls, and community chat.',
    icon: '👀',
    color: '#C9A84C',
    highlights: ['Video sync', 'Reaction overlays', 'Real-time polling'],
    link: '/WatchParty',
  },
  {
    id: 'multilingual_chat',
    title: 'Multilingual Universal Chat',
    description: 'Auto-translate chat messages with compression & multi-language support.',
    icon: '🌍',
    color: '#6DBF7E',
    highlights: ['Auto-translation', 'LLMLingua compression', 'Language detection'],
    link: '/LiveRoom',
  },
  {
    id: 'pk_battles',
    title: 'PK Battles',
    description: 'Head-to-head streaming duels with live scoring, rewards, and viewer engagement.',
    icon: '⚔️',
    color: '#D4AF37',
    highlights: ['Live scoring', 'Raid mechanics', 'Tournament brackets'],
    link: '/PKBattleManager',
  },
  {
    id: 'aura_ai',
    title: 'Aura AI Co-Host',
    description: 'Intelligent AI co-host that reads chat, answers questions, and hypes moments.',
    icon: '🤖',
    color: G,
    highlights: ['Chat comprehension', 'Real-time responses', 'Auto-moderation'],
    link: '/LiveRoom',
  },
  {
    id: 'swanybot',
    title: 'SwanyBot AI Guide',
    description: 'Your personal platform assistant with memory, preferences, and conversation history.',
    icon: '💬',
    color: '#C0392B',
    highlights: ['Preference memory', 'History tracking', 'Voice I/O'],
    link: '/',
  },
  {
    id: 'state_vs_state',
    title: 'State vs State Tournaments',
    description: 'Full bracket domino tournament system with live matches, rosters, and real-time standings.',
    icon: '⚔️',
    color: '#5B7FA6',
    highlights: ['Live brackets', 'State rosters', 'Season standings'],
    link: '/StateVsState',
  },
  {
    id: 'tribute_wall',
    title: 'Tribute Wall',
    description: 'Honor fallen domino legends with tribute posts, memorial events, and nomination system.',
    icon: '🕊️',
    color: '#7B5EA7',
    highlights: ['Legend cards', 'Tribute messages', 'Memorial fund'],
    link: '/TributeWall',
  },
  {
    id: 'joyce_ai',
    title: 'Joyce AI Co-Host',
    description: 'Your AI broadcast co-host — tournament intros, tribute scripts, hype lines, and revenue tips.',
    icon: '🤖',
    color: '#D4AF37',
    highlights: ['Quick prompts', 'Broadcast-ready responses', 'Claude powered'],
    link: '/JoyceAI',
  },
  {
    id: 'ins_forge',
    title: 'INS Forge',
    description: 'AI creative brief generator for SVS graphics, tribute cards, overlays, and promo assets.',
    icon: '⚡',
    color: '#F59E0B',
    highlights: ['SVS brackets', 'Stream overlays', 'Tribute cards'],
    link: '/INSForge',
  },
  {
    id: 'ai_podcast',
    title: 'AI Podcast Studio',
    description: 'NotebookLM-style podcast creation with AI scripting, panel recording, and episode library.',
    icon: '🎙️',
    color: '#00d4ff',
    highlights: ['AI script generation', 'Panel recording', 'Episode library'],
    link: '/PodcastStudio',
  },
];

export default function PlatformShowcase() {
  const [selected, setSelected] = useState(0);
  const feature = FEATURES[selected];

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <div className="px-4 py-4 md:px-8">
        <Link to={createPageUrl('Home')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em' }} aria-label="Back to Home">← Home</Link>
      </div>
      <div className="px-4 pb-8 md:px-8 md:pb-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black uppercase mb-4"
          style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
        >
          SeeWhy LIVE Features
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white/60 text-lg max-w-2xl mx-auto"
        >
          Experience the ultimate streaming platform with AI-powered tools, multi-guest coordination, and real-time engagement.
        </motion.p>
      </div>

      {/* Main Feature Showcase */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature Selector */}
          <div className="md:col-span-1 space-y-2">
            {FEATURES.map((feat, idx) => (
              <motion.button
                key={feat.id}
                onClick={() => setSelected(idx)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left p-3 rounded-lg transition-all"
                style={{
                  background: selected === idx ? `${feat.color}20` : 'rgba(255,255,255,0.03)',
                  border: selected === idx ? `1px solid ${feat.color}40` : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{feat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">{feat.title}</p>
                    <p className="text-[11px] text-white/40 truncate">{feat.description}</p>
                  </div>
                  {selected === idx && <ChevronRight className="w-4 h-4" style={{ color: feat.color }} />}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Feature Detail */}
          <div className="md:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-lg p-6 h-full"
                style={{ background: PANEL, border: `1px solid ${feature.color}40` }}
              >
                {/* Feature Icon & Title */}
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl flex-shrink-0"
                    style={{ background: `${feature.color}20`, border: `2px solid ${feature.color}40` }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black mb-2" style={{ color: feature.color, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {feature.title}
                    </h2>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </div>
                </div>

                {/* Highlights */}
                <div className="mb-6 space-y-2">
                  <p className="text-xs font-bold text-white/50 uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Key Features
                  </p>
                  {feature.highlights.map((highlight, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Zap className="w-4 h-4" style={{ color: feature.color }} />
                      <span style={{ color: feature.color }}>{highlight}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <motion.a
                  href={feature.link}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all"
                  style={{ background: feature.color, color: feature.color === G ? '#000' : '#fff' }}
                >
                  Explore Now <ChevronRight className="w-4 h-4" />
                </motion.a>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <h2 className="text-2xl font-black text-center mb-8" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          Platform Capabilities
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Multi-Guest Streaming', value: '∞', icon: '👥' },
            { label: 'Real-time Notifications', value: '<1s', icon: '⚡' },
            { label: 'Languages Supported', value: '50+', icon: '🌍' },
            { label: 'AI-Powered Tools', value: '5+', icon: '🤖' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="text-center p-4 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(212,175,55,0.12)` }}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p className="text-2xl font-black mb-1" style={{ color: G }}>
                {stat.value}
              </p>
              <p className="text-xs text-white/60">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-12 px-4 text-center border-t" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Sparkles className="w-8 h-8 mx-auto mb-4" style={{ color: G }} />
          <h3 className="text-xl font-black mb-2" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Ready to Stream?
          </h3>
          <p className="text-white/60 mb-4 max-w-lg mx-auto">
            Start broadcasting with all the tools you need to grow your audience and monetize your content.
          </p>
          <motion.a
            href="/LiveRoom"
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold"
            style={{ background: `linear-gradient(135deg, ${G}, #D4854A)` }}
          >
            Go Live Now <Radio className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={null} roomId={null} currentUser={null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}