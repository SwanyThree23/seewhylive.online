import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import FollowButton from '../components/shared/FollowButton';
import DirectPayments from '../components/live/DirectPayments';
import {
  ArrowLeft, Share2, Instagram, Twitter, Youtube, Globe, MessageCircle, Music2,
  Radio, Eye, DollarSign, Trophy, Loader2, Copy, Check,
} from 'lucide-react';

var C = {
  bg: '#03030A', surface: '#07070F', card: '#0B0B18', cardHi: '#10101E',
  line: '#16162A', text: '#F0F0FF', muted: '#5A5A7A',
  accent: '#FF1564', gold: '#FFB800', cyan: '#00F5FF', green: '#00FF88', purple: '#8B5CF6',
};
var FONT = 'Barlow Condensed, sans-serif';
var DISPLAY = 'Syne, sans-serif';

var SOCIALS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: C.accent },
  { key: 'tiktok', label: 'TikTok', icon: Music2, color: C.cyan },
  { key: 'twitter', label: 'X', icon: Twitter, color: C.text },
  { key: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF2040' },
  { key: 'discord', label: 'Discord', icon: MessageCircle, color: C.purple },
  { key: 'website', label: 'Website', icon: Globe, color: C.green },
];

function withProtocol(url) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl px-3 py-3 flex flex-col gap-0.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <span className="text-lg font-black leading-none" style={{ fontFamily: 'Bebas Neue, sans-serif', color: C.text }}>{value}</span>
      <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: FONT, color: C.muted }}>{label}</span>
    </div>
  );
}

export default function LinkInBio() {
  var { userId } = useParams();
  var [creatorId, setCreatorId] = useState(userId || null);
  var [profile, setProfile] = useState(null);
  var [isLive, setIsLive] = useState(false);
  var [stats, setStats] = useState({ viewers: 0, tips: 0, topStream: '—' });
  var [loading, setLoading] = useState(true);
  var [copied, setCopied] = useState(false);
  var [payOpen, setPayOpen] = useState(false);
  var [payLinks, setPayLinks] = useState(null);

  useEffect(() => {
    var cancelled = false;
    (async () => {
      var id = creatorId;
      if (!id) {
        var me = await base44.auth.me();
        id = me.id;
        if (!cancelled) setCreatorId(id);
      }
      var profileRes = await base44.entities.CreatorProfile.filter({ user_id: id });
      var loaded = (profileRes.items || profileRes || [])[0] || null;

      var liveRes = await base44.entities.Room.filter({ host_id: id, status: 'live' });
      var liveRooms = liveRes.items || liveRes || [];

      var tips = 0;
      var topStream = '—';
      var viewers = 0;
      try {
        var agg = await base44.entities.GemTransaction.aggregate({ query: { recipient_id: id }, sum: ['usd_value'] });
        var _aggRow = (agg && agg.rows) && (agg.rows)[0];
        tips = Math.round((_aggRow && _aggRow.sum_usd_value) || 0);
      } catch (e) { /* tips stat is best-effort */ }
      try {
        var topRes = await base44.entities.Room.filter({ host_id: id }, { sort: '-viewer_count', limit: 1 });
        var top = (topRes.items || topRes || [])[0];
        topStream = (top && top.title) || '—';
        viewers = (top && top.viewer_count) || 0;
      } catch (e) { /* top stream stat is best-effort */ }

      if (cancelled) return;
      setProfile(loaded);
      setIsLive(liveRooms.length > 0);
      setStats({ viewers: isLive ? (liveRooms[0].viewer_count || 0) : viewers, tips, topStream });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  var shareUrl = `${window.location.origin}/link-in-bio${creatorId ? `/${creatorId}` : ''}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: (profile && profile.display_name) || 'SeeWhy LIVE', url: shareUrl });
        return;
      } catch (e) { /* user dismissed the sheet */ }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  var links = SOCIALS.filter(function(s) { var sl = profile && profile.social_links; return sl && sl[s.key]; });
  var PAY_PLATFORMS = [
    { id: 'paypal',  label: 'PayPal',   emoji: '💙', urlFn: function(v) { return v.includes('paypal.me') ? v : 'https://paypal.me/' + v.replace(/^@/, ''); } },
    { id: 'cashapp', label: 'Cash App', emoji: '💚', urlFn: function(v) { return 'https://cash.app/' + (v.startsWith('$') ? v : '$' + v); } },
    { id: 'venmo',   label: 'Venmo',    emoji: '💙', urlFn: function(v) { return 'https://venmo.com/' + v.replace(/^@/, ''); } },
    { id: 'zelle',   label: 'Zelle',    emoji: '💜', urlFn: function(v) { return 'https://enroll.zellepay.com/'; } },
    { id: 'chime',   label: 'Chime',    emoji: '💚', urlFn: function(v) { return 'https://www.chime.com/'; } },
  ];
  var pl = (profile && profile.payment_links) || {};
  var payLinksList = PAY_PLATFORMS.filter(function(p) { return pl[p.id] && pl[p.id].trim(); });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: C.gold }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      {/* Brand accent line */}
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${C.accent}, ${C.gold}, ${C.cyan}, ${C.green}, ${C.purple}, transparent)` }} />

      <div className="max-w-md mx-auto px-4 pb-16 pt-3">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => window.history.back()}
            aria-label="Go back"
            className="flex items-center justify-center rounded-xl"
            style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.line}`, color: C.muted }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={share}
            className="flex items-center gap-1.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wide"
            style={{ minHeight: 44, background: `rgba(255,184,0,0.12)`, border: `1px solid ${C.gold}44`, color: C.gold, fontFamily: FONT }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Link copied' : 'Share'}
          </button>
        </div>

        {/* Identity */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: C.cardHi, border: `2px solid ${isLive ? C.accent : 'rgba(255,255,255,0.1)'}` }}
            >
              {(profile && profile.avatar_url) ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black" style={{ fontFamily: DISPLAY, color: C.gold }}>
                  {((profile && profile.display_name) || 'S')[0].toUpperCase()}
                </span>
              )}
            </div>
            {isLive && (
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                style={{ background: C.accent, color: '#fff', fontFamily: FONT }}
              >
                <Radio className="w-2.5 h-2.5" /> Live
              </span>
            )}
          </div>

          <h1 className="mt-4 text-xl font-extrabold" style={{ fontFamily: DISPLAY, letterSpacing: '0.02em' }}>
            {(profile && profile.display_name) || 'SeeWhy Creator'}
          </h1>
          {(profile && profile.category) && (
            <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ background: 'rgba(255,184,0,0.1)', border: `1px solid ${C.gold}33`, color: C.gold, fontFamily: FONT }}>
              {profile.category}
            </span>
          )}
          {(profile && profile.bio) && (
            <p className="mt-3 text-[13px] leading-relaxed" style={{ fontFamily: FONT, color: 'rgba(240,240,255,0.72)' }}>
              {profile.bio}
            </p>
          )}
          {creatorId && (
            <div className="mt-3">
              <FollowButton targetUserId={creatorId} targetUserName={(profile && profile.display_name) || ''} size="sm" />
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <StatCard icon={Eye} label="Viewers" value={stats.viewers} color={C.cyan} />
          <StatCard icon={DollarSign} label="Tips" value={`$${stats.tips}`} color={C.gold} />
          <StatCard icon={Trophy} label="Top stream" value={stats.topStream.length > 9 ? `${stats.topStream.slice(0, 9)}…` : stats.topStream} color={C.purple} />
        </div>

        {/* Live CTA */}
        <a
          href={`${window.location.origin}/Discover`}
          className="mt-4 flex items-center justify-center gap-2 w-full rounded-2xl font-black uppercase tracking-widest"
          style={{ minHeight: 52, background: isLive ? `linear-gradient(135deg, ${C.accent}, #FF8C00)` : C.card, border: `1px solid ${isLive ? 'transparent' : C.line}`, color: isLive ? '#fff' : C.text, fontFamily: FONT }}
        >
          <Radio className="w-4 h-4" /> {isLive ? 'Watch me live now' : 'See my streams'}
        </a>

        {/* Direct support button */}
        <button
          onClick={function() { setPayOpen(true); }}
          className="mt-3 flex items-center justify-center gap-2 w-full rounded-2xl font-black uppercase tracking-widest"
          style={{ minHeight: 52, background: 'linear-gradient(135deg, #FFB800, #FF8C00)', border: 'none', color: '#000', fontFamily: FONT, cursor: 'pointer' }}
        >
          <DollarSign className="w-4 h-4" /> Support Directly
        </button>

        {/* Pay directly links */}
        {payLinksList.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ fontFamily: FONT, color: C.muted }}>Send Money Directly</p>
            <div className="space-y-2">
              {payLinksList.map(function(p) {
                return (
                  <a
                    key={p.id}
                    href={p.urlFn(pl[p.id])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 rounded-2xl transition-transform active:scale-[0.99]"
                    style={{ minHeight: 52, background: C.card, border: '1px solid ' + C.line, textDecoration: 'none' }}
                  >
                    <span style={{ fontSize: 20 }}>{p.emoji}</span>
                    <div>
                      <p className="text-sm font-black" style={{ fontFamily: FONT, color: C.text, margin: 0 }}>{p.label}</p>
                      <p className="text-[10px]" style={{ fontFamily: FONT, color: C.muted, margin: 0 }}>{pl[p.id]}</p>
                    </div>
                    <span className="ml-auto text-[10px] uppercase tracking-widest" style={{ fontFamily: FONT, color: C.gold }}>Send</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Social links */}
        <div className="mt-4 space-y-2">
          {links.length === 0 && (
            <p className="text-center text-[11px] py-6" style={{ fontFamily: FONT, color: C.muted }}>
              No social links added yet.
            </p>
          )}
          {links.map(function(item) {
            var key = item.key; var label = item.label; var Icon = item.icon; var color = item.color;
            return (
              <a
                key={key}
                href={withProtocol(profile.social_links[key])}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 rounded-2xl transition-transform active:scale-[0.99]"
                style={{ minHeight: 52, background: C.card, border: '1px solid ' + C.line, textDecoration: 'none' }}
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                <span className="text-sm font-bold" style={{ fontFamily: FONT, color: C.text }}>{label}</span>
                <span className="ml-auto text-[10px] uppercase tracking-widest" style={{ fontFamily: FONT, color: C.muted }}>Open</span>
              </a>
            );
          })}
        </div>

        {/* Share row */}
        <button
          onClick={share}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl text-[11px] font-bold uppercase tracking-widest"
          style={{ minHeight: 44, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.line}`, color: C.muted, fontFamily: FONT }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied to clipboard' : 'Copy my link-in-bio'}
        </button>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em]" style={{ fontFamily: FONT, color: 'rgba(255,255,255,0.18)' }}>
          SeeWhy LIVE · 90/10
        </p>
      </div>

      <DirectPayments
        isOpen={payOpen}
        onClose={function() { setPayOpen(false); }}
        creatorName={(profile && profile.display_name) || 'Creator'}
        creatorId={creatorId}
        isHost={false}
      />
    </div>
  );
}