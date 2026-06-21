import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { UserPlus, Copy, Check, Link2, Mic, Video } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const FONT = 'Barlow Condensed, sans-serif';

const ROLES = [
  { id: 'guest', label: 'Guest Speaker' },
  { id: 'cohost', label: 'Co-Host' },
  { id: 'viewer', label: 'Viewer Only' },
];

export default function GuestInviteGeneratorV49({ roomId, isHost }) {
  const [guestName, setGuestName] = useState('');
  const [role, setRole] = useState('guest');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const token = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      await base44.entities.GuestInvite.create({
        room_id: roomId,
        guest_name: guestName.trim() || 'Guest',
        role: role,
        token: token,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }).catch(() => {});
      return token;
    },
    onSuccess: (token) => {
      const link = window.location.origin + '/guest-join?room=' + roomId + '&token=' + token + '&name=' + encodeURIComponent(guestName.trim() || 'Guest') + '&role=' + role;
      setGeneratedLink(link);
      toast.success('Invite link generated!');
    },
    onError: () => toast.error('Could not generate invite'),
  });

  function copyLink() {
    navigator.clipboard.writeText(generatedLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied!');
    }).catch(() => toast.error('Copy failed.'));
  }

  if (!isHost) return null;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${CRIMSON}44`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <UserPlus size={16} color={GOLD} />
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: GOLD, letterSpacing: 1 }}>INVITE GUEST</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          placeholder="Guest name (optional)"
          value={guestName}
          onChange={e => setGuestName(e.target.value)}
          style={{
            padding: '10px 12px', borderRadius: 8,
            background: 'rgba(0,0,0,0.3)', border: `1px solid ${CRIMSON}33`,
            color: '#fff', fontFamily: FONT, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', gap: 6 }}>
          {ROLES.map(r => (
            <button key={r.id} onClick={() => setRole(r.id)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${role === r.id ? GOLD + '66' : 'rgba(255,255,255,0.08)'}`,
                background: role === r.id ? GOLD + '15' : 'transparent', cursor: 'pointer',
                color: role === r.id ? GOLD : 'rgba(255,255,255,0.4)',
                fontFamily: FONT, fontWeight: 700, fontSize: 11, minHeight: 44,
              }}>
              {r.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => inviteMutation.mutate()}
          disabled={inviteMutation.isPending}
          style={{
            padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', minHeight: 44,
            background: `linear-gradient(to right, ${CRIMSON}, ${GOLD})`,
            color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 14,
            opacity: inviteMutation.isPending ? 0.6 : 1,
          }}
        >
          {inviteMutation.isPending ? 'Generating…' : <><Link2 size={14} style={{ display: 'inline', marginRight: 6 }} />Generate Invite Link</>}
        </button>

        {generatedLink && (
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(212,175,55,0.08)', border: `1px solid ${GOLD}33` }}>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.6)', wordBreak: 'break-all', marginBottom: 8 }}>
              {generatedLink}
            </p>
            <button onClick={copyLink}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 6, border: `1px solid ${GOLD}44`,
                background: 'transparent', cursor: 'pointer', minHeight: 44,
                color: copied ? '#4ade80' : GOLD, fontFamily: FONT, fontWeight: 700, fontSize: 12,
              }}>
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
