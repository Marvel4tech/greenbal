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
    correct: 0,
    points: 0,
    winRate: 0,
    weekStart: null,
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

            <div className='bg-white dark:bg-black/70 border shadow-xl rounded-lg p-5'>
              <div className='flex items-center gap-2'>
                <Gamepad2 className='w-5 h-5 text-primary' />
                <h2 className='text-lg font-semibold'>Matches predicted this week</h2>
              </div>

              <div className='mt-4'>
                <span className='text-4xl font-bold text-primary'>
                  {stats.predictions}
                </span>
              </div>
            </div>

            <div className='bg-white dark:bg-black/70 border shadow-xl rounded-lg p-5'>
              <div className='flex items-center gap-2'>
                <Trophy className='w-5 h-5 text-yellow-500' />
                <h2 className='text-lg font-semibold'>Win Rate</h2>
              </div>

              <div className='mt-4'>
                <span className='text-4xl font-bold text-green-500'>
                  {stats.winRate}%
                </span>
              </div>
            </div>

            <div className='bg-white dark:bg-black/70 border shadow-xl rounded-lg p-5'>
              <div className='flex items-center gap-2'>
                <LogIn className='w-5 h-5 text-purple-500' />
                <h2 className='text-lg font-semibold'>Last Login</h2>
              </div>

              <div className='mt-4'>
                <span className='text-base font-medium'>
                  {lastLoginFormatted}
                </span>
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