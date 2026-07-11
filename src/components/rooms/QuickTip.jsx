import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { DollarSign, Heart, Sparkles, Gift } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function QuickTip({ recipientId, recipientName, onTipSent }) {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const queryClient = useQueryClient();

  const quickAmounts = [1, 5, 10, 25, 50, 100];

  const tipMutation = useMutation({
    mutationFn: async (amount) => {
      // Create transaction
      const transaction = await base44.entities.Transaction.create({
        from_user_id: (await base44.auth.me()).id,
        to_user_id: recipientId,
        type: 'tip',
        amount: amount,
        status: 'completed',
        description: `Tip to ${recipientName}`,
      });

      // Update loyalty points
      const loyaltyRecords = await base44.entities.ViewerLoyalty.filter({
        user_id: transaction.from_user_id,
        creator_id: recipientId,
      });

      const pointsEarned = Math.floor(amount * 10); // 10 points per dollar

      if (loyaltyRecords.length > 0) {
        const current = loyaltyRecords[0];
        await base44.entities.ViewerLoyalty.update(current.id, {
          loyalty_points: (current.loyalty_points || 0) + pointsEarned,
          total_tips_sent: (current.total_tips_sent || 0) + amount,
          last_active: new Date().toISOString(),
        });
      } else {
        await base44.entities.ViewerLoyalty.create({
          user_id: transaction.from_user_id,
          creator_id: recipientId,
          loyalty_points: pointsEarned,
          total_tips_sent: amount,
          last_active: new Date().toISOString(),
        });
      }

      // Notify recipient
      const me = await base44.auth.me();
      await base44.entities.Notification.create({
        user_id: recipientId,
        type: 'tip',
        title: `💰 New tip from ${me.full_name || me.email}!`,
        message: `You received a $${transaction.amount} tip! +${pointsEarned} loyalty points earned for the tipper.`,
        sender_id: me.id,
      });

      return { transaction, pointsEarned };
    },
    onSuccess: ({ transaction, pointsEarned }) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty'] });
      
      // Confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success(`Tipped $${transaction.amount}! +${pointsEarned} loyalty points 🎉`);
      setSelectedAmount(null);
      onTipSent?.();
    },
  });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {quickAmounts.map((amount) => (
        <Button
          key={amount}
          size="sm"
          variant={selectedAmount === amount ? "default" : "outline"}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(10);
            setSelectedAmount(amount);
            tipMutation.mutate(amount);
          }}
          disabled={tipMutation.isPending}
          className="flex items-center gap-1"
        >
          <DollarSign className="w-3 h-3" />
          {amount}
        </Button>
      ))}
    </div>
  );
}