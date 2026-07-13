import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Grid3X3, Monitor, Maximize, PictureInPicture2,
  Layout, Plus, Check, Star, Trash2, Edit3,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
const BG      = '#080B18';
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const TEAL    = '#C9A84C';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

// ─── Preset data ──────────────────────────────────────────────────────────────
const PRESETS = [
  { id: 'single',    name: 'Full Screen',    desc: 'One camera, full coverage',   icon: Maximize },
  { id: 'split',     name: 'Split Screen',   desc: 'Side-by-side dual cameras',   icon: Layout },
  { id: 'pip',       name: 'Picture-in-Pic', desc: 'Main + guest overlay',        icon: PictureInPicture2 },
  { id: 'grid4',     name: '2×2 Grid',       desc: 'Four equal panels',           icon: Grid3X3 },
  { id: 'grid6',     name: '2×3 Grid',       desc: 'Six panel broadcast',         icon: Grid3X3 },
  { id: 'newsdesk',  name: 'News Desk',      desc: 'Host + content side',         icon: Monitor },
  { id: 'gaming',    name: 'Gaming',         desc: 'Game + facecam',              icon: Monitor },
  { id: 'interview', name: 'Interview',      desc: 'Host + two guests',           icon: Layout },
];

// ─── Layout preview renderers ─────────────────────────────────────────────────
const MAIN  = CRIMSON;
const SEC   = 'rgba(212,175,55,0.4)';
const GHOST = 'rgba(255,255,255,0.08)';

function LayoutPreview({ id }) {
  const wrap = {
    position: 'relative',
    width: '100%',
    height: '120px',
    background: 'rgba(0,0,0,0.4)',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '12px',
  };

  const r = (style) => (
    <div style={{
      position: 'absolute',
      borderRadius: '4px',
      ...style,
    }} />
  );

  const previews = {
    single: (
      <div style={wrap}>
        {r({ background: MAIN, width: '85%', height: '70%', top: '15%', left: '7.5%' })}
      </div>
    ),
    split: (
      <div style={wrap}>
        {r({ background: MAIN, width: '48%', height: '80%', top: '10%', left: '2%' })}
        {r({ background: MAIN, width: '48%', height: '80%', top: '10%', right: '2%' })}
      </div>
    ),
    pip: (
      <div style={wrap}>
        {r({ background: MAIN, width: '88%', height: '82%', top: '5%', left: '5%' })}
        {r({ background: SEC,  width: '26%', height: '28%', bottom: '8%', right: '7%', border: `2px solid ${GOLD}` })}
      </div>
    ),
    grid4: (
      <div style={wrap}>
        {r({ background: MAIN, width: '47%', height: '45%', top: '5%',  left: '2%'  })}
        {r({ background: MAIN, width: '47%', height: '45%', top: '5%',  right: '2%' })}
        {r({ background: MAIN, width: '47%', height: '45%', bottom: '5%', left: '2%'  })}
        {r({ background: MAIN, width: '47%', height: '45%', bottom: '5%', right: '2%' })}
      </div>
    ),
    grid6: (
      <div style={wrap}>
        {r({ background: MAIN, width: '31%', height: '45%', top: '5%',  left: '2%'    })}
        {r({ background: MAIN, width: '31%', height: '45%', top: '5%',  left: '34.5%' })}
        {r({ background: MAIN, width: '31%', height: '45%', top: '5%',  right: '2%'   })}
        {r({ background: MAIN, width: '31%', height: '45%', bottom: '5%', left: '2%'    })}
        {r({ background: MAIN, width: '31%', height: '45%', bottom: '5%', left: '34.5%' })}
        {r({ background: MAIN, width: '31%', height: '45%', bottom: '5%', right: '2%'   })}
      </div>
    ),
    newsdesk: (
      <div style={wrap}>
        {r({ background: MAIN, width: '62%', height: '80%', top: '10%', left: '3%'  })}
        {r({ background: SEC,  width: '29%', height: '80%', top: '10%', right: '3%' })}
      </div>
    ),
    gaming: (
      <div style={wrap}>
        {r({ background: MAIN, width: '75%', height: '75%', top: '5%', left: '3%' })}
        {r({ background: SEC,  width: '24%', height: '28%', bottom: '8%', right: '4%', border: `1.5px solid ${GOLD}` })}
      </div>
    ),
    interview: (
      <div style={wrap}>
        {r({ background: SEC,  width: '22%', height: '72%', top: '14%', left: '2%'  })}
        {r({ background: MAIN, width: '48%', height: '82%', top: '9%',  left: '26%' })}
        {r({ background: SEC,  width: '22%', height: '72%', top: '14%', right: '2%' })}
      </div>
    ),
  };

  return previews[id] || <div style={{ ...wrap, background: GHOST }} />;
}

// ─── Preset card ──────────────────────────────────────────────────────────────
function PresetCard({ preset, isActive, onApply }) {
  const Icon = preset.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'rgba(13,6,24,0.9)',
        border: `1px solid ${isActive ? `rgba(212,175,55,0.45)` : 'rgba(212,175,55,0.1)'}`,
        borderRadius: '16px',
        padding: '14px',
        cursor: 'default',
        transition: 'border-color 0.2s',
      }}
    >
      <LayoutPreview id={preset.id} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
        <div>
          <div style={{ ...T, fontWeight: 700, fontSize: '15px', color: '#fff', lineHeight: 1.1 }}>
            {preset.name}
          </div>
          <div style={{ ...T, fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
            {preset.desc}
          </div>
        </div>
        <div style={{
          width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
          background: isActive ? `rgba(212,175,55,0.15)` : 'rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color={isActive ? GOLD : 'rgba(255,255,255,0.4)'} />
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => onApply(preset)}
        style={{
          ...T,
          width: '100%',
          padding: '7px 0',
          borderRadius: '8px',
          border: isActive ? `1px solid ${GOLD}` : 'none',
          background: isActive ? 'transparent' : CRIMSON,
          color: isActive ? GOLD : GOLD,
          fontWeight: 700,
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          letterSpacing: '0.05em',
        }}
      >
        {isActive ? (
          <>
            <Check size={13} />
            Applied
          </>
        ) : 'Apply'}
      </motion.button>
    </motion.div>
  );
}

// ─── Custom template card ─────────────────────────────────────────────────────
function CustomCard({ tpl, isActive, onApply, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'rgba(13,6,24,0.9)',
        border: `1px solid ${isActive ? `rgba(212,175,55,0.45)` : 'rgba(212,175,55,0.1)'}`,
        borderRadius: '16px',
        padding: '14px',
      }}
    >
      <LayoutPreview id={tpl.layout_type || 'single'} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...T, fontWeight: 700, fontSize: '15px', color: '#fff', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tpl.name || 'Untitled'}
          </div>
          {tpl.description && (
            <div style={{ ...T, fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tpl.description}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => onEdit(tpl)}
            style={{
              width: '26px', height: '26px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Edit3 size={12} color='rgba(255,255,255,0.5)' />
          </button>
          <button
            onClick={() => onDelete(tpl)}
            style={{
              width: '26px', height: '26px', borderRadius: '6px',
              background: 'rgba(255,50,50,0.08)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Trash2 size={12} color='rgba(255,80,80,0.7)' />
          </button>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => onApply(tpl)}
        style={{
          ...T,
          width: '100%',
          padding: '7px 0',
          borderRadius: '8px',
          border: isActive ? `1px solid ${GOLD}` : 'none',
          background: isActive ? 'transparent' : CRIMSON,
          color: GOLD,
          fontWeight: 700,
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          letterSpacing: '0.05em',
        }}
      >
        {isActive ? <><Check size={13} /> Applied</> : 'Apply'}
      </motion.button>
    </motion.div>
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────
function CreateForm({ userId, onSuccess }) {
  const qc = useQueryClient();
  const [name, setName]         = useState('');
  const [description, setDesc]  = useState('');
  const [selectedBase, setBase] = useState('single');

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      base44.entities.SceneTemplate.create({
        creator_id:  userId,
        name:        name.trim(),
        description: description.trim(),
        layout_type: selectedBase,
      }),
    onSuccess: () => {
      toast.success('Template saved!');
      qc.invalidateQueries(['scene-templates', userId]);
      setName('');
      setDesc('');
      setBase('single');
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to save template');
    },
  });

  const inputStyle = {
    ...T,
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(212,175,55,0.15)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ ...T, fontSize: '11px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
          Template Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My Sports Layout"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={{ ...T, fontSize: '11px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
          Description
        </label>
        <input
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Short description (optional)"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={{ ...T, fontSize: '11px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
          Base Layout
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setBase(p.id)}
              style={{
                ...T,
                padding: '5px 12px',
                borderRadius: '100px',
                border: `1px solid ${selectedBase === p.id ? GOLD : 'rgba(212,175,55,0.2)'}`,
                background: selectedBase === p.id ? `rgba(212,175,55,0.15)` : 'transparent',
                color: selectedBase === p.id ? GOLD : 'rgba(255,255,255,0.5)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => name.trim() && save()}
        disabled={!name.trim() || isPending}
        style={{
          ...T,
          marginTop: '4px',
          padding: '11px 0',
          borderRadius: '10px',
          border: 'none',
          background: !name.trim() || isPending ? 'rgba(128,0,32,0.35)' : CRIMSON,
          color: GOLD,
          fontWeight: 700,
          fontSize: '15px',
          letterSpacing: '0.06em',
          cursor: !name.trim() || isPending ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '7px',
        }}
      >
        {isPending ? (
          <>
            <span style={{ display: 'inline-block', width: '14px', height: '14px', border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Saving…
          </>
        ) : (
          <><Star size={14} /> Save Template</>
        )}
      </motion.button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SceneTemplates() {
  const qc = useQueryClient();
  const [activeTemplate, setActiveTemplate] = useState('single');
  const [showCreate, setShowCreate]         = useState(false);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: customTemplates = [], isLoading: loadingCustom } = useQuery({
    queryKey: ['scene-templates', user?.id],
    queryFn:  () => base44.entities.SceneTemplate.filter({ creator_id: user.id }),
    enabled:  !!user?.id,
  });

  const { mutate: deleteTemplate } = useMutation({
    mutationFn: (tpl) => base44.entities.SceneTemplate.delete(tpl.id),
    onSuccess: () => {
      toast.success('Template deleted');
      qc.invalidateQueries(['scene-templates', user?.id]);
    },
    onError: () => toast.error('Failed to delete template'),
  });

  function handleApply(item) {
    const key = item.id ?? item.layout_type ?? 'single';
    setActiveTemplate(key);
    toast.success(`${item.name} applied!`);
  }

  function handleEdit(tpl) {
    toast(`Edit "${tpl.name}" — coming soon`);
  }

  function handleDelete(tpl) {
    deleteTemplate(tpl);
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, ...T }}>
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(8,11,24,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', background: `rgba(128,0,32,0.25)`,
            clipPath: OCT, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Layers size={16} color={GOLD} />
          </div>
          <span style={{ ...T, fontSize: '22px', fontWeight: 800, color: GOLD, letterSpacing: '0.04em' }}>
            Scene Templates
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreate((v) => !v)}
          style={{
            ...T,
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            background: CRIMSON,
            border: 'none',
            color: GOLD,
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          <Plus size={15} />
          New Template
        </motion.button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 20px', maxWidth: '900px', margin: '0 auto' }}>

        {/* ── Presets section ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{
              ...T, fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: GOLD,
            }}>
              Presets
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(212,175,55,0.12)' }} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}>
            {PRESETS.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isActive={activeTemplate === preset.id}
                onApply={handleApply}
              />
            ))}
          </div>
        </div>

        {/* ── My Templates section ─────────────────────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{
              ...T, fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: GOLD,
            }}>
              My Templates
            </span>
            {customTemplates.length > 0 && (
              <span style={{
                ...T, fontSize: '10px', fontWeight: 700,
                background: `rgba(212,175,55,0.15)`,
                color: GOLD,
                border: `1px solid rgba(212,175,55,0.3)`,
                borderRadius: '100px',
                padding: '1px 7px',
              }}>
                {customTemplates.length}
              </span>
            )}
            <div style={{ flex: 1, height: '1px', background: 'rgba(212,175,55,0.12)' }} />
          </div>

          {loadingCustom ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)', ...T, fontSize: '14px' }}>
              Loading…
            </div>
          ) : customTemplates.length === 0 ? (
            <div style={{
              background: 'rgba(13,6,24,0.7)',
              border: '1px dashed rgba(212,175,55,0.15)',
              borderRadius: '14px',
              padding: '32px',
              textAlign: 'center',
            }}>
              <Layers size={28} color='rgba(212,175,55,0.25)' style={{ margin: '0 auto 10px' }} />
              <p style={{ ...T, color: 'rgba(255,255,255,0.35)', fontSize: '14px', margin: 0 }}>
                No custom templates yet. Create one below.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}>
              {customTemplates.map((tpl) => (
                <CustomCard
                  key={tpl.id}
                  tpl={tpl}
                  isActive={activeTemplate === tpl.id}
                  onApply={handleApply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Create Template (collapsible) ─────────────────────────────────── */}
        <div>
          <button
            onClick={() => setShowCreate((v) => !v)}
            style={{
              ...T,
              width: '100%',
              padding: '13px 18px',
              borderRadius: '12px',
              background: showCreate ? 'rgba(128,0,32,0.2)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showCreate ? `rgba(128,0,32,0.5)` : 'rgba(212,175,55,0.1)'}`,
              color: showCreate ? '#fff' : 'rgba(255,255,255,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={15} color={showCreate ? GOLD : 'rgba(255,255,255,0.4)'} />
              Create Custom Template
            </span>
            <motion.span
              animate={{ rotate: showCreate ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex' }}
            >
              <Plus size={14} color='rgba(255,255,255,0.3)' />
            </motion.span>
          </button>

          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  background: 'rgba(13,6,24,0.9)',
                  border: '1px solid rgba(212,175,55,0.12)',
                  borderTop: 'none',
                  borderRadius: '0 0 14px 14px',
                  padding: '20px 18px 22px',
                }}>
                  <CreateForm
                    userId={user?.id}
                    onSuccess={() => setShowCreate(false)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="overlay" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id || null} roomId={null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}
