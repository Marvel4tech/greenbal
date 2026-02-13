'use client'

import { createClient } from '@/lib/supabase/client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const Page = () => {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  //week navigation
  const [weekStart, setWeekStart] = useState(null) // "YYYY-MM-DD" (UTC Tue)
  const [weekLabel, setWeekLabel] = useState("")

  // small debounce so multiple row updates don’t spam fetches
  const debounceRef = useRef(null)
  const hideToastRef = useRef(null)
  const subDebounceRef = useRef(null)

  // --- Helpers (UTC) ---
  const pad2 = (n) => String(n).padStart(2, "0")
  const toYMD = (d) =>
    `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`

  const addDaysUTC = (ymd, days) => {
    const [y, m, d] = ymd.split("-").map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + days)
    return toYMD(dt)
  }

  const formatWeekRange = (ymd) => {
    // weekStart is Tue (UTC). Week ends Mon (UTC) = +6 days
    const [y, m, d] = ymd.split("-").map(Number)
    const start = new Date(Date.UTC(y, m - 1, d))
    const end = new Date(Date.UTC(y, m - 1, d + 6))
    const fmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" })
    return `${fmt.format(start)} – ${fmt.format(end)} (UTC)`
  }

  // get current weekStart from RPC (Tue->Mon) once
  useEffect(() => {
    const loadCurrentWeek = async () => {
      try {
        setError("")
        const res = await fetch('/api/leaderboard?week=current', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to get current week")
        // expect { week_start: "YYYY-MM-DD" }
        const ws = data.week_start
        setWeekStart(ws)
        setWeekLabel(formatWeekRange(ws))
      } catch (e) {
        setError(e.message)
      }
    }
    loadCurrentWeek()
  }, [])

  const fetchLeaderboard = useCallback(async (ws) => {
    if (!ws) return
    try {
      setError("")
      setLoading(true)
      const res = await fetch(`/api/leaderboard?week_start=${encodeURIComponent(ws)}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch leaderboard')
      setPlayers(data || [])
      setWeekLabel(formatWeekRange(ws))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch + when weekStart changes
  useEffect(() => {
    if (!weekStart) return
    fetchLeaderboard(weekStart)
  }, [weekStart, fetchLeaderboard])

  // Realtime subscription (only refetch for current selected week)
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("leaderboard-weekly-live")
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard_weekly' },
        () => {
          // show toast immediately
          setIsUpdating(true)

          // debounce re-fetch to avoid spam
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => {
            fetchLeaderboard(weekStart)
          }, 250)

          // auto-hide toast
          if (hideToastRef.current) clearTimeout(hideToastRef.current)
          hideToastRef.current = setTimeout(() => {
            setIsUpdating(false)
          }, 1200)
        }
      )
      .subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (hideToastRef.current) clearTimeout(hideToastRef.current)
      if (subDebounceRef.current) clearTimeout(subDebounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [fetchLeaderboard, weekStart])

  const highestPoint = useMemo(
    () => (players.length ? Math.max(...players.map((p) => p.points || 0)) : 0),
    [players]
  )

  // week nav handlers
  const goPrevWeek = () => {
    if (!weekStart) return
    setWeekStart(addDaysUTC(weekStart, -7))
  }

  const goNextWeek = () => {
    if (!weekStart) return
    setWeekStart(addDaysUTC(weekStart, 7))
  }

  const goCurrentWeek = async () => {
    try {
      setError("")
      const res = await fetch('/api/leaderboard?week=current', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to get current week")
      setWeekStart(data.week_start)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Live updating toast */}
      {isUpdating && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg">
          Updating leaderboard…
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-center sm:text-left">
            Leaderboard
          </h1>
          <p className="text-xs text-gray-500 text-center sm:text-left mt-1">
            Week: <span className="font-medium">{weekLabel || "—"}</span>
          </p>
        </div>

        {/* Week controls */}
        <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
          <button
            onClick={goPrevWeek}
            className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={!weekStart}
          >
            ← Previous
          </button>

          <button
            onClick={goCurrentWeek}
            className="px-3 py-2 rounded-lg bg-primary text-white text-sm hover:opacity-90"
          >
            Current Week
          </button>

          <button
            onClick={goNextWeek}
            className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={!weekStart}
          >
            Next →
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-gray-500">Loading leaderboard...</p>}
      {!loading && error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          {/* Quick Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center shadow">
              <h3 className="text-sm text-gray-600 dark:text-gray-300">
                Total Players
              </h3>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {players.length}
              </p>
            </div>

            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg text-center shadow">
              <h3 className="text-sm text-gray-600 dark:text-gray-300">
                Highest Points
              </h3>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {highestPoint}
              </p>
            </div>

            <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg text-center shadow">
              <h3 className="text-sm text-gray-600 dark:text-gray-300">
                Top Player
              </h3>
              <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                {players[0]?.name || "—"}
              </p>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white dark:bg-black/50 rounded-xl shadow-lg overflow-x-auto border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm md:text-base">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="p-3 text-left">Rank</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Points</th>
                </tr>
              </thead>

              <tbody>
                {players.map((player) => {
                  const rank = player.rank

                  const badgeStyle =
                    rank >= 1 && rank <= 5
                      ? "bg-yellow-300 text-yellow-900"
                      : rank >= 6 && rank <= 8
                      ? "bg-gray-300 text-gray-900"
                      : rank >= 9 && rank <= 10
                      ? "bg-orange-300 text-orange-900"
                      : "bg-gray-100 dark:bg-gray-700"

                  return (
                    <tr
                      key={player.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <td className="p-3 font-semibold">
                        <span className={`px-2 py-1 rounded-md text-sm ${badgeStyle}`}>
                          {rank}
                        </span>
                      </td>

                      <td className="p-3">{player.name}</td>

                      <td className="p-3 text-xs md:text-sm text-gray-600 dark:text-gray-300">
                        {player.email || "—"}
                      </td>

                      <td className="p-3 font-bold text-primary">{player.points}</td>
                    </tr>
                  )
                })}

                {players.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">
                      No leaderboard data yet for this week.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default Page
