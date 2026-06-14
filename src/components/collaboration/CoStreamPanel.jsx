import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, VideoOff, Monitor, MonitorOff, Mic, MicOff, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CoStreamPanel({ roomId }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamType, setStreamType] = useState('camera'); // 'camera' or 'screen'
  const [mediaStream, setMediaStream] = useState(null);
  const [error, setError] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const videoRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: activeSessions = [] } = useQuery({
    queryKey: ['costream-sessions', roomId],
    queryFn: () => base44.entities.CoStreamSession.filter(
      { room_id: roomId, status: 'active' },
      '-started_at'
    ),
    enabled: !!roomId,
  });

  const startSessionMutation = useMutation({
    mutationFn: (sessionData) => base44.entities.CoStreamSession.create(sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costream-sessions'] });
      toast.success('Co-stream started!');
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async (sessionId) => {
      await base44.entities.CoStreamSession.update(sessionId, {
        status: 'ended',
        ended_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costream-sessions'] });
      stopMediaStream();
      toast.success('Co-stream ended');
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  const startCameraStream = async () => {
    setError(null);
    
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support camera access');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsStreaming(true);
      setStreamType('camera');

      // Create session record
      startSessionMutation.mutate({
        room_id: roomId,
        user_id: user.id,
        stream_type: 'camera',
        status: 'active',
        quality: 'medium',
        started_at: new Date().toISOString(),
      });

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permission denied. Please enable camera/microphone in browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError('Could not access camera. Please check your settings.');
      }
      
      toast.error('Failed to start camera');
    }
  };

  const startScreenShare = async () => {
    setError(null);

    // Check if browser supports screen capture
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setError('Your browser does not support screen sharing');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        },
        audio: true
      });

      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsStreaming(true);
      setStreamType('screen');

      // Create session record
      startSessionMutation.mutate({
        room_id: roomId,
        user_id: user.id,
        stream_type: 'screen',
        status: 'active',
        quality: 'high',
        started_at: new Date().toISOString(),
      });

      // Handle user stopping screen share via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopMediaStream();
      });

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Screen sharing permission denied.');
      } else {
        setError('Could not start screen sharing.');
      }
      
      toast.error('Failed to start screen sharing');
    }
  };

  const stopMediaStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setError(null);

    // Find and end session
    const mySession = activeSessions.find(s => s.user_id === user.id);
    if (mySession) {
      endSessionMutation.mutate(mySession.id);
    }
  };

  const toggleAudio = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const mySession = activeSessions.find(s => s.user_id === user?.id);
  const otherSessions = activeSessions.filter(s => s.user_id !== user?.id);

  return (
    <div className="space-y-4">
      {/* My Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Your Co-Stream</span>
            <Badge variant="outline">
              <Users className="w-3 h-3 mr-1" />
              {activeSessions.length} streaming
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}

          {!isStreaming ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Share your camera or screen with other participants
              </p>
              <div className="flex gap-2">
                <Button onClick={startCameraStream} className="flex-1">
                  <Video className="w-4 h-4 mr-2" />
                  Camera
                </Button>
                <Button onClick={startScreenShare} variant="outline" className="flex-1">
                  <Monitor className="w-4 h-4 mr-2" />
                  Screen
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                {!videoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <VideoOff className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                <Badge className="absolute top-2 left-2 bg-red-500">
                  LIVE
                </Badge>
                <Badge className="absolute top-2 right-2" variant="secondary">
                  {streamType === 'camera' ? <Video className="w-3 h-3 mr-1" /> : <Monitor className="w-3 h-3 mr-1" />}
                  {streamType}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAudio}
                  className="flex-1"
                >
                  {audioEnabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                  {audioEnabled ? 'Mute' : 'Unmute'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleVideo}
                  className="flex-1"
                >
                  {videoEnabled ? <Video className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
                  {videoEnabled ? 'Hide' : 'Show'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={stopMediaStream}
                  className="flex-1"
                >
                  Stop
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Streams */}
      {otherSessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Active Co-Streams ({otherSessions.length})</h3>
          {otherSessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{session.user_id.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">User {session.user_id.slice(0, 8)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {session.stream_type === 'camera' ? (
                        <Video className="w-3 h-3" />
                      ) : (
                        <Monitor className="w-3 h-3" />
                      )}
                      <span className="capitalize">{session.stream_type}</span>
                      <Badge variant="secondary" className="text-xs">
                        {session.quality}
                      </Badge>
                    </div>
                  </div>
                  <Badge className="bg-red-500">LIVE</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {otherSessions.length === 0 && !mySession && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active co-streams</p>
          <p className="text-xs mt-1">Be the first to start streaming!</p>
        </div>
      )}
    </div>
  );
}