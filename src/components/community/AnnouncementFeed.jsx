import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Megaphone, Pin, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const GOLD = '#D4AF37';
const BG = '#080B18';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function AnnouncementFeed({ communityId }) {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', communityId],
    queryFn: () => base44.entities.Announcement.filter(
      { community_id: communityId, status: 'sent' },
      '-sent_at'
    ),
  });

  const priorityBadgeColors = {
    low:    { background: 'rgba(156,163,175,0.2)', color: '#9ca3af' },
    normal: { background: 'rgba(59,130,246,0.2)',  color: '#60a5fa' },
    high:   { background: 'rgba(249,115,22,0.2)',  color: '#fb923c' },
    urgent: { background: 'rgba(239,68,68,0.2)',   color: '#f87171' },
  };

  const priorityIcons = {
    urgent: <AlertCircle className="w-4 h-4" style={{ display: 'inline', marginRight: 4 }} />,
  };

  if (isLoading) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', ...T }}>
        Loading announcements...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          style={{
            background: announcement.is_pinned ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${announcement.is_pinned ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: announcement.priority === 'urgent' ? 'rgba(239,68,68,0.15)' : 'rgba(212,175,55,0.15)',
              flexShrink: 0,
            }}>
              {announcement.is_pinned ? (
                <Pin className="w-5 h-5" style={{ color: '#D4AF37' }} />
              ) : (
                <Megaphone className="w-5 h-5" style={{ color: announcement.priority === 'urgent' ? '#f87171' : '#D4AF37' }} />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <h4 style={{ fontWeight: 700, color: '#fff', margin: 0, ...T }}>{announcement.title}</h4>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', ...T }}>
                    {format(new Date(announcement.sent_at), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                  ...priorityBadgeColors[announcement.priority],
                  ...T,
                }}>
                  {priorityIcons[announcement.priority]}
                  {announcement.priority}
                </span>
              </div>

              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-wrap', margin: 0, ...T }}>
                {announcement.content}
              </p>

              {announcement.target_audience !== 'all' && (
                <div style={{ marginTop: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)', ...T,
                  }}>
                    Target: {announcement.target_audience.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {announcements.length === 0 && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <Megaphone className="w-12 h-12" style={{ display: 'block', margin: '0 auto 12px', color: 'rgba(255,255,255,0.2)' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, ...T }}>No announcements yet</p>
        </div>
      )}
    </div>
  );
}
