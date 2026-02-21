import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'
import { getQueryClient } from './lib/tanstack-query'

export const getRouter = () => {
  const queryClient = getQueryClient()

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
    },
  })

  // この中で QueryClientProviderが呼び出されていてrouterを囲んでいるので useQuery等が使用できる。
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}
