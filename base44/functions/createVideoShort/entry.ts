import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { room_id, title, description, video_url, thumbnail_url, duration_seconds, paywall_enabled, paywall_price } = await req.json();

    // Validate max 10 minutes (600 seconds)
    if (duration_seconds > 600) {
      return Response.json({ error: 'Video exceeds 10 minute limit' }, { status: 400 });
    }

    const videoShort = await base44.asServiceRole.entities.VODVideo.create({
      room_id,
      creator_id: user.id,
      title,
      description,
      video_url,
      thumbnail_url,
      duration_seconds,
      type: 'short',
      is_paywall_locked: paywall_enabled || false,
      paywall_price: paywall_price || 0,
      view_count: 0,
      published_at: new Date().toISOString(),
      is_published: true,
    });

    return Response.json({
      short_id: videoShort.id,
      duration_seconds,
      paywall_enabled: paywall_enabled || false,
      status: 'published',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});