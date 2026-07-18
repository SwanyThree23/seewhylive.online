import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

var C = {
  bg: "#0D0D0D", card: "#1A1A1A", surface: "#161616",
  burgundy: "#800020", gold: "#D4AF37", volt: "#D4AF37",
  white: "#FFF", gray: "#888", dim: "#444", green: "#6DBF7E",
  fOrb: "'Orbitron',sans-serif", fRaj: "'Rajdhani',sans-serif",
  fMon: "'Share Tech Mono',monospace", fBeb: "'Bebas Neue',cursive",
};

export default function TipNowModal({ roomId, currentUser, hostId, onClose }) {
  var [amount, setAmount] = useState(null);
  var [custom, setCustom] = useState("");
  var [message, setMessage] = useState("");
  var [method, setMethod] = useState("Card");
  var [success, setSuccess] = useState(false);
  var qc = useQueryClient();

  var finalAmount = amount || parseFloat(custom) || 0;
  var creatorGets = (Math.floor(finalAmount  * 90) / 100).toFixed(2);

  var sendMutation = useMutation({
    mutationFn: () => Promise.all([
      base44.entities.Transaction.create({
        sender_id: currentUser?.id, sender_name: currentUser?.full_name || "Viewer",
        recipient_id: hostId, room_id: roomId,
        amount: finalAmount, platform_cut: Math.floor(finalAmount * 0.1), creator_payout: Math.floor(finalAmount * 0.9),
        payment_method: method.toLowerCase(), transaction_type: "direct_support", status: "completed",
      }),
      base44.entities.TipAlert.create({
        creator_id: hostId, room_id: roomId,
        sender_id: currentUser?.id, sender_name: currentUser?.full_name || "Viewer",
        amount_usd: finalAmount, message,
        animation_type: finalAmount >= 50 ? "fireworks" : finalAmount >= 10 ? "confetti" : "slide_in",
        is_displayed: false,
      }),
    ]),
    onSuccess: () => {
      setSuccess(true);
      qc.invalidateQueries({ queryKey: ["tip-alerts", roomId] });
      if (currentUser?.id) {
        Promise.allSettled([
          base44.entities.Activity.create({
            user_id: currentUser.id,
            type: 'tip_sent',
            title: `Tipped $${finalAmount.toFixed(2)}`,
            amount: finalAmount,
            recipient_id: hostId,
          }),
          hostId && base44.entities.Activity.create({
            user_id: hostId,
            type: 'tip_received',
            title: `Received $${finalAmount.toFixed(2)} tip from ${currentUser.full_name || 'viewer'}`,
            amount: finalAmount,
            sender_id: currentUser.id,
          }),
        ]);
      }
    },
    onError: () => toast.error('Tip failed. Please try again.'),
  });

  if (success) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9900, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.card, border: "1px solid " + C.gold, borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 300 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
        <div style={{ fontFamily: C.fBeb, fontSize: 28, color: C.gold }}>TIP SENT!</div>
        <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.gray, marginTop: 8 }}>${finalAmount.toFixed(2)} sent successfully</div>
        <button onClick={onClose} style={{ marginTop: 20, padding: "10px 28px", background: C.burgundy, border: "1px solid " + C.gold, borderRadius: 8, color: C.gold, fontFamily: C.fMon, fontSize: 11, cursor: "pointer" }}>CLOSE</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9900, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: C.card, borderRadius: "16px 16px 0 0",
        border: "1px solid " + C.burgundy, padding: "0 0 24px",
        animation: "slideUp .3s ease-out",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #2a2a2a" }}>
          <span style={{ fontFamily: C.fOrb, fontSize: 11, color: C.gold, letterSpacing: 2 }}>💰 TIP NOW</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.gray, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Amounts */}
          <div>
            <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim, letterSpacing: 1, marginBottom: 8 }}>AMOUNT</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[1, 2, 5, 10, 20].map(v => (
                <button key={v} onClick={() => { setAmount(v); setCustom(""); }} style={{
                  padding: "7px 14px", borderRadius: 6,
                  border: "1px solid " + (amount === v ? C.gold : "#333"),
                  background: amount === v ? "rgba(212,175,55,0.15)" : C.surface,
                  cursor: "pointer", fontFamily: C.fMon, fontSize: 11,
                  color: amount === v ? C.gold : C.gray,
                }}>${v}</button>
              ))}
              <input placeholder="Custom" value={custom}
                onChange={e => { setCustom(e.target.value); setAmount(null); }}
                style={{ width: 70, background: "#111", border: "1px solid #333", borderRadius: 6, color: C.white, fontFamily: C.fMon, fontSize: 11, padding: "7px 8px", outline: "none" }} />
            </div>
          </div>

          {/* Message */}
          <div>
            <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim, letterSpacing: 1, marginBottom: 6 }}>MESSAGE (optional)</div>
            <input maxLength={100} value={message} onChange={e => setMessage(e.target.value)}
              style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, color: C.white, fontFamily: C.fRaj, fontSize: 13, padding: "8px 12px", outline: "none" }}
              placeholder="Say something…" />
          </div>

          {/* Payment method */}
          <div>
            <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim, letterSpacing: 1, marginBottom: 8 }}>PAYMENT METHOD</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Card", "CashApp", "PayPal", "Venmo", "Zelle", "SeeGems"].map(m => (
                <button key={m} onClick={() => setMethod(m)} style={{
                  padding: "5px 10px", borderRadius: 6,
                  border: "1px solid " + (method === m ? C.gold : "#333"),
                  background: method === m ? "rgba(212,175,55,0.1)" : C.surface,
                  cursor: "pointer", fontFamily: C.fMon, fontSize: 11,
                  color: method === m ? C.gold : C.gray,
                }}>{m}</button>
              ))}
            </div>
          </div>

          {/* Split preview */}
          {finalAmount > 0 && (
            <div style={{ padding: "10px 12px", background: "rgba(212,175,55,0.06)", border: "1px solid " + C.gold + "33", borderRadius: 8, fontFamily: C.fMon, fontSize: 10, color: C.gray }}>
              Creator receives <span style={{ color: C.gold, fontWeight: 700 }}>${creatorGets}</span> (90%) · Platform fee ${(finalAmount * 0.1).toFixed(2)}
            </div>
          )}

          <button onClick={() => finalAmount > 0 && sendMutation.mutate()} disabled={finalAmount <= 0}
            style={{ width: "100%", padding: "14px", borderRadius: 8, border: "none", background: finalAmount > 0 ? "linear-gradient(135deg," + C.burgundy + "," + C.gold + ")" : "#333", color: finalAmount > 0 ? "#000" : C.dim, fontFamily: C.fBeb, fontSize: 18, cursor: finalAmount > 0 ? "pointer" : "not-allowed", letterSpacing: 2 }}>
            SEND TIP {finalAmount > 0 ? "$" + finalAmount.toFixed(2) : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// Subscribe button + tier picker
export function SubscribeButton({ creatorId, roomId, currentUser }) {
  var [open, setOpen] = useState(false);
  var [success, setSuccess] = useState(false);
  var { data: tiers = [] } = { data: [
    { id: "fan", name: "Fan", price_usd: 4.99, benefits: ["Badge", "Emotes", "Chat Color"] },
    { id: "supporter", name: "Supporter", price_usd: 9.99, benefits: ["All Fan", "VIP Chat", "PK Votes"] },
    { id: "vip", name: "VIP", price_usd: 24.99, benefits: ["All Supporter", "DM Host", "Exclusive content"] },
  ]};

  var subMutation = useMutation({
    mutationFn: (tier) => base44.entities.ViewerSubscription.create({
      viewer_id: currentUser?.id, creator_id: creatorId, room_id: roomId,
      tier_name: tier.name, price_usd: tier.price_usd, status: "active",
    }),
    onError: () => toast.error('Subscription failed. Please try again.'),
    onSuccess: () => { setSuccess(true); setTimeout(() => { setOpen(false); setSuccess(false); }, 2000); },
  });

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        padding: "8px 14px", background: "linear-gradient(135deg," + C.burgundy + "," + C.gold + "44)",
        border: "1px solid " + C.gold, borderRadius: 8, color: C.gold,
        fontFamily: C.fOrb, fontSize: 11, cursor: "pointer", letterSpacing: 1,
      }}>⭐ SUBSCRIBE</button>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9800, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end" }} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", background: C.card, borderRadius: "16px 16px 0 0", border: "1px solid " + C.burgundy, padding: "0 0 24px", animation: "slideUp .3s ease-out" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #2a2a2a" }}>
              <span style={{ fontFamily: C.fOrb, fontSize: 11, color: C.gold, letterSpacing: 2 }}>⭐ SUBSCRIBE</span>
            </div>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {success && <div style={{ textAlign: "center", fontFamily: C.fBeb, fontSize: 24, color: C.gold }}>✓ SUBSCRIBED!</div>}
              {!success && tiers.map(tier => (
                <div key={tier.id} onClick={() => subMutation.mutate(tier)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", borderRadius: 10,
                  border: "1px solid " + C.gold + "33", background: "rgba(212,175,55,0.05)",
                  cursor: "pointer",
                }}>
                  <div>
                    <div style={{ fontFamily: C.fBeb, fontSize: 18, color: C.gold }}>{tier.name}</div>
                    <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim }}>{tier.benefits.join(" · ")}</div>
                  </div>
                  <div style={{ fontFamily: C.fBeb, fontSize: 20, color: C.white }}>${tier.price_usd}<span style={{ fontSize: 10, color: C.dim }}>/mo</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
