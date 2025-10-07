import ProfileUserCard from '@/components/ProfileUserCard'
import SignOutButton from '@/components/SignOutButton'
import { Gamepad2, InfoIcon, LogIn, Newspaper, Timer, Trophy } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const page = () => {

  const siderlinks = [
    { label: 'Leaderboard', href: '/profile/leaderboard', icon: Trophy },
    { label: 'Play Game', href: '/profile/play', icon: Gamepad2 },
    { label: 'Game Assistance', href: '/profile/assistance', icon: InfoIcon },
    { label: 'News', href: '/profile/news', icon: Newspaper },
  ]

  return (
    <div className=' flex flex-col md:flex-row min-h-[calc(100vh-5rem)] md:h-auto px-4 md:py-8 max-w-7xl mx-auto md:gap-12'>
      {/* Sidebar */}
      <aside className=' flex flex-row my-2 justify-center md:flex-col md:w-40 lg:w-56'>
        <div className=' hidden md:block py-6 border-b border-primary'>
          <h2 className=' text-xl font-bold'>My Dashboard</h2>
        </div>
        <nav className=' flex flex-row text-[10px] md:text-sm lg:text-base md:flex-col md:flex-1 md:space-y-4 md:overflow-y-auto md:mt-10'>
          {siderlinks.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className=' flex gap-1  md:gap-2 items-center p-2 rounded-md md:hover:bg-green-200 dark:md:hover:bg-white/10 transition'>
              {<Icon className=' w-2 h-3 md:w-5 md:h-5 '/>}
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className=' hidden md:block'>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className=' flex-1 bg-gray-100 dark:bg-gray-800 rounded-sm'>
          <div className=' flex flex-col md:flex-row h-full py-6 px-4 md:px-8 gap-4'>
            <div className=' flex-1 bg-white dark:bg-black/70 border shadow-2xl rounded-sm'>
              <ProfileUserCard />
            </div>

            {/* Stats Cards */}
            <div className=' flex-1 flex flex-col gap-6'>
              { /* Total Predictions */ }
              <div className="bg-white dark:bg-black/70 border shadow-xl rounded-lg p-5 flex flex-col justify-between 
              hover:scale-[1.02] transition-transform duration-200">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    Matches you've predicted so far
                  </h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Predictions
                </p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">128</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">matches</span>
                </div>
              </div>

              {/* Win Rate Card */}
              <div className="bg-white dark:bg-black/70 border shadow-xl rounded-lg p-5 flex flex-col justify-between 
              hover:scale-[1.02] transition-transform duration-200">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    Win Rate
                  </h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Percentage of correct predictions
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-4xl font-bold text-green-500">76%</span>
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full w-[76%]" />
                  </div>
                </div>
              </div>

              {/* Average Prediction Time  */}
              <div className="bg-white dark:bg-black/70 border shadow-xl rounded-lg p-5 flex flex-col justify-between 
              hover:scale-[1.02] transition-transform duration-200">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    Avg. Prediction Time
                  </h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  How quickly you submit your predictions
                </p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-500">3.2s</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">avg</span>
                </div>
              </div>

              {/* Last Login  */}
              <div className="bg-white dark:bg-black/70 border shadow-xl rounded-lg p-5 flex flex-col justify-between 
              hover:scale-[1.02] transition-transform duration-200">
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-purple-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    Last Login
                  </h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Your most recent activity time
                </p>
                <div className="mt-4 ">
                  <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                    Oct 5, 2025 — 09:42 AM
                  </span>
                </div>
              </div>
            </div>
          </div>
      </main>

      <div className=' md:hidden mb-6 mt-10'>
        <SignOutButton />
      </div>
    </div>
  )
}

export default page