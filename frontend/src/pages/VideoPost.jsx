import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Upload, Video, Clock, Lock, Globe, Tag, Play, Share2, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ShareModal from '../components/live/ShareModal';
import ShareButtons from '../components/shared/ShareButtons';
import SpotlightBanner from '../components/community/SpotlightBanner';
import DiscussionFeed from '../components/community/DiscussionFeed';
import VODCard from '../components/vod/VODCard';
import ClipCreatorSheet from '../components/live/ClipCreatorSheet';
import ContentRecommendations from '../components/social/ContentRecommendations';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import StreamGoals from '../components/live/StreamGoals';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';

var GOLD = '#D4AF37';

var MAX_DURATION_SECONDS = 600; // 10 minutes

export default function VideoPost() {
  var fileInputRef  = useRef(null);
  var videoRef      = useRef(null);
  var videoUrlRef   = useRef(null);

  useEffect(function() {
    return function() { if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current); };
  }, []);

  var stepState = useState('upload');
  var step    = stepState[0];
  var setStep = stepState[1];
  var selectedFileState = useState(null);
  var selectedFile    = selectedFileState[0];
  var setSelectedFile = selectedFileState[1];
  var videoUrlState = useState(null);
  var videoUrl    = videoUrlState[0];
  var setVideoUrl = videoUrlState[1];
  var videoDurationState = useState(0);
  var videoDuration    = videoDurationState[0];
  var setVideoDuration = videoDurationState[1];
  var uploadingState = useState(false);
  var uploading    = uploadingState[0];
  var setUploading = uploadingState[1];
  var uploadProgressState = useState(0);
  var uploadProgress    = uploadProgressState[0];
  var setUploadProgress = uploadProgressState[1];
  var shareOpenState = useState(false);
  var shareOpen    = shareOpenState[0];
  var setShareOpen = shareOpenState[1];
  var publishedUrlState = useState('');
  var publishedUrl    = publishedUrlState[0];
  var setPublishedUrl = publishedUrlState[1];

  var formState = useState({
    title: '',
    description: '',
    tags: '',
    isPrivate: false,
    isPaywalled: false,
    paywallPrice: '4.99',
    thumbnail: '',
  });
  var form    = formState[0];
  var setForm = formState[1];

  var userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });
  var user = userQuery.data;

  var activeRoomQuery = useQuery({
    queryKey: ['activeRoom', user && user.id],
    queryFn: function() { return base44.entities.Room.filter({ host_id: user && user.id, status: 'live' }).then(function(r) { return r[0] || null; }); },
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoom   = activeRoomQuery.data;
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var roomId       = activeRoomId;

  var userCommunityQuery = useQuery({
    queryKey: ['userCommunity', user && user.id],
    queryFn: function() { return base44.entities.Community.filter({ owner_id: user && user.id }).then(function(r) { return r[0] || null; }); },
    enabled: !!(user && user.id),
  });
  var userCommunity   = userCommunityQuery.data;
  var userCommunityId = (userCommunity && userCommunity.id) || null;

  var handleFileSelect = function(e) {
    var file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error('Video must be under 500MB');
      return;
    }

    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    var url = URL.createObjectURL(file);
    videoUrlRef.current = url;
    setSelectedFile(file);
    setVideoUrl(url);
    setForm(function(prev) { return Object.assign({}, prev, { title: file.name.replace(/\.[^/.]+$/, '') }); });
  };

  var handleVideoLoad = function() {
    var dur = (videoRef.current && videoRef.current.duration) || 0;
    setVideoDuration(Math.round(dur));
    if (dur > MAX_DURATION_SECONDS) {
      toast.error('Video must be ' + (MAX_DURATION_SECONDS / 60) + ' minutes or less. Your video is ' + Math.round(dur / 60) + ' minutes.');
      setSelectedFile(null);
      setVideoUrl(null);
    }
  };

  var handleUpload = async function() {
    if (!selectedFile) return;
    if (!form.title.trim()) { toast.error('Add a title'); return; }
    if (videoDuration > MAX_DURATION_SECONDS) { toast.error('Video too long'); return; }

    setUploading(true);
    setUploadProgress(10);

    try {
      var progressInterval = setInterval(function() {
        setUploadProgress(function(p) { return Math.min(p + 15, 85); });
      }, 400);

      var uploadResult = await base44.integrations.Core.UploadFile({ file: selectedFile });
      var fileUrl = uploadResult.file_url;
      clearInterval(progressInterval);
      setUploadProgress(100);

      var post = await base44.entities.Room.create({
        title: form.title,
        description: form.description,
        host_id: user && user.id,
        type: 'video',
        status: 'ended',
        is_public: !form.isPrivate,
        recording_url: fileUrl,
        tags: form.tags ? form.tags.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [],
      });

      var postUrl = window.location.origin + createPageUrl('Room') + '?id=' + post.id;
      setPublishedUrl(postUrl);
      setStep('published');
      toast.success('Video posted!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  var formatDuration = function(s) {
    var m   = Math.floor(s / 60);
    var sec = s % 60;
    return m + ':' + String(sec).padStart(2, '0');
  };

  var inputStyle = {
    width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff',
    fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif',
  };

  var isSubmitDisabled = uploading || videoDuration > MAX_DURATION_SECONDS || !form.title.trim();

  return (
    <div style={{ minHeight: '100vh', background: '#080B18', padding: '32px 16px' }}>
      <div style={{ maxWidth: 672, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to={createPageUrl('Home')}>
            <button style={{ padding: '6px 12px', borderRadius: 8, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}>← Back</button>
          </Link>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Video style={{ width: 24, height: 24, color: '#d4af37' }} />
              Post a Video
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>Short-form videos up to 10 minutes</p>
          </div>
        </div>

        {step === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Drop zone */}
            {!selectedFile ? (
              <div
                onClick={function() { if (fileInputRef.current) fileInputRef.current.click(); }}
                style={{ border: '2px dashed rgba(212,175,55,0.3)', borderRadius: 24, padding: '48px 16px', textAlign: 'center', cursor: 'pointer' }}
              >
                <Upload style={{ width: 48, height: 48, display: 'block', margin: '0 auto 16px', color: 'rgba(212,175,55,0.5)' }} />
                <p style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>Click to select video</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>MP4, MOV, WebM • Max 10 min • Max 500MB</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <Clock style={{ width: 12, height: 12 }} /> 10 min max
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Preview */}
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onLoadedMetadata={handleVideoLoad}
                  />
                  <button
                    onClick={function() { setSelectedFile(null); setVideoUrl(null); }}
                    style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                  >
                    <X style={{ width: 16, height: 16, color: '#fff' }} />
                  </button>
                  {videoDuration > 0 && (
                    <span style={{ position: 'absolute', bottom: 8, right: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none' }}>
                      <Clock style={{ width: 12, height: 12 }} />
                      {formatDuration(videoDuration)} / {formatDuration(MAX_DURATION_SECONDS)}
                    </span>
                  )}
                </div>

                {/* Duration progress */}
                {videoDuration > 0 && (
                  <div style={{ height: 6, borderRadius: 4, background: videoDuration > MAX_DURATION_SECONDS ? 'rgba(127,29,29,0.5)' : 'rgba(255,255,255,0.08)' }}>
                    <div style={{ height: '100%', width: (Math.min((videoDuration / MAX_DURATION_SECONDS) * 100, 100)) + '%', background: '#D4AF37', borderRadius: 4 }} />
                  </div>
                )}

                {/* Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 12, padding: 20 }}>
                  <input
                    value={form.title}
                    onChange={function(e) { setForm(function(prev) { return Object.assign({}, prev, { title: e.target.value }); }); }}
                    placeholder="Video title *"
                    style={inputStyle}
                  />
                  <textarea
                    value={form.description}
                    onChange={function(e) { setForm(function(prev) { return Object.assign({}, prev, { description: e.target.value }); }); }}
                    placeholder="Description (optional)"
                    rows={3}
                    style={Object.assign({}, inputStyle, { resize: 'none', height: 80 })}
                  />
                  <input
                    value={form.tags}
                    onChange={function(e) { setForm(function(prev) { return Object.assign({}, prev, { tags: e.target.value }); }); }}
                    placeholder="Tags (comma-separated)"
                    style={inputStyle}
                  />

                  {/* Privacy & Paywall */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button
                      onClick={function() { setForm(function(prev) { return Object.assign({}, prev, { isPrivate: !prev.isPrivate }); }); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, cursor: 'pointer', border: form.isPrivate ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.1)', background: form.isPrivate ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)' }}
                    >
                      {form.isPrivate
                        ? <Lock style={{ width: 16, height: 16, color: '#d4af37' }} />
                        : <Globe style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.5)' }} />
                      }
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0 }}>{form.isPrivate ? 'Private' : 'Public'}</p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{form.isPrivate ? 'Only you' : 'Everyone'}</p>
                      </div>
                    </button>

                    <button
                      onClick={function() { setForm(function(prev) { return Object.assign({}, prev, { isPaywalled: !prev.isPaywalled }); }); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, cursor: 'pointer', border: form.isPaywalled ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.1)', background: form.isPaywalled ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)' }}
                    >
                      <span style={{ fontSize: 18 }}>{form.isPaywalled ? '💰' : '🆓'}</span>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0 }}>{form.isPaywalled ? 'Paywall' : 'Free'}</p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{form.isPaywalled ? '$' + form.paywallPrice : 'Open access'}</p>
                      </div>
                    </button>
                  </div>

                  {form.isPaywalled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>$</span>
                      <input
                        value={form.paywallPrice}
                        onChange={function(e) { setForm(function(prev) { return Object.assign({}, prev, { paywallPrice: e.target.value }); }); }}
                        placeholder="Price"
                        type="number"
                        min="0.99"
                        step="0.50"
                        style={Object.assign({}, inputStyle, { width: 112 })}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>per view</span>
                    </div>
                  )}
                </div>

                {uploading && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 }}>Uploading... {uploadProgress}%</p>
                    <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }}>
                      <div style={{ height: '100%', width: uploadProgress + '%', background: GOLD, borderRadius: 4 }} />
                    </div>
                  </div>
                )}

                <button
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 20px', borderRadius: 8, background: GOLD, color: '#000', border: 'none', fontSize: 15, fontWeight: 900, cursor: isSubmitDisabled ? 'not-allowed' : 'pointer', opacity: isSubmitDisabled ? 0.5 : 1, fontFamily: 'Barlow Condensed, sans-serif' }}
                  onClick={handleUpload}
                  disabled={isSubmitDisabled}
                >
                  <Video style={{ width: 16, height: 16 }} />
                  {uploading ? 'Uploading...' : 'Post Video'}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'published' && (
          <div style={{ textAlign: 'center', padding: '48px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(15,20,40,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <CheckCircle style={{ width: 40, height: 40, color: '#6DBF7E' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Video Posted! 🎉</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Your video is now live</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
              <button
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 16px', borderRadius: 8, background: GOLD, color: '#000', border: 'none', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
                onClick={function() { setShareOpen(true); }}
              >
                <Share2 style={{ width: 16, height: 16 }} />
                Share to Instagram, TikTok &amp; more
              </button>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ShareButtons url={publishedUrl} title={'Watch my video: ' + form.title} />
              </div>
              <Link to={createPageUrl('Home')}>
                <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px 16px', borderRadius: 8, background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 14, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={function() { setShareOpen(false); }}
        url={publishedUrl}
        title={form.title}
      />

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <VODCard vod={null} onEdit={function() {}} onTrim={function() {}} onChapters={function() {}} onPublish={function() {}} />
        <ClipCreatorSheet roomId={roomId} sessionId={roomId} creatorId={user && user.id} elapsedSeconds={0} roomTitle="" onClose={function() {}} />
        <ContentRecommendations />
        <MilestoneAlerts userId={user && user.id} roomId={roomId} />
        <SwanAIRecommendations roomId={roomId} currentLayout="default" viewerCount={0} />
        <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
        <DiscussionFeed communityId="video-posts" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px 24px' }}>
        <OnlineUsersGrid compact maxVisible={10} />
        <CollaborationMatcher />
        <AnnouncementPanel communityId={userCommunityId} userId={user && user.id} />
        <StreamGoals isHost={false} />
      </div>
    </div>
  );
}
