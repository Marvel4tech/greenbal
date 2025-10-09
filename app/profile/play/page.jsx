'use client'

import React, { useEffect, useState } from 'react'

const mockMatches = [
  {
    id: 1,
    home: "Arsenal",
    away: "Man City",
    startTime: "2025-10-07T18:00:00Z",
  },
  {
    id: 2,
    home: "Liverpool",
    away: "Chelsea",
    startTime: "2025-10-07T20:00:00Z",
  },
  {
    id: 3,
    home: "Barcelona",
    away: "Real Madrid",
    startTime: "2025-10-08T21:00:00Z",
  },
]

const page = () => {
  const [predictions, setPredictions] = useState({})
  const [now, setNow] = useState(new Date())

  // Update current time every second (for live countdowns)
  useEffect(() => {
    const interval = setInterval(() => setNow(
      new Date()
    ), 1000)
    return () => clearInterval(interval)
  }, []);

  const handlePrediction = (matchId, result) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: result,
    }))
  }

  // Helper function: format countdown text
  const formatCountdown = (startTime) => {
    const diff = new Date(startTime) - now
    if (diff <= 0) return "Match Started 🔒"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${hours}h ${minutes}m ${seconds}s`
  }

  return (
    <div className=' max-w-3xl mx-auto py-8 px-4'>
      <h1 className="text-2xl font-bold mb-6 text-center">Today's Predictions</h1>

      <div className="flex flex-col gap-6">
        {mockMatches.map((match) => {
          const hasStarted = new Date(match.startTime) <= now
          const userPrediction = predictions[match.id]
          const isLocked = Boolean(userPrediction)

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
                <button disabled={hasStarted || isLocked} onClick={() => handlePrediction(match.id, `${match.home} Win`)}
                className={` flex-1 py-2 rounded-lg border transition text-sm font-medium ${userPrediction === `${match.home} Win`
                  ? "bg-green-500 text-white border-green-500" : hasStarted || isLocked ? "bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed"
                  : "bg-white dark:bg-gray-900 hover:bg-green-100 dark:hover:bg-green-900"
                }`}>
                  {match.home} Win
                </button>

                <button disabled={hasStarted || isLocked} onClick={() => handlePrediction(match.id, "Draw")}
                className={` flex-1 py-2 rounded-lg border transition text-sm font-medium ${userPrediction === "Draw"
                  ? "bg-green-500 text-white border-green-500": hasStarted || isLocked ? "bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed"
                  : "bg-white dark:bg-gray-900 hover:bg-green-100 dark:hover:bg-green-900"
                }`}>
                  Draw
                </button>

                <button disabled={hasStarted || isLocked} onClick={() => handlePrediction(match.id, `${match.away} Win`)}
                className={` flex-1 py-2 rounded-lg border transition text-sm font-medium ${userPrediction === `${match.away} Win`
                  ? "bg-green-500 text-white border-green-500": hasStarted || isLocked ? "bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed"
                  : "bg-white dark:bg-gray-900 hover:bg-green-100 dark:hover:bg-green-900"
                }`}>
                  {match.away} Win
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Submit Button */}
      <div className="text-center mt-10">
        <button className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 transition">
          Submit All Predictions
        </button>
      </div>
    </div>
  )
}

export default page