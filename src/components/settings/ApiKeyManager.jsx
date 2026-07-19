import React, { useState, useCallback } from 'react';
import { Key, Eye, EyeOff, Copy, RefreshCw, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const GOLD   = '#C9A84C';
const BURG   = '#6B1F2A';
const OBS    = '#07050A';
const DIM    = 'rgba(255,255,255,0.45)';
const T      = { fontFamily: 'Barlow Condensed, sans-serif' };

const SERVICES = [
  { key: 'openrouter',  label: 'OpenRouter',   placeholder: 'sk-or-v1-...',  link: 'https://openrouter.ai/keys' },
  { key: 'anthropic',  label: 'Anthropic',     placeholder: 'sk-ant-...',    link: 'https://console.anthropic.com/api-keys' },
  { key: 'openai',     label: 'OpenAI',        placeholder: 'sk-...',        link: 'https://platform.openai.com/api-keys' },
  { key: 'wispr',      label: 'WisprFlow',     placeholder: 'wf-...',        link: null },
  { key: 'elevenlabs', label: 'ElevenLabs',    placeholder: 'el-...',        link: 'https://elevenlabs.io/api-keys' },
  { key: 'deepgram',   label: 'Deepgram',      placeholder: 'dg-...',        link: 'https://console.deepgram.com/api-keys' },
];

const STORAGE_PREFIX = 'swl_apikey_';

function loadKeys() {
  try {
    const out = {};
    SERVICES.forEach(s => {
      const v = localStorage.getItem(STORAGE_PREFIX + s.key);
      if (v) out[s.key] = v;
    });
    return out;
  } catch {
    return {};
  }
}

function saveKey(serviceKey, value) {
  try {
    if (value) localStorage.setItem(STORAGE_PREFIX + serviceKey, value);
    else localStorage.removeItem(STORAGE_PREFIX + serviceKey);
  } catch {}
}

/**
 * ApiKeyManager — manages 3rd-party API keys stored locally (never sent to server).
 * Keys are saved in localStorage under `swl_apikey_<service>`.
 */
export default function ApiKeyManager() {
  const [keys, setKeys] = useState(loadKeys);
  const [visible, setVisible] = useState({}); // serviceKey → bool
  const [editing, setEditing] = useState({}); // serviceKey → draft string

  const startEdit = useCallback((serviceKey) => {
    setEditing(prev => ({ ...prev, [serviceKey]: keys[serviceKey] || '' }));
  }, [keys]);

  const commitEdit = useCallback((serviceKey) => {
    const val = (editing[serviceKey] || '').trim();
    setKeys(prev => { const n = { ...prev }; if (val) n[serviceKey] = val; else delete n[serviceKey]; return n; });
    saveKey(serviceKey, val);
    setEditing(prev => { const n = { ...prev }; delete n[serviceKey]; return n; });
    toast.success(val ? `${SERVICES.find(s=>s.key===serviceKey)?.label} key saved.` : 'Key removed.');
  }, [editing]);

  const removeKey = useCallback((serviceKey) => {
    setKeys(prev => { const n = { ...prev }; delete n[serviceKey]; return n; });
    saveKey(serviceKey, '');
    toast.success('Key removed.');
  }, []);

  const copyKey = useCallback((serviceKey) => {
    const v = keys[serviceKey];
    if (!v) return;
    navigator.clipboard.writeText(v).then(() => toast.success('Copied!')).catch(() => {});
  }, [keys]);

  return (
    <div style={{ ...T }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Key style={{ width: 16, height: 16, color: GOLD }} />
        <span style={{ fontSize: 15, fontWeight: 800, color: GOLD, letterSpacing: 1, textTransform: 'uppercase' }}>API Key Manager</span>
      </div>
      <p style={{ fontSize: 11, color: DIM, marginBottom: 16, lineHeight: 1.5 }}>
        Keys are stored locally in your browser only — never transmitted to SeeWhy LIVE servers.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SERVICES.map(svc => {
          const val = keys[svc.key] || '';
          const draft = editing[svc.key];
          const isEditing = draft !== undefined;
          const isSet = !!val;
          const show = !!visible[svc.key];

          return (
            <div key={svc.key} style={{
              borderRadius: 10, overflow: 'hidden',
              border: `1px solid ${isSet ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.07)'}`,
              background: 'rgba(13,6,24,0.8)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                {/* Status dot */}
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: isSet ? '#6DBF7E' : 'rgba(255,255,255,0.2)',
                }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                  {svc.label}
                </span>
                {svc.link && (
                  <a href={svc.link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 10, color: GOLD, textDecoration: 'none', opacity: 0.7 }}>
                    Get key ↗
                  </a>
                )}
              </div>

              {isEditing ? (
                <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={draft}
                    autoFocus
                    onChange={e => setEditing(prev => ({ ...prev, [svc.key]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(svc.key); if (e.key === 'Escape') setEditing(prev => { const n={...prev}; delete n[svc.key]; return n; }); }}
                    placeholder={svc.placeholder}
                    style={{
                      flex: 1, padding: '7px 10px', borderRadius: 7,
                      background: 'rgba(0,0,0,0.5)',
                      border: `1px solid rgba(201,168,76,0.35)`,
                      color: 'rgba(255,255,255,0.9)', fontSize: 12, fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  <button onClick={() => commitEdit(svc.key)} style={{ padding: '7px 12px', borderRadius: 7, background: 'rgba(201,168,76,0.15)', border: `1px solid rgba(201,168,76,0.35)`, color: GOLD, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Save</button>
                  <button onClick={() => setEditing(prev => { const n={...prev}; delete n[svc.key]; return n; })} style={{ padding: '7px 10px', borderRadius: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: DIM, cursor: 'pointer', fontSize: 11 }}>✕</button>
                </div>
              ) : (
                <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {isSet ? (
                    <span style={{ flex: 1, fontSize: 11, fontFamily: 'monospace', color: DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {show ? val : val.slice(0, 6) + '•••••••••••' + val.slice(-4)}
                    </span>
                  ) : (
                    <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Not set</span>
                  )}
                  {isSet && (
                    <>
                      <button onClick={() => setVisible(p => ({ ...p, [svc.key]: !p[svc.key] }))}
                        style={{ padding: '5px 7px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: DIM, cursor: 'pointer' }}>
                        {show ? <EyeOff style={{ width: 12, height: 12 }} /> : <Eye style={{ width: 12, height: 12 }} />}
                      </button>
                      <button onClick={() => copyKey(svc.key)}
                        style={{ padding: '5px 7px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: DIM, cursor: 'pointer' }}>
                        <Copy style={{ width: 12, height: 12 }} />
                      </button>
                      <button onClick={() => removeKey(svc.key)}
                        style={{ padding: '5px 7px', borderRadius: 6, background: 'rgba(107,31,42,0.1)', border: '1px solid rgba(107,31,42,0.2)', color: BURG, cursor: 'pointer' }}>
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    </>
                  )}
                  <button onClick={() => startEdit(svc.key)}
                    style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.2)`, color: GOLD, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isSet ? <><RefreshCw style={{ width: 11, height: 11 }} /> Update</> : <><Plus style={{ width: 11, height: 11 }} /> Add</>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
