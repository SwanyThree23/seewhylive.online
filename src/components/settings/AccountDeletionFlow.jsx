import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Drawer } from 'vaul';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const DANGER = '#EF4444';

const REASONS = [
  'I no longer use this service',
  'Privacy concerns',
  'Found a better platform',
  'Too many notifications',
  'Other reason',
];

const OUTCOMES = [
  'Your profile details and personal data are cleared right away.',
  'You are signed out immediately and lose access.',
  'Your account and remaining content are queued for permanent removal.',
];

/**
 * Account deletion flow — trigger button plus a two-step confirmation sheet.
 * Used from the Profile settings tab and the Settings page.
 */
export default function AccountDeletionFlow({ user }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  function close() {
    setOpen(false);
    setStep(1);
    setReason('');
    setConfirmText('');
  }

  async function handleDelete() {
    if (confirmText !== 'DELETE' || !user?.id) return;
    setIsDeleting(true);
    try {
      await base44.entities.DeletionRequest.create({
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
        reason,
        status: 'pending',
        requested_at: new Date().toISOString(),
      });
      // The request is recorded, so a failure to clear the profile fields
      // must not block the user from leaving.
      try {
        await base44.auth.updateMe({ bio: '', avatar_url: '' });
      } catch {
        /* profile fields left as-is; the deletion request still stands */
      }
      toast.success('Deletion request submitted. Signing you out…');
      await base44.auth.logout('/');
    } catch {
      toast.error('Could not submit your request. Please try again.');
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full px-4 py-2.5 rounded-xl font-black uppercase text-[11px] text-left flex items-center gap-2"
        style={{
          background: 'rgba(192,57,43,0.04)',
          border: '1px solid rgba(192,57,43,0.12)',
          color: 'rgba(192,57,43,0.6)',
          userSelect: 'none',
          ...T,
        }}>
        <Trash2 className="w-3.5 h-3.5" />
        Delete My Account
      </button>

      <Drawer.Root open={open} onOpenChange={(o) => { if (!o) close(); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[200]" style={{ background: 'rgba(0,0,0,0.75)' }} />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-[210] rounded-t-2xl"
            style={{ background: 'rgba(8,11,24,0.99)', border: '1px solid rgba(192,57,43,0.3)', paddingBottom: 40 }}>
            <Drawer.Handle className="mx-auto mt-3 mb-5 w-10 h-1 rounded-full bg-white/15" />

            <div className="px-5 text-center pb-3" style={{ borderBottom: '1px solid rgba(192,57,43,0.1)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.25)' }}>
                <Trash2 className="w-5 h-5" style={{ color: DANGER }} />
              </div>
              <p className="font-black text-lg text-white" style={T}>Delete Account?</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                Removing your account is permanent and cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                {[1, 2].map(s => (
                  <div key={s} className="rounded-full transition-all"
                    style={{ width: step >= s ? 20 : 8, height: 8, background: step >= s ? DANGER : 'rgba(192,57,43,0.2)' }} />
                ))}
              </div>
            </div>

            {step === 1 && (
              <div className="p-5 space-y-3">
                <div className="rounded-xl p-3 space-y-1.5"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <p className="text-[10px] font-black uppercase" style={{ color: 'rgba(239,68,68,0.7)', ...T }}>
                    What happens next
                  </p>
                  {OUTCOMES.map(line => (
                    <p key={line} className="text-xs flex gap-2" style={{ color: 'rgba(255,255,255,0.55)', ...T }}>
                      <span style={{ color: DANGER }}>•</span>
                      <span>{line}</span>
                    </p>
                  ))}
                  <p className="text-[10px] pt-1" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
                    Want a copy first? Download your data before continuing.
                  </p>
                </div>

                <p className="text-[10px] font-black uppercase text-center" style={{ color: 'rgba(239,68,68,0.7)', ...T }}>
                  Why are you leaving? (required)
                </p>
                <div className="space-y-2">
                  {REASONS.map(r => (
                    <button key={r} onClick={() => setReason(r)}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all"
                      style={{
                        background: reason === r ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${reason === r ? DANGER : 'rgba(255,255,255,0.08)'}`,
                        color: reason === r ? DANGER : 'rgba(255,255,255,0.55)',
                        userSelect: 'none',
                        ...T,
                      }}>
                      {reason === r ? '● ' : '○ '}{r}
                    </button>
                  ))}
                </div>

                <button onClick={() => setStep(2)} disabled={!reason}
                  className="w-full py-3 rounded-xl font-black uppercase text-sm transition-all"
                  style={{
                    background: reason ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.06)',
                    color: reason ? DANGER : 'rgba(239,68,68,0.3)',
                    userSelect: 'none',
                    ...T,
                  }}>
                  Continue →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="p-5 space-y-3">
                <div className="px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Reason</p>
                  <p className="text-xs font-black" style={{ color: DANGER, ...T }}>{reason}</p>
                  {user?.email && (
                    <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                      Account: {user.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase mb-1.5 text-center"
                    style={{ color: 'rgba(239,68,68,0.7)', ...T }}>
                    Type DELETE to confirm
                  </label>
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="DELETE"
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-center outline-none font-black"
                    style={{
                      background: 'rgba(239,68,68,0.06)',
                      border: `1px solid ${confirmText === 'DELETE' ? DANGER : 'rgba(239,68,68,0.2)'}`,
                      color: DANGER,
                      fontFamily: 'Barlow Condensed, sans-serif',
                      letterSpacing: '0.1em',
                    }} />
                </div>

                <button onClick={handleDelete} disabled={confirmText !== 'DELETE' || isDeleting}
                  className="w-full py-3 rounded-xl font-black uppercase text-sm transition-all"
                  style={{
                    background: confirmText === 'DELETE' ? DANGER : 'rgba(239,68,68,0.12)',
                    color: confirmText === 'DELETE' ? 'white' : 'rgba(239,68,68,0.4)',
                    userSelect: 'none',
                    ...T,
                  }}>
                  {isDeleting ? 'Deleting…' : 'Permanently Delete Account'}
                </button>
                <button onClick={() => { setStep(1); setConfirmText(''); }} disabled={isDeleting}
                  className="w-full py-2.5 rounded-xl font-black uppercase text-xs"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', userSelect: 'none', ...T }}>
                  ← Back
                </button>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}