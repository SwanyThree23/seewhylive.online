/*
  SeeWhy LIVE — shared UI atoms for the frontend/ app.
  Conventions: var only, function expressions, no optional chaining, inline styles.
*/
import React, { useState, useEffect, useRef } from 'react';
import { T } from './theme.js';

/* ─── LiveCard ──────────────────────────────────────────────────────────────
   Stream preview card used in DiscoverTab, search results, following feed.
   Props: room {id, title, host_name, viewer_count, thumbnail_url, status},
          onClick fn, width (px, default 160), showHost (bool, default true)
*/
export function LiveCard(props) {
  var room       = props.room || {};
  var onClick    = props.onClick;
  var width      = props.width || 160;
  var showHost   = props.showHost !== false;
  var isLive     = room.status === 'live' || room.status === 'active';

  return (
    <div
      onClick={onClick}
      style={{
        width: width, flexShrink: 0, borderRadius: T.r12, overflow: 'hidden',
        background: T.card, border: '1px solid ' + (isLive ? 'rgba(255,26,60,.22)' : T.line),
        cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', height: width * 0.56, background: T.surf, overflow: 'hidden' }}>
        {room.thumbnail_url
          ? <img src={room.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,' + T.card2 + ',' + T.surf + ')' }} />
        }
        {isLive && (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            background: T.red, color: '#fff',
            fontFamily: T.fontHead, fontWeight: 900, fontSize: 9,
            letterSpacing: '.1em', padding: '2px 6px', borderRadius: T.r4,
          }}>LIVE</div>
        )}
        {typeof room.viewer_count === 'number' && (
          <div style={{
            position: 'absolute', bottom: 5, right: 6,
            background: 'rgba(0,0,0,.65)', color: T.muted,
            fontFamily: T.fontMono, fontSize: 9,
            padding: '2px 5px', borderRadius: T.r4,
          }}>👁 {room.viewer_count}</div>
        )}
      </div>
      {/* Meta */}
      <div style={{ padding: '7px 9px 9px' }}>
        <p style={{ margin: '0 0 2px', fontFamily: T.fontHead, fontWeight: 900, fontSize: 12, color: T.cream, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {room.title || 'Live Stream'}
        </p>
        {showHost && room.host_name && (
          <p style={{ margin: 0, fontFamily: T.fontMono, fontSize: 9, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {room.host_name}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Avatar ────────────────────────────────────────────────────────────────
   User avatar circle. Props: src, name, size (px, default 36), isLive, isSpeaking
*/
export function Avatar(props) {
  var src        = props.src;
  var name       = props.name || '?';
  var size       = props.size || 36;
  var isLive     = props.isLive;
  var isSpeaking = props.isSpeaking;
  var initial    = (name[0] || '?').toUpperCase();

  var ringColor = isSpeaking ? T.teal : (isLive ? T.red : 'transparent');
  var shadow    = isSpeaking ? ('0 0 0 2px ' + T.teal + ',0 0 12px ' + T.teal + '44')
                : isLive     ? ('0 0 0 2px ' + T.red  + ',0 0 10px ' + T.red  + '44')
                : 'none';

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', background: T.card2,
      border: '2px solid ' + ringColor,
      boxShadow: shadow,
      transition: 'box-shadow .2s, border-color .2s',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <span style={{ fontFamily: T.fontHead, fontWeight: 900, fontSize: size * 0.4, color: T.gold, lineHeight: 1 }}>{initial}</span>
      }
    </div>
  );
}

/* ─── StatTile ──────────────────────────────────────────────────────────────
   Metric tile for analytics, payouts.
   Props: label, value, sub, color (accent hex), icon (string emoji or element)
*/
export function StatTile(props) {
  var label = props.label || '';
  var value = props.value !== undefined ? props.value : '—';
  var sub   = props.sub   || '';
  var color = props.color || T.gold;
  var icon  = props.icon  || null;

  return (
    <div style={{
      flex: '1 1 0', minWidth: 80,
      padding: '12px 14px', borderRadius: T.r12,
      background: T.card, border: '1px solid ' + T.line,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {icon && <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 2 }}>{icon}</div>}
      <div style={{ fontFamily: T.fontHead, fontWeight: 900, fontSize: 22, color: color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: 10, color: T.cream, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>
      {sub && <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.muted }}>{sub}</div>}
    </div>
  );
}

/* ─── ShareRow ──────────────────────────────────────────────────────────────
   Horizontal row of share buttons. Props: url, title, compact (bool)
*/
var SHARE_PLATFORMS = [
  { id: 'copy',      emoji: '🔗', label: 'Copy',      action: 'copy' },
  { id: 'twitter',   emoji: '🐦', label: 'X',         url: function(u,t){ return 'https://twitter.com/intent/tweet?text='+encodeURIComponent(t+' '+u); } },
  { id: 'whatsapp',  emoji: '💬', label: 'WhatsApp',  url: function(u,t){ return 'https://wa.me/?text='+encodeURIComponent(t+' '+u); } },
  { id: 'facebook',  emoji: '📘', label: 'Facebook',  url: function(u,t){ return 'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(u); } },
];

export function ShareRow(props) {
  var url     = props.url   || (typeof window !== 'undefined' ? window.location.href : '');
  var title   = props.title || 'Watch on SeeWhy LIVE';
  var compact = props.compact || false;
  var [copied, setCopied] = useState(false);

  var handleShare = function(p) {
    if (p.action === 'copy') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function() {
          setCopied(true);
          setTimeout(function() { setCopied(false); }, 2000);
        });
      }
      return;
    }
    if (p.url) window.open(p.url(url, title), '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {SHARE_PLATFORMS.map(function(p) {
        var isCopy = p.id === 'copy';
        return (
          <button
            key={p.id}
            onClick={function() { handleShare(p); }}
            style={{
              display: 'flex', flexDirection: compact ? 'row' : 'column',
              alignItems: 'center', gap: compact ? 5 : 3,
              padding: compact ? '8px 12px' : '10px 14px',
              borderRadius: T.r12,
              background: T.card, border: '1px solid ' + T.line,
              color: T.cream, cursor: 'pointer',
              fontFamily: T.fontHead, fontSize: 11, fontWeight: 700,
              minWidth: T.tap, minHeight: T.tap,
              transition: 'background .15s',
            }}
          >
            <span style={{ fontSize: 18 }}>{isCopy && copied ? '✅' : p.emoji}</span>
            {!compact && <span style={{ color: T.muted, fontSize: 9 }}>{isCopy && copied ? 'Copied' : p.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── FAB ───────────────────────────────────────────────────────────────────
   Floating action button. Props: onClick, icon (emoji/el), label, color, bottom, right
*/
export function FAB(props) {
  var onClick = props.onClick;
  var icon    = props.icon  || '＋';
  var label   = props.label || '';
  var color   = props.color || T.burg;
  var bottom  = props.bottom !== undefined ? props.bottom : 80;
  var right   = props.right  !== undefined ? props.right  : 16;

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed', bottom: bottom, right: right, zIndex: 300,
        width: 52, height: 52, borderRadius: '50%',
        background: 'linear-gradient(135deg,' + color + ',' + T.burg + ')',
        border: 'none', color: '#fff', cursor: 'pointer',
        boxShadow: '0 4px 20px ' + color + '55',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
        transition: 'transform .15s',
        userSelect: 'none', WebkitUserSelect: 'none',
      }}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

/* ─── TourModal ─────────────────────────────────────────────────────────────
   Full-screen onboarding tour. Props: steps [{icon, title, body}], onDone, storageKey
*/
export function TourModal(props) {
  var steps      = props.steps || [];
  var onDone     = props.onDone || function() {};
  var storageKey = props.storageKey || 'sw_tour_done';

  var [step, setStep] = useState(0);

  if (steps.length === 0) return null;

  var current = steps[step] || steps[0];
  var isLast  = step === steps.length - 1;

  var handleNext = function() {
    if (isLast) {
      try { localStorage.setItem(storageKey, '1'); } catch(e) {}
      onDone();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(14,12,9,.96)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Step icon */}
      <div style={{ fontSize: 64, marginBottom: 24, lineHeight: 1 }}>{current.icon || '🎙'}</div>

      {/* Title */}
      <h2 style={{ fontFamily: T.fontHead, fontWeight: 900, fontSize: 28, color: T.cream, textAlign: 'center', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {current.title}
      </h2>

      {/* Body */}
      <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.muted, textAlign: 'center', margin: '0 0 32px', maxWidth: 320, lineHeight: 1.6 }}>
        {current.body}
      </p>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 32 }}>
        {steps.map(function(_, i) {
          return (
            <div key={i} style={{
              width: i === step ? 20 : 7, height: 7, borderRadius: T.rFull,
              background: i === step ? T.gold : T.dim,
              transition: 'width .25s, background .25s',
            }} />
          );
        })}
      </div>

      {/* CTA */}
      <button
        onClick={handleNext}
        style={{
          padding: '14px 36px', borderRadius: T.r12,
          background: 'linear-gradient(135deg,' + T.burg + ',#C01838)',
          border: 'none', color: '#fff', cursor: 'pointer',
          fontFamily: T.fontHead, fontWeight: 900, fontSize: 16,
          letterSpacing: '.08em', textTransform: 'uppercase',
          minWidth: 160, minHeight: T.tap,
        }}
      >
        {isLast ? 'Get Started' : 'Next'}
      </button>

      {/* Skip */}
      {!isLast && (
        <button
          onClick={function() {
            try { localStorage.setItem(storageKey, '1'); } catch(e) {}
            onDone();
          }}
          style={{ marginTop: 16, background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontFamily: T.fontMono, fontSize: 11, minHeight: T.tap, padding: '0 12px' }}
        >
          Skip tour
        </button>
      )}
    </div>
  );
}

/* ─── MessageBar ────────────────────────────────────────────────────────────
   Chat input row. Props: value, onChange, onSend, placeholder, disabled
*/
export function MessageBar(props) {
  var value       = props.value       || '';
  var onChange    = props.onChange    || function() {};
  var onSend      = props.onSend      || function() {};
  var placeholder = props.placeholder || 'Say something…';
  var disabled    = props.disabled    || false;
  var inputRef    = useRef(null);

  var handleKey = function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', background: T.surf,
      borderTop: '1px solid ' + T.line,
    }}>
      <input
        ref={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKey}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1, background: T.card, border: '1px solid ' + T.line,
          borderRadius: T.r24, color: T.cream,
          fontFamily: T.fontBody, fontSize: 16,
          padding: '8px 14px', outline: 'none',
          minHeight: T.tap,
        }}
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        style={{
          width: T.tap, height: T.tap, borderRadius: '50%',
          background: (disabled || !value.trim()) ? T.card : 'linear-gradient(135deg,' + T.burg + ',#C01838)',
          border: 'none', color: '#fff', cursor: (disabled || !value.trim()) ? 'default' : 'pointer',
          fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .2s',
          flexShrink: 0,
        }}
        aria-label="Send"
      >
        ▶
      </button>
    </div>
  );
}
