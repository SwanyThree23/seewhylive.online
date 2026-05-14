import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Secure RTMP relay configuration handler.
 * - Verifies host ownership before any operation
 * - NEVER returns stream keys or full RTMP URLs to the client
 * - Stores destinations server-side only
 * - Returns relay instructions referencing the app's ingest URL, not the destination keys
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId, destinations, action } = await req.json();

    if (!roomId || !Array.isArray(destinations)) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Verify the caller is the room host
    const rooms = await base44.asServiceRole.entities.Room.filter({ id: roomId });
    const room = rooms[0];

    if (!room || room.host_id !== user.id) {
      return Response.json({ error: 'Forbidden: Not room host' }, { status: 403 });
    }

    // Validate RTMP destinations — strip keys before any logging
    const validDestinations = destinations.filter(dest => {
      if (!dest.rtmpUrl || !dest.streamKey) return false;
      if (!dest.rtmpUrl.startsWith('rtmp://') && !dest.rtmpUrl.startsWith('rtmps://')) return false;
      // Block localhost / private IP destinations
      const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '10.', '192.168.', '172.'];
      if (blocked.some(b => dest.rtmpUrl.includes(b))) return false;
      return true;
    });

    if (validDestinations.length === 0) {
      return Response.json({ error: 'No valid RTMP destinations' }, { status: 400 });
    }

    if (validDestinations.length > 5) {
      return Response.json({ error: 'Max 5 destinations allowed' }, { status: 400 });
    }

    // Store config securely — keys stored server-side only
    const secureDestinations = validDestinations.map(d => ({
      platform: d.platform,
      rtmpUrl: d.rtmpUrl,
      streamKey: d.streamKey, // stored in DB, never echoed back
      label: d.label || d.platform,
      isActive: d.isActive !== false,
      addedAt: new Date().toISOString(),
    }));

    await base44.asServiceRole.entities.Room.update(roomId, {
      rtmp_destinations: secureDestinations,
      multi_streaming_enabled: action === 'start',
      stream_started_at: action === 'start' ? new Date().toISOString() : null,
    });

    // Build a relay session token — a unique ID the host's encoder uses to identify this relay job
    const relaySessionId = `relay_${roomId}_${Date.now()}`;

    // Track the relay session for analytics
    await base44.asServiceRole.entities.StreamSession.create({
      room_id: roomId,
      host_id: user.id,
      session_type: 'rtmp_relay',
      destination_count: secureDestinations.filter(d => d.isActive).length,
      platforms: secureDestinations.map(d => d.platform),
      status: action === 'start' ? 'live' : 'ended',
      started_at: new Date().toISOString(),
    }).catch(() => {}); // non-critical

    if (action === 'stop') {
      return Response.json({
        success: true,
        message: 'Relay stopped',
        relaySessionId,
      });
    }

    const activeCount = secureDestinations.filter(d => d.isActive).length;
    const platformList = secureDestinations.filter(d => d.isActive).map(d => d.label || d.platform);

    // Return ONLY non-sensitive relay instructions — NO keys, NO full RTMP URLs
    return Response.json({
      success: true,
      relaySessionId,
      activeDestinations: activeCount,
      platforms: platformList,
      // Relay instructions reference only the ingest side (host pushes to their own encoder)
      relay: {
        ingest_protocol: 'RTMP',
        note: 'Push your stream to your encoder. The relay will forward to all configured destinations server-side.',
        obs_settings: {
          service: 'Custom',
          server: 'Use your encoder RTMP ingest URL',
          note: 'Stream keys are stored server-side and never transmitted to the client.',
        },
        platforms_active: platformList,
        destination_count: activeCount,
      },
    });
  } catch (error) {
    console.error('Stream relay error:', error.message);
    return Response.json({ error: 'Relay configuration failed' }, { status: 500 });
  }
});