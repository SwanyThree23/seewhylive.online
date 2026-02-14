import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Users, TrendingUp, Award, DollarSign } from 'lucide-react';

export default function ReferralConfig({ communityId }) {
  const [rewardType, setRewardType] = useState('points');
  const [rewardValue, setRewardValue] = useState('100');

  const { data: referrals = [] } = useQuery({
    queryKey: ['communityReferrals', communityId],
    queryFn: () => base44.entities.Referral.filter({ community_id: communityId }),
  });

  const totalReferrals = referrals.length;
  const completedReferrals = referrals.filter(r => r.status === 'completed').length;
  const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
  const conversionRate = totalReferrals > 0 ? ((completedReferrals / totalReferrals) * 100).toFixed(1) : 0;

  const topReferrers = referrals.reduce((acc, ref) => {
    const userId = ref.referrer_id;
    if (!acc[userId]) acc[userId] = { count: 0, completed: 0 };
    acc[userId].count++;
    if (ref.status === 'completed') acc[userId].completed++;
    return acc;
  }, {});

  const sortedReferrers = Object.entries(topReferrers)
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Referrals</CardDescription>
            <CardTitle className="text-3xl">{totalReferrals}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>All time</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{completedReferrals}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="w-4 h-4" />
              <span>Successful</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{pendingReferrals}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>In progress</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-3xl">{conversionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>Success rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reward Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Referral Reward Configuration
          </CardTitle>
          <CardDescription>
            Set rewards for successful referrals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Reward Type</label>
              <Select value={rewardType} onValueChange={setRewardType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="badge">Badge</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="virtual_good">Virtual Good</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reward Value</label>
              <Input
                type="number"
                value={rewardValue}
                onChange={(e) => setRewardValue(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Current Settings:</strong> Users will receive <strong>{rewardValue} {rewardType}</strong> for each successful referral.
            </p>
          </div>

          <Button className="w-full">
            Update Reward Settings
          </Button>
        </CardContent>
      </Card>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
          <CardDescription>Members driving the most growth</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedReferrers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No referral data yet
            </div>
          ) : (
            <div className="space-y-3">
              {sortedReferrers.map((referrer, idx) => (
                <div key={referrer.userId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">User {referrer.userId.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {referrer.count} total • {referrer.completed} completed
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {referrer.completed} successful
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}