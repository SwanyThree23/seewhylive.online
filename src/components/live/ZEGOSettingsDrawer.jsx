import { useState } from "react";

var C = {
  bg: "#0D0D0D", card: "#1A1A1A", surface: "#161616",
  burgundy: "#800020", gold: "#D4AF37", volt: "#C8FF00",
  white: "#FFF", gray: "#888", dim: "#444", green: "#30D158",
  fOrb: "'Orbitron',sans-serif", fRaj: "'Rajdhani',sans-serif",
  fMon: "'Share Tech Mono',monospace",
};

var RTMP_BASE = "rtmp://ingest.seewhy.live/live";

export default function ZEGOSettingsDrawer({ roomId, streamKey, onClose }) {
  var [noiseCancel, setNoiseCancel] = useState(true);
  var [echoCancel, setEchoCancel] = useState(true);
  var [gain, setGain] = useState(100);
  var [blur, setBlur] = useState(false);
  var [brightness, setBrightness] = useState(50);
  var [bitrate, setBitrate] = useState(3000);
  var [resolution, setResolution] = useState("1080p");
  var [fps, setFps] = useState(30);
  var [latencyMode, setLatencyMode] = useState("Low");
  var [maxGuests, setMaxGuests] = useState(10);
  var [requireGreenroom, setRequireGreenroom] = useState(true);
  var [section, setSection] = useState("camera");
  var [copied, setCopied] = useState("");

  var ingestUrl = RTMP_BASE + "/" + (streamKey || roomId || "your-stream-key");
  var panelUrl = window.location.origin + "/SeeWhyLIVEv17?roomID=" + roomId + "&role=panelist";
  var audienceUrl = window.location.origin + "/SeeWhyLIVEv17?roomID=" + roomId + "&role=audience";

  function copy(text, label) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    });
  }

  var Toggle = ({ on, onToggle, label }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontFamily: C.fRaj, fontSize: 13, color: C.white }}>{label}</span>
      <button onClick={onToggle} style={{
        width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: on ? C.gold : "#333", position: "relative", transition: "background .2s",
      }}>
        <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: C.white, transition: "left .2s" }} />
      </button>
    </div>
  );

  var sections = ["camera", "audio", "encoding", "network", "room", "links"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9800, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: C.card, borderRadius: "16px 16px 0 0",
        border: "1px solid " + C.burgundy, maxHeight: "85vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #2a2a2a" }}>
          <span style={{ fontFamily: C.fOrb, fontSize: 11, color: C.gold, letterSpacing: 2 }}>⚙️ STREAM SETTINGS</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.gray, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        {/* Section tabs */}
        <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #2a2a2a" }}>
          {sections.map(s => (
            <button key={s} onClick={() => setSection(s)} style={{
              padding: "8px 14px", background: "none", border: "none",
              borderBottom: "2px solid " + (section === s ? C.gold : "transparent"),
              cursor: "pointer", fontFamily: C.fMon, fontSize: 9, letterSpacing: 1,
              color: section === s ? C.gold : C.gray, whiteSpace: "nowrap",
            }}>{s.toUpperCase()}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {section === "camera" && (
            <div>
              <Toggle on={blur} onToggle={() => setBlur(b => !b)} label="Virtual Background Blur" />
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontFamily: C.fMon, fontSize: 9, color: C.dim, letterSpacing: 1 }}>BRIGHTNESS {brightness}%</span>
                <input type="range" min={0} max={100} value={brightness} onChange={e => setBrightness(+e.target.value)} style={{ width: "100%", accentColor: C.gold, marginTop: 8 }} />
              </div>
            </div>
          )}
          {section === "audio" && (
            <div>
              <Toggle on={noiseCancel} onToggle={() => setNoiseCancel(n => !n)} label="Noise Cancellation" />
              <Toggle on={echoCancel} onToggle={() => setEchoCancel(e => !e)} label="Echo Cancellation" />
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontFamily: C.fMon, fontSize: 9, color: C.dim, letterSpacing: 1 }}>MIC GAIN {gain}%</span>
                <input type="range" min={0} max={200} value={gain} onChange={e => setGain(+e.target.value)} style={{ width: "100%", accentColor: C.gold, marginTop: 8 }} />
              </div>
            </div>
          )}
          {section === "encoding" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: C.fMon, fontSize: 9, color: C.dim, letterSpacing: 1, marginBottom: 8 }}>BITRATE</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[1000, 2000, 3000, 4500, 8000].map(b => (
                    <button key={b} onClick={() => setBitrate(b)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid " + (bitrate === b ? C.gold : "#333"), background: bitrate === b ? "rgba(212,175,55,0.1)" : C.surface, cursor: "pointer", fontFamily: C.fMon, fontSize: 9, color: bitrate === b ? C.gold : C.gray }}>{b}k</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: C.fMon, fontSize: 9, color: C.dim, letterSpacing: 1, marginBottom: 8 }}>RESOLUTION</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["720p", "1080p"].map(r => (
                    <button key={r} onClick={() => setResolution(r)} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid " + (resolution === r ? C.gold : "#333"), background: resolution === r ? "rgba(212,175,55,0.1)" : C.surface, cursor: "pointer", fontFamily: C.fMon, fontSize: 10, color: resolution === r ? C.gold : C.gray }}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: C.fMon, fontSize: 9, color: C.dim, letterSpacing: 1, marginBottom: 8 }}>FPS</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[24, 30, 60].map(f => (
                    <button key={f} onClick={() => setFps(f)} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid " + (fps === f ? C.volt : "#333"), background: fps === f ? "rgba(200,255,0,0.08)" : C.surface, cursor: "pointer", fontFamily: C.fMon, fontSize: 10, color: fps === f ? C.volt : C.gray }}>{f}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {section === "network" && (
            <div>
              <div style={{ fontFamily: C.fMon, fontSize: 9, color: C.dim, letterSpacing: 1, marginBottom: 8 }}>LATENCY MODE</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {["Ultra-Low", "Low", "Standard"].map(m => (
                  <button key={m} onClick={() => setLatencyMode(m)} style={{ flex: 1, padding: "8px 4px", borderRadius: 6, border: "1px solid " + (latencyMode === m ? C.volt : "#333"), background: latencyMode === m ? "rgba(200,255,0,0.08)" : C.surface, cursor: "pointer", fontFamily: C.fMon, fontSize: 8, color: latencyMode === m ? C.volt : C.gray }}>{m}</button>
                ))}
              </div>
            </div>
          )}
          {section === "room" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontFamily: C.fMon, fontSize: 9, color: C.dim, letterSpacing: 1 }}>MAX GUESTS: {maxGuests}</span>
                <input type="range" min={1} max={20} value={maxGuests} onChange={e => setMaxGuests(+e.target.value)} style={{ width: "100%", accentColor: C.gold, marginTop: 8 }} />
              </div>
              <Toggle on={requireGreenroom} onToggle={() => setRequireGreenroom(g => !g)} label="Require Greenroom Approval" />
            </div>
          )}
          {section === "links" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "RTMP INGEST URL", value: ingestUrl },
                { label: "INVITE PANELIST", value: panelUrl },
                { label: "AUDIENCE LINK", value: audienceUrl },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontFamily: C.fMon, fontSize: 9, color: C.dim, letterSpacing: 1, marginBottom: 6 }}>{label}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ flex: 1, background: "#111", border: "1px solid #333", borderRadius: 6, padding: "8px 10px", fontFamily: C.fMon, fontSize: 9, color: C.gray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
                    <button onClick={() => copy(value, label)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid " + (copied === label ? C.green : C.gold), background: copied === label ? "rgba(48,209,88,0.15)" : "rgba(212,175,55,0.1)", cursor: "pointer", fontFamily: C.fMon, fontSize: 9, color: copied === label ? C.green : C.gold }}>
                      {copied === label ? "✓" : "COPY"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stream health HUD bar
export function StreamHealthHUD({ sessionId, onClick }) {
  var dests = [
    { name: "SeeWhy", status: "healthy" },
    { name: "YouTube", status: "healthy" },
    { name: "TikTok", status: "degraded" },
  ];
  var statusColor = { healthy: "#30D158", degraded: "#FF9500", error: "#FF3B30" };

  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
      background: "rgba(13,13,13,0.95)", borderBottom: "1px solid #2a2a2a", cursor: "pointer",
    }}>
      <span style={{ fontFamily: C.fMon, fontSize: 8, color: C.dim, letterSpacing: 1 }}>HEALTH</span>
      {dests.map(d => (
        <span key={d.name} style={{
          padding: "2px 7px", borderRadius: 10, fontFamily: C.fMon, fontSize: 8,
          background: statusColor[d.status] + "22", border: "1px solid " + statusColor[d.status] + "66",
          color: statusColor[d.status],
        }}>{d.name}</span>
      ))}
    </div>
  );
}