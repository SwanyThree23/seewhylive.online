import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, Upload } from 'lucide-react';

const CATEGORIES = ['gaming', 'music', 'education', 'talk', 'fitness', 'cooking', 'art', 'tech', 'other'];

export default function CreatorProfileSetup({ user, isOpen, onClose }) {
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState(user?.full_name || '');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('other');

  const createProfileMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.CreatorProfile.create({
        user_id: user.id,
        display_name: displayName.trim() || user.full_name,
        bio,
        category,
        subscriber_count: 0,
        follower_count: 0,
        total_hours_streamed: 0,
        is_verified: false,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries(['creatorProfile', user?.id]);
      toast.success('Creator profile created! Welcome to SeeWhy LIVE 🎉');
      onClose();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <DialogTitle>Set Up Your Creator Profile</DialogTitle>
          </div>
          <DialogDescription>
            Complete your profile to start streaming, earning, and engaging with your audience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium block mb-1.5">Display Name</label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="How should viewers know you?"
              maxLength={40}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Bio <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell your audience about yourself..."
              className="h-24 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{bio.length}/500</p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Primary Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-1">
            <p className="font-semibold">What you unlock:</p>
            <ul className="text-xs space-y-0.5 list-disc list-inside text-amber-700">
              <li>Public creator profile page</li>
              <li>90/10 revenue split on tips &amp; subscriptions</li>
              <li>VOD library, stream analytics, loyalty rewards</li>
              <li>Stripe Connect for real payouts</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Skip for now</Button>
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold"
              onClick={() => createProfileMutation.mutate()}
              disabled={createProfileMutation.isPending || !displayName.trim()}
            >
              {createProfileMutation.isPending ? 'Creating...' : 'Create Profile'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}