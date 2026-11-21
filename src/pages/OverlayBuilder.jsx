import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Save, Copy, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import AlertConfig from '../components/live/AlertConfig';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import ShopDashboard from '../components/merch/ShopDashboard';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CreatorBridge from '../components/social/CreatorBridge';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

var GOLD = '#D4AF37';
var BURGUNDY = '#800020';
var CREAM = '#F5E6D3';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };

var ELEMENT_TYPES = [
  { id: 'stream_info',    label: 'Stream Info',     icon: '📡', desc: 'Title + viewer count' },
  { id: 'goal_bar',       label: 'Goal Bar',        icon: '🎯', desc: 'Streamer goal progress' },
  { id: 'recent_events',  label: 'Recent Events',   icon: '📨', desc: 'Tips, subs, gift feed' },
  { id: 'chat_overlay',   label: 'Chat Overlay',    icon: '💬', desc: 'Scrolling chat' },
  { id: 'branding',       label: 'Branding',        icon: '🏷', desc: 'Logo + watermark' },
  { id: 'alert_box',      label: 'Alert Box',       icon: '🔔', desc: 'Sub/tip alerts' },
];

var PRESETS = {
  Gaming:    [{ type: 'stream_info', x: 2, y: 2, w: 30, h: 8 }, { type: 'goal_bar', x: 2, y: 85, w: 40, h: 8 }, { type: 'chat_overlay', x: 75, y: 20, w: 23, h: 60 }, { type: 'alert_box', x: 30, y: 2, w: 40, h: 10 }],
  Podcast:   [{ type: 'branding', x: 40, y: 85, w: 20, h: 10 }, { type: 'recent_events', x: 75, y: 5, w: 23, h: 50 }],
  TalkShow:  [{ type: 'stream_info', x: 2, y: 2, w: 25, h: 8 }, { type: 'recent_events', x: 2, y: 70, w: 30, h: 22 }, { type: 'branding', x: 80, y: 90, w: 18, h: 8 }],
  Tournament:[{ type: 'stream_info', x: 35, y: 1, w: 30, h: 8 }, { type: 'goal_bar', x: 2, y: 90, w: 96, h: 7 }, { type: 'alert_box', x: 30, y: 10, w: 40, h: 12 }, { type: 'chat_overlay', x: 75, y: 25, w: 23, h: 65 }],
};

var DEFAULT_CONFIG = {
  stream_info:   { showTitle: true, showViewers: true, textColor: '#FFFFFF', bgOpacity: 0.7 },
  goal_bar:      { goalId: '', fillColor: GOLD, labelText: 'Goal', height: 8 },
  recent_events: { maxItems: 5, showTips: true, showSubs: true, showGifts: true, fontSize: 12 },
  chat_overlay:  { maxMessages: 10, fontSize: 12, showBadges: true, bgOpacity: 0.5 },
  branding:      { logoUrl: '', text: 'SeeWhy LIVE', textColor: GOLD, fontSize: 16 },
  alert_box:     { triggerType: 'tip', animStyle: 'slide', sound: 'cash_register' },
};

function ElementOnCanvas({ el, selected, onClick }) {
  var type = ELEMENT_TYPES.find(t => t.id === el.type);
  return (
    <div
      onClick={onClick}
      className="absolute cursor-pointer flex items-center justify-center transition-all"
      style={{
        left: `${el.x}%`, top: `${el.y}%`,
        width: `${el.w}%`, height: `${el.h}%`,
        border: selected ? `2px solid ${GOLD}` : `1px dashed rgba(212,175,55,0.4)`,
        background: selected ? `rgba(212,175,55,0.12)` : 'rgba(212,175,55,0.04)',
        borderRadius: 6,
        boxShadow: selected ? `0 0 16px rgba(212,175,55,0.25)` : undefined,
      }}>
      <div className="text-center pointer-events-none">
        <div className="text-lg leading-none">{(type && type.icon)}</div>
        <div className="text-[7px] font-black uppercase mt-0.5" style={{ color: GOLD, ...T }}>{(type && type.label)}</div>
      </div>
    </div>
  );
}

function ConfigPanel({ element, goals, onChange, onRemove }) {
  if (!element) return (
    <div className="flex flex-col items-center justify-center h-full gap-2 p-6">
      <Layers className="w-8 h-8" style={{ color: GOLD + '30' }} />
      <p className="text-[10px] text-center" style={{ color: CREAM + '30' }}>Select an element to configure it</p>
    </div>
  );

  var cfg = element.config || DEFAULT_CONFIG[element.type] || {};
  var field = (key, label, type = 'text', opts = []) => (
    <div key={key}>
      <label className="text-[11px] uppercase font-black block mb-1" style={{ color: CREAM + '35', ...T }}>{label}</label>
      {type === 'bool'
        ? <button aria-label={`Toggle ${label}`} aria-pressed={!!cfg[key]} onClick={() => onChange({ config: { ...cfg, [key]: !cfg[key] } })}
            className="w-8 h-4 rounded-full relative" style={{ background: cfg[key] ? GOLD : 'rgba(255,255,255,0.1)' }}>
            <motion.div animate={{ x: cfg[key] ? 16 : 2 }} transition={{ type: 'spring', stiffness: 400 }}
              className="absolute top-0.5 w-3 h-3 rounded-full" style={{ background: cfg[key] ? '#000' : 'rgba(255,255,255,0.4)' }} />
          </button>
        : type === 'select'
        ? <Select value={cfg[key] || ''} onValueChange={value => onChange({ config: { ...cfg, [key]: value } })}>
            <SelectTrigger className="w-full px-2 py-1 rounded text-[11px] outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        : type === 'number'
        ? <input type="number" value={cfg[key] || 0} onChange={e => onChange({ config: { ...cfg, [key]: Number(e.target.value) } })}
            className="w-full px-2 py-1 rounded text-[11px] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM }} />
        : <input value={cfg[key] || ''} onChange={e => onChange({ config: { ...cfg, [key]: e.target.value } })}
            className="w-full px-2 py-1 rounded text-[11px] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM }} />
      }
    </div>
  );

  var fieldsByType = {
    stream_info:   [['showTitle','Show Title','bool'],['showViewers','Show Viewers','bool'],['textColor','Text Color'],['bgOpacity','BG Opacity','number']],
    goal_bar:      [['goalId','Goal',  'select', goals.map(g => g.id).concat([''])],['fillColor','Fill Color'],['labelText','Label'],['height','Height px','number']],
    recent_events: [['maxItems','Max Items','number'],['showTips','Show Tips','bool'],['showSubs','Show Subs','bool'],['showGifts','Show Gifts','bool'],['fontSize','Font Size','number']],
    chat_overlay:  [['maxMessages','Max Messages','number'],['fontSize','Font Size','number'],['showBadges','Show Badges','bool'],['bgOpacity','BG Opacity','number']],
    branding:      [['logoUrl','Logo URL'],['text','Text'],['textColor','Text Color'],['fontSize','Font Size','number']],
    alert_box:     [['triggerType','Trigger','select',['tip','subscription','gift']],['animStyle','Animation','select',['slide','bounce','fade']],['sound','Sound','select',['cash_register','fanfare','chime','coin']]],
  };

  var fields = fieldsByType[element.type] || [];

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase" style={{ color: GOLD, ...T }}>
          {ELEMENT_TYPES.find(t => t.id === element.type) && ELEMENT_TYPES.find(t => t.id === element.type).label}
        </p>
        <button onClick={onRemove} className="text-[11px] px-1.5 py-0.5 rounded font-black uppercase"
          style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444', ...T }}>Remove</button>
      </div>
      <div className="space-y-2">
        {fields.map(([key, label, type = 'text', opts]) => field(key, label, type, opts))}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[['x','X %','number'],['y','Y %','number'],['w','Width %','number'],['h','Height %','number']].map(([key, label]) => (
          <div key={key}>
            <label className="text-[7px] uppercase" style={{ color: CREAM + '30', ...T }}>{label}</label>
            <input type="number" value={element[key] || 0} onChange={e => onChange({ [key]: Number(e.target.value) })}
              className="w-full px-2 py-1 rounded text-[11px] outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: CREAM }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OverlayBuilderPage() {
  var [elements, setElements] = useState([]);
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);

  var [selected, setSelected] = useState(null);
  var [layoutName, setLayoutName] = useState('My Overlay');
  var [selectedLayout, setSelectedLayout] = useState(null);
  var qc = useQueryClient();

  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  var { data: activeRoom } = useQuery({
    queryKey: ['overlaybuilder-active-room', (user && user.id)],
    queryFn: () => base44.entities.Room.filter({ host_id: user.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var { data: layouts = [] } = useQuery({
    queryKey: ['overlay-layouts', (user && user.id)],
    queryFn: () => base44.entities.OverlayLayout.filter({ creator_id: (user && user.id) }),
    enabled: !!(user && user.id),
  });
  var { data: goals = [] } = useQuery({
    queryKey: ['overlay-goals', (user && user.id)],
    queryFn: () => base44.entities.StreamerGoal.filter({ creator_id: (user && user.id), status: 'active' }),
    enabled: !!(user && user.id),
  });

  useEffect(() => {
    if (selectedLayout) {
      var layout = layouts.find(l => l.id === selectedLayout);
      if (layout) { setElements(layout.elements || []); setLayoutName(layout.name || ''); }
    }
  }, [selectedLayout, layouts]);

  var saveMut = useMutation({
    mutationFn: () => {
      var data = { name: layoutName, elements, creator_id: (user && user.id), is_active: false };
      if (selectedLayout) return base44.entities.OverlayLayout.update(selectedLayout, data);
      return base44.entities.OverlayLayout.create(data);
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['overlay-layouts'] });
      if (!selectedLayout) setSelectedLayout(result.id);
      toast.success('Overlay saved!');
      if ((user && user.id)) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'milestone',
          title: `Saved overlay layout: ${layoutName || 'Overlay'}`,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Action failed.'),
  });
  var toggleActiveMut = useMutation({
    mutationFn: async (id) => {
      await Promise.all(layouts.map(l => base44.entities.OverlayLayout.update(l.id, { is_active: l.id === id })));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['overlay-layouts'] }),
    onError: () => toast.error('Action failed.'),
  });

  var addElement = (type) => {
    setElements(prev => [...prev, { id: Date.now(), type, x: 5, y: 5, w: 25, h: 12, config: { ...DEFAULT_CONFIG[type] } }]);
  };
  var updateElement = (id, patch) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...patch } : el));
  };
  var removeElement = (id) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selected === id) setSelected(null);
  };
  var applyPreset = (presetName) => {
    var preset = PRESETS[presetName];
    if (!preset) return;
    setElements(preset.map((p, i) => ({ ...p, id: Date.now() + i, config: { ...DEFAULT_CONFIG[p.type] } })));
    setSelected(null);
  };

  var activeLayout = layouts.find(l => l.is_active);
  var selectedEl = elements.find(el => el.id === selected);
  var obsUrl = `https://seewhylive.online/overlay/live?creator_id=${(user && user.id)}&layout_id=${selectedLayout || 'NEW'}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080B18' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: 'rgba(8,11,24,0.9)', borderBottom: `1px solid rgba(212,175,55,0.12)` }}>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl('BroadcastStudio')} style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em' }}>← Studio</Link>
          <Link to={createPageUrl('OverlayEditor')} style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em' }}>Editor</Link>
          <Layers className="w-4 h-4" style={{ color: GOLD }} />
          <span className="font-black uppercase text-sm" style={{ color: GOLD, ...T }}>OBS Overlay Builder</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset selector */}
          <Select value="" onValueChange={value => { if (value) applyPreset(value); }}>
            <SelectTrigger aria-label="Load preset" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: CREAM, fontSize: 10, padding: '5px 8px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', minWidth: 110 }}>
              <SelectValue placeholder="Load Preset…" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(PRESETS).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          {/* Load layout */}
          {layouts.length > 0 && (
            <Select value={selectedLayout || ''} onValueChange={v => setSelectedLayout(v || null)}>
              <SelectTrigger aria-label="Select layout" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: CREAM, fontSize: 10, padding: '5px 8px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', minWidth: 120 }}>
                <SelectValue placeholder="New Layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">New Layout</SelectItem>
                {layouts.map(l => <SelectItem key={l.id} value={l.id}>{l.name}{l.is_active ? ' ●' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <input value={layoutName} onChange={e => setLayoutName(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-[10px] outline-none w-32"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM }}
            maxLength={80} />
          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-black uppercase text-[10px]"
            style={{ background: BURGUNDY, color: GOLD, border: `1px solid rgba(212,175,55,0.3)`, ...T }}>
            <Save className="w-3 h-3" /> Save
          </button>
          {selectedLayout && (
            <button onClick={() => toggleActiveMut.mutate(selectedLayout)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-black uppercase text-[10px]"
              style={{ background: (activeLayout && activeLayout.id) === selectedLayout ? 'rgba(109,191,126,0.15)' : 'rgba(255,255,255,0.06)', color: (activeLayout && activeLayout.id) === selectedLayout ? '#6DBF7E' : CREAM + '60', border: '1px solid rgba(255,255,255,0.1)', ...T }}>
              {(activeLayout && activeLayout.id) === selectedLayout ? '● Active' : 'Set Active'}
            </button>
          )}
          <button onClick={() => { navigator.clipboard.writeText(obsUrl).then(() => toast.success('OBS URL copied!')).catch(() => toast.error('Copy failed.')); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-black uppercase text-[10px]"
            style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)', ...T }}>
            <Copy className="w-3 h-3" /> OBS URL
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Element Palette */}
        <div className="w-44 shrink-0 overflow-y-auto p-3 space-y-2"
          style={{ background: '#161616', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[11px] font-black uppercase mb-2" style={{ color: CREAM + '35', ...T }}>Elements</p>
          {ELEMENT_TYPES.map(t => (
            <button key={t.id} onClick={() => addElement(t.id)}
              className="w-full flex items-center gap-2 p-2 rounded-xl transition-all text-left"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-lg shrink-0">{t.icon}</span>
              <div>
                <p className="text-[11px] font-black" style={{ color: CREAM + '80', ...T }}>{t.label}</p>
                <p className="text-[7px]" style={{ color: CREAM + '30' }}>{t.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto" style={{ background: '#111' }}>
          <div className="relative w-full max-w-3xl"
            style={{ aspectRatio: '16/9', background: '#080B18', border: `1px solid rgba(212,175,55,0.2)`, borderRadius: 8 }}>
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)`,
                backgroundSize: '10% 10%',
              }} />
            {/* Reference label */}
            <div className="absolute top-1 left-2 text-[7px] font-black opacity-30" style={{ color: GOLD, ...T }}>1920×1080 reference</div>
            {elements.map(el => (
              <ElementOnCanvas
                key={el.id}
                el={el}
                selected={selected === el.id}
                onClick={() => setSelected(el.id)}
              />
            ))}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[12px] font-black uppercase" style={{ color: GOLD + '30', ...T }}>Canvas Empty</p>
                  <p className="text-[11px] mt-1" style={{ color: CREAM + '20' }}>Add elements from the palette or load a preset</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Config */}
        <div className="w-52 shrink-0 overflow-y-auto"
          style={{ background: '#161616', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          <ConfigPanel
            element={selectedEl}
            goals={goals}
            onChange={(patch) => selectedEl && updateElement(selectedEl.id, patch)}
            onRemove={() => selectedEl && removeElement(selectedEl.id)}
          />
        </div>
      </div>
      <SwanAIRecommendations roomId={activeRoomId} currentLayout="overlay" viewerCount={(activeRoom && activeRoom.viewer_count) || 0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={activeRoomId} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={(activeRoom && activeRoom.viewer_count) || 0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={activeRoomId} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={(activeRoom && activeRoom.viewer_count) || 0} peakViewers={(activeRoom && activeRoom.peak_viewers) || 0} />
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
