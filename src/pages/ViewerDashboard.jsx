import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Radio, Heart, Bell, Clock, DollarSign, Scissors,
  Play, TrendingUp, Star, Users, CheckCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ContentRecommendations from '../components/social/ContentRecommendations';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TABS = [
  { id: 'following', label: 'Following' },
  { id: 'activity', label: 'My Activity' },
  { id: 'discover', label: 'Discover' },
  { id: 'notifications', label: 'Alerts' },
];

function DarkTile({ children, style = {} }) {
  return (
    <div style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)', borderRadius: 16, ...style }}>
      {children}
    </div>
  );
}

function StatTile({ label, value, icon: Icon, color }) {
  return (
    <DarkTile style={{ padding: 16 }}>
      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>{label}</p>
      <p className="text-2xl font-black" style={{ color, fontFamily: 'Orbitron, monospace' }}>{value}</p>
      {Icon && <Icon className="w-3.5 h-3.5 mt-1" style={{ color: 'rgba(255,255,255,0.2)' }} />}
    </DarkTile>
  );
}

export default function ViewerDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('following');
  const [notifFilter, setNotifFilter] = useState('all');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: liveRooms = [] } = useQuery({
    queryKey: ['all-live-rooms'],
    queryFn: () => base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 20),
    refetchInterval: 15000,
  });

  const { data: scheduledRooms = [] } = useQuery({
    queryKey: ['upcoming-rooms'],
    queryFn: () => base44.entities.Room.filter({ status: 'scheduled' }, 'scheduled_start', 10),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: mySubscriptions = [] } = useQuery({
    queryKey: ['my-subs', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user?.id, status: 'active' }),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: myClips = [] } = useQuery({
    queryKey: ['my-clips', user?.id],
    queryFn: () => base44.entities.StreamClip.filter({ clipped_by_id: user?.id }, '-created_date', 10),
    enabled: !!user,
  });

  const { data: recentVODs = [] } = useQuery({
    queryKey: ['recent-vods'],
    queryFn: () => base44.entities.StreamRecording.list('-recorded_at', 12),
  });

  useEffect(() => {
    const unsub = base44.entities.Room.subscribe(() => {
      qc.invalidateQueries(['all-live-rooms']);
    });
    return unsub;
  }, [qc]);

  useEffect(() => {
    if (!user) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_id === user.id) {
        qc.invalidateQueries(['notifications', user.id]);
      }
    });
    return unsub;
  }, [user, qc]);

  const markAllRead = useMutation({
    mutationFn: () => Promise.all(notifications.filter(n => !n.is_read).map(n => base44.entities.Notification.update(n.id, { is_read: true }))),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredNotifs = notifFilter === 'all' ? notifications : notifications.filter(n => {
    if (notifFilter === 'live') return n.type === 'room_invite';
    if (notifFilter === 'tips') return n.type === 'tip';
    if (notifFilter === 'system') return n.type === 'announcement' || n.type === 'moderation';
    return true;
  });

  const getCountdown = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    if (diff <= 0) return 'Starting now';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
  };

  const initials = (title) => title?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between flex-wrap gap-2"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div>
          <h1 className="text-xl font-black text-white" style={T}>Your Feed</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Welcome back, {user?.full_name || 'Viewer'}</p>
        </div>
        {unreadCount > 0 && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, ...T }}>
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,11,24,0.8)' }}>
        {TABS.map(tab => {
          const label = tab.id === 'notifications' && unreadCount > 0 ? `${tab.label} (${unreadCount})` : tab.label;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 text-[11px] font-black uppercase border-b-2 transition-all"
              style={{ ...T, color: active ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: active ? GOLD : 'transparent', background: active ? 'rgba(212,175,55,0.05)' : 'transparent' }}>
              {label}
            </button>
          );
        })}
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-5 space-y-5">
        {/* FOLLOWING FEED */}
        {activeTab === 'following' && (
          <>
            {/* Live Now */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="font-black text-white text-sm" style={T}>Live Now</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black" style={{ background: 'rgba(255,21,100,0.12)', border: '1px solid rgba(255,21,100,0.3)', color: '#FF1564', ...T }}>{liveRooms.length}</span>
              </div>
              {liveRooms.length === 0 ? (
                <p className="text-sm py-4" style={{ color: 'rgba(255,255,255,0.25)' }}>No one is live right now</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {liveRooms.slice(0, 6).map((room, i) => (
                    <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <DarkTile style={{ padding: 16 }}>
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})`, color: '#fff', ...T }}>
                              {initials(room.title)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-red-500" style={{ borderColor: BG }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-white text-sm truncate" style={T}>{room.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>
                              <Users className="w-3 h-3" />{room.viewer_count || 0} watching
                            </div>
                          </div>
                        </div>
                        <Link to={createPageUrl('LiveRoom') + `?id=${room.id}`} className="block mt-3">
                          <button className="w-full py-2 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-1.5"
                            style={{ background: 'rgba(255,21,100,0.15)', border: '1px solid rgba(255,21,100,0.4)', color: '#FF1564', ...T }}>
                            <Radio className="w-3.5 h-3.5" /> Join Now
                          </button>
                        </Link>
                      </DarkTile>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming */}
            <div className="space-y-3">
              <h2 className="font-black text-white text-sm flex items-center gap-2" style={T}>
                <Clock className="w-4 h-4" style={{ color: '#00d4ff' }} /> Upcoming Streams
              </h2>
              {scheduledRooms.slice(0, 4).map(room => (
                <div key={room.id} className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(0,212,255,0.1)' }}>
                    <Clock className="w-5 h-5" style={{ color: '#00d4ff' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate" style={T}>{room.title}</p>
                    <p className="text-xs" style={{ color: '#00d4ff' }}>{getCountdown(room.scheduled_start)}</p>
                  </div>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', ...T }}>Upcoming</span>
                </div>
              ))}
            </div>

            {/* Recent VODs */}
            <div className="space-y-3">
              <h2 className="font-black text-white text-sm" style={T}>Recent Videos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {recentVODs.slice(0, 6).map((vod, i) => (
                  <motion.div key={vod.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="group cursor-pointer">
                    <div className="relative rounded-xl overflow-hidden aspect-video mb-2" style={{ background: 'rgba(26,10,32,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-8 h-8 transition-all" style={{ color: 'rgba(255,255,255,0.25)' }} />
                      </div>
                      {vod.duration_seconds && (
                        <span className="absolute bottom-1.5 right-1.5 text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.8)', color: '#fff' }}>
                          {Math.floor(vod.duration_seconds / 60)}m
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-black line-clamp-1" style={{ color: 'rgba(255,255,255,0.8)', ...T }}>{vod.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{vod.views || 0} views</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* MY ACTIVITY */}
        {activeTab === 'activity' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile label="Subscriptions" value={mySubscriptions.length} icon={Star} color="#a78bfa" />
              <StatTile label="Clips" value={myClips.length} icon={Scissors} color="#a78bfa" />
              <StatTile label="Notifications" value={notifications.length} icon={Bell} color={GOLD} />
              <StatTile label="Live Now" value={liveRooms.length} icon={Heart} color="#f472b6" />
            </div>

            {/* Subscriptions */}
            <DarkTile style={{ padding: 16 }}>
              <p className="text-xs font-black uppercase mb-3" style={{ color: GOLD, ...T }}>Active Subscriptions</p>
              {mySubscriptions.length === 0
                ? <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.25)' }}>No active subscriptions</p>
                : mySubscriptions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(212,175,55,0.15)' }}>
                      <Star className="w-4 h-4" style={{ color: '#a78bfa' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-white" style={T}>{s.tier_name || 'Subscription'}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>${s.price}/mo · since {s.start_date ? new Date(s.start_date).toLocaleDateString() : new Date(s.created_date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.2)', color: '#00ff88', ...T }}>Active</span>
                  </div>
                ))
              }
            </DarkTile>

            {/* My Clips */}
            <DarkTile style={{ padding: 16 }}>
              <p className="text-xs font-black uppercase mb-3" style={{ color: '#a78bfa', ...T }}>My Clips</p>
              {myClips.length === 0
                ? <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.25)' }}>No clips yet — create one during a stream!</p>
                : myClips.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-10 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" style={{ background: 'rgba(167,139,250,0.1)' }}>✂️</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate" style={T}>{c.title}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{c.duration_seconds}s · {c.view_count || 0} views</p>
                    </div>
                  </div>
                ))
              }
            </DarkTile>
          </>
        )}

        {/* DISCOVER */}
        {activeTab === 'discover' && (
          <div className="space-y-3">
            <ContentRecommendations />
            <h2 className="font-black text-white text-sm flex items-center gap-2" style={T}>
              <TrendingUp className="w-4 h-4" style={{ color: GOLD }} /> Trending Streams
            </h2>
            {liveRooms.slice(0, 8).map((room, i) => (
              <motion.div key={room.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={createPageUrl('LiveRoom') + `?id=${room.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                    <span className="font-mono text-sm w-5 text-center" style={{ color: 'rgba(212,175,55,0.4)' }}>{i + 1}</span>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm" style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})`, color: '#fff', ...T }}>
                      {initials(room.title)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate" style={T}>{room.title}</p>
                      <div className="flex items-center gap-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <Users className="w-3 h-3" />{room.viewer_count || 0}
                        {room.type && <span>· {room.type}</span>}
                      </div>
                    </div>
                    <button className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-black" style={{ background: 'rgba(128,0,32,0.3)', border: '1px solid rgba(128,0,32,0.5)', color: '#fff', ...T }}>
                      Watch
                    </button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-1.5">
                {['all', 'live', 'tips', 'system'].map(f => (
                  <button key={f} onClick={() => setNotifFilter(f)}
                    className="text-xs px-3 py-1.5 rounded-lg border capitalize transition-all font-black uppercase"
                    style={{ ...T, border: `1px solid ${notifFilter === f ? GOLD : 'rgba(255,255,255,0.1)'}`, background: notifFilter === f ? 'rgba(212,175,55,0.1)' : 'transparent', color: notifFilter === f ? GOLD : 'rgba(255,255,255,0.35)' }}>
                    {f === 'live' ? '🔴 Live' : f === 'tips' ? '💰 Tips' : f === 'system' ? '⚙️ System' : 'All'}
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <button onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', ...T }}>
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="space-y-2">
              {filteredNotifs.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                  <p className="font-black uppercase text-sm" style={T}>No notifications</p>
                </div>
              ) : filteredNotifs.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="flex items-start gap-3 p-3 rounded-xl border transition-all"
                    style={{ background: !n.is_read ? 'rgba(212,175,55,0.04)' : 'rgba(13,6,24,0.9)', borderColor: !n.is_read ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.05)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{ background: n.type === 'tip' ? 'rgba(212,175,55,0.15)' : n.type === 'room_invite' ? 'rgba(255,21,100,0.12)' : 'rgba(255,255,255,0.06)' }}>
                      {n.type === 'tip' ? '💰' : n.type === 'room_invite' ? '🔴' : n.type === 'subscription' ? '⭐' : '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white" style={T}>{n.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{n.message}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{new Date(n.created_date).toLocaleString()}</p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: GOLD }} />}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
