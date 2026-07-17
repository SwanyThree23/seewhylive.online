// frontend/src/components/panel/PanelPrivacySettings.jsx
// Host-only panel privacy controls. Lets the host toggle public/private
// and choose a gating mode (invite_code or approval). On invite_code mode,
// the generated code is shown with a copy button to share with guests.
import { useState } from 'react';
import panelService from '../../services/panelService';

const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';
const SURFACE = '#1a1a1a';
const BORDER = '#2a2a2a';
const RED = '#dc2626';

export default function PanelPrivacySettings({ roomId }) {
  const [open, setOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [gatingMode, setGatingMode] = useState('invite_code');
  const [inviteCode, setInviteCode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      var result = await panelService.setRoomPrivacy(roomId, isPrivate, isPrivate ? gatingMode : null);
      if (result && result.invite_code) setInviteCode(result.invite_code);
      else setInviteCode(null);
    } catch (err) {
      console.error('[PanelPrivacySettings]', err);
    } finally {
      setSaving(false);
    }
  }

  function copyCode() {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode).catch(function() {});
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={function() { setOpen(function(v) { return !v; }); }}
        style={{
          background: 'transparent', border: '1px solid ' + BORDER,
          borderRadius: 6, padding: '5px 10px', fontSize: 11,
          color: isPrivate ? GOLD : '#888',
          fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
        title="Panel privacy settings"
      >
        {isPrivate ? '🔒' : '🌐'} {isPrivate ? 'Private' : 'Public'}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, zIndex: 300,
          marginTop: 4, background: SURFACE, border: '1px solid ' + BORDER,
          borderRadius: 10, padding: 16, width: 240,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          <div style={{ color: CREAM, fontSize: 12, fontWeight: 700, fontFamily: '"DM Sans", sans-serif', marginBottom: 12 }}>
            Panel Access
          </div>

          {/* Public / Private toggle */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[{ label: '🌐 Public', value: false }, { label: '🔒 Private', value: true }].map(function(opt) {
              return (
                <button
                  key={String(opt.value)}
                  onClick={function() { setIsPrivate(opt.value); }}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 6,
                    border: '1px solid ' + (isPrivate === opt.value ? GOLD : BORDER),
                    background: isPrivate === opt.value ? GOLD + '22' : 'transparent',
                    color: isPrivate === opt.value ? GOLD : '#888',
                    fontSize: 11, fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Gating mode selector */}
          {isPrivate && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: '#666', fontSize: 10, fontFamily: '"DM Sans", sans-serif', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Join method
              </div>
              {[
                { value: 'invite_code', label: '🔑 Invite code', desc: 'Share a code to enter' },
                { value: 'approval', label: '✋ Host approval', desc: 'You approve each request' },
              ].map(function(opt) {
                return (
                  <button
                    key={opt.value}
                    onClick={function() { setGatingMode(opt.value); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 4,
                      borderRadius: 6, border: '1px solid ' + (gatingMode === opt.value ? GOLD : BORDER),
                      background: gatingMode === opt.value ? GOLD + '15' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ color: gatingMode === opt.value ? GOLD : CREAM, fontSize: 11, fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ color: '#666', fontSize: 10, fontFamily: '"DM Sans", sans-serif' }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Invite code display */}
          {inviteCode && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: '#666', fontSize: 10, fontFamily: '"DM Sans", sans-serif', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Invite Code
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{
                  flex: 1, background: '#111', border: '1px solid ' + GOLD + '44',
                  borderRadius: 6, padding: '8px 12px', fontFamily: 'monospace',
                  fontSize: 16, color: GOLD, letterSpacing: 3, textAlign: 'center',
                }}>
                  {inviteCode}
                </div>
                <button
                  onClick={copyCode}
                  style={{
                    background: copied ? '#22c55e22' : BORDER, border: '1px solid ' + (copied ? '#22c55e' : BORDER),
                    borderRadius: 6, padding: '0 10px', cursor: 'pointer',
                    color: copied ? '#22c55e' : '#888', fontSize: 12,
                  }}
                >
                  {copied ? '✓' : '⎘'}
                </button>
              </div>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', background: saving ? '#333' : GOLD,
              color: saving ? '#888' : '#111', border: 'none',
              borderRadius: 6, padding: '10px 0', fontSize: 12, fontWeight: 700,
              fontFamily: '"DM Sans", sans-serif', cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Apply'}
          </button>

          <button
            onClick={function() { setOpen(false); }}
            style={{
              position: 'absolute', top: 8, right: 10,
              background: 'none', border: 'none', color: '#555',
              cursor: 'pointer', fontSize: 14,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
