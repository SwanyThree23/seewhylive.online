import { useState, useEffect, useRef } from 'react';

/**
 * Monitors WebRTC connection quality using RTCPeerConnection.getStats().
 * Falls back to navigator.connection / navigator.onLine when no PC is available.
 *
 * Returns:
 *   quality   — 'excellent'|'good'|'fair'|'poor'|'offline'
 *   bars      — 0-4 signal bar count
 *   rtt       — round-trip-time in ms (null when unknown)
 *   packetLoss— 0-100% (null when unknown)
 *   bandwidth — estimated kbps download (null when unknown)
 *   label     — human-readable status string
 */
export function useConnectionQuality(peerConnection = null, pollMs = 3000) {
  const [quality, setQuality] = useState('good');
  const [bars, setBars] = useState(3);
  const [rtt, setRtt] = useState(null);
  const [packetLoss, setPacketLoss] = useState(null);
  const [bandwidth, setBandwidth] = useState(null);
  const prevStats = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    async function poll() {
      if (!navigator.onLine) {
        setQuality('offline'); setBars(0); return;
      }

      // If we have a real RTCPeerConnection, use getStats()
      if (peerConnection && peerConnection.connectionState !== 'closed') {
        try {
          const stats = await peerConnection.getStats();
          let totalRtt = 0, rttCount = 0;
          let totalLost = 0, totalSent = 0;
          let bytesDelta = 0, timeDelta = 0;

          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (report.currentRoundTripTime != null) {
                totalRtt += report.currentRoundTripTime * 1000; // → ms
                rttCount++;
              }
              if (report.bytesReceived != null && prevStats.current) {
                const prev = prevStats.current.get(report.id);
                if (prev) {
                  bytesDelta += (report.bytesReceived - (prev.bytesReceived || 0));
                  timeDelta += (report.timestamp - prev.timestamp);
                }
              }
            }
            if (report.type === 'inbound-rtp') {
              totalLost += report.packetsLost || 0;
              totalSent += (report.packetsReceived || 0) + (report.packetsLost || 0);
            }
          });

          prevStats.current = stats;

          const avgRtt = rttCount > 0 ? Math.round(totalRtt / rttCount) : null;
          const loss = totalSent > 0 ? Math.round((totalLost / totalSent) * 100) : null;
          const bw = timeDelta > 0 ? Math.round((bytesDelta * 8) / (timeDelta / 1000) / 1000) : null;

          setRtt(avgRtt);
          setPacketLoss(loss);
          setBandwidth(bw);

          // Score: rtt + packet loss weighted quality
          const rttScore  = avgRtt == null  ? 1 : avgRtt < 80 ? 2 : avgRtt < 200 ? 1 : avgRtt < 400 ? 0 : -1;
          const lossScore = loss == null    ? 1 : loss < 2    ? 2 : loss < 5     ? 1 : loss < 10    ? 0 : -1;
          const total = rttScore + lossScore;
          const q = total >= 3 ? 'excellent' : total >= 2 ? 'good' : total >= 1 ? 'fair' : 'poor';
          const b = total >= 3 ? 4 : total >= 2 ? 3 : total >= 1 ? 2 : 1;
          setQuality(q); setBars(b);
          return;
        } catch {}
      }

      // Fallback: navigator.connection API
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        const dl = conn.downlink;       // Mbps
        const rttEst = conn.rtt;        // ms
        setRtt(rttEst || null);
        setBandwidth(dl ? Math.round(dl * 1000) : null);
        setPacketLoss(null);
        const q = dl > 5 ? 'excellent' : dl > 2 ? 'good' : dl > 0.5 ? 'fair' : 'poor';
        const b = dl > 5 ? 4 : dl > 2 ? 3 : dl > 0.5 ? 2 : 1;
        setQuality(q); setBars(b);
      }
    }

    poll();
    timerRef.current = setInterval(poll, pollMs);
    return () => clearInterval(timerRef.current);
  }, [peerConnection, pollMs]);

  const LABELS = { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor', offline: 'Offline' };
  return { quality, bars, rtt, packetLoss, bandwidth, label: LABELS[quality] };
}
