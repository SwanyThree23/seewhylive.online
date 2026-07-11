import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Sparkles, Heart, PartyPopper, Laugh, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { hapticMedium } from '@/utils/haptics';

export default function AnimatedGiftShop({ recipientId, roomId, onClose }) {
  const [selectedGift, setSelectedGift] = useState(null);
  const [category, setCategory] = useState('all');
  const queryClient = useQueryClient();

  const { data: gifts = [] } = useQuery({
    queryKey: ['animated-gifts', category],
    queryFn: async () => {
      const filter = category === 'all' ? { is_active: true } : { is_active: true, category };
      return await base44.entities.AnimatedGift.filter(filter, 'price');
    },
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const sendGiftMutation = useMutation({
    mutationFn: async (gift) => {
      if (!user?.id) throw new Error('Not authenticated');
      // Create transaction
      await base44.entities.Transaction.create({
        type: 'virtual_good',
        amount: gift.price,
        from_user_id: user.id,
        to_user_id: recipientId,
        room_id: roomId,
        virtual_good_id: gift.id,
        message: `Sent ${gift.name}`,
      });

      // Update gift popularity
      await base44.entities.AnimatedGift.update(gift.id, {
        times_sent: gift.times_sent + 1,
      });
    },
    onError: () => toast.error('Gift failed to send. Please try again.'),
    onSuccess: (_, gift) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`Sent ${gift.name}! 🎁`);
      onClose?.();
    },
  });

  const categories = [
    { id: 'all', label: 'All Gifts', icon: Gift },
    { id: 'hearts', label: 'Hearts', icon: Heart },
    { id: 'celebration', label: 'Celebration', icon: PartyPopper },
    { id: 'appreciation', label: 'Appreciation', icon: Sparkles },
    { id: 'humor', label: 'Humor', icon: Laugh },
    { id: 'special', label: 'Special', icon: Crown },
  ];

  const rarityColors = {
    common: 'bg-gray-100 text-gray-800',
    rare: 'bg-blue-100 text-blue-800',
    epic: 'bg-[#7B5DA6] text-[#7B5DA6]',
    legendary: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Send an Animated Gift</h2>
        <p className="text-muted-foreground">
          Make someone's day with a special animated gift
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {categories.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={category === id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory(id)}
            className="shrink-0"
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {/* Gifts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-h-[400px] overflow-y-auto">
        {gifts.map((gift) => (
          <motion.div
            key={gift.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className={`cursor-pointer transition-all ${
                selectedGift?.id === gift.id
                  ? 'ring-2 ring-primary'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedGift(gift)}
            >
              <CardContent className="p-4 text-center">
                <div className="w-full h-24 mb-3 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {gift.animation_url ? (
                    <img
                      src={gift.thumbnail_url || gift.animation_url}
                      alt={gift.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Gift className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-1">{gift.name}</h3>
                <div className="flex items-center justify-between gap-2">
                  <Badge className={rarityColors[gift.rarity]} variant="secondary">
                    {gift.rarity}
                  </Badge>
                  <p className="font-bold text-primary">${gift.price}</p>
                </div>
                {gift.is_limited && (
                  <Badge variant="destructive" className="mt-2 text-xs">
                    Limited
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {gifts.length === 0 && (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No gifts in this category</p>
        </div>
      )}

      {/* Selected Gift Preview */}
      {selectedGift && (
        <Card className="bg-gradient-to-br from-[#7B5DA6] to-[#C0392B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                  {selectedGift.thumbnail_url ? (
                    <img
                      src={selectedGift.thumbnail_url}
                      alt={selectedGift.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Gift className="w-8 h-8 text-[#7B5DA6]" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedGift.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedGift.description}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sent {selectedGift.times_sent} times
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  ${selectedGift.price}
                </p>
                <Button
                  onClick={() => { hapticMedium(); sendGiftMutation.mutate(selectedGift); }}
                  disabled={sendGiftMutation.isPending}
                  className="mt-2"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Send Gift
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}