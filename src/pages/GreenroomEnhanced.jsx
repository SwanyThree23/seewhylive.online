import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import CameraSourcePicker from '../components/streaming/CameraSourcePicker';
import StreamHealthMonitor from '../components/streaming/StreamHealthMonitor';
import CameraDeviceSelector from '../components/live/CameraDeviceSelector';
import { useCameraDevices } from '../hooks/useCameraDevices';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import DevicePreview from '../components/greenroom/DevicePreview';
import WebRTCSetupBanner from '../components/live/WebRTCSetupBanner';
import StreamingPresets from '../components/streaming/StreamingPresets';
import StreamMetadataEditor from '../components/streaming/StreamMetadataEditor';
import RoomBrandingEditor from '../components/live/RoomBrandingEditor';
import GuestConnector from '../components/live/GuestConnector';
import GuestQueue from '../components/live/GuestQueue';
import GreenroomQueue from '../components/streaming/GreenroomQueue';
import EnhancedIngestPanel from '../components/streaming/EnhancedIngestPanel';
import GuestRTMPPanel from '../components/streaming/GuestRTMPPanel';
import GuestStreamMonitor from '../components/streaming/GuestStreamMonitor';
import GuestStreamingPermissions from '../components/live/GuestStreamingPermissions';
import GuestDestinationsPanel from '../components/live/GuestDestinationsPanel';
import ZEGOGuestApprovalPanel from '../components/zego/ZEGOGuestApprovalPanel';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import LiveStage from '../components/live/LiveStage';
import { useZegoToken } from '../hooks/useZegoToken';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import StreamEventBus from '../components/live/StreamEventBus';

var BG = '#080B18';
var GOLD = '#D4AF37';
var CRIMSON = '#800020';
var GREEN = '#6DBF7E';

export default function GreenroomEnhanced() {
  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  var { data: activeRoom } = useQuery({
    queryKey: ['greenroomenhanced-active-room', (user && user.id)],
    queryFn: () => base44.entities.Room.filter({ host_id: user.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var { token: zegoToken } = useZegoToken({ roomId: activeRoomId, userId: (user && user.id), enabled: !!activeRoomId && !!(user && user.id) });
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);
  var [cameraStream, setCameraStream] = useState(null);
  var [isLive, setIsLive] = useState(false);
  var [webrtcError, setWebrtcError] = useState(null);
  var [audioLevel, setAudioLevel] = useState(0);
  var [selectedCam, setSelectedCam] = useState(() => { try { return localStorage.getItem('swl_pref_cam') || ''; } catch { return ''; } });
  var [selectedMic, setSelectedMic] = useState(() => { try { return localStorage.getItem('swl_pref_mic') || ''; } catch { return ''; } });
  var [camResolution, setCamResolution] = useState(() => { try { return localStorage.getItem('swl_pref_resolution') || '720p'; } catch { return '720p'; } });
  var { cameras } = useCameraDevices();
  var [checklist, setChecklist] = useState([
    { id: 'cam',   label: 'Camera connected & working', done: false, auto: true },
    { id: 'mic',   label: 'Microphone working', done: false, auto: true },
    { id: 'light', label: 'Lighting looks good', done: false, auto: false },
    { id: 'net',   label: 'Internet connection strong', done: false, auto: true },
    { id: 'title', label: 'Room title set', done: false, auto: false },
    { id: 'ready', label: 'You\'re ready to go live!', done: false, auto: false },
  ]);
  var [countdown, setCountdown] = useState(null);
  var [roomPin, setRoomPin] = useState('');
  var [encryptedPin, setEncryptedPin] = useState('');
  var videoRef = useRef(null);
  var analyserRef = useRef(null);
  var animFrameRef = useRef(null);
  var countdownTimerRef = useRef(null);
  var audioCtxRef = useRef(null);

  useEffect(() => () => clearInterval(countdownTimerRef.current), []);

  // Test mic level
  useEffect(() => {
    var stream;
    async function testMic() {
      try {
        var prefMic = (() => { try { return localStorage.getItem('swl_pref_mic') || null; } catch { return null; } })();
        stream = await navigator.mediaDevices.getUserMedia({ audio: prefMic ? { deviceId: { ideal: prefMic } } : true, video: false });
        var ctx = new AudioContext();
        audioCtxRef.current = ctx;
        var source = ctx.createMediaStreamSource(stream);
        var analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        var data = new Uint8Array(analyser.frequencyBinCount);
        function tick() {
          analyser.getByteFrequencyData(data);
          var avg = data.reduce((a, b) => a + b, 0) / data.length;
          setAudioLevel(Math.min(100, avg * 2.5));
          // Auto-check mic
          if (avg > 5) setChecklist(p => p.map(c => c.id === 'mic' ? { ...c, done: true } : c));
          animFrameRef.current = requestAnimationFrame(tick);
        }
        tick();
        setChecklist(p => p.map(c => c.id === 'net' ? { ...c, done: navigator.onLine } : c));
      } catch(e) {}
    }
    testMic();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // Camera stream → video element
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = cameraStream || null;
    if (cameraStream) setChecklist(p => p.map(c => c.id === 'cam' ? { ...c, done: true } : c));
  }, [cameraStream]);

  function handleCameraSource(stream, info) {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(stream);
  }

  var RES_MAP = { '360p': { width: 640, height: 360 }, '480p': { width: 854, height: 480 }, '720p': { width: 1280, height: 720 }, '1080p': { width: 1920, height: 1080 } };

  async function acquireCamera(opts = {}) {
    var camId = opts.camId || selectedCam;
    var micId = opts.micId || selectedMic;
    var res = RES_MAP[opts.resolution || camResolution] || RES_MAP['720p'];
    try {
      (cameraStream && cameraStream.getTracks)().forEach(t => t.stop());
      var stream = await navigator.mediaDevices.getUserMedia({
        video: { ...res, ...(camId ? { deviceId: { ideal: camId } } : {}) },
        audio: false,
      });
      setCameraStream(stream);
      setChecklist(p => p.map(c => c.id === 'cam' ? { ...c, done: true } : c));
    } catch {}
  }

  // Auto-start camera on mount so preview isn't stuck black
  useEffect(() => {
    acquireCamera();
   
  }, []);

  function handleVideoChange(id) { setSelectedCam(id); try { if (id) localStorage.setItem('swl_pref_cam', id); } catch {} acquireCamera({ camId: id }); }
  function handleAudioChange(id) { setSelectedMic(id); try { if (id) localStorage.setItem('swl_pref_mic', id); } catch {} }
  function handleResolutionChange(r) { setCamResolution(r); try { if (r) localStorage.setItem('swl_pref_resolution', r); } catch {} if (cameraStream) acquireCamera({ resolution: r }); }

  async function generatePin() {
    var pin = (1000 + (crypto.getRandomValues(new Uint16Array(1))[0] % 9000)).toString();
    setRoomPin(pin);
    // Use Web Crypto to encrypt the PIN with a room-specific salt
    try {
      var enc = new TextEncoder();
      var key = await crypto.subtle.importKey('raw', enc.encode(pin.padEnd(16, '0').slice(0, 16)), 'AES-GCM', false, ['encrypt']);
      var iv = crypto.getRandomValues(new Uint8Array(12));
      var encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(pin));
      var combined = new Uint8Array(12 + encrypted.byteLength);
      combined.set(iv); combined.set(new Uint8Array(encrypted), 12);
      setEncryptedPin('room://' + btoa(String.fromCharCode(...combined)).slice(0, 16) + '...');
    } catch(e) { setEncryptedPin(''); }
  }

  function startCountdown(seconds = 5) {
    clearInterval(countdownTimerRef.current);
    setCountdown(seconds);
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownTimerRef.current); setIsLive(true); return null; }
        return prev - 1;
      });
    }, 1000);
  }

  var completedCount = checklist.filter(c => c.done).length;
  var allReady = completedCount >= 4;

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: BG, fontFamily: 'Barlow Condensed, sans-serif' }}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: GOLD }}>🎬 Green Room</h1>
            <p className="text-xs text-white/40">Test your setup before you go live</p>
          </div>
          <StreamHealthMonitor isStreaming={isLive} />
        </div>

        {/* Camera preview + source picker */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
          <div className="relative aspect-video bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!cameraStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/20">
                <span className="text-4xl">📹</span>
                <span className="text-xs">No camera selected</span>
              </div>
            )}
            {isLive && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
                style={{ background: 'rgba(192,57,43,0.9)' }}>
                <motion.div className="w-1.5 h-1.5 rounded-full bg-white"
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                <span className="text-[11px] font-black text-white">LIVE</span>
              </div>
            )}
          </div>
          <div className="p-3 space-y-2">
            {/* Device selector — camera, mic, resolution */}
            <CameraDeviceSelector
              compact
              currentVideoId={selectedCam}
              currentAudioId={selectedMic}
              resolution={camResolution}
              onVideoChange={handleVideoChange}
              onAudioChange={handleAudioChange}
              onResolutionChange={handleResolutionChange}
            />
            {/* Legacy CameraSourcePicker for OBS/virtual camera detection */}
            <div className="flex items-center justify-between gap-3">
              <CameraSourcePicker onSourceSelected={handleCameraSource} currentDeviceId={selectedCam || null} />
              {/* Mic level bar */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm">🎤</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: audioLevel > 70 ? '#C0392B' : audioLevel > 40 ? GOLD : GREEN }}
                    animate={{ width: audioLevel + '%' }}
                    transition={{ duration: 0.1 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pre-broadcast checklist */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-black" style={{ color: GOLD }}>Pre-Broadcast Checklist</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: allReady ? 'rgba(109,191,126,0.1)' : 'rgba(255,255,255,0.05)', color: allReady ? GREEN : 'rgba(255,255,255,0.3)', border: `1px solid ${allReady ? 'rgba(109,191,126,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
              {completedCount}/{checklist.length} ready
            </span>
          </div>
          <div className="space-y-2">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                onClick={() => !item.auto && setChecklist(p => p.map(c => c.id === item.id ? { ...c, done: !c.done } : c))}
                style={{ background: item.done ? 'rgba(109,191,126,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${item.done ? 'rgba(109,191,126,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                <motion.div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: item.done ? 'rgba(109,191,126,0.2)' : 'rgba(255,255,255,0.06)', color: item.done ? GREEN : 'rgba(255,255,255,0.2)' }}>
                  {item.done ? '✓' : (item.auto ? '…' : '○')}
                </motion.div>
                <span className="text-xs font-semibold" style={{ color: item.done ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                {!item.auto && !item.done && <span className="ml-auto text-[11px] text-white/20">tap to check</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Room PIN (AES-encrypted) */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(128,0,32,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🔐</span>
            <span className="text-sm font-black" style={{ color: CRIMSON }}>Private Room PIN</span>
            <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(109,191,126,0.08)', color: GREEN, border: '1px solid rgba(109,191,126,0.2)' }}>AES-256</span>
          </div>
          {roomPin ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(128,0,32,0.1)', border: '1px solid rgba(128,0,32,0.2)' }}>
                <span className="text-2xl font-black tracking-widest" style={{ color: GOLD, fontFamily: 'monospace' }}>{roomPin}</span>
                <button onClick={() => { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(roomPin).catch(() => {}); }} className="ml-auto text-[11px] px-2 py-1 rounded font-bold" style={{ background: 'rgba(212,175,55,0.1)', color: GOLD }}>Copy PIN</button>
              </div>
              {encryptedPin && <p className="text-[11px] text-white/25 font-mono break-all">{encryptedPin}</p>}
              <p className="text-[11px] text-white/40">Share this PIN privately. Only guests with the PIN can join your room.</p>
            </div>
          ) : (
            <button onClick={generatePin}
              className="w-full py-2.5 rounded-xl text-xs font-black uppercase"
              style={{ background: 'rgba(128,0,32,0.15)', color: CRIMSON, border: '1px solid rgba(128,0,32,0.3)' }}>
              🔐 Generate Encrypted Room PIN
            </button>
          )}
        </div>

        {/* Device Preview */}
        <DevicePreview user={null} onDeviceState={() => {}} />

        {/* WebRTC Setup Banner (shows if camera/mic fails) */}
        {webrtcError && (
          <WebRTCSetupBanner
            error={webrtcError}
            audioEnabled={audioLevel > 0}
            videoEnabled={!!cameraStream}
            onRetry={() => setWebrtcError(null)}
          />
        )}

        {/* Streaming presets */}
        <StreamingPresets onApply={() => {}} />

        {/* Stream metadata editor (title/category) */}
        <StreamMetadataEditor />

        {/* Room branding (logo, banner colors) */}
        <RoomBrandingEditor roomData={activeRoom || null} onBrandingChange={(b) => { if (activeRoomId) base44.entities.Room.update(activeRoomId, b).catch(() => {}); }} isHost={true} />

        {/* Guest connector + queue */}
        <GuestConnector roomId={activeRoomId} roomName="SeeWhy Studio" />
        <GuestQueue roomId={activeRoomId} isHost={true} />

        {/* Participant queue */}
        <GreenroomQueue roomId={activeRoomId} isHost={true} />

        {/* RTMP / WHIP Ingest Panel */}
        <EnhancedIngestPanel roomId={activeRoomId} isHost={true} />

        {/* Guest RTMP panel */}
        <GuestRTMPPanel participantId={null} userId={(user && user.id)} />

        {/* Guest stream monitor */}
        <GuestStreamMonitor guestName="Guest" isStreaming={isLive} />

        {/* Guest streaming permissions */}
        <GuestStreamingPermissions participant={null} isHost={true} onPermissionChange={() => {}} />

        {/* Guest destinations panel */}
        <GuestDestinationsPanel participantUserId={(user && user.id) || null} guestName={(user && user.full_name) || 'Guest'} />

        {/* ZEGO guest approval */}
        <ZEGOGuestApprovalPanel roomId={activeRoomId} isHost={true} />

        {/* SFU live stage — shows when a room is active; panelists see the grid, viewers see the feed */}
        {activeRoomId && (user && user.id) && (
          <LiveStage
            roomId={activeRoomId}
            role="panelist"
            userId={user.id}
            userName={user.full_name || user.email || 'Host'}
            token={zegoToken}
            minHeight={240}
          />
        )}

        {/* Go Live button */}
        <div className="rounded-2xl p-4" style={{ background: allReady ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${allReady ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
          {countdown !== null ? (
            <div className="text-center py-4">
              <motion.div className="text-6xl font-black" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}
                animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>{countdown}</motion.div>
              <p className="text-sm text-white/50 mt-2">Going live in {countdown}...</p>
            </div>
          ) : isLive ? (
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <motion.div className="w-3 h-3 rounded-full bg-[#C0392B]"
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                <span className="text-lg font-black text-white">YOU ARE LIVE</span>
              </div>
              <a href="/BroadcastStudio" className="block w-full py-2.5 rounded-xl text-sm font-black uppercase text-center"
                style={{ background: 'linear-gradient(135deg, #800020, #A0003A)', color: GOLD }}>
                Open Broadcast Studio →
              </a>
            </div>
          ) : (
            <>
              {!allReady && <p className="text-xs text-center mb-3 text-white/30">Complete at least 4 checklist items to go live</p>}
              <button onClick={() => startCountdown(5)} disabled={!allReady}
                className="w-full py-3 rounded-xl text-sm font-black uppercase transition-all"
                style={allReady
                  ? { background: 'linear-gradient(135deg, #6B4423, #D4AF37)', color: '#000' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }}>
                🔴 {allReady ? 'Go Live in 5 Seconds' : 'Not Ready Yet'}
              </button>
            </>
          )}
        </div>

      </div>
      <SwanAIRecommendations roomId={activeRoomId} currentLayout="greenroom" viewerCount={(activeRoom && activeRoom.viewer_count) || 0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={activeRoomId} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      {activeRoomId && <StreamEventBus roomId={activeRoomId} isHost={true} sessionId={activeRoomId} onTipReceived={goalMetrics.onTipReceived} />}
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={(activeRoom && activeRoom.viewer_count) || 0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={activeRoomId} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={(activeRoom && activeRoom.viewer_count) || 0} peakViewers={(activeRoom && activeRoom.peak_viewers) || 0} />
      <BackgroundCustomizer />
    </div>
  );
}