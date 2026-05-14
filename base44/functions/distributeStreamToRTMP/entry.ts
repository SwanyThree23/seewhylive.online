import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Distributes a live stream to multiple RTMP destinations
 * This function manages the streaming distribution across external platforms
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

    // Get the room to verify ownership
    const rooms = await base44.entities.Room.filter({ id: roomId });
    const room = rooms[0];

    if (!room || room.host_id !== user.id) {
      return Response.json({ error: 'Forbidden: Not room host' }, { status: 403 });
    }

    // Validate RTMP destinations
    const validDestinations = destinations.filter(dest => {
      if (!dest.rtmpUrl || !dest.streamKey) return false;
      // Basic RTMP URL validation
      if (!dest.rtmpUrl.startsWith('rtmp://') && !dest.rtmpUrl.startsWith('rtmps://')) return false;
      return true;
    });

    if (validDestinations.length === 0) {
      return Response.json({ error: 'No valid RTMP destinations' }, { status: 400 });
    }

    // Store streaming configuration for this room
    const streamingConfig = {
      roomId,
      destinations: validDestinations.map(d => ({
        platform: d.platform,
        rtmpUrl: d.rtmpUrl,
        streamKey: d.streamKey,
        isActive: d.isActive !== false,
        addedAt: new Date().toISOString(),
      })),
      isDistributing: action === 'start',
      distributionStartedAt: action === 'start' ? new Date().toISOString() : null,
    };

    // Update room with streaming destinations
    await base44.entities.Room.update(roomId, {
      rtmp_destinations: validDestinations,
      multi_streaming_enabled: true,
    });

    // Return stream distribution commands for frontend
    const streamCommands = validDestinations
      .filter(d => d.isActive !== false)
      .map(dest => ({
        platform: dest.platform,
        rtmpUrl: dest.rtmpUrl,
        streamKey: dest.streamKey,
        fullStreamUrl: `${dest.rtmpUrl}/${dest.streamKey}`,
      }));

    return Response.json({
      success: true,
      streamingConfig,
      activeDestinations: streamCommands.length,
      commands: streamCommands,
      instructions: {
        ffmpeg: `ffmpeg -i "input_stream_url" ${streamCommands
          .map((cmd, i) => `-f flv "${cmd.fullStreamUrl}"`)
          .join(' ')}`,
        obs: 'Use custom RTMP URL with the provided stream key in OBS settings',
        xsplit: 'Add each RTMP destination as a separate output target',
      },
    });
  } catch (error) {
    console.error('Stream distribution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});