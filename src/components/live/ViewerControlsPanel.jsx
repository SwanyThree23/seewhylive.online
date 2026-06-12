import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

var C = {
  bg: "#0D0D0D", card: "#1A1A1A", surface: "#161616",
  burgundy: "#800020", gold: "#D4AF37", volt: "#D4AF37",
  white: "#FFF", gray: "#888", dim: "#444", green: "#6DBF7E",
  fOrb: "'Orbitron',sans-serif", fRaj: "'Rajdhani',sans-serif",
  fMon: "'Share Tech Mono',monospace",
};

export default function ViewerControlsPanel({ roomId, currentUser, onClose }) {
  var [quality, setQuality] = useState("720p");
  var [volume, setVolume] = useState(80);
  var [muted, setMuted] = useState(false);
  var [layout, setLayout] = useState("grid");
  var [handRaised, setHandRaised] = useState(false);
  var [ccOn, setCcOn] = useState(false);
  var [showReport, setShowReport] = useState(false);
  var [reportReason, setReportReason] = useState("spam");
  var qc = useQueryClient();

  var raiseMutation = useMutation({
    mutationFn: () => base44.entities.GreenroomWaitlist.create({
      room_id: roomId, user_id: currentUser?.id,
      user_name: currentUser?.full_name || "Viewer",
      role_requested: "speaker", status: "waiting",
    }),
    onSuccess: () => { setHandRaised(true); qc.invalidateQueries(["greenroom-waitlist"]); },
  });

  var reportMutation = useMutation({
    mutationFn: () => base44.entities.Report.create({
      room_id: roomId, reporter_id: currentUser?.id,
      reporter_name: currentUser?.full_name || "Viewer",
      reason: reportReason, status: "pending",
    }),
    onSuccess: () => { setShowReport(false); },
  });

  function togglePiP() {
    var vid = document.querySelector("video");
    if (vid && document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else {
        vid.requestPictureInPicture();
      }
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9500, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: C.card, borderRadius: "16px 16px 0 0",
        border: "1px solid " + C.burgundy, padding: "0 0 24px",
        animation: "slideUp .3s ease-out",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#333" }} />
        </div>
        <div style={{ padding: "0 16px", borderBottom: "1px solid #2a2a2a", paddingBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: C.fOrb, fontSize: 11, color: C.gold, letterSpacing: 2 }}>⚙️ VIEWER CONTROLS</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.gray, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Quality */}
          <div>
            <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim, letterSpacing: 1, marginBottom: 8 }}>VIDEO QUALITY</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["360p", "480p", "720p", "1080p"].map(q => (
                <button key={q} onClick={() => setQuality(q)} style={{
                  flex: 1, padding: "6px 0", borderRadius: 6,
                  border: "1px solid " + (quality === q ? C.gold : "#333"),
                  background: quality === q ? "rgba(212,175,55,0.15)" : C.surface,
                  cursor: "pointer", fontFamily: C.fMon, fontSize: 10,
                  color: quality === q ? C.gold : C.gray,
                }}>{q}</button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim, letterSpacing: 1 }}>VOLUME</span>
              <button onClick={() => setMuted(m => !m)} style={{ background: "none", border: "none", color: muted ? C.burgundy : C.green, cursor: "pointer", fontSize: 14 }}>{muted ? "🔇" : "🔊"}</button>
            </div>
            <input type="range" min={0} max={100} value={muted ? 0 : volume}
              onChange={e => { setVolume(+e.target.value); setMuted(false); }}
              style={{ width: "100%", accentColor: C.gold }} />
          </div>

          {/* Layout */}
          <div>
            <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim, letterSpacing: 1, marginBottom: 8 }}>LAYOUT</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[{ id: "grid", label: "▦ Grid" }, { id: "spotlight", label: "◉ Spotlight" }, { id: "theater", label: "▬ Theater" }].map(l => (
                <button key={l.id} onClick={() => setLayout(l.id)} style={{
                  flex: 1, padding: "6px 4px", borderRadius: 6,
                  border: "1px solid " + (layout === l.id ? C.volt : "#333"),
                  background: layout === l.id ? "rgba(212,175,55,0.08)" : C.surface,
                  cursor: "pointer", fontFamily: C.fMon, fontSize: 11,
                  color: layout === l.id ? C.volt : C.gray,
                }}>{l.label}</button>
              ))}
            </div>
          </div>

          {/* Actions row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {/* Raise Hand */}
            <button onClick={() => !handRaised && raiseMutation.mutate()} style={{
              padding: "10px", borderRadius: 8,
              border: "1px solid " + (handRaised ? C.volt : "#333"),
              background: handRaised ? "rgba(212,175,55,0.1)" : C.surface,
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 20 }}>{handRaised ? "✋" : "🙋"}</span>
              <span style={{ fontFamily: C.fMon, fontSize: 11, color: handRaised ? C.volt : C.gray }}>
                {handRaised ? "HAND RAISED" : "RAISE HAND"}
              </span>
            </button>

            {/* PiP */}
            <button onClick={togglePiP} style={{
              padding: "10px", borderRadius: 8, border: "1px solid #333", background: C.surface,
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 20 }}>📺</span>
              <span style={{ fontFamily: C.fMon, fontSize: 11, color: C.gray }}>PIP MODE</span>
            </button>

            {/* CC */}
            <button onClick={() => setCcOn(c => !c)} style={{
              padding: "10px", borderRadius: 8,
              border: "1px solid " + (ccOn ? C.cyan : "#333"),
              background: ccOn ? "rgba(109,191,126,0.08)" : C.surface,
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 20 }}>CC</span>
              <span style={{ fontFamily: C.fMon, fontSize: 11, color: ccOn ? "#6DBF7E" : C.gray }}>CAPTIONS</span>
            </button>

            {/* Report */}
            <button onClick={() => setShowReport(true)} style={{
              padding: "10px", borderRadius: 8, border: "1px solid #333", background: C.surface,
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 20 }}>🚩</span>
              <span style={{ fontFamily: C.fMon, fontSize: 11, color: "#FF6B6B" }}>REPORT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.card, border: "1px solid " + C.burgundy, borderRadius: 12, padding: 20, width: "100%", maxWidth: 320 }}>
            <div style={{ fontFamily: C.fOrb, fontSize: 11, color: C.gold, marginBottom: 16, letterSpacing: 2 }}>🚩 REPORT</div>
            <select value={reportReason} onChange={e => setReportReason(e.target.value)}
              style={{ width: "100%", background: "#111", border: "1px solid #333", color: C.white, borderRadius: 6, padding: "8px 10px", fontFamily: C.fRaj, fontSize: 13, marginBottom: 12 }}>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="hate_speech">Hate Speech</option>
              <option value="nudity">Inappropriate Content</option>
              <option value="other">Other</option>
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowReport(false)} style={{ flex: 1, padding: "8px", borderRadius: 6, border: "1px solid #333", background: C.surface, color: C.gray, cursor: "pointer", fontFamily: C.fMon, fontSize: 10 }}>CANCEL</button>
              <button onClick={() => reportMutation.mutate()} style={{ flex: 1, padding: "8px", borderRadius: 6, border: "1px solid " + C.burgundy, background: C.burgundy, color: C.white, cursor: "pointer", fontFamily: C.fMon, fontSize: 10 }}>SUBMIT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}