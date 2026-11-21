import { useState, useEffect, useRef } from "react";
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { MobileSelect } from '@/components/ui/MobileSelect';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TranscriptionPanel from '../components/streaming/TranscriptionPanel';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import NotificationBell from '../components/shared/NotificationBell';
import AIStreamSummary from '../components/live/AIStreamSummary';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import AIHighlightGenerator from '../components/content/AIHighlightGenerator';
import StreamHealthMonitor from '../components/streaming/StreamHealthMonitor';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Download } from 'lucide-react';
import ShareToSocial from '../components/social/ShareToSocial';
import RecordingManager from '../components/content/RecordingManager';
import LiveTranslationWidget from '../components/streaming/LiveTranslationWidget';
import LiveTranscription from '../components/live/LiveTranscription';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';
import AutomatedHighlightReels from '../components/streaming/AutomatedHighlightReels';
import CollaborationMatcher from '../components/social/CollaborationMatcher';

var BG   = '#080B18';
var BG2  = 'rgba(13,6,24,0.95)';
var BG3  = '#0D0A1A';
var GOLD = '#D4AF37';
var GOLDD = '#8A6F2E';
var SLATE = '#1A1530';
var TEXT  = '#F0EAF8';
var TEXTD = '#B8AECF';
var TEXTM = '#7A6E8A';
var CYAN  = '#D4AF37';
var GREEN = '#6DBF7E';
var SCARL = '#C0392B';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };
var MONO = { fontFamily: 'Space Mono, monospace' };

var CAPTION_NINJA_URL = 'https://caption.ninja';

var SUPPORTED_LANGS = [
  { code: 'en', label: 'English',    flag: '🇺🇸', voice: 'en-US' },
  { code: 'es', label: 'Español',    flag: '🇪🇸', voice: 'es-ES' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷', voice: 'fr-FR' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷', voice: 'pt-BR' },
  { code: 'zh', label: '中文',        flag: '🇨🇳', voice: 'zh-CN' },
  { code: 'ar', label: 'العربية',    flag: '🇸🇦', voice: 'ar-SA' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪', voice: 'de-DE' },
  { code: 'hi', label: 'हिन्दी',    flag: '🇮🇳', voice: 'hi-IN' },
  { code: 'ja', label: '日本語',     flag: '🇯🇵', voice: 'ja-JP' },
  { code: 'ko', label: '한국어',     flag: '🇰🇷', voice: 'ko-KR' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺', voice: 'ru-RU' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹', voice: 'it-IT' },
];

var EXPORT_FORMATS = [
  { key: 'srt',  label: 'SRT',  mime: 'text/plain', ext: 'srt' },
  { key: 'vtt',  label: 'VTT',  mime: 'text/vtt',   ext: 'vtt' },
  { key: 'txt',  label: 'TXT',  mime: 'text/plain', ext: 'txt' },
  { key: 'json', label: 'JSON', mime: 'application/json', ext: 'json' },
];

var GLOBAL_CSS = `
@keyframes caretBlink{0%,100%{opacity:1;}50%{opacity:0;}}
@keyframes lineIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.ts-line{animation:lineIn .25s ease forwards;}
`;


// LANGS derived from SUPPORTED_LANGS so selector and Deepgram mode stay in sync
var LANGS = SUPPORTED_LANGS.map(l => l.label);

function buildSRT(lines) {
  return lines.map((l, i) => {
    var [m, s] = l.time.split(':').slice(1).map(Number);
    var startMs = m * 60000 + s * 1000;
    var endMs   = startMs + 3200;
    var fmt = ms => {
      var hh = String(Math.floor(ms / 3600000)).padStart(2, '0');
      var mm = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
      var ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
      var ff = String(ms % 1000).padStart(3, '0');
      return `${hh}:${mm}:${ss},${ff}`;
    };
    return `${i + 1}\n${fmt(startMs)} --> ${fmt(endMs)}\n${l.text}\n`;
  }).join('\n');
}

function CopyBtn({ value }) {
  var [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? GREEN : TEXTM, padding: 4, display: 'flex', alignItems: 'center', gap: 4 }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span style={{ ...MONO, fontSize: 9, letterSpacing: '0.06em' }}>{copied ? 'COPIED' : 'COPY'}</span>
    </button>
  );
}

export default function TranscriptionStudio() {
  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  var { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', (user && user.id)],
    queryFn: () => base44.entities.Room.filter({ host_id: (user && user.id), status: 'live' }).then(r => r[0] || null),
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var roomId = activeRoomId;

  var [lines, setLines]         = useState([]);
  var [live, setLive]           = useState(false);
  var [lang, setLang]           = useState('English');
  var [showOverlay, setShowOverlay] = useState(true);
  var [autoScroll, setAutoScroll]  = useState(true);
  var [tab, setTab]             = useState('transcript');
  var [searchQuery, setSearchQuery] = useState('');
  var [translateTarget, setTranslateTarget] = useState('');  // target lang code for translation tab
  var [translationMap, setTranslationMap] = useState({});    // { lineId: translated text }
  var bottomRef = useRef(null);
  var tickRef   = useRef(null);
  var idRef     = useRef(1);
  var startMsRef = useRef(Date.now());
  var [captionHistory, setCaptionHistory] = useState([]);
  var [demoText, setDemoText] = useState('');
  var _activeLangEntry = SUPPORTED_LANGS.find(l => l.label === lang);
  var activeLang = (_activeLangEntry && _activeLangEntry.code) || 'en';

  var tsTranslationCache = useRef(new Map());

  async function tsTranslate(text, targetLang) {
    var key = `${text}|${targetLang}`;
    if (tsTranslationCache.current.has(key)) return tsTranslationCache.current.get(key);
    try {
      var res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${activeLang}|${targetLang}`
      );
      if (!res.ok) return null;
      var data = await res.json();
      var result = (data.responseData && data.responseData.translatedText) || null;
      if (result) tsTranslationCache.current.set(key, result);
      return result;
    } catch { return null; }
  }

  useEffect(() => {
    var style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (autoScroll && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [lines, autoScroll]);

  var SIMULATED = [
    "Alright, the players are taking their seats — this is going to be intense.",
    "Georgia is looking sharp tonight, they've been training hard for this rematch.",
    "Seven rock format means the first team to one-fifty wins the game.",
    "Washington's captain is already calling plays — strategic dominoes.",
    "The crowd here is electric, Jamar's Sports Bar showing out!",
    "Double elimination means one loss doesn't end your night.",
    "The host is in the building with the official commentary.",
    "Chat, drop your predictions — who's taking it tonight?",
    "Remember, creator keeps ninety percent on SeeWhy LIVE.",
    "Let's get this bracket started, domino culture all day.",
  ];
  var simIdx = useRef(0);

  function startLive() {
    setLive(true);
    tickRef.current = setInterval(() => {
      var secs = Math.floor(Date.now() / 1000) % 3600;
      var mm   = String(Math.floor(secs / 60)).padStart(2, '0');
      var ss   = String(secs % 60).padStart(2, '0');
      var text = SIMULATED[simIdx.current % SIMULATED.length];
      simIdx.current++;
      setLines(prev => [...prev, { id: idRef.current++, time: `00:${mm}:${ss}`, text }]);
    }, 3800);
  }

  // ── Deepgram live transcription ──────────────────────────────────────────────
  var [dgMode, setDgMode]         = useState(false);    // true = Deepgram active
  var [dgLines, setDgLines]       = useState([]);
  var [dgLive, setDgLive]         = useState(false);
  var dgWsRef    = useRef(null);
  var dgRecRef   = useRef(null);
  var dgChunkRef = useRef(null);

  function getDgKey() { try { return localStorage.getItem('swl_apikey_deepgram') || ''; } catch { return ''; } }

  async function startDeepgram() {
    var key = getDgKey();
    if (!key) { toast.error('Add your Deepgram API key in VaultPro → AI Keys first.'); return; }
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      var ws = new WebSocket(`wss://api.deepgram.com/v1/listen?language=${activeLang}&punctuate=true&interim_results=true`, ['token', key]);
      ws.onopen = () => {
        setDgLive(true);
        var rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        rec.ondataavailable = e => { if (ws.readyState === 1 && e.data.size > 0) ws.send(e.data); };
        rec.start(250);
        dgRecRef.current = rec;
        dgChunkRef.current = stream;
      };
      ws.onmessage = evt => {
        try {
          var d = JSON.parse(evt.data);
          var alt = (d && d.channel && d.channel.alternatives && d.channel.alternatives[0]);
          if (!(alt && alt.transcript)) return;
          var isFinal = d.is_final;
          if (isFinal && alt.transcript.trim()) {
            var now = Date.now() - startMsRef.current;
            var confidence = alt.confidence != null ? Math.round(alt.confidence * 100) : null;
            setDgLines(prev => [...prev, { text: alt.transcript.trim(), startMs: now, endMs: now + 3000, lang: activeLang, confidence }]);
            setCaptionHistory(prev => [...prev, { text: alt.transcript.trim(), startMs: now, endMs: now + 3000, lang: activeLang }]);
            setDemoText(alt.transcript.trim());
            setTimeout(() => setDemoText(''), 4000);
          }
        } catch {}
      };
      ws.onerror = () => stopDeepgram();
      ws.onclose = () => setDgLive(false);
      dgWsRef.current = ws;
    } catch (e) {
      toast.error(`Microphone access denied: ${e.message}`);
    }
  }

  function stopDeepgram() {
    if (dgRecRef.current && dgRecRef.current.stop) dgRecRef.current.stop();
    if (dgChunkRef.current && dgChunkRef.current.getTracks) dgChunkRef.current.getTracks().forEach(function(t) { t.stop(); });
    if (dgWsRef.current && dgWsRef.current.close) dgWsRef.current.close();
    dgRecRef.current = null;
    dgWsRef.current  = null;
    setDgLive(false);
  }

  function stopLive() {
    setLive(false);
    clearInterval(tickRef.current);
    stopDeepgram();
  }

  function msToSrt(ms) {
    var pad = (n, l=2) => String(Math.floor(n)).padStart(l,'0');
    var h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000),cs=Math.floor((ms%1000)/10);
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(cs)}`;
  }

  var fullText = lines.map(l => `[${l.time}] ${l.text}`).join('\n');
  var srtText = lines.map((l, i) => `${i + 1}\n${l.time},000 --> ${l.time},999\n${l.text}\n`).join('\n');

  function downloadSRT() {
    var blob = new Blob([srtText], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'transcript.srt';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  useEffect(() => () => stopDeepgram(), []);

  // Auto-translate lines when a target language is selected
  useEffect(() => {
    if (!translateTarget) return;
    var cancelled = false;
    var pending = lines.filter(l => !translationMap[l.id]);
    pending.slice(-15).forEach(async l => {
      var result = await tsTranslate(l.text, translateTarget);
      if (!cancelled && result) setTranslationMap(prev => ({ ...prev, [l.id]: result }));
    });
    return () => { cancelled = true; };
  }, [lines, translateTarget]);  

  // ── Export helpers ────────────────────────────────────────────────────────────
  function toSrtTime(ms) {
    var pad = (n, l=2) => String(Math.floor(n)).padStart(l,'0');
    var h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000),cs=Math.floor((ms%1000)/10);
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(cs)}`;
  }

  function toVttTime(ms) {
    var pad = (n, l=2) => String(Math.floor(n)).padStart(l,'0');
    var h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000),cs=Math.floor((ms%1000)/10);
    return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`;
  }

  function handleExport(fmt) {
    var content = '';
    if (fmt.key === 'srt') {
      content = captionHistory.map((c, i) => `${i+1}\n${toSrtTime(c.startMs)} --> ${toSrtTime(c.endMs)}\n${c.text}\n`).join('\n');
    } else if (fmt.key === 'vtt') {
      content = 'WEBVTT\n\n' + captionHistory.map((c, i) => `${i+1}\n${toVttTime(c.startMs)} --> ${toVttTime(c.endMs)}\n${c.text}\n`).join('\n');
    } else if (fmt.key === 'json') {
      content = JSON.stringify(captionHistory, null, 2);
    } else {
      content = captionHistory.map(c => `[${msToSrt(c.startMs).slice(0,8)}] ${c.text}`).join('\n');
    }
    var blob = new Blob([content], { type: fmt.mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `transcript.${fmt.ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clearHistory() {
    setCaptionHistory([]);
    setDgLines([]);
    setDemoText('');
    setTranslationMap({});
    tsTranslationCache.current.clear();
    startMsRef.current = Date.now();
  }

  var otherLangs = SUPPORTED_LANGS.filter(l => l.code !== activeLang);

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', background: BG2, borderBottom: `1px solid rgba(212,175,55,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to={createPageUrl('ControlRoom')} style={{ ...T, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: '0.06em', marginRight: 4 }}>← Control Room</Link>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, #4A7C59, #2A5C39)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📝</div>
          <div>
            <div style={{ ...T, fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: '0.08em', lineHeight: 1 }}>TRANSCRIPTION STUDIO</div>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>DEEPGRAM NATIVE · CAPTION.NINJA · {SUPPORTED_LANGS.length} LANGUAGES · AI TRANSLATION · VTT/SRT/JSON</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Language selector */}
          <MobileSelect
            value={lang}
            onChange={v => setLang(v)}
            options={LANGS.map(l => ({ value: l, label: l }))}
            placeholder="Language"
          />

          {/* Overlay toggle */}
          <button onClick={() => setShowOverlay(v => !v)}
            style={{ ...T, fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 99,
              border: `1px solid ${showOverlay ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
              background: showOverlay ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
              color: showOverlay ? GOLD : TEXTM, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {showOverlay ? '🔤 Overlay ON' : '🔤 Overlay OFF'}
          </button>

          {/* Live/Stop */}
          <motion.button whileTap={{ scale: 0.94 }} onClick={live ? stopLive : startLive}
            style={{ ...T, fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
              background: live ? `linear-gradient(135deg, ${SCARL}, #8B1A2F)` : `linear-gradient(135deg, ${GREEN}, #4A9B5E)`,
              color: '#fff', boxShadow: live ? `0 2px 12px ${SCARL}55` : `0 2px 12px rgba(109,191,126,0.4)` }}>
            {live ? '⏹ STOP' : '▶ GO LIVE'}
          </motion.button>
        </div>
      </div>

      {/* Caption preview bar */}
      <AnimatePresence>
        {showOverlay && lines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ background: 'rgba(0,0,0,0.88)', borderBottom: `1px solid rgba(212,175,55,0.1)`, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ ...MONO, fontSize: 9, color: GOLD, flexShrink: 0, letterSpacing: '0.06em' }}>CAPTION</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: TEXT, flex: 1 }}>
              {lines[lines.length - 1].text}
              {live && <span style={{ animation: 'caretBlink 0.8s ease infinite', marginLeft: 2, color: GOLD }}>|</span>}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab strip */}
      <div style={{ display: 'flex', background: BG2, borderBottom: `1px solid rgba(255,255,255,0.07)`, overflowX: 'auto' }}>
        {[['transcript', '📄 Transcript'], ['srt', '🎞 SRT'], ['translate', '🌐 Translate'], ['export', '💾 Export']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: '0 0 auto', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
            ...T, fontSize: 12, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: tab === key ? GOLD : TEXTM,
            borderBottom: tab === key ? `2px solid ${GOLD}` : '2px solid transparent',
            transition: 'all .2s', whiteSpace: 'nowrap',
          }}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {tab === 'transcript' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {live && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, ...MONO, fontSize: 9, color: GREEN, background: 'rgba(109,191,126,0.12)', border: '1px solid rgba(109,191,126,0.3)', borderRadius: 99, padding: '2px 8px' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, display: 'inline-block', animation: 'caretBlink 0.9s ease infinite' }} />
                    LIVE
                  </span>
                )}
                <span style={{ ...MONO, fontSize: 9, color: TEXTM }}>{lines.length} lines · {lang}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search…"
                  style={{ ...MONO, fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: TEXT, outline: 'none', width: 120 }} />
                <CopyBtn value={fullText} />
              </div>
            </div>
            {lines.filter(l => !searchQuery || l.text.toLowerCase().includes(searchQuery.toLowerCase())).map(l => (
              <div key={l.id} className="ts-line" style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                <span style={{ ...MONO, fontSize: 10, color: GOLD, flexShrink: 0, minWidth: 60 }}>{l.time}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: TEXTD, lineHeight: 1.5, flex: 1 }}>{l.text}</span>
              </div>
            ))}
            {lines.length === 0 && <div style={{ ...MONO, fontSize: 11, color: TEXTM, textAlign: 'center', padding: '40px 0' }}>Press GO LIVE to start transcribing…</div>}
            <div ref={bottomRef} />
          </div>
        )}

        {tab === 'srt' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ ...T, fontSize: 13, fontWeight: 700, color: TEXTM, letterSpacing: '0.06em' }}>SRT FORMAT · READY TO IMPORT</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <CopyBtn value={srtText} />
                <button onClick={downloadSRT} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: GOLD, ...T, fontSize: 11, fontWeight: 900, letterSpacing: '0.06em' }}>
                  <Download size={13} />DOWNLOAD .SRT
                </button>
              </div>
            </div>
            <pre style={{ ...MONO, fontSize: 10, color: TEXTD, lineHeight: 1.7, whiteSpace: 'pre-wrap', background: BG3, border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 10, padding: '14px 16px', overflowX: 'auto' }}>
              {srtText || '(no lines yet — start transcribing first)'}
            </pre>
          </div>
        )}

        {tab === 'translate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ ...T, fontSize: 13, fontWeight: 700, color: TEXTM, letterSpacing: '0.06em' }}>TRANSLATE TRANSCRIPT</span>
              <select value={translateTarget} onChange={e => { setTranslateTarget(e.target.value); setTranslationMap({}); }}
                style={{ ...MONO, fontSize: 11, padding: '5px 10px', borderRadius: 8, border: `1px solid rgba(212,175,55,0.3)`, background: BG3, color: TEXT, cursor: 'pointer', outline: 'none' }}>
                <option value="">— select target language —</option>
                {SUPPORTED_LANGS.filter(l => l.code !== activeLang).map(l => (
                  <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                ))}
              </select>
              {translateTarget && <span style={{ ...MONO, fontSize: 9, color: TEXTM }}>{Object.keys(translationMap).length}/{lines.length} translated</span>}
            </div>
            {translateTarget ? lines.map(l => (
              <div key={l.id} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ ...MONO, fontSize: 9, color: GOLD, minWidth: 55 }}>{l.time}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.45)', flex: 1 }}>{l.text}</span>
                </div>
                <div style={{ paddingLeft: 63, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: TEXT, lineHeight: 1.5 }}>
                  {translationMap[l.id] ? (
                    <span style={{ color: '#6DBF7E' }}>{(SUPPORTED_LANGS.find(x => x.code === translateTarget) && SUPPORTED_LANGS.find(x => x.code === translateTarget).flag)} {translationMap[l.id]}</span>
                  ) : (
                    <span style={{ color: TEXTM, ...MONO, fontSize: 9 }}>translating…</span>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ ...MONO, fontSize: 11, color: TEXTM, textAlign: 'center', padding: '40px 0' }}>Select a target language above to see translated lines</div>
            )}
          </div>
        )}

        {tab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...T, fontSize: 13, fontWeight: 700, color: TEXTM, letterSpacing: '0.06em', marginBottom: 4 }}>EXPORT TRANSCRIPT</div>
            <div style={{ ...MONO, fontSize: 10, color: TEXTM }}>{captionHistory.length} caption segments available</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {EXPORT_FORMATS.map(fmt => (
                <button key={fmt.key} onClick={() => handleExport(fmt)} disabled={captionHistory.length === 0}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 12px', borderRadius: 12, cursor: captionHistory.length ? 'pointer' : 'not-allowed', opacity: captionHistory.length ? 1 : 0.4,
                    background: 'rgba(212,175,55,0.06)', border: `1px solid rgba(212,175,55,0.2)`, transition: 'all .15s' }}>
                  <Download size={18} style={{ color: GOLD }} />
                  <span style={{ ...T, fontSize: 15, fontWeight: 900, color: GOLD, letterSpacing: '0.08em' }}>{fmt.label}</span>
                  <span style={{ ...MONO, fontSize: 9, color: TEXTM }}>transcript.{fmt.ext}</span>
                </button>
              ))}
            </div>
            <button onClick={clearHistory} disabled={captionHistory.length === 0}
              style={{ marginTop: 8, padding: '10px 0', borderRadius: 10, border: `1px solid rgba(192,57,43,0.25)`, background: 'rgba(192,57,43,0.06)', color: SCARL, cursor: 'pointer', ...T, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', opacity: captionHistory.length ? 1 : 0.4 }}>
              🗑 Clear Session
            </button>
          </div>
        )}
      </div>

        {/* Transcription panel for VOD recordings */}
        <TranscriptionPanel recordingUrl={null} roomTitle="Live Session" />

        {/* Deepgram Native Transcription */}
        <div style={{ background: 'rgba(0,188,212,0.04)', border: '1px solid rgba(0,188,212,0.15)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ ...T, fontSize: 14, fontWeight: 700, color: '#00bcd4', letterSpacing: '0.05em' }}>Deepgram Live Transcription</div>
              <div style={{ ...MONO, fontSize: 9, color: TEXTM, marginTop: 3 }}>Real-time AI speech-to-text · No browser plugin needed · Requires Deepgram API key</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {dgLive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN }} />
                  <span style={{ ...MONO, fontSize: 9, color: GREEN }}>LIVE</span>
                </div>
              )}
              {!dgLive ? (
                <button onClick={startDeepgram} style={{ ...T, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', background: 'rgba(0,188,212,0.12)', border: '1px solid rgba(0,188,212,0.35)', borderRadius: 8, padding: '7px 16px', color: '#00bcd4', cursor: 'pointer' }}>
                  🎙 Start Deepgram
                </button>
              ) : (
                <button onClick={stopDeepgram} style={{ ...T, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', background: 'rgba(128,0,32,0.12)', border: '1px solid rgba(128,0,32,0.3)', borderRadius: 8, padding: '7px 16px', color: '#ff6b6b', cursor: 'pointer' }}>
                  ⏹ Stop
                </button>
              )}
            </div>
          </div>
          {!getDgKey() && (
            <div style={{ ...MONO, fontSize: 10, color: 'rgba(255,150,100,0.7)', padding: '8px 10px', borderRadius: 8, background: 'rgba(128,0,32,0.08)', border: '1px solid rgba(128,0,32,0.15)' }}>
              No Deepgram key — go to <strong>VaultPro → AI Keys</strong> to add one.
            </div>
          )}
          {dgLines.length > 0 && (
            <div style={{ marginTop: 10, maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {dgLines.slice(-12).reverse().map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: TEXTD, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', lineHeight: 1.4 }}>
                  <span style={{ flex: 1 }}>{l.text}</span>
                  {l.confidence != null && (
                    <span style={{ ...MONO, fontSize: 9, color: l.confidence >= 90 ? GREEN : l.confidence >= 70 ? GOLD : SCARL, flexShrink: 0 }}>
                      {l.confidence}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Caption.Ninja link */}
        <div style={{ background: 'rgba(212,175,55,0.05)', border: `1px solid rgba(212,175,55,0.15)`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ ...T, fontSize: 14, fontWeight: 700, color: GOLD, letterSpacing: '0.05em' }}>Caption.Ninja Integration</div>
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
              color: GOLD, textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            OPEN CAPTION.NINJA ↗
          </a>
        </div>

      <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ShareToSocial content={{ title: 'Transcription Studio on SeeWhy LIVE', url: window.location.href }} />
        <AIStreamSummary roomId={activeRoomId} isHost={true} streamTitle="Transcription Session" viewerCount={0} elapsedSeconds={0} />
        <RecordingManager userId={(user && user.id)} />
        <LiveTranslationWidget roomId={activeRoomId} isHost={true} targetLanguage="en" />
        <LiveTranscription roomId={activeRoomId} isHost={true} />
        <OnlineUsersGrid compact maxVisible={8} />
        <StreamHealthDashboard roomId={activeRoomId} isHost={true} />
        <AutomatedHighlightReels streamSession={activeRoom || null} />
        <CollaborationMatcher />
      </div>
      <SwanyBotWidget />
      <NotificationBell />
      <AIStreamSummary roomId={activeRoomId} isHost={true} />
      <SwanAIRecommendations roomId={activeRoomId} currentLayout='transcription' viewerCount={0} />
      <AIHighlightGenerator roomId={activeRoomId} isHost={true} />
      <StreamHealthMonitor isStreaming={live} />
    </div>
  );
}