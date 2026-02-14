import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Users, Gift, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralProgram({ communityId, userId }) {
  const [referralCode] = useState(`REF-${userId.slice(0, 8)}`);
  const queryClient = useQueryClient();

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', userId],
    queryFn: () => base44.entities.Referral.filter({ referrer_id: userId, community_id: communityId }),
  });

  const createReferralMutation = useMutation({
    mutationFn: async (referredEmail) => {
      return await base44.entities.Referral.create({
        referrer_id: userId,
        community_id: communityId,
        referral_code: referralCode,
        reward_type: 'points',
        reward_value: 100,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['referrals']);
      toast.success('Referral tracked! You\'ll earn rewards when they join.');
    },
  });

  const completedReferrals = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length;
  const pendingReferrals = referrals.filter(r => r.status === 'pending').length;

  const referralUrl = `${window.location.origin}/Communities?ref=${referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast.success('Referral link copied!');
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join this awesome community!',
        text: 'I\'ve been loving this community. Join me using my referral link!',
        url: referralUrl,
      });
    } else {
      copyReferralLink();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-600" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Invite friends and earn rewards when they join the community!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-2xl font-bold text-purple-600">{completedReferrals}</div>
            <div className="text-xs text-muted-foreground">Successful</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-2xl font-bold text-orange-600">{pendingReferrals}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-2xl font-bold text-green-600">{completedReferrals * 100}</div>
            <div className="text-xs text-muted-foreground">Points Earned</div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Link</label>
          <div className="flex gap-2">
            <Input
              value={referralUrl}
              readOnly
              className="bg-white"
            />
            <Button onClick={copyReferralLink} variant="outline">
              <Copy className="w-4 h-4" />
            </Button>
            <Button onClick={shareReferral} className="bg-purple-600 hover:bg-purple-700">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Rewards Info */}
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Earn Rewards
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Per successful referral</span>
              <Badge>100 Points</Badge>
            </div>
            <div className="flex justify-between">
              <span>5 referrals milestone</span>
              <Badge className="bg-purple-600">Exclusive Badge</Badge>
            </div>
            <div className="flex justify-between">
              <span>10 referrals milestone</span>
              <Badge className="bg-gold-600">Free Month Subscription</Badge>
            </div>
          </div>
        </div>

        {/* Recent Referrals */}
        {referrals.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-sm">Recent Referrals</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {referrals.slice(0, 5).map((referral) => (
                <div key={referral.id} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs">{referral.referral_code}</span>
                  </div>
                  <Badge variant={referral.status === 'completed' ? 'default' : 'outline'}>
                    {referral.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}