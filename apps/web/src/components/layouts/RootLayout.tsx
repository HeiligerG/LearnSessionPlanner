import { Outlet, Link } from 'react-router-dom'

export default function RootLayout() {
  return (
    <div className="root-layout">
      <header className="root-layout__header">
        <nav className="root-layout__nav">
          <Link to="/" className="root-layout__logo">
            Learn Session Planner
          </Link>
          <div className="root-layout__nav-links">
            <Link to="/" className="root-layout__nav-link">Home</Link>
            <Link to="/dashboard" className="root-layout__nav-link">Dashboard</Link>
          </div>
        </nav>
      </header>

      <main className="root-layout__main">
        <Outlet />
      </main>

      <footer className="root-layout__footer">
        <p>&copy; 2025 Learn Session Planner. Built with React + TypeScript + Vite.</p>
      </footer>
    </div>
  )
}
