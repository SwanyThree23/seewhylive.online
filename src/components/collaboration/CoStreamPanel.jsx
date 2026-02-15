import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Monitor, Mic, VideoOff, MonitorOff, MicOff } from 'lucide-react';
import { toast } from 'sonner';

export default function CoStreamPanel({ roomId }) {
  const [localStream, setLocalStream] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamType, setStreamType] = useState('camera');
  const videoRef = useRef(null);

  const { data: coStreamers = [] } = useQuery({
    queryKey: ['coStreamers', roomId],
    queryFn: () => base44.entities.CoStreamSession.filter({ room_id: roomId, status: 'active' }),
  });

  const startStreamMutation = useMutation({
    mutationFn: async ({ type }) => {
      const user = await base44.auth.me();
      return await base44.entities.CoStreamSession.create({
        room_id: roomId,
        user_id: user.id,
        stream_type: type,
        status: 'active',
        started_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Co-streaming started');
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
      setStreamType('camera');
      startStreamMutation.mutate({ type: 'camera' });
    } catch (error) {
      toast.error('Failed to access camera');
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true 
      });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
      setStreamType('screen');
      startStreamMutation.mutate({ type: 'screen' });
    } catch (error) {
      toast.error('Failed to share screen');
    }
  };

  const stopStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      setIsStreaming(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Co-Streaming</h3>
        <Badge>{coStreamers.length} active</Badge>
      </div>

      {!isStreaming ? (
        <div className="flex gap-2">
          <Button onClick={startCamera} className="flex-1">
            <Video className="w-4 h-4 mr-2" />
            Camera
          </Button>
          <Button onClick={startScreenShare} variant="outline" className="flex-1">
            <Monitor className="w-4 h-4 mr-2" />
            Screen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Card>
            <CardContent className="p-3">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full rounded-lg bg-black"
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="destructive" onClick={stopStream}>
                  {streamType === 'camera' ? <VideoOff className="w-4 h-4" /> : <MonitorOff className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {coStreamers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Other Co-Streamers:</p>
          {coStreamers.map(streamer => (
            <Card key={streamer.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {streamer.stream_type === 'camera' ? <Video className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                    <span className="text-sm">User streaming {streamer.stream_type}</span>
                  </div>
                  <Badge variant="outline">{streamer.quality}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}