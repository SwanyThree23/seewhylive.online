// frontend/src/components/nav/BottomNavV46.jsx
//
// Simplified 5-item bottom nav + "More" overflow for Studio/Dashboard.
// Replaces whatever the current bottom nav component is — check your
// routing for where the old one is mounted and swap it in there.

import { useState } from 'react';
import MoreMenuSheet from './MoreMenuSheet';

const BG = '#0C0806';
const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';
const INACTIVE = '#8a8378';

const PRIMARY_ITEMS = [
  { key: 'broadcast', label: 'Broadcast', icon: '🔴', route: '/go-live' },
  { key: 'discover', label: "Who's Live", icon: '👁️', route: '/discover' },
  { key: 'earnings', label: 'Earnings', icon: '💰', route: '/earnings' },
  { key: 'post', label: 'Post', icon: '📹', route: '/post-video' },
  { key: 'messages', label: 'Messages', icon: '💬', route: '/messages' },
];

const MORE_ITEMS = [
  { key: 'studio', label: 'Broadcast Studio', icon: '🎬', route: '/studio' },
  { key: 'dashboard', label: 'Creator Dashboard', icon: '📊', route: '/dashboard' },
];

export default function BottomNavV46({ activeRoute, onNavigate }) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          background: BG,
          borderTop: `1px solid ${INACTIVE}33`,
          padding: '8px 0',
          zIndex: 50,
        }}
      >
        {PRIMARY_ITEMS.map((item) => {
          const active = activeRoute === item.route;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.route)}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                color: active ? GOLD : INACTIVE,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setMoreOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            color: moreOpen ? GOLD : INACTIVE,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 20 }}>⋯</span>
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <MoreMenuSheet
          items={MORE_ITEMS}
          onSelect={(route) => {
            setMoreOpen(false);
            onNavigate(route);
          }}
          onClose={() => setMoreOpen(false)}
        />
      )}
    </>
  );
}
