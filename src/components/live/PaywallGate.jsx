import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, DollarSign, Crown, Eye } from 'lucide-react';
import { toast } from 'sonner';

const TIERS = [
  { label: 'Free Preview', price: 0, icon: '👁️', desc: 'Watch for free (limited)' },
  { label: 'Basic Access', price: 2.99, icon: '🔓', desc: 'Full stream access' },
  { label: 'VIP Access', price: 9.99, icon: '👑', desc: 'Stream + private chat + replay' },
  { label: 'Backstage', price: 24.99, icon: '⭐', desc: 'All access + 1-on-1 time' },
];

export default function PaywallGate({ isHost, streamTitle, onUnlock, isUnlocked }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [customPrice, setCustomPrice] = useState('');
  const [hostPaywallEnabled, setHostPaywallEnabled] = useState(false);
  const [hostTiers, setHostTiers] = useState(TIERS);

  if (isHost) {
    return (
      <div className="bg-[rgba(13,6,24,0.9)] border border-[#d4af37]/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#d4af37]" />
            <span className="text-sm font-semibold text-white">Paywall Settings</span>
          </div>
          <button
            onClick={() => { setHostPaywallEnabled(!hostPaywallEnabled); toast.success(hostPaywallEnabled ? 'Paywall off' : 'Paywall enabled!'); }}
            className={`w-10 h-5 rounded-full transition-all relative ${hostPaywallEnabled ? 'bg-[#d4af37]' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hostPaywallEnabled ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>

        {hostPaywallEnabled && (
          <div className="space-y-2">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Access Tiers</p>
            {hostTiers.map((tier, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                <span>{tier.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{tier.label}</p>
                  <p className="text-[10px] text-white/40">{tier.desc}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#d4af37] font-mono">${tier.price}</span>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <Input
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                placeholder="Custom price $"
                className="h-7 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/20"
              />
              <Button size="sm" className="h-7 text-xs bg-[#d4af37] text-black hover:bg-[#f5e6a3]">
                Add Tier
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Viewer side
  if (isUnlocked) {
    return (
      <div className="flex items-center gap-2 bg-green-900/30 border border-green-700/30 rounded-lg px-3 py-2">
        <Unlock className="w-4 h-4 text-green-400" />
        <span className="text-xs text-green-400 font-semibold">Full access unlocked</span>
      </div>
    );
  }

  return (
    <div className="bg-[rgba(13,6,24,0.97)] border border-[#d4af37]/30 rounded-xl p-5 space-y-4 text-center">
      <div className="w-14 h-14 rounded-full bg-[#d4af37]/10 flex items-center justify-center mx-auto">
        <Crown className="w-7 h-7 text-[#d4af37]" />
      </div>
      <div>
        <h3 className="text-white font-bold text-base">{streamTitle || 'Premium Live'}</h3>
        <p className="text-white/40 text-xs mt-1">This stream requires access — choose your tier below</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-left">
        {TIERS.map((tier, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedTier(tier)}
            className={`p-3 rounded-xl border transition-all ${
              selectedTier?.label === tier.label
                ? 'border-[#d4af37] bg-[#d4af37]/10'
                : 'border-white/10 hover:border-[#d4af37]/40 bg-white/5'
            }`}
          >
            <div className="text-xl mb-1">{tier.icon}</div>
            <p className="text-xs font-bold text-white">{tier.label}</p>
            <p className="text-[10px] text-white/40">{tier.desc}</p>
            <p className="text-sm font-bold text-[#d4af37] mt-1">
              {tier.price === 0 ? 'FREE' : `$${tier.price}`}
            </p>
          </button>
        ))}
      </div>

      {selectedTier && (
        <Button
          className="w-full bg-[#d4af37] text-black hover:bg-[#f5e6a3] font-bold"
          onClick={() => {
            if (selectedTier.price === 0) {
              onUnlock?.();
              toast.success('Enjoy the preview!');
            } else {
              toast.info(`Redirecting to payment for $${selectedTier.price}...`);
              onUnlock?.();
            }
          }}
        >
          <DollarSign className="w-4 h-4 mr-1" />
          {selectedTier.price === 0 ? 'Watch Free Preview' : `Unlock for $${selectedTier.price}`}
        </Button>
      )}
    </div>
  );
}