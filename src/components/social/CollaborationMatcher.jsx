import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLLAB_OPPORTUNITIES = [
  {
    id: 1,
    name: 'AI Verse Podcast',
    type: 'Podcast',
    interests: ['AI', 'Creator Talk', 'Tech'],
    color: '#8B5CF6',
    url: 'https://youtube.com/@aiversepodcast',
  },
  {
    id: 2,
    name: 'Memoirs of a Shy Girl',
    type: 'Creator',
    interests: ['Stories', 'Personal', 'Authentic'],
    color: '#EC4899',
    url: 'https://youtube.com/@memoirsofashygirl',
  },
  {
    id: 3,
    name: 'Domino Entertainment',
    type: 'Entertainment',
    interests: ['Comedy', 'Entertainment', 'Creative'],
    color: '#F59E0B',
    url: 'https://youtube.com/@dominoentertainment5513',
  },
];

export default function CollaborationMatcher() {
  const [interested, setInterested] = useState(new Set());

  const toggleInterest = (id) => {
    const newSet = new Set(interested);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setInterested(newSet);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 px-4">
        <Zap className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-bold text-white">Collaboration Opportunities</h3>
      </div>

      <div className="px-4 space-y-2">
        {COLLAB_OPPORTUNITIES.map(creator => (
          <motion.div
            key={creator.id}
            whileHover={{ scale: 1.02 }}
            className="rounded-lg p-3 transition-all cursor-pointer"
            style={{
              background: interested.has(creator.id)
                ? `rgba(${creator.color === '#8B5CF6' ? '139,92,246' : creator.color === '#EC4899' ? '236,72,153' : '245,158,11'},0.15)`
                : 'rgba(255,255,255,0.05)',
              border: interested.has(creator.id)
                ? `2px solid ${creator.color}`
                : '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={() => toggleInterest(creator.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold text-white">{creator.name}</h4>
                <p className="text-[9px] text-white/50">{creator.type}</p>
              </div>
              <a
                href={creator.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0"
              >
                <ExternalLink className="w-3 h-3 text-white/40 hover:text-white/70 transition-colors" />
              </a>
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {creator.interests.map(interest => (
                <span key={interest} className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `rgba(${creator.color === '#8B5CF6' ? '139,92,246' : creator.color === '#EC4899' ? '236,72,153' : '245,158,11'},0.2)`, color: creator.color }}>
                  {interest}
                </span>
              ))}
            </div>

            {interested.has(creator.id) && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://youtube.com${creator.url}`, '_blank');
                }}
                className="w-full h-7 text-[10px]"
                style={{ background: creator.color, color: 'white' }}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Send Collab Request
              </Button>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}