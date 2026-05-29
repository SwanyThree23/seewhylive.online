import React, { useState, useEffect } from 'react';

export default function MobileNavBar(props) {
  var activeTab    = props.activeTab;
  var setActiveTab = props.setActiveTab;
  var isLive       = props.isLive;
  var auraUnread   = props.auraUnread || 0;
  var onAuraClick  = props.onAuraClick;

  var NAV_ITEMS = [
    { id: 'room',     label: 'HOME',      icon: '🏠', isCenter: false },
    { id: 'discover', label: 'DISCOVER',  icon: '🔭', isCenter: false },
    { id: 'room',     label: isLive ? 'LIVE' : 'STUDIO', icon: '📡', isCenter: true },
    { id: isLive ? 'aura' : 'battles', label: isLive ? 'AURA' : 'BATTLES', icon: isLive ? '🤖' : '⚡', isCenter: false, badge: isLive && auraUnread > 0 ? auraUnread : 0 },
    { id: 'data',     label: 'DASHBOARD', icon: '📊', isCenter: false },
  ];

  var [isMobile, setIsMobile] = useState(function() { return window.innerWidth <= 900; });

  useEffect(function() {
    function onResize() { setIsMobile(window.innerWidth <= 900); }
    window.addEventListener('resize', onResize);
    return function() { window.removeEventListener('resize', onResize); };
  }, []);

  if (!isMobile) return null;

  var pulseStyle = '@keyframes navPulse { 0%,100%{transform:scale(1);opacity:.9} 50%{transform:scale(1.15);opacity:1} }';

  return (
    <div>
      <style>{pulseStyle}</style>
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 500,
        background: 'rgba(7,5,10,.97)',
        borderTop: '1px solid rgba(255,255,255,.08)',
        display: 'flex',
        height: 60,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxSizing: 'content-box'
      }}>
        {NAV_ITEMS.map(function(item, idx) {
          var isActive = activeTab === item.id;
          var isCenter = item.isCenter;

          if (isCenter) {
            return (
              <div
                key={idx}
                onClick={function() { setActiveTab(item.id); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  padding: '8px 0'
                }}>
                <div style={{ position: 'relative' }}>
                  {isLive && (
                    <div style={{
                      position: 'absolute',
                      inset: -4,
                      borderRadius: '50%',
                      border: '2px solid rgba(255,30,30,.7)',
                      animation: 'navPulse 1.5s ease infinite',
                      pointerEvents: 'none'
                    }} />
                  )}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#800020,#C01838)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: -18,
                    boxShadow: '0 -4px 20px rgba(128,0,32,.6)',
                    fontSize: 24
                  }}>
                    {item.icon}
                  </div>
                </div>
                <div style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 7,
                  letterSpacing: 1,
                  color: isActive ? '#C9A84C' : '#7A6F90',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  {item.label}
                  {isLive && (
                    <span style={{ color: '#FF1564', fontSize: 8 }}>●</span>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div
              key={idx}
              onClick={function() {
                setActiveTab(item.id);
                if (item.id === 'aura' && onAuraClick) onAuraClick();
              }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                cursor: 'pointer',
                padding: '8px 0'
              }}>
              <div style={{ position: 'relative', fontSize: 18, filter: isActive ? 'drop-shadow(0 0 6px #C9A84C)' : 'none', transition: 'filter .2s' }}>
                {item.icon}
                {item.badge > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -6, background: '#FF1A3C', color: '#fff', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 700, lineHeight: 1, border: '1px solid rgba(7,5,10,.8)' }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <div style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: 7,
                letterSpacing: 1,
                color: isActive ? '#C9A84C' : '#7A6F90'
              }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
