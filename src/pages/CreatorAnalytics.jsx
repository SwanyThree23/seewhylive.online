import React, { useReducer } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Eye, Gem, Radio, Clock, Users, Award } from 'lucide-react';

const CREATOR_SPLIT = 0.90;
function creatorCut(g) { return Math.floor(g * CREATOR_SPLIT); }
function platformFee(g) { return g - creatorCut(g); }

const RANGES = ['24h', '7d', '30d', '90d', 'All'];
const TABS = ['overview', 'revenue', 'gems', 'viewers', 'streams'];

const GEM_TYPES = [
  { name: 'Ruby', color: '#FF1564', value: 4200 },
  { name: 'Gold', color: '#d4af37', value: 3100 },
  { name: 'Diamond', color: '#00d4ff', value: 2800 },
  { name: 'Purple', color: '#8B5CF6', value: 1900 },
  { name: 'Bone', color: '#C4A882', value: 1200 },
];

const MONTHLY_REVENUE = [
  { month: 'Jan', gross: 620 }, { month: 'Feb', gross: 940 },
  { month: 'Mar', gross: 1870 }, { month: 'Apr', gross: 2180 },
  { month: 'May', gross: 3240 }, { month: 'Jun', gross: 2890 },
];

const WEEKLY_GEMS = [
  { day: 'Mon', gems: 420 }, { day: 'Tue', gems: 380 }, { day: 'Wed', gems: 610 },
  { day: 'Thu', gems: 520 }, { day: 'Fri', gems: 890 }, { day: 'Sat', gems: 1240 }, { day: 'Sun', gems: 780 },
];

const RETENTION = [
  { min: 0, pct: 100 }, { min: 5, pct: 88 }, { min: 10, pct: 76 }, { min: 15, pct: 68 },
  { min: 20, pct: 61 }, { min: 30, pct: 54 }, { min: 45, pct: 47 }, { min: 60, pct: 42 },
];

const TRAFFIC_SOURCES = [
  { name: 'Direct', value: 38, color: '#d4af37' },
  { name: 'Social', value: 29, color: '#8B5CF6' },
  { name: 'Search', value: 18, color: '#00FF88' },
  { name: 'Referral', value: 15, color: '#00d4ff' },
];

const TIPPERS = [
  { rank: 1, handle: 'DominoKing_WA', gems: 8420, streams: 34, value: 842 },
  { rank: 2, handle: 'CaliBones_Champ', gems: 6180, streams: 28, value: 618 },
  { rank: 3, handle: 'SwanyFan_OG', gems: 4290, streams: 41, value: 429 },
  { rank: 4, handle: 'WashingtonDomz', gems: 3810, streams: 19, value: 381 },
  { rank: 5, handle: 'VibeNBones99', gems: 2940, streams: 22, value: 294 },
];

const TOP_STREAMS = [
  { title: 'Washington Classic 2026 — Finals', date: 'Jun 8', revenue: 1840, viewers: 4120, gems: 18400 },
  { title: 'PK Battle Night — SwanyThree23 vs King James', date: 'Jun 2', revenue: 920, viewers: 2840, gems: 9200 },
  { title: 'State vs State — WA vs CA Semifinals', date: 'May 28', revenue: 680, viewers: 1980, gems: 6800 },
  { title: 'Cali Bones × VibeN\'Bones Collab', date: 'May 22', revenue: 480, viewers: 1420, gems: 4800 },
];

const initState = { tab: 'overview', range: '30d' };
function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB': return { ...state, tab: action.payload };
    case 'SET_RANGE': return { ...state, range: action.payload };
    default: return state;
  }
}

function StatCard({ label, value, sub, delta, color, icon }) {
  var Icon = icon || TrendingUp;
  var isPositive = delta === undefined ? null : delta >= 0;
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px', flex: 1, minWidth: 140 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Icon size={16} color={color || 'rgba(255,255,255,0.4)'} />
        {delta !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: isPositive ? '#00FF88' : '#ef4444', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color || '#fff', fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const TOOLTIP_STYLE = { background: 'rgba(7,5,10,0.95)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, fontSize: 12, color: '#fff' };

export default function CreatorAnalytics() {
  const [state, dispatch] = useReducer(reducer, initState);
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  var totalGross = MONTHLY_REVENUE.reduce((s, r) => s + r.gross, 0);
  var creatorTotal = creatorCut(totalGross);
  var feeTotal = platformFee(totalGross);

  return (
    <div style={{ minHeight: '100vh', background: '#07050A', color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(212,175,55,0.15)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0a2a4a, #00d4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>CREATOR ANALYTICS</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>SeeWhy LIVE · SwanyThree23 · 90% Creator Split</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {RANGES.map(r => (
            <button key={r} onClick={() => dispatch({ type: 'SET_RANGE', payload: r })}
              style={{ padding: '5px 12px', borderRadius: 8, border: state.range === r ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.12)', background: state.range === r ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: state.range === r ? '#d4af37' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', padding: '0 16px', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => dispatch({ type: 'SET_TAB', payload: tab })}
            style={{ padding: '11px 16px', background: 'none', border: 'none', borderBottom: state.tab === tab ? '2px solid #d4af37' : '2px solid transparent', color: state.tab === tab ? '#d4af37' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>

        {/* OVERVIEW */}
        {state.tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatCard label="TOTAL REVENUE (90%)" value={'$' + creatorTotal.toLocaleString()} delta={24} color="#00FF88" icon={DollarSign} />
              <StatCard label="TOTAL VIEWERS" value="12.4K" delta={18} color="#00d4ff" icon={Eye} />
              <StatCard label="GEMS RECEIVED" value="13.2K" delta={31} color="#d4af37" icon={Award} />
              <StatCard label="STREAMS" value="24" delta={8} color="#8B5CF6" icon={Radio} />
              <StatCard label="WATCH TIME" value="2,840h" delta={15} color="#FF8C00" icon={Clock} />
              <StatCard label="NEW FOLLOWERS" value="892" delta={-4} color="#C9A0A0" icon={Users} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 12, fontFamily: 'Barlow Condensed, sans-serif' }}>MONTHLY REVENUE</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={MONTHLY_REVENUE}>
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => ['$' + v, 'Gross']} />
                    <Bar dataKey="gross" fill="#d4af37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 12, fontFamily: 'Barlow Condensed, sans-serif' }}>TRAFFIC SOURCES</div>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={TRAFFIC_SOURCES} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                      {TRAFFIC_SOURCES.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v + '%', 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {TRAFFIC_SOURCES.map(s => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>{s.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: s.color, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REVENUE */}
        {state.tab === 'revenue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatCard label="GROSS REVENUE" value={'$' + totalGross.toLocaleString()} color="#fff" icon={DollarSign} />
              <StatCard label="YOUR CUT (90%)" value={'$' + creatorTotal.toLocaleString()} color="#00FF88" icon={TrendingUp} />
              <StatCard label="PLATFORM FEE (10%)" value={'$' + feeTotal.toLocaleString()} color="rgba(255,255,255,0.4)" icon={DollarSign} />
            </div>
            <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 10, padding: '10px 16px', fontSize: 12, color: 'rgba(0,255,136,0.8)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              🔒 creator_cut = Math.floor(gross × 0.90) · CREATOR_SPLIT = 0.90 is immutable
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 12, fontFamily: 'Barlow Condensed, sans-serif' }}>REVENUE BY SOURCE</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                {[{ label: 'Gems', value: '$4,820', color: '#d4af37' }, { label: 'Subscriptions', value: '$3,140', color: '#8B5CF6' }, { label: 'PPV', value: '$2,090', color: '#00d4ff' }, { label: 'Tips', value: '$1,690', color: '#FF8C00' }].map(s => (
                  <div key={s.label} style={{ flex: 1, minWidth: 100, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: s.color, fontFamily: 'Barlow Condensed, sans-serif' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={MONTHLY_REVENUE}>
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="gross" name="Gross" fill="#d4af37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* GEMS */}
        {state.tab === 'gems' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatCard label="TOTAL GEMS" value="13,200" delta={31} color="#d4af37" icon={Award} />
              <StatCard label="UNIQUE SENDERS" value="284" delta={12} color="#8B5CF6" icon={Users} />
              <StatCard label="PEAK GEM RATE" value="48/min" color="#FF1564" icon={TrendingUp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 12, fontFamily: 'Barlow Condensed, sans-serif' }}>WEEKLY GEM FLOW</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={WEEKLY_GEMS}>
                    <defs>
                      <linearGradient id="gemGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="gems" stroke="#d4af37" fill="url(#gemGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 12, fontFamily: 'Barlow Condensed, sans-serif' }}>GEM BREAKDOWN</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {GEM_TYPES.map(gem => {
                    var total = GEM_TYPES.reduce((s, g) => s + g.value, 0);
                    var pct = Math.round((gem.value / total) * 100);
                    return (
                      <div key={gem.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: gem.color, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>{gem.name}</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>{gem.value.toLocaleString()}</span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                          <div style={{ height: '100%', width: pct + '%', background: gem.color, borderRadius: 99 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Tippers leaderboard */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 12, fontFamily: 'Barlow Condensed, sans-serif' }}>TOP TIPPERS</div>
              {TIPPERS.map(t => (
                <div key={t.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: t.rank <= 3 ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: t.rank <= 3 ? '#d4af37' : 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', flexShrink: 0 }}>
                    {t.rank === 1 ? '👑' : t.rank}
                  </div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>@{t.handle}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{t.streams} streams</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>{t.gems.toLocaleString()} 💎</span>
                  <span style={{ fontSize: 13, color: '#00FF88', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>${t.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEWERS */}
        {state.tab === 'viewers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatCard label="PEAK CONCURRENT" value="4,120" delta={28} color="#00d4ff" icon={Eye} />
              <StatCard label="AVG CONCURRENT" value="1,840" delta={14} color="#8B5CF6" icon={Users} />
              <StatCard label="AVG SESSION" value="42 min" delta={6} color="#d4af37" icon={Clock} />
              <StatCard label="RETURN RATE" value="61%" delta={9} color="#00FF88" icon={TrendingUp} />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 12, fontFamily: 'Barlow Condensed, sans-serif' }}>AUDIENCE RETENTION CURVE</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={RETENTION}>
                  <defs>
                    <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="min" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'minutes', position: 'insideBottom', fill: 'rgba(255,255,255,0.3)', fontSize: 10, dy: 6 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v + '%', 'Retention']} />
                  <Area type="monotone" dataKey="pct" stroke="#00d4ff" fill="url(#retGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* STREAMS */}
        {state.tab === 'streams' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 4 }}>TOP STREAMS</div>
            {TOP_STREAMS.map((stream, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', flexShrink: 0 }}>#{i + 1}</div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{stream.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{stream.date}</div>
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#00FF88', fontFamily: 'Barlow Condensed, sans-serif' }}>${stream.revenue.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>REVENUE</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#00d4ff', fontFamily: 'Barlow Condensed, sans-serif' }}>{stream.viewers.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>VIEWERS</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>{stream.gems.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>GEMS</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}