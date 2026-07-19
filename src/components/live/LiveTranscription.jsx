import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Captions, X, ChevronUp, ChevronDown } from 'lucide-react';

const G = '#d4af37';
const MAX_CAPTIONS = 5;
const CAPTION_MS = 8000;
const CHUNK_INTERVAL_S = 5;

// Attempt to start Web Speech API recognition.
// Returns a stop() function on success, or null if unavailable.
function startWebSpeech({ onInterim, onFinal, onError }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  let alive = true;
  let rec;
  try {
    rec = new SR();
  } catch {
    return null;
  }
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';
  rec.maxAlternatives = 1;

  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) {
        const text = r[0].transcript.trim();
        if (text) onFinal(text);
      } else {
        interim += r[0].transcript;
      }
    }
    onInterim(interim);
  };

  rec.onerror = (e) => {
    // 'no-speech' is benign; everything else triggers server fallback
    if (e.error !== 'no-speech') onError(e);
  };

  // Auto-restart if it ends unexpectedly (browser stops after ~60s of silence)
  rec.onend = () => { if (alive) { try { rec.start(); } catch {} } };

  try {
    rec.start();
  } catch {
    return null;
  }

  return () => {
    alive = false;
    try { rec.abort(); } catch {}
  };
}

/**
 * LiveTranscription
 *
 * Props:
 *   isLive   boolean            - whether transcription should be active
 *   roomId   string
 *   stream   MediaStream|null   - pass localStream to reuse existing mic; falls back to getUserMedia
 *   speaker  string|null        - optional display name shown on each caption
 */
export default function LiveTranscription({
  isLive = false,
  roomId,
  stream: propStream = null,
  speaker = null,
}) {
  const [captions, setCaptions] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [usingWebSpeech, setUsingWebSpeech] = useState(false);

  const ownedStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksBufferRef = useRef([]);
  const intervalRef = useRef(null);

  const addCaption = useCallback((text) => {
    if (!text) return;
    const id = Date.now() + Math.random();
    setCaptions(prev => [...prev, { id, text, ts: Date.now() }].slice(-MAX_CAPTIONS));
    setTimeout(() => setCaptions(prev => prev.filter(c => c.id !== id)), CAPTION_MS);
  }, []);

  useEffect(() => {
    if (!isLive || !showCaptions) {
      setIsTranscribing(false);
      setInterimText('');
      return;
    }

    let cancelled = false;

    // --- Primary path: Web Speech API (Chrome/Edge — zero-latency) ---
    const stopWS = startWebSpeech({
      onInterim: setInterimText,
      onFinal: (text) => { if (!cancelled) addCaption(text); },
      onError: () => {
        // Web Speech errored — fall through to server transcription
        if (!cancelled) {
          stopWS?.();
          setUsingWebSpeech(false);
          launchServerTranscription();
        }
      },
    });

    if (stopWS) {
      setUsingWebSpeech(true);
      setIsTranscribing(true);
      return () => {
        cancelled = true;
        stopWS();
        setIsTranscribing(false);
        setInterimText('');
      };
    }

    // --- Fallback path: server-based transcription (Firefox / unsupported browsers) ---
    // Uses continuous 1s timeslices; no MediaRecorder stop/start — the recorder keeps running
    // and we snapshot the accumulated chunks every CHUNK_INTERVAL_S seconds.
    async function launchServerTranscription() {
      try {
        let stream = propStream;
        if (!stream) {
          const prefMic = (() => {
            try { return localStorage.getItem('swl_pref_mic') || null; } catch { return null; }
          })();
          stream = await navigator.mediaDevices.getUserMedia({
            audio: prefMic
              ? { echoCancellation: true, noiseSuppression: true, deviceId: { ideal: prefMic } }
              : { echoCancellation: true, noiseSuppression: true },
          });
          if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
          ownedStreamRef.current = stream;
        }

        const audioOnly = new MediaStream(stream.getAudioTracks());
        const mr = new MediaRecorder(audioOnly);
        mediaRecorderRef.current = mr;
        chunksBufferRef.current = [];

        mr.ondataavailable = (e) => {
          if (e.data?.size > 0) chunksBufferRef.current.push(e.data);
        };

        // Start with 1s timeslices — ondataavailable fires every second, no stop/start
        mr.start(1000);
        setIsTranscribing(true);

        // Every CHUNK_INTERVAL_S, snapshot the accumulated chunks and send them
        intervalRef.current = setInterval(async () => {
          if (cancelled) return;
          const snapshot = chunksBufferRef.current.splice(0); // drain buffer
          if (!snapshot.length) return;
          const blob = new Blob(snapshot, { type: 'audio/webm' });
          try {
            const up = await base44.integrations.Core.UploadFile({ file: blob });
            const res = await base44.functions.invoke('transcribeAudio', { audio_url: up.file_url });
            if (res?.data?.text && !cancelled) addCaption(res.data.text);
          } catch {}
        }, CHUNK_INTERVAL_S * 1000);
      } catch {
        if (!cancelled) setIsTranscribing(false);
      }
    }

    launchServerTranscription();

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (mediaRecorderRef.current?.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      mediaRecorderRef.current = null;
      ownedStreamRef.current?.getTracks().forEach(t => t.stop());
      ownedStreamRef.current = null;
      setIsTranscribing(false);
      setInterimText('');
    };
  }, [isLive, showCaptions, propStream, addCaption]);

  const lastCaption = captions[captions.length - 1];
  const historyItems = captions.slice(0, -1);

  return (
    <div className="fixed bottom-20 left-4 right-4 md:right-4 md:left-auto md:w-96 z-40 pointer-events-none">
      {/* Toggle + history button row */}
      <div className="pointer-events-auto mb-2 flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCaptions(s => !s)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
          style={{
            background: showCaptions ? `${G}18` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${showCaptions ? `${G}50` : 'rgba(255,255,255,0.08)'}`,
            color: showCaptions ? G : 'rgba(255,255,255,0.4)',
          }}
        >
          <Captions className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {usingWebSpeech ? 'Live CC' : 'Captions'}
          </span>
          {isTranscribing && (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: usingWebSpeech ? '#22c55e' : G }}
            />
          )}
        </motion.button>

        {historyItems.length > 0 && showCaptions && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowHistory(s => !s)}
            className="pointer-events-auto flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] text-white/40 hover:text-white/70 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {showHistory ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            {historyItems.length} earlier
          </motion.button>
        )}
      </div>

      {/* Caption stack */}
      <AnimatePresence mode="popLayout">
        {/* History items (dimmed) */}
        {showCaptions && showHistory && historyItems.map((c) => (
          <motion.div
            key={`hist-${c.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 0.45, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto mb-1 px-3 py-2 rounded-lg text-xs text-white/60"
            style={{ background: 'rgba(7,7,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {speaker && (
              <span className="text-[10px] font-semibold mr-1.5" style={{ color: `${G}99` }}>
                {speaker}
              </span>
            )}
            {c.text}
          </motion.div>
        ))}

        {/* Most recent final caption */}
        {showCaptions && lastCaption && (
          <motion.div
            key={lastCaption.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto mb-1.5 p-3 rounded-lg backdrop-blur-md"
            style={{ background: 'rgba(7,7,15,0.9)', border: `1px solid ${G}35` }}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                {speaker && (
                  <div className="text-[10px] font-semibold mb-0.5 uppercase tracking-wide" style={{ color: G }}>
                    {speaker}
                  </div>
                )}
                <p className="text-sm text-white/90 leading-relaxed">{lastCaption.text}</p>
              </div>
              <button
                onClick={() => setCaptions(prev => prev.filter(c => c.id !== lastCaption.id))}
                className="flex-shrink-0 text-white/25 hover:text-white/60 transition-colors mt-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {/* Auto-dismiss progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: (CAPTION_MS - 500) / 1000, ease: 'linear' }}
              className="mt-2 h-px origin-left rounded-full"
              style={{ background: `${G}55` }}
            />
          </motion.div>
        )}

        {/* Interim text (Web Speech in-progress utterance) */}
        {showCaptions && interimText && (
          <motion.div
            key="interim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none mb-1.5 px-3 py-2.5 rounded-lg backdrop-blur-sm"
            style={{ background: 'rgba(7,7,15,0.72)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {speaker && (
              <span className="text-[10px] font-semibold mr-1.5" style={{ color: `${G}70` }}>
                {speaker}
              </span>
            )}
            <span className="text-sm text-white/45 italic">{interimText}</span>
            {/* Blinking cursor */}
            <span
              className="ml-0.5 inline-block w-0.5 h-3.5 rounded-sm align-middle animate-pulse"
              style={{ background: `${G}70` }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
