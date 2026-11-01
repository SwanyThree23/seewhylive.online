import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'
import { redis, REDIS_KEYS } from '@/lib/redis'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { z } from 'zod'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const auraSchema = z.object({
  trigger: z.enum(['chat', 'tip', 'join', 'command']),
  context: z.string().max(500).optional(),
  recentMessages: z.array(z.string().max(200)).max(10).optional(),
})

const PERSONALITY_PROMPTS: Record<string, string> = {
  SASSY: 'You are AURA, a sassy and witty AI co-host. Keep responses sharp, clever, and entertaining. Max 2 sentences.',
  HYPE: 'You are AURA, an energetic hype AI co-host. Keep the energy high, celebrate everything, use emojis. Max 2 sentences.',
  CALM: 'You are AURA, a calm and thoughtful AI co-host. Be measured, insightful, and welcoming. Max 2 sentences.',
  KIND: 'You are AURA, a warm and encouraging AI co-host. Be supportive, positive, and inclusive. Max 2 sentences.',
}

// 50 AURA calls per stream per hour
const HOURLY_LIMIT = 50

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> },
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  const { streamId } = await params
  // Fetch stream and verify AURA is enabled
  const stream = await prisma.stream.findUnique({
    where: { id: streamId, status: 'LIVE' },
    select: { auraEnabled: true, auraPersonality: true, creatorId: true },
  })
  if (!stream) return err('NOT_FOUND', 'Stream not found or not live', 404)
  if (!stream.auraEnabled) return err('AURA_DISABLED', 'AURA is not enabled for this stream', 400)
  if (stream.creatorId !== ctx.userId) return err('FORBIDDEN', 'Only the creator can trigger AURA', 403)

  // Hourly rate limit per stream
  const hour = new Date().toISOString().slice(0, 13)
  const hourKey = REDIS_KEYS.auraCallCount(streamId, hour)
  const callCount = await redis.incr(hourKey)
  if (callCount === 1) await redis.expire(hourKey, 3600)
  if (callCount > HOURLY_LIMIT) {
    return err('AURA_RATE_LIMITED', 'AURA hourly call limit reached', 429)
  }

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = auraSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { trigger, context, recentMessages = [] } = parsed.data
  const personality = stream.auraPersonality ?? 'HYPE'
  const systemPrompt = PERSONALITY_PROMPTS[personality] ?? PERSONALITY_PROMPTS.HYPE

  const userMessage = buildAuraPrompt(trigger, context, recentMessages)

  const message = await anthropic.messages.create({
    model: 'claude-haiku-5-5',
    max_tokens: 150,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const responseText = message.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')

  return ok({ text: responseText, personality, trigger })
}

function buildAuraPrompt(
  trigger: string,
  context?: string,
  recentMessages: string[] = [],
): string {
  const chat = recentMessages.length > 0
    ? `\nRecent chat:\n${recentMessages.map(m => `- ${m}`).join('\n')}`
    : ''

  switch (trigger) {
    case 'tip':
      return `Someone just sent a tip! Context: ${context ?? 'no extra info'}${chat}\nReact to the tip with enthusiasm and call out the tipper.`
    case 'join':
      return `Someone new just joined the stream! Context: ${context ?? 'no extra info'}${chat}\nGive them a warm welcome.`
    case 'command':
      return `The creator wants AURA to say something. Context: ${context ?? 'no instruction'}${chat}\nRespond naturally.`
    default:
      return `Engage with the chat.${chat}\nPick something interesting from the chat and respond.`
  }
}
