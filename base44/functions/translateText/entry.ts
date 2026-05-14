import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, target_language, source_language } = await req.json();

    if (!text || !target_language) {
      return Response.json({ error: 'text and target_language required' }, { status: 400 });
    }

    const sourceHint = source_language ? ` (original language: ${source_language})` : '';
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following text to ${target_language}${sourceHint}. Preserve tone, formatting, and meaning. Return only the translated text:\n\n${text}`,
      model: 'gemini_3_flash'
    });

    return Response.json({
      original_text: text,
      translated_text: result,
      source_language: source_language || 'auto',
      target_language: target_language,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});