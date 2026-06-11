import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Megaphone, Send, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box', ...T,
};

export default function AnnouncementPanel({ communityId, userId }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targetAudience, setTargetAudience] = useState('all');
  const queryClient = useQueryClient();

  const createAnnouncementMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.Announcement.create({
        community_id: communityId,
        title,
        content,
        created_by: userId,
        priority,
        target_audience: targetAudience,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      setTitle('');
      setContent('');
      setPriority('normal');
      setTargetAudience('all');
      toast.success('Announcement sent successfully!');
    },
  });

  const scheduleAnnouncementMutation = useMutation({
    mutationFn: async (scheduledTime) => {
      return await base44.entities.Announcement.create({
        community_id: communityId,
        title,
        content,
        created_by: userId,
        priority,
        target_audience: targetAudience,
        status: 'scheduled',
        scheduled_for: scheduledTime,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      setTitle('');
      setContent('');
      toast.success('Announcement scheduled!');
    },
  });

  const btnBase = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
    border: 'none', ...T,
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px', ...T }}>
          <Megaphone className="w-5 h-5" style={{ color: '#D4AF37' }} />
          Create Announcement
        </h3>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, ...T }}>
          Send targeted messages to your community members
        </p>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', ...T }}>Title</label>
          <input
            style={inputStyle}
            placeholder="Announcement title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', ...T }}>Message</label>
          <textarea
            style={{ ...inputStyle, resize: 'none', minHeight: 80 }}
            placeholder="Write your announcement here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
        </div>

        {/* Settings Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Priority */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', ...T }}>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Target Audience */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', ...T }}>Target</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            >
              <option value="all">All Members</option>
              <option value="admins">Admins Only</option>
              <option value="moderators">Moderators</option>
              <option value="subscribers">Subscribers</option>
              <option value="new_members">New Members</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        {(title || content) && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(212,175,55,0.2)', color: '#D4AF37', display: 'inline-block', marginBottom: 8, ...T }}>
              {priority.toUpperCase()}
            </span>
            <h4 style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px', ...T }}>{title || 'Untitled'}</h4>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, ...T }}>{content || 'No content'}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => createAnnouncementMutation.mutate()}
            disabled={!title || !content}
            style={{ ...btnBase, flex: 1, background: !title || !content ? 'rgba(128,0,32,0.4)' : '#800020', color: '#fff', opacity: !title || !content ? 0.5 : 1 }}
          >
            <Send className="w-4 h-4" />
            Send Now
          </button>
          <button
            disabled={!title || !content}
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              scheduleAnnouncementMutation.mutate(tomorrow.toISOString());
            }}
            style={{ ...btnBase, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', opacity: !title || !content ? 0.5 : 1 }}
          >
            <Clock className="w-4 h-4" />
            Schedule
          </button>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(59,130,246,0.1)', borderRadius: 8, padding: 12, fontSize: 13 }}>
          <AlertCircle className="w-4 h-4" style={{ color: '#60a5fa', marginTop: 2, flexShrink: 0 }} />
          <div style={{ color: 'rgba(147,197,253,0.9)' }}>
            <p style={{ fontWeight: 600, margin: '0 0 2px', ...T }}>Targeting: {targetAudience.replace('_', ' ')}</p>
            <p style={{ fontSize: 11, color: 'rgba(147,197,253,0.6)', margin: 0, ...T }}>
              This will notify members via in-app notifications
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
