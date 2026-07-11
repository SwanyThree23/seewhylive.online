import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Calendar, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const CARD = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden' };
const CARD_HEADER = { padding:'16px 20px 12px' };
const CARD_CONTENT = { padding:'0 20px 20px' };
const INPUT_STYLE = { width:'100%', padding:'10px 14px', background:'rgba(17,8,34,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' };
const TEXTAREA_STYLE = { ...INPUT_STYLE, resize:'none', minHeight:80 };
const SELECT_STYLE = { ...INPUT_STYLE };
const LABEL_STYLE = { fontSize:13, fontWeight:600, display:'block', marginBottom:6, color:'rgba(255,255,255,0.8)' };

const priorityBadgeColors = {
  low:    { background:'rgba(156,163,175,0.15)', color:'#9ca3af' },
  normal: { background:'rgba(59,130,246,0.15)',  color:'#60a5fa' },
  high:   { background:'rgba(249,115,22,0.15)',  color:'#fb923c' },
  urgent: { background:'rgba(239,68,68,0.15)',   color:'#f87171' },
};

function Badge({ label, style }) {
  return (
    <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, fontFamily:'Barlow Condensed, sans-serif', ...style }}>
      {label}
    </span>
  );
}

export default function AnnouncementScheduler({ communityId, userId }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targetAudience, setTargetAudience] = useState('all');
  const [isPinned, setIsPinned] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const queryClient = useQueryClient();

  const { data: announcements = [] } = useQuery({
    queryKey: ['communityAnnouncements', communityId],
    queryFn: () => base44.entities.Announcement.filter({ community_id: communityId }, '-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: async (announcementData) => {
      return await base44.entities.Announcement.create(announcementData);
    },
    onSuccess: () => {
      toast.success('Announcement created!');
      queryClient.invalidateQueries(['communityAnnouncements']);
      resetForm();
    },
    onError: () => { toast.error('Failed to create announcement. Please try again.'); },
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority('normal');
    setTargetAudience('all');
    setIsPinned(false);
    setScheduleDate('');
    setScheduleTime('');
  };

  const handleSubmit = (sendNow = false) => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    let scheduledFor = null;
    let status = 'draft';

    if (sendNow) {
      status = 'sent';
    } else if (scheduleDate && scheduleTime) {
      scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      status = 'scheduled';
    }

    createMutation.mutate({
      community_id: communityId,
      title: title.trim(),
      content: content.trim(),
      priority,
      target_audience: targetAudience,
      is_pinned: isPinned,
      scheduled_for: scheduledFor,
      sent_at: sendNow ? new Date().toISOString() : null,
      status,
      created_by: userId,
    });
  };

  const draftAnnouncements = announcements.filter(a => a.status === 'draft');
  const scheduledAnnouncements = announcements.filter(a => a.status === 'scheduled');
  const sentAnnouncements = announcements.filter(a => a.status === 'sent');

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
      {/* Create Form */}
      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        <div style={CARD}>
          <div style={CARD_HEADER}>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>
              <Megaphone style={{ width:20, height:20 }} />
              Create Announcement
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>Communicate with your community members</p>
          </div>
          <div style={CARD_CONTENT}>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={LABEL_STYLE}>Title *</label>
                <input
                  style={INPUT_STYLE}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <label style={LABEL_STYLE}>Content *</label>
                <textarea
                  style={{ ...TEXTAREA_STYLE, minHeight:100 }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What do you want to announce?"
                  rows={5}
                />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <label style={LABEL_STYLE}>Priority</label>
                  <select style={SELECT_STYLE} value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={LABEL_STYLE}>Target Audience</label>
                  <select style={SELECT_STYLE} value={targetAudience} onChange={e => setTargetAudience(e.target.value)}>
                    <option value="all">All Members</option>
                    <option value="admins">Admins</option>
                    <option value="moderators">Moderators</option>
                    <option value="subscribers">Subscribers</option>
                    <option value="new_members">New Members</option>
                  </select>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)' }}>Pin to Top</label>
                <div onClick={() => setIsPinned(v => !v)} style={{ width:40, height:22, borderRadius:99, background: isPinned ? '#800020' : 'rgba(255,255,255,0.1)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:3, left: isPinned ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                </div>
              </div>

              <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:16 }}>
                <label style={LABEL_STYLE}>Schedule (Optional)</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <input
                    type="date"
                    style={INPUT_STYLE}
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                  <input
                    type="time"
                    style={INPUT_STYLE}
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display:'flex', gap:8, paddingTop:8 }}>
                <button
                  onClick={() => handleSubmit(true)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', background:'#D4AF37', color:'#000', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Barlow Condensed, sans-serif' }}
                >
                  <Send style={{ width:16, height:16 }} />
                  Send Now
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', background:'transparent', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Barlow Condensed, sans-serif' }}
                >
                  <Clock style={{ width:16, height:16 }} />
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {/* Scheduled */}
        <div style={CARD}>
          <div style={CARD_HEADER}>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:16, fontWeight:700, color:'#fff' }}>
              <Calendar style={{ width:20, height:20 }} />
              Scheduled ({scheduledAnnouncements.length})
            </div>
          </div>
          <div style={CARD_CONTENT}>
            {scheduledAnnouncements.length === 0 ? (
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', textAlign:'center', padding:'16px 0' }}>No scheduled announcements</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {scheduledAnnouncements.map((ann) => (
                  <div key={ann.id} style={{ border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:12 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                      <p style={{ fontWeight:600, color:'#fff', margin:0 }}>{ann.title}</p>
                      <Badge label={ann.priority} style={priorityBadgeColors[ann.priority] || {}} />
                    </div>
                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>
                      Scheduled: {ann.scheduled_for ? format(new Date(ann.scheduled_for), 'PPp') : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Sent */}
        <div style={CARD}>
          <div style={CARD_HEADER}>
            <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Recent Sent ({sentAnnouncements.length})</div>
          </div>
          <div style={CARD_CONTENT}>
            {sentAnnouncements.slice(0, 5).length === 0 ? (
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', textAlign:'center', padding:'16px 0' }}>No sent announcements</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {sentAnnouncements.slice(0, 5).map((ann) => (
                  <div key={ann.id} style={{ border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:12, opacity:0.75 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                      <p style={{ fontWeight:600, color:'#fff', margin:0 }}>{ann.title}</p>
                      <Badge label="sent" style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)' }} />
                    </div>
                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>
                      Sent: {ann.sent_at ? format(new Date(ann.sent_at), 'PPp') : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
