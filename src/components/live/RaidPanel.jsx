import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Repeat, X, Search, Users, ArrowRight, Radio } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const BURGUNDY = '#800020';

function RaidCountdownBanner({ raid, onJoin }) {
  const [count, setCount] = useState(10);
  const qc = useQueryClient();

  useEffect(() => {
    if (count <= 0) {
      base44.entities.RaidEvent.update(raid.id, { status: 'active' }).catch(() => {});
      qc.invalidateQueries({ queryKey: ['raid-incoming', raid.to_room_id] });
      return;
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}
      className="fixed top-16 left-0 right-0 z-50 mx-4 rounded-2xl p-4"
      style={{ background: '#1A1A1A', border: `2px solid ${GOLD}`, boxShadow: `0 0 40px rgba(212,175,55,0.25)` }}>
      <div className="text-center space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          🔁 RAID STARTING IN
        </p>
        <div className="text-6xl font-black" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>
          {count}
        </div>
        <p className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>
          We're raiding <span style={{ color: GOLD }}>{raid.to_creator_username}</span>! Come with us 🎲
        </p>
        {raid.raid_message && <p className="text-[10px] italic" style={{ color: 'rgba(255,255,255,0.4)' }}>"{raid.raid_message}"</p>}
        {count <= 0 && (
          <button onClick={() => onJoin(raid)}
            className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 rounded-xl font-black uppercase text-[12px]"
            style={{ background: BURGUNDY, color: GOLD, border: `1px solid rgba(212,175,55,0.4)`, fontFamily: 'Barlow Condensed, sans-serif' }}>
            JOIN THE RAID <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function IncomingRaidBanner({ raid, onWelcome }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 15000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed bottom-24 right-4 z-50 w-72 rounded-2xl p-4 space-y-2"
          style={{ background: '#1A1A1A', border: `2px solid ${GOLD}`, boxShadow: `0 0 30px rgba(212,175,55,0.2)` }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                🔁 Incoming Raid!
              </p>
              <p className="text-[11px] font-bold text-white mt-0.5">
                <span style={{ color: GOLD }}>{raid.from_creator_username}</span> is raiding you with <strong>{raid.viewer_count_sent || 0}</strong> viewers!
              </p>
              {raid.raid_message && <p className="text-[11px] mt-1 italic" style={{ color: 'rgba(255,255,255,0.4)' }}>"{raid.raid_message}"</p>}
            </div>
            <button onClick={() => setVisible(false)}><X className="w-3.5 h-3.5 text-white/40" /></button>
          </div>
          <button onClick={() => { onWelcome(); setVisible(false); }}
            className="w-full py-2 rounded-xl font-black uppercase text-[10px]"
            style={{ background: `rgba(212,175,55,0.1)`, border: `1px solid rgba(212,175,55,0.3)`, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
            👋 Welcome Raiders!
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RaidLauncher({ room, currentUser, onClose }) {
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const qc = useQueryClient();

  const { data: liveRooms = [] } = useQuery({
    queryKey: ['raid-targets'],
    queryFn: () => base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 20),
  });

  const targets = liveRooms.filter(r => r.id !== room?.id && (
    !search || r.title?.toLowerCase().includes(search.toLowerCase())
  ));

  const raidMut = useMutation({
    mutationFn: async (target) => {
      const raid = await base44.entities.RaidEvent.create({
        from_room_id: room.id,
        to_room_id: target.id,
        from_creator_id: currentUser.id,
        from_creator_username: currentUser.full_name || currentUser.email,
        to_creator_id: target.host_id || '',
        to_creator_username: target.title,
        viewer_count_sent: room.viewer_count || 0,
        raid_message: message.trim(),
        status: 'pending',
        initiated_at: new Date().toISOString(),
      });
      return raid;
    },
    onSuccess: (raid) => {
      qc.invalidateQueries({ queryKey: ['raid-active', room?.id] });
      toast.success('Raid initiated! Countdown starting…');
      onClose();
      Promise.allSettled([
        base44.entities.Activity.create({
          user_id: currentUser.id,
          type: 'raid_sent',
          title: `Raided ${raid?.to_creator_username || 'a room'} with ${raid?.viewer_count_sent || 0} viewers`,
          recipient_id: raid?.to_creator_id,
        }),
        raid?.to_creator_id && base44.entities.Activity.create({
          user_id: raid.to_creator_id,
          type: 'raid_received',
          title: `Received raid from ${currentUser.full_name || currentUser.email}`,
          sender_id: currentUser.id,
        }),
      ]);
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Search className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
        <input placeholder="Search rooms…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-[11px] outline-none"
          style={{ color: 'white' }} />
      </div>
      <textarea placeholder="Raid message (optional)" value={message} onChange={e => setMessage(e.target.value)}
        rows={2} className="w-full px-3 py-2 rounded-lg resize-none text-[10px]"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
      <div className="space-y-1 max-h-56 overflow-y-auto">
        {targets.length === 0 && <p className="text-center py-3 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No live rooms found</p>}
        {targets.map(target => (
          <div key={target.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p className="text-[11px] font-bold text-white">{target.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Users className="w-2.5 h-2.5 text-white/30" />
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{target.viewer_count || 0} viewers</span>
                {target.category && <span className="text-[11px] px-1 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>{target.category}</span>}
              </div>
            </div>
            <button onClick={() => raidMut.mutate(target)} disabled={raidMut.isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-black uppercase"
              style={{ background: BURGUNDY, color: GOLD, border: `1px solid rgba(212,175,55,0.3)`, fontFamily: 'Barlow Condensed, sans-serif' }}>
              <Repeat className="w-2.5 h-2.5" /> Raid
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RaidPanelButton({ room, currentUser, isHost }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activateRaid, setActiveRaid] = useState(null);
  const [incomingRaid, setIncomingRaid] = useState(null);
  const qc = useQueryClient();

  // Poll for outgoing raid countdown
  const { data: outgoingRaids = [] } = useQuery({
    queryKey: ['raid-active', room?.id],
    queryFn: () => base44.entities.RaidEvent.filter({ from_room_id: room?.id, status: 'pending' }),
    enabled: !!room?.id && isHost,
    refetchInterval: 3000,
  });

  // Poll for incoming raid
  const { data: incomingRaids = [] } = useQuery({
    queryKey: ['raid-incoming', room?.id],
    queryFn: () => base44.entities.RaidEvent.filter({ to_room_id: room?.id, status: 'active' }),
    enabled: !!room?.id,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (outgoingRaids.length > 0 && !activateRaid) setActiveRaid(outgoingRaids[0]);
  }, [outgoingRaids]);
  useEffect(() => {
    if (incomingRaids.length > 0 && !incomingRaid) setIncomingRaid(incomingRaids[0]);
  }, [incomingRaids]);

  const welcomeRaiders = async () => {
    if (!room?.id) return;
    await base44.entities.Message.create({
      room_id: room.id,
      user_id: currentUser.id,
      user_name: 'System',
      content: `👋 Welcome raiders from ${incomingRaid?.from_creator_username}! Make yourselves at home!`,
      type: 'system',
    }).catch(() => {});
    if (incomingRaid?.id) await base44.entities.RaidEvent.update(incomingRaid.id, { status: 'completed' }).catch(() => {});
    setIncomingRaid(null);
  };

  const joinRaid = (raid) => {
    navigate(`/Room?id=${raid.to_room_id}`);
  };

  return (
    <>
      <AnimatePresence>
        {activateRaid && <RaidCountdownBanner raid={activateRaid} onJoin={joinRaid} />}
        {incomingRaid && <IncomingRaidBanner raid={incomingRaid} onWelcome={welcomeRaiders} />}
      </AnimatePresence>

      {/* Raid button (host only) */}
      {isHost && (
        <>
          <button onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
            title="Raid a creator"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Repeat className="w-3.5 h-3.5" /> Raid
          </button>

          <AnimatePresence>
            {open && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setOpen(false)} />
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xs p-4"
                  style={{ background: '#1A1A1A', borderLeft: `1px solid rgba(212,175,55,0.15)` }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4" style={{ color: GOLD }} />
                      <span className="font-black uppercase text-sm" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>Raid</span>
                    </div>
                    <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-white/40" /></button>
                  </div>
                  <RaidLauncher room={room} currentUser={currentUser} onClose={() => setOpen(false)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}