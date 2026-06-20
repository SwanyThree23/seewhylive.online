import { useState, useEffect, useRef, useCallback } from 'react';

var _cachedStream = null;
var _cachedConstraints = null;
var _pendingAcquire = null;

function constraintsMatch(a, b) {
  if (!a || !b) return false;
  if (a.audio !== b.audio) return false;
  var aVid = a.video === false ? false : (typeof a.video === 'object' ? (a.video.deviceId || true) : true);
  var bVid = b.video === false ? false : (typeof b.video === 'object' ? (b.video.deviceId || true) : true);
  return aVid === bVid;
}

function buildConstraints(audio, video) {
  return {
    audio: audio,
    video: video === false ? false
         : video === true  ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
         : video,
  };
}

function acquireStream(audio, video) {
  var constraints = buildConstraints(audio, video);
  if (_cachedStream && _cachedStream.active && constraintsMatch(_cachedConstraints, constraints)) {
    return Promise.resolve(_cachedStream);
  }
  if (_pendingAcquire) return _pendingAcquire;
  _pendingAcquire = (function() {
    if (_cachedStream) {
      _cachedStream.getTracks().forEach(function(t) { t.stop(); });
      _cachedStream = null;
    }
    return navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      _cachedStream = stream;
      _cachedConstraints = constraints;
      _pendingAcquire = null;
      return stream;
    }).catch(function(err) {
      _pendingAcquire = null;
      throw err;
    });
  })();
  return _pendingAcquire;
}

export function useLocalMedia(opts) {
  var audio = (opts && opts.audio !== undefined) ? opts.audio : true;
  var video = (opts && opts.video !== undefined) ? opts.video : true;

  var streamArr = useState(_cachedStream);
  var localStream = streamArr[0]; var setLocalStream = streamArr[1];
  var audioArr = useState(audio !== false);
  var audioEnabled = audioArr[0]; var setAudioEnabled = audioArr[1];
  var videoArr = useState(video !== false);
  var videoEnabled = videoArr[0]; var setVideoEnabled = videoArr[1];
  var errorArr = useState(null);
  var error = errorArr[0]; var setError = errorArr[1];
  var streamRef = useRef(_cachedStream);

  var videoDep = video === false ? 'off'
    : (typeof video === 'object' ? JSON.stringify(video) : 'on');

  useEffect(function() {
    var cancelled = false;
    var built = buildConstraints(audio, video);
    if (_cachedStream && _cachedStream.active && constraintsMatch(_cachedConstraints, built)) {
      streamRef.current = _cachedStream;
      setLocalStream(_cachedStream);
      return function() { cancelled = true; };
    }
    acquireStream(audio, video).then(function(stream) {
      if (cancelled) return;
      streamRef.current = stream;
      setLocalStream(stream);
      setError(null);
    }).catch(function(err) {
      if (!cancelled) setError(err.message || 'Camera / mic access denied');
    });
    return function() { cancelled = true; };
  }, [audio, videoDep]);

  var toggleAudio = useCallback(function() {
    var stream = streamRef.current;
    if (!stream) return;
    var next = !audioEnabled;
    stream.getAudioTracks().forEach(function(t) { t.enabled = next; });
    setAudioEnabled(next);
  }, [audioEnabled]);

  var toggleVideo = useCallback(function() {
    var stream = streamRef.current;
    if (!stream) return;
    var next = !videoEnabled;
    stream.getVideoTracks().forEach(function(t) { t.enabled = next; });
    setVideoEnabled(next);
  }, [videoEnabled]);

  var switchCamera = useCallback(function(deviceId) {
    setError(null);
    if (_cachedStream) {
      _cachedStream.getTracks().forEach(function(t) { t.stop(); });
      _cachedStream = null;
      _cachedConstraints = null;
    }
    return acquireStream(audio, { deviceId: { exact: deviceId } }).then(function(stream) {
      streamRef.current = stream;
      setLocalStream(stream);
    }).catch(function(err) {
      setError(err.message || 'Could not switch camera');
    });
  }, [audio]);

  return {
    localStream: localStream,
    audioEnabled: audioEnabled,
    videoEnabled: videoEnabled,
    toggleAudio: toggleAudio,
    toggleVideo: toggleVideo,
    switchCamera: switchCamera,
    error: error,
  };
}
