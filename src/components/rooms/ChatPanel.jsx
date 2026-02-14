import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Smile, Pin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function ChatPanel({ roomId, currentUser }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

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

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
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

function MessageBubble({ message, isOwn }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
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
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.created_date), 'h:mm a')}
          </span>
          {message.is_pinned && (
            <Pin className="w-3 h-3 text-blue-500" />
          )}
        </div>

        <div className={`rounded-2xl px-4 py-2 ${
          isOwn 
            ? 'bg-purple-500 text-white' 
            : 'bg-muted'
        }`}>
          <p className="text-sm break-words">{message.content}</p>
        </div>
      </div>
    </motion.div>
  );
}