import React from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Hand, Swords, LogOut } from 'lucide-react';
import { MobileSelect } from '@/components/ui/MobileSelect';
import { isSafeUrl } from '@/lib/security';
import AggregatedChat from '../live/AggregatedChat';
import LiveTranslationWidget from '../streaming/LiveTranslationWidget';
import UnifiedChat from '../live/UnifiedChat';
import ChatOverlay from '../live/ChatOverlay';
import EnhancedStreamChat from '../live/EnhancedStreamChat';
import BattleTiers from '../watchparty/BattleTiers';
import BattleMode from '../streaming/BattleMode';
import LivePollWidget from '../live/LivePollWidget';
import InteractivePollWidget from '../streaming/InteractivePollWidget';
import EnhancedPollingSystem from '../live/EnhancedPollingSystem';
import InteractivePollingSystem from '../live/InteractivePollingSystem';
import PollLaunchBar from '../live/PollLaunchBar';
import QuickPollLauncher from '../live/QuickPollLauncher';
import LivePollOverlay from '../live/LivePollOverlay';
import HostControls from '../watchparty/HostControls';
import { GiftLeaderboard } from '../live/GiftSystem';
import GoldenWall from '../live/GoldenWall';
import EngagementBadgesDisplay from '../live/EngagementBadgesDisplay';
import LiveGoalWidget from '../live/LiveGoalWidget';
import VideoSourcePicker from '../video/VideoSourcePicker';
import RedemptionQueue from '../loyalty/RedemptionQueue';
import PointsEarnWidget from '../loyalty/PointsEarnWidget';
import GreenroomQueue from '../streaming/GreenroomQueue';
import HostAlertCenter from '../live/HostAlertCenter';
import EnhancedRoomControls from '../live/EnhancedRoomControls';
import PrivatePanel from '../live/PrivatePanel';
import NewsBlockOverlay from '../live/NewsBlockOverlay';
import WebRTCSetupBanner from '../live/WebRTCSetupBanner';
import WebhookHooks from '../live/WebhookHooks';
import EvmuxWebSource from '../live/EvmuxWebSource';
import LocalVideoTile from '../live/LocalVideoTile';
import DualStreamManager from '../streaming/DualStreamManager';
import OctagonalVideoWindow from '../live/OctagonalVideoWindow';
import SceneSwitcher from '../live/SceneSwitcher';
import ScreenSharePanel from '../live/ScreenSharePanel';
import RoomBrandingEditor from '../live/RoomBrandingEditor';
import MultiStreamConfig from '../live/MultiStreamConfig';
import OBSBridge from '../obs/OBSBridge';
import StreamMetadataEditor from '../streaming/StreamMetadataEditor';
import StreamingPresets from '../streaming/StreamingPresets';
import BitratePresets from '../streaming/BitratePresets';
import StreamHealthDashboard from '../streaming/StreamHealthDashboard';
import LiveAudiencePulse from '../live/LiveAudiencePulse';
import BroadcastAnalyticsDashboard from '../streaming/BroadcastAnalyticsDashboard';
import ZEGOLiveRoom from '../zego/ZEGOLiveRoom';
import VideoShortRecorder from '../vod/VideoShortRecorder';
import GuestQueue from '../live/GuestQueue';
import GuestDestinationsDashboard from '../streaming/GuestDestinationsDashboard';
import ZEGOGuestApprovalPanel from '../zego/ZEGOGuestApprovalPanel';
import GuestStreamMonitor from '../streaming/GuestStreamMonitor';
import GuestStreamingPermissions from '../live/GuestStreamingPermissions';
import GuestGrid from '../live/GuestGrid';
import GuestControls from '../live/GuestControls';
import GuestConnector from '../live/GuestConnector';
import VdoNinjaGuestLink from '../live/VdoNinjaGuestLink';
import GuestInviteGenerator from '../live/GuestInviteGenerator';
import LiveDestinationEditor from '../streaming/LiveDestinationEditor';
import StreamWebSourceManager from '../streaming/StreamWebSourceManager';
import CameraDeviceSelector from '../live/CameraDeviceSelector';
import EnhancedAudioMixer from '../live/EnhancedAudioMixer';
import SoundboardWidget from '../live/SoundboardWidget';
import AICopilotSidebar from '../live/AICopilotSidebar';
import StreamChatbot from '../live/StreamChatbot';
import AIModeration from '../live/AIModeration';
import { SwanDirectorHUD } from '../live/SwanDirectorPanel';
import AIStreamSummary from '../live/AIStreamSummary';
import LiveTranscription from '../live/LiveTranscription';
import ClipGeneratorAI from '../streaming/ClipGeneratorAI';
import StreamHighlightCapture from '../live/StreamHighlightCapture';
import AIPersonaCustomizer from '../live/AIPersonaCustomizer';
import PreStreamCountdown from '../live/PreStreamCountdown';
import AuraPanel from '../live/AuraPanel';
import AuraEmotionDisplay from '../live/AuraEmotionDisplay';
import AudioMixer from '../live/AudioMixer';
import AudioPanel from '../live/AudioPanel';
import PanelMusicPlayer from '../live/PanelMusicPlayer';
import ShareToSocial from '../social/ShareToSocial';
import RTMPFanoutPanel from '../live/RTMPFanoutPanel';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

/**
 * Right-hand tool panel contents for the Broadcast Studio — one block per tab.
 * Extracted from BroadcastStudio so that page stays maintainable.
 * Everything it needs is handed over in the single `s` (studio) object.
 */
export default function StudioTabContent({ s }) {
  const {
    activeTab, setActiveTab, hostSettings, pinnedMessage, setPinnedMessage, partyId, user,
    canManage, canStream, isHost, isCoHost, members, party, qc, setStudioMode,
    chatMessages, setChatMessages, slowMode, slowModeCooldown,
    activePoll, raisedHands, promoteSpeaker, promoteCoHost, demoteToAudience, dismissRaisedHand, kickMember,
    setShowInviteSheet, setHostSettings, subCount, goalTick, tipTotal, copyLink, linkCopied,
    setShowEvmux, setOverlayLayers, mediaError, audioEnabled, videoEnabled, reacquireMedia,
    toggleAudio, toggleVideo, noiseSupp, setNoiseSupp, echoCan, setEchoCan, autoGain, setAutoGain,
    localStream, screenSharing, setScreenSharing, activeScene, setActiveScene, endMut,
    bitratePreset, setBitratePreset, liveViewers, remoteStreams, peerUserIds, elapsed,
    activeVideoId, activeAudioId, replaceVideoDevice, replaceAudioDevice, toggleScreenShare,
    screenEnabled, speakers, prefSpeaker, setPrefSpeaker,
    aiSubTab, setAiSubTab, aiMusicGenre, setAiMusicGenre, aiMusicPrompt, setAiMusicPrompt,
    aiMusicGenerating, generateAiTrack, aiMoodDetecting, detectChatMood, aiMusicTrack,
    aiMusicPlaying, setAiMusicPlaying, musicVolume, setMusicVolume,
    ariaEnabled, setAriaEnabled, ariaTopicIdx, setAriaTopicIdx, ariaSuggestions,
    guardianEnabled, setGuardianEnabled, guardianStats, guardianWords, setGuardianWords,
    guardianWordInput, setGuardianWordInput,
  } = s;

  return (
    <div className="flex-1 overflow-y-auto">

      {/* 💬 MULTILINGUAL CHAT */}
      {activeTab === 'chat' && (
        hostSettings.chatEnabled ? (
          <div className="flex flex-col h-full">
            {pinnedMessage && (
              <div className="shrink-0 flex items-center gap-2 px-3 py-2 mx-2 mt-2 rounded-lg" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
                <span className="text-[10px]">📌</span>
                <span className="flex-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Barlow Condensed, sans-serif' }}>{pinnedMessage}</span>
              </div>
            )}
            <div className="flex-1 min-h-0">
              <AggregatedChat roomId={partyId} currentUser={user} isHost={canManage} onMessagesChange={setChatMessages} slowMode={slowMode} slowModeCooldown={slowModeCooldown} />
            </div>
            {chatMessages.length > 0 && (
              <div className="shrink-0 px-2 pb-2">
                <LiveTranslationWidget
                  chatMessage={chatMessages[chatMessages.length - 1]}
                  onTranslation={() => {}}
                />
              </div>
            )}
            <UnifiedChat roomId={partyId} currentUser={user} isHost={canManage} />
            <ChatOverlay roomId={partyId} isVisible />
            {user?.id && (
              <EnhancedStreamChat
                roomId={partyId}
                userId={user.id}
                userName={user.full_name || user.email || 'Host'}
                userRole={isHost ? 'host' : 'viewer'}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p className="text-[10px] text-white/25">Chat disabled by host</p>
          </div>
        )
      )}

      {/* ⚔️ PK BATTLE */}
      {activeTab === 'battle' && (
        hostSettings.battlesEnabled ? (
          <div className="p-2 space-y-2">
            <div className="flex items-center gap-2 px-1 pt-1">
              <Swords className="w-3.5 h-3.5" style={{ color: GOLD }} />
              <span className="text-[10px] font-black uppercase" style={{ color: GOLD, ...T }}>PK Battle Tiers</span>
            </div>
            <BattleTiers partyId={partyId} currentUser={user} members={members} hostId={party.host_id} />
            <BattleMode roomId={partyId} isHost={isHost} hostName={party?.host_name || ''} participants={members} />
            <div className="rounded-xl p-3 mt-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Award tiers to panelists in real time. Points accumulate during the broadcast and reset each session.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p className="text-[10px] text-white/25">Battles disabled by host</p>
          </div>
        )
      )}

      {/* 📊 POLLS */}
      {activeTab === 'polls' && (
        <div className="p-2 space-y-3">
          <LivePollWidget roomId={partyId} currentUser={user} isHost={canManage} />
          <InteractivePollWidget roomId={partyId} isHost={canManage} />
          {partyId && (
            <EnhancedPollingSystem roomId={partyId} hostId={party?.host_id} isHost={canManage} />
          )}
          <InteractivePollingSystem roomId={partyId} isHost={canManage} currentUser={user} />
          <PollLaunchBar roomId={partyId} hostId={party?.host_id} activePoll={activePoll} isHost={canManage} />
          <QuickPollLauncher roomId={partyId} hostId={party?.host_id} isHost={canManage} />
          <LivePollOverlay roomId={partyId} currentUser={user} isHost={canManage} position="bottom-left" />
        </div>
      )}

      {/* 👥 PANEL MANAGEMENT */}
      {activeTab === 'viewers' && (
        <div className="p-2 space-y-2">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[11px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
              {members.length} / 20 panelists
            </span>
            <button onClick={() => setShowInviteSheet(true)} className="text-[11px] px-2 py-0.5 rounded"
              style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>
              + Invite
            </button>
          </div>

          {/* Raised hands queue */}
          {canManage && raisedHands.size > 0 && (
            <div className="rounded-xl p-2 mb-1" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div className="flex items-center gap-1 mb-1.5">
                <Hand className="w-3 h-3" style={{ color: GOLD }} />
                <span className="text-[11px] font-black uppercase" style={{ color: GOLD, ...T }}>
                  Raised Hands ({raisedHands.size})
                </span>
              </div>
              {[...raisedHands].map(uid => {
                const mem = members.find(m => m.user_id === uid);
                return (
                  <div key={uid} className="flex items-center gap-2 py-1">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black"
                      style={{ background: 'rgba(212,175,55,0.2)', color: GOLD }}>
                      {(mem?.user_name || '?')[0].toUpperCase()}
                    </div>
                    <span className="flex-1 text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{mem?.user_name || uid}</span>
                    <button onClick={() => { if (mem) promoteSpeaker(mem); dismissRaisedHand(uid); }}
                      className="text-[11px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(212,133,74,0.1)', color: '#D4854A', border: '1px solid rgba(212,133,74,0.25)', ...T }}>
                      ✓ Panel
                    </button>
                    <button onClick={() => { if (mem) promoteCoHost(mem); dismissRaisedHand(uid); }}
                      className="text-[11px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>
                      Co-host
                    </button>
                    <button onClick={() => dismissRaisedHand(uid)}
                      className="text-[11px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(255,68,68,0.08)', color: '#D4854A', border: '1px solid rgba(255,68,68,0.15)', ...T }}>
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {members.map(mem => {
            const isMe = mem.user_id === user?.id;
            const isHostMem = mem.user_id === party.host_id;
            const isCoHostMem = mem.role === 'cohost';
            const isSpeakerMem = mem.role === 'speaker';
            const isOnStage = isHostMem || isCoHostMem || isSpeakerMem;
            const hasHand = raisedHands.has(mem.user_id);
            const avatarBg = isHostMem ? 'rgba(212,175,55,0.2)' : isCoHostMem ? 'rgba(212,175,55,0.12)' : isSpeakerMem ? 'rgba(212,133,74,0.18)' : 'rgba(255,255,255,0.08)';
            const avatarColor = isHostMem ? GOLD : isCoHostMem ? GOLD : isSpeakerMem ? '#D4854A' : 'rgba(255,255,255,0.4)';
            return (
              <div key={mem.id} className="flex items-center gap-2 p-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: hasHand ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 relative"
                  style={{ background: avatarBg, color: avatarColor }}>
                  {(mem.user_name || '?')[0].toUpperCase()}
                  {hasHand && <span className="absolute -top-1 -right-1 text-[10px]">✋</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white font-semibold truncate">{mem.user_name}{isMe ? ' (you)' : ''}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {isHostMem ? '👑 Host' : isCoHostMem ? '🎙 Co-host' : isSpeakerMem ? '🎤 Panel' : '👁 Audience'}
                  </p>
                </div>
                {canManage && !isMe && !isHostMem && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {isOnStage ? (
                      <button onClick={() => demoteToAudience(mem)}
                        className="text-[11px] px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(255,68,68,0.08)', color: '#D4854A', border: '1px solid rgba(255,68,68,0.2)', ...T }}>
                        Remove
                      </button>
                    ) : (
                      <>
                        <button onClick={() => promoteSpeaker(mem)}
                          className="text-[11px] px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(212,133,74,0.1)', color: '#D4854A', border: '1px solid rgba(212,133,74,0.25)', ...T }}>
                          Panel
                        </button>
                        <button onClick={() => promoteCoHost(mem)}
                          className="text-[11px] px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>
                          Co-host
                        </button>
                      </>
                    )}
                    <button onClick={() => kickMember(mem)}
                      className="text-[11px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(192,57,43,0.08)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.2)', ...T }}
                      title="Remove from broadcast">
                      Kick
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {members.length === 0 && (
            <p className="text-center text-[10px] py-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
              No panelists yet — share the invite link!
            </p>
          )}
        </div>
      )}

      {/* 🛡 HOST / CO-HOST MANAGEMENT */}
      {activeTab === 'manage' && canManage && (
        <div className="p-2 space-y-3">
          <HostControls isHost={canManage} party={party} onUpdate={setHostSettings} />

          {/* Gift leaderboard */}
          {partyId && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>🏆 Top Gifters</p>
              <GiftLeaderboard roomId={partyId} />
            </div>
          )}

          {/* Golden wall — live gift/superchat feed */}
          {partyId && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
              <GoldenWall roomId={partyId} isExpanded />
            </div>
          )}

          {/* Engagement badges */}
          {partyId && user?.id && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
              <EngagementBadgesDisplay roomId={partyId} userId={user.id} creatorId={party?.host_id || user.id} />
            </div>
          )}

          {/* Stream goal */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Stream Goal</p>
            <LiveGoalWidget memberCount={members.length} tipTotal={tipTotal} subCount={subCount} triggerEdit={goalTick} />
          </div>

          {/* Pinned message */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>📌 Pinned Message</p>
            {pinnedMessage ? (
              <div className="rounded-lg p-2 mb-2 flex items-start gap-2" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <span className="text-[10px] flex-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{pinnedMessage}</span>
                <button onClick={() => setPinnedMessage(null)}
                  style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: 1 }}>×</button>
              </div>
            ) : (
              <p className="text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>No pinned message</p>
            )}
            <div className="flex gap-2">
              <input
                placeholder="Pin a message for all viewers…"
                maxLength={200}
                onKeyDown={e => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { setPinnedMessage(e.currentTarget.value.trim()); e.currentTarget.value = ''; } }}
                style={{ flex: 1, height: 28, padding: '0 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}
              />
              <button
                onClick={e => { const inp = e.currentTarget.previousSibling; if (inp?.value?.trim()) { setPinnedMessage(inp.value.trim()); inp.value = ''; } }}
                style={{ height: 28, padding: '0 10px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 6, color: GOLD, fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, cursor: 'pointer' }}>
                📌
              </button>
            </div>
          </div>

          {/* Video source changer */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Video Source</p>
            <VideoSourcePicker
              isHost={isHost}
              isCoHost={isCoHost}
              onSelect={src => {
                const safeManageUrl = isSafeUrl(src.url) ? src.url : '';
                base44.entities.WatchParty.update(party.id, {
                  video_url: safeManageUrl,
                  video_type: src.type === 'youtube' ? 'youtube' : 'direct',
                  current_time: 0,
                  playback_state: 'paused',
                  updated_at_ms: Date.now(),
                }).then(() => {
                  qc.invalidateQueries({ queryKey: ['broadcast-party', partyId] });
                  setStudioMode('watch');
                  toast.success('Video updated!');
                }).catch(() => toast.error('Failed to update video.'));
              }}
            />
          </div>

          {/* Reward redemption queue */}
          {isHost && user?.id && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>🔔 Reward Queue</p>
              <RedemptionQueue creatorId={user.id} roomId={partyId} />
            </div>
          )}

          {/* Points earn widget */}
          {user?.id && partyId && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
              <PointsEarnWidget userId={user.id} creatorId={party?.host_id || user.id} roomId={partyId} isHost={isHost} />
            </div>
          )}

          {/* Greenroom guest queue */}
          {canManage && partyId && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
              <GreenroomQueue roomId={partyId} isHost={isHost} />
            </div>
          )}

          {/* Host alert center */}
          {isHost && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
              <HostAlertCenter />
            </div>
          )}

          {/* Enhanced room controls */}
          {isHost && party && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <EnhancedRoomControls
                isHost={isHost}
                roomData={party}
                micMuted={!audioEnabled}
                onMicToggle={toggleAudio}
                onAudioSettingsChange={(s2) => { if (s2.noiseSuppression !== undefined) setNoiseSupp(s2.noiseSuppression); if (s2.echoCancellation !== undefined) setEchoCan(s2.echoCancellation); }}
                onBrandingChange={(b) => { if (party?.id) base44.entities.WatchParty.update(party.id, b).catch(() => {}); }}
              />
            </div>
          )}

          {/* Private panel */}
          {isHost && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <PrivatePanel isHost={isHost} currentUser={user} />
            </div>
          )}

          {/* News Block overlay control panel */}
          {isHost && (
            <NewsBlockOverlay onLayersChange={setOverlayLayers} />
          )}

          {/* WebRTC setup banner */}
          <WebRTCSetupBanner error={mediaError} audioEnabled={audioEnabled} videoEnabled={videoEnabled} onRetry={reacquireMedia} />

          {/* Webhook hooks */}
          {isHost && partyId && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <WebhookHooks roomId={partyId} isHost={isHost} />
            </div>
          )}

          {/* Evmux web source */}
          {isHost && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <EvmuxWebSource isActive={party?.status === 'live'} onClose={() => setShowEvmux(false)} />
            </div>
          )}

          {/* Local video tile */}
          {localStream && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <LocalVideoTile stream={localStream} audioEnabled={audioEnabled} videoEnabled={videoEnabled} userName={user?.full_name || 'You'} isHost={isHost} />
            </div>
          )}

          {/* Dual Stream — 16:9 + 9:16 simultaneous outputs */}
          {isHost && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <DualStreamManager
                localStream={localStream}
                isActive={party?.status === 'live'}
              />
            </div>
          )}

          {/* Octagonal video window — live host feed */}
          {isHost && (
            <OctagonalVideoWindow
              title={party?.title || 'Live'}
              isMuted={!audioEnabled}
              isVideoOff={!videoEnabled}
              onMicToggle={toggleAudio}
              onVideoToggle={toggleVideo}
              onShareScreen={() => setScreenSharing(v => !v)}
              stream={localStream}
              userName={user?.full_name || 'Host'}
              avatarUrl={user?.avatar_url}
              label="Host"
              isLocal
            />
          )}

          {/* Scene switcher */}
          {isHost && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>🎬 Scene</p>
              <SceneSwitcher activeScene={activeScene} onSceneChange={setActiveScene} />
            </div>
          )}

          {/* Screen share */}
          {isHost && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>🖥 Screen Share</p>
              <ScreenSharePanel
                isSharing={screenSharing}
                onStartShare={() => setScreenSharing(true)}
                onStopShare={() => setScreenSharing(false)}
              />
            </div>
          )}

          {/* Room branding */}
          {isHost && party && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>🎨 Branding</p>
              <RoomBrandingEditor roomData={party} onBrandingChange={(b) => { if (party?.id) base44.entities.WatchParty.update(party.id, b).catch(() => {}); }} isHost={isHost} />
            </div>
          )}

          {/* Multi-stream config */}
          {isHost && partyId && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <MultiStreamConfig roomId={partyId} isHost={isHost} />
            </div>
          )}

          {/* OBS Bridge */}
          {isHost && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <OBSBridge />
            </div>
          )}

          {/* Stream metadata */}
          {isHost && party && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>🏷 Stream Info</p>
              <StreamMetadataEditor initialTitle={party.title} initialCategory={party.category || 'general'} />
            </div>
          )}

          {/* Streaming presets + bitrate */}
          {isHost && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>⚡ Stream Presets</p>
              <StreamingPresets onApply={preset => toast.success(`Preset "${preset?.label || preset}" applied`)} />
              <div className="mt-3">
                <BitratePresets selected={bitratePreset} onChange={setBitratePreset} />
              </div>
            </div>
          )}

          {/* Danger zone */}
          {isHost && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.15)' }}>
              <p className="text-[11px] font-black uppercase mb-2" style={{ color: '#C0392B', ...T }}>End Broadcast</p>
              <button onClick={() => endMut.mutate()}
                className="w-full py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1"
                style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B', ...T }}>
                <LogOut className="w-3.5 h-3.5" /> End Broadcast for Everyone
              </button>
            </div>
          )}
        </div>
      )}

      {/* ❤️ HEALTH TAB */}
      {activeTab === 'health' && (
        <div className="p-2 space-y-3">
          <StreamHealthDashboard isLive={party?.status === 'live'} />
          {partyId && (
            <LiveAudiencePulse roomId={partyId} isHost={isHost} viewerCount={liveViewers || members.length} />
          )}
          {partyId && (
            <BroadcastAnalyticsDashboard
              streamSession={{ id: partyId, title: party?.title }}
              isLive={party?.status === 'live'}
            />
          )}
          {partyId && user?.id && (
            <ZEGOLiveRoom
              roomId={partyId}
              userId={user.id}
              userName={user.full_name || user.email || 'Host'}
              isHost={isHost}
              onStreamHealth={() => {}}
            />
          )}
          {isHost && partyId && user?.id && (
            <VideoShortRecorder roomId={partyId} creatorId={user.id} />
          )}
        </div>
      )}

      {/* 🎙 GUEST QUEUE */}
      {activeTab === 'queue' && canManage && (
        <div className="p-2 space-y-3">
          <GuestQueue roomId={partyId} isHost={canManage} />
          {user?.id && (
            <GuestDestinationsDashboard
              userId={user.id}
              roomId={partyId}
              isHost={isHost}
              participants={members}
            />
          )}
          <ZEGOGuestApprovalPanel roomId={partyId} isHost={canManage} />
          <GuestStreamMonitor guestName={user?.full_name || 'Host'} isStreaming={party?.status === 'live'} />
          {members.length > 0 && (
            <GuestStreamingPermissions participant={members[0]} isHost={isHost} onUpdate={() => {}} />
          )}
          <GuestGrid
            participants={members}
            isHost={isHost}
            onInvite={copyLink}
            hostId={party?.host_id}
            remoteStreams={remoteStreams}
            peerUserIds={peerUserIds}
            localStream={localStream}
            currentUserId={user?.id}
          />
          <GuestControls
            participants={members}
            onMuteGuest={(guestId) => {
              const m = members.find(x => x.id === guestId);
              if (m) toast(`${m.user_name} muted (local)`);
            }}
            onRemoveGuest={(guestId) => {
              const m = members.find(x => x.id === guestId);
              if (m) kickMember(m);
            }}
          />
          <GuestConnector roomId={partyId} roomName={party?.title || 'SeeWhy Studio'} />
          <VdoNinjaGuestLink roomId={partyId} />
          {user?.id && (
            <GuestInviteGenerator userId={user.id} roomId={partyId} streamId={partyId} />
          )}
          <LiveDestinationEditor
            roomId={partyId}
            isHost={isHost}
            isLive={party?.status === 'live'}
          />
          <StreamWebSourceManager />
        </div>
      )}

      {/* 🎚 AUDIO MIXER TAB */}
      {activeTab === 'audio' && canStream && (
        <div className="p-3 space-y-3">
          {/* In-room camera + mic device switcher */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Devices</p>
            <CameraDeviceSelector
              compact
              currentVideoId={activeVideoId}
              currentAudioId={activeAudioId}
              onVideoChange={(id) => { replaceVideoDevice(id); try { if (id) localStorage.setItem('swl_pref_cam', id); } catch {} }}
              onAudioChange={(id) => { replaceAudioDevice(id); try { if (id) localStorage.setItem('swl_pref_mic', id); } catch {} }}
              onScreenShare={toggleScreenShare}
              isSharingScreen={screenEnabled}
            />
            {/* Audio output (speaker) selector — Chrome/Edge only */}
            {speakers.length > 1 && (
              <div className="mt-2">
                <MobileSelect
                  value={prefSpeaker || ''}
                  onChange={(id) => {
                    setPrefSpeaker(id);
                    try { if (id) localStorage.setItem('swl_pref_speaker', id); } catch {}
                  }}
                  label="Output Device"
                  placeholder="Default speakers"
                  options={[{ value: '', label: 'Default speakers' }, ...speakers.map(sp => ({ value: sp.deviceId, label: sp.label }))]}
                />
              </div>
            )}
          </div>
          {/* Audio processing toggles */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Audio Processing</p>
            {[
              { label: 'Noise Suppression', state: noiseSupp, set: setNoiseSupp },
              { label: 'Echo Cancellation', state: echoCan, set: setEchoCan },
              { label: 'Auto Gain Control', state: autoGain, set: setAutoGain },
            ].map(({ label, state, set }) => (
              <button key={label} onClick={() => set(v => !v)}
                className="w-full flex items-center justify-between py-1.5 px-0"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</span>
                <div className="w-8 h-4 rounded-full relative transition-colors shrink-0"
                  style={{ background: state ? 'rgba(109,191,126,0.6)' : 'rgba(255,255,255,0.12)', border: `1px solid ${state ? 'rgba(109,191,126,0.8)' : 'rgba(255,255,255,0.15)'}` }}>
                  <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                    style={{ background: state ? '#6DBF7E' : 'rgba(255,255,255,0.35)', left: state ? 'calc(100% - 14px)' : '2px' }} />
                </div>
              </button>
            ))}
            <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Disable if using professional hardware/software processing
            </p>
          </div>
          <EnhancedAudioMixer
            micMuted={!audioEnabled}
            onMicToggle={toggleAudio}
            onAudioSettingsChange={(s2) => { if (s2.noiseSuppression !== undefined) setNoiseSupp(s2.noiseSuppression); if (s2.echoCancellation !== undefined) setEchoCan(s2.echoCancellation); }}
            stream={localStream}
          />
          <SoundboardWidget isVisible={true} disabled={false} />
        </div>
      )}

      {/* 🤖 AI HUB TAB */}
      {activeTab === 'ai' && (
        <div className="flex flex-col h-full">
          {/* Sub-tab nav */}
          <div className="flex gap-0 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {[
              { id: 'music',     icon: '🎵', label: 'Music' },
              { id: 'copilot',   icon: '🤖', label: 'Copilot' },
              { id: 'guardian',  icon: '🛡️', label: 'Guard' },
              { id: 'director',  icon: '🎬', label: 'Direct' },
              { id: 'summary',   icon: '📊', label: 'Summary' },
              { id: 'clips',     icon: '✂️',  label: 'Clips' },
              { id: 'persona',   icon: '✨', label: 'Persona' },
              { id: 'countdown', icon: '⏱', label: 'Count' },
              { id: 'aura',      icon: '🌊', label: 'Aura' },
              { id: 'audio',     icon: '🎚', label: 'Audio' },
            ].map(t => (
              <button key={t.id} onClick={() => setAiSubTab(t.id)}
                className="flex-1 py-2 flex flex-col items-center gap-0.5 transition-all"
                style={{
                  background: aiSubTab === t.id ? 'rgba(212,175,55,0.1)' : 'transparent',
                  borderBottom: aiSubTab === t.id ? `2px solid ${GOLD}` : '2px solid transparent',
                  fontFamily: 'Barlow Condensed, sans-serif',
                }}>
                <span style={{ fontSize: 12 }}>{t.icon}</span>
                <span className="text-[9px] font-black uppercase" style={{ color: aiSubTab === t.id ? GOLD : 'rgba(255,255,255,0.3)' }}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Sub-tab content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">

            {/* ── MUSIC ── */}
            {aiSubTab === 'music' && (
              <div className="space-y-3">
                {/* Genre picker */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
                  <p className="text-[11px] font-black uppercase mb-2" style={{ color: GOLD, ...T }}>Genre</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Lo-Fi','Trap','Gospel','Afrobeats','R&B','Chill','Hype','Jazz','Soul','Drill'].map(g => (
                      <button key={g}
                        onClick={() => setAiMusicGenre(prev => prev === g ? null : g)}
                        className="px-2 py-0.5 rounded-full text-[11px] font-bold transition-all"
                        style={aiMusicGenre === g
                          ? { background: 'rgba(212,175,55,0.25)', color: GOLD, border: `1px solid rgba(212,175,55,0.5)` }
                          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom prompt */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Custom prompt</p>
                  <div className="flex gap-2">
                    <input
                      value={aiMusicPrompt}
                      onChange={e => setAiMusicPrompt(e.target.value)}
                      placeholder="e.g. dark ambient trap beat 90bpm…"
                      maxLength={120}
                      style={{ flex: 1, height: 32, padding: '0 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Generate / Mood detect */}
                <div className="flex gap-2">
                  <button
                    onClick={generateAiTrack}
                    disabled={aiMusicGenerating}
                    className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1"
                    style={{ background: aiMusicGenerating ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.18)', color: GOLD, border: `1px solid rgba(212,175,55,0.35)`, fontFamily: 'Barlow Condensed, sans-serif', cursor: aiMusicGenerating ? 'not-allowed' : 'pointer' }}>
                    {aiMusicGenerating ? '⏳ Generating…' : '✨ Generate Track'}
                  </button>
                  <button
                    onClick={detectChatMood}
                    disabled={aiMoodDetecting}
                    className="px-3 py-2.5 rounded-xl text-[11px] font-black"
                    title="Detect vibe from chat"
                    style={{ background: 'rgba(212,133,74,0.15)', color: '#D4854A', border: '1px solid rgba(212,133,74,0.3)', fontFamily: 'Barlow Condensed, sans-serif', cursor: aiMoodDetecting ? 'not-allowed' : 'pointer' }}>
                    {aiMoodDetecting ? '⏳' : '🎭 Vibe'}
                  </button>
                </div>

                {/* Now playing card */}
                {aiMusicTrack && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-end gap-[2px]">
                        {[3,5,4,6,3,5,4].map((h, i) => (
                          <div key={i} className="w-[2px] rounded-full animate-pulse"
                            style={{ height: aiMusicPlaying ? h*2 : 4, background: GOLD, animationDelay: i*0.12+'s', transition: 'height 0.3s' }} />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black truncate" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>{aiMusicTrack.title}</p>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>{aiMusicTrack.genre} · {aiMusicTrack.bpm} BPM · Key {aiMusicTrack.key}</p>
                      </div>
                      <button onClick={() => setAiMusicPlaying(v => !v)}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(212,175,55,0.2)', border: `1px solid rgba(212,175,55,0.4)`, color: GOLD, fontSize: 14 }}>
                        {aiMusicPlaying ? '⏸' : '▶'}
                      </button>
                    </div>
                    <p className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>{aiMusicTrack.description}</p>
                    {/* Volume slider */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Vol</span>
                      <input type="range" min={0} max={100} value={musicVolume}
                        onChange={e => setMusicVolume(+e.target.value)}
                        className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: GOLD }} />
                      <span className="text-[10px] font-black" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>{musicVolume}%</span>
                    </div>
                    {/* Broadcast to panel badge */}
                    {canManage && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(212,133,74,0.8)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        <span>📡</span>
                        <span>Broadcasting to all {members.length} panel members</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags row */}
                {aiMusicTrack?.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {aiMusicTrack.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.6)', border: '1px solid rgba(212,175,55,0.15)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Soundboard */}
                <SoundboardWidget isVisible={true} />

                {/* Panel music player */}
                <PanelMusicPlayer />

                {/* Link to full AI Music Studio */}
                <a href="/AIMusic" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>Open AI Music Studio</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>→</span>
                </a>
              </div>
            )}

            {/* ── COPILOT ── */}
            {aiSubTab === 'copilot' && (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
                  <AICopilotSidebar roomId={partyId} isHost={canManage} viewerCount={members.length} />
                </div>
                {/* ARIA toggle */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>🤖</span>
                      <span className="text-[11px] font-black uppercase" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>ARIA Auto-engage</span>
                    </div>
                    <button onClick={() => setAriaEnabled(v => !v)}
                      className="relative w-9 h-5 rounded-full transition-all"
                      style={{ background: ariaEnabled ? GOLD : 'rgba(255,255,255,0.1)' }}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: ariaEnabled ? '17px' : '2px' }} />
                    </button>
                  </div>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {ariaEnabled ? '✓ Answering chat questions & keeping audience active' : 'Enable ARIA to engage your audience automatically'}
                  </p>
                  {ariaEnabled && (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {['🎵 Music', '💬 Q&A', '🔥 Hype', '🎁 Gifts'].map((t, i) => (
                          <button key={t} onClick={() => setAriaTopicIdx(i)}
                            className="text-[11px] px-2 py-0.5 rounded-full font-bold"
                            style={{
                              background: ariaTopicIdx === i ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
                              color: ariaTopicIdx === i ? GOLD : 'rgba(255,255,255,0.35)',
                              border: ariaTopicIdx === i ? `1px solid rgba(212,175,55,0.4)` : '1px solid rgba(255,255,255,0.08)',
                              fontFamily: 'Barlow Condensed, sans-serif',
                            }}>
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {ariaSuggestions.map((sg, i) => (
                          <button key={i}
                            className="w-full text-left text-[11px] px-2 py-1.5 rounded-lg"
                            style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}
                            onClick={() => toast.success('ARIA sent: ' + sg)}>
                            💬 {sg}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Stream chatbot */}
                <StreamChatbot roomId={partyId} isHost={canManage} elapsedSeconds={elapsed} hostName={party?.host_name || ''} room={party} />
              </div>
            )}

            {/* ── GUARDIAN ── */}
            {aiSubTab === 'guardian' && (
              <div className="space-y-3">
                {/* Real AIModeration component */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(107,191,126,0.2)' }}>
                  <AIModeration
                    roomId={partyId}
                    isHost={canManage}
                    moderatorId={user?.id}
                    thresholds={user?.guardian_thresholds}
                  />
                </div>

                {/* Custom blocked words panel */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(107,191,126,0.06)', border: '1px solid rgba(107,191,126,0.15)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>🛡️</span>
                      <span className="text-[11px] font-black uppercase" style={{ color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>Guardian AI</span>
                    </div>
                    <button onClick={() => setGuardianEnabled(v => !v)}
                      className="relative w-9 h-5 rounded-full transition-all"
                      style={{ background: guardianEnabled ? '#6DBF7E' : 'rgba(255,255,255,0.1)' }}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: guardianEnabled ? '17px' : '2px' }} />
                    </button>
                  </div>
                  <p className="text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {guardianEnabled ? '✓ Auto-removing hate speech, spam, and toxic messages' : 'Enable to auto-moderate chat in real time'}
                  </p>
                  {guardianEnabled && (
                    <div className="space-y-2">
                      <div className="flex gap-3 text-center">
                        {[['Blocked', guardianStats.blocked + guardianWords.length], ['Warned', guardianStats.warned], ['Muted', guardianStats.muted]].map(([l, v]) => (
                          <div key={l} className="flex-1">
                            <div className="text-sm font-black" style={{ color: '#6DBF7E' }}>{v}</div>
                            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase mb-1" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>Blocked words</div>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {guardianWords.map(w => (
                            <span key={w} className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(107,191,126,0.12)', color: '#6DBF7E', border: '1px solid rgba(107,191,126,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                              {w}
                              <button onClick={() => setGuardianWords(ws => ws.filter(x => x !== w))} style={{ lineHeight: 1 }}>×</button>
                            </span>
                          ))}
                          {guardianWords.length === 0 && (
                            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>None added yet</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <input
                            value={guardianWordInput}
                            onChange={e => setGuardianWordInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && guardianWordInput.trim()) {
                                setGuardianWords(ws => [...new Set([...ws, guardianWordInput.trim().toLowerCase()])]);
                                setGuardianWordInput('');
                              }
                            }}
                            placeholder="Add word…"
                            maxLength={30}
                            style={{ flex: 1, padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(107,191,126,0.2)', borderRadius: 6, color: '#fff', fontSize: 11, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}
                          />
                          <button
                            onClick={() => {
                              if (guardianWordInput.trim()) {
                                setGuardianWords(ws => [...new Set([...ws, guardianWordInput.trim().toLowerCase()])]);
                                setGuardianWordInput('');
                              }
                            }}
                            style={{ padding: '4px 10px', background: 'rgba(107,191,126,0.15)', border: '1px solid rgba(107,191,126,0.3)', borderRadius: 6, color: '#6DBF7E', fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, cursor: 'pointer' }}>
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── DIRECTOR ── */}
            {aiSubTab === 'director' && (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,133,74,0.2)' }}>
                  <SwanDirectorHUD roomId={partyId} hostId={party?.host_id} onOpenPanel={() => setActiveTab('manage')} />
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(212,133,74,0.06)', border: '1px solid rgba(212,133,74,0.15)' }}>
                  <p className="text-[11px] font-black uppercase mb-1" style={{ color: '#D4854A', fontFamily: 'Barlow Condensed, sans-serif' }}>Director Mode</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>AI-assisted scene switching, layout suggestions, and audience engagement cues — synced across all {members.length} panel slots.</p>
                </div>
              </div>
            )}

            {/* ── SUMMARY ── */}
            {aiSubTab === 'summary' && (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
                  <AIStreamSummary
                    roomId={partyId}
                    isHost={canManage}
                    streamTitle={party?.title}
                    viewerCount={members.length}
                    elapsedSeconds={elapsed}
                  />
                </div>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
                  <LiveTranscription isLive={party?.status === 'live'} roomId={partyId} />
                </div>
              </div>
            )}

            {/* ── CLIPS ── */}
            {aiSubTab === 'clips' && (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,133,74,0.2)' }}>
                  <ClipGeneratorAI sessionId={partyId} roomId={partyId} creatorId={user?.id} />
                </div>
                {partyId && user?.id && (
                  <StreamHighlightCapture
                    roomId={partyId}
                    sessionId={partyId}
                    creatorId={user.id}
                    elapsedSeconds={elapsed}
                    isHost={isHost}
                  />
                )}
                <div className="rounded-xl p-3" style={{ background: 'rgba(212,133,74,0.06)', border: '1px solid rgba(212,133,74,0.15)' }}>
                  <p className="text-[11px] font-black uppercase mb-1" style={{ color: '#D4854A', fontFamily: 'Barlow Condensed, sans-serif' }}>AI Clip Generator</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Automatically detects highlight moments and creates shareable clips from your live session.</p>
                </div>
              </div>
            )}

            {/* ── AI PERSONA ── */}
            {aiSubTab === 'persona' && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
                <AIPersonaCustomizer roomId={partyId} sessionId={partyId} onCustomized={() => {}} />
              </div>
            )}

            {/* ── PRE-STREAM COUNTDOWN ── */}
            {aiSubTab === 'countdown' && (
              <PreStreamCountdown
                room={party}
                currentUser={user}
                onGoLive={() => toast.success('You\'re live! 🎙')}
              />
            )}

            {aiSubTab === 'aura' && partyId && (
              <div className="space-y-3">
                <AuraPanel
                  roomId={partyId}
                  isHost={isHost}
                  streamTitle={party?.title}
                  viewerCount={members.length}
                  isLive={party?.status === 'live'}
                  userTier="creator"
                />
                <AuraEmotionDisplay
                  roomId={partyId}
                  sessionId={partyId}
                  auraPersona="hype"
                />
              </div>
            )}

            {aiSubTab === 'audio' && (
              <div className="space-y-3">
                <AudioMixer
                  micMuted={!audioEnabled}
                  onMicToggle={toggleAudio}
                />
                <AudioPanel
                  micMuted={!audioEnabled}
                  onMicToggle={toggleAudio}
                  participants={members}
                />
                <EnhancedAudioMixer
                  micMuted={!audioEnabled}
                  onMicToggle={toggleAudio}
                  onAudioSettingsChange={(s2) => { if (s2.noiseSuppression !== undefined) setNoiseSupp(s2.noiseSuppression); if (s2.echoCancellation !== undefined) setEchoCan(s2.echoCancellation); }}
                />
              </div>
            )}

          </div>
        </div>
      )}

      {/* 📢 SHARE TAB */}
      {activeTab === 'share' && (
        <div className="p-3 space-y-3">
          <div className="text-[10px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Share Your Live Session</div>

          {/* ShareToSocial quick-share widget */}
          <ShareToSocial content={{ url: window.location.href, title: party?.title ? `🔴 ${party.title} — Join me LIVE on SeeWhy!` : '🔴 Join me LIVE on SeeWhy!' }} />

          {/* Copy link */}
          <div className="flex gap-2">
            <div className="flex-1 h-9 px-3 flex items-center rounded-xl text-[10px] truncate"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
              {window.location.href}
            </div>
            <button onClick={copyLink}
              className="h-9 px-3 rounded-xl text-[10px] font-black transition-all"
              style={{ background: linkCopied ? 'rgba(109,191,126,0.2)' : 'rgba(212,175,55,0.15)', color: linkCopied ? '#6DBF7E' : '#D4AF37', border: `1px solid ${linkCopied ? 'rgba(109,191,126,0.3)' : 'rgba(212,175,55,0.3)'}`, fontFamily: 'Barlow Condensed, sans-serif' }}>
              {linkCopied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Social platforms grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'WhatsApp',  emoji: '💬', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent('🔴 I\'m LIVE on SeeWhy! Join me → ' + window.location.href)}` },
              { name: 'Twitter/X', emoji: '🐦', color: '#1DA1F2', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent('🔴 LIVE on SeeWhy LIVE! Join me → ' + window.location.href)}` },
              { name: 'Facebook',  emoji: '👥', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
              { name: 'Telegram',  emoji: '✈️', color: '#2AABEE', href: `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('🔴 Join me LIVE on SeeWhy!')}` },
              { name: 'Instagram', emoji: '📸', color: '#E1306C', href: null, note: 'Copy link → paste in story' },
              { name: 'TikTok',    emoji: '🎵', color: '#000000', href: null, note: 'Copy link → paste in bio' },
            ].map(p => (
              <button key={p.name}
                onClick={() => p.href ? window.open(p.href, '_blank', 'noopener,noreferrer') : copyLink()}
                className="flex items-center gap-2 p-2 rounded-xl transition-all text-left"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-base">{p.emoji}</span>
                <div>
                  <div className="text-[10px] font-bold text-white">{p.name}</div>
                  {p.note && <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{p.note}</div>}
                </div>
              </button>
            ))}
          </div>

          {/* Native share if available */}
          {navigator.share && (
            <button
              onClick={() => navigator.share({ title: 'Join me LIVE on SeeWhy!', url: window.location.href }).catch(() => {})}
              className="w-full py-2.5 rounded-xl text-[11px] font-black uppercase"
              style={{ background: 'linear-gradient(135deg, #800020, #A0003A)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              📱 Share via Phone
            </button>
          )}

          {/* Embed code */}
          <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[11px] font-bold uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>Embed Code</div>
            <code className="text-[11px] break-all" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {`<iframe src="${window.location.href}" width="100%" height="600" frameborder="0" allow="camera;microphone"></iframe>`}
            </code>
            <button onClick={() => { navigator.clipboard.writeText(`<iframe src="${window.location.href}" width="100%" height="600" frameborder="0" allow="camera;microphone"></iframe>`).catch(() => {}); }}
              className="mt-1.5 text-[11px] px-2 py-0.5 rounded"
              style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.15)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Copy Embed
            </button>
          </div>

          {/* Guest invite links with QR codes (host/co-host only) */}
          {canManage && partyId && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
              <GuestInviteGenerator roomId={partyId} isHost={canManage} />
            </div>
          )}

          {/* Multi-platform RTMP fanout (host/co-host only) */}
          {canManage && partyId && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.12)' }}>
              <RTMPFanoutPanel roomId={partyId} isHost={isHost} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}