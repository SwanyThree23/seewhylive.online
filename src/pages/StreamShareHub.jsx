import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const BG    = '#080B18';
const BG2   = 'rgba(13,6,24,0.95)';
const GOLD  = '#D4AF37';
const GOLDD = '#8A6F2E';
const SLATE = '#1A1530';
const TEXT  = '#F0EAF8';
const TEXTD = '#B8AECF';
const TEXTM = '#7A6E8A';
const CRIMSON = '#800020';
const CYAN  = '#D4AF37';
const GREEN = '#22c55e';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'Space Mono, monospace' };

const GLOBAL_CSS = `
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse-live{0%,100%{opacity:1;}50%{opacity:.35;}}
.fade-up{animation:fadeUp .3s ease forwards;}
.live-dot{animation:pulse-live 1.1s ease infinite;}
`;

// All platforms with proper share URL builders
const PLATFORMS = [
  {
    key: 'twitter',
    label: 'X / Twitter',
    bg: '#000',
    icon: '𝕏',
    getUrl: (url, title) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔴 ${title} — Watch live: ${url} #SeeWhyLIVE`)}`,
    note: 'Tweet embeds as a preview card with native playback',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    bg: '#1877F2',
    icon: 'f',
    getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    note: 'Shares to Feed, Groups, or Stories',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    bg: '#25D366',
    icon: '💬',
    getUrl: (url, title) => `https://wa.me/?text=${encodeURIComponent(`🔴 *${title}* — Watch live now: ${url}`)}`,
    note: 'Link preview appears in chat and Status',
  },
  {
    key: 'discord',
    label: 'Discord',
    bg: '#5865F2',
    icon: '🎮',
    getUrl: (url, title) => `https://discord.com/channels/@me?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    action: (url, title, setCopied) => {
      navigator.clipboard.writeText(`🔴 **${title}** — Watch live: ${url}`);
      setCopied('discord');
    },
    note: 'Paste in any channel — auto-embeds with title, thumbnail & live badge',
  },
  {
    key: 'telegram',
    label: 'Telegram',
    bg: '#2AABEE',
    icon: '✈️',
    getUrl: (url, title) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`🔴 ${title}`)}`,
    note: 'Link preview in channels and DMs',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    bg: '#0A66C2',
    icon: 'in',
    getUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    note: 'Post to your feed or a company page',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    bg: 'linear-gradient(135deg, #f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
    icon: '📸',
    action: (url, title, setCopied) => {
      navigator.clipboard.writeText(url);
      setCopied('instagram');
    },
    note: 'Copy link → paste in your Story sticker or bio link',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    bg: '#010101',
    icon: '♪',
    action: (url, title, setCopied) => {
      navigator.clipboard.writeText(`${title} — Watch live: ${url}`);
      setCopied('tiktok');
    },
    note: 'Copy → paste in bio, Spark Ads link, or video caption',
  },
  {
    key: 'snapchat',
    label: 'Snapchat',
    bg: '#FFFC00',
    textColor: '#000',
    icon: '👻',
    getUrl: (url) => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`,
    note: 'Add as a Snap attachment or story swipe-up link',
  },
];

function buildWatchUrl(roomId) {
  const origin = window.location.origin;
  return `${origin}/watch?id=${roomId}`;
}

function buildEmbedCode(roomId) {
  const origin = window.location.origin;
  return `<iframe\n  src="${origin}/embed?room=${roomId}"\n  width="560"\n  height="315"\n  frameborder="0"\n  allow="autoplay; camera; microphone; fullscreen"\n  allowfullscreen\n  title="SeeWhy LIVE Stream"\n></iframe>`;
}

function CopyButton({ text, label = 'COPY', successLabel = 'COPIED ✓', style: s = {} }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={copy} style={{
      ...MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
      background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(212,175,55,0.15)',
      border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(212,175,55,0.4)'}`,
      borderRadius: 8, padding: '7px 14px',
      color: copied ? GREEN : GOLD,
      cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
      ...s,
    }}>
      {copied ? successLabel : label}
    </button>
  );
}

function QRPreview({ url }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}&bgcolor=080B18&color=D4AF37&margin=10`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <img
        src={qrUrl}
        alt="QR Code for stream"
        width={120}
        height={120}
        style={{ borderRadius: 10, border: `2px solid rgba(212,175,55,0.3)` }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div style={{ ...MONO, fontSize: 9, color: TEXTM, textAlign: 'center' }}>Scan to watch</div>
    </div>
  );
}

export default function StreamShareHub() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('id');

  const [room, setRoom]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [copiedKey, setCopied]  = useState(null);
  const [activeSection, setActiveSection] = useState('share'); // share | embed | qr | flywheel

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (!roomId) { setLoading(false); return; }
    base44.entities.Room.filter({ id: roomId })
      .then(rooms => { if (rooms?.length) setRoom(rooms[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId]);

  // Auto-clear copied state
  useEffect(() => {
    if (!copiedKey) return;
    const t = setTimeout(() => setCopied(null), 2500);
    return () => clearTimeout(t);
  }, [copiedKey]);

  const watchUrl  = roomId ? buildWatchUrl(roomId) : window.location.href;
  const embedCode = roomId ? buildEmbedCode(roomId) : '';
  const streamTitle = room?.title || 'SeeWhy LIVE Stream';
  const isLive    = room?.status === 'live';

  function handlePlatform(platform) {
    if (platform.action) {
      platform.action(watchUrl, streamTitle, setCopied);
    } else if (platform.getUrl) {
      window.open(platform.getUrl(watchUrl, streamTitle), '_blank', 'noopener,noreferrer');
    }
  }

  const TABS = [
    { key: 'share',    label: '🌐 Share' },
    { key: 'embed',    label: '🖥️ Embed' },
    { key: 'qr',       label: '📱 QR Code' },
    { key: 'flywheel', label: '🔁 Flywheel' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '14px 20px', background: BG2, borderBottom: `1px solid ${SLATE}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${CRIMSON}, #a0002a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📡</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <div style={{ ...T, fontSize: 20, fontWeight: 900, color: TEXT, letterSpacing: '0.06em', lineHeight: 1 }}>
                {loading ? 'Loading…' : (streamTitle)}
              </div>
              {isLive && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#fff', background: CRIMSON, borderRadius: 999, padding: '2px 8px' }}>
                  <span className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
                  LIVE
                </span>
              )}
            </div>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{watchUrl}</div>
          </div>
        </div>
      </div>

      {/* Watch link — always visible */}
      <div style={{ padding: '12px 16px', background: 'rgba(212,175,55,0.05)', borderBottom: `1px solid rgba(212,175,55,0.12)`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginBottom: 4 }}>YOUR STREAM LINK</div>
            <div style={{ ...MONO, fontSize: 12, color: GOLD, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 12px', wordBreak: 'break-all' }}>
              {watchUrl}
            </div>
          </div>
          <CopyButton text={watchUrl} />
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${SLATE}`, background: BG2, flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            style={{
              ...T, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
              padding: '11px 18px', border: 'none', cursor: 'pointer',
              background: 'none', color: activeSection === tab.key ? GOLD : TEXTM,
              borderBottom: `2px solid ${activeSection === tab.key ? GOLD : 'transparent'}`,
              transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {/* ── SHARE TAB ── */}
        {activeSection === 'share' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.12em', marginBottom: 4 }}>
              SELECT PLATFORM — stream link auto-formats for each
            </div>
            {PLATFORMS.map(platform => (
              <button
                key={platform.key}
                onClick={() => handlePlatform(platform)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: BG2, border: `1px solid ${copiedKey === platform.key ? GOLD : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12, padding: '12px 14px',
                  cursor: 'pointer', transition: 'border-color 0.15s', textAlign: 'left',
                  width: '100%',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: platform.bg, border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 900, color: platform.textColor || '#fff',
                }}>
                  {platform.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...T, fontSize: 16, fontWeight: 800, color: TEXT, letterSpacing: '0.03em' }}>
                    {platform.label}
                    {copiedKey === platform.key && (
                      <span style={{ ...MONO, fontSize: 9, color: GREEN, letterSpacing: '0.08em', marginLeft: 8 }}>COPIED ✓</span>
                    )}
                  </div>
                  <div style={{ ...MONO, fontSize: 9, color: TEXTM, marginTop: 2, lineHeight: 1.4 }}>{platform.note}</div>
                </div>
                <span style={{ ...T, fontSize: 13, fontWeight: 700, color: TEXTM, flexShrink: 0, letterSpacing: '0.05em' }}>
                  {platform.action ? 'COPY' : 'SHARE ↗'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── EMBED TAB ── */}
        {activeSection === 'embed' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Live preview */}
            <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${SLATE}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ ...T, fontSize: 14, fontWeight: 700, color: TEXT }}>Embed Preview</div>
                <div style={{ ...MONO, fontSize: 9, color: TEXTM }}>560×315 (16:9)</div>
              </div>
              <div style={{ padding: 12, background: '#111' }}>
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: 'rgba(0,0,0,0.6)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <iframe
                    src={roomId ? `/embed?room=${roomId}` : undefined}
                    title="SeeWhy LIVE Stream Embed Preview"
                    allow="autoplay; camera; microphone; fullscreen"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                    loading="lazy"
                  />
                  {!roomId && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 32 }}>📺</div>
                      <div style={{ ...T, fontSize: 14, color: TEXTM }}>Select a room to preview</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Embed code */}
            <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ ...T, fontSize: 14, fontWeight: 700, color: TEXT }}>iframe Embed Code</div>
                <CopyButton text={embedCode} />
              </div>
              <pre style={{ ...MONO, fontSize: 11, color: CYAN, background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '12px 14px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, lineHeight: 1.6 }}>
                {embedCode}
              </pre>
            </div>

            {/* Platform notes */}
            <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ ...T, fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Platform-Specific Notes</div>
              {[
                { platform: 'Twitter / X', tip: 'Paste your watch link as a tweet — Twitter auto-generates a card. Use embed code in linked articles.' },
                { platform: 'Discord', tip: 'Paste watch link in any channel — Discord renders an inline preview with title + thumbnail.' },
                { platform: 'Facebook', tip: 'Share the watch link to Feed/Groups. For Pages, paste embed code in a website tab.' },
                { platform: 'Instagram', tip: 'No web embed — add watch link to bio, then use a Story sticker with link.' },
                { platform: 'Websites / Blogs', tip: 'Paste the iframe code directly into your HTML. Works in Squarespace, WordPress, Wix, and Webflow.' },
              ].map(item => (
                <div key={item.platform} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                  <div style={{ ...T, fontSize: 14, fontWeight: 700, color: GOLD, marginBottom: 2 }}>{item.platform}</div>
                  <div style={{ ...MONO, fontSize: 10, color: TEXTD, lineHeight: 1.5 }}>{item.tip}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── QR TAB ── */}
        {activeSection === 'qr' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 320, width: '100%' }}>
              <div style={{ ...T, fontSize: 16, fontWeight: 700, color: TEXT, textAlign: 'center' }}>Scan to Watch</div>
              <QRPreview url={watchUrl} />
              <div style={{ ...MONO, fontSize: 10, color: TEXTM, textAlign: 'center', lineHeight: 1.6 }}>
                Print this QR code on flyers, business cards, or show it on-screen during your stream for instant viewer access
              </div>
              <CopyButton text={watchUrl} label="COPY LINK" style={{ width: '100%', justifyContent: 'center' }} />
            </div>
            <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, padding: '14px 16px', maxWidth: 320, width: '100%' }}>
              <div style={{ ...T, fontSize: 14, fontWeight: 700, color: GOLD, marginBottom: 8 }}>Use Cases</div>
              {['Show QR on a physical flyer or banner', 'Display QR on-screen between rounds', 'Add to email newsletters', 'Print on tournament brackets'].map(tip => (
                <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: GOLD, fontSize: 12 }}>✓</span>
                  <span style={{ ...MONO, fontSize: 10, color: TEXTD, lineHeight: 1.4 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VIRAL FLYWHEEL TAB ── */}
        {activeSection === 'flywheel' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'rgba(212,175,55,0.06)', border: `1px solid rgba(212,175,55,0.2)`, borderRadius: 14, padding: '16px' }}>
              <div style={{ ...T, fontSize: 20, fontWeight: 900, color: GOLD, letterSpacing: '0.05em', marginBottom: 6 }}>🔁 The Viral Flywheel</div>
              <div style={{ ...MONO, fontSize: 11, color: TEXTD, lineHeight: 1.7 }}>
                Every embed you share creates an automatic growth engine. Viewers on external platforms see a "Powered by SeeWhy LIVE" badge — sparking curiosity and driving app downloads without any paid ads.
              </div>
            </div>

            {/* Steps */}
            {[
              { step: '01', icon: '📡', title: 'You Go Live', desc: 'Start your stream on SeeWhy LIVE. Your unique watch link and embed code are auto-generated.' },
              { step: '02', icon: '🌐', title: 'Share Everywhere', desc: 'Post your watch link to Instagram, Twitter, Discord, WhatsApp, TikTok, Snapchat, LinkedIn, and Facebook.' },
              { step: '03', icon: '👁️', title: 'Viewers Watch In-App', desc: 'Your audience watches the embedded stream inside their preferred social platform — zero friction, no app download needed.' },
              { step: '04', icon: '✨', title: 'Attribution Badge', desc: 'Every embed shows "▶ Powered by SeeWhy LIVE" in gold. Curious viewers click it to explore the platform.' },
              { step: '05', icon: '📲', title: 'New Creators Join', desc: 'Intrigued outsiders download SeeWhy LIVE to start their own streams — growing the network exponentially.' },
              { step: '06', icon: '💰', title: '90% Revenue Yours', desc: 'New viewers can subscribe, tip, or unlock PPV content directly from the embed — you keep 90% via Stripe Connect.' },
            ].map(step => (
              <div key={step.step} style={{ background: BG2, border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ ...MONO, fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '0.08em', flexShrink: 0, paddingTop: 2 }}>{step.step}</div>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{step.icon}</div>
                <div>
                  <div style={{ ...T, fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ ...MONO, fontSize: 10, color: TEXTD, lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}

            {/* Attribution badge preview */}
            <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ ...T, fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 10 }}>Attribution Badge Preview</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Dark background preview */}
                <div style={{ background: '#000', borderRadius: 10, padding: '20px', display: 'flex', alignItems: 'flex-end' }}>
                  <a href="https://seewhylive.online" target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', color: 'rgba(212,175,55,0.7)',
                    textDecoration: 'none', padding: '4px 10px',
                    background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: 999,
                  }}>
                    ▶ Powered by SeeWhy LIVE
                  </a>
                </div>
                <div style={{ ...MONO, fontSize: 9, color: TEXTM }}>
                  This badge appears on every embedded stream. Clicking it opens seewhylive.online in a new tab.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

