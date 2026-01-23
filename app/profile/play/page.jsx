'use client'

import React, { useEffect, useMemo, useState } from 'react'

const page = () => {
  const [games, setGames] = useState([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [loadingPreds, setLoadingPreds] = useState(true)
  const [error, setError] = useState("")
  const [predictions, setPredictions] = useState({})
  const [savingGameId, setSavingGameId] = useState(null)
  const [now, setNow] = useState(new Date())

  // Update current time every second (for live countdowns)
  useEffect(() => {
    const interval = setInterval(() => setNow(
      new Date()
    ), 1000)
    return () => clearInterval(interval)
  }, []);

  // Fetch games from DB
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoadingGames(true)
        setError("")

        const res = await fetch('/api/games/today', { cache: 'no-store' })
        const data = await res.json()

        if (!res.ok) throw new Error(data?.error || 'Failed to fetch games')

        // Normalize DB rows to what the UI expects
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
      } finally {
        setLoadingGames(false)
      }
    }

    fetchGames()
  }, [])

  // Fetch user's existing predictions (so refresh stays locked)
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoadingPreds(true)
        setError("")

        const res = await fetch('/api/predictions', { cache: 'no-store' })
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || 'Failed to fetch predictions')

        // Convert array -> map keyed by game_id
        const map = {}
        for (const p of data || []) {
          map[p.game_id] = p.prediction
        }
        setPredictions(map)
      } catch (err) {
        // If user isn't logged in, /api/predictions returns 401
        setError(err.message)
      } finally {
        setLoadingPreds(false)
      }
    }

    fetchPredictions();
  }, [])

  /* const handlePrediction = (matchId, result) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: result,
    }))
  } */

  // Helper function: format countdown text
  const formatCountdown = (startTime) => {
    const diff = new Date(startTime) - now
    if (diff <= 0) return "Match Started 🔒"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${hours}h ${minutes}m ${seconds}s`
  }

  // Save prediction immediately to DB
  const handlePrediction = async (match, predictionValue) => {
    const hasStarted = new Date(match.startTime) <= now
    const isLocked = Boolean(predictions[match.id])

    if (hasStarted || isLocked) return

    try {
      setSavingGameId(match.id)

      const res = await fetch('/api/predictions', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: match.id,
          prediction: predictionValue, // "homeWin" | "draw" | "awayWin"
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to save prediction')

      // Lock it locally immediately (so UI updates instantly)
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

  // Optional: show only upcoming/today later. For now: show all fetched.
  const visibleGames = useMemo(() => games, [games])
  const loading = loadingGames || loadingPreds

  return (
    <div className=' max-w-3xl mx-auto py-8 px-4'>
      <h1 className="text-2xl font-bold mb-6 text-center">Today's Predictions</h1>

      {loading && (
        <p className="text-center text-gray-500">Loading games...</p>
      )}

      {!loading && error && (
        <p className="text-center text-red-500">{error}</p>
      )}

      {!loading && !error && visibleGames.length === 0 && (
        <p className="text-center text-gray-500 mt-10">
          No games available yet. Please check back later.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {visibleGames.map((match) => {
          const hasStarted = new Date(match.startTime) <= now
          const userPrediction = predictions[match.id] // now stored from DB too
          const isLocked = Boolean(userPrediction)
          const isSavingThis = savingGameId === match.id

          return (
            <div key={match.id} className={` border rounded-xl p-4 shadow-md transition ${
              hasStarted
                ? "bg-gray-200 dark:bg-gray-800 opacity-60"
                : "bg-white dark:bg-black/70"
            }`}>
              {/* Match Info */}
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg">
                  {match.home} <span className="text-green-500">vs</span> {match.away}
                </h2>
                <span className={` text-xs font-medium ${hasStarted ? "text-gray-500" : isLocked ? "text-blue-500" : "text-green-500"}`}>
                  {hasStarted ? "Match Started 🔒" : isLocked ? "Prediction Locked ✅" : "Open ⏳"}
                </span>
              </div>

              {/* Live Countdown */}
              {!hasStarted && (
                <p className="text-xs text-gray-500 mb-3">
                  Starts in: <span className="font-semibold">{formatCountdown(match.startTime)}</span>
                </p>
              )}

              {/* Prediction Buttons */}
              <div className="flex justify-between gap-2">
                <button disabled={hasStarted || isLocked || isSavingThis} onClick={() => handlePrediction(match, "homeWin")}
                className={` flex-1 py-2 rounded-lg border transition text-sm font-medium ${userPrediction === "homeWin"
                  ? "bg-green-500 text-white border-green-500" : hasStarted || isLocked || isSavingThis ? "bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed"
                  : "bg-white dark:bg-gray-900 hover:bg-green-100 dark:hover:bg-green-900"
                }`}>
                  {isSavingThis ? "Saving..." : `${match.home} Win`}
                </button>

                <button disabled={hasStarted || isLocked || isSavingThis} onClick={() => handlePrediction(match, "draw")}
                className={` flex-1 py-2 rounded-lg border transition text-sm font-medium ${userPrediction === "Draw"
                  ? "bg-green-500 text-white border-green-500": hasStarted || isLocked || isSavingThis ? "bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed"
                  : "bg-white dark:bg-gray-900 hover:bg-green-100 dark:hover:bg-green-900"
                }`}>
                  Draw
                </button>

                <button disabled={hasStarted || isLocked || isSavingThis} onClick={() => handlePrediction(match, "awayWin")}
                className={` flex-1 py-2 rounded-lg border transition text-sm font-medium ${userPrediction === "awayWin"
                  ? "bg-green-500 text-white border-green-500": hasStarted || isLocked || isSavingThis ? "bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed"
                  : "bg-white dark:bg-gray-900 hover:bg-green-100 dark:hover:bg-green-900"
                }`}>
                  {match.away} Win
                </button>
              </div>

              {/* Show what user picked */}
              {isLocked && (
                <p className="mt-3 text-xs text-gray-500">
                  Your prediction:{" "}
                  <span className="font-semibold">
                    {userPrediction === "homeWin"
                      ? `${match.home} Win`
                      : userPrediction === "draw"
                      ? "Draw"
                      : `${match.away} Win`}
                  </span>
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* No "Submit All" now because each prediction saves immediately */}
      <div className="text-center mt-10">
        <p className="text-xs text-gray-500">
          Predictions are saved instantly. Once submitted, they cannot be changed.
        </p>
      </div>
    </div>
  )
}

export default page