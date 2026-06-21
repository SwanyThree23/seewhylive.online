import { useState, useEffect, useRef } from "react";
import { toast } from 'sonner';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

var C = {
  bg: "#0D0D0D", card: "#1A1A1A", burgundy: "#800020", gold: "#D4AF37",
  volt: "#D4AF37", white: "#FFF", gray: "#888", dim: "#444",
  purple: "#800020", cyan: "#6DBF7E", green: "#6DBF7E",
  fOrb: "'Orbitron',sans-serif", fRaj: "'Rajdhani',sans-serif",
  fMon: "'Share Tech Mono',monospace", fBeb: "'Bebas Neue',cursive",
};

var RARITY_STYLES = {
  common: { color: C.gray, border: "#555", label: "COMMON" },
  rare: { color: C.gold, border: "#D4AF3744", label: "RARE" },
  epic: { color: C.burgundy, border: "#80002044", label: "EPIC" },
  legendary: { color: C.gold, border: "#D4AF3766", label: "LEGENDARY", shimmer: true },
};

var DEFAULT_GIFTS = [
  { id: "rose", name: "Rose", emoji: "🌹", price: 1, rarity: "common", times_sent: 842 },
  { id: "heart", name: "Heart", emoji: "❤️", price: 5, rarity: "common", times_sent: 631 },
  { id: "fire", name: "Fire", emoji: "🔥", price: 10, rarity: "rare", times_sent: 412 },
  { id: "crown", name: "Crown", emoji: "👑", price: 50, rarity: "rare", times_sent: 189 },
  { id: "rocket", name: "Rocket", emoji: "🚀", price: 100, rarity: "epic", times_sent: 74 },
  { id: "unicorn", name: "Unicorn", emoji: "🦄", price: 200, rarity: "epic", times_sent: 31 },
  { id: "diamond", name: "Diamond", emoji: "💎", price: 500, rarity: "legendary", times_sent: 12 },
  { id: "galaxy", name: "Galaxy", emoji: "🌌", price: 1000, rarity: "legendary", times_sent: 4 },
];

// Full-screen gift animation overlay
export function GiftAnimationOverlay({ queue, onDone }) {
  var [current, setCurrent] = useState(null);

  useEffect(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0]);
      var dur = queue[0].rarity === "legendary" ? 5000 : queue[0].rarity === "epic" ? 4000 : 3000;
      var t = setTimeout(() => { setCurrent(null); onDone(); }, dur);
      return () => clearTimeout(t);
    }
  }, [queue, current]);

  if (!current) return null;
  var rs = RARITY_STYLES[current.rarity] || RARITY_STYLES.common;
  var isLegendary = current.rarity === "legendary";
  var isEpic = current.rarity === "epic";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      background: isLegendary ? "rgba(0,0,0,0.92)" : isEpic ? "rgba(10,0,20,0.92)" : "rgba(0,0,0,0.85)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "fadeIn .3s ease-out",
    }}>
      {/* Particle burst for legendary */}
      {isLegendary && (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {[...Array(20)].map((_, i) => (
            <div key={i} style={{
              position: "absolute", left: Math.random() * 100 + "%", top: Math.random() * 100 + "%",
              width: 6, height: 6, borderRadius: "50%", background: C.gold,
              animation: `giftFloat ${1 + Math.random() * 2}s ease-out forwards`,
              opacity: Math.random(),
            }} />
          ))}
        </div>
      )}
      <div style={{
        fontSize: isLegendary ? 120 : isEpic ? 90 : 70,
        filter: "drop-shadow(0 0 30px " + rs.color + ")",
        animation: "coinSpin .6s ease-out",
        marginBottom: 16,
      }}>{current.emoji}</div>
      <div style={{ fontFamily: C.fBeb, fontSize: 28, color: rs.color, letterSpacing: 3, textShadow: "0 0 20px " + rs.color }}>
        {rs.label} GIFT
      </div>
      <div style={{ fontFamily: C.fBeb, fontSize: 22, color: C.white, marginTop: 8 }}>
        {current.sender_name || "Anonymous"}
      </div>
      <div style={{ fontFamily: C.fMon, fontSize: 12, color: C.dim, marginTop: 6 }}>
        sent {current.name} · 💎{current.price}
      </div>
      {isLegendary && (
        <div style={{ marginTop: 16, padding: "6px 20px", background: "rgba(212,175,55,0.15)", border: "1px solid " + C.gold, borderRadius: 20, fontFamily: C.fOrb, fontSize: 10, color: C.gold, letterSpacing: 3 }}>
          ⚡ LEGENDARY ⚡
        </div>
      )}
    </div>
  );
}

// Gift leaderboard strip (host view)
export function GiftLeaderboard({ roomId }) {
  var { data: transactions = [] } = useQuery({
    queryKey: ["gift-lb", roomId],
    queryFn: () => base44.entities.Transaction.filter({ room_id: roomId }),
    refetchInterval: 10000,
    enabled: !!roomId,
  });

  var leaders = Object.values(
    transactions.reduce((acc, t) => {
      if (!acc[t.sender_id]) acc[t.sender_id] = { name: t.sender_name || t.sender_id, gems: 0 };
      acc[t.sender_id].gems += (t.creator_payout || 0) + (t.platform_cut || 0);
      return acc;
    }, {})
  ).sort((a, b) => b.gems - a.gems).slice(0, 5);

  if (leaders.length === 0) return null;

  return (
    <div style={{ background: C.card, borderBottom: "1px solid " + C.gold + "33", padding: "6px 12px", display: "flex", gap: 10, overflowX: "auto" }}>
      <span style={{ fontFamily: C.fOrb, fontSize: 11, color: C.gold, letterSpacing: 2, flexShrink: 0, alignSelf: "center" }}>🏆 TOP GIFTERS</span>
      {leaders.map((l, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, gap: 2 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg," + C.burgundy + "," + C.gold + ")", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.fBeb, fontSize: 11, color: C.white }}>
            {(l.name || "?")[0].toUpperCase()}
          </div>
          <span style={{ fontFamily: C.fMon, fontSize: 7, color: C.gold }}>💎{l.gems}</span>
        </div>
      ))}
    </div>
  );
}

// Gift tray (viewer-facing)
export function GiftTray({ roomId, currentUser, hostId, onSend }) {
  var [open, setOpen] = useState(false);
  var qc = useQueryClient();

  var { data: dbGifts = [] } = useQuery({
    queryKey: ["animated-gifts"],
    queryFn: () => base44.entities.AnimatedGift.filter({ is_active: true }),
  });

  var gifts = dbGifts.length > 0 ? dbGifts.map(g => ({
    ...g, emoji: g.thumbnail_url || "🎁", price: g.price || 1,
  })) : DEFAULT_GIFTS;

  var sendMutation = useMutation({
    mutationFn: (gift) => Promise.all([
      base44.entities.Transaction.create({
        sender_id: currentUser?.id, sender_name: currentUser?.full_name || "Viewer",
        recipient_id: hostId, room_id: roomId,
        amount: gift.price, creator_payout: Math.floor(gift.price * 90) / 100, platform_cut: gift.price - Math.floor(gift.price * 90) / 100,
        transaction_type: "direct_support", status: "completed", processed_at: new Date().toISOString(),
      }),
      base44.entities.TipAlert.create({
        creator_id: hostId, room_id: roomId,
        sender_id: currentUser?.id, sender_name: currentUser?.full_name || "Viewer",
        amount_usd: gift.price, message: "Sent " + (gift.name || gift.id),
        animation_type: gift.rarity === "legendary" ? "fireworks" : gift.rarity === "epic" ? "confetti" : "slide_in",
        is_displayed: false,
      }),
    ]),
    onSuccess: (_, gift) => {
      onSend && onSend({ ...gift, sender_name: currentUser?.full_name || "You" });
      qc.invalidateQueries({ queryKey: ["gift-lb", roomId] });
      setOpen(false);
      if (currentUser?.id) {
        Promise.allSettled([
          base44.entities.Activity.create({
            user_id: currentUser.id,
            type: 'gift_sent',
            title: `Sent ${gift.name || 'gift'}`,
            amount: gift.price,
            recipient_id: hostId,
          }),
          hostId && base44.entities.Activity.create({
            user_id: hostId,
            type: 'gift_received',
            title: `Received ${gift.name || 'gift'} from ${currentUser.full_name || 'viewer'}`,
            amount: gift.price,
            sender_id: currentUser.id,
          }),
        ]);
      }
    },
    onError: () => toast.error('Action failed.'),
  });

  return (
    <>
      {/* Floating gift button */}
      <button onClick={() => setOpen(true)} style={{
        position: "fixed", bottom: 90, right: 14, width: 50, height: 50, borderRadius: "50%",
        background: "linear-gradient(135deg," + C.burgundy + "," + C.gold + ")",
        border: "none", fontSize: 22, cursor: "pointer", zIndex: 900,
        boxShadow: "0 4px 16px rgba(128,0,32,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>🎁</button>

      {/* Slide-up tray */}
      {open && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9000,
          background: C.card, borderTop: "2px solid " + C.burgundy,
          borderRadius: "16px 16px 0 0", padding: "0 0 16px",
          maxHeight: "70vh", overflowY: "auto",
          animation: "slideUp .3s ease-out",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #2a2a2a" }}>
            <span style={{ fontFamily: C.fOrb, fontSize: 11, color: C.gold, letterSpacing: 2 }}>🎁 GIFT SHOP</span>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: C.gray, cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, padding: 12 }}>
            {gifts.map(gift => {
              var rs = RARITY_STYLES[gift.rarity] || RARITY_STYLES.common;
              return (
                <button key={gift.id || gift.name} onClick={() => sendMutation.mutate(gift)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "10px 4px", borderRadius: 10,
                    border: "1px solid " + rs.border, background: "rgba(255,255,255,0.03)",
                    cursor: "pointer", transition: "all .15s",
                  }}>
                  <span style={{ fontSize: 28, filter: "drop-shadow(0 0 6px " + rs.color + ")" }}>
                    {typeof gift.emoji === "string" && gift.emoji.startsWith("http") ? "🎁" : gift.emoji}
                  </span>
                  <span style={{ fontFamily: C.fMon, fontSize: 7, color: rs.color }}>{rs.label}</span>
                  <span style={{ fontFamily: C.fRaj, fontSize: 10, color: C.white }}>{gift.name}</span>
                  <span style={{ fontFamily: C.fMon, fontSize: 11, color: C.gold }}>💎{gift.price}</span>
                  <span style={{ fontFamily: C.fMon, fontSize: 7, color: C.dim }}>{gift.times_sent || 0}x sent</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// TipAlert overlay with TTS
export function TipAlertOverlay({ alert, onDismiss }) {
  useEffect(() => {
    if (!alert) return;
    var dur = alert.display_duration_ms || 5000;
    var t = setTimeout(onDismiss, dur);
    // TTS
    if (alert.message && window.speechSynthesis) {
      var utt = new SpeechSynthesisUtterance(alert.sender_name + " says: " + alert.message);
      window.speechSynthesis.speak(utt);
    }
    return () => { clearTimeout(t); window.speechSynthesis?.cancel(); };
  }, [alert]);

  if (!alert) return null;
  var isLegendary = alert.amount_usd >= 50;
  var isGold = alert.amount_usd >= 10;

  return (
    <div style={{
      position: "fixed", top: 70, right: 12, zIndex: 9991, maxWidth: 280,
      background: isLegendary ? "rgba(0,0,0,0.95)" : "rgba(13,13,13,0.95)",
      border: "1px solid " + (isLegendary ? C.gold : isGold ? C.gold + "88" : "#444"),
      borderRadius: 12, padding: "12px 16px",
      boxShadow: isLegendary ? "0 0 30px rgba(212,175,55,0.6)" : "0 4px 20px rgba(0,0,0,0.5)",
      animation: "slideUp .4s ease-out",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 26 }}>{isLegendary ? "⚡" : "💰"}</span>
        <div>
          <div style={{ fontFamily: C.fBeb, fontSize: 16, color: isLegendary ? C.gold : C.white, textShadow: isLegendary ? "0 0 12px " + C.gold : "none" }}>
            {alert.sender_name} tipped ${parseFloat(alert.amount_usd).toFixed(2)}
          </div>
          {alert.message && <div style={{ fontFamily: C.fRaj, fontSize: 11, color: C.gray, marginTop: 2 }}>{alert.message}</div>}
        </div>
      </div>
    </div>
  );
}