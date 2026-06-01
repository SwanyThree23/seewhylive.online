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

        {/* Green Room card */}
        <a href="/GreenroomEnhanced"
          className="block rounded-2xl p-5 transition-all hover:border-green-500/30"
          style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(0,255,136,0.12)', textDecoration: 'none' }}>
          <div className="text-4xl mb-3">🎬</div>
          <h2 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Green Room</h2>
          <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>Test camera, mic, and lighting before you go live. AES-256 room PINs included.</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {['🎥 Camera Test', '🎤 Mic Check', '📋 Checklist', '🔐 Room PIN'].map(f => (
              <span key={f} className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(0,255,136,0.08)', color: 'rgba(0,255,136,0.7)', border: '1px solid rgba(0,255,136,0.15)', fontFamily: 'Barlow Condensed, sans-serif' }}>{f}</span>
            ))}
          </div>
          <div className="w-full py-2 rounded-xl text-sm font-black uppercase text-center"
            style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Enter Green Room →
          </div>
        </a>

        {/* Share section */}
        <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
          <div className="text-sm font-black mb-1" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>📢 Tell your audience first</div>
          <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Share on social before you go live — builds anticipation and pulls more viewers in from the start.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { emoji: '💬', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent('🔴 Going LIVE on SeeWhy LIVE soon! Come join me → ' + window.location.origin)}` },
              { emoji: '🐦', label: 'Twitter/X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent('🔴 Going LIVE on SeeWhy LIVE soon! Come join me → ' + window.location.origin)}` },
              { emoji: '👥', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}` },
            ].map(p => (
              <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-xl">{p.emoji}</span>
                <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{p.label}</span>
              </a>
            ))}
          </div>
          <button
            onClick={() => { navigator.clipboard?.writeText(window.location.origin); }}
            className="mt-2 w-full py-2 rounded-xl text-[10px] font-black uppercase"
            style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            📋 Copy Your Profile Link
          </button>
        </div>

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
