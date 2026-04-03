import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wifi, WifiOff, Play, Square, Circle, Monitor, RefreshCw,
  ChevronRight, Settings, Activity, Layers
} from 'lucide-react';
import { toast } from 'sonner';

const OBS_EVENTS = {
  GET_SCENES: { 'request-type': 'GetSceneList', 'message-id': 'get-scenes' },
  GET_STATUS: { 'request-type': 'GetStreamingStatus', 'message-id': 'get-status' },
  GET_STATS: { 'request-type': 'GetStats', 'message-id': 'get-stats' },
  START_STREAM: { 'request-type': 'StartStreaming', 'message-id': 'start-stream' },
  STOP_STREAM: { 'request-type': 'StopStreaming', 'message-id': 'stop-stream' },
  START_RECORD: { 'request-type': 'StartRecording', 'message-id': 'start-record' },
  STOP_RECORD: { 'request-type': 'StopRecording', 'message-id': 'stop-record' },
};

function makeSceneSwitch(sceneName) {
  return { 'request-type': 'SetCurrentScene', 'message-id': 'scene-switch', 'scene-name': sceneName };
}

export default function OBSBridge() {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('4455');
  const [password, setPassword] = useState('');
  const [scenes, setScenes] = useState([]);
  const [currentScene, setCurrentScene] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [recording, setRecording] = useState(false);
  const [stats, setStats] = useState(null);
  const statsInterval = useRef(null);

  const send = useCallback((payload) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    }
  }, []);

  const disconnect = useCallback(() => {
    clearInterval(statsInterval.current);
    ws.current?.close();
    ws.current = null;
    setConnected(false);
    setScenes([]);
    setStats(null);
  }, []);

  const connect = useCallback(() => {
    setConnecting(true);
    const socket = new WebSocket(`ws://${host}:${port}`);
    ws.current = socket;

    socket.onopen = () => {
      // OBS WebSocket v5 sends hello on connect
      setConnecting(false);
      toast.success('Connected to OBS Studio!');
    };

    socket.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);

      // OBS WS v5 protocol
      if (msg.op === 0) {
        // Hello - identify
        const auth = { op: 1, d: { rpcVersion: 1, eventSubscriptions: 33 } };
        if (password) auth.d.authentication = password;
        socket.send(JSON.stringify(auth));
      } else if (msg.op === 2) {
        // Identified
        setConnected(true);
        send({ op: 6, d: { requestType: 'GetSceneList', requestId: 'get-scenes' } });
        send({ op: 6, d: { requestType: 'GetStreamStatus', requestId: 'get-stream-status' } });
        send({ op: 6, d: { requestType: 'GetRecordStatus', requestId: 'get-record-status' } });
        // Poll stats every 3s
        statsInterval.current = setInterval(() => {
          send({ op: 6, d: { requestType: 'GetStats', requestId: 'get-stats' } });
        }, 3000);
      } else if (msg.op === 7) {
        // RequestResponse
        const { requestId, responseData } = msg.d;
        if (requestId === 'get-scenes' && responseData?.scenes) {
          setScenes([...responseData.scenes].reverse());
          setCurrentScene(responseData.currentProgramSceneName);
        }
        if (requestId === 'get-stream-status') setStreaming(responseData?.outputActive || false);
        if (requestId === 'get-record-status') setRecording(responseData?.outputActive || false);
        if (requestId === 'get-stats') setStats(responseData);
        if (requestId === 'scene-switch') setCurrentScene(responseData?.currentProgramSceneName || currentScene);
      } else if (msg.op === 5) {
        // Event
        const { eventType, eventData } = msg.d;
        if (eventType === 'StreamStateChanged') setStreaming(eventData.outputActive);
        if (eventType === 'RecordStateChanged') setRecording(eventData.outputActive);
        if (eventType === 'CurrentProgramSceneChanged') setCurrentScene(eventData.sceneName);
      }
    };

    socket.onerror = () => {
      setConnecting(false);
      toast.error('Could not connect to OBS. Make sure OBS is open and obs-websocket is enabled.');
    };

    socket.onclose = () => {
      clearInterval(statsInterval.current);
      setConnected(false);
      setConnecting(false);
    };
  }, [host, port, password, send, currentScene]);

  useEffect(() => () => disconnect(), [disconnect]);

  const switchScene = (name) => {
    send({ op: 6, d: { requestType: 'SetCurrentProgramScene', requestId: 'scene-switch', requestData: { sceneName: name } } });
    setCurrentScene(name);
  };

  const toggleStream = () => {
    if (streaming) {
      send({ op: 6, d: { requestType: 'StopStream', requestId: 'stop-stream' } });
    } else {
      send({ op: 6, d: { requestType: 'StartStream', requestId: 'start-stream' } });
    }
  };

  const toggleRecord = () => {
    if (recording) {
      send({ op: 6, d: { requestType: 'StopRecord', requestId: 'stop-record' } });
    } else {
      send({ op: 6, d: { requestType: 'StartRecord', requestId: 'start-record' } });
    }
  };

  const refreshScenes = () => {
    send({ op: 6, d: { requestType: 'GetSceneList', requestId: 'get-scenes' } });
  };

  return (
    <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(0,212,255,0.15)] text-white">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-[#00d4ff] flex items-center gap-2">
            <Monitor className="w-4 h-4" /> OBS Studio Bridge
          </CardTitle>
          <Badge className={connected
            ? 'bg-green-900/30 text-green-400 border-green-700/40'
            : 'bg-white/5 text-white/40 border-white/10'
          }>
            {connected ? <><Wifi className="w-3 h-3 mr-1" /> Connected</> : <><WifiOff className="w-3 h-3 mr-1" /> Offline</>}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        {!connected ? (
          <div className="space-y-3">
            <p className="text-xs text-white/40">Connect to OBS via obs-websocket (Tools → WebSocket Server Settings in OBS)</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-white/40 uppercase">Host</label>
                <input value={host} onChange={e => setHost(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white mt-1" />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase">Port</label>
                <input value={port} onChange={e => setPort(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white mt-1" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase">Password (optional)</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white mt-1"
                placeholder="Leave blank if no password" />
            </div>
            <Button
              className="w-full bg-[#00d4ff] text-black font-bold gap-2"
              onClick={connect} disabled={connecting}>
              <Wifi className="w-4 h-4" />
              {connecting ? 'Connecting...' : 'Connect to OBS'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stream/Record controls */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={toggleStream}
                className={streaming
                  ? 'bg-red-600 hover:bg-red-700 text-white font-bold gap-2'
                  : 'bg-green-700 hover:bg-green-600 text-white font-bold gap-2'}
              >
                {streaming ? <><Square className="w-4 h-4" /> Stop Stream</> : <><Play className="w-4 h-4" /> Start Stream</>}
              </Button>
              <Button
                onClick={toggleRecord}
                variant="outline"
                className={recording
                  ? 'border-red-700 text-red-400 hover:bg-red-900/20 gap-2'
                  : 'border-white/10 text-white/60 hover:text-white gap-2'}
              >
                <Circle className={`w-4 h-4 ${recording ? 'fill-red-500 text-red-500 animate-pulse' : ''}`} />
                {recording ? 'Stop Rec' : 'Start Rec'}
              </Button>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'CPU', value: `${(stats.cpuUsage || 0).toFixed(1)}%` },
                  { label: 'FPS', value: `${Math.round(stats.activeFps || 0)}` },
                  { label: 'Drop', value: `${(stats.renderSkippedFramesPercentage || 0).toFixed(1)}%` },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-white/40">{s.label}</p>
                    <p className="text-sm font-bold text-[#00d4ff]">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Scene switcher */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/50 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Scenes
                </p>
                <button onClick={refreshScenes} className="text-white/30 hover:text-white">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {scenes.length === 0 && <p className="text-xs text-white/20 text-center py-2">No scenes found</p>}
                {scenes.map(scene => (
                  <button
                    key={scene.sceneName}
                    onClick={() => switchScene(scene.sceneName)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                      currentScene === scene.sceneName
                        ? 'bg-[#00d4ff]/15 border border-[#00d4ff]/30 text-[#00d4ff] font-semibold'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${currentScene === scene.sceneName ? 'opacity-100' : 'opacity-0'}`} />
                    <span className="truncate">{scene.sceneName}</span>
                    {currentScene === scene.sceneName && (
                      <Badge className="ml-auto bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[9px] px-1.5 py-0">LIVE</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="ghost" size="sm" className="w-full text-white/30 hover:text-white/60 text-xs" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}