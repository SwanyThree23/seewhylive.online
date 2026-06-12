import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Layers, Bell, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AlertConfig from '@/components/live/AlertConfig';
import OverlayThemeBuilder from '@/components/live/OverlayThemeBuilder';
import LowerThirdsBanner from '@/components/live/LowerThirdsBanner';

const G = '#D4AF37';
const BG = '#0A0710';

export default function OverlayEditorPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <div className="px-4 py-8 md:px-8 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-6 h-6" style={{ color: G }} />
            <h1 className="text-3xl font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Overlay & Branding
            </h1>
          </div>
          <p className="text-white/60">Customize alerts, themes, and stream overlays</p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {user?.id && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Alerts */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <AlertConfig creatorId={user.id} />
            </motion.div>

            {/* Theme */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <OverlayThemeBuilder creatorId={user.id} />
            </motion.div>

            {/* Lower Thirds */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2">
              <LowerThirdsBanner onBannerChange={() => {}} />
            </motion.div>
          </div>
        )}

        {/* Quick-links to related creator tools */}
        <div className="flex flex-wrap gap-3 mt-8">
          {[
            { label: '🎬 Broadcast Studio', href: 'BroadcastStudio' },
            { label: '🖼 Scene Templates',  href: 'SceneTemplates'  },
            { label: '🔔 Stream Alerts',    href: 'StreamAlerts'    },
            { label: '🏷 Lower Thirds',     href: 'OverlayBuilder'  },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: G, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}