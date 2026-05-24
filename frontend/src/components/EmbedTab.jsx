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
    <form
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        padding: '28px 24px',
        background: 'rgba(22,16,32,.95)',
        border: '1px solid rgba(255,255,255,.07)',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '380px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
      onSubmit={handleSubmit}
    >
      <div
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: '22px',
          letterSpacing: '2px',
          color: '#EDE8F5',
          textAlign: 'center'
        }}
      >
        UNLOCK FULL STREAM
      </div>
      <div
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: '36px',
          color: '#E8C46A',
          textAlign: 'center',
          letterSpacing: '1px'
        }}
      >
        ${PPV_PRICE_USD.toFixed(2)}
      </div>
      <div
        style={{
          fontFamily: "'Barlow Condensed',sans-serif",
          fontSize: '13px',
          color: '#7A6F90',
          textAlign: 'center'
        }}
      >
        Creator receives: ${creatorAmt} (90%)
      </div>
      <div
        style={{
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: '6px',
          padding: '12px 14px'
        }}
      >
        <CardElement options={{ style: { base: { color: '#E8C46A', fontFamily: 'DM Mono, monospace', fontSize: '16px' } } }} />
      </div>
      {error && (
        <div
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: '13px',
            color: '#ff6b6b',
            background: 'rgba(255,0,0,.08)',
            border: '1px solid rgba(255,0,0,.2)',
            borderRadius: '5px',
            padding: '8px 12px',
            textAlign: 'center'
          }}
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={processing || !stripe}
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: '17px',
          letterSpacing: '2px',
          color: '#0F0C14',
          background: processing || !stripe ? '#7A6F90' : '#E8C46A',
          border: 'none',
          borderRadius: '6px',
          padding: '12px 0',
          cursor: processing || !stripe ? 'not-allowed' : 'pointer',
          width: '100%',
          transition: 'background .2s'
        }}
      >
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
  var hlsErrorState = useState(false);
  var hlsError = hlsErrorState[0];
  var setHlsError = hlsErrorState[1];
  var retryingState = useState(false);
  var retrying = retryingState[0];
  var setRetrying = retryingState[1];
  var retryTimerRef = useRef(null);

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
          setHlsError(true);
          setRetrying(true);
          hls.destroy();
          retryTimerRef.current = setTimeout(function() {
            setHlsError(false);
            setRetrying(false);
          }, 4000);
        }
      });
    }
    return function() { hls.destroy(); if (retryTimerRef.current) clearTimeout(retryTimerRef.current); };
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
    <div
      style={{
        padding: '20px',
        minHeight: '100%',
        background: '#0F0C14',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          background: 'rgba(22,16,32,.8)',
          border: '1px solid rgba(255,255,255,.07)',
          borderRadius: '12px',
          padding: '24px',
          backdropFilter: 'blur(12px)'
        }}
      >
        <h2
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: '26px',
            letterSpacing: '3px',
            color: '#EDE8F5',
            margin: '0 0 20px 0'
          }}
        >
          EMBEDDED PLAYER
        </h2>

        <div
          style={{
            width: '100%',
            marginBottom: '24px',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          {!isLive && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                background: 'rgba(0,0,0,.4)',
                border: '1px solid rgba(255,255,255,.07)',
                borderRadius: '8px',
                gap: '8px'
              }}
            >
              <div
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: '22px',
                  letterSpacing: '2px',
                  color: '#EDE8F5'
                }}
              >
                Stream Offline
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontSize: '14px',
                  color: '#7A6F90'
                }}
              >
                Go live to begin streaming
              </div>
            </div>
          )}

          {isLive && (
            <div style={{ position: 'relative' }}>
              <video
                ref={videoRef}
                controls={!showPaywall}
                autoPlay
                playsInline
                style={{ width: '100%', maxHeight: 360, background: '#07050A', display: 'block' }}
              />

              {!ppvToken && !previewExpired && isLive && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '12px',
                    fontFamily: "'DM Mono',monospace",
                    fontSize: '12px',
                    color: '#E8C46A',
                    background: 'rgba(0,0,0,.65)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    pointerEvents: 'none'
                  }}
                >
                  Preview: {previewTimer}s remaining
                </div>
              )}

              {hlsError && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,12,20,.9)', gap: 10 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: '#FF1A3C' }}>STREAM ERROR</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#7A6F90' }}>{retrying ? 'Reconnecting...' : 'Connection lost'}</div>
                  {retrying && <div style={{ width: 40, height: 4, background: '#241C34', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', background: '#C9A84C', borderRadius: 2, animation: 'none', width: '60%' }} /></div>}
                </div>
              )}

              {showPaywall && !ppvToken && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(15,12,20,.85)',
                    backdropFilter: 'blur(6px)',
                    padding: '20px',
                    boxSizing: 'border-box'
                  }}
                >
                  <Elements stripe={stripePromise}>
                    <PaywallForm onUnlock={handleUnlock} roomId={roomId} />
                  </Elements>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: '18px',
              letterSpacing: '2px',
              color: '#EDE8F5',
              margin: '0 0 10px 0'
            }}
          >
            EMBED CODE
          </h3>
          <textarea
            readOnly
            value={embedCode}
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,.35)',
              border: '1px solid rgba(255,255,255,.07)',
              borderRadius: '6px',
              color: '#EDE8F5',
              fontFamily: "'DM Mono',monospace",
              fontSize: '13px',
              padding: '10px 12px',
              resize: 'none',
              boxSizing: 'border-box',
              outline: 'none',
              marginBottom: '10px'
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={function() { navigator.clipboard.writeText(embedCode).then(function() {}).catch(function() {}); }}
              style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '15px', letterSpacing: '2px', color: '#0F0C14', background: '#00DEC0', border: 'none', borderRadius: '6px', padding: '10px 22px', cursor: 'pointer' }}>
              COPY EMBED CODE
            </button>
            <button
              onClick={function() {
                var url = 'https://seewhylive.online/watch/' + roomId;
                if (navigator.share) {
                  navigator.share({ title: 'SeeWhy LIVE', url: url }).catch(function() {});
                } else {
                  navigator.clipboard.writeText(url).then(function() {}).catch(function() {});
                }
              }}
              style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '15px', letterSpacing: '2px', color: '#C9A84C', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.35)', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer' }}>
              &#x1F517; SHARE
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '4px' }}>
          <h3
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: '18px',
              letterSpacing: '2px',
              color: '#EDE8F5',
              margin: '0 0 10px 0'
            }}
          >
            DIRECT STREAM URL
          </h3>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: '13px',
              color: '#00DEC0',
              background: 'rgba(0,0,0,.35)',
              border: '1px solid rgba(255,255,255,.07)',
              borderRadius: '6px',
              padding: '10px 12px',
              wordBreak: 'break-all'
            }}
          >
            {'https://srv1581658.hstgr.cloud/hls/' + roomId + '/index.m3u8'}
          </div>
        </div>
      </div>
    </div>
  );
}
