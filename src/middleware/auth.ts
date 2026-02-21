import { auth } from '@/lib/better-auth/auth'
import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    console.log('セッション終了 - リダイレクト')
    throw redirect({ to: '/login' })
  }
  return await next()
})

export const adminOnlyMiddleware = createMiddleware().server(
  async ({ next }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw redirect({ to: '/' })
    }

    if (session.user.role !== 'ADMIN') {
      console.log('権限不足 - ログイン画面へリダイレクト')
      await auth.api.signOut({ headers })
      throw redirect({ to: '/login' })
    }

    return next()
  },
)
