import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SpotlightSection({ communityId }) {
  const { data: spotlights = [], isLoading } = useQuery({
    queryKey: ['spotlights', communityId],
    queryFn: () => base44.entities.CommunitySpotlight.filter(
      { community_id: communityId, is_active: true },
      '-created_date',
      3
    ),
  });

  if (isLoading || spotlights.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-yellow-500" />
        <h2 className="text-xl font-bold">Community Spotlight</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {spotlights.map((spotlight, index) => (
          <SpotlightCard key={spotlight.id} spotlight={spotlight} index={index} />
        ))}
      </div>
    </div>
  );
}

function SpotlightCard({ spotlight, index }) {
  const icons = {
    member: <Award className="w-4 h-4" />,
    content: <TrendingUp className="w-4 h-4" />,
    achievement: <Star className="w-4 h-4" />,
  };

  const colors = {
    member: 'bg-gradient-to-br from-blue-500 to-purple-600',
    content: 'bg-gradient-to-br from-green-500 to-teal-600',
    achievement: 'bg-gradient-to-br from-yellow-500 to-orange-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden">
        {spotlight.image_url && (
          <div className="h-32 overflow-hidden">
            <img
              src={spotlight.image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className={!spotlight.image_url ? colors[spotlight.spotlight_type] : ''}>
          <div className="flex items-center gap-3">
            <Avatar className="border-2 border-white">
              <AvatarImage src={spotlight.user_avatar} />
              <AvatarFallback>{spotlight.user_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Badge variant="secondary" className="mb-1">
                {icons[spotlight.spotlight_type]}
                <span className="ml-1 capitalize">{spotlight.spotlight_type}</span>
              </Badge>
              <h3 className="font-semibold text-sm">{spotlight.user_name}</h3>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <h4 className="font-semibold mb-1">{spotlight.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {spotlight.description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}