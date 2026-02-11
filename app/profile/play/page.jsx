'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

const TZ = 'Europe/London'

// YYYY-MM-DD for today in UK time
function todayYMD() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  return `${y}-${m}-${d}`
}

function addDaysYMD(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function prettyDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(dt)
}

const Page = () => {
  const [games, setGames] = useState([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [loadingPreds, setLoadingPreds] = useState(true)
  const [error, setError] = useState('')
  const [predictions, setPredictions] = useState({})
  const [savingGameId, setSavingGameId] = useState(null)
  const [now, setNow] = useState(new Date())

  // ✅ Date browsing (defaults to today in UK)
  const [selectedDate, setSelectedDate] = useState(() => todayYMD())
  const today = useMemo(() => todayYMD(), [])
  const isToday = selectedDate === today
  const isPast = selectedDate < today
  const isFuture = selectedDate > today

  // Update current time every second (for live countdowns)
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // ✅ Fetch games whenever selectedDate changes
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoadingGames(true)
        setError('')

        const url = isToday ? '/api/games' : `/api/games?date=${selectedDate}`
        const res = await fetch(url, { cache: 'no-store' })
        const data = await res.json()

        if (!res.ok) throw new Error(data?.error || 'Failed to fetch games')

        const normalised = (data || []).map((g) => ({
          id: g.id,
          home: g.home_team,
          away: g.away_team,
          startTime: g.match_time,
          status: g.status,
          result: g.result,
        }))

        setGames(normalised)
      } catch (err) {
        setError(err.message)
        setGames([])
      } finally {
        setLoadingGames(false)
      }
    }

    fetchGames()
  }, [selectedDate, isToday])

  // ✅ Fetch user predictions for games on this page (so refresh stays locked)
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoadingPreds(true)
        setError('')

        // if no games, skip
        if (!games.length) {
          setPredictions({})
          return
        }

        // ask only predictions for these games
        const ids = games.map((g) => g.id).join(',')
        const res = await fetch(`/api/predictions?game_ids=${encodeURIComponent(ids)}`, { cache: 'no-store' })
        const data = await res.json()

        if (!res.ok) throw new Error(data?.error || 'Failed to fetch predictions')

        const map = {}
        for (const p of data || []) {
          map[p.game_id] = p.prediction
        }
        setPredictions(map)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoadingPreds(false)
      }
    }

    fetchPredictions()
  }, [games])

  // Helper function: format countdown text
  const formatCountdown = (startTime) => {
    const diff = new Date(startTime) - now
    if (diff <= 0) return 'Match Started 🔒'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${hours}h ${minutes}m ${seconds}s`
  }

  // Save prediction immediately to DB
  const handlePrediction = async (match, predictionValue) => {
    // Users can only predict on TODAY (and before kickoff)
    if (!isToday) return

    const hasStarted = new Date(match.startTime) <= now
    const isLocked = Boolean(predictions[match.id])
    if (hasStarted || isLocked) return

    try {
      setSavingGameId(match.id)

      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: match.id,
          prediction: predictionValue,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to save prediction')

      setPredictions((prev) => ({
        ...prev,
        [match.id]: predictionValue,
      }))
    } catch (err) {
      alert(err.message)
    } finally {
      setSavingGameId(null)
    }
  }

  const visibleGames = useMemo(() => games, [games])
  const loading = loadingGames || loadingPreds

  // Date controls
  const goPrevDay = () => setSelectedDate((d) => addDaysYMD(d, -1))
  const goToday = () => setSelectedDate(today)
  const goNextDay = () => {
    // allow moving forward until today (no future browsing)
    if (isToday) return
    setSelectedDate((d) => {
      const next = addDaysYMD(d, 1)
      return next > today ? today : next
    })
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header + date nav */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isToday ? "Today's Predictions" : isPast ? "Previous Games" : "Upcoming Games"}
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            <CalendarDays className="w-4 h-4" />
            <span className="font-medium">{prettyDate(selectedDate)}</span> (UK)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={goPrevDay}
            className="flex-1 sm:flex-none px-3 py-2 rounded-md border bg-white dark:bg-black/40 hover:bg-gray-50 dark:hover:bg-white/10 transition flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          <button
            onClick={goToday}
            disabled={isToday}
            className="flex-1 sm:flex-none px-3 py-2 rounded-md border bg-white dark:bg-black/40 hover:bg-gray-50 dark:hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Today
          </button>

          <button
            onClick={goNextDay}
            disabled={isToday}
            className="flex-1 sm:flex-none px-3 py-2 rounded-md border bg-white dark:bg-black/40 hover:bg-gray-50 dark:hover:bg-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-gray-500">Loading games...</p>}
      {!loading && error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && visibleGames.length === 0 && (
        <p className="text-center text-gray-500 mt-10">
          No games for this day.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {visibleGames.map((match) => {
          const hasStarted = new Date(match.startTime) <= now
          const userPrediction = predictions[match.id]
          const isLocked = Boolean(userPrediction)
          const isSavingThis = savingGameId === match.id

          // lock prediction if not today (past or future)
          const lockedByDate = !isToday
          const disabled = lockedByDate || hasStarted || isLocked || isSavingThis

          return (
            <div
              key={match.id}
              className={`border rounded-xl p-4 shadow-md transition ${
                hasStarted || lockedByDate
                  ? 'bg-gray-200 dark:bg-gray-800 opacity-70'
                  : 'bg-white dark:bg-black/70'
              }`}
            >
              {/* Match Info */}
              <div className="flex justify-between items-center mb-2 gap-3">
                <h2 className="font-semibold text-lg">
                  {match.home} <span className="text-green-500">vs</span> {match.away}
                </h2>

                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    hasStarted || lockedByDate
                      ? 'text-gray-500'
                      : isLocked
                      ? 'text-blue-500'
                      : 'text-green-500'
                  }`}
                >
                  {lockedByDate
                    ? 'Read-only 🔒'
                    : hasStarted
                    ? 'Match Started 🔒'
                    : isLocked
                    ? 'Prediction Locked ✅'
                    : 'Open ⏳'}
                </span>
              </div>

              {/* Live Countdown (only today & not started) */}
              {isToday && !hasStarted && (
                <p className="text-xs text-gray-500 mb-3">
                  Starts in: <span className="font-semibold">{formatCountdown(match.startTime)}</span>
                </p>
              )}

              {/* Prediction Buttons */}
              <div className="flex justify-between gap-2">
                <button
                  disabled={disabled}
                  onClick={() => handlePrediction(match, 'homeWin')}
                  className={`flex-1 py-2 rounded-lg border transition text-sm font-medium ${
                    userPrediction === 'homeWin'
                      ? 'bg-green-500 text-white border-green-500'
                      : disabled
                      ? 'bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-900 hover:bg-green-100 dark:hover:bg-green-900'
                  }`}
                >
                  {isSavingThis ? 'Saving...' : `${match.home} Win`}
                </button>

                <button
                  disabled={disabled}
                  onClick={() => handlePrediction(match, 'draw')}
                  className={`flex-1 py-2 rounded-lg border transition text-sm font-medium ${
                    userPrediction === 'draw'
                      ? 'bg-green-500 text-white border-green-500'
                      : disabled
                      ? 'bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-900 hover:bg-green-100 dark:hover:bg-green-900'
                  }`}
                >
                  Draw
                </button>

                <button
                  disabled={disabled}
                  onClick={() => handlePrediction(match, 'awayWin')}
                  className={`flex-1 py-2 rounded-lg border transition text-sm font-medium ${
                    userPrediction === 'awayWin'
                      ? 'bg-green-500 text-white border-green-500'
                      : disabled
                      ? 'bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-900 hover:bg-green-100 dark:hover:bg-green-900'
                  }`}
                >
                  {match.away} Win
                </button>
              </div>

              {/* Show what user picked */}
              {isLocked && (
                <p className="mt-3 text-xs text-gray-500">
                  Your prediction:{' '}
                  <span className="font-semibold">
                    {userPrediction === 'homeWin'
                      ? `${match.home} Win`
                      : userPrediction === 'draw'
                      ? 'Draw'
                      : `${match.away} Win`}
                  </span>
                </p>
              )}

              {/* Show result (if finished) */}
              {match.status === 'finished' && match.result && (
                <p className="mt-2 text-xs text-gray-500">
                  Result:{' '}
                  <span className="font-semibold">
                    {match.result === 'homeWin'
                      ? `${match.home} Win`
                      : match.result === 'draw'
                      ? 'Draw'
                      : `${match.away} Win`}
                  </span>
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-center mt-10">
        <p className="text-xs text-gray-500">
          Predictions are saved instantly. Once submitted, they cannot be changed.
        </p>
        {!isToday && (
          <p className="text-xs text-gray-500 mt-2">
            You can only predict on today’s games. Past days are read-only.
          </p>
        )}
      </div>
    </div>
  )
}

export default Page
