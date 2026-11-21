import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Lock, Eye, EyeOff, Plus, Copy, Key, FileText, Hash, ClipboardList, Loader2, Zap, Check } from 'lucide-react';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import AlertConfig from '../components/live/AlertConfig';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import ShopDashboard from '../components/merch/ShopDashboard';
import CreatorBridge from '../components/social/CreatorBridge';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';

var BG = '#080B18';
var BG2 = 'rgba(8,11,24,0.9)';
var GOLD = '#D4AF37';
var GREEN = '#6DBF7E';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── Crypto helpers ────────────────────────────────────────────────────────────
async function deriveKey(password, salt) {
  var enc = new TextEncoder();
  var keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

async function encryptText(plaintext, password) {
  var salt = crypto.getRandomValues(new Uint8Array(16));
  var iv   = crypto.getRandomValues(new Uint8Array(12));
  var key  = await deriveKey(password, salt);
  var enc  = new TextEncoder();
  var buf  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  var combined = new Uint8Array(salt.length + iv.length + buf.byteLength);
  combined.set(salt, 0); combined.set(iv, 16); combined.set(new Uint8Array(buf), 28);
  return btoa(String.fromCharCode(...combined));
}

async function decryptText(cipherB64, password) {
  var bytes = Uint8Array.from(atob(cipherB64), function(c) { return c.charCodeAt(0); });
  var salt  = bytes.slice(0, 16);
  var iv    = bytes.slice(16, 28);
  var data  = bytes.slice(28);
  var key   = await deriveKey(password, salt);
  var dec   = new TextDecoder();
  var buf   = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return dec.decode(buf);
}

function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function TabBtn(props) {
  var label = props.label;
  var active = props.active;
  var Icon = props.icon;
  var onClick = props.onClick;
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all"
      style={Object.assign({ color: active ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: active ? GOLD : 'transparent', background: active ? 'rgba(212,175,55,0.05)' : 'transparent' }, T)}>
      <Icon className="w-3 h-3" /> {label}
    </button>
  );
}

function Modal(props) {
  var title = props.title;
  var onClose = props.onClose;
  var children = props.children;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl p-5 space-y-4 z-10"
        style={{ background: 'rgba(8,11,24,0.99)', border: '1px solid rgba(212,175,55,0.2)' }}>
        <p className="font-black text-base text-white" style={T}>{title}</p>
        {children}
        <button onClick={onClose} className="w-full py-2 rounded-xl text-xs font-black uppercase"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Cancel</button>
      </div>
    </div>
  );
}

function GoldBtn(props) {
  var onClick = props.onClick;
  var children = props.children;
  var disabled = props.disabled;
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full py-3 rounded-2xl font-black uppercase text-sm tracking-wide transition-all active:scale-95 disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg, ' + GOLD + ', #b8941e)', color: '#080B18', fontFamily: 'Barlow Condensed, sans-serif' }}>
      {children}
    </button>
  );
}

function InputField(props) {
  var placeholder = props.placeholder;
  var value = props.value;
  var onChange = props.onChange;
  var type = props.type || 'text';
  var maxLength = props.maxLength;
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      className="w-full h-10 px-3 rounded-xl text-sm text-white outline-none"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'Barlow Condensed, sans-serif' }}
    />
  );
}

var PLATFORMS = ['OBS', 'Twitch', 'YouTube', 'Facebook Live', 'Custom RTMP'];

// ── Main component ────────────────────────────────────────────────────────────
export default function VaultPro() {
  var userQuery = useQuery({ queryKey: ['currentUser'], queryFn: function() { return base44.auth.me(); } });
  var user = userQuery.data || null;
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, null);
  // Vault lock state
  var vaultUnlockedState = useState(false);
  var vaultUnlocked = vaultUnlockedState[0];
  var setVaultUnlocked = vaultUnlockedState[1];
  var vaultPasswordState = useState('');
  var vaultPassword = vaultPasswordState[0];
  var setVaultPassword = vaultPasswordState[1];
  var passwordInputState = useState('');
  var passwordInput = passwordInputState[0];
  var setPasswordInput = passwordInputState[1];
  var activeTabState = useState('streamkeys');
  var activeTab = activeTabState[0];
  var setActiveTab = activeTabState[1];
  var isLoadingState = useState(false);
  var isLoading = isLoadingState[0];
  var setIsLoading = isLoadingState[1];
  var errorState = useState('');
  var error = errorState[0];
  var setError = errorState[1];

  // Stream keys — loaded from localStorage (encrypted blobs are safe to store)
  var streamKeysState = useState(function() {
    try { return JSON.parse(localStorage.getItem('swl_vault_streamkeys') || '[]'); } catch { return []; }
  });
  var streamKeys = streamKeysState[0];
  var setStreamKeys = streamKeysState[1];
  var showAddKeyState = useState(false);
  var showAddKey = showAddKeyState[0];
  var setShowAddKey = showAddKeyState[1];
  var newKeyPlatformState = useState('OBS');
  var newKeyPlatform = newKeyPlatformState[0];
  var setNewKeyPlatform = newKeyPlatformState[1];
  var newKeyValueState = useState('');
  var newKeyValue = newKeyValueState[0];
  var setNewKeyValue = newKeyValueState[1];
  var revealedKeysState = useState({});
  var revealedKeys = revealedKeysState[0];
  var setRevealedKeys = revealedKeysState[1];

  // Protected content — loaded from localStorage
  var protectedContentState = useState(function() {
    try { return JSON.parse(localStorage.getItem('swl_vault_content') || '[]'); } catch { return []; }
  });
  var protectedContent = protectedContentState[0];
  var setProtectedContent = protectedContentState[1];
  var showProtectContentState = useState(false);
  var showProtectContent = showProtectContentState[0];
  var setShowProtectContent = showProtectContentState[1];
  var newContentTitleState = useState('');
  var newContentTitle = newContentTitleState[0];
  var setNewContentTitle = newContentTitleState[1];
  var newContentDescState = useState('');
  var newContentDesc = newContentDescState[0];
  var setNewContentDesc = newContentDescState[1];
  var unlockedContentState = useState({});
  var unlockedContent = unlockedContentState[0];
  var setUnlockedContent = unlockedContentState[1];

  // Room PINs — loaded from localStorage
  var roomPinsState = useState(function() {
    try { return JSON.parse(localStorage.getItem('swl_vault_pins') || '[]'); } catch { return []; }
  });
  var roomPins = roomPinsState[0];
  var setRoomPins = roomPinsState[1];
  var showAddPinState = useState(false);
  var showAddPin = showAddPinState[0];
  var setShowAddPin = showAddPinState[1];
  var newPinRoomState = useState('');
  var newPinRoom = newPinRoomState[0];
  var setNewPinRoom = newPinRoomState[1];
  var newPinValueState = useState('');
  var newPinValue = newPinValueState[0];
  var setNewPinValue = newPinValueState[1];
  var copiedPinState = useState(null);
  var copiedPin = copiedPinState[0];
  var setCopiedPin = copiedPinState[1];
  var sharePinState = useState(null);
  var sharePin = sharePinState[0];
  var setSharePin = sharePinState[1];

  // Audit log
  var auditLogState = useState([]);
  var auditLog = auditLogState[0];
  var setAuditLog = auditLogState[1];

  // AI API Keys (plain localStorage, not vault-encrypted)
  var AI_SERVICES = [
    { id: 'openrouter', label: 'OpenRouter', desc: 'Multi-model routing (GPT-4, Claude, Gemini, Llama)', link: 'https://openrouter.ai/keys', placeholder: 'sk-or-v1-…' },
    { id: 'anthropic',  label: 'Anthropic',  desc: 'Claude API direct access',                          link: 'https://console.anthropic.com', placeholder: 'sk-ant-…' },
    { id: 'openai',     label: 'OpenAI',     desc: 'GPT-4o, Whisper, TTS',                              link: 'https://platform.openai.com/api-keys', placeholder: 'sk-…' },
    { id: 'elevenlabs', label: 'ElevenLabs', desc: 'Voice synthesis & cloning',                         link: 'https://elevenlabs.io/app/settings/api-keys', placeholder: 'Your EL key…' },
    { id: 'deepgram',   label: 'Deepgram',   desc: 'Real-time speech-to-text',                         link: 'https://console.deepgram.com', placeholder: 'Token…' },
    { id: 'wispr',      label: 'WisperFlo',  desc: 'AI voice automation',                               link: 'https://wispr.io', placeholder: 'API key…' },
  ];

  var aiKeysState = useState(function() {
    var obj = {};
    AI_SERVICES.forEach(function(s) {
      try { obj[s.id] = localStorage.getItem('swl_apikey_' + s.id) || ''; } catch { obj[s.id] = ''; }
    });
    return obj;
  });
  var aiKeys = aiKeysState[0];
  var setAiKeys = aiKeysState[1];
  var aiRevealedState = useState({});
  var aiRevealed = aiRevealedState[0];
  var setAiRevealed = aiRevealedState[1];
  var aiEditingState = useState({});
  var aiEditing = aiEditingState[0];
  var setAiEditing = aiEditingState[1];
  var aiSavedState = useState({});
  var aiSaved = aiSavedState[0];
  var setAiSaved = aiSavedState[1];
  var aiCopiedState = useState({});
  var aiCopied = aiCopiedState[0];
  var setAiCopied = aiCopiedState[1];

  function saveAiKey(id) {
    try {
      localStorage.setItem('swl_apikey_' + id, aiKeys[id]);
      setAiSaved(function(p) { var n = Object.assign({}, p); n[id] = true; return n; });
      setTimeout(function() { setAiSaved(function(p) { var n = Object.assign({}, p); n[id] = false; return n; }); }, 1800);
      setAiEditing(function(p) { var n = Object.assign({}, p); n[id] = false; return n; });
      var svc = AI_SERVICES.find(function(s) { return s.id === id; });
      addAudit('AI key saved — ' + (svc && svc.label || id), '🔑');
    } catch {
      setError('Could not save key.');
    }
  }

  function clearAiKey(id) {
    try {
      localStorage.removeItem('swl_apikey_' + id);
      setAiKeys(function(p) { var n = Object.assign({}, p); n[id] = ''; return n; });
      setAiRevealed(function(p) { var n = Object.assign({}, p); n[id] = false; return n; });
      var svc = AI_SERVICES.find(function(s) { return s.id === id; });
      addAudit('AI key cleared — ' + (svc && svc.label || id), '🗑️');
    } catch {}
  }

  function addAudit(action, icon) {
    var iconVal = icon || '🔐';
    setAuditLog(function(prev) { return [{ action: action, icon: iconVal, time: new Date().toISOString() }].concat(prev); });
  }

  // Persist encrypted vault data to localStorage whenever it changes
  useEffect(function() {
    try { localStorage.setItem('swl_vault_streamkeys', JSON.stringify(streamKeys)); } catch {}
  }, [streamKeys]);

  useEffect(function() {
    try { localStorage.setItem('swl_vault_content', JSON.stringify(protectedContent)); } catch {}
  }, [protectedContent]);

  useEffect(function() {
    try { localStorage.setItem('swl_vault_pins', JSON.stringify(roomPins)); } catch {}
  }, [roomPins]);

  async function handleUnlock() {
    if (!passwordInput.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      // Minimal delay for UX, no real async needed on empty vault
      await new Promise(function(r) { setTimeout(r, 300); });
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
      var encrypted = await encryptText(newKeyValue.trim(), vaultPassword);
      setStreamKeys(function(prev) { return prev.concat([{ id: Date.now(), platform: newKeyPlatform, encrypted: encrypted }]); });
      addAudit('Stream key added — ' + newKeyPlatform, '🔑');
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
      setRevealedKeys(function(prev) { var n = Object.assign({}, prev); delete n[key.id]; return n; });
      return;
    }
    setIsLoading(true);
    try {
      var plain = await decryptText(key.encrypted, vaultPassword);
      setRevealedKeys(function(prev) { var n = Object.assign({}, prev); n[key.id] = plain; return n; });
      addAudit('Stream key revealed — ' + key.platform, '👁️');
      setTimeout(function() {
        setRevealedKeys(function(prev) { var n = Object.assign({}, prev); delete n[key.id]; return n; });
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
      var encrypted = await encryptText(newContentDesc || '(no description)', vaultPassword);
      setProtectedContent(function(prev) { return prev.concat([{ id: Date.now(), title: newContentTitle.trim(), encryptedDesc: encrypted, raw: null, protected: true }]); });
      addAudit('Content protected — "' + newContentTitle.trim() + '"', '📦');
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
      setUnlockedContent(function(prev) { var n = Object.assign({}, prev); delete n[item.id]; return n; });
      return;
    }
    setIsLoading(true);
    try {
      var plain;
      if (item.encryptedDesc) {
        plain = await decryptText(item.encryptedDesc, vaultPassword);
      } else {
        plain = item.raw;
      }
      setUnlockedContent(function(prev) { var n = Object.assign({}, prev); n[item.id] = plain; return n; });
      addAudit('Content unlocked — "' + item.title + '"', '🔓');
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
      var encrypted = await encryptText(newPinValue.trim(), vaultPassword);
      setRoomPins(function(prev) { return prev.concat([{ id: Date.now(), room: newPinRoom.trim(), encrypted: encrypted }]); });
      addAudit('Room PIN created — ' + newPinRoom.trim(), '🚪');
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
      var plain = await decryptText(pin.encrypted, vaultPassword);
      await navigator.clipboard.writeText(plain);
      setCopiedPin(pin.id);
      addAudit('Room PIN copied — ' + pin.room, '📋');
      setTimeout(function() { setCopiedPin(null); }, 2000);
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
                  style={{ background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.25)', color: GREEN, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  AES-256 Encrypted
                </span>
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
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
            style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif' }}>
            {error}
            <button onClick={function() { setError(''); }} className="ml-3 underline opacity-70">Dismiss</button>
          </div>
        )}

        {/* ── LOCK SCREEN ── */}
        {!vaultUnlocked && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 max-w-xs mx-auto">
            <div className="text-7xl select-none" style={{ filter: 'drop-shadow(0 0 24px rgba(212,175,55,0.4))' }}>🔒</div>

            <div className="text-center">
              <h2 className="text-2xl font-black text-white" style={T}>Enter Vault Password</h2>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>Your password never leaves this device</p>
            </div>

            <div className="w-full space-y-3">
              <input
                type="password"
                placeholder="Vault password…"
                value={passwordInput}
                onChange={function(e) { setPasswordInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') { handleUnlock(); } }}
                className="w-full h-12 px-4 rounded-2xl text-sm text-white outline-none text-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}
              />
              <GoldBtn onClick={handleUnlock} disabled={isLoading || !passwordInput.trim()}>
                {isLoading
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Unlocking…</span>
                  : '🔓 Unlock Vault'}
              </GoldBtn>
            </div>

            <button className="text-xs underline" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Create New Vault
            </button>

            <div className="text-center text-[11px] leading-relaxed px-4"
              style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              AES-256-GCM · PBKDF2 100k iterations · Zero-knowledge · Keys never leave your device
            </div>
          </div>
        )}

        {/* ── VAULT CONTENTS ── */}
        {vaultUnlocked && (
          <div className="space-y-4">

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <TabBtn label="Stream Keys"   icon={Key}           active={activeTab === 'streamkeys'}   onClick={function() { setActiveTab('streamkeys'); }} />
              <TabBtn label="AI Keys"       icon={Zap}           active={activeTab === 'aikeys'}       onClick={function() { setActiveTab('aikeys'); }} />
              <TabBtn label="Content"       icon={FileText}      active={activeTab === 'content'}      onClick={function() { setActiveTab('content'); }} />
              <TabBtn label="Room PINs"     icon={Hash}          active={activeTab === 'pins'}         onClick={function() { setActiveTab('pins'); }} />
              <TabBtn label="Audit"         icon={ClipboardList} active={activeTab === 'audit'}        onClick={function() { setActiveTab('audit'); }} />
            </div>

            {/* Loading overlay */}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: GOLD }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Processing…</span>
              </div>
            )}

            {/* ─ Tab: Stream Keys ─ */}
            {activeTab === 'streamkeys' && (
              <div className="space-y-3">
                {streamKeys.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl"
                    style={{ background: BG2, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Key className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: GOLD }} />
                    <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>No stream keys stored.</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.18)', fontFamily: 'Barlow Condensed, sans-serif' }}>Add your first key to keep it safe.</p>
                  </div>
                ) : streamKeys.map(function(key) { return (
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
                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(212,133,74,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>Auto-hides in 10s</p>
                      )}
                    </div>
                    <button onClick={function() { handleRevealKey(key); }}
                      className="h-8 px-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 shrink-0"
                      style={{ background: revealedKeys[key.id] ? 'rgba(192,57,43,0.1)' : 'rgba(212,175,55,0.1)', color: revealedKeys[key.id] ? '#C0392B' : GOLD, border: '1px solid ' + (revealedKeys[key.id] ? 'rgba(192,57,43,0.25)' : 'rgba(212,175,55,0.25)'), fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {revealedKeys[key.id] ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Reveal</>}
                    </button>
                    <button onClick={function() { setStreamKeys(function(prev) { return prev.filter(function(k) { return k.id !== key.id; }); }); addAudit('Stream key deleted — ' + key.platform, '🗑️'); }}
                      className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.2)' }}
                      title="Delete key">✕</button>
                  </div>
                ); })}

                <button onClick={function() { setShowAddKey(true); }}
                  className="w-full py-3 rounded-2xl text-sm font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ background: 'rgba(212,175,55,0.06)', border: '1px dashed rgba(212,175,55,0.25)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  <Plus className="w-4 h-4" /> Add Stream Key
                </button>

                {showAddKey && (
                  <Modal title="Add Stream Key" onClose={function() { setShowAddKey(false); }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {PLATFORMS.map(function(p) { return (
                        <button key={p} onClick={function() { setNewKeyPlatform(p); }}
                          style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: '1px solid ' + (newKeyPlatform === p ? '#D4AF37' : 'rgba(255,255,255,0.12)'), background: newKeyPlatform === p ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)', color: newKeyPlatform === p ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                          {p}
                        </button>
                      ); })}
                    </div>
                    <InputField placeholder="RTMP stream key…" value={newKeyValue} onChange={function(e) { setNewKeyValue(e.target.value); }} type="password" />
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
                  style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)', color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Password-protect your VODs and subscriber content. Descriptions are encrypted with your vault key.
                </div>

                {protectedContent.map(function(item) { return (
                  <div key={item.id} className="p-3 rounded-2xl"
                    style={{ background: BG2, border: '1px solid rgba(212,175,55,0.1)' }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-black text-white" style={T}>{item.title}</p>
                          <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full uppercase"
                            style={{ background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.2)', color: GREEN, fontFamily: 'Barlow Condensed, sans-serif' }}>
                            🔒 Encrypted
                          </span>
                        </div>
                        {unlockedContent[item.id] && (
                          <p className="text-xs mt-1" style={{ color: GREEN, fontFamily: 'Barlow Condensed, sans-serif' }}>{unlockedContent[item.id]}</p>
                        )}
                        <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>Protected by AES-256</p>
                      </div>
                      <button onClick={function() { handleUnlockContent(item); }}
                        className="h-8 px-3 rounded-xl text-[10px] font-black uppercase shrink-0"
                        style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {unlockedContent[item.id] ? 'Lock' : 'Unlock'}
                      </button>
                      <button onClick={function() { setProtectedContent(function(prev) { return prev.filter(function(c) { return c.id !== item.id; }); }); addAudit('Content deleted — "' + item.title + '"', '🗑️'); }}
                        className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.2)' }}
                        title="Delete">✕</button>
                    </div>
                  </div>
                ); })}

                <button onClick={function() { setShowProtectContent(true); }}
                  className="w-full py-3 rounded-2xl text-sm font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ background: 'rgba(212,175,55,0.06)', border: '1px dashed rgba(212,175,55,0.25)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  <Plus className="w-4 h-4" /> Protect Content
                </button>

                {showProtectContent && (
                  <Modal title="Protect Content" onClose={function() { setShowProtectContent(false); }}>
                    <InputField placeholder="Content title…" value={newContentTitle} onChange={function(e) { setNewContentTitle(e.target.value); }} maxLength={150} />
                    <textarea
                      placeholder="Description (optional)…"
                      value={newContentDesc}
                      onChange={function(e) { setNewContentDesc(e.target.value); }}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'Barlow Condensed, sans-serif' }}
                      maxLength={500}
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
                  style={{ background: 'rgba(109,191,126,0.04)', border: '1px solid rgba(109,191,126,0.1)', color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  💡 Tip: Share the <span style={{ color: GREEN }}>vault://</span> link. Only people with the PIN can join.
                </div>

                {roomPins.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl"
                    style={{ background: BG2, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>No room PINs stored yet.</p>
                  </div>
                ) : roomPins.map(function(pin) { return (
                  <div key={pin.id} className="p-3 rounded-2xl"
                    style={{ background: BG2, border: '1px solid rgba(109,191,126,0.1)' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white" style={T}>{pin.room}</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>PIN: ••••</p>
                      </div>
                      <button onClick={function() { handleCopyPin(pin); }}
                        className="h-8 px-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"
                        style={{ background: copiedPin === pin.id ? 'rgba(109,191,126,0.15)' : 'rgba(109,191,126,0.08)', color: GREEN, border: '1px solid rgba(109,191,126,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        <Copy className="w-3 h-3" /> {copiedPin === pin.id ? 'Copied!' : 'Copy PIN'}
                      </button>
                      <button onClick={function() { setSharePin(sharePin === pin.id ? null : pin.id); }}
                        className="h-8 px-3 rounded-xl text-[10px] font-black uppercase"
                        style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        Share
                      </button>
                      <button onClick={function() { setRoomPins(function(prev) { return prev.filter(function(p) { return p.id !== pin.id; }); }); addAudit('Room PIN deleted — ' + pin.room, '🗑️'); }}
                        className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.2)' }}
                        title="Delete PIN">✕</button>
                    </div>
                    {sharePin === pin.id && (
                      <div className="mt-2 p-2 rounded-xl"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(109,191,126,0.1)' }}>
                        <p className="text-[11px] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Share link</p>
                        <p className="text-[10px] font-mono break-all" style={{ color: GREEN }}>
                          vault://{pin.encrypted.slice(0, 32)}…
                        </p>
                      </div>
                    )}
                  </div>
                ); })}

                <button onClick={function() { setShowAddPin(true); }}
                  className="w-full py-3 rounded-2xl text-sm font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ background: 'rgba(109,191,126,0.05)', border: '1px dashed rgba(109,191,126,0.2)', color: GREEN, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  <Plus className="w-4 h-4" /> New Room PIN
                </button>

                {showAddPin && (
                  <Modal title="New Room PIN" onClose={function() { setShowAddPin(false); }}>
                    <InputField placeholder="Room name…" value={newPinRoom} onChange={function(e) { setNewPinRoom(e.target.value); }} />
                    <InputField placeholder="4-digit PIN…" value={newPinValue} onChange={function(e) { setNewPinValue(e.target.value.replace(/\D/g, '').slice(0, 4)); }} />
                    <GoldBtn onClick={handleAddPin} disabled={isLoading || !newPinRoom.trim() || !newPinValue.trim()}>
                      {isLoading ? 'Encrypting…' : '🔒 Encrypt & Save'}
                    </GoldBtn>
                  </Modal>
                )}
              </div>
            )}

            {/* ─ Tab: AI API Keys ─ */}
            {activeTab === 'aikeys' && (
              <div className="space-y-3">
                <div className="px-1 pb-1 flex items-start gap-2 rounded-xl p-3" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
                  <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GOLD }} />
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    AI API keys are stored in your browser (localStorage) — not vault-encrypted. They are private to this device. Keys are used by OpenRouter Hub, LLM Lingua Studio, Voice Agent Builder, and other AI tools.
                  </p>
                </div>

                {AI_SERVICES.map(function(svc) {
                  var val     = aiKeys[svc.id] || '';
                  var hasKey  = val.length > 0;
                  var revealed = aiRevealed[svc.id];
                  var editing  = aiEditing[svc.id];
                  var saved    = aiSaved[svc.id];

                  return (
                    <div key={svc.id} className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: hasKey ? '1px solid rgba(212,175,55,0.18)' : '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: hasKey ? GREEN : 'rgba(255,255,255,0.15)' }} />
                            <p className="text-[13px] font-black" style={{ color: hasKey ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{svc.label}</p>
                          </div>
                          <p className="text-[11px] ml-4" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>{svc.desc}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasKey && !editing && (
                            <>
                              <button onClick={function() { setAiRevealed(function(p) { var n = Object.assign({}, p); n[svc.id] = !p[svc.id]; return n; }); }}
                                className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                {revealed ? <EyeOff className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} /> : <Eye className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />}
                              </button>
                              <button onClick={function() { navigator.clipboard.writeText(val).then(function() { setAiCopied(function(p) { var n = Object.assign({}, p); n[svc.id] = true; return n; }); setTimeout(function() { setAiCopied(function(p) { var n = Object.assign({}, p); n[svc.id] = false; return n; }); }, 1500); }).catch(function() {}); addAudit('AI key copied — ' + svc.label, '📋'); }}
                                className="p-1.5 rounded-lg" style={{ background: aiCopied[svc.id] ? 'rgba(109,191,126,0.1)' : 'rgba(255,255,255,0.05)', border: aiCopied[svc.id] ? '1px solid rgba(109,191,126,0.25)' : '1px solid rgba(255,255,255,0.08)' }}>
                                {aiCopied[svc.id] ? <Check className="w-3 h-3" style={{ color: GREEN }} /> : <Copy className="w-3 h-3" style={{ color: GOLD }} />}
                              </button>
                            </>
                          )}
                          <button onClick={function() { setAiEditing(function(p) { var n = Object.assign({}, p); n[svc.id] = !p[svc.id]; return n; }); }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase" style={{ background: editing ? 'rgba(255,255,255,0.08)' : 'rgba(212,175,55,0.1)', border: '1px solid ' + (editing ? 'rgba(255,255,255,0.12)' : 'rgba(212,175,55,0.25)'), color: editing ? 'rgba(255,255,255,0.5)' : GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                            {editing ? 'Cancel' : hasKey ? 'Update' : 'Add'}
                          </button>
                        </div>
                      </div>

                      {/* Key display (not editing) */}
                      {hasKey && !editing && (
                        <div className="mt-1 px-3 py-1.5 rounded-lg font-mono text-[11px]" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)', color: revealed ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)', wordBreak: 'break-all' }}>
                          {revealed ? val : '•'.repeat(Math.min(val.length, 40))}
                        </div>
                      )}

                      {/* Edit input */}
                      {editing && (
                        <div className="space-y-2 mt-1">
                          <input
                            type="text"
                            value={aiKeys[svc.id] || ''}
                            onChange={function(e) { setAiKeys(function(p) { var n = Object.assign({}, p); n[svc.id] = e.target.value; return n; }); }}
                            placeholder={svc.placeholder}
                            autoFocus
                            className="w-full rounded-xl px-3 py-2 text-[12px] font-mono outline-none"
                            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212,175,55,0.3)', color: 'rgba(255,255,255,0.9)' }}
                          />
                          <div className="flex gap-2">
                            <button onClick={function() { saveAiKey(svc.id); }}
                              className="flex-1 py-2 rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5"
                              style={{ background: saved ? 'rgba(109,191,126,0.15)' : 'rgba(212,175,55,0.15)', border: '1px solid ' + (saved ? 'rgba(109,191,126,0.3)' : 'rgba(212,175,55,0.3)'), color: saved ? GREEN : GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                              {saved ? <><Check className="w-3 h-3" /> Saved</> : 'Save Key'}
                            </button>
                            {hasKey && (
                              <button onClick={function() { clearAiKey(svc.id); }}
                                className="px-3 py-2 rounded-xl text-[11px] font-black uppercase"
                                style={{ background: 'rgba(128,0,32,0.08)', border: '1px solid rgba(128,0,32,0.2)', color: 'rgba(192,57,43,0.8)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                                Clear
                              </button>
                            )}
                          </div>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                            Get key at: <a href={svc.link} target="_blank" rel="noopener noreferrer" style={{ color: GOLD, textDecoration: 'none' }}>{svc.link.replace('https://', '')}</a>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─ Tab: Audit Log ─ */}
            {activeTab === 'audit' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Vault Activity</p>
                  <button onClick={function() { setAuditLog([]); }}
                    className="text-[11px] px-2 py-0.5 rounded" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Clear
                  </button>
                </div>
                {auditLog.length === 0 ? (
                  <div className="text-center py-10 text-xs" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    No activity yet. Actions you take appear here.
                  </div>
                ) : auditLog.map(function(entry, i) { return (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-base">{entry.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white" style={T}>{entry.action}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>{fmtTime(entry.time)}</p>
                    </div>
                  </div>
                ); })}
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
            style={{ background: 'rgba(128,0,32,0.85)', border: '1px solid rgba(255,0,50,0.3)', color: '#fff', backdropFilter: 'blur(12px)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Lock className="w-4 h-4" /> Lock Vault
          </button>
        </div>
      )}
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={null} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      {/* Creator Studios */}
      <div style={{ margin: '0 0 16px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
        <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
            { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
          ].map(function(s) {
            return (
              <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 2 }}>{s.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
            🎬 Launch Episode Creator Studio →
          </div>
        </Link>
      </div>
      <BackgroundCustomizer />
    </div>
  );
}
