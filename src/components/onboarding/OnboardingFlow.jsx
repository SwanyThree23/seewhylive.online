import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Radio, Users, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function OnboardingFlow({ isOpen, onClose }) {
  const [step, setStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences) => {
      const existing = await base44.entities.UserPreference.filter({ user_id: user.id });
      
      if (existing.length > 0) {
        await base44.entities.UserPreference.update(existing[0].id, preferences);
      } else {
        await base44.entities.UserPreference.create({
          user_id: user.id,
          ...preferences,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });

  const categories = [
    { id: 'music', label: 'Music', icon: '🎵' },
    { id: 'gaming', label: 'Gaming', icon: '🎮' },
    { id: 'tech', label: 'Technology', icon: '💻' },
    { id: 'education', label: 'Education', icon: '📚' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { id: 'sports', label: 'Sports', icon: '⚽' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '✨' },
  ];

  const steps = [
    {
      title: 'Welcome to SeeWhy LIVE!',
      description: 'Let\'s get you started with a quick tour',
      icon: <Radio className="w-16 h-16 text-purple-500" />,
    },
    {
      title: 'What interests you?',
      description: 'Select topics you\'d like to explore',
      icon: <TrendingUp className="w-16 h-16 text-purple-500" />,
    },
    {
      title: 'Join Communities',
      description: 'Connect with people who share your interests',
      icon: <Users className="w-16 h-16 text-purple-500" />,
    },
    {
      title: 'You\'re all set!',
      description: 'Start exploring rooms and communities',
      icon: <CheckCircle2 className="w-16 h-16 text-green-500" />,
    },
  ];

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleNext = async () => {
    if (step === steps.length - 1) {
      // Complete onboarding
      await updatePreferencesMutation.mutateAsync({
        categories: selectedCategories,
        onboarding_completed: true,
        onboarding_step: step,
      });
      toast.success('Welcome to StreamSpace! 🎉');
      onClose();
    } else if (step === 1) {
      // Save preferences
      await updatePreferencesMutation.mutateAsync({
        categories: selectedCategories,
        onboarding_step: step,
      });
      setStep(step + 1);
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = async () => {
    await updatePreferencesMutation.mutateAsync({
      onboarding_completed: true,
      onboarding_step: 0,
    });
    onClose();
  };

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="text-center">
              <motion.div
                key={step}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex justify-center mb-4"
              >
                {steps[step].icon}
              </motion.div>
              <DialogTitle className="text-2xl">{steps[step].title}</DialogTitle>
              <DialogDescription className="text-base mt-2">
                {steps[step].description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="py-6"
          >
            {step === 0 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <Radio className="w-5 h-5 text-purple-500 mt-1" />
                    <div>
                      <h3 className="font-semibold">Join Live Rooms</h3>
                      <p className="text-sm text-muted-foreground">
                        Participate in audio and video conversations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-purple-500 mt-1" />
                    <div>
                      <h3 className="font-semibold">Build Communities</h3>
                      <p className="text-sm text-muted-foreground">
                        Create or join communities around your interests
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-purple-500 mt-1" />
                    <div>
                      <h3 className="font-semibold">Grow Together</h3>
                      <p className="text-sm text-muted-foreground">
                        Engage with challenges, polls, and discussions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select at least 3 categories to personalize your experience
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        selectedCategories.includes(category.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{category.icon}</div>
                      <p className="text-sm font-medium">{category.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Based on your interests, here are some communities you might like:
                </p>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedCategories.map((catId) => {
                    const cat = categories.find(c => c.id === catId);
                    return (
                      <div key={catId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{cat.icon}</div>
                          <div>
                            <p className="font-semibold">{cat.label} Community</p>
                            <p className="text-xs text-muted-foreground">
                              Connect with {cat.label.toLowerCase()} enthusiasts
                            </p>
                          </div>
                        </div>
                        <Badge>Recommended</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg">
                  <p className="text-lg">
                    🎉 Your account is ready! Start exploring live rooms, join communities, and connect with others.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleSkip}>
            Skip Tour
          </Button>
          <Button 
            onClick={handleNext}
            disabled={step === 1 && selectedCategories.length < 3}
          >
            {step === steps.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}