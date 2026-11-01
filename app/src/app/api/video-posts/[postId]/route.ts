import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { z } from 'zod'

type Params = { params: Promise<{ postId: string }> }

const updateVideoSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  thumbnailUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  durationSeconds: z.number().int().positive().optional(),
  isPaywalled: z.boolean().optional(),
  paywallAmountCents: z.number().int().positive().max(50000).optional(),
  isPublished: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: Params) {
  const { postId } = await params
  const ctx = await requireAuth(req).catch(() => null)
  const userId = ctx && !('status' in ctx) ? ctx.userId : null

  const post = await prisma.videoPost.findFirst({
    where: { id: postId, deletedAt: null },
    include: {
      creator: { select: { id: true, username: true, displayName: true, avatarUrl: true, tier: true } },
    },
  })

  if (!post) return err('NOT_FOUND', 'Video not found', 404)
  if (!post.isPublished && post.creatorId !== userId) {
    return err('NOT_FOUND', 'Video not found', 404)
  }

  if (post.isPaywalled && post.creatorId !== userId) {
    const unlock = userId
      ? await prisma.payment.findFirst({
          where: { fromUserId: userId, videoPostId: post.id, type: 'PAYWALL_UNLOCK', status: 'SUCCEEDED' },
        })
      : null
    if (!unlock) {
      return ok({ post: {
        id: post.id, title: post.title, thumbnailUrl: post.thumbnailUrl,
        isPaywalled: true, paywallAmountCents: post.paywallAmountCents,
        creator: post.creator,
        videoUrl: null,
      }})
    }
  }

  await prisma.videoPost.update({ where: { id: postId }, data: { views: { increment: 1 } } })

  return ok({ post })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  const { postId } = await params

  const post = await prisma.videoPost.findFirst({ where: { id: postId, deletedAt: null } })
  if (!post) return err('NOT_FOUND', 'Video not found', 404)
  if (post.creatorId !== ctx.userId && ctx.role !== 'ADMIN') {
    return err('FORBIDDEN', 'Not your video', 403)
  }

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = updateVideoSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const data = {
    ...parsed.data,
    ...(parsed.data.isPublished === true && !post.isPublished ? { publishedAt: new Date() } : {}),
  }

  const updated = await prisma.videoPost.update({ where: { id: postId }, data })
  return ok({ post: updated })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const { postId } = await params

  const post = await prisma.videoPost.findFirst({ where: { id: postId, deletedAt: null } })
  if (!post) return err('NOT_FOUND', 'Video not found', 404)
  if (post.creatorId !== ctx.userId && ctx.role !== 'ADMIN') {
    return err('FORBIDDEN', 'Not your video', 403)
  }

  await prisma.videoPost.update({ where: { id: postId }, data: { deletedAt: new Date() } })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'video_post.delete',
    targetId: postId,
    targetType: 'VideoPost',
  })

  return ok({ deleted: true })
}


