import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, DollarSign, Plus, Trash2 } from 'lucide-react';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#0d0618] border-[#d4af37]/20 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#d4af37] flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Support {creatorName || 'Creator'} Directly
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-white/50">
            Send money directly — no platform cut, no gift tokens. Just real payments.
          </p>

          {!editMode ? (
            <>
              {activeLinks.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-10 h-10 mx-auto text-white/20 mb-3" />
                  <p className="text-white/40 text-sm">No payment links configured yet</p>
                  <Button
                    size="sm"
                    onClick={() => setEditMode(true)}
                    className="mt-3 bg-[#d4af37] text-black hover:bg-[#f5e6a3]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add My Links
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {activeLinks.map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => handleOpen(platform)}
                      className={`flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r ${platform.color} hover:opacity-90 transition-all text-left`}
                    >
                      <span className="text-xl">{platform.emoji}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{platform.name}</p>
                        <p className="text-[9px] text-white/70 flex items-center gap-0.5">
                          Send <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditMode(true)}
                className="w-full text-xs text-white/40 hover:text-white"
              >
                ✏️ Edit My Payment Links
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">Configure Your Links</p>
              {PAYMENT_PLATFORMS.map(platform => (
                <div key={platform.id} className="flex items-center gap-2">
                  <span className="text-lg w-7">{platform.emoji}</span>
                  <div className="flex-1">
                    <p className="text-[10px] text-white/60 mb-0.5">{platform.name}</p>
                    <Input
                      value={links[platform.id] || ''}
                      onChange={e => setLinks(prev => ({ ...prev, [platform.id]: e.target.value }))}
                      placeholder={platform.placeholder}
                      className="h-7 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    />
                  </div>
                  {links[platform.id] && (
                    <button onClick={() => setLinks(prev => { const n = {...prev}; delete n[platform.id]; return n; })}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="flex-1 bg-[#d4af37] text-black hover:bg-[#f5e6a3]"
                >
                  Save Links
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditMode(false)} className="text-white/40">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="border-t border-white/5 pt-3">
            <p className="text-[10px] text-white/30 text-center">
              💯 100% goes directly to the creator — no platform fees
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}