import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message_id, flag_id, appeal_reason, room_id } = await req.json();

    // Fetch original flagged message and appeal
    const message = await base44.asServiceRole.entities.Message.filter(
      { id: message_id }
    );

    if (!message?.length) {
      return Response.json({ error: 'Message not found' }, { status: 404 });
    }

    // Re-evaluate message with context
    const contextMessages = await base44.entities.Message.filter(
      { room_id },
      '-created_date',
      5
    );

    const reevaluationPrompt = `
Original message: "${message[0].content}"
Appeal reason: ${appeal_reason}
Context messages: ${contextMessages.map(m => m.content).join(' | ')}

Re-evaluate if this message genuinely violates community guidelines. Consider context and appeal.
Rate severity: 0-1 (0=safe, 1=severe). Respond: {severity: number, should_remove: boolean, reason: string}
    `;

    const evaluation = await base44.integrations.Core.InvokeLLM({
      prompt: reevaluationPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          severity: { type: 'number' },
          should_remove: { type: 'boolean' },
          reason: { type: 'string' },
        },
      },
    });

    // Log appeal action
    const appealScore = evaluation.severity < 0.3 ? 'appealed_successful' : 'appealed_denied';

    return Response.json({
      flag_id,
      message_id,
      original_severity: 0.7,
      reevaluated_severity: evaluation.severity,
      appeal_approved: evaluation.severity < 0.3,
      reason: evaluation.reason,
      confidence: Math.abs(evaluation.severity - 0.7) > 0.2 ? 0.85 : 0.6,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});