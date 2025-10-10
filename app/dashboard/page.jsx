'use client'

import SignOutButton from '@/components/SignOutButton'
import Link from 'next/link'
import React from 'react'
import { FaChartBar, FaCog, FaFutbol, FaInfoCircle, FaNewspaper, FaTools, FaTrophy, FaUsers } from 'react-icons/fa'

const quickStats = [
  { label: 'Total Users', value: 1204, icon: <FaUsers />, color: 'bg-blue-500' },
  { label: 'Games Today', value: 5, icon: <FaFutbol />, color: 'bg-green-500' },
  { label: 'Pending Updates', value: 3, icon: <FaTools />, color: 'bg-yellow-500' },
  { label: 'Total Predictions', value: 8567, icon: <FaChartBar />, color: 'bg-purple-500' },
]

const adminCards = [
  { title: 'Manage Games', href: '/dashboard/games', icon: <FaFutbol />, color: 'bg-green-100 dark:bg-green-900/30', desc: 'Create and update daily matches.' },
  { title: 'News & Blogs', href: '/dashboard/news', icon: <FaNewspaper />, color: 'bg-blue-100 dark:bg-blue-900/30', desc: 'Post football news and updates.' },
  { title: 'Game Assistance', href: '/dashboard/assistance', icon: <FaInfoCircle />, color: 'bg-orange-100 dark:bg-orange-900/30', desc: 'Head-to-head or team stats.' },
  { title: 'Leaderboard', href: '/dashboard/leaderboard', icon: <FaTrophy />, color: 'bg-purple-100 dark:bg-purple-900/30', desc: 'See top players and scores.' },
  { title: 'Users', href: '/dashboard/users', icon: <FaUsers />, color: 'bg-yellow-100 dark:bg-yellow-900/30', desc: 'View all user profiles.' },
  { title: 'Settings', href: '/dashboard/settings', icon: <FaCog />, color: 'bg-gray-100 dark:bg-gray-900/30', desc: 'Manage app configuration.' },
  { title: 'System Tools', href: '/dashboard/tools', icon: <FaTools />, color: 'bg-red-100 dark:bg-red-900/30', desc: 'Backup, logs, maintenance.' },
]

const page = () => {

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-950 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          Admin Dashboard
        </h1>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {quickStats.map((stat, index) => (
            <div key={index} className={`flex items-center justify-between p-4 rounded-xl text-white ${stat.color} shadow-md`}>
              <div className="text-3xl opacity-80">
                {stat.icon}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => (
            <Link href={card.href} key={card.title} className={`${card.color} cursor-pointer shadow-md hover:shadow-xl 
            transition-transform transform hover:scale-[1.02] rounded-xl p-6 flex flex-col items-center text-center`}>
              <div className="text-3xl text-primary mb-4">{card.icon}</div>
              <h2 className="text-lg font-semibold mb-2">{card.title}</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">{card.desc}</p>
            </Link>
          ))}
        </div>

        <div className=' mt-20'>
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}

export default page