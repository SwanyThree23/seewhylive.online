import { NextRequest } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { z } from 'zod'
import crypto from 'crypto'

let _s3: S3Client | null = null
function getS3() {
  if (!_s3) _s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
  return _s3
}

const BUCKET = process.env.AWS_S3_BUCKET!

const ALLOWED_TYPES: Record<string, { maxMB: number; folder: string }> = {
  'image/jpeg':  { maxMB: 10, folder: 'images' },
  'image/png':   { maxMB: 10, folder: 'images' },
  'image/webp':  { maxMB: 10, folder: 'images' },
  'image/gif':   { maxMB: 5,  folder: 'images' },
  'video/mp4':       { maxMB: 2000, folder: 'videos' },
  'video/webm':      { maxMB: 2000, folder: 'videos' },
  'video/quicktime': { maxMB: 2000, folder: 'videos' },
}

const presignSchema = z.object({
  contentType: z.string(),
  fileSizeMB: z.number().positive(),
  purpose: z.enum(['avatar', 'thumbnail', 'video']),
})

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = presignSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { contentType, fileSizeMB, purpose } = parsed.data

  const allowed = ALLOWED_TYPES[contentType]
  if (!allowed) return err('INVALID_TYPE', `Content type ${contentType} not allowed`, 400)
  if (fileSizeMB > allowed.maxMB) {
    return err('FILE_TOO_LARGE', `Max ${allowed.maxMB}MB for ${contentType}`, 400)
  }

  const ext = contentType.split('/')[1]
  const key = `${allowed.folder}/${purpose}/${ctx.userId}/${crypto.randomUUID()}.${ext}`

  const command = new PutObjectCommand({
    Bucket: BUCKET ?? '',
    Key: key,
    ContentType: contentType,
    ContentLength: Math.round(fileSizeMB * 1024 * 1024),
    // Files land private; CloudFront CDN or signed URLs serve them
    ACL: 'private',
    Metadata: { uploadedBy: ctx.userId, purpose },
  })

  const url = await getSignedUrl(getS3(), command, { expiresIn: 300 })
  const cdnUrl = `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`

  return ok({ uploadUrl: url, cdnUrl, key })
}
