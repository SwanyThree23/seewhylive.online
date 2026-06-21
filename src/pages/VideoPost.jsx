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

const GOLD = '#D4AF37';

const MAX_DURATION_SECONDS = 600; // 10 minutes

export default function VideoPost() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);

  useEffect(() => () => { if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current); }, []);

  const [step, setStep] = useState('upload'); // upload | details | published
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
    isPrivate: false,
    isPaywalled: false,
    paywallPrice: '4.99',
    thumbnail: '',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  const roomId = new URLSearchParams(window.location.search).get('room_id');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
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
    const url = URL.createObjectURL(file);
    videoUrlRef.current = url;
    setSelectedFile(file);
    setVideoUrl(url);
    setForm(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
  };

  const handleVideoLoad = () => {
    const duration = videoRef.current?.duration || 0;
    setVideoDuration(Math.round(duration));
    if (duration > MAX_DURATION_SECONDS) {
      toast.error(`Video must be ${MAX_DURATION_SECONDS / 60} minutes or less. Your video is ${Math.round(duration / 60)} minutes.`);
      setSelectedFile(null);
      setVideoUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!form.title.trim()) { toast.error('Add a title'); return; }
    if (videoDuration > MAX_DURATION_SECONDS) { toast.error('Video too long'); return; }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 15, 85));
      }, 400);

      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Save as a room of type "video"
      const post = await base44.entities.Room.create({
        title: form.title,
        description: form.description,
        host_id: user?.id,
        type: 'video',
        status: 'ended',
        is_public: !form.isPrivate,
        recording_url: file_url,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });

      const postUrl = `${window.location.origin}${createPageUrl('Room')}?id=${post.id}`;
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

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#080B18] to-[#080B18] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <button style={{ padding:'6px 12px', borderRadius:8, background:'transparent', border:'none', color:'rgba(255,255,255,0.6)', fontSize:13, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif' }}>← Back</button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Video className="w-6 h-6 text-[#d4af37]" />
              Post a Video
            </h1>
            <p className="text-white/40 text-sm">Short-form videos up to 10 minutes</p>
          </div>
        </div>

        {step === 'upload' && (
          <div className="space-y-5">
            {/* Drop zone */}
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#d4af37]/30 rounded-2xl p-12 text-center cursor-pointer hover:border-[#d4af37]/60 hover:bg-[#d4af37]/5 transition-all"
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-[#d4af37]/50" />
                <p className="text-white font-semibold mb-1">Click to select video</p>
                <p className="text-white/40 text-sm">MP4, MOV, WebM • Max 10 min • Max 500MB</p>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:12, fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(212,175,55,0.1)', color:'#D4AF37', border:'1px solid rgba(212,175,55,0.3)' }}>
                  <Clock className="w-3 h-3" /> 10 min max
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    onLoadedMetadata={handleVideoLoad}
                  />
                  <button
                    onClick={() => { setSelectedFile(null); setVideoUrl(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center hover:bg-black"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  {videoDuration > 0 && (
                    <span style={{ position:'absolute', bottom:8, right:8, display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(0,0,0,0.7)', color:'#fff', border:'none' }}>
                      <Clock className="w-3 h-3" />
                      {formatDuration(videoDuration)} / {formatDuration(MAX_DURATION_SECONDS)}
                    </span>
                  )}
                </div>

                {/* Duration warning */}
                {videoDuration > 0 && (
                  <div style={{ height:6, borderRadius:4, background: videoDuration > MAX_DURATION_SECONDS ? 'rgba(127,29,29,0.5)' : 'rgba(255,255,255,0.08)' }}>
                    <div style={{ height:'100%', width:`${Math.min((videoDuration / MAX_DURATION_SECONDS) * 100, 100)}%`, background:'#D4AF37', borderRadius:4 }} />
                  </div>
                )}

                {/* Form */}
                <div className="space-y-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(212,175,55,0.1)] rounded-xl p-5">
                  <input
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Video title *"
                    style={{ width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }}
                  />
                  <textarea
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description (optional)"
                    rows={3}
                    style={{ width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif', resize:'none', height:80 }}
                  />
                  <input
                    value={form.tags}
                    onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Tags (comma-separated)"
                    style={{ width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }}
                  />

                  {/* Privacy & Paywall */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setForm(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                        form.isPrivate ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      {form.isPrivate ? <Lock className="w-4 h-4 text-[#d4af37]" /> : <Globe className="w-4 h-4 text-white/50" />}
                      <div className="text-left">
                        <p className="text-xs font-semibold text-white">{form.isPrivate ? 'Private' : 'Public'}</p>
                        <p className="text-[10px] text-white/40">{form.isPrivate ? 'Only you' : 'Everyone'}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setForm(prev => ({ ...prev, isPaywalled: !prev.isPaywalled }))}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                        form.isPaywalled ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <span className="text-lg">{form.isPaywalled ? '💰' : '🆓'}</span>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-white">{form.isPaywalled ? 'Paywall' : 'Free'}</p>
                        <p className="text-[10px] text-white/40">{form.isPaywalled ? `$${form.paywallPrice}` : 'Open access'}</p>
                      </div>
                    </button>
                  </div>

                  {form.isPaywalled && (
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm">$</span>
                      <input
                        value={form.paywallPrice}
                        onChange={e => setForm(prev => ({ ...prev, paywallPrice: e.target.value }))}
                        placeholder="Price"
                        type="number"
                        min="0.99"
                        step="0.50"
                        style={{ width:112, padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }}
                      />
                      <span className="text-white/40 text-xs">per view</span>
                    </div>
                  )}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/50 text-center">Uploading... {uploadProgress}%</p>
                    <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.08)' }}>
                      <div style={{ height:'100%', width:`${uploadProgress}%`, background:GOLD, borderRadius:4 }} />
                    </div>
                  </div>
                )}

                <button
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'14px 20px', borderRadius:8, background:GOLD, color:'#000', border:'none', fontSize:15, fontWeight:900, cursor: (uploading || videoDuration > MAX_DURATION_SECONDS || !form.title.trim()) ? 'not-allowed' : 'pointer', opacity: (uploading || videoDuration > MAX_DURATION_SECONDS || !form.title.trim()) ? 0.5 : 1, fontFamily:'Barlow Condensed, sans-serif' }}
                  onClick={handleUpload}
                  disabled={uploading || videoDuration > MAX_DURATION_SECONDS || !form.title.trim()}
                >
                  <Video className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Post Video'}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'published' && (
          <div className="text-center py-12 space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#0F1428]/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-[#6DBF7E]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Video Posted! 🎉</h2>
              <p className="text-white/40">Your video is now live</p>
            </div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'10px 16px', borderRadius:8, background:GOLD, color:'#000', border:'none', fontSize:14, fontWeight:900, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif' }}
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="w-4 h-4" />
                Share to Instagram, TikTok &amp; more
              </button>
              <div className="flex justify-center">
                <ShareButtons url={publishedUrl} title={`Watch my video: ${form.title}`} />
              </div>
              <Link to={createPageUrl('Home')}>
                <button style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', padding:'10px 16px', borderRadius:8, background:'transparent', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.15)', fontSize:14, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif' }}>
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        url={publishedUrl}
        title={form.title}
      />

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <VODCard vod={null} onEdit={() => {}} onTrim={() => {}} onChapters={() => {}} onPublish={() => {}} />
        <ClipCreatorSheet roomId={roomId} sessionId={roomId} creatorId={user?.id} elapsedSeconds={0} roomTitle="" onClose={() => {}} />
        <ContentRecommendations />
        <MilestoneAlerts userId={user?.id} roomId={roomId} />
        <SwanAIRecommendations roomId={roomId} currentLayout="default" viewerCount={0} />
        <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
        <DiscussionFeed communityId="video-posts" />
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
        <OnlineUsersGrid compact maxVisible={10} />
        <CollaborationMatcher />
        <AnnouncementPanel communityId={userCommunityId} userId={user?.id} />
        <StreamGoals isHost={false} />
      </div>
    </div>
  );
}