import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Copy, ClipboardList } from 'lucide-react';

/* ─── Brand tokens ─────────────────────────────────────── */
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const SHEET   = '#0E1120';
const FONT    = { fontFamily: "'Barlow Condensed', sans-serif" };

/* ─── OCT clip-path ─────────────────────────────────────── */
const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

/* ─── Mock data ─────────────────────────────────────────── */
const MOCK_RECENT = [
  { id: 1, name: 'SwanyThree',   handle: '@swanythree',   initials: 'ST', color: '#8B4513' },
  { id: 2, name: 'Joyce B',      handle: '@joyceb',       initials: 'JB', color: '#6B4A9A' },
  { id: 3, name: 'Phelo',        handle: '@phelo',        initials: 'PH', color: '#4A7A9B' },
  { id: 4, name: 'ObiKnowledge', handle: '@obiknowledge', initials: 'OK', color: '#6B8B4A' },
  { id: 5, name: 'Marvin10',     handle: '@marvin10',     initials: 'M1', color: '#9B6B4A' },
];

const MOCK_SUGGESTED = [
  { id: 6,  name: 'Durand',      handle: '@durand13',     initials: 'D',  color: '#4A6B8B', followers: '12.4K' },
  { id: 7,  name: 'Sim 11',      handle: '@sim11',        initials: 'S',  color: '#8B4A6B', followers: '8.9K'  },
  { id: 8,  name: 'Yahawadah',   handle: '@yahawadah',    initials: 'Y',  color: '#6B8B4A', followers: '22.1K' },
  { id: 9,  name: 'TravelQueen', handle: '@travelqueen',  initials: 'TQ', color: '#4A8B6B', followers: '45.2K' },
  { id: 10, name: 'CoachMike',   handle: '@coachmike',    initials: 'CM', color: '#9B8B4A', followers: '31.7K' },
  { id: 11, name: 'NatureLens',  handle: '@naturelens',   initials: 'NL', color: '#4A4A8B', followers: '18.3K' },
  { id: 12, name: 'ChefDave',    handle: '@chefdave',     initials: 'CD', color: '#8B4A4A', followers: '27.5K' },
  { id: 13, name: 'FitnessGuru', handle: '@fitnessguru',  initials: 'FG', color: '#4A8B8B', followers: '52.1K' },
];

/* ─── Octagonal avatar tile ─────────────────────────────── */
function OctTile({ size = 48, color, initials, fontSize = 14 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        clipPath: OCT,
        background: `linear-gradient(135deg, ${color}CC, ${color}66)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ ...FONT, fontSize, fontWeight: 700, color: '#fff', letterSpacing: '0.03em' }}>
        {initials}
      </span>
    </div>
  );
}

/* ─── Invite pill button ─────────────────────────────────── */
function InviteButton({ sent, onClick, small = false }) {
  const px  = small ? '6px' : '8px';
  const py  = small ? '2px' : '3px';
  const fs  = small ? 9 : 10;

  return (
    <button
      onClick={onClick}
      disabled={sent}
      style={{
        ...FONT,
        fontSize: fs,
        fontWeight: 700,
        letterSpacing: '0.06em',
        padding: `${py} ${px}`,
        borderRadius: 999,
        border: 'none',
        cursor: sent ? 'default' : 'pointer',
        background: sent ? '#166534' : CRIMSON,
        color: sent ? '#6DBF7E' : GOLD,
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {sent ? '✓ SENT' : 'INVITE'}
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function InviteGuestsModal({ isOpen, onClose, roomId, roomTitle, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [invited, setInvited]         = useState(new Set());
  const [linkCopied, setLinkCopied]   = useState(false);

  function handleInvite(id) {
    setInvited(prev => new Set([...prev, id]));
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/LiveRoom?id=${roomId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  const q = searchQuery.trim().toLowerCase();

  const filteredRecent = useMemo(
    () => q
      ? MOCK_RECENT.filter(p => p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q))
      : MOCK_RECENT,
    [q],
  );

  const filteredSuggested = useMemo(
    () => q
      ? MOCK_SUGGESTED.filter(p => p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q))
      : MOCK_SUGGESTED,
    [q],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="igm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 89,
              background: 'rgba(0,0,0,0.6)',
            }}
          />

          {/* Sheet */}
          <motion.div
            key="igm-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 90,
              background: SHEET,
              borderRadius: '24px 24px 0 0',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* ── Drag handle ──────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
            </div>

            {/* ── Header ───────────────────────────────────── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 16px 12px',
            }}>
              <span style={{
                ...FONT,
                fontSize: 22,
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Invite Guests
              </span>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: 999,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Search bar ───────────────────────────────── */}
            <div style={{ padding: '0 16px 14px', position: 'relative' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: 28,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.35)',
                  pointerEvents: 'none',
                }}
              />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or handle…"
                style={{
                  ...FONT,
                  width: '100%',
                  boxSizing: 'border-box',
                  paddingLeft: 38,
                  paddingRight: 14,
                  paddingTop: 10,
                  paddingBottom: 10,
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#fff',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  outline: 'none',
                }}
              />
            </div>

            {/* ── Scrollable body ──────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>

              {/* Recent Collabs */}
              {filteredRecent.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <span style={{
                    ...FONT,
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    color: GOLD,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '0 16px',
                    marginBottom: 10,
                  }}>
                    Recent Collabs
                  </span>

                  {/* Horizontal scroll row */}
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    overflowX: 'auto',
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingBottom: 8,
                    scrollbarWidth: 'none',
                  }}>
                    {filteredRecent.map(person => (
                      <div
                        key={person.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          width: 64,
                          flexShrink: 0,
                          gap: 5,
                        }}
                      >
                        <OctTile size={48} color={person.color} initials={person.initials} fontSize={13} />
                        <span style={{
                          ...FONT,
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.85)',
                          maxWidth: 64,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                        }}>
                          {person.name}
                        </span>
                        <InviteButton
                          sent={invited.has(person.id)}
                          onClick={() => handleInvite(person.id)}
                          small
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Guests */}
              {filteredSuggested.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <span style={{
                    ...FONT,
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    color: GOLD,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '0 16px',
                    marginBottom: 10,
                  }}>
                    Suggested Guests
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
                    {filteredSuggested.map(person => (
                      <div
                        key={person.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '6px 0',
                        }}
                      >
                        <OctTile size={40} color={person.color} initials={person.initials} fontSize={11} />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            ...FONT,
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#fff',
                            letterSpacing: '0.02em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {person.name}
                          </div>
                          <div style={{
                            ...FONT,
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.45)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {person.handle}
                            {person.followers && (
                              <span style={{ marginLeft: 8, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                                {person.followers} followers
                              </span>
                            )}
                          </div>
                        </div>

                        <InviteButton
                          sent={invited.has(person.id)}
                          onClick={() => handleInvite(person.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {filteredRecent.length === 0 && filteredSuggested.length === 0 && (
                <div style={{
                  ...FONT,
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: 15,
                  fontWeight: 500,
                  padding: '40px 16px',
                }}>
                  No results for "{searchQuery}"
                </div>
              )}
            </div>

            {/* ── Bottom CTA ───────────────────────────────── */}
            <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                onClick={handleCopyLink}
                style={{
                  ...FONT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '12px 0',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: linkCopied ? '#6DBF7E' : GOLD,
                  background: 'transparent',
                  border: `1px solid ${linkCopied ? '#166534' : `${GOLD}4D`}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {linkCopied ? <Check size={16} /> : <ClipboardList size={16} />}
                {linkCopied ? 'Link Copied!' : '📋 Copy Room Link'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
