import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import NativeSelect from '@/components/shared/NativeSelect';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
];

export default function TranscriptionPanel({ recordingUrl, roomTitle }) {
  const [transcription, setTranscription] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranscribe = async () => {
    if (!recordingUrl) {
      toast.error('No recording URL provided');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('transcribeAudio', {
        file_url: recordingUrl
      });
      setTranscription(res.data.transcription);
      toast.success('Transcription complete');
    } catch (err) {
      toast.error('Transcription failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!transcription) {
      toast.error('Transcribe first');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('translateText', {
        text: transcription,
        target_language: LANGUAGES.find(l => l.code === targetLanguage)?.name || targetLanguage
      });
      setTranslatedText(res.data.translated_text);
      toast.success('Translation complete');
    } catch (err) {
      toast.error('Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#0F1428]/50 border border-[#d4af37]/15 rounded-lg p-4 space-y-4"
    >
      <div>
        <h3 className="text-sm font-bold text-white mb-3">Transcription & Translation</h3>
        
        <div className="space-y-3">
          {/* Transcription Section */}
          <div className="space-y-2">
            <label className="text-[10px] text-white/60 uppercase font-semibold block">Transcribe Recording</label>
            <button
              onClick={handleTranscribe}
              disabled={loading || !recordingUrl}
              style={{ width:'100%', background:'#5B7FA6', color:'#fff', border:'none', padding:'8px 14px', borderRadius:8, cursor:loading||!recordingUrl?'default':'pointer', opacity:loading||!recordingUrl?0.5:1, fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:13 }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-2" />
                  Transcribing...
                </>
              ) : (
                'Transcribe to Text'
              )}
            </button>
            
            {transcription && (
              <div className="relative">
                <textarea
                  readOnly
                  value={transcription}
                  className="w-full h-32 bg-white/5 border border-white/10 rounded p-2 text-[11px] text-white/80 resize-none"
                />
                <button
                  onClick={() => handleCopy(transcription)}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center"
                >
                  {copied ? <Check className="w-3 h-3 text-[#6DBF7E]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>

          {/* Translation Section */}
          {transcription && (
            <div className="space-y-2 pt-3 border-t border-white/10">
              <div className="flex gap-2 items-center">
                <label className="text-[10px] text-white/60 uppercase font-semibold flex-1">Translate To</label>
                <NativeSelect
                  value={targetLanguage}
                  onChange={(val) => setTargetLanguage(val)}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white/80"
                  options={LANGUAGES.map(lang => ({value: lang.code, label: lang.name}))}
                />
              </div>
              
              <button
                onClick={handleTranslate}
                disabled={loading}
                style={{ width:'100%', background:'#7B5DA6', color:'#fff', border:'none', padding:'8px 14px', borderRadius:8, cursor:loading?'default':'pointer', opacity:loading?0.5:1, fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:13 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    Translating...
                  </>
                ) : (
                  'Translate Text'
                )}
              </button>

              {translatedText && (
                <div className="relative">
                  <textarea
                    readOnly
                    value={translatedText}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded p-2 text-[11px] text-white/80 resize-none"
                  />
                  <button
                    onClick={() => handleCopy(translatedText)}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#6DBF7E]" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}