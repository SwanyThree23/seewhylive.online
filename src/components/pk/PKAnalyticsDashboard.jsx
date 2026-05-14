import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, TrendingUp, Swords, Star, Clock, Users, DollarSign, Zap, Crown, Target } from 'lucide-react';

var ET = {
  burgundy: '#800020',
  gold: '#d4af37',
  terracotta: '#CC7755',
  moss: '#6B7C4A',
  clay: '#A0522D',
  sand: '#C4A882',
  cream: '#F5F0E8',
  darkEarth: '#2C1810',
  midEarth: '#3D2B1F',
  lightEarth: '#4A3728',
};

/* Mock data generators */
function genMonthlyData() {
  var months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  return months.map(function(m, i) {
    return {
      month: m,
      wins: Math.floor(3 + i * 2.1 + Math.random() * 4),
      losses: Math.floor(2 + i * 0.8 + Math.random() * 3),
      earnings: Math.floor(200 + i * 180 + Math.random() * 150),
      viewers: Math.floor(800 + i * 320 + Math.random() * 400),
    };
  });
}

function genGiftBreakdown() {
  return [
    { name: 'Crown', value: 38, color: ET.gold },
    { name: 'Rocket', value: 27, color: ET.terracotta },
    { name: 'Fire', value: 19, color: ET.clay },
    { name: 'Diamond', value: 11, color: ET.moss },
    { name: 'Other', value: 5, color: ET.sand },
  ];
}

function genTopOpponents() {
  return [
    { name: 'StormCaster', battles: 8, wins: 6, losses: 2, avgScore: 1240 },
    { name: 'TalkMaster99', battles: 5, wins: 2, losses: 3, avgScore: 1850 },
    { name: 'NeonBeat', battles: 6, wins: 5, losses: 1, avgScore: 890 },
    { name: 'PixelQueen', battles: 3, wins: 3, losses: 0, avgScore: 720 },
    { name: 'BeatDropKing', battles: 4, wins: 1, losses: 3, avgScore: 1100 },
  ];
}

function StatCard({ icon: Icon, label, value, sub, color, accent }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: ET.midEarth, border: '1px solid ' + (color || ET.gold) + '30' }}>
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: (color || ET.gold) + '18', border: '1px solid ' + (color || ET.gold) + '35' }}>
          <Icon className="w-4 h-4" style={{ color: color || ET.gold }} />
        </div>
        {accent && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ET.gold + '18', color: ET.gold }}>
            {accent}
          </span>
        )}
      </div>
      <p className="text-2xl font-black" style={{ fontFamily: 'Orbitron, monospace', color: color || ET.gold }}>{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wider mt-0.5" style={{ color: ET.sand + '80' }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: ET.sand + '50' }}>{sub}</p>}
    </div>
  );
}

var CustomTooltip = function(props) {
  if (!props.active || !props.payload || !props.payload.length) { return null; }
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: ET.darkEarth, border: '1px solid ' + ET.gold + '30' }}>
      <p className="font-bold mb-1" style={{ color: ET.gold }}>{props.label}</p>
      {props.payload.map(function(entry, i) {
        return (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && entry.name === 'earnings' ? '$' + entry.value : entry.value}
          </p>
        );
      })}
    </div>
  );
};

export default function PKAnalyticsDashboard({ battles, user }) {
  var [timeRange, setTimeRange] = useState('3m');
  var monthly = genMonthlyData();
  var gifts = genGiftBreakdown();
  var opponents = genTopOpponents();

  var userId = user && user.id;
  var ended = battles.filter(function(b) { return b.status === 'ended'; });
  var wins = ended.filter(function(b) { return b.winner_id === userId; });
  var losses = ended.filter(function(b) {
    return b.winner_id && b.winner_id !== userId && (b.creator_id === userId || b.challenger_id === userId);
  });
  var totalScore = battles.reduce(function(a, b) {
    if (b.creator_id === userId) { return a + (b.creator_score || 0); }
    if (b.challenger_id === userId) { return a + (b.challenger_score || 0); }
    return a;
  }, 0);
  var totalTips = Math.floor(battles.reduce(function(a, b) {
    if (b.creator_id === userId) { return a + (b.creator_tips || 0); }
    if (b.challenger_id === userId) { return a + (b.challenger_tips || 0); }
    return a;
  }, 0) * 100) / 100;
  var winRate = ended.length > 0 ? Math.round((wins.length / ended.length) * 100) : 0;
  var avgScore = ended.length > 0 ? Math.floor(totalScore / Math.max(ended.length, 1)) : 0;

  var displayMonthly = timeRange === '1m' ? monthly.slice(-2) : timeRange === '3m' ? monthly.slice(-4) : monthly;

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Trophy} label="Total Battles" value={String(ended.length || battles.length)} sub="All time" color={ET.gold} />
        <StatCard icon={Crown} label="Win Rate" value={winRate + '%'} sub={wins.length + 'W / ' + losses.length + 'L'} color={ET.terracotta} accent={winRate >= 50 ? '🔥 Hot' : null} />
        <StatCard icon={Zap} label="Avg Score" value={avgScore.toLocaleString()} sub="Points per battle" color={ET.moss} />
        <StatCard icon={DollarSign} label="Tips Earned" value={'$' + totalTips.toFixed(2)} sub="Battle tips total" color={ET.clay} />
      </div>

      {/* Time range */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: ET.sand + '60' }}>Range:</span>
        {['1m', '3m', 'All'].map(function(r) {
          var active = timeRange === r;
          return (
            <button
              key={r}
              onClick={function() { setTimeRange(r); }}
              className="px-3 py-1 text-xs font-bold rounded-full transition-all"
              style={{
                background: active ? ET.gold : 'rgba(255,255,255,0.05)',
                color: active ? '#000' : ET.sand + '80',
                border: '1px solid ' + (active ? ET.gold : 'rgba(255,255,255,0.08)')
              }}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* W/L Trend */}
      <div className="rounded-2xl p-4" style={{ background: ET.darkEarth, border: '1px solid ' + ET.gold + '20' }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" style={{ color: ET.gold }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: ET.gold }}>Win/Loss Trend</span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={displayMonthly} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="winsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ET.gold} stopOpacity={0.3} />
                <stop offset="95%" stopColor={ET.gold} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ET.burgundy} stopOpacity={0.3} />
                <stop offset="95%" stopColor={ET.burgundy} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: ET.sand + '60', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: ET.sand + '40', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip content={CustomTooltip} />
            <Area type="monotone" dataKey="wins" stroke={ET.gold} strokeWidth={2} fill="url(#winsGrad)" name="wins" />
            <Area type="monotone" dataKey="losses" stroke={ET.burgundy} strokeWidth={2} fill="url(#lossGrad)" name="losses" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: ET.gold }} /><span className="text-[10px]" style={{ color: ET.sand + '70' }}>Wins</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: ET.burgundy }} /><span className="text-[10px]" style={{ color: ET.sand + '70' }}>Losses</span></div>
        </div>
      </div>

      {/* Viewer & Earnings charts side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4" style={{ background: ET.darkEarth, border: '1px solid ' + ET.terracotta + '25' }}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" style={{ color: ET.terracotta }} />
            <span className="text-xs font-bold uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: ET.terracotta }}>Battle Viewers</span>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={displayMonthly} margin={{ top: 0, right: 4, bottom: 0, left: -24 }}>
              <XAxis dataKey="month" tick={{ fill: ET.sand + '50', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: ET.sand + '40', fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip content={CustomTooltip} />
              <Bar dataKey="viewers" fill={ET.terracotta + 'CC'} radius={[3,3,0,0]} name="viewers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-4" style={{ background: ET.darkEarth, border: '1px solid ' + ET.clay + '25' }}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4" style={{ color: ET.clay }} />
            <span className="text-xs font-bold uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: ET.clay }}>Tips Earned ($)</span>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={displayMonthly} margin={{ top: 0, right: 4, bottom: 0, left: -16 }}>
              <XAxis dataKey="month" tick={{ fill: ET.sand + '50', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: ET.sand + '40', fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip content={CustomTooltip} />
              <Bar dataKey="earnings" fill={ET.clay + 'CC'} radius={[3,3,0,0]} name="earnings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gift breakdown + Top opponents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4" style={{ background: ET.darkEarth, border: '1px solid ' + ET.gold + '18' }}>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4" style={{ color: ET.gold }} />
            <span className="text-xs font-bold uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: ET.gold }}>Gift Breakdown</span>
          </div>
          <div className="flex items-center gap-4">
            <PieChart width={100} height={100}>
              <Pie data={gifts} cx={45} cy={45} innerRadius={28} outerRadius={44} paddingAngle={2} dataKey="value">
                {gifts.map(function(g, i) { return <Cell key={i} fill={g.color} />; })}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-1.5">
              {gifts.map(function(g) {
                return (
                  <div key={g.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                      <span className="text-[10px]" style={{ color: ET.sand + '80' }}>{g.name}</span>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: g.color }}>{g.value}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: ET.darkEarth, border: '1px solid ' + ET.terracotta + '20' }}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" style={{ color: ET.terracotta }} />
            <span className="text-xs font-bold uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: ET.terracotta }}>Top Opponents</span>
          </div>
          <div className="space-y-2">
            {opponents.slice(0, 5).map(function(op, i) {
              var wr = Math.round((op.wins / op.battles) * 100);
              return (
                <div key={op.name} className="flex items-center gap-2">
                  <span className="text-[9px] w-3 shrink-0" style={{ color: ET.sand + '40' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold truncate" style={{ color: ET.cream }}>{op.name}</span>
                      <span className="text-[9px] font-black" style={{ color: wr >= 50 ? ET.gold : ET.terracotta }}>{wr}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: wr + '%', background: wr >= 50 ? ET.gold : ET.terracotta }} />
                    </div>
                  </div>
                  <span className="text-[9px] shrink-0" style={{ color: ET.sand + '50' }}>{op.battles}b</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}