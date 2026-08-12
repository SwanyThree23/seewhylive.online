import React, { useEffect, useRef, useState } from 'react';

export default function WatchGuestVideo(props) {
  var guest = props.guest;
  var rtcManager = props.rtcManager;
  var size = props.size || 30;
  var videoRef = useRef(null);
  var streamRef = useRef(null);
  var [online, setOnline] = useState(false);

  useEffect(function() {
    if (!rtcManager || !guest || !guest.producerId) return;
    var cancelled = false;

    async function subscribeRemote() {
      try {
        var videoStream = await rtcManager.subscribeToProducer(guest.producerId);
        if (cancelled) return;
        var combined = new MediaStream(videoStream.getTracks());

        if (guest.audioProducerId) {
          try {
            var audioStream = await rtcManager.subscribeToProducer(guest.audioProducerId);
            audioStream.getAudioTracks().forEach(function(t) { combined.addTrack(t); });
          } catch (ae) {
            console.warn('[WatchGuestVideo] audio subscribe failed:', ae.message);
          }
        }

        if (cancelled) return;
        streamRef.current = combined;
        if (videoRef.current) {
          videoRef.current.srcObject = combined;
          videoRef.current.play().catch(function() {});
        }
        setOnline(true);
      } catch (e) {
        if (!cancelled) console.error('[WatchGuestVideo] subscribe error:', e);
      }
    }

    subscribeRemote();
    return function() { cancelled = true; };
  }, [rtcManager, guest && guest.producerId, guest && guest.audioProducerId]);

  if (!guest || !guest.producerId) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={false}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        background: '#000',
        border: '2px solid #333'
      }}
    />
  );
}
