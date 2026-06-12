import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, AlertCircle, CheckCircle, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const CARD = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden' };
const CARD_HEADER = { padding:'16px 20px 12px' };
const CARD_CONTENT = { padding:'0 20px 20px' };
const TEXTAREA_STYLE = { width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif', resize:'none', minHeight:80 };
const SELECT_STYLE = { width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' };
const LABEL_STYLE = { fontSize:13, fontWeight:600, display:'block', marginBottom:6, color:'rgba(255,255,255,0.8)' };

const priorityBadge = {
  low:    { background:'rgba(156,163,175,0.15)', color:'#9ca3af' },
  medium: { background:'rgba(212,175,55,0.15)',  color:'#D4AF37' },
  high:   { background:'rgba(212,133,74,0.15)',  color:'#D4854A' },
  urgent: { background:'rgba(239,68,68,0.15)',   color:'#f87171' },
};

const statusBadge = {
  pending:      { background:'rgba(234,179,8,0.15)',   color:'#facc15' },
  under_review: { background:'rgba(212,175,55,0.15)',  color:'#D4AF37' },
  resolved:     { background:'rgba(109,191,126,0.15)',   color:'#6DBF7E' },
  dismissed:    { background:'rgba(156,163,175,0.15)', color:'#9ca3af' },
};

function Badge({ label, badgeStyle }) {
  return (
    <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, fontFamily:'Barlow Condensed, sans-serif', ...badgeStyle }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div style={CARD}>
      <div style={CARD_HEADER}>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:4 }}>{label}</p>
        <p style={{ fontSize:30, fontWeight:900, color: color || '#fff', margin:0, fontFamily:'Barlow Condensed, sans-serif' }}>{value}</p>
      </div>
      <div style={CARD_CONTENT}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(255,255,255,0.4)' }}>
          {Icon && <Icon style={{ width:16, height:16 }} />}
          <span>{sub}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReportsManager({ communityId, userId }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ['communityReports', communityId],
    queryFn: () => base44.entities.Report.filter({ community_id: communityId }, '-created_date'),
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, data }) => {
      return await base44.entities.Report.update(reportId, data);
    },
    onSuccess: () => {
      toast.success('Report updated');
      queryClient.invalidateQueries(['communityReports']);
      setSelectedReport(null);
      setResolutionNotes('');
      setActionTaken('');
    },
  });

  const handleResolve = (report, status) => {
    updateReportMutation.mutate({
      reportId: report.id,
      data: {
        status,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        resolution_notes: resolutionNotes || null,
        action_taken: actionTaken || null,
      },
    });
  };

  const pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'under_review');
  const resolvedReports = reports.filter(r => r.status === 'resolved' || r.status === 'dismissed');

  const resolvedTodayCount = resolvedReports.filter(r => {
    const date = r.reviewed_at ? new Date(r.reviewed_at) : null;
    return date && date.toDateString() === new Date().toDateString();
  }).length;

  const btnPrimary = { padding:'6px 14px', background:'#D4AF37', color:'#000', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:12, fontFamily:'Barlow Condensed, sans-serif' };
  const btnOutline = { padding:'6px 14px', background:'transparent', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:12, fontFamily:'Barlow Condensed, sans-serif' };
  const btnGhost  = { padding:'6px 14px', background:'transparent', color:'rgba(255,255,255,0.4)', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:12, fontFamily:'Barlow Condensed, sans-serif' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
        <StatCard label="Pending Reports" value={pendingReports.length} icon={Flag} sub="Require attention" />
        <StatCard label="Resolved Today" value={resolvedTodayCount} color="#6DBF7E" icon={CheckCircle} sub="Cases handled" />
        <StatCard label="Total Reports" value={reports.length} icon={Shield} sub="All time" />
      </div>

      {/* Pending Reports */}
      <div style={CARD}>
        <div style={CARD_HEADER}>
          <p style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>Pending Reports ({pendingReports.length})</p>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>Reports requiring moderation</p>
        </div>
        <div style={{ ...CARD_CONTENT, display:'flex', flexDirection:'column', gap:16 }}>
          {pendingReports.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 0' }}>
              <CheckCircle style={{ width:48, height:48, color:'#6DBF7E', margin:'0 auto 16px' }} />
              <p style={{ color:'rgba(255,255,255,0.4)' }}>All caught up! No pending reports.</p>
            </div>
          ) : (
            pendingReports.map((report) => (
              <div key={report.id} style={{ border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:16, display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                      <Badge label={report.priority} badgeStyle={priorityBadge[report.priority] || {}} />
                      <Badge label={report.status} badgeStyle={statusBadge[report.status] || {}} />
                      <Badge label={report.report_type} badgeStyle={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)' }} />
                    </div>
                    <p style={{ fontWeight:600, color:'#fff', margin:0 }}>User ID: {report.reported_user_id}</p>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', margin:'4px 0 0' }}>
                      Reported by: {report.reporter_id} • {format(new Date(report.created_date), 'PPp')}
                    </p>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)', marginBottom:4 }}>Description:</p>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', margin:0 }}>{report.description}</p>
                </div>

                {selectedReport?.id === report.id ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:12, borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:12 }}>
                    <div>
                      <label style={LABEL_STYLE}>Action Taken</label>
                      <select style={SELECT_STYLE} value={actionTaken} onChange={e => setActionTaken(e.target.value)}>
                        <option value="">Select action</option>
                        <option value="warning_issued">Warning Issued</option>
                        <option value="user_muted">User Muted</option>
                        <option value="user_banned">User Banned</option>
                        <option value="content_removed">Content Removed</option>
                        <option value="no_action">No Action Required</option>
                      </select>
                    </div>

                    <div>
                      <label style={LABEL_STYLE}>Resolution Notes</label>
                      <textarea
                        style={TEXTAREA_STYLE}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Add notes about your decision..."
                        rows={3}
                      />
                    </div>

                    <div style={{ display:'flex', gap:8 }}>
                      <button style={btnPrimary} onClick={() => handleResolve(report, 'resolved')}>Resolve</button>
                      <button style={btnOutline} onClick={() => handleResolve(report, 'dismissed')}>Dismiss</button>
                      <button style={btnGhost} onClick={() => setSelectedReport(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button style={btnPrimary} onClick={() => setSelectedReport(report)}>Review Report</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
