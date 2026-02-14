import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function CommunitySettingsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(c => c[0]),
    enabled: !!communityId,
  });

  React.useEffect(() => {
    if (community) {
      setName(community.name || '');
      setDescription(community.description || '');
      setRules(community.rules || '');
      setIsPublic(community.is_public ?? true);
    }
  }, [community]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Community.update(communityId, data);
    },
    onSuccess: () => {
      toast.success('Community updated!');
      queryClient.invalidateQueries(['community']);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Community Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your community details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Rules</label>
              <Textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>Control who can join</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Public Community</p>
                <p className="text-sm text-muted-foreground">Anyone can join</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={() => updateMutation.mutate({ name, description, rules, is_public: isPublic })}
          disabled={updateMutation.isPending}
          className="w-full"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}