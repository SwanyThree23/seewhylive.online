import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Video, Wifi, X, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

// ─── Brand tokens ──────────────────────────────────────────────────────────────
const BG      = '#080B18';
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';

// ─── Animated mic waveform ─────────────────────────────────────────────────────
function WaveformBars() {
  const heights = [40, 70, 55, 80, 45];
  return (
    <div className="flex items-center gap-[3px] h-10">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full"
          style={{ backgroundColor: '#22c55e', height: `${h}%` }}
          animate={{ scaleY: [1, 1.6, 0.6, 1.4, 1] }}
          transition={{
            repeat: Infinity,
            duration: 0.9,
            delay: i * 0.12,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Simulated camera tile ─────────────────────────────────────────────────────
function CameraPreview({ initials = 'YO' }) {
  return (
    <div
      className="flex items-center justify-center w-16 h-16 text-lg font-black tracking-wider"
      style={{
        background: `linear-gradient(135deg, ${CRIMSON}, ${PINK})`,
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
        color: '#fff',
        fontFamily: "'Barlow Condensed', sans-serif",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Step icon wrapper ─────────────────────────────────────────────────────────
function StepIconCircle({ icon: Icon, active }) {
  return (
    <div
      className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
      style={{
        background: active
          ? `linear-gradient(135deg, ${GOLD}, #b8962e)`
          : 'rgba(255,255,255,0.08)',
      }}
    >
      <Icon size={18} color={active ? BG : 'rgba(255,255,255,0.4)'} strokeWidth={2.2} />
    </div>
  );
}

// ─── Progress dots ─────────────────────────────────────────────────────────────
function ProgressDots({ step, total }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          animate={{
            width:           i === step ? 20 : 8,
            backgroundColor: i <= step  ? GOLD : 'rgba(255,255,255,0.2)',
          }}
          transition={{ duration: 0.3 }}
          style={{ height: 8 }}
        />
      ))}
    </div>
  );
}

// ─── Pinging dots for network check ───────────────────────────────────────────
function PingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="text-white/70 text-xl leading-none"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }}
        >
          •
        </motion.span>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function GreenRoomModal({
  isOpen,
  onClose,
  onReady,
  localStream,
  audioEnabled = true,
  videoEnabled = true,
}) {
  const [step, setStep]       = useState(0);   // 0=mic 1=cam 2=network 3=done
  const [results, setResults] = useState({ mic: null, cam: null, net: null });
  const timerRefs             = useRef([]);

  // clear all pending timers
  const clearTimers = () => {
    timerRefs.current.forEach(id => clearTimeout(id));
    timerRefs.current = [];
  };

  const schedule = (fn, delay) => {
    const id = setTimeout(fn, delay);
    timerRefs.current.push(id);
    return id;
  };

  // ── run a specific step ──────────────────────────────────────────────────────
  const runStep = (s) => {
    setStep(s);

    if (s === 0) {
      // Mic check
      setResults(r => ({ ...r, mic: null }));
      schedule(() => {
        const pass = audioEnabled;
        setResults(r => ({ ...r, mic: pass }));
        if (pass) schedule(() => runStep(1), 1500);
      }, 800);
    }

    if (s === 1) {
      // Camera check
      setResults(r => ({ ...r, cam: null }));
      schedule(() => {
        const pass = videoEnabled;
        setResults(r => ({ ...r, cam: pass }));
        if (pass) schedule(() => runStep(2), 1500);
      }, 800);
    }

    if (s === 2) {
      // Network check — always passes after 2 s
      setResults(r => ({ ...r, net: null }));
      schedule(() => {
        setResults(r => ({ ...r, net: true }));
        schedule(() => setStep(3), 800);
      }, 2000);
    }
  };

  // ── kick off when modal opens ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    clearTimers();
    setStep(0);
    setResults({ mic: null, cam: null, net: null });
    runStep(0);
    return clearTimers;
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── step metadata ────────────────────────────────────────────────────────────
  const steps = [
    {
      key:     'mic',
      label:   'Mic Check',
      icon:    Mic,
      pass:    'Mic detected ✓',
      fail:    'No mic — check browser permissions',
      result:  results.mic,
      preview: results.mic !== false && (
        audioEnabled
          ? <WaveformBars />
          : <span className="text-white/30 text-sm">No audio input</span>
      ),
    },
    {
      key:    'cam',
      label:  'Camera Check',
      icon:   Video,
      pass:   'Camera ready ✓',
      fail:   'Camera blocked',
      result: results.cam,
      preview: <CameraPreview initials="YO" />,
    },
    {
      key:    'net',
      label:  'Network Check',
      icon:   Wifi,
      pass:   'Connection: Excellent 🟢',
      fail:   'Connection issues detected',
      result: results.net,
      preview: results.net === null
        ? <PingDots />
        : null,
    },
  ];

  const currentStepData = steps[Math.min(step, 2)];
  const allDone         = step === 3;

  // ── summary rows ─────────────────────────────────────────────────────────────
  const summaryItems = [
    { label: 'Mic',     result: results.mic },
    { label: 'Camera',  result: results.cam },
    { label: 'Network', result: results.net },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[89] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom sheet panel */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[90] rounded-t-3xl overflow-hidden flex flex-col"
            style={{
              background: BG,
              maxHeight: '90vh',
              borderTop: `1px solid rgba(212,175,55,0.18)`,
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full bg-white/15" />
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">

              {/* Title row */}
              <div className="flex items-center justify-between mb-4 mt-1">
                <h2
                  className="text-xl font-black tracking-wide"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: GOLD,
                  }}
                >
                  🎙 Green Room
                </h2>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-full transition"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <X size={16} color="rgba(255,255,255,0.6)" />
                </button>
              </div>

              {/* Progress dots */}
              <div className="mb-5">
                <ProgressDots step={allDone ? 3 : step} total={3} />
              </div>

              {/* Active step card */}
              <AnimatePresence mode="wait">
                {!allDone && (
                  <motion.div
                    key={`step-${step}`}
                    className="rounded-2xl p-4 mb-5"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.12)' }}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ duration: 0.28 }}
                  >
                    {/* Icon + step name */}
                    <div className="flex items-center gap-3 mb-4">
                      <StepIconCircle icon={currentStepData.icon} active />
                      <span
                        className="text-lg font-bold tracking-wide text-white"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {currentStepData.label}
                      </span>
                    </div>

                    {/* Preview area */}
                    <div
                      className="flex items-center justify-center rounded-xl mb-4"
                      style={{ background: 'rgba(0,0,0,0.3)', minHeight: 80 }}
                    >
                      <AnimatePresence mode="wait">
                        {currentStepData.preview ? (
                          <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.25 }}
                          >
                            {currentStepData.preview}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>

                    {/* Status text */}
                    <AnimatePresence mode="wait">
                      {currentStepData.result === null ? (
                        <motion.p
                          key="checking"
                          className="text-sm text-white/40 text-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Checking…
                        </motion.p>
                      ) : currentStepData.result === true ? (
                        <motion.div
                          key="pass"
                          className="flex items-center justify-center gap-2"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <CheckCircle size={16} color="#22c55e" />
                          <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                            {currentStepData.pass}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="fail"
                          className="flex flex-col items-center gap-2"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="flex items-center gap-2">
                            <XCircle size={16} color={PINK} />
                            <span className="text-sm font-semibold" style={{ color: PINK }}>
                              {currentStepData.fail}
                            </span>
                          </div>
                          <button
                            onClick={() => runStep(step)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition active:scale-95"
                            style={{ background: `${CRIMSON}33`, border: `1px solid ${CRIMSON}66`, color: '#fff' }}
                          >
                            <RefreshCw size={13} />
                            Retry
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* All-checks summary list */}
              <div
                className="rounded-xl px-4 py-3 mb-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Pre-flight checklist
                </p>
                {summaryItems.map(({ label, result }) => (
                  <div key={label} className="flex items-center justify-between py-1">
                    <span className="text-sm text-white/60">{label}</span>
                    {result === null ? (
                      <span className="text-white/25 text-sm">—</span>
                    ) : result === true ? (
                      <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>✓</span>
                    ) : (
                      <span className="text-sm font-semibold" style={{ color: PINK }}>✗</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Go live button */}
              <AnimatePresence>
                {allDone && (
                  <motion.button
                    className="w-full py-4 rounded-2xl text-base font-black tracking-widest uppercase transition active:scale-[0.97]"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      background: `linear-gradient(135deg, ${GOLD}, #b8962e, ${GOLD})`,
                      backgroundSize: '200% 200%',
                      color: BG,
                      boxShadow: `0 0 24px ${GOLD}55`,
                    }}
                    initial={{ opacity: 0, scale: 0.9, y: 12 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      opacity: { duration: 0.35 },
                      scale:   { duration: 0.35 },
                      y:       { duration: 0.35 },
                      backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
                    }}
                    onClick={onReady}
                  >
                    🔴 You're Ready to Go Live!
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
