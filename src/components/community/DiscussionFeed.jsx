import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Heart, MessageCircle, Pin } from 'lucide-react';

const G = '#D4AF37';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

export default function DiscussionFeed({ communityId }) {
  const [newPost, setNewPost] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: discussions } = useQuery({
    queryKey: ['communityDiscussions', communityId],
    queryFn: () =>
      base44.entities.Discussion.filter(
        { community_id: communityId, parent_id: null },
        '-created_date',
        50
      ),
    enabled: !!communityId,
  });

  const createPostMutation = useMutation({
    mutationFn: async (content) => {
      if (!user?.id) throw new Error('Not authenticated');
      return base44.entities.Discussion.create({
        community_id: communityId,
        user_id: user.id,
        user_name: user.full_name,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityDiscussions', communityId] });
      setNewPost('');
    },
  });

  return (
    <div className="space-y-4">
      {/* New Post */}
      {user?.id && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg"
          style={{ background: PANEL, border: `1px solid ${BORDER}` }}
        >
          <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#800020] to-[#D4854A]" />
            <textarea
              placeholder="Share your thoughts with the community..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none resize-none text-white placeholder-white/40"
              rows="3"
            />
          </div>
          <div className="flex justify-end gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setNewPost('')}
              className="px-4 py-1.5 rounded text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => createPostMutation.mutate(newPost)}
              disabled={!newPost.trim()}
              className="px-4 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50"
              style={{ background: G, color: '#000' }}
            >
              Post
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Discussions */}
      <div className="space-y-3">
        {discussions?.map((post, idx) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 rounded-lg"
            style={{ background: PANEL, border: `1px solid ${BORDER}` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                <div>
                  <p className="text-sm font-bold text-white">{post.user_name}</p>
                  <p className="text-[10px] text-white/40">{new Date(post.created_date).toLocaleDateString()}</p>
                </div>
              </div>
              {post.is_pinned && <Pin className="w-4 h-4" style={{ color: G }} />}
            </div>

            {/* Content */}
            <p className="text-sm text-white/80 mb-3">{post.content}</p>

            {/* Stats */}
            <div className="flex gap-4 text-[10px] text-white/60">
              <button className="flex items-center gap-1 hover:text-white/80 transition-colors">
                <Heart className="w-3.5 h-3.5" />
                {post.likes_count || 0}
              </button>
              <button className="flex items-center gap-1 hover:text-white/80 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
                {post.replies_count || 0}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {!discussions || discussions.length === 0 && (
        <p className="text-center text-white/40 py-8">No discussions yet. Be the first to share!</p>
      )}
    </div>
  );
}