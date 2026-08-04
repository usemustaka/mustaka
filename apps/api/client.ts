import { treaty } from '@elysia/eden'
import type { App } from './src'

export const client = treaty<App>(process.env.API_URL ?? 'http://localhost:8000')
