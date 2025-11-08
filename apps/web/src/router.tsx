import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import LandingPage from '@pages/LandingPage'
import LoginPage from '@pages/LoginPage'
import RegisterPage from '@pages/RegisterPage'
import DashboardPage from '@pages/DashboardPage'
import CalendarPage from '@pages/CalendarPage'
import SessionsPage from '@pages/SessionsPage'
import StatisticsPage from '@pages/StatisticsPage'
import RootLayout from '@components/layouts/RootLayout'
import { ProtectedRoute } from '@components/auth/ProtectedRoute'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: 'login',
        element: <LoginPage />
      },
      {
        path: 'register',
        element: <RegisterPage />
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'calendar',
        element: (
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'sessions',
        element: (
          <ProtectedRoute>
            <SessionsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'statistics',
        element: (
          <ProtectedRoute>
            <StatisticsPage />
          </ProtectedRoute>
        )
      }
    ]
  }
]

export const router = createBrowserRouter(routes)
