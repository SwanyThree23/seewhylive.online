import { useState, useEffect, useRef } from "react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, PenSquare, Send, ChevronLeft, X } from "lucide-react";
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import NotificationBell from '../components/shared/NotificationBell';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import CreatorBridge from '../components/social/CreatorBridge';
import HostAlertCenter from '../components/live/HostAlertCenter';
import RewardShop from '../components/loyalty/RewardShop';
import ShopDashboard from '../components/merch/ShopDashboard';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import ViewerCount from '../components/live/ViewerCount';

var GOLD    = "#FFB800";
var CRIMSON = "#FF1564";
var PINK    = "#FF2040";
var CYAN    = "#00F5FF";
var OCT     = "polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)";
var T       = { fontFamily: "Barlow Condensed, sans-serif" };

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(function(w) { return w[0]; }).join("").toUpperCase().slice(0, 2);
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
  var roomId = new URLSearchParams(window.location.search).get('room_id');
  var userState = useState(null); var user = userState[0]; var setUser = userState[1];
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, roomId);

  var selectedThreadState = useState(null); var selectedThread = selectedThreadState[0]; var setSelectedThread = selectedThreadState[1];
  var inputState = useState(""); var input = inputState[0]; var setInput = inputState[1];
  var showComposeState = useState(false); var showCompose = showComposeState[0]; var setShowCompose = showComposeState[1];
  var composeNameState = useState(""); var composeName = composeNameState[0]; var setComposeName = composeNameState[1];
  var composeMsgState = useState(""); var composeMsg = composeMsgState[0]; var setComposeMsg = composeMsgState[1];
  var hoveredMsgState = useState(null); var hoveredMsg = hoveredMsgState[0]; var setHoveredMsg = hoveredMsgState[1];
  var reactionPickerMsgState = useState(null); var reactionPickerMsg = reactionPickerMsgState[0]; var setReactionPickerMsg = reactionPickerMsgState[1];
  var msgReactionsState = useState(new Map()); var msgReactions = msgReactionsState[0]; var setMsgReactions = msgReactionsState[1];
  var msgRef = useRef(null);
  var qc = useQueryClient();

  useEffect(function() {
    base44.auth.me().then(setUser).catch(function() {});
  }, []);

  var userCommunityQuery = useQuery({
    queryKey: ['userCommunity', (user && user.id)],
    queryFn: function() { return base44.entities.Community.filter({ owner_id: (user && user.id) }).then(function(r) { return r[0] || null; }); },
    enabled: !!(user && user.id),
  });
  var userCommunity = userCommunityQuery.data || null;
  var userCommunityId = (userCommunity && userCommunity.id) || null;

  var allMessagesQuery = useQuery({
    queryKey: ["all-dms", (user && user.id)],
    queryFn: function() { return base44.entities.DirectMessage.list("-created_date", 200); },
    enabled: !!(user && user.id),
    refetchInterval: 5000,
  });
  var allMessages = allMessagesQuery.data || [];

  var onlineRecordsQuery = useQuery({
    queryKey: ["presence-online"],
    queryFn: function() { return base44.entities.OnlinePresence.filter({ is_online: true }); },
    enabled: !!(user && user.id),
    refetchInterval: 15000,
  });
  var onlineRecords = onlineRecordsQuery.data || [];

  var onlineSet = new Set(onlineRecords.map(function(r) { return r.user_id; }));

  // Build threads grouped by conversation partner
  var myMessages = allMessages.filter(function(m) {
    return m.sender_id === (user && user.id) || m.recipient_id === (user && user.id);
  });

  var threadMap = {};
  myMessages.forEach(function(m) {
    var partnerId = m.sender_id === (user && user.id) ? m.recipient_id : m.sender_id;
    var partnerName = m.sender_id === (user && user.id) ? m.recipient_name : m.sender_name;
    if (!threadMap[partnerId]) {
      threadMap[partnerId] = { partnerId, partnerName, messages: [], unread: 0 };
    }
    threadMap[partnerId].messages.push(m);
    if (m.recipient_id === (user && user.id) && !m.read_at) {
      threadMap[partnerId].unread++;
    }
  });

  var threads = Object.values(threadMap).sort(function(a, b) {
    var aLast = (a.messages[a.messages.length - 1] && a.messages[a.messages.length - 1].created_date) || 0;
    var bLast = (b.messages[b.messages.length - 1] && b.messages[b.messages.length - 1].created_date) || 0;
    return new Date(bLast) - new Date(aLast);
  });

  var currentThread = selectedThread ? (threadMap[selectedThread] || null) : null;
  var threadMessages = currentThread
    ? currentThread.messages.sort(function(a, b) { return new Date(a.created_date) - new Date(b.created_date); })
    : [];

  var sendMutation = useMutation({
    mutationFn: function(content) { return base44.entities.DirectMessage.create({
      sender_id: (user && user.id), sender_name: (user && user.full_name) || "Me",
      recipient_id: selectedThread, recipient_name: (currentThread && currentThread.partnerName) || "User",
      content, is_whisper: false,
    }); },
    onSuccess: function() { qc.invalidateQueries({ queryKey: ["all-dms", (user && user.id)] }); setInput(""); },
    onError: function() { toast.error('Action failed.'); },
  });

  var markReadMutation = useMutation({
    mutationFn: function(msgId) { return base44.entities.DirectMessage.update(msgId, { read_at: new Date().toISOString(), is_read: true }); },
    onSuccess: function() { qc.invalidateQueries({ queryKey: ["all-dms", (user && user.id)] }); },
    onError: function() { toast.error('Action failed.'); },
  });

  var composeMutation = useMutation({
    mutationFn: function() { return base44.entities.DirectMessage.create({
      sender_id: (user && user.id), sender_name: (user && user.full_name) || "Me",
      recipient_id: composeName.trim(), recipient_name: composeName.trim(),
      content: composeMsg.trim(), is_whisper: false,
    }); },
    onSuccess: function() {
      qc.invalidateQueries({ queryKey: ["all-dms", (user && user.id)] });
      setShowCompose(false);
      setComposeName("");
      setComposeMsg("");
      if ((user && user.id)) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'milestone',
          title: 'Sent a direct message to ' + composeName.trim(),
        }).catch(function() {});
      }
    },
    onError: function() { toast.error('Action failed.'); },
  });

  function handleReaction(msgId, emoji) {
    setMsgReactions(function(prev) {
      var next = new Map(prev);
      next.set(msgId, emoji);
      return next;
    });
    setReactionPickerMsg(null);
  }

  useEffect(function() {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
    if (currentThread) {
      currentThread.messages
        .filter(function(m) { return m.recipient_id === (user && user.id) && !m.read_at; })
        .forEach(function(m) { markReadMutation.mutate(m.id); });
    }
  }, [threadMessages.length, selectedThread]);

  var totalUnread = threads.reduce(function(sum, t) { return sum + t.unread; }, 0);

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh", background: "#03030A" }}>

      {/* ── Sticky header ──────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(7,7,15,0.97)",
          borderBottom: "1px solid rgba(255,184,0,0.1)",
          backdropFilter: "blur(12px)",
        }}>
        <div className="flex items-center gap-2.5">
          {selectedThread ? (
            <button
              onClick={function() { setSelectedThread(null); }}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all hover:brightness-125"
              style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.2)", color: GOLD }}>
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
              style={{ background: PINK, color: "#fff", fontFamily: "Barlow Condensed, sans-serif" }}>
              {totalUnread}
            </span>
          )}
        </div>
        <button
          onClick={function() { setShowCompose(true); }}
          className="flex items-center justify-center w-8 h-8 rounded-xl transition-all hover:brightness-125"
          style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.2)", color: GOLD }}>
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
            background: "rgba(7,7,15,0.9)",
            minWidth: 0,
          }}>

          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6">
              <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>💬</div>
              <p className="font-black text-sm uppercase mb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Barlow Condensed, sans-serif" }}>
                No messages yet
              </p>
              <button
                onClick={function() { setShowCompose(true); }}
                className="px-4 py-2 rounded-xl font-black uppercase text-[10px] mt-1"
                style={{ background: "rgba(255,184,0,0.12)", border: '1px solid ' + GOLD + '40', color: GOLD, fontFamily: "Barlow Condensed, sans-serif" }}>
                Start a conversation
              </button>
            </div>
          ) : (
            threads.map(function(t, idx) {
              var last = t.messages[t.messages.length - 1];
              var isSelected = selectedThread === t.partnerId;
              return (
                <div key={t.partnerId}>
                  <div
                    onClick={function() { setSelectedThread(t.partnerId); }}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                    style={{
                      background: isSelected
                        ? "rgba(255,184,0,0.08)"
                        : "transparent",
                    }}
                    onMouseEnter={function(e) { if (!isSelected) e.currentTarget.style.background = "rgba(255,184,0,0.05)"; }}
                    onMouseLeave={function(e) { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>

                    {/* Octagonal avatar with optional online dot */}
                    <div style={{ position: "relative", flexShrink: 0, width: 44, height: 44 }}>
                      <div style={{
                        width: 44, height: 44, clipPath: OCT,
                        background: 'linear-gradient(135deg, ' + CRIMSON + ', ' + GOLD + ')',
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
                          background: "#00FF88",
                          border: "1.5px solid #03030A",
                        }} />
                      )}
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-black text-[13px] text-white truncate" style={T}>
                          {t.partnerName}
                        </span>
                        <span className="text-[11px] ml-2 shrink-0" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "Barlow Condensed, sans-serif" }}>
                          {fmtTime((last && last.created_date))}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {(last && last.is_whisper) && <span style={{ fontSize: 10 }}>🤫</span>}
                        <span
                          className="text-[11px] truncate"
                          style={{
                            color: t.unread > 0 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)",
                            fontWeight: t.unread > 0 ? 700 : 400,
                            fontStyle: (last && last.is_whisper) ? "italic" : "normal",
                            fontFamily: "Barlow Condensed, sans-serif",
                          }}>
                          {(last && last.content) || ""}
                        </span>
                      </div>
                    </div>

                    {/* Unread badge */}
                    {t.unread > 0 && (
                      <div className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full text-[11px] font-black text-white"
                        style={{ background: PINK, fontFamily: "Barlow Condensed, sans-serif" }}>
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
          <div className="flex flex-col flex-1" style={{ background: "#03030A", minWidth: 0, overflow: "hidden" }}>

            {/* Thread sub-header (visible on desktop alongside list) */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2.5"
              style={{
                background: "rgba(7,7,15,0.97)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
              <div style={{
                width: 32, height: 32, clipPath: OCT,
                background: 'linear-gradient(135deg, ' + CRIMSON + ', ' + GOLD + ')',
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
              {threadMessages.map(function(m) {
                var isMe = m.sender_id === (user && user.id);
                var isWhisper = m.is_whisper;
                var isGiftNotif = m.type === "gift_notification";
                var reaction = msgReactions.get(m.id);
                var isHovered = hoveredMsg === m.id;
                var showPicker = reactionPickerMsg === m.id;
                return (
                  <div key={m.id}
                    style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", position: "relative" }}
                    onMouseEnter={function() { setHoveredMsg(m.id); }}
                    onMouseLeave={function() { setHoveredMsg(null); if (reactionPickerMsg === m.id) setReactionPickerMsg(null); }}>
                    {showPicker && (
                      <div style={{
                        position: "absolute", bottom: "calc(100% + 4px)",
                        [isMe ? "right" : "left"]: 0,
                        zIndex: 10,
                        background: "rgba(7,7,15,0.97)",
                        border: "1px solid rgba(255,184,0,0.2)",
                        borderRadius: 12,
                        padding: "4px 8px",
                        display: "flex", gap: 6,
                      }}>
                        {["❤️","😂","🔥","👏","💯"].map(function(emoji) { return (
                          <button key={emoji}
                            onClick={function() { handleReaction(m.id, emoji); }}
                            style={{ fontSize: 16, background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                            {emoji}
                          </button>
                        ); })}
                      </div>
                    )}
                    {isGiftNotif ? (
                      <div className="px-3 py-2 rounded-2xl text-[12px]"
                        style={{
                          background: "rgba(255,184,0,0.1)",
                          border: '1px solid rgba(255,184,0,0.3)',
                          color: GOLD,
                          fontFamily: "Barlow Condensed, sans-serif",
                        }}>
                        🎁 Gift notification: {m.content}
                      </div>
                    ) : (
                      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4, flexDirection: isMe ? "row-reverse" : "row" }}>
                        <div className="px-3 py-2 rounded-2xl text-[13px] max-w-[75%]"
                          style={{
                            background: isMe ? "rgba(255,184,0,0.12)" : "rgba(255,255,255,0.06)",
                            border: '1px solid ' + (isMe ? "rgba(255,184,0,0.25)" : "rgba(255,255,255,0.08)"),
                            color: isWhisper ? GOLD : (isMe ? "#fff" : "rgba(255,255,255,0.9)"),
                            fontStyle: isWhisper ? "italic" : "normal",
                            position: "relative",
                            fontFamily: "Barlow Condensed, sans-serif",
                          }}>
                          {isWhisper && <span style={{ fontSize: 11, marginRight: 4 }}>🤫</span>}
                          {m.content}
                          {reaction && (
                            <span style={{
                              position: "absolute", bottom: -8, [isMe ? "left" : "right"]: -4,
                              fontSize: 12, background: "rgba(7,7,15,0.9)",
                              border: "1px solid rgba(255,184,0,0.2)",
                              borderRadius: 10, padding: "0 3px", lineHeight: "16px",
                            }}>{reaction}</span>
                          )}
                        </div>
                        {isHovered && !showPicker && (
                          <button
                            onClick={function() { setReactionPickerMsg(m.id); }}
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
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "Barlow Condensed, sans-serif" }}>
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
                background: "rgba(7,7,15,0.97)",
              }}>
              <input
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25 px-4 py-2.5 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,184,0,0.15)",
                  fontFamily: "Barlow Condensed, sans-serif",
                }}
                placeholder="Type a message…"
                value={input}
                onChange={function(e) { setInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === "Enter" && input.trim()) sendMutation.mutate(input.trim()); }}
                maxLength={1000}
              />
              <button
                onClick={function() { if (input.trim()) sendMutation.mutate(input.trim()); }}
                className="flex items-center justify-center w-10 h-10 rounded-2xl transition-all hover:brightness-110 shrink-0"
                style={{
                  background: 'linear-gradient(135deg, ' + CRIMSON + ', ' + GOLD + ')',
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
          onClick={function(e) { if (e.target === e.currentTarget) setShowCompose(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 16px",
          }}>
          <div style={{
            background: "rgba(7,7,15,0.98)",
            border: "1px solid rgba(255,184,0,0.2)",
            borderRadius: 20, padding: 24, width: "100%", maxWidth: 400,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span className="font-black text-base text-white" style={T}>New Message</span>
              <button
                onClick={function() { setShowCompose(false); }}
                style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                value={composeName}
                onChange={function(e) { setComposeName(e.target.value); }}
                placeholder="Recipient name or ID…"
                className="text-sm text-white outline-none placeholder:text-white/25 px-4 py-2.5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,184,0,0.15)", fontFamily: "Barlow Condensed, sans-serif" }}
                maxLength={100}
              />
              <textarea
                value={composeMsg}
                onChange={function(e) { setComposeMsg(e.target.value); }}
                placeholder="Write a message…"
                rows={3}
                className="text-sm text-white outline-none resize-none placeholder:text-white/25 px-4 py-2.5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,184,0,0.15)", fontFamily: "Barlow Condensed, sans-serif" }}
                maxLength={1000}
              />
              <button
                onClick={function() { if (composeName.trim() && composeMsg.trim()) composeMutation.mutate(); }}
                disabled={composeMutation.isPending || !composeName.trim() || !composeMsg.trim()}
                className="font-black uppercase text-[11px] py-2.5 rounded-2xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, ' + CRIMSON + ', ' + GOLD + ')',
                  color: "#fff", border: "none", cursor: "pointer",
                  opacity: (!composeName.trim() || !composeMsg.trim()) ? 0.5 : 1,
                  fontFamily: "Barlow Condensed, sans-serif",
                }}>
                {composeMutation.isPending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={null} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      {/* Creator Studios */}
      <div style={{ margin: '0 0 16px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
        <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
            { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
          ].map(function(s) {
            return (
              <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 2 }}>{s.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
            🎬 Launch Episode Creator Studio →
          </div>
        </Link>
      </div>
      <BackgroundCustomizer />
    </div>
  );
}
