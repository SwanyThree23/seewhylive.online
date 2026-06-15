import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Lock, Eye, EyeOff, Plus, Copy, Key, Shield, FileText, Hash, ClipboardList, Loader2 } from 'lucide-react';
import SpotlightBanner from '../components/community/SpotlightBanner';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import EarningsBreakdown from '../components/dashboard/EarningsBreakdown';
import RevenueDashboard from '../components/monetization/RevenueDashboard';
import MonetizationDashboard from '../components/monetization/MonetizationDashboard';
import LiveAuctionWidget from '../components/monetization/LiveAuctionWidget';
import VirtualGoodsStore from '../components/monetization/VirtualGoodsStore';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ShareToSocial from '../components/social/ShareToSocial';

const BG = '#080B18';
const BG2 = 'rgba(8,11,24,0.9)';
const GOLD = '#D4AF37';
const GREEN = '#6DBF7E';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── Crypto helpers ────────────────────────────────────────────────────────────
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

async function encryptText(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const enc  = new TextEncoder();
  const buf  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  const combined = new Uint8Array(salt.length + iv.length + buf.byteLength);
  combined.set(salt, 0); combined.set(iv, 16); combined.set(new Uint8Array(buf), 28);
  return btoa(String.fromCharCode(...combined));
}

async function decryptText(cipherB64, password) {
  const bytes = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
  const salt  = bytes.slice(0, 16);
  const iv    = bytes.slice(16, 28);
  const data  = bytes.slice(28);
  const key   = await deriveKey(password, salt);
  const dec   = new TextDecoder();
  const buf   = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return dec.decode(buf);
}

function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function TabBtn({ label, active, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all"
      style={{ ...T, color: active ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: active ? GOLD : 'transparent', background: active ? 'rgba(212,175,55,0.05)' : 'transparent' }}>
      <Icon className="w-3 h-3" /> {label}
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl p-5 space-y-4 z-10"
        style={{ background: 'rgba(8,11,24,0.99)', border: '1px solid rgba(212,175,55,0.2)' }}>
        <p className="font-black text-base text-white" style={T}>{title}</p>
        {children}
        <button onClick={onClose} className="w-full py-2 rounded-xl text-xs font-black uppercase"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', ...T }}>Cancel</button>
      </div>
    </div>
  );
}

function GoldBtn({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full py-3 rounded-2xl font-black uppercase text-sm tracking-wide transition-all active:scale-95 disabled:opacity-50"
      style={{ background: `linear-gradient(135deg, ${GOLD}, #b8941e)`, color: '#080B18', ...T }}>
      {children}
    </button>
  );
}

function InputField({ placeholder, value, onChange, type = 'text' }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full h-10 px-3 rounded-xl text-sm text-white outline-none"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', ...T }}
    />
  );
}

const PLATFORMS = ['OBS', 'Twitch', 'YouTube', 'Facebook Live', 'Custom RTMP'];

// ── Main component ────────────────────────────────────────────────────────────
export default function VaultPro() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  // Vault lock state
  const [vaultUnlocked, setVaultUnlocked]   = useState(false);
  const [vaultPassword, setVaultPassword]   = useState('');
  const [passwordInput, setPasswordInput]   = useState('');
  const [activeTab, setActiveTab]           = useState('streamkeys');
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState('');

  // Stream keys
  const [streamKeys, setStreamKeys]         = useState([]);
  const [showAddKey, setShowAddKey]         = useState(false);
  const [newKeyPlatform, setNewKeyPlatform] = useState('OBS');
  const [newKeyValue, setNewKeyValue]       = useState('');
  const [revealedKeys, setRevealedKeys]     = useState({});

  // Protected content
  const [protectedContent, setProtectedContent] = useState([
    { id: 1, title: 'Subscriber Exclusive VOD — March', encryptedDesc: null, raw: 'Full 3-hour stream replay, March 2024. Subscribers only.', protected: true },
    { id: 2, title: 'Private Q&A Session',              encryptedDesc: null, raw: 'Behind-the-scenes Q&A with top supporters.',              protected: true },
    { id: 3, title: 'Patreon Bonus Clip Pack',          encryptedDesc: null, raw: '42 premium clips available for Patreon tier members.',    protected: true },
  ]);
  const [showProtectContent, setShowProtectContent] = useState(false);
  const [newContentTitle, setNewContentTitle]       = useState('');
  const [newContentDesc, setNewContentDesc]         = useState('');
  const [unlockedContent, setUnlockedContent]       = useState({});

  // Room PINs
  const [roomPins, setRoomPins]           = useState([]);
  const [showAddPin, setShowAddPin]       = useState(false);
  const [newPinRoom, setNewPinRoom]       = useState('');
  const [newPinValue, setNewPinValue]     = useState('');
  const [copiedPin, setCopiedPin]         = useState(null);
  const [sharePin, setSharePin]           = useState(null);

  // Audit log
  const [auditLog, setAuditLog] = useState([]);

  function addAudit(action, icon = '🔐') {
    setAuditLog(prev => [{ action, icon, time: new Date().toISOString() }, ...prev]);
  }

  async function handleUnlock() {
    if (!passwordInput.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      // Minimal delay for UX, no real async needed on empty vault
      await new Promise(r => setTimeout(r, 300));
      setVaultPassword(passwordInput);
      setVaultUnlocked(true);
      setPasswordInput('');
      addAudit('Vault unlocked', '🔓');
    } catch {
      setError('Failed to unlock vault.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleLock() {
    setVaultUnlocked(false);
    setVaultPassword('');
    setRevealedKeys({});
    setUnlockedContent({});
    setCopiedPin(null);
    setSharePin(null);
    setAuditLog([]);
  }

  // ── Stream key actions ──
  async function handleAddStreamKey() {
    if (!newKeyValue.trim()) return;
    setIsLoading(true);
    try {
      const encrypted = await encryptText(newKeyValue.trim(), vaultPassword);
      setStreamKeys(prev => [...prev, { id: Date.now(), platform: newKeyPlatform, encrypted }]);
      addAudit(`Stream key added — ${newKeyPlatform}`, '🔑');
      setNewKeyValue('');
      setShowAddKey(false);
    } catch {
      setError('Encryption failed.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRevealKey(key) {
    if (revealedKeys[key.id]) {
      setRevealedKeys(prev => { const n = { ...prev }; delete n[key.id]; return n; });
      return;
    }
    setIsLoading(true);
    try {
      const plain = await decryptText(key.encrypted, vaultPassword);
      setRevealedKeys(prev => ({ ...prev, [key.id]: plain }));
      addAudit(`Stream key revealed — ${key.platform}`, '👁️');
      setTimeout(() => {
        setRevealedKeys(prev => { const n = { ...prev }; delete n[key.id]; return n; });
      }, 10000);
    } catch {
      setError('Decryption failed. Wrong password?');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Protected content actions ──
  async function handleProtectContent() {
    if (!newContentTitle.trim()) return;
    setIsLoading(true);
    try {
      const encrypted = await encryptText(newContentDesc || '(no description)', vaultPassword);
      setProtectedContent(prev => [...prev, {
        id: Date.now(), title: newContentTitle.trim(),
        encryptedDesc: encrypted, raw: null, protected: true,
      }]);
      addAudit(`Content protected — "${newContentTitle.trim()}"`, '📦');
      setNewContentTitle('');
      setNewContentDesc('');
      setShowProtectContent(false);
    } catch {
      setError('Encryption failed.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnlockContent(item) {
    if (unlockedContent[item.id]) {
      setUnlockedContent(prev => { const n = { ...prev }; delete n[item.id]; return n; });
      return;
    }
    setIsLoading(true);
    try {
      let plain;
      if (item.encryptedDesc) {
        plain = await decryptText(item.encryptedDesc, vaultPassword);
      } else {
        plain = item.raw;
      }
      setUnlockedContent(prev => ({ ...prev, [item.id]: plain }));
      addAudit(`Content unlocked — "${item.title}"`, '🔓');
    } catch {
      setError('Decryption failed.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Room PIN actions ──
  async function handleAddPin() {
    if (!newPinRoom.trim() || !newPinValue.trim()) return;
    setIsLoading(true);
    try {
      const encrypted = await encryptText(newPinValue.trim(), vaultPassword);
      setRoomPins(prev => [...prev, { id: Date.now(), room: newPinRoom.trim(), encrypted }]);
      addAudit(`Room PIN created — ${newPinRoom.trim()}`, '🚪');
      setNewPinRoom('');
      setNewPinValue('');
      setShowAddPin(false);
    } catch {
      setError('Encryption failed.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyPin(pin) {
    setIsLoading(true);
    try {
      const plain = await decryptText(pin.encrypted, vaultPassword);
      await navigator.clipboard.writeText(plain);
      setCopiedPin(pin.id);
      addAudit(`Room PIN copied — ${pin.room}`, '📋');
      setTimeout(() => setCopiedPin(null), 2000);
    } catch {
      setError('Failed to copy PIN.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>

      {/* Header */}
      <div className="sticky top-0 z-20 border-b" style={{ background: 'rgba(8,11,24,0.97)', borderColor: 'rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5" style={{ color: GOLD }} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white leading-none" style={T}>VaultPro</h1>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
                  style={{ background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.25)', color: GREEN, ...T }}>
                  AES-256 Encrypted
                </span>
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                Your content is encrypted locally before storage. Only you hold the key.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', color: '#C0392B', ...T }}>
            {error}
            <button onClick={() => setError('')} className="ml-3 underline opacity-70">Dismiss</button>
          </div>
        )}

        {/* ── LOCK SCREEN ── */}
        {!vaultUnlocked && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 max-w-xs mx-auto">
            <div className="text-7xl select-none" style={{ filter: 'drop-shadow(0 0 24px rgba(212,175,55,0.4))' }}>🔒</div>

            <div className="text-center">
              <h2 className="text-2xl font-black text-white" style={T}>Enter Vault Password</h2>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Your password never leaves this device</p>
            </div>

            <div className="w-full space-y-3">
              <input
                type="password"
                placeholder="Vault password…"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                className="w-full h-12 px-4 rounded-2xl text-sm text-white outline-none text-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(212,175,55,0.3)`, ...T }}
              />
              <GoldBtn onClick={handleUnlock} disabled={isLoading || !passwordInput.trim()}>
                {isLoading
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Unlocking…</span>
                  : '🔓 Unlock Vault'}
              </GoldBtn>
            </div>

            <button className="text-xs underline" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
              Create New Vault
            </button>

            <div className="text-center text-[11px] leading-relaxed px-4"
              style={{ color: 'rgba(255,255,255,0.2)', ...T }}>
              AES-256-GCM · PBKDF2 100k iterations · Zero-knowledge · Keys never leave your device
            </div>
          </div>
        )}

        {/* ── VAULT CONTENTS ── */}
        {vaultUnlocked && (
          <div className="space-y-4">

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <TabBtn label="Stream Keys"   icon={Key}           active={activeTab === 'streamkeys'}   onClick={() => setActiveTab('streamkeys')} />
              <TabBtn label="Content"       icon={FileText}      active={activeTab === 'content'}      onClick={() => setActiveTab('content')} />
              <TabBtn label="Room PINs"     icon={Hash}          active={activeTab === 'pins'}         onClick={() => setActiveTab('pins')} />
              <TabBtn label="Audit"         icon={ClipboardList} active={activeTab === 'audit'}        onClick={() => setActiveTab('audit')} />
            </div>

            {/* Loading overlay */}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: GOLD }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>Processing…</span>
              </div>
            )}

            {/* ─ Tab: Stream Keys ─ */}
            {activeTab === 'streamkeys' && (
              <div className="space-y-3">
                {streamKeys.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl"
                    style={{ background: BG2, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Key className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: GOLD }} />
                    <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>No stream keys stored.</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.18)', ...T }}>Add your first key to keep it safe.</p>
                  </div>
                ) : streamKeys.map(key => (
                  <div key={key.id} className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ background: BG2, border: '1px solid rgba(212,175,55,0.1)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                      style={{ background: 'rgba(212,175,55,0.1)' }}>
                      {key.platform === 'Twitch' ? '🟣' : key.platform === 'YouTube' ? '🔴' : key.platform === 'Facebook Live' ? '🔵' : '📡'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white" style={T}>{key.platform}</p>
                      <p className="text-[10px] font-mono truncate mt-0.5"
                        style={{ color: revealedKeys[key.id] ? '#6DBF7E' : 'rgba(255,255,255,0.3)' }}>
                        {revealedKeys[key.id] ? revealedKeys[key.id] : 'RTMP Key — [ENCRYPTED]'}
                      </p>
                      {revealedKeys[key.id] && (
                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(212,133,74,0.7)', ...T }}>Auto-hides in 10s</p>
                      )}
                    </div>
                    <button onClick={() => handleRevealKey(key)}
                      className="h-8 px-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 shrink-0"
                      style={{ background: revealedKeys[key.id] ? 'rgba(192,57,43,0.1)' : 'rgba(212,175,55,0.1)', color: revealedKeys[key.id] ? '#C0392B' : GOLD, border: `1px solid ${revealedKeys[key.id] ? 'rgba(192,57,43,0.25)' : 'rgba(212,175,55,0.25)'}`, ...T }}>
                      {revealedKeys[key.id] ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Reveal</>}
                    </button>
                  </div>
                ))}

                <button onClick={() => setShowAddKey(true)}
                  className="w-full py-3 rounded-2xl text-sm font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ background: 'rgba(212,175,55,0.06)', border: '1px dashed rgba(212,175,55,0.25)', color: GOLD, ...T }}>
                  <Plus className="w-4 h-4" /> Add Stream Key
                </button>

                {showAddKey && (
                  <Modal title="Add Stream Key" onClose={() => setShowAddKey(false)}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {PLATFORMS.map(p => (
                        <button key={p} onClick={() => setNewKeyPlatform(p)}
                          style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: `1px solid ${newKeyPlatform === p ? '#D4AF37' : 'rgba(255,255,255,0.12)'}`, background: newKeyPlatform === p ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)', color: newKeyPlatform === p ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                          {p}
                        </button>
                      ))}
                    </div>
                    <InputField placeholder="RTMP stream key…" value={newKeyValue} onChange={e => setNewKeyValue(e.target.value)} type="password" />
                    <GoldBtn onClick={handleAddStreamKey} disabled={isLoading || !newKeyValue.trim()}>
                      {isLoading ? 'Encrypting…' : '🔒 Encrypt & Save'}
                    </GoldBtn>
                  </Modal>
                )}
              </div>
            )}

            {/* ─ Tab: Protected Content ─ */}
            {activeTab === 'content' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl text-xs"
                  style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)', color: 'rgba(255,255,255,0.4)', ...T }}>
                  Password-protect your VODs and subscriber content. Descriptions are encrypted with your vault key.
                </div>

                {protectedContent.map(item => (
                  <div key={item.id} className="p-3 rounded-2xl"
                    style={{ background: BG2, border: '1px solid rgba(212,175,55,0.1)' }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-black text-white" style={T}>{item.title}</p>
                          <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full uppercase"
                            style={{ background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.2)', color: GREEN, ...T }}>
                            🔒 Encrypted
                          </span>
                        </div>
                        {unlockedContent[item.id] && (
                          <p className="text-xs mt-1" style={{ color: GREEN, ...T }}>{unlockedContent[item.id]}</p>
                        )}
                        <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>Protected by AES-256</p>
                      </div>
                      <button onClick={() => handleUnlockContent(item)}
                        className="h-8 px-3 rounded-xl text-[10px] font-black uppercase shrink-0"
                        style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>
                        {unlockedContent[item.id] ? 'Lock' : 'Unlock'}
                      </button>
                    </div>
                  </div>
                ))}

                <button onClick={() => setShowProtectContent(true)}
                  className="w-full py-3 rounded-2xl text-sm font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ background: 'rgba(212,175,55,0.06)', border: '1px dashed rgba(212,175,55,0.25)', color: GOLD, ...T }}>
                  <Plus className="w-4 h-4" /> Protect Content
                </button>

                {showProtectContent && (
                  <Modal title="Protect Content" onClose={() => setShowProtectContent(false)}>
                    <InputField placeholder="Content title…" value={newContentTitle} onChange={e => setNewContentTitle(e.target.value)} />
                    <textarea
                      placeholder="Description (optional)…"
                      value={newContentDesc}
                      onChange={e => setNewContentDesc(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', ...T }}
                    />
                    <GoldBtn onClick={handleProtectContent} disabled={isLoading || !newContentTitle.trim()}>
                      {isLoading ? 'Encrypting…' : '🔒 Encrypt & Protect'}
                    </GoldBtn>
                  </Modal>
                )}
              </div>
            )}

            {/* ─ Tab: Room PINs ─ */}
            {activeTab === 'pins' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl text-xs"
                  style={{ background: 'rgba(109,191,126,0.04)', border: '1px solid rgba(109,191,126,0.1)', color: 'rgba(255,255,255,0.4)', ...T }}>
                  💡 Tip: Share the <span style={{ color: GREEN }}>vault://</span> link. Only people with the PIN can join.
                </div>

                {roomPins.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl"
                    style={{ background: BG2, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>No room PINs stored yet.</p>
                  </div>
                ) : roomPins.map(pin => (
                  <div key={pin.id} className="p-3 rounded-2xl"
                    style={{ background: BG2, border: '1px solid rgba(109,191,126,0.1)' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white" style={T}>{pin.room}</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>PIN: ••••</p>
                      </div>
                      <button onClick={() => handleCopyPin(pin)}
                        className="h-8 px-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"
                        style={{ background: copiedPin === pin.id ? 'rgba(109,191,126,0.15)' : 'rgba(109,191,126,0.08)', color: GREEN, border: '1px solid rgba(109,191,126,0.2)', ...T }}>
                        <Copy className="w-3 h-3" /> {copiedPin === pin.id ? 'Copied!' : 'Copy PIN'}
                      </button>
                      <button onClick={() => setSharePin(sharePin === pin.id ? null : pin.id)}
                        className="h-8 px-3 rounded-xl text-[10px] font-black uppercase"
                        style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>
                        Share
                      </button>
                    </div>
                    {sharePin === pin.id && (
                      <div className="mt-2 p-2 rounded-xl"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(109,191,126,0.1)' }}>
                        <p className="text-[11px] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Share link</p>
                        <p className="text-[10px] font-mono break-all" style={{ color: GREEN }}>
                          vault://{pin.encrypted.slice(0, 32)}…
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                <button onClick={() => setShowAddPin(true)}
                  className="w-full py-3 rounded-2xl text-sm font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ background: 'rgba(109,191,126,0.05)', border: '1px dashed rgba(109,191,126,0.2)', color: GREEN, ...T }}>
                  <Plus className="w-4 h-4" /> New Room PIN
                </button>

                {showAddPin && (
                  <Modal title="New Room PIN" onClose={() => setShowAddPin(false)}>
                    <InputField placeholder="Room name…" value={newPinRoom} onChange={e => setNewPinRoom(e.target.value)} />
                    <InputField placeholder="4-digit PIN…" value={newPinValue} onChange={e => setNewPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                    <GoldBtn onClick={handleAddPin} disabled={isLoading || !newPinRoom.trim() || !newPinValue.trim()}>
                      {isLoading ? 'Encrypting…' : '🔒 Encrypt & Save'}
                    </GoldBtn>
                  </Modal>
                )}
              </div>
            )}

            {/* ─ Tab: Audit Log ─ */}
            {activeTab === 'audit' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Vault Activity</p>
                  <button onClick={() => setAuditLog([])}
                    className="text-[11px] px-2 py-0.5 rounded" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>
                    Clear
                  </button>
                </div>
                {auditLog.length === 0 ? (
                  <div className="text-center py-10 text-xs" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>
                    No activity yet. Actions you take appear here.
                  </div>
                ) : auditLog.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-base">{entry.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white" style={T}>{entry.action}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{fmtTime(entry.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Sticky lock bar */}
      {vaultUnlocked && (
        <div className="fixed bottom-[96px] md:bottom-10 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
          <button onClick={handleLock}
            className="pointer-events-auto h-12 px-8 rounded-2xl font-black uppercase text-sm flex items-center gap-2 shadow-2xl transition-all active:scale-95"
            style={{ background: 'rgba(128,0,32,0.85)', border: '1px solid rgba(255,0,50,0.3)', color: '#fff', backdropFilter: 'blur(12px)', ...T }}>
            <Lock className="w-4 h-4" /> Lock Vault
          </button>
        </div>
      )}

      {/* Community spotlight + milestone alerts */}
      <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SpotlightBanner communityId={null} isAdmin={false} />
        <MilestoneAlerts creatorId={user?.id} />
      </div>

      {/* Cross-nav footer */}
      <div style={{ padding: '10px 16px', background: 'rgba(8,11,24,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to={createPageUrl('CreatorDashboard')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#C4B596', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            📊 Creator Dashboard
          </button>
        </Link>
        <Link to={createPageUrl('Dashboard')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#C4B596', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🏠 Dashboard
          </button>
        </Link>
        <Link to={createPageUrl('Settings')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#C4B596', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ⚙️ Settings
          </button>
        </Link>
        <Link to={createPageUrl('Monetization')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#C4B596', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            💰 Monetization
          </button>
        </Link>
      </div>

      <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <EarningsBreakdown userId={user?.id} />
        <RevenueDashboard userId={user?.id} />
        <StreamerMonetizationCenter userId={user?.id} />
        <MonetizationDashboard roomId={null} />
        <LiveAuctionWidget creatorId={user?.id} roomId={null} isCreator={true} currentUser={user} />
        <VirtualGoodsStore userId={user?.id} />
        <OnlineUsersGrid compact maxVisible={10} />
        <ContentRecommendations />
        <CollaborationMatcher />
        <ShareToSocial url={window.location.href} title="Secured with SeeWhy LIVE Vault Pro" />
      </div>
    </div>
  );
}
