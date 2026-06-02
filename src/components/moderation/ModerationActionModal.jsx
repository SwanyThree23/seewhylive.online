import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

const OVERLAY = { position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 };
const MODAL = { background:'#0d0618', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:24, width:'100%', maxWidth:480, boxShadow:'0 24px 64px rgba(0,0,0,0.8)' };
const INPUT_STYLE = { width:'100%', padding:'10px 14px', background:'rgba(17,8,34,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' };
const TEXTAREA_STYLE = { ...INPUT_STYLE, resize:'none', minHeight:80 };
const SELECT_STYLE = { ...INPUT_STYLE };
const LABEL_STYLE = { fontSize:13, fontWeight:600, display:'block', marginBottom:6, color:'rgba(255,255,255,0.8)' };

export default function ModerationActionModal({ isOpen, onClose, targetUser, roomId, communityId, moderatorId }) {
  const [actionType, setActionType] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const actionMutation = useMutation({
    mutationFn: async (actionData) => {
      return await base44.entities.ModerationAction.create(actionData);
    },
    onSuccess: () => {
      toast.success('Moderation action applied');
      queryClient.invalidateQueries(['moderationActions']);
      queryClient.invalidateQueries(['participants']);
      onClose();
      resetForm();
    },
    onError: () => {
      toast.error('Failed to apply action');
    },
  });

  const resetForm = () => {
    setActionType('');
    setReason('');
    setDuration('');
    setIsPermanent(false);
    setNotes('');
  };

  const handleSubmit = () => {
    if (!actionType || !reason.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    const expiresAt = isPermanent || !duration
      ? null
      : new Date(Date.now() + parseInt(duration) * 60000).toISOString();

    actionMutation.mutate({
      action_type: actionType,
      target_user_id: targetUser.user_id || targetUser.id,
      moderator_id: moderatorId,
      room_id: roomId,
      community_id: communityId,
      reason: reason.trim(),
      duration: duration ? parseInt(duration) : null,
      is_permanent: isPermanent,
      expires_at: expiresAt,
      is_active: true,
      notes: notes.trim() || null,
    });
  };

  if (!isOpen) return null;

  return (
    <div style={OVERLAY} onClick={onClose}>
      <div style={MODAL} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:18, fontWeight:700, color:'#fff', marginBottom:6 }}>
            <Shield style={{ width:20, height:20, color:'#D4AF37' }} />
            Moderation Action
          </div>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', margin:0 }}>
            Take action against {targetUser?.user_name || 'this user'}
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={LABEL_STYLE}>Action Type</label>
            <select style={SELECT_STYLE} value={actionType} onChange={e => setActionType(e.target.value)}>
              <option value="">Select action</option>
              <option value="warning">Warning</option>
              <option value="mute">Mute</option>
              <option value="kick">Kick from Room</option>
              <option value="ban">Ban</option>
            </select>
          </div>

          <div>
            <label style={LABEL_STYLE}>Reason *</label>
            <textarea
              style={TEXTAREA_STYLE}
              placeholder="Explain the reason for this action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {(actionType === 'mute' || actionType === 'ban') && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <label style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)' }}>Permanent</label>
                <div onClick={() => setIsPermanent(v => !v)} style={{ width:40, height:22, borderRadius:99, background: isPermanent ? '#800020' : 'rgba(255,255,255,0.1)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:3, left: isPermanent ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                </div>
              </div>

              {!isPermanent && (
                <div>
                  <label style={LABEL_STYLE}>Duration (minutes)</label>
                  <input
                    type="number"
                    style={INPUT_STYLE}
                    placeholder="e.g., 30, 60, 1440"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label style={LABEL_STYLE}>Additional Notes</label>
            <textarea
              style={{ ...TEXTAREA_STYLE, minHeight:60 }}
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
              disabled={actionMutation.isPending}
              style={{ flex:1, padding:'10px', background:'#800020', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor: actionMutation.isPending ? 'not-allowed' : 'pointer', opacity: actionMutation.isPending ? 0.7 : 1, fontSize:13, fontFamily:'Barlow Condensed, sans-serif' }}
            >
              {actionMutation.isPending ? 'Applying...' : 'Apply Action'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
