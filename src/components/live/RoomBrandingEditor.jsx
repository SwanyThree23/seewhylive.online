import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Type, Image as ImageIcon, Settings2, Eye } from 'lucide-react';

export default function RoomBrandingEditor({ roomData, onBrandingChange, isHost }) {
  const [open, setOpen] = useState(false);
  const [branding, setBranding] = useState({
    overlayColor: roomData?.overlay_color ?? '#800020',
    accentColor: roomData?.accent_color ?? '#d4af37',
    fontFamily: roomData?.font_family ?? 'Barlow Condensed',
    customTitle: roomData?.custom_title ?? '',
    customSubtitle: roomData?.custom_subtitle ?? '',
    backgroundUrl: roomData?.background_url ?? '',
    overlayOpacity: roomData?.overlay_opacity ?? 0.7,
    showViewerCount: roomData?.show_viewer_count ?? true,
    showChatBadges: roomData?.show_chat_badges ?? true,
    lowerthirdsTemplate: roomData?.lowerthirds_template ?? 'default',
  });

  const handleChange = (key, value) => {
    const updated = { ...branding, [key]: value };
    setBranding(updated);
  };

  const handleSave = () => {
    onBrandingChange?.(branding);
    setOpen(false);
  };

  if (!isHost) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs h-7 px-2 border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
      >
        <Palette className="w-3 h-3 mr-1" />
        Customize Room
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0A0710] border border-[#d4af37]/20 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Brand Your Room
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Color Customization */}
            <div className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#d4af37]" />
                Color Scheme
              </h3>

              <div className="space-y-3">
                <div>
                  <Label className="text-[10px] text-white/60 mb-1 block">Overlay Base Color</Label>
                  <div className="flex gap-2 items-center">
                    <div
                      className="w-10 h-10 rounded border border-[#d4af37]/30 cursor-pointer"
                      style={{ background: branding.overlayColor }}
                      onClick={() => document.getElementById('overlay-color').click()}
                    />
                    <input
                      id="overlay-color"
                      type="color"
                      value={branding.overlayColor}
                      onChange={(e) => handleChange('overlayColor', e.target.value)}
                      className="hidden"
                    />
                    <span className="text-xs text-white/50">{branding.overlayColor}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] text-white/60 mb-1 block">Accent Color (Buttons, Text)</Label>
                  <div className="flex gap-2 items-center">
                    <div
                      className="w-10 h-10 rounded border border-white/30 cursor-pointer"
                      style={{ background: branding.accentColor }}
                      onClick={() => document.getElementById('accent-color').click()}
                    />
                    <input
                      id="accent-color"
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => handleChange('accentColor', e.target.value)}
                      className="hidden"
                    />
                    <span className="text-xs text-white/50">{branding.accentColor}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] text-white/60 mb-1 block">Overlay Opacity</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={branding.overlayOpacity}
                    onChange={(e) => handleChange('overlayOpacity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-white/40">{Math.round(branding.overlayOpacity * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Type className="w-4 h-4 text-[#d4af37]" />
                Typography & Text
              </h3>

              <div className="space-y-3">
                <div>
                  <Label className="text-[10px] text-white/60 mb-1 block">Font Family</Label>
                  <select
                    value={branding.fontFamily}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="Barlow Condensed">Barlow Condensed</option>
                    <option value="Orbitron">Orbitron</option>
                    <option value="Rajdhani">Rajdhani</option>
                    <option value="Share Tech Mono">Share Tech Mono</option>
                  </select>
                </div>

                <div>
                  <Label className="text-[10px] text-white/60 mb-1 block">Custom Title</Label>
                  <Input
                    value={branding.customTitle}
                    onChange={(e) => handleChange('customTitle', e.target.value)}
                    placeholder="Stream title override"
                    className="bg-white/5 border-white/10 text-white text-xs h-8"
                  />
                </div>

                <div>
                  <Label className="text-[10px] text-white/60 mb-1 block">Custom Subtitle</Label>
                  <Input
                    value={branding.customSubtitle}
                    onChange={(e) => handleChange('customSubtitle', e.target.value)}
                    placeholder="Tagline or description"
                    className="bg-white/5 border-white/10 text-white text-xs h-8"
                  />
                </div>
              </div>
            </div>

            {/* Visual Elements */}
            <div className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#d4af37]" />
                Visual Elements
              </h3>

              <div className="space-y-3">
                <div>
                  <Label className="text-[10px] text-white/60 mb-1 block">Background Image URL</Label>
                  <Input
                    value={branding.backgroundUrl}
                    onChange={(e) => handleChange('backgroundUrl', e.target.value)}
                    placeholder="https://..."
                    className="bg-white/5 border-white/10 text-white text-xs h-8"
                  />
                </div>

                <div>
                  <Label className="text-[10px] text-white/60 mb-1 block">Lower-Thirds Template</Label>
                  <select
                    value={branding.lowerthirdsTemplate}
                    onChange={(e) => handleChange('lowerthirdsTemplate', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="default">Default</option>
                    <option value="minimal">Minimal</option>
                    <option value="elegant">Elegant</option>
                    <option value="neon">Neon</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={branding.showViewerCount}
                      onChange={(e) => handleChange('showViewerCount', e.target.checked)}
                      className="w-3 h-3"
                    />
                    Show Viewer Count
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={branding.showChatBadges}
                      onChange={(e) => handleChange('showChatBadges', e.target.checked)}
                      className="w-3 h-3"
                    />
                    Show Chat Badges
                  </label>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div
              className="rounded-lg p-4 border border-[#d4af37]/30 min-h-24"
              style={{
                background: `rgba(${parseInt(branding.overlayColor.slice(1, 3), 16)}, ${parseInt(branding.overlayColor.slice(3, 5), 16)}, ${parseInt(branding.overlayColor.slice(5, 7), 16)}, ${branding.overlayOpacity})`,
              }}
            >
              <p className="text-xs text-white/60 flex items-center gap-1 mb-2">
                <Eye className="w-3 h-3" /> Preview
              </p>
              <p className="font-bold text-white" style={{ fontFamily: branding.fontFamily }}>
                {branding.customTitle || 'Your Stream Title'}
              </p>
              <p className="text-xs text-white/70" style={{ fontFamily: branding.fontFamily }}>
                {branding.customSubtitle || 'Stream description'}
              </p>
              {branding.showViewerCount && <p className="text-[10px] text-white/50 mt-2">👥 1,234 viewers</p>}
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-[#d4af37] text-black hover:bg-[#e6c158]">
              Save Branding
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}