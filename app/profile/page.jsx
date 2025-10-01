import SignOutButton from '@/components/SignOutButton'
import { Gamepad2, InfoIcon, Newspaper, Trophy } from 'lucide-react'
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
    <div className=' flex flex-col md:flex-row h-[calc(100vh-5rem)] px-4 md:py-8 max-w-7xl mx-auto md:gap-12'>
      {/* Sidebar */}
      <aside className=' flex flex-row my-2 justify-center md:flex-col md:w-40 lg:w-56'>
        <div className=' hidden md:block py-6 border-b border-primary'>
          <h2 className=' text-xl font-bold'>My Dashboard</h2>
        </div>
        <nav className=' flex flex-row text-[10px] md:text-sm lg:text-base md:flex-col md:flex-1 md:space-y-4 md:overflow-y-auto md:mt-10'>
          {siderlinks.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className=' flex gap-1  md:gap-2 items-center p-2 rounded-md md:hover:bg-white/10 transition'>
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
              user
            </div>
            <div className=' flex-1'>
              <div className=' flex flex-col gap-4 h-full'>
                <div className=' flex-1 bg-white dark:bg-black/70 shadow-2xl border rounded-sm'>
                  others 1
                </div>
                <div className=' flex-1 bg-white dark:bg-black/70 shadow-2xl border rounded-sm'>
                  others 2
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