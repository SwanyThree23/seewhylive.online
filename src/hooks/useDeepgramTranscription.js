import { useEffect, useRef, useState, useCallback } from 'react';

const DG_URL = 'wss://api.deepgram.com/v1/listen';

function getKey() {
  try { return localStorage.getItem('swl_apikey_deepgram') || ''; } catch { return ''; }
}

// useDeepgramTranscription — real-time speech-to-text via Deepgram Nova-2
// stream: MediaStream from useLocalMedia (needs audio track)
// enabled: boolean toggle
// language: BCP-47 language code (default 'en-US')
// Returns: { transcript, interimTranscript, isConnected, hasKey, clearTranscript }
export function useDeepgramTranscription({ stream, enabled = true, language = 'en-US' } = {}) {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const recorderRef = useRef(null);
  const hasKey = !!getKey();

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    const key = getKey();
    if (!key || !stream || !enabled) return;

    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) return;

    // Build audio-only stream for recording
    const audioStream = new MediaStream(audioTracks);

    // Detect supported MIME type — opus/webm is most compatible
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg;codecs=opus';

    const encoding = mimeType.includes('ogg') ? 'opus&container=ogg' : 'opus&container=webm';

    const wsUrl = `${DG_URL}?token=${key}&model=nova-2&language=${language}&encoding=${encoding}&channels=1&interim_results=true&smart_format=true&punctuate=true`;

    let ws;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      try {
        const recorder = new MediaRecorder(audioStream, { mimeType, audioBitsPerSecond: 64000 });
        recorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data);
          }
        };
        recorder.start(250); // 250ms chunks
      } catch {}
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type !== 'Results') return;
        const alt = data.channel?.alternatives?.[0];
        if (!alt) return;
        const text = alt.transcript || '';
        if (!text) return;
        if (data.is_final) {
          setTranscript(prev => (prev ? prev + ' ' + text : text).trimStart());
          setInterimTranscript('');
        } else {
          setInterimTranscript(text);
        }
      } catch {}
    };

    ws.onerror = () => setIsConnected(false);
    ws.onclose = () => {
      setIsConnected(false);
      setInterimTranscript('');
    };

    return () => {
      try { recorderRef.current?.stop(); } catch {}
      recorderRef.current = null;
      try { ws.close(); } catch {}
      wsRef.current = null;
      setIsConnected(false);
      setInterimTranscript('');
    };
  }, [stream, enabled, language]);

  return { transcript, interimTranscript, isConnected, hasKey, clearTranscript };
}
