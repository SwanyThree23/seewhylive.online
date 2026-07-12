import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AudioMixer from '../components/live/AudioMixer';
import TranscriptionPanel from '../components/streaming/TranscriptionPanel';
import GuestConnector from '../components/live/GuestConnector';
import EnhancedAudioMixer from '../components/live/EnhancedAudioMixer';
import SoundboardWidget from '../components/live/SoundboardWidget';
import NativeSelect from '@/components/shared/NativeSelect';
import AIStreamSummary from '../components/live/AIStreamSummary';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ShareToSocial from '../components/social/ShareToSocial';
import SpotlightBanner from '../components/community/SpotlightBanner';
import ClipGeneratorAI from '../components/streaming/ClipGeneratorAI';
import VODCard from '../components/vod/VODCard';
import AutomatedHighlightReels from '../components/streaming/AutomatedHighlightReels';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import StreamGoals from '../components/live/StreamGoals';
import { isSafeUrl } from '@/lib/security';


import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CreatorBridge from '../components/social/CreatorBridge';
// ── Brand tokens ──────────────────────────────────────────────────────────────
const BG     = '#0E0C09';
const BG2    = 'rgba(14,12,9,0.92)';
const GOLD   = '#D4AF37';
const CRIMSON = '#800020';
const CYAN   = '#D4854A';
const PURPLE = '#8B44B0';
const GREEN  = '#5A7A4A';
const NLM    = '#4285F4'; // Google NotebookLM blue
const T      = { fontFamily: 'Barlow Condensed, sans-serif' };
const OCT    = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

// ── NotebookLM Library ────────────────────────────────────────────────────────
const NLM_LIB = [
  { id:'p1',  title:'SeeWhy LIVE: AI Multi-Platform Production Suite',        nbId:'c5285f97-1e18-41c7-ac0f-dcdaf996ae25', artId:'d10969fe-4505-48be-9a97-aa017c38347f', icon:'🚀', cat:'platform' },
  { id:'p2',  title:'Mastering Suno Studio: AI Music Production',             nbId:'db023bed-6228-4049-97f0-9037cc044ecc', artId:'4f3ca811-1e08-425f-9ac4-b268dd7f9c86', icon:'🎵', cat:'music'    },
  { id:'p3',  title:'High-Fidelity Remote Production & AI Chatbot Orchestration', nbId:'c3c8f857-0fd5-460c-9b69-df7ec11ffc8d', artId:'983483a3-3a76-4025-916c-f2e760bbf8a9', icon:'🤖', cat:'production' },
  { id:'p4',  title:'SeeWhy LIVE: Multi-User Platform Technical Spec',        nbId:'nlm-multiuser-spec',  artId:null, icon:'📺', cat:'platform'   },
  { id:'p5',  title:'The Dawn of AI Live Streaming & Virtual Co-Hosts',       nbId:'nlm-dawn-ai',         artId:null, icon:'🤖', cat:'ai'         },
  { id:'p6',  title:'Multi-Guest Streaming Architecture & Deployment',        nbId:'nlm-multigest',       artId:null, icon:'🏗️', cat:'platform'   },
  { id:'p7',  title:'Fanbase: Decentralized Creator Monetization Gateway',    nbId:'nlm-fanbase',         artId:null, icon:'💰', cat:'monetize'   },
  { id:'p8',  title:'VDO.Ninja: Remote Production & Director Control',        nbId:'nlm-vdoninja',        artId:null, icon:'🥷', cat:'production' },
  { id:'p9',  title:'Mastering beehiiv AI & Automation Workflows 2025',       nbId:'nlm-beehiiv',         artId:null, icon:'🐝', cat:'ai'         },
  { id:'p10', title:'Domino Social Expo: Participant Invitations',            nbId:'nlm-domino-expo',     artId:null, icon:'🎲', cat:'domino'     },
  { id:'p11', title:'PRISM Live Studio YouTube Overview',                     nbId:'nlm-prism',           artId:null, icon:'🎬', cat:'production' },
  { id:'p12', title:'TikTok Trending Creators & Viral Content Feed',          nbId:'nlm-tiktok',          artId:null, icon:'📱', cat:'social'     },
];
const CATS   = ['all','platform','ai','music','production','monetize','domino','social'];
const CAT_C  = { platform:'#D4854A', ai:'#8B44B0', music:'#8B44B0', production:'#D4AF37', monetize:'#5A7A4A', domino:'#C62828', social:'#D4854A' };

// ── Generation steps ──────────────────────────────────────────────────────────
const GEN_STEPS = ['Reading sources…', 'Drafting outline…', 'Writing dialogue…', 'Polishing script…'];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          style={{
            position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(14,12,9,0.97)', border: `1px solid ${GOLD}55`,
            borderRadius: 12, padding: '12px 22px',
            color: '#fff', fontSize: 14, ...T,
            fontWeight: 700, letterSpacing: '0.04em',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${GOLD}18`,
            zIndex: 9999, whiteSpace: 'nowrap',
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────
function TabBtn({ label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...T, fontSize: 13, fontWeight: 800, letterSpacing: '0.05em',
        padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
        background: active ? GOLD : 'rgba(255,255,255,0.06)',
        color: active ? '#000' : 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', transition: 'all 0.18s',
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
      }}
    >
      {label}
      {badge ? (
        <span style={{
          background: NLM, color: '#fff', borderRadius: 999,
          fontSize: 9, fontWeight: 900, padding: '1px 5px',
          lineHeight: 1.4, letterSpacing: 0,
        }}>{badge}</span>
      ) : null}
    </button>
  );
}

// ── Octagonal panel slot ──────────────────────────────────────────────────────
function PanelSlot({ name, emoji, borderColor, onInvite }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 80, height: 80, clipPath: OCT,
        background: `${borderColor}20`, border: `2px solid ${borderColor}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, cursor: 'default',
      }}>
        {emoji}
      </div>
      <span style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{name}</span>
      <button
        onClick={onInvite}
        style={{
          ...T, fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999,
          background: `${borderColor}15`, border: `1px solid ${borderColor}40`,
          color: borderColor, cursor: 'pointer', letterSpacing: '0.05em',
        }}
      >
        Invite
      </button>
    </div>
  );
}

// ── NotebookLM Sources Tab ────────────────────────────────────────────────────
function NlmSourcesTab({ nlmSources, saveNlmSources, showToast, inputStyle }) {
  const [urlInput, setUrlInput]   = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [fetchState, setFetchState] = useState('idle'); // idle | fetching | ok | partial | failed
  const [editIdx, setEditIdx]     = useState(null);
  const [deleteIdx, setDeleteIdx] = useState(null);
  const [libCat, setLibCat]       = useState('all');

  function addPreset(p) {
    if (nlmSources.find(nb => nb.notebookId === p.nbId)) { showToast('Already in sources'); return; }
    if (nlmSources.length >= 8) { showToast('Maximum 8 sources'); return; }
    const nb = {
      url: p.artId
        ? `https://notebooklm.google.com/notebook/${p.nbId}/artifact/${p.artId}`
        : `https://notebooklm.google.com/notebook/${p.nbId}`,
      title: p.title,
      topic: '',
      notebookId: p.nbId,
      artifactId: p.artId || null,
      cat: p.cat,
      icon: p.icon,
      addedAt: new Date().toISOString(),
    };
    saveNlmSources([nb, ...nlmSources]);
    showToast(`Added: ${p.title.slice(0, 32)}…`);
  }

  function isNlmUrl(url) {
    return /notebooklm\.google\.com/.test(url.trim());
  }

  function parseNlmIds(url) {
    const nb  = url.match(/notebook\/([a-f0-9-]+)/);
    const art = url.match(/artifact\/([a-f0-9-]+)/);
    return { notebookId: nb?.[1] || null, artifactId: art?.[1] || null };
  }

  async function handleFetch() {
    const url = urlInput.trim();
    if (!url) { showToast('Paste a NotebookLM URL first'); return; }
    if (!isNlmUrl(url)) { showToast('Must be a notebooklm.google.com URL'); return; }

    setFetchState('fetching');
    setTitleInput('');

    // Try a plain fetch — NLM serves page metadata before the auth redirect
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
      clearTimeout(timer);
      const html = await res.text();
      // Extract <title>
      const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const raw = (m?.[1] || '')
        .replace(/\s*[-–|]\s*Google NotebookLM\s*$/i, '')
        .replace(/^Google NotebookLM\s*/i, '')
        .trim();
      if (raw && raw.length > 2) {
        setTitleInput(raw);
        setFetchState('ok');
        showToast('Title extracted ✓');
      } else {
        setTitleInput('NotebookLM Source');
        setFetchState('partial');
      }
    } catch {
      clearTimeout(timer);
      // Likely CORS or auth redirect — gracefully degrade
      setTitleInput('NotebookLM Source');
      setFetchState('partial');
    }
  }

  function handleAdd() {
    const url = urlInput.trim();
    if (!url)          { showToast('URL is required'); return; }
    if (!isNlmUrl(url)) { showToast('Must be a notebooklm.google.com URL'); return; }
    if (!titleInput.trim()) { showToast('Add a title so the AI knows what this source is'); return; }
    if (nlmSources.length >= 8) { showToast('Maximum 8 NotebookLM sources'); return; }

    const ids = parseNlmIds(url);
    const newSrc = {
      url,
      title: titleInput.trim(),
      topic: topicInput.trim(),
      notebookId: ids.notebookId,
      artifactId: ids.artifactId,
      addedAt: new Date().toISOString(),
    };
    saveNlmSources([newSrc, ...nlmSources]);
    setUrlInput('');
    setTitleInput('');
    setTopicInput('');
    setFetchState('idle');
    showToast('Source added ✓');
  }

  function handleSaveEdit(idx) {
    const updated = nlmSources.map((s, i) =>
      i === idx ? { ...s, title: titleInput.trim(), topic: topicInput.trim() } : s
    );
    saveNlmSources(updated);
    setEditIdx(null);
    setTitleInput('');
    setTopicInput('');
    showToast('Source updated ✓');
  }

  function startEdit(idx) {
    const s = nlmSources[idx];
    setEditIdx(idx);
    setTitleInput(s.title);
    setTopicInput(s.topic || '');
  }

  function handleDelete(idx) {
    saveNlmSources(nlmSources.filter((_, i) => i !== idx));
    setDeleteIdx(null);
    showToast('Source removed');
  }

  function handleUrlPaste(e) {
    const pasted = e.target.value;
    setUrlInput(pasted);
    setFetchState('idle');
    setTitleInput('');
  }

  const fetchLabel = {
    idle: '🔍 Fetch Title',
    fetching: 'Fetching…',
    ok: '✓ Title Found',
    partial: '⚠ Auth Required — Enter Title Manually',
    failed: '⚠ Could Not Fetch — Enter Title Manually',
  }[fetchState];

  const fetchColor = { ok: '#6DBF7E', partial: GOLD, failed: '#C0392B' }[fetchState] || NLM;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Explainer card */}
      <div style={{
        background: `${NLM}0C`, border: `1px solid ${NLM}30`,
        borderLeft: `3px solid ${NLM}`, borderRadius: 16, padding: '16px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>🧠</span>
          <div>
            <p style={{ ...T, fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>NotebookLM Sources</p>
            <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
              Saved sources feed directly into AI script generation
            </p>
          </div>
        </div>
        <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
          Paste any NotebookLM share URL. The app will try to auto-extract the title.
          If NotebookLM requires sign-in, enter the title and topic manually — the AI will use
          them as research context when generating your podcast script.
        </p>
      </div>

      {/* URL Input Card */}
      <div style={{
        background: BG2, border: `1px solid ${NLM}25`,
        borderLeft: `3px solid ${NLM}`, borderRadius: 16, padding: '20px 18px',
      }}>
        <p style={{ ...T, fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 14 }}>
          Add NotebookLM Source
        </p>

        {/* URL field + fetch button */}
        <label style={{ ...T, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          NotebookLM Share URL
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 12 }}>
          <input
            type="url"
            value={urlInput}
            onChange={handleUrlPaste}
            placeholder="https://notebooklm.google.com/notebook/…"
            style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: 12 }}
          />
          <button
            onClick={handleFetch}
            disabled={fetchState === 'fetching' || !urlInput.trim()}
            style={{
              ...T, padding: '10px 14px', borderRadius: 10, border: 'none',
              cursor: fetchState === 'fetching' || !urlInput.trim() ? 'not-allowed' : 'pointer',
              background: fetchState === 'idle' ? NLM : fetchColor + '22',
              border: `1px solid ${fetchColor}44`,
              color: fetchState === 'idle' ? '#fff' : fetchColor,
              fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0,
              opacity: !urlInput.trim() ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
          >
            {fetchLabel}
          </button>
        </div>

        {/* Status hint */}
        {(fetchState === 'partial' || fetchState === 'failed') && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '8px 12px', borderRadius: 8, marginBottom: 12,
              background: `${GOLD}10`, border: `1px solid ${GOLD}30`,
              ...T, fontSize: 12, color: GOLD, lineHeight: 1.5,
            }}
          >
            🔐 NotebookLM requires Google sign-in to read content. Enter the title and
            topic below so the AI knows what this source is about.
          </motion.div>
        )}

        {/* Title field */}
        <label style={{ ...T, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Source Title *
        </label>
        <input
          type="text"
          value={titleInput}
          onChange={e => setTitleInput(e.target.value)}
          placeholder="e.g. Domino Social Expo: Participant Invitations"
          style={{ ...inputStyle, marginTop: 6, marginBottom: 12 }}
        />

        {/* Topic/context field */}
        <label style={{ ...T, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Topic / Context <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional — helps AI understand the source)</span>
        </label>
        <textarea
          value={topicInput}
          onChange={e => setTopicInput(e.target.value)}
          placeholder="e.g. Planning and invitations for a domino social tournament event with state teams…"
          rows={3}
          style={{ ...inputStyle, marginTop: 6, marginBottom: 14, resize: 'vertical' }}
        />

        <button
          onClick={handleAdd}
          disabled={!urlInput.trim() || !titleInput.trim()}
          style={{
            ...T, width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
            cursor: !urlInput.trim() || !titleInput.trim() ? 'not-allowed' : 'pointer',
            background: !urlInput.trim() || !titleInput.trim()
              ? 'rgba(255,255,255,0.06)'
              : `linear-gradient(90deg, ${NLM}, #34a853)`,
            color: !urlInput.trim() || !titleInput.trim() ? 'rgba(255,255,255,0.3)' : '#fff',
            fontSize: 14, fontWeight: 900, letterSpacing: '0.06em',
            transition: 'all 0.15s',
          }}
        >
          🧠 Save NotebookLM Source
        </button>
      </div>

      {/* Saved sources list */}
      {nlmSources.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ ...T, fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            Saved Sources ({nlmSources.length})
          </p>
          {nlmSources.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: BG2,
                border: `1px solid ${NLM}25`,
                borderLeft: `3px solid ${NLM}`,
                borderRadius: 14, padding: '14px 16px',
              }}
            >
              {editIdx === i ? (
                /* Edit mode */
                <div>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={e => setTitleInput(e.target.value)}
                    style={{ ...inputStyle, marginBottom: 8 }}
                    placeholder="Title"
                  />
                  <textarea
                    value={topicInput}
                    onChange={e => setTopicInput(e.target.value)}
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical', marginBottom: 10 }}
                    placeholder="Topic / context"
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleSaveEdit(i)}
                      style={{ ...T, padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: NLM, color: '#fff', fontSize: 12, fontWeight: 800 }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditIdx(null); setTitleInput(''); setTopicInput(''); }}
                      style={{ ...T, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <span style={{
                          ...T, fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 999,
                          background: `${NLM}20`, border: `1px solid ${NLM}40`, color: NLM,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                        }}>🧠 NLM</span>
                        <span style={{ ...T, fontSize: 14, fontWeight: 900, color: '#fff' }}>{src.title}</span>
                      </div>
                      {src.topic && (
                        <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, margin: '0 0 6px' }}>
                          {src.topic}
                        </p>
                      )}
                      <a
                        href={isSafeUrl(src.url) ? src.url : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...T, fontSize: 10, color: NLM, wordBreak: 'break-all', textDecoration: 'none', opacity: 0.7 }}
                      >
                        {src.url.length > 55 ? src.url.slice(0, 55) + '…' : src.url}
                      </a>
                      <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                        Added {new Date(src.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
                    <button
                      onClick={() => startEdit(i)}
                      style={{
                        ...T, padding: '5px 14px', borderRadius: 8, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 800,
                      }}
                    >
                      Edit
                    </button>
                    {deleteIdx === i ? (
                      <>
                        <button
                          onClick={() => handleDelete(i)}
                          style={{ ...T, padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#C0392B', color: '#fff', fontSize: 11, fontWeight: 900 }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteIdx(null)}
                          style={{ ...T, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteIdx(i)}
                        style={{
                          ...T, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                          background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)',
                          color: '#C0392B', fontSize: 11, fontWeight: 800,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {/* Clear all */}
          <button
            onClick={() => { saveNlmSources([]); showToast('All sources cleared'); }}
            style={{
              ...T, padding: '8px 0', borderRadius: 10, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(192,57,43,0.2)',
              color: 'rgba(192,57,43,0.5)', fontSize: 12, fontWeight: 700,
            }}
          >
            Clear All Sources
          </button>
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          background: BG2, borderRadius: 16, border: `1px dashed ${NLM}30`,
        }}>
          <span style={{ fontSize: 36 }}>🧠</span>
          <p style={{ ...T, fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
            No sources saved yet
          </p>
          <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
            Paste a NotebookLM share URL above or browse the library below
          </p>
        </div>
      )}

      {/* ── NLM Library Browser ── */}
      <div style={{ background: BG2, border: `1px solid ${NLM}20`, borderLeft: `3px solid ${NLM}`, borderRadius: 16, padding: '18px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>📚</span>
          <div>
            <p style={{ ...T, fontSize: 15, fontWeight: 900, color: '#fff', margin: 0 }}>Source Library</p>
            <p style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>One-click add curated NLM notebooks to your sources</p>
          </div>
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 12, paddingBottom: 4 }}>
          {CATS.map(cat => (
            <button
              key={cat}
              onClick={() => setLibCat(cat)}
              style={{
                ...T, fontSize: 10, fontWeight: 800, padding: '4px 11px', borderRadius: 999,
                border: `1px solid ${cat === 'all' ? NLM : (CAT_C[cat] || NLM)}44`,
                background: libCat === cat ? (cat === 'all' ? NLM : (CAT_C[cat] || NLM)) + '28' : 'rgba(255,255,255,0.04)',
                color: libCat === cat ? (cat === 'all' ? NLM : (CAT_C[cat] || NLM)) : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em',
                whiteSpace: 'nowrap', flexShrink: 0,
                outline: libCat === cat ? `1px solid ${cat === 'all' ? NLM : (CAT_C[cat] || NLM)}60` : 'none',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Library entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {NLM_LIB.filter(p => libCat === 'all' || p.cat === libCat).map(p => {
            const alreadyAdded = nlmSources.some(nb => nb.notebookId === p.nbId);
            const catColor = CAT_C[p.cat] || NLM;
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                border: `1px solid rgba(255,255,255,0.07)`, padding: '10px 12px',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{p.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...T, fontSize: 13, fontWeight: 800, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.title}
                  </p>
                  <span style={{
                    ...T, fontSize: 9, fontWeight: 900, padding: '1px 6px', borderRadius: 999,
                    background: catColor + '18', border: `1px solid ${catColor}35`, color: catColor,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    {p.cat}
                  </span>
                </div>
                <button
                  onClick={() => addPreset(p)}
                  disabled={alreadyAdded}
                  style={{
                    ...T, padding: '5px 12px', borderRadius: 8, border: 'none', flexShrink: 0,
                    cursor: alreadyAdded ? 'default' : 'pointer',
                    background: alreadyAdded ? 'rgba(109,191,126,0.1)' : NLM,
                    color: alreadyAdded ? '#6DBF7E' : '#fff',
                    fontSize: 11, fontWeight: 900, letterSpacing: '0.04em',
                    transition: 'all 0.15s',
                  }}
                >
                  {alreadyAdded ? '✓ Added' : '+ Add'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PodcastStudio() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const [tab, setTab] = useState('create');
  const [sources, setSources] = useState([]);
  const [addingSource, setAddingSource] = useState(false);
  const [sourceInput, setSourceInput] = useState('');
  const [sourceType, setSourceType] = useState('text');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [hostName, setHostName] = useState('SwanyThree');
  const [cohostName, setCohostName] = useState('ARIA');
  const [duration, setDuration] = useState('15min');
  const [tone, setTone] = useState('Casual');
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState('');
  const [script, setScript] = useState(null);
  const [library, setLibrary] = useState(() => { try { return JSON.parse(sessionStorage.getItem('podcast_library') || '[]'); } catch { return []; } });
  const [nlmSources, setNlmSources] = useState(() => { try { return JSON.parse(sessionStorage.getItem('podcast_nlm_sources') || '[]'); } catch { return []; } });
  const [editingIdx, setEditingIdx] = useState(null);
  const [toast, setToast] = useState('');
  const [panelSegIdx, setPanelSegIdx] = useState(0);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function saveNlmSources(updated) {
    setNlmSources(updated);
    sessionStorage.setItem('podcast_nlm_sources', JSON.stringify(updated));
  }

  function addSource() {
    if (!sourceInput.trim()) return;
    if (sources.length >= 5) { showToast('Maximum 5 sources'); return; }
    const label = sourceInput.slice(0, 30);
    setSources(prev => [...prev, { type: sourceType, label, content: sourceInput }]);
    setSourceInput('');
    setAddingSource(false);
  }

  function removeSource(idx) {
    setSources(prev => prev.filter((_, i) => i !== idx));
  }

  function sourceEmoji(type) {
    if (type === 'url') return '🔗';
    if (type === 'note') return '📝';
    return '📄';
  }

  async function generateScript() {
    setGenerating(true);
    for (let i = 0; i < GEN_STEPS.length; i++) {
      setGenStep(GEN_STEPS[i]);
      await new Promise(r => setTimeout(r, 900));
    }
    try {
      const srcText = sources.length
        ? sources.map(s => `[${s.label}]: ${s.content}`).join('\n---\n')
        : 'No sources provided — generate based on topic only.';
      const nlmText = nlmSources.length
        ? `\n\nNotebookLM Research Sources (treat as research context for the discussion):\n${
            nlmSources.map(s => `- "${s.title}"${s.topic ? ' — ' + s.topic : ''}`).join('\n')
          }`
        : '';
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a podcast script writer for SeeWhy LIVE, a live streaming platform. Write a ${duration} podcast script between ${hostName} (host) and ${cohostName} (co-host/AI) about: "${topic || 'live streaming, creator economy, and community building'}". Sources: ${srcText}${nlmText}. Tone: ${tone}. The script should feel like a real conversation about the topic, with the hosts reacting to each other naturally. If NotebookLM sources are provided, weave their topics into the discussion naturally.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            episode: { type: 'number' },
            intro: { type: 'string' },
            segments: {
              type: 'array', items: {
                type: 'object', properties: {
                  title: { type: 'string' },
                  host_line: { type: 'string' },
                  cohost_line: { type: 'string' },
                  host_response: { type: 'string' },
                }, required: ['title', 'host_line', 'cohost_line']
              }
            },
            outro: { type: 'string' },
            key_topics: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      const ep = { ...result, title: episodeTitle || result.title, generatedAt: new Date().toISOString(), duration, tone };
      setScript(ep);
      const newLib = [ep, ...library].slice(0, 20);
      setLibrary(newLib);
      sessionStorage.setItem('podcast_library', JSON.stringify(newLib));
      setTab('script');
    } catch (e) {
      const fallback = {
        title: episodeTitle || 'Episode: ' + topic,
        episode: library.length + 1,
        intro: `Welcome to SeeWhy LIVE! I'm ${hostName}, joined by ${cohostName}. Today we're diving into: ${topic || 'the world of live streaming'}.`,
        segments: [
          { title: 'Getting Started', host_line: `So ${cohostName}, what do you think is the biggest opportunity for creators right now?`, cohost_line: `Honestly? Community. Creators who build real community on platforms like Fanbase and SeeWhy LIVE are winning every time.`, host_response: `100%. And with tools like AI co-hosting and watch parties, creators can scale that community like never before.` },
          { title: 'Key Insights', host_line: `Let's talk about the tech side. What tools are making the biggest difference?`, cohost_line: `Real-time AI, 20-person panels, multi-platform streaming — it's all converging right now.`, host_response: `And our audience can experience all of that right here, live.` },
        ],
        outro: `That's a wrap on today's episode! Thanks for listening and keep building your community.`,
        key_topics: ['live streaming', 'creator economy', 'AI tools', 'community building'],
        generatedAt: new Date().toISOString(), duration, tone,
      };
      setScript(fallback);
      const newLib = [fallback, ...library].slice(0, 20);
      setLibrary(newLib);
      sessionStorage.setItem('podcast_library', JSON.stringify(newLib));
      setTab('script');
    }
    setGenerating(false);
  }

  function copyTranscript() {
    if (!script) return;
    let text = `${script.title}\n\n`;
    text += `INTRO:\n${script.intro}\n\n`;
    (script.segments || []).forEach(seg => {
      text += `--- ${seg.title} ---\n`;
      text += `${hostName}: ${seg.host_line}\n`;
      text += `${cohostName}: ${seg.cohost_line}\n`;
      if (seg.host_response) text += `${hostName}: ${seg.host_response}\n`;
      text += '\n';
    });
    text += `OUTRO:\n${script.outro}`;
    navigator.clipboard.writeText(text).then(() => showToast('Transcript copied!')).catch(() => showToast('Copy failed'));
  }

  function loadFromLibrary(ep) {
    setScript(ep);
    setTab('script');
  }

  function deleteEpisode(idx) {
    const newLib = library.filter((_, i) => i !== idx);
    setLibrary(newLib);
    sessionStorage.setItem('podcast_library', JSON.stringify(newLib));
    setDeleteConfirmIdx(null);
    showToast('Episode deleted');
  }

  // DJ track for panel tab
  let djTrack = null;
  try { djTrack = JSON.parse(localStorage.getItem('seewhy_dj_track') || 'null'); } catch {}

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '10px 14px',
    color: '#fff', fontSize: 14, ...T, fontWeight: 600,
    outline: 'none',
  };

  const selectStyle = { ...inputStyle };

  return (
    <div style={{ minHeight: '100vh', background: BG, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '16px 16px 0' }}>
        <a href="/AIHub" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14 }} aria-label="Back to AI Hub">
          ← AI Hub
        </a>
      </div>
      <div style={{ textAlign: 'center', padding: '0 16px 16px' }}>
        <h1 style={{ ...T, fontSize: 30, fontWeight: 900, color: GOLD, letterSpacing: '0.04em', margin: 0 }}>
          🎙️ Podcast Studio
        </h1>
        <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>
          AI-powered podcast creation · NotebookLM-style
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 8, padding: '0 16px 16px', overflowX: 'auto',
        scrollbarWidth: 'none', justifyContent: 'center',
      }}>
        <TabBtn label="Create" active={tab === 'create'} onClick={() => setTab('create')} />
        <TabBtn label="Sources" active={tab === 'sources'} onClick={() => setTab('sources')} badge={nlmSources.length || null} />
        <TabBtn label="Script" active={tab === 'script'} onClick={() => setTab('script')} />
        <TabBtn label="Panel Record" active={tab === 'record'} onClick={() => setTab('record')} />
        <TabBtn label="Library" active={tab === 'library'} onClick={() => setTab('library')} />
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Tab: Create ── */}
        {tab === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Sources section */}
            <div style={{
              background: BG2, border: '1px solid rgba(212,175,55,0.12)',
              borderLeft: `3px solid ${CYAN}`, borderRadius: 16, padding: '20px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <p style={{ ...T, fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>Sources</p>
                  <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
                    {sources.length}/5 added
                    {nlmSources.length > 0 && (
                      <span style={{ color: NLM, marginLeft: 8 }}>
                        + {nlmSources.length} NLM
                      </span>
                    )}
                  </p>
                </div>
                {!addingSource && sources.length < 5 && (
                  <button
                    onClick={() => setAddingSource(true)}
                    style={{
                      ...T, fontSize: 13, fontWeight: 800, padding: '7px 16px', borderRadius: 999,
                      background: 'transparent', border: `1px solid ${CYAN}60`, color: CYAN, cursor: 'pointer',
                    }}
                  >
                    + Add Source
                  </button>
                )}
              </div>

              {/* Add source form */}
              {addingSource && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 14 }}>
                  <NativeSelect
                    value={sourceType}
                    onChange={val => setSourceType(val)}
                    style={{ ...selectStyle, marginBottom: 8 }}
                    options={[{value:'text',label:'📄 Text'},{value:'url',label:'🔗 URL'},{value:'note',label:'📝 Note'}]}
                  />
                  <textarea
                    value={sourceInput}
                    onChange={e => setSourceInput(e.target.value)}
                    placeholder={sourceType === 'url' ? 'Paste a URL…' : 'Paste or type source content…'}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={addSource}
                      style={{
                        ...T, fontSize: 13, fontWeight: 800, padding: '8px 20px', borderRadius: 10,
                        background: CYAN, color: '#000', border: 'none', cursor: 'pointer',
                      }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setAddingSource(false); setSourceInput(''); }}
                      style={{
                        ...T, fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Source chips */}
              {sources.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {sources.map((src, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 999,
                      background: `${CYAN}12`, border: `1px solid ${CYAN}30`,
                    }}>
                      <span>{sourceEmoji(src.type)}</span>
                      <span style={{ ...T, fontSize: 12, color: CYAN, fontWeight: 700 }}>
                        {src.label.length > 30 ? src.label.slice(0, 30) + '…' : src.label}
                      </span>
                      <button
                        onClick={() => removeSource(i)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {sources.length === 0 && !addingSource && (
                <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', margin: 0 }}>
                  No sources added — AI will generate from topic only
                </p>
              )}
            </div>

            {/* Episode config */}
            <div style={{
              background: BG2, border: '1px solid rgba(212,175,55,0.12)',
              borderLeft: `3px solid ${GOLD}`, borderRadius: 16, padding: '20px 18px',
            }}>
              <p style={{ ...T, fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 16 }}>Episode Config</p>

              <label style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Episode Title
              </label>
              <input
                type="text"
                value={episodeTitle}
                onChange={e => setEpisodeTitle(e.target.value)}
                placeholder="Untitled Episode"
                style={{ ...inputStyle, marginTop: 6, marginBottom: 14 }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Host Name
                  </label>
                  <input
                    type="text"
                    value={hostName}
                    onChange={e => setHostName(e.target.value)}
                    style={{ ...inputStyle, marginTop: 6 }}
                  />
                </div>
                <div>
                  <label style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Co-host Name
                  </label>
                  <input
                    type="text"
                    value={cohostName}
                    onChange={e => setCohostName(e.target.value)}
                    style={{ ...inputStyle, marginTop: 6 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Duration
                  </label>
                  <NativeSelect value={duration} onChange={val => setDuration(val)} style={{ ...selectStyle, marginTop: 6 }}
                    options={[{value:'5min',label:'5 min'},{value:'15min',label:'15 min'},{value:'30min',label:'30 min'},{value:'60min',label:'60 min'}]} />
                </div>
                <div>
                  <label style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Tone
                  </label>
                  <NativeSelect value={tone} onChange={val => setTone(val)} style={{ ...selectStyle, marginTop: 6 }}
                    options={[{value:'Casual',label:'Casual'},{value:'Professional',label:'Professional'},{value:'Educational',label:'Educational'},{value:'Entertaining',label:'Entertaining'}]} />
                </div>
              </div>

              <label style={{ ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                What's this episode about?
              </label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="E.g. 'How Fanbase is changing creator monetization' or 'Tips for going live on multiple platforms at once'"
                rows={4}
                style={{ ...inputStyle, marginTop: 6, marginBottom: 16, resize: 'vertical' }}
              />

              <motion.button
                whileTap={{ scale: topic || generating ? 0.97 : 1 }}
                disabled={!topic || generating}
                onClick={generateScript}
                style={{
                  ...T, width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: (!topic || generating) ? 'not-allowed' : 'pointer',
                  background: (!topic || generating)
                    ? 'rgba(212,175,55,0.15)'
                    : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`,
                  color: (!topic || generating) ? 'rgba(255,255,255,0.35)' : '#000',
                  fontSize: 16, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase',
                }}
              >
                {generating ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{
                      width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: GOLD,
                      borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite',
                    }} />
                    {genStep}
                  </span>
                ) : 'Generate Podcast Script →'}
              </motion.button>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          </div>
        )}

        {/* ── Tab: Sources ── */}
        {tab === 'sources' && (
          <NlmSourcesTab
            nlmSources={nlmSources}
            saveNlmSources={saveNlmSources}
            showToast={showToast}
            inputStyle={inputStyle}
            selectStyle={selectStyle}
          />
        )}

        {/* ── Tab: Script ── */}
        {tab === 'script' && (
          <div>
            {!script ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                background: BG2, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🎙️</p>
                <p style={{ ...T, fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
                  No script yet — create one first
                </p>
                <button
                  onClick={() => setTab('create')}
                  style={{
                    ...T, marginTop: 16, padding: '10px 24px', borderRadius: 10,
                    background: GOLD, color: '#000', fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer',
                  }}
                >
                  Go to Create Tab
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 80 }}>

                {/* Key topics */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                  {(script.key_topics || []).map(t => (
                    <span key={t} style={{
                      ...T, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999, flexShrink: 0,
                      background: `${CYAN}15`, border: `1px solid ${CYAN}40`, color: CYAN,
                    }}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <div>
                  <p style={{ ...T, fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>{script.title}</p>
                  <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                    Ep. {script.episode || 1} · {script.duration} · {script.tone}
                  </p>
                </div>

                {/* Intro */}
                <div style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <p style={{ ...T, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Intro</p>
                  <p style={{ ...T, fontSize: 14, color: '#fff', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                    {script.intro}
                  </p>
                </div>

                {/* Segments */}
                {(script.segments || []).map((seg, i) => (
                  <div key={i} style={{
                    background: BG2, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', padding: '14px 16px',
                  }}>
                    <p style={{ ...T, fontSize: 11, fontWeight: 900, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                      {seg.title}
                    </p>

                    {/* Host line */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, justifyContent: 'flex-end' }}>
                      <div style={{
                        flex: 1, padding: '10px 14px', borderRadius: '12px 12px 4px 12px', maxWidth: '85%',
                        background: `${GOLD}15`, border: `1px solid ${GOLD}30`,
                      }}>
                        <p style={{ ...T, fontSize: 12, fontWeight: 800, color: GOLD, marginBottom: 4 }}>{hostName}</p>
                        <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0 }}>{seg.host_line}</p>
                      </div>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: GOLD, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        ...T, fontSize: 14, fontWeight: 900, color: '#000',
                      }}>
                        {hostName.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Co-host line */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: seg.host_response ? 10 : 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: PURPLE, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        ...T, fontSize: 14, fontWeight: 900, color: '#fff',
                      }}>
                        {cohostName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{
                        flex: 1, padding: '10px 14px', borderRadius: '12px 12px 12px 4px', maxWidth: '85%',
                        background: `${PURPLE}15`, border: `1px solid ${PURPLE}30`,
                      }}>
                        <p style={{ ...T, fontSize: 12, fontWeight: 800, color: PURPLE, marginBottom: 4 }}>{cohostName}</p>
                        <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0 }}>{seg.cohost_line}</p>
                      </div>
                    </div>

                    {/* Host response */}
                    {seg.host_response && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, justifyContent: 'flex-end' }}>
                        <div style={{
                          flex: 1, padding: '10px 14px', borderRadius: '12px 12px 4px 12px', maxWidth: '85%',
                          background: `${GOLD}12`, border: `1px solid ${GOLD}25`,
                        }}>
                          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0 }}>{seg.host_response}</p>
                        </div>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: GOLD, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          ...T, fontSize: 14, fontWeight: 900, color: '#000',
                        }}>
                          {hostName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Outro */}
                <div style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <p style={{ ...T, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Outro</p>
                  <p style={{ ...T, fontSize: 14, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                    {script.outro}
                  </p>
                </div>

                {/* Sticky action bar */}
                <div style={{
                  position: 'sticky', bottom: 80, left: 0, right: 0,
                  display: 'flex', gap: 10, padding: '12px 0',
                  background: BG,
                }}>
                  <button
                    onClick={() => setTab('record')}
                    style={{
                      ...T, flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, color: '#000',
                      fontSize: 14, fontWeight: 900, letterSpacing: '0.06em',
                    }}
                  >
                    🎙️ Record with Panel
                  </button>
                  <button
                    onClick={copyTranscript}
                    style={{
                      ...T, flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 800,
                    }}
                  >
                    📋 Copy Transcript
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Panel Record ── */}
        {tab === 'record' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Panel slots */}
            <div style={{
              background: BG2, border: '1px solid rgba(212,175,55,0.12)',
              borderLeft: `3px solid ${GOLD}`, borderRadius: 16, padding: '20px 18px',
            }}>
              <p style={{ ...T, fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 16 }}>Panel Setup</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, justifyItems: 'center' }}>
                <PanelSlot name={hostName} emoji="👑" borderColor={GOLD} onInvite={() => showToast('Host slot is always yours')} />
                <PanelSlot name={cohostName} emoji="🤖" borderColor={PURPLE} onInvite={() => showToast('ARIA is your AI co-host')} />
                <PanelSlot name="Guest 1" emoji="🎤" borderColor="rgba(255,255,255,0.5)" onInvite={() => showToast('Send invite link to guest')} />
                <PanelSlot name="Guest 2" emoji="🎤" borderColor="rgba(255,255,255,0.5)" onInvite={() => showToast('Send invite link to guest')} />
              </div>
            </div>

            {/* Script reader */}
            <div style={{
              background: BG2, border: '1px solid rgba(212,175,55,0.12)',
              borderLeft: `3px solid ${CYAN}`, borderRadius: 16, padding: '20px 18px',
            }}>
              <p style={{ ...T, fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Script Reader</p>
              {script && script.segments && script.segments.length > 0 ? (
                <div>
                  <div style={{
                    padding: '14px 16px', borderRadius: 12, marginBottom: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    minHeight: 100,
                  }}>
                    <p style={{ ...T, fontSize: 11, fontWeight: 900, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                      {script.segments[panelSegIdx]?.title}
                    </p>
                    <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
                      <strong style={{ color: GOLD }}>{hostName}:</strong> {script.segments[panelSegIdx]?.host_line}
                    </p>
                    <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginTop: 8 }}>
                      <strong style={{ color: PURPLE }}>{cohostName}:</strong> {script.segments[panelSegIdx]?.cohost_line}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
                    <button
                      disabled={panelSegIdx === 0}
                      onClick={() => setPanelSegIdx(i => Math.max(0, i - 1))}
                      style={{
                        ...T, padding: '8px 20px', borderRadius: 10, border: 'none', cursor: panelSegIdx === 0 ? 'not-allowed' : 'pointer',
                        background: panelSegIdx === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                        color: panelSegIdx === 0 ? 'rgba(255,255,255,0.2)' : '#fff', fontWeight: 800, fontSize: 13,
                      }}
                    >
                      ← Prev
                    </button>
                    <span style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {panelSegIdx + 1} / {script.segments.length}
                    </span>
                    <button
                      disabled={panelSegIdx === script.segments.length - 1}
                      onClick={() => setPanelSegIdx(i => Math.min(script.segments.length - 1, i + 1))}
                      style={{
                        ...T, padding: '8px 20px', borderRadius: 10, border: 'none',
                        cursor: panelSegIdx === script.segments.length - 1 ? 'not-allowed' : 'pointer',
                        background: panelSegIdx === script.segments.length - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                        color: panelSegIdx === script.segments.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff', fontWeight: 800, fontSize: 13,
                      }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                  Generate a script first to use the Script Reader
                </p>
              )}
            </div>

            {/* CTA buttons */}
            <Link to="/WatchParty" style={{ textDecoration: 'none', display: 'block' }}>
              <motion.div whileTap={{ scale: 0.97 }} style={{
                ...T, padding: '14px 0', borderRadius: 12, textAlign: 'center',
                background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`,
                color: '#000', fontSize: 15, fontWeight: 900, letterSpacing: '0.07em',
                cursor: 'pointer',
              }}>
                🔴 Go Live with Panel →
              </motion.div>
            </Link>
            <Link to="/BroadcastStudio" style={{ textDecoration: 'none', display: 'block' }}>
              <motion.div whileTap={{ scale: 0.97 }} style={{
                ...T, padding: '13px 0', borderRadius: 12, textAlign: 'center',
                background: `${PURPLE}15`, border: `1px solid ${PURPLE}40`,
                color: PURPLE, fontSize: 14, fontWeight: 900, letterSpacing: '0.07em',
                cursor: 'pointer',
              }}>
                🎬 Full 20-Person Panel →
              </motion.div>
            </Link>

            {/* AI Music bar */}
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: djTrack ? `${CYAN}10` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${djTrack ? CYAN + '30' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>🎵</span>
              {djTrack ? (
                <span style={{ ...T, fontSize: 13, fontWeight: 700, color: CYAN, flex: 1 }}>
                  Now playing: {djTrack.emoji || ''} {djTrack.title}
                  {djTrack.bpm && <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginLeft: 8 }}>{djTrack.bpm} BPM</span>}
                </span>
              ) : (
                <Link to="/AIMusic" style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textDecoration: 'none' }}>
                  No background music set — Open Music Studio
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Library ── */}
        {tab === 'library' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {library.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                background: BG2, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>📚</p>
                <p style={{ ...T, fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                  No episodes yet — create your first podcast!
                </p>
                <button
                  onClick={() => setTab('create')}
                  style={{
                    ...T, marginTop: 16, padding: '10px 24px', borderRadius: 10,
                    background: GOLD, color: '#000', fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer',
                  }}
                >
                  Create Episode
                </button>
              </div>
            ) : (
              library.map((ep, i) => (
                <div key={i} style={{
                  background: BG2, border: '1px solid rgba(212,175,55,0.12)',
                  borderLeft: `3px solid ${GOLD}`, borderRadius: 16, padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <p style={{ ...T, fontSize: 16, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>
                      {ep.title}
                    </p>
                    <span style={{
                      ...T, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, flexShrink: 0,
                      background: `${GOLD}15`, border: `1px solid ${GOLD}40`, color: GOLD,
                    }}>
                      Ep. {ep.episode || i + 1}
                    </span>
                  </div>

                  <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
                    {ep.generatedAt ? new Date(ep.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {ep.duration && (
                      <span style={{ ...T, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                        {ep.duration}
                      </span>
                    )}
                    {ep.tone && (
                      <span style={{ ...T, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                        {ep.tone}
                      </span>
                    )}
                  </div>

                  {(ep.key_topics || []).slice(0, 3).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {(ep.key_topics || []).slice(0, 3).map(t => (
                        <span key={t} style={{ ...T, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: `${CYAN}12`, border: `1px solid ${CYAN}30`, color: CYAN }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => loadFromLibrary(ep)}
                      style={{
                        ...T, flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: GOLD, color: '#000', fontSize: 13, fontWeight: 900,
                      }}
                    >
                      View Script
                    </button>
                    {deleteConfirmIdx === i ? (
                      <>
                        <button
                          onClick={() => deleteEpisode(i)}
                          style={{
                            ...T, padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: '#C0392B', color: '#fff', fontSize: 13, fontWeight: 900,
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmIdx(null)}
                          style={{
                            ...T, padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 800,
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmIdx(i)}
                        style={{
                          ...T, padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                          background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)',
                          color: '#C0392B', fontSize: 13, fontWeight: 800,
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Toast message={toast} />
      <SwanAIRecommendations roomId={null} currentLayout="podcast" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={null} roomId={null} currentUser={null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}