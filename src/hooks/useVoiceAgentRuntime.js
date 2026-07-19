import { useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'swl_voice_agents';
const COOLDOWN_MS = 5000; // 5s per-agent cooldown

function loadAgents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function getElKey() {
  try { return localStorage.getItem('swl_apikey_elevenlabs') || ''; } catch { return ''; }
}

async function speakText(text, voiceId) {
  const key = getElKey();
  if (!key || !text) return;
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  } catch {}
}

function renderTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] || '');
}

// useVoiceAgentRuntime — call in any live page to fire TTS from chat/events
// chatMessage: latest { content, user_name, message_type, tip_amount } object
// eventType: optional override — 'sub_event' | 'tip_event' | 'join_event'
export function useVoiceAgentRuntime({ chatMessage, eventType } = {}) {
  const lastFiredRef = useRef({}); // agentId → timestamp

  const canFire = useCallback((agentId) => {
    const last = lastFiredRef.current[agentId] || 0;
    return Date.now() - last > COOLDOWN_MS;
  }, []);

  const markFired = useCallback((agentId) => {
    lastFiredRef.current[agentId] = Date.now();
  }, []);

  // React to incoming chat messages
  useEffect(() => {
    if (!chatMessage) return;
    const agents = loadAgents().filter(a => a.active);
    if (!agents.length) return;

    const content = (chatMessage.content || '').trim();
    const userName = chatMessage.user_name || 'Viewer';
    const msgType = chatMessage.message_type;

    for (const agent of agents) {
      if (!canFire(agent.id)) continue;

      for (const trigger of (agent.triggers || [])) {
        let matched = false;
        let vars = { user: userName, content };

        if (trigger.type === 'chat_command') {
          const cmd = (trigger.value || '').trim().toLowerCase();
          if (cmd && content.toLowerCase().startsWith(cmd)) {
            matched = true;
            vars.args = content.slice(cmd.length).trim();
          }
        } else if (trigger.type === 'sub_event' && (msgType === 'sub' || eventType === 'sub_event')) {
          matched = true;
        } else if (trigger.type === 'tip_event' && (msgType === 'tip' || eventType === 'tip_event')) {
          matched = true;
          vars.amount = chatMessage.tip_amount ? `$${chatMessage.tip_amount}` : 'a tip';
        } else if (trigger.type === 'join_event' && eventType === 'join_event') {
          matched = true;
        }

        if (matched) {
          const speech = renderTemplate(trigger.responseTemplate || '', vars) || agent.personality?.slice(0, 200);
          if (speech) {
            markFired(agent.id);
            speakText(speech, agent.voiceId || 'rachel');
          }
          break; // one trigger per agent per message
        }
      }
    }
  }, [chatMessage, eventType, canFire, markFired]);
}
