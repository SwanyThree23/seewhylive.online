import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, CheckCircle, Lock, Globe, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function CommunityCard({ community, isMember, isAdmin, onJoin }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-r from-purple-500 to-pink-500 overflow-hidden">
        {community.cover_url ? (
          <img 
            src={community.cover_url} 
            alt={community.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full" />
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          {community.verified && (
            <Badge className="bg-blue-500 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {!community.is_public && (
            <Badge variant="secondary">
              <Lock className="w-3 h-3 mr-1" />
              Private
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="relative pb-2">
        <div className="flex items-start gap-3">
          {/* Community Avatar */}
          <Avatar className="w-16 h-16 -mt-8 ring-4 ring-background">
            <AvatarImage src={community.avatar_url} />
            <AvatarFallback className="text-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              {community.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 mt-2">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-purple-600 transition-colors">
              {community.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{community.member_count || 0} members</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {community.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {community.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {community.category}
          </Badge>
          {community.is_public ? (
            <Badge variant="outline" className="text-green-600">
              <Globe className="w-3 h-3 mr-1" />
              Public
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600">
              <Lock className="w-3 h-3 mr-1" />
              Private
            </Badge>
          )}
        </div>

        {community.tags && community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {community.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2 pt-2">
          <div className="flex gap-2">
            <Link to={createPageUrl(`Community?id=${community.id}`)} className="flex-1">
              <Button variant="outline" className="w-full">
                View
              </Button>
            </Link>
            {!isMember && (
              <Button 
                className="flex-1" 
                onClick={(e) => {
                  e.preventDefault();
                  onJoin?.(community);
                }}
              >
                Join
              </Button>
            )}
          </div>
          {isMember && (
            <div className="flex gap-2">
              {isAdmin && (
                <Link to={createPageUrl(`CommunityAdmin?id=${community.id}`)} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Admin
                  </Button>
                </Link>
              )}
              <Link to={createPageUrl(`CommunityGrowth?id=${community.id}`)} className="flex-1">
                <Button variant="ghost" size="sm" className="w-full text-purple-600">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Growth
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}