import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Award, Star, Gift, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['userReferrals', user?.id],
    queryFn: () => base44.entities.Referral.filter({ referrer_id: user?.id }),
    enabled: !!user,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['userSubscriptions', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user?.id, status: 'active' }),
    enabled: !!user,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['userInventory', user?.id],
    queryFn: () => base44.entities.UserInventory.filter({ user_id: user?.id }),
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      toast.success('Profile updated!');
      queryClient.invalidateQueries(['currentUser']);
      setIsEditing(false);
    },
  });

  React.useEffect(() => {
    if (user?.bio) {
      setBio(user.bio);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const completedReferrals = referrals.filter(r => r.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold">{user?.full_name || 'User'}</h1>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{user?.email}</span>
                    </div>
                  </div>
                  <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                    {user?.role}
                  </Badge>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateProfileMutation.mutate({ bio })}
                        disabled={updateProfileMutation.isPending}
                        size="sm"
                      >
                        Save
                      </Button>
                      <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-muted-foreground mb-2">{user?.bio || 'No bio yet'}</p>
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      Edit Bio
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Points</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                {user?.points || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Referrals</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                {completedReferrals}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Subscriptions</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                {subscriptions.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Virtual Items</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                {inventory.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Badges */}
        {user?.badges && user.badges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Your achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge, idx) => (
                  <Badge key={idx} variant="secondary" className="text-base py-2 px-4">
                    <Award className="w-4 h-4 mr-2" />
                    {badge}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Subscriptions */}
        {subscriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>Communities you're supporting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{sub.tier} Tier</p>
                      <p className="text-sm text-muted-foreground">
                        ${sub.price}/month
                      </p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}