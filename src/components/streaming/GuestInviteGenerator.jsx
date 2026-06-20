import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Link2, Copy, X, Plus, QrCode, CheckCircle, Clock, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function genToken() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

function InviteCard({ invite, onRevoke }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const isExpired = invite.expires_at && new Date(invite.expires_at) < new Date();

  const copy = () => {
    navigator.clipboard.writeText(invite.invite_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg p-2.5 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${isExpired ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(109,191,126,0.15)' }}>
            <Users className="w-3 h-3" style={{ color: isExpired ? '#f87171' : '#6DBF7E' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-white truncate">{invite.label || `Guest ${invite.token?.slice(0, 6)}`}</p>
            <div className="flex items-center gap-1.5">
              {isExpired
                ? <span className="text-[9px] text-red-400">Expired</span>
                : <span className="text-[9px] text-[#6DBF7E]">Active</span>}
              {invite.expires_at && (
                <span className="text-[9px] text-white/20">
                  · {isExpired ? 'expired' : 'expires'} {new Date(invite.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setShowQR(q => !q)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
            title="Show QR">
            <QrCode className="w-3 h-3 text-white/40" />
          </button>
          <button onClick={copy}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
            {copied ? <CheckCircle className="w-3 h-3 text-[#6DBF7E]" /> : <Copy className="w-3 h-3 text-white/40" />}
          </button>
          <button onClick={() => onRevoke(invite.id)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3 h-3 text-red-400/60" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showQR && !isExpired && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex justify-center pt-1">
            <div className="p-2 rounded-lg bg-white">
              <QRCodeSVG value={invite.invite_url} size={120} level="M" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-[9px] text-white/20 truncate px-0.5">{invite.invite_url}</div>
    </div>
  );
}

export default function GuestInviteGenerator({ userId, roomId, streamId }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState('');
  const [expireHours, setExpireHours] = useState(24);

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/guest-join` : '';

  const { data: invites = [] } = useQuery({
    queryKey: ['guest-invites', roomId || streamId],
    queryFn: () => base44.entities.Activity.filter({ user_id: userId, type: 'guest_invite' }),
    enabled: !!userId,
    select: (rows) => rows
      .filter(r => (r.description?.includes(roomId || '') || r.description?.includes(streamId || '')))
      .map(r => {
        try { return { ...JSON.parse(r.description || '{}'), id: r.id }; } catch { return null; }
      })
      .filter(Boolean),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = genToken();
      const expiresAt = new Date(Date.now() + expireHours * 3600 * 1000).toISOString();
      const params = new URLSearchParams({ token, room: roomId || '', stream: streamId || '' });
      const inviteUrl = `${baseUrl}?${params}`;
      const payload = { token, label: label || 'Guest', invite_url: inviteUrl, expires_at: expiresAt, room_id: roomId, stream_id: streamId };

      await base44.entities.Activity.create({
        user_id: userId,
        type: 'guest_invite',
        title: `Guest invite: ${label || 'Guest'}`,
        description: JSON.stringify(payload),
        is_public: false,
      });

      navigator.clipboard.writeText(inviteUrl).catch(() => {});
      toast.success('Invite link created & copied!');
      qc.invalidateQueries(['guest-invites', roomId || streamId]);
      setLabel('');
      setCreating(false);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (inviteId) => base44.entities.Activity.delete(inviteId),
    onSuccess: () => {
      qc.invalidateQueries(['guest-invites', roomId || streamId]);
      toast.success('Invite revoked');
    },
  });

  const activeInvites = invites.filter(i => !i.expires_at || new Date(i.expires_at) > new Date());
  const expiredInvites = invites.filter(i => i.expires_at && new Date(i.expires_at) <= new Date());

  return (
    <div className="rounded-xl border" style={{ background: 'rgba(8,11,24,0.95)', borderColor: 'rgba(212,175,55,0.15)' }}>
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5" style={{ color: GOLD }} />
          <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: GOLD, ...T }}>Guest Invites</span>
          {activeInvites.length > 0 && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#6DBF7E]/20 text-[#6DBF7E] border border-[#6DBF7E]/30">
              {activeInvites.length} active
            </span>
          )}
        </div>
        <button
          onClick={() => setCreating(c => !c)}
          style={{ ...T, height: 24, padding: '0 8px', fontSize: 10, fontWeight: 900, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: creating ? 'rgba(255,255,255,0.05)' : `rgba(212,175,55,0.15)`, color: creating ? 'rgba(255,255,255,0.4)' : GOLD }}
        >
          {creating ? <X className="w-3 h-3 inline" /> : <><Plus className="w-3 h-3 inline mr-1" />New</>}
        </button>
      </div>

      <div className="p-3 space-y-3">
        <AnimatePresence>
          {creating && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="rounded-lg p-3 space-y-2.5" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Guest name or role (optional)"
                style={{ width: '100%', padding: '7px 10px', background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box', ...T }}
              />
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-white/40 flex-shrink-0" style={T}>Expires in:</label>
                <select
                  value={expireHours}
                  onChange={e => setExpireHours(Number(e.target.value))}
                  style={{ flex: 1, padding: '5px 8px', background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', ...T }}
                >
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>7 days</option>
                </select>
              </div>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                style={{ ...T, width: '100%', height: 30, fontSize: 12, fontWeight: 900, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${GOLD}, #b8962e)`, color: '#000', opacity: createMutation.isPending ? 0.6 : 1 }}
              >
                <Link2 className="w-3 h-3 inline mr-1.5" />Generate & Copy Link
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {invites.length === 0 && !creating && (
          <div className="text-center py-4">
            <Users className="w-5 h-5 text-white/20 mx-auto mb-1" />
            <p className="text-[10px] text-white/30">No guest invites yet</p>
            <p className="text-[10px] text-white/20">Create a link to invite guests to your stream</p>
          </div>
        )}

        {activeInvites.length > 0 && (
          <div className="space-y-1.5">
            {activeInvites.map(invite => (
              <InviteCard key={invite.id} invite={invite} onRevoke={(id) => revokeMutation.mutate(id)} />
            ))}
          </div>
        )}

        {expiredInvites.length > 0 && (
          <details className="group">
            <summary className="text-[9px] text-white/20 cursor-pointer select-none hover:text-white/40 transition-colors" style={T}>
              {expiredInvites.length} expired invite{expiredInvites.length !== 1 ? 's' : ''}
            </summary>
            <div className="mt-1.5 space-y-1 opacity-50">
              {expiredInvites.map(invite => (
                <InviteCard key={invite.id} invite={invite} onRevoke={(id) => revokeMutation.mutate(id)} />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
