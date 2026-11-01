import IORedis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: IORedis | undefined
}

export const redis =
  globalForRedis.redis ??
  new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: false,
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// ── Typed helpers ────────────────────────────────────────────────────────────

export const CACHE_TTL = {
  SESSION: 60 * 60 * 24,         // 24h
  STREAM_LIVE: 30,                // 30s
  STREAM_ENDED: 60 * 5,           // 5m
  VIEWER_COUNT: 5,                // 5s
  CREATOR_PROFILE: 60 * 5,        // 5m
  TRANSLATION: 60 * 60 * 24 * 7,  // 7d
}

export const REDIS_KEYS = {
  viewerCount: (streamId: string) => `vc:${streamId}`,
  streamAccess: (userId: string, streamId: string) => `access:${userId}:${streamId}`,
  auraCallCount: (streamId: string, hour: string) => `aura:calls:${streamId}:${hour}`,
  translation: (hash: string, lang: string) => `tr:${hash}:${lang}`,
  creatorProfile: (username: string) => `profile:${username}`,
  rateLimit: (key: string) => `rl:${key}`,
  session: (userId: string) => `sess:${userId}`,
}
