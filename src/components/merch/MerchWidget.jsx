import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

var C = {
  bg: "#0D0D0D", card: "#1A1A1A", surface: "#161616",
  burgundy: "#800020", gold: "#D4AF37", volt: "#D4AF37",
  white: "#FFF", gray: "#888", dim: "#444", green: "#30D158",
  fOrb: "'Orbitron',sans-serif", fRaj: "'Rajdhani',sans-serif",
  fMon: "'Share Tech Mono',monospace", fBeb: "'Bebas Neue',cursive",
};

// Merch strip shown in-room
export function MerchStrip({ roomId, currentUser, hostId }) {
  var [selected, setSelected] = useState(null);

  var { data: items = [] } = useQuery({
    queryKey: ["merch-items", hostId],
    queryFn: () => base44.entities.MerchandiseItem.filter({ creator_id: hostId, is_active: true }),
    enabled: !!hostId,
  });

  if (items.length === 0) return null;

  return (
    <>
      <div style={{ background: C.card, borderTop: "1px solid " + C.gold + "44", borderBottom: "1px solid #2a2a2a", padding: "8px 0" }}>
        <div style={{ fontFamily: C.fOrb, fontSize: 11, color: C.gold, letterSpacing: 2, padding: "0 12px 6px" }}>📦 LIVE SHOP</div>
        <div style={{ display: "flex", overflowX: "auto", gap: 10, padding: "0 12px" }}>
          {items.map(item => (
            <div key={item.id} onClick={() => setSelected(item)} style={{
              flexShrink: 0, width: 100, borderRadius: 8, overflow: "hidden",
              border: "1px solid " + (item.is_live_exclusive ? C.gold + "66" : "#2a2a2a"),
              background: C.surface, cursor: "pointer",
            }}>
              {/* Image / gradient placeholder */}
              <div style={{ height: 70, background: item.image_url ? `url(${item.image_url}) center/cover` : "linear-gradient(135deg," + C.burgundy + "44,#1a1a2a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                {!item.image_url && "👕"}
              </div>
              <div style={{ padding: "6px 7px" }}>
                <div style={{ fontFamily: C.fRaj, fontSize: 11, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                <div style={{ fontFamily: C.fBeb, fontSize: 14, color: C.gold }}>${item.price_usd}</div>
                <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
                  {item.is_live_exclusive && <span style={{ fontFamily: C.fMon, fontSize: 6, background: C.burgundy, color: C.gold, padding: "1px 4px", borderRadius: 3 }}>LIVE</span>}
                  {item.stock != null && item.stock < 10 && <span style={{ fontFamily: C.fMon, fontSize: 6, background: "#FF9500", color: "#000", padding: "1px 4px", borderRadius: 3 }}>LOW</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <ProductSheet item={selected} roomId={roomId} currentUser={currentUser} hostId={hostId} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

function ProductSheet({ item, roomId, currentUser, hostId, onClose }) {
  var [size, setSize] = useState("");
  var [qty, setQty] = useState(1);
  var [success, setSuccess] = useState(false);
  var qc = useQueryClient();

  var total = item.price_usd * qty;
  var creatorGets = (total * 0.9).toFixed(2);

  var orderMutation = useMutation({
    mutationFn: () => base44.entities.MerchandiseOrder.create({
      buyer_id: currentUser?.id, buyer_name: currentUser?.full_name || "Viewer",
      creator_id: hostId, item_id: item.id, item_name: item.name,
      size, quantity: qty, total_usd: total,
      creator_payout: total * 0.9, platform_cut: total * 0.1,
      room_id: roomId, status: "pending",
    }),
    onSuccess: () => { setSuccess(true); qc.invalidateQueries(["merch-orders"]); },
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9700, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", background: C.card, borderRadius: "16px 16px 0 0", border: "1px solid " + C.burgundy, padding: "0 0 28px", animation: "slideUp .3s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #2a2a2a" }}>
          <span style={{ fontFamily: C.fOrb, fontSize: 11, color: C.gold, letterSpacing: 2 }}>📦 {item.name}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.gray, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        {success ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: C.fBeb, fontSize: 26, color: C.gold }}>ORDER PLACED!</div>
            <div style={{ fontFamily: C.fMon, fontSize: 10, color: C.gray, marginTop: 8 }}>Your order is pending confirmation</div>
            <button onClick={onClose} style={{ marginTop: 20, padding: "10px 24px", background: C.burgundy, border: "1px solid " + C.gold, borderRadius: 8, color: C.gold, fontFamily: C.fMon, fontSize: 11, cursor: "pointer" }}>CLOSE</button>
          </div>
        ) : (
          <div style={{ padding: "16px" }}>
            {/* Product image */}
            <div style={{ height: 140, borderRadius: 10, background: item.image_url ? `url(${item.image_url}) center/cover` : "linear-gradient(135deg," + C.burgundy + "44,#1a1a2a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, marginBottom: 14 }}>
              {!item.image_url && "👕"}
            </div>
            <div style={{ fontFamily: C.fBeb, fontSize: 22, color: C.white, marginBottom: 4 }}>{item.name}</div>
            {item.description && <div style={{ fontFamily: C.fRaj, fontSize: 12, color: C.gray, marginBottom: 12 }}>{item.description}</div>}
            <div style={{ fontFamily: C.fBeb, fontSize: 28, color: C.gold, marginBottom: 14 }}>${item.price_usd}</div>

            {/* Sizes */}
            {item.sizes_available?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim, letterSpacing: 1, marginBottom: 6 }}>SIZE</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {item.sizes_available.map(s => (
                    <button key={s} onClick={() => setSize(s)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid " + (size === s ? C.gold : "#333"), background: size === s ? "rgba(212,175,55,0.1)" : C.surface, cursor: "pointer", fontFamily: C.fMon, fontSize: 10, color: size === s ? C.gold : C.gray }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim, letterSpacing: 1 }}>QTY</span>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #333", background: C.surface, color: C.white, cursor: "pointer" }}>−</button>
              <span style={{ fontFamily: C.fBeb, fontSize: 20, color: C.white, minWidth: 24, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #333", background: C.surface, color: C.white, cursor: "pointer" }}>+</button>
            </div>

            {/* Split note */}
            <div style={{ padding: "8px 12px", background: "rgba(212,175,55,0.06)", border: "1px solid " + C.gold + "33", borderRadius: 8, fontFamily: C.fMon, fontSize: 11, color: C.dim, marginBottom: 14 }}>
              Creator receives <span style={{ color: C.gold }}>${creatorGets}</span> (90%) · Total: <span style={{ color: C.white }}>${total.toFixed(2)}</span>
            </div>

            <button onClick={() => orderMutation.mutate()} style={{ width: "100%", padding: "14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg," + C.burgundy + "," + C.gold + ")", color: "#000", fontFamily: C.fBeb, fontSize: 20, cursor: "pointer", letterSpacing: 2 }}>
              BUY NOW
            </button>
          </div>
        )}
      </div>
    </div>
  );
}