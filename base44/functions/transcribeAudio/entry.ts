import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, language } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url required' }, { status: 400 });
    }

    // Use InvokeLLM with vision to transcribe audio/video
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Transcribe this audio/video file completely and accurately. Preserve all spoken words, timing, and context. Return only the transcribed text without any additional commentary.`,
      file_urls: [file_url],
      model: 'gemini_3_flash'
    });

    return Response.json({
      transcription: result,
      language: language || 'en',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});