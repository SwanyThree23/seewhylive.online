'use strict';
import React, { useState, useEffect } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var _goldWallStyleInjected = false;

function formatTime(ts) {
  var now = Date.now();
  var t = typeof ts === 'number' ? ts : new Date(ts).getTime();
  var diff = Math.floor((now - t) / 1000);
  if (diff < 60) {
    return diff + 's ago';
  }
  if (diff < 3600) {
    return Math.floor(diff / 60) + 'm ago';
  }
  var d = new Date(t);
  var hh = d.getHours();
  var mm = d.getMinutes();
  return (hh < 10 ? '0' + hh : '' + hh) + ':' + (mm < 10 ? '0' + mm : '' + mm);
}

function typeBadgeColor(type) {
  if (type === 'TIP') return '#C0392B';
  if (type === 'GIFT') return '#C9A84C';
  if (type === 'SUB') return '#C9A84C';
  return '#8A7A62';
}

export default function GoldenWallPanel(props) {
  var items = props.items || [];
  var maxVisible = props.maxVisible || 8;

  var visibleState = useState([]);
  var visible = visibleState[0];
  var setVisible = visibleState[1];

  if (!_goldWallStyleInjected) {
    _goldWallStyleInjected = true;
    var styleEl = document.createElement('style');
    styleEl.textContent = '@keyframes goldWallIn { 0% { transform: scale(0.8) translateY(-10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }';
    document.head.appendChild(styleEl);
  }

  useEffect(function() {
    setVisible(items.slice(0, maxVisible));
  }, [items]);

  return React.createElement(
    'div',
    {
      style: {
        background: 'rgba(14,12,9,.95)',
        border: '1px solid rgba(255,255,255,.07)',
        borderRadius: 10,
        padding: '12px 10px',
        minWidth: 200,
      }
    },
    React.createElement(
      'div',
      {
        style: {
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 15,
          color: '#C9A84C',
          letterSpacing: 3,
          marginBottom: 10,
        }
      },
      '✨ GOLDEN WALL'
    ),
    visible.length === 0
      ? React.createElement(
          'div',
          {
            style: {
              color: '#8A7A62',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 12,
              textAlign: 'center',
              padding: '16px 0',
            }
          },
          'Support your creator — tips appear here'
        )
      : visible.map(function(item) {
          var typeColor = typeBadgeColor(item.type);
          var amountStr = '$' + (Math.floor(item.amountCents) / 100).toFixed(2);
          var typeLabel = item.type || 'TIP';
          return React.createElement(
            'div',
            {
              key: item.id,
              style: {
                borderLeft: '3px solid',
                borderImage: 'linear-gradient(180deg, #C9A84C, #C0392B) 1',
                background: 'rgba(26,21,16,.8)',
                borderRadius: '0 6px 6px 0',
                padding: '7px 9px',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                animation: 'goldWallIn 0.4s ease-out',
              }
            },
            React.createElement(AvatarPortrait, { username: item.username || 'anon', size: 28, flexShrink: 0 }),
            React.createElement(
              'div',
              { style: { flex: 1, minWidth: 0 } },
              React.createElement(
                'div',
                {
                  style: {
                    fontFamily: "'Barlow Condensed',sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#F0E8D4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }
                },
                item.username
              ),
              React.createElement(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 } },
                React.createElement(
                  'span',
                  {
                    style: {
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: 16,
                      color: '#C9A84C',
                    }
                  },
                  amountStr
                ),
                React.createElement(
                  'span',
                  {
                    style: {
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 8,
                      color: typeColor,
                      background: 'rgba(0,0,0,.3)',
                      borderRadius: 3,
                      padding: '1px 4px',
                      letterSpacing: 1,
                    }
                  },
                  typeLabel
                )
              )
            ),
            React.createElement(
              'div',
              {
                style: {
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 9,
                  color: '#8A7A62',
                  whiteSpace: 'nowrap',
                }
              },
              formatTime(item.ts)
            )
          );
        })
  );
}
