import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Eye, EyeOff, Copy, Save, Download, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function ZEGOConfigPanel({ user }) {
  const qc = useQueryClient();
  const [showSign, setShowSign] = useState(false);
  const [form, setForm] = useState({ app_id: '', app_sign: '', latency_mode: 'ultra_low', kit_type: 'live_streaming' });

  const { data: zegoStream } = useQuery({
    queryKey: ['zego-config', user?.id],
    queryFn: () => base44.entities.ZEGOStream.filter({ host_id: user?.id, status: 'config' }).then(r => r[0]),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (zegoStream) {
      setForm(f => ({
        ...f,
        app_id: zegoStream.app_id || '',
        app_sign: zegoStream.app_sign || '',
        latency_mode: zegoStream.latency_mode || 'ultra_low',
        kit_type: zegoStream.kit_type || 'live_streaming',
      }));
    }
  }, [zegoStream]);

  const saveMut = useMutation({
    mutationFn: () => {
      const data = {
        host_id: user?.id,
        app_id: Number(form.app_id),
        app_sign: form.app_sign,
        latency_mode: form.latency_mode,
        kit_type: form.kit_type,
        status: 'config',
        platform: 'web',
      };
      return zegoStream?.id
        ? base44.entities.ZEGOStream.update(zegoStream.id, data)
        : base44.entities.ZEGOStream.create(data);
    },
    onSuccess: () => { qc.invalidateQueries(['zego-config']); toast.success('ZEGOCLOUD config saved!'); },
    onError: () => { toast.error('Failed to save ZEGOCLOUD config. Please try again.'); },
  });

  const isConfigured = zegoStream && Number(zegoStream.app_id) > 0;
  const obsUrl = `rtmp://YOUR_VPS_IP:1935/live/${zegoStream?.zego_room_id || 'seewhy_room_XXXXX'}`;

  return (
    <div className="rounded-xl p-5 space-y-5" style={{ background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.18)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <Zap className="w-4 h-4" style={{ color: '#C9A84C' }} />
          </div>
          <div>
            <p className="font-black uppercase text-[11px]" style={{ color: GOLD, ...T }}>Streaming Engine</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>ZEGOCLOUD Configuration</p>
          </div>
        </div>
        <span className="text-[11px] font-black uppercase px-2 py-1 rounded-full"
          style={{
            background: isConfigured ? 'rgba(109,191,126,0.12)' : 'rgba(255,68,68,0.12)',
            color: isConfigured ? '#6DBF7E' : '#FF4444',
            border: `1px solid ${isConfigured ? 'rgba(109,191,126,0.3)' : 'rgba(255,68,68,0.3)'}`,
          }}>
          {isConfigured ? '● CONFIGURED' : '● NOT CONFIGURED'}
        </span>
      </div>

      {/* App ID */}
      <div>
        <label className="text-[11px] uppercase font-black block mb-1.5" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
          App ID <span style={{ color: 'rgba(255,255,255,0.2)' }}>(numeric)</span>
        </label>
        <input
          type="number"
          placeholder="e.g. 1234567890"
          value={form.app_id}
          onChange={e => setForm(f => ({ ...f, app_id: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-[11px] outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontFamily: 'Share Tech Mono, monospace' }}
        />
      </div>

      {/* App Sign */}
      <div>
        <label className="text-[11px] uppercase font-black block mb-1.5" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
          App Sign <span style={{ color: 'rgba(255,255,255,0.2)' }}>(64-char hex)</span>
        </label>
        <div className="relative">
          <input
            type={showSign ? 'text' : 'password'}
            placeholder="0123456789abcdef..."
            value={form.app_sign}
            onChange={e => setForm(f => ({ ...f, app_sign: e.target.value }))}
            className="w-full px-3 py-2 pr-10 rounded-lg text-[11px] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontFamily: 'Share Tech Mono, monospace' }}
          />
          <button onClick={() => setShowSign(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2">
            {showSign ? <EyeOff className="w-3.5 h-3.5 text-white/30" /> : <Eye className="w-3.5 h-3.5 text-white/30" />}
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] uppercase font-black block mb-1.5" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Latency Mode</label>
          <select
            value={form.latency_mode}
            onChange={e => setForm(f => ({ ...f, latency_mode: e.target.value }))}
            className="w-full px-2 py-2 rounded-lg text-[10px] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <option value="ultra_low">Ultra-Low (&lt;500ms)</option>
            <option value="low">Low (&lt;1s)</option>
            <option value="standard">Standard</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] uppercase font-black block mb-1.5" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>UIKit Type</label>
          <select
            value={form.kit_type}
            onChange={e => setForm(f => ({ ...f, kit_type: e.target.value }))}
            className="w-full px-2 py-2 rounded-lg text-[10px] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <option value="live_streaming">Live Streaming</option>
            <option value="video_call">Video Call</option>
            <option value="voice_call">Voice Call</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 flex-wrap">
        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-[10px]"
          style={{ background: '#800020', color: GOLD, border: '1px solid rgba(212,175,55,0.3)', ...T }}>
          <Save className="w-3.5 h-3.5" />
          {saveMut.isPending ? 'Saving…' : 'Save Config'}
        </button>

        <button
          onClick={() => { navigator.clipboard.writeText(obsUrl); toast.success('OBS ingest URL copied!'); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-[10px]"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', ...T }}>
          <Copy className="w-3.5 h-3.5" /> Copy OBS Ingest URL
        </button>

        <a href="/download">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-[10px]"
            style={{ background: 'transparent', color: GOLD, border: `1px solid ${GOLD}60`, ...T }}>
            <Download className="w-3.5 h-3.5" /> Download React Native App
          </button>
        </a>
      </div>

      {/* OBS URL preview */}
      <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[11px] uppercase font-black mb-1" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>OBS Ingest URL</p>
        <p className="text-[10px] break-all" style={{ color: '#C9A84C', fontFamily: 'Share Tech Mono, monospace' }}>{obsUrl}</p>
      </div>
    </div>
  );
}