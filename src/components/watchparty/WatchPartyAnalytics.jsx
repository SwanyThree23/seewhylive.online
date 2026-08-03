import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import SafeResponsiveContainer from '@/components/shared/SafeChart';
import { Users, TrendingUp, Clock, ThumbsUp, MessageSquare, BarChart2 } from 'lucide-react';

function StatCard({ icon: IconComp, label, value, sub, color = '#d4af37' }) {
  const Icon = IconComp;
  return (
    <div className="rounded-lg p-3 flex items-center gap-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[18px] font-black leading-tight" style={{ color, fontFamily: 'Barlow Condensed, sans-serif' }}>{value}</div>
        <div className="text-[11px] uppercase font-bold tracking-wide truncate" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</div>
        {sub && <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function WatchPartyAnalytics({ party, members, pollCount, reactionCount }) {
  const peakViewers = Math.max(members.length, party?.participant_count || 0);
  
  // Build fake time-series from member join times
  const joinTimeline = useMemo(() => {
    const sorted = [...members]
      .filter(m => m.joined_at)
      .sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at));
    
    const buckets = {};
    sorted.forEach((m, i) => {
      const t = new Date(m.joined_at);
      const label = `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`;
      buckets[label] = (buckets[label] || 0) + 1;
    });

    let cumulative = 0;
    return Object.entries(buckets).map(([time, joins]) => {
      cumulative += joins;
      return { time, viewers: cumulative };
    });
  }, [members]);

  const activeCount = members.filter(m => m.is_active).length;
  const leftCount = members.filter(m => !m.is_active).length;
  const retentionPct = members.length > 0 ? Math.round((activeCount / members.length) * 100) : 100;

  const engagementData = [
    { name: 'Reactions', value: reactionCount || 0, color: '#d4af37' },
    { name: 'Polls', value: pollCount || 0, color: '#D4AF37' },
    { name: 'Viewers', value: members.length, color: '#6DBF7E' },
  ];

  const started = party?.started_at || party?.created_date;
  const durationMin = started
    ? Math.round((Date.now() - new Date(started).getTime()) / 60000)
    : 0;

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-black uppercase tracking-widest px-1"
        style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
        📊 Party Analytics
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={Users} label="Current Viewers" value={activeCount} color="#6DBF7E" />
        <StatCard icon={TrendingUp} label="Peak Viewers" value={peakViewers} color="#d4af37" />
        <StatCard icon={Clock} label="Duration" value={`${durationMin}m`} color="#C9A84C" />
        <StatCard icon={ThumbsUp} label="Retention" value={`${retentionPct}%`} sub={`${leftCount} left`} color="#D4AF37" />
      </div>

      {/* Viewer join timeline */}
      {joinTimeline.length > 1 && (
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-[11px] font-bold uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Viewer Growth
          </div>
          <SafeResponsiveContainer width="100%" height={80}>
            <LineChart data={joinTimeline}>
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.2)' }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#0B0B18', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 6, fontSize: 10 }}
                labelStyle={{ color: '#d4af37' }}
                itemStyle={{ color: 'rgba(255,255,255,0.7)' }}
              />
              <Line type="monotone" dataKey="viewers" stroke="#d4af37" strokeWidth={2} dot={false} />
            </LineChart>
          </SafeResponsiveContainer>
        </div>
      )}

      {/* Engagement bars */}
      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-[11px] font-bold uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          Engagement Breakdown
        </div>
        <SafeResponsiveContainer width="100%" height={80}>
          <BarChart data={engagementData} barSize={20}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#0B0B18', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 6, fontSize: 10 }}
              labelStyle={{ color: '#d4af37' }}
              itemStyle={{ color: 'rgba(255,255,255,0.7)' }}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}
              fill="#d4af37"
              label={{ position: 'top', fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
            />
          </BarChart>
        </SafeResponsiveContainer>
      </div>

      {/* Member list */}
      {members.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-3 py-2 text-[11px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            Viewer List
          </div>
          <div className="max-h-36 overflow-y-auto">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between px-3 py-1.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-[10px] font-bold text-white/70">{m.user_name}</span>
                <span className="text-[11px]" style={{ color: m.is_active ? '#6DBF7E' : 'rgba(255,255,255,0.2)' }}>
                  {m.is_active ? '● Active' : '○ Left'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}