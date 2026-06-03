import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Crown, Hand, Check, X } from 'lucide-react';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const BG      = '#080B18';
const OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const PALETTE = ['#8B6F47','#6B7C4A','#CC7755','#4A6B7C','#7C4A6B','#5C6BC0','#26A69A','#EF6C00'];

function avatarColor(name) {
  return PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];
}

function useAudioLevel(stream) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ctxRef     = useRef(null);
  const rafRef     = useRef(null);

  useEffect(() => {
    if (!stream) { setIsSpeaking(false); return; }
    const tracks = stream.getAudioTracks();
    if (!tracks.length) { setIsSpeaking(false); return; }

    try {
      const ctx      = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const check = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        setIsSpeaking(Math.sqrt(sum / data.length) > 0.01);
        rafRef.current = requestAnimationFrame(check);
      };
      check();
    } catch {
      setIsSpeaking(false);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (ctxRef.current) { try { ctxRef.current.close(); } catch {} }
    };
  }, [stream]);

  return isSpeaking;
}

function OctTile({ member, size, isHost, isMuted, stream, showControls, onRemove }) {
  const speaking   = useAudioLevel(stream);
  const color      = avatarColor(member.display_name || 'A');
  const initial    = (member.display_name || '?').charAt(0).toUpperCase();
  const [popover, setPopover] = useState(false);
  const pressTimer = useRef(null);

  function handlePointerDown() {
    if (!showControls) return;
    pressTimer.current = setTimeout(() => setPopover(true), 600);
  }
  function handlePointerUp() {
    clearTimeout(pressTimer.current);
  }
  function handleClick() {
    if (showControls) setPopover(v => !v);
  }

  return (
    <div className="flex flex-col items-center gap-1 relative select-none">
      <motion.div
        style={{
          width: size,
          height: size,
          clipPath: OCT,
          background: isHost
            ? `linear-gradient(135deg, ${CRIMSON}, #4a0012)`
            : `rgba(30,10,30,0.9)`,
          border: `2px solid rgba(212,175,55,0.3)`,
          position: 'relative',
          cursor: showControls ? 'pointer' : 'default',
        }}
        animate={{
          boxShadow: speaking
            ? ['0 0 0 3px #D4AF37, 0 0 18px #D4AF3788', '0 0 0 5px #D4AF37, 0 0 28px #D4AF3755', '0 0 0 3px #D4AF37, 0 0 18px #D4AF3788']
            : 'none',
        }}
        transition={speaking ? { boxShadow: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } } : {}}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            clipPath: OCT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isHost
              ? `linear-gradient(135deg, ${CRIMSON}, #4a0012)`
              : `linear-gradient(135deg, ${color}55, rgba(8,11,24,0.95))`,
            fontSize: size > 60 ? 22 : 14,
            fontWeight: 900,
            color: '#fff',
            fontFamily: 'Barlow Condensed, sans-serif',
          }}
        >
          {member.avatar_url
            ? <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initial}
        </div>

        {isHost && (
          <div style={{ position: 'absolute', top: -4, right: -2, pointerEvents: 'none' }}>
            <Crown style={{ width: 12, height: 12, color: GOLD, filter: 'drop-shadow(0 0 4px #D4AF37)' }} />
          </div>
        )}

        {isMuted && (
          <div style={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#EF4444',
            border: `2px solid ${BG}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MicOff style={{ width: 7, height: 7, color: '#fff' }} />
          </div>
        )}
      </motion.div>

      <span style={{
        fontSize: 11,
        fontFamily: 'Barlow Condensed, sans-serif',
        color: '#fff',
        maxWidth: size + 8,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}>
        {(member.display_name || 'Guest').split(' ')[0]}
      </span>

      <AnimatePresence>
        {popover && showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            style={{
              position: 'absolute',
              top: size + 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              background: 'rgba(8,11,24,0.97)',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: 8,
              padding: '6px 0',
              minWidth: 120,
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}
          >
            <button
              onClick={() => { onRemove?.(member.user_id); setPopover(false); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '5px 12px',
                textAlign: 'left',
                fontSize: 11,
                fontFamily: 'Barlow Condensed, sans-serif',
                color: '#EF4444',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Remove from Stage
            </button>
            <button
              onClick={() => setPopover(false)}
              style={{
                display: 'block',
                width: '100%',
                padding: '5px 12px',
                textAlign: 'left',
                fontSize: 11,
                fontFamily: 'Barlow Condensed, sans-serif',
                color: 'rgba(255,255,255,0.4)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ListenerTile({ member, hasRaisedHand }) {
  const size  = 52;
  const color = avatarColor(member.display_name || 'A');
  const initial = (member.display_name || '?').charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-0.5 relative">
      <div style={{ position: 'relative', width: size, height: size }}>
        <div style={{
          width: size,
          height: size,
          clipPath: OCT,
          background: `linear-gradient(135deg, ${color}55, rgba(8,11,24,0.9))`,
          border: '2px solid rgba(212,175,55,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 900,
          color: '#fff',
          fontFamily: 'Barlow Condensed, sans-serif',
        }}>
          {member.avatar_url
            ? <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', clipPath: OCT }} />
            : initial}
        </div>
        {hasRaisedHand && (
          <div style={{
            position: 'absolute',
            top: -4,
            right: -4,
            fontSize: 14,
            lineHeight: 1,
            filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))',
          }}>
            ✋
          </div>
        )}
      </div>
      <span style={{
        fontSize: 11,
        fontFamily: 'Barlow Condensed, sans-serif',
        color: 'rgba(255,255,255,0.6)',
        maxWidth: size + 4,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {(member.display_name || 'Guest').slice(0, 8)}
      </span>
    </div>
  );
}

export default function AudioStageTab({
  roomId,
  user,
  party,
  members,
  localStream,
  remoteStreams,
  onLeave,
}) {
  const hostId   = party?.host_id;
  const isHost   = !!(user?.id && hostId && user.id === hostId);

  const [speakers,   setSpeakers]   = useState(() => new Set(hostId ? [hostId] : []));
  const [raisedHands, setRaisedHands] = useState(() => new Set());
  const [isMuted,    setIsMuted]    = useState(false);

  useEffect(() => {
    if (hostId) setSpeakers(prev => { const next = new Set(prev); next.add(hostId); return next; });
  }, [hostId]);

  const speakerMembers  = members.filter(m => speakers.has(m.user_id));
  const listenerMembers = members.filter(m => !speakers.has(m.user_id));
  const stageCount      = speakers.size;
  const handCount       = raisedHands.size;
  const isSelf          = (uid) => user?.id === uid;
  const selfRaisedHand  = user?.id ? raisedHands.has(user.id) : false;

  function toggleMic() {
    const track = localStream?.getAudioTracks()[0];
    if (track) track.enabled = isMuted;
    setIsMuted(v => !v);
  }

  function toggleHand() {
    if (!user?.id) return;
    setRaisedHands(prev => {
      const next = new Set(prev);
      if (next.has(user.id)) next.delete(user.id);
      else next.add(user.id);
      return next;
    });
  }

  function promoteToStage(userId) {
    setSpeakers(prev => { const next = new Set(prev); next.add(userId); return next; });
    setRaisedHands(prev => { const next = new Set(prev); next.delete(userId); return next; });
  }

  function dismissHand(userId) {
    setRaisedHands(prev => { const next = new Set(prev); next.delete(userId); return next; });
  }

  function removeFromStage(userId) {
    if (userId === hostId) return;
    setSpeakers(prev => { const next = new Set(prev); next.delete(userId); return next; });
  }

  function getStream(userId) {
    if (isSelf(userId)) return localStream || null;
    if (!remoteStreams) return null;
    for (const [, stream] of remoteStreams) {
      if (stream._userId === userId) return stream;
    }
    return null;
  }

  const raisedHandQueue = members.filter(m => raisedHands.has(m.user_id) && !speakers.has(m.user_id));

  const sectionLabel = {
    fontSize: 11,
    fontFamily: 'Barlow Condensed, sans-serif',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 10,
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: BG,
      fontFamily: 'Barlow Condensed, sans-serif',
      overflow: 'hidden',
    }}>

      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 16px',
        height: 48,
        background: 'rgba(8,11,24,0.9)',
        borderBottom: '1px solid rgba(212,175,55,0.12)',
      }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Stage
        </span>
        <span style={{ fontSize: 13, color: '#fff', opacity: 0.6 }}>
          {stageCount}/20
        </span>

        <div style={{ flex: 1 }} />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleMic}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: isMuted
              ? 'rgba(239,68,68,0.18)'
              : `linear-gradient(135deg, ${GOLD}, #B8960C)`,
            border: isMuted ? '1px solid rgba(239,68,68,0.5)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isMuted ? 'none' : '0 2px 12px rgba(212,175,55,0.35)',
          }}
        >
          {isMuted
            ? <MicOff style={{ width: 16, height: 16, color: '#EF4444' }} />
            : <Mic style={{ width: 16, height: 16, color: '#000' }} />}
        </motion.button>

        <div style={{ position: 'relative' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleHand}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: selfRaisedHand ? `rgba(212,175,55,0.18)` : 'rgba(255,255,255,0.06)',
              border: selfRaisedHand ? `1px solid rgba(212,175,55,0.5)` : '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✋
          </motion.button>
          {handCount > 0 && (
            <div style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: '#FF1564',
              color: '#fff',
              fontSize: 11,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
            }}>
              {handCount}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 20px' }}>

        <div style={{ marginBottom: 20 }}>
          <div style={sectionLabel}>Speakers on Stage</div>
          {speakerMembers.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 8px' }}>
              {speakerMembers.map(m => (
                <div key={m.user_id} style={{ display: 'flex', justifyContent: 'center' }}>
                  <OctTile
                    member={m}
                    size={80}
                    isHost={m.user_id === hostId}
                    isMuted={isSelf(m.user_id) ? isMuted : false}
                    stream={getStream(m.user_id)}
                    showControls={isHost && m.user_id !== hostId}
                    onRemove={removeFromStage}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>
              No speakers on stage yet
            </p>
          )}
        </div>

        <div style={{ marginBottom: isHost && raisedHandQueue.length > 0 ? 20 : 0 }}>
          <div style={sectionLabel}>
            Listeners ({listenerMembers.length})
          </div>
          {listenerMembers.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {listenerMembers.map(m => (
                <ListenerTile
                  key={m.user_id}
                  member={m}
                  hasRaisedHand={raisedHands.has(m.user_id)}
                />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>
              Be the first to raise your hand ✋
            </p>
          )}
        </div>

        <AnimatePresence>
          {isHost && raisedHandQueue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              style={{
                borderRadius: 12,
                background: 'rgba(212,175,55,0.05)',
                border: '1px solid rgba(212,175,55,0.18)',
                padding: '12px 14px',
              }}
            >
              <div style={{ ...sectionLabel, marginBottom: 8 }}>
                Hand-raise queue
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {raisedHandQueue.map(m => (
                  <div
                    key={m.user_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.display_name || 'Guest'} wants to speak
                    </span>
                    <button
                      onClick={() => promoteToStage(m.user_id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(0,255,136,0.12)',
                        border: '1px solid rgba(0,255,136,0.35)',
                        color: '#00FF88',
                        fontSize: 11,
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Check style={{ width: 12, height: 12 }} /> Bring up
                    </button>
                    <button
                      onClick={() => dismissHand(m.user_id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#EF4444',
                        fontSize: 11,
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <X style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
