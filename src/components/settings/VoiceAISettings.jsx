import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useVoiceSettings } from '../../hooks/useVoiceSettings';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const VOICE_PRESETS = [
  { id: '',           label: 'System Default', desc: 'Uses browser default voice' },
  { id: 'en-US-1',   label: 'Nova (US)',       desc: 'Warm & clear' },
  { id: 'en-US-2',   label: 'Alloy (US)',      desc: 'Neutral & balanced' },
  { id: 'en-GB-1',   label: 'Echo (UK)',       desc: 'Deep & resonant' },
  { id: 'en-AU-1',   label: 'Shimmer (AU)',    desc: 'Bright & expressive' },
];

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: 44, height: 24, borderRadius: 12, background: checked ? G : 'rgba(255,255,255,0.12)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: 9, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
    </div>
  );
}

export default function VoiceAISettings() {
  const { settings, update } = useVoiceSettings();
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    function load() {
      const voices = window.speechSynthesis?.getVoices() || [];
      const english = voices.filter(v => v.lang.startsWith('en'));
      setAvailableVoices(english);
    }
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);

  function testSpeak() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance("Hey! Voice AI is working perfectly on SeeWhy LIVE.");
    utt.volume = settings.volume;
    utt.rate = settings.speed;
    if (settings.voice) {
      const match = availableVoices.find(v => v.name === settings.voice || v.voiceURI === settings.voice);
      if (match) utt.voice = match;
    }
    window.speechSynthesis.speak(utt);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Toggles */}
      <div className="rounded-xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.12)' }}>
        {[
          { key: 'enabled',    label: 'Voice AI Enabled',    desc: 'Allow AI personas to speak aloud' },
          { key: 'autoSpeak',  label: 'Auto-Speak Replies',  desc: 'Automatically read each AI reply' },
        ].map(row => (
          <div key={row.key} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-black text-sm text-white" style={T}>{row.label}</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>{row.desc}</p>
            </div>
            <Toggle checked={!!settings[row.key]} onChange={v => update(row.key, v)} />
          </div>
        ))}
      </div>

      {/* Voice selector */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.12)' }}>
        <p className="text-[10px] font-black uppercase mb-3" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>Select Voice</p>
        <div className="space-y-2">
          {(availableVoices.length > 0 ? availableVoices.slice(0, 6).map(v => ({ id: v.name, label: v.name, desc: v.lang })) : VOICE_PRESETS).map(v => (
            <button key={v.id} onClick={() => update('voice', v.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left"
              style={{ background: settings.voice === v.id ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${settings.voice === v.id ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}` }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, border: `2px solid ${settings.voice === v.id ? G : 'rgba(255,255,255,0.3)'}`, background: settings.voice === v.id ? G : 'transparent', flexShrink: 0 }} />
              <div>
                <p className="text-sm font-bold text-white" style={T}>{v.label || 'Default'}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{v.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Volume & Speed */}
      <div className="rounded-xl p-4 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.12)' }}>
        {[
          { key: 'volume', label: 'Volume', min: 0, max: 1, step: 0.05, fmt: v => Math.round(v * 100) + '%' },
          { key: 'speed',  label: 'Speed',  min: 0.5, max: 2.0, step: 0.1, fmt: v => v + 'x' },
        ].map(row => (
          <div key={row.key}>
            <div className="flex justify-between mb-2">
              <p className="text-sm font-black text-white" style={T}>{row.label}</p>
              <p className="text-sm font-black" style={{ color: G, ...T }}>{row.fmt(settings[row.key])}</p>
            </div>
            <input type="range" min={row.min} max={row.max} step={row.step} value={settings[row.key]}
              onChange={e => update(row.key, parseFloat(e.target.value))}
              className="w-full" style={{ accentColor: G }} />
          </div>
        ))}
      </div>

      {/* Test button */}
      <button onClick={testSpeak} disabled={!settings.enabled}
        className="w-full py-3 rounded-xl font-black uppercase text-[12px] transition-all disabled:opacity-40"
        style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: G, ...T }}>
        🔊 Test Voice
      </button>

      <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
        Voice applies to AURA, SwanyBot, Joyce, and Guardian AI replies
      </p>
    </motion.div>
  );
}
