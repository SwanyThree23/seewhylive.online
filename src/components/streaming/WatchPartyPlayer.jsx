import React, { useRef, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
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

    await base44.entities.Message.create({
      room_id: roomId,
      user_id: 'system',
      user_name: 'Watch Party',
      content: JSON.stringify({
        action: 'watch-party:sync',
        state,
        timestamp,
      }),
      type: 'system',
    });
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

  const handleVolumeChange = (value) => {
    const vol = value[0];
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol / 100;
    }
  };

  const handleSeek = (value) => {
    if (!videoRef.current || !isHost) return;
    const time = value[0];
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
    <Card className="relative overflow-hidden bg-black border-2 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)]">
      <div className="relative group">
        {/* Live Badge */}
        <Badge className="absolute top-4 left-4 z-10 bg-[#800020] text-white border border-[#D4AF37] animate-pulse shadow-[0_0_15px_rgba(128,0,32,0.8)]">
          <Radio className="w-3 h-3 mr-1" />
          WATCH PARTY LIVE
        </Badge>

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
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            disabled={!isHost}
            className="mb-4"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePlayPause}
                className="text-[#D4AF37] hover:bg-[#800020]/20"
                disabled={!isHost && !isPlaying}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (videoRef.current) videoRef.current.muted = !isMuted;
                  }}
                  className="text-[#D4AF37] hover:bg-[#800020]/20"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>

              <span className="text-[#D4AF37] text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isHost && (
                <Badge variant="outline" className="text-[#D4AF37] border-[#D4AF37]">
                  HOST CONTROLS
                </Badge>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleFullscreen}
                className="text-[#D4AF37] hover:bg-[#800020]/20"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}