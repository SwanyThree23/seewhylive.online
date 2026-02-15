import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Pin, Send, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment';

export default function DiscussionFeed({ communityId }) {
  const [newPost, setNewPost] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: discussions = [], isLoading } = useQuery({
    queryKey: ['discussions', communityId],
    queryFn: () => base44.entities.Discussion.filter(
      { community_id: communityId, parent_id: null },
      '-created_date'
    ),
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.Discussion.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', communityId] });
      setNewPost('');
      setReplyTo(null);
      toast.success('Posted!');
    },
  });

  const handlePost = () => {
    if (!newPost.trim()) return;
    
    createPostMutation.mutate({
      community_id: communityId,
      user_id: user.id,
      user_name: user.full_name,
      user_avatar: user.avatar_url,
      content: newPost,
      parent_id: replyTo?.id,
    });
  };

  if (isLoading) {
    return <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>;
  }

  return (
    <div className="space-y-4">
      {/* Create Post */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>{user?.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              {replyTo && (
                <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md flex justify-between items-center">
                  <span>Replying to {replyTo.user_name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                    Cancel
                  </Button>
                </div>
              )}
              <Textarea
                placeholder="Share your thoughts with the community..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="icon">
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button onClick={handlePost} disabled={!newPost.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discussion Posts */}
      <AnimatePresence>
        {discussions.map((discussion) => (
          <DiscussionCard
            key={discussion.id}
            discussion={discussion}
            onReply={(disc) => {
              setReplyTo(disc);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            communityId={communityId}
          />
        ))}
      </AnimatePresence>

      {discussions.length === 0 && (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
          <p className="text-muted-foreground">Be the first to start a conversation!</p>
        </div>
      )}
    </div>
  );
}

function DiscussionCard({ discussion, onReply, communityId }) {
  const [showReplies, setShowReplies] = useState(false);
  const queryClient = useQueryClient();

  const { data: replies = [] } = useQuery({
    queryKey: ['discussion-replies', discussion.id],
    queryFn: () => base44.entities.Discussion.filter(
      { parent_id: discussion.id },
      'created_date'
    ),
    enabled: showReplies,
  });

  const likeMutation = useMutation({
    mutationFn: () => base44.entities.Discussion.update(discussion.id, {
      likes_count: discussion.likes_count + 1,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', communityId] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={discussion.is_pinned ? 'border-purple-500' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={discussion.user_avatar} />
                <AvatarFallback>{discussion.user_name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{discussion.user_name}</p>
                  {discussion.is_pinned && (
                    <Pin className="w-3 h-3 text-purple-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {moment(discussion.created_date).fromNow()}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {discussion.title && (
            <h3 className="font-semibold text-lg">{discussion.title}</h3>
          )}
          <p className="text-sm whitespace-pre-wrap">{discussion.content}</p>

          {discussion.images?.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {discussion.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt=""
                  className="rounded-lg w-full h-48 object-cover"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => likeMutation.mutate()}
              className="flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              {discussion.likes_count > 0 && (
                <span className="text-xs">{discussion.likes_count}</span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {discussion.replies_count > 0 && (
                <span className="text-xs">{discussion.replies_count}</span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(discussion)}
            >
              Reply
            </Button>
          </div>

          {/* Replies */}
          {showReplies && replies.length > 0 && (
            <div className="ml-8 space-y-3 pt-4 border-t">
              {replies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={reply.user_avatar} />
                    <AvatarFallback>{reply.user_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold">{reply.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {moment(reply.created_date).fromNow()}
                      </p>
                    </div>
                    <p className="text-sm">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}