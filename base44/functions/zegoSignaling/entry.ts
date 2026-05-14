import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Handles ZEGOCLOUD WebRTC signaling:
 * - Stores participant metadata (user, role, stream state)
 * - Tracks active peer connections per room
 * - Publishes real-time updates to roster
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, roomId, participantId, role, status } = await req.json();

    // Add participant to active roster
    if (action === 'join') {
      const participant = await base44.entities.Participant.create({
        room_id: roomId,
        user_id: user.id,
        user_name: user.full_name,
        role: role || 'viewer',
        status: status || 'active',
        joined_at: new Date().toISOString(),
      });
      return Response.json({ success: true, participantId: participant.id });
    }

    // Update participant status (e.g., video on/off, mute state)
    if (action === 'updateStatus') {
      await base44.entities.Participant.update(participantId, { status });
      return Response.json({ success: true });
    }

    // Remove participant from room
    if (action === 'leave') {
      await base44.entities.Participant.delete(participantId);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});