import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Copy, Check, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

const BETA_REFERRAL_BASE = `${window.location.origin}/Welcome`;

export default function InviteUsersPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [invitedList, setInvitedList] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin';
  const referralLink = `${BETA_REFERRAL_BASE}?ref=${user?.id}`;

  const handleInvite = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setInviting(true);
    try {
      await base44.users.inviteUser(email.trim(), isAdmin ? role : 'user');
      setInvitedList(prev => [...prev, { email: email.trim(), role: isAdmin ? role : 'user', sentAt: new Date() }]);
      toast.success(`Invite sent to ${email.trim()}!`);
      setEmail('');
    } catch (err) {
      toast.error('Failed to send invite. They may already be registered.');
    }
    setInviting(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    toast.success('Beta invite link copied!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-3xl mx-auto px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Invite to Beta</h1>
            <p className="text-sm text-muted-foreground">Invite users to join SeeWhy LIVE beta testing</p>
          </div>
          <Badge className="ml-auto bg-amber-500 text-black font-bold">BETA</Badge>
        </div>

        {/* Beta stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{invitedList.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Invited This Session</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-green-600">∞</p>
              <p className="text-xs text-muted-foreground mt-1">Slots Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-blue-600">Free</p>
              <p className="text-xs text-muted-foreground mt-1">Beta Access</p>
            </CardContent>
          </Card>
        </div>

        {/* Invite by email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Invite by Email
            </CardTitle>
            <CardDescription>Send a direct invite — they'll receive an email with login instructions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                className="flex-1"
              />
              {isAdmin && (
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="border border-input rounded-md px-3 text-sm bg-background"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              )}
              <Button onClick={handleInvite} disabled={inviting} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                {inviting ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
            {!isAdmin && (
              <p className="text-xs text-muted-foreground">
                <Shield className="w-3 h-3 inline mr-1" />
                Only admins can invite with admin role. Your invites will be standard users.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Share beta link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5" />
              Share Beta Invite Link
            </CardTitle>
            <CardDescription>Anyone with this link can join the beta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="flex-1 text-xs text-blue-600 font-mono" />
              <Button onClick={handleCopyLink} variant={copiedLink ? 'default' : 'outline'} className={copiedLink ? 'bg-green-600 text-white' : ''}>
                {copiedLink ? <><Check className="w-4 h-4 mr-1" /> Copied!</> : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invited this session */}
        {invitedList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Invited This Session ({invitedList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invitedList.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">{inv.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{inv.role}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {inv.sentAt.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Beta info */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <span className="text-3xl">🚀</span>
              <div>
                <h3 className="font-semibold text-amber-900">SeeWhy LIVE — Beta Testing</h3>
                <p className="text-sm text-amber-700 mt-1">
                  We're in active beta. All features are functional and multi-user ready.
                  Please report any bugs via the platform or to your admin.
                  The 90/10 revenue split is locked in for all beta testers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}