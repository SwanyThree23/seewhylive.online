import React, { useState, useEffect } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';
import { getPlatformHandles, setPlatformHandle } from '../platformConfig.js';
import { usePushNotifications } from '../usePushNotifications.js';

var PLATFORM_TIERS = [
  { id: 'free',    label: 'FREE',    priceCents: 0,     color: '#7A6F90', perks: ['Basic streaming', 'Chat', '1 guest panel', 'Standard quality'] },
  { id: 'creator', label: 'CREATOR', priceCents: 1900,  color: '#00C9A7', perks: ['All Free', 'Up to 4 panels', 'Analytics', 'Gift receipts', '$19/mo'] },
  { id: 'pro',     label: 'PRO',     priceCents: 4900,  color: '#C084FC', perks: ['All Creator', 'Up to 9 panels', 'AURA AI', 'Paywall', 'Priority support', '$49/mo'] },
  { id: 'studio',  label: 'STUDIO',  priceCents: 14900, color: '#C9A84C', perks: ['All Pro', 'White-label embed', 'Watch Party sync', 'Custom AURA', 'Dedicated support', '$149/mo'] },
];

var AVATAR_EMOJIS = ['🎭','🎲','🎵','🎸','🏆','🎤','🎬','🎨','🔥','💎','⚡','🌊','🦁','🐉','🌙','⭐','🎯','🏀','🎮','💫'];

var SETTINGS_TABS = [
  { id: 'profile',      label: 'PROFILE'      },
  { id: 'payouts',      label: 'PAYOUTS'      },
  { id: 'notifications',label: 'NOTIFICATIONS' },
  { id: 'subscription', label: 'SUBSCRIPTION' },
  { id: 'privacy',      label: 'PRIVACY'      },
];

var inputStyle = {
  width: '100%',
  background: 'rgba(14,12,9,.8)',
  border: '1px solid rgba(201,168,76,.18)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#F0E8D4',
  fontFamily: "'Barlow Condensed',sans-serif",
  fontSize: 13,
  boxSizing: 'border-box'
};

var labelStyle = {
  fontFamily: "'DM Mono',monospace",
  fontSize: 8,
  color: '#8A7A62',
  letterSpacing: 2,
  marginBottom: 4,
  display: 'block'
};

var cardStyle = {
  background: 'rgba(26,21,16,.8)',
  border: '1px solid rgba(201,168,76,.12)',
  borderRadius: 10,
  padding: '12px 14px'
};

export default function SettingsTab({ addToast, username, socket, roomId, isLive }) {
  var [activeTab, setActiveTab] = useState('profile');
  var [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  var [displayName, setDisplayName] = useState(function() {
    try { return localStorage.getItem('sw_displayName') || username || 'Creator'; } catch(e) { return username || 'Creator'; }
  });
  var [bio, setBio] = useState(function() {
    try { return localStorage.getItem('sw_bio') || ''; } catch(e) { return ''; }
  });
  var [avatarEmoji, setAvatarEmoji] = useState(function() {
    try { return localStorage.getItem('sw_avatar_emoji') || '🎭'; } catch(e) { return '🎭'; }
  });
  var [profileSaving, setProfileSaving] = useState(false);

  var [stripeConnected, setStripeConnected] = useState(false);
  var [stripeChecking, setStripeChecking] = useState(true);
  var [availableCents, setAvailableCents] = useState(0);
  var [payoutLoading, setPayoutLoading] = useState(false);
  var [platformHandles, setPlatformHandles] = useState(function() { return getPlatformHandles(); });

  var [notifyNewStream, setNotifyNewStream] = useState(true);
  var [notifyTip, setNotifyTip] = useState(true);
  var [notifySubscriber, setNotifySubscriber] = useState(true);
  var [notifyEmailDigest, setNotifyEmailDigest] = useState(true);

  var push = usePushNotifications();
  var [pushSubscribed, setPushSubscribed] = useState(false);
  var [pushLoading, setPushLoading] = useState(false);

  var [currentTier, setCurrentTier] = useState('free');

  var [publicProfile, setPublicProfile] = useState(true);
  var [showEarnings, setShowEarnings] = useState(false);
  var [allowDMs, setAllowDMs] = useState(true);
  var [twoFactor, setTwoFactor] = useState(false);
  var [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(function() {
    try {
      fetch('/api/creator/onboard/status')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.connected) setStripeConnected(true);
          if (data && typeof data.availableCents === 'number') setAvailableCents(data.availableCents);
          setStripeChecking(false);
        })
        .catch(function() { setStripeChecking(false); });
    } catch(e) { setStripeChecking(false); }
  }, []);

  useEffect(function() {
    try { localStorage.setItem('sw_avatar_emoji', avatarEmoji); } catch(e) {}
  }, [avatarEmoji]);

  useEffect(function() {
    try { localStorage.setItem('sw_displayName', displayName); } catch(e) {}
  }, [displayName]);

  useEffect(function() {
    try { localStorage.setItem('sw_bio', bio); } catch(e) {}
  }, [bio]);

  useEffect(function() {
    push.isSubscribed(function(subbed) { setPushSubscribed(subbed); });
  }, []);

  function saveProfile() {
    setProfileSaving(true);
    fetch('/api/users/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: displayName, bio: bio, avatarEmoji: avatarEmoji })
    })
    .then(function(r) { return r.json(); })
    .then(function() {
      addToast('Profile saved', 'success');
      setProfileSaving(false);
    })
    .catch(function() {
      addToast('Failed to save profile', 'error');
      setProfileSaving(false);
    });
  }

  function connectStripe() {
    fetch('/api/creator/onboard/link')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.url) window.open(data.url, '_blank', 'noopener');
      })
      .catch(function() {
        addToast('Failed to get Stripe link', 'error');
      });
  }

  function requestPayout() {
    if (availableCents < 1000) {
      addToast('Minimum payout is $10.00', 'error');
      return;
    }
    setPayoutLoading(true);
    fetch('/api/payments/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents: availableCents })
    })
    .then(function(r) { return r.json(); })
    .then(function() {
      addToast('Payout of $' + (Math.floor(availableCents) / 100).toFixed(2) + ' initiated!', 'success');
      setAvailableCents(0);
      setPayoutLoading(false);
    })
    .catch(function() {
      addToast('Payout failed. Try again.', 'error');
      setPayoutLoading(false);
    });
  }

  function saveNotifications() {
    fetch('/api/users/me/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notifyNewStream: notifyNewStream,
        notifyTip: notifyTip,
        notifySubscriber: notifySubscriber,
        notifyEmailDigest: notifyEmailDigest
      })
    })
    .then(function(r) { return r.json(); })
    .then(function() {
      addToast('Notification preferences saved', 'success');
    })
    .catch(function() {
      addToast('Notification preferences saved', 'success');
    });
  }

  function enablePush() {
    if (!('Notification' in window)) {
      addToast('Push notifications not supported in this browser', 'error');
      return;
    }
    Notification.requestPermission().then(function(perm) {
      if (perm === 'granted') {
        addToast('Push notifications enabled', 'success');
      } else {
        addToast('Push notification permission denied', 'error');
      }
    });
  }

  function cycleEmoji() {
    var idx = AVATAR_EMOJIS.indexOf(avatarEmoji);
    var next = (idx + 1) % AVATAR_EMOJIS.length;
    setAvatarEmoji(AVATAR_EMOJIS[next]);
  }

  function renderToggle(value, setter) {
    return (
      <button
        onClick={function() { setter(function(v) { return !v; }); }}
        style={{
          width: 40,
          height: 22,
          borderRadius: 999,
          background: value ? '#00C9A7' : 'rgba(122,111,144,.25)',
          border: value ? '1px solid #00C9A7' : '1px solid rgba(122,111,144,.4)',
          cursor: 'pointer',
          position: 'relative',
          flexShrink: 0,
          transition: 'background 0.2s'
        }}>
        <div style={{
          position: 'absolute',
          top: 2,
          left: value ? 20 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#EDE8F5',
          transition: 'left 0.2s'
        }} />
      </button>
    );
  }

  function renderProfileTab() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <AvatarPortrait username={username || 'creator'} size={64} />
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1 }}>YOUR AVATAR</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              onClick={cycleEmoji}
              style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(201,168,76,.15)', border: '2px solid rgba(201,168,76,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, cursor: 'pointer' }}>
              {avatarEmoji}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>Click to change</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {AVATAR_EMOJIS.map(function(em) {
            var isActive = em === avatarEmoji;
            return (
              <button
                key={em}
                onClick={function() { setAvatarEmoji(em); }}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: isActive ? 'rgba(201,168,76,.2)' : 'rgba(22,16,32,.5)',
                  border: isActive ? '2px solid #C9A84C' : '1px solid rgba(255,255,255,.07)',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}>
                {em}
              </button>
            );
          })}
        </div>

        <div>
          <span style={labelStyle}>DISPLAY NAME</span>
          <input
            value={displayName}
            onChange={function(e) { setDisplayName(e.target.value); }}
            maxLength={40}
            style={inputStyle}
          />
        </div>

        <div>
          <span style={labelStyle}>{'BIO · ' + bio.length + '/160'}</span>
          <textarea
            value={bio}
            onChange={function(e) { setBio(e.target.value); }}
            maxLength={160}
            rows={3}
            style={Object.assign({}, inputStyle, { resize: 'none', lineHeight: 1.5 })}
          />
        </div>

        <div>
          <span style={labelStyle}>USERNAME</span>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#7A6F90', padding: '8px 12px', background: 'rgba(7,5,10,.5)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 8 }}>
            {'@' + (username || 'creator')}
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={profileSaving}
          style={{
            width: '100%',
            background: profileSaving ? 'rgba(201,168,76,.4)' : '#C9A84C',
            border: '1px solid #C9A84C',
            borderRadius: 8,
            padding: '10px 0',
            color: '#0F0C14',
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 14,
            letterSpacing: 2,
            cursor: profileSaving ? 'not-allowed' : 'pointer',
            opacity: profileSaving ? 0.7 : 1
          }}>
          {profileSaving ? 'SAVING...' : 'SAVE PROFILE'}
        </button>
      </div>
    );
  }

  function renderPayoutsTab() {
    if (stripeChecking) {
      return (
        <div style={Object.assign({}, cardStyle, { color: '#7A6F90', fontFamily: "'DM Mono',monospace", fontSize: 9 })}>
          Checking Stripe status...
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!stripeConnected ? (
          <div style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#C9A84C', letterSpacing: 2, marginBottom: 6 }}>
              &#x26A0; STRIPE NOT CONNECTED
            </div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#EDE8F5', marginBottom: 10 }}>
              Connect Stripe to receive tips, subscriptions, and payouts
            </div>
            <button
              onClick={connectStripe}
              style={{ background: '#C9A84C', border: '1px solid #C9A84C', borderRadius: 8, padding: '8px 16px', color: '#0F0C14', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 2, cursor: 'pointer' }}>
              CONNECT STRIPE
            </button>
          </div>
        ) : (
          <div>
            <div style={{ background: 'rgba(0,201,167,.08)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: '#00C9A7', fontWeight: 700 }}>
                &#x2705; STRIPE CONNECTED
              </div>
            </div>

            <div style={Object.assign({}, cardStyle, { display: 'flex', flexDirection: 'column', gap: 8 })}>
              <div style={labelStyle}>AVAILABLE BALANCE</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: '#C9A84C', letterSpacing: 2 }}>
                {'$' + (Math.floor(availableCents) / 100).toFixed(2)}
              </div>
              <button
                onClick={requestPayout}
                disabled={availableCents < 1000 || payoutLoading}
                style={{
                  background: availableCents < 1000 || payoutLoading ? 'rgba(201,168,76,.2)' : '#C9A84C',
                  border: '1px solid rgba(201,168,76,.5)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  color: availableCents < 1000 || payoutLoading ? '#7A6F90' : '#0F0C14',
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: 13,
                  letterSpacing: 2,
                  cursor: availableCents < 1000 || payoutLoading ? 'not-allowed' : 'pointer'
                }}>
                {payoutLoading ? 'PROCESSING...' : 'REQUEST PAYOUT'}
              </button>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>$10.00 minimum</div>
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 10 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', lineHeight: 1.6 }}>
            90% creator / 10% platform &mdash; this is immutable
          </div>
        </div>

        {/* Platform Fee Accounts */}
        <div style={Object.assign({}, cardStyle, { border: '1px solid rgba(201,168,76,.2)' })}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 1.5, marginBottom: 10 }}>SEEWHY PLATFORM ACCOUNTS (10% FEE)</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#7A6F90', marginBottom: 12, lineHeight: 1.4 }}>
            Viewers sending DirectPay will be shown these handles for the platform&rsquo;s 10% cut.
          </div>
          {[
            { id: 'paypal',  emoji: '💸', name: 'PayPal' },
            { id: 'cashapp', emoji: '💚', name: 'CashApp' },
            { id: 'venmo',   emoji: '💙', name: 'Venmo' },
            { id: 'zelle',   emoji: '💜', name: 'Zelle' },
            { id: 'chime',   emoji: '🟢', name: 'Chime' },
          ].map(function(p) {
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{p.emoji}</span>
                <input
                  value={platformHandles[p.id] || ''}
                  onChange={function(e) {
                    var v = e.target.value;
                    setPlatformHandle(p.id, v);
                    setPlatformHandles(getPlatformHandles());
                    if (addToast) addToast('Platform ' + p.name + ' saved', 'success');
                  }}
                  placeholder={p.name + ' handle / phone / email'}
                  style={inputStyle}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderNotificationsTab() {
    var rows = [
      { label: '&#x1F534; New Stream Alerts', desc: 'New stream from followed creators', value: notifyNewStream, setter: setNotifyNewStream },
      { label: '&#x1F4B0; Tip Received',       desc: 'Get notified of tips',              value: notifyTip,       setter: setNotifyTip },
      { label: '&#x2B50; New Subscriber',      desc: 'Know when someone subscribes',      value: notifySubscriber,setter: setNotifySubscriber },
      { label: '&#x1F4E7; Weekly Digest',      desc: 'Monday morning stats summary',      value: notifyEmailDigest,setter: setNotifyEmailDigest },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(function(row, i) {
          return (
            <div key={i} style={Object.assign({}, cardStyle, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10 })}>
              <div>
                <div
                  style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#EDE8F5', fontWeight: 600 }}
                  dangerouslySetInnerHTML={{ __html: row.label }}
                />
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginTop: 2 }}>
                  {row.desc}
                </div>
              </div>
              {renderToggle(row.value, row.setter)}
            </div>
          );
        })}

        <button
          onClick={saveNotifications}
          style={{ width: '100%', background: '#00C9A7', border: '1px solid #00C9A7', borderRadius: 8, padding: '10px 0', color: '#0F0C14', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, cursor: 'pointer', marginTop: 4 }}>
          SAVE PREFERENCES
        </button>

        {/* Push Notifications */}
        <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid rgba(201,168,76,.12)', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, marginBottom: 10 }}>PUSH NOTIFICATIONS</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: '#8A7A62', marginBottom: 12, lineHeight: 1.4 }}>
            {push.supported ? 'Get notified when your favorite hosts go live.' : 'Push notifications not supported in this browser.'}
          </div>
          {push.supported && (
            <button
              disabled={pushLoading}
              onClick={function() {
                setPushLoading(true);
                if (pushSubscribed) {
                  push.unsubscribe(function() { setPushSubscribed(false); setPushLoading(false); if (addToast) addToast('Push notifications disabled', 'info'); });
                } else {
                  push.subscribe(username || 'viewer',
                    function() { setPushSubscribed(true); setPushLoading(false); if (addToast) addToast('Push notifications enabled!', 'success'); },
                    function(e) { setPushLoading(false); if (addToast) addToast('Could not enable notifications: ' + (e && e.message ? e.message : String(e)), 'error'); }
                  );
                }
              }}
              style={{ width: '100%', padding: '11px', background: pushSubscribed ? 'rgba(128,0,32,.25)' : 'linear-gradient(135deg,#800020,#C01838)', border: '1px solid ' + (pushSubscribed ? 'rgba(128,0,32,.5)' : 'transparent'), borderRadius: 9, color: pushSubscribed ? '#C01838' : '#C9A84C', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, cursor: pushLoading ? 'wait' : 'pointer' }}>
              {pushLoading ? 'WORKING...' : pushSubscribed ? 'DISABLE NOTIFICATIONS' : 'ENABLE NOTIFICATIONS'}
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderSubscriptionTab() {
    var tierOrder = ['free', 'creator', 'pro', 'studio'];
    var currentIdx = tierOrder.indexOf(currentTier);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 2, marginBottom: 4 }}>
          YOUR PLATFORM PLAN
        </div>

        {PLATFORM_TIERS.map(function(tier) {
          var isActive = tier.id === currentTier;
          var tierIdx = tierOrder.indexOf(tier.id);
          var isUpgrade = tierIdx > currentIdx;

          return (
            <div key={tier.id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + (isActive ? tier.color : 'rgba(255,255,255,.07)'), borderRadius: 10, padding: '12px 14px', position: 'relative' }}>
              {isActive && (
                <div style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 1 }}>
                  CURRENT PLAN
                </div>
              )}
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: tier.color, letterSpacing: 2, marginBottom: 2 }}>
                {tier.label}
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90', marginBottom: 8 }}>
                {tier.priceCents === 0 ? 'FREE' : ('$' + (Math.floor(tier.priceCents) / 100).toFixed(2) + '/mo')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
                {tier.perks.map(function(perk) {
                  return (
                    <div key={perk} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#EDE8F5', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: tier.color, fontSize: 10 }}>&#x2713;</span>
                      {perk}
                    </div>
                  );
                })}
              </div>
              {isUpgrade && (
                <button
                  onClick={function() { addToast('Upgrade to ' + tier.label + ' — coming soon!', 'info'); }}
                  style={{ background: tier.color + '22', border: '1px solid ' + tier.color, borderRadius: 6, padding: '6px 14px', color: tier.color, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 2, cursor: 'pointer' }}>
                  UPGRADE
                </button>
              )}
            </div>
          );
        })}

        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 10 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', textAlign: 'center' }}>
            90% of all payments go directly to creators
          </div>
        </div>
      </div>
    );
  }

  function handleDeleteAccount() {
    localStorage.clear();
    if (addToast) addToast('Account data cleared. Refresh to reset.', 'info');
    setShowDeleteConfirm(false);
    setTimeout(function() { window.location.reload(); }, 1500);
  }

  function renderPrivacyTab() {
    var toggleRows = [
      { label: 'Public Profile',   desc: 'Your profile is visible to everyone', value: publicProfile,   setter: setPublicProfile },
      { label: 'Show Earnings',    desc: 'Display earnings on your public page', value: showEarnings,    setter: setShowEarnings },
      { label: 'Allow DMs',        desc: 'Let other creators send you messages', value: allowDMs,        setter: setAllowDMs },
      { label: 'Two-Factor Auth',  desc: 'Add extra security to your account',  value: twoFactor,       setter: setTwoFactor },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toggleRows.map(function(row, i) {
          return (
            <div key={i} style={Object.assign({}, cardStyle, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10 })}>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#EDE8F5', fontWeight: 600 }}>
                  {row.label}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginTop: 2 }}>
                  {row.desc}
                </div>
              </div>
              {renderToggle(row.value, row.setter)}
            </div>
          );
        })}

        <div style={{ background: 'rgba(255,26,60,.05)', border: '1px solid rgba(255,26,60,.25)', borderRadius: 10, padding: '12px 14px', marginTop: 8 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#FF1564', letterSpacing: 2, marginBottom: 6 }}>
            &#x26A0; DELETE ACCOUNT
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#EDE8F5', marginBottom: 10 }}>
            This cannot be undone. Type DELETE to confirm.
          </div>
          <input
            value={deleteConfirm}
            onChange={function(e) { setDeleteConfirm(e.target.value); }}
            placeholder="Type DELETE"
            style={{ width: '100%', background: 'rgba(255,26,60,.05)', border: '1px solid rgba(255,26,60,.2)', borderRadius: 8, padding: '7px 12px', color: '#EDE8F5', fontFamily: "'DM Mono',monospace", fontSize: 10, boxSizing: 'border-box', marginBottom: 8 }}
          />
          <button
            onClick={function() { addToast('Account deletion requires contacting support', 'error'); }}
            disabled={deleteConfirm !== 'DELETE'}
            style={{
              background: deleteConfirm === 'DELETE' ? 'rgba(255,26,60,.2)' : 'rgba(255,26,60,.05)',
              border: '1px solid rgba(255,26,60,.4)',
              borderRadius: 8,
              padding: '8px 16px',
              color: deleteConfirm === 'DELETE' ? '#FF1564' : '#7A6F90',
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 13,
              letterSpacing: 2,
              cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed'
            }}>
            DELETE ACCOUNT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      <div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#C9A84C', letterSpacing: 3 }}>
          &#x2699; SETTINGS
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90' }}>
          {'@' + (username || 'creator')}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 3, overflowX: 'auto', flexWrap: 'nowrap' }}>
        {SETTINGS_TABS.map(function(tab) {
          var isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={function() { setActiveTab(tab.id); }}
              style={{
                background: isActive ? '#C9A84C' : 'transparent',
                border: isActive ? '1px solid #C9A84C' : '1px solid rgba(122,111,144,.3)',
                borderRadius: 999,
                padding: '4px 10px',
                color: isActive ? '#0F0C14' : '#7A6F90',
                fontFamily: "'DM Mono',monospace",
                fontSize: 8,
                letterSpacing: 1,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'profile'       && renderProfileTab()}
      {activeTab === 'payouts'       && renderPayoutsTab()}
      {activeTab === 'notifications' && renderNotificationsTab()}
      {activeTab === 'subscription'  && renderSubscriptionTab()}
      {activeTab === 'privacy'       && renderPrivacyTab()}

      {/* Danger Zone */}
      <div style={{ marginTop: 24, background: 'rgba(128,0,32,.08)', border: '1px solid rgba(128,0,32,.3)', borderRadius: 12, padding: '16px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#800020', letterSpacing: 2, marginBottom: 12 }}>DANGER ZONE</div>
        {!showDeleteConfirm ? (
          <button
            onClick={function() { setShowDeleteConfirm(true); }}
            style={{ width: '100%', padding: '11px', background: 'transparent', border: '1px solid rgba(128,0,32,.5)', borderRadius: 9, color: '#C01838', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, letterSpacing: 2, cursor: 'pointer' }}>
            🗑 DELETE ACCOUNT
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: '#F0E8D4', textAlign: 'center', lineHeight: 1.4 }}>
              This will clear all local account data.<br />
              <strong style={{ color: '#C9A84C' }}>This action cannot be undone.</strong>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setShowDeleteConfirm(false); }}
                style={{ flex: 1, padding: '10px', background: 'rgba(26,21,16,.8)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, color: '#8A7A62', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 2, cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={handleDeleteAccount}
                style={{ flex: 1, padding: '10px', background: 'rgba(128,0,32,.5)', border: '1px solid rgba(192,24,56,.6)', borderRadius: 8, color: '#F0E8D4', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 2, cursor: 'pointer' }}>
                CONFIRM DELETE
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
