import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Host only' }, { status: 403 });
    }

    const { room_id, session_id, aura_persona } = await req.json();

    // Fetch recent chat and engagement metrics
    const recentMessages = await base44.entities.Message.filter(
      { room_id },
      '-created_date',
      15
    );

    const engagement = await base44.entities.EngagementBadge.filter(
      { creator_id: user.id },
      '-awarded_at',
      5
    );

    // Analyze room energy level
    const messageCount = recentMessages.length;
    const engagementLevel = engagement.length > 0 ? 'high' : 'medium';
    const messageVelocity = messageCount > 10 ? 'fast' : 'moderate';

    // Determine Aura response mode based on emotion
    let mode = 'standard';
    let energy = 0.5;

    if (messageVelocity === 'fast' && engagementLevel === 'high') {
      mode = 'hype';
      energy = 0.9;
    } else if (messageCount < 3) {
      mode = 'engaging';
      energy = 0.6;
    } else if (messageCount > 20) {
      mode = 'analytical';
      energy = 0.4;
    }

    // Generate dynamic response based on detected emotion
    const responsePrompt = `
You are Aura, a co-host with persona: ${aura_persona || 'hype'}.
Current room energy: ${energy}/1 (${mode} mode)
Recent engagement: ${engagementLevel}
Chat velocity: ${messageVelocity}

Generate a ${mode} response that matches the room's emotional state. Keep it 1-2 sentences, conversational, and relevant to the ${messageVelocity} chat pace.
    `;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: responsePrompt,
      add_context_from_internet: false,
    });

    // Update Aura state
    const auraCoHost = await base44.asServiceRole.entities.AuraAICoHost.filter(
      { room_id, session_id },
      '-created_date',
      1
    );

    if (auraCoHost?.length > 0) {
      await base44.asServiceRole.entities.AuraAICoHost.update(auraCoHost[0].id, {
        last_message: response,
        last_message_at: new Date().toISOString(),
      });
    }

    return Response.json({
      response,
      mode,
      energy_level: energy,
      detected_emotion: engagementLevel,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});