import React, { useState, useEffect, useRef } from 'react';

var ShareSheet = function (props) {
  var shareUrl = props.shareUrl;
  var title = props.title || 'Check this out on SeeWhy LIVE';
  var onClose = props.onClose;

  var copiedState = useState(false);
  var copied = copiedState[0];
  var setCopied = copiedState[1];

  // Push to history on mount — Android back button dismisses the sheet
  var pushedRef = useRef(false);
  useEffect(function() {
    window.history.pushState({ swOverlay: 'share' }, '');
    pushedRef.current = true;
    function onPop() {
      if (pushedRef.current) { pushedRef.current = false; onClose(); }
    }
    window.addEventListener('popstate', onPop);
    return function() {
      window.removeEventListener('popstate', onPop);
      if (pushedRef.current) { pushedRef.current = false; }
    };
  }, [onClose]);

  function handleClose() {
    if (pushedRef.current) { window.history.back(); }
    else { onClose(); }
  }

  var handleNativeShare = function () {
    if (navigator.share) {
      navigator.share({ title: title, url: shareUrl }).catch(function () {});
    }
  };

  var handleCopy = function () {
    navigator.clipboard.writeText(shareUrl).then(function () {
      setCopied(true);
      setTimeout(function () { setCopied(false); }, 2000);
    });
  };

  var encodedUrl = encodeURIComponent(shareUrl);
  var encodedTitle = encodeURIComponent(title);

  var platforms = [
    { name: 'Instagram', color: '#E1306C', url: 'instagram://share?text=' + encodedTitle + '%20' + encodedUrl, fallback: 'https://www.instagram.com/' },
    { name: 'Facebook', color: '#1877F2', url: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl },
    { name: 'TikTok', color: '#000000', url: 'https://www.tiktok.com/upload?share_url=' + encodedUrl, fallback: 'https://www.tiktok.com/' },
    { name: 'Snapchat', color: '#FFFC00', url: 'https://www.snapchat.com/scan?attachmentUrl=' + encodedUrl },
    { name: 'X / Twitter', color: '#000000', url: 'https://twitter.com/intent/tweet?text=' + encodedTitle + '&url=' + encodedUrl },
    { name: 'WhatsApp', color: '#25D366', url: 'https://wa.me/?text=' + encodedTitle + '%20' + encodedUrl },
  ];

  var overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, overscrollBehavior: 'contain' };
  var sheetStyle = { backgroundColor: '#0A0A0A', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', width: '100%', maxWidth: '480px', padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 16px))', fontFamily: '"Barlow Condensed", sans-serif' };
  var headerStyle = { color: '#F5F5DC', fontFamily: '"Bebas Neue", sans-serif', fontSize: '20px', marginBottom: '16px', textAlign: 'center' };
  var gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' };
  var buttonStyle = function (color) {
    return { minHeight: '64px', borderRadius: '12px', border: 'none', backgroundColor: color, color: color === '#FFFC00' ? '#0A0A0A' : '#FFFFFF', fontFamily: '"Barlow Condensed", sans-serif', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', WebkitUserSelect: 'none' };
  };
  var copyRowStyle = { display: 'flex', gap: '8px', minHeight: '44px' };
  var inputStyle = { flex: 1, minHeight: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #800020', backgroundColor: '#1a1210', color: '#F5F5DC', fontFamily: '"DM Mono", monospace', fontSize: '13px' };
  var copyButtonStyle = { minHeight: '44px', minWidth: '80px', padding: '0 16px', borderRadius: '8px', border: 'none', backgroundColor: '#D4AF37', color: '#0A0A0A', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 'bold', userSelect: 'none', WebkitUserSelect: 'none' };
  var closeButtonStyle = { minHeight: '44px', width: '100%', marginTop: '12px', borderRadius: '8px', border: '1px solid #800020', backgroundColor: 'transparent', color: '#F5F5DC', fontFamily: '"Barlow Condensed", sans-serif', userSelect: 'none', WebkitUserSelect: 'none' };

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={sheetStyle} onClick={function (e) { e.stopPropagation(); }}>
        <div style={headerStyle}>Share to</div>
        {navigator.share ? (
          <button style={Object.assign({}, buttonStyle('#800020'), { width: '100%', marginBottom: '12px' })} onClick={handleNativeShare}>
            Share via device...
          </button>
        ) : null}
        <div style={gridStyle}>
          {platforms.map(function (p) {
            return (
              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={Object.assign({}, buttonStyle(p.color), { textDecoration: 'none' })}>
                {p.name}
              </a>
            );
          })}
        </div>
        <div style={copyRowStyle}>
          <input style={inputStyle} value={shareUrl} readOnly={true} />
          <button style={copyButtonStyle} onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <button style={closeButtonStyle} onClick={handleClose}>Close</button>
      </div>
    </div>
  );
};

export default ShareSheet;