import { Client as MinioClient } from 'minio'
import type { Readable } from 'node:stream'
import { ulid } from 'ulid'

function createClient(): MinioClient {
  const raw = process.env.MINIO_ENDPOINT ?? 'localhost'
  const endPoint = raw.split(':')[0] ?? raw
  return new MinioClient({
    endPoint,
    port: Number(process.env.MINIO_PORT ?? '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  })
}

let _client: MinioClient | null = null
function getClient(): MinioClient {
  if (!_client) _client = createClient()
  return _client
}
const defaultBucket = process.env.MINIO_BUCKET ?? 'mustaka'

async function ensureBucket(bucket: string = defaultBucket): Promise<void> {
  const c = getClient()
  const exists = await c.bucketExists(bucket)
  if (!exists) {
    await c.makeBucket(bucket, 'us-east-1')
    console.log(`🪣 Created MinIO bucket: ${bucket}`)
  }

  try {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    }
    await c.setBucketPolicy(bucket, JSON.stringify(policy))
  } catch {
  }
}

function getEndpointHost(): string {
  const raw = process.env.MINIO_ENDPOINT ?? 'localhost'
  return raw.split(':')[0] ?? raw
}

function getPublicUrl(): string {
  return process.env.MINIO_PUBLIC_URL
    ?? `http://${getEndpointHost()}:${process.env.MINIO_PORT ?? '9000'}`
}

interface UploadOptions {
  /** Content-Type. Auto-detected from extension if omitted. */
  contentType?: string
  /** MinIO bucket name (default: MINIO_BUCKET env). */
  bucket?: string
}

/**
 * Upload a file to MinIO.
 *
 * @param folder  Sub-folder inside bucket (e.g. "avatars", "documents")
 * @param filename Original filename (used to derive extension)
 * @param buffer  File content as Buffer or Uint8Array
 * @returns       Public URL of the uploaded file
 */
async function upload(
  folder: string,
  filename: string,
  buffer: Buffer | Uint8Array,
  options?: UploadOptions,
): Promise<string> {
  const bucket = options?.bucket ?? defaultBucket
  await ensureBucket(bucket)

  const ext = filename.split('.').pop() ?? 'bin'
  const key = `${folder}/${ulid()}.${ext}`

  const body = buffer instanceof Buffer ? buffer : Buffer.from(buffer)
  await getClient().putObject(bucket, key, body, body.length, {
    'Content-Type': options?.contentType ?? guessContentType(ext),
  })

  return `${getPublicUrl()}/${bucket}/${key}`
}

/**
 * Upload from a readable stream (for large files).
 */
async function uploadStream(
  folder: string,
  filename: string,
  stream: Readable,
  size: number,
  options?: UploadOptions,
): Promise<string> {
  const bucket = options?.bucket ?? defaultBucket
  await ensureBucket(bucket)

  const ext = filename.split('.').pop() ?? 'bin'
  const key = `${folder}/${ulid()}.${ext}`

  await getClient().putObject(bucket, key, stream, size, {
    'Content-Type': options?.contentType ?? guessContentType(ext),
  })

  return `${getPublicUrl()}/${bucket}/${key}`
}

async function remove(url: string): Promise<void> {
  const parsed = new URL(url)
  const parts = parsed.pathname.replace(/^\//, '').split('/')
  const bucket = parts[0]!
  const key = parts.slice(1).join('/')

  await getClient().removeObject(bucket, key)
}

function guessContentType(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
  return map[ext.toLowerCase()] ?? 'application/octet-stream'
}

export const storage = {
  upload,
  uploadStream,
  remove,
  get client() { return getClient() }
}
