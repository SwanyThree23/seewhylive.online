import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, PenSquare, Send, ArrowLeft, ChevronLeft, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import EnhancedStreamChat from '../components/live/EnhancedStreamChat';
import NotificationBell from '../components/shared/NotificationBell';

const GOLD    = "#D4AF37";
const CRIMSON = "#800020";
const PINK    = "#C0392B";
const CYAN    = "#D4AF37";
const OCT     = "polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)";
const T       = { fontFamily: "Barlow Condensed, sans-serif" };

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
  if (diff < 3600000) return Math.floor(diff / 60000) + "m";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h";
  return d.toLocaleDateString();
}

export default function Messages() {
  var [user, setUser] = useState(null);
  var [selectedThread, setSelectedThread] = useState(null);
  var [input, setInput] = useState("");
  var [showCompose, setShowCompose] = useState(false);
  var [composeName, setComposeName] = useState("");
  var [composeMsg, setComposeMsg] = useState("");
  var [hoveredMsg, setHoveredMsg] = useState(null);
  var [reactionPickerMsg, setReactionPickerMsg] = useState(null);
  var [msgReactions, setMsgReactions] = useState(new Map());
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

  var { data: onlineRecords = [] } = useQuery({
    queryKey: ["presence-online"],
    queryFn: () => base44.entities.PresenceRecord.filter({ is_online: true }),
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  var onlineSet = new Set(onlineRecords.map(r => r.user_id));

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
  var threadMessages = currentThread
    ? currentThread.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

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

  var composeMutation = useMutation({
    mutationFn: () => base44.entities.DirectMessage.create({
      sender_id: user?.id, sender_name: user?.full_name || "Me",
      recipient_id: composeName.trim(), recipient_name: composeName.trim(),
      content: composeMsg.trim(), is_whisper: false,
    }),
    onSuccess: () => {
      qc.invalidateQueries(["all-dms", user?.id]);
      setShowCompose(false);
      setComposeName("");
      setComposeMsg("");
    },
  });

  function handleReaction(msgId, emoji) {
    setMsgReactions(prev => {
      var next = new Map(prev);
      next.set(msgId, emoji);
      return next;
    });
    setReactionPickerMsg(null);
  }

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
    if (currentThread) {
      currentThread.messages
        .filter(m => m.recipient_id === user?.id && !m.read_at)
        .forEach(m => markReadMutation.mutate(m.id));
    }
  }, [threadMessages.length, selectedThread]);

  var totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh", background: "#080B18" }}>

      {/* ── Sticky header ──────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(8,11,24,0.97)",
          borderBottom: "1px solid rgba(212,175,55,0.1)",
          backdropFilter: "blur(12px)",
        }}>
        <div className="flex items-center gap-2.5">
          {selectedThread ? (
            <button
              onClick={() => setSelectedThread(null)}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all hover:brightness-125"
              style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: GOLD }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <MessageSquare className="w-5 h-5" style={{ color: GOLD }} />
          )}
          <h1 className="font-black text-xl text-white leading-none" style={T}>
            {selectedThread && currentThread ? currentThread.partnerName : "Messages"}
          </h1>
          {!selectedThread && totalUnread > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-black"
              style={{ background: PINK, color: "#fff", ...T }}>
              {totalUnread}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center justify-center w-8 h-8 rounded-xl transition-all hover:brightness-125"
          style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: GOLD }}>
          <PenSquare className="w-4 h-4" />
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0, flex: 1 }}>

        {/* Thread list — full width on mobile when no thread selected, 35% on desktop */}
        <div
          className={selectedThread ? "hidden md:flex md:flex-col" : "flex flex-col w-full"}
          style={{
            width: selectedThread ? "35%" : undefined,
            borderRight: selectedThread ? "1px solid rgba(255,255,255,0.04)" : "none",
            overflowY: "auto",
            background: "rgba(13,6,24,0.9)",
            minWidth: 0,
          }}>

          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6">
              <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>💬</div>
              <p className="font-black text-sm uppercase mb-2" style={{ color: "rgba(255,255,255,0.35)", ...T }}>
                No messages yet
              </p>
              <button
                onClick={() => setShowCompose(true)}
                className="px-4 py-2 rounded-xl font-black uppercase text-[10px] mt-1"
                style={{ background: "rgba(212,175,55,0.12)", border: `1px solid ${GOLD}40`, color: GOLD, ...T }}>
                Start a conversation
              </button>
            </div>
          ) : (
            threads.map((t, idx) => {
              var last = t.messages[t.messages.length - 1];
              var isSelected = selectedThread === t.partnerId;
              return (
                <div key={t.partnerId}>
                  <div
                    onClick={() => setSelectedThread(t.partnerId)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                    style={{
                      background: isSelected
                        ? "rgba(212,175,55,0.08)"
                        : "transparent",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(212,175,55,0.05)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>

                    {/* Octagonal avatar with optional online dot */}
                    <div style={{ position: "relative", flexShrink: 0, width: 44, height: 44 }}>
                      <div style={{
                        width: 44, height: 44, clipPath: OCT,
                        background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span className="font-black text-sm text-white" style={T}>
                          {initials(t.partnerName)}
                        </span>
                      </div>
                      {onlineSet.has(t.partnerId) && (
                        <div style={{
                          position: "absolute", bottom: 1, right: 1,
                          width: 7, height: 7, borderRadius: "50%",
                          background: "#6DBF7E",
                          border: "1.5px solid #080B18",
                        }} />
                      )}
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-black text-[13px] text-white truncate" style={T}>
                          {t.partnerName}
                        </span>
                        <span className="text-[11px] ml-2 shrink-0" style={{ color: "rgba(255,255,255,0.25)", ...T }}>
                          {fmtTime(last?.created_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {last?.is_whisper && <span style={{ fontSize: 10 }}>🤫</span>}
                        <span
                          className="text-[11px] truncate"
                          style={{
                            color: t.unread > 0 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)",
                            fontWeight: t.unread > 0 ? 700 : 400,
                            fontStyle: last?.is_whisper ? "italic" : "normal",
                            ...T,
                          }}>
                          {last?.content || ""}
                        </span>
                      </div>
                    </div>

                    {/* Unread badge */}
                    {t.unread > 0 && (
                      <div className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full text-[11px] font-black text-white"
                        style={{ background: PINK, ...T }}>
                        {t.unread}
                      </div>
                    )}
                  </div>
                  {idx < threads.length - 1 && (
                    <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginLeft: 64 }} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Active chat view ──────────────────────────────────── */}
        {selectedThread && currentThread && (
          <div className="flex flex-col flex-1" style={{ background: "#080B18", minWidth: 0, overflow: "hidden" }}>

            {/* Thread sub-header (visible on desktop alongside list) */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2.5"
              style={{
                background: "rgba(13,6,24,0.97)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
              <div style={{
                width: 32, height: 32, clipPath: OCT,
                background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="font-black text-xs text-white" style={T}>
                  {initials(currentThread.partnerName)}
                </span>
              </div>
              <span className="font-black text-sm text-white" style={T}>{currentThread.partnerName}</span>
            </div>

            {/* Messages scroll area */}
            <div ref={msgRef} className="flex-1 overflow-y-auto px-4 py-3"
              style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {threadMessages.map(m => {
                var isMe = m.sender_id === user?.id;
                var isWhisper = m.is_whisper;
                var isGiftNotif = m.type === "gift_notification";
                var reaction = msgReactions.get(m.id);
                var isHovered = hoveredMsg === m.id;
                var showPicker = reactionPickerMsg === m.id;
                return (
                  <div key={m.id}
                    style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", position: "relative" }}
                    onMouseEnter={() => setHoveredMsg(m.id)}
                    onMouseLeave={() => { setHoveredMsg(null); if (reactionPickerMsg === m.id) setReactionPickerMsg(null); }}>
                    {showPicker && (
                      <div style={{
                        position: "absolute", bottom: "calc(100% + 4px)",
                        [isMe ? "right" : "left"]: 0,
                        zIndex: 10,
                        background: "rgba(13,6,24,0.97)",
                        border: "1px solid rgba(212,175,55,0.2)",
                        borderRadius: 12,
                        padding: "4px 8px",
                        display: "flex", gap: 6,
                      }}>
                        {["❤️","😂","🔥","👏","💯"].map(emoji => (
                          <button key={emoji}
                            onClick={() => handleReaction(m.id, emoji)}
                            style={{ fontSize: 16, background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    {isGiftNotif ? (
                      <div className="px-3 py-2 rounded-2xl text-[12px]"
                        style={{
                          background: "rgba(212,175,55,0.1)",
                          border: `1px solid rgba(212,175,55,0.3)`,
                          color: GOLD,
                          ...T,
                        }}>
                        🎁 Gift notification: {m.content}
                      </div>
                    ) : (
                      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4, flexDirection: isMe ? "row-reverse" : "row" }}>
                        <div className="px-3 py-2 rounded-2xl text-[13px] max-w-[75%]"
                          style={{
                            background: isMe ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${isMe ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.08)"}`,
                            color: isWhisper ? GOLD : (isMe ? "#fff" : "rgba(255,255,255,0.9)"),
                            fontStyle: isWhisper ? "italic" : "normal",
                            position: "relative",
                            ...T,
                          }}>
                          {isWhisper && <span style={{ fontSize: 11, marginRight: 4 }}>🤫</span>}
                          {m.content}
                          {reaction && (
                            <span style={{
                              position: "absolute", bottom: -8, [isMe ? "left" : "right"]: -4,
                              fontSize: 12, background: "rgba(13,6,24,0.9)",
                              border: "1px solid rgba(212,175,55,0.2)",
                              borderRadius: 10, padding: "0 3px", lineHeight: "16px",
                            }}>{reaction}</span>
                          )}
                        </div>
                        {isHovered && !showPicker && (
                          <button
                            onClick={() => setReactionPickerMsg(m.id)}
                            style={{
                              width: 20, height: 20, borderRadius: "50%",
                              background: "rgba(255,255,255,0.1)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              color: "rgba(255,255,255,0.5)",
                              fontSize: 11, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}>
                            +
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex gap-1.5 mt-0.5 items-center" style={{ marginTop: reaction ? 8 : 2 }}>
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)", ...T }}>
                        {fmtTime(m.created_date)}
                      </span>
                      {isMe && (
                        <span style={{ fontSize: 11, color: m.read_at ? GOLD : "rgba(255,255,255,0.4)" }}>
                          {m.read_at ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Input bar ──────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-4 py-3"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.04)",
                background: "rgba(13,6,24,0.97)",
              }}>
              <input
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25 px-4 py-2.5 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(212,175,55,0.15)",
                  ...T,
                }}
                placeholder="Type a message…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && input.trim()) sendMutation.mutate(input.trim()); }}
              />
              <button
                onClick={() => input.trim() && sendMutation.mutate(input.trim())}
                className="flex items-center justify-center w-10 h-10 rounded-2xl transition-all hover:brightness-110 shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})`,
                  border: "none",
                  cursor: "pointer",
                }}>
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Compose modal ── */}
      {showCompose && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowCompose(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 16px",
          }}>
          <div style={{
            background: "rgba(13,6,24,0.98)",
            border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: 20, padding: 24, width: "100%", maxWidth: 400,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span className="font-black text-base text-white" style={T}>New Message</span>
              <button
                onClick={() => setShowCompose(false)}
                style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                value={composeName}
                onChange={e => setComposeName(e.target.value)}
                placeholder="Recipient name or ID…"
                className="text-sm text-white outline-none placeholder:text-white/25 px-4 py-2.5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,175,55,0.15)", ...T }}
              />
              <textarea
                value={composeMsg}
                onChange={e => setComposeMsg(e.target.value)}
                placeholder="Write a message…"
                rows={3}
                className="text-sm text-white outline-none resize-none placeholder:text-white/25 px-4 py-2.5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,175,55,0.15)", ...T }}
              />
              <button
                onClick={() => { if (composeName.trim() && composeMsg.trim()) composeMutation.mutate(); }}
                disabled={composeMutation.isPending || !composeName.trim() || !composeMsg.trim()}
                className="font-black uppercase text-[11px] py-2.5 rounded-2xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})`,
                  color: "#fff", border: "none", cursor: "pointer",
                  opacity: (!composeName.trim() || !composeMsg.trim()) ? 0.5 : 1,
                  ...T,
                }}>
                {composeMutation.isPending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {user && (
        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <NotificationBell />
          <EnhancedStreamChat roomId={null} userId={user.id} userName={user.full_name || ''} userRole="viewer" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 16px 28px' }}>
        {[
          { label: '🏠 Home',        href: 'Home'        },
          { label: '👤 Profile',     href: 'Profile'     },
          { label: '🔔 Alerts',      href: 'Notifications' },
          { label: '👥 Communities', href: 'Communities' },
        ].map(item => (
          <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
            <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer' }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
