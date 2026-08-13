import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, Play, Pause, RefreshCw, Wifi, WifiOff, Camera } from 'lucide-react';

var OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

var TABS = [
  { id: 'screen', label: 'Screen Share' },
  { id: 'watch', label: 'Watch Together' },
  { id: '4k', label: '4K Room' },
];

var QUALITY_OPTIONS = [
  { id: '720p',  label: '720p',  constraints: { width: { ideal: 1280  }, height: { ideal: 720  }, frameRate: { ideal: 30 } } },
  { id: '1080p', label: '1080p', constraints: { width: { ideal: 1920  }, height: { ideal: 1080 }, frameRate: { ideal: 30 } } },
  { id: '4k',    label: '4K',    constraints: { width: { ideal: 3840  }, height: { ideal: 2160 }, frameRate: { ideal: 30 } } },
];

function isYouTubeUrl(url) {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'));
}

function getYouTubeId(url) {
  if (!url) return null;
  var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([^&?/]+)/);
  return m ? m[1] : null;
}

function TabStrip({ activeTab, onTabChange }) {
  return (
    <div style={{ display: 'flex', background: 'rgba(8,11,24,0.95)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
      {TABS.map(function(tab) {
        var isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={function() { onTabChange(tab.id); }}
            style={{
              flex: 1,
              padding: '10px 8px',
              fontSize: 11,
              fontWeight: 900,
              fontFamily: 'Barlow Condensed, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.4)',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid #D4AF37' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.2s, border-color 0.2s',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function StatsBadge({ label, value, color }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 11,
      fontWeight: 900,
      fontFamily: 'Barlow Condensed, sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      padding: '2px 8px',
      borderRadius: 999,
      background: color ? color + '18' : 'rgba(212,175,55,0.1)',
      border: '1px solid ' + (color ? color + '40' : 'rgba(212,175,55,0.25)'),
      color: color || '#D4AF37',
    }}>
      {label}{value !== undefined ? ': ' + value : ''}
    </span>
  );
}

function ActionButton({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '8px 16px',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 900,
        fontFamily: 'Barlow Condensed, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'opacity 0.2s',
        border: '1px solid rgba(212,175,55,0.3)',
        background: 'rgba(212,175,55,0.15)',
        color: '#D4AF37',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function VideoPlaceholder({ icon, text }) {
  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/9',
      background: 'rgba(8,11,24,1)',
      border: '1px solid rgba(212,175,55,0.15)',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    }}>
      <div style={{ color: 'rgba(212,175,55,0.4)', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
        {text}
      </span>
    </div>
  );
}

function ScreenShareMode({ user, party }) {
  var [screenStream, setScreenStream] = useState(null);
  var [quality, setQuality] = useState('1080p');
  var [error, setError] = useState(null);
  var [streamSettings, setStreamSettings] = useState(null);
  var videoRef = useRef(null);

  useEffect(function() {
    if (videoRef.current) videoRef.current.srcObject = screenStream || null;
  }, [screenStream]);

  var refreshSettings = useCallback(function(stream) {
    var track = stream && stream.getVideoTracks && stream.getVideoTracks()[0];
    if (track) {
      var s = track.getSettings();
      setStreamSettings(s);
    }
  }, []);

  useEffect(function() {
    if (!screenStream) return;
    refreshSettings(screenStream);
    var iv = setInterval(function() { refreshSettings(screenStream); }, 3000);
    return function() { clearInterval(iv); };
  }, [screenStream, refreshSettings]);

  var startSharing = async function() {
    setError(null);
    try {
      var stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { max: 30 } },
        audio: true,
      });
      stream.getVideoTracks()[0].onended = function() { setScreenStream(null); setStreamSettings(null); };
      setScreenStream(stream);
    } catch (e) {
      setError('Screen share blocked. Please allow screen capture.');
    }
  };

  var stopSharing = function() {
    if (screenStream) {
      screenStream.getTracks().forEach(function(t) { t.stop(); });
      setScreenStream(null);
      setStreamSettings(null);
    }
  };

  var applyQuality = async function(qid) {
    setQuality(qid);
    var opt = QUALITY_OPTIONS.find(function(o) { return o.id === qid; });
    if (!opt || !screenStream) return;
    var track = screenStream.getVideoTracks && screenStream.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints(opt.constraints);
      refreshSettings(screenStream);
    } catch (e) {}
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', aspectRatio: '16/9', background: '#000', objectFit: 'contain', display: screenStream ? 'block' : 'none' }}
        />
        {!screenStream && (
          <VideoPlaceholder
            icon={<Monitor style={{ width: 48, height: 48 }} />}
            text="Share Your Screen"
          />
        )}
        {screenStream && (
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
            <StatsBadge label="LIVE" color="#C0392B" />
            {streamSettings && (
              <>
                <StatsBadge label={streamSettings.width + 'x' + streamSettings.height} />
                {streamSettings.frameRate && (
                  <StatsBadge label={Math.round(streamSettings.frameRate) + 'fps'} />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: 'rgba(128,0,32,0.2)',
          border: '1px solid rgba(128,0,32,0.4)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 12,
          fontFamily: 'Barlow Condensed, sans-serif',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {!screenStream ? (
          <ActionButton onClick={startSharing}>
            <Monitor style={{ width: 14, height: 14 }} /> Start Sharing
          </ActionButton>
        ) : (
          <ActionButton
            onClick={stopSharing}
            style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.35)', color: '#C0392B' }}
          >
            Stop Sharing
          </ActionButton>
        )}

        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {QUALITY_OPTIONS.map(function(opt) {
            var isActive = quality === opt.id;
            return (
              <button
                key={opt.id}
                onClick={function() { applyQuality(opt.id); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 900,
                  fontFamily: 'Barlow Condensed, sans-serif',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: isActive ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.12)',
                  background: isActive ? 'rgba(212,175,55,0.15)' : 'transparent',
                  color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {screenStream && streamSettings && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <StatsBadge label={'Resolution'} value={streamSettings.width + 'x' + streamSettings.height} />
          {streamSettings.frameRate && (
            <StatsBadge label={'FPS'} value={Math.round(streamSettings.frameRate)} />
          )}
          <StatsBadge label={'Track'} value={screenStream.getVideoTracks().length > 0 ? 'Active' : 'None'} color="#6DBF7E" />
        </div>
      )}
    </div>
  );
}

function WatchTogetherMode({ user, party, members, onSyncEvent, syncEvent, remoteStreams }) {
  var isHost = party && user && party.host_id === user.id;
  var [videoUrl, setVideoUrl] = useState(party?.video_url || '');
  var [inputUrl, setInputUrl] = useState('');
  var [seekValue, setSeekValue] = useState(0);
  var [duration, setDuration] = useState(0);
  var [playing, setPlaying] = useState(false);
  var [syncDrift, setSyncDrift] = useState(0);
  var videoRef = useRef(null);
  var lastSyncTsRef = useRef(null);

  useEffect(function() {
    if (party?.video_url) setVideoUrl(party.video_url);
  }, [party?.video_url]);

  useEffect(function() {
    if (!syncEvent) return;
    lastSyncTsRef.current = syncEvent.ts || Date.now();
    var vid = videoRef.current;
    if (syncEvent.type === 'play') {
      setPlaying(true);
      if (vid) vid.play().catch(function() {});
    } else if (syncEvent.type === 'pause') {
      setPlaying(false);
      if (vid) vid.pause();
    } else if (syncEvent.type === 'seek') {
      var targetTime = syncEvent.payload?.time || 0;
      if (vid) vid.currentTime = targetTime;
      setSeekValue(targetTime);
    } else if (syncEvent.type === 'syncAll') {
      var syncTime = syncEvent.payload?.time || 0;
      if (vid) {
        vid.currentTime = syncTime;
        vid.play().catch(function() {});
      }
      setPlaying(true);
    }
    if (syncEvent.ts) {
      setSyncDrift(Date.now() - syncEvent.ts);
    }
  }, [syncEvent]);

  useEffect(function() {
    if (!videoRef.current) return;
    var iv = setInterval(function() {
      if (videoRef.current && !videoRef.current.paused) {
        setSeekValue(videoRef.current.currentTime);
      }
      if (lastSyncTsRef.current) {
        setSyncDrift(Date.now() - lastSyncTsRef.current);
      }
    }, 500);
    return function() { clearInterval(iv); };
  }, []);

  var handlePlay = function() {
    if (!isHost) return;
    var t = videoRef.current?.currentTime || 0;
    setPlaying(true);
    if (videoRef.current) videoRef.current.play().catch(function() {});
    onSyncEvent && onSyncEvent('play', { time: t });
  };

  var handlePause = function() {
    if (!isHost) return;
    var t = videoRef.current?.currentTime || 0;
    setPlaying(false);
    if (videoRef.current) videoRef.current.pause();
    onSyncEvent && onSyncEvent('pause', { time: t });
  };

  var handleSeek = function(e) {
    var t = parseFloat(e.target.value);
    setSeekValue(t);
    if (videoRef.current) videoRef.current.currentTime = t;
    if (isHost) onSyncEvent && onSyncEvent('seek', { time: t });
  };

  var handleSyncAll = function() {
    if (!isHost) return;
    var t = videoRef.current?.currentTime || 0;
    onSyncEvent && onSyncEvent('syncAll', { time: t });
  };

  var handleResync = function() {
    if (!syncEvent?.payload?.time) return;
    var target = syncEvent.payload.time;
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      videoRef.current.play().catch(function() {});
    }
    setPlaying(true);
  };

  var handleSetVideo = function() {
    if (!isHost || !inputUrl.trim()) return;
    setVideoUrl(inputUrl.trim());
    setInputUrl('');
  };

  var synced = syncDrift < 500;
  var ytId = isYouTubeUrl(videoUrl) ? getYouTubeId(videoUrl) : null;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {isHost && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={inputUrl}
            onChange={function(e) { setInputUrl(e.target.value); }}
            placeholder="Paste YouTube or video URL"
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'rgba(8,11,24,0.85)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 12,
              fontFamily: 'Barlow Condensed, sans-serif',
              outline: 'none',
            }}
          />
          <ActionButton onClick={handleSetVideo} disabled={!inputUrl.trim()}>
            Set Video
          </ActionButton>
        </div>
      )}

      <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden' }}>
        {videoUrl ? (
          ytId ? (
            <iframe
              src={'https://www.youtube.com/embed/' + ytId + '?autoplay=0&controls=' + (isHost ? '1' : '0')}
              style={{ width: '100%', aspectRatio: '16/9', display: 'block', border: 'none', background: '#000' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Watch Together"
            />
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              controls={false}
              style={{ width: '100%', aspectRatio: '16/9', display: 'block', background: '#000', objectFit: 'contain' }}
              onLoadedMetadata={function(e) { setDuration(e.target.duration); }}
              onPlay={function() { setPlaying(true); }}
              onPause={function() { setPlaying(false); }}
              onTimeUpdate={function(e) { setSeekValue(e.target.currentTime); }}
            />
          )
        ) : (
          <VideoPlaceholder
            icon={<Play style={{ width: 48, height: 48 }} />}
            text={isHost ? 'Paste a URL above to start' : 'Waiting for host to set a video'}
          />
        )}
      </div>

      {remoteStreams && remoteStreams.size > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0' }}>
          {Array.from(remoteStreams.entries()).map(function(entry) {
            var peerId = entry[0], stream = entry[1];
            return <RemoteTile key={peerId} peerId={peerId} stream={stream} members={members} />;
          })}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {!isYouTubeUrl(videoUrl) && videoUrl && isHost && (
            <>
              <ActionButton onClick={handlePlay} disabled={playing}>
                <Play style={{ width: 12, height: 12 }} /> Play
              </ActionButton>
              <ActionButton onClick={handlePause} disabled={!playing}>
                <Pause style={{ width: 12, height: 12 }} /> Pause
              </ActionButton>
              <ActionButton onClick={handleSyncAll} style={{ background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.3)', color: '#6DBF7E' }}>
                <RefreshCw style={{ width: 12, height: 12 }} /> Sync All
              </ActionButton>
            </>
          )}
          {!isHost && syncEvent && (
            <ActionButton onClick={handleResync} style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
              <RefreshCw style={{ width: 12, height: 12 }} /> Resync
            </ActionButton>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {syncEvent && (
            synced ? (
              <StatsBadge label="SYNCED ✓" color="#6DBF7E" />
            ) : (
              <StatsBadge label="DRIFTED" color="#D4AF37" value={Math.round(syncDrift / 1000) + 's'} />
            )
          )}
          {isHost && (
            <StatsBadge label="Host" color="#D4AF37" />
          )}
        </div>
      </div>

      {!isYouTubeUrl(videoUrl) && videoUrl && duration > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.5}
            value={seekValue}
            onChange={handleSeek}
            disabled={!isHost}
            style={{
              width: '100%',
              accentColor: '#D4AF37',
              cursor: isHost ? 'pointer' : 'default',
              opacity: isHost ? 1 : 0.5,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <span>{formatTime(seekValue)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {syncEvent && !synced && (
        <div style={{
          padding: '6px 10px',
          borderRadius: 8,
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.2)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'Barlow Condensed, sans-serif',
        }}>
          Drift: ±{syncDrift}ms from host
        </div>
      )}
    </div>
  );
}

function FourKRoomMode({ user, party, members, remoteStreams }) {
  var [localStream, setLocalStream] = useState(null);
  var [error, setError] = useState(null);
  var [streamSettings, setStreamSettings] = useState(null);
  var [mirrored, setMirrored] = useState(true);
  var videoRef = useRef(null);

  useEffect(function() {
    if (videoRef.current) videoRef.current.srcObject = localStream || null;
  }, [localStream]);

  var refreshSettings = useCallback(function(stream) {
    var track = stream && stream.getVideoTracks && stream.getVideoTracks()[0];
    if (track) setStreamSettings(track.getSettings());
  }, []);

  var startCamera = async function() {
    setError(null);
    var prefCam = null, prefMic = null;
    try { prefCam = localStorage.getItem('swl_pref_cam'); prefMic = localStorage.getItem('swl_pref_mic'); } catch {}
    try {
      var stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 },
          ...(prefCam ? { deviceId: { ideal: prefCam } } : {}),
        },
        audio: prefMic ? { echoCancellation: true, noiseSuppression: true, deviceId: { ideal: prefMic } } : { echoCancellation: true, noiseSuppression: true },
      });
      stream.getVideoTracks()[0].onended = function() { setLocalStream(null); setStreamSettings(null); };
      setLocalStream(stream);
      refreshSettings(stream);
    } catch (e) {
      setError('Camera access blocked. Please allow camera access.');
    }
  };

  var stopCamera = function() {
    if (localStream) {
      localStream.getTracks().forEach(function(t) { t.stop(); });
      setLocalStream(null);
      setStreamSettings(null);
    }
  };

  var apply4K = async function() {
    if (!localStream) return;
    var track = localStream.getVideoTracks && localStream.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 30 } });
      refreshSettings(localStream);
    } catch (e) {}
  };

  var qualityLabel = function() {
    if (!streamSettings) return null;
    var w = streamSettings.width || 0;
    if (w >= 3840) return { label: '4K ✓', color: '#6DBF7E' };
    if (w >= 1280) return { label: 'HD', color: '#D4AF37' };
    return { label: 'SD', color: 'rgba(255,255,255,0.3)' };
  };

  var qual = qualityLabel();
  var remoteList = remoteStreams ? Array.from(remoteStreams.entries()) : [];

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden' }}>
        {localStream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', aspectRatio: '16/9', display: 'block', background: '#000', objectFit: 'cover', transform: mirrored ? 'scaleX(-1)' : 'none', transition: 'transform 0.2s' }}
          />
        ) : (
          <VideoPlaceholder
            icon={<Camera style={{ width: 48, height: 48 }} />}
            text="Enable Camera for 4K Room"
          />
        )}
        {qual && localStream && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <StatsBadge label={qual.label} color={qual.color} />
          </div>
        )}
      </div>

      {error && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: 'rgba(128,0,32,0.2)',
          border: '1px solid rgba(128,0,32,0.4)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 12,
          fontFamily: 'Barlow Condensed, sans-serif',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {!localStream ? (
          <ActionButton onClick={startCamera}>
            <Camera style={{ width: 14, height: 14 }} /> Start Camera
          </ActionButton>
        ) : (
          <>
            <ActionButton
              onClick={stopCamera}
              style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.35)', color: '#C0392B' }}
            >
              Stop Camera
            </ActionButton>
            <ActionButton
              onClick={apply4K}
              style={{ background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.3)', color: '#6DBF7E' }}
            >
              Apply 4K
            </ActionButton>
            <ActionButton
              onClick={function() { setMirrored(function(v) { return !v; }); }}
              style={{ background: mirrored ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', border: mirrored ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)', color: mirrored ? '#D4AF37' : 'rgba(255,255,255,0.5)' }}
            >
              Mirror {mirrored ? 'On' : 'Off'}
            </ActionButton>
          </>
        )}
        {streamSettings && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <StatsBadge label={'Res'} value={streamSettings.width + 'x' + streamSettings.height} />
            {streamSettings.frameRate && (
              <StatsBadge label={'FPS'} value={Math.round(streamSettings.frameRate)} />
            )}
          </div>
        )}
      </div>

      {remoteList.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
            Remote Feeds
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 120px)', gap: 8 }}>
            {remoteList.map(function(entry) {
              var peerId = entry[0];
              var stream = entry[1];
              return (
                <RemoteTile key={peerId} peerId={peerId} stream={stream} members={members} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RemoteTile({ peerId, stream, members }) {
  var videoRef = useRef(null);
  var member = members && members.find(function(m) { return String(m.user_id) === String(peerId); });

  useEffect(function() {
    if (videoRef.current) videoRef.current.srcObject = stream || null;
  }, [stream]);

  return (
    <div style={{ width: 120, position: 'relative' }}>
      <div style={{
        width: 120,
        height: 120,
        clipPath: OCT,
        background: 'rgba(212,175,55,0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 2,
          clipPath: OCT,
          background: '#080B18',
          overflow: 'hidden',
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: stream ? 'block' : 'none' }}
          />
          {!stream && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>
              {member ? member.user_name?.charAt(0)?.toUpperCase() || '?' : '?'}
            </div>
          )}
        </div>
      </div>
      {member && (
        <div style={{ marginTop: 4, fontSize: 11, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif', truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {member.user_name}
        </div>
      )}
    </div>
  );
}

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  var m = Math.floor(secs / 60);
  var s = Math.floor(secs % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

export default function WatchPartyTab({ roomId, user, party, members, onSyncEvent, syncEvent, remoteStreams }) {
  var [activeTab, setActiveTab] = useState('screen');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: '#080B18',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid rgba(212,175,55,0.1)',
      fontFamily: 'Barlow Condensed, sans-serif',
    }}>
      <TabStrip activeTab={activeTab} onTabChange={setActiveTab} />

      <div style={{ overflowY: 'auto', maxHeight: 600 }}>
        {activeTab === 'screen' && (
          <ScreenShareMode user={user} party={party} />
        )}
        {activeTab === 'watch' && (
          <WatchTogetherMode
            user={user}
            party={party}
            members={members}
            onSyncEvent={onSyncEvent}
            syncEvent={syncEvent}
              remoteStreams={remoteStreams}
          />
        )}
        {activeTab === '4k' && (
          <FourKRoomMode
            user={user}
            party={party}
            members={members}
            remoteStreams={remoteStreams}
          />
        )}
      </div>
    </div>
  );
}
