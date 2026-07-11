import React, { useState } from 'react';
import { ExternalLink, DollarSign, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const PAYMENT_PLATFORMS = [
  { id: 'paypal', name: 'PayPal', emoji: '🅿️', color: 'from-blue-600 to-blue-700', baseUrl: 'https://paypal.me/', placeholder: 'your-username' },
  { id: 'cashapp', name: 'Cash App', emoji: '💚', color: 'from-green-500 to-green-600', baseUrl: 'https://cash.app/$', placeholder: 'YourCashtag' },
  { id: 'venmo', name: 'Venmo', emoji: '💙', color: 'from-sky-500 to-blue-600', baseUrl: 'https://venmo.com/', placeholder: 'your-username' },
  { id: 'zelle', name: 'Zelle', emoji: '💜', color: 'from-purple-600 to-violet-700', baseUrl: null, placeholder: 'phone or email' },
  { id: 'chime', name: 'Chime', emoji: '🟢', color: 'from-emerald-500 to-teal-600', baseUrl: 'https://chime.com/', placeholder: 'your-tag' },
  { id: 'applepay', name: 'Apple Pay', emoji: '🍎', color: 'from-gray-700 to-gray-900', baseUrl: null, placeholder: 'phone or email' },
  { id: 'googlepay', name: 'Google Pay', emoji: '🔵', color: 'from-blue-500 to-indigo-600', baseUrl: null, placeholder: 'phone or email' },
  { id: 'custom', name: 'Custom Link', emoji: '🔗', color: 'from-amber-500 to-orange-600', baseUrl: '', placeholder: 'https://...' },
];

export default function DirectPayments({ isOpen, onClose, creatorName }) {
  const [links, setLinks] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState({});

  const handleSave = async () => {
    try {
      await base44.auth.updateMe({ payment_links: links });
      setSaved(links);
      setEditMode(false);
      toast.success('Payment links saved!');
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleOpen = (platform) => {
    const val = links[platform.id] || saved[platform.id];
    if (!val) return;
    let url = val;
    if (platform.baseUrl && !val.startsWith('http')) {
      url = platform.baseUrl + val;
    }
    if (!url.startsWith('http')) {
      toast.info(`Send to: ${val}`);
      navigator.clipboard.writeText(val);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const activeLinks = PAYMENT_PLATFORMS.filter(p => links[p.id] || saved[p.id]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={onClose} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 448, width: '100%', maxHeight: '85vh', overflowY: 'auto', background: '#0d0618', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, padding: 24, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d4af37' }}>
            <DollarSign className="w-5 h-5" />
            <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Barlow Condensed, sans-serif' }}>Support {creatorName || 'Creator'} Directly</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}><X className="w-4 h-4" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            Send money directly — no platform cut, no gift tokens. Just real payments.
          </p>

          {!editMode ? (
            <>
              {activeLinks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <DollarSign className="w-10 h-10" style={{ margin: '0 auto 12px', color: 'rgba(255,255,255,0.2)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No payment links configured yet</p>
                  <button
                    onClick={() => setEditMode(true)}
                    style={{ marginTop: 12, padding: '6px 14px', fontSize: 12, background: '#d4af37', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add My Links
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {activeLinks.map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => handleOpen(platform)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, background: `linear-gradient(to right, var(--c1), var(--c2))`, opacity: 1, cursor: 'pointer', border: 'none', textAlign: 'left' }}
                      className={`bg-gradient-to-r ${platform.color} hover:opacity-90 transition-all`}
                    >
                      <span style={{ fontSize: 20 }}>{platform.emoji}</span>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{platform.name}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 2 }}>
                          Send <ExternalLink className="w-2.5 h-2.5" style={{ marginLeft: 2 }} />
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setEditMode(true)}
                style={{ width: '100%', fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0', fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                ✏️ Edit My Payment Links
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Configure Your Links</p>
              {PAYMENT_PLATFORMS.map(platform => (
                <div key={platform.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, width: 28 }}>{platform.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{platform.name}</p>
                    <input
                      value={links[platform.id] || ''}
                      onChange={e => setLinks(prev => ({ ...prev, [platform.id]: e.target.value }))}
                      placeholder={platform.placeholder}
                      style={{ width: '100%', padding: '5px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' }}
                    />
                  </div>
                  {links[platform.id] && (
                    <button onClick={() => setLinks(prev => { const n = {...prev}; delete n[platform.id]; return n; })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0392B', display: 'flex', alignItems: 'center' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
                <button
                  onClick={handleSave}
                  style={{ flex: 1, padding: '8px 0', background: '#d4af37', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13 }}
                >
                  Save Links
                </button>
                <button onClick={() => setEditMode(false)} style={{ padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              💯 100% goes directly to the creator — no platform fees
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}