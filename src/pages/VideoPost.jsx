import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Upload, Video, Clock, Lock, Globe, Tag, Play, Share2, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ShareModal from '../components/live/ShareModal';

const MAX_DURATION_SECONDS = 600; // 10 minutes

export default function VideoPost() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

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

    const url = URL.createObjectURL(file);
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
    <div className="min-h-screen bg-gradient-to-br from-[#0d0618] to-[#1a0a30] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">← Back</Button>
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
                <Badge className="mt-3 bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30">
                  <Clock className="w-3 h-3 mr-1" /> 10 min max
                </Badge>
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
                    <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-0">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(videoDuration)} / {formatDuration(MAX_DURATION_SECONDS)}
                    </Badge>
                  )}
                </div>

                {/* Duration warning */}
                {videoDuration > 0 && (
                  <Progress
                    value={(videoDuration / MAX_DURATION_SECONDS) * 100}
                    className={`h-1.5 ${videoDuration > MAX_DURATION_SECONDS ? 'bg-red-900' : 'bg-white/10'}`}
                  />
                )}

                {/* Form */}
                <div className="space-y-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(212,175,55,0.1)] rounded-xl p-5">
                  <Input
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Video title *"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <Textarea
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description (optional)"
                    rows={3}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                  />
                  <Input
                    value={form.tags}
                    onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Tags (comma-separated)"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
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
                      <Input
                        value={form.paywallPrice}
                        onChange={e => setForm(prev => ({ ...prev, paywallPrice: e.target.value }))}
                        placeholder="Price"
                        type="number"
                        min="0.99"
                        step="0.50"
                        className="bg-white/5 border-white/10 text-white w-28"
                      />
                      <span className="text-white/40 text-xs">per view</span>
                    </div>
                  )}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/50 text-center">Uploading... {uploadProgress}%</p>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <Button
                  className="w-full bg-[#d4af37] text-black hover:bg-[#f5e6a3] font-bold py-5"
                  onClick={handleUpload}
                  disabled={uploading || videoDuration > MAX_DURATION_SECONDS || !form.title.trim()}
                >
                  <Video className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Post Video'}
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'published' && (
          <div className="text-center py-12 space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Video Posted! 🎉</h2>
              <p className="text-white/40">Your video is now live</p>
            </div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button
                className="bg-[#d4af37] text-black hover:bg-[#f5e6a3]"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share to Instagram, TikTok & more
              </Button>
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost" className="w-full text-white/60 hover:text-white">
                  Back to Home
                </Button>
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
    </div>
  );
}