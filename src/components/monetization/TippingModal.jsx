import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { DollarSign, Heart, Star, Award } from 'lucide-react';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a Tip</DialogTitle>
          <DialogDescription>
            Support {recipient?.name || 'this creator'} with a tip
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            {quickAmounts.map((quick) => {
              const Icon = quick.icon;
              return (
                <Button
                  key={quick.value}
                  variant={selectedAmount === quick.value ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedAmount(quick.value);
                    setAmount('');
                  }}
                  className="h-20 flex-col gap-2"
                >
                  <Icon className="w-5 h-5" />
                  <span>{quick.label}</span>
                </Button>
              );
            })}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Custom Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="pl-9"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Message (Optional)</label>
            <Textarea
              placeholder="Add a message with your tip..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSendTip}
              disabled={sendTipMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {sendTipMutation.isPending ? 'Sending...' : 'Send Tip'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}