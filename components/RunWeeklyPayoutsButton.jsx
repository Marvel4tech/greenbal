"use client"

import { useState } from "react"

export default function RunWeeklyPayoutsButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleRun = async () => {
    try {
      setLoading(true)
      setMessage("")
      setError("")

      const res = await fetch("/api/admin/weekly-payouts/run", {
        method: "POST",
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json?.error || "Failed to run weekly payouts")
        return
      }

      setMessage(
        `Done. Week ${json.weekStart} → ${json.weekEnd}. Winners: ${json.winnersCount}, Transactions: ${json.transactionsCount}`
      )

      window.location.reload()
    } catch (err) {
      setError("Something went wrong while running weekly payouts")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Weekly payout generation
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
            Create this week’s Top 5 winners and pending reward transactions.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? "Running..." : "Run Weekly Payouts"}
        </button>
      </div>

      {message ? (
        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-300">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  )
}