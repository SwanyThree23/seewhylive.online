import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

var stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

var PPV_PRICE_USD = 4.99;
var CREATOR_SHARE = 0.90;
var PREVIEW_SECONDS = 120;

function PaywallForm({ onUnlock, roomId, addToast }) {
  var stripe = useStripe();
  var elements = useElements();
  var processingState = useState(false);
  var processing = processingState[0];
  var setProcessing = processingState[1];
  var errorState = useState(null);
  var error = errorState[0];
  var setError = errorState[1];

  var creatorAmt = (PPV_PRICE_USD * CREATOR_SHARE).toFixed(2);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    try {
      var res = await fetch('/api/ppv/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, viewerId: 'viewer-' + Date.now(), priceUsd: PPV_PRICE_USD })
      });
      var data = await res.json();
      if (!data || !data.clientSecret) throw new Error('No client secret returned');

      var cardEl = elements.getElement(CardElement);
      var result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardEl }
      });

      if (result.error) throw new Error(result.error.message);

      var verifyRes = await fetch('/api/ppv/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: data.paymentIntentId, roomId, viewerId: 'viewer-' + Date.now() })
      });
      var verifyData = await verifyRes.json();
      if (!verifyData || !verifyData.token) throw new Error('Payment verification failed');

      sessionStorage.setItem('sw_ppv_token', verifyData.token);
      onUnlock(verifyData.token);
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  }

  return (
    <form className="paywall-form" onSubmit={handleSubmit}>
      <div className="paywall-title">UNLOCK FULL STREAM</div>
      <div className="paywall-price">${PPV_PRICE_USD.toFixed(2)}</div>
      <div className="paywall-split">
        Creator receives: ${creatorAmt} (90%)
      </div>
      <div className="paywall-card-wrap">
        <CardElement className="stripe-card-element" options={{ style: { base: { color: '#E8C46A', fontFamily: 'DM Mono, monospace', fontSize: '16px' } } }} />
      </div>
      {error && <div className="paywall-error">{error}</div>}
      <button className="btn-gold paywall-submit" type="submit" disabled={processing || !stripe}>
        {processing ? 'Processing...' : 'UNLOCK NOW'}
      </button>
    </form>
  );
}

export default function EmbedTab({ roomId, ppvToken, setPpvToken, isLive }) {
  var videoRef = useRef(null);
  var hlsRef = useRef(null);
  var showPaywallState = useState(false);
  var showPaywall = showPaywallState[0];
  var setShowPaywall = showPaywallState[1];
  var previewTimerState = useState(PREVIEW_SECONDS);
  var previewTimer = previewTimerState[0];
  var setPreviewTimer = previewTimerState[1];
  var previewExpiredState = useState(false);
  var previewExpired = previewExpiredState[0];
  var setPreviewExpired = previewExpiredState[1];
  var playerReadyState = useState(false);
  var setPlayerReady = playerReadyState[1];
  var embedCodeState = useState('');
  var embedCode = embedCodeState[0];
  var setEmbedCode = embedCodeState[1];

  var HLS_URL = 'https://srv1581658.hstgr.cloud/hls/' + roomId + '/index.m3u8' + (ppvToken ? '?token=' + ppvToken : '');

  useEffect(function() {
    if (!isLive) return;
    if (!Hls.isSupported() && videoRef.current) {
      videoRef.current.src = HLS_URL;
      setPlayerReady(true);
      return;
    }
    var hls = new Hls({ enableWorker: true, lowLatencyMode: true });
    hlsRef.current = hls;
    hls.loadSource(HLS_URL);
    if (videoRef.current) {
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        setPlayerReady(true);
        if (videoRef.current) videoRef.current.play().catch(function() {});
      });
      hls.on(Hls.Events.ERROR, function(event, data) {
        if (data.fatal) {
          console.error('[HLS] Fatal error:', data.type, data.details);
        }
      });
    }
    return function() { hls.destroy(); };
  }, [isLive, ppvToken]);

  useEffect(function() {
    if (ppvToken || !isLive) return;
    var interval = setInterval(function() {
      setPreviewTimer(function(t) {
        if (t <= 1) {
          clearInterval(interval);
          setPreviewExpired(true);
          setShowPaywall(true);
          if (hlsRef.current) hlsRef.current.stopLoad();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return function() { clearInterval(interval); };
  }, [ppvToken, isLive]);

  useEffect(function() {
    var code = '<iframe src="https://srv1581658.hstgr.cloud/embed/' + roomId + '" width="640" height="360" frameborder="0" allowfullscreen></iframe>';
    setEmbedCode(code);
  }, [roomId]);

  function handleUnlock(token) {
    setPpvToken(token);
    setShowPaywall(false);
    setPreviewExpired(false);
  }

  return (
    <div className="tab-panel embed-tab">
      <div className="glass-card">
        <h2 className="panel-title">EMBEDDED PLAYER</h2>

        <div className="player-wrap">
          {!isLive && (
            <div className="player-offline">
              <div className="player-offline-text">Stream Offline</div>
              <div className="player-offline-sub">Go live to begin streaming</div>
            </div>
          )}

          {isLive && (
            <div className="player-container" style={{ position: 'relative' }}>
              <video
                ref={videoRef}
                className="hls-player"
                controls={!showPaywall}
                autoPlay
                playsInline
                style={{ width: '100%', maxHeight: 360, background: '#07050A' }}
              />

              {!ppvToken && !previewExpired && isLive && (
                <div className="preview-timer-overlay">
                  Preview: {previewTimer}s remaining
                </div>
              )}

              {showPaywall && !ppvToken && (
                <div className="paywall-overlay">
                  <Elements stripe={stripePromise}>
                    <PaywallForm onUnlock={handleUnlock} roomId={roomId} />
                  </Elements>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="embed-section">
          <h3 className="embed-section-title">EMBED CODE</h3>
          <textarea className="embed-code-box" readOnly value={embedCode} rows={3} />
          <button className="btn-teal" onClick={function() { navigator.clipboard.writeText(embedCode).then(function() {}).catch(function() {}); }}>
            COPY EMBED CODE
          </button>
        </div>

        <div className="embed-section">
          <h3 className="embed-section-title">DIRECT STREAM URL</h3>
          <div className="url-display">
            {'https://srv1581658.hstgr.cloud/hls/' + roomId + '/index.m3u8'}
          </div>
        </div>
      </div>
    </div>
  );
}
