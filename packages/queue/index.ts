import { Queue, Worker, type Job } from 'bullmq'
import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

interface EmailJobData {
  to: string
  subject: string
  html?: string
  text?: string
}

export const emailQueue = new Queue<EmailJobData>('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
})

export function createWorker<Data>(
  queueName: string,
  processor: (job: Job<Data>) => Promise<void>,
): Worker<Data> {
  return new Worker<Data>(queueName, processor, {
    connection,
    concurrency: 5,
  })
}

export async function closeQueues(): Promise<void> {
  await emailQueue.close()
  await connection.quit()
}
