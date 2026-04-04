import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#0d0618] border-2 border-[#d4af37]/30">
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
          {isHost && <Badge className="text-[9px] bg-[#d4af37] text-black px-1.5 py-0">HOST</Badge>}
          <span className="text-xs text-white font-semibold truncate max-w-[120px]">{userName}</span>
        </div>
        <div className="flex items-center gap-1">
          {audioEnabled
            ? <Mic className="w-3 h-3 text-green-400" />
            : <MicOff className="w-3 h-3 text-red-400" />}
          {videoEnabled
            ? <Video className="w-3 h-3 text-blue-400" />
            : <VideoOff className="w-3 h-3 text-red-400" />}
        </div>
      </div>

      {/* No stream indicator */}
      {!stream && (
        <div className="absolute top-2 right-2">
          <Badge className="text-[9px] bg-red-900/60 text-red-300 border-red-700">No Camera</Badge>
        </div>
      )}
    </div>
  );
}