'use strict';
import React, { useState, useEffect } from 'react';
import SignalBars from './SignalBars';
import AvatarPortrait from './AvatarPortrait.jsx';


function formatJoinDate(dateStr) {
  if (!dateStr) return '';
  var parts = dateStr.split('-');
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var y = parts[0];
  var m = parseInt(parts[1], 10) - 1;
  return months[m] + ' ' + y;
}

function formatFollowersLarge(n) {
  if (n >= 1000) {
    return Math.floor(n / 1000) + 'K';
  }
  return '' + n;
}

export default function CreatorProfileTab(props) {
  var addToast = props.addToast;
  var creatorUsername = props.creatorUsername || 'SwanyThree';
  var isLive = props.isLive;
  var viewerCount = props.viewerCount;
  var streamTitle = props.streamTitle;
  var socket = props.socket;

  var profileState = useState(null);
  var profile = profileState[0];
  var setProfile = profileState[1];

  var followingState = useState(false);
  var following = followingState[0];
  var setFollowing = followingState[1];

  var activeSectionState = useState('about');
  var activeSection = activeSectionState[0];
  var setActiveSection = activeSectionState[1];

  var copiedProfileState = useState(false);
  var copiedProfile = copiedProfileState[0];
  var setCopiedProfile = copiedProfileState[1];

  useEffect(function() {
    setProfile(null);
    fetch('/api/users/' + creatorUsername)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.username) {
          setProfile(d);
        } else {
          setProfile(null);
        }
      })
      .catch(function() {
        setProfile(null);
      });
  }, [creatorUsername]);

  function handleFollow() {
    var next = !following;
    setFollowing(next);
    if (socket) {
      socket.emit('follow-creator', { username: profile.username });
    }
    if (next) {
      addToast('Following @' + profile.username, 'success');
    } else {
      addToast('Unfollowed @' + profile.username, 'info');
    }
  }

  function handleShareProfile() {
    var url = 'https://seewhylive.online/@' + profile.username;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() {
        setCopiedProfile(true);
        setTimeout(function() { setCopiedProfile(false); }, 2000);
      }).catch(function() {
        addToast('Could not copy link', 'error');
      });
    } else {
      addToast('Copy not supported in this browser', 'error');
    }
  }

  function renderSectionTab(label, val) {
    var active = activeSection === val;
    return React.createElement(
      'button',
      {
        onClick: function() { setActiveSection(val); },
        style: {
          flex: 1,
          background: active ? 'rgba(201,168,76,.12)' : 'transparent',
          border: '1px solid ' + (active ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.07)'),
          borderRadius: 6,
          padding: '7px 0',
          fontFamily: "'Barlow Condensed',sans-serif",
          fontWeight: 700,
          fontSize: 12,
          color: active ? '#C9A84C' : '#8A7A62',
          cursor: 'pointer',
          letterSpacing: 1,
        }
      },
      label
    );
  }

  function renderAboutSection() {
    return React.createElement(
      'div',
      {
        style: {
          background: 'rgba(14,12,9,.95)',
          border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 10,
          padding: '14px 14px',
          marginTop: 10,
        }
      },
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            gap: 0,
            marginBottom: 14,
          }
        },
        React.createElement(
          'div',
          {
            style: {
              flex: 1,
              textAlign: 'center',
              borderRight: '1px solid rgba(255,255,255,.07)',
              paddingRight: 10,
            }
          },
          React.createElement(
            'div',
            {
              style: {
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 22,
                color: '#C9A84C',
              }
            },
            formatFollowersLarge(profile.followerCount)
          ),
          React.createElement(
            'div',
            {
              style: {
                fontFamily: "'DM Mono',monospace",
                fontSize: 9,
                color: '#8A7A62',
                letterSpacing: 1,
              }
            },
            'FOLLOWERS'
          )
        ),
        React.createElement(
          'div',
          {
            style: {
              flex: 1,
              textAlign: 'center',
              borderRight: '1px solid rgba(255,255,255,.07)',
              padding: '0 10px',
            }
          },
          React.createElement(
            'div',
            {
              style: {
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 22,
                color: '#C9A84C',
              }
            },
            '' + profile.recentStreams.length
          ),
          React.createElement(
            'div',
            {
              style: {
                fontFamily: "'DM Mono',monospace",
                fontSize: 9,
                color: '#8A7A62',
                letterSpacing: 1,
              }
            },
            'STREAMS'
          )
        ),
        React.createElement(
          'div',
          {
            style: {
              flex: 1,
              textAlign: 'center',
              paddingLeft: 10,
            }
          },
          React.createElement(
            'div',
            {
              style: {
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 16,
                color: '#C9A84C',
              }
            },
            formatJoinDate(profile.joinedDate)
          ),
          React.createElement(
            'div',
            {
              style: {
                fontFamily: "'DM Mono',monospace",
                fontSize: 9,
                color: '#8A7A62',
                letterSpacing: 1,
              }
            },
            'JOINED'
          )
        )
      ),
      React.createElement(
        'div',
        {
          className: 'selectable-text',
          style: {
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 14,
            color: '#F0E8D4',
            lineHeight: 1.5,
          }
        },
        profile.bio
      )
    );
  }

  function renderStreamsSection() {
    return React.createElement(
      'div',
      {
        style: {
          marginTop: 10,
        }
      },
      profile.recentStreams.map(function(stream) {
        return React.createElement(
          'div',
          {
            key: stream.id,
            style: {
              background: 'rgba(14,12,9,.95)',
              border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }
          },
          React.createElement(
            'div',
            { style: { flex: 1, minWidth: 0 } },
            React.createElement(
              'div',
              {
                style: {
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#F0E8D4',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: 2,
                }
              },
              stream.title
            ),
            React.createElement(
              'div',
              {
                style: {
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 9,
                  color: '#8A7A62',
                }
              },
              stream.date
            )
          ),
          React.createElement(
            'div',
            {
              style: {
                background: 'rgba(192,57,43,.1)',
                border: '1px solid rgba(192,57,43,.25)',
                borderRadius: 4,
                padding: '2px 7px',
                fontFamily: "'DM Mono',monospace",
                fontSize: 9,
                color: '#C0392B',
                whiteSpace: 'nowrap',
              }
            },
            stream.viewerPeak.toLocaleString() + ' peak'
          )
        );
      })
    );
  }

  function renderSubscribeSection() {
    return React.createElement(
      'div',
      { style: { marginTop: 10 } },
      profile.subscriberTiers.map(function(tier, idx) {
        var accentColor = idx === 0 ? '#C9A84C' : idx === 1 ? '#C9A84C' : '#C0392B';
        return React.createElement(
          'div',
          {
            key: tier.name,
            style: {
              background: 'rgba(14,12,9,.95)',
              border: '1px solid ' + accentColor + '33',
              borderRadius: 10,
              padding: '14px 14px',
              marginBottom: 10,
            }
          },
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } },
            React.createElement(
              'div',
              {
                style: {
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: 18,
                  color: accentColor,
                  letterSpacing: 2,
                }
              },
              tier.name.toUpperCase()
            ),
            React.createElement(
              'div',
              {
                style: {
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: 18,
                  color: '#C9A84C',
                }
              },
              '$' + (Math.floor(tier.amountCents) / 100).toFixed(2) + '/mo'
            )
          ),
          React.createElement(
            'div',
            { style: { marginBottom: 12 } },
            tier.perks.map(function(perk) {
              return React.createElement(
                'div',
                {
                  key: perk,
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: "'Barlow Condensed',sans-serif",
                    fontSize: 13,
                    color: '#F0E8D4',
                    marginBottom: 3,
                  }
                },
                React.createElement('span', { style: { color: accentColor } }, '✓'),
                perk
              );
            })
          ),
          React.createElement(
            'button',
            {
              onClick: function() { addToast('Subscription flow coming soon for ' + tier.name, 'info'); },
              style: {
                width: '100%',
                background: accentColor + '22',
                border: '1px solid ' + accentColor + '66',
                borderRadius: 6,
                padding: '9px 0',
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: accentColor,
                cursor: 'pointer',
                letterSpacing: 1,
              }
            },
            'SUBSCRIBE'
          )
        );
      })
    );
  }

  if (!profile) {
    return React.createElement(
      'div',
      { style: { background: '#0E0C09', minHeight: '100vh', padding: '12px 10px 50px', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      React.createElement('div', { style: { fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', textAlign: 'center' } }, 'Loading profile…')
    );
  }

  return React.createElement(
    'div',
    {
      style: {
        background: '#0E0C09',
        minHeight: '100vh',
        padding: '12px 10px 50px',
      }
    },
    React.createElement(
      'div',
      {
        style: {
          background: 'rgba(14,12,9,.95)',
          border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 10,
          padding: '16px 14px',
          marginBottom: 10,
        }
      },
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 } },
        React.createElement(AvatarPortrait, { username: profile.username || profile.displayName, size: 80, isLive: isLive }),
        React.createElement(
          'div',
          { style: { flex: 1, minWidth: 0 } },
          React.createElement(
            'div',
            {
              style: {
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 22,
                color: '#F0E8D4',
                letterSpacing: 1,
                marginBottom: 2,
              }
            },
            profile.displayName
          ),
          React.createElement(
            'div',
            {
              style: {
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
                color: '#8A7A62',
                marginBottom: 6,
              }
            },
            '@' + profile.username
          ),
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 } },
            React.createElement(
              'span',
              {
                style: {
                  background: 'rgba(201,168,76,.1)',
                  border: '1px solid rgba(201,168,76,.3)',
                  borderRadius: 4,
                  padding: '1px 6px',
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 9,
                  color: '#C9A84C',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }
              },
              profile.tier
            ),
            React.createElement(
              'span',
              {
                style: {
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 10,
                  color: '#8A7A62',
                }
              },
              formatFollowersLarge(profile.followerCount) + ' followers'
            )
          ),
          React.createElement(
            'div',
            {
              className: 'selectable-text',
              style: {
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 13,
                color: '#8A7A62',
                lineHeight: 1.4,
              }
            },
            profile.bio
          )
        )
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', gap: 8 } },
        React.createElement(
          'button',
          {
            onClick: handleFollow,
            style: {
              flex: 1,
              background: following ? 'rgba(192,57,43,.15)' : 'rgba(201,168,76,.12)',
              border: '1px solid ' + (following ? 'rgba(192,57,43,.4)' : 'rgba(201,168,76,.35)'),
              borderRadius: 6,
              padding: '8px 0',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: following ? '#C0392B' : '#C9A84C',
              cursor: 'pointer',
              letterSpacing: 1,
            }
          },
          following ? 'FOLLOWING' : 'FOLLOW'
        ),
        React.createElement(
          'button',
          {
            onClick: handleShareProfile,
            style: {
              flex: 1,
              background: copiedProfile ? 'rgba(201,168,76,.12)' : 'rgba(26,21,16,.8)',
              border: '1px solid ' + (copiedProfile ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.07)'),
              borderRadius: 6,
              padding: '8px 0',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: copiedProfile ? '#C9A84C' : '#8A7A62',
              cursor: 'pointer',
              letterSpacing: 1,
            }
          },
          copiedProfile ? 'COPIED!' : 'SHARE PROFILE'
        )
      )
    ),
    isLive
      ? React.createElement(
          'div',
          {
            style: {
              background: 'rgba(192,57,43,.06)',
              border: '1px solid rgba(192,57,43,.35)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }
          },
          React.createElement(
            'div',
            { style: { flex: 1, minWidth: 0 } },
            React.createElement(
              'div',
              {
                style: {
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 10,
                  color: '#C0392B',
                  letterSpacing: 1,
                  marginBottom: 2,
                }
              },
              '🔴 LIVE NOW'
            ),
            React.createElement(
              'div',
              {
                style: {
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#F0E8D4',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }
              },
              streamTitle || 'Live Stream'
            )
          ),
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: 6 } },
            React.createElement(SignalBars, { isActive: true, count: 5 }),
            React.createElement(
              'span',
              {
                style: {
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 10,
                  color: '#C0392B',
                }
              },
              (viewerCount || 0).toLocaleString()
            )
          )
        )
      : null,
    React.createElement(
      'div',
      { style: { display: 'flex', gap: 6, marginBottom: 0 } },
      renderSectionTab('ABOUT', 'about'),
      renderSectionTab('STREAMS', 'streams'),
      renderSectionTab('SUBSCRIBE', 'subscribe')
    ),
    activeSection === 'about' ? renderAboutSection() : null,
    activeSection === 'streams' ? renderStreamsSection() : null,
    activeSection === 'subscribe' ? renderSubscribeSection() : null
  );
}
