import type { AuthMeta } from '@onmax/nuxt-better-auth'

declare module 'nitropack/types' {
  interface NitroRouteRules {
    auth?: AuthMeta
  }
  interface NitroRouteConfig {
    auth?: AuthMeta
  }
}

export default {}
