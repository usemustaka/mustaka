import { organizationClient, twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL,
  basePath: '/auth',
  plugins: [
    organizationClient(),
    twoFactorClient(),
  ]
})
