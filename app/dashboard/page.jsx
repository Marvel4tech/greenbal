'use client'

import SignOutButton from '@/components/SignOutButton'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import { FaChartBar, FaCog, FaFutbol, FaInfoCircle, FaNewspaper, FaTools, FaTrophy, FaUsers } from 'react-icons/fa'

const adminCards = [
  { title: 'Manage Games', href: '/dashboard/games', icon: <FaFutbol />, color: 'bg-green-100 dark:bg-green-900/30', desc: 'Create and update daily matches.' },
  { title: 'News & Blogs', href: '/dashboard/news', icon: <FaNewspaper />, color: 'bg-blue-100 dark:bg-blue-900/30', desc: 'Post football news and updates.' },
  { title: 'Game Assistance', href: '/dashboard/assistance', icon: <FaInfoCircle />, color: 'bg-orange-100 dark:bg-orange-900/30', desc: 'Head-to-head or team stats.' },
  { title: 'Leaderboard', href: '/dashboard/leaderboard', icon: <FaTrophy />, color: 'bg-purple-100 dark:bg-purple-900/30', desc: 'See top players and scores.' },
  { title: 'Users', href: '/dashboard/users', icon: <FaUsers />, color: 'bg-yellow-100 dark:bg-yellow-900/30', desc: 'View all user profiles.' },
  { title: 'Settings', href: '/dashboard/settings', icon: <FaCog />, color: 'bg-gray-100 dark:bg-gray-900/30', desc: 'Manage app configuration.' },
  { title: 'System Tools', href: '/dashboard/tools', icon: <FaTools />, color: 'bg-red-100 dark:bg-red-900/30', desc: 'Backup, logs, maintenance.' },
]

const formatNum = (n) => new Intl.NumberFormat().format(Number(n ?? 0))

const page = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")

  const loadStats = async () => {
    try {
      setErr("")
      setLoading(true)
      const res = await fetch("/api/admin/stats", { cache: "no-store" })
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      if (!res.ok) throw new Error(data?.error || "Failed to load stats")
      setStats(data)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const quickStats = useMemo(() => {
    return [
      {
        label: "Total Users",
        value: stats?.totalUsers ?? 0,
        icon: <FaUsers />,
        color: "bg-blue-500",
      },
      {
        label: "Games Today",
        value: stats?.gamesToday ?? 0,
        icon: <FaFutbol />,
        color: "bg-green-500",
      },
      {
        label: "Pending Updates",
        value: stats?.pendingUpdates ?? 0,
        icon: <FaTools />,
        color: "bg-yellow-500",
      },
      {
        label: "Total Predictions",
        value: stats?.totalPredictions ?? 0,
        icon: <FaChartBar />,
        color: "bg-purple-500",
      },
    ]
  }, [stats])

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-950 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            Admin Dashboard
          </h1>

          {/* small helper line */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {stats?.meta?.todayYMD ? (
              <span>
                Today (UK): <span className="font-medium">{stats.meta.todayYMD}</span>
              </span>
            ) : (
              <span>Live stats</span>
            )}
          </div>

          {/* error + retry */}
          {err && (
            <div className="mt-2 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-black/40 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {err}
              <button
                onClick={loadStats}
                className="ml-3 text-xs px-3 py-1.5 rounded-lg bg-primary text-white"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 rounded-xl text-white ${stat.color} shadow-md`}
            >
              <div className="text-3xl opacity-80">{stat.icon}</div>

              <div className="text-right">
                <p className="text-lg font-bold">
                  {loading ? "…" : formatNum(stat.value)}
                </p>
                <p className="text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => (
            <Link
              href={card.href}
              key={card.title}
              className={`${card.color} cursor-pointer shadow-md hover:shadow-xl 
              transition-transform transform hover:scale-[1.02] rounded-xl p-6 flex flex-col items-center text-center`}
            >
              <div className="text-3xl text-primary mb-4">{card.icon}</div>
              <h2 className="text-lg font-semibold mb-2">{card.title}</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {card.desc}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-20">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}

export default page