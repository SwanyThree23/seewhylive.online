import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GOLD = '#D4AF37';
const BG2 = 'rgba(13,6,24,0.9)';

export default function CameraSourcePicker({ onSourceSelected, currentDeviceId }) {
  const [devices, setDevices] = useState([]);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedId, setSelectedId] = useState(currentDeviceId || '');
  const [quality, setQuality] = useState('720p');
  const videoRef = useRef(null);

  const QUALITY_PRESETS = {
    '480p':  { width: 854,  height: 480,  frameRate: 30, label: '480p SD' },
    '720p':  { width: 1280, height: 720,  frameRate: 30, label: '720p HD' },
    '1080p': { width: 1920, height: 1080, frameRate: 30, label: '1080p FHD' },
    '1080p60': { width: 1920, height: 1080, frameRate: 60, label: '1080p 60fps' },
  };

  useEffect(() => {
    async function loadDevices() {
      try {
        // Request permission first so labels are visible
        await navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(s => s.getTracks().forEach(t => t.stop()));
        const all = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = all
          .filter(d => d.kind === 'videoinput')
          .map(d => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 6)}`,
            isOBS: d.label.toLowerCase().includes('obs'),
            isVirtual: d.label.toLowerCase().includes('virtual'),
            isElgato: d.label.toLowerCase().includes('elgato'),
            isCam: d.label.toLowerCase().includes('cam'),
          }));
        setDevices(videoDevices);
        // Auto-select OBS if available and nothing selected
        if (!selectedId) {
          const obs = videoDevices.find(d => d.isOBS);
          if (obs) setSelectedId(obs.deviceId);
          else if (videoDevices[0]) setSelectedId(videoDevices[0].deviceId);
        }
      } catch (e) {
        console.error('Camera enum error', e);
      }
    }
    loadDevices();
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
  }, []);

  async function previewDevice(deviceId) {
    if (preview) { preview.getTracks().forEach(t => t.stop()); }
    try {
      const preset = QUALITY_PRESETS[quality];
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: preset.width }, height: { ideal: preset.height }, frameRate: { ideal: preset.frameRate } },
        audio: false,
      });
      setPreview(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch(e) {
      console.error('Preview error', e);
    }
  }

  async function selectSource(deviceId) {
    setSelectedId(deviceId);
    await previewDevice(deviceId);
  }

  async function confirmSelection() {
    if (!selectedId) return;
    const preset = QUALITY_PRESETS[quality];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedId }, width: { ideal: preset.width }, height: { ideal: preset.height }, frameRate: { ideal: preset.frameRate } },
        audio: false,
      });
      if (preview) preview.getTracks().forEach(t => t.stop());
      onSourceSelected(stream, { deviceId: selectedId, quality, label: devices.find(d => d.deviceId === selectedId)?.label });
      setOpen(false);
    } catch(e) {
      console.error('Source select error', e);
    }
  }

  useEffect(() => {
    return () => { if (preview) preview.getTracks().forEach(t => t.stop()); };
  }, [preview]);

  const selectedDevice = devices.find(d => d.deviceId === selectedId);

  return (
    <>
      <button onClick={() => { setOpen(true); if (selectedId) previewDevice(selectedId); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
        style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
        📹 {selectedDevice?.isOBS ? '🟢 OBS Camera' : selectedDevice?.label?.split('(')[0]?.trim() || 'Select Camera'}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-[200]" style={{ background: 'rgba(0,0,0,0.7)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); if (preview) preview.getTracks().forEach(t => t.stop()); }} />
            <motion.div className="fixed inset-x-4 top-[10%] z-[201] rounded-2xl overflow-hidden"
              style={{ background: '#080B18', border: '1px solid rgba(212,175,55,0.2)', maxWidth: 480, margin: '0 auto' }}
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-black" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>📹 Camera Source</span>
                <button onClick={() => setOpen(false)} className="text-white/40 text-lg leading-none">×</button>
              </div>

              <div className="p-4 space-y-4">
                {/* Preview */}
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {!preview && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">
                      Select a camera to preview
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {selectedDevice?.isOBS && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded font-black" style={{ background: 'rgba(109,191,126,0.2)', color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>OBS VIRTUAL</span>
                    )}
                    <span className="text-[11px] px-1.5 py-0.5 rounded font-black" style={{ background: 'rgba(212,175,55,0.2)', color: GOLD, border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>{quality}</span>
                  </div>
                </div>

                {/* Device list */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {devices.length === 0 ? (
                    <p className="text-[10px] text-center py-2 text-white/30">No cameras detected</p>
                  ) : devices.map(d => (
                    <button key={d.deviceId} onClick={() => selectSource(d.deviceId)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left"
                      style={selectedId === d.deviceId
                        ? { background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-lg">{d.isOBS ? '🟢' : d.isElgato ? '🎮' : '📹'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{d.label}</p>
                        <p className="text-[11px]" style={{ color: d.isOBS ? '#6DBF7E' : 'rgba(255,255,255,0.3)' }}>
                          {d.isOBS ? 'OBS Virtual Camera detected' : d.isVirtual ? 'Virtual camera' : 'Physical camera'}
                        </p>
                      </div>
                      {selectedId === d.deviceId && <span style={{ color: GOLD }}>✓</span>}
                    </button>
                  ))}
                </div>

                {/* Quality selector */}
                <div>
                  <p className="text-[11px] uppercase tracking-widest mb-2 font-semibold" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Stream Quality</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
                      <button key={key} onClick={() => setQuality(key)}
                        className="py-1.5 rounded-lg text-[11px] font-black transition-all"
                        style={quality === key
                          ? { background: 'rgba(212,175,55,0.2)', color: GOLD, border: '1px solid rgba(212,175,55,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }
                          : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                {/* OBS tip */}
                {!devices.some(d => d.isOBS) && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(109,191,126,0.05)', border: '1px solid rgba(109,191,126,0.12)' }}>
                    <p className="text-[11px]" style={{ color: 'rgba(109,191,126,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      💡 Don't see OBS? Open OBS → Tools → Virtual Camera → Start Virtual Camera, then refresh this list.
                    </p>
                  </div>
                )}

                {/* Confirm */}
                <button onClick={confirmSelection}
                  className="w-full py-2.5 rounded-xl text-sm font-black uppercase"
                  style={{ background: 'linear-gradient(135deg, #6B4423, #D4AF37)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Use This Camera
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
