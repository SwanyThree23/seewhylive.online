# ZEGOCLOUD Multi-User WebRTC Integration

## Overview
SeeWhy LIVE now has full WebRTC-powered multi-user video streaming using ZEGOCLOUD infrastructure:

### Features
✅ **Host Broadcasting** — Hosts can stream video/audio to unlimited viewers
✅ **Guest Co-Hosting** — Viewers can request to join the stream (host approval)
✅ **Real-Time Participant Roster** — Database-synced multi-user presence
✅ **Audio/Video Controls** — Toggle mic, camera, screen share per participant
✅ **Ultra-Low Latency** — Native WebRTC with STUN servers for fast delivery
✅ **Mobile Support** — Camera/mic access on iOS and Android browsers

## Architecture

### Database Tables
- **ZEGOStream** — Stream session metadata (app_id, room_id, latency mode, status)
- **Participant** — Real-time roster of users in each room (role, status, joined_at)
- **Room** — Stream metadata (title, status, host_id, viewer_count)

### Components
1. **`ZEGOLiveRoom`** — Central video grid with multi-participant layout
2. **`ZEGOGuestJoin`** — Viewer "Request to Co-Host" button  
3. **`ZEGOGuestApprovalPanel`** — Host approval/rejection interface
4. **`ZEGOConfigPanel`** — ZEGOCLOUD credentials configuration
5. **`ZEGOStreamHealthCard`** — Real-time bitrate & latency monitoring

### Backend
- **`zegoSignaling`** — RESTful signaling for join/leave/status updates
- **`useWebRTCPeers`** — Hook managing PeerConnection lifecycle

## How It Works

### Host Flow
1. Host navigates to `/LiveRoom?id={roomId}`
2. Browser requests camera/mic permission
3. Local media stream starts (stored in `localStreamRef`)
4. On "Go Live", creates ZEGOStream record + starts publishing
5. Approves/rejects guest requests via `ZEGOGuestApprovalPanel`
6. Audio/video toggles mute individual tracks

### Viewer/Guest Flow
1. Viewer joins room and watches live video feed
2. Clicks "Request to Co-Host" button
3. Request stored as Participant record (status=pending)
4. Host sees approval panel, approves
5. Participant status→active, viewer joins peer grid
6. Guest can toggle own audio/video independently

### WebRTC Peer Discovery
- Participants synced via real-time database subscription
- Each approved guest → new RTCPeerConnection created
- STUN servers at `stun.l.google.com:19302` for NAT traversal
- Tracks exchanged via offer/answer SDP handshake

## Configuration

### 1. Set ZEGOCLOUD Credentials
- Go to `CreatorDashboard`
- Find "Streaming Engine" / "ZEGOCLOUD Configuration" panel
- Enter your **App ID** (numeric from ZEGOCLOUD console)
- Enter your **App Sign** (64-char hex from ZEGOCLOUD console)
- Select **Latency Mode** (ultra-low, low, standard)
- Select **UIKit Type** (live_streaming, video_call, voice_call)
- Click **Save Config**

### 2. Enable Backend Functions
- ZEGOCLOUD features require backend functions enabled
- Used for: signaling, authentication, roster management

### 3. Test Connection
- Click "Go Live" button
- Browser should request camera/mic
- Video preview appears in grid
- Have a friend join as viewer → request co-host
- Approve request → guest appears in grid

## Real-Time Monitoring

### For Hosts
- **Participants Count** — Bottom bar shows "X on stage"
- **Connection Status** — Green dot = online, red = offline
- **Bitrate Graph** — Monitor average bitrate in stream health card
- **Audio Levels** — VU meter in audio mixer panel

### For Viewers
- **Guest Roster** — See all approved guests in participant list
- **Approval Badge** — Pending requests show in host panel
- **Stream Quality** — Bitrate indicator on video

## Troubleshooting

### "Failed to access camera/microphone"
- **Cause**: Browser permission denied
- **Fix**: Allow permission in browser settings, reload

### Participants not showing up
- **Cause**: Real-time subscription lagging
- **Fix**: Check database connectivity, try manual refresh (F5)

### Black video from guest
- **Cause**: WebRTC peer connection failed
- **Fix**: Check firewall rules, verify STUN server reachable

### High latency (>2s delay)
- **Cause**: Network congestion or far away peer
- **Fix**: Reduce bitrate in ZEGOCLOUD config, or switch to "low latency" mode

## Advanced Features

### Screen Sharing
Press **Screen Share** button to send desktop in addition to camera
(Requires screen capture permission)

### Recording
Host can record entire stream including all participants:
- Click **Record** button in top bar
- Recording saved to `Recording` entity
- Auto-transcoded to MP4 after stream ends

### Multi-RTMP Broadcast
Send live feed to YouTube, Twitch, etc. simultaneously:
- Click **Multi-Stream Config** in left sidebar
- Add RTMP destinations (YouTube, Twitch, etc.)
- Click "Start Broadcast" to send to all platforms

## Limits

- **Max Participants**: 20 co-hosts on stage (video)
- **Max Viewers**: Unlimited
- **Max Bitrate**: 8 Mbps (check ZEGOCLOUD tier)
- **Session Duration**: 24 hours max per stream

## Cost

ZEGOCLOUD pricing (as of 2026):
- **Video Calls**: $0.0099 per minute (standard)
- **Live Streaming**: $0.005 per GB bandwidth
- **Free Tier**: 10,000 free minutes/month

See: https://www.zegocloud.com/pricing

## API Reference

### ZEGOLiveRoom Props
```jsx
<ZEGOLiveRoom
  roomId={string}           // Room ID
  userId={string}           // Current user ID
  userName={string}         // Display name
  isHost={boolean}          // Host privileges
  onStreamHealth={fn}       // Callback for bitrate/latency
/>
```

### zegoSignaling Backend Function
```javascript
// Join room
base44.functions.invoke('zegoSignaling', {
  action: 'join',
  roomId: 'room123',
  role: 'host' | 'guest',
})

// Leave room
base44.functions.invoke('zegoSignaling', {
  action: 'leave',
  roomId: 'room123',
  participantId: 'participant456',
})

// Update status (mute, video off, etc)
base44.functions.invoke('zegoSignaling', {
  action: 'updateStatus',
  roomId: 'room123',
  participantId: 'participant456',
  status: 'active' | 'muted' | 'video_off',
})
```

## Next Steps

1. ✅ Core WebRTC streams working
2. 🔜 **TODO**: Add TURN server fallback for firewalled networks
3. 🔜 **TODO**: Implement SFU mode (Selective Forwarding Unit) for >4 guests
4. 🔜 **TODO**: Add AI-powered automatic spotlight detection
5. 🔜 **TODO**: Viewer reactions and virtual gift animations

---

**Questions?** Check runtime logs with `base44.entities.ZEGOStream.list()