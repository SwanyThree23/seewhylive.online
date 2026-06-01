import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';

var BG       = '#080B18';
var GOLD     = '#D4AF37';
var CRIMSON  = '#800020';
var PINK     = '#FF1564';

var CARD_STYLE = {
  background: 'rgba(13,6,24,0.9)',
  border: '1px solid rgba(212,175,55,0.12)',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

var FONT = 'Barlow Condensed, sans-serif';

function FeaturePill({ label }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 999,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: 'rgba(255,255,255,0.55)',
      fontSize: 11,
      fontFamily: FONT,
      fontWeight: 700,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function GoLiveCard({ icon, title, subtitle, features, buttonLabel, buttonStyle, href }) {
  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      whileHover={{ borderColor: 'rgba(212,175,55,0.4)' }}
      style={{
        ...CARD_STYLE,
        borderLeft: `3px solid ${GOLD}`,
        transition: 'border-color 0.2s',
        cursor: 'default',
      }}>

      {/* Icon */}
      <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>{icon}</div>

      {/* Title */}
      <p style={{
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 22,
        color: '#fff',
        letterSpacing: '0.03em',
        marginBottom: 6,
      }}>
        {title}
      </p>

      {/* Subtitle */}
      <p style={{
        fontFamily: FONT,
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 14,
        lineHeight: 1.4,
      }}>
        {subtitle}
      </p>

      {/* Features row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
        {features.map(function(f, i) { return <FeaturePill key={i} label={f} />; })}
      </div>

      {/* CTA button */}
      <Link to={href} style={{ display: 'block' }}>
        <motion.div
          whileTap={{ scale: 0.93 }}
          style={{
            ...buttonStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 0',
            borderRadius: 10,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 15,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            userSelect: 'none',
          }}>
          {buttonLabel}
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function GoLive() {
  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      {/* Page header */}
      <div style={{ textAlign: 'center', padding: '32px 16px 16px' }}>
        <p style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
          Choose Your Format
        </p>
        <h1 style={{ fontFamily: FONT, fontWeight: 900, fontSize: 32, color: GOLD, letterSpacing: '0.04em', margin: 0 }}>
          Go Live
        </h1>
      </div>

      {/* Cards container */}
      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '0 16px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>

        {/* Card 1: 20-Person Panel */}
        <GoLiveCard
          icon="🎙️"
          title="20-Person Panel"
          subtitle="Audio + video stage. Up to 20 speakers. Viewers join the audience."
          features={['🎤 Audio', '📹 Video', '👥 20 seats', '💬 Chat', '💸 Tips']}
          buttonLabel="Start Panel"
          buttonStyle={{ background: `linear-gradient(135deg, #6B4423, ${GOLD})`, color: '#000' }}
          href={createPageUrl('BroadcastStudio')}
        />

        {/* Card 2: FadesStage Battle */}
        <GoLiveCard
          icon="⚔️"
          title="FadesStage Battle"
          subtitle="Challenge a creator. Audience votes with gifts. Top earner wins."
          features={['⚔️ Live Battle', '🎁 Gifts', '📊 Score', '👑 Winner']}
          buttonLabel="Start Battle"
          buttonStyle={{ background: `linear-gradient(135deg, ${CRIMSON}, #4d0013)`, color: '#fff' }}
          href={createPageUrl('PKBattle')}
        />

        {/* Card 3: Watch Party */}
        <GoLiveCard
          icon="📺"
          title="Watch Party"
          subtitle="Sync a video with your crew. React together in real time."
          features={['🔗 Sync Playback', '💬 Live Chat', '❤️ React', '🌐 Any Video']}
          buttonLabel="Start Party"
          buttonStyle={{ background: 'transparent', color: GOLD, border: `1.5px solid ${GOLD}` }}
          href={createPageUrl('WatchParty')}
        />

        {/* Info bar */}
        <p style={{
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: 12,
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.05em',
          marginTop: 8,
          padding: '0 8px',
          lineHeight: 1.6,
        }}>
          Multi-Language Chat is always on · 90% Creator Payout · Powered by SeeWhy LIVE
        </p>
      </div>
    </div>
  );
}
