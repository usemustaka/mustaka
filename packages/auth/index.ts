import { zenstackAdapter } from '@zenstackhq/better-auth';
import { betterAuth } from "better-auth";
import { openAPI, organization, twoFactor } from 'better-auth/plugins'
import { logger } from '@mustaka/logger';
export { authClient as client } from './client';

import { zenstack } from '@mustaka/db';

export const auth = betterAuth({
  basePath: '/auth',
  database: zenstackAdapter(zenstack, {
    provider: 'postgresql'
  }),
  trustedOrigins: [
    String(process.env.APP_URL), String(process.env.API_URL)
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url, token }, _request) => {
      logger.auth.info({ userId: user.id, email: user.email, url }, "password reset requested")
    },
    onPasswordReset: async ({ user }, _request) => {
      logger.auth.info({ userId: user.id, email: user.email }, "password reset completed")
    }
  },
  plugins: [
    openAPI(),
    organization(),
    twoFactor(),
  ],
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, _request) => {
      logger.auth.info({ userId: user.id, email: user.email, url }, "verification email sent")
    }
  }
});
