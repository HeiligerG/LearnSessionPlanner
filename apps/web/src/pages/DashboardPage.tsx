export default function DashboardPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Dashboard</h1>
      <p style={{ color: '#666' }}>
        Welcome to your learning dashboard. This page is under construction.
      </p>
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Coming Soon</h3>
        <ul style={{ color: '#666', lineHeight: '1.8' }}>
          <li>Daily learning session planner</li>
          <li>Weekly progress overview</li>
          <li>Subject tracking and analytics</li>
          <li>Custom session templates</li>
        </ul>
      </div>
    </div>
  )
}
