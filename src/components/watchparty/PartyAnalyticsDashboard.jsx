import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, TrendingUp, Zap, DollarSign, Clock, UserPlus, ListVideo, Play, SkipForward } from 'lucide-react';

const GOLD = '#D4AF37';
const BURGUNDY = '#800020';

function fmt(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } catch { return ''; }
}

const REACTION_COLORS = {
  domino:   GOLD,
  love:     '#CC2244',
  superchat: '#00BFFF',
  hype:     '#FF6B00',
  lol:      '#FFD700',
  wow:      '#9B59B6',
  rage:     BURGUNDY,
  standard: 'rgba(255,255,255,0.4)',
};

function StatCard({ icon: IconComp, label, value, color = GOLD }) {
  const Icon = IconComp;
  return (
    <div className="rounded-lg p-3 flex items-center gap-2.5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <div className="font-black text-lg leading-tight" style={{ color, fontFamily: 'Barlow Condensed, sans-serif' }}>{value}</div>
        <div className="text-[9px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg p-3 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="h-5 w-16 rounded mb-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-3 w-24 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-2 py-1.5 rounded text-[10px]"
      style={{ background: '#1A1A1A', border: `1px solid rgba(212,175,55,0.25)` }}>
      <div style={{ color: GOLD }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: 'rgba(255,255,255,0.7)' }}>{p.value}</div>
      ))}
    </div>
  );
};

export default function PartyAnalyticsDashboard({ partyId, isHost }) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['wpa', partyId],
    queryFn: () => base44.entities.WatchPartyAnalytics.filter({ party_id: partyId }).then(r => r[0] || null),
    enabled: !!partyId && isHost,
    refetchInterval: 15000,
  });

  if (!isHost) return null;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-10 space-y-2">
        <TrendingUp className="w-10 h-10 mx-auto" style={{ color: 'rgba(212,175,55,0.2)' }} />
        <p className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Analytics will appear once the party starts</p>
        <div className="space-y-2 mt-4">
          {[1,2].map(i => (
            <div key={i} className="h-8 rounded animate-pulse mx-8" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </div>
    );
  }

  const tipsUSD = analytics.tips_collected_cents ? `$${(analytics.tips_collected_cents / 100).toFixed(2)}` : '$0.00';

  const reactionBars = Object.entries(analytics.reaction_breakdown || {})
    .filter(([, v]) => v > 0)
    .map(([cat, count]) => ({ name: cat, count, color: REACTION_COLORS[cat] || 'gray' }))
    .sort((a, b) => b.count - a.count);

  const viewerTimeline = (analytics.viewer_timeline || []).map(pt => ({
    time: fmtTime(pt.timestamp),
    viewers: pt.viewer_count || 0,
  }));

  const mostReacted = analytics.most_reacted_timestamp != null
    ? fmt(analytics.most_reacted_timestamp)
    : null;

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
        📊 Party Analytics
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={TrendingUp} label="Peak Viewers"       value={analytics.peak_concurrent_viewers || 0} color={GOLD} />
        <StatCard icon={Users}      label="Total Joined"       value={analytics.total_members_joined || 0}    color="#00FF88" />
        <StatCard icon={Zap}        label="Total Reactions"    value={analytics.total_reactions || 0}          color="#FF6B00" />
        <StatCard icon={DollarSign} label="Tips Collected"     value={tipsUSD}                                  color={GOLD} />
        <StatCard icon={Clock}      label="Avg Watch Duration" value={fmt(analytics.avg_watch_duration_seconds)} color="#00F5FF" />
        <StatCard icon={UserPlus}   label="New Followers"      value={analytics.new_followers_from_party || 0} color="#8B5CF6" />
      </div>

      {/* Queue performance */}
      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-[8px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          Queue Performance
        </div>
        <div className="flex gap-2">
          {[
            { icon: ListVideo,   label: 'Queued', value: analytics.total_videos_queued || 0,       color: GOLD },
            { icon: Play,        label: 'Played', value: analytics.total_queue_items_played || 0,  color: '#00FF88' },
            { icon: SkipForward, label: 'Skipped', value: analytics.videos_skipped || 0,           color: '#ff6680' },
          ].map(({ icon: IconComp, label, value, color }) => {
            const Icon = IconComp;
            return (
              <div key={label} className="flex-1 rounded-lg px-2 py-1.5 text-center"
                style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <Icon className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color }} />
                <div className="font-black text-sm" style={{ color, fontFamily: 'Barlow Condensed, sans-serif' }}>{value}</div>
                <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Viewer timeline */}
      {viewerTimeline.length > 1 && (
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-[8px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Viewer Timeline
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={viewerTimeline}>
              <XAxis dataKey="time" tick={{ fontSize: 7, fill: 'rgba(255,255,255,0.2)' }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="viewers" stroke={GOLD} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reaction breakdown */}
      {reactionBars.length > 0 && (
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-[8px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Reaction Breakdown
          </div>
          <div className="space-y-1.5">
            {reactionBars.map(({ name, count, color }) => {
              const max = reactionBars[0]?.count || 1;
              const pct = Math.round((count / max) * 100);
              const emoji = REACTIONS_EMOJI[name] || '⭐';
              return (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-sm w-6 text-center">{emoji}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-[9px] font-black w-8 text-right" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Most reacted moment */}
      {mostReacted && (
        <div className="rounded-lg p-3 flex items-center gap-3"
          style={{ background: 'rgba(128,0,32,0.1)', border: `1px solid rgba(128,0,32,0.25)` }}>
          <span className="text-2xl">🔥</span>
          <div>
            <div className="text-[10px] font-black uppercase" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Most Reacted Moment
            </div>
            <div className="text-[12px] font-bold text-white">{mostReacted} into the video</div>
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Highest reaction spike</div>
          </div>
        </div>
      )}
    </div>
  );
}

const REACTIONS_EMOJI = {
  domino: '🎲', hype: '🔥', love: '❤️', lol: '😂',
  wow: '😮', rage: '😡', standard: '⭐', superchat: '💎',
};