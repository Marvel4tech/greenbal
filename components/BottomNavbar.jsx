// components/BottomNavbar.jsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Trophy, Gamepad2, InfoIcon, Newspaper, Home, User } from "lucide-react"

const Page = () => {
  const pathname = usePathname()

  const siderlinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Leaderboard', href: '/profile/leaderboard', icon: Trophy },
    { label: 'Play', href: '/profile/play', icon: Gamepad2 },
    { label: 'News', href: '/profile/news', icon: Newspaper },
  ]

  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 pb-4">
        <div className="bg-white/90 dark:bg-black/80 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg">
          <div className="grid grid-cols-4 items-center">
            {siderlinks.map(({ label, href, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-1 py-3 transition rounded-2xl
                    ${active ? "text-primary" : "text-gray-600 dark:text-gray-300"}
                  `}
                >
                  <div className={`p-2 rounded-xl transition ${active ? "bg-green-100 dark:bg-white/10" : "bg-transparent"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium leading-none">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page