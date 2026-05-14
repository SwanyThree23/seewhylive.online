import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Host only' }, { status: 403 });
    }

    const { room_id, current_layout, viewer_count, stream_duration_minutes } = await req.json();

    // Fetch engagement metrics
    const messages = await base44.entities.Message.filter(
      { room_id },
      '-created_date',
      20
    );

    const polls = await base44.entities.Poll.filter(
      { room_id, status: 'active' }
    );

    // Get chat sentiment
    const engagementScore = messages.length > 15 ? 'high' : messages.length > 5 ? 'medium' : 'low';

    // AI recommendation logic
    let recommendedLayout = current_layout;
    let confidence = 0.5;
    let reason = 'Current layout working';

    if (viewer_count > 100 && engagementScore === 'high') {
      recommendedLayout = 'spotlight';
      confidence = 0.85;
      reason = 'High viewership + engagement favors spotlight';
    } else if (polls.length > 0) {
      recommendedLayout = 'split';
      confidence = 0.8;
      reason = 'Active poll suggests dual-screen for visibility';
    } else if (stream_duration_minutes > 60 && engagementScore === 'medium') {
      recommendedLayout = 'theater';
      confidence = 0.75;
      reason = 'Extended stream benefits from immersive layout';
    }

    // Predict next recommended action
    const nextActionTime = Math.floor(Math.random() * 15) + 5; // Suggest action in 5-20 min
    let suggestedAction = 'Monitor engagement';

    if (messages.length < 5) {
      suggestedAction = 'Create a poll to boost interaction';
    } else if (viewer_count > 500 && !polls.length) {
      suggestedAction = 'Launch a quick poll to capitalize on viewership';
    }

    return Response.json({
      current_layout,
      recommended_layout: recommendedLayout,
      confidence,
      reason,
      suggested_action: suggestedAction,
      action_urgency_minutes: nextActionTime,
      engagement_score: engagementScore,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});