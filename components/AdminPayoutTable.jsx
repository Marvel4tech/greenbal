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

  const label =
    s === "paid"
      ? "PAID"
      : s === "available"
      ? "AVAILABLE"
      : s === "pending"
      ? "PENDING"
      : s === "voided"
      ? "VOIDED"
      : (status || "UNKNOWN").toUpperCase()

  return (
    <span className={`${base} ${styles[s] || styles.default}`}>
      <span className={`h-2 w-2 rounded-full ${dotStyles[s] || dotStyles.default}`} />
      {label}
    </span>
  )
}

function weekKey(tx) {
  return `${tx.week_start}→${tx.week_end}`
}

export default function AdminPayoutTable({ initialTxs }) {
  const [txs, setTxs] = useState(initialTxs || [])
  const [busyId, setBusyId] = useState(null)
  const [showResolved, setShowResolved] = useState(false)

  const weekOptions = useMemo(() => {
    const map = new Map()
    for (const t of txs) {
      const key = weekKey(t)
      if (!map.has(key)) map.set(key, key)
    }
    return Array.from(map.values())
  }, [txs])

  const [selectedWeek, setSelectedWeek] = useState(() => weekOptions[0] || "all")

  const filteredTxs = useMemo(() => {
    let rows = txs

    if (selectedWeek !== "all") {
      const [ws, we] = selectedWeek.split("→")
      rows = rows.filter((t) => t.week_start === ws && t.week_end === we)
    }

    if (!showResolved) {
      rows = rows.filter((t) => t.status === "pending")
    }

    return rows
  }, [txs, selectedWeek, showResolved])

  const replaceTx = (updatedTx) => {
    setTxs((prev) =>
      prev.map((t) =>
        t.id === updatedTx.id
          ? {
              ...t,
              ...updatedTx,
              profiles: t.profiles,
            }
          : t
      )
    )
  }

  const onApprove = async (txId) => {
    try {
      setBusyId(txId)

      const res = await fetch(`/api/admin/payouts/${txId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      const json = await res.json()

      if (!res.ok) {
        alert(json?.error || "Failed to approve reward")
        return
      }

      replaceTx(json.tx)
    } catch {
      alert("Something went wrong while approving reward")
    } finally {
      setBusyId(null)
    }
  }

  const onVoid = async (txId) => {
    const note = window.prompt("Enter reason for voiding this reward:")
    if (!note?.trim()) return

    try {
      setBusyId(txId)

      const res = await fetch(`/api/admin/payouts/${txId}/void`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: note.trim() }),
      })

      const json = await res.json()

      if (!res.ok) {
        alert(json?.error || "Failed to void reward")
        return
      }

      replaceTx(json.tx)
    } catch {
      alert("Something went wrong while voiding reward")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden shadow-sm dark:shadow-none">
      <div className="flex flex-col gap-3 px-5 py-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Weekly Reward Approvals
            </h2>
            <p className="text-sm text-gray-600 dark:text-white/60">
              Approve or void pending weekly rewards. Payment is handled below in the grouped available payouts section.
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
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Show approved/paid/voided
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm text-gray-700 dark:text-white/80">
          Only pending weekly rewards are actionable here. Once approved, they move into the available payouts section below and can be paid together with referral bonuses.
        </div>
      </div>

      <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 text-xs text-gray-500 dark:text-white/50 border-b border-gray-200 dark:border-white/10">
        <div className="col-span-4">Winner</div>
        <div className="col-span-3">Week</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {filteredTxs.map((tx) => (
          <AdminRow
            key={tx.id}
            tx={tx}
            busy={busyId === tx.id}
            onApprove={onApprove}
            onVoid={onVoid}
          />
        ))}

        {!filteredTxs.length && (
          <div className="px-5 py-10 text-sm text-gray-600 dark:text-white/60">
            No weekly rewards to process for this view.
          </div>
        )}
      </div>
    </div>
  )
}

function AdminRow({ tx, busy, onApprove, onVoid }) {
  const username = tx?.profiles?.username

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:items-center">
        <div className="md:col-span-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {username ? `@${username}` : tx.user_id}
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
            {tx.paid_at
              ? `Paid: ${new Date(tx.paid_at).toLocaleString("en-GB")}`
              : `Created: ${new Date(tx.created_at).toLocaleString("en-GB")}`}
          </p>
        </div>

        <div className="md:col-span-3 text-sm text-gray-700 dark:text-white/80">
          {tx.week_start} → {tx.week_end}
        </div>

        <div className="md:col-span-2 text-sm font-semibold text-gray-900 dark:text-white">
          £{Number(tx.amount_gbp).toFixed(2)}
        </div>

        <div className="md:col-span-2">
          <StatusPill status={tx.status} />
        </div>

        <div className="md:col-span-1 flex flex-wrap gap-2 md:justify-end">
          {tx.status === "pending" && (
            <>
              <button
                onClick={() => onApprove(tx.id)}
                disabled={busy}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
              >
                {busy ? "Saving..." : "Approve"}
              </button>

              <button
                onClick={() => onVoid(tx.id)}
                disabled={busy}
                className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition dark:border-rose-400/20 dark:text-rose-300 dark:hover:bg-rose-500/10"
              >
                Void
              </button>
            </>
          )}

          {tx.status === "available" && (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
              Ready in payout section
            </span>
          )}

          {tx.status === "paid" && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
              Paid
            </span>
          )}

          {tx.status === "voided" && (
            <span className="text-xs font-medium text-rose-600 dark:text-rose-300">
              Voided
            </span>
          )}
        </div>
      </div>
    </div>
  )
}