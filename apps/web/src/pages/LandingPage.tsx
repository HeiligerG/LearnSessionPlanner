import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="px-4 py-12 text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">
          Learn Session Planner
        </h1>

        <p className="mb-8 text-xl leading-relaxed text-gray-600">
          Plan and track your learning sessions - whether it's school, programming, or personal development.
          Take control of your learning journey with daily and weekly planning tools.
        </p>

        <div className="mb-12">
          <Link to="/dashboard" className="inline-block rounded bg-primary px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-primary-dark">
            Get Started
          </Link>
        </div>

        <div className="mt-12 grid gap-8 text-left md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-6">
            <h3 className="mb-2 text-gray-900">Daily Planning</h3>
            <p className="leading-relaxed text-gray-600">
              Organize your daily learning sessions with customizable time blocks and subjects.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-6">
            <h3 className="mb-2 text-gray-900">Weekly Overview</h3>
            <p className="leading-relaxed text-gray-600">
              Track your weekly progress and identify patterns in your learning habits.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-6">
            <h3 className="mb-2 text-gray-900">Progress Tracking</h3>
            <p className="leading-relaxed text-gray-600">
              Monitor your learning journey with detailed analytics and insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
