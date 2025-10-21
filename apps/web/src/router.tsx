import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import LandingPage from '@pages/LandingPage'
import DashboardPage from '@pages/DashboardPage'
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
      }
    ]
  }
]

export const router = createBrowserRouter(routes)
