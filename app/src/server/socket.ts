import { createServer } from 'http'
import { Server, type Socket } from 'socket.io'
import { getToken } from 'next-auth/jwt'

const PORT = parseInt(process.env.SOCKET_PORT ?? '4001', 10)

// ── Viewer counts ─────────────────────────────────────────────────────────────
const viewersByStream = new Map<string, Set<string>>()

function addViewer(streamId: string, socketId: string) {
  if (!viewersByStream.has(streamId)) viewersByStream.set(streamId, new Set())
  viewersByStream.get(streamId)!.add(socketId)
  return viewersByStream.get(streamId)!.size
}

function removeViewer(streamId: string, socketId: string) {
  const s = viewersByStream.get(streamId)
  if (!s) return 0
  s.delete(socketId)
  if (s.size === 0) viewersByStream.delete(streamId)
  return s.size
}

// ── Auth middleware ───────────────────────────────────────────────────────────
async function extractUserId(socket: Socket): Promise<string | null> {
  const authHeader = socket.handshake.auth?.token as string | undefined
  if (!authHeader) return null

  try {
    const mockReq = {
      headers: { authorization: `Bearer ${authHeader}` },
      cookies: {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const token = await getToken({
      req: mockReq,
      secret: process.env.NEXTAUTH_SECRET ?? '',
    })
    return (token?.userId as string) ?? null
  } catch {
    return null
  }
}

// ── Server bootstrap ──────────────────────────────────────────────────────────
const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  pingTimeout: 20000,
  pingInterval: 25000,
})

io.on('connection', async (socket: Socket) => {
  const userId = await extractUserId(socket)

  // ── join-stream ───────────────────────────────────────────────────────────
  socket.on('join-stream', (streamId: string) => {
    if (typeof streamId !== 'string' || streamId.length > 36) return

    socket.join(`stream:${streamId}`)
    const count = addViewer(streamId, socket.id)

    io.to(`stream:${streamId}`).emit('viewer-count', { streamId, count })
  })

  // ── leave-stream ──────────────────────────────────────────────────────────
  socket.on('leave-stream', (streamId: string) => {
    if (typeof streamId !== 'string') return

    socket.leave(`stream:${streamId}`)
    const count = removeViewer(streamId, socket.id)

    io.to(`stream:${streamId}`).emit('viewer-count', { streamId, count })
  })

  // ── chat-message (relay from API after DB save) ───────────────────────────
  // The REST API inserts the message and then calls socket.emit via internal HTTP
  // or this handler for direct WS chat (e.g. from trusted service layer)
  socket.on('chat-message', (data: { streamId: string; message: unknown }) => {
    if (!userId) return // unauthenticated sockets cannot push chat
    const { streamId, message } = data
    if (typeof streamId !== 'string') return

    socket.to(`stream:${streamId}`).emit('chat-message', message)
  })

  // ── tip-alert ─────────────────────────────────────────────────────────────
  // Emitted by the webhook handler after confirming payment
  socket.on('tip-alert', (data: { streamId: string; tip: unknown }) => {
    if (!userId) return
    const { streamId, tip } = data
    if (typeof streamId !== 'string') return

    io.to(`stream:${streamId}`).emit('tip-alert', tip)
  })

  // ── aura-message (relay AURA AI responses to room) ───────────────────────
  socket.on('aura-message', (data: { streamId: string; message: unknown }) => {
    if (!userId) return
    const { streamId, message } = data
    if (typeof streamId !== 'string') return

    io.to(`stream:${streamId}`).emit('aura-message', message)
  })

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    // Clean up viewer counts for all streams this socket was in
    for (const [streamId] of Array.from(viewersByStream)) {
      const s = viewersByStream.get(streamId)
      if (s?.has(socket.id)) {
        const count = removeViewer(streamId, socket.id)
        io.to(`stream:${streamId}`).emit('viewer-count', { streamId, count })
      }
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`[socket] Server running on port ${PORT}`)
})

export { io }
