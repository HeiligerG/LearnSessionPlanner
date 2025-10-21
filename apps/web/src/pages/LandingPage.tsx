import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-page__container">
        <h1 className="landing-page__title">
          Learn Session Planner
        </h1>

        <p className="landing-page__tagline">
          Plan and track your learning sessions - whether it's school, programming, or personal development.
          Take control of your learning journey with daily and weekly planning tools.
        </p>

        <div className="landing-page__cta">
          <Link to="/dashboard" className="landing-page__cta-button">
            Get Started
          </Link>
        </div>

        <div className="landing-page__features">
          <div className="landing-page__feature-card">
            <h3 className="landing-page__feature-title">Daily Planning</h3>
            <p className="landing-page__feature-description">
              Organize your daily learning sessions with customizable time blocks and subjects.
            </p>
          </div>

          <div className="landing-page__feature-card">
            <h3 className="landing-page__feature-title">Weekly Overview</h3>
            <p className="landing-page__feature-description">
              Track your weekly progress and identify patterns in your learning habits.
            </p>
          </div>

          <div className="landing-page__feature-card">
            <h3 className="landing-page__feature-title">Progress Tracking</h3>
            <p className="landing-page__feature-description">
              Monitor your learning journey with detailed analytics and insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
