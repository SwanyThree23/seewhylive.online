import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Lock, TrendingUp, Calendar, DollarSign, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import PayPerViewCard from '../components/monetization/PayPerViewCard';

const BG      = '#080B18';
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const FILTERS = ['all', 'upcoming', 'live', 'ended'];
const TABS    = ['available', 'purchased'];

export default function PayPerViewEventsPage() {
  const [filter, setFilter]   = useState('all');
  const [activeTab, setActiveTab] = useState('available');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['ppv-events', filter],
    queryFn: async () => {
      if (filter === 'all') return base44.entities.PayPerViewEvent.filter({}, '-event_date', 20);
      return base44.entities.PayPerViewEvent.filter({ status: filter }, '-event_date', 20);
    },
  });

  const { data: myAccess = [] } = useQuery({
    queryKey: ['my-ppv-access', user?.id],
    queryFn: () => base44.entities.PayPerViewAccess.filter({ user_id: user.id }),
    enabled: !!user,
  });

  const myEventIds      = myAccess.map(a => a.event_id);
  const myEvents        = events.filter(e => myEventIds.includes(e.id));
  const availableEvents = events.filter(e => !myEventIds.includes(e.id));

  const displayed = activeTab === 'available' ? availableEvents : myEvents;

  return (
    <div className="min-h-screen pb-12" style={{ background: BG }}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-4 pt-10 pb-8 md:px-8"
        style={{ background: `linear-gradient(135deg, ${CRIMSON}33 0%, rgba(8,11,24,0.0) 60%)`, borderBottom: `1px solid rgba(212,175,55,0.1)` }}>

        {/* Subtle grid lines */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})` }}>
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black leading-none" style={{ color: GOLD, ...T }}>Premium Events</h1>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>Exclusive access · Special rooms · Premium content</p>
            </div>
          </div>

          {/* 3 feature chips */}
          <div className="flex gap-2 flex-wrap mt-4">
            {[
              { icon: DollarSign, label: 'Pay Per Event' },
              { icon: Zap,        label: 'Early Access'  },
              { icon: Star,       label: 'Exclusive'     },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', ...T }}>
                <Icon className="w-3 h-3" style={{ color: GOLD }} />
                <span className="text-[10px] font-black uppercase" style={{ color: GOLD }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Filter pills ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-4 py-3 flex flex-col gap-3"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full shrink-0 font-black uppercase text-[10px] transition-all capitalize"
              style={{
                ...T,
                background: filter === f ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                border:     `1px solid ${filter === f ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color:      filter === f ? GOLD : 'rgba(255,255,255,0.4)',
              }}>
              {f === 'all' ? 'All Events' : f === 'live' ? '🔴 Live Now' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 font-black uppercase text-[10px] transition-all"
              style={{
                ...T,
                background: activeTab === tab ? `linear-gradient(90deg, ${CRIMSON}33, rgba(212,175,55,0.12))` : 'transparent',
                borderBottom: `2px solid ${activeTab === tab ? GOLD : 'transparent'}`,
                color: activeTab === tab ? GOLD : 'rgba(255,255,255,0.3)',
              }}>
              {tab === 'available' ? `Available (${availableEvents.length})` : `My Events (${myEvents.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : displayed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayed.map((event, i) => (
              <motion.div key={event.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <PayPerViewCard event={event} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
              {activeTab === 'available'
                ? <Calendar className="w-9 h-9" style={{ color: 'rgba(212,175,55,0.3)' }} />
                : <Lock className="w-9 h-9" style={{ color: 'rgba(212,175,55,0.3)' }} />}
            </div>
            <p className="font-black text-sm uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
              {activeTab === 'available' ? 'No events available' : 'No purchased events'}
            </p>
            <p className="text-[11px] text-center max-w-xs" style={{ color: 'rgba(255,255,255,0.18)', ...T }}>
              {activeTab === 'available'
                ? 'Check back soon — premium events go live regularly'
                : 'Browse the available events to get exclusive access'}
            </p>
            {activeTab === 'purchased' && (
              <button onClick={() => setActiveTab('available')}
                className="mt-4 px-5 py-2.5 rounded-xl font-black uppercase text-[11px]"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: GOLD, ...T }}>
                Browse Events →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
