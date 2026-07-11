import React, { useRef, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, Pause, Volume2, VolumeX, Maximize, Radio } from 'lucide-react';

export default function WatchPartyPlayer({ roomId, isHost, videoUrl }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const driftThreshold = 1.5; // Seconds allowable drift

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to watch party sync events
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.room_id === roomId && event.data.type === 'system') {
        try {
          const syncData = JSON.parse(event.data.content);
          
          if (syncData.action === 'watch-party:sync' && !isHost && videoRef.current) {
            const currentLoc = videoRef.current.currentTime;
            const drift = Math.abs(currentLoc - syncData.timestamp);

            if (syncData.state === 'play') {
              if (drift > driftThreshold) {
                videoRef.current.currentTime = syncData.timestamp;
              }
              videoRef.current.play();
              setIsPlaying(true);
            } else if (syncData.state === 'pause') {
              videoRef.current.currentTime = syncData.timestamp;
              videoRef.current.pause();
              setIsPlaying(false);
            } else if (syncData.state === 'seek') {
              videoRef.current.currentTime = syncData.timestamp;
            }
          }
        } catch (e) {
          // Not a sync message
        }
      }
    });

    return unsubscribe;
  }, [roomId, isHost]);

  const broadcastSync = async (state, timestamp) => {
    if (!isHost) return;
    base44.entities.Message.create({
      room_id: roomId,
      user_id: 'system',
      user_name: 'Watch Party',
      content: JSON.stringify({
        action: 'watch-party:sync',
        state,
        timestamp,
      }),
      type: 'system',
    }).catch(() => {});
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (isHost) broadcastSync('pause', videoRef.current.currentTime);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      if (isHost) broadcastSync('play', videoRef.current.currentTime);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseInt(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol / 100;
    }
  };

  const handleSeek = (e) => {
    if (!videoRef.current || !isHost) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    broadcastSync('seek', time);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Periodic sync heartbeat (every 5 seconds)
      if (isHost && Math.floor(videoRef.current.currentTime) % 5 === 0) {
        broadcastSync('play', videoRef.current.currentTime);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#000', border: '2px solid #D4AF37', boxShadow: '0 0 30px rgba(212,175,55,0.2)', borderRadius: 12 }}>
      <div className="relative group">
        {/* Live Badge */}
        <span style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 900, background: '#800020', color: '#fff', border: '1px solid #D4AF37', borderRadius: 99, padding: '3px 8px', animation: 'pulse 2s infinite' }}>
          <Radio className="w-3 h-3" />
          WATCH PARTY LIVE
        </span>

        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={handlePlayPause}
        />

        {/* Control Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress Bar */}
          <input
            type="range"
            value={currentTime}
            max={duration || 0}
            step={0.1}
            onChange={handleSeek}
            disabled={!isHost}
            style={{ width: '100%', marginBottom: 16, accentColor: '#D4AF37', cursor: isHost ? 'pointer' : 'default' }}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                disabled={!isHost && !isPlaying}
                style={{ background: 'transparent', border: 'none', color: '#D4AF37', cursor: (!isHost && !isPlaying) ? 'default' : 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (videoRef.current) videoRef.current.muted = !isMuted;
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#D4AF37', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  value={volume}
                  max={100}
                  step={1}
                  onChange={handleVolumeChange}
                  style={{ width: 96, accentColor: '#D4AF37', cursor: 'pointer' }}
                />
              </div>

              <span style={{ color: '#D4AF37', fontSize: 14, fontFamily: 'monospace' }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isHost && (
                <span style={{ fontSize: 10, fontWeight: 900, color: '#D4AF37', border: '1px solid #D4AF37', borderRadius: 99, padding: '2px 8px' }}>
                  HOST CONTROLS
                </span>
              )}
              <button
                onClick={toggleFullscreen}
                style={{ background: 'transparent', border: 'none', color: '#D4AF37', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}