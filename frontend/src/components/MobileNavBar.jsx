import React, { useState, useEffect, useRef } from 'react';

var BG     = 'rgba(14,12,9,.97)';
var GOLD   = '#C9A84C';
var BURG   = '#800020';
var RED    = '#FF1A3C';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';
var DIM    = '#3D3020';
var CARD   = '#241C12';

var ANIM = '@keyframes navPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}} @keyframes drawerIn{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}';

// Primary nav: 5 items — hidden when room is active (room has its own bottom bar)
var PRIMARY = [
  { id: 'room',      icon: '🎙', label: 'LIVE'      },
  { id: 'discover',  icon: '🔭', label: 'DISCOVER'  },
  { id: 'money',     icon: '💰', label: 'EARN'      },
  { id: 'profile',   icon: '👤', label: 'PROFILE'   },
  { id: '__more__',  icon: '⊞',  label: 'MORE'      },
];

// All tool tabs that go in the "More" drawer
var MORE_TABS = [
  { id: 'fades',     icon: '⚡', label: 'FADES'      },
  { id: 'brand',     icon: '🎨', label: 'BRAND'      },
  { id: 'data',      icon: '📊', label: 'ANALYTICS'  },
  { id: 'fanout',    icon: '📡', label: 'FANOUT'     },
  { id: 'clips',     icon: '🎞', label: 'CLIPS'      },
  { id: 'watch',     icon: '📺', label: 'WATCH'      },
  { id: 'overlay',   icon: '🎬', label: 'OVERLAY'    },
  { id: 'bot',       icon: '🤖', label: 'SWANYBOT'   },
  { id: 'aura',      icon: '✨', label: 'AURA'       },
  { id: 'swanai',    icon: '🎯', label: 'SWAN AI'    },
  { id: 'battles',   icon: '⚔️', label: 'BATTLES'    },
  { id: 'classic',   icon: '🎲', label: 'DC'         },
  { id: 'collab',    icon: '🤝', label: 'COLLAB'     },
  { id: 'creators',  icon: '🔍', label: 'CREATORS'   },
  { id: 'green',     icon: '🟢', label: 'GREEN RM'   },
  { id: 'schedule',  icon: '📅', label: 'SCHEDULE'   },
  { id: 'rankings',  icon: '🏅', label: 'RANKINGS'   },
  { id: 'showcase',  icon: '🏆', label: 'SHOWCASE'   },
  { id: 'guardian',  icon: '🛡', label: 'GUARDIAN'   },
  { id: 'vod',       icon: '🎬', label: 'VOD'        },
  { id: 'tips',      icon: '💡', label: 'TIPS'       },
  { id: 'settings',  icon: '⚙', label: 'SETTINGS'   },
];

export default function MobileNavBar(props) {
  var activeTab    = props.activeTab;
  var setActiveTab = props.setActiveTab;
  var isLive       = props.isLive;
  var auraUnread   = props.auraUnread || 0;
  var onAuraClick  = props.onAuraClick;
  var onResetTab   = props.onResetTab;

  var [showMore, setShowMore] = useState(false);
  var showMoreRef = useRef(false);
  useEffect(function() { showMoreRef.current = showMore; }, [showMore]);

  // Push to history when More drawer opens — Android back button dismisses it
  useEffect(function() {
    function onPop() {
      if (showMoreRef.current) setShowMore(false);
    }
    window.addEventListener('popstate', onPop);
    return function() { window.removeEventListener('popstate', onPop); };
  }, []);

  function openMore() {
    setShowMore(true);
    window.history.pushState({ swOverlay: 'more' }, '');
  }
  function closeMore() {
    if (showMoreRef.current) window.history.back();
    else setShowMore(false);
  }

  // Always show, including in room

  function goTo(id) {
    if (id === '__more__') {
      if (showMore) closeMore(); else openMore();
      return;
    }
    if (id === activeTab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (onResetTab) onResetTab(id);
      setShowMore(false);
      return;
    }
    setActiveTab(id);
    if (id === 'aura' && onAuraClick) onAuraClick();
    setShowMore(false);
  }

  return (
    <div>
      <style>{ANIM}</style>

      {/* ── More drawer ── */}
      {showMore && (
        <div style={{
          position: 'fixed', bottom: 60, left: 0, right: 0, zIndex: 490,
          background: 'rgba(14,12,9,.98)', borderTop: '1px solid rgba(201,168,76,.15)',
          padding: '16px 16px calc(8px + env(safe-area-inset-bottom, 16px))',
          animation: 'drawerIn .22s ease',
          maxHeight: '60vh', overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}>
          {/* Drawer handle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT, letterSpacing: .5 }}>Studio Tools</span>
            <button onClick={closeMore} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', lineHeight: 1, userSelect: 'none', WebkitUserSelect: 'none' }}>✕</button>
          </div>
          {/* Tool grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {MORE_TABS.map(function(t) {
              var isActive = activeTab === t.id;
              return (
                <div key={t.id} onClick={function() { goTo(t.id); }} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 4px', borderRadius: 12, cursor: 'pointer',
                  background: isActive ? 'rgba(128,0,32,.25)' : CARD,
                  border: '1px solid ' + (isActive ? 'rgba(128,0,32,.5)' : 'rgba(255,255,255,.05)'),
                  transition: 'background .15s',
                  userSelect: 'none', WebkitUserSelect: 'none',
                }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: isActive ? GOLD : MUTED, letterSpacing: .5, textAlign: 'center' }}>
                    {t.label}
                    {t.id === 'aura' && auraUnread > 0 && (
                      <span style={{ color: RED }}> {auraUnread}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bottom nav bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
        background: BG,
        borderTop: '1px solid rgba(201,168,76,.15)',
        display: 'flex', height: 58,
        paddingBottom: 'env(safe-area-inset-bottom,16px)',
        boxSizing: 'content-box',
      }}>
        {PRIMARY.map(function(item, idx) {
          var isCenter  = idx === 0;   // LIVE button is center-elevated
          var isActive  = activeTab === item.id;
          var isMoreBtn = item.id === '__more__';
          var isMoreActive = showMore;

          if (isCenter) {
            return (
              <div key={item.id} onClick={function() { goTo(item.id); }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer', position: 'relative', userSelect: 'none', WebkitUserSelect: 'none' }}>
                <div style={{ position: 'relative' }}>
                  {isLive && (
                    <div style={{ position: 'absolute', inset: -5, borderRadius: '50%', border: '2px solid rgba(255,30,30,.6)', animation: 'navPulse 1.5s ease infinite', pointerEvents: 'none' }} />
                  )}
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%',
                    background: isActive ? 'linear-gradient(135deg,#800020,#C01838)' : 'linear-gradient(135deg,#2A1A28,#3D1028)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: -16,
                    boxShadow: isActive ? '0 -4px 20px rgba(128,0,32,.7)' : '0 -2px 10px rgba(0,0,0,.4)',
                    fontSize: 22, border: '2px solid ' + (isActive ? BURG : DIM),
                    transition: 'background .2s',
                  }}>
                    {item.icon}
                  </div>
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1, color: isActive ? GOLD : MUTED, display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isLive ? 'LIVE' : item.label}
                  {isLive && <span style={{ color: RED, fontSize: 8 }}>●</span>}
                </span>
              </div>
            );
          }

          return (
            <div key={item.id + idx} onClick={function() { goTo(item.id); }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer', padding: '8px 0', position: 'relative', userSelect: 'none', WebkitUserSelect: 'none' }}>
              {/* Active indicator line */}
              {(isActive || (isMoreBtn && isMoreActive)) && (
                <div style={{ position: 'absolute', top: 0, left: '30%', right: '30%', height: 2, background: GOLD, borderRadius: 999 }} />
              )}
              <span style={{ fontSize: 18, filter: (isActive || (isMoreBtn && isMoreActive)) ? ('drop-shadow(0 0 5px ' + GOLD + ')') : 'none', transition: 'filter .2s' }}>
                {item.icon}
              </span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1, color: (isActive || (isMoreBtn && isMoreActive)) ? GOLD : MUTED }}>
                {item.label}
                {item.id === 'aura' && auraUnread > 0 && !showMore && (
                  <span style={{ color: RED }}>  {auraUnread > 9 ? '9+' : auraUnread}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}