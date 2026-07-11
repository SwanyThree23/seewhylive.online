import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Radio, Square, Download, AlertCircle, Loader2, Monitor, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCanvasCompositor } from '@/hooks/useCanvasCompositor';
import { hapticMedium } from '@/utils/haptics';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const STATUS = {
  idle: { label: 'Idle', color: 'rgba(255,255,255,0.3)' },
  connecting: { label: 'Connecting…', color: '#F59E0B' },
  live: { label: 'LIVE', color: '#C0392B' },
  recording: { label: 'Recording', color: '#6DBF7E' },
  error: { label: 'Error', color: '#C0392B' },
};

/**
 * CompositorOverlay — Go Live / Record control panel.
 *
 * Props:
 *   layout: 'panel' | 'battle' | 'watchparty'
 *   slots: Array<{ stream: MediaStream|null, label: string }>
 *   overlayConfig: { title, subtitle, showLive, battleData, chatLines }
 *   userId: string  (current user ID — used to load/save WHIP destinations)
 *   onScreenCapture: () => Promise<MediaStream>  (for watchparty)
 *   isHost: boolean
 */
export default function CompositorOverlay({
  layout = 'panel',
  slots = [],
  overlayConfig = {},
  userId,
  onScreenCapture,
  isHost = false,
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [customWhip, setCustomWhip] = useState('');
  const [useRecord, setUseRecord] = useState(false);
  const qc = useQueryClient();

  // Load saved WHIP destinations from RTMPDestination entity
  const { data: savedWhipDests = [] } = useQuery({
    queryKey: ['whip-destinations', userId],
    queryFn: () => base44.entities.RTMPDestination.filter({ creator_id: userId, platform: 'whip' }),
    enabled: !!userId && open,
  });

  // Pre-fill WHIP URL from first saved destination when panel opens
  useEffect(() => {
    if (open && savedWhipDests.length > 0 && !customWhip) {
      setCustomWhip(savedWhipDests[0].server_url || '');
    }
  }, [open, savedWhipDests]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveWhipMut = useMutation({
    mutationFn: async (url) => {
      if (savedWhipDests.length > 0) {
        await base44.entities.RTMPDestination.update(savedWhipDests[0].id, { server_url: url });
      } else {
        await base44.entities.RTMPDestination.create({
          creator_id: userId,
          platform: 'whip',
          label: 'WHIP / Live',
          server_url: url,
          stream_key_encrypted: '',
          is_enabled: true,
        });
      }
      qc.invalidateQueries({ queryKey: ['whip-destinations', userId] });
    },
    onSuccess: () => toast.success('WHIP URL saved!'),
    onError: () => toast.error('Could not save WHIP URL'),
  });

  const pcRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const previewRef = useRef(null);

  const { canvasRef, isRunning, startCompositor, stopCompositor } = useCanvasCompositor({
    slots,
    overlayConfig: { ...overlayConfig, layout, showLive: status === 'live' || status === 'recording' },
  });

  // Mirror canvas to the small preview video
  useEffect(() => {
    if (!open || !previewRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    previewRef.current.srcObject = canvas.captureStream(15);
    previewRef.current.play().catch(() => {});
  }, [open, canvasRef]);

  // Start/stop RAF when panel opens/closes
  useEffect(() => {
    if (open && !isRunning) {
      startCompositor();
    } else if (!open && isRunning) {
      stopCompositor();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const goLive = useCallback(async () => {
    if (!customWhip.trim()) {
      toast.error('Enter a WHIP URL first');
      return;
    }
    setStatus('connecting');
    try {
      const stream = startCompositor();
      if (!stream) throw new Error('Compositor did not return a stream');

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering
      await new Promise((resolve) => {
        if (pc.iceGatheringState === 'complete') return resolve();
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') resolve();
        };
        setTimeout(resolve, 4000); // 4s max
      });

      const res = await fetch(customWhip.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: pc.localDescription.sdp,
      });

      if (!res.ok) throw new Error(`WHIP rejected: ${res.status}`);
      const answerSdp = await res.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      setStatus('live');
      toast.success('Stream started!');
    } catch (err) {
      setStatus('error');
      toast.error(`Failed to go live: ${err.message}`);
    }
  }, [customWhip, startCompositor]);

  const startRecord = useCallback(() => {
    const stream = startCompositor();
    if (!stream) return;

    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : 'video/webm';

    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3_000_000 });
    chunksRef.current = [];
    rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `broadcast-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };
    rec.start(1000);
    recorderRef.current = rec;
    setStatus('recording');
    toast.success('Recording started!');
  }, [startCompositor]);

  const stopStream = useCallback(() => {
    // WHIP teardown
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    // MediaRecorder teardown
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    stopCompositor();
    setStatus('idle');
    toast.info('Broadcast stopped');
  }, [stopCompositor]);

  const handleScreenCapture = useCallback(async () => {
    if (!onScreenCapture) return;
    try {
      await onScreenCapture();
      toast.success('Screen selected!');
    } catch {
      toast.error('Screen capture cancelled');
    }
  }, [onScreenCapture]);

  if (!isHost) return null;

  const s = STATUS[status];

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all"
        style={{
          background: open ? 'rgba(192,57,43,0.2)' : 'rgba(192,57,43,0.1)',
          border: `1px solid ${status === 'live' ? '#C0392B' : status === 'recording' ? '#6DBF7E' : 'rgba(192,57,43,0.3)'}`,
          color: status === 'live' ? '#C0392B' : status === 'recording' ? '#6DBF7E' : '#C0392B',
          ...T,
        }}
      >
        {status === 'live' || status === 'recording'
          ? <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ background: s.color }} />
          : <Radio className="w-3.5 h-3.5" />}
        {status === 'idle' ? '🔴 Go Live' : s.label}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 rounded-2xl p-4 shadow-2xl space-y-3"
          style={{
            width: 360,
            background: '#0D0618',
            border: '1px solid rgba(212,175,55,0.2)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase" style={{ color: GOLD, ...T }}>Broadcast Studio</span>
            <span className="text-[11px] px-2 py-0.5 rounded font-bold uppercase" style={{ background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}44` }}>
              {s.label}
            </span>
          </div>

          {/* Hidden compositor canvas */}
          <canvas ref={canvasRef} width={1920} height={1080} style={{ display: 'none' }} />

          {/* Preview */}
          <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', background: '#000', border: '1px solid rgba(255,255,255,0.08)' }}>
            <video ref={previewRef} muted playsInline className="w-full h-full object-contain" />
          </div>

          {layout === 'watchparty' && (
            <button
              onClick={handleScreenCapture}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', ...T }}
            >
              <Monitor className="w-3.5 h-3.5" /> Select Screen / Tab to Capture
            </button>
          )}

          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {['WHIP / Live', 'Record'].map((label, i) => (
              <button
                key={label}
                onClick={() => setUseRecord(i === 1)}
                className="flex-1 py-1.5 text-[11px] font-black uppercase transition-all"
                style={{
                  background: useRecord === (i === 1) ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color: useRecord === (i === 1) ? GOLD : 'rgba(255,255,255,0.3)',
                  ...T,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {!useRecord && (
            <div>
              <p className="text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                WHIP Endpoint URL (Cloudflare Stream, Mux, etc.)
              </p>
              <div className="flex gap-2">
                <input
                  value={customWhip}
                  onChange={e => setCustomWhip(e.target.value)}
                  placeholder="https://live.cloudflare.com/…"
                  className="flex-1 h-8 px-2 rounded-lg text-[10px] text-white placeholder:text-white/25"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
                />
                {userId && (
                  <button
                    onClick={() => saveWhipMut.mutate(customWhip)}
                    disabled={!customWhip.trim() || saveWhipMut.isPending}
                    className="px-2 h-8 rounded-lg shrink-0"
                    style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD }}
                    title="Save WHIP URL"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Get a WHIP URL from Cloudflare Stream, Mux, or your own media server.
              </p>
            </div>
          )}

          {/* Action buttons */}
          {status === 'idle' && (
            <button
              onClick={() => { hapticMedium(); useRecord ? startRecord() : goLive(); }}
              className="w-full py-2.5 rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #800020, #A0003A)', border: '1px solid rgba(212,175,55,0.4)', color: GOLD, ...T }}
            >
              {useRecord ? <><Download className="w-4 h-4" /> Start Recording</> : <><Radio className="w-4 h-4" /> Go Live</>}
            </button>
          )}
          {status === 'connecting' && (
            <button disabled className="w-full py-2.5 rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', ...T }}>
              <Loader2 className="w-4 h-4 animate-spin" /> Connecting…
            </button>
          )}
          {(status === 'live' || status === 'recording' || status === 'error') && (
            <button
              onClick={stopStream}
              className="w-full py-2.5 rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-2 transition-all"
              style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B', ...T }}
            >
              <Square className="w-4 h-4" /> {status === 'recording' ? 'Stop & Save' : 'End Stream'}
            </button>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)' }}>
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-400" />
              <p className="text-[11px] text-red-400">Stream failed. Check your WHIP URL and try again, or switch to Record mode.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}