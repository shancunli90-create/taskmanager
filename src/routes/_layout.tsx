import { getEnsureSession } from '@/features/session/api'
import { authMiddleware } from '@/middleware/auth'
import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
  beforeLoad: async (ctx) => {
    const session = await getEnsureSession(ctx.context.queryClient)

    if (session == null) {
      throw redirect({ to: '/login', replace: true })
    }

    return { session }
  },
  server: {
    middleware: [authMiddleware],
  },
})

function RouteComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center shadow-lg">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg "
        >
          <Menu size={24} />
        </button>
        <h1 className="ml-4 text-xl font-semibold">
          <Link to="/">TaskManager</Link>
        </h1>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={` transition-all duration-300 ${
            isOpen ? 'w-60' : 'w-0'
          } overflow-hidden`}
        >
          <div className="p-4">
            <Link to="/" className="block p-3 rounded-lg hover:bg-gray-100">
              Home
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
