import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const INPUT_STYLE = { width:'100%', padding:'6px 12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:14, outline:'none', boxSizing:'border-box', marginTop:4 };

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
      let msg;
      try { msg = JSON.parse(evt.data); } catch { return; }

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
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:12, overflow:'hidden', color:'#fff' }}>
      {/* Header */}
      <div style={{ padding:'16px 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:700, color:'#D4AF37' }}>
          <Monitor style={{ width:16, height:16 }} /> OBS Studio Bridge
        </div>
        <span style={{
          fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, fontFamily:'Barlow Condensed, sans-serif',
          background: connected ? 'rgba(109,191,126,0.15)' : 'rgba(255,255,255,0.05)',
          color: connected ? '#6DBF7E' : 'rgba(255,255,255,0.4)',
          border: `1px solid ${connected ? 'rgba(109,191,126,0.3)' : 'rgba(255,255,255,0.1)'}`,
          display:'flex', alignItems:'center', gap:4,
        }}>
          {connected
            ? <><Wifi style={{ width:12, height:12 }} /> Connected</>
            : <><WifiOff style={{ width:12, height:12 }} /> Offline</>
          }
        </span>
      </div>

      <div style={{ padding:'0 16px 16px', display:'flex', flexDirection:'column', gap:16 }}>
        {!connected ? (
          <>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', margin:0 }}>Connect to OBS via obs-websocket (Tools → WebSocket Server Settings in OBS)</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <label style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>Host</label>
                <input style={INPUT_STYLE} value={host} onChange={e => setHost(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>Port</label>
                <input style={INPUT_STYLE} value={port} onChange={e => setPort(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>Password (optional)</label>
              <input type="password" style={INPUT_STYLE} value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank if no password" />
            </div>
            <button
              onClick={connect}
              disabled={connecting}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', background:'#D4AF37', color:'#000', border:'none', borderRadius:8, fontWeight:700, cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.7 : 1, fontSize:13, fontFamily:'Barlow Condensed, sans-serif' }}
            >
              <Wifi style={{ width:16, height:16 }} />
              {connecting ? 'Connecting...' : 'Connect to OBS'}
            </button>
          </>
        ) : (
          <>
            {/* Stream/Record controls */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <button
                onClick={toggleStream}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Barlow Condensed, sans-serif', background: streaming ? '#C0392B' : '#4A9B5E', color:'#fff' }}
              >
                {streaming ? <><Square style={{ width:16, height:16 }} /> Stop Stream</> : <><Play style={{ width:16, height:16 }} /> Start Stream</>}
              </button>
              <button
                onClick={toggleRecord}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', background:'transparent', border: recording ? '1px solid rgba(192,57,43,0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Barlow Condensed, sans-serif', color: recording ? '#FF4444' : 'rgba(255,255,255,0.6)' }}
              >
                <Circle style={{ width:16, height:16, fill: recording ? '#C0392B' : 'transparent', color: recording ? '#C0392B' : 'currentColor' }} />
                {recording ? 'Stop Rec' : 'Start Rec'}
              </button>
            </div>

            {/* Stats */}
            {stats && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
                {[
                  { label: 'CPU', value: `${(stats.cpuUsage || 0).toFixed(1)}%` },
                  { label: 'FPS', value: `${Math.round(stats.activeFps || 0)}` },
                  { label: 'Drop', value: `${(stats.renderSkippedFramesPercentage || 0).toFixed(1)}%` },
                ].map(s => (
                  <div key={s.label} style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:8, textAlign:'center' }}>
                    <p style={{ fontSize:10, color:'rgba(255,255,255,0.4)', margin:'0 0 2px' }}>{s.label}</p>
                    <p style={{ fontSize:14, fontWeight:700, color:'#D4AF37', margin:0 }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Scene switcher */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', gap:6, margin:0 }}>
                  <Layers style={{ width:14, height:14 }} /> Scenes
                </p>
                <button onClick={refreshScenes} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:2 }}>
                  <RefreshCw style={{ width:12, height:12 }} />
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:160, overflowY:'auto', paddingRight:4 }}>
                {scenes.length === 0 && <p style={{ fontSize:12, color:'rgba(255,255,255,0.2)', textAlign:'center', padding:'8px 0' }}>No scenes found</p>}
                {scenes.map(scene => {
                  const active = currentScene === scene.sceneName;
                  return (
                    <button
                      key={scene.sceneName}
                      onClick={() => switchScene(scene.sceneName)}
                      style={{
                        width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:12, fontSize:14, border:'none', cursor:'pointer', transition:'all 0.15s', textAlign:'left',
                        background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                        borderLeft: active ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                        color: active ? '#D4AF37' : 'rgba(255,255,255,0.6)',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      <ChevronRight style={{ width:14, height:14, flexShrink:0, opacity: active ? 1 : 0 }} />
                      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{scene.sceneName}</span>
                      {active && (
                        <span style={{ fontSize:11, fontWeight:900, padding:'1px 6px', borderRadius:99, background:'rgba(212,175,55,0.2)', color:'#D4AF37', border:'1px solid rgba(212,175,55,0.3)', fontFamily:'Barlow Condensed, sans-serif' }}>LIVE</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={disconnect}
              style={{ width:'100%', padding:'8px', background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:12, borderRadius:8, fontFamily:'Barlow Condensed, sans-serif' }}
              onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.3)'}
            >
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}
