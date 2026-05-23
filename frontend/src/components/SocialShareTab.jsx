'use strict';
import React, { useState } from 'react';

var GOLD_H  = '#E8C46A';
var BURG    = '#800020';
var BURG_H  = '#C01838';
var TEAL_H  = '#00DEC0';
var MUTED   = '#6B5F82';
var TEXT    = '#EDE8F4';
var BG1     = '#0F0C14';
var FAINT   = '#1C1530';
var BORDER  = 'rgba(255,255,255,.07)';
var GLASS   = 'rgba(13,10,20,.75)';
var fD      = "'Bebas Neue',sans-serif";
var fU      = "'Barlow Condensed',sans-serif";
var fM      = "'DM Mono',monospace";

var STREAM_BASE_URL = 'https://seewhylive.online/watch/';

var SHARE_PLATFORMS = [
  {
    id: 'twitter',
    name: 'X / Twitter',
    emoji: '🐦',
    color: '#1DA1F2',
    buildShare: function(url, msg) {
      return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(msg) + '&url=' + encodeURIComponent(url);
    },
    openable: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    emoji: '📘',
    color: '#1877F2',
    buildShare: function(url, msg) {
      return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '&quote=' + encodeURIComponent(msg);
    },
    openable: true
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    emoji: '🎵',
    color: '#FF0050',
    buildShare: function(url, msg) { return null; },
    openable: false,
    copyOnly: true,
    copyNote: 'Paste link in your TikTok bio or LIVE description'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    emoji: '📸',
    color: '#E1306C',
    buildShare: function(url, msg) { return null; },
    openable: false,
    copyOnly: true,
    copyNote: 'Paste link in your Instagram bio or Story link'
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    emoji: '👻',
    color: '#FFFC00',
    textColor: '#000',
    buildShare: function(url, msg) { return null; },
    openable: false,
    copyOnly: true,
    copyNote: 'Paste link in a Snapchat DM or Story'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    emoji: '💬',
    color: '#25D366',
    buildShare: function(url, msg) {
      return 'https://api.whatsapp.com/send?text=' + encodeURIComponent(msg + '\n' + url);
    },
    openable: true
  },
  {
    id: 'telegram',
    name: 'Telegram',
    emoji: '✈️',
    color: '#0088CC',
    buildShare: function(url, msg) {
      return 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(msg);
    },
    openable: true
  },
  {
    id: 'youtube',
    name: 'YouTube Community',
    emoji: '▶',
    color: '#FF0000',
    buildShare: function(url, msg) { return null; },
    openable: false,
    copyOnly: true,
    copyNote: 'Post link in a YouTube Community tab or video description'
  }
];

export default function SocialShareTab({ addToast, isLive, roomId, username }) {
  var streamUrl = STREAM_BASE_URL + (roomId || 'live');
  var defaultMsg = isLive
    ? '🔴 I\'m LIVE on SeeWhy LIVE right now! Come watch: '
    : '📺 Check out my stream on SeeWhy LIVE: ';

  var [customMsg, setCustomMsg] = useState('');
  var [copied, setCopied] = useState('');
  var [view, setView] = useState('share');

  var shareMsg = customMsg || defaultMsg;

  function copyToClipboard(text, label) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        setCopied(label);
        addToast('✓ ' + label + ' copied to clipboard', 'success');
        setTimeout(function() { setCopied(''); }, 2000);
      }).catch(function() {
        addToast(text, 'info');
      });
    } else {
      addToast(text, 'info');
    }
  }

  function shareToPlatform(platform) {
    if (platform.copyOnly) {
      copyToClipboard(streamUrl, platform.name);
      addToast(platform.emoji + ' ' + platform.copyNote, 'info');
      return;
    }
    var url = platform.buildShare(streamUrl, shareMsg);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      addToast('Opening ' + platform.name + '...', 'info');
    }
  }

  function shareNative() {
    if (navigator.share) {
      navigator.share({
        title: 'SeeWhy LIVE' + (username ? ' — ' + username : ''),
        text: shareMsg,
        url: streamUrl
      }).then(function() {
        addToast('Shared!', 'success');
      }).catch(function() {
        copyToClipboard(streamUrl, 'Stream link');
      });
    } else {
      copyToClipboard(streamUrl, 'Stream link');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG1, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid ' + BORDER, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: fD, fontSize: 20, color: '#C084FC', letterSpacing: 3 }}>📡 SOCIAL SHARE</div>
          {isLive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 999, padding: '3px 10px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 6px #FF1A3C' }} />
              <span style={{ fontFamily: fU, fontWeight: 700, fontSize: 10, color: '#FF6B81' }}>LIVE NOW</span>
            </div>
          )}
        </div>
        <div style={{ fontFamily: fM, fontSize: 9, color: MUTED }}>
          Share your stream to external platforms · bring viewers in
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Stream link card */}
        <div style={{ background: 'rgba(192,132,252,.06)', border: '1px solid rgba(192,132,252,.25)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 6 }}>YOUR STREAM LINK</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, fontFamily: fM, fontSize: 9, color: '#C084FC', background: 'rgba(7,5,10,.8)', border: '1px solid rgba(192,132,252,.2)', borderRadius: 7, padding: '8px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {streamUrl}
            </div>
            <button
              onClick={function() { copyToClipboard(streamUrl, 'Stream link'); }}
              style={{ background: copied === 'Stream link' ? 'rgba(0,201,106,.2)' : 'rgba(192,132,252,.12)', border: '1px solid ' + (copied === 'Stream link' ? 'rgba(0,201,106,.4)' : 'rgba(192,132,252,.35)'), borderRadius: 8, padding: '8px 14px', color: copied === 'Stream link' ? '#00C96A' : '#C084FC', fontFamily: fU, fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0, letterSpacing: 1 }}>
              {copied === 'Stream link' ? '✓ COPIED' : '📋 COPY'}
            </button>
          </div>
        </div>

        {/* Custom message */}
        <div style={{ background: FAINT, border: '1px solid ' + BORDER, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 6 }}>SHARE MESSAGE</div>
          <textarea
            value={customMsg}
            onChange={function(e) { setCustomMsg(e.target.value); }}
            placeholder={defaultMsg}
            rows={2}
            style={{ width: '100%', background: 'rgba(7,5,10,.8)', border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: fU, fontSize: 12, resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
          />
          {customMsg && (
            <button
              onClick={function() { setCustomMsg(''); }}
              style={{ background: 'none', border: 'none', color: MUTED, fontFamily: fM, fontSize: 8, cursor: 'pointer', marginTop: 4, padding: 0 }}>
              ✕ reset to default
            </button>
          )}
        </div>

        {/* Native share (mobile) */}
        <button
          onClick={shareNative}
          style={{ background: 'linear-gradient(135deg,rgba(192,132,252,.2),rgba(155,77,202,.12))', border: '1px solid rgba(192,132,252,.4)', borderRadius: 10, padding: '13px 0', color: '#C084FC', fontFamily: fU, fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: 2, textAlign: 'center' }}>
          📤 SHARE NOW (ALL APPS)
        </button>

        {/* Platform grid */}
        <div style={{ fontFamily: fD, fontSize: 13, color: MUTED, letterSpacing: 3, marginBottom: 2 }}>SHARE TO SPECIFIC PLATFORM</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SHARE_PLATFORMS.map(function(platform) {
            var textColor = platform.textColor || '#fff';
            return (
              <button
                key={platform.id}
                onClick={function() { shareToPlatform(platform); }}
                style={{ background: FAINT, border: '1px solid ' + platform.color + '33', borderRadius: 10, padding: '11px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', overflow: 'hidden', textAlign: 'left' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: platform.color }} />
                <div style={{ width: 36, height: 36, borderRadius: 8, background: platform.color + '22', border: '1px solid ' + platform.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {platform.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 12, color: TEXT }}>{platform.name}</div>
                  <div style={{ fontFamily: fM, fontSize: 7, color: platform.copyOnly ? '#C8FF00' : TEAL_H, letterSpacing: 0.5 }}>
                    {platform.copyOnly ? '📋 COPY LINK' : '🔗 OPEN & SHARE'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Embed code */}
        <div style={{ background: FAINT, border: '1px solid ' + BORDER, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, letterSpacing: 2 }}>EMBED CODE</div>
            <button
              onClick={function() {
                var code = '<iframe src="' + streamUrl + '/embed" width="560" height="315" frameborder="0" allowfullscreen></iframe>';
                copyToClipboard(code, 'Embed code');
              }}
              style={{ background: copied === 'Embed code' ? 'rgba(0,201,106,.2)' : 'rgba(255,255,255,.06)', border: '1px solid ' + (copied === 'Embed code' ? 'rgba(0,201,106,.4)' : BORDER), borderRadius: 7, padding: '4px 10px', color: copied === 'Embed code' ? '#00C96A' : MUTED, fontFamily: fU, fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
              {copied === 'Embed code' ? '✓ COPIED' : '📋 COPY'}
            </button>
          </div>
          <div style={{ fontFamily: fM, fontSize: 8, color: '#5A8FFF', background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 7, padding: '8px 10px', wordBreak: 'break-all', lineHeight: 1.6 }}>
            {'<iframe src="' + streamUrl + '/embed" width="560" height="315" frameborder="0" allowfullscreen></iframe>'}
          </div>
          <div style={{ fontFamily: fM, fontSize: 7, color: MUTED, marginTop: 6 }}>
            Embed your live stream directly on any website or blog
          </div>
        </div>

        {/* External viewer note */}
        <div style={{ background: 'rgba(0,222,192,.04)', border: '1px solid rgba(0,222,192,.15)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 12, color: TEAL_H, marginBottom: 4 }}>🌐 EXTERNAL VIEWERS</div>
          <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, lineHeight: 1.6 }}>
            Anyone who follows your shared link can watch your live stream directly in their browser — no SeeWhy account required. They&apos;ll see your stream, chat, and a prompt to join the app.
          </div>
        </div>

      </div>
    </div>
  );
}
