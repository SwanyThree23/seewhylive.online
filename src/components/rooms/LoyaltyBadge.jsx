import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { Sparkles, Award, Crown, Gem } from 'lucide-react';

export default function LoyaltyBadge({ userId, creatorId }) {
  const { data: loyalty } = useQuery({
    queryKey: ['loyalty', userId, creatorId],
    queryFn: async () => {
      const records = await base44.entities.ViewerLoyalty.filter({
        user_id: userId,
        creator_id: creatorId,
      });
      return records[0];
    },
    enabled: !!userId && !!creatorId,
  });

  if (!loyalty || loyalty.loyalty_points < 10) return null;

  const getTierConfig = (tier) => {
    switch (tier) {
      case 'diamond':
        return { icon: Gem, color: 'bg-[#D4AF37]', label: 'Diamond' };
      case 'platinum':
        return { icon: Crown, color: 'bg-[#800020]', label: 'Platinum' };
      case 'gold':
        return { icon: Award, color: 'bg-[#D4AF37]', label: 'Gold' };
      case 'silver':
        return { icon: Sparkles, color: 'bg-gray-400', label: 'Silver' };
      default:
        return { icon: Sparkles, color: 'bg-[#D4854A]', label: 'Bronze' };
    }
  };

  const config = getTierConfig(loyalty.loyalty_tier);
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} text-white text-xs`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}