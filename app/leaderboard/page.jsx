"use client"

import Link from "next/link"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Crown, Sparkles, ArrowRight, Info, ShieldCheck } from "lucide-react"
import Navbar from "@/components/Navbar"

const Page = () => {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const debounceRef = useRef(null)
  const hideToastRef = useRef(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setError("")
      const res = await fetch("/api/leaderboard/public", { cache: "no-store" })
      const text = await res.text()

      let data = []
      try {
        data = text ? JSON.parse(text) : []
      } catch {
        throw new Error("Server did not return JSON")
      }

      if (!res.ok) throw new Error(data?.error || "Failed to fetch leaderboard")
      setPlayers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // OPTIONAL realtime hook (only works if your Supabase realtime is enabled on the table you listen to).
  // If you don't want realtime here, remove this whole effect.
  useEffect(() => {
    // If you don't have createClient in this public page, comment this out.
    // This is safe to keep as long as createClient exists.
    let supabase
    let channel

    const setup = async () => {
      try {
        const mod = await import("@/lib/supabase/client")
        supabase = mod.createClient()

        channel = supabase
          .channel("public-weekly-leaderboard")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "leaderboard_weekly" },
            () => {
              setIsUpdating(true)

              if (debounceRef.current) clearTimeout(debounceRef.current)
              debounceRef.current = setTimeout(() => {
                fetchLeaderboard()
              }, 250)

              if (hideToastRef.current) clearTimeout(hideToastRef.current)
              hideToastRef.current = setTimeout(() => {
                setIsUpdating(false)
              }, 1200)
            }
          )
          .subscribe()
      } catch {
        // ignore if module not found
      }
    }

    setup()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (hideToastRef.current) clearTimeout(hideToastRef.current)
      try {
        if (supabase && channel) supabase.removeChannel(channel)
      } catch {}
    }
  }, [fetchLeaderboard])

  // Always show current week window (Tue → Mon) even if players is empty
  const weekLabel = useMemo(() => {
    // Preferred: read from DB response (if we have it)
    const raw = players?.[0]?.week_start

    // Fallback: compute current week_start in UTC (Tuesday-based)
    const getWeekStartTuesdayUTC = (isoOrDate = new Date()) => {
      const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : new Date(isoOrDate)
      // force UTC midnight
      const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      const day = utc.getUTCDay() // Sun=0 ... Sat=6

      // We want Tuesday = 2 as start
      // Calculate how many days back to reach Tuesday
      // Example: Tue(2)->0, Wed(3)->1, Mon(1)->6, Sun(0)->5
      const diff = (day - 2 + 7) % 7
      utc.setUTCDate(utc.getUTCDate() - diff)

      return utc
    }

    const start = raw ? new Date(`${raw}T00:00:00Z`) : getWeekStartTuesdayUTC(new Date())
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 6)

    const fmt = (d) =>
      new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(d)

    return `${fmt(start)} – ${fmt(end)}`
  }, [players])
  

  const podium = useMemo(() => {
    const top = players.slice(0, 3)
    const [first, second, third] = top
    return { first, second, third }
  }, [players])

  const rankMeta = (rank) => {
    if (rank >= 1 && rank <= 5) {
      return {
        row: "bg-yellow-50 dark:bg-yellow-900/30",
        badge: "bg-yellow-300 text-yellow-950",
        ring: "ring-1 ring-yellow-400/40",
        label: "Gold",
      }
    }
    if (rank >= 6 && rank <= 8) {
      return {
        row: "bg-gray-50 dark:bg-gray-800/60",
        badge: "bg-gray-300 text-gray-900",
        ring: "ring-1 ring-gray-400/40",
        label: "Silver",
      }
    }
    if (rank >= 9 && rank <= 10) {
      return {
        row: "bg-orange-50 dark:bg-orange-900/20",
        badge: "bg-orange-300 text-orange-950",
        ring: "ring-1 ring-orange-400/40",
        label: "Bronze",
      }
    }
    return {
      row: "",
      badge: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100",
      ring: "",
      label: "",
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Navbar - Full width */}
      <div className="w-full border-b border-gray-200 dark:border-gray-800">
        <Navbar />
      </div>

      {/* Updating toast */}
      {isUpdating && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg">
          Updating leaderboard…
        </div>
      )}

      {/* Main content - Centered with max width */}
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 space-y-8">
          {/* Header */}
          <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 w-fit">
                  <Trophy className="w-4 h-4 text-primary" />
                  Weekly Leaderboard <span className="text-gray-500 dark:text-gray-400">•</span>
                  <span className="font-semibold text-primary">Resets Tuesday</span>
                </div>

                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                    Top 50 Players
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Week: <span className="font-semibold">{weekLabel}</span> • Top 50 only
                  </p>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl">
                  <span className="font-semibold text-primary">Urgency:</span> leaderboard resets every{' '}
                  <span className="font-semibold">Tuesday</span> (UTC). Get your predictions in early to climb faster.
                </p>

                <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    3 / 1 / 0 scoring
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700">
                    <Info className="w-4 h-4 text-primary" />
                    Results update leaderboard
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="lg:w-80 shrink-0 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-white dark:from-white/5 dark:to-black/20 p-5">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Want your name here next week?
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  Sign up, predict daily, and compete for <span className="font-semibold text-primary">cash prizes for Top 5</span>.
                </p>

                <div className="mt-4 flex gap-2">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-black font-semibold text-sm hover:opacity-90 transition flex-1"
                  >
                    Create account <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 hover:bg-white/60 dark:hover:bg-white/10 transition"
                  >
                    Log in
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Loading / Error */}
          {loading && (
            <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-300">Loading leaderboard…</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="bg-white dark:bg-black/40 border border-red-200 dark:border-red-800 rounded-2xl p-8 shadow-sm">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => fetchLeaderboard()}
                className="mt-4 text-xs px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:opacity-90 transition"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Animated Podium */}
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                {/* 2nd */}
                <PodiumCard
                  place={2}
                  player={podium.second}
                  accent="bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                  icon={<Sparkles className="w-4 h-4" />}
                />
                {/* 1st */}
                <PodiumCard
                  place={1}
                  player={podium.first}
                  accent="bg-gradient-to-b from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-900/10 border border-yellow-200 dark:border-yellow-800"
                  crown
                  icon={<Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
                />
                {/* 3rd */}
                <PodiumCard
                  place={3}
                  player={podium.third}
                  accent="bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                  icon={<Sparkles className="w-4 h-4" />}
                />
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Leaderboard <span className="text-gray-500 dark:text-gray-400">(Top 50)</span>
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50/80 dark:bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">
                          Player
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">
                          Points
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">
                          Duration
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      <AnimatePresence initial={false}>
                        {players.map((p) => {
                          const meta = rankMeta(p.rank)

                          return (
                            <motion.tr
                              key={p.id}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                              className={`${meta.row} ${meta.ring} hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors`}
                            >
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center justify-center min-w-[44px] px-2.5 py-1 rounded-lg text-xs font-bold ${meta.badge}`}
                                >
                                  {p.rank}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-medium">
                                {p.name || "Unknown"}
                              </td>

                              <td className="px-6 py-4">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {p.points ?? 0}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">pts</span>
                              </td>

                              <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                                {p.duration || "—"}
                              </td>
                            </motion.tr>
                          )
                        })}
                      </AnimatePresence>

                      {players.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-16 text-gray-500 dark:text-gray-400">
                            No leaderboard data yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black/40 dark:to-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="space-y-2">
                    <p className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                      Ready to compete for cash?
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                      Predict match results daily, earn points, and fight for the{' '}
                      <span className="font-semibold text-primary">Top 5 cash prizes</span>. 
                      Join thousands of players already competing.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-black font-semibold text-sm hover:opacity-90 transition shadow-sm"
                    >
                      Join greenball360 <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/profile/play"
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 hover:bg-white/60 dark:hover:bg-white/10 transition"
                    >
                      Today’s games
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function PodiumCard({ place, player, accent, crown = false, icon }) {
  const placeLabel =
    place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className={`rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden ${accent}`}
    >
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-100">
            {icon}
            {placeLabel} Place
          </div>
          {crown && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-yellow-900 bg-yellow-300 px-3 py-1 rounded-full">
              <Crown className="w-4 h-4" />
              Leader
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
            {player?.name || "—"}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            Rank #{player?.rank ?? "—"} • Points: <span className="font-semibold">{player?.points ?? 0}</span>
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default Page
