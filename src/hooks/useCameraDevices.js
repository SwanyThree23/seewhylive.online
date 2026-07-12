import { useState, useEffect } from 'react';

/**
 * Enumerates available media input devices and listens for hot-plug changes.
 * Provides camera enumeration with front/back detection for mobile.
 */
export function useCameraDevices() {
  const [cameras, setCameras]     = useState([]);
  const [mics, setMics]           = useState([]);
  const [speakers, setSpeakers]   = useState([]);
  const [permitted, setPermitted] = useState(false);

  async function enumerate() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vids = devices.filter(d => d.kind === 'videoinput');
      const auds = devices.filter(d => d.kind === 'audioinput');
      const outs = devices.filter(d => d.kind === 'audiooutput');

      // Label cameras with front/back detection for mobile
      const labelledCams = vids.map((d, i) => {
        const label = d.label || `Camera ${i + 1}`;
        const lc = label.toLowerCase();
        const facing = lc.includes('front') || lc.includes('user')
          ? 'front'
          : lc.includes('back') || lc.includes('environment')
            ? 'back'
            : null;
        return { deviceId: d.deviceId, label, facing, groupId: d.groupId };
      });

      setCameras(labelledCams);
      setMics(auds.map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Mic ${i + 1}`, groupId: d.groupId })));
      setSpeakers(outs.map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Speaker ${i + 1}`, groupId: d.groupId })));
      setPermitted(vids.length > 0 && vids[0].label !== '');
    } catch {}
  }

  useEffect(() => {
    enumerate();
    const handler = () => enumerate();
    navigator.mediaDevices?.addEventListener('devicechange', handler);
    return () => navigator.mediaDevices?.removeEventListener('devicechange', handler);
  }, []);

  function getFrontCamera() { return cameras.find(c => c.facing === 'front') || cameras[0]; }
  function getBackCamera()  { return cameras.find(c => c.facing === 'back')  || cameras[cameras.length - 1]; }

  return { cameras, mics, speakers, permitted, getFrontCamera, getBackCamera, refresh: enumerate };
}

/** Resolution presets — constraints for getUserMedia */
export const RESOLUTION_PRESETS = {
  '360p':  { width: { ideal: 640 },  height: { ideal: 360 },  frameRate: { ideal: 24 } },
  '480p':  { width: { ideal: 854 },  height: { ideal: 480 },  frameRate: { ideal: 30 } },
  '720p':  { width: { ideal: 1280 }, height: { ideal: 720 },  frameRate: { ideal: 30 } },
  '1080p': { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
};
