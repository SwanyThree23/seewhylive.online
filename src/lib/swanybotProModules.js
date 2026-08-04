import { Wand2, Mic2, Music, ShoppingBag, FileText } from 'lucide-react';

// SwanyBot Pro module registry — SwanyThree ecosystem.
// status: 'live' = fully wired this turn; 'next' = scheduled, rendered as a preview card.
export const SWANYBOT_PRO_MODULES = [
  {
    id: 'video-transform',
    name: 'Video Transform Studio',
    tagline: 'Mirage LSD-style real-time reskin',
    icon: Wand2,
    status: 'live',
    accent: '#7B5DA6',
    description:
      'Reskin your camera, screen, or uploaded video into any style — preset themes or text prompts. In-app style-frame + clip rendering; export-ready Decart.ai pack for live real-time.',
    bullets: [
      'Camera / screen / upload driving frame',
      '8 preset themes + custom prompt bar',
      'LLM prompt enhancement (cinematic JSON)',
      'In-app style frame + short clip render',
      'Export Decart.ai Mirage LSD / Dart Stream pack',
    ],
  },
  {
    id: 'voice-lipsync',
    name: 'Voice + Lip-Sync Studio',
    tagline: 'Clone voice · sync avatar lips',
    icon: Mic2,
    status: 'live',
    accent: '#4A8A7A',
    description:
      'Clone your voice with emotional control, transcribe audio, drive a character avatar with lip-synced dialogue.',
    bullets: [
      'One-shot voice clone (reference upload)',
      'Emotional control sliders (angry, surprised…)',
      'Transcribe audio → driving script',
      'Character avatar lip-sync pipeline',
      'Export ElevenLabs / Decart LipSync Live pack',
    ],
  },
  {
    id: 'story-music-video',
    name: 'Story / Music Video Pipeline',
    tagline: 'Lyrics → song → avatar → music video',
    icon: Music,
    status: 'live',
    accent: '#D4854A',
    description:
      'End-to-end: chatbot lyrics → TTS song → character avatar → lip-synced music video with B-roll and beat-matched cuts.',
    bullets: [
      'LLM songwriter (genre, structure, verses)',
      'TTS vocal track with model choice',
      'Character avatar generation (Google Flow style)',
      'B-roll + match-to-beat cuts',
      'One-take narrative + explainer + vlog modes',
    ],
  },
  {
    id: 'product-ad',
    name: 'Product Ad Studio',
    tagline: 'Verve.fm-style product shots',
    icon: ShoppingBag,
    status: 'live',
    accent: '#D4AF37',
    description:
      'Turn a single product PNG into studio-quality video commercials — cinematic prompts, continue-shot sequences, campaign variations.',
    bullets: [
      'Background-free PNG product input',
      'Cinematic style presets (fashion / food / tech)',
      'Image prompt → video prompt pipeline',
      'Continue-shot seamless sequences',
      'UGC testimonial mode',
    ],
  },
  {
    id: 'prompt-forge',
    name: 'Prompt Forge',
    tagline: 'JSON / Sora / Veo prompt converter',
    icon: FileText,
    status: 'live',
    accent: '#C0392B',
    description:
      'Convert a one-line idea into cinematic JSON prompts optimized for Sora 2, Veo 3.1, Runway, and Nano Banana pipelines.',
    bullets: [
      'JSON prompt converter (ChatGPT-style)',
      'Sora 2 prompt generator',
      'Veo 3.1 commercial ad prompts',
      'Runway Gen-2 image+video pipeline prompts',
      'Nano Banana driving-image prompts',
    ],
  },
];

export const getModule = (id) => SWANYBOT_PRO_MODULES.find((m) => m.id === id);