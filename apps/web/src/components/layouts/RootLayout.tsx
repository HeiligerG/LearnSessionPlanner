import { Outlet, Link } from 'react-router-dom'

export default function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-gray-200 bg-gray-50 px-8 py-4">
        <nav className="mx-auto flex max-w-screen-xl items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-gray-900 no-underline">
            Learn Session Planner
          </Link>
          <div className="flex gap-6">
            <Link to="/" className="text-gray-600 no-underline hover:text-gray-900 transition-colors">Home</Link>
            <Link to="/dashboard" className="text-gray-600 no-underline hover:text-gray-900 transition-colors">Dashboard</Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-screen-xl flex-1 p-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-gray-50 px-8 py-6 text-center text-gray-600">
        <p>&copy; 2025 Learn Session Planner. Built with React + TypeScript + Vite.</p>
      </footer>
    </div>
  )
}
