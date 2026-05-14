import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_id, message_content, user_context } = await req.json();

    // Build rich context from user behavior
    const userActivity = await base44.entities.Activity.filter(
      { user_id: user.id },
      '-created_date',
      10
    );

    const userSubscriptions = await base44.entities.ViewerSubscription.filter(
      { viewer_id: user.id }
    );

    const userPreferences = await base44.entities.SwanyBotPreference.filter(
      { user_id: user.id }
    );

    // Build AI context prompt
    const contextPrompt = `
User Profile:
- Name: ${user.full_name}
- Role: ${user.role}
- Recent Activity: ${userActivity.map(a => a.type).join(', ') || 'New user'}
- Subscriptions: ${userSubscriptions.length} active
- Interests: ${userPreferences.map(p => p.preference_value).join(', ') || 'Exploring'}

Current Message: ${message_content}

Personalize your response to match their interests and activity level. Be conversational and remember context from earlier in this conversation.
    `;

    // Invoke LLM with enhanced context
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: contextPrompt,
      add_context_from_internet: false,
    });

    return Response.json({ 
      response: response,
      context_strength: 'high',
      personalization_applied: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});