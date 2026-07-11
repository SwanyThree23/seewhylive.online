import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from '@/api/base44Client';
import TranscriptionPanel from '../components/streaming/TranscriptionPanel';

const BG   = '#080B18';
const BG2  = 'rgba(13,6,24,0.95)';
const BG3  = '#0D0A1A';
const GOLD = '#D4AF37';
const GOLDD = '#8A6F2E';
const SLATE = '#1A1530';
const TEXT  = '#F0EAF8';
const TEXTD = '#B8AECF';
const TEXTM = '#7A6E8A';
const CYAN  = '#D4AF37';
const GREEN = '#22c55e';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'Space Mono, monospace' };

const CAPTION_NINJA_URL = 'https://caption.ninja';

const SUPPORTED_LANGS = [
  { code: 'en', label: 'English',    flag: '🇺🇸', voice: 'en-US' },
  { code: 'es', label: 'Español',    flag: '🇪🇸', voice: 'es-ES' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷', voice: 'fr-FR' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷', voice: 'pt-BR' },
  { code: 'zh', label: '中文',        flag: '🇨🇳', voice: 'zh-CN' },
  { code: 'ar', label: 'العربية',    flag: '🇸🇦', voice: 'ar-SA' },
];

const EXPORT_FORMATS = [
  { key: 'srt',  label: 'SRT',  mime: 'text/plain', ext: 'srt' },
  { key: 'txt',  label: 'TXT',  mime: 'text/plain', ext: 'txt' },
  { key: 'json', label: 'JSON', mime: 'application/json', ext: 'json' },
];

const GLOBAL_CSS = `
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse-live{0%,100%{opacity:1;}50%{opacity:0.4;}}
.caption-fade{animation:fadeUp .3s ease forwards;}
.live-dot{animation:pulse-live 1.2s ease infinite;}
`;

function pad(n, l=2){ return String(n).padStart(l,'0'); }

function msToSrt(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(cs,2)}`;
}

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {}); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? GREEN : TEXTM, padding: 4, display: 'flex', alignItems: 'center', gap: 4 }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span style={{ ...MONO, fontSize: 9, letterSpacing: '0.06em' }}>{copied ? 'COPIED' : 'COPY'}</span>
    </button>
  );
}

export default function TranscriptionStudio() {
  const [activeLang, setActiveLang] = useState('en');
  const [captionHistory, setCaptionHistory] = useState([]);
  const [translating, setTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [targetLang, setTargetLang] = useState('es');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [demoText, setDemoText] = useState('');
  const [demoActive, setDemoActive] = useState(false);
  const demoRef = useRef(null);
  const startMsRef = useRef(Date.now());

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const captionUrl = `${CAPTION_NINJA_URL}/?room=seewhy_live&lang=${activeLang}`;

  function addDemoCaption() {
    const samples = [
      "Welcome to SeeWhy LIVE — the home of domino culture.",
      "Washington takes the first round with a clean set on the double-six.",
      "Texas counters with a tactical play from the boneyard.",
      "The crowd is going crazy as Washington locks the board!",
      "Final score: Washington 150, Texas 95. State vs State live!",
    ];
    const text = samples[captionHistory.length % samples.length];
    const now = Date.now();
    const startMs = now - startMsRef.current;
    const entry = { text, startMs, endMs: startMs + 3000, lang: activeLang };
    setCaptionHistory(prev => [...prev, entry]);
    setDemoText(text);
    setTimeout(() => setDemoText(''), 3500);
  }

  function toggleDemo() {
    if (demoActive) {
      clearInterval(demoRef.current);
      setDemoActive(false);
    } else {
      startMsRef.current = Date.now();
      addDemoCaption();
      demoRef.current = setInterval(addDemoCaption, 4000);
      setDemoActive(true);
    }
  }

  useEffect(() => {
    return () => { if (demoRef.current) clearInterval(demoRef.current); };
  }, []);

  async function translateCaption() {
    if (!demoText || translating) return;
    setTranslating(true);
    setTranslatedText('');
    try {
      const sourceName = SUPPORTED_LANGS.find(l => l.code === activeLang)?.label || activeLang;
      const targetName = SUPPORTED_LANGS.find(l => l.code === targetLang)?.label || targetLang;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate the following caption from ${sourceName} to ${targetName}. Return only the translated text, nothing else.\n\nCaption: "${demoText}"`
      });
      setTranslatedText(res?.trim() || '');
    } catch {
      setTranslatedText('[Translation unavailable]');
    }
    setTranslating(false);
  }

  useEffect(() => () => { liveRef.current = false; recRef.current?.stop?.(); }, []);

  const fullText = lines.map(l => `[${l.time}] ${l.text}`).join('\n');
  const srtText  = buildSRT(lines);

  function downloadSRT() {
    const blob = new Blob([srtText], { type: 'text/plain' });
    const a = document.createElement('a');
    const srtUrl = URL.createObjectURL(blob);
    a.href = srtUrl;
    a.download = 'transcript.srt';
    a.click();
    URL.revokeObjectURL(srtUrl);
  }

  function clearHistory() {
    setCaptionHistory([]);
    setDemoText('');
    startMsRef.current = Date.now();
  }

  const otherLangs = SUPPORTED_LANGS.filter(l => l.code !== activeLang);

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', background: BG2, borderBottom: `1px solid ${SLATE}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: `linear-gradient(135deg, #00bcd4, #0097a7)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>🎙️</div>
          <div>
            <div style={{ ...T, fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: '0.08em', lineHeight: 1 }}>TRANSCRIPTION STUDIO</div>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>CAPTION.NINJA INTEGRATION · 6 LANGUAGES · AI TRANSLATION</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />
          <span style={{ ...MONO, fontSize: 9, color: GREEN, letterSpacing: '0.1em' }}>LIVE</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Language selector */}
        <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ ...T, fontSize: 11, fontWeight: 700, color: TEXTM, letterSpacing: '0.1em', marginBottom: 12 }}>SELECT CAPTION LANGUAGE</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUPPORTED_LANGS.map(lang => (
              <button
                key={lang.code}
                onClick={() => setActiveLang(lang.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  ...T, fontSize: 14, fontWeight: 700, letterSpacing: '0.04em',
                  background: activeLang === lang.code ? `rgba(212,175,55,0.15)` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeLang === lang.code ? GOLD : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 999, padding: '8px 16px',
                  color: activeLang === lang.code ? GOLD : TEXTD,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 18 }}>{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Caption.Ninja Embed */}
        <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${SLATE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ ...T, fontSize: 14, fontWeight: 700, color: TEXT, letterSpacing: '0.05em' }}>
              CAPTION.NINJA LIVE FEED
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href={captionUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...MONO, fontSize: 10, color: CYAN,
                  textDecoration: 'none', letterSpacing: '0.08em',
                  background: 'rgba(212,175,55,0.1)', border: `1px solid rgba(212,175,55,0.25)`,
                  borderRadius: 6, padding: '5px 12px',
                }}
              >
                OPEN ↗
              </a>
            </div>
          </div>
          <div style={{ position: 'relative', height: 240, background: '#000' }}>
            <iframe
              key={activeLang}
              src={captionUrl}
              title="Caption.Ninja Live Captions"
              onLoad={() => setIframeLoaded(true)}
              style={{ width: '100%', height: '100%', border: 'none', opacity: iframeLoaded ? 1 : 0, transition: 'opacity 0.4s' }}
              allow="microphone"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
            {!iframeLoaded && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                <div style={{ width: 28, height: 28, border: `3px solid rgba(212,175,55,0.2)`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ ...MONO, fontSize: 10, color: TEXTM }}>Loading Caption.Ninja…</div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
          </div>
          {/* Demo overlay for caption history */}
          {demoText && (
            <div className="caption-fade" style={{ padding: '14px 20px', textAlign: 'center', borderTop: `1px solid ${SLATE}` }}>
              <div style={{ ...T, fontSize: 20, fontWeight: 700, color: TEXT, letterSpacing: '0.04em' }}>"{demoText}"</div>
            </div>
          )}
        </div>

        {/* Demo controls */}
        <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ ...T, fontSize: 11, fontWeight: 700, color: TEXTM, letterSpacing: '0.1em', marginBottom: 12 }}>DEMO CAPTION FEED</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={toggleDemo}
              style={{
                ...T, fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
                background: demoActive ? 'rgba(128,0,32,0.2)' : 'rgba(212,175,55,0.15)',
                border: `1px solid ${demoActive ? '#800020' : GOLD}`,
                borderRadius: 8, padding: '8px 20px',
                color: demoActive ? '#ff6b6b' : GOLD, cursor: 'pointer',
              }}
            >
              {demoActive ? '⏹ STOP DEMO' : '▶ START DEMO'}
            </button>
            <button
              onClick={clearHistory}
              disabled={captionHistory.length === 0}
              style={{
                ...T, fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
                background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`,
                borderRadius: 8, padding: '8px 16px',
                color: captionHistory.length === 0 ? TEXTM : TEXT, cursor: captionHistory.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              CLEAR
            </button>
            <div style={{ ...MONO, fontSize: 10, color: TEXTM, letterSpacing: '0.08em' }}>
              {captionHistory.length} caption{captionHistory.length !== 1 ? 's' : ''} captured
            </div>
          </div>
        </div>

        {/* AI Translation */}
        <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ ...T, fontSize: 11, fontWeight: 700, color: TEXTM, letterSpacing: '0.1em', marginBottom: 12 }}>AI TRANSLATION</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ ...MONO, fontSize: 10, color: TEXTD }}>Translate last caption to:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {otherLangs.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setTargetLang(lang.code)}
                  style={{
                    ...T, fontSize: 12, fontWeight: 700,
                    background: targetLang === lang.code ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${targetLang === lang.code ? CYAN : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 999, padding: '5px 12px',
                    color: targetLang === lang.code ? CYAN : TEXTD, cursor: 'pointer',
                  }}
                >
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={translateCaption}
            disabled={!demoText || translating}
            style={{
              ...T, fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
              background: !demoText || translating ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.15)',
              border: `1px solid ${!demoText || translating ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.4)'}`,
              borderRadius: 8, padding: '9px 20px',
              color: !demoText || translating ? TEXTM : CYAN, cursor: !demoText || translating ? 'not-allowed' : 'pointer',
              marginBottom: 12,
            }}
          >
            {translating ? 'TRANSLATING…' : '🌐 TRANSLATE LAST CAPTION'}
          </button>
          {translatedText && (
            <div className="caption-fade" style={{ background: 'rgba(212,175,55,0.06)', border: `1px solid rgba(212,175,55,0.2)`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ ...MONO, fontSize: 9, color: CYAN, letterSpacing: '0.1em', marginBottom: 6 }}>
                {SUPPORTED_LANGS.find(l => l.code === targetLang)?.label?.toUpperCase()} TRANSLATION
              </div>
              <div style={{ fontSize: 16, color: TEXT, lineHeight: 1.5 }}>{translatedText}</div>
            </div>
          )}
        </div>

        {/* Caption History */}
        {captionHistory.length > 0 && (
          <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ ...T, fontSize: 11, fontWeight: 700, color: TEXTM, letterSpacing: '0.1em' }}>
                CAPTION HISTORY ({captionHistory.length})
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {EXPORT_FORMATS.map(fmt => (
                  <button
                    key={fmt.key}
                    onClick={() => handleExport(fmt)}
                    style={{
                      ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                      background: 'rgba(212,175,55,0.1)', border: `1px solid rgba(212,175,55,0.3)`,
                      borderRadius: 6, padding: '5px 12px',
                      color: GOLD, cursor: 'pointer',
                    }}
                  >
                    ↓ {fmt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {captionHistory.slice().reverse().map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                  <div style={{ ...MONO, fontSize: 9, color: TEXTM, flexShrink: 0, paddingTop: 2 }}>{msToSrt(c.startMs).slice(0, 8)}</div>
                  <div style={{ fontSize: 14, color: TEXTD, lineHeight: 1.4 }}>{c.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transcription panel for VOD recordings */}
        <TranscriptionPanel recordingUrl={null} roomTitle="Live Session" />

        {/* Caption.Ninja link */}
        <div style={{ background: 'rgba(212,175,55,0.05)', border: `1px solid rgba(212,175,55,0.15)`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ ...T, fontSize: 14, fontWeight: 700, color: CYAN, letterSpacing: '0.05em' }}>Caption.Ninja Integration</div>
            <div style={{ ...MONO, fontSize: 10, color: TEXTM, marginTop: 4 }}>Use Caption.Ninja browser extension to broadcast real-time captions from your stream</div>
          </div>
          <a
            href="https://caption.ninja"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...T, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
              background: 'rgba(212,175,55,0.15)', border: `1px solid rgba(212,175,55,0.35)`,
              borderRadius: 8, padding: '8px 18px',
              color: CYAN, textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            OPEN CAPTION.NINJA ↗
          </a>
        </div>
      </div>
    </div>
  );
}
