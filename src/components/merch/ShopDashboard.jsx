import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

var C = {
  bg: "#0D0D0D", card: "#1A1A1A", surface: "#161616",
  burgundy: "#800020", gold: "#D4AF37", volt: "#D4AF37",
  white: "#FFF", gray: "#888", dim: "#444", green: "#30D158", red: "#FF3B30",
  fOrb: "'Orbitron',sans-serif", fRaj: "'Rajdhani',sans-serif",
  fMon: "'Share Tech Mono',monospace", fBeb: "'Bebas Neue',cursive",
};

var STATUS_COLORS = { pending: C.gold, confirmed: "#00E5FF", shipped: C.volt, delivered: C.green, cancelled: C.red, refunded: C.gray };

export default function ShopDashboard({ creatorId }) {
  var [view, setView] = useState("items"); // items | orders
  var [showAdd, setShowAdd] = useState(false);
  var [newItem, setNewItem] = useState({ name: "", price_usd: "", description: "", sizes_available: [] });
  var qc = useQueryClient();

  var { data: items = [] } = useQuery({
    queryKey: ["shop-items", creatorId],
    queryFn: () => base44.entities.MerchandiseItem.filter({ creator_id: creatorId }),
    enabled: !!creatorId,
  });

  var { data: orders = [] } = useQuery({
    queryKey: ["merch-orders", creatorId],
    queryFn: () => base44.entities.MerchandiseOrder.filter({ creator_id: creatorId }, "-created_date", 50),
    enabled: !!creatorId,
  });

  var addMutation = useMutation({
    mutationFn: () => base44.entities.MerchandiseItem.create({
      ...newItem, creator_id: creatorId,
      price_usd: parseFloat(newItem.price_usd) || 0,
      is_active: true, times_sold: 0,
    }),
    onSuccess: () => { qc.invalidateQueries(["shop-items", creatorId]); setShowAdd(false); setNewItem({ name: "", price_usd: "", description: "", sizes_available: [] }); },
  });

  var toggleMutation = useMutation({
    mutationFn: ({ id, field, val }) => base44.entities.MerchandiseItem.update(id, { [field]: val }),
    onSuccess: () => qc.invalidateQueries(["shop-items", creatorId]),
  });

  var updateOrderMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.MerchandiseOrder.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(["merch-orders", creatorId]),
  });

  var totalSold = items.reduce((s, i) => s + (i.times_sold || 0), 0);
  var totalRevenue = orders.filter(o => o.status !== "cancelled" && o.status !== "refunded").reduce((s, o) => s + (o.creator_payout || 0), 0);

  return (
    <div style={{ background: C.bg, minHeight: 300 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, padding: "12px 0 8px" }}>
        {[
          { label: "ITEMS", value: items.length, color: "#00E5FF" },
          { label: "SOLD", value: totalSold, color: C.volt },
          { label: "REVENUE", value: "$" + totalRevenue.toFixed(0), color: C.gold },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, borderRadius: 8, padding: "10px", textAlign: "center", border: "1px solid #2a2a2a" }}>
            <div style={{ fontFamily: C.fBeb, fontSize: 22, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim, letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #2a2a2a", marginBottom: 12 }}>
        {["items", "orders"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "8px", background: "none", border: "none", borderBottom: "2px solid " + (view === v ? C.gold : "transparent"), cursor: "pointer", fontFamily: C.fMon, fontSize: 11, letterSpacing: 1, color: view === v ? C.gold : C.gray }}>{v.toUpperCase()}</button>
        ))}
      </div>

      {view === "items" && (
        <div>
          <button onClick={() => setShowAdd(true)} style={{ width: "100%", padding: "10px", background: "rgba(128,0,32,0.3)", border: "1px dashed " + C.burgundy, borderRadius: 8, color: C.gold, fontFamily: C.fMon, fontSize: 10, cursor: "pointer", marginBottom: 10 }}>+ ADD ITEM</button>

          {showAdd && (
            <div style={{ background: C.card, border: "1px solid " + C.burgundy, borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontFamily: C.fOrb, fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 12 }}>NEW ITEM</div>
              {[{ key: "name", label: "Name", ph: "Item name" }, { key: "price_usd", label: "Price (USD)", ph: "9.99" }, { key: "description", label: "Description", ph: "Optional" }].map(f => (
                <div key={f.key} style={{ marginBottom: 8 }}>
                  <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim, letterSpacing: 1, marginBottom: 4 }}>{f.label}</div>
                  <input value={newItem[f.key]} onChange={e => setNewItem(n => ({ ...n, [f.key]: e.target.value }))}
                    style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, color: C.white, fontFamily: C.fRaj, fontSize: 13, padding: "7px 10px", outline: "none" }}
                    placeholder={f.ph} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "8px", borderRadius: 6, border: "1px solid #333", background: C.surface, color: C.gray, cursor: "pointer", fontFamily: C.fMon, fontSize: 11 }}>CANCEL</button>
                <button onClick={() => addMutation.mutate()} style={{ flex: 1, padding: "8px", borderRadius: 6, border: "none", background: C.burgundy, color: C.gold, cursor: "pointer", fontFamily: C.fMon, fontSize: 11 }}>CREATE</button>
              </div>
            </div>
          )}

          {items.map(item => (
            <div key={item.id} style={{ background: C.card, border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: C.fRaj, fontSize: 13, fontWeight: 700, color: C.white }}>{item.name}</div>
                <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.gold }}>${item.price_usd}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button onClick={() => toggleMutation.mutate({ id: item.id, field: "is_live_exclusive", val: !item.is_live_exclusive })}
                  style={{ padding: "3px 7px", borderRadius: 4, border: "1px solid " + (item.is_live_exclusive ? C.gold : "#333"), background: "none", cursor: "pointer", fontFamily: C.fMon, fontSize: 7, color: item.is_live_exclusive ? C.gold : C.gray }}>LIVE</button>
                <button onClick={() => toggleMutation.mutate({ id: item.id, field: "is_active", val: !item.is_active })}
                  style={{ padding: "3px 7px", borderRadius: 4, border: "1px solid " + (item.is_active ? C.green : "#333"), background: "none", cursor: "pointer", fontFamily: C.fMon, fontSize: 7, color: item.is_active ? C.green : C.gray }}>{item.is_active ? "ON" : "OFF"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "orders" && (
        <div>
          {orders.length === 0 && <div style={{ textAlign: "center", color: C.dim, fontFamily: C.fMon, fontSize: 10, padding: 20 }}>No orders yet</div>}
          {orders.map(order => (
            <div key={order.id} style={{ background: C.card, border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div>
                  <div style={{ fontFamily: C.fRaj, fontSize: 13, fontWeight: 700, color: C.white }}>{order.item_name}</div>
                  <div style={{ fontFamily: C.fMon, fontSize: 11, color: C.dim }}>{order.buyer_name} {order.size ? "· " + order.size : ""}</div>
                </div>
                <div style={{ fontFamily: C.fBeb, fontSize: 16, color: C.gold }}>${order.total_usd}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ padding: "2px 8px", borderRadius: 10, fontFamily: C.fMon, fontSize: 11, background: (STATUS_COLORS[order.status] || C.gray) + "22", border: "1px solid " + (STATUS_COLORS[order.status] || C.gray) + "66", color: STATUS_COLORS[order.status] || C.gray }}>{order.status}</span>
                {order.ordered_during_stream && <span style={{ fontFamily: C.fMon, fontSize: 7, background: C.burgundy, color: C.gold, padding: "2px 6px", borderRadius: 4 }}>LIVE ORDER</span>}
                <select value={order.status} onChange={e => updateOrderMutation.mutate({ id: order.id, status: e.target.value })}
                  style={{ marginLeft: "auto", background: "#111", border: "1px solid #333", color: C.white, borderRadius: 4, padding: "2px 6px", fontFamily: C.fMon, fontSize: 11, cursor: "pointer" }}>
                  {["pending", "confirmed", "shipped", "delivered", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}