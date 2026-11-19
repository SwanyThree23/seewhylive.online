import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FollowButton from '../components/shared/FollowButton';
import DirectPayments from '../components/live/DirectPayments';
import ShareButtons from '../components/shared/ShareButtons';
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize2, Heart,
  Share2, DollarSign, MessageSquare, Eye, Clock, Send, Copy, Check,
  Lock,
} from 'lucide-react';

var C = {
  bg: '#080B18', surface: '#0E0C09', card: '#10101E', cardHi: '#14141F',
  line: '#1E1E2E', text: '#F0E8D4', muted: '#5A5A7A',
  gold: '#C9A84C', accent: '#FF1A3C', green: '#00FF88',
};
var FONT = 'Barlow Condensed, sans-serif';
var DISPLAY = 'Syne, sans-serif';

function formatDur(secs) {
  if (!secs) return '';
  var m = Math.floor(secs / 60);
  var s = Math.floor(secs % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function timeAgo(iso) {
  if (!iso) return '';
  var diff = Date.now() - new Date(iso).getTime();
  var mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + 'm ago';
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

export default function VideoViewer() {
  var [params] = useSearchParams();
  var roomId = params.get('id');

  var [room, setRoom] = useState(null);
  var [creator, setCreator] = useState(null);
  var [loading, setLoading] = useState(true);
  var [liked, setLiked] = useState(false);
  var [likeCount, setLikeCount] = useState(0);
  var [comments, setComments] = useState([]);
  var [commentText, setCommentText] = useState('');
  var [posting, setPosting] = useState(false);
  var [payOpen, setPayOpen] = useState(false);
  var [shareOpen, setShareOpen] = useState(false);
  var [copied, setCopied] = useState(false);
  var [paused, setPaused] = useState(true);
  var [muted, setMuted] = useState(false);
  var [currentTime, setCurrentTime] = useState(0);
  var [duration, setDuration] = useState(0);
  var [me, setMe] = useState(null);

  var videoRef = useRef(null);

  useEffect(function() {
    if (!roomId) { setLoading(false); return; }
    var cancelled = false;
    base44.auth.me().then(function(u) { if (!cancelled) setMe(u); }).catch(function() {});
    base44.entities.Room.filter({ id: roomId }).then(function(res) {
      var r = (res.items || res || [])[0];
      if (cancelled || !r) { setLoading(false); return; }
      setRoom(r);
      setLikeCount(r.like_count || 0);
      return base44.entities.CreatorProfile.filter({ user_id: r.host_id });
    }).then(function(cres) {
      if (!cancelled && cres) setCreator((cres.items || cres || [])[0] || null);
    }).catch(function() {}).finally(function() {
      if (!cancelled) setLoading(false);
    });
    base44.entities.Message.filter({ room_id: roomId }, { sort: '-created_date', limit: 30 }).then(function(mres) {
      if (!cancelled) setComments((mres.items || mres || []).reverse());
    }).catch(function() {});
    return function() { cancelled = true; };
  }, [roomId]);

  function togglePlay() {
    var v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPaused(false); } else { v.pause(); setPaused(true); }
  }

  function toggleMute() {
    var v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function seek(e) {
    var v = videoRef.current;
    if (!v || !duration) return;
    var rect = e.currentTarget.getBoundingClientRect();
    var pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * duration;
  }

  function fullscreen() {
    var v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
  }

  async function toggleLike() {
    if (!room) return;
    var newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(function(c) { return newLiked ? c + 1 : Math.max(0, c - 1); });
    try {
      await base44.entities.Room.update(room.id, { like_count: newLiked ? likeCount + 1 : Math.max(0, likeCount - 1) });
    } catch (e) { /* best-effort */ }
  }

  async function postComment(e) {
    e.preventDefault();
    var text = commentText.trim();
    if (!text || !room || !me) return;
    setPosting(true);
    try {
      var msg = await base44.entities.Message.create({
        room_id: room.id,
        user_id: me.id,
        display_name: me.full_name || me.email || 'You',
        content: text,
        created_date: new Date().toISOString(),
      });
      setComments(function(prev) { return prev.concat([msg]); });
      setCommentText('');
    } catch (e) { /* ignore */ }
    setPosting(false);
  }

  async function copyLink() {
    var url = window.location.origin + '/VideoViewer?id=' + roomId;
    await navigator.clipboard.writeText(url).catch(function() {});
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ fontFamily: FONT, fontSize: 18, color: C.muted }}>Video not found.</p>
        <Link to={createPageUrl('Home')} style={{ color: C.gold, fontFamily: FONT, textDecoration: 'none' }}>← Back to Home</Link>
      </div>
    );
  }

  var isOwnVideo = me && room.host_id && me.id === room.host_id;
  var isPaywalled = room.is_exclusive && !isOwnVideo;
  var videoUrl = room.recording_url || '';
  var progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '12px 16px 80px' }}>

        {/* Back nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button
            onClick={function() { window.history.back(); }}
            style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid ' + C.line, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </button>
          <span style={{ fontFamily: FONT, fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Video Post</span>
        </div>

        {/* Video player */}
        <div style={{ position: 'relative', background: '#000', borderRadius: 16, overflow: 'hidden', border: '1px solid ' + C.line }}>
          {isPaywalled ? (
            <div style={{ aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Lock style={{ width: 36, height: 36, color: C.gold }} />
              <p style={{ fontFamily: FONT, fontSize: 15, color: C.muted }}>Members only</p>
              {room.price_usd && (
                <span style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, color: C.text }}>${room.price_usd}</span>
              )}
            </div>
          ) : videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              style={{ width: '100%', maxHeight: 480, display: 'block', background: '#000' }}
              onTimeUpdate={function(e) { setCurrentTime(e.target.currentTime); }}
              onDurationChange={function(e) { setDuration(e.target.duration); }}
              onPlay={function() { setPaused(false); }}
              onPause={function() { setPaused(true); }}
              onEnded={function() { setPaused(true); }}
            />
          ) : (
            <div style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: FONT, fontSize: 13, color: C.muted }}>No video available</span>
            </div>
          )}

          {/* Player controls overlay */}
          {videoUrl && !isPaywalled && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
              {/* Progress bar */}
              <div
                onClick={seek}
                style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, cursor: 'pointer', marginBottom: 8, position: 'relative' }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: progress + '%', background: C.gold, borderRadius: 2 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2 }}>
                  {paused ? <Play style={{ width: 18, height: 18 }} /> : <Pause style={{ width: 18, height: 18 }} />}
                </button>
                <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2 }}>
                  {muted ? <VolumeX style={{ width: 16, height: 16 }} /> : <Volume2 style={{ width: 16, height: 16 }} />}
                </button>
                <span style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,0.7)', flex: 1 }}>
                  {formatDur(currentTime)} / {formatDur(duration)}
                </span>
                <button onClick={fullscreen} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2 }}>
                  <Maximize2 style={{ width: 15, height: 15 }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Title + meta */}
        <div style={{ marginTop: 14 }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 800, color: C.text, margin: '0 0 6px' }}>
            {room.title || 'Untitled Video'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontSize: 12, color: C.muted }}>
              <Eye style={{ width: 12, height: 12 }} /> {room.viewer_count || 0} views
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontSize: 12, color: C.muted }}>
              <Clock style={{ width: 12, height: 12 }} /> {timeAgo(room.created_date)}
            </span>
            {duration > 0 && (
              <span style={{ fontFamily: FONT, fontSize: 12, color: C.muted }}>{formatDur(duration)}</span>
            )}
          </div>
          {room.description && (
            <p style={{ marginTop: 8, fontFamily: FONT, fontSize: 13, color: 'rgba(240,232,212,0.72)', lineHeight: 1.5 }}>
              {room.description}
            </p>
          )}
        </div>

        {/* Creator row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '12px 14px', background: C.card, borderRadius: 14, border: '1px solid ' + C.line }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', background: C.cardHi, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(201,168,76,0.3)' }}>
            {(creator && creator.avatar_url) ? (
              <img src={creator.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: DISPLAY, fontWeight: 900, color: C.gold, fontSize: 16 }}>
                {((creator && creator.display_name) || 'S')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {(creator && creator.display_name) || 'Creator'}
            </div>
            {(creator && creator.category) && (
              <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{creator.category}</div>
            )}
          </div>
          {room.host_id && (
            <FollowButton targetUserId={room.host_id} targetUserName={(creator && creator.display_name) || ''} size="sm" />
          )}
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={toggleLike}
            style={{ flex: 1, minHeight: 44, borderRadius: 12, background: liked ? 'rgba(255,26,60,0.15)' : C.card, border: '1px solid ' + (liked ? 'rgba(255,26,60,0.4)' : C.line), color: liked ? C.accent : C.text, fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            <Heart style={{ width: 15, height: 15, fill: liked ? C.accent : 'none' }} /> {likeCount}
          </button>
          <button
            onClick={function() { setPayOpen(true); }}
            style={{ flex: 1, minHeight: 44, borderRadius: 12, background: 'linear-gradient(135deg, #FFB800, #FF8C00)', border: 'none', color: '#000', fontFamily: FONT, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            <DollarSign style={{ width: 15, height: 15 }} /> Support
          </button>
          <button
            onClick={function() { setShareOpen(function(o) { return !o; }); }}
            style={{ flex: 1, minHeight: 44, borderRadius: 12, background: shareOpen ? C.cardHi : C.card, border: '1px solid ' + (shareOpen ? C.gold : C.line), color: C.text, fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            <Share2 style={{ width: 15, height: 15 }} /> Share
          </button>
        </div>

        {/* Social share panel */}
        {shareOpen && room && (
          <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 12, background: C.card, border: '1px solid ' + C.line }}>
            <ShareButtons
              url={window.location.origin + createPageUrl('VideoViewer') + '?id=' + room.id}
              title={(room.title || 'Watch this video') + ' on SeeWhy LIVE'}
            />
          </div>
        )}

        {/* Comments */}
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>
            <MessageSquare style={{ width: 13, height: 13, display: 'inline', marginRight: 5 }} />
            Comments
          </h2>

          {/* Post comment */}
          {me && (
            <form onSubmit={postComment} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                value={commentText}
                onChange={function(e) { setCommentText(e.target.value); }}
                placeholder="Add a comment…"
                maxLength={300}
                style={{ flex: 1, background: C.card, border: '1px solid ' + C.line, borderRadius: 10, padding: '10px 12px', color: C.text, fontFamily: FONT, fontSize: 13, outline: 'none' }}
              />
              <button
                type="submit"
                disabled={posting || !commentText.trim()}
                style={{ width: 44, height: 44, borderRadius: 10, background: posting ? C.card : C.gold, border: 'none', color: '#000', cursor: posting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !commentText.trim() ? 0.5 : 1 }}
              >
                <Send style={{ width: 15, height: 15 }} />
              </button>
            </form>
          )}

          {comments.length === 0 && (
            <p style={{ fontFamily: FONT, fontSize: 13, color: C.muted, textAlign: 'center', padding: '20px 0' }}>No comments yet. Be the first!</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {comments.map(function(msg) {
              return (
                <div key={msg.id} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: C.card, borderRadius: 12, border: '1px solid ' + C.line }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.cardHi, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.gold }}>
                      {(msg.display_name || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: C.text }}>{msg.display_name || 'User'}</span>
                      <span style={{ fontFamily: FONT, fontSize: 10, color: C.muted }}>{timeAgo(msg.created_date)}</span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontFamily: FONT, fontSize: 13, color: 'rgba(240,232,212,0.8)', wordBreak: 'break-word' }}>{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DirectPayments
        isOpen={payOpen}
        onClose={function() { setPayOpen(false); }}
        creatorName={(creator && creator.display_name) || 'Creator'}
        creatorId={room && room.host_id}
        isHost={false}
      />
    </div>
  );
}
