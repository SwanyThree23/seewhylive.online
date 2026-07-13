import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const BackgroundContext = createContext();

export function BackgroundProvider({ children }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: bgPreference } = useQuery({
    queryKey: ['backgroundPreference', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const prefs = await base44.entities.UserPreference.filter({ user_id: user.id });
      return prefs?.[0]?.background_style || 'default';
    },
    enabled: !!user?.id,
  });

  const [backgroundStyle, setBackgroundStyle] = useState(bgPreference || 'default');

  useEffect(() => {
    if (bgPreference) {
      setBackgroundStyle(bgPreference);
    }
  }, [bgPreference]);

  const backgrounds = {
    default: {
      background: '#0B0B18',
      overlay: 'none',
    },
    faded_dark: {
      background: '#0B0B18',
      backgroundImage: `linear-gradient(180deg, 
        rgba(10, 7, 16, 0.98) 0%,
        rgba(20, 15, 30, 0.92) 50%,
        rgba(10, 7, 16, 0.98) 100%)`,
      backdropFilter: 'blur(20px)',
    },
    faded_earth: {
      background: '#080B18',
      backgroundImage: `url('https://images.unsplash.com/photo-1516869122079-fcffe0fb4bcc?w=1600&h=2000&fit=crop')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundBlendMode: 'darken',
    },
    faded_neon: {
      background: 'linear-gradient(135deg, rgba(10, 7, 16, 0.95), rgba(20, 15, 40, 0.92))',
      backgroundImage: `radial-gradient(circle at 20% 50%, rgba(123, 93, 166, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(74, 138, 122, 0.08) 0%, transparent 50%)`,
    },
    faded_terracotta: {
      background: '#080B18',
      backgroundImage: `linear-gradient(135deg, 
        rgba(10, 7, 16, 0.95) 0%, 
        rgba(44, 24, 16, 0.92) 50%,
        rgba(10, 7, 16, 0.95) 100%)`,
    },
  };

  const updateBackground = async (style) => {
    setBackgroundStyle(style);
    if (user?.id) {
      try {
        await base44.auth.updateMe({ background_style: style });
      } catch (e) {
      }
    }
  };

  return (
    <BackgroundContext.Provider value={{ backgroundStyle, updateBackground, backgrounds }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within BackgroundProvider');
  }
  return context;
}