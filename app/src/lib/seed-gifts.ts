import { prisma } from '@/lib/db'

const GIFT_TYPES = [
  { name: 'Rose',     icon: '🌹', amountCents: 100,   auraMessage: 'just sent a Rose!',     sortOrder: 1 },
  { name: 'Fire',     icon: '🔥', amountCents: 200,   auraMessage: 'is on Fire!',            sortOrder: 2 },
  { name: 'Star',     icon: '⭐', amountCents: 500,   auraMessage: 'sent a Star!',           sortOrder: 3 },
  { name: 'Diamond',  icon: '💎', amountCents: 1000,  auraMessage: 'dropped a Diamond!',    sortOrder: 4 },
  { name: 'Crown',    icon: '👑', amountCents: 2000,  auraMessage: 'gave a Crown!',          sortOrder: 5 },
  { name: 'Rocket',   icon: '🚀', amountCents: 5000,  auraMessage: 'launched a Rocket!',    sortOrder: 6 },
  { name: 'Trophy',   icon: '🏆', amountCents: 10000, auraMessage: 'sent a Trophy!',         sortOrder: 7 },
  { name: 'Unicorn',  icon: '🦄', amountCents: 50000, auraMessage: 'unleashed a Unicorn!',  sortOrder: 8 },
] as const

export async function seedGifts() {
  for (const gift of GIFT_TYPES) {
    const existing = await prisma.giftType.findFirst({ where: { name: gift.name } })
    if (existing) {
      await prisma.giftType.update({
        where: { id: existing.id },
        data: {
          icon: gift.icon,
          amountCents: gift.amountCents,
          auraMessage: gift.auraMessage,
          sortOrder: gift.sortOrder,
          isActive: true,
        },
      })
    } else {
      await prisma.giftType.create({
        data: {
          name: gift.name,
          icon: gift.icon,
          amountCents: gift.amountCents,
          auraMessage: gift.auraMessage,
          sortOrder: gift.sortOrder,
          isActive: true,
        },
      })
    }
  }
}
