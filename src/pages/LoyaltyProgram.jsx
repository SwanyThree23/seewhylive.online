import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Star, Gift, Trophy, Users, Zap, Download, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const REWARD_TYPES = [
  { id: 'badge', label: '🏅 Badge', icon: '🏅' },
  { id: 'discount_code', label: '🎟 Discount Code', icon: '🎟' },
  { id: 'exclusive_content', label: '🔒 Exclusive Content', icon: '🔒' },
  { id: 'shoutout', label: '📣 Shoutout', icon: '📣' },
  { id: 'custom_emote', label: '😎 Custom Emote', icon: '😎' },
];

const TIER_COLORS = ['#cd7f32', '#c0c0c0', '#d4af37', '#00d4ff', '#a78bfa'];
const TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Diamond', 'Legend'];

function getTierIndex(points, rewards) {
  const sorted = [...rewards].sort((a, b) => a.points_required - b.points_required);
  let idx = -1;
  sorted.forEach((r, i) => { if (points >= r.points_required) idx = i; });
  return idx;
}

export default function LoyaltyProgram() {
  const qc = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const creatorId = urlParams.get('creator');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const isOwnProgram = !creatorId || creatorId === user?.id;

  const { data: rewards = [] } = useQuery({
    queryKey: ['loyalty-rewards', creatorId || user?.id],
    queryFn: () => base44.entities.LoyaltyReward.filter({ creator_id: creatorId || user?.id }, 'points_required'),
    enabled: !!(user || creatorId),
  });

  const { data: myPoints } = useQuery({
    queryKey: ['my-viewer-points', user?.id, creatorId],
    queryFn: () => base44.entities.ViewerPoints.filter({ user_id: user?.id, room_id: creatorId }).then(r => r[0]),
    enabled: !!user && !!creatorId,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['points-leaderboard', creatorId || user?.id],
    queryFn: () => base44.entities.ViewerPoints.filter({ room_id: creatorId || user?.id }, '-points', 50),
    enabled: !!(user || creatorId),
  });

  const [showRewardForm, setShowRewardForm] = useState(false);
  const [rewardForm, setRewardForm] = useState({ name: '', description: '', points_required: 100, reward_type: 'badge', reward_value: '', is_active: true });
  const [earnConfig] = useState({ watch: 1, message: 2, tip: 10, subscribe: 100, reaction: 1 });

  const createRewardMutation = useMutation({
    mutationFn: (data) => base44.entities.LoyaltyReward.create(data),
    onSuccess: () => { qc.invalidateQueries(['loyalty-rewards']); setShowRewardForm(false); toast.success('Reward created!'); },
  });
  const toggleRewardMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.LoyaltyReward.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries(['loyalty-rewards']),
  });
  const deleteRewardMutation = useMutation({
    mutationFn: (id) => base44.entities.LoyaltyReward.delete(id),
    onSuccess: () => qc.invalidateQueries(['loyalty-rewards']),
  });

  const totalDistributed = leaderboard.reduce((s, l) => s + (l.points || 0), 0);
  const userPoints = myPoints?.points || 0;
  const sortedRewards = [...rewards].sort((a, b) => a.points_required - b.points_required);
  const nextReward = sortedRewards.find(r => r.points_required > userPoints);
  const progressToNext = nextReward ? (userPoints / nextReward.points_required) * 100 : 100;

  const exportData = () => {
    const rows = leaderboard.map((l, i) => `${i + 1},${l.user_id},${l.points},${l.watch_minutes},${l.messages_sent_count}`);
    const csv = 'Rank,UserID,Points,WatchMinutes,Messages\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'loyalty-data.csv'; a.click();
  };

  return (
    <div className="min-h-screen bg-[#0d0618] text-white p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#d4af37] flex items-center gap-2">
              <Star className="w-6 h-6" /> Loyalty Program
            </h1>
            <p className="text-sm text-white/50">{isOwnProgram ? 'Manage your viewer rewards' : 'Earn points and redeem rewards'}</p>
          </div>
          {isOwnProgram && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportData}
                className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 gap-1.5 text-xs">
                <Download className="w-3 h-3" /> Export
              </Button>
              <Button onClick={() => setShowRewardForm(true)}
                className="bg-[#d4af37] hover:bg-[#f5e6a3] text-black font-bold gap-1.5">
                <Plus className="w-4 h-4" /> Add Reward
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue={isOwnProgram ? 'creator' : 'viewer'}>
          <TabsList className="bg-white/5 border border-white/10">
            {isOwnProgram && <TabsTrigger value="creator" className="text-white/50 data-[state=active]:text-[#d4af37] data-[state=active]:bg-[#d4af37]/10">Creator View</TabsTrigger>}
            {!isOwnProgram && <TabsTrigger value="viewer" className="text-white/50 data-[state=active]:text-[#d4af37] data-[state=active]:bg-[#d4af37]/10">My Progress</TabsTrigger>}
            <TabsTrigger value="rewards" className="text-white/50 data-[state=active]:text-[#d4af37] data-[state=active]:bg-[#d4af37]/10">Rewards</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-white/50 data-[state=active]:text-[#d4af37] data-[state=active]:bg-[#d4af37]/10">Leaderboard</TabsTrigger>
          </TabsList>

          {/* CREATOR VIEW */}
          {isOwnProgram && (
            <TabsContent value="creator" className="space-y-5 mt-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Points Distributed', value: totalDistributed.toLocaleString(), color: '#d4af37', icon: Star },
                  { label: 'Active Viewers', value: leaderboard.length, color: '#00d4ff', icon: Users },
                  { label: 'Rewards Available', value: rewards.filter(r => r.is_active).length, color: '#22c55e', icon: Gift },
                ].map(stat => (
                  <Card key={stat.label} className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)]">
                    <CardContent className="p-4">
                      <p className="text-[10px] text-white/40 uppercase">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Points Earn Config */}
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)]">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-[#d4af37]">Points Earn Rate</CardTitle></CardHeader>
                <CardContent className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Watch (per min)', value: earnConfig.watch, icon: '⏱' },
                    { label: 'Message sent', value: earnConfig.message, icon: '💬' },
                    { label: 'Per $1 tipped', value: earnConfig.tip, icon: '💰' },
                    { label: 'Subscribe bonus', value: earnConfig.subscribe, icon: '⭐' },
                    { label: 'Reaction', value: earnConfig.reaction, icon: '❤️' },
                  ].map(e => (
                    <div key={e.label} className="bg-white/5 rounded-xl p-3 text-center">
                      <span className="text-xl">{e.icon}</span>
                      <p className="text-lg font-bold text-[#fbbf24] mt-1">+{e.value}</p>
                      <p className="text-[10px] text-white/40">{e.label}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* VIEWER VIEW */}
          {!isOwnProgram && (
            <TabsContent value="viewer" className="space-y-5 mt-5">
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.2)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] to-[#800020] flex items-center justify-center">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#fbbf24]">{userPoints.toLocaleString()} pts</p>
                      <p className="text-sm text-white/50">
                        {nextReward ? `${(nextReward.points_required - userPoints).toLocaleString()} pts to ${nextReward.name}` : 'All rewards unlocked! 🎉'}
                      </p>
                    </div>
                  </div>
                  {nextReward && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/40">Progress to {nextReward.name}</span>
                        <span className="text-[#fbbf24]">{Math.round(progressToNext)}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#fbbf24]"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* REWARDS */}
          <TabsContent value="rewards" className="space-y-3 mt-5">
            {sortedRewards.length === 0 ? (
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)]">
                <CardContent className="p-12 text-center">
                  <Gift className="w-12 h-12 mx-auto text-white/20 mb-3" />
                  <p className="text-white/40">No rewards configured yet</p>
                </CardContent>
              </Card>
            ) : sortedRewards.map((r, i) => {
              const canClaim = !isOwnProgram && userPoints >= r.points_required;
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`bg-[rgba(255,255,255,0.04)] transition-all ${canClaim ? 'border-[#d4af37]/50' : 'border-white/5'}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: `${TIER_COLORS[i % 5]}20`, border: `1px solid ${TIER_COLORS[i % 5]}40` }}>
                        {REWARD_TYPES.find(rt => rt.id === r.reward_type)?.icon || '🎁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{r.name}</p>
                          {!r.is_active && <Badge className="text-[9px] bg-white/10 text-white/30">Inactive</Badge>}
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">{r.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-bold" style={{ color: TIER_COLORS[i % 5] }}>
                            {r.points_required.toLocaleString()} pts
                          </span>
                          <span className="text-[10px] text-white/30">{r.claimed_count || 0} claimed</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isOwnProgram ? (
                          <div className="flex gap-1.5">
                            <Switch checked={r.is_active} onCheckedChange={v => toggleRewardMutation.mutate({ id: r.id, is_active: v })}
                              className="scale-75 data-[state=checked]:bg-[#d4af37]" />
                            <button onClick={() => deleteRewardMutation.mutate(r.id)}
                              className="w-7 h-7 rounded-lg hover:bg-red-900/20 flex items-center justify-center text-white/30 hover:text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : canClaim ? (
                          <Button size="sm" className="bg-[#d4af37] text-black font-bold hover:bg-[#f5e6a3] text-xs">
                            <Gift className="w-3 h-3 mr-1" /> Redeem
                          </Button>
                        ) : (
                          <p className="text-[10px] text-white/30">{(r.points_required - userPoints).toLocaleString()} more</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>

          {/* LEADERBOARD */}
          <TabsContent value="leaderboard" className="mt-5">
            <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)]">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-[#d4af37] flex items-center gap-2"><Trophy className="w-4 h-4" /> Top Viewers</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {leaderboard.slice(0, 50).map((l, i) => (
                  <div key={l.id} className={`flex items-center gap-3 p-3 rounded-xl ${i < 3 ? 'bg-[#d4af37]/5 border border-[#d4af37]/10' : 'bg-white/3'}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: i < 3 ? `${TIER_COLORS[2 - i]}20` : 'rgba(255,255,255,0.05)', color: i < 3 ? TIER_COLORS[2 - i] : 'rgba(255,255,255,0.4)' }}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{l.user_id?.slice(0, 8) || 'Anonymous'}</p>
                      <p className="text-[10px] text-white/40">{l.watch_minutes || 0}min watched</p>
                    </div>
                    <p className="font-bold text-[#fbbf24] text-sm">{(l.points || 0).toLocaleString()} pts</p>
                  </div>
                ))}
                {leaderboard.length === 0 && <p className="text-center text-white/30 py-8">No viewers yet</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Reward Form */}
      <AnimatePresence>
        {showRewardForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40" onClick={() => setShowRewardForm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0d0618] border border-[rgba(212,175,55,0.25)] rounded-2xl z-50 overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#d4af37]">Create Reward</h3>
                  <button onClick={() => setShowRewardForm(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <Input value={rewardForm.name} onChange={e => setRewardForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Reward name" className="bg-white/5 border-white/20 text-white placeholder:text-white/25" />
                <Input value={rewardForm.description} onChange={e => setRewardForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description" className="bg-white/5 border-white/20 text-white placeholder:text-white/25" />
                <div className="flex gap-2">
                  <Input type="number" value={rewardForm.points_required}
                    onChange={e => setRewardForm(f => ({ ...f, points_required: Number(e.target.value) }))}
                    placeholder="Points required" className="bg-white/5 border-white/20 text-white flex-1" />
                  <select value={rewardForm.reward_type} onChange={e => setRewardForm(f => ({ ...f, reward_type: e.target.value }))}
                    className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 text-sm text-white outline-none">
                    {REWARD_TYPES.map(rt => <option key={rt.id} value={rt.id} className="bg-[#0d0618]">{rt.label}</option>)}
                  </select>
                </div>
                <Input value={rewardForm.reward_value} onChange={e => setRewardForm(f => ({ ...f, reward_value: e.target.value }))}
                  placeholder="Reward value (badge name, code, etc.)" className="bg-white/5 border-white/20 text-white placeholder:text-white/25" />
                <Button onClick={() => createRewardMutation.mutate({ ...rewardForm, creator_id: user?.id })}
                  className="w-full bg-[#d4af37] hover:bg-[#f5e6a3] text-black font-bold">
                  <Check className="w-4 h-4 mr-1.5" /> Create Reward
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}