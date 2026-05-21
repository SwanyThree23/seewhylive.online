import React, { useState } from 'react';

var CREATOR = 0.90;
var PLATFORM = 0.10;

var SUB_TIERS = [
  { id: 'bronze', name: 'Domino Fan',             price: 100,  color: '#cd7f32', icon: '🥉', perks: ['Chat badge', 'Emote pack', '7-day VOD'] },
  { id: 'silver', name: 'Tile Holder',            price: 500,  color: '#C0C0C0', icon: '🥈', perks: ['30-day VOD', 'Priority Q&A', 'Sub chat'] },
  { id: 'gold',   name: 'Washington Classic VIP', price: 1500, color: '#C9A84C', icon: '👑', perks: ['Monthly 1:1', 'Early access', 'DMs', 'Merch drops'] },
];

var SAAS_PLANS = [
  { id: 'free',  name: 'FREE',       price: 0,   color: '#7A6F90', panel: 5,  dests: 1 },
  { id: 'pro',   name: 'PRO',        price: 29,  color: '#00C9A7', panel: 10, dests: 3 },
  { id: 'elite', name: 'ELITE',      price: 99,  color: '#C9A84C', panel: 20, dests: 7 },
  { id: 'ent',   name: 'ENTERPRISE', price: 299, color: '#C084FC', panel: 99, dests: 99 },
];

var GIFTS_DATA = [
  { id: 'fire',    emoji: '🔥', name: 'Fire',     gems: 5,    usd: 0.05  },
  { id: 'rocket',  emoji: '🚀', name: 'Rocket',   gems: 10,   usd: 0.10  },
  { id: 'volt',    emoji: '⚡', name: 'Volt',     gems: 30,   usd: 0.30  },
  { id: 'crown',   emoji: '👑', name: 'Crown',    gems: 50,   usd: 0.50  },
  { id: 'mic',     emoji: '🎤', name: 'Mic Drop', gems: 100,  usd: 1.00  },
  { id: 'diamond', emoji: '💎', name: 'Diamond',  gems: 200,  usd: 2.00  },
  { id: 'domino',  emoji: '🎲', name: 'Full Set', gems: 500,  usd: 5.00  },
  { id: 'trophy',  emoji: '🏆', name: 'Trophy',   gems: 1000, usd: 10.00 },
];

function fmtC(c) { return '$' + (Math.floor(c || 0) / 100).toFixed(2); }
function money(n) { return '$' + (Math.floor((n || 0) * 100) / 100).toFixed(2); }

export default function MonetizeTab({ addToast }) {
  var [tab,         setTab]    = useState('tips');
  var [tipAmt,      setTipAmt] = useState('');
  var [currentPlan, setPlan]   = useState('elite');
  var [gemBal,      setGemBal] = useState(350);

  function sendTip() {
    var amt = parseFloat(tipAmt);
    if (!amt || amt < 0.50) { if (addToast) addToast('Minimum tip is $0.50', 'error'); return; }
    if (addToast) addToast('Tip sent! Creator: ' + money(amt * CREATOR), 'success');
    setTipAmt('');
  }

  function sendGift(g) {
    if (gemBal < g.gems) { if (addToast) addToast('Not enough gems', 'error'); return; }
    setGemBal(function(b) { return b - g.gems; });
    if (addToast) addToast(g.emoji + ' ' + g.name + ' sent!', 'success');
  }

  var tipNum = parseFloat(tipAmt);
  var tipValid = !isNaN(tipNum) && tipNum >= 0.50;

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'rgba(7,5,10,.8)', borderRadius: 10, padding: 4 }}>
        {[['tips', '💰 TIPS'], ['gems', '💎 GEMS'], ['subs', '⭐ SUBS'], ['plans', '📦 PLANS']].map(function(t) {
          var active = tab === t[0];
          return (
            <button
              key={t[0]}
              onClick={function() { setTab(t[0]); }}
              style={{ flex: 1, padding: '6px 0', background: active ? 'rgba(128,0,32,.35)' : 'transparent', border: 'none', borderRadius: 7, color: active ? '#C9A84C' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {/* TIPS tab */}
      {tab === 'tips' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {['1', '5', '10', '25', '50', '100'].map(function(a) {
              return (
                <button
                  key={a}
                  onClick={function() { setTipAmt(a); }}
                  style={{ background: tipAmt === a ? 'rgba(201,168,76,.25)' : 'rgba(22,16,32,.8)', border: '1px solid ' + (tipAmt === a ? '#C9A84C' : '#241C34'), borderRadius: 6, padding: '6px 12px', color: tipAmt === a ? '#C9A84C' : '#7A6F90', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>
                  ${a}
                </button>
              );
            })}
          </div>
          <input
            value={tipAmt}
            onChange={function(e) { setTipAmt(e.target.value); }}
            placeholder="Custom amount..."
            type="number"
            style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
          />
          {tipValid && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: 'rgba(201,168,76,.1)', border: '1px solid #C9A84C33', borderRadius: 6, padding: '5px 10px' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#C9A84C' }}>Creator: {money(tipNum * CREATOR)}</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,.3)', border: '1px solid #241C34', borderRadius: 6, padding: '5px 10px' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#7A6F90' }}>Platform: {money(tipNum * PLATFORM)}</span>
              </div>
            </div>
          )}
          <button
            onClick={sendTip}
            disabled={!tipValid}
            style={{ padding: '11px', background: tipValid ? 'linear-gradient(135deg,#C9A84C,#E8C46A)' : 'rgba(201,168,76,.1)', border: 'none', borderRadius: 8, color: tipValid ? '#07050A' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: tipValid ? 'pointer' : 'not-allowed' }}>
            SEND TIP{tipAmt ? ' — $' + tipAmt : ''}
          </button>
        </div>
      )}

      {/* GEMS tab */}
      {tab === 'gems' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 2 }}>YOUR BALANCE</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C' }}>{gemBal} 💎</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {GIFTS_DATA.map(function(g) {
              var ok = gemBal >= g.gems;
              return (
                <button
                  key={g.id}
                  onClick={function() { sendGift(g); }}
                  disabled={!ok}
                  style={{ background: ok ? 'rgba(22,16,32,.8)' : 'rgba(7,5,10,.6)', border: '1px solid ' + (ok ? '#241C34' : '#0a0a0a'), borderRadius: 8, padding: '8px 4px', cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 20 }}>{g.emoji}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C' }}>💎{g.gems}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#7A6F90' }}>${g.usd.toFixed(2)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBS tab */}
      {tab === 'subs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SUB_TIERS.map(function(tier) {
            return (
              <div key={tier.id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + tier.color + '33', borderRadius: 10, padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{tier.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: tier.color }}>{tier.name}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>
                      {fmtC(tier.price)}/mo · creator: {fmtC(Math.floor(tier.price * CREATOR))}
                    </div>
                  </div>
                  <button
                    onClick={function() { if (addToast) addToast('Subscribed: ' + tier.name, 'success'); }}
                    style={{ background: 'rgba(0,201,167,.12)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 7, padding: '6px 12px', color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                    SUBSCRIBE
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {tier.perks.map(function(pk) {
                    return (
                      <span key={pk} style={{ background: tier.color + '18', border: '1px solid ' + tier.color + '44', borderRadius: 999, padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: tier.color }}>
                        ✓ {pk}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PLANS tab */}
      {tab === 'plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SAAS_PLANS.map(function(plan) {
            var isActive = currentPlan === plan.id;
            return (
              <div key={plan.id} style={{ background: 'rgba(22,16,32,.8)', border: '2px solid ' + (isActive ? plan.color : plan.color + '22'), borderRadius: 10, padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: isActive ? plan.color : '#EDE8F5', letterSpacing: 2 }}>{plan.name}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>
                      {plan.price === 0 ? 'FREE' : '$' + plan.price + '/mo'} · {plan.panel} panelists · {plan.dests === 99 ? 'unlimited' : plan.dests} dests
                    </div>
                  </div>
                  <button
                    onClick={function() { setPlan(plan.id); if (addToast) addToast(plan.name + ' activated!', 'success'); }}
                    style={{ background: isActive ? plan.color + '22' : 'none', border: '1px solid ' + (isActive ? plan.color : '#C9A84C55'), borderRadius: 7, padding: '6px 12px', color: isActive ? plan.color : '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                    {isActive ? '✓ ACTIVE' : 'SELECT'}
                  </button>
                </div>
                {isActive && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: '90%', background: 'linear-gradient(90deg,#800020,#C9A84C)' }} />
                      <div style={{ flex: 1, background: '#241C34' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C' }}>CREATOR 90%</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>PLATFORM 10%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
