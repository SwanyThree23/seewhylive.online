import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import SubscriptionTiers from '../components/monetization/SubscriptionTiers';
import SpotlightBanner from '../components/community/SpotlightBanner';
import PayPerViewGate from '../components/live/PayPerViewGate';
import VirtualCurrencyTips from '../components/live/VirtualCurrencyTips';
import SignalBars from '../components/live/SignalBars';
import ContentRecommendations from '../components/social/ContentRecommendations';
import ShareToSocial from '../components/social/ShareToSocial';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Radio, Users, DollarSign, Clock, Star,
  Play, Heart, Eye, Share2, ArrowLeft, Zap, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';

var G = {
  gold: "#d4af37",
  crimson: "#8B0000",
  crimsonBright: "#C41E3A",
  cyan: "#6DBF7E",
  volt: "#D4AF37",
  purple: "#D4854A",
  gray: "#888",
  grayDim: "#444",
};

var BADGE_COLORS = {
  super_fan: { color: "#D4AF37", bg: "rgba(212,175,55,0.15)", icon: "👑" },
  top_supporter: { color: "#C0392B", bg: "rgba(192,57,43,0.15)", icon: "❤️" },
  raid_master: { color: "#D4AF37", bg: "rgba(212,175,55,0.12)", icon: "⚡" },
  poll_champion: { color: "#800020", bg: "rgba(128,0,32,0.15)", icon: "🏆" },
  chat_legend: { color: "#D4AF37", bg: "rgba(212,175,55,0.1)", icon: "💬" },
  watch_streak: { color: "#D4854A", bg: "rgba(212,133,74,0.15)", icon: "🔥" },
  gifter: { color: "#C9A84C", bg: "rgba(201,168,76,0.12)", icon: "🎁" },
  first_subscriber: { color: "#d4af37", bg: "rgba(212,175,55,0.15)", icon: "⭐" },
};

var RARITY_COLORS = {
  common: "#888",
  rare: "#D4AF37",
  epic: "#800020",
  legendary: "#C9A84C",
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "14px 12px",
      textAlign: "center",
      flex: 1,
    }}>
      <Icon style={{ color, margin: "0 auto 6px", display: "block" }} size={20} />
      <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: G.gray, fontFamily: "Share Tech Mono, monospace", marginTop: 3, letterSpacing: 1 }}>
        {label}
      </div>
    </div>
  );
}

function PastStreamCard({ room }) {
  var date = room.ended_at ? new Date(room.ended_at).toLocaleDateString() : "Unknown date";
  return (
    <motion.div whileHover={{ scale: 1.02 }} style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10,
      overflow: "hidden",
      cursor: "pointer",
    }}>
      <div style={{
        height: 80,
        background: "linear-gradient(135deg, #1a0a00, #2d1810)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}>
        <Play size={28} style={{ color: G.gold, opacity: 0.7 }} />
        <div style={{
          position: "absolute",
          top: 6,
          right: 6,
          background: "rgba(0,0,0,0.7)",
          borderRadius: 4,
          padding: "2px 6px",
          fontFamily: "Share Tech Mono, monospace",
          fontSize: 11,
          color: G.gray,
        }}>
          {room.duration_seconds ? Math.round(room.duration_seconds / 60) + "m" : "—"}
        </div>
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>
          {room.title || "Untitled Stream"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 11, color: G.gray }}>{date}</span>
          {room.viewer_count > 0 && (
            <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 11, color: G.cyan, display: "flex", alignItems: "center", gap: 3 }}>
              <Eye size={9} /> {room.viewer_count}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ScheduledCard({ room }) {
  var date = room.scheduled_start ? new Date(room.scheduled_start) : null;
  var dateStr = date ? date.toLocaleDateString([], { month: "short", day: "numeric" }) : "TBD";
  var timeStr = date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <div style={{
      background: "rgba(212,175,55,0.06)",
      border: "1px solid rgba(212,175,55,0.2)",
      borderRadius: 10,
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: "rgba(212,175,55,0.12)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 16, fontWeight: 900, color: G.gold, lineHeight: 1 }}>{dateStr.split(" ")[1]}</div>
        <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 11, color: G.gray, textTransform: "uppercase" }}>{dateStr.split(" ")[0]}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {room.title || "Upcoming Stream"}
        </div>
        <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 11, color: G.gray }}>{timeStr}</div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <span style={{
          background: "rgba(212,175,55,0.15)",
          border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: 20,
          padding: "2px 8px",
          fontFamily: "Barlow Condensed, sans-serif",
          fontSize: 11,
          color: G.gold,
          fontWeight: 700,
          letterSpacing: 1,
        }}>SOON</span>
      </div>
    </div>
  );
}

export default function CreatorPublicProfile() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room_id');
  var creatorId = searchParams.get("id");
  var navigate = useNavigate();

  var { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });
  var { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', currentUser?.id],
    queryFn: () => base44.entities.Community.filter({ owner_id: currentUser?.id }).then(r => r[0] || null),
    enabled: !!currentUser?.id,
  });
  var userCommunityId = userCommunity?.id || null;

  var { data: profile } = useQuery({
    queryKey: ["creatorProfile", creatorId],
    queryFn: () => base44.entities.CreatorProfile.filter({ user_id: creatorId }).then(r => r[0]),
    enabled: !!creatorId,
  });

  var { data: pastStreams = [] } = useQuery({
    queryKey: ["pastStreams", creatorId],
    queryFn: () => base44.entities.Room.filter({ host_id: creatorId, status: "ended" }, "-ended_at", 6),
    enabled: !!creatorId,
  });

  var { data: scheduledStreams = [] } = useQuery({
    queryKey: ["scheduledStreams", creatorId],
    queryFn: () => base44.entities.Room.filter({ host_id: creatorId, status: "scheduled" }, "scheduled_start", 5),
    enabled: !!creatorId,
  });

  var { data: badges = [] } = useQuery({
    queryKey: ["creatorBadges", creatorId],
    queryFn: () => base44.entities.EngagementBadge.filter({ creator_id: creatorId }, "-awarded_at", 6),
    enabled: !!creatorId,
  });

  var { data: transactions = [] } = useQuery({
    queryKey: ["creatorTips", creatorId],
    queryFn: () => base44.entities.Transaction.filter({ recipient_id: creatorId, status: "completed" }, "-created_date", 50),
    enabled: !!creatorId,
  });

  var { data: followers = [] } = useQuery({
    queryKey: ["creatorFollowers", creatorId],
    queryFn: () => base44.entities.Follow.filter({ creator_id: creatorId }),
    enabled: !!creatorId,
  });

  var isOwnProfile = currentUser && currentUser.id === creatorId;
  var totalEarned = transactions.reduce((sum, t) => sum + (t.creator_payout || 0), 0);
  var totalStreams = pastStreams.length;
  var followerCount = followers.length;
  var [followToast, setFollowToast] = useState('');
  var isFollowing = currentUser && followers.some(f => f.follower_id === currentUser.id);

  function handleFollow() {
    if (!currentUser) { setFollowToast('Sign in to follow'); setTimeout(() => setFollowToast(''), 2500); return; }
    if (isFollowing) {
      var existing = followers.find(f => f.follower_id === currentUser.id);
      if (existing) base44.entities.Follow.delete(existing.id).catch(() => {});
      setFollowToast('Unfollowed');
    } else {
      base44.entities.Follow.create({ creator_id: creatorId, follower_id: currentUser.id }).catch(() => {});
      setFollowToast('Following!');
      base44.entities.Activity.create({
        user_id: currentUser.id,
        type: 'follow',
        title: `Followed creator: ${profile?.display_name || profile?.full_name || 'Creator'}`,
        recipient_id: creatorId,
      }).catch(() => {});
    }
    setTimeout(() => setFollowToast(''), 2500);
  }

  function handleShare() {
    var url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: profile?.display_name || 'SeeWhy LIVE Creator', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setFollowToast('Link copied!');
        setTimeout(() => setFollowToast(''), 2500);
      }).catch(() => {});
    }
  }

  // If no creatorId, show the current user's own profile
  useEffect(() => {
    if (!creatorId && currentUser) {
      navigate(`/CreatorPublicProfile?id=${currentUser.id}`, { replace: true });
    }
  }, [creatorId, currentUser]);

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#fff", fontFamily: "Rajdhani, sans-serif", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        background: "rgba(13,13,13,0.98)",
        borderBottom: "1px solid rgba(212,175,55,0.15)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: G.gray, cursor: "pointer", padding: 4 }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontFamily: "Orbitron, monospace", fontSize: 13, color: G.gold, fontWeight: 700, flex: 1 }}>
          CREATOR PROFILE
        </span>
        {isOwnProfile && (
          <Link to="/SeeWhyLIVEv17">
            <button style={{
              background: "linear-gradient(135deg, #8B0000, #d4af37)",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              color: "#000",
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 900,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <Radio size={14} /> GO LIVE
            </button>
          </Link>
        )}
      </div>

      {/* Hero Banner */}
      <div style={{
        height: 140,
        background: profile?.banner_url
          ? `url(${profile.banner_url}) center/cover`
          : "linear-gradient(135deg, #1A0505 0%, #2d0a00 40%, #1a1200 100%)",
        position: "relative",
        borderBottom: "1px solid rgba(212,175,55,0.1)",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
      </div>

      {/* Avatar + Name */}
      <div style={{ padding: "0 16px", marginTop: -32, position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{
            width: 72, height: 72,
            borderRadius: 16,
            background: "linear-gradient(135deg, #8B0000, #d4af37)",
            border: "3px solid #080808",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            overflow: "hidden",
            flexShrink: 0,
          }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : "🎤"}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {followToast && <span style={{ color: G.gold, fontSize: 11, marginRight: 4 }}>{followToast}</span>}
            {!isOwnProfile && (
              <button onClick={handleFollow} style={{
                background: isFollowing ? "rgba(212,175,55,0.25)" : "rgba(212,175,55,0.1)",
                border: `1px solid ${isFollowing ? G.gold : "rgba(212,175,55,0.3)"}`,
                borderRadius: 8,
                padding: "6px 14px",
                color: G.gold,
                fontFamily: "Barlow Condensed, sans-serif",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <Heart size={13} fill={isFollowing ? G.gold : "none"} /> {isFollowing ? "Following" : "Follow"}
              </button>
            )}
            <button onClick={handleShare} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "6px 10px",
              color: G.gray,
              cursor: "pointer",
            }}>
              <Share2 size={14} />
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 6 }}>
          <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
            {profile?.display_name || currentUser?.full_name || "Creator"}
          </div>
          {profile?.bio && (
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 5, lineHeight: 1.4 }}>
              {profile.bio}
            </div>
          )}
        </div>

        {profile?.category && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.25)",
            borderRadius: 20,
            padding: "3px 10px",
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: 11,
            color: G.gold,
            fontWeight: 700,
            letterSpacing: 1,
            marginBottom: 14,
          }}>
            <Zap size={10} /> {profile.category.toUpperCase()}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <StatCard icon={Users} label="FOLLOWERS" value={followerCount} color={G.cyan} />
          <StatCard icon={Video} label="STREAMS" value={totalStreams} color={G.gold} />
          <StatCard icon={DollarSign} label="EARNED" value={"$" + totalEarned.toFixed(0)} color="#6DBF7E" />
        </div>
      </div>

      {/* Fan Badges */}
      {badges.length > 0 && (
        <div style={{ padding: "0 16px 20px" }}>
          <div style={{ fontFamily: "Orbitron, monospace", fontSize: 10, color: G.gold, letterSpacing: 3, marginBottom: 10 }}>
            🏅 TOP FAN BADGES
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {badges.map((badge) => {
              var style = BADGE_COLORS[badge.badge_type] || { color: G.gray, bg: "rgba(255,255,255,0.05)", icon: "🎖️" };
              var rColor = RARITY_COLORS[badge.rarity] || G.gray;
              return (
                <motion.div key={badge.id} whileHover={{ scale: 1.05 }}
                  style={{
                    background: style.bg,
                    border: `1px solid ${style.color}44`,
                    borderRadius: 10,
                    padding: "8px 12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    minWidth: 72,
                  }}>
                  <span style={{ fontSize: 22 }}>{style.icon}</span>
                  <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 11, color: style.color, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                    {badge.title}
                  </span>
                  <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 7, color: rColor, letterSpacing: 1 }}>
                    {badge.rarity?.toUpperCase()}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Scheduled Sessions */}
      {scheduledStreams.length > 0 && (
        <div style={{ padding: "0 16px 20px" }}>
          <div style={{ fontFamily: "Orbitron, monospace", fontSize: 10, color: G.gold, letterSpacing: 3, marginBottom: 10 }}>
            📅 UPCOMING SESSIONS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scheduledStreams.map((room) => (
              <ScheduledCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      )}

      {/* Past Streams */}
      <div style={{ padding: "0 16px 20px" }}>
        <div style={{ fontFamily: "Orbitron, monospace", fontSize: 10, color: G.gold, letterSpacing: 3, marginBottom: 10 }}>
          📼 PAST STREAMS
        </div>
        {pastStreams.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {pastStreams.map((room) => (
              <PastStreamCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: "24px",
            textAlign: "center",
          }}>
            <Video size={28} style={{ color: G.grayDim, margin: "0 auto 8px" }} />
            <div style={{ color: G.gray, fontFamily: "Share Tech Mono, monospace", fontSize: 11 }}>No past streams yet</div>
            {isOwnProfile && (
              <Link to="/SeeWhyLIVEv17">
                <button style={{
                  marginTop: 12,
                  background: "linear-gradient(135deg, #8B0000, #d4af37)",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  color: "#000",
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: "pointer",
                }}>
                  🔴 GO LIVE NOW
                </button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Recent Tips */}
      {transactions.length > 0 && (
        <div style={{ padding: "0 16px 20px" }}>
          <div style={{ fontFamily: "Orbitron, monospace", fontSize: 10, color: G.gold, letterSpacing: 3, marginBottom: 10 }}>
            💰 RECENT SUPPORT
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(212,175,55,0.05)",
                border: "1px solid rgba(212,175,55,0.12)",
                borderRadius: 8,
                padding: "8px 12px",
              }}>
                <span style={{ fontSize: 16 }}>💎</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 13, color: "#fff" }}>
                    {t.transaction_type === "subscription" ? "New subscriber" : "Direct support"}
                  </div>
                  <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 11, color: G.gray }}>
                    {t.payment_method?.toUpperCase()}
                  </div>
                </div>
                <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 16, fontWeight: 700, color: "#6DBF7E" }}>
                  ${t.creator_payout?.toFixed(2) || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {creatorId && (
        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SubscriptionTiers creatorId={creatorId} currentUserId={currentUser?.id || null} />
          <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
          <VirtualCurrencyTips roomId={roomId} creatorId={creatorId} currentUser={currentUser} isHost={false} />
          <PayPerViewGate roomId={roomId} ppvPrice={4.99} onPurchase={() => {}} />
          <SignalBars count={5} active={true} size="sm" />
          <ContentRecommendations />
        <MilestoneAlerts userId={currentUser?.id} roomId={roomId} />
        <SwanAIRecommendations roomId={roomId} currentLayout="default" viewerCount={0} />
          <ShareToSocial content={{ title: 'Creator Profile', url: window.location.href }} />
          <OnlineUsersGrid compact maxVisible={10} />
          <CollaborationMatcher />
        </div>
      )}
    </div>
  );
}
