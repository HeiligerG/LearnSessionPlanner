import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import LandingPage from '@pages/LandingPage'
import DashboardPage from '@pages/DashboardPage'
import CalendarPage from '@pages/CalendarPage'
import SessionsPage from '@pages/SessionsPage'
import StatisticsPage from '@pages/StatisticsPage'
import RootLayout from '@components/layouts/RootLayout'

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
        path: 'dashboard',
        element: <DashboardPage />
      },
      {
        path: 'calendar',
        element: <CalendarPage />
      },
      {
        path: 'sessions',
        element: <SessionsPage />
      },
      {
        path: 'statistics',
        element: <StatisticsPage />
      }
    ]
  }
]

export const router = createBrowserRouter(routes)
