import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Heart, Gift } from 'lucide-react';
import { toast } from 'sonner';

function haptic(ms) { if (navigator.vibrate) navigator.vibrate(ms || 10); }

const G = '#D4AF37';
const PANEL = '#0F0B1A';
const BORDER = 'rgba(212,175,55,0.18)';

const TIP_AMOUNTS = [5, 10, 50, 100];

export default function PKBattleVotePanel({ battleId, creatorId, challengerId, creatorName, challengerName }) {
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContribute = async (userId, amount) => {
    if (!selectedCreator) {
      toast.error('Select a creator to support');
      return;
    }

    setLoading(true);
    try {
      await base44.entities.PKBattle.update(battleId, {
        ...(userId === creatorId && {
          creator_tips: ((await base44.entities.PKBattle.get(battleId)).creator_tips || 0) + amount,
        }),
        ...(userId === challengerId && {
          challenger_tips: ((await base44.entities.PKBattle.get(battleId)).challenger_tips || 0) + amount,
        }),
      });

      toast.success(`+$${amount} contributed!`);
      setSelectedAmount(null);
    } catch (error) {
      toast.error('Failed to contribute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-4 space-y-4"
      style={{ background: PANEL, border: `1px solid ${BORDER}` }}
    >
      <h3 className="text-sm font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
        <Heart className="w-4 h-4 inline mr-2" style={{ color: '#C0392B' }} />
        Support Your Creator
      </h3>

      {/* Creator selection */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: creatorId, name: creatorName, color: '#C0392B' },
          { id: challengerId, name: challengerName, color: '#D4AF37' },
        ].map((creator) => (
          <motion.button
            key={creator.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { haptic(); setSelectedCreator(creator.id); }}
            className="rounded-lg transition-all text-center flex items-center justify-center"
            style={{
              minHeight: 44,
              background: selectedCreator === creator.id ? `${creator.color}20` : 'rgba(255,255,255,0.03)',
              border: selectedCreator === creator.id ? `1px solid ${creator.color}` : `1px solid ${BORDER}`,
              color: selectedCreator === creator.id ? creator.color : 'rgba(255,255,255,0.5)',
            }}
          >
            <p className="text-xs font-black">{creator.name}</p>
          </motion.button>
        ))}
      </div>

      {/* Tip amounts */}
      <div>
        <p className="text-[10px] text-white/50 mb-2 font-bold">Select Amount</p>
        <div className="grid grid-cols-4 gap-1">
          {TIP_AMOUNTS.map((amount) => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { haptic(); setSelectedAmount(amount); }}
              disabled={!selectedCreator || loading}
              className="rounded text-xs font-black transition-all disabled:opacity-40 flex items-center justify-center"
              style={{
                minHeight: 44,
                background: selectedAmount === amount ? G : 'rgba(255,255,255,0.08)',
                color: selectedAmount === amount ? '#000' : '#fff',
              }}
            >
              ${amount}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Action button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => { haptic(15); selectedAmount && handleContribute(selectedCreator, selectedAmount); }}
        disabled={!selectedCreator || !selectedAmount || loading}
        style={{
          width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 4, fontSize: 13, fontWeight: 900, borderRadius: 8, cursor: 'pointer',
          fontFamily: 'Barlow Condensed, sans-serif',
          background: G, color: '#000', border: 'none', opacity: (!selectedCreator || !selectedAmount || loading) ? 0.5 : 1,
        }}
      >
        <Gift className="w-3.5 h-3.5" />
        {loading ? 'Processing...' : 'Send Support'}
      </motion.button>

      <p className="text-[10px] text-white/40 text-center">
        Every contribution helps them win the battle!
      </p>
    </motion.div>
  );
}
