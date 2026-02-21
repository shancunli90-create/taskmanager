import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import type { auth } from './auth'

/**
 * authClient は SSR時は baseURLとして自分自身を指定する必要があるので、
 * beforeLoadなどSSRでも実行される関数の中での使用は望ましくない。
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
})
