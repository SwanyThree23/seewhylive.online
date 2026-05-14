# Stream Ingest Integration Guide

## Overview
Comprehensive streaming ingest system supporting **RTMP**, **WHIP**, and **Guest Streaming Destinations**.

## Components

### EnhancedIngestPanel
- **Location**: `components/streaming/EnhancedIngestPanel.jsx`
- **Purpose**: Unified interface for all ingest methods
- **Features**:
  - RTMP Server setup (OBS/Streamlabs compatible)
  - WHIP endpoint configuration (WebRTC ingest)
  - Guest destination management
  - One-click copy for URLs and keys
  - Stream key visibility toggle
  - Connection status indicators

### GuestStreamingPermissions
- **Location**: `components/live/GuestStreamingPermissions.jsx`
- **Purpose**: Per-guest streaming controls for hosts
- **Features**:
  - Allow/deny multi-platform streaming
  - RTMP/WHIP access control
  - Recording permission toggle
  - Visibility to viewers control
  - Real-time permission updates

### GuestDestinationsPanel
- **Location**: `components/live/GuestDestinationsPanel.jsx`
- **Purpose**: Per-guest RTMP destination management
- **Features**:
  - Platform presets (YouTube, Twitch, Facebook, TikTok, Kick, Custom)
  - Stream key management (AES-256 encryption)
  - Connection validation testing
  - Enable/disable per destination
  - Per-guest multi-platform support

### GuestRTMPPanel
- **Location**: `components/streaming/GuestRTMPPanel.jsx`
- **Purpose**: Full RTMP destination panel with bitrate control
- **Features**:
  - Multiple platform support
  - Bitrate slider (500-8000 kbps)
  - Encrypted key storage
  - FFmpeg fanout notice
  - Validation state indicators

## Integration Points

### StreamInfra Page
Enhanced with:
- New "RTMP Ingest", "WHIP Ingest", "Guest Destinations" tabs
- Copy-to-clipboard for all URLs and keys
- Real-time connection status

### GuestGrid Component
Integration includes:
- GuestStreamingPermissions button on hover
- Quick access to guest destination configuration
- Host-only visibility and controls

### LiveRoom
Per-guest streaming permission management:
- Accept/reject streaming requests
- Configure individual destination limits
- Monitor guest streaming status

## Usage Examples

### Add to a Page
```jsx
import EnhancedIngestPanel from '@/components/streaming/EnhancedIngestPanel';

export default function MyStream() {
  return (
    <EnhancedIngestPanel 
      roomId="my_room_id"
      isHost={true}
    />
  );
}
```

### Add Permissions to Guest Tile
```jsx
import GuestStreamingPermissions from '@/components/live/GuestStreamingPermissions';

<GuestStreamingPermissions
  participant={guestData}
  isHost={true}
  onPermissionChange={handlePermChange}
/>
```

## Features Summary

✅ **RTMP Ingest**
- Standard RTMP server for OBS, Streamlabs, vMix
- Stream key management
- One-click regeneration

✅ **WHIP Ingest**
- Modern WebRTC protocol
- Ultra-low latency
- Authorization header support

✅ **Guest Destinations**
- Per-guest multi-platform support
- Platform presets with one-click setup
- Encrypted key storage
- Bitrate-per-destination control
- Connection validation

✅ **Permission Controls**
- Host-level guest access control
- Per-guest streaming permission
- Recording consent management
- Viewer visibility toggle

## Security

- All stream keys encrypted at rest (AES-256-GCM)
- Keys masked in UI by default
- Toggle visibility for manual entry
- Secure validation testing
- No keys logged in console

## Status

**BETA** - All features production-ready, UI refinements ongoing