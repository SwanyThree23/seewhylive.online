import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

var C = {
  bg: "#0D0D0D", card: "#1A1A1A", burgundy: "#800020", gold: "#D4AF37",
  volt: "#D4AF37", white: "#FFFFFF", gray: "#888", dim: "#444",
  fOrb: "'Orbitron',sans-serif", fRaj: "'Rajdhani',sans-serif",
  fMon: "'Share Tech Mono',monospace",
};

// Whisper toast shown inside room
export function WhisperToast({ whisper, onDismiss }) {
  useEffect(() => {
    if (!whisper) return;
    var t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [whisper]);
  if (!whisper) return null;
  return (
    <div style={{
      position: "fixed", bottom: 80, left: 12, zIndex: 9995,
      background: "rgba(128,0,32,0.95)", border: "1px solid " + C.gold,
      borderRadius: 10, padding: "10px 14px", maxWidth: 260,
      boxShadow: "0 4px 20px rgba(128,0,32,0.5)",
      animation: "slideUp .3s ease-out",
    }}>
      <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.gold, marginBottom: 3 }}>
        🤫 WHISPER FROM {(whisper.sender_name || "").toUpperCase()}
      </div>
      <div style={{ fontFamily: C.fRaj, fontSize: 13, color: C.white }}>
        {whisper.content?.slice(0, 80)}{whisper.content?.length > 80 ? "…" : ""}
      </div>
    </div>
  );
}

// In-room whisper panel (opens from panelist tile)
export function WhisperPanel({ roomId, currentUser, recipientId, recipientName, onClose }) {
  var qc = useQueryClient();
  var [input, setInput] = useState("");
  var msgRef = useRef(null);

  var { data: messages = [] } = useQuery({
    queryKey: ["whispers", roomId, recipientId],
    queryFn: () => base44.entities.DirectMessage.filter({ room_id: roomId, is_whisper: true }),
    refetchInterval: 3000,
  });

  var thread = messages.filter(m =>
    (m.sender_id === currentUser?.id && m.recipient_id === recipientId) ||
    (m.sender_id === recipientId && m.recipient_id === currentUser?.id)
  );

  var sendMutation = useMutation({
    mutationFn: (content) => base44.entities.DirectMessage.create({
      room_id: roomId, sender_id: currentUser?.id, sender_name: currentUser?.full_name || "You",
      recipient_id: recipientId, recipient_name: recipientName,
      content, is_whisper: true,
    }),
    onSuccess: () => { qc.invalidateQueries(["whispers", roomId, recipientId]); setInput(""); },
  });

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
  }, [thread]);

  return (
    <div style={{
      position: "fixed", bottom: 70, left: 8, right: 8, zIndex: 9990,
      background: C.card, border: "1px solid " + C.burgundy,
      borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(128,0,32,0.5)",
    }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: C.fOrb, fontSize: 10, color: C.gold, letterSpacing: 2 }}>
          🤫 WHISPER · {recipientName}
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.gray, cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>
      <div ref={msgRef} style={{ height: 160, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {thread.length === 0 && (
          <div style={{ color: C.dim, fontFamily: C.fMon, fontSize: 10, textAlign: "center", marginTop: 24 }}>No whispers yet</div>
        )}
        {thread.map(m => {
          var isMe = m.sender_id === currentUser?.id;
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "6px 10px", borderRadius: 8,
                background: isMe ? "rgba(128,0,32,0.3)" : "rgba(212,175,55,0.08)",
                border: "1px solid " + (isMe ? C.burgundy : C.gold + "33"),
                fontFamily: C.fRaj, fontSize: 12, color: isMe ? "#ffaaaa" : C.gold,
                fontStyle: "italic",
              }}>{m.content}</div>
              <span style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim, marginTop: 2 }}>
                {isMe ? "You" : m.sender_name}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "8px 12px", borderTop: "1px solid #2a2a2a", display: "flex", gap: 6 }}>
        <input
          style={{ flex: 1, background: "#111", border: "1px solid #333", borderRadius: 6, color: C.white, fontFamily: C.fMon, fontSize: 11, padding: "6px 10px", outline: "none" }}
          placeholder="Whisper…" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && input.trim()) sendMutation.mutate(input.trim()); }}
        />
        <button
          onClick={() => input.trim() && sendMutation.mutate(input.trim())}
          style={{ padding: "6px 14px", background: C.burgundy, border: "1px solid " + C.gold, borderRadius: 6, color: C.gold, fontFamily: C.fMon, fontSize: 10, cursor: "pointer" }}>
          SEND
        </button>
      </div>
    </div>
  );
}