import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Radio, Users, CheckCircle, Share2, Bell, Play, Clock,
  Twitter, Instagram, Youtube, ExternalLink, Calendar, Crown, ShoppingBag
} from 'lucide-react';
import SubscriberTierView from '../components/subscriptions/SubscriberTierView';
import TierSubscribeCard from '../components/subscriptions/TierSubscribeCard';
import TierBadge from '../components/subscriptions/TierBadge';
import StripeSubscribeButton from '../components/monetization/StripeSubscribeButton';
import VideoLibrary from '../components/vod/VideoLibrary';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

const BG = '#0d0618';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TABS = ['live', 'videos', 'schedule', 'memberships', 'merch', 'about'];

function MerchPreview({ creatorId }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['cc-merch', creatorId],
    queryFn: () => base44.entities.MerchandiseItem.filter({ creator_id: creatorId, is_active: true }),
    enabled: !!creatorId,
  });

  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
    </div>
  );

  if (items.length === 0) return (
    <div className="flex flex-col items-center py-16">
      <ShoppingBag className="w-12 h-12 mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
      <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No merch yet</p>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {items.slice(0, 8).map(item => (
          <motion.div key={item.id} whileHover={{ y: -4, scale: 1.02 }}
            className="rounded-2xl overflow-hidden cursor-pointer"
            style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}
            onClick={() => window.location.href = createPageUrl('MerchStore') + `?id=${creatorId}`}>
            <div className="h-36 flex items-center justify-center"
              style={{ background: item.image_url ? undefined : `linear-gradient(135deg, ${CRIMSON}44, rgba(13,6,24,0.8))` }}>
              {item.image_url
                ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                : <span className="text-4xl">👕</span>}
            </div>
            <div className="p-3">
              <p className="font-black text-xs text-white truncate" style={T}>{item.name}</p>
              <p className="font-black text-sm mt-0.5" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>${item.price_usd}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <Link to={createPageUrl('MerchStore') + `?id=${creatorId}`}>
        <button className="w-full py-2.5 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2"
          style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer', ...T }}>
          <ShoppingBag className="w-3.5 h-3.5" /> View Full Store →
        </button>
      </Link>
    </div>
  );
}

export default function CreatorChannel() {
  const [activeTab, setActiveTab] = useState('live');
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  const qc = useQueryClient();

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['creator-profile', userId],
    queryFn: () => base44.entities.CreatorProfile.filter({ user_id: userId }).then(r => r[0]),
    enabled: !!userId,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['creator-rooms', userId],
    queryFn: () => base44.entities.Room.filter({ host_id: userId }, '-created_date', 20),
    enabled: !!userId,
  });

  const { data: recordings = [] } = useQuery({
    queryKey: ['creator-recordings', userId],
    queryFn: () => base44.entities.StreamRecording.filter({ creator_id: userId }, '-recorded_at', 12),
    enabled: !!userId,
  });

  const liveRoom = rooms.find(r => r.status === 'live');
  const pastRooms = rooms.filter(r => r.status === 'ended');
  const scheduledRooms = rooms.filter(r => r.status === 'scheduled');
  const socialIcons = { twitter: Twitter, instagram: Instagram, youtube: Youtube };

  const notifyMutation = useMutation({
    mutationFn: () => base44.entities.Notification.create({
      user_id: currentUser?.id,
      type: 'room_invite',
      title: `${profile?.display_name} went live!`,
      message: `${profile?.display_name} is now streaming. Join now!`,
    }),
    onSuccess: () => alert('Reminder set!'),
    onError: () => { toast.error('Failed to set reminder. Please try again.'); },
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="w-12 h-12 rounded-full animate-spin" style={{ border: `3px solid ${GOLD}`, borderTopColor: 'transparent' }} />
    </div>
  );

  const displayName = profile?.display_name || 'Creator';
  const bio = profile?.bio || 'Welcome to my channel!';
  const category = profile?.category || 'other';
  const bannerUrl = profile?.banner_url || null;

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      {/* Hero Banner */}
      <div className="relative h-56 md:h-72 overflow-hidden" style={{ background: `linear-gradient(135deg, ${CRIMSON}44 0%, #0d0618 100%)` }}>
        {bannerUrl && <img src={bannerUrl} alt="banner" className="w-full h-full object-cover absolute inset-0" />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(13,6,24,0.95) 100%)' }} />
        {liveRoom && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-black animate-pulse flex items-center gap-1.5"
              style={{ background: 'rgba(255,21,100,0.85)', color: '#fff', ...T }}>
              <div className="w-2 h-2 rounded-full bg-white" /> LIVE NOW
            </span>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 mb-6 relative z-10">
          {/* OCT avatar */}
          <div className="relative shrink-0" style={{ width: 112, height: 112 }}>
            <div className="absolute inset-0" style={{ clipPath: OCT, background: GOLD }} />
            <div className="absolute inset-[3px] flex items-center justify-center overflow-hidden"
              style={{ clipPath: OCT, background: `linear-gradient(145deg, ${CRIMSON}99, #0d0618)` }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt={displayName} />
                : <span className="text-3xl font-black" style={{ color: GOLD, ...T }}>{displayName.charAt(0)}</span>
              }
            </div>
          </div>

          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-white" style={T}>{displayName}</h1>
              {profile?.is_verified && <CheckCircle className="w-5 h-5" style={{ color: '#D4AF37' }} />}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase capitalize"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, ...T }}>
                {category}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {(profile?.subscriber_count || 0).toLocaleString()} subscribers</span>
              <span>{(profile?.follower_count || 0).toLocaleString()} followers</span>
              <span>{Math.round(profile?.total_hours_streamed || 0)}h streamed</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pb-2">
            {liveRoom ? (
              <Link to={createPageUrl('LiveRoom') + `?id=${liveRoom.id}`}>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs"
                  style={{ background: 'rgba(255,21,100,0.15)', border: '1px solid rgba(255,21,100,0.4)', color: '#C0392B', cursor: 'pointer', ...T }}>
                  <Radio className="w-4 h-4" /> Watch Now
                </button>
              </Link>
            ) : (
              <button onClick={() => notifyMutation.mutate()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, cursor: 'pointer', ...T }}>
                <Bell className="w-4 h-4" /> Notify Me
              </button>
            )}
            <button className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bio + Socials */}
        <div className="mb-5 flex flex-col sm:flex-row gap-4 items-start">
          <p className="text-sm flex-1 max-w-2xl" style={{ color: 'rgba(255,255,255,0.6)' }}>{bio}</p>
          <div className="flex items-center gap-2 shrink-0">
            {profile?.social_links && Object.entries(profile.social_links).map(([platform, url]) => {
              const Icon = socialIcons[platform];
              return url ? (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  {Icon ? <Icon className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                </a>
              ) : null;
            })}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b mb-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all capitalize flex items-center justify-center gap-1"
              style={{ ...T, color: activeTab === tab ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: activeTab === tab ? GOLD : 'transparent', background: activeTab === tab ? 'rgba(212,175,55,0.05)' : 'transparent' }}>
              {tab === 'memberships' && <Crown className="w-3 h-3" />}
              {tab === 'merch' && <ShoppingBag className="w-3 h-3" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Live */}
        {activeTab === 'live' && (
          <div className="pb-16">
            {liveRoom ? (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.15)' }}>
                <div className="relative h-48 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${CRIMSON}44, #0d0618)` }}>
                  <div className="text-center">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-black text-sm uppercase" style={{ color: '#C0392B', ...T }}>LIVE NOW</span>
                    </div>
                    <h3 className="text-xl font-black text-white" style={T}>{liveRoom.title}</h3>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{liveRoom.viewer_count || 0} viewers watching</p>
                  </div>
                </div>
                <div className="p-4">
                  <Link to={createPageUrl('LiveRoom') + `?id=${liveRoom.id}`}>
                    <button className="w-full py-3 rounded-xl font-black uppercase text-sm flex items-center justify-center gap-2"
                      style={{ background: 'rgba(255,21,100,0.15)', border: '1px solid rgba(255,21,100,0.4)', color: '#C0392B', cursor: 'pointer', ...T }}>
                      <Play className="w-4 h-4" /> Join Stream
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.25)' }}>
                <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Not currently live</p>
                {scheduledRooms.length > 0 && (
                  <p className="text-sm mt-2">Next stream: <strong style={{ color: GOLD }}>{scheduledRooms[0]?.title}</strong></p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && <div className="pb-16"><VideoLibrary creatorId={userId} /></div>}

        {/* Schedule */}
        {activeTab === 'schedule' && (
          <div className="pb-16 space-y-3">
            {(profile?.stream_schedule || []).map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <Calendar className="w-5 h-5" style={{ color: GOLD }} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-sm text-white" style={T}>{item.title || 'Weekly Stream'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.day} · {item.time}</p>
                </div>
                <button onClick={() => notifyMutation.mutate()} className="px-3 py-1.5 rounded-xl font-black uppercase text-[10px] flex items-center gap-1"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer', ...T }}>
                  <Bell className="w-3 h-3" /> Remind
                </button>
              </div>
            ))}
            {scheduledRooms.map(r => (
              <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <Clock className="w-5 h-5" style={{ color: '#D4AF37' }} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-sm text-white" style={T}>{r.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.scheduled_start ? new Date(r.scheduled_start).toLocaleString() : 'Scheduled'}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', ...T }}>Upcoming</span>
              </div>
            ))}
            {!profile?.stream_schedule?.length && !scheduledRooms.length && (
              <p className="text-center py-12" style={{ color: 'rgba(255,255,255,0.25)' }}>No upcoming streams scheduled</p>
            )}
          </div>
        )}

        {/* Memberships */}
        {activeTab === 'memberships' && (
          <div className="pb-16 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5" style={{ color: GOLD }} />
              <h3 className="text-lg font-black text-white" style={T}>Support {displayName}</h3>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(13,6,24,0.5)' }}>
              <SubscriberTierView creatorId={userId} userId={currentUser?.id} />
            </div>
            <TierSubscribeCard
              tier={null}
              currentSub={null}
              userId={currentUser?.id}
              creatorId={userId}
              isHighlighted={false}
            />
            {currentUser?.id && (
              <StripeSubscribeButton creatorId={userId} creatorName={displayName} currentUserId={currentUser.id} />
            )}
            <TierBadge tier="bronze" size="sm" showName />
          </div>
        )}

        {/* Merch */}
        {activeTab === 'merch' && (
          <div className="pb-16">
            <MerchPreview creatorId={userId} />
          </div>
        )}

        {/* About */}
        {activeTab === 'about' && (
          <div className="pb-16">
            <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
              <div>
                <p className="text-xs font-black uppercase mb-2" style={{ color: GOLD, ...T }}>About</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{bio}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Category</p>
                  <p className="text-sm font-black capitalize text-white mt-1" style={T}>{category}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Total Hours</p>
                  <p className="text-sm font-black text-white mt-1" style={{ fontFamily: 'Orbitron, monospace' }}>{Math.round(profile?.total_hours_streamed || 0)}h</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
