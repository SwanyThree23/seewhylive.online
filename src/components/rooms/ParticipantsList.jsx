import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, Hand, Mic, MicOff, Video, VideoOff, 
  Crown, Shield, Search, MoreVertical, DollarSign, Flag
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TippingModal from '../monetization/TippingModal';
import ReportModal from '../moderation/ReportModal';
import ModerationActionModal from '../moderation/ModerationActionModal';

export default function ParticipantsList({ participants, currentUser, onUpdateParticipant, onInviteToStage, roomId, communityId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tippingUser, setTippingUser] = useState(null);
  const [reportingUser, setReportingUser] = useState(null);
  const [moderatingUser, setModeratingUser] = useState(null);

  const speakers = participants.filter(p => 
    ['host', 'co-host', 'speaker', 'guest'].includes(p.role)
  );
  const audience = participants.filter(p => p.role === 'audience');
  const handsRaised = audience.filter(p => p.hand_raised);

  const filterParticipants = (list) => {
    if (!searchQuery) return list;
    return list.filter(p => 
      p.user_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Participants ({participants.length})
        </CardTitle>
        <Input
          placeholder="Search participants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2"
        />
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs defaultValue="all" className="h-full flex flex-col">
          <TabsList className="mx-4 grid w-auto grid-cols-3">
            <TabsTrigger value="all">
              All ({participants.length})
            </TabsTrigger>
            <TabsTrigger value="speakers">
              Speakers ({speakers.length})
            </TabsTrigger>
            <TabsTrigger value="raised">
              Raised ({handsRaised.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-2 py-4">
                {filterParticipants(participants).map(participant => (
                  <ParticipantItem
                    key={participant.id}
                    participant={participant}
                    currentUser={currentUser}
                    onUpdateParticipant={onUpdateParticipant}
                    onInviteToStage={onInviteToStage}
                    setTippingUser={setTippingUser}
                    setReportingUser={setReportingUser}
                    setModeratingUser={setModeratingUser}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="speakers" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-2 py-4">
                {filterParticipants(speakers).map(participant => (
                  <ParticipantItem
                    key={participant.id}
                    participant={participant}
                    currentUser={currentUser}
                    onUpdateParticipant={onUpdateParticipant}
                    onInviteToStage={onInviteToStage}
                    setTippingUser={setTippingUser}
                    setReportingUser={setReportingUser}
                    setModeratingUser={setModeratingUser}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="raised" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-2 py-4">
                {filterParticipants(handsRaised).length > 0 ? (
                  filterParticipants(handsRaised).map(participant => (
                    <ParticipantItem
                      key={participant.id}
                      participant={participant}
                      currentUser={currentUser}
                      onUpdateParticipant={onUpdateParticipant}
                      onInviteToStage={onInviteToStage}
                      setTippingUser={setTippingUser}
                      setReportingUser={setReportingUser}
                      setModeratingUser={setModeratingUser}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Hand className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hands raised</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {tippingUser && (
        <TippingModal
          isOpen={!!tippingUser}
          onClose={() => setTippingUser(null)}
          recipient={tippingUser}
          roomId={roomId}
          communityId={communityId}
        />
      )}

      {reportingUser && (
        <ReportModal
          isOpen={!!reportingUser}
          onClose={() => setReportingUser(null)}
          reportedUser={reportingUser}
          roomId={roomId}
          communityId={communityId}
        />
      )}

      {moderatingUser && (
        <ModerationActionModal
          isOpen={!!moderatingUser}
          onClose={() => setModeratingUser(null)}
          targetUser={moderatingUser}
          roomId={roomId}
          communityId={communityId}
          moderatorId={currentUser?.id}
        />
      )}
    </Card>
  );
}

function ParticipantItem({ participant, currentUser, onUpdateParticipant, onInviteToStage, setTippingUser, setReportingUser, setModeratingUser }) {
  const isCurrentUser = participant.user_id === currentUser.id;
  const isSpeaker = ['host', 'co-host', 'speaker', 'guest'].includes(participant.role);

  const getRoleIcon = () => {
    switch(participant.role) {
      case 'host': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'co-host': return <Shield className="w-4 h-4 text-[#5B7FA6]" />;
      default: return null;
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="w-10 h-10">
        <AvatarImage src={participant.user_avatar} />
        <AvatarFallback>
          {participant.user_name?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{participant.user_name}</p>
          {getRoleIcon()}
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">You</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {participant.is_audio_enabled ? (
            <Mic className="w-3 h-3 text-[#6DBF7E]" />
          ) : (
            <MicOff className="w-3 h-3 text-muted-foreground" />
          )}
          {participant.is_video_enabled && (
            <Video className="w-3 h-3 text-[#5B7FA6]" />
          )}
          {participant.hand_raised && (
            <Hand className="w-3 h-3 text-[#D4AF37]" />
          )}
          {participant.is_streaming && (
            <Badge className="text-xs bg-[#C0392B]">LIVE</Badge>
          )}
        </div>
      </div>

      {!isSpeaker && participant.hand_raised && currentUser.role === 'admin' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onInviteToStage(participant)}
        >
          Invite
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTippingUser(participant)}>
            <DollarSign className="w-4 h-4 mr-2" />
            Send Tip
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setReportingUser(participant)}>
            <Flag className="w-4 h-4 mr-2" />
            Report User
          </DropdownMenuItem>
          {currentUser.role === 'admin' && !isCurrentUser && (
            <>
              <DropdownMenuItem onClick={() => setModeratingUser(participant)}>
                <Shield className="w-4 h-4 mr-2" />
                Moderate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onInviteToStage(participant)}>
                Invite to Stage
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[#C0392B]">
                Remove from Room
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
