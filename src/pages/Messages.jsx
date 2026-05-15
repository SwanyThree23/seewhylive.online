import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

var C = {
  bg: "#0D0D0D", card: "#1A1A1A", surface: "#161616",
  burgundy: "#800020", gold: "#D4AF37", volt: "#C8FF00",
  white: "#FFFFFF", gray: "#888", dim: "#444",
  fOrb: "'Orbitron',sans-serif", fRaj: "'Rajdhani',sans-serif",
  fMon: "'Share Tech Mono',monospace", fBeb: "'Bebas Neue',cursive",
};

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function fmtTime(ts) {
  if (!ts) return "";
  var d = new Date(ts);
  var now = new Date();
  var diff = now - d;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  return d.toLocaleDateString();
}

export default function Messages() {
  var [user, setUser] = useState(null);
  var [selectedThread, setSelectedThread] = useState(null);
  var [input, setInput] = useState("");
  var msgRef = useRef(null);
  var qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  var { data: allMessages = [] } = useQuery({
    queryKey: ["all-dms", user?.id],
    queryFn: () => base44.entities.DirectMessage.list("-created_date", 200),
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Build threads grouped by conversation partner
  var myMessages = allMessages.filter(m =>
    m.sender_id === user?.id || m.recipient_id === user?.id
  );

  var threadMap = {};
  myMessages.forEach(m => {
    var partnerId = m.sender_id === user?.id ? m.recipient_id : m.sender_id;
    var partnerName = m.sender_id === user?.id ? m.recipient_name : m.sender_name;
    if (!threadMap[partnerId]) {
      threadMap[partnerId] = { partnerId, partnerName, messages: [], unread: 0 };
    }
    threadMap[partnerId].messages.push(m);
    if (m.recipient_id === user?.id && !m.read_at) {
      threadMap[partnerId].unread++;
    }
  });

  var threads = Object.values(threadMap).sort((a, b) => {
    var aLast = a.messages[a.messages.length - 1]?.created_date || 0;
    var bLast = b.messages[b.messages.length - 1]?.created_date || 0;
    return new Date(bLast) - new Date(aLast);
  });

  var currentThread = selectedThread ? (threadMap[selectedThread] || null) : null;
  var threadMessages = currentThread ? currentThread.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)) : [];

  var sendMutation = useMutation({
    mutationFn: (content) => base44.entities.DirectMessage.create({
      sender_id: user?.id, sender_name: user?.full_name || "Me",
      recipient_id: selectedThread, recipient_name: currentThread?.partnerName || "User",
      content, is_whisper: false,
    }),
    onSuccess: () => { qc.invalidateQueries(["all-dms", user?.id]); setInput(""); },
  });

  var markReadMutation = useMutation({
    mutationFn: (msgId) => base44.entities.DirectMessage.update(msgId, { read_at: new Date().toISOString(), is_read: true }),
    onSuccess: () => qc.invalidateQueries(["all-dms", user?.id]),
  });

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
    // Mark unread messages as read
    if (currentThread) {
      currentThread.messages.filter(m => m.recipient_id === user?.id && !m.read_at)
        .forEach(m => markReadMutation.mutate(m.id));
    }
  }, [threadMessages.length, selectedThread]);

  var totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: C.card, borderBottom: "1px solid " + C.burgundy, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => window.history.back()} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontSize: 18 }}>←</button>
        <span style={{ fontFamily: C.fOrb, fontSize: 14, color: C.gold, letterSpacing: 2 }}>MESSAGES</span>
        {totalUnread > 0 && (
          <span style={{ background: C.burgundy, color: C.white, borderRadius: 10, padding: "2px 8px", fontFamily: C.fMon, fontSize: 10 }}>{totalUnread}</span>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Thread list */}
        <div style={{
          width: selectedThread ? "35%" : "100%", borderRight: "1px solid #1a1a1a",
          overflowY: "auto", background: C.card,
        }}>
          {threads.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: C.dim, fontFamily: C.fMon, fontSize: 11 }}>No messages yet</div>
          )}
          {threads.map(t => {
            var last = t.messages[t.messages.length - 1];
            var isSelected = selectedThread === t.partnerId;
            return (
              <div key={t.partnerId} onClick={() => setSelectedThread(t.partnerId)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  borderBottom: "1px solid #1a1a1a", cursor: "pointer",
                  background: isSelected ? "rgba(128,0,32,0.2)" : "transparent",
                  transition: "background .15s",
                }}>
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg," + C.burgundy + "," + C.gold + ")",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: C.fBeb, fontSize: 14, color: C.white, flexShrink: 0,
                }}>
                  {initials(t.partnerName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontFamily: C.fRaj, fontSize: 13, fontWeight: 700, color: isSelected ? C.gold : C.white }}>{t.partnerName}</span>
                    <span style={{ fontFamily: C.fMon, fontSize: 8, color: C.dim }}>{fmtTime(last?.created_date)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {last?.is_whisper && <span style={{ fontSize: 10 }}>🤫</span>}
                    <span style={{
                      fontFamily: C.fRaj, fontSize: 11, color: t.unread > 0 ? C.white : C.gray,
                      fontWeight: t.unread > 0 ? 700 : 400,
                      fontStyle: last?.is_whisper ? "italic" : "normal",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{last?.content || ""}</span>
                  </div>
                </div>
                {t.unread > 0 && (
                  <div style={{ background: C.burgundy, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.fMon, fontSize: 8, color: C.white, flexShrink: 0 }}>{t.unread}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Message thread */}
        {selectedThread && currentThread && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg }}>
            {/* Thread header */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a1a1a", background: C.card, display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setSelectedThread(null)} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer" }}>←</button>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg," + C.burgundy + "," + C.gold + ")", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.fBeb, fontSize: 12, color: C.white }}>{initials(currentThread.partnerName)}</div>
              <span style={{ fontFamily: C.fRaj, fontSize: 14, fontWeight: 700, color: C.white }}>{currentThread.partnerName}</span>
            </div>

            {/* Messages */}
            <div ref={msgRef} style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
              {threadMessages.map(m => {
                var isMe = m.sender_id === user?.id;
                var isWhisper = m.is_whisper;
                var isGiftNotif = m.type === "gift_notification";
                return (
                  <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                    {isGiftNotif && (
                      <div style={{ padding: "8px 12px", background: "rgba(212,175,55,0.1)", border: "1px solid " + C.gold + "44", borderRadius: 10, fontFamily: C.fRaj, fontSize: 12, color: C.gold }}>
                        🎁 Gift notification: {m.content}
                      </div>
                    )}
                    {!isGiftNotif && (
                      <div style={{
                        maxWidth: "75%", padding: "8px 12px", borderRadius: 10,
                        background: isMe ? "rgba(128,0,32,0.35)" : "rgba(255,255,255,0.06)",
                        border: "1px solid " + (isMe ? C.burgundy : "#2a2a2a"),
                        fontFamily: C.fRaj, fontSize: 13,
                        color: isWhisper ? C.gold : (isMe ? "#ffcccc" : C.white),
                        fontStyle: isWhisper ? "italic" : "normal",
                      }}>
                        {isWhisper && <span style={{ fontSize: 11, marginRight: 4 }}>🤫</span>}
                        {m.content}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 4, marginTop: 2, alignItems: "center" }}>
                      <span style={{ fontFamily: C.fMon, fontSize: 8, color: C.dim }}>{fmtTime(m.created_date)}</span>
                      {isMe && <span style={{ fontSize: 9, color: m.read_at ? "#4fc3f7" : C.dim }}>{m.read_at ? "✓✓" : "✓"}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div style={{ padding: "10px 12px", borderTop: "1px solid #1a1a1a", background: C.card, display: "flex", gap: 8 }}>
              <input
                style={{ flex: 1, background: "#111", border: "1px solid #333", borderRadius: 8, color: C.white, fontFamily: C.fMon, fontSize: 12, padding: "8px 12px", outline: "none" }}
                placeholder="Type a message…" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && input.trim()) sendMutation.mutate(input.trim()); }}
              />
              <button onClick={() => input.trim() && sendMutation.mutate(input.trim())}
                style={{ padding: "8px 16px", background: C.burgundy, border: "1px solid " + C.gold, borderRadius: 8, color: C.gold, fontFamily: C.fMon, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
                SEND
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}