import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

var activeSession = null;

export function stopVirtualBackground() {
  if (activeSession) {
    activeSession.stop();
    activeSession = null;
  }
}

// mode: 'none' | 'blur' | 'image'
// imageUrl: required when mode === 'image'
export async function applyVirtualBackground(videoTrack, mode, imageUrl) {
  stopVirtualBackground();
  if (!videoTrack || mode === 'none') return videoTrack;

  var video = document.createElement('video');
  video.srcObject = new MediaStream([videoTrack]);
  video.muted = true;
  video.playsInline = true;
  await video.play();

  var settings = videoTrack.getSettings();
  var width = settings.width || 640;
  var height = settings.height || 480;

  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');

  var bgImage = null;
  if (mode === 'image' && imageUrl) {
    bgImage = new Image();
    bgImage.crossOrigin = 'anonymous';
    bgImage.src = imageUrl;
    await new Promise(function(resolve) {
      bgImage.onload = resolve;
      bgImage.onerror = resolve;
    });
  }

  var segmenter = new SelfieSegmentation({
    locateFile: function(file) {
      return 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/' + file;
    }
  });
  segmenter.setOptions({ modelSelection: 1 });

  var running = true;

  segmenter.onResults(function(results) {
    if (!running) return;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the person (masked)
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Draw the background behind the person
    ctx.globalCompositeOperation = 'destination-over';
    if (mode === 'blur') {
      ctx.filter = 'blur(12px)';
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    } else if (mode === 'image' && bgImage && bgImage.complete) {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
  });

  async function frameLoop() {
    if (!running) return;
    try {
      await segmenter.send({ image: video });
    } catch (e) {
      // swallow transient send errors during teardown
    }
    if (running) requestAnimationFrame(frameLoop);
  }
  frameLoop();

  var outStream = canvas.captureStream(30);
  var outTrack = outStream.getVideoTracks()[0];

  activeSession = {
    stop: function() {
      running = false;
      try { segmenter.close(); } catch (e) {}
      video.pause();
      video.srcObject = null;
      outTrack.stop();
    }
  };

  return outTrack;
}
