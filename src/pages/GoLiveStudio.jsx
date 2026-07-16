import React, { useReducer, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';
import BitratePresets from '../components/streaming/BitratePresets';
import DestinationsManager from '../components/streaming/DestinationsManager';
import ChatModeration from '../components/live/ChatModeration';
import CameraSourcePicker from '../components/streaming/CameraSourcePicker';
import MultiGuestPanel from '../components/streaming/MultiGuestPanel';
import GreenroomQueue from '../components/streaming/GreenroomQueue';
import StreamMetadataEditor from '../components/streaming/StreamMetadataEditor';
import EnhancedIngestPanel from '../components/streaming/EnhancedIngestPanel';
import StreamingPresets from '../components/streaming/StreamingPresets';
import StreamAnalyticsDashboard from '../components/streaming/StreamAnalyticsDashboard';
import RTMPFanoutPanel from '../components/streaming/RTMPFanoutPanel';
import GuestInviteGenerator from '../components/streaming/GuestInviteGenerator';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ShareToSocial from '../components/social/ShareToSocial';
import {
  Radio, Video, Mic, Wifi, Shield, Layers, ChevronRight,
  AlertTriangle, Play, Square, SkipForward, Volume2, Monitor,
  Users, Clock, Activity, Zap, Youtube, Twitch, Facebook,
  ToggleLeft, ToggleRight, Eye, TrendingUp
} from 'lucide-react';

const RTMP_URL = 'rtmp://ingest.seewhylive.online:1935/live';
const CREATOR_SPLIT = 0.90;

const SCENES = [
  { id: 'main', label: 'Main Broadcast', icon: '📺' },
  { id: 'facecam', label: 'Face Cam Only', icon: '🎥' },
  { id: 'game', label: 'Game Focus', icon: '🁣' },
  { id: 'splitpk', label: 'Split Screen PK', icon: '⚔️' },
  { id: 'bracket', label: 'Tournament Bracket', icon: '🏆' },
  { id: 'brb', label: 'Be Right Back', icon: '☕' },
  { id: 'outro', label: 'Outro', icon: '👋' },
];

const DESTINATIONS = [
  { id: 'seewhy', label: 'SeeWhy LIVE', color: '#d4af37', required: true },
  { id: 'youtube', label: 'YouTube', color: '#FF0000', icon: Youtube },
  { id: 'twitch', label: 'Twitch', color: '#9146FF', icon: Twitch },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', icon: Facebook },
];

const initState = {
  phase: 'preflight', // preflight | countdown | live | ended
  countdown: null,
  scene: 'main',
  lowerThirdText: 'SeeWhy LIVE — Washington Classic',
  showLowerThird: false,
  micVol: 80,
  streamVol: 100,
  destinations: { seewhy: true, youtube: false, twitch: false, facebook: false },
  uptime: 0,
  bitrate: 0,
  fps: 0,
  droppedFrames: 0,
  latency: 0,
  viewerCount: 0,
  peakViewers: 0,
  guardianStatus: 'ARMED',
  checklist: {
    camera: false,
    mic: false,
    rtmp: false,
    streamKey: true,
    network: false,
    guardian: true,
    overlay: false,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PHASE': return { ...state, phase: action.payload };
    case 'SET_COUNTDOWN': return { ...state, countdown: action.payload };
    case 'SET_SCENE': return { ...state, scene: action.payload };
    case 'SET_LOWER_THIRD_TEXT': return { ...state, lowerThirdText: action.payload };
    case 'TOGGLE_LOWER_THIRD': return { ...state, showLowerThird: !state.showLowerThird };
    case 'SET_MIC_VOL': return { ...state, micVol: action.payload };
    case 'SET_STREAM_VOL': return { ...state, streamVol: action.payload };
    case 'TOGGLE_DESTINATION':
      if (action.payload === 'seewhy') return state;
      return { ...state, destinations: { ...state.destinations, [action.payload]: !state.destinations[action.payload] } };
    case 'TICK_UPTIME': return { ...state, uptime: state.uptime + 1 };
    case 'UPDATE_HEALTH':
      return {
        ...state,
        bitrate: action.payload.bitrate,
        fps: action.payload.fps,
        droppedFrames: action.payload.droppedFrames,
        latency: action.payload.latency,
        viewerCount: action.payload.viewerCount,
        peakViewers: Math.max(state.peakViewers, action.payload.viewerCount),
      };
    case 'CHECK_ITEM':
      return { ...state, checklist: { ...state.checklist, [action.payload]: true } };
    case 'UNCHECK_ITEM':
      return { ...state, checklist: { ...state.checklist, [action.payload]: false } };
    case 'PANIC': return { ...state, scene: 'brb', showLowerThird: false };
    default: return state;
  }
}

function formatUptime(secs) {
  var h = Math.floor(secs / 3600);
  var m = Math.floor((secs % 3600) / 60);
  var s = secs % 60;
  return (h > 0 ? String(h).padStart(2, '0') + ':' : '') +
    String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function CheckRow({ label, checked, onCheck, onUncheck }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ color: checked ? '#d4af37' : 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</span>
      <button
        onClick={() => checked ? onUncheck() : onCheck()}
        style={{ width: 28, height: 28, borderRadius: 6, border: checked ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.2)', background: checked ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', color: checked ? '#d4af37' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
      >
        {checked ? '✓' : ''}
      </button>
    </div>
  );
}

function StatBox({ label, value, unit, color, warn }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', minWidth: 90 }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: warn ? '#ff4444' : (color || '#d4af37'), fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1 }}>{value}<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>{unit}</span></div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

export default function GoLiveStudio() {
  const [state, dispatch] = useReducer(reducer, initState);
  const uptimeRef = useRef(null);
  const healthRef = useRef(null);
  const countdownRef = useRef(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;

  var allChecked = Object.values(state.checklist).every(Boolean);

  // Simulate health metrics while live
  useEffect(() => {
    if (state.phase !== 'live') return;
    uptimeRef.current = setInterval(() => dispatch({ type: 'TICK_UPTIME' }), 1000);
    healthRef.current = setInterval(() => {
      dispatch({
        type: 'UPDATE_HEALTH',
        payload: {
          bitrate: 5800 + Math.floor(Math.random() * 400),
          fps: 59 + Math.round(Math.random()),
          droppedFrames: Math.floor(Math.random() * 3),
          latency: 80 + Math.floor(Math.random() * 40),
          viewerCount: state.viewerCount + Math.floor(Math.random() * 3) - 1,
        },
      });
    }, 2000);
    return () => {
      clearInterval(uptimeRef.current);
      clearInterval(healthRef.current);
    };
  }, [state.phase]);

  function startGoLive() {
    if (!allChecked) return;
    dispatch({ type: 'SET_PHASE', payload: 'countdown' });
    dispatch({ type: 'SET_COUNTDOWN', payload: 3 });
    var count = 3;
    countdownRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(countdownRef.current);
        dispatch({ type: 'SET_COUNTDOWN', payload: null });
        dispatch({ type: 'SET_PHASE', payload: 'live' });
      } else {
        dispatch({ type: 'SET_COUNTDOWN', payload: count });
      }
    }, 1000);
  }

  function endStream() {
    clearInterval(uptimeRef.current);
    clearInterval(healthRef.current);
    dispatch({ type: 'SET_PHASE', payload: 'ended' });
  }

  var isLive = state.phase === 'live';
  var isCountdown = state.phase === 'countdown';
  var activeScene = SCENES.find(s => s.id === state.scene) || SCENES[0];

  return (
    <div style={{ minHeight: '100vh', background: '#07050A', color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>

      {/* Countdown overlay */}
      {isCountdown && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div style={{ fontSize: 160, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: '#d4af37', lineHeight: 1, textShadow: '0 0 60px rgba(212,175,55,0.8)' }}>{state.countdown}</div>
          <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', marginTop: 12, letterSpacing: '0.3em', fontFamily: 'Barlow Condensed, sans-serif' }}>GOING LIVE...</div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.7)', borderBottom: '1px solid rgba(212,175,55,0.15)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6B4423, #d4af37)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Radio size={18} color="#000" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>GO LIVE STUDIO</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>SeeWhy LIVE · Multi-Platform Studio</div>
        </div>
        {isLive && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.5)', borderRadius: 8, padding: '4px 12px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 900, color: '#ef4444', fontFamily: 'Barlow Condensed, sans-serif' }}>LIVE · {formatUptime(state.uptime)}</span>
          </div>
        )}
        {isLive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={14} color="rgba(255,255,255,0.4)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>{Math.max(0, state.viewerCount)}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>viewers</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stream Preview / Scene Indicator */}
          <div style={{ background: '#0d0d18', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 14, overflow: 'hidden', aspectRatio: '16/9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 48 }}>{activeScene.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>{activeScene.label}</div>
            {isLive && (
              <div style={{ position: 'absolute', top: 12, left: 12, background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 900, padding: '3px 10px', borderRadius: 6, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>● LIVE</div>
            )}
            {state.showLowerThird && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(90deg, rgba(7,5,10,0.95), rgba(212,175,55,0.15))', borderTop: '2px solid #d4af37', padding: '10px 16px' }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>SeeWhy LIVE</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{state.lowerThirdText}</div>
              </div>
            )}
          </div>

          {/* Scene Switcher */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginBottom: 10, fontFamily: 'Barlow Condensed, sans-serif' }}>SCENE SWITCHER</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SCENES.map(scene => (
                <button
                  key={scene.id}
                  onClick={() => dispatch({ type: 'SET_SCENE', payload: scene.id })}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: state.scene === scene.id ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.12)',
                    background: state.scene === scene.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                    color: state.scene === scene.id ? '#d4af37' : 'rgba(255,255,255,0.6)',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span>{scene.icon}</span> {scene.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lower Third */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', fontFamily: 'Barlow Condensed, sans-serif' }}>LOWER THIRD BANNER</div>
              <button onClick={() => dispatch({ type: 'TOGGLE_LOWER_THIRD' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: state.showLowerThird ? '#d4af37' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                {state.showLowerThird ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                {state.showLowerThird ? 'ON' : 'OFF'}
              </button>
            </div>
            <input
              value={state.lowerThirdText}
              onChange={e => dispatch({ type: 'SET_LOWER_THIRD_TEXT', payload: e.target.value })}
              placeholder="Banner text..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Audio Controls */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginBottom: 12, fontFamily: 'Barlow Condensed, sans-serif' }}>AUDIO CONTROLS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Host Mic', value: state.micVol, action: 'SET_MIC_VOL', icon: Mic, color: '#d4af37' },
                { label: 'Stream Audio', value: state.streamVol, action: 'SET_STREAM_VOL', icon: Volume2, color: '#D4854A' },
              ].map(ctrl => {
                var Icon = ctrl.icon;
                return (
                  <div key={ctrl.action} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icon size={16} color={ctrl.color} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.6)', width: 90, flexShrink: 0 }}>{ctrl.label}</span>
                    <input
                      type="range" min={0} max={100} value={ctrl.value}
                      onChange={e => dispatch({ type: ctrl.action, payload: Number(e.target.value) })}
                      style={{ flex: 1, accentColor: ctrl.color }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: ctrl.color, fontFamily: 'Barlow Condensed, sans-serif', width: 32, textAlign: 'right' }}>{ctrl.value}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stream Health (only when live) */}
          {isLive && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginBottom: 12, fontFamily: 'Barlow Condensed, sans-serif' }}>STREAM HEALTH</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <StatBox label="BITRATE" value={state.bitrate} unit="kbps" warn={state.bitrate < 4000} />
                <StatBox label="FPS" value={state.fps} unit="fps" />
                <StatBox label="DROPPED" value={state.droppedFrames} unit="fr" warn={state.droppedFrames > 5} />
                <StatBox label="LATENCY" value={state.latency} unit="ms" warn={state.latency > 200} />
                <StatBox label="VIEWERS" value={Math.max(0, state.viewerCount)} color="#6DBF7E" />
                <StatBox label="PEAK" value={state.peakViewers} color="#C0392B" />
              </div>
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(109,191,126,0.06)', border: '1px solid rgba(109,191,126,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={14} color="#6DBF7E" />
                <span style={{ fontSize: 12, color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>Target: 6000 kbps · {state.bitrate >= 5000 ? 'Excellent' : state.bitrate >= 4000 ? 'Good' : 'Poor'} connection</span>
              </div>
            </div>
          )}

          {/* Emergency Controls */}
          {isLive && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => dispatch({ type: 'PANIC' })}
                style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, color: '#ef4444', fontWeight: 900, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <AlertTriangle size={16} /> PANIC CUT
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_SCENE', payload: 'brb' })}
                style={{ flex: 1, padding: '12px', background: 'rgba(212,133,74,0.15)', border: '1px solid rgba(212,133,74,0.4)', borderRadius: 10, color: '#D4854A', fontWeight: 900, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                ☕ BREAK CARD
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Pre-flight Checklist */}
          {state.phase === 'preflight' && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#d4af37', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'Barlow Condensed, sans-serif' }}>PRE-FLIGHT CHECKLIST</div>
              {[
                { key: 'camera', label: '📷 Camera Ready' },
                { key: 'mic', label: '🎙 Microphone Ready' },
                { key: 'rtmp', label: '📡 RTMP Connection' },
                { key: 'streamKey', label: '🔑 Stream Key Set' },
                { key: 'network', label: '🌐 Upload Speed OK' },
                { key: 'guardian', label: '🛡 Guardian AI Armed' },
                { key: 'overlay', label: '🎨 Overlay Package' },
              ].map(item => (
                <CheckRow
                  key={item.key}
                  label={item.label}
                  checked={state.checklist[item.key]}
                  onCheck={() => dispatch({ type: 'CHECK_ITEM', payload: item.key })}
                  onUncheck={() => dispatch({ type: 'UNCHECK_ITEM', payload: item.key })}
                />
              ))}
              <div style={{ marginTop: 12, padding: '8px 10px', background: allChecked ? 'rgba(109,191,126,0.08)' : 'rgba(212,133,74,0.08)', border: '1px solid ' + (allChecked ? 'rgba(109,191,126,0.25)' : 'rgba(212,133,74,0.25)'), borderRadius: 8, fontSize: 12, color: allChecked ? '#6DBF7E' : '#D4854A', fontFamily: 'Barlow Condensed, sans-serif', textAlign: 'center' }}>
                {allChecked ? '✓ All systems ready' : `${Object.values(state.checklist).filter(Boolean).length}/7 checks complete`}
              </div>
            </div>
          )}

          {/* RTMP Info */}
          <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#d4af37', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'Barlow Condensed, sans-serif' }}>RTMP INGEST</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontFamily: 'Barlow Condensed, sans-serif' }}>SERVER</div>
            <div style={{ fontSize: 12, color: '#d4af37', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '6px 10px', marginBottom: 8, wordBreak: 'break-all', fontFamily: 'Share Tech Mono, monospace' }}>{RTMP_URL}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontFamily: 'Barlow Condensed, sans-serif' }}>STREAM KEY</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '6px 10px', fontFamily: 'Share Tech Mono, monospace', letterSpacing: '0.05em' }}>••••••••••••••</div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', textAlign: 'center' }}>
              Find your stream key in Settings → Stream Keys
            </div>
          </div>

          {/* Multi-Destination */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'Barlow Condensed, sans-serif' }}>MULTI-DESTINATION</div>
            {DESTINATIONS.map(dest => (
              <div key={dest.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dest.color }} />
                  <span style={{ fontSize: 13, color: state.destinations[dest.id] ? '#fff' : 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>{dest.label}</span>
                  {dest.required && <span style={{ fontSize: 9, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>PRIMARY</span>}
                </div>
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_DESTINATION', payload: dest.id })}
                  disabled={dest.required}
                  style={{ width: 36, height: 20, borderRadius: 10, border: 'none', background: state.destinations[dest.id] ? dest.color : 'rgba(255,255,255,0.15)', cursor: dest.required ? 'default' : 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}
                >
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: state.destinations[dest.id] ? 19 : 3, transition: 'left 0.2s' }} />
                </button>
              </div>
            ))}
          </div>

          {/* Guardian Status */}
          <div style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={20} color="#C0392B" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif' }}>GUARDIAN AI</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{state.guardianStatus} · Thresholds: 0.50 / 0.75 / 0.95</div>
            </div>
            <div style={{ marginLeft: 'auto', width: 10, height: 10, borderRadius: '50%', background: '#6DBF7E', boxShadow: '0 0 8px #6DBF7E' }} />
          </div>

          {/* 90/10 Split Notice */}
          <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 11, color: 'rgba(212,175,55,0.8)', fontFamily: 'Barlow Condensed, sans-serif', textAlign: 'center', letterSpacing: '0.05em' }}>
            🔒 CREATOR_SPLIT = 0.90 · IMMUTABLE · You keep 90% of all revenue
          </div>

          {/* Go Live / End Stream Button */}
          {state.phase === 'preflight' && (
            <button
              onClick={startGoLive}
              disabled={!allChecked}
              style={{
                width: '100%', padding: '16px', borderRadius: 12, border: 'none',
                background: allChecked ? 'linear-gradient(135deg, #b91c1c, #d4af37)' : 'rgba(255,255,255,0.08)',
                color: allChecked ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize: 20, fontWeight: 900, cursor: allChecked ? 'pointer' : 'not-allowed',
                fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                opacity: allChecked ? 1 : 0.5, transition: 'all 0.2s',
              }}
            >
              <Radio size={20} /> GO LIVE
            </button>
          )}

          {state.phase === 'ended' && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>Stream Ended</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Duration: {formatUptime(state.uptime)} · Peak: {state.peakViewers} viewers</div>
              <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 8, color: '#d4af37', fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14 }}>
                New Stream
              </button>
            </div>
          )}

          {isLive && (
            <button
              onClick={endStream}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Square size={16} /> END STREAM
            </button>
          )}
        </div>
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 32 }}>
        <StreamHealthDashboard isLive={false} />
        <BitratePresets selected={null} onChange={() => {}} />
        <DestinationsManager userId={user?.id} />
        <ChatModeration />
        <CameraSourcePicker onSourceSelected={() => {}} currentDeviceId={null} />
        <StreamMetadataEditor />
        <EnhancedIngestPanel roomId={activeRoomId} isHost={true} />
        <GreenroomQueue roomId={activeRoomId} isHost={true} />
        <MultiGuestPanel participants={[]} spotlightId={null} onSpotlight={() => {}} roomId={activeRoomId} isHost={true} />
        <StreamingPresets onApply={() => {}} />
        <StreamAnalyticsDashboard roomId={activeRoomId} isHost={true} isLive={false} />
        {user?.id && <RTMPFanoutPanel userId={user.id} isStreaming={state.phase === 'live'} streamId={activeRoomId} />}
        {user?.id && <GuestInviteGenerator userId={user.id} roomId={activeRoomId} />}
        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OnlineUsersGrid compact maxVisible={10} />
          <ContentRecommendations />
          <CollaborationMatcher />
          <ShareToSocial url={window.location.href} title="SeeWhy LIVE" />
        </div>
      </div>
    </div>
  );
}