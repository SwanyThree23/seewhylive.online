import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DollarSign, Heart, Star, Award } from 'lucide-react';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(8,11,24,0.85)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Barlow Condensed, sans-serif',
};

export default function TippingModal({ isOpen, onClose, recipient, roomId, communityId }) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const queryClient = useQueryClient();

  const quickAmounts = [
    { value: 5, icon: Heart, label: '$5' },
    { value: 10, icon: Star, label: '$10' },
    { value: 25, icon: Award, label: '$25' },
  ];

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const sendTipMutation = useMutation({
    mutationFn: async (tipData) => {
      return await base44.entities.Transaction.create(tipData);
    },
    onSuccess: () => {
      toast.success('Tip sent successfully! 💸');
      queryClient.invalidateQueries(['transactions']);
      onClose();
      setAmount('');
      setMessage('');
      setSelectedAmount(null);
    },
    onError: () => {
      toast.error('Failed to send tip');
    },
  });

  const handleSendTip = () => {
    const tipAmount = selectedAmount || parseFloat(amount);

    if (!tipAmount || tipAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    sendTipMutation.mutate({
      type: 'tip',
      amount: tipAmount,
      from_user_id: currentUser?.id,
      to_user_id: recipient.user_id || recipient.id,
      room_id: roomId,
      community_id: communityId,
      message: message,
      status: 'completed',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: 480, background: 'rgba(8,11,24,0.98)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontWeight: 900, fontSize: 14, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>Send a Tip</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            Support {recipient?.name || 'this creator'} with a tip
          </p>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {quickAmounts.map((quick) => {
              const Icon = quick.icon;
              return (
                <button
                  key={quick.value}
                  onClick={() => { setSelectedAmount(quick.value); setAmount(''); }}
                  style={{
                    height: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: selectedAmount === quick.value ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                    border: selectedAmount === quick.value ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, cursor: 'pointer', color: selectedAmount === quick.value ? '#D4AF37' : '#fff',
                    fontFamily: 'Barlow Condensed, sans-serif',
                  }}
                >
                  <Icon style={{ width: 20, height: 20 }} />
                  <span style={{ fontWeight: 700 }}>{quick.label}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#fff', display: 'block', marginBottom: 8, fontFamily: 'Barlow Condensed, sans-serif' }}>Custom Amount</label>
            <div style={{ position: 'relative' }}>
              <DollarSign style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(255,255,255,0.4)' }} />
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setSelectedAmount(null); }}
                min="1"
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#fff', display: 'block', marginBottom: 8, fontFamily: 'Barlow Condensed, sans-serif' }}>Message (Optional)</label>
            <textarea
              placeholder="Add a message with your tip..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'none', minHeight: 80 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: '10px 0', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSendTip}
              disabled={sendTipMutation.isPending}
              style={{ flex: 1, padding: '10px 0', background: 'linear-gradient(135deg, #800020, #D4854A)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: sendTipMutation.isPending ? 'not-allowed' : 'pointer', opacity: sendTipMutation.isPending ? 0.7 : 1, fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {sendTipMutation.isPending ? 'Sending...' : 'Send Tip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
