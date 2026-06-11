import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Mail, Copy, Check, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const inp = { width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };
const lbl = { display: 'block', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14 };

const BETA_REFERRAL_BASE = `${window.location.origin}/Welcome`;

export default function InviteUsersPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [invitedList, setInvitedList] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin';
  const referralLink = `${BETA_REFERRAL_BASE}?ref=${user?.id}`;

  const handleInvite = async () => {
    if (!email.trim() || !email.includes('@')) { toast.error('Please enter a valid email address'); return; }
    setInviting(true);
    try {
      await base44.users.inviteUser(email.trim(), isAdmin ? role : 'user');
      setInvitedList(prev => [...prev, { email: email.trim(), role: isAdmin ? role : 'user', sentAt: new Date() }]);
      toast.success(`Invite sent to ${email.trim()}!`);
      setEmail('');
    } catch {
      toast.error('Failed to send invite. They may already be registered.');
    }
    setInviting(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    toast.success('Beta invite link copied!');
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <UserPlus className="w-5 h-5" style={{ color: GOLD }} />
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>Invite to Beta</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Invite users to join SeeWhy LIVE beta testing</p>
          </div>
        </div>
        <span className="text-[11px] font-black px-3 py-1 rounded-full uppercase"
          style={{ ...T, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: GOLD }}>
          BETA
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Invited This Session', value: invitedList.length, color: GOLD },
            { label: 'Slots Available', value: '∞', color: '#6DBF7E' },
            { label: 'Beta Access', value: 'Free', color: '#D4AF37' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
              <p className="text-2xl font-black" style={{ fontFamily: 'Orbitron, monospace', color }}>{value}</p>
              <p className="text-[10px] font-black uppercase mt-1" style={{ ...T, color: 'rgba(255,255,255,0.35)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Invite by email */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4" style={{ color: GOLD }} />
            <p className="font-black text-sm text-white" style={T}>Invite by Email</p>
          </div>
          <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Send a direct invite — they'll receive an email with login instructions
          </p>
          <label style={lbl}>Email Address</label>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              style={{ ...inp, flex: 1 }}
            />
            {isAdmin && (
              <div style={{ display: 'flex', gap: 4 }}>
                {['user', 'admin'].map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: `1px solid ${role === r ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: role === r ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: role === r ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, textTransform: 'capitalize' }}>
                    {r}
                  </button>
                ))}
              </div>
            )}
            <button onClick={handleInvite} disabled={inviting}
              className="px-4 py-2 rounded-lg font-black uppercase text-xs"
              style={{ ...T, background: inviting ? 'rgba(128,0,32,0.3)' : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: inviting ? 'rgba(255,255,255,0.3)' : '#000', cursor: inviting ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
              {inviting ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
          {!isAdmin && (
            <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Shield className="w-3 h-3" />
              Only admins can invite with admin role. Your invites will be standard users.
            </p>
          )}
        </div>

        {/* Share beta link */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Copy className="w-4 h-4" style={{ color: GOLD }} />
            <p className="font-black text-sm text-white" style={T}>Share Beta Invite Link</p>
          </div>
          <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Anyone with this link can join the beta</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={referralLink}
              style={{ ...inp, flex: 1, fontSize: 11, color: '#D4AF37', fontFamily: 'monospace' }}
            />
            <button onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-black uppercase text-xs"
              style={{ ...T, background: copiedLink ? 'rgba(109,191,126,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copiedLink ? 'rgba(109,191,126,0.3)' : 'rgba(255,255,255,0.12)'}`, color: copiedLink ? '#6DBF7E' : 'rgba(255,255,255,0.5)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {copiedLink ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
        </div>

        {/* Invited this session */}
        {invitedList.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4" style={{ color: GOLD }} />
              <p className="font-black text-sm text-white" style={T}>Invited This Session ({invitedList.length})</p>
            </div>
            <div className="space-y-2">
              {invitedList.map((inv, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(109,191,126,0.06)', border: '1px solid rgba(109,191,126,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" style={{ color: '#6DBF7E' }} />
                    <span className="text-sm font-black text-white" style={T}>{inv.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase capitalize"
                      style={{ ...T, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }}>
                      {inv.role}
                    </span>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {inv.sentAt.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Beta info */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="flex gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <p className="font-black text-sm text-white mb-1" style={T}>SeeWhy LIVE — Beta Testing</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                We're in active beta. All features are functional and multi-user ready.
                Please report any bugs via the platform or to your admin.
                The 90/10 revenue split is locked in for all beta testers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
