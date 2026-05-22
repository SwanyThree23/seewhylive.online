import React, { useState, useEffect, useRef } from 'react';

var GOLD_H  = '#E8C46A';
var BURG    = '#800020';
var BURG_H  = '#C01838';
var TEAL_H  = '#00DEC0';
var MUTED   = '#6B5F82';
var TEXT    = '#EDE8F4';
var BG1     = '#0F0C14';
var FAINT   = '#1C1530';
var BORDER  = 'rgba(255,255,255,.07)';
var GLASS   = 'rgba(13,10,20,.75)';
var fD      = "'Bebas Neue',sans-serif";
var fU      = "'Barlow Condensed',sans-serif";
var fM      = "'DM Mono',monospace";

function fmtN(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : '' + n;
}

var PORTAL_CHANNELS = [
  {
    id: 'pc1',
    name: 'AIverse Podcast',
    avatar: '🎙',
    color: '#9B4DCA',
    tag: 'TECH · CULTURE',
    live: false,
    viewers: 0,
    host: 'Isaac Hayes III × SwanyThree',
    latestEp: 'Ep.48 — AI in the Creator Economy',
    schedule: 'Sundays 7PM ET',
    subs: '19.3K',
    desc: 'Where AI meets culture.'
  },
  {
    id: 'pc2',
    name: 'Memoirs of a Shy Girl',
    avatar: '💜',
    color: '#FF2D78',
    tag: 'TALK · EMPOWERMENT',
    live: false,
    viewers: 0,
    host: 'Joyce Moore',
    latestEp: 'Season 3 Ep.12 — Finding Your Voice',
    schedule: 'Tuesdays 6PM ET',
    subs: '31.5K',
    desc: 'Authentic storytelling, empowerment, and community.'
  },
  {
    id: 'pc3',
    name: 'Domino Entertainment',
    avatar: '🎲',
    color: '#C01838',
    tag: 'GAMING · SPORTS',
    live: true,
    viewers: 892,
    host: 'Isaac Hayes III',
    latestEp: 'Washington Classic Rd.2 LIVE 🔴',
    schedule: 'Weekends LIVE',
    subs: '48.2K',
    desc: 'Official Domino Entertainment channel.'
  },
  {
    id: 'pc4',
    name: 'DrMuk Hip Hop Biochemistry',
    avatar: '🔬',
    color: '#F59E0B',
    tag: 'STEM · HIP HOP',
    live: false,
    viewers: 0,
    host: 'Dr. Muk',
    latestEp: 'Ep.22 — DNA Replication in 16 Bars',
    schedule: 'Wednesdays 8PM ET',
    subs: '8.9K',
    desc: 'STEM × Hip Hop.'
  },
  {
    id: 'pc5',
    name: 'Washington Classic VOD',
    avatar: '🏆',
    color: '#FFD700',
    tag: 'TOURNAMENT · VOD',
    live: false,
    viewers: 0,
    host: 'Cali Bones × Domino Entertainment',
    latestEp: 'Full Replay: Round 1 — All Matches',
    schedule: 'On demand',
    subs: '12.4K',
    desc: 'Full replays of the Washington Classic Domino Tournament.'
  }
];

export default function PortalTab({ addToast }) {
  var [active, setActive] = useState(null);
  var [layout, setLayout] = useState('grid');

  function openChannel(ch) {
    setActive(ch);
    addToast(ch.avatar + ' Opening ' + ch.name + ' portal...', 'info');
  }

  function handleFeature() {
    addToast('📺 Now featuring ' + active.name + ' on your stream!', 'info');
  }

  function handleFollow() {
    addToast(active.avatar + ' Following ' + active.name + '!', 'success');
  }

  function handleShare() {
    addToast('📤 Shared ' + active.name + ' to chat!', 'info');
  }

  if (active) {
    var others = PORTAL_CHANNELS.filter(function(ch) { return ch.id !== active.id; }).slice(0, 3);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: BG1 }}>

        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid ' + BORDER, background: GLASS, flexShrink: 0 }}>
          <button
            onClick={function() { setActive(null); }}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid ' + BORDER, borderRadius: 7, padding: '6px 12px', color: TEXT, fontFamily: fU, fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>
            ← BACK
          </button>
          <div style={{ flex: 1, fontFamily: fD, fontSize: 18, color: TEXT, letterSpacing: 2 }}>{active.avatar} {active.name}</div>
          <button
            onClick={handleFeature}
            style={{ background: 'linear-gradient(135deg,' + BURG + ',' + BURG_H + ')', border: 'none', borderRadius: 8, padding: '7px 18px', color: GOLD_H, fontFamily: fU, fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
            📺 FEATURE
          </button>
        </div>

        {/* Simulated embed area */}
        <div style={{ height: 200, background: 'radial-gradient(ellipse at center, ' + active.color + '22 0%, #07050A 70%)', border: '1px solid ' + active.color + '44', margin: '14px 14px 0 14px', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', flexShrink: 0 }}>
          <div style={{ fontSize: 52 }}>{active.avatar}</div>
          <div style={{ fontFamily: fD, fontSize: 15, color: TEXT, letterSpacing: 2, textAlign: 'center', padding: '0 20px' }}>{active.latestEp}</div>
          {active.live && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(192,24,56,.18)', border: '1px solid rgba(192,24,56,.5)', borderRadius: 999, padding: '4px 12px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: BURG_H, boxShadow: '0 0 8px ' + BURG_H }} />
              <span style={{ fontFamily: fU, fontWeight: 700, fontSize: 11, color: '#FF6680', letterSpacing: 2 }}>LIVE · {fmtN(active.viewers)} viewers</span>
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'repeating-linear-gradient(0deg,rgba(0,0,0,.04) 0px,rgba(0,0,0,.04) 1px,transparent 1px,transparent 4px)', pointerEvents: 'none' }} />
        </div>

        {/* Channel info card */}
        <div style={{ margin: '12px 14px 0 14px', background: FAINT, border: '1px solid ' + BORDER, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontFamily: fM, fontSize: 11, color: MUTED, marginBottom: 6 }}>{active.desc}</div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 8 }}>
            <div>
              <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, letterSpacing: 1, marginBottom: 2 }}>HOST</div>
              <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 12, color: TEXT }}>{active.host}</div>
            </div>
            <div>
              <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, letterSpacing: 1, marginBottom: 2 }}>SCHEDULE</div>
              <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 12, color: TEAL_H }}>{active.schedule}</div>
            </div>
            <div>
              <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, letterSpacing: 1, marginBottom: 2 }}>SUBSCRIBERS</div>
              <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 12, color: GOLD_H }}>{active.subs}</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, margin: '12px 14px 0 14px' }}>
          <button
            onClick={handleFollow}
            style={{ flex: 1, background: 'linear-gradient(135deg,' + active.color + 'CC,' + active.color + '88)', border: '1px solid ' + active.color + '66', borderRadius: 9, padding: '11px 0', color: '#fff', fontFamily: fU, fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
            ❤️ FOLLOW
          </button>
          <button
            onClick={handleShare}
            style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid ' + BORDER, borderRadius: 9, padding: '11px 0', color: TEXT, fontFamily: fU, fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
            📤 SHARE TO CHAT
          </button>
        </div>

        {/* Other channels */}
        <div style={{ margin: '18px 14px 0 14px', flexShrink: 0 }}>
          <div style={{ fontFamily: fD, fontSize: 13, color: MUTED, letterSpacing: 3, marginBottom: 10 }}>MORE PARTNER CHANNELS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {others.map(function(ch) {
              return (
                <div
                  key={ch.id}
                  onClick={function() { openChannel(ch); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: FAINT, border: '1px solid ' + BORDER, borderRadius: 9, padding: '10px 14px', cursor: 'pointer' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: ch.color + '22', border: '1px solid ' + ch.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{ch.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</div>
                    <div style={{ fontFamily: fM, fontSize: 8, color: MUTED }}>{ch.tag}</div>
                  </div>
                  {ch.live && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(192,24,56,.18)', border: '1px solid rgba(192,24,56,.4)', borderRadius: 999, padding: '3px 8px', flexShrink: 0 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: BURG_H }} />
                      <span style={{ fontFamily: fU, fontWeight: 700, fontSize: 9, color: '#FF6680', letterSpacing: 1 }}>LIVE</span>
                    </div>
                  )}
                  <div style={{ fontFamily: fM, fontSize: 9, color: GOLD_H, flexShrink: 0 }}>{ch.subs}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>
    );
  }

  /* ── Grid / List view ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG1, overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid ' + BORDER, flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: fD, fontSize: 20, color: TEXT, letterSpacing: 3 }}>PARTNER PORTAL</div>
          <div style={{ fontFamily: fM, fontSize: 9, color: MUTED, marginTop: 1 }}>Embed & feature Techmunity partner channels</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={function() { setLayout('grid'); }}
            style={{ background: layout === 'grid' ? 'rgba(232,196,106,.12)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (layout === 'grid' ? 'rgba(232,196,106,.4)' : BORDER), borderRadius: 7, padding: '6px 12px', color: layout === 'grid' ? GOLD_H : MUTED, fontFamily: fU, fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
            ⊞ GRID
          </button>
          <button
            onClick={function() { setLayout('list'); }}
            style={{ background: layout === 'list' ? 'rgba(232,196,106,.12)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (layout === 'list' ? 'rgba(232,196,106,.4)' : BORDER), borderRadius: 7, padding: '6px 12px', color: layout === 'list' ? GOLD_H : MUTED, fontFamily: fU, fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
            ≡ LIST
          </button>
        </div>
      </div>

      {/* Channels */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {layout === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PORTAL_CHANNELS.map(function(ch) {
              return (
                <div
                  key={ch.id}
                  onClick={function() { openChannel(ch); }}
                  style={{ background: FAINT, border: '1px solid ' + BORDER, borderRadius: 12, padding: '14px 12px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,' + ch.color + ',' + ch.color + '44)' }} />
                  <div style={{ fontSize: 30, textAlign: 'center', marginBottom: 8 }}>{ch.avatar}</div>
                  <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: TEXT, textAlign: 'center', lineHeight: 1.2, marginBottom: 4 }}>{ch.name}</div>
                  <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, textAlign: 'center', marginBottom: 8 }}>{ch.tag}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {ch.live ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(192,24,56,.18)', border: '1px solid rgba(192,24,56,.5)', borderRadius: 999, padding: '3px 8px' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: BURG_H, boxShadow: '0 0 6px ' + BURG_H }} />
                        <span style={{ fontFamily: fU, fontWeight: 700, fontSize: 9, color: '#FF6680', letterSpacing: 1 }}>LIVE</span>
                      </div>
                    ) : (
                      <span style={{ fontFamily: fM, fontSize: 8, color: MUTED }}>offline</span>
                    )}
                    <span style={{ fontFamily: fM, fontSize: 8, color: GOLD_H }}>{ch.subs}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PORTAL_CHANNELS.map(function(ch) {
              return (
                <div
                  key={ch.id}
                  onClick={function() { openChannel(ch); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, background: FAINT, border: '1px solid ' + BORDER, borderRadius: 11, padding: '12px 16px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: ch.color }} />
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: ch.color + '22', border: '1px solid ' + ch.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{ch.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 14, color: TEXT }}>{ch.name}</div>
                    <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginTop: 1 }}>{ch.tag}</div>
                    <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.latestEp}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                    {ch.live ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(192,24,56,.18)', border: '1px solid rgba(192,24,56,.5)', borderRadius: 999, padding: '3px 8px' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: BURG_H, boxShadow: '0 0 6px ' + BURG_H }} />
                        <span style={{ fontFamily: fU, fontWeight: 700, fontSize: 9, color: '#FF6680', letterSpacing: 1 }}>LIVE · {fmtN(ch.viewers)}</span>
                      </div>
                    ) : (
                      <span style={{ fontFamily: fM, fontSize: 8, color: MUTED }}>offline</span>
                    )}
                    <span style={{ fontFamily: fM, fontSize: 8, color: GOLD_H }}>{ch.subs} subs</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
