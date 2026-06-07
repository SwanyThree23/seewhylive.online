import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Mic, Volume2 } from "lucide-react";

const DEFAULTS = {
  codec: "H264",
  resolution: "1080p",
  fps: 30,
  bitrate: 4500,
  noiseSuppression: true,
  echoCancellation: true,
  videoBitratePriority: false,
};

const CODECS = [
  { id: "H264", label: "H.264", desc: "Best compatibility, hardware-accelerated" },
  { id: "VP8",  label: "VP8",   desc: "Open standard, good quality" },
  { id: "VP9",  label: "VP9",   desc: "Better compression, slightly more CPU" },
  { id: "AV1",  label: "AV1",   desc: "Best quality, highest CPU use" },
];

const RESOLUTIONS = ["720p", "1080p", "1440p", "4K"];
const FRAMERATES  = [24, 30, 60];

function Pill({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: selected ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.12)",
        background: selected ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.05)",
        color: selected ? "#D4AF37" : "rgba(255,255,255,0.5)",
      }}
      className="rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150 focus:outline-none"
    >
      {children}
    </button>
  );
}

function CodecPill({ codec, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: selected ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.12)",
        background: selected ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.05)",
        color: selected ? "#D4AF37" : "rgba(255,255,255,0.5)",
      }}
      className="rounded-xl px-3 py-3 text-left transition-all duration-150 focus:outline-none"
    >
      <div className="text-sm font-bold leading-tight">{codec.label}</div>
      <div
        className="text-xs mt-0.5 leading-snug"
        style={{ color: selected ? "rgba(212,175,55,0.75)" : "rgba(255,255,255,0.3)" }}
      >
        {codec.desc}
      </div>
    </button>
  );
}

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        background: enabled ? "#D4AF37" : "rgba(255,255,255,0.1)",
        transition: "background 0.2s",
      }}
      className="relative w-10 h-5 rounded-full flex-shrink-0 focus:outline-none"
      aria-checked={enabled}
      role="switch"
    >
      <span
        style={{
          transform: enabled ? "translateX(20px)" : "translateX(2px)",
          transition: "transform 0.2s",
          background: enabled ? "#080B18" : "rgba(255,255,255,0.7)",
        }}
        className="absolute top-0.5 w-4 h-4 rounded-full shadow"
      />
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <p
      style={{ color: "#D4AF37", letterSpacing: "0.1em" }}
      className="text-[10px] uppercase font-semibold mb-2"
    >
      {children}
    </p>
  );
}

export default function WebRTCConfigModal({ isOpen, onClose, onApply, currentConfig }) {
  const [cfg, setCfg] = useState(currentConfig || DEFAULTS);

  function set(key, value) {
    setCfg((c) => ({ ...c, [key]: value }));
  }

  function handleApply() {
    onApply({
      codec:             cfg.codec,
      resolution:        cfg.resolution,
      fps:               cfg.fps,
      bitrate:           cfg.bitrate,
      noiseSuppression:  cfg.noiseSuppression,
      echoCancellation:  cfg.echoCancellation,
    });
    onClose();
  }

  return (
    <>
      {/* Slider accent styles */}
      <style>{`
        .webrtc-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .webrtc-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #D4AF37;
          border: 2px solid #080B18;
          box-shadow: 0 0 0 2px rgba(212,175,55,0.3);
          cursor: pointer;
        }
        .webrtc-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #D4AF37;
          border: 2px solid #080B18;
          box-shadow: 0 0 0 2px rgba(212,175,55,0.3);
          cursor: pointer;
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[89]"
              style={{ background: "rgba(8,11,24,0.75)" }}
              onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[90] rounded-t-3xl overflow-hidden flex flex-col"
              style={{
                background: "#0E1120",
                maxHeight: "85vh",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                />
              </div>

              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <h2
                  className="text-lg font-bold tracking-wide"
                  style={{ color: "#fff" }}
                >
                  ⚙️ Stream Config
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full transition-colors focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <X size={18} color="rgba(255,255,255,0.7)" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">

                {/* 1. Video Codec */}
                <section>
                  <SectionLabel>Video Codec</SectionLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {CODECS.map((codec) => (
                      <CodecPill
                        key={codec.id}
                        codec={codec}
                        selected={cfg.codec === codec.id}
                        onClick={() => set("codec", codec.id)}
                      />
                    ))}
                  </div>
                </section>

                {/* 2. Resolution */}
                <section>
                  <SectionLabel>Resolution</SectionLabel>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {RESOLUTIONS.map((r) => (
                      <Pill
                        key={r}
                        selected={cfg.resolution === r}
                        onClick={() => set("resolution", r)}
                      >
                        {r}
                      </Pill>
                    ))}
                  </div>
                </section>

                {/* 3. Frame Rate */}
                <section>
                  <SectionLabel>Frame Rate</SectionLabel>
                  <div className="flex gap-2">
                    {FRAMERATES.map((f) => (
                      <Pill
                        key={f}
                        selected={cfg.fps === f}
                        onClick={() => set("fps", f)}
                      >
                        {f}fps
                      </Pill>
                    ))}
                  </div>
                </section>

                {/* 4. Target Bitrate */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <SectionLabel>Target Bitrate</SectionLabel>
                    <span
                      className="text-sm font-bold"
                      style={{ color: "#D4AF37" }}
                    >
                      {cfg.bitrate.toLocaleString()} kbps
                    </span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={12000}
                    step={250}
                    value={cfg.bitrate}
                    onChange={(e) => set("bitrate", Number(e.target.value))}
                    className="webrtc-slider"
                    style={{
                      background: `linear-gradient(to right, #D4AF37 ${((cfg.bitrate - 500) / (12000 - 500)) * 100}%, rgba(255,255,255,0.12) ${((cfg.bitrate - 500) / (12000 - 500)) * 100}%)`,
                    }}
                  />
                  <div
                    className="flex justify-between text-xs mt-1"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    <span>500</span>
                    <span>12,000</span>
                  </div>
                </section>

                {/* 5. Audio Enhancements */}
                <section>
                  <SectionLabel>Audio Enhancements</SectionLabel>
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    {/* Noise Suppression */}
                    <div
                      className="flex items-center justify-between px-4 py-3.5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex items-center gap-3">
                        <Mic size={18} color="#D4AF37" />
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "rgba(255,255,255,0.85)" }}
                        >
                          Noise Suppression
                        </span>
                      </div>
                      <Toggle
                        enabled={cfg.noiseSuppression}
                        onToggle={() => set("noiseSuppression", !cfg.noiseSuppression)}
                      />
                    </div>

                    {/* Echo Cancellation */}
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Volume2 size={18} color="#D4AF37" />
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "rgba(255,255,255,0.85)" }}
                        >
                          Echo Cancellation
                        </span>
                      </div>
                      <Toggle
                        enabled={cfg.echoCancellation}
                        onToggle={() => set("echoCancellation", !cfg.echoCancellation)}
                      />
                    </div>
                  </div>
                </section>

                {/* Bottom padding so Apply button doesn't overlap last section */}
                <div className="h-2" />
              </div>

              {/* Apply button — sticky at bottom */}
              <div
                className="px-5 py-4 flex-shrink-0"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <button
                  onClick={handleApply}
                  className="w-full py-3.5 rounded-2xl text-base font-bold tracking-wide transition-opacity active:opacity-80 focus:outline-none"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37 0%, #b8942e 100%)",
                    color: "#080B18",
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}
                >
                  Apply Settings
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
