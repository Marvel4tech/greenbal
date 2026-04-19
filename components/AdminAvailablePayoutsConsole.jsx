"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

function money(n) {
  return `£${Number(n || 0).toFixed(2)}`
}

function typeLabel(type) {
  if (type === "weekly_top5_reward") return "Weekly Reward"
  if (type === "referral_bonus") return "Referral Bonus"
  return type || "Transaction"
}

export default function AdminAvailablePayoutsConsole({ initialTxs = [] }) {
  const [txs, setTxs] = useState(initialTxs)
  const [busyUserId, setBusyUserId] = useState(null)

  const grouped = useMemo(() => {
    const map = new Map()

    for (const tx of txs) {
      if (!map.has(tx.user_id)) {
        map.set(tx.user_id, {
          user_id: tx.user_id,
          username: tx?.profiles?.username || null,
          total_amount_gbp: 0,
          txs: [],
        })
      }

      const row = map.get(tx.user_id)
      row.total_amount_gbp += Number(tx.amount_gbp || 0)
      row.txs.push(tx)
    }

    return Array.from(map.values()).sort(
      (a, b) => b.total_amount_gbp - a.total_amount_gbp
    )
  }, [txs])

  const onPayUser = async (userId, file) => {
    if (!file) {
      alert("Upload receipt first.")
      return
    }

    try {
      setBusyUserId(userId)

      const form = new FormData()
      form.append("userId", userId)
      form.append("receipt", file)

      const res = await fetch("/api/admin/payouts/pay-user", {
        method: "POST",
        body: form,
      })

      const json = await res.json()

      if (!res.ok) {
        alert(json?.error || "Failed to process payout")
        return
      }

      const paidIds = new Set((json?.paidTransactionIds || []).map(String))
      setTxs((prev) => prev.filter((tx) => !paidIds.has(String(tx.id))))
    } catch (error) {
      alert("Something went wrong while paying user")
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Available User Payouts
        </h2>
        <p className="text-sm text-gray-600 dark:text-white/60">
          Pay each user’s full available balance, including weekly rewards and referral bonuses.
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {grouped.map((group) => (
          <PayoutUserRow
            key={group.user_id}
            group={group}
            busy={busyUserId === group.user_id}
            onPayUser={onPayUser}
          />
        ))}

        {!grouped.length && (
          <div className="px-5 py-10 text-sm text-gray-500 dark:text-white/60">
            No available payouts right now.
          </div>
        )}
      </div>
    </div>
  )
}

function PayoutUserRow({ group, busy, onPayUser }) {
  const [file, setFile] = useState(null)
  const [open, setOpen] = useState(false)

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            <Link
              href={`/dashboard/users/${group.user_id}`}
              className="hover:underline text-blue-600 dark:text-blue-400"
            >
              {group.username ? `@${group.username}` : group.user_id}
            </Link>
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
            {group.txs.length} available transaction{group.txs.length > 1 ? "s" : ""}
          </p>

          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-3 text-sm text-primary font-medium"
          >
            {open ? "Hide breakdown" : "Show breakdown"}
          </button>
        </div>

        <div className="lg:col-span-2">
          <p className="text-xs text-gray-500 dark:text-white/50">
            Total available
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {money(group.total_amount_gbp)}
          </p>
        </div>

        <div className="lg:col-span-3">
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-xs text-gray-600 dark:text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-800 dark:file:bg-white/10 dark:file:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
            Upload one receipt for this full payout
          </p>
        </div>

        <div className="lg:col-span-3 flex items-start lg:justify-end">
          <button
            onClick={() => onPayUser(group.user_id, file)}
            disabled={busy}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {busy ? "Processing..." : `Pay ${money(group.total_amount_gbp)}`}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
          <div className="space-y-2">
            {group.txs.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm"
              >
                <div className="text-gray-700 dark:text-white/80">
                  {typeLabel(tx.type)}
                  {tx.week_start && tx.week_end
                    ? ` • ${tx.week_start} → ${tx.week_end}`
                    : ""}
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {money(tx.amount_gbp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}