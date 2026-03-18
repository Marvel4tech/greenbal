'use client'

import ProfileUserCard from '@/components/ProfileUserCard'
import ProfileCompletionMeter from '@/components/ProfileCompletionMeter'
import SignOutButton from '@/components/SignOutButton'
import EnablePushNotifications from '@/components/EnablePushNotifications'

import {
  Gamepad2,
  LogIn,
  Trophy,
  Home,
  Wallet2,
} from 'lucide-react'

import Link from 'next/link'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

function formatLastLogin(dateString) {
  if (!dateString) return '—'

  const date = new Date(dateString)
  const now = new Date()

  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  const time = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isSameDay) return `Today at ${time}`
  if (isYesterday) return `Yesterday at ${time}`

  return date.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const Page = () => {
  const pathname = usePathname()

  const siderlinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Leaderboard', href: '/profile/leaderboard', icon: Trophy },
    { label: 'Play', href: '/profile/play', icon: Gamepad2 },
    { label: 'Rewards Wallet', href: '/profile/wallet', icon: Wallet2 },
  ]

  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/')

  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')

  const [stats, setStats] = useState({
    predictions: 0,
    totalGamesThisWeek: 0,
    correct: 0,
    points: 0,
    winRate: 0,
    weekStart: null,
    weekEnd: null,
    lastLogin: null,
  })

  const loadProfile = useCallback(async () => {
    try {
      setProfileError('')
      setProfileLoading(true)

      const res = await fetch('/api/profile', { cache: 'no-store' })
      const text = await res.text()

      let data = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error('Server did not return JSON.')
      }

      if (!res.ok) throw new Error(data?.error || 'Failed to load profile')
      setProfile(data)
    } catch (e) {
      setProfileError(e.message)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/stats', { cache: 'no-store' })
      const text = await res.text()

      let data = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error('Server did not return JSON.')
      }

      if (!res.ok) throw new Error(data?.error || 'Failed to load stats')
      setStats(data)
    } catch (e) {
      console.error('Stats error:', e.message)
    }
  }, [])

  useEffect(() => {
    loadProfile()
    loadStats()
  }, [loadProfile, loadStats])

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

  const lastLoginFormatted = formatLastLogin(stats.lastLogin)

  return (
    <div className='flex flex-col md:flex-row min-h-[calc(100vh-5rem)] px-4 md:py-8 max-w-7xl mx-auto md:gap-12 pb-8 md:pb-10'>
      {/* Sidebar */}
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
                className={`flex gap-2 items-center p-2 rounded-md transition ${
                  active
                    ? 'bg-green-200 dark:bg-white/10 font-semibold'
                    : 'hover:bg-green-200 dark:hover:bg-white/10'
                }`}
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

      {/* Main */}
      <main className='flex-1 bg-gray-100 dark:bg-gray-800 rounded-sm relative'>
        <div className='flex flex-col md:flex-row h-full py-6 px-4 md:px-8 gap-4'>
          {/* Left */}
          <div className='flex-1 bg-white dark:bg-black/70 border shadow-2xl'>
            <ProfileUserCard
              profile={profile}
              onProfileUpdated={(updated) => setProfile(updated)}
            />
          </div>

          {/* Right */}
          <div className='flex-1 flex flex-col gap-6'>
            <div>
              {profileLoading ? (
                <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/50 p-5'>
                  <p className='text-sm text-gray-500'>Loading profile completion…</p>
                </div>
              ) : profileError ? (
                <div className='rounded-xl border border-red-200 dark:border-red-700 bg-white dark:bg-black/50 p-5'>
                  <p className='text-sm text-red-500'>{profileError}</p>
                  <button
                    onClick={loadProfile}
                    className='mt-3 text-xs px-3 py-2 rounded-lg bg-primary text-white'
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <ProfileCompletionMeter profile={profile} />
              )}
            </div>

            <EnablePushNotifications />

            {/* Premium Stats Cards */}
            <div className='grid gap-4'>
              {/* Matches predicted */}
              <div className='relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/70 p-5 shadow-xl'>
                <div className='pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary/10 blur-3xl' />

                <div className='relative'>
                  <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-2'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                        <Gamepad2 className='w-5 h-5' />
                      </div>
                      <div>
                        <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                          Matches predicted
                        </h2>
                        <p className='text-sm text-gray-500 dark:text-white/60'>
                          Your current week progress
                        </p>
                      </div>
                    </div>

                    <div className='rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary'>
                      This week
                    </div>
                  </div>

                  <div className='mt-5 flex items-end gap-2'>
                    <span className='text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white'>
                      {stats.predictions}
                    </span>
                    <span className='mb-1 text-xl font-semibold text-gray-500 dark:text-white/50'>
                      / {stats.totalGamesThisWeek}
                    </span>
                  </div>

                  <p className='mt-2 text-sm text-gray-600 dark:text-white/70'>
                    You have predicted {stats.predictions} out of {stats.totalGamesThisWeek} matches in the current weekly round.
                  </p>

                  <div className='mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10'>
                    <div
                      className='h-2 rounded-full bg-primary transition-all duration-500'
                      style={{
                        width: `${
                          stats.totalGamesThisWeek > 0
                            ? (stats.predictions / stats.totalGamesThisWeek) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Win rate + points */}
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/70 p-5 shadow-xl'>
                  <div className='flex items-center gap-2'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500'>
                      <Trophy className='w-5 h-5' />
                    </div>
                    <div>
                      <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                        Win Rate
                      </h2>
                      <p className='text-sm text-gray-500 dark:text-white/60'>
                        Based on graded predictions
                      </p>
                    </div>
                  </div>

                  <div className='mt-5 flex items-center justify-between gap-4'>
                    <span className='text-4xl font-extrabold tracking-tight text-green-500'>
                      {stats.winRate}%
                    </span>

                    <div className='w-24 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden'>
                      <div
                        className='h-2 rounded-full bg-green-500 transition-all duration-500'
                        style={{ width: `${stats.winRate}%` }}
                      />
                    </div>
                  </div>

                  <p className='mt-3 text-sm text-gray-600 dark:text-white/70'>
                    Correct predictions:{" "}
                    <span className='font-semibold text-gray-900 dark:text-white'>
                      {stats.correct}
                    </span>
                  </p>
                </div>

                <div className='rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/70 p-5 shadow-xl'>
                  <div className='flex items-center gap-2'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500'>
                      <Trophy className='w-5 h-5' />
                    </div>
                    <div>
                      <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                        Weekly Points
                      </h2>
                      <p className='text-sm text-gray-500 dark:text-white/60'>
                        Your current leaderboard score
                      </p>
                    </div>
                  </div>

                  <div className='mt-5'>
                    <span className='text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white'>
                      {stats.points}
                    </span>
                  </div>

                  <p className='mt-3 text-sm text-gray-600 dark:text-white/70'>
                    Week:{" "}
                    <span className='font-medium text-gray-900 dark:text-white'>
                      {stats.weekStart && stats.weekEnd
                        ? `${stats.weekStart} → ${stats.weekEnd}`
                        : "—"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Last login */}
              <div className='rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/70 p-5 shadow-xl'>
                <div className='flex items-center gap-2'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500'>
                    <LogIn className='w-5 h-5' />
                  </div>
                  <div>
                    <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                      Last Login
                    </h2>
                    <p className='text-sm text-gray-500 dark:text-white/60'>
                      Your most recent account activity
                    </p>
                  </div>
                </div>

                <div className='mt-5'>
                  <span className='text-base font-semibold text-gray-900 dark:text-white'>
                    {lastLoginFormatted}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile logout */}
            <div className='md:hidden bg-white dark:bg-black/70 border shadow-xl rounded-lg p-5 mb-8'>
              <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                Account
              </h2>
              <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                Sign out of your GreenBall360 profile.
              </p>

              <div className='mt-4'>
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Page