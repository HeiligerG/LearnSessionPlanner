import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Keyboard, LogOut, User, Plus } from 'lucide-react'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { useGlobalShortcuts } from '@/contexts/GlobalShortcutsContext'
import { FloatingActionButton } from '@/components/common/FloatingActionButton'
import { Modal } from '@/components/common/Modal'
import { SessionForm } from '@/components/sessions/SessionForm'
import { useSessions } from '@/hooks/useSessions'

export default function RootLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { registerShortcut, unregisterShortcut } = useGlobalShortcuts()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const { createSession } = useSessions()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  // Register global Ctrl+Shift+N shortcut for quick create
  useEffect(() => {
    if (isAuthenticated) {
      registerShortcut('quick-create', {
        key: 'N',
        ctrlKey: true,
        shiftKey: true,
        description: 'Quick create session',
        action: () => setShowQuickCreate(true),
      })
    }

    return () => {
      unregisterShortcut('quick-create')
    }
  }, [isAuthenticated, registerShortcut, unregisterShortcut])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/sessions', label: 'Sessions' },
    { to: '/statistics', label: 'Statistics' },
  ]

  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 sm:px-8 py-4">
        <nav className="mx-auto flex max-w-screen-xl items-center justify-between">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white no-underline">
            Learn Session Planner
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {navLinks.filter(link => link.to !== '/').map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`no-underline transition-colors ${
                      isActive(link.to)
                        ? 'text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <ThemeToggle />
                <div className="flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 pl-4">
                  <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user?.name || user?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
                <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 pl-4">
                  <Keyboard className="h-3 w-3" />
                  <span>Press ? for shortcuts</span>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="no-underline text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors no-underline">
                  Sign Up
                </Link>
                <ThemeToggle />
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-gray-800 z-50 md:hidden shadow-xl animate-slide-in-right">
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {isAuthenticated ? (
                    <>
                      {navLinks.filter(link => link.to !== '/').map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className={`block px-4 py-3 rounded-lg no-underline transition-all ${
                            isActive(link.to)
                              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-3 rounded-lg no-underline text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-3 rounded-lg no-underline bg-primary-600 text-white hover:bg-primary-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </nav>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {isAuthenticated && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {user?.name || user?.email}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        handleLogout()
                      }}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      aria-label="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Keyboard className="h-3 w-3" />
                  <span>Press ? for keyboard shortcuts</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <main className="mx-auto w-full max-w-screen-xl flex-1 p-8 dark:bg-gray-900">
        <Outlet />
      </main>

      {/* Floating Action Button for Quick Create */}
      {isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register' && (
        <FloatingActionButton
          onClick={() => setShowQuickCreate(true)}
          icon={<Plus />}
          label="Quick Create Session"
          show={true}
          ariaLabel="Quick create"
        />
      )}

      {/* Quick Create Modal */}
      <Modal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        title="Quick Create"
        size="lg"
      >
        <SessionForm
          onSubmit={async (dto) => {
            await createSession(dto)
            setShowQuickCreate(false)
          }}
          onCancel={() => setShowQuickCreate(false)}
        />
      </Modal>

      <footer className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-8 py-6 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2025 Learn Session Planner. Built with React + TypeScript + Vite.</p>
      </footer>
    </div>
  )
}
