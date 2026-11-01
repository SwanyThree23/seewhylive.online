import { prisma } from '@/lib/db'
import type { NotificationType } from '@prisma/client'

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown>
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data as Parameters<typeof prisma.notification.create>[0]['data']['data'],
      },
    })
  } catch {
    // Never throw — notifications are non-critical
  }
}
