import { db } from '@/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import * as schema from '../../db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.userTable,
      session: schema.sessionTable,
      account: schema.accountTable,
      verification: schema.verificationTable,
    },
    // debugLogs: true,
  }),

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'USER',
        input: false,
      },
    },
  },

  session: {
    expiresIn: process.env.SESSION_MAX_AGE
      ? parseInt(process.env.SESSION_MAX_AGE)
      : 60 * 30,
    updateAge: process.env.SESSION_UPDATE_AGE
      ? parseInt(process.env.SESSION_UPDATE_AGE)
      : 60 * 10,
  },

  advanced: {
    defaultCookieAttributes: {
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    },
  },

  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
})
