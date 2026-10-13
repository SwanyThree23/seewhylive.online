import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Video, Clock, Lock } from 'lucide-react';

var G = '#d4af37';

export default function VideoShortRecorder(props) {
  var roomId    = props.roomId;
  var creatorId = props.creatorId;

  var isRecordingState = useState(false);
  var isRecording    = isRecordingState[0];
  var isRecordingSet = isRecordingState[1];
  var durationState = useState(0);
  var duration    = durationState[0];
  var setDuration = durationState[1];
  var paywallState = useState(false);
  var paywall    = paywallState[0];
  var setPaywall = paywallState[1];
  var paywallPriceState = useState(2.99);
  var paywallPrice    = paywallPriceState[0];
  var setPaywallPrice = paywallPriceState[1];
  var videoTitleState = useState('');
  var videoTitle    = videoTitleState[0];
  var setVideoTitle = videoTitleState[1];
  var publishingState = useState(false);
  var publishing    = publishingState[0];
  var setPublishing = publishingState[1];

  useEffect(function() {
    var timer;
    if (isRecording) {
      timer = setInterval(function() {
        setDuration(function(d) {
          if (d >= 600) {
            isRecordingSet(false);
            return 600;
          }
          return d + 1;
        });
      }, 1000);
    }
    return function() { clearInterval(timer); };
  }, [isRecording]);

  var handlePublish = async function() {
    setPublishing(true);
    try {
      var result = await base44.entities.VODVideo.create({
        room_id: roomId,
        creator_id: creatorId,
        title: videoTitle || 'Untitled Short',
        description: 'Published at ' + new Date().toLocaleTimeString(),
        video_url: '',
        thumbnail_url: '',
        duration_seconds: duration,
        paywall_enabled: paywall,
        paywall_price: paywall ? paywallPrice : 0,
        created_at: new Date().toISOString(),
      });

      if (result && result.id) {
        alert('Video published!');
        setDuration(0);
        setVideoTitle('');
      }
    } catch (error) {
    }
    setPublishing(false);
  };

  var minutes = Math.floor(duration / 60);
  var seconds = duration % 60;
  var maxDuration = duration >= 600;

  var inputSmall = {
    width: '100%', padding: '6px 8px', borderRadius: 6,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: 16, borderRadius: 8, background: 'rgba(8,11,24,0.95)', border: '1px solid ' + G + '30', display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Video style={{ width: 16, height: 16, color: G }} />
        <p style={{ fontSize: 12, fontWeight: 700, color: G, margin: 0 }}>Create Short (Max 10 min)</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: isRecording ? '#C0392B' : 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')} / 10:00
          </span>
        </div>
        <button
          onClick={function() { isRecordingSet(!isRecording); }}
          disabled={maxDuration}
          style={{ padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700, border: 'none', cursor: maxDuration ? 'not-allowed' : 'pointer', background: isRecording ? '#C0392B' : G, color: isRecording ? 'white' : '#000' }}
        >
          {isRecording ? 'Stop' : 'Record'}
        </button>
      </div>

      {duration > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            placeholder="Short title..."
            value={videoTitle}
            onChange={function(e) { setVideoTitle(e.target.value); }}
            style={inputSmall}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 4, background: 'rgba(255,255,255,0.02)' }}>
            <input
              type="checkbox"
              id="paywall"
              checked={paywall}
              onChange={function(e) { setPaywall(e.target.checked); }}
              style={{ width: 12, height: 12 }}
            />
            <label htmlFor="paywall" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Lock style={{ width: 12, height: 12, color: G }} />
              Paywall (viewers pay to watch)
            </label>
          </div>

          {paywall && (
            <input
              type="number"
              min="0.99"
              step="0.01"
              value={paywallPrice}
              onChange={function(e) { setPaywallPrice(Number(e.target.value)); }}
              style={inputSmall}
              placeholder="Price in USD"
            />
          )}

          <button
            onClick={handlePublish}
            disabled={publishing || !videoTitle}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: (publishing || !videoTitle) ? 'not-allowed' : 'pointer', background: G, color: '#000', opacity: (publishing || !videoTitle) ? 0.5 : 1 }}
          >
            {publishing ? 'Publishing...' : 'Publish Short'}
          </button>
        </div>
      )}
    </motion.div>
  );
}
