'use client'

import { createClient } from '@/lib/supabase/client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function parseWeekStartToUTCDate(weekStartStr) {
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
  const [selectedWeekStart, setSelectedWeekStart] = useState(null)
  const [currentWeekStartFromAPI, setCurrentWeekStartFromAPI] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [userId, setUserId] = useState(null)

  const debounceRef = useRef(null)
  const hideToastRef = useRef(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) setUserId(data?.user?.id || null)
    })
  }, [])

  const fetchLeaderboard = useCallback(async () => {
    try {
      setError('')

      const qs = new URLSearchParams()
      if (userId) qs.set('user_id', userId)
      if (selectedWeekStart) qs.set('week_start', selectedWeekStart)

      const res = await fetch(`/api/leaderboard/public?${qs.toString()}`, {
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'Failed to fetch leaderboard')

      setLeaderBoardData(data?.rows || [])
      setMe(data?.me || null)
      setCurrentWeekStartFromAPI(data?.week_start || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, selectedWeekStart])

  useEffect(() => {
    setLoading(true)
    fetchLeaderboard()
  }, [fetchLeaderboard])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('leaderboard-weekly-live-users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard_weekly' },
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

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (hideToastRef.current) clearTimeout(hideToastRef.current)
      supabase.removeChannel(channel)
    }
  }, [fetchLeaderboard])

  const weekLabel = useMemo(() => {
    const ws = parseWeekStartToUTCDate(currentWeekStartFromAPI || selectedWeekStart)
    if (!ws) return 'Current week'
    const we = addDaysUTC(ws, 6)
    return `Tue ${formatYMDUTC(ws)} → Mon ${formatYMDUTC(we)}`
  }, [currentWeekStartFromAPI, selectedWeekStart])

  const isViewingCurrentWeek = useMemo(() => {
    if (!currentWeekStartFromAPI) return selectedWeekStart === null
    const viewing = selectedWeekStart || currentWeekStartFromAPI
    return viewing === currentWeekStartFromAPI
  }, [selectedWeekStart, currentWeekStartFromAPI])

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
    setSelectedWeekStart(null)
  }

  const stickyVisible = Boolean(me)

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center py-8 px-4 bg-gray-50 dark:bg-gray-900">
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

      <div className="w-full max-w-4xl mb-4 hidden md:block">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Dashboard</span>
        </Link>
      </div>

      {stickyVisible && (
        <div className="sticky top-16 z-40 w-full max-w-4xl mb-3">
          <div className="rounded-2xl border border-green-400/30 bg-green-50 dark:bg-green-900/30 px-4 py-3 shadow-sm">
            <div className="grid grid-cols-4 items-center gap-2 text-center">
              <div>
                <p className="text-[10px] text-green-700 dark:text-green-200 uppercase tracking-wide">
                  Rank
                </p>
                <p className="font-bold text-base text-green-900 dark:text-green-50">
                  #{me?.rank ?? '—'}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] text-green-700 dark:text-green-200 uppercase tracking-wide">
                  Name
                </p>
                <p className="font-semibold text-sm text-green-900 dark:text-green-50 truncate">
                  {me?.name ?? 'You'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-green-700 dark:text-green-200 uppercase tracking-wide">
                  Points
                </p>
                <span className="inline-flex items-center justify-center min-w-[52px] rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white">
                  {me?.points ?? 0}
                </span>
              </div>

              <div>
                <p className="text-[10px] text-green-700 dark:text-green-200 uppercase tracking-wide">
                  Predictions
                </p>
                <span className="inline-flex items-center justify-center min-w-[52px] rounded-full bg-blue-100 dark:bg-gray-400 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-gray-950">
                  {me?.gamesPlayed ?? 0}
                </span>
              </div>
            </div>

            <p className="mt-2 text-center text-[10px] text-green-700/80 dark:text-green-200/80">
              {weekLabel}
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 text-center">
            Weekly Leaderboard
          </h1>

          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
            Top performers based on weekly points and predictions.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-gray-600 dark:text-gray-300 text-center sm:text-left">
              <span className="font-semibold">Week:</span> {weekLabel}
            </div>

            <div className="flex items-center gap-2 justify-center sm:justify-end">
              <button
                onClick={goPrevWeek}
                className="px-3 py-2 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                ← Previous
              </button>

              <button
                onClick={goCurrentWeek}
                className="px-3 py-2 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Current Week
              </button>

              <button
                onClick={goNextWeek}
                disabled={isViewingCurrentWeek}
                className={`px-3 py-2 text-[11px] rounded-lg border transition ${
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

        {loading && (
          <p className="py-8 text-center text-gray-500 text-sm">Loading leaderboard...</p>
        )}

        {!loading && error && (
          <p className="py-8 text-center text-red-500 text-sm">{error}</p>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-xs md:text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide text-[11px]">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide text-[11px]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide text-[11px]">
                    Points
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide text-[11px]">
                    Predictions
                  </th>
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
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-200">
                          <span
                            className={`inline-flex items-center justify-center min-w-[34px] px-2 py-1 rounded-md text-[11px] font-bold ${rankBadge}`}
                          >
                            {player.rank}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[160px] md:max-w-[220px] font-medium">
                              {player.name}
                            </span>
                            {isMe && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-600 text-white">
                                You
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[52px] rounded-full bg-green-600 px-2.5 py-1 text-[11px] font-bold text-white">
                            {player.points}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[52px] rounded-full bg-blue-100 dark:bg-gray-400 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-gray-950">
                            {player.gamesPlayed ?? 0}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>

                {leaderBoardData.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500 text-sm">
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