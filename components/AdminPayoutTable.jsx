"use client"

import { useMemo, useState } from "react"

function StatusPill({ status }) {
  const s = (status || "").toLowerCase()
  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border"

  const styles = {
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    available:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200",
    pending:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200",
    voided:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200",
    default:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80",
  }

  const dotStyles = {
    paid: "bg-emerald-500 dark:bg-emerald-300",
    available: "bg-blue-500 dark:bg-blue-300",
    pending: "bg-amber-500 dark:bg-amber-300",
    voided: "bg-rose-500 dark:bg-rose-300",
    default: "bg-gray-400 dark:bg-white/40",
  }

  return (
    <span className={`${base} ${styles[s] || styles.default}`}>
      <span className={`h-2 w-2 rounded-full ${dotStyles[s] || dotStyles.default}`} />
      {(status || "UNKNOWN").toUpperCase()}
    </span>
  )
}

function weekKey(tx) {
  return `${tx.week_start}→${tx.week_end}`
}

export default function AdminPayoutTable({ initialTxs }) {
  const [txs, setTxs] = useState(initialTxs)
  const [busyId, setBusyId] = useState(null)
  const [showPaid, setShowPaid] = useState(false)

  // Build unique week list (already sorted newest first by server query)
  const weekOptions = useMemo(() => {
    const map = new Map()
    for (const t of txs) {
      const key = weekKey(t)
      if (!map.has(key)) map.set(key, key)
    }
    return Array.from(map.values())
  }, [txs])

  // Default to latest week automatically
  const [selectedWeek, setSelectedWeek] = useState(() => weekOptions[0] || "all")

  const filteredTxs = useMemo(() => {
    let rows = txs

    // Default behavior: latest week only (unless "all")
    if (selectedWeek !== "all") {
      const [ws, we] = selectedWeek.split("→")
      rows = rows.filter((t) => t.week_start === ws && t.week_end === we)
    }

    // Hide paid by default (optional toggle)
    if (!showPaid) rows = rows.filter((t) => t.status !== "paid")

    return rows
  }, [txs, selectedWeek, showPaid])

  const onMarkPaid = async (txId, file) => {
    if (!file) return alert("Upload receipt first.")

    setBusyId(txId)

    const form = new FormData()
    form.append("txId", txId)
    form.append("receipt", file)

    const res = await fetch("/api/admin/mark-paid", {
      method: "POST",
      body: form,
    })

    const json = await res.json()
    setBusyId(null)

    if (!res.ok) return alert(json?.error || "Error marking paid")

    // Update the row instantly
    setTxs((prev) => prev.map((t) => (t.id === txId ? json.tx : t)))
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden shadow-sm dark:shadow-none">
      {/* Header */}
      <div className="flex flex-col gap-3 px-5 py-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Weekly Top 5 Payouts
            </h2>
            <p className="text-sm text-gray-600 dark:text-white/60">
              Latest week selected by default. Upload receipt, then mark paid.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-white/50">
                Week:
              </label>

              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-primary/60"
              >
                {/* Keep "All" as an option */}
                <option value="all">All weeks</option>
                {weekOptions.map((w) => (
                  <option key={w} value={w}>
                    {w.replace("→", " → ")}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/80">
              <input
                type="checkbox"
                checked={showPaid}
                onChange={(e) => setShowPaid(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Show paid
            </label>
          </div>
        </div>

        {/* Hint bar */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm text-gray-700 dark:text-white/80">
          Tip: Leave “Show paid” off to focus only on winners that still need payout.
        </div>
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 text-xs text-gray-500 dark:text-white/50 border-b border-gray-200 dark:border-white/10">
        <div className="col-span-4">Winner</div>
        <div className="col-span-3">Week</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-2">Receipt</div>
        <div className="col-span-1 text-right">Action</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {filteredTxs.map((tx) => (
          <AdminRow
            key={tx.id}
            tx={tx}
            busy={busyId === tx.id}
            onMarkPaid={onMarkPaid}
          />
        ))}

        {!filteredTxs.length && (
          <div className="px-5 py-10 text-sm text-gray-600 dark:text-white/60">
            No payouts to process for this view.
          </div>
        )}
      </div>
    </div>
  )
}

function AdminRow({ tx, busy, onMarkPaid }) {
  const [file, setFile] = useState(null)
  const username = tx?.profiles?.username

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:items-center">
        {/* Winner */}
        <div className="md:col-span-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {username ? `@${username}` : tx.user_id}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusPill status={tx.status} />
            <span className="text-xs text-gray-500 dark:text-white/50">
              {tx.paid_at
                ? `Paid: ${new Date(tx.paid_at).toLocaleString()}`
                : `Created: ${new Date(tx.created_at).toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Week */}
        <div className="md:col-span-3 text-sm text-gray-700 dark:text-white/80">
          {tx.week_start} → {tx.week_end}
        </div>

        {/* Amount */}
        <div className="md:col-span-2 text-sm font-semibold text-gray-900 dark:text-white">
          £{Number(tx.amount_gbp).toFixed(2)}
        </div>

        {/* Receipt Upload */}
        <div className="md:col-span-2">
          <input
            type="file"
            accept="application/pdf,image/*"
            className="block w-full text-xs text-gray-600 dark:text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-800 dark:file:bg-white/10 dark:file:text-white"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={tx.status === "paid"}
          />
          {tx.status === "paid" ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
              Receipt saved.
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
              Upload proof (PDF/image)
            </p>
          )}
        </div>

        {/* Action */}
        <div className="md:col-span-1 flex md:justify-end">
          <button
            onClick={() => onMarkPaid(tx.id, file)}
            disabled={busy || tx.status === "paid"}
            className="w-full md:w-auto rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50 transition"
          >
            {tx.status === "paid" ? "Paid" : busy ? "Saving..." : "Mark Paid"}
          </button>
        </div>
      </div>
    </div>
  )
}