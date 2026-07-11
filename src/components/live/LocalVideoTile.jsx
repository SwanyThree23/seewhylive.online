import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

/**
 * Renders the local user's camera feed using srcObject.
 */
export default function LocalVideoTile({ stream, audioEnabled, videoEnabled, userName, isHost }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0d0618]" style={{
      clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
      border: '3px solid #d4af37',
      boxShadow: '0 0 30px rgba(212,175,55,0.6), inset 0 0 20px rgba(212,175,55,0.3)'
    }}>
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
          {isHost && <span style={{ fontSize:11, fontWeight:900, background:'#D4AF37', color:'#000', padding:'1px 6px', borderRadius:99, textShadow:'0 0 8px rgba(212,175,55,0.5)', fontFamily:'Barlow Condensed, sans-serif' }}>HOST</span>}
          <span className="text-xs text-white font-semibold truncate max-w-[120px]" style={{ textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>{userName}</span>
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

      {/* No stream indicator */}
      {!stream && (
        <div className="absolute top-2 right-2">
          <span style={{ fontSize:11, fontWeight:900, background:'rgba(127,29,29,0.6)', color:'#fca5a5', border:'1px solid #b91c1c', padding:'1px 6px', borderRadius:99, fontFamily:'Barlow Condensed, sans-serif' }}>No Camera</span>
        </div>
      )}
    </div>
  );
}