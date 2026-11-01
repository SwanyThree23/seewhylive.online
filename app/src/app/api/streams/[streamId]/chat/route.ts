import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { z } from 'zod'

const messageSchema = z.object({
  body: z.string().min(1).max(500),
  lang: z.string().length(2).optional().default('en'),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> },
) {
  const { streamId } = await params
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

  const messages = await prisma.message.findMany({
    where: { streamId, deletedAt: null },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      body: true,
      lang: true,
      isPinned: true,
      createdAt: true,
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, tier: true },
      },
    },
  })

  const hasMore = messages.length > limit
  const items = hasMore ? messages.slice(0, limit) : messages
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return ok({ items, nextCursor })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> },
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  const { streamId } = await params
  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const stream = await prisma.stream.findUnique({
    where: { id: streamId, status: 'LIVE' },
    select: { id: true, creatorId: true },
  })
  if (!stream) return err('NOT_FOUND', 'Stream not found or not live', 404)

  // Check if user is banned
  const ban = await prisma.creatorBan.findFirst({
    where: {
      creatorId: stream.creatorId,
      bannedUserId: ctx.userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })
  if (ban) return err('BANNED', 'You are banned from this stream', 403)

  const message = await prisma.message.create({
    data: {
      streamId,
      authorId: ctx.userId,
      body: parsed.data.body,
      lang: parsed.data.lang,
    },
    select: {
      id: true,
      body: true,
      lang: true,
      createdAt: true,
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, tier: true },
      },
    },
  })

  return ok(message, 201)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> },
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const { streamId } = await params
  const { searchParams } = new URL(req.url)
  const messageId = searchParams.get('messageId')
  if (!messageId) return err('INVALID', 'messageId is required', 400)

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { streamId: true, authorId: true, stream: { select: { creatorId: true } } },
  })
  if (!message) return err('NOT_FOUND', 'Message not found', 404)
  if (message.streamId !== streamId) return err('INVALID', 'Message not in this stream', 400)

  const isAuthor = message.authorId === ctx.userId
  const isCreator = message.stream.creatorId === ctx.userId
  if (!isAuthor && !isCreator && ctx.role !== 'ADMIN') {
    return err('FORBIDDEN', 'Not authorized', 403)
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  })

  return ok({ deleted: true })
}
