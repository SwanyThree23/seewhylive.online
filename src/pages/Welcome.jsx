import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';

export default function WelcomePage() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: preferences } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreference.filter({ user_id: user.id });
      return prefs[0];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (user && (!preferences || !preferences.onboarding_completed)) {
      setShowOnboarding(true);
    }
  }, [user, preferences]);

  return (
    <>
      <OnboardingFlow
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Full-screen hero with background photo */}
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6990f5f24823b53e21fcdc9d/488efc977_Screenshot_20260227_153856_Chrome.jpg')`,
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-lg mx-auto px-6 text-center flex flex-col items-center justify-center min-h-screen py-16">
          
          {/* Logo badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 backdrop-blur-sm rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 text-sm font-semibold tracking-wide uppercase">Live Streaming Platform</span>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-3 leading-tight">
              Welcome to
            </h1>
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
              <span className="text-amber-400">SeeWhy</span>
              <span className="text-white"> LIVE</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl text-white/80 mb-10 max-w-sm leading-relaxed"
          >
            Stream, Connect, Engage. The ultimate platform for professional creators and their communities.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="w-full flex flex-col gap-4 max-w-xs"
          >
            <Link to={createPageUrl('CreateRoom')} className="w-full">
              <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
                <Button
                  size="lg"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg py-6 rounded-2xl shadow-lg shadow-amber-500/30"
                >
                  Start Broadcasting
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </Link>

            <Link to={createPageUrl('Home')} className="w-full">
              <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/40 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-bold text-lg py-6 rounded-2xl"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Streams
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-14 flex items-center gap-8"
          >
            {[
              { value: '10K+', label: 'Creators' },
              { value: '500+', label: 'Live Now' },
              { value: '1M+', label: 'Viewers' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-amber-400">{stat.value}</p>
                <p className="text-xs text-white/60 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
}