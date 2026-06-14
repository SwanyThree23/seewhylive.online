import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Volume2, X, Settings } from 'lucide-react';

const G = '#d4af37';

export default function LiveTranscription({ isLive = false, roomId }) {
  const [captions, setCaptions] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTranscription, setShowTranscription] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Start transcription stream
  useEffect(() => {
    if (!isLive || !showTranscription) return;

    const startTranscription = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];

          // Upload audio and transcribe
          try {
            const formData = new FormData();
            formData.append('file', audioBlob);

            const uploadRes = await base44.integrations.Core.UploadFile({ file: audioBlob });
            const transcribeRes = await base44.functions.invoke('transcribeAudio', {
              audio_url: uploadRes.file_url,
            });

            if (transcribeRes?.data?.text) {
              addCaption(transcribeRes.data.text);
            }
          } catch (error) {
            console.error('Transcription error:', error);
          }
        };

        mediaRecorder.start();
        setIsTranscribing(true);

        // Process audio in 5-second chunks
        const interval = setInterval(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setTimeout(() => mediaRecorder.start(), 100);
          }
        }, 5000);

        return () => {
          clearInterval(interval);
          if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        };
      } catch (error) {
        console.error('Transcription setup error:', error);
        setIsTranscribing(false);
      }
    };

    const cleanup = startTranscription();
    return cleanup;
  }, [isLive, showTranscription]);

  const addCaption = (text) => {
    const id = Date.now();
    setCaptions(prev => [...prev, { id, text, timestamp: Date.now() }]);
    
    // Auto-remove after 6 seconds
    setTimeout(() => {
      setCaptions(prev => prev.filter(c => c.id !== id));
    }, 6000);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:right-4 md:left-auto md:w-96 z-40">
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowTranscription(!showTranscription)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2 transition-all"
        style={{
          background: showTranscription ? `${G}12` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${showTranscription ? `${G}40` : 'rgba(255,255,255,0.08)'}`,
          color: showTranscription ? G : 'rgba(255,255,255,0.5)',
        }}
      >
        <Volume2 className="w-4 h-4" />
        <span className="text-xs font-bold uppercase">Live Captions</span>
        {isTranscribing && <div className="w-2 h-2 rounded-full bg-current animate-pulse" />}
      </motion.button>

      {/* Captions Container */}
      <AnimatePresence mode="popLayout">
        {showTranscription && captions.map((caption, idx) => (
          <motion.div
            key={caption.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-2 p-3 rounded-lg backdrop-blur-md"
            style={{
              background: 'rgba(8,11,24,0.85)',
              border: `1px solid ${G}30`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-white/90 leading-relaxed">{caption.text}</p>
              <button
                onClick={() => setCaptions(prev => prev.filter(c => c.id !== caption.id))}
                className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {/* Fade indicator */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5.5 }}
              className="mt-1.5 h-0.5 origin-left"
              style={{ background: `${G}40` }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Status Info */}
      {isTranscribing && showTranscription && (
        <div className="text-[10px] text-white/30 mt-2 text-center">
          Transcribing live audio · {captions.length} captions active
        </div>
      )}
    </div>
  );
}