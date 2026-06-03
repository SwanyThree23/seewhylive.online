import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const QUICK_LANGUAGES = ['Spanish', 'French', 'German', 'Japanese', 'Chinese'];

export default function LiveTranslationWidget({ chatMessage, onTranslation }) {
  const [translating, setTranslating] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  const handleTranslate = async (language) => {
    setTranslating(true);
    try {
      const res = await base44.functions.invoke('translateText', {
        text: chatMessage,
        target_language: language
      });
      onTranslation(res.data.translated_text);
      setShowLanguages(false);
      toast.success(`Translated to ${language}`);
    } catch (err) {
      toast.error('Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <button
        onClick={() => setShowLanguages(!showLanguages)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-white/70"
      >
        <Globe className="w-3 h-3" />
        Translate
      </button>

      {showLanguages && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 right-0 bg-[#1a0a2e] border border-white/20 rounded-lg p-2 z-50 min-w-max"
        >
          {QUICK_LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => handleTranslate(lang)}
              disabled={translating}
              className="block w-full text-left px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10 rounded disabled:opacity-50"
            >
              {translating ? (
                <>
                  <Loader2 className="w-2 h-2 inline animate-spin mr-1" />
                  {lang}
                </>
              ) : (
                lang
              )}
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}