export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-600">
        Welcome to your learning dashboard. This page is under construction.
      </p>
      <div className="mt-8 rounded-lg bg-gray-50 p-6">
        <h3 className="mb-2 text-gray-900">Coming Soon</h3>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed text-gray-600">
          <li>Daily learning session planner</li>
          <li>Weekly progress overview</li>
          <li>Subject tracking and analytics</li>
          <li>Custom session templates</li>
        </ul>
      </div>
    </div>
  )
}
