import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Ban, VolumeX, AlertTriangle, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatModerationPanel({ roomId }) {
  const [bannedWords, setBannedWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const queryClient = useQueryClient();

  const { data: moderations = [] } = useQuery({
    queryKey: ['chat-moderation', roomId],
    queryFn: () => base44.entities.ChatModeration.filter(
      { room_id: roomId },
      '-created_date',
      50
    ),
    enabled: !!roomId,
  });

  const moderateUserMutation = useMutation({
    mutationFn: async ({ action, userId, reason, duration }) => {
      const user = await base44.auth.me();
      return await base44.entities.ChatModeration.create({
        room_id: roomId,
        moderator_id: user.id,
        action_type: action,
        target_user_id: userId,
        reason: reason,
        duration_minutes: duration,
        expires_at: duration ? new Date(Date.now() + duration * 60000).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-moderation'] });
      toast.success('Moderation action applied');
    },
    onError: () => { toast.error('Failed to apply moderation action. Please try again.'); },
  });

  const addBannedWord = () => {
    if (newWord && !bannedWords.includes(newWord.toLowerCase())) {
      setBannedWords([...bannedWords, newWord.toLowerCase()]);
      setNewWord('');
      toast.success(`Added "${newWord}" to banned words`);
    }
  };

  const removeBannedWord = (word) => {
    setBannedWords(bannedWords.filter(w => w !== word));
    toast.success(`Removed "${word}" from banned words`);
  };

  const recentActions = moderations.slice(0, 10);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Keyword Filtering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add banned word..."
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addBannedWord()}
            />
            <Button onClick={addBannedWord} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {bannedWords.map((word) => (
              <Badge key={word} variant="destructive" className="flex items-center gap-1">
                {word}
                <button onClick={() => removeBannedWord(word)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          {bannedWords.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No banned words configured
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Recent Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No moderation actions yet</p>
          ) : (
            <div className="space-y-2">
              {recentActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div className="flex items-center gap-2">
                    {action.action_type === 'mute' && <VolumeX className="w-4 h-4" />}
                    {action.action_type === 'block' && <Ban className="w-4 h-4" />}
                    <div>
                      <p className="font-medium capitalize">{action.action_type}</p>
                      <p className="text-xs text-muted-foreground">{action.reason}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {action.auto_detected ? 'Auto' : 'Manual'}
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