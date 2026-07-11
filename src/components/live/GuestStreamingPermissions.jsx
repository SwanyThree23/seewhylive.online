import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Radio, Eye, EyeOff, Share2, AlertCircle, X } from 'lucide-react';

export default function GuestStreamingPermissions({ participant, isHost, onPermissionChange }) {
  const [open, setOpen] = useState(false);
  const [permissions, setPermissions] = useState({
    canStream: participant?.can_stream ?? false,
    canMultistream: participant?.can_multistream ?? false,
    recordingAllowed: participant?.recording_allowed ?? true,
    visibleToViewers: participant?.visible_to_viewers ?? true,
  });

  const handlePermissionToggle = (key) => {
    const updated = { ...permissions, [key]: !permissions[key] };
    setPermissions(updated);
    onPermissionChange?.(participant?.id, updated);
  };

  if (!isHost) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ fontSize: 12, height: 28, padding: '0 8px', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37', background: 'transparent', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif' }}
      >
        <Radio className="w-3 h-3" />
        Permissions
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={() => setOpen(false)} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 448, width: '100%', background: '#0A0710', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, padding: 24, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{participant?.user_name} — Stream Permissions</span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}><X className="w-4 h-4" /></button>
            </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Allow Multi-Stream */}
            <div className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#d4af37]" />
                  <div>
                    <p className="text-xs font-semibold text-white">Multi-Platform Streaming</p>
                    <p className="text-[10px] text-white/40">Allow this guest to output to other platforms</p>
                  </div>
                </div>
                <button
                  onClick={() => handlePermissionToggle('canMultistream')}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    permissions.canMultistream ? 'bg-green-600/30 border border-green-500' : 'bg-white/5 border border-white/10'
                  }`}
                >
                  {permissions.canMultistream && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                </button>
              </div>
              {permissions.canMultistream && (
                <p className="text-[11px] text-green-400/70 ml-6">✓ Guest can send to YouTube, Twitch, etc.</p>
              )}
            </div>

            {/* Allow Direct Streaming */}
            <div className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#d4af37]" />
                  <div>
                    <p className="text-xs font-semibold text-white">Direct Stream Link</p>
                    <p className="text-[10px] text-white/40">Guest can get their own RTMP ingest URL</p>
                  </div>
                </div>
                <button
                  onClick={() => handlePermissionToggle('canStream')}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    permissions.canStream ? 'bg-green-600/30 border border-green-500' : 'bg-white/5 border border-white/10'
                  }`}
                >
                  {permissions.canStream && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                </button>
              </div>
            </div>

            {/* Recording Control */}
            <div className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#d4af37]" />
                  <div>
                    <p className="text-xs font-semibold text-white">Recording Allowed</p>
                    <p className="text-[10px] text-white/40">Can this stream be recorded to VOD?</p>
                  </div>
                </div>
                <button
                  onClick={() => handlePermissionToggle('recordingAllowed')}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    permissions.recordingAllowed ? 'bg-blue-600/30 border border-blue-500' : 'bg-red-600/30 border border-red-500'
                  }`}
                >
                  {permissions.recordingAllowed ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Visibility Control */}
            <div className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {permissions.visibleToViewers ? <Eye className="w-4 h-4 text-[#4A8A7A]" /> : <EyeOff className="w-4 h-4 text-red-400" />}
                  <div>
                    <p className="text-xs font-semibold text-white">Visible to Viewers</p>
                    <p className="text-[10px] text-white/40">Show this guest in the public stream?</p>
                  </div>
                </div>
                <button
                  onClick={() => handlePermissionToggle('visibleToViewers')}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    permissions.visibleToViewers ? 'bg-[#4A8A7A]/30 border border-[#4A8A7A]' : 'bg-gray-600/30 border border-gray-500'
                  }`}
                >
                  {permissions.visibleToViewers && <CheckCircle2 className="w-4 h-4 text-[#4A8A7A]" />}
                </button>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-orange-900/20 border border-orange-500/30 rounded p-2 flex gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-orange-300">These permissions are specific to this guest. You can update them anytime during the stream.</p>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button onClick={() => setOpen(false)} className="flex-1 bg-[#d4af37] text-black hover:bg-[#e6c158]">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}