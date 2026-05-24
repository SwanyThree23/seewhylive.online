import React, { useState, useEffect, useRef } from 'react';

var GOLD   = '#C9A84C';
var GOLD_H = '#E8C46A';
var BURG   = '#800020';
var BURG_H = '#C01838';
var TEAL   = '#00C9A7';
var TEAL_H = '#00DEC0';
var LIME   = '#B4E628';
var PURP_H = '#C084FC';
var AMBER  = '#F59E0B';
var ORANGE = '#FF6B35';
var MUTED  = '#6B5F82';
var TEXT   = '#EDE8F4';
var TEXT_M = '#A89CC8';
var BG0    = '#07050A';
var BG1    = '#0F0C14';
var FAINT  = '#1C1530';
var BORDER = 'rgba(255,255,255,.07)';
var GLASS  = 'rgba(13,10,20,.75)';
var fD = "'Bebas Neue',sans-serif";
var fU = "'Barlow Condensed',sans-serif";
var fM = "'DM Mono',monospace";

var rnd = function(a, b) { return Math.floor(Math.random() * (b - a + 1) + a); };
var fmtN = function(n) { n = n || 0; if (n >= 1000000) return (n/1000000).toFixed(1)+'M'; if (n >= 1000) return (n/1000).toFixed(1)+'k'; return ''+n; };

var CREATOR = 0.90;

var MERCH_ITEMS = [
  {id:'m1', name:'Washington Classic Hoodie', price:65, stock:12, emoji:'🧥', color:'#C01838', limited:true, sold:38, cat:'apparel'},
  {id:'m2', name:'Domino OG Snapback', price:45, stock:24, emoji:'🧢', color:'#E8C46A', limited:false, sold:71, cat:'apparel'},
  {id:'m3', name:'SeeWhy LIVE Creator Mug', price:25, stock:50, emoji:'☕', color:'#9B4DCA', limited:false, sold:134, cat:'accessories'},
  {id:'m4', name:'Techmunity Tee — Black', price:35, stock:6, emoji:'👕', color:'#00DEC0', limited:true, sold:94, cat:'apparel'},
  {id:'m5', name:'Washington Classic 2026 Tee', price:40, stock:20, emoji:'🏆', color:'#FFD700', limited:true, sold:52, cat:'apparel'},
  {id:'m6', name:'Cali Bones Domino Set (Premium)', price:120, stock:5, emoji:'🎲', color:'#E8C46A', limited:true, sold:19, cat:'collectibles'},
  {id:'m7', name:"VibeN'Bones Phone Case", price:30, stock:35, emoji:'📱', color:'#B4E628', limited:false, sold:87, cat:'accessories'},
  {id:'m8', name:'SwanyThree Signed Poster', price:80, stock:3, emoji:'🖼', color:'#FF6B35', limited:true, sold:47, cat:'collectibles'},
];

export default function MerchTab({ addToast, isLive, socket, roomId, username }) {
  var [items, setItems] = useState(MERCH_ITEMS.map(function(m) { return Object.assign({}, m); }));
  var [dropped, setDropped] = useState(null);
  var [cart, setCart] = useState([]);
  var [section, setSection] = useState('shop');
  var [dropCountdown, setDropCountdown] = useState(null);
  var [filterCat, setFilterCat] = useState('all');
  var cdRef = useRef(null);

  useEffect(function() {
    return function() { clearInterval(cdRef.current); };
  }, []);

  var cartTotal = cart.reduce(function(s, ci) { return s + ci.price * ci.qty; }, 0);
  var cartCreator = Math.floor(cartTotal * CREATOR);
  var cartPlatform = cartTotal - cartCreator;
  var totalSold = items.reduce(function(s, it) { return s + it.sold; }, 0);
  var creatorEarned = Math.floor(totalSold * 45 * CREATOR);

  function addToCart(item) {
    if (item.stock <= 0) {
      addToast('❌ Sold out!', 'error');
      return;
    }
    setItems(function(prev) {
      return prev.map(function(it) {
        if (it.id !== item.id) return it;
        return Object.assign({}, it, {stock: it.stock - 1, sold: it.sold + 1});
      });
    });
    setCart(function(prev) {
      var found = false;
      var next = prev.map(function(ci) {
        if (ci.id !== item.id) return ci;
        found = true;
        return Object.assign({}, ci, {qty: ci.qty + 1});
      });
      if (!found) {
        next = prev.concat([{id: item.id, name: item.name, price: item.price, emoji: item.emoji, color: item.color, qty: 1}]);
      }
      return next;
    });
    addToast(item.emoji + ' ' + item.name + ' added to cart!', 'success');
    if (isLive) {
      addToast('📢 Merch drop live: ' + item.name, 'info');
    }
  }

  function initiateDrop(item) {
    setDropped(item);
    setDropCountdown(30);
    clearInterval(cdRef.current);
    addToast('⚡ LIMITED DROP: ' + item.name + ' — 30s only!', 'error');
    cdRef.current = setInterval(function() {
      setDropCountdown(function(prev) {
        if (prev === null || prev <= 1) {
          clearInterval(cdRef.current);
          setDropped(null);
          setDropCountdown(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function endDrop() {
    clearInterval(cdRef.current);
    setDropped(null);
    setDropCountdown(null);
  }

  function placeOrder() {
    var totalCents = Math.floor(cartTotal * 100);
    var earned = Math.floor(cartCreator);
    if (socket && roomId && totalCents > 0) {
      socket.emit('send-gift', { roomId: roomId, fromUser: username || 'Fan', emoji: '👕', name: 'Merch Order', valueCents: totalCents });
    }
    setCart([]);
    addToast('✅ Order placed! Creator gets $' + earned.toFixed(2), 'success');
  }

  var cats = ['all', 'apparel', 'accessories', 'collectibles'];
  var filteredItems = filterCat === 'all' ? items : items.filter(function(it) { return it.cat === filterCat; });
  var limitedItems = items.filter(function(it) { return it.limited; });

  var tabStyle = function(active) {
    return {
      flex: 1,
      padding: '8px 4px',
      background: active ? BURG : 'transparent',
      border: 'none',
      borderBottom: active ? '2px solid ' + BURG_H : '2px solid transparent',
      color: active ? TEXT : TEXT_M,
      fontFamily: fU,
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: 0.8,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      textAlign: 'center'
    };
  };

  var catBtnStyle = function(active) {
    return {
      padding: '4px 10px',
      background: active ? BURG + '33' : 'transparent',
      border: '1px solid ' + (active ? BURG_H : BORDER),
      color: active ? GOLD_H : TEXT_M,
      borderRadius: 5,
      fontSize: 10,
      fontFamily: fU,
      fontWeight: 700,
      cursor: 'pointer',
      letterSpacing: 0.5,
      textTransform: 'capitalize'
    };
  };

  return (
    React.createElement('div', {style:{display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:BG0, color:TEXT}},

      /* LIVE DROP BANNER */
      dropped && dropCountdown
        ? React.createElement('div', {style:{
            flexShrink:0,
            background:'linear-gradient(90deg, '+BURG+', #3D000E)',
            borderBottom:'1px solid '+BURG_H+'66',
            padding:'8px 14px',
            display:'flex', alignItems:'center', gap:10
          }},
            React.createElement('div', {style:{fontSize:22, flexShrink:0}}, dropped.emoji),
            React.createElement('div', {style:{flex:1, minWidth:0}},
              React.createElement('div', {style:{fontSize:11, color:TEXT, fontFamily:fU, fontWeight:700, letterSpacing:0.5}}, dropped.name),
              React.createElement('div', {style:{fontSize:9, color:TEXT_M, fontFamily:fM}}, 'LIMITED DROP ACTIVE')
            ),
            React.createElement('div', {style:{
              fontSize:22, fontFamily:fD, color:BURG_H,
              minWidth:30, textAlign:'center', letterSpacing:1
            }}, dropCountdown),
            React.createElement('button', {
              onClick: function() { addToCart(dropped); },
              style:{
                background:GOLD_H, border:'none', color:BG0,
                borderRadius:6, padding:'5px 12px',
                fontSize:11, fontFamily:fU, fontWeight:700,
                cursor:'pointer', letterSpacing:0.5, flexShrink:0
              }
            }, 'BUY NOW')
          )
        : null,

      /* TAB BAR */
      React.createElement('div', {style:{display:'flex', background:BG1, borderBottom:'1px solid '+BORDER, flexShrink:0}},
        React.createElement('button', {style:tabStyle(section==='shop'), onClick:function(){setSection('shop');}}, 'SHOP'),
        React.createElement('button', {style:tabStyle(section==='drops'), onClick:function(){setSection('drops');}}, 'DROPS'),
        React.createElement('button', {
          style:tabStyle(section==='cart'),
          onClick:function(){setSection('cart');}
        },
          'CART' + (cart.length > 0 ? ' (' + cart.length + ')' : '')
        )
      ),

      /* SCROLLABLE BODY */
      React.createElement('div', {style:{flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8}},

        /* ===== SHOP SECTION ===== */
        section === 'shop'
          ? React.createElement('div', {style:{display:'flex', flexDirection:'column', gap:8}},

              /* Stats card */
              React.createElement('div', {style:{background:FAINT, border:'1px solid '+BORDER, borderRadius:8, padding:'10px 12px', display:'flex', gap:0}},
                React.createElement('div', {style:{flex:1, textAlign:'center', borderRight:'1px solid '+BORDER}},
                  React.createElement('div', {style:{fontSize:20, fontFamily:fD, color:TEXT, letterSpacing:1}}, items.length),
                  React.createElement('div', {style:{fontSize:9, color:TEXT_M, fontFamily:fU, letterSpacing:1, marginTop:1}}, 'ITEMS')
                ),
                React.createElement('div', {style:{flex:1, textAlign:'center', borderRight:'1px solid '+BORDER}},
                  React.createElement('div', {style:{fontSize:20, fontFamily:fD, color:GOLD, letterSpacing:1}}, fmtN(totalSold)),
                  React.createElement('div', {style:{fontSize:9, color:TEXT_M, fontFamily:fU, letterSpacing:1, marginTop:1}}, 'TOTAL SOLD')
                ),
                React.createElement('div', {style:{flex:1, textAlign:'center'}},
                  React.createElement('div', {style:{fontSize:20, fontFamily:fD, color:LIME, letterSpacing:1}}, '$' + fmtN(creatorEarned)),
                  React.createElement('div', {style:{fontSize:9, color:TEXT_M, fontFamily:fU, letterSpacing:1, marginTop:1}}, 'CREATOR (90%)')
                )
              ),

              /* Category filter */
              React.createElement('div', {style:{display:'flex', gap:6, flexWrap:'wrap'}},
                cats.map(function(c) {
                  return React.createElement('button', {
                    key: c,
                    style: catBtnStyle(filterCat === c),
                    onClick: function() { setFilterCat(c); }
                  }, c);
                })
              ),

              /* Item cards */
              filteredItems.map(function(item) {
                var maxSold = 200;
                var soldPct = Math.min(100, Math.floor((item.sold / maxSold) * 100));
                var soldOut = item.stock <= 0;
                return React.createElement('div', {
                  key: item.id,
                  style:{
                    background:FAINT,
                    border:'1px solid ' + (soldOut ? BORDER : item.color + '33'),
                    borderRadius:10,
                    padding:'10px 12px',
                    opacity: soldOut ? 0.6 : 1
                  }
                },
                  React.createElement('div', {style:{display:'flex', alignItems:'flex-start', gap:10}},
                    /* Emoji icon */
                    React.createElement('div', {style:{
                      width:40, height:40, borderRadius:8, flexShrink:0,
                      background: item.color + '22',
                      border:'1px solid ' + item.color + '55',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:20
                    }}, item.emoji),

                    /* Info */
                    React.createElement('div', {style:{flex:1, minWidth:0}},
                      React.createElement('div', {style:{display:'flex', alignItems:'center', gap:5, marginBottom:2}},
                        React.createElement('span', {style:{fontSize:12, color:TEXT, fontFamily:fU, fontWeight:700}}, item.name),
                        item.limited
                          ? React.createElement('span', {style:{
                              fontSize:8, color:BURG_H, fontFamily:fM, fontWeight:700,
                              background:BURG+'33', border:'1px solid '+BURG+'66',
                              borderRadius:3, padding:'1px 4px', letterSpacing:0.5
                            }}, 'LIMITED')
                          : null
                      ),
                      React.createElement('div', {style:{fontSize:13, color:GOLD_H, fontFamily:fD, letterSpacing:1, marginBottom:4}},
                        '$' + item.price
                      ),
                      /* Sold progress bar */
                      React.createElement('div', {style:{marginBottom:3}},
                        React.createElement('div', {style:{display:'flex', justifyContent:'space-between', marginBottom:2}},
                          React.createElement('span', {style:{fontSize:9, color:TEXT_M, fontFamily:fM}}, fmtN(item.sold) + ' sold'),
                          React.createElement('span', {style:{fontSize:9, color:item.stock <= 5 ? BURG_H : TEXT_M, fontFamily:fM}},
                            item.stock > 0 ? item.stock + ' left' : 'SOLD OUT'
                          )
                        ),
                        React.createElement('div', {style:{height:3, background:BG0, borderRadius:2, overflow:'hidden'}},
                          React.createElement('div', {style:{
                            height:'100%',
                            width: soldPct + '%',
                            background: item.color,
                            borderRadius:2
                          }})
                        )
                      )
                    ),

                    /* Buttons */
                    React.createElement('div', {style:{display:'flex', flexDirection:'column', gap:4, flexShrink:0}},
                      React.createElement('button', {
                        onClick: function() { addToCart(item); },
                        disabled: soldOut,
                        style:{
                          background: soldOut ? FAINT : item.color + '22',
                          border:'1px solid ' + (soldOut ? BORDER : item.color + '88'),
                          color: soldOut ? MUTED : item.color,
                          borderRadius:5, padding:'4px 10px',
                          fontSize:10, fontFamily:fU, fontWeight:700,
                          cursor: soldOut ? 'not-allowed' : 'pointer',
                          letterSpacing:0.5, whiteSpace:'nowrap'
                        }
                      }, soldOut ? 'SOLD OUT' : '+ ADD'),
                      isLive && item.stock > 0
                        ? React.createElement('button', {
                            onClick: function() { initiateDrop(item); },
                            style:{
                              background:BURG+'22', border:'1px solid '+BURG_H+'66',
                              color:BURG_H, borderRadius:5, padding:'4px 10px',
                              fontSize:10, fontFamily:fU, fontWeight:700,
                              cursor:'pointer', letterSpacing:0.5
                            }
                          }, '⚡ DROP')
                        : null
                    )
                  )
                );
              })
            )
          : null,

        /* ===== DROPS SECTION ===== */
        section === 'drops'
          ? React.createElement('div', {style:{display:'flex', flexDirection:'column', gap:8}},

              /* Explanation card */
              React.createElement('div', {style:{background:BURG+'22', border:'1px solid '+BURG+'55', borderRadius:8, padding:'10px 12px'}},
                React.createElement('div', {style:{fontSize:12, color:BURG_H, fontFamily:fU, fontWeight:700, letterSpacing:0.5, marginBottom:4}},
                  '⚡ LIVE DROP WINDOWS'
                ),
                React.createElement('p', {style:{fontSize:11, color:TEXT_M, fontFamily:fU, margin:0, lineHeight:1.5}},
                  'Trigger a 30-second exclusive drop window during your stream. Viewers see a live banner countdown and can buy directly. Limited stock creates urgency. Drops only available while streaming.'
                )
              ),

              /* Warning if not live */
              !isLive
                ? React.createElement('div', {style:{background:AMBER+'22', border:'1px solid '+AMBER+'55', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:8}},
                    React.createElement('span', {style:{fontSize:16}}, '⚠️'),
                    React.createElement('span', {style:{fontSize:11, color:AMBER, fontFamily:fU, fontWeight:700}}, 'Go LIVE to trigger drops')
                  )
                : null,

              /* Limited items list */
              limitedItems.map(function(item) {
                var isActive = dropped && dropped.id === item.id;
                var soldOut = item.stock <= 0;
                return React.createElement('div', {
                  key: item.id,
                  style:{
                    background:FAINT,
                    border:'1px solid ' + (isActive ? BURG_H : item.color + '33'),
                    borderRadius:10, padding:'10px 12px',
                    display:'flex', alignItems:'center', gap:10
                  }
                },
                  React.createElement('div', {style:{fontSize:24, flexShrink:0}}, item.emoji),
                  React.createElement('div', {style:{flex:1, minWidth:0}},
                    React.createElement('div', {style:{fontSize:12, color:TEXT, fontFamily:fU, fontWeight:700, marginBottom:2}}, item.name),
                    React.createElement('div', {style:{display:'flex', gap:10}},
                      React.createElement('span', {style:{fontSize:11, color:GOLD_H, fontFamily:fD, letterSpacing:0.5}}, '$' + item.price),
                      React.createElement('span', {style:{fontSize:10, color: item.stock <= 3 ? BURG_H : TEXT_M, fontFamily:fM}},
                        item.stock > 0 ? item.stock + ' left' : 'SOLD OUT'
                      )
                    )
                  ),
                  isActive
                    ? React.createElement('div', {style:{display:'flex', alignItems:'center', gap:8, flexShrink:0}},
                        React.createElement('div', {style:{fontSize:16, fontFamily:fD, color:BURG_H}}, dropCountdown + 's'),
                        React.createElement('button', {
                          onClick: endDrop,
                          style:{
                            background:MUTED+'33', border:'1px solid '+MUTED,
                            color:TEXT_M, borderRadius:5, padding:'4px 8px',
                            fontSize:10, fontFamily:fU, fontWeight:700,
                            cursor:'pointer'
                          }
                        }, 'END DROP')
                      )
                    : React.createElement('button', {
                        onClick: function() { if (isLive && !soldOut) initiateDrop(item); },
                        disabled: !isLive || soldOut,
                        style:{
                          background: (!isLive || soldOut) ? FAINT : BURG+'33',
                          border:'1px solid ' + ((!isLive || soldOut) ? BORDER : BURG_H+'66'),
                          color: (!isLive || soldOut) ? MUTED : BURG_H,
                          borderRadius:5, padding:'4px 10px',
                          fontSize:10, fontFamily:fU, fontWeight:700,
                          cursor: (!isLive || soldOut) ? 'not-allowed' : 'pointer',
                          letterSpacing:0.5, flexShrink:0
                        }
                      }, soldOut ? 'SOLD OUT' : '⚡ DROP NOW')
                );
              })
            )
          : null,

        /* ===== CART SECTION ===== */
        section === 'cart'
          ? React.createElement('div', {style:{display:'flex', flexDirection:'column', gap:8}},

              cart.length === 0
                ? React.createElement('div', {style:{
                    background:FAINT, border:'1px solid '+BORDER, borderRadius:10,
                    padding:'32px 16px', textAlign:'center'
                  }},
                    React.createElement('div', {style:{fontSize:32, marginBottom:8}}, '🛒'),
                    React.createElement('div', {style:{fontSize:13, color:TEXT_M, fontFamily:fU, letterSpacing:0.5}},
                      'Cart is empty. Add some merch!'
                    )
                  )
                : React.createElement('div', {style:{display:'flex', flexDirection:'column', gap:8}},

                    /* Cart items */
                    cart.map(function(ci) {
                      return React.createElement('div', {
                        key: ci.id,
                        style:{
                          background:FAINT, border:'1px solid '+BORDER, borderRadius:10,
                          padding:'10px 12px', display:'flex', alignItems:'center', gap:10
                        }
                      },
                        React.createElement('div', {style:{fontSize:22, flexShrink:0}}, ci.emoji),
                        React.createElement('div', {style:{flex:1, minWidth:0}},
                          React.createElement('div', {style:{fontSize:12, color:TEXT, fontFamily:fU, fontWeight:700, marginBottom:2}}, ci.name),
                          React.createElement('div', {style:{fontSize:10, color:TEXT_M, fontFamily:fM}},
                            'x' + ci.qty + '  ·  $' + ci.price + ' ea'
                          )
                        ),
                        React.createElement('div', {style:{fontSize:14, color:GOLD_H, fontFamily:fD, letterSpacing:0.5, flexShrink:0}},
                          '$' + (ci.price * ci.qty)
                        ),
                        React.createElement('button', {
                          onClick: function() {
                            setCart(function(prev) {
                              return prev.filter(function(x) { return x.id !== ci.id; });
                            });
                          },
                          style:{
                            background:'transparent', border:'none', color:MUTED,
                            cursor:'pointer', fontSize:14, padding:'0 4px', flexShrink:0
                          }
                        }, '✕')
                      );
                    }),

                    /* Order summary */
                    React.createElement('div', {style:{background:FAINT, border:'1px solid '+GOLD+'33', borderRadius:10, padding:'12px 14px'}},
                      React.createElement('div', {style:{fontSize:11, color:GOLD, fontFamily:fU, fontWeight:700, letterSpacing:0.8, marginBottom:8}}, 'ORDER SUMMARY'),
                      React.createElement('div', {style:{display:'flex', justifyContent:'space-between', marginBottom:5}},
                        React.createElement('span', {style:{fontSize:11, color:TEXT_M, fontFamily:fU}}, 'Total'),
                        React.createElement('span', {style:{fontSize:13, color:TEXT, fontFamily:fD, letterSpacing:0.5}}, '$' + cartTotal.toFixed(2))
                      ),
                      React.createElement('div', {style:{display:'flex', justifyContent:'space-between', marginBottom:5}},
                        React.createElement('span', {style:{fontSize:11, color:LIME, fontFamily:fU}}, 'Creator (90%)'),
                        React.createElement('span', {style:{fontSize:11, color:LIME, fontFamily:fM}}, '$' + cartCreator.toFixed(2))
                      ),
                      React.createElement('div', {style:{display:'flex', justifyContent:'space-between', marginBottom:10}},
                        React.createElement('span', {style:{fontSize:11, color:TEXT_M, fontFamily:fU}}, 'Platform (10%)'),
                        React.createElement('span', {style:{fontSize:11, color:TEXT_M, fontFamily:fM}}, '$' + cartPlatform.toFixed(2))
                      ),
                      React.createElement('button', {
                        onClick: placeOrder,
                        style:{
                          width:'100%', padding:'10px 0',
                          background:'linear-gradient(90deg, '+BURG+', '+BURG_H+')',
                          border:'none', borderRadius:7,
                          color:TEXT, fontFamily:fD, fontSize:14,
                          fontWeight:700, letterSpacing:1.5, cursor:'pointer'
                        }
                      }, 'PLACE ORDER')
                    )
                  )
            )
          : null

      )
    )
  );
}
