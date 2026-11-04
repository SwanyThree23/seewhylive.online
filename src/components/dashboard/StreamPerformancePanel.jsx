import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Timer, Eye } from 'lucide-react';

const GOLD = '#FFB800';
const CYAN = '#00F5FF';
const COND = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'DM Mono, monospace' };

function minuteLabel(seconds) {
  const m = Math.round((seconds || 0) / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

export default function StreamPerformancePanel({ creatorId }) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['session-performance', creatorId],
    queryFn: async () => {
      const res = await base44.entities.StreamSession.filter(
        { host_id: creatorId },
        { sort: '-started_at', limit: 40 }
      );
      return res.items || [];
    },
    enabled: !!creatorId,
  });

  const ended = React.useMemo(
    () => sessions.filter(s => s.ended_at || s.duration_seconds),
    [sessions]
  );

  const best = React.useMemo(() => {
    if (!ended.length) return null;
    return [...ended].sort((a, b) => {
      const diff = (b.total_tips || 0) - (a.total_tips || 0);
      return diff !== 0 ? diff : (b.peak_viewers || 0) - (a.peak_viewers || 0);
    })[0];
  }, [ended]);

  const { data: bestRoom } = useQuery({
    queryKey: ['best-room', best?.room_id],
    queryFn: () => base44.entities.Room.get(best.room_id),
    enabled: !!best?.room_id,
  });

  const trend = React.useMemo(() => {
    return [...ended]
      .sort((a, b) => new Date(a.started_at || a.created_date) - new Date(b.started_at || b.created_date))
      .slice(-14)
      .map(s => ({
        label: new Date(s.started_at || s.created_date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
        minutes: Math.round((s.duration_seconds || 0) / 60),
      }))
      .filter(p => p.minutes > 0);
  }, [ended]);

  const avgMinutes = trend.length
    ? Math.round(trend.reduce((sum, p) => sum + p.minutes, 0) / trend.length)
    : 0;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid var(--bd)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--bd)' }}>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: GOLD }} />
          <p className="font-black uppercase" style={{ ...COND, fontSize: 11, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)' }}>
            Stream Performance
          </p>
        </div>
        <span className="flex items-center gap-1" style={{ ...MONO, fontSize: 11, color: 'var(--mu)' }}>
          <Timer className="w-3 h-3" /> avg {minuteLabel(avgMinutes * 60)}
        </span>
      </div>

      {isLoading ? (
        <p className="px-4 py-6 text-center" style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>Loading sessions…</p>
      ) : (
        <>
          {/* Best performing stream */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--bd)' }}>
            <p className="font-black uppercase mb-1.5" style={{ ...MONO, fontSize: 10, letterSpacing: '0.12em', color: 'var(--mu)' }}>
              Best performing stream
            </p>
            {best ? (
              <>
                <p className="truncate" style={{ ...COND, fontSize: 15, fontWeight: 800, color: 'var(--tx)' }}>
                  {bestRoom?.title || 'Untitled stream'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span style={{ ...COND, fontSize: 13, fontWeight: 900, color: GOLD }}>
                    ${(best.total_tips || 0).toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1" style={{ ...MONO, fontSize: 11, color: 'var(--mu)' }}>
                    <Eye className="w-3 h-3" /> {best.peak_viewers || 0} peak
                  </span>
                  <span style={{ ...MONO, fontSize: 11, color: 'var(--mu)' }}>
                    {minuteLabel(best.duration_seconds)}
                  </span>
                </div>
              </>
            ) : (
              <p style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>No completed sessions yet.</p>
            )}
          </div>

          {/* Avg session length trend */}
          <div className="px-4 py-3">
            <p className="font-black uppercase mb-1" style={{ ...MONO, fontSize: 10, letterSpacing: '0.12em', color: 'var(--mu)' }}>
              Session length trend (last {trend.length || 0})
            </p>
            {trend.length < 2 ? (
              <p className="py-4" style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>
                Stream a few more sessions to see the trend.
              </p>
            ) : (
              <div style={{ height: 110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 6, right: 6, left: -28, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fill: '#5A5A7A', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#5A5A7A', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--cd)', border: '1px solid var(--bd)', borderRadius: 8, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12 }}
                      labelStyle={{ color: '#5A5A7A' }}
                      formatter={(v) => [`${v} min`, 'Length']}
                    />
                    <Line type="monotone" dataKey="minutes" stroke={CYAN} strokeWidth={2} dot={{ r: 2, fill: CYAN }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}