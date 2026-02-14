import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Mic, Users, Clock, Radio } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';

export default function RoomCard({ room, onJoin }) {
  const isLive = room.status === 'live';
  const isScheduled = room.status === 'scheduled';

  const getStatusBadge = () => {
    if (isLive) {
      return (
        <Badge className="bg-red-500 text-white animate-pulse">
          <Radio className="w-3 h-3 mr-1" />
          LIVE
        </Badge>
      );
    }
    if (isScheduled) {
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Scheduled
        </Badge>
      );
    }
    return <Badge variant="secondary">Ended</Badge>;
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative h-48 bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
        {room.thumbnail_url ? (
          <img 
            src={room.thumbnail_url} 
            alt={room.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {room.type === 'audio' ? (
              <Mic className="w-16 h-16 text-white opacity-50" />
            ) : (
              <Video className="w-16 h-16 text-white opacity-50" />
            )}
          </div>
        )}
        <div className="absolute top-3 left-3">
          {getStatusBadge()}
        </div>
        {isLive && (
          <div className="absolute top-3 right-3 bg-black/70 px-2 py-1 rounded-full flex items-center gap-1">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">{room.viewer_count || 0}</span>
          </div>
        )}
      </div>

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
            {room.title}
          </CardTitle>
          <Badge variant="outline" className="capitalize shrink-0">
            {room.type}
          </Badge>
        </div>
        {room.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {room.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {room.tags && room.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {room.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {room.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{room.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {isScheduled && room.scheduled_start && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{format(new Date(room.scheduled_start), 'MMM d, h:mm a')}</span>
          </div>
        )}

        <Link to={createPageUrl(`Room?id=${room.id}`)}>
          <Button 
            className="w-full"
            variant={isLive ? "default" : "outline"}
            onClick={(e) => {
              if (onJoin) {
                e.preventDefault();
                onJoin(room);
              }
            }}
          >
            {isLive ? 'Join Now' : isScheduled ? 'View Details' : 'View Recording'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}