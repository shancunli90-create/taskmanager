import { createFileRoute, redirect } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useState } from 'react'
import type { SuccessContext } from 'better-auth/react'
import { getEnsureSession } from '@/features/session/api'
import { authClient } from '@/lib/better-auth/auth-client'

const loginFormSchema = z.object({
  email: z.email({ message: 'メール形式で入力してください' }),
  password: z.string().min(8, '8文字以上必要です'),
})
const searchSchema = z.object({
  redirect: z.string().optional(),
})
export const Route = createFileRoute('/login')({
  component: RouteComponent,

  validateSearch: searchSchema,
  beforeLoad: async (ctx) => {
    const session = await getEnsureSession(ctx.context.queryClient)
    if (session) {
      throw redirect({ to: '/' })
    }
  },
})

function RouteComponent() {
  const [error, setError] = useState<string>()
  const { queryClient } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const form = useForm({
    defaultValues: {
      email: 'admin@sample.com',
      password: 'Password123!',
    },
    onSubmit: async ({ value }) => {
      const parsed = loginFormSchema.safeParse(value)

      if (!parsed.success) {
        setError('入力内容が不正です')
        return
      }

      await authClient.signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
        fetchOptions: {
          onSuccess(context: SuccessContext<typeof authClient.$Infer.Session>) {
            if (context.data.user.role !== 'ADMIN') {
              setError('処理に失敗しました。')
              return
            }
            queryClient.setQueryData(['session'], context.data)
            const resolvedRedirect = search.redirect
            if (resolvedRedirect && location.pathname != resolvedRedirect) {
              navigate({ to: resolvedRedirect })
            } else {
              navigate({ to: '/' })
            }
          },
        },
      })
    },
  })

  return (
    <div className="h-screen flex items-center justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="grid gap-4 w-80"
      >
        {error && <div className="text-red-500">{error}</div>}

        <form.Field name="email">
          {(field) => (
            <input
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border p-2"
              placeholder="Email"
            />
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <input
              type="password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border p-2"
              placeholder="Password"
            />
          )}
        </form.Field>

        <button type="submit" className="bg-cyan-600 text-white p-2 rounded">
          ログイン
        </button>
      </form>
    </div>
  )
}
