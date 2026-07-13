import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Smile, Pin, Trash2, Ban, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import LoyaltyBadge from './LoyaltyBadge';
import { toast } from 'sonner';

export default function ChatPanel({ roomId, currentUser, isHost, bannedWords = [] }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: mutedUsers = [] } = useQuery({
    queryKey: ['muted-users', roomId],
    queryFn: async () => {
      const moderations = await base44.entities.ChatModeration.filter({
        room_id: roomId,
        action_type: 'mute',
      });
      return moderations.filter(m => {
        if (!m.expires_at) return true;
        return new Date(m.expires_at) > new Date();
      }).map(m => m.target_user_id);
    },
    enabled: !!roomId,
  });

  // Fetch messages
  const { data: fetchedMessages = [] } = useQuery({
    queryKey: ['messages', roomId],
    queryFn: async () => {
      const results = await base44.entities.Message.filter(
        { room_id: roomId },
        '-created_date',
        100
      );
      return results.reverse();
    },
    enabled: !!roomId,
  });

  useEffect(() => {
    setMessages(fetchedMessages);
  }, [fetchedMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.room_id === roomId) {
        if (event.type === 'create') {
          setMessages(prev => [...prev, event.data]);
        } else if (event.type === 'update') {
          setMessages(prev => prev.map(m => m.id === event.id ? event.data : m));
        } else if (event.type === 'delete') {
          setMessages(prev => prev.filter(m => m.id !== event.id));
        }
      }
    });

    return unsubscribe;
  }, [roomId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId) => base44.entities.Message.delete(messageId),
    onError: () => toast.error('Failed to delete message.'),
    onSuccess: () => {
      toast.success('Message deleted');
    },
  });

  const moderateUserMutation = useMutation({
    mutationFn: async ({ action, userId }) => {
      if (!currentUser?.id) throw new Error('Not authenticated');
      return await base44.entities.ChatModeration.create({
        room_id: roomId,
        moderator_id: currentUser.id,
        action_type: action,
        target_user_id: userId,
        reason: `${action} by moderator`,
        duration_minutes: action === 'mute' ? 10 : null,
        expires_at: action === 'mute' ? new Date(Date.now() + 10 * 60000).toISOString() : null,
      });
    },
    onError: () => toast.error('Moderation action failed.'),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['muted-users'] });
      toast.success(`User ${variables.action}ed`);
      if (currentUser?.id) {
        base44.entities.Activity.create({
          user_id: currentUser.id,
          type: 'milestone',
          title: `Moderation action: ${variables.action} applied to chat user`,
        }).catch(() => {});
      }
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      // Check if user is muted
      if (mutedUsers.includes(currentUser.id)) {
        throw new Error('You are muted');
      }

      // Check banned words
      const lowerContent = content.toLowerCase();
      const hasBannedWord = bannedWords.some(word => lowerContent.includes(word));
      
      if (hasBannedWord) {
        // Auto-moderate
        await base44.entities.ChatModeration.create({
          room_id: roomId,
          moderator_id: 'system',
          action_type: 'warning',
          target_user_id: currentUser.id,
          reason: 'Banned word detected',
          auto_detected: true,
          keywords_matched: bannedWords.filter(w => lowerContent.includes(w)),
        });
        throw new Error('Message contains banned words');
      }

      // Update loyalty
      const loyaltyRecords = await base44.entities.ViewerLoyalty.filter({
        user_id: currentUser.id,
      });
      
      if (loyaltyRecords.length > 0) {
        const loyalty = loyaltyRecords[0];
        await base44.entities.ViewerLoyalty.update(loyalty.id, {
          messages_sent: (loyalty.messages_sent || 0) + 1,
          loyalty_points: (loyalty.loyalty_points || 0) + 1,
        });
      }

      return await base44.entities.Message.create({
        room_id: roomId,
        user_id: currentUser.id,
        user_name: currentUser.full_name || currentUser.email,
        user_avatar: currentUser.avatar_url,
        content,
        type: 'text',
      });
    },
    onSuccess: () => {
      setMessage('');
    },
    onError: () => {
      toast.error('Failed to send message. Please try again.');
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Live Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.user_id === currentUser.id}
                isHost={isHost}
                roomId={roomId}
                onDelete={() => deleteMessageMutation.mutate(msg.id)}
                onModerate={(action) => moderateUserMutation.mutate({ action, userId: msg.user_id })}
              />
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            maxLength={500}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MessageBubble({ message, isOwn, isHost, roomId, onDelete, onModerate }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={message.user_avatar} />
        <AvatarFallback className="text-xs">
          {message.user_name?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{message.user_name}</span>
          <LoyaltyBadge userId={message.user_id} creatorId={roomId} />
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.created_date), 'h:mm a')}
          </span>
          {message.is_pinned && (
            <Pin className="w-3 h-3 text-[#D4AF37]" />
          )}
        </div>

        <div className={`rounded-2xl px-4 py-2 relative ${
          isOwn 
            ? 'bg-[#800020] text-white' 
            : 'bg-muted'
        }`}>
          <p className="text-sm break-words">{message.content}</p>
          
          {/* Moderation actions */}
          {isHost && !isOwn && showActions && (
            <div className="absolute -right-2 top-0 flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white"
                onClick={onDelete}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-white" style={{ background: '#D4854A' }}
                onClick={() => onModerate('mute')}
              >
                <Ban className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}