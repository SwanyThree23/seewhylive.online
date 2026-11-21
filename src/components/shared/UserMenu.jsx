import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  User, Activity, DollarSign, BarChart2, Radio, Globe,
  Mail, Shield, Users, Settings, LogOut, Crown, Download,
  Star, UserPlus, Zap
} from 'lucide-react';

export default function UserMenu(props) {
  var user = props.user;
  var isAdmin = props.isAdmin;

  var openState = useState(false);
  var open = openState[0];
  var setOpen = openState[1];

  function handleLogout() { base44.auth.logout(); }

  if (!user) {
    return (
      <button
        onClick={function() { base44.auth.redirectToLogin(); }}
        style={{
          padding:'8px 18px', background:'#FFB800', color:'#000', border:'none',
          borderRadius:8, fontWeight:700, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif', fontSize:14,
        }}
      >
        Sign In
      </button>
    );
  }

  var sections = [
    {
      label: 'My Account',
      items: [
        { label: 'Profile', icon: User, href: 'Profile' },
        { label: 'Activity', icon: Activity, href: 'Activity' },
        { label: 'Settings', icon: Settings, href: 'Settings' },
        { label: 'Export Data', icon: Download, href: 'DataExport' },
      ],
    },
    {
      label: 'Creator',
      items: [
        { label: 'Creator Dashboard', icon: BarChart2, href: 'CreatorDashboard' },
        { label: 'Memberships', icon: Crown, href: 'CreatorSubscriptions' },
        { label: 'Payouts', icon: DollarSign, href: 'Payouts' },
        { label: 'Multi-Stream', icon: Radio, href: 'MultiStreamManager' },
        { label: 'Overlay Editor', icon: Globe, href: 'OverlayEditor' },
        { label: 'Loyalty Program', icon: Star, href: 'LoyaltyProgram' },
        { label: 'Newsletter', icon: Mail, href: 'Newsletter' },
        { label: 'Widget Suite', icon: DollarSign, href: 'MonetizationWidgets' },
        { label: 'Enhancement Suite', icon: Zap, href: 'EnhancementSuite' },
      ],
    },
    {
      label: 'Viewer',
      items: [
        { label: 'My Feed', icon: Globe, href: 'ViewerDashboard' },
        { label: 'Analytics', icon: DollarSign, href: 'Analytics' },
        { label: 'Stream Analytics', icon: BarChart2, href: 'StreamAnalytics' },
      ],
    },
    {
      label: 'Community',
      items: [
        { label: 'Create Community', icon: Users, href: 'CreateCommunity' },
        { label: 'AI Moderation', icon: Shield, href: 'AIModeration' },
        { label: 'Invite Users', icon: UserPlus, href: 'InviteUsers' },
        { label: 'Platform Status', icon: Zap, href: 'BetaStatus' },
      ],
    },
  ];

  var initials = (user.full_name && user.full_name.charAt(0)) || (user.email && user.email.charAt(0)) || '?';

  var menuItemStyle = {
    display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 12px',
    background:'transparent', border:'none', color:'rgba(255,255,255,0.8)', cursor:'pointer',
    fontSize:13, textDecoration:'none', borderRadius:6, transition:'background 0.15s',
    fontFamily:'inherit',
  };

  return (
    <div style={{ position:'relative' }}>
      <button
        onClick={function() { setOpen(function(v) { return !v; }); }}
        aria-label="Open account menu"
        style={{
          width:40, height:40, borderRadius:'50%', overflow:'hidden',
          background:'linear-gradient(135deg,#FF1564,#FF8C00)', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontWeight:700, fontSize:14, padding:0,
        }}
      >
        {user.avatar_url
          ? <img src={user.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
          : initials
        }
      </button>

      {open && (
        <>
          <div
            style={{
              position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:100,
              background:'rgba(7,7,15,0.98)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.7)',
              width:224, maxHeight:'85vh', overflowY:'auto',
            }}
          >
            {/* Header */}
            <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize:14, fontWeight:600, color:'#fff', margin:0 }}>{user.full_name || 'User'}</p>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', margin:'2px 0 0' }}>{user.email}</p>
            </div>

            {sections.map(function(section) {
              var label = section.label;
              var items = section.items;
              return (
                <div key={label}>
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }} />
                  <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.08em', padding:'8px 14px 4px', fontWeight:700 }}>{label}</p>
                  {items.map(function(item) {
                    var itemLabel = item.label;
                    var Icon = item.icon;
                    var href = item.href;
                    return (
                      <Link
                        key={href}
                        to={createPageUrl(href)}
                        onClick={function() { setOpen(false); }}
                        style={menuItemStyle}
                        onMouseEnter={function(e) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background='transparent'; }}
                      >
                        <Icon style={{ width:16, height:16, flexShrink:0 }} />
                        <span>{itemLabel}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}

            {isAdmin && (
              <div>
                <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }} />
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.08em', padding:'8px 14px 4px', fontWeight:700 }}>Admin</p>
                <Link
                  to={createPageUrl('ModerationDashboard')}
                  onClick={function() { setOpen(false); }}
                  style={menuItemStyle}
                  onMouseEnter={function(e) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background='transparent'; }}
                >
                  <Shield style={{ width:16, height:16 }} />
                  <span>Moderation</span>
                </Link>
              </div>
            )}

            <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }} />
            <button
              onClick={handleLogout}
              style={Object.assign({}, menuItemStyle, { color:'#FF2040', marginBottom:4 })}
              onMouseEnter={function(e) { e.currentTarget.style.background='rgba(255,32,64,0.1)'; }}
              onMouseLeave={function(e) { e.currentTarget.style.background='transparent'; }}
            >
              <LogOut style={{ width:16, height:16 }} />
              <span>Log out</span>
            </button>
          </div>

          <div style={{ position:'fixed', inset:0, zIndex:99 }} onClick={function() { setOpen(false); }} />
        </>
      )}
    </div>
  );
}
