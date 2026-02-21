import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { auth } from '../../lib/better-auth/auth'
import type { QueryClient } from '@tanstack/react-query'

export const SESSION_QUERY_KEY = 'session'

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    return session
  },
)

export function getEnsureSession(queryClient: QueryClient) {
  return queryClient.ensureQueryData({
    queryKey: [SESSION_QUERY_KEY],
    queryFn: () => {
      return getSession()
    },
    // 1分間は「最新」とみなす
    staleTime: 1000 * 60,
  })
}
