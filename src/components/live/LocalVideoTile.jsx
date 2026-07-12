import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, PictureInPicture2 } from 'lucide-react';

const GOLD = '#D4AF37';

/**
 * Renders the local user's camera feed.
 *
 * Props:
 *   stream        MediaStream|null
 *   audioEnabled  boolean
 *   videoEnabled  boolean
 *   userName      string
 *   isHost        boolean
 *   isSpeaking    boolean  - shows gold glow ring when true
 */
export default function LocalVideoTile({
  stream,
  audioEnabled,
  videoEnabled,
  userName,
  isHost,
  isSpeaking = false,
}) {
  const videoRef = useRef(null);
  const [isPip, setIsPip] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Track PiP state to keep button label in sync
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onEnter = () => setIsPip(true);
    const onLeave = () => setIsPip(false);
    el.addEventListener('enterpictureinpicture', onEnter);
    el.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      el.removeEventListener('enterpictureinpicture', onEnter);
      el.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, []);

  const togglePip = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {}
  }, []);

  const speakingRing = isSpeaking
    ? `0 0 0 3px ${GOLD}, 0 0 18px ${GOLD}88`
    : undefined;

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#0d0618]"
      style={{
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
        border: `3px solid ${GOLD}`,
        boxShadow: speakingRing ?? `0 0 30px rgba(212,175,55,0.6), inset 0 0 20px rgba(212,175,55,0.3)`,
        transition: 'box-shadow 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#800020] to-[#d4af37] flex items-center justify-center text-3xl font-bold text-white">
            {userName?.charAt(0)?.toUpperCase()}
          </div>
        </div>
      )}

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isHost && (
            <span style={{
              fontSize: 11, fontWeight: 900, background: GOLD, color: '#000',
              padding: '1px 6px', borderRadius: 99,
              textShadow: '0 0 8px rgba(212,175,55,0.5)',
              fontFamily: 'Barlow Condensed, sans-serif',
            }}>HOST</span>
          )}
          <span className="text-xs text-white font-semibold truncate max-w-[120px]"
            style={{ textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>
            {userName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {audioEnabled
            ? <Mic className="w-3 h-3 text-[#6DBF7E]" />
            : <MicOff className="w-3 h-3 text-[#C0392B]" />}
          {videoEnabled
            ? <Video className="w-3 h-3 text-blue-400" />
            : <VideoOff className="w-3 h-3 text-[#C0392B]" />}
        </div>
      </div>

      {/* Picture-in-Picture button — shown on hover when video is active */}
      {hovered && stream && videoEnabled && document.pictureInPictureEnabled && (
        <button
          onClick={togglePip}
          title={isPip ? 'Exit Picture-in-Picture' : 'Pop out to Picture-in-Picture'}
          className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full transition-all"
          style={{
            background: isPip ? `${GOLD}30` : 'rgba(0,0,0,0.55)',
            border: `1px solid ${isPip ? GOLD : 'rgba(255,255,255,0.15)'}`,
            color: isPip ? GOLD : 'rgba(255,255,255,0.7)',
          }}
        >
          <PictureInPicture2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* No stream indicator */}
      {!stream && (
        <div className="absolute top-2 right-2">
          <span style={{
            fontSize: 11, fontWeight: 900,
            background: 'rgba(127,29,29,0.6)', color: '#fca5a5',
            border: '1px solid #b91c1c', padding: '1px 6px', borderRadius: 99,
            fontFamily: 'Barlow Condensed, sans-serif',
          }}>No Camera</span>
        </div>
      )}
    </div>
  );
}
