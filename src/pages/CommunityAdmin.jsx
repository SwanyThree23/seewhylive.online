import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Flag, Megaphone, TrendingUp, Users } from 'lucide-react';
import ReferralConfig from '../components/admin/ReferralConfig';
import ReportsManager from '../components/admin/ReportsManager';
import AnnouncementScheduler from '../components/admin/AnnouncementScheduler';
import ChallengeAnalytics from '../components/admin/ChallengeAnalytics';

export default function CommunityAdminPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(c => c[0]),
    enabled: !!communityId,
  });

  const { data: membership } = useQuery({
    queryKey: ['membership', communityId, user?.id],
    queryFn: () => base44.entities.CommunityMember.filter({
      community_id: communityId,
      user_id: user?.id,
    }).then(m => m[0]),
    enabled: !!communityId && !!user,
  });

  const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-indigo-100">{community?.name} - Community Management</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full max-w-4xl grid-cols-4">
            <TabsTrigger value="analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports">
              <Flag className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="announcements">
              <Megaphone className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <Users className="w-4 h-4 mr-2" />
              Referrals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <ChallengeAnalytics communityId={communityId} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsManager communityId={communityId} userId={user?.id} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementScheduler communityId={communityId} userId={user?.id} />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralConfig communityId={communityId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}