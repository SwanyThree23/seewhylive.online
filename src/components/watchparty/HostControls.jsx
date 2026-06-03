import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, MessageSquare, Mic, Video, Volume2, Users, Shield,
  ChevronDown, ChevronUp, Lock, Unlock, Pin, PinOff, Clock,
  UserX, UserCheck, Crown, Radio, Timer, AlertCircle, Sword
} from 'lucide-react';

const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const PINK = '#FF1564';
const GREEN = '#00FF88';

function Toggle({ on, onChange }) {
  return (
    <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 99, background: on ? CRIMSON : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <motion.div animate={{ x: on ? 19 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff' }} />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ ...T, fontSize: 8, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>
      {children}
    </p>
  );
}

export default function HostControls({
  isHost,
  isCoHost = false,
  party,
  onUpdate,
  members = [],
  pinnedMessage = '',
  onPinMessage,
  slowMode = false,
  slowModeCooldown = 30,
  onSlowMode,
  // Controlled countdown (lifted to parent so viewers see it)
  countdown = null,
  onStartCountdown,
  onCancelCountdown,
}) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('room');
  const [settings, setSettings] = useState({
    chatEnabled: true,
    reactionsEnabled: true,
    guestMicEnabled: true,
    guestVideoEnabled: true,
    playlistEnabled: true,
    battlesEnabled: true,
    roomLocked: false,
    recordingEnabled: false,
    maxViewers: 20,
    theme: 'dark',
  });
  const [localPinned, setLocalPinned] = useState(pinnedMessage);
  const [slowLocal, setSlowLocal] = useState(slowMode);
  const [cooldownLocal, setCooldownLocal] = useState(slowModeCooldown);
  const [countdownInput, setCountdownInput] = useState('5');

  const canControl = isHost || isCoHost;
  if (!canControl) return null;

  const toggle = (key) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      onUpdate?.(updated);
      return updated;
    });
  };

  const startCountdown = () => {
    const secs = parseInt(countdownInput, 10) * 60;
    if (!secs || secs < 60) return;
    onStartCountdown?.(secs);
  };

  const fmtCountdown = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const ROOM_TOGGLES = [
    { key: 'chatEnabled',       label: 'Party Chat',     icon: MessageSquare },
    { key: 'reactionsEnabled',  label: 'Reactions',      icon: Volume2 },
    { key: 'guestMicEnabled',   label: 'Guest Mics',     icon: Mic },
    { key: 'guestVideoEnabled', label: 'Guest Cameras',  icon: Video },
    { key: 'playlistEnabled',   label: 'Collab Queue',   icon: Users },
    { key: 'battlesEnabled',    label: 'Battles',        icon: Sword },
    { key: 'roomLocked',        label: 'Lock Room',      icon: Lock },
    { key: 'recordingEnabled',  label: 'Record Session', icon: Radio },
  ];

  const THEMES = [
    { id: 'dark',   label: 'Dark',   color: '#0B0B18' },
    { id: 'cinema', label: 'Cinema', color: '#1A0F0A' },
    { id: 'neon',   label: 'Neon',   color: '#0d0618' },
    { id: 'forest', label: 'Forest', color: '#0a1a0a' },
  ];

  const SECTIONS = [
    { id: 'room',     label: 'Room',    icon: Settings },
    { id: 'moderate', label: 'Mod',     icon: Shield },
    { id: 'timer',    label: 'Timer',   icon: Timer },
  ];

  const coHosts = members.filter(m => m.role === 'cohost');
  const panelists = members.filter(m => m.role !== 'host' && m.role !== 'cohost');

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(7,7,15,0.97)', border: '1px solid rgba(212,175,55,0.18)' }}>
      {/* Header toggle */}
      <button className="w-full flex items-center gap-2 px-3 py-2 transition-all"
        style={{ background: 'rgba(0,0,0,0.3)', borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
        onClick={() => setOpen(v => !v)}>
        <Settings className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest flex-1 text-left" style={{ ...T, color: GOLD }}>
          {isHost ? 'Host Controls' : 'Co-Host Controls'}
        </span>
        {countdown !== null && (
          <span className="text-[9px] px-1.5 py-0.5 rounded font-black" style={{ background: 'rgba(255,21,100,0.2)', color: PINK, ...T }}>
            ⏱ {fmtCountdown(countdown)}
          </span>
        )}
        {open ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">

            {/* Section tabs */}
            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveSection(id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[9px] font-black uppercase transition-all"
                  style={{ ...T, color: activeSection === id ? GOLD : 'rgba(255,255,255,0.3)', borderBottom: activeSection === id ? `2px solid ${GOLD}` : '2px solid transparent', background: activeSection === id ? 'rgba(212,175,55,0.06)' : 'transparent' }}>
                  <Icon className="w-2.5 h-2.5" /> {label}
                </button>
              ))}
            </div>

            <div className="p-3 space-y-3">

              {/* ── ROOM SETTINGS ── */}
              {activeSection === 'room' && (
                <>
                  <SectionLabel>Room Toggles</SectionLabel>
                  <div className="space-y-2">
                    {ROOM_TOGGLES.map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3 h-3" style={{ color: settings[key] ? GOLD : 'rgba(255,255,255,0.3)' }} />
                          <span style={{ ...T, fontSize: 10, fontWeight: 700, color: settings[key] ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)' }}>{label}</span>
                        </div>
                        <Toggle on={settings[key]} onChange={() => toggle(key)} />
                      </div>
                    ))}
                  </div>

                  {/* Slow mode */}
                  <div className="pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <SectionLabel>Slow Mode</SectionLabel>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ ...T, fontSize: 10, fontWeight: 700, color: slowLocal ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)' }}>
                        <Clock className="w-3 h-3 inline mr-1.5" style={{ color: slowLocal ? GOLD : 'rgba(255,255,255,0.3)' }} />
                        {slowLocal ? `${cooldownLocal}s cooldown` : 'Off'}
                      </span>
                      <Toggle on={slowLocal} onChange={() => { const v = !slowLocal; setSlowLocal(v); onSlowMode?.(v, cooldownLocal); }} />
                    </div>
                    {slowLocal && (
                      <div className="flex gap-1.5">
                        {[10, 30, 60, 120].map(s => (
                          <button key={s} onClick={() => { setCooldownLocal(s); onSlowMode?.(true, s); }}
                            className="flex-1 py-1 rounded text-[9px] font-black transition-all"
                            style={{ ...T, background: cooldownLocal === s ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${cooldownLocal === s ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`, color: cooldownLocal === s ? GOLD : 'rgba(255,255,255,0.35)' }}>
                            {s < 60 ? s + 's' : Math.floor(s/60) + 'm'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pinned message */}
                  <div className="pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <SectionLabel>Pinned Message</SectionLabel>
                    <div className="flex gap-1.5">
                      <input
                        value={localPinned}
                        onChange={e => setLocalPinned(e.target.value)}
                        placeholder="Pin a message to the top of chat…"
                        maxLength={100}
                        style={{ flex: 1, height: 32, padding: '0 10px', fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, outline: 'none', boxSizing: 'border-box', ...T }}
                      />
                      <button
                        onClick={() => onPinMessage?.(localPinned)}
                        style={{ height: 32, padding: '0 10px', background: localPinned ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${localPinned ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`, color: localPinned ? GOLD : 'rgba(255,255,255,0.3)', borderRadius: 8, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        <Pin className="w-3 h-3" />
                      </button>
                      {pinnedMessage && (
                        <button onClick={() => { setLocalPinned(''); onPinMessage?.(''); }}
                          style={{ height: 32, padding: '0 8px', background: 'rgba(255,21,100,0.1)', border: '1px solid rgba(255,21,100,0.2)', color: PINK, borderRadius: 8, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                          <PinOff className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <SectionLabel>Room Theme</SectionLabel>
                    <div className="flex gap-1.5">
                      {THEMES.map(t => (
                        <button key={t.id} onClick={() => setSettings(s => ({ ...s, theme: t.id }))}
                          className="flex-1 py-1.5 rounded-lg text-[8px] font-bold transition-all"
                          style={{ ...T, background: t.color, border: settings.theme === t.id ? `1.5px solid ${GOLD}` : '1px solid rgba(255,255,255,0.1)', color: settings.theme === t.id ? GOLD : 'rgba(255,255,255,0.4)' }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max viewers */}
                  <div className="pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <SectionLabel>Max Viewers: {settings.maxViewers}</SectionLabel>
                    <input type="range" min={4} max={20} step={2} value={settings.maxViewers}
                      onChange={e => setSettings(s => ({ ...s, maxViewers: +e.target.value }))}
                      className="w-full h-1.5 rounded-full appearance-none"
                      style={{ background: `linear-gradient(to right, ${GOLD} ${((settings.maxViewers - 4) / 16) * 100}%, rgba(255,255,255,0.1) 0%)` }} />
                  </div>
                </>
              )}

              {/* ── MODERATION ── */}
              {activeSection === 'moderate' && (
                <>
                  {/* Co-hosts */}
                  {isHost && (
                    <>
                      <SectionLabel>Co-Hosts ({coHosts.length})</SectionLabel>
                      {coHosts.length > 0 ? (
                        <div className="space-y-1.5 mb-2">
                          {coHosts.map(m => (
                            <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                              style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: GOLD, flexShrink: 0 }}>
                                {m.user_name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.7)', flex: 1, fontWeight: 700 }} className="truncate">{m.user_name}</span>
                              <Crown className="w-3 h-3 shrink-0" style={{ color: GOLD }} />
                              <span style={{ ...T, fontSize: 9, color: GOLD }}>Co-Host</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>No co-hosts yet</p>
                      )}

                      <SectionLabel>Panelists ({panelists.length})</SectionLabel>
                      {panelists.length > 0 ? (
                        <div className="space-y-1.5">
                          {panelists.slice(0, 8).map(m => (
                            <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                                {m.user_name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.6)', flex: 1, fontWeight: 700 }} className="truncate">{m.user_name}</span>
                              <button
                                onClick={() => onUpdate?.({ action: 'promote', member: m })}
                                className="w-5 h-5 rounded flex items-center justify-center transition-all"
                                title="Promote to Co-Host"
                                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.2)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; }}>
                                <UserCheck className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => onUpdate?.({ action: 'kick', member: m })}
                                className="w-5 h-5 rounded flex items-center justify-center transition-all"
                                title="Remove from party"
                                style={{ background: 'rgba(255,21,100,0.08)', border: '1px solid rgba(255,21,100,0.15)', color: PINK }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,21,100,0.18)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,21,100,0.08)'; }}>
                                <UserX className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                          {panelists.length > 8 && (
                            <p style={{ ...T, fontSize: 9, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>+{panelists.length - 8} more in Viewers tab</p>
                          )}
                        </div>
                      ) : (
                        <p style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>No panelists yet</p>
                      )}
                    </>
                  )}

                  {/* Co-host sees limited view */}
                  {isCoHost && !isHost && (
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <Shield className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
                      <p style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Co-Host moderation</p>
                      <p style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Use the Viewers tab in the panel to mute or remove participants</p>
                    </div>
                  )}
                </>
              )}

              {/* ── COUNTDOWN TIMER ── */}
              {activeSection === 'timer' && (
                <>
                  <SectionLabel>Event Countdown</SectionLabel>
                  {countdown !== null ? (
                    <div className="text-center py-3 space-y-3">
                      <motion.div
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        style={{ fontSize: 40, fontWeight: 900, color: countdown < 60 ? PINK : GOLD, ...T, letterSpacing: '0.05em' }}>
                        {fmtCountdown(countdown)}
                      </motion.div>
                      <p style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Counting down to event start</p>
                      <button onClick={onCancelCountdown}
                        style={{ ...T, padding: '6px 16px', borderRadius: 8, background: 'rgba(255,21,100,0.12)', border: '1px solid rgba(255,21,100,0.25)', color: PINK, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        Cancel Timer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        Show a visible countdown to viewers before your event starts
                      </p>
                      <div className="flex gap-2">
                        {['3', '5', '10', '15'].map(v => (
                          <button key={v} onClick={() => setCountdownInput(v)}
                            className="flex-1 py-1.5 rounded text-[10px] font-black transition-all"
                            style={{ ...T, background: countdownInput === v ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${countdownInput === v ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`, color: countdownInput === v ? GOLD : 'rgba(255,255,255,0.35)' }}>
                            {v}m
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={countdownInput}
                          onChange={e => setCountdownInput(e.target.value)}
                          placeholder="Minutes"
                          type="number" min="1" max="60"
                          style={{ flex: 1, height: 34, padding: '0 10px', fontSize: 13, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, outline: 'none', boxSizing: 'border-box', ...T }}
                        />
                        <button onClick={startCountdown}
                          style={{ height: 34, padding: '0 14px', background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD}88)`, border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 800, ...T, flexShrink: 0 }}>
                          Start
                        </button>
                      </div>
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                          <p style={{ ...T, fontSize: 9, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                            Countdown appears as a banner overlay for all viewers in the party
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
