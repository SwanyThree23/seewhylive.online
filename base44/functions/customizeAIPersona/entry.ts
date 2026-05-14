import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Host only' }, { status: 403 });
    }

    const { room_id, session_id, persona_name, persona_style, custom_instructions, avatar_preset } = await req.json();

    // Fetch or create AuraAICoHost record
    const auraCoHost = await base44.asServiceRole.entities.AuraAICoHost.filter(
      { room_id, session_id }
    );

    const updatedAura = auraCoHost?.length > 0
      ? await base44.asServiceRole.entities.AuraAICoHost.update(auraCoHost[0].id, {
          persona_name: persona_name || 'Aura',
          persona_style: persona_style || 'hype',
          custom_instructions: custom_instructions || '',
          avatar_preset: avatar_preset || 'default',
        })
      : await base44.asServiceRole.entities.AuraAICoHost.create({
          room_id,
          host_id: user.id,
          session_id,
          persona_name: persona_name || 'Aura',
          persona_style: persona_style || 'hype',
          custom_instructions: custom_instructions || '',
          avatar_preset: avatar_preset || 'default',
        });

    return Response.json({
      persona_id: updatedAura.id,
      persona_name: updatedAura.persona_name,
      persona_style: updatedAura.persona_style,
      status: 'customized',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});