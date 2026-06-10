import { readVoiceSettings } from '../hooks/useVoiceSettings';

export function speakReply(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const vs = readVoiceSettings();
  if (!vs.enabled || !vs.autoSpeak) return;

  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(String(text).substring(0, 300));
  utt.volume = vs.volume ?? 0.8;
  utt.rate = vs.speed ?? 1.0;

  if (vs.voice) {
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.name === vs.voice || v.voiceURI === vs.voice);
    if (match) utt.voice = match;
  }

  window.speechSynthesis.speak(utt);
}
