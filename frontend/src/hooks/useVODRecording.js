import { useState, useRef, useCallback, useEffect } from 'react';

export function formatDuration(sec) {
  var s  = Math.floor(sec || 0);
  var h  = Math.floor(s / 3600);
  var m  = Math.floor((s % 3600) / 60);
  var ss = s % 60;
  var mm  = (m < 10 && h > 0) ? '0' + m : String(m);
  var sss = ss < 10 ? '0' + ss : String(ss);
  if (h > 0) return h + ':' + mm + ':' + sss;
  return m + ':' + sss;
}

export function useVODRecording(opts) {
  var streamId  = (opts && opts.streamId)  || '';
  var creatorId = (opts && opts.creatorId) || '';
  var title     = (opts && opts.title)     || 'Live Recording';

  var rs = useState(false);  var recording = rs[0]; var setRecording = rs[1];
  var vs = useState('');     var vodId = vs[0];     var setVodId = vs[1];
  var ds = useState(0);      var duration = ds[0];  var setDuration = ds[1];
  var ps = useState('');     var playbackUrl = ps[0]; var setPlaybackUrl = ps[1];
  var es = useState(null);   var error = es[0];     var setError = es[1];

  var tickerRef  = useRef(null);
  var startTsRef = useRef(0);
  var idRef      = useRef('');

  function startTicker() {
    startTsRef.current = Date.now();
    setDuration(0);
    tickerRef.current = setInterval(function() {
      setDuration(Math.floor((Date.now() - startTsRef.current) / 1000));
    }, 1000);
  }

  function stopTicker() {
    clearInterval(tickerRef.current);
    tickerRef.current = null;
  }

  useEffect(function() { return function() { stopTicker(); }; }, []);

  var startRecording = useCallback(function() {
    if (recording) return;
    if (!streamId)  { setError('streamId is required');  return; }
    if (!creatorId) { setError('creatorId is required'); return; }
    setError(null);
    fetch('/api/vod/start', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ stream_id: streamId, creator_id: creatorId, title: title }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.id) {
          idRef.current = data.id;
          setVodId(data.id);
          setRecording(true);
          startTicker();
        } else {
          setError((data && data.error) || 'Failed to start recording');
        }
      })
      .catch(function(e) { setError(e.message || 'Network error'); });
  }, [recording, streamId, creatorId, title]);

  var stopRecording = useCallback(function() {
    if (!recording || !idRef.current) return;
    var elapsed = Math.floor((Date.now() - startTsRef.current) / 1000);
    stopTicker();
    setRecording(false);
    fetch('/api/vod/stop', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ vod_id: idRef.current, duration_seconds: elapsed }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.playback_url) setPlaybackUrl(data.playback_url);
        idRef.current = '';
        setVodId('');
      })
      .catch(function(e) { setError(e.message || 'Network error'); idRef.current = ''; setVodId(''); });
  }, [recording]);

  return { recording: recording, vodId: vodId, duration: duration,
           playbackUrl: playbackUrl, startRecording: startRecording,
           stopRecording: stopRecording, error: error };
}
