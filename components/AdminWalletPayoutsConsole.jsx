"use client"

import { useMemo, useState } from "react"

function money(n) {
  return `£${Number(n || 0).toFixed(2)}`
}

function typeLabel(type) {
  if (type === "weekly_top5_reward") return "Weekly Reward"
  if (type === "referral_bonus") return "Referral Bonus"
  return type || "Transaction"
}

function BatchReceiptLink({ receiptPath }) {
  if (!receiptPath) return null

  const baseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || ""

  const href = `${baseUrl}/storage/v1/object/public/receipts/${receiptPath}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20 transition"
    >
      View receipt
    </a>
  )
}

export default function AdminWalletPayoutsConsole({
  pendingTxs = [],
  availableTxs = [],
  payoutBatches = [],
  weekOptions = [],
}) {
  const [statusFilter, setStatusFilter] = useState("pending")
  const [weekFilter, setWeekFilter] = useState("all")

  const filteredPending = useMemo(() => {
    return pendingTxs.filter((tx) => {
      if (weekFilter !== "all" && tx.week_start !== weekFilter) return false
      return true
    })
  }, [pendingTxs, weekFilter])

  const filteredAvailable = useMemo(() => {
    return availableTxs.filter((tx) => {
      if (weekFilter !== "all" && tx.week_start && tx.week_start !== weekFilter) {
        return false
      }
      return true
    })
  }, [availableTxs, weekFilter])

  const filteredBatches = useMemo(() => {
    return payoutBatches.filter((batch) => {
      if (weekFilter === "all") return true

      const hasMatchingWeek = (batch.txs || []).some(
        (tx) => tx.week_start === weekFilter
      )

      return hasMatchingWeek
    })
  }, [payoutBatches, weekFilter])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-gray-500 dark:text-white/50">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
            >
              <option value="pending">Pending approval</option>
              <option value="available">Available payouts</option>
              <option value="paid">Paid history</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-white/50">
              Week
            </label>
            <select
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
            >
              <option value="all">All weeks</option>
              {weekOptions.map((week) => (
                <option key={week} value={week}>
                  {week}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {statusFilter === "pending" ? (
        <GroupedTable
          title="Pending Weekly Reward Approvals"
          description="Approve weekly top 5 rewards before they become available for payout."
          initialTxs={filteredPending}
          mode="approve"
        />
      ) : null}

      {statusFilter === "available" ? (
        <GroupedTable
          title="Available User Payouts"
          description="Pay users from their available wallet balance."
          initialTxs={filteredAvailable}
          mode="pay"
        />
      ) : null}

      {statusFilter === "paid" ? (
        <PaidHistoryTable payoutBatches={filteredBatches} />
      ) : null}
    </div>
  )
}

function GroupedTable({ title, description, initialTxs, mode }) {
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
          tx_count: 0,
          txs: [],
        })
      }

      const row = map.get(tx.user_id)
      row.total_amount_gbp += Number(tx.amount_gbp || 0)
      row.tx_count += 1
      row.txs.push(tx)
    }

    return Array.from(map.values()).sort(
      (a, b) => b.total_amount_gbp - a.total_amount_gbp
    )
  }, [txs])

  const onApproveUser = async (userId) => {
    setBusyUserId(userId)

    try {
      const res = await fetch("/api/admin/payouts/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      const json = await res.json()

      if (!res.ok) {
        alert(json?.error || "Failed to approve rewards")
        return
      }

      const approvedIds = new Set((json?.approvedTransactionIds || []).map(String))
      setTxs((prev) => prev.filter((tx) => !approvedIds.has(String(tx.id))))
    } finally {
      setBusyUserId(null)
    }
  }

  const onPayUser = async (userId, file) => {
    if (!file) {
      alert("Upload receipt first.")
      return
    }

    setBusyUserId(userId)

    try {
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
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10">
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-600 dark:text-white/60">{description}</p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {grouped.map((group) => (
          <PayoutUserRow
            key={group.user_id}
            group={group}
            busy={busyUserId === group.user_id}
            mode={mode}
            onApproveUser={onApproveUser}
            onPayUser={onPayUser}
          />
        ))}

        {!grouped.length && (
          <div className="px-5 py-10 text-sm text-gray-500 dark:text-white/60">
            No records in this section right now.
          </div>
        )}
      </div>
    </div>
  )
}

function PayoutUserRow({ group, busy, mode, onApproveUser, onPayUser }) {
  const [file, setFile] = useState(null)
  const [open, setOpen] = useState(false)

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {group.username ? `@${group.username}` : group.user_id}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
            {group.tx_count} transaction{group.tx_count > 1 ? "s" : ""}
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
            {mode === "approve" ? "Pending total" : "Available total"}
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {money(group.total_amount_gbp)}
          </p>
        </div>

        {mode === "pay" ? (
          <>
            <div className="lg:col-span-3">
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-gray-600 dark:text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-800 dark:file:bg-white/10 dark:file:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                Upload payout proof
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
          </>
        ) : (
          <div className="lg:col-span-6 flex items-start lg:justify-end">
            <button
              onClick={() => onApproveUser(group.user_id)}
              disabled={busy}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? "Approving..." : `Approve ${money(group.total_amount_gbp)}`}
            </button>
          </div>
        )}
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
                  {tx.week_start && tx.week_end ? ` • ${tx.week_start} → ${tx.week_end}` : ""}
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

function PaidHistoryTable({ payoutBatches = [] }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Paid Payout History
        </h2>
        <p className="text-sm text-gray-600 dark:text-white/60">
          Review previously paid wallet batches and view payment proof.
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {payoutBatches.map((batch) => (
          <div
            key={batch.id}
            className="px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {batch?.profiles?.username ? `@${batch.profiles.username}` : batch.user_id}
              </p>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {(batch.txs || []).map((tx) => (
                  <span
                    key={tx.id}
                    className="rounded-full border border-gray-200 dark:border-white/10 px-3 py-1 text-gray-600 dark:text-white/70"
                  >
                    {typeLabel(tx.type)}
                    {tx.week_start ? ` • ${tx.week_start}` : ""}
                  </span>
                ))}
              </div>

              <p className="mt-2 text-xs text-gray-500 dark:text-white/50">
                Paid: {batch.paid_at ? new Date(batch.paid_at).toLocaleString() : "—"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900 dark:text-white">
                {money(batch.total_amount_gbp)}
              </span>

              <BatchReceiptLink receiptPath={batch.receipt_path} />
            </div>
          </div>
        ))}

        {!payoutBatches.length && (
          <div className="px-5 py-10 text-sm text-gray-500 dark:text-white/60">
            No paid payout history found for this filter.
          </div>
        )}
      </div>
    </div>
  )
}