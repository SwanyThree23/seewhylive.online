import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Flag } from 'lucide-react';
import NativeSelect from '../shared/NativeSelect';

const REPORT_REASONS = [
  { value: 'spam',                  label: 'Spam' },
  { value: 'harassment',            label: 'Harassment' },
  { value: 'hate_speech',           label: 'Hate Speech' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'impersonation',         label: 'Impersonation' },
  { value: 'other',                 label: 'Other' },
];

const OVERLAY = { position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 };
const MODAL = { background:'#080B18', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:24, width:'100%', maxWidth:480, boxShadow:'0 24px 64px rgba(0,0,0,0.8)' };
const TEXTAREA_STYLE = { width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif', resize:'none', minHeight:80 };
const SELECT_STYLE = { width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' };
const LABEL_STYLE = { fontSize:13, fontWeight:600, display:'block', marginBottom:6, color:'rgba(255,255,255,0.8)' };

export default function ReportModal({ isOpen, onClose, reportedUser, roomId, communityId, messageId }) {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const reportMutation = useMutation({
    mutationFn: async (reportData) => {
      return await base44.entities.Report.create(reportData);
    },
    onSuccess: () => {
      toast.success('Report submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      onClose();
      setReportType('');
      setDescription('');
      if (currentUser?.id) {
        base44.entities.Activity.create({
          user_id: currentUser.id,
          type: 'milestone',
          title: `Submitted moderation report: ${reportType}`,
        }).catch(() => {});
      }
    },
    onError: () => {
      toast.error('Failed to submit report');
    },
  });

  const handleSubmit = () => {
    if (!reportType || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    reportMutation.mutate({
      reporter_id: currentUser?.id,
      reported_user_id: reportedUser.user_id || reportedUser.id,
      report_type: reportType,
      description: description.trim(),
      room_id: roomId,
      community_id: communityId,
      message_id: messageId,
      status: 'pending',
      priority: reportType === 'hate_speech' || reportType === 'harassment' ? 'high' : 'medium',
    });
  };

  if (!isOpen) return null;

  return (
    <div style={OVERLAY} onClick={onClose}>
      <div style={MODAL} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:18, fontWeight:700, color:'#fff', marginBottom:6 }}>
            <Flag style={{ width:20, height:20, color:'#D4AF37' }} />
            Report User
          </div>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', margin:0 }}>
            Report {reportedUser?.name || 'this user'} for violating community guidelines
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={LABEL_STYLE}>Reason</label>
            <NativeSelect
              value={reportType}
              onChange={setReportType}
              options={REPORT_REASONS}
              placeholder="Select reason"
            />
          </div>

          <div>
            <label style={LABEL_STYLE}>Description</label>
            <textarea
              style={{ ...TEXTAREA_STYLE, minHeight:100 }}
              placeholder="Please provide details about the violation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          <div style={{ display:'flex', gap:12, paddingTop:8 }}>
            <button
              onClick={onClose}
              style={{ flex:1, padding:'10px', background:'transparent', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Barlow Condensed, sans-serif' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={reportMutation.isPending}
              style={{ flex:1, padding:'10px', background:'#D4AF37', color:'#000', border:'none', borderRadius:8, fontWeight:700, cursor: reportMutation.isPending ? 'not-allowed' : 'pointer', opacity: reportMutation.isPending ? 0.7 : 1, fontSize:13, fontFamily:'Barlow Condensed, sans-serif' }}
            >
              {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
