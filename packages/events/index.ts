import { connect, type NatsConnection, type Msg, StringCodec } from 'nats'

const sc = StringCodec()

let nc: NatsConnection | null = null

async function connectBus(url?: string): Promise<NatsConnection> {
  if (nc) return nc

  nc = await connect({
    servers: url ?? process.env.NATS_URL ?? 'nats://localhost:4222',
    name: 'mustaka',
    reconnect: true,
    maxReconnectAttempts: -1, // infinite
  })

  console.log(`🔗 NATS connected to ${nc.getServer()}`)

  // Graceful shutdown — catch errors so Bun doesn't complain on Ctrl+C
  const cleanup = () => {
    nc?.drain().catch(() => { })
    nc = null
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  return nc
}

function getConnection(): NatsConnection {
  if (!nc) throw new Error('NATS not connected. Call events.connectBus() first.')
  return nc
}

type EventPayload = Record<string, unknown>

async function publish(subject: string, data: EventPayload): Promise<void> {
  const conn = getConnection()
  const payload = JSON.stringify({
    event: subject,
    timestamp: new Date().toISOString(),
    data,
  })
  conn.publish(subject, sc.encode(payload))
}

async function subscribe(
  subject: string,
  handler: (data: EventPayload, msg: Msg) => void | Promise<void>,
): Promise<void> {
  const conn = getConnection()
  const sub = conn.subscribe(subject)

  console.log(`👂 NATS subscribed to "${subject}"`)

    ; (async () => {
      for await (const msg of sub) {
        try {
          const parsed = JSON.parse(sc.decode(msg.data))
          await handler(parsed.data as EventPayload, msg)
        } catch (err) {
          console.error(`[NATS] Error handling "${subject}":`, err)
        }
      }
    })()
}

async function subscribeQueue(
  subject: string,
  queue: string,
  handler: (data: EventPayload, msg: Msg) => void | Promise<void>,
): Promise<void> {
  const conn = getConnection()
  const sub = conn.subscribe(subject, { queue })

  console.log(`👂 NATS subscribed to "${subject}" (queue: ${queue})`)

    ; (async () => {
      for await (const msg of sub) {
        try {
          const parsed = JSON.parse(sc.decode(msg.data))
          await handler(parsed.data as EventPayload, msg)
        } catch (err) {
          console.error(`[NATS] Error in queue "${queue}" handling "${subject}":`, err)
        }
      }
    })()
}

async function disconnect(): Promise<void> {
  if (!nc) return
  await nc.drain()
  nc = null
  console.log('🔌 NATS disconnected')
}

export const events = {
  connect: connectBus,
  publish,
  subscribe,
  subscribeQueue,
  disconnect,
  get connection() { return nc },
}
