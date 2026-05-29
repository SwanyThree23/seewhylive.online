import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

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

var PPV_PRESETS = [
  { label: 'MATCH DAY',       price: 500,  icon: '🎲' },
  { label: 'FINALS NIGHT',    price: 1000, icon: '🏆' },
  { label: 'FADES BATTLE',    price: 250,  icon: '⚡' },
  { label: 'WORKSHOP',        price: 750,  icon: '🎓' },
];

var VIEWER_TIERS = [
  { id: 'fan',         label: 'FAN',         amountCents: 500,  color: '#7A6F90', perks: ['Ad-free chat', 'Fan badge', 'Exclusive emotes'] },
  { id: 'supporter',   label: 'SUPPORTER',   amountCents: 1000, color: '#00C9A7', perks: ['All Fan perks', 'Exclusive streams', 'Supporter badge'] },
  { id: 'ride_or_die', label: 'RIDE OR DIE', amountCents: 2000, color: '#C9A84C', perks: ['All perks', 'Direct DMs', 'Monthly shoutout', 'RoD badge'] },
];

function fmtC(c) { return '$' + (Math.floor(c || 0) / 100).toFixed(2); }
function money(n) { return '$' + (Math.floor((n || 0) * 100) / 100).toFixed(2); }

export default function MonetizeTab({ addToast, isLive, socket, roomId, username }) {
  var [tab,            setTab]           = useState('tips');
  var [tipAmt,         setTipAmt]        = useState('');
  var [currentPlan,    setPlan]          = useState('elite');
  var [gemBal,         setGemBal]        = useState(350);
  var [ppvTitle,       setPpvTitle]      = useState('');
  var [ppvPrice,       setPpvPrice]      = useState('500');
  var [ppvDuration,    setPpvDur]        = useState('120');
  var [ppvActive,      setPpvActive]     = useState(null);
  var [ppvCountdown,   setPpvCd]         = useState(0);
  var [projViewers,    setProjV]         = useState('500');
  var [sessionRevCents,setSessionRevCents] = useState(0);
  var [sessionEvents,  setSessionEvents]   = useState([]);
  var [leaderboard,    setLeaderboard]     = useState([
    { rank: 1, name: 'DominoKing_DC',   giftCents: 12450, gems: 1245, badge: '💎', streak: 7  },
    { rank: 2, name: 'WashClassic2026', giftCents: 8900,  gems: 890,  badge: '👑', streak: 4  },
    { rank: 3, name: 'VibeNBones',      giftCents: 6200,  gems: 620,  badge: '🔥', streak: 12 },
    { rank: 4, name: 'TileHolderPRO',   giftCents: 4100,  gems: 410,  badge: '⭐', streak: 2  },
    { rank: 5, name: 'SwanyFan23',      giftCents: 2800,  gems: 280,  badge: '🎯', streak: 5  },
    { rank: 6, name: 'CaliBonesGrind',  giftCents: 1950,  gems: 195,  badge: '🎲', streak: 1  },
    { rank: 7, name: 'DCDominoDaily',   giftCents: 1200,  gems: 120,  badge: '🥉', streak: 3  },
  ]);
  var cdRef = useRef(null);

  var [stripeStatus,   setStripeStatus]   = useState('unchecked');
  var [stripeChecking, setStripeChecking] = useState(false);
  var [availableCents, setAvailableCents] = useState(0);
  var [payoutLoading,  setPayoutLoading]  = useState(false);

  useEffect(function() {
    setStripeChecking(true);
    fetch('/api/creator/onboard/status')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        setStripeStatus(data.connected ? 'connected' : 'unconnected');
        setStripeChecking(false);
      })
      .catch(function() { setStripeStatus('unconnected'); setStripeChecking(false); });
  }, []);

  function connectStripe() {
    fetch('/api/creator/onboard/link')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.url) {
          window.open(data.url, '_blank', 'noopener');
        }
      })
      .catch(function() { addToast('Failed to get Stripe link', 'error'); });
  }

  function requestPayout() {
    if (Math.floor(availableCents) < 1000) {
      addToast('Minimum payout is $10.00', 'error');
      return;
    }
    if (stripeStatus !== 'connected') {
      addToast('Connect Stripe before requesting a payout', 'error');
      return;
    }
    setPayoutLoading(true);
    fetch('/api/payments/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents: Math.floor(availableCents) })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        addToast('Payout of $' + (Math.floor(availableCents) / 100).toFixed(2) + ' initiated!', 'success');
        setAvailableCents(0);
      } else {
        addToast(data.error || 'Payout failed', 'error');
      }
      setPayoutLoading(false);
    })
    .catch(function() { setPayoutLoading(false); addToast('Payout request failed', 'error'); });
  }

  useEffect(function() {
    return function() { if (cdRef.current) clearInterval(cdRef.current); };
  }, []);

  useEffect(function() {
    if (!isLive) { return; }
    var types = ['tip', 'gem_gift', 'subscription', 'ppv'];
    var ticker = setInterval(function() {
      var type = types[Math.floor(Math.random() * types.length)];
      var amountCents = Math.floor(50 + Math.random() * 2000);
      var creatorCents = Math.floor(amountCents * CREATOR);
      var ev = { type: type, amountCents: amountCents, creatorCents: creatorCents, ts: Date.now() };
      setSessionEvents(function(prev) {
        var next = prev.concat([ev]);
        return next.slice(-8);
      });
      setSessionRevCents(function(prev) { return prev + amountCents; });
    }, 5000);
    return function() { clearInterval(ticker); };
  }, [isLive]);

  useEffect(function() {
    function fetchLeaderboard() {
      fetch('/api/leaderboard' + (roomId ? '?roomId=' + encodeURIComponent(roomId) : ''))
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (!data || !Array.isArray(data.leaderboard) || data.leaderboard.length === 0) return;
          var BADGES = ['💎', '👑', '🔥', '⭐', '🎯', '🎲', '🥉'];
          setLeaderboard(data.leaderboard.map(function(r, i) {
            return {
              rank:      i + 1,
              name:      r.from_user || 'Anonymous',
              giftCents: Math.floor(r.total_cents),
              gems:      Math.floor(r.total_cents / 10),
              badge:     BADGES[i] || '🎁',
              streak:    r.gift_count || 0,
              fromApi:   true
            };
          }));
        })
        .catch(function() {});
    }
    fetchLeaderboard();
    var t = setInterval(fetchLeaderboard, 30000);
    return function() { clearInterval(t); };
  }, [roomId]);

  function launchPPV() {
    if (!ppvTitle.trim()) { if (addToast) addToast('Enter event title', 'error'); return; }
    var priceCents = Math.floor(parseFloat(ppvPrice) * 100) || 500;
    var durSec = Math.floor(parseFloat(ppvDuration) * 60) || 7200;
    var code = 'SW-' + Math.floor(Math.random() * 900000 + 100000);
    setPpvActive({ title: ppvTitle, price: priceCents, code: code });
    setPpvCd(durSec);
    if (cdRef.current) clearInterval(cdRef.current);
    cdRef.current = setInterval(function() {
      setPpvCd(function(n) {
        if (n <= 1) { clearInterval(cdRef.current); cdRef.current = null; setPpvActive(null); return 0; }
        return n - 1;
      });
    }, 1000);
    if (addToast) addToast('💰 PPV launched: ' + ppvTitle + ' @ ' + fmtC(priceCents), 'success');
  }

  function endPPV() {
    if (cdRef.current) clearInterval(cdRef.current);
    setPpvActive(null);
    setPpvCd(0);
    if (addToast) addToast('PPV event ended', 'info');
  }

  function fmtCd(s) {
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function sendTip() {
    var amt = parseFloat(tipAmt);
    if (!amt || amt < 0.50) { if (addToast) addToast('Minimum tip is $0.50', 'error'); return; }
    var cents = Math.floor(amt * 100);
    if (socket && roomId) {
      socket.emit('send-gift', { roomId: roomId, fromUser: username || 'Anonymous', emoji: '💰', name: 'Tip', valueCents: cents });
    }
    if (addToast) addToast('💰 Tip sent! Creator receives: ' + money(amt * CREATOR), 'success');
    setTipAmt('');
  }

  function sendGift(g) {
    if (gemBal < g.gems) { if (addToast) addToast('Not enough gems', 'error'); return; }
    setGemBal(function(b) { return b - g.gems; });
    var cents = Math.floor(g.usd * 100);
    if (socket && roomId) {
      socket.emit('send-gift', { roomId: roomId, fromUser: username || 'Anonymous', emoji: g.emoji, name: g.name, valueCents: cents });
    }
    if (addToast) addToast(g.emoji + ' ' + g.name + ' sent!', 'success');
  }

  var tipNum = parseFloat(tipAmt);
  var tipValid = !isNaN(tipNum) && tipNum >= 0.50;

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* Stripe status card */}
      {stripeStatus === 'unconnected' && (
        <div style={{ background: 'rgba(201,168,76,.07)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', marginBottom: 4 }}>⚡ CONNECT STRIPE</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 10 }}>
            Connect your Stripe account to receive tips, subscriptions, and payouts
          </div>
          <button
            onClick={connectStripe}
            style={{ background: 'rgba(201,168,76,.18)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 7, padding: '6px 14px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
            CONNECT STRIPE
          </button>
        </div>
      )}
      {stripeStatus === 'connected' && (
        <div style={{ background: 'rgba(0,201,167,.07)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#00C9A7', marginBottom: 3 }}>✅ STRIPE CONNECTED</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>Ready to receive all payments</div>
        </div>
      )}

      {/* Payout card */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 4 }}>CREATOR BALANCE</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, color: '#C9A84C', lineHeight: 1, marginBottom: 10 }}>
          {'$' + (Math.floor(availableCents) / 100).toFixed(2)}
        </div>
        <button
          onClick={requestPayout}
          disabled={payoutLoading || availableCents < 1000 || stripeStatus !== 'connected'}
          style={{ width: '100%', padding: '10px', background: (payoutLoading || availableCents < 1000 || stripeStatus !== 'connected') ? 'rgba(201,168,76,.1)' : 'linear-gradient(135deg,#C9A84C,#E8C46A)', border: 'none', borderRadius: 8, color: (payoutLoading || availableCents < 1000 || stripeStatus !== 'connected') ? '#7A6F90' : '#07050A', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: (payoutLoading || availableCents < 1000 || stripeStatus !== 'connected') ? 'not-allowed' : 'pointer', marginBottom: 8 }}>
          {payoutLoading ? 'PROCESSING...' : 'REQUEST PAYOUT'}
        </button>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', textAlign: 'center' }}>
          $10.00 minimum · 90% creator / 10% platform
        </div>
      </div>

      {isLive && (
        <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.12),rgba(128,0,32,.12))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A84C', boxShadow: '0 0 8px #C9A84C' }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2 }}>SESSION REVENUE</span>
            </div>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#E8C46A' }}>{'$' + (Math.floor(sessionRevCents) / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(201,168,76,.08)', borderRadius: 6, padding: '5px 0' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#E8C46A' }}>{'$' + (Math.floor(sessionRevCents * CREATOR) / 100).toFixed(2)}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>YOUR 90%</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(128,0,32,.08)', borderRadius: 6, padding: '5px 0' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#C01838' }}>{'$' + (Math.floor(sessionRevCents * PLATFORM) / 100).toFixed(2)}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>PLATFORM 10%</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(22,16,32,.6)', borderRadius: 6, padding: '5px 0' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#EDE8F5' }}>{sessionEvents.length}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>EVENTS</div>
            </div>
          </div>
          {sessionEvents.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sessionEvents.slice(-3).reverse().map(function(ev, i) {
                var typeEmoji = ev.type === 'tip' ? '💰' : ev.type === 'gem_gift' ? '💎' : ev.type === 'subscription' ? '⭐' : '🔑';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', background: 'rgba(7,5,10,.5)', borderRadius: 4 }}>
                    <span style={{ fontSize: 10 }}>{typeEmoji}</span>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: '#A89CC8', flex: 1 }}>{ev.type.replace('_', ' ').toUpperCase()}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C' }}>{'$' + (Math.floor(ev.amountCents) / 100).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'rgba(7,5,10,.8)', borderRadius: 10, padding: 4 }}>
        {[['tips', '💰 TIPS'], ['gems', '💎 GEMS'], ['subs', '⭐ SUBS'], ['plans', '📦 PLANS'], ['stage', '🎭 STAGE'], ['leaders', '🏆 LEADERS']].map(function(t) {
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
                  {'$' + a}
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
            {'SEND TIP' + (tipAmt ? ' — $' + tipAmt : '')}
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
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C' }}>{'💎' + g.gems}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#7A6F90' }}>{'$' + g.usd.toFixed(2)}</span>
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
                      {fmtC(tier.price) + '/mo · creator: ' + fmtC(Math.floor(tier.price * CREATOR))}
                    </div>
                  </div>
                  <button
                    onClick={function() {
                      if (socket && roomId) {
                        socket.emit('subscribe', { roomId: roomId, username: username || 'Anonymous', tier: tier.id, price_cents: tier.price });
                      }
                      if (addToast) addToast('⭐ Subscribed: ' + tier.name, 'success');
                    }}
                    style={{ background: 'rgba(0,201,167,.12)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 7, padding: '6px 12px', color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                    SUBSCRIBE
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {tier.perks.map(function(pk) {
                    return (
                      <span key={pk} style={{ background: tier.color + '18', border: '1px solid ' + tier.color + '44', borderRadius: 999, padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: tier.color }}>
                        {'✓ ' + pk}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Viewer subscription tiers */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#C9A84C', letterSpacing: 3, marginBottom: 8 }}>⭐ YOUR VIEWER TIERS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {VIEWER_TIERS.map(function(tier) {
                return (
                  <div key={tier.id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: 0, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: 4, background: tier.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: tier.color, lineHeight: 1 }}>{tier.label}</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#7A6F90' }}>{'$' + (Math.floor(tier.amountCents) / 100).toFixed(2) + '/mo'}</div>
                        </div>
                        <button
                          onClick={function() {
                            fetch('/api/payments/subscribe', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ tier: tier.id, amountCents: tier.amountCents })
                            })
                            .then(function(r) { return r.json(); })
                            .catch(function() { return {}; });
                            if (addToast) addToast('Subscription to ' + tier.label + ' initiated!', 'success');
                          }}
                          style={{ background: 'transparent', border: '1px solid ' + tier.color, borderRadius: 6, padding: '5px 10px', color: tier.color, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
                          SUBSCRIBE
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {tier.perks.map(function(perk) {
                          return (
                            <div key={perk} style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>
                              <span style={{ color: tier.color }}>{'✓ '}</span>{perk}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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

      {/* LEADERS tab */}
      {tab === 'leaders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#C9A84C', letterSpacing: 2 }}>LIVE GIFT LEADERS</span>
              {isLive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A84C', boxShadow: '0 0 8px #C9A84C' }} />
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 2 }}>UPDATING LIVE</span>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1 }}>TOTAL GIFTED</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#E8C46A' }}>
                {(function() {
                  var total = 0;
                  for (var i = 0; i < leaderboard.length; i++) { total += leaderboard[i].giftCents; }
                  return '$' + (Math.floor(total) / 100).toFixed(2);
                })()}
              </div>
            </div>
          </div>

          {/* Leaderboard cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {leaderboard.map(function(entry) {
              var rankColor = entry.rank === 1 ? '#C9A84C' : entry.rank === 2 ? '#C0C0C0' : entry.rank === 3 ? '#cd7f32' : '#7A6F90';
              var cardBg = entry.rank === 1
                ? 'rgba(201,168,76,.12)'
                : entry.rank === 2
                ? 'rgba(192,192,192,.08)'
                : entry.rank === 3
                ? 'rgba(205,127,50,.08)'
                : 'rgba(22,16,32,.8)';
              var cardBorder = entry.rank === 1
                ? 'rgba(201,168,76,.35)'
                : entry.rank === 2
                ? 'rgba(192,192,192,.2)'
                : entry.rank === 3
                ? 'rgba(205,127,50,.2)'
                : 'rgba(255,255,255,.07)';
              var shadow = entry.rank === 1 ? '0 0 12px rgba(201,168,76,.3)' : 'none';
              return (
                <div
                  key={entry.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: cardBg,
                    border: '1px solid ' + cardBorder,
                    borderRadius: 10,
                    padding: '10px 12px',
                    boxShadow: shadow
                  }}
                >
                  {/* Rank + portrait */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <AvatarPortrait username={entry.name} size={entry.rank <= 3 ? 40 : 32} rank={entry.rank <= 3 ? entry.rank : undefined} />
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 10, color: rankColor, lineHeight: 1 }}>
                      #{entry.rank}
                    </span>
                  </div>
                  {/* Name + streak */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#EDE8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.badge + ' ' + entry.name}
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginTop: 2 }}>
                      {'🔥 x' + entry.streak + ' streak'}
                    </div>
                  </div>
                  {/* Gems + dollar value */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#C9A84C' }}>{'💎' + entry.gems}</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: rankColor, lineHeight: 1.1 }}>
                      {'$' + (Math.floor(entry.giftCents) / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gift CTA */}
          <button
            onClick={function() { setTab('gems'); }}
            style={{ padding: '12px', background: 'linear-gradient(135deg,#C9A84C,#E8C46A)', border: 'none', borderRadius: 8, color: '#07050A', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: 1 }}>
            🎁 GIFT NOW
          </button>
        </div>
      )}

      {/* STAGE tab */}
      {tab === 'stage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Active PPV banner */}
          {ppvActive && (
            <div style={{ background: 'rgba(255,26,60,.1)', border: '2px solid rgba(255,26,60,.4)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 8px #FF1A3C' }} />
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#FF6B81', letterSpacing: 2 }}>PPV LIVE</span>
                </div>
                <button onClick={endPPV} style={{ background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.35)', borderRadius: 6, padding: '3px 10px', color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>END</button>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#EDE8F5', marginBottom: 4 }}>{ppvActive.title}</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90' }}>CODE: <span style={{ color: '#C9A84C', letterSpacing: 2 }}>{ppvActive.code}</span></span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#C8FF00', flex: 1, textAlign: 'right' }}>{fmtCd(ppvCountdown)}</span>
              </div>
            </div>
          )}

          {/* PPV presets */}
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 2 }}>QUICK PRESETS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {PPV_PRESETS.map(function(p) {
              return (
                <button key={p.label} onClick={function() { setPpvTitle(p.label); setPpvPrice(String(p.price / 100)); }}
                  style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#EDE8F5' }}>{p.label}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C' }}>{fmtC(p.price)}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* PPV builder */}
          <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 2 }}>PPV EVENT BUILDER</div>
            <input
              value={ppvTitle}
              onChange={function(e) { setPpvTitle(e.target.value); }}
              placeholder="Event title..."
              style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', marginBottom: 4 }}>PRICE ($)</div>
                <input
                  type="number"
                  value={ppvPrice}
                  onChange={function(e) { setPpvPrice(e.target.value); }}
                  style={{ width: '100%', background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 10px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', marginBottom: 4 }}>DURATION (min)</div>
                <input
                  type="number"
                  value={ppvDuration}
                  onChange={function(e) { setPpvDur(e.target.value); }}
                  style={{ width: '100%', background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 10px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <button onClick={launchPPV} disabled={Boolean(ppvActive)}
              style={{ padding: '10px', background: ppvActive ? 'rgba(201,168,76,.05)' : 'linear-gradient(135deg,#C9A84C,#E8C46A)', border: 'none', borderRadius: 8, color: ppvActive ? '#3D3450' : '#07050A', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: ppvActive ? 'not-allowed' : 'pointer' }}>
              {ppvActive ? '▶ EVENT IN PROGRESS' : '🚀 LAUNCH PPV EVENT'}
            </button>
          </div>

          {/* Revenue projection */}
          <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#00C9A7', letterSpacing: 2, marginBottom: 8 }}>REVENUE PROJECTION</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>VIEWERS</span>
              <input
                type="number"
                value={projViewers}
                onChange={function(e) { setProjV(e.target.value); }}
                style={{ width: 80, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '5px 8px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12 }}
              />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>{'@ ' + fmtC(Math.floor(parseFloat(ppvPrice) * 100) || 500) + ' PPV'}</span>
            </div>
            {(function() {
              var price = Math.floor(parseFloat(ppvPrice) * 100) || 500;
              var viewers = Math.floor(parseFloat(projViewers)) || 500;
              var convRates = [[0.03, '3% conv (cold)'], [0.08, '8% conv (warm)'], [0.15, '15% conv (loyal)']];
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {convRates.map(function(cr) {
                    var buyers = Math.floor(viewers * cr[0]);
                    var gross = buyers * price;
                    var creatorEarn = Math.floor(gross * CREATOR);
                    return (
                      <div key={cr[1]} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(7,5,10,.5)', borderRadius: 6, padding: '6px 10px' }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90' }}>{cr[1]}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A84C', lineHeight: 1 }}>{fmtC(creatorEarn)}</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3450' }}>{buyers + ' buys · ' + fmtC(gross) + ' gross'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
