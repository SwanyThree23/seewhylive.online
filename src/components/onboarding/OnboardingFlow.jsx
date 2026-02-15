import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to the Platform!',
    description: 'Discover live streams, join communities, and connect with creators',
    action: 'Get Started',
  },
  {
    title: 'Choose Your Interests',
    description: 'Select categories you\'re interested in to get personalized recommendations',
    categories: ['Gaming', 'Music', 'Tech', 'Education', 'Entertainment', 'Sports'],
  },
  {
    title: 'Join Your First Community',
    description: 'Communities are groups of people with shared interests',
    action: 'Browse Communities',
  },
  {
    title: 'You\'re All Set!',
    description: 'Start exploring live rooms and connecting with others',
    action: 'Start Exploring',
  },
];

export default function OnboardingFlow({ isOpen, onClose }) {
  const [step, setStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const prefs = await base44.entities.UserPreference.filter({ user_id: user.id });
      
      if (prefs.length > 0) {
        return await base44.entities.UserPreference.update(prefs[0].id, data);
      } else {
        return await base44.entities.UserPreference.create({ user_id: user.id, ...data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userPreferences']);
    },
  });

  const handleNext = async () => {
    if (step === 1) {
      // Save categories
      await updatePreferencesMutation.mutateAsync({
        categories: selectedCategories,
        onboarding_step: step + 1,
      });
    }

    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      await updatePreferencesMutation.mutateAsync({
        onboarding_completed: true,
      });
      toast.success('Welcome aboard! 🎉');
      onClose();
    }
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const currentStep = ONBOARDING_STEPS[step];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {currentStep.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground">{currentStep.description}</p>

          {/* Progress indicator */}
          <div className="flex gap-2">
            {ONBOARDING_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full ${
                  idx <= step ? 'bg-purple-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Categories */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2">
              {currentStep.categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                  onClick={() => toggleCategory(category)}
                  className="justify-start"
                >
                  {selectedCategories.includes(category) && (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {category}
                </Button>
              ))}
            </div>
          )}

          {/* Step 2: Communities preview */}
          {step === 2 && (
            <div className="space-y-2">
              <div className="p-3 border rounded-lg cursor-pointer hover:bg-slate-50" onClick={() => navigate(createPageUrl('Communities'))}>
                <p className="font-medium">Tech Innovators</p>
                <p className="text-sm text-muted-foreground">1.2K members</p>
              </div>
              <div className="p-3 border rounded-lg cursor-pointer hover:bg-slate-50" onClick={() => navigate(createPageUrl('Communities'))}>
                <p className="font-medium">Gaming Hub</p>
                <p className="text-sm text-muted-foreground">3.5K members</p>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button 
              onClick={handleNext} 
              className="ml-auto"
              disabled={step === 1 && selectedCategories.length === 0}
            >
              {step === ONBOARDING_STEPS.length - 1 ? 'Finish' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}