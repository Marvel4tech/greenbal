"use client"

import ProfileUserCard from "@/components/ProfileUserCard"
import ProfileCompletionMeter from "@/components/ProfileCompletionMeter"
import SignOutButton from "@/components/SignOutButton"
import EnablePushNotifications from "@/components/EnablePushNotifications"
import ProfileNewsSlider from "@/components/ProfileNewsSlider"

import {
  Gamepad2,
  LogIn,
  Trophy,
  Home,
  Wallet2,
  User2,
  Gift,
} from "lucide-react"

import Link from "next/link"
import React, { useEffect, useRef, useState, useCallback } from "react"
import { usePathname } from "next/navigation"

function formatLastLogin(dateString) {
  if (!dateString) return "—"

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
    hour: "2-digit",
    minute: "2-digit",
  })

  if (isSameDay) return `Today at ${time}`
  if (isYesterday) return `Yesterday at ${time}`

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function labelPrediction(p) {
  if (p === "homeWin") return "Home Win"
  if (p === "draw") return "Draw"
  if (p === "awayWin") return "Away Win"
  return "—"
}

const Page = () => {
  const pathname = usePathname()

  const siderlinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "Leaderboard", href: "/profile/leaderboard", icon: Trophy },
    { label: "Predict", href: "/profile/play", icon: Gamepad2 },
    { label: "Rewards Wallet", href: "/profile/wallet", icon: Wallet2 },
    { label: "Referrals", href: "/profile/referrals", icon: User2 },
  ]

  const isActive = (href) => pathname === href || pathname?.startsWith(href + "/")

  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState("")

  const [stats, setStats] = useState({
    predictions: 0,
    totalGamesThisWeek: 0,
    correct: 0,
    points: 0,
    winRate: 0,
    weekStart: null,
    weekEnd: null,
    lastLogin: null,
    recentPredictions: [],
  })

  const loadProfile = useCallback(async () => {
    try {
      setProfileError("")
      setProfileLoading(true)

      const res = await fetch("/api/profile", { cache: "no-store" })
      const text = await res.text()

      let data = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error("Server did not return JSON.")
      }

      if (!res.ok) throw new Error(data?.error || "Failed to load profile")
      setProfile(data)
    } catch (e) {
      setProfileError(e.message)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/stats", { cache: "no-store" })
      const text = await res.text()

      let data = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error("Server did not return JSON.")
      }

      if (!res.ok) throw new Error(data?.error || "Failed to load stats")

      setStats({
        predictions: Number(data?.predictions || 0),
        totalGamesThisWeek: Number(data?.totalGamesThisWeek || 0),
        correct: Number(data?.correct || 0),
        points: Number(data?.points || 0),
        winRate: Number(data?.winRate || 0),
        weekStart: data?.weekStart || null,
        weekEnd: data?.weekEnd || null,
        lastLogin: data?.lastLogin || null,
        recentPredictions: Array.isArray(data?.recentPredictions)
          ? data.recentPredictions
          : [],
      })
    } catch (e) {
      console.error("Stats error:", e.message)
    }
  }, [])

  useEffect(() => {
    loadProfile()
    loadStats()
  }, [loadProfile, loadStats])

  const lastLoginFormatted = formatLastLogin(stats.lastLogin)

  const buttonSize = 84
  const [fabPosition, setFabPosition] = useState({ x: 0, y: 0 })
  const [fabReady, setFabReady] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const dragDataRef = useRef({
    dragging: false,
    moved: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  })

  useEffect(() => {
    const setInitialPosition = () => {
      if (typeof window === "undefined") return

      const padding = 16
      const x = window.innerWidth - buttonSize - padding
      const y = window.innerHeight - buttonSize - 110

      setFabPosition({ x, y })
      setFabReady(true)
    }

    setInitialPosition()

    const handleResize = () => {
      const padding = 16
      setFabPosition((prev) => {
        const maxX = window.innerWidth - buttonSize - padding
        const maxY = window.innerHeight - buttonSize - padding

        return {
          x: Math.min(Math.max(prev.x, padding), maxX),
          y: Math.min(Math.max(prev.y, padding), maxY),
        }
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handlePointerDown = (e) => {
    dragDataRef.current.dragging = true
    dragDataRef.current.moved = false
    dragDataRef.current.startX = e.clientX
    dragDataRef.current.startY = e.clientY
    dragDataRef.current.offsetX = e.clientX - fabPosition.x
    dragDataRef.current.offsetY = e.clientY - fabPosition.y
    setIsDragging(false)
  }

  const handlePointerMove = (e) => {
    if (!dragDataRef.current.dragging) return

    const deltaX = Math.abs(e.clientX - dragDataRef.current.startX)
    const deltaY = Math.abs(e.clientY - dragDataRef.current.startY)

    if (deltaX > 5 || deltaY > 5) {
      dragDataRef.current.moved = true
      setIsDragging(true)
    }

    const padding = 12
    const maxX = window.innerWidth - buttonSize - padding
    const maxY = window.innerHeight - buttonSize - padding

    const nextX = e.clientX - dragDataRef.current.offsetX
    const nextY = e.clientY - dragDataRef.current.offsetY

    setFabPosition({
      x: Math.min(Math.max(nextX, padding), maxX),
      y: Math.min(Math.max(nextY, padding), maxY),
    })
  }

  const handlePointerUp = () => {
    dragDataRef.current.dragging = false
    setTimeout(() => setIsDragging(false), 50)
  }

  const handleFabClick = (e) => {
    if (dragDataRef.current.moved || isDragging) {
      e.preventDefault()
    }
  }

  return (
    <section className="bg-gray-100 dark:bg-gray-800 rounded-sm relative">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)] px-4 md:py-8 max-w-7xl mx-auto md:gap-12 pb-8 md:pb-10">
        {/* Sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-40 lg:w-56">
          <div className="py-6 border-b border-primary">
            <h2 className="text-xl font-bold">My Dashboard</h2>
          </div>

          <nav className="flex flex-col flex-1 space-y-3 mt-10">
            {siderlinks.map(({ label, href, icon: Icon }) => {
              const active = isActive(href)

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex gap-2 items-center p-2 rounded-md transition ${
                    active
                      ? "bg-green-200 dark:bg-white/10 font-semibold"
                      : "hover:bg-green-200 dark:hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-6">
            <SignOutButton />
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 relative">
          {/* Top horizontal news slider */}
          <div className="min-w-0 px-0 pt-4 md:px-0 md:pt-6">
            <ProfileNewsSlider />
          </div>

          <div className="flex min-w-0 flex-col md:flex-row pt-4 pb-6 md:pb-8 gap-6">
            {/* Left */}
            <div className="min-w-0 flex-1">
              <ProfileUserCard
                profile={profile}
                onProfileUpdated={(updated) => setProfile(updated)}
              />
            </div>

            {/* Right */}
            <div className="min-w-0 flex-1 flex flex-col gap-6">
              <div>
                {profileLoading ? (
                  <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/50 p-5 shadow-xl">
                    <p className="text-sm text-gray-500">Loading profile completion…</p>
                  </div>
                ) : profileError ? (
                  <div className="rounded-3xl border border-red-200 dark:border-red-700 bg-white dark:bg-black/50 p-5 shadow-xl">
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

              <EnablePushNotifications />

              {/* Recent Predictions */}
              <div className="relative min-w-0 overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/70 shadow-2xl">
                <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative p-5 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Gamepad2 className="w-5 h-5" />
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Recent Predictions
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-white/60">
                          Your last 10 predictions
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary">
                      This week
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-1 text-[10px] font-medium text-gray-700 dark:text-white/70">
                      {stats.predictions} predicted
                    </div>

                    <div className="rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-1 text-[10px] font-medium text-gray-700 dark:text-white/70">
                      {stats.totalGamesThisWeek} matches
                    </div>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[500px] text-xs">
                    <thead className="bg-gray-50 dark:bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left">Game</th>
                        <th className="px-4 py-3 text-left">Prediction</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Points</th>
                      </tr>
                    </thead>

                    <tbody>
                      {stats.recentPredictions?.length > 0 ? (
                        stats.recentPredictions.slice(0, 10).map((p) => {
                          const g = p.games
                          const gameLabel = g
                            ? `${g.home_team} vs ${g.away_team}`
                            : "—"

                          const finished = g?.status === "finished"
                          const correct =
                            finished && g?.result && p?.prediction === g?.result

                          return (
                            <tr
                              key={p.id}
                              className="border-t border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                            >
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                {gameLabel}
                              </td>

                              <td className="px-4 py-3">
                                <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                                  {labelPrediction(p.prediction)}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-gray-700 dark:text-white/70">
                                {!finished ? (
                                  <span className="text-gray-500 dark:text-white/60">
                                    Pending
                                  </span>
                                ) : correct ? (
                                  <span className="font-medium text-green-600">
                                    ✅ Correct
                                  </span>
                                ) : (
                                  <span className="font-medium text-red-500">
                                    ❌ Wrong
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                                {Number(p.points ?? 0)}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 py-8 text-center text-xs text-gray-500 dark:text-white/60"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span>No predictions made yet this week.</span>
                              <p className="mt-2 text-[11px] text-gray-500 dark:text-white/50 max-w-md">
                                Start predicting early. The more matches you predict,
                                the better your chance to move higher on the leaderboard
                                and win weekly rewards.
                              </p>
                              <Link
                                href="/profile/play"
                                className="mt-3 text-primary font-medium hover:underline"
                              >
                                Start predicting now
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-gray-200 dark:border-white/10 px-4 py-3">
                  <p className="text-[11px] leading-5 text-gray-600 dark:text-white/70">
                    The more matches you predict, the better your chances of reaching
                    the top of the leaderboard and winning the weekly reward.
                  </p>
                </div>
              </div>

              {/* Win rate + points */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/70 p-6 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                      <Trophy className="w-5 h-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Win Rate
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-white/60">
                        Based on predictions
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-4xl font-extrabold text-green-500">
                      {stats.winRate}%
                    </span>

                    <div className="w-24 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-green-500 rounded-full transition-all"
                        style={{ width: `${stats.winRate}%` }}
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-600 dark:text-white/70">
                    Correct: <span className="font-semibold">{stats.correct}</span>
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/70 p-6 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                      <Trophy className="w-5 h-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Weekly Points
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-white/60">
                        Leaderboard score
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                      {stats.points}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-600 dark:text-white/70">
                    {stats.weekStart && stats.weekEnd
                      ? `${stats.weekStart} → ${stats.weekEnd}`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Last login */}
              <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/70 p-6 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                    <LogIn className="w-5 h-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Last Login
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-white/60">
                      Recent activity
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    {lastLoginFormatted}
                  </span>
                </div>
              </div>

              {/* Mobile logout */}
              <div className="md:hidden bg-white dark:bg-black/70 border border-gray-200 dark:border-white/10 shadow-2xl rounded-3xl p-5 mb-8">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Account
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Sign out of your GreenBall360 profile.
                </p>

                <div className="mt-4">
                  <SignOutButton />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile floating draggable referral button */}
          {fabReady && (
            <Link
              href="/profile/referrals"
              onClick={handleFabClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="md:hidden fixed z-50 flex flex-col items-center justify-center rounded-full bg-primary text-black shadow-2xl select-none touch-none"
              style={{
                left: `${fabPosition.x}px`,
                top: `${fabPosition.y}px`,
                width: `${buttonSize}px`,
                height: `${buttonSize}px`,
              }}
            >
              <Gift className="h-6 w-6" />
              <span className="mt-1 text-[11px] font-semibold leading-none">
                Referrals
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

export default Page