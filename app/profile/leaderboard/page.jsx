'use client'

import { createClient } from '@/lib/supabase/client'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const page = () => {
  const [leaderBoardData, setLeaderBoardData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
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

  // Fetch leaderboard from API
  const fetchLeaderboard = useCallback(async () => {
    try {
      setError("")
      const res = await fetch('/api/leaderboard/public', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch leaderboard')
      setLeaderBoardData(data || [])
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    setLoading(true)
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // RealTime Subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('leaderboard-live-users')
      .on(
        'postgres_changes',
        { event: "*", schema: "public", table: "leaderboard" },
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
  }, [fetchLeaderboard]);

  return (
    <div className='w-full min-h-[calc(100vh-5rem)] flex flex-col items-center py-8 px-4 bg-gray-50 dark:bg-gray-900'>
      {/* ✅ Updating toast */}
      {isUpdating && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg">
          Updating leaderboard…
        </div>
      )}

      <div className='w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden'>
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
          <h1 className='text-2xl font-bold text-gray-800 dark:text-gray-100 text-center'>
            Weekly Leaderboard
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400 text-center mt-1'>
            Top performers based on total points and fastest completion time.
          </p>
        </div>

        {/* Loading/Error */}
        {loading && (
          <p className="py-8 text-center text-gray-500">Loading leaderboard...</p>
        )}
        {!loading && error && (
          <p className="py-8 text-center text-red-500">{error}</p>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className='overflow-x-auto'>
            <table className='min-w-full table-auto text-sm'>
              <thead className='bg-gray-100 dark:bg-gray-700'>
                <tr>
                  <th className='px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200'>Rank</th>
                  <th className='px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200'>Name</th>
                  <th className='px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200'>Points</th>
                  <th className='px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200'>Duration</th>
                </tr>
              </thead>

              <tbody>
                {leaderBoardData.map((player, index) => {
                  const isMe = userId && player.id === userId // ✅ NEW

                  return (
                    <tr
                      key={player.id}
                      className={`border-b border-gray-100 dark:border-gray-700 transition
                        ${isMe ? "bg-green-50 dark:bg-green-900/30 ring-1 ring-green-400/40" : ""}
                        ${
                          index === 0
                            ? 'bg-yellow-100 dark:bg-yellow-900/40 font-semibold'
                            : index === 1
                            ? 'bg-gray-100 dark:bg-gray-800/70'
                            : index === 2
                            ? 'bg-orange-100 dark:bg-orange-900/30'
                            : ''
                        }
                      `}
                    >
                      <td className='px-6 py-3 text-gray-700 dark:text-gray-200'>#{index + 1}</td>

                      <td className='px-6 py-3 text-gray-700 dark:text-gray-200'>
                        <div className="flex items-center gap-2">
                          <span>{player.name}</span>
                          {isMe && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-600 text-white">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      <td className='px-6 py-3 text-gray-700 dark:text-gray-200'>{player.points}</td>
                      <td className='px-6 py-3 text-gray-700 dark:text-gray-200'>{player.duration || "—"}</td>
                    </tr>
                  )
                })}

                {leaderBoardData.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">
                      No leaderboard data yet.
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

export default page