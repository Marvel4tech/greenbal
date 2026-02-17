'use client'

import { createClient } from '@/lib/supabase/client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function parseWeekStartToUTCDate(weekStartStr) {
  // weekStartStr like "2026-02-10"
  if (!weekStartStr) return null
  const [y, m, d] = weekStartStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
}

function formatYMDUTC(d) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDaysUTC(d, days) {
  const nd = new Date(d.getTime())
  nd.setUTCDate(nd.getUTCDate() + days)
  return nd
}

function addWeeksUTC(d, weeks) {
  return addDaysUTC(d, weeks * 7)
}

const Page = () => {
  const [leaderBoardData, setLeaderBoardData] = useState([])
  const [me, setMe] = useState(null)

  // Selected week (string "YYYY-MM-DD"). null means "current week" (API decides)
  const [selectedWeekStart, setSelectedWeekStart] = useState(null)

  // The API tells us what it used as week_start (always set after fetch)
  const [currentWeekStartFromAPI, setCurrentWeekStartFromAPI] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [userId, setUserId] = useState(null)

  const debounceRef = useRef(null)
  const hideToastRef = useRef(null)

  // Get current user Id
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) setUserId(data?.user?.id || null)
    })
  }, [])

  // Fetch leaderboard (supports week selection)
  const fetchLeaderboard = useCallback(async () => {
    try {
      setError('')

      const qs = new URLSearchParams()
      if (userId) qs.set('user_id', userId)
      if (selectedWeekStart) qs.set('week_start', selectedWeekStart)

      const res = await fetch(`/api/leaderboard/public?${qs.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch leaderboard')

      setLeaderBoardData(data?.rows || [])
      setMe(data?.me || null)

      // API should return { week_start: "YYYY-MM-DD" }
      setCurrentWeekStartFromAPI(data?.week_start || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, selectedWeekStart])

  // Initial fetch + refetch when userId or selectedWeekStart changes
  useEffect(() => {
    setLoading(true)
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // Realtime subscription (weekly table)
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('leaderboard-weekly-live-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard_weekly' }, () => {
        setIsUpdating(true)

        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          fetchLeaderboard()
        }, 250)

        if (hideToastRef.current) clearTimeout(hideToastRef.current)
        hideToastRef.current = setTimeout(() => {
          setIsUpdating(false)
        }, 1200)
      })
      .subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (hideToastRef.current) clearTimeout(hideToastRef.current)
      supabase.removeChannel(channel)
    }
  }, [fetchLeaderboard])

  // Build week label "Tue 2026-02-10 → Mon 2026-02-16"
  const weekLabel = useMemo(() => {
    const ws = parseWeekStartToUTCDate(currentWeekStartFromAPI || selectedWeekStart)
    if (!ws) return 'Current week'
    const we = addDaysUTC(ws, 6)
    return `Tue ${formatYMDUTC(ws)} → Mon ${formatYMDUTC(we)}`
  }, [currentWeekStartFromAPI, selectedWeekStart])

  // Disable "Next" when already at current week (API current week)
  const isViewingCurrentWeek = useMemo(() => {
    if (!currentWeekStartFromAPI) return selectedWeekStart === null // before first fetch
    const viewing = selectedWeekStart || currentWeekStartFromAPI
    return viewing === currentWeekStartFromAPI
  }, [selectedWeekStart, currentWeekStartFromAPI])

  // Selected week date as UTC Date (use API week_start as fallback)
  const selectedWeekDate = useMemo(() => {
    const ws = selectedWeekStart || currentWeekStartFromAPI
    return parseWeekStartToUTCDate(ws)
  }, [selectedWeekStart, currentWeekStartFromAPI])

  const goPrevWeek = () => {
    if (!selectedWeekDate) return
    const prev = addWeeksUTC(selectedWeekDate, -1)
    setSelectedWeekStart(formatYMDUTC(prev))
  }

  const goNextWeek = () => {
    if (!selectedWeekDate) return
    const next = addWeeksUTC(selectedWeekDate, 1)
    setSelectedWeekStart(formatYMDUTC(next))
  }

  const goCurrentWeek = () => {
    // remove param -> API uses present week
    setSelectedWeekStart(null)
  }

  const stickyVisible = Boolean(me)

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center py-8 px-4 bg-gray-50 dark:bg-gray-900">
      {/* Updating toast */}
      <AnimatePresence>
        {isUpdating && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="fixed bottom-6 right-6 z-50 bg-black text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg"
          >
            Updating leaderboard…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky “Your Rank” */}
      {stickyVisible && (
        <div className="sticky top-16 z-40 w-full max-w-4xl mb-3">
          <div className="rounded-2xl border border-green-400/30 bg-green-50 dark:bg-green-900/30 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-green-700 dark:text-green-200">Your Rank</p>
                <p className="font-semibold text-green-900 dark:text-green-50 truncate">
                  #{me?.rank ?? '—'} • {me?.name ?? 'You'}
                </p>
                <p className="text-[10px] text-green-700/80 dark:text-green-200/80">{weekLabel}</p>
              </div>

              <div className="text-right">
                <p className="text-xs text-green-700 dark:text-green-200">Points</p>
                <p className="font-bold text-green-900 dark:text-green-50">{me?.points ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center">
            Weekly Leaderboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
            Top performers based on total points and fastest completion time.
          </p>

          {/* ✅ Week controls */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-semibold">Week:</span> {weekLabel}
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={goPrevWeek}
                className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                ← Previous
              </button>

              <button
                onClick={goCurrentWeek}
                className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Current Week
              </button>

              <button
                onClick={goNextWeek}
                disabled={isViewingCurrentWeek}
                className={`px-3 py-2 text-xs rounded-lg border transition ${
                  isViewingCurrentWeek
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Loading/Error */}
        {loading && <p className="py-8 text-center text-gray-500">Loading leaderboard...</p>}
        {!loading && error && <p className="py-8 text-center text-red-500">{error}</p>}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Rank</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Points</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Duration</th>
                </tr>
              </thead>

              <tbody>
                <AnimatePresence initial={false}>
                  {leaderBoardData.map((player) => {
                    const isMe = userId && player.id === userId

                    const bandStyle =
                      player.rank >= 1 && player.rank <= 5
                        ? 'bg-yellow-100 dark:bg-yellow-900/40 font-semibold'
                        : player.rank >= 6 && player.rank <= 8
                        ? 'bg-gray-100 dark:bg-gray-800/70'
                        : player.rank >= 9 && player.rank <= 10
                        ? 'bg-orange-100 dark:bg-orange-900/30'
                        : ''

                    const rankBadge =
                      player.rank >= 1 && player.rank <= 5
                        ? 'bg-yellow-300 text-yellow-900 dark:bg-yellow-200'
                        : player.rank >= 6 && player.rank <= 8
                        ? 'bg-gray-300 text-gray-900 dark:bg-gray-200'
                        : player.rank >= 9 && player.rank <= 10
                        ? 'bg-orange-300 text-orange-900 dark:bg-orange-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'

                    return (
                      <motion.tr
                        key={player.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        className={`border-b border-gray-100 dark:border-gray-700 transition ${bandStyle} ${
                          isMe ? 'ring-1 ring-green-400/40 bg-green-50 dark:bg-green-900/30' : ''
                        }`}
                      >
                        <td className="px-6 py-3 text-gray-700 dark:text-gray-200">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${rankBadge}`}>
                            {player.rank}
                          </span>
                        </td>

                        <td className="px-6 py-3 text-gray-700 dark:text-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[220px]">{player.name}</span>
                            {isMe && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-600 text-white">
                                You
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-3 text-gray-700 dark:text-gray-200">{player.points}</td>
                        <td className="px-6 py-3 text-gray-700 dark:text-gray-200">{player.duration || '—'}</td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>

                {leaderBoardData.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">
                      No leaderboard data for this week.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Page