import React from 'react';
import { Users, CheckCircle, Lock, Globe, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const OCT     = 'polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const CATEGORY_COLORS = {
  music:         '#C0392B',
  gaming:        '#D4AF37',
  tech:          '#D4AF37',
  education:     '#4ade80',
  business:      '#fb923c',
  entertainment: '#D4AF37',
  sports:        '#38bdf8',
  lifestyle:     '#f472b6',
  all:           '#D4AF37',
};

export default function CommunityCard({ community, isMember, isAdmin, onJoin }) {
  const catColor = CATEGORY_COLORS[community.category] || GOLD;
  const initial  = community.name?.charAt(0).toUpperCase() || '?';

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: 'rgba(8,11,24,0.9)',
        border: `1px solid rgba(212,175,55,0.18)`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Cover band */}
      <div className="relative h-24 overflow-hidden">
        {community.cover_url ? (
          <img src={community.cover_url} alt={community.name} className="w-full h-full object-cover" />
        ) : (
          <div style={{ background: `linear-gradient(135deg,${CRIMSON}55,rgba(212,175,55,0.12))`, width: '100%', height: '100%' }} />
        )}
        {/* badges top-right */}
        <div className="absolute top-2 right-2 flex gap-1.5">
          {community.verified && (
            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black uppercase"
              style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', ...T }}>
              <CheckCircle className="w-2.5 h-2.5" />Verified
            </span>
          )}
          {!community.is_public && (
            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black uppercase"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.5)', ...T }}>
              <Lock className="w-2.5 h-2.5" />Private
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Avatar + name row */}
        <div className="flex items-start gap-3 -mt-10">
          {/* Octagonal avatar */}
          <div style={{
            width: 52, height: 52, clipPath: OCT, flexShrink: 0,
            background: community.avatar_url ? 'transparent' : `linear-gradient(135deg,${CRIMSON},${GOLD})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {community.avatar_url
              ? <img src={community.avatar_url} alt={community.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 900, color: '#fff' }}>{initial}</span>
            }
          </div>

          <div className="flex-1 pt-7 min-w-0">
            <h3 className="font-black text-base text-white leading-tight truncate" style={T}>{community.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
                {(community.member_count || 0).toLocaleString()} members
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {community.description && (
          <p className="text-[12px] leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)', ...T }}>
            {community.description}
          </p>
        )}

        {/* Pills row */}
        <div className="flex flex-wrap gap-1.5">
          {community.category && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase"
              style={{ background: `${catColor}18`, border: `1px solid ${catColor}40`, color: catColor, ...T }}>
              {community.category}
            </span>
          )}
          <span className="flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', ...T }}>
            {community.is_public ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
            {community.is_public ? 'Public' : 'Private'}
          </span>
          {community.tags?.slice(0, 2).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase"
              style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)', color: 'rgba(212,175,55,0.6)', ...T }}>
              #{tag}
            </span>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto">
          <Link to={createPageUrl(`Community?id=${community.id}`)} className="flex-1">
            <button className="w-full py-2 rounded-xl font-black uppercase text-[10px] transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', ...T }}>
              View
            </button>
          </Link>

          {!isMember && (
            <button className="flex-1 py-2 rounded-xl font-black uppercase text-[10px] transition-all"
              onClick={e => { e.preventDefault(); onJoin?.(community); }}
              style={{ background: 'rgba(212,175,55,0.1)', border: `1px solid rgba(212,175,55,0.4)`, color: GOLD, ...T }}>
              + Join
            </button>
          )}

          {isMember && isAdmin && (
            <Link to={createPageUrl(`CommunityAdmin?id=${community.id}`)} className="flex-1">
              <button className="w-full py-2 rounded-xl font-black uppercase text-[10px] transition-all"
                style={{ background: `rgba(128,0,32,0.18)`, border: `1px solid rgba(128,0,32,0.4)`, color: '#ff6680', ...T }}>
                Admin
              </button>
            </Link>
          )}

          {isMember && (
            <Link to={createPageUrl(`CommunityGrowth?id=${community.id}`)}>
              <button className="p-2 rounded-xl transition-all"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD }}>
                <TrendingUp className="w-3.5 h-3.5" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
