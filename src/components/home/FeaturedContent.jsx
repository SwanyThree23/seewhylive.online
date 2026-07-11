import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, ExternalLink, Users, Mic, Tv2, ChevronRight } from 'lucide-react';
import { createPageUrl } from '../../utils';

const G       = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const TEAL    = '#4A8A7A';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

/* ─── Partner channel definitions ───────────────────────────────────────── */
export const PARTNER_CHANNELS = [
  {
    id: 'aiversepodcast',
    name: 'A.I. Verse Podcast',
    handle: '@aiversepodcast',
    url: 'https://youtube.com/@aiversepodcast',
    color: TEAL,
    icon: Mic,
    desc: 'Social audio, AI & live-streaming deep-dives',
  },
  {
    id: 'dominoentertainment',
    name: 'Domino Entertainment',
    handle: '@dominoentertainment5513',
    url: 'https://youtube.com/@dominoentertainment5513',
    color: PINK,
    icon: Tv2,
    desc: 'Social Expo · cross-platform events · gaming tournaments · Social Lights weekly show',
    expoUrl: '/SocialExpo',
  },
];

/* ─── Curated featured videos ───────────────────────────────────────────── */
export const FEATURED_VIDEOS = [
  {
    id: 'cDkr2u40oJc',
    title: 'Talking Social Audio & Livestream',
    channel: 'A.I. Verse Podcast',
    channelId: 'aiversepodcast',
    channelColor: TEAL,
    tag: 'Podcast',
    tagColor: TEAL,
  },
  {
    id: '-o--N8NswMM',
    title: 'Fanbase & Issac Hayes III',
    channel: 'A.I. Verse Podcast',
    channelId: 'aiversepodcast',
    channelColor: TEAL,
    tag: 'Interview',
    tagColor: '#a855f7',
  },
  {
    id: '7HwU_IDVKuc',
    title: 'A.I. Verse Podcast Episode',
    channel: 'A.I. Verse Podcast',
    channelId: 'aiversepodcast',
    channelColor: TEAL,
    tag: 'Podcast',
    tagColor: TEAL,
  },
  {
    id: 'sn-X0avptY0',
    title: 'Featured Episode',
    channel: 'A.I. Verse Podcast',
    channelId: 'aiversepodcast',
    channelColor: TEAL,
    tag: 'Live',
    tagColor: PINK,
  },
  {
    id: 'cFbjR6VFbnI',
    title: 'Domino Entertainment Spotlight',
    channel: 'Domino Entertainment',
    channelId: 'dominoentertainment',
    channelColor: PINK,
    tag: 'Entertainment',
    tagColor: PINK,
  },
  {
    id: 'RTR9Rt09qRY',
    title: 'Domino Live Event',
    channel: 'Domino Entertainment',
    channelId: 'dominoentertainment',
    channelColor: PINK,
    tag: 'Event',
    tagColor: '#D4854A',
  },
];

/* ─── PartnerChannelChip ─────────────────────────────────────────────────── */
function PartnerChannelChip({ channel }) {
  const Icon = channel.icon;
  return (
    <a
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <motion.div
        whileTap={{ scale: 0.95 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px 6px 8px', borderRadius: 99,
          border: `1px solid ${channel.color}40`,
          background: `${channel.color}10`,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: `${channel.color}20`, border: `1.5px solid ${channel.color}60`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon style={{ width: 13, height: 13, color: channel.color }} />
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0, ...T }}>{channel.name}</p>
          <p style={{ fontSize: 11, color: `${channel.color}99`, margin: 0, ...T }}>{channel.handle}</p>
        </div>
        <ExternalLink style={{ width: 10, height: 10, color: `${channel.color}60`, marginLeft: 2 }} />
      </motion.div>
    </a>
  );
}

/* ─── FeaturedVideoCard ──────────────────────────────────────────────────── */
function FeaturedVideoCard({ video }) {
  const [imgErr, setImgErr] = useState(false);
  const thumb = imgErr
    ? null
    : `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
  const ytUrl = `https://www.youtube.com/watch?v=${video.id}`;
  const wpUrl = `${createPageUrl('WatchParty')}?videoUrl=${encodeURIComponent(ytUrl)}&title=${encodeURIComponent(video.title + ' — Watch Party')}`;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      style={{
        width: 220, flexShrink: 0, borderRadius: 14,
        background: 'rgba(13,6,24,0.92)',
        border: '1px solid rgba(212,175,55,0.1)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #0d0620, #0a1020)', overflow: 'hidden' }}>
        {thumb ? (
          <img
            src={thumb}
            alt={video.title}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play style={{ width: 28, height: 28, color: 'rgba(212,175,55,0.25)' }} />
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,6,24,0.85) 0%, transparent 55%)' }} />

        {/* Tag badge */}
        <span style={{
          position: 'absolute', top: 6, left: 6,
          fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
          background: `${video.tagColor}25`, color: video.tagColor,
          border: `1px solid ${video.tagColor}45`, ...T,
        }}>{video.tag}</span>

        {/* Play overlay */}
        <div style={{
          position: 'absolute', right: 8, bottom: 8,
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(255,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Play style={{ width: 12, height: 12, color: '#fff', marginLeft: 1 }} />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '8px 10px 4px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: '0 0 2px', lineHeight: 1.3, ...T,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {video.title}
        </p>
        <p style={{ fontSize: 11, color: `${video.channelColor}99`, margin: 0, ...T }}>{video.channel}</p>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 10px 10px' }}>
        <a
          href={ytUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '5px 0', borderRadius: 8, textDecoration: 'none',
            background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.3)',
            color: '#C0392B', fontSize: 10, fontWeight: 700, ...T,
          }}
        >
          <Play style={{ width: 10, height: 10 }} />
          Watch
        </a>
        <Link
          to={wpUrl}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '5px 0', borderRadius: 8, textDecoration: 'none',
            background: `${G}15`, border: `1px solid ${G}35`,
            color: G, fontSize: 10, fontWeight: 700, ...T,
          }}
        >
          <Users style={{ width: 10, height: 10 }} />
          Watch Party
        </Link>
      </div>
    </motion.div>
  );
}

/* ─── FeaturedContentSection — exported default ──────────────────────────── */
export default function FeaturedContentSection() {
  const [activeChannel, setActiveChannel] = useState('all');

  const filtered = activeChannel === 'all'
    ? FEATURED_VIDEOS
    : FEATURED_VIDEOS.filter(v => v.channelId === activeChannel);

  return (
    <div style={{ paddingBottom: 4 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', ...T }}>Featured Partners</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
            background: `${G}15`, color: G, border: `1px solid ${G}30`, ...T,
          }}>OFFICIAL</span>
        </div>
        <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.25)' }} />
      </div>

      {/* Partner channel chips */}
      <div style={{ display: 'flex', gap: 8, paddingLeft: 16, overflowX: 'auto', paddingBottom: 10 }}
        className="scrollbar-hide">
        {PARTNER_CHANNELS.map(ch => (
          <PartnerChannelChip key={ch.id} channel={ch} />
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, paddingLeft: 16, marginBottom: 10 }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'aiversepodcast', label: 'A.I. Verse' },
          { id: 'dominoentertainment', label: 'Domino' },
        ].map(tab => {
          const isActive = activeChannel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveChannel(tab.id)}
              style={{
                fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
                border: `1px solid ${isActive ? G + '50' : 'rgba(255,255,255,0.08)'}`,
                background: isActive ? `${G}15` : 'transparent',
                color: isActive ? G : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', outline: 'none', ...T,
              }}
            >{tab.label}</button>
          );
        })}
      </div>

      {/* Horizontal video scroll */}
      <div style={{ display: 'flex', gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: 'auto' }}
        className="scrollbar-hide">
        {filtered.map((video, i) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <FeaturedVideoCard video={video} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
