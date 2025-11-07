import { Outlet, Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from '@/components/common/ThemeToggle'

export default function RootLayout() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-8 py-4">
        <nav className="mx-auto flex max-w-screen-xl items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white no-underline">
            Learn Session Planner
          </Link>
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`no-underline transition-colors ${
                isActive('/')
                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className={`no-underline transition-colors ${
                isActive('/dashboard')
                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/calendar"
              className={`no-underline transition-colors ${
                isActive('/calendar')
                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Calendar
            </Link>
            <Link
              to="/sessions"
              className={`no-underline transition-colors ${
                isActive('/sessions')
                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sessions
            </Link>
            <Link
              to="/statistics"
              className={`no-underline transition-colors ${
                isActive('/statistics')
                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Statistics
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-screen-xl flex-1 p-8 dark:bg-gray-900">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-8 py-6 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2025 Learn Session Planner. Built with React + TypeScript + Vite.</p>
      </footer>
    </div>
  )
}
