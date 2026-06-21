import React, { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Check, QrCode, Link, Trash2, Plus, Clock, Users, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function makeid(len = 12) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * chars.length)];
  return out;
}

function CopyBtn({ value, label = 'Link' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`${label} copied!`);
    }).catch(() => toast.error('Copy failed.'));
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1 px-2 py-1 rounded transition-all"
      style={{ background: copied ? `${G}20` : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? `${G}40` : 'rgba(255,255,255,0.1)'}` }}>
      {copied ? <Check className="w-3 h-3" style={{ color: G }} /> : <Copy className="w-3 h-3 text-white/40" />}
      <span className="text-[10px] font-bold" style={{ ...T, color: copied ? G : 'rgba(255,255,255,0.5)' }}>
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

function InviteCard({ invite, onRevoke, origin }) {
  const [showQR, setShowQR] = useState(false);
  const joinUrl = `${origin}/GuestJoin?room=${invite.room_id}&token=${invite.token}`;
  const expires = invite.expires_at ? new Date(invite.expires_at) : null;
  const isExpired = expires && expires < new Date();

  const downloadQR = () => {
    const svg = document.getElementById(`qr-${invite.id}`);
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `seewhy-invite-${invite.token.slice(0, 6)}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${isExpired ? 'rgba(255,255,255,0.06)' : `${G}25`}`, background: 'rgba(8,11,24,0.8)' }}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-black uppercase" style={{ ...T, color: isExpired ? 'rgba(255,255,255,0.25)' : G }}>
              {invite.label || `Guest Slot ${invite.token.slice(0, 4).toUpperCase()}`}
            </span>
            {invite.role && (
              <span className="px-1 py-0.5 rounded text-[8px] font-black uppercase" style={{ background: `${G}15`, color: G, ...T }}>
                {invite.role}
              </span>
            )}
            {isExpired && (
              <span className="px-1 py-0.5 rounded text-[8px] font-black uppercase text-red-400" style={{ background: 'rgba(192,57,43,0.15)' }}>
                Expired
              </span>
            )}
          </div>
          {expires && (
            <div className="flex items-center gap-1 text-[9px] text-white/30">
              <Clock className="w-2.5 h-2.5" />
              {isExpired ? 'Expired' : `Expires ${expires.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowQR(s => !s)}
            className="w-7 h-7 rounded flex items-center justify-center transition-all"
            style={{ background: showQR ? `${G}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${showQR ? `${G}40` : 'rgba(255,255,255,0.08)'}` }}
          >
            <QrCode className="w-3.5 h-3.5" style={{ color: showQR ? G : 'rgba(255,255,255,0.4)' }} />
          </button>
          <CopyBtn value={joinUrl} label="Invite link" />
          <button
            onClick={() => onRevoke(invite.id)}
            className="w-7 h-7 rounded flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="flex items-center gap-4 p-3">
              <div className="flex-shrink-0 p-2 rounded-lg" style={{ background: '#fff' }}>
                <QRCodeSVG
                  id={`qr-${invite.id}`}
                  value={joinUrl}
                  size={96}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-[10px] text-white/50 break-all font-mono leading-relaxed">{joinUrl}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={downloadQR}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all"
                    style={{ background: `${G}15`, color: G, border: `1px solid ${G}30`, ...T }}
                  >
                    <Download className="w-2.5 h-2.5" />
                    Save QR
                  </button>
                  <CopyBtn value={joinUrl} label="Invite link" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const ROLES = ['guest', 'co-host', 'speaker'];
const EXPIRY_OPTIONS = [
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '24 hours', ms: 24 * 60 * 60 * 1000 },
  { label: '7 days', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Never', ms: null },
];

export default function GuestInviteGenerator({ roomId, isHost }) {
  const qc = useQueryClient();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://seewhylive.online';

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [role, setRole] = useState('guest');
  const [expiryIdx, setExpiryIdx] = useState(0);

  // Store invites in entity (or fallback to local state if entity unavailable)
  const [localInvites, setLocalInvites] = useState([]);

  const { data: room } = useQuery({
    queryKey: ['room-for-invites', roomId],
    queryFn: () => base44.entities.Room.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
  });

  const createInvite = useCallback(() => {
    if (!roomId) { toast.error('No room selected'); return; }
    const expiryMs = EXPIRY_OPTIONS[expiryIdx].ms;
    const invite = {
      id: `inv_${Date.now()}`,
      room_id: roomId,
      token: makeid(16),
      label: label.trim() || undefined,
      role,
      created_at: new Date().toISOString(),
      expires_at: expiryMs ? new Date(Date.now() + expiryMs).toISOString() : null,
    };
    setLocalInvites(prev => [invite, ...prev]);
    setLabel('');
    setShowForm(false);
    toast.success('Invite link created');
    // Persist to room entity as metadata if possible
    base44.entities.Room.update(roomId, {
      guest_invites: [...(room?.guest_invites || []), invite],
    }).catch(() => {});
  }, [roomId, label, role, expiryIdx, room]);

  const revokeInvite = useCallback((id) => {
    setLocalInvites(prev => prev.filter(i => i.id !== id));
    toast.success('Invite revoked');
  }, []);

  if (!isHost) return null;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Link className="w-3.5 h-3.5" style={{ color: G }} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ ...T, color: G }}>
            Guest Invites
          </span>
          {localInvites.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black" style={{ background: `${G}22`, color: G, ...T }}>
              {localInvites.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-1 px-2 py-1 rounded transition-all"
          style={{
            background: showForm ? `${G}15` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showForm ? `${G}40` : 'rgba(255,255,255,0.1)'}`,
            color: showForm ? G : 'rgba(255,255,255,0.4)',
          }}
        >
          <Plus className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase" style={T}>New Invite</span>
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2.5 rounded-lg" style={{ background: `${G}06`, border: `1px solid ${G}20` }}>
              {/* Label */}
              <div>
                <p className="text-[10px] text-white/30 uppercase mb-1 font-bold" style={T}>Label (optional)</p>
                <input
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Guest Speaker, Co-Host"
                  className="w-full px-2.5 py-1.5 rounded bg-black/40 border border-white/10 text-[11px] text-white placeholder-white/25 outline-none focus:border-[#d4af37]/40"
                />
              </div>
              {/* Role */}
              <div>
                <p className="text-[10px] text-white/30 uppercase mb-1 font-bold" style={T}>Role</p>
                <div className="flex gap-1">
                  {ROLES.map(r => (
                    <button key={r} onClick={() => setRole(r)}
                      className="flex-1 py-1 rounded text-[10px] font-black uppercase transition-all"
                      style={{
                        background: role === r ? `${G}20` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${role === r ? `${G}50` : 'rgba(255,255,255,0.08)'}`,
                        color: role === r ? G : 'rgba(255,255,255,0.35)',
                        ...T,
                      }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              {/* Expiry */}
              <div>
                <p className="text-[10px] text-white/30 uppercase mb-1 font-bold" style={T}>Expires</p>
                <div className="flex gap-1 flex-wrap">
                  {EXPIRY_OPTIONS.map((opt, i) => (
                    <button key={opt.label} onClick={() => setExpiryIdx(i)}
                      className="px-2 py-1 rounded text-[10px] font-bold transition-all"
                      style={{
                        background: expiryIdx === i ? `${G}20` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${expiryIdx === i ? `${G}40` : 'rgba(255,255,255,0.07)'}`,
                        color: expiryIdx === i ? G : 'rgba(255,255,255,0.35)',
                        ...T,
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={createInvite}
                className="w-full py-2 rounded text-[12px] font-black uppercase transition-all"
                style={{ background: G, color: '#000', ...T }}
              >
                Generate Invite Link
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite list */}
      {localInvites.length === 0 && !showForm ? (
        <div className="py-5 text-center">
          <QrCode className="w-7 h-7 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
          <p className="text-[11px] text-white/20" style={T}>No invite links yet</p>
          <p className="text-[10px] text-white/12 mt-0.5">Generate QR codes for guests to join</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-1.5">
            {localInvites.map(inv => (
              <InviteCard
                key={inv.id}
                invite={inv}
                onRevoke={revokeInvite}
                origin={origin}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
