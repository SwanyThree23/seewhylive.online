import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Users, Radio, Video, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import VideoLibrary from '../components/vod/VideoLibrary';
import FollowButton from '../components/shared/FollowButton';
import PresenceDot from '../components/shared/PresenceDot';
import ShareButtons from '../components/shared/ShareButtons';

export default function PublicProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => base44.entities.CreatorProfile.filter({ user_id: userId }).then(r => r[0]),
    enabled: !!userId,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['public-rooms', userId],
    queryFn: () => base44.entities.Room.filter({ host_id: userId, is_public: true }, '-created_date', 6),
    enabled: !!userId,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
        <p className="text-lg font-semibold">Profile not found</p>
        <p className="text-sm text-muted-foreground mt-1">This user hasn't set up a profile yet.</p>
        <Link to="/"><Button className="mt-4">Go Home</Button></Link>
      </div>
    </div>
  );

  const liveRoom = rooms.find(r => r.status === 'live');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-purple-600 to-pink-600 relative">
        {profile.banner_url && <img src={profile.banner_url} className="w-full h-full object-cover" alt="banner" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative pb-16">
        <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
          <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              {profile.display_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 pt-10 sm:pt-14">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {profile.display_name}
                <PresenceDot userId={userId} size="md" />
              </h1>
              {profile.is_verified && <CheckCircle className="w-5 h-5 text-blue-500" />}
              <Badge variant="outline" className="capitalize">{profile.category}</Badge>
              {liveRoom && <Badge className="bg-red-500 text-white animate-pulse border-0">🔴 LIVE</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg">{profile.bio}</p>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span><strong className="text-foreground">{profile.subscriber_count || 0}</strong> subscribers</span>
              <span><strong className="text-foreground">{profile.follower_count || 0}</strong> followers</span>
            </div>
          </div>
          <div className="sm:pt-14 flex gap-2 flex-wrap">
            {liveRoom && (
              <Link to={createPageUrl('Room') + `?id=${liveRoom.id}`}>
                <Button className="bg-red-500 hover:bg-red-600 text-white gap-2">
                  <Radio className="w-4 h-4" /> Watch Live
                </Button>
              </Link>
            )}
            <FollowButton targetUserId={userId} targetUserName={profile.display_name} />
            <ShareButtons url={window.location.href} title={`Check out ${profile.display_name} on SeeWhy LIVE`} />
            <Link to={createPageUrl('CreatorChannel') + `?id=${userId}`}>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" /> Full Channel
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Rooms */}
        {rooms.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Video className="w-4 h-4" /> Recent Streams</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {rooms.slice(0, 6).map(r => (
                  <Link key={r.id} to={createPageUrl('Room') + `?id=${r.id}`}>
                    <div className="bg-slate-100 rounded-xl p-3 hover:bg-slate-200 transition-colors cursor-pointer">
                      <p className="text-xs font-medium truncate">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{r.viewer_count || 0} viewers</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* VOD Library */}
        <VideoLibrary creatorId={userId} />
      </div>
    </div>
  );
}