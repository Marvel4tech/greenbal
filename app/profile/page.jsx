'use client'

import ProfileUserCard from '@/components/ProfileUserCard'
import ProfileCompletionMeter from '@/components/ProfileCompletionMeter'
import SignOutButton from '@/components/SignOutButton'
import { Gamepad2, LogIn, Timer, Trophy, User2, Settings, Newspaper, Home, InfoIcon, } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const Page = () => {
  const pathname = usePathname()

  const siderlinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Leaderboard', href: '/profile/leaderboard', icon: Trophy },
    { label: 'Play', href: '/profile/play', icon: Gamepad2 },
    { label: 'News', href: '/profile/news', icon: Newspaper },
    { label: 'Assistance', href: '/profile/assistance', icon: InfoIcon },
  ]

  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/')

  // profile state owned here (so meter updates instantly)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState("")

  const loadProfile = useCallback(async () => {
    try {
      setProfileError("")
      setProfileLoading(true)

      const res = await fetch("/api/profile", { cache: "no-store" })

      // Important: avoid "string did not match expected pattern"
      const text = await res.text()
      let data = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error("Server did not return JSON. Check API route response.")
      }

      if (!res.ok) throw new Error(data?.error || "Failed to load profile")
      setProfile(data)
    } catch (e) {
      setProfileError(e.message)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Mobile profile menu (top-right)
  const [openMenu, setOpenMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) setOpenMenu(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className='flex flex-col md:flex-row min-h-[calc(100vh-5rem)] px-4 md:py-8 max-w-7xl mx-auto md:gap-12 pb-24 md:pb-0'>
      {/* Desktop Sidebar */}
      <aside className='hidden md:flex md:flex-col md:w-40 lg:w-56'>
        <div className='py-6 border-b border-primary'>
          <h2 className='text-xl font-bold'>My Dashboard</h2>
        </div>

        <nav className='flex flex-col flex-1 space-y-3 mt-10'>
          {siderlinks.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex gap-2 items-center p-2 rounded-md transition
                  ${active ? "bg-green-200 dark:bg-white/10 font-semibold" : "hover:bg-green-200 dark:hover:bg-white/10"}
                `}
              >
                <Icon className='w-5 h-5' />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className='mt-6'>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className='flex-1 bg-gray-100 dark:bg-gray-800 rounded-sm relative'>
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-40 bg-gray-100/90 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold">My Dashboard</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                @{profile?.username || "profile"}
              </span>
            </div>

            {/* Profile Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpenMenu((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-black/30 shadow-sm"
              >
                <User2 className="w-4 h-4" />
                <span className="text-xs font-medium">Account</span>
              </button>

              {/* Dropdown */}
              {openMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black shadow-lg overflow-hidden">
                  <div className="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400">
                    Signed in
                  </div>

                  <Link
                    href="/profile/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/10"
                    onClick={() => setOpenMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>

                  <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                    <SignOutButton />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="flex flex-col md:flex-row h-full py-6 px-4 md:px-8 gap-4">
          {/* Left: Profile card */}
          <div className="flex-1 bg-white dark:bg-black/70 border shadow-2xl rounded-sm">
            <ProfileUserCard
              profile={profile}
              onProfileUpdated={(updated) => setProfile(updated)}
            />
          </div>

          {/* Right: Meter + Stats */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Meter here */}
            <div>
              {profileLoading ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/50 p-5">
                  <p className="text-sm text-gray-500">Loading profile completion…</p>
                </div>
              ) : profileError ? (
                <div className="rounded-xl border border-red-200 dark:border-red-700 bg-white dark:bg-black/50 p-5">
                  <p className="text-sm text-red-500">{profileError}</p>
                  <button
                    onClick={loadProfile}
                    className="mt-3 text-xs px-3 py-2 rounded-lg bg-primary text-white"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <ProfileCompletionMeter profile={profile} />
              )}
            </div>

            {/* Stats Cards */}
            <div className="bg-white dark:bg-black/70 border shadow-xl rounded-lg p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Matches you've predicted so far
                </h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Predictions</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">128</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">matches</span>
              </div>
            </div>

            <div className="bg-white dark:bg-black/70 border shadow-xl rounded-lg p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Win Rate</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Percentage of correct predictions</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-4xl font-bold text-green-500">76%</span>
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div className="h-2 bg-green-500 rounded-full w-[76%]" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-black/70 border shadow-xl rounded-lg p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Avg. Prediction Time</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">How quickly you submit your predictions</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-blue-500">3.2s</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">avg</span>
              </div>
            </div>

            <div className="bg-white dark:bg-black/70 border shadow-xl rounded-lg p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Last Login</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your most recent activity time</p>
              <div className="mt-4">
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Oct 5, 2025 — 09:42 AM
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Page
