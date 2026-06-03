import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import EnhancedAudioMixer from './EnhancedAudioMixer';
import RoomBrandingEditor from './RoomBrandingEditor';

export default function EnhancedRoomControls({
  isHost,
  roomData,
  micMuted,
  onMicToggle,
  onAudioSettingsChange,
  onBrandingChange,
}) {
  const [expandedSection, setExpandedSection] = useState('audio');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-2">
      {/* Audio Mixer Section */}
      <div className="bg-[rgba(13,6,24,0.95)] rounded-lg border border-[rgba(212,175,55,0.15)] overflow-hidden">
        <button
          onClick={() => toggleSection('audio')}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-all"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#d4af37]" />
            <span className="text-sm font-semibold text-white">Audio & Sound</span>
          </div>
          {expandedSection === 'audio' ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </button>

        <AnimatePresence>
          {expandedSection === 'audio' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-3 pb-3 border-t border-white/5"
            >
              <EnhancedAudioMixer
                micMuted={micMuted}
                onMicToggle={onMicToggle}
                onAudioSettingsChange={onAudioSettingsChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Room Branding Section */}
      {isHost && (
        <div className="bg-[rgba(13,6,24,0.95)] rounded-lg border border-[rgba(212,175,55,0.15)] overflow-hidden">
          <button
            onClick={() => toggleSection('branding')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#d4af37]" />
              <span className="text-sm font-semibold text-white">Room Customization</span>
              <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(88,28,135,0.5)', color: '#d8b4fe' }}>PRO</span>
            </div>
            {expandedSection === 'branding' ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </button>

          <AnimatePresence>
            {expandedSection === 'branding' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-3 pb-3 border-t border-white/5"
              >
                <RoomBrandingEditor
                  roomData={roomData}
                  onBrandingChange={onBrandingChange}
                  isHost={isHost}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}