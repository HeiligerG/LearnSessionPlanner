import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { SessionStatsDto, SessionResponse } from '@repo/shared-types';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { featureIcons, actionIcons, statsIcons, getCategoryIconComponent } from '@/utils/iconUtils';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { sessions } = useSessions();
  const [stats, setStats] = useState<SessionStatsDto | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionResponse[]>([]);

  useEffect(() => {
    // Only fetch statistics and sessions when authenticated
    if (!isAuthenticated) {
      setStats(null);
      setUpcomingSessions([]);
      return;
    }

    // Fetch statistics
    api.sessions.getStats().then((response) => {
      if (response.data) {
        setStats(response.data);
      }
    }).catch(console.error);

    // Get upcoming sessions (next 3)
    const upcoming = sessions
      .filter(s => s?.scheduledFor && new Date(s.scheduledFor) > new Date() && s.status === 'planned')
      .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())
      .slice(0, 3);
    setUpcomingSessions(upcoming);
  }, [sessions, isAuthenticated]);

  const quickActions = [
    {
      title: 'New Session',
      description: 'Create a new learning session',
      Icon: actionIcons.newSession,
      link: '/sessions',
      color: 'bg-blue-500',
    },
    {
      title: 'View Calendar',
      description: 'See your schedule',
      Icon: actionIcons.calendar,
      link: '/dashboard',
      color: 'bg-green-500',
    },
    {
      title: 'All Sessions',
      description: 'Manage all sessions',
      Icon: actionIcons.sessions,
      link: '/sessions',
      color: 'bg-purple-500',
    },
  ];

  const features = [
    {
      Icon: featureIcons.goal,
      title: 'Goal-Oriented Planning',
      description: 'Set clear learning goals and track your progress towards achieving them.',
    },
    {
      Icon: featureIcons.analytics,
      title: 'Smart Analytics',
      description: 'Visualize your learning patterns and identify areas for improvement.',
    },
    {
      Icon: featureIcons.time,
      title: 'Time Management',
      description: 'Optimize your study time with intelligent scheduling and reminders.',
    },
    {
      Icon: featureIcons.achievement,
      title: 'Achievement Tracking',
      description: 'Celebrate your milestones and stay motivated on your learning journey.',
    },
    {
      Icon: featureIcons.notes,
      title: 'Detailed Notes',
      description: 'Keep all your learning notes organized and easily accessible.',
    },
    {
      Icon: featureIcons.progress,
      title: 'Progress Sync',
      description: 'Track your learning progress across multiple subjects and categories.',
    },
  ];

  const StatsIcon = statsIcons.total;
  const CompletedIcon = statsIcons.completed;
  const InProgressIcon = statsIcons.inProgress;
  const TimeIcon = statsIcons.time;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 inline-block rounded-full bg-primary-100 dark:bg-primary-900 px-4 py-2">
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-300">
              Your Personal Learning Assistant
            </span>
          </div>

          <h1 className="mb-6 text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            Master Your Learning
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              One Session at a Time
            </span>
          </h1>

          <p className="mb-10 text-xl leading-relaxed text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Plan, track, and optimize your learning journey with intelligent session management.
            Whether it's school, programming, languages, or personal development - we've got you covered.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-primary-700 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/sessions"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 px-8 py-4 text-lg font-semibold text-gray-700 dark:text-gray-200 transition-all hover:border-primary-600 hover:text-primary-600 dark:hover:border-primary-400 dark:hover:text-primary-400"
            >
              View Sessions
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="px-4 py-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Your Learning at a Glance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <StatsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Total Sessions</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CompletedIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Completed</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">{stats.completionRate.toFixed(1)}% completion</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <InProgressIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">In Progress</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <TimeIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {(stats.completedDuration / 60).toFixed(1)}h
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Learning Time</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  of {(stats.totalDuration / 60).toFixed(1)}h planned
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="group bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className={`w-16 h-16 ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{action.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <section className="px-4 py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Coming Up Next
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingSessions.map((session) => {
                const CategoryIcon = getCategoryIconComponent(session.category);
                return (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-l-4 border-primary-500 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {session.title}
                      </h3>
                      <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                        <CategoryIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {session.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(session.scheduledFor!)} {formatTime(session.scheduledFor!)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Powerful features designed to help you stay organized and motivated on your learning journey.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow"
              >
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg inline-block mb-4">
                  <feature.Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-gradient-to-r from-primary-600 to-purple-600 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of learners who are achieving their goals with smart planning.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-primary-600 px-8 py-4 text-lg font-semibold transition-all hover:scale-105 shadow-xl"
          >
            Start Learning Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 bg-gray-900 text-gray-400 text-center">
        <p>Learn Session Planner - Master your learning journey</p>
      </footer>
    </div>
  );
}
