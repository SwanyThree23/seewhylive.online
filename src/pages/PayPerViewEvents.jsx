import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Users, DollarSign, Calendar, Clock, Plus, CheckCircle, Eye, Tv, BarChart3, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import SubscriptionTiers from '../components/monetization/SubscriptionTiers';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import LiveAuctionWidget from '../components/monetization/LiveAuctionWidget';
import MonetizationDashboard from '../components/monetization/MonetizationDashboard';
import SpotlightBanner from '../components/community/SpotlightBanner';
import PaymentMethodSelector from '../components/monetization/PaymentMethodSelector';
import PayPerViewCard from '../components/monetization/PayPerViewCard';
import PayPerViewManager from '../components/monetization/PayPerViewManager';
import VirtualGoodsStore from '../components/monetization/VirtualGoodsStore';

const BG   = '#080B18';
const BG2  = '#0D0A08';
const GOLD = '#D4AF37';
const CRIM = '#800020';
const AMB  = '#D4854A';
const GRN  = '#6DBF7E';
const FONT = 'Barlow Condensed, sans-serif';
const MONO = 'Space Mono, monospace';

const STATUS_COLORS = {
  upcoming: { bg: `${GOLD}18`, border: `${GOLD}35`, text: GOLD },
  live:     { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#EF4444' },
  ended:    { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.35)' },
};

const CREATOR_SHARE = 0.90;

function EventCard({ event, user, myEventIds, onPurchase, purchasing }) {
  const hasAccess  = myEventIds.includes(event.id);
  const statusC    = STATUS_COLORS[event.status] || STATUS_COLORS.upcoming;
  const isSoldOut  = event.max_participants && event.current_participants >= event.max_participants;
  const payout     = Math.floor((event.revenue || 0) * CREATOR_SHARE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)` }}
    >
      {/* Thumbnail */}
      <div className="relative" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #0F1428, #080B18)' }}>
        {event.thumbnail_url
          ? <img src={event.thumbnail_url} alt={event.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Tv className="w-10 h-10" style={{ color: 'rgba(212,175,55,0.2)' }} /></div>
        }
        {!hasAccess && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
            <Lock className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-black uppercase"
          style={{ background: statusC.bg, border: `1px solid ${statusC.border}`, color: statusC.text, fontFamily: FONT }}>
          {event.status === 'live' ? '🔴 LIVE' : event.status}
        </div>
        {hasAccess && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black"
            style={{ background: `${GRN}22`, border: `1px solid ${GRN}44`, color: GRN, fontFamily: FONT }}>
            <CheckCircle className="w-3 h-3" /> Purchased
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-black text-white text-sm leading-snug flex-1" style={{ fontFamily: FONT }}>{event.title}</h3>
          <span className="text-xl font-black shrink-0" style={{ color: GOLD, fontFamily: MONO }}>${event.price}</span>
        </div>

        {event.description && (
          <p className="text-[11px] mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: FONT }}>{event.description}</p>
        )}

        <div className="flex flex-wrap gap-3 mb-4 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>
          {event.event_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {event.duration_minutes && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.duration_minutes}m</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {event.current_participants || 0}{event.max_participants ? ` / ${event.max_participants}` : ''} attending
          </span>
        </div>

        {hasAccess ? (
          <button className="w-full py-2.5 rounded-xl font-black text-[12px] uppercase"
            style={{ background: `${GRN}18`, border: `1px solid ${GRN}44`, color: GRN, fontFamily: FONT }}>
            ✓ Join Event
          </button>
        ) : (
          <button
            onClick={() => onPurchase(event)}
            disabled={isSoldOut || purchasing === event.id}
            className="w-full py-2.5 rounded-xl font-black text-[12px] uppercase transition-all hover:brightness-110"
            style={{
              background: isSoldOut ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${CRIM}CC, ${CRIM}88)`,
              border: `1px solid ${isSoldOut ? 'rgba(255,255,255,0.1)' : `${CRIM}88`}`,
              color: isSoldOut ? 'rgba(255,255,255,0.3)' : '#fff',
              cursor: isSoldOut ? 'not-allowed' : 'pointer',
              fontFamily: FONT,
            }}>
            {purchasing === event.id ? 'Processing…' : isSoldOut ? 'Sold Out' : `Buy Access — $${event.price}`}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function CreateEventForm({ onSuccess }) {
  const [form, setForm] = useState({ title: '', description: '', price: '', event_date: '', duration_minutes: 60, max_participants: '' });
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.price || !form.event_date) throw new Error('Fill in required fields');
      return base44.entities.PayPerViewEvent.create({
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        event_date: new Date(form.event_date).toISOString(),
        duration_minutes: parseInt(form.duration_minutes) || 60,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        status: 'upcoming',
        creator_id: user?.id,
        current_participants: 0,
        revenue: 0,
        access_type: 'single_event',
      });
    },
    onSuccess: (event) => {
      toast.success('PPV event created!');
      if (user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'stream_scheduled',
          title: `Created PPV event: ${event?.title || 'Event'}`,
          amount: event?.price,
        }).catch(() => {});
      }
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const inp = (field) => ({
    value: form[field],
    onChange: (e) => setForm(f => ({ ...f, [field]: e.target.value })),
  });

  const fieldStyle = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: 10, padding: '10px 14px', color: '#fff', outline: 'none',
    fontFamily: FONT, fontSize: 14, width: '100%',
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
        <p className="text-[11px] font-black uppercase mb-1" style={{ color: GOLD, fontFamily: FONT }}>Creator Revenue Split</p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>
          You keep 90% of every ticket sold. SeeWhy LIVE takes 10%.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-[11px] font-black uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>Event Title *</label>
          <input {...inp('title')} placeholder="e.g. State vs State Championship" style={fieldStyle} />
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>Ticket Price ($) *</label>
          <input {...inp('price')} type="number" min="1" placeholder="9.99" style={fieldStyle} />
          {form.price && (
            <p className="text-[10px] mt-1" style={{ color: GRN, fontFamily: MONO }}>
              Your cut: ${(Math.floor(parseFloat(form.price || 0) * 100 * CREATOR_SHARE) / 100).toFixed(2)} per ticket
            </p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>Date & Time *</label>
          <input {...inp('event_date')} type="datetime-local" style={fieldStyle} />
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>Duration (minutes)</label>
          <input {...inp('duration_minutes')} type="number" min="15" placeholder="60" style={fieldStyle} />
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>Max Attendees (optional)</label>
          <input {...inp('max_participants')} type="number" min="1" placeholder="Unlimited" style={fieldStyle} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[11px] font-black uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>Description</label>
          <textarea {...inp('description')} rows={3} placeholder="What's special about this event…"
            style={{ ...fieldStyle, resize: 'vertical' }} />
        </div>
      </div>

      <button
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending || !form.title || !form.price || !form.event_date}
        className="w-full py-3.5 rounded-xl font-black text-base uppercase transition-all hover:brightness-110"
        style={{
          background: 'linear-gradient(135deg, #D4AF37, #C9A84C)',
          color: '#000',
          fontFamily: FONT,
          letterSpacing: '0.06em',
          opacity: (!form.title || !form.price || !form.event_date) ? 0.5 : 1,
        }}>
        {createMutation.isPending ? 'Creating…' : '+ Create PPV Event'}
      </button>
    </div>
  );
}

export default function PayPerViewEventsPage() {
  const [tab, setTab]         = useState('browse');
  const [filter, setFilter]   = useState('all');
  const [purchasing, setPurchasing] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;
  const { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', user?.id],
    queryFn: () => base44.entities.Community.filter({ owner_id: user?.id }).then(r => r[0] || null),
    enabled: !!user?.id,
  });
  const userCommunityId = userCommunity?.id || null;

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['ppv-events', filter],
    queryFn: async () => {
      if (filter === 'all') return base44.entities.PayPerViewEvent.filter({}, '-event_date', 20);
      return base44.entities.PayPerViewEvent.filter({ status: filter }, '-event_date', 20);
    },
    refetchInterval: 30000,
  });

  const { data: myAccess = [] } = useQuery({
    queryKey: ['my-ppv-access', user?.id],
    queryFn: () => base44.entities.PayPerViewAccess.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const myEventIds = myAccess.map(a => a.event_id);

  async function handlePurchase(event) {
    if (!user) { toast.error('Sign in to purchase'); return; }
    setPurchasing(event.id);
    try {
      const txn = await base44.entities.Transaction.create({
        type: 'ppv',
        amount: Math.floor(event.price * 100) / 100,
        from_user_id: user.id,
        to_user_id: event.creator_id,
        room_id: event.room_id || null,
      });
      await base44.entities.PayPerViewAccess.create({
        event_id: event.id,
        user_id: user.id,
        amount_paid: event.price,
        transaction_id: txn.id,
      });
      await base44.entities.PayPerViewEvent.update(event.id, {
        current_participants: (event.current_participants || 0) + 1,
        revenue: Math.floor(((event.revenue || 0) + event.price) * 100) / 100,
      });
      queryClient.invalidateQueries({ queryKey: ['my-ppv-access'] });
      queryClient.invalidateQueries({ queryKey: ['ppv-events'] });
      toast.success('Access granted! 🎟️ Enjoy the event');
    } catch {
      toast.error('Purchase failed — try again');
    } finally {
      setPurchasing(null);
    }
  }

  const totalRevenue   = events.filter(e => e.creator_id === user?.id).reduce((s, e) => s + (e.revenue || 0), 0);
  const creatorEarning = Math.floor(totalRevenue * CREATOR_SHARE * 100) / 100;
  const liveEvents     = events.filter(e => e.status === 'live');
  const filtered       = filter === 'all' ? events : events.filter(e => e.status === filter);

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>

      {/* Hero */}
      <div className="px-4 py-8 md:px-8" style={{ background: `linear-gradient(135deg, ${CRIM}30, ${BG} 70%)`, borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6" style={{ color: GOLD }} />
            <h1 className="text-3xl font-black" style={{ color: GOLD, fontFamily: FONT }}>Pay-Per-View Events</h1>
          </div>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: FONT }}>
            Premium live events · Exclusive access · 90% creator payout
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Live Now',     value: liveEvents.length,                        icon: '🔴', color: '#EF4444' },
              { label: 'Upcoming',     value: events.filter(e => e.status === 'upcoming').length, icon: '📅', color: GOLD },
              { label: 'My Access',    value: myAccess.length,                          icon: '🎟️', color: GRN },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(212,175,55,0.12)` }}>
                <div className="text-lg mb-0.5">{s.icon}</div>
                <div className="text-xl font-black" style={{ color: s.color, fontFamily: MONO }}>{s.value}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6">

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { id: 'browse',  label: 'Browse Events' },
            { id: 'mine',    label: 'My Tickets' },
            { id: 'create',  label: '+ Create Event' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg font-black text-[12px] uppercase transition-all"
              style={{
                background: tab === t.id ? GOLD : 'transparent',
                color:      tab === t.id ? '#000' : 'rgba(255,255,255,0.4)',
                fontFamily: FONT,
                letterSpacing: '0.05em',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Browse tab */}
        {tab === 'browse' && (
          <>
            {/* Filter pills */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {['all', 'live', 'upcoming', 'ended'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1 rounded-full font-black uppercase text-[11px] capitalize transition-all"
                  style={{
                    background: filter === f ? GOLD : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${filter === f ? GOLD : 'rgba(255,255,255,0.1)'}`,
                    color: filter === f ? '#000' : 'rgba(255,255,255,0.4)',
                    fontFamily: FONT,
                  }}>
                  {f}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(event => (
                  <EventCard key={event.id} event={event} user={user} myEventIds={myEventIds}
                    onPurchase={handlePurchase} purchasing={purchasing} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Lock className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: FONT }}>
                  No {filter !== 'all' ? filter : ''} events right now
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: FONT }}>
                  Check back soon or create your own
                </p>
              </div>
            )}
          </>
        )}

        {/* My tickets tab */}
        {tab === 'mine' && (
          <>
            {myAccess.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.filter(e => myEventIds.includes(e.id)).map(event => (
                  <EventCard key={event.id} event={event} user={user} myEventIds={myEventIds}
                    onPurchase={handlePurchase} purchasing={purchasing} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="text-4xl">🎟️</div>
                <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: FONT }}>No tickets yet</p>
                <button onClick={() => setTab('browse')}
                  className="px-5 py-2 rounded-xl font-black text-[11px] uppercase"
                  style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}35`, color: GOLD, fontFamily: FONT }}>
                  Browse events →
                </button>
              </div>
            )}
          </>
        )}

        {/* Create event tab */}
        {tab === 'create' && (
          <>
            {user?.id && creatorEarning > 0 && (
              <div className="mb-5 p-4 rounded-xl flex items-center gap-3"
                style={{ background: `${GRN}12`, border: `1px solid ${GRN}25` }}>
                <BarChart3 className="w-5 h-5 shrink-0" style={{ color: GRN }} />
                <div>
                  <p className="font-black text-sm" style={{ color: GRN, fontFamily: FONT }}>
                    You've earned ${creatorEarning.toFixed(2)} from PPV events
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: FONT }}>90% of ${totalRevenue.toFixed(2)} total revenue</p>
                </div>
              </div>
            )}
            <CreateEventForm onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['ppv-events'] });
              setTab('browse');
            }} />
          </>
        )}

        {user?.id && (
          <div className="mt-6 rounded-2xl p-5" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <p className="font-black text-sm text-white mb-3" style={{ fontFamily: FONT }}>Payment Methods</p>
            <PaymentMethodSelector creatorId={user.id} roomId={activeRoomId} onPaymentComplete={() => {}} />
          </div>
        )}

        {user?.id && (
          <div className="mt-6" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SubscriptionTiers creatorId={user.id} currentUserId={user.id} />
            <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-10 pt-6 flex flex-wrap gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { label: 'Monetization',  page: 'Monetization' },
            { label: 'Payouts',       page: 'Payouts' },
            { label: 'Creator Dashboard', page: 'CreatorDashboard' },
            { label: 'Subscriptions', page: 'CreatorSubscriptions' },
          ].map(({ label, page }) => (
            <Link key={page} to={createPageUrl(page)}>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[11px] uppercase transition-all hover:brightness-110"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)', fontFamily: FONT }}>
                {label} <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
          <PayPerViewCard event={null} onPurchase={() => {}} />
          <PayPerViewManager userId={user?.id} />
          <VirtualGoodsStore creatorId={user?.id} userId={user?.id} />
          <OnlineUsersGrid compact maxVisible={10} />
          <ContentRecommendations />
          <LiveAuctionWidget creatorId={user?.id} roomId={activeRoomId} isCreator={false} currentUser={user} />
          <MonetizationDashboard roomId={activeRoomId} />
        </div>
      </div>
    </div>
  );
}
