import { useState } from 'react';

const KEY = 'swlive_voice_settings';
const DEFAULTS = { enabled: true, autoSpeak: true, voice: '', volume: 0.8, speed: 1.0 };

export function useVoiceSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    } catch {
      return { ...DEFAULTS };
    }
  });

  function update(key, val) {
    const next = { ...settings, [key]: val };
    setSettings(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }

  return { settings, update };
}

export function readVoiceSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}
