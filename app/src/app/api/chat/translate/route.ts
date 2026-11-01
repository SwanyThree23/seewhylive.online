import { NextRequest } from 'next/server'
import { redis, REDIS_KEYS, CACHE_TTL } from '@/lib/redis'
import { rateLimit, ok, err, getIP } from '@/lib/middleware'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import crypto from 'crypto'

const client = new Anthropic()

const SUPPORTED_LANGS: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  pt: 'Portuguese', ja: 'Japanese', ko: 'Korean', zh: 'Chinese (Simplified)',
  ar: 'Arabic', hi: 'Hindi', it: 'Italian', ru: 'Russian',
}

const schema = z.object({
  text: z.string().min(1).max(500),
  targetLang: z.string().regex(/^[a-z]{2}$/),
})

export async function POST(req: NextRequest) {
  const limited = await rateLimit(getIP(req), 'unauth')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { text, targetLang } = parsed.data

  if (!SUPPORTED_LANGS[targetLang]) {
    return err('UNSUPPORTED_LANG', `Language ${targetLang} is not supported`, 400)
  }

  const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16)
  const cacheKey = REDIS_KEYS.translation(hash, targetLang)

  const cached = await redis.get(cacheKey)
  if (cached) return ok({ translated: cached, cached: true })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Translate this chat message to ${SUPPORTED_LANGS[targetLang]}. Return ONLY the translated text, no explanation:\n\n${text}`,
    }],
  })

  const translated = (message.content[0] as { text: string }).text.trim()
  await redis.setex(cacheKey, CACHE_TTL.TRANSLATION, translated)

  return ok({ translated, cached: false })
}
