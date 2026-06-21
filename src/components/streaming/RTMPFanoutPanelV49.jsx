import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Radio, Copy, Check, Play, Square } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const BG = '#080B18';
const FONT = 'Barlow Condensed, sans-serif';

const PLATFORMS = [
  { id: 'youtube',   label: 'YouTube',   emoji: '▶️',  color: '#FF0000', rtmpBase: 'rtmp://a.rtmp.youtube.com/live2/' },
  { id: 'twitch',    label: 'Twitch',    emoji: '💜',  color: '#9146FF', rtmpBase: 'rtmp://live.twitch.tv/app/' },
  { id: 'facebook',  label: 'Facebook',  emoji: '👍',  color: '#1877F2', rtmpBase: 'rtmps://live-api-s.facebook.com:443/rtmp/' },
  { id: 'tiktok',    label: 'TikTok',    emoji: '🎵',  color: '#010101', rtmpBase: 'rtmp://push.tiktokcdn.com/live/' },
  { id: 'instagram', label: 'Instagram', emoji: '📸',  color: '#E1306C', rtmpBase: 'rtmp://live-upload.instagram.com:443/rtmp/' },
  { id: 'twitter',   label: 'X/Twitter', emoji: '🐦',  color: '#1DA1F2', rtmpBase: 'rtmp://ingest.pscp.tv:80/x/' },
  { id: 'kick',      label: 'Kick',      emoji: '🟢',  color: '#53FC18', rtmpBase: 'rtmp://ingress.kick.com/app/' },
  { id: 'linkedin',  label: 'LinkedIn',  emoji: '💼',  color: '#0A66C2', rtmpBase: 'rtmp://stream.linkedin.com/live-api/ingest/' },
  { id: 'discord',   label: 'Discord',   emoji: '🎮',  color: '#5865F2', rtmpBase: 'rtmp://stream.discord.gg/stage/' },
  { id: 'rumble',    label: 'Rumble',    emoji: '📺',  color: '#85C742', rtmpBase: 'rtmp://ingest.rumble.com/live/' },
  { id: 'trovo',     label: 'Trovo',     emoji: '🎯',  color: '#1DB359', rtmpBase: 'rtmp://livepush.trovo.live/live/' },
  { id: 'dlive',     label: 'DLive',     emoji: '🌊',  color: '#FFD300', rtmpBase: 'rtmp://stream.dlive.tv/live/' },
];

export default function RTMPFanoutPanelV49({ roomId, isHost }) {
  const [enabled, setEnabled] = useState({});
  const [keys, setKeys] = useState({});
  const [active, setActive] = useState(false);
  const [copied, setCopied] = useState('');

  const activePlatforms = PLATFORMS.filter(p => enabled[p.id] && keys[p.id]);

  function togglePlatform(id) {
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function setKey(id, val) {
    setKeys(prev => ({ ...prev, [id]: val }));
  }

  function copyRTMP(platform) {
    const url = platform.rtmpBase + (keys[platform.id] || '');
    navigator.clipboard.writeText(url).then(() => {
      setCopied(platform.id);
      setTimeout(() => setCopied(''), 2000);
      toast.success('RTMP URL copied!');
    }).catch(() => toast.error('Copy failed.'));
  }

  function toggleFanout() {
    if (!active && activePlatforms.length === 0) {
      toast.error('Enable at least one platform and add a stream key');
      return;
    }
    setActive(prev => !prev);
    if (!active) {
      toast.success(`Fanout started to ${activePlatforms.length} platform(s)`);
    } else {
      toast.info('Fanout stopped');
    }
  }

  if (!isHost) return null;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${CRIMSON}44`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${CRIMSON}33`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio size={16} color={active ? '#4ade80' : GOLD} />
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: GOLD, letterSpacing: 1 }}>
            RTMP FANOUT
          </span>
          {active && (
            <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: '#4ade8033', color: '#4ade80', fontFamily: FONT }}>
              LIVE · {activePlatforms.length}
            </span>
          )}
        </div>
        <button
          onClick={toggleFanout}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', minHeight: 44,
            background: active ? 'rgba(239,68,68,0.15)' : `linear-gradient(to right, ${CRIMSON}, ${GOLD})`,
            color: active ? '#EF4444' : '#fff',
            fontFamily: FONT, fontWeight: 700, fontSize: 13,
          }}
        >
          {active ? <><Square size={12} /> Stop</> : <><Play size={12} /> Start Fanout</>}
        </button>
      </div>

      {/* Platform list */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
        {PLATFORMS.map(platform => (
          <div key={platform.id} style={{
            borderRadius: 8,
            border: `1px solid ${enabled[platform.id] ? platform.color + '44' : 'rgba(255,255,255,0.06)'}`,
            background: enabled[platform.id] ? platform.color + '0D' : 'rgba(255,255,255,0.02)',
            overflow: 'hidden',
            transition: 'all 0.2s',
          }}>
            {/* Platform row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
              <button
                onClick={() => togglePlatform(platform.id)}
                style={{
                  width: 20, height: 20, borderRadius: 4, border: `2px solid ${enabled[platform.id] ? platform.color : 'rgba(255,255,255,0.2)'}`,
                  background: enabled[platform.id] ? platform.color : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                {enabled[platform.id] && <Check size={12} color="#fff" />}
              </button>
              <span style={{ fontSize: 16 }}>{platform.emoji}</span>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: enabled[platform.id] ? '#fff' : 'rgba(255,255,255,0.5)', flex: 1 }}>
                {platform.label}
              </span>
              {enabled[platform.id] && keys[platform.id] && (
                <button onClick={() => copyRTMP(platform)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: copied === platform.id ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                  {copied === platform.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
            </div>
            {/* Stream key input */}
            {enabled[platform.id] && (
              <div style={{ padding: '0 12px 10px' }}>
                <input
                  type="password"
                  placeholder={`${platform.label} stream key`}
                  value={keys[platform.id] || ''}
                  onChange={e => setKey(platform.id, e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '8px 12px', borderRadius: 6, border: `1px solid ${platform.color}33`,
                    background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 12,
                    fontFamily: 'monospace', outline: 'none',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {activePlatforms.length > 0 && (
        <div style={{ padding: '8px 16px 12px', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>
          {activePlatforms.length} platform{activePlatforms.length !== 1 ? 's' : ''} ready: {activePlatforms.map(p => p.label).join(', ')}
        </div>
      )}
    </div>
  );
}
