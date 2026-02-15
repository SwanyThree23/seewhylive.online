import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';

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
    <OnboardingFlow 
      isOpen={showOnboarding} 
      onClose={() => setShowOnboarding(false)} 
    />
  );
}