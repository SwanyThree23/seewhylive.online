import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Radio, Users, MessageCircle, Heart, Share2, Copy, Check, ExternalLink, LogIn } from 'lucide-react';
import { toast } from 'sonner';

var GOLD = '#C9A84C';
var BG = '#0E0C09';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };

function LiveBadge() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 4, background: '#FF1A3C', ...T }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'blink 1.2s ease-in-out infinite', display: 'inline-block' }} />
      <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '0.08em' }}>LIVE</span>
      <style>{'@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}'}</style>
    </div>
  );
}

export default function PublicStreamViewer() {
  var [params] = useSearchParams();
  var roomId = params.get('id') || params.get('room');
  var [copied, setCopied] = useState(false);
  var [liked, setLiked] = useState(false);
  var [chatInput, setChatInput] = useState('');
  var [chatOpen, setChatOpen] = useState(false);

  var { data: room } = useQuery({
    queryKey: ['public-room', roomId],
    queryFn: function() { return base44.entities.WatchParty.filter({ id: roomId }).then(function(r) { return r[0] || null; }); },
    enabled: !!roomId,
    refetchInterval: 15000,
  });

  var { data: creator } = useQuery({
    queryKey: ['public-creator', room && room.host_id],
    queryFn: function() { return base44.entities.CreatorProfile.filter({ user_id: room.host_id }).then(function(r) { return r[0] || null; }); },
    enabled: !!(room && room.host_id),
  });

  var { data: chatMessages = [] } = useQuery({
    queryKey: ['public-chat', roomId],
    queryFn: function() { return base44.entities.Message.filter({ room_id: roomId }, '-created_date', 30); },
    enabled: !!roomId && chatOpen,
    refetchInterval: 5000,
  });

  var shareUrl = window.location.href;
  var isLive = room && room.status === 'live';
  var hlsUrl = room && (room.hls_url || room.recording_url);

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: (room && room.title) || 'Live on SeeWhy', url: shareUrl }).catch(function() {});
    } else {
      navigator.clipboard.writeText(shareUrl).catch(function() {});
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(function() { setCopied(false); }, 2000);
    }
  }

  if (!roomId) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', ...T, fontSize: 16 }}>No stream ID provided</p>
        <Link to="/login" style={{ marginTop: 16, color: GOLD, ...T, fontSize: 14 }}>Sign in to SeeWhy LIVE →</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', display: 'flex', flexDirection: 'column', maxWidth: 520, margin: '0 auto', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(14,12,9,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #800020, #C9A84C)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio style={{ width: 14, height: 14, color: '#fff' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 900, ...T, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(room && room.title) || 'Live Stream'}</p>
            {creator && <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', ...T }}>{creator.display_name || creator.username || 'Creator'}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLive && <LiveBadge />}
          <button onClick={handleShare} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, ...T, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
            {copied ? <><Check style={{ width: 12, height: 12 }} /> Copied</> : <><Share2 style={{ width: 12, height: 12 }} /> Share</>}
          </button>
        </div>
      </div>

      {/* Video area */}
      <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative', overflow: 'hidden' }}>
        {hlsUrl ? (
          <video
            src={hlsUrl}
            autoPlay
            playsInline
            controls
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a0510, #080B18)', gap: 12 }}>
            {isLive ? (
              <>
                <Radio style={{ width: 48, height: 48, color: 'rgba(255,26,60,0.6)' }} />
                <p style={{ ...T, fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Stream is live — sign in to watch with full experience</p>
              </>
            ) : (
              <>
                <Radio style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.1)' }} />
                <p style={{ ...T, fontSize: 14, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Stream has ended</p>
              </>
            )}
          </div>
        )}

        {/* Viewer count overlay */}
        {isLive && (
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <Users style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.6)' }} />
            <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{(room && room.viewer_count) || 0} watching</span>
          </div>
        )}
      </div>

      {/* Stream info */}
      <div style={{ padding: '16px 16px 0' }}>
        <h1 style={{ ...T, fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '0.02em' }}>{(room && room.title) || 'Live Stream'}</h1>
        {room && room.description && (
          <p style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 12px' }}>{room.description}</p>
        )}

        {/* Stat row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {[
            { icon: Users, value: (room && room.viewer_count) || 0, label: 'viewers' },
            { icon: Heart, value: (room && room.like_count) || 0, label: 'likes' },
          ].map(function(s) {
            var Icon = s.icon;
            return (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon style={{ width: 14, height: 14, color: GOLD }} />
                <span style={{ ...T, fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.value}</span>
                <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
              </div>
            );
          })}
          <button
            onClick={function() { setLiked(function(v) { return !v; }); }}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, border: '1px solid ' + (liked ? 'rgba(255,26,60,0.5)' : 'rgba(255,255,255,0.1)'), background: liked ? 'rgba(255,26,60,0.12)' : 'transparent', cursor: 'pointer', ...T, fontSize: 12, fontWeight: 700, color: liked ? '#FF1A3C' : 'rgba(255,255,255,0.5)' }}
          >
            <Heart style={{ width: 13, height: 13, fill: liked ? '#FF1A3C' : 'none' }} /> {liked ? 'Liked!' : 'Like'}
          </button>
        </div>
      </div>

      {/* Join CTA — primary conversion surface */}
      <div style={{ margin: '0 16px 16px', padding: 16, borderRadius: 16, background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(128,0,32,0.08))', border: '1px solid rgba(201,168,76,0.2)' }}>
        <p style={{ ...T, fontSize: 14, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Join SeeWhy LIVE Free</p>
        <p style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 12px' }}>Go live yourself, tip creators directly, chat in real time — no platform cut on direct payments.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            to="/register"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, background: GOLD, color: '#000', textDecoration: 'none', ...T, fontSize: 13, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            Sign Up Free →
          </Link>
          <Link
            to={'/login?next=' + encodeURIComponent('/LiveRoom?id=' + roomId)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', ...T, fontSize: 12, fontWeight: 700 }}
          >
            <LogIn style={{ width: 14, height: 14 }} /> Sign In
          </Link>
        </div>
      </div>

      {/* Chat preview (read-only teaser) */}
      <div style={{ margin: '0 16px 80px' }}>
        <button
          onClick={function() { setChatOpen(function(v) { return !v; }); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}
        >
          <MessageCircle style={{ width: 14, height: 14 }} />
          {chatOpen ? 'Hide live chat' : 'View live chat (read-only)'}
        </button>

        {chatOpen && (
          <div style={{ marginTop: 8, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ maxHeight: 240, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chatMessages.length === 0 && (
                <p style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>No messages yet</p>
              )}
              {chatMessages.slice(0, 20).map(function(msg) {
                return (
                  <div key={msg.id} style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(201,168,76,0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...T, fontSize: 10, fontWeight: 900, color: GOLD }}>
                      {((msg.sender_name || '?')[0]).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ ...T, fontSize: 11, fontWeight: 700, color: GOLD }}>{msg.sender_name || 'Viewer'} </span>
                      <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{msg.content}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', ...T, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                Sign in to chat...
              </div>
              <Link to={'/login?next=' + encodeURIComponent('/LiveRoom?id=' + roomId)} style={{ padding: '7px 12px', borderRadius: 8, background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', textDecoration: 'none', ...T, fontSize: 11, fontWeight: 900, color: GOLD, display: 'flex', alignItems: 'center' }}>
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer share bar */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 520, padding: '10px 16px', background: 'rgba(14,12,9,0.98)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8, zIndex: 50, boxSizing: 'border-box' }}>
        <button
          onClick={function() {
            var text = '🔴 Watch ' + ((room && room.title) || 'this live stream') + ' on SeeWhy LIVE → ' + shareUrl;
            navigator.clipboard.writeText(text).catch(function() {});
            toast.success('Share text copied!');
          }}
          style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Copy style={{ width: 13, height: 13 }} /> Copy link
        </button>
        <button
          onClick={function() {
            var text = '🔴 Watching live on SeeWhy LIVE! Join me → ' + shareUrl + ' #SeeWhyLIVE';
            var url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
            window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
          }}
          style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          🐦 Tweet
        </button>
        <button
          onClick={function() {
            var url = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl);
            window.open(url, '_blank', 'width=620,height=400,noopener,noreferrer');
          }}
          style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', ...T, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          👥 FB
        </button>
      </div>
    </div>
  );
}
