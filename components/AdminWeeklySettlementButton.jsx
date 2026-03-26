"use client"

import { useState } from "react"

export default function AdminWeeklySettlementButton() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  const onRun = async () => {
    setBusy(true)
    setMessage("")

    try {
      const res = await fetch("/api/admin/weekly-settlement/run", {
        method: "POST",
      })

      const json = await res.json()

      if (!res.ok) {
        setMessage(json?.error || "Failed to run settlement")
        return
      }

      if (json.alreadySettled) {
        setMessage(`Week ${json.weekStart} was already settled.`)
      } else {
        setMessage(
          `Settlement complete for ${json.weekStart} → ${json.weekEnd}. Winners created: ${json.winnersCreated}.`
        )
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white">
        Weekly Reward Settlement
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
        This manually settles the last completed week and creates Top 5 reward wallet transactions if they do not already exist.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={onRun}
          disabled={busy}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {busy ? "Running..." : "Run Weekly Settlement"}
        </button>
      </div>

      {message ? (
        <p className="mt-3 text-sm text-gray-700 dark:text-white/70">
          {message}
        </p>
      ) : null}
    </div>
  )
}