import nodemailer from 'nodemailer'

export interface SendEmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host) {
    console.log('  ⚠️ SMTP_HOST not set — email will be logged to console')
    return null
  }

  const auth = user && pass ? { user, pass } : undefined

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    logger: process.env.NODE_ENV === 'development',
    ...(auth ? { auth } : {}),
  })
}

const defaultFrom = process.env.SMTP_FROM ?? 'noreply@mustaka.id'

async function send(options: SendEmailOptions): Promise<{ sent: boolean; messageId?: string }> {
  const transport = createTransport()

  if (!transport) {
    console.log('── ✉️ Email (SMTP not configured) ──')
    console.log(`  To:      ${options.to}`)
    console.log(`  Subject: ${options.subject}`)
    console.log(`  Body:    ${options.text ?? options.html?.slice(0, 200)}`)
    console.log('── End email ──')
    return { sent: false }
  }

  const info = await transport.sendMail({
    from: defaultFrom,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    cc: options.cc?.join(', '),
    bcc: options.bcc?.join(', '),
    attachments: options.attachments,
  })

  return { sent: true, messageId: info.messageId }
}

export const email = { send }
