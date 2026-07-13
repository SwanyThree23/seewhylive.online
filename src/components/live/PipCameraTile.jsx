import React, { useRef, useEffect } from 'react';
import { VideoOff } from 'lucide-react';
import TipGoalBar from '@/components/monetization/TipGoalBar';
import TopTippers from '@/components/monetization/TopTippers';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function PipCameraTile({ localStream, videoEnabled }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && localStream) ref.current.srcObject = localStream; }, [localStream]);
  const showVideo = !!(localStream && videoEnabled);
  return (
    <div className="absolute bottom-3 right-3 rounded-xl overflow-hidden shadow-xl"
      style={{ width: 120, height: 90, border: '2px solid rgba(212,175,55,0.4)', background: '#000', zIndex: 10 }}>
      <video ref={ref} autoPlay muted playsInline className="w-full h-full object-cover"
        style={{ display: showVideo ? 'block' : 'none' }} />
      <div className="w-full h-full flex items-center justify-center"
        style={{ color: 'rgba(255,255,255,0.3)', display: showVideo ? 'none' : 'flex' }}>
        <VideoOff className="w-5 h-5" />
      </div>
      <div className="absolute bottom-1 left-1 text-[7px] px-1 rounded"
        style={{ background: 'rgba(0,0,0,0.6)', color: GOLD, ...T }}>YOU</div>
      <TipGoalBar roomId={null} goal={100} current={0} />
      <TopTippers roomId={null} />
    </div>
  );
}